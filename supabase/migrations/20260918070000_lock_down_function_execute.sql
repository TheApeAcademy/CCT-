-- Close a hole in the notifications work.
--
-- notify_user is the only thing that writes a notification row. The
-- notifications migration revoked it from anon and authenticated, which looked
-- right and was not: in Postgres, EXECUTE on a new function is granted to
-- PUBLIC, and anon and authenticated inherit that. Revoking from them by name
-- left the PUBLIC grant standing, so anybody holding the publishable key could
-- have posted a notification to any user - a fake "A child needs you", or a
-- fake message from a teacher with a link on it. That is the one function in
-- the system where forging a row is worth something to an attacker.
--
-- So: revoke from PUBLIC, which is what actually removes it, and do the same
-- for the trigger functions, which have no business being reachable over the
-- API either. Triggers do not check EXECUTE, so they keep firing.
--
-- The rest below only lose anon. They all check auth.uid() and return nothing
-- to a stranger already, but a function that needs a signed-in user should not
-- be answerable without one.

revoke execute on function public.notify_user(uuid, text, text, text, text, text) from public, anon, authenticated;

revoke execute on function public.on_ears_message_created() from public, anon, authenticated;
revoke execute on function public.on_ears_reply_created() from public, anon, authenticated;
revoke execute on function public.on_ears_escalated() from public, anon, authenticated;
revoke execute on function public.on_message_created() from public, anon, authenticated;
revoke execute on function public.on_assignment_created() from public, anon, authenticated;
revoke execute on function public.on_submission_graded() from public, anon, authenticated;
revoke execute on function public.on_journey_lesson_done() from public, anon, authenticated;
revoke execute on function public.on_avatar_pending() from public, anon, authenticated;

-- Same trap again, so the same shape of fix: take the PUBLIC grant away
-- first, then hand EXECUTE back to signed-in users only. Revoking from anon by
-- name would leave PUBLIC standing and change nothing.
revoke execute on function public.ministry_search(text, int) from public, anon;
grant execute on function public.ministry_search(text, int) to authenticated;

revoke execute on function public.list_pending_avatars() from public, anon;
grant execute on function public.list_pending_avatars() to authenticated;

revoke execute on function public.review_child_avatar(uuid, boolean) from public, anon;
grant execute on function public.review_child_avatar(uuid, boolean) to authenticated;

revoke execute on function public.mark_all_notifications_read() from public, anon;
grant execute on function public.mark_all_notifications_read() to authenticated;

revoke execute on function public.unread_notification_count() from public, anon;
grant execute on function public.unread_notification_count() to authenticated;

revoke execute on function public.screen_child_text(text) from public, anon;
grant execute on function public.screen_child_text(text) to authenticated;
