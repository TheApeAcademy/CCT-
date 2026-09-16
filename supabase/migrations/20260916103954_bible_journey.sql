-- Bible Journey: Duolingo-style self-paced Bible curriculum. Lesson content
-- itself (stories, cards, checkpoint questions) lives in the app's code
-- (src/content/bibleJourney*.ts), not the database - there's deliberately
-- no admin/teacher CRUD for it. This table only tracks which lessons a
-- student has completed, mirroring the student_bible_progress pattern.

create table public.journey_progress (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  book text not null,
  lesson_key text not null,
  score integer,
  completed_at timestamptz not null default now(),
  unique (student_id, lesson_key)
);

alter table public.journey_progress enable row level security;

create policy journey_progress_select_own on public.journey_progress
  for select using (student_id = auth.uid());

create policy journey_progress_select_teacher on public.journey_progress
  for select using (public.is_admin() or public.is_teacher_of_student(student_id));

create policy journey_progress_insert_own on public.journey_progress
  for insert with check (student_id = auth.uid());

-- Fixed XP per completed micro-lesson, awarded server-side (never trusts a
-- client-supplied point value, unlike a plain generic bump - a kid's
-- browser could otherwise claim any number of points for one lesson).
create function public.bump_points_journey_lesson()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  update public.students set total_points = total_points + 15 where id = new.student_id;
  return new;
end;
$$;

create trigger trg_bump_points_journey
  after insert on public.journey_progress
  for each row execute function public.bump_points_journey_lesson();

create function public.check_journey_achievements()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  lesson_count integer;
begin
  select count(*) into lesson_count from public.journey_progress where student_id = new.student_id;
  if lesson_count >= 1 then perform public.award_achievement(new.student_id, 'first_journey_lesson'); end if;
  if lesson_count >= 10 then perform public.award_achievement(new.student_id, 'journey_10_lessons'); end if;
  if lesson_count >= 25 then perform public.award_achievement(new.student_id, 'journey_25_lessons'); end if;
  return new;
end;
$$;

create trigger trg_check_journey_achievements
  after insert on public.journey_progress
  for each row execute function public.check_journey_achievements();

-- Convenience wrapper matching complete_bible_reading's shape: resolves
-- student_id from the session itself, and no-ops (via on conflict) on a
-- replay so points/achievements never double-fire.
create function public.complete_journey_lesson(p_book text, p_lesson_key text, p_score integer default null)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  insert into public.journey_progress (student_id, book, lesson_key, score)
  values (auth.uid(), p_book, p_lesson_key, p_score)
  on conflict (student_id, lesson_key) do nothing;
end;
$$;

insert into public.achievements (code, name, description, icon, active) values
  ('first_journey_lesson', 'First Steps', 'Complete your first Bible Journey lesson.', 'map', true),
  ('journey_10_lessons', 'Journey Explorer', 'Complete 10 Bible Journey lessons.', 'compass', true),
  ('journey_25_lessons', 'Journey Scholar', 'Complete 25 Bible Journey lessons.', 'graduation-cap', true);
