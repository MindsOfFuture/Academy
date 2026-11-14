-- Horas alocadas na carga do mês (pedido da coordenação em 14/11/2026).
--
-- A carga mostrava só o que já foi cumprido: encontro futuro valia 0 h. A
-- `v_carga` ganha `horas_alocadas`, com as mesmas regras de `horas` (falta,
-- substituição, cancelado e turma que não abriu não contam; cobertura vai para
-- quem cobriu), mas sem esperar a data passar. `horas` não muda: o relatório
-- mensal continua lendo o cumprido.
--
-- Depende de 20261009_gestao_horas_de_quem_cobriu.sql. Idempotente. Não aplicar
-- automaticamente: produção é compartilhada. Aplicar ANTES do deploy.

begin;

-- Coluna nova no fim: `create or replace view` aceita, e quem lê a view não quebra.
create or replace view gestao.v_carga
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
),
proprias as (
  select b.*,
    case when b.conta and b.p_ini is not null
      then round(extract(epoch from b.p_fim - b.p_ini) / 3600.0, 2) else 0 end as alocadas
  from base b
),
coberturas as (
  select b.*,
    case when b.conta then round((
      case
        when b.p_ini is null then
          extract(epoch from b.e_fim - b.e_ini)
          - gestao.segundos_em_comum(b.e_ini, b.e_fim, c.p_ini, c.p_fim)
        else
          extract(epoch from b.p_ini - b.e_ini) + extract(epoch from b.e_fim - b.p_fim)
          - gestao.segundos_em_comum(b.e_ini, b.p_ini, c.p_ini, c.p_fim)
          - gestao.segundos_em_comum(b.p_fim, b.e_fim, c.p_ini, c.p_fim)
      end
    ) / 3600.0, 2) else 0 end as alocadas
  from base b
  left join base c on c.agenda_id = b.agenda_id and c.bolsista_id = b.coberto_por
  where b.coberto_por is not null
    and b.situacao not in ('substituida', 'retirada')
)
select
  p.id as alocacao_id,
  p.bolsista_id,
  p.agenda_id,
  p.data,
  p.escola_id,
  p.turma_id,
  p.situacao,
  -- Cumprido: passado sem marcação conta como cumprido (decisão 3).
  case when p.situacao = 'cumprida' or p.data <= current_date then p.alocadas else 0 end as horas,
  p.alocadas as horas_alocadas
from proprias p
union all
select
  c.id,
  c.coberto_por,
  c.agenda_id,
  c.data,
  c.escola_id,
  c.turma_id,
  'cobertura',
  case when c.data <= current_date then c.alocadas else 0 end,
  c.alocadas
from coberturas c;

revoke all on table gestao.v_carga from public, anon;
grant select on table gestao.v_carga to authenticated;

commit;
