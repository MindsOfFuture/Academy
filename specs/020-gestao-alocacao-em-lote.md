# 020 — Gestão: alocação em lote

Status: aprovada (Rafael, 21/10/2026: "a alocação e outras funções devem poder ser
executadas em batch ao invés de 1 por 1")
Constituição: `specs/constitution.md`

## Problema

A coordenação monta o mês encontro por encontro. Uma turma de Lego toda segunda vira
quatro ou cinco lançamentos iguais; pôr uma pessoa em dez encontros são dez páginas;
um afastamento de duas semanas é substituído um encontro de cada vez (a spec 014 deixou
assim de propósito: "substituir, um a um").

## Escopo

- **Repetir toda semana.** Ao lançar um encontro, a coordenação pode dizer "repetir toda
  semana até tal data". Saem todos os encontros de uma vez, com a mesma turma, horário e
  equipe. A conferência de horário sobreposto vale para todas as datas.
- **Escolher vários no calendário.** Um botão liga a seleção: cada encontro do mês ganha
  uma caixa de marcar, e dá para marcar todos os de uma turma de uma vez. Com os
  encontros marcados, a coordenação faz uma ação só:
  - acrescentar uma ou mais pessoas;
  - tirar uma pessoa;
  - trocar uma pessoa por outra (substituição, com motivo);
  - cancelar, com motivo;
  - concluir.
- **Acrescentar várias pessoas** de uma vez na página do encontro.
- **Afastamento:** "substituir todos por" uma pessoa, nos encontros que ainda faltam
  substituir.
- Cada pessoa recebe **um e-mail só** com a lista de encontros, e não um por encontro.

Cada encontro passa pelas mesmas regras de quando é feito um a um. Se um encontro não
couber na ação (já cancelado, já concluído, a pessoa não está nele, ainda não começou),
ele fica de fora e a mensagem diz qual e por quê; os demais seguem.

**Fora de escopo:**
- Desfazer um lote inteiro de uma vez: cada mudança continua no histórico do encontro
  e se corrige por lá.
- Editar data, horário ou atividade de vários encontros: hoje nem um encontro sozinho
  muda de horário pela tela.
- Repetição diferente de semanal (quinzenal, dias alternados).
- Bolsista usar as ações em lote.

## Critérios de aceite

- [ ] Dado um encontro de segunda, 06/10, 13h às 17h, quando a coordenação lança com
      "repetir até 27/10", então aparecem 4 encontros (06, 13, 20 e 27/10) com a mesma
      equipe, e cada pessoa recebe um e-mail com as 4 datas.
- [ ] Repetição com mais de 30 datas ou com o fim antes do início é recusada com
      mensagem clara.
- [ ] Dados 5 encontros marcados, quando a coordenação acrescenta Bia e Caio, então os
      dois entram nos 5; em um encontro em que a Bia já estava, só o Caio entra.
- [ ] Dados encontros marcados com um já cancelado, quando a coordenação cancela todos
      com motivo, então os outros são cancelados e a mensagem diz que um já estava
      cancelado.
- [ ] Dada a troca de Bia por Caio em 4 encontros, então nos 4 a Bia fica como
      substituída por Caio, e as horas vão para o Caio; num encontro em que a Bia já
      cumpriu, nada muda e a mensagem diz por quê.
- [ ] Dado um afastamento com 3 encontros pendentes, quando a coordenação escolhe
      "substituir todos por Caio", então a lista de pendentes fica vazia.
- [ ] Antes de acrescentar ou trocar em lote, quem já está em outro encontro no mesmo
      horário aparece no mesmo aviso de sobreposição do lançamento, e a coordenação
      decide se faz mesmo assim.
- [ ] Sem permissão: bolsista não vê as ações, e o banco recusa a escrita mesmo
      chamada direto (as regras de cada encontro são as mesmas de hoje).

## Plano

- **Degrau da escada:** nada novo no banco. Cada ação em lote chama, encontro por
  encontro, a mesma função que a tela de um encontro já usa (`alocar`,
  `removerAlocacao`, `substituirAlocacao`, `cancelarEncontro`, `concluirEncontro`); a
  RLS e as funções da spec 014 decidem como hoje. O lançamento repetido grava todos os
  encontros num só pedido ao banco e as equipes em outro. Os avisos reaproveitam
  `avisar`, agrupando por pessoa.
- **Sem transação entre encontros:** se um falhar no meio, os anteriores ficam feitos e
  a mensagem lista o que não deu. É o mesmo que acontece quando a coordenação faz um
  por um, e cada encontro continua consistente sozinho.
- **Teto:** 60 encontros por lote e 30 datas por repetição.
- **Arquivos:** `lib/api/gestao/alocacao.ts` (`criarEncontros`, `obterEncontros`,
  `planejarLote`), `lib/api/gestao/validacao.ts` (`datasSemanais`, `validarRepeticao`,
  `validarLote`), `lib/api/gestao/avisos.ts` (`avisarLote`), `lib/api/gestao/types.ts`;
  `app/gestao/alocacao/actions.ts`, `forms.tsx`, `lote.tsx`, `page.tsx`,
  `[id]/page.tsx`, `carga/page.tsx`; testes em `tests/unit/lib/api/gestao/`.
- **Autorização:** igual à spec 014: `exigirCoordenacao()` em toda ação, RLS no banco.
- **Dependência nova:** nenhuma.

## Tarefas

- [x] Datas semanais, validação do lote e plano por encontro (o que entra e o que fica
      de fora) — `tests/unit/lib/api/gestao/lote.test.ts`
- [x] E-mail agrupado por pessoa — `tests/unit/lib/api/gestao/avisos.test.ts`
- [x] Telas: repetir no lançamento, seleção no calendário, várias pessoas no encontro,
      substituir todos no afastamento
