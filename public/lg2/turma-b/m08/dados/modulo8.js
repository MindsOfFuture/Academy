/* GERADO por ferramentas/extrair.py a partir da planilha do grupo. Nao editar a mao. */
window.MODULO8 = {
 "origem": "LG2_M08_planilha_do_grupo.xlsx",
 "modulo": {
  "numero": "8",
  "nome": "Formalização, enquadramento e tributação básica",
  "versao": "v0.1",
  "data": "01/10/2026",
  "turma": "Turma de 24",
  "tutora": "Luiza",
  "integrantes": [
   "José Inácio Campos Bittencourt",
   "Gabriela de Torres Bueno"
  ]
 },
 "mapa": {
  "objetivo": "Ajudar o usuário a identificar sua atividade real, encontrar o CNAE adequado, verificar se pode ser MEI, entender opções de enquadramento empresarial e conhecer obrigações básicas de registro, licenciamento e tributação, sempre com limites e encaminhamentos profissionais quando necessário",
  "usuario": "Pessoa que está começando um pequeno negócio ou já trabalha de forma informal e precisa entender como se enquadrar, quais atividades são permitidas, se pode ser MEI, quais licenças podem ser exigidas e quais passos seguir para formalizar ou ajustar o CNPJ.",
  "decisoes": "Organizar a atividade real, identificar possíveis CNAEs, verificar compatibilidade com MEI, comparar formas empresariais básicas, reconhecer obrigações tributárias e licenças comuns e entender quando buscar apoio profissional. O módulo informa caminhos e limites, mas não decide pelo usuário nem recomenda uma forma jurídica específica.",
  "nao_faz": "Não garante que a atividade pode ser exercida sem licenças, não confirma viabilidade jurídica ou sanitária, não escolhe CNAE automaticamente, não recomenda formalização específica, não substitui contador, advogado ou responsável técnico e não interpreta regras municipais ou profissionais sem fonte oficial. As estimativas dependem dos dados informados e não garantem resultados.",
  "mensagem_limite": "O app oferece apoio educacional básico. As estimativas dependem dos dados fornecidos e não garantem resultados. Regras de registro, tributação, licenciamento e exercício profissional devem ser confirmadas em fontes oficiais e com profissionais habilitados.",
  "ter_em_maos": "O usuário precisa ter uma descrição simples da atividade real (o que faz, como faz, para quem e onde), uma ideia inicial do produto ou serviço, informações básicas sobre o local de funcionamento e uma estimativa aproximada de faturamento mensal ou anual, podendo responder “Não sei” quando necessário. Se já tiver CNPJ ou CNAE, pode informar, mas nada disso é obrigatório. Também ajuda ter noção de exigências comuns da atividade, como manipulação de alimentos ou necessidade de responsável técnico. Nenhum documento sensível é solicitado",
  "entrega": "O módulo entrega um resumo organizado da atividade real, possíveis CNAEs compatíveis, verificação de enquadramento como MEI, caminhos de pesquisa para formas empresariais, alertas sobre licenças e obrigações básicas, e um próximo passo claro para o usuário seguir — seja continuar no app, buscar fontes oficiais ou consultar um profissional habilitado.",
  "encaminhamentos": "O módulo orienta o usuário a procurar um contador quando houver dúvida sobre enquadramento tributário, escolha de CNAE, abertura ou alteração de CNPJ. Encaminha para advogado quando a atividade envolver contratos, responsabilidade civil ou exigências legais específicas. Encaminha para responsável técnico quando a atividade exigir habilitação profissional (como estética avançada, saúde, alimentação ou engenharia). Encaminha para órgãos públicos quando houver necessidade de licenciamento municipal, sanitário ou ambiental.",
  "caso_real": "O caso real do grupo mostrou dúvidas recorrentes sobre como descrever a atividade, se a pessoa podia ser MEI, qual CNAE usar e quais licenças eram necessárias para trabalhar em casa. Também apareceram situações de faturamento incerto, ocupações não permitidas para MEI e confusão entre “formalizar” e “emitir nota”. Esses pontos ajudaram a definir perguntas mais claras, regras com limites e exemplos acessíveis, sem incluir dados identificáveis do atendimento.",
  "riscos": "Os principais riscos são prometer formalização fácil, recomendar enquadramento específico, interpretar regras municipais sem fonte oficial e usar informações desatualizadas. O grupo evita esses riscos usando apenas fontes oficiais com link e data, escrevendo respostas condicionais com limites, oferecendo sempre a opção “Não sei”, evitando qualquer promessa de viabilidade ou autorização e encaminhando o usuário a profissionais habilitados quando necessário."
 },
 "conexoes": [],
 "base": [
  {
   "codigo": "M8.BT01",
   "conceito": "Atividade Real",
   "definicao": "O que a pessoa realmente faz no dia a dia para gerar renda: produto, serviço, forma de entrega e local.",
   "porque": "É a base para escolher CNAE, verificar se pode ser MEI e identificar licenças obrigatórias.",
   "exemplo": "1091-1/02 – Fabricação de produtos de padaria e confeitaria.",
   "tipo_fonte": "Institucional",
   "fonte": "Sebrae – Guia de Formalização",
   "data": "01/10/2026",
   "status": "Rascunho"
  },
  {
   "codigo": "M8.BT02",
   "conceito": "CNAE",
   "definicao": "Código oficial que identifica a atividade econômica de um negócio.",
   "porque": "Define enquadramento tributário, possibilidade de ser MEI, licenças e obrigações.",
   "exemplo": "1091-1/02 – Fabricação de produtos de padaria e confeitaria.",
   "tipo_fonte": "Oficial",
   "fonte": "IBGE – Tabela CNAE 2.0",
   "data": "01/10/2026",
   "status": "Rascunho"
  },
  {
   "codigo": "M8.BT03",
   "conceito": "Ocupações permitidas no MEI",
   "definicao": "Lista oficial de atividades que podem ser registradas como Microempreendedor Individual.",
   "porque": "Nem toda atividade pode ser MEI; isso afeta custo, obrigações e licenças.",
   "exemplo": "“Confeiteiro(a) independente” é permitido; “Engenheiro(a)” não é.",
   "tipo_fonte": "Oficial",
   "fonte": "Portal do Empreendedor – Ocupações permitidas",
   "data": "01/10/2026",
   "status": "Rascunho"
  },
  {
   "codigo": "M8.BT04",
   "conceito": "MEI",
   "definicao": "Forma simplificada de formalização para quem fatura até R$ 81 mil/ano e exerce ocupação permitida.",
   "porque": "Tem custo baixo, obrigações reduzidas e permite emitir nota fiscal.",
   "exemplo": "Pagamento mensal do DAS e entrega da declaração anual (DASN-SIMEI).",
   "tipo_fonte": "Oficial",
   "fonte": "Receita Federal – Simei",
   "data": "01/10/2026",
   "status": "Rascunho"
  },
  {
   "codigo": "M8.BT05",
   "conceito": "Simples Nacional",
   "definicao": "Regime tributário simplificado para micro e pequenas empresas.",
   "porque": "Define impostos, alíquotas e obrigações mensais.",
   "exemplo": "Comércio inicia no Anexo I; serviços variam entre Anexo III, IV ou V.",
   "tipo_fonte": "Oficial",
   "fonte": "Receita Federal – Simples Nacional",
   "data": "01/10/2026",
   "status": "Rascunho"
  },
  {
   "codigo": "M8.BT06",
   "conceito": "Formas Empresariais",
   "definicao": "Estruturas jurídicas possíveis para abrir um negócio.",
   "porque": "Afetam responsabilidade, custo, obrigações e possibilidade de sócios.",
   "exemplo": "SLU permite um único sócio com responsabilidade limitada.",
   "tipo_fonte": "Oficial",
   "fonte": "DREI – Manuais de Registro",
   "data": "01/10/2026",
   "status": "Rascunho"
  },
  {
   "codigo": "M8.BT07",
   "conceito": "Licenciamento Municipal",
   "definicao": "Autorizações da prefeitura para funcionamento, como alvará, vigilância sanitária e uso do solo.",
   "porque": "Sem licenças, o negócio pode ser multado ou impedido de funcionar.",
   "exemplo": "Cozinha para produção de alimentos exige inspeção sanitária.",
   "tipo_fonte": "Oficial",
   "fonte": "Prefeitura de Juiz de Fora",
   "data": "01/10/2026",
   "status": "Rascunho"
  },
  {
   "codigo": "M8.BT08",
   "conceito": "Obrigações Tributárias",
   "definicao": "Pagamentos e declarações obrigatórias conforme o regime escolhido.",
   "porque": "Evita multas, pendências e bloqueio do CNPJ.",
   "exemplo": "MEI paga DAS mensal; ME/EPP entregam PGDAS-D e DEFIS.",
   "tipo_fonte": "Oficial",
   "fonte": "Receita Federal – Obrigações do Simples",
   "data": "01/10/2026",
   "status": "Rascunho"
  },
  {
   "codigo": "M8.BT09",
   "conceito": "Responsável Técnico",
   "definicao": "Profissional habilitado exigido para atividades que envolvem risco ou regulamentação específica.",
   "porque": "Sem responsável técnico, algumas atividades não podem ser exercidas legalmente.",
   "exemplo": "Estética avançada exige profissional com formação específica e registro.",
   "tipo_fonte": "Oficial",
   "fonte": "Conselhos profissionais (CRN, CRMV, CREA etc.)",
   "data": "01/10/2026",
   "status": "Rascunho"
  },
  {
   "codigo": "M8.BT10",
   "conceito": "Redesim",
   "definicao": "Sistema integrado para abertura, alteração e baixa de empresas.",
   "porque": "Centraliza etapas e reduz erros no registro.",
   "exemplo": "onsulta prévia de endereço e viabilidade.",
   "tipo_fonte": "Oficial",
   "fonte": "Redesim – Governo Federal",
   "data": "01/10/2026",
   "status": "Rascunho"
  },
  {
   "codigo": "M8.BT11",
   "conceito": "Viabilidade de endereço ",
   "definicao": "Verificação prévia se o endereço permite a atividade desejada.",
   "porque": "Centraliza etapas e reduz erros no registro.",
   "exemplo": "Condomínio residencial pode proibir produção de alimentos para venda.",
   "tipo_fonte": "Oficial",
   "fonte": "JUCEMG / Redesim MG",
   "data": "01/10/2026",
   "status": "Rascunho"
  },
  {
   "codigo": "M8.BT12",
   "conceito": "Nota Fiscal",
   "definicao": "Documento que registra a venda de produto ou serviço.",
   "porque": "É exigida em vendas para empresas e em algumas atividades reguladas.",
   "exemplo": "MEI emite nota fiscal eletrônica quando vende para pessoa jurídica.",
   "tipo_fonte": "Oficial",
   "fonte": "Receita Federal – Nota Fiscal",
   "data": "01/10/2026",
   "status": "Rascunho"
  }
 ],
 "perguntas": [
  {
   "codigo": "M8.P01",
   "modulo": "M8",
   "pergunta": "Qual é a sua atividade real? O que você faz no dia a dia para gerar renda?",
   "ajuda": "Descreva o que faz, como faz, para quem e onde. Se não souber como explicar, escolha “Não sei”.",
   "tipo": "Texto",
   "condicao": "Sempre",
   "opcoes": "Não sei",
   "resposta": "-",
   "alerta": "Uma descrição clara evita erros de CNAE e enquadramento."
  },
  {
   "codigo": "M8.P02",
   "modulo": "M8",
   "pergunta": "Sua atividade envolve principalmente produto, serviço ou os dois?",
   "ajuda": "Escolha a opção que mais representa sua atividade.",
   "tipo": "Escolha",
   "condicao": "Sempre",
   "opcoes": "Produto; Serviço; Produto e serviço; Não sei",
   "resposta": "-",
   "alerta": "A classificação influencia CNAE, MEI e licenças."
  },
  {
   "codigo": "M8.P03",
   "modulo": "M8",
   "pergunta": "Onde você realiza sua atividade?",
   "ajuda": "Escolha o local principal.",
   "tipo": "Escolha",
   "condicao": "Sempre",
   "opcoes": "Minha casa; Ponto comercial; Atendimento externo; Online; Não sei",
   "resposta": "-",
   "alerta": "O local pode exigir licenças municipais ou sanitárias."
  },
  {
   "codigo": "M8.P04",
   "modulo": "M8",
   "pergunta": "Quanto você estima faturar por mês, em média?",
   "ajuda": "Pode ser aproximado. Se não souber, escolha “Não sei”.",
   "tipo": "Número",
   "condicao": "Sempre",
   "opcoes": "Não sei",
   "resposta": "-",
   "alerta": "O faturamento ajuda a verificar se o MEI é uma hipótese."
  },
  {
   "codigo": "M8.P05",
   "modulo": "M8",
   "pergunta": "Você já possui CNPJ?",
   "ajuda": "Se tiver, informe o tipo. Se não souber, escolha “Não sei”.",
   "tipo": "Escolha",
   "condicao": "Sempre",
   "opcoes": "Não; MEI; EI; SLU; LTDA; Não sei",
   "resposta": "-",
   "alerta": "O tipo de CNPJ define obrigações e limites."
  },
  {
   "codigo": "M8.P06",
   "modulo": "M8",
   "pergunta": "Você sabe qual é o CNAE da sua atividade?",
   "ajuda": "Pode informar o código ou a descrição. Se não souber, escolha “Não sei”.",
   "tipo": "Texto",
   "condicao": "M8.P05=Não",
   "opcoes": "Não sei",
   "resposta": "-",
   "alerta": "CNAE incorreto pode gerar obrigações indevidas"
  },
  {
   "codigo": "M8.P07",
   "modulo": "M8",
   "pergunta": "Sua atividade aparece na lista de ocupações permitidas para MEI?",
   "ajuda": "Consulte a lista oficial do gov.br. Se não souber, escolha “Não sei”.",
   "tipo": "Escolha",
   "condicao": "M8.P04 ≤ 6750 ou M8.P05 = Não",
   "opcoes": "Sim; Não; Não sei",
   "resposta": "-",
   "alerta": "Nem todas as atividades podem ser MEI."
  },
  {
   "codigo": "M8.P08",
   "modulo": "M8",
   "pergunta": "Sua atividade exige responsável técnico ou formação específica?",
   "ajuda": "Exemplos: estética avançada, saúde, engenharia, alimentos.",
   "tipo": "Escolha",
   "condicao": "M8.P02 = Serviço ou M8.P02 = Produto e serviço",
   "opcoes": "Sim; Não; Não sei",
   "resposta": "-",
   "alerta": "Atividades regulamentadas não podem ser exercidas sem habilitação."
  },
  {
   "codigo": "M8.P09",
   "modulo": "M8",
   "pergunta": "Você sabe se sua atividade exige alvará, licença sanitária ou autorização municipal?",
   "ajuda": "Atividades com alimentos, atendimento ao público ou ponto comercial podem exigir licenças.",
   "tipo": "Escolha",
   "condicao": "M8.P03 ≠ Online",
   "opcoes": "Sim; Não; Não sei",
   "resposta": "-",
   "alerta": "Licenças variam por município e devem ser confirmadas em fonte oficial."
  },
  {
   "codigo": "M8.P10",
   "modulo": "M8",
   "pergunta": "Qual é sua principal dúvida sobre formalização?",
   "ajuda": "Escolha a opção que mais se aproxima da sua situação.",
   "tipo": "Escolha",
   "condicao": "Sempre",
   "opcoes": "Como escolher o CNAE; Se posso ser MEI; Quais licenças preciso; Obrigações do CNPJ; Não sei",
   "resposta": "-",
   "alerta": "A dúvida ajuda a organizar o próximo passo."
  }
 ],
 "regras": [],
 "instrumentos": {
  "lista": []
 },
 "educativo": [],
 "casos": [],
 "anexo": {
  "titulo": "(Anexo XI da Resolução CGSN nº 140, de 22 de maio de 2018) (arts. 100 e 101, § 1º, inciso I, § 2º)  Ocupações\nPermitidas ao MEI - Tabelas A e B",
  "linhas": [
   {
    "ocupacao": "ABATEDOR(A) DE AVES COM COMERCIALIZAÇÃO DO PRODUTO INDEPENDENTE",
    "cnae": "4724-5/00",
    "descricao": "COMÉRCIO VAREJISTA DE HORTIFRUTIGRANJEIROS",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "ACABADOR(A) DE CALÇADOS INDEPENDENTE",
    "cnae": "1531-9/02",
    "descricao": "ACABAMENTO DE CALÇADOS DE COURO SOB CONTRATO",
    "iss": "S",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "AÇOUGUEIRO(A) INDEPENDENTE",
    "cnae": "4722-9/01",
    "descricao": "COMÉRCIO VAREJISTA DE CARNES - AÇOUGUES",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "ADESTRADOR(A) DE ANIMAIS INDEPENDENTE",
    "cnae": "9609-2/07",
    "descricao": "ALOJAMENTO DE ANIMAIS DOMÉSTICOS",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "ADESTRADOR(A) DE CÃES DE GUARDA INDEPENDENTE",
    "cnae": "8011-1/02",
    "descricao": "SERVIÇOS DE ADESTRAMENTO DE CÃES DE GUARDA",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "AGENTE DE CORREIO FRANQUEADO E PERMISSIONÁRIO INDEPENDENTE",
    "cnae": "5310-5/02",
    "descricao": "ATIVIDADES DE FRANQUEADAS DO CORREIO NACIONAL",
    "iss": "S",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "AGENTE DE VIAGENS INDEPENDENTE",
    "cnae": "7911-2/00",
    "descricao": "AGÊNCIAS DE VIAGENS",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "AGENTE FUNERÁRIO INDEPENDENTE",
    "cnae": "9603-3/04",
    "descricao": "SERVIÇOS DE FUNERÁRIAS",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "AGENTE MATRIMONIAL INDEPENDENTE",
    "cnae": "9609-2/02",
    "descricao": "AGÊNCIAS MATRIMONIAIS",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "ALFAIATE INDEPENDENTE",
    "cnae": "1412-6/02",
    "descricao": "CONFECÇÃO  SOB MEDIDA DE  PEÇAS DO  VESTUÁRIO, EXCETO ROUPAS ÍNTIMAS",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "AMOLADOR(A) DE ARTIGOS DE CUTELARIA INDEPENDENTE",
    "cnae": "9529-1/99",
    "descricao": "REPARAÇÃO E MANUTENÇÃO DE OUTROS OBJETOS E EQUIPAMENTOS PESSOAIS E DOMÉSTICOS NÃO ESPECIFICADOS ANTERIORMENTE",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "ANIMADOR(A) DE FESTAS INDEPENDENTE",
    "cnae": "9329-8/99",
    "descricao": "OUTRAS  ATIVIDADES  DE  RECREAÇÃO  E  LAZER  NÃO ESPECIFICADAS ANTERIORMENTE",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "ANTIQUÁRIO(A) INDEPENDENTE",
    "cnae": "4785-7/01",
    "descricao": "COMÉRCIO VAREJISTA DE ANTIGUIDADES",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "APICULTOR(A) INDEPENDENTE",
    "cnae": "0159-8/01",
    "descricao": "APICULTURA",
    "iss": "S",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "APURADOR(A), COLETOR(A) E FORNECEDOR(A) DE RECORTES DE MATÉRIAS PUBLICADAS EM JORNAIS E REVISTAS INDEPENDENTE",
    "cnae": "6399-2/00",
    "descricao": "OUTRAS ATIVIDADES DE PRESTAÇÃO DE SERVIÇOS DE INFORMAÇÃO NÃO ESPECIFICADAS ANTERIORMENTE",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "ARMADOR(A) DE FERRAGENS NA CONSTRUÇÃO CIVIL INDEPENDENTE",
    "cnae": "2599-3/01",
    "descricao": "SERVIÇOS DE CONFECÇÃO DE ARMAÇÕES METÁLICAS PARA A CONSTRUÇÃO",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "ARTESÃO(Ã) DE BIJUTERIAS INDEPENDENTE",
    "cnae": "3212-4/00",
    "descricao": "FABRICAÇÃO DE BIJUTERIAS E ARTEFATOS SEMELHANTES",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "ARTESÃO(Ã) EM BORRACHA INDEPENDENTE",
    "cnae": "2219-6/00",
    "descricao": "FABRICAÇÃO   DE   ARTEFATOS   DE   BORRACHA   NÃO ESPECIFICADOS ANTERIORMENTE",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "ARTESÃO(Ã) EM CERÂMICA INDEPENDENTE",
    "cnae": "2349-4/99",
    "descricao": "FABRICAÇÃO DE PRODUTOS CERÂMICOS NÃO\nREFRATÁRIOS NÃO ESPECIFICADOS ANTERIORMENTE",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "ARTESÃO(Ã) EM CIMENTO INDEPENDENTE",
    "cnae": "2330-3/99",
    "descricao": "FABRICAÇÃO DE OUTROS ARTEFATOS E PRODUTOS DE CONCRETO, CIMENTO, FIBROCIMENTO, GESSO E MATERIAIS SEMELHANTES",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "ARTESÃO(Ã) EM CORTIÇA, BAMBU E AFINS INDEPENDENTE",
    "cnae": "1629-3/02",
    "descricao": "FABRICAÇÃO DE ARTEFATOS DIVERSOS DE CORTIÇA, BAMBU, PALHA, VIME E OUTROS MATERIAIS\nTRANÇADOS, EXCETO MÓVEIS",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "ARTESÃO(Ã) EM COURO INDEPENDENTE",
    "cnae": "1529-7/00",
    "descricao": "FABRICAÇÃO      DE     ARTEFATOS     DE     COURO     NÃO ESPECIFICADOS ANTERIORMENTE",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "ARTESÃO(Ã) EM GESSO INDEPENDENTE",
    "cnae": "2330-3/99",
    "descricao": "FABRICAÇÃO DE OUTROS ARTEFATOS E PRODUTOS DE CONCRETO, CIMENTO, FIBROCIMENTO, GESSO E MATERIAIS SEMELHANTES",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "ARTESÃO(Ã) EM LOUÇAS, VIDRO E CRISTAL INDEPENDENTE",
    "cnae": "2399-1/01",
    "descricao": "DECORAÇÃO, LAPIDAÇÃO, GRAVAÇÃO, VITRIFICAÇÃO\nE OUTROS TRABALHOS EM CERÂMICA, LOUÇA, VIDRO E CRISTAL",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "ARTESÃO(Ã) EM MADEIRA INDEPENDENTE",
    "cnae": "1629-3/01",
    "descricao": "FABRICAÇÃO  DE  ARTEFATOS  DIVERSOS  DE  MADEIRA, EXCETO MÓVEIS",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "ARTESÃO(Ã) EM MÁRMORE, GRANITO, ARDÓSIA E OUTRAS PEDRAS INDEPENDENTE",
    "cnae": "2391-5/03",
    "descricao": "APARELHAMENTO DE PLACAS E EXECUÇÃO DE TRABALHOS EM MÁRMORE, GRANITO, ARDÓSIA E OUTRAS PEDRAS",
    "iss": "S",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "ARTESÃO(Ã) EM METAIS INDEPENDENTE",
    "cnae": "2599-3/99",
    "descricao": "FABRICAÇÃO  DE  OUTROS  PRODUTOS  DE  METAL  NÃO ESPECIFICADOS ANTERIORMENTE",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "ARTESÃO(Ã) EM METAIS PRECIOSOS INDEPENDENTE",
    "cnae": "3211-6/02",
    "descricao": "FABRICAÇÃO DE ARTEFATOS DE JOALHERIA E OURIVESARIA",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "ARTESÃO(Ã) EM OUTROS MATERIAIS INDEPENDENTE",
    "cnae": "3299-0/99",
    "descricao": "FABRICAÇÃO      DE      PRODUTOS      DIVERSOS      NÃO ESPECIFICADOS ANTERIORMENTE",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "ARTESÃO(Ã) EM PAPEL INDEPENDENTE",
    "cnae": "1749-4/00",
    "descricao": "FABRICAÇÃO DE PRODUTOS DE PASTAS\nCELULÓSICAS, PAPEL, CARTOLINA, PAPEL-CARTÃO E PAPELÃO ONDULADO NÃO ESPECIFICADOS\nANTERIORMENTE",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "ARTESÃO(Ã) EM PLÁSTICO INDEPENDENTE",
    "cnae": "2229-3/99",
    "descricao": "FABRICAÇÃO DE ARTEFATOS DE MATERIAL PLÁSTICO PARA OUTROS USOS NÃO ESPECIFICADOS\nANTERIORMENTE",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "ARTESÃO(Ã) EM VIDRO INDEPENDENTE",
    "cnae": "2319-2/00",
    "descricao": "FABRICAÇÃO DE ARTIGOS DE VIDRO",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "ARTESÃO TÊXTIL",
    "cnae": "1359-6/00",
    "descricao": "FABRICAÇÃO DE OUTROS PRODUTOS TÊXTEIS NÃO ESPECIFICADOS",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "ASTRÓLOGO(A) INDEPENDENTE",
    "cnae": "9609-2/99",
    "descricao": "OUTRAS  ATIVIDADES   DE   SERVIÇOS   PESSOAIS   NÃO ESPECIFICADAS ANTERIORMENTE",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "AZULEJISTA INDEPENDENTE",
    "cnae": "4330-4/05",
    "descricao": "APLICAÇÃO DE REVESTIMENTOS E DE RESINAS EM INTERIORES E EXTERIORES",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "BALEIRO(A) INDEPENDENTE",
    "cnae": "4721-1/04",
    "descricao": "COMÉRCIO VAREJISTA DE DOCES, BALAS, BOMBONS E SEMELHANTES",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "BANHISTA DE ANIMAIS DOMÉSTICOS INDEPENDENTE",
    "cnae": "9609-2/08",
    "descricao": "HIGIENE E EMBELEZAMENTO DE ANIMAIS DOMÉSTICOS",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "BARBEIRO INDEPENDENTE",
    "cnae": "9602-5/01",
    "descricao": "CABELEIREIROS, MANICURE E PEDICURE",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "BARQUEIRO(A) INDEPENDENTE",
    "cnae": "5099-8/99",
    "descricao": "OUTROS        TRANSPORTES        AQUAVIÁRIOS        NÃO ESPECIFICADOS ANTERIORMENTE",
    "iss": "S",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "BARRAQUEIRO(A) INDEPENDENTE",
    "cnae": "4712-1/00",
    "descricao": "COMÉRCIO VAREJISTA DE MERCADORIAS EM GERAL, COM PREDOMINÂNCIA DE PRODUTOS ALIMENTÍCIOS - MINIMERCADOS, MERCEARIAS E ARMAZÉNS",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "BENEFICIADOR(A) DE CASTANHA INDEPENDENTE",
    "cnae": "1031-7/00",
    "descricao": "FABRICANTE DE CONSERVAS DE FRUTAS",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "BIKEBOY (CICLISTA MENSAGEIRO) INDEPENDENTE",
    "cnae": "5320-2/02",
    "descricao": "SERVIÇOS DE ENTREGA RÁPIDA",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "BIKE PROPAGANDISTA INDEPENDENTE",
    "cnae": "7319-0/99",
    "descricao": "OUTRAS      ATIVIDADES       DE       PUBLICIDADE       NÃO ESPECIFICADAS ANTERIORMENTE",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "BOLACHEIRO(A)/BISCOITEIRO(A) INDEPENDENTE",
    "cnae": "1092-9/00",
    "descricao": "FABRICAÇÃO DE BISCOITOS E BOLACHAS",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "BOMBEIRO(A) HIDRÁULICO INDEPENDENTE",
    "cnae": "4322-3/01",
    "descricao": "INSTALAÇÕES HIDRÁULICAS, SANITÁRIAS E DE GÁS",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "BONELEIRO(A) (FABRICANTE DE BONÉS) INDEPENDENTE",
    "cnae": "1414-2/00",
    "descricao": "FABRICAÇÃO DE ACESSÓRIOS DO VESTUÁRIO, EXCETO PARA SEGURANÇA E PROTEÇÃO",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "BORDADEIRO(A) INDEPENDENTE",
    "cnae": "1340-5/99",
    "descricao": "OUTROS SERVIÇOS DE ACABAMENTO EM FIOS, TECIDOS, ARTEFATOS TÊXTEIS E PEÇAS DO VESTUÁRIO",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "BORRACHEIRO(A) INDEPENDENTE",
    "cnae": "4520-0/06",
    "descricao": "SERVIÇOS DE BORRACHARIA PARA VEÍCULOS AUTOMOTORES",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "BRITADOR INDEPENDENTE",
    "cnae": "2391-5/01",
    "descricao": "BRITAMENTO DE PEDRAS, EXCETO ASSOCIADO À EXTRAÇÃO",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "CABELEIREIRO(A) INDEPENDENTE",
    "cnae": "9602-5/01",
    "descricao": "CABELEIREIROS, MANICURE E PEDICURE",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "CALAFETADOR(A) INDEPENDENTE",
    "cnae": "4330-4/05",
    "descricao": "APLICAÇÃO DE REVESTIMENTOS E DE RESINAS EM INTERIORES E EXTERIORES",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "CALHEIRO (A) INDEPENDENTE",
    "cnae": "4399-1/99",
    "descricao": "SERVIÇOS  ESPECIALIZADOS  PARA CONSTRUÇÃO  NÃO ESPECIFICADOS ANTERIORMENTE",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "CAMINHONEIRO (A) DE CARGAS NÃO PERIGOSAS,\nINTERMUNICIPAL E INTERESTADUAL INDEPENDENTE",
    "cnae": "4930-2/02",
    "descricao": "TRANSPORTE RODOVIÁRIO DE CARGA, EXCETO PRODUTOS PERIGOSOS E MUDANÇAS,\nINTERMUNICIPAL, INTERESTADUAL E INTERNACIONAL",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "CANTOR(A)/MÚSICO(A) INDEPENDENTE",
    "cnae": "9001-9/02",
    "descricao": "PRODUÇÃO MUSICAL",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "CAPOTEIRO(A) INDEPENDENTE",
    "cnae": "4520-0/08",
    "descricao": "SERVIÇOS DE CAPOTARIA",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "CARPINTEIRO(A) INDEPENDENTE",
    "cnae": "1622-6/99",
    "descricao": "FABRICAÇÃO  DE  OUTROS  ARTIGOS  DE  CARPINTARIA PARA CONSTRUÇÃO",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "CARPINTEIRO(A) INSTALADOR(A) INDEPENDENTE",
    "cnae": "4330-4/02",
    "descricao": "INSTALAÇÃO DE PORTAS, JANELAS, TETOS,\nDIVISÓRIAS E ARMÁRIOS EMBUTIDOS DE QUALQUER MATERIAL",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "CARREGADOR (VEÍCULOS INDEPENDENTE",
    "cnae": "5212-5/00",
    "descricao": "CARGA E DESCARGA",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "CARREGADOR DE MALAS INDEPENDENTE",
    "cnae": "9609-2/99",
    "descricao": "OUTRAS  ATIVIDADES   DE   SERVIÇOS   PESSOAIS   NÃO ESPECIFICADAS ANTERIORMENTE",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "CARROCEIRO - COLETA DE ENTULHOS E RESÍDUOS INDEPENDENTE",
    "cnae": "3811-4/00",
    "descricao": "COLETA DE RESÍDUOS NÃO PERIGOSOS",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "CARROCEIRO - TRANSPORTE DE CARGA INDEPENDENTE",
    "cnae": "4930-2/01",
    "descricao": "TRANSPORTE RODOVIÁRIO DE CARGA, EXCETO PRODUTOS PERIGOSOS E MUDANÇAS, MUNICIPAL",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "CARROCEIRO - TRANSPORTE DE MUDANÇA INDEPENDENTE",
    "cnae": "4930-2/04",
    "descricao": "TRANSPORTE RODOVIÁRIO DE MUDANÇAS",
    "iss": "S",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "CARTAZISTA, PINTOR DE INDEPENDENTE",
    "cnae": "8299-7/99",
    "descricao": "OUTRAS ATIVIDADES DE SERVIÇOS PRESTADOS\nPRINCIPALMENTE ÀS EMPRESAS NÃO ESPECIFICADAS ANTERIORMENTE",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "CERQUEIRO(A) INDEPENDENTE",
    "cnae": "4399-1/99",
    "descricao": "SERVIÇOS  ESPECIALIZADOS  PARA CONSTRUÇÃO  NÃO ESPECIFICADOS ANTERIORMENTE",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "CHAPELEIRO(A) INDEPENDENTE",
    "cnae": "1414-2/00",
    "descricao": "FABRICAÇÃO DE ACESSÓRIOS DO VESTUÁRIO, EXCETO PARA SEGURANÇA E PROTEÇÃO",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "CHAVEIRO(A) INDEPENDENTE",
    "cnae": "9529-1/02",
    "descricao": "CHAVEIROS",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "CHOCOLATEIRO(A) INDEPENDENTE",
    "cnae": "1093-7/01",
    "descricao": "FABRICAÇÃO  DE PRODUTOS DERIVADOS DO  CACAU  E DE CHOCOLATES",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "CHURRASQUEIRO(A) AMBULANTE INDEPENDENTE",
    "cnae": "5612-1/00",
    "descricao": "SERVIÇOS AMBULANTES DE ALIMENTAÇÃO",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "CHURRASQUEIRO(A) EM DOMICÍLIO INDEPENDENTE",
    "cnae": "5620-1/02",
    "descricao": "SERVIÇOS     DE    ALIMENTAÇÃO    PARA    EVENTOS    E RECEPÇÕES - BUFÊ",
    "iss": "S",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "CLICHERISTA INDEPENDENTE",
    "cnae": "1821-1/00",
    "descricao": "SERVIÇOS DE PRÉ-IMPRESSÃO",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "COBRADOR(A) DE DÍVIDAS INDEPENDENTE",
    "cnae": "8291-1/00",
    "descricao": "ATIVIDADES DE COBRANÇAS E INFORMAÇÕES CADASTRAIS",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "COLCHOEIRO(A) INDEPENDENTE",
    "cnae": "3104-7/00",
    "descricao": "FABRICAÇÃO DE COLCHÕES",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "COLETOR DE RESÍDUOS NÃO-PERIGOSOS INDEPENDENTE",
    "cnae": "3811-4/00",
    "descricao": "COLETA DE RESÍDUOS NÃO PERIGOSOS",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "COLOCADOR(A) DE PIERCING INDEPENDENTE",
    "cnae": "9609-2/06",
    "descricao": "SERVIÇOS DE TATUAGEM E COLOCAÇÃO DE PIERCING",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "COLOCADOR(A) DE REVESTIMENTOS INDEPENDENTE",
    "cnae": "4330-4/05",
    "descricao": "APLICAÇÃO DE REVESTIMENTOS E DE RESINAS EM INTERIORES E EXTERIORES",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "COMERCIANTE DE INSETICIDAS E RATICIDAS INDEPENDENTE",
    "cnae": "4789-0/05",
    "descricao": "COMÉRCIO VAREJISTA DE PRODUTOS SANEANTES DOMISSANITÁRIOS",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "COMERCIANTE DE PRODUTOS PARA PISCINAS INDEPENDENTE",
    "cnae": "4789-0/05",
    "descricao": "COMÉRCIO VAREJISTA DE PRODUTOS SANEANTES DOMISSANITÁRIOS",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "COMERCIANTE DE ARTIGOS E ALIMENTOS PARA ANIMAIS DE ESTIMAÇÃO (PET SHOP) INDEPENDENTE (NÃO INCLUI A VENDA DE MEDICAMENTOS)",
    "cnae": "4789-0/04",
    "descricao": "COMÉRCIO VAREJISTA DE ANIMAIS VIVOS E DE\nARTIGOS E ALIMENTOS PARA ANIMAIS DE ESTIMAÇÃO",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "COMERCIANTE DE ARTIGOS DE ARMARINHO INDEPENDENTE",
    "cnae": "4755-5/02",
    "descricao": "COMERCIO VAREJISTA DE ARTIGOS DE ARMARINHO",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "COMERCIANTE DE ARTIGOS DE BEBÊ INDEPENDENTE",
    "cnae": "4789-0/99",
    "descricao": "COMÉRCIO  VAREJISTA  DE  OUTROS  PRODUTOS  NÃO ESPECIFICADOS ANTERIORMENTE",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "COMERCIANTE DE ARTIGOS DE CAÇA, PESCA E CAMPING INDEPENDENTE",
    "cnae": "4763-6/04",
    "descricao": "COMÉRCIO VAREJISTA DE ARTIGOS DE CAÇA, PESCA E CAMPING",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "COMERCIANTE DE ARTIGOS DE CAMA, MESA E BANHO INDEPENDENTE",
    "cnae": "4755-5/03",
    "descricao": "COMERCIO VAREJISTA DE ARTIGOS DE CAMA, MESA E BANHO",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "COMERCIANTE DE ARTIGOS DE COLCHOARIA INDEPENDENTE",
    "cnae": "4754-7/02",
    "descricao": "COMÉRCIO VAREJISTA DE ARTIGOS DE COLCHOARIA",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "COMERCIANTE DE ARTIGOS DE CUTELARIA INDEPENDENTE",
    "cnae": "4759-8/99",
    "descricao": "COMÉRCIO VAREJISTA DE OUTROS ARTIGOS DE USO PESSOAL E DOMÉSTICO NÃO ESPECIFICADOS\nANTERIORMENTE",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "COMERCIANTE DE ARTIGOS DE ILUMINAÇÃO INDEPENDENTE",
    "cnae": "4754-7/03",
    "descricao": "COMÉRCIO VAREJISTA DE ARTIGOS DE ILUMINAÇÃO",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "COMERCIANTE DE ARTIGOS DE JOALHERIA INDEPENDENTE",
    "cnae": "4783-1/01",
    "descricao": "COMÉRCIO VAREJISTA DE ARTIGOS DE JOALHERIA",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "COMERCIANTE DE ARTIGOS DE ÓPTICA INDEPENDENTE",
    "cnae": "4774-1/00",
    "descricao": "COMÉRCIO VAREJISTA DE ARTIGOS DE ÓPTICA",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "COMERCIANTE DE ARTIGOS DE RELOJOARIA INDEPENDENTE",
    "cnae": "4783-1/02",
    "descricao": "COMÉRCIO VAREJISTA DE ARTIGOS DE RELOJOARIA",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "COMERCIANTE DE ARTIGOS DE TAPEÇARIA, CORTINAS E PERSIANAS INDEPENDENTE",
    "cnae": "4759-8/01",
    "descricao": "COMÉRCIO   VAREJISTA  DE  ARTIGOS   DE   TAPEÇARIA, CORTINAS E PERSIANAS",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "COMERCIANTE DE ARTIGOS DE VIAGEM INDEPENDENTE",
    "cnae": "4782-2/02",
    "descricao": "COMÉRCIO VAREJISTA DE ARTIGOS DE VIAGEM",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "COMERCIANTE DE ARTIGOS DO VESTUÁRIO E ACESSÓRIOS INDEPENDENTE",
    "cnae": "4781-4/00",
    "descricao": "COMÉRCIO VAREJISTA DE ARTIGOS DO VESTUÁRIO E ACESSÓRIOS",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "COMERCIANTE DE ARTIGOS ERÓTICOS INDEPENDENTE",
    "cnae": "4789-0/99",
    "descricao": "COMÉRCIO  VAREJISTA  DE  OUTROS  PRODUTOS  NÃO ESPECIFICADOS ANTERIORMENTE",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "COMERCIANTE DE ARTIGOS ESPORTIVOS INDEPENDENTE",
    "cnae": "4763-6/02",
    "descricao": "COMÉRCIO VAREJISTA DE ARTIGOS ESPORTIVOS",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "COMERCIANTE DE ARTIGOS FOTOGRÁFICOS E PARA FILMAGEM INDEPENDENTE",
    "cnae": "4789-0/08",
    "descricao": "COMÉRCIO  VAREJISTA DE ARTIGOS  FOTOGRÁFICOS  E PARA FILMAGEM",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "COMERCIANTE DE ARTIGOS FUNERÁRIOS INDEPENDENTE",
    "cnae": "4789-0/99",
    "descricao": "COMÉRCIO  VAREJISTA  DE  OUTROS  PRODUTOS  NÃO ESPECIFICADOS ANTERIORMENTE",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "COMERCIANTE DE ARTIGOS MÉDICOS E ORTOPÉDICOS INDEPENDENTE",
    "cnae": "4773-3/00",
    "descricao": "COMÉRCIO VAREJISTA DE ARTIGOS MÉDICOS E ORTOPÉDICOS",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "COMERCIANTE DE ARTIGOS PARA HABITAÇÃO INDEPENDENTE",
    "cnae": "4759-8/99",
    "descricao": "COMÉRCIO VAREJISTA DE OUTROS ARTIGOS DE USO PESSOAL E DOMÉSTICO NÃO ESPECIFICADOS\nANTERIORMENTE",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "COMERCIANTE DE ARTIGOS USADOS INDEPENDENTE",
    "cnae": "4785-7/99",
    "descricao": "COMÉRCIO VAREJISTA DE OUTROS ARTIGOS USADOS",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "COMERCIANTE DE BEBIDAS INDEPENDENTE",
    "cnae": "4723-7/00",
    "descricao": "COMÉRCIO VAREJISTA DE BEBIDAS",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "COMERCIANTE    DE    BICICLETAS    E    TRICICLOS;    PEÇAS    E ACESSÓRIOS INDEPENDENTE",
    "cnae": "4763-6/03",
    "descricao": "COMÉRCIO VAREJISTA DE BICICLETAS E TRICICLOS; PEÇAS E ACESSÓRIOS",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "COMERCIANTE DE SUVENIRES, BIJUTERIAS E ARTESANATOS INDEPENDENTE",
    "cnae": "4789-0/01",
    "descricao": "COMÉRCIO VAREJISTA DE SUVENIRES, BIJUTERIAS E ARTESANATOS",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "COMERCIANTE DE BRINQUEDOS E ARTIGOS RECREATIVOS INDEPENDENTE",
    "cnae": "4763-6/01",
    "descricao": "COMÉRCIO VAREJISTA DE BRINQUEDOS E ARTIGOS RECREATIVOS",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "COMERCIANTE DE CAL, AREIA, PEDRA BRITADA, TIJOLOS E TELHAS INDEPENDENTE",
    "cnae": "4744-0/04",
    "descricao": "COMÉRCIO VAREJISTA DE CAL, AREIA, PEDRA BRITADA, TIJOLOS E TELHAS",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "COMERCIANTE DE CALÇADOS INDEPENDENTE",
    "cnae": "4782-2/01",
    "descricao": "COMÉRCIO VAREJISTA DE CALÇADOS",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "COMERCIANTE DE CARVÃO E LENHA INDEPENDENTE",
    "cnae": "4789-0/99",
    "descricao": "COMÉRCIO  VAREJISTA  DE  OUTROS  PRODUTOS  NÃO ESPECIFICADOS ANTERIORMENTE",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "COMERCIANTE DE CESTAS DE CAFÉ DA MANHÃ INDEPENDENTE",
    "cnae": "4729-6/99",
    "descricao": "COMÉRCIO VAREJISTA DE PRODUTOS ALIMENTÍCIOS EM GERAL OU ESPECIALIZADO EM PRODUTOS\nALIMENTÍCIOS NÃO ESPECIFICADOS ANTERIORMENTE",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "COMERCIANTE DE COSMÉTICOS E ARTIGOS DE PERFUMARIA INDEPENDENTE",
    "cnae": "4772-5/00",
    "descricao": "COMÉRCIO VAREJISTA DE COSMÉTICOS, PRODUTOS DE PERFUMARIA E DE HIGIENE PESSOAL",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "COMERCIANTE DE DISCOS, CDS, DVDS E FITAS INDEPENDENTE",
    "cnae": "4762-8/00",
    "descricao": "COMÉRCIO VAREJISTA DE DISCOS, CDS, DVDS E FITAS",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "COMERCIANTE DE ELETRODOMÉSTICOS E EQUIPAMENTOS DE ÁUDIO E VÍDEO INDEPENDENTE",
    "cnae": "4753-9/00",
    "descricao": "COMÉRCIO VAREJISTA ESPECIALIZADO DE\nELETRODOMÉSTICOS E EQUIPAMENTOS DE ÁUDIO E VÍDEO",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "COMERCIANTE DE EMBALAGENS INDEPENDENTE",
    "cnae": "4789-0/99",
    "descricao": "COMÉRCIO  VAREJISTA  DE  OUTROS  PRODUTOS  NÃO ESPECIFICADOS ANTERIORMENTE",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "COMERCIANTE DE EQUIPAMENTOS DE TELEFONIA E COMUNICAÇÃO INDEPENDENTE",
    "cnae": "4752-1/00",
    "descricao": "COMÉRCIO VAREJISTA ESPECIALIZADO DE\nEQUIPAMENTOS DE TELEFONIA E COMUNICAÇÃO",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "COMERCIANTE     DE     EQUIPAMENTOS     E     SUPRIMENTOS     DE INFORMÁTICA INDEPENDENTE",
    "cnae": "4751-2/01",
    "descricao": "COMÉRCIO VAREJISTA ESPECIALIZADO DE\nEQUIPAMENTOS E SUPRIMENTOS DE INFORMÁTICA",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "COMERCIANTE DE EQUIPAMENTOS PARA ESCRITÓRIO INDEPENDENTE",
    "cnae": "4789-0/07",
    "descricao": "COMÉRCIO VAREJISTA DE EQUIPAMENTOS PARA ESCRITÓRIO",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "COMERCIANTE DE FERRAGENS E FERRAMENTAS INDEPENDENTE",
    "cnae": "4744-0/01",
    "descricao": "COMÉRCIO VAREJISTA DE FERRAGENS E FERRAMENTAS",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "COMERCIANTE DE FLORES, PLANTAS E FRUTAS ARTIFICIAIS INDEPENDENTE",
    "cnae": "4789-0/99",
    "descricao": "COMÉRCIO  VAREJISTA  DE  OUTROS  PRODUTOS  NÃO ESPECIFICADOS ANTERIORMENTE",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "COMERCIANTE DE INSTRUMENTOS MUSICAIS E ACESSÓRIOS INDEPENDENTE",
    "cnae": "4756-3/00",
    "descricao": "COMÉRCIO VAREJISTA ESPECIALIZADO DE INSTRUMENTOS MUSICAIS E ACESSÓRIOS",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "COMERCIANTE DE LATICÍNIOS INDEPENDENTE",
    "cnae": "4721-1/03",
    "descricao": "COMÉRCIO VAREJISTA DE LATICÍNIOS E FRIOS",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "COMERCIANTE DE LUBRIFICANTES INDEPENDENTE",
    "cnae": "4732-6/00",
    "descricao": "COMÉRCIO VAREJISTA DE LUBRIFICANTES",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "COMERCIANTE DE MADEIRA E ARTEFATOS INDEPENDENTE",
    "cnae": "4744-0/02",
    "descricao": "COMÉRCIO VAREJISTA DE MADEIRA E ARTEFATOS",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "COMERCIANTE DE MATERIAIS DE CONSTRUÇÃO EM GERAL INDEPENDENTE",
    "cnae": "4744-0/99",
    "descricao": "COMÉRCIO VAREJISTA DE MATERIAIS DE CONSTRUÇÃO EM GERAL",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "COMERCIANTE DE MATERIAIS HIDRÁULICOS INDEPENDENTE",
    "cnae": "4744-0/03",
    "descricao": "COMÉRCIO VAREJISTA DE MATERIAIS HIDRÁULICOS",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "COMERCIANTE DE MATERIAL ELÉTRICO INDEPENDENTE",
    "cnae": "4742-3/00",
    "descricao": "COMÉRCIO VAREJISTA DE MATERIAL ELÉTRICO",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "COMERCIANTE DE MIUDEZAS E QUINQUILHARIAS INDEPENDENTE",
    "cnae": "4713-0/02",
    "descricao": "LOJAS DE VARIEDADES, EXCETO LOJAS DE DEPARTAMENTOS OU MAGAZINES",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "COMERCIANTE DE MOLDURAS E QUADROS INDEPENDENTE",
    "cnae": "4789-0/99",
    "descricao": "COMÉRCIO  VAREJISTA  DE  OUTROS  PRODUTOS  NÃO ESPECIFICADOS ANTERIORMENTE",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "COMERCIANTE DE MÓVEIS INDEPENDENTE",
    "cnae": "4754-7/01",
    "descricao": "COMÉRCIO VAREJISTA DE MÓVEIS",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "COMERCIANTE DE OBJETOS DE ARTE INDEPENDENTE",
    "cnae": "4789-0/03",
    "descricao": "COMÉRCIO VAREJISTA DE OBJETOS DE ARTE",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "COMERCIANTE DE PEÇAS E ACESSÓRIOS NOVOS PARA MOTOCICLETAS E MOTONONETAS INDEPENDENTE",
    "cnae": "4541-2/06",
    "descricao": "COMÉRCIO A VAREJO DE PEÇAS E ACESSÓRIOS NOVOS PARA MOTOCICLETAS E MOTONETAS",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "COMERCIANTE DE PEÇAS E ACESSÓRIOS NOVOS PARA VEÍCULOS AUTOMOTORES INDEPENDENTE",
    "cnae": "4530-7/03",
    "descricao": "COMÉRCIO A VAREJO DE PEÇAS E ACESSÓRIOS NOVOS PARA VEÍCULOS AUTOMOTORES",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "COMERCIANTE   DE   PEÇAS   E   ACESSÓRIOS   PARA   APARELHOS ELETROELETRÔNICOS PARA USO DOMÉSTICO INDEPENDENTE",
    "cnae": "4757-1/00",
    "descricao": "COMÉRCIO VAREJISTA ESPECIALIZADO DE PEÇAS E ACESSÓRIOS PARA APARELHOS\nELETROELETRÔNICOS PARA USO DOMÉSTICO, EXCETO INFORMÁTICA E COMUNICAÇÃO",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "COMERCIANTE DE PEÇAS E ACESSÓRIOS USADOS PARA MOTOCICLETAS E MOTONONETAS INDEPENDENTE",
    "cnae": "4541-2/07",
    "descricao": "COMÉRCIO   A   VAREJO   DE   PEÇAS   E   ACESSÓRIOS USADOS PARA MOTOCICLETAS E MOTONETAS",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "COMERCIANTE DE PEÇAS E ACESSÓRIOS USADOS PARA VEÍCULOS AUTOMOTORES INDEPENDENTE",
    "cnae": "4530-7/04",
    "descricao": "COMÉRCIO   A   VAREJO   DE   PEÇAS   E   ACESSÓRIOS USADOS PARA VEÍCULOS AUTOMOTORES",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "COMERCIANTE DE PERUCAS INDEPENDENTE",
    "cnae": "4789-0/99",
    "descricao": "COMÉRCIO  VAREJISTA  DE  OUTROS  PRODUTOS  NÃO ESPECIFICADOS ANTERIORMENTE",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "COMERCIANTE DE PLANTAS, FLORES NATURAIS, VASOS E ADUBOS INDEPENDENTE",
    "cnae": "4789-0/02",
    "descricao": "COMÉRCIO VAREJISTA DE PLANTAS E FLORES NATURAIS",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "COMERCIANTE DE PNEUMÁTICOS E CÂMARAS-DE-AR INDEPENDENTE",
    "cnae": "4530-7/05",
    "descricao": "COMÉRCIO A VAREJO DE PNEUMÁTICOS E CÂMARASDE-AR",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "COMERCIANTE DE PRODUTOS DE HIGIENE PESSOAL INDEPENDENTE",
    "cnae": "4772-5/00",
    "descricao": "COMÉRCIO VAREJISTA DE COSMÉTICOS, PRODUTOS DE PERFUMARIA E DE HIGIENE PESSOAL",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "COMERCIANTE DE PRODUTOS DE LIMPEZA INDEPENDENTE",
    "cnae": "4789-0/05",
    "descricao": "COMÉRCIO VAREJISTA DE PRODUTOS SANEANTES DOMISSANITÁRIOS",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "COMERCIANTE DE PRODUTOS DE PANIFICAÇÃO INDEPENDENTE",
    "cnae": "4721-1/02",
    "descricao": "PADARIA E CONFEITARIA COM PREDOMINÂNCIA DE REVENDA",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "COMERCIANTE DE PRODUTOS DE TABACARIA INDEPENDENTE",
    "cnae": "4729-6/01",
    "descricao": "TABACARIA",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "COMERCIANTE DE PRODUTOS NATURAIS INDEPENDENTE",
    "cnae": "4729-6/99",
    "descricao": "COMÉRCIO VAREJISTA DE PRODUTOS ALIMENTÍCIOS EM GERAL OU ESPECIALIZADO EM PRODUTOS\nALIMENTÍCIOS NÃO ESPECIFICADOS ANTERIORMENTE",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "COMERCIANTE DE PRODUTOS PARA FESTAS E NATAL INDEPENDENTE",
    "cnae": "4789-0/99",
    "descricao": "COMÉRCIO  VAREJISTA  DE  OUTROS  PRODUTOS  NÃO ESPECIFICADOS ANTERIORMENTE",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "COMERCIANTE DE PRODUTOS RELIGIOSOS INDEPENDENTE",
    "cnae": "4789-0/99",
    "descricao": "COMÉRCIO  VAREJISTA  DE  OUTROS  PRODUTOS  NÃO ESPECIFICADOS ANTERIORMENTE",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "COMERCIANTE DE REDES PARA DORMIR INDEPENDENTE",
    "cnae": "4789-0/99",
    "descricao": "COMÉRCIO  VAREJISTA  DE  OUTROS  PRODUTOS  NÃO ESPECIFICADOS ANTERIORMENTE",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "COMERCIANTE DE SISTEMA DE SEGURANÇA RESIDENCIAL INDEPENDENTE",
    "cnae": "4759-8/99",
    "descricao": "COMÉRCIO VAREJISTA DE OUTROS ARTIGOS DE USO PESSOAL E DOMÉSTICO NÃO ESPECIFICADOS\nANTERIORMENTE",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "COMERCIANTE DE TECIDOS INDEPENDENTE",
    "cnae": "4755-5/01",
    "descricao": "COMÉRCIO VAREJISTA DE TECIDOS",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "COMERCIANTE DE TINTAS E MATERIAIS PARA PINTURA INDEPENDENTE",
    "cnae": "4741-5/00",
    "descricao": "COMÉRCIO VAREJISTA DE TINTAS E MATERIAIS PARA PINTURA",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "COMERCIANTE DE TOLDOS E PAPEL DE PAREDE INDEPENDENTE",
    "cnae": "4759-8/99",
    "descricao": "COMÉRCIO VAREJISTA DE OUTROS ARTIGOS DE USO PESSOAL E DOMÉSTICO NÃO ESPECIFICADOS\nANTERIORMENTE",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "COMERCIANTE DE VIDROS INDEPENDENTE",
    "cnae": "4743-1/00",
    "descricao": "COMÉRCIO VAREJISTA DE VIDROS",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "COMPOTEIRO(A) INDEPENDENTE",
    "cnae": "1031-7/00",
    "descricao": "FABRICAÇÃO DE CONSERVAS DE FRUTAS",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "CONFECCIONADOR(A) DE CARIMBOS INDEPENDENTE",
    "cnae": "3299-0/02",
    "descricao": "FABRICAÇÃO  DE  CANETAS,  LÁPIS  E  OUTROS ARTIGOS PARA ESCRITÓRIO",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "CONFEITEIRO(A) INDEPENDENTE",
    "cnae": "1091-1/02",
    "descricao": "FABRICAÇÃO DE PRODUTOS DE PADARIA E\nCONFEITARIA COM PREDOMINÂNCIA DE PRODUÇÃO PRÓPRIA.",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "COSTUREIRO(A) DE ROUPAS, EXCETO SOB MEDIDA, INDEPENDENTE",
    "cnae": "1412-6/01",
    "descricao": "CONFECÇÃO DE PEÇAS DE VESTUÁRIO, EXCETO\nROUPAS ÍNTIMAS E AS CONFECCIONADAS SOB MEDIDA",
    "iss": "S",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "COSTUREIRO(A) DE ROUPAS SOB MEDIDA INDEPENDENTE",
    "cnae": "1412-6/02",
    "descricao": "CONFECÇÃO  SOB  MEDIDA DE  PEÇAS  DO  VESTUÁRIO, EXCETO ROUPAS ÍNTIMAS",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "COZINHEIRO(A) QUE FORNECE REFEIÇÕES PRONTAS E EMBALADAS PARA CONSUMO INDEPENDENTE",
    "cnae": "5620-1/04",
    "descricao": "FORNECIMENTO DE ALIMENTOS PREPARADOS\nPREPONDERANTEMENTE PARA CONSUMO DOMICILIAR",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "CRIADOR(A) DE ANIMAIS DOMÉSTICOS INDEPENDENTE",
    "cnae": "0159-8/02",
    "descricao": "CRIAÇÃO DE ANIMAIS DE ESTIMAÇÃO",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "CRIADOR(A) DE PEIXES ORNAMENTAIS EM ÁGUA DOCE INDEPENDENTE",
    "cnae": "0322-1/04",
    "descricao": "CRIAÇÃO DE PEIXES ORNAMENTAIS EM ÁGUA DOCE",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "CRIADOR(A) DE PEIXES ORNAMENTAIS EM ÁGUA SALGADA INDEPENDENTE",
    "cnae": "0321-3/04",
    "descricao": "CRIAÇÃO DE PEIXES ORNAMENTAIS EM ÁGUA SALGADA E SALOBRA",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "CROCHETEIRO(A) INDEPENDENTE",
    "cnae": "1422-3/00",
    "descricao": "FABRICAÇÃO DE ARTIGOS DO VESTUÁRIO,\nPRODUZIDOS EM MALHARIAS E TRICOTAGENS, EXCETO MEIAS",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "CUIDADOR(A) DE ANIMAIS (PET SITTER) INDEPENDENTE",
    "cnae": "9609-2/08",
    "descricao": "HIGIENE E EMBELEZAMENTO DE ANIMAIS DOMÉSTICOS",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "CUIDADOR(A) DE IDOSOS E ENFERMOS INDEPENDENTE",
    "cnae": "8712-3/00",
    "descricao": "ATIVIDADES DE FORNECIMENTO DE INFRA-\nESTRUTURA DE APOIO E ASSISTÊNCIA A PACIENTE NO DOMICÍLIO",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "CUNHADOR(A) DE MOEDAS E MEDALHAS INDEPENDENTE",
    "cnae": "3211-6/03",
    "descricao": "CUNHAGEM DE MOEDAS E MEDALHAS",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "CURTIDOR DE COURO INDEPENDENTE",
    "cnae": "1510-6/00",
    "descricao": "CURTIMENTO E OUTRAS PREPARAÇÕES DE COURO",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "CUSTOMIZADOR(A) DE ROUPAS INDEPENDENTE",
    "cnae": "1340-5/99",
    "descricao": "OUTROS SERVIÇOS DE ACABAMENTO EM FIOS, TECIDOS, ARTEFATOS TÊXTEIS E PEÇAS DO VESTUÁRIO",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "DEPILADOR(A) INDEPENDENTE",
    "cnae": "9602-5/02",
    "descricao": "ATIVIDADES  DE  ESTÉTICA  E  OUTROS  SERVIÇOS  DE CUIDADOS COM A BELEZA",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "DIARISTA INDEPENDENTE",
    "cnae": "9700-5/00",
    "descricao": "SERVIÇOS DOMÉSTICOS",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "DIGITADOR(A) INDEPENDENTE",
    "cnae": "8219-9/99",
    "descricao": "PREPARAÇÃO DE DOCUMENTOS E SERVIÇOS ESPECIALIZADOS DE APOIO ADMINISTRATIVO NÃO ESPECIFICADOS ANTERIORMENTE",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "DISC JOCKEY (DJ) OU VIDEO JOCKEY (VJ) INDEPENDENTE",
    "cnae": "9001-9/06",
    "descricao": "ATIVIDADES DE SONORIZAÇÃO E DE ILUMINAÇÃO",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "DISTRIBUIDOR(A) DE ÁGUA POTÁVEL EM CAMINHÃO PIPA INDEPENDENTE",
    "cnae": "3600-6/02",
    "descricao": "DISTRIBUIÇÃO DE ÁGUA POR CAMINHÕES",
    "iss": "S",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "DOCEIRO(A) INDEPENDENTE",
    "cnae": "5620-1/04",
    "descricao": "FORNECIMENTO DE ALIMENTOS PREPARADOS\nPREPONDERANTEMENTE PARA CONSUMO DOMICILIAR",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "DUBLADOR(A) INDEPENDENTE",
    "cnae": "5912-0/01",
    "descricao": "SERVIÇOS DE DUBLAGEM",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "EDITOR(A) DE JORNAIS DIÁRIOS INDEPENDENTE",
    "cnae": "5812-3/01",
    "descricao": "EDITOR DE JORNAIS DIÁRIOS",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "EDITOR(A) DE JORNAIS NÃO DIÁRIOS INDEPENDENTE",
    "cnae": "5812-3/02",
    "descricao": "EDITOR DE JORNAIS NÃO DIÁRIOS",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "EDITOR(A) DE LISTA DE DADOS E DE OUTRAS INFORMAÇÕES INDEPENDENTE",
    "cnae": "5819-1/00",
    "descricao": "EDIÇÃO DE CADASTROS, LISTAS E DE OUTROS PRODUTOS GRÁFICOS",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "EDITOR(A) DE LIVROS INDEPENDENTE",
    "cnae": "5811-5/00",
    "descricao": "EDIÇÃO DE LIVROS",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "EDITOR(A) DE REVISTAS INDEPENDENTE",
    "cnae": "5813-1/00",
    "descricao": "EDIÇÃO DE REVISTAS",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "EDITOR(A) DE VÍDEO INDEPENDENTE",
    "cnae": "5912-0/99",
    "descricao": "ATIVIDADES DE PÓS-PRODUÇÃO CINEMATOGRÁFICA, DE VÍDEOS E DE PROGRAMAS DE TELEVISÃO NÃO ESPECIFICADAS ANTERIORMENTE",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "ELETRICISTA DE AUTOMÓVEIS INDEPENDENTE",
    "cnae": "4520-0/03",
    "descricao": "SERVIÇOS DE MANUTENÇÃO E REPARAÇÃO ELÉTRICA DE VEÍCULOS AUTOMOTORES",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "ELETRICISTA       EM       RESIDÊNCIAS       E      ESTABELECIMENTOS COMERCIAIS INDEPENDENTE",
    "cnae": "4321-5/00",
    "descricao": "INSTALAÇÃO E MANUTENÇÃO ELÉTRICA",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "ENCADERNADOR(A)/\nPLASTIFICADOR(A) INDEPENDENTE",
    "cnae": "1822-9/01",
    "descricao": "SERVIÇOS DE ENCADERNAÇÃO E PLASTIFICAÇÃO",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "ENCANADOR INDEPENDENTE",
    "cnae": "4322-3/01",
    "descricao": "INSTALAÇÕES HIDRÁULICAS, SANITÁRIAS E DE GÁS",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "ENGRAXATE INDEPENDENTE",
    "cnae": "9609-2/99",
    "descricao": "OUTRAS  ATIVIDADES   DE   SERVIÇOS   PESSOAIS   NÃO ESPECIFICADAS ANTERIORMENTE",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "ENTREGADOR DE MALOTES INDEPENDENTE",
    "cnae": "5320-2/01",
    "descricao": "SERVIÇOS DE MALOTE NÃO REALIZADOS PELO CORREIO NACIONAL",
    "iss": "S",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "ENVASADOR(A) E EMPACOTADOR(A) INDEPENDENTE",
    "cnae": "8292-0/00",
    "descricao": "ENVASAMENTO E EMPACOTAMENTO SOB CONTRATO",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "ESTAMPADOR(A) DE PEÇAS DO VESTUÁRIO INDEPENDENTE",
    "cnae": "1340-5/01",
    "descricao": "ESTAMPARIA   E   TEXTURIZAÇÃO   EM   FIOS,   TECIDOS, ARTEFATOS TÊXTEIS E PEÇAS DO VESTUÁRIO",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "ESTETICISTA DE ANIMAIS DOMÉSTICOS INDEPENDENTE",
    "cnae": "9609-2/08",
    "descricao": "HIGIENE E EMBELEZAMENTO DE ANIMAIS DOMÉSTICOS",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "ESTETICISTA INDEPENDENTE",
    "cnae": "9602-5/02",
    "descricao": "ATIVIDADES  DE  ESTÉTICA  E  OUTROS  SERVIÇOS  DE CUIDADOS COM A BELEZA",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "ESTOFADOR(A) INDEPENDENTE",
    "cnae": "9529-1/05",
    "descricao": "REPARAÇÃO DE ARTIGOS DO MOBILIÁRIO",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "COMERCIANTE DE ARTIGOS DE CUTELARIA INDEPENDENTE",
    "cnae": "1071-6/00",
    "descricao": "FABRICAÇÃO DE AÇÚCAR EM BRUTO",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "FABRICANTE DE AMENDOIM E CASTANHA DE CAJU TORRADOS E SALGADOS INDEPENDENTE",
    "cnae": "1031-7/00",
    "descricao": "FABRICANTE DE CONSERVAS DE FRUTAS",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "FABRICANTE DE ALIMENTOS PRONTOS CONGELADOS INDEPENDENTE",
    "cnae": "1096-1/00",
    "descricao": "FABRICAÇÃO DE ALIMENTOS E PRATOS PRONTOS",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "FABRICANTE DE AMIDO E FÉCULAS DE VEGETAIS INDEPENDENTE",
    "cnae": "1065-1/01",
    "descricao": "FABRICAÇÃO DE AMIDOS E FÉCULAS DE VEGETAIS",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "FABRICANTE DE ARTEFATOS DE FUNILARIA INDEPENDENTE",
    "cnae": "2532-2/01",
    "descricao": "PRODUÇÃO DE ARTEFATOS ESTAMPADOS DE METAL",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "FABRICANTE DE ARTEFATOS ESTAMPADOS DE METAL, SOB ENCOMENDA OU NÃO, INDEPENDENTE",
    "cnae": "2532-2/01",
    "descricao": "PRODUÇÃO DE ARTEFATOS ESTAMPADOS DE METAL",
    "iss": "S",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "FABRICANTE DE ARTEFATOS PARA PESCA E ESPORTE INDEPENDENTE",
    "cnae": "3230-2/00",
    "descricao": "FABRICAÇÃO DE ARTEFATOS PARA PESCA E ESPORTE",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "FABRICANTE DE ARTEFATOS TÊXTEIS PARA USO DOMÉSTICO INDEPENDENTE",
    "cnae": "1351-1/00",
    "descricao": "FABRICAÇÃO DE ARTEFATOS TÊXTEIS PARA USO DOMÉSTICO",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "FABRICANTE DE ARTIGOS DE CUTELARIA INDEPENDENTE",
    "cnae": "2541-1/00",
    "descricao": "FABRICAÇÃO DE ARTIGOS DE CUTELARIA",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "FABRICANTE DE AVIAMENTOS PARA COSTURA INDEPENDENTE",
    "cnae": "3299-0/05",
    "descricao": "FABRICAÇÃO DE AVIAMENTOS PARA COSTURA",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "FABRICANTE DE BALAS, CONFEITOS E FRUTAS CRISTALIZADAS INDEPENDENTE",
    "cnae": "1093-7/02",
    "descricao": "FABRICAÇÃO DE FRUTAS CRISTALIZADAS, BALAS E SEMELHANTES",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "FABRICANTE DE BOLSAS/BOLSEIRO INDEPENDENTE",
    "cnae": "1521-1/00",
    "descricao": "FABRICAÇÃO DE ARTIGOS PARA VIAGEM, BOLSAS E SEMELHANTES DE QUALQUER MATERIAL",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "FABRICANTE DE BRINQUEDOS NÃO ELETRÔNICOS INDEPENDENTE",
    "cnae": "3240-0/99",
    "descricao": "FABRICAÇÃO DE OUTROS BRINQUEDOS E JOGOS\nRECREATIVOS NÃO ESPECIFICADOS ANTERIORMENTE",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "FABRICANTE DE CALÇADOS DE BORRACHA, MADEIRA E TECIDOS E FIBRAS INDEPENDENTE",
    "cnae": "1539-4/00",
    "descricao": "FABRICAÇÃO DE CALÇADOS DE MATERIAIS NÃO ESPECIFICADOS ANTERIORMENTE",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "FABRICANTE DE CALÇADOS DE COURO INDEPENDENTE",
    "cnae": "1531-9/01",
    "descricao": "FABRICAÇÃO DE CALÇADOS DE COURO",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "FABRICANTE DE CHÁ INDEPENDENTE",
    "cnae": "1099-6/05",
    "descricao": "FABRICAÇÃO DE PRODUTOS PARA INFUSÃO (CHÁ, MATE ETC.)",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "FABRICANTE DE CINTOS/CINTEIRO INDEPENDENTE",
    "cnae": "1414-2/00",
    "descricao": "FABRICAÇÃO DE ACESSÓRIOS DO VESTUÁRIO, EXCETO PARA SEGURANÇA E PROTEÇÃO",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "FABRICANTE DE CONSERVAS DE LEGUMES E OUTROS VEGETAIS INDEPENDENTE",
    "cnae": "1032-5/99",
    "descricao": "FABRICAÇÃO DE CONSERVAS DE LEGUMES E OUTROS VEGETAIS, EXCETO PALMITO",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "FABRICANTE DE EMBALAGENS DE CARTOLINA E PAPEL-CARTÃO INDEPENDENTE",
    "cnae": "1732-0/00",
    "descricao": "FABRICAÇÃO DE EMBALAGENS DE CARTOLINA E PAPEL-CARTÃO",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "FABRICANTE DE EMBALAGENS DE MADEIRA INDEPENDENTE",
    "cnae": "1623-4/00",
    "descricao": "FABRICAÇÃO   DE   ARTEFATOS   DE   TANOARIA   E   DE EMBALAGENS DE MADEIRA",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "FABRICANTE DE EMBALAGENS DE PAPEL INDEPENDENTE",
    "cnae": "1731-1/00",
    "descricao": "FABRICAÇÃO DE EMBALAGENS DE PAPEL",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "FABRICANTE DE ESPECIARIAS INDEPENDENTE",
    "cnae": "1095-3/00",
    "descricao": "FABRICAÇÃO DE ESPECIARIAS, MOLHOS, TEMPEROS E CONDIMENTOS",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "FABRICANTE DE CONSERVAS DE FRUTAS INDEPENDENTE",
    "cnae": "1031-7/00",
    "descricao": "FABRICAÇÃO DE CONSERVAS DE FRUTAS",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "FABRICANTE DE ESQUADRIAS METÁLICAS, SOB ENCOMENDA OU NÃO, INDEPENDENTE",
    "cnae": "2512-8/00",
    "descricao": "FABRICAÇÃO DE ESQUADRIAS DE METAL",
    "iss": "S",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "FABRICANTE DE FIOS DE ALGODÃO INDEPENDENTE",
    "cnae": "1311-1/00",
    "descricao": "PREPARAÇÃO E FIAÇÃO DE FIBRAS DE ALGODÃO",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "FABRICANTE DE FIOS DE LINHO, RAMI, JUTA, SEDA E LÃ INDEPENDENTE",
    "cnae": "1312-0/00",
    "descricao": "PREPARAÇÃO E FIAÇÃO DE FIBRAS TÊXTEIS NATURAIS, EXCETO ALGODÃO",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "FABRICANTE DE FUMO E DERIVADOS DO FUMO INDEPENDENTE",
    "cnae": "1220-4/99",
    "descricao": "FABRICAÇÃO DE OUTROS PRODUTOS DO FUMO, EXCETO CIGARROS, CIGARRILHAS E CHARUTOS",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "FABRICANTE DE GELÉIA DE MOCOTÓ INDEPENDENTE",
    "cnae": "1099-6/99",
    "descricao": "FABRICAÇÃO DE OUTROS PRODUTOS ALIMENTÍCIOS NÃO ESPECIFICADOS ANTERIORMENTE",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "FABRICANTE DE GELO COMUM INDEPENDENTE",
    "cnae": "1099-6/04",
    "descricao": "FABRICAÇÃO DE GELO COMUM",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "FABRICANTE DE GUARDA-CHUVAS E SIMILARES INDEPENDENTE",
    "cnae": "3299-0/01",
    "descricao": "FABRICAÇÃO DE GUARDA-CHUVAS E SIMILARES",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "FABRICANTE DE GUARDANAPOS E COPOS DE PAPEL INDEPENDENTE",
    "cnae": "1742-7/99",
    "descricao": "FABRICAÇÃO DE PRODUTOS DE PAPEL PARA USO DOMÉSTICO E HIGIÊNICO-SANITÁRIO NÃO\nESPECIFICADOS ANTERIORMENTE",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "FABRICANTE DE INSTRUMENTOS MUSICAIS INDEPENDENTE",
    "cnae": "3220-5/00",
    "descricao": "FABRICAÇÃO DE INSTRUMENTOS MUSICAIS, PEÇAS E ACESSÓRIOS",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "FABRICANTE DE JOGOS RECREATIVOS INDEPENDENTE",
    "cnae": "3240-0/99",
    "descricao": "FABRICAÇÃO DE OUTROS BRINQUEDOS E JOGOS\nRECREATIVOS NÃO ESPECIFICADOS ANTERIORMENTE",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "FABRICANTE DE LATICÍNIOS INDEPENDENTE",
    "cnae": "1052-0/00",
    "descricao": "FABRICAÇÃO DE LATICÍNIOS",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "FABRICANTE DE LETREIROS, PLACAS E PAINÉIS NÃO LUMINOSOS, SOB ENCOMENDA OU NÃO, INDEPENDENTE",
    "cnae": "3299-0/03",
    "descricao": "FABRICAÇÃO DE LETRAS, LETREIROS E PLACAS DE QUALQUER MATERIAL, EXCETO LUMINOSOS",
    "iss": "S",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "FABRICANTE DE LUMINÁRIAS E OUTROS EQUIPAMENTOS DE ILUMINAÇÃO INDEPENDENTE",
    "cnae": "2740-6/02",
    "descricao": "FABRICAÇÃO        DE        LUMINÁRIAS        E        OUTROS EQUIPAMENTOS DE ILUMINAÇÃO",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "FABRICANTE DE MALAS INDEPENDENTE",
    "cnae": "1521-1/00",
    "descricao": "FABRICAÇÃO DE ARTIGOS PARA VIAGEM, BOLSAS E SEMELHANTES DE QUALQUER MATERIAL",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "FABRICANTE DE MASSAS ALIMENTÍCIAS INDEPENDENTE",
    "cnae": "1094-5/00",
    "descricao": "FABRICAÇÃO DE MASSAS ALIMENTÍCIAS",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "FABRICANTE DE MEIAS INDEPENDENTE",
    "cnae": "1421-5/00",
    "descricao": "FABRICAÇÃO DE MEIAS",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "FABRICANTE DE MOCHILAS E CARTEIRAS INDEPENDENTE",
    "cnae": "1521-1/00",
    "descricao": "FABRICAÇÃO DE ARTIGOS PARA VIAGEM, BOLSAS E SEMELHANTES DE QUALQUER MATERIAL",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "FABRICANTE DE PAINÉIS E LETREIROS LUMINOSOS INDEPENDENTE",
    "cnae": "3299-0/04",
    "descricao": "FABRICAÇÃO DE PAINÉIS E LETREIROS LUMINOSOS",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "FABRICANTE DE PÃO DE QUEIJO CONGELADO INDEPENDENTE",
    "cnae": "1091-1/01",
    "descricao": "FABRICAÇÃO DE PRODUTOS DE PANIFICAÇÃO INDUSTRIAL",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "FABRICANTE DE PAPEL INDEPENDENTE",
    "cnae": "1721-4/00",
    "descricao": "FABRICAÇÃO DE PAPEL",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "FABRICANTE DE PARTES DE PEÇAS DO VESTUÁRIO - FACÇÃO INDEPENDENTE",
    "cnae": "1412-6/03",
    "descricao": "FACÇÃO DE PEÇAS DO VESTUÁRIO, EXCETO ROUPAS ÍNTIMAS",
    "iss": "S",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "FABRICANTE DE PARTES DE ROUPAS ÍNTIMAS - FACÇÃO INDEPENDENTE",
    "cnae": "1411-8/02",
    "descricao": "FACÇÃO DE ROUPAS ÍNTIMAS",
    "iss": "S",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "FABRICANTE DE PARTES DE ROUPAS PROFISSIONAIS - FACÇÃO INDEPENDENTE",
    "cnae": "1413-4/03",
    "descricao": "FACÇÃO DE ROUPAS PROFISSIONAIS",
    "iss": "S",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "FABRICANTE DE PARTES PARA CALÇADOS INDEPENDENTE",
    "cnae": "1540-8/00",
    "descricao": "FABRICAÇÃO DE PARTES PARA CALÇADOS, DE QUALQUER MATERIAL",
    "iss": "S",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "FABRICANTE DE POLPAS DE FRUTAS INDEPENDENTE",
    "cnae": "1031-7/00",
    "descricao": "FABRICAÇÃO DE CONSERVAS DE FRUTAS",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "FABRICANTE DE PRODUTOS DE SOJA INDEPENDENTE",
    "cnae": "1099-6/99",
    "descricao": "FABRICAÇÃO DE OUTROS PRODUTOS ALIMENTÍCIOS NÃO ESPECIFICADOS ANTERIORMENTE",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "FABRICANTE DE PRODUTOS DE TECIDO NÃO TECIDO PARA USO ODONTO-MÉDICO-HOSPITALAR INDEPENDENTE",
    "cnae": "3292-2/02",
    "descricao": "FABRICAÇÃO DE EQUIPAMENTOS E ACESSÓRIOS PARA SEGURANÇA PESSOAL E PROFISSIONAL",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "FABRICANTE DE PRODUTOS DERIVADOS DE CARNE INDEPENDENTE",
    "cnae": "1013-9/01",
    "descricao": "FABRICAÇÃO DE PRODUTOS DE CARNE",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "FABRICANTE DE PRODUTOS DERIVADOS DO ARROZ INDEPENDENTE",
    "cnae": "1061-9/02",
    "descricao": "FABRICAÇÃO DE PRODUTOS DO ARROZ",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "FABRICANTE DE RAPADURA E MELAÇO INDEPENDENTE",
    "cnae": "1071-6/00",
    "descricao": "FABRICAÇÃO DE AÇÚCAR EM BRUTO",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "FABRICANTE DE REFRESCOS, XAROPES E PÓS PARA REFRESCOS INDEPENDENTE",
    "cnae": "1122-4/03",
    "descricao": "FABRICAÇÃO DE REFRESCOS, XAROPES E PÓS PARA REFRESCOS, EXCETO REFRESCOS DE FRUTAS",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "FABRICANTE DE ROUPAS ÍNTIMAS INDEPENDENTE",
    "cnae": "1411-8/01",
    "descricao": "CONFECÇÃO DE ROUPAS ÍNTIMAS",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "FABRICANTE     DE     SUCOS     CONCENTRADOS     DE     FRUTAS, HORTALIÇAS E LEGUMES INDEPENDENTE",
    "cnae": "1033-3/01",
    "descricao": "FABRICAÇÃO DE SUCOS CONCENTRADOS DE FRUTAS, HORTALIÇAS E LEGUMES",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "FABRICANTE DE SUCOS DE FRUTAS, HORTALIÇAS E LEGUMES INDEPENDENTE",
    "cnae": "1033-3/02",
    "descricao": "FABRICAÇÃO DE SUCOS DE FRUTAS, HORTALIÇAS E LEGUMES, EXCETO CONCENTRADOS",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "FABRICANTE DE VELAS, INCLUSIVE DECORATIVAS INDEPENDENTE",
    "cnae": "3299-0/06",
    "descricao": "FABRICAÇÃO DE VELAS, INCLUSIVE DECORATIVAS",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "FARINHEIRO DE MANDIOCA INDEPENDENTE",
    "cnae": "1063-5/00",
    "descricao": "FABRICAÇÃO DE FARINHA DE MANDIOCA E DERIVADOS",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "FARINHEIRO DE MILHO INDEPENDENTE",
    "cnae": "1064-3/00",
    "descricao": "FABRICAÇÃO DE FARINHA DE MILHO E DERIVADOS, EXCETO ÓLEOS DE MILHO",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "FERRAMENTEIRO(A) INDEPENDENTE",
    "cnae": "2543-8/00",
    "descricao": "FABRICAÇÃO DE FERRAMENTAS",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "FERREIRO/FORJADOR INDEPENDENTE",
    "cnae": "2543-8/00",
    "descricao": "FABRICAÇÃO DE FERRAMENTAS",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "FILMADOR(A) INDEPENDENTE",
    "cnae": "7420-0/04",
    "descricao": "FILMAGEM DE FESTAS E EVENTOS",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "FORNECEDOR(A) DE ALIMENTOS PREPARADOS PARA EMPRESAS INDEPENDENTE",
    "cnae": "5620-1/01",
    "descricao": "FORNECIMENTO DE ALIMENTOS PREPARADOS PREPONDERANTEMENTE PARA EMPRESAS",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "FOSSEIRO (LIMPADOR DE FOSSA) INDEPENDENTE",
    "cnae": "3702-9/00",
    "descricao": "ATIVIDADES   RELACIONADAS   A   ESGOTO,   EXCETO   A GESTÃO DE REDES",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "FOTOCOPIADOR(A) INDEPENDENTE",
    "cnae": "8219-9/01",
    "descricao": "FOTOCÓPIAS",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "FOTÓGRAFO(A) INDEPENDENTE",
    "cnae": "7420-0/01",
    "descricao": "ATIVIDADES DE PRODUÇÃO DE FOTOGRAFIAS, EXCETO AÉREA E SUBMARINA",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "FOTÓGRAFO(A) AÉREO INDEPENDENTE",
    "cnae": "7420-0/02",
    "descricao": "ATIVIDADES DE PRODUÇÃO DE FOTOGRAFIAS AÉREAS E SUBMARINAS",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "FOTÓGRAFO(A) SUBMARINO INDEPENDENTE",
    "cnae": "7420-0/02",
    "descricao": "ATIVIDADES DE PRODUÇÃO DE FOTOGRAFIAS AÉREAS E SUBMARINAS",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "FUNILEIRO/LANTERNEIRO INDEPENDENTE",
    "cnae": "4520-0/02",
    "descricao": "SERVIÇOS DE LANTERNAGEM OU FUNILARIA E PINTURA DE VEÍCULOS AUTOMOTORES",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "GALVANIZADOR(A) INDEPENDENTE",
    "cnae": "2539-0/02",
    "descricao": "SERVIÇOS DE TRATAMENTO E REVESTIMENTO EM METAIS",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "GESSEIRO(A) INDEPENDENTE",
    "cnae": "4330-4/03",
    "descricao": "OBRAS DE ACABAMENTO EM GESSO E ESTUQUE",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "GRAVADOR(A) DE CARIMBOS INDEPENDENTE",
    "cnae": "8299-7/03",
    "descricao": "SERVIÇOS DE GRAVAÇÃO DE CARIMBOS, EXCETO CONFECÇÃO",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "GUARDADOR(A) DE MÓVEIS INDEPENDENTE",
    "cnae": "5211-7/02",
    "descricao": "GUARDA-MÓVEIS",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "GUIA DE TURISMO INDEPENDENTE",
    "cnae": "7912-1/00",
    "descricao": "OPERADORES TURÍSTICOS",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "GUINCHEIRO INDEPENDENTE (REBOQUE DE VEÍCULOS)",
    "cnae": "5229-0/02",
    "descricao": "SERVIÇOS DE REBOQUE DE VEÍCULOS",
    "iss": "S",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "HUMORISTA E CONTADOR DE HISTÓRIAS INDEPENDENTE",
    "cnae": "9001-9/01",
    "descricao": "PRODUÇÃO TEATRAL",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "INSTALADOR(A) DE ANTENAS DE TV INDEPENDENTE",
    "cnae": "4321-5/00",
    "descricao": "INSTALAÇÃO E MANUTENÇÃO ELÉTRICA",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "INSTALADOR(A) DE EQUIPAMENTOS DE SEGURANÇA DOMICILIAR\nE EMPRESARIAL, SEM PRESTAÇÃO DE SERVIÇOS DE VIGILÂNCIA E SEGURANÇA INDEPENDENTE",
    "cnae": "4321-5/00",
    "descricao": "INSTALAÇÃO E MANUTENÇÃO ELÉTRICA",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "INSTALADOR(A) DE EQUIPAMENTOS PARA ORIENTAÇÃO À\nNAVEGAÇÃO MARÍTIMA, FLUVIAL E LACUSTRE INDEPENDENTE",
    "cnae": "4329-1/02",
    "descricao": "INSTALAÇÃO DE EQUIPAMENTOS PARA ORIENTAÇÃO À NAVEGAÇÃO MARÍTIMA, FLUVIAL E LACUSTRE",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "INSTALADOR(A) DE ISOLANTES ACÚSTICOS E DE VIBRAÇÃO INDEPENDENTE",
    "cnae": "4329-1/05",
    "descricao": "TRATAMENTOS TÉRMICOS, ACÚSTICOS OU DE VIBRAÇÃO",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "INSTALADOR(A) DE ISOLANTES TÉRMICOS INDEPENDENTE",
    "cnae": "4329-1/05",
    "descricao": "TRATAMENTOS TÉRMICOS, ACÚSTICOS OU DE VIBRAÇÃO",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "INSTALADOR(A) DE MÁQUINAS E EQUIPAMENTOS INDUSTRIAIS INDEPENDENTE",
    "cnae": "3321-0/00",
    "descricao": "INSTALAÇÃO DE MÁQUINAS E EQUIPAMENTOS INDUSTRIAIS",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "INSTALADOR(A) DE PAINÉIS PUBLICITÁRIOS INDEPENDENTE",
    "cnae": "4329-1/01",
    "descricao": "INSTALAÇÃO DE PAINÉIS PUBLICITÁRIOS",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "INSTALADOR(A) DE REDE DE COMPUTADORES INDEPENDENTE",
    "cnae": "6190-6/99",
    "descricao": "OUTRAS   ATIVIDADES   DE   TELECOMUNICAÇÕES   NÃO ESPECIFICADAS ANTERIORMENTE",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "INSTALADOR(A) DE SISTEMA DE PREVENÇÃO CONTRA INCÊNDIO INDEPENDENTE",
    "cnae": "4322-3/03",
    "descricao": "INSTALAÇÕES DE SISTEMA DE PREVENÇÃO CONTRA INCÊNDIO",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "INSTALADOR(A) E REPARADOR (A) DE ACESSÓRIOS AUTOMOTIVOS INDEPENDENTE",
    "cnae": "4520-0/07",
    "descricao": "SERVIÇOS DE INSTALAÇÃO, MANUTENÇÃO E REPARAÇÃO DE ACESSÓRIOS PARA VEÍCULOS AUTOMOTORES",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "INSTALADOR(A) E REPARADOR(A) DE ELEVADORES, ESCADAS E ESTEIRAS ROLANTES INDEPENDENTE",
    "cnae": "4329-1/03",
    "descricao": "INSTALAÇÃO, MANUTENÇÃO E REPARAÇÃO DE ELEVADORES, ESCADAS E ESTEIRAS ROLANTES",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "INSTALADOR(A) E REPARADOR DE COFRES, TRANCAS E TRAVAS DE SEGURANÇA INDEPENDENTE",
    "cnae": "8020-0/02",
    "descricao": "OUTRAS ATIVIDADES DE SERVIÇOS DE SEGURANÇA",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "INSTALADOR(A) E REPARADOR(A) DE SISTEMAS CENTRAIS DE AR CONDICIONADO, DE VENTILAÇÃO E REFRIGERAÇÃO\nINDEPENDENTE",
    "cnae": "4322-3/02",
    "descricao": "INSTALAÇÃO E MANUTENÇÃO DE SISTEMAS CENTRAIS DE AR CONDICIONADO, DE VENTILAÇÃO E\nREFRIGERAÇÃO",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "INSTRUTOR(A) DE ARTE E CULTURA EM GERAL INDEPENDENTE",
    "cnae": "8592-9/99",
    "descricao": "ENSINO DE ARTE E CULTURA NÃO ESPECIFICADO ANTERIORMENTE",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "INSTRUTOR(A) DE ARTES CÊNICAS INDEPENDENTE",
    "cnae": "8592-9/02",
    "descricao": "ENSINO DE ARTES CÊNICAS, EXCETO DANÇA",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "INSTRUTOR(A) DE CURSOS GERENCIAIS INDEPENDENTE",
    "cnae": "8599-6/04",
    "descricao": "TREINAMENTO  EM  DESENVOLVIMENTO  PROFISSIONAL E GERENCIAL",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "INSTRUTOR(A) DE CURSOS PREPARATÓRIOS INDEPENDENTE",
    "cnae": "8599-6/05",
    "descricao": "CURSOS PREPARATÓRIOS PARA CONCURSOS",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "INSTRUTOR(A) DE IDIOMAS INDEPENDENTE",
    "cnae": "8593-7/00",
    "descricao": "ENSINO DE IDIOMAS",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "INSTRUTOR(A) DE INFORMÁTICA INDEPENDENTE",
    "cnae": "8599-6/03",
    "descricao": "TREINAMENTO EM INFORMÁTICA",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "INSTRUTOR(A) DE MÚSICA INDEPENDENTE",
    "cnae": "8592-9/03",
    "descricao": "ENSINO DE MÚSICA",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "JARDINEIRO(A) INDEPENDENTE",
    "cnae": "8130-3/00",
    "descricao": "ATIVIDADES PAISAGÍSTICAS",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "JORNALEIRO(A) INDEPENDENTE",
    "cnae": "4761-0/02",
    "descricao": "COMÉRCIO VAREJISTA DE JORNAIS E REVISTAS",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "LAPIDADOR(A) INDEPENDENTE",
    "cnae": "3211-6/01",
    "descricao": "LAPIDAÇÃO DE GEMAS",
    "iss": "S",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "LAVADEIRO(A) DE ROUPAS INDEPENDENTE",
    "cnae": "9601-7/01",
    "descricao": "LAVANDERIAS",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "LAVADEIRO(A) DE ROUPAS PROFISSIONAIS INDEPENDENTE",
    "cnae": "9601-7/03",
    "descricao": "TOALHEIROS",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "LAVADOR(A) E POLIDOR DE CARRO INDEPENDENTE",
    "cnae": "4520-0/05",
    "descricao": "SERVIÇOS DE LAVAGEM, LUBRIFICAÇÃO E POLIMENTO DE VEÍCULOS AUTOMOTORES",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "LAVADOR(A) DE ESTOFADO E SOFÁ INDEPENDENTE",
    "cnae": "9609-2/99",
    "descricao": "OUTRAS  ATIVIDADES  DE  SERVIÇOS  PESSOAIS  NÃO ESPECIFICADAS ANTERIORMENTE",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "LIVREIRO(A) INDEPENDENTE",
    "cnae": "4761-0/01",
    "descricao": "COMÉRCIO VAREJISTA DE LIVROS",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "LOCADOR DE ANDAIMES INDEPENDENTE",
    "cnae": "7732-2/02",
    "descricao": "ALUGUEL DE ANDAIMES",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "LOCADOR(A) DE APARELHOS DE JOGOS ELETRÔNICOS INDEPENDENTE",
    "cnae": "7729-2/01",
    "descricao": "ALUGUEL DE APARELHOS DE JOGOS ELETRÔNICOS",
    "iss": "N",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "LOCADOR(A) DE BICICLETAS, INDEPENDENTE",
    "cnae": "7721-7/00",
    "descricao": "ALUGUEL DE EQUIPAMENTOS RECREATIVOS E ESPORTIVOS",
    "iss": "N",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "LOCADOR(A) DE EQUIPAMENTOS CIENTÍFICOS, MÉDICOS E HOSPITALARES, SEM OPERADOR INDEPENDENTE",
    "cnae": "7739-0/02",
    "descricao": "ALUGUEL DE EQUIPAMENTOS CIENTÍFICOS, MÉDICOS E HOSPITALARES, SEM OPERADOR",
    "iss": "N",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "LOCADOR(A) DE EQUIPAMENTOS RECREATIVOS E ESPORTIVOS INDEPENDENTE",
    "cnae": "7721-7/00",
    "descricao": "ALUGUEL DE EQUIPAMENTOS RECREATIVOS E ESPORTIVOS",
    "iss": "N",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "LOCADOR(A) DE FITAS DE VÍDEO, DVDS E SIMILARES INDEPENDENTE",
    "cnae": "7722-5/00",
    "descricao": "ALUGUEL DE FITAS DE VÍDEO, DVDS E SIMILARES",
    "iss": "N",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "LOCADOR(A) DE LIVROS, REVISTAS, PLANTAS E FLORES INDEPENDENTE",
    "cnae": "7729-2/99",
    "descricao": "ALUGUEL DE OUTROS OBJETOS PESSOAIS E\nDOMÉSTICOS NÃO ESPECIFICADOS ANTERIORMENTE",
    "iss": "N",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "LOCADOR(A) DE MÁQUINAS E EQUIPAMENTOS AGRÍCOLAS SEM OPERADOR INDEPENDENTE",
    "cnae": "7731-4/00",
    "descricao": "ALUGUEL DE MÁQUINAS E EQUIPAMENTOS AGRÍCOLAS SEM OPERADOR",
    "iss": "N",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "LOCADOR(A) DE MÁQUINAS E EQUIPAMENTOS PARA CONSTRUÇÃO SEM OPERADOR, EXCETO ANDAIMES INDEPENDENTE",
    "cnae": "7732-2/01",
    "descricao": "ALUGUEL DE MÁQUINAS E EQUIPAMENTOS PARA\nCONSTRUÇÃO SEM OPERADOR, EXCETO ANDAIMES",
    "iss": "N",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "LOCADOR(A) DE MÁQUINAS E EQUIPAMENTOS PARA ESCRITÓRIO INDEPENDENTE",
    "cnae": "7733-1/00",
    "descricao": "ALUGUEL DE MÁQUINAS E EQUIPAMENTOS PARA ESCRITÓRIO",
    "iss": "N",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "LOCADOR(A) DE MATERIAL E EQUIPAMENTO ESPORTIVO, INDEPENDENTE",
    "cnae": "7721-7/00",
    "descricao": "ALUGUEL DE EQUIPAMENTOS RECREATIVOS E ESPORTIVOS",
    "iss": "N",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "LOCADOR(A) DE MATERIAL MÉDICO INDEPENDENTE",
    "cnae": "7729-2/03",
    "descricao": "ALUGUEL DE MATERIAL MÉDICO",
    "iss": "N",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "LOCADOR(A) DE MOTOCICLETA, SEM CONDUTOR, INDEPENDENTE",
    "cnae": "7719-5/99",
    "descricao": "LOCAÇÃO DE OUTROS MEIOS DE TRANSPORTE NÃO ESPECIFICADOS ANTERIORMENTE, SEM CONDUTOR",
    "iss": "N",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "LOCADOR(A) DE MÓVEIS E UTENSÍLIOS, INCLUSIVE PARA FESTAS INDEPENDENTE",
    "cnae": "7729-2/02",
    "descricao": "ALUGUEL DE MÓVEIS, UTENSÍLIOS E APARELHOS DE USO DOMÉSTICO E PESSOAL; INSTRUMENTOS\nMUSICAIS",
    "iss": "N",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "LOCADOR(A) DE INSTRUMENTOS MUSICAIS INDEPENDENTE",
    "cnae": "7729-2/02",
    "descricao": "ALUGUEL DE MÓVEIS, UTENSÍLIOS E APARELHOS DE USO DOMÉSTICO E PESSOAL; INSTRUMENTOS\nMUSICAIS",
    "iss": "N",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "LOCADOR(A) DE OBJETOS DO VESTUÁRIO, JÓIAS E ACESSÓRIOS INDEPENDENTE",
    "cnae": "7723-3/00",
    "descricao": "ALUGUEL DE OBJETOS DO VESTUÁRIO, JÓIAS E ACESSÓRIOS",
    "iss": "N",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "LOCADOR(A) DE OUTRAS MÁQUINAS E EQUIPAMENTOS COMERCIAIS E INDUSTRIAIS NÃO ESPECIFICADOS\nANTERIORMENTE, SEM OPERADOR INDEPENDENTE",
    "cnae": "7739-0/99",
    "descricao": "ALUGUEL DE OUTRAS MÁQUINAS E EQUIPAMENTOS COMERCIAIS E INDUSTRIAIS NÃO ESPECIFICADOS ANTERIORMENTE, SEM OPERADOR",
    "iss": "N",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "LOCADOR(A) DE PALCOS, COBERTURAS E OUTRAS ESTRUTURAS DE USO TEMPORÁRIO, EXCETO ANDAIMES INDEPENDENTE",
    "cnae": "7739-0/03",
    "descricao": "ALUGUEL DE PALCOS, COBERTURAS E OUTRAS ESTRUTURAS DE USO TEMPORÁRIO, EXCETO ANDAIMES",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "LOCADOR(A) DE VÍDEO GAMES, INDEPENDENTE",
    "cnae": "7722-5/00",
    "descricao": "ALUGUEL DE FITAS DE VIDEO, DVDS E SIMILARES",
    "iss": "N",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "LOCUTOR(A) DE MENSAGENS FONADAS E AO VIVO INDEPENDENTE",
    "cnae": "9609-2/99",
    "descricao": "OUTRAS  ATIVIDADES   DE   SERVIÇOS   PESSOAIS   NÃO ESPECIFICADAS ANTERIORMENTE",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "MÁGICO(A) INDEPENDENTE",
    "cnae": "9329-8/99",
    "descricao": "OUTRAS  ATIVIDADES  DE  RECREAÇÃO  E  LAZER  NÃO ESPECIFICADAS ANTERIORMENTE",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "MANICURE/PEDICURE INDEPENDENTE",
    "cnae": "9602-5/01",
    "descricao": "CABELEIREIROS, MANICURE E PEDICURE",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "MAQUIADOR(A) INDEPENDENTE",
    "cnae": "9602-5/02",
    "descricao": "ATIVIDADES  DE  ESTÉTICA  E  OUTROS  SERVIÇOS  DE CUIDADOS COM A BELEZA",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "MARCENEIRO(A) SOB ENCOMENDA OU NÃO, INDEPENDENTE",
    "cnae": "3101-2/00",
    "descricao": "FABRICAÇÃO DE MÓVEIS COM PREDOMINÂNCIA DE MADEIRA",
    "iss": "S",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "MARMITEIRO(A) INDEPENDENTE",
    "cnae": "5620-1/04",
    "descricao": "FORNECIMENTO DE ALIMENTOS PREPARADOS\nPREPONDERANTEMENTE PARA CONSUMO DOMICILIAR",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "MECÂNICO(A) DE MOTOCICLETAS E MOTONETAS INDEPENDENTE",
    "cnae": "4543-9/00",
    "descricao": "MANUTENÇÃO E REPARAÇÃO DE MOTOCICLETAS E MOTONETAS",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "MECÂNICO(A) DE VEÍCULOS INDEPENDENTE",
    "cnae": "4520-0/01",
    "descricao": "SERVIÇOS DE MANUTENÇÃO E REPARAÇÃO MECÂNICA DE VEÍCULOS AUTOMOTORES",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "MERCEEIRO(A)/VENDEIRO(A) INDEPENDENTE",
    "cnae": "4712-1/00",
    "descricao": "COMÉRCIO VAREJISTA DE MERCADORIAS EM GERAL, COM PREDOMINÂNCIA DE PRODUTOS ALIMENTÍCIOS - MINIMERCADOS, MERCEARIAS E ARMAZÉNS",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "MERGULHADOR(A) (ESCAFANDRISTA) INDEPENDENTE",
    "cnae": "7490-1/02",
    "descricao": "ESCAFANDRIA E MERGULHO",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "MOENDEIRO(A) INDEPENDENTE",
    "cnae": "1069-4/00",
    "descricao": "MOAGEM  E  FABRICAÇÃO  DE  PRODUTOS  DE  ORIGEM VEGETAL NÃO ESPECIFICADOS ANTERIORMENTE",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "MONTADOR(A) DE MÓVEIS INDEPENDENTE",
    "cnae": "3329-5/01",
    "descricao": "SERVIÇOS DE MONTAGEM DE MÓVEIS DE QUALQUER MATERIAL",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "MONTADOR(A) E INSTALADOR DE SISTEMAS E EQUIPAMENTOS\nDE  ILUMINAÇÃO  E  SINALIZAÇÃO  EM  VIAS  PÚBLICAS,  PORTOS  E AEROPORTOS INDEPENDENTE",
    "cnae": "4329-1/04",
    "descricao": "MONTAGEM E INSTALAÇÃO DE SISTEMAS E\nEQUIPAMENTOS DE ILUMINAÇÃO E SINALIZAÇÃO EM VIAS PÚBLICAS, PORTOS E AEROPORTOS",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "MOTOBOY INDEPENDENTE",
    "cnae": "5320-2/02",
    "descricao": "SERVIÇOS DE ENTREGA RÁPIDA",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "MOTORISTA (POR APLICATIVO OU NÃO) INDEPENDENTE",
    "cnae": "4923-0/02",
    "descricao": "SERVIÇO DE TRANSPORTE DE PASSAGEIROS – LOCAÇÃO DE AUTOMÓVEIS COM MOTORISTA",
    "iss": "S",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "MOTOTAXISTA INDEPENDENTE",
    "cnae": "4923-0/01",
    "descricao": "SERVIÇO DE TÁXI",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "MOVELEIRO(A) INDEPENDENTE",
    "cnae": "3103-9/00",
    "descricao": "FABRICAÇÃO DE MÓVEIS DE OUTROS MATERIAIS, EXCETO MADEIRA E METAL",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "MOVELEIRO(A) DE MÓVEIS METÁLICOS INDEPENDENTE",
    "cnae": "3102-1/00",
    "descricao": "FABRICAÇÃO DE MÓVEIS COM PREDOMINÂNCIA DE METAL",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "OLEIRO(A) INDEPENDENTE",
    "cnae": "2342-7/02",
    "descricao": "FABRICAÇÃO DE ARTEFATOS DE CERÂMICA E BARRO COZIDO PARA USO NA CONSTRUÇÃO, EXCETO AZULEJOS E PISOS",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "ORGANIZADOR(A)    DE    EXCURSÕES    EM    VEÍCULO    PRÓPRIO, MUNICIPAL INDEPENDENTE",
    "cnae": "4929-9/03",
    "descricao": "ORGANIZAÇÃO DE EXCURSÕES EM VEÍCULOS RODOVIÁRIOS PRÓPRIOS, MUNICIPAL",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "OURIVES INDEPENDENTE",
    "cnae": "9529-1/06",
    "descricao": "REPARAÇÃO DE JÓIAS",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "PADEIRO(A) INDEPENDENTE",
    "cnae": "1091-1/01",
    "descricao": "FABRICAÇÃO DE PRODUTOS DE PANIFICAÇÃO",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "PANFLETEIRO(A) INDEPENDENTE",
    "cnae": "7319-0/02",
    "descricao": "PROMOÇÃO DE VENDAS",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "PAPELEIRO(A) INDEPENDENTE",
    "cnae": "4761-0/03",
    "descricao": "COMÉRCIO VAREJISTA DE ARTIGOS DE PAPELARIA",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "PASTILHEIRO(A) INDEPENDENTE",
    "cnae": "4330-4/05",
    "descricao": "APLICAÇÃO DE REVESTIMENTOS E DE RESINAS EM INTERIORES E EXTERIORES",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "PEDREIRO INDEPENDENTE",
    "cnae": "4399-1/03",
    "descricao": "OBRAS DE ALVENARIA",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "PEIXEIRO(A) INDEPENDENTE",
    "cnae": "4722-9/02",
    "descricao": "PEIXARIA",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "PINTOR(A) DE AUTOMÓVEIS INDEPENDENTE",
    "cnae": "4520-0/02",
    "descricao": "SERVIÇOS    DE    LANTERNAGEM    OU    FUNILARIA    E PINTURA DE VEÍCULOS AUTOMOTORES",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "PINTOR(A) DE PAREDE INDEPENDENTE",
    "cnae": "4330-4/04",
    "descricao": "SERVIÇOS DE PINTURA DE EDIFÍCIOS EM GERAL",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "PIPOQUEIRO(A) INDEPENDENTE",
    "cnae": "5612-1/00",
    "descricao": "SERVIÇOS AMBULANTES DE ALIMENTAÇÃO",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "PISCINEIRO(A) INDEPENDENTE",
    "cnae": "8129-0/00",
    "descricao": "ATIVIDADES DE LIMPEZA NÃO ESPECIFICADAS ANTERIORMENTE",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "PIZZAIOLO(A) EM DOMICÍLIO INDEPENDENTE",
    "cnae": "5620-1/02",
    "descricao": "SERVIÇOS DE ALIMENTAÇÃO PARA EVENTOS E RECEPÇÕES - BUFÊ",
    "iss": "S",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "POCEIRO/CISTERNEIRO/",
    "cnae": "4399-1/05",
    "descricao": "PERFURAÇÃO E CONSTRUÇÃO DE POÇOS DE ÁGUA",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "MOVELEIRO(A) INDEPENDENTE",
    "cnae": "3103-9/00",
    "descricao": "FABRICAÇÃO DE MÓVEIS DE OUTROS MATERIAIS, EXCETO MADEIRA E METAL",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "MOVELEIRO(A) DE MÓVEIS METÁLICOS INDEPENDENTE",
    "cnae": "3102-1/00",
    "descricao": "FABRICAÇÃO DE MÓVEIS COM PREDOMINÂNCIA DE METAL",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "OLEIRO(A) INDEPENDENTE",
    "cnae": "2342-7/02",
    "descricao": "FABRICAÇÃO DE ARTEFATOS DE CERÂMICA E BARRO COZIDO PARA USO NA CONSTRUÇÃO, EXCETO AZULEJOS E PISOS",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "ORGANIZADOR(A)    DE    EXCURSÕES    EM    VEÍCULO    PRÓPRIO, MUNICIPAL INDEPENDENTE",
    "cnae": "4929-9/03",
    "descricao": "ORGANIZAÇÃO DE EXCURSÕES EM VEÍCULOS RODOVIÁRIOS PRÓPRIOS, MUNICIPAL",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "OURIVES INDEPENDENTE",
    "cnae": "9529-1/06",
    "descricao": "REPARAÇÃO DE JÓIAS",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "PADEIRO(A) INDEPENDENTE",
    "cnae": "1091-1/01",
    "descricao": "FABRICAÇÃO DE PRODUTOS DE PANIFICAÇÃO",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "PANFLETEIRO(A) INDEPENDENTE",
    "cnae": "7319-0/02",
    "descricao": "PROMOÇÃO DE VENDAS",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "PAPELEIRO(A) INDEPENDENTE",
    "cnae": "4761-0/03",
    "descricao": "COMÉRCIO VAREJISTA DE ARTIGOS DE PAPELARIA",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "PASTILHEIRO(A) INDEPENDENTE",
    "cnae": "4330-4/05",
    "descricao": "APLICAÇÃO DE REVESTIMENTOS E DE RESINAS EM INTERIORES E EXTERIORES",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "PEDREIRO INDEPENDENTE",
    "cnae": "4399-1/03",
    "descricao": "OBRAS DE ALVENARIA",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "PEIXEIRO(A) INDEPENDENTE",
    "cnae": "4722-9/02",
    "descricao": "PEIXARIA",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "PINTOR(A) DE AUTOMÓVEIS INDEPENDENTE",
    "cnae": "4520-0/02",
    "descricao": "SERVIÇOS    DE    LANTERNAGEM    OU    FUNILARIA    E PINTURA DE VEÍCULOS AUTOMOTORES",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "PINTOR(A) DE PAREDE INDEPENDENTE",
    "cnae": "4330-4/04",
    "descricao": "SERVIÇOS DE PINTURA DE EDIFÍCIOS EM GERAL",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "PIPOQUEIRO(A) INDEPENDENTE",
    "cnae": "5612-1/00",
    "descricao": "SERVIÇOS AMBULANTES DE ALIMENTAÇÃO",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "PISCINEIRO(A) INDEPENDENTE",
    "cnae": "8129-0/00",
    "descricao": "ATIVIDADES DE LIMPEZA NÃO ESPECIFICADAS ANTERIORMENTE",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "PIZZAIOLO(A) EM DOMICÍLIO INDEPENDENTE",
    "cnae": "5620-1/02",
    "descricao": "SERVIÇOS DE ALIMENTAÇÃO PARA EVENTOS E RECEPÇÕES - BUFÊ",
    "iss": "S",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "POCEIRO/CISTERNEIRO/",
    "cnae": "4399-1/05",
    "descricao": "PERFURAÇÃO E CONSTRUÇÃO DE POÇOS DE ÁGUA",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "PRESTADOR(A) DE SERVIÇOS DE SEMEADURA SOB CONTRATO DE EMPREITADA INDEPENDENTE",
    "cnae": "0161-0/03",
    "descricao": "SERVIÇO DE PREPARAÇÃO DE TERRENO, CULTIVO E COLHEITA",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "PROFESSOR(A) PARTICULAR INDEPENDENTE",
    "cnae": "8599-6/99",
    "descricao": "OUTRAS ATIVIDADES DE ENSINO NÃO ESPECIFICADAS ANTERIORMENTE",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "PROMOTOR(A) DE EVENTOS INDEPENDENTE",
    "cnae": "8230-0/01",
    "descricao": "SERVIÇOS DE ORGANIZAÇÃO DE FEIRAS, CONGRESSOS, EXPOSIÇÕES E FESTAS",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "PROMOTOR(A) DE TURISMO LOCAL INDEPENDENTE",
    "cnae": "7990-2/00",
    "descricao": "SERVIÇOS  DE  RESERVAS  E  OUTROS  SERVIÇOS  DE TURISMO NÃO ESPECIFICADOS ANTERIORMENTE",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "PROMOTOR(A) DE VENDAS INDEPENDENTE",
    "cnae": "7319-0/02",
    "descricao": "PROMOÇÃO DE VENDAS",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "PROPRIETÁRIO(A) DE ALBERGUE NÃO ASSISTENCIAL INDEPENDENTE",
    "cnae": "5590-6/01",
    "descricao": "ALBERGUES, EXCETO ASSISTENCIAIS",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "PROPRIETÁRIO(A)        DE       BAR       E       CONGÊNERES, ENTRETENIMENTO, INDEPENDENTE",
    "cnae": "5611-2/05",
    "descricao": "BARES E OUTROS ESTABELECIMENTOS ESPECIALIZADOS EM SERVIR BEBIDAS, COM ENTRETENIMENTO",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "PROPRIETÁRIO(A) DE BAR E CONGÊNERES, SEM ENTRETENIMENTO, INDEPENDENTE",
    "cnae": "5611-2/04",
    "descricao": "BARES E OUTROS ESTABELECIMENTOS ESPECIALIZADOS EM SERVIR BEBIDAS, SEM ENTRETENIMENTO",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "PROPRIETÁRIO(A) DE CAMPING INDEPENDENTE",
    "cnae": "5590-6/02",
    "descricao": "CAMPINGS",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "PROPRIETÁRIO(A) DE CANTINAS INDEPENDENTE",
    "cnae": "5620-1/03",
    "descricao": "CANTINAS - SERVIÇOS DE ALIMENTAÇÃO PRIVATIVOS",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "PROPRIETÁRIO(A) DE CARRO DE SOM PARA FINS PUBLICITÁRIOS INDEPENDENTE",
    "cnae": "7319-0/99",
    "descricao": "OUTRAS      ATIVIDADES       DE       PUBLICIDADE       NÃO ESPECIFICADAS ANTERIORMENTE",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "PROPRIETÁRIO(A) DE CASA DE CHÁ INDEPENDENTE",
    "cnae": "5611-2/03",
    "descricao": "LANCHONETES, CASAS DE CHÁ, DE SUCOS E SIMILARES",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "PROPRIETÁRIO(A) DE CASA DE SUCOS INDEPENDENTE",
    "cnae": "5611-2/03",
    "descricao": "LANCHONETES, CASAS DE CHÁ, DE SUCOS E SIMILARES",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "PROPRIETÁRIO(A) DE CASAS DE FESTAS E EVENTOS INDEPENDENTE",
    "cnae": "8230-0/02",
    "descricao": "CASAS DE FESTAS E EVENTOS",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "PROPRIETÁRIO(A) DE ESTACIONAMENTO DE VEÍCULOS INDEPENDENTE",
    "cnae": "5223-1/00",
    "descricao": "ESTACIONAMENTO DE VEÍCULOS",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "PROPRIETÁRIO(A) DE FLIPERAMA INDEPENDENTE",
    "cnae": "9329-8/04",
    "descricao": "EXPLORAÇÃO DE JOGOS ELETRÔNICOS RECREATIVOS",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "PROPRIETÁRIO(A) DE HOSPEDARIA INDEPENDENTE",
    "cnae": "5590-6/99",
    "descricao": "OUTROS ALOJAMENTOS NÃO ESPECIFICADOS ANTERIORMENTE",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "PROPRIETÁRIO(A) DE LANCHONETE INDEPENDENTE",
    "cnae": "5611-2/03",
    "descricao": "LANCHONETES, CASAS DE CHÁ, DE SUCOS E SIMILARES",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "PROPRIETÁRIO(A) DE PENSÃO INDEPENDENTE",
    "cnae": "5590-6/03",
    "descricao": "PENSÕES (ALOJAMENTO)",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "PROPRIETÁRIO(A) DE RESTAURANTE INDEPENDENTE",
    "cnae": "5611-2/01",
    "descricao": "RESTAURANTES E SIMILARES",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "PROPRIETÁRIO(A) DE SALA DE ACESSO À INTERNET INDEPENDENTE",
    "cnae": "8299-7/07",
    "descricao": "SALAS DE ACESSO À INTERNET",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "PROPRIETÁRIO(A) DE SALÃO DE JOGOS DE SINUCA E BILHAR INDEPENDENTE",
    "cnae": "9329-8/03",
    "descricao": "EXPLORAÇÃO DE JOGOS DE SINUCA, BILHAR E SIMILARES",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "QUEIJEIRO(A)/MANTEIGUEIRO(A) INDEPENDENTE",
    "cnae": "1052-0/00",
    "descricao": "FABRICAÇÃO DE LATICÍNIOS",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "QUITANDEIRO(A) INDEPENDENTE",
    "cnae": "4724-5/00",
    "descricao": "COMÉRCIO VAREJISTA DE HORTIFRUTIGRANJEIROS",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "QUITANDEIRO(A) AMBULANTE INDEPENDENTE",
    "cnae": "5612-1/00",
    "descricao": "SERVIÇOS AMBULANTES DE ALIMENTAÇÃO",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "RECARREGADOR(A)  DE  CARTUCHOS  PARA  EQUIPAMENTOS  DE INFORMÁTICA INDEPENDENTE",
    "cnae": "4751-2/02",
    "descricao": "RECARGA DE CARTUCHOS PARA EQUIPAMENTOS DE INFORMÁTICA",
    "iss": "S",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "RECICLADOR(A) DE BORRACHA, MADEIRA, PAPEL E VIDRO INDEPENDENTE",
    "cnae": "3839-4/99",
    "descricao": "RECUPERAÇÃO DE MATERIAIS NÃO ESPECIFICADOS ANTERIORMENTE",
    "iss": "S",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "RECICLADOR (A) DE MATERIAIS METÁLICOS, EXCETO ALUMÍNIO INDEPENDENTE",
    "cnae": "3831-9/99",
    "descricao": "RECUPERAÇÃO DE MATERIAIS METÁLICOS, EXCETO ALUMÍNIO",
    "iss": "S",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "RECICLADOR (A) DE MATERIAIS PLÁSTICOS INDEPENDENTE",
    "cnae": "3832-7/00",
    "descricao": "RECUPERAÇÃO DE MATERIAIS PLÁSTICOS",
    "iss": "S",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "RECICLADOR (A) DE SUCATAS DE ALUMÍNIO INDEPENDENTE",
    "cnae": "3831-9/01",
    "descricao": "RECUPERAÇÃO DE SUCATAS DE ALUMÍNIO",
    "iss": "S",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "REDEIRO(A) INDEPENDENTE",
    "cnae": "1353-7/00",
    "descricao": "FABRICAÇÃO DE ARTEFATOS DE CORDOARIA",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "RELOJOEIRO(A) INDEPENDENTE",
    "cnae": "9529-1/03",
    "descricao": "REPARAÇÃO DE RELÓGIOS",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "RENDEIRO(A) INDEPENDENTE",
    "cnae": "1359-6/00",
    "descricao": "FABRICAÇÃO  DE  OUTROS  PRODUTOS  TÊXTEIS  NÃO ESPECIFICADOS ANTERIORMENTE",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "REPARADOR(A) DE APARELHOS E EQUIPAMENTOS PARA DISTRIBUIÇÃO E CONTROLE DE ENERGIA ELÉTRICA\nINDEPENDENTE",
    "cnae": "3313-9/99",
    "descricao": "MANUTENÇÃO E REPARAÇÃO DE MÁQUINAS, APARELHOS E MATERIAIS ELÉTRICOS NÃO ESPECIFICADOS ANTERIORMENTE",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "REPARADOR (A) DE ARTIGOS DE TAPEÇARIA INDEPENDENTE",
    "cnae": "9529-1/05",
    "descricao": "REPARAÇÃO DE ARTIGOS DO MOBILIÁRIO",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "REPARADOR(A) DE ARTIGOS E ACESSÓRIOS DO VESTUÁRIO INDEPENDENTE",
    "cnae": "9529-1/99",
    "descricao": "REPARAÇÃO E MANUTENÇÃO DE OUTROS OBJETOS E EQUIPAMENTOS PESSOAIS E DOMÉSTICOS NÃO ESPECIFICADOS ANTERIORMENTE",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "REPARADOR(A) DE BALANÇAS INDUSTRIAIS E COMERCIAIS INDEPENDENTE",
    "cnae": "3314-7/10",
    "descricao": "MANUTENÇÃO E REPARAÇÃO DE MÁQUINAS E EQUIPAMENTOS PARA USO GERAL NÃO ESPECIFICADOS ANTERIORMENTE",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "REPARADOR(A) DE BATERIAS E ACUMULADORES ELÉTRICOS, EXCETO PARA VEÍCULOS, INDEPENDENTE",
    "cnae": "3313-9/02",
    "descricao": "MANUTENÇÃO E REPARAÇÃO DE BATERIAS E ACUMULADORES ELÉTRICOS, EXCETO PARA VEÍCULOS",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "REPARADOR(A) DE BICICLETA INDEPENDENTE",
    "cnae": "9529-1/04",
    "descricao": "REPARAÇÃO  DE  BICICLETAS,  TRICICLOS  E  OUTROS VEÍCULOS NÃO MOTORIZADOS",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "REPARADOR(A) DE BRINQUEDOS INDEPENDENTE",
    "cnae": "9529-1/99",
    "descricao": "REPARAÇÃO E MANUTENÇÃO DE OUTROS OBJETOS E EQUIPAMENTOS PESSOAIS E DOMÉSTICOS NÃO ESPECIFICADOS ANTERIORMENTE",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "REPARADOR(A) DE CORDAS, VELAMES E LONAS INDEPENDENTE",
    "cnae": "3319-8/00",
    "descricao": "MANUTENÇÃO   E   REPARAÇÃO   DE   EQUIPAMENTOS   E PRODUTOS NÃO ESPECIFICADOS ANTERIORMENTE",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "REPARADOR(A) DE EMBARCAÇÕES PARA ESPORTE E LAZER INDEPENDENTE",
    "cnae": "3317-1/02",
    "descricao": "MANUTENÇÃO E REPARAÇÃO DE EMBARCAÇÕES PARA ESPORTE E LAZER",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "REPARADOR(A) DE EQUIPAMENTOS ESPORTIVOS INDEPENDENTE",
    "cnae": "9529-1/99",
    "descricao": "REPARAÇÃO E MANUTENÇÃO DE OUTROS OBJETOS E EQUIPAMENTOS PESSOAIS E DOMÉSTICOS NÃO ESPECIFICADOS ANTERIORMENTE",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "REPARADOR(A)        DE        EQUIPAMENTOS        HIDRÁULICOS        E PNEUMÁTICOS, EXCETO VÁLVULAS, INDEPENDENTE",
    "cnae": "3314-7/02",
    "descricao": "MANUTENÇÃO E REPARAÇÃO DE EQUIPAMENTOS HIDRÁULICOS E PNEUMÁTICOS, EXCETO VÁLVULAS",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "REPARADOR(A) DE EQUIPAMENTOS MÉDICO-HOSPITALARES NÃO ELETRÔNICOS INDEPENDENTE",
    "cnae": "3319-8/00",
    "descricao": "MANUTENÇÃO   E   REPARAÇÃO   DE   EQUIPAMENTOS   E PRODUTOS NÃO ESPECIFICADOS ANTERIORMENTE",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "REPARADOR(A) DE EXTINTOR DE INCÊNDIO INDEPENDENTE",
    "cnae": "3314-7/10",
    "descricao": "MANUTENÇÃO E REPARAÇÃO DE MÁQUINAS E EQUIPAMENTOS PARA USO GERAL NÃO ESPECIFICADOS ANTERIORMENTE",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "REPARADOR(A) DE FILTROS INDUSTRIAIS INDEPENDENTE",
    "cnae": "3314-7/10",
    "descricao": "MANUTENÇÃO E REPARAÇÃO DE MÁQUINAS E EQUIPAMENTOS PARA USO GERAL NÃO ESPECIFICADOS ANTERIORMENTE",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "REPARADOR(A) DE GERADORES, TRANSFORMADORES E MOTORES ELÉTRICOS INDEPENDENTE",
    "cnae": "3313-9/01",
    "descricao": "MANUTENÇÃO E REPARAÇÃO DE GERADORES, TRANSFORMADORES E MOTORES ELÉTRICOS",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "REPARADOR(A) DE GUARDA CHUVA E SOMBRINHAS INDEPENDENTE",
    "cnae": "9529-1/99",
    "descricao": "REPARAÇÃO E MANUTENÇÃO DE OUTROS OBJETOS E EQUIPAMENTOS PESSOAIS E DOMÉSTICOS NÃO ESPECIFICADOS ANTERIORMENTE",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "REPARADOR(A) DE INSTRUMENTOS MUSICAIS INDEPENDENTE",
    "cnae": "9529-1/99",
    "descricao": "REPARAÇÃO E MANUTENÇÃO DE OUTROS OBJETOS E EQUIPAMENTOS PESSOAIS E DOMÉSTICOS NÃO ESPECIFICADOS ANTERIORMENTE",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "REPARADOR(A) DE MÁQUINAS DE ESCREVER, CALCULAR E DE OUTROS EQUIPAMENTOS NÃO ELETRÔNICOS PARA ESCRITÓRIO INDEPENDENTE",
    "cnae": "3314-7/09",
    "descricao": "MANUTENÇÃO E REPARAÇÃO DE MÁQUINAS DE\nESCREVER, CALCULAR E DE OUTROS EQUIPAMENTOS NÃO ELETRÔNICOS PARA ESCRITÓRIO",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "REPARADOR(A) DE MÁQUINAS E APARELHOS DE REFRIGERAÇÃO E VENTILAÇÃO PARA USO INDUSTRIAL E COMERCIAL\nINDEPENDENTE",
    "cnae": "3314-7/07",
    "descricao": "MANUTENÇÃO E REPARAÇÃO DE MÁQUINAS E\nAPARELHOS DE REFRIGERAÇÃO E VENTILAÇÃO PARA USO INDUSTRIAL E COMERCIAL",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "REPARADOR(A) DE MÁQUINAS GRÁFICA INDEPENDENTE",
    "cnae": "3314-7/99",
    "descricao": "MANUTENÇÃO E REPARAÇÃO DE OUTRAS MÁQUINAS E EQUIPAMENTOS PARA USOS INDUSTRIAIS NÃO\nESPECIFICADOS ANTERIORMENTE",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "REPARADOR(A)    DE    MÁQUINAS    E    EQUIPAMENTOS    PARA    A INDÚSTRIA DA MADEIRA INDEPENDENTE",
    "cnae": "3314-7/99",
    "descricao": "MANUTENÇÃO E REPARAÇÃO DE OUTRAS MÁQUINAS E EQUIPAMENTOS PARA USOS INDUSTRIAIS NÃO\nESPECIFICADOS ANTERIORMENTE",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "REPARADOR(A) DE MÁQUINAS E EQUIPAMENTOS PARA A INDÚSTRIA TÊXTIL, DO VESTUÁRIO, DO COURO E CALÇADOS INDEPENDENTE",
    "cnae": "3314-7/20",
    "descricao": "MANUTENÇÃO E REPARAÇÃO DE MÁQUINAS E EQUIPAMENTOS PARA A\nINDÚSTRIA TÊXTIL, DO VESTUÁRIO, DO COURO E CALÇADOS",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "REPARADOR(A)     DE     MÁQUINAS     E     EQUIPAMENTOS     PARA AGRICULTURA E PECUÁRIA INDEPENDENTE",
    "cnae": "3314-7/11",
    "descricao": "MANUTENÇÃO E REPARAÇÃO DE MÁQUINAS E EQUIPAMENTOS PARA AGRICULTURA E PECUÁRIA",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "REPARADOR(A) DE MÁQUINAS E EQUIPAMENTOS PARA AS INDÚSTRIAS DE ALIMENTOS, BEBIDAS E FUMO INDEPENDENTE",
    "cnae": "3314-7/19",
    "descricao": "MANUTENÇÃO E REPARAÇÃO DE MÁQUINAS E\nEQUIPAMENTOS  PARA AS  INDÚSTRIAS  DE ALIMENTOS, BEBIDAS E FUMO",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "REPARADOR(A) INDEPENDENTE",
    "cnae": "3314-7/01",
    "descricao": "MANUTENÇÃO E REPARAÇÃO DE MÁQUINAS MOTRIZES NÃO ELÉTRICAS",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "REPARADOR(A) INDEPENDENTE",
    "cnae": "3314-7/10",
    "descricao": "MANUTENÇÃO E REPARAÇÃO DE MÁQUINAS E EQUIPAMENTOS PARA USO GERAL NÃO ESPECIFICADOS ANTERIORMENTE",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "REPARADOR(A) DE MÁQUINAS PARA ENCADERNAÇÃO INDEPENDENTE",
    "cnae": "3314-7/99",
    "descricao": "MANUTENÇÃO E REPARAÇÃO DE OUTRAS MÁQUINAS E EQUIPAMENTOS PARA USOS INDUSTRIAIS NÃO\nESPECIFICADOS ANTERIORMENTE",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "REPARADOR(A)   DE   MÁQUINAS,  APARELHOS   E   EQUIPAMENTOS PARA INSTALAÇÕES TÉRMICAS INDEPENDENTE",
    "cnae": "3314-7/06",
    "descricao": "MANUTENÇÃO    E    REPARAÇÃO    DE    MÁQUINAS,    E EQUIPAMENTOS PARA INSTALAÇÕES TÉRMICAS",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "REPARADOR(A) DE MÓVEIS INDEPENDENTE",
    "cnae": "9529-1/05",
    "descricao": "REPARAÇÃO DE ARTIGOS DO MOBILIÁRIO",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "REPARADOR(A) DE PANELAS (PANELEIRO) INDEPENDENTE",
    "cnae": "9529-1/99",
    "descricao": "REPARAÇÃO E MANUTENÇÃO DE OUTROS OBJETOS E EQUIPAMENTOS PESSOAIS E DOMÉSTICOS NÃO ESPECIFICADOS ANTERIORMENTE",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "REPARADOR(A) DE TANQUES, RESERVATÓRIOS METÁLICOS E CALDEIRAS, EXCETO PARA VEÍCULOS, INDEPENDENTE",
    "cnae": "3311-2/00",
    "descricao": "MANUTENÇÃO E REPARAÇÃO DE TANQUES,\nRESERVATÓRIOS  METÁLICOS  E  CALDEIRAS,  EXCETO PARA VEÍCULOS",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "REPARADOR(A) DE TOLDOS E PERSIANAS INDEPENDENTE",
    "cnae": "9529-1/05",
    "descricao": "REPARAÇÃO DE ARTIGOS DO MOBILIÁRIO",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "REPARADOR(A) DE TONÉIS, BARRIS E PALETES DE MADEIRA INDEPENDENTE",
    "cnae": "3319-8/00",
    "descricao": "MANUTENÇÃO   E   REPARAÇÃO   DE   EQUIPAMENTOS   E PRODUTOS NÃO ESPECIFICADOS ANTERIORMENTE",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "REPARADOR(A) DE TRATORES AGRÍCOLAS INDEPENDENTE",
    "cnae": "3314-7/12",
    "descricao": "MANUTENÇÃO E REPARAÇÃO DE TRATORES AGRÍCOLAS",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "REPARADOR(A) DE VEÍCULOS DE TRAÇÃO ANIMAL INDEPENDENTE",
    "cnae": "3319-8/00",
    "descricao": "MANUTENÇÃO   E   REPARAÇÃO   DE   EQUIPAMENTOS   E PRODUTOS NÃO ESPECIFICADOS ANTERIORMENTE",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "RESTAURADOR(A) DE INSTRUMENTOS MUSICAIS HISTÓRICOS INDEPENDENTE",
    "cnae": "3319-8/00",
    "descricao": "MANUTENÇÃO   E   REPARAÇÃO   DE   EQUIPAMENTOS   E PRODUTOS NÃO ESPECIFICADOS ANTERIORMENTE",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "RESTAURADOR(A) INDEPENDENTE",
    "cnae": "3319-8/00",
    "descricao": "MANUTENÇÃO   E   REPARAÇÃO   DE   EQUIPAMENTOS   E PRODUTOS NÃO ESPECIFICADOS ANTERIORMENTE",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "RESTAURADOR(A) DE LIVROS INDEPENDENTE",
    "cnae": "9529-1/99",
    "descricao": "REPARAÇÃO E MANUTENÇÃO DE OUTROS OBJETOS E EQUIPAMENTOS PESSOAIS E DOMÉSTICOS NÃO ESPECIFICADOS ANTERIORMENTE",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "RESTAURADOR(A) DE OBRAS DE ARTE INDEPENDENTE",
    "cnae": "9002-7/02",
    "descricao": "RESTAURAÇÃO DE OBRAS DE ARTE",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "RETIFICADOR(A) DE MOTORES PARA VEÍCULOS AUTOMOTORES INDEPENDENTE",
    "cnae": "2950-6/00",
    "descricao": "RECONDICIONAMENTO E RECUPERAÇÃO DE MOTORES PARA VEÍCULOS AUTOMOTORES",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "REVELADOR(A) FOTOGRÁFICO INDEPENDENTE",
    "cnae": "7420-0/03",
    "descricao": "LABORATÓRIOS FOTOGRÁFICOS",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "SALGADEIRO(A) INDEPENDENTE",
    "cnae": "5620-1/04",
    "descricao": "FORNECIMENTO DE ALIMENTOS PREPARADOS\nPREPONDERANTEMENTE PARA CONSUMO DOMICILIAR",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "SALINEIRO/EXTRATOR DE SAL MARINHO INDEPENDENTE",
    "cnae": "0892-4/01",
    "descricao": "EXTRAÇÃO DE SAL MARINHO",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "SALSICHEIRO(A)/LINGUICEIRO(A) INDEPENDENTE",
    "cnae": "1013-9/01",
    "descricao": "FABRICAÇÃO DE PRODUTOS DE CARNE",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "SAPATEIRO(A)",
    "cnae": "9529-1/01",
    "descricao": "REPARAÇÃO DE CALÇADOS, DE BOLSAS E ARTIGOS DE VIAGEM",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "SELEIRO(A) INDEPENDENTE",
    "cnae": "1529-7/00",
    "descricao": "FABRICAÇÃO      DE     ARTEFATOS     DE     COURO     NÃO ESPECIFICADOS ANTERIORMENTE",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "SERIGRAFISTA INDEPENDENTE",
    "cnae": "1813-0/99",
    "descricao": "IMPRESSÃO DE MATERIAL PARA OUTROS USOS",
    "iss": "S",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "SERIGRAFISTA PUBLICITÁRIO INDEPENDENTE",
    "cnae": "1813-0/01",
    "descricao": "IMPRESSÃO DE MATERIAL PARA USO PUBLICITÁRIO",
    "iss": "S",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "SERRALHEIRO(A), EXCETO PARA ESQUADRIAS, SOB ENCOMENDA OU NÃO, INDEPENDENTE",
    "cnae": "2542-0/00",
    "descricao": "FABRICAÇÃO DE ARTIGOS DE SERRALHERIA, EXCETO ESQUADRIAS",
    "iss": "S",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "SINTEQUEIRO(A) INDEPENDENTE",
    "cnae": "4330-4/05",
    "descricao": "APLICAÇÃO DE REVESTIMENTOS E DE RESINAS EM INTERIORES E EXTERIORES",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "SOLDADOR(A)/BRASADOR(A) INDEPENDENTE",
    "cnae": "2539-0/01",
    "descricao": "SERVIÇOS DE USINAGEM, TORNEARIA E SOLDA",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "SORVETEIRO(A) INDEPENDENTE",
    "cnae": "4729-6/99",
    "descricao": "COMÉRCIO VAREJISTA DE PRODUTOS ALIMENTÍCIOS EM GERAL OU ESPECIALIZADO EM PRODUTOS\nALIMENTÍCIOS NÃO ESPECIFICADOS ANTERIORMENTE",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "SORVETEIRO(A) AMBULANTE INDEPENDENTE",
    "cnae": "5612-1/00",
    "descricao": "SERVIÇOS AMBULANTES DE ALIMENTAÇÃO",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "TANOEIRO(A) INDEPENDENTE",
    "cnae": "1623-4/00",
    "descricao": "FABRICAÇÃO   DE   ARTEFATOS   DE   TANOARIA   E   DE EMBALAGENS DE MADEIRA",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "TAPECEIRO(A) INDEPENDENTE",
    "cnae": "1352-9/00",
    "descricao": "FABRICAÇÃO DE ARTEFATOS DE TAPEÇARIA",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "TATUADOR(A) INDEPENDENTE",
    "cnae": "9609-2/06",
    "descricao": "SERVIÇOS DE TATUAGEM E COLOCAÇÃO DE PIERCING",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "TAXISTA INDEPENDENTE",
    "cnae": "4923-0/01",
    "descricao": "SERVIÇO DE TÁXI",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "TECELÃO(Ã) INDEPENDENTE",
    "cnae": "1322-7/00",
    "descricao": "TECELAGEM  DE  FIOS  DE  FIBRAS  TÊXTEIS  NATURAIS, EXCETO ALGODÃO",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "TECELÃO(Ã) DE ALGODÃO INDEPENDENTE",
    "cnae": "1321-9/00",
    "descricao": "TECELAGEM DE FIOS DE ALGODÃO",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "TÉCNICO(A) DE SONORIZAÇÃO E DE ILUMINAÇÃO INDEPENDENTE",
    "cnae": "9001-9/06",
    "descricao": "ATIVIDADES DE SONORIZAÇÃO E DE ILUMINAÇÃO",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "TÉCNICO(A) DE MANUTENÇÃO DE COMPUTADOR INDEPENDENTE",
    "cnae": "9511-8/00",
    "descricao": "REPARAÇÃO E MANUTENÇÃO DE COMPUTADORES E DE EQUIPAMENTOS PERIFÉRICOS",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "TÉCNICO(A) DE MANUTENÇÃO DE ELETRODOMÉSTICOS INDEPENDENTE",
    "cnae": "9521-5/00",
    "descricao": "REPARAÇÃO E MANUTENÇÃO DE EQUIPAMENTOS ELETROELETRÔNICOS DE USO PESSOAL E\nDOMÉSTICO",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "TÉCNICO(A) DE MANUTENÇÃO DE TELEFONIA INDEPENDENTE",
    "cnae": "9512-6/00",
    "descricao": "REPARAÇÃO E MANUTENÇÃO DE EQUIPAMENTOS DE COMUNICAÇÃO",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "TELHADOR(A) INDEPENDENTE",
    "cnae": "4399-1/99",
    "descricao": "SERVIÇOS  ESPECIALIZADOS  PARA CONSTRUÇÃO  NÃO ESPECIFICADOS ANTERIORMENTE",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "TINTUREIRO(A) INDEPENDENTE",
    "cnae": "9601-7/02",
    "descricao": "TINTURARIAS",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "TORNEIRO(A) MECÂNICO INDEPENDENTE",
    "cnae": "2539-0/01",
    "descricao": "SERVIÇOS DE USINAGEM, TORNEARIA E SOLDA",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "TOSADOR(A) DE ANIMAIS DOMÉSTICOS INDEPENDENTE",
    "cnae": "9609-2/08",
    "descricao": "HIGIENE E EMBELEZAMENTO DE ANIMAIS DOMÉSTICOS",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "TOSQUIADOR(A) INDEPENDENTE",
    "cnae": "0162-8/02",
    "descricao": "SERVIÇO DE TOSQUIAMENTO DE OVINOS",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "TRANSPORTADOR(A) AQUAVIÁRIO PARA PASSEIOS TURÍSTICOS INDEPENDENTE",
    "cnae": "5099-8/01",
    "descricao": "TRANSPORTE AQUAVIÁRIO PARA PASSEIOS TURÍSTICOS",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "TRANSPORTADOR(A) ESCOLAR INDEPENDENTE",
    "cnae": "4924-8/00",
    "descricao": "TRANSPORTE ESCOLAR",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "TRANSPORTADOR(A) DE MUDANÇAS INDEPENDENTE",
    "cnae": "4930-2/04",
    "descricao": "TRANSPORTE RODOVIÁRIO DE MUDANÇAS",
    "iss": "S",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "TRANSPORTADOR(A) INTERMUNICIPAL COLETIVO DE PASSAGEIROS SOB FRETE EM REGIÃO METROPOLITANA INDEPENDENTE",
    "cnae": "4929-9/02",
    "descricao": "TRANSPORTE RODOVIÁRIO COLETIVO DE PASSAGEIROS, SOB REGIME DE FRETAMENTO,\nINTERMUNICIPAL, INTERESTADUAL E INTERNACIONAL",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "TRANSPORTADOR(A) INTERMUNICIPAL E INTERESTADUAL DE TRAVESSIA POR NAVEGAÇÃO FLUVIAL INDEPENDENTE",
    "cnae": "5091-2/02",
    "descricao": "TRANSPORTE POR NAVEGAÇÃO DE TRAVESSIA,\nINTERMUNICIPAL, INTERESTADUAL E INTERNACIONAL",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "TRANSPORTADOR(A) MARÍTIMO DE CARGA INDEPENDENTE",
    "cnae": "5011-4/01",
    "descricao": "TRANSPORTE MARÍTIMO DE CABOTAGEM - CARGA",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "TRANSPORTADOR(A) MUNICIPAL DE CARGAS NÃO PERIGOSAS (CARRETO) INDEPENDENTE",
    "cnae": "4930-2/01",
    "descricao": "TRANSPORTE RODOVIÁRIO DE CARGA, EXCETO PRODUTOS PERIGOSOS E MUDANÇAS, MUNICIPAL",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "TRANSPORTADOR(A) MUNICIPAL COLETIVO DE PASSAGEIROS SOB FRETE INDEPENDENTE",
    "cnae": "4929-9/01",
    "descricao": "TRANSPORTE RODOVIÁRIO COLETIVO DE PASSAGEIROS SOB REGIME DE FRETAMENTO, MUNICIPAL",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "TRANSPORTADOR(A) MUNICIPAL DE TRAVESSIA POR NAVEGAÇÃO INDEPENDENTE",
    "cnae": "5091-2/01",
    "descricao": "TRANSPORTE POR NAVEGAÇÃO DE TRAVESSIA, MUNICIPAL",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "TRANSPORTADOR(A) MUNICIPAL HIDROVIÁRIO DE CARGAS INDEPENDENTE",
    "cnae": "5021-1/01",
    "descricao": "TRANSPORTE POR NAVEGAÇÃO INTERIOR DE CARGA, MUNICIPAL, EXCETO TRAVESSIA",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "TRICOTEIRO(A) INDEPENDENTE",
    "cnae": "1422-3/00",
    "descricao": "FABRICAÇÃO DE ARTIGOS DO VESTUÁRIO,\nPRODUZIDOS EM MALHARIAS E TRICOTAGENS, EXCETO MEIAS",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "VASSOUREIRO(A) INDEPENDENTE",
    "cnae": "3291-4/00",
    "descricao": "FABRICAÇÃO DE ESCOVAS, PINCÉIS E VASSOURAS",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "VENDEDOR(A) AMBULANTE DE PRODUTOS ALIMENTÍCIOS INDEPENDENTE",
    "cnae": "5612-1/00",
    "descricao": "SERVIÇOS AMBULANTES DE ALIMENTAÇÃO",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "VENDEDOR(A) DE AVES VIVAS, COELHOS E OUTROS PEQUENOS ANIMAIS PARA ALIMENTAÇÃO INDEPENDENTE",
    "cnae": "4724-5/00",
    "descricao": "COMÉRCIO VAREJISTA DE HORTIFRUTIGRANJEIROS",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "VERDUREIRO INDEPENDENTE",
    "cnae": "4724-5/00",
    "descricao": "COMÉRCIO VAREJISTA DE HORTIFRUTIGRANJEIROS",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "VIDRACEIRO DE AUTOMÓVEIS INDEPENDENTE",
    "cnae": "4520-0/01",
    "descricao": "SERVIÇOS DE MANUTENÇÃO E REPARAÇÃO MECÂNICA DE VEÍCULOS AUTOMOTORES",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "VIDRACEIRO DE EDIFICAÇÕES INDEPENDENTE",
    "cnae": "4330-4/99",
    "descricao": "OUTRAS OBRAS DE ACABAMENTO DA CONSTRUÇÃO",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "VINAGREIRO INDEPENDENTE",
    "cnae": "1099-6/01",
    "descricao": "FABRICAÇÃO DE VINAGRES",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "VIVEIRISTA INDEPENDENTE",
    "cnae": "0121-1/01",
    "descricao": "HORTICULTURA, EXCETO MORANGO",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela A"
   },
   {
    "ocupacao": "TRANSPORTADOR AUTÔNOMO DE CARGA - MUNICIPAL",
    "cnae": "4930-2/01",
    "descricao": "TRANSPORTE RODOVIÁRIO DE CARGA, EXCETO PRODUTOS PERIGOSOS E MUDANÇAS, MUNICIPAL",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela B"
   },
   {
    "ocupacao": "TRANSPORTADOR AUTÔNOMO DE CARGA INTERMUNICIPAL, INTERESTADUAL E INTERNACIONAL",
    "cnae": "4930-2/02",
    "descricao": "TRANSPORTE RODOVIÁRIO DE CARGA, EXCETO PRODUTOS PERIGOSOS E MUDANÇAS,\nINTERMUNICIPAL, INTERESTADUAL E INTERNACIONAL",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela B"
   },
   {
    "ocupacao": "TRANSPORTADOR AUTÔNOMO DE CARGA - PRODUTOS PERIGOSOS",
    "cnae": "4930-2/03",
    "descricao": "TRANSPORTE RODOVIÁRIO DE PRODUTOS PERIGOSOS",
    "iss": "S",
    "icms": "S",
    "tabela": "Tabela B"
   },
   {
    "ocupacao": "TRANSPORTADOR AUTÔNOMO DE CARGA - MUDANÇAS",
    "cnae": "4930-2/04",
    "descricao": "TRANSPORTE RODOVIÁRIO DE MUDANÇAS",
    "iss": "S",
    "icms": "S",
    "tabela": "Tabela B"
   },
   {
    "ocupacao": "TOSADOR(A) DE ANIMAIS DOMÉSTICOS INDEPENDENTE",
    "cnae": "9609-2/08",
    "descricao": "HIGIENE E EMBELEZAMENTO DE ANIMAIS DOMÉSTICOS",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela B"
   },
   {
    "ocupacao": "TOSQUIADOR(A) INDEPENDENTE",
    "cnae": "0162-8/02",
    "descricao": "SERVIÇO DE TOSQUIAMENTO DE OVINOS",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela B"
   },
   {
    "ocupacao": "TRANSPORTADOR(A) AQUAVIÁRIO PARA PASSEIOS TURÍSTICOS INDEPENDENTE",
    "cnae": "5099-8/01",
    "descricao": "TRANSPORTE AQUAVIÁRIO PARA PASSEIOS TURÍSTICOS",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela B"
   },
   {
    "ocupacao": "TRANSPORTADOR(A) ESCOLAR INDEPENDENTE",
    "cnae": "4924-8/00",
    "descricao": "TRANSPORTE ESCOLAR",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela B"
   },
   {
    "ocupacao": "TRANSPORTADOR(A) DE MUDANÇAS INDEPENDENTE",
    "cnae": "4930-2/04",
    "descricao": "TRANSPORTE RODOVIÁRIO DE MUDANÇAS",
    "iss": "S",
    "icms": "S",
    "tabela": "Tabela B"
   },
   {
    "ocupacao": "TRANSPORTADOR(A) INTERMUNICIPAL COLETIVO DE PASSAGEIROS SOB FRETE EM REGIÃO METROPOLITANA INDEPENDENTE",
    "cnae": "4929-9/02",
    "descricao": "TRANSPORTE RODOVIÁRIO COLETIVO DE PASSAGEIROS, SOB REGIME DE FRETAMENTO,\nINTERMUNICIPAL, INTERESTADUAL E INTERNACIONAL",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela B"
   },
   {
    "ocupacao": "TRANSPORTADOR(A) INTERMUNICIPAL E INTERESTADUAL DE TRAVESSIA POR NAVEGAÇÃO FLUVIAL INDEPENDENTE",
    "cnae": "5091-2/02",
    "descricao": "TRANSPORTE POR NAVEGAÇÃO DE TRAVESSIA,\nINTERMUNICIPAL, INTERESTADUAL E INTERNACIONAL",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela B"
   },
   {
    "ocupacao": "TRANSPORTADOR(A) MARÍTIMO DE CARGA INDEPENDENTE",
    "cnae": "5011-4/01",
    "descricao": "TRANSPORTE MARÍTIMO DE CABOTAGEM - CARGA",
    "iss": "N",
    "icms": "S",
    "tabela": "Tabela B"
   },
   {
    "ocupacao": "TRANSPORTADOR(A) MUNICIPAL DE CARGAS NÃO PERIGOSAS (CARRETO) INDEPENDENTE",
    "cnae": "4930-2/01",
    "descricao": "TRANSPORTE RODOVIÁRIO DE CARGA, EXCETO PRODUTOS PERIGOSOS E MUDANÇAS, MUNICIPAL",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela B"
   },
   {
    "ocupacao": "TRANSPORTADOR(A) MUNICIPAL COLETIVO DE PASSAGEIROS SOB FRETE INDEPENDENTE",
    "cnae": "4929-9/01",
    "descricao": "TRANSPORTE RODOVIÁRIO COLETIVO DE PASSAGEIROS SOB REGIME DE FRETAMENTO, MUNICIPAL",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela B"
   },
   {
    "ocupacao": "TRANSPORTADOR(A) MUNICIPAL DE TRAVESSIA POR NAVEGAÇÃO INDEPENDENTE",
    "cnae": "5091-2/01",
    "descricao": "TRANSPORTE POR NAVEGAÇÃO DE TRAVESSIA, MUNICIPAL",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela B"
   },
   {
    "ocupacao": "TRANSPORTADOR(A) MUNICIPAL HIDROVIÁRIO DE CARGAS INDEPENDENTE",
    "cnae": "5021-1/01",
    "descricao": "TRANSPORTE POR NAVEGAÇÃO INTERIOR DE CARGA, MUNICIPAL, EXCETO TRAVESSIA",
    "iss": "S",
    "icms": "N",
    "tabela": "Tabela B"
   }
  ]
 }
};
