-- A student belongs to the school even before a class is assigned.
-- Keep the existing authenticated wrapper and school checks unchanged.
create or replace function app_private.import_students(p_rows jsonb)
returns integer language plpgsql security definer set search_path = '' as $$
declare sid uuid := app_private.school_id(); r jsonb; student uuid; gid uuid; n integer := 0;
begin
 if sid is null then raise exception 'Teacher access required'; end if;
 if jsonb_typeof(p_rows) is distinct from 'array' then raise exception 'Import 1 to 1000 students at a time'; end if;
 if jsonb_array_length(p_rows) not between 1 and 1000 then raise exception 'Import 1 to 1000 students at a time'; end if;
 for r in select value from jsonb_array_elements(p_rows) loop
  gid := nullif(r->>'group_id', '')::uuid;
  if gid is not null and not exists(select 1 from public.student_groups where id=gid and school_id=sid) then
   raise exception 'Unknown group';
  end if;
  insert into public.student_profiles(school_id,student_code,name)
   values(sid,trim(r->>'student_code'),trim(r->>'name')) returning id into student;
  if gid is not null then
   insert into public.group_members(school_id,group_id,student_id) values(sid,gid,student);
  end if;
  n := n + 1;
 end loop;
 return n;
end $$;
