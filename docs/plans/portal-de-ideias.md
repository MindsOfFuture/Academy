# Portal de ideias interno — estudo de viabilidade

Status: **proposta, não aprovada**. Nada implementado. Documento para discussão
com a coordenação e decisão posterior.

Escopo avaliado: canal único para a equipe interna e os bolsistas do Minds of the
Future registrarem ideias de melhoria do projeto e do produto, com **triagem pela
coordenação** até virar decisão. Público fechado: quem submete tem conta no
Academy e vínculo com o projeto. Aluno e professor **não** entram neste escopo.

Contexto: `docs/plans/sistema-interno-gestao.md` · Decisões: `docs/decisions.md`
001, 002, 005, 008, 013, 014.

---

## Veredito

**Viável, e é o menor módulo interno de todos** — mas só vale a pena se for
construído **dentro do `/gestao`**, não como sistema próprio.

O custo técnico é baixo (uma tabela, dois estados, uma tela). O custo real é
outro: portal de ideias é o tipo de sistema que **morre por falta de resposta**,
não por falta de código. Se a coordenação não fechar o ciclo, em dois meses o
backlog vira cemitério e o time volta pro WhatsApp.

Recomendação: **não construir isolado**. Ou entra como submódulo do sistema
interno de gestão, ou não entra.

## Pré-condição de gente, não de código

Antes de qualquer linha, alguém precisa assumir dois compromissos nominais:

1. **Um dono da triagem** — pessoa, não papel. Revisa a fila em cadência fixa.
2. **SLA de resposta declarado** — toda ideia recebe veredito em até N dias
   (sugestão: 14). "Recusada com motivo" é resposta; silêncio não é.

Se esses dois não existirem no dia do go, o projeto **não deve começar**. Esta é
a única seção deste documento que é bloqueio absoluto — o resto é engenharia.

## Onde o módulo vive

| Opção | Acoplamento | Esforço | Veredito |
|---|---|---|---|
| **A — `/gestao/ideias`, schema `gestao`, mesmo repo** | alto | baixo | **recomendada** |
| B — ferramenta pronta (GitHub Discussions / Issues com label) | nenhum | ~zero | **avaliar antes de A** |
| C — repo e banco próprios | nenhum | alto | descartada |

Decisão recomendada: **avaliar B honestamente; se não servir, A**.

O time já usa GitHub. `Discussions` com categoria "Ideias" entrega submissão,
votação, comentário, busca e notificação por **zero hora de desenvolvimento**.
A única coisa que ele não entrega é acesso para bolsista sem conta GitHub —
e esse é o argumento real a favor de A, não "queremos um portal".

Construir A sem responder essa pergunta é escolher trabalho em vez de resultado.

Se A for adotada, valem os mesmos guardrails do sistema de gestão:

1. **Schema `gestao.*`**, nunca tabela solta no `public`.
2. **RLS própria**. `createServiceRoleClient()` é bloqueio de merge (ADR 002).
3. **Toda query por `lib/api/`** (ADR 005).
4. **Rota fora de `PUBLIC_PATH_PREFIXES`**, atrás de checagem de papel no servidor.
5. **Feature flag** para desligar sem deploy.

## Modelo mínimo

Três tabelas. Resistir a mais.

| Tabela | Papel |
|---|---|
| `gestao.ideia` | título, problema, proposta, autor, status, timestamps |
| `gestao.ideia_voto` | `(ideia_id, user_profile_id)` único — sinal de demanda |
| `gestao.ideia_comentario` | discussão no contexto da ideia |

Campo que **não** entra no MVP: categoria livre, tag, anexo, estimativa,
prioridade numérica, campo de ROI. Todos parecem úteis e nenhum sobrevive ao
terceiro mês — viram formulário longo, e formulário longo mata submissão.

O formulário pede três coisas, nesta ordem: **qual o problema**, **o que você
propõe**, **quem sofre com isso hoje**. Ideia que não descreve um problema não é
ideia, é pedido de funcionalidade.

### Máquina de estados

`nova` → `em análise` → `aceita` | `recusada` | `duplicada`
e `aceita` → `entregue`.

Seis estados, transição só pela coordenação, **motivo obrigatório em `recusada`
e `duplicada`**. Motivo obrigatório é o que separa este sistema de uma caixa de
sugestão — e é a única regra de negócio que não pode ser negociada por pressa.

Nada de "backlog", "em progresso", "priorizada": o portal registra a decisão,
ele **não** é gerenciador de tarefa. Ideia aceita vira issue no GitHub, e a
`ideia` só guarda o link. Duplicar o board de execução aqui é o erro clássico.

## Integração com o Academy

Reaproveita, sem código novo:

- **auth e papel** — bolsista já é usuário; resolver de papel do ADR 003;
- **notificação** — `lib/api/notifications-server.ts` já grava e dispara email;
  avisar o autor a cada mudança de estado é o que sustenta o ciclo;
- **deploy** — mesmo processo Next, mesmo VPS (ADR 014). Custo de infra: zero.

Um papel novo é necessário: `triador` (ou reuso de um papel de coordenação do
`gestao`). Não usar `admin` do Academy para isso — misturar administração do
produto público com governança interna do projeto é como o ADR 002 vira problema.

## Riscos

| Risco | Severidade | Mitigação |
|---|---|---|
| Ninguém tria; backlog vira cemitério e o canal perde credibilidade | **alta** | dono nomeado + SLA declarado como pré-condição de go |
| Construir o que o GitHub Discussions já faz de graça | alta | avaliar a opção B antes de escrever código |
| Virar gerenciador de tarefa paralelo ao GitHub | média | estado só até `aceita`; execução sai daqui |
| Formulário longo derruba a taxa de submissão | média | três campos, sem categoria nem anexo no MVP |
| Voto usado como decisão automática ("mais votada vence") | média | voto é sinal, não mandato; decisão é humana e justificada |
| Ideia crítica sobre pessoa ou gestão registrada em base rastreável | média | escopo declarado é produto/projeto; canal de conduta é outro, e isso vai escrito na tela |
| Bus factor do módulo junto com o resto do `/gestao` | média | herda o bloco de Sucessão de `sistema-interno-gestao.md` |

## Estimativa

Só faz sentido como **incremento** do sistema interno de gestão, com a infra,
o schema e a `lib/api/` já de pé.

| Frente | Horas |
|---|---|
| Schema `gestao.ideia*` + RLS + migration versionada | 6–8 |
| `lib/api/ideias.ts` + route handlers | 8–10 |
| UI de submissão, lista e detalhe | 12–16 |
| Fila de triagem + transições com motivo | 8–10 |
| Notificação nas mudanças de estado | 4–6 |
| Testes (unit + 1 fluxo E2E) | 6–8 |
| **Total** | **44–58** |

Isolado, sem o `/gestao` pronto, some 10–16 h de infra e o número perde o sentido:
seria construir uma casa para uma mesa.

## Bloqueadores antes da primeira linha de código

1. **Dono da triagem nomeado e SLA acordado.** Sem isso, não começar.
2. **Veredito sobre GitHub Discussions.** Decisão explícita, registrada — não
   omissão.
3. **`/gestao` aprovado e com schema de pé.** Este módulo é dependente, não
   fundacional.

## Não feito de propósito

- **Roadmap público / voto de aluno e professor** — escopo é interno. Abrir para
  aluno de escola pública cria moderação de conteúdo de menor de idade, e isso é
  outra categoria de problema (LGPD, conduta).
- **Anexo de arquivo** — Supabase Storage do repo devolve URL pública sem
  sanitização (`docs/supabase.md#storage`). Não vale o risco para um campo
  opcional.
- **Priorização automática por score** — fórmula de RICE/ICE em time de dez
  pessoas é teatro de processo. Decisão humana, justificada por escrito.
- **Anonimato** — em grupo deste tamanho é ilusão, e remove o autor de quem se
  precisa para detalhar a ideia.
- **Fórum/discussão livre** — comentário existe atrelado à ideia. Fórum aberto é
  outro produto, com outro custo de moderação.
