/* Dados do Módulo 1. Mapa, Base técnica e conexões vêm da planilha do grupo.
   Versão leve (proposta, nov/2026): enunciados curtos, exemplos dentro do campo ("Ex.: ..."),
   explicações em "Ver dica" (fechada) e, em cada "Não sei", a caixa "Como descobrir"
   (comoDescobrir = passos; promptIA = pedido pronto para copiar). Os textos das opções não mudam:
   outros módulos comparam esses valores salvos. "por_tipo" troca enunciado, opções ou dica
   conforme a resposta da Pergunta 3A. */
window.MODULO1 = {
 "origem": "LG2_M01_planilha_do_grupo.xlsx",
 "modulo": {
  "numero": "1",
  "nome": "Perfil do empreendedor e definição da ideia",
  "versao": "v0.1",
  "data": "10/09/2026",
  "turma": "Turma de 18",
  "tutora": "Ana Beatriz",
  "integrantes": [
   "Laura Halfeld",
   "João Pedro Sansão",
   "Maria Eduarda Sales",
   "Arthur Tavares"
  ]
 },
 "mapa": {
  "objetivo": "Mapear a motivação, levantar o tempo disponível, os recursos já existentes, as restrições e o limite de investimento e capturar uma descrição clara do produto ou serviço que compõe a ideia inicial do negócio.\n",
  "usuario": "Pessoas que desejam estruturar um pequeno negócio e que acessarão o aplicativo preferencialmente pelo celular.",
  "decisoes": "Construção de um retrato inicial do empreendedor e da sua situação atual.\nElaboração de uma síntese da ideia de negócio.\nSeparação clara entre o que são fatos comprovados, o que são hipóteses a serem testadas e quais são as lacunas de informação.\nDefinição de um próximo passo prático para orientar o usuário.\n",
  "nao_faz": "Não garantir que a ideia dará certo ou atestar viabilidade definitiva.\nNão afirmar ou prometer que haverá lucro, vendas ou rentabilidade específica.\nNão concluir automaticamente que o usuário deve abrir o negócio, contratar pessoas ou tomar crédito.",
  "mensagem_limite": "O app oferece apoio educacional básico. As estimativas dependem dos dados fornecidos e não garantem resultados. Regras de registro, tributação, licenciamento e exercício profissional devem ser confirmadas em fontes oficiais e com profissionais habilitados.",
  "ter_em_maos": "Uma ideia de produto ou serviço a ser vendido. \nNoção do tempo disponível por semana que pode dedicar ao negócio.\nConhecimento dos recursos e habilidades que já possui.\nUma estimativa do valor financeiro máximo que está disposto a arriscar sem comprometer a sobrevivência (limite de investimento). ",
  "entrega": "Retrato inicial: um resumo sobre você, o estágio da sua ideia e o que motiva você.\nSíntese da ideia: uma descrição da ideia, separando o que você já sabe do que ainda precisa testar.\nO que falta descobrir: as informações que ainda faltam.\nPróximo passo: uma tarefa fácil para fazer já.",
  "encaminhamentos": "Se o limite de investimento sugerir a necessidade de empréstimos fora do padrão familiar, um consultor financeiro pode ser indicado para validar o risco e as taxas de juros.\nSe a ideia esbarrar em produtos alimentícios de alto risco ou procedimentos de saúde, deve haver um encaminhamento para checagem com um responsável técnico sobre viabilidade.",
  "caso_real": "As conversas e o acompanhamento do caso real testarão as opções de resposta e a clareza das perguntas (ex: ver se o tom está amigável ou intimidador).  \nIdentificarão os \"pontos cegos\" habituais dos empreendedores no estágio inicial, fornecendo dúvidas recorrentes para compor as caixas educativas e o roteiro dos vídeos.\nPermitirão a construção dos \"casos de teste\" obrigatórios, ajudando a simular caminhos contraditórios (ex: \"só na cabeça\" vs. \"já é renda\").",
  "riscos": "Risco 1: Transmitir ao usuário, através das perguntas, que ele deve pedir demissão de seu atual emprego ou tomar crédito imediato baseado apenas em sua motivação.\nComo evitar: Criar um ambiente educacional que reforce limites. A interface usará verbos como \"planejar\", \"estimar\" e \"projetar\", não \"garantir\". A equipe aplicará testes rigorosos sobre a \"lógica condicional\" para garantir que nenhum cenário sugira ao usuário ações imprudentes de vida e carreira.\n\nRisco 2: Afirmar categoricamente que o negócio é \"viável\" ou rentável após ele fornecer as estimativas.\nComo evitar: Limitar as entregas do Módulo 1 a um mapeamento descritivo, sem emitir laudos de viabilidade. O encaminhamento sugerido não deve ser \"abra o negócio\", mas sim a próxima etapa de investigação no aplicativo. As palavras \"bom\" e \"mau\" negócio devem ser evitadas."
 },
 "conexoes": [
  {
   "modulo": "2.0",
   "nome": "Clientes, necessidades e comportamento de compra",
   "recebe": "Nenhum dado (fluxo de entrada)",
   "envia": "Sua ideia e uma primeira descrição do que você vende.",
   "combinado": "Não",
   "obs": "No Módulo 2 você vai usar essa ideia para descobrir quem são os seus possíveis clientes."
  },
  {
   "modulo": "4.0",
   "nome": "Produto, proposta de valor e teste da ideia",
   "recebe": "Nenhum dado (fluxo de entrada)",
   "envia": "O que você já sabe e o que ainda precisa testar na sua ideia, além do seu tempo e do que você já tem.",
   "combinado": "Não",
   "obs": "No Módulo 4 você vai usar essas informações para montar uma primeira oferta simples e testar a ideia gastando pouco."
  },
  {
   "modulo": "6.0",
   "nome": "Investimento, capital de giro e fluxo de caixa",
   "recebe": "Nenhum dado (fluxo de entrada)",
   "envia": "Quanto dinheiro você pode usar e o que você já tem para trabalhar.",
   "combinado": "Não",
   "obs": "No Módulo 6 você vai usar esse valor para planejar quanto investir no começo sem se arriscar."
  },
  {
   "modulo": "10.0",
   "nome": "Comunicação, vendas, pessoas e plano de ação",
   "recebe": "Nenhum dado (fluxo de entrada)",
   "envia": "Seu retrato inicial: o tempo que você tem, o que limita você e o que motiva você.",
   "combinado": "Não",
   "obs": "No Módulo 10, o seu tempo e o que limita você vão ajudar a definir o ritmo e as prioridades do seu plano de 90 dias."
  }
 ],
 "base": [
  {
   "codigo": "M1.BT01",
   "conceito": "Limite de Investimento (Perda Acessível)",
   "definicao": "É o valor máximo em dinheiro que você pode investir e perder sem comprometer o sustento básico da sua família.",
   "porque": "Evita que o usuário contraia dívidas impagáveis ou comprometa recursos vitais antes de validar se o negócio funciona.",
   "exemplo": "\"Tenho R$ 500 guardados que posso usar para comprar ingredientes. Se eu não vender nada, não passarei fome.\"",
   "tipo_fonte": "Institucional",
   "fonte": "Sebrae / Effectuation (Saras Sarasvathy)",
   "link": "https://d335luupugsy2.cloudfront.net/cms/files/44571/1548696378METODO-EFFECTUATION.pdf",
   "data": "01/10/2026",
   "revisado": "João Pedro Sansão",
   "status": "Rascunho"
  },
  {
   "codigo": "M1.BT02",
   "conceito": "Estágio do Negócio",
   "definicao": "A fase em que a ideia se encontra: se está apenas na imaginação, se já existe um protótipo, ou se já houve vendas.",
   "porque": "Ajuda a definir o próximo passo. Quem está \"só na cabeça\" precisa testar; quem \"já vende\" precisa organizar.",
   "exemplo": "\"Só na cabeça\", \"Fazendo amostras para amigos\", \"Vendendo informalmente no bairro\".",
   "tipo_fonte": "Institucional",
   "fonte": "Sebrae",
   "link": "https://www.sebraestartups.com.br/estagios-startup/",
   "data": "01/10/2026",
   "revisado": "João Pedro Sansão",
   "status": "Rascunho"
  },
  {
   "codigo": "M1.BT03",
   "conceito": "Fato vs. Hipótese",
   "definicao": "Fato é o que já foi comprovado na prática (ex: vendas reais). Hipótese é uma suposição (ex: \"acho que as pessoas vão gostar\").",
   "porque": "Impede que o usuário invista muito tempo e dinheiro baseado apenas em \"achismos\" e foca em testes práticos.",
   "exemplo": "Fato: \"Vendi 5 bolos ontem\". Hipótese: \"Acho que um bolo vegano venderia bem\".",
   "tipo_fonte": "Acadêmica",
   "fonte": "Metodologia Lean Startup (Eric Ries)",
   "link": "https://www.startupsc.com.br/o-que-e-a-lean-startup/",
   "data": "01/10/2026",
   "revisado": "João Pedro Sansão",
   "status": "Rascunho"
  },
  {
   "codigo": "M1.BT04",
   "conceito": "Motivação Empreendedora",
   "definicao": "O motivo principal de abrir o negócio: pode ser por necessidade (falta de emprego) ou por oportunidade.",
   "porque": "Define a urgência de retorno financeiro. Quem empreende por necessidade precisa de caixa rápido e menos risco.",
   "exemplo": "\"Estou desempregado e preciso pagar contas\" (Necessidade) ou \"Vi que não há padarias na minha rua\" (Oportunidade).",
   "tipo_fonte": "Institucional",
   "fonte": "GEM (Global Entrepreneurship Monitor)",
   "link": "https://sebraepr.com.br/impulsiona/gem-2025/",
   "data": "01/10/2026",
   "revisado": "João Pedro Sansão",
   "status": "Revisado"
  },
  {
   "codigo": "M1.BT05",
   "conceito": "Experiência Profissonal Anterior",
   "definicao": "Entender quais experiências e trabalhos anteriores a pessoa já realizou e como isso facilita o desenvolvimento do produto/serviço que ela busca oferecer.",
   "porque": "Negócios criados em áreas onde o empreendedor já tem experiência têm taxas de sobrevivência maiores, pois aproveitam o know-how técnico e a rede de contatos.",
   "exemplo": "\"Trabalhei como costureira em uma fábrica por 5 anos, por isso decidi abrir meu próprio ateliê de consertos.\"",
   "tipo_fonte": "Institucional",
   "fonte": "Sebrae - Conhecimento Prévio",
   "link": "https://sebrae.com.br/sites/PortalSebrae/artigos/como-a-experiencia-profissional-ajuda-no-seu-negocio",
   "data": "01/10/2026",
   "revisado": "João Pedro Sansão",
   "status": "Rascunho"
  },
  {
   "codigo": "M1.BT06",
   "conceito": "Limitações Gerais",
   "definicao": "Como as limitações pessoais e/ou profissionais do indivíduo podem atrapalhar seu negócio. (Financeiro, estrutural, mão-de-obra, carga horária, etc).",
   "porque": "Identificar as restrições antes de abrir o negócio evita a falência precoce por falta de caixa, de tempo ou de estrutura física adequada.",
   "exemplo": "\"Só posso me dedicar nos finais de semana\" ou \"Não tenho espaço em casa para estocar materiais\".",
   "tipo_fonte": "Institucional",
   "fonte": "Sebrae / Effectuation",
   "link": "https://aliancaempreendedora.org.br/teoria-do-effectuation-no-empreendedorismo/",
   "data": "01/10/2026",
   "revisado": "João Pedro Sansão",
   "status": "Rascunho"
  }
 ],
 "inicio": {
  "rotulo": "ETAPA 1",
  "titulo": "Você e a sua ideia",
  "descricao": "Responda perguntas rápidas e receba um resumo da sua ideia com uma tarefa para começar.",
  "tempo": "Esta etapa leva uns 10 minutos",
  "botao": "Começar",
  "link": "O que esta etapa não faz",
  "mais": {
   "titulo": "Como funciona",
   "blocos": [
    {
     "titulo": "No final, você vai ter:",
     "lista": [
      "Um resumo sobre você e a sua ideia",
      "O que ainda falta descobrir",
      "Uma tarefa fácil para fazer já"
     ]
    }
   ],
   "jornada": "Esta é a Etapa 1 de 10. A jornada completa leva de 3 a 5 horas e dá para fazer em vários dias: suas respostas ficam salvas na sua conta."
  }
 },
 "limites": {
  "titulo": "O que você pode esperar",
  "blocos": [
   {
    "titulo": "O app não faz:",
    "lista": [
     "Não diz se a sua ideia vai dar certo",
     "Não promete lucro nem vendas",
     "Não decide por você se deve abrir o negócio, contratar pessoas ou pegar empréstimo"
    ]
   },
   {
    "titulo": "O app te ajuda a:",
    "lista": [
     "Fazer um resumo sobre você e o seu momento",
     "Explicar sua ideia de um jeito simples",
     "Separar o que você já sabe do que ainda precisa testar",
     "Ver o que ainda falta descobrir",
     "Escolher um próximo passo fácil"
    ]
   },
   {
    "titulo": "Quando pedir ajuda a um profissional",
    "lista": [
     "Se você precisar de um empréstimo maior do que a família pode emprestar: converse com alguém que entende de dinheiro e juros antes de assinar.",
     "Se você vai vender comida que estraga fácil ou fazer algo ligado à saúde: confirme as regras com um profissional da área antes de começar."
    ]
   }
  ],
  "aviso": "O app ajuda você a pensar e se organizar. Os resultados dependem das suas respostas e não são garantidos. Regras de impostos, registro e licenças devem ser confirmadas em sites do governo e com profissionais.",
  "rodape": "Laboratório de Gestão II · FACC/UFJF"
 },
 "perguntas": [
  {
   "codigo": "M1.P01",
   "numero": "1",
   "condicao": "sempre",
   "pergunta": "Como está a sua ideia hoje?",
   "tipo": "escolha",
   "opcoes": [
    {
     "texto": "Ainda está só na minha cabeça",
     "mensagem": {
      "titulo": "Dica",
      "texto": "Antes de gastar dinheiro, teste sua ideia com pouca coisa. A gente te ajuda nas próximas perguntas."
     }
    },
    {
     "texto": "Já fiz um pouco para testar ou dar de amostra",
     "mensagem": {
      "titulo": "Dica",
      "texto": "Ótimo começo! Pergunte a quem provou se compraria e por quanto."
     }
    },
    {
     "texto": "Já vendi algumas vezes",
     "mensagem": null
    },
    {
     "texto": "Já vendo sempre",
     "mensagem": null
    }
   ]
  },
  {
   "codigo": "M1.P02",
   "numero": "2",
   "condicao": "sempre",
   "pergunta": "O que fez você querer ter um negócio?",
   "apoio": "Escolha o motivo principal.",
   "tipo": "escolha",
   "opcoes": [
    {
     "texto": "Preciso de dinheiro logo para pagar as contas",
     "mensagem": {
      "titulo": "Dica",
      "texto": "Comece com algo que você já sabe fazer e que dá para vender rápido, gastando pouco."
     }
    },
    {
     "texto": "Vi que as pessoas precisam de algo que eu posso vender",
     "mensagem": {
      "titulo": "Dica",
      "texto": "Antes de gastar, pergunte a algumas pessoas se elas comprariam."
     }
    },
    {
     "texto": "Quero ganhar um dinheiro a mais",
     "mensagem": null
    },
    {
     "texto": "Quero trabalhar por conta própria",
     "mensagem": null
    }
   ]
  },
  {
   "codigo": "M1.P03",
   "numero": "3",
   "condicao": "sempre",
   "pergunta": "O que você vende ou quer vender?",
   "placeholder": "Ex.: bolo de pote, conserto de celular, unha de gel",
   "botao_falar": "Falar em vez de escrever",
   "tipo": "texto",
   "video": {
    "texto": "Não sabe ou não entendeu? Assista ao vídeo",
    "assunto": "Ter uma boa ideia é diferente de ter uma oportunidade de negócio: como escolher o que vender a partir do que você sabe fazer e do que as pessoas pedem.",
    "url": null
   },
   "ajuda": {
    "texto": "Pode ser algo que você faz, algo que você revende ou um trabalho que você oferece."
   },
   "botao_ajuda": "Ainda não sei o que vender",
   "comoDescobrir": [
    "Pense no que as pessoas já pedem ou elogiam em você: uma comida, um conserto, um cuidado.",
    "Observe seu bairro por alguns dias: o que as pessoas procuram e não acham perto? Onde tem fila ou falta? Isso é uma oportunidade."
   ],
   "promptIA": "Moro em [seu bairro e cidade]. Sei fazer [o que você sabe fazer] e tenho [quanto tempo por dia] e cerca de [quanto dinheiro] para começar. Me sugira 5 ideias de pequenos negócios que resolvam uma necessidade real das pessoas daqui e que eu possa começar gastando pouco. Para cada ideia, diga para quem vender e como testar em uma semana.",
   "aviso_ajuda": "Quando escolher uma ideia, escreva no campo acima para continuar."
  },
  {
   "codigo": "M1.P03A",
   "numero": "3A",
   "condicao": "sempre",
   "pergunta": "O que você oferece?",
   "tipo": "escolha",
   "opcoes": [
    {
     "texto": "Produto: eu compro materiais e faço o que vendo",
     "mensagem": null
    },
    {
     "texto": "Mercadoria: compro pronto para revender",
     "mensagem": null
    },
    {
     "texto": "Serviço: meu cliente paga pelo trabalho que realizo",
     "mensagem": null
    }
   ],
   "ajuda": {
    "texto": "Produto: você faz com materiais que compra. Mercadoria: você compra pronto e revende. Serviço: o cliente paga pelo seu trabalho.",
    "exemplo": "Ex.: bolo de pote é produto; roupa da fábrica para revender é mercadoria; lavar carro é serviço."
   }
  },
  {
   "codigo": "M1.P04",
   "numero": "4",
   "condicao": "sempre",
   "pergunta": "Você já sabe fazer isso?",
   "pergunta_com_resposta": {
    "de": "M1.P03",
    "modelo": "Você já sabe fazer {resposta}?"
   },
   "tipo": "escolha",
   "opcoes": [
    {
     "texto": "Sim, já faço bem",
     "mensagem": null
    },
    {
     "texto": "Sei um pouco, ainda estou aprendendo",
     "mensagem": {
      "titulo": "Dica",
      "texto": "Pratique com amigos e família antes de vender. Assim você ganha confiança."
     }
    },
    {
     "texto": "Ainda não sei fazer",
     "mensagem": {
      "titulo": "Dica",
      "texto": "Tudo bem começar do zero. Procure um curso gratuito, como os do Sebrae, ou alguém que possa te ensinar."
     }
    }
   ],
   "ajuda": {
    "texto": "Vale o que você aprendeu em outro trabalho, em casa ou sozinho.",
    "exemplo": "Ex.: Maria foi costureira por 5 anos e hoje faz consertos de roupa em casa."
   },
   "por_tipo": {
    "Produto": {
     "ajuda": {
      "texto": "Vale o que você aprendeu em outro trabalho, em casa ou sozinho.",
      "exemplo": "Ex.: Joana faz bolo para a família há anos e hoje vende bolo de pote para os vizinhos."
     }
    },
    "Mercadoria": {
     "pergunta": "Você já conhece bem o que vai revender?",
     "apoio": null,
     "pergunta_com_resposta": {
      "de": "M1.P03",
      "modelo": "Você já conhece bem {resposta} e sabe onde comprar?"
     },
     "opcoes": [
      {
       "texto": "Sim, conheço bem o produto e onde comprar",
       "mensagem": null
      },
      {
       "texto": "Conheço um pouco, ainda estou pesquisando",
       "mensagem": {
        "titulo": "Dica",
        "texto": "Compare preço e qualidade em mais de um fornecedor antes de comprar muito."
       }
      },
      {
       "texto": "Ainda não conheço",
       "mensagem": {
        "titulo": "Dica",
        "texto": "Tudo bem começar do zero. Compre pouco no começo e pesquise pelo menos 2 fornecedores."
       }
      }
     ],
     "ajuda": {
      "texto": "Pense na qualidade, no preço e em onde comprar.",
      "exemplo": "Ex.: Ana comprava roupas numa fábrica para ela e hoje revende para as vizinhas."
     }
    }
   }
  },
  {
   "codigo": "M1.P05",
   "numero": "5",
   "condicao": "sempre",
   "pergunta": "Quanto tempo por dia você tem para o negócio?",
   "tipo": "escolha",
   "opcoes": [
    {
     "texto": "Até 1 hora por dia",
     "mensagem": {
      "titulo": "Dica",
      "texto": "Pouco tempo também dá certo. Comece com poucos clientes e faça sob encomenda."
     }
    },
    {
     "texto": "De 1 a 3 horas por dia",
     "mensagem": null
    },
    {
     "texto": "Mais de 3 horas por dia",
     "mensagem": null
    },
    {
     "texto": "Só nos fins de semana",
     "mensagem": {
      "titulo": "Dica",
      "texto": "Venda em feiras, eventos ou por encomenda para entregar no fim de semana."
     }
    }
   ],
   "ajuda": {
    "texto": "Conte só o tempo que sobra depois do trabalho, da casa e da família. Pouco tempo também dá para começar.",
    "exemplo": "Ex.: “Trabalho de segunda a sexta. Só posso fazer meus doces no sábado.”"
   },
   "por_tipo": {
    "Serviço": {
     "ajuda": {
      "texto": "Conte só o tempo que sobra depois do trabalho, da casa e da família. Pouco tempo também dá para começar.",
      "exemplo": "Ex.: “Trabalho de segunda a sexta. Só posso atender minhas clientes de manicure no sábado.”"
     }
    },
    "Mercadoria": {
     "ajuda": {
      "texto": "Conte só o tempo que sobra depois do trabalho, da casa e da família. Pouco tempo também dá para começar.",
      "exemplo": "Ex.: “Trabalho de segunda a sexta. Só posso buscar e entregar as encomendas no sábado.”"
     }
    }
   }
  },
  {
   "codigo": "M1.P05A",
   "numero": "5A",
   "condicao": "M1.P05 = \"Até 1 hora por dia\" ou M1.P05 = \"Só nos fins de semana\"",
   "pergunta": "Se o negócio crescer, você consegue mais tempo para ele?",
   "tipo": "escolha",
   "opcoes": [
    {
     "texto": "Sim, consigo arrumar mais tempo",
     "mensagem": null
    },
    {
     "texto": "Não, meus horários não podem mudar",
     "mensagem": {
      "titulo": "Dica",
      "texto": "Tudo bem. Seu negócio pode crescer devagar, no seu ritmo."
     }
    },
    {
     "texto": "Não sei dizer",
     "mensagem": null
    }
   ],
   "comoDescobrir": [
    "Anote por uma semana o que você faz em cada parte do dia e marque onde sobra um tempinho.",
    "Converse com quem mora com você: alguém pode ajudar com a casa ou com os filhos em alguns horários?"
   ],
   "promptIA": "Eu trabalho [seus dias e horários] e cuido de [casa, filhos ou outra tarefa]. Quero começar a vender [o que você vende]. Me ajude a montar uma rotina simples da semana mostrando onde eu poderia achar de 2 a 5 horas a mais para o negócio, sem prejudicar minha família."
  },
  {
   "codigo": "M1.P06",
   "numero": "6",
   "condicao": "sempre",
   "pergunta": "Você já tem o que precisa para trabalhar?",
   "tipo": "escolha",
   "opcoes": [
    {
     "texto": "Sim, tenho tudo",
     "mensagem": null
    },
    {
     "texto": "Tenho só uma parte",
     "mensagem": {
      "titulo": "Dica",
      "texto": "Antes de comprar o que falta, veja se dá para pegar emprestado ou alugar."
     }
    },
    {
     "texto": "Não tenho nada ainda",
     "mensagem": {
      "titulo": "Dica",
      "texto": "Comece com o mínimo. Dá para pegar emprestado ou alugar no começo."
     }
    }
   ],
   "por_tipo": {
    "Serviço": {
     "ajuda": {
      "texto": "Ex.: ferramentas, materiais de trabalho ou um espaço para atender."
     }
    },
    "Mercadoria": {
     "ajuda": {
      "texto": "Ex.: um lugar para guardar a mercadoria, embalagens ou um jeito de entregar."
     }
    }
   },
   "ajuda": {
    "texto": "Ex.: ferramentas, máquinas, panelas, forno ou um espaço em casa."
   }
  },
  {
   "codigo": "M1.P07",
   "numero": "7",
   "condicao": "sempre",
   "pergunta": "Quanto dinheiro você pode usar sem faltar para as contas da casa?",
   "tipo": "escolha",
   "opcoes": [
    {
     "texto": "Nada por enquanto",
     "mensagem": {
      "titulo": "Tudo bem",
      "texto": "Dá para começar sem dinheiro. Na próxima pergunta vamos ver como."
     }
    },
    {
     "texto": "Até R$ 100",
     "mensagem": {
      "titulo": "Dica",
      "texto": "Comece pequeno e use esse dinheiro aos poucos."
     }
    },
    {
     "texto": "Entre R$ 100 e R$ 500",
     "mensagem": null
    },
    {
     "texto": "Entre R$ 500 e R$ 1.000",
     "mensagem": null
    },
    {
     "texto": "Mais de R$ 1.000",
     "mensagem": {
      "titulo": "Dica",
      "texto": "Mesmo podendo usar mais, teste antes com pouco. Não pegue empréstimo no banco para começar."
     }
    }
   ],
   "ajuda": {
    "texto": "É um dinheiro que, se for perdido, não faz falta para comida, aluguel e contas.",
    "exemplo": "Ex.: “Tenho R$ 500 guardados para ingredientes. Se eu não vender nada, não falta comida em casa.”"
   },
   "video": {
    "texto": "Não sabe ou não entendeu? Assista ao vídeo",
    "assunto": "Antes de abrir: como descobrir quanto dinheiro você pode usar sem faltar nada em casa (olhar o que sobra no fim do mês, separar as contas fixas, não contar com empréstimo).",
    "url": null
   },
   "por_tipo": {
    "Serviço": {
     "ajuda": {
      "texto": "É um dinheiro que, se for perdido, não faz falta para comida, aluguel e contas.",
      "exemplo": "Ex.: “Tenho R$ 300 guardados para esmaltes e alicates. Se eu não tiver clientes, não falta comida em casa.”"
     }
    },
    "Mercadoria": {
     "ajuda": {
      "texto": "É um dinheiro que, se for perdido, não faz falta para comida, aluguel e contas.",
      "exemplo": "Ex.: “Tenho R$ 500 guardados para as primeiras peças. Se eu não vender nada, não falta comida em casa.”"
     }
    }
   }
  },
  {
   "codigo": "M1.P07A",
   "numero": "7A",
   "condicao": "M1.P07 = \"Nada por enquanto\" ou M1.P06 = \"Não tenho nada ainda\"",
   "pergunta": "Como você pensa em começar sem dinheiro ou material?",
   "tipo": "escolha",
   "opcoes": [
    {
     "texto": "Pegando emprestado com amigos ou família",
     "mensagem": {
      "titulo": "Dica",
      "texto": "Combine por escrito quanto e quando você vai devolver."
     }
    },
    {
     "texto": "Pagando alguém para fazer uma parte do trabalho",
     "mensagem": null
    },
    {
     "texto": "Vendendo por encomenda, com o cliente pagando uma parte antes",
     "mensagem": null
    },
    {
     "texto": "Juntando dinheiro primeiro",
     "mensagem": null
    },
    {
     "texto": "Não sei dizer",
     "mensagem": null
    }
   ],
   "comoDescobrir": [
    "Pergunte a 3 pessoas se comprariam por encomenda e se pagariam metade adiantado. Esse dinheiro compra o material.",
    "Liste o que dá para pegar emprestado com família, vizinhos ou amigos: forno, ferramenta, espaço."
   ],
   "promptIA": "Quero começar a vender [o que você vende], mas tenho pouco ou nenhum dinheiro e pouco material. Me dê 5 jeitos simples de começar gastando pouco ou nada, como vender por encomenda com pagamento adiantado ou pegar material emprestado. Explique cada um em linguagem simples."
  },
  {
   "codigo": "M1.P08",
   "numero": "8",
   "condicao": "sempre",
   "pergunta": "O que mais te preocupa agora?",
   "apoio": "Pode marcar mais de uma.",
   "tipo": "multipla",
   "opcoes": [
    {
     "texto": "Ainda não sei fazer direito",
     "mensagem": null
    },
    {
     "texto": "Me falta lugar ou equipamento",
     "mensagem": null
    },
    {
     "texto": "Conheço poucas pessoas para vender ou me ajudar",
     "mensagem": null
    },
    {
     "texto": "Tenho dificuldade com celular, internet ou redes sociais",
     "mensagem": null
    },
    {
     "texto": "Outra coisa",
     "mensagem": null,
     "campo": true,
     "placeholder": "Ex.: medo de não vender"
    }
   ],
   "por_tipo": {
    "Mercadoria": {
     "opcoes": [
      {
       "texto": "Ainda não conheço bem o produto ou os fornecedores",
       "mensagem": null
      },
      {
       "texto": "Me falta lugar ou equipamento",
       "mensagem": null
      },
      {
       "texto": "Conheço poucas pessoas para vender ou me ajudar",
       "mensagem": null
      },
      {
       "texto": "Tenho dificuldade com celular, internet ou redes sociais",
       "mensagem": null
      },
      {
       "texto": "Outra coisa",
       "mensagem": null,
       "campo": true,
       "placeholder": "Ex.: medo de não vender"
      }
     ]
    }
   }
  }
 ],
 "regras": [],
 "instrumentos": {
  "lista": []
 },
 "educativo": [],
 "casos": []
};
