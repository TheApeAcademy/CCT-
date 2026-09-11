-- The student-register and join-class edge functions run with the service
-- role key to set role='student' on a brand-new profile right after
-- handle_new_auth_user creates a bare row. prevent_role_self_escalation
-- was blocking that too: it only ever allowed a role change through when
-- is_admin() was true, and is_admin() checks auth.uid(), which is null for
-- a service-role call — so every new student's role silently reverted to
-- null, and they could never pass the StudentPortal role check afterwards
-- (they'd land back on the "join your class" gate no matter what they did).
-- Service-role calls are already trusted (they bypass RLS entirely), so
-- they should bypass this self-escalation guard too.
create or replace function public.prevent_role_self_escalation()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if new.role is distinct from old.role
     and not public.is_admin()
     and auth.role() <> 'service_role' then
    new.role := old.role;
  end if;
  return new;
end;
$function$;

-- Backfill the student accounts already created while this bug was live —
-- their role should have been 'student' from the start.
update public.profiles
set role = 'student'
where role is null
  and id in (select id from public.students);
