-- Telemetria semântica educacional append-only.
-- Não aplicar automaticamente: esta migration é executada pelo lane de Ops.

create table if not exists public.telemetry_learning_event (
  event_id uuid primary key,
  occurred_at timestamptz not null,
  received_at timestamptz not null default now(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid not null,
  event_name text not null check (event_name in (
    'session_started', 'page_viewed', 'learning_path_opened', 'course_opened',
    'course_enrolled', 'lesson_opened', 'resource_opened', 'lesson_completed',
    'lesson_uncompleted', 'assignment_opened', 'assignment_submitted',
    'chat_message_sent', 'certificate_generated'
  )),
  route text not null check (
    route in (
      '/', '/artigos', '/auth', '/auth/complete-profile',
      '/auth/complete-teacher-profile', '/auth/error', '/auth/forgot-password',
      '/auth/reset-password', '/course', '/creditos', '/oauth/consent',
      '/privacidade', '/protected', '/protected/activitie', '/protected/perfil',
      '/termos', '/trilhas', '/validar'
    )
  ),
  learning_path_id uuid null,
  course_id uuid null,
  lesson_id uuid null,
  activity_id uuid null,
  metadata jsonb not null default '{}'::jsonb check (
    jsonb_typeof(metadata) = 'object'
    and octet_length(metadata::text) <= 2048
    and (
      (event_name = 'resource_opened'
        and metadata - 'resourceType' = '{}'::jsonb
        and metadata->>'resourceType' in ('video', 'link', 'arquivo', 'outro'))
      or (event_name = 'assignment_submitted'
        and metadata - 'submissionKind' = '{}'::jsonb
        and metadata->>'submissionKind' in ('nova', 'atualizacao'))
      or (event_name = 'chat_message_sent'
        and metadata - 'senderRole' = '{}'::jsonb
        and metadata->>'senderRole' in ('student', 'teacher', 'admin'))
      or (event_name = 'certificate_generated'
        and metadata = '{"source":"emissao"}'::jsonb)
      or (event_name not in ('resource_opened', 'assignment_submitted', 'chat_message_sent', 'certificate_generated')
        and metadata = '{}'::jsonb)
    )
  ),
  constraint telemetry_learning_event_required_context check (
    (event_name <> 'learning_path_opened' or learning_path_id is not null)
    and (event_name not in ('course_opened', 'course_enrolled', 'certificate_generated') or course_id is not null)
    and (event_name not in ('lesson_opened', 'resource_opened', 'lesson_completed', 'lesson_uncompleted') or (course_id is not null and lesson_id is not null))
    and (event_name not in ('assignment_opened', 'assignment_submitted', 'chat_message_sent') or activity_id is not null)
  )
);

create index if not exists telemetry_learning_event_received_at_idx
  on public.telemetry_learning_event (received_at desc);
create index if not exists telemetry_learning_event_user_received_idx
  on public.telemetry_learning_event (user_id, received_at desc);
create index if not exists telemetry_learning_event_name_received_idx
  on public.telemetry_learning_event (event_name, received_at desc);
create index if not exists telemetry_learning_event_learning_path_idx
  on public.telemetry_learning_event (learning_path_id, received_at desc) where learning_path_id is not null;
create index if not exists telemetry_learning_event_course_idx
  on public.telemetry_learning_event (course_id, received_at desc) where course_id is not null;
create index if not exists telemetry_learning_event_lesson_idx
  on public.telemetry_learning_event (lesson_id, received_at desc) where lesson_id is not null;
create index if not exists telemetry_learning_event_activity_idx
  on public.telemetry_learning_event (activity_id, received_at desc) where activity_id is not null;

alter table public.telemetry_learning_event enable row level security;

drop policy if exists "learning_event_insert_own" on public.telemetry_learning_event;
create policy "learning_event_insert_own"
  on public.telemetry_learning_event
  for insert
  to authenticated
  with check (user_id = auth.uid());

revoke all on table public.telemetry_learning_event from public, anon, authenticated;
grant insert on table public.telemetry_learning_event to authenticated;

create or replace function public.ingest_learning_events(p_events jsonb)
returns integer
language plpgsql
volatile
security invoker
set search_path = 'public'
as $$
declare
  inserted_count integer := 0;
  event_row record;
begin
  if auth.uid() is null then
    raise exception 'Usuário não autenticado.' using errcode = '42501';
  end if;
  if jsonb_typeof(p_events) <> 'array'
     or jsonb_array_length(p_events) < 1
     or jsonb_array_length(p_events) > 20 then
    raise exception 'Lote de telemetria inválido.' using errcode = '22023';
  end if;

  for event_row in select * from jsonb_to_recordset(p_events) as row(
    event_id uuid,
    occurred_at timestamptz,
    session_id uuid,
    event_name text,
    route text,
    learning_path_id uuid,
    course_id uuid,
    lesson_id uuid,
    activity_id uuid,
    metadata jsonb
  )
  loop
    begin
      insert into public.telemetry_learning_event (
        event_id, occurred_at, user_id, session_id, event_name, route,
        learning_path_id, course_id, lesson_id, activity_id, metadata
      ) values (
        event_row.event_id, event_row.occurred_at, auth.uid(), event_row.session_id,
        event_row.event_name, event_row.route, event_row.learning_path_id,
        event_row.course_id, event_row.lesson_id, event_row.activity_id,
        coalesce(event_row.metadata, '{}'::jsonb)
      );
      inserted_count := inserted_count + 1;
    exception when unique_violation then
      -- Retry idempotente: o aluno mantém somente INSERT e não ganha leitura da chave.
      null;
    end;
  end loop;

  return inserted_count;
end;
$$;

revoke execute on function public.ingest_learning_events(jsonb) from public, anon;
grant execute on function public.ingest_learning_events(jsonb) to authenticated;
