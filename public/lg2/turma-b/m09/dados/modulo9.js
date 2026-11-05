/* Gerado a partir do documento final do Grupo 9 (30/10/2026). Textos literais. */
window.MODULO9 = {
 "origem": "Documento final do Grupo 9 (versão final de 30/10/2026)",
 "modulo": {
  "numero": "9",
  "nome": "Licenças, endereço e atividades reguladas",
  "versao": "versão final",
  "data": "30/10/2026",
  "tutora": "Luiza",
  "integrantes": [
   "Bernardo Ávila Lourenço",
   "Thiago Costa Alves",
   "Bruno Henrique da Silva"
  ]
 },
 "mapa": {
  "objetivo": "Ajudar quem vai abrir ou mudar um pequeno negócio, em qualquer município do Brasil, a descobrir quais verificações de endereço e quais licenças a atividade provavelmente exige e em que ordem procurar a prefeitura, a Vigilância Sanitária, os Bombeiros, o órgão ambiental e o conselho profissional, antes de alugar, reformar ou começar a vender.",
  "usuario": "Qualquer pessoa que vai formalizar ou já formalizou um pequeno negócio (MEI, ME ou EPP), de qualquer segmento, e não sabe se o CNPJ basta para funcionar, se pode trabalhar em casa ou quais órgãos procurar. Dúvidas típicas: \"Já sou MEI, então posso funcionar?\", \"Posso trabalhar em casa ou no apartamento?\", \"Preciso de alvará?\" e \"Aluguei o ponto; e agora?\".",
  "ter_em_maos": "Nada do que já foi respondido é perguntado de novo: a descrição da atividade, o CNPJ e o código CNAE vêm do Módulo 8, a cidade vem do Módulo 3 e a oferta vem do Módulo 1. O usuário precisa saber o tipo de local onde vai trabalhar (sem informar o endereço), ou como vai trabalhar se não tiver local fixo, a área aproximada do imóvel e se haverá público no local, gás (tipo, quantos botijões ou cilindros e onde vão ficar) ou outros produtos inflamáveis guardados, atividade ligada à saúde, profissional com registro em conselho, resíduos ou obra.",
  "entrega": "Um checklist de endereço e licenças, com o nível de risco provável, os órgãos a procurar com os links oficiais (inclusive o portal da consulta de viabilidade do seu estado), a situação de cada item (feito, a fazer, não se aplica ou a confirmar) e um próximo passo. O resumo mostra no máximo 3 alertas, 3 próximos passos e 1 encaminhamento.",
  "nao_faz": "Não afirma que a atividade está liberada ou dispensada: indica o nível de risco provável e manda confirmar. Não emite consulta de viabilidade, alvará ou licença, não faz o enquadramento definitivo de CNAE, risco ou tributação (Módulo 8) e não substitui prefeitura, Vigilância Sanitária, Bombeiros, órgão ambiental, conselho ou profissional habilitado. Também não pede endereço completo, CPF ou documentos.",
  "mensagem_limite": "O app oferece apoio educacional básico. As estimativas dependem dos dados fornecidos e não garantem resultados. Regras de registro, tributação, licenciamento e exercício profissional devem ser confirmadas em fontes oficiais e com profissionais habilitados."
 },
 "sem_local": {
  "texto": "O módulo não termina quando não há local: ele só pula as perguntas sobre o imóvel e segue para as perguntas sobre a atividade (conselho e meio ambiente). Nenhuma pergunta pulada some do resultado: ela aparece no checklist como 'não se aplica' ou 'a confirmar', com o motivo. 'Local fixo' quer dizer casa, apartamento, loja ou sala comercial, escolhido (M9-03) ou pretendido (M9-03b).",
  "tabela": [
   {
    "situacao": "Casa, apartamento, loja ou sala (escolhido em M9-03)",
    "aparecem": "Todas as que valem para o tipo de local",
    "puladas": "—",
    "checklist": "Itens conforme as respostas."
   },
   {
    "situacao": "Local pretendido (M9-03b = casa, apartamento ou loja)",
    "aparecem": "As mesmas do tipo pretendido, como planejamento",
    "puladas": "—",
    "checklist": "Itens conforme as respostas, como hipótese, com aviso para confirmar antes de alugar."
   },
   {
    "situacao": "Sem local fixo: internet, telefone ou casa ou empresa do cliente (M9-03a)",
    "aparecem": "M9-04 (endereço do registro), M9-10, M9-11, M9-13 e M9-14",
    "puladas": "M9-05 a M9-09 e M9-12",
    "checklist": "Itens do imóvel como 'não se aplica'; endereço do registro 'a confirmar' na prefeitura."
   },
   {
    "situacao": "Sem local fixo: rua, feira, evento, barraca, carrinho ou veículo (M9-03a)",
    "aparecem": "M9-04, M9-07 a M9-07c (gás no veículo, na banca ou no carrinho), M9-10, M9-11, M9-13 e M9-14",
    "puladas": "M9-05, M9-06, M9-08, M9-09 e M9-12",
    "checklist": "Público no local = sim. Itens: licença de ambulante ou permissão de uso, Vigilância Sanitária (com alimentos), Bombeiros (com gás) e Detran (veículo adaptado)."
   },
   {
    "situacao": "Local não definido (M9-03b = Ainda não faço ideia, ou M9-03a = Não sei)",
    "aparecem": "M9-04 como orientação, M9-10, M9-11, M9-13 e M9-14",
    "puladas": "M9-05 a M9-09 e M9-12",
    "checklist": "Itens do imóvel 'a confirmar' e alerta no resumo para voltar a esta etapa antes de alugar."
   }
  ]
 },
 "nao_sei": "Nas perguntas de sim ou não (M9-02, M9-04, M9-06, M9-07, M9-07c, M9-08, M9-10, M9-11 e M9-12) e nas de gás (M9-07a e M9-07b), a resposta 'Não sei' não passa direto. O app pede para a pessoa verificar se vai haver o que a pergunta trata (por exemplo, gás no local, clientes ou obra) e mostra um aviso de cuidado, marcado com ⚠, dizendo o que pode acontecer se houver e não for regularizado. A pessoa pode tocar em 'Já verifiquei' para voltar e responder, ou seguir sem responder: nesse caso, o item fica 'a confirmar' no checklist e entra nos alertas do resumo.",
 "resumo": {
  "cruzamentos": [
   {
    "quando": "M4-11 indicou atividade regulada e M9-02 = Não",
    "mensagem": "No Módulo 4 você indicou uma atividade com regras específicas. Quer rever esta resposta?",
    "forma": "Pergunta gentil"
   },
   {
    "quando": "M9-12 = Sim, obra que muda estrutura, área ou uso e M6-01 sem item de reforma",
    "mensagem": "A obra não aparece na lista do que você precisa para começar. Quer incluir?",
    "forma": "Pergunta gentil"
   },
   {
    "quando": "M9-03 = casa ou apartamento e M9-06 = Sim (qualquer número)",
    "mensagem": "Com público no local, as condições para trabalhar em casa podem mudar. Confirme na prefeitura.",
    "forma": "Atenção"
   },
   {
    "quando": "M9-03 = Ainda não escolhi e M8-02 = sem CNPJ",
    "mensagem": "Escolha o local depois da consulta de viabilidade.",
    "forma": "Dica"
   },
   {
    "quando": "M9-10 = Sim e M1-08 indica pouca experiência",
    "mensagem": "A atividade pede profissional habilitado. Quem será o responsável?",
    "forma": "Pergunta gentil"
   },
   {
    "quando": "M9-03a = rua, feira ou veículo e M9-02 = alimentos ou bebidas",
    "mensagem": "Venda de alimentos na rua ou em veículo passa pela Vigilância Sanitária, que pode exigir uma cozinha de apoio licenciada. Confirme na prefeitura.",
    "forma": "Atenção"
   },
   {
    "quando": "M9-07 = Vou vender gás de cozinha e M8-02 = sem CNPJ",
    "mensagem": "A revenda de gás só pode ser feita por empresa autorizada pela ANP. Abra a empresa e peça a autorização antes de vender.",
    "forma": "Atenção"
   },
   {
    "quando": "M9-07b = dentro de cômodo fechado e M9-06 = Sim (qualquer número)",
    "mensagem": "Com clientes no local, o gás em ambiente fechado pesa na vistoria dos Bombeiros. Veja se é possível levar o botijão para fora, em abrigo ventilado.",
    "forma": "Atenção"
   },
   {
    "quando": "M7-05 lista equipamento a gás e M9-07 = Não",
    "mensagem": "No Módulo 7 você indicou um equipamento a gás. Quer rever esta resposta?",
    "forma": "Pergunta gentil"
   }
  ],
  "proximos": [
   {
    "situacao": "M9-04 = Ainda não fiz ou Não sei",
    "mensagem": "Faça a consulta de viabilidade no portal do seu estado ([link do estado]) antes de alugar, reformar ou registrar."
   },
   {
    "situacao": "M9-04 = Sim, foi negada",
    "mensagem": "Procure a prefeitura para entender o motivo antes de gastar com o local."
   },
   {
    "situacao": "Há itens 'a confirmar' no checklist",
    "mensagem": "Leve o checklist à prefeitura ou à Sala do Empreendedor (onde houver) e confirme os itens marcados."
   },
   {
    "situacao": "Bloco do local pulado (M9-03b = Ainda não faço ideia ou M9-03a = Não sei)",
    "mensagem": "Escolha o local depois da consulta de viabilidade e volte a esta etapa antes de alugar ou assinar contrato."
   },
   {
    "situacao": "M9-03a = rua, feira ou veículo",
    "mensagem": "Peça na prefeitura a licença de ambulante ou a permissão de uso do espaço onde vai vender."
   },
   {
    "situacao": "M9-07 = Vou vender gás de cozinha",
    "mensagem": "Peça a autorização de revenda de GLP na ANP e a regularização nos Bombeiros antes de vender."
   },
   {
    "situacao": "M9-07a = 3 ou mais botijões ou cilindros P20/P45, ou M9-07b = cômodo fechado",
    "mensagem": "Fale com os Bombeiros ou com um profissional habilitado sobre o abrigo ou a central de gás antes de comprar ou instalar."
   },
   {
    "situacao": "Todos os itens confirmados",
    "mensagem": "Guarde os comprovantes (consulta, autorização do condomínio, licenças) em um só lugar."
   }
  ]
 },
 "instrumentos": [
  {
   "nome": "Base de CNAEs (compartilhada com o Módulo 8)",
   "mostra": "Código, descrição e nível de risco provável pela classificação federal (Resolução CGSIM 51/2019).",
   "regra": "Mantida pelo Grupo 9, com fonte e data. Usada pela busca guiada do Módulo 8. Avisa que estados e municípios podem ter lista própria.",
   "aviso": "Classificação provável. Confirme na prefeitura."
  },
  {
   "nome": "Nível de risco provável",
   "mostra": "Nível I, II ou III, a partir do código principal e dos secundários.",
   "regra": "Regra proposta: vale o maior nível entre os códigos (a confirmar com o grupo). Calculado pela classificação federal; o app avisa que o município pode classificar de outra forma.",
   "aviso": "Nível provável, não oficial."
  },
  {
   "nome": "Checklist de endereço e licenças",
   "mostra": "Itens na ordem: consulta de viabilidade · condições do local (área, público, condomínio) · gás (tipo, quantidade e onde fica) e inflamáveis · Bombeiros · Vigilância Sanitária · uso de espaço público (ambulante) · conselho profissional · meio ambiente · obra. Cada item com órgão, link oficial e situação (feito, a fazer, não se aplica, a confirmar).",
   "regra": "Cada resposta acende ou apaga itens. Itens com 'Não sei' ficam como 'a confirmar' e levam o aviso de cuidado. Perguntas puladas por falta de local ficam 'não se aplica' (sem local fixo) ou 'a confirmar' (local ainda não definido).",
   "aviso": "Orientação a confirmar. Não substitui a resposta dos órgãos."
  },
  {
   "nome": "Lista de órgãos",
   "mostra": "Prefeitura e portal da Redesim ou Junta Comercial do estado, Vigilância Sanitária, Bombeiros, órgão ambiental, conselho profissional, condomínio, ANP (revenda de gás) e Detran (veículo adaptado).",
   "regra": "Mostra só os órgãos acesos pelo checklist, com link oficial e data de conferência.",
   "aviso": "Links conferidos em [data]."
  },
  {
   "nome": "Linha-resumo do Módulo 9",
   "mostra": "Uma linha com o que já é fato, o que ainda é hipótese e o que falta. Ex.: \"Viabilidade aprovada (fato); nível de risco provável II (hipótese); 3 itens a confirmar no checklist (falta).\"",
   "regra": "Usa a situação de cada dado (tabela abaixo). Itens com \"Não sei\" contam como hipótese.",
   "aviso": "Resumo com as suas respostas. Não é autorização nem garantia."
  }
 ],
 "situacao_dados": [
  {
   "dado": "Estado e cidade",
   "origem": "M9-01; M3-08",
   "fato": "Estado informado",
   "hipotese": "Não sei",
   "falta": "Definir onde o negócio vai funcionar"
  },
  {
   "dado": "Tipo de local",
   "origem": "M9-03; M9-03a; M9-03b",
   "fato": "Casa, apartamento, loja ou sem local fixo (com a forma de trabalho)",
   "hipotese": "Local pretendido (M9-03b) / Ainda não faço ideia / Não sei",
   "falta": "Escolher o local depois da consulta de viabilidade"
  },
  {
   "dado": "Consulta de viabilidade",
   "origem": "M9-04",
   "fato": "Aprovada ou negada (com comprovante)",
   "hipotese": "Ainda não fiz / Não sei",
   "falta": "Fazer a consulta no portal do estado"
  },
  {
   "dado": "Nível de risco",
   "origem": "Instrumento; M8-04",
   "fato": "—",
   "hipotese": "Sempre \"provável\" até a prefeitura confirmar",
   "falta": "Confirmar na consulta de viabilidade"
  },
  {
   "dado": "Condições do local (área, público, gás, inflamáveis, condomínio, espaço)",
   "origem": "M9-05 a M9-09 (gás: M9-07 a M9-07c)",
   "fato": "Resposta informada, ou 'não se aplica' quando não há local fixo",
   "hipotese": "Não sei / respostas sobre o local pretendido / perguntas puladas porque o local não foi definido",
   "falta": "Confirmar na prefeitura, nos Bombeiros, no condomínio ou na ANP (revenda de gás)"
  },
  {
   "dado": "Interesse sanitário, conselho, meio ambiente, obra",
   "origem": "M9-02, M9-10 a M9-12",
   "fato": "Sim ou Não",
   "hipotese": "Não sei",
   "falta": "Confirmar no órgão indicado no checklist"
  },
  {
   "dado": "Licenças do checklist",
   "origem": "Checklist",
   "fato": "Item marcado como feito",
   "hipotese": "A fazer / a confirmar",
   "falta": "Itens pendentes seguem como prioridades do plano de ação"
  }
 ],
 "pedidos_ia": [
  {
   "pedido": "Perguntas para a prefeitura",
   "texto": "Sou um pequeno empreendedor em [município/UF] e quero [descrição do Módulo 8]. Liste os tipos de licença e os órgãos que costumam estar envolvidos e as perguntas que devo fazer à prefeitura. Não afirme que estou dispensado de nada e indique, para cada item, onde confirmar em fonte oficial.",
   "conferir": "Confira cada item no portal da Redesim do seu estado, no site da prefeitura e no do órgão citado. Descarte regras sem fonte oficial ou de outra cidade.",
   "obs": "Sem nome do negócio, endereço ou CPF. A cidade entra no pedido porque a regra é local."
  }
 ],
 "viabilidade": {
  "fonte": "Fonte: gov.br/Redesim – Consulta prévia de viabilidade, https://www.gov.br/empresas-e-negocios/pt-br/redesim/abrir-cnpj/viabilidade, consulta em 15/10/2026.",
  "geral": "https://www.gov.br/empresas-e-negocios/pt-br/redesim/abrir-cnpj/viabilidade",
  "data": "15/10/2026",
  "estados": [
   {
    "estado": "Acre",
    "link": "https://integrar.ac.gov.br/viabilidade"
   },
   {
    "estado": "Alagoas",
    "link": "https://www.facilita.al.gov.br"
   },
   {
    "estado": "Amapá",
    "link": "https://portalservicos.jucap.ap.gov.br/viabilidade"
   },
   {
    "estado": "Amazonas",
    "link": "https://portalservicos.jucea.am.gov.br/viabilidade"
   },
   {
    "estado": "Bahia",
    "link": "https://regin.juceb.ba.gov.br/regin.externo/ViabilidadeOpcaoV4.aspx"
   },
   {
    "estado": "Ceará",
    "link": "https://portalservicos.jucec.ce.gov.br/viabilidade"
   },
   {
    "estado": "Distrito Federal",
    "link": "https://portalservicos.jucis.df.gov.br/viabilidade"
   },
   {
    "estado": "Espírito Santo",
    "link": "https://www.simplifica.es.gov.br"
   },
   {
    "estado": "Goiás",
    "link": "https://www.portaldoempreendedorgoiano.go.gov.br"
   },
   {
    "estado": "Maranhão",
    "link": "https://www.empresafacil.ma.gov.br"
   },
   {
    "estado": "Mato Grosso",
    "link": "https://portalservicos.jucemat.mt.gov.br/viabilidade"
   },
   {
    "estado": "Mato Grosso do Sul",
    "link": "https://portalservicos.jucems.ms.gov.br/viabilidade"
   },
   {
    "estado": "Minas Gerais",
    "link": "https://portalservicos.jucemg.mg.gov.br"
   },
   {
    "estado": "Pará",
    "link": "https://regin.jucepa.pa.gov.br/regin.externo/ViabilidadeOpcaoV4.aspx"
   },
   {
    "estado": "Paraíba",
    "link": "https://www.redesim.pb.gov.br"
   },
   {
    "estado": "Paraná",
    "link": "https://www.empresafacil.pr.gov.br"
   },
   {
    "estado": "Pernambuco",
    "link": "https://redesim.jucepe.pe.gov.br/regin.externo/ViabilidadeOpcaoV4.aspx"
   },
   {
    "estado": "Piauí",
    "link": "https://www.piauidigital.pi.gov.br"
   },
   {
    "estado": "Rio de Janeiro",
    "link": "https://registro.rcpj-rj.com.br/regin.externo/ViabilidadeOpcaoV4.aspx"
   },
   {
    "estado": "Rio Grande do Norte",
    "link": "https://www.redesim.rn.gov.br"
   },
   {
    "estado": "Rio Grande do Sul",
    "link": "https://portalservicos.jucisrs.rs.gov.br/viabilidade"
   },
   {
    "estado": "Rondônia",
    "link": "https://www.empresafacil.ro.gov.br"
   },
   {
    "estado": "Roraima",
    "link": "https://projetointegrar.jucerr.rr.gov.br/viabilidade"
   },
   {
    "estado": "Santa Catarina",
    "link": "https://regin.jucesc.sc.gov.br/regin.externo/ViabilidadeOpcaoV4.aspx"
   },
   {
    "estado": "São Paulo",
    "link": "https://vreredesim.sp.gov.br"
   },
   {
    "estado": "Sergipe",
    "link": "https://www.agiliza.se.gov.br"
   },
   {
    "estado": "Tocantins",
    "link": "https://www.simplifica.to.gov.br"
   }
  ]
 },
 "base": [
  {
   "codigo": "M9.BT01",
   "conceito": "Ato público de liberação",
   "definicao": "Nome geral dado na lei a licença, alvará, autorização, inscrição, registro e outros documentos que o poder público exige para alguém exercer uma atividade econômica.",
   "fonte": "Lei 13.874/2019, art. 1º, § 6º. https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2019/lei/l13874.htm (consulta em 01/10/2026)",
   "link": "https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2019/lei/l13874.htm",
   "data": "01/10/2026",
   "referencia": "Lei 13.874/2019, art. 1º, § 6º."
  },
  {
   "codigo": "M9.BT02",
   "conceito": "Classificação de risco da atividade",
   "definicao": "A atividade é classificada em nível I (baixo risco: dispensa os atos públicos de liberação), nível II (médio risco: licença provisória logo após o registro, com vistoria depois) ou nível III (alto risco: vistoria ou análise antes de funcionar).",
   "fonte": "Resolução CGSIM 51/2019, art. 2º (alterada pelas Res. 57/2020 e 68/2022). https://www.gov.br/empresas-e-negocios/pt-br/drei/cgsim/resolucoes-cgsim/arquivos/resolucao51alteradapela68.pdf (consulta em 01/10/2026)",
   "link": "https://www.gov.br/empresas-e-negocios/pt-br/drei/cgsim/resolucoes-cgsim/arquivos/resolucao51alteradapela68.pdf",
   "data": "01/10/2026",
   "referencia": "Resolução CGSIM 51/2019, art. 2º (alterada pelas Res. 57/2020 e 68/2022)."
  },
  {
   "codigo": "M9.BT03",
   "conceito": "CNAE (Classificação Nacional de Atividades Econômicas)",
   "definicao": "Código oficial que identifica cada atividade econômica (formato 0000-0/00). A empresa informa uma atividade principal e pode ter secundárias; os códigos constam no cartão CNPJ e no CCMEI.",
   "fonte": "IBGE/CONCLA – Classificação Nacional de Atividades Econômicas. https://concla.ibge.gov.br/ (consulta em 01/10/2026)",
   "link": "https://concla.ibge.gov.br/",
   "data": "01/10/2026",
   "referencia": "IBGE/CONCLA – Classificação Nacional de Atividades Econômicas."
  },
  {
   "codigo": "M9.BT04",
   "conceito": "Classificação de risco no seu município",
   "definicao": "Estados e municípios podem ter uma lista própria que classifica cada CNAE em baixo, médio ou alto risco. Quando não têm, vale a classificação federal (Resolução CGSIM 51/2019). Quando a empresa tem mais de uma atividade, em geral vale a de maior risco.",
   "fonte": "Lei 13.874/2019, art. 3º, § 1º; Resolução CGSIM 51/2019. https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2019/lei/l13874.htm (consulta em 15/10/2026)",
   "link": "https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2019/lei/l13874.htm",
   "data": "15/10/2026",
   "referencia": "Lei 13.874/2019, art. 3º, § 1º; Resolução CGSIM 51/2019."
  },
  {
   "codigo": "M9.BT05",
   "conceito": "Consulta prévia de viabilidade",
   "definicao": "Pedido feito antes do registro (ou da mudança de endereço) para a prefeitura dizer se a atividade pode funcionar naquele endereço, e para a Junta Comercial verificar o nome empresarial. É feita pela internet, no portal da Redesim ou da Junta Comercial de cada estado (links na tabela que acompanha a regra M9.R01). Em muitos municípios, a resposta já informa se a atividade de baixo risco está dispensada.",
   "fonte": "gov.br/Redesim – Consulta prévia de viabilidade. https://www.gov.br/empresas-e-negocios/pt-br/redesim/abrir-cnpj/viabilidade (consulta em 15/10/2026)",
   "link": "https://www.gov.br/empresas-e-negocios/pt-br/redesim/abrir-cnpj/viabilidade",
   "data": "15/10/2026",
   "referencia": "gov.br/Redesim – Consulta prévia de viabilidade."
  },
  {
   "codigo": "M9.BT06",
   "conceito": "Licença provisória (nível II, médio risco)",
   "definicao": "Na atividade de médio risco, a licença costuma ser emitida logo após o registro, de forma provisória, com base em declaração do empreendedor de que cumpre as exigências; a vistoria acontece depois. O nome do documento, o prazo de validade e as condições variam conforme o município.",
   "fonte": "Resolução CGSIM 51/2019, art. 2º (alt. 57/2020 e 68/2022). https://www.gov.br/empresas-e-negocios/pt-br/drei/cgsim/resolucoes-cgsim/arquivos/resolucao51alteradapela68.pdf (consulta em 01/10/2026)",
   "link": "https://www.gov.br/empresas-e-negocios/pt-br/drei/cgsim/resolucoes-cgsim/arquivos/resolucao51alteradapela68.pdf",
   "data": "01/10/2026",
   "referencia": "Resolução CGSIM 51/2019, art. 2º (alt. 57/2020 e 68/2022)."
  },
  {
   "codigo": "M9.BT07",
   "conceito": "Dispensa não é isenção de regras",
   "definicao": "Mesmo quando dispensada de alvará, a atividade continua obrigada a seguir zoneamento, normas sanitárias, ambientais, de segurança e de posturas, e pode ser fiscalizada depois. Também continuam valendo as regras de obra e de regularização do imóvel.",
   "fonte": "Lei 13.874/2019, art. 3º, I e § 2º. https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2019/lei/l13874.htm (consulta em 15/10/2026)",
   "link": "https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2019/lei/l13874.htm",
   "data": "15/10/2026",
   "referencia": "Lei 13.874/2019, art. 3º, I e § 2º."
  },
  {
   "codigo": "M9.BT08",
   "conceito": "Atividade na residência",
   "definicao": "O MEI pode usar a residência como sede do negócio quando a atividade não exigir local próprio (LC 123/2006, art. 18-A, § 25). Atividades de baixo risco também podem ser exercidas em imóvel próprio, ou de terceiros com autorização, sem alvará (Lei 13.874/2019, art. 3º, I). O município pode impor condições, como zoneamento, área máxima e limites de público, gás e inflamáveis.",
   "fonte": "LC 123/2006, art. 18-A, § 25 (incl. pela LC 154/2016); Lei 13.874/2019, art. 3º, I. https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp123.htm (consulta em 15/10/2026)",
   "link": "https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp123.htm",
   "data": "15/10/2026",
   "referencia": "LC 123/2006, art. 18-A, § 25 (incl. pela LC 154/2016); Lei 13.874/2019, art. 3º, I."
  },
  {
   "codigo": "M9.BT09",
   "conceito": "Atividade em condomínio residencial",
   "definicao": "Em prédio ou condomínio, o condômino deve respeitar a destinação da edificação (Código Civil, art. 1.336, IV), e a convenção pode proibir ou limitar atividades comerciais. Alguns municípios também exigem autorização do condomínio, registrada em ata de assembleia.",
   "fonte": "Código Civil, art. 1.336, IV. https://www.planalto.gov.br/ccivil_03/leis/2002/l10406compilada.htm (consulta em 15/10/2026)",
   "link": "https://www.planalto.gov.br/ccivil_03/leis/2002/l10406compilada.htm",
   "data": "15/10/2026",
   "referencia": "Código Civil, art. 1.336, IV."
  },
  {
   "codigo": "M9.BT10",
   "conceito": "MEI e dispensa de alvará",
   "definicao": "O MEI recebe o CCMEI com o Termo de Ciência e Responsabilidade com efeito de dispensa de alvará e licença de funcionamento (Res. CGSIM 59/2020). A dispensa não afasta as regras sanitárias, ambientais, de segurança e de uso do solo, nem a fiscalização.",
   "fonte": "Sebrae-SC, \"Tire suas dúvidas sobre as novas resoluções do MEI\" (Res. CGSIM 59/2020). https://www.sebrae-sc.com.br/blog/tire-suas-duvidas-sobre-as-novas-resolucoes-do-mei (consulta em 01/10/2026)",
   "link": "https://www.sebrae-sc.com.br/blog/tire-suas-duvidas-sobre-as-novas-resolucoes-do-mei",
   "data": "01/10/2026",
   "referencia": "Sebrae-SC, \"Tire suas dúvidas sobre as novas resoluções do MEI\" (Res. CGSIM 59/2020)."
  },
  {
   "codigo": "M9.BT11",
   "conceito": "Licença sanitária e risco sanitário",
   "definicao": "Atividades de interesse à saúde (alimentos, beleza, saúde, cosméticos, animais etc.) passam pela Vigilância Sanitária. A Anvisa, os estados e os municípios classificam o risco sanitário: nível I dispensa licença, mas segue as normas; nível II tem licenciamento simplificado, com vistoria posterior; nível III tem inspeção prévia. Em geral, quem licencia é o município.",
   "fonte": "Anvisa RDC 153/2017 (alt. RDC 418/2020) e IN 66/2020. https://anvisalegis.datalegis.net/action/ActionDatalegis.php?acao=abrirTextoAto&link=S&tipo=RDC&numeroAto=00000153&seqAto=000&valorAno=2017&orgao=RDC/DC/ANVISA/MS&cod_modulo=310&cod_menu=9431 (consulta em 01/10/2026)",
   "link": "https://anvisalegis.datalegis.net/action/ActionDatalegis.php?acao=abrirTextoAto&link=S&tipo=RDC&numeroAto=00000153&seqAto=000&valorAno=2017&orgao=RDC/DC/ANVISA/MS&cod_modulo=310&cod_menu=9431",
   "data": "01/10/2026",
   "referencia": "Anvisa RDC 153/2017 (alt. RDC 418/2020) e IN 66/2020."
  },
  {
   "codigo": "M9.BT12",
   "conceito": "Atividade de interesse sanitário",
   "definicao": "Atividade que pode afetar a saúde de quem compra ou é atendido: alimentos e bebidas; cosméticos, saneantes, medicamentos e produtos para a saúde; procedimentos no corpo (beleza, estética, tatuagem, saúde); cuidado com pessoas; animais. Cada tipo tem normas técnicas próprias da Anvisa e do município, e o risco sanitário é classificado por CNAE.",
   "fonte": "Anvisa IN 66/2020 (classificação de risco por CNAE) e RDC 216/2004 (exemplo de norma setorial). https://anvisalegis.datalegis.net/action/ActionDatalegis.php?acao=abrirTextoAto&link=S&tipo=INM&numeroAto=00000066&seqAto=000&valorAno=2020&orgao=DC/ANVISA/MS&cod_modulo=310&cod_menu=9431 (consulta em 01/10/2026)",
   "link": "https://anvisalegis.datalegis.net/action/ActionDatalegis.php?acao=abrirTextoAto&link=S&tipo=INM&numeroAto=00000066&seqAto=000&valorAno=2020&orgao=DC/ANVISA/MS&cod_modulo=310&cod_menu=9431",
   "data": "01/10/2026",
   "referencia": "Anvisa IN 66/2020 (classificação de risco por CNAE) e RDC 216/2004 (exemplo de norma setorial)."
  },
  {
   "codigo": "M9.BT13",
   "conceito": "Atividade de interesse sanitário em casa",
   "definicao": "A Vigilância Sanitária pode regularizar atividades do MEI, do empreendimento familiar rural e da economia solidária exercidas na residência, conforme o risco sanitário, desde que o empreendedor aceite a inspeção do local. Na prática, costuma-se exigir área de trabalho separada da moradia e utensílios e equipamentos exclusivos; as condições exatas dependem das normas do município e do estado.",
   "fonte": "Anvisa RDC 49/2013, arts. 10 e 12. https://www.saude.pr.gov.br/sites/default/arquivos_restritos/files/documento/2020-04/rdc49.pdf (consulta em 15/10/2026)",
   "link": "https://www.saude.pr.gov.br/sites/default/arquivos_restritos/files/documento/2020-04/rdc49.pdf",
   "data": "15/10/2026",
   "referencia": "Anvisa RDC 49/2013, arts. 10 e 12."
  },
  {
   "codigo": "M9.BT14",
   "conceito": "Licenciamento no Corpo de Bombeiros",
   "definicao": "Cada estado tem o seu Corpo de Bombeiros Militar, que analisa, vistoria e fiscaliza as medidas de prevenção e combate a incêndio, e o alvará da prefeitura depende do laudo dos Bombeiros. Os documentos (dispensa, certificado, AVCB ou equivalente) e os critérios (área, lotação, gás, inflamáveis) variam de estado para estado; em muitos, o pedido é feito pelo portal da Redesim.",
   "fonte": "Lei 13.425/2017, arts. 3º e 4º. https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2017/lei/l13425.htm (consulta em 15/10/2026)",
   "link": "https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2017/lei/l13425.htm",
   "data": "15/10/2026",
   "referencia": "Lei 13.425/2017, arts. 3º e 4º."
  },
  {
   "codigo": "M9.BT15",
   "conceito": "Licenciamento ambiental",
   "definicao": "Exigido para atividades que usam recursos ambientais ou podem poluir (efluentes, emissões, ruído, resíduos perigosos). O município licencia as atividades de impacto local, e o estado, as demais (LC 140/2011). A lei geral federal de licenciamento é a 15.190/2025.",
   "fonte": "LC 140/2011, arts. 8º e 9º; Lei 15.190/2025. https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp140.htm (consulta em 15/10/2026)",
   "link": "https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp140.htm",
   "data": "15/10/2026",
   "referencia": "LC 140/2011, arts. 8º e 9º; Lei 15.190/2025."
  },
  {
   "codigo": "M9.BT16",
   "conceito": "Conselho profissional e responsável técnico",
   "definicao": "Empresas são registradas no conselho da profissão ligada à sua atividade básica. Algumas atividades só podem funcionar com profissional habilitado como responsável técnico (RT).",
   "fonte": "Lei 6.839/1980, art. 1º. https://www.planalto.gov.br/ccivil_03/leis/l6839.htm (consulta em 01/10/2026)",
   "link": "https://www.planalto.gov.br/ccivil_03/leis/l6839.htm",
   "data": "01/10/2026",
   "referencia": "Lei 6.839/1980, art. 1º."
  },
  {
   "codigo": "M9.BT17",
   "conceito": "Zoneamento e uso do solo",
   "definicao": "Regras municipais (plano diretor e lei de uso e ocupação do solo) que dizem quais usos são permitidos em cada área da cidade. A consulta de viabilidade verifica isso para o endereço informado.",
   "fonte": "Lei 10.257/2001 (Estatuto da Cidade); lei de uso e ocupação do solo do município. https://www.planalto.gov.br/ccivil_03/leis/leis_2001/l10257.htm (consulta em 15/10/2026)",
   "link": "https://www.planalto.gov.br/ccivil_03/leis/leis_2001/l10257.htm",
   "data": "15/10/2026",
   "referencia": "Lei 10.257/2001 (Estatuto da Cidade); lei de uso e ocupação do solo do município."
  },
  {
   "codigo": "M9.BT18",
   "conceito": "Prazo de resposta e aprovação tácita",
   "definicao": "A Lei de Liberdade Econômica garante que o empreendedor seja informado do prazo máximo de análise do seu pedido. Nas liberações federais, se o prazo vencer sem resposta, há aprovação tácita. Em estados e municípios, essa aprovação tácita só vale quando o próprio ente adota a regra ou nos casos previstos na lei, e não vale, por exemplo, para atividades com impacto ambiental significativo.",
   "fonte": "Lei 13.874/2019, art. 1º, § 5º, e art. 3º, IX e §§ 6º e 12. https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2019/lei/l13874.htm (consulta em 15/10/2026)",
   "link": "https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2019/lei/l13874.htm",
   "data": "15/10/2026",
   "referencia": "Lei 13.874/2019, art. 1º, § 5º, e art. 3º, IX e §§ 6º e 12."
  },
  {
   "codigo": "M9.BT19",
   "conceito": "Pequenas reformas e alvará de obra",
   "definicao": "Muitos municípios dispensam alvará de obra para pequenas reformas (pintura, troca de piso, reparos elétricos e hidráulicos) que não alteram estrutura, área ou uso. Obras que mudam estrutura, área ou uso exigem licença da prefeitura e profissional habilitado, com ART (engenharia) ou RRT (arquitetura).",
   "fonte": "Lei 6.496/1977 (ART) e Lei 12.378/2010 (RRT); código de obras do município. https://www.planalto.gov.br/ccivil_03/leis/l6496.htm (consulta em 15/10/2026)",
   "link": "https://www.planalto.gov.br/ccivil_03/leis/l6496.htm",
   "data": "15/10/2026",
   "referencia": "Lei 6.496/1977 (ART) e Lei 12.378/2010 (RRT); código de obras do município."
  },
  {
   "codigo": "M9.BT20",
   "conceito": "Redesim",
   "definicao": "Rede que integra Juntas Comerciais, Receita, prefeituras e órgãos licenciadores para simplificar abertura, alteração e licenciamento de empresas. Em cada estado, o acesso é pelo portal da Junta Comercial ou da Redesim estadual.",
   "fonte": "Lei 11.598/2007; gov.br/Redesim. https://www.planalto.gov.br/ccivil_03/_ato2007-2010/2007/lei/l11598.htm (consulta em 01/10/2026)",
   "link": "https://www.planalto.gov.br/ccivil_03/_ato2007-2010/2007/lei/l11598.htm",
   "data": "01/10/2026",
   "referencia": "Lei 11.598/2007; gov.br/Redesim."
  },
  {
   "codigo": "M9.BT21",
   "conceito": "Gás de cozinha (GLP) no local",
   "definicao": "O uso e a guarda de botijões e cilindros de GLP seguem a norma de gás do Corpo de Bombeiros de cada estado e as normas da ABNT (NBR 13523, central de gás; NBR 15526, rede interna; NBR 13103, ventilação dos aparelhos). Os limites mudam de estado para estado. No Rio de Janeiro, a cartilha dos Bombeiros usa como referência um botijão instalado e um de reserva, ou uma central com até dois cilindros de 45 kg, e orienta deixar os botijões no térreo, do lado de fora e em área ventilada. No Paraná, a norma em revisão separa nichos (até 45 kg), abrigos (até 90 kg) e centrais (acima de 90 kg). Instalações maiores pedem projeto e ART ou RRT.",
   "fonte": "CBMERJ, Nota Técnica 3-02:2023 (Gás GLP/GN) e cartilha sobre gás. https://www.cbmerj.rj.gov.br/wp-content/uploads/2024/05/NT3-02_2Edio_2023.pdf (consulta em 30/10/2026)",
   "link": "https://www.cbmerj.rj.gov.br/wp-content/uploads/2024/05/NT3-02_2Edio_2023.pdf",
   "data": "30/10/2026",
   "referencia": "CBMERJ, Nota Técnica 3-02:2023 (Gás GLP/GN) e cartilha sobre gás."
  },
  {
   "codigo": "M9.BT22",
   "conceito": "Revenda de gás de cozinha (GLP)",
   "definicao": "A revenda de GLP só pode ser feita por pessoa jurídica com autorização da ANP, em estabelecimento chamado ponto de revenda de GLP; o pedido é feito pelo sistema da ANP. A quantidade guardada segue a classe autorizada e a ABNT NBR 15514. A Resolução ANP 958/2023 substituiu a Resolução 51/2016.",
   "fonte": "Resolução ANP 958/2023, arts. 3º e 4º. https://www.lex.com.br/resolucao-anp-no-958-de-5-de-outubro-de-2023/ (consulta em 30/10/2026)",
   "link": "https://www.lex.com.br/resolucao-anp-no-958-de-5-de-outubro-de-2023/",
   "data": "30/10/2026",
   "referencia": "Resolução ANP 958/2023, arts. 3º e 4º."
  },
  {
   "codigo": "M9.BT23",
   "conceito": "Trabalho sem local fixo e comércio ambulante",
   "definicao": "Vender em via pública depende de licença ou permissão da prefeitura (licença de ambulante ou termo de permissão de uso). Barracas e food trucks de alimentos passam pela Vigilância Sanitária, o veículo adaptado é regularizado no Detran e o gás segue as regras dos Bombeiros. Algumas prefeituras exigem uma cozinha de apoio licenciada. As regras são municipais e mudam de cidade para cidade.",
   "fonte": "Sebrae, Série Como Montar – Food Truck. https://sebrae.com.br/Sebrae/Portal%20Sebrae/UFs/BA/Anexos/E-book_404_AF28_2019_SerieComoMontar_Food_Truck_FINALIZADO.pdf (consulta em 30/10/2026)",
   "link": "https://sebrae.com.br/Sebrae/Portal%20Sebrae/UFs/BA/Anexos/E-book_404_AF28_2019_SerieComoMontar_Food_Truck_FINALIZADO.pdf",
   "data": "30/10/2026",
   "referencia": "Sebrae, Série Como Montar – Food Truck."
  }
 ],
 "conexoes": [
  {
   "modulo": "1",
   "nome": "Perfil do empreendedor e definição da ideia",
   "recebe": "Oferta e tipo (M1-01, M1-02), recursos e espaço (M1-10, M1-10a) e experiência (M1-08)",
   "envia": "Restrições de local que podem mudar a ideia",
   "obs": "O tipo substitui a antiga pergunta 6"
  },
  {
   "modulo": "3",
   "nome": "Mercado, concorrentes e oportunidades",
   "recebe": "Cidade (M3-08), que pré-preenche o estado em M9-01",
   "envia": "—",
   "obs": "Ajuste: guardar a cidade em campo próprio (prioridade média)"
  },
  {
   "modulo": "4",
   "nome": "Produto, proposta de valor e teste da ideia",
   "recebe": "Forma de entrega (M4-06) e atividade regulada (M4-11)",
   "envia": "Alerta: atividade de interesse sanitário não deve atender ao público sem as licenças, nem em teste",
   "obs": "Ajustes: M4-11 com as mesmas categorias de M9-02 (alta); M4-06 guardar se o atendimento é só fora ou on-line (média)"
  },
  {
   "modulo": "6",
   "nome": "Investimento, capital de giro e fluxo de caixa",
   "recebe": "Itens do investimento (M6-01)",
   "envia": "Obra ou reforma (M9-12) para cruzar com o investimento",
   "obs": "Ajuste: garantir a categoria 'instalações e reforma' em M6-01 (média)"
  },
  {
   "modulo": "7",
   "nome": "Operação, fornecedores, capacidade e qualidade",
   "recebe": "Equipamentos e mapa do processo (M7-05, M7-01), inclusive equipamentos a gás, e validade curta (M7-08)",
   "envia": "Checklist do M9 como destino do item \"atividade regulada\"",
   "obs": "Ajuste: o checklist de riscos do M7 aponta para o checklist do M9 (média)"
  },
  {
   "modulo": "8",
   "nome": "Formalização, enquadramento e tributação básica",
   "recebe": "Descrição, CNPJ e código (M8-01, M8-02, M8-04) e ideias para depois (M8-09)",
   "envia": "Base de CNAEs com nível de risco provável, usada na busca guiada (M8-04a)",
   "obs": "Ajuste: combinar quem mantém a base compartilhada (alta). Substitui as antigas perguntas 2 a 5"
  },
  {
   "modulo": "10",
   "nome": "Comunicação, vendas, pessoas e plano de ação",
   "recebe": "—",
   "envia": "Estado e cidade, local e viabilidade, nível de risco provável, itens pendentes do checklist, ideias e lacunas",
   "obs": "Cada dado é guardado uma vez"
  }
 ],
 "fases": [
  "Onde",
  "O local",
  "Cuidados da atividade",
  "Fechamento"
 ],
 "perguntas": [
  {
   "codigo": "M9-01",
   "fase": "Onde",
   "pergunta": "Em que estado você está?",
   "descobre": "Estado (UF)",
   "aparece": "Sempre (pré-preenchido pela cidade do Módulo 3)",
   "caminhos": [
    {
     "opcao": "Um dos 26 estados ou o Distrito Federal",
     "opcoes": [],
     "texto": "As regras locais mudam de cidade para cidade. O checklist vai mostrar o link da consulta de viabilidade de [estado] e o que perguntar à sua prefeitura.",
     "regra": "Seguir para M9-02."
    },
    {
     "opcao": "Não sei",
     "opcoes": [
      "Não sei"
     ],
     "texto": "Se ainda não decidiu onde vai abrir, use as orientações gerais e volte aqui quando decidir. Portais de todos os estados: https://www.gov.br/empresas-e-negocios/pt-br/redesim/abrir-cnpj/viabilidade",
     "regra": "Não bloquear; seguir."
    }
   ]
  },
  {
   "codigo": "M9-02",
   "fase": "Onde",
   "pergunta": "O que você vende ou faz pode afetar a saúde de quem compra ou é atendido?",
   "descobre": "Interesse sanitário",
   "aparece": "Sempre (pré-marcado por M4-11)",
   "caminhos": [
    {
     "opcao": "Sim, alimentos ou bebidas / cosméticos, saneantes, medicamentos ou produtos para a saúde / procedimentos no corpo ou cuidado com pessoas / animais",
     "opcoes": [
      "Sim, alimentos ou bebidas",
      "Sim, cosméticos, saneantes, medicamentos ou produtos para a saúde",
      "Sim, procedimentos no corpo ou cuidado com pessoas",
      "Sim, animais"
     ],
     "texto": "Nesses casos, a Vigilância Sanitária faz parte do caminho, mesmo para MEI. O checklist mostra o que confirmar.",
     "regra": "Seguir para M9-03."
    },
    {
     "opcao": "Não",
     "opcoes": [
      "Não"
     ],
     "texto": "Anotado.",
     "regra": "Seguir para M9-03."
    },
    {
     "opcao": "Não sei",
     "opcoes": [
      "Não sei"
     ],
     "texto": "Verifique se alguém come, bebe, passa no corpo, usa como remédio ou recebe um cuidado por causa do que você vende ou faz. ⚠ Atenção: se houver, a Vigilância Sanitária faz parte do caminho, mesmo para MEI, e funcionar sem a licença pode gerar multa ou interdição.",
     "regra": "Mostrar o aviso com o botão 'Já verifiquei' (volta à pergunta). Se seguir sem responder, o item fica 'a confirmar' e entra nos alertas do resumo. Seguir para M9-03."
    }
   ]
  },
  {
   "codigo": "M9-03",
   "fase": "Onde",
   "pergunta": "Onde a atividade vai funcionar?",
   "descobre": "Tipo de local",
   "aparece": "Sempre",
   "caminhos": [
    {
     "opcao": "Na minha casa / Em apartamento ou condomínio residencial",
     "opcoes": [
      "Na minha casa",
      "Em apartamento ou condomínio residencial"
     ],
     "texto": "Vamos ver as condições para trabalhar em casa.",
     "regra": "Seguir para M9-04."
    },
    {
     "opcao": "Em loja ou sala comercial",
     "opcoes": [
      "Em loja ou sala comercial"
     ],
     "texto": "Vamos ver o que conferir antes de alugar ou usar o ponto.",
     "regra": "Seguir para M9-04."
    },
    {
     "opcao": "Sem local fixo (digital, na casa do cliente ou ambulante)",
     "opcoes": [
      "Sem local fixo (digital, na casa do cliente ou ambulante)"
     ],
     "texto": "Mesmo sem local fixo, o registro costuma pedir um endereço. Confirme na prefeitura qual endereço usar.",
     "regra": "Seguir para M9-03a."
    },
    {
     "opcao": "Ainda não escolhi",
     "opcoes": [
      "Ainda não escolhi"
     ],
     "texto": "Antes de alugar ou comprar um ponto, faça a consulta de viabilidade. Ela diz se a atividade pode funcionar ali.",
     "regra": "Seguir para M9-03b."
    },
    {
     "opcao": "Não sei",
     "opcoes": [
      "Não sei"
     ],
     "texto": "Pense onde você vai produzir, guardar ou atender.",
     "regra": "Seguir para M9-03b."
    }
   ]
  },
  {
   "codigo": "M9-03a",
   "fase": "Onde",
   "pergunta": "Como você vai trabalhar sem local fixo?",
   "descobre": "Forma de trabalho",
   "aparece": "Se M9-03 = Sem local fixo",
   "caminhos": [
    {
     "opcao": "Só pela internet ou por telefone / Na casa ou na empresa do cliente",
     "opcoes": [
      "Só pela internet ou por telefone",
      "Na casa ou na empresa do cliente"
     ],
     "texto": "Como não haverá local fixo, as perguntas sobre o imóvel (área, público, gás, condomínio, espaço e obra) não se aplicam e serão puladas. O registro ainda pede um endereço, em geral o da sua residência: confirme na prefeitura se a atividade pode ser registrada nele.",
     "regra": "Pular M9-05 a M9-09 e M9-12 (itens 'não se aplica'). Seguir para M9-04."
    },
    {
     "opcao": "Na rua, em feiras ou eventos, em barraca, carrinho ou veículo (food truck)",
     "opcoes": [
      "Na rua, em feiras ou eventos, em barraca, carrinho ou veículo (food truck)"
     ],
     "texto": "Para vender em local público, a prefeitura costuma exigir licença de ambulante ou permissão de uso do espaço. Com alimentos, a Vigilância Sanitária licencia também a barraca ou o veículo, e veículo adaptado precisa ser regularizado no Detran.",
     "regra": "Pular M9-05, M9-06, M9-08, M9-09 e M9-12 (público no local = sim). Perguntar sobre gás (M9-07). Seguir para M9-04."
    },
    {
     "opcao": "Não sei",
     "opcoes": [
      "Não sei"
     ],
     "texto": "Pense em onde vai encontrar os clientes e entregar o produto ou o serviço. ⚠ Atenção: vender na rua, em feira ou em veículo pede licença da prefeitura e, com gás ou alimentos, vistoria dos Bombeiros e da Vigilância Sanitária.",
     "regra": "Mostrar o aviso com o botão 'Já verifiquei'. Se seguir sem responder, pular o bloco do local (itens 'a confirmar') e seguir para M9-04."
    }
   ]
  },
  {
   "codigo": "M9-03b",
   "fase": "Onde",
   "pergunta": "Que tipo de local você pretende usar?",
   "descobre": "Local pretendido",
   "aparece": "Se M9-03 = Ainda não escolhi ou Não sei (respostas valem como planejamento)",
   "caminhos": [
    {
     "opcao": "Minha casa / Apartamento ou condomínio / Loja ou sala comercial",
     "opcoes": [
      "Minha casa",
      "Apartamento ou condomínio",
      "Loja ou sala comercial"
     ],
     "texto": "Vamos ver as regras do local que você pretende usar. As respostas valem como planejamento: confirme tudo antes de alugar ou assinar contrato.",
     "regra": "Mostrar as perguntas do local conforme o tipo pretendido; as respostas contam como hipótese. Seguir para M9-04."
    },
    {
     "opcao": "Sem local fixo",
     "opcoes": [
      "Sem local fixo"
     ],
     "texto": "Vamos ver como você vai trabalhar.",
     "regra": "Seguir para M9-03a."
    },
    {
     "opcao": "Ainda não faço ideia",
     "opcoes": [
      "Ainda não faço ideia"
     ],
     "texto": "Sem saber o tipo de local, não dá para ver agora as regras do imóvel. Pulamos essas perguntas, e elas ficam como 'a confirmar' no checklist. Quando escolher o local, volte a esta etapa antes de alugar ou assinar contrato.",
     "regra": "O módulo não termina: pular M9-05 a M9-09 e M9-12 (itens 'a confirmar'), mostrar M9-04 como orientação e seguir para M9-10."
    }
   ]
  },
  {
   "codigo": "M9-04",
   "fase": "Onde",
   "pergunta": "Você já verificou na prefeitura se a atividade pode funcionar nesse endereço?",
   "descobre": "Consulta de viabilidade",
   "aparece": "Sempre (sem local fixo: endereço do registro; local não definido: vira orientação)",
   "caminhos": [
    {
     "opcao": "Sim, foi aprovada",
     "opcoes": [
      "Sim, foi aprovada"
     ],
     "texto": "Ótimo. Guarde o comprovante da consulta.",
     "regra": "Seguir para M9-05 ou próxima etapa aplicável."
    },
    {
     "opcao": "Sim, foi negada",
     "opcoes": [
      "Sim, foi negada"
     ],
     "texto": "Com a consulta negada, a atividade pode não funcionar nesse endereço. Procure a prefeitura para entender o motivo antes de gastar com o local.",
     "regra": "Seguir para M9-05 ou próxima etapa aplicável."
    },
    {
     "opcao": "Ainda não fiz",
     "opcoes": [
      "Ainda não fiz"
     ],
     "texto": "Faça a consulta no portal do seu estado ([link do estado]) antes de alugar, reformar ou registrar a empresa.",
     "regra": "Seguir para M9-05 ou próxima etapa aplicável."
    },
    {
     "opcao": "Não sei",
     "opcoes": [
      "Não sei"
     ],
     "texto": "Verifique se a consulta de viabilidade já foi feita: se a empresa já foi registrada, ela pode ter sido feita nessa etapa. Pergunte a quem fez o registro (por exemplo, o contador) ou procure o protocolo no portal do seu estado. ⚠ Atenção: não alugue, não reforme nem assine contrato antes de saber se a atividade pode funcionar no endereço.",
     "regra": "Mostrar o aviso com o botão 'Já verifiquei' (volta à pergunta). Se seguir sem responder, o item fica 'a confirmar' e entra nos alertas do resumo. Seguir para M9-05 ou próxima etapa aplicável."
    }
   ]
  },
  {
   "codigo": "M9-05",
   "fase": "O local",
   "pergunta": "Qual é o tamanho total do imóvel, em m²?",
   "descobre": "Área construída",
   "aparece": "Se casa ou apartamento (escolhido ou pretendido)",
   "caminhos": [
    {
     "opcao": "Área informada (número maior que zero)",
     "opcoes": [],
     "texto": "Anotado. A área é um dos critérios que a prefeitura e os Bombeiros usam, e o limite muda de cidade para cidade. Confirme na prefeitura.",
     "regra": "Seguir para M9-06."
    },
    {
     "opcao": "Valor inválido",
     "opcoes": [],
     "texto": "Informe a área com um número maior que zero.",
     "regra": "Solicitar correção."
    },
    {
     "opcao": "Não sei",
     "opcoes": [
      "Não sei"
     ],
     "texto": "Consulte o carnê do IPTU ou a planta e volte a esta pergunta.",
     "regra": "Não bloquear; seguir."
    }
   ]
  },
  {
   "codigo": "M9-06",
   "fase": "O local",
   "pergunta": "Clientes ou outras pessoas vão ao local?",
   "descobre": "Público no local",
   "aparece": "Se há local fixo (ver regra abaixo) e o atendimento não é só fora",
   "caminhos": [
    {
     "opcao": "Não, só trabalho interno ou atendimento fora",
     "opcoes": [
      "Não, só trabalho interno ou atendimento fora"
     ],
     "texto": "Anotado.",
     "regra": "Seguir para M9-07."
    },
    {
     "opcao": "Sim, menos de 100 pessoas ao mesmo tempo",
     "opcoes": [
      "Sim, menos de 100 pessoas ao mesmo tempo"
     ],
     "texto": "Anotado. Esse número entra nas condições para trabalhar em casa e na conversa com os Bombeiros.",
     "regra": "Seguir para M9-07."
    },
    {
     "opcao": "Sim, 100 pessoas ou mais ao mesmo tempo",
     "opcoes": [
      "Sim, 100 pessoas ou mais ao mesmo tempo"
     ],
     "texto": "Locais que reúnem 100 pessoas ou mais seguem normas especiais de prevenção de incêndio. Confirme com a prefeitura e com os Bombeiros antes de abrir.",
     "regra": "Seguir para M9-07."
    },
    {
     "opcao": "Não sei",
     "opcoes": [
      "Não sei"
     ],
     "texto": "Verifique se clientes, alunos, pacientes ou outras pessoas vão ao local e, no momento de maior movimento, quantas estariam lá ao mesmo tempo. ⚠ Atenção: público no local muda as condições para trabalhar em casa e as exigências dos Bombeiros.",
     "regra": "Mostrar o aviso com o botão 'Já verifiquei' (volta à pergunta). Se seguir sem responder, o item fica 'a confirmar' e entra nos alertas do resumo. Seguir para M9-07."
    }
   ]
  },
  {
   "codigo": "M9-07",
   "fase": "O local",
   "pergunta": "Vai haver gás no local, no veículo, na banca ou no carrinho?",
   "descobre": "Tipo de gás",
   "aparece": "Se há local fixo ou trabalho na rua, em feira ou em veículo",
   "caminhos": [
    {
     "opcao": "Não",
     "opcoes": [
      "Não"
     ],
     "texto": "Anotado.",
     "regra": "Seguir para M9-07c."
    },
    {
     "opcao": "Sim, gás encanado da rua (gás natural)",
     "opcoes": [
      "Sim, gás encanado da rua (gás natural)"
     ],
     "texto": "A ligação é feita pela distribuidora, e a instalação interna (tubos, registros e ventilação dos aparelhos) deve ser feita por empresa ou profissional habilitado, com ART ou RRT. Em comércio, os Bombeiros podem conferir a instalação no projeto ou na vistoria.",
     "regra": "Seguir para M9-07c."
    },
    {
     "opcao": "Sim, botijão ou cilindro (gás de cozinha, GLP)",
     "opcoes": [
      "Sim, botijão ou cilindro (gás de cozinha, GLP)"
     ],
     "texto": "Vamos ver quantos são e onde vão ficar.",
     "regra": "Seguir para M9-07a."
    },
    {
     "opcao": "Vou vender gás de cozinha (revenda)",
     "opcoes": [
      "Vou vender gás de cozinha (revenda)"
     ],
     "texto": "Vender botijões exige empresa com autorização da ANP para revenda de GLP, área de armazenamento compatível com a classe autorizada e regularização nos Bombeiros e na prefeitura. Não comece a vender antes dessa autorização.",
     "regra": "Alerta no resumo. Seguir para M9-07c."
    },
    {
     "opcao": "Não sei",
     "opcoes": [
      "Não sei"
     ],
     "texto": "Verifique se algum equipamento vai usar gás: fogão, forno, chapa, fritadeira, churrasqueira, aquecedor de água ou caldeira. ⚠ Atenção: gás instalado ou guardado fora das regras pode causar vazamento, incêndio ou explosão, e é um dos itens que os Bombeiros conferem. Não instale nem guarde gás antes de confirmar.",
     "regra": "Mostrar o aviso com o botão 'Já verifiquei' (volta à pergunta). Se seguir sem responder, o item fica 'a confirmar' e entra nos alertas do resumo. Seguir para M9-07c."
    }
   ]
  },
  {
   "codigo": "M9-07a",
   "fase": "O local",
   "pergunta": "Quantos botijões ou cilindros de gás vão ficar no local, contando os cheios, os em uso e os de reserva?",
   "descobre": "Tipo e quantidade de gás",
   "aparece": "Se M9-07 = botijão ou cilindro",
   "caminhos": [
    {
     "opcao": "1 botijão de 13 kg (P13)",
     "opcoes": [
      "1 botijão de 13 kg (P13)"
     ],
     "texto": "Anotado. Mesmo com um botijão, use mangueira e regulador dentro da validade e deixe o botijão em local ventilado. Em comércio, alguns estados pedem que ele fique fora da cozinha, em abrigo próprio.",
     "regra": "Seguir para M9-07b."
    },
    {
     "opcao": "2 botijões de 13 kg (um em uso e um de reserva)",
     "opcoes": [
      "2 botijões de 13 kg (um em uso e um de reserva)"
     ],
     "texto": "Anotado. Em vários estados, um botijão em uso e um de reserva é o limite das regras mais simples. Confirme nos Bombeiros do seu estado.",
     "regra": "Seguir para M9-07b."
    },
    {
     "opcao": "3 ou mais botijões de 13 kg / Cilindros de 20 kg ou 45 kg (P20, P45)",
     "opcoes": [
      "3 ou mais botijões de 13 kg",
      "Cilindros de 20 kg ou 45 kg (P20, P45)"
     ],
     "texto": "Com mais gás, os Bombeiros costumam exigir abrigo ou central de gás, feita por profissional habilitado (com ART ou RRT), conforme a norma de gás do seu estado e a ABNT NBR 13523. Confirme antes de comprar os cilindros ou fazer a instalação.",
     "regra": "Alerta no resumo. Seguir para M9-07b."
    },
    {
     "opcao": "Central de gás do prédio ou do terreno",
     "opcoes": [
      "Central de gás do prédio ou do terreno"
     ],
     "texto": "Peça ao responsável pelo imóvel o projeto ou o laudo da central de gás e confirme se ela está regularizada nos Bombeiros. Ligar um ponto novo exige profissional habilitado.",
     "regra": "Seguir para M9-07b."
    },
    {
     "opcao": "Não sei",
     "opcoes": [
      "Não sei"
     ],
     "texto": "Conte os botijões ou cilindros que vão ficar no local (cheios, em uso e de reserva) e veja o peso no rótulo: 13, 20 ou 45 kg. ⚠ Atenção: a quantidade de gás muda o que os Bombeiros exigem. Confirme antes de comprar ou instalar.",
     "regra": "Mostrar o aviso com o botão 'Já verifiquei' (volta à pergunta). Se seguir sem responder, o item fica 'a confirmar' e entra nos alertas do resumo. Seguir para M9-07b."
    }
   ]
  },
  {
   "codigo": "M9-07b",
   "fase": "O local",
   "pergunta": "Onde o gás vai ficar?",
   "descobre": "Local do gás",
   "aparece": "Se M9-07 = botijão ou cilindro",
   "caminhos": [
    {
     "opcao": "Do lado de fora, em área aberta e ventilada ou em abrigo próprio",
     "opcoes": [
      "Do lado de fora, em área aberta e ventilada ou em abrigo próprio"
     ],
     "texto": "Anotado. Mantenha o local livre, protegido do sol e da chuva e longe de ralos, tomadas e de outros produtos que pegam fogo.",
     "regra": "Seguir para M9-07c."
    },
    {
     "opcao": "Dentro da cozinha ou de outro cômodo fechado",
     "opcoes": [
      "Dentro da cozinha ou de outro cômodo fechado"
     ],
     "texto": "Atenção: em muitos estados, o botijão não pode ficar em local fechado, como dentro da cozinha, em subsolo ou em sala sem ventilação, principalmente em comércio. Confirme com os Bombeiros onde o gás pode ficar antes de começar.",
     "regra": "Alerta no resumo. Seguir para M9-07c."
    },
    {
     "opcao": "No veículo, na barraca ou no carrinho",
     "opcoes": [
      "No veículo, na barraca ou no carrinho"
     ],
     "texto": "Gás em food truck, barraca ou carrinho precisa de compartimento próprio, ventilado e bem preso, e costuma ser conferido pelos Bombeiros e pela prefeitura. Confirme as regras antes de começar a vender.",
     "regra": "Seguir para M9-07c."
    },
    {
     "opcao": "Não sei",
     "opcoes": [
      "Não sei"
     ],
     "texto": "Verifique onde o gás vai ficar e se o lugar é aberto e ventilado. ⚠ Atenção: em local fechado, um vazamento acumula gás e pode causar explosão. Confirme com os Bombeiros.",
     "regra": "Mostrar o aviso com o botão 'Já verifiquei' (volta à pergunta). Se seguir sem responder, o item fica 'a confirmar' e entra nos alertas do resumo. Seguir para M9-07c."
    }
   ]
  },
  {
   "codigo": "M9-07c",
   "fase": "O local",
   "pergunta": "Vai guardar outros produtos que pegam fogo, como álcool, tintas, solventes ou combustíveis?",
   "descobre": "Inflamáveis",
   "aparece": "Mesma condição de M9-07",
   "caminhos": [
    {
     "opcao": "Não",
     "opcoes": [
      "Não"
     ],
     "texto": "Anotado.",
     "regra": "Seguir para M9-08, M9-09 ou M9-10."
    },
    {
     "opcao": "Sim, só para uso e limpeza, em embalagens pequenas",
     "opcoes": [
      "Sim, só para uso e limpeza, em embalagens pequenas"
     ],
     "texto": "Anotado. Guarde nas embalagens originais, em local ventilado, longe do fogo e do gás.",
     "regra": "Seguir para M9-08, M9-09 ou M9-10."
    },
    {
     "opcao": "Sim, em maior quantidade ou para vender",
     "opcoes": [
      "Sim, em maior quantidade ou para vender"
     ],
     "texto": "Guardar ou vender produtos que pegam fogo em maior quantidade pode exigir regularização nos Bombeiros e regras próprias de armazenamento. Confirme no órgão antes de estocar.",
     "regra": "Seguir para M9-08, M9-09 ou M9-10."
    },
    {
     "opcao": "Não sei",
     "opcoes": [
      "Não sei"
     ],
     "texto": "Verifique o que vai ficar guardado no local: álcool, tintas, vernizes, solventes, thinner, gasolina ou óleo diesel. ⚠ Atenção: produtos que pegam fogo guardados perto de calor ou do gás aumentam o risco de incêndio e entram na análise dos Bombeiros.",
     "regra": "Mostrar o aviso com o botão 'Já verifiquei' (volta à pergunta). Se seguir sem responder, o item fica 'a confirmar' e entra nos alertas do resumo. Seguir para M9-08, M9-09 ou M9-10."
    }
   ]
  },
  {
   "codigo": "M9-08",
   "fase": "O local",
   "pergunta": "A convenção do condomínio permite a atividade no apartamento, ou o condomínio já a autorizou por escrito (por exemplo, em ata)?",
   "descobre": "Permissão do condomínio",
   "aparece": "Se apartamento ou condomínio (escolhido ou pretendido)",
   "caminhos": [
    {
     "opcao": "Sim",
     "opcoes": [
      "Sim"
     ],
     "texto": "Ótimo. Guarde a cópia da convenção ou da autorização.",
     "regra": "Seguir para M9-09 ou M9-10."
    },
    {
     "opcao": "Não",
     "opcoes": [
      "Não"
     ],
     "texto": "Peça ao síndico para incluir a sua atividade na pauta da assembleia. Explique o que fará, o horário e se haverá clientes.",
     "regra": "Seguir para M9-09 ou M9-10."
    },
    {
     "opcao": "Não sei",
     "opcoes": [
      "Não sei"
     ],
     "texto": "Verifique na convenção do condomínio (peça uma cópia ao síndico ou à administradora) se a atividade é permitida ou se já há autorização registrada em ata. ⚠ Atenção: sem essa permissão, o condomínio pode multar ou impedir a atividade, mesmo com o CNPJ aberto.",
     "regra": "Mostrar o aviso com o botão 'Já verifiquei' (volta à pergunta). Se seguir sem responder, o item fica 'a confirmar' e entra nos alertas do resumo. Seguir para M9-09 ou M9-10."
    }
   ]
  },
  {
   "codigo": "M9-09",
   "fase": "O local",
   "pergunta": "Como será o espaço onde você vai trabalhar dentro de casa?",
   "descobre": "Espaço de trabalho",
   "aparece": "Se casa ou apartamento e interesse sanitário",
   "caminhos": [
    {
     "opcao": "Área separada, de uso exclusivo, com equipamentos exclusivos",
     "opcoes": [
      "Área separada, de uso exclusivo, com equipamentos exclusivos"
     ],
     "texto": "Anotado. Mantenha as rotinas de limpeza anotadas.",
     "regra": "Seguir para M9-10."
    },
    {
     "opcao": "Espaço e utensílios compartilhados com a família",
     "opcoes": [
      "Espaço e utensílios compartilhados com a família"
     ],
     "texto": "Para atividades ligadas à saúde, separar o espaço e os utensílios do uso da família pode ser exigido. Confirme com a Vigilância Sanitária.",
     "regra": "Seguir para M9-10."
    },
    {
     "opcao": "Só guardo produtos prontos e embalados para revenda",
     "opcoes": [
      "Só guardo produtos prontos e embalados para revenda"
     ],
     "texto": "Anotado. Guarde os produtos longe de calor, umidade e de produtos de limpeza.",
     "regra": "Seguir para M9-10."
    },
    {
     "opcao": "Não sei",
     "opcoes": [
      "Não sei"
     ],
     "texto": "Pense em onde vai preparar, guardar e embalar. Para atividades ligadas à saúde, separar o espaço e os utensílios do uso da família pode ser exigido. Confirme com a Vigilância Sanitária.",
     "regra": "Não bloquear; seguir."
    }
   ]
  },
  {
   "codigo": "M9-10",
   "fase": "Cuidados da atividade",
   "pergunta": "Sua atividade só pode ser feita por um profissional formado e registrado em conselho?",
   "descobre": "Responsável técnico",
   "aparece": "Sempre",
   "caminhos": [
    {
     "opcao": "Sim",
     "opcoes": [
      "Sim"
     ],
     "texto": "A empresa pode precisar de um profissional habilitado como responsável e de registro no conselho da profissão. Isso tem custo e prazo: confirme antes de registrar.",
     "regra": "Seguir para M9-11."
    },
    {
     "opcao": "Não",
     "opcoes": [
      "Não"
     ],
     "texto": "Anotado.",
     "regra": "Seguir para M9-11."
    },
    {
     "opcao": "Não sei",
     "opcoes": [
      "Não sei"
     ],
     "texto": "Verifique se a sua profissão tem um conselho regional (por exemplo, de nutrição, farmácia, medicina veterinária, engenharia, contabilidade ou educação física) e se ele exige registro da empresa ou um responsável técnico. ⚠ Atenção: funcionar sem o registro exigido pode gerar multa do conselho e atrasar outras licenças.",
     "regra": "Mostrar o aviso com o botão 'Já verifiquei' (volta à pergunta). Se seguir sem responder, o item fica 'a confirmar' e entra nos alertas do resumo. Seguir para M9-11."
    }
   ]
  },
  {
   "codigo": "M9-11",
   "fase": "Cuidados da atividade",
   "pergunta": "O seu trabalho produz fumaça, barulho alto, água suja com produtos, pó ou restos de produtos químicos?",
   "descobre": "Impacto ambiental",
   "aparece": "Sempre",
   "caminhos": [
    {
     "opcao": "Sim",
     "opcoes": [
      "Sim"
     ],
     "texto": "Atividades com fumaça, barulho ou resíduos podem precisar de licença ambiental e de cuidados com o descarte. Confirme na prefeitura ou no órgão ambiental do estado.",
     "regra": "Seguir para M9-12 ou M9-13."
    },
    {
     "opcao": "Não",
     "opcoes": [
      "Não"
     ],
     "texto": "Anotado.",
     "regra": "Seguir para M9-12 ou M9-13."
    },
    {
     "opcao": "Não sei",
     "opcoes": [
      "Não sei"
     ],
     "texto": "Verifique no seu mapa de processo se alguma etapa usa fogo ou química, gera água suja com produtos, solta pó ou faz barulho. ⚠ Atenção: atividades com fumaça, barulho ou resíduos podem precisar de licença ambiental, e descartar resíduos de forma errada pode gerar multa. Confirme na prefeitura ou no órgão ambiental do estado.",
     "regra": "Mostrar o aviso com o botão 'Já verifiquei' (volta à pergunta). Se seguir sem responder, o item fica 'a confirmar' e entra nos alertas do resumo. Seguir para M9-12 ou M9-13."
    }
   ]
  },
  {
   "codigo": "M9-12",
   "fase": "Cuidados da atividade",
   "pergunta": "Você vai precisar fazer obra ou reforma no local?",
   "descobre": "Obra",
   "aparece": "Se há local fixo (escolhido ou pretendido)",
   "caminhos": [
    {
     "opcao": "Não / Só pequenos reparos",
     "opcoes": [
      "Não",
      "Só pequenos reparos"
     ],
     "texto": "Anotado.",
     "regra": "Seguir para M9-13."
    },
    {
     "opcao": "Sim, obra que muda estrutura, área ou uso",
     "opcoes": [
      "Sim, obra que muda estrutura, área ou uso"
     ],
     "texto": "Obras que mudam a estrutura ou o uso costumam precisar de projeto e autorização da prefeitura. Confirme antes de começar.",
     "regra": "Seguir para M9-13."
    },
    {
     "opcao": "Não sei",
     "opcoes": [
      "Não sei"
     ],
     "texto": "Verifique se vai derrubar ou levantar paredes, aumentar a área ou mudar a fachada ou a parte elétrica ou hidráulica. ⚠ Atenção: obras que mudam a estrutura, a área ou o uso costumam precisar de projeto e autorização da prefeitura. Não comece a obra antes de confirmar.",
     "regra": "Mostrar o aviso com o botão 'Já verifiquei' (volta à pergunta). Se seguir sem responder, o item fica 'a confirmar' e entra nos alertas do resumo. Seguir para M9-13."
    }
   ]
  },
  {
   "codigo": "M9-13",
   "fase": "Fechamento",
   "pergunta": "Quer anotar alguma ideia sobre vendas, equipe ou próximos passos?",
   "descobre": "Ideias para depois",
   "aparece": "Sempre (opcional)",
   "caminhos": [
    {
     "opcao": "Texto preenchido",
     "opcoes": [],
     "texto": "Guardado!",
     "regra": "Seguir para M9-14."
    },
    {
     "opcao": "Em branco",
     "opcoes": [],
     "texto": "Tudo bem.",
     "regra": "Seguir para M9-14."
    }
   ]
  },
  {
   "codigo": "M9-14",
   "fase": "Fechamento",
   "pergunta": "Este é o seu checklist de endereço e licenças. Está certo?",
   "descobre": "Confirmação",
   "aparece": "Sempre (última tela)",
   "caminhos": [
    {
     "opcao": "Sim, pode seguir",
     "opcoes": [
      "Sim, pode seguir"
     ],
     "texto": "Pronto! O checklist é orientação para confirmar nos órgãos oficiais, não uma autorização.",
     "regra": "Ir para o próximo módulo."
    },
    {
     "opcao": "Quero corrigir algo",
     "opcoes": [
      "Quero corrigir algo"
     ],
     "texto": "Qual resposta você quer mudar?",
     "regra": "Voltar e retornar ao resumo."
    }
   ]
  }
 ],
 "divergencias_texto": [
  {
   "codigo": "M9-05",
   "passo_a_passo": "Qual é o tamanho total do imóvel, em m²?",
   "caminhos": "Qual é o tamanho total do imóvel, em metros quadrados?"
  }
 ]
};
