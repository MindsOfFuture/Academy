-- Fundação da gestão interna (spec 003): equipe, bolsa, desligamento e a RLS
-- fatiada por papel e por alocação.
--
-- Parte do schema de 20260905_gestao_modelo_operacional.sql e o corrige em
-- três pontos provados em PGlite (docs/plans/gestao-dia-a-dia.md, "Validação"):
--   V3 — a policy `membro_ler_escrever` dava `for all` a qualquer bolsista;
--   V4 — a coordenação não enxerga `public.user_profile` pela RLS de produção;
--   V5 — quem já foi alocado não podia ser revogado e continuava com acesso.
--
-- Idempotente. Não aplicar automaticamente: produção é compartilhada e a
-- aplicação depende de aprovação explícita do Rafael.

begin;

-- ---------------------------------------------------------------------------
-- Desligamento: corta o acesso sem apagar o histórico
-- ---------------------------------------------------------------------------
alter table gestao.papel_membro add column if not exists desligado_em timestamptz;

-- As duas portas de papel passam a ignorar o vínculo desligado. Todas as
-- policies do schema passam por `usuario_com_papel`, então desligar derruba o
-- acesso a tudo de uma vez.
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
      and m.desligado_em is null
  );
end;
$$;

revoke execute on function gestao.usuario_com_papel(text) from public, anon;
grant execute on function gestao.usuario_com_papel(text) to authenticated;

create or replace function public.gestao_membro_papel()
returns text
language plpgsql
stable
security definer
set search_path = 'gestao', 'public'
as $$
begin
  if auth.uid() is null then
    return null;
  end if;
  return (
    select m.papel
    from gestao.papel_membro m
    where m.user_profile_id = auth.uid()
      and m.desligado_em is null
    limit 1
  );
end;
$$;

revoke execute on function public.gestao_membro_papel() from public, anon;
grant execute on function public.gestao_membro_papel() to authenticated;

-- Quem concedeu o papel vem do banco, não do corpo da requisição. Sem JWT
-- (a primeira coordenação, inserida por SQL) fica nulo.
create or replace function gestao.definir_concedido_por()
returns trigger
language plpgsql
security invoker
set search_path = 'gestao'
as $$
begin
  new.concedido_por := auth.uid();
  return new;
end;
$$;

drop trigger if exists definir_concedido_por on gestao.papel_membro;
create trigger definir_concedido_por
  before insert on gestao.papel_membro
  for each row execute function gestao.definir_concedido_por();

-- Ninguém tranca a equipe fora do sistema: a última pessoa ativa da
-- coordenação não pode ser desligada, rebaixada nem removida.
--
-- A exclusão em cascata vinda de `public.user_profile` (conta apagada) passa
-- direto: ela chega aqui com pg_trigger_depth() > 1, e travar a exclusão de
-- conta por causa do papel no projeto repetiria o defeito corrigido em
-- 1e55a63.
create or replace function gestao.proteger_ultima_coordenacao()
returns trigger
language plpgsql
security definer
set search_path = 'gestao'
as $$
begin
  if old.papel = 'coordenacao'
     and old.desligado_em is null
     and (
       (tg_op = 'DELETE' and pg_trigger_depth() = 1)
       or (tg_op = 'UPDATE' and (new.papel <> 'coordenacao' or new.desligado_em is not null))
     )
     and not exists (
       select 1
       from gestao.papel_membro m
       where m.papel = 'coordenacao'
         and m.desligado_em is null
         and m.user_profile_id <> old.user_profile_id
     )
  then
    raise exception 'gestao: o projeto precisa de ao menos uma pessoa ativa na coordenação'
      using errcode = '23514';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists proteger_ultima_coordenacao on gestao.papel_membro;
create trigger proteger_ultima_coordenacao
  before update or delete on gestao.papel_membro
  for each row execute function gestao.proteger_ultima_coordenacao();

-- ---------------------------------------------------------------------------
-- Bolsa
-- ---------------------------------------------------------------------------
create table if not exists gestao.bolsa (
  id uuid primary key default gen_random_uuid(),
  bolsista_id uuid not null references gestao.papel_membro (user_profile_id) on delete restrict,
  modalidade text not null check (modalidade in ('graduacao', 'mestrado', 'bdcti', 'critt', 'outra')),
  carga_semanal_horas numeric(4,1) not null check (carga_semanal_horas > 0 and carga_semanal_horas <= 40),
  valor_mensal numeric(10,2) not null check (valor_mensal >= 0),
  inicio date not null,
  fim date not null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  criado_por uuid references auth.users (id) on delete set null,
  constraint bolsa_fim_depois_inicio check (fim >= inicio)
);

create index if not exists bolsa_bolsista_vigencia on gestao.bolsa (bolsista_id, inicio desc);

alter table gestao.bolsa enable row level security;
alter table gestao.bolsa force row level security;

drop trigger if exists definir_autoria on gestao.bolsa;
create trigger definir_autoria before insert or update on gestao.bolsa
  for each row execute function gestao.definir_autoria();
drop trigger if exists tocar_atualizado_em on gestao.bolsa;
create trigger tocar_atualizado_em before update on gestao.bolsa
  for each row execute function gestao.tocar_atualizado_em();
drop trigger if exists registrar_auditoria on gestao.bolsa;
create trigger registrar_auditoria after insert or update or delete on gestao.bolsa
  for each row execute function gestao.registrar_auditoria();

revoke all on table gestao.bolsa from public, anon, authenticated;
grant select, insert, update, delete on table gestao.bolsa to authenticated;

drop policy if exists "coordenacao_tudo" on gestao.bolsa;
create policy "coordenacao_tudo" on gestao.bolsa
  as permissive for all to authenticated
  using (gestao.usuario_com_papel('coordenacao'))
  with check (gestao.usuario_com_papel('coordenacao'));

drop policy if exists "bolsista_le_a_propria" on gestao.bolsa;
create policy "bolsista_le_a_propria" on gestao.bolsa
  as permissive for select to authenticated
  using (bolsista_id = auth.uid() and gestao.usuario_com_papel('bolsista'));

-- ---------------------------------------------------------------------------
-- Escopo do bolsista: só o que é dos encontros em que está alocado
-- ---------------------------------------------------------------------------
-- SECURITY DEFINER porque a policy de `agenda_bolsista` consulta a própria
-- `agenda_bolsista`: como invoker, isso recursaria na RLS.
create or replace function gestao.bolsista_na_agenda(p_agenda uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = 'gestao'
as $$
begin
  if not gestao.usuario_com_papel('bolsista') then
    return false;
  end if;
  return exists (
    select 1
    from gestao.agenda_bolsista ab
    where ab.agenda_id = p_agenda
      and ab.bolsista_id = auth.uid()
  );
end;
$$;

create or replace function gestao.bolsista_na_aula(p_aula uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = 'gestao'
as $$
begin
  if not gestao.usuario_com_papel('bolsista') then
    return false;
  end if;
  return exists (
    select 1
    from gestao.aula au
    join gestao.agenda_bolsista ab on ab.agenda_id = au.agenda_id
    where au.id = p_aula
      and ab.bolsista_id = auth.uid()
  );
end;
$$;

-- ponytail: escopo por escola até existir turma (spec 004); lá passa a ser por turma.
create or replace function gestao.bolsista_na_escola(p_escola uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = 'gestao'
as $$
begin
  if not gestao.usuario_com_papel('bolsista') then
    return false;
  end if;
  return exists (
    select 1
    from gestao.agenda a
    join gestao.agenda_bolsista ab on ab.agenda_id = a.id
    where a.escola_id = p_escola
      and ab.bolsista_id = auth.uid()
  );
end;
$$;

revoke execute on function gestao.bolsista_na_agenda(uuid) from public, anon;
revoke execute on function gestao.bolsista_na_aula(uuid) from public, anon;
revoke execute on function gestao.bolsista_na_escola(uuid) from public, anon;
grant execute on function gestao.bolsista_na_agenda(uuid) to authenticated;
grant execute on function gestao.bolsista_na_aula(uuid) to authenticated;
grant execute on function gestao.bolsista_na_escola(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- RLS fatiada (substitui `membro_ler_escrever`)
-- ---------------------------------------------------------------------------
-- Coordenação ativa: tudo. Bolsista ativo: lê escola e aluno da escola em que
-- está alocado, lê os próprios encontros e alocações, lança aula e presença
-- dos próprios encontros. Bolsista nunca apaga nada, nem lê reserva, termo da
-- reserva ou lista enviada.
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
    execute format('drop policy if exists "membro_ler_escrever" on %s', t);
    execute format('drop policy if exists "coordenacao_tudo" on %s', t);
    execute format(
      'create policy "coordenacao_tudo" on %s as permissive for all to authenticated '
      'using (gestao.usuario_com_papel(''coordenacao'')) '
      'with check (gestao.usuario_com_papel(''coordenacao''))', t);
  end loop;
end;
$$;

drop policy if exists "bolsista_le" on gestao.escola;
create policy "bolsista_le" on gestao.escola
  as permissive for select to authenticated
  using (gestao.bolsista_na_escola(id));

drop policy if exists "bolsista_le" on gestao.aluno;
create policy "bolsista_le" on gestao.aluno
  as permissive for select to authenticated
  using (gestao.bolsista_na_escola(escola_id));

drop policy if exists "bolsista_le" on gestao.agenda;
create policy "bolsista_le" on gestao.agenda
  as permissive for select to authenticated
  using (gestao.bolsista_na_agenda(id));

drop policy if exists "bolsista_le" on gestao.agenda_bolsista;
create policy "bolsista_le" on gestao.agenda_bolsista
  as permissive for select to authenticated
  using (gestao.bolsista_na_agenda(agenda_id));

drop policy if exists "bolsista_le" on gestao.aula;
create policy "bolsista_le" on gestao.aula
  as permissive for select to authenticated
  using (gestao.bolsista_na_agenda(agenda_id));
drop policy if exists "bolsista_lanca" on gestao.aula;
create policy "bolsista_lanca" on gestao.aula
  as permissive for insert to authenticated
  with check (gestao.bolsista_na_agenda(agenda_id));
drop policy if exists "bolsista_corrige" on gestao.aula;
create policy "bolsista_corrige" on gestao.aula
  as permissive for update to authenticated
  using (gestao.bolsista_na_agenda(agenda_id))
  with check (gestao.bolsista_na_agenda(agenda_id));

drop policy if exists "bolsista_le" on gestao.presenca;
create policy "bolsista_le" on gestao.presenca
  as permissive for select to authenticated
  using (gestao.bolsista_na_aula(aula_id));
drop policy if exists "bolsista_lanca" on gestao.presenca;
create policy "bolsista_lanca" on gestao.presenca
  as permissive for insert to authenticated
  with check (gestao.bolsista_na_aula(aula_id));
drop policy if exists "bolsista_corrige" on gestao.presenca;
create policy "bolsista_corrige" on gestao.presenca
  as permissive for update to authenticated
  using (gestao.bolsista_na_aula(aula_id))
  with check (gestao.bolsista_na_aula(aula_id));

-- ---------------------------------------------------------------------------
-- Equipe: leitura de perfil que a RLS de user_profile não dá à coordenação
-- ---------------------------------------------------------------------------
-- `public.user_profile` só é legível pelo próprio usuário ou pelo `admin` do
-- produto, e a coordenação do projeto não é `admin` (spec 002). As duas funções
-- abaixo devolvem só nome e e-mail, só para a coordenação ativa. A busca é por
-- igualdade exata para não virar enumeração de contas.
create or replace function gestao.buscar_usuario_por_email(p_email text)
returns table (id uuid, nome text, email text, papel text, desligado_em timestamptz)
language plpgsql
stable
security definer
set search_path = 'gestao', 'public'
as $$
#variable_conflict use_column
begin
  if not gestao.usuario_com_papel('coordenacao') then
    raise exception 'gestao: apenas a coordenação busca pessoas' using errcode = '42501';
  end if;
  return query
    select up.id, up.full_name, up.email, m.papel, m.desligado_em
    from public.user_profile up
    left join gestao.papel_membro m on m.user_profile_id = up.id
    where lower(up.email) = lower(btrim(p_email))
    limit 1;
end;
$$;

create or replace function gestao.equipe()
returns table (
  user_profile_id uuid,
  nome text,
  email text,
  papel text,
  desligado_em timestamptz,
  membro_desde timestamptz,
  bolsa_id uuid,
  modalidade text,
  carga_semanal_horas numeric,
  valor_mensal numeric,
  bolsa_inicio date,
  bolsa_fim date,
  tem_alocacao boolean
)
language plpgsql
stable
security definer
set search_path = 'gestao', 'public'
as $$
#variable_conflict use_column
begin
  if not gestao.usuario_com_papel('coordenacao') then
    raise exception 'gestao: apenas a coordenação vê a equipe' using errcode = '42501';
  end if;
  return query
    select
      m.user_profile_id,
      up.full_name,
      up.email,
      m.papel,
      m.desligado_em,
      m.criado_em,
      b.id,
      b.modalidade,
      b.carga_semanal_horas,
      b.valor_mensal,
      b.inicio,
      b.fim,
      exists (select 1 from gestao.agenda_bolsista ab where ab.bolsista_id = m.user_profile_id)
    from gestao.papel_membro m
    left join public.user_profile up on up.id = m.user_profile_id
    left join lateral (
      select bb.id, bb.modalidade, bb.carga_semanal_horas, bb.valor_mensal, bb.inicio, bb.fim
      from gestao.bolsa bb
      where bb.bolsista_id = m.user_profile_id
        and current_date between bb.inicio and bb.fim
      order by bb.inicio desc
      limit 1
    ) b on true
    order by m.desligado_em is not null, up.full_name;
end;
$$;

revoke execute on function gestao.buscar_usuario_por_email(text) from public, anon;
revoke execute on function gestao.equipe() from public, anon;
grant execute on function gestao.buscar_usuario_por_email(text) to authenticated;
grant execute on function gestao.equipe() to authenticated;

commit;
