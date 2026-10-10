-- Alocação de bolsistas nos encontros (spec 014).
--
-- Depende de 20260928_gestao_sem_valor_na_bolsa.sql (papéis acumulados e
-- desligamento). O levantamento em docs/plans/levantamento-alocacao.md é a
-- régua: cada linha da mensagem de alocação vira um encontro (`agenda`), cada
-- nome vira uma alocação (`agenda_bolsista`), e nada que já valeu é apagado.
--
--   - turma mínima: escola, modalidade, período e situação (o M1 completa);
--   - encontro com início e fim obrigatórios, cancelável com motivo;
--   - alocação com intervalo parcial, situação e quem cobriu;
--   - afastamento do bolsista por período;
--   - auditoria guarda o valor antes e depois, e só o banco escreve nela;
--   - `v_carga`: horas que contam, alocação por alocação.
--
-- Idempotente. Não aplicar automaticamente: produção é compartilhada e a
-- aplicação depende de aprovação explícita do Rafael. Código e migration entram
-- no ar juntos.

begin;

-- ---------------------------------------------------------------------------
-- Turma
-- ---------------------------------------------------------------------------
create table if not exists gestao.turma (
  id uuid primary key default gen_random_uuid(),
  escola_id uuid not null references gestao.escola (id) on delete restrict,
  nome text not null check (char_length(btrim(nome)) between 2 and 120),
  modalidade text not null check (char_length(btrim(modalidade)) between 2 and 80),
  inicio date not null,
  fim date,
  status text not null default 'prevista'
    check (status in ('prevista', 'em_andamento', 'encerrada', 'nao_abriu')),
  motivo text check (char_length(motivo) <= 500),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  criado_por uuid references auth.users (id) on delete set null,
  constraint turma_fim_depois_inicio check (fim is null or fim >= inicio),
  constraint turma_nao_abriu_com_motivo
    check (status <> 'nao_abriu' or char_length(btrim(coalesce(motivo, ''))) >= 3)
);

create index if not exists turma_escola on gestao.turma (escola_id);

-- ---------------------------------------------------------------------------
-- Encontro (`agenda`): horário somável, turma e cancelamento
-- ---------------------------------------------------------------------------
-- `horario text` fica, preenchido pelo banco a partir de início e fim: a tela
-- "Hoje" e o legado continuam lendo o texto.
alter table gestao.agenda add column if not exists turma_id uuid references gestao.turma (id) on delete restrict;
alter table gestao.agenda add column if not exists inicio time;
alter table gestao.agenda add column if not exists fim time;
alter table gestao.agenda add column if not exists cancelado_em timestamptz;
alter table gestao.agenda add column if not exists motivo_cancelamento text check (char_length(motivo_cancelamento) <= 500);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'agenda_fim_depois_inicio' and conrelid = 'gestao.agenda'::regclass
  ) then
    alter table gestao.agenda
      add constraint agenda_fim_depois_inicio check (fim is null or inicio is null or fim > inicio);
  end if;
end;
$$;

create index if not exists agenda_data on gestao.agenda (data);
create index if not exists agenda_turma on gestao.agenda (turma_id, data);

-- "8h às 12h", "9h30 às 12h": o mesmo texto da mensagem de hoje.
create or replace function gestao.hora_texto(p time)
returns text
language sql
immutable
set search_path = 'gestao'
as $$ select regexp_replace(to_char(p, 'FMHH24"h"MI'), 'h00$', 'h') $$;

create or replace function gestao.duracao_texto(p interval)
returns text
language sql
immutable
set search_path = 'gestao'
as $$
  select case
    when extract(minute from p) = 0 then extract(hour from p)::int || 'h'
    else extract(hour from p)::int || 'h' || lpad(extract(minute from p)::int::text, 2, '0')
  end
$$;

create or replace function gestao.agenda_antes_de_gravar()
returns trigger
language plpgsql
security invoker
set search_path = 'gestao'
as $$
begin
  -- Fim obrigatório ao lançar (decisão 4 da spec 014). Encontro antigo, sem
  -- horário somável, continua editável enquanto ninguém lhe der horário.
  if (tg_op = 'INSERT' or old.inicio is not null) and (new.inicio is null or new.fim is null) then
    raise exception 'gestao: informe o início e o fim do encontro' using errcode = '23514';
  end if;
  if new.inicio is not null and new.fim is not null then
    new.horario := gestao.hora_texto(new.inicio) || ' às ' || gestao.hora_texto(new.fim);
  end if;

  -- A escola do encontro é a da turma: as duas nunca divergem.
  if new.turma_id is not null then
    select t.escola_id into new.escola_id from gestao.turma t where t.id = new.turma_id;
  end if;

  if new.cancelado_em is not null then
    if char_length(btrim(coalesce(new.motivo_cancelamento, ''))) < 3 then
      raise exception 'gestao: cancelar um encontro exige o motivo' using errcode = '23514';
    end if;
    if tg_op = 'INSERT' or old.cancelado_em is null then
      new.cancelado_em := now();
    else
      new.cancelado_em := old.cancelado_em;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists agenda_antes_de_gravar on gestao.agenda;
create trigger agenda_antes_de_gravar
  before insert or update on gestao.agenda
  for each row execute function gestao.agenda_antes_de_gravar();

-- ---------------------------------------------------------------------------
-- Alocação (`agenda_bolsista`): parcial, situação e cobertura
-- ---------------------------------------------------------------------------
-- `carga text` continua alimentando o indicador 6; passa a ser escrita pelo
-- banco, a partir do intervalo efetivo.
alter table gestao.agenda_bolsista alter column carga set default '';
alter table gestao.agenda_bolsista add column if not exists inicio time;
alter table gestao.agenda_bolsista add column if not exists fim time;
alter table gestao.agenda_bolsista add column if not exists situacao text not null default 'prevista';
alter table gestao.agenda_bolsista add column if not exists coberto_por uuid
  references gestao.papel_membro (user_profile_id) on delete restrict;
alter table gestao.agenda_bolsista add column if not exists motivo text check (char_length(motivo) <= 500);
alter table gestao.agenda_bolsista add column if not exists atualizado_em timestamptz not null default now();

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'agenda_bolsista_situacao' and conrelid = 'gestao.agenda_bolsista'::regclass
  ) then
    alter table gestao.agenda_bolsista add constraint agenda_bolsista_situacao check (
      situacao in ('prevista', 'cumprida', 'faltou_avisou', 'faltou_sem_aviso', 'substituida', 'retirada')
    );
    alter table gestao.agenda_bolsista add constraint agenda_bolsista_substituida_aponta
      check (situacao <> 'substituida' or coberto_por is not null);
    alter table gestao.agenda_bolsista add constraint agenda_bolsista_retirada_com_motivo
      check (situacao <> 'retirada' or char_length(btrim(coalesce(motivo, ''))) >= 3);
    alter table gestao.agenda_bolsista add constraint agenda_bolsista_nao_cobre_a_si
      check (coberto_por is null or coberto_por <> bolsista_id);
    alter table gestao.agenda_bolsista add constraint agenda_bolsista_parcial_completo
      check ((inicio is null) = (fim is null) and (fim is null or fim > inicio));
  end if;
end;
$$;

create or replace function gestao.alocacao_antes_de_gravar()
returns trigger
language plpgsql
security invoker
set search_path = 'gestao'
as $$
declare
  encontro gestao.agenda%rowtype;
begin
  if tg_op = 'UPDATE' then
    -- Quem e onde não mudam: trocar de pessoa é substituir, para o histórico
    -- dizer quem saiu.
    new.agenda_id := old.agenda_id;
    new.bolsista_id := old.bolsista_id;
    new.criado_em := old.criado_em;
  end if;

  select * into encontro from gestao.agenda a where a.id = new.agenda_id;

  if tg_op = 'INSERT' then
    if encontro.cancelado_em is not null then
      raise exception 'gestao: o encontro foi cancelado e não recebe alocação' using errcode = '23514';
    end if;
    if exists (
      select 1 from gestao.papel_membro m
      where m.user_profile_id = new.bolsista_id and m.desligado_em is not null
    ) then
      raise exception 'gestao: esta pessoa foi desligada e não pode ser alocada' using errcode = '23514';
    end if;
  end if;

  if new.inicio is not null and (
       encontro.inicio is null or new.inicio < encontro.inicio or new.fim > encontro.fim
     ) then
    raise exception 'gestao: o horário parcial precisa caber dentro do encontro' using errcode = '23514';
  end if;

  if encontro.inicio is not null then
    new.carga := gestao.duracao_texto(coalesce(new.fim, encontro.fim) - coalesce(new.inicio, encontro.inicio));
  end if;
  return new;
end;
$$;

drop trigger if exists alocacao_antes_de_gravar on gestao.agenda_bolsista;
create trigger alocacao_antes_de_gravar
  before insert or update on gestao.agenda_bolsista
  for each row execute function gestao.alocacao_antes_de_gravar();

drop trigger if exists tocar_atualizado_em on gestao.agenda_bolsista;
create trigger tocar_atualizado_em before update on gestao.agenda_bolsista
  for each row execute function gestao.tocar_atualizado_em();

-- Substituir numa transação só: quem sai fica registrado como substituído e
-- quem entra ganha a própria alocação. Invoker: a RLS decide quem pode.
create or replace function gestao.substituir_alocacao(p_alocacao uuid, p_substituto uuid, p_motivo text default null)
returns uuid
language plpgsql
security invoker
set search_path = 'gestao'
as $$
declare
  v_agenda uuid;
  v_nova uuid;
begin
  update gestao.agenda_bolsista
    set situacao = 'substituida',
        coberto_por = p_substituto,
        motivo = nullif(btrim(coalesce(p_motivo, '')), ''),
        inicio = null,
        fim = null
    where id = p_alocacao
      and situacao in ('prevista', 'faltou_avisou', 'faltou_sem_aviso')
    returning agenda_id into v_agenda;
  if v_agenda is null then
    raise exception 'gestao: só dá para substituir uma alocação prevista ou com falta' using errcode = '23514';
  end if;

  insert into gestao.agenda_bolsista (agenda_id, bolsista_id)
    values (v_agenda, p_substituto)
    returning id into v_nova;
  return v_nova;
end;
$$;

revoke execute on function gestao.substituir_alocacao(uuid, uuid, text) from public, anon;
grant execute on function gestao.substituir_alocacao(uuid, uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Afastamento
-- ---------------------------------------------------------------------------
-- Só período e motivo curto: nada de atestado ou dado de saúde (spec 014,
-- fora de escopo "dado sensível").
create table if not exists gestao.afastamento (
  id uuid primary key default gen_random_uuid(),
  bolsista_id uuid not null references gestao.papel_membro (user_profile_id) on delete restrict,
  inicio date not null,
  fim date not null,
  motivo text not null check (char_length(btrim(motivo)) between 3 and 300),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  criado_por uuid references auth.users (id) on delete set null,
  constraint afastamento_fim_depois_inicio check (fim >= inicio)
);

create index if not exists afastamento_bolsista on gestao.afastamento (bolsista_id, inicio);

-- ---------------------------------------------------------------------------
-- Autoria, carimbo e auditoria nas tabelas novas
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array['turma', 'afastamento'] loop
    execute format('alter table gestao.%I enable row level security', t);
    execute format('alter table gestao.%I force row level security', t);
    execute format('drop trigger if exists definir_autoria on gestao.%I', t);
    execute format(
      'create trigger definir_autoria before insert or update on gestao.%I '
      'for each row execute function gestao.definir_autoria()', t);
    execute format('drop trigger if exists tocar_atualizado_em on gestao.%I', t);
    execute format(
      'create trigger tocar_atualizado_em before update on gestao.%I '
      'for each row execute function gestao.tocar_atualizado_em()', t);
    execute format('drop trigger if exists registrar_auditoria on gestao.%I', t);
    execute format(
      'create trigger registrar_auditoria after insert or update or delete on gestao.%I '
      'for each row execute function gestao.registrar_auditoria()', t);
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- Auditoria com antes e depois, escrita só pelo banco
-- ---------------------------------------------------------------------------
-- O histórico do encontro precisa dizer o quê mudou, não só quem e quando.
-- E uma linha de histórico só vale se ninguém puder inventá-la: a trigger
-- passa a ser SECURITY DEFINER e `authenticated` perde o insert direto que a
-- spec 002 dava a qualquer membro.
alter table gestao.registro_auditoria add column if not exists antes jsonb;
alter table gestao.registro_auditoria add column if not exists depois jsonb;

create or replace function gestao.registrar_auditoria()
returns trigger
language plpgsql
security definer
set search_path = 'gestao'
as $$
declare
  linha jsonb;
begin
  if auth.uid() is null then
    raise exception 'gestao: auth.uid() e obrigatorio para auditoria' using errcode = '42501';
  end if;

  if tg_op = 'DELETE' then
    linha := to_jsonb(old);
  else
    linha := to_jsonb(new);
  end if;

  insert into gestao.registro_auditoria (tabela, registro_id, acao, autor, antes, depois)
  values (
    tg_table_name,
    -- `papel_membro` tem o usuário como chave; as demais tabelas têm `id`.
    coalesce(linha ->> 'id', linha ->> 'user_profile_id')::uuid,
    lower(tg_op),
    auth.uid(),
    case when tg_op <> 'INSERT' then to_jsonb(old) end,
    case when tg_op <> 'DELETE' then to_jsonb(new) end
  );
  return null;
end;
$$;

revoke execute on function gestao.registrar_auditoria() from public, anon, authenticated;

drop policy if exists "membro_insere_auditoria" on gestao.registro_auditoria;
revoke insert on table gestao.registro_auditoria from authenticated;

-- ---------------------------------------------------------------------------
-- Carga: horas que contam, alocação por alocação
-- ---------------------------------------------------------------------------
-- Conta o que foi cumprido; encontro passado sem marcação conta como cumprido
-- (decisão 3 da spec 014). Não conta: encontro cancelado, turma que não abriu,
-- falta, substituição, retirada e encontro ainda por vir.
-- ponytail: "passado" pela data do servidor (UTC); some da conta à noite em
-- São Paulo por até 3 h. Passar a data local se alguém notar.
create or replace view gestao.v_carga
with (security_invoker = true)
as
select
  ab.id as alocacao_id,
  ab.bolsista_id,
  a.id as agenda_id,
  a.data,
  a.escola_id,
  a.turma_id,
  ab.situacao,
  case
    when a.cancelado_em is null
     and a.inicio is not null
     and coalesce(t.status, '') <> 'nao_abriu'
     and (ab.situacao = 'cumprida' or (ab.situacao = 'prevista' and a.data <= current_date))
    then round(extract(epoch from coalesce(ab.fim, a.fim) - coalesce(ab.inicio, a.inicio)) / 3600.0, 2)
    else 0
  end as horas
from gestao.agenda_bolsista ab
join gestao.agenda a on a.id = ab.agenda_id
left join gestao.turma t on t.id = a.turma_id;

-- ---------------------------------------------------------------------------
-- RLS e grants
-- ---------------------------------------------------------------------------
-- Nesta spec só a coordenação usa a alocação. O bolsista continua lendo os
-- próprios encontros pelas policies da spec 003.
--
-- Encerrar, nunca apagar: ninguém recebe `delete` em turma, encontro,
-- alocação ou afastamento. Corrigir é editar; a auditoria guarda o antes.
revoke all on table gestao.turma from public, anon, authenticated;
revoke all on table gestao.afastamento from public, anon, authenticated;
grant select, insert, update on table gestao.turma to authenticated;
grant select, insert, update on table gestao.afastamento to authenticated;
revoke delete on table gestao.agenda from authenticated;
revoke delete on table gestao.agenda_bolsista from authenticated;
revoke all on table gestao.v_carga from public, anon;
grant select on table gestao.v_carga to authenticated;

drop policy if exists "coordenacao_tudo" on gestao.turma;
create policy "coordenacao_tudo" on gestao.turma
  as permissive for all to authenticated
  using (gestao.usuario_com_papel('coordenacao'))
  with check (gestao.usuario_com_papel('coordenacao'));

drop policy if exists "coordenacao_tudo" on gestao.afastamento;
create policy "coordenacao_tudo" on gestao.afastamento
  as permissive for all to authenticated
  using (gestao.usuario_com_papel('coordenacao'))
  with check (gestao.usuario_com_papel('coordenacao'));

commit;
