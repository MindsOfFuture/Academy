# 002 — Modelo operacional de gestão interna (schema `gestao.*`)

Status: aprovada
Constituição: `specs/constitution.md`

Aprovação: decisão humana do Rafael em 05/09/2026, registrada no card `t_efbdc18c`. O
formulário oficial de prestação de contas **não** integra esta versão; as fontes
(planilhas de levantamento, dados dos alunos, calendário/planejamento e lista de
presença) foram lidas e os requisitos abaixo são a orientação aprovada para o MVP.

## Problema

Bolsistas e coordenação do Minds of the Future consolidam à mão, em planilha, o dado
operacional das visitas às escolas (alunos, reservas de ônibus, termos, presença e
carga dos bolsistas), sem uma origem única consultável e auditável por trás dos
números do convênio.

## Escopo

A coordenação passa a registrar, de forma normalizada e rastreável, os alunos
participantes, as visitas/reservas às escolas (incluindo ônibus), a agenda e a
alocação dos bolsistas, a presença nas aulas e a preparação das listas de presença
enviadas às escolas — de modo que os indicadores do convênio (total de alunos,
reservas de ônibus, termos arquivados/pendentes, presença, aulas realizadas e carga
dos bolsistas) sejam **derivados por query**, nunca preenchidos à mão.

Cada registro preserva quem criou/alterou e quando, com acesso restrito a papéis do
projeto definidos por membro (não pelo papel `admin`/`teacher`/`student` do produto
público). Dado de menor de idade não é exposto a anônimo nem a usuário autenticado
fora da coordenação.

**Fora de escopo:** formulário oficial de prestação de contas e sua exportação
(futuro); qualquer campo de pessoa sensível — CPF, dado bancário, documento
digitalizado/termo assinado como imagem; no MVP guarda-se apenas o **status** do
termo e da presença; cadastro e autenticação de usuários (reusado do Academy);
roteamento/UI do módulo e feature flag (entregues pela card de `lib/api/gestao`,
`t_2ed62c43`, não por esta spec).

## Critérios de aceite

- [ ] Dada a coordenação autenticada, quando registra aluno, visita/reserva, alocação, presença e lista enviada, então os registros persistem com o autor e o instante de criação gravados.
- [ ] Dado um indicador do convênio (total de alunos, nº de reservas de ônibus, termos pendentes vs. arquivados, presença por aula, aulas realizadas, carga por bolsista), quando consultado, então o valor é derivável por uma única query sobre as tabelas normalizadas, sem coluna de total mantida à mão.
- [ ] Dada a lista enviada à escola, quando montada, então comporta a escola mais até 30 nomes de alunos e reflete o estado da reserva correspondente.
- [ ] Dado um usuário autenticado **sem** papel do projeto, quando consulta ou grava qualquer tabela `gestao.*`, então não lê nem escreve nenhuma linha (RLS nega por papel).
- [ ] Dado um usuário anônimo, quando acessa qualquer tabela `gestao.*`, então não lê nem grava nada.
- [ ] Dada uma operação no schema `gestao`, quando executada, então nenhum caminho depende de `createServiceRoleClient()`; a autorização vive na RLS por papel de membro.
- [ ] Dado o MVP, quando inspecionado, então não existe coluna para CPF, dado bancário nem documento digitalizado; termo e presença guardam apenas status.
- [ ] Dada a migration, quando aplicada duas vezes, então é idempotente e reproduz o schema `gestao.*` do zero.

## Plano

- **Degrau da escada:** reusam-se o schema/RLS do Supabase hospedado, o padrão de
  papel-membro resolvido por `auth.uid()`, funções `security definer` com `set
  search_path` para a checagem de papel (mesmo molde de `collect_learning_analytics_snapshot`
  na migration de telemetria) e o harness PGlite dos testes de migration existentes.
  Nada de serviço novo, nada de cliente novo.
- **Arquivos:** `specs/002-gestao-modelo-operacional.md`; `supabase/migrations/20260905_gestao_modelo_operacional.sql`;
  `tests/integration/gestao-migration.test.ts`.
- **Dados:** as tabelas/colunas abaixo, todas no schema `gestao`, com RLS e políticas
  no arquivo.
- **Autorização:** nenhuma rota pública; nenhum `PUBLIC_PATH_PREFIXES`; nenhum
  `createServiceRoleClient`. O vínculo de papel vive em `gestao.papel_membro` e é
  conferido por funções `security definer` descritas no modelo. A camada `lib/api/gestao`
  (card `t_2ed62c43`) usa o cliente SSR autenticado (`server.ts#createClient`) contra
  estas políticas.
- **Dependência nova:** nenhuma em runtime; `@electric-sql/pglite` e `pg` já existem
  como devDependencies e são reusados no teste de migration.
- **Atalhos:** nenhum nesta spec; o módulo nasce com o schema completo em migration,
  sem estado no dashboard.

### Modelo (schema `gestao`)

Papel de membro do projeto, isolado do papel do produto:

| Tabela | Papel |
|---|---|
| `gestao.papel_membro` | vínculo `(user_profile_id, papel)` + `concedido_por` + timestamps. `papel` ∈ `coordenacao` \| `bolsista`. Único por usuário. |

Registro operacional (todas com `criado_em`/`atualizado_em`/`criado_por` apontando
`auth.users`):

| Tabela | Campos relevantes |
|---|---|
| `gestao.escola` | nome, categoria, cidade |
| `gestao.aluno` | nome, idade, escola, categoria da escola, ano escolar, modalidade, execução, cidade |
| `gestao.reserva` (visita) | escola, ônibus (booleano), dias, horários, modalidade, nº alunos, série, status, status do termo |
| `gestao.reserva_termo` | status do termo por aluno na reserva (`pendente`/`arquivado`) — sem imagem/CPF |
| `gestao.agenda` (alocação) | data, escola, aulas, modalidade, horário |
| `gestao.agenda_bolsista` | vínculo agenda ↔ bolsista (carga horária da alocação) |
| `gestao.aula` | aula/módulo realizada num `agenda`, com data de realização (alimenta "aulas realizadas") |
| `gestao.presenca` | por aula: aluno presente/ausente + status de assinatura do termo; bolsista e professor registrados |
| `gestao.lista_enviada` | escola + lista de nomes (até 30) preparada para envio |

Instrumento de auditoria (append-only): `gestao.registro_auditoria` registra
operações de escrita com autor e instante, garantir rastreabilidade sem depender de
log externo.

### Indicador como dado, não como schema

Nenhum indicador é coluna: cada total é uma query de agregação sobre as tabelas
normalizadas acima. A spec fixa os seis indicadores deriváveis e deixa a forma exata
de agregação para `lib/api/gestao` (card `t_2ed62c43`):

1. total de alunos participantes — `count(*)` em `gestao.aluno`;
2. reservas de ônibus — `count(*)` em `gestao.reserva` com `onibus = true`;
3. termos arquivados vs. pendentes — contagem de `gestao.reserva_termo` por status;
4. presença — contagem de `gestao.presenca` por aula;
5. aulas/módulos realizados — contagem de `gestao.aula`;
6. alocação/carga dos bolsistas — junção `gestao.agenda_bolsista` com `gestao.papel_membro`.

### Decisão — papel de membro fica no schema `gestao`, não em `public.role`

O `public.role` do Academy modela o produto público (`admin`/`teacher`/`student`) com
precedência `admin > teacher > student`. Governança interna do projeto não é o mesmo
eixo de autorização: misturar coordenação com `admin` do produto é exatamente o
acoplamento que `portal-de-ideias.md` veta ("misturar administração do produto público
com governança interna"). A autorização do `gestao` nasce em tabela própria
(`gestao.papel_membro`), resolvida por `auth.uid()`, sem tocar em `public.role` nem
ampliar `RoleName`. A RLS de cada tabela `gestao.*` confere o papel via função
`security definer` (`gestao.usuario_com_papel(papel text)`) imune à RLS e sem caminho
de service role.

## Tarefas

- [ ] RED/GREEN: migration reproduz `gestao.*`, RLS nega anônimo/autenticado sem papel, permite coordenação e deriva os seis indicadores por query — `tests/integration/gestao-migration.test.ts`
- [ ] Criar schema, tabelas, papel de membro, funções de checagem, políticas e grants — `supabase/migrations/20260905_gestao_modelo_operacional.sql`
- [ ] Verificar lint, unit/coverage, typecheck e build.

## Aberto

Nenhuma decisão aberta. A card `t_efbdc18c` fixa escopo (sem prestação de contas),
minimização LGPD (sem CPF/bancário/documento), acesso por papel de membro e entrega
da camada `lib/api/gestao` como card dependente (`t_2ed62c43`).