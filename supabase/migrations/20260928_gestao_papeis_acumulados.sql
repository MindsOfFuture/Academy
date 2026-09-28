-- Papéis acumulados na equipe (spec 012): a mesma pessoa pode ser coordenação
-- e bolsista ao mesmo tempo.
--
-- `gestao.papel_membro` continua com uma linha por pessoa (bolsa, alocação e
-- melhorias apontam para ela, e o desligamento vale para a pessoa inteira). O
-- papel único `papel text` vira duas marcas, `coordenacao` e `bolsista`, com ao
-- menos uma ligada.
--
-- Idempotente. Não aplicar automaticamente: produção é compartilhada e a
-- aplicação depende de aprovação explícita do Rafael. Código e migration entram
-- no ar juntos.

begin;

alter table gestao.papel_membro add column if not exists coordenacao boolean not null default false;
alter table gestao.papel_membro add column if not exists bolsista boolean not null default false;

-- Copia o papel antigo. As triggers da tabela ficam desligadas só durante a
-- cópia: é mudança de estrutura, não ação de alguém da equipe — a auditoria
-- exige usuário autenticado e `atualizado_em` não deve mudar por isso.
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'gestao' and table_name = 'papel_membro' and column_name = 'papel'
  ) then
    alter table gestao.papel_membro disable trigger user;
    update gestao.papel_membro
      set coordenacao = (papel = 'coordenacao'),
          bolsista = (papel = 'bolsista');
    alter table gestao.papel_membro enable trigger user;
    alter table gestao.papel_membro drop column papel;
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'papel_membro_algum_papel'
      and conrelid = 'gestao.papel_membro'::regclass
  ) then
    alter table gestao.papel_membro
      add constraint papel_membro_algum_papel check (coordenacao or bolsista);
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Portas de papel
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
      and m.desligado_em is null
      and case p_papel
            when 'coordenacao' then m.coordenacao
            when 'bolsista' then m.bolsista
            else false
          end
  );
end;
$$;

revoke execute on function gestao.usuario_com_papel(text) from public, anon;
grant execute on function gestao.usuario_com_papel(text) to authenticated;

-- Papel efetivo do chamador para o guard e as telas: quem tem os dois usa a
-- gestão como coordenação. A assinatura não muda.
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
    select case
             when m.coordenacao then 'coordenacao'
             when m.bolsista then 'bolsista'
           end
    from gestao.papel_membro m
    where m.user_profile_id = auth.uid()
      and m.desligado_em is null
    limit 1
  );
end;
$$;

revoke execute on function public.gestao_membro_papel() from public, anon;
grant execute on function public.gestao_membro_papel() to authenticated;

-- A última pessoa ativa da coordenação não sai da coordenação, mesmo que
-- continue como bolsista. A exclusão em cascata vinda de conta apagada passa
-- (pg_trigger_depth() > 1), como na spec 003.
create or replace function gestao.proteger_ultima_coordenacao()
returns trigger
language plpgsql
security definer
set search_path = 'gestao'
as $$
begin
  if old.coordenacao
     and old.desligado_em is null
     and (
       (tg_op = 'DELETE' and pg_trigger_depth() = 1)
       or (tg_op = 'UPDATE' and (not new.coordenacao or new.desligado_em is not null))
     )
     and not exists (
       select 1
       from gestao.papel_membro m
       where m.coordenacao
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

-- ---------------------------------------------------------------------------
-- Equipe e busca: devolvem os dois papéis (muda o tipo de retorno → drop)
-- ---------------------------------------------------------------------------
drop function if exists gestao.buscar_usuario_por_email(text);
create function gestao.buscar_usuario_por_email(p_email text)
returns table (id uuid, nome text, email text, coordenacao boolean, bolsista boolean, desligado_em timestamptz)
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
    select up.id, up.full_name, up.email, m.coordenacao, m.bolsista, m.desligado_em
    from public.user_profile up
    left join gestao.papel_membro m on m.user_profile_id = up.id
    where lower(up.email) = lower(btrim(p_email))
    limit 1;
end;
$$;

drop function if exists gestao.equipe();
create function gestao.equipe()
returns table (
  user_profile_id uuid,
  nome text,
  email text,
  coordenacao boolean,
  bolsista boolean,
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
      m.coordenacao,
      m.bolsista,
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

-- ---------------------------------------------------------------------------
-- Aviso de pedido de melhoria: vai para quem tem coordenação ativa
-- ---------------------------------------------------------------------------
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
    where m.coordenacao
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

notify pgrst, 'reload schema';

commit;
