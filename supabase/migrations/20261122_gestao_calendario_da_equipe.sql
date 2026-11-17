-- Calendário da equipe para o bolsista (pedido de 17/11/2026).
--
-- O bolsista só lê os encontros em que está (RLS de `agenda`). Para a visão
-- "Equipe toda" do calendário, `gestao.calendario_da_equipe` devolve os
-- encontros do período com o mínimo para a grade: quando, onde, o quê e os
-- nomes de quem vai. Ficam de fora motivo de falta, nota, atraso, relatório e
-- presentes. `minha` diz se quem chama está no encontro (alocado ou cobrindo),
-- para a tela abrir só os próprios.
--
-- Encontro de teste não se mistura com o real: vale a marcação da escola e,
-- sem escola, a das pessoas alocadas. Período de no máximo 62 dias.
--
-- Depende de 20261116_gestao_espacos.sql. Idempotente. Não aplicar
-- automaticamente: produção é compartilhada. Aplicar ANTES do deploy.

begin;

create or replace function gestao.calendario_da_equipe(p_de date, p_ate date)
returns table (
  id uuid,
  data date,
  horario text,
  modalidade text,
  tipo text,
  numero_aula integer,
  escola text,
  turma text,
  espaco text,
  cancelado boolean,
  concluido boolean,
  equipe text[],
  minha boolean
)
language plpgsql
stable
security definer
set search_path = 'gestao', 'public'
as $$
#variable_conflict use_column
begin
  if not gestao.e_membro() then
    raise exception 'gestao: apenas membros do projeto veem o calendário' using errcode = '42501';
  end if;
  if p_de is null or p_ate is null or p_ate < p_de or p_ate - p_de > 62 then
    raise exception 'gestao: período inválido para o calendário' using errcode = '22023';
  end if;

  return query
    select
      a.id,
      a.data,
      a.horario,
      a.modalidade,
      a.tipo,
      a.numero_aula,
      es.nome,
      t.nome,
      sp.nome,
      a.cancelado_em is not null,
      a.concluido_em is not null,
      coalesce((
        select array_agg(coalesce(up.full_name, 'Pessoa da equipe') order by ab.funcao = 'responsavel' desc, up.full_name)
        from gestao.agenda_bolsista ab
        left join public.user_profile up on up.id = ab.bolsista_id
        where ab.agenda_id = a.id and ab.situacao not in ('substituida', 'retirada')
      ), '{}'),
      exists (
        select 1 from gestao.agenda_bolsista ab
        where ab.agenda_id = a.id
          and ((ab.bolsista_id = auth.uid() and ab.situacao in ('prevista', 'cumprida'))
            or (ab.coberto_por = auth.uid() and ab.situacao not in ('substituida', 'retirada')))
      )
    from gestao.agenda a
    left join gestao.escola es on es.id = a.escola_id
    left join gestao.turma t on t.id = a.turma_id
    left join gestao.espaco sp on sp.id = a.espaco_id
    where a.data between p_de and p_ate
      and coalesce(
        es.teste,
        (select bool_or(m.teste) from gestao.agenda_bolsista ab
           join gestao.papel_membro m on m.user_profile_id = ab.bolsista_id
         where ab.agenda_id = a.id),
        false
      ) = gestao.sou_teste()
    order by a.data, a.inicio nulls last;
end;
$$;

revoke execute on function gestao.calendario_da_equipe(date, date) from public, anon;
grant execute on function gestao.calendario_da_equipe(date, date) to authenticated;

commit;
