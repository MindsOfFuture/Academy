-- Concluir só depois da hora de início (spec 014, decisão 10 ajustada pela
-- coordenação em 09/10/2026).
--
-- 20261009_gestao_concluir_encontro.sql comparava só a data, e pelo relógio do
-- servidor (UTC). Agora compara data e hora de início do encontro com o agora de
-- Brasília: o botão da tela e o banco dizem a mesma coisa. Encontro antigo, sem
-- horário somável, vale pela data.
--
-- Depende de 20261009_gestao_concluir_encontro.sql. Idempotente.

begin;

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
    if new.data + coalesce(new.inicio, time '00:00') > (now() at time zone 'America/Sao_Paulo') then
      raise exception 'gestao: só dá para concluir depois da hora de início do encontro' using errcode = '23514';
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

commit;
