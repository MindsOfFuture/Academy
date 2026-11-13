/* GERADO por ferramentas/extrair.py a partir da planilha do grupo.
   Ajuste manual em 05/11/2026 (relatório de teste aprovado): M4.P14 reescrita (enunciado, ajuda,
   opções e opcoes_explica) e condicao_app da M4.P15 com as novas opções.
   Ajuste de 05/11/2026 (2º lote): digitação, textos em segunda pessoa, exemplos por tipo (por_tipo),
   ficha técnica do serviço (M4.P06 + M4.BT09S) e M4.P19 numérica.
   Ajuste de 05/11/2026 (3º lote): papel e caneta em "O que ter em mãos", M4.P04 múltipla escolha,
   alerta e próximo passo da M4.P11 juntos, M4.P12/M4.P13 sem "Não sei" e proposta de valor
   (M4.PV1–M4.PV3, lida pelo Módulo 10) antes da M4.P12.
   Ajuste de 05/11/2026 (4º lote): ficha técnica de ALIMENTO (por_tipo.Alimento na M4.P03 e no M4.BT09),
   usada quando o produto é comida ou bebida.
   Ajuste de 05/11/2026 (5º lote, Nayara e Arthur): dicas longas divididas (ajuda + ajuda_mais em "Ver mais"),
   protótipo e oferta mínima junto da pré-venda na M4.P14 (conceitos_destaque), "Outro" da M4.P11 com campo,
   M4.P16 sem o texto sobre o app e correções de escrita.
   Versão leve (13/11/2026, pedido da coordenação): enunciados curtos, exemplo dentro do campo (placeholder),
   legenda curta da M4.P02 (destaque_visivel), texto da capa (leve) e ajuda do "Não sei" em todas as perguntas
   que têm "Não sei" (comoDescobrir: 2 passos; promptIA: pedido pronto para a IA; por tipo em por_tipo). */
window.MODULO4 = {
 "origem": "M04.xlsx",
 "modulo": {
  "numero": "4",
  "nome": "Produto, proposta de valor e teste da ideia",
  "versao": "v0.1",
  "data": "10/09/2026",
  "turma": "Turma de 24",
  "tutora": "Ana Beatriz",
  "integrantes": [
   "Júlia",
   "Nayara",
   "Túlio",
   "Ana Luiza Campos",
   "Júlia"
  ]
 },
 "mapa": {
  "objetivo": "Ao final deste módulo, você vai conseguir detalhar o que oferece (os materiais de um produto ou as etapas de um serviço), montar a sua proposta de valor com o Canvas de Proposta de Valor e preparar um teste da sua ideia com clientes de verdade, para ver se o que você planejou atende ao que o seu público precisa ou se são necessários ajustes.",
  "usuario": "Este módulo é para você que já tem uma ideia na cabeça e precisa amadurecê-la: pensar no que é necessário para colocá-la em prática e no que ela entrega de valor para o seu cliente.",
  "decisoes": "Como este módulo ajuda você\n\nEste módulo guia você a pensar com clareza sobre o seu produto, o valor que ele entrega e se a ideia faz sentido para o seu público. As decisões são sempre suas. Nós orientamos o caminho, e você escolhe o destino.\n\nO que você vai fazer aqui:\n\n - Detalhar seu produto: organize as informações principais sobre o que você oferece.\n - Preencher o Canvas de Proposta de Valor: responda a perguntas simples, bloco por bloco (perfil do cliente, mapa de valor e outros), para entender quem você atende e o que realmente importa para essas pessoas.\n - Preparar o teste da sua ideia: receba um roteiro de perguntas e critérios para conversar com seu público e avaliar as respostas. A aplicação do teste fica por sua conta.\n - Identificar possíveis desencontros: com base no que você mesmo respondeu, mostramos onde o seu plano pode estar diferente do que o público precisa. Apontamos os pontos de atenção, mas não dizemos o que você deve fazer: a solução é sua.",
  "nao_faz": "Não sugere o produto ou serviço, não dá ideia de desenvolvimento, não determina a matéria-prima do produto, não faz o canvas por você e não instrui como fazer o teste da ideia.",
  "mensagem_limite": "O app oferece apoio educacional básico. As estimativas dependem dos dados fornecidos e não garantem resultados. Regras de registro, tributação, licenciamento e exercício profissional devem ser confirmadas em fontes oficiais e com profissionais habilitados.",
  "ter_em_maos": "Celular e acesso à internet. É bom ter papel e caneta à mão para anotar o que precisar.",
  "entrega": "Você recebe as suas ideias organizadas, com espaço para anotar como é feito o que você oferece (os materiais e as matérias-primas de um produto ou as etapas de um serviço), um canvas guiado e simplificado e, por fim, um guia para um possível teste da ideia, que mostra como proceder para chegar a uma viabilidade ideal.",
  "encaminhamentos": "Advogado: quando surgir dúvida sobre informação obrigatória ao consumidor ou sobre uso de dados pessoais, já que o módulo não redige termo de consentimento nem aviso legal.\nVigilância Sanitária, Procon, Inmetro: quando o produto testado exigir registro, licença sanitária ou normas técnicas antes mesmo da venda de teste.\nContador: quando o teste já envolver emissão de nota fiscal, recebimento formal de valores ou mudança no enquadramento tributário do usuário.",
  "caso_real": "",
  "riscos": "Prometer um canvas modelo de negócio avançado; um teste de ideia complexo, que a pessoa não consegue realizar; direcionar o teste de ideia de forma errada, em que a pessoa vai chegar a uma conclusão precipitada, que não é a veridica. \nO grupo evita isso não fazendo afirmações concretas, promovendo um modelo de canvas simplificado e guiado por perguntas que façam a pessoa pensar ou de forma simples conseguir na IA, conduzir um teste de ideia também guiado, direcionado para o modelo de negócio da pessoa, e que esse teste não deixe ter margem para duvidas se o produto vale ou não a pena ser lançado. "
 },
 "conexoes": [
  {
   "modulo": "1.0",
   "nome": "Perfil do empreendedor e definição da ideia",
   "recebe": "Descrição inicial da ideia e do problema que ela resolve",
   "combinado": "Não"
  },
  {
   "modulo": "2.0",
   "nome": "Clientes, necessidades e comportamento de compra",
   "recebe": "Perfil do cliente: tarefas, dores e ganhos levantados na pesquisa",
   "combinado": "Não"
  },
  {
   "modulo": "5.0",
   "nome": "Custos, despesas, preço e margem",
   "envia": "Ficha técnica do produto com insumos e quantidades, para cálculo de custo por unidade e gastos relacionados ao teste",
   "combinado": "Não"
  },
  {
   "modulo": "7.0",
   "nome": "Operação, fornecedores, capacidade e qualidade",
   "envia": "Especificação do produto e variedade mínima a produzir.",
   "combinado": "Não"
  }
 ],
 "base": [
  {
   "codigo": "M4.BT01",
   "conceito": "Proposta de valor",
   "definicao": "Frase clara que explica qual problema seu produto resolve, para quem e por que é diferente.",
   "porque": "Sem uma proposta de valor clara, o usuário não sabe o que vai oferecer nem o que perguntar aos clientes nos próximos módulos.",
   "exemplo": "Bolos personalizados entregues no mesmo dia para quem esqueceu a encomenda de aniversário.",
   "tipo_fonte": "Institucional",
   "fonte": "Sebrae, \"Proposta de valor: guia prático para criar e aplicar na sua empresa\"",
   "link": "https://blog.rn.sebrae.com.br/proposta-de-valor/",
   "data": "22/09/2026",
   "por_tipo": {
    "Serviço": {
     "exemplo": "Manicure em domicílio no fim do dia para quem trabalha fora e não consegue ir ao salão."
    },
    "Mercadoria": {
     "exemplo": "Roupas infantis com preço de bairro, entregues em casa, para mães que não têm tempo de ir ao centro."
    }
   }
  },
  {
   "codigo": "M4.BT02",
   "conceito": "Benefício funcional",
   "definicao": "O que o cliente ganha na prática, diferente do atributo físico do produto.",
   "porque": "Descrever o produto pelas próprias características (o que ele é) enfraquece a proposta de valor.",
   "exemplo": "Em vez de definir como \"bolo sem glúten\", o benefício para o cliente é: poder comer doce sem passar mal.",
   "tipo_fonte": "Outra (justificar)",
   "fonte": "Eamidiadigital, \"O que é Benefício Funcional\"",
   "link": "https://eamidiadigital.com.br/glossario/o-que-e-beneficio-funcional/",
   "data": "22/09/2026",
   "por_tipo": {
    "Serviço": {
     "exemplo": "Em vez de definir como \"manicure com esmaltes importados\", o benefício para a cliente é: sair com as unhas prontas sem sair de casa."
    },
    "Mercadoria": {
     "exemplo": "Em vez de definir como \"roupa 100% algodão\", o benefício para o cliente é: a criança fica confortável o dia todo."
    }
   }
  },
  {
   "codigo": "M4.BT03",
   "conceito": "Diferencial competitivo",
   "definicao": "O que faz o cliente escolher este negócio e não um concorrente ou alternativa (preço, prazo, atendimento, especialização etc.).",
   "porque": "Evita que o usuário confunda gostar da própria ideia com ter um motivo real de escolha para o cliente.",
   "exemplo": "Entrega em até 2h vs. concorrentes que só entregam no dia seguinte.",
   "tipo_fonte": "Institucional",
   "fonte": "SerasaExperian, \"Diferencial competitivo: entenda o que é e como desenvolver o seu\"",
   "link": "https://www.serasaexperian.com.br/conteudos/diferencial-competitivo/",
   "data": "22/09/2026",
   "por_tipo": {
    "Serviço": {
     "exemplo": "Atendimento em casa até as 21h vs. salões do bairro que fecham às 18h."
    }
   }
  },
  {
   "codigo": "M4.BT04",
   "conceito": "Oferta mínima (produto mínimo viável)",
   "definicao": "Versão simples do produto ou serviço, só com o essencial, vendida em pouca quantidade e já com preço, para ver se as pessoas pagam de verdade antes de investir mais.",
   "porque": "Permite descobrir cedo se a ideia tem aceitação, evitando gasto de tempo e dinheiro em algo que ninguém compraria.",
   "exemplo": "Em vez de abrir uma cozinha de bolos com equipamento completo, a pessoa faz um único bolo no forno de casa, anuncia a venda nos Stories e entrega aos primeiros clientes.",
   "tipo_fonte": "Institucional",
   "fonte": "Sebrae, \"MVP: o que é e para que serve o Produto Viável Mínimo\"",
   "link": "https://www.sebrae-sc.com.br/blog/mvp-o-que-e-e-para-que-serve-o-produto-viavel-minimo",
   "data": "22/09/2026",
   "por_tipo": {
    "Serviço": {
     "exemplo": "Em vez de alugar uma sala e montar um salão, a pessoa atende as primeiras clientes em casa, com o material que já tem, e anuncia os horários nos Stories."
    },
    "Mercadoria": {
     "exemplo": "Em vez de comprar um estoque grande, a pessoa compra poucas peças, anuncia nos Stories e entrega aos primeiros clientes."
    }
   },
   "opcao": "Vender pouca quantidade, já com preço"
  },
  {
   "codigo": "M4.BT05",
   "conceito": "Protótipo",
   "definicao": "Uma amostra ou versão de teste da ideia, mostrada a poucas pessoas sem cobrar, só para ouvir opiniões. Diferente da oferta mínima, ainda não mostra se as pessoas pagariam.",
   "porque": "Confundir os dois faz o usuário achar que montar um protótipo já é validação de venda, quando não é.",
   "exemplo": "Fazer uma receita, levar para amigos provarem e anotar o que acharam.",
   "tipo_fonte": "Outra (justificar)",
   "fonte": "Hostinger, \"Qual a diferença entre protótipo e MVP de software?\"",
   "link": "https://www.hostinger.com/br/tutoriais/diferenca-entre-prototipo-e-mvp/",
   "data": "22/09/2026",
   "por_tipo": {
    "Serviço": {
     "exemplo": "Fazer as unhas de uma amiga para treinar e mostrar fotos do resultado, sem cobrar."
    },
    "Mercadoria": {
     "exemplo": "Montar um catálogo com fotos das peças e mostrar a amigos antes de comprar o estoque."
    }
   },
   "opcao": "Mostrar uma amostra sem cobrar"
  },
  {
   "codigo": "M4.BT06",
   "conceito": "Critério de decisão",
   "definicao": "Número ou condição definida antes de testar que diz se o resultado confirma, exige ajuste ou descarta a hipótese.",
   "porque": "Definir o critério depois de ver o resultado tende a justificar a ideia original em vez de testá-la de verdade.\n",
   "exemplo": "Definir antes que o teste deu certo se pelo menos 5 pessoas reservarem; se ficar abaixo disso, revisar o preço ou o público antes de continuar.",
   "tipo_fonte": "Outra (justificar)",
   "fonte": "NaPrática, \"MVP: como validar sua ideia antes de investir tempo ou dinheiro nela?\"",
   "link": "https://napratica.org.br/noticias/mvp-como-validar-sua-ideia-antes-de-investir-tempo-ou-dinheiro-nela",
   "data": "22/09/2026"
  },
  {
   "codigo": "M4.BT07",
   "conceito": "Pré-venda",
   "definicao": "Vender ou reservar o produto antes de ele existir de fato, como forma de comprovar disposição real de pagar.",
   "porque": "É uma evidência mais forte que uma pesquisa de opinião",
   "exemplo": "Receber o pedido de 5 bolos de pote, com um sinal, e só fazer depois que os 5 estiverem confirmados.",
   "tipo_fonte": "Outra (justificar)",
   "fonte": "Meu Bolso em Dia (Febraban), \"Empreendedor, saiba como validar a sua ideia de negócio sem gastar muito\"",
   "link": "https://www.meubolsoemdia.com.br/Materias/empreender",
   "data": "22/09/2026",
   "por_tipo": {
    "Serviço": {
     "exemplo": "Cobrar um sinal para reservar um horário de manicure, abrindo a agenda só se houver 5 agendamentos confirmados."
    },
    "Mercadoria": {
     "exemplo": "Receber o pedido e o pagamento de uma peça antes de comprá-la do fornecedor, só fazendo a compra se houver 5 pedidos."
    }
   },
   "opcao": "Aceitar encomenda ou reserva antes de fazer"
  },
  {
   "codigo": "M4.BT08",
   "conceito": "Hipótese de negócio",
   "definicao": "Suposição específica e testável sobre o cliente ou o produto, que ainda não foi comprovada.\n",
   "porque": "Transformar a ideia em hipóteses evita tratar uma opinião pessoal como fato e orienta o que precisa ser testado primeiro.\n",
   "exemplo": "Alunos e pais voltando da escola pagariam R$ 18 por um bolo de pote.",
   "tipo_fonte": "Outra (justificar)",
   "fonte": "Meu Bolso em Dia (Febraban), \"Empreendedor, saiba como validar a sua ideia de negócio sem gastar muito\"",
   "link": "https://www.meubolsoemdia.com.br/Materias/empreender",
   "data": "22/09/2026",
   "por_tipo": {
    "Serviço": {
     "exemplo": "Mulheres do bairro que trabalham fora pagariam R$ 35 por uma manicure em casa no fim do dia."
    },
    "Mercadoria": {
     "exemplo": "Mães do bairro pagariam R$ 40 por um conjunto de roupa infantil entregue em casa."
    }
   }
  },
  {
   "codigo": "M4.BT09",
   "conceito": "Ficha técnica do produto",
   "definicao": "Documento padronizado com insumos/materiais, quantidades exatas e modo de preparo ou montagem de uma unidade do produto.",
   "porque": "Sem isso cada lote sai diferente e o usuário não consegue nem calcular custo nem repetir o teste.",
   "exemplo": "Bolo de pote: 200 g de farinha, 3 ovos, 150 g de açúcar, modo de preparo em 5 passos, rendimento de 10 unidades.",
   "tipo_fonte": "Institucional",
   "fonte": "Sebrae, \"Estudo inédito mapeia características que influenciam a produtividade dos bares e restaurantes no país\"",
   "link": "https://agenciasebrae.com.br/economia-e-politica/estudo-inedito-mapeia-caracteristicas-que-influenciam-a-produtividade-dos-bares-e-restaurantes-no-pais/",
   "data": "22/09/2026",
   "por_tipo": {
    "Mercadoria": {
     "exemplo": "Conjunto infantil: comprado do fornecedor por R$ 25, mais sacola (R$ 0,50) e etiqueta (R$ 0,10); vendido nos tamanhos 2 a 8."
    },
    "Alimento": {
     "definicao": "Registro padronizado da receita: cada ingrediente com a quantidade exata, o modo de preparo, quantas unidades a receita rende, a perda no preparo, a embalagem de cada unidade, a validade e o tempo de preparo.",
     "exemplo": "Brownie: 200 g de chocolate, 150 g de manteiga, 200 g de açúcar, 3 ovos e 100 g de farinha (R$ 30); rende 12 pedaços, 2 quebram e ficam 10; saquinho de R$ 0,50; dura 5 dias em pote fechado; 1 hora por fornada. Custo por pedaço: R$ 30 ÷ 10 + R$ 0,50 = R$ 3,50."
    }
   }
  },
  {
   "codigo": "M4.BT09S",
   "conceito": "Ficha técnica do serviço",
   "definicao": "Registro padronizado de um atendimento: as etapas (do pedido do cliente até o fim), o tempo que um atendimento leva, os materiais usados em cada atendimento e o custo desses materiais por atendimento.",
   "porque": "Sem isso cada atendimento sai diferente e você não consegue saber quanto tempo e quanto dinheiro gasta com cada cliente.",
   "exemplo": "Manicure em domicílio: combinar horário, ir até a cliente, tirar o esmalte, cutilar, esmaltar e secar; cerca de 1 hora; algodão, acetona, lixa, palito e esmalte; cerca de R$ 6 de material por atendimento.",
   "tipo_fonte": "Institucional",
   "fonte": "Sebrae, \"Estudo inédito mapeia características que influenciam a produtividade dos bares e restaurantes no país\"",
   "link": "https://agenciasebrae.com.br/economia-e-politica/estudo-inedito-mapeia-caracteristicas-que-influenciam-a-produtividade-dos-bares-e-restaurantes-no-pais/",
   "data": "22/09/2026",
   "so_servico": true
  },
  {
   "codigo": "M4.BT10",
   "conceito": "Funcionalidades essenciais",
   "definicao": "Separar o que o produto precisa ter para resolver a dor do cliente (essencial) do que seria bom ter, mas pode esperar (secundário).",
   "porque": "Sem separar essencial de secundário, o empreendedor tende a incluir tudo de uma vez e se perder.",
   "exemplo": "Essencial: bolo comestível e no prazo combinado. Secundário: papel personalizado, cartão de mensagem, fita decorativa.",
   "tipo_fonte": "Institucional",
   "fonte": "Sebrae, \"Estudo inédito mapeia características que influenciam a produtividade dos bares e restaurantes no país\"",
   "link": "https://agenciasebrae.com.br/economia-e-politica/estudo-inedito-mapeia-caracteristicas-que-influenciam-a-produtividade-dos-bares-e-restaurantes-no-pais/",
   "data": "22/09/2026",
   "por_tipo": {
    "Serviço": {
     "exemplo": "Essencial: unhas bem feitas, no horário combinado. Secundário: decoração nas unhas, hidratação das mãos, brinde."
    },
    "Mercadoria": {
     "exemplo": "Essencial: peça no tamanho certo, entregue no prazo. Secundário: embalagem de presente, cartão, laço."
    }
   }
  },
  {
   "codigo": "M4.BT11",
   "conceito": "Informação obrigatória ao consumidor no teste",
   "definicao": "Mesmo numa oferta mínima de teste, é exigido informar de forma clara características, riscos e preço do produto ou serviço.",
   "porque": "Evita responder por omissão de informação essencial já no primeiro teste com clientes reais, seja qual for o produto ou serviço.",
   "exemplo": "Ao vender o bolo em pré-venda pelo Instagram, informar ingredientes, prazo de entrega, preço total e forma de conservação mesmo num post informal.",
   "tipo_fonte": "Oficial",
   "fonte": "Código de Defesa do Consumidor, Lei nº 8.078/1990, art. 6º, inciso III",
   "link": "https://www.planalto.gov.br/ccivil_03/Leis/L8078compilado.htm",
   "data": "30/09/2026",
   "por_tipo": {
    "Serviço": {
     "exemplo": "Ao divulgar a manicure pelo Instagram, informar o preço total, o tempo do atendimento, os produtos usados e como remarcar, mesmo num post informal."
    },
    "Mercadoria": {
     "exemplo": "Ao vender as peças pelo Instagram, informar tamanho, tecido, preço total, prazo de entrega e se aceita troca, mesmo num post informal."
    }
   }
  },
  {
   "codigo": "M4.BT12",
   "conceito": "Proteção dos dados dos clientes no teste (LGPD)",
   "definicao": "Nome, telefone ou e-mail de clientes reais coletados no teste já são dados pessoais protegidos por lei.",
   "porque": "Mesmo um teste informal que anota contato de clientes precisa de finalidade clara, sem coletar mais dado do que o necessário.",
   "exemplo": "Ao pedir nome e telefone para reservar o bolo: \"seus dados serão usados só para combinar a entrega deste teste e não serão compartilhados com terceiros.\"",
   "tipo_fonte": "Oficial",
   "fonte": "Lei Geral de Proteção de Dados Pessoais, Lei nº 13.709/2018, arts. 5º (XII), 6º (I), 7º (I) e 8º (§4º)",
   "link": "https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/L13709compilado.htm",
   "data": "30/09/2026",
   "por_tipo": {
    "Serviço": {
     "exemplo": "Ao pedir nome e telefone para agendar o horário: \"seus dados serão usados só para combinar o atendimento deste teste e não serão compartilhados com terceiros.\""
    },
    "Mercadoria": {
     "exemplo": "Ao pedir nome e telefone para registrar o pedido: \"seus dados serão usados só para combinar a entrega deste teste e não serão compartilhados com terceiros.\""
    }
   }
  }
 ],
 "perguntas": [
  {
   "codigo": "M4.P01",
   "modulo": "M4",
   "pergunta": "Em uma frase, o que você vai oferecer aos primeiros clientes?",
   "ajuda": "Descreva como explicaria a um conhecido. Ex.: \"Eu pretendo oferecer aos meus clientes um bolo de pote para lanche escolar\".",
   "tipo": "Texto",
   "condicao": "sempre",
   "opcoes": "Não sei",
   "alerta": "",
   "proximo": "Siga para a próxima pergunta para detalhar o que você pretende oferecer.",
   "fonte": "M4.BT08 (Meu Bolso em Dia/Febraban, consulta em 22/09/2026)",
   "status": "Rascunho",
   "alerta_naosei": "Você não poderá avançar antes de conseguir construir a frase, porque isso define as próximas etapas.",
   "bloqueia_naosei": true,
   "por_tipo": {
    "Serviço": {
     "ajuda": "Descreva como explicaria a um conhecido. Ex.: \"Eu pretendo oferecer às minhas clientes manicure em domicílio no fim do dia\".",
     "ajuda_mais": "Descrições muito amplas (ex.: \"beleza\", \"consultoria\") dificultam o teste, porque cada pessoa entende uma coisa diferente.",
     "placeholder": "Ex.: manicure em domicílio no fim do dia"
    },
    "Mercadoria": {
     "ajuda": "Descreva como explicaria a um conhecido. Ex.: \"Eu pretendo revender roupas infantis para as mães do meu bairro\".",
     "ajuda_mais": "Descrições muito amplas (ex.: \"roupas\", \"cosméticos\") dificultam o teste, porque cada pessoa entende uma coisa diferente.",
     "placeholder": "Ex.: roupas infantis para as mães do meu bairro"
    }
   },
   "ajuda_mais": "Descrições muito amplas (ex.: \"doces\", \"consultoria\") dificultam o teste, porque cada pessoa entende uma coisa diferente.",
   "placeholder": "Ex.: bolo de pote para lanche escolar",
   "comoDescobrir": [
    "Pense no que você já faz bem e que alguém já pediu ou elogiou: comida, conserto, cuidado, costura, revenda.",
    "Complete em voz alta: “Eu vou oferecer ___ para ___”. Escreva do jeito que sair; dá para mudar depois."
   ],
   "promptIA": "Quero começar um pequeno negócio. Sei fazer [o que você sabe fazer] e tenho [quanto tempo e dinheiro você tem]. Me ajude a escrever, em uma frase simples, o que eu poderia oferecer e para quem. Me dê 3 opções curtas."
  },
  {
   "codigo": "M4.P02",
   "modulo": "M4",
   "pergunta": "Isso é produto, serviço ou mercadoria?",
   "ajuda": "Escolha a opção que mais se aproxima. Ela define quais perguntas você verá a seguir.",
   "tipo": "Escolha",
   "condicao": "sempre",
   "opcoes": "Produto; Serviço; Mercadoria; Mercadoria+ Serviço; Produto+ Serviço; Mercadoria+Produto;",
   "proximo": "",
   "fonte": "Estrutura do fluxo (sem regra externa)",
   "status": "Rascunho",
   "destaque": "Produto: você mesmo faz (ex.: comida caseira).\nServiço: seu trabalho para alguém (ex.: manicure).\nMercadoria: você compra pronto e revende (ex.: roupas).",
   "destaque_visivel": true
  },
  {
   "codigo": "M4.P03",
   "modulo": "M4",
   "pergunta": "Quais materiais ou ingredientes principais você precisa para fazer o produto?",
   "ajuda": "Liste o essencial, mesmo sem quantidades exatas. Ex.: farinha, ovos, açúcar, embalagem.",
   "tipo": "Texto",
   "condicao": "M4.P02 = Produto físico ou M4.P02 = Ambos",
   "opcoes": "Não sei",
   "resposta": "",
   "proximo": "Se ainda não tem as quantidades, anote o que usou em uma unidade; depois o módulo de custos ajuda a estimar o custo por unidade.",
   "fonte": "M4.BT09 (fonte a substituir; ver aba Revisão e sugestões, item 12)",
   "status": "Rascunho",
   "resposta_naosei": "Em caso de dificuldade para preencher essa ficha técnica, indicamos que você use o seguinte prompt na sua Inteligência Artificial preferida para ajudar nessa etapa: ",
   "prompt_ia": "Você vai me ajudar a montar a FICHA TÉCNICA de um produto que eu quero fazer. Quero apenas o que é necessário para produzi-lo, sem análise de mercado, preço ou divulgação.\n\nCOMO CONDUZIR\n- Confirme em uma frase o que entendeu do produto.\n- Faça no máximo 3 perguntas por vez, em linguagem simples, e espere minha resposta.\n- Adapte as perguntas ao tipo de produto (físico, alimento, serviço, digital).\n- Se eu não souber algo, não invente: marque como \"A definir\" e me diga rapidamente como descobrir.\n- Quem decide sou eu. Você apenas orienta.\n\nO QUE VOCÊ DEVE LEVANTAR (só o que se aplicar ao meu produto)\n- Descrição do produto: o que é, para que serve e como deve ficar pronto.\n- Materiais, ingredientes ou componentes: o que usa e em que quantidade.\n- Medidas e especificações: tamanho, peso, cor, capacidade e outras características técnicas.\n- Equipamentos e ferramentas necessários.\n- Passo a passo de produção.\n- Tempo de produção e rendimento (quanto sai por vez).\n- Embalagem e armazenamento.\n- Cuidados de qualidade e segurança (testes, normas ou exigências legais, se houver).\n\nENTREGA FINAL\nQuando eu disser que terminei, monte a ficha técnica organizada em seções, usando apenas o que eu informei. Itens sem resposta ficam como \"A definir\". No fim, liste o que ainda falta definir.\n\nO PRODUTO QUE QUERO DETALHAR É:\n[escreva aqui o seu produto]",
   "conceito_naosei": "M4.BT09",
   "condicao_app": "M4.P02 = Produto ou M4.P02 = Produto+ Serviço ou M4.P02 = Mercadoria+Produto ou M4.P02 = Mercadoria ou M4.P02 = Mercadoria+ Serviço",
   "por_tipo": {
    "Mercadoria": {
     "pergunta": "Quais mercadorias você vai comprar prontas para revender e o que mais precisa?",
     "ajuda": "Liste o essencial, mesmo sem quantidades exatas. Ex.: conjuntos de roupa infantil do 2 ao 8, sacolas, etiquetas de preço.",
     "proximo": "Se ainda não tem os preços de compra, anote o que já sabe; depois o módulo de custos ajuda a estimar o custo por unidade.",
     "resposta_naosei": "Em caso de dificuldade para preencher essa lista, indicamos que você use o seguinte texto na sua Inteligência Artificial preferida para ajudar nessa etapa: ",
     "prompt_ia": "Você vai me ajudar a montar a FICHA de uma mercadoria que eu quero comprar pronta para revender. Quero apenas o que é necessário para comprar, guardar e vender, sem análise de mercado, preço ou divulgação.\n\nCOMO CONDUZIR\n- Confirme em uma frase o que entendeu da mercadoria.\n- Faça no máximo 3 perguntas por vez, em linguagem simples, e espere minha resposta.\n- Se eu não souber algo, não invente: marque como \"A definir\" e me diga rapidamente como descobrir.\n- Quem decide sou eu. Você apenas orienta.\n\nO QUE VOCÊ DEVE LEVANTAR (só o que se aplicar à minha mercadoria)\n- Descrição da mercadoria: o que é, modelos, tamanhos e cores.\n- De quem vou comprar e quanto pago por unidade.\n- Quantidade mínima de compra e prazo de entrega do fornecedor.\n- Frete ou deslocamento para buscar.\n- Embalagem, etiqueta e outros itens para vender cada unidade.\n- Como guardar e cuidados para não estragar ou perder.\n- Regras de troca e garantia.\n\nENTREGA FINAL\nQuando eu disser que terminei, monte a ficha organizada em seções, usando apenas o que eu informei. Itens sem resposta ficam como \"A definir\". No fim, liste o que ainda falta definir.\n\nA MERCADORIA QUE QUERO DETALHAR É:\n[escreva aqui a sua mercadoria]",
     "ajuda_mais": "Essa lista é a base da ficha de cada mercadoria (o que você compra, de quem e por quanto). Sem uma lista clara, fica difícil repetir o teste ou calcular o custo.",
     "placeholder": "Ex.: conjuntos de roupa infantil, sacolas, etiquetas",
     "comoDescobrir": [
      "Chame 2 fornecedores e pergunte o preço por unidade, a quantidade mínima e o prazo de entrega.",
      "Anote também o que mais precisa para vender cada peça: sacola, etiqueta, frete."
     ]
    },
    "Alimento": {
     "pergunta": "Quais ingredientes vão na sua receita, em que quantidade, e quantas unidades ela rende?",
     "ajuda": "Monte a ficha técnica da sua receita: a quantidade de cada ingrediente (em gramas ou ml), quantas unidades ela rende e a embalagem de cada unidade.",
     "ajuda_exemplo": {
      "titulo": "Ver um exemplo com brownie",
      "texto": "200 g de chocolate, 150 g de manteiga, 200 g de açúcar, 3 ovos e 100 g de farinha: uns R$ 30 de ingredientes. A assadeira rende 12 pedaços, mas 2 quebram, então ficam 10 para vender. Cada pedaço vai num saquinho de R$ 0,50. Dura 5 dias em pote fechado. Leva 1 hora por fornada.\n\nCusto por pedaço: R$ 30 ÷ 10 = R$ 3,00 + R$ 0,50 da embalagem = R$ 3,50."
     },
     "proximo": "Se ainda não pesou os ingredientes, faça uma fornada anotando tudo; depois o módulo de custos ajuda a calcular o custo por unidade.",
     "resposta_naosei": "Em caso de dificuldade para preencher essa ficha técnica, indicamos que você use o seguinte texto na sua Inteligência Artificial preferida para ajudar nessa etapa: ",
     "prompt_ia": "Você vai me ajudar a montar a FICHA TÉCNICA de um alimento que eu quero fazer para vender. Quero apenas o que é necessário para produzi-lo, sem análise de mercado, preço de venda ou divulgação.\n\nCOMO CONDUZIR\n- Confirme em uma frase o que entendeu do alimento.\n- Faça no máximo 3 perguntas por vez, em linguagem simples, e espere minha resposta.\n- Se eu não souber algo, não invente: marque como \"A definir\" e me diga rapidamente como descobrir (por exemplo, pesar tudo na próxima fornada).\n- Quem decide sou eu. Você apenas orienta.\n\nO QUE VOCÊ DEVE LEVANTAR\n- Receita: cada ingrediente, a quantidade usada (em gramas ou ml) e quanto paguei por ele.\n- Rendimento: quantas unidades saem de uma receita (por fornada, assadeira ou panela).\n- Perda no preparo: aparas, quebra, o que queima ou estraga e não dá para vender.\n- Embalagem de cada unidade (pote, saquinho, caixa, etiqueta) e quanto ela custa.\n- Validade e como guardar (fora da geladeira, na geladeira ou no congelador).\n- Tempo de preparo de cada fornada ou pedido, contando assar e esfriar.\n- Utensílios e equipamentos que eu uso.\n- Cuidados de higiene no preparo.\n\nCONTA DO CUSTO POR UNIDADE\nCusto por unidade = custo da receita ÷ unidades boas para vender (o rendimento menos a perda) + custo da embalagem de uma unidade.\nExemplo (brownie): os ingredientes da receita custam R$ 30; a assadeira rende 12 pedaços, 2 quebram e sobram 10; R$ 30 ÷ 10 = R$ 3,00; mais R$ 0,50 do saquinho = R$ 3,50 por pedaço.\n\nENTREGA FINAL\nQuando eu disser que terminei, monte a ficha técnica organizada em seções, usando apenas o que eu informei, com a conta do custo por unidade. Itens sem resposta ficam como \"A definir\". No fim, liste o que ainda falta definir.\n\nO ALIMENTO QUE QUERO DETALHAR É:\n[escreva aqui o seu alimento]",
     "ajuda_mais": "Anote também quanto se perde no preparo (aparas, quebra, o que estraga), a validade e como guardar, e o tempo de preparo de cada fornada ou pedido.\n\nCusto por unidade = custo da receita ÷ rendimento, mais a embalagem.",
     "placeholder": "Ex.: 200 g de chocolate, 3 ovos, 100 g de farinha; rende 12",
     "comoDescobrir": [
      "Faça a receita uma vez e anote a quantidade de cada ingrediente e quantas unidades rendeu.",
      "Anote também a embalagem de cada unidade, a validade e quanto tempo levou para fazer."
     ]
    }
   },
   "ajuda_mais": "Essa lista é a base da ficha técnica do produto. Sem uma lista clara, cada lote pode sair diferente, e fica difícil repetir o teste ou calcular o custo.",
   "placeholder": "Ex.: farinha, ovos, açúcar, embalagem",
   "comoDescobrir": [
    "Faça (ou imagine fazer) uma unidade e anote tudo o que usou, do material principal até a embalagem.",
    "Olhe a etiqueta de um produto parecido ou pergunte numa loja de materiais o que costuma ir nele."
   ]
  },
  {
   "codigo": "M4.P04",
   "pergunta": "Como o produto vai chegar até o cliente?",
   "ajuda": "Pense nas formas viáveis de levar o produto até o seu cliente. Marque todas as que você pretende usar.",
   "tipo": "Múltipla escolha",
   "condicao": "M4.P02 = Produto físico ou M4.P03 = Produto + Serviço ",
   "opcoes": "De porta a porta pessoalmente; Plataformas (iFood); Entregador parceiro; Loja própria ou parceira; Retirada presencial pelo cliente; Não sei",
   "resposta": "",
   "resposta_naosei": "Reflita melhor sobre as opções. Cada opção tem um custo específico, que é importante definir para saber a viabilidade do seu negócio. Sem sabermos isso, poderemos encontrar problemas em outros módulos.",
   "condicao_app": "M4.P02 = Produto ou M4.P02 = Produto+ Serviço ou M4.P02 = Mercadoria+Produto",
   "comoDescobrir": [
    "Pergunte a 3 possíveis clientes como preferem receber: buscar, receber em casa ou pedir por aplicativo.",
    "Veja como vendedores parecidos do seu bairro entregam e quanto cobram pela entrega."
   ],
   "promptIA": "Vou vender [seu produto] em [seu bairro ou cidade], para [seu cliente]. Compare para mim, em linguagem simples, estas formas de entrega: eu mesmo levo, aplicativo de entrega, entregador parceiro, loja parceira e o cliente buscar. Para cada uma, diga o custo aproximado, o trabalho e quando vale a pena."
  },
  {
   "codigo": "M4.P05",
   "modulo": "M4",
   "pergunta": "Quantas versões ou sabores você vai oferecer no primeiro teste?",
   "ajuda": "Conte só o que entra no primeiro teste, não o cardápio ou pacote completo do futuro. Ex.: 3 sabores.\n\nVamos considerar este número como a variedade mínima do seu primeiro teste.",
   "tipo": "Texto",
   "condicao": "M4.P02 = Produto ou M4.P02 = Produto + Serviço",
   "opcoes": "Não sei",
   "resposta": "",
   "proximo": "Se o número for maior que 3 ou você não souber, a próxima pergunta ajuda a separar o essencial do que pode esperar.",
   "fonte": "M4.BT10 (fonte a substituir); o limite de 3 é sugestão do grupo, a validar com a tutora",
   "status": "Rascunho",
   "destaque_alerta": "Muitas opções aumentam custo, tempo e sobras, e dificultam saber o que o cliente realmente preferiu.",
   "resposta_naosei": "Pense melhor: quantas opções ou variações você estaria disposto(a) a oferecer ao seu cliente? Ex.: quero oferecer picolé gourmet de ninho trufado, brigadeiro e sensação, todos do mesmo tamanho.",
   "condicao_app": "M4.P02 = Produto ou M4.P02 = Produto+ Serviço ou M4.P02 = Mercadoria+Produto",
   "placeholder": "Ex.: 3 sabores",
   "comoDescobrir": [
    "Liste tudo o que você gostaria de oferecer e marque as 2 ou 3 opções que mais pedem ou que você faz melhor.",
    "Comece com poucas: gasta menos, sobra menos e você descobre mais rápido qual o cliente prefere."
   ],
   "promptIA": "Quero testar [seu produto] com os primeiros clientes. Minhas ideias de versões são: [liste sabores, tamanhos ou modelos]. Me ajude a escolher 2 ou 3 para começar, pensando em custo baixo, pouca sobra e no que o cliente mais procura."
  },
  {
   "codigo": "M4.P06",
   "modulo": "M4",
   "pergunta": "O que você precisa ter e fazer para realizar o serviço uma vez?",
   "ajuda": "Monte a ficha técnica do seu atendimento: as etapas, do pedido do cliente até o fim; quanto tempo leva um atendimento completo; os materiais que você usa em cada atendimento; e quanto esses materiais custam por atendimento.",
   "tipo": "Texto",
   "condicao": "M4.P02 = Serviço ou M4.P02 = Produto+Serviço ou M4.P02 = Mercadoria + Serviço ",
   "opcoes": "Não sei",
   "resposta": "",
   "fonte": "Pendente: incluir conceito na aba 2 (ver aba Revisão e sugestões, seção B)",
   "status": "Rascunho",
   "resposta_naosei": "Serviços dependem do seu tempo e da sua agenda. Se o tempo gasto não estiver claro, o teste pode consumir mais horas do que você imaginou.\n\nPara montar a ficha técnica do seu atendimento, você pode usar o texto abaixo na sua Inteligência Artificial preferida:",
   "condicao_app": "M4.P02 = Serviço ou M4.P02 = Produto+ Serviço ou M4.P02 = Mercadoria+ Serviço",
   "prompt_ia": "Você vai me ajudar a montar a FICHA TÉCNICA de um serviço que eu quero oferecer. Quero apenas o que é necessário para realizar um atendimento, sem análise de mercado, preço ou divulgação.\n\nCOMO CONDUZIR\n- Confirme em uma frase o que entendeu do serviço.\n- Faça no máximo 3 perguntas por vez, em linguagem simples, e espere minha resposta.\n- Se eu não souber algo, não invente: marque como \"A definir\" e me diga rapidamente como descobrir.\n- Quem decide sou eu. Você apenas orienta.\n\nO QUE VOCÊ DEVE LEVANTAR (só o que se aplicar ao meu serviço)\n- Descrição do serviço: o que é, para quem e como o cliente recebe o resultado.\n- Etapas do atendimento, do pedido do cliente até o fim (agendar, deslocar, preparar, executar, conferir com o cliente, limpar).\n- Tempo de cada etapa e tempo total de um atendimento.\n- Materiais usados em cada atendimento e a quantidade gasta por atendimento.\n- Custo desses materiais por atendimento.\n- Equipamentos e ferramentas que uso em todos os atendimentos.\n- Deslocamento: distância e gasto, se eu for até o cliente.\n- Cuidados de higiene, qualidade e segurança (normas ou exigências legais, se houver).\n\nENTREGA FINAL\nQuando eu disser que terminei, monte a ficha técnica do atendimento organizada em seções, usando apenas o que eu informei, com o tempo total e o custo de material por atendimento. Itens sem resposta ficam como \"A definir\". No fim, liste o que ainda falta definir.\n\nO SERVIÇO QUE QUERO DETALHAR É:\n[escreva aqui o seu serviço]",
   "conceito_naosei": "M4.BT09S",
   "ajuda_mais": "Ex. (manicure em domicílio): combinar horário, ir até a cliente, tirar o esmalte, cutilar, esmaltar e secar; cerca de 1 hora; algodão, acetona, lixa, palito e esmalte; uns R$ 6 de material por atendimento.\n\nO tempo e o custo por atendimento ajudam nas próximas perguntas e nos módulos de custos e de operação.",
   "placeholder": "Ex.: combinar horário, ir até a cliente, fazer as unhas; 1 hora; R$ 6 de material",
   "comoDescobrir": [
    "Faça o serviço uma vez (pode ser num conhecido) e anote cada etapa, quanto tempo levou e o que usou.",
    "Some quanto custou o material gasto nesse atendimento, incluindo o transporte, se houver."
   ]
  },
  {
   "codigo": "M4.P07",
   "modulo": "M4",
   "pergunta": "Do que você pensou, o que é essencial e o que pode esperar?",
   "ajuda": "Vamos considerar só o essencial na sua oferta mínima. Essencial é o que o cliente precisa receber para sentir que o problema foi resolvido. O restante é secundário. Ex.: essencial: bolo comestível e no prazo combinado; secundário: papel personalizado, cartão, fita.",
   "tipo": "Texto",
   "condicao": "M4.P05 > 3 ou M4.P05 = Não sei",
   "opcoes": "Não sei",
   "resposta": "",
   "proximo": "Mantenha na oferta mínima poucas opções essenciais; o restante fica na lista de ideias futuras.",
   "fonte": "M4.BT10 (fonte a substituir; ver aba Revisão e sugestões, item 12)",
   "status": "Rascunho",
   "destaque_alerta": "Incluir tudo de uma vez tende a aumentar o custo e a confundir o resultado do teste.",
   "resposta_naosei": "Pense no mínimo que você precisa fazer para começar, como no exemplo. Depois, separe o que é essencial do que pode esperar, ou seja, do que não faz diferença no início do negócio.",
   "placeholder": "Ex.: essencial: bolo gostoso e no prazo; pode esperar: fita e cartão",
   "comoDescobrir": [
    "Para cada item, pergunte: sem isso, o cliente ainda ficaria satisfeito? Se sim, ele pode esperar.",
    "Pergunte a 2 ou 3 possíveis clientes o que não pode faltar de jeito nenhum."
   ],
   "promptIA": "Vou oferecer [seu produto ou serviço] para [seu cliente]. As opções e detalhes que pensei são: [liste tudo]. Separe para mim o que é essencial para o cliente ficar satisfeito no primeiro teste e o que pode esperar. Explique em linguagem simples."
  },
  {
   "codigo": "M4.P08",
   "modulo": "M4",
   "pergunta": "Quem é o seu primeiro cliente? Descreva um grupo bem específico.",
   "ajuda": "Quanto mais específico, mais fácil de testar. Ex.: \"pais de alunos da escola perto de casa\", em vez de \"todo mundo\".",
   "tipo": "Texto",
   "condicao": "sempre",
   "opcoes": "Não sei",
   "resposta": "Vamos usar este grupo como o público do primeiro teste. Ele pode mudar depois de conversar com pessoas reais.",
   "alerta": "\"Todo mundo\" dificulta o teste: cada grupo compra por motivos diferentes, e fica difícil saber quem realmente faz parte do seu público.",
   "proximo": "Se você já pesquisou clientes no módulo de clientes e necessidades, compare com o que escreveu aqui.",
   "fonte": "M4.BT01 (Sebrae, consulta em 22/09/2026)",
   "status": "Rascunho",
   "placeholder": "Ex.: pais de alunos da escola perto de casa",
   "comoDescobrir": [
    "Lembre de quem já comprou, pediu ou elogiou o que você faz: idade, onde mora, o que essas pessoas têm em comum.",
    "Escolha um grupo que você consegue encontrar esta semana, como vizinhos, colegas de trabalho ou pais da escola."
   ],
   "promptIA": "Vou oferecer [seu produto ou serviço] em [seu bairro ou cidade]. Me ajude a escolher um primeiro grupo de clientes bem específico, fácil de encontrar e com mais chance de comprar. Me dê 3 opções, com o motivo de cada uma."
  },
  {
   "codigo": "M4.P09",
   "modulo": "M4",
   "pergunta": "Que problema ou necessidade desse cliente o seu produto ou serviço ajuda a resolver?",
   "ajuda": "Pense em uma situação real em que o cliente sente falta de algo ou se incomoda hoje. Ex.: \"esqueceu de encomendar o bolo de aniversário\".",
   "tipo": "Texto",
   "condicao": "sempre",
   "opcoes": "Não sei",
   "resposta": "Este problema será tratado como uma suposição sua, que ainda precisa ser confirmada com clientes.",
   "alerta": "Se o problema veio só da sua opinião, ele ainda é uma hipótese: pessoas próximas costumam elogiar mesmo quando não comprariam.",
   "proximo": "Anote quantas vezes você viu ou ouviu esse problema em pessoas reais; isso será útil ao definir o teste.",
   "fonte": "M4.BT01; M4.BT08 (Sebrae; Meu Bolso em Dia/Febraban, consulta em 22/09/2026)",
   "status": "Rascunho",
   "por_tipo": {
    "Serviço": {
     "ajuda": "Pense em uma situação real em que o cliente sente falta de algo ou se incomoda hoje. Ex.: \"não consegue ir ao salão durante a semana porque trabalha até tarde\".",
     "placeholder": "Ex.: não consegue ir ao salão porque trabalha até tarde"
    },
    "Mercadoria": {
     "ajuda": "Pense em uma situação real em que o cliente sente falta de algo ou se incomoda hoje. Ex.: \"não acha roupa infantil com preço bom perto de casa\".",
     "placeholder": "Ex.: não acha roupa infantil com preço bom perto de casa"
    }
   },
   "placeholder": "Ex.: esqueceu de encomendar o bolo de aniversário",
   "comoDescobrir": [
    "Converse com 3 pessoas do seu público e pergunte o que mais incomoda quando precisam do que você oferece.",
    "Anote as frases que se repetem: o problema que mais aparece é o que vale testar."
   ],
   "promptIA": "Vou oferecer [seu produto ou serviço] para [seu cliente]. Liste 5 problemas ou incômodos do dia a dia que esse cliente pode ter e que o que eu ofereço ajudaria a resolver. Depois, me sugira 3 perguntas simples para eu confirmar isso conversando com ele."
  },
  {
   "codigo": "M4.P10",
   "modulo": "M4",
   "pergunta": "O que o cliente ganha na prática ao usar o que você oferece?",
   "ajuda": "Descreva o resultado para o cliente, não a característica do produto. Ex.: em vez de \"bolo sem glúten\" (característica), \"poder comer doce sem passar mal\" (benefício).",
   "tipo": "Texto",
   "condicao": "sempre",
   "opcoes": "Não sei",
   "resposta": "Este benefício vai compor a sua proposta de valor.",
   "alerta": "Descrever só o que o produto é enfraquece a proposta de valor, porque o cliente compra pelo resultado que espera.",
   "proximo": "Confira se o benefício descreve algo que o cliente percebe, e não algo do seu processo de produção.",
   "fonte": "M4.BT02 (fonte de baixa autoridade; ver aba Revisão e sugestões, item 13)",
   "status": "Rascunho",
   "por_tipo": {
    "Serviço": {
     "ajuda": "Descreva o resultado para o cliente, não a característica do serviço. Ex.: em vez de \"manicure com esmaltes importados\" (característica), \"sair com as unhas prontas sem sair de casa\" (benefício).",
     "placeholder": "Ex.: sair com as unhas prontas sem sair de casa"
    },
    "Mercadoria": {
     "ajuda": "Descreva o resultado para o cliente, não a característica da mercadoria. Ex.: em vez de \"roupa 100% algodão\" (característica), \"a criança fica confortável o dia todo\" (benefício).",
     "placeholder": "Ex.: a criança fica confortável o dia todo"
    }
   },
   "placeholder": "Ex.: poder comer doce sem passar mal",
   "comoDescobrir": [
    "Complete a frase: “Com o que eu ofereço, o cliente consegue ___”. Fale do resultado, não do produto.",
    "Pergunte a quem já usou ou provou o que mudou para a pessoa e use as palavras dela."
   ],
   "promptIA": "Eu ofereço [seu produto ou serviço] para [seu cliente]. Transforme as características em benefícios: o que o cliente ganha na prática (tempo, economia, saúde, conforto, praticidade). Me dê 5 exemplos curtos, em linguagem simples."
  },
  {
   "codigo": "M4.P11",
   "modulo": "M4",
   "pergunta": "Por que o cliente escolheria você, e não outra opção que já tem?",
   "ajuda": "Pense no que o cliente faz hoje para resolver o problema: comprar em outro lugar, fazer em casa, deixar como está. Escolha o motivo que você consegue sustentar na prática.",
   "tipo": "Escolha",
   "condicao": "sempre",
   "opcoes": "Preço; Prazo/rapidez; Atendimento; Qualidade/especialização; Conveniência; Outro; Não sei",
   "resposta": "Este motivo será tratado como o seu diferencial hipotético, a ser conferido no teste.",
   "alerta": "Gostar da própria ideia não é o mesmo que ter um motivo de escolha para o cliente. Se ainda não há um motivo claro, essa informação ajuda a ajustar antes de testar. Se você já pesquisou concorrentes e alternativas no módulo de mercado, compare o seu motivo com o que eles oferecem.",
   "proximo": "",
   "fonte": "M4.BT03 (Serasa Experian, consulta em 22/09/2026)",
   "status": "Rascunho",
   "outro_campo": {
    "opcao": "Outro",
    "rotulo": "Qual é esse outro motivo?",
    "erro": "Escreva qual é o outro motivo para continuar."
   },
   "comoDescobrir": [
    "Veja o que o cliente faz hoje: compra de quem, por quanto, e do que reclama.",
    "Escolha o motivo que você consegue cumprir sempre: se não dá para ser o mais barato, talvez seja o mais perto ou o mais rápido."
   ],
   "promptIA": "Vou oferecer [seu produto ou serviço] para [seu cliente] em [seu bairro ou cidade]. Hoje esse cliente resolve isso com [o que ele usa hoje]. Me ajude a descobrir que motivo faria ele me escolher: preço, rapidez, atendimento, qualidade ou conveniência. Explique os prós e contras de cada um para um negócio pequeno."
  },
  {
   "codigo": "M4.PV1",
   "modulo": "M4",
   "tipo": "Texto",
   "condicao": "sempre",
   "opcoes": "",
   "fonte": "M4.BT01 (Sebrae, consulta em 22/09/2026)",
   "status": "Rascunho",
   "pergunta": "Qual problema do cliente o seu produto resolve?",
   "destaque": "Proposta de valor: três respostas curtas que resumem por que o cliente compraria de você. Elas ajudam a escrever a frase da pergunta seguinte.",
   "ajuda": "Pense em uma dificuldade real que o cliente tem hoje. Ex.: \"os pais não têm tempo de preparar um lanche gostoso para a escola\".",
   "por_tipo": {
    "Serviço": {
     "ajuda": "Pense em uma dificuldade real que o cliente tem hoje. Ex.: \"não consegue ir ao salão durante a semana porque trabalha até tarde\".",
     "placeholder": "Ex.: não consegue ir ao salão durante a semana"
    },
    "Mercadoria": {
     "ajuda": "Pense em uma dificuldade real que o cliente tem hoje. Ex.: \"não acha roupa infantil com preço bom perto de casa\".",
     "placeholder": "Ex.: não acha roupa infantil com preço bom perto de casa"
    }
   },
   "placeholder": "Ex.: os pais não têm tempo de preparar um lanche gostoso"
  },
  {
   "codigo": "M4.PV2",
   "modulo": "M4",
   "tipo": "Texto",
   "condicao": "sempre",
   "opcoes": "",
   "fonte": "M4.BT01 (Sebrae, consulta em 22/09/2026)",
   "status": "Rascunho",
   "pergunta": "Por que o cliente escolheria o seu produto em vez de outro?",
   "ajuda": "Pense no que o cliente usa hoje (outra loja, fazer em casa, deixar para lá) e no que você faz melhor. Ex.: \"entrego o bolo de pote na porta da escola, na hora do lanche\".",
   "por_tipo": {
    "Serviço": {
     "ajuda": "Pense no que o cliente usa hoje (outro salão, fazer em casa, deixar para lá) e no que você faz melhor. Ex.: \"atendo em casa depois das 18h, quando os salões já fecharam\".",
     "placeholder": "Ex.: atendo em casa depois das 18h"
    },
    "Mercadoria": {
     "ajuda": "Pense no que o cliente usa hoje (outra loja, comprar pela internet, deixar para lá) e no que você faz melhor. Ex.: \"levo as peças até a casa da cliente para ela provar, sem precisar ir ao centro\".",
     "placeholder": "Ex.: levo as peças até a casa da cliente para provar"
    }
   },
   "placeholder": "Ex.: entrego o bolo de pote na porta da escola"
  },
  {
   "codigo": "M4.PV3",
   "modulo": "M4",
   "tipo": "Texto",
   "condicao": "sempre",
   "opcoes": "",
   "fonte": "M4.BT01 (Sebrae, consulta em 22/09/2026)",
   "status": "Rascunho",
   "pergunta": "Qual é o principal benefício que ele recebe?",
   "ajuda": "Escreva o resultado que o cliente sente, não a característica do produto. Ex.: \"ter um lanche pronto e gostoso sem perder tempo de manhã\".",
   "por_tipo": {
    "Serviço": {
     "ajuda": "Escreva o resultado que o cliente sente, não a característica do serviço. Ex.: \"sair com as unhas prontas sem sair de casa\".",
     "placeholder": "Ex.: sair com as unhas prontas sem sair de casa"
    },
    "Mercadoria": {
     "ajuda": "Escreva o resultado que o cliente sente, não a característica da mercadoria. Ex.: \"vestir bem a criança gastando pouco e sem sair do bairro\".",
     "placeholder": "Ex.: vestir bem a criança gastando pouco"
    }
   },
   "placeholder": "Ex.: ter um lanche pronto sem perder tempo de manhã"
  },
  {
   "codigo": "M4.P12",
   "modulo": "M4",
   "pergunta": "Escreva a sua proposta de valor em uma ou duas frases.",
   "ajuda": "Modelo: \"Para [cliente] que [problema], ofereço [produto ou serviço], que [benefício], proporcionando [meu diferencial].\" Escreva com as suas palavras.",
   "tipo": "Texto",
   "condicao": "sempre",
   "opcoes": "",
   "resposta": "Esta frase é a sua hipótese de trabalho: ela será testada e pode mudar depois do teste.",
   "alerta": "Evite frases vagas como \"o melhor\" ou \"de qualidade\": elas não dizem ao cliente por que escolher você.",
   "proximo": "Leia a frase para alguém do seu público e observe se a pessoa entende o que você oferece.",
   "fonte": "M4.BT01 (Sebrae, consulta em 22/09/2026)",
   "status": "Rascunho",
   "por_tipo": {
    "Serviço": {
     "ajuda": "Modelo: \"Para [cliente] que [problema], ofereço [serviço], que [benefício], proporcionando [meu diferencial].\" Escreva com as suas palavras.",
     "ajuda_mais": "Ex.: \"Para mulheres que trabalham fora e não conseguem ir ao salão, ofereço manicure em domicílio no fim do dia, que deixa as unhas prontas sem sair de casa, proporcionando horário flexível.\"",
     "placeholder": "Ex.: Para mulheres que trabalham fora, ofereço manicure em casa à noite, sem sair de casa"
    },
    "Mercadoria": {
     "ajuda": "Modelo: \"Para [cliente] que [problema], ofereço [mercadoria], que [benefício], proporcionando [meu diferencial].\" Escreva com as suas palavras.",
     "ajuda_mais": "Ex.: \"Para mães do bairro que não têm tempo de ir ao centro, ofereço roupas infantis entregues em casa, que poupam a viagem, proporcionando preço de bairro e troca fácil.\"",
     "placeholder": "Ex.: Para mães do bairro, ofereço roupas infantis entregues em casa, com troca fácil"
    }
   },
   "ajuda_mais": "Ex.: \"Para pessoas com intolerância a glúten ou lactose que evitam comer bolo de pote para não passar mal, ofereço um bolo de pote sem glúten e sem lactose, que não causa desconforto, proporcionando um doce que elas podem comer sem medo.\"",
   "placeholder": "Ex.: Para pais sem tempo, ofereço bolo de pote na porta da escola, que vira um lanche pronto"
  },
  {
   "codigo": "M4.P13",
   "modulo": "M4",
   "pergunta": "O que você acha que vai acontecer quando oferecer ao primeiro cliente?",
   "ajuda": "Escreva como uma suposição, que pode ser confirmada ou não. Modelo: \"[cliente] compraria [produto] por [preço]\". Ex.: \"Alunos e pais voltando da escola pagariam R$ 10 por um bolo de pote.\" A suposição precisa poder ser desmentida.",
   "tipo": "Texto",
   "condicao": "sempre",
   "opcoes": "",
   "resposta": "Esta será a hipótese do seu teste. Se o resultado não a confirmar, isso também traz informação útil.",
   "alerta": "Anote qual parte da hipótese você tem menos certeza: ela merece ser testada primeiro. Lembre-se: dizer que “as pessoas vão gostar” não ajuda, pois não dá para medir. Uma boa hipótese é clara e pode ser testada.",
   "fonte": "M4.BT08 (Meu Bolso em Dia/Febraban, consulta em 22/09/2026)",
   "status": "Rascunho",
   "por_tipo": {
    "Serviço": {
     "ajuda": "Modelo: \"[cliente] marcaria um horário de [serviço] por [preço]\". Ex.: \"Mulheres do meu bairro que trabalham fora marcariam uma manicure em casa por R$ 35.\" A suposição precisa poder ser desmentida.",
     "placeholder": "Ex.: Mulheres do bairro marcariam manicure em casa por R$ 35"
    },
    "Mercadoria": {
     "ajuda": "Modelo: \"[cliente] compraria [mercadoria] por [preço]\". Ex.: \"Mães do bairro comprariam um conjunto de roupa infantil por R$ 40.\" A suposição precisa poder ser desmentida.",
     "placeholder": "Ex.: Mães do bairro comprariam um conjunto infantil por R$ 40"
    }
   },
   "placeholder": "Ex.: Pais da escola pagariam R$ 10 por um bolo de pote"
  },
  {
   "codigo": "M4.P14",
   "modulo": "M4",
   "pergunta": "Como você quer testar sua oferta pela primeira vez?",
   "ajuda": "Escolha o caminho que cabe no seu tempo e no dinheiro que você tem hoje. Toque em uma opção para ver o que ela quer dizer.",
   "tipo": "Escolha",
   "condicao": "sempre",
   "opcoes": "Mostrar uma amostra sem cobrar; Vender pouca quantidade, já com preço; Aceitar encomenda ou reserva antes de fazer; Não sei",
   "opcoes_explica": {
    "Mostrar uma amostra sem cobrar": "Isto é um protótipo: você faz um pouco e deixa algumas pessoas provarem ou verem, sem cobrar. Ajuda a ouvir opiniões, mas não mostra se elas pagariam.",
    "Vender pouca quantidade, já com preço": "Isto é uma oferta mínima: você faz pouco e vende de verdade. Mostra se as pessoas pagam o preço que você pensou.",
    "Aceitar encomenda ou reserva antes de fazer": "Isto é uma pré-venda: você anuncia e só faz depois que o cliente pede ou reserva. Assim você gasta menos antes de saber se vende.",
    "Não sei": "Tudo bem. Leia o que quer dizer cada jeito de testar, logo acima, e escolha o que cabe no seu tempo e no seu dinheiro hoje. Você pode voltar e mudar depois.",
    "Atender poucos clientes, já cobrando": "Isto é uma oferta mínima: você faz o serviço para poucas pessoas e cobra o preço que pensou. Mostra se pagam de verdade.",
    "Aceitar agendamento ou reserva antes de atender": "Isto é uma pré-venda: você divulga e marca horários antes de começar. Se a agenda encher, é sinal de que há procura."
   },
   "resposta": "",
   "alerta": "Elogios de amigos e familiares não comprovam que haverá vendas. Pedidos, reservas e pagamentos são sinais mais fortes.",
   "proximo": "",
   "fonte": "M4.BT04; M4.BT05; M4.BT07 (Sebrae SC; Hostinger; Meu Bolso em Dia, consulta em 22/09/2026)",
   "status": "Rascunho",
   "condicao_app": "sempre",
   "variantes": [
    {
     "condicao_app": "M4.P02 = Serviço ou M4.P02 = Produto+ Serviço ou M4.P02 = Mercadoria+ Serviço",
     "pergunta": "Como você quer testar sua oferta pela primeira vez?",
     "ajuda": "Escolha o caminho que cabe no seu tempo e na sua agenda. Toque em uma opção para ver o que ela quer dizer.",
     "opcoes": "Atender poucos clientes, já cobrando; Aceitar agendamento ou reserva antes de atender"
    }
   ],
   "video": "Vídeo (conteúdo: explicar as opções, indicar o que é preciso para fazer cada uma, beneficios e pontos de atenção a serem levados em consideração)",
   "conceitos_destaque": [
    "M4.BT05",
    "M4.BT04",
    "M4.BT07"
   ],
   "comoDescobrir": [
    "Veja quanto dinheiro e tempo você tem agora: com pouco dinheiro, aceitar encomenda antes de fazer é o mais seguro.",
    "Se ainda não sabe se as pessoas gostam, mostre uma amostra a 5 pessoas; se já sabe, venda pouca quantidade."
   ],
   "promptIA": "Quero testar [seu produto] com os primeiros clientes. Tenho [quanto de dinheiro] e [quanto tempo por semana]. Compare para mim estas 3 formas: mostrar uma amostra sem cobrar, vender pouca quantidade já com preço, ou aceitar encomenda antes de fazer. Qual combina mais comigo e por quê?"
  },
  {
   "codigo": "M4.P15",
   "modulo": "M4",
   "pergunta": "Sua oferta envolve alimento, saúde, criança ou outra atividade com regras próprias?",
   "ajuda": "Mesmo num teste pequeno, vender a clientes reais pode exigir cuidados legais e sanitários, conforme a atividade e o local. Na dúvida, consulte a prefeitura, a Vigilância Sanitária ou o Sebrae antes de vender.",
   "tipo": "Sim/Não",
   "condicao": "M4.P13 = Oferta mínima com preço ou M4.P13 = Pré-venda/reserva",
   "opcoes": "Sim; Não; Não sei",
   "resposta": "Vender sem conhecer as regras da atividade pode gerar problemas para você e para o cliente, mesmo em um teste.",
   "alerta": "O app não faz enquadramento jurídico nem sanitário.",
   "fonte": "Pendente: fonte oficial datada sobre atividade regulada (ver módulo de licenças); M4.BT11 sem fonte ainda",
   "status": "Rascunho",
   "retorno_se": {
    "valores": [
     "Sim",
     "Não sei"
    ],
    "texto": "Se a sua oferta envolve alimentos ou saúde, consulte a Anvisa (gov.br/anvisa). Se envolve produtos para crianças, consulte o Inmetro (gov.br/inmetro). Para tirar dúvidas, acesse sebrae.com.br. Para a regra da sua cidade, busque “[sua cidade] + Vigilância Sanitária”."
   },
   "condicao_app": "M4.P14 = Vender pouca quantidade, já com preço ou M4.P14 = Aceitar encomenda ou reserva antes de fazer ou M4.P14 = Atender poucos clientes, já cobrando ou M4.P14 = Aceitar agendamento ou reserva antes de atender",
   "comoDescobrir": [
    "Ligue ou vá à Vigilância Sanitária ou à prefeitura da sua cidade e pergunte se o que você vai vender precisa de licença.",
    "Procure o Sebrae da sua região: o atendimento é gratuito e eles explicam as regras da sua atividade."
   ],
   "promptIA": "Quero vender [seu produto ou serviço] em [sua cidade e estado], em pequena quantidade, para testar. Que regras de vigilância sanitária, licença ou segurança costumam valer para isso? Diga em quais órgãos eu devo confirmar e que perguntas fazer. Se não tiver certeza de alguma regra, diga."
  },
  {
   "codigo": "M4.P16",
   "modulo": "M4",
   "pergunta": "No teste, você vai anotar nome, telefone ou outro dado dos clientes?",
   "ajuda": "Nome, telefone e e-mail já são dados pessoais protegidos por lei. Se sim, anote só o que for necessário e explique ao cliente para que vai usar.",
   "tipo": "Sim/Não",
   "condicao": "sempre",
   "opcoes": "Sim; Não; Não sei",
   "resposta": "",
   "proximo": "Defina antes quais dados são realmente necessários (ex.: só o telefone para confirmar o pedido) e confirme a regra em fonte oficial.",
   "fonte": "M4.BT12 (sem fonte ainda; ver aba Revisão e sugestões, item 11)",
   "status": "Rascunho",
   "destaque_alerta": "Coletar mais dados do que o necessário, ou sem dizer para que serão usados, cria risco para você e para o cliente.",
   "resposta_naosei": "Pense se vale a pena guardar o contato dos clientes do teste: por exemplo, o telefone para confirmar o pedido ou para avisar quando tiver novidades (só se a pessoa aceitar). Se for guardar, marque “Sim”; se não precisar, marque “Não”. Dá para mudar a resposta em “Corrigir minha resposta”.",
   "comoDescobrir": [
    "Pense se você vai precisar falar de novo com o cliente: confirmar o pedido, avisar a entrega ou mandar novidade.",
    "Se precisar, anote só o necessário (nome e telefone) e conte ao cliente para que vai usar."
   ],
   "promptIA": "Vou fazer um pequeno teste de vendas de [seu produto ou serviço]. Quero anotar [quais dados: nome, telefone…] dos clientes. Me explique em linguagem simples os cuidados básicos para guardar esses dados e me sugira uma frase curta para pedir a autorização do cliente."
  },
  {
   "codigo": "M4.P17",
   "modulo": "M4",
   "pergunta": "Que atitude do cliente vai mostrar que a sua ideia deu certo?",
   "ajuda": "Prefira algo que você consiga contar e que mostre uma atitude do cliente, não só uma opinião. Ex.: quantas pessoas pediram, reservaram ou pagaram.",
   "tipo": "Escolha",
   "condicao": "sempre",
   "opcoes": "Pedidos/reservas; Pedidos de preço/informações; Aceitaram experimentar; Outra; Não sei",
   "proximo": "Defina como e onde vai registrar essa contagem (ex.: uma lista simples com data).",
   "fonte": "M4.BT06; M4.BT07 (NaPrática; Meu Bolso em Dia/Febraban, consulta em 22/09/2026)",
   "status": "Rascunho",
   "destaque_alerta": "Curtidas, elogios e \"eu compraria\" são sinais fracos. Comportamentos como pedir, reservar ou pagar mostram mais.",
   "comoDescobrir": [
    "Pense numa atitude que você consegue contar: pedido, reserva ou pagamento valem mais que elogio ou curtida.",
    "Escolha uma só e prepare uma folha para anotar cada uma, com a data."
   ],
   "promptIA": "Vou testar [seu produto ou serviço] com [seu cliente] por [quantos] dias. Me ajude a escolher uma atitude do cliente que eu possa contar para saber se a ideia funciona (por exemplo, pedidos, reservas ou pagamentos) e explique por que elogios não bastam."
  },
  {
   "codigo": "M4.P18",
   "modulo": "M4",
   "pergunta": "Qual é essa outra atitude do cliente que você vai contar?",
   "ajuda": "É importante que o comportamento possa ser medido, como o número de pedidos ou a quantidade de pessoas que aceitaram experimentar.",
   "tipo": "Texto",
   "condicao": "M4.P17= Outra",
   "destaque_alerta": "Verifique se esse outro comportamento realmente indica que a hipótese foi confirmada. Talvez valha a pena usar um dos comportamentos listados antes.",
   "placeholder": "Ex.: pessoas que pediram para avisar quando tiver de novo"
  },
  {
   "codigo": "M4.P19",
   "modulo": "M4",
   "pergunta": "Qual é o número mínimo para considerar que o teste deu certo?",
   "ajuda": "Defina o número ANTES de ver o resultado. Ex.: 5 (cinco reservas nos 7 dias do teste). Escolha um número que faça sentido para o tamanho do seu teste.",
   "tipo": "Número",
   "condicao": "sempre",
   "opcoes": "Não sei",
   "resposta": "Este é o seu critério de decisão. Ele fica registrado antes do teste para não ser ajustado depois.",
   "alerta": "Definir o critério depois de ver o resultado tende a justificar a ideia original em vez de testá-la. Um número muito baixo também pode dar falsa segurança. Busque ser bem realista.",
   "proximo": "Decida agora o que você vai rever se o resultado ficar abaixo do critério (ex.: preço, público ou oferta).",
   "fonte": "M4.BT06 (NaPrática, consulta em 22/09/2026)",
   "status": "Rascunho",
   "por_tipo": {
    "Serviço": {
     "ajuda": "Defina o número ANTES de ver o resultado. Ex.: 5 (cinco horários marcados nos 7 dias do teste). Escolha um número que faça sentido para o tamanho do seu teste."
    },
    "Mercadoria": {
     "ajuda": "Defina o número ANTES de ver o resultado. Ex.: 5 (cinco peças vendidas nos 7 dias do teste). Escolha um número que faça sentido para o tamanho do seu teste."
    }
   },
   "placeholder": "Ex.: 5",
   "comoDescobrir": [
    "Pense em quantas pessoas o teste vai alcançar: se você falar com 30 pessoas, 5 pedidos já é um bom sinal.",
    "Escolha o número agora, antes de começar, e anote. Não mude depois de ver o resultado."
   ],
   "promptIA": "Vou testar [seu produto ou serviço] por [quantos] dias e devo falar com umas [quantas] pessoas. Vou contar [pedidos, reservas ou pagamentos]. Me ajude a definir um número mínimo realista para dizer que o teste deu certo, explicando a conta de forma simples."
  },
  {
   "codigo": "M4.P20",
   "modulo": "M4",
   "pergunta": "Por quantos dias o teste vai ficar aberto?",
   "ajuda": "Um prazo curto e definido evita que o teste se arraste sem decisão. Ex.: 7 dias.",
   "tipo": "Número",
   "condicao": "sempre",
   "opcoes": "Não sei",
   "alerta": "Sem prazo, é difícil saber quando avaliar o resultado, e o critério perde o sentido.",
   "proximo": "Marque no calendário a data em que você vai comparar o resultado com o critério.",
   "fonte": "Pendente: incluir conceito na aba 2 (ver aba Revisão e sugestões, seção B)",
   "status": "Rascunho",
   "placeholder": "Ex.: 7",
   "comoDescobrir": [
    "Pense em quanto tempo leva para avisar as pessoas e receber os pedidos; para começar, de 7 a 15 dias costuma bastar.",
    "Marque no calendário o dia de começar e o dia de parar para olhar o resultado."
   ],
   "promptIA": "Vou testar [seu produto ou serviço] com [seu cliente]. Consigo produzir ou atender [quanto por semana]. Me ajude a decidir por quantos dias deixar o teste aberto, entre 7 e 30 dias, e o que fazer em cada semana."
  },
  {
   "codigo": "M4.P21",
   "modulo": "M4",
   "pergunta": "Qual o valor máximo, em reais, que você pode gastar no teste?",
   "ajuda": "Defina antes do teste. Pense em um valor que você possa investir sem comprometer despesas essenciais (moradia, alimentação, contas, reserva de emergência). Se puder testar sem gastar, responda 0.",
   "tipo": "Número",
   "condicao": "sempre",
   "opcoes": "Não sei",
   "resposta": "Este é o seu limite de gasto. O app não indica um valor: a escolha é sua, de acordo com o que cabe no seu orçamento.",
   "alerta": "Usar dinheiro de despesas essenciais ou recorrer a dívidas aumenta o risco do teste. Compras difíceis de desfazer também aumentam o risco. É preciso ter cautela e um bom planejamento financeiro para não criar problemas.",
   "proximo": "Compare este limite com o custo estimado no módulo de custos e prefira formas de teste que possam ser interrompidas sem perda grande.",
   "fonte": "Pendente: incluir conceito na aba 2 (ver aba Revisão e sugestões, seção B)",
   "status": "Rascunho",
   "placeholder": "Ex.: 50 (ou 0, se der para testar sem gastar)",
   "comoDescobrir": [
    "Veja quanto sobra no mês depois das contas da casa e use só uma parte dessa sobra, sem mexer na reserva.",
    "Liste o que o teste precisa (material, embalagem, transporte) e some os preços. Se der para testar sem gastar, responda 0."
   ],
   "promptIA": "Quero fazer um primeiro teste de [seu produto ou serviço]. Vou precisar de [liste materiais, embalagens, transporte]. Me ajude a estimar quanto vou gastar no mínimo, em reais, e a montar um teste mais barato, sem usar o dinheiro das contas da casa."
  }
 ],
 "regras": [
  {
   "codigo": "M4.R01",
   "pergunta": "M4.P01",
   "condicao": "M4.P01 preenchida (qualquer texto)",
   "texto": "Anotamos essa frase como ponto de partida. Ela pode ser reescrita depois de você conversar com possíveis clientes.",
   "alerta": "Frases muito amplas (ex.: \"doces\", \"consultoria\") dificultam o teste, porque cada pessoa entende uma coisa diferente. Quanto mais específica, mais fácil de testar.",
   "lacuna": "Se a descrição reflete o que o cliente compra.",
   "proximo": "Próxima pergunta.",
   "encaminhamento": "Nenhum",
   "fonte": "M4.BT01, Sebrae/Proposta de Valor, 22/09/2026"
  },
  {
   "codigo": "M4.R02",
   "pergunta": "M4.P01",
   "condicao": "M4.P01 = Não sei",
   "texto": "Tudo bem não ter a frase pronta agora. Pense em algo que você sabe fazer ou produzir e que alguém poderia querer. Anote mesmo que pareça incompleto.",
   "alerta": "Sem uma descrição mínima, as perguntas seguintes ficam sem base. Tente escrever pelo menos o que você faz ou produz.",
   "lacuna": "Descrição inicial do produto ou serviço.",
   "proximo": "Próxima pergunta.",
   "encaminhamento": "Nenhum",
   "fonte": "M4.BT01, Sebrae/Proposta de Valor, 22/09/2026"
  },
  {
   "codigo": "M4.R03",
   "pergunta": "M4.P02",
   "condicao": "M4.P02 = Produto físico",
   "texto": "Vamos mostrar as perguntas sobre materiais, componentes e variedade do produto.",
   "alerta": "Nenhum. ",
   "lacuna": "Qual o produto.",
   "proximo": "Próxima pergunta.",
   "encaminhamento": "Nenhum",
   "fonte": "Pergunta presente no M1",
   "condicao_app": "M4.P02 = Produto"
  },
  {
   "codigo": "M4.R04",
   "pergunta": "M4.P02",
   "condicao": "M4.P02 = Serviço",
   "texto": "Vamos mostrar as perguntas sobre as etapas e o que é necessário para realizar o serviço.",
   "alerta": "Serviços dependem do seu tempo e da sua agenda. Tenha em mente quanto tempo cada execução leva.",
   "lacuna": "Qual o serviço.",
   "proximo": "Próxima pergunta.",
   "encaminhamento": "Nenhum",
   "fonte": "Pergunta presente no M1"
  },
  {
   "codigo": "M4.R05",
   "pergunta": "M4.P02",
   "condicao": "M4.P02 = Ambos",
   "texto": "Vamos mostrar tanto as perguntas sobre materiais quanto as perguntas sobre etapas do serviço.",
   "alerta": "Se a oferta mistura produto e serviço, vale pensar no que o cliente realmente paga: o objeto, o trabalho ou os dois. Isso pode influenciar o preço e o teste.",
   "lacuna": "Nenhuma.",
   "proximo": "Próxima pergunta.",
   "encaminhamento": "Nenhum",
   "fonte": "Pergunta presente no M1",
   "condicao_app": "M4.P02 = Produto+ Serviço"
  },
  {
   "codigo": "M4.R06",
   "pergunta": "M4.P02",
   "condicao": "M4.P02 = Não sei",
   "texto": "Sem problema. Pense no que o cliente recebe: se é um objeto que ele leva, provavelmente é um produto. Se é algo que você faz por ele sem entregar um objeto, provavelmente é um serviço. Você pode ajustar essa resposta depois.",
   "alerta": "A escolha aqui define quais perguntas você verá. Se mudar de ideia, revise antes de avançar.",
   "lacuna": "Classificação da oferta como produto, serviço ou ambos.",
   "proximo": "Próxima pergunta.",
   "encaminhamento": "Nenhum",
   "fonte": "Pergunta presente no M1"
  },
  {
   "codigo": "M4.R07",
   "pergunta": "M4.P03",
   "condicao": "M4.P03 preenchida (qualquer texto)",
   "texto": "Lista registrada como rascunho da ficha técnica do produto. Você pode acrescentar quantidades no módulo de custos.",
   "alerta": "Itens pequenos (embalagem, perdas, taxa do cartão) costumam ser esquecidos e mudam o custo por unidade.",
   "lacuna": "Quantidades de cada item.",
   "proximo": "Próxima pergunta.",
   "encaminhamento": "Nenhum",
   "fonte": "M4.BT09 (Sebrae, 22/09/2026)"
  },
  {
   "codigo": "M4.R08",
   "pergunta": "M4.P03",
   "condicao": "M4.P03 = Não sei",
   "texto": "Tudo bem não ter a lista completa agora. Anote pelo menos o item principal que o que você vai oferecer precisa para existir.",
   "alerta": "Sem uma lista mínima de materiais, fica difícil estimar o custo por unidade no módulo seguinte e repetir o teste de forma consistente.",
   "lacuna": "Lista completa.",
   "proximo": "Próxima pergunta.",
   "encaminhamento": "Nenhum",
   "fonte": "M4.BT09 (Sebrae, 22/09/2026)"
  }
 ],
 "instrumentos": {
  "lista": []
 },
 "educativo": [],
 "casos": [],
 "leve": {
  "frase": "Você vai detalhar o que oferece, dizer por que o cliente compraria e planejar um teste pequeno da ideia.",
  "minutos": 20
 }
};
