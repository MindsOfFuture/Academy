# 001 — Telemetria semântica e Analytics administrativo

Status: aprovada
Constituição: `specs/constitution.md`

## Problema

Administradores não conseguem confirmar, antes da entrada dos alunos, quais ações educacionais ocorreram nem usar essas ações para acompanhar engajamento, funil e atividade recente com privacidade adequada.

## Escopo

- O aluno autenticado passa a gerar eventos semânticos ao iniciar uma sessão, navegar, abrir trilhas, cursos, aulas, recursos e atividades, concluir ou desmarcar aulas, matricular-se, entregar atividades, enviar mensagens e emitir certificado.
- O administrador passa a visualizar, no Analytics existente, alunos ativos, sessões, interações diárias, funil educacional, itens mais acessados, frescor e atividade recente por visão global, trilha, curso e aluno.
- A coleta é best-effort, deduplicada e não interrompe nenhuma ação educacional quando falha.
- A coleta aceita somente contexto educacional estritamente necessário e nunca persiste conteúdo livre ou identificadores pessoais no campo de metadados.

**Fora de escopo:** rastreamento de cliques ou seletores do DOM, conteúdo de mensagens/respostas/arquivos/comentários, CPF, nome, email, IP, referrer, query string, hash, user-agent bruto, avaliações inexistentes, nova dependência de runtime, aplicação da migration no ambiente hospedado e deploy.

## Critérios de aceite

- [ ] Dado um usuário autenticado, quando uma ação do catálogo termina com sucesso, então um evento semântico com identificador idempotente, sessão, pathname normalizado e contexto educacional é persistido.
- [ ] Dado um usuário anônimo ou uma ação que falha, quando o fluxo termina, então nenhum evento de sucesso é persistido.
- [ ] Dado um payload fora do catálogo, com PII, conteúdo livre, rota com query/hash ou metadados acima de 2 KB, quando enviado, então a API o rejeita sem persistir o lote.
- [ ] Dado um payload que tenta informar outro usuário, quando enviado, então a identidade persistida vem exclusivamente da sessão autenticada.
- [ ] Dado retry do mesmo evento, quando o lote é reprocessado, então existe no máximo uma linha para o identificador.
- [ ] Dado erro de transporte, quando a fila tenta novamente, então há limites de tamanho e tentativas e a experiência principal continua funcionando.
- [ ] Dado um administrador e um período, quando abre Analytics, então todos os KPIs semânticos respeitam o período e os gráficos legados continuam disponíveis.
- [ ] Dado um aluno, quando tenta consultar agregados semânticos, então recebe acesso negado e nenhuma linha crua é exposta ao navegador.
- [ ] Dado um conjunto conhecido de eventos, quando agregado, então presença, contagens, funil e frescor coincidem com os valores calculados manualmente.

## Plano

- **Degrau da escada:** reutilizar o singleton de tracking, o provider global, a aba Analytics, o cliente Supabase autenticado (`server.ts#createClient`), a autorização nativa do Postgres (`security definer` + `grant execute`) e Vitest; usar Web APIs (`fetch`, `crypto.randomUUID`, `TextEncoder`) e agregação server-side.
- **Arquivos:** `specs/001-telemetria-semantica-analytics.md`; `package.json`; `package-lock.json`; `supabase/migrations/20260902_learning_event_telemetry.sql`; `lib/api/telemetry-types.ts`; `lib/api/telemetry-validation.ts`; `lib/api/telemetry-server.ts`; `lib/api/learning-analytics.ts`; `lib/services/tracking.service.ts`; `components/tracking/TrackingProvider.tsx`; `components/content-review/ContentReview.tsx`; `app/api/telemetry/events/route.ts`; `app/api/analytics/events/route.ts`; `app/course/page.tsx`; `app/protected/activitie/page.tsx`; `components/activities/activity-chat.tsx`; `components/trilhas/TrilhasClient.tsx`; `components/dashboard/Analytics/AnalyticsTab.tsx`; `components/dashboard/Analytics/GlobalAnalytics.tsx`; `components/dashboard/Analytics/LearningPathAnalytics.tsx`; `components/dashboard/Analytics/CourseAnalytics.tsx`; `components/dashboard/Analytics/StudentAnalytics.tsx`; `components/dashboard/Analytics/hooks/useAnalytics.ts`; testes espelhados sob `tests/unit/` e teste real da migration sob `tests/integration/`; `.github/workflows/tests.yml`.
- **Dados:** nova tabela append-only `telemetry_learning_event` com PK `event_id`, tempos de ocorrência/recebimento, identidade da sessão, nome, pathname, IDs opcionais de trilha/curso/aula/atividade e `metadata` JSON; índices de período, usuário, evento e contexto; RLS permite somente INSERT da própria identidade autenticada, sem leitura/alteração/remoção direta. A leitura do Analytics sai por uma função `collect_learning_analytics_snapshot`, que devolve um envelope `jsonb` com os eventos do recorte e os IDs classificados como aluno.
- **Autorização:** ingestão usa sessão SSR e substitui qualquer identidade do payload; agregação usa o cliente SSR autenticado sobre uma função `security definer` que confere o papel `admin` por `auth.uid()`, nega anônimo e não-admin, valida escopo/id/teto e só concede `execute` a `authenticated`; a tabela continua sem `select` para `anon`/`authenticated` e as linhas cruas ficam somente no servidor. A service role sai desse caminho: a checagem de papel passa a viver no banco, junto do próprio snapshot. Nenhuma rota é pública nem entra em `PUBLIC_PATH_PREFIXES`.
- **Dependência nova:** `@electric-sql/pglite` somente em desenvolvimento, justificada para executar migration, grants, RLS e deduplicação em PostgreSQL real sem credenciais, Docker ou acesso ao Supabase hospedado; não entra no bundle de runtime.
- **Dependência nova:** `pg` e `@types/pg` somente em desenvolvimento. PGlite é single-connection: ele prova schema, RLS, grants e o recorte da RPC, mas não coloca duas sessões em disputa, então não prova concorrência. A prova exige três conexões simultâneas (a que agrega, a que insere e a que observa `pg_stat_activity`), e nenhum degrau anterior da escada entrega isso: o repo não tem cliente Postgres, `@supabase/supabase-js` fala HTTP com o PostgREST e não expõe transação, lock nem sessão, e `psql` por `child_process` obrigaria a orquestrar três processos por stdin/stdout, sem controle sobre onde cada statement bloqueia. `pg` é o cliente do protocolo nativo, roda em Linux, macOS e Windows sem binário externo e fica fora do bundle de runtime.
- **Atalhos:** agregação server-side em memória a partir de **uma única RPC**; o Postgres lê o conjunto limitado de eventos e a classificação de papéis sob o mesmo snapshot de statement e devolve no máximo 100001 linhas mais o campo `overflow`, então o limite de linhas do PostgREST não omite dado em silêncio. Continua limitada a 100 mil eventos com erro explícito. `// ponytail:` registra o teto do envelope e a futura agregação dentro do Postgres.

### Decisão — snapshot transacional em vez de keyset paginado

A coleta anterior percorria o mesmo recorte em várias requisições, com âncora
`(received_at, event_id)` fixada antes da primeira página. Cada página era um
statement próprio, com snapshot próprio: uma inserção feita depois da âncora,
mas **abaixo** dela na ordem total, entrava no agregado se caísse numa faixa
ainda não percorrida e ficava de fora se caísse numa faixa já percorrida — o
mesmo lote entrava pela metade. `tests/integration/telemetry-migration.test.ts`
fixa esse ponto de inserção e mede a corrupção: a travessia paginada devolve
1011 linhas com 10 das 20 concorrentes.

A remediação troca as N requisições por uma chamada a
`collect_learning_analytics_snapshot`. Sendo `stable`, todas as leituras
internas — eventos e papéis — usam o snapshot do statement que a chamou, então
o lote concorrente entra inteiro ou fica inteiro de fora. O mesmo teste prova
0 de 20 antes e 20 de 20 depois, com contagem total e IDs únicos conferidos.

### Decisão — a prova de concorrência precisa de PostgreSQL de verdade

O teste em PGlite é sequencial: ele insere o lote **entre** duas chamadas, num
único processo com uma conexão só. Isso mede o recorte e o ponto de inserção,
não a disputa. A prova de concorrência sobe um servidor PostgreSQL 16 local e
descartável, apontado por `TELEMETRY_TEST_DATABASE_URL`, e coloca três sessões
independentes em cena:

- **B** abre transação e toma `pg_advisory_xact_lock`, segurando o lock.
- **A** (administrador) dispara **um** statement em `READ COMMITTED` cujo
  `WITH gate AS MATERIALIZED` espera esse lock antes de cinco chamadas da RPC
  no mesmo `SELECT` (global, dois cursos e dois períodos). O snapshot de A é
  fixado no início do próprio statement, isto é, antes da espera. O teste não
  usa `REPEATABLE READ`, que poderia mascarar uma regressão na garantia de
  snapshot de statement da função `stable`.
- **O observador**, em terceira conexão, confirma em `pg_stat_activity` que A
  está `active` com `wait_event_type = 'Lock'` e `wait_event = 'advisory'`, e
  que o texto do statement é a RPC. Sem essa confirmação o teste falha em vez
  de passar por acidente.
- Só então B insere as 20 linhas concorrentes divididas em dois subgrupos — 10
  `event_id` numa faixa que a travessia paginada **já** teria percorrido e 10
  numa faixa que ela **ainda não** teria visitado, com a fronteira (âncora
  `…3002`, cursor de página `…1004`) medida no próprio servidor — e faz COMMIT,
  liberando o lock. Antes do COMMIT, o teste também confirma que a Promise de A
  continua pendente; portanto o lote foi commitado depois do início e antes da
  conclusão do statement que contém as RPCs.

Resultado medido: A devolve exatamente 1001 linhas, 1001 IDs únicos, zero de
cada subgrupo, e — nas demais colunas do mesmo statement — escopo por curso
(1001 no curso da fixture, 0 no curso do lote) e período (1001 dentro, 0 fora)
coerentes. Uma RPC nova, depois da conclusão do statement de A, devolve
1021 linhas, 1021 IDs únicos, os 10 de cada subgrupo, 20 no curso do lote e
1021 no período. O bloco é ignorado sem a variável de ambiente, recusa alvo
que não seja host local com nome de banco de teste, nunca toca o Supabase
hospedado, e derruba o estado que criou no `afterAll`. O CI provisiona o
serviço `postgres:16` em `.github/workflows/tests.yml` para que ele rode.

## Tarefas

- [ ] RED/GREEN: catálogo, normalização, allowlist, limite de 2 KB e rejeição de PII — `tests/unit/lib/api/telemetry-validation.test.ts`
- [ ] RED/GREEN: autenticação, identidade server-side e deduplicação — `tests/unit/app/api/telemetry/events/route.test.ts`
- [ ] RED/GREEN: batching, keepalive, fila e retry limitados — `tests/unit/lib/services/tracking.service.test.ts`
- [ ] Criar schema, índices, grants e RLS append-only — `supabase/migrations/20260902_learning_event_telemetry.sql`
- [ ] Instrumentar os fluxos reais apenas após sucesso — arquivos de fluxo listados no plano
- [ ] Remover captura de comentário livre e user-agent bruto da telemetria legada — `components/content-review/ContentReview.tsx`, `lib/api/telemetry-types.ts`, `lib/services/tracking.service.ts`
- [ ] RED/GREEN: agregados globais e por contexto com fixture não vazia — `tests/unit/lib/api/learning-analytics.test.ts`
- [ ] RED/GREEN: snapshot transacional sem duplicatas, omissões nem entrada parcial, com ponto de inserção numa faixa já percorrida pela travessia paginada — `tests/integration/telemetry-migration.test.ts`
- [ ] RED/GREEN: duas sessões independentes mais observador em PostgreSQL 16 real, com lock consultivo, espera comprovada em `pg_stat_activity` e COMMIT concorrente no meio do statement — `tests/integration/telemetry-migration.test.ts`, `.github/workflows/tests.yml`
- [ ] RED/GREEN: endpoint aceita admin e nega aluno — `tests/unit/app/api/analytics/events/route.test.ts`
- [ ] Integrar agregados aos quatro painéis sem remover dados legados — arquivos de Analytics listados no plano
- [ ] Verificar lint, unit/coverage, typecheck e build; registrar inventário evento→ponto de disparo.

## Aberto

Nenhuma decisão aberta. A card que aprovou esta spec fixa catálogo, privacidade, transporte, segurança e visualizações.
