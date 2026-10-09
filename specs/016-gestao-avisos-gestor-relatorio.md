# 016 — Gestão: avisos por e-mail, gestor do encontro e relatório ao concluir

Status: aprovada (coordenação, 09/10/2026)
Constituição: `specs/constitution.md` · Depende de: `specs/014-gestao-alocacao.md`

## Problema

Quem é alocado só fica sabendo pelo WhatsApp e ninguém lembra na véspera; só a
coordenação fecha encontros, e o que aconteceu em cada um não fica registrado.

## Escopo

- **E-mail ao bolsista** quando é alocado (encontro lançado, acrescentado, entrou como
  substituto), quando é removido ou substituído, e quando o encontro é cancelado (com o
  motivo).
- **Lembrete por e-mail** nas 24 h antes do início do encontro, para quem está alocado.
  Uma vez por alocação; quem é alocado em cima da hora recebe no envio seguinte.
- **Gestor do encontro:** a coordenação marca um ou mais alocados como gestor. Só os
  gestores e a coordenação concluem ou reabrem o encontro.
- **Página do encontro para o bolsista**, só de leitura: dados, equipe e relatório. O
  gestor conclui por ela. Chega-se pela tela "Hoje".
- **Relatório ao concluir:** concluir abre uma janela com um campo de texto
  obrigatório sobre o encontro ou aula. O relatório aparece na página do encontro.

**Fora de escopo:** aviso no sino (só e-mail); bolsista editar a alocação; lembrete por
WhatsApp; escolher o horário do lembrete.

## Critérios de aceite

- [ ] Dado um encontro lançado com Bia, então Bia recebe e-mail com data, horário,
      atividade e link.
- [ ] Dado um encontro amanhã às 13h, quando a tarefa roda depois das 13h de hoje, então
      cada alocado recebe um lembrete, e só um.
- [ ] Dado Caio gestor do encontro, quando ele abre o encontro pela tela "Hoje", então vê o
      botão de concluir; Bia, alocada sem ser gestora, não vê e o banco recusa se ela tentar.
- [ ] Concluir sem relatório é recusado; com relatório, ele aparece no encontro.
- [ ] Sem permissão: quem não é da equipe não vê a página; o lembrete não usa a chave de
      serviço do Supabase.

## Plano

- **Dados:** `supabase/migrations/20261009_gestao_gestor_lembrete.sql` — `gestor` na
  alocação, `relatorio` no encontro, `concluir_encontro()` (`security definer`, confere
  coordenação ou gestor), `nomes_da_equipe()` para o bolsista ver nomes, leitura da turma
  pelo bolsista alocado, e o lembrete: tabela `lembrete_enviado`, papel de banco
  `gestao_lembrete` que só executa `lembretes_pendentes()` e
  `marcar_lembrete_enviado()`.
- **E-mail ao alocar:** pela ação da coordenação, com o e-mail de `gestao.equipe()`, via
  `sendNotificationEmail` (Resend). Sem chave de serviço (ADR 021). Falha de e-mail não
  desfaz a alocação.
- **Lembrete:** `scripts/academy-lembrete-encontros.sh` (psql + curl) em systemd timer de
  hora em hora (ADR 019, RUNBOOK §8.6). O banco monta o e-mail; o script só envia e marca.
- **Atalho:** `// ponytail:` nenhum; lembrete enviado e não marcado (queda entre o envio e
  a marcação) sai de novo na hora seguinte.

## Tarefas

- [x] Migration + teste em PGlite (aplicada em produção em 09/10/2026)
- [x] Avisos por e-mail nas ações da coordenação
- [x] Gestor, página do bolsista, janela do relatório
- [x] Script e unidades do lembrete + RUNBOOK §8.6
- [ ] Ativar o lembrete no VPS (senha do papel, /etc/academy.env, timer) — RUNBOOK §8.6
