# RUNBOOK — Academy (operação em produção)

Guia operacional do Academy em produção. Estado **verificado no VPS em
04/09/2026** (via SSH em `179.199.131.19`), não copiado de memória.
Complementa `docs/deploy-vps.md` (procedimento original) e `docs/supabase.md`
(banco). Quando algo aqui divergir do que você vê no servidor, **o servidor
é a fonte da verdade** — corrija este arquivo.

Produto e código em português por convenção do projeto.

---

## 1. Visão da infraestrutura

| Item | Valor (verificado) |
|---|---|
| Dominio | `mindsofthefuture.com.br` (apex + `www`) |
| DNS | Cloudflare (NS `jason`/`nicole.ns.cloudflare.com`), registros A em "DNS only" (cinza, sem proxy) |
| Servidor | VPS Hostinger KVM2, Ubuntu 24.04, IPv4 `179.199.131.19`, IPv6 `2a02:4780:6e:6a10::1`, hostname `srv1921081` |
| App | Next.js 15, `output: "standalone"`, Node.js **v22.23.2** |
| Processo | systemd `academy.service`, roda em loopback `127.0.0.1:3000` |
| Reverse proxy | nginx (`/etc/nginx/sites-enabled/academy`), TLS via certbot, renova por `certbot.timer` |
| Banco / auth `| Supabase hospedado (não roda no VPS) |
| Email | Cloudflare Email Routing (não roda no VPS); envio via Resend |
| Build source | `/srv/Academy` (clone git, HEAD destacado no commit de deploy) |
| Live app | `/opt/academy` (layout standalone) |
| Config/env | `/etc/academy.env` (modo `640`, `root:academy`) |
| Backups | `/var/backups/academy/<ts>-<buildid>/` (tar.gz + config + script de rollback) |
| Monitoramento | UptimeRobot (externo, não roda no VPS), alerta por email na queda — §5.4 |
| Jobs agendados | systemd timers `academy-*`, falha avisa por email — §8 |

Tudo é um processo por trás do nginx: sem Docker, sem orquestrador, sem PM2.
`systemctl is-active academy.service` deve responder `active`.

---

## 2. Deploy

O deploy **não** é o `rsync` simples do `docs/deploy-vps.md` antigo. Existe um
procedimento de release com snapshot, health check e rollback automático.
`docs/deploy-vps.md` continua válido como referência de build manual; o que
roda de fato é o script de release (`deploy-exact-<commit>.sh` em `/root/`),
que encapsula os passos abaixo.

### 2.1 Pré-requisitos

- Acesso SSH por chave: `ssh root@179.199.131.19` (o device de uso tem acesso
  direto).
- Node 20+ (no VPS, v22), `npm ci` disponível, `rsync` (`/usr/bin/rsync`).
- `/etc/academy.env` **precisa estar carregado no build**, não só no systemd:
  o build de produção **falha sem `RESEND_API_KEY`**
  (`Missing API key ... new Resend("re_123")` em `api/notifications` e
  `api/learning-paths/[pathId]`). As `NEXT_PUBLIC_*` são embutidas **no
  build** — mudou uma, é rebuild, restart sozinho não resolve.

### 2.2 Sequência de release (verificada no script)

1. Escolher o commit exato (nunca a ponta de branch implícita):
   `git -C /srv/Academy fetch --no-tags origin` e
   `git -C /srv/Academy checkout --detach <commit>`.
2. Garantir árvore limpa (`git status --porcelain` vazio) e `npm ci`.
3. Carregar env e buildar: `. /etc/academy.env` + `npm run build`
   (com `NEXT_TELEMETRY_DISABLED=1`).
4. Copiar `static` e `public` para o standalone
   (erro nº 1 do manual: sem isso o site fica sem CSS/imagem).
5. Estagiar snapshot em
   `/opt/academy.release-<commit>-<BUILD_ID>-<timestamp>`, dono
   `academy:academy`.
6. Calcular `ARTIFACT_SHA256` do estágio (tar normalizado).
7. `rsync --delete` do estágio para `/opt/academy` (live) e
   `systemctl restart academy.service`.
8. **Health check** até responder 200 em 5 URLs (com retry ~60s):
   `http://127.0.0.1:3000/`, `https://mindsofthefuture.com.br/`,
   `https://www.mindsofthefuture.com.br/`, e `/auth` em apex e www.
9. **Read-back**: conferir `BUILD_ID`, commit do HEAD, e
   `rsync -anic --delete` zerado (diferença só em `.next/cache`).
10. Em caso de erro no meio, o `trap on_error` chama
    `rollback-academy-current.sh apply` automaticamente.

### 2.3 Verificação pós-deploy

```bash
ssh root@179.199.131.19 '
  systemctl is-active academy.service
  cat /opt/academy/RELEASE_COMMIT            # commit em produção
  curl -sS -o /dev/null -w "%{http_code}\n" https://mindsofthefuture.com.br/
  nginx -t
  journalctl -u academy.service --since "5 min ago" --no-pager | grep -iE "error|failed" || true
'
```

### 2.4 Smoke pós-deploy (automático)

O job `smoke` de `.github/workflows/deploy.yml` roda depois de todo deploy da
`main`: `e2e/flows/smoke-producao.spec.ts` contra `https://mindsofthefuture.com.br`
(home 200 · `/protected` sem sessão vai para `/auth` · login · uma página de
curso renderiza). Falhou = run vermelho e email para
`mindsofthefuture.ufjf@gmail.com` com o link do run.

- **Conta dedicada**: secrets `SMOKE_USER_EMAIL`/`SMOKE_USER_PASSWORD`, usuário
  student criado só para isso. Nunca conta de aluno. Ele gera eventos de
  telemetria (`course_opened`) a cada deploy: excluir esse `user_profile` de
  análise de pesquisa.
- **Rodou de verdade**: o workflow exige 4 testes executados e 0 pulados no
  JSON do Playwright (ADR 012). Spec movido de diretório ou secret ausente
  vira vermelho, não verde vazio.
- **502 do restart**: o script de release já espera 200 (§2.2 passo 8); o job
  ainda faz `curl --retry` antes e roda com `--retries=1`.
- **Sem trace nem vídeo**: o repositório é público e o trace grava a senha.
- Rodar à mão contra produção:

  ```bash
  PLAYWRIGHT_BASE_URL=https://mindsofthefuture.com.br TEST_STUDENT_EMAIL=... TEST_STUDENT_PASSWORD=... \
    npx playwright test e2e/flows/smoke-producao.spec.ts --project=chromium --no-deps --trace=off
  ```

---

## 3. Rollback

Estado verificável no sistema de backup. Cada release gera um diretório em
`/var/backups/academy/<timestamp>-<buildid>/` contendo:

- `academy-current.tar.gz` + `.sha256` — snapshot do app/estado anterior;
- `content.sha256`, `metadata.manifest` — manifestos de integridade;
- `rollback-academy-current.sh` (+ `.sha256`) — script de restore;
- `deploy-exact-<commit>-result.txt` — resultado do último deploy.

O backup captura **app + config**: `opt/academy/` **e** `/etc/academy.env`,
`/etc/systemd/system/academy.service` e os dois arquivos nginx
(`sites-available/academy`, `sites-enabled/academy`).

### 3.1 Como reverter

O script tem três modos (nunca rode `apply` às cegas — `verify` primeiro):

```bash
cd /var/backups/academy/<timestamp>-<buildid>/
./rollback-academy-current.sh verify     # checa sha256 e integridade do tar
./rollback-academy-current.sh staging /tmp/x   # restaura numa cópia e valida
./rollback-academy-current.sh apply       # restaura de verdade
```

O `apply`:

1. verifica o arquivo;
2. copia o live atual para `/opt/academy.pre-rollback-<ts>` (emergency copy);
3. `systemctl stop academy.service`;
4. restaura app + os 4 arquivos de config, `daemon-reload`, `nginx -t`;
5. `systemctl restart academy.service`;
6. verifica `BUILD_ID` e health check em `127.0.0.1:3000`,
   `mindsofthefuture.com.br` e `www.../auth`.

Se nada do `/var/backups/academy` servir, ainda existem os snapshots
`/opt/academy.release-*` e `/opt/academy.rollback-*` (diretórios completos do
standalone) como última linha — rsync manual de um deles para `/opt/academy/`
e restart.

---

## 4. Configuração (systemd, nginx, env)

### 4.1 systemd — `/etc/systemd/system/academy.service`

Unidade verificada: `Type=simple`, `User=academy`,
`WorkingDirectory=/opt/academy`, `EnvironmentFile=/etc/academy.env`,
`Environment=NODE_ENV=production PORT=3000 HOSTNAME=127.0.0.1`,
`ExecStart=/usr/bin/node server.js`, `Restart=always`, `RestartSec=5`,
`NoNewPrivileges=true`, `PrivateTmp=true`.

**Override em uso** `/etc/systemd/system/academy.service.d/headers.conf`:

```ini
[Service]
Environment=NODE_OPTIONS=--max-http-header-size=32768
```

(necessário porque o nginx sobe `large_client_header_buffers 4 32k`).

Comandos:

```bash
sudo systemctl daemon-reload
sudo systemctl restart academy.service
journalctl -u academy.service -f
systemctl cat academy.service
```

### 4.2 nginx — `/etc/nginx/sites-enabled/academy`

Pontos verificados que **divergem** do `docs/deploy-vps.md`:

- `server_name` cobre `mindsofthefuture.com.br`, `www...`, o IP e `_`;
- `client_max_body_size 25M` (doc diz 20M);
- `large_client_header_buffers 4 32k` + `proxy_buffer_size 32k` /
  `proxy_buffers 8 32k` / `proxy_busy_buffers_size 64k` (headers grandes);
- `proxy_read_timeout 300s`;
- **bloco extra** `location /jogos/` (alias `/var/www/jogos/`) servindo os
  jogos educativos estáticos, **antes** do `location /`;
- TLS gerenciado por certbot (blocos `listen ... ssl` +
  `sslcertificate .../fullchain.pem`).

Regra crítica: **nunca** deixe backup de configuração dentro de
`/etc/nginx/sites-enabled/` — o nginx carrega **todo** arquivo do diretório;
um `academy.bak-<ts>` ao lado do original quebra o reload com
`duplicate listen options for [::]:443`. Backups de config vão para
`/root/nginx-backups/`.

Após editar: `nginx -t` e `systemctl reload nginx`.

### 4.3 Env — `/etc/academy.env`

Formato `CHAVE=valor`, **sem aspas, sem `export`** (é `EnvironmentFile` do
systemd). Chaves presentes (conferidas em produção):

`NEXT_PUBLIC_SUPABASE_URL` · `NEXT_PUBLIC_SUPABASE_ANON_KEY` ·
`SUPABASE_SERVICE_ROLE_KEY` · `RESEND_API_KEY` · `RESEND_FROM_EMAIL` ·
`RESEND_TEST_RECIPIENT` · `NEXT_PUBLIC_APP_URL`.

Regras:

- `RESEND_TEST_RECIPIENT` **vazia** em produção, senão todo email vai para
  uma caixa só.
- `SUPABASE_SERVICE_ROLE_KEY` só aqui, nunca em `/opt/academy` (sobrescrito a
  cada deploy).
- `NEXT_PUBLIC_APP_URL` obrigatória no VPS (não existe `VERCEL_URL`); vazia =
  link de email/certificado quebrado.
- Supabase URL/anon key faltando = **middleware responde 503 em todas as
  rotas não isentas** (fail-closed, `missingSupabaseEnv()` em `lib/utils.ts`);
  app inteiro fora do ar. Conferir antes de apontar/após mexer em DNS.

---

## 5. DNS e TLS

### 5.1 DNS (Cloudflare)

- NS delegados no registro.br para `jason.ns.cloudflare.com` /
  `nicole.ns.cloudflare.com`; DNSSEC removido automaticamente pelo
  registro.br na delegação.
- Registros A (`@` e `www`) → `179.199.131.19`, em **DNS only** (cinza), sem
  proxy da Cloudflare.
- Verificar estado:

```bash
nslookup -type=ns mindsofthefuture.com.br 1.1.1.1
nslookup mindsofthefuture.com.br 1.1.1.1        # espera 179.199.131.19
```

> `nslookup` do Windows não suporta `-type=ds`; para DNSSEC use
> `https://dns.google/resolve?name=mindsofthefuture.com.br&type=DS`.

### 5.2 Email (fora do VPS)

Recebimento via **Cloudflare Email Routing** (free, forward): MX
`route1/route2/route3.mx.cloudflare.net`, SPF
`v=spf1 include:_spf.mx.cloudflare.net ~all`, DKIM `cf2024-1._domainkey`.
Regras caem em caixas `mindsofthefuture.*@gmail.com`; **catch-all = Drop**,
logo endereço sem regra é descartado em silêncio. Envio transacional via
Resend (`RESEND_API_KEY`), com remetente `RESEND_FROM_EMAIL`.

### 5.3 TLS (certbot)

- Certificado Let's Encrypt em
  `/etc/letsencrypt/live/mindsofthefuture.com.br/fullchain.pem`.
- Renovação automática via `certbot.timer` / `certbot.service`
  (conferir `systemctl list-timers | grep certbot`).
- Gotcha de HSTS: o nginx serve
  `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`.
  Se o certbot falhar/persistir sem cert, o navegador que já visitou trava em
  HTTPS. Emitir o cert **antes** de expor a 443 ao público.

### 5.4 Monitoramento externo (UptimeRobot)

Monitor do **UptimeRobot** configurado para `https://mindsofthefuture.com.br`.
Quando o site cai, **envia email** de alerta para
`mindsofthefuture.ufjf@gmail.com`. Roda fora do VPS, então
continua alertando mesmo com a máquina inteira fora do ar.

**Verificado em 23/09/2026** com queda controlada: `academy.service` parado de
03:18:27 a ~03:23:30 UTC, com nginx no ar respondendo `502`. O UptimeRobot
detectou a queda e disparou o email.

- O monitor precisa checar o **código HTTP**, não só a porta. Com o app parado
  o nginx segue aceitando conexão na 443 e responde `502`; um check só de porta
  não veria a queda.
- O `502` de alguns segundos durante deploy (§6) pode gerar alerta falso se o
  intervalo do monitor coincidir com o restart.
- Para repetir o teste sem risco de esquecer o site fora do ar, agendar o
  religamento no próprio VPS **antes** de parar:

  ```bash
  sudo systemd-run --unit=academy-religar --on-active=5m \
    /usr/bin/systemctl start academy.service
  sudo systemctl stop academy.service
  # religar antes da hora:
  sudo systemctl start academy.service && sudo systemctl stop academy-religar.timer
  ```

---

## 6. Recuperação de falhas

Sintomas → ação (todos verificáveis):

| Sintoma | Causa provável | Ação |
|---|---|---|
| 503 em todas as páginas | Env Supabase faltando/`NEXT_PUBLIC_*` errado no build | Conferir `/etc/academy.env`, rebuild |
| Logout em loop / cookie não fixa | Faltou `X-Forwarded-Proto $scheme` no nginx | Conferir bloco `location /` |
| Site sem CSS/imagem após deploy | `static`/`public` não copiados pro standalone | Reler §2.2 passo 4 |
| `502` no deploy | `Restart=always` faz uns segundos de 502 | Aceito (uso escolar); segunda instância 3001 + upstream se não |
| `duplicate listen options` no reload | `.bak` dentro de `sites-enabled` | Mover backup para `/root/nginx-backups/`, `nginx -t`, reload |
| Build falha `Missing API key` | Env não carregado no build | `set -a; . /etc/academy.env; set +a` antes do `npm run build` |
| Email nunca chega | `RESEND_TEST_RECIPIENT` preenchida / endereço sem regra no routing | Esvaziar a env / conferir regras do Cloudflare |
| App fora do ar, causa desconhecida | — | `rollback-academy-current.sh apply` (§3) ou snapshot `academy.rollback-*` |

Rotina de diagnóstico:

```bash
ssh root@179.199.131.19 '
  systemctl status academy.service --no-pager
  journalctl -u academy.service -n 50 --no-pager
  tail -n 50 /var/log/nginx/error.log
  nginx -t
'
```

Backup e restore do **banco** não estão aqui: §7. O que `/var/backups/academy`
guarda é app + config (§3), nunca dados do Supabase.

---

## 7. Backup e restore do banco (Supabase)

O banco não roda no VPS. Não há timer nem cron de backup do banco, e
`/var/backups/academy` **não contém uma única linha do banco** — quem gera e
retém o backup do banco é o Supabase.

### 7.1 O que está ativo

Backup diário automático gerenciado pelo Supabase, agendado para **10:45**,
na página de backups agendados do projeto `jrfehrhiyilxhbuwjmat`:

```
https://supabase.com/dashboard/project/jrfehrhiyilxhbuwjmat/database/backups/scheduled
```

Retenção e lista de snapshots disponíveis: ler na própria página. Não assumir
número de dias de cabeça — o que o plano guarda é o que aparece ali.

### 7.2 Restaurar o backup mais recente

> ⚠️ **O restore do dashboard sobrescreve o banco de produção.** Não é restore
> para uma cópia: é restauração *in place* no projeto `jrfehrhiyilxhbuwjmat`,
> o mesmo que atende o app em produção. Tudo que foi gravado depois do snapshot
> escolhido é perdido — matrícula, progresso de aula, submissão, mensagem de
> chat. Só execute em recuperação de desastre real, com a decisão consciente de
> perder o delta desde o snapshot.

1. Abrir a página de backups agendados (URL acima).
2. Identificar o snapshot mais recente e **conferir data/hora** (o agendamento
   é 10:45; se o snapshot esperado não está lá, pare e investigue antes de
   restaurar um mais antigo sem querer).
3. Acionar o restore desse snapshot e confirmar.
4. Aguardar a conclusão. Durante o restore o banco fica indisponível: o app
   devolve erro nas páginas que consultam dados. Não é o 503 de env faltando
   (`missingSupabaseEnv()`, §4.3) — esse tem outra causa; aqui o middleware
   passa e as queries falham.
5. Verificação pós-restore (nenhuma é opcional):
   - login real pelo domínio: `https://mindsofthefuture.com.br/auth`;
   - contagem de linhas nas tabelas principais, no SQL editor do dashboard:

     ```sql
     select 'user_profile' as tabela, count(*) from user_profile
     union all select 'course', count(*) from course
     union all select 'enrollment', count(*) from enrollment
     union all select 'lesson_progress', count(*) from lesson_progress
     union all select 'assignment_submission', count(*) from assignment_submission;
     ```

   - `systemctl restart academy.service` se as conexões ficarem penduradas
     depois do banco voltar.

### 7.3 Dado de aluno — restrição de destino

O banco tem dado de menor de idade de escola pública. Enquanto o backup fica
dentro do Supabase, o controle de acesso é o do próprio projeto. Qualquer dump
que saia dali (§7.4) passa a exigir destino com controle de acesso equivalente:
**não** vai para drive pessoal, pasta compartilhada de equipe, anexo de email
ou máquina de quem gerou.

### 7.4 Dump manual (cópia fora do Supabase)

O backup agendado vive na infra do Supabase. Para ter arquivo fora dela — antes
de uma migration destrutiva, ou porque o critério exige cópia externa:

```bash
supabase db dump -f backup-$(date +%F).sql --data-only
```

Conferir tamanho do arquivo e contagem de tabelas contra o banco vivo antes de
considerar o dump válido (ver `docs/supabase.md#backup`). Arquivo truncado
passa despercebido se ninguém abrir.

### 7.5 O que este procedimento não cobre

Explícito para não virar aceite falso:

- **Restore testado em projeto descartável.** Clicar restore em produção não é
  teste, é incidente. Validar restauração de verdade exige subir um projeto
  Supabase separado e restaurar o dump lá, conferindo as contagens de §7.2.
- **Alerta de falha do backup.** Hoje ninguém é avisado se o snapshot das 10:45
  não sair. Descobre-se olhando a página.
- **Retenção registrada.** Está no dashboard, não versionada aqui.

---

## 8. Tarefas agendadas e processo longo

Infra, não produto: esta seção define **como** um job roda no VPS. Nenhuma
tabela, nenhuma rota. Quem usar (ex.: relatório mensal do `/gestao`,
`docs/plans/sistema-interno-gestao.md`) só escreve o comando. Decisão em
`docs/decisions.md` 019.

### 8.1 Convenção

| Item | Regra |
|---|---|
| Mecanismo | systemd timer + service `Type=oneshot`. **Nunca crontab**: cron não tem log por job, `OnFailure=` nem limite de recurso |
| Nome | `academy-<job>.service` + `academy-<job>.timer` em `/etc/systemd/system/` |
| Usuário | `academy` (o mesmo do site, sem sudo); env de `/etc/academy.env` via `EnvironmentFile=` |
| Horário | `OnCalendar=` com fuso explícito `America/Sao_Paulo` (o VPS está em UTC); `Persistent=true` roda o que perdeu com a máquina desligada |
| Log | journal, `journalctl -u academy-<job>`. Job não loga dado pessoal (dado de aluno menor, §7.3) |
| Falha | `OnFailure=academy-job-falhou@%n.service` → email para `mindsofthefuture.ufjf@gmail.com` via Resend. Obrigatório em todo job |
| Teto | `TimeoutStartSec=` explícito. Sem teto, job travado nunca falha e nunca avisa |

### 8.2 Como ler o resultado

```bash
systemctl list-timers 'academy-*'               # próxima e última execução
systemctl status academy-<job>.service          # resultado da última (status=0/SUCCESS ou failed)
systemctl list-units --failed 'academy-*'       # o que está quebrado agora
journalctl -u academy-<job> --since today       # saída do job
sudo systemctl start academy-<job>.service      # rodar agora, fora do horário
```

### 8.3 Aviso de falha (instalado uma vez, serve a todos os jobs)

`/usr/local/bin/academy-job-falhou` (dono `root`, modo `755`):

```sh
#!/bin/sh
# Chamado por OnFailure= de uma unidade academy-*. Avisa por email via Resend.
# Sem log no corpo de propósito: o email sai do VPS, o log pode ter dado pessoal.
set -eu
unit="$1"
curl -fsS --max-time 30 https://api.resend.com/emails \
  -H "Authorization: Bearer $RESEND_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"from\":\"$RESEND_FROM_EMAIL\",\"to\":[\"mindsofthefuture.ufjf@gmail.com\"],\"subject\":\"[VPS] job falhou: $unit\",\"text\":\"$unit falhou em $(hostname) as $(date -u +%FT%TZ).\nDiagnostico: journalctl -u $unit -n 100\"}"
```

`/etc/systemd/system/academy-job-falhou@.service`:

```ini
[Unit]
Description=Academy: aviso de falha de %i

[Service]
Type=oneshot
User=academy
EnvironmentFile=/etc/academy.env
ExecStart=/usr/local/bin/academy-job-falhou %i
```

Limites conhecidos: se o próprio envio falhar (Resend fora, chave revogada), o
sinal volta a ser só `systemctl list-units --failed`. E um timer **desabilitado**
não falha, só não roda: conferir `list-timers` quando mexer em job.

### 8.4 Unidade de exemplo: `academy-disco`

Job real e barato que serve de molde: falha se o disco `/` passar de 85%
(snapshots de `/var/backups/academy` e `/opt/academy.release-*` acumulam).

`/etc/systemd/system/academy-disco.service`:

```ini
[Unit]
Description=Academy: checa uso do disco /
OnFailure=academy-job-falhou@%n.service

[Service]
Type=oneshot
User=academy
TimeoutStartSec=1min
# $$ e %% são escape do systemd para $ e % literais
ExecStart=/bin/sh -c 'uso=$$(df --output=pcent / | tail -n1 | tr -dc 0-9); echo "disco / em $${uso}%%"; [ "$$uso" -lt 85 ]'
```

`/etc/systemd/system/academy-disco.timer`:

```ini
[Unit]
Description=Academy: checa uso do disco / (diário)

[Timer]
OnCalendar=*-*-* 06:00:00 America/Sao_Paulo
Persistent=true

[Install]
WantedBy=timers.target
```

Ativar e testar (incluindo o caminho de falha):

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now academy-disco.timer
sudo systemctl start academy-disco.service && journalctl -u academy-disco -n 5
# força uma falha e confere o email:
sudo systemd-run --unit=academy-teste-falha \
  -p OnFailure=academy-job-falhou@academy-teste-falha.service /bin/false
journalctl -u academy-job-falhou@academy-teste-falha -n 5
```

**Verificado em 05/10/2026**: `academy-disco` instalado e habilitado (06:00 em
São Paulo = 09:00 UTC no `list-timers`), execução manual com `Result=success`
(`disco / em 9%`), e falha forçada via `systemd-run ... /bin/false` disparou o
`academy-job-falhou@` e o email de alerta **chegou** em
`mindsofthefuture.ufjf@gmail.com` (Resend id `01a10da1-aa40-7827-be88-7920f84fc6e7`,
após configurar o DNS do Resend no Cloudflare). A chave do VPS é só de envio
(`restricted_api_key`): status de entrega se lê no dashboard do Resend, não pela API.

### 8.5 Processo longo (geração de `.docx`, pico de CPU 1×/mês)

Roda como **processo separado** (`academy-<job>.service` oneshot), nunca dentro
do `academy.service` nem disparado por request HTTP ao site: request longo
esbarra no `proxy_read_timeout 300s` do nginx (§4.2) e, pior, ocupa o mesmo
event loop que atende os alunos. O VPS tem 2 vCPU; o job pega no máximo uma e
perde a disputa quando o site precisa de CPU:

```ini
[Service]
Nice=10
CPUWeight=20          # site (academy.service) fica no padrão 100: ganha a disputa
CPUQuota=100%         # no máximo 1 dos 2 vCPU, a outra é sempre do site
IOWeight=20
MemoryMax=2G          # estoura = job morto pelo OOM e aviso de falha, site intacto
TimeoutStartSec=2h    # teto explícito, ver 8.1
```

Em aberto para o card do `/gestao`, não daqui: **onde mora o código do job**. O
build standalone em `/opt/academy` só carrega o que o Next rastreou, então um
script `node` avulso não tem dependência garantida ali. Resolver com o script
empacotado junto do release ou com dependências próprias, mas sem mudar este
padrão.

### 8.6 Lembrete de encontro: `academy-lembrete-encontros` (spec 016)

De hora em hora, manda e-mail para quem está alocado num encontro que começa nas
próximas 24 h, uma vez por alocação. É `sh` + `psql` + `curl`, sem `node`: o
release standalone não carrega script avulso (8.5), e aqui não precisa. O banco
escolhe os destinatários e monta o e-mail; o script envia e marca.

Entra no banco com o papel **`gestao_lembrete`**, que só executa
`gestao.lembretes_pendentes()` e `gestao.marcar_lembrete_enviado()` — nunca com a
chave de serviço (ADR 021). Ativação, uma vez:

1. Senha do papel (no SQL Editor do Supabase; a senha não vai para o repo):
   `alter role gestao_lembrete login password '<gerada>';`
2. Em `/etc/academy.env`, a conexão pelo pooler (modo sessão), com o usuário
   `gestao_lembrete.<project-ref>`:
   `GESTAO_LEMBRETE_DB_URL=postgresql://gestao_lembrete.jrfehrhiyilxhbuwjmat:<senha>@aws-0-us-west-2.pooler.supabase.com:5432/postgres?sslmode=require`
   (o projeto está em `us-west-2`; `aws-1-*` e as outras regiões respondem "tenant/user not found").
   Senha gerada sem `` no fim: arquivo vindo do Windows quebra a autenticação.
3. `sudo apt-get install -y postgresql-client` (se `psql` não existir) e
   `sudo install -o root -g root -m 755 scripts/academy-lembrete-encontros.sh /usr/local/bin/academy-lembrete-encontros`.
4. Unidades:

`/etc/systemd/system/academy-lembrete-encontros.service`:

```ini
[Unit]
Description=Academy: lembrete de encontro (24 h antes)
OnFailure=academy-job-falhou@%n.service

[Service]
Type=oneshot
User=academy
EnvironmentFile=/etc/academy.env
TimeoutStartSec=5min
ExecStart=/usr/local/bin/academy-lembrete-encontros
```

`/etc/systemd/system/academy-lembrete-encontros.timer`:

```ini
[Unit]
Description=Academy: lembrete de encontro (de hora em hora)

[Timer]
OnCalendar=*-*-* *:05:00 America/Sao_Paulo
Persistent=true

[Install]
WantedBy=timers.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now academy-lembrete-encontros.timer
sudo systemctl start academy-lembrete-encontros.service && journalctl -u academy-lembrete-encontros -n 5
```

`RESEND_TEST_RECIPIENT` preenchido no `/etc/academy.env` redireciona também os
lembretes, como no site.

**Ativado em 09/10/2026**: papel com senha, `GESTAO_LEMBRETE_DB_URL` no
`/etc/academy.env` (backup em `academy.env.bak-lembrete`), `postgresql-client`
instalado, timer habilitado (`:05` de cada hora, Brasília). Conferido que o papel
recebe `permission denied` em `gestao.escola` e `public.user_profile`; execução
manual com um encontro de teste para o dia seguinte enviou 1 lembrete e marcou;
a execução seguinte não reenviou.

---

## 9. O que NÃO existe de propósito

- **Docker/compose** — um systemd resolve um processo.
- **PM2** — não é usado (unit de `academy.service` ativa; PM2 não instalado).
- **crontab / fila de jobs** — job agendado é systemd timer (§8); fila não se
  justifica para 1 job/mês.
- **Zero-downtime** — `Restart=always` dá alguns segundos de 502.
- **Backup do banco no VPS** — não existe e não deve existir: é gerenciado pelo
  Supabase (§7). Falta restore testado e alerta de falha (§7.5).
- `remotePatterns` segue liberado (`hostname: "**"`) — ver
  `docs/decisions.md` 013 (restrição pendente).

---

## 10. Referências

- `docs/deploy-vps.md` — procedimento de build/nginx original (referência).
- `docs/supabase.md` — banco, clientes, RLS, backup.
- `docs/decisions.md` — ADRs 001–019 (Supabase, roles, VPS, segurança).
- `CLAUDE.md` na raiz — convenções de código e arquitetura.
- Rollback/deploy live: `/srv/Academy` (build source) e
  `/var/backups/academy/` (backup + rollback).

> Última verificação do estado em produção: 04/09/2026, commit
> `4e66865` (matches `cat /opt/academy/RELEASE_COMMIT`).