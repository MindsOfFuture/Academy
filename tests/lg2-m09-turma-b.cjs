/* Módulo 9 (Turma B), documento final do Grupo 9 (30/10/2026).
   O ESPERADO abaixo é a tabela "Caminhos por resposta" do documento (código, pergunta do Passo a passo,
   coluna "Aparece quando", resposta/opção e retorno literal), mais Cruzamentos e Próximo passo no resumo.
   O fluxo esperado (quais perguntas aparecem) é escrito de novo aqui, a partir do documento, sem usar o motor.
   Confere: textos literais em dados/modulo9.js; cada linha de caminho alcançada na tela (N de N);
   "Aparece quando" respeitado (motor e percurso na tela); "Não sei" com "Já verifiquei"; checklist,
   alertas (≤3), próximos passos (≤3) e encaminhamento (1) do resumo; cruzamentos com os outros módulos;
   pré-preenchimento; estado antigo descartado; botão do próximo módulo; zero erro de página.
   Versão leve (nov/2026): capa curta com "Como funciona" fechado; pergunta com faixa compacta, enunciado curto
   (campo "curta" nos dados; "pergunta" segue literal), "Ver dica" fechada e no máximo 60 palavras antes de tocar;
   "Não sei" mostra "Como descobrir" (passos + pedido para IA com Copiar) e grava o mesmo valor de antes;
   resultado com o que entendemos, a próxima tarefa e o que falta descobrir à frente, o resto em painéis fechados.
   Lote 16/11: "Não sei" BLOQUEIA (mostra a ajuda, não grava, Continuar não anda); sem "Não sei" nas perguntas sobre a
   própria pessoa (Mo.SEM_NS); respostas antigas "Não sei" viram "sem resposta" (estado v3); exemplos curtos nas opções;
   "Como calculamos" das pendências; pergunta já respondida no Módulo 4/8 não reaparece (cartão "Veio do Módulo N · Trocar").
   Sabotagem: SABOTAR=1 (M9-08 também em casa), SABOTAR=2 (4 alertas), SABOTAR=3 (sem a caixa "Como descobrir"),
   SABOTAR=4 ("Não sei" volta a gravar "naosei") e SABOTAR=5 (pergunta do Módulo 8 volta a aparecer) devem fazer o teste falhar.
   Lote 17/11 ("tira a fricção"): B1 "[link do estado]" vira link de verdade na caixa ao vivo e nenhuma tela mostra "[palavra]"
   (fora do pedido para a IA, que pede para trocar o que está entre colchetes); A um toque por pergunta, sem "Seguir" nem
   "Corrigir minha resposta"; B Continuar nunca desabilitado, aviso com role=alert acima dele; C Continuar inteiro na tela em
   360x640, 390x844 com letra 130% e 740x360; D aria-pressed nas opções e foco no enunciado; E "Etapa" (nunca "Módulo") no texto
   visível; F alvos de toque >= 44 px; G barra de progresso que nunca volta e tempo da capa = caminho típico x 35 s.
   SABOTAR=6 (Continuar volta a pedir um 2º toque, "Seguir"), SABOTAR=7 (caixa ao vivo sem trocar o link), SABOTAR=8 (sem
   position: sticky) e SABOTAR=9 (sem aria-pressed) também devem fazer o teste falhar. */
const http = require('node:http'), fsp = require('node:fs/promises'), fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict'), vm = require('node:vm');
const { chromium } = require(process.env.PW || 'playwright');
const root = path.join(__dirname, '..', 'public');
const DIR = path.join(root, 'lg2/turma-b/m09');
const SHOTS = process.env.SHOTS;

const ESPERADO = {
"perguntas": [
{
"codigo": "M9-01",
"pergunta": "Em que estado você está?",
"aparece": "Sempre (pré-preenchido pela cidade do Módulo 3)",
"caminhos": [
[
"Um dos 26 estados ou o Distrito Federal",
"As regras locais mudam de cidade para cidade. O checklist vai mostrar o link da consulta de viabilidade de [estado] e o que perguntar à sua prefeitura."
],
[
"Não sei",
"Se ainda não decidiu onde vai abrir, use as orientações gerais e volte aqui quando decidir. Portais de todos os estados: https://www.gov.br/empresas-e-negocios/pt-br/redesim/abrir-cnpj/viabilidade"
]
]
},
{
"codigo": "M9-02",
"pergunta": "O que você vende ou faz pode afetar a saúde de quem compra ou é atendido?",
"aparece": "Sempre (pré-marcado por M4-11)",
"caminhos": [
[
"Sim, alimentos ou bebidas / cosméticos, saneantes, medicamentos ou produtos para a saúde / procedimentos no corpo ou cuidado com pessoas / animais",
"Nesses casos, a Vigilância Sanitária faz parte do caminho, mesmo para MEI. O checklist mostra o que confirmar."
],
[
"Não",
"Anotado."
],
[
"Não sei",
"Verifique se alguém come, bebe, passa no corpo, usa como remédio ou recebe um cuidado por causa do que você vende ou faz. ⚠ Atenção: se houver, a Vigilância Sanitária faz parte do caminho, mesmo para MEI, e funcionar sem a licença pode gerar multa ou interdição."
]
]
},
{
"codigo": "M9-03",
"pergunta": "Onde a atividade vai funcionar?",
"aparece": "Sempre",
"caminhos": [
[
"Na minha casa / Em apartamento ou condomínio residencial",
"Vamos ver as condições para trabalhar em casa."
],
[
"Em loja ou sala comercial",
"Vamos ver o que conferir antes de alugar ou usar o ponto."
],
[
"Sem local fixo (digital, na casa do cliente ou ambulante)",
"Mesmo sem local fixo, o registro costuma pedir um endereço. Confirme na prefeitura qual endereço usar."
],
[
"Ainda não escolhi",
"Antes de alugar ou comprar um ponto, faça a consulta de viabilidade. Ela diz se a atividade pode funcionar ali."
],
[
"Não sei",
"Pense onde você vai produzir, guardar ou atender."
]
]
},
{
"codigo": "M9-03a",
"pergunta": "Como você vai trabalhar sem local fixo?",
"aparece": "Se M9-03 = Sem local fixo",
"caminhos": [
[
"Só pela internet ou por telefone / Na casa ou na empresa do cliente",
"Como não haverá local fixo, as perguntas sobre o imóvel (área, público, gás, condomínio, espaço e obra) não se aplicam e serão puladas. O registro ainda pede um endereço, em geral o da sua residência: confirme na prefeitura se a atividade pode ser registrada nele."
],
[
"Na rua, em feiras ou eventos, em barraca, carrinho ou veículo (food truck)",
"Para vender em local público, a prefeitura costuma exigir licença de ambulante ou permissão de uso do espaço. Com alimentos, a Vigilância Sanitária licencia também a barraca ou o veículo, e veículo adaptado precisa ser regularizado no Detran."
],
[
"Não sei",
"Pense em onde vai encontrar os clientes e entregar o produto ou o serviço. ⚠ Atenção: vender na rua, em feira ou em veículo pede licença da prefeitura e, com gás ou alimentos, vistoria dos Bombeiros e da Vigilância Sanitária."
]
]
},
{
"codigo": "M9-03b",
"pergunta": "Que tipo de local você pretende usar?",
"aparece": "Se M9-03 = Ainda não escolhi ou Não sei (respostas valem como planejamento)",
"caminhos": [
[
"Minha casa / Apartamento ou condomínio / Loja ou sala comercial",
"Vamos ver as regras do local que você pretende usar. As respostas valem como planejamento: confirme tudo antes de alugar ou assinar contrato."
],
[
"Sem local fixo",
"Vamos ver como você vai trabalhar."
],
[
"Ainda não faço ideia",
"Sem saber o tipo de local, não dá para ver agora as regras do imóvel. Pulamos essas perguntas, e elas ficam como 'a confirmar' no checklist. Quando escolher o local, volte a esta etapa antes de alugar ou assinar contrato."
]
]
},
{
"codigo": "M9-04",
"pergunta": "Você já verificou na prefeitura se a atividade pode funcionar nesse endereço?",
"aparece": "Sempre (sem local fixo: endereço do registro; local não definido: vira orientação)",
"caminhos": [
[
"Sim, foi aprovada",
"Ótimo. Guarde o comprovante da consulta."
],
[
"Sim, foi negada",
"Com a consulta negada, a atividade pode não funcionar nesse endereço. Procure a prefeitura para entender o motivo antes de gastar com o local."
],
[
"Ainda não fiz",
"Faça a consulta no portal do seu estado ([link do estado]) antes de alugar, reformar ou registrar a empresa."
],
[
"Não sei",
"Verifique se a consulta de viabilidade já foi feita: se a empresa já foi registrada, ela pode ter sido feita nessa etapa. Pergunte a quem fez o registro (por exemplo, o contador) ou procure o protocolo no portal do seu estado. ⚠ Atenção: não alugue, não reforme nem assine contrato antes de saber se a atividade pode funcionar no endereço."
]
]
},
{
"codigo": "M9-05",
"pergunta": "Qual é o tamanho total do imóvel, em m²?",
"aparece": "Se casa ou apartamento (escolhido ou pretendido)",
"caminhos": [
[
"Área informada (número maior que zero)",
"Anotado. A área é um dos critérios que a prefeitura e os Bombeiros usam, e o limite muda de cidade para cidade. Confirme na prefeitura."
],
[
"Valor inválido",
"Informe a área com um número maior que zero."
],
[
"Não sei",
"Consulte o carnê do IPTU ou a planta e volte a esta pergunta."
]
]
},
{
"codigo": "M9-06",
"pergunta": "Clientes ou outras pessoas vão ao local?",
"aparece": "Se há local fixo (ver regra abaixo) e o atendimento não é só fora",
"caminhos": [
[
"Não, só trabalho interno ou atendimento fora",
"Anotado."
],
[
"Sim, menos de 100 pessoas ao mesmo tempo",
"Anotado. Esse número entra nas condições para trabalhar em casa e na conversa com os Bombeiros."
],
[
"Sim, 100 pessoas ou mais ao mesmo tempo",
"Locais que reúnem 100 pessoas ou mais seguem normas especiais de prevenção de incêndio. Confirme com a prefeitura e com os Bombeiros antes de abrir."
],
[
"Não sei",
"Verifique se clientes, alunos, pacientes ou outras pessoas vão ao local e, no momento de maior movimento, quantas estariam lá ao mesmo tempo. ⚠ Atenção: público no local muda as condições para trabalhar em casa e as exigências dos Bombeiros."
]
]
},
{
"codigo": "M9-07",
"pergunta": "Vai haver gás no local, no veículo, na banca ou no carrinho?",
"aparece": "Se há local fixo ou trabalho na rua, em feira ou em veículo",
"caminhos": [
[
"Não",
"Anotado."
],
[
"Sim, gás encanado da rua (gás natural)",
"A ligação é feita pela distribuidora, e a instalação interna (tubos, registros e ventilação dos aparelhos) deve ser feita por empresa ou profissional habilitado, com ART ou RRT. Em comércio, os Bombeiros podem conferir a instalação no projeto ou na vistoria."
],
[
"Sim, botijão ou cilindro (gás de cozinha, GLP)",
"Vamos ver quantos são e onde vão ficar."
],
[
"Vou vender gás de cozinha (revenda)",
"Vender botijões exige empresa com autorização da ANP para revenda de GLP, área de armazenamento compatível com a classe autorizada e regularização nos Bombeiros e na prefeitura. Não comece a vender antes dessa autorização."
],
[
"Não sei",
"Verifique se algum equipamento vai usar gás: fogão, forno, chapa, fritadeira, churrasqueira, aquecedor de água ou caldeira. ⚠ Atenção: gás instalado ou guardado fora das regras pode causar vazamento, incêndio ou explosão, e é um dos itens que os Bombeiros conferem. Não instale nem guarde gás antes de confirmar."
]
]
},
{
"codigo": "M9-07a",
"pergunta": "Quantos botijões ou cilindros de gás vão ficar no local, contando os cheios, os em uso e os de reserva?",
"aparece": "Se M9-07 = botijão ou cilindro",
"caminhos": [
[
"1 botijão de 13 kg (P13)",
"Anotado. Mesmo com um botijão, use mangueira e regulador dentro da validade e deixe o botijão em local ventilado. Em comércio, alguns estados pedem que ele fique fora da cozinha, em abrigo próprio."
],
[
"2 botijões de 13 kg (um em uso e um de reserva)",
"Anotado. Em vários estados, um botijão em uso e um de reserva é o limite das regras mais simples. Confirme nos Bombeiros do seu estado."
],
[
"3 ou mais botijões de 13 kg / Cilindros de 20 kg ou 45 kg (P20, P45)",
"Com mais gás, os Bombeiros costumam exigir abrigo ou central de gás, feita por profissional habilitado (com ART ou RRT), conforme a norma de gás do seu estado e a ABNT NBR 13523. Confirme antes de comprar os cilindros ou fazer a instalação."
],
[
"Central de gás do prédio ou do terreno",
"Peça ao responsável pelo imóvel o projeto ou o laudo da central de gás e confirme se ela está regularizada nos Bombeiros. Ligar um ponto novo exige profissional habilitado."
],
[
"Não sei",
"Conte os botijões ou cilindros que vão ficar no local (cheios, em uso e de reserva) e veja o peso no rótulo: 13, 20 ou 45 kg. ⚠ Atenção: a quantidade de gás muda o que os Bombeiros exigem. Confirme antes de comprar ou instalar."
]
]
},
{
"codigo": "M9-07b",
"pergunta": "Onde o gás vai ficar?",
"aparece": "Se M9-07 = botijão ou cilindro",
"caminhos": [
[
"Do lado de fora, em área aberta e ventilada ou em abrigo próprio",
"Anotado. Mantenha o local livre, protegido do sol e da chuva e longe de ralos, tomadas e de outros produtos que pegam fogo."
],
[
"Dentro da cozinha ou de outro cômodo fechado",
"Atenção: em muitos estados, o botijão não pode ficar em local fechado, como dentro da cozinha, em subsolo ou em sala sem ventilação, principalmente em comércio. Confirme com os Bombeiros onde o gás pode ficar antes de começar."
],
[
"No veículo, na barraca ou no carrinho",
"Gás em food truck, barraca ou carrinho precisa de compartimento próprio, ventilado e bem preso, e costuma ser conferido pelos Bombeiros e pela prefeitura. Confirme as regras antes de começar a vender."
],
[
"Não sei",
"Verifique onde o gás vai ficar e se o lugar é aberto e ventilado. ⚠ Atenção: em local fechado, um vazamento acumula gás e pode causar explosão. Confirme com os Bombeiros."
]
]
},
{
"codigo": "M9-07c",
"pergunta": "Vai guardar outros produtos que pegam fogo, como álcool, tintas, solventes ou combustíveis?",
"aparece": "Mesma condição de M9-07",
"caminhos": [
[
"Não",
"Anotado."
],
[
"Sim, só para uso e limpeza, em embalagens pequenas",
"Anotado. Guarde nas embalagens originais, em local ventilado, longe do fogo e do gás."
],
[
"Sim, em maior quantidade ou para vender",
"Guardar ou vender produtos que pegam fogo em maior quantidade pode exigir regularização nos Bombeiros e regras próprias de armazenamento. Confirme no órgão antes de estocar."
],
[
"Não sei",
"Verifique o que vai ficar guardado no local: álcool, tintas, vernizes, solventes, thinner, gasolina ou óleo diesel. ⚠ Atenção: produtos que pegam fogo guardados perto de calor ou do gás aumentam o risco de incêndio e entram na análise dos Bombeiros."
]
]
},
{
"codigo": "M9-08",
"pergunta": "A convenção do condomínio permite a atividade no apartamento, ou o condomínio já a autorizou por escrito (por exemplo, em ata)?",
"aparece": "Se apartamento ou condomínio (escolhido ou pretendido)",
"caminhos": [
[
"Sim",
"Ótimo. Guarde a cópia da convenção ou da autorização."
],
[
"Não",
"Peça ao síndico para incluir a sua atividade na pauta da assembleia. Explique o que fará, o horário e se haverá clientes."
],
[
"Não sei",
"Verifique na convenção do condomínio (peça uma cópia ao síndico ou à administradora) se a atividade é permitida ou se já há autorização registrada em ata. ⚠ Atenção: sem essa permissão, o condomínio pode multar ou impedir a atividade, mesmo com o CNPJ aberto."
]
]
},
{
"codigo": "M9-09",
"pergunta": "Como será o espaço onde você vai trabalhar dentro de casa?",
"aparece": "Se casa ou apartamento e interesse sanitário",
"caminhos": [
[
"Área separada, de uso exclusivo, com equipamentos exclusivos",
"Anotado. Mantenha as rotinas de limpeza anotadas."
],
[
"Espaço e utensílios compartilhados com a família",
"Para atividades ligadas à saúde, separar o espaço e os utensílios do uso da família pode ser exigido. Confirme com a Vigilância Sanitária."
],
[
"Só guardo produtos prontos e embalados para revenda",
"Anotado. Guarde os produtos longe de calor, umidade e de produtos de limpeza."
],
[
"Não sei",
"Pense em onde vai preparar, guardar e embalar. Para atividades ligadas à saúde, separar o espaço e os utensílios do uso da família pode ser exigido. Confirme com a Vigilância Sanitária."
]
]
},
{
"codigo": "M9-10",
"pergunta": "Sua atividade só pode ser feita por um profissional formado e registrado em conselho?",
"aparece": "Sempre",
"caminhos": [
[
"Sim",
"A empresa pode precisar de um profissional habilitado como responsável e de registro no conselho da profissão. Isso tem custo e prazo: confirme antes de registrar."
],
[
"Não",
"Anotado."
],
[
"Não sei",
"Verifique se a sua profissão tem um conselho regional (por exemplo, de nutrição, farmácia, medicina veterinária, engenharia, contabilidade ou educação física) e se ele exige registro da empresa ou um responsável técnico. ⚠ Atenção: funcionar sem o registro exigido pode gerar multa do conselho e atrasar outras licenças."
]
]
},
{
"codigo": "M9-11",
"pergunta": "O seu trabalho produz fumaça, barulho alto, água suja com produtos, pó ou restos de produtos químicos?",
"aparece": "Sempre",
"caminhos": [
[
"Sim",
"Atividades com fumaça, barulho ou resíduos podem precisar de licença ambiental e de cuidados com o descarte. Confirme na prefeitura ou no órgão ambiental do estado."
],
[
"Não",
"Anotado."
],
[
"Não sei",
"Verifique no seu mapa de processo se alguma etapa usa fogo ou química, gera água suja com produtos, solta pó ou faz barulho. ⚠ Atenção: atividades com fumaça, barulho ou resíduos podem precisar de licença ambiental, e descartar resíduos de forma errada pode gerar multa. Confirme na prefeitura ou no órgão ambiental do estado."
]
]
},
{
"codigo": "M9-12",
"pergunta": "Você vai precisar fazer obra ou reforma no local?",
"aparece": "Se há local fixo (escolhido ou pretendido)",
"caminhos": [
[
"Não / Só pequenos reparos",
"Anotado."
],
[
"Sim, obra que muda estrutura, área ou uso",
"Obras que mudam a estrutura ou o uso costumam precisar de projeto e autorização da prefeitura. Confirme antes de começar."
],
[
"Não sei",
"Verifique se vai derrubar ou levantar paredes, aumentar a área ou mudar a fachada ou a parte elétrica ou hidráulica. ⚠ Atenção: obras que mudam a estrutura, a área ou o uso costumam precisar de projeto e autorização da prefeitura. Não comece a obra antes de confirmar."
]
]
},
{
"codigo": "M9-13",
"pergunta": "Quer anotar alguma dúvida sobre o local ou as licenças, para levar à prefeitura?",
"aparece": "Sempre (opcional)",
"caminhos": [
[
"Texto preenchido",
"Guardado!"
],
[
"Em branco",
"Tudo bem."
]
]
},
{
"codigo": "M9-14",
"pergunta": "Este é o seu checklist de endereço e licenças. Está certo?",
"aparece": "Sempre (última tela)",
"caminhos": [
[
"Sim, pode seguir",
"Pronto! O checklist é orientação para confirmar nos órgãos oficiais, não uma autorização."
],
[
"Quero corrigir algo",
"Qual resposta você quer mudar?"
]
]
}
],
"cruzamentos": [
[
"M4-11 indicou atividade regulada e M9-02 = Não",
"Na Etapa 4 você indicou uma atividade com regras específicas. Quer rever esta resposta?",
"Pergunta gentil"
],
[
"M9-12 = Sim, obra que muda estrutura, área ou uso e M6-01 sem item de reforma",
"A obra não aparece na lista do que você precisa para começar. Quer incluir?",
"Pergunta gentil"
],
[
"M9-03 = casa ou apartamento e M9-06 = Sim (qualquer número)",
"Com público no local, as condições para trabalhar em casa podem mudar. Confirme na prefeitura.",
"Atenção"
],
[
"M9-03 = Ainda não escolhi e M8-02 = sem CNPJ",
"Escolha o local depois da consulta de viabilidade.",
"Dica"
],
[
"M9-10 = Sim e M1-08 indica pouca experiência",
"A atividade pede profissional habilitado. Quem será o responsável?",
"Pergunta gentil"
],
[
"M9-03a = rua, feira ou veículo e M9-02 = alimentos ou bebidas",
"Venda de alimentos na rua ou em veículo passa pela Vigilância Sanitária, que pode exigir uma cozinha de apoio licenciada. Confirme na prefeitura.",
"Atenção"
],
[
"M9-07 = Vou vender gás de cozinha e M8-02 = sem CNPJ",
"A revenda de gás só pode ser feita por empresa autorizada pela ANP. Abra a empresa e peça a autorização antes de vender.",
"Atenção"
],
[
"M9-07b = dentro de cômodo fechado e M9-06 = Sim (qualquer número)",
"Com clientes no local, o gás em ambiente fechado pesa na vistoria dos Bombeiros. Veja se é possível levar o botijão para fora, em abrigo ventilado.",
"Atenção"
],
[
"M7-05 lista equipamento a gás e M9-07 = Não",
"Na Etapa 7 você indicou um equipamento a gás. Quer rever esta resposta?",
"Pergunta gentil"
]
],
"proximos": [
[
"M9-04 = Ainda não fiz ou Não sei",
"Faça a consulta de viabilidade no portal do seu estado ([link do estado]) antes de alugar, reformar ou registrar."
],
[
"M9-04 = Sim, foi negada",
"Procure a prefeitura para entender o motivo antes de gastar com o local."
],
[
"Há itens 'a confirmar' no checklist",
"Leve o checklist à prefeitura ou à Sala do Empreendedor (onde houver) e confirme os itens marcados."
],
[
"Bloco do local pulado (M9-03b = Ainda não faço ideia ou M9-03a = Não sei)",
"Escolha o local depois da consulta de viabilidade e volte a esta etapa antes de alugar ou assinar contrato."
],
[
"M9-03a = rua, feira ou veículo",
"Peça na prefeitura a licença de ambulante ou a permissão de uso do espaço onde vai vender."
],
[
"M9-07 = Vou vender gás de cozinha",
"Peça a autorização de revenda de GLP na ANP e a regularização nos Bombeiros antes de vender."
],
[
"M9-07a = 3 ou mais botijões ou cilindros P20/P45, ou M9-07b = cômodo fechado",
"Fale com os Bombeiros ou com um profissional habilitado sobre o abrigo ou a central de gás antes de comprar ou instalar."
],
[
"Todos os itens confirmados",
"Guarde os comprovantes (consulta, autorização do condomínio, licenças) em um só lugar."
]
],
"mensagem_limite": "O app oferece apoio educacional básico. As estimativas dependem dos dados fornecidos e não garantem resultados. Regras de registro, tributação, licenciamento e exercício profissional devem ser confirmadas em fontes oficiais e com profissionais habilitados."
};

/* ---------- sabotagem (só no conteúdo servido / carregado) ---------- */
const SAB = {
  1: ['if (L.tipo === "apto") s.push("M9-08");', 'if (L.casaOuApto) s.push("M9-08");'],
  2: ['const LIMITE = { alertas: 3,', 'const LIMITE = { alertas: 4,'],
};
/* sabotagem da tela: tira a caixa "Como descobrir" do "Não sei" */
const SAB_APP = {
  3: ['if (ehNS(cod, op)) return mostrar(caixaComo(cod, "", caixaNS(c.texto)) || caixaNS(c.texto));', 'if (ehNS(cod, op)) return mostrar(caixa(c.texto));'],
  4: ['if (ehNS(cod, op)) { erro(NS_ESCOLHA); return null; }', 'if (ehNS(cod, op)) return { estado: "naosei" };'],
  5: ['if (cod === "M9-03" && LIMPO_LOCAL8[X.m8Local]) return { op: LIMPO_LOCAL8[X.m8Local], m: 8 };', ''],
  6: ['ok.onclick = () => { const r0 = coletar(); if (r0) avancar(r0); };', 'let seg = false; ok.onclick = () => { const r0 = coletar(); if (!r0) return; if (!seg) { seg = true; ok.textContent = "Seguir"; return; } avancar(r0); };'],
  7: ['return h.split(MARCA_LINK).join(linkEstadoHtml());', 'return h.split(MARCA_LINK).join("[link do estado]");'],
  9: ['x.setAttribute("aria-pressed", String(x.dataset.v === op));', ''],
  10: ['if (cod === "M9-10" && X.m8Tecnico) return { op: X.m8Tecnico, m: 8 };', '// sabotagem: herança removida'],
};
/* sabotagem do CSS: tira o Continuar preso ao pé da tela */
const SAB_CSS = { 8: ['.pe-fixo{position:sticky;', '.pe-fixo{position:static;'] };
function cssTexto() {
  let t = fs.readFileSync(path.join(DIR, 'css/estilo.css'), 'utf8');
  const s = SAB_CSS[process.env.SABOTAR];
  if (s) { assert.ok(t.includes(s[0]), 'trecho da sabotagem não encontrado'); t = t.replace(s[0], s[1]); }
  return t;
}
function appTexto() {
  let t = fs.readFileSync(path.join(DIR, 'js/app.js'), 'utf8');
  const s = SAB_APP[process.env.SABOTAR];
  if (s) { assert.ok(t.includes(s[0]), 'trecho da sabotagem não encontrado'); t = t.replace(s[0], s[1]); if (process.env.SABOTAR === '10') t = t.replace('if (cod === \"M9-10\" && X.m8Tecnico) return { op: X.m8Tecnico, m: 8 };', '// sabotagem: segunda rota removida'); }
  return t;
}
function motorTexto() {
  let t = fs.readFileSync(path.join(DIR, 'js/motor.js'), 'utf8');
  const s = SAB[process.env.SABOTAR];
  if (s) { assert.ok(t.includes(s[0]), 'trecho da sabotagem não encontrado'); t = t.replace(s[0], s[1]); }
  return t;
}
const ctx = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(DIR, 'dados/modulo9.js'), 'utf8'), ctx);
vm.runInNewContext(motorTexto(), ctx);
const D = JSON.parse(JSON.stringify(ctx.window.MODULO9));
assert.equal(D.perguntas.find((q) => q.codigo === 'M9-13').pergunta, 'Quer anotar alguma dúvida sobre o local ou as licenças, para levar à prefeitura?', 'M9-13 trata de local/licenças');
assert.ok(D.perguntas.find((q) => q.codigo === 'M9-05').dica.includes('24 m²'), 'M9-05 traz método e exemplo de área');
const J = (x) => (x === undefined ? x : JSON.parse(JSON.stringify(x)));
/* objetos do vm são de outro realm: passa tudo por JSON para o deepStrictEqual */
const Mo = Object.fromEntries(Object.entries(ctx.window.Motor9).map(([k, v]) => [k, typeof v === 'function' ? (...a) => J(v(...a)) : J(v)]));

const norm = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();
const NS = 'Não sei';
/* item G: respostas que mostram balão de aviso (risco real que depende da resposta) — preenchido abaixo */
const ALERTAS_ESPERADOS = [
  'M9-03a · Na rua, em feiras ou eventos, em barraca, carrinho ou veículo (food truck)',   // alimentos na rua (cruzamento de Atenção)
  'M9-06 · Sim, menos de 100 pessoas ao mesmo tempo', 'M9-06 · Sim, 100 pessoas ou mais ao mesmo tempo',   // público em casa/apartamento
  'M9-07 · Vou vender gás de cozinha (revenda)',   // revenda de gás sem CNPJ
  'M9-07b · Dentro da cozinha ou de outro cômodo fechado',   // gás em local fechado
];
const EP = Object.fromEntries(ESPERADO.perguntas.map((q) => [q.codigo, q]));
/* linhas que descrevem o tipo de resposta, não botões */
const META = new Set(['Um dos 26 estados ou o Distrito Federal', 'Área informada (número maior que zero)', 'Valor inválido', 'Texto preenchido', 'Em branco']);
const opcoesDaLinha = (o) => { if (META.has(o)) return []; const p = o.split(' / '); return p.map((s, i) => (i > 0 && p[0].startsWith('Sim, ') && /^[a-zà-ú]/.test(s) ? 'Sim, ' + s : s)); };

/* ---------- 1. textos literais ---------- */
assert.equal(D.perguntas.length, 19);
assert.deepEqual(D.perguntas.map((q) => q.codigo), ESPERADO.perguntas.map((q) => q.codigo));
for (const q of D.perguntas) {
  const e = EP[q.codigo];
  assert.equal(q.pergunta, e.pergunta, q.codigo);
  assert.equal(q.aparece, e.aparece, q.codigo);
  assert.deepEqual(q.caminhos.map((c) => [c.opcao, c.texto]), e.caminhos, q.codigo);
}
assert.deepEqual(D.resumo.cruzamentos.map((c) => [c.quando, c.mensagem, c.forma]), ESPERADO.cruzamentos);
assert.deepEqual(D.resumo.proximos.map((c) => [c.situacao, c.mensagem]), ESPERADO.proximos);
assert.equal(D.mapa.mensagem_limite, ESPERADO.mensagem_limite);
const TOTAL = ESPERADO.perguntas.reduce((n, q) => n + q.caminhos.length, 0);
assert.equal(TOTAL, 65);
assert.equal((fs.readFileSync(path.join(DIR, 'dados/modulo9.js'), 'utf8').match(/rafael/gi) || []).length, 0, 'nome do implementador nos dados');
/* toda opção citada nas regras do motor existe no documento */
const todas = new Set(ESPERADO.perguntas.flatMap((q) => q.caminhos.flatMap((c) => opcoesDaLinha(c[0]))));
/* opções criadas pelo app no lote 3 (relatórios de Nayara e Gaby, 05/11/2026): fora do documento, inseridas depois de uma opção dele */
const OUTRA = 'Outra atividade', DOMIC = 'Na casa do cliente (atendimento em domicílio)';
const EXTRAS_APP = { 'M9-02': [['Não', OUTRA]], 'M9-03': [['Em loja ou sala comercial', DOMIC]] };
Object.entries(Mo.O).forEach(([k, v]) => assert.ok(todas.has(v) || [OUTRA, DOMIC].includes(v), `opção do motor fora do documento: ${k}=${v}`));
const opcoesTela = (cod) => { const l = EP[cod].caminhos.flatMap((c) => opcoesDaLinha(c[0])); (EXTRAS_APP[cod] || []).forEach(([dep, o]) => l.splice(l.indexOf(dep) + 1, 0, o)); return l.filter((o) => !(SEM_NS.includes(cod) && (o === NS || o === 'Ainda não faço ideia'))); };
assert.deepEqual(Mo.opcoes(D, 'M9-02'), ['Sim, alimentos ou bebidas', 'Sim, cosméticos, saneantes, medicamentos ou produtos para a saúde', 'Sim, procedimentos no corpo ou cuidado com pessoas', 'Sim, animais', 'Não', OUTRA, NS]);
assert.deepEqual(Mo.opcoes(D, 'M9-03'), ['Na minha casa', 'Em apartamento ou condomínio residencial', 'Em loja ou sala comercial', DOMIC, 'Sem local fixo (digital, na casa do cliente ou ambulante)', 'Ainda não escolhi']);
/* lote 16/11: sem "Não sei" nas perguntas sobre a própria pessoa; "Ainda não faço ideia" (= "Não sei") saiu do M9-03b.
   Item H: sim/não sobre a situação da pessoa (já consultou a prefeitura? vai ter gás? inflamáveis? fumaça/barulho? obra?) só com as respostas reais */
const SEM_NS = ['M9-01', 'M9-03', 'M9-03a', 'M9-03b', 'M9-04', 'M9-06', 'M9-07', 'M9-07b', 'M9-07c', 'M9-09', 'M9-11', 'M9-12'];
assert.deepEqual(Mo.SEM_NS, SEM_NS);
SEM_NS.forEach((c) => assert.ok(!Mo.opcoes(D, c).includes(NS) && !Mo.opcoes(D, c).includes('Ainda não faço ideia'), c + ': sem Não sei'));
['M9-02', 'M9-07a', 'M9-08', 'M9-10'].forEach((c) => assert.ok(Mo.opcoes(D, c).includes(NS), c + ': Não sei fica (regra ou fato de fora a descobrir)'));
/* item G: a orientação geral fica na "Ver dica", em texto corrido, sem cara de alerta */
D.perguntas.filter((q) => q.dica).forEach((q) => { assert.ok(!/Aten[çc][ãa]o|⚠/.test(q.dica), q.codigo + ': dica sem "Atenção"'); assert.ok(q.dica.split(/(?<=\.)\s+/).length <= 3, q.codigo + ': dica com até 3 frases'); });

/* ---------- 2. "Aparece quando": fluxo esperado reescrito a partir do documento ---------- */
const O = { casa: 'Na minha casa', apto: 'Em apartamento ou condomínio residencial', loja: 'Em loja ou sala comercial', sem: 'Sem local fixo (digital, na casa do cliente ou ambulante)', naoEsc: 'Ainda não escolhi',
  pCasa: 'Minha casa', pApto: 'Apartamento ou condomínio', pLoja: 'Loja ou sala comercial', pSem: 'Sem local fixo', pIdeia: 'Ainda não faço ideia',
  internet: 'Só pela internet ou por telefone', cliente: 'Na casa ou na empresa do cliente', rua: 'Na rua, em feiras ou eventos, em barraca, carrinho ou veículo (food truck)',
  botijao: 'Sim, botijão ou cilindro (gás de cozinha, GLP)' };
function esperadoSeq(A) {
  const s = ['M9-01', 'M9-02', 'M9-03'];
  const t3 = A['M9-03'];
  const semDefinir = t3 === O.naoEsc || t3 === NS;
  if (t3 === O.sem) s.push('M9-03a');
  if (semDefinir) { s.push('M9-03b'); if (A['M9-03b'] === O.pSem) s.push('M9-03a'); }
  s.push('M9-04');
  const tipo = t3 === O.casa || (semDefinir && A['M9-03b'] === O.pCasa) ? 'casa' : t3 === O.apto || (semDefinir && A['M9-03b'] === O.pApto) ? 'apto' : t3 === O.loja || (semDefinir && A['M9-03b'] === O.pLoja) ? 'loja' : null;
  const naRua = s.includes('M9-03a') && A['M9-03a'] === O.rua;
  if (tipo === 'casa' || tipo === 'apto') s.push('M9-05');            // casa ou apartamento (escolhido ou pretendido)
  if (tipo) s.push('M9-06');                                          // há local fixo
  if (tipo || naRua) {                                                // local fixo ou trabalho na rua
    s.push('M9-07');
    if (A['M9-07'] === O.botijao) s.push('M9-07a', 'M9-07b');          // M9-07 = botijão ou cilindro
    s.push('M9-07c');                                                 // mesma condição de M9-07
  }
  if (tipo === 'apto') s.push('M9-08');                               // apartamento ou condomínio
  if ((tipo === 'casa' || tipo === 'apto') && String(A['M9-02']).startsWith('Sim')) s.push('M9-09');
  s.push('M9-10', 'M9-11');
  if (tipo) s.push('M9-12');
  s.push('M9-13');
  return s;
}
const R_ = (A) => Object.fromEntries(Object.entries(A).map(([k, v]) => [k, v === NS ? { estado: 'naosei' } : /^\d/.test(v) && k === 'M9-05' ? { estado: 'valor', valor: v } : { estado: 'opcao', opcao: v }]));
let combos = 0;
const ops = (c) => EP[c].caminhos.flatMap((x) => opcoesDaLinha(x[0]));
for (const a2 of ['Sim, animais', 'Não', NS]) for (const a3 of ops('M9-03')) for (const a3b of [null, ...ops('M9-03b')]) for (const a3a of [null, ...ops('M9-03a')]) for (const a7 of ops('M9-07')) {
  const A = { 'M9-01': 'Acre', 'M9-02': a2, 'M9-03': a3, 'M9-07': a7 };
  if (a3b) A['M9-03b'] = a3b;
  if (a3a) A['M9-03a'] = a3a;
  assert.deepEqual(Mo.sequencia(R_(A)), esperadoSeq(A), JSON.stringify(A));
  combos++;
}
/* tabela "Quando não há local fixo": aparecem / puladas */
const tem = (seq, l) => l.forEach((c) => assert.ok(seq.includes(c), c));
const naoTem = (seq, l) => l.forEach((c) => assert.ok(!seq.includes(c), c));
const IMOVEL = ['M9-05', 'M9-06', 'M9-07', 'M9-07a', 'M9-07b', 'M9-07c', 'M9-08', 'M9-09', 'M9-12'];
for (const f of [O.internet, O.cliente]) { const s = Mo.sequencia(R_({ 'M9-02': 'Sim, animais', 'M9-03': O.sem, 'M9-03a': f })); tem(s, ['M9-04', 'M9-10', 'M9-11', 'M9-13']); naoTem(s, IMOVEL); }
{ const s = Mo.sequencia(R_({ 'M9-02': 'Sim, alimentos ou bebidas', 'M9-03': O.sem, 'M9-03a': O.rua, 'M9-07': O.botijao })); tem(s, ['M9-04', 'M9-07', 'M9-07a', 'M9-07b', 'M9-07c', 'M9-10', 'M9-11', 'M9-13']); naoTem(s, ['M9-05', 'M9-06', 'M9-08', 'M9-09', 'M9-12']); }
for (const A of [{ 'M9-03': O.naoEsc, 'M9-03b': O.pIdeia }, { 'M9-03': O.sem, 'M9-03a': NS }]) { const s = Mo.sequencia(R_(Object.assign({ 'M9-02': 'Sim, animais' }, A))); tem(s, ['M9-04', 'M9-10', 'M9-11', 'M9-13']); naoTem(s, IMOVEL); }

/* ---------- checklist e resumo esperados por situação (tabela + regras) ---------- */
const sits = (A, feitos) => Object.fromEntries(Mo.checklist(D, R_(A), feitos).map((i) => [i.id, i.sit]));
const BASE_REMOTO = { 'M9-01': 'Acre', 'M9-02': 'Não', 'M9-03': O.sem, 'M9-03a': O.internet, 'M9-04': 'Ainda não fiz', 'M9-10': 'Não', 'M9-11': 'Não' };
assert.deepEqual(sits(BASE_REMOTO), { viabilidade: 'a confirmar', local: 'não se aplica', gas: 'não se aplica', bombeiros: 'não se aplica', vigilancia: 'não se aplica', ambulante: 'não se aplica', conselho: 'não se aplica', ambiente: 'não se aplica', obra: 'não se aplica' });
const RUA = { 'M9-01': 'Bahia', 'M9-02': 'Sim, alimentos ou bebidas', 'M9-03': O.sem, 'M9-03a': O.rua, 'M9-04': 'Ainda não fiz', 'M9-07': O.botijao, 'M9-07a': '1 botijão de 13 kg (P13)', 'M9-07b': 'No veículo, na barraca ou no carrinho', 'M9-07c': 'Não', 'M9-10': 'Não', 'M9-11': 'Não' };
assert.deepEqual(sits(RUA), { viabilidade: 'a fazer', local: 'não se aplica', gas: 'a fazer', bombeiros: 'a fazer', vigilancia: 'a fazer', ambulante: 'a fazer', conselho: 'não se aplica', ambiente: 'não se aplica', obra: 'não se aplica' });
const IDEIA = { 'M9-01': NS, 'M9-02': 'Não', 'M9-03': O.naoEsc, 'M9-03b': O.pIdeia, 'M9-04': 'Ainda não fiz', 'M9-10': 'Sim', 'M9-11': NS };
assert.deepEqual(sits(IDEIA), { viabilidade: 'a confirmar', local: 'a confirmar', gas: 'a confirmar', bombeiros: 'a confirmar', vigilancia: 'não se aplica', ambulante: 'não se aplica', conselho: 'a fazer', ambiente: 'a confirmar', obra: 'a confirmar' });
assert.equal(sits(RUA, { gas: true }).gas, 'feito', 'item marcado como feito');
const caminhoTxt = (c, o) => EP[c].caminhos.find((x) => x[0] === o || opcoesDaLinha(x[0]).includes(o))[1];
const atencao = (c) => caminhoTxt(c, NS).split('⚠ Atenção:')[1].trim();
assert.ok(Mo.alertas(D, R_(IDEIA), {}).includes(caminhoTxt('M9-03b', O.pIdeia)), 'local não definido: alerta para voltar');
assert.ok(Mo.alertas(D, R_(IDEIA), {}).includes('⚠ Atenção: ' + atencao('M9-11')), '"Não sei" seguido entra nos alertas');
assert.deepEqual(Mo.proximos(D, R_(IDEIA), Mo.checklist(D, R_(IDEIA))), [ESPERADO.proximos[0][1].replace('[link do estado]', D.viabilidade.geral), ESPERADO.proximos[2][1], ESPERADO.proximos[3][1]]);
assert.deepEqual(Mo.proximos(D, R_(RUA), Mo.checklist(D, R_(RUA))), [ESPERADO.proximos[0][1].replace('[link do estado]', 'https://regin.juceb.ba.gov.br/regin.externo/ViabilidadeOpcaoV4.aspx'), ESPERADO.proximos[4][1], ESPERADO.proximos[7][1]]);
/* tudo "Não sei" num apartamento: muitos alertas, mas no máximo 3 */
const TUDO_NS = { 'M9-01': NS, 'M9-02': NS, 'M9-03': O.apto, 'M9-04': NS, 'M9-05': NS, 'M9-06': NS, 'M9-07': NS, 'M9-07c': NS, 'M9-08': NS, 'M9-10': NS, 'M9-11': NS, 'M9-12': NS, 'M9-13': '' };
assert.equal(Mo.alertas(D, R_(TUDO_NS), {}).length, 3, 'no máximo 3 alertas');
assert.equal(Mo.proximos(D, R_(TUDO_NS), Mo.checklist(D, R_(TUDO_NS))).length, 2);
const GAS = { 'M9-01': 'Minas Gerais', 'M9-02': 'Não', 'M9-03': O.loja, 'M9-04': 'Sim, foi negada', 'M9-06': 'Sim, menos de 100 pessoas ao mesmo tempo', 'M9-07': O.botijao, 'M9-07a': 'Cilindros de 20 kg ou 45 kg (P20, P45)', 'M9-07b': 'Dentro da cozinha ou de outro cômodo fechado', 'M9-07c': NS, 'M9-10': 'Não', 'M9-11': 'Não', 'M9-12': 'Não' };
assert.deepEqual(Mo.alertas(D, R_(GAS), {}), [caminhoTxt('M9-07a', 'Cilindros de 20 kg ou 45 kg (P20, P45)'), caminhoTxt('M9-07b', 'Dentro da cozinha ou de outro cômodo fechado'), ESPERADO.cruzamentos[7][1]]);
assert.deepEqual(Mo.proximos(D, R_(GAS), Mo.checklist(D, R_(GAS))), [ESPERADO.proximos[1][1], ESPERADO.proximos[2][1], ESPERADO.proximos[6][1]]);
/* alimento percebido + "Não" na pergunta de saúde: Vigilância Sanitária "a confirmar", nunca "não se aplica" */
assert.equal(Mo.checklist(D, R_(BASE_REMOTO), undefined, { alimento: true }).find((i) => i.id === 'vigilancia').sit, 'a confirmar');
assert.equal(Mo.checklist(D, R_(BASE_REMOTO), undefined, { alimento: false }).find((i) => i.id === 'vigilancia').sit, 'não se aplica');
assert.equal(Mo.checklist(D, R_(Object.assign({}, BASE_REMOTO, { 'M9-02': NS })), undefined, { alimento: true }).find((i) => i.id === 'vigilancia').sit, 'a confirmar');
/* lote 3: domicílio = sem local fixo sem perguntar a forma; "Outra atividade" = Vigilância "a confirmar" */
{
  const DOM = { 'M9-01': 'Minas Gerais', 'M9-02': 'Sim, procedimentos no corpo ou cuidado com pessoas', 'M9-03': DOMIC, 'M9-04': 'Ainda não fiz', 'M9-10': 'Não', 'M9-11': 'Não' };
  assert.deepEqual(Mo.sequencia(R_(DOM)), ['M9-01', 'M9-02', 'M9-03', 'M9-04', 'M9-10', 'M9-11', 'M9-13'], 'domicílio: sem perguntas do imóvel nem da forma');
  assert.deepEqual(Mo.sequencia(R_(DOM)), esperadoSeq(DOM));
  const sd = sits(DOM);
  assert.deepEqual(sd, { viabilidade: 'a confirmar', local: 'não se aplica', gas: 'não se aplica', bombeiros: 'não se aplica', vigilancia: 'a fazer', ambulante: 'não se aplica', conselho: 'não se aplica', ambiente: 'não se aplica', obra: 'não se aplica' }, 'domicílio: sem itens do ponto; a licença da atividade continua');
  assert.equal(Mo.checklist(D, R_(DOM)).find((i) => i.id === 'local').motivo, 'Atende na casa do cliente');
  assert.ok(Mo.linhaResumo(D, R_(DOM), Mo.checklist(D, R_(DOM))).includes('atendimento na casa do cliente (fato)'));
  assert.ok(Mo.caminho(D, 'M9-03', DOMIC).texto.includes('não precisa de alvará para um ponto próprio') && Mo.caminho(D, 'M9-03', DOMIC).texto.includes('confira na prefeitura'));
  const OUT = Object.assign({}, BASE_REMOTO, { 'M9-02': OUTRA });
  const ROUT = R_(OUT); ROUT['M9-02'].detalhe = 'Revenda de joias';
  const vg = Mo.checklist(D, ROUT).find((i) => i.id === 'vigilancia');
  assert.equal(vg.sit, 'a confirmar', '"Outra atividade": Vigilância a confirmar');
  assert.ok(vg.motivo.includes('Revenda de joias') && vg.motivo.includes('confira'), vg.motivo);
  assert.ok(!Mo.sequencia(ROUT).includes('M9-09') && !Mo.sanitario(ROUT), '"Outra atividade" não conta como atividade de saúde');
}
console.log(`motor: ${combos} combinações de respostas com o fluxo esperado; situações da tabela "sem local fixo" conferidas`);

/* ---------- servidor (serve o motor sabotado quando pedido) ---------- */
const TIPOS = { '.svg': 'image/svg+xml', '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.webp': 'image/webp', '.png': 'image/png', '.ttf': 'font/ttf' };
const server = http.createServer(async (req, res) => {
  const f = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://x').pathname));
  try {
    const b = f.endsWith(path.join('m09', 'js', 'motor.js')) ? motorTexto() : f.endsWith(path.join('m09', 'js', 'app.js')) ? appTexto() : f.endsWith(path.join('m09', 'css', 'estilo.css')) ? cssTexto() : await fsp.readFile(f);
    res.writeHead(200, { 'Content-Type': TIPOS[path.extname(f)] || 'application/octet-stream' }); res.end(b);
  } catch { res.writeHead(404).end(); }
});

(async () => {
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const URL0 = `http://127.0.0.1:${server.address().port}/lg2/turma-b/m09/index.html`;
  const b = await chromium.launch();
  const page = await b.newPage({ viewport: { width: 390, height: 844 } });
  page.setDefaultTimeout(8000);
  const errs = []; page.on('pageerror', (e) => errs.push(e.message)); page.on('dialog', (d) => d.accept());
  page.on('response', (r) => { if (r.status() >= 400) errs.push(r.status() + ' ' + r.url()); });
  const K = 'lg2-turma-b-m09';
  const st = () => page.evaluate((k) => JSON.parse(localStorage.getItem(k)), K);
  const titulo = async () => norm(await page.textContent('#pergunta'));
  /* na tela vai o enunciado curto ("curta") quando existe; o texto literal segue nos dados */
  const codAtual = async () => { const t = await titulo(); return D.perguntas.find((q) => norm(q.curta || q.pergunta) === t).codigo; };
  /* palavras visíveis antes de tocar (innerText, como no Módulo 1); a lista fechada de estados (select) não conta */
  const palavrasTela = () => page.evaluate(() => {
    const n = (t) => t.split(/\s+/).filter((w) => /[A-Za-zÀ-ÿ0-9]/.test(w)).length;
    /* a resposta já marcada (herdada de outro módulo) mostra o retorno dela: é resposta, não texto da pergunta */
    return n(document.querySelector('#tela').innerText) - [...document.querySelectorAll('#tela select, #retorno, .p-linha-integrada, .p-fontes summary')].reduce((a, s) => a + n(s.innerText), 0);
  });
  /* o texto da opção fica no <b>; embaixo pode vir uma linha de exemplo (lote 16/11) */
  const tocar = (t) => page.evaluate((t) => { const b = [...document.querySelectorAll('.opcao')].find((x) => (x.querySelector('.op-txt b') || x).textContent.replace(/\s+/g, ' ').trim() === t); if (!b) throw new Error('opção ausente: ' + t); b.click(); }, t);
  /* textContent: o resto do texto longo fica em "Ver mais" fechado (lote 3), mas continua sendo o texto literal */
  const retorno = (sel) => page.evaluate((sel) => [...document.querySelectorAll(sel + ' .bloco:not(.cruz):not(.extra) p')].map((p) => p.textContent).join(' '), sel || '#retorno');
  const cruzes = () => page.evaluate(() => [...document.querySelectorAll('#retorno .cruz p')].map((p) => p.innerText.replace(/\s+/g, ' ').trim()));
  /* D (lote 16/11, 3ª rodada): textos com norma/sigla aparecem em versão simples; o original vai para "Detalhes técnicos" */
  const PLANO_ESP = {
    [EP['M9-07'].caminhos.find((c) => c[0].startsWith('Sim, gás encanado'))[1]]: 'A ligação é feita pela companhia de gás. A instalação dentro do imóvel (canos, registros e ventilação dos aparelhos) deve ser feita por empresa ou profissional habilitado, que assina como responsável. Em comércio, os Bombeiros podem conferir a instalação.',
    [EP['M9-07'].caminhos.find((c) => c[0].startsWith('Vou vender'))[1]]: 'Para vender botijões, você precisa de empresa com autorização da agência nacional do gás, lugar para guardar os botijões do tamanho permitido e liberação dos Bombeiros e da prefeitura. Não comece a vender antes.',
    [EP['M9-07a'].caminhos.find((c) => c[0].startsWith('3 ou mais'))[1]]: 'Com mais gás, os Bombeiros costumam exigir um abrigo ou uma central de gás, feita por engenheiro ou arquiteto que assina como responsável, conforme as regras do seu estado. Confirme antes de comprar os cilindros ou fazer a instalação.',
    [ESPERADO.cruzamentos.find((c) => c[1].includes('autorizada pela ANP'))[1]]: 'Só empresa com autorização da agência nacional do gás pode vender botijões. Abra a empresa e peça a autorização antes de vender.',
    [ESPERADO.proximos.find((c) => c[1].includes('GLP na ANP'))[1]]: 'Peça a autorização para vender gás à agência nacional do gás e a liberação dos Bombeiros antes de vender.',
  };
  const plano = (t) => PLANO_ESP[t] || t;
  /* termos técnicos que não podem aparecer no texto principal (só dentro de "Detalhes técnicos");
     a resposta da pessoa (.resp) repete o texto da opção, que não muda (outros módulos o comparam) */
  const TECNICO = /NBR|ABNT|Resolução|RDC|\bIN \d|ART ou RRT|\bART\b|\bRRT\b|AVCB|CNAE|Redesim|\bLei \d|\bLC \d|\bGLP\b|\bANP\b|Anvisa|CGSIM|CCMEI/;
  const semTec = (sel) => page.evaluate((sel) => [...document.querySelectorAll(sel)].map((e) => { const c = e.cloneNode(true); c.querySelectorAll('details.tec, .resp').forEach((d) => d.remove()); return c.textContent; }).join(' ').replace(/\s+/g, ' '), sel);
  const esperadoVisivel = (t) => norm(plano(t).replace('⚠ Atenção:', '').replace(/^Atenção: /, ''));
  async function abrir(estado, outros) {
    await page.goto(URL0);
    await page.evaluate(([k, e, o]) => { localStorage.clear(); if (e) localStorage.setItem(k, JSON.stringify(e)); Object.entries(o || {}).forEach(([kk, v]) => localStorage.setItem(kk, JSON.stringify(v))); }, [K, estado, outros]);
    await page.reload();
  }
  /* B1 + E (lote 17/11): nenhum "[palavra]" nem "Módulo" no texto da tela (inclusive dentro de painéis fechados). O pedido
     para a IA ([data-prompt]) fica de fora dos colchetes: ele pede para a pessoa trocar o que está entre colchetes. */
  let telasLimpas = 0;
  async function telaLimpa(onde) {
    const r = await page.evaluate(() => {
      const c = document.querySelector('#tela').cloneNode(true);
      const tudo = c.textContent + ' ' + document.title;
      c.querySelectorAll('[data-prompt]').forEach((e) => e.remove());
      return { colchete: (c.textContent.match(/\[[A-Za-zÀ-ÿ][^\]]*\]/g) || []), modulo: (tudo.match(/.{0,30}M[óo]dulo.{0,20}/gi) || []), grupo: /Grupo \d/.test(tudo) };
    });
    assert.deepEqual(r.colchete, [], onde + ': colchete sem troca na tela');
    assert.deepEqual(r.modulo, [], onde + ': "Módulo" na tela (use "Etapa")');
    assert.equal(r.grupo, false, onde + ': "Grupo N" na tela');
    telasLimpas++;
  }
  /* A (lote 17/11): nenhum passo extra nem botão "Corrigir minha resposta" */
  async function semPassoExtra(onde) {
    const n = await page.evaluate(() => [...document.querySelectorAll('button, a')].filter((b) => /^(Seguir|Corrigir minha resposta)$/.test(b.textContent.replace(/\s+/g, ' ').trim())).length);
    assert.equal(n, 0, onde + ': botão "Seguir" ou "Corrigir minha resposta"');
  }
  /* F (lote 17/11): todo alvo de toque visível do módulo com 44 px de altura ou mais (links no meio do texto ficam de fora) */
  async function alvos44(onde) {
    const baixos = await page.evaluate(() => [...document.querySelectorAll('#tela button, #tela summary, #tela a.btn, #tela a.link-estado, #tela label.chk, #tela select, #tela input:not([type=checkbox]), #tela textarea')]
      .filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && !e.closest('details:not([open]) > :not(summary)'); })
      .map((e) => [e.textContent.replace(/\s+/g, ' ').trim().slice(0, 30) || e.id || e.tagName, Math.round(e.getBoundingClientRect().height)])
      .filter(([, h]) => h < 44));
    assert.deepEqual(baixos, [], onde + ': alvos com menos de 44 px');
  }

  /* ---------- 3. capa, estado antigo descartado ---------- */
  await abrir({ R: { 'M9.P01': { estado: 'opcao', opcao: 'Sim' } }, hist: ['M9.P01'] });
  assert.equal(norm(await page.textContent('#ir')), 'Começar', 'estado da versão anterior descartado');
  assert.equal(norm(await page.textContent('.heroi h1')), norm(D.modulo.nome));
  assert.equal(await page.locator('.rodape .logos img').count(), 3);
  assert.ok(norm(await page.textContent('.corpo')).includes(norm(ESPERADO.mensagem_limite)), 'mensagem de limite na capa');
  /* versão leve: título + uma frase + tempo + Começar; o resto em "Como funciona" fechado */
  assert.equal(norm(await page.textContent('.heroi p')), norm(D.capa.frase));
  assert.equal(norm(await page.textContent('.tempo')), `Esta etapa leva cerca de ${D.capa.minutos} minutos`);
  /* G: o tempo da capa = caminho mais comum (trabalho em casa, com alimento e botijão) x 35 s, arredondado para múltiplo de 5 min */
  { const TIPICO = { 'M9-02': 'Sim, alimentos ou bebidas', 'M9-03': O.casa, 'M9-07': O.botijao };
    const n = esperadoSeq(TIPICO).length; assert.equal(n, 15);
    assert.equal(D.capa.minutos, Math.max(5, Math.round(n * 35 / 60 / 5) * 5), 'tempo da capa = caminho típico'); }
  await telaLimpa('capa'); await alvos44('capa');
  await page.click('details.como-funciona summary'); await alvos44('capa, Como funciona aberto'); await page.click('details.como-funciona summary');
  assert.equal(await page.$eval('details.como-funciona', (d) => d.open), false, '"Como funciona" fechado');
  assert.ok(norm(await page.textContent('details.como-funciona')).includes(norm(D.mapa.nao_faz)), 'o que o módulo não faz dentro de "Como funciona"');
  const pCapa = await palavrasTela();
  assert.ok(pCapa <= 60, 'capa com ' + pCapa + ' palavras');
  if (SHOTS) await page.screenshot({ path: path.join(SHOTS, 'm09_inicio.png') });

  /* ---------- 4. cada linha de caminho alcançada na tela ---------- */
  const OUTROS = {
    'lg2-turma-a-m04': { R: { 'M4.P15': { estado: 'opcao', opcao: 'Sim' } } },
    /* sem tipo de saúde no texto: com M4 = Sim + alimento, a M9-02 seria pulada (lote 16/11, item F) */
    'lg2-turma-b-m08': { R: { 'M8.P01': { estado: 'valor', valor: 'Presentes personalizados por encomenda' }, 'M8.P05': { estado: 'opcao', opcao: 'Não' } } },
    'lg2-turma-a-m01': { R: { 'M1.P04': { estado: 'opcao', opcao: 'Ainda não sei fazer' } } },
    'lg2-turma-b-m06': { R: { 'M6.P01': { estado: 'valor', valor: 'Batedeira e formas' } } },
    'lg2-turma-b-m07': { mapa: ['Receber o pedido', 'Assar no fogão a gás'], R: {} },
  };
  const CENA = { 'M9-01': 'Minas Gerais', 'M9-02': 'Sim, alimentos ou bebidas', 'M9-03': O.apto, 'M9-04': 'Sim, foi aprovada', 'M9-05': '30', 'M9-06': 'Sim, menos de 100 pessoas ao mesmo tempo', 'M9-07': O.botijao, 'M9-07a': '1 botijão de 13 kg (P13)', 'M9-07b': 'Do lado de fora, em área aberta e ventilada ou em abrigo próprio', 'M9-07c': 'Não', 'M9-08': 'Sim', 'M9-09': 'Área separada, de uso exclusivo, com equipamentos exclusivos', 'M9-10': 'Não', 'M9-11': 'Não', 'M9-12': 'Não' };
  const cenaPara = (cod) => cod === 'M9-03a' ? Object.assign({}, CENA, { 'M9-03': O.sem }) : cod === 'M9-03b' ? Object.assign({}, CENA, { 'M9-03': O.naoEsc }) : CENA;
  const alcancadas = new Set();
  const palavrasPorTela = {};
  const LIMITE_PAL = { 'M9-02': 96, 'M9-03': 62 };   // M9-02: 4 linhas de exemplo (+26) com o lembrete do Módulo 4; M9-03: +2 exemplos
  /* caixa "Como descobrir" na tela = passos e pedido dos dados */
  const DQ = Object.fromEntries(D.perguntas.map((q) => [q.codigo, q]));
  async function confereComo(cod, sel) {
    const q = DQ[cod];
    assert.ok(q.comoDescobrir && q.comoDescobrir.length === 2 && q.comoDescobrir.every((x) => x.trim().length > 20), cod + ': 2 passos nos dados');
    const passos = await page.$$eval(sel + ' .como-descobrir li', (ls) => ls.map((l) => l.textContent.replace(/\s+/g, ' ').trim()));
    assert.deepEqual(passos, q.comoDescobrir.map(norm), cod + ': passos do "Como descobrir"');
    assert.ok(await page.locator(sel + ' .como-descobrir').first().isVisible(), cod + ': caixa visível');
    assert.ok(q.promptIA && /\[[^\]]+\]/.test(q.promptIA) && !/chatgpt|gemini|copilot/i.test(q.promptIA), cod + ': pedido com colchetes e sem marca');
    assert.equal(norm(await page.textContent(sel + ' .como-descobrir [data-prompt]')), norm(q.promptIA));
    assert.equal(norm(await page.textContent(sel + ' .como-descobrir [data-copiar]')), 'Copiar');
    assert.ok(norm(await page.textContent(sel + ' .como-descobrir')).includes('Copie, cole numa IA de sua preferência e troque o que está entre colchetes.'));
  }
  const COM_AJUDA = D.perguntas.filter((q) => q.comoDescobrir).map((q) => q.codigo);
  assert.deepEqual(COM_AJUDA, ['M9-02', 'M9-03', 'M9-03a', 'M9-03b', 'M9-04', 'M9-05', 'M9-06', 'M9-07', 'M9-07a', 'M9-07b', 'M9-07c', 'M9-08', 'M9-09', 'M9-10', 'M9-11', 'M9-12'], 'toda pergunta com "Não sei" tem ajuda');
  const comoVistos = new Set();
  const marca = (cod, i) => alcancadas.add(cod + '#' + i);
  const cruzVistos = new Set();
  const alertasVistos = new Set();
  for (const q of ESPERADO.perguntas) {
    const cod = q.codigo;
    if (cod === 'M9-14') continue;
    const A = cenaPara(cod);
    const antes = esperadoSeq(A); const ate = antes.slice(0, antes.indexOf(cod));
    assert.ok(antes.includes(cod), cod);
    await abrir({ v: 2, R: R_(Object.fromEntries(ate.map((c) => [c, A[c]]))), feitos: {} }, OUTROS);
    await page.click('#ir');
    assert.equal(await codAtual(), cod, 'abre a 1ª pergunta sem resposta');
    const pal = await palavrasTela();
    /* limite de 60 palavras; o lote 16/11 acrescentou exemplos curtos ("Ex.: …") e sobe o limite só onde eles entram */
    assert.ok(pal <= (LIMITE_PAL[cod] || 60), `${cod}: ${pal} palavras antes de tocar`);
    palavrasPorTela[cod] = pal;
    if (await page.locator('.dica-toggle').count()) assert.equal(await page.$eval('.dica-toggle', (d) => d.open), false, cod + ': "Ver dica" fechada');
    else assert.ok(['M9-13'].includes(cod), cod + ': sem "Ver dica"');
    if (D.perguntas.find((x) => x.codigo === cod).dica) assert.ok(norm(await page.textContent('.dica-toggle')).includes(norm(D.perguntas.find((x) => x.codigo === cod).dica)));
    assert.equal(await page.locator('.como-descobrir').count(), 0, cod + ': ajuda do "Não sei" só depois de tocar');
    /* D: dica e passos em palavras simples; nome de norma, lei ou sigla só em "Detalhes técnicos", fechado na pergunta */
    if (await page.locator('.dica-toggle').count()) {
      const visivel = await semTec('.dica-toggle');
      assert.ok(!TECNICO.test(visivel), cod + ': termo técnico fora de "Detalhes técnicos": ' + (visivel.match(TECNICO) || [])[0]);
      assert.equal(await page.$$eval('.dica-toggle details.tec', (ds) => ds.filter((d) => d.open).length), 0, cod + ': "Detalhes técnicos" fechado na pergunta');
    }
    for (const x of DQ[cod].comoDescobrir || []) assert.ok(!TECNICO.test(x), cod + ': termo técnico no "Como descobrir": ' + x);
    const botoes = await page.$$eval('#ent .opcao .op-txt b', (bs) => bs.map((x) => x.textContent.replace(/\s+/g, ' ').trim()));
    /* M9-01: o estado não tem mais "Não sei" (relatório da Júlia, 05/11) */
    assert.deepEqual(botoes, cod === 'M9-01' ? [] : opcoesTela(cod), `opções de ${cod}`);
    /* sem "Não sei": os passos do "Como descobrir" ficam na "Ver dica", como ajuda para decidir */
    if (SEM_NS.includes(cod) && DQ[cod].comoDescobrir) assert.deepEqual(await page.$$eval('.dica-toggle .para-decidir li', (ls) => ls.map((l) => l.textContent.replace(/\s+/g, ' ').trim())), DQ[cod].comoDescobrir.map(norm), cod + ': passos na dica');
    for (let i = 0; i < q.caminhos.length; i++) {
      const [linha, txt] = q.caminhos[i];
      if (cod === 'M9-01' && opcoesDaLinha(linha).includes(NS)) { assert.equal(await page.locator('#ent .opcao').count(), 0, 'M9-01 sem botão Não sei'); marca(cod, i); continue; }
      /* linha de "Não sei" (ou "Ainda não faço ideia") numa pergunta que perdeu o botão: o botão não existe */
      if (SEM_NS.includes(cod) && opcoesDaLinha(linha).every((o) => o === NS || o === O.pIdeia)) {
        for (const o of opcoesDaLinha(linha)) assert.equal(await page.evaluate((o) => [...document.querySelectorAll('#ent .opcao .op-txt b')].some((b) => b.textContent.trim() === o), o), false, cod + ': sem botão ' + o);
        marca(cod, i); continue;
      }
      if (cod === 'M9-01' && i === 0) { await page.selectOption('#uf', 'Minas Gerais'); assert.equal(norm(await retorno()), norm(txt.replace('[estado]', 'Minas Gerais'))); marca(cod, i); continue; }
      if (cod === 'M9-05' && opcoesDaLinha(linha).includes(NS)) { await page.click('#nsb'); assert.equal(norm(await retorno()), norm(txt)); await confereComo(cod, '#retorno'); comoVistos.add(cod);
        await page.click('#ok'); assert.equal(await codAtual(), 'M9-05', 'M9-05: "Não sei" não avança'); assert.equal(norm(await page.textContent('#erro')), 'Use a ajuda acima e escreva a área para continuar.'); assert.equal((await st()).R['M9-05'], undefined, 'M9-05: "Não sei" não grava');
        await page.fill('#area', '30'); assert.equal(await page.locator('#retorno .como-descobrir').count(), 0, 'M9-05: digitar a área tira a ajuda'); marca(cod, i); continue; }
      if (cod === 'M9-05' && linha.startsWith('Área informada')) {
        /* A: retorno do campo ao vivo, ~700 ms depois da última tecla ou ao sair do campo, antes de tocar Continuar */
        await page.fill('#area', '30'); assert.equal(norm(await retorno()), '', 'M9-05: sem retorno no meio da digitação');
        await page.waitForTimeout(900); assert.equal(norm(await retorno()), norm(txt), 'M9-05: retorno 700 ms depois da última tecla');
        await page.fill('#area', ''); await page.fill('#area', '30'); await page.$eval('#area', (e) => e.blur());
        assert.equal(norm(await retorno()), norm(txt), 'M9-05: retorno ao sair do campo'); marca(cod, i); continue; }
      if (cod === 'M9-05' && linha === 'Valor inválido') {
        for (const v of ['0', '-5', 'abc']) { await page.fill('#area', v); await page.$eval('#area', (e) => e.blur()); assert.equal(norm(await retorno()), norm(txt), v); }
        await page.click('#ok'); assert.equal(await codAtual(), 'M9-05', 'valor inválido não avança'); marca(cod, i); continue;
      }
      if (cod === 'M9-13') { await page.fill('#ideias', linha === 'Texto preenchido' ? 'Vender também em feiras' : ''); assert.equal(norm(await retorno()), norm(txt)); marca(cod, i); continue; }
      for (const o of opcoesDaLinha(linha)) {
        await tocar(o);
        const ehNS = o === NS;
        /* "Não sei": só a parte "Verifique…" dentro da ajuda; o cuidado geral está na dica (item G) */
        /* B1: "[link do estado]" vira o link do portal do estado escolhido (Minas Gerais na cena), ao vivo, antes de Continuar */
        assert.equal(norm(await retorno()), ehNS ? norm(txt.split('⚠ Atenção:')[0]) : esperadoVisivel(txt.replace('[link do estado]', 'abrir o site de Minas Gerais')), `${cod} · ${o}`);
        if (txt.includes('[link do estado]')) {
          const lk = await page.$$eval('#retorno a.link-estado', (as) => as.map((a) => [a.getAttribute('href'), a.target, a.rel, a.textContent]));
          assert.deepEqual(lk, [[D.viabilidade.estados.find((e) => e.estado === 'Minas Gerais').link, '_blank', 'noopener', 'abrir o site de Minas Gerais']], cod + ': link do estado na caixa ao vivo');
          if (SHOTS) { await page.waitForTimeout(400); await page.screenshot({ path: path.join(SHOTS, 'm09_link_do_estado.png') }); }
        }
        await telaLimpa(`${cod} · ${o}`);
        /* D: a opção tocada diz que está marcada; as outras, que não */
        assert.deepEqual(await page.$$eval('#ent .opcao', (bs) => bs.map((b) => [b.querySelector('.op-txt b').textContent.trim(), b.getAttribute('aria-pressed')])).then((l) => l.filter(([x, a]) => (x === o) !== (a === 'true'))), [], `${cod} · ${o}: aria-pressed`);
        if (!ehNS && await page.locator('#retorno .b-alerta').count()) alertasVistos.add(cod + ' · ' + o);
        if (ehNS) {
          await confereComo(cod, '#retorno'); comoVistos.add(cod);
          assert.equal(await page.locator('#retorno .b-alerta').count(), 0, cod + ': sem balão de alerta no "Não sei" (o cuidado está na dica)');
          /* bloqueia: Continuar não grava nem avança */
          const antes = JSON.stringify(await st());
          await page.click('#ok');
          assert.equal(await codAtual(), cod, cod + ': "Não sei" não avança');
          assert.equal(norm(await page.textContent('#erro')), 'Use a ajuda acima e escolha a sua resposta para continuar.');
          assert.equal(JSON.stringify(await st()), antes, cod + ': "Não sei" não grava');
        }
        else assert.equal(await page.locator('#retorno .como-descobrir').count(), 0, `${cod} · ${o}: sem "Como descobrir"`);
        assert.equal(await page.locator('#verifiquei').count(), 0, `${cod} · ${o}: sem "Já verifiquei"`);
        assert.equal(norm(await page.textContent('#ok')), cod === 'M9-13' ? 'Ver meu checklist' : 'Continuar');
        (await cruzes()).forEach((c) => cruzVistos.add(cod + ' · ' + o + ' => ' + c));
      }
      marca(cod, i);
    }
  }
  /* M9-14 (tela do resumo) */
  const tudo = Object.fromEntries(esperadoSeq(CENA).map((c) => [c, CENA[c] ?? '']));
  tudo['M9-13'] = '';
  await abrir({ v: 2, R: Object.assign(R_(tudo), { 'M9-13': { estado: 'valor', valor: '' } }), feitos: {} });
  await page.click('#ir');
  assert.equal(norm(await page.textContent('.passo')), 'Resultado');
  for (let i = 0; i < EP['M9-14'].caminhos.length; i++) {
    const [o, txt] = EP['M9-14'].caminhos[i];
    await page.evaluate((o) => [...document.querySelectorAll('#op14 .opcao')].find((x) => x.textContent.trim() === o).click(), o);
    assert.equal(norm(await retorno('#ret14')), norm(txt));
    assert.equal(await page.locator('#corr').isVisible(), o === 'Quero corrigir algo');
    /* D: a escolha do resumo também diz se está marcada */
    assert.deepEqual(await page.$$eval('#op14 .opcao', (bs) => bs.map((b) => [b.textContent.trim(), b.getAttribute('aria-pressed')])).then((l) => l.filter(([x, a]) => (x === o) !== (a === 'true'))), [], 'M9-14 · ' + o + ': aria-pressed');
    await semPassoExtra('resultado · ' + o);
    marca('M9-14', i);
  }
  assert.equal(alcancadas.size, TOTAL, `linhas alcançadas ${alcancadas.size} de ${TOTAL}`);
  /* item G: balão de aviso só onde a resposta aponta um risco real (nunca para todas as respostas de uma pergunta) */
  assert.deepEqual([...alertasVistos].sort(), ALERTAS_ESPERADOS.slice().sort(), 'avisos depois de responder: ' + [...alertasVistos].join(' | '));
  console.log('avisos que dependem da resposta: ' + [...alertasVistos].join(' | '));
  const COM_NS = COM_AJUDA.filter((c) => !SEM_NS.includes(c));
  assert.deepEqual([...comoVistos].sort(), [...COM_NS].sort(), '"Como descobrir" visto em toda pergunta com "Não sei"');
  console.log('palavras por pergunta (antes de tocar): ' + JSON.stringify(palavrasPorTela));
  console.log(`caminhos: ${alcancadas.size} de ${TOTAL} linhas alcançadas na tela`);

  /* cruzamentos mostrados na pergunta (dados dos outros módulos semeados) */
  const CZ = ESPERADO.cruzamentos.map((c) => norm(plano(c[1])));
  const esperadosCruz = [['M9-02 · Não', CZ[0]], ['M9-12 · Sim, obra que muda estrutura, área ou uso', CZ[1]], ['M9-06 · Sim, menos de 100 pessoas ao mesmo tempo', CZ[2]], ['M9-06 · Sim, 100 pessoas ou mais ao mesmo tempo', CZ[2]],
    ['M9-03 · Ainda não escolhi', CZ[3]], ['M9-03a · ' + O.rua, CZ[5]], ['M9-10 · Sim', CZ[4]], ['M9-07 · Vou vender gás de cozinha (revenda)', CZ[6]], ['M9-07b · Dentro da cozinha ou de outro cômodo fechado', CZ[7]], ['M9-07 · Não', CZ[8]]];
  for (const [k, m] of esperadosCruz) assert.ok(cruzVistos.has(k + ' => ' + m), 'cruzamento ausente: ' + k);
  assert.equal(cruzVistos.size, esperadosCruz.length, 'cruzamento a mais: ' + [...cruzVistos].join(' | '));
  /* M9-03a rua + alimentos */
  await abrir({ v: 2, R: R_({ 'M9-01': 'Acre', 'M9-02': 'Sim, alimentos ou bebidas', 'M9-03': O.sem }), feitos: {} });
  await page.click('#ir'); await tocar(O.rua);
  assert.deepEqual(await cruzes(), [CZ[5]]);
  await tocar(O.internet); assert.deepEqual(await cruzes(), []);

  /* ---------- 5. percurso na tela: perguntas visitadas = fluxo esperado ---------- */
  const nsBloqueados = new Set();
  async function percorrer(A, outros) {
    await abrir(null, outros);
    await page.click('#ir');
    const vistos = [];
    let pctAntes = -1;
    for (let i = 0; i < 30; i++) {
      if (await page.locator('#q14').count()) break;
      const cod = await codAtual(); vistos.push(cod);
      /* D: depois de Continuar o foco está no enunciado da pergunta nova */
      if (i > 0) assert.equal(await page.evaluate(() => document.activeElement && document.activeElement.id), 'pergunta', cod + ': foco no enunciado');
      /* B: Continuar nunca desabilitado; G: a barra só anda para a frente */
      assert.equal(await page.$eval('#ok', (b) => b.disabled), false, cod + ': Continuar ativo');
      const pct = Number(await page.getAttribute('.heroi-compacta [role=progressbar]', 'aria-valuenow'));
      assert.ok(pct > pctAntes, `${cod}: barra voltou (${pctAntes} -> ${pct})`); pctAntes = pct;
      await semPassoExtra(cod);
      const v = A[cod];
      /* toda pergunta com "Não sei": tocar nele mostra a ajuda, não grava e o Continuar não avança */
      const temNS = cod === 'M9-05' ? true : await page.evaluate((ns) => [...document.querySelectorAll('#ent .opcao .op-txt b')].some((b) => b.textContent.trim() === ns), NS);
      assert.equal(temNS, !SEM_NS.includes(cod) && cod !== 'M9-13', cod + ': botão Não sei');
      if (temNS) {
        const antes = JSON.stringify(await st());
        if (cod === 'M9-05') await page.click('#nsb'); else await tocar(NS);
        assert.ok(await page.locator('#retorno .como-descobrir').isVisible(), cod + ': ajuda à vista');
        await page.click('#ok');
        assert.equal(await codAtual(), cod, cod + ': Não sei bloqueia');
        assert.equal(JSON.stringify(await st()), antes, cod + ': Não sei não grava');
        nsBloqueados.add(cod);
      }
      if (cod === 'M9-01') await page.selectOption('#uf', v);
      else if (cod === 'M9-05') await page.fill('#area', v);
      else if (cod === 'M9-13') await page.fill('#ideias', v || '');
      else await tocar(v);
      if (cod === 'M9-05') await page.$eval('#area', (e) => e.blur());
      /* A: o retorno da resposta já está na tela antes de tocar Continuar (escolha, lista de estados e campo) */
      if (cod !== 'M9-13') assert.ok(norm(await page.textContent('#retorno')).length > 0, cod + ': retorno ao vivo antes de Continuar');
      /* A: UM toque em Continuar grava e abre a próxima (o laço confere a sequência inteira) */
      await page.click('#ok');
      assert.notEqual(await page.locator('#q14').count() ? 'M9-14' : await codAtual(), cod, cod + ': um toque em Continuar não avançou');
    }
    await semPassoExtra('resultado'); await telaLimpa('resultado');
    return vistos;
  }
  const ROTEIROS = [
    Object.assign({}, CENA, { 'M9-13': 'Anotação' }),
    Object.assign({}, BASE_REMOTO, { 'M9-13': '' }),
    Object.assign({}, RUA, { 'M9-13': '' }),
    { 'M9-01': 'Pará', 'M9-02': 'Não', 'M9-03': O.naoEsc, 'M9-03b': O.pLoja, 'M9-04': 'Ainda não fiz', 'M9-06': 'Sim, 100 pessoas ou mais ao mesmo tempo', 'M9-07': 'Não', 'M9-07c': 'Não', 'M9-10': 'Sim', 'M9-11': 'Sim', 'M9-12': 'Não', 'M9-13': '' },
    Object.assign({}, GAS, { 'M9-07c': 'Não', 'M9-13': '' }),
    { 'M9-01': 'Goiás', 'M9-02': 'Sim, animais', 'M9-03': O.naoEsc, 'M9-03b': O.pCasa, 'M9-04': 'Ainda não fiz', 'M9-05': '25', 'M9-06': 'Não, só trabalho interno ou atendimento fora', 'M9-07': 'Sim, gás encanado da rua (gás natural)', 'M9-07c': 'Sim, só para uso e limpeza, em embalagens pequenas', 'M9-09': 'Espaço e utensílios compartilhados com a família', 'M9-10': 'Não', 'M9-11': 'Sim', 'M9-12': 'Só pequenos reparos', 'M9-13': '' },
    { 'M9-01': 'Pará', 'M9-02': 'Não', 'M9-03': O.naoEsc, 'M9-03b': O.pSem, 'M9-03a': O.rua, 'M9-04': 'Ainda não fiz', 'M9-07': O.botijao, 'M9-07a': '2 botijões de 13 kg (um em uso e um de reserva)', 'M9-07b': 'No veículo, na barraca ou no carrinho', 'M9-07c': 'Não', 'M9-10': 'Não', 'M9-11': 'Não', 'M9-13': '' },
  ];
  for (const A of ROTEIROS) {
    const vistos = await percorrer(A);
    assert.deepEqual(vistos, esperadoSeq(A), 'percurso ' + JSON.stringify(A['M9-03']));
    const s = await st();
    assert.deepEqual(Object.keys(s.R).sort(), esperadoSeq(A).sort(), 'só as perguntas do percurso ficam gravadas');
    /* resumo: limites e botão do próximo módulo */
    assert.ok(await page.locator('#alertas .bloco').count() <= 3);
    assert.ok(await page.locator('#proximos li').count() <= 3);
    assert.ok(await page.locator('#encaminhamento .bloco').count() <= 1);
    assert.equal(await page.locator('#checklist .etapa').count(), 9);
    assert.ok(await page.locator('.lg2-proximo a').isVisible(), 'botão do próximo módulo visível');
    const sitTela = await page.$$eval('#checklist .etapa', (es) => Object.fromEntries(es.map((e) => [e.dataset.item, e.querySelector('.sit').textContent.trim()])));
    assert.deepEqual(sitTela, sits(A), 'checklist da tela = motor');
  }
  assert.deepEqual([...nsBloqueados].sort(), ['M9-02', 'M9-05', 'M9-07a', 'M9-08', 'M9-10'], '"Não sei" bloqueado em toda pergunta que o mantém');
  console.log(`percurso: ${ROTEIROS.length} roteiros na tela seguem o fluxo esperado; "Não sei" bloqueia em ${nsBloqueados.size} perguntas`);

  /* ---------- 5b. estado (M9-01) sem "Não sei"; resposta antiga "Não sei" pede o estado de novo ---------- */
  await abrir({ v: 2, R: R_({ 'M9-01': NS, 'M9-02': 'Não' }), feitos: {} });
  await page.click('#ir');
  assert.equal(await codAtual(), 'M9-01', 'estado salvo como "Não sei" volta a ser perguntado');
  assert.equal(await page.locator('#ent .opcao').count(), 0, 'M9-01 não oferece "Não sei"');
  assert.ok(!(await page.textContent('#ent')).includes(NS), 'M9-01 sem texto "Não sei"');
  await page.click('#ok');
  assert.equal(await codAtual(), 'M9-01', 'sem estado não avança');
  assert.ok((await page.textContent('body')).includes('Escolha o estado onde você vai trabalhar.'), 'pede o estado');
  if (SHOTS) { await page.waitForTimeout(400); await page.screenshot({ path: path.join(SHOTS, 'm09b_estado_sem_naosei.png'), fullPage: false }); }
  await page.selectOption('#uf', 'Minas Gerais'); await page.click('#ok');
  assert.deepEqual((await st()).R['M9-01'], { estado: 'opcao', opcao: 'Minas Gerais' }, 'grava o estado escolhido');
  assert.equal((await st()).R['M9-02'].opcao, 'Não', 'migração não apaga as outras respostas');
  assert.ok(!/Grupo \d/.test(await page.innerText('body')), 'sem "Grupo N" na tela');
  console.log('estado: sem "Não sei"; resposta antiga "Não sei" pede o estado de novo');

  /* ---------- 6. "Não sei" bloqueia: ajuda à vista, nada gravado, Continuar pede uma resposta ---------- */
  await abrir({ v: 2, R: R_({ 'M9-01': 'Acre' }), feitos: {} });
  await page.click('#ir');
  /* B (lote 17/11): sem resposta, Continuar (ativo) mostra a mensagem com role=alert logo acima dele, dentro do pé fixo */
  await page.click('#ok');
  assert.equal(await codAtual(), 'M9-02');
  assert.deepEqual(await page.evaluate(() => { const e = document.querySelector('#erro'), b = document.querySelector('#ok'); return [e.textContent, e.getAttribute('role'), !e.hidden, e.getBoundingClientRect().bottom <= b.getBoundingClientRect().top, !!e.closest('.pe-fixo')]; }),
    ['Escolha uma opção para continuar.', 'alert', true, true, true], 'mensagem sem resposta');
  await alvos44('pergunta M9-02');
  await page.click('.dica-toggle summary'); await alvos44('M9-02, Ver dica aberta'); await page.click('.dica-toggle summary');
  await tocar(NS);
  assert.equal(await page.locator('#verifiquei').count(), 0, 'sem "Já verifiquei"');
  assert.equal(norm(await page.textContent('#ok')), 'Continuar');
  await page.click('#ok');
  assert.equal(await codAtual(), 'M9-02', '"Não sei" não avança');
  assert.equal(norm(await page.textContent('#erro')), 'Use a ajuda acima e escolha a sua resposta para continuar.');
  assert.equal((await st()).R['M9-02'], undefined, '"Não sei" não grava');
  if (SHOTS) { await page.waitForTimeout(400); await page.screenshot({ path: path.join(SHOTS, 'm09_pergunta.png'), fullPage: true }); }
  await tocar('Não'); await page.click('#ok');
  assert.equal(await codAtual(), 'M9-03', 'com resposta de verdade avança');
  assert.deepEqual((await st()).R['M9-02'], { estado: 'opcao', opcao: 'Não' });

  /* ---------- 6b. "Não sei" em cada pergunta que o mantém: caixa "Como descobrir", Copiar, nada gravado ---------- */
  for (const cod of COM_NS) {
    const A = cenaPara(cod);
    const ate = esperadoSeq(A).slice(0, esperadoSeq(A).indexOf(cod));
    await abrir({ v: 2, R: R_(Object.fromEntries(ate.map((c) => [c, A[c]]))), feitos: {} });
    await page.click('#ir'); assert.equal(await codAtual(), cod);
    const antes = JSON.stringify(await st());
    if (cod === 'M9-05') await page.click('#nsb'); else await tocar(NS);
    await confereComo(cod, '#retorno');
    if (cod === 'M9-02') {
      await page.click('#retorno [data-copiar]');
      await page.waitForFunction(() => /Copiado!|Toque e segure/.test(document.querySelector('#retorno [data-copiar]').textContent));
      if (SHOTS) { await page.waitForTimeout(400); await page.screenshot({ path: path.join(SHOTS, 'm09_naosei_ajuda.png'), fullPage: true }); }
    }
    await page.click('#ok');
    assert.equal(await titulo(), norm(DQ[cod].curta || DQ[cod].pergunta), cod + ': "Não sei" não avança');
    assert.equal(JSON.stringify(await st()), antes, cod + ': estado salvo igual');
    assert.ok(!JSON.stringify(await st()).includes('naosei'), cod + ': nada "naosei" gravado');
  }
  /* perguntas sobre a própria pessoa: sem botão "Não sei" */
  for (const cod of SEM_NS.filter((c) => c !== 'M9-01')) {
    const A = cenaPara(cod);
    const ate = esperadoSeq(A).slice(0, esperadoSeq(A).indexOf(cod));
    await abrir({ v: 2, R: R_(Object.fromEntries(ate.map((c) => [c, A[c]]))), feitos: {} });
    await page.click('#ir'); assert.equal(await codAtual(), cod);
    assert.deepEqual(await page.evaluate(() => [...document.querySelectorAll('#ent .opcao .op-txt b')].map((b) => b.textContent.trim()).filter((x) => x === 'Não sei' || x === 'Ainda não faço ideia')), [], cod + ': sem Não sei');
  }
  console.log(`não sei: ${COM_NS.length} perguntas com "Como descobrir" que bloqueia (nada gravado); ${SEM_NS.length} sem o botão`);
  /* resposta antiga "Não sei" (v2) vira "sem resposta" ao carregar, sem apagar as outras */
  await abrir({ v: 2, R: R_({ 'M9-01': 'Acre', 'M9-02': NS }), feitos: {} });
  { const s = await st(); assert.equal(s.v, 3); assert.deepEqual(s.R, R_({ 'M9-01': 'Acre' }), 'naosei migrado para sem resposta'); }
  await page.click('#ir'); assert.equal(await codAtual(), 'M9-02', 'a pergunta volta a ser feita');
  await tocar('Não'); await page.click('#ok');

  /* recarregar mantém e retoma */
  await page.reload();
  assert.equal(norm(await page.textContent('#ir')), 'Continuar de onde parei');
  await page.click('#ir'); assert.equal(await codAtual(), 'M9-03');
  /* Voltar */
  await page.click('#v'); assert.equal(await codAtual(), 'M9-02');

  /* ---------- 7. resumo: respostas antigas "Não sei" migradas; alertas, corrigir e voltar ao resumo, marcar feito, "Como calculamos" ---------- */
  const TUDO_NS_TELA = Object.assign({}, TUDO_NS, { 'M9-01': 'Acre' });
  await abrir({ v: 2, R: Object.assign(R_(TUDO_NS_TELA), { 'M9-13': { estado: 'valor', valor: '' } }), feitos: {} });
  assert.deepEqual(Object.keys((await st()).R).sort(), ['M9-01', 'M9-03', 'M9-13'], 'todo "Não sei" antigo vira sem resposta; o resto fica');
  await page.click('#ir'); assert.equal(await codAtual(), 'M9-02', 'retoma na 1ª sem resposta');
  const GAS2 = Object.assign({}, GAS, { 'M9-07c': 'Não' });
  await abrir({ v: 2, R: Object.assign(R_(GAS2), { 'M9-13': { estado: 'valor', valor: '' } }), feitos: {} });
  await page.click('#ir');
  assert.equal(await page.locator('#alertas .bloco').count(), 3);
  /* textContent: os alertas ficam no painel "Mais detalhes" (fechado) */
  assert.deepEqual(await page.$$eval('#alertas .bloco p', (ps) => ps.map((p) => p.textContent.replace(/\s+/g, ' ').trim())), Mo.alertas(D, R_(GAS2), {}).map((a) => norm(plano(a))));
  assert.equal(await page.locator('#encaminhamento .bloco').count(), 1);
  assert.ok(norm(await page.textContent('#linha-resumo')).includes('(fato)') || norm(await page.textContent('#linha-resumo')).includes('(hipótese)'));
  await page.evaluate(() => [...document.querySelectorAll('#op14 .opcao')].find((x) => x.textContent.trim() === 'Quero corrigir algo').click());
  await semPassoExtra('resultado, quero corrigir');
  assert.equal(norm(await page.textContent('[data-c="M9-04"]')), 'Mudar esta resposta');
  await page.click('[data-c="M9-04"]');
  assert.equal(await codAtual(), 'M9-04');
  await tocar('Sim, foi aprovada'); await page.click('#ok');
  assert.equal(norm(await page.textContent('.passo')), 'Resultado', 'corrigir volta ao resumo');
  assert.equal(await page.$eval('[data-item="viabilidade"] .sit', (e) => e.textContent.trim()), 'feito');
  /* versão leve: entendemos e próxima tarefa à frente; checklist e detalhes fechados; sem "O que falta descobrir" (nada fica "Não sei") */
  /* item I: no resultado, todo painel recolhível vem aberto */
  assert.equal(await page.$eval('#mais-checklist', (d) => d.open), true, 'checklist aberto');
  assert.equal(await page.$eval('#mais-detalhes', (d) => d.open), true, 'detalhes abertos');
  assert.deepEqual(await page.$$eval('main details', (ds) => ds.filter((d) => !d.open).map((d) => d.className)), [], 'resultado: nenhum painel fechado');
  assert.equal(norm(await page.textContent('#encaminhamento h3')), 'Sua próxima tarefa');
  assert.equal(await page.locator('#falta').count(), 0);
  assert.ok(await page.evaluate(() => { const e = document.querySelector('#entendemos'), t = document.querySelector('#encaminhamento'), m = document.querySelector('#mais-checklist'); return !!(e.compareDocumentPosition(t) & 4) && !!(t.compareDocumentPosition(m) & 4); }), 'ordem: entendemos, tarefa, checklist');
  /* B: a conta das pendências, à vista junto do número (loja em MG, viabilidade aprovada, botijões de 20/45 kg, sem saúde):
     feito = viabilidade; a fazer = local, gás, Bombeiros; o resto não se aplica => 3 + 0 = 3 */
  assert.equal(norm(await page.textContent('#mais-checklist summary')), 'Ver seu checklist (3 itens pendentes) Como calculamos: 3 itens “a fazer” + 0 “a confirmar” = 3 pendentes. Itens feitos ou que não se aplicam não entram.');
  assert.ok(await page.locator('#calc-pend').isVisible(), '"Como calculamos" à vista');
  const pRes = await palavrasTela();
  console.log(`resultado: ${pRes} palavras na 1ª leitura (painéis abertos)`);
  if (SHOTS) { await page.waitForTimeout(400); await page.screenshot({ path: path.join(SHOTS, 'm09_resultado_leve.png') }); }
  await alvos44('resultado'); await telaLimpa('resultado com alertas');
  await page.check('[data-feito="gas"]');
  assert.equal(await page.$eval('#mais-checklist', (d) => d.open), true, 'checklist continua aberto ao marcar');
  assert.equal(await page.$eval('[data-item="gas"] .sit', (e) => e.textContent.trim()), 'feito');
  assert.deepEqual((await st()).feitos, { gas: true });
  /* a conta acompanha a marcação: 2 + 0 = 2 */
  assert.equal(norm(await page.textContent('#calc-pend')), 'Como calculamos: 2 itens “a fazer” + 0 “a confirmar” = 2 pendentes. Itens feitos ou que não se aplicam não entram.');
  /* D: cada item do checklist diz o que é, em palavras simples */
  assert.equal(await page.locator('#checklist .etapa .o-que-e').count(), 9);
  /* D: o nome técnico (AVCB) saiu do texto principal e fica em "Detalhes técnicos", aberto no resultado */
  assert.ok(!norm(await page.textContent('[data-item="bombeiros"] .o-que-e')).includes('AVCB'));
  assert.ok(norm(await page.textContent('[data-item="bombeiros"] details.tec')).includes('AVCB'));
  assert.equal(await page.$$eval('#tela details.tec', (ds) => ds.length > 0 && ds.every((d) => d.open)), true, 'resultado: "Detalhes técnicos" abertos');
  { const ck = await semTec('#checklist'); const m = ck.match(new RegExp('.{0,80}(' + TECNICO.source + ').{0,40}', 'g')); assert.ok(!m, 'checklist sem termo técnico fora de "Detalhes técnicos": ' + JSON.stringify(m)); }
  /* fechar um painel vale: continua fechado quando a tela se redesenha */
  await page.click('#mais-detalhes summary'); assert.equal(await page.$eval('#mais-detalhes', (d) => d.open), false);
  await page.uncheck('[data-feito="gas"]'); assert.equal(await page.$eval('#mais-detalhes', (d) => d.open), false, 'fechado pela pessoa continua fechado');
  assert.equal(await page.$eval('#mais-checklist', (d) => d.open), true);
  await page.check('[data-feito="gas"]');
  await page.click('#mais-detalhes summary');
  if (SHOTS) { await page.waitForTimeout(400); await page.screenshot({ path: path.join(SHOTS, 'm09_resultado.png'), fullPage: true }); }

  /* ---------- 8. pré-preenchimento vindo de outros módulos ---------- */
  await abrir({ v: 2, R: R_({ 'M9-01': 'Acre' }), feitos: {} }, { 'lg2-turma-a-m04': { R: { 'M4.P15': { estado: 'opcao', opcao: 'Não' } } } });
  await page.click('#ir');
  /* "Não" do Módulo 4 não é mais pré-marcado: a pergunta de saúde precisa ser respondida aqui */
  assert.equal(await page.locator('#ent .opcao.sel').count(), 0, 'M9-02 nunca vem pré-marcada como Não');
  assert.equal(await page.locator('#ent .veio').count(), 0);
  await abrir(null, { 'lg2-turma-a-m03': { R: { 'M3-08': { estado: 'valor', valor: 'Juiz de Fora - MG' } } }, 'lg2-turma-b-m08': OUTROS['lg2-turma-b-m08'] });
  assert.ok(norm(await page.textContent('.corpo')).includes('Presentes personalizados por encomenda'), 'descrição do Módulo 8 na capa');
  await page.click('#ir');
  assert.equal(await page.$eval('#uf', (s) => s.value), 'Minas Gerais', 'estado pela cidade do Módulo 3');
  /* nunca escreve nas chaves dos outros módulos */
  assert.deepEqual(JSON.parse(await page.evaluate(() => localStorage.getItem('lg2-turma-b-m08'))), OUTROS['lg2-turma-b-m08']);

  /* ---------- 8b. herança do Módulo 8 (onde funciona, profissional formado) e do Módulo 4 (saúde) ---------- */
  const m8 = (extra) => ({ 'lg2-turma-b-m08': { R: Object.assign({ 'M8.P01': { estado: 'valor', valor: 'Presentes personalizados por encomenda' } }, extra) } });
  const opc = (o) => ({ estado: 'opcao', opcao: o });
  const selAtual = async () => norm(await page.textContent('#ent .opcao.sel .op-txt b'));
  const veioAtual = async () => norm(await page.textContent('#ent .veio-linha'));
  const ATE3 = { 'M9-01': 'Minas Gerais', 'M9-02': 'Não' };
  /* F (lote 16/11): resposta do Módulo 8 que casa sem dúvida => a tela não aparece de novo; cartão "Veio do Módulo 8 · Trocar" */
  const herdOk = (o, m) => ({ estado: 'opcao', opcao: o, herdado: m });
  for (const [l8, l9, f9] of [['Ponto comercial', O.loja, null], ['Atendimento externo', O.sem, O.cliente], ['Online', O.sem, O.internet], [DOMIC, DOMIC, null]]) {
    await abrir({ v: 2, R: R_(ATE3), feitos: {} }, m8({ 'M8.P03': opc(l8) }));
    await page.click('#ir');
    assert.equal(await codAtual(), 'M9-04', 'M9-03 não reaparece: ' + l8);
    const R9 = (await st()).R;
    assert.deepEqual(R9['M9-03'], herdOk(l9, 8), 'M9-03 gravada como herdada: ' + l8);
    if (f9) assert.deepEqual(R9['M9-03a'], herdOk(f9, 8)); else assert.equal(R9['M9-03a'], undefined);
    const card = norm(await page.textContent('#herdadas'));
    assert.ok(card.includes('Veio da Etapa 8') && card.includes(l9) && (!f9 || card.includes(f9)), card);
    assert.equal(await page.locator('#herdadas [data-trocar="M9-03"]').count(), 1, 'botão Trocar');
    assert.equal(norm(await page.textContent('#herdadas [data-trocar="M9-03"]')), 'Trocar');
  }
  /* "Minha casa" do Módulo 8 não diz se é casa ou apartamento: a tela continua, com a opção pré-marcada */
  await abrir({ v: 2, R: R_(ATE3), feitos: {} }, m8({ 'M8.P03': opc('Minha casa') }));
  await page.click('#ir');
  assert.equal(await codAtual(), 'M9-03');
  assert.equal(await selAtual(), O.casa);
  assert.equal(await veioAtual(), 'Veio da Etapa 8 Confira e ajuste se quiser.');
  await page.click('#ok'); assert.equal(await codAtual(), 'M9-04');
  assert.deepEqual((await st()).R['M9-03'], opc(O.casa), 'pré-marcada e confirmada: sem "herdado"');
  /* Trocar: abre a pergunta com a resposta herdada marcada; a nova resposta vale e volta para onde parou */
  await abrir({ v: 2, R: R_(ATE3), feitos: {} }, m8({ 'M8.P03': opc('Atendimento externo') }));
  await page.click('#ir'); assert.equal(await codAtual(), 'M9-04');
  if (SHOTS) { await page.waitForTimeout(400); await page.screenshot({ path: path.join(SHOTS, 'm09_herdada_cartao.png') }); }
  /* Voltar não passa pelas herdadas */
  await page.click('#v'); assert.equal(await codAtual(), 'M9-02', 'Voltar pula as perguntas herdadas');
  await tocar('Não'); await page.click('#ok'); assert.equal(await codAtual(), 'M9-04');
  await page.click('#herdadas [data-trocar="M9-03"]');
  assert.equal(await codAtual(), 'M9-03'); assert.equal(await selAtual(), O.sem);
  assert.equal(norm(await page.textContent('#ent .veio')), 'Veio da Etapa 8');
  await tocar(O.loja); await page.click('#ok');
  assert.equal(await codAtual(), 'M9-04', 'depois de trocar, volta para a pergunta que faltava');
  { const R9 = (await st()).R; assert.deepEqual(R9['M9-03'], opc(O.loja)); assert.equal(R9['M9-03a'], undefined, 'trocar refaz o caminho'); }
  /* a resposta herdada acompanha o Módulo 8 se ele mudar */
  await abrir({ v: 3, R: Object.assign(R_(ATE3), { 'M9-03': herdOk(O.loja, 8) }), feitos: {} }, m8({ 'M8.P03': opc('Online') }));
  await page.click('#ir'); assert.equal(await codAtual(), 'M9-04');
  { const R9 = (await st()).R; assert.deepEqual([R9['M9-03'], R9['M9-03a']], [herdOk(O.sem, 8), herdOk(O.internet, 8)], 'herdada atualizada'); }
  /* M9-03a não herda se a pessoa disse outra coisa na M9-03 (ex.: ainda não escolheu e pretende sem local fixo) */
  await abrir({ v: 2, R: R_(Object.assign({}, ATE3, { 'M9-03': O.naoEsc, 'M9-03b': O.pSem })), feitos: {} }, m8({ 'M8.P03': opc('Online') }));
  await page.click('#ir'); assert.equal(await codAtual(), 'M9-03a');
  assert.equal(await page.locator('#ent .opcao.sel').count(), 0, 'M9-03a só herda quando a M9-03 é sem local fixo');
  /* "Não sei" ou vazio no Módulo 8 não conta */
  await abrir({ v: 2, R: R_(ATE3), feitos: {} }, m8({ 'M8.P03': { estado: 'naosei' } }));
  await page.click('#ir'); assert.equal(await page.locator('#ent .opcao.sel').count(), 0); assert.equal(await page.locator('#ent .veio').count(), 0);
  /* M9-10 <- M8.P08 */
  const ATE10 = { 'M9-01': 'Minas Gerais', 'M9-02': 'Não', 'M9-03': O.sem, 'M9-03a': O.cliente, 'M9-04': 'Ainda não fiz' };
  for (const v of ['Sim', 'Não']) {
    await abrir({ v: 2, R: R_(ATE10), feitos: {} }, m8({ 'M8.P08': opc(v) }));
    await page.click('#ir');
    assert.equal(await codAtual(), 'M9-11', 'M9-10 não reaparece (já respondida no Módulo 8)');
    assert.deepEqual((await st()).R['M9-10'], herdOk(v, 8));
    assert.ok(norm(await page.textContent('#herdadas')).includes('Veio da Etapa 8 Profissional formado e registrado em conselho: ' + v));
    if (SHOTS && v === 'Sim') { await page.waitForTimeout(400); await page.screenshot({ path: path.join(SHOTS, 'm09_heranca_m9-10.png') }); }
  }
  await abrir({ v: 2, R: R_(ATE10), feitos: {} }, m8({ 'M8.P08': { estado: 'naosei' } }));
  await page.click('#ir'); assert.equal(await page.locator('#ent .opcao.sel').count(), 0, 'Não sei do Módulo 8 não é herdado');
  await abrir({ v: 2, R: R_(ATE10), feitos: {} }, {});
  await page.click('#ir'); assert.equal(await codAtual(), 'M9-10', 'sem resposta da Etapa 8, pergunta aparece');
  assert.equal(await page.locator('#herdadas').count(), 0, 'sem resposta anterior não mostra cartão herdado');
  /* M9-02 <- M4.P15 = Sim + o que vende: opção sugerida; sem pista, só o lembrete */
  await abrir({ v: 2, R: R_({ 'M9-01': 'Acre' }), feitos: {} }, Object.assign({ 'lg2-turma-a-m04': { R: { 'M4.P15': opc('Sim') } } }, { 'lg2-turma-a-m01': { R: { 'M1.P03': { estado: 'valor', valor: 'Bolos caseiros por encomenda' } } } }));
  await page.click('#ir');
  assert.equal(await codAtual(), 'M9-03', 'M9-02 não reaparece: Módulo 4 = Sim + o que vende mostra o tipo');
  assert.deepEqual((await st()).R['M9-02'], herdOk('Sim, alimentos ou bebidas', 4));
  assert.ok(norm(await page.textContent('#herdadas')).includes('Veio da Etapa 4'));
  await abrir({ v: 2, R: R_({ 'M9-01': 'Acre' }), feitos: {} }, { 'lg2-turma-a-m04': { R: { 'M4.P15': opc('Sim') } }, 'lg2-turma-a-m01': { R: { 'M1.P03': { estado: 'valor', valor: 'Lavagem de carros' } } } });
  await page.click('#ir');
  assert.equal(await page.locator('#ent .opcao.sel').count(), 0, 'sem pista do tipo, nada pré-marcado');
  assert.ok((await veioAtual()).includes('regras específicas'), 'lembrete do Módulo 4');
  if (SHOTS) {
    await abrir({ v: 2, R: R_(ATE3), feitos: {} }, m8({ 'M8.P03': opc('Atendimento externo') }));
    await page.click('#ir'); await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(SHOTS, 'm09_heranca_m9-03.png') });
  }

  /* ---------- 8c. "O que entendemos até aqui" no resultado, acima do checklist ---------- */
  const LAVA = { 'M9-01': 'Minas Gerais', 'M9-02': 'Não', 'M9-03': O.sem, 'M9-03a': O.cliente, 'M9-04': 'Ainda não fiz', 'M9-10': 'Não', 'M9-11': 'Sim', 'M9-13': '' };
  const M1LAVA = { 'lg2-turma-a-m01': { R: { 'M1.P01': opc('Ainda está só na minha cabeça'), 'M1.P03': { estado: 'valor', valor: 'Lava-jato em domicílio' }, 'M1.P03A': opc('Serviço: meu cliente paga pelo trabalho que realizo') } } };
  await abrir({ v: 2, R: Object.assign(R_(LAVA), { 'M9-13': { estado: 'valor', valor: '' } }), feitos: {} }, M1LAVA);
  await page.click('#ir');
  assert.equal(norm(await page.textContent('.passo')), 'Resultado');
  const fr = await page.$$eval('#entendemos p', (ps) => ps.map((p) => p.innerText.replace(/\s+/g, ' ').trim()));
  assert.equal(norm(await page.textContent('#entendemos h3')), 'O que entendemos até aqui');
  /* texto corrido (relatório do Bento): 1 a 3 parágrafos, sem lista */
  assert.ok(fr.length >= 1 && fr.length <= 3, 'de 1 a 3 parágrafos: ' + fr.length);
  assert.ok(await page.$$eval('#entendemos', (e) => !e[0].querySelector('ul, ol, li') && e[0].querySelectorAll('p').length >= 1), 'caixa sem <li> e com pelo menos um <p>');
  const itLava = Mo.checklist(D, R_(LAVA));
  const nf = itLava.filter((i) => i.sit === 'a fazer').length, nc = itLava.filter((i) => i.sit === 'a confirmar').length;
  assert.deepEqual(fr.slice(0, 2), [
    'Seu negócio é “Lava-jato em domicílio”, um serviço (o cliente paga pelo seu trabalho), e você ainda não começou a vender. ' +
    'Você não terá local fixo: vai atender na casa ou na empresa do cliente (Minas Gerais).',
    'Pelo que você respondeu, o que você faz não afeta a saúde de quem compra, então a Vigilância Sanitária não entra no seu caminho. ' +
    'Ainda falta confirmar com a prefeitura se a atividade pode funcionar no endereço que você vai usar.',
  ]);
  assert.ok(fr[2].startsWith(`No seu checklist há ${nf} ${nf === 1 ? 'passo' : 'passos'} a fazer e ${nc} ${nc === 1 ? 'item' : 'itens'} a confirmar`), fr[2]);
  const ordem = await page.evaluate(() => { const e = document.querySelector('#entendemos'), c = document.querySelector('#checklist'), l = document.querySelector('#linha-resumo'); return [!!(e.compareDocumentPosition(c) & 4), !!(e.compareDocumentPosition(l) & 4)]; });
  assert.deepEqual(ordem, [true, true], 'caixa acima do resumo e do checklist');
  if (SHOTS) { await page.waitForTimeout(400); await page.evaluate(() => document.querySelector('.concluido').scrollIntoView()); await page.screenshot({ path: path.join(SHOTS, 'm09_entendemos.png') }); }
  /* sem nada dos outros módulos, a caixa ainda aparece (só com o que foi respondido aqui) */
  await abrir({ v: 2, R: Object.assign(R_(LAVA), { 'M9-13': { estado: 'valor', valor: '' } }), feitos: {} });
  await page.click('#ir');
  const fr2 = await page.$$eval('#entendemos p', (ps) => ps.length);
  assert.ok(fr2 >= 1 && fr2 <= 3);
  assert.ok(!norm(await page.textContent('#entendemos')).includes('Seu negócio'), 'sem frase de negócio sem dado');

  /* ---------- 8d. alimento x Vigilância Sanitária (relato do testador: bolos de pote com "Não" pré-marcado) ---------- */
  const BOLOS = { 'lg2-turma-a-m01': { R: { 'M1.P03': { estado: 'valor', valor: 'Bolos caseiros de pote' } } }, 'lg2-turma-a-m04': { R: { 'M4.P15': opc('Não') } } };
  await abrir({ v: 2, R: R_({ 'M9-01': 'Acre' }), feitos: {} }, BOLOS);
  await page.click('#ir'); assert.equal(await codAtual(), 'M9-02');
  assert.equal(await page.locator('#ent .opcao.sel').count(), 0, 'bolos: nada pré-marcado');
  assert.ok(norm(await page.textContent('#ent .dica-alimento')).includes('Bolos caseiros de pote'), 'dica de alimento na pergunta');
  await tocar('Não');
  assert.equal(norm(await page.textContent('#retorno .aviso-alimento p')), 'Você vende “Bolos caseiros de pote”: alimentos normalmente passam pela Vigilância Sanitária. Confira.');
  assert.equal(norm(await page.textContent('#ok')), 'Continuar', 'o aviso não trava');
  if (SHOTS) { await page.waitForTimeout(400); await page.screenshot({ path: path.join(SHOTS, 'm09_alimento_aviso.png'), fullPage: true }); }
  await tocar('Sim, alimentos ou bebidas'); assert.equal(await page.locator('#retorno .aviso-alimento').count(), 0, 'aviso só com Não');
  await tocar('Não'); await page.click('#ok'); assert.equal(await codAtual(), 'M9-03', 'segue com Não');
  /* sem pista de alimento, o Não não mostra aviso */
  await abrir({ v: 2, R: R_({ 'M9-01': 'Acre' }), feitos: {} }, { 'lg2-turma-a-m01': { R: { 'M1.P03': { estado: 'valor', valor: 'Lavagem de carros' } } } });
  await page.click('#ir'); await tocar('Não');
  assert.equal(await page.locator('#retorno .aviso-alimento').count(), 0); assert.equal(await page.locator('#ent .dica-alimento').count(), 0);
  /* CNAE de alimento do Módulo 8 também conta */
  await abrir({ v: 2, R: R_({ 'M9-01': 'Acre' }), feitos: {} }, { 'lg2-turma-b-m08': { R: { 'M8.P06': { estado: 'valor', valor: '1091-1/02' } } } });
  await page.click('#ir'); await tocar('Não');
  assert.ok(norm(await page.textContent('#retorno .aviso-alimento p')).includes('alimentos normalmente passam pela Vigilância Sanitária'), 'CNAE de alimento');
  /* resultado: Vigilância "a confirmar", cartão de alimentos, nota de casa (Juiz de Fora) */
  const BOLO9 = { 'M9-01': 'Minas Gerais', 'M9-02': 'Não', 'M9-03': O.casa, 'M9-04': 'Ainda não fiz', 'M9-05': '40', 'M9-06': 'Não, só trabalho interno ou atendimento fora', 'M9-07': O.botijao, 'M9-07a': '1 botijão de 13 kg (P13)', 'M9-07b': 'Do lado de fora, em área aberta e ventilada ou em abrigo próprio', 'M9-07c': 'Não', 'M9-10': 'Não', 'M9-11': 'Não', 'M9-12': 'Não' };
  const BOLOS_JF = Object.assign({}, BOLOS, { 'lg2-turma-a-m03': { R: { 'M3-08': { estado: 'valor', valor: 'Juiz de Fora - MG' } } } });
  await abrir({ v: 2, R: Object.assign(R_(BOLO9), { 'M9-13': { estado: 'valor', valor: '' } }), feitos: {} }, BOLOS_JF);
  await page.click('#ir'); assert.equal(norm(await page.textContent('.passo')), 'Resultado');
  assert.equal(await page.$eval('[data-item="vigilancia"] .sit', (e) => e.textContent.trim()), 'a confirmar', 'alimento: Vigilância a confirmar');
  const ent9 = norm(await page.textContent('#entendemos'));
  assert.ok(!ent9.includes('não entra no seu caminho') && ent9.includes('Alimentos normalmente passam pela Vigilância Sanitária: confira.'), ent9);
  const alim = norm(await page.textContent('#alimentos'));
  for (const k of ['licença sanitária', 'boas práticas de manipulação de alimentos', 'curso de boas práticas', 'prefeitura de Juiz de Fora', 'Você vende “Bolos caseiros de pote”']) assert.ok(alim.includes(k), 'cartão de alimentos: ' + k);
  const casa = norm(await page.textContent('#nota-casa'));
  for (const k of ['endereço de casa', 'vistoria ou licença', 'uso e ocupação do solo', 'Sala do Empreendedor']) assert.ok(casa.includes(k), 'nota de casa: ' + k);
  assert.ok(!/Lei (n|\d)/.test(alim + casa), 'notas sem número de lei');
  /* item 5: norma de gás do RJ só para quem está no RJ */
  const gasMG = norm(await page.textContent('[data-item="gas"]'));
  assert.ok(!gasMG.includes('CBMERJ') && gasMG.includes('Corpo de Bombeiros de MG'), 'MG: ' + gasMG);
  if (SHOTS) { await page.waitForTimeout(400); await page.evaluate(() => document.querySelector('#entendemos').scrollIntoView()); await page.screenshot({ path: path.join(SHOTS, 'm09_resultado_alimento_casa.png') }); }
  /* Vigilância "Sim, alimentos" também mostra o cartão, sem o "Confira" */
  await abrir({ v: 2, R: Object.assign(R_(Object.assign({}, BOLO9, { 'M9-02': 'Sim, alimentos ou bebidas', 'M9-09': 'Área separada, de uso exclusivo, com equipamentos exclusivos' })), { 'M9-13': { estado: 'valor', valor: '' } }), feitos: {} });
  await page.click('#ir'); assert.equal(await page.locator('#alimentos').count(), 1); assert.equal(await page.locator('#alimentos .bloco').count(), 1);
  /* loja: sem nota de casa */
  await abrir({ v: 2, R: Object.assign(R_(GAS2), { 'M9-13': { estado: 'valor', valor: '' } }), feitos: {} });
  await page.click('#ir'); assert.equal(await page.locator('#nota-casa').count(), 0); assert.equal(await page.locator('#alimentos').count(), 0);
  for (const [uf, deve, naoDeve] of [['Acre', 'Corpo de Bombeiros do seu estado (Acre)', 'CBMERJ'], ['Rio de Janeiro', 'CBMERJ', 'Corpo de Bombeiros do seu estado']]) {
    await abrir({ v: 2, R: Object.assign(R_(Object.assign({}, GAS2, { 'M9-01': uf })), { 'M9-13': { estado: 'valor', valor: '' } }), feitos: {} });
    await page.click('#ir');
    const g = norm(await page.textContent('[data-item="gas"]'));
    assert.ok(g.includes(deve) && !g.includes(naoDeve), uf + ': ' + g);
  }
  /* conceito do gás na pergunta: sem exemplo nem fonte do RJ para o Acre */
  await abrir({ v: 2, R: R_({ 'M9-01': 'Acre', 'M9-02': 'Não', 'M9-03': O.loja, 'M9-04': 'Ainda não fiz', 'M9-06': 'Não, só trabalho interno ou atendimento fora' }), feitos: {} });
  await page.click('#ir'); assert.equal(await codAtual(), 'M9-07');
  const termosGas = await page.evaluate(() => document.querySelector('.dica-toggle').textContent.replace(/\s+/g, ' '));
  /* D: a dica do gás em palavras simples; normas e siglas dentro de "Detalhes técnicos" (fechado) */
  const visGas = await semTec('.dica-toggle');
  assert.ok(visGas.includes('Gás de cozinha no local') && visGas.includes('Vender gás de cozinha') && !TECNICO.test(visGas), visGas);
  for (const k of ['NBR 13523', 'Resolução ANP 958/2023', 'ART ou RRT', 'Agência Nacional do Petróleo']) assert.ok(termosGas.includes(k), 'detalhes técnicos do gás: ' + k);
  assert.equal(await page.$$eval('.dica-toggle details.tec', (ds) => ds.length), 2);
  if (SHOTS) { await page.click('.dica-toggle > summary'); await page.click('.dica-toggle details.tec > summary'); await page.waitForTimeout(400); await page.screenshot({ path: path.join(SHOTS, 'm09_gas_tec.png'), fullPage: true }); }
  assert.ok(!termosGas.includes('Rio de Janeiro') && !termosGas.includes('CBMERJ') && termosGas.includes('Corpo de Bombeiros do seu estado (Acre)'), termosGas);
  /* nota de casa na própria pergunta do local */
  await abrir({ v: 2, R: R_({ 'M9-01': 'Minas Gerais', 'M9-02': 'Não' }), feitos: {} });
  await page.click('#ir'); await tocar(O.casa);
  assert.ok(norm(await page.textContent('#retorno .nota-casa')).includes('endereço de casa'));
  if (SHOTS) { await page.waitForTimeout(400); await page.screenshot({ path: path.join(SHOTS, 'm09_nota_casa.png'), fullPage: true }); }
  await tocar(O.loja); assert.equal(await page.locator('#retorno .nota-casa').count(), 0);
  await tocar(O.apto); assert.ok(norm(await page.textContent('#retorno .nota-casa')).includes('convenção do condomínio'));

  /* ---------- 8e. último passo: um só botão, "Ver meu checklist", que funciona (sem Continuar quebrado) ---------- */
  const ATE13 = { 'M9-01': 'Minas Gerais', 'M9-02': 'Não', 'M9-03': O.sem, 'M9-03a': O.cliente, 'M9-04': 'Ainda não fiz', 'M9-10': 'Não', 'M9-11': 'Não' };
  await abrir({ v: 2, R: R_(ATE13), feitos: {} });
  await page.click('#ir'); assert.equal(await codAtual(), 'M9-13');
  assert.deepEqual(await page.$$eval('#acoes button', (bs) => bs.map((b) => b.textContent.trim())), ['Ver meu checklist']);
  assert.equal(await page.getByRole('button', { name: 'Continuar', exact: true }).count(), 0, 'sem Continuar na última pergunta');
  await page.getByRole('button', { name: 'Ver meu checklist' }).click();
  assert.equal(norm(await page.textContent('.passo')), 'Resultado');

  /* ---------- 8f. teclado do celular: campo e botão visíveis com a janela reduzida ---------- */
  for (const [A, sel, bot] of [[{ 'M9-01': 'Minas Gerais', 'M9-02': 'Não', 'M9-03': O.casa, 'M9-04': 'Ainda não fiz' }, '#area', 'Continuar'], [ATE13, '#ideias', 'Ver meu checklist']]) {
    await page.setViewportSize({ width: 390, height: 844 });
    await abrir({ v: 2, R: R_(A), feitos: {} });
    await page.click('#ir');
    await page.focus(sel);
    await page.setViewportSize({ width: 390, height: 450 });
    await page.waitForTimeout(700);
    const caixas = [await page.locator(sel).boundingBox(), await page.locator('#ok').boundingBox()];
    for (const bx of caixas) assert.ok(bx.y >= 0 && bx.y + bx.height <= 450, `${sel}: fora da janela com teclado ${JSON.stringify(bx)}`);
    assert.equal(norm(await page.textContent('#ok')), bot);
    if (SHOTS && sel === '#area') await page.screenshot({ path: path.join(SHOTS, 'm09_teclado.png') });
  }
  await page.setViewportSize({ width: 390, height: 844 });

  /* ---------- 8f2. C (lote 17/11): Continuar inteiro na tela, sem rolar, em celular pequeno, letra grande e celular deitado ---------- */
  {
    const VIS = [['360x640', { width: 360, height: 640 }, false], ['390x844 letra 130%', { width: 390, height: 844 }, true], ['740x360 deitado', { width: 740, height: 360 }, false]];
    const ROTA = [Object.assign({}, CENA, { 'M9-13': 'Anotação' }), Object.assign({}, RUA, { 'M9-13': '' })];
    const dentro = () => page.evaluate(() => { const r = document.querySelector('#ok').getBoundingClientRect(); return r.top >= 0 && r.bottom <= window.innerHeight && r.height > 0; });
    let n = 0;
    for (const [nome, vp, z] of VIS) {
      await page.setViewportSize(vp);
      for (const A of ROTA) {
        await abrir(null);
        if (z) await page.evaluate(() => { document.documentElement.style.fontSize = '130%'; });
        await page.click('#ir');
        for (let i = 0; i < 30 && !(await page.locator('#q14').count()); i++) {
          const cod = await codAtual(), v = A[cod];
          assert.equal(await page.evaluate(() => window.scrollY), 0, `${nome} ${cod}: a pergunta abre no topo`);
          assert.ok(await dentro(), `${nome} ${cod}: Continuar fora da tela ao abrir`);
          if (cod === 'M9-01') await page.selectOption('#uf', v);
          else if (cod === 'M9-05') { await page.fill('#area', v); await page.$eval('#area', (e) => e.blur()); }
          else if (cod === 'M9-13') await page.fill('#ideias', v || '');
          else await tocar(v);
          /* depois de responder (retorno ao vivo aberto) o Continuar continua inteiro na tela */
          assert.ok(await dentro(), `${nome} ${cod}: Continuar fora da tela depois de responder`);
          if (SHOTS && cod === 'M9-04') { await page.waitForTimeout(400); await page.screenshot({ path: path.join(SHOTS, `m09_C_${vp.width}x${vp.height}${z ? '_z130' : ''}_M9-04.png`) }); }
          await page.click('#ok'); n++;
        }
        assert.equal(norm(await page.textContent('.passo')), 'Resultado', nome + ': chegou ao resultado');
      }
    }
    /* o último campo não fica coberto pelo pé fixo quando a página termina */
    await page.setViewportSize({ width: 740, height: 360 });
    await abrir({ v: 3, R: R_(ATE13), feitos: {} }); await page.click('#ir');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await page.waitForTimeout(100);
    assert.ok(await page.evaluate(() => document.querySelector('#ideias').getBoundingClientRect().bottom <= document.querySelector('#pe').getBoundingClientRect().top + 1), 'campo coberto pelo Continuar');
    await page.setViewportSize({ width: 390, height: 844 });
    console.log(`C: Continuar inteiro na tela em ${n} perguntas (360x640, 390x844 letra 130%, 740x360)`);
  }

  /* ---------- 8g. lote 3: Voltar no topo, "Outra atividade" com campo, domicílio, "Ver mais", termos embaixo do Continuar ---------- */
  await abrir({ v: 2, R: R_({ 'M9-01': 'Minas Gerais' }), feitos: {} }, { 'lg2-turma-a-m03': { R: { 'M3-08': { estado: 'valor', valor: 'Juiz de Fora - MG' } } } });
  await page.click('#ir'); assert.equal(await codAtual(), 'M9-02');
  assert.ok(await page.evaluate(() => { const c = document.querySelector('.cartao-q'), v = c.querySelector('#v'), q = c.querySelector('#pergunta'); return c.firstElementChild === v && v.getBoundingClientRect().bottom <= q.getBoundingClientRect().top + 1; }), 'Voltar no topo do cartão, acima da pergunta');
  assert.equal(await page.getByRole('button', { name: 'Voltar', exact: true }).count(), 1, 'um só Voltar');
  /* versão leve: os termos ficam na "Ver dica" fechada, entre a pergunta e as respostas */
  assert.ok(await page.evaluate(() => { const q = document.querySelector('#pergunta'), d = document.querySelector('.cartao-q .dica-toggle'), e = document.querySelector('#ent'); return !!d && !d.open && !!(q.compareDocumentPosition(d) & 4) && !!(d.compareDocumentPosition(e) & 4); }), '"Ver dica" fechada entre a pergunta e as respostas');
  assert.equal(await page.locator('.cartao-q .saiba').count(), 0, 'sem "Entenda os termos" solto na pergunta');
  assert.equal(await page.locator('#outra-box').isVisible(), false, 'campo da outra atividade escondido');
  await tocar(OUTRA);
  assert.ok(await page.locator('#outra').isVisible(), '"Outra atividade" abre o campo');
  assert.ok(norm(await retorno()).includes('confira na prefeitura ou na Sala do Empreendedor'), 'aviso para conferir');
  await page.click('#ok');
  assert.equal(await codAtual(), 'M9-02', 'sem escrever a atividade não avança');
  assert.ok((await page.textContent('#erro')).includes('Escreva qual é a sua atividade.'));
  await page.fill('#outra', 'Revenda de joias');
  if (SHOTS) { await page.waitForTimeout(400); await page.screenshot({ path: path.join(SHOTS, 'l3_m09_outra_atividade.png') }); }
  await page.click('#ok');
  assert.equal(await codAtual(), 'M9-03');
  assert.deepEqual((await st()).R['M9-02'], { estado: 'opcao', opcao: OUTRA, detalhe: 'Revenda de joias' }, 'grava a outra atividade com o texto');
  /* Voltar mostra a resposta com o texto */
  await page.click('#v'); assert.equal(await codAtual(), 'M9-02');
  assert.equal(await page.inputValue('#outra'), 'Revenda de joias'); await page.click('#ok');
  /* domicílio na pergunta do local: orientação, texto longo com "Ver mais" fechado */
  await tocar(DOMIC);
  const rd = norm(await page.textContent('#retorno'));
  assert.ok(rd.includes('não precisa de alvará para um ponto próprio') && rd.includes('confira na prefeitura'), rd);
  assert.equal(await page.locator('#retorno details.mais').count(), 1, 'texto longo com "Ver mais"');
  assert.equal(await page.$eval('#retorno details.mais', (d) => d.open), false, '"Ver mais" fechado');
  assert.ok(await page.locator('#ok').isVisible(), 'Continuar à vista');
  if (SHOTS) { await page.waitForTimeout(400); await page.screenshot({ path: path.join(SHOTS, 'l3_m09_domicilio.png') }); }
  await page.click('#ok');
  assert.equal(await codAtual(), 'M9-04', 'domicílio não pergunta a forma (M9-03a)');
  for (const [c, o] of [['M9-04', 'Ainda não fiz'], ['M9-10', 'Não'], ['M9-11', 'Não']]) { assert.equal(await codAtual(), c); await tocar(o); await page.click('#ok'); }
  await page.click('#ok');   // M9-13 em branco
  assert.equal(norm(await page.textContent('.passo')), 'Resultado');
  assert.ok(await page.evaluate(() => document.querySelector('.corpo').firstElementChild.id === 'v'), 'resultado: Voltar no topo');
  const nd = norm(await page.textContent('#nota-domicilio'));
  for (const k of ['Atendimento na casa do cliente', 'não precisa de alvará para um ponto próprio', 'pode precisar de licença', 'Sala do Empreendedor da prefeitura']) assert.ok(nd.includes(k), 'nota de domicílio: ' + k);
  assert.equal(await page.locator('#nota-casa').count(), 0);
  assert.equal(await page.$eval('[data-item="vigilancia"] .sit', (e) => e.textContent.trim()), 'a confirmar');
  assert.ok(norm(await page.textContent('[data-item="vigilancia"]')).includes('Outra atividade: Revenda de joias'), 'checklist mostra a outra atividade');
  const en = norm(await page.textContent('#entendemos'));
  assert.ok(en.includes('Você vai atender na casa do cliente, em domicílio (Minas Gerais).') && en.includes('(“Revenda de joias”) não está nas opções de saúde'), en);
  if (SHOTS) { await page.waitForTimeout(400); await page.evaluate(() => document.querySelector('#entendemos').scrollIntoView()); await page.screenshot({ path: path.join(SHOTS, 'l3_m09_resultado_domicilio.png') }); }
  await page.click('#v'); assert.equal(await codAtual(), 'M9-13', 'Voltar do resultado volta à última pergunta');
  /* herança: domicílio do Módulo 8 chega marcado; CNAE escolhido no Módulo 8 aparece */
  await abrir({ v: 2, R: R_(ATE3), feitos: {} }, { 'lg2-turma-b-m08': { R: { 'M8.P03': opc(DOMIC) }, hist: [], cnae: { cnae: '9602-5/01', ocupacao: 'CABELEIREIRO(A) INDEPENDENTE' } } });
  await page.click('#ir'); assert.equal(await codAtual(), 'M9-04', 'domicílio do Módulo 8: M9-03 não reaparece');
  assert.deepEqual((await st()).R['M9-03'], herdOk(DOMIC, 8), 'M9-03: domicílio herdado do Módulo 8');
  await page.reload();
  assert.ok(norm(await page.textContent('.corpo')).includes('9602-5/01 (CABELEIREIRO(A) INDEPENDENTE)'), 'CNAE escolhido no Módulo 8 na capa');

  /* ---------- 9. botão do próximo módulo: marcação exata ---------- */
  const app = fs.readFileSync(path.join(DIR, 'js/app.js'), 'utf8');
  const blocos = app.match(/<div class="acoes lg2-proximo">.*?<\/div>/g) || [];
  assert.equal(blocos.length, 1);
  assert.ok(blocos[0].includes('href="/lg2/turma-b/m10/index.html">Ir para a Etapa 10<'));
  assert.equal((app.match(/addEventListener\("focusin"/g) || []).length, 1, 'um único listener de foco');
  assert.ok(fs.readFileSync(path.join(DIR, 'index.html'), 'utf8').includes('content="width=device-width, initial-scale=1, interactive-widget=resizes-content"'));

  assert.ok(telasLimpas >= 60, 'telas conferidas sem colchete/"Módulo": ' + telasLimpas);
  console.log(`B1/E: ${telasLimpas} telas sem "[palavra]" nem "Módulo"`);
  assert.deepEqual(errs, []);
  await b.close(); server.close();
  console.log('lg2-m09-turma-b ok');
})().catch(async (e) => { console.error(e); process.exit(1); });
