/* Teste de navegação do LG2 M04 (Turma B) no navegador headless.
   Execute: PW=<caminho do pacote playwright> node tests/lg2-m04-turma-b.cjs
   Opcional: SHOTS=<pasta> grava os prints de celular (390x844). Sai com código 1 se algo falhar. */
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.PW || 'playwright');

const DIR = path.resolve(__dirname, '../public/lg2/turma-b/m04');
const TIPOS = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf' };
const servidor = http.createServer((req, res) => {
  const f = path.join(DIR, decodeURIComponent(req.url.split('?')[0]).replace(/\/$/, '/index.html'));
  if (!f.startsWith(DIR) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': TIPOS[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});

let falhas = 0;
function check(nome, ok, extra) {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${nome}${!ok && extra !== undefined ? ' :: ' + JSON.stringify(extra).slice(0, 300) : ''}`);
  if (!ok) falhas++;
}

/* funções que rodam dentro da página */
const NA_PAGINA = {
  atual: () => {
    const t = document.querySelector('.passo');
    if (!t) return null;
    if (/Resultado/.test(t.textContent)) return 'RESULTADO';
    const n = +t.textContent.match(/Pergunta (\d+)/)[1];
    return window.MODULO4.perguntas.filter((p) => p.codigo)[n - 1].codigo;
  },
  responder: (v) => {
    const opc = [...document.querySelectorAll('.opcao')];
    if (v === 'NS' && document.querySelector('#ns')) document.querySelector('#ns').click();
    else if (opc.length) {
      const alvo = v === 'NS' ? 'Não sei' : v;
      const b = opc.find((x) => x.textContent.trim() === alvo);
      if (!b) return 'opcao inexistente: ' + alvo + ' em ' + opc.map((x) => x.textContent.trim()).join('|');
      b.click(); document.querySelector('#ok').click();
    } else {
      document.querySelector('#ent input, #ent textarea').value = v;
      document.querySelector('#ok').click();
    }
    return '';
  },
  seguir: () => {
    const b = [...document.querySelectorAll('#acoes .btn-primario')].find((x) => /Seguir|Ver meu resumo/.test(x.textContent));
    if (!b) return false;
    b.click(); return true;
  },
};

async function caminho(page, respostas) {
  /* começa do zero, responde cada pergunta pelo mapa (código -> valor) ou com um valor neutro */
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.click('#ir');
  const visitadas = [], telas = {}, rafael = [];
  for (let i = 0; i < 40; i++) {
    const cod = await page.evaluate(NA_PAGINA.atual);
    if (cod === 'RESULTADO') break;
    visitadas.push(cod);
    const q = await page.evaluate((c) => {
      const p = window.MODULO4.perguntas.find((x) => x.codigo === c);
      return { tipo: p.tipo, opcoes: [...document.querySelectorAll('.opcao')].map((x) => x.textContent.trim()), pergunta: document.querySelector('.q').textContent };
    }, cod);
    let v = respostas[cod];
    if (v === undefined) v = q.opcoes.length ? q.opcoes.find((o) => o !== 'Não sei') : /N[uú]mero/.test(q.tipo) ? '5' : 'Resposta de teste';
    const e = await page.evaluate(NA_PAGINA.responder, v);
    if (e) throw new Error(cod + ': ' + e);
    const corpo = await page.evaluate(() => document.body.innerText);
    telas[cod] = { ...q, corpo };
    if (/rafael/i.test(corpo)) rafael.push(cod);
    if (!(await page.evaluate(NA_PAGINA.seguir))) { telas[cod].bloqueado = true; break; }
  }
  const final = await page.evaluate(() => document.body.innerText);
  if (/rafael/i.test(final)) rafael.push('RESULTADO');
  return { visitadas, telas, final, rafael };
}

(async () => {
  await new Promise((r) => servidor.listen(0, '127.0.0.1', r));
  const URL = `http://127.0.0.1:${servidor.address().port}/index.html`;
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  const errosJS = [];
  page.on('pageerror', (e) => errosJS.push(e.message));
  await page.goto(URL);
  const D = await page.evaluate(() => window.MODULO4);
  const P = Object.fromEntries(D.perguntas.filter((p) => p.codigo).map((p) => [p.codigo, p]));

  check('21 perguntas carregadas', Object.keys(P).length === 21, Object.keys(P).length);
  check('tela inicial com botão Começar', (await page.textContent('#ir')).includes('Começar'));

  /* ---- P01: não avança sem a frase ---- */
  await page.click('#ir');
  await page.evaluate(() => document.querySelector('#ok').click());
  check('P01 vazio mostra erro e não avança', await page.evaluate(() => !document.querySelector('#erro').hidden) && (await page.evaluate(NA_PAGINA.atual)) === 'M4.P01');
  await page.evaluate(NA_PAGINA.responder, 'NS');
  let txt = await page.evaluate(() => document.body.innerText);
  check('P01 "Não sei" mostra o alerta do grupo', txt.includes(P['M4.P01'].alerta_naosei));
  check('P01 "Não sei" mostra a regra M4.R02', txt.includes(D.regras.find((r) => r.codigo === 'M4.R02').texto));
  check('P01 "Não sei" não oferece "Seguir"', !(await page.evaluate(NA_PAGINA.seguir)) && (await page.evaluate(NA_PAGINA.atual)) === 'M4.P01');
  check('P01 "Não sei" não é gravado como resposta', await page.evaluate(() => !(JSON.parse(localStorage.getItem('lg2-turma-b-m04')).R['M4.P01'])));
  await page.evaluate(NA_PAGINA.responder, 'Bolo de pote para lanche escolar');
  txt = await page.evaluate(() => document.body.innerText);
  check('P01 com frase mostra a regra M4.R01 e libera', txt.includes(D.regras.find((r) => r.codigo === 'M4.R01').texto) && await page.evaluate(NA_PAGINA.seguir));
  check('P02 aparece depois de P01', (await page.evaluate(NA_PAGINA.atual)) === 'M4.P02');
  const ops2 = await page.evaluate(() => [...document.querySelectorAll('.opcao')].map((x) => x.textContent.trim()));
  check('P02 tem 6 opções, sem opção vazia', JSON.stringify(ops2) === JSON.stringify(['Produto', 'Serviço', 'Mercadoria', 'Mercadoria+ Serviço', 'Produto+ Serviço', 'Mercadoria+Produto']), ops2);
  check('P02 mostra a Nota em destaque logo após a pergunta', await page.evaluate(() => { const d = document.querySelector('.q').nextElementSibling; return !!d && d.classList.contains('destaque') && d.textContent.startsWith('Nota: O que é produto?'); }));

  /* ---- todos os ramos de P02 ---- */
  const RAMO = {
    'Produto': ['M4.P03', 'M4.P04', 'M4.P05'],
    'Serviço': ['M4.P06'],
    'Mercadoria': ['M4.P03'],
    'Mercadoria+ Serviço': ['M4.P03', 'M4.P06'],
    'Produto+ Serviço': ['M4.P03', 'M4.P04', 'M4.P05', 'M4.P06'],
    'Mercadoria+Produto': ['M4.P03', 'M4.P04', 'M4.P05'],
  };
  const SERV = ['Serviço', 'Mercadoria+ Serviço', 'Produto+ Serviço'];
  const RAMIFICADAS = ['M4.P03', 'M4.P04', 'M4.P05', 'M4.P06'];
  let rafael = [];
  for (const [op, esperadas] of Object.entries(RAMO)) {
    const c = await caminho(page, { 'M4.P02': op, 'M4.P05': '2', 'M4.P14': 'Oferta mínima com preço' });
    rafael = rafael.concat(c.rafael);
    const vistas = c.visitadas.filter((x) => RAMIFICADAS.includes(x));
    check(`P02="${op}" -> ${esperadas.join(', ')}`, JSON.stringify(vistas) === JSON.stringify(esperadas), c.visitadas);
    const t14 = c.telas['M4.P14'];
    if (SERV.includes(op)) check(`P02="${op}" -> P14 versão serviço, 2 opções`, t14.pergunta === P['M4.P14'].variantes[0].pergunta && JSON.stringify(t14.opcoes) === '["Oferta mínima com preço","Pré-venda/reserva"]', t14);
    else check(`P02="${op}" -> P14 original, 4 opções`, t14.pergunta === P['M4.P14'].pergunta && t14.opcoes.length === 4, t14);
    check(`P02="${op}" chega ao resultado`, /Resumo das suas respostas/.test(c.final));
  }

  /* ---- "Não sei" em todas as perguntas que têm "Não sei" ---- */
  const nsTodos = {};
  Object.values(P).forEach((p) => { if (p.codigo !== 'M4.P01' && /Não sei/.test(p.opcoes || '')) nsTodos[p.codigo] = 'NS'; });
  for (const op of ['Produto+ Serviço', 'Produto']) {
    const mapa = { ...nsTodos, 'M4.P02': op, 'M4.P14': op === 'Produto' ? 'NS' : 'Pré-venda/reserva' };
    const c = await caminho(page, mapa);
    rafael = rafael.concat(c.rafael);
    const so = (s) => s.replace(/\s+/g, ' ');   // innerText junta espaços duplos
    for (const cod of c.visitadas.filter((x) => mapa[x] === 'NS')) {
      const p = P[cod], t = so(c.telas[cod].corpo);
      const esperados = [p.resposta_naosei, p.prompt_ia && p.prompt_ia.split('\n')[0], p.alerta, p.alerta_naosei, Motor_retorno(p, 'Não sei')].filter(Boolean).map((s) => so(s.trim().split('\n')[0]));
      const faltam = esperados.filter((s) => !t.includes(s));
      check(`${cod} "Não sei" (${op}) mostra os textos do grupo`, faltam.length === 0 && /Não sei/.test(t), faltam);
    }
    if (op === 'Produto+ Serviço') {
      check('P05="Não sei" -> P07 aparece', c.visitadas.includes('M4.P07'));
      check('P03 "Não sei" mostra botão de copiar o prompt e o conceito de ficha técnica', /Copiar texto/.test(c.telas['M4.P03'].corpo) && c.telas['M4.P03'].corpo.includes('Ficha técnica do produto'));
      check('P14 "Não sei" (sem opção na versão serviço) não aparece', !c.telas['M4.P14'].opcoes.includes('Não sei'));
    } else {
      check('P14 "Não sei" -> P15 não aparece', !c.visitadas.includes('M4.P15'));
    }
    check(`resumo marca as respostas "Não sei" (${op})`, /com “Não sei”/.test(c.final));
  }
  check('P05 > 3 -> P07 aparece', (await caminho(page, { 'M4.P02': 'Produto', 'M4.P05': '5 sabores' })).visitadas.includes('M4.P07'));
  check('P05 <= 3 -> P07 não aparece', !(await caminho(page, { 'M4.P02': 'Produto', 'M4.P05': '3' })).visitadas.includes('M4.P07'));

  /* ---- P14 -> P15 ---- */
  for (const [op, ve] of [['Protótipo sem venda', false], ['Oferta mínima com preço', true], ['Pré-venda/reserva', true], ['NS', false]]) {
    const c = await caminho(page, { 'M4.P02': 'Produto', 'M4.P05': '2', 'M4.P14': op });
    check(`P14="${op === 'NS' ? 'Não sei' : op}" -> P15 ${ve ? 'aparece' : 'não aparece'}`, c.visitadas.includes('M4.P15') === ve, c.visitadas);
    if (op === 'Oferta mínima com preço') check('P14 mostra o significado de Pré-venda', c.telas['M4.P14'].corpo.includes(D.base.find((b) => b.codigo === 'M4.BT07').definicao));
  }
  check('P14 versão serviço "Oferta mínima com preço" -> P15 aparece', (await caminho(page, { 'M4.P02': 'Serviço', 'M4.P14': 'Oferta mínima com preço' })).visitadas.includes('M4.P15'));
  for (const [v, mostra] of [['Sim', true], ['Não', false], ['NS', true]]) {
    const c = await caminho(page, { 'M4.P02': 'Produto', 'M4.P05': '2', 'M4.P14': 'Pré-venda/reserva', 'M4.P15': v });
    const t = c.telas['M4.P15'].corpo;
    check(`P15="${v === 'NS' ? 'Não sei' : v}" -> retorno Anvisa/Inmetro ${mostra ? 'aparece' : 'não aparece'}; alerta sempre`, t.includes('consulte a Anvisa') === mostra && t.includes(P['M4.P15'].alerta));
  }

  /* ---- P17 Outra -> P18 ---- */
  check('P17="Outra" -> P18 aparece', (await caminho(page, { 'M4.P02': 'Serviço', 'M4.P17': 'Outra' })).visitadas.includes('M4.P18'));
  check('P17="Pedidos/reservas" -> P18 não aparece', !(await caminho(page, { 'M4.P02': 'Serviço', 'M4.P17': 'Pedidos/reservas' })).visitadas.includes('M4.P18'));

  /* ---- trocar P02 descarta respostas que não valem mais ---- */
  {
    await caminho(page, { 'M4.P02': 'Produto', 'M4.P05': '2', 'M4.P14': 'Protótipo sem venda' });
    await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('lg2-turma-b-m04')); s.hist = ['M4.P01', 'M4.P02']; localStorage.setItem('lg2-turma-b-m04', JSON.stringify(s)); });
    await page.reload(); await page.click('#ir');
    await page.evaluate(NA_PAGINA.responder, 'Serviço');
    const R = await page.evaluate(() => JSON.parse(localStorage.getItem('lg2-turma-b-m04')).R);
    check('trocar P02 para Serviço apaga P03/P04/P05 e a P14 "Protótipo sem venda"', !R['M4.P03'] && !R['M4.P05'] && !R['M4.P14'] && R['M4.P08'] === undefined, Object.keys(R));
  }

  /* ---- persistência ao recarregar ---- */
  await page.evaluate(() => localStorage.clear()); await page.reload(); await page.click('#ir');
  await page.evaluate(NA_PAGINA.responder, 'Minha frase de teste'); await page.evaluate(NA_PAGINA.seguir);
  await page.evaluate(NA_PAGINA.responder, 'Produto+ Serviço'); await page.evaluate(NA_PAGINA.seguir);
  await page.evaluate(NA_PAGINA.responder, 'farinha, ovos'); await page.evaluate(NA_PAGINA.seguir);
  await page.reload();
  check('após recarregar, a capa oferece "Continuar de onde parei"', (await page.textContent('#ir')).includes('Continuar de onde parei'));
  await page.click('#ir');
  check('após recarregar, volta à mesma pergunta (P04)', (await page.evaluate(NA_PAGINA.atual)) === 'M4.P04');
  await page.evaluate(() => document.querySelector('#v').click());
  check('respostas mantidas após recarregar (P03)', await page.evaluate(() => document.querySelector('#ent textarea').value === 'farinha, ovos'));
  const cfim = await caminho(page, { 'M4.P02': 'Produto', 'M4.P05': '2' });
  await page.reload();
  await page.click('#ir');
  check('após recarregar no fim, abre o resumo', /Resumo das suas respostas/.test(await page.evaluate(() => document.body.innerText)));
  check('resumo lista as respostas e textos do grupo', cfim.final.includes('Resposta de teste') && cfim.final.includes(P['M4.P21'].proximo) && cfim.final.includes(D.mapa.entrega));

  check('nenhum texto "Rafael" aparece em nenhuma tela', rafael.length === 0, rafael);
  check('o roteiro de vídeo (P14) não aparece', !/Vídeo \(conteúdo/.test(cfim.telas['M4.P14'].corpo));
  check('sem erro de JavaScript na página', errosJS.length === 0, errosJS);

  /* ---- prints de celular ---- */
  if (process.env.SHOTS) {
    const S = process.env.SHOTS, foto = async (n) => { await page.waitForTimeout(400); await page.screenshot({ path: path.join(S, `m04_${n}.png`) }); };
    await page.evaluate(() => localStorage.clear()); await page.reload(); await foto('01_inicio');
    await page.click('#ir'); await page.evaluate(NA_PAGINA.responder, 'NS'); await foto('02_p01_nao_sei_bloqueio');
    await page.evaluate(NA_PAGINA.responder, 'Eu pretendo oferecer aos meus clientes um bolo de pote para lanche escolar'); await page.evaluate(NA_PAGINA.seguir);
    await page.waitForTimeout(400); await page.evaluate(() => window.scrollTo(0, 0)); await foto('03_p02_nota');
    await page.evaluate(NA_PAGINA.responder, 'Produto'); await page.evaluate(NA_PAGINA.seguir);
    await page.evaluate(NA_PAGINA.responder, 'NS'); await page.waitForTimeout(600); await foto('04_p03_nao_sei_prompt');
    const c = await caminho(page, { 'M4.P02': 'Produto', 'M4.P05': '2', 'M4.P14': undefined });
    await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('lg2-turma-b-m04')); s.hist = s.hist.slice(0, s.hist.indexOf('M4.P14') + 1); localStorage.setItem('lg2-turma-b-m04', JSON.stringify(s)); });
    await page.reload(); await page.click('#ir'); await foto('05_p14_pre_venda');
    await page.evaluate(() => document.querySelector('.caixa-entenda').scrollIntoView()); await foto('05b_p14_pre_venda_conceito');
    await caminho(page, { 'M4.P02': 'Produto', 'M4.P05': '2', 'M4.P08': 'NS' }); await page.evaluate(() => window.scrollTo(0, 0)); await foto('06_resultado');
    void c;
  }

  await browser.close(); servidor.close();
  console.log(falhas ? `\n${falhas} FALHA(S)` : '\nTODOS OS TESTES PASSARAM');
  process.exit(falhas ? 1 : 0);
})().catch((e) => { console.error('FAIL erro inesperado:', e); process.exit(1); });

function Motor_retorno(p, v) { return p.retorno_se && p.retorno_se.valores.includes(v) ? p.retorno_se.texto : ''; }
