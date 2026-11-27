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
    "subtitle": "Finanças Pessoais & Consumo"
  },
  {
    "id": 2,
    "name": "O Prefeito",
    "emoji": "🏛️",
    "color": "#22c55e",
    "role": "prefeito",
    "subtitle": "Gestão Municipal & Serviços"
  },
  {
    "id": 3,
    "name": "O Ministro da Economia",
    "emoji": "📈",
    "color": "#ffd300",
    "role": "ministro",
    "subtitle": "Macroeconomia & Política Monetária"
  },
  {
    "id": 4,
    "name": "O Presidente da República",
    "emoji": "👑",
    "color": "#684a97",
    "role": "presidente",
    "subtitle": "Liderança de Estado & Projetos"
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
        "text": "Dar os R$ 500 de entrada e passar os R$ 1.500 no cartão de crédito, pagando só o valor mínimo da fatura por alguns meses até o orçamento da casa voltar ao normal.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "⚠️ ARMADILHA MORTAL DO ROTATIVO! O juro do crédito rotativo do cartão é um dos mais altos do mundo (podendo passar de 400% ao ano). Os R$ 1.500 não pagos viram uma bola de neve incontrolável em poucos meses, transformando uma necessidade da casa em um endividamento grave e nome sujo no SPC/Serasa.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Dar os R$ 500 de entrada e parcelar os R$ 1.500 no cartão em parcelas fixas sem juros que caibam no mês, cortando alguns gastos da casa até terminar de pagar.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ DECISÃO EQUILIBRADA! Você utiliza parte do recurso disponível para diminuir o saldo devedor e dilui o restante em parcelas fixas previsíveis. Cortar pequenos gastos supérfluos no mês para cobrir essa nova parcela evita que você recorra a juros abusivos de emergência.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Pegar um empréstimo rápido no aplicativo do banco para pagar os R$ 2.000 à vista e dividir esse valor em 36 vezes, assim a parcela fica pequena e não aperta o mês.",
        "type": "partial",
        "icon": "⚠️",
        "feedback": "⚠️ EFEITO ILUSÃO DA PARCELA PEQUENA! Ao diluir em 36 vezes, você pode acabar pagando 3 ou 4 vezes o valor da geladeira original só em juros embutidos no empréstimo pessoal. Quando a dívida finalmente terminar, a própria geladeira já estará velha ou quebrada.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Comprar uma geladeira usada em bom estado por R$ 500, pagando com o dinheiro que já está na reserva, e esperar a reserva se recompor antes de pensar em uma nova.",
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
        "text": "Usar R$ 3.000 da reserva de emergência para pagar o conserto à vista e, nos próximos meses, voltar a guardar até recompor a reserva.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ USO CORRETO DA RESERVA! A reserva de emergência existe exatamente para imprevistos que afetam sua vida ou capacidade de gerar renda (como o carro de trabalho). Pagar à vista evita juros. O próximo passo é paciência e foco para reabastecer a reserva.",
        "points": 10
      },
      {
        "origLabel": "B",
        "text": "Manter os R$ 3.500 rendendo no Tesouro Selic, para não mexer no investimento, e parcelar o conserto em 12x no cartão com juros.",
        "type": "partial",
        "icon": "⚠️",
        "feedback": "⚠️ ILUSÃO DO INVESTIMENTO! Não faz sentido financeiro manter o dinheiro rendendo 10% ou 11% ao ano enquanto você paga 15% ou mais de juros no parcelamento. Os juros da dívida engolem o rendimento do seu investimento.",
        "points": 0
      },
      {
        "origLabel": "C",
        "text": "Pegar um empréstimo pessoal em 24 meses para pagar a oficina, deixando a reserva intacta e o limite do cartão livre para imprevistos.",
        "type": "partial",
        "icon": "⚠️",
        "feedback": "⚠️ DÍVIDA DESNECESSÁRIA! Pegar empréstimo tendo dinheiro em caixa para cobrir a emergência é rasgar dinheiro em taxas de juros bancárias.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Vender o carro do jeito que está, mesmo abaixo da tabela FIPE, e passar a ir de ônibus para não ter mais gasto com manutenção.",
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
        "text": "Aceitar o carnê de 24x de R$ 130, já que essa parcela cabe direitinho na folga do seu orçamento todo mês.",
        "type": "partial",
        "icon": "⚠️",
        "feedback": "⚠️ CUSTO EFETIVO TOTAL (CET) CEGO! Ao final de 2 anos, você terá pago R$ 3.120 por um aparelho de R$ 1.800. Você pagou quase duas TVs! O crediário tradicional esconde juros altíssimos no valor da parcela.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Somar o total do carnê (24 x R$ 130 = R$ 3.120), recusar pelos juros altos e juntar o valor para pagar à vista.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ VISÃO CRÍTICA DE CONSUMO! Calcular o custo total é a regra básica do consumidor inteligente. Recusar juros abusivos protege seu dinheiro e permite planejar a compra sem rasgar recursos.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Pagar com um cheque pré-datado para daqui a dois meses, contando que até lá vai entrar dinheiro na conta.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 RISCO OPERACIONAL E FINANCEIRO! Emitir cheques sem fundo gera tarifas bancárias, inclusão no Cadastro de Emitentes de Cheques sem Fundo (CCF) e bloqueio de serviços bancários.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Pagar as primeiras parcelas e, se o mês apertar, parar de pagar o carnê, já que a TV já vai estar em casa.",
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
        "text": "Aceitar e pedir o valor máximo permitido, já que é família e a pessoa prometeu pagar a parcela certinho todo mês.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 MAIOR CAUSA DE INADIMPLÊNCIA FAMILIAR! Se o parente não conseguir pagar (o que é comum para quem já está endividado), o desconto continuará caindo obrigatoriamente do seu salário. Você assume o risco integral da dívida de outra pessoa.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Recusar com jeito, explicando que o desconto sai direto do seu salário e a dívida fica com você se algo der errado.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ FRONTEIRA FINANCEIRA SAUDÁVEL! Proteger seu nome e sua fonte de renda é fundamental. Você pode ajudar de outras formas (orientando ou ajudando pontualmente com alimentos), mas nunca emprestando seu crédito.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Fazer o empréstimo, mas pedir que o familiar assine um papel prometendo pagar cada parcela até o fim do contrato.",
        "type": "partial",
        "icon": "⚠️",
        "feedback": "⚠️ SEM GARANTIA REAL. Um papel informal não impede o desconto no seu contracheque. Se a pessoa falir, você terá que acionar a justiça contra um familiar, gerando um transtorno emocional e financeiro gigantesco.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Fazer o empréstimo e aplicar o dinheiro em criptomoedas por uns meses, para tentar dobrar o valor antes de repassar.",
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
        "text": "Pagar R$ 2.700 à vista no Pix, usando o dinheiro do CDB e garantindo R$ 300 de desconto na hora.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ MATEMÁTICA A FAVOR! Um desconto de 10% à vista equivale a um ganho imediato que nenhum investimento seguro do mercado (como CDB ou Poupança) consegue entregar no período de 10 meses. É ganho financeiro puro.",
        "points": 10
      },
      {
        "origLabel": "B",
        "text": "Pagar em 10x sem juros no cartão e deixar os R$ 3.000 no CDB, rendendo durante os 10 meses do parcelamento.",
        "type": "partial",
        "icon": "⚠️",
        "feedback": "⚠️ CONTA QUE NÃO FECHA! O rendimento de R$ 3.000 em 10 meses de CDB renderá bem menos do que os R$ 300 (10%) de desconto direto oferecido no ato da compra.",
        "points": 0
      },
      {
        "origLabel": "C",
        "text": "Pagar os R$ 3.000 à vista sem tocar no assunto do desconto, para resolver logo e não perder tempo no caixa.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ DESPERDÍCIO DE RECURSOS. Não aproveitar o desconto negociável à vista quando se tem o capital disponível é deixar dinheiro na mesa.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Parcelar em 10x no cartão e usar parte dos R$ 3.000 do CDB em roupas na liquidação, já que não há juros.",
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
        "text": "Ignorar a proposta, desconfiando que é golpe, e esperar a dívida caducar e sair do Serasa depois de 5 anos.",
        "type": "partial",
        "icon": "⚠️",
        "feedback": "⚠️ MITO DO CADUCAR! Embora a dívida saia do Serasa/SPC após 5 anos, o débito continua existindo no Registrato/Banco Central. Seu Score continuará baixo e seu crédito ficará bloqueado na instituição para sempre.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Conferir a oferta no site oficial do banco e aceitar quitar os R$ 1.800 à vista, guardando o comprovante.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ OPORTUNIDADE DE RECOMEÇO! Os feirões de renegociação retiram os juros abusivos acumulados. Quitar por um valor menor que o original (com os devidos comprovantes oficiais) limpa seu nome e restabelece sua saúde financeira.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Aceitar parcelar a dívida de R$ 15.000 em 60x de R$ 400, porque essa parcela cabe melhor no seu mês.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ CONFISSÃO DE DÍVIDA INFLACIONADA. Aceitar renegociar o valor com juros abusivos (R$ 15.000 em 60x) só perpetua o ciclo de endividamento sem aproveitar o desconto real do mercado.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Passar a dívida para um agiota do bairro, que cobra juros menores que os do cartão, e pagar a ele aos poucos.",
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
        "text": "Continuar pagando a cesta, pois acredita que todo banco é obrigado a cobrar essa tarifa de manutenção.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ ANALFABETISMO FINANCEIRO TRIBUTÁRIO/BANCÁRIO. Pagar tarifas desnecessárias retira R$ 540 por ano do seu bolso que poderiam estar investidos ou cobrindo despesas da casa.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Pedir no app ou na agência a troca para o pacote de serviços essenciais, gratuito por regra do Banco Central.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ DIREITO DO CONSUMIDOR EXERCIDO! O Banco Central garante a todo cidadão brasileiro uma conta com pacote de serviços essenciais gratuitos (que inclui saques, extratos e transferências básicas/Pix).",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Fechar a conta e passar a guardar o salário em dinheiro vivo em casa, para não pagar mais nenhuma tarifa.",
        "type": "partial",
        "icon": "⚠️",
        "feedback": "⚠️ RISCO DE PERDA E INFLAÇÃO. Manter dinheiro vivo expõe o valor a roubos, perda e depreciação pelo efeito corrosivo da inflação.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Entrar com um processo contra o banco logo de cara, sem antes pedir a troca do pacote ou o cancelamento.",
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
        "text": "Passar a pagar as compras do mercado no cartão de crédito em 3x, para dividir o aumento ao longo dos próximos meses.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 EFEITO BOLA DE NEVE. Parcelar itens de consumo recorrente (alimentos) cria um efeito cumulativo devastador: no mês seguinte você terá a feira do mês + as parcelas da feira anterior.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Trocar marcas por outras mais baratas, comparar preços em atacarejos e feiras e sair de casa com lista de compras.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ ADAPTAÇÃO E DISCIPLINA! Mudar hábitos de consumo e buscar atacarejos e marcas substitutas é a maneira inteligente de combater a perda de poder de compra gerada pela inflação.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Cancelar o plano de saúde da família por enquanto, para conseguir manter as mesmas marcas de alimentos de antes.",
        "type": "partial",
        "icon": "⚠️",
        "feedback": "⚠️ DESPROTEÇÃO GRAVE. Cancelar serviços de saúde básica em favor de consumo de marcas específicas expõe a família a imprevistos financeiros muito maiores no caso de doenças.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Atrasar as contas de água e luz por alguns meses para manter as compras do mercado do jeito que eram antes.",
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
        "text": "Escolher a Tabela Price, porque a parcela começa menor e fica igual até o fim, facilitando o controle do orçamento.",
        "type": "partial",
        "icon": "⚠️",
        "feedback": "⚠️ ALERTA DE CUSTO TOTAL! Na Tabela Price, como você demora mais para reduzir o saldo devedor principal, o montante total de juros pago ao banco em 30 anos costuma ser bem maior do que na tabela SAC.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Escolher a SAC se a primeira parcela couber no orçamento, já que no total você paga bem menos juros ao banco.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ ESCOLHA TÉCNICA CORRETA! A tabela SAC reduz o valor da dívida (amortização) mais rápido desde o primeiro mês. Conforme o tempo passa, as parcelas diminuem, aliviando seu orçamento no futuro e reduzindo o juro total.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Escolher a tabela que o gerente indicar sem ler o contrato, já que os financiamentos dos bancos são quase todos iguais.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ ANALFABETISMO CONTRATUAL. Ignorar taxas, indexadores (como TR ou IPCA) e sistemas de amortização pode transformar a casa própria em uma armadilha financeira insustentável.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Desistir do financiamento, seguir no aluguel e gastar toda a sobra do mês com lazer, já que não vai pagar parcela.",
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
        "text": "Aceitar a garantia de R$ 250 e incluir na compra parcelada, já que o vendedor promete trocar o celular na hora.",
        "type": "partial",
        "icon": "⚠️",
        "feedback": "⚠️ SEGURO DESNECESSÁRIO OU ILUSÓRIO. A garantia estendida é um dos produtos mais lucrativos para o varejo porque a maioria dos defeitos cobertos já ocorrem no prazo da garantia de fábrica ou não são cobertos por exclusões de \"mau uso\".",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Recusar, pois o celular já tem a garantia legal e a do fabricante, e esses seguros têm muitas exclusões.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ CONSUMIDOR CONSCIENTE! Todo produto tem garantia legal estipulada pelo CDC (90 dias para bens duráveis) somada à garantia contratual do fabricante (geralmente 1 ano). Guardar o valor do seguro na sua própria reserva é muito mais rentável.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Recusar a garantia e comprar outro celular igual, para ter um de reserva guardado se o primeiro quebrar.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ CUSTO DUPLICADO. Dobrar o gasto para se prevenir de uma falha eventual gera um desperdício enorme de capital.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Pedir a garantia estendida de graça, dizendo que vai reclamar no Procon se a loja não incluir no preço.",
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
        "text": "Assinar o consórcio logo, já que sem juros ele sai mais barato do que financiar o carro no banco.",
        "type": "partial",
        "icon": "⚠️",
        "feedback": "⚠️ ILUSÃO DO \"SEM JUROS\". Embora não haja taxa de juros nominal, o consórcio cobra taxa de administração, reajuste anual do valor do bem e fundo de reserva. Não é de graça.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Comparar as taxas do consórcio e a espera pelo sorteio com o rendimento de guardar dinheiro todo mês por 3 anos.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ ANÁLISE FINANCEIRA APURADA! Consórcio é uma opção de compra planejada para quem não tem disciplina de poupar sozinho, mas possui custos embutidos. Se você tem 3 anos e disciplina, aplicar o valor mensal trará juros a seu favor.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Pegar um empréstimo pessoal a 5% ao mês e comprar o carro agora, para não pagar 3 anos de taxas.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ ALTISSÍMO CUSTO FINANCEIRO. Pagar 5% ao mês em empréstimo pessoal fará o carro custar mais do que o dobro do preço original.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Entrar no consórcio e dar um lance alto com dinheiro emprestado de um agiota, para pegar o carro logo.",
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
        "text": "Deixar a dívida no cheque especial até o fim do ano e quitar tudo de uma vez quando o 13º salário finalmente cair.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 DESTRUIÇÃO TRIBUTÁRIA E BANCÁRIA. O cheque especial a 8% ao mês dobra a dívida em um prazo curtíssimo. Esperar meses para quitar fará o valor virar uma montanha impagável.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Buscar um empréstimo pessoal ou consignado com juros bem menores e usar o valor para quitar o cheque especial.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ TROCA DE DÍVIDA INTELIGENTE! Quando não é possível quitar a dívida imediatamente, a regra de ouro das finanças é trocar uma dívida de juros astronômicos por uma dívida de juros bem mais baixos e com parcelas fixas.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Sacar dinheiro no caixa eletrônico usando o limite do cartão de crédito para cobrir logo o cheque especial.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ SAQUE NO CRÉDITO = ERRO DUPLO. Saques com cartão de crédito cobram tarifas elevadíssimas e incidem juros desde o dia do saque, piorando a situação.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Abrir conta em outro banco, passar a receber o salário lá e deixar a dívida antiga parada por enquanto.",
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
        "text": "Manter todas as assinaturas, já que cada uma custa só R$ 20 ou R$ 30 e sozinha não faz diferença no mês.",
        "type": "partial",
        "icon": "⚠️",
        "feedback": "⚠️ A ARMADILHA DOS GASTOS FORMIGA. Pequenas despesas recorrentes e invisíveis são as maiores vilãs do orçamento familiar. De R$ 20 em R$ 20, vaza o dinheiro da sua aposentadoria ou do seu investimento.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Cancelar o que não usa, como a academia e os serviços repetidos, e manter só o que usa de verdade.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ LIMPEZA FINANCEIRA PREVENTIVA! Auditar a fatura com frequência e eliminar assinaturas zumbis reverte centenas ou milhares de reais anuais direto para a sua reserva ou investimentos reais.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Cancelar o cartão de crédito em que as assinaturas são cobradas, assim as cobranças param de chegar sozinhas.",
        "type": "partial",
        "icon": "⚠️",
        "feedback": "⚠️ RISCO DE NEGATIVAÇÃO. Cancelar o cartão não cancela o contrato de prestação de serviços. A empresa continuará cobrando a mensalidade e pode negativar seu nome por inadimplência.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Trocar tudo por um pacote maior com mais três plataformas, já que sai mais barato por serviço no fim do mês.",
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
        "text": "Usar os R$ 2.500 numa viagem com os amigos, já que a restituição é um dinheiro extra que não estava no plano.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ EFEITO VISÃO DE CURTO PRAZO. A restituição não é um \"presente\", mas sim a devolução do imposto pago a mais por você ao longo do ano. Queimar esse valor mantendo dívidas ativas é uma falha grave de gestão.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Quitar os R$ 800 do cartão para parar os juros e guardar os R$ 1.700 como início da reserva de emergência.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ PRIORIZAÇÃO FINANCEIRA PERFEITA! Primeiro elimina-se os juros passivos (dívidas), depois constrói-se a proteção futura (reserva). Essa é a receita clássica de estabilização patrimonial.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Dar os R$ 2.500 de entrada num relógio importado parcelado, aproveitando que entrou um dinheiro a mais.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ CRIAÇÃO DE NOVA PASSIVIDADE. Usar um recurso extraordinário para alavancar mais consumo parcelado aumenta a exposição ao risco.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Emprestar os R$ 2.500 a um amigo que vai abrir um quiosque, já que ele promete devolver com lucro depois.",
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
        "text": "Comprar logo no cartão de crédito, antes de o contador zerar, já que um desconto de 50% é muito alto.",
        "type": "partial",
        "icon": "⚠️",
        "feedback": "⚠️ GATILHO MENTAL DA ESCASSEZ. Marketing digital utiliza contadores falsos de urgência para desativar sua análise racional. O consumidor acaba comprando coisas inúteis que vão parar no fundo da gaveta.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Fechar a página e esperar 24 horas para ver se você precisa mesmo do produto ou se foi só a pressão da oferta.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ DISCIPLINA EMOCIONAL! A regra das 24 horas desativa a impulsividade emocional gerada pelos gatilhos de venda. No dia seguinte, a maioria das pessoas percebe que nem precisava do item.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Comprar 5 unidades com o desconto para revender aos vizinhos pelo preço cheio e lucrar com a diferença.",
        "type": "partial",
        "icon": "⚠️",
        "feedback": "⚠️ EMPREENDEDORISMO SEM PESQUISA. Revender produtos impulsivos sem validação de mercado costuma resultar em estoque parado e prejuízo.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Pedir o cartão da sua mãe emprestado para comprar agora e devolver o dinheiro a ela no mês que vem.",
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
        "text": "Assinar o FIES sem se preocupar com a dívida, já que só começa a pagar depois de formado e com emprego.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 ILUSÃO DO CRÉDITO PÚBLICO. O FIES é um financiamento bancário com cobrança jurídica ativa. O não pagamento gera negativação do seu nome e dos seus fiadores, bloqueando sua vida financeira após o curso.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Ver se o curso dá emprego, calcular a parcela futura e assinar sabendo que é uma dívida real de longo prazo.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ VISÃO DE INVESTIMENTO EM CAPITAL HUMANO! A educação é o melhor investimento no longo prazo, mas exige cálculo de Retorno sobre Investimento (ROI). Entender o FIES como um compromisso sério garante planejamento seguro.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Desistir da faculdade e de qualquer outro curso, para não correr o risco de começar a vida adulta com dívida.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ ESTAGNAÇÃO DE RENDA. Não se capacitar limita a progressão salarial ao longo da vida profissional.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Trancar o curso no último ano e usar o restante do financiamento para viajar, deixando para terminar depois.",
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
        "text": "Fechar com a associação de proteção veicular pelo preço menor, sem pesquisar se ela tem reserva para pagar as indenizações.",
        "type": "partial",
        "icon": "⚠️",
        "feedback": "⚠️ RISCO DE NÃO RECEBIMENTO. Associações de proteção veicular não são seguradoras. Em momentos de grandes crises ou sinistros em massa, muitas não possuem reservas legais para indenizar o associado.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Entender que a seguradora tem reservas fiscalizadas pela SUSEP, e a associação divide prejuízos sem essa garantia.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ ANÁLISE RIGOROSA DE RISCO! Economizar é bom, mas entender a segurança regulatória do mercado de seguros (SUSEP) evita surpresas desagradáveis no momento em que você mais precisa da indenização do seu patrimônio.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Não contratar nenhuma proteção e guardar a diferença por conta própria, mesmo deixando o carro na rua todos os dias.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ EXPOSIÇÃO EXTREMA AO RISCO. Perder um bem de alto valor por roubo sem cobertura pode destruir anos de esforço financeiro.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Contratar o seguro e, se o carro começar a dar muito problema, provocar um acidente para receber o valor da tabela FIPE.",
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
        "text": "Confiar só na aposentadoria do INSS e usar todo o resto do salário no dia a dia, sem guardar nada.",
        "type": "partial",
        "icon": "⚠️",
        "feedback": "⚠️ ILUSÃO DEMOGRÁFICA. O INSS é um sistema de repartição simples. Com o envelhecimento do país, o valor do benefício futuro tende a ser equivalente ao teto mínimo, o que pode derrubar seu padrão de vida na velhice.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Manter a contribuição ao INSS e também começar a investir uma parte do salário pensando na aposentadoria.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ VISÃO DE LONGO PRAZO PERFEITA! Diversificar sua segurança futura construindo patrimônio próprio de longo prazo em ativos indexados à inflação (IPCA+) garante independência financeira real na aposentadoria.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Parar de contribuir para o INSS e guardar o dinheiro em casa, para ter controle total sobre ele por 40 anos.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ EROSÃO MONETÁRIA E DESPROTEÇÃO. O dinheiro no colchão perde todo o valor para a inflação, e a falta de contribuição ao INSS retira direitos a auxílio-doença ou aposentadoria por invalidez.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Aproveitar agora e gastar o salário com festas e viagens, já que a aposentadoria ainda está a 45 anos.",
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
        "text": "Ir na viagem mesmo assim, para não ficar de fora do grupo, e assumir a dívida no cheque especial e nas parcelas.",
        "type": "partial",
        "icon": "⚠️",
        "feedback": "⚠️ DÍVIDA POR STATUS. Viver um padrão de vida que não é o seu para impressionar os outros é uma das causas principais do endividamento da classe média. A viagem dura 3 dias, a dívida e os juros duram mais de um ano.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Dizer com sinceridade que agora não dá, propor um passeio mais barato com o grupo e manter o seu orçamento em dia.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ MATURIDADE E SOBERANIA FINANCEIRA! Dizer \"não\" para gastos que não cabem no seu momento financeiro demonstra inteligência emocional e firmeza de propósitos. Amigos verdadeiros respeitam seus limites.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Ir na viagem e, na hora das contas do grupo, dizer que esqueceu a carteira para os amigos pagarem a sua parte.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ FALTA DE ÉTICA. Transferir seus custos de lazer para terceiros destrói relacionamentos e integridade pessoal.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Vender alguns móveis da casa que quase não usa para conseguir os R$ 2.000 da viagem e pagar tudo à vista.",
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
        "text": "Pegar o empréstimo de R$ 30.000 para a entrada e assumir a parcela de R$ 2.200, pois aluguel é dinheiro jogado fora.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 SOBRE-ENDIVIDAMENTO GRAVE. Pegar empréstimo pessoal (juros altos) para dar entrada em um financiamento longo (mais juros) compromete drasticamente a renda familiar. As chances de inadimplência e perda do imóvel são altíssimas.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Continuar no aluguel de R$ 1.200, juntar a entrada investindo todo mês e só financiar quando a parcela couber.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ PLANEJAMENTO HABITACIONAL INTELIGENTE! Aluguel não é dinheiro jogado fora: é o custo de moradia e flexibilidade enquanto você se estrutura. Juntar a entrada antes de comprar garante taxas menores e paz de espírito.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Assinar o financiamento e deixar de pagar o aluguel e a parcela por alguns meses até a situação melhorar.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ PERDA DO BEM E LEILÃO. A alienação fiduciária permite ao banco leiloar o imóvel rapidamente em caso de não pagamento das parcelas.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Morar num imóvel desocupado sem contrato nem documento, para guardar o dinheiro do aluguel e juntar a entrada.",
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
        "text": "Concluir que o IPCA está errado ou foi manipulado, já que os preços que você vê no mercado subiram bem mais.",
        "type": "partial",
        "icon": "⚠️",
        "feedback": "⚠️ VISÃO SIMPLISTA. O IPCA é medido pelo IBGE com critérios científicos rigorosos em várias capitais, mas mede a média nacional de várias faixas de renda, não o seu consumo individual específico.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Ver que o IPCA é uma média de muitos itens e que sua inflação depende do peso da comida nos seus gastos.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ COMPREENSÃO ECONÔMICA AVANÇADA! Para famílias de menor renda, o peso da alimentação e transporte é proporcionalmente muito maior no orçamento. Por isso, quando a comida sobe, a \"inflação sentida\" é bem maior do que a média geral.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Cobrar do mercado que o feijão suba só 4%, já que esse é o índice oficial que vale para os preços do país.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ DESCONEXÃO DE MERCADO. Mercados repassam preços do atacado e das safras do campo; o índice oficial é uma medição estatística, não um tabelamento de preços de prateleira.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Trocar os alimentos por produtos importados, que não dependem das safras daqui e por isso subiriam menos.",
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
        "text": "Clicar no link do SMS para liberar o saldo, já que a mensagem cita a plataforma onde você anunciou o jogo.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 GOLPE DO FALSO PAGAMENTO / PHISHING! O link do SMS é uma página falsa para roubar seus dados de acesso ao banco e o \"comprovante\" enviado pelo comprador era editado. Você perde o produto e tem a conta invadida.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Ignorar o link e entregar o videogame só depois de ver o PIX já creditado no extrato do seu app do banco.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ SEGURANÇA FINANCEIRA DIGITAL! O PIX caindo na conta real do seu aplicativo bancário oficial é a única prova válida de pagamento. Mensagens de texto, e-mails ou prints de telas podem ser facilmente forjados por criminosos.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Enviar o videogame, pois o comprador mandou print do comprovante e o PIX às vezes demora para aparecer.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ NEGLIGÊNCIA OPERACIONAL. Negócios digitais exigem confirmação estrita de recebimento para evitar fraudes de engenharia social.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Passar sua senha do banco ao comprador para ele conferir o PIX, já que ele diz que só assim o saldo é liberado.",
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
        "text": "Aceitar logo, pois R$ 3.000 é R$ 800 a mais por mês e essa diferença com certeza cobre qualquer gasto extra.",
        "type": "partial",
        "icon": "⚠️",
        "feedback": "⚠️ ILUSÃO DO SALÁRIO NOMINAL. Se o aluguel na capital for o triplo do interior e o transporte custar o dobro, os R$ 3.000 líquidos farão você viver com menos qualidade de vida do que com os R$ 2.200 na sua cidade de origem.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Comparar aluguel, transporte, comida e contas na capital e no interior para ver com qual salário você compra mais.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ COMPARAÇÃO DE PODER DE COMPRA REAL! O que importa na economia familiar é a renda real (quanto o seu dinheiro compra na localidade em que você vive), e não apenas o número estampado no holerite.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Mudar logo e ficar em hotel ou pensão até achar casa, deixando para calcular os gastos quando já estiver lá.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ DESPERDÍCIO DE RECURSOS EM MORADIA TEMPORÁRIA. Hospedagem informal ou hotéis consomem a reserva de mudança em poucas semanas sem planejamento prévio.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Exigir que a empresa compre uma casa no seu nome na capital, já que o aluguel lá deve ser bem mais caro.",
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
        "text": "Ficar no plano de R$ 90, porque pagar R$ 300 de multa de uma vez parece um prejuízo maior que a economia.",
        "type": "partial",
        "icon": "⚠️",
        "feedback": "⚠️ INÉRCIA FINANCEIRA. Medo de multas operacionais pontuais muitas vezes faz o consumidor continuar pagando serviços superfaturados no longo prazo.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Ver que a troca economiza R$ 50 por mês: em 6 meses isso paga a multa de R$ 300 e depois vira lucro.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ ANÁLISE DE PAYBACK / RETORNO DE INVESTIMENTO! Calcular o tempo necessário para recuperar o custo do cancelamento (Payback) é a forma técnica correta de tomar decisões de corte de custos recorrentes.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Trocar de operadora e não pagar a última fatura com a multa, já que você nem vai mais usar aquele plano.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ INADIMPLÊNCIA CONTRATUAL. As multas de fidelidade são legalmente amparadas pela Anatel se previstas em contrato. O não pagamento gera cobrança judicial e negativação do CPF.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Cancelar o plano e usar só Wi-Fi grátis da praça e da escola, sem pagar nem multa nem mensalidade.",
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
        "text": "Considerar o ano um sucesso e manter a mesma rotina, já que o mais importante é não ter ficado no vermelho nenhum mês.",
        "type": "partial",
        "icon": "⚠️",
        "feedback": "⚠️ ZONA DE PERIGO. Empatar o orçamento significa que você não está construindo reserva nem gerando patrimônio. Qualquer emergência no ano seguinte jogará seu saldo no negativo.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Ver que o saldo zero deixa você sem proteção para imprevistos e definir a meta de guardar de 10% a 20% da renda.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ MINDSET DE CONSTRUÇÃO DE PATRIMÔNIO! O verdadeiro sucesso financeiro não é apenas zerar as dívidas, mas sim conseguir gerar superávit (sobra de caixa) recorrente para construir sua independência e segurança no futuro.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Pegar um empréstimo no início do ano para ter uma folga no orçamento, já que você provou que consegue pagar as contas.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 RETROCESSO ORÇAMENTÁRIO. Voltar a se endividar sem necessidade destrói todo o avanço de disciplina conquistado no período.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Parar de anotar os gastos, já que você conseguiu fechar o ano no zero e agora já sabe controlar tudo só de cabeça.",
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
        "text": "Explicar que a maior parte vem de doações e patrocínios de empresas da cidade, que ajudam a manter esses serviços públicos.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ DESINFORMAÇÃO SOBRE A MÁQUINA PÚBLICA. Ilude o cidadão sobre a origem dos recursos. A prefeitura não vive de doações voluntárias, mas da arrecadação compulsória de tributos.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Explicar que nada é grátis: os impostos pagos pela população, como IPTU e ISS, pagam médicos, professores e merenda.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ CONSCIÊNCIA CIDADÃ E FUNÇÃO SOCIAL DOS TRIBUTOS! Os impostos são o investimento coletivo da sociedade. Compreender isso faz o cidadão valorizar e fiscalizar a qualidade das escolas e hospitais.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Dizer que a prefeitura pode emitir dinheiro próprio quando falta verba para pagar as contas da cidade.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 IMPOSSIBILIDADE ECONÔMICA E CRIME. Municípios não têm soberania monetária para emitir moeda, e a emissão desenfreada de dinheiro gera hiperinflação.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Dizer que saúde e educação são pagas só com dinheiro que vem de fora, como ajuda de outros países e bancos.",
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
        "text": "Dar os 10% de reajuste, pois os servidores merecem e o limite da lei pode ser ajustado no ano que vem.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 CRIME DE RESPONSABILIDADE FISCAL. Ultrapassar o limite da LRF gera rejeição de contas pelo Tribunal de Contas, ineligibilidade do prefeito e bloqueio de repasses federais.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Negar o reajuste acima do limite da lei, explicar a trava aos sindicatos e cortar cargos comissionados.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ RESPONSABILIDADE E LEGALIDADE! Respeitar a LRF preserva as contas da cidade, garante que os salários continuem sendo pagos em dia no futuro e evita sanções jurídicas graves.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Dar o reajuste e cortar gastos de luz e manutenção dos hospitais para compensar o aumento da folha.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ SUCATEAMENTO DE SERVIÇOS ESSENCIAIS. Desviar verbas de custeio da saúde para gastos com pessoal desestrutura o atendimento básico à população.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Deixar parte da folha fora dos relatórios para que o limite só apareça estourado depois da eleição.",
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
        "text": "Criar a taxa de coleta de lixo, com valor proporcional ao imóvel e ao volume gerado, liberando o dinheiro da saúde.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ SUSTENTABILIDADE E LEGALIDADE! Taxas são tributos vinculados a um serviço específico. Cobrar a taxa de lixo cumpre a lei federal e devolve verbas essenciais para a saúde pública.",
        "points": 10
      },
      {
        "origLabel": "B",
        "text": "Manter tudo como está e seguir usando a verba da saúde nos caminhões, já que cobrar uma taxa nova tira votos da gestão.",
        "type": "partial",
        "icon": "⚠️",
        "feedback": "⚠️ RENÚNCIA DE RECEITA ILEGAL. Descumprir o Marco do Saneamento configura renúncia de receita não planejada, podendo gerar punições ao gestor pelo Tribunal de Contas.",
        "points": 0
      },
      {
        "origLabel": "C",
        "text": "Reduzir a coleta para uma vez por semana e orientar os moradores a queimar o lixo seco em casa para economizar.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 CATASTROFE SANITÁRIA E AMBIENTAL. Queimar lixo causa doenças respiratórias graves, poluição do ar e epidemias na cidade.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Criar uma taxa de lixo com valor igual para todos, de grandes empresas a famílias pobres, por ser mais simples.",
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
        "text": "Aceitar e baixar o ISS para 1%, já que 500 empregos valem mais que seguir à risca o mínimo da lei federal.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 IMPROBIDADE FISCAL (GUERRA FISCAL). Conceder ISS abaixo do piso constitucional de 2% é ato de improbidade administrativa e anula o benefício fiscal.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Oferecer o ISS no mínimo legal de 2% e mostrar, como exige a LRF, o impacto disso nas contas da cidade.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ DESENVOLVIMENTO ECONÔMICO LEGAL! Reduzir para o limite permitido de 2% atrai a empresa de forma segura, gera empregos e cumpre as exigências legais da LRF.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Recusar a proposta e subir o ISS da empresa para 5%, para mostrar que a cidade não aceita ser pressionada.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ PERDA DE INVESTIMENTO. Aumentar o tributo afugenta empresas para cidades vizinhas, gerando desemprego local.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Cobrar 0% de ISS no papel e combinar com a empresa um pagamento extra por fora direto para a prefeitura.",
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
        "text": "Aplicar os 3% que faltam em livros, reforma de escolas e formação de professores antes de o ano fiscal acabar.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ CUMPRIMENTO CONSTITUCIONAL! Aplicar os 25% obrigatórios valoriza a rede pública de ensino e evita a rejeição das contas anuais pelo Tribunal de Contas.",
        "points": 10
      },
      {
        "origLabel": "B",
        "text": "Gastar o que falta na festa de fim de ano da prefeitura, já que ela também recebe alunos da rede.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 DESVIO DE FINALIDADE. Usar verba vinculada à educação em eventos festivos é ilegal e acarreta crime de responsabilidade.",
        "points": 0
      },
      {
        "origLabel": "C",
        "text": "Registrar como gasto em educação despesas de outras áreas, como obras de rua perto das escolas, para fechar 25%.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 CRIME DE FALSIDADE IDEOLÓGICA. Fraudar relatórios orçamentários leva à cassação do mandato.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Pedir ao governo federal para cumprir o limite só no ano que vem, já que agora falta pouco para os 25%.",
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
        "text": "Comprar tudo da multinacional, porque o desconto permite servir mais refeições com o mesmo dinheiro.",
        "type": "partial",
        "icon": "⚠️",
        "feedback": "⚠️ VIOLAÇÃO DO PNAE E MÁ NUTRIÇÃO. Descumprir a cota da agricultura familiar fere a legislação federal e oferece ultraprocessados de menor valor nutricional aos alunos.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Comprar ao menos 30% de agricultores familiares da região e licitar o resto, unindo comida fresca e renda local.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ DESENVOLVIMENTO LOCAL E SAÚDE! A compra da agricultura familiar movimenta a economia do campo na cidade, gera renda para os agricultores e oferece comida fresca nas escolas.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Reduzir a merenda a um lanche simples e pedir que as famílias mandem o resto da comida de casa.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ DESERÇÃO SOCIAL. A merenda escolar é a principal refeição do dia para milhares de crianças vulneráveis.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Comprar direto de parentes do prefeito que são agricultores locais, sem licitação, para cumprir a cota.",
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
        "text": "Usar o saldo da COSIP para asfaltar ruas, já que asfalto e iluminação são obras que melhoram o bairro.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 DESVIO DE VINCULAÇÃO TRIBUTÁRIA. A COSIP é tributo com destinação vinculada por lei. Gastar em asfalto é desvio de finalidade.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Usar o saldo da COSIP só para ampliar a iluminação com lâmpadas LED nos bairros que estão no escuro.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ USO CORRETO DA VINCULAÇÃO! A iluminação de LED economiza energia futura, melhora a segurança e aplica a verba exatamente na finalidade para a qual foi cobrada do cidadão.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Deixar o dinheiro aplicado no banco rendendo juros, para ter uma reserva maior caso surja uma emergência.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ APATIA ADMINISTRATIVA. Manter verbas carimbadas paradas enquanto a população sofre com a falta do serviço é má gestão.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Usar a sobra da COSIP para pagar médicos do posto, já que a saúde é mais urgente que a luz da rua.",
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
        "text": "Autorizar a passagem de R$ 6,00, já que o combustível subiu de verdade e a empresa precisa cobrir esse custo.",
        "type": "partial",
        "icon": "⚠️",
        "feedback": "⚠️ IMPACTO SOCIAL NEGATIVO. Um aumento abrupto reduz o acesso ao transporte e aumenta a inadimplência e o desemprego na cidade.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Subsidiar a tarifa para mantê-la em R$ 4,50, exigindo da empresa frota nova e horários cumpridos.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ EQUILÍBRIO SOCIAL E CONTRATUAL! O subsídio do transporte garante a mobilidade urbana dos mais pobres usando a arrecadação geral de impostos para baratear um serviço essencial.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Romper o contrato com a empresa de ônibus e deixar que vans e aplicativos atendam a população sozinhos.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 COLAPSO URBANO. Cancelar o transporte público paralisa a economia municipal e o acesso a escolas e hospitais.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Fixar por decreto um preço máximo para o diesel nos postos da cidade, para baixar o custo da empresa.",
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
        "text": "Manter a tabela antiga por mais um tempo, para evitar briga com proprietários e possíveis ações na Justiça.",
        "type": "partial",
        "icon": "⚠️",
        "feedback": "⚠️ JUSTIÇA FISCAL PREJUDICADA. Manter a tabela defasada faz a prefeitura arrecadar pouco e perpetua privilégios para quem tem maior capacidade contributiva.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Mandar à Câmara um projeto que atualize a tabela de valores, para que imóveis caros paguem um IPTU justo.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ EQUIDADE E CORREÇÃO HISTÓRICA! Atualizar a PGV faz com que a cobrança reflita a realidade do mercado imobiliário, promovendo justiça fiscal e aumentando a arrecadação de forma progressiva.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Aumentar o IPTU de todos os bairros no mesmo percentual, inclusive da periferia, para compensar a perda.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ TRIBUTAÇÃO REGRESSIVA E INJUSTA. Penalizar a periferia viola frontalmente o princípio da capacidade contributiva.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Zerar o IPTU de toda a cidade, já que a cobrança está injusta, e decidir depois como repor o dinheiro.",
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
        "text": "Construir o hospital de alta complexidade, mesmo que as UBS fiquem sem remédios e médicos por um tempo.",
        "type": "partial",
        "icon": "⚠️",
        "feedback": "⚠️ DESVIAMENTO DE COMPETÊNCIA SUS. O município assume uma conta gigante de média/alta complexidade que não consegue manter, enquanto a prevenção primária colapsa.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Fortalecer primeiro as UBS da Atenção Básica e combinar com o governo do estado o atendimento de alta complexidade.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ GESTÃO EFICIENTE DO SUS! A Atenção Básica resolve até 80% dos problemas de saúde da população a um custo muito menor, evitando que as pessoas adoeçam gravemente.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Fechar os postos de saúde e contratar uma empresa privada para cuidar de toda a saúde pública da cidade.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ VIOLAÇÃO DO DIREITO À SAÚDE. Privatizar sem rede pública de proteção deixa a população de baixa renda sem qualquer atendimento.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Usar parte da verba da saúde para construir um estádio, já que esporte também ajuda a prevenir doenças.",
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
        "text": "Negar o pedido e colocar sigilo nas contas, já que os dados podem ser usados por adversários políticos.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 VIOLAÇÃO DA LAI E DA LRF. Esconder contas públicas fere a Lei de Acesso à Informação e a Lei de Responsabilidade Fiscal, gerando punição ao gestor.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Manter o Portal da Transparência atualizado, com cada real arrecadado e as notas fiscais de cada gasto.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ CONTROLE SOCIAL E TRANSPARÊNCIA! O dinheiro do imposto pertence ao povo. Mostrar como ele é aplicado fortalece a confiança entre cidadão e governo.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Mostrar os gastos só aos vereadores aliados, que depois repassam à população o que acharem importante.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ QUEBRA DA IMPESSOALIDADE. A informação sobre dinheiro público é um direito universal de todos os cidadãos, sem distinção.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Publicar no site números ajustados que façam os gastos parecerem menores, para evitar críticas dos moradores.",
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
        "text": "Usar o aumento da arrecadação para construir duas creches e contratar educadores por concurso público.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ PRIORIZAÇÃO DA PRIMEIRA INFÂNCIA! Investir impostos em creches atende o direito constitucional da criança, permite que as mães trabalhem e gerem renda, e reduz a desigualdade social.",
        "points": 10
      },
      {
        "origLabel": "B",
        "text": "Usar o dinheiro extra para renovar os carros oficiais e pagar o combustível da frota do gabinete do prefeito.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ INVERSÃO DE PRIORIDADES. Queimar recursos públicos com regalias da alta burocracia prejudica a prestação de serviços essenciais.",
        "points": 0
      },
      {
        "origLabel": "C",
        "text": "Dizer às mães que creche não é dever da prefeitura e que cada família deve achar quem cuide das crianças.",
        "type": "partial",
        "icon": "⚠️",
        "feedback": "⚠️ OMISSÃO DE DEVER CONSTITUCIONAL. A Educação Infantil (creches e pré-escolas) é responsabilidade prioritária dos municípios segundo a Constituição.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Gastar o dinheiro extra em uma grande festa de aniversário da cidade, com shows e fogos de artifício para todos.",
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
        "text": "Usar recursos do Fundeb e dos impostos ligados à educação para comprar ônibus escolares novos e seguros.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ ACESSO À EDUCAÇÃO E DIGNIDADE! O imposto arrecadado garante que o direito à escola seja uma realidade para todos os estudantes, inclusive os mais distantes da área urbana.",
        "points": 10
      },
      {
        "origLabel": "B",
        "text": "Pedir aos pais uma mensalidade pequena para consertar os ônibus, já que o benefício é direto para os filhos.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 COBRANÇA ILEGAL. A Constituição proíbe qualquer cobrança de mensalidade ou taxa para acesso ao ensino público fundamental.",
        "points": 0
      },
      {
        "origLabel": "C",
        "text": "Fechar as turmas da zona rural e mandar os alunos estudarem a distância, para economizar com transporte.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 VIOLAÇÃO DE DIREITO FUNDAMENTAL. Fechar escolas rurais nega o direito básico à educação e estimula o êxodo rural desordenado.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Dar um vale para as famílias comprarem bicicletas, já que é mais barato do que comprar ônibus novos.",
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
        "text": "Pagar agentes, equipamentos e inseticidas com o orçamento da Saúde, que recebe impostos locais e verba do SUS.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ SAÚDE PREVENTIVA E PROTEÇÃO COLETIVA! Investir impostos na prevenção de epidemias custa muito mais barato do que tratar pacientes internados nos hospitais depois.",
        "points": 10
      },
      {
        "origLabel": "B",
        "text": "Cobrar uma taxa de R$ 50 de cada casa vistoriada, já que o morador é quem se beneficia da visita do agente.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ DESESTÍMULO À FISCALIZAÇÃO. Cobrar taxas por vistoria sanitária faz as pessoas trancarem as portas para os agentes, agravando a epidemia.",
        "points": 0
      },
      {
        "origLabel": "C",
        "text": "Fazer campanhas pedindo que cada morador cuide do próprio quintal, sem gastar com agentes e inseticidas.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 OMISSÃO DE SAÚDE PÚBLICA. O combate a vetores de doenças transmissíveis é um dever do Estado e da vigilância epidemiológica municipal.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Usar a verba da vigilância para patrocinar um time de futebol que faça campanha contra a dengue.",
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
        "text": "Negar o pedido e colocar sigilo de 10 anos, alegando que salários são informação pessoal dos servidores.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 VIOLAÇÃO DA LAI E IMPROBIDADE. Negar informações de interesse público gera sanções dos órgãos de controle e denúncia no Ministério Público.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Cumprir a Lei de Acesso à Informação e pôr no portal os salários e as diárias do prefeito e secretários.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ TRANSPARÊNCIA E CIDADANIA! O dinheiro público deve ser auditável pelo cidadão. A transparência previne a corrupção e fortalece a gestão.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Divulgar só os dados de quem é da oposição, já que foram eles que levantaram dúvidas sobre os gastos.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ USO POLÍTICO DA MÁQUINA. Tratar a informação pública com parcialidade viola o princípio constitucional da Impessoalidade.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Tirar o Portal da Transparência do ar por um tempo, alegando manutenção, até os pedidos pararem de chegar.",
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
        "text": "Usar a verba de obras do orçamento anual para levar rede de esgoto aos bairros que ainda não têm.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ INTEGRAÇÃO ENTRE SANEAMENTO E SAÚDE! Aplicar o dinheiro dos impostos em saneamento evita que crianças adoeçam, esvazia os leitos dos hospitais públicos e traz eficiência ao gasto.",
        "points": 10
      },
      {
        "origLabel": "B",
        "text": "Priorizar a reforma do portal e da praça da entrada da cidade, que atraem turistas, e deixar o esgoto para depois.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ FALTA DE PRIORIDADE SOCIAL. Gastar com obras puramente estéticas enquanto crianças pisam em esgoto a céu aberto é uma péssima escolha de gestão.",
        "points": 0
      },
      {
        "origLabel": "C",
        "text": "Reforçar a verba dos hospitais, já que o problema é de saúde, e tratar o esgoto como um assunto separado, só de obras.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ CEGUEIRA CIENTÍFICA. O saneamento básico é comprovadamente o maior fator de prevenção de doenças infectocontagiosas do mundo.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Instalar fossas improvisadas e ligar o esgoto ao córrego mais próximo, que é a solução mais barata e mais rápida.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 CRIME AMBIENTAL E DE SAÚDE PÚBLICA. Despejar esgoto sem tratamento contamina a água e causa epidemias graves.",
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
        "text": "Fazer a Regularização Fundiária e entregar a escritura aos moradores, que passam a ter acesso a crédito.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ CIDADANIA E VALORIZAÇÃO PATRIMONIAL! A regularização fundiária transforma posse informal em propriedade legal, integrando o bairro à cidade formal e dando dignidade às famílias.",
        "points": 10
      },
      {
        "origLabel": "B",
        "text": "Remover as famílias para um conjunto habitacional distante e liberar a área, já que a ocupação é irregular.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 VIOLAÇÃO DE DIREITOS HUMANOS. Ações truculentas de despejo violam o direito à moradia digna garantido pela Constituição.",
        "points": 0
      },
      {
        "origLabel": "C",
        "text": "Exigir que cada família pague os 20 anos de IPTU atrasado, com juros, antes de receber a escritura.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ INVIABILIDADE SOCIAL. Punir moradores vulneráveis impede a regularização e perpetua a informalidade urbana.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Vender a área para uma construtora que prometa obras no bairro e usar o dinheiro em outras melhorias da cidade.",
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
        "text": "Proibir a feira na praça para não prejudicar o comércio formal, que paga impostos, e manter a fiscalização.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ REPRESSÃO AO PEQUENO EMPREENDEDOR. Bloquear o uso do espaço público destrói a renda de famílias vulneráveis sem apresentar alternativas.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Regulamentar a feira, dar estrutura básica como barracas, luz e banheiros, e ajudar os feirantes a virarem MEI.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ FOMENTO À ECONOMIA LOCAL E CULTURA! Apoiar feiras nos bairros gera renda, movimenta o comércio comunitário, ocupa os espaços públicos com segurança e formaliza trabalhadores.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Ceder a praça a uma grande rede de supermercados, que paga aluguel à prefeitura e gera empregos.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ DESVALORIZAÇÃO COMUNITÁRIA. Privatizar praças públicas para grandes grupos empresariais retira o espaço de lazer dos moradores.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Liberar a feira só para quem pagar uma taxa por fora ao fiscal, para agilizar a autorização.",
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
        "text": "Perdoar a dívida dos grandes devedores para que eles continuem investindo e gerando empregos na cidade.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 RENÚNCIA ILEGAL E INCENTIVO À SONEGAÇÃO. Perdoar dívidas sem amparo legal e compensação orçamentária é infração grave à LRF.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Protestar em cartório e cobrar na Justiça os grandes devedores, usando o dinheiro recuperado na cidade.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ JUSTIÇA FISCAL E RECUPERAÇÃO DE RECEITA! Cobrar a dívida ativa traz recursos limpos ao caixa da prefeitura sem ter que aumentar impostos para o cidadão pagador.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Começar cobrando os pequenos devedores, que são mais fáceis de achar, e deixar os grandes para depois.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ INVERSÃO DA PRIORIDADE DE COBRANÇA. O custo administrativo de cobrar minidívidas costuma ser maior que o valor arrecadado, enquanto grandes devedores continuam impunes.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Vender a lista de devedores a empresas de cobrança, sem processo público, para receber o dinheiro mais rápido.",
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
        "text": "Criar a Ronda Escolar da Guarda Municipal, com patrulha nos fins de semana e alarmes nas escolas.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ PROTEÇÃO DO PATRIMÔNIO PÚBLICO! A função constitucional primária da Guarda Municipal é proteger os bens, serviços e instalações do município, preservando o investimento do contribuinte.",
        "points": 10
      },
      {
        "origLabel": "B",
        "text": "Deslocar a Guarda para fazer a segurança pessoal do prefeito e da família dele, alegando que ele recebe ameaças.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 DESVIO DE FINALIDADE E IMPROBIDADE. Utilizar agentes públicos de segurança para fins pessoais é ato gravíssimo de improbidade administrativa.",
        "points": 0
      },
      {
        "origLabel": "C",
        "text": "Pedir que professores e funcionários se revezem como vigias nos fins de semana, para não gastar com guardas.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ DESVIO DE FUNÇÃO LABORAL. Professores são contratados para lecionar, não para exercer vigilância patrimonial.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Vender os computadores das escolas e usar o dinheiro em outra área, já que o risco de roubo é muito alto.",
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
        "text": "Orientar os pacientes a buscar atendimento sozinhos na capital, a 500 km, já que a cidade não pode pagar.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ DESAMPARO SOCIAL. Abandona o cidadão à própria sorte em momentos de grave necessidade médica.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Criar um consórcio com 5 cidades vizinhas, somando parte dos impostos de cada uma para pagar especialistas.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ EFICIÊNCIA E COOPERAÇÃO INTERFEDERATIVA! Os consórcios públicos otimizam o dinheiro dos impostos de cidades pequenas, permitindo contratar serviços que sozinhos não conseguiriam pagar.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Aceitar que cidade pequena não consegue ter especialista e focar só no atendimento básico do posto.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ VIOLAÇÃO DA UNIVERSALIDADE DO SUS. O direito à saúde é garantido a todo cidadão brasileiro, independentemente do tamanho do município onde ele mora.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Contratar um profissional sem registro no CRM, que cobra bem menos, para atender como especialista na cidade.",
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
        "text": "Criar uma Taxa de Coleta de Lixo ligada só ao custo desse serviço, mostrando ao morador quanto custa limpar a cidade.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ RIGOR CONCEITUAL E FISCAL! As Taxas servem exatamente para remunerar serviços públicos específicos e divisíveis prestados ao contribuinte.",
        "points": 10
      },
      {
        "origLabel": "B",
        "text": "Criar um imposto do lixo e usar a parte que sobrar em outras áreas, como as festas e eventos da cidade.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 ILEGALIDADE TRIBUTÁRIA. Impostos não podem ter sua receita vinculada a órgãos ou serviços específicos salvo exceções da Constituição (como Saúde e Educação).",
        "points": 0
      },
      {
        "origLabel": "C",
        "text": "Cobrar a mesma taxa de lixo de todos, até de quem mora onde o caminhão não passa, para ser justo.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 COBRANÇAINDEVIDA. A taxa exige a prestação efetiva ou potencial do serviço ao contribuinte. Cobrar sem disponibilizar o serviço é ilegal.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Pagar a coleta com o IPTU sem detalhar o custo, já que o lixo é um serviço barato que quase não pesa no caixa.",
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
        "text": "Construir 10 escolas novas de uma vez, que dão visibilidade à gestão, e só depois ver como pagar os professores que vão trabalhar nelas.",
        "type": "partial",
        "icon": "⚠️",
        "feedback": "⚠️ \"ELEFANTES BRANCOS\". Prédios públicos bonitos mas vazios sem profissionais dentro não atendem a população e desperdiçam o dinheiro dos impostos.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Planejar cada nova escola ou posto já com dinheiro reservado no orçamento para pagar, todo mês, o salário de quem vai trabalhar lá.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ RESPONSABILIDADE FISCAL E PLANEJAMENTO! O bom prefeito calcula não apenas o custo de construir a obra, mas a despesa continuada de manter o serviço funcionando.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Contratar professores e médicos e pagar parte dos salários com vales e fichas da prefeitura, para economizar dinheiro em caixa.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 VIOLAÇÃO DAS LEIS TRABALHISTAS E CONSTITUIÇÃO. O pagamento de servidores deve ser feito obrigatoriamente em moeda corrente nacional.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Atrasar o salário dos professores por alguns meses para concluir obras maiores, que deixam algo duradouro para a cidade.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 CRIME E INADIMPLÊNCIA. Deixar de pagar servidores para priorizar outros gastos é causa imediata de intervenção e processo crime.",
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
        "text": "Manter os shows de R$ 2 milhões, que atraem turistas e movimentam o comércio, e consertar as ambulâncias depois.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 MORALIDADE PÚBLICA VIOLADA. Gastar milhões em festas enquanto pacientes sofrem por falta de socorro básico fere a razoabilidade e pode ser suspenso pela Justiça.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Fazer uma festa menor com artistas locais e usar a maior parte da verba em ambulâncias e remédios.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ PRIORIZAÇÃO RESPONSÁVEL DO DINHEIRO PÚBLICO! Celebrar a cultura local prestigiando artistas da terra economiza recursos e atende a emergência vital da saúde.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Fazer um empréstimo de longo prazo para pagar os shows, mantendo a tradição sem tirar verba da saúde.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ EQUALIZAÇÃO IRRESPONSÁVEL. Endividar o município por consumo fútil passageiro compromete gestões futuras.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Atrasar o salário dos professores por um mês para pagar o palco, já que a festa só acontece uma vez por ano.",
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
        "text": "Começar várias obras grandes nos últimos meses, mesmo sem dinheiro em caixa, já que o próximo prefeito poderá terminar de pagar.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 VIOLAÇÃO DO ARTIGO 42 DA LRF. Deixar dívidas sem cobertura financeira ao final do mandato é infração grave com punição de inelegibilidade e sanções penais.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Fechar o mandato garantindo que toda despesa contratada esteja paga ou tenha dinheiro reservado em caixa para ser quitada.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ ESTADISTA E RESPONSABILIDADE FISCAL! Cumprir as regras de transição de mandato e equilíbrio de caixa garante a continuidade dos serviços prestados e consolida boa reputação.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Descartar arquivos e notas antigas da prefeitura antes da troca de prefeito, alegando falta de espaço para guardar tudo.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 CRIME DE DESTRUIÇÃO DE DOCUMENTO PÚBLICO. Ocultar ou destruir acervo documental inviabiliza a auditoria e resulta em prisão.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Transferir o saldo do caixa para contas próprias antes de sair do cargo, como pagamento por serviços que julga ter prestado.",
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
        "text": "Ver a inflação como algo bom, já que preços maiores aumentam o faturamento das empresas e, com isso, a arrecadação.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ DESCONEXÃO SOCIAL E ECONÔMICA. Inflação descontrolada desorganiza o planejamento das empresas, reduz investimentos e destrói o poder de compra da população.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Ver a inflação como um imposto invisível que reduz o poder de compra e pesa mais nas famílias pobres, que gastam quase tudo em comida.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ VISÃO DIAGNÓSTICA PRECISA! A inflação penaliza desproporcionalmente os mais pobres, pois eles não possuem mecanismos de proteção financeira. O combate à inflação é essencial para a estabilidade social.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Considerar que o trabalhador pode se proteger sozinho, trocando o arroz, o feijão e a carne por marcas e produtos mais baratos.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 NEGAÇÃO DA REALIDADE. A alimentação é um item de consumo insubstituível e diário; ignorar esse impacto demonstra desconhecimento da cesta de consumo básica.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Concluir que a culpa é dos consumidores, que fazem compras em excesso no início do mês e empurram os preços para cima.",
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
        "text": "Baixar os juros para facilitar o crédito, para as empresas produzirem mais e os preços caírem.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 AGRAVAMENTO DA INFLAÇÃO. Baixar juros com a demanda já aquecida injeta mais crédito na economia, fazendo os preços subirem ainda mais rápido.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Subir a Selic, a taxa básica de juros, para encarecer o crédito, frear o consumo e segurar os preços.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ MANEJO DA POLÍTICA MONETÁRIA! O aumento da taxa de juros encarece o financiamento e incentiva a poupança, desacelerando a demanda agregada para trazer a inflação de volta à meta.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Congelar por decreto os preços dos produtos da cesta básica e multar os mercados que aumentarem.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 FRACASSO HISTÓRICO (CONGELAMENTO DE PREÇOS). O controle artificial de preços gera desabastecimento, filas, mercado negro e escassez de produtos nas prateleiras.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Imprimir mais dinheiro e distribuir às famílias, para que a renda volte a acompanhar a subida dos preços.",
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
        "text": "Entender os juros altos como remédio amargo e temporário: freiam a economia agora para evitar inflação fora de controle.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ EQUILÍBRIO MACROECONÔMICO! O manejo da Selic envolve um \"trade-off\" (compensação): juros altos freiam a inflação, mas custam dinamismo econômico. O objetivo é calibrar a taxa para retornar ao crescimento sustentável.",
        "points": 10
      },
      {
        "origLabel": "B",
        "text": "Manter os juros no nível máximo por tempo indeterminado, mesmo com a inflação caindo, para garantir que ela não volte mais.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ ESTAGNAÇÃO PROLONGADA. Manter juros excessivamente altos sem necessidade inflacionária sufoca o investimento produtivo, a geração de empregos e arrecadação do país.",
        "points": 0
      },
      {
        "origLabel": "C",
        "text": "Concluir que a falta de crédito para as fábricas não tem relação com os juros, e sim com o excesso de cautela dos bancos.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ ERRO CONCEITUAL. A taxa Selic é a referência básica para o custo de capital de toda a economia, impactando diretamente o crédito bancário.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Tratar o desemprego e o crédito caro como problema das empresas, já que a única tarefa do Ministério é controlar os preços.",
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
        "text": "Superávit primário: o governo fechou o ano com dinheiro sobrando para pagar contas sem fazer novas dívidas.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ DIAGNÓSTICO INVERTIDO. Quando a despesa supera a receita, o resultado é negativo (déficit), e não positivo (superávit).",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Déficit fiscal: o governo gastou mais do que arrecadou e precisa pegar empréstimo, aumentando a dívida.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ CONCEITO FUNDAMENTAL DE CONTAS PÚBLICAS! O déficit ocorre quando os gastos superam as receitas. Para cobrir essa diferença, o governo precisa emitir títulos da dívida, elevando seu endividamento.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Equilíbrio orçamentário: a diferença é pequena perto do total, então gastos e receitas se compensam.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ ERRO DE CÁLCULO. Há uma diferença real de R$ 200 bilhões entre a receita e a despesa.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Lucro nacional: o resultado mostra que o país ganhou dinheiro e pode devolver parte dele à população.",
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
        "text": "Os investidores vão cobrar juros menores, pois um país muito endividado precisa de ajuda para pagar.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ INVERSÃO DA LOGICA DE RISCO. Quanto maior a incerteza sobre a capacidade de pagamento do devedor, maior é o risco exigido pelos credores.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Os investidores vão cobrar juros mais altos para emprestar ao país, o real perde valor e o dinheiro vai embora.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ PRÊMIO DE RISCO E PERDA DE CREDIBILIDADE! A percepção de risco fiscal força o governo a pagar juros mais altos em seus títulos, elevando o custo da dívida e desvalorizando o câmbio.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "A dívida deixa de crescer sozinha ao chegar a 100% do PIB, porque existe um limite legal para ela.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 ILUSÃO FISCAL. A dívida não expira por atingir um limite; se não for gerida, pode resultar em calote (default) ou crise inflacionária.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Outros países ou organismos internacionais vão assumir a dívida para evitar uma crise na região.",
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
        "text": "O pão e a gasolina sobem, porque o Brasil importa trigo e petróleo cotados em dólar, e isso puxa a inflação.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ IMPACTO DO CÂMBIO NA INFLAÇÃO! A desvalorização cambial encarece insumos e produtos importados (commodities, fertilizantes, trigo, eletrônicos), repassando custos para os preços finais.",
        "points": 10
      },
      {
        "origLabel": "B",
        "text": "Os importados ficam mais baratos, porque com o dólar em alta os vendedores estrangeiros baixam seus preços.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ INVERSÃO CAMBIAL. Se o Dólar fica mais caro frente ao Real, comprar produtos cotados em moeda estrangeira custa mais reais, e não menos.",
        "points": 0
      },
      {
        "origLabel": "C",
        "text": "Só os produtos importados mudam de preço; o que é feito aqui dentro continua com o mesmo preço de antes da alta.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ DESCONEXÃO COM A CADEIA GLOBAL. A economia moderna é interligada; componentes, energia e grãos são cotados internacionalmente.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "As viagens ao exterior ficam mais baratas, porque cada real passa a comprar mais coisas lá fora.",
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
        "text": "As exportações ficam mais competitivas, porque o real forte dá mais valor aos produtos brasileiros vendidos no exterior.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ ERRO DE COMPETITIVIDADE. Se a moeda local se valoriza, o produto nacional fica mais caro em moeda estrangeira, reduzindo sua atratividade de preço fora.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "As exportações perdem competitividade no preço e a indústria nacional passa a concorrer com importados mais baratos.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ EFEITO DÚPLO DO CÂMBIO VALORIZADO! Moeda forte ajuda a conter a inflação e barateia importações, mas reduz a margem de lucro de exportadores e expõe a indústria local à concorrência externa.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Os produtores rurais recebem mais reais por tonelada de soja vendida, já que a moeda brasileira passou a valer bem mais.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ CÁLCULO INVERSO. Ao converter a receita em dólares para a moeda local valorizada, o exportador recebe menos reais por unidade vendida.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "O volume exportado aumenta, porque um real mais forte mostra aos compradores estrangeiros que o país está mais confiável.",
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
        "text": "O PIB mede quanto dinheiro o governo federal conseguiu guardar em caixa no fim de cada ano.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ CONFUSÃO CONCEITUAL. O PIB não é o caixa do governo, mas a medida da produção total gerada por empresas, trabalhadores e governo no país.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "O PIB soma todos os bens e serviços finais produzidos no país em um período e mostra o ritmo da economia.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ DEFINIÇÃO DE CONTABILIDADE NACIONAL! O PIB reflete o valor adicionado por todos os setores (agropecuária, indústria e serviços), servindo como termômetro da atividade econômica nacional.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "O PIB mede o valor de tudo o que é vendido no país, incluindo casas, carros e objetos usados.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ ABRANGÊNCIA INCORRETA. O PIB abrange a produção nova de bens e serviços finais, e não a revenda de bens usados.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "O PIB mostra o total de impostos pagos pelas empresas no ano, por isso cresce quando a arrecadação aumenta.",
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
        "text": "Proibir o governo de aumentar qualquer gasto, inclusive com saúde e educação, em qualquer situação.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ INTERPRETAÇÃO EXTREMA. Regras fiscais buscam impor limites e priorização ao crescimento do gasto, não paralisar o funcionamento básico do Estado.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Mostrar ao mercado que as contas são previsíveis e que a dívida pública fica sob controle no longo prazo.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ ANCORE ACREDITÁVEL E SUSTENTABILIDADE! Marcos fiscais transparentes ancoram as expectativas de inflação e juros, dando segurança para investimentos privados de longo prazo.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Liberar o governo para se endividar mais, desde que ele siga as regras de transparência nos gastos.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 CONTRADIÇÃO. Regras fiscais existem precisamente para proibir a expansão ilimitada e desordenada de despesas e dívida.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Fazer o país pagar suas contas em dólar, que é uma moeda mais estável e confiável que o real.",
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
        "text": "O aumento forte da alíquota provoca inflação imediata, que reduz o poder de compra do governo e anula o ganho que viria com a arrecadação.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ INCORRETO. Embora impostos possam afetar custos e preços, a Curva de Laffer trata especificamente da relação entre a alíquota do imposto e a receita tributária total.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Impostos altos demais desestimulam a produção e aumentam a informalidade e a sonegação, e por isso a arrecadação total pode cair em vez de subir.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ CORRETO (COMPREENSÃO DA CURVA DE LAFFER). A Curva de Laffer mostra que existe um ponto ótimo de tributação. Acima dele, tributos extorsivos sufocam a produção e incentivam a evasão fiscal.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Um imposto maior reduz o consumo das famílias no curto prazo, e o Banco Central teria de mexer nos juros para evitar que a economia entre em recessão.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ INCORRETO. O alerta central de Laffer diz respeito aos incentivos do lado da oferta (produção, investimento e formalidade).",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "A arrecadação sobe na mesma proporção da alíquota, mas o país sofre com a saída de dinheiro para o exterior e com a alta do dólar logo em seguida.",
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
        "text": "É um sinal ruim: com mais gente trabalhando, sobra menos tempo para ir às compras e o comércio vende menos.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ LOGICA INVERTIDA. O aumento do emprego expande a massa salarial, impulsionando a demanda por bens e serviços na economia.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "É um sinal bom: mais gente empregada gera mais renda, mais consumo e mais impostos arrecadados.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ DINÂMICA POSITIVA DO MERCADO DE TRABALHO! Maior formalização e emprego geram renda, aquecem a economia real e fortalecem as finanças públicas com maior arrecadação de tributos.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Afeta só o consumo: as famílias gastam mais, mas a arrecadação de impostos do governo continua igual.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ DESCONEXÃO TÉCNICA. A folha de pagamento e o consumo de bens são bases centrais de arrecadação de impostos (INSS, IR, tributos sobre consumo).",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "É um alerta: desemprego tão baixo indica que as empresas estão contratando demais e podem quebrar logo.",
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
        "text": "Porque fica preso em fábricas e obras por muitos anos, gera empregos e não foge do país de um dia para o outro.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ VALOR DO INVESTIMENTO PRODUTIVO! O IDP difere do capital especulativo (\"volátil\"): ele se fixa em ativos físicos de longo prazo, aumentando a capacidade produtiva e a tecnologia do país.",
        "points": 10
      },
      {
        "origLabel": "B",
        "text": "Porque é um empréstimo barato ao governo, que só precisa devolver o valor com juros baixos em poucos meses.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ CONFUSÃO DE CONCEITOS. IDP é investimento em capital produtivo ou societário, não um empréstimo de curto prazo tomado pelo Tesouro.",
        "points": 0
      },
      {
        "origLabel": "C",
        "text": "Porque as empresas estrangeiras trazem seus próprios funcionários e assim não disputam vagas com os brasileiros.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ EFEITO CONTRÁRIO. O investimento em novas fábricas e infraestrutura gera empregos diretos e demanda para fornecedores locais.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Porque as empresas deixam as obras prontas para o governo usar, sem cobrar nenhuma contrapartida do país.",
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
        "text": "Usar as reservas para pagar salários de servidores e despesas de saúde e educação enquanto a crise durar.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ CONFUSÃO FISCAL. Reservas são em moeda estrangeira para proteção externa, não para pagar despesas comuns do governo em reais.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Vender parte dos dólares guardados para segurar a alta do dólar e garantir o pagamento das dívidas externas do país.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ PROTEÇÃO E ESTABILIDADE EXTERNA! As reservas funcionam como um seguro: elas dão segurança aos investidores internacionais e evitam que faltem dólares para o país importar produtos ou pagar suas contas.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Vender quase todas as reservas de uma vez para baixar impostos e aliviar o bolso da população durante a crise.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 DESPROTEÇÃO DA ECONOMIA. Sem reservas, o país fica vulnerável a qualquer crise mundial, podendo sofrer uma disparada do dólar e desabastecimento de produtos importados.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Guardar as reservas sem usar, pois em crise o Banco Central pode emitir dólares próprios quando eles faltarem.",
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
        "text": "Entraram mais dólares com as vendas ao exterior do que saíram com as compras, e isso fortalece a economia.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ SUPERÁVIT COMERCIAL! Quando as vendas para o exterior superam as compras, o país acumula dólares, fortalece seu comércio exterior e gera renda interna.",
        "points": 10
      },
      {
        "origLabel": "B",
        "text": "Significa prejuízo, pois o país mandou para fora produtos que poderiam abastecer as lojas aqui dentro.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ INTERPRETAÇÃO INVERTIDA. Exportar mais do que importar gera um saldo positivo (superávit), o que é um sinal de força do setor produtivo.",
        "points": 0
      },
      {
        "origLabel": "C",
        "text": "Indica que o governo recebeu US$ 90 bilhões no caixa e pode usar esse valor direto em obras públicas pelo país.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ CONFUSÃO PRIVADO vs. PÚBLICO. O dinheiro das exportações vai para as empresas que venderam os produtos. O governo arrecada apenas os impostos dessa atividade.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Mostra que o país quase parou de comprar de fora e passou a produzir sozinho as máquinas e os produtos.",
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
        "text": "A população fica mais rica de vez, porque com mais dinheiro as empresas produzem mais e os produtos acompanham o aumento.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ RESPOSTA INCORRETA. Papel-moeda é apenas um meio de troca. Riqueza real vem da produção de bens e serviços, não da impressão de cédulas.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Os produtos nas lojas continuam os mesmos, mas todo mundo quer comprar mais, então os preços sobem: é a inflação.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ VOCÊ ACERTOU! Imprimir dinheiro não fabrica produtos, máquinas ou alimentos. Quando a quantidade de moeda cresce mais rápido do que a produção real do país, o resultado direto é a inflação.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Os preços caem, porque as lojas fazem promoções para disputar o dinheiro novo que as pessoas acabaram de receber na conta.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ RESPOSTA INCORRETA. Havendo mais dinheiro circulando para comprar a mesma quantidade de bens, a tendência é a subida de preços, e não a queda.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Quase nada muda, porque as pessoas tendem a guardar o dinheiro extra na poupança em vez de sair gastando com compras.",
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
        "text": "Porque a dívida em reais deixa de pagar juros, já que o próprio governo controla a moeda e a taxa.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ ERRO FINANCEIRO. Dívidas em moeda local também pagam taxa de juros (como a Selic) para atrair investidores.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Porque, se o dólar disparar numa crise, o tamanho da dívida não aumenta junto e o orçamento não desanda.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ REDUÇÃO DA VULNERABILIDADE EXTERNA! Ao ter a maior parte da dívida em reais (moeda que o próprio país emite), o governo evita que um salto no dólar aumente repentinamente o tamanho da sua dívida em relação ao PIB.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Porque hoje o real é aceito em quase todo o mundo e os investidores estrangeiros preferem negociar em reais.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ CONFUSÃO MONETÁRIA. O dólar e o euro continuam sendo as principais moedas de reserva e negociação internacional.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Porque, com a dívida em reais, o governo pode adiar ou reduzir o valor devido sempre que faltar dinheiro.",
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
        "text": "O dólar tende a subir no Brasil, porque os investidores tiram dinheiro daqui para aplicar nos EUA e sobram menos dólares no mercado.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ MECANISMO DE ATRAÇÃO DE CAPITAL! Juros mais altos nos EUA atraem capital global para a maior economia do mundo. A saída de dólares dos emergentes reduz a oferta da moeda e faz a sua cotação subir por aqui.",
        "points": 10
      },
      {
        "origLabel": "B",
        "text": "O dólar tende a cair aqui, pois com juros altos a economia americana desacelera e a moeda deles perde força no mundo.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ LÓGICA INVERTIDA. Quando a renda fixa americana passa a pagar juros mais atraentes, os investidores retiram dinheiro de países emergentes.",
        "points": 0
      },
      {
        "origLabel": "C",
        "text": "Quase nada muda no câmbio, porque o que define o dólar aqui são os juros do Brasil, e esses continuam exatamente iguais.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ DESCONSIDERAÇÃO DA INTEGRAÇÃO GLOBAL. As decisões de política monetária da maior economia do planeta afetam o fluxo financeiro de todos os países.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "O dólar fica parado, porque o Banco Central do Brasil trava a cotação automaticamente sempre que outro país muda seus juros.",
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
        "text": "Manter as regras como estão e cobrir o rombo com mais dívida, deixando a conta para as próximas gerações.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ INSUS TENTABILIDADE INTERGERACIONAL. Negar a transição demográfica leva o sistema previdenciário ao colapso fiscal, tirando recursos de saúde, segurança e educação dos jovens.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Fazer uma reforma que ajuste a idade mínima e o tempo de contribuição à vida mais longa da população atual.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ EQUILÍBRIO ATUARIAL E RESPONSABILIDADE! Adequar as regras previdenciárias à expectativa de vida garante que o sistema continue solvente e capaz de pagar as aposentadorias de forma sustentável.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Cortar as aposentadorias atuais pela metade para equilibrar as contas já no ano que vem, sem fase de transição.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 RUPTURA SOCIAL E CRUELDADE. Cancelar abruptamente direitos previdenciários adquiridos violaria a proteção social e geraria miséria em massa.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Reduzir a idade de aposentadoria para 50 anos, liberando vagas para jovens que passariam a contribuir.",
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
        "text": "Sim, pois cada município tem autonomia para criar a própria moeda oficial quando faltar dinheiro no caixa.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ RESPOSTA INCORRETA. Prefeituras e estados não possuem autoridade monetária para emitir moeda oficial.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Não, só a União pode emitir dinheiro no Brasil, por meio do Banco Central, para manter a moeda estável.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ VOCÊ ACERTOU! A exclusividade da emissão monetária pelo Banco Central garante que haja controle rigoroso sobre a quantidade de dinheiro em circulação e previne o caos inflacionário no país.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Sim, desde que o prefeito avise o Ministério da Economia e a Câmara de Vereadores aprove antes a impressão.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ RESPOSTA INCORRETA. A proibição é constitucional; comunicar o órgão federal não autoriza a criação de moeda paralela.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Não, porque só empresas privadas credenciadas pelo governo têm autorização para imprimir cédulas no país.",
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
        "text": "Manter tudo com o governo, mesmo sem dinheiro para reformar estradas e portos, para não perder o controle do setor.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ GARGALO LOGÍSTICO. Se o Estado não possui capacidade fiscal para investir, manter o monopólio condena a infraestrutura do país ao sucateamento prolongado.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Conceder rodovias e portos em leilão, com metas de investimento e fiscalização forte de agências reguladoras.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ EFICIÊNCIA E ATRAÇÃO DE CAPITAL PRIVADO! Leilões competitivos e concessões bem reguladas atraem investimentos privados para modernizar portos, aeroportos e rodovias sem onerar o orçamento público.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Vender as estatais rapidamente para quem chegar primeiro, sem leilão nem metas, para levantar caixa logo.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 CORRUPÇÃO E CRONISMO. Transferência de ativos públicos sem transparência, concorrência e avaliação justa viola os princípios da administração pública.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Fechar os portos e rodovias que dão prejuízo até sobrar dinheiro público para reformá-los no futuro.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 SABOTAGEM NACIONAL. Fechar ativos de infraestrutura paralisa a produção e o escoamento de riquezas do país.",
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
        "text": "Imprimir dinheiro discretamente, em pequenas doses, para que o mercado não perceba o aumento de moeda.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ RESPOSTA INCORRETA. Esconder a emissão não impede os efeitos da inflação no mercado e fere o princípio da transparência pública.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Vender títulos da dívida pública e pegar emprestado dos investidores o dinheiro que já circula na economia.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ VOCÊ ACERTOU! Ao emitir títulos, o governo pega emprestado dinheiro que já existe no mercado (sem criar moeda nova do nada), pagando juros por isso. É assim que países fiscalmente responsáveis cobrem seus déficits.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Pedir que o Banco Central compre as contas atrasadas do governo pagando com dinheiro recém-impresso.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ RESPOSTA INCORRETA. O financiamento direto de déficits via impressão de moeda (dominância monetária) destrói a credibilidade do país e gera inflação.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Autorizar os bancos privados a emitir notas de real para cobrir os gastos do Estado por um tempo.",
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
        "text": "Nenhum, pois cada nota nova substitui uma velha de mesmo valor, que é destruída, e o total não muda.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ VOCÊ ACERTOU! Substituir cédulas desgastadas por cédulas novas não altera a quantidade total de moeda (base monetária). Trata-se apenas de manutenção física do dinheiro.",
        "points": 10
      },
      {
        "origLabel": "B",
        "text": "A inflação sobe, pois toda vez que o Banco Central imprime dinheiro aumenta a quantidade de moeda no país.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ RESPOSTA INCORRETA. O que gera inflação é a ampliação do estoque total de moeda em relação à produção, e não a mera substituição física do papel danificado.",
        "points": 0
      },
      {
        "origLabel": "C",
        "text": "A inflação cai, porque notas novas transmitem confiança e as pessoas passam a valorizar mais o real.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ RESPOSTA INCORRETA. O valor de face do Real é exatamente o mesmo, seja a nota nova ou velha.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Haverá queda de preços, porque as pessoas tendem a guardar as notas novas em casa em vez de gastar.",
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
        "text": "Que juros e gastos públicos precisam andar juntos: o Banco Central não vence a inflação sozinho.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ COORDENAÇÃO ENTRE MONETÁRIA E FISCAL! A Dominância Fiscal ocorre quando a política monetária perde a eficácia porque o risco fiscal é gigantesco. A responsabilidade fiscal é pré-requisito para o sucesso do controle da inflação.",
        "points": 10
      },
      {
        "origLabel": "B",
        "text": "Que, com a dívida já alta, o governo deve gastar ainda mais para fazer a economia crescer e pagar a conta.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 AGRAVAMENTO DA CRISE. Acelerar gastos em cenário de alto endividamento precipita o colapso cambial e hiperinflacionário.",
        "points": 0
      },
      {
        "origLabel": "C",
        "text": "Que o Banco Central deve parar de divulgar a inflação por um tempo para não assustar o mercado financeiro.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ IRREALIDADE. Omitir ou apagar estatísticas econômicas destrói a credibilidade do país e agrava o risco percebido.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Que os juros não têm relação com a dívida, então o BC pode subir a taxa sem afetar as contas do governo.",
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
        "text": "A moeda se valoriza, porque com tanta nota circulando todo mundo passa a aceitar e usar mais dinheiro.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ RESPOSTA INCORRETA. Abundância de papel sem lastro produtivo reduz o valor da moeda, não aumenta.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "As pessoas perdem a confiança, recusam a moeda e passam a usar o dólar ou a trocar produtos diretamente.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ VOCÊ ACERTOU! A moeda precisa cumprir três funções: reserva de valor, meio de troca e unidade de conta. Quando a impressão desenfreada destrói a reserva de valor, as pessoas abandonam a moeda nacional.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Os preços caem, porque as lojas aceitam as notas novas com desconto para não ficar com produtos parados.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ RESPOSTA INCORRETA. Em cenários de hiperinflação, os preços sobem diariamente em ritmo acelerado.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "O país exporta mais, já que a moeda fraca deixa seus produtos baratos e a economia volta a crescer rápido.",
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
        "text": "Inflação dentro da meta, contas equilibradas e dívida sob controle, juros moderados, PIB crescendo e salário dos trabalhadores comprando mais.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ EXCELÊNCIA NA GESTÃO MACROECONÔMICA! O objetivo da política econômica é criar condições de estabilidade, previsibilidade e equilíbrio fiscal que permitam o crescimento sustentável, a geração de empregos e a melhoria da qualidade de vida da população.",
        "points": 10
      },
      {
        "origLabel": "B",
        "text": "Gastos públicos em forte alta para aquecer a economia, mesmo com inflação de 50% ao ano, dólar disparando e atraso no pagamento da dívida.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 DESASTRE MACROECONÔMICO. Desequilíbrios fiscais e monetários graves geram inflação, desvalorização cambial e perda de bem-estar social.",
        "points": 0
      },
      {
        "origLabel": "C",
        "text": "Salários e preços congelados por decreto para conter a inflação, com importações proibidas para proteger a indústria nacional e o emprego.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 PARALISIA E ESCASSEZ. Controles arbitrários e fechamento ao comércio internacional destroem a eficiência econômica e geram desabastecimento.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Impostos elevados até a maior parte do PIB passar pelo governo, com o Estado assumindo aos poucos o lugar das empresas privadas no país.",
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
        "text": "Anunciar o aumento agora, mesmo sem caixa, porque o benefício ajuda as famílias na hora e as contas podem ser ajustadas mais para a frente.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 POPULISMO FISCAL. Prometer gastos sem cobertura gera déficit, aumenta a dívida pública e resulta em inflação. O ganho ilusório do benefício é corroído pelo aumento do custo de vida.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Explicar que novos gastos exigem cortar outras despesas ou aumentar receitas, para que a promessa não vire inflação contra os mais pobres.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ RESPONSABILIDADE FISCAL E LITERACIA FINANCEIRA! Na economia pública, assim como na vida pessoal, não existe \"dinheiro grátis\". Todo gasto adicional exige uma fonte de custeio real para não gerar desequilíbrio.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Pedir à Casa da Moeda que imprima o dinheiro necessário para pagar o aumento, já que assim não é preciso mexer no orçamento.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 RISCO DE HIPERINFLAÇÃO. Imprimir dinheiro sem aumento de produção desvaloriza a moeda rapidamente, transformando o benefício em papel sem valor.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Cortar verbas de vários serviços públicos por decreto para bancar o aumento, sem esperar a aprovação do Congresso Nacional.",
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
        "text": "Comemorar o reajuste de 10% como vitória dos trabalhadores, já que o valor que aparece no holerite ficou maior.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ ILUSÃO MONETÁRIA. Ter mais notas de dinheiro na carteira não significa estar mais rico se os preços das coisas subiram em proporção ainda maior.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Mostrar que o salário vale pelo que compra e que, com inflação de 12%, o foco é conter os preços.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ COMPREENSÃO DO PODER DE COMPRA REAL! O que importa para a família é o salário real (o que o dinheiro consegue comprar). Controlar a inflação é a política de proteção salarial mais eficiente.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Culpar os supermercados pela alta dos preços e exigir que vendam mais barato, mesmo que tenham prejuízo.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ DIAGNÓSTICO INCORRETO. O aumento generalizado de preços reflete perda de valor da moeda por desequilíbrio macroeconômico, não ganância isolada de comerciantes.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Baixar por decreto o preço dos alimentos básicos pela metade até a inflação voltar ao normal no país.",
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
        "text": "O imposto sairá do lucro dos donos das indústrias, sem ser repassado aos preços, e por isso não deve afetar os empregos nem a produção do setor industrial.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ VISÃO PARCIAL. Impostos sobre faturamento e produção entram na planilha de custos das empresas. Parte do tributo é repassada aos preços ao consumidor e outra parte reduz a capacidade de investimento e contratação.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "O imposto encarece a produção nacional, deixa os produtos daqui menos competitivos que os importados e pode causar demissões e menos crescimento.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ AVALIAÇÃO DE IMPACTO REGULATÓRIO. Excelente decisão. Como Presidente, você considerou o \"Custo Brasil\". Aumentar impostos sobre o setor produtivo nacional sem ganho de produtividade penaliza as empresas locais frente aos concorrentes globais.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "O imposto deixará as indústrias mais competitivas, porque a arrecadação extra volta para elas em forma de modernização das fábricas e novas máquinas.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ INVERSÃO CAUSAL. O recolhimento de impostos vai para o caixa geral do Estado, não retornando como ganho de eficiência direto para a linha de produção da empresa pagadora.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "O imposto quase não muda a economia, já que o consumo das famílias depende sobretudo do preço do dólar e não dos custos das fábricas nacionais.",
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
        "text": "Criar o subsídio permanente usando o fundo de reserva para segurar o preço dos alimentos por tempo indeterminado, protegendo as famílias da alta de preços.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ ERRO ESTRUTURAL. Reservas financeiras são recursos pontuais (não recorrentes). Financiá-las para custear uma despesa continuada gerará um \"rombo\" fiscal inevitável no momento em que a reserva se esgotar.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Usar o fundo só na emergência, com socorro às vítimas e obras rápidas contra a seca, sem criar um gasto permanente e mostrando como vale a pena se planejar antes.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ LIDERANÇA RESPONSÁVEL. Como Presidente, você aplicou a regra de ouro da gestão de riscos: fundos de contingência existem para absorver choques temporários e inesperados. Usá-los com foco e sem criar despesas permanentes protege a estabilidade do país a longo prazo.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Deixar o fundo guardado para não reduzir o patrimônio do Estado e pegar um empréstimo extra para financiar a ajuda às regiões atingidas pela seca severa.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ INEFICIÊNCIA FINANCEIRA. Tomar empréstimos e pagar juros sobre nova dívida enquanto se mantém recursos próprios guardados e parados para essa exata emergência gera um custo desnecessário aos cofres públicos.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Repassar todo o fundo direto aos governadores dos estados atingidos, que conhecem melhor a região, sem exigir nenhuma prestação de contas à União depois.",
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
        "text": "Subsidiar toda a gasolina pelo tempo que for preciso, tirando verba dos hospitais, porque o preço afeta todo mundo.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ SUBSÍDIO REGRESSIVO ETRANSFERÊNCIA PERVERSA. Usar dinheiro do orçamento geral (pago inclusive por quem não tem carro) para congelar gasolina beneficia proporcionalmente mais quem tem maior renda.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Evitar subsídio geral à gasolina e concentrar a ajuda nos mais pobres ou no transporte público coletivo.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ ALOCAÇÃO EFICIENTE E JUSTIÇA DISTRIBUTIVA! Recursos públicos escassos devem proteger os mais pobres (transporte público/renda) em vez de mascarar preços de mercado que drenam verbas da saúde.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Pedir a outros países um acordo para limitar o preço do petróleo, mantendo a gasolina estável por aqui.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 IMPOSSIBILIDADE DE JURISDIÇÃO. O governo brasileiro não tem poder de ditar cotações de commodities nos mercados globais.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Fechar ou limitar a venda nos postos até o preço voltar ao normal, para o país economizar combustível.",
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
        "text": "Manter as regras de aposentadoria como estão e compensar cortando verbas de saúde, educação e obras, para equilibrar as contas sem mexer nos direitos de ninguém.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ PARALISIA DO ESTADO. Sacrificar serviços fundamentais como saúde e segurança para sustentar um sistema previdenciário desequilibrado compromete o desenvolvimento humano e a produtividade futura do país.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Propor ao Congresso uma Reforma da Previdência que ajuste idade mínima e tempo de contribuição ao envelhecimento da população, garantindo o orçamento futuro.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ RESPONSABILIDADE INTERGERACIONAL. Quando a população envelhece, o número de beneficiários aumenta e o de trabalhadores ativos diminui. Reformar a previdência é indispensável para evitar o colapso das contas públicas.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Adiar temporariamente parte das aposentadorias do setor privado durante a recessão e usar o dinheiro poupado em obras que geram empregos, retomando os pagamentos depois.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ VIOLAÇÃO DE DIREITOS ADQUIRIDOS. Descumprir obrigações com aposentados que contribuíram ao longo da vida gera caos social e insegurança jurídica absoluta.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Pegar empréstimos novos todo ano para pagar os aposentados de hoje, sem mudar as regras de acesso, deixando que os próximos governos cuidem da dívida quando a economia crescer.",
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
        "text": "Usar todo o valor em consumo imediato, como bônus, porque a população precisa de alívio agora e os problemas estruturais podem ser resolvidos no próximo mandato.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ IMPREVIDÊNCIA FISCAL. Gastar todo o orçamento em consumo corrente sem investir na capacidade produtiva condena o país à estagnação tecnológica e a crises futuras.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Priorizar investimentos em infraestrutura e educação, que aumentam a capacidade de o país crescer e geram renda e empregos duradouros, mesmo com menos alívio imediato.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ VOCÊ ACERTOU! (VISÃO DE ESTADO E FORMAÇÃO DE CAPITAL) Sacrificar parte do consumo imediato para investir em infraestrutura e educação aumenta o PIB potencial do país e multiplica a riqueza nacional no longo prazo.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Guardar os R$ 50 bilhões sem aplicar em nenhuma área e suspender novos projetos de infraestrutura até o fim do mandato, para não correr risco de desperdiçar dinheiro público.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ PARALISIA E INEFICIÊNCIA. Paralisar os investimentos públicos em um país emergente perpetua gargalos logísticos e reduz a competitividade das empresas nacionais.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Colocar os recursos em despesas do dia a dia sem um plano definido, confiando que o aumento do consumo vai aquecer a economia e, sozinho, resolver os problemas de longo prazo.",
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
        "text": "Sim, porque o Presidente eleito recebe o voto da maioria e, com esse apoio popular, pode revogar leis e mudar impostos por decreto.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ ILUSÃO DE PODER ABSOLUTO. A Constituição brasileira adota a separação dos Poderes. O Executivo não pode invadir a competência do Legislativo.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Não. O Presidente atua num sistema de freios e contrapesos: mudar leis e impostos depende de aprovação do Congresso, e não de decisão só dele.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ VOCÊ ACERTOU! (LIMITES DO PODER EXECUTIVO) O Presidente é o Chefe do Executivo, mas não é um soberano absoluto. Votar consciente exige saber que promessas que dependem do Congresso precisam de negociação política.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Sim, desde que ele publique a revogação no Diário Oficial ou na rede social oficial da Presidência logo no primeiro dia do mandato.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ FALTA DE AMPARO LEGAL. Publicações em redes sociais não possuem valor jurídico para revogar ou criar leis.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Não, porque o Presidente só tem poder para decidir sobre política externa, e assuntos de impostos ficam sempre com os governadores.",
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
        "text": "Exigir que quem recebe o benefício não tenha carteira assinada, para o auxílio ir só a quem está sem renda.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ ARMADILHA DA PO BREZA. Desincentivar o trabalho formal perpetua a dependência do Estado e impede a ascensão social da família.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Ligar o auxílio a educação, cursos técnicos, microcrédito e vagas formais, criando uma porta de saída da pobreza.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ EMPOWERMENT E AUTONOMIA FINANCEIRA! O benefício social protege no presente, mas a educação e o trabalho geram a verdadeira autonomia e liberdade financeira do cidadão no futuro.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Cortar o benefício de uma vez após um prazo fixo, para estimular as pessoas a buscarem emprego por conta própria.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 CRUELDADE SOCIAL. Cortar a proteção social sem oportunidade de trabalho expõe os vulneráveis à miséria extrema.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Ampliar o auxílio para todas as famílias, inclusive as de alta renda, para ninguém ficar de fora por erro de cadastro.",
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
        "text": "Pegar empréstimos no mercado para pagar salários e aposentadorias do mês, já que são despesas urgentes e o limite pode esperar.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 RISCO DE IMPEACHMENT. Emitir dívida acima do limite constitucional para pagar custeio sem autorização do Legislativo é violação grave da Lei de Responsabilidade Fiscal.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Respeitar a Regra de Ouro: não se endividar para pagar despesas do dia a dia, salvo com autorização prévia do Congresso.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ VOCÊ ACERTOU! (CUMPRIMENTO DA REGRA DE OURO) A Regra de Ouro impede que o Estado se endivide para pagar despesas de consumo diário (como contas e salários), exigindo crédito especial do Congresso caso precise.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Editar um decreto presidencial que suspenda por um ano o limite de endividamento previsto na Constituição, por causa da queda na arrecadação.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ USURPAÇÃO DE PODER. O Presidente não possui poder para alterar artigos da Constituição por decreto unipessoal.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Suspender por alguns meses o pagamento das parcelas de dívidas antigas e usar esse dinheiro para manter os programas de governo funcionando.",
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
        "text": "Não há risco relevante, já que o governo pode emitir mais reais e trocá-los por dólares quando a dívida vencer.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ ERRO MONETÁRIO. O governo brasileiro só emite a sua moeda soberana (Real), dependendo de divisas reais para honrar compromissos em Dólar.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "O risco cambial: se o Dólar subir muito frente ao Real, a dívida fica mais cara em reais e pesa nas contas públicas.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ VOCÊ ACERTOU! (GESTÃO DE RISCO CAMBIAL) Endividar o Estado em moeda estrangeira expõe as contas públicas à volatilidade do mercado internacional. Por isso, a preferência moderna é captar em moeda local (Reais).",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "O risco de o dinheiro perder valor ao virar Real, já que toda conversão de moeda faz o país perder parte do dinheiro.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ CONFUSÃO DE CÂMBIO. A conversão de moedas é feita pelas taxas oficiais praticadas pelo mercado bancário, sem perda de valor inerente.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "O risco de os credores passarem a controlar estatais e decidir os rumos da economia no lugar do governo.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ IRREALISMO DIPLOMÁTICO. Empréstimos internacionais são regidos por contratos financeiros com garantias de crédito habituais, e não pela entrega do controle de empresas ou da economia do país.",
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
        "text": "Quanto maior o déficit e a desconfiança nas contas do governo, mais juros os investidores cobram para emprestar ao país.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ VOCÊ ACERTOU! (RELAÇÃO ENTRE RISCO E CUSTO DO CRÉDITO) Contas públicas desequilibradas aumentam a percepção de risco do país. Para continuar financiando a dívida pública, o Tesouro é obrigado a pagar juros mais elevados.",
        "points": 10
      },
      {
        "origLabel": "B",
        "text": "A dívida pública só cobra juros quando o governo atrasa pagamentos, então o equilíbrio fiscal não muda esse custo.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ ERRO TÉCNICO. O governo paga juros regularmente aos detentores de seus títulos públicos (fundos de pensão, bancos, cidadãos), e não só quando atrasa, sob pena de calote e ruína financeira.",
        "points": 0
      },
      {
        "origLabel": "C",
        "text": "Aumentar os gastos do governo faz a economia crescer, e com mais crescimento os juros da dívida tendem a cair sozinhos.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ LÓGICA INVERTIDA. Descontrole de gastos gera inflação e risco de crédito, o que empurra a taxa de juros para cima, e não para baixo.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "O custo dos juros é decidido pelo Congresso a cada ano na lei do orçamento, sem relação com as contas do governo.",
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
        "text": "É uma manobra contábil comum e legal, usada só para organizar o fluxo de caixa entre o Tesouro e os bancos.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 VIOLAÇÃO DA LRF. Esconder dívidas maquiando balanços engana a sociedade e destrói a transparência fiscal do Estado.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "É fraude fiscal que esconde o déficit real e pode ser crime de responsabilidade, com risco de impeachment.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ RESPONSABILIDADE INSTITUCIONAL E LEI! A transparência fiscal é inegociável. Tentar maquiar contas públicas viola a Lei de Responsabilidade Fiscal e pune o gestor com a perda do mandato.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "É uma prática aceita pelo Tribunal de Contas da União quando o atraso é pago até o fim do ano seguinte.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ FALSO HISTÓRICO. O TCU condena rigorosamente o uso de bancos públicos para financiar indiretamente o Tesouro Nacional.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "É um jeito de transformar o déficit em superávit de verdade, liberando dinheiro novo para gastar.",
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
        "text": "Investir em ensino técnico integrado ao ensino médio, com cursos ligados às vagas que as empresas precisam preencher.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ CAPITAL HUMANO E EMPREGABILIDADE! O ensino técnico de qualidade é a ponte mais rápida entre o jovem vulnerável e o primeiro emprego formal com renda digna, aumentando a produtividade do país.",
        "points": 10
      },
      {
        "origLabel": "B",
        "text": "Concentrar o dinheiro em bolsas de pós-graduação no exterior, formando poucos especialistas de alto nível para a indústria.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ DESCONEXÃO COM A REALIDADE SOCIAL. Embora a pesquisa seja relevante, priorizar nichos acadêmicos distantes enquanto faltam técnicos básicos agrava o desemprego jovem.",
        "points": 0
      },
      {
        "origLabel": "C",
        "text": "Priorizar só a abertura de vagas em universidades, já que o diploma superior é o caminho mais seguro para um bom emprego.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ DESVALORIZAÇÃO DO TRABALHO TÉCNICO. Países desenvolvidos possuem alta taxa de matriculados no ensino técnico como motor de suas economias.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Dar incentivos para as indústrias contratarem só profissionais experientes, que já chegam prontos e produzem mais rápido.",
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
        "text": "É causada por um período longo de crescimento forte, em que todos têm dinheiro demais e os preços sobem.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ DIAGNÓSTICO OPOSTO. A estagflação é o pior dos cenários econômicos, pois une o desemprego da recessão com a perda de poder de compra da inflação.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Vem de choques de oferta somados a descontrole fiscal e estímulos malfeitos, que travam o PIB e sobem preços.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ DIAGNÓSTICO CRÍTICO DE ERRO DE GESTÃO! Políticas fiscais e monetárias irresponsáveis podem travar o crescimento e, simultaneamente, desvalorizar a moeda, criando a estagflação.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Acontece quando o governo corta muitos impostos de uma vez e a arrecadação some, sem outro efeito na economia.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ ERRO CONCEITUAL. A causa da estagflação está ligada a desequilíbrios macroeconômicos profundos e perda de credibilidade das políticas públicas.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "É um efeito passageiro e até bom, porque com preços altos as famílias compram menos e guardam mais dinheiro.",
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
        "text": "Manter o foco no dinheiro em espécie, porque o PIX ainda é novo demais e pode confundir parte da população.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ RETROCESSO TECNOLÓGICO. Ignorar inovações financeiras aumenta o custo de circulação do dinheiro e atrasa o desenvolvimento do país.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Baratear pagamentos, levar ao banco quem não tinha conta, dar transparência ao gasto público e dificultar a sonegação.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ EFICIÊNCIA E INCLUSÃO FINANCEIRA! A digitalização do sistema financeiro (PIX/DREX) barateia custos para pequenos empreendedores, amplia o acesso bancário e melhora a rastreabilidade.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Permitir que o governo bloqueie o saldo de qualquer conta quando achar necessário, sem precisar de ordem judicial.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 VIOLAÇÃO DE DIREITOS FUNDAMENTAIS. Tecnologias financeiras estatais devem operar estritamente sob as garantias do devido processo legal e direito de propriedade.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Dar ao governo controle sobre o que cada pessoa compra, para direcionar o consumo das famílias para itens essenciais.",
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
        "text": "Proibir a entrada de produtos estrangeiros para proteger a indústria nacional, mesmo que os preços subam pela falta de concorrência.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ AUTARQUIA E PREJUÍZO AO CONSUMIDOR. Fechamento comercial excessivo pune a população com produtos mais caros e ultrapassados, reduzindo o poder de compra das famílias.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Abrir o comércio de forma gradual, expondo as empresas à concorrência, barateando máquinas e tecnologia e melhorando os produtos.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ COMPETITIVIDADE E PODER DE COMPRA! O comércio internacional permite que o país exporte o que faz de melhor e importe insumos e produtos mais eficientes, beneficiando o consumidor final.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Limitar as exportações brasileiras para garantir que os produtos fiquem no país e o preço para o consumidor daqui caia.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 SUICÍDIO COMERCIAL. Impedir exportações destrói a entrada de dólares no país e quebra o agronegócio e a indústria nacional.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Aceitar produtos estrangeiros só quando não existir nenhum similar fabricado no Brasil, mesmo que o nacional seja bem mais caro.",
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
        "text": "Dar um reajuste grande de uma vez para recuperar o poder de compra, sem calcular o impacto na Previdência e nas pequenas empresas.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 POPULISMO E INVIABILIDADE FISCAL. Aumentos arbitrários e desconectados da capacidade do Tesouro e das empresas causam quebra generalizada e desemprego formal.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Usar uma regra previsível: repor a inflação e somar a variação do PIB, garantindo ganho real que as contas suportem.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ VALORIZADO COM RESPONSABILIDADE FISCAL! Uma regra previsível preserva o poder de compra dos aposentados e trabalhadores sem gerar sobressaltos incalculáveis no orçamento público.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Manter o salário mínimo congelado por vários anos, sem repor a inflação, até que as contas públicas voltem a ficar no azul.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ CORROSÃO SOCIAL. Deixar de reajustar a inflação reduz a renda real das famílias mais pobres ano a ano.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Acabar com o piso nacional e deixar que cada empresa negocie o salário direto com o trabalhador, conforme a sua realidade.",
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
        "text": "Manter o Dólar o mais baixo possível por tempo indeterminado, já que a moeda forte barateia importados e só traz vantagens.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ VISÃO UNILATERAL. Um Real forte demais por longos períodos pode desindustrializar o país, tornando os produtos nacionais caros para o exterior e vulneráveis aos concorrentes.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Reconhecer que o Dólar baixo barateia importados e segura a inflação, mas encarece o produto nacional lá fora e pede mais produtividade.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ VOCÊ ACERTOU! (ENTENDIMENTO DO DUALISMO CAMBIAL) O papel do Presidente é ponderar esse trade-off: o Real valorizado barateia insumos e segura preços domésticos, mas exige atenção às exportações.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Concluir que o Real mais forte reduz diretamente o poder de compra de quem recebe salário em reais, mesmo com a inflação caindo.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ EQUÍVOCO CONCEITUAL. A valorização da moeda local aumenta o poder de compra interno dos salários pagos em Reais.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Restringir a entrada de capital estrangeiro no país para fazer o Dólar voltar a subir e devolver a competitividade perdida aos exportadores.",
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
        "text": "Juros altos tornam os títulos brasileiros mais atraentes; investidores trazem dólares para aplicar aqui, a oferta da moeda sobe e o preço cai.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ VOCÊ ACERTOU! (MECANISMO DE OFERTA E DEMANDA) O aumento do diferencial de juros atrai fluxo financeiro internacional. Mais Dólares ingressando no mercado brasileiro elevam a oferta da moeda e reduzem sua cotação.",
        "points": 10
      },
      {
        "origLabel": "B",
        "text": "Juros altos fazem governos estrangeiros enviarem dólares ao Brasil em acordos de cooperação, o que aumenta a reserva do país.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ ERRO CONCEITUAL. Não se trata de doações entre governos, mas do movimento de investidores globais buscando rendimento para seus recursos.",
        "points": 0
      },
      {
        "origLabel": "C",
        "text": "Quando a Selic sobe, o Banco Central passa a fixar por norma um valor menor para o Dólar, para acompanhar a nova taxa de juros.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ CONFUSÃO REGULATÓRIA. No regime de câmbio flutuante, a cotação é definida pelas forças do mercado, e não por decreto do Poder Executivo.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Juros altos encarecem o crédito e levam investidores estrangeiros a tirar seu dinheiro do Brasil, por medo de uma desaceleração.",
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
        "text": "Mostrar que economizar nas despesas do dia a dia sinaliza responsabilidade aos investidores, reduz o risco do país, ajuda a segurar a inflação e freia a dívida pública.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ VOCÊ ACERTOU! (SOLVÊNCIA E ESTABILIDADE ECONÔMICA) O superávit primário demonstra que o Estado consegue gerir seu custeio diário com recursos próprios. Isso atrai investimentos, segura a inflação e reduz juros futuros.",
        "points": 10
      },
      {
        "origLabel": "B",
        "text": "Dizer que o superávit primário serve para formar uma reserva de dinheiro parado no caixa do governo, guardada só para emergências e sem nenhum efeito na economia do dia a dia.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ MICO CONCEITUAL. A gestão do resultado primário não acumula riqueza física estática, mas garante o equilíbrio entre receitas e despesas correntes do Estado.",
        "points": 0
      },
      {
        "origLabel": "C",
        "text": "Defender que o governo trabalhe com déficit primário alto por vários anos, porque gastar mais do que arrecada aquece a economia e faz a inflação cair com o tempo.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ LÓGICA INVERTIDA. Déficits primários recorrentes e sem financiamento geram desconfiança, desvalorizam a moeda nacional e empurram a inflação para cima.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Propor que o resultado primário deixe de ser divulgado mês a mês, para evitar que números ruins assustem o mercado e piorem o humor dos investidores.",
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
        "text": "Estimar uma arrecadação mais otimista que a esperada, para abrir espaço a novos gastos sem precisar cortar programas existentes.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ MAQUIAGEM ORÇAMENTÁRIA. Criar receitas fictícias gera déficits graves e descumprimento das metas fiscais aprovadas por lei.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "Fazer previsões realistas de receita, respeitar o limite de gastos e garantir primeiro as despesas obrigatórias.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ VOCÊ ACERTOU! (PLANEJAMENTO E RESPONSABILIDADE FISCAL) O orçamento é a peça central da gestão pública. Estimativas precisas e realistas evitam contingenciamentos drásticos e paralisia de serviços essenciais.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "Deixar de fora do orçamento parte dos gastos com a dívida pública, para o saldo final parecer mais equilibrado ao Congresso.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ FALTA DE TRANSPARÊNCIA. A omissão de despesas públicas fere os princípios da publicidade, universalidade e sinceridade orçamentária.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Atrasar o envio do projeto ao Congresso e ir definindo os gastos ao longo do ano, conforme as necessidades forem surgindo.",
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
        "text": "Nenhum, porque o estádio vai gerar empregos na obra e, portanto, o dinheiro não foi perdido para a sociedade.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ NEGAÇÃO DA ESCASSEZ. Recursos são escassos. Todo gasto governamental possui um custo de oportunidade implícito.",
        "points": 0
      },
      {
        "origLabel": "B",
        "text": "As creches, os hospitais, o saneamento e as escolas que deixaram de ser feitos com os mesmos R$ 10 bilhões.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ COMPREENSÃO DO CUSTO DE OPORTUNIDADE! Na gestão pública e na vida pessoal, cada escolha financeira significa abrir mão de outra oportunidade. O bom gestor prioriza o investimento de maior retorno social.",
        "points": 10
      },
      {
        "origLabel": "C",
        "text": "O lucro que o estádio vai gerar com ingressos e eventos, que deve compensar os R$ 10 bilhões em poucos anos.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ ILUSÃO DE RETORNO. Estádios sem demanda local transformam-se em \"elefantes brancos\" com custos de manutenção altíssimos pagos pelo contribuinte.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Os R$ 10 bilhões gastos na obra, já que custo de oportunidade é o valor total pago pelo projeto escolhido.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ ABSURDO CONCEITUAL. Custo de oportunidade mede o benefício da alternativa sacrificada, e não o valor pago pela opção escolhida.",
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
        "text": "Escolher pessoas com mais de 35 anos, notável saber jurídico e reputação ilibada, e submeter os nomes à aprovação do Senado.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ VOCÊ ACERTOU! (EQUILÍBRIO ENTRE OS PODERES) A indicação é uma prerrogativa do Presidente, mas depende obrigatoriamente do controle e da aprovação da maioria absoluta do Senado Federal (freios e contrapesos).",
        "points": 10
      },
      {
        "origLabel": "B",
        "text": "Indicar e nomear os novos ministros diretamente, pois a escolha para o STF é uma atribuição exclusiva do Presidente.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ CONCENTRAÇÃO DE PODER. O Presidente não possui poder unipessoal para empossar ministros do STF sem o aval do Poder Legislativo.",
        "points": 0
      },
      {
        "origLabel": "C",
        "text": "Submeter os nomes a uma votação entre os governadores dos estados, para garantir equilíbrio entre as regiões do país.",
        "type": "wrong",
        "icon": "❌",
        "feedback": "❌ ERRO CONSTITUCIONAL. A Constituição não prevê participação de governadores no processo de escolha de ministros da Suprema Corte.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Nomear os indicados por um período de experiência, confirmando no cargo só quem mostrar bom desempenho no tribunal.",
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
        "text": "Contas equilibradas com dívida sob controle, inflação baixa, acesso a educação e crédito consciente, bom ambiente para negócios e população bem informada sobre dinheiro.",
        "type": "correct",
        "icon": "✅",
        "feedback": "✅ EXCELÊNCIA NA LIDERANÇA NACIONAL E CIDADANIA! O verdadeiro papel da Presidência é construir fundamentos econômicos sólidos que permitam ao cidadão trabalhar, poupar, investir e prosperar com estabilidade e liberdade financeira.",
        "points": 10
      },
      {
        "origLabel": "B",
        "text": "Muitos programas novos bancados por dívida, preços congelados por decreto para conter a inflação e a promessa de que o governo cuidaria sozinho das necessidades de todos.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 COLAPSO FISCAL E SOCIAL. O populismo econômico gera um momento de euforia fictícia seguido por anos de crise, inflação e empobrecimento coletivo.",
        "points": 0
      },
      {
        "origLabel": "C",
        "text": "Proteção máxima à indústria nacional com fronteiras fechadas, controle estatal das principais empresas e menos espaço para a iniciativa privada competir.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 PARALISIA E TOTALITARISMO ECONÔMICO. Eliminar a iniciativa privada e isolar o país destrói a riqueza e a capacidade de escolha da sociedade.",
        "points": 0
      },
      {
        "origLabel": "D",
        "text": "Muitas festas e campanhas de propaganda, estatísticas ajustadas para parecerem melhores e benefícios anunciados sem dinheiro garantido para conseguir pagá-los.",
        "type": "wrong",
        "icon": "🚨",
        "feedback": "🚨 DESASTRE INSTITUCIONAL. Maquiar a realidade e queimar recursos em frivolidades liquida o futuro do país e empobrece a população.",
        "points": 0
      }
    ]
  }
];
