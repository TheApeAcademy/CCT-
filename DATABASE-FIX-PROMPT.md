# Prompt to hand to Claude Code in the browser

Copy everything below the line into Claude Code in the browser, with the
Supabase tab already open on the MFM project.

---

You have a browser open with Supabase already signed in on the MFM Children's
Ministry project, reference `zdgbatkxjxiecqshnmwh`. Two database functions are
wrong and I need you to replace them. Work in the browser, do not ask me to do
any of it by hand.

**Step 1.** In the Supabase tab, go to the SQL Editor and open a new query.

**Step 2.** Paste the whole block below in and run it. It is two
`create or replace function` statements. Replacing a function this way keeps
its existing permissions, so nothing else needs granting afterwards.

```sql
-- FIX 1 of 2: the Bible streak.
--
-- Finishing a Bible Journey lesson writes a row to journey_progress, but this
-- function only counted student_bible_progress, and nothing in the app writes
-- to that table. So every streak on the site reads 0 however many lessons a
-- child does. A day now counts if the child did either.
--
-- It also refused parents outright, which left a child's panel in the Parent
-- Dashboard loading forever, so is_parent_of_student goes on the list.
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


-- FIX 2 of 2: the leaderboard's time windows.
--
-- All time reads students.total_points, which the triggers bank as work
-- happens, quiz speed and streak bonuses included. The dated windows valued
-- the same quiz at correct_count * 10, with no bonuses, so the two disagreed
-- by roughly eight times. The window now sums the same points the trigger
-- banked. The streak column gets the same journey_progress fix as above.
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
```

**Step 3.** Run this check in a new query and show me the result:

```sql
select
  (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'compute_bible_streak'
     and pg_get_functiondef(p.oid) like '%is_parent_of_student%') as fix1_applied,
  (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'get_leaderboard_ranked'
     and pg_get_functiondef(p.oid) like '%sum(qa.points)%') as fix2_applied;
```

Both columns must come back `1`. If either is `0` the replacement did not take,
so say so rather than moving on.

**Step 4.** Then run this and show me the numbers:

```sql
select 'this week' as window, sum(points) as total from public.get_leaderboard_ranked('week')
union all
select 'all time', sum(points) from public.get_leaderboard_ranked('all');
```

Before the fix "this week" came out at roughly an eighth of "all time" for the
same children. They will not be equal, a week is not all time, but the gap
should now be explainable rather than a fixed 8x.

**If anything errors**, stop and paste the exact error back to me. Do not
improvise a different version of either function, and do not drop anything.
`create or replace` is the only shape that is safe here, because dropping
`get_leaderboard_ranked` would take its permissions with it.
