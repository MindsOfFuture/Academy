# 011 — Solicitar melhoria: pedido dos bolsistas com resposta obrigatória

Status: aprovada — pedido direto do Rafael em 23/09/2026 ("área de solicitar melhoria
para os bolsistas"), detalhado no Módulo 8 de `docs/plans/gestao-dia-a-dia.md`. Revisão
final no PR.
Constituição: `specs/constitution.md`

## Problema

Bolsista que vê algo a melhorar no sistema, nas aulas ou no processo do projeto manda
mensagem no WhatsApp e a sugestão se perde sem resposta; a coordenação não tem uma
fila para decidir, e ninguém sabe o que já foi pedido.

## Escopo

- Todo membro ativo do projeto (bolsista ou coordenação) abre um pedido de melhoria
  respondendo: título, sobre o quê (plataforma, gestão, aulas e material, processo,
  outra), qual o problema, o que propõe e quem sofre com isso hoje.
- O autor acompanha o pedido: nova, em análise, aceita, recusada, duplicada, entregue;
  edita ou retira o pedido enquanto ninguém o analisou.
- Todo membro ativo vê todos os pedidos — para não repetir o que já foi pedido e para
  ver que o canal responde — e pode apoiar o pedido de outra pessoa ("preciso disso
  também"). Apoio é sinal, não decide nada.
- A coordenação tem uma fila ordenada por urgência: pedidos sem resposta há mais de
  14 dias aparecem primeiro como atrasados. Responde mudando o status; recusar ou
  marcar como duplicado exige motivo escrito; duplicado aponta o pedido original;
  aceito pode levar o link de onde a execução é acompanhada.
- O autor recebe aviso no sino a cada mudança de status, com o motivo; a coordenação
  recebe aviso a cada pedido novo.
- A primeira tela da gestão mostra à coordenação quantos pedidos esperam resposta e
  quantos estão atrasados, e ao bolsista os próprios pedidos respondidos na última
  semana.
- O formulário avisa que o espaço é para melhoria do projeto e do sistema; conduta ou
  questão sobre uma pessoa vai direto à coordenação, fora daqui.

**Fora de escopo:** comentários e conversa no pedido; anexo de arquivo; pedido
anônimo; ranking por apoio; pedido por aluno ou professor da escola; transformar o
pedido aceito em quadro de tarefas (a execução segue no Trello/GitHub, só o link fica);
e-mail (o aviso é só no sino).

## Critérios de aceite

- [ ] Dado um bolsista ativo, quando preenche o formulário, então o pedido aparece como
      "nova" com ele como autor, sem ele poder escolher outro autor ou outro status.
- [ ] Dado o autor, quando o pedido ainda é "nova", então consegue editar e retirar; depois
      que a coordenação muda o status, não consegue mais.
- [ ] Dado um bolsista, quando tenta mudar status ou resposta de qualquer pedido, ou o
      texto do pedido de outra pessoa, então nada muda.
- [ ] Dada a coordenação, quando recusa ou marca como duplicado sem motivo (ou duplicado
      sem apontar o original), então o sistema recusa.
- [ ] Dada a coordenação, quando tenta um salto de status fora da ordem (por exemplo,
      de "nova" direto para "entregue", ou reabrir um recusado), então o sistema recusa.
- [ ] Dado um pedido cujo status mudou, quando o autor abre o sino, então vê o aviso com
      o novo status e o motivo; dado um pedido novo, a coordenação ativa vê o aviso.
- [ ] Dado um pedido "nova" criado há mais de 14 dias, quando a coordenação abre a fila,
      então ele aparece como atrasado, no topo.
- [ ] Dado um membro, quando apoia o próprio pedido ou apoia duas vezes o mesmo, então o
      sistema recusa.
- [ ] Sem permissão: usuário sem papel no projeto e membro desligado não leem nem criam
      pedidos, e não veem a aba.

## Plano

- **Degrau da escada:** reusa o schema `gestao`, `papel_membro` com `desligado_em` e as
  funções de papel da spec 003, os triggers de autoria/carimbo/auditoria da spec 002, a
  tabela `public.notification` e o sino que já a lê (`components/notifications/
  notification-bell.tsx`), o layout por abas e a tela Hoje da spec 003. Nenhuma
  biblioteca nova. Depende da branch da spec 003.
- **Arquivos:**
  - `specs/011-gestao-melhorias.md`
  - `supabase/migrations/20260924_gestao_melhorias.sql`
  - `tests/integration/gestao-melhorias-migration.test.ts`
  - `lib/api/gestao/melhorias.ts`, `lib/api/gestao/types.ts`, `lib/api/gestao/index.ts`,
    `lib/api/gestao/pendencias.ts` (contagens na tela Hoje), `lib/api/gestao/validacao.ts`
  - `app/gestao/melhorias/page.tsx`, `app/gestao/melhorias/[id]/page.tsx`,
    `app/gestao/melhorias/actions.ts`, `app/gestao/melhorias/forms.tsx`
  - `app/gestao/nav.tsx` (aba Melhorias), `app/gestao/page.tsx` (cartão na tela Hoje)
  - `lib/api/notifications-server.ts` e `components/notifications/notification-bell.tsx`
    — só o tipo `melhoria_atualizada`/`melhoria_nova` e o ícone
  - `tests/unit/lib/api/gestao/melhorias.test.ts`
- **Dados:** `gestao.melhoria` e `gestao.melhoria_apoio` como no plano. Triggers:
  - `before insert`: `autor := auth.uid()`, `status := 'nova'`, zera resposta/respondida.
  - `before update`: quem não é coordenação ativa só altera título/área/problema/proposta/
    quem_sofre do próprio pedido em `nova`; a coordenação não altera o texto do autor;
    transição de status validada pela tabela do plano; primeira mudança de status grava
    `respondida_em/por`.
  - `after insert/update` `security definer`, `search_path` fixo: grava em
    `public.notification` (canal `in-app`) para a coordenação ativa (pedido novo) ou para
    o autor (mudança de status). Motivo: a RLS de `notification` só aceita
    `user_id = auth.uid()` (validação V9).
  - Auditoria e carimbo pelos triggers existentes do schema.
  - RLS: `select` a membro ativo; `insert` a membro ativo; `update` a coordenação ativa
    ou ao autor em `nova`; `delete` só ao autor em `nova`. `melhoria_apoio`: `select` a
    membro ativo; `insert`/`delete` só da própria linha, nunca no próprio pedido.
  - "Atrasada" é derivada: `status = 'nova' and criado_em < now() - interval '14 days'`.
- **Autorização:** cliente SSR contra RLS; actions chamam `ensureGestaoMember()`.
  Nenhum `createServiceRoleClient()`, nenhuma rota pública.
- **Dependência nova:** nenhuma.
- **Atalhos:** `// ponytail:` prazo fixo de 14 dias até a coordenação definir outro (D9).

## Tarefas

- [ ] RED/GREEN em PGlite: autoria e status forçados no insert; autor edita só em `nova`;
      bolsista não muda status; motivo obrigatório; transição inválida recusada; aviso no
      sino para autor e coordenação; apoio no próprio pedido recusado; desligado sem
      acesso; migration roda duas vezes — `tests/integration/gestao-melhorias-migration.test.ts`
- [ ] Migration — `supabase/migrations/20260924_gestao_melhorias.sql`
- [ ] `lib/api/gestao/melhorias.ts` + telas `app/gestao/melhorias/**`
- [ ] Teste: ordenação da fila põe atrasadas primeiro e mapeia o status em português —
      `tests/unit/lib/api/gestao/melhorias.test.ts`
- [ ] `npm run lint`, `npm test -- --run --coverage`, `npx tsc --noEmit`

## Aberto

D9 — quem tria e se 14 dias serve. Não bloqueia o código; bloqueia mostrar a aba aos
bolsistas em produção.
