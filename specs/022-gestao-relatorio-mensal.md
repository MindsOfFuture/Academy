# 022 — Relatório mensal do bolsista

Status: implementada (2026-11-08/09; migrations aplicadas em produção, código sem commit)
Constituição: `specs/constitution.md`

## Problema

Todo mês o bolsista preenche à mão o "Formulário de execução de atividades" (modelo
.docx do projeto), juntando encontros e outras tarefas de memória, e a coordenação não
tinha onde conferir o que cada bolsista fez no mês.

## Escopo

**Aba Relatório** (`/gestao/relatorio`), para bolsista e coordenação:

- Encontros em que a pessoa esteve no mês: data, horário, atividade, escola, turma e
  horas (mesma regra da carga). Conta alocação prevista/cumprida e cobertura ("Quem
  cobriu"); não conta falta, substituição, retirada nem encontro cancelado.
- **Outras atividades**: tarefas feitas para o projeto fora dos encontros (nome, data e
  comprovação opcional — link ou texto até 500 caracteres; link `http(s)` vira clicável).
- Editar e apagar a própria atividade **enquanto o mês dela não terminou** (horário de
  Brasília). Mês encerrado fica como foi para o relatório.
- **Baixar relatório (.docx)**: o modelo do projeto preenchido — período, CPF
  (formatado; fora do formato sai em branco), nome, mês, e a tabela com encontros e
  outras atividades em ordem de data. "Fonte de comprovação" recebe a comprovação das
  atividades; nos encontros fica em branco.

**Janela da coordenação** (aba Equipe → "Registro de atividades" de cada bolsista): o
mesmo registro, só leitura, com troca de mês.

**Fora de escopo:** anexar arquivo como comprovação; editar atividade de outra pessoa;
coordenação baixar o .docx de um bolsista; edição do nome do coordenador no modelo (fixo).

## Critérios de aceite

- [x] O bolsista vê só as próprias atividades; outro bolsista não vê.
- [x] A coordenação vê as atividades da equipe e não as altera; a coordenação de teste
  (E2E) não vê a equipe real, nem o contrário.
- [x] Ninguém cadastra em nome de outra pessoa; quem não é membro da gestão não cadastra.
- [x] Em mês aberto o dono edita e apaga; em mês encerrado não; a edição não leva a
  atividade para um mês encerrado.
- [x] Quem cobriu um colega inteiro (sem alocação própria) vê o encontro e as horas no
  próprio relatório e no .docx.
- [x] O .docx não tem nenhum "XX"; caracteres como `&` e `<` não quebram o arquivo;
  mês vazio mantém a linha em branco do modelo; se o modelo mudar e um campo sumir, o
  download falha em vez de gerar documento pela metade.
- [x] A janela da Equipe só abre para bolsista da equipe listada (endereço adulterado
  não abre ninguém de fora).

## Plano

- **Dados** (`supabase/migrations/`):
  - `20261108_gestao_relatorio.sql` — `gestao.atividade_relatorio` (dono = `auth.uid()`),
    RLS: dono lê; membro cadastra o seu.
  - `20261108_gestao_relatorio_coordenacao.sql` — coordenação lê (respeitando `teste`).
  - `20261108_gestao_relatorio_editar.sql` — `gestao.mes_aberto(date)`; dono edita
    (nome/data) e apaga em mês aberto.
  - `20261108_gestao_relatorio_comprovacao.sql` — coluna `comprovacao`.
  - `20261108_gestao_quem_cobriu_ve_o_encontro.sql` — `gestao.bolsista_na_agenda` aceita
    `coberto_por` (ADR 025).
- **Código:** `lib/api/gestao/relatorio.ts` (leituras e escritas, `server-only`),
  `lib/api/gestao/relatorio-docx.ts` (preenchimento puro do modelo),
  `lib/api/gestao/modelos/relatorio-mensal.docx` (o modelo), `app/gestao/relatorio/*`
  (página, formulários, ações, rota `docx/route.ts`, `registro.tsx` compartilhado),
  `app/gestao/equipe/janela-registro.tsx`.
- **Autorização:** `exigirMembro` nas telas; `ensureGestaoMember` nas ações e na rota do
  .docx; a RLS é a regra de fato (inclusive mês aberto). Regra de mês editável na tela e
  nas ações: `app/gestao/alocacao/rotulos.ts#mesEditavel`.
- **Dependência:** `fflate` declarada direto (já vinha com `jspdf`) para abrir/montar o .docx.
- **Deploy:** `next.config.ts#outputFileTracingIncludes` leva o modelo para o build
  `standalone`; validado em 2026-11-09 (ADR 026).

## Testes

- `tests/integration/gestao-relatorio-migration.test.ts` — quem lê, quem escreve, mês aberto.
- `tests/integration/gestao-quem-cobriu-migration.test.ts` — quem cobriu vê o encontro
  (falha sem a migration).
- `tests/unit/lib/api/gestao/relatorio.test.ts`, `relatorio-docx.test.ts` (gera a partir
  do modelo real), `tests/unit/app/gestao/relatorio-actions.test.ts`,
  `tests/unit/app/gestao/equipe-page.test.tsx`.

## Aberto

- O bolsista que faltou e foi coberto continua vendo "aula sem registro" daquele
  encontro na tela Hoje (comportamento anterior a esta spec).
