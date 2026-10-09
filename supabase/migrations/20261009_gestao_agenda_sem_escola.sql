-- Encontro sem escola (spec 014, ajuste pedido pela coordenação em 09/10/2026).
--
-- Tarefa, reunião ou evento sem turma nem sempre acontece numa escola, e o
-- formulário não deve obrigar a escolher uma. `agenda.escola_id` deixa de ser
-- obrigatório. Encontro de turma continua com a escola da turma: a trigger
-- `agenda_antes_de_gravar` (20261009_gestao_alocacao.sql) a copia.
--
-- Depende de 20261009_gestao_alocacao.sql. Idempotente.

begin;

alter table gestao.agenda alter column escola_id drop not null;

commit;
