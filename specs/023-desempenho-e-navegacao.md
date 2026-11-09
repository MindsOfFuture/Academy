# 023 — Site mais rápido e troca de mês mais fácil

Status: implementada (commit `4e5bf21`; em produção desde o merge `096c307`, 2026-11-09)
Constituição: `specs/constitution.md`

## Problema

O site demorava para carregar com login, cada clique escurecia a tela inteira, e trocar
de mês nas telas por período exigia clicar mês a mês.

Medido em 2026-11-09: sem login o site é rápido (home 0,3–0,8 s; demais ~0,07 s). Com
login, cada página fazia várias consultas ao Supabase **em fila**, cada uma ~250 ms (o
projeto Supabase fica longe da VPS, que está no Brasil; mudar de região foi descartado).

## Escopo

- **Carregamento:** esboço da página (skeleton) no lugar da tela escura. Na gestão, o
  esboço ocupa só o conteúdo; cabeçalho e abas ficam.
- **Login conferido uma vez por página:** layout, página e dados reaproveitam a mesma
  resposta; o middleware valida a sessão com `getClaims()` (ADR 023).
- **Home guardada pronta:** igual para todos, refeita no máximo a cada minuto e na hora
  quando a coordenação muda números, escola ou turma (ADR 022).
- **Seletor de mês único** em Alocação, Carga, Relatório e na janela da Equipe:
  ‹ › (44 px), lista para pular a qualquer mês (2 anos atrás a 1 à frente, sempre
  incluindo o aberto), "Este mês", setas ← → do teclado (não enquanto se digita; com
  janela aberta, só a de dentro responde).

**Fora de escopo:** mudar o Supabase de região; guardar pronta qualquer página com login.

## Critérios de aceite

- [x] `next build` marca `/` como estática com revalidação de 1 min (prova de que nada
  na home lê cookie ou sessão).
- [x] Home servida da cópia pronta: ~5 ms no servidor de produção local contra ~750 ms
  da versão anterior no ar (`x-nextjs-cache: HIT`). No ar após o deploy: ~0,07 s.
- [x] A home mostra só o que o visitante anônimo vê (antes, admin/autor logado via
  artigo em rascunho e professor via curso de professor na home).
- [x] Middleware: sem sessão em rota protegida continua redirecionando; cookies
  renovados continuam saindo (testes do middleware).
- [x] **Painel:** Supabase → Settings → JWT Keys → segredo migrado e chave ECC (P-256)
  em uso desde 2026-11-09 (`jwks.json` publica `ES256`, kid `60e62c8b…`). A chave HS256
  antiga ficou como "previous" — **não revogar**: a anon key e a service role key do
  projeto são assinadas com ela.

## Plano

- `app/loading.tsx` (esboço geral), `app/gestao/loading.tsx` (esboço da gestão).
- `lib/supabase/server.ts`: `usuarioDaRequisicao()` (id de quem está logado, `cache` do
  React por requisição, via `getClaims`) e `createPublicClient()` (sem login).
- `lib/supabase/middleware.ts`: `getClaims()` no lugar de `getUser()`.
- `lib/api/gestao/auth.ts`: `getGestaoPapel` com `cache`, sem `getUser` repetido;
  `relatorio.ts` e `pendencias.ts` usam `usuarioDaRequisicao`.
- `app/page.tsx`: `revalidate = 60`; `getHero`, `getArticles` e `listarCursosDaHome`
  leem com `createPublicClient`. `listCoursesServer` (Trilhas) segue com login, via
  `content.ts#consultarCursosAtivos`.
- `app/gestao/alocacao/actions.ts#executar` e `app/gestao/actions.ts` refazem `/`.
- `app/gestao/seletor-mes.tsx`; "hoje"/"mês corrente" de Brasília numa fonte só:
  `app/gestao/alocacao/rotulos.ts#hojeIso`/`mesCorrente`.

## Testes

- `tests/unit/app/gestao/seletor-mes.test.tsx` — links, lista, "Este mês", teclado.
- `tests/unit/lib/supabase/middleware-fail-closed.test.ts` — comportamento preservado.
- `tests/unit/lib/api/gestao/auth.test.ts`, `tests/unit/lib/api/content.test.ts`.
