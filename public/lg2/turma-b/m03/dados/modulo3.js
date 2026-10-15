/* GERADO por ferramentas/extrair.py a partir da planilha do grupo. Nao editar a mao.
   Campos "caminhos" (retorno por resposta) e opcoes/tipo de M3.P01-P05, P11 e P15 vindos de
   m03_caminhos.xlsx (aba "Caminhos por resposta"; P06 dela = M3.P11, P07 = M3.P15). */
window.MODULO3 = {
 "origem": "LG2_M03_planilha_do_grupo.xlsx",
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
   "modulo": "M3",
   "pergunta": "Qual produto ou serviço você pretende pesquisar?",
   "ajuda": "Descreva a oferta de forma simples. Se ainda não souber, selecione Não sei.",
   "tipo": "Texto livre",
   "condicao": "Sempre",
   "opcoes": "Texto livre; Não sei ainda",
   "resposta": "Vamos usar esta descrição para sugerir termos de busca.",
   "alerta": "Uma descrição muito ampla pode trazer resultados pouco úteis.",
   "proximo": "Defina o perfil do cliente que será analisado nas próximas etapas.",
   "caminhos": [
    {
     "opcao": "Resposta preenchida",
     "tipo": "Dica",
     "texto": "Descreva de forma simples o que você pretende vender ou pesquisar. Ex.: bolos de aniversário, manutenção de celulares ou aulas particulares."
    },
    {
     "opcao": "Resposta muito genérica",
     "tipo": "Dica",
     "texto": "Tente especificar melhor. Em vez de 'comida', escreva 'marmitas fitness para trabalhadores da região'."
    },
    {
     "opcao": "Não sei ainda",
     "tipo": "Dica",
     "texto": "Você pode começar pela necessidade que pretende atender e definir o produto ou serviço com mais detalhes depois."
    }
   ]
  },
  {
   "codigo": "M3.P02",
   "modulo": "M3",
   "pergunta": "Seu negócio será de qual tipo?",
   "ajuda": "Escolha o que mais se aproxima agora",
   "tipo": "Seleção única",
   "condicao": "Sempre",
   "opcoes": "Produto que eu fabrico; Produto que eu revendo; Serviço; Outro; Ainda estou decidindo",
   "resposta": "O tipo muda onde e como pesquisar concorrentes (loja, perfil, agenda, marketplace).",
   "alerta": "Uma necessidade pouco clara pode dificultar a identificação do mercado e dos concorrentes.",
   "proximo": "Fabricar, revender e prestar serviço têm concorrentes e substitutos diferentes.",
   "caminhos": [
    {
     "opcao": "Produto que eu fabrico",
     "tipo": "Resposta",
     "texto": "Você pretende produzir o próprio produto para vender."
    },
    {
     "opcao": "Produto que eu revendo",
     "tipo": "Resposta",
     "texto": "Você pretende comprar produtos prontos e revendê-los."
    },
    {
     "opcao": "Serviço",
     "tipo": "Resposta",
     "texto": "Seu negócio será baseado principalmente na prestação de um serviço."
    },
    {
     "opcao": "Outro",
     "tipo": "Dica",
     "texto": "Explique brevemente como seu negócio funcionará para que as próximas orientações sejam mais adequadas."
    },
    {
     "opcao": "Ainda estou decidindo",
     "tipo": "Dica",
     "texto": "Tudo bem. Continue a pesquisa e use as próximas respostas para entender melhor sua ideia."
    }
   ]
  },
  {
   "codigo": "M3.P03",
   "modulo": "M3",
   "pergunta": "Onde você pretende vender?",
   "ajuda": "Pense no lugar onde o cliente encontraria sua oferta.",
   "tipo": "Seleção única",
   "condicao": "Sempre",
   "opcoes": "Presencialmente; Pela internet; Nos dois; Ainda não sei",
   "resposta": "O canal indica onde procurar concorrentes: no mapa da região, nas redes sociais, em marketplaces.",
   "alerta": "Na internet, a concorrência pode estar em outras cidades.",
   "caminhos": [
    {
     "opcao": "Presencialmente",
     "tipo": "Dica",
     "texto": "Considere loja, feira, ponto de atendimento, venda direta ou outro espaço físico."
    },
    {
     "opcao": "Pela internet",
     "tipo": "Dica",
     "texto": "Considere site, redes sociais, WhatsApp, marketplace ou outra plataforma digital."
    },
    {
     "opcao": "Nos dois",
     "tipo": "Dica",
     "texto": "Escolha esta opção se pretende combinar vendas ou atendimento físico e digital."
    },
    {
     "opcao": "Ainda não sei",
     "tipo": "Dica",
     "texto": "Observe onde seu público costuma procurar esse produto ou serviço antes de decidir."
    }
   ]
  },
  {
   "codigo": "M3.P04",
   "modulo": "M3",
   "pergunta": "Quantos negócios que atendem à mesma necessidade você já identificou (diretos, indiretos ou substitutos)?",
   "ajuda": "Conte os que você registrou na tabela de concorrentes (M3.I02). Se não fez a pesquisa, escolha \"Não sei\".",
   "tipo": "Número inteiro",
   "condicao": "Sempre",
   "opcoes": "Não sei",
   "resposta": "Esse número mostra o quanto da pesquisa já foi feita; ele não diz se o mercado é grande ou pequeno.",
   "alerta": "Encontrar zero negócios costuma indicar pesquisa incompleta; amplie para indiretos e substitutos.",
   "caminhos": [
    {
     "opcao": "0",
     "tipo": "Dica",
     "texto": "Zero significa que você ainda não identificou nenhum negócio. Isso não garante que não existam concorrentes."
    },
    {
     "opcao": "1 ou mais",
     "tipo": "Resposta",
     "texto": "Você identificou [N] negócio(s) que atendem à mesma necessidade."
    },
    {
     "opcao": "Número inválido",
     "tipo": "Dica",
     "texto": "Informe um número inteiro igual ou maior que zero."
    },
    {
     "opcao": "Não sei",
     "tipo": "Dica",
     "texto": "Pesquise negócios que resolvem a mesma necessidade, incluindo concorrentes diretos, indiretos e produtos ou serviços substitutos."
    }
   ]
  },
  {
   "codigo": "M3.P05",
   "modulo": "M3",
   "pergunta": "O que seu possível cliente faz hoje para resolver essa necessidade, se o seu negócio não existisse?",
   "ajuda": "Pense em alternativas: comprar pronto, fazer em casa, mudar o hábito. Se não souber, escolha \"Não sei\".",
   "tipo": "Texto livre",
   "condicao": "Sempre",
   "opcoes": "Compra de outro concorrente; Faz por conta própria; Usa outro produto ou serviço substituto; Não faz nada / não resolve; Não sei",
   "resposta": "As alternativas citadas podem ser concorrentes indiretos ou substitutos e entram na tabela.",
   "alerta": "Respostas baseadas só na sua opinião precisam ser confirmadas com clientes reais.",
   "proximo": "Confirme conversando com possíveis clientes",
   "caminhos": [
    {
     "opcao": "Compra de outro concorrente",
     "tipo": "Dica",
     "texto": "Se souber, informe qual tipo de negócio ou solução o cliente costuma procurar."
    },
    {
     "opcao": "Faz por conta própria",
     "tipo": "Dica",
     "texto": "Ex.: prepara em casa, conserta sozinho, pesquisa e compra os materiais ou realiza o serviço por conta própria."
    },
    {
     "opcao": "Usa outro produto ou serviço substituto",
     "tipo": "Dica",
     "texto": "Pense em outra solução que resolve a mesma necessidade, mesmo que seja diferente do seu produto ou serviço."
    },
    {
     "opcao": "Não faz nada / não resolve",
     "tipo": "Dica",
     "texto": "Isso pode significar que a necessidade ainda não é percebida como importante ou que existe uma oportunidade a investigar."
    },
    {
     "opcao": "Não sei",
     "tipo": "Dica",
     "texto": "Converse com possíveis clientes ou observe como eles resolvem essa necessidade atualmente."
    }
   ]
  },
  {
   "codigo": "M3.P06",
   "modulo": "M3",
   "pergunta": "Qual é o preço mais comum que você viu em concorrentes para algo parecido com o que você vende?",
   "ajuda": "Use preços visíveis em cardápio, catálogo, perfil ou marketplace. Se o preço não aparece, escolha \"Não sei\".",
   "tipo": "Número",
   "condicao": "M3.P04 > 0",
   "opcoes": "Não sei",
   "resposta": "O valor é um preço observado em uma data, e não um preço recomendado para você.",
   "alerta": "Não copie o preço do concorrente: custos e escala são diferentes. Registre link e data.",
   "proximo": "Compare com o seu custo no Módulo 5 e teste a aceitação do cliente."
  },
  {
   "codigo": "M3.P07",
   "modulo": "M3",
   "pergunta": "Os preços que você observou variam muito entre os concorrentes?",
   "ajuda": "Compare o menor e o maior preço registrados para algo parecido.",
   "tipo": "Escolha",
   "condicao": "M3.P06 > 0",
   "opcoes": "Variam pouco; Variam bastante; Só consegui ver o preço de um; Não sei",
   "resposta": "A variação mostra se há faixas de preço diferentes no mercado observado.",
   "alerta": "Preços diferentes podem refletir tamanho, qualidade ou canal diferentes: compare o que cada preço inclui.",
   "proximo": "Registre pelo menos três preços na tabela M3.I02."
  },
  {
   "codigo": "M3.P08",
   "modulo": "M3",
   "pergunta": "Onde os concorrentes mais recebem pedidos e se comunicam?",
   "ajuda": "Veja loja, Instagram, WhatsApp, site ou marketplace.",
   "tipo": "Escolha",
   "condicao": "M3.P04 > 0",
   "opcoes": "Loja ou ponto físico; Instagram ou WhatsApp; Site ou marketplace; Não sei",
   "resposta": "O canal usado pelos concorrentes mostra onde o cliente já está acostumado a comprar.",
   "alerta": "O canal que o concorrente usa não é, por si só, o melhor canal para você.",
   "proximo": "Anote o canal de cada concorrente na tabela M3.I02."
  },
  {
   "codigo": "M3.P09",
   "modulo": "M3",
   "pergunta": "O que os clientes mais elogiam e mais reclamam nas avaliações dos concorrentes?",
   "ajuda": "Leia avaliações no Google Maps, Instagram ou marketplace e anote o que se repete.",
   "tipo": "Texto",
   "condicao": "M3.P04 > 0",
   "opcoes": "Não sei",
   "resposta": "Elogios e reclamações que se repetem são pistas do que o cliente valoriza.",
   "alerta": "Poucas avaliações não representam todos os clientes. Não registre nomes de clientes.",
   "proximo": "Transforme as reclamações em hipóteses (M3.P10)."
  },
  {
   "codigo": "M3.P10",
   "modulo": "M3",
   "pergunta": "O que ainda não está sendo oferecido ou está sendo mal atendido pelos concorrentes?",
   "ajuda": "Parta das reclamações e dos substitutos que você anotou.",
   "tipo": "Texto",
   "condicao": "M3.P04 > 0",
   "opcoes": "Não sei",
   "resposta": "O que falta no mercado observado é uma hipótese a testar, e não prova de demanda.",
   "alerta": "Não ver lacunas não significa que elas não existam.",
   "proximo": "Leve a hipótese ao Módulo 4 para montar um teste pequeno."
  },
  {
   "codigo": "M3.P11",
   "modulo": "M3",
   "pergunta": "A procura pelo que você vende muda ao longo do ano (datas, estações, férias)?",
   "ajuda": "Pense em épocas em que a procura sobe ou cai.",
   "tipo": "Seleção única",
   "condicao": "Sempre",
   "opcoes": "Sim; Não; Não sei",
   "resposta": "Se a procura muda, preço, estoque e caixa também precisam variar.",
   "alerta": "Sazonalidade só vale como hipótese até aparecer em dados ou nas conversas com clientes.",
   "proximo": "Se a resposta for \"Sim\", descreva as épocas (M3.P12).",
   "caminhos": [
    {
     "opcao": "Sim",
     "tipo": "Dica",
     "texto": "Indique datas, meses, estações, férias ou outros períodos em que a procura pode aumentar ou diminuir."
    },
    {
     "opcao": "Não",
     "tipo": "Resposta",
     "texto": "Você não identificou uma mudança relevante na procura ao longo do ano."
    },
    {
     "opcao": "Não sei",
     "tipo": "Dica",
     "texto": "Pesquise se o setor possui períodos de maior ou menor procura ou converse com clientes e concorrentes."
    }
   ]
  },
  {
   "codigo": "M3.P12",
   "modulo": "M3",
   "pergunta": "Em quais épocas você imagina que a procura sobe ou cai?",
   "ajuda": "Cite meses ou datas. Se não souber, escolha \"Não sei\".",
   "tipo": "Texto",
   "condicao": "M3.P11 = Sim",
   "opcoes": "Não sei",
   "resposta": "As épocas informadas seguem para o planejamento de caixa e capacidade (Módulos 6 e 7).",
   "alerta": "Uma impressão pessoal não confirma a sazonalidade.",
   "proximo": "Compare com as datas em que os concorrentes divulgam promoções."
  },
  {
   "codigo": "M3.P13",
   "modulo": "M3",
   "pergunta": "Você consegue explicar, em uma frase, o que seria diferente no seu negócio em relação ao que viu?",
   "ajuda": "Compare com o que registrou na tabela de concorrentes.",
   "tipo": "Escolha",
   "condicao": "M3.P04 > 0",
   "opcoes": "Sim; Em parte; Não; Não sei",
   "resposta": "O diferencial declarado é uma hipótese: precisa ser confirmado com clientes.",
   "alerta": "Um diferencial que só você percebe pode não importar ao cliente.",
   "proximo": "Teste o diferencial com possíveis clientes (Módulos 2 e 4)."
  },
  {
   "codigo": "M3.P14",
   "modulo": "M3",
   "pergunta": "Você registrou o link e a data de cada informação que pesquisou?",
   "ajuda": "Sem link e data, a informação pode ficar desatualizada ou impossível de conferir.",
   "tipo": "Sim/Não",
   "condicao": "M3.P04 > 0",
   "opcoes": "Sim; Não; Não sei",
   "resposta": "Registrar link e data permite conferir e atualizar a pesquisa depois.",
   "alerta": "Preços e ofertas mudam com o tempo.",
   "proximo": "Complete a tabela M3.I02 antes de seguir."
  },
  {
   "codigo": "M3.P15",
   "modulo": "M3",
   "pergunta": "O que você ainda gostaria de descobrir sobre o mercado?",
   "ajuda": "Escolha o que mais pesa na sua decisão agora.",
   "tipo": "Seleção múltipla",
   "condicao": "Sempre",
   "opcoes": "Preços praticados; Quantidade de clientes / tamanho do público; Concorrentes; Comportamento / necessidade dos clientes; Canais de venda e divulgação; Outra dúvida; Não sei",
   "resposta": "O app ajuda a observar concorrentes, preços e canais. Ele não calcula o tamanho do mercado.",
   "alerta": "Números de mercado sem fonte confiável podem enganar.",
   "proximo": "Se precisar de dados de mercado, procure o Sebrae mais próximo.",
   "caminhos": [
    {
     "opcao": "Preços praticados",
     "tipo": "Dica",
     "texto": "Use esta opção se ainda precisar entender quanto os concorrentes cobram e como os preços variam."
    },
    {
     "opcao": "Quantidade de clientes / tamanho do público",
     "tipo": "Dica",
     "texto": "Use quando quiser descobrir se existe público suficiente ou qual é o tamanho aproximado da demanda."
    },
    {
     "opcao": "Concorrentes",
     "tipo": "Dica",
     "texto": "Use quando ainda quiser descobrir quem são os concorrentes diretos, indiretos ou substitutos."
    },
    {
     "opcao": "Comportamento / necessidade dos clientes",
     "tipo": "Dica",
     "texto": "Use quando ainda precisar entender melhor o que o cliente procura, valoriza ou faz atualmente."
    },
    {
     "opcao": "Canais de venda e divulgação",
     "tipo": "Dica",
     "texto": "Use quando quiser descobrir onde os clientes procuram, compram ou contratam esse tipo de produto ou serviço."
    },
    {
     "opcao": "Outra dúvida",
     "tipo": "Dica",
     "texto": "Escreva qual informação ainda falta para você se sentir mais seguro para decidir sobre o negócio."
    },
    {
     "opcao": "Não sei",
     "tipo": "Dica",
     "texto": "Revise suas respostas e pense: qual informação ainda falta para saber se existe público, concorrência e oportunidade?"
    }
   ]
  }
 ],
 "regras": [],
 "instrumentos": {
  "lista": []
 },
 "educativo": [],
 "casos": []
};
