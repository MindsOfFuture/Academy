// ============================================================
//  CIDADANIA FINANCEIRA — Dados dos Cenários (100 Cenários)
//  Carregados dos 4 Módulos: Cidadão, Prefeito, Ministro, Presidente
// ============================================================

export type TipoOpcao = "correct" | "partial" | "wrong";
export type Bloco = {
  id: number;
  name: string;
  emoji: string;
  color: string;
  role: "cidadao" | "prefeito" | "ministro" | "presidente";
  subtitle: string;
  metrics: string[];
};
export type OpcaoCenario = {
  origLabel: string;
  text: string;
  type: TipoOpcao;
  icon: string;
  feedback: string;
  points: 0 | 10;
};
export type Cenario = {
  id: number;
  block: number;
  questaoNum: number;
  title: string;
  subtitle: string;
  context: string;
  options: OpcaoCenario[];
};

export const BLOCOS: Bloco[] = [
  {
    "id": 1,
    "name": "O Cidadão",
    "emoji": "👤",
    "color": "#e8473a",
    "role": "cidadao",
    "subtitle": "Finanças Pessoais & Consumo",
    "metrics": [
      "Saúde Financeira",
      "Reserva",
      "Score"
    ]
  },
  {
    "id": 2,
    "name": "O Prefeito",
    "emoji": "🏛️",
    "color": "#22c55e",
    "role": "prefeito",
    "subtitle": "Gestão Municipal & Serviços",
    "metrics": [
      "Caixa Municipal",
      "Serviços Públicos",
      "Popularidade"
    ]
  },
  {
    "id": 3,
    "name": "O Ministro da Economia",
    "emoji": "📈",
    "color": "#ffd300",
    "role": "ministro",
    "subtitle": "Macroeconomia & Política Monetária",
    "metrics": [
      "Controle da Inflação",
      "Saúde Fiscal",
      "Estabilidade"
    ]
  },
  {
    "id": 4,
    "name": "O Presidente da República",
    "emoji": "👑",
    "color": "#684a97",
    "role": "presidente",
    "subtitle": "Liderança de Estado & Projetos",
    "metrics": [
      "Estabilidade do País",
      "Emprego",
      "Aprovação"
    ]
  }
];

export const CENARIOS: Cenario[] = [
  {
    "id": 1,
    "block": 1,
    "questaoNum": 1,
    "title": "A Geladeira Quebrou",
    "subtitle": "Finanças Pessoais & Consumo",
    "context": "A geladeira da sua casa quebrou de vez no meio do mês. Sem ela, os alimentos estragam e os custos com refeições na rua vão disparar. A geladeira nova que atende sua família custa R$2.000 à vista. No entanto, você só tem R$500 em dinheiro na sua reserva. A loja oferece várias opções de pagamento, mas seu orçamento mensal já está apertado. Qual decisão financeira você toma?",
    "options": [
      {
        "origLabel": "A",
        "text": "Comprar a geladeira à vista usando os R$ 500 do saldo e pagar o restante de R$ 1.500 no cartão de crédito, pretendendo pagar apenas o \"valor mínimo\" da fatura no próximo mês para não apertar o orçamento.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "⚠️ ARMADILHA MORTAL DO ROTATIVO! O juro do crédito rotativo do cartão é um dos mais altos do mundo (podendo passar de 400% ao ano). Os R$ 1.500 não pagos viram uma bola de neve incontrolável em poucos meses, transformando uma necessidade da casa em um endividamento grave e nome sujo no SPC/Serasa.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Usar os R$ 500 de entrada, negociar o saldo de R$ 1.500 em parcelas fixas no cartão de crédito (sem juros ou com juros baixos) que caibam na sua renda mensal, ajustando temporariamente outros gastos da casa.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ DECISÃO EQUILIBRADA! Você utiliza parte do recurso disponível para diminuir o saldo devedor e dilui o restante em parcelas fixas previsíveis. Cortar pequenos gastos supérfluos no mês para cobrir essa nova parcela evita que você recorra a juros abusivos de emergência.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Contratar um empréstimo de emergência no aplicativo do banco para pagar os R$ 2.000 à vista e parcelar esse empréstimo em 36 vezes no carnê para a parcela ficar bem pequena.",
        "type": "partial",
        "icon": "⚠️",
        "feedback": "⚠️ EFEITO ILUSÃO DA PARCELA PEQUENA! Ao diluir em 36 vezes, você pode acabar pagando 3 ou 4 vezes o valor da geladeira original só em juros embutidos no empréstimo pessoal. Quando a dívida finalmente terminar, a própria geladeira já estará velha ou quebrada.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Comprar uma geladeira usada em funcionamento por R$ 500 usando todo o saldo disponível, sem fazer nenhuma dívida nova no momento.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ SOLUÇÃO DE EMERGÊNCIA PERFEITA! É a opção de maior responsabilidade financeira para momentos de aperto. Você resolve a emergência imediatamente sem comprometer sua renda futura com juros. Quando sua reserva for reconstruída, você poderá planejar a compra de uma nova com calma.",
        "points": 10
      }
    ]
  },
  {
    "id": 2,
    "block": 1,
    "questaoNum": 2,
    "title": "Carro Quebrado e Reserva",
    "subtitle": "Finanças Pessoais & Consumo",
    "context": "Você trabalha de aplicativo ou usa o carro para ir trabalhar todos os dias. O motor do seu carro deu um problema sério e o conserto ficou em R$ 3.000. Você tem exatamente R$ 3.500 guardados no Tesouro Selic como sua \"reserva de emergência\". O mecânico oferece parcelar em 12x no cartão com 15% de juros ao ano. Como agir?",
    "options": [
      {
        "origLabel": "A",
        "text": "Usar R$ 3.000 da reserva de emergência para pagar o conserto à vista, e em seguida focar em recompor a reserva mês a mês.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ USO CORRETO DA RESERVA! A reserva de emergência existe exatamente para imprevistos que afetam sua vida ou capacidade de gerar renda (como o carro de trabalho). Pagar à vista evita juros. O próximo passo é paciência e foco para reabastecer a reserva.",
        "points": 10
      },
      {
        "origLabel": "B",
        "text": "Deixar os R$ 3.500 guardados para \"não mexer no investimento\" e parcelar o conserto no cartão com juros.",
        "type": "partial",
        "icon": "⚠️",
        "feedback": "⚠️ ILUSÃO DO INVESTIMENTO! Não faz sentido financeiro manter o dinheiro rendendo 10% ou 11% ao ano enquanto você paga 15% ou mais de juros no parcelamento. Os juros da dívida engolem o rendimento do seu investimento.",
        "points": 0
      },
      {
        "origLabel": "C",
        "text": "Contratar um empréstimo consignado ou pessoal no banco com prazo de 24 meses para pagar a oficina e manter o limite do cartão livre.",
        "type": "partial",
        "icon": "⚠️",
        "feedback": "⚠️ DÍVIDA DESNECESSÁRIA! Pegar empréstimo tendo dinheiro em caixa para cobrir a emergência é rasgar dinheiro em taxas de juros bancárias.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Vender o carro no estado em que se encontra por um valor bem abaixo da tabela FIPE e usar o transporte público para sempre.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ DECISÃO IMPULSIVA. Vender um bem depreciado às pressas gera uma perda financeira enorme sem necessidade, prejudicando sua mobilidade ou fonte de renda se o veículo for essencial.",
        "points": 0
      }
    ]
  },
  {
    "id": 3,
    "block": 1,
    "questaoNum": 3,
    "title": "TV Nova no Carnê",
    "subtitle": "Finanças Pessoais & Consumo",
    "context": "Sua TV antiga queimou. Na loja de eletrodomésticos, o vendedor te oferece uma TV smart por R$ 1.800 à vista, ou \"apenas 24 parcelinhas de R$ 130 no carnê da loja\". Olhando rápido, R$ 130 por mês cabe na sua folga do orçamento. O que você faz?",
    "options": [
      {
        "origLabel": "A",
        "text": "Aceitar o carnê de 24x de R$ 130, pois o valor mensal não pesa na sua renda diária.",
        "type": "partial",
        "icon": "⚠️",
        "feedback": "⚠️ CUSTO EFETIVO TOTAL (CET) CEGO! Ao final de 2 anos, você terá pago R$ 3.120 por um aparelho de R$ 1.800. Você pagou quase duas TVs! O crediário tradicional esconde juros altíssimos no valor da parcela.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Fazer a conta do valor total (24 x 130 = R$ 3.120), recusar o carnê por conta dos juros abusivos e buscar uma opção mais barata ou juntar o valor.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ VISÃO CRÍTICA DE CONSUMO! Calcular o custo total é a regra básica do consumidor inteligente. Recusar juros abusivos protege seu dinheiro e permite planejar a compra sem rasgar recursos.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Dar um cheque pré-datado sem saldo na conta para tentar garantir a compra e resolver a conta no futuro.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 RISCO OPERACIONAL E FINANCEIRO! Emitir cheques sem fundo gera tarifas bancárias, inclusão no Cadastro de Emitentes de Cheques sem Fundo (CCF) e bloqueio de serviços bancários.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Pagar a primeira parcela no carnê e parar de pagar as outras assim que a TV chegar em casa.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ NOME SUJO E NEGATIVAÇÃO. O não pagamento do carnê leva seu nome rapidamente para os órgãos de proteção ao crédito (SPC/Serasa), impedindo contratos de aluguel, linhas de crédito e até compras simples parceladas.",
        "points": 0
      }
    ]
  },
  {
    "id": 4,
    "block": 1,
    "questaoNum": 4,
    "title": "Consignado para Familiar",
    "subtitle": "Finanças Pessoais & Consumo",
    "context": "Um familiar próximo está com problemas financeiros e pede para você contratar um empréstimo consignado (cujo valor é descontado direto na sua folha de pagamento ou aposentadoria) no seu nome, prometendo que vai te pagar o valor da parcela certinho todo mês. Como proceder?",
    "options": [
      {
        "origLabel": "A",
        "text": "Aceitar e fazer o empréstimo no limite máximo permitido para ajudar o familiar, afinal é família.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 MAIOR CAUSA DE INADIMPLÊNCIA FAMILIAR! Se o parente não conseguir pagar (o que é comum para quem já está endividado), o desconto continuará caindo obrigatoriamente do seu salário. Você assume o risco integral da dívida de outra pessoa.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Recusar educadamente o empréstimo no seu nome, explicando que o desconto direto no seu salário compromete seu orçamento caso ocorra algum imprevisto com o familiar.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ FRONTEIRA FINANCEIRA SAUDÁVEL! Proteger seu nome e sua fonte de renda é fundamental. Você pode ajudar de outras formas (orientando ou ajudando pontualmente com alimentos), mas nunca emprestando seu crédito.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Fazer o empréstimo, mas exigir que o familiar assine um papel informal prometendo pagar.",
        "type": "partial",
        "icon": "⚠️",
        "feedback": "⚠️ SEM GARANTIA REAL. Um papel informal não impede o desconto no seu contracheque. Se a pessoa falir, você terá que acionar a justiça contra um familiar, gerando um transtorno emocional e financeiro gigantesco.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Pegar o dinheiro do consignado e aplicar em criptomoedas de alto risco para tentar dobrar o saldo antes de repassar ao familiar.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ ESPECULAÇÃO DE ALTÍSSIMO RISCO. Misturar dívida com investimento especulativo é a receita para a falência pessoal rápida.",
        "points": 0
      }
    ]
  },
  {
    "id": 5,
    "block": 1,
    "questaoNum": 5,
    "title": "Desconto no Pix vs Parcelamento",
    "subtitle": "Finanças Pessoais & Consumo",
    "context": "Você guardou dinheiro por meses e vai comprar um notebook para estudo/trabalho por R$ 3.000. O vendedor avisa: \"Se pagar no Pix/Dinheiro à vista, dou 10% de desconto (R$ 2.700). No cartão, é R$ 3.000 em 10x sem juros de R$ 300\". Você tem os R$ 3.000 aplicados no CDB com liquidez diária. Qual a melhor decisão?",
    "options": [
      {
        "origLabel": "A",
        "text": "Pagar R$ 2.700 à vista no Pix, garantindo R$ 300 de desconto imediato.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ MATEMÁTICA A FAVOR! Um desconto de 10% à vista equivale a um ganho imediato que nenhum investimento seguro do mercado (como CDB ou Poupança) consegue entregar no período de 10 meses. É ganho financeiro puro.",
        "points": 10
      },
      {
        "origLabel": "B",
        "text": "Pagar em 10x no cartão para deixar os R$ 3.000 rendendo no banco durante os 10 meses.",
        "type": "partial",
        "icon": "⚠️",
        "feedback": "⚠️ CONTA QUE NÃO FECHA! O rendimento de R$ 3.000 em 10 meses de CDB renderá bem menos do que os R$ 300 (10%) de desconto direto oferecido no ato da compra.",
        "points": 0
      },
      {
        "origLabel": "C",
        "text": "Aceitar pagar R$ 3.000 à vista sem pedir desconto adicional.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ DESPERDÍCIO DE RECURSOS. Não aproveitar o desconto negociável à vista quando se tem o capital disponível é deixar dinheiro na mesa.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Comprar no cartão de crédito em 10x e usar os R$ 3.000 para comprar roupas de grife em liquidação.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ DESVIO DE FINALIDADE E SOBRE-ENDIVIDAMENTO. Gastar o dinheiro reservado para o notebook em consumo supérfluo cria uma nova dívida desnecessária.",
        "points": 0
      }
    ]
  },
  {
    "id": 6,
    "block": 1,
    "questaoNum": 6,
    "title": "Feirão Limpa Nome",
    "subtitle": "Finanças Pessoais & Consumo",
    "context": "Você acumula uma dívida antiga no cartão de crédito no valor original de R$ 2.000, que com os juros acumulados em 2 anos chegou a surreal marca de R$ 15.000. O banco entra em contato pelo Feirão Limpa Nome oferecendo um acordo de quitação à vista por R$ 1.800 (90% de desconto no total cobrado). O que você faz?",
    "options": [
      {
        "origLabel": "A",
        "text": "Ignorar a proposta por achar que é golpe e esperar a dívida caducar (completar 5 anos).",
        "type": "partial",
        "icon": "⚠️",
        "feedback": "⚠️ MITO DO CADUCAR! Embora a dívida saia do Serasa/SPC após 5 anos, o débito continua existindo no Registrato/Banco Central. Seu Score continuará baixo e seu crédito ficará bloqueado na instituição para sempre.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Negociar e aceitar a proposta de R$ 1.800 à vista diretamente nos canais oficiais do feirão/banco, quitando a pendência e limpando o nome.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ OPORTUNIDADE DE RECOMEÇO! Os feirões de renegociação retiram os juros abusivos acumulados. Quitar por um valor menor que o original (com os devidos comprovantes oficiais) limpa seu nome e restabelece sua saúde financeira.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Aceitar um novo parcelamento dessa dívida de R$ 15.000 em 60x de R$ 400.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ CONFISSÃO DE DÍVIDA INFLACIONADA. Aceitar renegociar o valor com juros abusivos (R$ 15.000 em 60x) só perpetua o ciclo de endividamento sem aproveitar o desconto real do mercado.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Transferir a dívida para um agiota local que cobra menos juros que o cartão.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 RISCO À INTEGRIDADE FÍSICA. Recorrer ao mercado informal de crédito (agiotagem) traz riscos graves de coerção, chantagem e violência física.",
        "points": 0
      }
    ]
  },
  {
    "id": 7,
    "block": 1,
    "questaoNum": 7,
    "title": "Tarifa Bancária e Conta Grátis",
    "subtitle": "Finanças Pessoais & Consumo",
    "context": "Ao conferir o extrato da sua conta corrente em um banco tradicional, você percebe uma cobrança mensal de R$ 45,00 intitulada \"Cesta Padrão de Serviços de Manutenção\". Ao final do ano, isso soma R$ 540,00. O que você pode fazer por direito?",
    "options": [
      {
        "origLabel": "A",
        "text": "Continuar pagando a taxa, pois acha que todos os bancos cobram isso obrigatoriamente por lei.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ ANALFABETISMO FINANCEIRO TRIBUTÁRIO/BANCÁRIO. Pagar tarifas desnecessárias retira R$ 540 por ano do seu bolso que poderiam estar investidos ou cobrindo despesas da casa.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Ir ao banco ou pelo aplicativo e solicitar a migração para o \"Pacote de Serviços Essenciais\" (Resolução BCB nº 3.919), que é 100% gratuito por regulamentação do Banco Central.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ DIREITO DO CONSUMIDOR EXERCIDO! O Banco Central garante a todo cidadão brasileiro uma conta com pacote de serviços essenciais gratuitos (que inclui saques, extratos e transferências básicas/Pix).",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Fechar a conta e guardar todo o seu salário em dinheiro vivo dentro de uma caixa de sapatos em casa.",
        "type": "partial",
        "icon": "⚠️",
        "feedback": "⚠️ RISCO DE PERDA E INFLAÇÃO. Manter dinheiro vivo expõe o valor a roubos, perda e depreciação pelo efeito corrosivo da inflação.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Processar o banco imediatamente sem tentar contato ou cancelamento prévio.",
        "type": "partial",
        "icon": "⚠️",
        "feedback": "⚠️ DESGASTE DESNECESSÁRIO. Solicitar a mudança pelo canal do cliente resolve o problema em poucos minutos sem custos judiciais ou burocracia.",
        "points": 0
      }
    ]
  },
  {
    "id": 8,
    "block": 1,
    "questaoNum": 8,
    "title": "Inflação nos Alimentos",
    "subtitle": "Finanças Pessoais & Consumo",
    "context": "Você nota que o valor total das suas compras de mercado subiu 20% nos últimos seis meses, mas seu salário continuou exatamente o mesmo. Sua família está no limite do orçamento diário. Qual é a estratégia mais adequada para adaptar seu orçamento?",
    "options": [
      {
        "origLabel": "A",
        "text": "Passar a pagar a feira e o mercado utilizando o cartão de crédito parcelado em 3x todos os meses.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 EFEITO BOLA DE NEVE. Parcelar itens de consumo recorrente (alimentos) cria um efeito cumulativo devastador: no mês seguinte você terá a feira do mês + as parcelas da feira anterior.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Fazer substituição de marcas de produtos, comprar itens da estação, pesquisar preços em atacadistas/feiras e elaborar uma lista rígida de compras antes de sair de casa.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ ADAPTAÇÃO E DISCIPLINA! Mudar hábitos de consumo e buscar atacarejos e marcas substitutas é a maneira inteligente de combater a perda de poder de compra gerada pela inflação.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Cortar o pagamento do plano de saúde da família para manter exatamente as mesmas marcas de alimentos de antes.",
        "type": "partial",
        "icon": "⚠️",
        "feedback": "⚠️ DESPROTEÇÃO GRAVE. Cancelar serviços de saúde básica em favor de consumo de marcas específicas expõe a família a imprevistos financeiros muito maiores no caso de doenças.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Deixar de pagar a conta de água e luz do imóvel para continuar mantendo o padrão do mercado.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ RISCO DE CORTE DE SERVIÇOS ESSENCIAIS. Acumular contas básicas resulta em suspensão de fornecimento de água e luz, piorando drasticamente a qualidade de vida doméstica.",
        "points": 0
      }
    ]
  },
  {
    "id": 9,
    "block": 1,
    "questaoNum": 9,
    "title": "Financiamento Habitacional: SAC vs Price",
    "subtitle": "Finanças Pessoais & Consumo",
    "context": "Você economizou para dar a entrada da sua casa própria e agora precisa escolher a tabela de amortização do financiamento habitacional de 30 anos no banco. A instituição te apresenta duas opções: Tabela SAC (parcelas começam mais altas e vão caindo) ou Tabela Price (parcelas fixas, mas amortizam mais devagar). O que considerar?",
    "options": [
      {
        "origLabel": "A",
        "text": "Escolher a Tabela Price porque a parcela inicial é menor, sem se importar com o custo total de juros ao final dos 30 anos.",
        "type": "partial",
        "icon": "⚠️",
        "feedback": "⚠️ ALERTA DE CUSTO TOTAL! Na Tabela Price, como você demora mais para reduzir o saldo devedor principal, o montante total de juros pago ao banco em 30 anos costuma ser bem maior do que na tabela SAC.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Escolher a Tabela SAC se a parcela inicial couber no seu orçamento, pois o valor total pago de juros ao final do financiamento será significativamente menor.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ ESCOLHA TÉCNICA CORRETA! A tabela SAC reduz o valor da dívida (amortização) mais rápido desde o primeiro mês. Conforme o tempo passa, as parcelas diminuem, aliviando seu orçamento no futuro e reduzindo o juro total.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Assinar qualquer uma sem ler o contrato, pois \"financiamento de banco é tudo igual\".",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ ANALFABETISMO CONTRATUAL. Ignorar taxas, indexadores (como TR ou IPCA) e sistemas de amortização pode transformar a casa própria em uma armadilha financeira insustentável.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Recusar o financiamento e morar de aluguel usando 100% da sua renda mensal em lazer sem guardar nada.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ FALTA DE PLANEJAMENTO. Morar de aluguel pode ser uma estratégia viável, mas exige disciplina para investir a diferença, e não gastar tudo com consumo imediato.",
        "points": 0
      }
    ]
  },
  {
    "id": 10,
    "block": 1,
    "questaoNum": 10,
    "title": "Garantia Estendida no Varejo",
    "subtitle": "Finanças Pessoais & Consumo",
    "context": "Ao comprar um celular de R$ 1.000 no caixa de uma grande loja, o vendedor insiste muito para você contratar um seguro de \"Garantia Estendida de 2 anos\" por mais R$ 250, afirmando que \"se o aparelho quebrar por qualquer motivo, a loja troca por um novo na hora\". O que você faz?",
    "options": [
      {
        "origLabel": "A",
        "text": "Aceitar a garantia estendida sem ler a apólice, adicionando R$ 250 no valor total da compra parcelada.",
        "type": "partial",
        "icon": "⚠️",
        "feedback": "⚠️ SEGURO DESNECESSÁRIO OU ILUSÓRIO. A garantia estendida é um dos produtos mais lucrativos para o varejo porque a maioria dos defeitos cobertos já ocorrem no prazo da garantia de fábrica ou não são cobertos por exclusões de \"mau uso\".",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Recusar o seguro, sabendo que o produto já conta com a garantia legal (Código de Defesa do Consumidor) mais a garantia do fabricante, e que as apólices de garantia estendida possuem muitas cláusulas de exclusão.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ CONSUMIDOR CONSCIENTE! Todo produto tem garantia legal estipulada pelo CDC (90 dias para bens duráveis) somada à garantia contratual do fabricante (geralmente 1 ano). Guardar o valor do seguro na sua própria reserva é muito mais rentável.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Comprar dois celulares iguais para garantir que terá um de reserva caso o primeiro quebre.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ CUSTO DUPLICADO. Dobrar o gasto para se prevenir de uma falha eventual gera um desperdício enorme de capital.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Exigir que a loja ofereça a garantia estendida gratuitamente, sob ameaça de chamar a polícia.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ DESCONHECIMENTO JURÍDICO. Lojas não são obrigadas a doar serviços de terceiros (seguradoras). A solicitação não tem amparo legal.",
        "points": 0
      }
    ]
  },
  {
    "id": 11,
    "block": 1,
    "questaoNum": 11,
    "title": "Consórcio vs Poupar Renda",
    "subtitle": "Finanças Pessoais & Consumo",
    "context": "Você planeja adquirir seu primeiro automóvel de R$40.000 daqui a 3 anos. O vendedor da corretora te oferece uma cota de consórcio dizendo que \"consórcio é um investimento excelente porque não tem juros!\". Como analisar tecnicamente essa oferta?",
    "options": [
      {
        "origLabel": "A",
        "text": "Acreditar que o consórcio não tem custo nenhum e assinar o contrato imediatamente.",
        "type": "partial",
        "icon": "⚠️",
        "feedback": "⚠️ ILUSÃO DO \"SEM JUROS\". Embora não haja taxa de juros nominal, o consórcio cobra taxa de administração, reajuste anual do valor do bem e fundo de reserva. Não é de graça.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Avaliar que o consórcio cobra Taxa de Administração e Fundo de Reserva, além de depender de sorteio ou lance, comparando esse custo com guardar o dinheiro em aplicação com rendimento.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ ANÁLISE FINANCEIRA APURADA! Consórcio é uma opção de compra planejada para quem não tem disciplina de poupar sozinho, mas possui custos embutidos. Se você tem 3 anos e disciplina, aplicar o valor mensal trará juros a seu favor.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Pegar um empréstimo pessoal com juros de 5% ao mês para comprar o carro na mesma semana.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ ALTISSÍMO CUSTO FINANCEIRO. Pagar 5% ao mês em empréstimo pessoal fará o carro custar mais do que o dobro do preço original.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Dar entrada no consórcio usando dinheiro emprestado com agiotas.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 ALTO RISCO SOCIAL E FINANCEIRO. Associar dívida bancária com crédito informal é a forma mais rápida de falência familiar.",
        "points": 0
      }
    ]
  },
  {
    "id": 12,
    "block": 1,
    "questaoNum": 12,
    "title": "Troca de Dívida de Juros Altos",
    "subtitle": "Finanças Pessoais & Consumo",
    "context": "Você entrou sem querer no limite do Cheque Especial (juros de 8% ao mês) e acumulou um saldo devedor de R$ 5.000 no banco. Você não tem esse dinheiro disponível imediatamente para quitar. Qual a atitude mais racional?",
    "options": [
      {
        "origLabel": "A",
        "text": "Deixar a dívida rolar no cheque especial até o final do ano na esperança de receber o 13º salário para pagar.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 DESTRUIÇÃO TRIBUTÁRIA E BANCÁRIA. O cheque especial a 8% ao mês dobra a dívida em um prazo curtíssimo. Esperar meses para quitar fará o valor virar uma montanha impagável.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Ir ao banco ou pesquisar em outras instituições um Empréstimo Pessoal ou Consignado com taxa bem menor, contratar a linha mais barata para liquidar o cheque especial e estancar os juros.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ TROCA DE DÍVIDA INTELIGENTE! Quando não é possível quitar a dívida imediatamente, a regra de ouro das finanças é trocar uma dívida de juros astronômicos por uma dívida de juros bem mais baixos e com parcelas fixas.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Usar o limite do cartão de crédito para sacar dinheiro no caixa eletrônico e cobrir o cheque especial.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ SAQUE NO CRÉDITO = ERRO DUPLO. Saques com cartão de crédito cobram tarifas elevadíssimas e incidem juros desde o dia do saque, piorando a situação.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Abrir conta em outro banco e fingir que a dívida no banco antigo não existe.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ ILUSÃO DA FUGA. A dívida continuará crescendo, gerando negativação no Registrato/Serasa e eventuais execuções judiciais com penhora de bens ou contas.",
        "points": 0
      }
    ]
  },
  {
    "id": 13,
    "block": 1,
    "questaoNum": 13,
    "title": "Gastos Formiga e Assinaturas",
    "subtitle": "Finanças Pessoais & Consumo",
    "context": "Ao analisar seu extrato bancário dos últimos três meses, você descobre que paga streaming, aplicativo de música, canal de jogos, revista digital e academia que não frequenta. O total soma R$ 141 por mês (R$ 1.692 por ano). O que fazer?",
    "options": [
      {
        "origLabel": "A",
        "text": "Deixar todas as assinaturas ativas, afinal R$ 20 ou R$ 30 isoladamente são valores muito pequenos para fazer diferença.",
        "type": "partial",
        "icon": "⚠️",
        "feedback": "⚠️ A ARMADILHA DOS GASTOS FORMIGA. Pequenas despesas recorrentes e invisíveis são as maiores vilãs do orçamento familiar. De R$ 20 em R$ 20, vaza o dinheiro da sua aposentadoria ou do seu investimento.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Fazer um pente-fino, cancelar imediatamente o que não está usando (como a academia e serviços redundantes) e manter apenas o que realmente usa com frequência.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ LIMPEZA FINANCEIRA PREVENTIVA! Auditar a fatura com frequência e eliminar assinaturas zumbis reverte centenas ou milhares de reais anuais direto para a sua reserva ou investimentos reais.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Bloquear e cancelar o cartão de crédito sem avisar as empresas prestadoras de serviço.",
        "type": "partial",
        "icon": "⚠️",
        "feedback": "⚠️ RISCO DE NEGATIVAÇÃO. Cancelar o cartão não cancela o contrato de prestação de serviços. A empresa continuará cobrando a mensalidade e pode negativar seu nome por inadimplência.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Aumentar o limite do cartão de crédito para assinar mais três plataformas concorrentes.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ AGRAVAMENTO DE VAZAMENTO DE CAIXA. Aumentar custos sem uso prático corrói a capacidade de poupança do domicílio.",
        "points": 0
      }
    ]
  },
  {
    "id": 14,
    "block": 1,
    "questaoNum": 14,
    "title": "Uso da Restituição do IR",
    "subtitle": "Finanças Pessoais & Consumo",
    "context": "Você entregou sua declaração de Imposto de Renda e recebeu uma restituição de R$ 2.500 na conta. Você possui uma pequena conta atrasada de R$ 800 no cartão e ainda não possui nenhuma reserva de emergência guardada. Qual o destino mais adequado?",
    "options": [
      {
        "origLabel": "A",
        "text": "Gastar os R$ 2.500 em uma viagem de final de semana com amigos para \"comemorar o presente que o governo deu\".",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ EFEITO VISÃO DE CURTO PRAZO. A restituição não é um \"presente\", mas sim a devolução do imposto pago a mais por você ao longo do ano. Queimar esse valor mantendo dívidas ativas é uma falha grave de gestão.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Quitar a dívida de R$ 800 do cartão de crédito para zerar os juros e aplicar os R$ 1.700 restantes em um investimento com liquidez para iniciar sua reserva de emergência.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ PRIORIZAÇÃO FINANCEIRA PERFEITA! Primeiro elimina-se os juros passivos (dívidas), depois constrói-se a proteção futura (reserva). Essa é a receita clássica de estabilização patrimonial.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Comprar um relógio importado parcelado, dando os R$ 2.500 como entrada.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ CRIAÇÃO DE NOVA PASSIVIDADE. Usar um recurso extraordinário para alavancar mais consumo parcelado aumenta a exposição ao risco.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Emprestar o dinheiro integral para um amigo abrir um quiosque de praia sem plano de negócios.",
        "type": "partial",
        "icon": "⚠️",
        "feedback": "⚠️ RISCO DE CRÉDITO INFORMAI. Investir em negócios de terceiros sem garantias ou plano estruturado costuma resultar na perda do capital.",
        "points": 0
      }
    ]
  },
  {
    "id": 15,
    "block": 1,
    "questaoNum": 15,
    "title": "Gatilhos de Escassez e Compras Impulsivas",
    "subtitle": "Finanças Pessoais & Consumo",
    "context": "Navegando nas redes sociais, você vê um anúncio de um massageador cervical com 50% de desconto por R$ 199. A página mostra um cronômetro regressivo de \"Últimas 3 unidades em promoção por apenas 10 minutos!\". O que fazer?",
    "options": [
      {
        "origLabel": "A",
        "text": "Inserir os dados do cartão de crédito rapidamente para não perder a promoção antes do contador zerar.",
        "type": "partial",
        "icon": "⚠️",
        "feedback": "⚠️ GATILHO MENTAL DA ESCASSEZ. Marketing digital utiliza contadores falsos de urgência para desativar sua análise racional. O consumidor acaba comprando coisas inúteis que vão parar no fundo da gaveta.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Aplicar a \"Regra das 24 horas\" (fechar o aplicativo, esperar até o dia seguinte para avaliar se você realmente precisa do produto ou se é apenas gatilho de escassez).",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ DISCIPLINA EMOCIONAL! A regra das 24 horas desativa a impulsividade emocional gerada pelos gatilhos de venda. No dia seguinte, a maioria das pessoas percebe que nem precisava do item.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Comprar 5 unidades do produto para tentar revender aos vizinhos pelo dobro do preço.",
        "type": "partial",
        "icon": "⚠️",
        "feedback": "⚠️ EMPREENDEDORISMO SEM PESQUISA. Revender produtos impulsivos sem validação de mercado costuma resultar em estoque parado e prejuízo.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Pedir dinheiro emprestado no limite do cartão da sua mãe para comprar o item.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ COMPROMETIMENTO DE CRÉDITO DE TERCEIROS. Transferir o impulso de consumo para o crédito de familiares fere a responsabilidade orçamentária do grupo.",
        "points": 0
      }
    ]
  },
  {
    "id": 16,
    "block": 1,
    "questaoNum": 16,
    "title": "Financiamento Estudantil (FIES)",
    "subtitle": "Finanças Pessoais & Consumo",
    "context": "Você quer fazer uma faculdade privada (mensalidade R$ 1.000) e foi aprovado no FIES. A dívida acumulada ao final do curso será de cerca de R$ 50.000 para começar a ser paga após a formatura. Como encarar esse contrato?",
    "options": [
      {
        "origLabel": "A",
        "text": "Assinar o FIES encarando o financiamento como um \"dinheiro grátis\" do governo que você não precisa se preocupar em pagar no futuro.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 ILUSÃO DO CRÉDITO PÚBLICO. O FIES é um financiamento bancário com cobrança jurídica ativa. O não pagamento gera negativação do seu nome e dos seus fiadores, bloqueando sua vida financeira após o curso.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Analisar a empregabilidade real do curso escolhido, calcular o valor da futura parcela e entender que o FIES é uma dívida real de longo prazo que precisará ser honrada com seu trabalho.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ VISÃO DE INVESTIMENTO EM CAPITAL HUMANO! A educação é o melhor investimento no longo prazo, mas exige cálculo de Retorno sobre Investimento (ROI). Entender o FIES como um compromisso sério garante planejamento seguro.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Desistir dos estudos totalmente e nunca mais buscar nenhuma capacitação ou curso técnico.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ ESTAGNAÇÃO DE RENDA. Não se capacitar limita a progressão salarial ao longo da vida profissional.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Trancar a faculdade no último ano e usar o limite do financiamento para viajar o mundo.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ FRAUDE E PREJUÍZO ACADÊMICO. Desviar o objetivo do crédito educativo prejudica a formação e mantém a obrigação de pagar a dívida acumulada.",
        "points": 0
      }
    ]
  },
  {
    "id": 17,
    "block": 1,
    "questaoNum": 17,
    "title": "Seguro Auto vs Proteção Veicular",
    "subtitle": "Finanças Pessoais & Consumo",
    "context": "Ao comprar seu veículo, você cota o Seguro Auto tradicional em uma corretora regulada pela SUSEP por R$ 3.000 ao ano. Uma \"Associação de Proteção Veicular\" não regulada oferece contrato por R$ 1.200 ao ano. Qual é a avaliação técnica de risco?",
    "options": [
      {
        "origLabel": "A",
        "text": "Fechar com a Associação de Proteção Veicular apenas pelo preço mais baixo, sem pesquisar as garantias jurídicas e o fundo de reserva da entidade.",
        "type": "partial",
        "icon": "⚠️",
        "feedback": "⚠️ RISCO DE NÃO RECEBIMENTO. Associações de proteção veicular não são seguradoras. Em momentos de grandes crises ou sinistros em massa, muitas não possuem reservas legais para indenizar o associado.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Compreender que Seguradoras possuem reservas técnicas auditadas e obrigatórias garantidas pela SUSEP, enquanto Proteções Veiculares funcionam como rateio informal entre associados, apresentando risco em sinistros graves.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ ANÁLISE RIGOROSA DE RISCO! Economizar é bom, mas entender a segurança regulatória do mercado de seguros (SUSEP) evita surpresas desagradáveis no momento em que você mais precisa da indenização do seu patrimônio.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Não contratar nenhuma proteção e deixar o carro estacionado diariamente na rua em locais de alto risco.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ EXPOSIÇÃO EXTREMA AO RISCO. Perder um bem de alto valor por roubo sem cobertura pode destruir anos de esforço financeiro.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Contratar o seguro e intencionalmente provocar um acidente para receber o valor integral da tabela FIPE.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 CRIME DE FRAUDE (CÓDIGO PENAL). Fraudar seguros é crime previsto no artigo 171 do Código Penal, passível de reclusão e perda de todos os direitos.",
        "points": 0
      }
    ]
  },
  {
    "id": 18,
    "block": 1,
    "questaoNum": 18,
    "title": "Aposentadoria Própria vs INSS",
    "subtitle": "Finanças Pessoais & Consumo",
    "context": "Você tem 20 anos, começou seu primeiro emprego e ouve um colega dizer: \"Eu não guardo nada para a velhice porque o INSS vai pagar minha aposentadoria completa quando eu fizer 65 anos\". Como agir?",
    "options": [
      {
        "origLabel": "A",
        "text": "Confiar 100% no valor futuro do INSS e gastar todo o resto do seu salário atual com consumo diário.",
        "type": "partial",
        "icon": "⚠️",
        "feedback": "⚠️ ILUSÃO DEMOGRÁFICA. O INSS é um sistema de repartição simples. Com o envelhecimento do país, o valor do benefício futuro tende a ser equivalente ao teto mínimo, o que pode derrubar seu padrão de vida na velhice.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Entender a transição demográfica, manter a contribuição obrigatória do INSS e criar um plano complementar próprio de investimentos de longo prazo (Tesouro IPCA, Previdência Privada de baixa taxa ou Ações/FIIs).",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ VISÃO DE LONGO PRAZO PERFEITA! Diversificar sua segurança futura construindo patrimônio próprio de longo prazo em ativos indexados à inflação (IPCA+) garante independência financeira real na aposentadoria.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Não contribuir para o INSS e guardar dinheiro físico embaixo do colchão por 40 anos.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ EROSÃO MONETÁRIA E DESPROTEÇÃO. O dinheiro no colchão perde todo o valor para a inflação, e a falta de contribuição ao INSS retira direitos a auxílio-doença ou aposentadoria por invalidez.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Gastar todo o dinheiro agora em festas porque \"o amanhã não existe\".",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ NEGLIGÊNCIA FUTURA. A expectativa de vida média cresce a cada ano. Não planejar o futuro condena a pessoa à dependência financeira de parentes ou da caridade na velhice.",
        "points": 0
      }
    ]
  },
  {
    "id": 19,
    "block": 1,
    "questaoNum": 19,
    "title": "Pressão Social e Viagem Cara",
    "subtitle": "Finanças Pessoais & Consumo",
    "context": "Seus amigos resolveram organizar uma viagem cara no feriado que custará R$2.000 por pessoa. Você não tem esse dinheiro sobrando e precisaria estourar o limite do cheque especial e parcelar o restante em 12x com juros. O que você faz?",
    "options": [
      {
        "origLabel": "A",
        "text": "Ir para a viagem assim mesmo para não ser excluído do grupo ou parecer \"por baixo\" nas redes sociais, assumindo a dívida.",
        "type": "partial",
        "icon": "⚠️",
        "feedback": "⚠️ DÍVIDA POR STATUS. Viver um padrão de vida que não é o seu para impressionar os outros é uma das causas principais do endividamento da classe média. A viagem dura 3 dias, a dívida e os juros duram mais de um ano.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Recusar o convite de forma transparente, propor passeios locais mais acessíveis dentro da sua realidade atual e manter seu orçamento sob controle.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ MATURIDADE E SOBERANIA FINANCEIRA! Dizer \"não\" para gastos que não cabem no seu momento financeiro demonstra inteligência emocional e firmeza de propósitos. Amigos verdadeiros respeitam seus limites.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Ir à viagem e dar o golpe do \"esqueci a carteira\" na hora de pagar as contas do restaurante do grupo.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ FALTA DE ÉTICA. Transferir seus custos de lazer para terceiros destrói relacionamentos e integridade pessoal.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Vender os móveis da sua casa para conseguir o dinheiro da viagem à vista.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ DESFAZIMENTO PATRIMONIAL IRRACIONAL. Queimar patrimônio durável de casa para custear consumo passageiro de lazer é um péssimo negócio.",
        "points": 0
      }
    ]
  },
  {
    "id": 20,
    "block": 1,
    "questaoNum": 20,
    "title": "Aluguel vs Financiamento sem Entrada",
    "subtitle": "Finanças Pessoais & Consumo",
    "context": "Você mora de aluguel e paga R$ 1.200 por mês. Um corretor te oferece um apartamento onde a parcela ficará em R$ 2.200 por mês em 35 anos, além de exigir R$ 30.000 de entrada que você não tem. Ele sugere pegar um empréstimo pessoal para a entrada. Como agir?",
    "options": [
      {
        "origLabel": "A",
        "text": "Pegar o empréstimo pessoal de R$ 30.000 para dar a entrada e assumir a parcela de R$ 2.200, afinal \"aluguel é dinheiro jogado fora\".",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 SOBRE-ENDIVIDAMENTO GRAVE. Pegar empréstimo pessoal (juros altos) para dar entrada em um financiamento longo (mais juros) compromete drasticamente a renda familiar. As chances de inadimplência e perda do imóvel são altíssimas.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Permanecer no aluguel de R$ 1.200, focar em juntar o valor da entrada com disciplina em investimentos com rendimento e só financiar quando a parcela couber confortavelmente na renda.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ PLANEJAMENTO HABITACIONAL INTELIGENTE! Aluguel não é dinheiro jogado fora: é o custo de moradia e flexibilidade enquanto você se estrutura. Juntar a entrada antes de comprar garante taxas menores e paz de espírito.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Assinar o contrato de financiamento e parar de pagar o aluguel e a parcela no primeiro mês.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ PERDA DO BEM E LEILÃO. A alienação fiduciária permite ao banco leiloar o imóvel rapidamente em caso de não pagamento das parcelas.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Ocupar um imóvel abandonado sem qualquer regularidade jurídica para economizar o valor.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 INSEGURANÇA JURÍDICA E ILEGALIDADE. Viver sem segurança jurídica expõe a família a despejos compulsórios e ações judiciais.",
        "points": 0
      }
    ]
  },
  {
    "id": 21,
    "block": 1,
    "questaoNum": 21,
    "title": "IPCA vs Inflação Pessoal",
    "subtitle": "Finanças Pessoais & Consumo",
    "context": "O noticiário diz que \"a inflação oficial (IPCA) foi de 4% no ano\". Porém, ao fazer compras de mercado, você percebeu que os alimentos que você consome subiram mais de 15%. Por que existe essa diferença?",
    "options": [
      {
        "origLabel": "A",
        "text": "Acreditar que os dados do governo são totalmente inventados e não refletem nada do país.",
        "type": "partial",
        "icon": "⚠️",
        "feedback": "⚠️ VISÃO SIMPLISTA. O IPCA é medido pelo IBGE com critérios científicos rigorosos em várias capitais, mas mede a média nacional de várias faixas de renda, não o seu consumo individual específico.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Entender que o IPCA mede uma média ponderada de uma cesta gigante de produtos e serviços, enquanto a \"sua inflação pessoal\" depende do peso que os alimentos e demais consumos têm no seu consumo individual.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ COMPREENSÃO ECONÔMICA AVANÇADA! Para famílias de menor renda, o peso da alimentação e transporte é proporcionalmente muito maior no orçamento. Por isso, quando a comida sobe, a \"inflação sentida\" é bem maior do que a média geral.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Exigir que o supermercado reduza o valor do feijão para bater exatamente com os 4% do IPCA oficial.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ DESCONEXÃO DE MERCADO. Mercados repassam preços do atacado e das safras do campo; o índice oficial é uma medição estatística, não um tabelamento de preços de prateleira.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Parar de comprar alimentos e consumir apenas produtos importados sem imposto.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ IMPOSSIBILIDADE PRÁTICA. Produtos importados também sofrem variação cambial e tributária, sendo insustentável para a dieta básica doméstica.",
        "points": 0
      }
    ]
  },
  {
    "id": 22,
    "block": 1,
    "questaoNum": 22,
    "title": "Golpe do Falso Pix / Vendas Online",
    "subtitle": "Finanças Pessoais & Consumo",
    "context": "Você está vendendo um videogame por R$ 1.000 em um site. Um comprador diz: \"Já fiz o PIX, mas a plataforma pede para você clicar nesse link SMS para liberar o saldo\". Você olha no aplicativo bancário e o saldo ainda não caiu. O que fazer?",
    "options": [
      {
        "origLabel": "A",
        "text": "Clicar no link do SMS, digitar suas senhas do banco e entregar o videogame ao motoboy enviado.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 GOLPE DO FALSO PAGAMENTO / PHISHING! O link do SMS é uma página falsa para roubar seus dados de acesso ao banco e o \"comprovante\" enviado pelo comprador era editado. Você perde o produto e tem a conta invadida.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Não clicar no link e só entregar o produto após verificar diretamente no extrato oficial do seu aplicativo bancário que o dinheiro do PIX foi efetivamente creditado.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ SEGURANÇA FINANCEIRA DIGITAL! O PIX caindo na conta real do seu aplicativo bancário oficial é a única prova válida de pagamento. Mensagens de texto, e-mails ou prints de telas podem ser facilmente forjados por criminosos.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Enviar o videogame antes do dinheiro cair porque a pessoa pareceu confiável na foto de perfil.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ NEGLIGÊNCIA OPERACIONAL. Negócios digitais exigem confirmação estrita de recebimento para evitar fraudes de engenharia social.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Mandar suas senhas escritas em papel junto com o produto vendido.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 EXPOSIÇÃO TOTAL DE DADOS. Compartilhar credenciais bancárias violará os termos de segurança do banco e resultará na perda integral dos seus recursos depositados.",
        "points": 0
      }
    ]
  },
  {
    "id": 23,
    "block": 1,
    "questaoNum": 23,
    "title": "Salário Nominal vs Custo de Vida em Mudança",
    "subtitle": "Finanças Pessoais & Consumo",
    "context": "Você recebe uma proposta para mudar de cidade e trabalhar em uma capital recebendo R$3.000 de salário. Na sua cidade atual do interior, você ganha R$ 2.200. Antes de aceitar, qual levantamento financeiro fazer?",
    "options": [
      {
        "origLabel": "A",
        "text": "Aceitar na hora, afinal R$ 3.000 é um valor nominalmente maior do que R$ 2.200, portanto você ficará mais rico.",
        "type": "partial",
        "icon": "⚠️",
        "feedback": "⚠️ ILUSÃO DO SALÁRIO NOMINAL. Se o aluguel na capital for o triplo do interior e o transporte custar o dobro, os R$ 3.000 líquidos farão você viver com menos qualidade de vida do que com os R$ 2.200 na sua cidade de origem.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Pesquisar detalhadamente o custo de vida da nova capital (aluguel, transporte, alimentação e energia) para conferir se os R$ 3.000 terão poder de compra superior ou inferior aos R$ 2.200 no interior.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ COMPARAÇÃO DE PODER DE COMPRA REAL! O que importa na economia familiar é a renda real (quanto o seu dinheiro compra na localidade em que você vive), e não apenas o número estampado no holerite.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Mudar-se sem pesquisar nada e morar em hotel até achar um lugar definitivo.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ DESPERDÍCIO DE RECURSOS EM MORADIA TEMPORÁRIA. Hospedagem informal ou hotéis consomem a reserva de mudança em poucas semanas sem planejamento prévio.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Exigir que a nova empresa compre uma casa própria no seu nome na nova cidade antes de você iniciar o contrato.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ EXIGÊNCIA FORA DA REALIDADE DE MERCADO. Empresas privadas não doam imóveis para funções operacionais sem previsão em contrato de transferência executiva.",
        "points": 0
      }
    ]
  },
  {
    "id": 24,
    "block": 1,
    "questaoNum": 24,
    "title": "Custo de Fidelidade vs Economia Mensal",
    "subtitle": "Finanças Pessoais & Consumo",
    "context": "Sua operadora de celular cobra R$ 90/mês pelo plano. Uma concorrente oferece plano idêntico por R$ 40/mês. Você resolve mudar, mas a empresa atual cobra multa contratual de R$ 300 por fidelidade. Como calcular a transição?",
    "options": [
      {
        "origLabel": "A",
        "text": "Desistir de trocar de plano e continuar pagando R$ 90 para sempre para evitar pagar a multa de R$ 300.",
        "type": "partial",
        "icon": "⚠️",
        "feedback": "⚠️ INÉRCIA FINANCEIRA. Medo de multas operacionais pontuais muitas vezes faz o consumidor continuar pagando serviços superfaturados no longo prazo.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Calcular a economia mensal (R$ 50/mês de economia). Em 6 meses, a economia acumulada (6 x R$ 50 = R$ 300) paga a multa integralmente, valendo a pena fazer a migração.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ ANÁLISE DE PAYBACK / RETORNO DE INVESTIMENTO! Calcular o tempo necessário para recuperar o custo do cancelamento (Payback) é a forma técnica correta de tomar decisões de corte de custos recorrentes.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Trocar de operadora e simplesmente recusar-se a pagar a fatura final com a multa da operadora antiga.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ INADIMPLÊNCIA CONTRATUAL. As multas de fidelidade são legalmente amparadas pela Anatel se previstas em contrato. O não pagamento gera cobrança judicial e negativação do CPF.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Jogar o chip fora e usar apenas internet pública de praças.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ QUALIDADE DE VIDA E CONECTIVIDADE PREJUDICADAS. Ficar sem conectividade básica impacta oportunidades de trabalho, estudos e comunicação familiar.",
        "points": 0
      }
    ]
  },
  {
    "id": 25,
    "block": 1,
    "questaoNum": 25,
    "title": "Balanço Anual e Reserva de Emergência",
    "subtitle": "Finanças Pessoais & Consumo",
    "context": "Você chegou ao final do primeiro ano gerenciando sua vida financeira de forma consciente e percebeu que gastou exatamente 100% de tudo o que ganhou (saldo zero: nem deveu nada, mas também não sobrou nada). Qual o próximo passo?",
    "options": [
      {
        "origLabel": "A",
        "text": "Achar que a gestão foi um sucesso absoluto e manter exatamente a mesma rotina sem mudanças, pois \"o importante é não ter ficado no vermelho\".",
        "type": "partial",
        "icon": "⚠️",
        "feedback": "⚠️ ZONA DE PERIGO. Empatar o orçamento significa que você não está construindo reserva nem gerando patrimônio. Qualquer emergência no ano seguinte jogará seu saldo no negativo.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Compreender que viver na \"corda bamba\" do saldo zero deixa sua família extremamente vulnerável a imprevistos futuros, sendo necessário criar uma meta de poupar de 10% a 20% da renda no ano seguinte.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ MINDSET DE CONSTRUÇÃO DE PATRIMÔNIO! O verdadeiro sucesso financeiro não é apenas zerar as dívidas, mas sim conseguir gerar superávit (sobra de caixa) recorrente para construir sua independência e segurança no futuro.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Começar o ano novo contratando empréstimos para gastar mais do que ganha, já que o controle estressou sua rotina.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 RETROCESSO ORÇAMENTÁRIO. Voltar a se endividar por frustração destrói todo o avanço de disciplina conquistado no período.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Desistir de anotar gastos e deixar a vida financeira ser guiada pelo acaso.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ APATIA E EXPOSIÇÃO A CRISES. Abandonar a gestão financeira aumenta a probabilidade de endividamento descontrolado a médio prazo.",
        "points": 0
      }
    ]
  },
  {
    "id": 26,
    "block": 2,
    "questaoNum": 1,
    "title": "Financiamento dos Serviços Públicos",
    "subtitle": "Gestão Municipal & Serviços",
    "context": "Muitos cidadãos acreditam que os serviços públicos são \"gratuitos\". Como prefeito, você precisa explicar em uma palestra comunitária como esses serviços são financiados de fato. Como você explica o papel dos impostos?",
    "options": [
      {
        "origLabel": "A",
        "text": "Explicar que os serviços são um presente da prefeitura e que o dinheiro vem de doações de empresários voluntários.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ DESINFORMAÇÃO SOBRE A MÁQUINA PÚBLICA. Ilude o cidadão sobre a origem dos recursos. A prefeitura não vive de doações voluntárias, mas da arrecadação compulsória de tributos.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Explicar que não existe \"serviço grátis\": a população paga impostos (como IPTU e ISS) e o governo devolve esse dinheiro arrecadado em forma de médicos, remédios, professores e merenda.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ CONSCIÊNCIA CIDADÃ E FUNÇÃO SOCIAL DOS TRIBUTOS! Os impostos são o investimento coletivo da sociedade. Compreender isso faz o cidadão valorizar e fiscalizar a qualidade das escolas e hospitais.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Dizer que a prefeitura imprime dinheiro próprio na gráfica municipal para pagar todas as contas da cidade.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 IMPOSSIBILIDADE ECONÔMICA E CRIME. Municípios não têm soberania monetária para emitir moeda, e a emissão desenfreada de dinheiro gera hiperinflação.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Afirmar que a educação e a saúde são pagas exclusivamente com repasses do governo de outros países.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ ERRO CONCEITUAL. A arrecadação local e os repasses constitucionais internos são as reais fontes de custeio dos serviços públicos locais.",
        "points": 0
      }
    ]
  },
  {
    "id": 27,
    "block": 2,
    "questaoNum": 2,
    "title": "Limite da LRF e Folha de Pagamento",
    "subtitle": "Gestão Municipal & Serviços",
    "context": "É ano de eleição municipal e a folha de pagamento da prefeitura já atingiu 53,2% da Receita Corrente Líquida, aproximando-se do limite de 54% da Lei de Responsabilidade Fiscal (LRF). Sindicatos exigem reajuste de 10%. Como agir?",
    "options": [
      {
        "origLabel": "A",
        "text": "Conceder o reajuste de 10% para garantir popularidade nas urnas, ultrapassando o limite da LRF.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 CRIME DE RESPONSABILIDADE FISCAL. Ultrapassar o limite da LRF gera rejeição de contas pelo Tribunal de Contas, ineligibilidade do prefeito e bloqueio de repasses federais.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Negar o reajuste acima da LRF, explicando a trava legal e aplicando medidas de contenção de despesas com cargos comissionados para manter a prefeitura dentro da lei.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ RESPONSABILIDADE E LEGALIDADE! Respeitar a LRF preserva as contas da cidade, garante que os salários continuem sendo pagos em dia no futuro e evita sanções jurídicas graves.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Aumentar os salários e parar de pagar a conta de luz dos hospitais municipais para compensar.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ SUCATEAMENTO DE SERVIÇOS ESSENCIAIS. Desviar verbas de custeio da saúde para gastos com pessoal desestrutura o atendimento básico à população.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Maquiar os relatórios fiscais do município para esconder o excesso de gastos dos órgãos de fiscalização.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 FRAUDE CONTÁBIL E IMPROBIDADE. Maquiar contas públicas é crime gravíssimo com penalidades de perda do mandato e prisão.",
        "points": 0
      }
    ]
  },
  {
    "id": 28,
    "block": 2,
    "questaoNum": 3,
    "title": "Taxa de Coleta de Lixo (Marco do Saneamento)",
    "subtitle": "Gestão Municipal & Serviços",
    "context": "O Marco Legal do Saneamento Básico exige que os municípios garantam a sustentabilidade financeira dos serviços de limpeza e lixo. Sua cidade não cobra nenhuma taxa por esse serviço e usa recursos da saúde para pagar os caminhões. O que fazer?",
    "options": [
      {
        "origLabel": "A",
        "text": "Criar a Taxa de Coleta de Resíduos Sólidos com valores proporcionais ao tamanho do imóvel e ao volume gerado, cobrando do contribuinte para liberar orçamento para a saúde.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ SUSTENTABILIDADE E LEGALIDADE! Taxas são tributos vinculados a um serviço específico. Cobrar a taxa de lixo cumpre a lei federal e devolve verbas essenciais para a saúde pública.",
        "points": 10
      },
      {
        "origLabel": "B",
        "text": "Ignorar a lei federal para não perder votos e continuar retirando dinheiro da saúde básica para pagar os caminhões de lixo.",
        "type": "partial",
        "icon": "⚠️",
        "feedback": "⚠️ RENÚNCIA DE RECEITA ILEGAL. Descumprir o Marco do Saneamento configura renúncia de receita não planejada, podendo gerar punições ao gestor pelo Tribunal de Contas.",
        "points": 0
      },
      {
        "origLabel": "C",
        "text": "Cancelar 100% da coleta de lixo na cidade e mandar os moradores queimarem o lixo no quintal.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 CATASTROFE SANITÁRIA E AMBIENTAL. Queimar lixo causa doenças respiratórias graves, poluição do ar e epidemias na cidade.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Criar um imposto geral idêntico para empresas gigantes e famílias de extrema pobreza sem qualquer diferenciação.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ VIOLAÇÃO DA CAPACIDADE CONTRIBUTIVA. Cobranças sem diferenciação pesam excessivamente sobre os mais vulneráveis.",
        "points": 0
      }
    ]
  },
  {
    "id": 29,
    "block": 2,
    "questaoNum": 4,
    "title": "Guerra Fiscal e Alíquota Mínima do ISS",
    "subtitle": "Gestão Municipal & Serviços",
    "context": "Uma grande empresa de tecnologia quer se instalar na cidade gerando 500 empregos, mas exige alíquota de ISS de 1%. Pela legislação federal (CF/88), a alíquota mínima do ISS para municípios é de 2%. Como decidir?",
    "options": [
      {
        "origLabel": "A",
        "text": "Aceitar a proposta e baixar a alíquota para 1%, ignorando a Lei Federal.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 IMPROBIDADE FISCAL (GUERRA FISCAL). Conceder ISS abaixo do piso constitucional de 2% é ato de improbidade administrativa e anula o benefício fiscal.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Reduzir o ISS para o limite mínimo legal de 2%, demonstrando estimativa de impacto orçamentário conforme exige a Lei de Responsabilidade Fiscal.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ DESENVOLVIMENTO ECONÔMICO LEGAL! Reduzir para o limite permitido de 2% atrai a empresa de forma segura, gera empregos e cumpre as exigências legais da LRF.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Recusar a negociação e aumentar a taxa de ISS para 10% como punição pela exigência da empresa.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ PERDA DE INVESTIMENTO. Aumentar o tributo afugenta empresas para cidades vizinhas, gerando desemprego local.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Cobrar 0% de ISS da empresa e cobrar uma taxa em dinheiro \"por fora\" do empresário para a prefeitura.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 CORRUPÇÃO E CRIME DE CONCUSSÃO. Cobranças informais e ilícitas resultam em prisão imediata dos envolvidos.",
        "points": 0
      }
    ]
  },
  {
    "id": 30,
    "block": 2,
    "questaoNum": 5,
    "title": "Limite Constitucional da Educação (25%)",
    "subtitle": "Gestão Municipal & Serviços",
    "context": "Chegou o mês de dezembro e a contabilidade avisa que o município aplicou apenas 22% da receita de impostos na Manutenção e Desenvolvimento do Ensino (MDE). A Constituição exige o mínimo de 25%. O que fazer?",
    "options": [
      {
        "origLabel": "A",
        "text": "Gastar os 3% restantes adquirindo livros, reformando escolas e pagando a capacitação de professores antes do encerramento do ano fiscal.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ CUMPRIMENTO CONSTITUCIONAL! Aplicar os 25% obrigatórios valoriza a rede pública de ensino e evita a rejeição das contas anuais pelo Tribunal de Contas.",
        "points": 10
      },
      {
        "origLabel": "B",
        "text": "Transferir a verba faltante para o caixa das festas de fim de ano da prefeitura.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 DESVIO DE FINALIDADE. Usar verba vinculada à educação em eventos festivos é ilegal e acarreta crime de responsabilidade.",
        "points": 0
      },
      {
        "origLabel": "C",
        "text": "Alterar os livros contábeis fingindo que foram gastos 25% na educação.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 CRIME DE FALSIDADE IDEOLÓGICA. Fraudar relatórios orçamentários leva à cassação do mandato.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Declarar que a cidade não precisa de investimentos em escolas e pedir dispensa do limite constitucional ao governo federal.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ IMPOSSIBILIDADE JURÍDICA. O piso de 25% é cláusula pétrea constitucional e não admite dispensa individual.",
        "points": 0
      }
    ]
  },
  {
    "id": 31,
    "block": 2,
    "questaoNum": 6,
    "title": "Merenda Escolar e Agricultura Familiar",
    "subtitle": "Gestão Municipal & Serviços",
    "context": "A prefeitura precisa comprar merenda escolar para 10.000 alunos. A Lei do PNAE estabelece que no mínimo 30% dos recursos da merenda devem vir da Agricultura Familiar local. Uma multinacional oferece cobrir tudo com desconto. Como agir?",
    "options": [
      {
        "origLabel": "A",
        "text": "Comprar 100% dos alimentos da multinacional processada porque o preço unitário inicial está mais barato.",
        "type": "partial",
        "icon": "⚠️",
        "feedback": "⚠️ VIOLAÇÃO DO PNAE E MÁ NUTRIÇÃO. Descumprir a cota da agricultura familiar fere a legislação federal e oferece ultraprocessados de menor valor nutricional aos alunos.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Destinar pelo menos 30% da verba para os pequenos produtores e cooperativas agrícolas da região e licitar o restante, garantindo comida saudável e desenvolvimento rural.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ DESENVOLVIMENTO LOCAL E SAÚDE! A compra da agricultura familiar movimenta a economia do campo na cidade, gera renda para os agricultores e oferece comida fresca nas escolas.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Cancelar a merenda escolar e pedir para as crianças levarem comida de casa.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ DESERÇÃO SOCIAL. A merenda escolar é a principal refeição do dia para milhares de crianças vulneráveis.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Comprar os alimentos de parentes do prefeito sem nenhum processo licitatório.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 NEPOTISMO E CORRUPÇÃO. Contratar familiares violando o princípio da impessoalidade anula o contrato e gera punição criminal.",
        "points": 0
      }
    ]
  },
  {
    "id": 32,
    "block": 2,
    "questaoNum": 7,
    "title": "Recursos da Iluminação Pública (COSIP)",
    "subtitle": "Gestão Municipal & Serviços",
    "context": "Bairros periféricos estão no escuro, gerando assaltos. A Contribuição de Iluminação Pública (COSIP) é cobrada na conta de luz dos moradores e há um superávit não utilizado. Como utilizar esse recurso?",
    "options": [
      {
        "origLabel": "A",
        "text": "Usar a verba da COSIP para asfaltar a avenida do bairro nobre onde moram os secretários.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 DESVIO DE VINCULAÇÃO TRIBUTÁRIA. A COSIP é tributo com destinação vinculada por lei. Gastar em asfalto é desvio de finalidade.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Usar o saldo da COSIP exclusivamente para expandir a rede de iluminação pública com lâmpadas LED nos bairros escuros e vulneráveis.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ USO CORRETO DA VINCULAÇÃO! A iluminação de LED economiza energia futura, melhora a segurança e aplica a verba exatamente na finalidade para a qual foi cobrada do cidadão.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Guardar o dinheiro no banco sem aplicar na cidade para render juros indefinidamente.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ APATIA ADMINISTRATIVA. Manter verbas carimbadas paradas enquanto a população sofre com a falta do serviço é má gestão.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Usar o dinheiro da COSIP para pagar o salário dos médicos do posto de saúde.",
        "type": "partial",
        "icon": "⚠️",
        "feedback": "⚠️ DESVIO DE RECURSO CARIMBADO. Embora a saúde precise de recursos, a COSIP não pode custear pagamentos fora do seu escopo constitucional (iluminação).",
        "points": 0
      }
    ]
  },
  {
    "id": 33,
    "block": 2,
    "questaoNum": 8,
    "title": "Subsídio Tarifário no Transporte Público",
    "subtitle": "Gestão Municipal & Serviços",
    "context": "A empresa de ônibus exige aumento da passagem de R$4,00 para R$6,00 devido ao aumento do combustível. Esse aumento vai pesar demais na renda dos trabalhadores. Como gestor municipal, qual solução técnica adotar?",
    "options": [
      {
        "origLabel": "A",
        "text": "Autorizar o aumento para R$6,00 sem nenhuma exigência de melhoria da frota.",
        "type": "partial",
        "icon": "⚠️",
        "feedback": "⚠️ IMPACTO SOCIAL NEGATIVO. Um aumento abrupto reduz o acesso ao transporte e aumenta a inadimplência e o desemprego na cidade.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Criar um Subsídio Tarifário mantendo a tarifa em R$4,50 e cobrindo a diferença com verbas gerais, em troca de metas rígidas de frota nova e pontualidade.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ EQUILÍBRIO SOCIAL E CONTRATUAL! O subsídio do transporte garante a mobilidade urbana dos mais pobres usando a arrecadação geral de impostos para baratear um serviço essencial.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Encerrar o contrato de ônibus e deixar a população andar a pé.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 COLAPSO URBANO. Cancelar o transporte público paralisa a economia municipal e o acesso a escolas e hospitais.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Tabela o preço do diesel nos postos da cidade à força.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ ILEGALIDADE E DESABASTECIMENTO. O município não tem competência para tabelar preços de combustíveis.",
        "points": 0
      }
    ]
  },
  {
    "id": 34,
    "block": 2,
    "questaoNum": 9,
    "title": "Planta Genérica de Valores (IPTU)",
    "subtitle": "Gestão Municipal & Serviços",
    "context": "A Planta Genérica de Valores não é atualizada na sua cidade há 20 anos. Mansões em bairros nobres pagam imposto irrisório como se fossem terrenos baratos. Qual medida adotar?",
    "options": [
      {
        "origLabel": "A",
        "text": "Manter a tabela antiga desatualizada para não enfrentar desgastes políticos com os proprietários mais ricos.",
        "type": "partial",
        "icon": "⚠️",
        "feedback": "⚠️ JUSTIÇA FISCAL PREJUDICADA. Manter a tabela defasada faz a prefeitura arrecadar pouco e perpetua privilégios para quem tem maior capacidade contributiva.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Enviar projeto de lei à Câmara Municipal para atualizar a Planta Genérica de Valores, corrigindo distorções e fazendo os imóveis valorizados pagarem um valor justo.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ EQUIDADE E CORREÇÃO HISTÓRICA! Atualizar a PGV faz com que a cobrança reflita a realidade do mercado imobiliário, promovendo justiça fiscal e aumentando a arrecadação de forma progressiva.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Quadruplicar o IPTU apenas dos moradores da periferia para compensar.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ TRIBUTAÇÃO REGRESSIVA E INJUSTA. Penalizar a periferia viola frontalmente o princípio da capacidade contributiva.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Cancelar a cobrança do IPTU para toda a cidade sem criar outra fonte de receita.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 RENÚNCIA DE RECEITA E QUEBRA MUNICIPAL. Zerar o principal imposto direto do município inviabiliza o pagamento dos serviços públicos básicos.",
        "points": 0
      }
    ]
  },
  {
    "id": 35,
    "block": 2,
    "questaoNum": 10,
    "title": "Atenção Básica vs Alta Complexidade no SUS",
    "subtitle": "Gestão Municipal & Serviços",
    "context": "Seu orçamento da Saúde está apertado. A obrigação municipal principal no SUS é a Atenção Básica (UBS). Um vereador propõe gastar todo o dinheiro construindo um hospital de alta complexidade. O que fazer?",
    "options": [
      {
        "origLabel": "A",
        "text": "Atender ao vereador e construir o hospital de alta complexidade, mesmo deixando as Unidades Básicas de Saúde (UBS) sem remédios e sem médicos.",
        "type": "partial",
        "icon": "⚠️",
        "feedback": "⚠️ DESVIAMENTO DE COMPETÊNCIA SUS. O município assume uma conta gigante de média/alta complexidade que não consegue manter, enquanto a prevenção primária colapsa.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Priorizar o fortalecimento da Atenção Básica e das UBSs locais, articulando com o Governo do Estado a pactuação para atendimentos de alta complexidade.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ GESTÃO EFICIENTE DO SUS! A Atenção Básica resolve até 80% dos problemas de saúde da população a um custo muito menor, evitando que as pessoas adoeçam gravemente.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Fechar todos os postos de saúde da cidade e privatizar 100% da saúde municipal.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ VIOLAÇÃO DO DIREITO À SAÚDE. Privatizar sem rede pública de proteção deixa a população de baixa renda sem qualquer atendimento.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Usar a verba da saúde para construir um estádio de futebol.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 DESVIO GRAVE DE FINALIDADE. Usar recursos vinculados da saúde para esportes de lazer é ilícito gravíssimo.",
        "points": 0
      }
    ]
  },
  {
    "id": 36,
    "block": 2,
    "questaoNum": 11,
    "title": "Portal da Transparência e Controle Social",
    "subtitle": "Gestão Municipal & Serviços",
    "context": "Um grupo de cidadãos bate à porta da prefeitura querendo saber quanto o município arrecadou de impostos e quanto foi gasto em reformas de postos e merenda. O que o prefeito deve fazer?",
    "options": [
      {
        "origLabel": "A",
        "text": "Mandar a segurança expulsar os moradores e colocar sigilo de 10 anos nas contas de arrecadação de impostos.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 VIOLAÇÃO DA LAI E DA LRF. Esconder contas públicas fere a Lei de Acesso à Informação e a Lei de Responsabilidade Fiscal, gerando punição ao gestor.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Manter atualizado o Portal da Transparência na internet, detalhando centavo por centavo da receita de impostos e das notas fiscais das despesas públicas.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ CONTROLE SOCIAL E TRANSPARÊNCIA! O dinheiro do imposto pertence ao povo. Mostrar como ele é aplicado fortalece a confiança entre cidadão e governo.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Mostrar os gastos apenas para os vereadores aliados e esconder do restante da população.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ QUEBRA DA IMPESSOALIDADE. A informação sobre dinheiro público é um direito universal de todos os cidadãos, sem distinção.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Publicar dados falsos no site da prefeitura com números inventados.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 CRIME CONTRA A ADMINISTRAÇÃO PÚBLICA. Falsificar documentos orçamentários acarreta processo de cassação imediata.",
        "points": 0
      }
    ]
  },
  {
    "id": 37,
    "block": 2,
    "questaoNum": 12,
    "title": "Vagas em Creches Municipais",
    "subtitle": "Gestão Municipal & Serviços",
    "context": "Mães trabalhadoras de baixa renda não têm onde deixar seus filhos de 0 a 3 anos porque faltam 500 vagas em creches na cidade. A arrecadação de tributos subiu 10% este ano. Como priorizar esse recurso?",
    "options": [
      {
        "origLabel": "A",
        "text": "Gastar o aumento da arrecadação construindo duas novas Creches Municipais e contratando educadores por concurso público.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ PRIORIZAÇÃO DA PRIMEIRA INFÂNCIA! Investir impostos em creches atende o direito constitucional da criança, permite que as mães trabalhem e gerem renda, e reduz a desigualdade social.",
        "points": 10
      },
      {
        "origLabel": "B",
        "text": "Usar o excesso de arrecadação para aumentar os subsídios dos combustíveis dos carros oficiais do prefeito.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ INVERSÃO DE PRIORIDADES. Queimar recursos públicos com regalias da alta burocracia prejudica a prestação de serviços essenciais.",
        "points": 0
      },
      {
        "origLabel": "C",
        "text": "Dizer às mães que a prefeitura não cuida de crianças pequenas e que a responsabilidade é unicamente delas.",
        "type": "partial",
        "icon": "⚠️",
        "feedback": "⚠️ OMISSÃO DE DEVER CONSTITUCIONAL. A Educação Infantil (creches e pré-escolas) é responsabilidade prioritária dos municípios segundo a Constituição.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Usar o dinheiro da arrecadação para comprar fogos de artifício para o aniversário da cidade.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ GASTO FÚTIL. Queimar recursos escassos em entretenimento passageiro enquanto faltam creches demonstra péssima alocação orçamentária.",
        "points": 0
      }
    ]
  },
  {
    "id": 38,
    "block": 2,
    "questaoNum": 13,
    "title": "Transporte Escolar Rural",
    "subtitle": "Gestão Municipal & Serviços",
    "context": "Crianças da zona rural caminham 10 km todos os dias sob sol e chuva porque os ônibus escolares antigos quebraram. A frota precisa de R$ 500 mil para ser renovada. De onde vem esse dinheiro?",
    "options": [
      {
        "origLabel": "A",
        "text": "Utilizar os recursos do Fundeb e da arrecadação de impostos vinculados à Educação para comprar novos ônibus escolares com acessibilidade e cinto de segurança.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ ACESSO À EDUCAÇÃO E DIGNIDADE! O imposto arrecadado garante que o direito à escola seja uma realidade para todos os estudantes, inclusive os mais distantes da área urbana.",
        "points": 10
      },
      {
        "origLabel": "B",
        "text": "Exigir que os pais das crianças paguem uma mensalidade em dinheiro para a prefeitura consertar os ônibus.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 COBRANÇA ILEGAL. A Constituição proíbe qualquer cobrança de mensalidade ou taxa para acesso ao ensino público fundamental.",
        "points": 0
      },
      {
        "origLabel": "C",
        "text": "Cancelar as aulas na zona rural para não ter que gastar dinheiro com transporte.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 VIOLAÇÃO DE DIREITO FUNDAMENTAL. Fechar escolas rurais nega o direito básico à educação e estimula o êxodo rural desordenado.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Sugerir que os alunos vão para a escola montados em cavalos próprios.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ INADMISSIBILIDADE PRÁTICA. O poder público deve fornecer transporte escolar seguro e regulamentado.",
        "points": 0
      }
    ]
  },
  {
    "id": 39,
    "block": 2,
    "questaoNum": 14,
    "title": "Combate a Endemias e Vigilância Sanitária",
    "subtitle": "Gestão Municipal & Serviços",
    "context": "A cidade enfrenta um surto de Dengue e Chikungunya. Agentes de endemias precisam de equipamentos e inseticidas para vistoriar casas e eliminar focos de Aedes aegypti. De onde vem o custeio?",
    "options": [
      {
        "origLabel": "A",
        "text": "Custear a operação de vigilância sanitária e combate a endemias com o orçamento da Saúde alimentado pelos impostos municipais e repasses do SUS.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ SAÚDE PREVENTIVA E PROTEÇÃO COLETIVA! Investir impostos na prevenção de epidemias custa muito mais barato do que tratar pacientes internados nos hospitais depois.",
        "points": 10
      },
      {
        "origLabel": "B",
        "text": "Cobrar uma \"taxa de visita\" de R$ 50,00 de cada morador cuja casa for vistoriada pelo agente de saúde.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ DESESTÍMULO À FISCALIZAÇÃO. Cobrar taxas por vistoria sanitária faz as pessoas trancarem as portas para os agentes, agravando a epidemia.",
        "points": 0
      },
      {
        "origLabel": "C",
        "text": "Mandar os moradores resolverem o problema por conta própria sem qualquer apoio da prefeitura.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 OMISSÃO DE SAÚDE PÚBLICA. O combate a vetores de doenças transmissíveis é um dever do Estado e da vigilância epidemiológica municipal.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Usar a verba da vigilância sanitária para patrocinar um time de futebol profissional da capital.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 DESVIO DE FINALIDADE. Usar recursos carimbados da saúde em patrocínio esportivo privado é ilegal.",
        "points": 0
      }
    ]
  },
  {
    "id": 40,
    "block": 2,
    "questaoNum": 15,
    "title": "Lei de Acesso à Informação (LAI)",
    "subtitle": "Gestão Municipal & Serviços",
    "context": "Jornalistas e moradores solicitam via Portal da Transparência a lista detalhada com salários e diárias pagos a todos os secretários e ao prefeito. Assessores sugerem negar o pedido. Como proceder?",
    "options": [
      {
        "origLabel": "A",
        "text": "Negar as informações e colocar sigilo de 10 anos nas contas da prefeitura.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 VIOLAÇÃO DA LAI E IMPROBIDADE. Negar informações de interesse público gera sanções dos órgãos de controle e denúncia no Ministério Público.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Cumprir a Lei de Acesso à Informação (LAI) e disponibilizar os dados de remuneração pública no Portal da Transparência, garantindo o controle social dos gastos.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ TRANSPARÊNCIA E CIDADANIA! O dinheiro público deve ser auditável pelo cidadão. A transparência previne a corrupção e fortalece a gestão.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Divulgar apenas os dados da oposição e esconder os dados do seu grupo político.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ USO POLÍTICO DA MÁQUINA. Tratar a informação pública com parcialidade viola o princípio constitucional da Impessoalidade.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Excluir o Portal da Transparência da internet para ninguém ter acesso.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 APAGÃO DE DADOS E ILEGALIDADE. Retirar o portal do ar bloqueia repasses de convênios estaduais e federais ao município.",
        "points": 0
      }
    ]
  },
  {
    "id": 41,
    "block": 2,
    "questaoNum": 16,
    "title": "Saneamento Básico vs Prevenção de Saúde",
    "subtitle": "Gestão Municipal & Serviços",
    "context": "Estudos mostram que para cada R$1,00 investido em saneamento básico (esgoto e água), economiza-se R$4,00 em saúde pública. Bairros periféricos jogam esgoto a céu aberto. Como agir no orçamento?",
    "options": [
      {
        "origLabel": "A",
        "text": "Destinar verbas de investimentos em obras da LOA (Lei Orçamentária Anual) para universalizar a rede de esgoto nos bairros vulneráveis.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ INTEGRAÇÃO ENTRE SANEAMENTO E SAÚDE! Aplicar o dinheiro dos impostos em saneamento evita que crianças adoeçam, esvazia os leitos dos hospitais públicos e traz eficiência ao gasto.",
        "points": 10
      },
      {
        "origLabel": "B",
        "text": "Ignorar o esgoto a céu aberto e gastar o dinheiro construindo um portal ornamental de luxo na entrada da cidade.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ FALTA DE PRIORIDADE SOCIAL. Gastar com obras puramente estéticas enquanto crianças pisam em esgoto a céu aberto é uma péssima escolha de gestão.",
        "points": 0
      },
      {
        "origLabel": "C",
        "text": "Dizer que esgoto não tem relação nenhuma com hospitais e saúde infantil.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ CEGUEIRA CIENTÍFICA. O saneamento básico é comprovadamente o maior fator de prevenção de doenças infectocontagiosas do mundo.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Jogar o esgoto da cidade diretamente dentro do reservatório de água potável que abastece as escolas.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 CRIME AMBIENTAL E DE SAÚDE PÚBLICA. Contaminar a água potável causa envenenamento e epidemias graves.",
        "points": 0
      }
    ]
  },
  {
    "id": 42,
    "block": 2,
    "questaoNum": 17,
    "title": "Regularização Fundiária Urbana (REBURB)",
    "subtitle": "Gestão Municipal & Serviços",
    "context": "Moradores de um bairro periférico consolidado vivem há 20 anos em terrenos informais sem escritura pública, impedidos de conseguir crédito para reformar suas casas. O que o prefeito pode fazer?",
    "options": [
      {
        "origLabel": "A",
        "text": "Implantar o programa de Regularização Fundiária Urbana (REBURB), entregando o título de propriedade (escritura) aos moradores e garantindo cidadania e valorização imobiliária.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ CIDADANIA E VALORIZAÇÃO PATRIMONIAL! A regularização fundiária transforma posse informal em propriedade legal, integrando o bairro à cidade formal e dando dignidade às famílias.",
        "points": 10
      },
      {
        "origLabel": "B",
        "text": "Demolir todas as casas do bairro com tratores e despejar os moradores sem qualquer alternativa habitacional.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 VIOLAÇÃO DE DIREITOS HUMANOS. Ações truculentas de despejo violam o direito à moradia digna garantido pela Constituição.",
        "points": 0
      },
      {
        "origLabel": "C",
        "text": "Cobrar impostos retroativos de 20 anos com juros abusivos antes de ouvir a comunidade.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ INVIABILIDADE SOCIAL. Punir moradores vulneráveis impede a regularização e perpetua a informalidade urbana.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Vender a área do bairro para uma construtora privada e despejar a comunidade local.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ INJUSTIÇA SOCIAL. Sacrificar comunidades consolidadas em favor da especulação imobiliária atenta contra o interesse público.",
        "points": 0
      }
    ]
  },
  {
    "id": 43,
    "block": 2,
    "questaoNum": 18,
    "title": "Fomento à Economia Comunitária",
    "subtitle": "Gestão Municipal & Serviços",
    "context": "Bairros periféricos possuem centenas de artesãos, pequenos cozinheiros e artistas informais. Eles pedem o uso de uma praça pública aos finais de semana para realizar uma feira cultural comunitária. Qual o encaminhamento?",
    "options": [
      {
        "origLabel": "A",
        "text": "Proibir o uso de qualquer espaço público por pequenos produtores e usar a guarda municipal para apreender as mercadorias.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ REPRESSÃO AO PEQUENO EMPREENDEDOR. Bloquear o uso do espaço público destrói a renda de famílias vulneráveis sem apresentar alternativas.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Regulamentar a Feira Comunitária, oferecer suporte de estrutura básica (barracas, iluminação, banheiros) e cadastrar os empreendedores no programa MEI municipal.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ FOMENTO À ECONOMIA LOCAL E CULTURA! Apoiar feiras nos bairros gera renda, movimenta o comércio comunitário, ocupa os espaços públicos com segurança e formaliza trabalhadores.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Entregar a praça pública de forma exclusiva para um único grande supermercado multinacional.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ DESVALORIZAÇÃO COMUNITÁRIA. Privatizar praças públicas para grandes grupos empresariais retira o espaço de lazer dos moradores.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Cobrar propina dos feirantes para autorizar a montagem das barracas.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 CRIME DE CORRUPÇÃO PASSIVA. Cobranças ilícitas de feirantes é crime grave do colarinho branco.",
        "points": 0
      }
    ]
  },
  {
    "id": 44,
    "block": 2,
    "questaoNum": 19,
    "title": "Cobrança de Dívida Ativa",
    "subtitle": "Gestão Municipal & Serviços",
    "context": "A prefeitura possui R$ 50 milhões em Dívida Ativa (IPTU e ISS não pagos no passado por grandes devedores). A procuradoria quer protestar em cartório e negativar o CNPJ desses grandes devedores. O que o prefeito decide?",
    "options": [
      {
        "origLabel": "A",
        "text": "Perdoar 100% da dívida de todos os grandes sonegadores sem exigir nada em troca.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 RENÚNCIA ILEGAL E INCENTIVO À SONEGAÇÃO. Perdoar dívidas sem amparo legal e compensação orçamentária é infração grave à LRF.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Autorizar a cobrança extrajudicial (protesto em cartório) e a execução fiscal dos grandes devedores, recuperando verbas para investimentos na cidade.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ JUSTIÇA FISCAL E RECUPERAÇÃO DE RECEITA! Cobrar a dívida ativa traz recursos limpos ao caixa da prefeitura sem ter que aumentar impostos para o cidadão pagador.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Cobrar apenas os devedores que devem menos de R$ 100,00 e deixar os milionários sem cobrança.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ INVERSÃO DA PRIORIDADE DE COBRANÇA. O custo administrativo de cobrar minidívidas costuma ser maior que o valor arrecadado, enquanto grandes devedores continuam impunes.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Vender a lista de devedores para empresas de cobrança clandestinas sem processo público.",
        "type": "partial",
        "icon": "⚠️",
        "feedback": "⚠️ VIOLAÇÃO DE SIGILO E LEGALIDADE. A cobrança de créditos públicos deve seguir ritos legais transparentes.",
        "points": 0
      }
    ]
  },
  {
    "id": 45,
    "block": 2,
    "questaoNum": 20,
    "title": "Guarda Municipal e Proteção do Patrimônio",
    "subtitle": "Gestão Municipal & Serviços",
    "context": "Escolas municipais estão sendo invadidas e vandalizadas durante os fins de semana, destruindo computadores comprados com impostos. Diretores pedem apoio da Guarda Municipal. Como utilizar a corporação?",
    "options": [
      {
        "origLabel": "A",
        "text": "Criar a Ronda Escolar da Guarda Municipal, utilizando os impostos para financiar o patrulhamento preventivo e sistemas de alarme nas escolas públicas.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ PROTEÇÃO DO PATRIMÔNIO PÚBLICO! A função constitucional primária da Guarda Municipal é proteger os bens, serviços e instalações do município, preservando o investimento do contribuinte.",
        "points": 10
      },
      {
        "origLabel": "B",
        "text": "Usar os guardas municipais como motoristas particulares para a família do prefeito fazer compras de supermercado.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 DESVIO DE FINALIDADE E IMPROBIDADE. Utilizar agentes públicos de segurança para fins pessoais é ato gravíssimo de improbidade administrativa.",
        "points": 0
      },
      {
        "origLabel": "C",
        "text": "Mandar os professores dormirem dentro da escola nos fins de semana para vigiar os prédios.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ DESVIO DE FUNÇÃO LABORAL. Professores são contratados para lecionar, não para exercer vigilância patrimonial.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Fechar as escolas e vender os computadores para não ter risco de serem roubados.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ RACIOCÍNIO ABSURDO. Destruir o serviço público para evitar vandalismo é o oposto da função de governar.",
        "points": 0
      }
    ]
  },
  {
    "id": 46,
    "block": 2,
    "questaoNum": 21,
    "title": "Consórcios Intermunicipais de Saúde",
    "subtitle": "Gestão Municipal & Serviços",
    "context": "Sua cidade é pequena (10 mil habitantes) e a arrecadação local não é suficiente para manter médicos especialistas (neurologista, cardiologista). Cidades vizinhas passam pelo mesmo problema. Como resolver?",
    "options": [
      {
        "origLabel": "A",
        "text": "Mandar os pacientes irem a pé para a capital distante 500 km procurar atendimento sozinhos.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ DESAMPARO SOCIAL. Abandona o cidadão à própria sorte em momentos de grave necessidade médica.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Criar um Consórcio Intermunicipal de Saúde, juntando uma parte dos impostos de 5 cidades vizinhas para contratar juntos os médicos especialistas para todos os moradores.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ EFICIÊNCIA E COOPERAÇÃO INTERFEDERATIVA! Os consórcios públicos otimizam o dinheiro dos impostos de cidades pequenas, permitindo contratar serviços que sozinhos não conseguiriam pagar.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Dizer que cidades pequenas não têm direito a atendimentos médicos com especialistas.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ VIOLAÇÃO DA UNIVERSALIDADE DO SUS. O direito à saúde é garantido a todo cidadão brasileiro, independentemente do tamanho do município onde ele mora.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Contratar um falso médico sem diploma nem registro no CRM para economizar impostos.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 CRIME CONTRA A SAÚDE PÚBLICA. Permitir o exercício ilegal da medicina coloca a vida dos pacientes em risco mortal imediato.",
        "points": 0
      }
    ]
  },
  {
    "id": 47,
    "block": 2,
    "questaoNum": 22,
    "title": "Diferença Técnica entre Imposto e Taxa",
    "subtitle": "Gestão Municipal & Serviços",
    "context": "Muitos cidadãos confundem Imposto (como IPTU, sem destinação carimbada) com Taxa (remuneração de serviço específico e divisível). A prefeitura precisa financiar o serviço de coleta de lixo. Como agir?",
    "options": [
      {
        "origLabel": "A",
        "text": "Criar a Taxa de Coleta de Lixo vinculada exclusivamente ao custo do serviço de recolhimento e destinação do lixo, dando transparência total de quanto custa limpar a cidade.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ RIGOR CONCEITUAL E FISCAL! As Taxas servem exatamente para remunerar serviços públicos específicos e divisíveis prestados ao contribuinte.",
        "points": 10
      },
      {
        "origLabel": "B",
        "text": "Criar um \"Imposto do Lixo\" e usar metade do dinheiro para pagar festas e a outra metade para o lixo.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 ILEGALIDADE TRIBUTÁRIA. Impostos não podem ter sua receita vinculada a órgãos ou serviços específicos salvo exceções da Constituição (como Saúde e Educação).",
        "points": 0
      },
      {
        "origLabel": "C",
        "text": "Cobrar a Taxa de Lixo de quem mora no interior onde o caminhão de lixo nunca passa e não presta o serviço.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 COBRANÇAINDEVIDA. A taxa exige a prestação efetiva ou potencial do serviço ao contribuinte. Cobrar sem disponibilizar o serviço é ilegal.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Dizer que a coleta de lixo não custa dinheiro e que os caminhões rodam de graça.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ ANALFABETISMO FINANCEIRO PÚBLICO. Máquinas, combustível, aterro e garis têm custos operacionais altos pagos pelo orçamento municipal.",
        "points": 0
      }
    ]
  },
  {
    "id": 48,
    "block": 2,
    "questaoNum": 23,
    "title": "Gastos de Investimento vs Custeio Contínuo",
    "subtitle": "Gestão Municipal & Serviços",
    "context": "Construir um prédio escolar é gasto de Investimento (único). Pagar salários de professores e merendeiras todo mês é gasto de Custeio/Pessoal (contínuo). Como planejar novas obras?",
    "options": [
      {
        "origLabel": "A",
        "text": "Construir 10 prédios de escolas novas para fazer propaganda, sabendo que não haverá dinheiro de impostos para pagar o salário dos professores para dar aula nelas.",
        "type": "partial",
        "icon": "⚠️",
        "feedback": "⚠️ \"ELEFANTES BRANCOS\". Prédios públicos bonitos mas vazios sem profissionais dentro não atendem a população e desperdiçam o dinheiro dos impostos.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Planejar o orçamento garantindo que cada nova escola ou posto construído tenha reserva garantida de receita de impostos para pagar a folha de pagamento dos profissionais em dia.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ RESPONSABILIDADE FISCAL E PLANEJAMENTO! O bom prefeito calcula não apenas o custo de construir a obra, mas a despesa continuada de manter o serviço funcionando.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Contratar médicos e professores e pagar os salários com fichas de rifa da prefeitura.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 VIOLAÇÃO DAS LEIS TRABALHISTAS E CONSTITUIÇÃO. O pagamento de servidores deve ser feito obrigatoriamente em moeda corrente nacional.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Deixar de pagar o salário dos professores por 6 meses para comprar um avião privativo para o município.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 CRIME E INADIMPLÊNCIA. Deixar de pagar servidores enquanto se adquirem bens de luxo é causa imediata de intervenção e processo crime.",
        "points": 0
      }
    ]
  },
  {
    "id": 49,
    "block": 2,
    "questaoNum": 24,
    "title": "Priorização Orçamentária: Festas vs Saúde",
    "subtitle": "Gestão Municipal & Serviços",
    "context": "Falta um mês para o aniversário da cidade. A tradição é contratar shows caríssimos por R$ 2 milhões. Porém, a frota de ambulâncias está sucateada e faltam remédios básicos no hospital. O que decidir?",
    "options": [
      {
        "origLabel": "A",
        "text": "Manter os shows caríssimos de R$ 2 milhões para garantir engajamento nas redes sociais, deixando as ambulâncias quebradas.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 MORALIDADE PÚBLICA VIOLADA. Gastar milhões em festas enquanto pacientes sofrem por falta de socorro básico fere a razoabilidade e pode ser suspenso pela Justiça.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Redimensionar o evento festivo priorizando artistas locais a um custo baixo, e redirecionar a maior parte da verba para a compra e reforma urgente das ambulâncias da saúde.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ PRIORIZAÇÃO RESPONSÁVEL DO DINHEIRO PÚBLICO! Celebrar a cultura local prestigiando artistas da terra economiza recursos e atende a emergência vital da saúde.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Pegar empréstimo bancário com juros altos de longo prazo apenas para pagar o show sertanejo.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ EQUALIZAÇÃO IRRESPONSÁVEL. Endividar o município por consumo fútil passageiro compromete gestões futuras.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Cancelar o pagamento dos salários dos professores para pagar o palco do show.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 CRIME E INADIMPLÊNCIA SALARIAL. Não pagar salários garantidos para custear eventos festivos é ato de improbidade administrativa gravíssimo.",
        "points": 0
      }
    ]
  },
  {
    "id": 50,
    "block": 2,
    "questaoNum": 25,
    "title": "Encerramento do Mandato e Restos a Pagar",
    "subtitle": "Gestão Municipal & Serviços",
    "context": "A Lei de Responsabilidade Fiscal (Art. 42 da LRF) proíbe o gestor de contrair despesas nos últimos 8 meses de mandato sem que haja dinheiro em caixa para pagá-las integralmente. Como encerrar a gestão?",
    "options": [
      {
        "origLabel": "A",
        "text": "Iniciar dezenas de grandes obras sem saldo em caixa, deixando um \"rombo\" financeiro enorme para o prefeito que assumirá no ano seguinte.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 VIOLAÇÃO DO ARTIGO 42 DA LRF. Deixar dívidas sem cobertura financeira ao final do mandato é infração grave com punição de inelegibilidade e sanções penais.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Planejar o encerramento do exercício com rigor fiscal, garantindo que todas as despesas contratadas fiquem quitadas ou com saldo em caixa reservado, entregando prefeitura adimplente.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ ESTADISTA E RESPONSABILIDADE FISCAL! Cumprir as regras de transição de mandato e equilíbrio de caixa garante a continuidade dos serviços prestados e consolida boa reputação.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Queimar todos os arquivos contábeis da prefeitura antes de entregar as chaves da sede ao novo prefeito.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 CRIME DE DESTRUIÇÃO DE DOCUMENTO PÚBLICO. Ocultar ou destruir acervo documental inviabiliza a auditoria e resulta em prisão.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Usar o saldo do caixa da prefeitura para fazer transferências Pix diretas para suas contas pessoais antes de deixar o cargo.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 PECULATO E ROUBO DE DINHEIRO PÚBLICO. Apropriar-se de recursos públicos em benefício próprio é crime de peculato gravíssimo com prisão imediata e bloqueio de bens.",
        "points": 0
      }
    ]
  },
  {
    "id": 51,
    "block": 3,
    "questaoNum": 1,
    "title": "Combate à Inflação",
    "subtitle": "Macroeconomia & Política Monetária",
    "context": "A inflação oficial (IPCA) subiu para 10% ao ano. Nos supermercados, o preço do arroz, do feijão e da carne disparou, e o salário mínimo do trabalhador já não consegue comprar a mesma cesta básica do ano anterior. Como Ministro da Economia, qual é a sua leitura sobre esse cenário?",
    "options": [
      {
        "origLabel": "A",
        "text": "Achar que a inflação é positiva para a economia porque faz os preços subirem e aumenta o faturamento bruto dos empresários.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ DESCONEXÃO SOCIAL E ECONÔMICA. Inflação descontrolada desorganiza o planejamento das empresas, reduz investimentos e destrói o poder de compra da população.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Reconhecer a inflação como um \"imposto invisível\" e cruel que corrói o poder de compra, penalizando principalmente as famílias de menor renda que gastam quase todo o orçamento com alimentação.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ VISÃO DIAGNÓSTICA PRECISA! A inflação penaliza desproporcionalmente os mais pobres, pois eles não possuem mecanismos de proteção financeira. O combate à inflação é essencial para a estabilidade social.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Afirmar que a inflação não afeta em nada a vida do trabalhador, pois basta ele parar de comprar alimentos por alguns meses.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 NEGAÇÃO DA REALIDADE. A alimentação é um item de consumo insubstituível e diário; ignorar esse impacto demonstra desconhecimento da cesta de consumo básica.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Defender que a inflação é criada artificialmente pelos consumidores quando eles decidem ir ao supermercado no mesmo dia.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ DIAGNÓSTICO INCORRETO. A inflação resulta de desequilíbrios entre oferta e demanda, choques de custos ou expansão monetária/fiscal descontrolada, não da escolha coordenada dos consumidores.",
        "points": 0
      }
    ]
  },
  {
    "id": 52,
    "block": 3,
    "questaoNum": 2,
    "title": "Taxa Selic e Política Monetária",
    "subtitle": "Macroeconomia & Política Monetária",
    "context": "A demanda por produtos na economia está muito aquecida e a inflação continua subindo rapidamente acima da meta estabelecida. O Banco Central e o Ministério precisam atuar para conter essa alta generalizada de preços. Qual é o mecanismo clássico de política monetária para controlar a inflação?",
    "options": [
      {
        "origLabel": "A",
        "text": "Reduzir os juros a zero para fazer a população pegar mais empréstimos e comprar ainda mais produtos.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 AGRAVAMENTO DA INFLAÇÃO. Baixar juros com a demanda já aquecida injeta mais crédito na economia, fazendo os preços subirem ainda mais rápido.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Elevar a taxa básica de juros (Selic) para encarecer o crédito, desestimular o consumo excessivo e desacelerar a pressão sobre os preços.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ MANEJO DA POLÍTICA MONETÁRIA! O aumento da taxa de juros encarece o financiamento e incentiva a poupança, desacelerando a demanda agregada para trazer a inflação de volta à meta.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Fixar o preço de todos os produtos do supermercado por decreto e prender os donos dos estabelecimentos.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 FRACASSO HISTÓRICO (CONGELAMENTO DE PREÇOS). O controle artificial de preços gera desabastecimento, filas, mercado negro e escassez de produtos nas prateleiras.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Emitir bilhões de notas de papel-moeda e distribuir nas ruas para equilibrar a subida dos preços.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 HIPERINFLAÇÃO. Aumentar a quantidade de dinheiro em circulação sem o aumento equivalente na produção de bens desvaloriza a moeda rapidamente.",
        "points": 0
      }
    ]
  },
  {
    "id": 53,
    "block": 3,
    "questaoNum": 3,
    "title": "Trade-off da Taxa de Juros",
    "subtitle": "Macroeconomia & Política Monetária",
    "context": "A taxa Selic foi elevada para conter a inflação. Com juros altos, a inflação começou a cair, mas empresários relatam que está difícil pegar empréstimos para abrir fábricas e os empregos começaram a estagnar. Como Ministro, como você interpreta esse \"remédio\" da taxa de juros?",
    "options": [
      {
        "origLabel": "A",
        "text": "Entender que a taxa de juros elevada é uma ferramenta amarga, mas necessária temporariamente: ela reduz o ritmo do crescimento de curto prazo para evitar o mal maior da inflação descontrolada.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ EQUILÍBRIO MACROECONÔMICO! O manejo da Selic envolve um \"trade-off\" (compensação): juros altos freiam a inflação, mas custam dinamismo econômico. O objetivo é calibrar a taxa para retornar ao crescimento sustentável.",
        "points": 10
      },
      {
        "origLabel": "B",
        "text": "Acreditar que juros altos devem ser mantidos no patamar máximo para sempre, independente de qual seja a taxa de inflação.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ ESTAGNAÇÃO PROLONGADA. Manter juros excessivamente altos sem necessidade inflacionária sufoca o investimento produtivo, a geração de empregos e arrecadação do país.",
        "points": 0
      },
      {
        "origLabel": "C",
        "text": "Negar que os juros tenham qualquer relação com o custo de financiamento de máquinas, imóveis ou investimentos produtivos.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ ERRO CONCEITUAL. A taxa Selic é a referência básica para o custo de capital de toda a economia, impactando diretamente o crédito bancário.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Dizer que o desemprego e o crédito caro não têm relevância para o Ministério da Economia.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ INSENSIBILIDADE TÉCNICA. Emprego e atividade econômica são indicadores centrais para a condução das políticas públicas do Ministério.",
        "points": 0
      }
    ]
  },
  {
    "id": 54,
    "block": 3,
    "questaoNum": 4,
    "title": "Déficit Fiscal vs Superávit",
    "subtitle": "Macroeconomia & Política Monetária",
    "context": "No encerramento do ano fiscal, o Governo Federal arrecadou R$ 2,0 trilhões em impostos federais (como Imposto de Renda e IPI), mas gastou R$ 2,2 trilhões com salários, obras, Previdência e programas sociais. Como é chamado esse resultado e qual o seu impacto?",
    "options": [
      {
        "origLabel": "A",
        "text": "Superávit Primário; significa que sobrou dinheiro no caixa para quitar compromissos sem gerar novas dívidas.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ DIAGNÓSTICO INVERTIDO. Quando a despesa supera a receita, o resultado é negativo (déficit), e não positivo (superávit).",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Déficit Fiscal; significa que o governo gastou mais do que arrecadou, precisando pegar dinheiro emprestado no mercado e aumentando a dívida pública do país.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ CONCEITO FUNDAMENTAL DE CONTAS PÚBLICAS! O déficit ocorre quando os gastos superam as receitas. Para cobrir essa diferença, o governo precisa emitir títulos da dívida, elevando seu endividamento.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Empate Orçamentário; mostra que gastos e receitas foram exatamente idênticos no período.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ ERRO DE CÁLCULO. Há uma diferença real de R$ 200 bilhões entre a receita e a despesa.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Lucro Líquido Nacional; indica que o país pode distribuir dividendos para a população.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ CONFUSÃO CONCEITUAL. O Estado não é uma empresa com fins lucrativos; o resultado fiscal mede o equilíbrio entre receitas e despesas públicas.",
        "points": 0
      }
    ]
  },
  {
    "id": 55,
    "block": 3,
    "questaoNum": 5,
    "title": "Risco País e Dívida Pública",
    "subtitle": "Macroeconomia & Política Monetária",
    "context": "A Dívida Pública do país atingiu 85% do PIB devido a déficits sucessivos. Os investidores nacionais e internacionais começam a duvidar que o governo terá capacidade de pagar o que deve no futuro. Qual é a consequência dessa perda de confiança?",
    "options": [
      {
        "origLabel": "A",
        "text": "Os investidores aceitarão emprestar dinheiro ao governo cobrando taxas de juros cada vez menores.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ INVERSÃO DA LOGICA DE RISCO. Quanto maior a incerteza sobre a capacidade de pagamento do devedor, maior é o risco exigido pelos credores.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Os investidores passarão a exigir juros mais altos para emprestar dinheiro ao país (maior risco), além de haver desvalorização da moeda nacional e fuga de capitais.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ PRÊMIO DE RISCO E PERDA DE CREDIBILIDADE! A percepção de risco fiscal força o governo a pagar juros mais altos em seus títulos, elevando o custo da dívida e desvalorizando o câmbio.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "A Dívida Pública desaparecerá automaticamente assim que atingir 100% do PIB.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 ILUSÃO FISCAL. A dívida não expira por atingir um limite; se não for gerida, pode resultar em calote (default) ou crise inflacionária.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Os países vizinhos assumirão a dívida do governo sem pedir nada em troca.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ IRREALISMO DAS RELAÇÕES INTERNACIONAIS. As finanças de um Estado soberano são de sua inteira e exclusiva responsabilidade fiscal.",
        "points": 0
      }
    ]
  },
  {
    "id": 56,
    "block": 3,
    "questaoNum": 6,
    "title": "Desvalorização Cambial e Câmbio",
    "subtitle": "Macroeconomia & Política Monetária",
    "context": "A cotação do Dólar subiu de R$5,00 para R$6,00. Como Ministro da Economia, você precisa analisar o impacto dessa alta do câmbio na vida cotidiana do país. O que acontece na economia quando a moeda nacional se desvaloriza perante o dólar?",
    "options": [
      {
        "origLabel": "A",
        "text": "O pãozinho da padaria e o combustível ficam mais caros porque o Brasil importa trigo e petróleo cotados em dólar, pressionando a inflação interna.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ IMPACTO DO CÂMBIO NA INFLAÇÃO! A desvalorização cambial encarece insumos e produtos importados (commodities, fertilizantes, trigo, eletrônicos), repassando custos para os preços finais.",
        "points": 10
      },
      {
        "origLabel": "B",
        "text": "Todos os produtos importados ficam automaticamente mais baratos nos supermercados brasileiros.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ INVERSÃO CAMBIAL. Se o Dólar fica mais caro frente ao Real, comprar produtos cotados em moeda estrangeira custa mais reais, e não menos.",
        "points": 0
      },
      {
        "origLabel": "C",
        "text": "A cotação do dólar não altera o preço de nenhum produto vendido dentro do território nacional.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ DESCONEXÃO COM A CADEIA GLOBAL. A economia moderna é interligada; componentes, energia e grãos são cotados internacionalmente.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "As viagens de turismo para o exterior tornam-se extremamente baratas para os brasileiros.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ CÁLCULO INCORRETO. Com o dólar valorizado, serviços cobrados em moeda estrangeira tornam-se mais caros para quem ganha em moeda local.",
        "points": 0
      }
    ]
  },
  {
    "id": 57,
    "block": 3,
    "questaoNum": 7,
    "title": "Moeda Forte e Exportações",
    "subtitle": "Macroeconomia & Política Monetária",
    "context": "Imagine que o Real se valorizou fortemente e o Dólar caiu. Se por um lado a inflação cai, qual é a dificuldade enfrentada pelas indústrias e produtores rurais exportadores brasileiros?",
    "options": [
      {
        "origLabel": "A",
        "text": "As exportações brasileiras se tornam mais competitivas no exterior, pois os produtos ficam mais caros em dólares para os compradores estrangeiros.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ ERRO DE COMPETITIVIDADE. Se a moeda local se valoriza, o produto nacional fica mais caro em moeda estrangeira, reduzindo sua atratividade de preço fora.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "As exportações perdem competitividade em preço no exterior e a indústria nacional enfrenta maior concorrência de produtos importados baratos dentro do país.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ EFEITO DÚPLO DO CÂMBIO VALORIZADO! Moeda forte ajuda a conter a inflação e barateia importações, mas reduz a margem de lucro de exportadores e expõe a indústria local à concorrência externa.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Os produtores rurais passam a ganhar o triplo de receita por tonelada de soja vendida para fora.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ CÁLCULO INVERSO. Ao converter a receita em dólares para a moeda local valorizada, o exportador recebe menos reais por unidade vendida.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "O volume de vendas de produtos brasileiros para o exterior dobra instantaneamente sem qualquer impacto de preços.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ DESCONSIDERAÇÃO DA LEI DA DEMANDA. Variações de preço impactam decisões de compra no comércio internacional.",
        "points": 0
      }
    ]
  },
  {
    "id": 58,
    "block": 3,
    "questaoNum": 8,
    "title": "Definição do PIB",
    "subtitle": "Macroeconomia & Política Monetária",
    "context": "O IBGE divulga que o PIB (Produto Interno Bruto) do Brasil cresceu 3,5% no último ano. Como você explica para a sociedade o que significa esse indicador econômico?",
    "options": [
      {
        "origLabel": "A",
        "text": "O PIB mede a quantidade de dinheiro guardada nas contas bancárias do Governo Federal ao final do ano.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ CONFUSÃO CONCEITUAL. O PIB não é o caixa do governo, mas a medida da produção total gerada por empresas, trabalhadores e governo no país.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "O PIB é a soma de todos os bens e serviços finais produzidos no país durante um período, refletindo a dinâmica de crescimento da atividade econômica.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ DEFINIÇÃO DE CONTABILIDADE NACIONAL! O PIB reflete o valor adicionado por todos os setores (agropecuária, indústria e serviços), servindo como termômetro da atividade econômica nacional.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "O PIB representa apenas o valor das vendas de imóveis usados entre pessoas físicas.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ ABRANGÊNCIA LIMITADA. O PIB abrange toda a produção nova de bens e serviços, e não apenas transações de ativos usados.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "O PIB indica a quantidade total de impostos cobrados exclusivamente das indústrias de grande porte.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ RESTRIÇÃO INCORRETA. O indicador engloba a produção de toda a economia, e não somente o setor tributário ou industrial.",
        "points": 0
      }
    ]
  },
  {
    "id": 59,
    "block": 3,
    "questaoNum": 9,
    "title": "Regras Fiscais e Previsibilidade",
    "subtitle": "Macroeconomia & Política Monetária",
    "context": "Para evitar que governos gastem sem limites e gerem crises de endividamento, o Congresso aprova uma Regra Fiscal que limita o crescimento das despesas públicas. Qual é a finalidade técnica dessa trava fiscal?",
    "options": [
      {
        "origLabel": "A",
        "text": "Impedir que o governo construa qualquer hospital ou pague qualquer salário em qualquer situação.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ INTERPRETAÇÃO EXTREMA. Regras fiscais buscam impor limites e priorização ao crescimento do gasto, não paralisar o funcionamento básico do Estado.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Sinalizar previsibilidade e responsabilidade fiscal ao mercado, demonstrando que a dívida pública se manterá em trajetória sustentável no longo prazo.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ ANCORE ACREDITÁVEL E SUSTENTABILIDADE! Marcos fiscais transparentes ancoram as expectativas de inflação e juros, dando segurança para investimentos privados de longo prazo.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Garantir que o governo possa emitir dívidas infinitas sem precisar prever receitas para cobri-las.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 CONTRADIÇÃO. Regras fiscais existem precisamente para proibir a expansão ilimitada e desordenada de despesas e dívida.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Obrigar o país a utilizar apenas moedas estrangeiras no pagamento de despesas públicas.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ INOPERÂNCIA MONETÁRIA. Regras de controle de gasto público tratam do orçamento fiscal na moeda soberana do país.",
        "points": 0
      }
    ]
  },
  {
    "id": 60,
    "block": 3,
    "questaoNum": 10,
    "title": "Curva de Laffer e Impostos",
    "subtitle": "Macroeconomia & Política Monetária",
    "context": "Para tentar arrecadar mais recursos, a equipe econômica sugere aumentar a alíquota de impostos sobre as empresas de 30% para 70%. O conceito da Curva de Laffer alerta sobre um risco nessa decisão. Que risco é esse?",
    "options": [
      {
        "origLabel": "A",
        "text": "O aumento expressivo da alíquota gera uma alta inflacionária imediata que reduz o poder de compra do Estado, neutralizando o ganho de arrecadação.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ INCORRETO. Embora impostos possam afetar custos e preços, a Curva de Laffer trata especificamente da relação entre a alíquota do imposto e a receita tributária total.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Alíquotas excessivamente altas desestimulam a atividade produtiva, elevam a informalidade e a sonegação, fazendo com que a arrecadação total do governo diminua em vez de aumentar.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ CORRETO (COMPREENSÃO DA CURVA DE LAFFER). A Curva de Laffer mostra que existe um ponto ótimo de tributação. Acima dele, tributos extorsivos sufocam a produção e incentivam a evasão fiscal.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "A elevação da carga tributária reduz o consumo das famílias no curto prazo, forçando o Banco Central a elevar a taxa básica de juros para conter a recessão.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ INCORRETO. O alerta central de Laffer diz respeito aos incentivos do lado da oferta (produção, investimento e formalidade).",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "A arrecadação crescerá no mesmo percentual do aumento da alíquota, porém provocará uma fuga imediata de divisas e desvalorização do câmbio.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ INCORRETO. Assumir que a arrecadação cresce na mesma proporção do imposto é ignorar o comportamento dos agentes econômicos.",
        "points": 0
      }
    ]
  },
  {
    "id": 61,
    "block": 3,
    "questaoNum": 11,
    "title": "Impacto da Queda do Desemprego",
    "subtitle": "Macroeconomia & Política Monetária",
    "context": "A taxa de desemprego medida pela PNAD/IBGE caiu de 12% para 6%. Como o Ministério da Economia deve avaliar o impacto desse indicador sobre o consumo e as contas públicas?",
    "options": [
      {
        "origLabel": "A",
        "text": "Trata-se de um indicador negativo, pois mais pessoas trabalhando significa menor consumo no comércio.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ LOGICA INVERTIDA. O aumento do emprego expande a massa salarial, impulsionando a demanda por bens e serviços na economia.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "É um indicador positivo: mais trabalhadores empregados geram mais renda familiar, aumentam a arrecadação de impostos e reduzem a necessidade de auxílios assistenciais do governo.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ DINÂMICA POSITIVA DO MERCADO DE TRABALHO! Maior formalização e emprego geram renda, aquecem a economia real e fortalecem as finanças públicas com maior arrecadação de tributos.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "A taxa de desemprego não afeta a arrecadação de impostos nem o consumo da população.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ DESCONEXÃO TÉCNICA. A folha de pagamento e o consumo de bens são bases centrais de arrecadação de impostos (INSS, IR, tributos sobre consumo).",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "O desemprego menor indica obrigatoriamente que as empresas estão prestes a falir.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ DIAGNÓSTICO CONTRADITÓRIO. A contratação de trabalhadores sinaliza expansão da produção e confiança do setor produtivo.",
        "points": 0
      }
    ]
  },
  {
    "id": 62,
    "block": 3,
    "questaoNum": 12,
    "title": "Investimento Direto no País (IDP)",
    "subtitle": "Macroeconomia & Política Monetária",
    "context": "Grandes grupos internacionais anunciam Investimentos Diretos no País (IDP) para construir usinas de energia solar, ferrovias e fábricas de carros elétricos. Por que esse capital é de alta qualidade?",
    "options": [
      {
        "origLabel": "A",
        "text": "Porque é um capital de longo prazo que cria infraestrutura real, transfere tecnologia e gera empregos locais, não podendo \"fugir\" de um dia para o outro.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ VALOR DO INVESTIMENTO PRODUTIVO! O IDP difere do capital especulativo (\"volátil\"): ele se fixa em ativos físicos de longo prazo, aumentando a capacidade produtiva e a tecnologia do país.",
        "points": 10
      },
      {
        "origLabel": "B",
        "text": "Porque é um dinheiro que o Governo Federal precisa devolver com juros em até 30 dias.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ CONFUSÃO DE CONCEITOS. IDP é investimento em capital produtivo ou societário, não um empréstimo de curto prazo tomado pelo Tesouro.",
        "points": 0
      },
      {
        "origLabel": "C",
        "text": "Porque o investimento estrangeiro retira empregos dos trabalhadores brasileiros e fecha as indústrias locais.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ EFEITO CONTRÁRIO. O investimento em novas fábricas e infraestrutura gera empregos diretos e demanda para fornecedores locais.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Porque obriga o país a doar suas terras sem receber qualquer contrapartida.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ VISÃO INCORRETA. Investimentos ocorrem sob a regulação e legislação do país hospedeiro, gerando tributos e desenvolvimento regional.",
        "points": 0
      }
    ]
  },
  {
    "id": 63,
    "block": 3,
    "questaoNum": 13,
    "title": "Reservas Internacionais e Proteção",
    "subtitle": "Macroeconomia & Política Monetária",
    "context": "O Brasil possui cerca de US$ 340 bilhões em Reservas Internacionais no Banco Central. Em momentos de crise financeira mundial com fuga de dólares, qual é a utilidade desse \"colchão de proteção\"?",
    "options": [
      {
        "origLabel": "A",
        "text": "Usar esse dinheiro para pagar os salários do funcionalismo público e cobrir despesas de saúde e educação no dia a dia.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ CONFUSÃO FISCAL. Reservas são em moeda estrangeira para proteção externa, não para pagar despesas comuns do governo em reais.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Usar as reservas para garantir que o país continue honrando suas dívidas externas e intervir no mercado de câmbio, evitando uma alta descontrolada do dólar.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ PROTEÇÃO E ESTABILIDADE EXTERNA! As reservas funcionam como um seguro: elas dão segurança aos investidores internacionais e evitam que faltem dólares para o país importar produtos ou pagar suas contas.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Vender todas as reservas imediatamente para zerar os impostos cobrados da população durante um ano.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 DESPROTEÇÃO DA ECONOMIA. Sem reservas, o país fica vulnerável a qualquer crise mundial, podendo sofrer uma disparada do dólar e desabastecimento de produtos importados.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "As reservas não têm utilidade prática, pois o governo pode imprimir dólares livremente quando precisar.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ ERRO MONETÁRIO. O Brasil só pode emitir a sua própria moeda (o Real). Dólares só entram no país via comércio exterior ou investimentos.",
        "points": 0
      }
    ]
  },
  {
    "id": 64,
    "block": 3,
    "questaoNum": 14,
    "title": "Balança Comercial e Superávit",
    "subtitle": "Macroeconomia & Política Monetária",
    "context": "Ao final do ano, o Brasil exportou US$ 330 bilhões (vendeu para fora) e importou US$ 240 bilhões (comprou de fora). O resultado da Balança Comercial foi um superávit de US$ 90 bilhões. O que isso representa?",
    "options": [
      {
        "origLabel": "A",
        "text": "Significa que entrou mais moeda estrangeira no país vinda das vendas ao exterior do que saiu para pagar compras, fortalecendo a economia nacional.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ SUPERÁVIT COMERCIAL! Quando as vendas para o exterior superam as compras, o país acumula dólares, fortalece seu comércio exterior e gera renda interna.",
        "points": 10
      },
      {
        "origLabel": "B",
        "text": "Significa que o país teve um prejuízo comercial, pois vender para fora é sempre pior do que guardar os produtos no Brasil.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ INTERPRETAÇÃO INVERTIDA. Exportar mais do que importar gera um saldo positivo (superávit), o que é um sinal de força do setor produtivo.",
        "points": 0
      },
      {
        "origLabel": "C",
        "text": "Indica que o governo arrecadou US$ 90 bilhões diretamente em seu caixa para gastar em obras públicas.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ CONFUSÃO PRIVADO vs. PÚBLICO. O dinheiro das exportações vai para as empresas que venderam os produtos. O governo arrecada apenas os impostos dessa atividade.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Mostra que o país parou completamente de comprar máquinas e produtos de outros países.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ LEITURA INCORRETA. O país continuou importando um volume alto (US$ 240 bilhões), mas conseguiu vender ainda mais (US$ 330 bilhões).",
        "points": 0
      }
    ]
  },
  {
    "id": 65,
    "block": 3,
    "questaoNum": 15,
    "title": "Emissão de Moeda e Risco Inflacionário",
    "subtitle": "Macroeconomia & Política Monetária",
    "context": "Para tentar resolver o problema da pobreza de forma rápida, um grupo propõe que o Governo Federal simplesmente imprima R$ 500 bilhões e distribua diretamente na conta de cada cidadão. Qual é o resultado na economia real?",
    "options": [
      {
        "origLabel": "A",
        "text": "A população fica mais rica de forma permanente, pois o total de mercadorias no país aumenta na mesma proporção do dinheiro impresso.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ RESPOSTA INCORRETA. Papel-moeda é apenas um meio de troca. Riqueza real vem da produção de bens e serviços, não da impressão de cédulas.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "A quantidade de produtos nas prateleiras continua a mesma, mas a busca por eles dispara, gerando alta generalizada de preços (inflação) e perda do poder de compra.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ VOCÊ ACERTOU! Imprimir dinheiro não fabrica produtos, máquinas ou alimentos. Quando a quantidade de moeda cresce mais rápido do que a produção real do país, o resultado direto é a inflação.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Os preços dos produtos caem, pois as empresas passam a vender mais barato para conseguir recolher as notas novas.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ RESPOSTA INCORRETA. Havendo mais dinheiro circulando para comprar a mesma quantidade de bens, a tendência é a subida de preços, e não a queda.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "O dinheiro impresso não gera efeito algum na economia, nem positivo nem negativo.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ RESPOSTA INCORRETA. A expansão monetária sem respaldo produtivo gera grande impacto na taxa de câmbio e nos preços da economia.",
        "points": 0
      }
    ]
  },
  {
    "id": 66,
    "block": 3,
    "questaoNum": 16,
    "title": "Dívida Pública em Moeda Nacional",
    "subtitle": "Macroeconomia & Política Monetária",
    "context": "No passado, grande parte da Dívida Pública brasileira era em dólares (alta volatilidade em crises). Hoje, a maior parte é em Reais. Por que essa mudança de estratégia foi fundamental para a segurança financeira?",
    "options": [
      {
        "origLabel": "A",
        "text": "Porque emitir dívida em reais elimina a necessidade de o governo pagar juros aos seus credores.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ ERRO FINANCEIRO. Dívidas em moeda local também pagam taxa de juros (como a Selic) para atrair investidores.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Porque reduz a vulnerabilidade das contas públicas a choques cambiais externos, impedindo que uma alta do dólar desequilibre o orçamento do Estado.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ REDUÇÃO DA VULNERABILIDADE EXTERNA! Ao ter a maior parte da dívida em reais (moeda que o próprio país emite), o governo evita que um salto no dólar aumente repentinamente o tamanho da sua dívida em relação ao PIB.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Porque o Real é a única moeda aceita para negociações por investidores globais em todo o mundo.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ CONFUSÃO MONETÁRIA. O dólar e o euro continuam sendo as principais moedas de reserva e negociação internacional.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Porque emitir dívida em moeda nacional permite ao governo cancelar o valor das dívidas sem pagar os investidores.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 RISCO DE CALOTE (DEFAULT). Negar o pagamento de dívidas destrói a credibilidade do país e bloqueia novos empréstimos futuros.",
        "points": 0
      }
    ]
  },
  {
    "id": 67,
    "block": 3,
    "questaoNum": 17,
    "title": "Juros nos EUA e Câmbio no Brasil",
    "subtitle": "Macroeconomia & Política Monetária",
    "context": "O Banco Central dos EUA (Fed) eleva fortemente as taxas de juros americanas para conter a inflação. Investidores globais começam a tirar dinheiro de países emergentes para aplicar nos EUA. Qual o impacto no Dólar no Brasil?",
    "options": [
      {
        "origLabel": "A",
        "text": "O Dólar tende a subir no Brasil, pois a fuga de capitais em direção aos EUA reduz a quantidade de dólares disponíveis no mercado brasileiro.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ MECANISMO DE ATRAÇÃO DE CAPITAL! Juros mais altos nos EUA atraem capital global para a maior economia do mundo. A saída de dólares dos emergentes reduz a oferta da moeda e faz a sua cotação subir por aqui.",
        "points": 10
      },
      {
        "origLabel": "B",
        "text": "O Dólar caiu rapidamente no Brasil, pois os investidores preferem deixar seu dinheiro em países de maior risco quando os EUA sobem os juros.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ LÓGICA INVERTIDA. Quando a renda fixa americana passa a pagar juros mais atraentes, os investidores retiram dinheiro de países emergentes.",
        "points": 0
      },
      {
        "origLabel": "C",
        "text": "A taxa de juros americana não produz nenhum efeito sobre o fluxo de moedas no mercado brasileiro.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ DESCONSIDERAÇÃO DA INTEGRAÇÃO GLOBAL. As decisões de política monetária da maior economia do planeta afetam o fluxo financeiro de todos os países.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "A cotação da moeda americana é congelada automaticamente pela autoridade monetária do Brasil em resposta à decisão dos EUA.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ INCOMPATIBILIDADE. O Brasil opera sob câmbio flutuante e não tem poder para congelar cotações em resposta a decisões de outros países.",
        "points": 0
      }
    ]
  },
  {
    "id": 68,
    "block": 3,
    "questaoNum": 18,
    "title": "Transição Demográfica e Previdência",
    "subtitle": "Macroeconomia & Política Monetária",
    "context": "Com o avanço da medicina, a população está vivendo mais e tendo menos filhos. O déficit do sistema de Previdência Social cresce a cada ano, consumindo mais de 50% do orçamento federal. Como enfrentar esse desafio?",
    "options": [
      {
        "origLabel": "A",
        "text": "Aumentar indefinidamente os gastos sem ajustar regras de idade ou contribuição, cobrando a conta das gerações futuras de jovens.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ INSUS TENTABILIDADE INTERGERACIONAL. Negar a transição demográfica leva o sistema previdenciário ao colapso fiscal, tirando recursos de saúde, segurança e educação dos jovens.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Realizar reformas estruturais na Previdência, ajustando idades mínimas e tempos de contribuição à nova realidade demográfica para garantir a sustentabilidade do sistema de pagamentos.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ EQUILÍBRIO ATUARIAL E RESPONSABILIDADE! Adequar as regras previdenciárias à expectativa de vida garante que o sistema continue solvente e capaz de pagar as aposentadorias de forma sustentável.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Extinguir a Previdência Social e deixar os idosos atuais sem qualquer rendimento de subsistência.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 RUPTURA SOCIAL E CRUELDADE. Cancelar abruptamente direitos previdenciários adquiridos violaria a proteção social e geraria miséria em massa.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Prometer que todos os cidadãos se aposentarão aos 50 anos de idade com salário integral pago pelo Estado.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 POPULISMO INVIÁVEL. Regras atuarialmente impossíveis quebrariam as finanças públicas em poucos meses.",
        "points": 0
      }
    ]
  },
  {
    "id": 69,
    "block": 3,
    "questaoNum": 19,
    "title": "Emissão de Moeda Local por Prefeituras",
    "subtitle": "Macroeconomia & Política Monetária",
    "context": "Um prefeito decide criar cédulas de papel locais para pagar os servidores do município e financiar obras públicas sem depender de repasses estaduais ou federais. Essa atitude é válida no sistema financeiro?",
    "options": [
      {
        "origLabel": "A",
        "text": "Sim, qualquer município brasileiro tem autonomia para emitir sua própria moeda oficial quando faltar dinheiro no caixa.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ RESPOSTA INCORRETA. Prefeituras e estados não possuem autoridade monetária para emitir moeda oficial.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Não, a emissão da moeda nacional (Real) é competência exclusiva da União, gerida pelo Banco Central para manter a estabilidade do sistema financeiro.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ VOCÊ ACERTOU! A exclusividade da emissão monetária pelo Banco Central garante que haja controle rigoroso sobre a quantidade de dinheiro em circulação e previne o caos inflacionário no país.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Sim, desde que o prefeito informe o Ministério da Economia após realizar a impressão do dinheiro.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ RESPOSTA INCORRETA. A proibição é constitucional; comunicar o órgão federal não autoriza a criação de moeda paralela.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Não, porque moedas locais só podem ser impressas por empresas privadas credenciadas.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ RESPOSTA INCORRETA. A emissão é prerrogativa estatal exclusiva do Governo Federal/Banco Central.",
        "points": 0
      }
    ]
  },
  {
    "id": 70,
    "block": 3,
    "questaoNum": 20,
    "title": "Concessões e Privatizações de Infraestrutura",
    "subtitle": "Macroeconomia & Política Monetária",
    "context": "O governo é dono de rodovias esburacadas, portos obsoletos e estatais com prejuízos cobertos pelo Tesouro. A equipe propõe um plano de Concessões e Privatizações. Qual decisão você toma?",
    "options": [
      {
        "origLabel": "A",
        "text": "O governo deve manter o monopólio de tudo, mesmo que não tenha recursos para reformar as estradas nem para investir em tecnologia.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ GARGALO LOGÍSTICO. Se o Estado não possui capacidade fiscal para investir, manter o monopólio condena a infraestrutura do país ao sucateamento prolongado.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Transferir a operação da infraestrutura para o setor privado via concessões leiloadas, exigindo metas de investimentos obrigatórios e regulação firme de agências independentes, melhorando o serviço ao cidadão.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ EFICIÊNCIA E ATRAÇÃO DE CAPITAL PRIVADO! Leilões competitivos e concessões bem reguladas atraem investimentos privados para modernizar portos, aeroportos e rodovias sem onerar o orçamento público.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Melhor doar as estatais para amigos sem exigir compromisso de investimento ou leilão público.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 CORRUPÇÃO E CRONISMO. Transferência de ativos públicos sem transparência, concorrência e avaliação justa viola os princípios da administração pública.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Destruir as estradas e fechar os portos para que ninguém possa utilizá-los.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 SABOTAGEM NACIONAL. Destruir ativos de infraestrutura paralisa a produção e o escoamento de riquezas do país.",
        "points": 0
      }
    ]
  },
  {
    "id": 71,
    "block": 3,
    "questaoNum": 21,
    "title": "Financiamento de Déficit via Títulos",
    "subtitle": "Macroeconomia & Política Monetária",
    "context": "O Governo Federal encerrou o ano com um grande buraco nas contas (déficit fiscal). O Ministro da Economia precisa decidir como cobrir essa diferença. Qual representa a forma saudável de financiamento?",
    "options": [
      {
        "origLabel": "A",
        "text": "Imprimir dinheiro escondido do mercado para que ninguém perceba o aumento de moeda em circulação.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ RESPOSTA INCORRETA. Esconder a emissão não impede os efeitos da inflação no mercado e fere o princípio da transparência pública.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Emitir títulos da dívida pública no mercado financeiro, pegando dinheiro emprestado de investidores que já está em circulação na economia.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ VOCÊ ACERTOU! Ao emitir títulos, o governo pega emprestado dinheiro que já existe no mercado (sem criar moeda nova do nada), pagando juros por isso. É assim que países fiscalmente responsáveis cobrem seus déficits.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Forçar o Banco Central a comprar todas as contas atrasadas do governo usando notas recém-impressas.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ RESPOSTA INCORRETA. O financiamento direto de déficits via impressão de moeda (dominância monetária) destrói a credibilidade do país e gera inflação.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Exigir que os bancos privados fabriquem suas próprias notas de real para cobrir os gastos do Estado.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ RESPOSTA INCORRETA. Bancos privados não têm autorização para fabricar papel-moeda.",
        "points": 0
      }
    ]
  },
  {
    "id": 72,
    "block": 3,
    "questaoNum": 22,
    "title": "Substituição Física de Cédulas Rasgadas",
    "subtitle": "Macroeconomia & Política Monetária",
    "context": "O Banco Central anunciou que vai rodar as máquinas para emitir R$ 10 bilhões em cédulas de Real para substituir notas velhas e rasgadas (saneamento do meio circulante). Qual é o impacto inflacionário dessa operação?",
    "options": [
      {
        "origLabel": "A",
        "text": "O impacto é nulo (zero), pois para cada nota nova que entra em circulação, uma nota velha de mesmo valor é destruída, mantendo o volume total de dinheiro inalterado.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ VOCÊ ACERTOU! Substituir cédulas desgastadas por cédulas novas não altera a quantidade total de moeda (base monetária). Trata-se apenas de manutenção física do dinheiro.",
        "points": 10
      },
      {
        "origLabel": "B",
        "text": "A inflação vai subir muito, pois qualquer funcionamento das máquinas de impressão gera inflação imediata.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ RESPOSTA INCORRETA. O que gera inflação é a ampliação do estoque total de moeda em relação à produção, e não a mera substituição física do papel danificado.",
        "points": 0
      },
      {
        "origLabel": "C",
        "text": "A inflação vai cair pela metade, porque notas novas valem mais do que notas velhas no mercado.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ RESPOSTA INCORRETA. O valor de face do Real é exatamente o mesmo, seja a nota nova ou velha.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Haverá deflação, porque a população prefere guardar notas novas em casa em vez de gastar.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ RESPOSTA INCORRETA. O estado de conservação do papel não altera o comportamento do consumidor de forma a provocar queda geral de preços.",
        "points": 0
      }
    ]
  },
  {
    "id": 73,
    "block": 3,
    "questaoNum": 23,
    "title": "Dominância Fiscal e Coordenação",
    "subtitle": "Macroeconomia & Política Monetária",
    "context": "Se a Dívida Pública estiver descontrolada e o governo continuar gastando sem limites, o Banco Central pode subir os juros tanto que, em vez de frear a inflação, o custo da dívida explode (Dominância Fiscal). O que ele ensina?",
    "options": [
      {
        "origLabel": "A",
        "text": "Ensina que a Política Monetária (juros) e a Política Fiscal (gastos/impostos) precisam caminhar juntas: o BC não consegue combater a inflação sozinho se o governo for fiscalmente irresponsável.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ COORDENAÇÃO ENTRE MONETÁRIA E FISCAL! A Dominância Fiscal ocorre quando a política monetária perde a eficácia porque o risco fiscal é gigantesco. A responsabilidade fiscal é pré-requisito para o sucesso do controle da inflação.",
        "points": 10
      },
      {
        "origLabel": "B",
        "text": "Ensina que o governo deve gastar o máximo possível sem se preocupar com dívida ou juros.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 AGRAVAMENTO DA CRISE. Acelerar gastos em cenário de alto endividamento precipita o colapso cambial e hiperinflacionário.",
        "points": 0
      },
      {
        "origLabel": "C",
        "text": "Mostra que a inflação é resolvida apenas apagando os dados do computador do Banco Central.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ IRREALIDADE. Omitir ou apagar estatísticas econômicas destrói a credibilidade do país e agrava o risco percebido.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Prova que a taxa de juros não tem qualquer relação com o tamanho da dívida pública.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ ERRO TÉCNICO. A taxa de juros determina o custo de rolagem dos títulos emitidos pelo Tesouro Nacional para financiar a dívida.",
        "points": 0
      }
    ]
  },
  {
    "id": 74,
    "block": 3,
    "questaoNum": 24,
    "title": "Abandono da Moeda em Hiperinflação",
    "subtitle": "Macroeconomia & Política Monetária",
    "context": "Historicamente, países que abusaram da impressão de papel-moeda para pagar gastos públicos viram sua moeda perder totalmente o valor. Quando a impressão descontrolada gera hiperinflação, o que acontece com a moeda local?",
    "options": [
      {
        "origLabel": "A",
        "text": "A moeda local passa a ser a mais valorizada do mundo, pois há uma grande quantidade dela disponível.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ RESPOSTA INCORRETA. Abundância de papel sem lastro produtivo reduz o valor da moeda, não aumenta.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "A população perde a confiança na moeda e passa a recusá-la, recorrendo ao escambo (troca direta de produtos) ou a moedas estrangeiras mais fortes (como o Dólar).",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ VOCÊ ACERTOU! A moeda precisa cumprir três funções: reserva de valor, meio de troca e unidade de conta. Quando a impressão desenfreada destrói a reserva de valor, as pessoas abandonam a moeda nacional.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "O comércio passa a aceitar a moeda impressa com desconto, reduzindo os preços de todos os produtos.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ RESPOSTA INCORRETA. Em cenários de hiperinflação, os preços sobem diariamente em ritmo acelerado.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "O país passa a exportar mais mercadorias, já que produzir dinheiro impresso é barato.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ RESPOSTA INCORRETA. A destruição do sistema monetário desorganiza a produção e prejudica gravemente o comércio exterior.",
        "points": 0
      }
    ]
  },
  {
    "id": 75,
    "block": 3,
    "questaoNum": 25,
    "title": "Metas de Sucesso da Gestão Econômica",
    "subtitle": "Macroeconomia & Política Monetária",
    "context": "Ao final do mandato como Ministro da Economia, a sociedade avalia os resultados da sua política econômica. Qual reflete uma gestão macroeconômica bem-sucedida, equilibrada e voltada ao desenvolvimento sustentável?",
    "options": [
      {
        "origLabel": "A",
        "text": "Inflação controlada dentro da meta, contas públicas equilibradas com trajetória sustentável da dívida, moeda estável, juros em níveis moderados, crescimento do PIB e aumento real da renda dos trabalhadores.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ EXCELÊNCIA NA GESTÃO MACROECONÔMICA! O objetivo da política econômica é criar condições de estabilidade, previsibilidade e equilíbrio fiscal que permitam o crescimento sustentável, a geração de empregos e a melhoria da qualidade de vida da população.",
        "points": 10
      },
      {
        "origLabel": "B",
        "text": "Gastos públicos descontrolados, inflação acumulada de 50% ao ano, fuga de capitais, dólar nas alturas e calote na dívida pública, acompanhados de promessas verbais de prosperidade.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 DESASTRE MACROECONÔMICO. Desequilíbrios fiscais e monetários graves geram inflação, desvalorização cambial e perda de bem-estar social.",
        "points": 0
      },
      {
        "origLabel": "C",
        "text": "Congelamento total de salários e preços por decreto, proibição de importações e fechamento do comércio exterior.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 PARALISIA E ESCASSEZ. Controles arbitrários e fechamento ao comércio internacional destroem a eficiência econômica e geram desabastecimento.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Aumento da arrecadação de impostos até atingir 90% do PIB, com paralisação total de todas as empresas privadas do país.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 COLAPSO DO SETOR PRIVADO. Extinguir a iniciativa privada sufoca a produção de bens, o emprego e a inovação.",
        "points": 0
      }
    ]
  },
  {
    "id": 76,
    "block": 4,
    "questaoNum": 1,
    "title": "Populismo Fiscal em Eleição",
    "subtitle": "Liderança de Estado & Projetos",
    "context": "Em ano eleitoral, conselheiros sugerem que você, como Presidente, prometa dobrar o valor de todas as bolsas e auxílios sociais imediatamente, sem explicar de onde virá o dinheiro. O orçamentista avisa que não há arrecadação para isso. Como agir?",
    "options": [
      {
        "origLabel": "A",
        "text": "Anunciar o aumento imediato mesmo sem ter caixa, pois a população ficará feliz no curto prazo e o problema do rombo nas contas fica para o próximo governo.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 POPULISMO FISCAL. Prometer gastos sem cobertura gera déficit, aumenta a dívida pública e resulta em inflação. O ganho ilusório do benefício é corroído pelo aumento do custo de vida.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Explicar com transparência que novos gastos exigem corte de despesas supérfluas ou aumento de receitas, priorizando o equilíbrio para evitar que a promessa vire inflação que destrói o poder de compra dos próprios beneficiários.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ RESPONSABILIDADE FISCAL E LITERACIA FINANCEIRA! Na economia pública, assim como na vida pessoal, não existe \"dinheiro grátis\". Todo gasto adicional exige uma fonte de custeio real para não gerar desequilíbrio.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Mandar a Casa da Moeda rodar trilhões de reais em notas de papel para pagar o aumento das bolsas sem mexer no orçamento.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 RISCO DE HIPERINFLAÇÃO. Imprimir dinheiro sem aumento de produção desvaloriza a moeda rapidamente, transformando o benefício em papel sem valor.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Cancelar todos os serviços públicos do país para financiar a medida populista sem consultar o Congresso.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 PARALISIA INSTITUCIONAL. Paralisar o Estado para cumprir promessas eleitorais desestruturadas viola a Lei de Responsabilidade Fiscal e a Constituição.",
        "points": 0
      }
    ]
  },
  {
    "id": 77,
    "block": 4,
    "questaoNum": 2,
    "title": "Salário Mínimo Nominal vs Real",
    "subtitle": "Liderança de Estado & Projetos",
    "context": "O salário mínimo foi reajustado em 10%, mas a inflação do ano acumulou 12% devido ao descontrole de gastos públicos. O trabalhador recebe uma nota de R$ 100 mais alta no holerite, mas compra menos comida no supermercado. Como explicar essa ilusão monetária?",
    "options": [
      {
        "origLabel": "A",
        "text": "Celebrar o aumento do salário mínimo como uma grande vitória social, ignorando que o poder de compra real caiu.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ ILUSÃO MONETÁRIA. Ter mais notas de dinheiro na carteira não significa estar mais rico se os preços das coisas subiram em proporção ainda maior.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Esclarecer que o valor nominal do dinheiro não importa se a inflação corroer o poder de compra; o foco do governo deve ser manter a inflação baixa para garantir ganho real de renda.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ COMPREENSÃO DO PODER DE COMPRA REAL! O que importa para a família é o salário real (o que o dinheiro consegue comprar). Controlar a inflação é a política de proteção salarial mais eficiente.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Culpar os donos de supermercados por aumentarem os preços e exigir que vendam os produtos com prejuízo.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ DIAGNÓSTICO INCORRETO. O aumento generalizado de preços reflete perda de valor da moeda por desequilíbrio macroeconômico, não ganância isolada de comerciantes.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Determinar que o preço de todos os alimentos seja reduzido pela metade por decreto presencial.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 DESABASTECIMENTO E TABELAMENTO. O congelamento de preços por decreto historicamente gera prateleiras vazias, ágio e mercado negro.",
        "points": 0
      }
    ]
  },
  {
    "id": 78,
    "block": 4,
    "questaoNum": 3,
    "title": "Imposto sobre Indústria Nacional",
    "subtitle": "Liderança de Estado & Projetos",
    "context": "Para financiar novos programas sociais, a equipe econômica sugere criar um novo imposto sobre o faturamento de todas as indústrias nacionais. O ministro do Desenvolvimento alerta que as empresas locais já enfrentam forte concorrência de produtos importados. Qual impacto ponderar?",
    "options": [
      {
        "origLabel": "A",
        "text": "O novo imposto será absorvido integralmente pelos acionistas das indústrias, sem qualquer repasse aos preços finais ou impacto no nível de emprego do setor.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ VISÃO PARCIAL. Impostos sobre faturamento e produção entram na planilha de custos das empresas. Parte do tributo é repassada aos preços ao consumidor e outra parte reduz a capacidade de investimento e contratação.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "A elevação da carga tributária encarece a produção nacional, reduz a competitividade contra itens importados e pode gerar fechamento de vagas de trabalho e retração do PIB.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ AVALIAÇÃO DE IMPACTO REGULATÓRIO. Excelente decisão. Como Presidente, você considerou o \"Custo Brasil\". Aumentar impostos sobre o setor produtivo nacional sem ganho de produtividade penaliza as empresas locais frente aos concorrentes globais.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "O imposto tornará as indústrias brasileiras mais competitivas no exterior, pois a arrecadação extra garante automaticamente a modernização tecnológica das fábricas.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ INVERSÃO CAUSAL. O recolhimento de impostos vai para o caixa geral do Estado, não retornando como ganho de eficiência direto para a linha de produção da empresa pagadora.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "A tributação sobre a indústria não altera a economia, pois o consumo das famílias depende exclusivamente da taxa de câmbio do dólar.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ NEGAÇÃO DOS INCENTIVOS. A carga tributária afeta diretamente os custos de produção locais, sendo uma das variáveis mais determinantes para as decisões de investimento no país.",
        "points": 0
      }
    ]
  },
  {
    "id": 79,
    "block": 4,
    "questaoNum": 4,
    "title": "Uso de Fundo de Contingência em Seca",
    "subtitle": "Liderança de Estado & Projetos",
    "context": "Uma seca severa atinge as principais regiões agrícolas do país, ameaçando o abastecimento e elevando o preço dos alimentos. No Tesouro Nacional, existe um Fundo de Contingência acumulado. Alguns ministros sugerem criar um programa de subsídio permanente. Como agir?",
    "options": [
      {
        "origLabel": "A",
        "text": "Autorizar a criação do programa permanente de subsídio, utilizando o fundo de reserva para absorver as variações do mercado de alimentos por tempo indeterminado.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ ERRO ESTRUTURAL. Reservas financeiras são recursos pontuais (não recorrentes). Financiá-las para custear uma despesa continuada gerará um \"rombo\" fiscal inevitável no momento em que a reserva se esgotar.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Utilizar a reserva exclusivamente de forma pontual e emergencial (socorro às vítimas e obras rápidas de infraestrutura hídrica), preservando a saúde fiscal do Estado e demonstrando o valor do planejamento preventivo.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ LIDERANÇA RESPONSÁVEL. Como Presidente, você aplicou a regra de ouro da gestão de riscos: fundos de contingência existem para absorver choques temporários e inesperados. Usá-los com foco e sem criar despesas permanentes protege a estabilidade do país a longo prazo.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Manter o fundo totalmente intocado para não reduzir os ativos do Estado e aprovar um crédito extraordinário via endividamento para financiar a ajuda às regiões secas.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ INEFICIÊNCIA FINANCEIRA. Tomar empréstimos e pagar juros sobre nova dívida enquanto se mantém recursos próprios guardados e parados para essa exata emergência gera um custo desnecessário aos cofres públicos.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Transferir a totalidade do fundo como repasse direto e sem vinculação para os governadores dos estados atingidos, desobrigando a União de fiscalizar a aplicação final do recurso.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ RENÚNCIA DE RESPONSABILIDADE. A gestão de verbas públicas em situações de calamidade exige vinculação clara e transparência. A ausência de prestação de contas vinculada viola os princípios de responsabilidade fiscal da administração federal.",
        "points": 0
      }
    ]
  },
  {
    "id": 80,
    "block": 4,
    "questaoNum": 5,
    "title": "Subsídio Regressivo de Combustíveis",
    "subtitle": "Liderança de Estado & Projetos",
    "context": "O preço do petróleo subiu no mundo inteiro. Para evitar desgaste político, conselheiros sugerem usar dinheiro dos impostos de saúde e educação para subsidiar a gasolina para que o preço na bomba não suba. Como analisar?",
    "options": [
      {
        "origLabel": "A",
        "text": "Subsidiar 100% do combustível por tempo indeterminado, retirando verbas dos hospitais para que os donos de carros de luxo continuem pagando barato.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ SUBSÍDIO REGRESSIVO ETRANSFERÊNCIA PERVERSA. Usar dinheiro do orçamento geral (pago inclusive por quem não tem carro) para congelar gasolina beneficia proporcionalmente mais quem tem maior renda.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Evitar subsídios cegos e regressivos que queimam receita pública essencial, focando o socorro financeiro em auxílios diretos para os mais vulneráveis ou no transporte público coletivo.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ ALOCAÇÃO EFICIENTE E JUSTIÇA DISTRIBUTIVA! Recursos públicos escassos devem proteger os mais pobres (transporte público/renda) em vez de mascarar preços de mercado que drenam verbas da saúde.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Proibir por lei internacional que o preço do petróleo suba no planeta.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 IMPOSSIBILIDADE DE JURISDIÇÃO. O governo brasileiro não tem poder de ditar cotações de commodities nos mercados globais.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Mandar fechar todos os postos de combustíveis do país até o preço voltar ao normal.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 PARALISIA LOGÍSTICA. Fechar postos interrompe o fluxo de alimentos e suprimentos médicos, gerando colapso na economia.",
        "points": 0
      }
    ]
  },
  {
    "id": 81,
    "block": 4,
    "questaoNum": 6,
    "title": "Reforma da Previdência e Gastos",
    "subtitle": "Liderança de Estado & Projetos",
    "context": "As despesas com aposentadorias e pensões crescem a um ritmo superior ao crescimento da arrecadação de impostos, ocupando mais de 50% de todo o Orçamento Federal. Diante desse quadro fiscal, qual medida estrutural adotar?",
    "options": [
      {
        "origLabel": "A",
        "text": "Manter as regras previdenciárias inalteradas e cortar integralmente os gastos com saúde e educação para equilibrar as contas públicas nos próximos anos.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ PARALISIA DO ESTADO. Sacrificar serviços fundamentais como saúde e segurança para sustentar um sistema previdenciário desequilibrado compromete o desenvolvimento humano e a produtividade futura do país.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Enviar uma Reforma da Previdência ao Congresso para adequar a idade de aposentadoria e o tempo de contribuição às novas dinâmicas demográficas, sustentando o orçamento social a longo prazo.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ RESPONSABILIDADE INTERGERACIONAL. Quando a população envelhece, o número de beneficiários aumenta e o de trabalhadores ativos diminui. Reformar a previdência é indispensável para evitar o colapso das contas públicas.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Suspender o pagamento de aposentadorias do setor privado durante os anos de recessão, direcionando os recursos economizados para obras de infraestrutura.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ VIOLAÇÃO DE DIREITOS ADQUIRIDOS. Descumprir obrigações com aposentados que contribuíram ao longo da vida gera caos social e insegurança jurídica absoluta.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Emitir dívida externa continuamente para pagar os aposentados atuais, transferindo o custo da Previdência para ser quitado por governos futuros sem ajustar os requisitos de acesso.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ BOMBA DE DEVIDA. Financiar despesas de custeio diário (como aposentadorias) com endividamento crescente de longo prazo cria uma trajetória de dívida insustentável que leva o país à moratória.",
        "points": 0
      }
    ]
  },
  {
    "id": 82,
    "block": 4,
    "questaoNum": 7,
    "title": "Investimento de Longo Prazo vs Consumo",
    "subtitle": "Liderança de Estado & Projetos",
    "context": "Como Presidente, você tem R$ 50 bilhões de espaço orçamentário. Há pressão política de curto prazo para gastar com Consumo Presente. A equipe econômica sugere direcionar para Investimentos de Longo Prazo. Como agir?",
    "options": [
      {
        "origLabel": "A",
        "text": "Direcionar 100% dos recursos para consumo e custeio imediato, pois a prioridade de um mandato presidencial deve ser exclusivamente o alívio de curto prazo, ignorando gargalos estruturais.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ IMPREVIDÊNCIA FISCAL. Gastar todo o orçamento em consumo corrente sem investir na capacidade produtiva condena o país à estagnação tecnológica e a crises futuras.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Priorizar investimentos em infraestrutura e educação, pois a criação de capital produtivo eleva a capacidade de crescimento do país e gera renda e empregos duradouros para as próximas gerações.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ VOCÊ ACERTOU! (VISÃO DE ESTADO E FORMAÇÃO DE CAPITAL) Sacrificar parte do consumo imediato para investir em infraestrutura e educação aumenta o PIB potencial do país e multiplica a riqueza nacional no longo prazo.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Vetar a aplicação dos R$ 50 bilhões em qualquer área e proibir novos projetos de infraestrutura até o final do mandato.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ PARALISIA E INEFICIÊNCIA. Paralisar os investimentos públicos em um país emergente perpetua gargalos logísticos e reduz a competitividade das empresas nacionais.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Transferir os recursos para a conta de despesas correntes sem planejamento, confiando que o aumento do consumo resolverá sozinho os problemas de longo prazo.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ FOCO EXCLUSIVO NO CURTO PRAZO. O consumo sem aumento correspondente na capacidade de produção gera pressões inflacionárias e não constrói bases sólidas.",
        "points": 0
      }
    ]
  },
  {
    "id": 83,
    "block": 4,
    "questaoNum": 8,
    "title": "Limites do Poder Executivo",
    "subtitle": "Liderança de Estado & Projetos",
    "context": "Durante o debate eleitoral, você como candidato à Presidência promete que, no primeiro dia de governo, revogará sozinho todas as leis aprovadas pelo Congresso e alterará impostos da Constituição. Essa promessa é viável?",
    "options": [
      {
        "origLabel": "A",
        "text": "Sim, o Presidente da República possui autoridade absoluta e pode revogar qualquer lei ou mudar a Constituição por conta própria a qualquer momento.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ ILUSÃO DE PODER ABSOLUTO. A Constituição brasileira adota a separação dos Poderes. O Executivo não pode invadir a competência do Legislativo.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Não. O Presidente governa em um sistema de freios e contrapesos. Ele não pode anular leis sozinho; alterações legislativas e tributárias dependem da aprovação do Congresso Nacional.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ VOCÊ ACERTOU! (LIMITES DO PODER EXECUTIVO) O Presidente é o Chefe do Executivo, mas não é um soberano absoluto. Votar consciente exige saber que promessas que dependem do Congresso precisam de negociação política.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Sim, desde que a revogação das leis seja feita por meio de uma mensagem publicada na rede social oficial da Presidência.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ FALTA DE AMPARO LEGAL. Publicações em redes sociais não possuem valor jurídico para revogar ou criar leis.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Não, porque o Presidente só tem poder para tomar decisões sobre a política externa do país.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ VISÃO LIMITADA. O Presidente possui vastas atribuições internas (economia, saúde, segurança), mas sempre respeitando a divisão de poderes.",
        "points": 0
      }
    ]
  },
  {
    "id": 84,
    "block": 4,
    "questaoNum": 9,
    "title": "Porta de Saída dos Programas Sociais",
    "subtitle": "Liderança de Estado & Projetos",
    "context": "Os programas de transferência de renda são essenciais para combater a fome imediata de milhões de brasileiros. Para que as famílias não fiquem dependentes do benefício para sempre, qual política complementar implementar?",
    "options": [
      {
        "origLabel": "A",
        "text": "Proibir que beneficiários dos programas sociais trabalhem ou procurem cursos de qualificação profissional.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ ARMADILHA DA PO BREZA. Desincentivar o trabalho formal perpetua a dependência do Estado e impede a ascensão social da família.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Integrar o auxílio financeiro a políticas de educação de qualidade, capacitação técnica, microcrédito e geração de empregos formais, criando a \"porta de saída\" da vulnerabilidade.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ EMPOWERMENT E AUTONOMIA FINANCEIRA! O benefício social protege no presente, mas a educação e o trabalho geram a verdadeira autonomia e liberdade financeira do cidadão no futuro.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Reduzir o valor da bolsa a zero sem aviso prévio para forçar as pessoas a encontrarem empregos inexistentes.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 CRUELDADE SOCIAL. Cortar a proteção social sem oportunidade de trabalho expõe os vulneráveis à miséria extrema.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Tornar o auxílio obrigatório inclusive para milionários e grandes empresários da capital.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ DESPERDÍCIO DE FOCO. Recursos assistenciais devem ser focalizados rigorosamente em quem realmente necessita.",
        "points": 0
      }
    ]
  },
  {
    "id": 85,
    "block": 4,
    "questaoNum": 10,
    "title": "Regra de Ouro da Constituição",
    "subtitle": "Liderança de Estado & Projetos",
    "context": "O Governo Federal precisa fechar as contas do ano, mas a arrecadação foi menor. A Constituição estabelece a \"Regra de Ouro\" (Art. 167, III), proibindo empréstimos acima das despesas de capital (investimentos). Como agir?",
    "options": [
      {
        "origLabel": "A",
        "text": "Pegar empréstimos ilimitados no mercado para pagar salários de servidores e aposentadorias do mês, ignorando a restrição constitucional.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 RISCO DE IMPEACHMENT. Emitir dívida acima do limite constitucional para pagar custeio sem autorização do Legislativo é violação grave da Lei de Responsabilidade Fiscal.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Respeitar a Regra de Ouro, evitando pegar empréstimos para custear despesas correntes do dia a dia, a menos que obtenha autorização prévia do Congresso por crédito suplementar.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ VOCÊ ACERTOU! (CUMPRIMENTO DA REGRA DE OURO) A Regra de Ouro impede que o Estado se endivide para pagar despesas de consumo diário (como contas e salários), exigindo crédito especial do Congresso caso precise.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Alterar o texto da Constituição por decreto presencial no último dia do ano para apagar o limite de endividamento.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ USURPAÇÃO DE PODER. O Presidente não possui poder para alterar artigos da Constituição por decreto unipessoal.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Cancelar o pagamento das parcelas das dívidas antigas para utilizar o dinheiro em programas de governo sem autorização.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 CALOTE / DEFAULT. O não pagamento das obrigações financeiras do Estado destrói a credibilidade do país e causa explosão nas taxas de juros futuros.",
        "points": 0
      }
    ]
  },
  {
    "id": 86,
    "block": 4,
    "questaoNum": 11,
    "title": "Risco Cambial em Empréstimo Externo",
    "subtitle": "Liderança de Estado & Projetos",
    "context": "Para financiar um mega projeto de desenvolvimento, assessores sugerem pegar um empréstimo de US$ 50 bilhões em Dólares com bancos internacionais. Qual é o principal risco financeiro que o Presidente deve considerar?",
    "options": [
      {
        "origLabel": "A",
        "text": "Não existe risco, pois o governo pode imprimir dólares para quitar a dívida quando a fatura vencer.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ ERRO MONETÁRIO. O governo brasileiro só emite a sua moeda soberana (Real), dependendo de divisas reais para honrar compromissos em Dólar.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "O risco cambial: se o Dólar subir fortemente em relação ao Real nos anos seguintes, o custo da dívida em moeda nacional pode explodir, desequilibrando as finanças públicas.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ VOCÊ ACERTOU! (GESTÃO DE RISCO CAMBIAL) Endividar o Estado em moeda estrangeira expõe as contas públicas à volatilidade do mercado internacional. Por isso, a preferência moderna é captar em moeda local (Reais).",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "O risco de o dinheiro emprestado se transformar em Real e perder o valor no dia seguinte à assinatura.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ CONFUSÃO DE CÂMBIO. A conversão de moedas é feita pelas taxas oficiais praticadas pelo mercado bancário, sem perda de valor inerente.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "O risco de os países credores exigirem a entrega de partes do território nacional como pagamento imediato.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ IRREALISMO DIPLOMÁTICO. Empréstimos internacionais são regidos por contratos financeiros com garantias de crédito habituais, e não por cessão territorial.",
        "points": 0
      }
    ]
  },
  {
    "id": 87,
    "block": 4,
    "questaoNum": 12,
    "title": "Custo dos Juros da Dívida Pública",
    "subtitle": "Liderança de Estado & Projetos",
    "context": "Ao analisar a destinação dos recursos, o Presidente observa que grande fatia dos impostos arrecadados é gasta no pagamento de juros e amortização da Dívida Pública. Como o equilíbrio fiscal influencia esse custo?",
    "options": [
      {
        "origLabel": "A",
        "text": "Quanto maior for o déficit e a desconfiança sobre a sustentabilidade das contas do governo, maior será o juro exigido pelos investidores para emprestar dinheiro ao Estado, encarecendo a dívida.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ VOCÊ ACERTOU! (RELAÇÃO ENTRE RISCO E CUSTO DO CRÉDITO) Contas públicas desequilibradas aumentam a percepção de risco do país. Para continuar financiando a dívida pública, o Tesouro é obrigado a pagar juros mais elevados.",
        "points": 10
      },
      {
        "origLabel": "B",
        "text": "A dívida pública não cobra juros do governo, sendo paga apenas quando o Presidente decide fazê-lo de forma voluntária.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ ERRO TÉCNICO. O governo paga juros aos detentores de seus títulos públicos (fundos de pensão, bancos, cidadãos), sob pena de calote e ruína financeira.",
        "points": 0
      },
      {
        "origLabel": "C",
        "text": "Aumentar os gastos do governo sem limite faz com que as taxas de juros caiam para zero de forma automática.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ LÓGICA INVERTIDA. Descontrole de gastos gera inflação e risco de crédito, o que empurra a taxa de juros para cima, e não para baixo.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "O custo dos juros da dívida é definido quinzenalmente por votação popular em plebiscito nacional.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ MECANISMO INEXISTENTE. As taxas da dívida pública são definidas pela dinâmica do mercado financeiro e pela taxa básica definida pelo Banco Central (Selic).",
        "points": 0
      }
    ]
  },
  {
    "id": 88,
    "block": 4,
    "questaoNum": 13,
    "title": "Pedalada Fiscal e Responsabilidade",
    "subtitle": "Liderança de Estado & Projetos",
    "context": "Para mostrar um saldo bonito nas contas em ano eleitoral, assessores sugerem atrasar de propósito o repasse de R$ 30 bilhões para os bancos públicos que pagam seguro-desemprego, fingindo que o dinheiro ainda está no cofre. O que é a Pedalada Fiscal?",
    "options": [
      {
        "origLabel": "A",
        "text": "É uma manobra inteligente e sem riscos que deve ser repetida todos os anos para enganar os analistas.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 VIOLAÇÃO DA LRF. Esconder dívidas maquiando balanços engana a sociedade e destrói a transparência fiscal do Estado.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "É uma fraude fiscal grave que destrói a credibilidade do país, esconde o tamanho real do déficit e constitui Crime de Responsabilidade que pode levar ao impeachment do Presidente.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ RESPONSABILIDADE INSTITUCIONAL E LEI! A transparência fiscal é inegociável. Tentar maquiar contas públicas viola a Lei de Responsabilidade Fiscal e pune o gestor com a perda do mandato.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "É uma prática incentivada e recomendada pelo Tribunal de Contas da União.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ FALSO HISTÓRICO. O TCU condena rigorosamente o uso de bancos públicos para financiar indiretamente o Tesouro Nacional.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Transforma o déficit público em superávit real com poder de compra imediato.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ ILUSÃO DE ÓTICA. Esconder a dívida na contabilidade não faz o compromisso financeiro desaparecer no mundo real.",
        "points": 0
      }
    ]
  },
  {
    "id": 89,
    "block": 4,
    "questaoNum": 14,
    "title": "Ensino Técnico e Produtividade",
    "subtitle": "Liderança de Estado & Projetos",
    "context": "Milhares de vagas de emprego em tecnologia e indústria avançada estão vazias por falta de profissionais qualificados, enquanto milhões de jovens sem formação estão desempregados. Que tipo de investimento priorizar?",
    "options": [
      {
        "origLabel": "A",
        "text": "Investir massivamente no ensino técnico e profissionalizante integrado ao ensino médio, alinhando os cursos às demandas reais de empregabilidade da economia moderna.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ CAPITAL HUMANO E EMPREGABILIDADE! O ensino técnico de qualidade é a ponte mais rápida entre o jovem vulnerável e o primeiro emprego formal com renda digna, aumentando a produtividade do país.",
        "points": 10
      },
      {
        "origLabel": "B",
        "text": "Fechar todas as escolas técnicas e direcionar o dinheiro para bolsas de pós-doutorado em filosofia medieval em universidades do exterior.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ DESCONEXÃO COM A REALIDADE SOCIAL. Embora a pesquisa seja relevante, priorizar nichos acadêmicos distantes enquanto faltam técnicos básicos agrava o desemprego jovem.",
        "points": 0
      },
      {
        "origLabel": "C",
        "text": "Dizer aos jovens que ter uma profissão técnica é desnecessário para o futuro do país.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ DESVALORIZAÇÃO DO TRABALHO TÉCNICO. Países desenvolvidos possuem alta taxa de matriculados no ensino técnico como motor de suas economias.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Proibir que as indústrias contratem jovens com menos de 30 anos de idade.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 DISCRIMINAÇÃO E PARALISIA. Impedir a entrada de jovens no mercado de trabalho destrói o dividendo demográfico do país.",
        "points": 0
      }
    ]
  },
  {
    "id": 90,
    "block": 4,
    "questaoNum": 15,
    "title": "Estagflação e Diagnóstico",
    "subtitle": "Liderança de Estado & Projetos",
    "context": "O país enfrenta uma combinação terrível: o PIB está caindo (recessão, desemprego) e ao mesmo tempo a inflação está em 12% ao ano (preços subindo sem parar). Essa situação é chamada de Estagflação. Qual a causa desse pesadelo?",
    "options": [
      {
        "origLabel": "A",
        "text": "A estagflação é causada pelo excesso de prosperidade e riqueza de toda a população ao mesmo tempo.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ DIAGNÓSTICO OPOSTO. A estagflação é o pior dos cenários econômicos, pois une o desemprego da recessão com a perda de poder de compra da inflação.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Resulta de erros graves de política econômica: choques de oferta combinados com descontrole fiscal e tentativas malsucedidas de estimular a economia no grito durante incertezas.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ DIAGNÓSTICO CRÍTICO DE ERRO DE GESTÃO! Políticas fiscais e monetárias irresponsáveis podem travar o crescimento e, simultaneamente, desvalorizar a moeda, criando a estagflação.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "A estagflação ocorre quando o governo decide zerar todos os impostos do país.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ ERRO CONCEITUAL. A causa da estagflação está ligada a desequilíbrios macroeconômicos profundos e perda de credibilidade das políticas públicas.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "É um fenômeno positivo que ajuda as famílias a economizarem mais dinheiro.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ RACIOCÍNIO INCORRETO. A estagflação destrói orçamentos familiares, corroendo salários e eliminando postos de trabalho.",
        "points": 0
      }
    ]
  },
  {
    "id": 91,
    "block": 4,
    "questaoNum": 16,
    "title": "Inovação Financeira e Sistema PIX",
    "subtitle": "Liderança de Estado & Projetos",
    "context": "O Banco Central desenvolve a moeda digital e o sistema de pagamento instantâneo (PIX) para modernizar o sistema financeiro. Qual é o principal benefício dessa inovação para o cidadão e a economia?",
    "options": [
      {
        "origLabel": "A",
        "text": "Banir o uso de tecnologia e exigir que todas as pessoas voltem a usar moedas de ouro para fazer compras.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ RETROCESSO TECNOLÓGICO. Ignorar inovações financeiras aumenta o custo de circulação do dinheiro e atrasa o desenvolvimento do país.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Reduzir os custos de transação financeira, aumentar a bancarização dos mais pobres, trazer transparência ao gasto público e combater a sonegação e a lavagem de dinheiro.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ EFICIÊNCIA E INCLUSÃO FINANCEIRA! A digitalização do sistema financeiro (PIX/DREX) barateia custos para pequenos empreendedores, amplia o acesso bancário e melhora a rastreabilidade.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Permitir que o governo tome todo o dinheiro da conta bancária dos cidadãos sem qualquer ordem judicial.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 VIOLAÇÃO DE DIREITOS FUNDAMENTAIS. Tecnologias financeiras estatais devem operar estritamente sob as garantias do devido processo legal e direito de propriedade.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Usar a moeda digital para impedir que as pessoas comprem comida nos fins de semana.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 ABUSO AUTORITÁRIO. O papel da moeda pública é facilitar as trocas voluntárias na sociedade, não controlar as escolhas privadas do cidadão.",
        "points": 0
      }
    ]
  },
  {
    "id": 92,
    "block": 4,
    "questaoNum": 17,
    "title": "Livre Comércio vs Protecionismo",
    "subtitle": "Liderança de Estado & Projetos",
    "context": "O Brasil debate a assinatura de um grande acordo de livre comércio (como Mercosul - União Europeia). Conselheiros protecionistas pedem para proibir qualquer produto estrangeiro no Brasil. Como analisar sob a ótica do consumidor?",
    "options": [
      {
        "origLabel": "A",
        "text": "Fechar as fronteiras completamente, obrigando os brasileiros a pagarem o dobro do preço por produtos nacionais de pior qualidade por falta de concorrência.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ AUTARQUIA E PREJUÍZO AO CONSUMIDOR. Fechamento comercial excessivo pune a população com produtos mais caros e ultrapassados, reduzindo o poder de compra das famílias.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Promover a integração comercial gradual e inteligente: ela expõe as empresas locais à concorrência saudável, dá acesso a máquinas e tecnologias mais baratas e garante produtos melhores ao consumidor.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ COMPETITIVIDADE E PODER DE COMPRA! O comércio internacional permite que o país exporte o que faz de melhor e importe insumos e produtos mais eficientes, beneficiando o consumidor final.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Proibir as empresas brasileiras de venderem seus produtos para fora do país.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 SUICÍDIO COMERCIAL. Impedir exportações destrói a entrada de dólares no país e quebra o agronegócio e a indústria nacional.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Permitir a entrada de produtos estrangeiros apenas se eles forem doados de graça para o governo.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ IRREALISMO DE MERCADO. Transações internacionais são trocas econômicas baseadas em vantagens comparativas e preços de mercado.",
        "points": 0
      }
    ]
  },
  {
    "id": 93,
    "block": 4,
    "questaoNum": 18,
    "title": "Regra de Reajuste do Salário Mínimo",
    "subtitle": "Liderança de Estado & Projetos",
    "context": "No Brasil, cada R$ 1,00 de aumento no Salário Mínimo gera um impacto de R$ 400 milhões nas despesas do Governo Federal (devido a INSS, BPC e seguro-desemprego atrelados). Como equilibrar o reajuste com as contas públicas?",
    "options": [
      {
        "origLabel": "A",
        "text": "Decretar um salário mínimo de R$ 50 mil sem avaliar que isso quebraria a Previdência Social no dia seguinte e geraria demissões em massa nas pequenas empresas.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 POPULISMO E INVIABILIDADE FISCAL. Aumentos arbitrários e desconectados da capacidade do Tesouro e das empresas causam quebra generalizada e desemprego formal.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Adotar uma regra de reajuste transparente e previsível que combine a reposição integral da inflação (mantendo o poder de compra) com a variação do PIB (garantindo ganho real compatível).",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ VALORIZADO COM RESPONSABILIDADE FISCAL! Uma regra previsível preserva o poder de compra dos aposentados e trabalhadores sem gerar sobressaltos incalculáveis no orçamento público.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Congelar o salário mínimo em valores nominais por 30 anos sem qualquer correção de inflação.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ CORROSÃO SOCIAL. Deixar de reajustar a inflação reduz a renda real das famílias mais pobres ano a ano.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Cancelar o salário mínimo e deixar que cada empresa pague o trabalhador com frutas velhas.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 RETROCESSO TRABALHISTA E HUMANO. Viola o piso constitucional garantido ao trabalhador brasileiro.",
        "points": 0
      }
    ]
  },
  {
    "id": 94,
    "block": 4,
    "questaoNum": 19,
    "title": "Dualismo Cambial e Indústria",
    "subtitle": "Liderança de Estado & Projetos",
    "context": "Após medidas de atração de capital estrangeiro, a cotação do Dólar caiu acentuadamente frente ao Real. A equipe econômica celebra a queda na pressão inflacionária, mas exportadores cobram apoio por perda de competitividade. Qual o dilema?",
    "options": [
      {
        "origLabel": "A",
        "text": "Determinar que o câmbio seja mantido o mais baixo possível indefinidamente, pois uma moeda muito forte só traz vantagens para a economia nacional.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ VISÃO UNILATERAL. Um Real forte demais por longos períodos pode desindustrializar o país, tornando os produtos nacionais caros para o exterior e vulneráveis aos concorrentes.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Reconhecer que o Dólar mais baixo reduz o custo de importados e ajuda a conter a inflação interna, mas encarece o produto nacional no exterior, exigindo políticas de produtividade.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ VOCÊ ACERTOU! (ENTENDIMENTO DO DUALISMO CAMBIAL) O papel do Presidente é ponderar esse trade-off: o Real valorizado barateia insumos e segura preços domésticos, mas exige atenção às exportações.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Afirmar que a valorização da moeda nacional reduz diretamente a renda da população que ganha salários em Reais.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ EQUÍVOCO CONCEITUAL. A valorização da moeda local aumenta o poder de compra interno dos salários pagos em Reais.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Decretar o bloqueio completo da entrada de moeda estrangeira no país para forçar o Dólar a subir novamente.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ ISOLAMENTO FINANCEIRO. Fechar o país para o fluxo financeiro internacional reduz investimentos produtivos e prejudica o financiamento do crescimento econômico.",
        "points": 0
      }
    ]
  },
  {
    "id": 95,
    "block": 4,
    "questaoNum": 20,
    "title": "Selic, Capital Internacional e Câmbio",
    "subtitle": "Liderança de Estado & Projetos",
    "context": "O Banco Central eleva a taxa básica de juros (Selic) para combater a inflação, gerando tendência de queda no Dólar. Como explicar a relação mecânica entre a política de juros e o comportamento do câmbio?",
    "options": [
      {
        "origLabel": "A",
        "text": "Explicar que juros mais altos tornam os títulos em moeda nacional mais atraentes para investidores globais; ao trazerem Dólares para investir no país, a oferta da moeda americana aumenta e o seu preço em Reais cai.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ VOCÊ ACERTOU! (MECANISMO DE OFERTA E DEMANDA) O aumento do diferencial de juros atrai fluxo financeiro internacional. Mais Dólares ingressando no mercado brasileiro elevam a oferta da moeda e reduzem sua cotação.",
        "points": 10
      },
      {
        "origLabel": "B",
        "text": "Informar que a taxa de juros alta garante o recebimento de doações financeiras diretas de governos estrangeiros para as contas da Presidência.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ ERRO CONCEITUAL. Não se trata de doações entre governos, mas do movimento de investidores globais buscando rendimento para seus recursos.",
        "points": 0
      },
      {
        "origLabel": "C",
        "text": "Declarar que o valor do Dólar é definido diretamente por portaria do Poder Executivo sempre que os juros mudam.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ CONFUSÃO REGULATÓRIA. No regime de câmbio flutuante, a cotação é definida pelas forças do mercado, e não por decreto do Poder Executivo.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Sustentar que o aumento dos juros faz com que investidores internacionais retirem imediatamente todos os seus capitais do país.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ LÓGICA INVERTIDA. Taxas de juros reais mais altas tendem a atrair capitais financeiros em busca de rentabilidade em renda fixa, e não a afugentá-los.",
        "points": 0
      }
    ]
  },
  {
    "id": 96,
    "block": 4,
    "questaoNum": 21,
    "title": "Resultado Primário e Solvência",
    "subtitle": "Liderança de Estado & Projetos",
    "context": "O Ministério da Fazenda apresenta os dados de Resultado Primário (diferença entre arrecadação e despesas operacionais, sem contar juros da dívida). Como explicar a importância de manter a meta de Superávit Primário?",
    "options": [
      {
        "origLabel": "A",
        "text": "Explicar que economizar recursos nas contas operacionais sinaliza responsabilidade aos investidores, reduz o risco do país, estabiliza a inflação e ajuda a conter o crescimento da Dívida Pública.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ VOCÊ ACERTOU! (SOLVÊNCIA E ESTABILIDADE ECONÔMICA) O superávit primário demonstra que o Estado consegue gerir seu custeio diário com recursos próprios. Isso atrai investimentos, segura a inflação e reduz juros futuros.",
        "points": 10
      },
      {
        "origLabel": "B",
        "text": "Afirmar que a busca por superávit primário serve apenas para acumular moedas de ouro nos cofres do Palácio do Planalto sem qualquer utilidade para a economia real.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ MICO CONCEITUAL. A gestão do resultado primário não acumula riqueza física estática, mas garante o equilíbrio entre receitas e despesas correntes do Estado.",
        "points": 0
      },
      {
        "origLabel": "C",
        "text": "Declarar que o governo deve sempre trabalhar com o maior déficit primário possível, pois gastar sem receitas adicionais é o único modo de zerar a inflação no país.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ LÓGICA INVERTIDA. Déficits primários recorrentes e sem financiamento geram desconfiança, desvalorizam a moeda nacional e empurram a inflação para cima.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Anunciar que o saldo das contas públicas deixará de ser apurado para evitar preocupações do mercado financeiro.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ FALTA DE TRANSPARÊNCIA. Esconder ou ignorar os dados de execução orçamentária quebra a confiança das instituições e expõe o gestor a graves sanções legais.",
        "points": 0
      }
    ]
  },
  {
    "id": 97,
    "block": 4,
    "questaoNum": 22,
    "title": "Elaboração da Lei Orçamentária (LOA)",
    "subtitle": "Liderança de Estado & Projetos",
    "context": "Anualmente, cabe ao Poder Executivo elaborar e enviar ao Congresso Nacional o projeto da Lei Orçamentária Anual (LOA). Qual deve ser o cuidado central da Presidência ao consolidar as estimativas do Orçamento?",
    "options": [
      {
        "origLabel": "A",
        "text": "Superestimar artificialmente a arrecadação de impostos para autorizar gastos ilimitados sem necessidade de cortes.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ MAQUIAGEM ORÇAMENTÁRIA. Criar receitas fictícias gera déficits graves e descumprimento das metas fiscais aprovadas por lei.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Elaborar estimativas realistas de receita, respeitar os limites de gastos e garantir o atendimento prioritário das despesas obrigatórias e dos serviços essenciais.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ VOCÊ ACERTOU! (PLANEJAMENTO E RESPONSABILIDADE FISCAL) O orçamento é a peça central da gestão pública. Estimativas precisas e realistas evitam contingenciamentos drásticos e paralisia de serviços essenciais.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Omitir do orçamento os gastos com o pagamento da dívida pública para fazer o saldo parecer positivo.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ FALTA DE TRANSPARÊNCIA. A omissão de despesas públicas fere os princípios da publicidade, universalidade e sinceridade orçamentária.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Deixar de enviar o projeto de lei orçamentária ao Congresso e gastar os recursos conforme a demanda diária do Planalto.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ OMISSÃO DE DEVER LUGAR. Enviar a proposta orçamentária no prazo constitucional é uma obrigação indelegável do Presidente da República.",
        "points": 0
      }
    ]
  },
  {
    "id": 98,
    "block": 4,
    "questaoNum": 23,
    "title": "Custo de Oportunidade em Obras Públicas",
    "subtitle": "Liderança de Estado & Projetos",
    "context": "O Custo de Oportunidade ensina que ao escolher gastar R$ 10 bilhões em uma finalidade X, você abre mão de usar esses R$ 10 bilhões na finalidade Y. Se o Presidente decide construir um estádio na floresta, qual o custo de oportunidade?",
    "options": [
      {
        "origLabel": "A",
        "text": "O custo de oportunidade foi ZERO, pois o estádio é bonito e o dinheiro apareceu do nada.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ NEGAÇÃO DA ESCASSEZ. Recursos são escassos. Todo gasto governamental possui um custo de oportunidade implícito.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "O custo de oportunidade foram as centenas de creches, hospitais, saneamento e escolas que deixaram de ser construídos com esses mesmos R$ 10 bilhões.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ COMPREENSÃO DO CUSTO DE OPORTUNIDADE! Na gestão pública e na vida pessoal, cada escolha financeira significa abrir mão de outra oportunidade. O bom gestor prioriza o investimento de maior retorno social.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "O custo de oportunidade foi o lucro de R$ 1 trilhão que o estádio vai gerar vendendo ingressos no dia seguinte.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ ILUSÃO DE RETORNO. Estádios sem demanda local transformam-se em \"elefantes brancos\" com custos de manutenção altíssimos pagos pelo contribuinte.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "O custo de oportunidade significa que todos os cidadãos ganharam um carro novo do governo.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ ABSURDO CONCEITUAL. Custo de oportunidade mede o benefício da alternativa sacrificada, e não distribuição de prêmios privados.",
        "points": 0
      }
    ]
  },
  {
    "id": 99,
    "block": 4,
    "questaoNum": 24,
    "title": "Nomeação de Ministros do STF",
    "subtitle": "Liderança de Estado & Projetos",
    "context": "Abertas vagas no Supremo Tribunal Federal (STF), cabe ao Presidente da República indicar os novos ministros. Qual é o rito constitucional correto que o Chefe do Executivo deve seguir para efetivar essas nomeações?",
    "options": [
      {
        "origLabel": "A",
        "text": "Escolher cidadãos com mais de 35 anos, de notável saber jurídico e reputação ilibada, e submeter os nomes à sabatina e aprovação do Senado Federal.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ VOCÊ ACERTOU! (EQUILÍBRIO ENTRE OS PODERES) A indicação é uma prerrogativa do Presidente, mas depende obrigatoriamente do controle e da aprovação da maioria absoluta do Senado Federal (freios e contrapesos).",
        "points": 10
      },
      {
        "origLabel": "B",
        "text": "Indicar e empossar os novos ministros de forma direta e sumária, sem necessidade de aprovação por qualquer outro Poder.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ CONCENTRAÇÃO DE PODER. O Presidente não possui poder unipessoal para empossar ministros do STF sem o aval do Poder Legislativo.",
        "points": 0
      },
      {
        "origLabel": "C",
        "text": "Transferir a escolha dos ministros da Suprema Corte para uma votação direta realizada entre os governadores de estado.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ ERRO CONSTITUCIONAL. A Constituição não prevê participação de governadores no processo de escolha de ministros da Suprema Corte.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Nomear os indicados em caráter temporário por um mês para testar se suas decisões agradam ao Palácio do Planalto.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ INVIABILIDADE JURÍDICA. O cargo de ministro do STF é vitalício e não admite nomeações provisórias sob teste do Poder Executivo.",
        "points": 0
      }
    ]
  },
  {
    "id": 100,
    "block": 4,
    "questaoNum": 25,
    "title": "Avaliação do Legado Presidencial",
    "subtitle": "Liderança de Estado & Projetos",
    "context": "Ao final do mandato como Presidente da República, a nação avalia o seu legado para a economia e para o bolso das famílias brasileiras. Qual opção representa uma Presidência que promoveu a responsabilidade e a prosperidade?",
    "options": [
      {
        "origLabel": "A",
        "text": "Contas públicas equilibradas com trajetória sustentável da dívida, moeda forte com inflação baixa, acesso à educação e ao crédito consciente, ambiente favorável a negócios, e uma população informada sobre o valor do dinheiro.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ EXCELÊNCIA NA LIDERANÇA NACIONAL E CIDADANIA! O verdadeiro papel da Presidência é construir fundamentos econômicos sólidos que permitam ao cidadão trabalhar, poupar, investir e prosperar com estabilidade e liberdade financeira.",
        "points": 10
      },
      {
        "origLabel": "B",
        "text": "Uma montanha de dívidas deixada para as próximas gerações, inflação descontrolada corroendo salários, congelamento de preços, falência de empresas e promessas de que o governo resolverá a vida de todos sem trabalho.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 COLAPSO FISCAL E SOCIAL. O populismo econômico gera um momento de euforia fictícia seguido por anos de crise, inflação e empobrecimento coletivo.",
        "points": 0
      },
      {
        "origLabel": "C",
        "text": "Fechamento das fronteiras, proibição de moedas digitais, extinção de todas as empresas privadas e estatização completa das padarias do país.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 PARALISIA E TOTALITARISMO ECONÔMICO. Eliminar a iniciativa privada e isolar o país destrói a riqueza e a capacidade de escolha da sociedade.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Gastança desenfreada em festas e propagandas, maquiagem de estatísticas públicas e distribuição de notas fiscais sem fundos para a população.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 DESASTRE INSTITUCIONAL. Maquiar a realidade e queimar recursos em frivolidades liquida o futuro do país e empobrece a população.",
        "points": 0
      }
    ]
  }
];
