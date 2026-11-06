-- Números do site e do app do Laboratório de Gestão (LG2) para o relatório da extensão.
-- Não aplicar automaticamente: executada pelo lane de Ops.
--
-- 1. A telemetria semântica passa a aceitar três eventos vindos das páginas
--    estáticas do LG2 (public/lg2/...): módulo aberto, módulo concluído e
--    jornada concluída. O único dado extra é o número do módulo (1 a 10);
--    nenhuma resposta do aluno sai do aparelho.
-- 2. public.get_site_metrics(p_from, p_to) devolve, só para administrador,
--    cadastros novos, acessos por produto e o uso do LG2, sem nomes nem e-mails.
--
-- Os CHECKs são recriados com os MESMOS nomes que o Postgres deu às restrições
-- em linha de 20260902 (e que 20260914 já recriou para a rota):
-- telemetry_learning_event_event_name_check, _route_check e, para metadata,
-- telemetry_learning_event_check. A lista de rotas parte exatamente do estado
-- de 20260914. Idempotente.

-- ============================================================
-- 1. Catálogo de eventos
-- ============================================================

alter table public.telemetry_learning_event
  drop constraint if exists telemetry_learning_event_event_name_check;

alter table public.telemetry_learning_event
  add constraint telemetry_learning_event_event_name_check check (event_name in (
    'session_started', 'page_viewed', 'learning_path_opened', 'course_opened',
    'course_enrolled', 'lesson_opened', 'resource_opened', 'lesson_completed',
    'lesson_uncompleted', 'assignment_opened', 'assignment_submitted',
    'chat_message_sent', 'certificate_generated',
    'lg2_module_opened', 'lg2_module_completed', 'lg2_journey_completed'
  ));

-- ============================================================
-- 2. Catálogo de rotas (20260914 + páginas do LG2)
-- ============================================================

alter table public.telemetry_learning_event
  drop constraint if exists telemetry_learning_event_route_check;

alter table public.telemetry_learning_event
  add constraint telemetry_learning_event_route_check check (
    route in (
      '/', '/artigos', '/auth', '/auth/complete-profile',
      '/auth/complete-teacher-profile', '/auth/error', '/auth/forgot-password',
      '/auth/reset-password', '/course', '/creditos', '/oauth/consent',
      '/privacidade', '/protected', '/protected/activitie', '/protected/perfil',
      '/termos', '/trilhas', '/validar',
      '/protected/modulos/educacao-financeira',
      '/protected/modulos/educacao-financeira/financity',
      '/protected/modulos/educacao-financeira/cidadania-financeira',
      '/protected/modulos/laboratorio-de-gestao',
      '/lg2', '/lg2/jornada'
    )
  );

-- ============================================================
-- 3. Metadata: módulo é um inteiro de 1 a 10 e nada mais
-- ============================================================

-- O CHECK de metadata de 20260902 cita duas colunas (event_name e metadata),
-- então o Postgres o batizou de telemetry_learning_event_check, sem o nome da
-- coluna. O bloco abaixo remove esse nome e, por garantia, qualquer outro CHECK
-- de metadata (reconhecido pelo texto 'resourceType'), para nunca sobrarem dois.

alter table public.telemetry_learning_event
  drop constraint if exists telemetry_learning_event_check;

do $$
declare
  restricao record;
begin
  for restricao in
    select conname from pg_constraint
    where conrelid = 'public.telemetry_learning_event'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) like '%resourceType%'
  loop
    execute format('alter table public.telemetry_learning_event drop constraint %I', restricao.conname);
  end loop;
end;
$$;

alter table public.telemetry_learning_event
  add constraint telemetry_learning_event_check check (
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
      -- coalesce: sem a chave, a comparação daria NULL e o CHECK deixaria passar.
      or coalesce(event_name in ('lg2_module_opened', 'lg2_module_completed')
        and metadata - 'modulo' = '{}'::jsonb
        and jsonb_typeof(metadata->'modulo') = 'number'
        and metadata->>'modulo' in ('1', '2', '3', '4', '5', '6', '7', '8', '9', '10'), false)
      or (event_name not in (
            'resource_opened', 'assignment_submitted', 'chat_message_sent',
            'certificate_generated', 'lg2_module_opened', 'lg2_module_completed')
        and metadata = '{}'::jsonb)
    )
  );

-- ============================================================
-- 4. Números do site — somente administrador
-- ============================================================
-- Período pelo received_at (relógio do servidor), igual ao Analytics. Devolve
-- só contagens: nenhum id de usuário, nome, e-mail ou resposta.

create or replace function public.get_site_metrics(
  p_from timestamptz default null,
  p_to timestamptz default null
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
  if p_from is not null and p_to is not null and p_from > p_to then
    raise exception 'Período inválido.' using errcode = '22023';
  end if;

  return (
    with periodo as (
      select event_row.user_id, event_row.event_name, event_row.route, event_row.metadata
      from public.telemetry_learning_event event_row
      where (p_from is null or event_row.received_at >= p_from)
        and (p_to is null or event_row.received_at <= p_to)
    ),
    produtos(ordem, rota) as (
      values
        (1, '/protected/modulos/educacao-financeira'),
        (2, '/protected/modulos/educacao-financeira/financity'),
        (3, '/protected/modulos/educacao-financeira/cidadania-financeira'),
        (4, '/protected/modulos/laboratorio-de-gestao'),
        (5, '/lg2')
    ),
    lg2 as (
      select periodo.user_id, periodo.event_name, (periodo.metadata->>'modulo')::integer as modulo
      from periodo
      where periodo.event_name in ('lg2_module_opened', 'lg2_module_completed', 'lg2_journey_completed')
    )
    select jsonb_build_object(
      'novosCadastros', (
        select count(*)::integer
        from auth.users usuario
        where (p_from is null or usuario.created_at >= p_from)
          and (p_to is null or usuario.created_at <= p_to)
      ),
      'acessosPorProduto', (
        select jsonb_agg(jsonb_build_object(
          'rota', produto.rota,
          'usuarios', (
            select count(distinct periodo.user_id)::integer from periodo
            where periodo.route = produto.rota
              and periodo.event_name in ('page_viewed', 'lg2_module_opened')
          ),
          'acessos', (
            select count(*)::integer from periodo
            where periodo.route = produto.rota
              and periodo.event_name in ('page_viewed', 'lg2_module_opened')
          )
        ) order by produto.ordem)
        from produtos produto
      ),
      'lg2', jsonb_build_object(
        'usuarios', (select count(distinct lg2.user_id)::integer from lg2),
        'porModulo', (
          select jsonb_agg(jsonb_build_object(
            'modulo', numero,
            'abriram', (
              select count(distinct lg2.user_id)::integer from lg2
              where lg2.event_name = 'lg2_module_opened' and lg2.modulo = numero
            ),
            'concluiram', (
              select count(distinct lg2.user_id)::integer from lg2
              where lg2.event_name = 'lg2_module_completed' and lg2.modulo = numero
            )
          ) order by numero)
          from generate_series(1, 10) as numero
        ),
        'jornadaConcluida', (
          select count(distinct lg2.user_id)::integer from lg2
          where lg2.event_name = 'lg2_journey_completed'
        )
      )
    )
  );
end;
$$;

revoke execute on function public.get_site_metrics(timestamptz, timestamptz) from public, anon;
grant execute on function public.get_site_metrics(timestamptz, timestamptz) to authenticated;
