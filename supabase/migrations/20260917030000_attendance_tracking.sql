-- Feature 6 gap-close: attendance tracking for the Teacher Command Center.
create table public.attendance (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  date date not null,
  present boolean not null default true,
  marked_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  unique (class_id, student_id, date)
);
alter table public.attendance enable row level security;

create policy attendance_select on public.attendance
  for select to authenticated
  using (is_teacher_of_class(class_id) or is_admin());

create policy attendance_insert on public.attendance
  for insert to authenticated
  with check (is_teacher_of_class(class_id) or is_admin());

create policy attendance_update on public.attendance
  for update to authenticated
  using (is_teacher_of_class(class_id) or is_admin());
