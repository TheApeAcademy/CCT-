-- Feature 3 gap-close: the original badge list named a top-tier "Scripture
-- Master" badge with no obvious existing equivalent. Ties it to completing
-- the whole character collection (currently all of Genesis) rather than a
-- fixed lesson count, so it naturally grows as more books get authored.
insert into public.achievements (code, name, description, icon, active)
values ('scripture_master', 'Scripture Master', 'Unlock every Bible character in the collection.', 'graduation-cap', true);

create or replace function public.check_character_unlocks(p_student_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_points integer;
  v_unlocked_count integer;
  v_total_characters integer;
  v_threshold integer;
  v_pick text;
begin
  select total_points into v_points from students where id = p_student_id;
  if v_points is null then
    return;
  end if;

  select count(*) into v_total_characters from bible_characters;

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

  select count(*) into v_unlocked_count
  from student_achievements sa
  join achievements a on a.id = sa.achievement_id
  where sa.student_id = p_student_id and a.code like 'character_%';

  if v_total_characters > 0 and v_unlocked_count >= v_total_characters then
    perform award_achievement(p_student_id, 'scripture_master');
  end if;
end;
$$;
