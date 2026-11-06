/* Módulo 9 (Turma B), documento final do Grupo 9 (30/10/2026).
   O ESPERADO abaixo é a tabela "Caminhos por resposta" do documento (código, pergunta do Passo a passo,
   coluna "Aparece quando", resposta/opção e retorno literal), mais Cruzamentos e Próximo passo no resumo.
   O fluxo esperado (quais perguntas aparecem) é escrito de novo aqui, a partir do documento, sem usar o motor.
   Confere: textos literais em dados/modulo9.js; cada linha de caminho alcançada na tela (N de N);
   "Aparece quando" respeitado (motor e percurso na tela); "Não sei" com "Já verifiquei"; checklist,
   alertas (≤3), próximos passos (≤3) e encaminhamento (1) do resumo; cruzamentos com os outros módulos;
   pré-preenchimento; estado antigo descartado; botão do próximo módulo; zero erro de página.
   Sabotagem: SABOTAR=1 (M9-08 também em casa) e SABOTAR=2 (4 alertas) devem fazer o teste falhar. */
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
"pergunta": "Quer anotar alguma ideia sobre vendas, equipe ou próximos passos?",
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
"No Módulo 4 você indicou uma atividade com regras específicas. Quer rever esta resposta?",
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
"No Módulo 7 você indicou um equipamento a gás. Quer rever esta resposta?",
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
const J = (x) => (x === undefined ? x : JSON.parse(JSON.stringify(x)));
/* objetos do vm são de outro realm: passa tudo por JSON para o deepStrictEqual */
const Mo = Object.fromEntries(Object.entries(ctx.window.Motor9).map(([k, v]) => [k, typeof v === 'function' ? (...a) => J(v(...a)) : J(v)]));

const norm = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();
const NS = 'Não sei';
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
const opcoesTela = (cod) => { const l = EP[cod].caminhos.flatMap((c) => opcoesDaLinha(c[0])); (EXTRAS_APP[cod] || []).forEach(([dep, o]) => l.splice(l.indexOf(dep) + 1, 0, o)); return l; };
assert.deepEqual(Mo.opcoes(D, 'M9-02'), ['Sim, alimentos ou bebidas', 'Sim, cosméticos, saneantes, medicamentos ou produtos para a saúde', 'Sim, procedimentos no corpo ou cuidado com pessoas', 'Sim, animais', 'Não', OUTRA, NS]);
assert.deepEqual(Mo.opcoes(D, 'M9-03'), ['Na minha casa', 'Em apartamento ou condomínio residencial', 'Em loja ou sala comercial', DOMIC, 'Sem local fixo (digital, na casa do cliente ou ambulante)', 'Ainda não escolhi', NS]);

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
    const b = f.endsWith(path.join('m09', 'js', 'motor.js')) ? motorTexto() : await fsp.readFile(f);
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
  const codAtual = async () => { const t = await titulo(); return ESPERADO.perguntas.find((q) => norm(q.pergunta) === t).codigo; };
  const tocar = (t) => page.evaluate((t) => { const b = [...document.querySelectorAll('.opcao')].find((x) => x.textContent.replace(/\s+/g, ' ').trim() === t); if (!b) throw new Error('opção ausente: ' + t); b.click(); }, t);
  /* textContent: o resto do texto longo fica em "Ver mais" fechado (lote 3), mas continua sendo o texto literal */
  const retorno = (sel) => page.evaluate((sel) => [...document.querySelectorAll(sel + ' .bloco:not(.cruz):not(.extra) p')].map((p) => p.textContent).join(' '), sel || '#retorno');
  const cruzes = () => page.evaluate(() => [...document.querySelectorAll('#retorno .cruz p')].map((p) => p.innerText.replace(/\s+/g, ' ').trim()));
  const esperadoVisivel = (t) => norm(t.replace('⚠ Atenção:', '').replace(/^Atenção: /, ''));
  async function abrir(estado, outros) {
    await page.goto(URL0);
    await page.evaluate(([k, e, o]) => { localStorage.clear(); if (e) localStorage.setItem(k, JSON.stringify(e)); Object.entries(o || {}).forEach(([kk, v]) => localStorage.setItem(kk, JSON.stringify(v))); }, [K, estado, outros]);
    await page.reload();
  }

  /* ---------- 3. capa, estado antigo descartado ---------- */
  await abrir({ R: { 'M9.P01': { estado: 'opcao', opcao: 'Sim' } }, hist: ['M9.P01'] });
  assert.equal(norm(await page.textContent('#ir')), 'Começar', 'estado da versão anterior descartado');
  assert.equal(norm(await page.textContent('.heroi h1')), norm(D.modulo.nome));
  assert.equal(await page.locator('.rodape .logos img').count(), 3);
  assert.ok(norm(await page.textContent('.corpo')).includes(norm(ESPERADO.mensagem_limite)), 'mensagem de limite na capa');
  if (SHOTS) await page.screenshot({ path: path.join(SHOTS, 'm09_inicio.png') });

  /* ---------- 4. cada linha de caminho alcançada na tela ---------- */
  const OUTROS = {
    'lg2-turma-a-m04': { R: { 'M4.P15': { estado: 'opcao', opcao: 'Sim' } } },
    'lg2-turma-b-m08': { R: { 'M8.P01': { estado: 'valor', valor: 'Bolos caseiros por encomenda' }, 'M8.P05': { estado: 'opcao', opcao: 'Não' } } },
    'lg2-turma-a-m01': { R: { 'M1.P04': { estado: 'opcao', opcao: 'Ainda não sei fazer' } } },
    'lg2-turma-b-m06': { R: { 'M6.P01': { estado: 'valor', valor: 'Batedeira e formas' } } },
    'lg2-turma-b-m07': { mapa: ['Receber o pedido', 'Assar no fogão a gás'], R: {} },
  };
  const CENA = { 'M9-01': 'Minas Gerais', 'M9-02': 'Sim, alimentos ou bebidas', 'M9-03': O.apto, 'M9-04': 'Sim, foi aprovada', 'M9-05': '30', 'M9-06': 'Sim, menos de 100 pessoas ao mesmo tempo', 'M9-07': O.botijao, 'M9-07a': '1 botijão de 13 kg (P13)', 'M9-07b': 'Do lado de fora, em área aberta e ventilada ou em abrigo próprio', 'M9-07c': 'Não', 'M9-08': 'Sim', 'M9-09': 'Área separada, de uso exclusivo, com equipamentos exclusivos', 'M9-10': 'Não', 'M9-11': 'Não', 'M9-12': 'Não' };
  const cenaPara = (cod) => cod === 'M9-03a' ? Object.assign({}, CENA, { 'M9-03': O.sem }) : cod === 'M9-03b' ? Object.assign({}, CENA, { 'M9-03': O.naoEsc }) : CENA;
  const alcancadas = new Set();
  const marca = (cod, i) => alcancadas.add(cod + '#' + i);
  const cruzVistos = new Set();
  for (const q of ESPERADO.perguntas) {
    const cod = q.codigo;
    if (cod === 'M9-14') continue;
    const A = cenaPara(cod);
    const antes = esperadoSeq(A); const ate = antes.slice(0, antes.indexOf(cod));
    assert.ok(antes.includes(cod), cod);
    await abrir({ v: 2, R: R_(Object.fromEntries(ate.map((c) => [c, A[c]]))), feitos: {} }, OUTROS);
    await page.click('#ir');
    assert.equal(await codAtual(), cod, 'abre a 1ª pergunta sem resposta');
    const botoes = await page.$$eval('#ent .opcao', (bs) => bs.map((x) => x.textContent.replace(/\s+/g, ' ').trim()));
    /* M9-01: o estado não tem mais "Não sei" (relatório da Júlia, 05/11) */
    assert.deepEqual(botoes, cod === 'M9-01' ? [] : opcoesTela(cod), `opções de ${cod}`);
    for (let i = 0; i < q.caminhos.length; i++) {
      const [linha, txt] = q.caminhos[i];
      if (cod === 'M9-01' && opcoesDaLinha(linha).includes(NS)) { assert.equal(await page.locator('#ent .opcao').count(), 0, 'M9-01 sem botão Não sei'); marca(cod, i); continue; }
      if (cod === 'M9-01' && i === 0) { await page.selectOption('#uf', 'Minas Gerais'); assert.equal(norm(await retorno()), norm(txt.replace('[estado]', 'Minas Gerais'))); marca(cod, i); continue; }
      if (cod === 'M9-05' && linha.startsWith('Área informada')) { await page.fill('#area', '30'); assert.equal(norm(await retorno()), norm(txt)); marca(cod, i); continue; }
      if (cod === 'M9-05' && linha === 'Valor inválido') {
        for (const v of ['0', '-5', 'abc']) { await page.fill('#area', v); assert.equal(norm(await retorno()), norm(txt), v); }
        await page.click('#ok'); assert.equal(await codAtual(), 'M9-05', 'valor inválido não avança'); marca(cod, i); continue;
      }
      if (cod === 'M9-13') { await page.fill('#ideias', linha === 'Texto preenchido' ? 'Vender também em feiras' : ''); assert.equal(norm(await retorno()), norm(txt)); marca(cod, i); continue; }
      for (const o of opcoesDaLinha(linha)) {
        await tocar(o);
        assert.equal(norm(await retorno()), esperadoVisivel(txt), `${cod} · ${o}`);
        const aviso = o === NS && txt.includes('⚠ Atenção:');
        assert.equal(await page.locator('#verifiquei').count(), aviso ? 1 : 0, `${cod} · ${o}: botão Já verifiquei`);
        assert.equal(norm(await page.textContent('#ok')), aviso ? 'Seguir sem responder' : cod === 'M9-13' ? 'Ver meu checklist' : 'Continuar');
        if (aviso) assert.equal(norm(await page.textContent('#retorno .b-alerta b')), '⚠ Atenção');
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
    marca('M9-14', i);
  }
  assert.equal(alcancadas.size, TOTAL, `linhas alcançadas ${alcancadas.size} de ${TOTAL}`);
  console.log(`caminhos: ${alcancadas.size} de ${TOTAL} linhas alcançadas na tela`);

  /* cruzamentos mostrados na pergunta (dados dos outros módulos semeados) */
  const CZ = ESPERADO.cruzamentos.map((c) => norm(c[1]));
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
  async function percorrer(A, outros) {
    await abrir(null, outros);
    await page.click('#ir');
    const vistos = [];
    for (let i = 0; i < 30; i++) {
      if (await page.locator('#q14').count()) break;
      const cod = await codAtual(); vistos.push(cod);
      const v = A[cod];
      if (cod === 'M9-01') { if (v === NS) await tocar(NS); else await page.selectOption('#uf', v); }
      else if (cod === 'M9-05') { if (v === NS) await page.click('#nsb'); else await page.fill('#area', v); }
      else if (cod === 'M9-13') await page.fill('#ideias', v || '');
      else await tocar(v);
      await page.click('#ok');
    }
    return vistos;
  }
  const ROTEIROS = [
    Object.assign({}, CENA, { 'M9-13': 'Anotação' }),
    Object.assign({}, BASE_REMOTO, { 'M9-13': '' }),
    Object.assign({}, RUA, { 'M9-13': '' }),
    Object.assign({}, IDEIA, { 'M9-01': 'Pará', 'M9-13': '' }),
    Object.assign({}, GAS, { 'M9-13': '' }),
    { 'M9-01': 'Goiás', 'M9-02': 'Sim, animais', 'M9-03': NS, 'M9-03b': O.pCasa, 'M9-04': NS, 'M9-05': NS, 'M9-06': 'Não, só trabalho interno ou atendimento fora', 'M9-07': 'Sim, gás encanado da rua (gás natural)', 'M9-07c': 'Sim, só para uso e limpeza, em embalagens pequenas', 'M9-09': NS, 'M9-10': 'Não', 'M9-11': 'Sim', 'M9-12': 'Só pequenos reparos', 'M9-13': '' },
    { 'M9-01': 'Pará', 'M9-02': 'Não', 'M9-03': O.naoEsc, 'M9-03b': O.pSem, 'M9-03a': NS, 'M9-04': 'Ainda não fiz', 'M9-10': 'Não', 'M9-11': 'Não', 'M9-13': '' },
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
  console.log(`percurso: ${ROTEIROS.length} roteiros na tela seguem o fluxo esperado`);

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

  /* ---------- 6. "Não sei" com "Já verifiquei" e "Seguir sem responder" ---------- */
  await abrir({ v: 2, R: R_({ 'M9-01': 'Acre' }), feitos: {} });
  await page.click('#ir');
  await tocar(NS);
  if (SHOTS) { await page.waitForTimeout(400); await page.screenshot({ path: path.join(SHOTS, 'm09_pergunta.png'), fullPage: true }); }
  await page.click('#verifiquei');
  assert.equal(await page.locator('#ent .opcao.sel').count(), 0, 'Já verifiquei volta à pergunta');
  assert.equal(norm(await page.textContent('#retorno')), '');
  assert.equal(norm(await page.textContent('#ok')), 'Continuar');
  await page.click('#ok'); assert.equal(await codAtual(), 'M9-02', 'sem resposta não avança');
  await tocar(NS); await page.click('#ok');
  assert.equal(await codAtual(), 'M9-03', 'seguir sem responder avança');
  assert.deepEqual((await st()).R['M9-02'], { estado: 'naosei' });

  /* recarregar mantém e retoma */
  await page.reload();
  assert.equal(norm(await page.textContent('#ir')), 'Continuar de onde parei');
  await page.click('#ir'); assert.equal(await codAtual(), 'M9-03');
  /* Voltar */
  await page.click('#v'); assert.equal(await codAtual(), 'M9-02');

  /* ---------- 7. resumo: tudo "Não sei", corrigir e voltar ao resumo, marcar feito ---------- */
  const TUDO_NS_TELA = Object.assign({}, TUDO_NS, { 'M9-01': 'Acre' }); // o estado não aceita mais "Não sei"
  await abrir({ v: 2, R: Object.assign(R_(TUDO_NS_TELA), { 'M9-13': { estado: 'valor', valor: '' } }), feitos: {} });
  await page.click('#ir');
  assert.equal(await page.locator('#alertas .bloco').count(), 3);
  assert.deepEqual(await page.$$eval('#alertas .bloco p', (ps) => ps.map((p) => p.innerText.replace(/\s+/g, ' ').trim())), Mo.alertas(D, R_(TUDO_NS_TELA), {}).map(norm));
  assert.equal(await page.locator('#encaminhamento .bloco').count(), 1);
  assert.ok(norm(await page.textContent('#linha-resumo')).includes('(fato)') || norm(await page.textContent('#linha-resumo')).includes('(hipótese)'));
  await page.evaluate(() => [...document.querySelectorAll('#op14 .opcao')].find((x) => x.textContent.trim() === 'Quero corrigir algo').click());
  await page.click('[data-c="M9-04"]');
  assert.equal(await codAtual(), 'M9-04');
  await tocar('Sim, foi aprovada'); await page.click('#ok');
  assert.equal(norm(await page.textContent('.passo')), 'Resultado', 'corrigir volta ao resumo');
  assert.equal(await page.$eval('[data-item="viabilidade"] .sit', (e) => e.textContent.trim()), 'feito');
  await page.check('[data-feito="obra"]');
  assert.equal(await page.$eval('[data-item="obra"] .sit', (e) => e.textContent.trim()), 'feito');
  assert.deepEqual((await st()).feitos, { obra: true });
  if (SHOTS) { await page.waitForTimeout(400); await page.screenshot({ path: path.join(SHOTS, 'm09_resultado.png'), fullPage: true }); }

  /* ---------- 8. pré-preenchimento vindo de outros módulos ---------- */
  await abrir({ v: 2, R: R_({ 'M9-01': 'Acre' }), feitos: {} }, { 'lg2-turma-a-m04': { R: { 'M4.P15': { estado: 'opcao', opcao: 'Não' } } } });
  await page.click('#ir');
  /* "Não" do Módulo 4 não é mais pré-marcado: a pergunta de saúde precisa ser respondida aqui */
  assert.equal(await page.locator('#ent .opcao.sel').count(), 0, 'M9-02 nunca vem pré-marcada como Não');
  assert.equal(await page.locator('#ent .veio').count(), 0);
  await abrir(null, { 'lg2-turma-a-m03': { R: { 'M3-08': { estado: 'valor', valor: 'Juiz de Fora - MG' } } }, 'lg2-turma-b-m08': OUTROS['lg2-turma-b-m08'] });
  assert.ok(norm(await page.textContent('.corpo')).includes('Bolos caseiros por encomenda'), 'descrição do Módulo 8 na capa');
  await page.click('#ir');
  assert.equal(await page.$eval('#uf', (s) => s.value), 'Minas Gerais', 'estado pela cidade do Módulo 3');
  /* nunca escreve nas chaves dos outros módulos */
  assert.deepEqual(JSON.parse(await page.evaluate(() => localStorage.getItem('lg2-turma-b-m08'))), OUTROS['lg2-turma-b-m08']);

  /* ---------- 8b. herança do Módulo 8 (onde funciona, profissional formado) e do Módulo 4 (saúde) ---------- */
  const m8 = (extra) => ({ 'lg2-turma-b-m08': { R: Object.assign({ 'M8.P01': { estado: 'valor', valor: 'Lavagem de carros na casa do cliente' } }, extra) } });
  const opc = (o) => ({ estado: 'opcao', opcao: o });
  const selAtual = async () => norm(await page.textContent('#ent .opcao.sel'));
  const veioAtual = async () => norm(await page.textContent('#ent .veio-linha'));
  const ATE3 = { 'M9-01': 'Minas Gerais', 'M9-02': 'Não' };
  for (const [l8, l9, f9] of [['Minha casa', O.casa, null], ['Ponto comercial', O.loja, null], ['Atendimento externo', O.sem, O.cliente], ['Online', O.sem, O.internet]]) {
    await abrir({ v: 2, R: R_(ATE3), feitos: {} }, m8({ 'M8.P03': opc(l8) }));
    await page.click('#ir');
    assert.equal(await codAtual(), 'M9-03', 'M9-03 não é pulada (opções diferentes do Módulo 8)');
    assert.equal(await selAtual(), norm(l9), 'M9-03 pré-marcada: ' + l8);
    assert.equal(await veioAtual(), 'Veio do Módulo 8 Confira e ajuste se quiser.');
    assert.ok(norm(await retorno()).length > 0, 'retorno da opção herdada aparece');
    await page.click('#ok');
    if (f9) {
      assert.equal(await codAtual(), 'M9-03a', 'sem local fixo continua pedindo a forma');
      assert.equal(await selAtual(), norm(f9), 'M9-03a pré-marcada: ' + l8);
      assert.equal(norm(await page.textContent('#ent .veio')), 'Veio do Módulo 8');
      await page.click('#ok');
    }
    assert.equal(await codAtual(), 'M9-04', 'fluxo segue as condições');
    const R9 = (await st()).R;
    assert.deepEqual(R9['M9-03'], opc(l9), 'herança gravada só depois de confirmar');
    if (f9) assert.deepEqual(R9['M9-03a'], opc(f9)); else assert.equal(R9['M9-03a'], undefined);
  }
  /* trocar a opção herdada vale (ajuste): M8 = Atendimento externo, pessoa muda para loja => sem M9-03a */
  await abrir({ v: 2, R: R_(ATE3), feitos: {} }, m8({ 'M8.P03': opc('Atendimento externo') }));
  await page.click('#ir'); await tocar(O.loja); await page.click('#ok');
  assert.equal(await codAtual(), 'M9-04', 'ajustar a herança refaz o caminho');
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
    assert.equal(await codAtual(), 'M9-10');
    assert.equal(await selAtual(), v, 'M9-10 pré-marcada pelo Módulo 8');
    assert.equal(norm(await page.textContent('#ent .veio')), 'Veio do Módulo 8');
    if (SHOTS && v === 'Sim') { await page.waitForTimeout(400); await page.screenshot({ path: path.join(SHOTS, 'm09_heranca_m9-10.png') }); }
    await page.click('#ok');
    assert.equal(await codAtual(), 'M9-11');
    assert.deepEqual((await st()).R['M9-10'], opc(v));
  }
  await abrir({ v: 2, R: R_(ATE10), feitos: {} }, m8({ 'M8.P08': { estado: 'naosei' } }));
  await page.click('#ir'); assert.equal(await page.locator('#ent .opcao.sel').count(), 0, 'Não sei do Módulo 8 não é herdado');
  /* M9-02 <- M4.P15 = Sim + o que vende: opção sugerida; sem pista, só o lembrete */
  await abrir({ v: 2, R: R_({ 'M9-01': 'Acre' }), feitos: {} }, Object.assign({ 'lg2-turma-a-m04': { R: { 'M4.P15': opc('Sim') } } }, { 'lg2-turma-a-m01': { R: { 'M1.P03': { estado: 'valor', valor: 'Bolos caseiros por encomenda' } } } }));
  await page.click('#ir');
  assert.equal(await selAtual(), 'Sim, alimentos ou bebidas', 'M9-02 sugerida pelo Módulo 4 + o que vende');
  assert.equal(norm(await page.textContent('#ent .veio')), 'Veio do Módulo 4');
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
  await abrir({ v: 2, R: Object.assign(R_(GAS), { 'M9-13': { estado: 'valor', valor: '' } }), feitos: {} });
  await page.click('#ir'); assert.equal(await page.locator('#nota-casa').count(), 0); assert.equal(await page.locator('#alimentos').count(), 0);
  for (const [uf, deve, naoDeve] of [['Acre', 'Corpo de Bombeiros do seu estado (Acre)', 'CBMERJ'], ['Rio de Janeiro', 'CBMERJ', 'Corpo de Bombeiros do seu estado']]) {
    await abrir({ v: 2, R: Object.assign(R_(Object.assign({}, GAS, { 'M9-01': uf })), { 'M9-13': { estado: 'valor', valor: '' } }), feitos: {} });
    await page.click('#ir');
    const g = norm(await page.textContent('[data-item="gas"]'));
    assert.ok(g.includes(deve) && !g.includes(naoDeve), uf + ': ' + g);
  }
  /* conceito do gás na pergunta: sem exemplo nem fonte do RJ para o Acre */
  await abrir({ v: 2, R: R_({ 'M9-01': 'Acre', 'M9-02': 'Não', 'M9-03': O.loja, 'M9-04': 'Ainda não fiz', 'M9-06': 'Não, só trabalho interno ou atendimento fora' }), feitos: {} });
  await page.click('#ir'); assert.equal(await codAtual(), 'M9-07');
  const termosGas = await page.evaluate(() => document.querySelector('.saiba').textContent.replace(/\s+/g, ' '));
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

  /* ---------- 8g. lote 3: Voltar no topo, "Outra atividade" com campo, domicílio, "Ver mais", termos embaixo do Continuar ---------- */
  await abrir({ v: 2, R: R_({ 'M9-01': 'Minas Gerais' }), feitos: {} }, { 'lg2-turma-a-m03': { R: { 'M3-08': { estado: 'valor', valor: 'Juiz de Fora - MG' } } } });
  await page.click('#ir'); assert.equal(await codAtual(), 'M9-02');
  assert.ok(await page.evaluate(() => { const c = document.querySelector('.cartao-q'), v = c.querySelector('#v'), q = c.querySelector('#pergunta'); return c.firstElementChild === v && v.getBoundingClientRect().bottom <= q.getBoundingClientRect().top + 1; }), 'Voltar no topo do cartão, acima da pergunta');
  assert.equal(await page.getByRole('button', { name: 'Voltar', exact: true }).count(), 1, 'um só Voltar');
  assert.ok(await page.evaluate(() => { const a = document.querySelector('#acoes'), t = document.querySelector('.cartao-q .saiba'); return !t || !!(a.compareDocumentPosition(t) & 4); }), 'Entenda os termos embaixo do Continuar');
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
  await page.click('#ir'); assert.equal(await codAtual(), 'M9-03');
  assert.equal(await selAtual(), DOMIC, 'M9-03: domicílio herdado do Módulo 8');
  assert.equal(norm(await page.textContent('#ent .veio')), 'Veio do Módulo 8');
  await page.click('[data-inicio]');
  assert.ok(norm(await page.textContent('.corpo')).includes('9602-5/01 (CABELEIREIRO(A) INDEPENDENTE)'), 'CNAE escolhido no Módulo 8 na capa');

  /* ---------- 9. botão do próximo módulo: marcação exata ---------- */
  const app = fs.readFileSync(path.join(DIR, 'js/app.js'), 'utf8');
  const blocos = app.match(/<div class="acoes lg2-proximo">.*?<\/div>/g) || [];
  assert.equal(blocos.length, 1);
  assert.ok(blocos[0].includes('href="/lg2/turma-b/m10/index.html">Ir para o Módulo 10<'));
  assert.equal((app.match(/addEventListener\("focusin"/g) || []).length, 1, 'um único listener de foco');
  assert.ok(fs.readFileSync(path.join(DIR, 'index.html'), 'utf8').includes('content="width=device-width, initial-scale=1, interactive-widget=resizes-content"'));

  assert.deepEqual(errs, []);
  await b.close(); server.close();
  console.log('lg2-m09-turma-b ok');
})().catch(async (e) => { console.error(e); process.exit(1); });
