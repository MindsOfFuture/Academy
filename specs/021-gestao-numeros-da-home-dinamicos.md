# 021 — Números da página inicial somam o que está cadastrado na gestão

Status: implementada (commit `ca0d95f`, 2026-11-08; em produção desde o merge `096c307`, 2026-11-09)
Constituição: `specs/constitution.md`

## Problema

A coordenação atualizava à mão os números "escolas atendidas" e "alunos impactados"
da página inicial, mesmo com escolas e turmas já cadastradas na gestão.

**Antes de começar (2026-11-08):** a coordenação pediu para limpar os dados de teste
da gestão em produção. Foram apagados os 69 encontros do E2E (datas em 2001, nas escolas
"Escola E2E 1/2"), a escola "teste" com a "Turma 02 escola teste" e seus 2 encontros, e
a escola "escola teste" (vazia). Ficaram, de propósito, as escolas "Escola E2E 1/2"
(fixtures do E2E da alocação, ver `e2e/README.md`), a turma da E.E. Antônio Carlos e o
encontro "Aula de IA" de 21/10, que são reais. A exclusão ficou na auditoria em nome da
conta de quem pediu.

## Escopo

- O valor digitado em "Números da página inicial" (spec 019) passa a ser uma **base**:
  o atendido antes da gestão.
- A página inicial mostra **base + cadastros**: escolas cadastradas na gestão e a soma
  dos alunos das turmas.
- A turma ganha "Número de alunos (opcional)", de 0 a 1000, no cadastro e na edição.

**Fora de escopo:** contar alunos individualmente (`gestao.aluno`); número de escolas
por turma ativa — conta toda escola cadastrada.

## Critérios de aceite

- [x] Dada base 35/1499 e uma escola real cadastrada, a página inicial mostra 36 escolas.
- [x] Turma com 25 alunos soma 25 aos alunos; turma sem número soma 0.
- [x] Escola de teste (E2E, `teste = true`) e turma que "não abriu" ficam fora da conta.
- [x] O formulário da coordenação mostra e grava **só a base**; salvar sem mudar nada
  não soma os cadastros de novo.
- [x] Se a função do banco falhar, a página inicial mostra só a base.

## Plano

- **Dados:** `gestao.turma.n_alunos` (opcional, 0–1000) e
  `public.numeros_da_home()` (security definer, anon pode chamar; devolve só os dois
  totais) — `supabase/migrations/20261108_gestao_numeros_da_home.sql`.
- **Leitura:** `lib/api/content.ts#getHero` devolve o total e, à parte, `base` (o que a
  coordenação digitou), que é o que `app/gestao/numeros-do-site.tsx` edita.
- **Atualização da página inicial:** ver spec 023 — a home é guardada pronta; salvar
  números, escola ou turma manda refazê-la (`revalidatePath("/")`).

## Testes

- `tests/integration/gestao-numeros-da-home-migration.test.ts` — base + cadastros,
  exclusões, anon lê.
- `tests/unit/lib/api/content.test.ts` — total do banco, base à parte, queda para a base.
- `tests/unit/app/gestao/page-auth.test.tsx` — o formulário recebe a base, não o total.
