-- Feature 25: AI Bible Companion ("Bible Buddy"). Every Q&A is logged for
-- safeguarding review, with the same anonymous-identity masking already
-- fixed for Ears for You: a teacher/admin never gets the real student_id
-- for an anonymous question through any path, base table or view.

create table public.ai_companion_messages (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  class_id uuid references public.classes(id) on delete set null,
  question text not null,
  answer text not null,
  is_anonymous boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.ai_companion_messages enable row level security;

create policy ai_companion_select_own on public.ai_companion_messages
  for select to authenticated
  using (student_id = auth.uid());

create policy ai_companion_select_teacher on public.ai_companion_messages
  for select to authenticated
  using ((is_teacher_of_class(class_id) or is_admin()) and is_anonymous = false);

create view public.ai_companion_teacher_log as
select
  m.id,
  m.class_id,
  m.question,
  m.answer,
  m.is_anonymous,
  m.created_at,
  case when m.is_anonymous then null::uuid else m.student_id end as student_id,
  case when m.is_anonymous then null::text else p.full_name end as student_name
from ai_companion_messages m
left join profiles p on p.id = m.student_id
where is_teacher_of_class(m.class_id) or is_admin();
