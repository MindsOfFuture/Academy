-- Remover alguém do encontro (spec 014, decisão 9: pedido da coordenação em
-- 09/10/2026).
--
-- A alocação passa a poder ser apagada pela coordenação (a RLS
-- `coordenacao_tudo` já cobre; faltava o `delete`, retirado em
-- 20261009_gestao_alocacao.sql). O histórico continua: a auditoria guarda quem
-- removeu, quando e a linha inteira em `antes`.
--
-- Remover quem entrou como substituto desfaz a substituição: quem tinha saído
-- volta a "prevista", senão as horas daquele lugar sumiriam das duas pessoas.
--
-- Depende de 20261009_gestao_substituto_de_fora.sql. Idempotente.

begin;

grant delete on table gestao.agenda_bolsista to authenticated;

create or replace function gestao.alocacao_antes_de_apagar()
returns trigger
language plpgsql
security invoker
set search_path = 'gestao'
as $$
begin
  update gestao.agenda_bolsista
    set situacao = 'prevista', coberto_por = null, motivo = null
    where agenda_id = old.agenda_id
      and situacao = 'substituida'
      and coberto_por = old.bolsista_id;
  return old;
end;
$$;

drop trigger if exists alocacao_antes_de_apagar on gestao.agenda_bolsista;
create trigger alocacao_antes_de_apagar
  before delete on gestao.agenda_bolsista
  for each row execute function gestao.alocacao_antes_de_apagar();

commit;
