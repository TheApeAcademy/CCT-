-- Two faults in one function, both of which show on screen.
--
-- 1. The streak only counted student_bible_progress, and nothing in the app
--    writes to that table: its only writer, complete_bible_reading(), has no
--    call sites anywhere in src/. A child's daily work goes through
--    complete_journey_lesson() into journey_progress instead. So the flame on
--    the Sunday School cover, the streak on the kid's dashboard and the streak
--    column on the leaderboard all read 0 however many Bible Journey lessons
--    the child finished. The last row in student_bible_progress is seed data
--    from 2026-09-12, so on the live site every streak is currently 0.
--    A day now counts if the child did either.
--
-- 2. A parent was not on the authorization list, so getChildBibleStreak()
--    raised 'Not authorized.' for every parent. That rejected the Promise.all
--    behind a child's panel in the Parent Dashboard, which has no catch, so
--    the panel sat on "Loading ...'s progress" forever. There are no rows in
--    parent_links yet, so no parent has hit this, but the first one would.
create or replace function public.compute_bible_streak(p_student_id uuid)
returns integer
language plpgsql
stable
security definer
set search_path to 'public'
as $function$
declare
  streak integer := 0;
  check_date date := current_date;
  has_today boolean;
begin
  if not (
    p_student_id = auth.uid()
    or public.is_teacher_of_student(p_student_id)
    or public.is_parent_of_student(p_student_id)
    or public.is_admin()
  ) then
    raise exception 'Not authorized.';
  end if;

  select exists(
    select 1 from public.student_bible_progress
    where student_id = p_student_id and completed_at::date = current_date
    union all
    select 1 from public.journey_progress
    where student_id = p_student_id and completed_at::date = current_date
  ) into has_today;

  -- Today not being done yet is not a broken streak: the run is counted back
  -- from yesterday instead, exactly as before.
  if not has_today then
    check_date := current_date - 1;
  end if;

  loop
    exit when not exists (
      select 1 from public.student_bible_progress
      where student_id = p_student_id and completed_at::date = check_date
      union all
      select 1 from public.journey_progress
      where student_id = p_student_id and completed_at::date = check_date
    );
    streak := streak + 1;
    check_date := check_date - 1;
  end loop;

  return streak;
end;
$function$;
