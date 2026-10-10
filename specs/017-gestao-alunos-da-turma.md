# 017 — Gestão: alunos da turma

## Problema
A coordenação já cadastra turmas, mas ainda não consegue registrar quais alunos participam de cada uma. A informação fica fora do sistema.

## Escopo
Cadastrar alunos diretamente na turma, consultar os ativos e manter o histórico de matrículas finalizadas. A coordenação pode cadastrar um aluno por formulário ou colar uma lista, revisar os dados e confirmar o cadastro.

## Fora de escopo
Chamada, termos, importação das planilhas, acesso do bolsista, indicadores.

## Critérios de aceite
- [ ] A coordenação cadastra alunos na turma e consulta nome, idade e ano escolar.
- [ ] Escola e atividade do aluno vêm da turma cadastrada.
- [ ] A lista colada mostra erros e possíveis duplicidades antes de salvar; só a confirmação grava os dados válidos.
- [ ] A coordenação finaliza matrícula com motivo e o histórico permanece consultável.
- [ ] Bolsistas, pessoas sem papel de gestão e administradores públicos sem papel de coordenação não acessam os dados nem as ações.

## Plano
Aproveitar o cadastro de aluno existente, vincular cada aluno à turma por matrícula e manter as alterações auditáveis. A criação e a finalização são autorizadas no servidor e no banco.

## Tarefas
- [ ] Criar matrícula e funções protegidas para cadastrar aluno e finalizar matrícula.
- [ ] Criar API e validação, incluindo leitura e conferência da lista colada.
- [ ] Criar página da turma com alunos ativos, histórico e formulários.
- [ ] Mostrar quantidade e acesso à página em cada turma.
- [ ] Cobrir banco, validação, lista, tela e ações com testes.
