# 003 — Fundação da gestão: equipe, bolsa, desligamento e acesso por papel

Status: aprovada — pedido direto do Rafael em 23/09/2026 para desenvolver o plano
validado (`docs/plans/gestao-dia-a-dia.md`, Módulo 0). Revisão final no PR.
Constituição: `specs/constitution.md`

## Problema

A coordenação do Minds não consegue montar a equipe no sistema de gestão sem pedir SQL a
alguém, e qualquer bolsista que entre hoje pode apagar escola, aluno ou presença de
qualquer turma; quem sai do projeto depois de trabalhar nunca perde o acesso.

## Escopo

- A coordenação vê a equipe do projeto com nome, e-mail, papel, situação e bolsa
  vigente; concede o papel de bolsista ou de coordenação a quem já tem conta,
  encontrando a pessoa pelo e-mail exato.
- A coordenação cadastra a bolsa de cada bolsista: modalidade, carga semanal, valor
  mensal e vigência.
- A coordenação desliga quem saiu: o acesso cai na hora e o que a pessoa fez (aulas,
  alocação, autoria) continua no histórico. Reativar devolve o acesso. Remover de vez
  só vale para quem nunca foi alocado.
- Ninguém consegue desligar ou remover a última pessoa ativa da coordenação.
- O bolsista vê e registra só o que é das aulas em que está alocado; o resto do
  cadastro (escolas de outras turmas, reservas, listas, auditoria) fica com a
  coordenação.
- A área de gestão ganha navegação por abas conforme o papel, e a primeira tela passa a
  mostrar o que cada um tem a fazer, sem perder os indicadores do convênio para a
  coordenação.

**Fora de escopo:** turma, matrícula, chamada e diário (specs 004 e 005); pagamentos
da bolsa (spec 007); qualquer dado pessoal além de nome e e-mail que já existem na
conta — nada de documento, dado bancário ou CPF (decisão D2); liberar o módulo na
API de produção e aplicar a migration, que dependem de aprovação do Rafael (D10).

## Critérios de aceite

- [ ] Dado um bolsista autenticado, quando tenta apagar escola, aluno ou presença de
      uma aula em que não está alocado, então nada é apagado.
- [ ] Dado um bolsista alocado num encontro, quando lista encontros, aulas e presenças,
      então vê só as do encontro dele; os de outros encontros não aparecem.
- [ ] Dado um bolsista, quando tenta ler reservas, listas enviadas, a auditoria, a
      equipe ou buscar alguém pelo e-mail, então não recebe nada.
- [ ] Dada a coordenação, quando procura um e-mail cadastrado e concede o papel, então
      a pessoa passa a entrar na gestão sem SQL; e-mail parcial não encontra ninguém.
- [ ] Dada a coordenação, quando cadastra a bolsa de um bolsista, então a bolsa aparece
      na equipe; carga acima de 40 h, valor negativo ou fim antes do início são recusados.
- [ ] Dado um bolsista desligado, quando tenta abrir a gestão ou ler qualquer dado
      dela, então não tem acesso; a alocação e a autoria dele continuam registradas.
- [ ] Dada a última pessoa ativa da coordenação, quando alguém tenta desligá-la,
      rebaixá-la ou removê-la, então o sistema recusa com mensagem clara.
- [ ] Dado um membro com alocação registrada, quando a coordenação tenta removê-lo de
      vez, então o sistema recusa e sugere desligar.
- [ ] Sem permissão: usuário sem papel no projeto recebe "página não encontrada" em
      qualquer tela da gestão; anônimo vai para o login.

## Plano

- **Degrau da escada:** reusa o schema `gestao` (spec 002), `gestao.usuario_com_papel`,
  `public.gestao_membro_papel`, a auditoria por trigger, `ensureGestaoMember`, a flag
  `GESTAO_ENABLED`, o harness PGlite de `tests/integration/gestao-migration.test.ts`,
  `components/ui/*` e `<form action>` + `useActionState` do React 19. Nenhuma
  biblioteca nova.
- **Arquivos:**
  - `specs/003-gestao-fundacao.md`
  - `supabase/migrations/20260923_gestao_fundacao.sql`
  - `tests/integration/gestao-fundacao-migration.test.ts`
  - `lib/api/gestao/equipe.ts`, `lib/api/gestao/pendencias.ts`, `lib/api/gestao/validacao.ts`
  - `lib/api/gestao/types.ts`, `lib/api/gestao/index.ts`, `lib/api/gestao/auth.ts`
    (papel inclui "desligado" = sem acesso)
  - `app/gestao/layout.tsx` (renderização por requisição), `app/gestao/page.tsx`,
    `app/gestao/nav.tsx`, `app/gestao/abas.ts`, `app/gestao/guard.ts` (guard único
    chamado pelo layout e por cada página)
  - `app/gestao/equipe/page.tsx`, `app/gestao/equipe/actions.ts`,
    `app/gestao/equipe/forms.tsx`
  - `tests/unit/lib/api/gestao/equipe.test.ts`, `tests/unit/lib/api/gestao/validacao.test.ts`,
    `tests/unit/app/gestao/page-auth.test.tsx` (ajuste ao novo layout)
- **Dados** (migration idempotente, só `gestao.*` e a função pública já existente):
  - `gestao.papel_membro.desligado_em timestamptz`.
  - `gestao.usuario_com_papel` e `public.gestao_membro_papel` ignoram vínculo desligado.
  - `gestao.bolsa` como no plano, com `definir_autoria`, `tocar_atualizado_em` e
    auditoria; RLS: coordenação tudo, bolsista lê só a própria.
  - Funções `security definer`, `stable`, `search_path` fixo:
    `gestao.bolsista_na_agenda(p_agenda uuid)`, `gestao.bolsista_na_escola(p_escola uuid)`
    (existe encontro da escola com alocação do chamador),
    `gestao.bolsista_na_aula(p_aula uuid)`.
  - RLS fatiada: as policies `membro_ler_escrever` saem. Coordenação ativa: tudo nas nove
    tabelas. Bolsista ativo: `select` em `escola`/`aluno` da escola em que está alocado;
    `select` em `agenda`, `agenda_bolsista` dos próprios encontros; `select`/`insert`/
    `update` em `aula` e `presenca` dos próprios encontros; nada em `reserva`,
    `reserva_termo`, `lista_enviada`; nenhum `delete`.
  - Trigger em `papel_membro` recusa deixar a coordenação sem ninguém ativo (update de
    papel/desligamento e delete).
  - `gestao.buscar_usuario_por_email(p_email text)` → id, nome, e-mail, papel atual;
    igualdade exata sem diferença de maiúsculas; recusa quem não é coordenação ativa.
  - `gestao.equipe()` → membros com nome, e-mail, papel, desligado_em, bolsa vigente;
    recusa quem não é coordenação ativa.
  - `grant execute` só a `authenticated`; `revoke` de `public`/`anon`.
- **Autorização:** cliente SSR (`server.ts#createClient`) contra RLS; actions chamam
  `ensureGestaoMember()` e, quando a ação é da coordenação, conferem o papel antes de
  delegar a `lib/api/gestao`. Nenhuma rota pública, nada em `PUBLIC_PATH_PREFIXES`,
  nenhum `createServiceRoleClient()`.
- **Dependência nova:** nenhuma.
- **Atalhos:** `// ponytail:` na tela Hoje — pendências só do que já é derivável no M0
  (próximas aulas, encontros passados sem aula lançada, bolsistas sem bolsa vigente);
  cada módulo seguinte acrescenta as suas.

## Tarefas

- [ ] RED/GREEN em PGlite: bolsista não apaga escola; bolsista só lê os próprios
      encontros; desligado perde acesso; última coordenação protegida; remoção com
      alocação recusada; busca por e-mail exata e só para coordenação; migration roda
      duas vezes — `tests/integration/gestao-fundacao-migration.test.ts`
- [ ] Migration — `supabase/migrations/20260923_gestao_fundacao.sql`
- [ ] Equipe, bolsa e pendências — `lib/api/gestao/*.ts`
- [ ] Telas e navegação — `app/gestao/**`
- [ ] Teste: validação de bolsa recusa carga > 40 h e fim < início — `tests/unit/lib/api/gestao/validacao.test.ts`
- [ ] `npm run lint`, `npm test -- --run --coverage`, `npx tsc --noEmit`

## Aberto

Nenhuma decisão bloqueia a implementação. Para ligar em produção: aprovação da
migration pelo Rafael, schema `gestao` exposto na API (D10) e o primeiro membro da
coordenação inserido por SQL uma única vez.
