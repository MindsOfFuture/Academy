/* LG2 · Módulo 5 (Turma A) · teste headless das correções do grupo ("Correções Módulo 5").
   Execute: PW=<caminho do playwright> node tests/lg2-m05-turma-a.cjs
   Opcional: LG2_SHOTS=<pasta> (prints 390x844).
   Cobre: "Não sei" dos gastos fixos (P24–P35) vira botão de ajuda com o conceito da Base técnica,
   não deixa avançar sem resposta, preço (P36) depois da quantidade (P37), passo de análise do preço
   (preço possível pelo % de lucro e % de lucro reverso, faixas baixa/alta/negativa), observações,
   resultado sem NaN nos três tipos de negócio, largura do campo de nome na P33, versão do estado salvo
   e persistência após recarregar. Imprime PASS/FAIL e sai com código != 0 se falhar. */
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
ok(M.ordem[0].codigo === 'M5.P00' && M.ordem[0].pergunta === 'Como está a sua ideia hoje?', 'primeira pergunta = pergunta 1 do Módulo 1');
ok(M.ordem[M.ordem.findIndex((q) => q.codigo === 'M5.P24') - 1].codigo === 'M5.PG', 'formas de pagamento logo antes das taxas');
for (const c of ['M5.P08', 'M5.P15', 'M5.P23', 'M5.P35']) ok(Motor.proxima(M, M.porCodigo[c], { estado: 'opcao', opcao: 'Não' }, null) !== 'M5.P24', `${c}: não pula as formas de pagamento`);
ok(Motor.proxima(M, M.porCodigo['M5.P08'], { estado: 'opcao', opcao: 'Não' }, Motor.regra(M, M.porCodigo['M5.P08'], { estado: 'opcao', opcao: 'Não' })) === 'M5.PG', 'P08 Não -> formas de pagamento');
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
    const continuar = async () => { ok(await clicar('#ok', 'Continuar'), `Continuar em ${await atual()}`); };
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
      const opNaoSei = await page.evaluate(() => [...document.querySelectorAll('#ent .opcao, .btn-alt')].filter((b) => /n[ãa]o sei/i.test(b.textContent)).length);
      ok(opNaoSei === 0, `${c}: "Não sei" não aparece como opção de resposta`);
      ok(await page.locator('#naosei').count() === 1, `${c}: botão de ajuda "Não sei"`);
      ok(await page.locator('#painel').isHidden(), `${c}: painel fechado no início`);
      await page.click('#naosei');
      ok(await page.locator('#painel').isVisible(), `${c}: painel abre`);
      const painel = await texto('#painel');
      const bts = (q.fonte.match(/M5\.BT\d{2}/g) || []).map((b) => M.conceito[b]);
      for (const b of bts) {
        ok(painel.includes(norm(b.definicao)) && painel.includes(norm(b.porque)), `${c}: painel traz definição e porquê de ${b.codigo}`);
      }
      const rNS = (M.regrasDe[c] || []).filter((r) => /n[ãa]o sab|n[ãa]o sei/i.test(Motor.valorCond(r)));
      for (const r of rNS) ok(painel.includes(norm(r.texto)), `${c}: painel traz "como descobrir" (${r.codigo})`);
      ok(!/em breve/i.test(painel) && await page.locator('#painel iframe, #painel video').count() === 0, `${c}: sem vídeo/placeholder quando video vazio`);
      if (testarBloqueio) {
        await continuar();
        ok(await erroVisivel(), `${c}: Continuar sem resposta mostra erro`);
        ok((await texto('#erro')) === Motor.MSG_RESPONDA, `${c}: erro pede a resposta e indica o "Não sei" (${await texto('#erro')})`);
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
      ok(await page.locator('#naosei').count() === 1, 'P00: botão de ajuda "Não sei" já no começo');
      ok(await page.locator('#ent .opcao').count() === 4, 'P00: 4 opções ("Não sei dizer" virou ajuda)');
      await voltarNoTopo('P00');
      if (!(m1 && m1.R['M1.P01'])) await escolher(ideia);
    };
    /* formas de pagamento (múltipla escolha) */
    const formas = async (lista) => {
      const c = await atual();
      ok(c === 'M5.PG', `formas de pagamento antes das taxas (em ${c})`);
      ok(await page.locator('#naosei').count() === 1, 'PG: botão de ajuda');
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
      await page.click('#naosei');
      ok((await texto('#painel')).includes(norm(trecho)), `${onde}: ajuda traz "${trecho.slice(0, 40)}…"`);
      await page.click('#naosei');
    };

    /* ===== 0. versão do estado: resposta salva no formato antigo é descartada ===== */
    await page.goto(URL0);
    await page.evaluate((k) => localStorage.setItem(k, JSON.stringify({ R: { 'M5.P24': { estado: 'naosei' } }, hist: ['M5.P01', 'M5.P24'] })), KEY);
    await page.reload();
    ok(await page.locator('#ir').textContent() === 'Começar' && await page.locator('#zerar').count() === 0, 'estado antigo (sem versão) descartado');
    await page.evaluate((k) => localStorage.setItem(k, JSON.stringify({ versao: 2, R: { 'M5.P01': { estado: 'opcao', opcao: 'Produto' } }, hist: ['M5.P01', 'M5.P02'] })), KEY);
    await page.reload();
    ok(await page.locator('#ir').textContent() === 'Começar', 'estado da versão 2 descartado (formato da taxa mudou)');
    console.log('PASS-stage: versão do estado');

    /* ===== 1. Produto: todos os gastos fixos "Sim", preço ainda não definido (a) ===== */
    await inicio();
    await escolher('Produto');
    await teclado('P02');
    await preencher(['Bolo de pote']);                               // P02
    ok((await texto('#nota-consumo')).includes(norm(Motor.NOTA_CONSUMO.exemploProduto)) && !(await texto('#nota-consumo')).includes('cabeleireiro') && (await texto('#nota-consumo')).includes('formas, panelas, máquinas e tesouras'), 'P03: explica consumo x equipamento com exemplo de produto (bolo), não de cabeleireiro');
    ok((await texto('#nota-luz')).includes(Motor.NOTA_LUZ_AGUA), 'P03: aviso para não colocar conta de luz nem de água');
    await fonte16('.nota-orienta p');
    await shot('m05_materiais_P03.png');
    await ajudaTraz(M.regrasDe['M5.P03'].find((r) => /n[ãa]o sab/i.test(r.condicao)).texto, 'P03');
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
    ok(await page.locator('#ent .opcao').count() === 2, 'P08: só Sim/Não ("Não sei" virou ajuda)');
    await ajudaTraz(M.regrasDe['M5.P08'].find((r) => /n[ãa]o sei/i.test(r.condicao)).texto, 'P08');
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
    await checarFixo(true); await preencher(['100']);               // P27
    await checarFixo(false); await escolher('Sim');                 // P28
    await checarFixo(false);                                        // P29 aluguel
    ok((await texto('.obs')).includes('Se o seu negócio funciona dentro da sua casa, não coloque o valor total do aluguel. Coloque só a parte que o negócio usa.'), 'P29: observação do aluguel');
    await fonte16('.obs'); await fonte16('.btn-ajuda'); await fonte16('#painel p');
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
    ok(await atual() === 'M5.P37', 'depois da P35 vem a P37 (quantidade), não o preço');
    ok(!(await state()).hist.includes('M5.P36'), 'P36 ainda não visitada antes da P37');
    await preencher(['100']);                                       // P37
    ok(await atual() === 'M5.P36', 'P36 (preço) vem depois da P37');
    ok(!(await texto('#tela')).includes('compensar a quantidade pequena de vendas'), 'P36: orientação "lucro maior para quem vende pouco" retirada');
    ok(await page.locator('.btn-alt').count() === 1 && !(await texto('.btn-alt')).includes('Não sei'), 'P36: só "Ainda não defini" como alternativa');
    await alt('Ainda não defini');
    ok(await atual() === 'PRECO', 'P36 "Ainda não defini" abre o passo do lucro');
    ok((await texto('h2.q')) === 'Quanto você quer acrescentar sobre o custo? (%)', 'pergunta da % sobre o custo');
    ok((await texto('#poucas-vendas')).includes(Motor.POUCAS_VENDAS) && (await texto('#poucas-vendas')).includes('R$ 20,50'), 'passo do preço: poucas vendas + parcela 2.050 ÷ 100 = R$ 20,50');
    ok((await texto('#margem-x-acrescimo')).includes(Motor.MARGEM_X_ACRESCIMO.exemplo), 'passo do preço: exemplo acréscimo x margem');
    ok(await page.locator('#poucas-vendas').count() === 1, 'explicação das poucas vendas aparece uma vez só');
    ok(await page.locator('#res').isHidden(), 'Ver o resultado só depois de informar o %');
    await clicar('#calc', 'Continuar');
    ok(await erroVisivel() && await atual() === 'PRECO', 'passo do lucro não avança vazio');
    const MSG = Motor.MSG_PRECO;
    const lucro = async (v) => { await page.fill('#lucro', String(v)); await clicar('#calc', 'Continuar'); return texto('#analise'); };
    let t = await lucro(50);
    ok(t.includes(brl(custoProd * 1.5)) && brl(custoProd * 1.5) === 'R$ 4,65', `50% -> preço possível R$ 4,65 (tela: ${t.slice(0, 80)})`);
    // preço que cobre custo + parcela do mês + taxa: (3,10 + 20,50) / (1 - 2%) = 24,08
    ok((await texto('#preco-minimo')).includes('R$ 24,08'), 'preço mínimo com custo, taxa e parcela dos gastos do mês: R$ 24,08');
    /* "Como calculamos" embaixo dos números do passo do preço (relato das alunas, 05/11) */
    ok((await texto('#como-preco')) === 'Como calculamos: R$ 3,10 de custo + 50,0% de R$ 3,10 (R$ 1,55) = R$ 4,65.', 'como calculamos o preço possível: ' + await texto('#como-preco'));
    ok((await texto('#como-sobra')) === 'Como calculamos: R$ 4,65 de preço − R$ 3,10 de custo − R$ 0,09 de taxas = R$ 1,46 que sobram em cada venda; R$ 1,46 ÷ R$ 4,65 = 31,3% do preço.', 'como calculamos a sobra e a margem: ' + await texto('#como-sobra'));
    ok((await texto('#como-minimo')).startsWith('Como calculamos: R$ 3,10 de custo + R$ 20,50 dos gastos do mês em cada venda, divididos por 98,0%') && (await texto('#como-minimo')).endsWith('= R$ 24,08.'), 'como calculamos o preço mínimo: ' + await texto('#como-minimo'));
    ok(await page.evaluate(() => { const c = document.querySelector('#como-preco'), n = document.querySelector('#analise .nota'); return parseFloat(getComputedStyle(c).fontSize) < parseFloat(getComputedStyle(n).fontSize); }), 'como calculamos: fonte menor que a nota (discreta)');
    await shot('m05b_como_calculamos_preco.png');
    ok(!t.includes(MSG.sugerido.baixo) && !t.includes(MSG.sugerido.alto), '50%: sem aviso');
    t = await lucro(10);
    ok(t.includes(brl(custoProd * 1.1)) && t.includes(MSG.sugerido.baixo) && !t.includes(MSG.sugerido.alto), '10%: aviso de lucro baixo (a)');
    await fonte16('#analise .bloco p'); await fonte16('#analise .nota');
    await shot('04-preco-possivel-10pct-aviso.png');
    t = await lucro(150);
    ok(t.includes(brl(custoProd * 2.5)) && t.includes(MSG.sugerido.alto) && !t.includes(MSG.sugerido.baixo), '150%: aviso de lucro alto (a)');
    await semNaN('passo do preço (a)');
    await lucro(50);
    ok(await clicar('#res', 'Ver o resultado'), 'Ver o resultado');
    ok(await atual() === 'RESULTADO', 'Produto chega ao resultado');
    let tr = await texto('#tela');
    ok(tr.includes('R$ 3,10') && tr.includes('R$ 4,65'), 'resultado Produto: custo R$ 3,10 e preço possível R$ 4,65');
    // gastos do mês à mão: aluguel 500 + água/luz 150 + outros 300 = 950 fixos; perdas 100; trabalho 1000 -> 2050
    ok(tr.includes('R$ 950,00') && tr.includes('R$ 2.050,00'), 'resultado Produto: gastos do mês 950 / total 2.050');
    // sem preço informado o resultado usa o preço possível: sobra = 4,65 - 3,10 - 2% de 4,65 = 1,457 -> 2.050 / 1,457 = 1.407,0007 -> 1408 (para cima)
    ok(/Ponto de equilíbrio\s*1408\b/.test(tr) && tr.includes('Preço possível (simulação)'), 'resultado Produto: vendas para cobrir o mês arredondadas para cima (1408)');
    {
      const sobraMao = 4.65 - 3.10 - 0.02 * 4.65;           // 1,457
      const peMao = Math.ceil(2050 / sobraMao);               // 2050 / 1,457 = 1407,0007 -> 1408
      const conta = await texto('#pe-conta');
      ok(conta.startsWith('Como calculamos: R$ 2.050,00 de gastos do mês ÷ R$ 1,46 que sobram em cada venda = 1.407,0.') && conta.endsWith('1408 vendas.'), 'ponto de equilíbrio: linha "Como calculamos" com os valores da pessoa: ' + conta);
      const custoTxt = await texto('#como-custo');
      ok(custoTxt.startsWith('Como calculamos: somamos o que vai em cada unidade: Farinha R$ ') && custoTxt.includes(' + Ovo R$ ') && custoTxt.endsWith('= R$ 3,10.'), 'custo por unidade: linha "Como calculamos" com a soma dos itens: ' + custoTxt);
      if (SHOTS) { await page.evaluate(() => document.querySelector('#como-custo').scrollIntoView({ block: 'start' })); await shot('m05b_como_calculamos_resultado.png'); await page.evaluate(() => document.querySelector('#pe-conta').scrollIntoView({ block: 'center' })); await shot('m05b_como_calculamos_equilibrio.png'); }
      ok((await texto('#como-margem')).startsWith('Como calculamos: R$ 4,65 de preço − R$ 3,10 de custo − R$ 0,09 de taxas = R$ 1,46 que sobram em cada venda'), 'margem: linha "Como calculamos": ' + await texto('#como-margem'));
      ok(peMao === 1408 && conta.includes('R$ 2.050,00') && conta.includes('R$ 1,46') && conta.includes('1.407,0') && conta.includes('1408') && await page.locator('#pe-falta').count() === 0, 'ponto de equilíbrio explicado com a conta (2.050 ÷ 1,457 = 1.407,0 -> 1408): ' + conta);
    }
    ok((await texto('#tab-formas')).includes('Pix (60% das vendas)') && (await texto('#tab-formas')).includes('recebe em 30 dias') && (await texto('#tab-formas')).includes('2,0%'), 'resultado: taxa e prazo por forma + taxa média 2,0%');
    ok((await texto('#margem-x-acrescimo')).includes(Motor.MARGEM_X_ACRESCIMO.exemplo), 'resultado: explicação acréscimo x margem');
    ok(await page.locator('#simulacao').count() === 0, 'quem já vende sempre: sem aviso de simulação');
    {
      const ent = await texto('#entendemos');
      const nfr = await page.locator('#entendemos p').count();
      /* texto corrido (relatório do Bento): 1 a 3 parágrafos, sem lista */
      ok(nfr >= 1 && nfr <= 3, `"O que entendemos até aqui": 1 a 3 parágrafos (${nfr})`);
      ok(await page.evaluate(() => { const e = document.getElementById('entendemos'); return !e.querySelector('ul, ol, li') && e.querySelectorAll('p').length >= 1; }), '"O que entendemos até aqui" em texto corrido (sem <li>, com <p>)');
      ok((await page.evaluate(() => document.querySelector('#entendemos p').textContent)).includes('Você já vende'), '1º parágrafo junta o que analisou e o estágio');
      ok(ent.startsWith('O que entendemos até aqui') && ent.includes('o produto “Bolo de pote”') && ent.includes('Você já vende') && ent.includes('R$ 3,10') && ent.includes('R$ 2.050,00') && ent.includes('1408 unidades por mês'), 'entendemos (Produto): item, estágio, custo, gastos do mês e vendas para cobrir: ' + ent);
      ok(await page.evaluate(() => { const e = document.getElementById('entendemos'), r = document.querySelector('#numeros .res-num'); return !!e && !!r && (e.compareDocumentPosition(r) & Node.DOCUMENT_POSITION_FOLLOWING) > 0; }), 'entendemos fica acima das contas de custo/preço');
      ok(!/M5\.|M1\.|Módulo \d, pergunta/.test(ent), 'entendemos sem códigos de pergunta');
    }
    ok((await texto('#descontados')).includes('o valor que você separa pelo seu trabalho'), 'resultado: explica o que já foi descontado (inclui a remuneração)');
    await semNaN('resultado Produto');
    await shot('06-resultado-produto.png');
    const salvo = await state();
    await page.reload();
    ok(await clicar('#ir', 'Continuar de onde parei'), 'Continuar de onde parei após recarregar');
    ok(await atual() === 'RESULTADO' && (await texto('#tela')).includes('R$ 4,65'), 'resultado persiste após recarregar');
    ok(JSON.stringify(await state()) === JSON.stringify(salvo) && salvo.versao === 3 && salvo.lucro === '50', 'estado salvo (versão 3, lucro 50) persiste');
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
    ok(await page.inputValue('#sim-preco') === '30' && await page.inputValue('#sim-qtd') === '50', 'simulação começa com o preço e a quantidade informados');
    await page.fill('#sim-preco', '25'); await page.fill('#sim-qtd', '10'); await page.click('#sim-ok');
    ok((await texto('#sim-res')).includes('R$ 5,00') && (await texto('#sim-res')).includes('R$ 50,00'), 'simular R$ 25 x 10 vendas: sobra R$ 5,00, resultado R$ 50,00');
    ok((await state()).R['M5.P36'].valor === '30', 'simular não muda as respostas');
    ok(tr.includes('R$ 1.500,00'), 'resultado Mercadoria: faturamento 50 x 30 = 1.500');
    ok(await page.evaluate(() => [...document.querySelectorAll('#numeros .secao-titulo, #numeros .lbl')].filter((e) => /^acréscimo sobre o custo$/i.test(e.textContent.trim())).length) === 1, 'rótulo "Acréscimo sobre o custo" uma vez só no resultado');
    ok(await page.locator('#aviso-acrescimo, #fat-alto, #aviso-investimento').count() === 0, 'valores comuns: sem avisos de valor fora do comum');
    ok((await texto('#pe-falta')).includes('falta informar os gastos fixos do mês'), 'Mercadoria sem gastos do mês: diz o que falta para o ponto de equilíbrio');
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
    ok(await page.inputValue('#ent input') === 'Corte de cabelo' && (await texto('.selo-m')).includes('Módulo 1'), 'P17: nome trazido do Módulo 1 (pergunta 3)');
    await continuar(); await seguir();      // P17
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
    await page.click('#naosei');
    ok((await texto('#painel')).includes(Motor.EXEMPLO_TIPO['M5.BT04']['Serviço']) && !(await texto('#painel')).includes('confeitaria'), 'P26 (serviço): exemplo de perda de serviço, não de confeitaria');
    await escolher('Não');                  // P26
    await escolher('Sim'); await preencher(['300']);                          // P28/P29
    await escolher('Não');                  // P30
    await escolher('Não');                  // P32
    await escolher('Não');                  // P34
    ok(!(await texto('.btn-alt')).includes('Não sei'), 'P37: "Não sei" não é resposta');
    await alt('Ainda não comecei a vender'); // P37
    ok(await atual() === 'M5.P36', 'Serviço: P37 -> P36');
    await alt('Ainda não defini');          // P36
    ok(await atual() === 'PRECO', 'Serviço: P36 Ainda não defini -> passo do lucro');
    t = await lucro(30);
    ok(t.includes(brl(1.5 * 1.3)), 'Serviço: 30% -> preço possível R$ 1,95');
    ok(await clicar('#res', 'Ver o resultado'), 'Ver o resultado (Serviço)');
    tr = await texto('#tela');
    ok(tr.includes('R$ 1,50') && tr.includes('R$ 1,95'), 'resultado Serviço: custo 1,50 e preço possível 1,95');
    ok((await texto('#simulacao')).includes(Motor.MSG_SIMULACAO), 'ainda não comecei a vender: resultado marcado como simulação');
    // sobra por atendimento 1,95 - 1,50 - 3% = 0,3915 -> aluguel 300 / 0,3915 = 766,3 -> 767
    ok(/Ponto de equilíbrio\s*767\b/.test(tr), 'Serviço: 767 atendimentos para cobrir o mês (para cima)');
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
    ok(await atual() === 'M5.P17' && JSON.stringify((await state()).hist) === '["M5.P17"]', 'tipo do Módulo 1: P00 e P01 puladas, abre no nome do serviço');
    {
      const r01 = (await state()).R['M5.P01'];
      ok(r01.estado === 'opcao' && r01.opcao === 'Serviço: meu cliente paga pelo trabalho que realizo' && r01.herdado === 'M1', 'M5.P01 gravada no mesmo formato ({estado, opcao}) + marca de herança');
    }
    ok((await texto('#seu-negocio')).includes('Seu negócio: Lava-jato em domicílio · Serviço'), 'cartão "Seu negócio: <ideia> · <tipo>"');
    ok((await texto('#neg-tipo')).includes('Veio do Módulo 1') && (await texto('#neg-tipo .alterar')) === 'Trocar', 'tipo herdado com selo e Trocar');
    ok((await texto('#seu-negocio')).includes('Confira e ajuste se quiser'), 'cartão pede para conferir');
    ok(await page.locator('.contexto').count() === 0, 'cartão substitui a etiqueta "Tipo escolhido"');
    ok(await page.inputValue('#ent input') === 'Lava-jato em domicílio', 'nome do serviço vem do Módulo 1');
    await shot('m05_herdado_nome_servico.png');
    await continuar(); await seguir();      // P17
    await escolher('Não');                  // P18 -> P23
    await preencher(['1', '0']);            // P23
    await formas(['Pix']);
    await escolher('Não');                  // P24
    await escolher('Não');                  // P26
    await escolher('Sim'); await preencher(['200']);   // P28/P29
    await escolher('Não'); await escolher('Não'); await escolher('Não');
    await preencher(['40']);                // P37
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
    ok(await atual() === 'M5.P10' && !(await state()).R['M5.P01'].herdado, 'trocar para Mercadoria: segue o fluxo da mercadoria, sem marca de herança');
    ok(!(await texto('#neg-tipo')).includes('Veio do Módulo 1') && (await texto('#neg-tipo')).includes('Mercadoria'), 'cartão mostra o tipo trocado, sem selo');
    ok(await clicar('#neg-tipo .alterar', 'Trocar') && await atual() === 'M5.P01' && JSON.stringify((await state()).hist.slice(-2)) !== '["M5.P10","M5.P01"]', 'Trocar no cartão substitui a tela do nome no histórico');
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
      ok(await page.locator('details#ajuste').count() === 1 && !(await page.evaluate(() => document.getElementById('ajuste').open)) && norm(await page.textContent('#ajuste summary')) === 'Ajustar valores e recalcular', 'ajuste: caixa "Ajustar valores e recalcular" no resultado, recolhida');
      ok(await clicar('[data-ir-ajuste]', 'Mudou algum valor? Ajuste aqui e recalcule ↓') && await page.evaluate(() => document.getElementById('ajuste').open), 'ajuste: atalho embaixo da composição do custo abre a caixa');
      const campos = () => page.evaluate(() => [...document.querySelectorAll('#ajuste tr')].map((tr) => ({ rot: tr.cells[0].textContent.trim().replace(/\s*\([^)]*\)$/, ''), un: tr.cells[0].textContent.trim(), v: (tr.querySelector('input') || {}).value })));
      const cs = await campos();
      const pega = (rot, n = 0) => cs.filter((x) => x.rot === rot)[n];
      ok(pega('Farinha') && pega('Preço que você paga').v === '10' && pega('Quanto vem quando compra').v === '1' && pega('Quanto usa').v === '500' && pega('Preço que você paga', 1).v === '12'
        && pega('Quantas unidades você faz com essas quantidades').v === '10' && pega('Preço do pacote').v === '20' && pega('Quantas vêm no pacote').v === '10', 'ajuste: tabela traz os materiais, o rendimento e a embalagem com os valores respondidos ' + JSON.stringify(cs));
      ok(pega('Quanto vem quando compra').un === 'Quanto vem quando compra (kg)' && pega('Quanto usa').un === 'Quanto usa (g)', 'ajuste: unidade respondida aparece ao lado do nome');
      ok(pega('Aluguel').v === '300' && pega('Água e luz').v === '' && pega('Internet').v === '100' && pega('Preço de venda').v === '15' && pega('Vendas no mês').v === '50', 'ajuste: gastos do mês, preço e vendas na tabela');
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
      ok(JSON.stringify(st.hist) === JSON.stringify(hist0) && st.versao === 3 && st.ajusteOrig && st.ajusteOrig['M5.P04'].valor[0] === '10', 'Recalcular: continua no resultado, versão do estado igual, cópia para o Limpar');
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
