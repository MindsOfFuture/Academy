/* Gerado por extrair_m07.py a partir da planilha do Grupo 7. Não edite à mão. */
window.MODULO7 = {
 "origem": "Grupo 7 · Laboratório de Gestão II · FACC/UFJF",
 "modulo": {
  "numero": 7,
  "nome": "Operação, fornecedores, capacidade e qualidade"
 },
 "abertura": {
  "kicker": "Módulo 7: Operação, fornecedores, capacidade e qualidade",
  "titulo": "Como organizar o trabalho e a entrega",
  "objetivo": "Chegou a hora de organizar o que precisa acontecer para entregar o que você vende. Veja quanto cabe no seu tempo e o que precisa conferir antes de aceitar mais pedidos.",
  "para_voce_titulo": "Isso é para você que",
  "para_voce": [
   "Quer começar e precisa organizar o trabalho.",
   "Já vende e quer cuidar dos prazos e qualidade do produto/serviço.",
   "Quer entender o que pode atrasar ou parar o trabalho."
  ],
  "no_final_titulo": "No final, você vai ter",
  "no_final": [
   "Uma lista das etapas do pedido à entrega.",
   "Uma estimativa de quanto consegue fazer ou atender, se houver informações suficientes.",
   "Um quadro para comparar fornecedores e compras de mercadorias",
   "Uma lista do que conferir antes de entregar.",
   "Uma lista do que pode dar errado e o que fazer se acontecer.",
   "Poucos números para acompanhar toda semana."
  ],
  "nao_faz_titulo": "O que esta parte não faz",
  "nao_faz": [
   "Não garante vendas, lucro nem entregas no prazo.",
   "Não escolhe fornecedores e não decide se você deve comprar equipamentos ou contratar alguém.",
   "Também não informa quais regras legais valem para o seu caso.",
   "Quando necessário, procure a universidade, órgãos responsáveis ou profissionais da área."
  ]
 },
 "limites": "Não indica fornecedores por nome, não define preço, não diz quais regras sanitárias ou trabalhistas valem, não recomenda comprar equipamento ou contratar e não garante que a pessoa consegue atender a procura.",
 "fases": [
  "Seu processo",
  "Sua capacidade",
  "Fornecedores e estoque",
  "Qualidade e riscos"
 ],
 "perguntas": [
  {
   "codigo": "M7-01",
   "fase": "Seu processo",
   "pergunta": "Este é o caminho de [oferta em foco], do pedido até o cliente. Está parecido com o seu?",
   "descobre": "Mapa do processo confirmado",
   "aparece": "Sempre (mapa pré-montado)",
   "guarda": "Mapa do processo (etapas)",
   "caminhos": [
    {
     "opcao": "Sim, está parecido",
     "retorno": "Resposta",
     "texto": "Este é o mapa do seu processo. Vamos usá-lo para ver quanto cabe no seu tempo."
    },
    {
     "opcao": "Ajustei as etapas",
     "retorno": "Resposta",
     "texto": "Anotamos as mudanças. As etapas novas ficam sem tempo por enquanto; você pode completar depois."
    },
    {
     "opcao": "Mais de 8 etapas",
     "retorno": "Dica",
     "texto": "No celular, até 8 etapas ficam mais fáceis de acompanhar. Que tal juntar as que acontecem em sequência, como 'separar' e 'embalar'?"
    },
    {
     "opcao": "Retirou todas as etapas (vazio)",
     "retorno": "Dica",
     "texto": "Pense no que acontece desde que o cliente pede até receber. Se ainda não sabe, use o botão 'Não sei'."
    },
    {
     "opcao": "Não sei",
     "retorno": "Dica",
     "texto": "Na próxima vez que [fizer] [oferta em foco], anote cada passo que você dá, do pedido à entrega. Você pode voltar aqui depois."
    },
    {
     "opcao": "Qualquer resposta, com estágio = ideia",
     "retorno": "Observação",
     "texto": "Como você ainda não vende, este é o caminho imaginado. Ele fica como hipótese até você fazer pela primeira vez."
    }
   ],
   "apoio": "Montamos com o que você já contou: [etapas do Módulo 4], [forma de entrega] e [reposição do Módulo 6]. Mude a ordem, renomeie, inclua ou retire etapas. [Se ideia]: descreva como você imagina.",
   "tipo": "Lista editável de etapas (pré-montada)"
  },
  {
   "codigo": "M7-02",
   "fase": "Seu processo",
   "pergunta": "Quanto tempo você leva para [fazer] [oferta em foco]?",
   "descobre": "Tempo por unidade ou por lote",
   "aparece": "Só se o tempo não veio do Módulo 4 ou do Módulo 5",
   "guarda": "Tempo por unidade",
   "caminhos": [
    {
     "opcao": "Tempo por unidade",
     "retorno": "Resposta",
     "texto": "Anotado: cerca de [tempo] por unidade."
    },
    {
     "opcao": "Tempo do lote e unidades por lote",
     "retorno": "Resposta",
     "texto": "[N] unidades em [tempo]: cerca de [x] minutos por unidade."
    },
    {
     "opcao": "Tempo zero, negativo ou texto",
     "retorno": "Dica",
     "texto": "Informe um tempo maior que zero."
    },
    {
     "opcao": "Tempo muito alto (acima de 12 h por unidade; limiar a validar)",
     "retorno": "Dica",
     "texto": "Confira se o tempo está em horas e minutos. Ex.: 90 minutos são 1 h e 30 min."
    },
    {
     "opcao": "Não sei",
     "retorno": "Dica",
     "texto": "Na próxima vez, cronometre do começo ao fim. Uma medição real já ajuda muito."
    }
   ],
   "apoio": "Conte só o tempo de trabalho nas etapas de preparo e produção. Se faz várias de uma vez, informe o tempo do lote e quantas unidades saem.",
   "tipo": "Número (h e min) + unidades por vez"
  },
  {
   "codigo": "M7-03",
   "fase": "Sua capacidade",
   "pergunta": "Além de [fazer/atender], quanto do seu tempo por semana vai para responder clientes, comprar, entregar e divulgar?",
   "descobre": "Tempo de apoio",
   "aparece": "Sempre",
   "guarda": "Horas de apoio",
   "caminhos": [
    {
     "opcao": "Até 2 h",
     "retorno": "Dica",
     "texto": "Confira se isso inclui responder mensagens e ir comprar material. Muitas vezes essas tarefas tomam mais tempo do que parece."
    },
    {
     "opcao": "De 3 a 5 h",
     "retorno": "Resposta",
     "texto": "Anotado. Vamos descontar esse tempo das suas horas para estimar quanto sobra para [fazer/atender]."
    },
    {
     "opcao": "De 6 a 10 h",
     "retorno": "Resposta",
     "texto": "Anotado. Vamos descontar esse tempo das suas horas. [Se até 10h]: Isso usa quase todo o tempo que você disse ter por semana."
    },
    {
     "opcao": "Mais de 10 h",
     "retorno": "Atenção",
     "texto": "[Se até 10h]: Esse tempo é maior que as horas que você disse ter no Módulo 1. Quer corrigir as horas ou este tempo?"
    },
    {
     "opcao": "Não sei",
     "retorno": "Dica",
     "texto": "Durante uma semana, anote o tempo gasto com mensagens, compras e entregas. Por enquanto, usamos uma estimativa que você pode corrigir."
    }
   ],
   "apoio": "Essas tarefas também usam as [horas do Módulo 1] que você tem por semana. Muitas vezes elas tomam mais tempo do que parece.",
   "tipo": "Seleção única"
  },
  {
   "codigo": "M7-04",
   "fase": "Sua capacidade",
   "pergunta": "Alguém ajuda você a [fazer/atender] [oferta em foco]?",
   "descobre": "Horas de ajuda e se é paga",
   "aparece": "Sempre",
   "guarda": "Ajuda (horas, paga ou não)",
   "caminhos": [
    {
     "opcao": "Não, faço sozinho(a)",
     "retorno": "Resposta",
     "texto": "Então a capacidade depende só do seu tempo."
    },
    {
     "opcao": "Sim, sem pagamento (família, amigo, parceiro)",
     "retorno": "Dica",
     "texto": "Ajuda sem pagamento pode mudar de uma semana para outra. Vamos mostrar a capacidade com e sem ela."
    },
    {
     "opcao": "Sim, pago alguém",
     "retorno": "Atenção",
     "texto": "Pagar alguém é um gasto e pode ter regras próprias. Confira se esse valor entrou nos gastos do Módulo 5 e busque orientação de um contador sobre a forma de contratar."
    },
    {
     "opcao": "Horas inválidas (negativo ou texto)",
     "retorno": "Dica",
     "texto": "Informe as horas por semana com um número igual ou maior que zero."
    },
    {
     "opcao": "Não sei",
     "retorno": "Dica",
     "texto": "Por enquanto, calculamos só com o seu tempo. Se alguém ajudar, você pode corrigir depois."
    }
   ],
   "apoio": "Família, parceiro, amigo ou alguém que você paga. Conte só a ajuda nas etapas de preparo e produção.",
   "tipo": "Seleção única + horas por semana"
  },
  {
   "codigo": "M7-05",
   "fase": "Sua capacidade",
   "pergunta": "O que mais limita quanto você consegue [fazer] por semana?",
   "descobre": "Gargalo percebido",
   "aparece": "Sempre",
   "guarda": "Gargalo",
   "caminhos": [
    {
     "opcao": "Meu tempo",
     "retorno": "Resposta",
     "texto": "Então suas horas são o limite. A estimativa usa o seu tempo e o de quem ajuda."
    },
    {
     "opcao": "Um equipamento ou o espaço",
     "retorno": "Pergunta complementar",
     "texto": "Vamos ver quanto cabe nele de uma vez."
    },
    {
     "opcao": "Uma etapa que demora ou acumula",
     "retorno": "Dica",
     "texto": "Uma etapa que acumula pode definir o ritmo de todo o resto. Veja se parte dela pode ser preparada antes."
    },
    {
     "opcao": "Falta ou atraso de material",
     "retorno": "Dica",
     "texto": "Vamos olhar seus fornecedores e o momento de repor."
    },
    {
     "opcao": "Não sei",
     "retorno": "Dica",
     "texto": "Na próxima semana de trabalho, repare onde os pedidos ficam parados esperando."
    }
   ],
   "apoio": "Pense no que faz os pedidos esperarem. Se você ainda não vende, pense no que imagina que vai limitar.",
   "tipo": "Seleção única"
  },
  {
   "codigo": "M7-05a",
   "fase": "Sua capacidade",
   "pergunta": "Quantas unidades cabem de uma vez nesse equipamento ou espaço, e quanto tempo leva cada vez?",
   "descobre": "Capacidade do equipamento",
   "aparece": "Se escolheu 'Um equipamento ou o espaço' em M7-05",
   "guarda": "Unidades por vez e tempo por vez",
   "caminhos": [
    {
     "opcao": "Unidades por vez e tempo por vez",
     "retorno": "Resposta",
     "texto": "Com [N] por vez a cada [tempo], cabem cerca de [X] por semana no seu tempo de trabalho. É uma estimativa."
    },
    {
     "opcao": "Valor inválido (zero, negativo ou texto)",
     "retorno": "Dica",
     "texto": "Informe a quantidade e o tempo com números maiores que zero."
    },
    {
     "opcao": "Não sei",
     "retorno": "Dica",
     "texto": "Na próxima vez, conte quantas unidades couberam e cronometre uma rodada."
    }
   ],
   "apoio": "Ex.: o forno assa 4 pães por vez, em 50 minutos.",
   "tipo": "Número + tempo (h e min)"
  },
  {
   "codigo": "M7-06",
   "fase": "Fornecedores e estoque",
   "pergunta": "Para o item principal: de quantos fornecedores você poderia comprar, e em quantos dias ele chega depois do pedido?",
   "descobre": "Dependência e prazo de entrega",
   "aparece": "Se o tipo inclui fabricação ou revenda, ou se o serviço usa material",
   "guarda": "Alternativas; prazo de entrega",
   "caminhos": [
    {
     "opcao": "Parte 1: Só um",
     "retorno": "Atenção",
     "texto": "Depender de um só fornecedor deixa você sem saída se ele atrasar ou faltar. Vale ter pelo menos um contato de reserva, mesmo que mais caro."
    },
    {
     "opcao": "Parte 1: Dois ou mais",
     "retorno": "Resposta",
     "texto": "Ter alternativas protege sua entrega. No quadro de fornecedores você pode compará-las sem olhar só o preço."
    },
    {
     "opcao": "Parte 1: Ainda não procurei",
     "retorno": "Dica",
     "texto": "Antes de comprar, peça orçamento a pelo menos dois lugares e pergunte: pedido mínimo, prazo de entrega e se aceitam troca."
    },
    {
     "opcao": "Parte 1: Não sei",
     "retorno": "Dica",
     "texto": "Pesquise quem mais vende esse item na sua região ou pela internet. Anote nome, prazo e condições."
    },
    {
     "opcao": "Parte 2: No mesmo dia ou compro na hora",
     "retorno": "Resposta",
     "texto": "Com reposição rápida, pode bastar pouco estoque parado."
    },
    {
     "opcao": "Parte 2: De 1 a 3 dias / De 4 a 7 dias",
     "retorno": "Resposta",
     "texto": "Vamos calcular quando fazer o novo pedido para não faltar."
    },
    {
     "opcao": "Parte 2: Mais de 7 dias",
     "retorno": "Atenção",
     "texto": "Com prazo longo, o pedido precisa sair antes de o item acabar. O lembrete de reposição mostra quando."
    },
    {
     "opcao": "Parte 2: Não sei",
     "retorno": "Dica",
     "texto": "Pergunte ao fornecedor: 'Se eu pedir hoje, quando chega?'."
    }
   ],
   "apoio": "Pense em [item principal do Módulo 4], o que mais pesa ou que, se faltar, para tudo. Quando pagar já foi visto no Módulo 6; aqui é o tempo até o item chegar.",
   "tipo": "Seleção única (duas partes)"
  },
  {
   "codigo": "M7-07",
   "fase": "Fornecedores e estoque",
   "pergunta": "Além do preço, o que mais pesa na escolha do seu fornecedor?",
   "descobre": "Critérios de fornecedor",
   "aparece": "Mesma condição de M7-06",
   "guarda": "Critérios (até 3)",
   "caminhos": [
    {
     "opcao": "De 1 a 3 critérios",
     "retorno": "Resposta",
     "texto": "Esses critérios montam o seu quadro de fornecedores. Use-o para comparar antes de fechar a compra."
    },
    {
     "opcao": "Mais de 3 critérios",
     "retorno": "Dica",
     "texto": "Escolha os 3 mais importantes. Assim fica mais fácil comparar."
    },
    {
     "opcao": "Só o preço",
     "retorno": "Dica",
     "texto": "O preço importa. Pense também: se o mais barato atrasar um dia, o que acontece com o seu cliente?"
    },
    {
     "opcao": "Nota fiscal e origem comprovada",
     "retorno": "Dica",
     "texto": "Comprar com nota ajuda a comprovar a origem do que você vende. Para saber o que vale no seu caso, busque orientação de um contador."
    },
    {
     "opcao": "Não sei",
     "retorno": "Dica",
     "texto": "Deixamos três critérios sugeridos no quadro. Você pode trocar depois."
    }
   ],
   "apoio": "Escolha até 3. O mais barato pode sair caro se atrasar, variar a qualidade ou exigir compra grande.",
   "tipo": "Seleção múltipla (até 3)"
  },
  {
   "codigo": "M7-08",
   "fase": "Fornecedores e estoque",
   "pergunta": "[Oferta em foco] ou os materiais que você usa estragam, vencem ou perdem valor com o tempo?",
   "descobre": "Validade e risco de perda",
   "aparece": "Mesma condição de M7-06",
   "guarda": "Validade",
   "caminhos": [
    {
     "opcao": "Sim, em poucos dias",
     "retorno": "Atenção",
     "texto": "Com itens que estragam rápido, comprar menos e com mais frequência pode reduzir perdas. Confira se a sua reposição ([frequência do Módulo 6]) combina com isso."
    },
    {
     "opcao": "Sim, em semanas ou meses",
     "retorno": "Dica",
     "texto": "Use primeiro o que chegou antes e anote a validade à vista na embalagem."
    },
    {
     "opcao": "Não",
     "retorno": "Resposta",
     "texto": "Então o cuidado maior é com espaço e com dinheiro parado em estoque."
    },
    {
     "opcao": "Não sei",
     "retorno": "Dica",
     "texto": "Confira a validade nas embalagens dos itens que você mais usa."
    }
   ],
   "apoio": "Pense em validade, em itens que mofam ou murcham e em produtos que saem de moda.",
   "tipo": "Seleção única"
  },
  {
   "codigo": "M7-09",
   "fase": "Qualidade e riscos",
   "pergunta": "Como você confere se [oferta em foco] saiu do jeito certo antes de chegar ao cliente?",
   "descobre": "Forma de conferir a qualidade",
   "aparece": "Sempre",
   "guarda": "Conferência de qualidade",
   "caminhos": [
    {
     "opcao": "Sigo um padrão ou receita anotada",
     "retorno": "Resposta",
     "texto": "Vamos trazer esses pontos para o seu padrão de qualidade."
    },
    {
     "opcao": "Confiro no olho ou provando, sem nada anotado",
     "retorno": "Dica",
     "texto": "Anotar de 3 a 5 pontos que você confere ajuda a manter o mesmo resultado em dias corridos ou quando alguém ajuda."
    },
    {
     "opcao": "Fico sabendo pelo cliente",
     "retorno": "Atenção",
     "texto": "Quando o cliente percebe o problema, ele já aconteceu. Conferir antes de entregar pode evitar retrabalho e reclamação."
    },
    {
     "opcao": "Ainda não confiro",
     "retorno": "Dica",
     "texto": "Comece por um ponto só, o que mais importa para o seu cliente, e confira em toda entrega."
    },
    {
     "opcao": "Não sei",
     "retorno": "Dica",
     "texto": "Pense na última vez que algo saiu errado. O que você poderia ter conferido antes?"
    },
    {
     "opcao": "Qualquer resposta, com atividade regulada em M4-11",
     "retorno": "Atenção",
     "texto": "Atividades com alimentos, saúde ou crianças têm regras próprias de higiene e segurança. O app não diz quais valem para o seu caso: confira com o órgão responsável no seu município."
    }
   ],
   "apoio": "Pense no que faz o cliente voltar: sabor, acabamento, prazo, limpeza, cuidado no atendimento.",
   "tipo": "Seleção única"
  },
  {
   "codigo": "M7-10",
   "fase": "Qualidade e riscos",
   "pergunta": "O que mais poderia atrapalhar a entrega de [oferta em foco] ao cliente?",
   "descobre": "Riscos da operação",
   "aparece": "Sempre",
   "guarda": "Riscos (até 3)",
   "caminhos": [
    {
     "opcao": "Atrasar a entrega",
     "retorno": "Dica",
     "texto": "No checklist, anote quanto tempo de folga você coloca no prazo combinado com o cliente."
    },
    {
     "opcao": "Errar o pedido",
     "retorno": "Dica",
     "texto": "Confirmar o pedido por escrito antes de começar pode reduzir erros."
    },
    {
     "opcao": "Produto chegar danificado ou estragado",
     "retorno": "Dica",
     "texto": "Teste a embalagem e o transporte com uma unidade antes de vender em quantidade."
    },
    {
     "opcao": "Faltar material",
     "retorno": "Dica",
     "texto": "O lembrete de reposição ajuda a pedir antes de acabar."
    },
    {
     "opcao": "Equipamento quebrar",
     "retorno": "Dica",
     "texto": "Pense onde conseguiria um equipamento emprestado ou alugado se esse parar."
    },
    {
     "opcao": "Eu ficar doente ou sem tempo",
     "retorno": "Dica",
     "texto": "Pense em como avisaria os clientes e em quem poderia cobrir você por alguns dias."
    },
    {
     "opcao": "Outro",
     "retorno": "Dica",
     "texto": "Escreva o que poderia atrapalhar."
    },
    {
     "opcao": "Mais de 3 opções",
     "retorno": "Dica",
     "texto": "Escolha os 3 que mais preocupam. Os outros você pode incluir depois no checklist."
    },
    {
     "opcao": "Não sei",
     "retorno": "Dica",
     "texto": "Olhe o seu mapa: em qual etapa algo poderia dar errado?"
    }
   ],
   "apoio": "Os riscos de mercado você já viu no Módulo 3 ([riscos do Módulo 3]). Aqui são os do dia a dia. Escolha até 3.",
   "tipo": "Seleção múltipla (até 3)"
  },
  {
   "codigo": "M7-11",
   "fase": "Qualidade e riscos",
   "pergunta": "Quais números você quer acompanhar toda semana?",
   "descobre": "Indicadores",
   "aparece": "Sempre (sugestões pré-marcadas)",
   "guarda": "Indicadores (2 ou 3)",
   "caminhos": [
    {
     "opcao": "2 ou 3 números",
     "retorno": "Resposta",
     "texto": "Esses números entram no painel semanal. Anotar toda semana mostra se algo está mudando."
    },
    {
     "opcao": "1 número",
     "retorno": "Dica",
     "texto": "Um número já ajuda. Se quiser, inclua mais um ligado ao que mais te preocupa."
    },
    {
     "opcao": "Mais de 3 números",
     "retorno": "Dica",
     "texto": "Com poucos números fica mais fácil manter o hábito. Escolha até 3."
    },
    {
     "opcao": "Não sei",
     "retorno": "Dica",
     "texto": "Deixamos marcados os números ligados ao seu gargalo e aos seus riscos. Você pode trocar depois."
    }
   ],
   "apoio": "Escolha 2 ou 3. Já marcamos sugestões ligadas ao que você respondeu: [sugestões].",
   "tipo": "Seleção múltipla (até 3)"
  },
  {
   "codigo": "M7-12",
   "fase": "Fechamento",
   "pergunta": "Quer anotar alguma ideia sobre regras, documentos ou próximos passos do negócio?",
   "descobre": "Ideias para os próximos módulos",
   "aparece": "Sempre (campo opcional)",
   "guarda": "Ideias para depois",
   "caminhos": [
    {
     "opcao": "Texto preenchido",
     "retorno": "Resposta",
     "texto": "Guardado! Vamos retomar isso no próximo módulo."
    },
    {
     "opcao": "Em branco",
     "retorno": "Resposta",
     "texto": "Tudo bem. Você não precisa ter nenhuma ideia agora."
    }
   ],
   "apoio": "Opcional. Escreva em uma ou duas frases. Vamos guardar para os próximos módulos, sem analisar agora.",
   "tipo": "Texto livre (opcional)"
  },
  {
   "codigo": "M7-13",
   "fase": "Fechamento",
   "pergunta": "Este é o retrato da sua operação. Está certo?",
   "descobre": "Confirmação e correção",
   "aparece": "Sempre (última tela)",
   "guarda": "Retrato confirmado",
   "caminhos": [
    {
     "opcao": "Sim, pode seguir",
     "retorno": "Resposta",
     "texto": "Pronto! O retrato da sua operação está salvo. As estimativas dependem dos valores que você informou e não garantem resultado."
    },
    {
     "opcao": "Quero corrigir algo",
     "retorno": "Resposta",
     "texto": "Qual resposta você quer mudar?"
    }
   ],
   "apoio": "Confira antes de seguir. Você pode corrigir qualquer resposta.",
   "tipo": "Seleção única"
  }
 ],
 "instrumentos": [
  {
   "nome": "Mapa do processo",
   "avisos": [
    "Mapa feito com as suas respostas. Confira na prática na próxima vez que [fizer] [oferta em foco].",
    "Caminho imaginado, ainda não testado."
   ]
  },
  {
   "nome": "Calculadora de capacidade",
   "avisos": [
    "Estimativa com os tempos que você informou. Não garante que você conseguirá atender esse volume."
   ]
  },
  {
   "nome": "Lembrete de reposição",
   "avisos": [
    "Conta feita com dias corridos. Se você trabalha só alguns dias, ajuste o consumo."
   ]
  },
  {
   "nome": "Quadro de fornecedores",
   "avisos": [
    "A contagem ajuda a comparar, não decide. Confira as condições com o próprio fornecedor e anote a data."
   ]
  },
  {
   "nome": "Checklist de riscos da operação",
   "avisos": [
    "Lista para organizar. Não substitui orientação de profissional ou órgão responsável."
   ]
  },
  {
   "nome": "Padrão de qualidade",
   "avisos": [
    "Pontos escolhidos por você. Regras oficiais, quando existirem, valem acima desta lista."
   ]
  },
  {
   "nome": "Painel semanal",
   "avisos": [
    "Poucas semanas ainda não mostram tendência."
   ]
  }
 ],
 "modelos_mapa": "Modelo por tipo, preenchido com M4-01 a M4-03, M4-06 e M6-09. Fabricação: pedido · compra de materiais · preparo · produção · conferência · embalagem · entrega · recebimento. Revenda: compra · recebimento e guarda · divulgação e venda · separação · entrega · recebimento. Serviço: agendamento · preparação de materiais · atendimento · conferência · recebimento · retorno do cliente. Até 8 etapas.",
 "pedidos_ia": [
  {
   "pedido": "Etapas do processo",
   "texto": "Quero organizar as etapas de [oferta em foco], do pedido do cliente até o recebimento do pagamento. Faça no máximo 3 perguntas por vez e espere minha resposta. Use só o que eu informar. Não estime tempos, custos nem quantidades. No final, liste as etapas em ordem, com o que é usado em cada uma.",
   "conferir": "Na próxima vez que fizer, siga a lista e anote o tempo real de cada etapa.",
   "obs": "Sem nome de empresa nem cidade."
  },
  {
   "pedido": "Pontos de qualidade",
   "texto": "Vou listar como faço [oferta em foco]: [cole aqui as etapas]. Sugira até 5 pontos simples que eu posso conferir antes de entregar ao cliente. Não cite leis, normas ou regras oficiais.",
   "conferir": "Teste os pontos em uma entrega e pergunte a um cliente se fazem sentido. Regras oficiais devem ser conferidas no órgão responsável.",
   "obs": "A IA não informa regras sanitárias."
  },
  {
   "pedido": "Fornecedores",
   "texto": "Não há pedido para IA. Em vez disso, uma lista para perguntar ao próprio fornecedor: preço, pedido mínimo, prazo de entrega, forma e prazo de pagamento, frete, troca ou devolução, e se emite nota.",
   "conferir": "Anote as respostas com a data no quadro de fornecedores.",
   "obs": "Evita que a IA invente nomes, preços ou prazos."
  }
 ],
 "resumo": {
  "blocos": [
   {
    "bloco": "Seu processo",
    "conteudo": "Mapa com as etapas e o gargalo destacado."
   },
   {
    "bloco": "Sua capacidade",
    "conteudo": "Quanto cabe por semana e por mês (estimativa), ao lado do volume pretendido, do cenário maior e do teste. Folga ou falta em unidades."
   },
   {
    "bloco": "Fornecedores e estoque",
    "conteudo": "Alternativas, prazo de entrega, critérios e quando repor o item principal."
   },
   {
    "bloco": "Qualidade",
    "conteudo": "Padrão de qualidade (3 a 5 pontos)."
   },
   {
    "bloco": "Riscos",
    "conteudo": "Até 3 riscos principais, com o plano B escrito pela pessoa."
   },
   {
    "bloco": "Números da semana",
    "conteudo": "Os indicadores escolhidos."
   },
   {
    "bloco": "O que ainda falta definir",
    "conteudo": "Tempos sem medida, prazos sem confirmação e lacunas dos sete módulos, sem repetição."
   },
   {
    "bloco": "Próximos passos",
    "conteudo": "Até três ações (tabela B)."
   }
  ],
  "proximos": [
   {
    "situacao": "Tempo não medido",
    "mensagem": "Na próxima vez que [fizer] [oferta em foco], cronometre do começo ao fim e corrija o tempo aqui."
   },
   {
    "situacao": "Capacidade abaixo do volume pretendido",
    "mensagem": "Com o tempo informado, cabem cerca de [N] por mês, e você pretende [volume]. Veja o que daria para rever: o tempo de apoio, a variedade ([variedade do Módulo 4]), ajuda ou o volume."
   },
   {
    "situacao": "Fornecedor único ou não pesquisado",
    "mensagem": "Peça orçamento a mais um fornecedor e anote no quadro: preço, prazo de entrega e pedido mínimo."
   },
   {
    "situacao": "Sem conferência de qualidade",
    "mensagem": "Escolha um ponto do seu padrão de qualidade e confira em toda entrega desta semana."
   },
   {
    "situacao": "Tudo preenchido e sem alertas",
    "mensagem": "Anote os seus números da semana durante quatro semanas e compare."
   }
  ],
  "cruzamentos": [
   {
    "quando": "Volume do Módulo 5 acima da capacidade",
    "mensagem": "Você pretende [volume] por mês, e com o tempo informado cabem cerca de [N]. Quer rever algum desses números?",
    "forma": "Pergunta gentil"
   },
   {
    "quando": "Cenário maior do Módulo 6 acima da capacidade",
    "mensagem": "No cenário maior, seriam [volume] por mês, acima do que cabe hoje ([N]).",
    "forma": "Observação"
   },
   {
    "quando": "Critério do teste (M4-15) acima da capacidade semanal",
    "mensagem": "Seu teste pede [critério] em [prazo] dias, e cabem cerca de [N] por semana. Quer rever o prazo ou o número?",
    "forma": "Pergunta gentil"
   },
   {
    "quando": "Apoio maior ou igual às horas (M1-09)",
    "mensagem": "Com o tempo informado, não sobra tempo para [fazer]. Quer rever as horas ou o tempo de apoio?",
    "forma": "Pergunta gentil"
   },
   {
    "quando": "Sazonalidade (M3-10) e pouca folga",
    "mensagem": "Na época de mais procura ([período]), a folga de [folga] pode não bastar.",
    "forma": "Observação"
   },
   {
    "quando": "Ajuda paga (M7-04) sem gasto com funcionários no Módulo 5",
    "mensagem": "Você disse que paga alguém, mas esse gasto não aparece no Módulo 5. Quer incluir?",
    "forma": "Pergunta gentil"
   },
   {
    "quando": "Equipamento como limite e ausente do investimento (M6-01)",
    "mensagem": "O [equipamento] limita sua produção e não aparece na lista do que precisa para começar. Quer rever a lista?",
    "forma": "Pergunta gentil"
   },
   {
    "quando": "Validade curta (M7-08) e reposição espaçada (M6-09)",
    "mensagem": "Os itens estragam em poucos dias e a reposição é [frequência]. Isso pode gerar perdas.",
    "forma": "Observação"
   },
   {
    "quando": "Perdas no Módulo 5 e validade 'Não'",
    "mensagem": "Você indicou perdas no Módulo 5. Elas acontecem em qual etapa do seu processo?",
    "forma": "Pergunta gentil"
   },
   {
    "quando": "Fornecedor único e prazo acima de 7 dias",
    "mensagem": "Um só fornecedor e prazo longo: se ele atrasar, a espera pode passar de uma semana.",
    "forma": "Observação"
   },
   {
    "quando": "Preocupação 'saber fazer bem' (M1-12) e sem padrão de qualidade",
    "mensagem": "Você disse que fazer bem te preocupa. Anotar os pontos que você confere pode ajudar.",
    "forma": "Observação"
   },
   {
    "quando": "Experiência baixa (M1-08) e 'fico sabendo pelo cliente'",
    "mensagem": "Aprender com quem já faz pode ajudar a definir o que conferir antes de entregar.",
    "forma": "Observação"
   },
   {
    "quando": "Atividade regulada (M4-11)",
    "mensagem": "Para atividades com alimentos, saúde ou crianças, confira as regras com o órgão responsável no seu município.",
    "forma": "Encaminhamento"
   }
  ]
 },
 "termos": [
  {
   "termo": "Processo",
   "aparece": "M7-01",
   "explicacao": "O caminho que o seu produto ou serviço percorre, do pedido do cliente até ele receber e pagar.",
   "exemplo": "Bolo por encomenda: pedido · compra dos ingredientes · preparo · forno · decoração · entrega · recebimento."
  },
  {
   "termo": "Gargalo",
   "aparece": "M7-05",
   "explicacao": "A etapa ou o recurso que segura o ritmo de todo o resto. Não adianta acelerar as outras etapas se esta continua igual.",
   "exemplo": "A confeiteira decora rápido, mas o forno só assa 2 bolos por vez: o forno é o gargalo."
  },
  {
   "termo": "Capacidade",
   "aparece": "Calculadora",
   "explicacao": "Quanto você consegue fazer ou atender em um período, com o tempo e os recursos que tem hoje.",
   "exemplo": "Com 5 h livres por semana e 1 h 30 por atendimento, cabem cerca de 3 atendimentos por semana."
  },
  {
   "termo": "Tempo de apoio",
   "aparece": "M7-03",
   "explicacao": "O tempo que vai para tarefas que não são fazer ou atender: responder mensagens, comprar, entregar, divulgar, organizar.",
   "exemplo": "De 10 h por semana, 4 h vão para responder clientes e buscar material. Sobram 6 h para produzir."
  },
  {
   "termo": "Lote",
   "aparece": "M7-02",
   "explicacao": "Quando você faz várias unidades de uma vez.",
   "exemplo": "Uma fornada de 20 brigadeiros em 1 h é um lote: cerca de 3 minutos por unidade."
  },
  {
   "termo": "Prazo de entrega do fornecedor",
   "aparece": "M7-06",
   "explicacao": "Quantos dias o material leva para chegar depois do pedido. É diferente do prazo para pagar.",
   "exemplo": "Pedido na segunda, entrega na quinta: prazo de entrega de 3 dias."
  },
  {
   "termo": "Ponto de pedido",
   "aparece": "Lembrete de reposição",
   "explicacao": "A quantidade que, quando sobrar no estoque, indica a hora de pedir de novo para não faltar enquanto espera a entrega.",
   "exemplo": "Uso 7 embalagens por dia e o fornecedor leva 7 dias: peço quando restarem cerca de 49."
  },
  {
   "termo": "Perda",
   "aparece": "Herdado do Módulo 5",
   "explicacao": "Material ou produto que você comprou ou fez e não conseguiu vender ou usar.",
   "exemplo": "De 100 frutas compradas, 5 estragaram: perda de 5%."
  },
  {
   "termo": "Padrão de qualidade",
   "aparece": "M7-09",
   "explicacao": "A lista curta do que você confere antes de entregar, para o resultado sair sempre igual.",
   "exemplo": "Marmita: temperatura, peso aproximado, tampa bem fechada, etiqueta com o pedido."
  },
  {
   "termo": "Indicador",
   "aparece": "M7-11",
   "explicacao": "Um número que você anota toda semana para ver se algo está melhorando ou piorando.",
   "exemplo": "Pedidos entregues no prazo: 18 de 20 nesta semana."
  }
 ]
};
