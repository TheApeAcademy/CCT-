-- Parents can read what Bible Buddy said to their child.
--
-- Bible Buddy is an AI a child talks to on their own. Every exchange was
-- already kept and shown to the class teacher, but a parent - the person who
-- actually answers the question that follows at the dinner table - could not
-- see a word of it. This closes that, on exactly the same terms a teacher
-- already has.
--
-- Those terms matter. A child can tick "ask privately", and when they do the
-- question is theirs alone: no teacher and no admin can ever get their name
-- against it. Handing those to a parent would be worse than handing them to a
-- teacher, not better - a parent is often exactly who a frightened child is
-- trying not to worry. So a parent sees what a teacher sees, and privately
-- asked questions stay private from everybody.
--
-- A child who is genuinely in trouble has Ears for You, which goes to a
-- trusted adult by design and is not affected by any of this.

create policy ai_companion_select_parent on public.ai_companion_messages
  for select to authenticated
  using (is_parent_of_student(student_id) and is_anonymous = false);
