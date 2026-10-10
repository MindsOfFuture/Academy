-- Correção da 20261009_gestao_alocacao.sql (spec 014), já aplicada em produção.
--
-- `agenda_bolsista.coberto_por` nasceu com chave estrangeira para
-- `papel_membro`. Isso criou uma segunda relação entre as duas tabelas, e o
-- PostgREST deixou de resolver o embed `papel_membro!inner(bolsista)` do
-- indicador 6 ("more than one relationship was found"): a tela "Hoje" da
-- gestão quebrou, inclusive no código que já está no ar.
--
-- A chave sai e a mesma garantia passa para a trigger da alocação: quem cobre
-- tem que ser da equipe. A relação `bolsista_id -> papel_membro` volta a ser a
-- única, e o código no ar volta a funcionar sem deploy.
--
-- Depende de 20261009_gestao_alocacao.sql. Idempotente.

begin;

alter table gestao.agenda_bolsista drop constraint if exists agenda_bolsista_coberto_por_fkey;

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

  -- Sem chave estrangeira (ver cabeçalho): a trigger garante que quem cobriu é da equipe.
  if new.coberto_por is not null
     and new.coberto_por is distinct from (case when tg_op = 'UPDATE' then old.coberto_por end)
     and not exists (select 1 from gestao.papel_membro m where m.user_profile_id = new.coberto_por) then
    raise exception 'gestao: quem cobriu precisa ser da equipe' using errcode = '23503';
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

commit;
