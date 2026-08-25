# Constituição — Academy

Regras não-negociáveis. Toda spec, plano e PR é avaliado contra elas.
Arquitetura descritiva vive em `CLAUDE.md`; aqui só o que **bloqueia merge**.

## I. Spec antes de código

Feature nova ou mudança de comportamento → um arquivo `specs/NNN-slug.md`
(copiar `specs/TEMPLATE.md`) aprovado antes do primeiro commit de código.
Bugfix, refactor sem mudança de comportamento e ajuste de copy: sem spec.

Spec descreve **o quê** e **por quê**, em termos de aluno/professor/admin.
Nome de tabela, componente ou biblioteca em `## Escopo` é violação — isso é `## Plano`.

## II. Menor solução que funciona

Ordem obrigatória de escolha, para no primeiro degrau que resolve:
já existe no repo → stdlib/Web API → feature nativa do Next/Postgres →
dependência já instalada → linha única → código novo.

- Dependência nova exige justificativa escrita na spec. `package.json` cresce, ninguém tira.
- Abstração com uma implementação só: rejeitada.
- Config para valor que nunca muda: rejeitada.
- Atalho deliberado com teto conhecido: comentário `// ponytail: <teto>, <upgrade>`.

## III. Autorização é server-side

- Cliente Supabase é escolha deliberada, nunca cópia: `client.ts` (browser, RLS),
  `server.ts#createClient` (SSR, RLS), `createAdminClient()` (verifica role `admin`),
  `createServiceRoleClient()` (**sem checagem** — só fluxo sem caller autenticado).
- Publicar conteúdo exige role `teacher` **e** `verification_status = 'approved'`:
  `ensureCurrentTeacherVerifiedForPublishing()` /
  `ensureTeacherVerifiedForPublishingByUserId()` (`lib/api/profiles-server.ts`).
- Conteúdo de professor é escopado por `owner_id` (`ensureCourseOwnerOrAdmin`, interno a `lib/api/courses.ts`); admin ignora.
- Rota pública = entrada em `PUBLIC_PATH_PREFIXES` (`lib/supabase/middleware.ts`)
  **e** checagem de auth própria dentro do handler. Uma sem a outra é bug de segurança.
- Nada entre `createServerClient` e `auth.getUser()` no middleware.
- `SUPABASE_SERVICE_ROLE_KEY` nunca em `NEXT_PUBLIC_*`.

## IV. Query só em `lib/api/`

Componente e rota nunca falam com Supabase direto. `lib/api/*` mapeia
`*Row` (snake_case) → `*Summary`/`*Detail` (camelCase), tipos em `lib/api/types.ts`.

- Diretiva de topo (`import "server-only"` / `"use server"` / nenhuma) define onde o
  módulo roda. O sufixo `-server` **não** é confiável — ler a primeira linha antes de importar.
- `courses.ts`/`courses-server.ts` e `enrollments.ts`/`enrollments-server.ts` são duplicatas.
  Mudou mapeamento em um, muda no outro no mesmo commit.
- Mídia sempre por `getThumbUrl()`/`getCoverUrl()` — join do Supabase devolve objeto **ou** array.
- `components/api/*` é shim de compatibilidade. Zero lógica nova ali.
- `src/services/supabase/*` e `components/dashboard/dashboard-content.tsx` são código morto.
  Não estender, não citar em spec.

## V. Teste onde falha

Lógica não-trivial (branch, permissão, mapeamento, cálculo de progresso/certificado)
sai com **um** teste que quebra se ela quebrar. Não uma suíte por função.

- Unit em `tests/` espelhando o caminho do source. Supabase pelo mock de `tests/mocks/supabase.ts`.
- `vi.mock` antes do `import` do módulo sob teste.
- E2E no diretório certo ou não roda: `e2e/desktop|mobile|flows|visual`.
- Merge exige `npm run lint` e `npm test -- --run --coverage` (thresholds 60/50/60/60).
  ESLint tem regras em `warn` — warning não é aprovação.

## VI. Português no produto

Comentário, string de UI e mensagem de erro em português. Erro de API sai como
`{ error: message }`; status inferido do texto (403 para role/verificação, senão 500).

## VII. Fluxo de branch

`feat/<slug>` a partir de `development` → PR para `development` → PR de `development`
para `main`. Nunca commit direto em `development` ou `main`.

- Branch de feature carrega a spec (`specs/NNN-slug.md`) no primeiro commit.
- PR para `development` roda lint + unit (`.github/workflows/tests.yml`).
- PR de `development` para `main` roda também o E2E (`playwright.yml`). `main` é o que vai pro ar.
- Hotfix: mesma regra. Sai de `main`, PR para `main`, e **volta** para `development` no mesmo dia.

## Emenda

Mudar esta constituição é PR próprio, só ela, com a justificativa no corpo.
