-- Puts the leaderboard's dated windows back to correct_count * 10, and undoes
-- 20260924130000, which was wrong.
--
-- That migration changed the quiz term in the windows from correct_count * 10
-- to sum(quiz_attempts.points), on the reading that the points column was what
-- the trigger banks into students.total_points and the window was undervaluing
-- a quiz by about eight times. Checked against the live rows, that is backwards:
--
--   all time (sum of students.total_points)          7770
--   this year with correct_count * 10                7770   <- exact match
--   this year with sum(quiz_attempts.points)        48980
--
-- The points column on all 72 existing rows is seed data and bears no relation
-- to the result: 800 points for 7 right, 350 for 8, 300 for 9. The ladder in
-- src/lib/ladder.ts is a flat 10 points a level over 10 levels, so a real game
-- can only ever produce correct_count * 10, with 100 as a perfect score. The
-- windows were already right; the seed column is the thing that lies.
--
-- The journey_progress half of 20260924130000 is kept. That fix was real: the
-- streak column counted only student_bible_progress, which nothing writes.
create or replace function public.get_leaderboard_ranked(p_range text default 'all'::text)
returns table(
  student_id uuid,
  full_name text,
  avatar_url text,
  class_id uuid,
  class_name text,
  points integer,
  games integer,
  streak integer
)
language sql
stable
security definer
set search_path to 'public'
as $function$
  with bounds as (
    select case lower(coalesce(p_range, 'all'))
             when 'week'  then date_trunc('week',  now())
             when 'month' then date_trunc('month', now())
             when 'year'  then date_trunc('year',  now())
             else null::timestamptz
           end as since
  ),
  active_days as (
    select sbp.student_id, sbp.completed_at::date as day
    from public.student_bible_progress sbp
    union
    select jp.student_id, jp.completed_at::date as day
    from public.journey_progress jp
  ),
  numbered as (
    select ad.student_id, ad.day,
           ad.day - (row_number() over (partition by ad.student_id order by ad.day))::int as grp
    from active_days ad
  ),
  runs as (
    select n.student_id, n.grp, count(*)::int as len, max(n.day) as last_day
    from numbered n
    group by n.student_id, n.grp
  ),
  current_streak as (
    select r.student_id, max(r.len)::int as streak
    from runs r
    where r.last_day >= current_date - 1
    group by r.student_id
  )
  select
    s.id,
    p.full_name,
    p.avatar_url,
    c.id,
    c.name,
    case
      when (select since from bounds) is null then coalesce(s.total_points, 0)
      else
        coalesce((select sum(qa.correct_count) * 10 from public.quiz_attempts qa
                  where qa.student_id = s.id and qa.created_at >= (select since from bounds)), 0)
      + coalesce((select count(*) * 10 from public.student_bible_progress sbp
                  where sbp.student_id = s.id and sbp.completed_at >= (select since from bounds)), 0)
      + coalesce((select count(*) * 10 from public.assignment_submissions sub
                  where sub.student_id = s.id and sub.created_at >= (select since from bounds)), 0)
      + coalesce((select count(*) * 15 from public.journey_progress jp
                  where jp.student_id = s.id and jp.completed_at >= (select since from bounds)), 0)
    end::int as points,
    coalesce((
      select count(*)::int from public.quiz_sessions qs
      where qs.student_id = s.id
        and ((select since from bounds) is null or qs.created_at >= (select since from bounds))
    ), 0) as games,
    coalesce(cs.streak, 0) as streak
  from public.students s
  join public.profiles p on p.id = s.id
  left join public.classes c on c.id = s.class_id
  left join current_streak cs on cs.student_id = s.id
$function$;
