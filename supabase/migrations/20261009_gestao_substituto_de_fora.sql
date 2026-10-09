-- Substituto vem de fora do encontro (spec 014, decisão 8 revista pela
-- coordenação em 09/10/2026).
--
-- 20261009_gestao_substituir_quem_ja_esta.sql deixou substituir por quem já
-- estava no encontro, por leitura errada do pedido. A regra é a inversa: quem
-- já está no encontro não substitui ninguém nele (cobrir parte do horário de
-- alguém continua sendo o "quem cobriu" da alocação parcial). A função volta a
-- criar a alocação de quem entra e recusa, com mensagem clara, quem já está lá.
--
-- Depende de 20261009_gestao_alocacao.sql. Idempotente.

begin;

create or replace function gestao.substituir_alocacao(p_alocacao uuid, p_substituto uuid, p_motivo text default null)
returns uuid
language plpgsql
security invoker
set search_path = 'gestao'
as $$
declare
  v_agenda uuid;
  v_nova uuid;
begin
  select ab.agenda_id into v_agenda from gestao.agenda_bolsista ab where ab.id = p_alocacao;
  if exists (
    select 1 from gestao.agenda_bolsista ab
    where ab.agenda_id = v_agenda and ab.bolsista_id = p_substituto
  ) then
    raise exception 'gestao: esta pessoa já está no encontro e não pode substituir ninguém nele' using errcode = '23514';
  end if;

  update gestao.agenda_bolsista
    set situacao = 'substituida',
        coberto_por = p_substituto,
        motivo = nullif(btrim(coalesce(p_motivo, '')), ''),
        inicio = null,
        fim = null
    where id = p_alocacao
      and situacao in ('prevista', 'faltou_avisou', 'faltou_sem_aviso')
    returning agenda_id into v_agenda;
  if v_agenda is null then
    raise exception 'gestao: só dá para substituir uma alocação prevista ou com falta' using errcode = '23514';
  end if;

  insert into gestao.agenda_bolsista (agenda_id, bolsista_id)
    values (v_agenda, p_substituto)
    returning id into v_nova;
  return v_nova;
end;
$$;

commit;
