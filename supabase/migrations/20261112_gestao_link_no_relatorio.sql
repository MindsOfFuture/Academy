-- Link de comprovação direto no relatório mensal (pedido da coordenação em
-- 11/11/2026).
--
-- Na aba Relatório o bolsista adiciona, troca ou apaga o link de comprovação de
-- cada encontro em que esteve, sem escrever a nota de encerramento. Grava só o
-- link: não mexe na nota nem conclui o encontro.
--
-- Depende de 20261110_gestao_link_de_comprovacao.sql. Idempotente. Não aplicar
-- automaticamente: produção é compartilhada. Aplicar ANTES do deploy.

begin;

create or replace function gestao.escrever_link_comprovacao(p_agenda uuid, p_link text)
returns void
language plpgsql
security definer
set search_path = 'gestao'
as $$
declare
  v_link text := nullif(btrim(coalesce(p_link, '')), '');
  v_encontro gestao.agenda%rowtype;
begin
  if not gestao.e_membro() then
    raise exception 'gestao: apenas membros do projeto informam o link de comprovação' using errcode = '42501';
  end if;
  if v_link is not null and (char_length(v_link) > 500 or v_link !~ '^https?://[^[:space:]]+$') then
    raise exception 'gestao: o link de comprovação precisa começar com http:// ou https://, sem espaços, com até 500 caracteres'
      using errcode = '23514';
  end if;

  select * into v_encontro from gestao.agenda where id = p_agenda;
  if not found then
    raise exception 'gestao: encontro não encontrado' using errcode = 'P0002';
  end if;
  if v_encontro.cancelado_em is not null then
    raise exception 'gestao: encontro cancelado não recebe link de comprovação' using errcode = '23514';
  end if;
  if v_encontro.data + coalesce(v_encontro.inicio, time '00:00') > (now() at time zone 'America/Sao_Paulo') then
    raise exception 'gestao: o link de comprovação só abre depois da hora de início do encontro' using errcode = '23514';
  end if;

  update gestao.agenda_bolsista
    set link_comprovacao = v_link
    where agenda_id = p_agenda and bolsista_id = auth.uid() and situacao in ('prevista', 'cumprida');
  if not found then
    raise exception 'gestao: só quem esteve no encontro informa o link de comprovação' using errcode = '42501';
  end if;
end;
$$;

revoke execute on function gestao.escrever_link_comprovacao(uuid, text) from public, anon;
grant execute on function gestao.escrever_link_comprovacao(uuid, text) to authenticated;

commit;
