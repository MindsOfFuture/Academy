-- Modelo operacional de gestão interna do Minds of the Future.
-- Schema `gestao.*`, nasce inteiro em migration versionada (não repetir o ADR 008
-- no schema público). RLS própria por papel de membro do projeto — coordenação e
-- bolsista — isolada do papel do produto (admin/teacher/student em public.role).
--
-- Não aplicar automaticamente: esta migration é executada pelo lane de Ops.

begin;

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Schema
-- ---------------------------------------------------------------------------
create schema if not exists gestao;

-- ---------------------------------------------------------------------------
-- Papel de membro do projeto
-- ---------------------------------------------------------------------------
-- Vínculo user_profile_id -> papel, resolvido por auth.uid(). Não toca em
-- public.role: governança do projeto não é o mesmo eixo do produto público.
create table if not exists gestao.papel_membro (
  user_profile_id uuid primary key references public.user_profile (id) on delete cascade,
  papel text not null check (papel in ('coordenacao', 'bolsista')),
  concedido_por uuid references public.user_profile (id) on delete set null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Checagem de papel (SECURITY DEFINER, imune a RLS, sem caminho service role)
-- ---------------------------------------------------------------------------
create or replace function gestao.usuario_com_papel(p_papel text)
returns boolean
language plpgsql
stable
security definer
set search_path = 'gestao'
as $$
begin
  if auth.uid() is null then
    return false;
  end if;
  return exists (
    select 1
    from gestao.papel_membro m
    where m.user_profile_id = auth.uid()
      and m.papel = p_papel
  );
end;
$$;

revoke execute on function gestao.usuario_com_papel(text) from public, anon;
grant execute on function gestao.usuario_com_papel(text) to authenticated;

-- ---------------------------------------------------------------------------
-- Registro operacional
-- ---------------------------------------------------------------------------

create table if not exists gestao.escola (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  categoria text not null,
  cidade text not null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  criado_por uuid not null references auth.users (id) on delete set null
);

create table if not exists gestao.aluno (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  idade integer not null,
  escola_id uuid not null references gestao.escola (id) on delete cascade,
  categoria_escola text not null,
  ano_escolar text not null,
  modalidade text not null,
  execucao text not null,
  cidade text not null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  criado_por uuid not null references auth.users (id) on delete set null
);

-- Visita/reserva de uma escola: ônibus, dias, horários, modalidade, nº de alunos,
-- série, status e status geral do termo. Não guarda documento/CPF.
create table if not exists gestao.reserva (
  id uuid primary key default gen_random_uuid(),
  escola_id uuid not null references gestao.escola (id) on delete cascade,
  onibus boolean not null default false,
  dias text not null,
  horarios text not null,
  modalidade text not null,
  numero_alunos integer not null,
  serie text not null,
  status text not null check (status in ('planejada', 'confirmada', 'realizada', 'cancelada')),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  criado_por uuid not null references auth.users (id) on delete set null
);

-- Termo por aluno dentro de uma reserva: só status, sem imagem/CPF (minimização LGPD).
create table if not exists gestao.reserva_termo (
  id uuid primary key default gen_random_uuid(),
  reserva_id uuid not null references gestao.reserva (id) on delete cascade,
  aluno_id uuid not null references gestao.aluno (id) on delete cascade,
  status text not null check (status in ('pendente', 'arquivado')),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (reserva_id, aluno_id)
);

-- Agenda/alocação: data, escola, aulas, modalidade, horário.
create table if not exists gestao.agenda (
  id uuid primary key default gen_random_uuid(),
  data date not null,
  escola_id uuid not null references gestao.escola (id) on delete cascade,
  aulas text not null,
  modalidade text not null,
  horario text not null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  criado_por uuid not null references auth.users (id) on delete set null
);

-- Vínculo agenda <-> bolsista com a carga/horas da alocação.
create table if not exists gestao.agenda_bolsista (
  id uuid primary key default gen_random_uuid(),
  agenda_id uuid not null references gestao.agenda (id) on delete cascade,
  bolsista_id uuid not null references public.user_profile (id) on delete cascade,
  carga text not null,
  criado_em timestamptz not null default now(),
  unique (agenda_id, bolsista_id)
);

-- Aula/módulo realizado numa agenda (alimenta "aulas/módulos realizados").
create table if not exists gestao.aula (
  id uuid primary key default gen_random_uuid(),
  agenda_id uuid not null references gestao.agenda (id) on delete cascade,
  titulo text not null,
  realizada_em date,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

-- Presença por aula: aluno presente/ausente + status de assinatura do termo;
-- bolsista e professor (registrados como usuários) ficam marcados como presentes.
create table if not exists gestao.presenca (
  id uuid primary key default gen_random_uuid(),
  aula_id uuid not null references gestao.aula (id) on delete cascade,
  aluno_id uuid not null references gestao.aluno (id) on delete cascade,
  presente boolean not null default true,
  assinatura_status text not null check (assinatura_status in ('pendente', 'assinado')),
  bolsista_id uuid references public.user_profile (id) on delete set null,
  professor_id uuid references public.user_profile (id) on delete set null,
  criado_em timestamptz not null default now(),
  unique (aula_id, aluno_id)
);

-- Lista de presença enviada à escola: escola + até 30 nomes.
create table if not exists gestao.lista_enviada (
  id uuid primary key default gen_random_uuid(),
  escola_id uuid not null references gestao.escola (id) on delete cascade,
  reserva_id uuid references gestao.reserva (id) on delete set null,
  nomes text[] not null check (array_length(nomes, 1) between 1 and 30),
  criado_em timestamptz not null default now(),
  criado_por uuid not null references auth.users (id) on delete set null
);

-- Auditoria append-only das escritas no schema (rastreabilidade sem log externo).
create table if not exists gestao.registro_auditoria (
  id bigint generated always as identity primary key,
  tabela text not null,
  registro_id uuid not null,
  acao text not null check (acao in ('insert', 'update', 'delete')),
  autor uuid not null,
  ocorrido_em timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- RLS: permite leitura e escrita apenas a membros do projeto
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'gestao.papel_membro',
    'gestao.escola',
    'gestao.aluno',
    'gestao.reserva',
    'gestao.reserva_termo',
    'gestao.agenda',
    'gestao.agenda_bolsista',
    'gestao.aula',
    'gestao.presenca',
    'gestao.lista_enviada',
    'gestao.registro_auditoria'
  ]
  loop
    execute format('alter table %s enable row level security', t);
    execute format('alter table %s force row level security', t);
  end loop;
end;
$$;

-- Papel de membro: só coordenação lê e gere vínculos.
drop policy if exists "coordenacao_gerencia_papel" on gestao.papel_membro;
create policy "coordenacao_gerencia_papel"
  on gestao.papel_membro
  as permissive
  for all
  to authenticated
  using (gestao.usuario_com_papel('coordenacao'))
  with check (gestao.usuario_com_papel('coordenacao'));

-- Registro operacional: coordenação lê e escreve; bolsista lê e escreve o que
-- produz (presença, aula); ambos leem escolas/alunos para trabalhar.
create or replace function gestao.e_membro()
returns boolean language sql stable security invoker
as $$ select gestao.usuario_com_papel('coordenacao') or gestao.usuario_com_papel('bolsista') $$;
revoke execute on function gestao.e_membro() from public, anon;
grant execute on function gestao.e_membro() to authenticated;

do $$
declare
  t text;
begin
  foreach t in array array[
    'gestao.escola',
    'gestao.aluno',
    'gestao.reserva',
    'gestao.reserva_termo',
    'gestao.agenda',
    'gestao.agenda_bolsista',
    'gestao.aula',
    'gestao.presenca',
    'gestao.lista_enviada'
  ]
  loop
    execute format(
      'drop policy if exists "membro_ler_escrever" on %s; ' ||
      'create policy "membro_ler_escrever" on %s as permissive for all to authenticated ' ||
      'using (gestao.e_membro()) with check (gestao.e_membro())', t, t);
  end loop;
end;
$$;

-- Auditoria append-only: membro insere; só coordenação lê.
drop policy if exists "membro_insere_auditoria" on gestao.registro_auditoria;
create policy "membro_insere_auditoria"
  on gestao.registro_auditoria
  as permissive
  for insert
  to authenticated
  with check (gestao.e_membro());
drop policy if exists "coordenacao_le_auditoria" on gestao.registro_auditoria;
create policy "coordenacao_le_auditoria"
  on gestao.registro_auditoria
  as permissive
  for select
  to authenticated
  using (gestao.usuario_com_papel('coordenacao'));

-- ---------------------------------------------------------------------------
-- Grants: anon/public sem nada; authenticated usa via RPC/RLS das políticas.
-- ---------------------------------------------------------------------------
revoke all on schema gestao from public, anon;
revoke all on schema gestao from authenticated;
grant usage on schema gestao to authenticated;
alter default privileges in schema gestao revoke all on tables from public, anon;

do $$
declare
  t text;
begin
  foreach t in array array[
    'gestao.papel_membro',
    'gestao.escola',
    'gestao.aluno',
    'gestao.reserva',
    'gestao.reserva_termo',
    'gestao.agenda',
    'gestao.agenda_bolsista',
    'gestao.aula',
    'gestao.presenca',
    'gestao.lista_enviada',
    'gestao.registro_auditoria'
  ]
  loop
    execute format('revoke all on table %s from public, anon, authenticated', t);
  end loop;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'gestao.escola',
    'gestao.aluno',
    'gestao.reserva',
    'gestao.reserva_termo',
    'gestao.agenda',
    'gestao.agenda_bolsista',
    'gestao.aula',
    'gestao.presenca',
    'gestao.lista_enviada'
  ]
  loop
    execute format('grant select, insert, update, delete on table %s to authenticated', t);
  end loop;
end;
$$;

grant select, insert on table gestao.registro_auditoria to authenticated;
grant select, insert, update, delete on table gestao.papel_membro to authenticated;

-- ---------------------------------------------------------------------------
-- Relação que o indicador 6 percorre
-- ---------------------------------------------------------------------------
-- A alocação aponta o vínculo de membro, não só o perfil: sem esta chave
-- estrangeira a junção `agenda_bolsista` -> `papel_membro` não existe para o
-- PostgREST resolver, e o indicador de carga não tem como filtrar por papel.
-- `restrict` preserva o histórico: revogar um papel exige remover a alocação
-- antes, em vez de apagar a carga já registrada.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'agenda_bolsista_bolsista_id_papel_membro_fkey'
      and conrelid = 'gestao.agenda_bolsista'::regclass
  ) then
    alter table gestao.agenda_bolsista
      add constraint agenda_bolsista_bolsista_id_papel_membro_fkey
      foreign key (bolsista_id) references gestao.papel_membro (user_profile_id)
      on delete restrict;
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Autoria e carimbo de tempo derivados no servidor
-- ---------------------------------------------------------------------------
-- O cliente não decide quem escreveu nem quando: `criado_por` vem de
-- `auth.uid()` e fica imutável depois do insert, então enviar outro uuid no
-- corpo da requisição não falsifica a autoria. Toda escrita operacional precisa
-- de um JWT; sem `auth.uid()` a trigger rejeita a operação, sem fallback para um
-- valor controlado pelo cliente.
create or replace function gestao.definir_autoria()
returns trigger
language plpgsql
security invoker
set search_path = 'gestao'
as $$
begin
  if auth.uid() is null then
    raise exception 'gestao: auth.uid() e obrigatorio para autoria' using errcode = '42501';
  end if;

  if tg_op = 'INSERT' then
    new.criado_por := auth.uid();
  else
    new.criado_por := old.criado_por;
  end if;
  return new;
end;
$$;

create or replace function gestao.tocar_atualizado_em()
returns trigger
language plpgsql
security invoker
set search_path = 'gestao'
as $$
begin
  new.atualizado_em := now();
  return new;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'escola',
    'aluno',
    'reserva',
    'agenda',
    'lista_enviada'
  ]
  loop
    execute format('drop trigger if exists definir_autoria on gestao.%I', t);
    execute format(
      'create trigger definir_autoria before insert or update on gestao.%I '
      'for each row execute function gestao.definir_autoria()', t);
  end loop;

  foreach t in array array[
    'papel_membro',
    'escola',
    'aluno',
    'reserva',
    'reserva_termo',
    'agenda',
    'aula'
  ]
  loop
    execute format('drop trigger if exists tocar_atualizado_em on gestao.%I', t);
    execute format(
      'create trigger tocar_atualizado_em before update on gestao.%I '
      'for each row execute function gestao.tocar_atualizado_em()', t);
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- Auditoria: escrita registrada pelo banco, nunca pela aplicação
-- ---------------------------------------------------------------------------
-- Toda escrita no registro operacional deixa uma linha em
-- `gestao.registro_auditoria` com tabela, registro, ação e autor. Como é
-- trigger, não existe caminho de escrita que "esqueça" de auditar.
--
-- `autor` é not null e vem de `auth.uid()`: escrita sem JWT (migration/seed)
-- não tem autor a registrar e segue sem linha de auditoria.
create or replace function gestao.registrar_auditoria()
returns trigger
language plpgsql
security invoker
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

  insert into gestao.registro_auditoria (tabela, registro_id, acao, autor)
  values (
    tg_table_name,
    -- `papel_membro` tem o usuário como chave; as demais tabelas têm `id`.
    coalesce(linha ->> 'id', linha ->> 'user_profile_id')::uuid,
    lower(tg_op),
    auth.uid()
  );
  return null;
end;
$$;

-- Insert direto na auditoria também tem autor derivado, não informado.
create or replace function gestao.definir_autor_auditoria()
returns trigger
language plpgsql
security invoker
set search_path = 'gestao'
as $$
begin
  if auth.uid() is null then
    raise exception 'gestao: auth.uid() e obrigatorio para auditoria' using errcode = '42501';
  end if;
  new.autor := auth.uid();
  return new;
end;
$$;

-- Append-only de verdade: a falta de `grant update/delete` já barra
-- `authenticated`, mas a trigger barra também quem tem privilégio de sobra
-- (service role, dono da tabela) — uma linha de auditoria não se reescreve.
create or replace function gestao.rejeitar_escrita_auditoria()
returns trigger
language plpgsql
security invoker
set search_path = 'gestao'
as $$
begin
  raise exception 'gestao.registro_auditoria e append-only: % nao e permitido', lower(tg_op)
    using errcode = '42501';
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'papel_membro',
    'escola',
    'aluno',
    'reserva',
    'reserva_termo',
    'agenda',
    'agenda_bolsista',
    'aula',
    'presenca',
    'lista_enviada'
  ]
  loop
    execute format('drop trigger if exists registrar_auditoria on gestao.%I', t);
    execute format(
      'create trigger registrar_auditoria after insert or update or delete on gestao.%I '
      'for each row execute function gestao.registrar_auditoria()', t);
  end loop;
end;
$$;

drop trigger if exists definir_autor_auditoria on gestao.registro_auditoria;
create trigger definir_autor_auditoria
  before insert on gestao.registro_auditoria
  for each row execute function gestao.definir_autor_auditoria();

drop trigger if exists rejeitar_escrita_auditoria on gestao.registro_auditoria;
create trigger rejeitar_escrita_auditoria
  before update or delete on gestao.registro_auditoria
  for each row execute function gestao.rejeitar_escrita_auditoria();

commit;
