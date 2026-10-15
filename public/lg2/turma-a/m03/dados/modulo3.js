/* Módulo 3 (Turma A): 22 perguntas reescritas pelo grupo (abas "Perguntas reescritas" e
   "Caminhos por resposta"). Mapa, base e conexões vêm do template do grupo. */
window.MODULO3 = {
 "origem": "m03_reescritas.xlsx (Perguntas reescritas + Caminhos por resposta)",
 "modulo": {
  "numero": "3",
  "nome": "Mercado, concorrentes e oportunidades",
  "versao": "0.1",
  "data": "10/09/2026",
  "turma": "Turma de 24",
  "tutora": "Guilherme",
  "integrantes": [
   "Ana Luiza Marcelino",
   "Maria Clara Sales",
   "Maykon Penedo"
  ]
 },
 "mapa": {
  "objetivo": "Ajudar o usuário a identificar concorrentes diretos, indiretos e substitutos do seu negócio, entender preços e canais praticados no mercado, e reconhecer oportunidades e riscos antes de avançar com a ideia.",
  "usuario": "Pessoa que já consegue descrever uma ideia de negócio, mas ainda não conhece bem o mercado em que pretende atuar ou fez apenas uma pesquisa informal, sem registrar fontes e datas.",
  "decisoes": "Se existe espaço real de diferenciação no mercado observado.\nSe a faixa de preço praticada é compatível com a ideia do usuário.\nSe há sinais de mercado saturado, em crescimento ou pouco explorado na região/canal escolhido.\nO módulo organiza essas evidências; quem decide se segue, ajusta ou abandona a ideia é o usuário.",
  "nao_faz": "Não afirma que existe ou não existe concorrência suficiente para o negócio dar certo.\nNão garante lucro ou sucesso com base na análise de mercado.\nNão inventa concorrentes, preços, avaliações ou dados de mercado.\nNão guarda dados identificáveis de concorrentes reais além do que é necessário para a análise do próprio usuário.",
  "mensagem_limite": " O app oferece apoio educacional básico. As estimativas dependem dos dados fornecidos e não garantem resultados. Regras de registro, tributação, licenciamento e exercício profissional devem ser confirmadas em fontes oficiais e com profissionais habilitados.",
  "ter_em_maos": "A descrição da própria ideia de negócio.\nAcesso a celular com internet, mesmo que limitada, para pesquisar no Google Maps, Instagram e avaliações.\nDisponibilidade para observar alguns concorrentes/substitutos na própria região ou canal de venda pretendido.",
  "entrega": "Roteiro de pesquisa, indicando onde e como buscar concorrentes conforme o tipo de negócio e canal do usuário.\nModelo de tabela de concorrentes, com nome, tipo (direto/indireto/substituto), canal, preço observado, diferencial e fonte/data.\nPróximo passo indicado, direcionando para o módulo de Oferta e experimentação (Grupo 4), para completar a pesquisa, ou para fonte externa se necessário.",
  "encaminhamentos": "Nenhum encaminhamento a profissional regulado é típico deste módulo.",
  "caso_real": "Acompanhar o empreendedor real serve para testar se o roteiro de pesquisa funciona na prática: quais dúvidas ele teve ao procurar concorrentes, se encontrou dificuldade em registrar informações e analisá-las. Servindo para aprimorar o módulo.",
  "riscos": "Os principais riscos de conteúdo do módulo estão ligados a promessas de resultado e a recomendações fixas, que não fazem sentido na realidade específica de cada usuário. Esses riscos são evitados ao reunir o máximo de informações possível para orientar a pesquisa do usuário de forma eficaz, sem enviesar decisões nem levá-lo a conclusões precipitadas, o módulo apenas mostra o caminho e conduz à análise, deixando a interpretação final a cargo do próprio usuário."
 },
 "conexoes": [
  {
   "modulo": "2.0",
   "nome": "Clientes, necessidades e comportamento de compra",
   "recebe": "Perfil do cliente ideal, hábitos de consumo e critérios de decisão de compra",
   "envia": "Canais e faixas de preço praticados pelos concorrentes locais/digitais",
   "combinado": "Não",
   "obs": "Alinhar público, região e termos usados para descrever a necessidade."
  },
  {
   "modulo": "1.0",
   "nome": "Perfil do empreendedor e definição da ideia",
   "recebe": "Descrição da ideia/produto",
   "envia": "Sinalização de mercado. Ex: saturado ou pouco explorado",
   "combinado": "Não",
   "obs": "Alinhar a viabilidade da sinalização de mercado, e para qual módulo seria útil"
  },
  {
   "modulo": "4.0",
   "nome": "Produto, proposta de valor e teste da ideia",
   "recebe": "Hipótese de oferta, benefício e diferencial que precisam ser comparados.",
   "envia": "Preços observados, padrões de oferta, reclamações recorrentes e diferenças que merecem teste.",
   "combinado": "Não",
   "obs": "O Módulo 3 fornece informações de mercado que ajudam o Módulo 4 a definir o que deve ser testado na oferta."
  },
  {
   "modulo": "10.0",
   "nome": "Comunicação, vendas, pessoas e plano de ação",
   "recebe": "Mensagem, canal e diferencial que o usuário pretende testar.",
   "envia": "Canais, formas de comunicação e critérios de escolha observados no mercado.",
   "combinado": "Não",
   "obs": "Confirmar termos comuns entre os módulos."
  }
 ],
 "base": [
  {
   "codigo": "M3.BT01",
   "conceito": "Mercado",
   "definicao": "É o espaço (físico ou digital) onde a sua oferta encontra a necessidade do cliente. Trata-se do ambiente em que compradores e vendedores trocam produtos ou serviços por dinheiro.",
   "porque": "Entender o mercado evita oferecer um produto sem ter certeza de que existe alguém disposto a pagar por ele, e ajuda a alinhar a proposta do negócio a uma necessidade real do público.",
   "exemplo": "Quem vende bolos por encomenda atua no mercado de confeitaria da sua região e também no digital (Instagram, WhatsApp).",
   "tipo_fonte": "Acadêmica",
   "fonte": "MADY, Eliane Batista. Pesquisa de mercado. 1. ed. Curitiba: Intersaberes, 2014.",
   "data": null
  },
  {
   "codigo": "M3.BT02",
   "conceito": "Concorrente direto",
   "definicao": "Negócio que vende produto ou serviço semelhante ao seu para o mesmo público.",
   "porque": "É com ele que o cliente costuma comparar você na hora de decidir; conhecer a oferta e o preço dele mostra diferenças e semelhanças.",
   "exemplo": "Uma confeitaria do bairro que também vende bolos de aniversário.",
   "tipo_fonte": "Acadêmica",
   "fonte": "MADY, Eliane Batista. Pesquisa de mercado. 1. ed. Curitiba: Intersaberes, 2014.",
   "data": null
  },
  {
   "codigo": "M3.BT03",
   "conceito": "Concorrente indireto",
   "definicao": "Negócio que resolve a mesma necessidade do cliente de outra forma.",
   "porque": "Quem olha só para quem vende igual pode deixar de ver as alternativas que o cliente realmente usa.",
   "exemplo": "Para a necessidade \"ter bolo na festa\": o doce de padaria ou a sobremesa do supermercado.",
   "tipo_fonte": "Institucional",
   "fonte": "Sebrae PR, \"Como criar uma rotina simples de análise da concorrência\"",
   "data": null
  },
  {
   "codigo": "M3.BT04",
   "conceito": "Substituto",
   "definicao": "Alternativa que o cliente pode escolher no lugar do seu produto, às vezes mudando o hábito, sem comprar nada parecido.",
   "porque": "Ajuda a responder: o que o cliente faria se o seu negócio não existisse?",
   "exemplo": "Em vez de encomendar bolo, a família decide fazer a comemoração com doces.",
   "tipo_fonte": "Outra (justificar)",
   "data": null
  },
  {
   "codigo": "M3.BT05",
   "conceito": "Concorrente de referência",
   "definicao": "Negócio que faz algo que você admira, mesmo sem disputar exatamente o mesmo cliente.",
   "porque": "Serve de inspiração para ver boas práticas de atendimento, comunicação e organização.",
   "exemplo": "Uma confeitaria de outra cidade com ótimo atendimento pelo WhatsApp.",
   "tipo_fonte": "Institucional",
   "fonte": "Sebrae PR, \"Como criar uma rotina simples de análise da concorrência\"",
   "data": null
  },
  {
   "codigo": "M3.BT06",
   "conceito": "Preço observado",
   "definicao": "Preço que você vê em cardápio, catálogo, perfil, loja ou marketplace de outro negócio, em uma data específica.",
   "porque": "É informação de mercado para comparar. Não diz quanto você deve cobrar, porque custos, tamanho e proposta de cada negócio são diferentes.",
   "exemplo": "Exemplo fictício: bolo de 1 kg anunciado por R$ 30 em um perfil, visto em 01/10, com link e data anotados.",
   "tipo_fonte": "Institucional",
   "fonte": "Sebrae PR, \"Como criar uma rotina simples de análise da concorrência\"; Sebrae, \"Como pesquisar a concorrência\" (Biblioteca Sebrae)",
   "data": null
  },
  {
   "codigo": "M3.BT07",
   "conceito": "Canal de venda",
   "definicao": "Meio pelo qual o negócio recebe pedidos e entrega: loja física, Instagram, WhatsApp, site ou marketplace.",
   "porque": "O canal mostra onde o cliente encontra a oferta e quem pode ser concorrente no mesmo lugar.",
   "exemplo": "Um negócio que só aceita pedidos por WhatsApp e entrega no bairro.",
   "tipo_fonte": "Institucional",
   "fonte": "Sebrae PR, \"Como criar uma rotina simples de análise da concorrência\"",
   "data": null
  },
  {
   "codigo": "M3.BT08",
   "conceito": "Avaliações e reclamações de clientes",
   "definicao": "Notas e comentários de clientes sobre um negócio, que mostram o que agrada e o que incomoda.",
   "porque": "Elogios e reclamações que se repetem são pistas do que o cliente valoriza. Poucos comentários não falam por todos os clientes.",
   "exemplo": "Vários comentários dizendo que o pedido demorou a chegar.",
   "tipo_fonte": "Institucional",
   "fonte": "Sebrae PR, \"Como criar uma rotina simples de análise da concorrência\"",
   "data": null
  },
  {
   "codigo": "M3.BT09",
   "conceito": "Diferencial",
   "definicao": "O que o seu negócio faz de modo diferente e que o cliente percebe como valor, em comparação às alternativas.",
   "porque": "Sem diferencial claro, o cliente tende a decidir só pelo preço. O diferencial precisa ser testado com clientes.",
   "exemplo": "Prazo de entrega informado com clareza, quando os concorrentes costumam atrasar.",
   "tipo_fonte": "Institucional",
   "fonte": "Sebrae PR, \"Como criar uma rotina simples de análise da concorrência\"",
   "data": null
  },
  {
   "codigo": "M3.BT10",
   "conceito": "Oportunidade (lacuna) de mercado",
   "definicao": "Necessidade que os clientes têm e que os negócios existentes atendem mal ou não atendem.",
   "porque": "É uma hipótese a testar, não prova de que haverá vendas. Ajuda a decidir o que verificar com clientes antes de investir.",
   "exemplo": "Se clientes reclamam da demora dos concorrentes, um negócio pode testar prazos mais claros e acompanhamento do pedido.",
   "tipo_fonte": "Institucional",
   "fonte": "Sebrae PR, \"Como criar uma rotina simples de análise da concorrência\"",
   "data": null
  },
  {
   "codigo": "M3.BT11",
   "conceito": "Sazonalidade",
   "definicao": "Variação da procura por um produto ou serviço em certas épocas do ano.",
   "porque": "Afeta preço, estoque, caixa e capacidade de atendimento. Quem conhece as épocas de alta e baixa consegue se planejar.",
   "exemplo": "Exemplo ilustrativo: sorvete tende a vender mais em meses quentes.",
   "tipo_fonte": "Institucional",
   "fonte": "Sebrae MS, e-book \"Planejamento de Vendas\" (sazonalidade)",
   "data": null
  },
  {
   "codigo": "M3.BT12",
   "conceito": "Concorrência no ambiente digital",
   "definicao": "Quem vende pela internet pode ter concorrentes de outras cidades, inclusive dentro de marketplaces, mesmo vendendo localmente.",
   "porque": "Muda onde procurar concorrentes e o que comparar: alcance, entrega e preço no canal digital.",
   "exemplo": "Um negócio de bairro que também aparece em um marketplace disputa o cliente com vendedores de outras regiões.",
   "tipo_fonte": "Institucional",
   "fonte": "Agência Sebrae de Notícias, \"Falta de clientes é a principal preocupação dos empresários...\" (09/08/2024)",
   "data": null
  },
  {
   "codigo": "M3.BT13",
   "conceito": "Pesquisa de mercado",
   "definicao": "Reunir informações sobre clientes, concorrentes e tendências para apoiar decisões do negócio.",
   "porque": "Reduz o risco de decidir só por palpite. Vale para quem está começando e para quem já tem negócio.",
   "exemplo": "Observar concorrentes, conversar com possíveis clientes e acompanhar mudanças de comportamento do consumidor.",
   "tipo_fonte": "Institucional",
   "fonte": "Agência Sebrae de Notícias, \"Falta de clientes é a principal preocupação dos empresários...\" (09/08/2024)",
   "data": null
  }
 ],
 "perguntas": [
  {
   "codigo": "M3.P01",
   "bloco": "Bloco 1: Oportunidades do Negócio",
   "titulo": "Conceito do Mercado",
   "pergunta": "Com suas palavras, em que ramo você trabalha e o que você vende? (Ex.: \"Vendo marmitas para trabalhadores do bairro\")",
   "tipo": "Texto livre",
   "caminhos": [
    {
     "opcao": "Resposta preenchida",
     "tipo": "Nenhum",
     "texto": "—"
    },
    {
     "opcao": "Resposta vazia ou muito curta",
     "tipo": "Dica",
     "texto": "Diga o que você vende e para quem. Ex.: \"Vendo marmitas para trabalhadores do bairro\"."
    },
    {
     "opcao": "Não sei",
     "tipo": "Prompt de IA",
     "texto": "Mercado é o lugar, na rua ou na internet, onde quem vende encontra quem quer comprar. Prompt: \"Eu [descreva o que faz]. Me ajude a explicar em uma frase, em linguagem simples, em que ramo eu trabalho. Dê 3 exemplos de como outras pessoas descrevem esse ramo.\" Confira se a frase combina com o que você realmente faz."
    }
   ],
   "naosei": true
  },
  {
   "codigo": "M3.P02",
   "bloco": "Bloco 1: Oportunidades do Negócio",
   "titulo": "Busca por Novas Oportunidades",
   "pergunta": "Você está procurando novas formas de vender mais ou de crescer agora?",
   "tipo": "Seleção única",
   "caminhos": [
    {
     "opcao": "Sim",
     "tipo": "Nenhum",
     "texto": "—"
    },
    {
     "opcao": "Não",
     "tipo": "Nenhum",
     "texto": "—"
    }
   ],
   "opcoes": [
    "Sim",
    "Não"
   ],
   "naosei": false
  },
  {
   "codigo": "M3.P03",
   "bloco": "Bloco 1: Oportunidades do Negócio",
   "titulo": "Soluções Alternativas Conhecidas",
   "pergunta": "Se o seu cliente não comprar de você, o que ele pode comprar no lugar? (Ex.: quem vende bolo caseiro perde cliente para a padaria ou para o bolo de pote)",
   "tipo": "Texto livre",
   "caminhos": [
    {
     "opcao": "Resposta preenchida",
     "tipo": "Nenhum",
     "texto": "—"
    },
    {
     "opcao": "Resposta vazia ou muito curta",
     "tipo": "Dica",
     "texto": "Pense: se o cliente não comprasse de você, o que ele faria? Ex.: quem vende bolo caseiro perde cliente para a padaria."
    },
    {
     "opcao": "Não sei",
     "tipo": "Dica",
     "texto": "Tudo bem. Pense em onde o cliente compraria se você não existisse. Você pode voltar e preencher depois."
    }
   ],
   "naosei": true
  },
  {
   "codigo": "M3.P04",
   "bloco": "Bloco 1: Oportunidades do Negócio",
   "titulo": "Leitura de Oportunidades",
   "pergunta": "Você viu alguma novidade ou mudança recente que pode ajudar você a vender mais? (Ex.: mais gente comprando pelo WhatsApp, uma obra ou um evento novo perto de você)",
   "tipo": "Texto livre",
   "caminhos": [
    {
     "opcao": "Resposta preenchida",
     "tipo": "Nenhum",
     "texto": "—"
    },
    {
     "opcao": "Resposta vazia ou muito curta",
     "tipo": "Dica",
     "texto": "Conte uma novidade ou mudança recente. Ex.: mais gente comprando pelo WhatsApp, uma obra ou evento novo perto de você."
    },
    {
     "opcao": "Não sei",
     "tipo": "Prompt de IA",
     "texto": "Onde olhar: converse com clientes, veja as redes sociais e as novidades do bairro. Prompt: \"Eu vendo [produto ou serviço] em [cidade ou bairro]. Que mudanças recentes (jeito de comprar, tecnologia, eventos) podem ajudar quem vende isso? Separe o que é fato do que é suposição.\" Confira em fonte confiável ou pergunte a clientes."
    }
   ],
   "naosei": true
  },
  {
   "codigo": "M3.P05",
   "bloco": "Bloco 1: Oportunidades do Negócio",
   "titulo": "Avaliação da Oportunidade",
   "pergunta": "Por que você acredita que essa ideia pode dar certo no seu negócio?",
   "tipo": "Texto livre",
   "caminhos": [
    {
     "opcao": "Resposta preenchida",
     "tipo": "Nenhum",
     "texto": "—"
    },
    {
     "opcao": "Resposta vazia ou muito curta",
     "tipo": "Dica",
     "texto": "Conte o motivo: já tem clientes pedindo? Já viu essa ideia dar certo? Quanto custa começar?"
    },
    {
     "opcao": "Não sei",
     "tipo": "Prompt de IA",
     "texto": "Prompt: \"Minha ideia é [descreva a ideia]. Me faça 5 perguntas simples para eu descobrir se ela pode dar certo: se tem gente que compra, quanto custa começar e o que eu preciso ter.\" Responda cada pergunta com dados reais (clientes, preços, custos)."
    }
   ],
   "naosei": true
  },
  {
   "codigo": "M3.P06",
   "bloco": "Bloco 1: Oportunidades do Negócio",
   "titulo": "Plano de Ação da Oportunidade",
   "pergunta": "O que você já tem e o que ainda falta para colocar essa ideia em prática? (Ex.: dinheiro, equipamento, tempo, ajuda)",
   "tipo": "Texto livre",
   "caminhos": [
    {
     "opcao": "Já sei o que tenho e o que falta",
     "tipo": "Prompt de IA",
     "texto": "Prompt: \"Quero colocar em prática [ideia]. Já tenho [o que você tem]. Explique, em linguagem simples, o que ainda falta.\" Confira a lista com a sua realidade antes de decidir."
    },
    {
     "opcao": "Resposta vazia ou muito curta",
     "tipo": "Dica",
     "texto": "Pense em dinheiro, equipamento, tempo, licença e ajuda. O que você já tem? O que ainda falta?"
    },
    {
     "opcao": "Não sei",
     "tipo": "Prompt de IA",
     "texto": "Prompt: \"Quero colocar em prática [ideia]. O que normalmente é preciso (dinheiro, equipamento, tempo, licença, ajuda)? Liste em ordem do que fazer primeiro.\""
    }
   ],
   "naosei": true
  },
  {
   "codigo": "M3.P07",
   "bloco": "Bloco 1: Oportunidades do Negócio",
   "titulo": "Percepção de Riscos",
   "pergunta": "Existe alguma coisa que pode atrapalhar suas vendas? (Ex.: concorrente novo, preço dos insumos subindo, mudança de regra)",
   "tipo": "Texto livre",
   "caminhos": [
    {
     "opcao": "Resposta preenchida",
     "tipo": "Nenhum",
     "texto": "—"
    },
    {
     "opcao": "Resposta vazia ou muito curta",
     "tipo": "Dica",
     "texto": "Pense no que pode atrapalhar. Ex.: concorrente novo, preço dos insumos subindo, mudança de regra."
    },
    {
     "opcao": "Não sei",
     "tipo": "Prompt de IA",
     "texto": "Prompt: \"Eu vendo [produto ou serviço]. Quais riscos comuns podem atrapalhar as vendas de quem trabalha com isso? Diga também o que dá para fazer para se proteger.\""
    }
   ],
   "exemplos": [
    "concorrente novo",
    "preço dos insumos subindo",
    "queda nas vendas em certa época",
    "mudança de regra"
   ],
   "naosei": true
  },
  {
   "codigo": "M3.P08",
   "bloco": "Bloco 1: Oportunidades do Negócio",
   "titulo": "Tendências de Mercado",
   "pergunta": "Nos próximos anos, o que você acha que vai mudar na forma como as pessoas compram o que você vende? (Ex.: mais pedidos pelo celular, pagamento por Pix, novas regras)",
   "tipo": "Texto livre",
   "caminhos": [
    {
     "opcao": "Resposta preenchida",
     "tipo": "Nenhum",
     "texto": "—"
    },
    {
     "opcao": "Resposta vazia ou muito curta",
     "tipo": "Dica",
     "texto": "Pense em como as pessoas vão comprar daqui a alguns anos. Ex.: mais pedidos pelo celular, pagamento por Pix, novas regras."
    },
    {
     "opcao": "Não sei",
     "tipo": "Prompt de IA",
     "texto": "Prompt: \"Quais mudanças (tecnologia, jeito de comprar, regras) podem afetar quem vende [produto ou serviço] nos próximos anos? Explique de forma simples e diga o que é suposição.\" Confirme em fontes confiáveis, como o portal do Sebrae."
    }
   ],
   "naosei": true
  },
  {
   "codigo": "M3.P09",
   "bloco": "Bloco 2: Entender o Mercado e seus Clientes",
   "titulo": "Definição de Mercado Atendido",
   "pergunta": "Até onde você vende hoje? No seu bairro ou cidade, na sua região, no Brasil todo ou até fora do país?",
   "tipo": "Seleção única",
   "caminhos": [
    {
     "opcao": "No meu bairro e na minha cidade",
     "tipo": "Dica",
     "texto": "Seu foco é perto de você. Os concorrentes mais próximos tendem a ser os da mesma cidade."
    },
    {
     "opcao": "Na minha região (estado e cidades próximas)",
     "tipo": "Dica",
     "texto": "Você pretende atender várias cidades. Pense em como a entrega ou o atendimento vai chegar até elas."
    },
    {
     "opcao": "No Brasil todo",
     "tipo": "Dica",
     "texto": "Vender para o país todo costuma exigir pensar em frete, prazo de entrega e venda pela internet."
    },
    {
     "opcao": "Também fora do Brasil",
     "tipo": "Dica",
     "texto": "Vender para fora costuma ter regras próprias, como documentos e impostos. Vale pesquisar antes."
    }
   ],
   "opcoes": [
    "No meu bairro e na minha cidade",
    "Na minha região (estado e cidades próximas)",
    "No Brasil todo",
    "Também fora do Brasil"
   ],
   "naosei": false
  },
  {
   "codigo": "M3.P10",
   "bloco": "Bloco 2: Entender o Mercado e seus Clientes",
   "titulo": "Perfil de Clientes",
   "pergunta": "Quem mais compra de você (ou quem você gostaria que comprasse)? São pessoas comuns ou empresas?",
   "tipo": "Seleção única + campos",
   "caminhos": [
    {
     "opcao": "Pessoas comuns (consumidor final)",
     "tipo": "Nenhum",
     "texto": "—"
    },
    {
     "opcao": "Empresas",
     "tipo": "Nenhum",
     "texto": "—"
    },
    {
     "opcao": "Campos complementares incompletos",
     "tipo": "Dica",
     "texto": "Preencha o que você já sabe. O que ficar de fora dá para completar depois."
    },
    {
     "opcao": "Não sei",
     "tipo": "Prompt de IA",
     "texto": "Prompt: \"Eu vendo [produto ou serviço] em [cidade ou bairro]. Me ajude a descrever quem seria o meu cliente ideal: idade, renda, profissão, onde mora e o que ele precisa resolver.\""
    }
   ],
   "opcoes": [
    "Pessoas comuns (consumidor final)",
    "Empresas"
   ],
   "campos": {
    "Pessoas comuns (consumidor final)": [
     "Idade",
     "Renda",
     "Ocupação",
     "Onde mora",
     "O que precisa resolver (a dor)"
    ],
    "Empresas": [
     "Ramo",
     "Tamanho",
     "Equipe",
     "Local"
    ]
   },
   "naosei": true
  },
  {
   "codigo": "M3.P11",
   "bloco": "Bloco 2: Entender o Mercado e seus Clientes",
   "titulo": "Necessidade do Cliente",
   "pergunta": "Que problema ou vontade do seu cliente você resolve? (Ex.: falta de tempo para cozinhar, vontade de ficar bonita para uma festa)",
   "tipo": "Texto livre",
   "caminhos": [
    {
     "opcao": "Resposta preenchida",
     "tipo": "Nenhum",
     "texto": "—"
    },
    {
     "opcao": "Resposta vazia ou muito curta",
     "tipo": "Dica",
     "texto": "Pense no problema ou na vontade do cliente. Ex.: falta de tempo para cozinhar, vontade de ficar bonita para uma festa."
    },
    {
     "opcao": "Não sei",
     "tipo": "Prompt de IA",
     "texto": "Prompt: \"Eu vendo [produto ou serviço]. Que problemas ou vontades do cliente isso resolve? Dê exemplos do dia a dia, em linguagem simples.\" Pergunte a clientes se isso faz sentido para eles."
    }
   ],
   "naosei": true
  },
  {
   "codigo": "M3.P12",
   "bloco": "Bloco 2: Entender o Mercado e seus Clientes",
   "titulo": "Barreiras de Entrada",
   "pergunta": "Seria difícil para outra pessoa abrir um negócio igual ao seu e vender como você? O que dificulta? (Ex.: precisa de muito dinheiro, de licença, de máquina cara, ou o seu nome já é conhecido)",
   "tipo": "Texto livre",
   "caminhos": [
    {
     "opcao": "Resposta preenchida",
     "tipo": "Nenhum",
     "texto": "—"
    },
    {
     "opcao": "Resposta vazia ou muito curta",
     "tipo": "Dica",
     "texto": "Pense no que dificulta outra pessoa de começar igual a você. Ex.: muito dinheiro, licença, máquina cara, nome já conhecido."
    },
    {
     "opcao": "Não sei",
     "tipo": "Prompt de IA",
     "texto": "Prompt: \"Quais são as dificuldades comuns para alguém abrir um negócio de [produto ou serviço]? Explique de forma simples.\""
    }
   ],
   "exemplos": [
    "precisa de muito dinheiro",
    "precisa de licença ou regra",
    "precisa de máquina ou equipamento caro",
    "o meu nome já é conhecido",
    "clientes fiéis"
   ],
   "naosei": true
  },
  {
   "codigo": "M3.P13",
   "bloco": "Bloco 3: Onde está o Negócio",
   "titulo": "Canais de Venda",
   "pergunta": "Onde o seu cliente encontra você e compra de você hoje? Na loja, no WhatsApp, no Instagram, em site ou aplicativo?",
   "tipo": "Seleção múltipla",
   "caminhos": [
    {
     "opcao": "Loja física",
     "tipo": "Dica",
     "texto": "Considere loja, feira, ponto de atendimento ou venda direta."
    },
    {
     "opcao": "Marketplace (ex.: Mercado Livre, Shopee)",
     "tipo": "Dica",
     "texto": "Considere plataformas onde o cliente procura e compra de vários vendedores."
    },
    {
     "opcao": "Redes sociais (Instagram, Facebook, WhatsApp)",
     "tipo": "Dica",
     "texto": "Considere vender e atender por Instagram, Facebook ou WhatsApp."
    },
    {
     "opcao": "Site ou aplicativo próprio",
     "tipo": "Dica",
     "texto": "Considere se o cliente consegue achar e comprar sem falar com você."
    },
    {
     "opcao": "Outro",
     "tipo": "Dica",
     "texto": "Escreva onde mais o cliente encontra e compra de você."
    },
    {
     "opcao": "Não sei",
     "tipo": "Prompt de IA",
     "texto": "Prompt: \"Eu vendo [produto ou serviço]. Quais são os melhores canais para vender isso (loja, WhatsApp, Instagram, marketplace, site)? Explique as vantagens de cada um.\""
    },
    {
     "opcao": "Nenhuma opção marcada",
     "tipo": "Alerta",
     "texto": "Marque pelo menos um canal ou escolha 'Não sei'."
    }
   ],
   "opcoes": [
    "Loja física",
    "Marketplace (ex.: Mercado Livre, Shopee)",
    "Redes sociais (Instagram, Facebook, WhatsApp)",
    "Site ou aplicativo próprio",
    "Outro",
    "Não sei"
   ],
   "naosei": true
  },
  {
   "codigo": "M3.P14",
   "bloco": "Bloco 3: Onde está o Negócio",
   "titulo": "Diagnóstico da Empresa",
   "pergunta": "O que o seu negócio faz de melhor hoje? E o que ainda precisa melhorar?",
   "tipo": "Texto livre (2 campos)",
   "caminhos": [
    {
     "opcao": "Preencheu os dois campos",
     "tipo": "Nenhum",
     "texto": "—"
    },
    {
     "opcao": "Preencheu só um dos campos",
     "tipo": "Dica",
     "texto": "Todo negócio tem pontos fortes e pontos a melhorar. Tente escrever pelo menos um de cada."
    },
    {
     "opcao": "Não sei",
     "tipo": "Dica",
     "texto": "Pense no que os clientes elogiam e no que costumam reclamar."
    }
   ],
   "campos": [
    "O que meu negócio faz de melhor",
    "O que ainda preciso melhorar"
   ],
   "naosei": true
  },
  {
   "codigo": "M3.P15",
   "bloco": "Bloco 4: Definição da Concorrência",
   "titulo": "Identificação de Concorrentes Diretos",
   "pergunta": "Quem vende o mesmo que você ou algo muito parecido? Cite lojas, pessoas ou perfis que você conhece.",
   "tipo": "Texto livre",
   "caminhos": [
    {
     "opcao": "Resposta preenchida",
     "tipo": "Nenhum",
     "texto": "—"
    },
    {
     "opcao": "Resposta vazia ou muito curta",
     "tipo": "Dica",
     "texto": "Cite lojas, pessoas ou perfis que vendem o mesmo que você ou algo muito parecido."
    },
    {
     "opcao": "Não sei",
     "tipo": "Prompt de IA",
     "texto": "Prompt: \"Eu vendo [produto ou serviço] em [cidade ou bairro]. Me explique como encontrar quem vende o mesmo, só com o celular. Não invente nomes de lojas.\" Confirme cada nome encontrado no Google Maps ou no Instagram."
    }
   ],
   "naosei": true
  },
  {
   "codigo": "M3.P16",
   "bloco": "Bloco 4: Definição da Concorrência",
   "titulo": "Critério de Concorrência",
   "pergunta": "Para você, quem é \"concorrente de verdade\"? O que essa pessoa ou loja tem que ter para tirar cliente de você?",
   "tipo": "Texto livre",
   "caminhos": [
    {
     "opcao": "Resposta preenchida",
     "tipo": "Nenhum",
     "texto": "—"
    },
    {
     "opcao": "Resposta vazia ou muito curta",
     "tipo": "Dica",
     "texto": "Pense no que faz alguém tirar cliente de você. Ex.: vende o mesmo produto, para o mesmo público, na mesma região."
    },
    {
     "opcao": "Não sei",
     "tipo": "Prompt de IA",
     "texto": "Prompt: \"Eu vendo [produto ou serviço] para [tipo de cliente]. O que faz alguém ser meu concorrente de verdade? Dê exemplos simples, como mesmo produto, mesmo público e mesma região.\""
    }
   ],
   "naosei": true
  },
  {
   "codigo": "M3.P17",
   "bloco": "Bloco 4: Definição da Concorrência",
   "titulo": "Localização de Concorrência",
   "pergunta": "Você sabe como descobrir quem vende o mesmo que você? (Ex.: procurar no Google Maps, no Instagram ou perguntando aos clientes)",
   "tipo": "Texto livre",
   "caminhos": [
    {
     "opcao": "Resposta preenchida",
     "tipo": "Nenhum",
     "texto": "—"
    },
    {
     "opcao": "Resposta vazia ou muito curta",
     "tipo": "Dica",
     "texto": "Conte como você encontra quem vende igual. Ex.: busca no Google Maps, Instagram ou conversa com clientes."
    },
    {
     "opcao": "Não sei",
     "tipo": "Passo a passo",
     "texto": "1. Abra o Google Maps e busque o que você vende (ex.: \"bolos perto de mim\"). 2. No Instagram, busque palavras do seu ramo e o nome da sua cidade. 3. Veja se há anúncios no Mercado Livre, Shopee ou OLX. 4. Pergunte a clientes onde mais já compraram. 5. Anote os nomes que mais aparecem."
    }
   ],
   "naosei": true
  },
  {
   "codigo": "M3.P18",
   "bloco": "Bloco 4: Definição da Concorrência",
   "titulo": "Conhecimento sobre os Concorrentes",
   "pergunta": "Você sabe onde esses concorrentes ficam e como eles trabalham na sua região? (Horário, entrega, forma de atender)",
   "tipo": "Texto livre",
   "caminhos": [
    {
     "opcao": "Resposta preenchida",
     "tipo": "Nenhum",
     "texto": "—"
    },
    {
     "opcao": "Resposta vazia ou muito curta",
     "tipo": "Dica",
     "texto": "Conte onde ficam e como trabalham. Ex.: horário, entrega, forma de atender."
    },
    {
     "opcao": "Não sei",
     "tipo": "Passo a passo",
     "texto": "1. Busque o nome do concorrente ou o que ele vende no Google Maps. 2. Veja endereço, horário, fotos e avaliações. 3. Veja no Instagram ou WhatsApp como ele atende e entrega. 4. Anote tudo na tabela de concorrentes."
    }
   ],
   "naosei": true
  },
  {
   "codigo": "M3.P19",
   "bloco": "Bloco 4: Definição da Concorrência",
   "titulo": "Comparação com Concorrentes",
   "pergunta": "Se você colocar o seu negócio ao lado dos outros, como você se sai? Pense em preço, qualidade, atendimento e prazo.",
   "tipo": "Texto livre",
   "caminhos": [
    {
     "opcao": "Sei comparar (texto livre)",
     "tipo": "Nenhum",
     "texto": "—"
    },
    {
     "opcao": "Resposta vazia ou muito curta",
     "tipo": "Dica",
     "texto": "Pense em preço, qualidade, atendimento e prazo. Em qual deles você se sai melhor ou pior?"
    },
    {
     "opcao": "Não sei (tabela guiada)",
     "tipo": "Dica",
     "texto": "Compare o seu negócio com os outros em cada item. Se não souber algum, deixe em branco e volte depois."
    },
    {
     "opcao": "Marcou 'Pior' em 3 ou mais critérios",
     "tipo": "Resposta",
     "texto": "Em vários pontos os outros parecem estar à frente. Vale investigar onde você pode se destacar."
    }
   ],
   "criterios": [
    "Preço",
    "Qualidade",
    "Atendimento",
    "Prazo (tempo para entregar)"
   ],
   "escala": [
    "Melhor",
    "Igual",
    "Pior"
   ],
   "naosei": true
  },
  {
   "codigo": "M3.P20",
   "bloco": "Bloco 4: Definição da Concorrência",
   "titulo": "Faixa de Preço",
   "pergunta": "Quanto os outros costumam cobrar por algo parecido com o que você vende?",
   "tipo": "Texto livre",
   "caminhos": [
    {
     "opcao": "Informou valores",
     "tipo": "Resposta",
     "texto": "Os outros costumam cobrar em torno de R$ [valor]. Compare com o seu preço."
    },
    {
     "opcao": "Texto sem valor em reais",
     "tipo": "Dica",
     "texto": "Escreva os valores em reais. Ex.: de R$ 40 a R$ 60."
    },
    {
     "opcao": "Não sei",
     "tipo": "Passo a passo",
     "texto": "1. Escolha 3 concorrentes. 2. Veja o preço de algo parecido com o seu no Instagram, no WhatsApp (peça um orçamento) ou nos marketplaces. 3. Anote os valores. 4. Some os preços e divida por 3 para ter o preço médio."
    }
   ],
   "naosei": true
  },
  {
   "codigo": "M3.P21",
   "bloco": "Bloco 4: Definição da Concorrência",
   "titulo": "Análise Comparativa / Diferencial",
   "pergunta": "O que o seu cliente ganha comprando com você e não com o vizinho?",
   "tipo": "Texto livre",
   "caminhos": [
    {
     "opcao": "Resposta preenchida",
     "tipo": "Nenhum",
     "texto": "—"
    },
    {
     "opcao": "Resposta muito genérica",
     "tipo": "Dica",
     "texto": "Tente dizer o que o cliente ganha de verdade. Ex.: entrega no mesmo dia, bolo sob medida, atendimento pelo WhatsApp."
    },
    {
     "opcao": "Não sei",
     "tipo": "Dica",
     "texto": "Pense no que os clientes elogiam em você. Volte aqui depois de responder as perguntas 19 e 22."
    }
   ],
   "naosei": true
  },
  {
   "codigo": "M3.P22",
   "bloco": "Bloco 4: Definição da Concorrência",
   "titulo": "Pontos Fortes e Fracos dos Concorrentes",
   "pergunta": "O que os outros fazem bem e atraem clientes? E onde eles deixam a desejar? (Ex.: demoram para responder, entrega atrasada, preço alto)",
   "tipo": "Texto livre (2 campos)",
   "caminhos": [
    {
     "opcao": "Preencheu os dois campos",
     "tipo": "Nenhum",
     "texto": "—"
    },
    {
     "opcao": "Preencheu só um dos campos",
     "tipo": "Dica",
     "texto": "Tente escrever pelo menos um ponto forte e uma falha dos outros. Ex.: demoram para responder, entrega atrasada."
    },
    {
     "opcao": "Não sei",
     "tipo": "Passo a passo",
     "texto": "1. No Google Maps, leia avaliações de 5 estrelas e de 1 ou 2 estrelas. 2. No Instagram, leia os comentários. 3. Anote os elogios e as reclamações que mais se repetem."
    }
   ],
   "campos": [
    "O que os outros fazem bem",
    "Onde os outros deixam a desejar"
   ],
   "naosei": true
  }
 ],
 "regras": [],
 "instrumentos": {
  "lista": []
 },
 "educativo": [],
 "casos": [],
 "blocos": [
  "Bloco 1: Oportunidades do Negócio",
  "Bloco 2: Entender o Mercado e seus Clientes",
  "Bloco 3: Onde está o Negócio",
  "Bloco 4: Definição da Concorrência"
 ]
};
