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
  const shotNs = async (cod) => { if (!SHOTS) return; await page.waitForTimeout(400); await page.screenshot({ path: path.join(SHOTS, `l_m08_depois_${cod.slice(-3).toLowerCase()}_naosei.png`) }); };
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
  await ateResultado({ 'M8.P05': 'MEI (Microempreendedor Individual)', 'M8.P02': 'Mercadoria' });
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
  /* P05 com as siglas por extenso (nov/2026): resposta antiga "MEI" continua valendo; ME já tem CNPJ fora do MEI */
  const p05 = async (opcao) => { await page.evaluate((o) => { const s = JSON.parse(localStorage.getItem('lg2-turma-b-m08')); s.R['M8.P04'] = { estado: 'valor', valor: '9000' }; s.R['M8.P05'] = { estado: 'opcao', opcao: o }; localStorage.setItem('lg2-turma-b-m08', JSON.stringify(s)); }, opcao); await page.reload(); await btn('Continuar de onde parei').click(); };
  await p05('MEI');
  check(await page.locator('#alerta-mei').count() === 1 && nrm(await page.textContent('#alerta-mei')).includes('sai do MEI'), 'P05 antigo "MEI": alerta de quem sai do MEI');
  check(nrm(await page.textContent('#entendemos')).includes('sai do MEI'), 'P05 antigo "MEI": entendemos diz que sai do MEI');
  await p05('MEI (Microempreendedor Individual)');
  check(nrm(await page.textContent('#alerta-mei')).includes('sai do MEI'), 'P05 "MEI (Microempreendedor Individual)": alerta de quem sai do MEI');
  check(nrm(await page.textContent('#entendemos')).includes('Você já tem CNPJ: MEI (Microempreendedor Individual).'), 'entendemos mostra o tipo por extenso');
  for (const o of ['ME (Microempresa)', 'LTDA (Sociedade Limitada)', 'EI']) {
    await p05(o);
    check(await page.locator('#alerta-mei').count() === 0, `P05 "${o}": já tem CNPJ fora do MEI, sem alerta do MEI`);
  }
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
  await escolher('MEI (Microempreendedor Individual)'); await btn('Continuar').click();
  check(nrm(await page.textContent('#retorno')).includes('sai do MEI'), 'P05 = MEI acima do limite: alerta logo na resposta');

  /* versão leve (nov/2026): todo "Não sei" mostra "Como descobrir" com 2 passos escritos para a pergunta e,
     quando a pergunta tem pedido para a IA, o texto pronto e o botão "Copiar" */
  const DADOS = await page.evaluate(() => Object.fromEntries(window.MODULO8.perguntas.map((q) => [q.codigo, { passos: q.comoDescobrir, prompt: q.promptIA }])));
  const comoDescobrir = async (cod) => {
    const box = page.locator('#ns-ajuda');
    check(await box.isVisible() && nrm(await box.locator('.como-tit').textContent()) === 'Como descobrir', `${cod}: caixa "Como descobrir" à vista`);
    const passos = await box.locator('ol > li').allTextContents();
    check(passos.length === 2 && passos.every((x) => nrm(x).length > 20) && JSON.stringify(passos.map(nrm)) === JSON.stringify(DADOS[cod].passos.map(nrm)), `${cod}: 2 passos concretos dos dados (${passos.length})`);
    check(passos.every((x) => !/ChatGPT|Gemini|Copilot/i.test(x)), `${cod}: sem marca de IA`);
    if (DADOS[cod].prompt) {
      check(nrm(await box.locator('[data-prompt]').textContent()) === nrm(DADOS[cod].prompt) && /\[.+\]/.test(DADOS[cod].prompt), `${cod}: pedido para a IA com colchetes`);
      check(/Copie, cole numa IA de sua preferência e troque o que está entre colchetes\./.test(await box.textContent()) && !/ChatGPT|Gemini/i.test(await box.textContent()), `${cod}: nota sem marca de IA`);
      const cp = box.getByRole('button', { name: 'Copiar', exact: true });
      check(await cp.count() === 1, `${cod}: botão Copiar`);
      await cp.click();
      let respCp = '';
      for (let i = 0; i < 20; i++) { respCp = nrm(await box.locator('[data-copiar]').textContent()); if (respCp !== 'Copiar') break; await page.waitForTimeout(100); }
      check(['Copiado!', 'Toque e segure o texto para copiar'].includes(respCp), `${cod}: Copiar responde`);
    } else check(await box.locator('[data-copiar]').count() === 0, `${cod}: sem pedido para a IA, sem Copiar`);
    if (cod === 'M8.P05' || cod === 'M8.P07' || cod === 'M8.P04') await shotNs(cod);
  };

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
      check(await page.locator('#ns-ajuda').isVisible() && aj.startsWith('Como descobrir') && aj.includes('Precisamos desta resposta para seguir'), `${cod}: "Não sei" mostra como descobrir e pede a resposta (${aj.slice(0, 60)})`);
      await comoDescobrir(cod);
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
      check(r && (ops.length ? JSON.stringify(r) === JSON.stringify({ estado: 'opcao', opcao: 'Não sei' }) : JSON.stringify(r) === JSON.stringify({ estado: 'naosei' })), `${cod}: "Não sei" continua aceito e gravado como antes (${JSON.stringify(r)})`);
      check(!/Precisamos desta resposta/.test(await page.textContent('#ns-ajuda')), `${cod}: sem pedido de resposta obrigatória`);
      await comoDescobrir(cod);
      check(JSON.stringify((await st()).R[cod]) === JSON.stringify(r), `${cod}: tocar em Copiar não muda a resposta salva`);
    }
    await seguir();
  }
  check(await atual() === 'RESULTADO', '"Não sei" nas opcionais chega ao resultado');
  check(nrm(await page.textContent('.res-num .sub')).startsWith('4 com'), `resultado: 4 "Não sei" (P06, P07, P09, P10): ${nrm(await page.textContent('.res-num .sub'))}`);
  /* resultado: "O que falta descobrir" com um "Como descobrir" fechado para cada "Não sei" */
  check(await page.locator('#falta > ul > li').count() === 4 && await page.locator('#falta details.como-mini').count() === 4, 'resultado: 4 lacunas, cada uma com "Como descobrir"');
  check(await page.$$eval('#falta details.como-mini', (ds) => ds.every((d) => !d.open && d.querySelectorAll('ol > li').length === 2)), 'resultado: "Como descobrir" fechado, com 2 passos');
  check(nrm(await page.textContent('#tarefa')).startsWith('Seu próximo passo'), 'resultado: próximo passo');
  check(await page.evaluate(() => document.querySelector('#entendemos').compareDocumentPosition(document.querySelector('#tarefa')) & 4 && document.querySelector('#tarefa').compareDocumentPosition(document.querySelector('#falta')) & 4), 'resultado: entendemos → próximo passo → falta descobrir');
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

  /* ===== Lote 3 (nov/2026) ===== */
  /* Receita C: Voltar no topo do cartão; na 1ª pergunta volta à capa */
  await semear({}); await page.reload(); await btn('Começar').click();
  check(await btn('Voltar').count() === 1 && await btn('Início').count() === 0, '1ª pergunta: só o botão Voltar (faixa compacta, sem trilha)');
  check(await page.evaluate(() => document.querySelector('.cartao-q').firstElementChild.id === 'v'), 'Voltar é o 1º item do cartão da pergunta');
  await btn('Voltar').click();
  check(await page.locator('.heroi-grande').count() === 1, 'Voltar na 1ª pergunta volta à capa');
  /* Receita D: ajuda longa da P02 com "Ver mais" fechado; opções e Continuar à vista */
  await btn('Começar').click();
  await page.fill('#ent textarea', 'Faço tranças'); await btn('Continuar').click(); await seguir();
  check(await atual() === 'M8.P02' && await page.locator('details.dica-toggle').count() === 1 && !(await page.$eval('details.dica-toggle', (d) => d.open)), 'P02: ajuda longa dentro de "Ver dica" fechado');
  check(!(await page.innerText('#tela')).includes('Mercadoria: você compra pronto'), 'P02: ajuda longa fora da vista até tocar em "Ver dica"');
  check(await page.evaluate(() => { const q = document.querySelector('.cartao-q .q'), d = document.querySelector('details.dica-toggle'), e = document.querySelector('#ent'); return (q.compareDocumentPosition(d) & 4) && (d.compareDocumentPosition(e) & 4); }), 'P02: "Ver dica" entre a pergunta e as respostas');
  await escolher('Serviço'); await btn('Continuar').click(); await seguir();
  /* item 5: opção "Na casa do cliente (atendimento em domicílio)" */
  const ops3 = await page.$$eval('#ent .opcao', (x) => x.map((e) => e.textContent.trim()));
  check(JSON.stringify(ops3) === JSON.stringify(['Minha casa', 'Ponto comercial', 'Na casa do cliente (atendimento em domicílio)', 'Atendimento externo', 'Online', 'Não sei']), 'P03 com a opção de domicílio: ' + ops3.join(' | '));
  await escolher('Na casa do cliente (atendimento em domicílio)'); await btn('Continuar').click(); await seguir();
  check((await st()).R['M8.P03'].opcao === 'Na casa do cliente (atendimento em domicílio)', 'domicílio gravado');
  /* P04..P06 */
  await page.fill('#ent input', '2500'); await btn('Continuar').click(); await seguir();
  await escolher('Não'); await btn('Continuar').click(); await seguir();
  await btn('Não sei').click(); await seguir();
  /* item 2: "Quem pode ser MEI" na pergunta da lista do MEI, recolhido, embaixo do Continuar */
  check(await atual() === 'M8.P07', 'chega à P07');
  const qm = page.locator('details#quem-mei');
  check(await qm.count() === 1 && !(await qm.evaluate((d) => d.open)), 'P07: "Quem pode ser MEI" recolhido');
  check(await page.evaluate(() => document.querySelector('#acoes').compareDocumentPosition(document.querySelector('#quem-mei')) & 4) > 0, 'P07: "Quem pode ser MEI" embaixo do Continuar');
  await escolher('Sim'); await btn('Continuar').click(); await seguir();
  await escolher('Não'); await btn('Continuar').click(); await seguir();   // P08
  await escolher('Não'); await btn('Continuar').click(); await seguir();   // P09
  /* item 4: fontes depois da dúvida principal */
  check(await atual() === 'M8.P10', 'chega à P10');
  check(await page.locator('#fontes-duvida').count() === 0, 'P10: fontes só depois da resposta');
  await escolher('Se posso ser MEI'); await btn('Continuar').click();
  const fd = nrm(await page.textContent('#retorno #fontes-duvida'));
  for (const t of ['Onde tirar suas dúvidas', 'Sala do Empreendedor de Juiz de Fora', 'Portal do Empreendedor (gov.br)', 'Sebrae', '0800 570 0800', 'contador']) check(fd.includes(t), `P10 fontes: "${t}"`);
  const hrefs = await page.$$eval('#fontes-duvida a', (as) => as.map((a) => a.href));
  check(hrefs.includes('https://desenvolvejf.pjf.mg.gov.br/sme.html') && hrefs.includes('https://www.gov.br/empresas-e-negocios/pt-br/empreendedor') && hrefs.some((h) => h.startsWith('https://sebrae.com.br/')), 'P10: links oficiais ' + hrefs.join(' '));
  if (SHOTS) { await page.waitForTimeout(400); await page.locator('#fontes-duvida').scrollIntoViewIfNeeded(); await page.screenshot({ path: path.join(SHOTS, 'l3_m08_fontes_duvida.png') }); }
  await seguir();
  check(await atual() === 'RESULTADO', 'resultado');
  /* item 2 no resultado: cartão aberto com os 4 critérios e a fonte */
  const qmr = nrm(await page.textContent('section#quem-mei'));
  for (const t of ['Quem pode ser MEI', 'R$ 81.000 por ano em 2026', 'R$ 110.000', 'lista de ocupações permitidas ao MEI', 'Não ser sócio nem titular de outra empresa', 'no máximo 1 empregado', 'Confira na Sala do Empreendedor ou no Portal do Empreendedor (gov.br)']) check(qmr.includes(t), `quem pode ser MEI: "${t}"`);
  check(await page.locator('section#quem-mei li').count() === 4, 'quem pode ser MEI: 4 critérios');
  check((await page.$$eval('section#quem-mei a', (as) => as.map((a) => a.href))).includes('https://www.gov.br/pt-br/servicos/realizar-registro-como-microempreendedor-individual-mei'), 'quem pode ser MEI: fonte gov.br');
  check(await page.locator('#tela #fontes-duvida').count() === 1, 'fontes da dúvida também no resultado');
  check(nrm(await page.textContent('#entendemos')).includes('Você atende na casa do cliente'), 'entendemos: atendimento em domicílio');
  /* item 3: Copiar e Escolher este em cada CNAE compatível */
  await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('lg2-turma-b-m08')); s.R['M8.P01'] = { estado: 'valor', valor: 'Manicure e pedicure em domicílio' }; localStorage.setItem('lg2-turma-b-m08', JSON.stringify(s)); });
  await page.reload(); await btn('Continuar de onde parei').click();
  check(await page.$eval('details#ocupacoes', (d) => !d.open), 'ocupações do MEI recolhidas no resultado');
  await page.click('details#ocupacoes > summary');
  const nSug = await page.locator('#sugestoes .cnae').count();
  check(nSug >= 1 && await page.locator('#sugestoes .btn-copiar-cnae').count() === nSug && await page.locator('#sugestoes .btn-escolher').count() === nSug, `cada CNAE sugerido tem Copiar e Escolher este (${nSug})`);
  check(await page.locator('#cnae-escolhido h3').count() === 0, 'sem escolha, sem CNAE escolhido');
  const iMani = await page.$$eval('#sugestoes .cnae', (cs) => cs.findIndex((c) => c.textContent.includes('MANICURE/PEDICURE INDEPENDENTE')));
  check(iMani >= 0, 'manicure entre as sugestões');
  const cMani = page.locator('#sugestoes .cnae').nth(iMani);
  check(await cMani.locator('.btn-copiar-cnae').getAttribute('data-t') === '9602-5/01 - MANICURE/PEDICURE INDEPENDENTE', 'Copiar leva código e nome');
  await cMani.getByRole('button', { name: 'Copiar', exact: true }).click();
  check(nrm(await cMani.locator('.btn-copiar-cnae').textContent()) === 'Copiado', 'Copiar mostra "Copiado"');
  const y0 = await page.evaluate(() => window.scrollY);
  await cMani.getByRole('button', { name: 'Escolher este', exact: true }).click();
  check(JSON.stringify((await st()).cnae) === JSON.stringify({ cnae: '9602-5/01', ocupacao: 'MANICURE/PEDICURE INDEPENDENTE' }), 'Escolher este salva no estado do módulo');
  check(nrm(await page.textContent('#cnae-escolhido')).includes('9602-5/01 · MANICURE/PEDICURE INDEPENDENTE') && nrm(await page.textContent('#cnae-escolhido h3')) === 'CNAE escolhido', 'CNAE escolhido aparece no resumo');
  check(nrm(await cMani.locator('.btn-escolher').textContent()) === 'Escolhido' && await page.locator('#sugestoes .btn-escolher[aria-pressed=true]').count() === 1, 'só o escolhido fica marcado');
  check(Math.abs((await page.evaluate(() => window.scrollY)) - y0) < 5, 'escolher não pula para o topo');
  if (SHOTS) { await page.waitForTimeout(400); await page.locator('#sugestoes').scrollIntoViewIfNeeded(); await page.screenshot({ path: path.join(SHOTS, 'l3_m08_cnae_escolher.png') }); }
  await page.reload(); await btn('Continuar de onde parei').click();
  await page.click('details#ocupacoes > summary');
  check(nrm(await page.textContent('#cnae-escolhido')).includes('9602-5/01') && nrm(await page.textContent('#entendemos')).includes('Você escolheu o CNAE 9602-5/01'), 'escolha guardada após recarregar e citada em "O que entendemos"');
  if (SHOTS) { await page.click('details#mais-detalhes > summary'); await page.waitForTimeout(400); await page.locator('#quem-mei').scrollIntoViewIfNeeded(); await page.screenshot({ path: path.join(SHOTS, 'l3_m08_quem_pode_ser_mei.png') }); }
  /* a consulta da lista também deixa copiar e escolher */
  await btn('Consultar as ocupações permitidas ao MEI').click();
  await page.fill('#busca', 'cabeleireiro');
  check(await page.locator('#lista .btn-escolher').count() >= 1, 'consulta: Escolher este');
  await page.locator('#lista .cnae', { hasText: 'CABELEIREIRO(A) INDEPENDENTE' }).first().getByRole('button', { name: 'Escolher este', exact: true }).click();
  check(/CABELEIREIR/i.test((await st()).cnae.ocupacao), 'consulta: escolha salva ' + (await st()).cnae.ocupacao);
  await btn('Voltar').click();
  check(await atual() === 'RESULTADO' && /CABELEIREIR/i.test(nrm(await page.textContent('#cnae-escolhido'))), 'Voltar da consulta: resumo com o novo CNAE');
  /* item 5: domicílio vindo do Módulo 9 chega marcado */
  await semear({ 'lg2-turma-b-m09': { v: 2, R: { 'M9-03': { estado: 'opcao', opcao: 'Na casa do cliente (atendimento em domicílio)' } } } });
  await page.reload(); await btn('Começar').click();
  await page.fill('#ent textarea', 'Faço tranças'); await btn('Continuar').click(); await seguir();
  await escolher('Serviço'); await btn('Continuar').click(); await seguir();
  check(nrm(await page.textContent('#ent .opcao.sel')) === 'Na casa do cliente (atendimento em domicílio)' && nrm(await page.textContent('#herdou .veio')) === 'Veio do Módulo 9', 'P03: domicílio herdado do Módulo 9');
  if (SHOTS) { await page.waitForTimeout(400); await page.screenshot({ path: path.join(SHOTS, 'l3_m08_voltar_domicilio.png') }); }

  /* nada de "Grupo N" nem códigos na tela */
  check(!/Grupo \d/.test(await page.innerText('#tela')), 'sem "Grupo N" na tela');
  check(!/M8\.P|M5\.P|M1\.P/.test(await page.innerText('#tela')), 'sem código de pergunta na tela');
  assert.deepEqual(errs, [], 'sem pageerror');
  console.log(`PASS: M08 correções (${ok} verificações: teclado, campo numérico, tipo de oferta herdado e aviso, alerta forte do MEI, CNAEs compatíveis, "Não sei" que pede resposta em P01–P05)`);
  await b.close(); server.close();
})().catch((e) => { console.error('FAIL', e); process.exit(1); });
