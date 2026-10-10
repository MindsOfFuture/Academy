# Turmas de 2026: fontes e regras de importação

## Veredito

As fontes oficiais são `Levantamentos` e os controles das turmas de 2026, conforme decisão do Rafael no Telegram (thread 10724, resposta "1 s 2 inclui", 08/10/2026). O histórico anterior fica para outra etapa. A primeira versão inclui arquivo assinado do termo, status e data de conferência, com acesso privado.

A estrutura das fontes foi consultada por API somente leitura. Este documento define o mapeamento e as verificações; não é um importador executado. A spec de comportamento correspondente é `specs/014-gestao-turmas.md`, ainda em rascunho.

## O que muda para quem usa

A coordenação revisa as turmas, os encontros e os alunos antes de confirmar uma importação. O sistema mostra linhas incompletas, possíveis duplicatas e arquivos ainda sem correspondência. Depois da migração aprovada, chamada, termos e indicadores passam a ser mantidos na página da turma.

## Evidência das fontes

### Levantamentos, aba 2026

ID: `1SizDFTkK4q7mR_R1Z0xyfEHN3d1n9hcgswVtZxaGpzY`.

Leitura de `2026!A1:O1000` em 08/10/2026: 34 linhas com a coluna Escola preenchida. Isso não prova 34 turmas únicas nem 34 turmas realizadas. As colunas têm o seguinte preenchimento nessas linhas:

| Campo da fonte | Preenchidos | Uso no M1 |
|---|---:|---|
| Bus | 30 | informação de transporte da visita; não cria reserva confirmada sem revisão |
| Escola | 34 | escola vinculada à turma, com revisão de duplicatas |
| Dias | 32 | proposta de encontros; datas precisam de interpretação e confirmação |
| Horários | 32 | início/fim dos encontros; não somar texto livre |
| Modalidade | 33 | modalidade; reconhecer LEGO e Lego como a mesma modalidade após revisão |
| N° de alunos | 26 | contagem declarada para comparação, nunca alunos fictícios |
| Série | 0 | não preencher por suposição |
| Planilha | 20 | referência textual a localizar no inventário |
| Termos | 10 | referência/indicação a revisar; não significa que o arquivo foi conferido |
| Lista de Presença | 0 | usar documento-base e controles por turma; não criar vínculo fictício |
| Status | 0 | exigir revisão; não inferir que todas as turmas aconteceram |

Modalidades observadas: Python, LEGO/Lego, IA, Educação Financeira e Apresentação. Uma linha não informa modalidade. Não restringir a importação a uma lista antiga que só admite Lego, Python e Scratch.

Nenhuma URL foi encontrada nessa faixa pelas fórmulas, hyperlinks ou rich links retornados pela API. Célula preenchida não é sinônimo de link utilizável. O pareamento entre referência e arquivo deve ser revisável, não automático só pela escola.

### Controle de presença de 2026

Arquivo inspecionado: `07 - Planejamento de Turmas 2026/Turmas 2026/LEGO/04-26 São João Nepomuceno/Controle São João Nepomuceno`.

ID: `1K3uYSDwqstWpAcJwRF0rTfV5ACnbfLL6-vFM0uJRTfA`.

Cabeçalhos observados: Nome, Aulas 01 e 02 (23/02), Aulas 03 e 04 (25/02), Aulas 05 e 06 (27/02), Ano escolar, Idade, Telefone e Email. As primeiras linhas lidas não bastam para afirmar que há lista de alunos completa ou frequência preenchida. A amostra de cada formato deve ser inspecionada integralmente, em memória, com apenas estatísticas e erros sem dados pessoais no relatório.

Aulas agrupadas na mesma data são um encontro de chamada; não duplicar presença porque o cabeçalho cita duas aulas. Ano e horário devem concordar com a fonte da turma. Datas conflitantes vão para revisão.

### Lista de presença para impressão

`07 - Planejamento de Turmas 2026/Presença - NÃO APAGAR/Lista de presença Base`.

ID: `1eZx7UL6YmKjb8-idqhaOOBv0ThDCtzopTd8xWWFSbvY`.

Documento lido: módulo/aulas, escola, horário, professor, alunos, indicador de termo, bolsistas e assinaturas. A página impressa reproduz essa função, sem imprimir CPF ou contatos.

## Regras da importação

1. Cada lote identifica arquivo, aba, linha e turma de destino. Uma referência sem arquivo identificado fica pendente; não importa dado de um arquivo só porque ele cita a mesma escola.
2. A prévia separa novas linhas, linhas já importadas, mudanças e conflitos. Confirmar novamente o mesmo lote não duplica turmas, alunos, encontros ou presença. Mudanças posteriores não sobrescrevem edição humana sem revisão.
3. Nome igual não é identidade global de aluno. Homônimos, grafias parecidas e repetição em turmas diferentes exigem decisão explícita no pareamento.
4. Presença só é importada quando a fonte afirma presença ou falta. Célula vazia continua sem informação; não vira falta nem presença. Uma chamada só é concluída quando o operador confirma todos os registros necessários.
5. Número declarado de alunos não cria matrículas sintéticas nem entra como total realizado. Divergência com a lista nominal é apresentada à coordenação.
6. Campos financeiros, dados bancários e CPF não são extraídos para o cadastro de turma/aluno. O próprio termo pode conter esses dados; o arquivo fica privado e sua leitura é restrita à coordenação ativa.
7. A origem pode ter apenas indicação de termo. Sem arquivo correspondente e sem conferência, o sistema não marca arquivo como arquivado/conferido.
8. Conteúdo real de pessoas não vai para fixtures, logs ou commits. Os testes usam dados fictícios que preservam os formatos observados.
9. Concluir exige reconciliação das contagens, revisão dos conflitos e aprovação da migração real. Só depois se combina a virada com a equipe e torna o controle antigo somente leitura. Nada neste plano altera permissões no Drive.

## Riscos

- **Alta:** status e série estão vazios na fonte central. Inventar valores distorce resultados e critérios de certificado. Manter pendências visíveis.
- **Alta:** termos contêm dados pessoais. Exigir bucket privado, leitura restrita, testes de acesso negado e definição de retenção antes do uso real.
- **Alta:** referências textuais sem URLs podem apontar a versões antigas ou a outra turma da mesma escola. Confirmar a correspondência antes de importar.
- **Média:** duas grafias de Lego e datas/horários livres. Normalização deve aparecer na prévia e nunca mudar a fonte original.

## Estimativa

O plano-pai estima 30–40 horas para M1 e 10–15 horas de importação/virada distribuídas entre os módulos. Essas faixas antecedem a inspeção atual e a decisão de incluir arquivos assinados. Não são uma nova promessa de prazo; a revisão do esforço depende do pareamento dos arquivos e da aprovação da spec.

## Bloqueadores

- Aprovação da spec 014 antes da implementação, conforme a Constituição do Academy.
- Política de retenção dos termos antes do uso real dos arquivos, sem inventar prazo legal.
- Pareamento das referências com arquivos e inspeção dos formatos de presença antes de confirmar qualquer lote.
- Aprovação específica para migrations, upload/importação no ambiente compartilhado e publicação. As decisões de produto não concedem essas permissões.

## Verificação desta rodada

Na worktree isolada `feat/gestao-turmas-spec`, baseada em `c862e768cfc06520413cb91bd33f209a1467fa5a`, foram executados `npm run lint`, `npm test -- --run --coverage` e `npm run build`, em cadeia com parada em caso de erro e configuração fictícia de Supabase/Resend. Resultado da cadeia: exit code 0.

- Lint terminou com avisos, sem erro bloqueante.
- Vitest: 67 arquivos passaram; 590 testes passaram e 2 foram ignorados. Os dois testes ignorados não estão comprovados por esta execução.
- Cobertura: statements 70,56%, branches 62,33%, functions 70,55%, lines 73,30%; os limites do projeto passaram.
- Build de produção e verificação de tipos concluídos. Nenhum deploy foi executado.
- A sonda de fontes foi realmente executada e o mapeamento/índice passaram nas verificações documentais e de consistência.

Esses resultados verificam a integridade do aplicativo existente com os documentos locais. Não provam a implementação de Turmas, que ainda não existe, nem importação ou autorização no banco real.

## Não feito de propósito

- Histórico anterior a 2026: fora da primeira migração, por decisão do Rafael.
- Sincronização contínua com planilhas: mantém duas fontes e contraria o objetivo de substituir o controle antigo.
- NPS, pagamentos, diário e alocação automática: pertencem aos próximos módulos.
- Importação de CPF/contatos sem necessidade confirmada: a existência da coluna no legado não obriga copiar o dado.
- Mudança nos arquivos do Drive, no banco ou no site ao produzir este plano.
