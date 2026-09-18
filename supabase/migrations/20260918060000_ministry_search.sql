-- Search.
--
-- The only search box in the whole app was on the quiz History page. A
-- teacher with four classes who wanted one child had to remember which class
-- that child was in, open it, and scroll. An admin with eleven classes had
-- the same problem one level up.
--
-- One function, because the hard part of search here is not matching text,
-- it is deciding what each person is allowed to find. Doing that in four
-- separate client queries means four chances to get it wrong. A teacher finds
-- children, classes, class work and lessons inside their own classes. An
-- admin finds all of that plus teachers. A parent finds their own children.
-- Nobody finds anything else, whatever they type.
--
-- Deliberately not searchable: Ears for You messages and private
-- conversations. A safeguarding thread should be read in the place built for
-- reading it, where opening it is recorded, not surfaced as a row in a
-- dropdown next to a lesson title.

create or replace function public.ministry_search(p_query text, p_limit int default 6)
returns table (
  kind text,
  id uuid,
  title text,
  subtitle text,
  class_id uuid
)
language sql
stable
security definer
set search_path to 'public'
as $$
  with q as (
    select '%' || btrim(lower(coalesce(p_query, ''))) || '%' as pat,
           length(btrim(coalesce(p_query, ''))) as len
  )
  (
    select 'student'::text, p.id, p.full_name,
           coalesce(c.name, 'Not in a class yet')::text, s.class_id
    from q, students s
    join profiles p on p.id = s.id
    left join classes c on c.id = s.class_id
    where q.len >= 2
      and (lower(p.full_name) like q.pat or lower(coalesce(s.student_code, '')) like q.pat)
      and (
        is_admin()
        or (s.class_id is not null and is_teacher_of_class(s.class_id))
        or is_parent_of_student(s.id)
      )
    order by p.full_name
    limit p_limit
  )
  union all
  (
    select 'class'::text, c.id, c.name,
           coalesce(tp.full_name, 'No teacher assigned')::text, c.id
    from q, classes c
    left join profiles tp on tp.id = c.teacher_id
    where q.len >= 2
      and lower(c.name) like q.pat
      and (is_admin() or c.teacher_id = auth.uid())
    order by c.name
    limit p_limit
  )
  union all
  (
    select 'assignment'::text, a.id, a.title, c.name::text, a.class_id
    from q, assignments a
    join classes c on c.id = a.class_id
    where q.len >= 2
      and lower(a.title) like q.pat
      and (is_admin() or is_teacher_of_class(a.class_id))
    order by a.created_at desc
    limit p_limit
  )
  union all
  (
    select 'lecture'::text, l.id, l.title, c.name::text, l.class_id
    from q, lectures l
    join classes c on c.id = l.class_id
    where q.len >= 2
      and lower(l.title) like q.pat
      and (is_admin() or is_teacher_of_class(l.class_id))
    order by l.created_at desc
    limit p_limit
  )
  union all
  (
    -- Teachers are an admin's business, not a teacher's.
    select 'teacher'::text, p.id, p.full_name, 'Teacher'::text, null::uuid
    from q, profiles p
    where q.len >= 2
      and is_admin()
      and p.role = 'teacher'
      and lower(p.full_name) like q.pat
    order by p.full_name
    limit p_limit
  );
$$;
