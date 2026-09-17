-- Feature 23: Bible Character Collection. Every points-earning activity
-- already bumps students.total_points via existing triggers; this hooks a
-- single new trigger onto that column so ANY points source (quizzes,
-- journey lessons, whatever comes later) can trigger an unlock, with no
-- need to touch those other trigger functions again.
--
-- A character unlocks only when BOTH are true: the student has completed
-- that character's own Bible Journey lesson, AND their total points have
-- crossed the next threshold. Which locked-but-eligible character gets
-- unlocked at that threshold is picked at random (order by random()) - a
-- surprise, not a fixed points-to-character mapping. The threshold itself
-- rises with each character already unlocked (120, 240, 360, ...) instead
-- of being a fixed number, and there's no upper cap on how many can unlock.

create table public.bible_characters (
  key text primary key,
  name text not null,
  book text not null,
  lesson_key text not null,
  image text not null,
  short_story text not null,
  sort_order int not null
);
alter table public.bible_characters enable row level security;
create policy bible_characters_select_all on public.bible_characters for select to authenticated using (true);

insert into public.bible_characters (key, name, book, lesson_key, image, short_story, sort_order) values
  ('creation', 'Creation', 'Genesis', 'genesis-creation', '/journey/adam-eve-garden-home.jpg', 'In the beginning, God spoke the world into being - light, sky, land, sea, and every living thing - and called it all good.', 1),
  ('adam-and-eve', 'Adam and Eve', 'Genesis', 'genesis-adam-eve', '/journey/adam-eve-garden-home.jpg', 'The first man and woman lived in a beautiful garden with God, until they chose to disobey Him and had to leave - but God never stopped loving them.', 2),
  ('cain-and-abel', 'Cain and Abel', 'Genesis', 'genesis-cain-abel', '/journey/cain-abel-offerings.jpg', 'Two brothers brought offerings to God, but jealousy led Cain to do something terrible to his brother Abel - a hard lesson about anger and sin.', 3),
  ('noah', 'Noah and the Flood', 'Genesis', 'genesis-noah', '/journey/noah-building-ark.jpg', 'Noah trusted God and built a huge ark to save his family and the animals from a great flood, even when nobody else believed him.', 4),
  ('tower-of-babel', 'The Tower of Babel', 'Genesis', 'genesis-babel', '/journey/tower-of-babel.jpg', 'The people tried to build a tower all the way to heaven to make themselves great, so God scattered them and gave them different languages.', 5),
  ('abraham', 'Abraham', 'Genesis', 'genesis-abraham', '/journey/abraham-isaac-ram-provided.jpg', 'God called Abraham to leave his home and promised to make him the father of a great nation - and Abraham trusted Him, even when it was hard.', 6),
  ('isaac', 'Isaac and Rebekah', 'Genesis', 'genesis-isaac', '/journey/adam-eve-first-sin.jpg', 'Isaac trusted God to find him a wife, and God led Rebekah to become his faithful partner.', 7),
  ('jacob', 'Jacob', 'Genesis', 'genesis-jacob', '/journey/jacob-ladder-dream.jpg', 'Jacob wrestled his way through life until he wrestled with God Himself and became Israel, the father of God''s people.', 8),
  ('joseph-1', 'Joseph, Part 1', 'Genesis', 'genesis-joseph-1', '/journey/cain-abel-offerings.jpg', 'Joseph''s jealous brothers sold him into slavery, but God was with him even in the darkest times.', 9),
  ('joseph-2', 'Joseph, Part 2', 'Genesis', 'genesis-joseph-2', '/journey/noah-building-ark.jpg', 'Joseph rose to power in Egypt and forgave the very brothers who betrayed him, saving his whole family from famine.', 10);

insert into public.achievements (code, name, description, icon, active)
select 'character_' || key, name, short_story, 'sparkles', true
from public.bible_characters;

create or replace function public.check_character_unlocks(p_student_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_points integer;
  v_unlocked_count integer;
  v_threshold integer;
  v_pick text;
begin
  select total_points into v_points from students where id = p_student_id;
  if v_points is null then
    return;
  end if;

  loop
    select count(*) into v_unlocked_count
    from student_achievements sa
    join achievements a on a.id = sa.achievement_id
    where sa.student_id = p_student_id and a.code like 'character_%';

    v_threshold := 120 * (v_unlocked_count + 1);
    if v_points < v_threshold then
      exit;
    end if;

    select bc.key into v_pick
    from bible_characters bc
    join journey_progress jp on jp.lesson_key = bc.lesson_key and jp.student_id = p_student_id
    where not exists (
      select 1
      from student_achievements sa2
      join achievements a2 on a2.id = sa2.achievement_id
      where sa2.student_id = p_student_id and a2.code = 'character_' || bc.key
    )
    order by random()
    limit 1;

    if v_pick is null then
      exit;
    end if;

    perform award_achievement(p_student_id, 'character_' || v_pick);
  end loop;
end;
$$;

create or replace function public.trg_fn_check_character_unlocks()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform check_character_unlocks(new.id);
  return new;
end;
$$;

create trigger trg_check_character_unlocks
after update of total_points on public.students
for each row
when (new.total_points is distinct from old.total_points)
execute function public.trg_fn_check_character_unlocks();

-- Neither function takes an ownership check on p_student_id, so leaving them
-- PostgREST-callable would let any signed-in user force-run the unlock
-- check against another student's id. They can't fabricate points or
-- lesson completions (those stay gated elsewhere), so this isn't a
-- privilege escalation - but there's no reason to expose them as public
-- RPCs when they're only ever meant to run from the trigger.
revoke execute on function public.check_character_unlocks(uuid) from public, anon, authenticated;
revoke execute on function public.trg_fn_check_character_unlocks() from public, anon, authenticated;
