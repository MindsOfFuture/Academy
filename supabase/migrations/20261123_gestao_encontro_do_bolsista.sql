-- Todo bolsista cria encontros (pedido da coordenação em 21/11/2026).
--
-- O bolsista não escreve em `agenda` (a RLS é da coordenação); esta função cria
-- o encontro sem escola nem turma, põe quem chama como responsável e os colegas
-- escolhidos como apoio. Daí em diante é um encontro como os outros: a
-- coordenação edita, cancela e aloca; as horas contam em `v_carga`.
--
-- Depende de 20261123_gestao_foto_e_atividade_com_equipe.sql. Idempotente. Não
-- aplicar automaticamente: produção é compartilhada. Aplicar ANTES do deploy.

begin;

create or replace function gestao.criar_encontro_do_bolsista(
  p_data date,
  p_inicio time,
  p_fim time,
  p_tipo text,
  p_modalidade text,
  p_descricao text,
  p_espaco uuid,
  p_colegas uuid[]
)
returns uuid
language plpgsql
security definer
set search_path = 'gestao'
as $$
declare
  v_modalidade text := btrim(coalesce(p_modalidade, ''));
  v_descricao text := nullif(btrim(coalesce(p_descricao, '')), '');
  v_colegas uuid[] := array(select distinct c from unnest(coalesce(p_colegas, '{}')) c where c <> auth.uid());
  v_id uuid;
begin
  if not gestao.e_membro() then
    raise exception 'gestao: apenas membros do projeto criam encontros' using errcode = '42501';
  end if;
  if p_data is null or p_inicio is null or p_fim is null or p_fim <= p_inicio then
    raise exception 'gestao: informe a data, o início e o fim do encontro' using errcode = '23514';
  end if;
  if char_length(v_modalidade) < 2 or char_length(v_modalidade) > 120 then
    raise exception 'gestao: informe a atividade do encontro' using errcode = '23514';
  end if;
  if char_length(coalesce(v_descricao, '')) > 200 then
    raise exception 'gestao: a descrição passou de 200 caracteres' using errcode = '23514';
  end if;
  if cardinality(v_colegas) > 30 then
    raise exception 'gestao: escolha até 30 colegas' using errcode = '23514';
  end if;
  if p_espaco is not null and not exists (select 1 from gestao.espaco s where s.id = p_espaco and s.ativo) then
    raise exception 'gestao: espaço não encontrado' using errcode = '23503';
  end if;
  if exists (
    select 1 from unnest(v_colegas) c
    where not exists (
      select 1 from gestao.papel_membro m
      where m.user_profile_id = c and m.desligado_em is null and m.teste = gestao.sou_teste()
    )
  ) then
    raise exception 'gestao: só pessoas da equipe entram no encontro' using errcode = '23514';
  end if;

  insert into gestao.agenda (data, inicio, fim, tipo, modalidade, aulas, espaco_id)
    values (p_data, p_inicio, p_fim, p_tipo, v_modalidade, coalesce(v_descricao, v_modalidade), p_espaco)
    returning id into v_id;

  insert into gestao.agenda_bolsista (agenda_id, bolsista_id, funcao)
    select v_id, auth.uid(), 'responsavel'
    union all
    select v_id, c, 'apoio' from unnest(v_colegas) c;

  return v_id;
end;
$$;

revoke execute on function gestao.criar_encontro_do_bolsista(date, time, time, text, text, text, uuid, uuid[]) from public, anon;
grant execute on function gestao.criar_encontro_do_bolsista(date, time, time, text, text, text, uuid, uuid[]) to authenticated;

commit;
