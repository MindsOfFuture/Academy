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

Backup do banco: não há rotina automatizada no VPS; banco é Supabase
hospedado. Antes de migration destrutiva: `docs/supabase.md#Backup`
(`supabase db dump --data-only`).

---

## 7. O que NÃO existe de propósito

- **Docker/compose** — um systemd resolve um processo.
- **PM2** — não é usado (unit de `academy.service` ativa; PM2 não instalado).
- **Zero-downtime** — `Restart=always` dá alguns segundos de 502.
- **Proteção remota de branch** — não está configurada (`rules/branches/main`
  e `rulesets` vazios, verificados via API pública em 08/09/2026). Existe
  deploy automático via SSH, gatilhado por `workflow_run`, que só libera o
  release após Tests + Playwright passarem no mesmo commit. O gate atua só
  no workflow: não impede push direto/force-push em `main` pelo GitHub.
  Configurar proteção remota é follow-up separado, com autenticação de admin
  do repositório.
- **Backup automatizado do banco** no VPS — manual, no Supabase.
- `remotePatterns` segue liberado (`hostname: "**"`) — ver
  `docs/decisions.md` 013 (restrição pendente).

---

## 8. Referências

- `docs/deploy-vps.md` — procedimento de build/nginx original (referência).
- `docs/supabase.md` — banco, clientes, RLS, backup.
- `docs/decisions.md` — ADRs 001–017 (Supabase, roles, VPS, segurança).
- `CLAUDE.md` na raiz — convenções de código e arquitetura.
- Rollback/deploy live: `/srv/Academy` (build source) e
  `/var/backups/academy/` (backup + rollback).

> Última verificação do estado em produção: 04/09/2026, commit
> `4e66865` (matches `cat /opt/academy/RELEASE_COMMIT`).

---

## 9. CI/CD — gate de deploy

O workflow `.github/workflows/deploy.yml` recebe `workflow_run` quando
`Tests` ou `Playwright Tests` termina em `main`. Antes de configurar SSH,
exige que as execuções mais recentes de ambas as workflows para push em
`main` e seus checks `test` estejam `completed`/`success` no mesmo SHA.
Os checks são identificados pela suite de cada workflow, pois têm o mesmo
nome. O disparo manual (`workflow_dispatch`) passa pelo mesmo gate para
o SHA selecionado. O script de release recebe exatamente o SHA aprovado.

Check ausente, pendente, ignorado, cancelado ou com qualquer conclusão
diferente de `success` bloqueia o release: o deploy falha visivelmente com
`BLOQUEADO`, nada é publicado e é necessário investigar o check indicado.
O primeiro evento pode bloquear enquanto a outra workflow ainda roda;
a conclusão da outra workflow dispara uma nova avaliação. Falha na consulta
à API também bloqueia. O rollback existente no VPS permanece inalterado.

No estado verificado, `main` = `2e3deea` e está atrás de `development`,
onde acontece o trabalho corrente. Sincronizar `main` normalmente é feito
por PR/merge autorizado e está fora do escopo desta mudança. O gate não
substitui proteção remota de branch; essa configuração segue pendente (§7).

**Recibo da verificação (08/09/2026), commit `2e3deea52d16d85df13d27e903c98370456ad887`:**

- Tests: https://github.com/MindsOfFuture/Academy/actions/runs/34175494868
  (`conclusion=failure`, mock `useSearchParams` ausente e paginação/busca de
  `UsersTableClient`).
- Playwright Tests: https://github.com/MindsOfFuture/Academy/actions/runs/34175494891
  (`conclusion=failure`).
- Deploy: https://github.com/MindsOfFuture/Academy/actions/runs/34175494870
  (`conclusion=failure`, passo "Rodar release no servidor").
- Proteção de branch consultada via API pública, sem auth:
  `GET /repos/MindsOfFuture/Academy/rules/branches/main` → `[]` e
  `GET /repos/MindsOfFuture/Academy/rulesets` → `[]` (nenhuma proteção remota
  configurada, confirma o achado do §7).

Replay confirmado: consultando `actions/workflows/tests.yml/runs` e
`actions/workflows/playwright.yml/runs` filtrando por
`head_sha=2e3deea52d16d85df13d27e903c98370456ad887&branch=main&event=push`,
ambas retornam `conclusion=failure` — ou seja, o gate acima teria bloqueado
esse SHA exatamente como descrito, sem exercitar um push real.
