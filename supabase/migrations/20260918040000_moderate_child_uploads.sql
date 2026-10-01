-- Checks on what children put on their own profile.
--
-- Until now a child's profile picture, bio, favourite verse and favourite
-- quote went straight from their phone to the screen with nothing in between.
-- The picture is seen by their whole class; the text sits under their name on
-- the leaderboard. Nobody looked at either.
--
-- Two different problems, so two different answers:
--
--   Text is screened outright, here in the database, at the moment it is
--   written. A child gets told immediately what to take out, and no adult has
--   to be involved. What it looks for is contact details (an email, a phone
--   number, a social app, a web address) and a short list of abusive words -
--   the things that should never be on a public profile in a children's app.
--
--   A picture cannot be judged by a regular expression, so it goes into a
--   queue instead. The child sees their own new picture straight away, marked
--   as waiting; everybody else keeps seeing the last approved one until their
--   teacher has looked.
--
-- What is deliberately NOT screened: Ears for You messages, and a child's
-- private conversation with their own teacher. Those are the two places a
-- child says something is wrong, and the words they would need are exactly
-- the ones a filter throws away. Screening them would break the one part of
-- this app that matters most.

-- ---------------------------------------------------------------------------
-- the moderation queue for pictures
-- ---------------------------------------------------------------------------

alter table public.profiles add column if not exists pending_avatar_url text;
alter table public.profiles add column if not exists avatar_status text not null default 'none';
alter table public.profiles add column if not exists avatar_reviewed_by uuid references public.profiles(id) on delete set null;
alter table public.profiles add column if not exists avatar_reviewed_at timestamptz;

do $$
begin
  alter table public.profiles add constraint profiles_avatar_status_check
    check (avatar_status in ('none', 'pending', 'approved', 'rejected'));
exception
  when duplicate_object then null;
end;
$$;

-- Every picture a child already has was uploaded before any of this existed,
-- so none of them has been looked at. They all go into the queue - but they
-- stay visible while they sit there. A gap in the system is not a child's
-- fault, and taking their picture away to fix it would feel like a telling
-- off for something they did not do.
update public.profiles p
set pending_avatar_url = p.avatar_url,
    avatar_status = 'pending'
where p.role = 'student'
  and p.avatar_url is not null
  and p.avatar_status = 'none';

-- ---------------------------------------------------------------------------
-- screening text
-- ---------------------------------------------------------------------------

-- Returns null when the text is fine, or a short phrase naming what has to
-- come out, written so it can be dropped straight into a sentence a child
-- reads: "Please take <reason> out of your bio."
create or replace function public.screen_child_text(p_text text)
returns text
language plpgsql
immutable
set search_path to 'public'
as $$
declare
  v text := lower(coalesce(p_text, ''));
begin
  if btrim(v) = '' then
    return null;
  end if;

  if v ~ '[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}' then
    return 'your email address';
  end if;

  if v ~ '(https?://|www\.|\.com|\.net|\.org|\.co\.uk)' then
    return 'a web address';
  end if;

  if v ~ '(whatsapp|snapchat|instagram|tiktok|telegram|facebook|discord|@[a-z0-9_]{3,})' then
    return 'a username or the name of a chat app';
  end if;

  -- Seven or more digits in a row, however they are spaced out. A verse
  -- reference like "John 3:16" does not match: the colon breaks the run.
  if v ~ '([0-9][ .-]?){7,}' then
    return 'what looks like a phone number';
  end if;

  if v ~ '\m(fuck|fucking|shit|bitch|bastard|asshole|arsehole|pussy|cunt|nigger|nigga|faggot|whore|slut|wanker|retard)\M' then
    return 'a word that is not allowed here';
  end if;

  return null;
end;
$$;

-- ---------------------------------------------------------------------------
-- the one write path a child has, now with both checks in it
-- ---------------------------------------------------------------------------

create or replace function public.update_my_student_profile(
  p_bio text default null,
  p_favorite_verse text default null,
  p_favorite_quote text default null,
  p_avatar_url text default null,
  p_full_name text default null
)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_reason text;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  -- Checked before anything is written, so a profile never ends up half
  -- saved with the rejected field left behind.
  v_reason := screen_child_text(p_bio);
  if v_reason is not null then
    raise exception 'Please take % out of your About Me.', v_reason using errcode = '23514';
  end if;

  v_reason := screen_child_text(p_favorite_verse);
  if v_reason is not null then
    raise exception 'Please take % out of your favourite verse.', v_reason using errcode = '23514';
  end if;

  v_reason := screen_child_text(p_favorite_quote);
  if v_reason is not null then
    raise exception 'Please take % out of your favourite quote.', v_reason using errcode = '23514';
  end if;

  v_reason := screen_child_text(p_full_name);
  if v_reason is not null then
    raise exception 'Please take % out of your name.', v_reason using errcode = '23514';
  end if;

  update public.students set
    bio = coalesce(p_bio, bio),
    favorite_verse = coalesce(p_favorite_verse, favorite_verse),
    favorite_quote = coalesce(p_favorite_quote, favorite_quote)
  where id = auth.uid();

  if p_full_name is not null then
    update public.profiles set full_name = p_full_name where id = auth.uid();
  end if;

  -- The picture does NOT go to avatar_url. It waits in pending_avatar_url
  -- until a teacher has looked at it. This is why the queue cannot be
  -- side-stepped: this function is the only write path a student has to
  -- their own profile row, and it never touches avatar_url.
  if p_avatar_url is not null then
    update public.profiles set
      pending_avatar_url = p_avatar_url,
      avatar_status = 'pending',
      avatar_reviewed_by = null,
      avatar_reviewed_at = null
    where id = auth.uid();
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- a teacher looking at the queue
-- ---------------------------------------------------------------------------

create or replace function public.list_pending_avatars()
returns table (
  student_id uuid,
  full_name text,
  class_id uuid,
  class_name text,
  pending_avatar_url text,
  current_avatar_url text
)
language sql
stable
security definer
set search_path to 'public'
as $$
  select p.id, p.full_name, s.class_id, c.name, p.pending_avatar_url, p.avatar_url
  from profiles p
  join students s on s.id = p.id
  left join classes c on c.id = s.class_id
  where p.avatar_status = 'pending'
    and p.pending_avatar_url is not null
    and (is_admin() or (s.class_id is not null and is_teacher_of_class(s.class_id)))
  order by p.full_name;
$$;

create or replace function public.review_child_avatar(p_student uuid, p_approve boolean)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_class uuid;
begin
  select s.class_id into v_class from students s where s.id = p_student;
  if not found then
    raise exception 'That child was not found.';
  end if;

  if not (is_admin() or (v_class is not null and is_teacher_of_class(v_class))) then
    raise exception 'Only that child''s teacher or an admin can review this picture.';
  end if;

  if p_approve then
    update profiles set
      avatar_url = pending_avatar_url,
      pending_avatar_url = null,
      avatar_status = 'approved',
      avatar_reviewed_by = auth.uid(),
      avatar_reviewed_at = now()
    where id = p_student;
  else
    -- Rejecting clears the pending picture and leaves whatever was approved
    -- before in place, so a child is never left with no picture at all
    -- because of one bad upload.
    update profiles set
      pending_avatar_url = null,
      avatar_status = 'rejected',
      avatar_reviewed_by = auth.uid(),
      avatar_reviewed_at = now()
    where id = p_student;
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- telling the teacher there is something to look at
-- ---------------------------------------------------------------------------

create or replace function public.on_avatar_pending()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_teacher uuid;
begin
  if new.avatar_status = 'pending' and coalesce(old.avatar_status, '') <> 'pending' then
    select c.teacher_id into v_teacher
    from students s join classes c on c.id = s.class_id
    where s.id = new.id;

    perform notify_user(
      v_teacher,
      'avatar_pending',
      'A new profile picture to look at',
      coalesce(split_part(new.full_name, ' ', 1), 'A child') || ' has uploaded a picture. It is not visible to the class yet.',
      '/teacher',
      'normal'
    );
  end if;
  return new;
end;
$$;

drop trigger if exists avatar_pending_notify on public.profiles;
create trigger avatar_pending_notify
  after update on public.profiles
  for each row execute function public.on_avatar_pending();
