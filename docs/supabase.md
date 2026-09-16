# Supabase — guia operacional

Como o banco é acessado, o que existe nele, e o que quebra.
Decisões e o porquê: `docs/decisions.md` (001, 002, 003, 008).

## Qual cliente usar

`lib/supabase/` expõe quatro fábricas. Escolher errado é a fonte nº 1 de bug de auth.

| Fábrica | Onde roda | Chave | RLS | Usar quando |
|---|---|---|---|---|
| `client.ts#createClient` | browser | anon | sim | componente client-side |
| `server.ts#createClient` | SSR / route handler | anon + cookie | sim | **padrão no servidor** |
| `server.ts#createAdminClient` | servidor | service role | **não** | mutação de admin |
| `server.ts#createServiceRoleClient` | servidor | service role | **não** | último recurso |

`createAdminClient()` valida antes de devolver: exige sessão, lê `user_role` →
`role`, exige `name === 'admin'`. Lança `Error` com mensagem em português se falhar
— o route handler traduz para 403.

`createServiceRoleClient()` **não checa nada**. Seis linhas, service role cru, RLS
ignorada. Só para fluxo sem caller autenticado (ex.: fan-out de notificação).
Todo uso precisa de guarda escrita à mão. Regra de review: um `createServiceRoleClient()`
novo sem guarda visível no mesmo arquivo é bloqueio de merge.

`middleware.ts` usa `createServerClient` direto. **Nada entre `createServerClient` e
`auth.getUser()`** — código no meio quebra o refresh de sessão de forma intermitente.

## Variáveis

| Var | Escopo | Notas |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | público | faltando, `missingSupabaseEnv()` (`lib/utils.ts`) faz o middleware responder 503 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | público | RLS é a proteção, não o segredo |
| `SUPABASE_SERVICE_ROLE_KEY` | **servidor** | nunca `NEXT_PUBLIC_*`; vaza = banco inteiro aberto |

Faltando URL/anon key, `missingSupabaseEnv()` devolve os nomes ausentes e o middleware
**responde 503 em todas as rotas não isentas** (fail-closed) — nunca libera. Só assets
(`/_next/static`, `/_next/image`, `/favicon.ico`, imagens) passam. Os nomes das variáveis
vão para o log do servidor; a resposta HTTP é genérica. Conferir env antes do primeiro boot.

## Tabelas em uso

Levantadas dos `.from()` no código, não de dump. Formas exatas: interfaces `*Row`
em `lib/api/types.ts` + strings de select em `lib/api/`.

- **Identidade** — `user_profile`, `user_role`, `role`, `student_details`, `teacher_details`, `teacher_request`
- **Cursos** — `course`, `course_module`, `lesson`, `enrollment`, `lesson_progress`
- **Trilhas** — `learning_path`, `learning_path_course` (join ordenado)
- **Atividades** — `assignment`, `assignment_submission`, `activity_chat_message`, `student_projects`
- **Conteúdo** — `article`, `media_file`, `certificate`
- **Plataforma** — `notification`, `system_config`, `credits_entries`
- **Telemetria** (append-only) — `telemetry_video_interaction`, `telemetry_assessment_interaction`, `telemetry_content_review`

Nomes de tabela em português (`nossos_cursos`, `users_cursos`, `progresso_aluno`) e os
plurais `modules`/`lessons` **não existem no schema vivo** — vinham de uma camada de
acesso já removida do repo (ver ADR 016). Aparecer um desses num select é erro de
migração de código antigo, não tabela a criar.

## Storage

Buckets: `avatars`, `submissions`, `teacher-qualification-documents`.

`lib/supabase/student_projects.ts#uploadFile` sobe em `submissions` com nome
`${Date.now()}_${file.name}` e devolve **URL pública**. Sem sanitização de nome, sem
limite de tamanho, sem checagem de tipo. Documento de qualificação de professor é
dado sensível — conferir que `teacher-qualification-documents` **não** é público.

## RLS

RLS é a única defesa dos clientes anon (browser e SSR). As políticas vivem no projeto
hospedado, **não estão no repo**. Ao criar tabela nova:

1. Habilitar RLS. Tabela nova sem política + anon key = leitura aberta.
2. Escrever a policy no dashboard **e** um arquivo em `supabase/migrations/`.
3. Confirmar que a rota não "resolveu" o acesso trocando para service role.

RLS não cobre: `owner_id` de conteúdo de professor (`ensureCourseOwnerOrAdmin`, interno
a `lib/api/courses.ts`) nem o gate de professor verificado
(`ensureCurrentTeacherVerifiedForPublishing`, `lib/api/profiles-server.ts`). Essas duas
regras existem só no código do servidor.

## Migrations

`supabase/migrations/` tem 3 arquivos (créditos, scrub de usuário deletado).
**Não é histórico completo** — o schema foi feito pelo dashboard.

Consequência prática: **não dá para levantar o banco do zero a partir do repo.**
Ambiente novo sai de clone do projeto hospedado:

```bash
supabase link --project-ref <ref>
supabase db dump -f schema.sql --schema public   # estrutura + policies
supabase db dump -f roles.sql --role-only
```

Guardar esses dumps fora do repo (contêm nome de policy e estrutura interna) e tratar
como o baseline. Mudança nova: sempre arquivo em `supabase/migrations/`, mesmo tendo
sido aplicada pelo dashboard.

## Armadilhas

- **Join devolve objeto ou array**, depende da cardinalidade. Nunca ler `.url` direto:
  usar `getMediaUrl()` (`lib/api/types.ts`).
- **FK hint obrigatório** quando há mais de um caminho:
  `thumb:media_file!course_thumb_id_fkey(url)`.
- **`snake_case` só existe em `lib/api/`.** Passou dali, é camelCase.
- **Realtime**: `activity-chat.ts#subscribeToMessages` assina `activity_chat_message`.
  Precisa da tabela publicada em `supabase_realtime` no dashboard — não é automático.
- **Erro do Supabase não é `throw`.** `{ data, error }`; ignorar `error` devolve
  `data: null` e vira `TypeError` três camadas acima.
- **Teste**: nunca bate no Supabase real. Mock em `tests/mocks/supabase.ts`,
  `vi.mock` **antes** do import do módulo sob teste.

## Backup

Backup diário automático **ativo** no dashboard do Supabase (Project Settings →
Database → Backups), agendado para rodar todo dia às 10:45. Isso substitui a
dependência de alguém lembrar de rodar um dump manual antes de cada mudança de
infra — é a rede de segurança do checklist "antes de apontar o DNS"
(`docs/deploy-vps.md#antes-de-apontar-o-dns`).

O que essa automação cobre:

- Snapshot diário gerado pelo próprio Supabase, sem intervenção manual.
- Horário fixo (10:45) — uma mudança de infra feita bem antes desse horário só
  tem cobertura garantida a partir do snapshot do dia seguinte.

O que ela **não** cobre (fora do escopo deste backup, não inventar que resolve):

- **Restore testado.** A automação com restore validado é item separado (ver card
  de automação com restore testado). Backup que nunca foi restaurado é uma
  suposição, não uma garantia.
- **Retenção.** Quantos dias de histórico o plano guarda é uma configuração do
  dashboard — conferir lá antes de contar com um snapshot antigo para um
  incidente que não é do dia anterior.
- **Cópia fora do Supabase.** O snapshot vive dentro da própria infraestrutura do
  Supabase. Se o critério de aceite exigir um arquivo fora do Supabase também
  (não só fora do VPS e fora da máquina de quem gerou), isso ainda depende do
  dump manual abaixo.

Dump manual continua existindo para os casos que o backup automático não cobre:
antes de uma migration destrutiva específica, ou quando é preciso um arquivo
local para guardar fora da infra do Supabase.

```bash
supabase db dump -f backup-$(date +%F).sql --data-only
```

Depois de gerar, conferir tamanho do arquivo e contagem de tabelas contra o banco
vivo antes de considerar o dump válido — arquivo vazio ou truncado passa
despercebido se ninguém olhar o conteúdo.
