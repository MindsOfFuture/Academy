-- Concluir encontro (spec 014, decisão 10: pedido da coordenação em 09/10/2026).
--
-- Concluir confirma que o encontro aconteceu: quem ainda está "prevista" passa a
-- "cumprida" (falta, substituição e retirada ficam como estão). Só encontro de
-- hoje ou passado, e nunca cancelado; concluído também não se cancela sem
-- reabrir antes. O carimbo vem do relógio do banco, e a auditoria guarda quem.
--
-- Depende de 20261009_gestao_alocacao.sql. Idempotente.

begin;

alter table gestao.agenda add column if not exists concluido_em timestamptz;

create or replace function gestao.agenda_conclusao()
returns trigger
language plpgsql
security invoker
set search_path = 'gestao'
as $$
begin
  if tg_op = 'INSERT' then
    new.concluido_em := null;
    return new;
  end if;

  if new.concluido_em is not null and old.concluido_em is null then
    if new.cancelado_em is not null then
      raise exception 'gestao: encontro cancelado não pode ser concluído' using errcode = '23514';
    end if;
    -- ponytail: "hoje" pela data do servidor (UTC), como em v_carga.
    if new.data > current_date then
      raise exception 'gestao: só dá para concluir um encontro que já aconteceu' using errcode = '23514';
    end if;
    new.concluido_em := now();
  elsif new.concluido_em is not null then
    new.concluido_em := old.concluido_em;
  end if;

  if new.concluido_em is not null and new.cancelado_em is not null then
    raise exception 'gestao: encontro concluído não pode ser cancelado; reabra antes' using errcode = '23514';
  end if;
  return new;
end;
$$;

drop trigger if exists agenda_conclusao on gestao.agenda;
create trigger agenda_conclusao
  before insert or update on gestao.agenda
  for each row execute function gestao.agenda_conclusao();

create or replace function gestao.agenda_ao_concluir()
returns trigger
language plpgsql
security invoker
set search_path = 'gestao'
as $$
begin
  update gestao.agenda_bolsista
    set situacao = 'cumprida'
    where agenda_id = new.id and situacao = 'prevista';
  return null;
end;
$$;

drop trigger if exists agenda_ao_concluir on gestao.agenda;
create trigger agenda_ao_concluir
  after update of concluido_em on gestao.agenda
  for each row
  when (old.concluido_em is null and new.concluido_em is not null)
  execute function gestao.agenda_ao_concluir();

commit;
