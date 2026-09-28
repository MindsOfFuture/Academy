# 012 — Gestão: a mesma pessoa na coordenação e como bolsista

Status: aprovada — pedido direto do Rafael em 28/09/2026 ("a pessoa pode fazer parte da
coordenação e ser bolsista ao mesmo tempo"). Revisão final no PR.
Constituição: `specs/constitution.md`

## Problema

Hoje cada pessoa da equipe tem um papel só. Quem coordena o projeto e também recebe bolsa
(caso real da equipe atual) precisa escolher: como coordenação, não pode ter bolsa
cadastrada pela tela e a carga das aulas que dá não entra no indicador de carga dos
bolsistas; como bolsista, perde a coordenação. Tentar dar o segundo papel responde "esta
pessoa já faz parte da equipe".

## Escopo

- Uma pessoa da equipe pode ter o papel de coordenação, o de bolsista ou os dois ao mesmo
  tempo.
- Ao adicionar alguém, a coordenação escolhe bolsista, coordenação ou os dois. Se a pessoa
  já está na equipe, o papel escolhido é somado ao que ela já tem, em vez de dar erro.
- Na tela de equipe, cada pessoa mostra todos os papéis que tem, e a coordenação pode dar
  ou tirar cada papel separadamente. Tirar o único papel que sobrou não é permitido: para
  tirar o acesso, continua valendo "Desligar".
- Quem é coordenação e bolsista usa a gestão com a visão da coordenação, e como bolsista
  pode ter bolsa cadastrada, aparece na pendência de "sem bolsa vigente" e tem a carga das
  próprias aulas contada no indicador do convênio.
- Continua proibido deixar o projeto sem ninguém ativo na coordenação, inclusive tirando o
  papel de coordenação de quem também é bolsista.
- Quem já está na equipe mantém o papel que tem hoje.

**Fora de escopo:** papéis além de coordenação e bolsista; mostrar à pessoa com os dois
papéis os avisos de "seu pedido foi respondido" na tela Hoje (o aviso continua chegando
no sino).

## Critérios de aceite

- [ ] Dada uma pessoa que já é da coordenação, quando a coordenação lhe dá também o papel
      de bolsista, então ela passa a ter os dois, continua vendo a gestão como
      coordenação e pode ter bolsa cadastrada.
- [ ] Dada uma pessoa com os dois papéis alocada numa aula, quando a coordenação abre os
      indicadores, então a carga dessa aula entra na carga dos bolsistas.
- [ ] Dada uma pessoa que já tem o papel pedido, quando a coordenação tenta dá-lo de novo,
      então o sistema avisa que ela já tem esse papel e nada muda.
- [ ] Dada uma pessoa com um papel só, quando a coordenação tenta tirá-lo, então o sistema
      recusa e sugere "Desligar".
- [ ] Dada a única pessoa ativa da coordenação, também bolsista, quando alguém tenta
      tirar-lhe a coordenação, então o sistema recusa com mensagem clara; havendo outra
      pessoa na coordenação, ela sai da coordenação e continua entrando como bolsista.
- [ ] Dado quem já estava na equipe antes da mudança, quando a mudança entra no ar, então
      cada pessoa continua com o mesmo papel e o mesmo acesso.
- [ ] Sem permissão: bolsista não dá nem tira papel de ninguém.

## Plano

- **Degrau da escada:** reusa a tabela de vínculo da spec 002/003, a checagem
  `gestao.usuario_com_papel(text)`, a trigger que protege a última coordenação, as funções
  `gestao.equipe()` e `gestao.buscar_usuario_por_email()` e o harness PGlite das specs 003 e
  011. Nenhuma biblioteca nova.
- **Arquivos:**
  - `specs/012-gestao-papeis-acumulados.md`
  - `supabase/migrations/20260928_gestao_papeis_acumulados.sql`
  - `tests/integration/gestao-papeis-migration.test.ts`
  - `lib/api/gestao/types.ts`, `lib/api/gestao/equipe.ts`, `lib/api/gestao/indicators.ts`,
    `lib/api/gestao/pendencias.ts`, `lib/api/gestao/validacao.ts`
  - `app/gestao/equipe/actions.ts`, `app/gestao/equipe/forms.tsx`, `app/gestao/equipe/page.tsx`
  - `tests/unit/lib/api/gestao/equipe.test.ts`, `tests/unit/lib/api/gestao/indicators.test.ts`,
    `tests/unit/lib/api/gestao/validacao.test.ts`, `tests/unit/app/gestao/equipe-page.test.tsx`
  - `docs/plans/gestao-dia-a-dia.md` (uma frase na seção "Duas áreas")
- **Dados** (migration idempotente, só `gestao.*` e a função pública já existente):
  - `gestao.papel_membro` troca `papel text` por `coordenacao boolean` e `bolsista boolean`,
    com check "ao menos um". Preenchimento a partir de `papel` com as triggers da tabela
    desligadas só durante a cópia: é mudança de estrutura, não ação de alguém da equipe,
    e a auditoria exige um usuário autenticado.
  - Uma linha por pessoa continua: as chaves estrangeiras de bolsa, alocação e melhorias
    não mudam, e o desligamento continua valendo para a pessoa inteira.
  - `gestao.usuario_com_papel(text)` lê a coluna do papel pedido.
  - `public.gestao_membro_papel()` mantém a assinatura e devolve o papel efetivo:
    `coordenacao` quando a pessoa tem os dois. O guard e as telas não mudam.
  - `gestao.proteger_ultima_coordenacao()` passa a olhar a coluna `coordenacao`.
  - `gestao.equipe()` e `gestao.buscar_usuario_por_email()` devolvem os dois papéis
    (drop + create, porque muda o tipo de retorno), com os mesmos grants.
  - `gestao.melhoria_avisar()` avisa quem tem coordenação ativa.
  - Indicador 6 filtra a alocação por `papel_membro.bolsista = true`.
- **Autorização:** sem mudança. Actions de equipe continuam exigindo coordenação antes de
  delegar a `lib/api/gestao`; a RLS de `papel_membro` continua só da coordenação.
- **Dependência nova:** nenhuma.
- **Atalhos:** nenhum.

## Tarefas

- [ ] RED/GREEN em PGlite: papel antigo preservado; pessoa com os dois papéis é
      coordenação para acesso e bolsista para bolsa e indicador; papel repetido não
      duplica; zero papel recusado; última coordenação protegida mesmo sendo bolsista;
      migration roda duas vezes — `tests/integration/gestao-papeis-migration.test.ts`
- [ ] Migration — `supabase/migrations/20260928_gestao_papeis_acumulados.sql`
- [ ] Equipe, indicador e pendências — `lib/api/gestao/*.ts`
- [ ] Tela de equipe — `app/gestao/equipe/*`
- [ ] `npm run lint`, `npm test -- --run --coverage`, `npx tsc --noEmit`, `npm run build`

## Aberto

Aplicar a migration em produção depende de aprovação do Rafael. Código e migration entram
no ar juntos: um sem o outro quebra a tela de equipe e os indicadores.
