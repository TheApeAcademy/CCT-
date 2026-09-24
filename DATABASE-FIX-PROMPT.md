# Prompt to hand to Claude Code with Supabase open

An earlier version of this file contained a second fix that was wrong. It has
been replaced by the correction below. If you already ran the earlier file,
this one undoes the part that needs undoing and leaves the part that was right.

Copy everything below the line.

---

You have Supabase open on the MFM Children's Ministry project, reference
`zdgbatkxjxiecqshnmwh`. One function needs replacing. Work in the browser or
through the Supabase connector, whichever you have. Do not ask me to do any of
it by hand.

**Background so you know what you are undoing.** A previous run replaced the
quiz term in `get_leaderboard_ranked()`'s dated windows with
`sum(quiz_attempts.points)`, on the theory that the `points` column is what the
trigger banks into `students.total_points`. That was checked against the live
rows afterwards and it is backwards:

| |  |
|---|---|
| all time (sum of `students.total_points`) | 7,770 |
| this year using `correct_count * 10` | 7,770 |
| this year using `sum(quiz_attempts.points)` | 48,980 |

All 72 rows in `quiz_attempts` are seed data and their `points` column bears no
relation to the result: 800 points for 7 right, 350 for 8, 300 for 9. The real
ladder is a flat 10 points a level over 10 levels, so a real game can only ever
produce `correct_count * 10`, with 100 as a perfect score. The window was
already right. Only the seed column lies.

The `journey_progress` part of that run is correct and stays. So is the whole
of the `compute_bible_streak()` fix. Do not touch either.

**Step 1.** Run this. It is one `create or replace`, which keeps the function's
existing permissions, so nothing needs granting afterwards.

```sql
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
```

**Step 2.** Run this and show me all three numbers:

```sql
select
  (select sum(points) from public.get_leaderboard_ranked('year')) as this_year,
  (select sum(points) from public.get_leaderboard_ranked('all'))  as all_time,
  (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'compute_bible_streak'
     and pg_get_functiondef(p.oid) like '%is_parent_of_student%') as streak_fix_still_applied;
```

`this_year` and `all_time` must both come back **7,770**, and
`streak_fix_still_applied` must be **1**. If `this_year` comes back anywhere
near 48,000 the replacement did not take, so say so rather than moving on.

"This week" will be 0 and that is correct. Nothing has happened since the week
began on Mon 21 Sep: the last quiz attempt was 11 Sep, the last Bible progress
12 Sep, the last journey lesson 16 Sep and the last assignment 17 Sep.

**If anything errors**, stop and paste the exact error back. Do not improvise a
different version, and do not drop anything. `create or replace` is the only
safe shape here, because dropping `get_leaderboard_ranked` would take its
permissions with it.
