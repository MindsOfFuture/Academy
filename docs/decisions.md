# Registro de Decisões (ADR)

Log append-only. Uma decisão = um bloco. Nunca editar bloco antigo — para reverter,
adicionar bloco novo e marcar o antigo como `Substituída por NNN`.

Só entra aqui decisão **cara de reverter** ou que surpreende quem lê o código.
Escolha óbvia não vira ADR.

Formato: `## NNN — título` · Status · Contexto · Decisão · Consequência.

> Blocos 001–014 são retroativos, escritos em 2026-08-25 a partir do código existente.
> As datas originais não foram recuperadas.

---

## 001 — Supabase como backend, sem serviço próprio
Status: aceita

Equipe pequena, projeto com prazo de convênio (UFJF + Governo MG). Auth, Postgres,
storage e realtime precisavam existir no dia 1.

Supabase hospedado + Next.js App Router. Sem API própria, sem ORM.

Autorização passa a depender de RLS no banco + checagem no servidor. Erro na escolha
do cliente vira falha de segurança silenciosa (ver 002). Portabilidade fica cara:
sair do Supabase é reescrever `lib/api/` inteiro.

## 002 — Três clientes Supabase + um sem checagem
Status: aceita

Fluxos diferentes têm callers diferentes: browser autenticado, SSR com cookie,
mutação de admin, e fan-out de notificação que roda sem caller nenhum.

`lib/supabase/client.ts#createClient` (browser, RLS) · `server.ts#createClient`
(SSR, RLS) · `server.ts#createAdminClient` (valida role `admin`, lança se não for)
· `server.ts#createServiceRoleClient` (**service role cru, zero checagem**).

`createServiceRoleClient()` ignora RLS por completo. Todo uso precisa de guarda
escrita à mão no chamador. É a maior superfície de risco do repo.

## 003 — Roles relacionais, não coluna
Status: aceita

Usuário pode acumular papel e o conjunto muda com o tempo.

`user_role(user_profile_id, role_id)` → `role(id, name)`. Precedência
admin > teacher > student; ausência de linha = `student`.
Resolver canônico: `fetchRoleForUser` em `lib/api/profiles-server.ts`.

Todo check de papel custa join. `lib/api/courses.ts` tem variante client-side própria
do resolver — duas implementações da mesma regra.

## 004 — Verificação de professor separada do papel
Status: aceita

Qualquer um se cadastra como professor. Publicar conteúdo para escola pública exige
conferência humana do documento de qualificação.

`verification_status` (`pending`/`approved`/`rejected`) em `user_profile` +
`teacher_request`, independente do papel. Publicar exige papel `teacher` **e**
`approved`, via `ensureCurrentTeacherVerifiedForPublishing()`.

Ter o papel não basta. Rota nova de publicação que esquece o `ensure…()` fura o gate
sem quebrar teste nenhum.

## 005 — `lib/api/` é a única fronteira de query
Status: aceita

Query espalhada em componente torna impossível auditar autorização e mapeamento.

Componente e route handler chamam `lib/api/*`. Cada módulo mapeia `*Row` (snake_case)
→ `*Summary`/`*Detail` (camelCase), tipos em `lib/api/types.ts`.

Onde o módulo roda é definido pela diretiva de topo (`import "server-only"` /
`"use server"` / nenhuma) — **o sufixo `-server` no nome não é confiável**.
Importar server-only no cliente quebra no build, não no review.

## 006 — Duplicar courses/enrollments em vez de abstrair
Status: aceita, com dívida

Browser e servidor precisam do mesmo mapeamento com clientes diferentes.
Unificar exigiria injeção de cliente em toda a camada.

`courses.ts`/`courses-server.ts` e `enrollments.ts`/`enrollments-server.ts` são
quase-duplicatas, `mapCourse`/`mapLesson`/`mapModule` copiados.

Mudança de mapeamento em um lado sem o outro = bug de dado divergente por rota.
Regra na constituição: alterar os dois no mesmo commit.

## 007 — `components/api/*` só re-exporta
Status: aceita, congelada

Código legado importava nomes em português (`getCursos`, `matricularAluno`).
Renomear tudo de uma vez era diff grande sem ganho.

`admApi.tsx`/`courseApi.tsx`/`indexApi.tsx` viraram aliases para `lib/api`.
`students.tsx` é stub vazio.

Camada morre por atrito: código novo importa `lib/api/*` direto, nada de lógica
nova no shim.

## 008 — Schema vive no Supabase hospedado
Status: aceita, com risco

Schema evoluiu pelo dashboard antes do repo ter disciplina de migration.

`supabase/migrations/` tem 3 arquivos recentes (credits, scrub de usuário deletado).
**Não é histórico completo.** Fonte de verdade das formas de tabela: interfaces `*Row`
em `lib/api/types.ts` + strings de select em `lib/api/`.

Não dá para recriar o banco do zero a partir do repo. Ambiente novo (staging, VPS)
depende de clone do projeto hospedado. Ver `docs/supabase.md`.

## 009 — Telemetria append-only com batch no cliente
Status: aceita

Métrica pedagógica precisa de granularidade por evento sem derrubar o banco.

`lib/services/tracking.service.ts`: singleton client-side, flush a 10 eventos ou 2s,
mais `visibilitychange`/`beforeunload`. Grava em `telemetry_video_interaction`,
`telemetry_assessment_interaction`, `telemetry_content_review`.

Sem update, sem delete: correção é evento novo. Aba fechada com força perde até
2s de eventos — aceito, telemetria não é dado transacional.

## 010 — Falha de email nunca quebra a notificação
Status: aceita

Resend fora do ar não pode impedir aluno de ver aviso no app.

`lib/api/notifications-server.ts` grava a linha em `notification` e chama
`sendNotificationEmail`; erro de envio é logado e engolido.

Email é best-effort. Não existe fila nem retry: envio perdido é perdido.
`RESEND_TEST_RECIPIENT` redireciona **todo** envio — em produção precisa estar vazio.

## 011 — Certificado em PDF no cliente + código de verificação
Status: aceita

Certificado precisa ser verificável por terceiro (escola, secretaria) sem login.

`lib/api/certificates.ts` confere conclusão e emite código; `lib/utils/pdfGenerator.ts`
gera o PDF com jsPDF no browser; `/validar` confere o código.

Autenticidade está no código consultável, não no arquivo. PDF é reimprimível e não
assinado — quem confia no arquivo sem validar o código se engana.

## 012 — Teste fora do source, E2E por diretório
Status: aceita

Unit em `tests/` espelhando o caminho do source; `tsconfig.json` exclui `tests/`
(Vitest transpila, `tsc --noEmit` não checa spec).
Playwright: o diretório decide os projetos — `e2e/desktop|mobile|flows|visual`.

Spec no diretório errado não roda e ninguém percebe. Tipo quebrado em teste não
aparece no typecheck.

## 013 — `remotePatterns` aceita qualquer host https
Status: aceita, revisar

`next.config.ts` libera `hostname: "**"`. Conveniente enquanto a origem das mídias
mudava (Supabase storage, CDNs, URLs coladas por professor).

Qualquer URL vira imagem otimizada pelo servidor: consome CPU/banda do host com
conteúdo de terceiro. Em VPS isso vira custo direto e vetor de abuso — restringir
ao host do Supabase quando o conjunto de origens estabilizar.

## 014 — Preparar VPS mantendo Vercel
Status: aceita

Convênio pode exigir hospedagem própria (dado de aluno de escola pública, infra do
estado). Trocar às pressas seria pior.

`output: "standalone"` no `next.config.ts` — Vercel ignora, VPS ganha deploy
autocontido. Procedimento em `docs/deploy-vps.md`.

Sem Docker, sem IaC: um systemd + nginx. Os dois alvos convivem enquanto a decisão
de infra não fecha. Recursos de Vercel não usados hoje (cron, edge) continuam fora
de escopo de propósito.
