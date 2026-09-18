-- Passcode resets for children.
--
-- Adults recover an account through a link emailed to them. A child has no
-- email on their account at all, so there is no such link and never will be -
-- a forgotten passcode locked them out permanently, with nothing anywhere in
-- the app that could let them back in. Their teacher does that instead, via
-- the reset-passcode Edge Function.
--
-- These two columns are the record of it. Changing a child's way into their
-- own messages and their own Ears for You thread should never be a thing that
-- leaves no trace, so who did it and when is kept on the row.

alter table public.students add column if not exists passcode_reset_at timestamptz;
alter table public.students add column if not exists passcode_reset_by uuid references public.profiles(id) on delete set null;

comment on column public.students.passcode_reset_at is 'When this child last had their passcode reset by an adult.';
comment on column public.students.passcode_reset_by is 'The teacher or admin who did it.';
