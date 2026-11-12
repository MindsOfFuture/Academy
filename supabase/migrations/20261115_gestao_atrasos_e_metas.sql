-- Atraso por pessoa no encontro e metas da equipe (pedido da coordenação em 12/11/2026).
--
--   - agenda_bolsista.atraso_minutos: opcional, só informativo. Não muda as
--     horas nem a v_carga. Quem grava é a coordenação (a policy existente
--     `coordenacao_tudo`); o bolsista continua só lendo.
--   - metas: a coordenação cria e edita meta com prazo e responsáveis (pela
--     `gestao.salvar_meta`, atômica); responsáveis e coordenação registram o
--     andamento; todos os membros leem. "Em dia/atrasada/concluída" é derivado
--     na tela a partir do prazo e de `concluida_em` (nada gravado).
--
-- Depende de 20261114_gestao_numero_da_aula.sql. Idempotente. Não aplicar
-- automaticamente: produção é compartilhada. Aplicar ANTES do deploy.

begin;

-- ---------------------------------------------------------------------------
-- Atraso
-- ---------------------------------------------------------------------------
alter table gestao.agenda_bolsista
  add column if not exists atraso_minutos integer check (atraso_minutos between 1 and 600);

-- ---------------------------------------------------------------------------
-- Metas: tabelas
-- ---------------------------------------------------------------------------
create table if not exists gestao.meta (
  id uuid primary key default gen_random_uuid(),
  titulo text not null check (char_length(btrim(titulo)) between 3 and 200),
  descricao text check (char_length(descricao) <= 2000),
  prazo date not null,
  concluida_em timestamptz,
  criado_por uuid references auth.users (id) on delete set null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  teste boolean not null default gestao.sou_teste()
);

create index if not exists meta_prazo on gestao.meta (prazo);

create table if not exists gestao.meta_responsavel (
  meta_id uuid not null references gestao.meta (id) on delete cascade,
  user_profile_id uuid not null references gestao.papel_membro (user_profile_id) on delete cascade,
  criado_em timestamptz not null default now(),
  primary key (meta_id, user_profile_id)
);

create index if not exists meta_responsavel_pessoa on gestao.meta_responsavel (user_profile_id);

create table if not exists gestao.meta_andamento (
  id uuid primary key default gen_random_uuid(),
  meta_id uuid not null references gestao.meta (id) on delete cascade,
  autor uuid not null default auth.uid() references gestao.papel_membro (user_profile_id) on delete restrict,
  texto text not null check (char_length(btrim(texto)) between 2 and 2000),
  criado_em timestamptz not null default now()
);

create index if not exists meta_andamento_linha on gestao.meta_andamento (meta_id, criado_em);

alter table gestao.meta enable row level security;
alter table gestao.meta force row level security;
alter table gestao.meta_responsavel enable row level security;
alter table gestao.meta_responsavel force row level security;
alter table gestao.meta_andamento enable row level security;
alter table gestao.meta_andamento force row level security;

-- ---------------------------------------------------------------------------
-- Metas: regras de escrita
-- ---------------------------------------------------------------------------
-- concluida_em é carimbado pelo banco: de nulo a não nulo vira now(); já
-- concluída mantém a data; nulo reabre.
create or replace function gestao.meta_antes_de_gravar()
returns trigger
language plpgsql
security invoker
set search_path = 'gestao'
as $$
begin
  if tg_op = 'INSERT' then
    new.concluida_em := null;
    new.criado_em := now();
    return new;
  end if;

  new.criado_em := old.criado_em;
  if old.concluida_em is null and new.concluida_em is not null then
    new.concluida_em := now();
  elsif old.concluida_em is not null and new.concluida_em is not null then
    new.concluida_em := old.concluida_em;
  end if;
  return new;
end;
$$;

drop trigger if exists definir_autoria on gestao.meta;
create trigger definir_autoria before insert or update on gestao.meta
  for each row execute function gestao.definir_autoria();
drop trigger if exists meta_antes_de_gravar on gestao.meta;
create trigger meta_antes_de_gravar before insert or update on gestao.meta
  for each row execute function gestao.meta_antes_de_gravar();
drop trigger if exists tocar_atualizado_em on gestao.meta;
create trigger tocar_atualizado_em before update on gestao.meta
  for each row execute function gestao.tocar_atualizado_em();
drop trigger if exists registrar_auditoria on gestao.meta;
create trigger registrar_auditoria after insert or update or delete on gestao.meta
  for each row execute function gestao.registrar_auditoria();

create or replace function gestao.meta_andamento_antes_de_inserir()
returns trigger
language plpgsql
security invoker
set search_path = 'gestao'
as $$
begin
  if auth.uid() is null then
    raise exception 'gestao: auth.uid() e obrigatorio para autoria' using errcode = '42501';
  end if;
  new.autor := auth.uid();
  new.criado_em := now();
  return new;
end;
$$;

drop trigger if exists meta_andamento_antes_de_inserir on gestao.meta_andamento;
create trigger meta_andamento_antes_de_inserir
  before insert on gestao.meta_andamento
  for each row execute function gestao.meta_andamento_antes_de_inserir();

-- ---------------------------------------------------------------------------
-- Metas: RLS e grants
-- ---------------------------------------------------------------------------
revoke all on table gestao.meta from public, anon, authenticated;
revoke all on table gestao.meta_responsavel from public, anon, authenticated;
revoke all on table gestao.meta_andamento from public, anon, authenticated;
grant select, insert, update on table gestao.meta to authenticated;
grant select, insert, delete on table gestao.meta_responsavel to authenticated;
grant select, insert on table gestao.meta_andamento to authenticated;

drop policy if exists "membro_le" on gestao.meta;
create policy "membro_le" on gestao.meta
  as permissive for select to authenticated
  using (gestao.e_membro());

drop policy if exists "coordenacao_tudo" on gestao.meta;
create policy "coordenacao_tudo" on gestao.meta
  as permissive for all to authenticated
  using (gestao.usuario_com_papel('coordenacao'))
  with check (gestao.usuario_com_papel('coordenacao'));

-- Meta do E2E não aparece para a equipe real, e vice-versa (como importacao).
drop policy if exists "teste_separado" on gestao.meta;
create policy "teste_separado" on gestao.meta
  as restrictive for all to authenticated
  using (teste = gestao.sou_teste())
  with check (teste = gestao.sou_teste());

-- As filhas seguem a meta: o exists aplica a RLS de gestao.meta (inclusive o
-- teste_separado). Nenhuma policy de meta consulta as filhas (sem recursão).
drop policy if exists "membro_le" on gestao.meta_responsavel;
create policy "membro_le" on gestao.meta_responsavel
  as permissive for select to authenticated
  using (gestao.e_membro() and exists (select 1 from gestao.meta m where m.id = meta_responsavel.meta_id));

drop policy if exists "coordenacao_tudo" on gestao.meta_responsavel;
create policy "coordenacao_tudo" on gestao.meta_responsavel
  as permissive for all to authenticated
  using (gestao.usuario_com_papel('coordenacao'))
  with check (
    gestao.usuario_com_papel('coordenacao')
    and exists (select 1 from gestao.meta m where m.id = meta_responsavel.meta_id)
  );

drop policy if exists "membro_le" on gestao.meta_andamento;
create policy "membro_le" on gestao.meta_andamento
  as permissive for select to authenticated
  using (gestao.e_membro() and exists (select 1 from gestao.meta m where m.id = meta_andamento.meta_id));

drop policy if exists "responsavel_ou_coordenacao_registra" on gestao.meta_andamento;
create policy "responsavel_ou_coordenacao_registra" on gestao.meta_andamento
  as permissive for insert to authenticated
  with check (
    autor = auth.uid()
    and exists (select 1 from gestao.meta m where m.id = meta_andamento.meta_id)
    and (
      gestao.usuario_com_papel('coordenacao')
      or (
        gestao.e_membro()
        and exists (
          select 1 from gestao.meta_responsavel r
          where r.meta_id = meta_andamento.meta_id and r.user_profile_id = auth.uid()
        )
      )
    )
  );

-- ---------------------------------------------------------------------------
-- Salvar meta com os responsáveis, de uma vez
-- ---------------------------------------------------------------------------
-- Invoker: a RLS decide (só a coordenação grava). p_id nulo cria; senão edita.
create or replace function gestao.salvar_meta(
  p_id uuid,
  p_titulo text,
  p_descricao text,
  p_prazo date,
  p_responsaveis uuid[]
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if coalesce(array_length(p_responsaveis, 1), 0) = 0 then
    raise exception 'gestao: a meta precisa de ao menos um responsável' using errcode = '23514';
  end if;

  if p_id is null then
    insert into gestao.meta (titulo, descricao, prazo)
    values (p_titulo, p_descricao, p_prazo)
    returning id into v_id;
  else
    update gestao.meta
       set titulo = p_titulo, descricao = p_descricao, prazo = p_prazo
     where id = p_id
    returning id into v_id;
    if v_id is null then
      raise exception 'gestao: apenas a coordenação edita metas' using errcode = '42501';
    end if;
  end if;

  delete from gestao.meta_responsavel
   where meta_id = v_id and user_profile_id <> all (p_responsaveis);
  insert into gestao.meta_responsavel (meta_id, user_profile_id)
  select v_id, r from unnest(p_responsaveis) as r
  on conflict do nothing;

  return v_id;
end;
$$;

revoke execute on function gestao.salvar_meta(uuid, text, text, date, uuid[]) from public, anon;
grant execute on function gestao.salvar_meta(uuid, text, text, date, uuid[]) to authenticated;

commit;
