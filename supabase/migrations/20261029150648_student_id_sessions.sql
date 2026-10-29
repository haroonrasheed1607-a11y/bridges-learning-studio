-- Temporary Student-ID access: short-lived bearer sessions expose only that learner's work.
create table app_private.student_sessions (
 token_hash bytea primary key,
 student_id uuid not null references public.student_profiles(id) on delete cascade,
 expires_at timestamptz not null default now() + interval '8 hours'
);
create index student_sessions_student on app_private.student_sessions(student_id);
alter table app_private.student_sessions enable row level security;
revoke all on app_private.student_sessions from public, anon, authenticated;

-- Student submissions have no teacher Auth user; distinguish them explicitly.
alter table public.student_attempts alter column submitted_by drop not null;
alter table public.student_attempts add column submission_source text not null default 'teacher'
 check (submission_source in ('teacher','student'));
alter table public.student_attempts add constraint attempt_submitter
 check ((submission_source='teacher' and submitted_by is not null) or
        (submission_source='student' and submitted_by is null));

create function app_private.student_session_id(p_token text) returns uuid
language plpgsql stable security definer set search_path='' as $$
declare learner uuid;
begin
 if p_token is null or p_token !~ '^[a-f0-9]{64}$' then raise exception 'Student session expired. Sign in again.'; end if;
 select student_id into learner from app_private.student_sessions
 where token_hash=sha256(convert_to(p_token,'UTF8')) and expires_at>now();
 if learner is null then raise exception 'Student session expired. Sign in again.'; end if;
 return learner;
end $$;

create function app_private.student_login(p_student_code text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare learner public.student_profiles; matches integer; token text;
begin
 if length(trim(coalesce(p_student_code,''))) not between 1 and 160 then raise exception 'Enter your Student ID.'; end if;
 select count(*) into matches from public.student_profiles where lower(student_code)=lower(trim(p_student_code));
 if matches<>1 then raise exception 'Student ID not found or not unique. Please ask your teacher.'; end if;
 select * into learner from public.student_profiles where lower(student_code)=lower(trim(p_student_code));
 token:=replace(gen_random_uuid()::text,'-','')||replace(gen_random_uuid()::text,'-','');
 delete from app_private.student_sessions where student_id=learner.id and expires_at<=now();
 insert into app_private.student_sessions(token_hash,student_id) values(sha256(convert_to(token,'UTF8')),learner.id);
 return jsonb_build_object('token',token,'student',jsonb_build_object('name',learner.name,'studentCode',learner.student_code));
end $$;

create function app_private.student_workspace(p_token text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare learner uuid:=app_private.student_session_id(p_token); profile jsonb; work jsonb; results jsonb;
begin
 select jsonb_build_object('name',s.name,'studentCode',s.student_code,'school',c.name) into profile
 from public.student_profiles s join public.schools c on c.id=s.school_id where s.id=learner;
 select coalesce(jsonb_agg(jsonb_build_object('id',a.id,'versionNumber',v.version_number,'assignedAt',a.created_at,
 'definition',case when v.definition->>'mode'='assessment' then
 (v.definition-'answer'-'questions')||jsonb_build_object('questions',coalesce((select jsonb_agg(q.value-'answer') from jsonb_array_elements(v.definition->'questions') q),'[]'::jsonb))
 else v.definition end) order by a.created_at desc),'[]'::jsonb) into work
 from public.assignment_recipients r join public.assignments a on a.id=r.assignment_id
 join public.activity_versions v on v.id=a.version_id where r.student_id=learner and v.status='ready';
 select coalesce(jsonb_agg(jsonb_build_object('id',t.id,'assignmentId',t.assignment_id,'title',v.definition->>'title',
 'score',t.score,'possiblePoints',t.possible_points,'completedAt',t.completed_at) order by t.completed_at desc),'[]'::jsonb) into results
 from public.student_attempts t join public.activity_versions v on v.id=t.version_id where t.student_id=learner;
 return jsonb_build_object('student',profile,'activities',work,'results',results);
end $$;

create function app_private.student_submit(p_token text,p_assignment_id uuid,p_attempt_id uuid,p_answers jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare learner uuid:=app_private.student_session_id(p_token); v public.activity_versions; a public.assignments;
 q jsonb; earned numeric:=0; possible numeric:=0; points numeric; correct boolean; prior public.student_attempts;
begin
 select x.* into a from public.assignments x join public.assignment_recipients r on r.assignment_id=x.id
 where x.id=p_assignment_id and r.student_id=learner;
 if a.id is null then raise exception 'This activity is not assigned to you.'; end if;
 select * into prior from public.student_attempts where id=p_attempt_id and student_id=learner and assignment_id=a.id;
 if prior.id is not null then return jsonb_build_object('score',prior.score,'possiblePoints',prior.possible_points); end if;
 select * into v from public.activity_versions where id=a.version_id and status='ready';
 if v.definition->>'mode' is distinct from 'assessment' or jsonb_array_length(v.definition->'questions')=0 then raise exception 'Scored assessment required'; end if;
 if jsonb_typeof(p_answers) is distinct from 'object' then raise exception 'Answers are required'; end if;
 for q in select value from jsonb_array_elements(v.definition->'questions') loop
  points:=coalesce((q->>'points')::numeric,1);
  if points<=0 then raise exception 'Invalid question points'; end if;
  possible:=possible+points;
  if lower(trim(p_answers->>(q->>'id')))=lower(trim(q->>'answer')) then earned:=earned+points; end if;
 end loop;
 insert into public.student_attempts(id,school_id,student_id,version_id,assignment_id,score,possible_points,submitted_by,submission_source)
 values(p_attempt_id,a.school_id,learner,v.id,a.id,earned,possible,null,'student');
 for q in select value from jsonb_array_elements(v.definition->'questions') loop
  correct:=coalesce(lower(trim(p_answers->>(q->>'id')))=lower(trim(q->>'answer')),false);
  insert into public.attempt_answers(school_id,attempt_id,question_id,concept,response,correct,points)
  values(a.school_id,p_attempt_id,q->>'id',coalesce(q->>'concept',''),p_answers->(q->>'id'),correct,
   case when correct then coalesce((q->>'points')::numeric,1) else 0 end);
 end loop;
 return jsonb_build_object('score',earned,'possiblePoints',possible);
end $$;

create function app_private.student_logout(p_token text) returns void
language sql security definer set search_path='' as $$
 delete from app_private.student_sessions where token_hash=sha256(convert_to(p_token,'UTF8'));
$$;
revoke all on function app_private.student_session_id(text),app_private.student_login(text),app_private.student_workspace(text),app_private.student_submit(text,uuid,uuid,jsonb),app_private.student_logout(text) from public,anon,authenticated;
-- Only guarded entry points, never tables or internal identity helpers, are callable.
grant usage on schema app_private to anon;
grant execute on function app_private.student_login(text),app_private.student_workspace(text),app_private.student_submit(text,uuid,uuid,jsonb),app_private.student_logout(text) to anon,authenticated;
create function public.student_login(p_student_code text) returns jsonb language sql security invoker set search_path='' as $$ select app_private.student_login(p_student_code); $$;
create function public.student_workspace(p_token text) returns jsonb language sql security invoker set search_path='' as $$ select app_private.student_workspace(p_token); $$;
create function public.student_submit(p_token text,p_assignment_id uuid,p_attempt_id uuid,p_answers jsonb) returns jsonb language sql security invoker set search_path='' as $$ select app_private.student_submit(p_token,p_assignment_id,p_attempt_id,p_answers); $$;
create function public.student_logout(p_token text) returns void language sql security invoker set search_path='' as $$ select app_private.student_logout(p_token); $$;
revoke all on function public.student_login(text),public.student_workspace(text),public.student_submit(text,uuid,uuid,jsonb),public.student_logout(text) from public;
grant execute on function public.student_login(text),public.student_workspace(text),public.student_submit(text,uuid,uuid,jsonb),public.student_logout(text) to anon,authenticated;
