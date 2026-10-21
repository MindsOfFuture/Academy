# M10 · Turma B — Comunicação, vendas, pessoas e plano de ação

## Fonte

Planilha do Grupo 10 `Modulo_10_Perguntas_e_Caminhos.xlsx` (sha256 em `dados/modulo10.js`). Ela substitui o questionário anterior (documento v2, 12 perguntas). Capa e conceitos continuam os do documento v2, porque a planilha nova não traz texto de abertura nem Base técnica.

`dados/modulo10.js` é gerado por um extrator fora do repositório e guarda, literais: 13 perguntas (aba Passo a passo), 38 caminhos (aba Caminhos por resposta), instrumentos, pedido de IA, resumo (blocos, próximos passos, cruzamentos) e a lista dos 10 módulos. As colunas "Caminho técnico" e "Próximo passo / regra" viram comportamento e não vão para a tela.

## Como o módulo funciona

- **Ponto de partida**: lê o que a pessoa já respondeu nos Módulos 1, 3, 4, 5 e 6 neste aparelho (oferta, para quem, proposta de valor, diferencial, canais, preço, entrega, pagamento) com o selo "Veio do Módulo N". Nada é obrigatório.
- **Só leitura** das chaves dos outros módulos; o Módulo 10 grava apenas em `lg2-turma-b-m10` (estado versionado, `v: 2`).
- **Fases**: Como você vende · Pessoas · Seu plano. A tela final (M10-12) mostra o plano, o roteiro de venda editável, a mensagem de apresentação, o checklist de sócios, o retrato por módulo (1 a 9), até 3 alertas, 1 encaminhamento e o próximo passo.
- **Regras** em `js/motor.js` (lista de prioridades, ordem por urgência, datas, frase do plano). A capacidade do Módulo 7 usa uma cópia do motor daquele módulo (`js/motor7.js`).

## Escolhas do app (a planilha pede dados que os módulos publicados não guardam)

- **Sócio**: o Módulo 8 publicado não pergunta se há sócio (M8-03). O M10 faz a pergunta do documento v2 ("Você tem ou pretende ter sócio?") antes do acordo.
- **Lista de prioridades**: os módulos não guardam lacunas com tema e gravidade. O app monta a lista com as respostas que dá para ler: "Não sei" de cada módulo (gravidade baixa) e alertas definidos aqui (alta: não sabe fazer, nenhum cliente ouvido, preço "Não sei", capacidade abaixo do volume, endereço negado, acordo entre sócios; média: consulta de viabilidade — alta se o imóvel já foi alugado —, só elogios, critério do teste, dinheiro para começar, fornecedor único, sem conferência de qualidade, tempo de produção, formalização, tempo de resposta, divulgação, etapa sem responsável).
- **Responsáveis por etapa (M10-07)**: o mapa do Módulo 7 não tem "quem faz"; a pergunta aparece para todas as etapas do mapa e a resposta fica no M10 (não altera o M7).
- **Roteiro de venda**: sem a etapa de nota fiscal (o Módulo 8 publicado não tem a pergunta M8-08).
- **Ofertas guardadas** ("Analisar outra oferta"): o Módulo 1 publicado não guarda outras ofertas; a parte condicional não aparece.
- **Retrato**: os módulos não marcam fato × hipótese; o app mostra uma informação-chave por módulo, as hipóteses evidentes (ideia ainda não vendida, só elogios, hipótese do teste) e quantas respostas "Não sei" ficaram.
- **Frase do plano**: segue o caso da aba "Cálculos a conferir" ("…; vai funcionar se vierem 5 pedidos."), que acrescenta "vierem" ao formato da coluna F.
- A aba "Diagnóstico das telas" descreve a versão parcial antiga (15 perguntas), não a v2 publicada.

## Teste

`node tests/lg2-m10.cjs` (com `PW=<playwright>`): texto literal contra a planilha embutida, casos da aba "Cálculos a conferir", as 38 linhas de caminhos alcançadas na tela com o conjunto exato de caixas, cruzamentos, herança, percurso completo, recarregar, corrigir, versão e recomeçar.
