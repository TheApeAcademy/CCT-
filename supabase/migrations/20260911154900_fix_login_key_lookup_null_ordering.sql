-- Fixes get_student_login_email_by_login_key (added in
-- 20260911143000_student_login_by_passcode.sql): when a name has both
-- pre-migration rows (login_key null) and post-migration rows (login_key
-- set), the original OR-only WHERE clause could match several rows for one
-- lookup, and LIMIT 1 with no ORDER BY could return any of them - including
-- a pre-migration namesake instead of the account whose passcode was
-- actually typed, causing a false "wrong passcode" on the correct account.
--
-- A first attempt added `order by (s.login_key = lower(trim(p_login_key)))
-- desc` to make an exact match win, but that comparison evaluates to NULL
-- (not false) for every row where login_key IS NULL, and Postgres sorts
-- NULLs FIRST in DESC order by default - so the pre-migration rows kept
-- winning anyway. Wrapping in coalesce(..., false) fixes it: those rows now
-- sort as false (last), so an exact login_key match always wins when one
-- exists, falling back to newest-first only among true name-only matches.
create or replace function public.get_student_login_email_by_login_key(p_login_key text, p_full_name text)
returns text
language sql
stable security definer
set search_path to 'public'
as $function$
  select au.email
  from public.students s
  join public.profiles p on p.id = s.id
  join auth.users au on au.id = s.id
  where s.login_key = lower(trim(p_login_key))
     or (s.login_key is null and lower(trim(p.full_name)) = lower(trim(p_full_name)))
  order by coalesce(s.login_key = lower(trim(p_login_key)), false) desc, s.created_at desc
  limit 1;
$function$;
