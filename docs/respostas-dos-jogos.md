# Respostas dos jogos — registro por aluno para pesquisa

Cada partida jogada nos três jogos do Academy fica registrada: o que o aluno
escolheu, em que ordem, quanto tempo levou e como a partida terminou. O objetivo
é permitir pesquisa sobre aprendizagem depois — comparar turmas, ver onde a
maioria erra, acompanhar mudança de comportamento ao longo do tempo.

## Os três jogos

| Chave | Jogo | O que é registrado |
|---|---|---|
| `orcamento-familiar` | Orçamento Familiar do Futuro | As 14 decisões de vida, a faixa salarial calculada e o perfil financeiro final |
| `cidadania-financeira` | Cidadania Financeira | A opção escolhida em cada cenário, se foi certa, parcial ou errada, e a pontuação do papel |
| `primeiro-passo` | Primeiro Passo (Laboratório de Gestão) | As respostas das 10 etapas, incluindo o que o aluno escreveu, e as estimativas de preço e caixa |

## Onde ficam os dados

Duas tabelas, criadas por `supabase/migrations/20260914_game_answer_telemetry.sql`:

- **`game_session`** — uma linha por partida. Guarda quem jogou, qual jogo, quando
  começou e terminou, quantas respostas deu, a pontuação e o desfecho.
- **`game_answer`** — uma linha por resposta, em formato longo. É a tabela que a
  análise usa: cada linha tem a pergunta, a resposta, o resultado e o tempo gasto.

O formato longo é proposital. Uma coluna por pergunta quebraria toda vez que um
jogo ganhasse uma pergunta nova; uma linha por resposta aguenta jogos diferentes
na mesma tabela e vai direto para qualquer ferramenta de análise.

## Quem pode ler

Ninguém, exceto administrador. O aluno não tem privilégio nenhum sobre as duas
tabelas — nem de leitura, nem de escrita. A única porta de entrada é a função
`ingest_game_events`, que roda com privilégio próprio e carimba a identidade de
quem chamou: o cliente **nunca** informa de quem é a resposta, isso vem sempre de
`auth.uid()`. Tentar gravar em nome de outro aluno não passa.

A leitura sai por `export_game_answers` e `summarize_game_sessions`, ambas com
verificação explícita do papel `admin` antes de devolver qualquer linha.

## Como exportar

No painel administrativo, aba **Respostas dos jogos**. Escolha o período e o jogo
e clique em *Baixar planilha*. O arquivo sai em CSV, uma linha por resposta,
pronto para abrir em planilha ou carregar em R/Python.

A tela também mostra um panorama do período: quantas partidas, quantos alunos
distintos, quantas foram concluídas, duração e pontuação médias por jogo.

Cada arquivo traz até 50.000 respostas. Passando disso, a tela avisa e basta
reduzir o período para levar o restante.

## O que nunca é guardado

- Nome, e-mail, CPF, telefone, endereço: perguntas com esse teor são recusadas
  pela validação, e qualquer texto que contenha um e-mail, CPF ou telefone é
  rejeitado inteiro antes de chegar ao banco.
- O nome que o aluno digita no Orçamento Familiar não vai para o acervo. Ele
  continua aparecendo na tela e no extrato impresso, só não é registrado.

O texto que o aluno escreve nas perguntas abertas do Primeiro Passo **é**
guardado, porque é ele que sustenta a leitura qualitativa. Para parar de guardar,
defina `GAME_RESEARCH_OPEN_TEXT=false` — as escolhas, números e pontuações
continuam sendo registrados.

## Ao mudar um jogo

Trocar pergunta, opção ou pontuação exige subir a versão do conteúdo em
`GAME_CONTENT_VERSIONS`, dentro de `lib/api/game-telemetry-types.ts`. Sem isso,
respostas colhidas sob regras diferentes ficam misturadas na mesma série e a
comparação perde o sentido. A versão viaja junto de cada resposta, então dá para
separar as séries na análise depois.

## Aplicação da migração

A migration segue a convenção do repositório: **não é aplicada automaticamente**,
vai pelo lane de Ops. Ela é reexecutável — rodar duas vezes não causa estrago,
e isso é exercitado no teste de integração.

Ela também amplia a lista de rotas aceitas pela telemetria semântica já
existente, para incluir as páginas dos módulos. Sem essa parte, os acessos às
páginas de jogo seriam recusados e a jornada do aluno ficaria com um buraco
justamente onde a pesquisa quer olhar.

## Testes

```bash
npm test -- --run tests/integration/game-telemetry-migration.test.ts   # Postgres real (PGlite): RLS, ingestão, exportação
npm test -- --run tests/unit/lib/api/game-telemetry-validation.test.ts # o que é aceito e o que é recusado
npm test -- --run tests/unit/lib/api/game-telemetry-server.test.ts     # ida ao banco e geração do CSV
```
