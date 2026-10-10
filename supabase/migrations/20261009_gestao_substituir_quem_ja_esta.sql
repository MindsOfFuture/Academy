-- Substituir por quem já está no encontro (spec 014, relato da coordenação em
-- 09/10/2026).
--
-- `substituir_alocacao` sempre criava a alocação de quem entra, e a chave única
-- (agenda_id, bolsista_id) recusava quando essa pessoa já estava no encontro.
-- O caso é real: alguém da própria equipe assume o lugar de quem faltou.
--
-- Agora: quem sai fica "substituída" apontando quem cobriu; quem cobre, se já
-- está no encontro, mantém a alocação que tem (as horas não dobram, é o mesmo
-- horário). Se tinha sido substituída ou retirada antes, volta a valer.
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
    on conflict (agenda_id, bolsista_id) do update
      set situacao = 'prevista', coberto_por = null, motivo = null
      where agenda_bolsista.situacao in ('substituida', 'retirada')
    returning id into v_nova;

  -- Já estava valendo no encontro: nada a mudar na alocação de quem cobre.
  if v_nova is null then
    select ab.id into v_nova
      from gestao.agenda_bolsista ab
      where ab.agenda_id = v_agenda and ab.bolsista_id = p_substituto;
  end if;
  return v_nova;
end;
$$;

commit;
