-- Sai o gestor do encontro (substituído pelas notas de encerramento,
-- 20261018_gestao_notas_de_encerramento.sql). Em produção nenhum gestor tinha
-- sido marcado, então a coluna sai sem perda.
--
-- Aplicar só depois que o código sem `gestor` estiver no ar: o anterior lê a
-- coluna em toda página de encontro. Idempotente.

alter table gestao.agenda_bolsista drop column if exists gestor;
