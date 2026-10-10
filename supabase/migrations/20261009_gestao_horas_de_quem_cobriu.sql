-- Horas de quem cobriu (spec 014, decisão 11: coordenação em 09/10/2026).
--
-- Até aqui "quem cobriu" era só anotação: quem foi coberto continuava com as
-- horas e quem cobriu não ganhava nada. A regra passa a ser:
--   - quem foi coberto conta só o tempo em que esteve: o intervalo parcial, ou
--     nada se não tem intervalo (coberto inteiro) ou se faltou;
--   - quem cobriu ganha o tempo do encontro em que a pessoa coberta não esteve,
--     menos o que já conta pela própria alocação no mesmo encontro, para não
--     contar duas vezes (B2 já no encontro inteiro cobrindo a chegada atrasada do
--     B4 continua com 4 h, como no critério da spec).
-- Substituição continua como antes: o substituto tem a própria alocação.
--
-- Depende de 20261009_gestao_alocacao.sql. Idempotente.

begin;

-- Segundos de [x1, x2) que caem dentro de [c1, c2); sem [c1, c2), zero.
create or replace function gestao.segundos_em_comum(x1 time, x2 time, c1 time, c2 time)
returns numeric
language sql
immutable
set search_path = 'gestao'
as $$
  select case
    when c1 is null or c2 is null or x2 <= x1 then 0
    else greatest(0, extract(epoch from least(x2, c2) - greatest(x1, c1)))
  end
$$;

drop view if exists gestao.v_carga;
create view gestao.v_carga
with (security_invoker = true)
as
with base as (
  select
    ab.id,
    ab.bolsista_id,
    ab.agenda_id,
    ab.situacao,
    ab.coberto_por,
    a.data,
    a.escola_id,
    a.turma_id,
    a.inicio as e_ini,
    a.fim as e_fim,
    a.cancelado_em is null and a.inicio is not null and coalesce(t.status, '') <> 'nao_abriu' as conta,
    -- Intervalo em que a própria pessoa esteve; nulo = não esteve.
    case
      when ab.situacao not in ('prevista', 'cumprida') then null
      when ab.coberto_por is not null and ab.inicio is null then null
      else coalesce(ab.inicio, a.inicio)
    end as p_ini,
    case
      when ab.situacao not in ('prevista', 'cumprida') then null
      when ab.coberto_por is not null and ab.inicio is null then null
      else coalesce(ab.fim, a.fim)
    end as p_fim
  from gestao.agenda_bolsista ab
  join gestao.agenda a on a.id = ab.agenda_id
  left join gestao.turma t on t.id = a.turma_id
)
-- A própria alocação: conta o que foi cumprido; passado sem marcação conta
-- como cumprido (decisão 3).
select
  b.id as alocacao_id,
  b.bolsista_id,
  b.agenda_id,
  b.data,
  b.escola_id,
  b.turma_id,
  b.situacao,
  case
    when b.conta and b.p_ini is not null and (b.situacao = 'cumprida' or b.data <= current_date)
    then round(extract(epoch from b.p_fim - b.p_ini) / 3600.0, 2)
    else 0
  end as horas
from base b
union all
-- A cobertura: o tempo em que a pessoa coberta não esteve vai para quem cobriu.
select
  b.id,
  b.coberto_por,
  b.agenda_id,
  b.data,
  b.escola_id,
  b.turma_id,
  'cobertura',
  case
    when b.conta and b.data <= current_date then round((
      case
        when b.p_ini is null then
          extract(epoch from b.e_fim - b.e_ini)
          - gestao.segundos_em_comum(b.e_ini, b.e_fim, c.p_ini, c.p_fim)
        else
          extract(epoch from b.p_ini - b.e_ini) + extract(epoch from b.e_fim - b.p_fim)
          - gestao.segundos_em_comum(b.e_ini, b.p_ini, c.p_ini, c.p_fim)
          - gestao.segundos_em_comum(b.p_fim, b.e_fim, c.p_ini, c.p_fim)
      end
    ) / 3600.0, 2)
    else 0
  end
from base b
left join base c on c.agenda_id = b.agenda_id and c.bolsista_id = b.coberto_por
where b.coberto_por is not null
  and b.situacao not in ('substituida', 'retirada');

revoke all on table gestao.v_carga from public, anon;
grant select on table gestao.v_carga to authenticated;

commit;
