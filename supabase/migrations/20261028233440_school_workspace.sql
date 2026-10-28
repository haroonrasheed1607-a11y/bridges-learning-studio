-- Bridges Learning Studio: private, school-scoped records and immutable JSX versions.
begin;
create schema if not exists app_private;
revoke all on schema app_private from public;
grant usage on schema app_private to authenticated;

create table public.schools (
  id uuid primary key default gen_random_uuid(), name text not null check(length(trim(name)) between 1 and 160),
  owner_id uuid not null references auth.users(id), created_at timestamptz not null default now()
);
create table public.teacher_profiles (
  id uuid primary key references auth.users(id), school_id uuid not null references public.schools(id),
  name text not null, role text not null default 'teacher' check(role in ('teacher','admin')),
  created_at timestamptz not null default now(), unique(school_id,id)
);
create table public.student_profiles (
  id uuid primary key default gen_random_uuid(), school_id uuid not null references public.schools(id),
  auth_user_id uuid unique references auth.users(id), student_code text not null check(length(trim(student_code))>0),
  name text not null check(length(trim(name))>0), email text,
  created_at timestamptz not null default now(), unique(school_id,id)
);
create unique index student_school_code on public.student_profiles(school_id,lower(student_code));
create table public.student_groups (
  id uuid primary key default gen_random_uuid(), school_id uuid not null references public.schools(id),
  name text not null check(length(trim(name)) between 1 and 160), description text not null default '',
  teacher_id uuid not null, created_at timestamptz not null default now(), unique(school_id,id), unique(school_id,name),
  foreign key(school_id,teacher_id) references public.teacher_profiles(school_id,id)
);
create table public.group_members (
  school_id uuid not null, group_id uuid not null, student_id uuid not null, joined_at timestamptz not null default now(),
  primary key(group_id,student_id), foreign key(school_id,group_id) references public.student_groups(school_id,id),
  foreign key(school_id,student_id) references public.student_profiles(school_id,id)
);
create table public.activities (
  id uuid primary key default gen_random_uuid(), school_id uuid not null references public.schools(id), owner_id uuid not null,
  title text not null, kind text not null check(kind in ('color','text')), mode text not null check(mode in ('assessment','teaching')),
  visibility text not null default 'private' check(visibility in ('private','school')), current_version_id uuid,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(school_id,id),
  foreign key(school_id,owner_id) references public.teacher_profiles(school_id,id)
);
create table public.activity_versions (
  id uuid primary key default gen_random_uuid(), school_id uuid not null, activity_id uuid not null,
  version_number integer not null check(version_number>0), parent_version_id uuid,
  source_path text not null unique, definition jsonb not null, prompts jsonb not null default '[]',
  status text not null default 'uploading' check(status in ('uploading','ready')), created_by uuid not null,
  created_at timestamptz not null default now(), unique(activity_id,version_number), unique(school_id,id), unique(school_id,activity_id,id),
  foreign key(school_id,activity_id) references public.activities(school_id,id),
  foreign key(school_id,activity_id,parent_version_id) references public.activity_versions(school_id,activity_id,id),
  foreign key(school_id,created_by) references public.teacher_profiles(school_id,id)
);
alter table public.activities add foreign key(school_id,id,current_version_id) references public.activity_versions(school_id,activity_id,id);
create table public.assignments (
  id uuid primary key default gen_random_uuid(), school_id uuid not null, version_id uuid not null, assigned_by uuid not null,
  created_at timestamptz not null default now(), unique(school_id,id),
  foreign key(school_id,version_id) references public.activity_versions(school_id,id),
  foreign key(school_id,assigned_by) references public.teacher_profiles(school_id,id)
);
create table public.assignment_groups (
  school_id uuid not null, assignment_id uuid not null, group_id uuid not null,
  primary key(assignment_id,group_id), foreign key(school_id,assignment_id) references public.assignments(school_id,id),
  foreign key(school_id,group_id) references public.student_groups(school_id,id)
);
create table public.assignment_recipients (
  school_id uuid not null, assignment_id uuid not null, student_id uuid not null,
  primary key(assignment_id,student_id), foreign key(school_id,assignment_id) references public.assignments(school_id,id),
  foreign key(school_id,student_id) references public.student_profiles(school_id,id)
);
create table public.student_attempts (
  id uuid primary key, school_id uuid not null, student_id uuid not null, version_id uuid not null, assignment_id uuid,
  score numeric not null, possible_points numeric not null, submitted_by uuid not null references auth.users(id),
  completed_at timestamptz not null default now(), unique(school_id,id),
  foreign key(school_id,student_id) references public.student_profiles(school_id,id),
  foreign key(school_id,version_id) references public.activity_versions(school_id,id),
  foreign key(school_id,assignment_id) references public.assignments(school_id,id),
  check(score>=0 and score<=possible_points)
);
create table public.attempt_answers (
  school_id uuid not null, attempt_id uuid not null, question_id text not null, concept text not null,
  response jsonb, correct boolean not null, points numeric not null,
  primary key(attempt_id,question_id), foreign key(school_id,attempt_id) references public.student_attempts(school_id,id)
);
create index group_members_student on public.group_members(student_id);
create index versions_activity on public.activity_versions(activity_id);
create index assignments_version on public.assignments(version_id);
create index recipients_student on public.assignment_recipients(student_id);
create index attempts_student_version on public.student_attempts(student_id,version_id);

-- Helpers run as owner to avoid recursive profile-table policies. No caller-controlled SQL.
create function app_private.school_id() returns uuid language sql stable security definer set search_path='' as $$
  select school_id from public.teacher_profiles where id=auth.uid();
$$;
create function app_private.can_read_activity(target uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.activities a where a.id=target and a.school_id=app_private.school_id() and (a.owner_id=auth.uid() or a.visibility='school'));
$$;
revoke all on all functions in schema app_private from public;
grant execute on all functions in schema app_private to authenticated;

-- Bootstrap is explicit: an authenticated person creates their own school, never joins an existing one by guessing its ID.
create function public.create_school_workspace(p_school_name text,p_teacher_name text) returns uuid
language plpgsql security definer set search_path='' as $$
declare sid uuid;
begin
 if auth.uid() is null then raise exception 'Sign in first'; end if;
 perform pg_advisory_xact_lock(hashtext(auth.uid()::text));
 if exists(select 1 from public.teacher_profiles where id=auth.uid()) or exists(select 1 from public.student_profiles where auth_user_id=auth.uid()) then raise exception 'Account already belongs to a workspace'; end if;
 if length(trim(p_teacher_name))=0 then raise exception 'Teacher name is required'; end if;
 insert into public.schools(name,owner_id) values(trim(p_school_name),auth.uid()) returning id into sid;
 insert into public.teacher_profiles(id,school_id,name,role) values(auth.uid(),sid,trim(p_teacher_name),'admin');
 return sid;
end $$;

create function public.create_student_group(p_name text) returns uuid language plpgsql security definer set search_path='' as $$
declare gid uuid;sid uuid:=app_private.school_id();
begin
 if sid is null then raise exception 'Teacher access required'; end if;
 insert into public.student_groups(school_id,name,teacher_id) values(sid,trim(p_name),auth.uid()) returning id into gid;return gid;
end $$;

create function public.import_students(p_rows jsonb) returns integer language plpgsql security definer set search_path='' as $$
declare sid uuid:=app_private.school_id(); r jsonb; student uuid; n integer:=0;
begin
 if sid is null then raise exception 'Teacher access required'; end if;
 if jsonb_typeof(p_rows)<>'array' or jsonb_array_length(p_rows) not between 1 and 1000 then raise exception 'Import 1 to 1000 students at a time';end if;
 for r in select value from jsonb_array_elements(p_rows) loop
  if not exists(select 1 from public.student_groups where id=(r->>'group_id')::uuid and school_id=sid) then raise exception 'Unknown group';end if;
  insert into public.student_profiles(school_id,student_code,name) values(sid,trim(r->>'student_code'),trim(r->>'name')) returning id into student;
  insert into public.group_members(school_id,group_id,student_id) values(sid,(r->>'group_id')::uuid,student);n:=n+1;
 end loop;return n;
end $$;

create function public.reserve_activity_version(p_activity_id uuid,p_definition jsonb,p_prompts jsonb) returns jsonb
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
 values(vid,sid,a.id,number,a.current_version_id,key,p_definition,p_prompts,auth.uid());
 return jsonb_build_object('activity_id',a.id,'version_id',vid,'version_number',number,'source_path',key);
end $$;

create function public.finalize_activity_version(p_version_id uuid) returns void language plpgsql security definer set search_path='' as $$
declare v public.activity_versions;
begin
 select * into v from public.activity_versions where id=p_version_id for update;
 if app_private.school_id() is null or v.id is null or v.school_id<>app_private.school_id() or v.created_by<>auth.uid() then raise exception 'Version access denied';end if;
 if not exists(select 1 from storage.objects where bucket_id='activity-files' and name=v.source_path) then raise exception 'JSX upload has not completed';end if;
 update public.activity_versions set status='ready' where id=v.id;
 -- A delayed upload must not replace an already-published newer version.
 update public.activities a set current_version_id=v.id,title=v.definition->>'title',kind=v.definition->>'kind',mode=v.definition->>'mode',updated_at=now()
 where a.id=v.activity_id and (a.current_version_id is null or (select version_number from public.activity_versions where id=a.current_version_id)<v.version_number);
end $$;

create function public.assign_activity(p_version_id uuid,p_group_ids uuid[]) returns jsonb language plpgsql security definer set search_path='' as $$
declare sid uuid:=app_private.school_id();aid uuid;gid uuid;recipients integer;
begin
 if sid is null or not exists(select 1 from public.activity_versions v where v.id=p_version_id and v.status='ready' and app_private.can_read_activity(v.activity_id)) then raise exception 'Saved version required';end if;
 if coalesce(array_length(p_group_ids,1),0)=0 then raise exception 'Select a group';end if;
 foreach gid in array p_group_ids loop
  if not exists(select 1 from public.student_groups where id=gid and school_id=sid) then raise exception 'Group access denied';end if;
 end loop;
 insert into public.assignments(school_id,version_id,assigned_by) values(sid,p_version_id,auth.uid()) returning id into aid;
 insert into public.assignment_groups(school_id,assignment_id,group_id) select sid,aid,unnest(p_group_ids) on conflict do nothing;
 insert into public.assignment_recipients(school_id,assignment_id,student_id) select distinct sid,aid,student_id from public.group_members where group_id=any(p_group_ids);
 get diagnostics recipients=row_count;
 return jsonb_build_object('assignment_id',aid,'student_count',recipients);
end $$;

-- Teacher-led assessments are supported first; student self-submission will require a linked student login.
-- Scores come from the saved answer key, never a score supplied by the browser.
create function public.record_student_attempt(p_attempt_id uuid,p_student_id uuid,p_version_id uuid,p_answers jsonb,p_assignment_id uuid default null) returns uuid
language plpgsql security definer set search_path='' as $$
declare sid uuid:=app_private.school_id();v public.activity_versions;q jsonb;earned numeric:=0;possible numeric:=0;points numeric;right_answer boolean;
begin
 if sid is null then raise exception 'Teacher access required';end if;
 if exists(select 1 from public.student_attempts where id=p_attempt_id and school_id=sid and submitted_by=auth.uid()) then return p_attempt_id;end if;
 if not exists(select 1 from public.student_profiles where id=p_student_id and school_id=sid) then raise exception 'Student access denied';end if;
 select * into v from public.activity_versions where id=p_version_id and status='ready' and school_id=sid;
 if v.id is null or not app_private.can_read_activity(v.activity_id) then raise exception 'Version access denied';end if;
 if p_assignment_id is not null and not exists(select 1 from public.assignments a join public.assignment_recipients r on r.assignment_id=a.id where a.id=p_assignment_id and a.version_id=v.id and r.student_id=p_student_id) then raise exception 'Student did not receive this version';end if;
 if jsonb_typeof(v.definition->'questions')<>'array' or jsonb_array_length(v.definition->'questions')=0 or v.definition->>'mode'<>'assessment' then raise exception 'Scored assessment required';end if;
 for q in select value from jsonb_array_elements(v.definition->'questions') loop
  points:=coalesce((q->>'points')::numeric,1);if points<=0 then raise exception 'Invalid question points';end if;
  possible:=possible+points;
  if lower(trim(p_answers->>(q->>'id')))=lower(trim(q->>'answer')) then earned:=earned+points;end if;
 end loop;
 insert into public.student_attempts(id,school_id,student_id,version_id,assignment_id,score,possible_points,submitted_by)
 values(p_attempt_id,sid,p_student_id,v.id,p_assignment_id,earned,possible,auth.uid());
 for q in select value from jsonb_array_elements(v.definition->'questions') loop
  right_answer:=coalesce(lower(trim(p_answers->>(q->>'id')))=lower(trim(q->>'answer')),false);
  insert into public.attempt_answers(school_id,attempt_id,question_id,concept,response,correct,points)
  values(sid,p_attempt_id,q->>'id',coalesce(q->>'concept',''),p_answers->(q->>'id'),right_answer,case when right_answer then coalesce((q->>'points')::numeric,1) else 0 end);
 end loop;return p_attempt_id;
end $$;

-- Default deny: browsers can read only their workspace, and all writes use guarded, transactional RPCs.
-- Explicit grants are independent of RLS. Anonymous visitors receive no school data.
do $$ declare t text; begin
 foreach t in array array['schools','teacher_profiles','student_profiles','student_groups','group_members','activities','activity_versions','assignments','assignment_groups','assignment_recipients','student_attempts','attempt_answers'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('revoke all on public.%I from anon, authenticated',t);
  execute format('grant select on public.%I to authenticated',t);
 end loop;
end $$;
create policy school_read on public.schools for select to authenticated using(id=(select app_private.school_id()));
create policy teachers_read on public.teacher_profiles for select to authenticated using(school_id=(select app_private.school_id()));
create policy students_read on public.student_profiles for select to authenticated using(school_id=(select app_private.school_id()) or auth_user_id=(select auth.uid()));
create policy groups_read on public.student_groups for select to authenticated using(school_id=(select app_private.school_id()));
create policy memberships_read on public.group_members for select to authenticated using(school_id=(select app_private.school_id()));
create policy activities_read on public.activities for select to authenticated using(school_id=(select app_private.school_id()) and (owner_id=(select auth.uid()) or visibility='school'));
create policy versions_read on public.activity_versions for select to authenticated using(app_private.can_read_activity(activity_id));
create policy assignments_read on public.assignments for select to authenticated using(school_id=(select app_private.school_id()));
create policy assignment_groups_read on public.assignment_groups for select to authenticated using(school_id=(select app_private.school_id()));
create policy recipients_read on public.assignment_recipients for select to authenticated using(school_id=(select app_private.school_id()));
create policy attempts_read on public.student_attempts for select to authenticated using(school_id=(select app_private.school_id()));
create policy answers_read on public.attempt_answers for select to authenticated using(school_id=(select app_private.school_id()));

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('activity-files','activity-files',false,5242880,array['text/plain']) on conflict(id) do nothing;
create policy jsx_read on storage.objects for select to authenticated using(
 bucket_id='activity-files' and exists(select 1 from public.activity_versions v where v.source_path=name and app_private.can_read_activity(v.activity_id))
);
create policy jsx_insert_once on storage.objects for insert to authenticated with check(
 bucket_id='activity-files' and exists(select 1 from public.activity_versions v where v.source_path=name and v.created_by=(select auth.uid()) and v.school_id=(select app_private.school_id()) and v.status='uploading')
);
-- No UPDATE or DELETE policy: saved source objects cannot be overwritten by the client.

-- Keep privileged bodies in the private schema. Exposed RPC wrappers run as the caller.
alter function public.create_school_workspace(text,text) set schema app_private;
alter function public.create_student_group(text) set schema app_private;
alter function public.import_students(jsonb) set schema app_private;
alter function public.reserve_activity_version(uuid,jsonb,jsonb) set schema app_private;
alter function public.finalize_activity_version(uuid) set schema app_private;
alter function public.assign_activity(uuid,uuid[]) set schema app_private;
alter function public.record_student_attempt(uuid,uuid,uuid,jsonb,uuid) set schema app_private;
create function public.create_school_workspace(p_school_name text,p_teacher_name text) returns uuid language sql security invoker set search_path='' as $$ select app_private.create_school_workspace(p_school_name,p_teacher_name); $$;
create function public.create_student_group(p_name text) returns uuid language sql security invoker set search_path='' as $$ select app_private.create_student_group(p_name); $$;
create function public.import_students(p_rows jsonb) returns integer language sql security invoker set search_path='' as $$ select app_private.import_students(p_rows); $$;
create function public.reserve_activity_version(p_activity_id uuid,p_definition jsonb,p_prompts jsonb) returns jsonb language sql security invoker set search_path='' as $$ select app_private.reserve_activity_version(p_activity_id,p_definition,p_prompts); $$;
create function public.finalize_activity_version(p_version_id uuid) returns void language sql security invoker set search_path='' as $$ select app_private.finalize_activity_version(p_version_id); $$;
create function public.assign_activity(p_version_id uuid,p_group_ids uuid[]) returns jsonb language sql security invoker set search_path='' as $$ select app_private.assign_activity(p_version_id,p_group_ids); $$;
create function public.record_student_attempt(p_attempt_id uuid,p_student_id uuid,p_version_id uuid,p_answers jsonb,p_assignment_id uuid default null) returns uuid language sql security invoker set search_path='' as $$ select app_private.record_student_attempt(p_attempt_id,p_student_id,p_version_id,p_answers,p_assignment_id); $$;
revoke all on all functions in schema app_private from public,anon;
grant execute on all functions in schema app_private to authenticated;
revoke all on function public.create_school_workspace(text,text),public.create_student_group(text),public.import_students(jsonb),public.reserve_activity_version(uuid,jsonb,jsonb),public.finalize_activity_version(uuid),public.assign_activity(uuid,uuid[]),public.record_student_attempt(uuid,uuid,uuid,jsonb,uuid) from public,anon;
grant execute on function public.create_school_workspace(text,text),public.create_student_group(text),public.import_students(jsonb),public.reserve_activity_version(uuid,jsonb,jsonb),public.finalize_activity_version(uuid),public.assign_activity(uuid,uuid[]),public.record_student_attempt(uuid,uuid,uuid,jsonb,uuid) to authenticated;
commit;
