-- Notifications.
--
-- Until now nothing in this app told anyone that anything had happened. The
-- one that mattered was Ears for You: a child writes to a trusted adult that
-- something is wrong, and whether an adult ever saw it depended entirely on a
-- teacher happening to open the right tab. Everything else here is a
-- convenience; that one is closer to a safeguarding gap.
--
-- Rows are written only by the triggers below, all of them SECURITY DEFINER.
-- A signed-in user can read and mark read their own rows and nothing else.

create table if not exists public.notifications (
  id           uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  kind         text not null,
  title        text not null,
  body         text,
  -- An in-app hash route, e.g. "/teacher". The portals read this to decide
  -- which tab to open when the notification is tapped.
  link         text,
  -- 'urgent' is reserved for the safeguarding path. It is what makes the bell
  -- go red rather than just showing a count.
  severity     text not null default 'normal' check (severity in ('normal', 'urgent')),
  read_at      timestamptz,
  created_at   timestamptz not null default now()
);

create index if not exists notifications_recipient_idx
  on public.notifications (recipient_id, read_at, created_at desc);

alter table public.notifications enable row level security;

drop policy if exists "read own notifications" on public.notifications;
create policy "read own notifications" on public.notifications
  for select using (recipient_id = auth.uid());

drop policy if exists "mark own notifications read" on public.notifications;
create policy "mark own notifications read" on public.notifications
  for update using (recipient_id = auth.uid()) with check (recipient_id = auth.uid());

-- No insert or delete policy on purpose. Rows arrive from the triggers below
-- and nowhere else, so nobody can post a notification to anybody.

-- ---------------------------------------------------------------------------
-- helpers
-- ---------------------------------------------------------------------------

create or replace function public.notify_user(
  p_recipient uuid,
  p_kind text,
  p_title text,
  p_body text default null,
  p_link text default null,
  p_severity text default 'normal'
) returns void
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if p_recipient is null then
    return;
  end if;
  insert into notifications (recipient_id, kind, title, body, link, severity)
  values (p_recipient, p_kind, p_title, p_body, p_link, p_severity);
end;
$$;

revoke execute on function public.notify_user(uuid, text, text, text, text, text) from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Ears for You: the one this was built for
-- ---------------------------------------------------------------------------

create or replace function public.on_ears_message_created()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_teacher uuid;
  v_class   text;
begin
  select c.teacher_id, c.name into v_teacher, v_class
  from classes c where c.id = new.class_id;

  -- Deliberately says nothing about who wrote it or what it says. A child can
  -- send anonymously, and a notification that leaked the name would quietly
  -- undo that promise on the lock screen.
  perform notify_user(
    coalesce(new.assigned_to, v_teacher),
    'ears_new',
    'A child needs you',
    'Someone in ' || coalesce(v_class, 'your class') || ' has sent an Ears for You message.',
    '/teacher',
    'urgent'
  );
  return new;
end;
$$;

drop trigger if exists ears_message_notify on public.ears_messages;
create trigger ears_message_notify
  after insert on public.ears_messages
  for each row execute function public.on_ears_message_created();

create or replace function public.on_ears_reply_created()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_student uuid;
begin
  select m.student_id into v_student from ears_messages m where m.id = new.message_id;

  -- Only when an adult replies. A child replying to their own thread should
  -- not notify themselves.
  if v_student is not null and v_student <> new.author_id then
    perform notify_user(
      v_student,
      'ears_reply',
      'Someone wrote back',
      'You have a reply to the message you sent.',
      '/student',
      'normal'
    );
  end if;
  return new;
end;
$$;

drop trigger if exists ears_reply_notify on public.ears_message_replies;
create trigger ears_reply_notify
  after insert on public.ears_message_replies
  for each row execute function public.on_ears_reply_created();

-- An escalated message goes to every admin, not just the class teacher. This
-- is the path for when a teacher decides something is beyond them.
create or replace function public.on_ears_escalated()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_admin uuid;
begin
  if new.status = 'escalated' and coalesce(old.status, '') <> 'escalated' then
    for v_admin in select id from profiles where role = 'admin' loop
      perform notify_user(
        v_admin,
        'ears_escalated',
        'An Ears for You message was escalated',
        'A teacher has passed a message up for you to look at.',
        '/admin',
        'urgent'
      );
    end loop;
  end if;
  return new;
end;
$$;

drop trigger if exists ears_escalated_notify on public.ears_messages;
create trigger ears_escalated_notify
  after update on public.ears_messages
  for each row execute function public.on_ears_escalated();

-- ---------------------------------------------------------------------------
-- ordinary class life
-- ---------------------------------------------------------------------------

create or replace function public.on_message_created()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_teacher uuid;
  v_student uuid;
  v_to      uuid;
  v_name    text;
begin
  select c.teacher_id, c.student_id into v_teacher, v_student
  from conversations c where c.id = new.conversation_id;

  v_to := case when new.sender_id = v_teacher then v_student else v_teacher end;
  if v_to is null or v_to = new.sender_id then
    return new;
  end if;

  select p.full_name into v_name from profiles p where p.id = new.sender_id;

  perform notify_user(
    v_to,
    'message',
    coalesce(v_name, 'Someone') || ' sent you a message',
    left(new.body, 120),
    case when v_to = v_student then '/student' else '/teacher' end,
    'normal'
  );
  return new;
end;
$$;

drop trigger if exists message_notify on public.messages;
create trigger message_notify
  after insert on public.messages
  for each row execute function public.on_message_created();

create or replace function public.on_assignment_created()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_student uuid;
begin
  if coalesce(new.status, 'published') <> 'published' then
    return new;
  end if;
  for v_student in select s.id from students s where s.class_id = new.class_id loop
    perform notify_user(
      v_student,
      'assignment_new',
      'New class work',
      new.title,
      '/student',
      'normal'
    );
  end loop;
  return new;
end;
$$;

drop trigger if exists assignment_notify on public.assignments;
create trigger assignment_notify
  after insert on public.assignments
  for each row execute function public.on_assignment_created();

create or replace function public.on_submission_graded()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_title text;
begin
  if new.grade is not null and old.grade is distinct from new.grade then
    select a.title into v_title from assignments a where a.id = new.assignment_id;
    perform notify_user(
      new.student_id,
      'assignment_graded',
      'Your work has been marked',
      coalesce(v_title, 'Your class work'),
      '/student',
      'normal'
    );
  end if;
  return new;
end;
$$;

drop trigger if exists submission_graded_notify on public.assignment_submissions;
create trigger submission_graded_notify
  after update on public.assignment_submissions
  for each row execute function public.on_submission_graded();

-- ---------------------------------------------------------------------------
-- parents
-- ---------------------------------------------------------------------------

create or replace function public.on_journey_lesson_done()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_parent uuid;
  v_name   text;
begin
  select p.full_name into v_name from profiles p where p.id = new.student_id;
  for v_parent in select pl.parent_id from parent_links pl where pl.student_id = new.student_id loop
    perform notify_user(
      v_parent,
      'lesson_done',
      coalesce(split_part(v_name, ' ', 1), 'Your child') || ' finished a lesson',
      'Another step through the Bible Journey.',
      '/parent',
      'normal'
    );
  end loop;
  return new;
end;
$$;

drop trigger if exists journey_lesson_notify on public.journey_progress;
create trigger journey_lesson_notify
  after insert on public.journey_progress
  for each row execute function public.on_journey_lesson_done();

-- ---------------------------------------------------------------------------
-- reading them
-- ---------------------------------------------------------------------------

create or replace function public.unread_notification_count()
returns integer
language sql
stable
security definer
set search_path to 'public'
as $$
  select count(*)::int from notifications
  where recipient_id = auth.uid() and read_at is null;
$$;

create or replace function public.mark_all_notifications_read()
returns void
language sql
security definer
set search_path to 'public'
as $$
  update notifications set read_at = now()
  where recipient_id = auth.uid() and read_at is null;
$$;
