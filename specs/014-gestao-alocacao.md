# 014 — Gestão: alocação de bolsistas nos encontros

Status: aprovada (coordenação, 09/10/2026: decisões do Aberto abaixo)
Constituição: `specs/constitution.md`

Levantamento de origem: `docs/plans/levantamento-alocacao.md` (SP12).
Plano-pai: `docs/plans/sistema-interno-gestao.md#escopo-e-ordem-de-construção`, etapa 3.

## Problema

A coordenação monta a alocação de bolsistas de cabeça e publica no WhatsApp, que é o
único registro: ninguém sabe quantas horas cada bolsista fez no mês, em qual escola e
turma, nem o que mudou depois que a mensagem saiu. A prestação de contas precisa disso e
hoje não tem de onde tirar.

## Escopo

A coordenação passa a fazer no sistema o que hoje faz na mensagem, sem perder nenhum
caso que o WhatsApp acomoda.

- **Turma.** Cadastrar a turma com escola, atividade (Lego, IA, Educação Financeira…),
  período previsto e situação: prevista, em andamento, encerrada ou **não abriu**.
  Turma que não abriu continua visível com o que foi previsto para ela.
- **Encontro.** Cada linha da mensagem de hoje vira um encontro: data, início, fim,
  atividade e turma. Início e fim são obrigatórios ao lançar, inclusive em tarefa. Encontro sem turma é permitido para tarefa de apoio e evento
  (organizar caixas, apresentação, competição), com descrição livre.
- **Alocar.** Escolher os bolsistas de um encontro. Ao criar um encontro da turma, a
  equipe do último encontro dela vem preenchida e pode ser trocada.
- **Alocação parcial.** Registrar que o bolsista cumpre só parte do encontro (chega às
  14h, sai mais cedo) e quem cobre o intervalo.
- **O que aconteceu.** Depois da data, cada alocação fica como prevista e pode ser
  marcada como: cumprida, faltou avisando, faltou sem avisar ou substituída por outra
  pessoa. A substituição aloca o substituto e mantém o registro de quem saiu.
- **Afastamento.** Registrar que um bolsista está afastado de uma data a outra, com
  motivo. O sistema lista os encontros dele nesse período para a coordenação
  substituir, um a um.
- **Encerrar, nunca apagar.** Encerrar a turma, cancelar um encontro ou retirar um
  bolsista guarda quem, quando e o motivo. O passado continua contando para a carga
  e para a prestação de contas.
- **Carga do mês.** Horas por bolsista no mês, contando só o que foi cumprido, com
  a quebra por escola e turma. Troca de escola no meio do mês aparece dividida, porque
  a conta é encontro a encontro. O equilíbrio é medido só em horas (decisão de
  09/10/2026).
- **Histórico.** Toda mudança em turma, encontro e alocação mostra quem alterou,
  quando e o valor antes e depois.
- **Visão de calendário** dos encontros do mês, com os bolsistas de cada um.

**Fora de escopo:**
- Disponibilidade do bolsista, grade da faculdade e piso de 20 h — próxima spec. O aviso
  de choque entre encontros entrou depois (decisão 6).
- Bolsista ver ou confirmar a própria alocação; nesta spec só a coordenação usa.
- Alunos, chamada, diário e indicadores por turma (M1 e M3 do plano de gestão).
- Relatório mensal do bolsista (etapa 4).
- Publicar a alocação no WhatsApp a partir do sistema.
- Qualquer dado sensível: CPF, dado bancário, documento digitalizado. Afastamento
  guarda motivo em texto curto, sem atestado.

## Critérios de aceite

- [ ] **Validação com o real:** as 12 linhas das duas amostras do levantamento
      (21/09 a 08/10) são lançadas inteiras, sem anotação fora do sistema, e a carga de cada bolsista no período bate com a tabela do
      levantamento. Se algum caso não couber, o modelo volta para a prancheta antes
      do relatório mensal.
- [ ] Dado um encontro de 13h às 17h, quando B4 é alocado das 14h às 17h e B2 cobre
      das 13h às 14h, então B4 soma 3 h e o encontro mostra que B2 cobriu. B2 já estava
      no encontro inteiro, então continua com 4 h nele (na amostra real, ela está na equipe).
- [ ] Dado um bolsista com encontros em duas escolas no mesmo mês, quando a
      coordenação abre a carga do mês, então vê o total e a divisão por escola.
- [ ] Dado um bolsista que troca de turma no dia 15, quando a coordenação o retira dos
      encontros a partir do dia 15 e aloca outra pessoa, então os encontros até o dia
      14 continuam contando para ele e os seguintes para a substituta.
- [ ] Dado um afastamento de 10 a 20/10, quando é registrado, então a coordenação vê
      os encontros do bolsista nesse período, substitui cada um, e as horas vão para
      quem substituiu.
- [ ] Dada uma turma que não abriu, quando é marcada assim, então os encontros
      previstos dela deixam de contar carga e continuam visíveis como previstos.
- [ ] Dado um bolsista que faltou sem avisar, quando a coordenação marca a falta, então
      o encontro aparece com um bolsista a menos e a hora não conta para ele.
- [ ] Dada qualquer mudança, quando a coordenação abre o histórico do encontro, então
      vê quem alterou, quando e o valor antes e depois.
- [ ] Encerrar ou cancelar não apaga: o registro anterior continua consultável e na
      carga do período em que valeu.
- [ ] Sem permissão: bolsista e quem não é da equipe não veem a tela de alocação, e o
      banco recusa a escrita mesmo chamada direto.

## Plano

- **Degrau da escada:** `gestao.agenda` virou o encontro (ganhou `inicio`/`fim` como
  `time`, `turma_id` e cancelamento) e `gestao.agenda_bolsista` virou a alocação (ganhou
  intervalo parcial, `situacao`, `coberto_por` e `motivo`). `horario` e `carga` continuam
  como texto, agora escritos pelo banco, para a tela "Hoje" e o indicador 6 não mudarem.
  A turma é a do M1 só com o que esta spec usa. Formulários reaproveitam `Aviso` e os
  estilos de `app/gestao/equipe/forms.tsx`. Nenhuma dependência nova.
- **Dados:** `supabase/migrations/20261009_gestao_alocacao.sql` + correção `20261009_gestao_alocacao_coberto_sem_fk.sql` (a chave de `coberto_por` deixava ambíguo o embed do indicador 6) — `gestao.turma`,
  `gestao.afastamento`, colunas novas em `agenda` e `agenda_bolsista`, função
  `substituir_alocacao`, view `v_carga` (`security_invoker`), `antes`/`depois` em
  `registro_auditoria`.
- **Autorização:** cliente SSR (`server.ts#createClient`), RLS `coordenacao_tudo` nas
  tabelas novas; telas com `exigirMembro(..., "coordenacao")` no layout e na página;
  ações com `ensureGestaoMember()`. Ninguém recebe `delete` em turma, encontro, alocação
  ou afastamento. A auditoria passou a ser escrita só pelo banco (trigger `security
  definer`, `authenticated` perdeu o insert direto): antes, qualquer membro podia
  inserir uma linha de histórico inventada.
- **Arquivos:** `lib/api/gestao/alocacao.ts`, `types.ts`, `validacao.ts`, `index.ts`,
  `pendencias.ts` (encontro cancelado sai de "Hoje"); `app/gestao/alocacao/**`
  (`layout`, calendário, `[id]`, `turmas`, `carga`, `actions`, `forms`, `rotulos`);
  `app/gestao/abas.ts`; `app/gestao/equipe/forms.tsx` (exporta `Aviso` e estilos).
- **Atalhos:** `v_carga` decide "passado" pela data do servidor (UTC);
  `equipesRecentes` olha os 300 encontros mais recentes.

## Tarefas

- [x] Migration + teste em PGlite com as duas amostras reais do levantamento —
      `tests/integration/gestao-alocacao-migration.test.ts`
- [x] Consulta, soma da carga e histórico — `lib/api/gestao/alocacao.ts`
- [x] Teste: divisão da carga por escola e turma, diferença do histórico, validações —
      `tests/unit/lib/api/gestao/alocacao.test.ts`
- [x] Telas: calendário, encontro, turmas e escolas, carga e afastamentos
- [x] Migration aplicada em produção em 09/10/2026 (`gestao_alocacao`), a pedido da coordenação
- [ ] Lançar outubro pela tela (validação real do card)

## Limites conhecidos

- O indicador 6 da tela "Hoje" ainda conta toda alocação, inclusive falta e
  substituição. Passar a ler `v_carga` é trabalho da etapa 5 (painel).
- Apagar uma escola ainda apaga em cascata os encontros dela (regra da spec 002). A
  turma trava a exclusão (`restrict`), então só escola sem turma é afetada.

## Decisões (09/10/2026)

1. **A turma entra aqui**, mínima: escola, atividade, período e situação. O M1 completa
   com alunos e chamada.
2. **Alocação por encontro**, com a equipe da turma só como preenchimento automático.
3. **Encontro passado sem marcação conta como cumprido.** A coordenação só marca exceção.
4. **Fim obrigatório ao lançar**, inclusive em tarefa de apoio. Na validação com o real,
   "organizar as caixas" (05/10) é lançada com o fim que a coordenação informar.
5. **Encontro sem turma não exige escola** (pedido da coordenação, 09/10/2026): tarefa,
   reunião ou evento podem ficar "fora de escola". Migration
   `20261009_gestao_agenda_sem_escola.sql`, aplicada em produção no mesmo dia.
6. **Aviso de horário sobreposto ao lançar** (pedido da coordenação, 09/10/2026): se
   alguém da equipe já está em outro encontro que se sobrepõe no mesmo dia, uma janela
   mostra quem e qual encontro, com "Revisar" ou "Lançar mesmo assim". É aviso, não
   trava. Encostar não conta (sair às 12h e entrar às 12h); vale o horário parcial;
   substituído, retirado, encontro cancelado e turma que não abriu ficam de fora. Por
   enquanto só no "Lançar encontro"; alocar alguém num encontro já lançado não avisa.
7. **Turma e escola se editam, não se apagam** (coordenação, 09/10/2026). Apagar foi
   pedido e desistido no mesmo dia, em favor de editar: cadastro errado se corrige, e
   turma fora de uso é encerrada ou marcada como "não abriu". Na turma editam-se nome,
   atividade e período; a escola não muda, porque os encontros já lançados guardam a
   escola da turma. Na escola, nome, rede e cidade.
8. **Substituto vem de fora do encontro** (coordenação, 09/10/2026). Quem já está no
   encontro não aparece em "Substituir por" nem em "Acrescentar pessoa", e o banco
   recusa com mensagem clara. Cobrir parte do horário de alguém continua sendo o "quem
   cobriu" da alocação parcial, que lista todo mundo. Uma primeira versão
   (`20261009_gestao_substituir_quem_ja_esta.sql`) fez o contrário por leitura errada
   do pedido; `20261009_gestao_substituto_de_fora.sql` a corrige. As duas aplicadas em
   produção, nessa ordem.
9. **Remover alguém do encontro** (coordenação, 09/10/2026). "Remover do encontro" apaga
   a alocação, com confirmação; a pessoa pode ser acrescentada de novo. O histórico do
   encontro mostra "removeu do encontro", com quem e quando, porque a auditoria guarda a
   linha inteira e o histórico passou a buscar pelo encontro, não pelas alocações de
   hoje. Remover quem entrou como substituto desfaz a substituição: quem tinha saído
   volta a "prevista". Encontro, turma e afastamento continuam sem apagar. Migration
   `20261009_gestao_remover_do_encontro.sql`, aplicada em produção.
10. **Concluir encontro** (coordenação, 09/10/2026). "Concluir encontro", à direita do título do encontro, confirma que ele
    aconteceu: quem está "prevista" passa a "cumprida" (falta, substituição e retirada
    ficam), o encontro fica verde no calendário e sai da pendência "Aula sem registro"
    da tela "Hoje". Só depois da hora de início (horário de Brasília), nunca cancelado; concluído não se
    cancela sem "Reabrir encontro" antes. Migration
    `20261009_gestao_concluir_encontro.sql` + `20261009_gestao_concluir_depois_do_inicio.sql`, aplicadas em produção.
