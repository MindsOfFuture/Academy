# 017 — Correções de segurança de 16/10/2026 (avisos, limite de envio, testes no CI, cadastro de professor)

Status: implementada (parte de código) · parte de banco preparada, aguardando aplicação
Constituição: `specs/constitution.md`
Origem: revisão de segurança de 16/10/2026 (achados C-1, C-3, C-5 e GHA-001; C-2, C-4, V-1 e V-2 ficam na parte de banco).
Exceção de fluxo: hotfix de segurança autorizado pelo Rafael direto em `main` e, em commit separado, em `development` (sem PR).

## Problema

Qualquer pessoa logada, inclusive um aluno, conseguia mandar aviso e e-mail com a marca oficial, com texto e link livres, para qualquer outra pessoa da plataforma (alunos menores incluídos). O limite de envio das rotas abertas era contornável trocando um cabeçalho. Os testes automáticos publicavam, para qualquer conta do GitHub baixar, um registro com a senha das contas de teste. E qualquer conta logada podia se declarar professora.

## Escopo

- Um aviso só sai quando existe relação real entre quem envia e quem recebe: o próprio aluno sobre a própria matrícula; o professor do curso (ou admin) para o aluno matriculado; o aluno que entregou a atividade para o professor que a criou; o chat entre aluno matriculado e professor da atividade. Qualquer outro caso é recusado.
- O texto, o título e o link do aviso são escritos pela plataforma, a partir dos dados do curso e da atividade. O que vem do navegador é ignorado.
- No e-mail, nome de pessoa e comentário do professor aparecem como texto, nunca como formatação ou link. O botão do e-mail e o clique no sino só levam para páginas do próprio site.
- Cada pessoa tem um teto de avisos por período.
- O limite de envio das rotas abertas (comprovante de professor, aviso de professor pendente) conta pelo endereço que o servidor enxerga, não pelo que o visitante declara.
- Os testes automáticos no GitHub não gravam mais registro, vídeo nem captura de tela, e não publicam relatório para download.
- A etapa final do cadastro de professor só confirma quem já escolheu ser professor no início do cadastro e deixa a conta aguardando aprovação. Aluno não vira professor por ela.

**Fora de escopo (parte de código):**
- Travas no banco: aluno se dar nota, professor pendente se aprovar, certificado sem concluir o curso, professor ler CPF/endereço/nascimento de aluno, análises de desempenho para professor pendente. Estão no arquivo de banco desta spec (ver "Parte de banco"), porque o navegador fala com o banco direto e só o banco consegue impedir. Nenhum código desta entrega depende dele.
- Emissão de certificado pelo servidor: sem a trava do banco, mover a checagem para o servidor não impede a emissão direta, e a conclusão ainda depende de notas que o aluno hoje consegue gravar. A trava no banco cobre aluno, professor e qualquer outro caminho de uma vez.
- Bucket público do comprovante de professor (C-6) e URL livre de comprovante (C-7).

## Critérios de aceite

- [x] Dado um aluno logado, quando ele tenta avisar outro aluno, um professor ou um admin com texto próprio, então recebe "Acesso negado." e ninguém recebe aviso nem e-mail.
- [x] Dado um aluno que se matricula, quando o aviso de matrícula sai, então título e texto mostram o nome real do curso, mesmo que o navegador tenha mandado outro texto.
- [x] Dado o professor do curso, quando corrige uma entrega, então o aluno é avisado com a nota gravada, não com a nota enviada no pedido.
- [x] Dado um professor de outro curso, quando tenta avisar a correção de um aluno que não é dele, então recebe "Acesso negado.".
- [x] Dado um chat de atividade, aluno avisa o professor da atividade e professor/admin avisa o aluno; terceiros são recusados.
- [x] Dado um aviso com `<h1>` e link externo no título/mensagem, quando o e-mail é montado, então o HTML aparece escapado e o botão para fora do site não existe.
- [x] Dada uma pessoa que já mandou 60 avisos em 10 minutos, o 61º é recusado com "Muitas solicitações.".
- [x] Dado um visitante que troca o cabeçalho de origem a cada pedido, o limite de envio continua contando pelo mesmo endereço.
- [x] Dado um aluno logado, quando chama a etapa final do cadastro de professor, então recebe "Acesso negado." e continua aluno.
- [x] Dado um professor recém-cadastrado, a etapa final deixa a conta aguardando aprovação; um professor já aprovado continua aprovado.
- [x] No GitHub, a execução dos testes de navegador não grava registro/vídeo/captura e não publica relatório.

## Plano

- **Degrau da escada:** reusa `rateLimit` (`lib/rate-limit.ts`), `escaparHtml` (`lib/email/template.ts`), `normalizeNextPath` (`lib/utils.ts`) e `fetchRoleForUser` (`lib/api/profiles-server.ts`). Nenhuma dependência nova.
- **Arquivos:**
  - `lib/api/notification-rules.ts` (novo): relação exigida por tipo de aviso e texto montado do banco. Tipos aceitos pela rota: `new_enrollment`, `assignment_submitted`, `assignment_graded`, `chat_message` (os únicos que o navegador envia: `lib/api/enrollments.ts`, `lib/api/assignments.ts`, `lib/api/activity-chat.ts`). Aprovação de professor e avisos da gestão continuam saindo só do servidor ou do banco.
  - `app/api/notifications/route.ts`: 403 sem relação, limite de 60 avisos por 10 min por pessoa.
  - `lib/api/notifications-server.ts`: escapa título/mensagem e só aceita link interno no e-mail. O escape fica aqui e não em `buildEmailHtml`, porque o modelo tem cópia byte a byte em `gestao.email_html()` (teste de paridade em `tests/integration/gestao-alocacao-migration.test.ts`).
  - `components/notifications/notification-bell.tsx`: só navega para caminho interno (avisos antigos podem ter link externo gravado).
  - `lib/api/enrollments.ts`, `lib/api/assignments.ts`: mandam `courseId`/`assignmentId` para o servidor conferir.
  - `lib/rate-limit.ts`: `X-Real-IP`, senão o último item do `X-Forwarded-For`.
  - `app/api/auth/oauth-ensure-teacher-role/route.ts`: só confirma quem já é professor; grava "aguardando aprovação" no servidor.
  - `app/auth/complete-teacher-profile/page.tsx`: o navegador deixa de gravar o status de verificação (a trava de banco vai proibir isso).
  - `playwright.config.ts`, `.github/workflows/playwright.yml`: sem trace/vídeo/captura no CI, sem artefato.
  - `.github/workflows/{tests,playwright,deploy}.yml`: `permissions: contents: read` no topo (nenhum job escreve no repositório; o deploy usa SSH e o codecov roda sem token).
- **Premissa do proxy (C-5):** o único salto antes do Node é o nginx do VPS. O Node escuta só em `127.0.0.1` (`docs/deploy-vps.md`), a Cloudflare está em "DNS only" (`RUNBOOK.md` §1), e o bloco `location /` grava `X-Real-IP $remote_addr` e `X-Forwarded-For $proxy_add_x_forwarded_for` (`docs/deploy-vps.md`, conferido contra `RUNBOOK.md` §4.2, que lista as divergências do arquivo real e não cita esses cabeçalhos). O `curl -I` no site responde `Server: nginx` sem cabeçalho da Cloudflare. Não houve acesso SSH ao VPS a partir da VM para ler o arquivo. Se um dia a Cloudflare passar a fazer proxy ("nuvem laranja"), `$remote_addr` vira o IP da Cloudflare e o limite passa a valer por ponto de presença: aí é preciso `real_ip_header CF-Connecting-IP` + `set_real_ip_from` com as faixas da Cloudflare no nginx.
- **Autorização:** a rota usa `createServiceRoleClient()` só para ler as linhas que provam a relação e gravar o aviso, depois de confirmar a sessão; a guarda está em `notification-rules.ts`.
- **Atalhos:** `// ponytail:` o limite de avisos é em memória, por processo (teto já documentado em `lib/rate-limit.ts`).

## Parte de banco (preparada, não aplicada)

Arquivo único para o SQL Editor: `supabase/migrations/20261016_security_db_hardening.sql`, só no branch `fix/security-db-1016` até ser aplicado em produção. Traz um bloco de diagnóstico só de leitura e as travas: perfil (papel e status de verificação), certificado só com curso concluído, nota só pelo professor, dados pessoais do aluno fora do alcance do professor, análises de desempenho só para admin e professor aprovado no próprio curso. Validado em PGlite com sondas por papel (`tests/integration/security-db-hardening-migration.test.ts`, fixture do `public` com policies de pior caso em `tests/integration/fixtures/public-baseline-1016.sql`):

- a migration roda depois de 20260825 + 20260825_analytics_guard + 20260902 do repo, duas vezes seguidas sem erro;
- 47 verificações passam com a migration (46 sondas por papel + a função de alunos devolver só id, nome, e-mail e foto);
- sem a migration, 20 sondas de abuso passam (autoaprovação, papel de admin por conta própria, certificado sem concluir, nota dada pelo próprio aluno, correção por professor de outro curso, analytics de qualquer aluno para professor pendente) e as 22 sondas de uso legítimo continuam passando: as travas não quebram cadastro, onboarding pelo servidor, aprovação pela administração, entrega, correção, emissão de quem concluiu.

Impacto da etapa 2 (retirar a policy "Teachers view enrolled student profiles", comentada no fim da migration): sem trocar antes o código, o professor deixa de ver nome/e-mail dos alunos nas listas de entregas e correções (`lib/api/assignments.ts`), na lista de alunos do curso e na matrícula feita por ele (`lib/api/enrollments.ts`) e o nome/foto no chat da atividade (`lib/api/activity-chat.ts`). Nenhuma tela de professor lê CPF, telefone, endereço ou nascimento de aluno; `lib/api/certificates.ts` lê o CPF na emissão, mas o trigger `enforce_certificate_fields` já grava o dado real.

Fica de fora (pede o corpo das funções de produção, ver diagnóstico): `get_students_list`/`get_enrollable_users` listam todos os usuários para qualquer professor, e o professor matricula qualquer pessoa no próprio curso pelo navegador (V-3).

## Tarefas

- [x] Regras de aviso + rota — `lib/api/notification-rules.ts`, `app/api/notifications/route.ts`
- [x] Teste: 10 casos recusados com 403 e nenhum aviso gravado; 7 permitidos com texto do banco; 61º aviso → 429 — `tests/unit/app/api/notifications-route.test.ts`
- [x] Teste: e-mail escapa HTML e descarta link externo — `tests/unit/lib/api/notifications-email.test.ts`
- [x] Teste: IP forjado no `X-Forwarded-For` não muda a chave do limite — `tests/unit/lib/security.test.ts`
- [x] Teste: aluno recebe 403 na etapa final do cadastro de professor — `tests/unit/app/api/oauth-ensure-teacher-role.test.ts`
- [x] CI sem trace/vídeo/captura e sem artefato — `playwright.config.ts`, `.github/workflows/playwright.yml`

## Verificação

Medido em 16/10/2026 no worktree de `origin/main` (Node 26, `NODE_OPTIONS=--no-experimental-webstorage`, env fictícia do `tests.yml`):

- `npm run lint`: 0 erros (avisos antigos de `any` em outros arquivos; os arquivos tocados saem limpos no `eslint`).
- `npm test -- --run --coverage`: 78 arquivos, 666 testes passando, 2 ignorados; cobertura 66,48 / 59,46 / 65,78 / 69,26 (mínimo 60/50/60/60).
- `npm run build`: sai 0; `/api/notifications` e `/api/auth/oauth-ensure-teacher-role` continuam `ƒ` (dinâmicas).
- Prova de que os testes mordem: com só os 4 arquivos de implementação de volta à versão antiga (`git stash push -- app/api/notifications/route.ts lib/api/notifications-server.ts lib/rate-limit.ts app/api/auth/oauth-ensure-teacher-role/route.ts`), os 4 arquivos de teste dão 22 falhas em 40. Os 10 casos "recusa com 403" recebem 200 (o ataque passava); o IP sai `203.0.113.5` (o forjado) em vez de `198.51.100.7`; o e-mail contém `<h1>` cru; o aluno vira professor (`user_profile` atualizado). Com o código novo: 40/40.
- Scanners: `gitleaks git` 0 vazamentos (os 15 do `gitleaks dir` são do `.next/`, saída de build fora do git); `semgrep p/default + p/secrets` nos arquivos tocados: 0 achados no código, 7 avisos antigos de ação do GitHub sem fixar por SHA (linhas não alteradas, item H-4 da revisão); `osv-scanner`: 26 avisos em dependências, todos antigos (lockfile não mudou).

## Aberto

- Rafael: trocar as senhas das 4 contas de teste (admin, coordenação, professor, aluno), encerrar as sessões delas e apagar os artefatos `playwright-report` já publicados no GitHub.
- Rafael: rodar o arquivo de banco no SQL Editor (primeiro o diagnóstico) e, depois de aplicado, juntar o branch `fix/security-db-1016` em `development`/`main`.
