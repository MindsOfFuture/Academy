-- Link de comprovação junto da nota de encerramento (pedido da coordenação em
-- 10/11/2026).
--
-- Ao escrever a nota, o bolsista pode informar um link de mídia que comprova a
-- atividade. O relatório mensal mostra os links de todos os bolsistas do
-- encontro na coluna "Fonte de comprovação". A leitura já é coberta pela
-- policy `bolsista_le` de agenda_bolsista (colegas do mesmo encontro).
-- Salvar a nota sem link apaga o link anterior.
--
-- Depende de 20261018_gestao_notas_de_encerramento.sql. Idempotente. Não
-- aplicar automaticamente: produção é compartilhada. Aplicar ANTES do deploy do
-- código: o código novo chama a função com p_link.

begin;

alter table gestao.agenda_bolsista
  add column if not exists link_comprovacao text
  check (char_length(link_comprovacao) <= 500 and link_comprovacao ~ '^https?://[^[:space:]]+$');

-- A assinatura muda: sem o drop ficariam duas funções e a chamada com dois
-- argumentos seria ambígua.
drop function if exists gestao.escrever_nota_encerramento(uuid, text);

-- Mesmo corpo da de 20261018, mais o link.
create or replace function gestao.escrever_nota_encerramento(p_agenda uuid, p_nota text, p_link text default null)
returns boolean
language plpgsql
security definer
set search_path = 'gestao'
as $$
declare
  v_nota text := btrim(coalesce(p_nota, ''));
  v_link text := nullif(btrim(coalesce(p_link, '')), '');
  v_encontro gestao.agenda%rowtype;
begin
  if not gestao.e_membro() then
    raise exception 'gestao: apenas membros do projeto escrevem nota de encerramento' using errcode = '42501';
  end if;
  if char_length(v_nota) < 10 or char_length(v_nota) > 5000 then
    raise exception 'gestao: a nota de encerramento precisa ter de 10 a 5000 caracteres' using errcode = '23514';
  end if;
  if v_link is not null and (char_length(v_link) > 500 or v_link !~ '^https?://[^[:space:]]+$') then
    raise exception 'gestao: o link de comprovação precisa começar com http:// ou https://, sem espaços, com até 500 caracteres'
      using errcode = '23514';
  end if;

  -- Trava o encontro: duas últimas notas ao mesmo tempo não se perdem uma da outra.
  select * into v_encontro from gestao.agenda where id = p_agenda for update;
  if not found then
    raise exception 'gestao: encontro não encontrado' using errcode = 'P0002';
  end if;
  if v_encontro.cancelado_em is not null then
    raise exception 'gestao: encontro cancelado não recebe nota de encerramento' using errcode = '23514';
  end if;
  if v_encontro.data + coalesce(v_encontro.inicio, time '00:00') > (now() at time zone 'America/Sao_Paulo') then
    raise exception 'gestao: a nota de encerramento só abre depois da hora de início do encontro' using errcode = '23514';
  end if;

  update gestao.agenda_bolsista
    set nota_encerramento = v_nota, link_comprovacao = v_link
    where agenda_id = p_agenda and bolsista_id = auth.uid() and situacao in ('prevista', 'cumprida');
  if not found then
    raise exception 'gestao: só quem esteve no encontro escreve a nota de encerramento' using errcode = '42501';
  end if;

  if v_encontro.concluido_em is null and not exists (
    select 1 from gestao.agenda_bolsista
    where agenda_id = p_agenda and situacao in ('prevista', 'cumprida') and nota_encerramento is null
  ) then
    update gestao.agenda set concluido_em = now() where id = p_agenda;
    return true;
  end if;
  return false;
end;
$$;

revoke execute on function gestao.escrever_nota_encerramento(uuid, text, text) from public, anon;
grant execute on function gestao.escrever_nota_encerramento(uuid, text, text) to authenticated;

commit;
