# M10 · Turma A — importação parcial das perguntas

## Escopo e autorização

Inclusão das perguntas do grupo na estrutura estática aprovada em `specs/013-lg2-modulos-por-turma.md`. O usuário confirmou explicitamente **Turma A, módulo 10** e autorizou **texto aberto temporário** quando faltam alternativas. O nome é o já cadastrado em `turmas.ts`: Comunicação, vendas, pessoas e plano de ação.

Esta entrega disponibiliza um questionário, não um módulo pedagógico completo: não produz diagnóstico, recomendações, cálculos ou plano de 90 dias. O aviso de versão parcial aparece na abertura, em todas as perguntas e no resumo impresso. A marcação em `PRONTOS.a` significa que o questionário está navegável, não que o conteúdo recebeu aprovação pedagógica.

## Origem e fidelidade

- Planilha original recebida do grupo; arquivo e nome pessoal não publicados. Para o teste, informe seu caminho local em `LG2_M10_XLSX`.
- Todas as 16 abas foram lidas usando ZIP/XML da biblioteca padrão de Python.
- Importadas literalmente as **15 perguntas de C5:C19** da aba `3 Fluxo de perguntas`, na ordem original; sem corrigir redação.
- Excluída a linha 4: exemplo de M5, confirmado pelo preenchimento cinza `FFF2F2F2`.
- A5:A10 contêm `M10.P01` a `M10.P06`, preservados.
- A11:A19 estão vazias. Os identificadores internos `linha-11` a `linha-19` são referências às linhas de origem, não códigos atribuídos ao grupo; não aparecem como códigos pedagógicos na interface.
- O hash SHA-256 do arquivo recebido está em `dados/perguntas.json` e é conferido no teste.
- Nenhum nome de integrante, telefone ou metadado pessoal foi publicado. A extração pública é uma lista explícita de pergunta, linha, código e tipo original, não uma cópia da pasta de trabalho.

## Lacunas preservadas

- A Capa não informa número, nome, turma, integrantes, versão ou data. A definição Turma A/M10 veio do usuário. A tabela genérica `Listas` sugere Turma de 24 para M10, mas não substitui essa confirmação.
- Os tipos foram escritos em **F (Condição)**, deixando **E (Tipo)** vazia. Foram preservados em `tipoOriginal`, sem interpretar esses valores como desvios.
- G (Opções) está vazia nas 15 perguntas. Todas usam campo livre, inclusive a pergunta cujo tipo original é `Sim/não`; nenhuma alternativa foi inventada.
- Não há ajuda, resposta, alerta, próximo passo, fonte/data ou status preenchidos nas linhas importadas. Não há regras de exibição definidas: as 15 perguntas são acessíveis em sequência, mesmo aquelas que pressupõem uma situação anterior.
- A Capa conta 6 perguntas por código, mas existem 15 textos; as nove perguntas sem código não foram descartadas.
- A Base técnica contém textos do grupo, mas sem fontes, links ou datas; não foi incorporada porque esta entrega se limita às perguntas.
- As abas de lógica, instrumentos e conteúdo educativo têm apenas exemplos de M5. Vídeos não têm roteiro do grupo; casos de teste têm apenas o exemplo e rótulos de tipos. Documentação e integração conservam exemplos do template. Nada disso foi convertido em conteúdo do M10.

## Funcionamento

- Entrada: `public/lg2/turma-a/m10/index.html`.
- HTML/CSS/JS nativos; sem biblioteca, servidor de respostas ou dependência nova.
- Reutiliza diretamente o CSS e os cinco recursos institucionais de `../../turma-b/m04/`; não importa seu motor, dados ou conteúdo. O complemento CSS local cuida apenas do questionário e da impressão.
- Chave exclusiva `lg2-turma-a-m10`; salva texto a cada edição e posição a cada mudança, com retomada após recarga.
- Voltar, editar pelo resumo, imprimir e reiniciar com confirmação. Cancelar preserva tudo; confirmar remove apenas a chave deste módulo.
- Respostas podem ficar em branco; o resumo apresenta `Sem resposta`. Não há validação de negócio inventada.
- Conteúdo de respostas é escapado; o campo usa `.value`. Falha ao salvar ou apagar é informada, em vez de prometer persistência.
- Autorização do Academy continua no middleware existente; não foi criada exceção pública nem alterado banco de dados.

## Evidência reproduzível

```bash
node tests/lg2-m10.cjs
```

O teste usa `python3` com biblioteca padrão para ler a fonte original e Playwright já instalado. Aceita `LG2_M10_XLSX`, `PYTHON`, `PW` e `LG2_M10_SCREENSHOT` para caminhos alternativos. O servidor de teste escuta em uma porta efêmera em `127.0.0.1`, e é encerrado junto com o navegador mesmo em falha.

Resultado observado: exit code 0. Verificados texto literal e tipos/linhas contra XLSX, hash da fonte, disponibilidade na Turma A, 15/15 perguntas alcançáveis, textarea em todas as perguntas, salvamento/recarga, voltar/editar, resumo, escape de HTML malicioso, impressão acionada e controles ocultos no CSS de impressão, cancelamento e confirmação de reset, isolamento da Turma B, ausência do exemplo e de dados pessoais, sem erros de página/HTTP e sem overflow horizontal em 390×844.

Captura móvel revisada visualmente: `C:/Users/faelr/AppData/Local/hermes/work/lg2-m10/preview.png`. Mostra a primeira pergunta, aviso de texto aberto temporário, campo, controles e rodapé institucional legíveis, sem recortes.

O teste cobre o módulo estático em navegador real, não o login ou o build completo de Next.js. A impressão foi verificada pela chamada e pelo estilo de impressão, não por impressora física. Nenhum deploy, commit ou push foi feito.

## Verificação para publicação

A publicação de M5 e M10 foi autorizada pelo usuário. A primeira execução completa identificou um teste de registro desatualizado: a lista de chaves ainda não incluía M10 e o extrator reconhecia somente aspas duplas. O teste foi atualizado para conferir explicitamente a chave `lg2-turma-a-m10`, aceitando ambos os delimitadores sem remover nenhuma asserção.

Após a correção, `NODE_OPTIONS=--no-experimental-webstorage npm test -- --run --coverage` terminou com exit 0: 67 arquivos passaram, 591 testes passaram e 2 foram ignorados. Cobertura: statements 70,62%, branches 62,38%, functions 70,55%, lines 73,37%. Os testes focados de M5 e M10 também passaram, incluindo a comparação literal das 15 perguntas com a fonte privada.

`LG2_M10_XLSX` é obrigatório no teste de fonte: o caminho e o nome pessoal do arquivo recebido não são publicados.
