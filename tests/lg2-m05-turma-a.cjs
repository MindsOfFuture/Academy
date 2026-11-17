/* LG2 · Módulo 5 (Turma A) · teste headless das correções do grupo ("Correções Módulo 5").
   Execute: PW=<caminho do playwright> node tests/lg2-m05-turma-a.cjs
   Opcional: LG2_SHOTS=<pasta> (prints 390x844).
   Cobre: "Não sei" dos gastos fixos (P24–P35) vira botão de ajuda com o conceito da Base técnica,
   não deixa avançar sem resposta, preço (P36) depois da quantidade (P37), passo de análise do preço
   (preço possível pelo % de lucro e % de lucro reverso, faixas baixa/alta/negativa), observações,
   resultado sem NaN nos três tipos de negócio, largura do campo de nome na P33, versão do estado salvo
   e persistência após recarregar. Versão leve (nov/2026): toda tela de pergunta com até 60 palavras visíveis,
   "Ver dica" fechada, e cada "Não sei" mostra "Como descobrir" (2 passos + pedido para a IA com Copiar) sem gravar
   resposta. Imprime PASS/FAIL e sai com código != 0 se falhar. */
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const http = require('node:http');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..', 'public');
const dir = path.join(root, 'lg2/turma-a/m05');
const ctx = { window: {} };
const dadosSrc = fs.readFileSync(path.join(dir, 'dados/modulo5.js'), 'utf8');
vm.runInNewContext(dadosSrc, ctx);
const D = ctx.window.MODULO5;
const Motor = require(path.join(dir, 'js/motor.js'));
const M = Motor.montar(JSON.parse(JSON.stringify(D)));
const SHOTS = process.env.LG2_SHOTS || '';
const KEY = 'lg2-turma-a-m05';
const falhas = [];
let passes = 0;
const ok = (cond, msg) => { if (!cond) { falhas.push(msg); console.log('FAIL: ' + msg); } else passes++; };
const norm = (s) => String(s || '').replace(/\s+/g, ' ').trim();
const brl = (n) => 'R$ ' + n.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const pct1 = (n) => n.toFixed(1).replace('.', ',') + '%';

let playwright;
try { playwright = require(process.env.PW); } catch { playwright = require('playwright'); }

/* ---------- estático ---------- */
const app = fs.readFileSync(path.join(dir, 'js/app.js'), 'utf8');
const motorSrc = fs.readFileSync(path.join(dir, 'js/motor.js'), 'utf8');
ok(/const CHAVE = "lg2-turma-a-m05";/.test(app), 'CHAVE deve continuar lg2-turma-a-m05');
ok(/const LUCRO_BAIXO = 20;/.test(motorSrc) && /const LUCRO_ALTO = 100;/.test(motorSrc), 'constantes LUCRO_BAIXO=20 e LUCRO_ALTO=100 no motor');
ok(!/rafael/i.test(dadosSrc), 'nenhum "rafael" em dados/modulo5.js');
ok(!/\b\d{4,5}-?\d{4}\b/.test(JSON.stringify(D)), 'nenhum telefone em dados/modulo5.js');
const perguntas = D.perguntas.filter((p) => p.codigo);
ok(perguntas.every((p) => 'video' in p && p.video === ''), 'campo video (vazio) em todas as perguntas');
const FIXOS = ['M5.P24', 'M5.P25', 'M5.P26', 'M5.P27', 'M5.P28', 'M5.P29', 'M5.P30', 'M5.P31', 'M5.P32', 'M5.P33', 'M5.P34', 'M5.P35'];
for (const c of FIXOS) {
  ok(!M.porCodigo[c].opcoesLista.some((o) => /n[ãa]o sei/i.test(o)), `${c}: "Não sei" fora das opções`);
  ok(Motor.botoesAlternativos(M, M.porCodigo[c]).length === 0, `${c}: sem botão de resposta alternativa`);
}
/* correções 15/10 e 22/10: "Não sei" é ajuda em todas as perguntas; P00 (Módulo 1) abre; formas de pagamento antes das taxas */
for (const q of M.ordem) {
  ok(!q.opcoesLista.some((o) => /n[ãa]o sei/i.test(o)), `${q.codigo}: "Não sei" não é opção de resposta`);
  ok(Motor.botoesAlternativos(M, q).every((o) => /^Ainda não/.test(o)), `${q.codigo}: só "Ainda não…" como botão alternativo`);
  ok(Motor.ajudaNaoSei(M, q) !== null, `${q.codigo}: tem ajuda "Não sei"`);
}
/* versão leve: ajuda do "Não sei" escrita para cada pergunta, nos dados (não no código das telas) */
for (const q of M.ordem) {
  ok(Array.isArray(q.comoDescobrir) && q.comoDescobrir.length === 2 && q.comoDescobrir.every((x) => typeof x === 'string' && x.trim().length > 20), `${q.codigo}: "Como descobrir" com 2 passos nos dados`);
  ok(!q.promptIA || (/\[[^\]]+\]/.test(q.promptIA) && !/chatgpt|gemini|copilot|claude|openai|google/i.test(q.promptIA)), `${q.codigo}: pedido para a IA com colchetes e sem marca`);
}
ok(M.ordem.filter((q) => q.promptIA).length >= 35, 'pedido para a IA na maior parte das perguntas');
ok(M.ordem.every((q) => q.comoDescobrir.every((x) => !app.includes(x)) && (!q.promptIA || !app.includes(q.promptIA))), 'textos do "Não sei" ficam nos dados, não no código das telas');
ok(M.ordem[0].codigo === 'M5.P00' && M.ordem[0].pergunta === 'Como está a sua ideia hoje?', 'primeira pergunta = pergunta 1 do Módulo 1');
ok(M.ordem[M.ordem.findIndex((q) => q.codigo === 'M5.P24') - 1].codigo === 'M5.PG', 'formas de pagamento logo antes das taxas');
for (const c of ['M5.P08', 'M5.P15', 'M5.P23', 'M5.P35']) ok(Motor.proxima(M, M.porCodigo[c], { estado: 'opcao', opcao: 'Não' }, null) !== 'M5.P24', `${c}: não pula as formas de pagamento`);
ok(Motor.proxima(M, M.porCodigo['M5.P08'], { estado: 'opcao', opcao: 'Não' }, Motor.regra(M, M.porCodigo['M5.P08'], { estado: 'opcao', opcao: 'Não' })) === 'M5.ENT' && Motor.proxima(M, M.porCodigo['M5.ENT'], { estado: 'opcao', opcao: Motor.ENT_NAO }, null) === 'M5.PG', 'P08 Não -> entrega -> formas de pagamento');
ok(Motor.taxaMedia([{ taxa: '0', parte: '60' }, { taxa: '5', parte: '40' }]) === 2, 'taxa média ponderada pelas formas: 0%x60 + 5%x40 = 2%');
ok(Motor.validar(M, M.porCodigo['M5.P25'], [{ forma: 'Pix', taxa: '', prazo: '' }], {}) === Motor.MSG_RESPONDA, 'P25: taxa vazia não vale 0');
ok(Motor.validar(M, M.porCodigo['M5.P25'], [{ forma: 'Pix', taxa: '0', prazo: '', parte: '50' }, { forma: 'Cartão de crédito', taxa: '5', prazo: '30', parte: '40' }], {}) === Motor.MSG_SOMA_PARTES, 'P25: partes que não somam 100% bloqueiam');
ok(Motor.validar(M, M.porCodigo['M5.P29'], '', {}) === Motor.MSG_RESPONDA, 'P29: campo vazio não vale R$ 0');
ok(Motor.validar(M, M.porCodigo['M5.P02'], '', {}) === 'Preencha o nome para continuar.', 'P02: mensagem do grupo para nome vazio');
{
  const Rq = { 'M5.P05': { estado: 'valor', valor: [{ q: '8', u: 'ml' }] } };
  ok(Motor.avisoQuantidade(M, M.porCodigo['M5.P06'], [{ q: '1', u: 'L' }], Rq) === Motor.MSG_QTD_ALTA, 'esmalte 8 ml x 1 L por atendimento: aviso de quantidade alta (conversão L->ml)');
  ok(Motor.avisoQuantidade(M, M.porCodigo['M5.P06'], [{ q: '5', u: 'ml' }], Rq) === null, '5 ml de 8 ml: sem aviso');
  ok(Motor.avisoQuantidade(M, M.porCodigo['M5.P06'], [{ q: '0,5', u: 'kg' }], { 'M5.P05': { estado: 'valor', valor: [{ q: '600', u: 'g' }] } }) === null, '0,5 kg de 600 g: sem aviso (kg->g)');
}
{
  const f = Motor.faixaMercado('de R$ 40 a R$ 60');
  ok(f && f.min === 40 && f.max === 60, 'faixa do Módulo 3 lida do texto livre');
  ok(Motor.faixaMercado('não sei') === null, 'faixa sem número = sem comparação');
}
/* herança do Módulo 1 (relatório do testador 05/11): M1.P03A -> M5.P01 e M1.P01 -> M5.P00 */
ok(Motor.herdarTipo(M, { estado: 'opcao', opcao: 'Serviço: meu cliente paga pelo trabalho que realizo' }) === 'Serviço: meu cliente paga pelo trabalho que realizo', 'M1.P03A Serviço -> opção Serviço da P01');
ok(Motor.herdarTipo(M, { estado: 'opcao', opcao: 'Mercadoria' }) === 'Mercadoria: compro pronto para revender', 'M1.P03A mapeado pela palavra inicial');
ok(Motor.herdarTipo(M, { estado: 'naosei' }) === null && Motor.herdarTipo(M, null) === null, 'M1.P03A "Não sei"/ausente não é herança');
ok(Motor.herdarEstagio(M, { estado: 'opcao', opcao: 'Não sei dizer' }) === null && Motor.herdarEstagio(M, { estado: 'opcao', opcao: 'Já vendo sempre' }) === 'Já vendo sempre', 'M1.P01 "Não sei dizer" não é herança');
/* relatório dos testadores 05/11 */
{
  const html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
  ok(/content="width=device-width, initial-scale=1, interactive-widget=resizes-content"/.test(html), 'receita A: viewport com interactive-widget=resizes-content');
  ok((app.match(/addEventListener\("focusin"/g) || []).length === 1 && /visualViewport/.test(app) && /scrollIntoView\(\{ block: "center" \}\)/.test(app) && !/scrollTo\(0, ?0\)[^;]*focus/.test(app), 'receita A: um listener focusin + visualViewport, centraliza o campo');
  ok(/const LIMITE_ACRESCIMO = 500;/.test(motorSrc) && /const LIMITE_FATURAMENTO = 100000;/.test(motorSrc), 'limites nomeados: acréscimo 500% e faturamento R$ 100 mil/mês');
  /* receita B: texto em campo numérico não passa */
  ok(Motor.num('abc') === null && Motor.num('12abc') === null && Motor.num('1e5') === null && Motor.num('12,50') === 12.5 && Motor.num('0.5') === 0.5 && Motor.num('1.500') === 1500 && Motor.num('1.500,75') === 1500.75 && Motor.num('R$ 30') === 30, 'num(): texto não é número; "1.500" = 1500; vírgula e ponto decimal');
  const V = (c, v, R = {}) => Motor.validar(M, M.porCodigo[c], v, R);
  ok(V('M5.P07', 'dez') === Motor.MSG_NUMERO && V('M5.P29', 'quinhentos') === Motor.MSG_NUMERO && V('M5.P36', 'caro') === Motor.MSG_NUMERO && V('M5.P37', '10 bolos') === Motor.MSG_NUMERO, 'número/R$: texto rejeitado com "Digite só números"');
  ok(V('M5.P04', ['10', 'doze']) === Motor.MSG_NUMERO, 'preço por item: texto rejeitado');
  ok(V('M5.P05', [{ q: 'um', u: 'kg' }]) === Motor.MSG_NUMERO, 'quantidade + unidade: texto rejeitado');
  ok(V('M5.P09', { preco: 'vinte', qtd: '10' }) === Motor.MSG_NUMERO && V('M5.P09', { preco: '20', qtd: 'dez' }) === Motor.MSG_NUMERO, 'pacote: texto rejeitado');
  ok(V('M5.P33', [{ nome: 'Internet', v: 'cem' }]) === Motor.MSG_NUMERO, 'lista de contas: texto no valor rejeitado');
  ok(V('M5.P23', { h: 'uma', m: '' }) === Motor.MSG_NUMERO, 'tempo: texto rejeitado');
  ok(V('M5.P25', [{ forma: 'Pix', taxa: 'zero', prazo: '' }]) === Motor.MSG_NUMERO && V('M5.P25', [{ forma: 'Pix', taxa: '0', prazo: 'trinta' }]) === Motor.MSG_NUMERO, 'taxas por forma: texto rejeitado');
  ok(V('M5.P29', '500') === null && V('M5.P04', ['10', '12,5']) === null, 'números válidos continuam passando');
  /* valores absurdos: aviso (não trava) */
  const Rm = { 'M5.P01': { estado: 'opcao', opcao: 'Mercadoria: compro pronto para revender' }, 'M5.P11': { estado: 'valor', valor: '1500' }, 'M5.P12': { estado: 'valor', valor: '1500' }, 'M5.P13': { estado: 'opcao', opcao: 'Não' }, 'M5.P15': { estado: 'opcao', opcao: 'Não' } };
  ok(Motor.avisoValor(M, M.porCodigo['M5.P36'], '1500', Rm) === 'Seu preço está 1.500 vezes o custo. Confira se o custo ou o preço estão certos.', 'P36: custo 1 x preço 1.500 -> "1.500 vezes o custo"');
  ok(Motor.avisoValor(M, M.porCodigo['M5.P36'], '6', Rm) === null && Motor.avisoValor(M, M.porCodigo['M5.P36'], '6,01', Rm) !== null, 'P36: limite em 500% (6 vezes o custo não avisa; 6,01 avisa)');
  ok(Motor.msgVezes(7.5, 1).includes('7,5 vezes'), 'vezes com uma casa abaixo de 10');
  /* gasto inicial x Módulo 1 (pergunta 7) */
  ok(Motor.gastoInicial(M, Rm) === 1500, 'gasto inicial Mercadoria = compra 1.500');
  const inv = Motor.avisoInvestimento(M, Rm, { estado: 'opcao', opcao: 'Até R$ 100' });
  ok(inv && inv.teto === 100 && inv.texto.includes('“Até R$ 100”') && inv.texto.includes('R$\u00a01.500,00'), 'aviso: compra R$ 1.500 acima de "Até R$ 100" do Módulo 1');
  ok(Motor.avisoInvestimento(M, Rm, { estado: 'opcao', opcao: 'Mais de R$ 1.000' }) === null && Motor.avisoInvestimento(M, Rm, { estado: 'opcao', opcao: 'Entre R$ 500 e R$ 1.000' }) !== null && Motor.avisoInvestimento(M, Rm, null) === null, 'tetos 0/100/500/1000/sem teto');
  const Rp = { 'M5.P01': { estado: 'opcao', opcao: 'Produto: eu compro materiais e faço o que vendo' }, 'M5.P04': { estado: 'valor', valor: ['10', '12'] }, 'M5.P08': { estado: 'opcao', opcao: 'Sim' }, 'M5.P09': { estado: 'valor', valor: { preco: '20', qtd: '10' } } };
  ok(Motor.gastoInicial(M, Rp) === 42 && Motor.avisoInvestimento(M, Rp, { estado: 'opcao', opcao: 'Nada por enquanto' }) !== null && Motor.avisoInvestimento(M, Rp, { estado: 'opcao', opcao: 'Até R$ 100' }) === null, 'gasto inicial Produto = materiais 10 + 12 + embalagens 20 = 42');
  /* ponto de equilíbrio: o que falta quando não dá para calcular */
  ok(/falta informar os gastos fixos do mês/.test(Motor.calcular(M, Object.assign({ 'M5.P36': { estado: 'valor', valor: '30' } }, Rm)).peFalta), 'sem gastos do mês: diz o que falta');
  ok(/falta informar o preço de venda e os gastos fixos/.test(Motor.calcular(M, Rm).peFalta), 'sem preço e sem gastos: diz os dois');
  /* exemplos por tipo */
  ok(M.porCodigo['M5.P03'].notaConsumo.exemplo === Motor.NOTA_CONSUMO.exemploProduto && M.porCodigo['M5.P19'].notaConsumo.exemplo === Motor.NOTA_CONSUMO.exemplo, 'nota de consumo: exemplo de produto na P03 e de serviço na P19');
  ok(Motor.exemploConceito(M.conceito['M5.BT04'], 'Serviço').includes('manicure') && Motor.exemploConceito(M.conceito['M5.BT04'], 'Produto') === M.conceito['M5.BT04'].exemplo && Motor.exemploConceito(M.conceito['M5.BT07'], 'Mercadoria').includes('revende'), 'exemplos dos conceitos por tipo (perdas, trabalho)');
}
/* ===== lote 16/11 (A): "Não sei" bloqueia; sai das perguntas sobre a própria pessoa; "Ainda não defini" = "Não sei" ===== */
const SEM_NS = ['M5.P00', 'M5.P01', 'M5.P02', 'M5.P10', 'M5.P17', 'M5.PG', 'M5.P08', 'M5.P13', 'M5.P15', 'M5.P18', 'M5.P26', 'M5.P28', 'M5.P30', 'M5.P32', 'M5.P34', 'M5.P35', 'M5.PH', 'M5.SZ', 'M5.ENT'];
for (const q of M.ordem) ok(q.botaoNaoSei === !SEM_NS.includes(q.codigo), `${q.codigo}: botão "Não sei" ${SEM_NS.includes(q.codigo) ? 'saiu (pergunta sobre a pessoa)' : 'fica (fato a descobrir)'}`);
ok(!M.porCodigo['M5.P36'].opcoesLista.some((o) => /ainda n/i.test(o)) && Motor.botoesAlternativos(M, M.porCodigo['M5.P36']).length === 0, 'P36: "Ainda não defini" fundido no "Não sei" (sem botão alternativo)');
ok(JSON.stringify(Motor.botoesAlternativos(M, M.porCodigo['M5.P37'])) === '["Ainda não comecei a vender"]', 'P37: "Ainda não comecei a vender" (resposta real) continua');
ok(Motor.msgFalta(M.porCodigo['M5.P29'], false) === Motor.MSG_RESPONDA && Motor.msgFalta(M.porCodigo['M5.P29'], true) === 'Use a ajuda acima e escreva a sua resposta para continuar.' && Motor.msgFalta(M.porCodigo['M5.P24'], true) === 'Use a ajuda acima e escolha uma opção para continuar.' && Motor.msgFalta(M.porCodigo['M5.P28'], false) === 'Escolha uma opção para continuar.' && Motor.msgFalta(M.porCodigo['M5.P35'], false) === 'Responda para continuar.', 'mensagens de "falta responder" (com/sem Não sei, ajuda aberta)');
ok(Motor.regra(M, M.porCodigo['M5.P36'], { estado: 'opcao', opcao: 'Ainda não defini' }) === null && Motor.regra(M, M.porCodigo['M5.P24'], { estado: 'naosei' }) === null, 'regras condicionadas a "Não sei"/"Ainda não defini" não disparam');
{
  const S0 = { versao: 3, R: { 'M5.P00': { estado: 'opcao', opcao: 'Já vendo sempre' }, 'M5.P24': { estado: 'naosei' }, 'M5.P29': { estado: 'valor', valor: '500' }, 'M5.P36': { estado: 'opcao', opcao: 'Ainda não defini' }, 'M5.P37': { estado: 'opcao', opcao: 'Ainda não comecei a vender' } }, hist: ['M5.P00', 'M5.P24', 'M5.P29', 'M5.P37', 'M5.P36', 'PRECO', 'RESULTADO'] };
  const tirou = Motor.migrar(S0);
  ok(JSON.stringify(tirou) === '["M5.P24","M5.P36"]' && Object.keys(S0.R).join() === 'M5.P00,M5.P29,M5.P37' && JSON.stringify(S0.hist) === '["M5.P00","M5.P24"]', 'migrar: "Não sei"/"Ainda não defini" viram sem resposta, o resto fica, histórico para na 1ª sem resposta ' + JSON.stringify(S0));
}
/* ===== lote 16/11 (B): contas com os mesmos valores arredondados que aparecem (relatório de revisão do Módulo 6) ===== */
{
  const base = { 'M5.P01': { estado: 'opcao', opcao: 'Mercadoria: compro pronto para revender' }, 'M5.P13': { estado: 'opcao', opcao: 'Não' }, 'M5.P15': { estado: 'opcao', opcao: 'Não' }, 'M5.P28': { estado: 'opcao', opcao: 'Sim' }, 'M5.P29': { estado: 'valor', valor: '1700' }, 'M5.P36': { estado: 'valor', valor: '9,50' }, 'M5.P37': { estado: 'valor', valor: '50' } };
  /* compra 203 ÷ 150 = 1,3533… (aparece R$ 1,35): a conta usa R$ 1,35, como mostrado */
  const c = Motor.calcular(M, Object.assign({ 'M5.P11': { estado: 'valor', valor: '203' }, 'M5.P12': { estado: 'valor', valor: '150' } }, base));
  ok(c.custoUnidade === 1.35 && c.custoTaxa === 1.35 && c.mc === 8.15, `revisão: preço 9,50 − custo/taxas 1,35 = 8,15 por venda (${c.custoTaxa}, ${c.mc})`);
  ok(c.fat === 475 && c.custoVendas === 67.5 && c.resultado === -1292.5, `revisão: 50 vendas = R$ 475,00; 1.700 − 50 × 8,15 = R$ 1.292,50 que faltam, não 1.292,67 (${c.resultado})`);
  ok(c.pe === 209 && c.pe === Math.ceil(1700 / 8.15), `revisão: 1.700 ÷ 8,15 = 208,6 -> 209 vendas (${c.pe})`);
  ok(c.mensal === 1700 && c.perdas === 0, 'motor (usado pelo Módulo 6): mensal = gastos do mês, perdas, custoTaxa = custo + taxas por venda');
  /* custo 1,00 + taxa 3,7% de 9,50 = 0,3515 (aparece R$ 0,35) -> 1,35 por venda */
  const c2 = Motor.calcular(M, Object.assign({ 'M5.P11': { estado: 'valor', valor: '100' }, 'M5.P12': { estado: 'valor', valor: '100' }, 'M5.PG': { estado: 'valor', valor: ['Cartão de crédito'] }, 'M5.P24': { estado: 'opcao', opcao: 'Sim' }, 'M5.P25': { estado: 'valor', valor: [{ forma: 'Cartão de crédito', taxa: '3,7', prazo: '30' }] } }, base));
  ok(c2.taxa === 0.35 && c2.custoTaxa === 1.35 && c2.mc === 8.15 && c2.resultado === -1292.5 && c2.pe === 209, `revisão com taxa: 3,7% de 9,50 = 0,35; mesmo resultado (${c2.taxa}, ${c2.resultado}, ${c2.pe})`);
  const sim = Motor.simular(M, Object.assign({ 'M5.P11': { estado: 'valor', valor: '203' }, 'M5.P12': { estado: 'valor', valor: '150' } }, base), '9,50', '50');
  ok(sim.sobra === 8.15 && sim.resultado === -1292.5 && sim.pe === 209 && sim.fat === 475, 'simulação usa as mesmas contas (8,15; −1.292,50; 209)');
  ok(Motor.vendasParaCobrir(1700, 8.5) === 200 && Motor.vendasParaCobrir(170, 0.85) === 200, 'divisão exata não sobe uma venda a mais (1.700 ÷ 8,50 = 200)');
  const pp = Motor.precoPossivel(M, Object.assign({ 'M5.P11': { estado: 'valor', valor: '203' }, 'M5.P12': { estado: 'valor', valor: '150' } }, base), '50');
  ok(pp.custo === 1.35 && pp.acrescimo === 0.68 && pp.preco === 2.03, 'preço possível: 1,35 + 50% (0,68) = 2,03');
}
/* ===== mão de obra e aluguel: com e sem, o que entrou na conta e o ponto de equilíbrio (conta à mão) ===== */
{
  const B = { 'M5.P01': { estado: 'opcao', opcao: 'Mercadoria: compro pronto para revender' }, 'M5.P11': { estado: 'valor', valor: '200' }, 'M5.P12': { estado: 'valor', valor: '10' }, 'M5.P13': { estado: 'opcao', opcao: 'Não' }, 'M5.P15': { estado: 'opcao', opcao: 'Não' }, 'M5.P36': { estado: 'valor', valor: '30' }, 'M5.P37': { estado: 'valor', valor: '100' } };
  const com = (o) => Motor.calcular(M, Object.assign({}, B, o));
  const ALU = { 'M5.P28': { estado: 'opcao', opcao: 'Sim' }, 'M5.P29': { estado: 'valor', valor: '500' } }, SEM_ALU = { 'M5.P28': { estado: 'opcao', opcao: 'Não' } };
  const PRO = { 'M5.P34': { estado: 'opcao', opcao: 'Sim' }, 'M5.P35': { estado: 'valor', valor: '1000' } }, SEM_PRO = { 'M5.P34': { estado: 'opcao', opcao: 'Não' } };
  const flag = (c, k) => Motor.componentes(c, Object.assign({}, B)).find((x) => x.chave === k);
  const cc = (o) => { const c = com(o); return { c, L: Motor.componentes(c, Object.assign({}, B, o)) }; };
  const st = (r, k) => r.L.find((x) => x.chave === k).considerado;
  // sobra 30 − 20 = 10 por venda
  let r = cc(Object.assign({}, ALU, PRO));
  ok(r.c.mensal === 1500 && r.c.pe === 150 && st(r, 'aluguel') && st(r, 'mao_de_obra'), `aluguel 500 + pagamento 1.000 = 1.500 ÷ 10 = 150 vendas, os dois ✓ (${r.c.pe})`);
  r = cc(Object.assign({}, ALU, SEM_PRO));
  ok(r.c.mensal === 500 && r.c.pe === 50 && st(r, 'aluguel') && !st(r, 'mao_de_obra') && r.L.find((x) => x.chave === 'mao_de_obra').porque === 'você respondeu que não separa dinheiro para você', `sem pagamento: 500 ÷ 10 = 50 vendas, mão de obra ⚠ (${r.c.pe})`);
  r = cc(Object.assign({}, SEM_ALU, PRO));
  ok(r.c.mensal === 1000 && r.c.pe === 100 && !st(r, 'aluguel') && st(r, 'mao_de_obra'), `sem aluguel: 1.000 ÷ 10 = 100 vendas, aluguel ⚠ (${r.c.pe})`);
  /* preço mínimo muda com o pagamento: (20 + 1.500 ÷ 100) = 35,00 com; (20 + 500 ÷ 100) = 25,00 sem */
  const pm = (o) => Motor.analisarPreco(M, Object.assign({}, B, o), null, null).precoMinimo;
  ok(pm(Object.assign({}, ALU, PRO)) === 35 && pm(Object.assign({}, ALU, SEM_PRO)) === 25, `preço mínimo com pagamento R$ 35,00, sem R$ 25,00 (${pm(Object.assign({}, ALU, PRO))}, ${pm(Object.assign({}, ALU, SEM_PRO))})`);
  /* valor da hora: 1.000 ÷ 60 h ("De 1 a 3 horas por dia" no Módulo 1) = 16,67; serviço de 1h30 = 25,00 */
  const sv = Motor.calcular(M, { 'M5.P01': { estado: 'opcao', opcao: 'Serviço: meu cliente paga pelo trabalho que realizo' }, 'M5.P18': { estado: 'opcao', opcao: 'Não' }, 'M5.P23': { estado: 'valor', valor: { h: '1', m: '30' } }, ...PRO }, null, { horasM1: 'De 1 a 3 horas por dia' });
  ok(sv.valorHora === 16.67 && sv.maoDeObraUnidade === 25.01 && sv.horasMes === 60, `mão de obra do serviço: 1.000 ÷ 60 h = 16,67/h × 1h30 = 25,01 (${sv.valorHora}, ${sv.maoDeObraUnidade})`);
  ok(Motor.precisaHoras(M, PRO, 'Mais de 3 horas por dia') && !Motor.precisaHoras(M, PRO, 'Até 1 hora por dia') && !Motor.precisaHoras(M, SEM_PRO, undefined), 'horas no mês: só pergunta quando há pagamento e o Módulo 1 não dá um número');
}
/* sazonalidade: custo 20, preço 30, 100 vendas, gastos 500 -> ponto 50; forte +50% = 150; fraco −30% = 70 (acima de 50) */
{
  const R = { 'M5.P01': { estado: 'opcao', opcao: 'Mercadoria: compro pronto para revender' }, 'M5.P11': { estado: 'valor', valor: '200' }, 'M5.P12': { estado: 'valor', valor: '10' }, 'M5.P13': { estado: 'opcao', opcao: 'Não' }, 'M5.P15': { estado: 'opcao', opcao: 'Não' }, 'M5.P28': { estado: 'opcao', opcao: 'Sim' }, 'M5.P29': { estado: 'valor', valor: '500' }, 'M5.P36': { estado: 'valor', valor: '30' }, 'M5.P37': { estado: 'valor', valor: '100' },
    'M5.SZ': { estado: 'opcao', opcao: Motor.SZ_SIM, fortes: [12], fracos: [2], maisPct: 50, menosPct: 30 } };
  const z = Motor.sazonal(Motor.calcular(M, R), R);
  ok(z.normal.resultado === 500 && z.forte.qtd === 150 && z.forte.fat === 4500 && z.forte.resultado === 1000 && z.fraco.qtd === 70 && z.fraco.resultado === 200 && !z.fracoAbaixo && z.pe === 50, 'sazonal: normal 500, forte 150 vendas = R$ 1.000, fraco 70 = R$ 200 (acima das 50) ' + JSON.stringify(z));
  ok(Motor.validarSazonal({ estado: 'opcao', opcao: Motor.SZ_SIM, fortes: [3], fracos: [3], maisPct: 10, menosPct: 10 }) !== null && Motor.validarSazonal({ estado: 'opcao', opcao: Motor.SZ_SIM, fortes: [3], fracos: [], maisPct: 301, menosPct: 0 }) !== null && Motor.validarSazonal({ estado: 'opcao', opcao: Motor.SZ_NAO }) === null, 'sazonal: mês nos dois, % fora de 0–300 bloqueiam; "Não" passa');
  ok(Motor.sazonal(Motor.calcular(M, Object.assign({}, R, { 'M5.SZ': { estado: 'opcao', opcao: Motor.SZ_NAO } })), Object.assign({}, R, { 'M5.SZ': { estado: 'opcao', opcao: Motor.SZ_NAO } })) === null, 'sazonal "Não": sem tabela');
}
/* reserva (5% do faturamento) e gasto novo: 30 × 100 = 3.000 -> 150; gastos 500 + 150 = 650 ÷ 10 = 65 vendas (hoje 50) */
{
  const R = { 'M5.P01': { estado: 'opcao', opcao: 'Mercadoria: compro pronto para revender' }, 'M5.P11': { estado: 'valor', valor: '200' }, 'M5.P12': { estado: 'valor', valor: '10' }, 'M5.P13': { estado: 'opcao', opcao: 'Não' }, 'M5.P15': { estado: 'opcao', opcao: 'Não' }, 'M5.P36': { estado: 'valor', valor: '30' }, 'M5.P37': { estado: 'valor', valor: '100' }, 'M5.P28': { estado: 'opcao', opcao: 'Sim' }, 'M5.P29': { estado: 'valor', valor: '500' } };
  const c = Motor.calcular(null, R), r = Motor.reserva(c);
  ok(Motor.RESERVA_PCT === 5 && r.valor === 150 && r.mensalCom === 650 && r.peCom === 65 && c.pe === 50, 'reserva 5%: R$ 150,00; ponto de equilíbrio 50 -> 65 ' + JSON.stringify(r));
  const g = Motor.peComGasto(c, '400');
  ok(g.mensal === 900 && g.pe === 90 && Motor.peComGasto(c, 'abc') === null, 'se pagar aluguel de R$ 400: 900 ÷ 10 = 90 vendas');
}
/* entrega no motor (o Módulo 6 chama Motor5.calcular(null, R)): custoTaxa = custo + taxas + entrega */
{
  const R = { 'M5.P01': { estado: 'opcao', opcao: 'Mercadoria: compro pronto para revender' }, 'M5.P11': { estado: 'valor', valor: '200' }, 'M5.P12': { estado: 'valor', valor: '10' }, 'M5.P13': { estado: 'opcao', opcao: 'Não' }, 'M5.P15': { estado: 'opcao', opcao: 'Não' }, 'M5.P36': { estado: 'valor', valor: '30' }, 'M5.P37': { estado: 'valor', valor: '100' }, 'M5.P28': { estado: 'opcao', opcao: 'Sim' }, 'M5.P29': { estado: 'valor', valor: '500' } };
  const e = (o) => Motor.calcular(null, Object.assign({}, R, { 'M5.ENT': Object.assign({ estado: 'opcao', opcao: Motor.ENT_PRECO, custo: 8, tipoCusto: 'reais', aCada10: 6, cobra: null }, o) }));
  let c = e({});
  ok(c.entrega === 4.8 && c.custoTaxa === 24.8 && c.mc === 5.2 && c.pe === 97, `entrega R$ 8,00 × 6/10 = 4,80; custo por venda 24,80; sobra 5,20; 97 vendas (${c.entrega}, ${c.custoTaxa}, ${c.pe})`);
  c = e({ custo: 20, tipoCusto: 'pct' });
  ok(c.entrega === 3.6 && c.mc === 6.4, `entrega 20% do pedido × 6/10 de R$ 30 = 3,60 (${c.entrega})`);
  c = e({ opcao: Motor.ENT_COBRA, custo: null, tipoCusto: null, aCada10: null, cobra: 5 });
  ok(c.entrega === 0 && c.mc === 10, 'cliente paga a entrega à parte: não é custo');
  ok(Motor.analisarPreco(M, Object.assign({}, R, { 'M5.ENT': { estado: 'opcao', opcao: Motor.ENT_PRECO, custo: 8, tipoCusto: 'reais', aCada10: 6, cobra: null } }), null, null).precoMinimo === 29.8, 'preço mínimo com entrega: 20 + 4,80 + 500 ÷ 100 = 29,80');
}
/* conta do motor contra a conta à mão (unidade) */
ok(Motor.classificar(19.9) === 'baixo' && Motor.classificar(20) === null && Motor.classificar(100) === null && Motor.classificar(100.1) === 'alto', 'faixas 20/100 no classificar');

/* ---------- servidor ---------- */
const server = http.createServer(async (req, res) => {
  try {
    const file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
    if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
    const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf' };
    res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
    res.end(await fsp.readFile(file));
  } catch { res.writeHead(404).end(); }
});

(async () => {
  let browser;
  try {
    await new Promise((r) => server.listen(0, '127.0.0.1', r));
    const URL0 = `http://127.0.0.1:${server.address().port}/lg2/turma-a/m05/index.html`;
    browser = await playwright.chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
    page.setDefaultTimeout(5000);
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('dialog', (d) => d.accept());
    if (SHOTS) await fsp.mkdir(SHOTS, { recursive: true });
    const shot = async (n) => { if (!SHOTS) return; await page.waitForTimeout(400); await page.screenshot({ path: path.join(SHOTS, n) }); };

    const state = () => page.evaluate((k) => JSON.parse(localStorage.getItem(k)), KEY);
    const atual = async () => ((await state()) || { hist: [] }).hist.at(-1);
    const clicar = (sel, txt) => page.evaluate(([sel, txt]) => {
      const n = (s) => String(s || '').replace(/\s+/g, ' ').trim();
      const el = [...document.querySelectorAll(sel)].find((e) => n(e.textContent) === txt && !e.hidden && e.offsetParent !== null);
      if (el) el.click();
      return !!el;
    }, [sel, txt]);
    const texto = async (sel) => norm(await page.evaluate((s) => [...document.querySelectorAll(s)].map((e) => e.textContent).join(' '), sel));
    const erroVisivel = () => page.evaluate(() => { const e = document.getElementById('erro'); return !!e && !e.hidden; });
    const seguir = async () => {
      ok(await clicar('#acoes button', 'Seguir') || await clicar('#acoes button', 'Ver o resultado'), `botão Seguir após ${await atual()}`);
    };
    /* versão leve: palavras visíveis da tela da pergunta (antes de tocar em algo) e "Ver dica" fechada */
    const medidas = {};
    const medir = async () => {
      const m = await page.evaluate(() => {
        const painel = document.getElementById('painel'), dica = document.getElementById('dica');
        if (!document.getElementById('ok') || document.querySelector('#retorno .retorno') || (painel && !painel.hidden) || !document.getElementById('erro').hidden) return null;
        if (dica && dica.open) return null;
        if (['sz-meses', 'ent-preco', 'ent-cobra'].some((id) => { const e = document.getElementById(id); return e && !e.hidden; })) return null;   // campos abertos depois de tocar numa opção   // meses abertos depois de tocar em "Sim"

        const palavras = (t) => t.split(/\s+/).filter((w) => /[A-Za-zÀ-ÿ0-9]/.test(w)).length;
        return { n: palavras(document.querySelector('#tela').innerText) - [...document.querySelectorAll('.p-linha-integrada, .p-fontes summary')].reduce((a, e) => a + palavras(e.innerText), 0), dica: !!dica };
      });
      if (!m) return;
      const c = await atual();
      medidas[c] = Math.max(medidas[c] || 0, m.n);
    };
    const continuar = async () => { await medir(); ok(await clicar('#ok', 'Continuar'), `Continuar em ${await atual()}`); };
    /* "Não sei": abre "Como descobrir" com os 2 passos da pergunta e o pedido pronto (Copiar); não grava nada */
    const naoSeiAjuda = async (onde) => {
      const c = await atual();
      const q = M.porCodigo[c];
      const antes = JSON.stringify(await state());
      ok(await page.locator('#painel').isHidden(), `${onde}: ajuda fechada no início`);
      await page.click('#naosei');
      ok(await page.locator('#painel .como-descobrir').isVisible(), `${onde}: "Como descobrir" aparece`);
      const passos = await page.$$eval('#painel .como-descobrir li', (xs) => xs.map((x) => x.textContent.trim()));
      ok(passos.length === 2 && passos.every((x) => x.length > 20) && norm(passos.join(' ')) === norm(q.comoDescobrir.join(' ')), `${onde}: 2 passos não vazios (${passos.length})`);
      if (q.promptIA) {
        ok(norm(await page.textContent('#painel .prompt')) === norm(q.promptIA), `${onde}: pedido para a IA`);
        ok(await page.locator('#painel [data-copiar]').isVisible() && norm(await page.textContent('#painel .pedir-ia')).includes('Copie, cole numa IA de sua preferência e troque o que está entre colchetes.'), `${onde}: botão Copiar e nota sem marca de IA`);
      } else ok(await page.locator('#painel [data-copiar]').count() === 0, `${onde}: sem pedido, sem Copiar`);
      ok(JSON.stringify(await state()) === antes, `${onde}: tocar em "Não sei" não grava resposta`);
      if (!(await page.evaluate(() => document.querySelector('#ent input, #ent .opcao.sel') && [...document.querySelectorAll('#ent input')].some((i) => i.value.trim()))) && !(await page.locator('#ent .opcao.sel').count())) {
        await clicar('#ok', 'Continuar');
        ok(await erroVisivel() && (await texto('#erro')) === Motor.msgFalta(q, true) && await atual() === c && JSON.stringify(await state()) === antes, `${onde}: "Não sei" + Continuar vazio não avança e pede a resposta (${await texto('#erro')})`);
        await page.evaluate(() => { document.getElementById('erro').hidden = true; });
      }
      return passos;
    };
    const escolher = async (rot) => {
      const c = await atual();
      ok(await clicar('#ent .opcao', rot) || await clicar('#ent .opcao b', rot), `${c}: opção ${rot}`);
      await continuar();
      ok(!(await erroVisivel()), `${c}: resposta ${rot} aceita`);
      await seguir();
    };
    const alt = async (rot) => {
      const c = await atual();
      ok(await clicar('.btn-alt', rot), `${c}: botão ${rot}`);
      await seguir();
    };
    const preencher = async (vals, sels = [], seg = true) => {
      const c = await atual();
      const ins = await page.locator('#ent input').all();
      for (let i = 0; i < vals.length; i++) await ins[i].fill(String(vals[i]));
      const ss = await page.locator('#ent select').all();
      for (let i = 0; i < sels.length; i++) await ss[i].selectOption({ label: sels[i] });
      await continuar();
      const e = await erroVisivel();
      ok(!e, `${c}: valores ${vals.join('|')} aceitos` + (e ? ' — erro: ' + await texto('#erro') : ''));
      if (seg) await seguir();
    };
    /* lote 3 (Nayara): "‹ Voltar" no topo do cartão, à esquerda, acima do texto; nenhum Voltar embaixo */
    const voltarNoTopo = async (onde) => {
      const r = await page.evaluate(() => {
        const v = document.querySelector('#v'), alvo = document.querySelector('.cartao-q h2.q') || document.querySelector('.corpo > :not(#v)');
        if (!v || !alvo) return null;
        const bv = v.getBoundingClientRect(), ba = alvo.getBoundingClientRect();
        return { n: document.querySelectorAll('#v, .acoes-voltar, .btn.voltar').length, acima: bv.bottom <= ba.top + 1, esq: bv.left < 60, txt: v.textContent.replace(/\s+/g, ' ').trim() };
      });
      ok(r && r.n === 1 && r.acima && r.esq && r.txt === '‹ Voltar', `${onde}: um só "‹ Voltar", no topo à esquerda ` + JSON.stringify(r));
      ok(await page.getByRole('button', { name: 'Voltar', exact: true }).count() === 1, `${onde}: nome acessível "Voltar"`);
    };
    const semNaN = async (onde) => {
      const t = await texto('#tela');
      ok(!/NaN|undefined|Infinity|null/.test(t), `${onde}: sem NaN/undefined/null na tela`);
    };
    /* pergunta de gasto fixo: sem "Não sei" como resposta, botão de ajuda abre o conceito */
    const checarFixo = async (testarBloqueio) => {
      const c = await atual();
      const q = M.porCodigo[c];
      ok(FIXOS.includes(c), `${c} deveria ser gasto fixo`);
      if (!q.botaoNaoSei) {
        ok(await page.locator('#naosei').count() === 0, `${c}: sem botão "Não sei" (pergunta sobre a própria pessoa)`);
        if (testarBloqueio) {
          await continuar();
          ok(await erroVisivel() && (await texto('#erro')) === Motor.msgFalta(q, false) && await atual() === c, `${c}: Continuar sem resposta pede a resposta (${await texto('#erro')})`);
        }
        return '';
      }
      const opNaoSei = await page.evaluate(() => [...document.querySelectorAll('#ent .opcao, .btn-alt')].filter((b) => /n[ãa]o sei/i.test(b.textContent)).length);
      ok(opNaoSei === 0, `${c}: "Não sei" não aparece como opção de resposta`);
      ok(await page.locator('#naosei').count() === 1, `${c}: botão de ajuda "Não sei"`);
      await naoSeiAjuda(c);
      ok(await page.locator('#painel').isVisible(), `${c}: painel abre`);
      const painel = await texto('#painel');
      const bts = (q.fonte.match(/M5\.BT\d{2}/g) || []).map((b) => M.conceito[b]);
      for (const b of bts) {
        ok(painel.includes(norm(b.definicao)) && painel.includes(norm(b.porque)), `${c}: painel traz definição e porquê de ${b.codigo}`);
      }
      ok(await page.locator('#painel details.termos').count() === (bts.length ? 1 : 0) && !(await page.evaluate(() => { const d = document.querySelector('#painel details.termos'); return !!d && d.open; })), `${c}: termos recolhidos em "O que quer dizer"`);
      ok(!/em breve/i.test(painel) && await page.locator('#painel iframe, #painel video').count() === 0, `${c}: sem vídeo/placeholder quando video vazio`);
      if (testarBloqueio) {
        await continuar();
        ok(await erroVisivel(), `${c}: Continuar sem resposta mostra erro`);
        ok((await texto('#erro')) === Motor.msgFalta(q, true), `${c}: erro aponta a ajuda aberta (${await texto('#erro')})`);
        ok(await atual() === c, `${c}: não avança sem resposta`);
        ok(!(await clicar('#acoes button', 'Seguir')), `${c}: sem botão Seguir sem resposta`);
      }
      return painel;
    };
    const fonte16 = async (sel) => {
      const fs_ = await page.evaluate((s) => [...document.querySelectorAll(s)].filter((e) => e.offsetParent !== null).map((e) => parseFloat(getComputedStyle(e).fontSize)), sel);
      ok(fs_.length > 0 && fs_.every((f) => f >= 16), `fonte >= 16px em ${sel} (${fs_.join(',')})`);
    };
    /* receita A: campo em foco + teclado (viewport 390x450): campo e Continuar dentro da janela */
    const teclado = async (onde) => {
      await page.locator('#ent input').first().focus();
      await page.setViewportSize({ width: 390, height: 450 });
      await page.waitForTimeout(500);
      const bi = await page.locator('#ent input').first().boundingBox(), bo = await page.locator('#ok').boundingBox();
      ok(bi && bo && bi.y >= 0 && bi.y + bi.height <= 450 && bo.y >= 0 && bo.y + bo.height <= 450, `${onde}: com o teclado aberto, campo (${bi && Math.round(bi.y)}) e Continuar (${bo && Math.round(bo.y)}) visíveis`);
      await page.setViewportSize({ width: 390, height: 844 });
      await page.waitForTimeout(100);
    };
    const inicio = async (m1, ideia = 'Já vendo sempre') => {
      await page.goto(URL0);
      await page.evaluate((m1) => { localStorage.clear(); if (m1) localStorage.setItem('lg2-turma-a-m01', JSON.stringify(m1)); }, m1 || null);
      await page.reload();
      ok(await clicar('#ir', 'Começar'), 'Começar');
      if (m1 && m1.R['M1.P01']) return;            // estágio herdado do Módulo 1: a tela P00 é pulada (testado à parte)
      ok(await atual() === 'M5.P00', 'primeira tela = pergunta 1 do Módulo 1');
      ok((await texto('h2.q')) === 'Como está a sua ideia hoje?', 'P00: texto da pergunta 1 do Módulo 1');
      ok(await page.locator('#naosei').count() === 0, 'P00: sem "Não sei" (pergunta sobre a própria pessoa)');
      ok(await page.locator('#ent .opcao').count() === 4, 'P00: 4 opções ("Não sei dizer" virou ajuda)');
      await voltarNoTopo('P00');
      if (!(m1 && m1.R['M1.P01'])) await escolher(ideia);
    };
    /* formas de pagamento (múltipla escolha) */
    const formas = async (lista) => {
      if (await atual() === 'M5.ENT') { ok(await page.locator('#naosei').count() === 0 && (await texto('#ent-exemplo')) === Motor.ENT_EXEMPLO, 'ENT: sem "Não sei", exemplo à vista'); await escolher(Motor.ENT_NAO); }
      const c = await atual();
      ok(c === 'M5.PG', `formas de pagamento antes das taxas (em ${c})`);
      ok(await page.locator('#naosei').count() === 0, 'PG: sem "Não sei" (a pessoa sabe como recebe)');
      await continuar();
      ok(await erroVisivel() && await atual() === 'M5.PG', 'PG: não avança sem marcar');
      for (const f of lista) ok(await clicar('#ent .opcao', f), `PG: marca ${f}`);
      await continuar();
      ok(!(await erroVisivel()), 'PG: aceita');
      await seguir();
    };
    /* ajuda "Não sei" de uma pergunta qualquer: abre e traz o texto esperado */
    const ajudaTraz = async (trecho, onde) => {
      ok(await page.locator('#naosei').count() === 1, `${onde}: botão de ajuda`);
      await naoSeiAjuda(onde);
      ok((await texto('#painel')).includes(norm(trecho)), `${onde}: ajuda traz "${trecho.slice(0, 40)}…"`);
      if (await page.locator('#painel [data-copiar]').count()) {
        await page.click('#painel [data-copiar]');
        await page.waitForTimeout(100);
        ok(/^(Copiado!|Toque e segure o texto para copiar)$/.test(norm(await page.textContent('#painel [data-copiar]'))), `${onde}: Copiar responde (${norm(await page.textContent('#painel [data-copiar]'))})`);
      }
      await page.click('#naosei');
    };

    /* ===== 0. versão do estado: estado antigo (sem versão / versão 2) é MIGRADO, não descartado (16/11, J) ===== */
    await page.goto(URL0);
    await page.evaluate((k) => localStorage.setItem(k, JSON.stringify({ R: { 'M5.P24': { estado: 'naosei' }, 'M5.P02': { estado: 'valor', valor: 'Bolo' } }, hist: ['M5.P01', 'M5.P02', 'M5.P24'] })), KEY);
    await page.reload();
    {
      const st = await state();
      ok(st.versao === 4 && st.R['M5.P02'].valor === 'Bolo' && !st.R['M5.P24'] && await page.locator('#ir').textContent() === 'Continuar de onde parei', 'estado sem versão: respostas mantidas, só o "Não sei" sai ' + JSON.stringify(st));
    }
    await page.evaluate((k) => localStorage.setItem(k, JSON.stringify({ versao: 2, R: { 'M5.P01': { estado: 'opcao', opcao: 'Produto' } }, hist: ['M5.P01', 'M5.P02'] })), KEY);
    await page.reload();
    ok((await state()).R['M5.P01'].opcao === 'Produto' && (await state()).versao === 4, 'estado da versão 2: resposta mantida');
    /* 16/11: estado da versão 3 é migrado: "Não sei"/"Ainda não defini" viram sem resposta; o resto fica */
    {
      const v3 = { versao: 3, R: { 'M5.P00': { estado: 'opcao', opcao: 'Já vendo sempre' }, 'M5.P01': { estado: 'opcao', opcao: 'Mercadoria: compro pronto para revender' }, 'M5.P10': { estado: 'valor', valor: 'Boné' }, 'M5.P11': { estado: 'valor', valor: '200' }, 'M5.P12': { estado: 'valor', valor: '10' }, 'M5.P36': { estado: 'opcao', opcao: 'Ainda não defini' } }, hist: ['M5.P00', 'M5.P01', 'M5.P10', 'M5.P11', 'M5.P12', 'M5.P36', 'PRECO', 'RESULTADO'], lucro: '50' };
      await page.evaluate(([k, s]) => localStorage.setItem(k, JSON.stringify(s)), [KEY, v3]);
      await page.reload();
      const st = await state();
      ok(st.versao === 4 && !st.R['M5.P36'] && st.R['M5.P11'].valor === '200' && st.R['M5.P10'].valor === 'Boné' && JSON.stringify(st.hist.slice(-1)) === '["M5.P36"]', 'versão 3 migrada: P36 "Ainda não defini" sem resposta, outras respostas mantidas ' + JSON.stringify(st));
      ok(await clicar('#ir', 'Continuar de onde parei') && await atual() === 'M5.P36' && await page.locator('#ent input').inputValue() === '', 'continua na pergunta do preço, sem resposta');
      await page.evaluate((k) => localStorage.removeItem(k), KEY);
      await page.reload();
    }
    /* versão leve: capa com título, uma frase, tempo e Começar; o resto em "Como funciona" (fechado) */
    {
      const capa = await page.evaluate(() => ({ n: (() => { const n = (t) => t.split(/\s+/).filter((w) => /[A-Za-zÀ-ÿ0-9]/.test(w)).length; return n(document.querySelector('#tela').innerText) - [...document.querySelectorAll('.p-linha-integrada, .p-fontes summary')].reduce((a, e) => a + n(e.innerText), 0); })(), aberto: document.getElementById('como-funciona').open, frase: document.querySelector('.heroi-txt p').textContent, tempo: document.querySelector('.tempo').textContent }));
      ok(capa.n <= 60 && !capa.aberto && capa.frase === D.leve.capa.frase && capa.tempo === 'Este módulo leva uns 20 minutos', 'capa leve: frase, tempo e "Como funciona" fechado ' + JSON.stringify(capa));
      ok((await texto('#como-funciona')).includes(norm(D.mapa.ter_em_maos)) && await page.locator('#como-funciona #limites').count() === 1, 'capa: o que ter em mãos e limites dentro de "Como funciona"');
    }
    console.log('PASS-stage: versão do estado');

    /* ===== 1. Produto: todos os gastos fixos "Sim", preço ainda não definido (a) ===== */
    await inicio();
    await escolher('Produto');
    await teclado('P02');
    await preencher(['Bolo de pote']);                               // P02
    ok((await texto('#nota-consumo')).includes(norm(Motor.NOTA_CONSUMO.exemploProduto)) && !(await texto('#nota-consumo')).includes('cabeleireiro') && (await texto('#nota-consumo')).includes('formas, panelas, máquinas e tesouras'), 'P03: explica consumo x equipamento com exemplo de produto (bolo), não de cabeleireiro');
    ok((await texto('#nota-luz')).includes(Motor.NOTA_LUZ_AGUA), 'P03: aviso para não colocar conta de luz nem de água');
    ok(!(await page.evaluate(() => document.getElementById('dica').open)), 'P03: "Ver dica" fechada por padrão (orientações dentro dela)');
    await page.click('#dica summary');
    await fonte16('.nota-orienta p');
    await shot('m05_materiais_P03.png');
    await page.click('#dica summary');
    await ajudaTraz(M.porCodigo['M5.P03'].comoDescobrir[0], 'P03');
    await preencher(['Farinha', 'Ovo']);                            // P03
    {
      await teclado('P04');
      const ins = await page.locator('#ent input').all();
      await ins[0].fill('dez'); await ins[1].fill('12');
      await continuar();
      ok(await erroVisivel() && (await texto('#erro')) === Motor.MSG_NUMERO && await atual() === 'M5.P04' && !(await state()).R['M5.P04'], 'P04: texto no campo de R$ -> "Digite só números", não grava');
      ok(await page.locator('#ent input').first().getAttribute('inputmode') === 'decimal', 'P04: teclado numérico (inputmode decimal)');
    }
    await preencher(['10', '12']);                                  // P04 preço pago
    await preencher(['1', '12'], ['kg', 'unidade']);                // P05 quanto vem
    /* P06: 2 kg usados de um pacote de 1 kg -> aviso para conferir (não trava de vez) */
    {
      const ins = await page.locator('#ent input').all();
      await ins[0].fill('2'); await ins[1].fill('6');
      const ss = await page.locator('#ent select').all();
      await ss[0].selectOption({ label: 'kg' }); await ss[1].selectOption({ label: 'unidade' });
      await continuar();
      ok(await erroVisivel() && (await texto('#erro')).includes(Motor.MSG_QTD_ALTA), 'P06: aviso de quantidade maior que a embalagem');
      ok(await page.locator('#erro.aviso-qtd').count() === 1 && await atual() === 'M5.P06', 'P06: aviso não avança no 1º toque');
      await shot('m05_quantidade_alta_P06.png');
    }
    await preencher(['500', '6'], ['g', 'unidade']);                // P06 quanto usa (corrigido: sem aviso)
    await preencher(['10']);                                        // P07 quantas unidades
    ok(await atual() === 'M5.PT', 'Produto: depois do rendimento, o tempo de uma unidade (mão de obra)');
    await ajudaTraz(M.porCodigo['M5.PT'].comoDescobrir[1], 'PT');
    await preencher(['0', '30']);                                   // PT: 30 min por unidade
    ok(await page.locator('#ent .opcao').count() === 2, 'P08: só Sim/Não ("Não sei" virou ajuda)');
    ok(await page.locator('#naosei').count() === 0, 'P08: sem "Não sei" (a pessoa sabe se usa embalagem)');
    await escolher('Sim');                                          // P08 embalagem
    await preencher(['20', '10']);                                  // P09 pacote
    await formas(['Pix', 'Cartão de crédito']);
    // custo à mão: farinha 10*(0,5kg/1kg)/10 = 0,50; ovo 12*(6/12)/10 = 0,60; embalagem 20/10 = 2,00 -> 3,10
    const custoProd = 0.5 + 0.6 + 2;
    ok(await atual() === 'M5.P24', 'Produto chega à P24');
    await checarFixo(true);
    await shot('02-naosei-painel-P24.png');
    await escolher('Sim');                                          // P24
    await checarFixo(true);                                         // P25 (valor): bloqueia vazio
    ok(await page.locator('#ent .forma').count() === 2, 'P25: uma taxa por forma marcada (Pix e cartão de crédito)');
    {
      const ins = await page.locator('#ent input').all();       // Pix: taxa, prazo, parte; Crédito: taxa, prazo, parte
      for (const [i, v] of [[0, '0'], [1, ''], [2, '50'], [3, '5'], [4, '30'], [5, '40']]) await ins[i].fill(v);
      await continuar();
      ok(await erroVisivel() && (await texto('#erro')) === Motor.MSG_SOMA_PARTES, 'P25: partes 50 + 40 não passam');
      await shot('m05_taxas_por_forma_P25.png');
    }
    await preencher(['0', '', '60', '5', '30', '40']);              // taxa média = 0x60% + 5x40% = 2%
    await checarFixo(false); await escolher('Sim');                 // P26
    await checarFixo(true);                                         // P27
    await page.click('#dica summary');
    ok((await texto('#dica-alerta')) === 'É uma estimativa e pode ser atualizada depois.', 'G: aviso geral da P27 está na dica, antes de responder');
    await page.click('#dica summary');
    await page.locator('#ent input').fill('100'); await continuar();
    ok(await page.locator('#retorno .b-alerta').count() === 0, 'G: P27 respondida sem caixa de "Atenção"');
    await seguir();
    await checarFixo(false);
    await page.click('#dica summary');
    ok((await texto('#dica-sem-gasto')) === Motor.DICA_SEM_GASTO['M5.P28'], 'P28: dica "fique de olho e reserve" na dica, antes de responder');
    await page.click('#dica summary');
    await escolher('Sim');                                          // P28
    await checarFixo(false);                                        // P29 aluguel
    ok((await texto('.obs')).includes('Se o seu negócio funciona dentro da sua casa, não coloque o valor total do aluguel. Coloque só a parte que o negócio usa.'), 'P29: observação do aluguel');
    ok(!(await page.evaluate(() => document.getElementById('dica').open)), 'P29: "Ver dica" fechada por padrão');
    await page.click('#dica summary');
    await fonte16('.obs'); await fonte16('.btn-ajuda'); await fonte16('#painel p');
    await page.click('#dica summary');
    await page.click('#naosei');                                    // fecha o painel para o print
    await teclado('P29');
    await shot('03-aluguel-observacao-P29.png');
    await preencher(['500']);
    await checarFixo(false); await escolher('Sim');                 // P30
    await checarFixo(false);                                        // P31
    ok((await texto('.obs')).includes('Se o negócio funciona na sua casa, coloque só a parte da conta que o negócio gasta, não a conta inteira.'), 'P31: observação de água e luz');
    await preencher(['150']);
    await checarFixo(false); await escolher('Sim');                 // P32
    await checarFixo(true);                                         // P33 lista vazia bloqueia
    await page.click('#naosei');
    await page.locator('.lista .nome').first().fill('Internet fibra do negócio');
    await page.locator('.lista .valor').first().fill('100');
    await clicar('.btn-mais', '+ adicionar conta');
    await page.locator('.lista .nome').nth(1).fill('Contador');
    await page.locator('.lista .valor').nth(1).fill('200');
    const larg = await page.evaluate(() => [...document.querySelectorAll('.lista .campo.nome')].map((e) => e.getBoundingClientRect().width));
    ok(larg.every((w) => w >= 120), `P33: campo do nome com largura >= 120px (${larg.map(Math.round).join(',')})`);
    ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'P33: sem rolagem horizontal');
    await shot('01-P33-gastos-com-nomes.png');
    await continuar(); ok(!(await erroVisivel()), 'P33 aceita'); await seguir();
    await checarFixo(false); await escolher('Sim');                 // P34
    await checarFixo(true); await preencher(['1000']);              // P35
    ok(await atual() === 'M5.PH' && await page.locator('#naosei').count() === 0, 'sem horas do Módulo 1: pergunta as horas no mês (sem "Não sei")');
    await preencher(['100']);                                       // PH: 100 horas por mês
    ok(await atual() === 'M5.P37', 'depois da P35 vem a P37 (quantidade), não o preço');
    ok(!(await state()).hist.includes('M5.P36'), 'P36 ainda não visitada antes da P37');
    await preencher(['100']);                                       // P37
    /* sazonalidade (pedido do dono, 16/11): logo depois da quantidade, sem "Não sei" */
    ok(await atual() === 'M5.SZ' && (await texto('h2.q')) === 'Suas vendas mudam conforme a época do ano?' && await page.locator('#naosei').count() === 0, 'SZ logo depois da P37, sem "Não sei"');
    ok((await texto('#sz-exemplo')) === Motor.SZ_EXEMPLO && JSON.stringify(await page.$$eval('#ent .opcao', (xs) => xs.map((x) => x.textContent.trim()))) === JSON.stringify([Motor.SZ_NAO, Motor.SZ_SIM]), 'SZ: exemplo à vista e só as duas opções');
    ok(await clicar('#ent .opcao', Motor.SZ_SIM) && await page.locator('#sz-meses').isVisible(), 'SZ Sim: abre os meses');
    await continuar();
    ok(await erroVisivel() && (await texto('#erro')) === 'Marque pelo menos um mês forte ou fraco.' && await atual() === 'M5.SZ', 'SZ Sim sem meses: não avança');
    await page.click('#sz-fortes [data-forte="3"]'); await page.click('#sz-fortes [data-forte="4"]');
    ok(await page.locator('#sz-fracos [data-fraco="3"]').isDisabled(), 'SZ: mês forte não pode ser fraco');
    await page.click('#sz-fracos [data-fraco="6"]'); await page.click('#sz-fracos [data-fraco="7"]');
    await page.fill('#sz-mais', '50'); await page.fill('#sz-menos', 'trinta');
    await continuar();
    ok(await erroVisivel() && (await texto('#erro')).includes('0 a 100'), 'SZ: porcentagem precisa ser número inteiro');
    await page.fill('#sz-menos', '30');
    await shot('m05_depois_sazonal.png');
    await continuar(); ok(!(await erroVisivel()), 'SZ aceita'); await seguir();
    ok(JSON.stringify((await state()).R['M5.SZ']) === JSON.stringify({ estado: 'opcao', opcao: 'Sim, tem meses mais fortes e mais fracos', fortes: [3, 4], fracos: [6, 7], maisPct: 50, menosPct: 30 }), 'SZ salva no formato do contrato: ' + JSON.stringify((await state()).R['M5.SZ']));
    ok(await atual() === 'M5.P36', 'P36 (preço) vem depois da P37 e da época do ano');
    ok(!(await texto('#tela')).includes('compensar a quantidade pequena de vendas'), 'P36: orientação "lucro maior para quem vende pouco" retirada');
    /* 16/11: "Ainda não defini" virou o "Não sei" (bloqueia); a ajuda traz a conta de um preço possível, sem gravar */
    ok(await page.locator('.btn-alt').count() === 0, 'P36: sem "Ainda não defini" (fundido no "Não sei")');
    {
      const antes = JSON.stringify(await state());
      await naoSeiAjuda('P36');
      ok((await texto('#painel .como-descobrir')).includes('use a conta abaixo') && !(await texto('#painel')).includes('Ainda não defini'), 'P36: ajuda sem citar o botão que saiu');
      ok((await texto('#calc-preco')).includes('Você gasta R$ 3,10 em cada unidade'), 'P36: conta do preço possível mostra o custo de uma unidade');
      await page.fill('#pp-pct', '50');
      ok((await texto('#pp-preco')) === 'R$ 4,65' && (await texto('#como-pp')) === 'Como calculamos: R$ 3,10 (seu gasto) + 50,0% de R$ 3,10 (R$ 1,55) = R$ 4,65.', 'P36: 50% -> R$ 4,65, com "Como calculamos" ao vivo: ' + await texto('#como-pp'));
      await page.fill('#pp-pct', '10');
      ok((await texto('#pp-preco')) === 'R$ 3,41', 'P36: a conta muda enquanto digita (10% -> R$ 3,41)');
      await page.fill('#pp-pct', '50');
      await shot('m05_depois_naosei_preco.png');
      await page.click('#pp-usar');
      ok(await page.inputValue('#ent input') === '4,65' && JSON.stringify(await state()) === antes, '"Usar este preço" só põe 4,65 no campo (padrão brasileiro), não grava');
    }
    await preencher(['4,65']);
    ok(await atual() === 'PRECO', 'P36 com preço -> passo do preço');
    ok((await texto('h2.q')) === 'Quanto você ganha em cada venda', 'passo do preço com o preço informado');
    ok(!(await page.evaluate(() => document.getElementById('poucas-vendas').open)) && (await texto('#poucas-vendas summary')) === 'Por que vender pouco pesa no preço?', 'poucas vendas: título sem número (o número aparece junto da conta)');
    await page.click('#poucas-vendas summary');
    ok((await texto('#poucas-vendas')).includes(Motor.POUCAS_VENDAS) && (await texto('#como-parcela')) === 'Como calculamos: R$ 2.050,00 de gastos do mês ÷ 100 vendas = R$ 20,50 por venda.', 'poucas vendas: parcela 2.050 ÷ 100 = R$ 20,50 com a conta: ' + await texto('#como-parcela'));
    ok((await texto('#margem-x-acrescimo')).includes(Motor.MARGEM_X_ACRESCIMO.exemplo), 'passo do preço: exemplo acréscimo x margem');
    const MSG = Motor.MSG_PRECO;
    let t = await texto('#analise');
    ok(t.includes('50,0%') && !t.includes(MSG.reverso.baixo) && !t.includes(MSG.reverso.alto), 'acréscimo 50,0% sobre o custo, sem aviso');
    /* "Como calculamos" logo abaixo de cada número, sem precisar abrir nada */
    ok((await texto('#como-acrescimo')) === 'Como calculamos: (R$ 4,65 de preço − R$ 3,10 de custo) ÷ R$ 3,10 de custo = 50,0%.', 'como calculamos o acréscimo: ' + await texto('#como-acrescimo'));
    ok((await texto('#como-sobra')) === 'Como calculamos: taxa: 2% de R$ 4,65 = R$ 0,09; R$ 4,65 de preço − R$ 3,10 de custo − R$ 0,09 de taxas = R$ 1,46 que sobram em cada venda; R$ 1,46 ÷ R$ 4,65 = 31,4% do preço.', 'como calculamos a sobra e a margem: ' + await texto('#como-sobra'));
    // preço mínimo: (3,10 + 20,50) ÷ 98% = 24,0816 -> R$ 24,09 (para cima: "pelo menos")
    ok((await texto('#preco-minimo')).includes('R$ 24,09') && (await texto('#como-minimo')) === 'Como calculamos: (R$ 3,10 de custo + R$ 20,50 dos gastos do mês em cada venda) ÷ 98% (o que fica depois de 2% de taxa) = R$ 24,09, arredondado para cima.', 'preço mínimo R$ 24,09 com a conta: ' + await texto('#como-minimo'));
    ok(await page.evaluate(() => { const c = document.querySelector('#como-sobra'); return !!c && c.offsetParent !== null && !c.closest('details'); }), 'contas visíveis na hora (fora de "Ver mais")');
    ok(await page.evaluate(() => { const c = document.querySelector('#como-sobra'), n = document.querySelector('#analise .nota'); return parseFloat(getComputedStyle(c).fontSize) < parseFloat(getComputedStyle(n).fontSize); }), 'como calculamos: fonte menor que a nota (discreta)');
    await shot('m05b_como_calculamos_preco.png');
    await semNaN('passo do preço (a)');
    ok(await clicar('#res', 'Ver o resultado'), 'Ver o resultado');
    ok(await atual() === 'RESULTADO', 'Produto chega ao resultado');
    let tr = await texto('#tela');
    ok(tr.includes('R$ 3,10') && tr.includes('R$ 4,65'), 'resultado Produto: custo R$ 3,10 e preço R$ 4,65');
    // gastos do mês à mão: aluguel 500 + água/luz 150 + outros 300 = 950 fixos; perdas 100; trabalho 1000 -> 2050
    ok(tr.includes('R$ 950,00') && tr.includes('R$ 2.050,00'), 'resultado Produto: gastos do mês 950 / total 2.050');
    // sobra mostrada = 4,65 − 3,10 − 0,09 = 1,46 -> 2.050 ÷ 1,46 = 1.404,11 -> 1405 (para cima)
    ok(/Ponto de equilíbrio\s*1405\b/.test(tr), 'resultado Produto: vendas para cobrir o mês arredondadas para cima (1405)');
    {
      const peMao = Math.ceil(2050 / 1.46);
      const conta = await texto('#pe-conta');
      ok(peMao === 1405 && conta === 'Como calculamos: R$ 2.050,00 de gastos do mês ÷ R$ 1,46 que sobram em cada venda = 1.404,11. Arredondamos para cima, porque não dá para vender só uma parte: 1405 vendas.', 'ponto de equilíbrio: conta com os valores mostrados: ' + conta);
      const custoTxt = await texto('#como-custo');
      ok(custoTxt === 'Como calculamos: Farinha: R$ 10,00 × 500 g usados ÷ 1.000 g comprados ÷ 10 unidades feitas = R$ 0,50; Ovo: R$ 12,00 × 6 unidade(s) usados ÷ 12 unidade(s) comprados ÷ 10 unidades feitas = R$ 0,60; Embalagem: R$ 20,00 ÷ 10 no pacote = R$ 2,00. Somamos o que vai em cada unidade: R$ 0,50 + R$ 0,60 + R$ 2,00 = R$ 3,10.', 'custo por unidade: conta de cada item e a soma: ' + custoTxt);
      if (SHOTS) { await page.evaluate(() => { document.getElementById('contas').open = true; document.querySelector('#como-custo').scrollIntoView({ block: 'start' }); }); await shot('m05b_como_calculamos_resultado.png'); await page.evaluate(() => document.querySelector('#pe-conta').scrollIntoView({ block: 'center' })); await shot('m05b_como_calculamos_equilibrio.png'); }
      ok((await texto('#como-margem')).startsWith('Como calculamos: taxa: 2% de R$ 4,65 = R$ 0,09; R$ 4,65 de preço − R$ 3,10 de custo − R$ 0,09 de taxas = R$ 1,46 que sobram em cada venda'), 'margem: linha "Como calculamos": ' + await texto('#como-margem'));
      ok((await texto('#como-gastos')) === 'Como calculamos: R$ 500,00 (aluguel) + R$ 150,00 (água e luz) + R$ 300,00 (outras contas) + R$ 100,00 (perdas) + R$ 1.000,00 (seu trabalho) = R$ 2.050,00 por mês.', 'gastos do mês: soma com os valores: ' + await texto('#como-gastos'));
      ok((await texto('#como-taxa-media')) === 'Como calculamos: 0% × 60% das vendas + 5% × 40% das vendas = 2%.', 'taxa média: ' + await texto('#como-taxa-media'));
      // mês: 4,65 × 100 = 465,00; 3,19 × 100 = 319,00; 465 − 319 − 2.050 = −1.904,00
      const cr = await texto('#como-resultado');
      ok(cr.includes('R$ 4,65 × 100 vendas = R$ 465,00') && cr.includes('R$ 3,19 de custo e taxas de cada venda × 100 = R$ 319,00') && cr.includes('R$ 465,00 − R$ 319,00 − R$ 2.050,00 de gastos do mês = −R$ 1.904,00'), 'resultado do mês com os valores mostrados: ' + cr);
    }
    ok((await texto('#tab-formas')).includes('Pix (60% das vendas)') && (await texto('#tab-formas')).includes('recebe em 30 dias') && (await texto('#tab-formas')).includes('2%'), 'resultado: taxa e prazo por forma + taxa média 2%');
    ok((await texto('#margem-x-acrescimo')).includes(Motor.MARGEM_X_ACRESCIMO.exemplo), 'resultado: explicação acréscimo x margem');
    ok(await page.locator('#simulacao').count() === 0, 'quem já vende sempre: sem aviso de simulação');
    {
      const ent = await texto('#entendemos');
      const nfr = await page.locator('#entendemos > p:not(.como-calc)').count();
      ok(nfr >= 1 && nfr <= 3, `"O que entendemos até aqui": 1 a 3 parágrafos (${nfr})`);
      ok(await page.evaluate(() => { const e = document.getElementById('entendemos'); return !e.querySelector('ul, ol, li') && e.querySelectorAll('p').length >= 1; }), '"O que entendemos até aqui" em texto corrido (sem <li>, com <p>)');
      ok((await page.evaluate(() => document.querySelector('#entendemos p').textContent)).includes('Você já vende'), '1º parágrafo junta o que analisou e o estágio');
      ok(ent.startsWith('O que entendemos até aqui') && ent.includes('o produto “Bolo de pote”') && ent.includes('Você já vende') && ent.includes('R$ 3,10') && ent.includes('R$ 2.050,00') && ent.includes('1405 unidades por mês'), 'entendemos (Produto): item, estágio, custo, gastos do mês e vendas para cobrir: ' + ent);
      ok((await texto('#como-entendemos')) === 'Como calculamos: R$ 4,65 (preço) − R$ 3,19 (custo e taxas) = R$ 1,46 por venda; R$ 2.050,00 (gastos do mês) ÷ R$ 1,46 = 1.404,11, para cima: 1405 vendas; 100 × R$ 1,46 − R$ 2.050,00 = −R$ 1.904,00.', 'entendemos: linha "Como calculamos" logo abaixo dos números: ' + await texto('#como-entendemos'));
      ok(await page.evaluate(() => { const e = document.getElementById('entendemos'), r = document.querySelector('#numeros .res-num'); return !!e && !!r && (e.compareDocumentPosition(r) & Node.DOCUMENT_POSITION_FOLLOWING) > 0; }), 'entendemos fica acima das contas de custo/preço');
      ok(!/M5\.|M1\.|Módulo \d, pergunta/.test(ent), 'entendemos sem códigos de pergunta');
    }
    ok((await texto('#descontados')).includes('o valor que você separa pelo seu trabalho'), 'resultado: explica o que já foi descontado (inclui a remuneração)');
    /* mão de obra e "O que entrou na conta" (pedido do dono, 16/11) */
    {
      const lis = await page.$$eval('#entrou li', (xs) => xs.map((x) => x.dataset.chave + ':' + x.className));
      ok(JSON.stringify(lis) === JSON.stringify(['materiais:ok', 'embalagem:ok', 'entrega:na', 'taxas:ok', 'perdas:ok', 'aluguel:ok', 'agua_luz:ok', 'outros:ok', 'mao_de_obra:ok']), 'O que entrou na conta (Produto, tudo Sim): tudo ✓ ' + JSON.stringify(lis));
      ok((await texto('#entrou li[data-chave="mao_de_obra"]')) === '✓ Mão de obra (seu pagamento): considerado, R$ 1.000,00 por mês' && (await texto('#entrou li[data-chave="materiais"]')) === '✓ Materiais: considerado, R$ 1,10 por unidade', 'linhas ✓ com valor: ' + await texto('#entrou li[data-chave="materiais"]'));
      // 1.000 ÷ 100 h = 10,00 por hora; 30 min = 5,00 por unidade
      ok((await texto('#mao-de-obra')).includes('R$ 10,00 por hora') && (await texto('#como-mao-de-obra')) === 'Como calculamos: R$ 1.000,00 (seu pagamento) ÷ 100 horas por mês = R$ 10,00 por hora; R$ 10,00 × 30 min = R$ 5,00 por unidade.', 'mão de obra: valor da hora e por unidade com a conta: ' + await texto('#como-mao-de-obra'));
      ok(await page.locator('#alerta-mao-de-obra, #alerta-aluguel').count() === 0, 'com pagamento e aluguel: sem destaque de "não considerado"');
      await page.locator('#entrou').scrollIntoViewIfNeeded(); await shot('m05_depois_entrou_tudo.png');
      /* meses fortes e fracos: normal 100, forte 100 × 1,5 = 150, fraco 100 × 0,7 = 70 (preço 4,65; custo e taxas 3,19; gastos 2.050) */
      const linhas = await page.$$eval('#sazonal tr', (xs) => xs.slice(1).map((x) => [...x.cells].map((c) => c.textContent.trim()).join(' ')));
      ok(JSON.stringify(linhas) === JSON.stringify(['Mês normal 100 vendas R$ 465,00 −R$ 1.904,00', 'Mês forte (Mar, Abr) 150 vendas R$ 697,50 −R$ 1.831,00', 'Mês fraco (Jun, Jul) 70 vendas R$ 325,50 −R$ 1.947,80']), 'sazonal: vendas, faturamento e resultado (à mão) ' + JSON.stringify(linhas));
      ok((await texto('#como-sazonal')) === 'Como calculamos: mês forte: 100 × (1 + 50%) = 150 vendas; R$ 4,65 × 150 = R$ 697,50; R$ 697,50 − R$ 3,19 × 150 (R$ 478,50) − R$ 2.050,00 = −R$ 1.831,00; mês fraco: 100 × (1 − 30%) = 70 vendas; R$ 4,65 × 70 = R$ 325,50; R$ 325,50 − R$ 3,19 × 70 (R$ 223,30) − R$ 2.050,00 = −R$ 1.947,80.', 'sazonal: Como calculamos ' + await texto('#como-sazonal'));
      ok((await texto('#sz-fraco-abaixo')).includes('70 vendas, menos que as 1405') && await page.evaluate(() => getComputedStyle(document.querySelector('#sz-fraco-abaixo')).backgroundColor) === 'rgb(255, 247, 224)', 'sazonal: mês fraco abaixo do ponto de equilíbrio -> aviso (tom de aviso)');
      await page.locator('#sazonal').scrollIntoViewIfNeeded(); await shot('m05_depois_sazonal_resultado.png');
    }
    ok(await page.evaluate(() => { const e = document.getElementById('entendemos'), t = document.getElementById('tarefa'), c = document.getElementById('contas'); return !!t && t.textContent.trim().length > 40 && (e.compareDocumentPosition(t) & Node.DOCUMENT_POSITION_FOLLOWING) > 0 && (t.compareDocumentPosition(c) & Node.DOCUMENT_POSITION_FOLLOWING) > 0 && c.open && document.getElementById('mais-detalhes').open && [...document.querySelectorAll('#tela details')].every((d) => d.open); }), 'resultado: entendemos, depois a tarefa, depois "Ver as contas"; todas as seções abertas por padrão (I)');
    ok((await texto('#tarefa')).includes('1405 vendas por mês') && await page.locator('#lacunas').count() === 0, 'tarefa: com preço informado, sem "o que falta saber": ' + await texto('#tarefa'));
    await semNaN('resultado Produto');
    await shot('06-resultado-produto.png');
    const salvo = await state();
    await page.reload();
    ok(await clicar('#ir', 'Continuar de onde parei'), 'Continuar de onde parei após recarregar');
    ok(await atual() === 'RESULTADO' && (await texto('#tela')).includes('R$ 4,65'), 'resultado persiste após recarregar');
    ok(JSON.stringify(await state()) === JSON.stringify(salvo) && salvo.versao === 4, 'estado salvo (versão 4) persiste');
    console.log('PASS-stage: Produto + preço possível');

    /* ===== 2. Mercadoria: gastos fixos "Não", preço informado (b) ===== */
    await inicio();
    await page.evaluate(() => localStorage.setItem('lg2-turma-a-m03', JSON.stringify({ R: { 'M3.P20': { estado: 'valor', valor: 'de R$ 25 a R$ 40' } } })));
    await escolher('Mercadoria');
    await preencher(['Camiseta']);   // P10
    await preencher(['200']);        // P11 compra
    await preencher(['10']);         // P12 quantidade -> custo 20
    await escolher('Não');           // P13 frete
    await escolher('Não');           // P15 embalagem
    await formas(['Dinheiro']);
    for (const c of ['M5.P24', 'M5.P26', 'M5.P28', 'M5.P30', 'M5.P32', 'M5.P34']) {
      ok(await atual() === c, `Mercadoria/Não: passa pela ${c}`);
      await checarFixo(c === 'M5.P24');
      await escolher('Não');
    }
    ok(await atual() === 'M5.P37', 'P34 Não -> P37');
    await preencher(['50']);
    await escolher('Não, é parecido o ano todo');
    ok(await atual() === 'M5.P36', 'P37 -> P36');
    const precoB = async (v) => {
      if (await atual() === 'PRECO') { await page.click('#v'); }
      ok(await atual() === 'M5.P36', 'volta para a P36');
      if (Number(v.replace(',', '.')) < custoMerc) {
        /* relatório de 05/11 (Arthur): preço menor que o custo -> aviso claro na pergunta, que não trava */
        await page.locator('#ent input').fill(v);
        await continuar();
        ok(await erroVisivel() && (await texto('#erro')).includes(norm(Motor.msgAbaixoCusto(custoMerc))) && await atual() === 'M5.P36', `P36 preço ${v} abaixo do custo: aviso no 1º Continuar`);
        ok((await texto('#erro')).includes('O preço informado está abaixo do custo (R$ 20,00). Assim você perde dinheiro em cada venda. Quer revisar?'), `P36 preço ${v}: texto do aviso com o custo`);
        await shot('l3_m05_p36_abaixo_custo.png');
        await continuar();
        ok(!(await erroVisivel()), `P36 preço ${v}: 2º Continuar segue (não trava)`);
        await seguir();
      } else await preencher([v]);
      ok(await atual() === 'PRECO', 'P36 com preço -> análise');
      if (v === '30') await voltarNoTopo('passo do preço');
      return texto('#analise');
    };
    const custoMerc = 20;
    const casos = [
      ['30', null], ['22', 'baixo'], ['45', 'alto'], ['15', 'neg'], ['23,33', 'baixo'], ['24', null], ['40', null], ['40,02', 'alto'],
    ];
    for (const [v, esp] of casos) {
      t = await precoB(v);
      const p = Number(v.replace(',', '.'));
      const pctMao = (p - custoMerc) / custoMerc * 100;
      ok(t.includes(pct1(pctMao)), `preço ${v}: lucro ${pct1(pctMao)} (tela: ${t.slice(0, 60)})`);
      const temB = t.includes(MSG.reverso.baixo), temA = t.includes(MSG.reverso.alto), temN = t.includes(norm(Motor.msgAbaixoCusto(custoMerc)));
      ok((await page.locator('#aviso-abaixo-custo').count() === 1) === (p < custoMerc), `preço ${v}: bloco "abaixo do custo" no passo do preço só quando preço < custo`);
      if (esp === null) ok(!temB && !temA && !temN, `preço ${v}: sem aviso`);
      if (esp === 'baixo') ok(temB && !temA && !temN, `preço ${v}: aviso de lucro baixo (b)`);
      if (esp === 'alto') ok(temA && !temB && !temN, `preço ${v}: aviso de lucro alto (b)`);
      if (esp === 'neg') ok(temB && temN && !temA, `preço ${v}: lucro negativo = baixo + "abaixo do custo"`);
      if (v === '15') await shot('05b-lucro-negativo.png');
      ok(t.includes(Motor.MSG_ACIMA_MERCADO) === (p > 40), `preço ${v}: aviso de acima da faixa do Módulo 3 só acima de R$ 40`);
      ok(t.includes('Faixa de preço que você informou no Módulo 3: R$ 25,00 a R$ 40,00'), `preço ${v}: mostra a faixa do Módulo 3`);
      if (v === '30') ok(t.includes('R$ 10,00') && t.includes('33,3%') && t.includes('Margem sobre o preço'), 'preço 30, custo 20: sobra R$ 10,00 e margem 33,3% sobre o preço');
      if (v === '45') await shot('m05_preco_faixa_m3.png');
      if (v === '22') await shot('05-lucro-reverso-baixo.png');
    }
    ok(pct1((23.33 - 20) / 20 * 100) === '16,6%' || pct1((23.33 - 20) / 20 * 100) === '16,7%', 'arredondamento 1 casa');
    await precoB('30');
    await semNaN('passo do preço (b)');
    ok(await clicar('#res', 'Ver o resultado'), 'Ver o resultado (b)');
    await voltarNoTopo('resultado');
    tr = await texto('#tela');
    ok(tr.includes('50,0%') && tr.includes('R$ 20,00') && tr.includes('R$ 30,00'), 'resultado Mercadoria: lucro 50,0%, custo 20, preço 30');
    ok(await page.evaluate(() => document.getElementById('simula-det').open && document.getElementById('contas').open), 'resultado: "Ver as contas" e "Simular" abertos por padrão (I)');
    ok(await page.inputValue('#sim-preco') === '30,00' && await page.inputValue('#sim-qtd') === '50', 'simulação começa com o preço e a quantidade informados');
    await page.fill('#sim-preco', '25'); await page.fill('#sim-qtd', '10'); await page.click('#sim-ok');
    ok((await texto('#sim-res')).includes('R$ 5,00') && (await texto('#sim-res')).includes('R$ 50,00'), 'simular R$ 25 x 10 vendas: sobra R$ 5,00, resultado R$ 50,00');
    ok((await state()).R['M5.P36'].valor === '30', 'simular não muda as respostas');
    ok(tr.includes('R$ 1.500,00'), 'resultado Mercadoria: faturamento 50 x 30 = 1.500');
    ok(await page.evaluate(() => [...document.querySelectorAll('#numeros .secao-titulo, #numeros .lbl')].filter((e) => /^acréscimo sobre o custo$/i.test(e.textContent.trim())).length) === 1, 'rótulo "Acréscimo sobre o custo" uma vez só no resultado');
    ok(await page.locator('#aviso-acrescimo, #fat-alto, #aviso-investimento').count() === 0, 'valores comuns: sem avisos de valor fora do comum');
    ok((await texto('#pe-falta')).includes('falta informar os gastos fixos do mês'), 'Mercadoria sem gastos do mês: diz o que falta para o ponto de equilíbrio');
    ok((await texto('#alerta-mao-de-obra')).startsWith('Mão de obra não foi considerada: o preço pode estar baixo') && (await texto('#alerta-aluguel')).startsWith('Aluguel não foi considerado'), 'tudo Não: destaque de mão de obra e aluguel não considerados');
    ok((await texto('#entrou li[data-chave="aluguel"]')) === '⚠ Aluguel: não considerado (você respondeu que não paga aluguel)' && (await texto('#entrou li[data-chave="mercadoria"]')) === '✓ Compra da mercadoria: considerado, R$ 20,00 por unidade' && await page.locator('#entrou li.falta').count() === 8, 'tudo Não: ⚠ com o porquê, ✓ na compra: ' + await texto('#entrou'));
    ok(await page.evaluate(() => getComputedStyle(document.querySelector('#entrou li.falta')).backgroundColor) === 'rgb(255, 247, 224)' && await page.locator('.lg2-proximo').count() === 1, 'não considerado: tom de aviso (amarelo claro), não trava');
    ok((await texto('#dica-aluguel-topo')) === 'Dica: ' + Motor.DICA_SEM_GASTO['M5.P28'] && (await texto('#dica-agua_luz')).includes('Fique de olho') && (await texto('#dica-outros')).includes('Fique de olho'), 'Não para aluguel/água e luz/outros: dica de ficar de olho e reservar, ao lado do ⚠');
    // reserva: 5% de 30 × 50 = 1.500 -> R$ 75,00; sobra 10 por venda -> 75 ÷ 10 = 7,5 -> 8 vendas
    ok((await texto('#reserva-valor')) === 'R$ 75,00' && (await texto('#como-reserva')) === 'Como calculamos: 5% de R$ 1.500,00 (faturamento do mês) = R$ 75,00. Com a reserva, os gastos do mês vão a R$ 0,00 + R$ 75,00 = R$ 75,00; ÷ R$ 10,00 = 7,50, para cima: 8 vendas.', 'reserva para imprevistos: ' + await texto('#como-reserva'));
    await page.fill('#sim-aluguel', '400');
    ok((await texto('#sim-aluguel-pe')) === 'Com esse aluguel, você precisaria de 40 vendas por mês.' && (await texto('#como-sim-aluguel')) === 'Como calculamos: R$ 0,00 + R$ 400,00 (aluguel) = R$ 400,00 de gastos do mês ÷ R$ 10,00 = 40,00, para cima: 40 vendas.', '"Se um dia pagar aluguel de R$ 400": 40 vendas, ao vivo');
    await page.fill('#sim-aluguel', '450,50');
    ok((await texto('#sim-aluguel-pe')).includes('46 vendas'), 'simulador do aluguel muda enquanto digita (450,50 ÷ 10 = 45,05 -> 46)');
    ok((await state()).R['M5.P28'].opcao === 'Não', 'simulador do aluguel não muda as respostas');
    await page.locator('#entrou').scrollIntoViewIfNeeded(); await shot('m05_depois_entrou_faltas.png');
    await semNaN('resultado Mercadoria');
    console.log('PASS-stage: Mercadoria + lucro reverso');

    /* ===== 3. Serviço: com materiais, mistura Sim/Não, "Ainda não comecei" e "Não sei" no preço ===== */
    const m1 = { v: 2, R: { 'M1.P01': { estado: 'opcao', opcao: 'Já vendi algumas vezes' }, 'M1.P03': { estado: 'valor', valor: 'Corte de cabelo' } } };
    await inicio(m1);
    /* relatório 05/11: a tela que só repetia a resposta do Módulo 1 vira contexto no topo da 1ª pergunta real */
    ok(await atual() === 'M5.P01' && !(await state()).hist.includes('M5.P00'), 'estágio do Módulo 1: tela P00 pulada, abre direto em P01');
    ok((await state()).R['M5.P00'].opcao === 'Já vendi algumas vezes' && (await state()).R['M5.P00'].estado === 'opcao', 'P00 gravada no Módulo 5 (herdada)');
    ok((await texto('#seu-negocio')).includes('Seu negócio: Corte de cabelo') && (await texto('#neg-estagio')).includes('Já vendi algumas vezes') && (await texto('#neg-estagio')).includes('Veio do Módulo 1'), 'P01: cartão "Seu negócio" com ideia e estágio do Módulo 1');
    ok(await page.locator('#ent .opcao').count() === 3 && await page.locator('#ent .opcao.sel').count() === 0, 'sem M1.P03A: P01 pergunta como antes (3 opções, nada marcado)');
    await shot('m05_P01_cartao_negocio.png');
    /* Trocar o estágio: abre a P00 com a resposta herdada marcada e o selo */
    ok(await clicar('#neg-estagio .alterar', 'Trocar') && await atual() === 'M5.P00', 'Trocar estágio abre a P00');
    ok((await texto('#ent .opcao.sel')) === 'Já vendi algumas vezes' && (await texto('.selo-m')).includes('Veio do Módulo 1'), 'P00 aberta pelo Trocar: resposta herdada marcada + selo');
    await continuar(); await seguir();
    ok(await atual() === 'M5.P01' && (await state()).R['M5.P00'].herdado === 'M1', 'confirmar o mesmo estágio mantém a marca de herança e volta à P01');
    await escolher('Serviço');
    /* 16/11 (F): o nome do serviço já foi respondido no Módulo 1 -> a tela P17 é pulada; cartão com "Trocar" */
    ok(await atual() === 'M5.P18' && !(await state()).hist.includes('M5.P17'), 'P17 (nome) pulada: já respondida no Módulo 1');
    ok(JSON.stringify((await state()).R['M5.P17']) === JSON.stringify({ estado: 'valor', valor: 'Corte de cabelo', herdado: 'M1' }), 'P17 gravada com a resposta do Módulo 1 (mesmo formato + herdado)');
    ok((await texto('#ctx-herdado')).includes('Serviço: Corte de cabelo') && (await texto('#ctx-herdado')).includes('Veio do Módulo 1') && await page.locator('#ctx-herdado [data-trocar="M5.P17"]').count() === 1, 'P18: etiqueta do item com "Veio do Módulo 1" e Trocar: ' + await texto('#ctx-herdado'));
    await shot('m05_depois_herdado_nome.png');
    ok(await clicar('#ctx-herdado .alterar', 'Trocar') && await atual() === 'M5.P17' && await page.inputValue('#ent input') === 'Corte de cabelo' && (await texto('.selo-m')).includes('Módulo 1'), 'Trocar abre a P17 com o nome do Módulo 1 e o selo');
    ok(JSON.stringify((await state()).hist.slice(-2)) !== '["M5.P18","M5.P17"]', 'Trocar tira a P18 do histórico');
    await continuar(); await seguir();      // P17 confirmada
    ok((await state()).R['M5.P17'].herdado === 'M1' && await atual() === 'M5.P18', 'confirmar o mesmo nome mantém a marca de herança');
    await escolher('Sim');                  // P18
    ok((await texto('#nota-consumo')).includes('tesoura') && (await texto('#nota-luz')).includes('luz'), 'P19: explicação de consumo e luz/água também no serviço');
    await preencher(['Shampoo']);           // P19
    await preencher(['30']);                // P20
    await preencher(['1'], ['L']);          // P21
    await preencher(['50'], ['ml']);        // P22 -> 30 * 0,05 = 1,50
    await preencher(['1', '0']);            // P23
    await formas(['Cartão de débito']);
    await checarFixo(false); await escolher('Sim');
    ok(await page.locator('#ent .forma').count() === 1 && await page.locator('#ent .parte').count() === 0, 'P25: uma forma só, sem pedir a parte das vendas');
    await preencher(['3']);                 // P24/P25
    ok(await page.locator('#naosei').count() === 0, 'P26: sem "Não sei"; os termos ficam no "Ver dica"');
    await page.click('#dica summary'); await page.click('#dica details.termos summary');
    ok((await texto('#dica')).includes(Motor.EXEMPLO_TIPO['M5.BT04']['Serviço']) && !(await texto('#dica')).includes('confeitaria'), 'P26 (serviço): exemplo de perda de serviço, não de confeitaria');
    await escolher('Não');                  // P26
    await escolher('Sim'); await preencher(['300']);                          // P28/P29
    await escolher('Não');                  // P30
    await escolher('Não');                  // P32
    await escolher('Não');                  // P34
    ok(!(await texto('.btn-alt')).includes('Não sei'), 'P37: "Não sei" não é resposta');
    await alt('Ainda não comecei a vender'); // P37
    await escolher('Não, é parecido o ano todo');
    ok(await atual() === 'M5.P36' && !(await texto('#tela')).includes('Não apresentar estimativas'), 'Serviço: P37 -> P36 (ordem ao app não aparece como "Atenção")');
    await preencher(['1,95']);              // P36
    ok(await atual() === 'PRECO', 'Serviço: P36 -> passo do preço');
    ok(await clicar('#res', 'Ver o resultado'), 'Ver o resultado (Serviço)');
    tr = await texto('#tela');
    ok(tr.includes('R$ 1,50') && tr.includes('R$ 1,95'), 'resultado Serviço: custo 1,50 e preço 1,95');
    ok((await texto('#simulacao')).includes(Motor.MSG_SIMULACAO), 'ainda não comecei a vender: resultado marcado como simulação');
    // sobra por atendimento 1,95 − 1,50 − 0,06 (3% de 1,95 = 0,0585) = 0,39 -> aluguel 300 ÷ 0,39 = 769,2 -> 770
    ok(/Ponto de equilíbrio\s*770\b/.test(tr), 'Serviço: 770 atendimentos para cobrir o mês (para cima, com a sobra mostrada R$ 0,39)');
    ok(JSON.stringify(await page.evaluate(() => JSON.parse(localStorage.getItem('lg2-turma-a-m01')))) === JSON.stringify(m1), 'Módulo 1 só lido, nunca alterado');
    await semNaN('resultado Serviço');
    console.log('PASS-stage: Serviço + preço possível');

    /* ===== 4. Serviço sem materiais: custo por unidade não calculável -> mensagem clara, sem % ===== */
    await inicio({ v: 2, R: { 'M1.P05': { estado: 'opcao', opcao: 'Até 1 hora por dia' } } });
    await escolher('Serviço');
    await preencher(['Aula particular']);
    await escolher('Não');                  // P18 -> P23
    await preencher(['1', '30']);
    await formas(['Pix']);
    for (let i = 0; i < 6; i++) await escolher('Não');
    await preencher(['21']);                // P37: 21 x 1h30 = 31,5 h > 30 h (até 1 hora por dia no Módulo 1)
    await escolher('Não, é parecido o ano todo');
    await preencher(['80']);                // P36
    t = await texto('#analise');
    ok(t.includes(MSG.semCusto) && !/%/.test(t), 'sem custo por unidade: mensagem clara, sem %');
    await semNaN('passo do preço sem custo');
    ok(await clicar('#res', 'Ver o resultado'), 'Ver o resultado (sem custo)');
    await semNaN('resultado sem custo');
    ok((await texto('#tempo-alto')).includes(Motor.MSG_TEMPO) && (await texto('#tempo-alto')).includes('31,5 horas'), 'Serviço: aviso de tempo maior que o disponível no Módulo 1');
    await page.locator('#tempo-alto').scrollIntoViewIfNeeded();
    await shot('m05_tempo_servico.png');
    ok((await texto('#pe-falta')).startsWith('Para calcular quantas vendas cobrem seus gastos fixos, falta informar os gastos fixos'), 'sem gastos do mês: frase do que falta para o ponto de equilíbrio');
    ok(await clicar('#tempo-alto button', 'Conferir a quantidade') && await atual() === 'M5.P37', 'aviso de tempo leva à quantidade para revisar');
    console.log('PASS-stage: sem custo por unidade');

    /* ===== 5. Venda abaixo do custo com gasto mensal: vender mais não resolve ===== */
    await inicio(null, 'Ainda está só na minha cabeça');
    await escolher('Mercadoria');
    await preencher(['Boné']); await preencher(['200']); await preencher(['10']);
    await escolher('Não'); await escolher('Não');
    await formas(['Pix']);
    await escolher('Não'); await escolher('Não');           // P24, P26
    await escolher('Sim'); await preencher(['500']);        // P28/P29
    await escolher('Não'); await escolher('Não'); await escolher('Não');
    await preencher(['30']);                                // P37
    ok((await texto('h2.q')) === Motor.SZ_TEXTO_IDEIA, 'SZ: quem ainda está na ideia vê "Você espera que as vendas mudem…"');
    await escolher('Não, é parecido o ano todo');
    await page.locator('#ent input').fill('15');            // P36 abaixo do custo (20)
    await continuar();
    ok(await erroVisivel() && (await texto('#erro')).includes('O preço informado está abaixo do custo (R$ 20,00). Assim você perde dinheiro em cada venda. Quer revisar?'), 'P36 abaixo do custo: aviso na pergunta');
    await continuar(); ok(!(await erroVisivel()), 'P36 abaixo do custo: 2º Continuar segue'); await seguir();
    ok(await page.locator('#aviso-abaixo-custo').count() === 1, 'passo do preço: aviso "abaixo do custo" em destaque');
    ok(await clicar('#res', 'Ver o resultado'), 'Ver o resultado (sem sobra)');
    tr = await texto('#tela');
    ok((await texto('#aviso-abaixo-custo')).includes('O preço informado está abaixo do custo (R$ 20,00). Assim você perde dinheiro em cada venda. Quer revisar?'), 'resultado: aviso "abaixo do custo" com o custo de uma unidade');
    ok(await page.locator('.lg2-proximo').count() === 1, 'aviso abaixo do custo não trava o resultado');
    await page.locator('#aviso-abaixo-custo').scrollIntoViewIfNeeded();
    await shot('l3_m05_resultado_abaixo_custo.png');
    await page.fill('#sim-preco', '12'); await page.click('#sim-ok');
    ok((await texto('#sim-abaixo')).includes('abaixo do custo (R$ 20,00)'), 'simulação com preço abaixo do custo: mesmo aviso');
    ok(await clicar('#aviso-abaixo-custo button', 'Revisar o preço') && await atual() === 'M5.P36', '"Revisar o preço" volta para a pergunta do preço');
    ok(await page.inputValue('#ent input') === '15', 'ao revisar, o preço informado continua no campo');
    await continuar(); await continuar(); await seguir();
    ok(await clicar('#res', 'Ver o resultado'), 'Ver o resultado de novo (sem sobra)');
    ok((await texto('#sem-sobra')).includes(Motor.MSG_SEM_SOBRA) && !/Ponto de equilíbrio\s*\d/.test(tr), 'sem sobra por venda: explica que vender mais não resolve, sem ponto de equilíbrio');
    ok((await texto('#simulacao')).includes(Motor.MSG_SIMULACAO), 'ideia só na cabeça (Módulo 1): resultado marcado como simulação');
    await semNaN('resultado sem sobra');
    await page.evaluate(() => document.getElementById('numeros').scrollIntoView());
    await shot('m05_resultado_sem_sobra.png');
    console.log('PASS-stage: sem sobra + simulação');

    /* ===== 6. Herança completa do Módulo 1 (lava-jato em domicílio): estágio + tipo -> pula P00 e P01 ===== */
    const m1b = { v: 2, R: { 'M1.P01': { estado: 'opcao', opcao: 'Já vendo sempre' }, 'M1.P03': { estado: 'valor', valor: 'Lava-jato em domicílio' }, 'M1.P03A': { estado: 'opcao', opcao: 'Serviço: meu cliente paga pelo trabalho que realizo' } } };
    await inicio(m1b);
    ok(await atual() === 'M5.P18' && JSON.stringify((await state()).hist) === '["M5.P18"]', 'Módulo 1 com estágio, tipo e ideia: P00, P01 e P17 puladas, abre na P18');
    {
      const r01 = (await state()).R['M5.P01'];
      ok(r01.estado === 'opcao' && r01.opcao === 'Serviço: meu cliente paga pelo trabalho que realizo' && r01.herdado === 'M1', 'M5.P01 gravada no mesmo formato ({estado, opcao}) + marca de herança');
    }
    ok((await texto('#seu-negocio')).includes('Seu negócio: Lava-jato em domicílio · Serviço'), 'cartão "Seu negócio: <ideia> · <tipo>"');
    ok((await texto('#neg-tipo')).includes('Veio do Módulo 1') && (await texto('#neg-tipo .alterar')) === 'Trocar', 'tipo herdado com selo e Trocar');
    ok((await texto('#seu-negocio')).includes('Confira e ajuste se quiser'), 'cartão pede para conferir');
    ok(await page.locator('.contexto').count() === 0, 'cartão substitui a etiqueta "Tipo escolhido"');
    ok(await page.locator('#neg-nome').count() === 0 && await page.locator('#neg-cab-trocar[data-trocar="M5.P17"]').count() === 1, 'cartão: nome igual à ideia do Módulo 1 não se repete; "Trocar" no título');
    await shot('m05_herdado_nome_servico.png');
    await escolher('Não');                  // P18 -> P23
    await preencher(['1', '0']);            // P23
    await formas(['Pix']);
    await escolher('Não');                  // P24
    await escolher('Não');                  // P26
    await escolher('Sim'); await preencher(['200']);   // P28/P29
    await escolher('Não'); await escolher('Não'); await escolher('Não');
    await preencher(['40']);                // P37
    await escolher('Não, é parecido o ano todo');
    await preencher(['60']);                // P36
    ok(await clicar('#res', 'Ver o resultado'), 'Ver o resultado (herdado)');
    {
      const ent = await texto('#entendemos');
      ok(ent.includes('Seu negócio é “Lava-jato em domicílio” e, aqui, você analisou o serviço “Lava-jato em domicílio”') === false && ent.includes('Você analisou o serviço “Lava-jato em domicílio”'), 'entendemos: nome igual à ideia não se repete');
      ok(ent.includes('Você já vende') && ent.includes('R$ 200,00') && ent.includes('Cobrando R$ 60,00, sobram R$ 60,00 em cada atendimento') && ent.includes('4 atendimentos por mês') && ent.includes('Vendendo 40 por mês, sobram R$ 2.200,00'), 'entendemos (Serviço herdado): estágio, gastos, sobra, vendas para cobrir e o mês: ' + ent);
      ok((await texto('.is-txt')).includes('Veio do Módulo 1') && await page.locator('.is-txt [data-trocar="M5.P01"]').count() === 1, 'resultado: tipo herdado com selo e Trocar');
      await semNaN('resultado herdado');
      await page.locator('#entendemos').scrollIntoViewIfNeeded();
      await shot('m05_resultado_entendemos.png');
    }
    /* Trocar o tipo a partir do resultado: abre a P01 com o tipo herdado marcado */
    ok(await clicar('.is-txt .alterar', 'Trocar') && await atual() === 'M5.P01', 'Trocar (resultado) abre a pergunta do tipo');
    ok((await texto('#ent .opcao.sel b')) === 'Serviço' && (await texto('.selo-m')).includes('Veio do Módulo 1'), 'P01 aberta pelo Trocar: tipo herdado marcado + selo');
    ok(!(await state()).hist.includes('RESULTADO'), 'Trocar tira o resultado do histórico');
    await escolher('Mercadoria');
    ok(await atual() === 'M5.P11' && !(await state()).R['M5.P01'].herdado && (await state()).R['M5.P10'].herdado === 'M1', 'trocar para Mercadoria: nome da mercadoria vem do Módulo 1 (P10 pulada), segue para a P11');
    ok((await texto('#ctx-herdado')).includes('Mercadoria: Lava-jato em domicílio') && (await texto('#ctx-herdado')).includes('Veio do Módulo 1'), 'etiqueta mostra o tipo trocado e o nome herdado');
    ok(await clicar('#ctx-herdado .alterar', 'Trocar') && await atual() === 'M5.P10' && JSON.stringify((await state()).hist.slice(-2)) !== '["M5.P11","M5.P10"]', 'Trocar o nome substitui a tela seguinte no histórico');
    await page.locator('#ent input').fill('Cera automotiva'); await continuar(); await seguir();
    ok(!(await state()).R['M5.P10'].herdado && (await state()).R['M5.P10'].valor === 'Cera automotiva' && await atual() === 'M5.P11', 'nome trocado: sem marca de herança');
    ok(JSON.stringify(await page.evaluate(() => JSON.parse(localStorage.getItem('lg2-turma-a-m01')))) === JSON.stringify(m1b), 'Módulo 1 só lido, nunca alterado (herança completa)');
    /* M1.P03A "Não sei": não conta como herança, P01 pergunta como antes */
    await inicio({ v: 2, R: { 'M1.P01': { estado: 'opcao', opcao: 'Já vendo sempre' }, 'M1.P03A': { estado: 'naosei' } } });
    ok(await atual() === 'M5.P01' && !(await state()).R['M5.P01'], 'M1.P03A "Não sei": P01 pergunta normalmente');
    console.log('PASS-stage: herança do Módulo 1');

    /* ===== 7. Números exagerados do testador: custo R$ 1, preço R$ 1.500, 1.500 vendas, "Até R$ 100" no Módulo 1 ===== */
    await inicio({ v: 2, R: { 'M1.P01': { estado: 'opcao', opcao: 'Já vendo sempre' }, 'M1.P07': { estado: 'opcao', opcao: 'Até R$ 100' } } });
    await escolher('Mercadoria');
    await preencher(['Bolo de pote']); await preencher(['1500']); await preencher(['1500']);   // custo 1,00
    await escolher('Não'); await escolher('Não');
    await formas(['Pix']);
    for (let i = 0; i < 6; i++) await escolher('Não');
    await preencher(['1500']);                                     // P37
    await escolher('Não, é parecido o ano todo');
    {
      await page.locator('#ent input').fill('1500');
      await continuar();
      ok(await erroVisivel() && (await texto('#erro')).includes('Seu preço está 1.500 vezes o custo. Confira se o custo ou o preço estão certos.') && await atual() === 'M5.P36', 'P36: preço 1.500 vezes o custo -> aviso no 1º Continuar');
      await shot('m05_aviso_preco_vezes_custo.png');
      await continuar();
      ok(!(await erroVisivel()), 'P36: 2º Continuar com o mesmo valor segue (não trava)');
      await seguir();
    }
    ok(await atual() === 'PRECO' && (await texto('#aviso-acrescimo')).includes('1.500 vezes o custo'), 'passo do preço: aviso em destaque');
    ok(await clicar('#res', 'Ver o resultado'), 'Ver o resultado (números exagerados)');
    tr = await texto('#tela');
    ok(tr.includes('149.900,0%') && (await texto('#aviso-acrescimo')).includes('1.500 vezes o custo'), 'resultado: acréscimo 149.900% com aviso claro');
    ok(await page.evaluate(() => [...document.querySelectorAll('#numeros .secao-titulo, #numeros .lbl')].filter((e) => /^acréscimo sobre o custo$/i.test(e.textContent.trim())).length) === 1, 'resultado: "Acréscimo sobre o custo" uma vez só');
    ok(tr.includes('R$ 2.250.000,00') && (await texto('#fat-alto')).includes(Motor.MSG_FAT_ALTO), 'faturamento R$ 2,25 milhões/mês: aviso de valor alto para negócio caseiro');
    ok((await texto('#aviso-investimento')).includes('“Até R$ 100”') && (await texto('#aviso-investimento')).includes('R$ 1.500,00') && (await texto('#aviso-investimento')).includes('Veio do Módulo 1'), 'compra R$ 1.500 acima do "Até R$ 100" do Módulo 1: aviso citando o Módulo 1');
    ok((await texto('#pe-falta')).includes('falta informar os gastos fixos do mês'), 'sem gastos do mês: explica o que falta para o ponto de equilíbrio');
    ok(await page.locator('.lg2-proximo').count() === 1, 'avisos não travam: botão do próximo módulo presente');
    await semNaN('resultado números exagerados');
    await page.locator('#aviso-acrescimo').scrollIntoViewIfNeeded();
    await shot('m05_resultado_avisos_valores.png');
    await page.locator('#fat-alto').scrollIntoViewIfNeeded();
    await shot('m05_resultado_faturamento_m1.png');
    console.log('PASS-stage: números exagerados (avisos que não travam)');

    /* ===== 8. Lote 4 (Ana Luiza): ajustar valores na tela do resultado, "Recalcular" e "Limpar" ===== */
    {
      const R0 = {
        'M5.P00': { estado: 'opcao', opcao: 'Já vendo sempre' },
        'M5.P01': { estado: 'opcao', opcao: 'Produto: eu compro materiais e faço o que vendo' },
        'M5.P02': { estado: 'valor', valor: 'Bolo de pote' },
        'M5.P03': { estado: 'valor', valor: ['Farinha', 'Ovo'] },
        'M5.P04': { estado: 'valor', valor: ['10', '12'] },
        'M5.P05': { estado: 'valor', valor: [{ q: '1', u: 'kg' }, { q: '12', u: 'unidade' }] },
        'M5.P06': { estado: 'valor', valor: [{ q: '500', u: 'g' }, { q: '6', u: 'unidade' }] },
        'M5.P07': { estado: 'valor', valor: '10' },
        'M5.P08': { estado: 'opcao', opcao: 'Sim' },
        'M5.P09': { estado: 'valor', valor: { preco: '20', qtd: '10' } },
        'M5.PG': { estado: 'valor', valor: ['Pix'] },
        'M5.P24': { estado: 'opcao', opcao: 'Não' }, 'M5.P26': { estado: 'opcao', opcao: 'Não' },
        'M5.P28': { estado: 'opcao', opcao: 'Sim' }, 'M5.P29': { estado: 'valor', valor: '300' },
        'M5.P30': { estado: 'opcao', opcao: 'Não' },
        'M5.P32': { estado: 'opcao', opcao: 'Sim' }, 'M5.P33': { estado: 'valor', valor: [{ nome: 'Internet', v: '100' }] },
        'M5.P34': { estado: 'opcao', opcao: 'Não' },
        'M5.P37': { estado: 'valor', valor: '50' }, 'M5.P36': { estado: 'valor', valor: '15' },
      };
      const hist0 = Object.keys(R0).concat('RESULTADO');
      await page.goto(URL0);
      await page.evaluate(([k, s]) => { localStorage.clear(); localStorage.setItem(k, JSON.stringify(s)); }, [KEY, { versao: 3, R: R0, hist: hist0 }]);
      await page.reload(); await page.click('#ir');
      ok(await atual() === 'RESULTADO' && (await texto('#tela')).includes('R$ 3,10'), 'ajuste: resultado aberto com custo de uma unidade R$ 3,10');
      ok(await page.locator('details#ajuste').count() === 1 && (await page.evaluate(() => document.getElementById('ajuste').open)) && norm(await page.textContent('#ajuste summary')) === 'Ajustar valores e recalcular', 'ajuste: caixa "Ajustar valores e recalcular" no resultado, aberta (I)');
      ok(await clicar('[data-ir-ajuste]', 'Mudou algum valor? Ajuste aqui e recalcule ↓') && await page.evaluate(() => document.getElementById('ajuste').open), 'ajuste: atalho embaixo da composição do custo abre a caixa');
      const campos = () => page.evaluate(() => [...document.querySelectorAll('#ajuste tr')].map((tr) => ({ rot: tr.cells[0].textContent.trim().replace(/\s*\([^)]*\)$/, ''), un: tr.cells[0].textContent.trim(), v: (tr.querySelector('input') || {}).value })));
      const cs = await campos();
      const pega = (rot, n = 0) => cs.filter((x) => x.rot === rot)[n];
      ok(pega('Farinha') && pega('Preço que você paga').v === '10,00' && pega('Quanto vem quando compra').v === '1' && pega('Quanto usa').v === '500' && pega('Preço que você paga', 1).v === '12,00'
        && pega('Quantas unidades você faz com essas quantidades').v === '10' && pega('Preço do pacote').v === '20,00' && pega('Quantas vêm no pacote').v === '10', 'ajuste: tabela traz os materiais, o rendimento e a embalagem com os valores respondidos ' + JSON.stringify(cs));
      ok(pega('Quanto vem quando compra').un === 'Quanto vem quando compra (kg)' && pega('Quanto usa').un === 'Quanto usa (g)', 'ajuste: unidade respondida aparece ao lado do nome');
      ok(pega('Aluguel').v === '300,00' && pega('Água e luz').v === '' && pega('Internet').v === '100,00' && pega('Preço de venda').v === '15,00' && pega('Vendas no mês').v === '50', 'ajuste: gastos do mês, preço e vendas na tabela, dinheiro em padrão brasileiro (300,00)');
      ok(await page.evaluate(() => [...document.querySelectorAll('#ajuste input')].every((i) => i.inputMode === 'decimal')), 'ajuste: campos com teclado numérico');
      ok(!/M5\.|\bP\d{2}\b|Rafael|Grupo \d/.test(await texto('#ajuste')), 'ajuste: sem códigos na tela');
      await page.locator('#ajuste').scrollIntoViewIfNeeded();
      await shot('l4_m05_resultado_ajuste.png');
      const idx = (rot, n = 0) => cs.findIndex((x, i) => x.rot === rot && cs.slice(0, i).filter((y) => y.rot === rot).length === n) ;
      const inp = (rot, n = 0) => page.locator('#ajuste tr').nth(idx(rot, n)).locator('input');
      const antes = JSON.stringify((await state()).R);
      await inp('Preço que você paga').fill('dez'); await page.click('#aj-recalcular');
      ok(!(await page.locator('#ajuste-erro').isHidden()) && (await texto('#ajuste-erro')) === Motor.MSG_NUMERO && JSON.stringify((await state()).R) === antes, 'ajuste: texto no campo -> "Digite só números", não grava');
      await inp('Preço que você paga').fill('-5'); await page.click('#aj-recalcular');
      ok((await texto('#ajuste-erro')) === 'O valor não pode ser negativo.' && JSON.stringify((await state()).R) === antes, 'ajuste: valor negativo não grava');
      await inp('Preço que você paga').fill(''); await page.click('#aj-recalcular');
      ok((await texto('#ajuste-erro')).startsWith('Preencha todos os valores') && JSON.stringify((await state()).R) === antes, 'ajuste: material em branco não grava');
      await inp('Quanto vem quando compra').fill('0'); await inp('Preço que você paga').fill('20'); await page.click('#aj-recalcular');
      ok((await texto('#ajuste-erro')) === 'A quantidade deve ser maior que zero.' && JSON.stringify((await state()).R) === antes, 'ajuste: quantidade da embalagem zero não grava');
      await inp('Quanto vem quando compra').fill('1');
      await inp('Aluguel').fill('500'); await inp('Água e luz').fill('50'); await inp('Internet').fill('');
      await page.click('#aj-recalcular');
      let st = await state();
      ok(st.R['M5.P04'].valor[0] === '20' && st.R['M5.P04'].valor[1] === '12' && JSON.stringify(st.R['M5.P05'].valor) === JSON.stringify(R0['M5.P05'].valor), 'Recalcular: preço da farinha gravado na mesma resposta da pergunta (mesmo formato)');
      ok(st.R['M5.P29'].valor === '500' && st.R['M5.P30'].opcao === 'Sim' && st.R['M5.P31'].valor === '50' && st.R['M5.P32'].opcao === 'Não' && !st.R['M5.P33'], 'Recalcular: aluguel, água e luz (passa a "Sim") e outro gasto apagado (passa a "Não")');
      ok(JSON.stringify(st.hist) === JSON.stringify(hist0) && st.versao === 4 && st.ajusteOrig && st.ajusteOrig['M5.P04'].valor[0] === '10', 'Recalcular: continua no resultado, versão do estado igual, cópia para o Limpar');
      // custo 1,00 + 0,60 + 2,00 = 3,60; gastos 550; sobra 11,40; 550/11,4 = 48,2 -> 49
      let tr = await texto('#tela');
      ok(tr.includes('R$ 3,60') && tr.includes('R$ 550,00') && /Ponto de equilíbrio\s*49/.test(tr) && await page.evaluate(() => document.getElementById('ajuste').open), 'Recalcular: custo R$ 3,60, gastos R$ 550,00 e 49 vendas para cobrir, sem refazer o módulo');
      ok((await texto('#ajuste-msg')).includes('Recalculamos'), 'Recalcular: mensagem de confirmação');
      ok(await page.evaluate(() => { const r = document.getElementById('ajuste').getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0; }), 'Recalcular: a tela fica na caixa do ajuste');
      ok(JSON.parse(await page.evaluate(() => localStorage.getItem('lg2-turma-a-m05-historico')))[0].estado.R['M5.P04'].valor[0] === '20', 'Recalcular: "Minhas análises" guarda os valores novos');
      await semNaN('resultado ajustado');
      await shot('l4_m05_resultado_recalculado.png');
      await page.reload(); await page.click('#ir');
      ok((await texto('#tela')).includes('R$ 3,60') && (await state()).R['M5.P29'].valor === '500', 'ajuste: valores novos continuam depois de recarregar');
      /* quantidade usada maior que a embalagem: aviso que não trava */
      await page.evaluate(() => { document.getElementById('ajuste').open = true; });
      await page.locator('#ajuste tr').nth(idx('Quanto usa')).locator('input').fill('2000');
      await page.click('#aj-recalcular');
      ok((await texto('#ajuste-msg')).includes(Motor.MSG_QTD_ALTA) && (await state()).R['M5.P06'].valor[0].q === '2000', 'ajuste: usar mais do que vem na embalagem -> aviso, mas recalcula');
      /* Limpar: volta às respostas dadas nas perguntas */
      await page.click('#aj-limpar');
      st = await state();
      ok(JSON.stringify(st.R) === JSON.stringify(R0) && !st.ajusteOrig, 'Limpar: volta exatamente às respostas das perguntas');
      tr = await texto('#tela');
      ok(tr.includes('R$ 3,10') && tr.includes('R$ 400,00') && (await texto('#ajuste-msg')).includes('Voltamos aos valores das suas respostas'), 'Limpar: resultado volta a R$ 3,10 e R$ 400,00');
      ok(await page.locator('.lg2-proximo').count() === 1, 'ajuste: botão do próximo módulo continua no fim');
      /* responder de novo nas perguntas zera a cópia do Limpar */
      await page.locator('#ajuste tr').nth(idx('Aluguel')).locator('input').fill('700'); await page.click('#aj-recalcular');
      ok((await state()).ajusteOrig, 'ajuste: cópia guardada');
      ok(await clicar('#rev', 'Revisar respostas'), 'Revisar respostas');
      await continuar();
      ok(!(await state()).ajusteOrig, 'responder nas perguntas tira a cópia do Limpar');
      console.log('PASS-stage: ajustar valores no resultado (Recalcular/Limpar)');
    }

    /* ===== 9. Lote 16/11 (A): toda pergunta com "Não sei" bloqueia; onde ele saiu, o botão não existe ===== */
    {
      const RP = {
        'M5.P00': { estado: 'opcao', opcao: 'Já vendo sempre' }, 'M5.P01': { estado: 'opcao', opcao: 'Produto: eu compro materiais e faço o que vendo' },
        'M5.P02': { estado: 'valor', valor: 'Bolo' }, 'M5.P03': { estado: 'valor', valor: ['Farinha'] },
        'M5.P04': { estado: 'valor', valor: ['10'] }, 'M5.P05': { estado: 'valor', valor: [{ q: '1', u: 'kg' }] },
        'M5.P06': { estado: 'valor', valor: [{ q: '100', u: 'g' }] }, 'M5.P07': { estado: 'valor', valor: '10' }, 'M5.P08': { estado: 'opcao', opcao: 'Sim' },
        'M5.PG': { estado: 'valor', valor: ['Pix'] }, 'M5.P24': { estado: 'opcao', opcao: 'Sim' },
      };
      const tipos = { 'M5.P10': 'Mercadoria: compro pronto para revender', 'M5.P11': 'Mercadoria: compro pronto para revender', 'M5.P12': 'Mercadoria: compro pronto para revender', 'M5.P13': 'Mercadoria: compro pronto para revender', 'M5.P14': 'Mercadoria: compro pronto para revender', 'M5.P15': 'Mercadoria: compro pronto para revender', 'M5.P16': 'Mercadoria: compro pronto para revender',
        'M5.P17': 'Serviço: meu cliente paga pelo trabalho que realizo', 'M5.P18': 'Serviço: meu cliente paga pelo trabalho que realizo', 'M5.P19': 'Serviço: meu cliente paga pelo trabalho que realizo', 'M5.P20': 'Serviço: meu cliente paga pelo trabalho que realizo', 'M5.P21': 'Serviço: meu cliente paga pelo trabalho que realizo', 'M5.P22': 'Serviço: meu cliente paga pelo trabalho que realizo', 'M5.P23': 'Serviço: meu cliente paga pelo trabalho que realizo' };
      let nBloq = 0, nSem = 0;
      for (const q of M.ordem) {
        const R = JSON.parse(JSON.stringify(RP));
        if (tipos[q.codigo]) { R['M5.P01'].opcao = tipos[q.codigo]; R['M5.P10'] = { estado: 'valor', valor: 'Boné' }; R['M5.P17'] = { estado: 'valor', valor: 'Aula' }; R['M5.P19'] = { estado: 'valor', valor: ['Esmalte'] }; R['M5.P20'] = { estado: 'valor', valor: ['8'] }; R['M5.P21'] = { estado: 'valor', valor: [{ q: '10', u: 'ml' }] }; }
        Object.keys(R).forEach((k) => { if (k === q.codigo) delete R[k]; });
        await page.goto(URL0);
        await page.evaluate(([k, s]) => { localStorage.clear(); localStorage.setItem(k, JSON.stringify(s)); }, [KEY, { versao: 4, R, hist: [q.codigo] }]);
        await page.reload(); await page.click('#ir');
        ok(await atual() === q.codigo, `${q.codigo}: aberta direto`);
        if (!q.botaoNaoSei) {
          ok(await page.locator('#naosei').count() === 0 && await page.locator('#ent .opcao, .btn-alt').filter({ hasText: /n[ãa]o sei|ainda n[ãa]o defini/i }).count() === 0, `${q.codigo}: sem "Não sei" (saiu)`);
          nSem++;
          continue;
        }
        const antes = JSON.stringify(await state());
        await page.click('#naosei');
        ok(await page.locator('#painel .como-descobrir').isVisible(), `${q.codigo}: "Não sei" mostra "Como descobrir"`);
        await page.evaluate(() => document.querySelectorAll('#ent input').forEach((i) => { i.value = ''; }));
        await clicar('#ok', 'Continuar');
        ok(await erroVisivel() && (await texto('#erro')) === Motor.msgFalta(q, true) && await atual() === q.codigo && JSON.stringify(await state()) === antes && await page.locator('#retorno .retorno, #acoes button').filter({ hasText: /^Seguir$/ }).count() === 0, `${q.codigo}: "Não sei" não grava e o Continuar não avança (${await texto('#erro')})`);
        nBloq++;
      }
      ok(nBloq === 24 && nSem === 19, `"Não sei" bloqueia em ${nBloq} perguntas; saiu de ${nSem}`);
      console.log(`PASS-stage: "Não sei" bloqueia em ${nBloq} perguntas; saiu de ${nSem}`);
    }

    /* ===== 10. Lote 16/11 (F): tipo do Módulo 4 e materiais do Módulo 4 (sem pergunta repetida) ===== */
    {
      await page.goto(URL0);
      await page.evaluate(() => { localStorage.clear(); localStorage.setItem('lg2-turma-a-m04', JSON.stringify({ R: { 'M4.P02': { estado: 'opcao', opcao: 'Produto' }, 'M4.P03': { estado: 'valor', valor: 'farinha, ovos e açúcar' } } })); });
      await page.reload(); await page.click('#ir');
      await escolher('Já vendo sempre');
      ok(await atual() === 'M5.P02' && (await state()).R['M5.P01'].herdado === 'M4' && (await state()).R['M5.P01'].opcao === 'Produto: eu compro materiais e faço o que vendo', 'tipo veio do Módulo 4 (P01 pulada)');
      ok((await texto('#neg-tipo')).includes('Veio do Módulo 4') && await page.locator('#neg-tipo [data-trocar="M5.P01"]').count() === 1, 'cartão: tipo com "Veio do Módulo 4" e Trocar');
      await preencher(['Bolo']);
      ok(JSON.stringify(await page.$$eval('#ent .lista input', (xs) => xs.map((x) => x.value))) === '["Farinha","Ovos","Açúcar"]' && (await texto('.selo-m')).includes('Módulo 4'), 'P03: materiais sugeridos do Módulo 4 (para conferir), com selo');
      await page.evaluate(() => { localStorage.setItem('lg2-turma-a-m04', JSON.stringify({ R: { 'M4.P02': { estado: 'opcao', opcao: 'Produto+ Serviço' } } })); });
      await page.evaluate((k) => localStorage.removeItem(k), KEY); await page.reload(); await page.click('#ir');
      await escolher('Já vendo sempre');
      ok(await atual() === 'M5.P01', 'Módulo 4 com dois tipos: P01 pergunta normalmente');
      console.log('PASS-stage: herança do Módulo 4');
    }

    /* ===== 11. Caso do relatório de revisão na tela: 9,50 / 1,35 / 50 vendas / R$ 1.700 ===== */
    {
      const R = { 'M5.P00': { estado: 'opcao', opcao: 'Já vendo sempre' }, 'M5.P01': { estado: 'opcao', opcao: 'Mercadoria: compro pronto para revender' }, 'M5.P10': { estado: 'valor', valor: 'Boné' },
        'M5.P11': { estado: 'valor', valor: '203' }, 'M5.P12': { estado: 'valor', valor: '150' }, 'M5.P13': { estado: 'opcao', opcao: 'Não' }, 'M5.P15': { estado: 'opcao', opcao: 'Não' }, 'M5.PG': { estado: 'valor', valor: ['Pix'] },
        'M5.P24': { estado: 'opcao', opcao: 'Não' }, 'M5.P26': { estado: 'opcao', opcao: 'Não' }, 'M5.P28': { estado: 'opcao', opcao: 'Sim' }, 'M5.P29': { estado: 'valor', valor: '1700' }, 'M5.P30': { estado: 'opcao', opcao: 'Não' }, 'M5.P32': { estado: 'opcao', opcao: 'Não' }, 'M5.P34': { estado: 'opcao', opcao: 'Não' },
        'M5.P37': { estado: 'valor', valor: '50' }, 'M5.P36': { estado: 'valor', valor: '9,50' } };
      await page.goto(URL0);
      await page.evaluate(([k, s]) => { localStorage.clear(); localStorage.setItem(k, JSON.stringify(s)); }, [KEY, { versao: 4, R, hist: Object.keys(R).concat('RESULTADO') }]);
      await page.reload(); await page.click('#ir');
      ok((await texto('#entendemos')).includes('faltam R$ 1.292,50') && !(await texto('#tela')).includes('1.292,67'), 'revisão: faltam R$ 1.292,50 (não 1.292,67)');
      ok((await texto('#como-entendemos')) === 'Como calculamos: R$ 9,50 (preço) − R$ 1,35 (custo) = R$ 8,15 por venda; R$ 1.700,00 (gastos do mês) ÷ R$ 8,15 = 208,59, para cima: 209 vendas; 50 × R$ 8,15 − R$ 1.700,00 = −R$ 1.292,50.', 'revisão: "Como calculamos" bate com a conta à mão: ' + await texto('#como-entendemos'));
      ok((await texto('#como-resultado')) === 'Como calculamos: R$ 9,50 × 50 vendas = R$ 475,00 de faturamento; R$ 1,35 de custo de cada venda × 50 = R$ 67,50; R$ 475,00 − R$ 67,50 − R$ 1.700,00 de gastos do mês = −R$ 1.292,50.', 'revisão: conta do mês: ' + await texto('#como-resultado'));
      ok((await texto('#como-custo')) === 'Como calculamos: Compra da mercadoria: R$ 203,00 ÷ 150 unidades = R$ 1,35. Esse é o gasto de cada unidade.', 'revisão: custo da unidade: ' + await texto('#como-custo'));
      ok(/Ponto de equilíbrio\s*209\b/.test(await texto('#tela')), 'revisão: 209 vendas');
      /* simulador: muda ao vivo, com "Como calculamos" */
        ok(await page.inputValue('#sim-preco') === '9,50', 'simulador: preço em padrão brasileiro (9,50)');
      await page.fill('#sim-qtd', '100');
      ok((await texto('#como-sim')) === 'Como calculamos: R$ 9,50 − R$ 1,35 de custo = R$ 8,15 por venda; R$ 9,50 × 100 vendas = R$ 950,00 de faturamento; R$ 1,35 de custo de cada venda × 100 = R$ 135,00; R$ 950,00 − R$ 135,00 − R$ 1.700,00 de gastos do mês = −R$ 885,00. Vendas para cobrir o mês: R$ 1.700,00 ÷ R$ 8,15 = 208,59, para cima: 209.', 'simulador: conta ao vivo, sem tocar em Simular: ' + await texto('#como-sim'));
      await page.locator('#simula-det').scrollIntoViewIfNeeded();
      await shot('m05_depois_simulador.png');
      /* sem pagamento -> ⚠; informando R$ 1.000 no ajuste: ✓ e 2.700 ÷ 8,15 = 331,3 -> 332 vendas */
      ok(await page.locator('#alerta-mao-de-obra').count() === 1, 'revisão (sem pagamento): mão de obra ⚠ em destaque');
      await page.evaluate(() => { document.getElementById('ajuste').open = true; });
      const idxT = await page.evaluate(() => [...document.querySelectorAll('#ajuste tr')].findIndex((tr) => /seu trabalho/.test(tr.textContent)));
      await page.locator('#ajuste tr').nth(idxT).locator('input').fill('1000'); await page.click('#aj-recalcular');
      ok(await page.locator('#alerta-mao-de-obra').count() === 0 && (await texto('#entrou li[data-chave="mao_de_obra"]')) === '✓ Mão de obra (seu pagamento): considerado, R$ 1.000,00 por mês' && /Ponto de equilíbrio\s*332\b/.test(await texto('#tela')), 'com pagamento de R$ 1.000: ✓ e 332 vendas (2.700 ÷ 8,15 = 331,3)');
      await page.evaluate(() => document.querySelectorAll('details').forEach((d) => { d.open = true; }));
      await semNaN('resultado revisão');
      console.log('PASS-stage: caso do relatório de revisão (1.292,50 / 209)');
    }

    /* ===== 13. (J) estado real no mesmo formato (dados inventados), versão 3: nada se perde ===== */
    {
      const R = { 'M5.P00': { estado: 'opcao', opcao: 'Já vendo sempre', herdado: 'M1' }, 'M5.P01': { estado: 'opcao', opcao: 'Produto: eu compro materiais e faço o que vendo', herdado: 'M1' },
        'M5.P02': { estado: 'valor', valor: 'Pão de mel' }, 'M5.P03': { estado: 'valor', valor: ['Mel', 'Farinha', 'Chocolate', 'Fita'] },
        'M5.P04': { estado: 'valor', valor: ['20', '6', '30', '5'] }, 'M5.P05': { estado: 'valor', valor: [{ q: '1', u: 'kg' }, { q: '1', u: 'kg' }, { q: '1', u: 'kg' }, { q: '10', u: 'unidade' }] },
        'M5.P06': { estado: 'valor', valor: [{ q: '200', u: 'g' }, { q: '500', u: 'g' }, { q: '300', u: 'g' }, { q: '10', u: 'unidade' }] }, 'M5.P07': { estado: 'valor', valor: '20' },
        'M5.P08': { estado: 'opcao', opcao: 'Sim' }, 'M5.P09': { estado: 'valor', valor: { preco: '40', qtd: '100' } }, 'M5.PG': { estado: 'valor', valor: ['Pix', 'Cartão de débito', 'Cartão de crédito'] },
        'M5.P24': { estado: 'opcao', opcao: 'Sim' }, 'M5.P25': { estado: 'valor', valor: [{ forma: 'Pix', taxa: '0', prazo: '', parte: '50' }, { forma: 'Cartão de débito', taxa: '2', prazo: '1', parte: '30' }, { forma: 'Cartão de crédito', taxa: '4', prazo: '30', parte: '20' }] },
        'M5.P26': { estado: 'opcao', opcao: 'Sim' }, 'M5.P27': { estado: 'valor', valor: '30' }, 'M5.P28': { estado: 'opcao', opcao: 'Sim' }, 'M5.P29': { estado: 'valor', valor: '200' },
        'M5.P30': { estado: 'opcao', opcao: 'Sim' }, 'M5.P31': { estado: 'valor', valor: '60' }, 'M5.P32': { estado: 'opcao', opcao: 'Sim' }, 'M5.P33': { estado: 'valor', valor: [{ nome: 'Internet', v: '50' }] },
        'M5.P34': { estado: 'opcao', opcao: 'Não' }, 'M5.P37': { estado: 'valor', valor: '200' }, 'M5.P36': { estado: 'valor', valor: '8' } };
      const hist = ['M5.P02', 'M5.P03', 'M5.P04', 'M5.P05', 'M5.P06', 'M5.P07', 'M5.P08', 'M5.P09', 'M5.PG', 'M5.P24', 'M5.P25', 'M5.P26', 'M5.P27', 'M5.P28', 'M5.P29', 'M5.P30', 'M5.P31', 'M5.P32', 'M5.P33', 'M5.P34', 'M5.P37', 'M5.P36', 'PRECO', 'RESULTADO'];
      await page.goto(URL0);
      await page.evaluate(([k, s]) => { localStorage.clear(); localStorage.setItem(k, JSON.stringify(s)); }, [KEY, { versao: 3, R, hist }]);
      await page.reload(); await page.click('#ir');
      const st = await state();
      ok(st.versao === 4 && JSON.stringify(st.R) === JSON.stringify(R) && JSON.stringify(st.hist) === JSON.stringify(hist), 'J: estado v3 real (mesmo formato): todas as respostas e o histórico ficam iguais');
      ok(await atual() === 'RESULTADO', 'J: abre no resultado, como antes');
      const tr = await texto('#tela');
      // taxa média 0×50% + 2×30% + 4×20% = 1,4%; preço 8; 200 vendas
      ok(tr.includes('Pão de mel') && tr.includes('R$ 8,00') && tr.includes('1,4%') && tr.includes('R$ 1.600,00') && tr.includes('Internet'), 'J: resultado usa as respostas antigas (preço, taxa média por forma, faturamento 8 × 200, outros gastos)');
      ok((await texto('#entrou li[data-chave="entrega"]')) === '⚠ Entrega: não considerado (não informado)' && await page.locator('#sazonal').count() === 0, 'J: perguntas novas sem resposta: entrega aparece como "não informado", sem tabela de meses');
      await semNaN('J: resultado do estado antigo');
      console.log('PASS-stage: (J) estado salvo real mantido');
    }

    /* ===== 12. Entrega (pedido do dono, 16/11): R$ 8,00 × 6 de cada 10 = R$ 4,80 por venda ===== */
    {
      const R = { 'M5.P00': { estado: 'opcao', opcao: 'Já vendo sempre' }, 'M5.P01': { estado: 'opcao', opcao: 'Mercadoria: compro pronto para revender' }, 'M5.P10': { estado: 'valor', valor: 'Camiseta' },
        'M5.P11': { estado: 'valor', valor: '200' }, 'M5.P12': { estado: 'valor', valor: '10' }, 'M5.P13': { estado: 'opcao', opcao: 'Não' }, 'M5.P15': { estado: 'opcao', opcao: 'Não' } };
      await page.goto(URL0);
      await page.evaluate(([k, s]) => { localStorage.clear(); localStorage.setItem(k, JSON.stringify(s)); localStorage.setItem('lg2-turma-a-m04', JSON.stringify({ R: { 'M4.P04': { estado: 'opcoes', opcoes: ['Retirada presencial pelo cliente'] } } })); }, [KEY, { versao: 4, R, hist: Object.keys(R).concat('M5.ENT') }]);
      await page.reload(); await page.click('#ir');
      ok(await atual() === 'M5.ENT' && (await texto('#ent .opcao.sel')) === Motor.ENT_NAO && (await texto('.selo-m')).includes('Módulo 4'), 'ENT: Módulo 4 só com retirada -> "o cliente busca" já marcado, com selo do Módulo 4');
      ok(await clicar('#ent .opcao', Motor.ENT_PRECO) && await page.locator('#ent-preco').isVisible(), 'ENT "já está no meu preço": pede custo e quantas de 10');
      await continuar();
      ok(await erroVisivel() && (await texto('#erro')) === 'Informe quanto custa cada entrega para você.' && await atual() === 'M5.ENT', 'ENT sem custo: não avança');
      await page.fill('#ent-custo', '8,00'); await page.fill('#ent-10', '12');
      await continuar();
      ok(await erroVisivel() && (await texto('#erro')).includes('0 a 10'), 'ENT: de cada 10 vendas, no máximo 10');
      await page.fill('#ent-10', '6');
      await shot('m05_depois_entrega.png');
      await continuar(); ok(!(await erroVisivel()), 'ENT aceita'); await seguir();
      ok(JSON.stringify((await state()).R['M5.ENT']) === JSON.stringify({ estado: 'opcao', opcao: Motor.ENT_PRECO, custo: 8, tipoCusto: 'reais', aCada10: 6, cobra: null }) && await atual() === 'M5.PG', 'ENT salva no formato do contrato e segue para as formas de pagamento: ' + JSON.stringify((await state()).R['M5.ENT']));
      const st = await state();
      Object.assign(st.R, { 'M5.PG': { estado: 'valor', valor: ['Pix'] }, 'M5.P24': { estado: 'opcao', opcao: 'Não' }, 'M5.P26': { estado: 'opcao', opcao: 'Não' }, 'M5.P28': { estado: 'opcao', opcao: 'Sim' }, 'M5.P29': { estado: 'valor', valor: '500' }, 'M5.P30': { estado: 'opcao', opcao: 'Não' }, 'M5.P32': { estado: 'opcao', opcao: 'Não' }, 'M5.P34': { estado: 'opcao', opcao: 'Não' }, 'M5.P37': { estado: 'valor', valor: '100' }, 'M5.SZ': { estado: 'opcao', opcao: Motor.SZ_NAO }, 'M5.P36': { estado: 'valor', valor: '30' } });
      st.hist = Object.keys(st.R).concat('RESULTADO');
      await page.evaluate(([k, s]) => localStorage.setItem(k, JSON.stringify(s)), [KEY, st]);
      await page.reload(); await page.click('#ir');
      // 30 − 20 − 4,80 = 5,20 por venda; 500 ÷ 5,20 = 96,15 -> 97
      ok((await texto('#entrou li[data-chave="entrega"]')) === '✓ Entrega: considerado, R$ 4,80 por venda' && (await texto('#como-entrega')) === 'Como calculamos: entrega: R$ 8,00 × 6 de cada 10 vendas = R$ 4,80 por venda.', 'entrega: R$ 8,00 × 6/10 = R$ 4,80 por venda: ' + await texto('#como-entrega'));
      ok((await texto('#como-margem')).startsWith('Como calculamos: R$ 30,00 de preço − R$ 20,00 de custo − R$ 4,80 de entrega = R$ 5,20 que sobram em cada venda') && /Ponto de equilíbrio\s*97\b/.test(await texto('#tela')), 'entrega entra na sobra (5,20) e no ponto de equilíbrio (500 ÷ 5,20 -> 97)');
      await page.locator('#entrou').scrollIntoViewIfNeeded(); await shot('m05_depois_entrega_resultado.png');
      console.log('PASS-stage: entrega');
    }
    /* versão leve: cada tela de pergunta visitada com até 60 palavras visíveis antes de tocar em algo */
    {
      const lista = Object.entries(medidas);
      const faltam = M.ordem.map((q) => q.codigo).filter((c) => !(c in medidas));
      ok(lista.length >= 34, `telas de pergunta medidas: ${lista.length} (sem medida: ${faltam.join(', ')})`);
      console.log(`palavras por tela (máx.): ${JSON.stringify(medidas)} · sem medida: ${faltam.join(', ')}`);
      /* SZ e ENT: +10 palavras só para o exemplo visível pedido pelo dono */
      for (const [c, n] of lista) { const lim = c === 'M5.SZ' || c === 'M5.ENT' ? 70 : 60; ok(n <= lim, `${c}: ${n} palavras visíveis (máximo ${lim})`); }
    }
    ok(errors.length === 0, 'sem erros de JavaScript: ' + errors.join(' | '));
  } catch (e) {
    falhas.push('exceção: ' + (e && e.stack || e));
  } finally {
    if (browser) await browser.close();
    await new Promise((r) => server.close(r));
  }
  if (falhas.length) {
    console.log(`\nFAIL: ${falhas.length} falha(s), ${passes} verificações ok`);
    falhas.forEach((f) => console.log(' - ' + f));
    process.exitCode = 1;
  } else {
    console.log(`\nPASS: ${passes} verificações ok`);
  }
})();
