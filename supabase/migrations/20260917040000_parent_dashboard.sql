-- Feature 7+8: Parent Dashboard. Parents sign up on their own (normal
-- email/password, no admin approval needed) and link to their child with a
-- short code the child already has on their profile - no unclaimed parent
-- account is ever created before a parent has actually agreed to anything.

alter table public.profiles drop constraint profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role = any (array['admin', 'teacher', 'student', 'parent']));

alter table public.students add column parent_link_code text unique;

-- Only ever sets role when it's still unset, so an existing student/
-- teacher/admin account can't relabel itself into a parent.
create or replace function public.claim_parent_role()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update profiles set role = 'parent' where id = auth.uid() and role is null;
end;
$$;

create or replace function public.get_or_create_parent_link_code()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
  v_attempt int := 0;
begin
  if not exists (select 1 from students where id = auth.uid()) then
    raise exception 'Only a student can have a parent link code.';
  end if;

  select parent_link_code into v_code from students where id = auth.uid();
  if v_code is not null then
    return v_code;
  end if;

  loop
    v_attempt := v_attempt + 1;
    v_code := 'FAM' || lpad((floor(random() * 10000))::int::text, 4, '0');
    begin
      update students set parent_link_code = v_code where id = auth.uid();
      return v_code;
    exception when unique_violation then
      if v_attempt > 8 then
        raise exception 'Could not generate a link code - please try again.';
      end if;
    end;
  end loop;
end;
$$;

create table public.parent_links (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.profiles(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (parent_id, student_id)
);
alter table public.parent_links enable row level security;

create policy parent_links_select_own on public.parent_links
  for select to authenticated
  using (parent_id = auth.uid() or is_admin());

create or replace function public.is_parent_of_student(p_student_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (select 1 from parent_links where parent_id = auth.uid() and student_id = p_student_id);
$$;

create or replace function public.link_child_by_code(p_code text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student_id uuid;
  v_full_name text;
begin
  if not exists (select 1 from profiles where id = auth.uid() and role = 'parent') then
    raise exception 'Only a parent account can link a child.';
  end if;

  select s.id, p.full_name into v_student_id, v_full_name
  from students s
  join profiles p on p.id = s.id
  where s.parent_link_code = upper(trim(p_code));

  if v_student_id is null then
    raise exception 'No child found with that code.';
  end if;

  insert into parent_links (parent_id, student_id)
  values (auth.uid(), v_student_id)
  on conflict (parent_id, student_id) do nothing;

  return json_build_object('student_id', v_student_id, 'full_name', v_full_name);
end;
$$;

-- Parent read access, scoped to only their own linked children.
create policy students_select_parent on public.students
  for select to authenticated
  using (is_parent_of_student(id));

create policy profiles_select_parent_of_student on public.profiles
  for select to authenticated
  using (is_parent_of_student(id));

create policy student_achievements_select_parent on public.student_achievements
  for select to authenticated
  using (is_parent_of_student(student_id));

create policy journey_progress_select_parent on public.journey_progress
  for select to authenticated
  using (is_parent_of_student(student_id));

create policy attempts_select_parent on public.quiz_attempts
  for select to authenticated
  using (is_parent_of_student(student_id));

create policy attendance_select_parent on public.attendance
  for select to authenticated
  using (is_parent_of_student(student_id));
