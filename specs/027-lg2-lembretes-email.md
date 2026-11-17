# 027 — Empreenda+: lembrete por e-mail das etapas que faltam

Status: implementada (aguardando ativação em produção)
Constituição: `specs/constitution.md`

## Problema

Quem começa o Empreenda+ e para no meio não tem nada que o traga de volta: a
trilha tem 10 etapas, e em 17/11/2026 nenhuma das 15 contas que usaram o app
tinha chegado ao fim pela jornada.

## Escopo

A pessoa que começou a trilha e parou recebe um e-mail curto dizendo quantas
etapas já fez, quais faltam (com nome) e um botão para continuar. Pode parar os
lembretes por um link, sem precisar entrar na conta.

**Fora de escopo:** lembrete de "Não sei" em aberto (o "Não sei" não é mais
gravado; volta se passar a ser); aviso dentro do app (sino); SMS/WhatsApp;
preferência de frequência; lembrete para quem só criou a conta e nunca abriu o
Empreenda+.

## Critérios de aceite

- [x] Dado alguém com menos de 10 etapas e sem usar o app há 3 dias, quando o
  lembrete roda entre 9h e 19h (Brasília), então recebe um e-mail com as etapas
  que faltam e o botão "Continuar minha trilha".
- [x] Etapas feitas contam tanto pela jornada salva na conta quanto pelos módulos
  concluídos soltos.
- [x] No máximo 3 lembretes por período parado (3 dias, +7, +14); quem volta a
  usar começa um período novo; quem concluiu as 10 não recebe.
- [x] "Não quero mais receber" funciona deslogado: abrir o link só pede
  confirmação; o botão de cancelar do próprio leitor de e-mail (one-click) para
  na hora. Link errado não para ninguém e diz que não encontrou.
- [x] Nenhuma resposta da pessoa vai no e-mail; o nome é escapado.
- [x] Com `RESEND_TEST_RECIPIENT` preenchida, tudo vai para a caixa de teste.
- [x] Só o papel do lembrete lista e marca envios; o site (anon/logado) não.

## Plano

- **Degrau da escada:** reusa o lembrete da gestão (spec 016, ADR 021): o banco
  escolhe e monta, o script `sh + psql + curl` do VPS envia pelo Resend e marca,
  com o papel `gestao_lembrete`. Nenhum serviço novo, nenhuma chave nova.
- **Arquivos:** `supabase/migrations/20261119_lg2_lembretes.sql`,
  `scripts/academy-lembrete-encontros.sh` (bloco novo no fim),
  `app/api/lembretes/sair/route.ts`, `app/lembretes/sair/page.tsx`,
  `lib/supabase/middleware.ts` (2 paths exatos públicos), `public/email/*.png`
  (logos do e-mail), testes em `tests/integration/lg2-lembretes-migration.test.ts`,
  `tests/unit/app/api/lembretes/sair-route.test.ts`,
  `tests/unit/lib/supabase/middleware.test.ts`, RUNBOOK §8.6.
- **Dados:** `public.lg2_lembrete` (token do link de parar, data de saída) e
  `public.lg2_lembrete_enviado` (quando cada lembrete saiu). RLS forçada, sem
  acesso do site. Lê `lg2_progresso`, `telemetry_learning_event` e `user_profile`.

## Decisões

- Atividade = o mais recente entre o progresso salvo e os eventos `lg2_*`.
  Quem usou só antes da conta sincronizar aparece pelos eventos.
- Horário 9h–19h dentro da função: o script continua sem lógica.
- `List-Unsubscribe` + `List-Unsubscribe-Post` no e-mail (exigência do Gmail e
  do Yahoo para remetente em volume; ajuda a não cair no spam).
- Logos do e-mail em PNG (Gmail não mostra SVG) em `/email/`, fora do login.
