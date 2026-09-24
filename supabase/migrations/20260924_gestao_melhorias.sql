-- Pedido de melhoria dos bolsistas (spec 011, Módulo 8 do plano
-- docs/plans/gestao-dia-a-dia.md).
--
-- Depende de 20260923_gestao_fundacao.sql (desligamento e papéis ativos).
-- As regras que tornam o canal confiável vivem aqui, não na tela:
--   - autor e status inicial vêm do banco;
--   - o autor edita só enquanto ninguém analisou;
--   - só a coordenação responde, seguindo as transições permitidas;
--   - recusa e duplicata exigem motivo escrito;
--   - aviso no sino para a coordenação (pedido novo) e para o autor (resposta).
--
-- Idempotente. Não aplicar automaticamente: produção é compartilhada.

begin;

-- ---------------------------------------------------------------------------
-- Tabelas
-- ---------------------------------------------------------------------------
create table if not exists gestao.melhoria (
  id uuid primary key default gen_random_uuid(),
  autor uuid not null references gestao.papel_membro (user_profile_id) on delete restrict,
  titulo text not null check (char_length(btrim(titulo)) between 3 and 120),
  area text not null check (area in ('plataforma', 'gestao', 'aulas_material', 'processo', 'outra')),
  problema text not null check (char_length(btrim(problema)) between 10 and 2000),
  proposta text not null check (char_length(btrim(proposta)) between 3 and 2000),
  quem_sofre text check (char_length(quem_sofre) <= 500),
  status text not null default 'nova'
    check (status in ('nova', 'em_analise', 'aceita', 'recusada', 'duplicada', 'entregue')),
  resposta text check (char_length(resposta) <= 2000),
  duplicada_de uuid references gestao.melhoria (id) on delete set null,
  link_execucao text check (link_execucao ~ '^https?://'),
  respondida_em timestamptz,
  respondida_por uuid references auth.users (id) on delete set null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  -- coalesce: sem ele, resposta nula faz o check dar NULL, e NULL passa.
  constraint melhoria_motivo_obrigatorio
    check (status not in ('recusada', 'duplicada') or char_length(btrim(coalesce(resposta, ''))) >= 10),
  constraint melhoria_duplicada_aponta_original
    check (status <> 'duplicada' or duplicada_de is not null),
  constraint melhoria_nao_duplica_a_si
    check (duplicada_de is null or duplicada_de <> id)
);

create index if not exists melhoria_fila on gestao.melhoria (status, criado_em);
create index if not exists melhoria_autor on gestao.melhoria (autor);

create table if not exists gestao.melhoria_apoio (
  melhoria_id uuid not null references gestao.melhoria (id) on delete cascade,
  user_profile_id uuid not null references gestao.papel_membro (user_profile_id) on delete cascade,
  criado_em timestamptz not null default now(),
  primary key (melhoria_id, user_profile_id)
);

alter table gestao.melhoria enable row level security;
alter table gestao.melhoria force row level security;
alter table gestao.melhoria_apoio enable row level security;
alter table gestao.melhoria_apoio force row level security;

-- ---------------------------------------------------------------------------
-- Regras de escrita
-- ---------------------------------------------------------------------------
create or replace function gestao.melhoria_antes_de_inserir()
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
  new.status := 'nova';
  new.resposta := null;
  new.duplicada_de := null;
  new.link_execucao := null;
  new.respondida_em := null;
  new.respondida_por := null;
  new.criado_em := now();
  return new;
end;
$$;

drop trigger if exists melhoria_antes_de_inserir on gestao.melhoria;
create trigger melhoria_antes_de_inserir
  before insert on gestao.melhoria
  for each row execute function gestao.melhoria_antes_de_inserir();

create or replace function gestao.melhoria_antes_de_atualizar()
returns trigger
language plpgsql
security invoker
set search_path = 'gestao'
as $$
declare
  coordenacao boolean := gestao.usuario_com_papel('coordenacao');
  texto_mudou boolean :=
    new.titulo is distinct from old.titulo
    or new.area is distinct from old.area
    or new.problema is distinct from old.problema
    or new.proposta is distinct from old.proposta
    or new.quem_sofre is distinct from old.quem_sofre;
  resposta_mudou boolean :=
    new.status is distinct from old.status
    or new.resposta is distinct from old.resposta
    or new.duplicada_de is distinct from old.duplicada_de
    or new.link_execucao is distinct from old.link_execucao;
begin
  new.autor := old.autor;
  new.criado_em := old.criado_em;

  if texto_mudou and not (old.autor = auth.uid() and old.status = 'nova') then
    raise exception 'gestao: o texto do pedido é de quem pediu e só muda enquanto ninguém analisou'
      using errcode = '42501';
  end if;

  if resposta_mudou and not coordenacao then
    raise exception 'gestao: apenas a coordenação responde pedidos de melhoria' using errcode = '42501';
  end if;

  if new.status is distinct from old.status and not (
       (old.status = 'nova' and new.status in ('em_analise', 'aceita', 'recusada', 'duplicada'))
    or (old.status = 'em_analise' and new.status in ('aceita', 'recusada', 'duplicada'))
    or (old.status = 'aceita' and new.status = 'entregue')
  ) then
    raise exception 'gestao: um pedido % não pode passar a %', old.status, new.status using errcode = '23514';
  end if;

  if new.status <> 'duplicada' then
    new.duplicada_de := null;
  end if;

  -- O prazo de 14 dias mede até a primeira resposta; respostas seguintes não o apagam.
  if new.status is distinct from old.status and old.respondida_em is null then
    new.respondida_em := now();
    new.respondida_por := auth.uid();
  else
    new.respondida_em := old.respondida_em;
    new.respondida_por := old.respondida_por;
  end if;

  return new;
end;
$$;

drop trigger if exists melhoria_antes_de_atualizar on gestao.melhoria;
create trigger melhoria_antes_de_atualizar
  before update on gestao.melhoria
  for each row execute function gestao.melhoria_antes_de_atualizar();

drop trigger if exists tocar_atualizado_em on gestao.melhoria;
create trigger tocar_atualizado_em before update on gestao.melhoria
  for each row execute function gestao.tocar_atualizado_em();

drop trigger if exists registrar_auditoria on gestao.melhoria;
create trigger registrar_auditoria after insert or update or delete on gestao.melhoria
  for each row execute function gestao.registrar_auditoria();

create or replace function gestao.melhoria_apoio_antes_de_inserir()
returns trigger
language plpgsql
security invoker
set search_path = 'gestao'
as $$
begin
  if auth.uid() is null then
    raise exception 'gestao: auth.uid() e obrigatorio para autoria' using errcode = '42501';
  end if;
  new.user_profile_id := auth.uid();
  if exists (select 1 from gestao.melhoria m where m.id = new.melhoria_id and m.autor = auth.uid()) then
    raise exception 'gestao: não dá para apoiar o próprio pedido' using errcode = '23514';
  end if;
  return new;
end;
$$;

drop trigger if exists melhoria_apoio_antes_de_inserir on gestao.melhoria_apoio;
create trigger melhoria_apoio_antes_de_inserir
  before insert on gestao.melhoria_apoio
  for each row execute function gestao.melhoria_apoio_antes_de_inserir();

-- ---------------------------------------------------------------------------
-- Aviso no sino
-- ---------------------------------------------------------------------------
-- A RLS de public.notification só aceita linha do próprio usuário
-- (`user_id = auth.uid()`), e o aviso vai para outra pessoa. Por isso a função
-- é SECURITY DEFINER (dono com bypassrls em produção), com search_path fixo e
-- sem nada vindo do cliente além do que já passou pelas regras acima.
create or replace function gestao.melhoria_avisar()
returns trigger
language plpgsql
security definer
set search_path = 'gestao', 'public'
as $$
declare
  rotulo text;
  mensagem text;
begin
  if tg_op = 'INSERT' then
    insert into public.notification (user_id, channel, type, payload)
    select
      m.user_profile_id,
      'in-app',
      'melhoria_nova',
      jsonb_build_object(
        'title', 'Novo pedido de melhoria',
        'message', new.titulo,
        'href', '/gestao/melhorias/' || new.id
      )
    from gestao.papel_membro m
    where m.papel = 'coordenacao'
      and m.desligado_em is null
      and m.user_profile_id <> new.autor;
    return null;
  end if;

  if new.status is distinct from old.status and new.autor is distinct from auth.uid() then
    rotulo := case new.status
      when 'em_analise' then 'está em análise'
      when 'aceita' then 'foi aceito'
      when 'recusada' then 'foi recusado'
      when 'duplicada' then 'foi marcado como repetido'
      when 'entregue' then 'foi entregue'
      else 'foi atualizado'
    end;
    mensagem := '"' || new.titulo || '" ' || rotulo
      || coalesce('. ' || nullif(btrim(new.resposta), ''), '');
    insert into public.notification (user_id, channel, type, payload)
    values (
      new.autor,
      'in-app',
      'melhoria_atualizada',
      jsonb_build_object(
        'title', 'Seu pedido de melhoria ' || rotulo,
        'message', left(mensagem, 500),
        'href', '/gestao/melhorias/' || new.id
      )
    );
  end if;
  return null;
end;
$$;

revoke execute on function gestao.melhoria_avisar() from public, anon, authenticated;

drop trigger if exists melhoria_avisar on gestao.melhoria;
create trigger melhoria_avisar
  after insert or update on gestao.melhoria
  for each row execute function gestao.melhoria_avisar();

-- ---------------------------------------------------------------------------
-- RLS e grants
-- ---------------------------------------------------------------------------
revoke all on table gestao.melhoria from public, anon, authenticated;
revoke all on table gestao.melhoria_apoio from public, anon, authenticated;
grant select, insert, update, delete on table gestao.melhoria to authenticated;
grant select, insert, delete on table gestao.melhoria_apoio to authenticated;

drop policy if exists "membro_le" on gestao.melhoria;
create policy "membro_le" on gestao.melhoria
  as permissive for select to authenticated
  using (gestao.e_membro());

drop policy if exists "membro_pede" on gestao.melhoria;
create policy "membro_pede" on gestao.melhoria
  as permissive for insert to authenticated
  with check (gestao.e_membro() and autor = auth.uid());

drop policy if exists "coordenacao_ou_autor_em_nova_altera" on gestao.melhoria;
create policy "coordenacao_ou_autor_em_nova_altera" on gestao.melhoria
  as permissive for update to authenticated
  using (
    gestao.usuario_com_papel('coordenacao')
    or (autor = auth.uid() and status = 'nova' and gestao.e_membro())
  )
  with check (
    gestao.usuario_com_papel('coordenacao')
    or (autor = auth.uid() and status = 'nova' and gestao.e_membro())
  );

drop policy if exists "autor_retira_em_nova" on gestao.melhoria;
create policy "autor_retira_em_nova" on gestao.melhoria
  as permissive for delete to authenticated
  using (autor = auth.uid() and status = 'nova' and gestao.e_membro());

drop policy if exists "membro_le" on gestao.melhoria_apoio;
create policy "membro_le" on gestao.melhoria_apoio
  as permissive for select to authenticated
  using (gestao.e_membro());

drop policy if exists "membro_apoia" on gestao.melhoria_apoio;
create policy "membro_apoia" on gestao.melhoria_apoio
  as permissive for insert to authenticated
  with check (gestao.e_membro() and user_profile_id = auth.uid());

drop policy if exists "membro_retira_apoio" on gestao.melhoria_apoio;
create policy "membro_retira_apoio" on gestao.melhoria_apoio
  as permissive for delete to authenticated
  using (gestao.e_membro() and user_profile_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Leitura com nome do autor
-- ---------------------------------------------------------------------------
-- A RLS de public.user_profile esconde o nome de quem pediu. A função devolve
-- só o nome, só a membro ativo, e deriva "atrasada" por data (nada gravado).
create or replace function gestao.listar_melhorias(p_id uuid default null)
returns table (
  id uuid,
  autor uuid,
  autor_nome text,
  titulo text,
  area text,
  problema text,
  proposta text,
  quem_sofre text,
  status text,
  resposta text,
  duplicada_de uuid,
  link_execucao text,
  respondida_em timestamptz,
  criado_em timestamptz,
  atualizado_em timestamptz,
  apoios integer,
  apoiei boolean,
  atrasada boolean
)
language plpgsql
stable
security definer
set search_path = 'gestao', 'public'
as $$
#variable_conflict use_column
begin
  if not gestao.e_membro() then
    raise exception 'gestao: apenas membros do projeto veem os pedidos' using errcode = '42501';
  end if;
  return query
    select
      m.id,
      m.autor,
      coalesce(nullif(btrim(up.full_name), ''), 'Pessoa da equipe'),
      m.titulo,
      m.area,
      m.problema,
      m.proposta,
      m.quem_sofre,
      m.status,
      m.resposta,
      m.duplicada_de,
      m.link_execucao,
      m.respondida_em,
      m.criado_em,
      m.atualizado_em,
      (select count(*)::int from gestao.melhoria_apoio a where a.melhoria_id = m.id),
      exists (select 1 from gestao.melhoria_apoio a where a.melhoria_id = m.id and a.user_profile_id = auth.uid()),
      -- ponytail: prazo fixo de 14 dias até a coordenação definir outro (D9).
      m.status = 'nova' and m.criado_em < now() - interval '14 days'
    from gestao.melhoria m
    left join public.user_profile up on up.id = m.autor
    where p_id is null or m.id = p_id
    order by m.criado_em desc;
end;
$$;

revoke execute on function gestao.listar_melhorias(uuid) from public, anon;
grant execute on function gestao.listar_melhorias(uuid) to authenticated;

commit;
