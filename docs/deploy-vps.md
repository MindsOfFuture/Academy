# Deploy em VPS

Alvo: um VPS Linux, Node + systemd + nginx. Sem Docker, sem orquestrador.
Banco continua no Supabase hospedado (ver `docs/supabase.md`).
Porquê desta forma: `docs/decisions.md` 014.

`next.config.ts` já tem `output: "standalone"` — o build gera `.next/standalone`,
uma pasta autocontida com um `server.js` e só as dependências usadas.

## Requisitos

- Node 20+ (mesma major do CI), nginx, certbot.
- Um usuário sem privilégio para rodar a app: `adduser --system --group academy`.
- `/opt/academy` (app) e `/etc/academy.env` (env, modo `600`, dono `academy`).

## Build

Buildar **no VPS ou em CI**, nunca copiar `.next` de máquina de dev — o build embute
as `NEXT_PUBLIC_*` do ambiente onde rodou.

```bash
npm ci
npm run build

# standalone não copia estes dois; é manual e é o erro nº 1 (site sem CSS/imagem)
cp -r .next/static .next/standalone/.next/static
cp -r public       .next/standalone/public
```

Publicar:

```bash
rsync -a --delete .next/standalone/ academy@HOST:/opt/academy/
ssh academy@HOST 'sudo systemctl restart academy'
```

## Env

`/etc/academy.env`, formato `CHAVE=valor` (systemd, **sem aspas**, sem `export`).
Campos em `.env.example`. No VPS, atenção a:

- `NEXT_PUBLIC_APP_URL` — obrigatória. `VERCEL_URL` não existe aqui; sem ela, link de
  email e certificado saem quebrados.
- `RESEND_TEST_RECIPIENT` — **vazia** em produção, senão todo email vai para uma caixa só.
- `SUPABASE_SERVICE_ROLE_KEY` — só neste arquivo, modo `600`. Nunca em `/opt/academy`,
  que é sobrescrito a cada deploy.
- `NEXT_PUBLIC_*` são embutidas **no build**. Mudou uma? Rebuild, restart não basta.
- Supabase URL/anon key faltando = **middleware responde 503 em todas as rotas não
  isentas** (fail-closed, só assets passam). App inteiro fora do ar, não aberto.
  Conferir antes de apontar o DNS.

## systemd

`/etc/systemd/system/academy.service`:

```ini
[Unit]
Description=Academy (Next.js)
After=network.target

[Service]
Type=simple
User=academy
WorkingDirectory=/opt/academy
EnvironmentFile=/etc/academy.env
Environment=NODE_ENV=production PORT=3000 HOSTNAME=127.0.0.1
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=5
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

`HOSTNAME=127.0.0.1` prende o Node ao loopback: só o nginx alcança a porta 3000.

```bash
sudo systemctl enable --now academy
journalctl -u academy -f
```

## nginx

```nginx
server {
    server_name academy.seu-dominio.com.br;

    client_max_body_size 20M;   # upload de submissão e documento de professor

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade           $http_upgrade;   # realtime do chat
        proxy_set_header Connection        "upgrade";
    }
}
```

`sudo certbot --nginx -d academy.seu-dominio.com.br` para o TLS.

Sem `X-Forwarded-Proto`, o Next monta URL absoluta em `http` e o cookie de sessão do
Supabase (`Secure`) é descartado — login entra em loop.

## Antes de apontar o DNS

- [ ] `npm ci && npm run build` passa no VPS
- [ ] `curl -I localhost:3000` responde 200
- [ ] Login, upload de submissão e chat de atividade funcionam pelo domínio com https
- [ ] Email chega com link do domínio novo (`RESEND_TEST_RECIPIENT` vazia)
- [ ] Rota protegida sem sessão redireciona para `/auth`, e não 503 (prova que as env
      vars do Supabase estão presentes)
- [ ] `docs/supabase.md#backup` — backup diário automático confirmado ativo (ou
      dump manual feito, se a mudança exigir cópia fora do Supabase)

## Não feito de propósito

- **Docker / compose** — um systemd resolve um processo. Adicionar quando houver
  segundo serviço ou segundo host.
- **CI de deploy** — `rsync` + `restart` cabe em uma etapa de workflow quando a decisão
  de infra fechar. Hoje é manual.
- **Zero-downtime** — `Restart=always` dá alguns segundos de 502 no deploy. Aceitável
  para o uso escolar. Se não for: segunda instância na 3001 + `upstream` no nginx.
- **`remotePatterns` liberado** — no VPS, otimização de imagem de host arbitrário consome
  CPU e banda do servidor. Restringir ao host do Supabase (`docs/decisions.md` 013).
- **Restore testado** — backup diário automático já ativo (10:45, ver
  `docs/supabase.md#backup`), mas restore validado é item separado.
