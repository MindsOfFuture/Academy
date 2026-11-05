/* Teste de navegação do LG2 M04 (Turma A) no navegador headless.
   Execute: PW=<caminho do pacote playwright> node tests/lg2-m04-turma-a.cjs
   Opcional: SHOTS=<pasta> grava os prints de celular (390x844). Sai com código 1 se algo falhar. */
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.PW || 'playwright');

const DIR = path.resolve(__dirname, '../public/lg2/turma-a/m04');
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
      const rot = (x) => (x.querySelector('.op-txt b') || x).textContent.trim();
      const b = opc.find((x) => rot(x) === alvo);
      if (!b) return 'opcao inexistente: ' + alvo + ' em ' + opc.map(rot).join('|');
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

async function caminho(page, respostas, outros) {
  /* começa do zero, responde cada pergunta pelo mapa (código -> valor) ou com um valor neutro;
     outros = estado de outros módulos semeado no localStorage ({ chave: estado }) */
  await page.evaluate((o) => { localStorage.clear(); Object.entries(o || {}).forEach(([k, v]) => localStorage.setItem(k, JSON.stringify(v))); }, outros);
  await page.reload();
  await page.click('#ir');
  const visitadas = [], telas = {}, rafael = [];
  for (let i = 0; i < 40; i++) {
    const cod = await page.evaluate(NA_PAGINA.atual);
    if (cod === 'RESULTADO') break;
    visitadas.push(cod);
    const q = await page.evaluate((c) => {
      const p = window.MODULO4.perguntas.find((x) => x.codigo === c);
      return { tipo: p.tipo, opcoes: [...document.querySelectorAll('.opcao')].map((x) => (x.querySelector('.op-txt b') || x).textContent.trim()), pergunta: document.querySelector('.q').textContent };
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
  const finalTodo = await page.evaluate(() => document.querySelector('#tela').textContent);   // inclui a lista recolhida
  if (/rafael/i.test(finalTodo)) rafael.push('RESULTADO');
  return { visitadas, telas, final, finalTodo, rafael };
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
  check('P01 "Não sei" não é gravado como resposta', await page.evaluate(() => !(JSON.parse(localStorage.getItem('lg2-turma-a-m04')).R['M4.P01'])));
  await page.evaluate(NA_PAGINA.responder, 'Bolo de pote para lanche escolar');
  txt = await page.evaluate(() => document.body.innerText);
  check('P01 com frase mostra a regra M4.R01 e libera', txt.includes(D.regras.find((r) => r.codigo === 'M4.R01').texto) && await page.evaluate(NA_PAGINA.seguir));
  check('P02 aparece depois de P01', (await page.evaluate(NA_PAGINA.atual)) === 'M4.P02');
  const ops2 = await page.evaluate(() => [...document.querySelectorAll('.opcao .op-txt b')].map((x) => x.textContent.trim()));
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
  const PROD_P14 = ['Mostrar uma amostra sem cobrar', 'Vender pouca quantidade, já com preço', 'Aceitar encomenda ou reserva antes de fazer', 'Não sei'];
  const SERV_P14 = ['Atender poucos clientes, já cobrando', 'Aceitar agendamento ou reserva antes de atender'];
  const RAMIFICADAS = ['M4.P03', 'M4.P04', 'M4.P05', 'M4.P06'];
  let rafael = [];
  for (const [op, esperadas] of Object.entries(RAMO)) {
    const c = await caminho(page, { 'M4.P02': op, 'M4.P05': '2', 'M4.P14': SERV.includes(op) ? 'Atender poucos clientes, já cobrando' : 'Vender pouca quantidade, já com preço' });
    rafael = rafael.concat(c.rafael);
    const vistas = c.visitadas.filter((x) => RAMIFICADAS.includes(x));
    check(`P02="${op}" -> ${esperadas.join(', ')}`, JSON.stringify(vistas) === JSON.stringify(esperadas), c.visitadas);
    const t14 = c.telas['M4.P14'];
    if (SERV.includes(op)) check(`P02="${op}" -> P14 versão serviço, 2 opções`, t14.pergunta === P['M4.P14'].variantes[0].pergunta && JSON.stringify(t14.opcoes) === JSON.stringify(SERV_P14), t14);
    else check(`P02="${op}" -> P14 original, 4 opções novas`, t14.pergunta === P['M4.P14'].pergunta && JSON.stringify(t14.opcoes) === JSON.stringify(PROD_P14), t14);
    check(`P02="${op}" chega ao resultado`, /Resumo das suas respostas/.test(c.final));
  }

  /* ---- "Não sei" em todas as perguntas que têm "Não sei" ---- */
  const nsTodos = {};
  Object.values(P).forEach((p) => { if (p.codigo !== 'M4.P01' && /Não sei/.test(p.opcoes || '')) nsTodos[p.codigo] = 'NS'; });
  for (const op of ['Produto+ Serviço', 'Produto']) {
    const mapa = { ...nsTodos, 'M4.P02': op, 'M4.P14': op === 'Produto' ? 'NS' : 'Aceitar agendamento ou reserva antes de atender' };
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
  for (const [op, ve] of [['Mostrar uma amostra sem cobrar', false], ['Vender pouca quantidade, já com preço', true], ['Aceitar encomenda ou reserva antes de fazer', true], ['NS', false]]) {
    const c = await caminho(page, { 'M4.P02': 'Produto', 'M4.P05': '2', 'M4.P14': op });
    check(`P14="${op === 'NS' ? 'Não sei' : op}" -> P15 ${ve ? 'aparece' : 'não aparece'}`, c.visitadas.includes('M4.P15') === ve, c.visitadas);
    if (op === 'Vender pouca quantidade, já com preço') check('P14 mostra o significado de Pré-venda', c.telas['M4.P14'].corpo.includes(D.base.find((b) => b.codigo === 'M4.BT07').definicao));
  }
  check('P14 versão serviço "Atender poucos clientes, já cobrando" -> P15 aparece', (await caminho(page, { 'M4.P02': 'Serviço', 'M4.P14': 'Atender poucos clientes, já cobrando' })).visitadas.includes('M4.P15'));
  check('P14 versão serviço "Aceitar agendamento ou reserva antes de atender" -> P15 aparece', (await caminho(page, { 'M4.P02': 'Serviço', 'M4.P14': 'Aceitar agendamento ou reserva antes de atender' })).visitadas.includes('M4.P15'));
  for (const [v, mostra] of [['Sim', true], ['Não', false], ['NS', true]]) {
    const c = await caminho(page, { 'M4.P02': 'Produto', 'M4.P05': '2', 'M4.P14': 'Aceitar encomenda ou reserva antes de fazer', 'M4.P15': v });
    const t = c.telas['M4.P15'].corpo;
    check(`P15="${v === 'NS' ? 'Não sei' : v}" -> retorno Anvisa/Inmetro ${mostra ? 'aparece' : 'não aparece'}; alerta sempre`, t.includes('consulte a Anvisa') === mostra && t.includes(P['M4.P15'].alerta));
  }

  /* ---- P17 Outra -> P18 ---- */
  check('P17="Outra" -> P18 aparece', (await caminho(page, { 'M4.P02': 'Serviço', 'M4.P17': 'Outra' })).visitadas.includes('M4.P18'));
  check('P17="Pedidos/reservas" -> P18 não aparece', !(await caminho(page, { 'M4.P02': 'Serviço', 'M4.P17': 'Pedidos/reservas' })).visitadas.includes('M4.P18'));

  /* ---- trocar P02 descarta respostas que não valem mais ---- */
  {
    await caminho(page, { 'M4.P02': 'Produto', 'M4.P05': '2', 'M4.P14': 'Mostrar uma amostra sem cobrar' });
    await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('lg2-turma-a-m04')); s.hist = ['M4.P01', 'M4.P02']; localStorage.setItem('lg2-turma-a-m04', JSON.stringify(s)); });
    await page.reload(); await page.click('#ir');
    await page.evaluate(NA_PAGINA.responder, 'Serviço');
    const R = await page.evaluate(() => JSON.parse(localStorage.getItem('lg2-turma-a-m04')).R);
    check('trocar P02 para Serviço apaga P03/P04/P05 e a P14 "Mostrar uma amostra sem cobrar"', !R['M4.P03'] && !R['M4.P05'] && !R['M4.P14'] && R['M4.P08'] === undefined, Object.keys(R));
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
  check('resumo lista as respostas (recolhidas em "Ver suas respostas") e textos do grupo', cfim.finalTodo.includes('Resposta de teste') && cfim.finalTodo.includes(P['M4.P21'].proximo) && cfim.final.includes(D.mapa.entrega) && /Ver suas respostas/.test(cfim.final));
  check('resumo não mostra códigos internos (M4.P.., P01)', !/M\d\.P\d|\bP\d{2}\b/.test(cfim.finalTodo.replace(/Módulo \d+/g, '')), (cfim.finalTodo.match(/M\d\.P\d+|\bP\d{2}\b/g) || []).slice(0, 5));

  /* ---- herança: o que já foi respondido em outros módulos vem preenchido ---- */
  const M1_SERV = { R: { 'M1.P01': { estado: 'opcao', opcao: 'Ainda está só na minha cabeça' }, 'M1.P03': { estado: 'valor', valor: 'Lavagem de carro na casa do cliente' }, 'M1.P03A': { estado: 'opcao', opcao: 'Serviço: meu cliente paga pelo trabalho que realizo' } } };
  const M3_CLI = { v: 3, R: { 'M3.P10': { estado: 'opcao', opcao: 'Pessoas comuns (consumidor final)', campos: { 'Idade': '30 a 50', 'Ocupação': 'trabalha fora o dia todo', 'Onde mora': 'bairro São Pedro', 'O que precisa resolver (a dor)': 'sem tempo' } }, 'M3.P11': { estado: 'valor', valor: 'Falta de tempo para lavar o carro' } } };
  const semear = async (o) => { await page.evaluate((o) => { localStorage.clear(); Object.entries(o).forEach(([k, v]) => localStorage.setItem(k, JSON.stringify(v))); }, o); await page.reload(); await page.click('#ir'); };
  const tela = () => page.evaluate(() => ({ cod: null, txt: document.body.innerText, campo: (document.querySelector('#ent textarea, #ent input') || {}).value, sel: [...document.querySelectorAll('.opcao.sel .op-txt b')].map((x) => x.textContent.trim()), ops: [...document.querySelectorAll('.opcao .op-txt b')].map((x) => x.textContent.trim()), q: (document.querySelector('.q') || {}).textContent, ajuda: (document.querySelector('.dica .ajuda') || {}).textContent }));
  const estado = () => page.evaluate(() => JSON.parse(localStorage.getItem('lg2-turma-a-m04')).R);
  {
    await semear({ 'lg2-turma-a-m01': M1_SERV, 'lg2-turma-a-m03': M3_CLI });
    let t = await tela();
    check('herança P01: vem preenchida com a ideia do Módulo 1 e o selo', t.campo === 'Lavagem de carro na casa do cliente' && /Veio do Módulo 1/.test(t.txt) && /Confira e ajuste se quiser/.test(t.txt), t.campo);
    await page.evaluate(() => document.querySelector('#ok').click());
    check('herança P01: Continuar sem digitar grava a resposta trazida', (await estado())['M4.P01'].valor === 'Lavagem de carro na casa do cliente' && (await estado())['M4.P01'].de === 1);
    await page.evaluate(NA_PAGINA.seguir);
    t = await tela();
    check('herança P02: tipo do Módulo 1 (Serviço) já vem marcado, com selo', JSON.stringify(t.sel) === '["Serviço"]' && /Veio do Módulo 1/.test(t.txt), t.sel);
    check('herança P02: as combinações continuam escolhíveis', ['Produto+ Serviço', 'Mercadoria+ Serviço', 'Mercadoria+Produto'].every((o) => t.ops.includes(o)), t.ops);
    await page.evaluate(() => document.querySelector('#ok').click()); await page.evaluate(NA_PAGINA.seguir);
    t = await tela();
    check('Serviço -> P06 (etapas do serviço) em seguida', /realizar o serviço uma vez/.test(t.q), t.q);
    await page.evaluate(NA_PAGINA.responder, 'Combinar horário, ir até a casa, lavar, conferir'); await page.evaluate(NA_PAGINA.seguir);
    t = await tela();
    check('herança P08: primeiro cliente montado com o perfil do Módulo 3', /^Pessoas comuns \(idade: 30 a 50; ocupação: trabalha fora o dia todo; onde mora: bairro São Pedro\)$/.test(t.campo) && /Veio do Módulo 3/.test(t.txt), t.campo);
    await page.evaluate(NA_PAGINA.responder, 'Moradores do bairro São Pedro que trabalham fora'); await page.evaluate(NA_PAGINA.seguir);
    check('herança P08: resposta editada não leva o selo de origem', (await estado())['M4.P08'].de === undefined);
    t = await tela();
    check('herança P09 (image9): problema do cliente vem do Módulo 3', t.campo === 'Falta de tempo para lavar o carro' && /Veio do Módulo 3/.test(t.txt), t.campo);
    check('Serviço: P09 fala só de serviço', t.q === 'Que problema ou necessidade desse cliente o seu serviço ajuda a resolver?', t.q);
    await page.evaluate(() => document.querySelector('#ok').click()); await page.evaluate(NA_PAGINA.seguir);
    t = await tela();
    check('Serviço: ajuda da P10 sem "produto"', /característica do serviço/.test(t.ajuda) && !/produto/i.test(t.ajuda + t.q), t.ajuda);
    /* voltar: a resposta própria prevalece sobre a herdada */
    await page.evaluate(() => document.querySelector('#v').click());
    check('voltar à P09 mantém a resposta gravada', (await tela()).campo === 'Falta de tempo para lavar o carro');
  }
  {
    /* fallback: sem M1.P03A, o tipo vem do Módulo 5; sem M3, o cliente vem do Módulo 2 */
    await semear({ 'lg2-turma-a-m05': { versao: 3, R: { 'M5.P01': { estado: 'opcao', opcao: 'Mercadoria: compro pronto para revender' } }, hist: [] }, 'lg2-turma-b-m02': { R: { 'M2.P02': { estado: 'valor', valor: 'Mães que trabalham fora' } }, hist: [] } });
    let t = await tela();
    check('sem ideia em outro módulo, P01 fica vazia e sem selo', t.campo === '' && !/Veio do Módulo/.test(t.txt));
    await page.evaluate(NA_PAGINA.responder, 'Roupas infantis'); await page.evaluate(NA_PAGINA.seguir);
    t = await tela();
    check('herança P02 do Módulo 5 (Mercadoria)', JSON.stringify(t.sel) === '["Mercadoria"]' && /Veio do Módulo 5/.test(t.txt), t.sel);
    await page.evaluate(NA_PAGINA.responder, 'Produto+ Serviço');
    check('herança P02: pessoa pode trocar para uma combinação', (await estado())['M4.P02'].opcao === 'Produto+ Serviço' && (await estado())['M4.P02'].de === undefined);
    const c = await caminho(page, { 'M4.P02': 'Produto', 'M4.P05': '2' }, { 'lg2-turma-b-m02': { R: { 'M2.P02': { estado: 'valor', valor: 'Mães que trabalham fora' } } } });
    check('herança P08 do Módulo 2 quando não há perfil no Módulo 3', /Veio do Módulo 2/.test(c.telas['M4.P08'].corpo));
  }
  {
    /* "Não sei" em outro módulo não conta como resposta */
    await semear({ 'lg2-turma-a-m01': { R: { 'M1.P03': { estado: 'naosei' }, 'M1.P03A': { estado: 'naosei' } } } });
    let t = await tela();
    check('"Não sei" no Módulo 1 não preenche P01', t.campo === '' && !/Veio do Módulo/.test(t.txt));
    await page.evaluate(NA_PAGINA.responder, 'Bolo'); await page.evaluate(NA_PAGINA.seguir);
    t = await tela();
    check('"Não sei" no Módulo 1 não marca P02', t.sel.length === 0 && !/Veio do Módulo/.test(t.txt));
  }
  {
    /* P14 reescrita: enunciado claro + cada caminho explicado */
    const c = await caminho(page, { 'M4.P02': 'Produto', 'M4.P05': '2', 'M4.P14': 'Aceitar encomenda ou reserva antes de fazer' });
    const t = c.telas['M4.P14'];
    check('P14 nova pergunta "Como você quer testar sua oferta pela primeira vez?"', t.pergunta === 'Como você quer testar sua oferta pela primeira vez?', t.pergunta);
    check('P14 cada opção explica o caminho', Object.values(P['M4.P14'].opcoes_explica).slice(0, 3).every((x) => t.corpo.includes(x)));
    check('P14 sem o texto antigo ("investir na produção", "Protótipo sem venda")', !/investir na produção|Protótipo sem venda|Oferta mínima com preço/.test(t.corpo));
    const s = await caminho(page, { 'M4.P02': 'Serviço', 'M4.P14': 'Atender poucos clientes, já cobrando' });
    check('P14 versão serviço: ajuda própria, sem "produto"', s.telas['M4.P14'].corpo.includes(P['M4.P14'].variantes[0].ajuda) && !/produto/i.test(s.telas['M4.P14'].pergunta));
  }
  {
    /* estado salvo antes da reescrita: a opção antiga é traduzida */
    await page.evaluate(() => { localStorage.clear(); localStorage.setItem('lg2-turma-a-m04', JSON.stringify({ R: { 'M4.P01': { estado: 'valor', valor: 'Bolo' }, 'M4.P02': { estado: 'opcao', opcao: 'Serviço' }, 'M4.P14': { estado: 'opcao', opcao: 'Pré-venda/reserva' } }, hist: ['M4.P01', 'M4.P02', 'M4.P14'] })); });
    await page.reload(); await page.click('#ir');
    const t = await tela();
    check('estado antigo: P14 "Pré-venda/reserva" (serviço) vira "Aceitar agendamento ou reserva antes de atender"', JSON.stringify(t.sel) === '["Aceitar agendamento ou reserva antes de atender"]', t.sel);
  }
  {
    /* "O que entendemos até aqui" no topo do resultado */
    const c = await caminho(page, { 'M4.P01': 'Lavagem de carro na casa do cliente', 'M4.P02': 'Serviço', 'M4.P08': 'NS', 'M4.P09': 'Falta de tempo para lavar o carro', 'M4.P12': 'Para quem trabalha fora, lavo o carro na porta de casa', 'M4.P14': 'Atender poucos clientes, já cobrando', 'M4.P19': '5 lavagens em 7 dias', 'M4.P20': '7', 'M4.P21': '0' },
      { 'lg2-turma-a-m01': M1_SERV, 'lg2-turma-a-m03': M3_CLI });
    const caixa = await page.evaluate(() => { const e = document.querySelector('.entendemos'); return e && { txt: e.innerText, topo: e.previousElementSibling && e.previousElementSibling.classList.contains('concluido') }; });
    check('resultado: caixa "O que entendemos até aqui" logo abaixo do "Você concluiu"', !!caixa && caixa.topo && /O que entendemos até aqui/.test(caixa.txt), caixa);
    const f = caixa ? caixa.txt : '';
    check('caixa: ideia + tipo (do Módulo 1)', f.includes('Você quer oferecer “Lavagem de carro na casa do cliente”, que é um serviço (o cliente paga pelo seu trabalho).'), f);
    check('caixa: estágio do Módulo 1', f.includes('ainda não saiu do papel'), f);
    check('caixa: problema do cliente (herdado do Módulo 3)', f.includes('problema que você ajuda a resolver é “Falta de tempo para lavar o carro”'), f);
    check('caixa: proposta de valor', f.includes('Sua proposta de valor, por enquanto: “Para quem trabalha fora, lavo o carro na porta de casa”.'), f);
    check('caixa: teste com prazo, gasto e critério', f.includes('No primeiro teste, você vai atender poucos clientes, já cobrando, durante 7 dias, sem gastar dinheiro, e vai considerar que deu certo com “5 lavagens em 7 dias”.'), f);
    check('caixa: aponta os "Não sei"', /ficou 1 ponto em aberto/.test(f), f);
    const nfr = f.split('\n').filter((x) => x.trim() && !/O que entendemos/.test(x)).length;
    check('caixa: 3 a 6 frases', nfr >= 3 && nfr <= 6, nfr);
    check('lista de respostas recolhida e com selo de origem', await page.evaluate(() => { const d = document.querySelector('details.respostas'); return !!d && !d.open && /Veio do Módulo 1/.test(d.textContent); }));
    check('jornada: caixa lg2-proximo continua no fim', /class="acoes lg2-proximo"/.test(await page.content()));
  }

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
    await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('lg2-turma-a-m04')); s.hist = s.hist.slice(0, s.hist.indexOf('M4.P14') + 1); localStorage.setItem('lg2-turma-a-m04', JSON.stringify(s)); });
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
