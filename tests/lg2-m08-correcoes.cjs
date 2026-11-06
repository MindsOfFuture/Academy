/* Módulo 8 (Turma B): correções dos testes da turma (nov/2026).
   1. teclado do celular: campo e Continuar visíveis com a tela encolhida (390x450); campo numérico com erro simples e aviso que não trava
   2. tipo de oferta: Mercadoria herdada vira "Mercadoria"; escolher diferente do herdado mostra aviso e deixa seguir
   3. faturamento acima do limite do MEI: alerta forte (desenquadramento, contador/Sala do Empreendedor), também com valor herdado do Módulo 5
   4. "possíveis CNAEs compatíveis": ocupações do MEI achadas pela descrição, ou aviso de que não achou
   Execute: PW=<caminho do pacote playwright> node tests/lg2-m08-correcoes.cjs */
const http = require('node:http'), fsp = require('node:fs/promises'), path = require('node:path'), assert = require('node:assert/strict');
const { chromium } = require(process.env.PW || 'playwright');
const root = path.join(__dirname, '..', 'public');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.ttf': 'font/ttf' };
const server = http.createServer(async (req, res) => {
  const f = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://x').pathname));
  try { const b = await fsp.readFile(f); res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); res.end(b); } catch { res.writeHead(404).end(); }
});
const nrm = (s) => String(s || '').replace(/\s+/g, ' ').trim();
const K = 'lg2-turma-b-m08';
let ok = 0;
const check = (c, m) => { assert.ok(c, m); ok++; };

(async () => {
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const URL0 = `http://127.0.0.1:${server.address().port}/lg2/turma-b/m08/index.html`;
  const b = await chromium.launch();
  const page = await b.newPage({ viewport: { width: 390, height: 844 } });
  page.setDefaultTimeout(8000);
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  page.on('dialog', (d) => d.accept());
  const st = () => page.evaluate((k) => JSON.parse(localStorage.getItem(k)), K);
  const btn = (nome) => page.getByRole('button', { name: nome, exact: true });
  const atual = () => page.evaluate(() => {
    const t = (document.querySelector('.passo') || {}).textContent || '';
    if (/Resultado/.test(t)) return 'RESULTADO';
    const m = t.match(/Pergunta (\d+)/);
    return m ? Motor.montar(window.MODULO8).perguntas[+m[1] - 1].codigo : null;
  });
  const semear = (dados) => page.evaluate((d) => { localStorage.clear(); for (const [k, v] of Object.entries(d)) localStorage.setItem(k, JSON.stringify(v)); }, dados);
  const SHOTS = process.env.SHOTS;
  const shotNs = async (cod) => { if (!SHOTS) return; await page.waitForTimeout(400); await page.screenshot({ path: path.join(SHOTS, `m08b_naosei_${cod.slice(-3).toLowerCase()}.png`) }); };
  const seguir = () => page.locator('#acoes .btn-primario').first().click();
  const escolher = (op) => page.getByRole('button', { name: op, exact: true }).click();
  /* responde até o resultado: opção pedida, senão "Não" ou a 1ª; texto neutro quando o campo está vazio */
  const ateResultado = async (resp = {}) => {
    for (let i = 0; i < 15 && (await atual()) !== 'RESULTADO'; i++) {
      const cod = await atual();
      const ops = await page.$$eval('#ent .opcao', (x) => x.map((e) => e.textContent.trim()));
      if (ops.length) await escolher(resp[cod] || (ops.includes('Não') ? 'Não' : ops[0]));
      else if (resp[cod] || !(await page.inputValue('#ent input, #ent textarea')))   // valor herdado fica como veio
        await page.fill('#ent input, #ent textarea', resp[cod] || (cod === 'M8.P04' ? '3000' : 'Faço bolos de pote'));
      await btn('Continuar').click();
      if (!(await page.locator('#retorno .retorno').count())) await btn('Continuar').click();   // aviso de valor alto: 2º toque
      await seguir();
    }
    assert.equal(await atual(), 'RESULTADO');
  };

  await page.goto(URL0);
  /* ===== Receita A: viewport e teclado ===== */
  check(/interactive-widget=resizes-content/.test(await page.getAttribute('meta[name=viewport]', 'content')), 'viewport com interactive-widget=resizes-content');
  await page.evaluate(() => localStorage.clear()); await page.reload();
  await btn('Começar').click();
  for (const cod of ['M8.P01', 'M8.P04']) {
    if (cod === 'M8.P04') {   // anda até a P04
      await page.fill('#ent textarea', 'Faço bolos de pote'); await btn('Continuar').click(); await seguir();
      await escolher('Produto'); await btn('Continuar').click(); await seguir();
      await escolher('Minha casa'); await btn('Continuar').click(); await seguir();
    }
    assert.equal(await atual(), cod);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.focus('#ent input, #ent textarea');
    await page.setViewportSize({ width: 390, height: 450 });     // teclado aberto
    await page.waitForTimeout(600);
    const dentro = async (sel) => { const bb = await page.locator(sel).boundingBox(); return bb && bb.y >= 0 && bb.y + bb.height <= 450; };
    check(await dentro('#ent input, #ent textarea'), `${cod}: campo visível com o teclado aberto`);
    check(await dentro('#ok'), `${cod}: Continuar visível com o teclado aberto`);
    check(await page.evaluate(() => document.querySelector('#ent').compareDocumentPosition(document.querySelector('#ok')) & 4) > 0, `${cod}: Continuar abaixo do campo`);
    await page.setViewportSize({ width: 390, height: 844 });
  }
  /* ===== Receita B: P04 numérica ===== */
  check(await page.getAttribute('#ent input', 'inputmode') === 'decimal', 'P04 com teclado numérico');
  await page.fill('#ent input', 'muito'); await btn('Continuar').click();
  check(/Digite só números/.test(await page.textContent('#erro')), 'texto em campo numérico: erro simples');
  check((await st()).R['M8.P04'] === undefined, 'texto não grava');
  await page.fill('#ent input', '-300'); await btn('Continuar').click();
  check(/não pode ser negativo/.test(await page.textContent('#erro')), 'negativo bloqueado');
  await page.fill('#ent input', '2.250.000');
  await page.focus('#ent input'); await page.setViewportSize({ width: 390, height: 450 }); await page.waitForTimeout(600);   // teclado aberto
  await btn('Continuar').click(); await page.waitForTimeout(200);
  check(/parece alto/.test(await page.textContent('#erro')) && (await st()).R['M8.P04'] === undefined, 'valor absurdo: aviso, ainda sem gravar');
  { const bb = await page.locator('#ok').boundingBox(); check(bb && bb.y >= 0 && bb.y + bb.height <= 450, 'com o aviso e o teclado aberto, o Continuar continua visível ' + JSON.stringify(bb)); }
  await page.setViewportSize({ width: 390, height: 844 });
  await btn('Continuar').click();                                   // 2º toque com o mesmo valor segue
  check((await st()).R['M8.P04'] && (await st()).R['M8.P04'].valor === '2.250.000', 'segundo Continuar grava o valor alto');
  check(await page.locator('#retorno #alerta-mei').count() === 1, 'P04 acima do limite: alerta do MEI já na resposta');
  await page.evaluate(() => localStorage.clear());

  /* ===== Item 2: tipo de oferta herdado (Mercadoria) e aviso ao escolher diferente ===== */
  const M1 = { v: 3, R: { 'M1.P01': { estado: 'opcao', opcao: 'Já vendo sempre' }, 'M1.P03': { estado: 'valor', valor: 'Bolos de pote' },
    'M1.P03A': { estado: 'opcao', opcao: 'Mercadoria: compro pronto para revender' } } };
  await semear({ 'lg2-turma-a-m01': M1 });
  await page.reload(); await btn('Começar').click();
  await btn('Continuar').click(); await seguir();                  // P01 herdada
  assert.equal(await atual(), 'M8.P02');
  check(nrm(await page.textContent('#ent .opcao.sel')) === 'Mercadoria', 'P02: Mercadoria do Módulo 1 marcada');
  check(nrm(await page.textContent('#herdou .veio')) === 'Veio do Módulo 1' && /Confira e ajuste se quiser/.test(await page.textContent('#herdou')), 'P02: selo e convite a conferir');
  const ops2 = await page.$$eval('#ent .opcao', (x) => x.map((e) => e.textContent.trim()));
  assert.deepEqual(ops2, ['Produto', 'Mercadoria', 'Serviço', 'Produto e serviço', 'Não sei']);
  await btn('Continuar').click();
  check(await page.locator('#aviso-tipo').count() === 0, 'mesma opção herdada: sem aviso');
  await btn('Corrigir minha resposta').click();
  await escolher('Produto'); await btn('Continuar').click();
  const av = nrm(await page.textContent('#aviso-tipo'));
  check(av.includes('No Módulo 1 você respondeu “Mercadoria: compro pronto para revender”') && av.includes('Aqui você escolheu “Produto”'), `aviso de divergência com o que foi dito antes: ${av}`);
  check(await page.locator('#acoes .btn-primario').count() === 1, 'aviso não trava: Seguir disponível');
  await seguir();
  check(await atual() === 'M8.P03', 'seguiu com a escolha diferente');
  check((await st()).R['M8.P02'].opcao === 'Produto' && (await st()).R['M8.P02'].de === undefined, 'escolha diferente gravada sem selo');
  await ateResultado({ 'M8.P04': '3000' });
  check(await page.locator('#aviso-tipo').count() === 1, 'aviso de divergência também no resultado');
  /* com o tipo igual ao herdado, o resultado não mostra aviso; entendemos fala em revenda */
  await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('lg2-turma-b-m08')); s.R['M8.P02'] = { estado: 'opcao', opcao: 'Mercadoria', de: 1 }; localStorage.setItem('lg2-turma-b-m08', JSON.stringify(s)); });
  await page.reload(); await btn('Continuar de onde parei').click();
  check(await page.locator('#aviso-tipo').count() === 0, 'tipo igual ao herdado: sem aviso no resultado');
  check(nrm(await page.textContent('#entendemos')).includes('revenda de mercadoria'), 'entendemos: mercadoria, não "produto"');

  /* ===== Item 3: R$ 27 milhões por ano com "já tem MEI" ===== */
  await semear({ 'lg2-turma-a-m01': M1,
    'lg2-turma-a-m05': { versao: 3, R: { 'M5.P36': { estado: 'valor', valor: '1500' }, 'M5.P37': { estado: 'valor', valor: '1500' } } } });
  await page.reload(); await btn('Começar').click();
  await ateResultado({ 'M8.P05': 'MEI', 'M8.P02': 'Mercadoria' });
  let st8 = await st();
  check(st8.R['M8.P04'].valor === '2250000' && st8.R['M8.P04'].de === 5, 'faturamento herdado do Módulo 5 (1.500 × 1.500)');
  let am = nrm(await page.textContent('#alerta-mei'));
  for (const t of ['Atenção: faturamento acima do limite do MEI', 'R$ 27.000.000 por ano', 'R$ 81.000 por ano', 'sai do MEI', 'desenquadramento',
                   'mais de 20% do limite', 'contador', 'Sala do Empreendedor', 'Lei Complementar 238/2026']) check(am.includes(t), `alerta MEI: "${t}" em: ${am}`);
  check(await page.locator('#alerta-mei .veio').count() === 1, 'alerta mostra que o valor veio do Módulo 5');
  check(await page.evaluate(() => document.querySelector('#alerta-mei').compareDocumentPosition(document.querySelector('.res-num')) & 4) > 0, 'alerta MEI no alto do resultado');
  check(nrm(await page.textContent('#entendemos')).includes('sai do MEI'), 'entendemos: sai do MEI');
  /* faixa até 20%: 7.500/mês = 90.000/ano */
  await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('lg2-turma-b-m08')); s.R['M8.P04'] = { estado: 'valor', valor: '7500' }; localStorage.setItem('lg2-turma-b-m08', JSON.stringify(s)); });
  await page.reload(); await btn('Continuar de onde parei').click();
  am = nrm(await page.textContent('#alerta-mei'));
  check(am.includes('até 20% do limite') && am.includes('janeiro do ano seguinte') && am.includes('R$ 110.000'), `até 20%: ${am}`);
  /* sem MEI: o MEI não serve */
  await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('lg2-turma-b-m08')); s.R['M8.P05'] = { estado: 'opcao', opcao: 'Não' }; localStorage.setItem('lg2-turma-b-m08', JSON.stringify(s)); });
  await page.reload(); await btn('Continuar de onde parei').click();
  check(nrm(await page.textContent('#alerta-mei')).includes('MEI não serve'), 'sem CNPJ e acima do limite: MEI não serve');
  /* dentro do limite: sem alerta */
  await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('lg2-turma-b-m08')); s.R['M8.P04'] = { estado: 'valor', valor: '6750' }; s.R['M8.P05'] = { estado: 'opcao', opcao: 'MEI' }; localStorage.setItem('lg2-turma-b-m08', JSON.stringify(s)); });
  await page.reload(); await btn('Continuar de onde parei').click();
  check(await page.locator('#alerta-mei').count() === 0, 'R$ 81.000/ano exatos: sem alerta');
  /* P04 "Não sei" salvo antes (nov/2026: o faturamento passou a ser obrigatório): a resposta antiga é apagada e a pergunta volta */
  await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('lg2-turma-b-m08')); s.R['M8.P04'] = { estado: 'naosei' }; localStorage.setItem('lg2-turma-b-m08', JSON.stringify(s)); });
  await page.reload(); await btn('Continuar de onde parei').click();
  check(await atual() === 'M8.P04', 'P04 "Não sei" antigo: volta à pergunta do faturamento');
  check(!(await st()).R['M8.P04'] && (await st()).R['M8.P05'], 'P04 "Não sei" antigo: só essa resposta é apagada');
  check(nrm(await page.inputValue('#ent input')) === '2250000', 'P04: valor do Módulo 5 (preço × vendas) já vem preenchido');
  /* alerta na própria P05 ao escolher MEI */
  await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('lg2-turma-b-m08')); s.R['M8.P04'] = { estado: 'valor', valor: '9000' }; s.hist = ['M8.P01', 'M8.P02', 'M8.P03', 'M8.P04', 'M8.P05']; localStorage.setItem('lg2-turma-b-m08', JSON.stringify(s)); });
  await page.reload(); await btn('Continuar de onde parei').click();
  assert.equal(await atual(), 'M8.P05');
  await escolher('MEI'); await btn('Continuar').click();
  check(nrm(await page.textContent('#retorno')).includes('sai do MEI'), 'P05 = MEI acima do limite: alerta logo na resposta');

  /* ===== Item 5 (Júlia, nov/2026): "Não sei" que não grava nem avança nas perguntas que o módulo usa ===== */
  const PRECISA = ['M8.P01', 'M8.P02', 'M8.P03', 'M8.P04', 'M8.P05'];
  await semear({});
  await page.reload(); await btn('Começar').click();
  for (let i = 0; i < 15 && (await atual()) !== 'RESULTADO'; i++) {
    const cod = await atual();
    const ops = await page.$$eval('#ent .opcao', (x) => x.map((e) => e.textContent.trim()));
    if (PRECISA.includes(cod)) {
      if (ops.length) await escolher('Não sei'); else await btn('Não sei').click();
      const aj = nrm(await page.textContent('#ns-ajuda'));
      check(await page.locator('#ns-ajuda').isVisible() && aj.startsWith('Precisamos desta resposta para seguir'), `${cod}: "Não sei" mostra como descobrir (${aj.slice(0, 60)})`);
      check(await page.locator('#ent .opcao.sel').count() === 0, `${cod}: "Não sei" não fica marcado`);
      check(!(await st()).R[cod], `${cod}: "Não sei" não grava`);
      await btn('Continuar').click();
      check(await atual() === cod && await page.locator('#retorno .retorno').count() === 0, `${cod}: não avança sem resposta`);
      if (cod === 'M8.P01' || cod === 'M8.P04') { await shotNs(cod); }
      if (ops.length) await escolher(ops.includes('Não') ? 'Não' : ops[0]);
      else await page.fill('#ent input, #ent textarea', cod === 'M8.P04' ? '3000' : 'Faço bolos de pote');
      check(!(await page.locator('#ns-ajuda').isVisible()) || ops.length === 0, `${cod}: escolher uma opção esconde a explicação`);
      await btn('Continuar').click();
      { const r = (await st()).R[cod]; check(r && r.estado !== 'naosei' && r.opcao !== 'Não sei', `${cod}: com resposta, grava`); }
    } else {
      /* nas outras, o "Não sei" continua valendo */
      if (ops.length) await escolher('Não sei'); else await btn('Não sei').click();
      if (ops.length) await btn('Continuar').click();
      const r = (await st()).R[cod];
      check(r && (r.estado === 'naosei' || r.opcao === 'Não sei'), `${cod}: "Não sei" continua aceito`);
      check(await page.locator('#ns-ajuda').isHidden(), `${cod}: sem explicação de "Não sei" obrigatória`);
    }
    await seguir();
  }
  check(await atual() === 'RESULTADO', '"Não sei" nas opcionais chega ao resultado');
  check(nrm(await page.textContent('.res-num .sub')).startsWith('4 com'), `resultado: 4 "Não sei" (P06, P07, P09, P10): ${nrm(await page.textContent('.res-num .sub'))}`);
  /* "Não sei" antigo em P02 (outra pergunta obrigatória): apaga só ela e volta a perguntar */
  await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('lg2-turma-b-m08')); s.R['M8.P02'] = { estado: 'opcao', opcao: 'Não sei' }; localStorage.setItem('lg2-turma-b-m08', JSON.stringify(s)); });
  await page.reload(); await btn('Continuar de onde parei').click();
  check(await atual() === 'M8.P02', 'P02 "Não sei" antigo: volta à pergunta do tipo');
  check((await st()).R['M8.P01'] && !(await st()).R['M8.P02'], 'P02 "Não sei" antigo: as outras respostas ficam');

  /* ===== Item 4: possíveis CNAEs compatíveis ===== */
  const resultadoCom = async (desc) => {
    await page.evaluate(() => localStorage.clear()); await page.reload(); await btn('Começar').click();
    await ateResultado({ 'M8.P01': desc });
    return nrm(await page.textContent('#sugestoes'));
  };
  let sg = await resultadoCom('Faço bolos de pote por encomenda');
  check(nrm(await page.textContent('#sugestoes .secao-titulo')) === 'Possíveis CNAEs compatíveis', 'seção de CNAEs compatíveis');
  check(sg.includes('CONFEITEIRO(A) INDEPENDENTE') && sg.includes('1091-1/02') && sg.includes('DOCEIRO(A) INDEPENDENTE'), `bolos → confeiteiro/doceiro: ${sg}`);
  check(sg.includes('Sala do Empreendedor'), 'aviso para conferir na Sala do Empreendedor');
  sg = await resultadoCom('Manicure e pedicure em domicílio');
  check(sg.includes('MANICURE/PEDICURE INDEPENDENTE') && sg.includes('9602-5/01'), 'manicure → 9602-5/01');
  sg = await resultadoCom('Sou psicóloga clínica');
  check(/Não encontramos/.test(sg) && await page.locator('#sugestoes .cnae').count() === 0, `sem ocupação compatível: diz isso (${sg})`);

  /* ===== relatório do Bento: P02 (produto, mercadoria, serviço ou ambos) vem pronta do Módulo 1, 5 ou 4, com o selo ===== */
  for (const [nome, dados, val, mod] of [
    ['só Módulo 5', { 'lg2-turma-a-m05': { versao: 3, R: { 'M5.P01': { estado: 'opcao', opcao: 'Serviço' } } } }, 'Serviço', 5],
    ['só Módulo 4', { 'lg2-turma-a-m04': { v: 4, R: { 'M4.P02': { estado: 'opcao', opcao: 'Produto+ Serviço' } } } }, 'Produto e serviço', 4],
    ['Módulo 1 vence o 5 e o 4', { 'lg2-turma-a-m01': M1, 'lg2-turma-a-m05': { versao: 3, R: { 'M5.P01': { estado: 'opcao', opcao: 'Serviço' } } }, 'lg2-turma-a-m04': { v: 4, R: { 'M4.P02': { estado: 'opcao', opcao: 'Produto' } } } }, 'Mercadoria', 1],
  ]) {
    await semear(dados);
    await page.reload(); await btn('Começar').click();
    for (let i = 0; i < 4 && (await atual()) !== 'M8.P02'; i++) {
      const campo = page.locator('#ent input, #ent textarea').first();
      if (await campo.count() && !(await campo.inputValue())) await campo.fill('Bolos de pote');
      await btn('Continuar').click();
      if ((await atual()) !== 'M8.P02' && await page.locator('#acoes .btn-primario').count()) await seguir();
    }
    check(await atual() === 'M8.P02', `P02 (${nome}): chega à pergunta do tipo`);
    check(nrm(await page.textContent('#ent .opcao.sel')) === val && await page.locator('#ent .opcao.sel').count() === 1, `P02 (${nome}): "${val}" já vem marcada`);
    check(nrm(await page.textContent('#herdou .veio')) === `Veio do Módulo ${mod}`, `P02 (${nome}): selo "Veio do Módulo ${mod}"`);
    if (mod === 5) { await page.waitForTimeout(400); if (SHOTS) await page.screenshot({ path: path.join(SHOTS, 'bento_m08_p02_veio_m5.png') }); }
  }

  /* nada de "Grupo N" nem códigos na tela */
  check(!/Grupo \d/.test(await page.innerText('#tela')), 'sem "Grupo N" na tela');
  check(!/M8\.P|M5\.P|M1\.P/.test(await page.innerText('#tela')), 'sem código de pergunta na tela');
  assert.deepEqual(errs, [], 'sem pageerror');
  console.log(`PASS: M08 correções (${ok} verificações: teclado, campo numérico, tipo de oferta herdado e aviso, alerta forte do MEI, CNAEs compatíveis, "Não sei" que pede resposta em P01–P05)`);
  await b.close(); server.close();
})().catch((e) => { console.error('FAIL', e); process.exit(1); });
