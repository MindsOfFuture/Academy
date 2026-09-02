/* ============================================================
   CONTEÚDO DO PROTÓTIPO — TUDO MOCK / ILUSTRATIVO
   Na versão real, cada grupo da disciplina preenche uma planilha
   e ela vira este arquivo em JSON, sem mexer no código.
   ============================================================ */

export type TipoPergunta = "escolha" | "escala" | "texto" | "numero" | "multi";
export type Pergunta = {
  id: string;
  p: string;
  ajuda: string;
  tipo: TipoPergunta;
  opcoes?: string[];
  placeholder?: string;
  obrigatorio?: boolean;
};
export type RespostaEtapa = {
  titulo?: string;
  texto?: string;
  alerta: string;
  proximo: string;
  encaminha?: { texto: string; fonte: string };
};
export type Etapa = {
  id: number;
  icone: string;
  grupo: string;
  titulo: string;
  resumo: string;
  cor: string;
  intro: string;
  perguntas: Pergunta[];
  calculo?: "preco" | "caixa";
  resposta: RespostaEtapa;
};

export const APP = {
  nome: "Primeiro Passo",
  tagline: "apoio a quem está começando",
  aviso:
    "Conteúdo de demonstração. O app oferece apoio educacional: as estimativas dependem do que você informa e não garantem resultados. Regras de registro, impostos e licenças devem ser confirmadas em fontes oficiais e com profissionais habilitados.",
};

/* Tipos de campo suportados pelo protótipo:
   escolha  -> botões de opção
   escala   -> 1 a 5 em bolinhas
   texto    -> campo livre curto
   numero   -> campo numérico (usado nos cálculos)
   multi    -> várias opções ao mesmo tempo
*/

export const ETAPAS: Etapa[] = [
  /* ---------------------------------------------------------- 1 */
  {
    id: 1, icone: "🌱", grupo: "Grupo 1",
    titulo: "Sua ideia e você",
    resumo: "O que você quer fazer, com quanto tempo e quanto pode investir.",
    cor: "#684A97",
    intro: "Antes do negócio, vamos olhar para você. Não existe resposta certa aqui.",
    perguntas: [
      { id: "estagio", p: "Como está sua ideia hoje?", ajuda: "Vale vender para vizinhos ou por encomenda.",
        tipo: "escolha", opcoes: ["Só na cabeça", "Já vendo às vezes", "Já é minha renda", "Não sei dizer"] },
      { id: "oque", p: "O que você pretende vender?", ajuda: "Em poucas palavras, do seu jeito.",
        tipo: "texto", placeholder: "ex.: bolos caseiros por encomenda" },
      { id: "tempo", p: "Quanto tempo por semana você tem?", ajuda: "Seja realista com o que sobra do resto.",
        tipo: "escolha", opcoes: ["Poucas horas", "Meio período", "Tempo integral", "Não sei ainda"] },
      { id: "confianca", p: "O quanto você se sente preparado hoje?", ajuda: "1 é bem inseguro, 5 é bem preparado.",
        tipo: "escala" },
    ],
    resposta: {
      titulo: "Seu retrato inicial",
      texto: "Você está no começo da jornada — o que é um bom lugar para testar antes de gastar. Guarde o que já tem (tempo, habilidade, equipamento) e o que ainda precisa descobrir.",
      alerta: "Gostar da ideia não é o mesmo que ter clientes. As próximas etapas procuram sinais de que existe gente disposta a pagar.",
      proximo: "Anote seus recursos, suas restrições e suas dúvidas antes de seguir.",
    },
  },

  /* ---------------------------------------------------------- 2 */
  {
    id: 2, icone: "🧍", grupo: "Grupo 2",
    titulo: "Quem são seus clientes",
    resumo: "Para quem você vai vender e o que essas pessoas precisam.",
    cor: "#E8473A",
    intro: "Cliente não é 'todo mundo'. Vamos afinar para quem você fala primeiro.",
    perguntas: [
      { id: "publico", p: "Quem compraria de você primeiro?", ajuda: "Pense em pessoas reais que você conhece.",
        tipo: "escolha", opcoes: ["Vizinhos e conhecidos", "Colegas de trabalho", "Pessoas da internet", "Outros negócios"] },
      { id: "problema", p: "Que problema você resolve para essa pessoa?", ajuda: "O que ela ganha ou deixa de sofrer.",
        tipo: "texto", placeholder: "ex.: não tem tempo de fazer o bolo da festa" },
      { id: "conversou", p: "Você já conversou com possíveis clientes?", ajuda: "Conversa de verdade, sem tentar vender.",
        tipo: "escolha", opcoes: ["Ainda não", "Com 1 ou 2 pessoas", "Com várias pessoas"] },
    ],
    resposta: {
      titulo: "O que dá para dizer sobre seus clientes",
      texto: "Você já tem uma hipótese de público. O próximo movimento é sair da suposição e ouvir essas pessoas com perguntas abertas.",
      alerta: "Elogio de amigo não comprova venda. Procure comportamento: pediu orçamento, reservou, indicou ou pagou.",
      proximo: "Converse com 3 pessoas do seu público e anote o que elas fazem hoje para resolver isso.",
    },
  },

  /* ---------------------------------------------------------- 3 */
  {
    id: 3, icone: "🔎", grupo: "Grupo 3",
    titulo: "Mercado e concorrência",
    resumo: "Quem já faz parecido, por qual preço e onde.",
    cor: "#0E5187",
    intro: "Concorrente não é só quem vende igual — é tudo que o cliente faria no seu lugar.",
    perguntas: [
      { id: "conhece", p: "Você conhece quem já faz algo parecido?", ajuda: "Perto de você ou pela internet.",
        tipo: "escolha", opcoes: ["Sim, vários", "Um ou dois", "Não conheço ninguém"] },
      { id: "canais", p: "Onde essas pessoas vendem?", ajuda: "Pode marcar mais de um.",
        tipo: "multi", opcoes: ["WhatsApp", "Instagram", "Loja física", "Feira", "Indicação", "Não sei"] },
      { id: "preco_conc", p: "Quanto cobram, mais ou menos? (R$)", ajuda: "Se não souber, deixe em branco e pesquise depois.",
        tipo: "numero", placeholder: "ex.: 45" },
    ],
    resposta: {
      titulo: "Seu mapa de mercado",
      texto: "O preço que você observa é informação de mercado, não o seu cálculo. Serve para entender o que o cliente já está acostumado a pagar.",
      alerta: "Se você não achou concorrente nenhum, desconfie: ou o mercado é pequeno, ou você ainda não procurou nos lugares certos.",
      proximo: "Monte uma tabelinha com 3 concorrentes: o que vendem, por quanto e o que dizem nas avaliações.",
    },
  },

  /* ---------------------------------------------------------- 4 */
  {
    id: 4, icone: "🧪", grupo: "Grupo 4",
    titulo: "Testar antes de montar tudo",
    resumo: "Como experimentar a ideia gastando pouco.",
    cor: "#30C2DB",
    intro: "Teste pequeno e reversível vale mais que plano grande no papel.",
    perguntas: [
      { id: "teste", p: "Qual teste pequeno você faria essa semana?", ajuda: "Algo que cabe em poucos dias.",
        tipo: "escolha", opcoes: ["Oferecer para 10 conhecidos", "Anunciar e ver quem responde", "Fazer uma amostra grátis", "Ainda não sei"] },
      { id: "limite", p: "Quanto você aceita gastar nesse teste? (R$)", ajuda: "Defina antes do resultado, não depois.",
        tipo: "numero", placeholder: "ex.: 150" },
      { id: "sucesso", p: "O que seria um bom sinal?", ajuda: "Algo observável, não 'acharam legal'.",
        tipo: "escolha", opcoes: ["Alguém pagar", "Alguém reservar", "Alguém pedir orçamento", "Alguém indicar"] },
    ],
    resposta: {
      titulo: "Seu primeiro experimento",
      texto: "Um bom teste tem prazo, limite de gasto e um sinal claro de sucesso definido antes de começar.",
      alerta: "Não comprometa o dinheiro das contas de casa no teste. Se o limite dói, ele está alto demais.",
      proximo: "Marque uma data para rodar esse teste e anote o resultado, mesmo que seja negativo.",
    },
  },

  /* ---------------------------------------------------------- 5 — CALCULADORA */
  {
    id: 5, icone: "🧮", grupo: "Grupo 5",
    titulo: "Custos, preço e margem",
    resumo: "Quanto custa produzir e por quanto vale a pena vender.",
    cor: "#684A97",
    intro: "Vamos estimar um preço a partir dos seus custos. É um cenário para pensar, não uma promessa.",
    calculo: "preco",
    perguntas: [
      { id: "custo", p: "Quanto custa produzir uma unidade? (R$)", ajuda: "Material, embalagem, taxa e perda.",
        tipo: "numero", placeholder: "ex.: 8,00", obrigatorio: true },
      { id: "margem", p: "Que margem de lucro você quer? (%)", ajuda: "Quanto sobra para você em cima do custo.",
        tipo: "numero", placeholder: "ex.: 40", obrigatorio: true },
      { id: "fixas", p: "Suas despesas fixas por mês (R$)", ajuda: "Luz, aluguel, internet, o que paga todo mês.",
        tipo: "numero", placeholder: "ex.: 600" },
    ],
    resposta: {
      titulo: "Sobre essa estimativa",
      alerta: "Este cálculo usa só os números que você informou. O preço que o cliente aceita pode ser outro — teste antes de fechar.",
      proximo: "Compare com o preço dos concorrentes da etapa 3 e veja se faz sentido para o seu cliente.",
    },
  },

  /* ---------------------------------------------------------- 6 */
  {
    id: 6, icone: "💧", grupo: "Grupo 6",
    titulo: "Dinheiro para começar e girar",
    resumo: "O que comprar agora e quanto precisa para manter de pé.",
    cor: "#E8473A",
    intro: "Vender não é o mesmo que ter dinheiro em caixa. Vamos separar as duas coisas.",
    calculo: "caixa",
    perguntas: [
      { id: "investimento", p: "Quanto precisa para começar? (R$)", ajuda: "Equipamento, estoque inicial, o que for de uma vez.",
        tipo: "numero", placeholder: "ex.: 2000", obrigatorio: true },
      { id: "gasto_mes", p: "Quanto sai por mês para manter? (R$)", ajuda: "Contas, material, tudo que se repete.",
        tipo: "numero", placeholder: "ex.: 800", obrigatorio: true },
      { id: "recebe", p: "Em quanto tempo o cliente costuma pagar?", ajuda: "Dinheiro na hora, cartão, prazo.",
        tipo: "escolha", opcoes: ["Na hora", "Em até 30 dias", "Mais de 30 dias", "Varia muito"] },
    ],
    resposta: {
      titulo: "Sobre seu fôlego de caixa",
      alerta: "Um negócio pode vender bem e mesmo assim ficar sem dinheiro, se paga antes de receber. Fique de olho no prazo.",
      proximo: "Separe o que é 'essencial agora' do que pode esperar o primeiro teste dar certo.",
    },
  },

  /* ---------------------------------------------------------- 7 */
  {
    id: 7, icone: "⚙️", grupo: "Grupo 7",
    titulo: "Como o negócio vai funcionar",
    resumo: "Fornecedores, quanto você entrega e a qualidade.",
    cor: "#0E5187",
    intro: "Prometer mais do que consegue entregar é um jeito rápido de perder cliente.",
    perguntas: [
      { id: "capacidade", p: "Quantos pedidos consegue atender por semana?", ajuda: "Contando o tempo que você tem de verdade.",
        tipo: "escolha", opcoes: ["Até 5", "De 6 a 20", "Mais de 20", "Não sei ainda"] },
      { id: "gargalo", p: "O que mais te atrasaria hoje?", ajuda: "O ponto que trava tudo quando aperta.",
        tipo: "escolha", opcoes: ["Meu tempo", "Equipamento", "Fornecedor", "Espaço", "Não sei"] },
      { id: "sozinho", p: "Você faria tudo sozinho no começo?", ajuda: "Vale contar ajuda de família.",
        tipo: "escolha", opcoes: ["Sim, sozinho", "Com uma ajuda", "Com sócio"] },
    ],
    resposta: {
      titulo: "Seu limite de entrega",
      texto: "Saber sua capacidade evita vender o que não dá para entregar — e ajuda a decidir quando é hora de crescer.",
      alerta: "Se o gargalo é o seu tempo, crescer em vendas sem resolver isso só piora a qualidade.",
      proximo: "Simule um pedido do começo ao fim e cronometre quanto tempo leva.",
    },
  },

  /* ---------------------------------------------------------- 8 */
  {
    id: 8, icone: "📋", grupo: "Grupo 8",
    titulo: "Formalização",
    resumo: "Caminhos possíveis para regularizar — sem decidir por você.",
    cor: "#684A97",
    intro: "Aqui o app organiza as perguntas certas. Quem decide o enquadramento é você, com apoio profissional.",
    perguntas: [
      { id: "atividade", p: "Você sabe exatamente qual atividade vai exercer?", ajuda: "O que você produz, vende ou faz.",
        tipo: "escolha", opcoes: ["Sim, sei bem", "Mais ou menos", "Ainda não"] },
      { id: "socio", p: "Pretende ter sócio ou funcionário no começo?", ajuda: "Isso muda os caminhos possíveis.",
        tipo: "escolha", opcoes: ["Não, só eu", "Talvez", "Sim"] },
      { id: "faturamento", p: "Quanto imagina faturar por mês? (R$)", ajuda: "Um chute é suficiente por enquanto.",
        tipo: "numero", placeholder: "ex.: 3000" },
    ],
    resposta: {
      titulo: "Um caminho para pesquisar (não é uma decisão)",
      texto: "Com o que você respondeu, o MEI pode ser uma hipótese a investigar. Antes de decidir, confirme se a sua atividade é permitida e as demais condições em fonte oficial.",
      alerta: "O app não faz o seu enquadramento e não substitui um contador. Regras de imposto e registro mudam com o tempo.",
      proximo: "Descreva sua atividade em detalhe e leve essa descrição a um contador ou ao Sebrae.",
      encaminha: { texto: "Confira as atividades permitidas ao MEI no site oficial:", fonte: "Portal do Empreendedor — gov.br/mei" },
    },
  },

  /* ---------------------------------------------------------- 9 */
  {
    id: 9, icone: "🏠", grupo: "Grupo 9",
    titulo: "Licenças e endereço",
    resumo: "O que precisa checar antes de abrir as portas.",
    cor: "#E8473A",
    intro: "Ter CNPJ não significa que já pode funcionar. Depende da atividade e do endereço.",
    perguntas: [
      { id: "onde", p: "Onde o negócio vai funcionar?", ajuda: "O lugar muda as exigências.",
        tipo: "escolha", opcoes: ["Na minha casa", "Ponto alugado", "Só na rua/entrega", "Só pela internet"] },
      { id: "tipo_ativ", p: "Sua atividade envolve algum destes?", ajuda: "Pode marcar mais de um.",
        tipo: "multi", opcoes: ["Alimentos", "Saúde ou estética", "Crianças", "Produtos químicos", "Nenhum destes"] },
      { id: "checou", p: "Já checou as regras do seu endereço?", ajuda: "Prefeitura, condomínio, zoneamento.",
        tipo: "escolha", opcoes: ["Ainda não", "Comecei a olhar", "Sim, já checei"] },
    ],
    resposta: {
      titulo: "O que verificar antes",
      texto: "As exigências variam conforme o que você faz e onde faz. O app aponta o caminho da verificação — quem confirma é o órgão responsável.",
      alerta: "Atividade com alimentos, saúde ou crianças costuma ter exigência extra. Verifique antes de investir no ponto.",
      proximo: "Consulte a prefeitura da sua cidade sobre viabilidade do endereço para a sua atividade.",
      encaminha: { texto: "Comece pela consulta de viabilidade:", fonte: "Prefeitura da sua cidade / Redesim" },
    },
  },

  /* ---------------------------------------------------------- 10 */
  {
    id: 10, icone: "📣", grupo: "Grupo 10",
    titulo: "Comunicar e planejar",
    resumo: "Como explicar o negócio e montar os próximos 90 dias.",
    cor: "#30C2DB",
    intro: "Última etapa: transformar tudo isso em uma frase clara e em próximos passos.",
    perguntas: [
      { id: "frase", p: "Explique seu negócio em uma frase", ajuda: "Para quem é, o que oferece e o que a pessoa ganha.",
        tipo: "texto", placeholder: "ex.: bolos caseiros por encomenda para festas no meu bairro" },
      { id: "canal", p: "Onde você vai divulgar primeiro?", ajuda: "Escolha um só para começar bem feito.",
        tipo: "escolha", opcoes: ["WhatsApp", "Instagram", "Boca a boca", "Panfleto no bairro"] },
      { id: "prioridade", p: "Qual seu próximo passo mais importante?", ajuda: "O que destrava o resto.",
        tipo: "escolha", opcoes: ["Falar com clientes", "Fazer o teste", "Acertar os preços", "Cuidar da formalização"] },
    ],
    resposta: {
      titulo: "Seu ponto de partida",
      texto: "Com uma frase clara e um canal só, fica mais fácil começar. Plano de 90 dias é feito de poucas prioridades, não de uma lista enorme.",
      alerta: "Divulgar em todo lugar ao mesmo tempo costuma cansar mais do que vender. Comece por um canal.",
      proximo: "Escolha três prioridades para os próximos 90 dias e marque uma data para revisar.",
    },
  },
];

/* Mensagens do fechamento, conforme quantas etapas a pessoa completou */
export const FECHAMENTO = {
  parcial: "Você já avançou bastante. Pode voltar quando quiser — o que você respondeu fica salvo neste aparelho.",
  completo: "Você percorreu as 10 etapas. Abaixo está o resumo do que você montou.",
};

export const STORAGE_KEY = "academy-primeiro-passo-v1";
