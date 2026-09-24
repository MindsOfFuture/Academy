# Gestão interna do dia a dia — plano de construção

Status: **validada em 23/09/2026** (ver "Validação"). Rafael pediu o desenvolvimento
em 23/09/2026; M0, M6 e M8 estão em desenvolvimento, cada um na sua branch e com sua
spec no primeiro commit. Os demais módulos seguem como proposta. Cada módulo vira uma
spec própria (`specs/003` a `specs/011`), aprovada antes do primeiro commit de código
(Constituição § I).

Plano-pai: `sistema-interno-gestao.md` · Base já entregue: `specs/002-gestao-modelo-operacional.md`
· Contrato de indicador: `indicador-como-dado-contrato.md`

---

## Veredito

**Viável, e metade da fundação já existe.** O schema `gestao.*` (spec 002) já tem
escola, aluno, reserva, termo, agenda, alocação, aula, presença, lista enviada e
auditoria append-only, com RLS por papel de membro e autoria carimbada pelo banco. A
rota `/gestao` existe atrás de `GESTAO_ENABLED`, mas hoje só **lê** seis indicadores:
não há tela de cadastro, não há conceito de **turma** e não há nada de finanças,
diário ou avaliação.

O objetivo declarado é **tirar tudo das planilhas e pastas do Drive**. Isso muda a
régua de pronto: um módulo só está entregue quando a planilha correspondente foi
importada, marcada como somente leitura e deixou de ser a fonte. Tela nova sem
migração do legado não resolve nada, porque a equipe continua a alimentar a planilha.

Três ajustes no que já existe são pré-requisito, não melhoria:

1. **RLS permissiva demais para bolsista.** A policy `membro_ler_escrever` dá `for all`
   a qualquer membro em nove tabelas: hoje um bolsista pode apagar escola, aluno ou
   presença de qualquer turma. Reproduzido em PGlite com a migration atual: autenticado
   como bolsista, `delete from gestao.escola` apagou a escola. Precisa ser fatiada
   antes de o bolsista usar o sistema.
2. **Falta a entidade turma.** Hoje a aula pendura em `agenda → escola`. O que a equipe
   chama de "turma" (grupo de alunos de uma escola, com início, fim, pasta e KPI
   próprios) não existe. Sem ela não há frequência, encerramento nem avaliação.
3. **Carga é texto livre** (`agenda_bolsista.carga text`, `agenda.horario text`). Carga
   horária não soma com texto. Horário passa a ser `inicio`/`fim` do tipo `time`.

## Validação (23/09/2026)

Conferido contra a migration de `origin/development` (c6e1473) em PGlite e, somente em
leitura, contra o banco de produção (`jrfehrhiyilxhbuwjmat`, conferido com o
`project_ref` do `.mcp.json`). Nenhuma escrita em produção.

| # | Afirmação ou lacuna | Resultado | Evidência | Efeito no plano |
|---|---|---|---|---|
| V1 | Os blocos SQL do plano aplicam sobre a migration atual | **confirmado**, 8/8 (agora 9/9 com o M8) | `validate_plan_sql.mjs` em PGlite | nenhum |
| V2 | Os blocos são idempotentes | **não** — `create table` sem `if not exists` e `add constraint` solto falham no segundo passe | cada bloco rodado duas vezes | blocos são ilustração; a migration de cada módulo usa `if not exists` e bloco `do $$` para constraint |
| V3 | Bolsista apaga escola com a RLS atual | **confirmado** | autenticado como bolsista, `delete from gestao.escola returning nome` devolveu a escola | M0 mantém a correção como primeira tarefa |
| V4 | Coordenação encontra usuário por e-mail em `user_profile` para conceder papel | **falso** — a RLS de produção de `user_profile` só deixa ler o próprio perfil (ou tudo, se for `admin` do produto) | policies de `user_profile` lidas em produção; em PGlite com as mesmas policies, a busca devolveu 0 linhas e a lista de membros saiu sem nome | M0 ganha duas funções `security definer` restritas à coordenação: busca por e-mail exato e lista da equipe com nome |
| V5 | "Revogar o papel de quem tem alocação é recusado" basta | **incompleto** — a recusa vem da FK `restrict`; quem sai do projeto depois de trabalhar nunca perde o acesso | em PGlite: revogação recusada e o ex-bolsista continuou lendo as escolas | M0 ganha `papel_membro.desligado_em`: desligar corta o acesso e preserva o histórico; remover o vínculo só vale para quem nunca trabalhou |
| V6 | O `/gestao` lê o banco pelo schema `gestao` | **bloqueado em produção** — a API do Supabase só expõe `public` e `graphql_public` | `Accept-Profile: gestao` → `PGRST106 Invalid schema: gestao` | novo bloqueador B4: expor `gestao` nas configurações da API antes de ligar a flag. Grants e RLS já estão prontos para isso |
| V7 | Estado do `gestao.*` em produção | **vazio**: 0 linhas em todas as tabelas, nenhum membro | contagem em produção | bloqueador 2 resolvido: `horario`/`carga` convertem direto. O primeiro membro da coordenação entra por SQL uma única vez (ver M0) |
| V8 | pg_cron para os lembretes do M5 | **disponível, não habilitado**; o papel `postgres` tem `bypassrls` | `pg_available_extensions`, `pg_extension`, `pg_roles` | a dúvida sobre RLS forçada está respondida: job como `postgres` atravessa. Habilitar a extensão é mudança em produção e exige aprovação |
| V9 | Avisar outra pessoa pelo sino | **a RLS de `notification` só aceita linha do próprio usuário** (`user_id = auth.uid()`) | policy lida em produção | aviso a terceiros (M5, M8) sai de trigger `security definer` no banco, nunca de `createServiceRoleClient()` |
| V10 | Colunas de `course`, `course_module`, `lesson` para o histórico (M6) | conferidas em produção | `information_schema.columns` | trigger continua genérico (`to_jsonb`), sem lista de colunas |
| V11 | Sobreposição com o quadro do Trello | os cards antigos SP12–SP15 (de `sistema-interno-gestao.md`) pedem `systemd timer` e relatório em `.docx`; este plano usa pg_cron e PDF impresso (D6) | leitura do quadro MindsAcademy | os cards novos citam o antigo que substituem; arquivar os antigos fica com quem os tem atribuídos |

## O que muda para quem usa

| Hoje | Depois |
|---|---|
| Turma nova = pasta no Drive + planilha de presença + planilha de termos | Turma nova = um cadastro. A página da turma **é** a pasta |
| Fim da turma = alimentar outra planilha de KPI | Botão "Encerrar turma": confere pendências e os KPI aparecem sozinhos |
| Disponibilidade e alocação por conversa/planilha | Grade de disponibilidade + agenda com alerta de conflito e de carga |
| Relatório mensal do bolsista montado à mão | Relatório gerado a partir das aulas e atividades do mês, revisado e enviado pelo sistema |
| Controle de bolsa paga, compras e orçamento em planilha | Painel de pagamentos por mês, solicitações de compra com cotações e gasto por categoria |
| Alteração de conteúdo dos cursos sem rastro | Histórico detalhado por curso: quem mudou o quê, de quê para quê, quando |
| Relato da aula por mensagem ou nenhum | Diário de bordo com perguntas prontas, preenchido no celular ao fim da aula |
| Retorno das escolas informal | Pesquisa de avaliação final (NPS) por link para o professor da escola |
| Sugestão de melhoria some no WhatsApp, sem resposta | Bolsista pede melhoria dentro do sistema e acompanha a resposta; a coordenação responde toda solicitação, e recusa sempre tem motivo |

## Arquitetura (vale para todos os módulos)

Segue os guardrails do plano-pai sem exceção:

- Tudo no schema `gestao.*`, em migration versionada. A exceção é o histórico de
  conteúdo (módulo 8), que audita tabelas do `public` e por isso mora no `public`.
- **Nenhum `createServiceRoleClient()`**. Escrita pelo cliente SSR autenticado
  (`server.ts#createClient`) contra RLS; o que precisa atravessar a RLS é função
  `security definer` com `set search_path`, no molde de `gestao.usuario_com_papel`.
- **Views com `security_invoker = true`.** View padrão do Postgres roda com o dono e
  **ignora a RLS**: todo KPI em view sem essa opção vaza dado de aluno menor a
  qualquer membro. Um teste de migration por view comprova a opção.
- **Escrita:** `lib/api/gestao/<modulo>.ts` (`import "server-only"`) tem as queries;
  `app/gestao/<modulo>/actions.ts` (`"use server"`) chama `ensureGestaoMember()` e a
  função de `lib/api`, e depois `revalidatePath`. Componente não fala com o Supabase.
- **Formulário:** `<form action>` nativo + `useActionState` do React 19. Sem biblioteca
  de formulário nem de validação: validadores pequenos em `lib/api/gestao/validacao.ts`.
- **Indicador como dado:** nenhum total guardado em coluna. KPI é query ou view.
- **Celular primeiro** nas duas telas de bolsista (chamada e diário), usadas em pé, na
  escola, no fim da aula. O resto é desktop.
- **Importar do legado:** colar do Google Sheets (TSV da área de transferência) →
  pré-visualizar → validar linha a linha → gravar. Sem upload de arquivo e sem
  dependência de parser. Um importador por tipo de planilha, não um genérico.

Papéis continuam dois: `coordenacao` e `bolsista`. O professor da escola **não** é
membro. Ele responde a avaliação por link com token (módulo 7).

### Nova divisão da RLS (spec 003)

| Dado | Coordenação | Bolsista | Anônimo |
|---|---|---|---|
| Escola, aluno, turma, matrícula | lê e escreve | lê só turmas em que está alocado | nada |
| Encontro, aula, presença, diário | lê e escreve | lê/escreve só nas turmas em que está alocado | nada |
| Disponibilidade, atividade, relatório mensal | tudo | só os próprios | nada |
| Bolsa, pagamento | tudo | lê só os próprios | nada |
| Compra, cotação | tudo | abre e lê as próprias | nada |
| Categoria, orçamento, auditoria | tudo | nada | nada |
| Resposta da avaliação final | lê | lê as das próprias turmas | responde só com token válido, via função |
| Solicitação de melhoria (M8) | lê todas e responde | abre, lê as próprias e as aceitas/entregues de todos, edita a própria enquanto nova | nada |

Função nova: `gestao.bolsista_na_turma(p_turma uuid) returns boolean` (`security
definer`, `stable`, `search_path` fixo) → existe `agenda_bolsista` do chamador em
algum encontro da turma.

Enquanto a turma não existe (M0 vem antes do M1), o escopo do bolsista é o encontro:
`gestao.bolsista_na_agenda(p_agenda)` e `gestao.bolsista_na_escola(p_escola)`, no mesmo
molde. O M1 troca o escopo por escola pelo escopo por turma. Reserva, termo da reserva e
lista enviada ficam só com a coordenação.

Quem sai do projeto é **desligado**, não apagado: `papel_membro.desligado_em` preenchido
tira o acesso na hora (`usuario_com_papel` e `gestao_membro_papel` passam a ignorar o
vínculo desligado) e preserva alocação, carga e autoria. Apagar o vínculo só é possível
para quem nunca foi alocado. O banco recusa desligar ou apagar a última pessoa ativa da
coordenação, para ninguém trancar a equipe fora do sistema.

### Duas áreas: coordenação e bolsista

Uma rota só, `/gestao`, com o que cada um vê decidido pelo papel. "Coordenação" aqui é o
papel do projeto em `gestao.papel_membro`, **não** o `admin` do produto (decisão da
spec 002): quem administra a plataforma pública não ganha acesso à gestão por isso, e
vice-versa.

| Aba | Coordenação | Bolsista | Entra no módulo |
|---|---|---|---|
| Hoje | pendências da equipe inteira + indicadores do convênio | as próprias pendências e as próximas aulas | M0 |
| Equipe | membros, papéis, desligamento, bolsas | — | M0 |
| Melhorias | fila de triagem com prazo de resposta | pedir melhoria, acompanhar as próprias, ver o que foi aceito | M8 |
| Turmas | todas | só as turmas em que está alocado | M1 |
| Agenda | todos os encontros, alocação | a própria agenda e a disponibilidade | M2 |
| Atividades | de todos | lançar as próprias | M2 |
| Relatórios | aprovar ou devolver | o próprio relatório do mês | M5 |
| Financeiro | tudo | os próprios pagamentos; abrir pedido de compra | M4 |
| Avaliações | todas | as das próprias turmas | M7 |

A aba só aparece quando o módulo existe. Nada de aba "em breve": aba vazia ensina a
equipe a não clicar.

---

## Módulos

Cada módulo lista modelo, telas e aceite. O aceite é o que vai para a spec. Estimativas
estão na tabela final.

### Módulo 0 — Fundação: equipe, bolsas e permissões (spec 003)

**Por quê primeiro:** todos os outros dependem de saber quem é bolsista, com qual
carga contratada, e de uma RLS que não deixe bolsista apagar dado alheio.

Modelo:

```sql
create table gestao.bolsa (
  id uuid primary key default gen_random_uuid(),
  bolsista_id uuid not null references gestao.papel_membro (user_profile_id) on delete restrict,
  modalidade text not null check (modalidade in ('graduacao','mestrado','bdcti','critt','outra')),
  carga_semanal_horas numeric(4,1) not null check (carga_semanal_horas > 0 and carga_semanal_horas <= 40),
  valor_mensal numeric(10,2) not null check (valor_mensal >= 0),
  inicio date not null,
  fim date not null check (fim >= inicio),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  criado_por uuid references auth.users (id) on delete set null
);

alter table gestao.papel_membro add column if not exists desligado_em timestamptz;
```

`user_profile` não é legível pela coordenação (V4), então a tela de equipe usa duas
funções `security definer` que recusam quem não é coordenação ativa:
`gestao.buscar_usuario_por_email(p_email text)` (igualdade exata, sem prefixo, para não
virar enumeração de contas) e `gestao.equipe()` (membros com nome, e-mail, papel,
desligamento e bolsa vigente).

Telas:

- `/gestao/equipe`: coordenação lista os membros, concede papel (busca por e-mail
  exato), desliga ou reativa, e cadastra a bolsa de cada bolsista. Hoje o vínculo só
  entra por SQL.
- `app/gestao/layout.tsx`: navegação por abas conforme a tabela "Duas áreas", só com as
  abas dos módulos que existem.
- `/gestao` (Hoje): passa de seis cartões de indicador para "o que tenho que fazer".
  No M0 entram o que já é derivável: próximas aulas, encontros passados sem aula
  lançada, bolsistas sem bolsa vigente (coordenação) e melhorias esperando resposta
  (M8). Diários, termos, relatório, pagamentos e compras entram com seus módulos. Os
  seis indicadores continuam, só para a coordenação. Cada item é um link.

O primeiro membro da coordenação entra por SQL, uma vez, com aprovação do Rafael; a
partir dele, tudo pela tela.

Aceite:

- [ ] Bolsista autenticado tenta apagar escola, aluno ou presença de turma em que não
      está alocado → a operação é recusada pela RLS (teste em PGlite).
- [ ] Bolsista vê apenas turmas, encontros e presenças das turmas em que está alocado.
- [ ] Coordenação concede papel de bolsista a um usuário existente e cadastra a bolsa
      pela tela, sem SQL.
- [ ] Revogar o papel de quem tem alocação registrada é recusado com mensagem clara
      (`on delete restrict` já existente).
- [ ] Bolsista desligado perde o acesso na hora, e a alocação e a autoria dele
      continuam no histórico.
- [ ] Desligar ou apagar a última pessoa ativa da coordenação é recusado pelo banco.
- [ ] Bolsista não encontra ninguém pela busca por e-mail nem lê a lista da equipe.

### Módulo 1 — Turmas: a pasta vira página (spec 004)

Substitui pasta por turma, planilha de presença, planilha de termos e a planilha de
KPI alimentada no fim.

Modelo:

```sql
create table gestao.turma (
  id uuid primary key default gen_random_uuid(),
  escola_id uuid not null references gestao.escola (id) on delete restrict,
  reserva_id uuid references gestao.reserva (id) on delete set null,
  nome text not null,                 -- ex.: "EE Fulano · Lego · 2026/2"
  modalidade text not null,           -- Lego, Python, Scratch... (lista a confirmar)
  serie text,
  inicio date not null,
  fim date,
  status text not null default 'planejada'
    check (status in ('planejada','em_andamento','encerrada','cancelada')),
  professor_escola_nome text,         -- contato da escola, recebe a avaliação final
  professor_escola_email text,
  encerrada_em timestamptz,
  encerrada_por uuid references auth.users (id) on delete set null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  criado_por uuid references auth.users (id) on delete set null
);

create table gestao.turma_aluno (
  id uuid primary key default gen_random_uuid(),
  turma_id uuid not null references gestao.turma (id) on delete cascade,
  aluno_id uuid not null references gestao.aluno (id) on delete cascade,
  termo_status text not null default 'pendente' check (termo_status in ('pendente','arquivado')),
  termo_conferido_por uuid references auth.users (id) on delete set null,
  termo_conferido_em timestamptz,
  certificado_entregue_em date,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (turma_id, aluno_id)
);

-- Encontro = agenda. Passa a pertencer à turma e a ter horário somável.
alter table gestao.agenda
  add column if not exists turma_id uuid references gestao.turma (id) on delete cascade,
  add column if not exists inicio time,
  add column if not exists fim time,
  add constraint agenda_fim_depois_inicio check (fim is null or inicio is null or fim > inicio);
-- `horario text` fica como legado: deixa de ser escrito e é removido após a importação.
```

A presença continua pendurada em `gestao.aula` (`unique (aula_id, aluno_id)`). Lançar a
chamada de um encontro cria a `aula` dele com `realizada_em` na mesma transação, então
"encontro com chamada" e "aula realizada" ficam sendo a mesma coisa.

KPI por turma em `gestao.v_kpi_turma` (`security_invoker = true`):

| KPI | Derivação |
|---|---|
| alunos matriculados | `count(turma_aluno)` |
| encontros previstos / realizados | `count(agenda)` / aulas com `realizada_em` |
| horas-aula | `sum(fim - inicio)` dos encontros realizados |
| frequência média | presenças `presente = true` / (alunos × aulas realizadas) |
| elegíveis a certificado | alunos com frequência ≥ 75% (`// ponytail:` limiar fixo até a coordenação definir) |
| certificados entregues | `count(certificado_entregue_em is not null)` |
| termos arquivados / pendentes | `turma_aluno.termo_status` |
| diários preenchidos | respostas de diário / aulas realizadas (módulo 3) |
| NPS da turma | módulo 7 |

O indicador 3 da spec 002 (termos) passa a ler `turma_aluno`; `reserva_termo` fica só
para o histórico importado.

Telas:

- `/gestao/turmas`: lista com filtro por status, escola, modalidade e semestre.
- `/gestao/turmas/nova`: cria a turma a partir de uma reserva confirmada, ou do zero.
- `/gestao/turmas/[id]`: abas **Alunos** (matrícula, colar lista de nomes, termo por
  aluno), **Encontros** (datas e horários, bolsistas alocados), **Chamada**, **Diários**,
  **KPI**.
- `/gestao/turmas/[id]/chamada/[encontro]`: celular. Lista de alunos com um toque
  presente/ausente, "todos presentes" como padrão. Meta: lançar chamada de 30 alunos
  em menos de um minuto.
- `/gestao/turmas/[id]/lista-presenca`: versão para imprimir e colher assinatura na
  escola (substitui a planilha de presença e a `lista_enviada` montada à mão). CSS de
  impressão, sem gerar arquivo.
- **Encerrar turma:** lista as pendências (encontro sem chamada, diário faltando, termo
  pendente). Pendência não bloqueia; a coordenação encerra mesmo assim e o KPI mostra
  o buraco. Encerrar grava `encerrada_em/por` e libera o convite da avaliação final.

Importação: planilha de presença e planilha de termos de cada turma em andamento;
planilha de KPI das turmas já encerradas (entram como turmas encerradas com seus
alunos e presenças, quando a planilha tiver esse detalhe).

Aceite:

- [ ] Coordenação cria turma, matricula 30 alunos colando nomes e agenda os encontros,
      sem abrir planilha.
- [ ] Bolsista alocado lança a chamada de um encontro pelo celular; bolsista não
      alocado nem vê a turma.
- [ ] Ao encerrar, a página da turma mostra alunos, horas-aula, frequência média,
      elegíveis a certificado, certificados entregues e termos pendentes, todos
      derivados por query e sem planilha de KPI.
- [ ] A lista de presença impressa sai com cabeçalho da escola e da turma e os nomes
      matriculados.
- [ ] Um membro sem alocação na turma lê zero linhas de `v_kpi_turma` para ela (prova
      de `security_invoker`).

### Módulo 2 — Disponibilidade, alocação e carga horária (spec 006)

Modelo:

```sql
create table gestao.disponibilidade (
  id uuid primary key default gen_random_uuid(),
  bolsista_id uuid not null references gestao.papel_membro (user_profile_id) on delete cascade,
  dia_semana smallint check (dia_semana between 0 and 6),  -- recorrente
  data date,                                               -- exceção pontual (prova, viagem)
  inicio time not null,
  fim time not null check (fim > inicio),
  disponivel boolean not null default true,
  vigente_de date not null default current_date,
  vigente_ate date,
  check ((dia_semana is null) <> (data is null))
);

-- Trabalho fora de sala: preparação, reunião, capacitação, desenvolvimento...
create table gestao.atividade (
  id uuid primary key default gen_random_uuid(),
  bolsista_id uuid not null references gestao.papel_membro (user_profile_id) on delete cascade,
  data date not null,
  minutos integer not null check (minutos > 0 and minutos <= 720),
  tipo text not null check (tipo in ('preparacao','reuniao','capacitacao','desenvolvimento',
                                     'pesquisa','evento','compra','outra')),
  descricao text not null,
  evidencia_url text,
  turma_id uuid references gestao.turma (id) on delete set null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
```

Alocação continua em `gestao.agenda_bolsista`. A coluna `carga text` deixa de ser
escrita: a carga de um encontro é `agenda.fim - agenda.inicio`. A escrita passa pela
função `gestao.alocar_bolsista(p_agenda, p_bolsista, p_forcar boolean default false)`
(`security invoker`):

- **choque de horário** com outro encontro do mesmo bolsista → recusa sempre;
- **fora da disponibilidade** ou **acima da carga semanal** da bolsa → recusa, a menos
  que a coordenação passe `p_forcar = true`. O motivo fica na auditoria.

Carga mensal em `gestao.v_carga_mensal` (`security_invoker`): por bolsista e mês,
horas em aula, horas em outras atividades, total, horas contratadas
(`carga_semanal_horas × dias da vigência no mês ÷ 7`) e saldo.

Telas:

- `/gestao/agenda`: semana e mês com todos os encontros; filtro por bolsista, escola e
  turma. Alocar é clicar no encontro e escolher bolsistas numa lista colorida:
  disponível, indisponível ou em choque.
- `/gestao/equipe/[bolsista]/disponibilidade`: grade semanal de toque; exceções por data.
  O próprio bolsista mantém a sua.
- `/gestao/atividades`: o bolsista lança o trabalho fora de sala (data, tempo, tipo,
  descrição, link de evidência). É a matéria-prima do relatório mensal.
- `/gestao/equipe/carga`: coordenação vê contratado × realizado × saldo por bolsista no
  mês, com destaque para quem está abaixo ou acima.

Aceite:

- [ ] Alocar um bolsista em dois encontros que se sobrepõem é recusado, com o conflito
      nomeado.
- [ ] Alocar fora da disponibilidade mostra aviso; a coordenação pode confirmar mesmo
      assim.
- [ ] A carga do mês soma aulas alocadas e atividades lançadas e bate com um cálculo
      manual sobre uma fixture (teste de migration).
- [ ] O bolsista edita a própria disponibilidade e não consegue editar a de outro.

### Módulo 3 — Diário de bordo com perguntas prontas (spec 005)

Preenchido pelo bolsista ao final de **cada** aula: intercorrências, desenvolvimento da
turma, participação do professor da escola. Usa o mesmo mecanismo de questionário da
avaliação final (módulo 7); por isso vem antes dela.

Modelo (questionário como dado, resposta tipada):

```sql
create table gestao.questionario (
  id uuid primary key default gen_random_uuid(),
  codigo text not null check (codigo in ('diario_bordo','avaliacao_final')),
  versao integer not null,
  titulo text not null,
  ativo boolean not null default false,
  unique (codigo, versao)
);
create unique index questionario_um_ativo on gestao.questionario (codigo) where ativo;

create table gestao.pergunta (
  id uuid primary key default gen_random_uuid(),
  questionario_id uuid not null references gestao.questionario (id) on delete restrict,
  ordem integer not null,
  enunciado text not null,
  tipo text not null check (tipo in ('sim_nao','escala_1_5','nps_0_10',
                                     'opcao_unica','opcoes_multiplas','texto')),
  opcoes text[],
  obrigatoria boolean not null default true,
  mostrar_se_pergunta uuid references gestao.pergunta (id),  -- condicional simples
  mostrar_se_valor text,
  unique (questionario_id, ordem)
);

create table gestao.resposta (
  id uuid primary key default gen_random_uuid(),
  questionario_id uuid not null references gestao.questionario (id) on delete restrict,
  agenda_id uuid references gestao.agenda (id) on delete cascade,   -- diário: por encontro
  turma_id uuid references gestao.turma (id) on delete cascade,     -- avaliação: por turma
  respondente uuid references auth.users (id) on delete set null,   -- nulo na avaliação por token
  enviada_em timestamptz not null default now(),
  check ((agenda_id is null) <> (turma_id is null))
);
create unique index resposta_um_diario_por_encontro on gestao.resposta (agenda_id)
  where agenda_id is not null;

create table gestao.resposta_item (
  resposta_id uuid not null references gestao.resposta (id) on delete cascade,
  pergunta_id uuid not null references gestao.pergunta (id) on delete restrict,
  valor_numero numeric,
  valor_texto text,
  valor_opcoes text[],
  primary key (resposta_id, pergunta_id)
);
```

Regras:

- **Pergunta respondida é imutável.** Trigger recusa `update` de `enunciado/tipo/opcoes`
  quando já existe `resposta_item`. Mudar pergunta = nova versão do questionário. Sem
  isso a média de "engajamento" de março passa a medir outra pergunta.
- Envio por `gestao.enviar_diario(p_agenda uuid, p_itens jsonb)` (`security invoker`):
  valida tipo e obrigatoriedade de cada item e grava resposta e itens na mesma transação.
- Um diário por encontro. Qualquer bolsista alocado preenche; o autor edita por 48 h
  e depois só a coordenação.
- As perguntas nascem por migration (seed versionado). **Sem editor de perguntas na
  v1** (ver "Não feito de propósito").

Perguntas iniciais (rascunho para a coordenação validar):

| # | Pergunta | Tipo |
|---|---|---|
| 1 | A aula aconteceu como planejado? | sim/não |
| 1a | ↳ Se não: o que mudou? | texto |
| 2 | Houve alguma intercorrência? | sim/não |
| 2a | ↳ Qual tipo? (estrutura/equipamento, transporte/atraso, comportamento, saúde, falta de material, outra) | opções múltiplas |
| 2b | ↳ Descreva o que aconteceu e como foi resolvido | texto |
| 3 | Como foi o engajamento da turma? | escala 1–5 |
| 4 | A turma atingiu o objetivo da aula? (sim, em parte, não) | opção única |
| 5 | Como foi o desenvolvimento da turma hoje? | texto |
| 6 | Como foi a participação do professor da escola? | escala 1–5 |
| 7 | Faltou ou quebrou algum material/kit? | sim/não |
| 7a | ↳ O quê? | texto |
| 8 | Observações para a próxima aula | texto, opcional |

Texto de apoio fixo no formulário: **não escrever diagnóstico, dado de saúde nem
situação familiar com nome de aluno**. Relatar o fato e a providência.

Telas:

- Card "Diário pendente" na tela Hoje, aberto no fim do horário do encontro.
- `/gestao/turmas/[id]/diario/[encontro]`: celular, uma pergunta por bloco, condicionais
  abrindo na hora.
- `/gestao/diarios` (coordenação): linha do tempo com filtro por turma, escola, período e
  "só com intercorrência"; engajamento médio por turma ao longo do tempo. Resposta 7
  ("faltou material") tem atalho para abrir uma solicitação de compra (módulo 4).

Aceite:

- [ ] Bolsista alocado envia o diário de um encontro em menos de três minutos pelo
      celular; não alocado recebe recusa.
- [ ] Segundo diário para o mesmo encontro é recusado.
- [ ] Editar o enunciado de pergunta já respondida é recusado pelo banco.
- [ ] A coordenação filtra todas as intercorrências do semestre em uma tela.
- [ ] Engajamento médio por turma sai por query sobre `resposta_item.valor_numero`.

### Módulo 4 — Financeiro: bolsas, compras, orçamento e categorias (spec 007)

Modelo:

```sql
create table gestao.pagamento_bolsa (
  id uuid primary key default gen_random_uuid(),
  bolsa_id uuid not null references gestao.bolsa (id) on delete restrict,
  competencia date not null check (extract(day from competencia) = 1),
  valor numeric(10,2) not null check (valor >= 0),
  status text not null default 'previsto' check (status in ('previsto','pago','cancelado')),
  pago_em date,
  observacao text,
  unique (bolsa_id, competencia),
  check (status <> 'pago' or pago_em is not null)
);
-- "Atrasado" não é status gravado: é `previsto` com a competência vencida além do prazo
-- (prazo a confirmar com a coordenação). Cadastrar a bolsa gera as linhas `previsto`
-- da vigência inteira.

create table gestao.categoria_gasto (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  rubrica text,                 -- rubrica do convênio, quando a coordenação informar
  ativa boolean not null default true
);

create table gestao.orcamento (
  id uuid primary key default gen_random_uuid(),
  categoria_id uuid not null references gestao.categoria_gasto (id) on delete restrict,
  periodo_inicio date not null,
  periodo_fim date not null check (periodo_fim >= periodo_inicio),
  valor_previsto numeric(12,2) not null check (valor_previsto >= 0),
  unique (categoria_id, periodo_inicio)
);

create table gestao.compra (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descricao text,
  categoria_id uuid not null references gestao.categoria_gasto (id) on delete restrict,
  solicitante uuid references auth.users (id) on delete set null,
  status text not null default 'aberta' check (status in
    ('aberta','cotando','enviada_fadepe','aprovada','comprada','recebida','cancelada')),
  processo_fadepe text,
  fornecedor text,
  valor_final numeric(12,2),
  comprada_em date,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  criado_por uuid references auth.users (id) on delete set null
);

create table gestao.cotacao (
  id uuid primary key default gen_random_uuid(),
  compra_id uuid not null references gestao.compra (id) on delete cascade,
  fornecedor text not null,
  valor numeric(12,2) not null check (valor >= 0),
  validade date,
  documento_path text,          -- objeto no bucket privado
  escolhida boolean not null default false
);
create unique index cotacao_uma_escolhida on gestao.cotacao (compra_id) where escolhida;
```

Documentos (cotação em PDF, nota fiscal) vão para um bucket **privado** do Supabase
Storage, `gestao-documentos`, com policy em `storage.objects` que exige
`gestao.usuario_com_papel('coordenacao')`. Link de download assinado e de curta duração.
Nunca o upload de atividades documentado em `docs/supabase.md#storage`, que devolve URL
pública.

Gasto por categoria em `gestao.v_gasto_categoria` (`security_invoker`): por categoria e
período, **orçado**, **comprometido** (compras enviadas/aprovadas), **executado**
(compradas/recebidas) e **saldo**. As bolsas pagas entram como a categoria "Bolsas",
somadas de `pagamento_bolsa`, porque são a maior parte do gasto do projeto.

Telas:

- `/gestao/financeiro/bolsas`: grade bolsista × mês com pago, previsto, atrasado e
  cancelado; marcar como pago em lote; a coluna do mês mostra se o relatório daquele
  bolsista foi aprovado (módulo 5).
- `/gestao/financeiro/compras`: qualquer membro **abre uma solicitação** ("abrir
  orçamento"); a coordenação registra cotações, escolhe uma e avança o status. Aviso
  (não bloqueio) ao enviar para a Fadepe com menos de três cotações.
- `/gestao/financeiro/orcamento`: orçado × comprometido × executado × saldo por
  categoria, com filtro por período e status e exportação CSV (gerada no servidor, sem
  dependência).

Importação: planilha de pagamentos de bolsa e planilha de compras.

Aceite:

- [ ] Cadastrar uma bolsa de 12 meses gera 12 competências `previsto`; marcar pago exige
      data.
- [ ] A coordenação vê, em uma tela, o que foi pago e o que falta pagar por bolsista e
      por mês.
- [ ] Bolsista vê só os próprios pagamentos e não lê compras de outros.
- [ ] O filtro por categoria e período mostra orçado, comprometido, executado e saldo,
      e o total bate com a soma das compras da fixture.
- [ ] Documento de cotação só abre para a coordenação; o link expira.

### Módulo 5 — Relatório automático de atividades (spec 008)

Depende dos módulos 1 e 2. O relatório **não é digitado**: nasce das aulas alocadas e
realizadas e das atividades lançadas no mês.

Modelo:

```sql
create table gestao.relatorio_mensal (
  id uuid primary key default gen_random_uuid(),
  bolsista_id uuid not null references gestao.papel_membro (user_profile_id) on delete restrict,
  competencia date not null check (extract(day from competencia) = 1),
  status text not null default 'rascunho'
    check (status in ('rascunho','enviado','devolvido','aprovado')),
  linhas jsonb,                 -- congeladas no envio; nulas enquanto rascunho
  enviado_em timestamptz,
  aprovado_em timestamptz,
  aprovado_por uuid references auth.users (id) on delete set null,
  comentario_coordenacao text,
  unique (bolsista_id, competencia)
);
```

Montagem das linhas (`lib/api/gestao/relatorio.ts#montarLinhasRelatorio`): uma linha
por dia e atividade, no formato do formulário atual (`Atividade - Projeto`, data
`DD/MM`, link de comprovação ou vazio). A aula vira `Aula - <modalidade> - <escola>`;
a atividade vira `<tipo> - <descrição>`. Linguagem não técnica, sem ponto final. É a
regra que já vale para o relatório feito à mão.

Fluxo: rascunho (vivo, recalculado) → **enviar** congela as linhas em `linhas` → a
coordenação aprova ou devolve com comentário → aprovado libera o pagamento na grade do
módulo 4. Congelar é o que impede uma edição posterior de mudar um relatório já aceito.

Saída: `/gestao/relatorios/[competencia]/imprimir` reproduz o formulário oficial em
página sóbria, sem identidade visual, e "Salvar como PDF" no navegador. Sem geração de
`.docx` na v1 (decisão D6).

Lembrete: função `gestao.gerar_lembretes()` agendada no **pg_cron** do próprio
Supabase, que grava notificação no sino do Academy nos dias 20 e 25 para quem está com
rascunho, e no dia seguinte a cada encontro sem diário. Isso respeita o veto a
`createServiceRoleClient()` no módulo. O lembrete por e-mail fica de fora (ver "Não
feito de propósito"). Antes da spec, conferir duas coisas no projeto real: se o pg_cron
está habilitado e se o papel que executa o job atravessa a RLS **forçada** do
`gestao.*` (`force row level security` vale até para o dono da tabela). Se não
atravessar, a função tem de ser `security definer` de um papel com `bypassrls`, com
o motivo registrado na migration.

Aceite:

- [ ] Um bolsista com 8 aulas e 6 atividades no mês abre o relatório e encontra as 14
      linhas sem digitar nada.
- [ ] Depois de enviado, editar uma atividade do mês não altera o relatório enviado.
- [ ] A coordenação aprova ou devolve com comentário; o bolsista vê o status.
- [ ] A página impressa tem período, nome, tabela e bloco de assinatura do formulário.
- [ ] O rascunho parado no dia 20 gera notificação (teste da função em PGlite).

### Módulo 6 — Histórico detalhado de alteração dos módulos (spec 010)

Independente de todos os outros. Pode ser feito em paralelo por outra pessoa.

"Módulos" aqui = cursos, módulos e aulas da plataforma (decisão D3). Hoje
`removeModule` apaga as aulas e depois o módulo sem deixar rastro.

Modelo (no `public`, porque audita tabelas do `public`):

```sql
create table public.historico_conteudo (
  id bigint generated always as identity primary key,
  tabela text not null check (tabela in ('course','course_module','lesson')),
  registro_id uuid not null,
  curso_id uuid,
  acao text not null check (acao in ('insert','update','delete')),
  autor uuid,
  ocorrido_em timestamptz not null default now(),
  antes jsonb,
  depois jsonb,
  campos_alterados text[]
);
```

- Trigger `after insert or update or delete` em `course`, `course_module` e `lesson`,
  função `security definer` com `search_path` fixo. Grava `to_jsonb(old)` e
  `to_jsonb(new)` inteiros e calcula `campos_alterados` comparando chave a chave. Não
  depende de saber as colunas, o que importa porque o schema do `public` nasceu no
  dashboard (ADR 008). Update que não muda nada além de carimbo de tempo não gera linha.
- Append-only com o mesmo par de triggers da auditoria do `gestao`.
- RLS de leitura: admin lê tudo; professor lê o histórico dos cursos em que é
  `owner_id`. Ninguém escreve direto; só a trigger.

Tela: aba **Histórico** em `components/dashboard/CourseManagement/courseDetail.tsx`.
Linha do tempo em português: "Maria alterou o título do módulo *Sensores* de 'X' para
'Y' · 23/09 14:02"; exclusão mostra o conteúdo apagado. Filtro por módulo, autor e
período.

Aceite:

- [ ] Renomear um módulo gera uma linha com autor, antes, depois e `campos_alterados =
      {title}`.
- [ ] Excluir um módulo com três aulas gera quatro linhas com o conteúdo apagado
      recuperável na tela.
- [ ] Professor não lê o histórico de curso alheio; admin lê todos.
- [ ] Nem admin consegue alterar ou apagar uma linha do histórico.

### Módulo 7 — Avaliação final pelo professor da escola, NPS (spec 009)

Depende do módulo 3 (motor de questionário) e do encerramento de turma (módulo 1).

Modelo:

```sql
create table gestao.convite_avaliacao (
  id uuid primary key default gen_random_uuid(),
  turma_id uuid not null references gestao.turma (id) on delete cascade,
  token_hash bytea not null unique,          -- sha256 do token; o token em si não é guardado
  destinatario_nome text,
  expira_em timestamptz not null,
  respondido_em timestamptz,
  criado_em timestamptz not null default now(),
  criado_por uuid references auth.users (id) on delete set null
);
```

- Ao encerrar a turma, a coordenação gera o convite: token de 32 bytes aleatórios
  (`crypto.randomBytes`, base64url), mostrado uma vez como link para copiar e mandar à
  escola. Gerar de novo invalida o anterior. Validade de 30 dias e uma resposta por
  convite.
- Página pública `/avaliacao/[token]`: `/avaliacao` entra em `PUBLIC_PATH_PREFIXES` e a
  autorização é o token, conferido pelo banco. Duas funções `security definer` com
  `grant execute` a `anon` e **nada mais** exposto:
  - `public.gestao_avaliacao_contexto(p_token text)` → nome da turma, escola, período e
    perguntas ativas; nada de aluno.
  - `public.gestao_avaliacao_responder(p_token text, p_itens jsonb)` → valida o token
    (existe, não expirou, não respondido), valida os itens, grava resposta e itens e
    marca `respondido_em`, tudo numa transação.
- Página com a identidade do Minds no registro institucional (branco dominante, roxo
  em bloco, Louis George Cafe, barra FACC/UFJF + Governo de MG no rodapé), porque é a
  única tela do módulo que alguém de fora vê.

Perguntas iniciais (rascunho):

| # | Pergunta | Tipo |
|---|---|---|
| 1 | De 0 a 10, quanto você recomendaria o Minds of the Future a outro professor ou escola? | NPS 0–10 |
| 2 | O que mais pesou na sua nota? | texto |
| 3 | Os alunos mostraram mais interesse por ciência e tecnologia depois do projeto? | escala 1–5 |
| 4 | A organização (agenda, transporte, comunicação) atendeu a escola? | escala 1–5 |
| 5 | A equipe de bolsistas estava preparada e foi atenciosa? | escala 1–5 |
| 6 | A escola gostaria de receber o projeto de novo? (sim, talvez, não) | opção única |
| 7 | O que podemos melhorar? | texto, opcional |

NPS = % de notas 9–10 − % de notas 0–6, por turma, escola, semestre e total, em
`gestao.v_nps` (`security_invoker`). A tela de avaliações mostra o número, a
distribuição e os comentários.

Aceite:

- [ ] O professor abre o link sem login, responde e vê a confirmação; o mesmo link
      recusa uma segunda resposta.
- [ ] Token expirado, inventado ou revogado mostra "link inválido ou expirado" e não
      revela nada da turma.
- [ ] Anônimo não lê nenhuma tabela `gestao.*` por fora das duas funções (teste em
      PGlite).
- [ ] NPS por turma e geral bate com o cálculo manual sobre a fixture.

### Módulo 8 — Solicitar melhoria (spec 011)

Pedido do Rafael em 23/09/2026: um lugar dentro da área do bolsista para pedir melhoria
— no sistema, nas aulas e no material, no processo do projeto — e ver o que aconteceu
com o pedido. Aproveita o estudo `portal-de-ideias.md` e as duas perguntas que ele deixou
como bloqueio:

- **GitHub Discussions (opção B) foi descartado:** bolsista não tem, nem precisa ter,
  conta no GitHub, e o pedido pertence à área do bolsista. Registrado aqui como decisão.
- **Dono da triagem e prazo de resposta** viram dado e tela, não promessa: toda
  solicitação tem prazo de 14 dias para a primeira resposta, e a fila da coordenação
  mostra as atrasadas no topo. O nome de quem tria é a decisão D9; ela não bloqueia o
  código, bloqueia ligar a aba para a equipe.

Modelo (duas tabelas; comentário ficou de fora de propósito):

```sql
create table gestao.melhoria (
  id uuid primary key default gen_random_uuid(),
  autor uuid not null references gestao.papel_membro (user_profile_id) on delete restrict,
  titulo text not null check (char_length(titulo) between 3 and 120),
  area text not null check (area in ('plataforma','gestao','aulas_material','processo','outra')),
  problema text not null check (char_length(problema) between 10 and 2000),
  proposta text not null check (char_length(proposta) between 3 and 2000),
  quem_sofre text check (char_length(quem_sofre) <= 500),
  status text not null default 'nova'
    check (status in ('nova','em_analise','aceita','recusada','duplicada','entregue')),
  resposta text check (char_length(resposta) <= 2000),
  duplicada_de uuid references gestao.melhoria (id) on delete set null,
  link_execucao text check (link_execucao ~ '^https?://'),
  respondida_em timestamptz,          -- primeira resposta; o prazo de 14 dias mede até aqui
  respondida_por uuid references auth.users (id) on delete set null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  check (status not in ('recusada','duplicada') or char_length(btrim(resposta)) >= 10),
  check (status <> 'duplicada' or duplicada_de is not null),
  check (duplicada_de is null or duplicada_de <> id)
);

create table gestao.melhoria_apoio (
  melhoria_id uuid not null references gestao.melhoria (id) on delete cascade,
  user_profile_id uuid not null references gestao.papel_membro (user_profile_id) on delete cascade,
  criado_em timestamptz not null default now(),
  primary key (melhoria_id, user_profile_id)
);
```

Regras (no banco, não na tela):

- Autor vem de `auth.uid()` e nasce `nova`; o cliente não escolhe autor nem status.
- O autor edita ou retira o próprio pedido enquanto ele está `nova`. Depois disso o
  texto fica como foi escrito.
- Só a coordenação muda status e resposta. Transições: `nova` → `em_analise` | `aceita`
  | `recusada` | `duplicada`; `em_analise` → `aceita` | `recusada` | `duplicada`;
  `aceita` → `entregue`. Qualquer outra é recusada pelo banco.
- **Recusada e duplicada exigem motivo escrito.** É a regra que separa isto de uma
  caixa de sugestão.
- Pedido aceito guarda o link de onde a execução acontece (card do Trello, issue).
  Este módulo registra a decisão; não vira um segundo quadro de tarefas.
- "Atrasada" não é coluna: é `nova` com `criado_em` há mais de 14 dias.
- Apoio ("preciso disso também") é sinal, não voto que decide. Ninguém apoia o próprio
  pedido.
- Aviso no sino, gravado por trigger `security definer` (a RLS de `notification` não
  deixa um usuário escrever para outro, V9): pedido novo avisa a coordenação ativa;
  mudança de status avisa o autor, com o motivo.

Quem lê: todo membro ativo lê todos os pedidos e os apoios — ver o que já foi pedido
evita duplicata e mostra que o canal responde. Texto fixo no formulário: **o espaço é
para melhoria do projeto e do sistema; questão de conduta ou sobre uma pessoa vai
direto à coordenação, fora daqui.**

Telas:

- `/gestao/melhorias`: formulário curto no topo (título, sobre o quê, qual o problema,
  o que você propõe, quem sofre com isso hoje) e a lista com filtro por status e área.
  Para a coordenação a lista abre ordenada pela fila: atrasadas, depois novas mais
  antigas.
- `/gestao/melhorias/[id]`: o pedido, os apoios, a resposta. O autor edita enquanto
  `nova`; a coordenação responde (status, motivo, pedido original quando duplicada,
  link da execução quando aceita).
- Tela Hoje: coordenação vê quantas esperam resposta e quantas estão atrasadas; o
  bolsista vê os próprios pedidos respondidos nos últimos 7 dias.

Aceite:

- [ ] Bolsista abre um pedido em menos de um minuto e acompanha o status sem perguntar
      a ninguém.
- [ ] Recusar ou marcar como duplicada sem motivo é recusado pelo banco.
- [ ] Bolsista não muda status nem resposta, nem o texto de pedido alheio.
- [ ] Autor não edita o pedido depois que a coordenação o analisou.
- [ ] Mudança de status gera aviso no sino do autor; pedido novo gera aviso para a
      coordenação ativa.
- [ ] Pedido parado há mais de 14 dias aparece como atrasado, derivado por data.
- [ ] Usuário sem papel no projeto e membro desligado não leem nem criam pedidos.

---

## Ordem e dependências

```
M0 Fundação ──┬─► M1 Turmas ──┬─► M3 Diário ──► M7 Avaliação NPS
              │               └─► M2 Alocação/carga ──► M5 Relatório mensal
              ├─► M4 Financeiro (usa a bolsa do M0; mostra o relatório do M5 quando existir)
              └─► M8 Solicitar melhoria (só precisa da equipe e das abas do M0)
M6 Histórico de módulos: independente, em paralelo desde o início
```

Ordem proposta pelo tamanho da dor, que é diária ou por turma antes da mensal:
**M0 → M8 → M1 → M3 → M2 → M4 → M5 → M7**, com M6 em paralelo. O M8 sobe para logo
depois do M0 porque é pequeno, não depende de planilha nenhuma e é o primeiro motivo
para o bolsista entrar no sistema. O `/gestao` só é ligado em produção para bolsistas
depois de M0 + M8 + M1 + M3 (primeira entrega utilizável: pedido de melhoria, turma,
chamada e diário). Até lá só a coordenação usa.

Cada módulo, na ordem:

1. `specs/NNN-slug.md` (copiada de `specs/TEMPLATE.md`) aprovada.
2. Branch `feat/<slug>` a partir de `development`, spec no primeiro commit.
3. RED: teste de migration em PGlite (RLS por papel e alocação, `security_invoker`,
   imutabilidades) + um teste unitário por cálculo (frequência, carga, NPS, montagem do
   relatório, conflito de alocação).
4. Migration `supabase/migrations/2026MMDD_gestao_<slug>.sql`, idempotente.
5. `lib/api/gestao/<modulo>.ts` + `app/gestao/<modulo>/**` + importador do legado.
6. `npm run lint` e `npm test -- --run --coverage` (thresholds 60/50/60/60) → PR para
   `development`.
7. **Aplicar a migration em produção só com aprovação explícita do Rafael** (banco
   compartilhado com o resto da equipe), depois conferir RLS no banco real como foi
   feito na spec 002.
8. Importar a planilha, marcar o original como "SOMENTE LEITURA — migrado para o
   sistema em DD/MM" e arquivar. **Só aqui o módulo está pronto.**

## Arquivos previstos

| Módulo | Migration | `lib/api/gestao/` | `app/gestao/` | Testes |
|---|---|---|---|---|
| M0 | `*_gestao_fundacao.sql` | `equipe.ts`, `validacao.ts`, `pendencias.ts` | `layout.tsx`, `page.tsx` (reescrita), `equipe/**` | `tests/integration/gestao-fundacao-migration.test.ts`, `tests/unit/lib/api/gestao/equipe.test.ts` |
| M1 | `*_gestao_turmas.sql` | `turmas.ts`, `importar.ts` | `turmas/**` | `gestao-turmas-migration.test.ts`, `turmas.test.ts` |
| M2 | `*_gestao_alocacao.sql` | `alocacao.ts`, `atividades.ts` | `agenda/**`, `atividades/**`, `equipe/[id]/disponibilidade/**` | `gestao-alocacao-migration.test.ts`, `alocacao.test.ts` |
| M3 | `*_gestao_questionario_diario.sql` | `questionarios.ts`, `diario.ts` | `turmas/[id]/diario/**`, `diarios/**` | `gestao-questionario-migration.test.ts`, `diario.test.ts` |
| M4 | `*_gestao_financeiro.sql` | `financeiro.ts` | `financeiro/**` | `gestao-financeiro-migration.test.ts`, `financeiro.test.ts` |
| M5 | `*_gestao_relatorio_mensal.sql` | `relatorio.ts` | `relatorios/**` | `gestao-relatorio-migration.test.ts`, `relatorio.test.ts` |
| M6 | `*_historico_conteudo.sql` | — (`lib/api/content-history.ts`, cliente do navegador como `courses.ts`) | — (`components/dashboard/CourseManagement/HistoryTab.tsx`, `courseDetail.tsx`) | `historico-conteudo-migration.test.ts`, `content-history.test.ts` |
| M7 | `*_gestao_avaliacao.sql` | `avaliacao.ts` | `avaliacoes/**`; pública em `app/avaliacao/[token]/**` | `gestao-avaliacao-migration.test.ts`, `avaliacao.test.ts`, `lib/supabase/middleware` (novo prefixo) |
| M8 | `*_gestao_melhorias.sql` | `melhorias.ts` | `melhorias/**` | `gestao-melhorias-migration.test.ts`, `melhorias.test.ts` |

Também mudam: `lib/api/gestao/indicators.ts` (termos passam a ler `turma_aluno`),
`lib/api/gestao/types.ts`, `lib/supabase/middleware.ts` (só `/avaliacao`),
`tests/integration/gestao-migration.test.ts` (nova divisão da RLS),
`docs/plans/README.md` (índice).

## Decisões abertas

Nenhuma bloqueia M0. Cada uma bloqueia só a spec indicada.

| # | Decisão | Recomendação | Bloqueia |
|---|---|---|---|
| D1 | Termo assinado: guardar só o status (como hoje) ou também o arquivo escaneado? "Nada fora do sistema" pede o arquivo; a minimização da spec 002 pede só o status | Arquivo no bucket privado, só coordenação lê, prazo de retenção definido pela coordenação. Exige emenda da spec 002. Entra depois do status, sem retrabalho | M1 (parte do arquivo) |
| D2 | CPF do bolsista para o relatório e a Fadepe | Tabela separada `gestao.bolsista_dados_pessoais`, só CPF, lida pelo dono e pela coordenação. Dado bancário nunca | M5 |
| D3 | "Módulos" do histórico = módulos dos cursos da plataforma ou planos de aula do projeto? | Módulos dos cursos (é o que existe no sistema) | M6 |
| D4 | Lista oficial de categorias de gasto e rubricas do convênio | Pedir à coordenação/Fadepe. Semente provisória: Bolsas, Kits e material de robótica, Transporte, Alimentação, Software e assinaturas, Domínio e hospedagem, Divulgação, Eventos, Outros | M4 |
| D5 | Certificado de participação: critério de frequência e se o sistema emite o PDF | v1 só mostra elegíveis e marca entregue; emitir PDF com código de validação é spec própria depois | — |
| D6 | O relatório mensal precisa sair em `.docx` ou o PDF impresso serve à coordenação e à Fadepe? | PDF impresso. `.docx` só se a Fadepe exigir arquivo editável | M5 |
| D7 | Perguntas do diário e da avaliação final | Validar os rascunhos acima com a coordenação antes da spec | M3, M7 |
| D8 | Formulário oficial de prestação de contas (bloqueador nº 1 do plano-pai, ainda pendente) | Não bloqueia estes módulos; define a exportação final do M4 | exportação do M4 |
| D9 | Quem tria os pedidos de melhoria e se o prazo de 14 dias serve | Uma pessoa nomeada da coordenação, olhando a fila uma vez por semana. Sem nome, a aba não é mostrada à equipe: canal sem resposta perde a credibilidade em dois meses | ligar o M8 para os bolsistas |
| D10 | Expor o schema `gestao` na API do Supabase (V6) | Adicionar `gestao` em "Exposed schemas" nas configurações da API. É mudança em produção: só com aprovação do Rafael, junto com a primeira migration aplicada | ligar a flag em produção |

## Riscos

| Risco | Severidade | Mitigação |
|---|---|---|
| A equipe continua na planilha porque a tela é mais lenta | **alta** | Chamada em menos de 1 min e diário em menos de 3 min no celular; importação do legado; planilha marcada somente leitura na virada |
| Texto livre do diário registra saúde ou comportamento de aluno menor com nome (dado sensível, LGPD) | **alta** | Aviso fixo no formulário; leitura só da coordenação e dos alocados; texto livre nunca exportado; auditoria não copia conteúdo |
| RLS atual deixa bolsista apagar dado de qualquer turma | **alta** | M0 corrige antes de o bolsista entrar |
| View de KPI sem `security_invoker` vaza dado de aluno | **alta** | Opção obrigatória + um teste por view |
| Link público da avaliação vira porta para o schema | média | Token com hash, validade, resposta única; só duas funções expostas a `anon`; teste em PGlite |
| Duas fontes durante a transição (planilha e sistema) | média | Data de virada por planilha, registrada no card do módulo |
| Migration em banco de produção compartilhado | média | Aplicação manual com aprovação explícita; conferência de RLS no banco real depois |
| Schema do `public` diferente do que o código supõe (ADR 008) | média | Trigger do histórico usa `to_jsonb`, sem depender de colunas |
| Volume: 182–251 h com bolsista de 20 h/semana | média | Entregar por módulo; primeira entrega útil (M0+M8+M1+M3) em ~82–109 h |
| Sucessão: autor sai e ninguém opera | média | Itens de sucessão do plano-pai continuam valendo; RUNBOOK ganha seção do `/gestao` |
| Pedido de melhoria sem resposta vira cemitério e o canal perde a credibilidade | **alta** | Dono nomeado (D9), prazo de 14 dias visível na fila, atrasadas no topo, aviso no sino a cada mudança |
| Pedido de melhoria usado para falar de pessoa ou conduta | média | Texto fixo no formulário; o canal é de projeto e sistema; conduta vai direto à coordenação |
| Ex-bolsista continua com acesso porque a revogação é recusada (V5) | **alta** | Desligamento com `desligado_em` no M0; acesso cai na hora, histórico fica |
| Flag ligada com o schema `gestao` fora da API (V6) | média | D10 antes de ligar; sem isso a tela quebra, mas não vaza nada |

## Estimativa

| Frente | Horas |
|---|---|
| M0 Fundação (equipe, bolsa, RLS, desligamento, navegação, tela Hoje) | 18–24 |
| M8 Solicitar melhoria (pedido, triagem, apoio, aviso no sino) | 14–20 |
| M1 Turmas (cadastro, matrícula, chamada, termos, lista impressa, encerramento, KPI, importação) | 30–40 |
| M3 Diário de bordo + motor de questionário | 20–25 |
| M2 Disponibilidade, alocação e carga horária | 25–35 |
| M4 Financeiro (bolsas, compras, cotações, orçamento, documentos, exportação) | 30–40 |
| M5 Relatório mensal automático + lembretes | 15–22 |
| M7 Avaliação final NPS | 12–18 |
| M6 Histórico de módulos | 8–12 |
| Importação das planilhas e virada (dividida entre os módulos) | 10–15 |
| **Total** | **182–251** |

Faixa, não compromisso. A importação é a parte mais incerta: depende de quão limpas
estão as planilhas atuais.

## Bloqueadores antes da primeira linha de código

1. **Inventário das planilhas atuais.** Para cada planilha (presença, termos, KPI,
   pagamentos, compras, disponibilidade), as colunas reais e uma amostra anonimizada. É
   o que define os importadores e confirma os campos acima. Levantar requer acesso ao
   Drive do projeto.
2. ~~**Estado do `gestao.*` em produção**~~ — resolvido na validação (V7): tabelas
   vazias, flag sem uso real. `agenda.horario` e `agenda_bolsista.carga` convertem direto.
3. **Aprovação da spec 003 (M0)**, que inclui a nova divisão da RLS.
4. **Schema `gestao` exposto na API do Supabase** (V6, D10) antes de ligar a flag em
   produção. Não bloqueia código nem teste; bloqueia o uso.

## Não feito de propósito

- **Sincronização com Google Drive/Sheets.** O objetivo é sair deles; a importação é
  única, por planilha, e depois a planilha morre.
- **Editor de perguntas na tela.** As perguntas mudam poucas vezes por ano; mudar por
  migration versionada mantém as respostas comparáveis. Reabrir se a coordenação
  precisar mudar perguntas mais de uma vez por semestre.
- **Lembrete por e-mail.** Exigiria rodar o envio sem usuário autenticado, que é o
  caminho vetado no módulo. Notificação no sino resolve a v1. Reabrir se, após dois
  meses, mais de 20% dos relatórios chegarem atrasados.
- **Geração de `.docx`.** O PDF impresso resolve, salvo exigência da Fadepe (D6).
- **Emissão de certificado de participação.** A v1 mostra elegíveis e entregues; a
  emissão com código de validação é spec própria (D5).
- **Restaurar módulo a partir do histórico com um clique.** A v1 mostra o conteúdo
  apagado para refazer à mão. Reabrir no primeiro caso real de perda.
- **Diff na auditoria do `gestao`.** Copiar nome de aluno menor para um log append-only
  impede apagar o dado quando pedido. A auditoria continua registrando quem, quando e
  o quê, sem conteúdo.
- **Portal com login para o professor da escola.** Um link por turma basta.
- **Dado bancário, assinatura digital de termo, app nativo, WhatsApp, fila de jobs.**
  Fora de escopo, pelos mesmos motivos do plano-pai.
- **Fotos das turmas.** São material de divulgação e continuam no acervo de marketing;
  não são dado de gestão.
- **Comentários e discussão nos pedidos de melhoria.** A resposta da coordenação e o
  apoio bastam; conversa longa volta para a reunião. Reabrir se mais de um terço dos
  pedidos precisar de ida e volta para ser entendido.
- **Anexo em pedido de melhoria.** O upload que existe devolve URL pública
  (`docs/supabase.md#storage`); link colado no texto resolve.
- **Pedido anônimo e ranking por apoio.** Em equipe deste tamanho o anonimato é ilusão
  e tira de cena quem precisa detalhar a ideia; apoio é sinal, a decisão é humana e
  escrita.
- **Pedido de melhoria por aluno ou professor da escola.** O canal é interno; abrir
  para menor de idade traz moderação e LGPD, outra categoria de problema.
