-- A parent link code was FAM + 4 digits, so 10,000 combinations. A signed-up
-- parent account could work through all of them and attach itself to a
-- stranger's child, then read that child's attendance, lessons and badges.
-- Six digits makes that a million. No codes had been issued yet, so nothing
-- existing is invalidated, and any code already in the wild would keep
-- working since this only changes generation.
create or replace function public.get_or_create_parent_link_code()
 returns text
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_code text;
  v_attempt int := 0;
begin
  if not exists (select 1 from students where id = auth.uid()) then
    raise exception 'Only a student can have a parent link code.';
  end if;

  select parent_link_code into v_code from students where id = auth.uid();
  if v_code is not null then
    return v_code;
  end if;

  loop
    v_attempt := v_attempt + 1;
    v_code := 'FAM' || lpad((floor(random() * 1000000))::int::text, 6, '0');
    begin
      update students set parent_link_code = v_code where id = auth.uid();
      return v_code;
    exception when unique_violation then
      if v_attempt > 8 then
        raise exception 'Could not generate a link code - please try again.';
      end if;
    end;
  end loop;
end;
$function$;
