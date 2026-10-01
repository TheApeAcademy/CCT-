-- Closes the two places a signed-out stranger could read children's data.
--
-- The hole: `public.leaderboard` is a view, so no row level security applies
-- to it, and SELECT was granted to `anon`. The publishable key that permits
-- an `anon` read ships in the site's JavaScript by design, so anybody could
-- pull every child's full name, avatar, class and points with no account and
-- no class code. Verified before this migration with
--   begin; set local role anon; select count(*) from public.leaderboard;
-- which returned all 38 children. The Safety and Privacy page tells parents
-- children never appear on a public leaderboard, so this had to go.
--
-- Deliberately NOT done here: switching the view to security_invoker. That
-- would be the fuller fix, but a child can only select their own row under
-- students_select_self, so it would empty the class list on the kids' Friends
-- screen and the rank on the Bible Journey. Those two need a scoped
-- SECURITY DEFINER function first; this migration only closes the public
-- door, which is the urgent half.

revoke select on public.leaderboard from public;
revoke select on public.leaderboard from anon;
grant select on public.leaderboard to authenticated;

-- Same shape: a SECURITY DEFINER view whose own predicate already limits it
-- to the calling teacher, so anon reads nothing today. The grant is still
-- pointless surface area, and a later edit to the predicate would make it
-- live. Take it away.
revoke select on public.ai_companion_teacher_log from public;
revoke select on public.ai_companion_teacher_log from anon;
grant select on public.ai_companion_teacher_log to authenticated;

-- quiz_sessions holds a child's name and their answer to every question, and
-- its select policy was `using (true)` - readable by the world, not merely by
-- the ministry. Row level security is the right lever here because the insert
-- must stay open: a quiz is hosted on a shared screen that nobody is
-- necessarily signed in on, and losing that would silently stop matches
-- syncing (see syncPendingSessions, which swallows the error and requeues).
--
-- recordQuizSession now mints the row id in the browser instead of reading it
-- back, because an insert's RETURNING clause is itself a read and would be
-- refused for a signed-out host under the new policy.
drop policy if exists quiz_sessions_select_anyone on public.quiz_sessions;

create policy quiz_sessions_select_signed_in
  on public.quiz_sessions
  for select
  using (auth.uid() is not null);

-- Still to do, tracked as W12 and W13 on the audit: quiz_sessions is also
-- insert-anyone with no check on student_id, so a signed-in child can forge
-- game counts, and quiz_attempts accepts a client-supplied points value.
-- Both need points to be derived server side, which is a behaviour change
-- rather than a lock, so they are not bundled in here.
