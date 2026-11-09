-- Comprovação opcional da atividade do relatório (link ou descrição curta). Vai
-- para a coluna "Fonte de comprovação" do formulário .docx. Edita como nome e
-- data: só o dono, em mês aberto (20261108_gestao_relatorio_editar.sql).
-- Idempotente.

begin;

alter table gestao.atividade_relatorio add column if not exists comprovacao text
  check (char_length(comprovacao) <= 500);

grant update (comprovacao) on table gestao.atividade_relatorio to authenticated;

commit;
