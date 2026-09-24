-- The leaderboard's four windows did not agree with each other.
--
-- "All time" reads students.total_points, which the triggers bank as work
-- happens: bump_student_points() adds quiz_attempts.points, the row's own
-- points column, which carries the quiz's speed and streak bonuses.
--
-- The dated windows (week, month, year) recomputed from source instead, and
-- valued a quiz at correct_count * 10. Those are not the same number. Across
-- the 72 attempts on the live site the banked points total 47,260 while
-- correct_count * 10 totals 6,050: per attempt, 300 to 980 against a hard
-- ceiling of 100. So the same child showed roughly eight times more points on
-- All time than on This week, which reads as a broken board.
--
-- The window now sums the same quiz points the trigger banked. The other three
-- terms already matched their triggers: a bible reading is 10, an assignment
-- submission is 10, a journey lesson is 15.
--
-- The streak column has the same dead-table problem the kid's flame had, and
-- is fixed the same way: a day counts if the child did a bible reading or a
-- journey lesson. See 20260924120000_streak_counts_journey_lessons.sql.
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
  -- Every day a child did something that counts, from either source.
  active_days as (
    select sbp.student_id, sbp.completed_at::date as day
    from public.student_bible_progress sbp
    union
    select jp.student_id, jp.completed_at::date as day
    from public.journey_progress jp
  ),
  -- Consecutive days share a value of (day minus its row number), which groups
  -- a run without needing a recursive query.
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
  -- Only a run reaching today or yesterday is a streak you are still on.
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
        coalesce((select sum(qa.points) from public.quiz_attempts qa
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
