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

-- Snapshot transacional para o Analytics administrativo.
-- Uma única chamada lê o conjunto limitado de eventos e a classificação de
-- papéis sob o mesmo snapshot de statement, então inserção concorrente entra
-- inteira ou fica inteira de fora — nunca pela metade, como acontecia com a
-- travessia paginada em várias requisições.
-- ponytail: devolve até 100001 linhas num envelope jsonb; agregar dentro do
-- Postgres se esse teto for atingido.
create or replace function public.collect_learning_analytics_snapshot(
  p_scope text,
  p_id uuid default null,
  p_from timestamptz default null,
  p_to timestamptz default null,
  p_limit integer default 100000
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Usuário não autenticado.' using errcode = '42501';
  end if;
  if not exists (
    select 1
    from public.user_role link
    join public.role role_row on role_row.id = link.role_id
    where link.user_profile_id = auth.uid() and role_row.name = 'admin'
  ) then
    raise exception 'Acesso negado. Permissões de administrador necessárias.' using errcode = '42501';
  end if;
  if p_scope is null or p_scope not in ('global', 'path', 'course', 'student') then
    raise exception 'Escopo de Analytics inválido.' using errcode = '22023';
  end if;
  if (p_scope = 'global') <> (p_id is null) then
    raise exception 'Identificador de Analytics inválido.' using errcode = '22023';
  end if;
  if p_limit is null or p_limit < 1 or p_limit > 100000 then
    raise exception 'Limite de Analytics inválido.' using errcode = '22023';
  end if;

  return (
    with bounded as (
      select event_row.*
      from public.telemetry_learning_event event_row
      where (p_from is null or event_row.received_at >= p_from)
        and (p_to is null or event_row.received_at <= p_to)
        and (p_scope <> 'path' or event_row.learning_path_id = p_id)
        and (p_scope <> 'course' or event_row.course_id = p_id)
        and (p_scope <> 'student' or event_row.user_id = p_id)
      order by event_row.received_at desc, event_row.event_id desc
      limit p_limit + 1
    ),
    -- Precedência de papéis: admin ou professor nunca é aluno; ausência de
    -- vínculo vale como aluno, igual a fetchRoleForUser.
    students as (
      select distinct bounded.user_id
      from bounded
      where not exists (
        select 1
        from public.user_role link
        join public.role role_row on role_row.id = link.role_id
        where link.user_profile_id = bounded.user_id
          and role_row.name in ('admin', 'teacher')
      )
      and (
        not exists (
          select 1
          from public.user_role link
          join public.role role_row on role_row.id = link.role_id
          where link.user_profile_id = bounded.user_id
        )
        or exists (
          select 1
          from public.user_role link
          join public.role role_row on role_row.id = link.role_id
          where link.user_profile_id = bounded.user_id
            and role_row.name = 'student'
        )
      )
    ),
    measured as (select count(*)::integer as total from bounded)
    select jsonb_build_object(
      'overflow', measured.total > p_limit,
      'events', case when measured.total > p_limit then '[]'::jsonb else coalesce((
        select jsonb_agg(to_jsonb(page) order by page.received_at desc, page.event_id desc)
        from bounded page
      ), '[]'::jsonb) end,
      'student_user_ids', case when measured.total > p_limit then '[]'::jsonb else coalesce((
        select jsonb_agg(student.user_id) from students student
      ), '[]'::jsonb) end
    )
    from measured
  );
end;
$$;

revoke execute on function public.collect_learning_analytics_snapshot(text, uuid, timestamptz, timestamptz, integer)
  from public, anon;
grant execute on function public.collect_learning_analytics_snapshot(text, uuid, timestamptz, timestamptz, integer)
  to authenticated;
