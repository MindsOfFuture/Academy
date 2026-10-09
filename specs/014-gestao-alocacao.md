# 014 — Gestão: alocação de bolsistas nos encontros

Status: rascunho
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
  atividade e turma. Encontro sem turma é permitido para tarefa de apoio e evento
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
- Disponibilidade do bolsista, grade da faculdade, piso de 20 h e aviso de choque de
  horário — próxima spec. Aqui a coordenação aloca como faz hoje, sem checagem.
- Bolsista ver ou confirmar a própria alocação; nesta spec só a coordenação usa.
- Alunos, chamada, diário e indicadores por turma (M1 e M3 do plano de gestão).
- Relatório mensal do bolsista (etapa 4).
- Publicar a alocação no WhatsApp a partir do sistema.
- Qualquer dado sensível: CPF, dado bancário, documento digitalizado. Afastamento
  guarda motivo em texto curto, sem atestado.

## Critérios de aceite

- [ ] **Validação com o real:** as 12 linhas das duas amostras do levantamento
      (21/09 a 08/10) são lançadas inteiras, sem campo inventado e sem anotação fora
      do sistema, e a carga de cada bolsista no período bate com a tabela do
      levantamento. Se algum caso não couber, o modelo volta para a prancheta antes
      do relatório mensal.
- [ ] Dado um encontro de 13h às 17h, quando B4 é alocado das 14h às 17h e B2 cobre
      das 13h às 14h, então B4 soma 3 h e B2 soma 1 h a mais nesse encontro.
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

Só depois da spec aprovada. Esboço para dimensionar:

- **Degrau da escada:** reaproveita `gestao.agenda` (vira o encontro, ganha `inicio`/
  `fim` como `time` e `turma_id`), `gestao.agenda_bolsista` (vira a alocação, ganha
  intervalo parcial e situação) e a auditoria append-only da spec 002. A turma é a do
  M1 (`docs/plans/gestao-dia-a-dia.md`), só com as colunas que esta spec usa; o M1
  acrescenta alunos e chamada depois, sem refazer.
- **Dados:** migration `*_gestao_alocacao.sql` + teste em PGlite (ADR 021).
- **Lacuna da auditoria:** hoje ela grava quem e quando, não o quê. O critério do
  histórico exige guardar antes e depois.

## Aberto

1. **A turma entra aqui.** O M1 (turmas) ainda não foi feito, e sem turma não há
   "turma que não abriu". Proposta: esta spec cria a turma mínima e o M1 completa.
   Isso pesa na estimativa de 14 h.
2. **Alocação por encontro, não por período.** O real é por encontro: cada linha do
   WhatsApp é um encontro com sua equipe. Um vínculo "bolsista na turma de tal a tal
   data" não acomoda a competição de terça com equipe diferente, nem a substituição de
   um encontro só. Proposta: por encontro, com a equipe da turma só como
   preenchimento automático.
3. **Encontro passado sem marcação conta como cumprido?** Se sim, a coordenação só
   marca exceção (menos trabalho, e é o que mantém longe da planilha); se não, a carga
   fica zerada até alguém confirmar tudo.
4. **Tarefa sem horário de fim.** "Organizar as caixas" (05/10, 10h) não tem fim na
   mensagem. Aceitar sem fim e não contar carga até alguém informar, ou exigir o fim
   ao lançar? A validação com o real depende disso.
