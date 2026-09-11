-- Kids sign back in with "name + passcode" now, not a Student Code (that
-- still exists for teachers to enroll a student into their class - it just
-- isn't part of the kid-facing sign-in flow anymore). Since the passcode is
-- generated from the kid's own name (firstname + "mfm" + a random digit) it
-- doubles as a de-facto unique lookup key once we enforce uniqueness on it.
--
-- login_key is set by the student-register Edge Function going forward.
-- Existing students (registered before this change, still on a self-chosen
-- 4-digit PIN) have login_key = null; the RPC below falls back to matching
-- them by full_name so they aren't locked out, matching whatever passcode
-- they originally chose against that row via signInWithPassword.
alter table public.students add column if not exists login_key text unique;

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
  limit 1;
$function$;
