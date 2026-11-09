-- Quem cobriu um colega ("Quem cobriu", sem alocação própria) passa a ver o
-- encontro como quem está alocado nele.
--
-- Antes só a alocação própria abria o encontro para o bolsista. Quem cobriu
-- ganhava as horas na carga (20261009_gestao_horas_de_quem_cobriu.sql), mas o
-- encontro sumia do relatório e do .docx dele, embora a coordenação o visse.
-- Com isso também registra aula e presença do encontro que deu. Idempotente.

begin;

create or replace function gestao.bolsista_na_agenda(p_agenda uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = 'gestao'
as $$
begin
  if not gestao.usuario_com_papel('bolsista') then
    return false;
  end if;
  return exists (
    select 1
    from gestao.agenda_bolsista ab
    where ab.agenda_id = p_agenda
      and (ab.bolsista_id = auth.uid() or ab.coberto_por = auth.uid())
  );
end;
$$;

commit;
