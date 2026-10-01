-- The teacher inbox view already masked student_id/name for anonymous
-- messages, but two real leaks remained:
-- 1. The view had no row filter, and being security_invoker=false (runs as
--    the view owner, which bypasses RLS), ANY authenticated user - not just
--    the assigned teacher/admin - could select every class's Ears messages.
-- 2. The base table's own SELECT policy let the assigned teacher/admin read
--    ears_messages directly, unmasked - so an anonymous message's real
--    student_id was still fetchable by bypassing the view.

drop policy if exists ears_messages_select_assigned on ears_messages;
create policy ears_messages_select_assigned on ears_messages
  for select
  to authenticated
  using ((assigned_to = auth.uid() or is_admin()) and is_anonymous = false);

create or replace view ears_teacher_inbox as
select
  m.id,
  m.class_id,
  m.assigned_to,
  m.is_anonymous,
  m.body,
  m.status,
  m.created_at,
  m.updated_at,
  case when m.is_anonymous then null::uuid else m.student_id end as student_id,
  case when m.is_anonymous then null::text else p.full_name end as student_name
from ears_messages m
left join profiles p on p.id = m.student_id
where m.assigned_to = auth.uid() or is_admin();
