# Prompt to hand to Claude Code with Supabase open

Two fixes are outstanding. Fix A is new and is why parent sign up hangs. Fix B
undoes a leaderboard change from an earlier run that turned out to be wrong.

Copy everything below the line.

---

You have Supabase open on the MFM Children's Ministry project, reference
`zdgbatkxjxiecqshnmwh`. Two things need replacing. Work in the browser or
through the Supabase connector, whichever you have. Do not ask me to do any of
it by hand, and do not drop anything: `create or replace` is the only safe
shape here, because dropping a function takes its permissions with it.

## Fix A, parent sign up hangs forever

A parent creates an account and the page sits on "Setting up your account..."
and never moves, so they never reach the dashboard and can never enter their
child's code.

`claim_parent_role()` runs `update profiles set role = 'parent' where id =
auth.uid() and role is null`. `profiles` carries a BEFORE UPDATE trigger,
`prevent_role_self_escalation()`, which reverts any role change made by
someone who is neither an admin nor the service role. `security definer`
changes the database role but **not** `auth.role()`, which still reads
`authenticated` inside the function, so the trigger silently puts the role
back to null. It raises nothing, so the RPC returns successfully and the
client refetches an unchanged profile.

Run this:

```sql
-- A transaction-local flag only our own definer function sets. set_config's
-- third argument scopes it to the transaction, so it cannot leak into another
-- request on a pooled connection, and PostgREST exposes only public schema
-- functions, so a client cannot set it directly.
create or replace function public.prevent_role_self_escalation()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if new.role is distinct from old.role
     and not public.is_admin()
     and auth.role() <> 'service_role'
     and coalesce(current_setting('app.role_claim', true), '') <> 'on' then
    new.role := old.role;
  end if;
  return new;
end;
$function$;

-- The `role is null` guard is what keeps this safe: it can only ever turn an
-- account with no role at all into a parent, never a student into a teacher
-- or an admin.
create or replace function public.claim_parent_role()
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  perform set_config('app.role_claim', 'on', true);
  update profiles set role = 'parent' where id = auth.uid() and role is null;
end;
$function$;
```

## Fix B, the leaderboard windows go back to the ladder

An earlier run changed the quiz term in `get_leaderboard_ranked()`'s week,
month and year windows to `sum(quiz_attempts.points)`. Checked against the
live rows that is backwards:

| | |
|---|---|
| all time (`sum(students.total_points)`) | 7,770 |
| this year using `correct_count * 10` | 7,770 |
| this year using `sum(quiz_attempts.points)` | 48,980 |

All 72 rows in `quiz_attempts` are seed data and their `points` column bears
no relation to the result: 800 points for 7 right, 350 for 8, 300 for 9. The
real ladder is a flat 10 points a level over 10 levels, so a game can only
ever produce `correct_count * 10`, with 100 as a perfect score.

The `journey_progress` half of that run is correct and stays, as is the whole
of the `compute_bible_streak()` fix. Run this:

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

## Check, run this last and show me every number

```sql
select
  (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'claim_parent_role'
     and pg_get_functiondef(p.oid) like '%app.role_claim%') as fix_a_claim,
  (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'prevent_role_self_escalation'
     and pg_get_functiondef(p.oid) like '%app.role_claim%') as fix_a_trigger,
  (select sum(points) from public.get_leaderboard_ranked('year')) as this_year,
  (select sum(points) from public.get_leaderboard_ranked('all')) as all_time,
  (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'compute_bible_streak'
     and pg_get_functiondef(p.oid) like '%is_parent_of_student%') as streak_fix_still_applied;
```

`fix_a_claim`, `fix_a_trigger` and `streak_fix_still_applied` must all be `1`,
and `this_year` and `all_time` must both be **7,770**. If `this_year` comes
back anywhere near 48,000 the replacement did not take, so say so rather than
moving on.

"This week" reads 0 and that is correct. Nothing has happened since the week
began on Mon 21 Sep.

**If anything errors**, stop and paste the exact error back. Do not improvise a
different version of any of these functions.
