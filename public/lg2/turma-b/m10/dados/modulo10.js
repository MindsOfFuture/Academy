/* Gerado por extrair_m10.py a partir da planilha do Grupo 10 e depois ajustado à mão na versão leve
   (nov/2026, pedido da coordenação): enunciados mais curtos (M10-06, M10-09, M10-11), "instrucao" (linha curta
   à vista), capa.frase/minutos e, por pergunta, a ajuda do "Não sei" (comoDescobrir = passos; promptIA = pedido
   pronto para copiar). Os textos das opções e dos caminhos não mudam: outros módulos e o diagnóstico leem os
   valores salvos. Ao regenerar pelo extrator, reaplique esses campos. */
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
  "entrega": "Ao final, o módulo entrega um diagnóstico sobre a comunicação, rotina e necessidades de equipe, além de um resumo com os 3 problemas mais urgentes e próximos passos para compor um plano de ação direcionado.",
  "frase": "Organize como você vende e saia com um plano dos 3 passos mais urgentes.",
  "minutos": 15
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
  ],
  "comoDescobrir": [
   "Liste as tarefas do negócio que você não consegue ou não gosta de fazer. Se forem uma ou duas, uma parceria ou ajuda avulsa pode resolver sem sócio.",
   "Se pensa em alguém, converse: essa pessoa entraria com dinheiro, com trabalho ou com os dois? Como vocês dividiriam o resultado?"
  ],
  "promptIA": "Tenho um pequeno negócio de [o que você vende] e penso em ter um sócio que entraria com [dinheiro, trabalho ou os dois]. Me explique em linguagem simples as vantagens e os riscos de ter sócio e me dê 5 perguntas para conversar com essa pessoa antes de decidir."
 },
 "perguntas": [
  {
   "codigo": "M10-01",
   "fase": "Como você vende",
   "pergunta": "Além de [canais de venda], por onde falam os clientes?",
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
   "tipo": "Seleção múltipla",
   "instrucao": "Pode marcar mais de um.",
   "comoDescobrir": [
    "Abra o celular e veja por onde chegaram as últimas 5 conversas com clientes: mensagem, rede social, ligação ou alguém que veio falar com você.",
    "Pergunte a 3 clientes ou conhecidos: “Se quisesse me pedir algo, por onde você me chamaria?”"
   ],
   "promptIA": "Tenho um pequeno negócio de [o que você vende] para [quem compra], em [seu bairro e cidade]. Quais são os 2 ou 3 jeitos mais comuns de esse tipo de cliente falar com um pequeno negócio como o meu? Para cada um, diga o que preciso para começar e quanto tempo por dia ele toma."
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
   "tipo": "Seleção única",
   "comoDescobrir": [
    "Nos próximos 3 dias, quando chegar uma mensagem de cliente, anote a hora em que ela chegou e a hora em que você respondeu.",
    "Olhe as últimas conversas no celular: o horário aparece ao lado de cada mensagem. Compare o da pergunta com o da sua resposta."
   ],
   "promptIA": "Recebo mensagens de clientes pelo [por onde os clientes falam com você] e nem sempre respondo rápido porque [como é a sua rotina]. Me ajude a montar um jeito simples de responder clientes no mesmo dia, com 2 horários fixos para olhar as mensagens e uma mensagem automática curta avisando quando vou responder."
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
   "tipo": "Seleção única + roteiro editável",
   "comoDescobrir": [
    "Lembre a última venda do começo ao fim: como a pessoa chegou, o que perguntou, como você disse o preço e como ela pagou.",
    "Escreva esses passos numa folha, na ordem. Compare com o roteiro abaixo e ajuste o que for diferente."
   ],
   "promptIA": "Vendo [o que você vende] para [quem compra] por [preço]. Me ajude a montar um roteiro simples de venda pelo [WhatsApp ou pessoalmente], com 5 a 7 passos: do primeiro contato até receber o pagamento e falar com o cliente depois. Para cada passo, sugira uma frase curta que eu possa usar."
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
   "tipo": "Seleção única",
   "comoDescobrir": [
    "Veja as conversas com quem já comprou: depois da entrega, você mandou alguma mensagem? Conte quantas vezes isso aconteceu.",
    "Na próxima venda, mande uma mensagem 2 ou 3 dias depois (“Deu tudo certo? O que achou?”) e anote a resposta."
   ],
   "promptIA": "Vendo [o que você vende]. Escreva 3 mensagens curtas e simpáticas para mandar ao cliente alguns dias depois da entrega: uma para perguntar se deu tudo certo, uma para pedir a opinião e uma para oferecer de novo. Sem exagero e sem promessas."
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
   "tipo": "Seleção única",
   "instrucao": "Escolha a principal.",
   "comoDescobrir": [
    "Pergunte a 3 clientes ou conhecidos como eles descobrem pequenos negócios no bairro: indicação, grupo de mensagem, rede social ou cartaz?",
    "Observe onde negócios parecidos com o seu aparecem (grupos do bairro, redes sociais, murais de padaria ou igreja) e anote 2 lugares."
   ],
   "promptIA": "Tenho um pequeno negócio de [o que você vende] para [quem compra] em [seu bairro e cidade]. Tenho [quanto tempo por semana] e [quanto dinheiro] para divulgar. Me sugira 3 jeitos de divulgar nas próximas 4 semanas, começando pelos que não custam nada, e diga como saber se cada um funcionou."
  },
  {
   "codigo": "M10-06",
   "fase": "Pessoas",
   "pergunta": "Vocês já combinaram por escrito como dividem o trabalho, o dinheiro e o resultado?",
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
   "tipo": "Seleção única",
   "comoDescobrir": [
    "Pergunte ao seu sócio se vocês já anotaram em algum lugar (papel, mensagem ou contrato) quem faz o quê e como dividem o dinheiro.",
    "Procure nas conversas de vocês: um combinado escrito em mensagem já é um começo. Use os 5 itens do checklist no resultado para conferir o que falta."
   ],
   "promptIA": "Tenho um pequeno negócio de [o que você vende] com um sócio. Me ajude a fazer uma lista simples do que precisamos combinar por escrito: quem faz o quê, quanto cada um coloca, como dividimos o resultado, como decidimos e o que acontece se um sair. Lembre que a forma do documento deve ser vista com um contador ou advogado."
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
   "tipo": "Seleção por etapa",
   "instrucao": "Escolha uma pessoa para cada etapa."
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
   "tipo": "Seleção única",
   "comoDescobrir": [
    "Durante uma semana, anote os pedidos que você recusou ou atrasou por falta de tempo e as tarefas que ficaram para depois.",
    "Veja no Módulo 5 quanto sobra por mês. Contratar só cabe se essa sobra pagar a pessoa todo mês, até nos meses fracos."
   ],
   "promptIA": "Tenho um pequeno negócio de [o que você vende]. Trabalho [quantas horas por semana] e vendo cerca de [quantas unidades por mês]. Sobram uns R$ [quanto sobra por mês]. Me ajude a pensar se já vale contratar alguém ou se é melhor começar com ajuda avulsa ou parceria, com os prós e os contras de cada caminho."
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
   "tipo": "Seleção múltipla",
   "instrucao": "Pode marcar mais de uma."
  },
  {
   "codigo": "M10-09",
   "fase": "Seu plano",
   "pergunta": "Quais 3 pontos são mais urgentes agora?",
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
   "tipo": "Seleção múltipla (até 3) + 'Outro'",
   "instrucao": "Escolha até 3 ou escreva outro.",
   "comoDescobrir": [
    "Para cada ponto, pergunte: “Se eu não fizer nada, posso perder dinheiro ou clientes logo?” Os que forem “sim” vêm primeiro.",
    "Depois, veja o que destrava o resto. Por exemplo: divulgar só faz sentido depois de ter o preço. Comece pelo que destrava."
   ],
   "promptIA": "Tenho um pequeno negócio de [o que você vende]. Estes são os pontos em aberto: [cole aqui os pontos da lista]. Me ajude a escolher os 3 mais urgentes, pensando no que pode me fazer perder dinheiro ou clientes primeiro e no que destrava os outros. Explique em linguagem simples."
  },
  {
   "codigo": "M10-10",
   "fase": "Seu plano",
   "pergunta": "O que pode acontecer após 3 meses sem agir?",
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
   "tipo": "Escala por prioridade",
   "instrucao": "Responda para cada uma.",
   "comoDescobrir": [
    "Pense no que já aconteceu nas últimas semanas por causa desse ponto: perdeu venda, gastou mais ou teve problema?",
    "Pergunte a alguém que tem um negócio parecido o que acontece quando isso fica meses sem resolver."
   ],
   "promptIA": "Tenho um pequeno negócio de [o que você vende]. Um ponto em aberto é: [o ponto]. Se eu esperar 3 meses sem resolver, o que costuma acontecer com um pequeno negócio como o meu? Responda em linguagem simples, sem exagerar."
  },
  {
   "codigo": "M10-11",
   "fase": "Seu plano",
   "pergunta": "Para sua prioridade mais urgente: o que fazer, até quando e como saber se deu certo?",
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
   "tipo": "Ação (texto) + data + sinal + número",
   "comoDescobrir": [
    "Escolha a menor ação que você consegue fazer nesta semana sobre essa prioridade: ligar, perguntar, anotar ou testar algo.",
    "Marque uma data daqui a no máximo 14 dias e decida o que vai contar para saber se deu certo: pedidos, respostas ou vendas."
   ],
   "promptIA": "Minha prioridade no negócio de [o que você vende] é: [sua prioridade]. Me ajude a escrever um plano curto: uma ação que eu consiga fazer nas próximas 2 semanas, a data e um número simples que mostre se funcionou."
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
