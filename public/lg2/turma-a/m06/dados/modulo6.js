/* GERADO por ferramentas/extrair.py a partir da planilha do grupo. Nao editar a mao. */
window.MODULO6 = {
 "origem": "LG2_M06_planilha_do_grupo.xlsx",
 "modulo": {
  "numero": "6",
  "nome": "Investimento, capital de giro e fluxo de caixa",
  "versao": "v0.1",
  "data": "25/09/2026",
  "turma": "Turma de 18",
  "tutora": "Guilherme",
  "integrantes": [
   "Giovana Santos Castro",
   "Levi Martins Valadão",
   "Letícia Souza",
   "LUANA OLIVEIRA ALVES",
   "ISADORA IGNACIO RODRIGUES"
  ]
 },
 "mapa": {
  "objetivo": "Apoiar o empreendedor na organização dos investimentos necessários para o negócio, das necessidades de estoque, dos prazos de pagamento e recebimento e da projeção do fluxo de caixa.",
  "usuario": "Pessoa que está estruturando ou iniciando um pequeno negócio e precisa organizar os investimentos necessários, as compras, as vendas esperadas e a movimentação de dinheiro do negócio.",
  "decisoes": "Identificar o que precisa ser comprado ou investido, organizar a prioridade das compras, estimar o investimento inicial e analisar a necessidade de dinheiro para manter o negócio funcionando.",
  "nao_faz": "Não garante que o negócio terá lucro ou dinheiro suficiente, não determina que o usuário deve realizar uma compra ou investimento e não substitui uma análise financeira profissional.",
  "mensagem_limite": "O app oferece apoio educacional básico. As estimativas dependem dos dados fornecidos e não garantem resultados. Regras de registro, tributação, licenciamento e exercício profissional devem ser confirmadas em fontes oficiais e com profissionais habilitados.",
  "ter_em_maos": "Informações sobre o que precisa comprar para iniciar ou manter o negócio, valores dos investimentos, formas e prazos de pagamento, quantidade de vendas esperadas, prazos de recebimento e informações sobre estoque.",
  "entrega": "Prioridade de compras, estimativa do investimento inicial, projeção do caixa para 13 semanas e cenários com alertas relacionados à disponibilidade de dinheiro.",
  "encaminhamentos": "Encaminhamento a contador ou profissional financeiro quando houver necessidade de análise específica das condições financeiras, tributárias ou contábeis do negócio; e a instituições ou profissionais habilitados quando a situação envolver contratação de crédito ou decisão financeira que exija avaliação especializada.",
  "caso_real": "Quando a situação exigir uma análise financeira ou contábil específica, o usuário será orientado a buscar um profissional habilitado.",
  "riscos": "Apresentar estimativas como valores garantidos, confundir vendas com recebimento de dinheiro ou ignorar os prazos de pagamento. Para evitar esses riscos, o módulo utilizará os dados informados pelo usuário, apresentará projeções como estimativas e considerará os prazos de pagamento e recebimento no fluxo de caixa."
 },
 "conexoes": [
  {
   "modulo": "1.0",
   "nome": "Perfil do empreendedor e definição da ideia",
   "recebe": "Informações sobre recursos disponíveis, limite de investimento e objetivo do negócio",
   "combinado": "Não"
  },
  {
   "modulo": "4.0",
   "nome": "Produto, proposta de valor e teste da ideia",
   "recebe": "Informações sobre o produto/serviço e necessidades do teste",
   "envia": "Estimativas de investimento e recursos necessários para testar a ideia",
   "combinado": "Não"
  },
  {
   "modulo": "5.0",
   "nome": "Custos, despesas, preço e margem",
   "recebe": "Informações de custos e despesas utilizadas nas projeções",
   "envia": "Informações de necessidade de caixa e recursos financeiros",
   "combinado": "Não"
  },
  {
   "modulo": "7.0",
   "nome": "Operação, fornecedores, capacidade e qualidade",
   "recebe": "Informações sobre equipamentos, estoque, fornecedores e necessidades operacionai",
   "envia": "Necessidades de investimento e impacto das compras no caixa",
   "combinado": "Não"
  },
  {
   "modulo": "10.0",
   "nome": "Comunicação, vendas, pessoas e plano de ação",
   "recebe": "Informações relacionadas às ações planejadas e possíveis necessidades de recursos",
   "envia": "Impacto financeiro das ações planejadas no caixa",
   "combinado": "Não"
  }
 ],
 "base": [
  {
   "codigo": "M6.BT01",
   "conceito": "Investimento inicial",
   "definicao": "Recursos necessários para iniciar e estruturar o negócio, incluindo itens como equipamentos, móveis, instalações, estoque inicial e gastos pré-operacionais.",
   "porque": "Permite identificar e estimar os recursos necessários antes do início das atividades.",
   "exemplo": "Compra de equipamentos, móveis, adequação do espaço e estoque inicial.",
   "tipo_fonte": "Institucional",
   "fonte": "CAIXA – Educação Financeira",
   "link": "https://www.caixa.gov.br/educacao-financeira/empresa/investimento-inicial/Paginas/default.aspx",
   "data": "26/09/2026",
   "status": "Rascunho"
  },
  {
   "codigo": "M6.BT02",
   "conceito": "Gastos pré-operacionais",
   "definicao": "Gastos realizados antes do início das atividades do negócio para viabilizar sua abertura e funcionamento.",
   "porque": "Ajuda o empreendedor a considerar despesas que ocorrerão antes de começar a gerar receitas.",
   "exemplo": "Registro da empresa, taxas, reformas, divulgação inicial, projeto de decoração e honorários profissionais.",
   "tipo_fonte": "Acadêmica",
   "fonte": "Universidade do Estado de Santa Catarina – UDESC",
   "link": "https://sistemabu.udesc.br/pergamumweb/vinculos/00001a/00001acd.pdf",
   "data": "26/09/2026",
   "status": "Rascunho"
  },
  {
   "codigo": "M6.BT03",
   "conceito": "Capital de giro",
   "definicao": "Recursos necessários para manter o funcionamento do negócio e cobrir suas necessidades financeiras durante a operação.",
   "porque": "Ajuda o negócio a manter estoques, pagar fornecedores e outras despesas enquanto os recebimentos das vendas ainda não estão disponíveis.",
   "exemplo": "Uma empresa compra mercadorias hoje, mas só recebe dos clientes depois; o capital de giro ajuda a sustentar esse período.",
   "tipo_fonte": "Institucional",
   "fonte": "CAIXA – Educação Financeira",
   "link": "https://www.caixa.gov.br/educacao-financeira/empresa/capital-de-giro/Paginas/default.aspx",
   "data": "26/09/2026",
   "status": "Rascunho"
  },
  {
   "codigo": "M6.BT04",
   "conceito": "Fluxo de caixa",
   "definicao": "Controle das entradas e saídas de dinheiro do negócio, utilizado também para projetar a disponibilidade futura de recursos.",
   "porque": "Controle das entradas e saídas de dinheiro do negócio, utilizado também para projetar a disponibilidade futura de recursos.",
   "exemplo": "Registrar semanalmente recebimentos de vendas e pagamentos de compras, aluguel e outras despesas.",
   "tipo_fonte": "Institucional",
   "fonte": "CAIXA – Educação Financeira",
   "link": "https://www.caixa.gov.br/educacao-financeira/empresa/caixa-futuro/Paginas/default.aspx",
   "data": "26/09/2026",
   "status": "Rascunho"
  },
  {
   "codigo": "M6.BT05",
   "conceito": "Prazo de pagamento",
   "definicao": "Período entre a realização de uma compra ou obrigação e o momento em que o pagamento deverá ser realizado.",
   "porque": "Determina quando ocorrerá a saída de dinheiro do caixa e influencia a necessidade de capital de giro.",
   "exemplo": "Uma compra realizada hoje com pagamento para 30 dias gera uma saída de caixa 30 dias depois.",
   "tipo_fonte": "Institucional",
   "fonte": "CAIXA – Educação Financeira",
   "link": "https://www.caixa.gov.br/educacao-financeira/empresa/planeje-as-saidas/Paginas/default.aspx",
   "data": "26/09/2026"
  },
  {
   "codigo": "M6.BT06",
   "conceito": "Prazo de recebimento",
   "definicao": "Período entre a realização de uma venda e o momento em que o dinheiro correspondente fica disponível para o negócio.",
   "porque": "Uma venda pode acontecer antes de o dinheiro entrar no caixa, afetando a disponibilidade financeira.",
   "exemplo": "Um produto vendido em duas parcelas gera recebimentos em datas posteriores à venda.",
   "tipo_fonte": "Institucional",
   "fonte": "CAIXA – Educação Financeira",
   "link": "https://www.caixa.gov.br/educacao-financeira/empresa/organize-as-entradas/Paginas/default.aspx",
   "data": "26/09/2026"
  },
  {
   "codigo": "M6.BT07",
   "conceito": "Estoque",
   "porque": "Produtos, mercadorias ou materiais mantidos pelo negócio para venda ou utilização em suas atividades.",
   "exemplo": "A compra e manutenção de estoque utilizam recursos financeiros e podem afetar o capital de giro.",
   "tipo_fonte": "Institucional",
   "fonte": "Sebrae ",
   "link": "https://sebrae.com.br/empreendedores/conteudos/gerenciar/planilha-controle-de-estoque--evite-perdas-e-excesso",
   "data": "26/09/2026"
  },
  {
   "codigo": "M6.BT08",
   "conceito": "Vendas esperadas",
   "definicao": "Estimativa das vendas que o empreendedor espera realizar em determinado período.",
   "porque": "A estimativa de vendas serve como base para projetar possíveis entradas de recursos no fluxo de caixa.",
   "exemplo": "O empreendedor estima vender R$ 5.000 em produtos em determinado mês.",
   "tipo_fonte": "Institucional",
   "fonte": "Sebrae",
   "link": "https://www.sebrae-sc.com.br/blog/como-fazer-o-fluxo-de-caixa",
   "data": "26/09/2026"
  },
  {
   "codigo": "M6.BT09",
   "conceito": "Disponibilidade de caixa",
   "definicao": "Recursos financeiros disponíveis para que o negócio possa realizar seus pagamentos em determinado momento.",
   "porque": "Permite identificar se o dinheiro disponível será suficiente para cobrir as saídas previstas.",
   "exemplo": "O negócio possui R$ 2.000 disponíveis, mas possui R$ 2.500 em pagamentos previstos para a semana.",
   "tipo_fonte": "Institucional",
   "fonte": "CAIXA – Educação Financeira",
   "link": "https://www.caixa.gov.br/educacao-financeira/empresa/caixa-futuro/Paginas/default.aspx",
   "data": "26/09/2026"
  }
 ],
 "perguntas": [
  {
   "codigo": "M6.P01",
   "modulo": "M6",
   "pergunta": "O que você precisa comprar ou investir para iniciar o negócio?",
   "ajuda": "Pense em equipamentos, móveis, instalações, estoque inicial e outros itens necessários para começar.",
   "tipo": "Texto",
   "condicao": "sempre",
   "opcoes": "Não sei",
   "resposta": "A informação será usada para organizar os investimentos necessários ao início do negócio.",
   "alerta": "Itens que não são essenciais para iniciar podem aumentar o valor necessário para começar.",
   "proximo": "Liste os itens que precisam ser comprados e estime seus valores.",
   "fonte": "CAIXA – Investimento inicial. Consulta em 25/09/2026.",
   "status": "Rascunho"
  },
  {
   "codigo": "M6.P02",
   "modulo": "M6",
   "pergunta": "Qual é o valor estimado do que você precisa comprar ou investir?",
   "ajuda": "Informe uma estimativa do valor total dos itens que pretende comprar ou investir.",
   "tipo": "Número",
   "condicao": "M6.P01 ≠ Não sei",
   "opcoes": "Não sei",
   "resposta": "O valor informado será utilizado como estimativa do investimento inicial.",
   "alerta": "O valor é uma estimativa e pode mudar conforme os preços encontrados.",
   "proximo": "Organize os itens por prioridade de compra.",
   "fonte": "CAIXA – Investimento inicial. Consulta em 25/09/2026.",
   "status": "Rascunho"
  },
  {
   "codigo": "M6.P03",
   "modulo": "M6",
   "pergunta": "Como você pretende pagar esse investimento?",
   "ajuda": "Considere se o pagamento será à vista ou parcelado e informe a condição prevista.",
   "tipo": "Escolha",
   "condicao": "M6.P02 ≠ Não sei",
   "opcoes": "À vista; Parcelado; Parte à vista e parte parcelado; Não sei",
   "resposta": "A forma de pagamento será considerada na projeção das saídas de dinheiro.",
   "alerta": "Um investimento parcelado pode gerar pagamentos em semanas ou meses posteriore",
   "proximo": "Informe quando os pagamentos deverão ser realizados.",
   "fonte": "CAIXA – Planeje as saídas. Consulta em 25/09/2026.",
   "status": "Rascunho"
  },
  {
   "codigo": "M6.P04",
   "modulo": "M6",
   "pergunta": "Quanto você espera vender do seu produto, mercadoria ou serviço por período?",
   "ajuda": "Informe uma estimativa das vendas esperadas. Se possível, use uma estimativa mensal.",
   "tipo": "Número",
   "condicao": "sempre",
   "opcoes": "Não sei",
   "resposta": "A estimativa será utilizada para projetar as entradas de recursos no fluxo de caixa.",
   "alerta": "Vendas esperadas são estimativas e não representam garantia de recebimento.",
   "proximo": "Informe quando espera receber essas vendas.",
   "fonte": "Sebrae-SC – Como fazer o fluxo de caixa. Consulta em 25/09/2026.",
   "status": "Rascunho"
  },
  {
   "codigo": "M6.P05",
   "modulo": "M6",
   "pergunta": "Você precisa comprar ou manter estoque para o negócio funcionar?",
   "ajuda": "Pense em mercadorias para revenda, materiais ou produtos que precisam estar disponíveis antes da venda.",
   "tipo": "Sim/Não",
   "condicao": "sempre",
   "opcoes": "Sim; Não; Não sei",
   "resposta": "A resposta será utilizada para identificar a necessidade de recursos destinados ao estoque.",
   "alerta": "Comprar estoque em excesso pode imobilizar recursos que poderiam ser utilizados em outras necessidades do negócio.",
   "proximo": "Se sim, informe o valor estimado do estoque.",
   "fonte": "Sebrae – Planilha controle de estoque: evite perdas e excesso. Consulta em 25/09/2026.",
   "status": "Rascunho"
  },
  {
   "codigo": "M6.P06",
   "modulo": "M6",
   "pergunta": "Qual é o valor estimado do estoque que você precisa comprar ou manter?",
   "ajuda": "Informe uma estimativa do valor necessário para o estoque inicial ou para a reposição.",
   "tipo": "Número",
   "condicao": "M6.P05 = Sim",
   "opcoes": "Não sei",
   "resposta": "O valor informado será considerado na estimativa das necessidades financeiras do negócio.",
   "alerta": "O valor do estoque pode variar conforme quantidade, preço e frequência de reposição.",
   "proximo": "Informe como e quando esse estoque será pago.",
   "fonte": "Sebrae – Planilha controle de estoque: evite perdas e excesso. Consulta em 25/09/2026.",
   "status": "Rascunho"
  },
  {
   "codigo": "M6.P07",
   "modulo": "M6",
   "pergunta": "Qual é o valor estimado do estoque que você precisa comprar ou manter?",
   "ajuda": "Considere a data ou o prazo previsto para cada pagamento.",
   "tipo": "Escolha",
   "condicao": "sempre",
   "opcoes": "À vista; Até 7 dias; 8 a 30 dias; Mais de 30 dias; Não sei",
   "resposta": "O prazo informado será utilizado para projetar as saídas de dinheiro.",
   "alerta": "O momento do pagamento pode ser diferente do momento da compra.",
   "proximo": "Compare os pagamentos previstos com os recebimentos esperados.",
   "fonte": "CAIXA – Planeje as saídas. Consulta em 25/09/2026.",
   "status": "Rascunho"
  },
  {
   "codigo": "M6.P08",
   "modulo": "M6",
   "pergunta": "Quando você espera receber o dinheiro das vendas?",
   "ajuda": "Considere o prazo entre a venda e o recebimento do dinheiro.",
   "tipo": "Escolha",
   "condicao": "M6.P04 ≠ Não sei",
   "opcoes": "Na hora; Até 7 dias; 8 a 30 dias; Mais de 30 dias; Não sei",
   "resposta": "O prazo de recebimento será utilizado para projetar as entradas de dinheiro.",
   "alerta": "Uma venda realizada não significa necessariamente que o dinheiro estará disponível imediatamente.",
   "proximo": "Compare os recebimentos previstos com os pagamentos.",
   "fonte": "CAIXA – Organize as entradas. Consulta em 25/09/2026.",
   "status": "Rascunho"
  },
  {
   "codigo": "M6.P09",
   "modulo": "M6",
   "pergunta": "Você já possui algum dinheiro disponível para investir ou manter o negócio funcionando?",
   "ajuda": "Considere recursos próprios que pretende utilizar no negócio.",
   "tipo": "Número",
   "condicao": "sempre",
   "opcoes": "Não sei",
   "resposta": "O valor informado poderá ser considerado na projeção da disponibilidade de caixa.",
   "alerta": "Não informe dados bancários ou informações financeiras sensíveis.",
   "proximo": "Compare os recursos disponíveis com as necessidades previstas.",
   "fonte": "CAIXA – Caixa futuro. Consulta em 25/09/2026.",
   "status": "Rascunho"
  },
  {
   "codigo": "M6.P10",
   "modulo": "M6",
   "pergunta": "Há algum pagamento ou recebimento que acontecerá em um prazo diferente dos anteriores?",
   "ajuda": "Informe situações específicas que possam alterar o momento das entradas ou saídas de dinheiro.",
   "tipo": "Texto",
   "condicao": "sempre",
   "opcoes": "Não sei",
   "resposta": "A informação poderá ser considerada na construção dos cenários de fluxo de caixa.",
   "alerta": "Prazos diferentes dos previstos podem alterar a disponibilidade de dinheiro.",
   "proximo": "Registrar a situação e considerar o impacto na projeção do caixa.",
   "fonte": "CAIXA – Planeje as saídas / Organize as entradas. Consulta em 25/09/2026.",
   "status": "Rascunho"
  }
 ],
 "regras": [
  {
   "codigo": "M6.R01",
   "pergunta": "M6.P01",
   "condicao": "Resposta diferente de “Não sei”",
   "texto": "Liste os itens que precisam ser comprados ou investidos para iniciar o negócio. Considere equipamentos, móveis, instalações, estoque inicial e outros itens necessários.",
   "alerta": "Itens que não são essenciais podem aumentar o valor necessário para iniciar o negócio.",
   "lacuna": "Ainda é necessário estimar o valor de cada item e definir sua prioridade",
   "proximo": "Informe o valor estimado do que precisa ser comprado ou investido.",
   "encaminhamento": "Nenhum",
   "fonte": "CAIXA – Investimento inicial. Consulta em 25/09/2026."
  },
  {
   "codigo": "M6.R02",
   "pergunta": "M6.P01",
   "condicao": "Não sei",
   "texto": "Para estimar o investimento inicial, primeiro é necessário identificar os principais itens que precisam ser comprados ou investidos.",
   "alerta": "Sem essa informação, o valor do investimento pode ficar subestimado.",
   "lacuna": "Itens que precisam ser comprados ou investidos.",
   "proximo": "Liste os principais equipamentos, móveis, instalações, estoque inicial e outros itens necessários.",
   "encaminhamento": "Contador",
   "fonte": "CAIXA – Investimento inicial. Consulta em 25/09/2026."
  },
  {
   "codigo": "M6.R03",
   "pergunta": "M6.P02",
   "condicao": "Resposta diferente de “Não sei”",
   "texto": "O valor informado será utilizado como estimativa do investimento inicial necessário para o negócio.",
   "alerta": "O valor é uma estimativa e pode mudar conforme os preços e as necessidades do negócio.",
   "lacuna": "Ainda é necessário saber como e quando esse valor será pago.",
   "proximo": "Informe como pretende pagar esse investimento.",
   "encaminhamento": "Nenhum",
   "fonte": "CAIXA – Investimento inicial. Consulta em 25/09/2026."
  },
  {
   "codigo": "M6.R04",
   "pergunta": "M6.P02",
   "condicao": "Não sei",
   "texto": "Sem uma estimativa de valor, não é possível calcular o investimento inicial com os dados informados.",
   "alerta": "A projeção financeira ficará incompleta.",
   "lacuna": "Valor aproximado dos itens que precisam ser comprados ou investidos.",
   "proximo": "Pesquise preços e informe valores aproximados para os principais itens.",
   "encaminhamento": "Nenhum",
   "fonte": "CAIXA – Investimento inicial. Consulta em 25/09/2026."
  },
  {
   "codigo": "M6.R05",
   "pergunta": "M6.P03",
   "condicao": "Resposta = “Parcelado” ou “Parte à vista e parte parcelado”",
   "texto": "O pagamento parcelado distribui a saída de dinheiro ao longo do tempo e deve ser considerado no fluxo de caixa.",
   "alerta": "Parcelamentos podem gerar pagamentos em períodos futuros e reduzir a disponibilidade de caixa.",
   "lacuna": "Ainda é necessário saber quando os pagamentos ocorrerão.",
   "proximo": "Informe quando precisa pagar as compras ou investimentos.",
   "encaminhamento": "Nenhum",
   "fonte": "CAIXA – Planeje as saídas. Consulta em 25/09/2026."
  },
  {
   "codigo": "M6.R06",
   "pergunta": "M6.P03",
   "condicao": "À vista",
   "texto": "O pagamento à vista será considerado como uma saída de dinheiro no momento previsto para o pagamento.",
   "alerta": "O pagamento à vista concentra a saída de dinheiro em um único momento e pode alterar a disponibilidade de caixa.",
   "lacuna": "Data ou momento do pagamento.",
   "proximo": "Informe quando o pagamento será realizado.",
   "encaminhamento": "Nenhum",
   "fonte": "CAIXA – Planeje as saídas. Consulta em 25/09/2026."
  },
  {
   "codigo": "M6.R07",
   "pergunta": "M6.P03",
   "condicao": "Não sei",
   "texto": "A forma de pagamento ainda não foi definida. Essa informação ajuda a identificar quando o dinheiro sairá do caixa.",
   "alerta": "Pagamentos à vista e parcelados geram saídas de dinheiro em momentos diferentes.",
   "lacuna": "Forma de pagamento do investimento.",
   "proximo": "Verifique se o pagamento será à vista, parcelado ou parte à vista e parte parcelado.",
   "encaminhamento": "Nenhum",
   "fonte": "CAIXA – Planeje as saídas. Consulta em 25/09/2026."
  },
  {
   "codigo": "M6.R08",
   "pergunta": "M6.P04",
   "condicao": "Resposta diferente de “Não sei”",
   "texto": "A estimativa de vendas será utilizada para projetar as entradas de dinheiro do negócio.",
   "alerta": "Vender não significa necessariamente receber o dinheiro no mesmo momento. A projeção não representa uma garantia de vendas ou recebimentos.",
   "lacuna": "Ainda é necessário saber quando o dinheiro das vendas será recebido.",
   "proximo": "Informe o prazo esperado para receber as vendas.",
   "encaminhamento": "Nenhum",
   "fonte": "SEBRAE/SC – Como fazer o fluxo de caixa. Consulta em 25/09/2026."
  },
  {
   "codigo": "M6.R09",
   "pergunta": "M6.P04",
   "condicao": "Não sei",
   "texto": "Sem uma estimativa de vendas, não é possível projetar as entradas de dinheiro relacionadas às vendas.",
   "alerta": "A projeção do fluxo de caixa ficará incompleta.",
   "lacuna": "Quantidade ou valor esperado de vendas por período.",
   "proximo": "Faça uma estimativa das vendas esperadas para o período analisado.",
   "encaminhamento": "Nenhum",
   "fonte": "Sebrae-SC – Como fazer o fluxo de caixa. Consulta em 25/09/2026."
  },
  {
   "codigo": "M6.R10",
   "pergunta": "M6.P05",
   "condicao": "Resposta = “Sim”",
   "texto": "A necessidade de estoque será considerada na organização das compras e das necessidades financeiras do negócio.",
   "alerta": "Estoque em excesso pode manter recursos financeiros parados e aumentar perdas.",
   "lacuna": "Ainda é necessário estimar o valor do estoque necessário.",
   "proximo": "Informe o valor estimado do estoque que precisa comprar ou manter.",
   "encaminhamento": "Nenhum",
   "fonte": "SEBRAE – Planilha controle de estoque: evite perdas e excesso. Consulta em 25/09/2026."
  },
  {
   "codigo": "M6.R11",
   "pergunta": "M6.P05",
   "condicao": "Não sei",
   "texto": "Ainda não foi possível identificar se o negócio precisará comprar ou manter estoque.",
   "alerta": "A necessidade de estoque pode alterar as compras e os recursos necessários para o negócio.",
   "lacuna": "Necessidade de estoque.",
   "proximo": "Verifique se o negócio precisa manter produtos, mercadorias ou materiais em estoque.",
   "encaminhamento": "Nenhum",
   "fonte": "Sebrae – Planilha de controle de estoque. Consulta em 25/09/2026."
  },
  {
   "codigo": "M6.R12",
   "pergunta": "M6.P05",
   "condicao": "Não  ",
   "texto": "Se o negócio não precisar manter estoque, essa necessidade não será considerada na projeção financeira do módulo.",
   "alerta": "Verifique se existem compras de materiais, produtos ou mercadorias que possam representar uma necessidade de estoque.",
   "lacuna": "Confirmar se realmente não haverá necessidade de estoque.",
   "proximo": "Continue para as próximas informações sobre vendas, pagamentos e recebimentos.",
   "encaminhamento": "Nenhum",
   "fonte": "Sebrae – Planilha de controle de estoque. Consulta em 25/09/2026."
  },
  {
   "codigo": "M6.R13",
   "pergunta": "M6.P06",
   "condicao": "Resposta diferente de “Não sei”",
   "texto": "O valor informado será considerado na estimativa das necessidades financeiras relacionadas ao estoque.",
   "alerta": "O valor do estoque é uma estimativa e pode variar conforme quantidade, preços e necessidade de reposição.",
   "lacuna": "Ainda é necessário saber quando e como essas compras serão pagas.",
   "proximo": "Informe quando precisa pagar as compras ou investimentos.",
   "encaminhamento": "Nenhum",
   "fonte": "SEBRAE – Planilha controle de estoque: evite perdas e excesso. Consulta em 25/09/2026."
  },
  {
   "codigo": "M6.R14",
   "pergunta": "M6.P06",
   "condicao": "Não sei",
   "texto": "Sem uma estimativa do valor do estoque, não é possível projetar a necessidade financeira relacionada a essas compras.",
   "alerta": "O valor necessário para estoque ficará fora da projeção.",
   "lacuna": "Valor aproximado do estoque necessário.",
   "proximo": "Estime o valor do estoque inicial ou das compras de reposição.",
   "encaminhamento": "Nenhum",
   "fonte": "Sebrae – Planilha de controle de estoque. Consulta em 25/09/2026."
  },
  {
   "codigo": "M6.R15",
   "pergunta": "M6.P07",
   "condicao": "Resposta diferente de “Não sei”",
   "texto": "O prazo informado será considerado na projeção das saídas de dinheiro do negócio.",
   "alerta": "A data da compra e a data do pagamento podem ser diferentes. O prazo de pagamento afeta a disponibilidade de caixa.",
   "lacuna": "Ainda é necessário comparar os pagamentos com os prazos de recebimento das vendas.",
   "proximo": "Informe quando espera receber o dinheiro das vendas.",
   "encaminhamento": "Nenhum",
   "fonte": "CAIXA – Planeje as saídas. Consulta em 25/09/2026."
  },
  {
   "codigo": "M6.R16",
   "pergunta": "M6.P07",
   "condicao": "Não sei",
   "texto": "Sem o prazo de pagamento, não é possível definir quando ocorrerão as saídas de dinheiro no fluxo de caixa.",
   "alerta": "O momento do pagamento pode ser diferente do momento da compra.",
   "lacuna": "Prazo ou data de pagamento.",
   "proximo": "Verifique as condições de pagamento previstas para as compras e investimentos.",
   "encaminhamento": "Nenhum",
   "fonte": "CAIXA – Planeje as saídas. Consulta em 25/09/2026."
  },
  {
   "codigo": "M6.R17",
   "pergunta": "M6.P08",
   "condicao": "Resposta diferente de “Não sei”",
   "texto": "O prazo informado será considerado na projeção das entradas de dinheiro no fluxo de caixa.",
   "alerta": "Uma venda não significa necessariamente dinheiro disponível imediatamente. O recebimento pode ocorrer posteriormente.",
   "lacuna": "Ainda é necessário comparar os recebimentos com os pagamentos previstos.",
   "proximo": "Compare os prazos de recebimento com os prazos de pagamento.",
   "encaminhamento": "Nenhum",
   "fonte": "CAIXA – Organize as entradas. Consulta em 25/09/2026."
  },
  {
   "codigo": "M6.R18",
   "pergunta": "M6.P08",
   "condicao": "Não sei",
   "texto": "Sem o prazo de recebimento, não é possível definir quando o dinheiro das vendas entrará no caixa.",
   "alerta": "Uma venda realizada não significa necessariamente recebimento imediato.",
   "lacuna": "Prazo ou data de recebimento das vendas.",
   "proximo": "Verifique quando o pagamento das vendas será recebido.",
   "encaminhamento": "Nenhum",
   "fonte": "CAIXA – Organize as entradas. Consulta em 25/09/2026."
  },
  {
   "codigo": "M6.R19",
   "pergunta": "M6.P09",
   "condicao": "Resposta diferente de “Não sei”",
   "texto": "O valor informado poderá ser considerado na projeção da disponibilidade de caixa do negócio.",
   "alerta": "Informe apenas um valor que você deseja utilizar na simulação. Não informe dados bancários, número de conta ou outras informações financeiras sensíveis.",
   "lacuna": "Ainda é necessário comparar os recursos disponíveis com as necessidades de investimento e funcionamento do negócio.",
   "proximo": "Compare o dinheiro disponível com os pagamentos e necessidades financeiras projetadas.",
   "encaminhamento": "Nenhum",
   "fonte": "CAIXA – Caixa futuro. Consulta em 25/09/2026."
  },
  {
   "codigo": "M6.R20",
   "pergunta": "M6.P09",
   "condicao": "Não sei",
   "texto": "Sem informar o valor disponível, a projeção não considerará os recursos que já podem estar disponíveis para o negócio.",
   "alerta": "O resultado será uma projeção baseada apenas nas demais informações fornecidas.",
   "lacuna": "Valor disponível para investir ou manter o negócio funcionando.",
   "proximo": "Se possível, informe uma estimativa do valor disponível para a simulação.",
   "encaminhamento": "Nenhum",
   "fonte": "CAIXA – Caixa futuro. Consulta em 25/09/2026."
  },
  {
   "codigo": "M6.R21",
   "pergunta": "M6.P10",
   "condicao": "Resposta diferente de “Não sei”",
   "texto": "Registre o pagamento ou recebimento e o prazo específico para que ele possa ser considerado na projeção do fluxo de caixa.",
   "alerta": "Prazos diferentes dos anteriores podem alterar a disponibilidade de dinheiro em cada período.",
   "lacuna": "Ainda é necessário informar o valor e a data ou prazo desse pagamento ou recebimento.",
   "proximo": "Registre a situação e considere seu impacto no fluxo de caixa.",
   "encaminhamento": "Nenhum",
   "fonte": "CAIXA – Planeje as saídas; CAIXA – Organize as entradas. Consulta em 25/09/2026."
  },
  {
   "codigo": "M6.R22",
   "pergunta": "M6.P10",
   "condicao": "Não sei",
   "texto": "Não foi identificada nenhuma condição diferente de pagamento ou recebimento.",
   "alerta": "Caso existam prazos específicos, eles podem alterar a disponibilidade de dinheiro ao longo do período.",
   "lacuna": "Existência de algum pagamento ou recebimento com prazo diferente.",
   "proximo": "Verifique se há alguma condição específica que ainda não foi informada.",
   "encaminhamento": "Nenhum",
   "fonte": "CAIXA – Planeje as saídas / Organize as entradas. Consulta em 25/09/2026."
  }
 ],
 "instrumentos": [
  {
   "codigo": "M6.I01",
   "nome": "Calculadora de investimento inicial",
   "tipo": "Calculadora",
   "objetivo": "Estimar o valor necessário para realizar os investimentos e iniciar o negócio.",
   "perguntas": "M6.P01, M6.P02, M6.P03",
   "mostra": "Valor estimado do investimento inicial.",
   "regra": "Investimento inicial = soma dos valores dos equipamentos + instalações + estoque inicial + outros gastos necessários para iniciar o negócio.",
   "ex_entrada": "Equipamentos: R$ 2.000; instalações: R$ 500; estoque inicial: R$ 1.000.",
   "ex_saida": "R$ 3.500 de investimento inicial estimado.",
   "limite": "Estimativa baseada nos valores informados; não representa garantia de que esse será o valor final necessário.",
   "onde": "Arquivo M6_I01_investimento_inicial.xlsx",
   "fonte": "CAIXA – Investimento inicial, 25/09/2026",
   "status": "Rascunho"
  },
  {
   "codigo": "M6.I02",
   "nome": "Calculadora de prioridade de compras",
   "tipo": "Checklist",
   "objetivo": "Organizar as compras de acordo com a necessidade do negócio.",
   "perguntas": "M6.P01, M6.P02, M6.P03",
   "mostra": "Classificação dos itens por prioridade de compra.",
   "regra": "Prioridade = classificar cada item conforme a necessidade para iniciar ou manter a operação: essencial agora, necessário depois, desejável ou dispensável.",
   "ex_entrada": "Equipamento essencial: R$ 2.000; decoração: R$ 800.",
   "ex_saida": "Equipamento: essencial agora; decoração: desejável.",
   "limite": "A classificação é uma organização das informações e não determina que uma compra deva ser realizada.",
   "onde": "Aba 5 – Instrumentos",
   "fonte": "Material do Módulo 6, 25/09/2026",
   "status": "Rascunho"
  },
  {
   "codigo": "M6.I03",
   "nome": "Controle de entradas e saídas",
   "tipo": "Tabela",
   "objetivo": "Organizar os valores e os momentos previstos de entrada e saída de dinheiro.",
   "perguntas": "M6.P04, M6.P07, M6.P08, M6.P10",
   "mostra": "Entradas, saídas e saldo previsto em cada período.",
   "regra": "Saldo do período = saldo inicial + entradas recebidas − saídas pagas.",
   "ex_entrada": "Saldo inicial: R$ 2.000; recebimento: R$ 1.500.",
   "ex_saida": "Após uma saída de R$ 800, saldo previsto de R$ 2.700.",
   "limite": "Venda realizada não significa necessariamente dinheiro recebido no mesmo período; considerar os prazos informados.",
   "onde": "Aba 5 – Instrumentos",
   "fonte": "CAIXA – Organize as entradas / Planeje as saídas, 25/09/2026",
   "status": "Rascunho"
  },
  {
   "codigo": "M6.I04",
   "nome": "Fluxo de caixa de 13 semanas",
   "tipo": "Planilha",
   "objetivo": "Projetar a movimentação e a disponibilidade de caixa ao longo de 13 semanas.",
   "perguntas": "M6.P04, M6.P07, M6.P08, M6.P09, M6.P10",
   "mostra": "Saldo projetado de caixa para cada uma das 13 semanas.",
   "regra": "Saldo final da semana = saldo inicial da semana + entradas previstas − saídas previstas. O saldo final de uma semana passa a ser o saldo inicial da semana seguinte.",
   "ex_entrada": "Saldo inicial: R$ 2.000; entrada na semana: R$ 1.000.",
   "ex_saida": "Se houver saída de R$ 1.500, saldo final da semana = R$ 1.500.",
   "limite": "Alertar quando as saídas previstas forem maiores que os recursos disponíveis no período.",
   "onde": "Arquivo M6_I04_fluxo_13_semanas.xlsx",
   "fonte": "CAIXA – Caixa futuro, 25/09/2026",
   "status": "Rascunho"
  },
  {
   "codigo": "M6.I05",
   "nome": "Simulador de cenários e alertas",
   "tipo": "Calculadora",
   "objetivo": "Observar como alterações nas vendas, pagamentos e recebimentos podem modificar o caixa projetado.",
   "perguntas": "M6.P04, M6.P07, M6.P08, M6.P09, M6.P10",
   "mostra": "Diferentes projeções de saldo e períodos que exigem atenção.",
   "regra": "Saldo do cenário = saldo inicial + entradas previstas no cenário − saídas previstas no cenário.",
   "ex_entrada": "Cenário: R$ 3.000 de entradas e R$ 2.500 de saídas.",
   "ex_saida": "Saldo projetado = R$ 500, considerando saldo inicial igual a zero.",
   "limite": "Alertar quando houver período com saídas previstas superiores às entradas e ao saldo disponível.",
   "onde": "Aba 5 – Instrumentos",
   "fonte": "CAIXA – Caixa futuro, 25/09/2026",
   "status": "Rascunho"
  }
 ],
 "educativo": [
  {
   "codigo": "M6.E01",
   "tipo": "Entenda",
   "onde": "M6.P01",
   "titulo": "O que é investimento inicial?",
   "texto": "Investimento inicial é o conjunto de recursos necessários para começar o negócio, como equipamentos, instalações, estoque inicial e outros gastos necessários para iniciar a operação.",
   "exemplo": "Uma loja pode precisar de equipamentos, móveis, instalações e estoque inicial antes de começar a funcionar.",
   "fonte": "CAIXA – Investimento inicial, 25/09/2026"
  },
  {
   "codigo": "M6.E02",
   "tipo": "Entenda",
   "onde": "M6.P04",
   "titulo": "Vender é diferente de receber",
   "texto": "Uma venda representa uma entrada prevista, mas o dinheiro pode ser recebido em outro momento. Por isso, o prazo de recebimento precisa ser considerado no fluxo de caixa.",
   "exemplo": "Uma venda de R$ 1.000 pode ser realizada hoje e recebida somente daqui a 30 dias.",
   "fonte": "CAIXA – Organize as entradas, 25/09/2026"
  },
  {
   "codigo": "M6.E03",
   "tipo": "Entenda",
   "onde": "M6.P07",
   "titulo": "Comprar é diferente de pagar",
   "texto": "A compra pode acontecer em uma data e o pagamento em outra. Registrar o prazo de pagamento ajuda a identificar quando o dinheiro realmente sairá do caixa.",
   "exemplo": "Uma compra de R$ 800 pode ser feita hoje e paga em 30 dias.",
   "fonte": "CAIXA – Planeje as saídas, 25/09/2026"
  },
  {
   "codigo": "M6.E04",
   "tipo": "Entenda",
   "onde": "M6.P09",
   "titulo": "O que é capital de giro?",
   "texto": "Capital de giro está relacionado aos recursos necessários para manter o funcionamento do negócio enquanto existem pagamentos a realizar e valores de vendas que ainda serão recebidos.",
   "exemplo": "O negócio pode precisar de dinheiro para pagar despesas antes de receber pelas vendas realizadas.",
   "fonte": "CAIXA – Planeje as saídas, 25/09/2026"
  },
  {
   "codigo": "M6.E05",
   "tipo": "Entenda",
   "onde": "M6.P04",
   "titulo": "O que é fluxo de caixa?",
   "texto": "O negócio pode precisar de dinheiro para pagar despesas antes de receber pelas vendas realizadas.",
   "exemplo": "Registrar valores que serão recebidos e pagos nas próximas semanas.",
   "fonte": "CAIXA – Caixa futuro, 25/09/2026"
  },
  {
   "codigo": "M6.E06",
   "tipo": "Faça",
   "onde": "M6.P01",
   "titulo": "Organize suas compras",
   "texto": "Liste os itens necessários para iniciar o negócio, informe os valores estimados e organize as compras de acordo com a necessidade para começar ou manter a operação.",
   "exemplo": "Equipamento de R$ 2.000 como item essencial e decoração de R$ 800 como item que pode ficar para depois.",
   "fonte": "CAIXA – Investimento inicial, 25/09/2026"
  },
  {
   "codigo": "M6.E07",
   "tipo": "Faça",
   "onde": "M6.P07",
   "titulo": "Registre os prazos",
   "texto": "Informe quando cada compra ou investimento precisará ser pago. O prazo será considerado na organização das saídas de dinheiro do negócio.",
   "exemplo": "Compra realizada hoje com pagamento previsto para 30 dias.",
   "fonte": "CAIXA – Planeje as saídas, 25/09/2026"
  },
  {
   "codigo": "M6.E08",
   "tipo": "Faça",
   "onde": "M6.P08",
   "titulo": "Registre quando você recebe",
   "texto": "Informe quando o dinheiro das vendas deverá entrar no caixa. Isso ajuda a diferenciar a venda realizada do momento em que o dinheiro estará disponível.",
   "exemplo": "Venda realizada hoje com recebimento previsto para 15 dias.",
   "fonte": "CAIXA – Organize as entradas, 25/09/2026"
  },
  {
   "codigo": "M6.E09",
   "tipo": "Faça",
   "onde": "M6.P09",
   "titulo": "Observe as próximas 13 semanas",
   "texto": "Organize as entradas e saídas previstas para cada semana. O saldo final de uma semana passa a ser o saldo inicial da semana seguinte.",
   "exemplo": "Saldo inicial de R$ 2.000 + R$ 1.000 de entradas − R$ 1.500 de saídas = R$ 1.500.",
   "fonte": "CAIXA – Caixa futuro, 25/09/2026"
  },
  {
   "codigo": "M6.E10",
   "tipo": "Use a IA com cuidado",
   "onde": "M6.P01",
   "titulo": "Use a IA para organizar, não para inventar valores",
   "texto": "A IA pode ajudar a lembrar itens que podem ser necessários para iniciar um negócio, mas não conhece os preços reais das suas compras. Use-a para organizar ideias e confirme os valores em suas anotações e com fornecedores.",
   "exemplo": "Para uma pequena loja, a IA pode lembrar de equipamentos, móveis, estoque e materiais de apoio.",
   "prompt": "Liste os principais itens que podem ser necessários para iniciar um pequeno negócio de [tipo de negócio]. Não informe preços e não invente valores. Apenas organize os itens por categoria.",
   "conferir": "Confira se os itens realmente fazem sentido para o negócio e pesquise os valores reais antes de utilizá-los.",
   "fonte": "Guia do Desafio – Redação responsável, 25/09/2026"
  },
  {
   "codigo": "M6.E11",
   "tipo": "Use a IA com cuidado",
   "onde": "M6.P04",
   "titulo": "Não peça à IA para prever suas vendas",
   "texto": "A IA pode ajudar a organizar hipóteses de vendas, mas não deve ser usada como garantia de quanto o negócio venderá. Os valores utilizados precisam vir de premissas definidas pelo usuário.",
   "exemplo": "Comparar um cenário de vendas menor, um intermediário e um maior, usando valores informados pelo usuário.",
   "prompt": "Organize três cenários de vendas para [tipo de negócio] usando somente estes valores e premissas: [informar dados]. Não invente dados de mercado nem apresente os cenários como previsão garantida.",
   "conferir": "Confira se os valores usados pela IA são exatamente os que você informou e se as hipóteses fazem sentido para o seu negócio.",
   "fonte": "Guia do Desafio – Redação responsável, 25/09/2026"
  },
  {
   "codigo": "M6.E12",
   "tipo": "Use a IA com cuidado",
   "onde": "M6.P08",
   "titulo": "Confira os prazos antes de usar a simulação",
   "texto": "A IA pode ajudar a organizar informações sobre pagamentos e recebimentos, mas as datas e os prazos precisam ser conferidos. Um prazo interpretado de forma errada pode alterar a projeção do fluxo de caixa.",
   "exemplo": "Uma venda recebida em 30 dias não deve ser registrada como entrada disponível no dia da venda.",
   "prompt": "Organize os seguintes pagamentos e recebimentos por data, usando somente as informações fornecidas: [inserir dados]. Não altere os prazos nem invente datas.",
   "conferir": "Compare a resposta da IA com notas, contratos, pedidos ou outras informações usadas para definir os prazos.",
   "fonte": "Guia do Desafio – Redação responsável, 25/09/2026"
  }
 ],
 "casos": [
  {
   "codigo": "M6.T01",
   "tipo": "Simples",
   "situacao": "Pessoa que está iniciando uma pequena loja e precisa comprar equipamentos e estoque inicial. Possui parte do dinheiro necessário e pretende pagar algumas compras à vista.",
   "respostas": "M6.P01 = Equipamentos, móveis e estoque inicial; M6.P02 = R$ 5.000; M6.P03 = Parte à vista e parte parcelado; M6.P05 = Sim; M6.P06 = R$ 1.500",
   "texto": "O valor informado será utilizado como estimativa do investimento inicial necessário para o negócio. A necessidade de estoque também será considerada na organização das compras.",
   "alerta": "As estimativas podem mudar e o pagamento parcelado gera saídas futuras.",
   "proximo": "Organize os itens por prioridade e informe quando os pagamentos precisarão ser realizados.",
   "encaminhamento": "Nenhum"
  },
  {
   "codigo": "M6.T02",
   "tipo": "Incompleto",
   "situacao": "Pessoa que ainda não sabe exatamente quanto precisará investir para começar o negócio, mas já sabe que precisará de equipamentos e estoque.",
   "respostas": "M6.P01 = Equipamentos e estoque; M6.P02 = Não sei; M6.P05 = Sim; M6.P06 = Não sei",
   "texto": "Ainda não é possível estimar o investimento inicial e a necessidade financeira relacionada ao estoque com os dados informados.",
   "alerta": "A projeção ficará incompleta enquanto os valores não forem estimados.",
   "proximo": "Pesquise ou estime os valores dos equipamentos e do estoque antes de continuar a simulação.",
   "encaminhamento": "Nenhum"
  },
  {
   "codigo": "M6.T03",
   "tipo": "Contraditório",
   "situacao": "Pessoa que vende produtos pela internet, recebe as vendas em até 30 dias e precisa pagar seus fornecedores em até 7 dias.",
   "respostas": "M6.P04 = R$ 3.000; M6.P07 = Até 7 dias; M6.P08 = Mais de 30 dias; M6.P09 = R$ 2.000",
   "texto": "Os prazos informados serão considerados na projeção das entradas e saídas do fluxo de caixa.",
   "alerta": "O pagamento pode acontecer antes do recebimento das vendas, afetando a disponibilidade de caixa.",
   "proximo": "Compare as datas previstas para pagamentos e recebimentos no fluxo de caixa.",
   "encaminhamento": "Nenhum"
  },
  {
   "codigo": "M6.T04",
   "tipo": "Encaminhamento",
   "situacao": "Pessoa que não sabe informar o valor do investimento inicial e solicita uma análise financeira específica para decidir quanto deveria investir no negócio.",
   "respostas": "M6.P01 = Equipamentos, instalações e estoque; M6.P02 = Não sei; M6.P03 = Não sei; M6.P09 = Não sei",
   "texto": "Os dados disponíveis não permitem estimar adequadamente o investimento necessário.",
   "alerta": "A falta de valores e informações limita a projeção financeira.",
   "proximo": "Levante os valores necessários para continuar a simulação.",
   "encaminhamento": "Contador"
  },
  {
   "codigo": "M6.T05",
   "tipo": "Arriscado",
   "situacao": "Pessoa que possui R$ 1.000 disponíveis, prevê R$ 2.000 em vendas, mas terá R$ 2.500 em pagamentos antes dos recebimentos.",
   "respostas": "M6.P04 = R$ 2.000; M6.P07 = Até 7 dias; M6.P08 = Mais de 30 dias; M6.P09 = R$ 1.000",
   "texto": "A projeção deve considerar o momento das entradas e saídas informadas e identificar períodos de atenção na disponibilidade de caixa.",
   "alerta": "Os pagamentos previstos podem superar os recursos disponíveis antes do recebimento das vendas.",
   "proximo": "Revise os prazos de pagamento e recebimento e simule o fluxo das próximas semanas.",
   "encaminhamento": "Nenhum"
  }
 ]
};
