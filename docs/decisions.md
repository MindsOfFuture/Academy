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
Status: aceita, congelada · **Substituída por 016**

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

## 015 — Auditoria de segurança de 2026-08-25: `revoke` e policy, não reescrita
Status: aceita

Data: 2026-09-02 (decisão tomada em 2026-08-25, registrada aqui depois).

A auditoria do projeto hospedado achou quatro classes de falha, todas alcançáveis
com a anon key — que vai no bundle do browser. RPCs `security definer` com EXECUTE
para `public`/`anon`: a pior, `scrub_deleted_user_personal_data`, apagava os dados
pessoais e os papéis de qualquer usuário por `/rest/v1/rpc/`. Policies de RLS
amplas demais: `Teachers view all profiles` liberava SELECT em toda a
`user_profile` (CPF, telefone, endereço e data de nascimento de menores) para
qualquer portador do papel `teacher`; `Author manage articles` era `for all` sem
`with check`, então o USING valia como check no INSERT e qualquer autenticado
publicava na `/artigos` pública; a policy de INSERT em `certificate` aceitava
nome, CPF e título do curso vindos do cliente. `search_path` mutável nas funções
`security definer`. E o CPF completo trafegando na resposta de
`validate_certificate`, que é rota pública.

Correção por `revoke` e reescrita de policy, sem tocar nos corpos das funções.
`supabase/migrations/20260825_security_hardening.sql` fecha as quatro classes;
`..._analytics_guard.sql` fecha a metade que sobrava nas RPCs de analytics, onde
`authenticated` precisa continuar chamando (a aba roda no browser) — a guarda
entra por fora, `*_impl` sem EXECUTE mais um wrapper que chama
`assert_teacher_or_admin()`. `search_path` fixo em `'public'` e não `''`: os
corpos existentes usam nomes não qualificados em alguns pontos, e `''` os
quebraria em runtime. A máscara de CPF passa a ser feita no banco.

As duas migrations foram aplicadas direto no projeto hospedado (ver 008), então o
RLS de produção já está estrito — aqui o repo documenta, não provisiona. Efeito
colateral conhecido e ainda aberto: a policy de INSERT em `certificate` valida os
três campos contra o perfil de `auth.uid()`, mas `issueCertificateForStudent()`
(`lib/api/certificates.ts`) insere os dados de **outro** usuário quando professor
ou admin emite, usando o cliente do browser — o RLS recusa. Emissão pelo próprio
aluno funciona; emissão por professor/admin está quebrada desde a aplicação da
migration, e a correção é pendente.

## 016 — 007 concluída: o shim `components/api/*` foi removido
Status: aceita · substitui 007

Data: 2026-09-02.

007 previa que a camada morreria por atrito, e morreu: `9d25c1c` (2026-08-25) apagou
`components/api/admApi.tsx`, `courseApi.tsx`, `indexApi.tsx` e `students.tsx` junto com
`src/services/supabase/*` (7 arquivos) e `components/dashboard/dashboard-content.tsx`.
Nenhum módulo importa mais `components/api` nem `src/services`, e não existe `src/` no
repo. 007 fica registrada como cumprida, não revertida — o corpo dela continua válido
como histórico de por que os aliases em português existiram.

O custo de não registrar isso era concreto: a constituição legislava sobre os três
caminhos apagados ("shim de compat", "código morto, não estender") e `docs/supabase.md`
localizava as tabelas fantasma em `src/services/supabase/*`. Regra que aponta para
caminho inexistente não é só ruído: ela bloqueia merge sem ser verificável. As três
linhas saíram da constituição e o parágrafo de `docs/supabase.md` passou a descrever os
nomes fantasma sem ancorar em diretório (`nossos_cursos`, `users_cursos`,
`progresso_aluno`, `modules`, `lessons` seguem inexistentes no schema vivo).

Consequência: import de `components/api/*` ou `src/services/*` em código novo agora
quebra o build em vez de violar uma regra — a proibição passou da spec para o
compilador, e por isso não precisa mais estar escrita.
