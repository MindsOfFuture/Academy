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
  page.on('pageerror', (e) => { errs.push(e.message); console.log('PAGEERROR', e.message); });
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
  /* lote 17/11 (item A): um toque por pergunta. Não existe mais passo extra: "seguir" agora só confere que não sobrou
     "Seguir" nem "Corrigir minha resposta" na tela (reintroduzir o passo extra faz o teste falhar) */
  const seguir = async () => { check(await btn('Seguir').count() === 0 && await btn('Corrigir minha resposta').count() === 0, 'um toque: sem "Seguir" nem "Corrigir minha resposta"'); };
  /* retorno ao vivo de campo: sai do campo (blur) e espera o retorno aparecer, antes do Continuar */
  const sairDoCampo = async () => { await page.locator('#ent input, #ent textarea').evaluate((e) => e.blur()); await page.waitForTimeout(50); };
  const escolher = (op) => page.getByRole('button', { name: op, exact: true }).click();
  /* responde até o resultado: opção pedida, senão "Não" ou a 1ª; texto neutro quando o campo está vazio */
  const ateResultado = async (resp = {}) => {
    for (let i = 0; i < 15 && (await atual()) !== 'RESULTADO'; i++) {
      const cod = await atual();
      const ops = await page.$$eval('#ent .opcao', (x) => x.map((e) => e.querySelector('.op-txt > b').textContent.trim()));
      if (ops.length) await escolher(resp[cod] || (ops.includes('Não') ? 'Não' : ops[0]));
      else if (resp[cod] || !(await page.inputValue('#ent input, #ent textarea')))   // valor herdado fica como veio
        await page.fill('#ent input, #ent textarea', resp[cod] || (cod === 'M8.P04' ? '3000' : 'Faço bolos de pote'));
      await btn('Continuar').click();
      if (await page.locator('#erro.erro-aviso:visible').count()) await btn('Continuar').click();   // aviso de valor alto: 2º toque (risco, fica em 2 passos)
      check(await atual() !== cod, `${cod}: um toque em Continuar já abre a próxima`);
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
  check(await page.evaluate(() => { const e = document.querySelector('#erro'), ok = document.querySelector('#ok'); return e.getAttribute('role') === 'alert' && e.parentElement === ok.parentElement && (e.compareDocumentPosition(ok) & 4) > 0; }), 'item B: mensagem logo acima do Continuar, com role="alert"');
  /* item A: o alerta do MEI aparece ao vivo, logo abaixo do campo, antes do Continuar */
  await page.waitForSelector('#retorno #alerta-mei');
  check(await page.locator('#retorno #alerta-mei').count() === 1 && await atual() === 'M8.P04', 'P04 acima do limite: alerta do MEI ao vivo, antes de gravar');
  /* conta feita à mão: 2.250.000 × 12 = 27.000.000 */
  check(nrm(await page.textContent('#retorno #alerta-mei')).includes('Como calculamos: R$ 2.250.000 por mês × 12 meses = R$ 27.000.000 por ano.'), 'P04: "Como calculamos" do ano no alerta');
  check(nrm(await page.textContent('#retorno #alerta-mei')).includes('Limite por mês: R$ 81.000 ÷ 12 meses = R$ 6.750.'), 'P04: conta do limite por mês');
  { const bb = await page.locator('#ok').boundingBox(); check(bb && bb.y >= 0 && bb.y + bb.height <= 450, 'com o aviso e o teclado aberto, o Continuar continua visível ' + JSON.stringify(bb)); }
  await page.setViewportSize({ width: 390, height: 844 });
  await btn('Continuar').click();                                   // 2º toque com o mesmo valor segue
  check((await st()).R['M8.P04'] && (await st()).R['M8.P04'].valor === '2.250.000', 'segundo Continuar grava o valor alto');
  check(await atual() === 'M8.P05', 'aviso de risco confirmado: já abre a próxima pergunta');
  await seguir();
  /* dentro do limite: 2.500,50 × 12 = 30.006 (centavos no padrão brasileiro, conta e resultado iguais). Corrigir = Voltar do topo */
  await btn('Voltar').click();
  check(await atual() === 'M8.P04' && await page.inputValue('#ent input') === '2.250.000', 'Voltar reabre a P04 com o valor gravado');
  await page.fill('#ent input', '2500,50'); await sairDoCampo();
  check(nrm(await page.textContent('#conta-ano')) === 'Seu faturamento no ano Cerca de R$ 30.006 por ano: dentro do limite do MEI em 2026, que é de R$ 81.000 por ano. Como calculamos: R$ 2.500,50 por mês × 12 meses = R$ 30.006 por ano.', 'P04: conta do ano ao vivo, dentro do limite: ' + nrm(await page.textContent('#conta-ano')));
  check(await page.locator('#retorno #alerta-mei').count() === 0, 'dentro do limite: sem alerta');
  /* sem sair do campo: o retorno aparece depois de ~700 ms sem digitar */
  await page.fill('#ent input', '3000'); await page.waitForTimeout(1000);
  check(nrm(await page.textContent('#conta-ano')).includes('R$ 36.000 por ano'), 'P04: retorno ao vivo após uma pausa na digitação (3.000 × 12 = 36.000)');
  await page.fill('#ent input', '2500,50');
  await btn('Continuar').click();
  check((await st()).R['M8.P04'].valor === '2.500,50', 'valor guardado no padrão brasileiro: ' + (await st()).R['M8.P04'].valor);
  check(await atual() === 'M8.P05', 'P04: um toque grava e abre a P05');
  await page.evaluate(() => localStorage.clear());

  /* ===== Item 2: tipo de oferta herdado (Mercadoria) e aviso ao escolher diferente ===== */
  const M1 = { v: 3, R: { 'M1.P01': { estado: 'opcao', opcao: 'Já vendo sempre' }, 'M1.P03': { estado: 'valor', valor: 'Bolos de pote' },
    'M1.P03A': { estado: 'opcao', opcao: 'Mercadoria: compro pronto para revender' } } };
  await semear({ 'lg2-turma-a-m01': M1 });
  await page.reload(); await btn('Começar').click();
  /* item F: P01 e P02 já respondidas no Módulo 1 → sem tela; a 1ª tela é a P03, com o cartão "Veio do Módulo 1 · Trocar" */
  check(await atual() === 'M8.P03', 'P01 e P02 do Módulo 1: sem tela, começa na P03');
  { const cv = nrm(await page.textContent('#veio'));
    check(cv.includes('O que você faz: Bolos de pote') && cv.includes('O que você vende: Mercadoria') && await page.locator('#veio .veio').count() === 2 && await page.locator('#veio [data-trocar]').count() === 2, 'cartão: o que veio do Módulo 1, com Trocar: ' + cv); }
  check(JSON.stringify((await st()).R['M8.P02']) === JSON.stringify({ estado: 'opcao', opcao: 'Mercadoria', de: 1, reuso: true }), 'P02 gravada no formato do Módulo 8: ' + JSON.stringify((await st()).R['M8.P02']));
  check(JSON.stringify((await st()).R['M8.P01']) === JSON.stringify({ estado: 'valor', valor: 'Bolos de pote', de: 1, reuso: true }), 'P01 gravada no formato do Módulo 8');
  await page.click('#veio [data-trocar="M8.P02"]');
  assert.equal(await atual(), 'M8.P02');
  check(nrm(await page.textContent('#ent .opcao.sel .op-txt > b')) === 'Mercadoria', 'Trocar: P02 abre com Mercadoria marcada');
  check(nrm(await page.textContent('#herdou .veio')) === 'Veio da Etapa 1', 'Trocar: selo na pergunta');
  check(await page.locator('#ent .op-ex').count() === 4, 'P02: exemplo embaixo de cada tipo');
  const ops2 = await page.$$eval('#ent .opcao', (x) => x.map((e) => e.querySelector('.op-txt > b').textContent.trim()));
  assert.deepEqual(ops2, ['Produto', 'Mercadoria', 'Serviço', 'Produto e serviço', 'Não sei']);
  check(await page.locator('#aviso-tipo').count() === 0, 'mesma opção herdada: sem aviso');
  /* item D: escolha única diz se está marcada */
  check(JSON.stringify(await page.$$eval('#ent .opcao', (x) => x.map((e) => e.getAttribute('aria-pressed')))) === JSON.stringify(['false', 'true', 'false', 'false', 'false']), 'P02: aria-pressed só na opção marcada (Mercadoria)');
  await escolher('Produto');
  /* item A: o aviso aparece no toque, antes do Continuar */
  const av = nrm(await page.textContent('#retorno #aviso-tipo'));
  check(av.includes('Na Etapa 1 você respondeu “Mercadoria: compro pronto para revender”') && av.includes('Aqui você escolheu “Produto”') && av.includes('escolha outra opção acima') && !/Corrigir/.test(av), `aviso de divergência ao vivo: ${av}`);
  check(JSON.stringify(await page.$$eval('#ent .opcao', (x) => x.map((e) => e.getAttribute('aria-pressed')))) === JSON.stringify(['true', 'false', 'false', 'false', 'false']), 'P02: depois do toque, aria-pressed="true" só em Produto');
  await escolher('Mercadoria');
  check(await page.locator('#aviso-tipo').count() === 0, 'voltar à opção herdada tira o aviso na hora');
  await escolher('Produto');
  await btn('Continuar').click();
  check(await atual() === 'M8.P03', 'aviso não trava: um toque segue com a escolha diferente');
  check(await page.evaluate(() => document.activeElement && document.activeElement.matches('.cartao-q h2.q') && document.activeElement.getAttribute('tabindex') === '-1'), 'item D: depois de Continuar, o foco está no enunciado da pergunta nova');
  await seguir();
  check(await page.locator('#veio [data-trocar="M8.P02"]').count() === 0, 'P02 trocada: sai do cartão');
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
  check(st8.R['M8.P04'].valor === '2.250.000' && st8.R['M8.P04'].de === 5 && st8.R['M8.P04'].reuso === true, 'faturamento herdado do Módulo 5 (1.500 × 1.500), no padrão brasileiro: ' + st8.R['M8.P04'].valor);
  check(!st8.hist.includes('M8.P04') && !st8.hist.includes('M8.P02'), 'P02 e P04 reaproveitadas: sem tela');
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
  /* contas feitas à mão: 7.500 × 12 = 90.000; 81.000 + 20% (16.200) = 97.200 */
  check(am.includes('Como calculamos: R$ 7.500 por mês × 12 meses = R$ 90.000 por ano.') && am.includes('Como calculamos: R$ 81.000 + 20% (R$ 16.200) = R$ 97.200 por ano.'), `até 20%: "Como calculamos": ${am}`);
  check(nrm(await page.textContent('#calc-ano')) === 'Como calculamos: R$ 7.500 por mês × 12 meses = R$ 90.000 por ano.', 'resumo: conta do ano logo abaixo do que entendemos');
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
  await page.reload();
  check(!(await st()).R['M8.P04'] && (await st()).R['M8.P05'], 'P04 "Não sei" antigo: só essa resposta é apagada');
  await btn('Começar').click();   // a P04 não estava na trilha salva (tinha vindo de outro módulo): recomeça do início, com as respostas guardadas
  check(await atual() === 'M8.P03' && (await st()).R['M8.P04'].valor === '2.250.000' && (await st()).R['M8.P04'].de === 5, 'P04 "Não sei" antigo: o valor do Módulo 5 entra de novo, sem tela');
  await btn('Continuar').click(); await seguir();
  check(await atual() === 'M8.P05', 'P04 pulada');
  check(nrm(await page.textContent('#veio')).includes('Faturamento por mês: R$ 2.250.000 por mês') && nrm(await page.textContent('#veio')).includes('Como calculamos: R$ 1.500 (preço de uma venda) × 1.500 (vendas por mês) = R$ 2.250.000 por mês.'), 'P05: cartão com o faturamento e a conta: ' + nrm(await page.textContent('#veio')));
  await page.click('#veio [data-trocar="M8.P04"]');
  check(await atual() === 'M8.P04' && await page.inputValue('#ent input') === '2.250.000', 'Trocar: o campo vem no padrão brasileiro');
  /* alerta na própria P05 ao escolher MEI */
  await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('lg2-turma-b-m08')); s.R['M8.P04'] = { estado: 'valor', valor: '9000' }; s.hist = ['M8.P01', 'M8.P02', 'M8.P03', 'M8.P04', 'M8.P05']; localStorage.setItem('lg2-turma-b-m08', JSON.stringify(s)); });
  await page.reload(); await btn('Continuar de onde parei').click();
  assert.equal(await atual(), 'M8.P05');
  await escolher('MEI (Microempreendedor Individual)');
  check(nrm(await page.textContent('#retorno')).includes('sai do MEI') && await page.locator('#folga-mei').count() === 0, 'P05 = MEI acima do limite: alerta ao vivo, no toque');
  await btn('Continuar').click();
  check(await atual() !== 'M8.P05', 'P05: um toque segue');

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

  /* ===== Lote 16/11 (item A): "Não sei" BLOQUEIA em toda pergunta que o mantém; saiu de P01, P03 e P10 (sobre a própria pessoa) ===== */
  /* item H: sim/não sobre a própria pessoa (P05 "já tem CNPJ?") sem "Não sei"; regra externa (P07 lista do MEI, P08 responsável técnico, P09 alvará) mantém e bloqueia */
  const COM_NS = ['M8.P02', 'M8.P04', 'M8.P06', 'M8.P07', 'M8.P08', 'M8.P09'];
  const SEM_NS = ['M8.P01', 'M8.P03', 'M8.P05', 'M8.P10'];
  const RESP = { 'M8.P02': 'Serviço', 'M8.P05': 'Não', 'M8.P07': 'Sim', 'M8.P08': 'Não', 'M8.P09': 'Sim' };   // Serviço e Não: passa pela P06, P07 e P08
  const vistosNs = [];
  await semear({});
  await page.reload(); await btn('Começar').click();
  for (let i = 0; i < 15 && (await atual()) !== 'RESULTADO'; i++) {
    const cod = await atual();
    vistosNs.push(cod);
    const ops = await page.$$eval('#ent .opcao', (x) => x.map((e) => e.querySelector('.op-txt > b').textContent.trim()));
    const temNs = ops.includes('Não sei') || await btn('Não sei').count() > 0;
    if (SEM_NS.includes(cod)) check(!temNs, `${cod}: pergunta sobre a própria pessoa, sem "Não sei"`);
    if (COM_NS.includes(cod)) {
      check(temNs, `${cod}: mantém o "Não sei"`);
      const antes = JSON.stringify(await st());
      if (ops.length) await escolher('Não sei'); else await btn('Não sei').click();
      const aj = nrm(await page.textContent('#ns-ajuda'));
      check(await page.locator('#ns-ajuda').isVisible() && aj.startsWith('Como descobrir') && aj.includes('Precisamos desta resposta para seguir'), `${cod}: "Não sei" mostra como descobrir e pede a resposta (${aj.slice(0, 60)})`);
      await comoDescobrir(cod);
      check(await page.locator('#ent .opcao.sel').count() === 0, `${cod}: "Não sei" não fica marcado`);
      check(JSON.stringify(await st()) === antes, `${cod}: "Não sei" não grava nada (estado salvo igual)`);
      await btn('Continuar').click();
      check(await atual() === cod && await page.locator('#retorno .retorno').count() === 0, `${cod}: Continuar não avança sem resposta`);
      const er = nrm(await page.textContent('#erro'));
      check(/^(Escolha uma opção|Escreva a sua resposta) para continuar\. Se não souber, toque em “Não sei” para ver como descobrir\.$/.test(er), `${cod}: mensagem simples: ${er}`);
      check(JSON.stringify(await st()) === antes, `${cod}: Continuar sem resposta não grava`);
      if (cod === 'M8.P06') check(aj.includes('Se não achar o código, escreva o que você faz'), 'P06: dá para escrever a atividade no lugar do código');
    } else check(SEM_NS.includes(cod), `${cod}: classificada`);
    if (ops.length) await escolher(RESP[cod] || ops[0]);
    else await page.fill('#ent input, #ent textarea', cod === 'M8.P04' ? '3000' : cod === 'M8.P06' ? 'fabricação de bolos' : 'Faço bolos de pote');
    if (ops.length) check(!(await page.locator('#ns-ajuda').isVisible()), `${cod}: escolher uma opção esconde a explicação`);
    if (cod === 'M8.P04') {   // conta feita à mão: 3.000 × 12 = 36.000
      await sairDoCampo();
      check(nrm(await page.textContent('#conta-ano')).includes('Como calculamos: R$ 3.000 por mês × 12 meses = R$ 36.000 por ano.'), 'P04: "Como calculamos" ao vivo, antes do Continuar');
    }
    await btn('Continuar').click();
    { const r = (await st()).R[cod]; check(r && r.estado !== 'naosei' && r.opcao !== 'Não sei' && await atual() !== cod, `${cod}: com resposta, um toque grava e avança`); }
    await seguir();
  }
  check(await atual() === 'RESULTADO', 'chega ao resultado só com respostas de verdade');
  check(JSON.stringify(vistosNs) === JSON.stringify(['M8.P01', 'M8.P02', 'M8.P03', 'M8.P04', 'M8.P05', 'M8.P06', 'M8.P07', 'M8.P08', 'M8.P09', 'M8.P10']), 'passou pelas 10 perguntas: ' + vistosNs.join(','));
  check(Object.values((await st()).R).every((r) => r.estado !== 'naosei' && r.opcao !== 'Não sei'), 'nenhum "Não sei" gravado');
  check(nrm(await page.textContent('.res-num .sub')) === 'nenhuma com “Não sei”', 'resultado: nenhuma com "Não sei"');
  check(await page.locator('#falta').count() === 0, 'resultado: sem lista de "Não sei"');
  check(nrm(await page.textContent('#tarefa')).startsWith('Seu próximo passo'), 'resultado: próximo passo');
  /* respostas antigas "Não sei" (opção, botão e pergunta que perdeu o "Não sei"): viram "sem resposta"; as outras ficam */
  await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('lg2-turma-b-m08')); s.R['M8.P02'] = { estado: 'opcao', opcao: 'Não sei' }; s.R['M8.P06'] = { estado: 'naosei' }; s.R['M8.P10'] = { estado: 'opcao', opcao: 'Não sei' }; s.R['M8.P05'] = { estado: 'opcao', opcao: 'Não sei' }; localStorage.setItem('lg2-turma-b-m08', JSON.stringify(s)); });
  await page.reload();
  { const R = (await st()).R; check(!R['M8.P02'] && !R['M8.P05'] && !R['M8.P06'] && !R['M8.P10'] && R['M8.P01'] && R['M8.P04'] && R['M8.P09'], 'antigos "Não sei" apagados, outras respostas guardadas: ' + Object.keys(R).join(',')); }
  await btn('Continuar de onde parei').click();
  check(await atual() === 'M8.P02', '"Não sei" antigo: volta à 1ª pergunta que ficou sem resposta');
  check(await page.locator('#ent .opcao.sel').count() === 0, '"Não sei" antigo: nada marcado');

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
    /* item F (16/11): o tipo já respondido não tem tela; vem gravado e aparece no cartão da tela seguinte */
    if ((await atual()) === 'M8.P01') { await page.fill('#ent textarea', 'Bolos de pote'); await btn('Continuar').click(); await seguir(); }
    check(await atual() === 'M8.P03', `P02 (${nome}): sem tela do tipo`);
    { const r = (await st()).R['M8.P02']; check(r && r.opcao === val && r.de === mod && r.reuso === true, `P02 (${nome}): "${val}" gravado do Módulo ${mod}: ${JSON.stringify(r)}`); }
    const lin = nrm(await page.textContent('#veio .veio-linha[data-cod="M8.P02"]'));
    check(lin.includes(`O que você vende: ${val}`) && lin.includes(`Veio da Etapa ${mod}`), `P02 (${nome}): cartão "${lin}"`);
  }

  /* ===== Lote 3 (nov/2026) ===== */
  /* Receita C: Voltar no topo do cartão; na 1ª pergunta volta à capa */
  await semear({}); await page.reload(); await btn('Começar').click();
  check(await btn('Voltar').count() === 1 && await btn('Início').count() === 1 && await btn('Salvar e sair').count() === 1, '1ª pergunta: controles comuns + um Voltar no cabeçalho do módulo');
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
  const ops3 = await page.$$eval('#ent .opcao', (x) => x.map((e) => e.querySelector('.op-txt > b').textContent.trim()));
  check(JSON.stringify(ops3) === JSON.stringify(['Minha casa', 'Ponto comercial', 'Na casa do cliente (atendimento em domicílio)', 'Atendimento externo', 'Online']), 'P03 com a opção de domicílio, sem "Não sei": ' + ops3.join(' | '));
  await escolher('Na casa do cliente (atendimento em domicílio)'); await btn('Continuar').click(); await seguir();
  check((await st()).R['M8.P03'].opcao === 'Na casa do cliente (atendimento em domicílio)', 'domicílio gravado');
  /* P04..P06 */
  await page.fill('#ent input', '2500'); await btn('Continuar').click(); await seguir();
  await escolher('Não'); await btn('Continuar').click(); await seguir();
  await page.fill('#ent textarea', 'manicure'); await btn('Continuar').click(); await seguir();
  /* item 2: "Quem pode ser MEI" na pergunta da lista do MEI, recolhido, embaixo do Continuar */
  check(await atual() === 'M8.P07', 'chega à P07');
  const qm = page.locator('details#quem-mei');
  check(await qm.count() === 1 && !(await qm.evaluate((d) => d.open)), 'P07: "Quem pode ser MEI" recolhido');
  check(await page.evaluate(() => document.querySelector('#acoes').compareDocumentPosition(document.querySelector('#quem-mei')) & 4) > 0, 'P07: "Quem pode ser MEI" embaixo do Continuar');
  await escolher('Sim'); await btn('Continuar').click(); await seguir();
  check(await atual() === 'M8.P08', 'chega à P08');
  await escolher('Não');   // P08
  /* item G: o alerta da coluna I está na dica (antes de responder) e só aparece na resposta quando aponta um risco */
  check(await page.locator('#retorno .b-alerta').count() === 0, 'P08 = Não: sem balão de alerta');
  check(nrm(await page.textContent('details.dica-toggle #dica-extra')) === 'Atividades regulamentadas não podem ser exercidas sem habilitação.', 'P08: alerta dentro da dica');
  await escolher('Sim');
  check(nrm(await page.textContent('#retorno #alerta-resposta')) === 'Fique atento Atividades regulamentadas não podem ser exercidas sem habilitação.', 'P08 = Sim: aviso de risco ao vivo, no toque');
  await btn('Continuar').click();
  check(await atual() === 'M8.P09', 'P08 = Sim: o aviso não trava, um toque segue');
  await seguir();
  await escolher('Não');   // P09
  check(await page.locator('#retorno .b-alerta').count() === 0, 'P09: sem balão de alerta para qualquer resposta');
  await btn('Continuar').click();
  await seguir();
  /* item 4: fontes depois da dúvida principal */
  check(await atual() === 'M8.P10', 'chega à P10');
  check(await page.locator('#fontes-duvida').count() === 0, 'P10: fontes só depois da resposta');
  await escolher('Se posso ser MEI');
  const fd = nrm(await page.textContent('#retorno #fontes-duvida'));
  for (const t of ['Onde tirar suas dúvidas', 'Sala do Empreendedor de Juiz de Fora', 'Portal do Empreendedor (gov.br)', 'Sebrae', '0800 570 0800', 'contador']) check(fd.includes(t), `P10 fontes: "${t}"`);
  const hrefs = await page.$$eval('#fontes-duvida a', (as) => as.map((a) => a.href));
  check(hrefs.includes('https://desenvolvejf.pjf.mg.gov.br/sme.html') && hrefs.includes('https://www.gov.br/empresas-e-negocios/pt-br/empreendedor') && hrefs.some((h) => h.startsWith('https://sebrae.com.br/')), 'P10: links oficiais ' + hrefs.join(' '));
  if (SHOTS) { await page.waitForTimeout(400); await page.locator('#fontes-duvida').scrollIntoViewIfNeeded(); await page.screenshot({ path: path.join(SHOTS, 'l3_m08_fontes_duvida.png') }); }
  await btn('Continuar').click();
  await seguir();
  check(await atual() === 'RESULTADO', 'resultado');
  /* item 2 no resultado: cartão aberto com os 4 critérios e a fonte */
  const qmr = nrm(await page.textContent('section#quem-mei'));
  for (const t of ['Quem pode ser MEI', 'R$ 81.000 por ano em 2026', 'R$ 110.000', 'lista de ocupações permitidas ao MEI', 'Não ser sócio nem titular de outra empresa', 'Em 2026, ter no máximo 1 empregado', 'A partir de 1º de janeiro de 2027, até 2', 'Confira na Sala do Empreendedor ou no Portal do Empreendedor (gov.br)']) check(qmr.includes(t), `quem pode ser MEI: "${t}"`);
  check(await page.locator('section#quem-mei li').count() === 4, 'quem pode ser MEI: 4 critérios');
  const qmrHrefs = await page.$$eval('section#quem-mei a', (as) => as.map((a) => a.href));
  check(qmrHrefs.includes('https://www.gov.br/pt-br/servicos/realizar-registro-como-microempreendedor-individual-mei') && qmrHrefs.includes('https://www2.camara.leg.br/legin/fed/leicom/2026/leicomplementar-238-21-outubro-2026-800071-publicacaooriginal-181678-pl.html') && qmrHrefs.includes('https://www.gov.br/memp/pt-br/prospera-mei/teto-do-mei'), 'quem pode ser MEI: fontes gov.br + Câmara + MEMP');
  check(await page.locator('#tela #fontes-duvida').count() === 1, 'fontes da dúvida também no resultado');
  check(nrm(await page.textContent('#entendemos')).includes('Você atende na casa do cliente'), 'entendemos: atendimento em domicílio');
  /* item 3: Copiar e Escolher este em cada CNAE compatível */
  await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('lg2-turma-b-m08')); s.R['M8.P01'] = { estado: 'valor', valor: 'Manicure e pedicure em domicílio' }; localStorage.setItem('lg2-turma-b-m08', JSON.stringify(s)); });
  await page.reload(); await btn('Continuar de onde parei').click();
  /* item I: no resultado, toda seção recolhível vem aberta */
  check(await page.$$eval('#tela details', (ds) => ds.length > 0 && ds.every((d) => d.open)), 'resultado: todas as seções abertas');
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
  check(nrm(await page.textContent('#cnae-escolhido')).includes('9602-5/01') && nrm(await page.textContent('#entendemos')).includes('Você escolheu o CNAE 9602-5/01'), 'escolha guardada após recarregar e citada em "O que entendemos"');
  if (SHOTS) { await page.waitForTimeout(400); await page.locator('#quem-mei').scrollIntoViewIfNeeded(); await page.screenshot({ path: path.join(SHOTS, 'l3_m08_quem_pode_ser_mei.png') }); }
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
  check(await atual() === 'M8.P04' && (await st()).R['M8.P03'].opcao === 'Na casa do cliente (atendimento em domicílio)' && (await st()).R['M8.P03'].de === 9, 'P03: domicílio do Módulo 9 entra sem tela');
  check(nrm(await page.textContent('#veio')).includes('Onde trabalha: Na casa do cliente (atendimento em domicílio)') && nrm(await page.textContent('#veio .veio')) === 'Veio da Etapa 9', 'P04: cartão com o local que veio do Módulo 9');
  if (SHOTS) { await page.waitForTimeout(400); await page.screenshot({ path: path.join(SHOTS, 'l3_m08_voltar_domicilio.png') }); }

  /* ===== Bug 16/11 ("Pergunta 6: escolho o CNAE e não acontece nada") ===== */
  const ateP06 = async () => {
    await semear({}); await page.reload(); await btn('Começar').click();
    await page.fill('#ent textarea', 'Faço bolos de pote'); await btn('Continuar').click(); await seguir();
    await escolher('Produto'); await btn('Continuar').click(); await seguir();
    await escolher('Minha casa'); await btn('Continuar').click(); await seguir();
    await page.fill('#ent input', '3000'); await btn('Continuar').click(); await seguir();
    await escolher('Não'); await btn('Continuar').click(); await seguir();
    assert.equal(await atual(), 'M8.P06');
    check(nrm(await page.textContent('.passo')) === 'Pergunta 6 de 10', 'P06 é a tela "Pergunta 6"');
  };
  await ateP06();
  await btn('Consultar as ocupações permitidas ao MEI').click();
  await page.fill('#busca', 'confeit');
  const cConf = page.locator('#lista .cnae', { hasText: 'CONFEITEIRO(A) INDEPENDENTE' }).first();
  await cConf.getByRole('button', { name: 'Escolher este', exact: true }).tap().catch(() => cConf.getByRole('button', { name: 'Escolher este', exact: true }).click());
  check(await atual() === 'M8.P06', 'escolher o CNAE volta para a Pergunta 6');
  check(await page.inputValue('#ent textarea') === '1091-1/02 - CONFEITEIRO(A) INDEPENDENTE', 'a escolha aparece no campo: ' + await page.inputValue('#ent textarea'));
  { const fb = nrm(await page.textContent('#cnae-feedback'));
    check(fb.includes('Você escolheu 1091-1/02') && fb.includes('CONFEITEIRO(A) INDEPENDENTE') && fb.includes('está na lista de ocupações permitidas ao MEI'), 'retorno na hora: o que o código quer dizer: ' + fb); }
  check((await st()).R['M8.P06'].valor === '1091-1/02 - CONFEITEIRO(A) INDEPENDENTE' && (await st()).cnae.cnae === '1091-1/02', 'escolha já guardada (resposta da P06 e CNAE escolhido)');
  if (SHOTS) { await page.waitForTimeout(400); await page.screenshot({ path: path.join(SHOTS, 'm08_depois_cnae_escolheu.png'), fullPage: true }); }
  check(await page.locator('#retorno .cnae').count() >= 1, 'retorno ao vivo: mostra a ocupação da lista do MEI antes do Continuar');
  await btn('Continuar').click();
  await seguir();
  check(await atual() === 'M8.P08' || await atual() === 'M8.P09', 'P07 (lista do MEI) respondida pela escolha: sem tela; foi para ' + await atual());
  check(JSON.stringify((await st()).R['M8.P07']) === JSON.stringify({ estado: 'opcao', opcao: 'Sim', de: 'CNAE', reuso: true }), 'P07 = Sim, vindo do CNAE: ' + JSON.stringify((await st()).R['M8.P07']));
  { const cv = nrm(await page.textContent('#veio'));
    check(cv.includes('Está na lista do MEI: Sim') && cv.includes('Veio da sua escolha do CNAE') && await page.locator('#veio [data-trocar="M8.P07"]').count() === 1, 'cartão "Veio da sua escolha do CNAE · Trocar": ' + cv); }
  await ateResultado();
  check(nrm(await page.textContent('details.respostas')).includes('1091-1/02 - CONFEITEIRO(A) INDEPENDENTE') && nrm(await page.textContent('#entendemos')).includes('Você escolheu o CNAE 1091-1/02'), 'CNAE no resumo');
  /* código digitado: retorno na hora, enquanto digita */
  await ateP06();
  await page.fill('#ent textarea', '9602-5/01');
  check(nrm(await page.textContent('#cnae-feedback')).includes('Código 9602-5/01'), 'código digitado: retorno na hora');
  await page.fill('#ent textarea', '1234-5/67');
  check(nrm(await page.textContent('#cnae-feedback')).includes('Não achamos este código'), 'código fora da lista: avisa');
  await btn('Continuar').click(); await seguir();
  check(await atual() === 'M8.P07', 'código fora da lista: a P07 continua sendo perguntada');

  /* ===== Anotações da pesquisa (16/11): escrever, ir e voltar, recarregar, ver no resumo ===== */
  await ateP06();
  await btn('Voltar').click();   // P05
  assert.equal(await atual(), 'M8.P05');
  check(await page.$eval('details#notas', (d) => !d.open), 'anotações recolhidas quando vazias');
  await page.click('details#notas > summary');
  await page.fill('#nota-texto', 'No Cartão CNPJ vi que ainda não tenho empresa aberta.');
  await page.fill('#nota-onde', 'Site da Receita Federal');
  await page.fill('#nota-data', '2026-11-16');
  check(JSON.stringify((await st()).notas['M8.P05']) === JSON.stringify({ texto: 'No Cartão CNPJ vi que ainda não tenho empresa aberta.', onde: 'Site da Receita Federal', data: '2026-11-16' }), 'anotação guardada no estado do módulo');
  check(await page.locator('#notas .lg2-falar').count() >= 1, 'anotação com botão Falar');
  if (SHOTS) { await page.waitForTimeout(400); await page.locator('#notas').scrollIntoViewIfNeeded(); await page.screenshot({ path: path.join(SHOTS, 'm08_depois_notas.png'), fullPage: true }); }
  await escolher('Não'); await btn('Continuar').click(); await seguir();   // P06
  await btn('Voltar').click();
  check(await atual() === 'M8.P05' && await page.inputValue('#nota-texto') === 'No Cartão CNPJ vi que ainda não tenho empresa aberta.' && await page.$eval('details#notas', (d) => d.open), 'ir e voltar: anotação continua, aberta');
  await page.reload(); await btn('Continuar de onde parei').click();
  check(await page.inputValue('#nota-onde') === 'Site da Receita Federal' && await page.inputValue('#nota-data') === '2026-11-16', 'recarregar: anotação continua');
  /* "Não sei" numa pergunta de pesquisa abre as anotações junto da ajuda */
  await escolher('Não'); await btn('Continuar').click(); await seguir();
  await page.fill('#ent textarea', 'fabricação de bolos'); await btn('Continuar').click(); await seguir();   // P07
  await escolher('Não sei');
  check(await page.$eval('details#notas', (d) => d.open), '"Não sei": anotações abertas junto do "Como descobrir"');
  await page.fill('#nota-texto', 'Achei confeiteiro na lista do gov.br.');
  await escolher('Sim'); await btn('Continuar').click(); await seguir();
  await ateResultado();
  { const ps = nrm(await page.textContent('#pesquisou'));
    check(ps.startsWith('O que você pesquisou') && ps.includes('Você já tem CNPJ? Se tem, de que tipo?') && ps.includes('No Cartão CNPJ vi que ainda não tenho empresa aberta.') && ps.includes('Onde: Site da Receita Federal · Data: 16/11/2026') && ps.includes('Achei confeiteiro na lista do gov.br.'), 'resumo: "O que você pesquisou": ' + ps); }
  check(await page.locator('#pesquisou').isVisible(), 'resumo: anotações à vista (e na impressão)');

  /* ===== Lote 17/11 ("tira a fricção") ===== */
  /* B4: quem JÁ é MEI e fatura dentro do limite não lê "o MEI pode ser um caminho": vê a folga até o limite, com a conta */
  const base4 = { 'M8.P01': { estado: 'valor', valor: 'Faço bolos de pote' }, 'M8.P02': { estado: 'opcao', opcao: 'Produto' },
    'M8.P03': { estado: 'opcao', opcao: 'Minha casa' } };
  const resultadoMei = async (fat, p05) => {
    const R = Object.assign({}, base4, { 'M8.P04': { estado: 'valor', valor: fat }, 'M8.P05': { estado: 'opcao', opcao: p05 },
      'M8.P07': { estado: 'opcao', opcao: 'Sim' }, 'M8.P09': { estado: 'opcao', opcao: 'Não' }, 'M8.P10': { estado: 'opcao', opcao: 'Se posso ser MEI' } });
    await semear({ [K]: { R, hist: ['M8.P01', 'M8.P02', 'M8.P03', 'M8.P04', 'M8.P05', 'M8.P07', 'M8.P09', 'M8.P10', 'RESULTADO'] } });
    await page.reload(); await btn('Continuar de onde parei').click();
    assert.equal(await atual(), 'RESULTADO');
    return nrm(await page.textContent('#entendemos'));
  };
  /* conta feita à mão: 3.000 × 12 = 36.000; 81.000 − 36.000 = 45.000 de folga */
  for (const p05 of ['MEI (Microempreendedor Individual)', 'MEI']) {
    const en = await resultadoMei('3.000', p05);
    check(!en.includes('pode ser um caminho'), `B4 (${p05}): quem já é MEI não lê "pode ser um caminho": ${en}`);
    check(en.includes('como você já é MEI, continua dentro do limite, com folga de R$ 45.000 por ano'), `B4 (${p05}): folga certa (81.000 − 36.000 = 45.000): ${en}`);
    check(nrm(await page.textContent('#calc-folga')) === 'Como calculamos: R$ 81.000 (limite do MEI em 2026) − R$ 36.000 (seu faturamento no ano) = R$ 45.000 de folga por ano.', 'B4: "Como calculamos" da folga');
    check(nrm(await page.textContent('#folga-mei')).includes('Ainda cabem R$ 45.000 por ano') && await page.locator('#alerta-mei').count() === 0, 'B4: cartão da folga no resumo, sem alerta');
  }
  /* centavos: 2.500,50 × 12 = 30.006; 81.000 − 30.006 = 50.994 */
  check((await resultadoMei('2.500,50', 'MEI (Microempreendedor Individual)')).includes('com folga de R$ 50.994 por ano'), 'B4: folga com centavos (81.000 − 30.006 = 50.994)');
  /* controle: sem CNPJ continua lendo que o MEI pode ser um caminho, sem folga */
  { const en = await resultadoMei('3.000', 'Não');
    check(en.includes('o MEI pode ser um caminho') && !en.includes('folga') && await page.locator('#folga-mei, #calc-folga').count() === 0, 'B4: sem CNPJ, o MEI pode ser um caminho (sem folga)'); }
  /* B4 ao vivo na P05: tocar em MEI já mostra a folga */
  await semear({ [K]: { R: Object.assign({}, base4, { 'M8.P04': { estado: 'valor', valor: '3.000' } }), hist: ['M8.P01', 'M8.P02', 'M8.P03', 'M8.P04', 'M8.P05'] } });
  await page.reload(); await btn('Continuar de onde parei').click();
  assert.equal(await atual(), 'M8.P05');
  check(await page.locator('#folga-mei').count() === 0, 'P05: sem resposta, sem folga');
  await escolher('MEI (Microempreendedor Individual)');
  check(nrm(await page.textContent('#retorno #folga-mei')).includes('Ainda cabem R$ 45.000 por ano') && nrm(await page.textContent('#retorno #folga-mei')).includes('R$ 81.000 (limite do MEI em 2026) − R$ 36.000'), 'P05 = MEI dentro do limite: folga ao vivo, com "Como calculamos"');
  check((await st()).R['M8.P05'] === undefined, 'retorno ao vivo não grava nada');
  await escolher('Não');
  check(await page.locator('#folga-mei').count() === 0, 'P05 = Não: a folga some na hora');

  /* itens A, B, C, D, E e G percorrendo todas as perguntas em 3 telas difíceis */
  const TELAS = [['360x640', 360, 640, false], ['390x844 com letra 130%', 390, 844, true], ['740x360 deitado', 740, 360, false]];
  const RESP_C = { 'M8.P02': 'Serviço', 'M8.P03': 'Minha casa', 'M8.P05': 'Não', 'M8.P07': 'Sim', 'M8.P08': 'Não', 'M8.P09': 'Sim', 'M8.P10': 'Se posso ser MEI' };
  for (const [nome, w, h, z130] of TELAS) {
    await page.setViewportSize({ width: w, height: h });
    await semear({}); await page.reload();
    if (z130) await page.evaluate(() => { document.documentElement.style.fontSize = '130%'; });
    check(!/M[óo]dulo/.test(await page.innerText('#tela')) && nrm(await page.textContent('.tempo')) === 'Esta etapa leva cerca de 5 minutos', `${nome}: capa diz "Etapa" e tempo honesto (10 perguntas × 35 s ≈ 6 min → 5 min)`);
    await btn('Começar').click();
    const vistos = [], barras = [], totais = new Set();
    for (let i = 0; i < 12 && (await atual()) !== 'RESULTADO'; i++) {
      const cod = await atual();
      vistos.push(cod);
      check(await page.evaluate(() => window.scrollY) === 0, `${nome} ${cod}: abre no alto, sem rolar`);
      const r = await page.evaluate(() => { const b = document.querySelector('#ok').getBoundingClientRect(); return { top: b.top, bottom: b.bottom, h: innerHeight, nome: document.querySelector('#ok').textContent.trim(), dis: document.querySelector('#ok').disabled }; });
      check(r.top >= 0 && r.bottom <= r.h && r.nome === 'Continuar' && !r.dis, `${nome} ${cod}: Continuar inteiro na tela sem rolar, ativo: ${JSON.stringify(r)}`);
      check(!/M[óo]dulo/.test(await page.innerText('#tela')), `${nome} ${cod}: nenhum "Módulo" visível`);
      const m = nrm(await page.textContent('.passo')).match(/^Pergunta (\d+) de (\d+)$/);
      totais.add(m && m[2]); barras.push(+(await page.getAttribute('.heroi-compacta .barra', 'aria-valuenow')));
      /* item B: sem resposta, Continuar mostra a mensagem logo acima dele e não avança */
      if (i === 0) {
        await btn('Continuar').click();
        check(await atual() === cod && await page.locator('#erro[role=alert]').isVisible() && /^Escreva a sua resposta para continuar\./.test(nrm(await page.textContent('#erro'))), `${nome}: sem resposta, mensagem simples e fica na pergunta`);
        const e = await page.evaluate(() => { const a = document.querySelector('#erro').getBoundingClientRect(), b = document.querySelector('#ok').getBoundingClientRect(); return a.top >= 0 && a.bottom <= b.top + 1 && b.bottom <= innerHeight; });
        check(e, `${nome}: mensagem e Continuar juntos, presos ao pé da tela`);
      }
      const ops = await page.$$eval('#ent .opcao', (x) => x.map((e) => e.querySelector('.op-txt > b').textContent.trim()));
      if (ops.length) {
        const alvo = RESP_C[cod] || ops[0];
        await escolher(alvo);
        const ap = await page.$$eval('#ent .opcao', (x) => x.map((e) => e.getAttribute('aria-pressed')));
        check(ap.every((v, k) => v === (ops[k] === alvo ? 'true' : 'false')), `${nome} ${cod}: aria-pressed certo depois do toque`);
      } else await page.fill('#ent input, #ent textarea', cod === 'M8.P04' ? '3000' : cod === 'M8.P06' ? 'fabricação de bolos' : 'Faço bolos de pote');
      { const b = await page.locator('#ok').boundingBox(); const vh = await page.evaluate(() => innerHeight); check(b && b.y >= 0 && b.y + b.height <= vh, `${nome} ${cod}: Continuar à vista depois de responder`); }
      await btn('Continuar').click();
      check(await atual() !== cod, `${nome} ${cod}: um toque em Continuar abre a próxima`);
      await seguir();
      if ((await atual()) !== 'RESULTADO') check(await page.evaluate(() => document.activeElement === document.querySelector('.cartao-q h2.q')), `${nome}: foco no enunciado da pergunta nova`);
    }
    check(await atual() === 'RESULTADO', `${nome}: chega ao resultado`);
    check(JSON.stringify(vistos) === JSON.stringify(['M8.P01', 'M8.P02', 'M8.P03', 'M8.P04', 'M8.P05', 'M8.P06', 'M8.P07', 'M8.P08', 'M8.P09', 'M8.P10']), `${nome}: 10 perguntas: ${vistos}`);
    check(totais.size === 1 && totais.has('10'), `${nome}: total de "Pergunta N de M" estável (10)`);
    check(barras.every((v, k) => k === 0 || v > barras[k - 1]), `${nome}: barra só anda para frente: ${barras}`);
    const txt = await page.innerText('#tela');
    check(!/M[óo]dulo/.test(txt) && /Você concluiu a Etapa 8/.test(txt), `${nome}: resultado diz "Etapa", nunca "Módulo"`);
    check(nrm(await page.textContent('.lg2-proximo a')) === 'Ir para a Etapa 9' && await page.locator('div.acoes.lg2-proximo').isVisible(), `${nome}: link "Ir para a Etapa 9" visível`);
  }
  await page.evaluate(() => { document.documentElement.style.fontSize = ''; });
  await page.setViewportSize({ width: 390, height: 844 });
  /* barra com perguntas puladas (P05 = MEI pula a P06): o total continua 10 e a barra não volta */
  await semear({}); await page.reload(); await btn('Começar').click();
  { const bs = [];
    for (let i = 0; i < 12 && (await atual()) !== 'RESULTADO'; i++) {
      const cod = await atual();
      bs.push(+(await page.getAttribute('.heroi-compacta .barra', 'aria-valuenow')));
      check(/ de 10$/.test(nrm(await page.textContent('.passo'))), `caminho com pulo ${cod}: total 10`);
      const ops = await page.$$eval('#ent .opcao', (x) => x.map((e) => e.querySelector('.op-txt > b').textContent.trim()));
      if (ops.length) await escolher(cod === 'M8.P05' ? 'MEI (Microempreendedor Individual)' : ops.includes('Não') ? 'Não' : ops[0]);
      else await page.fill('#ent input, #ent textarea', cod === 'M8.P04' ? '3000' : 'Faço bolos de pote');
      await btn('Continuar').click();
    }
    check(bs.every((v, k) => k === 0 || v > bs[k - 1]), 'caminho com pulo: barra só anda para frente: ' + bs); }

  /* item F: alvos de toque ≥ 44 px (pergunta com dica, anotações, "Quem pode ser MEI", consulta; resumo com Copiar/Escolher/Trocar) */
  const alturas = (sels) => page.evaluate((ss) => ss.flatMap((s) => [...document.querySelectorAll(s)].map((e) => { const r = e.getBoundingClientRect(); return { s, h: Math.round(r.height), w: r.width }; })).filter((x) => x.w > 0), sels);
  await semear({ [K]: { R: Object.assign({}, base4, { 'M8.P04': { estado: 'valor', valor: '3.000' }, 'M8.P05': { estado: 'opcao', opcao: 'Não' }, 'M8.P06': { estado: 'valor', valor: 'fabricação de bolos' } }), hist: ['M8.P01', 'M8.P02', 'M8.P03', 'M8.P04', 'M8.P05', 'M8.P06', 'M8.P07'] } });
  await page.reload(); await btn('Continuar de onde parei').click();
  assert.equal(await atual(), 'M8.P07');
  { const hs = await alturas(['details.dica-toggle > summary', 'details#notas > summary', 'details#quem-mei > summary', '#anexo', '#v', '.btn-copiar']);
    check(hs.length >= 5 && hs.every((x) => x.h >= 44), 'item F: pergunta, alvos ≥ 44 px: ' + JSON.stringify(hs)); }
  await page.click('details.dica-toggle > summary');
  check(await page.$eval('details.dica-toggle', (d) => d.open), 'item F: "Ver dica" continua abrindo');
  await escolher('Sim'); await btn('Continuar').click();
  await ateResultado();
  { const hs = await alturas(['#tela details > summary', '.btn-copiar-cnae', '.btn-escolher', '.alterar', '[data-inicio]', 'details.mais > summary']);
    check(hs.length >= 5 && hs.every((x) => x.h >= 44), 'item F: resumo, alvos ≥ 44 px: ' + JSON.stringify(hs.filter((x) => x.h < 44))); }
  await page.click('[data-inicio]');
  { const hs = await alturas(['details.como-funciona > summary', '[data-inicio]']);
    check(hs.length >= 1 && hs.every((x) => x.h >= 44), 'item F: capa, "Como funciona" ≥ 44 px: ' + JSON.stringify(hs)); }
  await page.click('details.como-funciona > summary');
  check(!/M[óo]dulo/.test(await page.innerText('#tela')), 'capa com "Como funciona" aberto: nenhum "Módulo"');
  await btn('O que esta etapa não faz').click();
  check(!/M[óo]dulo/.test(await page.innerText('#tela')) && nrm(await page.textContent('.heroi-tit')) === 'Limites da etapa', 'tela de limites: "Etapa", nunca "Módulo"');
  await btn('Voltar').click();

  /* nada de "Grupo N" nem códigos na tela */
  check(!/Grupo \d/.test(await page.innerText('#tela')), 'sem "Grupo N" na tela');
  check(!/M8\.P|M5\.P|M1\.P/.test(await page.innerText('#tela')), 'sem código de pergunta na tela');
  assert.deepEqual(errs, [], 'sem pageerror');
  console.log(`PASS: M08 correções (${ok} verificações: teclado, campo numérico, tipo de oferta herdado e aviso, alerta forte do MEI, CNAEs compatíveis, "Não sei" que bloqueia em toda pergunta que o mantém, reuso de respostas de outros módulos, Como calculamos, alertas só quando há risco)`);
  await b.close(); server.close();
})().catch((e) => { console.error('FAIL', e); process.exit(1); });
