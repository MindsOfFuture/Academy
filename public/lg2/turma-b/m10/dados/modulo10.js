/* Gerado por extrair_m10.py a partir da planilha do Grupo 10. Não edite à mão. */
window.MODULO10 = {
 "origem": "Grupo 10 · Laboratório de Gestão II · FACC/UFJF",
 "fonte": {
  "arquivo": "Modulo_10_Perguntas_e_Caminhos.xlsx",
  "sha256": "b1daf00cb3df9c9fef1fa6b68235c332a401c0d293ae44fa554de332d2df231e"
 },
 "modulo": {
  "numero": 10,
  "nome": "Comunicação, vendas, pessoas e plano de ação"
 },
 "capa": {
  "objetivo": "Ao final do módulo, o usuário será capaz de organizar sua mensagem de vendas, mapear seus canais de atendimento, identificar gargalos de rotina, analisar a necessidade de sociedade ou contratação e definir as prioridades mais urgentes do negócio. Também poderá elaborar um plano de ação focado para resolver os principais problemas.",
  "para_quem": "Destinado para pessoas que desejam estruturar a operação e a comunicação de um pequeno negócio. Geralmente, esses usuários chegam ao módulo com dificuldades para explicar o que vendem, lidar com clientes nos diversos canais, organizar o tempo entre a operação e a gestão, e tomar decisões sobre sociedade e contratação. O módulo busca ajudá-los a analisar essas informações e priorizar ações imediatas.",
  "ter_em_maos": "O usuário precisa ter em mente ou anotado como realiza o seu atendimento hoje, os canais que utiliza, as dificuldades que enfrenta na rotina diária e as expectativas sobre parcerias ou contratações.",
  "entrega": "Ao final, o módulo entrega um diagnóstico sobre a comunicação, rotina e necessidades de equipe, além de um resumo com os 3 problemas mais urgentes e próximos passos para compor um plano de ação direcionado."
 },
 "base": [
  {
   "codigo": "M10-C01",
   "conceito": "Mensagem",
   "definicao": "Frase curta que diz para quem é o negócio, o que ele oferece, qual benefício entrega e o que o diferencia.",
   "porque": "Se o cliente não entende o que você faz em poucos segundos, tende a não perguntar nem comprar. Também orienta o que você escreve e posta."
  },
  {
   "codigo": "M10-C02",
   "conceito": "Canais físicos",
   "definicao": "Lugares onde o cliente encontra o negócio ou conversa com ele: WhatsApp, Instagram, loja, indicação, site, entre outros.",
   "porque": "Estar em todos os canais cansa e dispersa. Escolher poucos que você consegue manter ativos costuma ser mais viável, sempre com o mesmo preço, prazo e jeito de falar."
  },
  {
   "codigo": "M10-C03",
   "conceito": "Atendimento",
   "definicao": "Como você recebe, responde e resolve as demandas do cliente antes, durante e depois da compra.",
   "porque": "É onde muitos pequenos negócios ganham ou perdem clientes: resposta lenta ou confusa afasta, resposta clara aproxima."
  },
  {
   "codigo": "M10-C04",
   "conceito": "Vendas",
   "definicao": "Sequência de passos para vender: abordar, entender a necessidade, fazer a proposta, negociar, fechar e acompanhar.",
   "porque": "Vender sem sequência depende de sorte. Registrar as etapas mostra onde as vendas travam e o que testar primeiro."
  },
  {
   "codigo": "M10-C05",
   "conceito": "Pós-venda",
   "definicao": "Contato depois da entrega: confirmar se deu certo, ouvir reclamações, pedir feedbacks e convidar para voltar.",
   "porque": "Cliente que volta e indica costuma custar menos do que conquistar um novo. Também revela falhas que você ainda não via."
  },
  {
   "codigo": "M10-C06",
   "conceito": "Competências",
   "definicao": "Conhecimentos, habilidades e atitudes necessários para executar as tarefas do negócio.",
   "porque": "Antes de chamar um sócio ou contratar, é preciso saber o que você já sabe fazer e o que falta. Uma lacuna pode ser resolvida aprendendo, terceirizando ou fazendo parceria."
  },
  {
   "codigo": "M10-C07",
   "conceito": "Sócios",
   "definicao": "Pessoas que dividem com você o negócio, em dinheiro, trabalho, resultado e responsabilidades.",
   "porque": "Sociedade sem regras claras é fonte comum de conflito. Combinar antes quem entra com o quê e como se divide o resultado ajuda a evitar problemas. Os detalhes jurídicos devem ser confirmados com profissional habilitado."
  },
  {
   "codigo": "M10-C08",
   "conceito": "Responsabilidades",
   "definicao": "Definição por escrito de quem faz o quê, até quando e quem decide cada assunto.",
   "porque": "Evita tarefas sem dono ou feitas em duplicidade. Vale também para quem trabalha sozinho, para decidir onde colocar o próprio tempo."
  },
  {
   "codigo": "M10-C09",
   "conceito": "Contratação",
   "definicao": "Decidir se vale colocar alguém para trabalhar no negócio, analisando demanda, carga de trabalho, capacidade de pagar e alternativas.",
   "porque": "Contratar cria um compromisso contínuo, além do salário. Analisar antes reduz o risco de assumir um custo que o negócio não sustenta. Regras trabalhistas devem ser confirmadas em fonte oficial."
  },
  {
   "codigo": "M10-C10",
   "conceito": "Prioridades",
   "definicao": "O que merece atenção primeiro, considerando impacto, prazo e risco de piorar.",
   "porque": "Com pouco tempo e dinheiro, tentar fazer tudo ao mesmo tempo costuma terminar em nada concluído. Priorizar permite montar um plano de 90 dias com poucas ações."
  }
 ],
 "fases": [
  "Como você vende",
  "Pessoas",
  "Seu plano"
 ],
 "socio": {
  "pergunta": "Você tem ou pretende ter sócio?",
  "opcoes": [
   "Sim",
   "Não",
   "Não sei"
  ]
 },
 "perguntas": [
  {
   "codigo": "M10-01",
   "fase": "Como você vende",
   "pergunta": "Além de [canais de venda], por onde os clientes falam com você?",
   "descobre": "Canais de conversa",
   "aparece": "Sempre",
   "guarda": "Canais de conversa",
   "caminhos": [
    {
     "opcao": "Uma ou mais opções (WhatsApp, Instagram ou outra rede, telefone, pessoalmente, e-mail)",
     "retorno": "Resposta",
     "texto": "Anotado. Concentrar a conversa em poucos canais ajuda a não perder pedidos."
    },
    {
     "opcao": "Ainda não falo com clientes",
     "retorno": "Dica",
     "texto": "Pense em por onde o seu cliente prefere falar: o Módulo 2 mostrou onde ele procura ([onde procuram])."
    },
    {
     "opcao": "Não sei",
     "retorno": "Dica",
     "texto": "Lembre como foram os últimos contatos: mensagem, ligação ou pessoalmente?"
    }
   ],
   "pergunta_caminhos": "Além de [canais de venda do Módulo 3], por onde os clientes falam com você?",
   "apoio": "Marque todos. Não informe números nem perfis.",
   "tipo": "Seleção múltipla"
  },
  {
   "codigo": "M10-02",
   "fase": "Como você vende",
   "pergunta": "Em quanto tempo você costuma responder a um cliente?",
   "descobre": "Tempo de resposta",
   "aparece": "Sempre",
   "guarda": "Tempo de resposta",
   "caminhos": [
    {
     "opcao": "Em até 1 hora / No mesmo dia",
     "retorno": "Resposta",
     "texto": "Responder rápido costuma pesar na decisão de compra."
    },
    {
     "opcao": "Em 1 ou 2 dias",
     "retorno": "Dica",
     "texto": "Separar dois momentos fixos por dia para responder pode ajudar. [Se tempo de apoio alto no M7]: isso também pesa no seu tempo de apoio."
    },
    {
     "opcao": "Mais de 2 dias",
     "retorno": "Atenção",
     "texto": "Quem espera muito pode comprar de outra pessoa. Uma mensagem automática dizendo quando você responde pode ajudar."
    },
    {
     "opcao": "Ainda não vendo / Não sei",
     "retorno": "Dica",
     "texto": "Quando começar, anote a hora da mensagem e a hora da sua resposta em alguns contatos."
    }
   ],
   "apoio": "Pense na última semana. Se ainda não vende, pense no que consegue fazer.",
   "tipo": "Seleção única"
  },
  {
   "codigo": "M10-03",
   "fase": "Como você vende",
   "pergunta": "Quando alguém demonstra interesse, você segue uma sequência até fechar a venda?",
   "descobre": "Sequência de venda",
   "aparece": "Sempre",
   "guarda": "Roteiro de venda",
   "caminhos": [
    {
     "opcao": "Sim, sigo passos parecidos",
     "retorno": "Resposta",
     "texto": "Confira o roteiro. Ele usa o que você já respondeu nos outros módulos."
    },
    {
     "opcao": "Depende do cliente",
     "retorno": "Dica",
     "texto": "Um roteiro base ajuda a não esquecer passos, mesmo que cada conversa seja diferente."
    },
    {
     "opcao": "Ainda não vendi",
     "retorno": "Dica",
     "texto": "Use o roteiro no seu teste e anote o que funcionou."
    },
    {
     "opcao": "Não sei",
     "retorno": "Dica",
     "texto": "Lembre a última venda: o que aconteceu entre o primeiro contato e o pagamento?"
    }
   ],
   "apoio": "Você já ouviu [pessoas ouvidas] pessoas no Módulo 2. Montamos um roteiro com o que você respondeu: [etapas]. Confira.",
   "tipo": "Seleção única + roteiro editável"
  },
  {
   "codigo": "M10-04",
   "fase": "Como você vende",
   "pergunta": "Depois da entrega, você volta a falar com o cliente?",
   "descobre": "Pós-venda",
   "aparece": "Sempre",
   "guarda": "Pós-venda",
   "caminhos": [
    {
     "opcao": "Sim, peço opinião / Sim, ofereço de novo",
     "retorno": "Resposta",
     "texto": "Anote o que os clientes dizem: isso alimenta o seu padrão de qualidade (Módulo 7)."
    },
    {
     "opcao": "Não, só se o cliente me procura",
     "retorno": "Dica",
     "texto": "Uma mensagem alguns dias depois, perguntando se deu tudo certo, pode trazer a próxima venda e indicações."
    },
    {
     "opcao": "Ainda não vendi / Não sei",
     "retorno": "Dica",
     "texto": "Inclua uma mensagem depois da entrega no seu roteiro de venda."
    }
   ],
   "apoio": "[Se compra recorrente no Módulo 2]: Você disse que o cliente compra [frequência]. Voltar a falar pode trazer a próxima venda.",
   "tipo": "Seleção única"
  },
  {
   "codigo": "M10-05",
   "fase": "Como você vende",
   "pergunta": "Como as pessoas vão saber que [oferta em foco] existe nas próximas semanas?",
   "descobre": "Divulgação principal",
   "aparece": "Sempre",
   "guarda": "Divulgação",
   "caminhos": [
    {
     "opcao": "Indicação de quem já comprou / Redes sociais próprias / Grupos de mensagem / Cartaz ou panfleto no bairro / Parceria com outro negócio",
     "retorno": "Resposta",
     "texto": "Anotado. A mensagem de apresentação usa o seu diferencial; confira e ajuste."
    },
    {
     "opcao": "Anúncio pago",
     "retorno": "Atenção",
     "texto": "Anúncio pago é um gasto. Confira se ele entrou nos seus gastos do Módulo 5 e defina um limite antes de começar."
    },
    {
     "opcao": "Ainda não sei",
     "retorno": "Dica",
     "texto": "Comece pelo que não custa: avisar quem já comprou e pedir indicação."
    }
   ],
   "apoio": "Escolha a principal. A mensagem pode partir do seu diferencial: [diferencial do Módulo 3].",
   "tipo": "Seleção única"
  },
  {
   "codigo": "M10-06",
   "fase": "Pessoas",
   "pergunta": "Vocês já combinaram por escrito quem faz o quê, quanto cada um coloca e como dividem o resultado?",
   "descobre": "Acordo entre sócios",
   "aparece": "Se M8-03 = sim",
   "guarda": "Acordo entre sócios",
   "caminhos": [
    {
     "opcao": "Sim, por escrito",
     "retorno": "Resposta",
     "texto": "Ótimo. Guardem o documento e revisem se algo mudar."
    },
    {
     "opcao": "Só combinamos de boca / Ainda não",
     "retorno": "Atenção",
     "texto": "Um acordo escrito evita desentendimentos sobre trabalho, dinheiro e saída de um sócio. Para a forma do documento, procure um contador ou advogado."
    },
    {
     "opcao": "Não sei",
     "retorno": "Dica",
     "texto": "Converse com o sócio sobre os itens do checklist de acordo."
    }
   ],
   "apoio": "Você disse no Módulo 8 que terá sócio. Combinar antes evita desentendimentos depois.",
   "tipo": "Seleção única"
  },
  {
   "codigo": "M10-07",
   "fase": "Pessoas",
   "pergunta": "Quem cuida destas etapas do seu processo?",
   "descobre": "Responsáveis",
   "aparece": "Só se o mapa do M7 tiver etapas sem responsável",
   "guarda": "Responsáveis por etapa",
   "caminhos": [
    {
     "opcao": "Responsável escolhido por etapa (eu, sócio, ajudante, ninguém ainda)",
     "retorno": "Resposta",
     "texto": "Mapa atualizado."
    },
    {
     "opcao": "'Ninguém ainda' em alguma etapa",
     "retorno": "Dica",
     "texto": "Etapa sem responsável costuma ser a que atrasa."
    }
   ],
   "apoio": "Etapas do seu mapa (Módulo 7) que ainda estão sem responsável: [etapas].",
   "tipo": "Seleção por etapa"
  },
  {
   "codigo": "M10-08",
   "fase": "Pessoas",
   "pergunta": "Você pensa em contratar alguém nos próximos meses?",
   "descobre": "Intenção de contratar",
   "aparece": "Sempre",
   "guarda": "Contratação",
   "caminhos": [
    {
     "opcao": "Não",
     "retorno": "Resposta",
     "texto": "Anotado."
    },
    {
     "opcao": "Sim, para produzir ou atender / para vender ou divulgar / para tarefas administrativas",
     "retorno": "Atenção",
     "texto": "Contratar tem custo todo mês e regras próprias. Antes de decidir, veja as alternativas e converse com um contador sobre a forma de contratar."
    },
    {
     "opcao": "Não sei",
     "retorno": "Dica",
     "texto": "Pense no que você deixa de fazer por falta de tempo. É isso que alguém faria."
    }
   ],
   "apoio": "[Se capacidade curta no Módulo 7]: Com o tempo informado, cabem cerca de [N] por mês, e você pretende [volume].",
   "tipo": "Seleção única"
  },
  {
   "codigo": "M10-08a",
   "fase": "Pessoas",
   "pergunta": "Antes de contratar, quais outras formas você já considerou?",
   "descobre": "Alternativas",
   "aparece": "Se pensa em contratar",
   "guarda": "Alternativas",
   "caminhos": [
    {
     "opcao": "Uma ou mais (parceria com outro negócio, profissional por serviço avulso, ajuda da família, menos variedade de opções, rever o tempo de apoio, ainda nenhuma)",
     "retorno": "Resposta",
     "texto": "Anotado. O plano pode começar testando uma alternativa antes de contratar."
    }
   ],
   "apoio": "Marque as que você já pensou. Contratar tem custo fixo e regras próprias.",
   "tipo": "Seleção múltipla"
  },
  {
   "codigo": "M10-09",
   "fase": "Seu plano",
   "pergunta": "Estes são os pontos que apareceram no seu percurso. Quais são os 3 mais urgentes para você?",
   "descobre": "Prioridades",
   "aparece": "Sempre (lista pré-preenchida)",
   "guarda": "Prioridades (até 3)",
   "caminhos": [
    {
     "opcao": "Até 3 itens da lista",
     "retorno": "Resposta",
     "texto": "Anotado. Vamos ver qual delas é a mais urgente."
    },
    {
     "opcao": "Outro (texto)",
     "retorno": "Resposta",
     "texto": "Anotado."
    },
    {
     "opcao": "Mais de 3",
     "retorno": "Dica",
     "texto": "Com três prioridades fica mais fácil começar. As outras ficam guardadas."
    },
    {
     "opcao": "Não sei",
     "retorno": "Dica",
     "texto": "Deixamos marcadas as três que mais pesam pelo que você respondeu. Você pode trocar."
    }
   ],
   "apoio": "Juntamos o que ficou em aberto nos módulos anteriores. Escolha até 3 ou escreva outro.",
   "tipo": "Seleção múltipla (até 3) + 'Outro'"
  },
  {
   "codigo": "M10-10",
   "fase": "Seu plano",
   "pergunta": "Se você esperar 3 meses sem agir, o que tende a acontecer com cada uma?",
   "descobre": "Urgência",
   "aparece": "Sempre",
   "guarda": "Urgência por prioridade",
   "caminhos": [
    {
     "opcao": "Para cada prioridade: piora muito / piora um pouco / fica igual / não sei",
     "retorno": "Resposta",
     "texto": "A mais urgente parece ser: [prioridade]."
    }
   ],
   "apoio": "Responda para cada prioridade. Isso ajuda a decidir por onde começar.",
   "tipo": "Escala por prioridade"
  },
  {
   "codigo": "M10-11",
   "fase": "Seu plano",
   "pergunta": "Para a prioridade mais urgente: o que você vai fazer, até quando, e que sinal vai mostrar que funcionou?",
   "descobre": "Plano da prioridade principal",
   "aparece": "Sempre",
   "guarda": "Plano de ação",
   "caminhos": [
    {
     "opcao": "Ação, data, sinal e número preenchidos",
     "retorno": "Resposta",
     "texto": "Seu plano: [frase]. Combine com você mesmo de olhar o resultado nessa data."
    },
    {
     "opcao": "Sem número",
     "retorno": "Dica",
     "texto": "Quanto basta para dizer que funcionou? Definir antes evita mudar a régua depois."
    },
    {
     "opcao": "Data acima de 90 dias",
     "retorno": "Dica",
     "texto": "Um prazo longo dificulta acompanhar. Qual seria um primeiro passo para as próximas duas semanas?"
    },
    {
     "opcao": "Data inválida (passada)",
     "retorno": "Dica",
     "texto": "Escolha uma data a partir de hoje."
    },
    {
     "opcao": "Não sei",
     "retorno": "Dica",
     "texto": "Comece pelo menor passo possível desta semana."
    }
   ],
   "apoio": "Ex.: 'Fazer a consulta de viabilidade até sexta; sinal: resposta da prefeitura'. Ou: 'Divulgar no grupo do bairro por 2 semanas; sinal: 5 pedidos'.",
   "tipo": "Ação (texto) + data + sinal + número"
  },
  {
   "codigo": "M10-12",
   "fase": "Fechamento",
   "pergunta": "Este é o seu plano de ação e o retrato do seu negócio. Está certo?",
   "descobre": "Confirmação",
   "aparece": "Sempre (última tela)",
   "guarda": "Plano confirmado",
   "caminhos": [
    {
     "opcao": "Sim, salvar",
     "retorno": "Resposta",
     "texto": "Pronto! Seu plano está salvo. Tudo aqui são estimativas e orientações; as decisões são suas. [Se houver ofertas guardadas]: Quer fazer o percurso com [próxima oferta]?"
    },
    {
     "opcao": "Quero corrigir algo",
     "retorno": "Resposta",
     "texto": "Qual resposta você quer mudar?"
    }
   ],
   "apoio": "Confira antes de salvar. Você pode corrigir qualquer resposta, de qualquer módulo.",
   "tipo": "Seleção única"
  }
 ],
 "instrumentos": [
  {
   "nome": "Roteiro de venda",
   "mostra": "Passos do primeiro contato ao pós-venda, com o que dizer e o que confirmar em cada um.",
   "aviso": "Roteiro para adaptar a cada conversa."
  },
  {
   "nome": "Mensagem de apresentação",
   "mostra": "Duas ou três frases para apresentar a oferta, a partir do diferencial e da proposta de valor.",
   "aviso": "Confira se a mensagem promete só o que você entrega."
  },
  {
   "nome": "Checklist de acordo entre sócios",
   "mostra": "Itens a combinar: quem faz o quê; quanto cada um coloca; como divide o resultado; como decide; o que acontece se um sair.",
   "aviso": "Para a forma do documento, procure um contador ou advogado."
  },
  {
   "nome": "Plano de ação",
   "mostra": "Até 3 prioridades em ordem; para a principal: ação, prazo, sinal e quanto basta.",
   "aviso": "O plano é seu e pode mudar. Revise na data marcada."
  },
  {
   "nome": "Retrato final do percurso",
   "mostra": "Uma linha por módulo: o que já se sabe (fato), o que ainda é hipótese e o que falta.",
   "aviso": "Retrato com as suas respostas. Não é avaliação nem garantia."
  }
 ],
 "checklist_socios": [
  "quem faz o quê",
  "quanto cada um coloca",
  "como divide o resultado",
  "como decide",
  "o que acontece se um sair"
 ],
 "pedidos_ia": [
  {
   "pedido": "Mensagem de apresentação",
   "texto": "Tenho um pequeno negócio de [oferta em foco] para [grupo em foco]. O que o cliente ganha comigo: [diferencial]. Me ajude a organizar essas ideias em 3 versões curtas de mensagem, sem inventar promessas, preços ou números.",
   "conferir": "Leia em voz alta: soa como você? Promete só o que você entrega?",
   "obs": "Sem nome do negócio nem contato."
  }
 ],
 "modulos": [
  {
   "numero": 1,
   "nome": "Perfil do empreendedor e definição da ideia"
  },
  {
   "numero": 2,
   "nome": "Clientes, necessidades e comportamento de compra"
  },
  {
   "numero": 3,
   "nome": "Mercado e concorrentes"
  },
  {
   "numero": 4,
   "nome": "Produto, proposta de valor e teste da ideia"
  },
  {
   "numero": 5,
   "nome": "Custos, despesas, preço e margem"
  },
  {
   "numero": 6,
   "nome": "Investimento, capital de giro e fluxo de caixa"
  },
  {
   "numero": 7,
   "nome": "Operação, fornecedores, capacidade e qualidade"
  },
  {
   "numero": 8,
   "nome": "Formalização, enquadramento e tributação básica"
  },
  {
   "numero": 9,
   "nome": "Licenças, endereço e atividades reguladas"
  },
  {
   "numero": 10,
   "nome": "Comunicação, vendas, pessoas e plano de ação"
  }
 ],
 "resumo": {
  "blocos": [
   {
    "bloco": "Seu plano",
    "conteudo": "Prioridade principal com ação, prazo, sinal e quanto basta; as outras duas em ordem."
   },
   {
    "bloco": "Como você vende",
    "conteudo": "Roteiro de venda, mensagem de apresentação e divulgação."
   },
   {
    "bloco": "Pessoas",
    "conteudo": "Sócios e acordo, responsáveis, contratação."
   },
   {
    "bloco": "Retrato do negócio",
    "conteudo": "Uma linha por módulo: o que já se sabe, o que é hipótese, o que falta."
   },
   {
    "bloco": "Encaminhamento",
    "conteudo": "Um só, o mais importante (ex.: contador, prefeitura)."
   }
  ],
  "proximos": [
   {
    "situacao": "Plano completo",
    "mensagem": "Na data marcada, volte aqui e registre o que aconteceu."
   },
   {
    "situacao": "Plano sem sinal ou número",
    "mensagem": "Defina quanto basta antes de começar."
   },
   {
    "situacao": "Ofertas guardadas",
    "mensagem": "Quer fazer o percurso com [próxima oferta]? O que vale para o negócio todo já vem preenchido."
   }
  ],
  "cruzamentos": [
   {
    "quando": "Estágio = vendas e nenhum canal de conversa",
    "mensagem": "Você já vende, mas não marcou por onde fala com clientes. Quer rever?",
    "forma": "Pergunta gentil"
   },
   {
    "quando": "Compra recorrente (M2-05) e sem pós-venda",
    "mensagem": "Seu cliente compra [frequência]. Falar com ele depois da entrega pode trazer a próxima venda.",
    "forma": "Observação"
   },
   {
    "quando": "Resposta em mais de 2 dias e concorrentes no Módulo 3",
    "mensagem": "Quem espera muito pode comprar de [concorrente] ou de outra pessoa.",
    "forma": "Observação"
   },
   {
    "quando": "Contratar e capacidade com folga (M7)",
    "mensagem": "Com o tempo informado, ainda cabem cerca de [folga] por mês.",
    "forma": "Observação"
   },
   {
    "quando": "Anúncio pago sem gasto no Módulo 5",
    "mensagem": "O anúncio não aparece nos seus gastos. Quer incluir?",
    "forma": "Pergunta gentil"
   },
   {
    "quando": "Sócio sem acordo escrito",
    "mensagem": "Combinar por escrito antes de investir juntos evita desentendimentos.",
    "forma": "Observação"
   }
  ]
 }
};
