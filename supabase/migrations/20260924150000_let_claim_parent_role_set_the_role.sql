-- Parent sign up hangs on "Setting up your account..." forever.
--
-- claim_parent_role() does `update profiles set role = 'parent' where id =
-- auth.uid() and role is null`. profiles carries a BEFORE UPDATE trigger,
-- prevent_role_self_escalation(), which reverts any role change made by
-- someone who is neither an admin nor the service role:
--
--   if new.role is distinct from old.role
--      and not public.is_admin()
--      and auth.role() <> 'service_role'
--   then new.role := old.role; end if;
--
-- security definer changes the DATABASE role, not auth.role(), which still
-- reads 'authenticated' inside the function. So the trigger silently puts the
-- role back to null. It raises nothing, so claim_parent_role() returns void
-- successfully, the client refetches an unchanged profile and the page sits on
-- its setup line with no error and no way out. The parent never reaches the
-- dashboard, so they can never enter their child's code either.
--
-- The fix is a transaction-local flag that only our own definer function sets.
-- set_config(..., true) scopes it to the statement's transaction, so it cannot
-- leak into another request on a pooled connection, and PostgREST exposes only
-- public schema functions, so a client cannot set it directly.
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

-- Sets the flag for its own transaction and nothing else. The `role is null`
-- guard is what keeps this safe: it can only ever turn an account that has no
-- role at all into a parent, never a student into a teacher or an admin.
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
