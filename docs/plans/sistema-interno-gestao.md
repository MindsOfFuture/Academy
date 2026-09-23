# Sistema interno de gestão do projeto — estudo de viabilidade

Status: **proposta, não aprovada**. Nada implementado. Documento para discussão
com a coordenação e decisão posterior.

Escopo avaliado: módulo interno para bolsistas e equipe do Minds of the Future
cobrindo alocação de bolsistas, relatório mensal e prestação de contas —
hospedado no mesmo VPS que vai receber o Academy (Hostinger KVM 2).

Contexto de infra: `docs/deploy-vps.md` · Decisões: `docs/decisions.md` 001, 002,
005, 008, 013, 014.

Planos dependentes deste (só avançam depois que o schema `gestao` estiver de pé):
`portal-de-ideias.md` e `repositorio-skills-artifacts.md`.

---

## Veredito

**Viável.** A migração Vercel → VPS, já em andamento, é o que torna a decisão fácil:
o custo marginal de infra do módulo interno é **zero** — mesmo host, mesmo systemd,
mesmo nginx, mesmo certbot, mesmo Supabase.

O risco não é técnico. É de governança: quem mantém, e o que acontece com dado de
pessoa quando o autor sai do projeto.

## Dimensionamento do KVM 2

2 vCPU · 8 GB RAM · 100 GB NVMe. O Academy é `output: "standalone"` (ADR 014) e
o banco é hospedado — o VPS só serve HTTP.

| Carga | Demanda | Situação |
|---|---|---|
| Next.js standalone (Academy + módulo) | ~300–500 MB | folgado |
| Usuários simultâneos esperados | dezenas | folgado |
| Geração de `.docx` do relatório mensal | pico curto de CPU, 1×/mês | ok |
| Storage | anexos vão para Supabase Storage | folgado |
| **Build no VPS** | 2–4 GB, vários minutos | **gargalo** |

O único ponto real de atenção já está descrito em `docs/deploy-vps.md`: buildar
**em CI**, não no host. O Academy carrega `three` + `@react-three/fiber` + `drei`;
com 2 vCPU o build compete com o processo que está servindo o site. O módulo
interno não muda isso — só aumenta a chance de alguém fazer o deploy errado.

Ganhos que o VPS habilita e a Vercel não tinha em escopo (ADR 014):

- **cron de sistema** para lembrete e fechamento do relatório mensal;
- **processo longo** de geração de documento, sem teto de timeout;
- **dump automatizado** do Postgres (`docs/supabase.md#backup` hoje é manual).

## Onde o módulo vive

| Opção | Acoplamento | Auth | Veredito |
|---|---|---|---|
| **A — `/gestao` neste repo, mesmo Supabase, schema separado** | alto | reaproveita | **recomendada** |
| B — repo novo, mesmo Supabase | médio | reaproveita | possível |
| C — repo e banco próprios | nenhum | duplicada | descartada |

Decisão recomendada: **A**.

Bolsista já é usuário do Academy. C cria dois cadastros para a mesma pessoa e
duplica a superfície de auth — que os ADRs 002 e 003 apontam como a fonte nº 1 de
bug do repo. A reaproveita middleware, resolver de papel, `lib/api/` e deploy.

Se a opção A for adotada, estes guardrails não são negociáveis:

1. **Schema Postgres separado** (`gestao.*`). Nunca tabela solta no `public`.
2. **RLS própria** por papel do projeto. `createServiceRoleClient()` neste módulo
   é bloqueio de merge — vale a regra de `docs/supabase.md#qual-cliente-usar`,
   sem exceção, porque aqui o dado é institucional e de pessoa.
3. **Toda query por `lib/api/`** (ADR 005). Componente não fala com Supabase.
4. **Rota fora de `PUBLIC_PATH_PREFIXES`** e atrás de checagem de papel no servidor.
5. **Feature flag** para desligar o módulo sem deploy enquanto amadurece.

### Impacto do ADR 008

`supabase/migrations/` não é histórico completo — o schema do `public` nasceu no
dashboard. O schema `gestao` é a chance de **não repetir isso**: nasce inteiro em
migration versionada, reproduzível do zero, com as policies no arquivo. Não replicar
o padrão atual.

## Escopo e ordem de construção

A prioridade declarada é **prestação de contas**. Isso inverte a ordem intuitiva.

O erro clássico é modelar o relatório do bolsista primeiro e tentar somar os números
depois — não fecha, porque relatório é narrativa e prestação de contas é métrica
agregada. Modelar de trás para frente:

| # | Etapa | Por quê nesta ordem |
|---|---|---|
| 1 | Levantar os indicadores oficiais exigidos pela FACC/Governo MG | o formulário oficial **é** a especificação do banco |
| 2 | Modelar `gestao.*` a partir deles | todo número do relatório final precisa de linha de origem rastreável |
| 3 | Alocação: bolsista → escola → turma → carga horária | é o que alimenta os indicadores |
| 4 | Relatório mensal do bolsista + geração do `.docx` | consequência de 3: o sistema já sabe a alocação |
| 5 | Painel + exportação da prestação de contas | fecha os três critérios de sucesso |

Regra de validação do passo 2: **se um indicador do formulário oficial não puder
ser derivado por query, o modelo está errado** — não se resolve com campo de texto
livre preenchido na mão.

Critérios de sucesso, na prioridade acordada:

1. prestação de contas ao convênio sai por exportação, não por planilha manual;
2. coordenação para de consolidar relatório à mão;
3. bolsista entrega no prazo, sem retrabalho.

## Dado sensível de pessoa

**Indefinido.** Tratar como decisão de design, não como pendência.

Recomendação — minimização por padrão:

- MVP **não** guarda CPF, dado bancário nem documento digitalizado;
- o modelo prevê a extensão em tabela separada (`gestao.bolsista_dados_pessoais`),
  com RLS própria, legível só pela coordenação;
- anexo, se existir, vai para **Supabase Storage com bucket privado** — nunca no
  disco do VPS, que é sobrescrito a cada deploy.

Precedente no repo: `docs/supabase.md#storage` registra que
`lib/supabase/student_projects.ts#uploadFile` devolve **URL pública**, sem
sanitização de nome nem limite de tamanho. Esse caminho **não serve** para
documento de bolsa. Reusá-lo por conveniência é o modo mais provável de vazar dado
de RH.

Guardar dado de RH na mesma base de alunos de escola pública — muitos menores de
idade — eleva o projeto inteiro de categoria em LGPD. Adiar a decisão não custa
nada; tomá-la errada agora custa retrabalho de compliance.

## Sucessão

Outro bolsista/dev assume a operação. Isso move os itens abaixo de "boa prática"
para **escopo do MVP** — sem eles o sistema morre no primeiro incidente após a
saída do autor.

- [ ] `RUNBOOK.md` em português: deployar, reverter, ler log, o que fazer se cair
- [ ] deploy por CI (`rsync` + `restart` já mapeado em `docs/deploy-vps.md`), não manual
- [ ] backup do Postgres em cron **com restore testado uma vez** — backup não testado não é backup
- [x] monitor de uptime externo (UptimeRobot, alerta por email; testado em 23/09/2026 — `RUNBOOK.md` §5.4)
- [ ] renovação de TLS conferida (certbot já resolve; confirmar o timer)

Custo estimado: 4–6 h. É o item de maior retorno da lista inteira.

## Riscos

| Risco | Severidade | Mitigação |
|---|---|---|
| Bus factor: VPS não gerenciada, autor se forma em 2026 | alta | bloco de Sucessão acima, dentro do MVP |
| Dado de pessoa em base com aluno menor de idade | alta | minimização por padrão; bucket privado |
| `createServiceRoleClient()` usado "para destravar" no módulo novo | alta | bloqueio de merge; RLS obrigatória |
| Schema `gestao` nascer no dashboard e repetir o ADR 008 | média | migration versionada desde a primeira tabela |
| Build do módulo competindo com o site no host de 2 vCPU | média | build em CI (`docs/deploy-vps.md`) |
| Release do módulo travado pelo ciclo do produto público | média | feature flag |
| `remotePatterns: "**"` (ADR 013) vira custo direto no VPS | baixa | restringir ao host do Supabase antes do corte |

## Estimativa

| Frente | Horas |
|---|---|
| Infra (compartilhada com a migração já em curso) | 10–16 |
| Schema `gestao` + RLS + `lib/api/` | 25–35 |
| Alocação (CRUD + regras) | 30–40 |
| Relatório mensal + geração de `.docx` | 25–35 |
| Painel + exportação | 25–35 |
| Runbook, backup, testes | 15–20 |
| **Total** | **130–180** |

Faixa, não compromisso. Depende quase toda da complexidade do formulário oficial
de prestação de contas: se ele tiver dezenas de campos derivados, o passo 2 dobra.

## Bloqueadores antes da primeira linha de código

1. **Formulário oficial de prestação de contas** em mãos. Sem ele o passo 1 não
   existe e o modelo de dados vira chute.
2. **Decisão sobre dado sensível** (seção acima) — muda o schema e a postura LGPD.
3. **Desenho de infra do VPS já contemplando cron e worker**, antes de concluir a
   migração da Vercel. Definir agora custa ~1 h; depois é refazer o corte.

## Não feito de propósito

- **Docker / compose** — contraria `docs/deploy-vps.md` e o ADR 014. O módulo mora
  no mesmo processo Next do Academy; não há segundo serviço que justifique. Revisar
  só se o worker de documento virar processo separado.
- **Fila de jobs** — geração de `.docx` é 1×/mês por bolsista. Cron + execução
  síncrona resolve. Fila é otimização prematura.
- **Banco próprio** — opção C, descartada acima.
- **App mobile** — fora de escopo. O uso é mensal e desktop.
