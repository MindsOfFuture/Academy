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

Backup e restore do **banco** não estão aqui: §7. O que `/var/backups/academy`
guarda é app + config (§3), nunca dados do Supabase.

---

## 7. Backup e restore do banco (Supabase)

O banco não roda no VPS. Não há systemd timer, não há cron nosso, e
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

## 8. O que NÃO existe de propósito

- **Docker/compose** — um systemd resolve um processo.
- **PM2** — não é usado (unit de `academy.service` ativa; PM2 não instalado).
- **Zero-downtime** — `Restart=always` dá alguns segundos de 502.
- **CI de deploy** — release é disparado manualmente via script.
- **Backup do banco no VPS** — não existe e não deve existir: é gerenciado pelo
  Supabase (§7). Falta restore testado e alerta de falha (§7.5).
- `remotePatterns` segue liberado (`hostname: "**"`) — ver
  `docs/decisions.md` 013 (restrição pendente).

---

## 9. Referências

- `docs/deploy-vps.md` — procedimento de build/nginx original (referência).
- `docs/supabase.md` — banco, clientes, RLS, backup.
- `docs/decisions.md` — ADRs 001–017 (Supabase, roles, VPS, segurança).
- `CLAUDE.md` na raiz — convenções de código e arquitetura.
- Rollback/deploy live: `/srv/Academy` (build source) e
  `/var/backups/academy/` (backup + rollback).

> Última verificação do estado em produção: 04/09/2026, commit
> `4e66865` (matches `cat /opt/academy/RELEASE_COMMIT`).