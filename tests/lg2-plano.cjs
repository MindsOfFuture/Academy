/* Plano de negócio da jornada do LG2 (public/lg2/jornada/js/plano.js); execute: node tests/lg2-plano.cjs.
   1. Contas (Node): PlanoNegocio.indicadores() com números conferidos à mão.
   2. Navegador: semeia respostas sintéticas dos 10 módulos, toca "Baixar meu plano de negócio" (fim da jornada e diagnóstico),
      confere na impressão os capítulos em ordem, os blocos financeiros A–H separados e nada técnico; gera o PDF de exemplo.
   Env: SHOTS=<pasta> grava plano_exemplo.pdf e PNG de páginas; PLANO_ESTADO=<backup .json> + PLANO_PDF=<saída> monta o plano
   com um progresso salvo (uso local, nunca no repositório). */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const publicRoot = path.resolve(__dirname, '..', 'public');
const P = require(path.join(publicRoot, 'lg2', 'jornada', 'js', 'plano.js'));
let falhas = 0;
const ok = (nome, fn) => { try { fn(); console.log('ok  ', nome); } catch (e) { falhas++; console.log('FAIL', nome, '\n   ', e.message); } };

/* ---------- 1. contas à mão ---------- */
const op = (o) => ({ estado: 'opcao', opcao: o });
const v = (x) => ({ estado: 'valor', valor: x });
const SZ_SIM = 'Sim, tem meses mais fortes e mais fracos';
// Mercadoria: compra R$ precoCompra por 100 unidades; aluguel 1.000 + água e luz 200 + pró-labore 500 = 1.700 por mês
function m5(preco, compra100, qtd, extra) {
  return { versao: 3, R: Object.assign({
    'M5.P01': op('Mercadoria: compro pronto para revender'), 'M5.P10': v('brigadeiro'), 'M5.P11': v(String(compra100)), 'M5.P12': v('100'),
    'M5.P13': op('Não'), 'M5.P15': op('Não'), 'M5.P24': op('Não'), 'M5.P26': op('Não'),
    'M5.P28': op('Sim'), 'M5.P29': v('1.000'), 'M5.P30': op('Sim'), 'M5.P31': v('200'), 'M5.P32': op('Não'),
    'M5.P34': op('Sim'), 'M5.P35': v('500'), 'M5.P36': v(preco), 'M5.P37': v(String(qtd)) }, extra || {}) };
}
const m6 = (inv) => ({ R: { 'M6.P02': v(inv), 'M6.P07': v('1.000,00'), 'M6.P05': v('2.750'), 'M6.P08': op('Na hora') } });
const bloco = (ind, id) => ind.blocos.find((b) => b.id === id);
const linha = (b, re) => b.linhas.find((l) => re.test(l.rotulo));
const HOJE = '2026-11-16';

ok('margem: preço 9,50 e custo 1,35 → sobra 8,15 = 85,8%; fixos 1.700 → 209 vendas', () => {
  const i = P.indicadores({ 5: m5('9,50', 135, 300) }, { hoje: HOJE });
  assert.equal(i.variavel.total, 1.35);
  assert.equal(i.margem.mc, 8.15);
  assert.equal(Math.round(i.margem.pct * 10) / 10, 85.8);
  assert.equal(i.fixos.total, 1700);
  assert.equal(i.equilibrio.unidades, 209);       // 1700 / 8,15 = 208,6 → 209
  assert.equal(i.equilibrio.reais, 1985.5);       // 209 × 9,50
  const e = bloco(i, 'e');
  assert.ok(e.como.includes('Como calculamos: R$ 9,50 (preço) − R$ 1,35 (custo de cada venda) = R$ 8,15 por venda.'), e.como.join(' | '));
  assert.ok(e.como.includes('Em porcentagem: R$ 8,15 ÷ R$ 9,50 = 85,8% do preço.'));
  assert.ok(bloco(i, 'f').como[0].includes('R$ 1.700,00 (custos do mês) ÷ R$ 8,15 (sobra de cada venda) = 208,6; arredondamos para cima: 209 vendas por mês.'), bloco(i, 'f').como[0]);
  assert.ok(bloco(i, 'c').como[0].endsWith('= R$ 1.700,00 por mês.'));
  assert.equal(linha(bloco(i, 'c'), /^Aluguel/).valor, 1000);
  assert.equal(linha(bloco(i, 'c'), /pró-labore/).valor, 500);
});

ok('retorno: investimento R$ 5.000 e lucro R$ 500 por mês → ROI 120% ao ano, payback 10 meses', () => {
  // preço 10, custo 2 → sobra 8; 275 vendas × 8 = 2.200 − 1.700 = 500 de lucro
  const i = P.indicadores({ 5: m5('10', 200, 275), 6: m6('5.000,00') }, { hoje: HOJE });
  assert.equal(i.resultado.lucro, 500);
  assert.equal(i.investimento.total, 5000);
  assert.equal(i.retorno.anual, 6000);
  assert.equal(i.retorno.roi, 120);
  assert.equal(i.retorno.payback, 10);
  const h = bloco(i, 'h');
  assert.ok(h.como.includes('ROI: R$ 6.000,00 (lucro em um ano) ÷ R$ 5.000,00 (investimento inicial) = 120% ao ano.'), h.como.join(' | '));
  assert.ok(h.como.includes('Payback: R$ 5.000,00 (investimento) ÷ R$ 500,00 (lucro médio por mês) = 10 meses.'));
  assert.ok(bloco(i, 'g').como[0].includes('275 vendas × R$ 10,00 = R$ 2.750,00 de receita; R$ 2.750,00 − R$ 550,00 (custo das vendas) − R$ 1.700,00 (custos fixos) = R$ 500,00.'));
  // capital de giro: projeção de 13 semanas do Módulo 6, com o menor saldo e o que falta
  assert.ok(i.giro && i.giro.semanas.length === 13, 'fluxo de 13 semanas');
  assert.equal(i.giro.capital, Math.max(0, -Math.min(...i.giro.semanas.map((s) => s.final))));
  assert.equal(i.giro.saldoInicial, 1000);
});

ok('época do ano: meses fortes e fracos mudam o lucro do ano', () => {
  const sz = { 'M5.SZ': { estado: 'opcao', opcao: SZ_SIM, fortes: [11, 12], fracos: [1], maisPct: 50, menosPct: 50 } };
  const i = P.indicadores({ 5: m5('10', 200, 275, sz), 6: m6('5.000,00') }, { hoje: HOJE });
  assert.equal(i.resultado.cenarios.forte.qtd, 413);       // 275 × 1,5 = 412,5 → 413
  assert.equal(i.resultado.cenarios.forte.lucro, 1604);    // 413 × 8 − 1.700
  assert.equal(i.resultado.cenarios.fraco.lucro, -596);    // 138 × 8 − 1.700
  assert.equal(i.retorno.anual, 7112);                     // 9 × 500 + 2 × 1.604 − 596
});

ok('dado que falta vira "não informado (Etapa N)" e o indicador dependente diz o porquê', () => {
  const i = P.indicadores({ 5: m5('10', 200, 275) }, { hoje: HOJE });
  assert.equal(i.investimento.total, null);
  assert.equal(linha(bloco(i, 'a'), /Investimento/).falta, 'não informado (Etapa 6)');
  assert.equal(linha(bloco(i, 'b'), /Capital/).falta, 'não informado (Etapa 6)');
  assert.match(linha(bloco(i, 'h'), /ROI/).falta, /não calculado: investimento inicial não informado \(Etapa 6\)/);
  assert.equal(i.retorno.roi, null);
  const vazio = P.indicadores({}, { hoje: HOJE });
  assert.equal(linha(bloco(vazio, 'c'), /Custos fixos/).falta, 'não informado (Etapa 5)');
  assert.equal(linha(bloco(vazio, 'e'), /Preço/).falta, 'não informado (Etapa 5)');
  assert.match(linha(bloco(vazio, 'f'), /empatar/).falta, /^não calculado/);
  assert.ok(vazio.blocos.every((b) => b.linhas.every((l) => l.valor === null || l.valor === 0 || isFinite(l.valor))));
  // aluguel com "Sim" e sem valor: não vira zero
  const semAluguel = m5('10', 200, 275); delete semAluguel.R['M5.P29'];
  const j = P.indicadores({ 5: semAluguel }, { hoje: HOJE });
  assert.equal(linha(bloco(j, 'c'), /^Aluguel/).falta, 'não informado (Etapa 5)');
  assert.equal(j.fixos.completo, false);
  // prejuízo: ROI e payback não são calculados, com o motivo
  const k = P.indicadores({ 5: m5('10', 200, 100), 6: m6('5.000,00') }, { hoje: HOJE });
  assert.equal(k.resultado.lucro, -900);
  assert.match(linha(bloco(k, 'h'), /payback/).falta, /sem lucro/);
});

ok('payback menor que um mês aparece em dias', () => {
  const i = P.indicadores({ 5: m5('10', 200, 275), 6: m6('100') }, { hoje: HOJE });
  assert.ok(bloco(i, 'h').como.some((t) => t.includes('menos de 1 mês (cerca de 6 dias)')), bloco(i, 'h').como.join(' | '));
});

/* ---------- 2. navegador ---------- */
let playwright;
try { playwright = require('playwright'); } catch { playwright = require(process.env.PW); }
const OFERTA = 'bolo de pote';
const FIXTURE = {
  'lg2-jornada': { v: 1, feitos: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], atual: null },
  'lg2-turma-a-m01': { v: 4, atual: 'RESULTADO', R: {
    'M1.P01': op('Já vendi algumas vezes'), 'M1.P02': op('Quero ter uma renda extra'), 'M1.P03': v(OFERTA),
    'M1.P03A': op('Produto: eu compro materiais e faço o que vendo'), 'M1.P05': op('De 1 a 3 horas por dia'), 'M1.P07': op('Entre R$ 500 e R$ 1.000') } },
  'lg2-turma-b-m02': { v: 3, R: { 'M2.P01': op('Sim'), 'M2.P02': v('mães que trabalham fora e querem sobremesa pronta'), 'M2.P07': op('Pessoas'),
    'M2.P18': v('8'), 'M2.P21': op('Contaram um problema de verdade') }, hist: ['M2.P01'], fichas: [], plano: { meta: 'conversar com 10 pessoas', prazo: '2 semanas', feitos: [] } },
  'lg2-turma-a-m03': { v: 7, R: {
    'M3.P02': op('Sim'), 'M3.P04': { estado: 'naosei' }, 'M3.P09': op('No meu bairro e na minha cidade'),
    'M3.P11': v('falta de tempo para fazer doce'),
    'M3.P15': { estado: 'valor', valor: 'Doce da Ana, Padaria Central', nomes: ['Doce da Ana', 'Padaria Central'] },
    'M3.P18': { estado: 'valor', valor: '…', porNome: { 'Doce da Ana': 'vende por encomenda no WhatsApp', 'Padaria Central': 'vitrine na loja' } },
    'M3.P20': { estado: 'valor', valor: 'de R$ 8,00 a R$ 12,00', min: 8, max: 12, porNome: { 'Doce da Ana': { min: 8, max: 10, valor: 'de R$ 8,00 a R$ 10,00' }, 'Padaria Central': { min: 12, max: 12, valor: 'R$ 12,00' } } },
    'M3.P22': { estado: 'valor', valor: '…', porNome: { 'Doce da Ana': 'entrega rápida', 'Padaria Central': 'muitos sabores' } },
    'M3.P19': { estado: 'valor', valor: '…', porNome: { 'Doce da Ana': { tabela: { 'Preço': 'Igual', 'Qualidade': 'Melhor' } }, 'Padaria Central': { tabela: { 'Preço': 'Melhor', 'Qualidade': 'Igual' } } } },
  }, hist: ['M3.P02', 'RESULTADO'] },
  'lg2-turma-a-m04': { v: 5, R: { 'M4.PV1': v('falta de tempo para fazer sobremesa'), 'M4.PV2': v('porque entrego no mesmo dia'), 'M4.PV3': v('sobremesa caseira pronta'),
    'M4.P14': op('Vender pouca quantidade, já com preço'), 'M4.P20': v('7'), 'M4.P21': v('250') }, hist: ['M4.PV1', 'RESULTADO'] },
  'lg2-turma-a-m05': { versao: 3, R: {
    'M5.P00': { estado: 'opcao', opcao: 'Já vendi algumas vezes', herdado: 'M1' }, 'M5.P01': { estado: 'opcao', opcao: 'Produto: eu compro materiais e faço o que vendo', herdado: 'M1' },
    'M5.P02': v(OFERTA), 'M5.P03': v(['leite condensado', 'creme de leite']), 'M5.P04': v(['8', '4,50']),
    'M5.P05': v([{ q: '395', u: 'g' }, { q: '200', u: 'g' }]), 'M5.P06': v([{ q: '395', u: 'g' }, { q: '200', u: 'g' }]), 'M5.P07': v('10'),
    'M5.P08': op('Sim'), 'M5.P09': v({ preco: '15', qtd: '50' }), 'M5.PG': v(['Pix', 'Cartão de crédito']),
    'M5.P24': op('Sim'), 'M5.P25': v([{ forma: 'Pix', taxa: '0', prazo: '0', parte: '60' }, { forma: 'Cartão de crédito', taxa: '4', prazo: '30', parte: '40' }]),
    'M5.P26': op('Sim'), 'M5.P27': v('30'), 'M5.P28': op('Não'), 'M5.P30': op('Sim'), 'M5.P31': v('80'),
    'M5.P32': op('Sim'), 'M5.P33': v([{ nome: 'Internet', v: '50' }]), 'M5.P34': op('Sim'), 'M5.P35': v('600'),
    'M5.SZ': { estado: 'opcao', opcao: SZ_SIM, fortes: [12], fracos: [1, 2], maisPct: 40, menosPct: 30 },
    'M5.P37': v('250'), 'M5.P36': v('8') }, hist: ['M5.P01', 'RESULTADO'] },
  'lg2-turma-b-m06': { dados: 'x', R: { 'Negócio': { estado: 'opcao', opcao: 'Produto', herdado: 1 }, 'M6.P01': v('batedeira, potes e forno'), 'M6.P02': v('1.200,00'),
    'M6.P03': op('À vista'), 'M6.P05': v('2.000,00'), 'M6.P06': v('luz 80, internet 50'), 'M6.P07': v('500,00'), 'M6.P08': op('Na hora') }, hist: ['M6.P01'], prio: {}, fora: [] },
  'lg2-turma-b-m07': { v: 1, ini: { oferta: OFERTA, tipo: 'Produto: eu faço o que vendo', horas: 'Até 10 h' }, R: {
    'M7-02': { estado: 'valor', h: '2', m: '15', un: '10', min: 135, minUn: 13.5 }, 'M7-04': { estado: 'opcao', opcao: 'Sim, alguém da família', horas: 4 },
    'M7-05': op('O tempo que eu tenho'), 'M7-13': op('Sim, pode seguir') }, mapa: ['Receber o pedido', 'Preparar', 'Embalar', 'Entregar'], hist: ['M7-02', 'RESULTADO'] },
  'lg2-turma-b-m08': { R: { 'M8.P04': v('2.000'), 'M8.P05': op('Não'), 'M8.P07': op('Sim') }, hist: ['M8.P04', 'M8.P05'] },
  'lg2-turma-b-m09': { R: { 'M9-01': op('Minas Gerais'), 'M9-02': op('Sim'), 'M9-03': op('Em casa'), 'M9-04': op('Ainda não fiz') }, hist: ['M9-01'] },
  'lg2-turma-b-m10': { R: { 'M10-02': op('No mesmo dia'), 'M10-09': { estado: 'multi', opcoes: ['Divulgar mais'] },
    'M10-11': { estado: 'plano', acao: 'postar o cardápio no status', data: '2026-12-01', sinal: 'pedidos', numero: '10', unidade: 'pedidos' } }, hist: ['M10-02'] },
};

const CAPS = ['Resumo executivo', 'O empreendedor', 'Clientes', 'Mercado e concorrência', 'Produto e proposta de valor', 'Custos e preço',
  'Investimento e fluxo de caixa', 'Operação', 'Formalização', 'Licenças e endereço', 'Vendas, pessoas e plano de ação', 'Indicadores financeiros',
  'Pontos em aberto e próximos passos', 'Fontes consultadas'];
const BLOCOS = ['Investimento inicial', 'Capital de giro', 'Custos fixos do mês', 'Custo variável de cada venda', 'Preço e margem de contribuição',
  'Ponto de equilíbrio', 'Receita e lucro do mês', 'Retorno do investimento'];

function lerBackup(arq) {
  const j = JSON.parse(fs.readFileSync(arq, 'utf8')); const row = Array.isArray(j) ? j[0] : j;
  let d = row.dados; if (typeof d === 'string') d = JSON.parse(d);
  const out = {}; for (const [k, x] of Object.entries(d)) out[k] = typeof x === 'string' ? JSON.parse(x) : x;
  return out;
}

(async () => {
  const server = http.createServer((req, res) => {
    const name = path.resolve(publicRoot, '.' + decodeURIComponent(req.url.split('?')[0]));
    if (!name.startsWith(publicRoot + path.sep)) { res.writeHead(403).end(); return; }
    fs.readFile(name, (error, bytes) => {
      if (error) { res.writeHead(404).end(); return; }
      const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.webp': 'image/webp', '.jpg': 'image/jpeg' };
      res.writeHead(200, { 'Content-Type': types[path.extname(name)] || 'application/octet-stream' }).end(bytes);
    });
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}`;
  const shots = process.env.SHOTS;
  let browser;
  try {
    browser = await playwright.chromium.launch({ headless: true });
    async function abrir(estado) {
      const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
      await ctx.addInitScript((est) => {
        if (window.top === window && !sessionStorage.getItem('semeado')) {
          sessionStorage.setItem('semeado', '1'); localStorage.clear();
          for (const [k, x] of Object.entries(est)) localStorage.setItem(k, JSON.stringify(x));
        }
        window.__impressoes = 0; window.print = () => { window.__impressoes++; };
      }, estado);
      const page = await ctx.newPage();
      page.errors = [];
      page.on('pageerror', (e) => page.errors.push(e.message));
      page.on('response', (r) => { if (r.status() >= 400) page.errors.push(r.status() + ' ' + r.url()); });
      await page.goto(base + '/lg2/jornada/index.html');
      return { ctx, page };
    }
    const esperarPlano = (page) => page.waitForFunction(() => window.__impressoes > 0 && document.getElementById('plano').getAttribute('data-pronto') === '1' && document.body.classList.contains('imprime-plano'), null, { timeout: 20000 });
    const lerPlano = (page) => page.evaluate(() => {
      const p = document.getElementById('plano');
      return {
        caps: [...p.querySelectorAll('.pl-cap > .pl-cab h2')].map((h) => h.textContent),
        blocos: [...p.querySelectorAll('.pl-cap-ind .pl-ind')].map((a) => ({ id: a.dataset.bloco, titulo: a.querySelector('h3').textContent, texto: a.innerText, separado: a.parentElement.classList.contains('pl-inds') })),
        texto: p.innerText, capa: p.querySelector('.pl-capa').innerText, visivel: getComputedStyle(p).display,
        outros: [...document.body.children].filter((e) => e !== p && e.tagName !== 'SCRIPT').map((e) => getComputedStyle(e).display),
        conc: [...p.querySelectorAll('.pl-conc tbody tr')].map((tr) => tr.innerText.replace(/\s+/g, ' ')),
        fluxo: [...p.querySelectorAll('.pl-fluxo li, .lg2-diag-passo')].map((li) => li.innerText.replace(/\s+/g, ' ').trim()),
        fontes: p.querySelectorAll('.pl-fontes li').length, logos: p.querySelectorAll('.pl-logos img').length,
        pdfTitulo: document.title,
      };
    });

    /* ---------- 2a. fim da jornada → Baixar meu plano de negócio ---------- */
    const { ctx, page } = await abrir(FIXTURE);
    await page.waitForSelector('#fim:not([hidden])');
    const bt = page.getByRole('button', { name: 'Baixar meu plano de negócio', exact: true });
    assert.ok(await bt.isVisible(), 'botão "Baixar meu plano de negócio" no fim da jornada');
    await bt.click();
    await esperarPlano(page);
    const tela = await page.evaluate(() => getComputedStyle(document.getElementById('plano')).display);
    ok('na tela o plano fica escondido (só sai na impressão)', () => assert.equal(tela, 'none'));
    await page.emulateMedia({ media: 'print' });
    await page.evaluate(() => document.body.setAttribute('data-ctr', String(Date.now())));   // dispara o auditor de contraste na vista de impressão
    await page.waitForTimeout(700);
    const d = await lerPlano(page);
    ok('impressão mostra só o plano', () => { assert.equal(d.visivel, 'block'); assert.ok(d.outros.every((x) => x === 'none'), JSON.stringify(d.outros)); });
    ok('capítulos na ordem', () => assert.deepEqual(d.caps, CAPS));
    ok('capa com o negócio, data e sumário', () => {
      assert.match(d.capa, /Plano de negócio/); assert.match(d.capa, new RegExp(OFERTA)); assert.match(d.capa, /\d{1,2} de [a-zç]+ de \d{4}/); assert.match(d.capa, /Sumário/);
      assert.match(d.pdfTitulo, /^Plano de negócio - bolo de pote$/);
    });
    ok('indicadores em 8 blocos separados A–H, na ordem', () => {
      assert.deepEqual(d.blocos.map((b) => b.id), ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']);
      d.blocos.forEach((b, i) => { assert.ok(b.titulo.startsWith(BLOCOS[i]), b.titulo); assert.ok(b.separado); });
      d.blocos.forEach((b) => assert.ok(/Como calculamos|Lucro em um ano|não informado|não calculado|não se aplica/.test(b.texto), 'bloco ' + b.id + ' explica a conta'));
    });
    ok('contas da fixture aparecem com os valores certos', () => {
      const blk = (id) => d.blocos.find((b) => b.id === id).texto;
      assert.match(blk('a'), /R\$ 1\.200,00/);
      assert.match(blk('c'), /R\$ 760,00/);                // 80 + 50 + 600 + 30
      // custo por venda: leite 8,00/10 + creme 4,50/10 + embalagem 0,30 + taxa 4% × 40% de 8,00 = 0,80 + 0,45 + 0,30 + 0,13 = 1,68
      assert.match(blk('d'), /Total por venda\s+R\$ 1,68/);
      assert.match(blk('e'), /R\$ 8,00 \(preço\) − R\$ 1,68 \(custo de cada venda\) = R\$ 6,32 por venda/);
      assert.match(blk('e'), /79%/);                       // 6,32 / 8 = 79,0%
      assert.match(blk('f'), /121 vendas/);                // 760 / 6,32 = 120,25 → 121
      assert.match(blk('g'), /Lucro do mês\s+R\$ 820,00/); // 250 × 6,32 − 760 = 820
      assert.match(blk('g'), /mês forte \(dezembro\)/); assert.match(blk('g'), /mês fraco \(janeiro e fevereiro\)/);
      assert.match(blk('h'), /ROI/); assert.match(blk('h'), /payback/);
    });
    ok('concorrentes em tabela, um por linha', () => {
      assert.equal(d.conc.length, 2);
      assert.match(d.conc[0], /Doce da Ana .*encomenda.*de R\$ 8,00 a R\$ 10,00.*entrega rápida.*Preço: igual; Qualidade: melhor/);
    });
    ok('operação como fluxo de etapas', () => assert.deepEqual(d.fluxo.map((t) => t.replace(/^\d+\s*/, '')), ['Receber o pedido', 'Preparar', 'Embalar', 'Entregar']));
    ok('pontos em aberto, próximos passos, fontes, limites e logos', () => {
      assert.match(d.texto, /Você viu alguma novidade recente/);
      assert.match(d.texto, /postar o cardápio no status/);
      assert.ok(d.fontes >= 5, 'fontes dos módulos: ' + d.fontes);
      assert.ok(d.texto.includes(P.AVISO));
      assert.ok(d.logos >= 6, 'barra FACC/UFJF/Governo de MG na capa e no fim');
    });
    ok('nada técnico nem quebrado no texto', () => {
      assert.doesNotMatch(d.texto, /undefined|NaN|\[object|null\b|Infinity/);
      assert.doesNotMatch(d.texto, /\bM\d{1,2}[.-]P?\d/, 'nenhum código de pergunta');
      assert.doesNotMatch(d.texto, /Grupo \d|Rafael|"estado"|\bnaosei\b/i);
      assert.doesNotMatch(d.texto, /\d\.\d{2}\b(?!\d)/, 'dinheiro sem ponto decimal americano');
    });
    if (shots) {
      const pdf = path.join(shots, 'plano_exemplo.pdf');
      await page.pdf({ path: pdf, format: 'A4', printBackground: true, preferCSSPageSize: true });
      const paginas = execFileSync('pdfinfo', [pdf]).toString().match(/Pages:\s+(\d+)/)[1];
      console.log('PDF:', pdf, '·', paginas, 'páginas');
      const pgDe = (re) => { for (let i = 1; i <= Number(paginas); i++) { if (re.test(execFileSync('pdftotext', ['-f', String(i), '-l', String(i), pdf, '-']).toString())) return i; } return 1; };
      const pInd = pgDe(/^12\s+Indicadores financeiros/m);
      for (const [pg, nome] of [[1, 'capa'], [pInd, 'indicadores'], [pInd + 1, 'indicadores2']]) {
        execFileSync('pdftoppm', ['-png', '-r', '70', '-f', String(pg), '-l', String(pg), '-singlefile', pdf, path.join(shots, 'plano_exemplo_' + nome)]);
      }
    }
    await page.emulateMedia({ media: 'screen' });
    ok('sem erros de página (fim)', () => assert.deepEqual(page.errors, []));
    await ctx.close();

    /* ---------- 2b. pelo diagnóstico: plano e diagnóstico continuam imprimindo cada um o seu ---------- */
    const meio = { ...FIXTURE, 'lg2-jornada': { v: 1, feitos: [1, 3], atual: 2 } };
    const b2 = await abrir(meio);
    await b2.page.waitForFunction(() => document.getElementById('modulo').contentDocument && document.getElementById('modulo').contentDocument.readyState === 'complete');
    await b2.page.click('#abre-painel');
    await b2.page.click('#ver-diag-painel');
    await b2.page.waitForFunction(() => document.querySelectorAll('#diag-corpo .diag-modulo').length === 10);
    await b2.page.click('#baixa-plano-diag');
    await esperarPlano(b2.page);
    await b2.page.emulateMedia({ media: 'print' });
    const viaDiag = await b2.page.evaluate(() => ({ plano: getComputedStyle(document.getElementById('plano')).display, diag: getComputedStyle(document.getElementById('diagnostico')).display }));
    ok('no diagnóstico, o plano imprime sozinho', () => assert.deepEqual(viaDiag, { plano: 'block', diag: 'none' }));
    await b2.page.emulateMedia({ media: 'screen' });
    await b2.page.getByRole('button', { name: 'Imprimir ou salvar em PDF', exact: true }).click();
    await b2.page.emulateMedia({ media: 'print' });
    const soDiag = await b2.page.evaluate(() => ({ plano: getComputedStyle(document.getElementById('plano')).display, diag: getComputedStyle(document.getElementById('diagnostico')).position, classe: document.body.classList.contains('imprime-plano') }));
    ok('"Imprimir ou salvar em PDF" volta a imprimir o diagnóstico', () => assert.deepEqual(soDiag, { plano: 'none', diag: 'static', classe: false }));
    // No meio da jornada, pelo painel "Meu resumo e plano": o plano sai sem abrir o diagnóstico, e o painel não fica por cima.
    await b2.page.emulateMedia({ media: 'screen' });
    await b2.page.click('#fecha-diag');
    await b2.page.click('#abre-painel');
    await b2.page.click('#baixa-plano-painel');
    await esperarPlano(b2.page);
    await b2.page.emulateMedia({ media: 'print' });
    const viaPainel = await b2.page.evaluate(() => ({ plano: getComputedStyle(document.getElementById('plano')).display, painel: document.getElementById('painel').hidden }));
    ok('pelo painel, o plano imprime sozinho e o painel fecha', () => assert.deepEqual(viaPainel, { plano: 'block', painel: true }));
    ok('sem erros de página (diagnóstico)', () => assert.deepEqual(b2.page.errors, []));
    await b2.ctx.close();

    /* ---------- 2c. sem nenhuma resposta: o plano sai, com "não informado" no lugar dos números ---------- */
    const b3 = await abrir({ 'lg2-jornada': { v: 1, feitos: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], atual: null } });
    await b3.page.waitForSelector('#fim:not([hidden])');
    await b3.page.click('#baixa-plano-fim');
    await esperarPlano(b3.page);
    await b3.page.emulateMedia({ media: 'print' });
    const d3 = await lerPlano(b3.page);
    ok('plano vazio: capítulos, blocos e "não informado (Etapa N)"', () => {
      assert.deepEqual(d3.caps, CAPS); assert.equal(d3.blocos.length, 8);
      assert.match(d3.texto, /não informado \(Etapa 5\)/); assert.match(d3.texto, /não informado \(Etapa 6\)/);
      assert.doesNotMatch(d3.texto, /undefined|NaN|\[object|R\$ 0,00 \(preço\)/);
    });
    await b3.ctx.close();

    /* ---------- 2d. (local) progresso real salvo ---------- */
    if (process.env.PLANO_ESTADO && process.env.PLANO_PDF) {
      const b4 = await abrir({ ...lerBackup(process.env.PLANO_ESTADO), 'lg2-jornada': { v: 1, feitos: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], atual: null } });
      await b4.page.waitForSelector('#fim:not([hidden])');
      await b4.page.click('#baixa-plano-fim');
      await esperarPlano(b4.page);
      await b4.page.emulateMedia({ media: 'print' });
      const d4 = await lerPlano(b4.page);
      ok('progresso real: sem NaN/undefined e blocos A–H', () => {
        assert.doesNotMatch(d4.texto, /undefined|NaN|\[object|Infinity/); assert.equal(d4.blocos.length, 8); assert.deepEqual(d4.caps, CAPS);
      });
      await b4.page.pdf({ path: process.env.PLANO_PDF, format: 'A4', printBackground: true, preferCSSPageSize: true });
      console.log('PDF local:', process.env.PLANO_PDF);
      await b4.ctx.close();
    }
  } finally {
    if (browser) await browser.close();
    server.close();
  }
  console.log(falhas ? `FALHA: ${falhas} verificação(ões) falharam` : 'plano ok · todas as verificações passaram');
})().catch((e) => { console.error('FALHA', e); process.exit(1); });
