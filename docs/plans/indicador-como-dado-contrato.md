# Indicador como dado, não como schema — contrato de design (esboço)

Status: **esboço, reversível**. Não aprovado, não implementado. Nenhuma migration,
nenhuma tabela, nenhuma linha de código no repo. Documento de desenho do contrato
para destravar a discussão com a coordenação; a implementação só começa depois do
bloqueador nº 1 do plano `sistema-interno-gestao.md` — o formulário oficial de
prestação de contas FACC/Governo MG em mãos.

Constituição: `specs/constitution.md` · Plano-pai: `docs/plans/sistema-interno-gestao.md`

---

## 1. Contexto e vínculo com o plano-pai

O plano `sistema-interno-gestao.md` é "proposta, não aprovada" e lista como
bloqueador nº 1 o formulário oficial. Sem ele, modelar tabelas de indicador agora
seria "chute" (texto literal do plano) e violaria a Constituição § I (feature nova
sem spec aprovada). Este documento **não** tenta contornar isso: ele fixa o
**contrato** que qualquer modelo futuro terá de cumprir, sem decidir taxonomia.

A auditoria de schema (realizada em 04/09/2026, nada modificado) confirmou que:

- não existe módulo `gestao`, tabela de indicadores nem coluna de indicador no repo;
- o único schema métrico é `telemetry_*` (log de evento educacional append-only,
  sem relação com prestação de contas);
- os `*Row`/`*Summary` de `lib/api/types.ts` mapeiam entidades de curso/aula/
  matrícula/atividade — nenhum representa indicador.

Ou seja: este é design **net-novo** de um modelo extensível, não migração de schema
existente.

---

## 2. O contrato "indicador como dado"

Princípio central: um indicador é uma **linha de dado tipificada**, não uma coluna
nem uma tabela por indicador. Adicionar um indicador novo nunca pode exigir
`ALTER TABLE` nem código novo; é uma inserção de metadado + uma query registrada.

Forma canônica (envelope único, independente do indicador concreto):

| Campo | Papel | Notas |
|---|---|---|
| `indicador_id` | identificador estável (slug/chave) | único; é o nome da métrica, não um número |
| `tipo` | enum da semântica do valor | `count`, `sum`, `ratio`, `duration`, `flag`, `distribution` |
| `escopo` | a que o valor se refere | bolsista, escola, turma, projeto, mês, período |
| `valor` | o número/medida observado | tipado conforme `tipo` |
| `unidade` | dimensão do valor | alunos, horas, %, R$, dias, booleano |
| `periodo` | janela temporal da observação | gravado, nunca inferido só do timestamp da linha |
| `fonte` | de onde o valor foi derivado | query registrada, upload, manual |
| `metadados` | JSONB não-normativo | rótulo de exibição, cor, ordem, contexto extra |

Regras do envelope:

1. **Uma métrica, uma linha por (escopo, período).** Agregação sai por query,
   nunca por soma ingênua de linhas brutas em código.
2. **`valor` tipado, nunca string livre para números.** Texto livre só em
   metadados de exibição; a medida em si é coluna com tipo do Postgres.
3. **`fonte` diferencia derivação por query de apontamento manual.** Um indicador
   derivado por query tem a query registrada (item 3); um apontado à mão carrega
   quem/quando o digitou e está marcado como tal.
4. **Nada de EAV genérico total.** O envelope acima não é `(key, value, text)`
   solto: `tipo`+`unidade`+`valor tipado` restringem o que pode existir. EAV
   puro (qualquer chave, qualquer valor) é rejeitado — esconde erro de tipo e
   impede auditoria.

Por que não coluna-por-indicador (o anti-padrão que este contrato substitui):
adicionar "alunos_mensal" como `ALTER TABLE ... ADD COLUMN` exige migration +
código + review por indicador. O extensível resolve com uma linha de definição.

Por que não EAV puro: perde tipagem no banco, não fecha a regra de derivação por
query e é irreconcilável com prestação de contas auditável.

---

## 3. Regra de derivação por query

Do plano-pai (passo 2): **se um indicador do formulário oficial não puder ser
derivado por query, o modelo está errado** — não se resolve com campo de texto
livre preenchido à mão.

Contrato de derivação:

- Todo indicador **derivado** registra, em `fonte`, uma consulta declarativa
  (view SQL / função `stable` / query versionada em `lib/api/`) que produz o
  valor a partir de linhas de origem rastreáveis (alocação, turma, carga horária,
  matrícula, progresso).
- O resultado materializado aponta para a **linha de origem** usada: quando um
  número do relatório final é exibido, dá para abrir qual query o produziu e de
  quais registros primários ele veio.
- Indicadores **apontados manualmente** existem como exceção explicitada, marcados
  `fonte = 'manual'` com autoria e nunca somados dentro da prestação de contas
  sem gate humano.
- Derivação é **recreável e versionada**: mesma query + mesma fonte ⇒ mesmo valor.
  Sem estado escondido, sem célula de planilha sobreviva como fonte.

Esta regra é o que faz a fronteira de query (`lib/api/gestao`, card filho
`t_2ed62c43`) ser verificável: cada indicador tem contrato "derivo de X",
testável antes da UI existir.

---

## 4. Desenho de RLS para `gestao.*`

Conforme o plano-pai (guardrails não-negociáveis) e `docs/supabase.md`:

- **Schema separado `gestao.*`**, nunca tabela solta no `public`.
- **Schema nasce inteiro em migration versionada** (`supabase/migrations/`), com
  as policies no arquivo — não repete o ADR 008 (schema criado no dashboard, sem
  histórico).
- **RLS própria por papel.** Dado institucional e de pessoa: regra do projeto.
- **`createServiceRoleClient()` bloqueado** neste módulo. Veto de merge. Vale a
  regra de `docs/supabase.md#qual-cliente-usar` sem exceção.
- **Toda query por `lib/api/`** (ADR 005), nunca Supabase direto do componente.
- **Rota fora de `PUBLIC_PATH_PREFIXES`** e atrás de checagem de papel no servidor
  (`ensure…()`), padrão dos route handlers existentes.
- Papéis candidatos (pendentes de confirmação com a coordenação): `admin`
  (coordenação, leitura total), `teacher` aprovado (leitura do próprio escopo),
  `student` (nenhum acesso — indicador de gestão não é visível a aluno).

Leitura em segurança: a agregação para a prestação de contas não expõe linha crua
ao navegador; segue o mesmo padrão do spec 001 (função `security definer` que
confere papel por `auth.uid()`, `grant execute` a `authenticated`, sem `select`
direto para `anon`/`authenticated`).

---

## 5. O que só o formulário oficial responde

Estas perguntas **bloqueiam a modelagem final** e não podem ser inventadas aqui:

1. **Catálogo de indicadores exigido.** Quais métricas, com qual `tipo`/`unidade`
   e qual granularidade de `escopo` (bolsista? escola? turma? convênio?) o
   formulário pede? Isto define a taxonomia concreta do envelope.
2. **Forma de agregação por indicador.** Um "total de alunos atendidos" é `count`
   de quê, sobre quais tabelas de origem? Soma simples, média, proporção ou série
   temporal?
3. **Período e corte.** O formulário consolida por mês civil, por vigência do
   convênio ou por semestre? Define a coluna `periodo`.
4. **Derivável vs. apontado.** Para cada indicador oficial, qual é derivável por
   query das tabelas de origem (alocação/carga/matrícula/progresso) e qual — se
   houver — só existe como apontamento manual auditado?
5. **Dimensões de exportação.** A prestação de contas é um documento por
   bolsista, por escola, por turma ou um único consolidado do convênio? Define o
   `escopo` e o agrupamento do painel.
6. **Limiar de dado de pessoa.** Quais indicadores expõem dado sensível de
   menor/bolsista e exigem o recorte de dedução separado (item 6 do plano-pai)?
7. **Formato de entrega.** O aceite do convênio é planilha estruturada, PDF
   assinado, upload em portal — ou combinação? Direciona exportação vs. painel
   interativo.

Sem resposta para 1–4, qualquer `CREATE TABLE gestao.indicador` é o chute que o
plano proíbe. Este contrato existe para que, quando o formulário chegar, o passo
2 (modelar `gestao.*`) seja preenchimento de fórmula, não redesenho.

---

## 6. Próximos passos propostos (não executados aqui)

1. Obter o formulário oficial (bloqueador nº 1 do plano-pai).
2. Converta este esboço em `specs/NNN-indicador-como-dado.md` aprovada
   (Constituição § I), fixando o catálogo derivado do formulário.
3. Só então: migration versionada de `gestao.*` + RLS + `lib/api/gestao`
   (card filho `t_2ed62c43`) + testes (unit com mock Supabase; migration real com
   `@electric-sql/pglite` já presente no repo desde o spec 001).
4. Branch `feat/<slug>` a partir de `development` (Constituição § VII).

---

## Não feito de propósito

- **Nenhuma migration, tabela, coluna ou código.** Escolha deliberada do aceite
  reduzido; reversível se o formulário destravar.
- **Nenhum EAV genérico total.** Rejeitado no item 2; envelope tipado em vez disso.
- **Nenhuma taxonomia de indicadores.** Inventá-la agora fixaria nomes antes de
  ver o formulário — o chute que o plano veta.
- **Nenhum dado de pessoa modelado.** A decisão de dado sensível (item 6 do
  plano-pai) continua pendente de design, não de adiamento.