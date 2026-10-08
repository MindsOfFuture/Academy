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

## 017 — Cidadania Financeira determinística e orientada por pontuação
Status: aceita

O jogo fonte embaralha opções com uma semente e mantém três métricas dinâmicas por
papel. A integração no Academy precisa ser reproduzível em aulas, avaliações e
tecnologia assistiva; nela, as métricas não eram exibidas nem atualizadas, enquanto
a pontuação, os tipos de resposta e os quatro diagnósticos já cobrem o retorno ao aluno.

As quatro opções ficam na ordem autoral A–D e o resultado continua baseado em pontos,
acertos, parciais e erros. As declarações mortas de métricas saem dos dados. Permanecem
os quatro papéis, os 100 cenários, os feedbacks e a progressão completa.

Consequência: duas tentativas mostram as opções na mesma ordem e não simulam efeitos
separados em saúde fiscal, popularidade ou estabilidade. Se o objetivo pedagógico
passar a exigir comparação dessas dimensões, a evolução deve restaurar estado,
visualização e testes das três métricas juntos — não apenas seus nomes.

## 018 — 014 fechada: VPS é o único alvo de deploy, Vercel desativada
Status: aceita · fecha 014

O 014 deixou os dois alvos convivendo enquanto a decisão de infra não fechava. Ela
fechou: o VPS Hostinger atende `mindsofthefuture.com.br` em produção (estado
verificado em `RUNBOOK.md`), com tráfego real confirmado por vários dias antes de
mexer na Vercel. Dois alvos vivos é como alguém publica no lugar errado e depois
não entende por que a correção não subiu.

O alvo Vercel foi encerrado: deploy automático desligado e domínios customizados
removidos do projeto. Deploy passa a ter um caminho só — o script de release no
VPS (`RUNBOOK.md` §2). `output: "standalone"` no `next.config.ts`, que o 014
introduziu para o VPS enquanto a Vercel ignorava, agora é a única razão pela qual
o build existe daquele jeito. README e docs não descrevem mais deploy pela Vercel.

Consequência: não há mais preview deploy por PR nem rollback por dashboard — o
rollback é o script de `/var/backups/academy` (`RUNBOOK.md` §3), e validar mudança
antes do merge é local ou no próprio VPS. O código ainda lê `VERCEL_URL` como
fallback de origem (`app/layout.tsx`, `lib/supabase/redirect.ts`, mais o teste em
`tests/unit/app/auth/callback/route.test.ts`): é ramo morto em produção, onde
`NEXT_PUBLIC_APP_URL` é obrigatória, e a remoção não entrou no escopo deste
fechamento. Voltar para a Vercel deixou de ser troca de configuração e passa a
ser decisão nova, com ADR próprio.

## 019 — Job agendado e processo longo no VPS: systemd timer, processo separado
Status: aceita

O VPS (ADR 018) habilita o que a Vercel não tinha em escopo (ADR 014): cron de
sistema, processo sem teto de timeout e dump automatizado do banco. O `/gestao`
(`docs/plans/sistema-interno-gestao.md`, bloqueador 3) vai precisar dos dois
primeiros, e decidir depois seria refazer o corte.

Job agendado é systemd timer + service oneshot `academy-<job>`, rodando como o
usuário `academy`, log no journal, e `OnFailure=` obrigatório disparando email
via Resend (`RESEND_API_KEY` que já existe). Crontab descartado: sem log por job,
sem aviso de falha, sem limite de recurso. Processo longo (geração de `.docx`,
1×/mês) roda como unidade própria, fora do `academy.service`, com
`CPUQuota=100%`/`CPUWeight=20` para nunca tirar do site mais que 1 dos 2 vCPU.
Disparar por request HTTP ao site foi descartado: esbarra no
`proxy_read_timeout 300s` do nginx e divide o event loop com os alunos.

Consequência: padrão, unidade de exemplo e comandos em `RUNBOOK.md` §8. É infra,
não o módulo: nenhuma tabela, nenhuma rota. Onde mora o código do job (o
standalone não carrega script avulso) fica para o card do `/gestao`. Fila de
jobs e Docker continuam fora, como o plano já registra.

## 020 — 013 fechada: imagem remota só de cinco origens nomeadas
Status: aceita · fecha 013

O 013 previa restringir `remotePatterns` ao host do Supabase "quando o conjunto
de origens estabilizar". O `hostname: "**"` já saiu do `next.config.ts` (commit
`ba2b00f`), mas a lista ficou com cinco origens, não uma — e a regra escrita não
acompanhou. O site fazia uma coisa e o ADR dizia outra.

Decisão: as cinco ficam, nomeadas uma a uma no `next.config.ts`:

- host do Supabase, lido de `NEXT_PUBLIC_SUPABASE_URL` — avatar enviado, capa de
  curso, artigo e trilha, mídia de aula;
- `lh3.googleusercontent.com` — avatar de quem entra com conta Google (18 perfis
  em 2026-10-08), servido pelo Google, não copiado para o Storage;
- `images.unsplash.com` — fotos da página pública de créditos, conteúdo publicado
  e combinado com a coordenação; trocar exige rehospedar e republicar a página;
- `img.youtube.com` e `i.ytimg.com` — miniatura de vídeo. Em 2026-10-08 nenhum
  código nem registro do banco usa esses dois hosts; ficam por decisão, e são os
  primeiros candidatos a sair se a lista for revisada.

Qualquer outro host é recusado pelo otimizador do Next — erro de otimização, não
fallback. Varredura de 2026-10-08 no banco (`media_file`, `credits_entries`,
`user_profile.avatar_url`, `lesson.content_url`, `<img>` em `article.content`):
12 linhas de `media_file` apontam para hosts de fora (jusbr, wikimedia, gstatic,
devmedia e outros), mas nenhuma é referenciada por curso, artigo, trilha ou
material de turma — são órfãs, não há imagem publicada quebrando.

Consequência: o custo do VPS fica limitado a origens conhecidas, e incluir uma
nova origem é mudança de código com bloco novo aqui, não URL colada no painel.
Professor que colar URL de fora vê a imagem falhar; o caminho é subir o arquivo
para o Storage.

## 021 — Gestão interna: cinco guardrails e duas correções da prática
Status: aceita

O plano `docs/plans/sistema-interno-gestao.md` fixou regras para o módulo interno
antes da primeira tabela. O schema já está em produção (migrations aplicadas de
2026-09-15 a 2026-09-28) e este bloco registra o que o banco e o código fazem de
fato, conferido em 2026-10-08 — não mais proposta. Registro pedido como "018" no
card; o número já estava ocupado.

**Guardrails — merge que quebre um deles não entra:**

1. **Schema separado.** Tudo em `gestao.*` (14 tabelas hoje). Nenhuma tabela da
   gestão no `public`. Única exceção deliberada: `public.gestao_membro_papel()`,
   ponte que o cliente Supabase alcança por `rpc` sem expor o schema.
2. **RLS própria por papel do projeto.** RLS ligada em todas as tabelas, toda
   policy passa por `gestao.usuario_com_papel()`. `createServiceRoleClient()` e
   `createAdminClient()` são proibidos no módulo, sem exceção: o dado é
   institucional e de pessoa. Hoje não há nenhum uso; a regra é cobrada na
   revisão de PR, não por ferramenta.
3. **Toda query por `lib/api/gestao/`** (ADR 005). Componente e página não falam
   com Supabase. Onde o módulo roda é decidido pela diretiva no topo do arquivo,
   não pelo nome: os módulos de query começam com `import "server-only"`, as
   ações com `"use server"`; `types.ts` e `validacao.ts` não têm diretiva porque
   não tocam no banco. `index.ts` reexporta módulos `server-only` e herda a
   restrição.
4. **Rota fechada.** `/gestao` fica fora de `PUBLIC_PATH_PREFIXES`; o middleware
   exige sessão e `app/gestao/guard.ts#exigirMembro` checa o papel no servidor,
   chamado pelo layout **e** pela página (renderizam em paralelo). Sem papel
   responde 404, não 403, para não revelar que a tela existe. A RLS continua
   sendo a autorização de cada query; o guard é defesa em profundidade.
5. **Feature flag.** Lida em `lib/api/gestao/feature-flags.ts#gestaoHabilitada`,
   a cada request (layout com `dynamic = "force-dynamic"`). Fechada por padrão:
   só liga com `GESTAO_ENABLED` em `1|true|on|yes`. Desligar em produção: tirar a
   linha (ou deixar vazia) em `/etc/academy.env` e
   `sudo systemctl restart academy.service` — sem build, porque a variável não
   é `NEXT_PUBLIC_*`. Desligada, toda tela de `/gestao` responde 404 e toda
   server action recusa a escrita. A flag é checada em dois pontos: no guard
   das telas e em `lib/api/gestao/auth.ts#ensureGestaoMember()`, por onde passa
   toda ação de `app/gestao/*/actions.ts`. Até 2026-10-08 só o guard checava —
   com o módulo desligado, um membro ainda escrevia chamando a ação direto.
   Ação nova tem que passar por `ensureGestaoMember()`; o teste em
   `tests/unit/lib/api/gestao/auth.test.ts` prova que a flag desligada barra até
   a coordenação antes de consultar o banco.

**Papel do módulo.** `coordenacao` e `bolsista`, em `gestao.papel_membro` (uma
linha por pessoa, as duas marcas podem estar ligadas ao mesmo tempo, desligamento
por `desligado_em`). Não reusa `admin` de `public.role`: administrar o produto e
governar o projeto são eixos diferentes, e misturar os dois repetiria o problema
do ADR 002. Ser admin do Academy não dá acesso à gestão.

**Convenção de migration** — o schema `gestao` não repete o ADR 008:

- Nome `YYYYMMDD_gestao_<assunto>.sql` em `supabase/migrations/`. A ordem é a do
  nome; arquivos do mesmo dia dizem no cabeçalho de qual dependem.
- O schema nasce inteiro em arquivo, com policies, grants e funções. Banco novo
  sobe aplicando os arquivos `*gestao*` em ordem, sem clone do projeto hospedado.
- Arquivo idempotente (`if not exists`, `create or replace`, `drop ... if
  exists`) e dentro de `begin; ... commit;`.
- Cada migration ganha teste em `tests/integration/` que aplica o SQL em PGlite
  e prova as policies; roda no `npm test` comum.
- Aplicar não é automático: produção é compartilhada e depende de aprovação
  explícita de quem responde pelo banco. Código e migration entram no ar juntos.
- Reverter é migration nova para a frente, como este log. Não há arquivo `down`.
  Migration já aplicada não é reescrita: a correção vira arquivo novo.

**Correções que a aplicação trouxe:**

- **Autoria não é obrigatória quando o autor pode ser apagado.** `criado_por`
  nasceu `not null ... on delete set null` — combinação que faz a exclusão do
  usuário falhar em vez de soltar a autoria. Virou opcional em todas as tabelas
  (`1e55a63`). Quem precisa de autoria inviolável guarda o id sem chave
  estrangeira, como `registro_auditoria.autor`. As referências a
  `papel_membro` com `on delete restrict` (bolsa, alocação, melhoria) são outra
  coisa e ficam: membro sai por desligamento, não por exclusão, e a exclusão de
  conta do Academy anonimiza `user_profile` em vez de apagar.
- **Toda função que decide permissão tem `search_path` fixo.** `gestao.e_membro()`
  nasceu sem ele; um `search_path` escolhido pelo chamador poderia resolver
  `usuario_com_papel` para outro objeto. Em 2026-10-08 todas as funções de
  `gestao` e a ponte pública fixam o caminho, conferido no banco.

Consequência: a correção de `1e55a63` foi feita reescrevendo o arquivo de
2026-09-05, e produção recebeu a parte do `e_membro` como migration à parte
(`gestao_e_membro_search_path`), sem arquivo no repo. O resultado final é o
mesmo, mas é exatamente o que a convenção acima passa a proibir.
