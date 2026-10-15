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
  "objetivo": "Ajudar a pessoa a listar o que precisa comprar, estimar os gastos, organizar os pagamentos e prever quando o dinheiro pode entrar e sair do negócio.",
  "usuario": "Pessoas que estão planejando abrir um negócio ou que já vendem produtos ou prestam serviços e querem organizar melhor o dinheiro.",
  "decisoes": "Listar o que precisa comprar, estimar os gastos iniciais, registrar despesas e prazos de pagamento e recebimento e acompanhar uma previsão de dinheiro para as próximas 13 semanas.",
  "nao_faz": "O aplicativo organiza informações e estimativas; não garante vendas, lucro ou que haverá dinheiro suficiente. Não decide pelo usuário nem substitui orientação financeira ou contábil profissional.",
  "mensagem_limite": "O app oferece apoio educacional básico. As estimativas dependem dos dados fornecidos e não garantem resultados. Regras de registro, tributação, licenciamento e exercício profissional devem ser confirmadas em fontes oficiais e com profissionais habilitados.",
  "ter_em_maos": "Lista de compras e gastos, valores aproximados, vendas ou receitas esperadas, despesas, dinheiro que a pessoa pretende usar e prazos de pagamentos e recebimentos.",
  "entrega": "Estimativa dos gastos para começar, lista de prioridades, previsão de entradas e saídas por 13 semanas e avisos sobre períodos em que o dinheiro pode não ser suficiente.",
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
   "status": "Aprovado"
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
   "status": "Aprovado"
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
   "status": "Aprovado"
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
   "status": "Aprovado"
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
   "data": "26/09/2026",
   "status": "Aprovado"
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
   "data": "26/09/2026",
   "status": "Aprovado"
  },
  {
   "codigo": "M6.BT07",
   "conceito": "Estoque",
   "definicao": "Produtos e materiais que o negócio mantém disponíveis para usar ou vender.",
   "porque": "Produtos, mercadorias ou materiais mantidos pelo negócio para venda ou utilização em suas atividades.",
   "exemplo": "A compra e manutenção de estoque utilizam recursos financeiros e podem afetar o capital de giro.",
   "tipo_fonte": "Institucional",
   "fonte": "Sebrae ",
   "link": "https://sebrae.com.br/empreendedores/conteudos/gerenciar/planilha-controle-de-estoque--evite-perdas-e-excesso",
   "data": "26/09/2026",
   "status": "Aprovado"
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
   "data": "26/09/2026",
   "status": "Aprovado"
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
   "data": "26/09/2026",
   "status": "Aprovado"
  }
 ],
 "perguntas": [
  {
   "secao": "GERAL"
  },
  {
   "codigo": "M6.P01",
   "modulo": "M6",
   "pergunta": "O que você precisa comprar ou pagar para começar seu negócio?",
   "ajuda": "Pense em equipamentos, móveis, ferramentas, instalações, materiais, estoque e outros itens necessários para começar.",
   "tipo": "Texto",
   "condicao": "sempre",
   "opcoes": "Não sei",
   "resposta": "Vamos usar sua resposta para organizar o que você precisa comprar ou pagar antes de começar.",
   "alerta": "Se incluir itens que não são essenciais no início, o valor necessário para começar pode ficar maior.",
   "proximo": "Liste os itens e, se puder, estime quanto custa cada um.",
   "fonte": "CAIXA – Investimento inicial. Consulta em 25/09/2026.",
   "status": "Rascunho"
  },
  {
   "codigo": "M6.P02",
   "modulo": "M6",
   "pergunta": "Quanto você estima gastar com esses itens?",
   "ajuda": "Some os valores aproximados dos itens que você listou. Se ainda não souber, escolha “Não sei”.",
   "tipo": "Número",
   "condicao": "M6.P01 ≠ Não sei",
   "opcoes": "Não sei",
   "resposta": "Vamos usar esse valor como uma estimativa do dinheiro necessário para começar.",
   "alerta": "Os preços podem mudar, então o valor final pode ser diferente da estimativa.",
   "proximo": "Veja quais itens são essenciais para começar e quais podem ficar para depois.",
   "fonte": "CAIXA – Investimento inicial. Consulta em 25/09/2026.",
   "status": "Rascunho"
  },
  {
   "codigo": "M6.P03",
   "modulo": "M6",
   "pergunta": "Como você pretende pagar por essas compras ou gastos?",
   "ajuda": "Escolha a forma de pagamento que pretende usar.",
   "tipo": "Escolha",
   "condicao": "M6.P02 ≠ Não sei",
   "opcoes": "À vista; Parcelado; Parte à vista e parte parcelado; Não sei",
   "resposta": "Sua resposta ajuda a estimar quando o dinheiro sairá do negócio.",
   "alerta": "Se pagar parcelado, você terá pagamentos para fazer mais adiante.",
   "proximo": "Informe quando cada pagamento deverá ser feito.",
   "fonte": "CAIXA – Planeje as saídas. Consulta em 25/09/2026.",
   "status": "Rascunho"
  },
  {
   "codigo": "M6.P04",
   "modulo": "M6",
   "pergunta": "Quais formas de pagamento seus clientes poderão usar?",
   "ajuda": "Marque as formas de pagamento que você pretende aceitar dos clientes.",
   "tipo": "Escolha",
   "condicao": "sempre",
   "opcoes": "Dinheiro; Pix; Cartão de débito; Cartão de crédito à vista; Cartão de crédito parcelado; Boleto; Transferência bancária; Outra forma; Não sei",
   "resposta": "A forma de pagamento ajuda a estimar quando o dinheiro das vendas ficará disponível.",
   "alerta": "O dia da venda pode ser diferente do dia em que o dinheiro fica disponível, principalmente no cartão de crédito ou em pagamentos parcelados.",
   "proximo": "Se souber, informe quanto tempo cada forma de pagamento leva para liberar o dinheiro.",
   "fonte": "CAIXA – Organize as entradas. Consulta em 25/09/2026.",
   "status": "Rascunho"
  },
  {
   "codigo": "M6.P05",
   "modulo": "M6",
   "pergunta": "Quanto você espera vender em um mês?",
   "ajuda": "Informe uma estimativa do valor que espera vender com seus produtos ou serviços. Se não souber, escolha “Não sei”.",
   "tipo": "Número",
   "condicao": "sempre",
   "opcoes": "Não sei",
   "resposta": "Vamos usar sua estimativa para calcular quanto dinheiro pode entrar no negócio.",
   "alerta": "Esse valor é uma previsão, não uma garantia de venda ou de recebimento.",
   "proximo": "Informe quando espera receber o dinheiro dessas vendas.",
   "fonte": "Sebrae-SC – Como fazer o fluxo de caixa. Consulta em 25/09/2026.",
   "status": "Rascunho"
  },
  {
   "codigo": "M6.P06",
   "modulo": "M6",
   "pergunta": "Quais gastos você espera ter para manter o negócio funcionando?",
   "ajuda": "Pense, por exemplo, em aluguel, energia, internet, telefone, transporte, divulgação, taxas e outros gastos.",
   "tipo": "Texto",
   "condicao": "sempre",
   "opcoes": "Não sei",
   "resposta": "Vamos considerar esses gastos na estimativa do dinheiro que sairá do negócio.",
   "alerta": "Alguns gastos continuam mesmo nos meses em que você vende menos.",
   "proximo": "Se puder, estime o valor de cada gasto e a frequência com que precisa pagá-lo.",
   "fonte": "Elaboração do grupo com base em M6.BT04 e M6.BT05. Consulta em 25/09/2026.",
   "status": "Rascunho"
  },
  {
   "codigo": "M6.P07",
   "modulo": "M6",
   "pergunta": "Quanto dinheiro você já tem e pretende usar no negócio?",
   "ajuda": "Informe apenas o valor que pretende usar para começar ou manter o negócio funcionando.",
   "tipo": "Número",
   "condicao": "sempre",
   "opcoes": "Não sei",
   "resposta": "Esse valor ajuda a estimar quanto dinheiro estará disponível para pagar os gastos do negócio.",
   "alerta": "Não informe senhas, dados bancários ou outras informações pessoais.",
   "proximo": "Compare esse valor com os gastos e pagamentos que você espera ter.",
   "fonte": "CAIXA – Caixa futuro. Consulta em 25/09/2026.",
   "status": "Rascunho"
  },
  {
   "codigo": "M6.P08",
   "modulo": "M6",
   "pergunta": "Depois de uma venda, quando você espera receber o dinheiro?",
   "ajuda": "Pense no tempo entre a venda e o momento em que o dinheiro fica disponível para você.",
   "tipo": "Escolha",
   "condicao": "M6.P04 ≠ Não sei",
   "opcoes": "Na hora; Até 7 dias; 8 a 30 dias; Mais de 30 dias; Não sei",
   "resposta": "Vamos usar esse prazo para estimar quando o dinheiro das vendas entrará no negócio.",
   "alerta": "Vender não significa necessariamente receber na mesma hora.",
   "proximo": "Compare os prazos de recebimento com as datas em que você precisa pagar as contas.",
   "fonte": "CAIXA – Organize as entradas. Consulta em 25/09/2026.",
   "status": "Rascunho"
  },
  {
   "codigo": "M6.P09",
   "modulo": "M6",
   "pergunta": "Há algum pagamento ou recebimento que acontecerá em um prazo diferente dos anteriores?",
   "ajuda": "Conte se houver alguma conta, compra ou venda com um prazo diferente dos anteriores.",
   "tipo": "Texto",
   "condicao": "sempre",
   "opcoes": "Não sei",
   "resposta": "Essa informação ajuda a montar uma previsão mais próxima da movimentação de dinheiro do negócio.",
   "alerta": "Prazos diferentes podem fazer faltar dinheiro em um período, mesmo quando você espera receber depois.",
   "proximo": "Informe o valor e a data ou o prazo, se souber.",
   "fonte": "CAIXA – Planeje as saídas / Organize as entradas. Consulta em 25/09/2026.",
   "status": "Rascunho"
  },
  {
   "secao": "SERVIÇOS"
  },
  {
   "codigo": "M6.P10",
   "modulo": "M6",
   "pergunta": "Quais equipamentos, ferramentas ou materiais você precisa para prestar o serviço?",
   "ajuda": "Pense em ferramentas, equipamentos e materiais necessários para atender seus clientes.",
   "tipo": "Texto",
   "condicao": "Negócio = Serviço",
   "opcoes": "Não sei",
   "resposta": "Sua resposta ajuda a identificar o que você precisa comprar para começar ou realizar o serviço.",
   "alerta": "Compras que podem esperar talvez não precisem ser feitas logo no início.",
   "proximo": "Se puder, estime o preço de cada item.",
   "fonte": "CAIXA – Investimento inicial. Consulta em 25/09/2026.",
   "status": "Rascunho"
  },
  {
   "codigo": "M6.P11",
   "modulo": "M6",
   "pergunta": "Quanto você estima gastar com esses equipamentos, ferramentas e materiais?",
   "ajuda": "Informe o valor aproximado dos itens que listou. Se não souber, escolha “Não sei”.",
   "tipo": "Número",
   "condicao": "M6.P10 ≠ Não sei",
   "opcoes": "Não sei",
   "resposta": "Vamos usar esse valor para estimar o dinheiro necessário para começar ou prestar o serviço.",
   "alerta": "O preço pode variar conforme o fornecedor e a forma de pagamento.",
   "proximo": "Informe como e quando pretende pagar esses itens.",
   "fonte": "CAIXA – Investimento inicial. Consulta em 25/09/2026.",
   "status": "Rascunho"
  },
  {
   "codigo": "M6.P12",
   "modulo": "M6",
   "pergunta": "Você precisa ter materiais disponíveis para realizar seus serviços?",
   "ajuda": "Por exemplo, produtos de limpeza, ingredientes, peças, embalagens ou outros materiais usados no atendimento.",
   "tipo": "Sim/Não",
   "condicao": "Negócio = Serviço",
   "opcoes": "Sim; Não; Não sei",
   "resposta": "Sua resposta ajuda a identificar se você precisa comprar materiais antes de realizar os serviços.",
   "alerta": "Comprar mais materiais do que precisa pode deixar dinheiro parado no estoque ou causar perdas.",
   "proximo": "Se sim, liste os materiais e estime quanto precisa comprar.",
   "fonte": "Sebrae – Planilha controle de estoque. Consulta em 25/09/2026.",
   "status": "Rascunho"
  },
  {
   "secao": "PRODUTOS"
  },
  {
   "codigo": "M6.P13",
   "modulo": "M6",
   "pergunta": "Quais equipamentos, máquinas ou instalações você precisa para produzir o produto?",
   "ajuda": "Pense em máquinas, equipamentos, ferramentas, móveis e instalações necessários para produzir.",
   "tipo": "Texto",
   "condicao": "Negócio = Produto",
   "opcoes": "Não sei",
   "resposta": "Sua resposta ajuda a identificar o que você precisa comprar para começar a produção.",
   "alerta": "Itens que não são necessários no início podem aumentar o valor que você precisa gastar.",
   "proximo": "Se puder, estime o preço de cada item.",
   "fonte": "CAIXA – Investimento inicial. Consulta em 25/09/2026.",
   "status": "Rascunho"
  },
  {
   "codigo": "M6.P14",
   "modulo": "M6",
   "pergunta": "Qual é o valor estimado desses equipamentos, máquinas ou instalações?",
   "ajuda": "Informe o valor aproximado dos itens que listou. Se não souber, escolha “Não sei”.",
   "tipo": "Número",
   "condicao": "M6.P13 ≠ Não sei",
   "opcoes": "Não sei",
   "resposta": "Vamos usar esse valor para estimar quanto você precisa gastar para começar a produzir.",
   "alerta": "O preço pode variar conforme o fornecedor e a forma de pagamento.",
   "proximo": "Informe como e quando pretende pagar esses itens.",
   "fonte": "CAIXA – Investimento inicial. Consulta em 25/09/2026.",
   "status": "Rascunho"
  },
  {
   "codigo": "M6.P15",
   "modulo": "M6",
   "pergunta": "Quais insumos e materiais você precisar comprar para produzir o produto?",
   "ajuda": "Liste matérias-primas, ingredientes, embalagens e outros materiais usados na produção.",
   "tipo": "Texto",
   "condicao": "Negócio = Produto",
   "opcoes": "Não sei",
   "resposta": "Sua resposta ajuda a identificar os materiais necessários para produzir e se será preciso manter estoque.",
   "alerta": "Comprar materiais em excesso pode deixar dinheiro parado ou aumentar o risco de perdas.",
   "proximo": "Se puder, estime quanto precisará comprar e quanto isso vai custar.",
   "fonte": "Sebrae – Planilha controle de estoque. Consulta em 25/09/2026.",
   "status": "Rascunho"
  },
  {
   "secao": "MERCADORIA"
  },
  {
   "codigo": "M6.P16",
   "modulo": "M6",
   "pergunta": "Quais mercadorias você precisa comprar para revender?",
   "ajuda": "Liste os produtos que pretende comprar de fornecedores para revender aos clientes.",
   "tipo": "Texto",
   "condicao": "Negócio = Mercadoria",
   "opcoes": "Não sei",
   "resposta": "Identifica as mercadorias necessárias para iniciar as vendas.",
   "alerta": "Comprar mercadorias além da necessidade pode imobilizar recursos.",
   "proximo": "Informe o valor estimado da compra inicial.",
   "fonte": "CAIXA – Investimento inicial. Consulta em 25/09/2026."
  },
  {
   "codigo": "M6.P17",
   "modulo": "M6",
   "pergunta": "Quanto você estima gastar na primeira compra desses produtos?",
   "ajuda": "Informe uma estimativa do valor das mercadorias que pretende comprar inicialmente.",
   "tipo": "Número",
   "condicao": "M01 ≠ Não sei",
   "opcoes": "Não sei",
   "resposta": "O valor será considerado na estimativa das necessidades financeiras iniciais.",
   "alerta": "O valor pode variar conforme preços, quantidades e fornecedores.",
   "proximo": "Informe como pretende pagar.",
   "fonte": "Sebrae – Planilha controle de estoque. Consulta em 25/09/2026."
  },
  {
   "codigo": "M6.P18",
   "modulo": "M6",
   "pergunta": "Você pretende manter estoque de mercadorias para continuar realizando vendas?",
   "ajuda": "Pense na quantidade de mercadorias que precisa manter disponível para atender aos clientes.",
   "tipo": "Sim/Não",
   "condicao": "Negócio = Mercadoria",
   "opcoes": "Sim; Não; Não sei",
   "resposta": "Identifica a necessidade de recursos destinados à manutenção do estoque.",
   "alerta": "Estoque em excesso pode imobilizar recursos e aumentar perdas.",
   "proximo": "Se sim, informe quais mercadorias serão mantidas em estoque.",
   "fonte": "Sebrae – Planilha controle de estoque. Consulta em 25/09/2026."
  }
 ],
 "regras": [
  {
   "secao": "GERAL"
  },
  {
   "codigo": "M6.R01",
   "pergunta": "M6.P01",
   "condicao": "Resposta preenchida com lista de itens",
   "texto": "Ótimo! Agora vamos estimar os valores dos itens necessários.",
   "alerta": "A lista pode precisar de revisão para identificar itens essenciais que estejam faltando.",
   "lacuna": "Valores dos itens.",
   "proximo": "Preencher P02.",
   "encaminhamento": "Estimativa do investimento inicial.",
   "fonte": "CAIXA – Investimento inicial. Consulta em 25/09/2026."
  },
  {
   "codigo": "M6.R02",
   "pergunta": "M6.P01",
   "condicao": "Resposta = “Não sei”",
   "texto": "Sem problemas! Pense nos equipamentos, móveis, instalações, estoque inicial e outros itens necessários.",
   "alerta": "O investimento inicial pode ficar incompleto.",
   "lacuna": "Lista de itens necessários.",
   "proximo": "Identificar os itens ou buscar orientação.",
   "encaminhamento": "Orientação para levantamento do investimento.",
   "fonte": "CAIXA – Investimento inicial. Consulta em 25/09/2026."
  },
  {
   "codigo": "M6.R03",
   "pergunta": "M6.P01",
   "condicao": "Resposta vazia",
   "texto": "Informe os itens necessários ou selecione “Não sei”.",
   "alerta": "Informação não preenchida.",
   "lacuna": "Lista de itens necessários.",
   "proximo": "Solicitar resposta.",
   "encaminhamento": "Retornar à P01.",
   "fonte": "CAIXA – Investimento inicial. Consulta em 25/09/2026."
  },
  {
   "codigo": "M6.R04",
   "pergunta": "M6.P02",
   "condicao": "Valor numérico maior que zero",
   "texto": "Valor registrado! Vamos considerar essa estimativa no planejamento.",
   "alerta": "O valor pode mudar após consultar preços e fornecedores.",
   "lacuna": "Confirmar os itens incluídos no valor.",
   "proximo": "Registrar a forma e o prazo de pagamento na P03.",
   "encaminhamento": "Estimativa do investimento."
  },
  {
   "codigo": "M6.R05",
   "pergunta": "M6.P02",
   "condicao": "Valor igual a zero",
   "texto": "Você informou que não terá investimento inicial. Confirme se realmente não há itens a comprar.",
   "alerta": "Verifique se algum gasto inicial ficou de fora.",
   "lacuna": "Confirmar se o investimento é realmente zero.",
   "proximo": "Confirmar ou corrigir o valor.",
   "encaminhamento": "Revisão do investimento inicial."
  },
  {
   "codigo": "M6.R06",
   "pergunta": "M6.P02",
   "condicao": "Resposta = “Não sei”",
   "texto": "Você pode pesquisar os preços e somar os valores estimados.",
   "alerta": "O investimento ainda não está quantificado.",
   "lacuna": "Valor estimado.",
   "proximo": "Levantar os preços ou continuar com a pendência registrada.",
   "encaminhamento": "Orientação para estimativa."
  },
  {
   "codigo": "M6.R07",
   "pergunta": "M6.P02",
   "condicao": "Resposta vazia, negativa ou inválida",
   "texto": "Informe um valor numérico igual ou superior a zero, ou selecione “Não sei”.",
   "alerta": "O valor não foi informado corretamente.",
   "lacuna": "Valor do investimento.",
   "proximo": "Corrigir a resposta.",
   "encaminhamento": "Retornar à P02."
  },
  {
   "codigo": "M6.R08",
   "pergunta": "M6.P03",
   "condicao": "À vista",
   "texto": "Pagamento à vista registrado.",
   "alerta": "Considere a data em que o dinheiro sairá do caixa.",
   "lacuna": "Data e valor do pagamento, se ainda não informados.",
   "proximo": "Registrar o desembolso previsto.",
   "encaminhamento": "Projeção de saídas."
  },
  {
   "codigo": "M6.R09",
   "pergunta": "M6.P03",
   "condicao": "Parcelado",
   "texto": "Pagamento parcelado registrado.",
   "alerta": "As parcelas comprometem o caixa nos períodos seguintes.",
   "lacuna": "Quantidade, valor e datas das parcelas.",
   "proximo": "Levantar as condições do parcelamento.",
   "encaminhamento": "Projeção de saídas futuras."
  },
  {
   "codigo": "M6.R10",
   "pergunta": "M6.P03",
   "condicao": "Parte à vista e parte parcelado",
   "texto": "Forma de pagamento registrada.",
   "alerta": "É necessário considerar tanto a entrada quanto as parcelas.",
   "lacuna": "Valores e datas de cada pagamento.",
   "proximo": "Separar as partes do pagamento.",
   "encaminhamento": "Projeção de saídas."
  },
  {
   "codigo": "M6.R11",
   "pergunta": "M6.P03",
   "condicao": "“Não sei”",
   "texto": "Você pode consultar as condições de pagamento antes de decidir.",
   "alerta": "Sem essa informação, os prazos de saída podem ficar incompletos.",
   "lacuna": "Forma e prazo de pagamento.",
   "proximo": "Consultar as opções disponíveis.",
   "encaminhamento": "Orientação sobre pagamentos."
  },
  {
   "codigo": "M6.R12",
   "pergunta": "M6.P03",
   "condicao": "Resposta vazia ou opção inválida",
   "texto": "Selecione uma forma de pagamento ou “Não sei”.",
   "alerta": "A forma de pagamento não foi identificada.",
   "lacuna": "Forma de pagamento.",
   "proximo": "Corrigir a resposta.",
   "encaminhamento": "Retornar à P03."
  },
  {
   "codigo": "M6.R13",
   "pergunta": "M6.P04",
   "condicao": "Uma ou mais formas válidas selecionadas",
   "texto": "Formas de pagamento registradas! Agora vamos considerar quando cada valor estará disponível.",
   "alerta": "Cada forma pode ter prazo e condições diferentes.",
   "lacuna": "Prazo de recebimento de cada forma selecionada.",
   "proximo": "Informar os prazos na P08.",
   "encaminhamento": "Previsão de entradas."
  },
  {
   "codigo": "M6.R14",
   "pergunta": "M6.P04",
   "condicao": "“Não sei” selecionado, sem outras opções",
   "texto": "Você pode pesquisar quais formas de pagamento pretende oferecer aos clientes.",
   "alerta": "A previsão de recebimentos ainda está incompleta.",
   "lacuna": "Formas de pagamento aceitas.",
   "proximo": "Avaliar as opções disponíveis.",
   "encaminhamento": "Orientação sobre recebimentos."
  },
  {
   "codigo": "M6.R15",
   "pergunta": "M6.P04",
   "condicao": "Nenhuma resposta selecionada",
   "texto": "Selecione as formas de pagamento que pretende aceitar ou “Não sei”.",
   "alerta": "Informação não preenchida.",
   "lacuna": "Formas de pagamento.",
   "proximo": "Solicitar resposta.",
   "encaminhamento": "Retornar à P04."
  },
  {
   "codigo": "M6.R16",
   "pergunta": "M6.P04",
   "condicao": "“Não sei” junto com outras opções",
   "texto": "Você selecionou formas de pagamento e também “Não sei”. Confirme sua resposta.",
   "alerta": "As opções selecionadas são inconsistentes entre si.",
   "lacuna": "Formas de pagamento efetivamente previstas.",
   "proximo": "Manter as opções conhecidas ou selecionar apenas “Não sei”.",
   "encaminhamento": "Confirmar resposta da P04."
  },
  {
   "codigo": "M6.R17",
   "pergunta": "M6.P05",
   "condicao": "Valor ou quantidade válidos informados",
   "texto": "Estimativa registrada! Vamos utilizá-la como referência para o planejamento.",
   "alerta": "A estimativa não garante que as vendas acontecerão.",
   "lacuna": "Confirmar unidade de medida e período, se ainda não informados.",
   "proximo": "Definir quando o dinheiro será recebido.",
   "encaminhamento": "Projeção de vendas e entradas."
  },
  {
   "codigo": "M6.R18",
   "pergunta": "M6.P05",
   "condicao": "Valor igual a zero",
   "texto": "Você informou que não espera realizar vendas nesse período. Confirme se essa é sua previsão.",
   "alerta": "Sem vendas previstas, as entradas podem não cobrir as saídas.",
   "lacuna": "Confirmar o período sem vendas.",
   "proximo": "Confirmar ou corrigir a estimativa.",
   "encaminhamento": "Revisão da previsão de caixa."
  },
  {
   "codigo": "M6.R19",
   "pergunta": "M6.P05",
   "condicao": "“Não sei”",
   "texto": "Você pode começar com uma estimativa e ajustá-la quando tiver mais informações.",
   "alerta": "Não será possível estimar as entradas com precisão.",
   "lacuna": "Quantidade ou valor esperado e período.",
   "proximo": "Estimar vendas por semana ou mês.",
   "encaminhamento": "Orientação para projeção de vendas."
  },
  {
   "codigo": "M6.R20",
   "pergunta": "M6.P05",
   "condicao": "Resposta vazia ou inválida",
   "texto": "Informe uma estimativa válida ou selecione “Não sei”.",
   "alerta": "A previsão de vendas não foi preenchida corretamente.",
   "lacuna": "Quantidade ou valor esperado e período.",
   "proximo": "Corrigir a resposta.",
   "encaminhamento": "Retornar à P05."
  },
  {
   "codigo": "M6.R21",
   "pergunta": "M6.P06",
   "condicao": "Lista de despesas informada",
   "texto": "Despesas registradas! Agora vamos estimar os valores e os vencimentos.",
   "alerta": "A lista pode não incluir todas as despesas do negócio.",
   "lacuna": "Valores e prazos de pagamento.",
   "proximo": "Estimar cada despesa.",
   "encaminhamento": "Planejamento das saídas."
  },
  {
   "codigo": "M6.R22",
   "pergunta": "M6.P06",
   "condicao": "“Não sei”",
   "texto": "Pense em despesas como aluguel, energia, internet, transporte, taxas e outras relacionadas ao negócio.",
   "alerta": "Despesas não identificadas podem comprometer a previsão de caixa.",
   "lacuna": "Lista de despesas.",
   "proximo": "Identificar despesas e estimar valores.",
   "encaminhamento": "Orientação para levantamento de despesas."
  },
  {
   "codigo": "M6.R23",
   "pergunta": "M6.P06",
   "condicao": "Resposta vazia",
   "texto": "Informe as despesas previstas ou selecione “Não sei”.",
   "alerta": "Informação não preenchida.",
   "lacuna": "Lista de despesas.",
   "proximo": "Solicitar resposta.",
   "encaminhamento": "Retornar à P06."
  },
  {
   "codigo": "M6.R24",
   "pergunta": "M6.P07",
   "condicao": "Valor maior que zero",
   "texto": "Valor disponível registrado.",
   "alerta": "Verifique se esse valor também será necessário para despesas pessoais ou outros compromissos.",
   "lacuna": "Confirmar quanto está efetivamente disponível para o negócio.",
   "proximo": "Comparar recursos disponíveis com os investimentos e as saídas previstas.",
   "encaminhamento": "Planejamento do capital disponível."
  },
  {
   "codigo": "M6.R25",
   "pergunta": "M6.P07",
   "condicao": "Valor igual a zero",
   "texto": "Você informou que não possui recursos disponíveis para essa finalidade.",
   "alerta": "O planejamento deve considerar como serão cobertos os gastos iniciais e as saídas previstas.",
   "lacuna": "Identificar recursos ou alternativas de financiamento, se aplicável.",
   "proximo": "Revisar os investimentos e os prazos.",
   "encaminhamento": "Orientação sobre necessidade de recursos."
  },
  {
   "codigo": "M6.R26",
   "pergunta": "M6.P07",
   "condicao": "“Não sei”",
   "texto": "Tente estimar quanto dinheiro poderá destinar ao negócio.",
   "alerta": "Sem essa informação, não é possível comparar os recursos disponíveis com as necessidades.",
   "lacuna": "Valor disponível.",
   "proximo": "Estimar o valor ou manter a pendência registrada.",
   "encaminhamento": "Orientação para levantamento de recursos."
  },
  {
   "codigo": "M6.R27",
   "pergunta": "M6.P07",
   "condicao": "Resposta vazia, negativa ou inválida",
   "texto": "Informe um valor igual ou superior a zero, ou selecione “Não sei”.",
   "alerta": "Valor não informado corretamente.",
   "lacuna": "Recursos disponíveis.",
   "proximo": "Corrigir a resposta.",
   "encaminhamento": "Retornar à P07."
  },
  {
   "codigo": "M6.R28",
   "pergunta": "M6.P08",
   "condicao": "Na hora",
   "texto": "Recebimento imediato registrado para as vendas consideradas.",
   "alerta": "Confirme se essa condição se aplica a todas as formas de pagamento escolhidas.",
   "lacuna": "Prazo específico por forma de pagamento, se houver diferenças.",
   "proximo": "Registrar a entrada no período previsto.",
   "encaminhamento": "Projeção de entradas."
  },
  {
   "codigo": "M6.R29",
   "pergunta": "M6.P08",
   "condicao": "Até 7 dias",
   "texto": "Prazo de recebimento registrado.",
   "alerta": "O dinheiro pode não estar disponível no mesmo dia da venda.",
   "lacuna": "Data ou prazo mais específico, se necessário.",
   "proximo": "Considerar o prazo na previsão de caixa.",
   "encaminhamento": "Projeção de entradas."
  },
  {
   "codigo": "M6.R30",
   "pergunta": "M6.P08",
   "condicao": "De 8 a 30 dias",
   "texto": "Prazo de recebimento registrado.",
   "alerta": "Pode existir intervalo entre a venda e a disponibilidade do dinheiro.",
   "lacuna": "Data ou prazo mais específico, se necessário.",
   "proximo": "Considerar o prazo na previsão de caixa.",
   "encaminhamento": "Projeção de entradas."
  },
  {
   "codigo": "M6.R31",
   "pergunta": "M6.P08",
   "condicao": "Mais de 30 dias",
   "texto": "Prazo de recebimento registrado.",
   "alerta": "O prazo pode exigir recursos para cobrir despesas anteriores ao recebimento.",
   "lacuna": "Data prevista ou prazo estimado.",
   "proximo": "Comparar as entradas futuras com as saídas.",
   "encaminhamento": "Análise da necessidade de capital de giro."
  },
  {
   "codigo": "M6.R32",
   "pergunta": "M6.P08",
   "condicao": "“Não sei”",
   "texto": "Consulte as condições de recebimento das formas de pagamento escolhidas.",
   "alerta": "O prazo de entrada ainda está indefinido.",
   "lacuna": "Prazo por forma de pagamento.",
   "proximo": "Verificar as condições e atualizar a previsão.",
   "encaminhamento": "Orientação sobre recebimentos."
  },
  {
   "codigo": "M6.R33",
   "pergunta": "M6.P08",
   "condicao": "Resposta vazia ou inválida",
   "texto": "Selecione um prazo de recebimento ou “Não sei”.",
   "alerta": "Informação não preenchida.",
   "lacuna": "Prazo de recebimento.",
   "proximo": "Corrigir a resposta.",
   "encaminhamento": "Retornar à P08."
  },
  {
   "codigo": "M6.R34",
   "pergunta": "M6.P09",
   "condicao": "Sim, com detalhes informados",
   "texto": "Exceção registrada! Vamos considerar esse prazo separadamente na previsão de caixa.",
   "alerta": "O prazo diferente pode alterar a disponibilidade de dinheiro.",
   "lacuna": "Confirmar valor, data e tipo de movimentação, se faltarem.",
   "proximo": "Registrar a movimentação com seu prazo específico.",
   "encaminhamento": "Atualização da previsão de caixa."
  },
  {
   "codigo": "M6.R35",
   "pergunta": "M6.P09",
   "condicao": "Sim, sem detalhes",
   "texto": "Informe qual pagamento ou recebimento terá prazo diferente e, se souber, o valor e a data.",
   "alerta": "A exceção foi identificada, mas ainda não pode ser projetada corretamente.",
   "lacuna": "Tipo, valor e prazo da movimentação.",
   "proximo": "Completar as informações.",
   "encaminhamento": "Retornar à P09 para complementar."
  },
  {
   "codigo": "M6.R36",
   "pergunta": "M6.P09",
   "condicao": "Não",
   "texto": "Nenhum prazo diferente foi informado.",
   "alerta": "Ainda é importante verificar se os prazos gerais representam as condições previstas.",
   "lacuna": "Confirmar se existem exceções relevantes.",
   "proximo": "Seguir com os prazos já registrados.",
   "encaminhamento": "Continuidade da projeção de caixa."
  },
  {
   "codigo": "M6.R37",
   "pergunta": "M6.P09",
   "condicao": "“Não sei”",
   "texto": "Revise os prazos de pagamento e recebimento para identificar possíveis exceções.",
   "alerta": "Algumas movimentações podem ficar fora da projeção.",
   "lacuna": "Existência de prazos diferentes.",
   "proximo": "Consultar as condições de clientes e fornecedores.",
   "encaminhamento": "Orientação para revisão de prazos."
  },
  {
   "codigo": "M6.R38",
   "pergunta": "M6.P09",
   "condicao": "Resposta vazia",
   "texto": "Informe “Sim”, “Não” ou “Não sei”.",
   "alerta": "Informação não preenchida.",
   "lacuna": "Existência de exceções.",
   "proximo": "Solicitar resposta.",
   "encaminhamento": "Retornar à P09."
  },
  {
   "secao": "SERVIÇOS"
  },
  {
   "codigo": "M6.R39",
   "pergunta": "M6.P10",
   "condicao": "Lista de itens informada",
   "texto": "Itens registrados! Agora vamos estimar seus valores.",
   "alerta": "Confira se todos os itens essenciais foram considerados.",
   "lacuna": "Valores dos itens.",
   "proximo": "Preencher P11.",
   "encaminhamento": "Estimativa de investimento para serviços."
  },
  {
   "codigo": "M6.R40",
   "pergunta": "M6.P10",
   "condicao": "“Não sei”",
   "texto": "Pense nas ferramentas, nos equipamentos e nos materiais usados para realizar o serviço.",
   "alerta": "A lista pode estar incompleta.",
   "lacuna": "Itens necessários.",
   "proximo": "Identificar os itens essenciais.",
   "encaminhamento": "Orientação para levantamento de materiais."
  },
  {
   "codigo": "M6.R41",
   "pergunta": "M6.P10",
   "condicao": "Resposta vazia",
   "texto": "Informe os itens necessários ou selecione “Não sei”.",
   "alerta": "Informação não preenchida.",
   "lacuna": "Lista de itens.",
   "proximo": "Solicitar resposta.",
   "encaminhamento": "Retornar à P10."
  },
  {
   "codigo": "M6.R42",
   "pergunta": "M6.P11",
   "condicao": "Valor maior que zero",
   "texto": "Valor registrado para os itens necessários ao serviço.",
   "alerta": "O valor pode mudar após consultar fornecedores.",
   "lacuna": "Confirmar quais itens estão incluídos.",
   "proximo": "Considerar valores e prazos de pagamento.",
   "encaminhamento": "Estimativa do investimento."
  },
  {
   "codigo": "M6.R43",
   "pergunta": "M6.P11",
   "condicao": "Valor igual a zero",
   "texto": "Você informou que esses itens não terão custo. Confirme se já possui todos ou se realmente não há gastos.",
   "alerta": "Podem existir gastos não considerados.",
   "lacuna": "Confirmar a origem dos itens e eventuais custos.",
   "proximo": "Confirmar ou corrigir o valor.",
   "encaminhamento": "Revisão do investimento."
  },
  {
   "codigo": "M6.R44",
   "pergunta": "M6.P11",
   "condicao": "“Não sei”",
   "texto": "Pesquise os preços dos equipamentos, ferramentas e materiais necessários.",
   "alerta": "O valor do investimento ainda está indefinido.",
   "lacuna": "Valor estimado.",
   "proximo": "Registrar preços aproximados ou manter a pendência.",
   "encaminhamento": "Orientação para estimativa."
  },
  {
   "codigo": "M6.R45",
   "pergunta": "M6.P11",
   "condicao": "Resposta vazia, negativa ou inválida",
   "texto": "Informe um valor válido ou selecione “Não sei”.",
   "alerta": "Valor não informado corretamente.",
   "lacuna": "Valor dos itens.",
   "proximo": "Corrigir a resposta.",
   "encaminhamento": "Retornar à P11."
  },
  {
   "codigo": "M6.R46",
   "pergunta": "M6.P12",
   "condicao": "Sim",
   "texto": "Você indicou que precisa manter materiais ou insumos disponíveis.",
   "alerta": "Considere os custos de compra e reposição.",
   "lacuna": "Tipos, quantidades e valores dos materiais.",
   "proximo": "Identificar o que precisa manter disponível.",
   "encaminhamento": "Planejamento de materiais."
  },
  {
   "codigo": "M6.R47",
   "pergunta": "M6.P12",
   "condicao": "Não",
   "texto": "Você informou que não precisa manter materiais ou insumos em estoque.",
   "alerta": "Confirme se algum material será comprado apenas quando necessário.",
   "lacuna": "Eventuais compras pontuais.",
   "proximo": "Seguir com o planejamento sem estoque recorrente, se aplicável.",
   "encaminhamento": "Continuidade do planejamento."
  },
  {
   "codigo": "M6.R48",
   "pergunta": "M6.P12",
   "condicao": "“Não sei”",
   "texto": "Avalie quais materiais são necessários para prestar os serviços e quando precisam estar disponíveis.",
   "alerta": "A necessidade de estoque ainda está indefinida.",
   "lacuna": "Necessidade e frequência de reposição.",
   "proximo": "Identificar os materiais usados.",
   "encaminhamento": "Orientação para planejamento de materiais."
  },
  {
   "codigo": "M6.R49",
   "pergunta": "M6.P12",
   "condicao": "Resposta vazia",
   "texto": "Selecione “Sim”, “Não” ou “Não sei”.",
   "alerta": "Informação não preenchida.",
   "lacuna": "Necessidade de estoque.",
   "proximo": "Solicitar resposta.",
   "encaminhamento": "Retornar à P12."
  },
  {
   "secao": "PRODUTOS"
  },
  {
   "codigo": "M6.R50",
   "pergunta": "M6.P13",
   "condicao": "Lista de itens informada",
   "texto": "Itens de produção registrados! Agora vamos estimar seus valores.",
   "alerta": "Confira se todos os itens essenciais foram considerados.",
   "lacuna": "Valores dos itens.",
   "proximo": "Preencher P14.",
   "encaminhamento": "Estimativa do investimento produtivo."
  },
  {
   "codigo": "M6.R51",
   "pergunta": "M6.P13",
   "condicao": "“Não sei”",
   "texto": "Pense nos equipamentos, máquinas e instalações necessários para produzir.",
   "alerta": "A lista pode estar incompleta.",
   "lacuna": "Itens necessários.",
   "proximo": "Identificar os itens essenciais.",
   "encaminhamento": "Orientação para levantamento do investimento."
  },
  {
   "codigo": "M6.R52",
   "pergunta": "M6.P13",
   "condicao": "Resposta vazia",
   "texto": "Informe os itens necessários ou selecione “Não sei”.",
   "alerta": "Informação não preenchida.",
   "lacuna": "Lista de itens.",
   "proximo": "Solicitar resposta.",
   "encaminhamento": "Retornar à P13."
  },
  {
   "codigo": "M6.R53",
   "pergunta": "M6.P14",
   "condicao": "Valor maior que zero",
   "texto": "Valor registrado para os itens de produção.",
   "alerta": "Os preços podem variar conforme fornecedor e condições de compra.",
   "lacuna": "Confirmar os itens incluídos.",
   "proximo": "Registrar os prazos de pagamento.",
   "encaminhamento": "Estimativa do investimento."
  },
  {
   "codigo": "M6.R54",
   "pergunta": "M6.P14",
   "condicao": "Valor igual a zero",
   "texto": "Você informou que não terá gastos com esses itens. Confirme se já possui todos ou se realmente não há custos.",
   "alerta": "Podem existir custos não considerados.",
   "lacuna": "Confirmar a existência de gastos.",
   "proximo": "Confirmar ou corrigir o valor.",
   "encaminhamento": "Revisão do investimento."
  },
  {
   "codigo": "M6.R55",
   "pergunta": "M6.P14",
   "condicao": "“Não sei”",
   "texto": "Pesquise os preços dos equipamentos, máquinas e instalações necessários.",
   "alerta": "O investimento ainda está indefinido.",
   "lacuna": "Valor estimado.",
   "proximo": "Registrar preços ou manter a pendência.",
   "encaminhamento": "Orientação para estimativa."
  },
  {
   "codigo": "M6.R56",
   "pergunta": "M6.P14",
   "condicao": "Resposta vazia, negativa ou inválida",
   "texto": "Informe um valor válido ou selecione “Não sei”.",
   "alerta": "Valor não informado corretamente.",
   "lacuna": "Valor dos itens.",
   "proximo": "Corrigir a resposta.",
   "encaminhamento": "Retornar à P14."
  },
  {
   "codigo": "M6.R57",
   "pergunta": "M6.P15",
   "condicao": "Lista de insumos informada",
   "texto": "Insumos registrados! Agora vamos estimar as quantidades e os valores necessários.",
   "alerta": "Considere as quantidades utilizadas e possíveis perdas na produção.",
   "lacuna": "Quantidades e valores.",
   "proximo": "Estimar a compra inicial e a reposição.",
   "encaminhamento": "Planejamento de insumos."
  },
  {
   "codigo": "M6.R58",
   "pergunta": "M6.P15",
   "condicao": "“Não sei”",
   "texto": "Liste os materiais e insumos utilizados na fabricação do produto.",
   "alerta": "A estimativa pode ficar incompleta sem essa lista.",
   "lacuna": "Tipos de insumos.",
   "proximo": "Identificar os materiais utilizados.",
   "encaminhamento": "Orientação para levantamento de insumos."
  },
  {
   "codigo": "M6.R59",
   "pergunta": "M6.P15",
   "condicao": "Resposta vazia",
   "texto": "Informe os insumos necessários ou selecione “Não sei”.",
   "alerta": "Informação não preenchida.",
   "lacuna": "Lista de insumos.",
   "proximo": "Solicitar resposta.",
   "encaminhamento": "Retornar à P15."
  },
  {
   "secao": "MERCADORIA"
  },
  {
   "codigo": "M6.R60",
   "pergunta": "M6.P16",
   "condicao": "Lista de mercadorias informada",
   "texto": "Mercadorias registradas! Agora vamos estimar os valores da compra inicial.",
   "alerta": "Confira se a lista contempla os itens prioritários para começar.",
   "lacuna": "Quantidades e valores.",
   "proximo": "Preencher P17.",
   "encaminhamento": "Planejamento de compras."
  },
  {
   "codigo": "M6.R61",
   "pergunta": "M6.P16",
   "condicao": "“Não sei”",
   "texto": "Pense nas mercadorias que pretende oferecer aos clientes.",
   "alerta": "Sem a lista, não é possível estimar a compra inicial.",
   "lacuna": "Tipos de mercadorias.",
   "proximo": "Identificar os itens prioritários.",
   "encaminhamento": "Orientação para levantamento de mercadorias."
  },
  {
   "codigo": "M6.R62",
   "pergunta": "M6.P16",
   "condicao": "Resposta vazia",
   "texto": "Informe as mercadorias que pretende revender ou selecione “Não sei”.",
   "alerta": "Informação não preenchida.",
   "lacuna": "Lista de mercadorias.",
   "proximo": "Solicitar resposta.",
   "encaminhamento": "Retornar à P16."
  },
  {
   "codigo": "M6.R63",
   "pergunta": "M6.P17",
   "condicao": "Valor maior que zero",
   "texto": "Valor da compra inicial registrado.",
   "alerta": "O valor pode variar conforme quantidades, preços e condições dos fornecedores.",
   "lacuna": "Confirmar quantidades e itens incluídos.",
   "proximo": "Registrar as condições de pagamento.",
   "encaminhamento": "Estimativa do investimento em mercadorias."
  },
  {
   "codigo": "M6.R64",
   "pergunta": "M6.P17",
   "condicao": "Valor igual a zero",
   "texto": "Você informou que não terá gastos com a compra inicial. Confirme se já possui mercadorias ou se realmente não haverá custo.",
   "alerta": "Podem existir custos não considerados.",
   "lacuna": "Confirmar a origem das mercadorias.",
   "proximo": "Confirmar ou corrigir o valor.",
   "encaminhamento": "Revisão do investimento em estoque."
  },
  {
   "codigo": "M6.R65",
   "pergunta": "M6.P17",
   "condicao": "“Não sei”",
   "texto": "Consulte os preços e as quantidades das mercadorias que pretende comprar.",
   "alerta": "O valor da compra inicial ainda está indefinido.",
   "lacuna": "Valor estimado.",
   "proximo": "Pesquisar preços ou manter a pendência.",
   "encaminhamento": "Orientação para estimativa."
  },
  {
   "codigo": "M6.R66",
   "pergunta": "M6.P17",
   "condicao": "Resposta vazia, negativa ou inválida",
   "texto": "Informe um valor válido ou selecione “Não sei”.",
   "alerta": "Valor não informado corretamente.",
   "lacuna": "Valor da compra inicial.",
   "proximo": "Corrigir a resposta.",
   "encaminhamento": "Retornar à P17."
  },
  {
   "codigo": "M6.R67",
   "pergunta": "M6.P18",
   "condicao": "Sim",
   "texto": "Você indicou que pretende manter estoque. Vamos considerar as compras iniciais e as reposições.",
   "alerta": "O estoque exige recursos e pode deixar dinheiro parado.",
   "lacuna": "Quantidade, valor e frequência de reposição.",
   "proximo": "Estimar o estoque necessário e quando comprar novamente.",
   "encaminhamento": "Planejamento de estoque e capital de giro."
  },
  {
   "codigo": "M6.R68",
   "pergunta": "M6.P18",
   "condicao": "Não",
   "texto": "Você informou que não pretende manter estoque contínuo.",
   "alerta": "Verifique se será possível atender aos pedidos sem mercadorias disponíveis.",
   "lacuna": "Prazo para comprar ou receber mercadorias após o pedido.",
   "proximo": "Registrar como pretende atender às vendas.",
   "encaminhamento": "Planejamento de compras."
  },
  {
   "codigo": "M6.R69",
   "pergunta": "M6.P18",
   "condicao": "“Não sei”",
   "texto": "Avalie se precisará ter mercadorias disponíveis antes de realizar as vendas.",
   "alerta": "A necessidade de estoque ainda não está definida.",
   "lacuna": "Política de estoque e reposição.",
   "proximo": "Estimar a demanda e as condições dos fornecedores.",
   "encaminhamento": "Orientação para planejamento de estoque."
  },
  {
   "codigo": "M6.R70",
   "pergunta": "M6.P18",
   "condicao": "Resposta vazia",
   "texto": "Selecione “Sim”, “Não” ou “Não sei”.",
   "alerta": "Informação não preenchida.",
   "lacuna": "Necessidade de estoque.",
   "proximo": "Solicitar resposta.",
   "encaminhamento": "Retornar à P18."
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