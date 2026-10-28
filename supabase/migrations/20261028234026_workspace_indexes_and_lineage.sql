begin;
create index workspace_fk_0 on public.schools(owner_id);
create index workspace_fk_1 on public.student_groups(school_id,teacher_id);
create index workspace_fk_2 on public.group_members(school_id,group_id);
create index workspace_fk_3 on public.group_members(school_id,student_id);
create index workspace_fk_4 on public.activities(school_id,owner_id);
create index workspace_fk_5 on public.activities(school_id,id,current_version_id);
create index workspace_fk_6 on public.activity_versions(school_id,activity_id,parent_version_id);
create index workspace_fk_7 on public.activity_versions(school_id,created_by);
create index workspace_fk_8 on public.assignments(school_id,version_id);
create index workspace_fk_9 on public.assignments(school_id,assigned_by);
create index workspace_fk_10 on public.assignment_groups(school_id,assignment_id);
create index workspace_fk_11 on public.assignment_groups(school_id,group_id);
create index workspace_fk_12 on public.assignment_recipients(school_id,assignment_id);
create index workspace_fk_13 on public.assignment_recipients(school_id,student_id);
create index workspace_fk_14 on public.student_attempts(submitted_by);
create index workspace_fk_15 on public.student_attempts(school_id,student_id);
create index workspace_fk_16 on public.student_attempts(school_id,version_id);
create index workspace_fk_17 on public.student_attempts(school_id,assignment_id);
create index workspace_fk_18 on public.attempt_answers(school_id,attempt_id);
create or replace function app_private.reserve_activity_version(p_activity_id uuid,p_definition jsonb,p_prompts jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare sid uuid:=app_private.school_id();a public.activities;vid uuid:=gen_random_uuid();number integer;key text;
begin
 if sid is null then raise exception 'Teacher access required';end if;
 if length(trim(p_definition->>'title'))=0 or p_definition->>'kind' not in ('color','text') or p_definition->>'mode' not in ('assessment','teaching') then raise exception 'Invalid activity definition';end if;
 insert into public.activities(id,school_id,owner_id,title,kind,mode) values(p_activity_id,sid,auth.uid(),p_definition->>'title',p_definition->>'kind',p_definition->>'mode') on conflict(id) do nothing;
 select * into a from public.activities where id=p_activity_id for update;
 if a.school_id<>sid or a.owner_id<>auth.uid() then raise exception 'Only the activity owner can create a version';end if;
 select coalesce(max(version_number),0)+1 into number from public.activity_versions where activity_id=a.id;
 key:=sid::text||'/'||a.id::text||'/'||vid::text||'/activity.jsx';
 insert into public.activity_versions(id,school_id,activity_id,version_number,parent_version_id,source_path,definition,prompts,created_by)
 values(vid,sid,a.id,number,coalesce((p_definition->>'basedOnVersionId')::uuid,a.current_version_id),key,p_definition,p_prompts,auth.uid());
 return jsonb_build_object('activity_id',a.id,'version_id',vid,'version_number',number,'source_path',key);
end $$;


commit;
