-- Registro de respostas dos jogos por aluno, para pesquisa educacional.
-- Append-only, com o mesmo contrato das demais telemetrias: o aluno só insere,
-- nunca lê; a leitura é exclusiva de administrador via função com definer.
-- Não aplicar automaticamente: esta migration é executada pelo lane de Ops.

-- ============================================================
-- 1. Rotas dos módulos entram no catálogo canônico
-- ============================================================
-- Sem isso a telemetria semântica já existente recusa qualquer evento vindo das
-- páginas de jogo, e a jornada do aluno fica com um buraco exatamente onde a
-- pesquisa quer olhar.

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
      '/protected/modulos/laboratorio-de-gestao'
    )
  );

-- ============================================================
-- 2. Partidas
-- ============================================================

create table if not exists public.game_session (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  game_key text not null check (game_key in (
    'orcamento-familiar', 'cidadania-financeira', 'primeiro-passo'
  )),
  content_version text not null check (char_length(content_version) between 1 and 40),
  scope_key text null check (scope_key is null or scope_key ~ '^[a-z0-9_-]{1,40}$'),
  client_session_id uuid not null,
  started_at timestamptz not null,
  finished_at timestamptz null,
  status text not null default 'em_andamento'
    check (status in ('em_andamento', 'concluida')),
  answered_count integer not null default 0 check (answered_count between 0 and 500),
  score integer null check (score is null or score between -100000 and 100000),
  max_score integer null check (max_score is null or max_score between 0 and 100000),
  outcome_key text null check (outcome_key is null or outcome_key ~ '^[a-z0-9_-]{1,40}$'),
  duration_seconds integer null check (duration_seconds is null or duration_seconds between 0 and 86400),
  device_info jsonb not null default '{}'::jsonb check (
    jsonb_typeof(device_info) = 'object' and octet_length(device_info::text) <= 512
  ),
  summary jsonb not null default '{}'::jsonb check (
    jsonb_typeof(summary) = 'object' and octet_length(summary::text) <= 2048
  ),
  received_at timestamptz not null default now(),
  constraint game_session_finished_coerente check (
    (status = 'concluida') = (finished_at is not null)
  )
);

create index if not exists game_session_user_started_idx
  on public.game_session (user_id, started_at desc);
create index if not exists game_session_game_started_idx
  on public.game_session (game_key, started_at desc);
create index if not exists game_session_status_idx
  on public.game_session (game_key, status, started_at desc);

-- ============================================================
-- 3. Respostas
-- ============================================================

create table if not exists public.game_answer (
  id uuid primary key,
  session_id uuid not null references public.game_session(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  game_key text not null check (game_key in (
    'orcamento-familiar', 'cidadania-financeira', 'primeiro-passo'
  )),
  content_version text not null check (char_length(content_version) between 1 and 40),
  scope_key text null check (scope_key is null or scope_key ~ '^[a-z0-9_-]{1,40}$'),
  step_index integer not null check (step_index between 0 and 500),
  question_key text not null check (question_key ~ '^[a-zA-Z0-9_.-]{1,60}$'),
  answer_kind text not null check (answer_kind in (
    'escolha', 'multipla', 'numero', 'escala', 'texto'
  )),
  answer_key text null check (answer_key is null or char_length(answer_key) between 1 and 120),
  answer_keys text[] null check (answer_keys is null or array_length(answer_keys, 1) <= 30),
  answer_number numeric null check (answer_number is null or abs(answer_number) <= 1000000000),
  answer_text text null check (answer_text is null or char_length(answer_text) <= 400),
  outcome text null check (outcome is null or outcome in ('correct', 'partial', 'wrong')),
  points integer null check (points is null or points between -1000 and 1000),
  elapsed_ms integer null check (elapsed_ms is null or elapsed_ms between 0 and 3600000),
  answered_at timestamptz not null,
  received_at timestamptz not null default now(),
  constraint game_answer_valor_presente check (
    answer_key is not null
    or answer_keys is not null
    or answer_number is not null
    or answer_text is not null
  ),
  constraint game_answer_texto_so_em_campo_aberto check (
    answer_text is null or answer_kind = 'texto'
  )
);

create index if not exists game_answer_session_idx
  on public.game_answer (session_id, step_index);
create index if not exists game_answer_user_answered_idx
  on public.game_answer (user_id, answered_at desc);
create index if not exists game_answer_game_question_idx
  on public.game_answer (game_key, question_key, answered_at desc);
create index if not exists game_answer_outcome_idx
  on public.game_answer (game_key, outcome, answered_at desc) where outcome is not null;

-- ============================================================
-- 4. RLS — o aluno não toca nas tabelas diretamente
-- ============================================================
-- Nenhum privilégio direto é concedido: a única porta de escrita é a função de
-- ingestão, que carimba a identidade de quem chamou. RLS fica ligada com as
-- políticas escritas como segunda barreira, caso um privilégio seja concedido
-- por engano no futuro.

alter table public.game_session enable row level security;
alter table public.game_answer enable row level security;

drop policy if exists "game_session_insert_own" on public.game_session;
create policy "game_session_insert_own"
  on public.game_session for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "game_session_update_own" on public.game_session;
create policy "game_session_update_own"
  on public.game_session for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "game_answer_insert_own" on public.game_answer;
create policy "game_answer_insert_own"
  on public.game_answer for insert to authenticated
  with check (user_id = auth.uid());

revoke all on table public.game_session from public, anon, authenticated;
revoke all on table public.game_answer from public, anon, authenticated;

-- ============================================================
-- 5. Ingestão idempotente
-- ============================================================
-- Uma chamada carrega a partida e o lote de respostas. Roda com privilégio
-- próprio porque precisa conferir o dono da partida e reconhecer um envio
-- repetido — duas leituras que o aluno não tem, e não deve ter, sobre o acervo.
-- Em troca, o user_id nunca vem do cliente: é sempre auth.uid().
-- Cada linha entra no seu próprio bloco: um registro repetido pelo retry é
-- ignorado em vez de derrubar o lote, e uma linha malformada não leva as outras
-- junto.

create or replace function public.ingest_game_events(
  p_sessions jsonb default '[]'::jsonb,
  p_answers jsonb default '[]'::jsonb
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  sessions_written integer := 0;
  answers_written integer := 0;
  sessions_rejected integer := 0;
  answers_rejected integer := 0;
  inserted_rows integer := 0;
  session_row record;
  answer_row record;
begin
  if auth.uid() is null then
    raise exception 'Usuário não autenticado.' using errcode = '42501';
  end if;
  if jsonb_typeof(p_sessions) <> 'array' or jsonb_typeof(p_answers) <> 'array' then
    raise exception 'Lote de jogo inválido.' using errcode = '22023';
  end if;
  if jsonb_array_length(p_sessions) > 10 or jsonb_array_length(p_answers) > 40 then
    raise exception 'Lote de jogo excede o tamanho permitido.' using errcode = '22023';
  end if;
  if jsonb_array_length(p_sessions) = 0 and jsonb_array_length(p_answers) = 0 then
    raise exception 'Lote de jogo vazio.' using errcode = '22023';
  end if;

  for session_row in select * from jsonb_to_recordset(p_sessions) as row(
    id uuid,
    game_key text,
    content_version text,
    scope_key text,
    client_session_id uuid,
    started_at timestamptz,
    finished_at timestamptz,
    status text,
    answered_count integer,
    score integer,
    max_score integer,
    outcome_key text,
    duration_seconds integer,
    device_info jsonb,
    summary jsonb
  )
  loop
    begin
      insert into public.game_session as existente (
        id, user_id, game_key, content_version, scope_key, client_session_id,
        started_at, finished_at, status, answered_count, score, max_score,
        outcome_key, duration_seconds, device_info, summary
      ) values (
        session_row.id, auth.uid(), session_row.game_key, session_row.content_version,
        session_row.scope_key, session_row.client_session_id, session_row.started_at,
        session_row.finished_at, coalesce(session_row.status, 'em_andamento'),
        coalesce(session_row.answered_count, 0), session_row.score, session_row.max_score,
        session_row.outcome_key, session_row.duration_seconds,
        coalesce(session_row.device_info, '{}'::jsonb), coalesce(session_row.summary, '{}'::jsonb)
      )
      on conflict (id) do update set
        finished_at = coalesce(excluded.finished_at, existente.finished_at),
        status = case
          when existente.status = 'concluida' then 'concluida'
          else excluded.status
        end,
        answered_count = greatest(existente.answered_count, excluded.answered_count),
        score = coalesce(excluded.score, existente.score),
        max_score = coalesce(excluded.max_score, existente.max_score),
        outcome_key = coalesce(excluded.outcome_key, existente.outcome_key),
        duration_seconds = coalesce(excluded.duration_seconds, existente.duration_seconds),
        summary = case
          when excluded.summary = '{}'::jsonb then existente.summary
          else excluded.summary
        end
      where existente.user_id = auth.uid();
      get diagnostics inserted_rows = row_count;
      if inserted_rows = 0 then
        -- Chave já ocupada por outro aluno: nada é escrito e a partida entra na
        -- contagem de rejeição, em vez de ser reportada como gravada.
        sessions_rejected := sessions_rejected + 1;
      else
        sessions_written := sessions_written + inserted_rows;
      end if;
    exception when others then
      -- Uma linha malformada não leva o lote junto, mas é contada: um número de
      -- rejeição subindo é o sinal de que o cliente mudou e ninguém avisou.
      sessions_rejected := sessions_rejected + 1;
    end;
  end loop;

  for answer_row in select * from jsonb_to_recordset(p_answers) as row(
    id uuid,
    session_id uuid,
    game_key text,
    content_version text,
    scope_key text,
    step_index integer,
    question_key text,
    answer_kind text,
    answer_key text,
    answer_keys text[],
    answer_number numeric,
    answer_text text,
    outcome text,
    points integer,
    elapsed_ms integer,
    answered_at timestamptz
  )
  loop
    begin
      insert into public.game_answer (
        id, session_id, user_id, game_key, content_version, scope_key, step_index,
        question_key, answer_kind, answer_key, answer_keys, answer_number,
        answer_text, outcome, points, elapsed_ms, answered_at
      )
      select
        answer_row.id, answer_row.session_id, auth.uid(), answer_row.game_key,
        answer_row.content_version, answer_row.scope_key, answer_row.step_index,
        answer_row.question_key, answer_row.answer_kind, answer_row.answer_key,
        answer_row.answer_keys, answer_row.answer_number, answer_row.answer_text,
        answer_row.outcome, answer_row.points, answer_row.elapsed_ms, answer_row.answered_at
      where exists (
        select 1 from public.game_session owner
        where owner.id = answer_row.session_id and owner.user_id = auth.uid()
      )
      on conflict (id) do nothing;
      get diagnostics inserted_rows = row_count;
      answers_written := answers_written + inserted_rows;
    exception when others then
      answers_rejected := answers_rejected + 1;
    end;
  end loop;

  return jsonb_build_object(
    'sessions', sessions_written,
    'answers', answers_written,
    'sessions_rejected', sessions_rejected,
    'answers_rejected', answers_rejected
  );
end;
$$;

revoke execute on function public.ingest_game_events(jsonb, jsonb) from public, anon;
grant execute on function public.ingest_game_events(jsonb, jsonb) to authenticated;

-- ============================================================
-- 6. Leitura para pesquisa — somente administrador
-- ============================================================
-- Devolve as respostas em formato longo (uma linha por resposta), já com o
-- recorte de período e de jogo aplicado no banco. O texto aberto só sai quando
-- pedido explicitamente, para que uma exportação de rotina não carregue conteúdo
-- escrito pelo aluno sem necessidade.

create or replace function public.export_game_answers(
  p_game_key text default null,
  p_from timestamptz default null,
  p_to timestamptz default null,
  p_include_text boolean default false,
  p_limit integer default 50000,
  p_offset integer default 0
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  total_rows bigint;
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
  if p_game_key is not null and p_game_key not in (
    'orcamento-familiar', 'cidadania-financeira', 'primeiro-passo'
  ) then
    raise exception 'Jogo inválido.' using errcode = '22023';
  end if;
  if p_limit is null or p_limit < 1 or p_limit > 50000 then
    raise exception 'Limite de exportação inválido.' using errcode = '22023';
  end if;
  if p_offset is null or p_offset < 0 then
    raise exception 'Deslocamento de exportação inválido.' using errcode = '22023';
  end if;

  select count(*) into total_rows
  from public.game_answer answer
  where (p_game_key is null or answer.game_key = p_game_key)
    and (p_from is null or answer.answered_at >= p_from)
    and (p_to is null or answer.answered_at <= p_to);

  return jsonb_build_object(
    'total', total_rows,
    'limit', p_limit,
    'offset', p_offset,
    'includes_text', p_include_text,
    'rows', coalesce((
      select jsonb_agg(to_jsonb(page) order by page.answered_at, page.session_id, page.step_index)
      from (
        select
          answer.id as answer_id,
          answer.session_id,
          answer.user_id,
          answer.game_key,
          answer.content_version,
          answer.scope_key,
          answer.step_index,
          answer.question_key,
          answer.answer_kind,
          answer.answer_key,
          answer.answer_keys,
          answer.answer_number,
          case when p_include_text then answer.answer_text else null end as answer_text,
          answer.outcome,
          answer.points,
          answer.elapsed_ms,
          answer.answered_at,
          session_row.started_at as session_started_at,
          session_row.finished_at as session_finished_at,
          session_row.status as session_status,
          session_row.score as session_score,
          session_row.max_score as session_max_score,
          session_row.outcome_key as session_outcome_key
        from public.game_answer answer
        join public.game_session session_row on session_row.id = answer.session_id
        where (p_game_key is null or answer.game_key = p_game_key)
          and (p_from is null or answer.answered_at >= p_from)
          and (p_to is null or answer.answered_at <= p_to)
        order by answer.answered_at, answer.session_id, answer.step_index
        limit p_limit offset p_offset
      ) page
    ), '[]'::jsonb)
  );
end;
$$;

revoke execute on function public.export_game_answers(text, timestamptz, timestamptz, boolean, integer, integer)
  from public, anon;
grant execute on function public.export_game_answers(text, timestamptz, timestamptz, boolean, integer, integer)
  to authenticated;

-- Panorama agregado: quantas partidas, quantos alunos distintos e qual o
-- desempenho por jogo no período. Serve para a tela administrativa sem precisar
-- trazer linha a linha.

create or replace function public.summarize_game_sessions(
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

  return coalesce((
    select jsonb_agg(to_jsonb(linha) order by linha.game_key)
    from (
      select
        session_row.game_key,
        count(*)::integer as sessions,
        count(*) filter (where session_row.status = 'concluida')::integer as sessions_concluidas,
        count(distinct session_row.user_id)::integer as students,
        sum(session_row.answered_count)::integer as answers,
        round(avg(session_row.duration_seconds) filter (
          where session_row.duration_seconds is not null
        ))::integer as media_duracao_segundos,
        round(avg(session_row.score) filter (where session_row.score is not null), 2) as media_pontuacao,
        max(session_row.started_at) as ultima_partida
      from public.game_session session_row
      where (p_from is null or session_row.started_at >= p_from)
        and (p_to is null or session_row.started_at <= p_to)
      group by session_row.game_key
    ) linha
  ), '[]'::jsonb);
end;
$$;

revoke execute on function public.summarize_game_sessions(timestamptz, timestamptz) from public, anon;
grant execute on function public.summarize_game_sessions(timestamptz, timestamptz) to authenticated;
