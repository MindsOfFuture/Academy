/* Layout do Módulo 5 aplicado ao M08 (Turma B): percorre do início ao resultado e confere barra do topo,
   faixa roxa, cartão da pergunta, ajuda aberta (dica), conclusão, textos literais de dados/modulo8.js,
   retomada após recarregar, Anexo XI ida e volta e zero erro de JavaScript.
   Execute: PW=<caminho do pacote playwright> node tests/lg2-m08-layout.cjs */
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

(async () => {
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const b = await chromium.launch();
  const page = await b.newPage({ viewport: { width: 390, height: 844 } });
  page.setDefaultTimeout(8000);
  const errs = [], faltou = [];
  page.on('pageerror', (e) => errs.push(e.message));
  page.on('dialog', (d) => d.accept());
  page.on('response', (r) => { if (r.status() === 404) faltou.push(r.url()); });
  const st = () => page.evaluate((k) => JSON.parse(localStorage.getItem(k)), K);
  const btn = (nome) => page.getByRole('button', { name: nome, exact: true });
  const atual = () => page.evaluate(() => {
    const t = (document.querySelector('.passo') || {}).textContent || '';
    if (/Resultado/.test(t)) return 'RESULTADO';
    const m = t.match(/Pergunta (\d+)/);
    return m ? Motor.montar(window.MODULO8).perguntas[+m[1] - 1].codigo : null;
  });
  /* versão leve (nov/2026): nas perguntas, faixa compacta (passo + barra), sem barra do topo nem ilustração */
  const palavras = async () => (await page.evaluate(() => document.querySelector('#tela').innerText)).split(/\s+/).filter((w) => /[A-Za-zÀ-ÿ0-9]/.test(w)).length;
  const layoutPergunta = async (onde) => {
    assert.equal(await page.locator('.heroi-compacta').count(), 1, `${onde}: faixa compacta`);
    assert.equal(await page.locator('.heroi-img').count() + await page.locator('.barra-topo').count(), 0, `${onde}: sem ilustração nem trilha`);
    assert.match(nrm(await page.textContent('.heroi-compacta .passo')), /^Pergunta \d+ de \d+$/, `${onde}: passo na faixa`);
    assert.equal(await page.locator('.rodape .logos img').count(), 3, `${onde}: rodapé institucional`);
    assert.equal(await page.locator('#v.voltar').count(), 1, `${onde}: Voltar de contorno`);
  };
  const layout = async (onde) => {
    assert.equal(await page.locator('.barra-topo .logo-mini').count(), 1, `${onde}: logo na barra do topo`);
    assert.match(nrm(await page.innerText('.trilha')), /^Início \/ Módulo 8/, `${onde}: trilha`);
    assert.equal(await page.locator('.heroi .heroi-img').count(), 1, `${onde}: faixa roxa com ilustração`);
    assert.ok(nrm(await page.textContent('.heroi-tit')).length > 0, `${onde}: faixa sem título`);
    assert.equal(await page.locator('.rodape .logos img').count(), 3, `${onde}: rodapé institucional`);
    assert.equal(await page.locator('#v.voltar').count() + (onde === 'capa' ? 1 : 0), 1, `${onde}: Voltar de contorno`);
  };

  await page.goto(`http://127.0.0.1:${server.address().port}/lg2/turma-b/m08/index.html`);
  await page.evaluate(() => localStorage.clear()); await page.reload();
  const D = await page.evaluate(() => window.MODULO8);
  const P = Object.fromEntries(D.perguntas.filter((p) => p.codigo).map((p) => [p.codigo, p]));

  /* capa */
  await layout('capa');
  assert.equal(await page.locator('.heroi-grande').count(), 1);
  assert.equal(nrm(await page.textContent('.heroi h1')), nrm(D.modulo.nome));
  assert.equal(nrm(await page.textContent('.heroi-txt p')), nrm(D.capa.frase), 'capa: uma frase só');
  assert.equal(nrm(await page.textContent('.tempo')), `Este módulo leva uns ${D.capa.minutos} minutos`, 'capa: tempo');
  assert.equal(await page.$eval('details.como-funciona', (d) => !d.open), true, 'capa: "Como funciona" fechado');
  assert.ok(nrm(await page.textContent('details.como-funciona')).includes(nrm(D.mapa.ter_em_maos)), 'capa: "O que ter em mãos" dentro de "Como funciona"');
  assert.ok(await palavras() <= 60, `capa: até 60 palavras (${await palavras()})`);
  await btn('Começar').click();

  /* perguntas até o resultado */
  const resp = { 'M8.P02': 'Serviço', 'M8.P03': 'Minha casa', 'M8.P05': 'Não', 'M8.P07': 'Sim', 'M8.P08': 'Não', 'M8.P09': 'Sim', 'M8.P10': null };
  /* lote 16/11 (item D): linha simples com exemplo à vista + exemplo embaixo das opções difíceis; limite subiu de 60 para 85 */
  const LIMITE_PALAVRAS = 85;
  const vistas = [], contagem = {};
  for (let i = 0; i < 20; i++) {
    const cod = await atual();
    if (cod === 'RESULTADO') break;
    assert.ok(cod && P[cod], 'pergunta desconhecida');
    vistas.push(cod);
    const q = P[cod];
    await layoutPergunta(cod);
    const np = await palavras();
    assert.ok(np <= LIMITE_PALAVRAS, `${cod}: até ${LIMITE_PALAVRAS} palavras visíveis (${np})`);
    contagem[cod] = np;
    assert.equal(await page.locator('.herdou').count() + await page.locator('#veio').count(), 0, `${cod}: sem dados de outros módulos, nada pré-preenchido`);
    if (q.explica) assert.ok(nrm(await page.textContent('#explica')).startsWith(nrm(q.explica)), `${cod}: linha simples à vista`);
    assert.equal(await page.locator('.cartao-q .q').count(), 1, `${cod}: cartão da pergunta`);
    assert.equal(nrm(await page.textContent('.cartao-q .q')), nrm(q.pergunta), `${cod}: pergunta literal`);
    /* ajuda dos dados dentro de "Ver dica", fechada, entre a pergunta e as respostas (versão leve) */
    assert.equal(await page.locator('details.dica-toggle').count(), 1, `${cod}: um "Ver dica"`);
    assert.equal(await page.$eval('details.dica-toggle', (d) => d.open), false, `${cod}: "Ver dica" fechado`);
    assert.equal(nrm(await page.textContent('details.dica-toggle summary')), 'Ver dica');
    assert.equal(nrm(await page.textContent('details.dica-toggle .ajuda')), nrm(q.ajuda), `${cod}: ajuda dos dados`);
    assert.ok(await page.evaluate(() => (document.querySelector('.cartao-q .q').compareDocumentPosition(document.querySelector('details.dica-toggle')) & 4) && (document.querySelector('details.dica-toggle').compareDocumentPosition(document.querySelector('#ent')) & 4)), `${cod}: "Ver dica" entre a pergunta e as respostas`);
    assert.ok(Array.isArray(q.comoDescobrir) && q.comoDescobrir.length === 2, `${cod}: "Como descobrir" com 2 passos nos dados`);
    const campo = page.locator('#ent input, #ent textarea');
    if (await campo.count()) assert.match(await campo.getAttribute('placeholder'), /^Ex\.: .+/, `${cod}: exemplo dentro do campo`);
    /* Voltar no topo do cartão, à esquerda, acima da pergunta (lote 3) */
    assert.ok(await page.evaluate(() => { const v = document.querySelector('.cartao-q #v'), q = document.querySelector('.cartao-q .q'); return !!v && v.getBoundingClientRect().bottom <= q.getBoundingClientRect().top + 1 && v.getBoundingClientRect().left < 80; }), `${cod}: Voltar no topo do cartão`);
    assert.equal(nrm(await page.textContent('#v')), 'Voltar', `${cod}: nome Voltar`);
    assert.equal(await page.locator('.heroi .barra-fill').count(), 1, `${cod}: barra de progresso na faixa`);
    assert.equal(await page.locator('.etapas').count(), 0, `${cod}: sem stepper (módulo sem seções)`);
    const ops = await page.$$eval('#ent .opcao', (x) => x.map((e) => e.querySelector('.op-txt > b').textContent.trim()));
    if (ops.length) {
      if (q.exOpcoes) assert.deepEqual(await page.$$eval('#ent .opcao', (x) => x.map((e) => (e.querySelector('.op-ex') || {}).textContent || null)), ops.map((o) => q.exOpcoes[o] || null), `${cod}: exemplo embaixo das opções difíceis`);
      assert.deepEqual(ops, q.opcoes.split(';').map((s) => s.trim()).filter(Boolean), `${cod}: opções literais`);
      const v = resp[cod] || ops[0];
      await page.getByRole('button', { name: v, exact: true }).click();
      assert.equal(await page.locator('#ent .opcao.sel .radio').count(), 1, `${cod}: bolinha marcada`);
    } else {
      await page.fill('#ent input, #ent textarea', cod === 'M8.P04' ? '5000' : 'Faço bolos por encomenda');
    }
    if (cod === 'M8.P03') {   // recarregar no meio retoma a pergunta, com a resposta anterior guardada
      await page.reload();
      assert.equal(nrm(await btn('Continuar de onde parei').textContent()), 'Continuar de onde parei');
      await btn('Continuar de onde parei').click();
      assert.equal(await atual(), 'M8.P03', 'retoma na pergunta em que parou');
      assert.equal((await st()).R['M8.P02'].opcao, 'Serviço', 'resposta anterior guardada');
      await page.getByRole('button', { name: resp[cod], exact: true }).click();
    }
    if (cod === 'M8.P06') {   // Anexo XI: ida e volta para a mesma pergunta
      await btn('Consultar as ocupações permitidas ao MEI').click();
      await layout('anexo');
      await page.waitForTimeout(50);
      assert.match(nrm(await page.textContent('#conta')), /\d+ de \d+ ocupações/);
      await btn('Voltar').click();
      assert.equal(await atual(), 'M8.P06', 'Voltar do Anexo volta à pergunta');
      await page.fill('#ent textarea', 'Faço bolos por encomenda');
    }
    await btn('Continuar').click();
    await (await page.locator('#acoes .btn-primario').first()).click();   // Seguir ou Ver meu resumo
    if (vistas.length === 1) assert.ok((await st()).hist.length >= 2);
  }
  assert.equal(await atual(), 'RESULTADO', 'chegou ao resultado');
  assert.deepEqual(vistas, ['M8.P01', 'M8.P02', 'M8.P03', 'M8.P04', 'M8.P05', 'M8.P06', 'M8.P07', 'M8.P08', 'M8.P09', 'M8.P10'], 'caminho pelas condições F');

  /* resultado */
  await layout('resultado');
  /* resultado leve: entendemos, próximo passo e o resto recolhido */
  assert.ok(nrm(await page.textContent('#tarefa')).startsWith('Seu próximo passo'), 'resultado: próximo passo');
  /* item I (16/11): o relatório do módulo vem aberto */
  for (const d of ['details.respostas', 'details#ocupacoes', 'details#mais-detalhes']) assert.equal(await page.$eval(d, (x) => x.open), true, `${d} aberto`);
  assert.ok(await page.$$eval('#tela details', (ds) => ds.every((x) => x.open)), 'resultado: todas as seções abertas');
  console.log('palavras por pergunta: ' + JSON.stringify(contagem) + ' · resultado: ' + await palavras());
  assert.equal(nrm(await page.textContent('.heroi-tit')), 'Resumo da sua formalização');
  assert.equal(nrm(await page.textContent('.concluido h2')), 'Você concluiu o Módulo 8');
  assert.equal(await page.locator('.concluido .check').count(), 1);
  /* "O que entendemos até aqui" no topo; a lista de respostas fica recolhida */
  assert.equal(nrm(await page.textContent('#entendemos h3')), 'O que entendemos até aqui');
  const fr0 = await page.$$eval('#entendemos p', (x) => x.map((e) => e.textContent));
  /* texto corrido (relatório do Bento): 1 a 3 parágrafos, sem lista */
  assert.ok(fr0.length >= 1 && fr0.length <= 3, `entendemos em 1 a 3 parágrafos (${fr0.length})`);
  assert.ok(await page.$eval('#entendemos', (e) => !e.querySelector('ul, ol, li') && e.querySelectorAll('p').length >= 1), 'entendemos sem <li> e com pelo menos um <p>');
  assert.ok(fr0.join(' ').split(/(?<=[.!?])\s+(?=[A-ZÀ-Ú])/).length >= 3, 'entendemos continua com 3 ou mais frases');
  assert.ok(nrm(fr0.join(' ')).includes('Faço bolos por encomenda') && nrm(fr0.join(' ')).includes('R$ 5.000 por mês'), 'entendemos usa as respostas deste módulo');
  assert.ok(await page.evaluate(() => document.querySelector('#entendemos').compareDocumentPosition(document.querySelector('details.respostas')) & 4), 'caixa acima da lista');
  assert.equal(nrm(await page.textContent('details.respostas summary')), 'Ver suas respostas');
  assert.equal(await page.evaluate(() => document.querySelector('details.respostas').open), true, 'respostas abertas');
  assert.ok(!/M8\.P|P0\d/.test(nrm(await page.innerText('#tela'))), 'sem código de pergunta na tela');
  const txt = nrm(await page.textContent('#tela'));
  for (const c of vistas) assert.ok(txt.includes(nrm(P[c].pergunta)), `resultado lista ${c}`);
  assert.ok(txt.includes(nrm(D.mapa.mensagem_limite)) && txt.includes(nrm(D.mapa.entrega)));
  for (const n of ['Salvar ou imprimir', 'Revisar respostas', 'Começar outra análise']) assert.equal(await btn(n).count(), 1, n);
  assert.equal(await page.locator('.lg2-proximo a[href="/lg2/turma-b/m09/index.html"]').count(), 1, 'link para o Módulo 9');
  /* recarregar no resultado retoma o resultado */
  await page.reload(); await btn('Continuar de onde parei').click();
  assert.equal(await atual(), 'RESULTADO');
  /* "Início" na trilha volta à capa */
  await page.click('[data-inicio]');
  assert.equal(await page.locator('.heroi-grande').count(), 1);

  /* ===== HERANÇA: perguntas já respondidas em outros módulos chegam pré-preenchidas com selo ===== */
  const semear = (dados) => page.evaluate((d) => { localStorage.clear(); for (const [k, v] of Object.entries(d)) localStorage.setItem(k, JSON.stringify(v)); }, dados);
  await semear({
    'lg2-turma-a-m01': { v: 3, R: { 'M1.P01': { estado: 'opcao', opcao: 'Já vendi algumas vezes' }, 'M1.P03': { estado: 'valor', valor: 'Lava-jato em domicílio' },
      'M1.P03A': { estado: 'opcao', opcao: 'Serviço: meu cliente paga pelo trabalho que realizo' } } },
    'lg2-turma-a-m03': { R: { 'M3.P11': { estado: 'valor', valor: 'Falta de tempo para levar o carro ao lava-jato' } } },
    'lg2-turma-a-m05': { versao: 3, R: { 'M5.P01': { estado: 'opcao', opcao: 'Produto: eu compro materiais e faço o que vendo' }, 'M5.P36': { estado: 'valor', valor: '50' }, 'M5.P37': { estado: 'valor', valor: '40' } } },
    'lg2-turma-b-m09': { v: 1, R: { 'M9-03': { estado: 'opcao', opcao: 'Sem local fixo (digital, na casa do cliente ou ambulante)' }, 'M9-03a': { estado: 'opcao', opcao: 'Na casa ou na empresa do cliente' } } },
  });
  await page.reload();
  await btn('Começar').click();
  /* item F (16/11): as 4 respostas que já vieram de outros módulos não têm tela; a 1ª tela é a P05, com o cartão "Veio do Módulo N · Trocar" */
  const esperado = { 'M8.P01': ['Lava-jato em domicílio', 1], 'M8.P02': ['Serviço', 1], 'M8.P03': ['Atendimento externo', 9], 'M8.P04': ['2.000', 5] };
  assert.equal(await atual(), 'M8.P05', 'P01 a P04 já respondidas em outros módulos: a 1ª tela é a P05');
  assert.equal(await page.locator('#veio .veio-linha').count(), 4, 'cartão com as 4 respostas reaproveitadas');
  for (const [cod, [val, mod]] of Object.entries(esperado)) {
    const linha = nrm(await page.textContent(`#veio .veio-linha[data-cod="${cod}"]`));
    assert.ok(linha.includes(cod === 'M8.P04' ? 'R$ 2.000 por mês' : val) && linha.includes(`Veio do Módulo ${mod}`), `${cod}: no cartão (${linha})`);
    assert.equal(await page.locator(`#veio [data-trocar="${cod}"]`).count(), 1, `${cod}: Trocar`);
    const r = (await st()).R[cod];
    assert.equal(r.opcao || r.valor, val, `${cod}: resposta reaproveitada gravada no formato do Módulo 8`);
    assert.equal(r.de, mod, `${cod}: origem guardada`);
    assert.equal(r.reuso, true, `${cod}: marcada como reaproveitada`);
  }
  /* conta feita à mão: 50 × 40 = 2.000 por mês; 2.000 × 12 = 24.000 por ano */
  const lp4 = nrm(await page.textContent('#veio .veio-linha[data-cod="M8.P04"]'));
  assert.ok(lp4.includes('Como calculamos: R$ 50 (preço de uma venda) × 40 (vendas por mês) = R$ 2.000 por mês.'), 'P04: conta do Módulo 5 ' + lp4);
  assert.ok(lp4.includes('Como calculamos: R$ 2.000 por mês × 12 meses = R$ 24.000 por ano.'), 'P04: conta do ano ' + lp4);
  assert.equal((await st()).hist.filter((c) => /M8\.P0[1-4]/.test(c)).length, 0, 'telas puladas fora da trilha');
  await btn('Voltar').click();
  assert.equal(await page.locator('.heroi-grande').count(), 1, 'Voltar na 1ª tela mostrada volta à capa');
  await btn('Começar').click();
  assert.equal(await atual(), 'M8.P05', 'Começar de novo: as respostas reaproveitadas continuam puladas');
  for (let i = 0; i < 10 && (await atual()) !== 'RESULTADO'; i++) {   // resto do caminho
    const ops = await page.$$eval('#ent .opcao', (x) => x.map((e) => (e.querySelector('.op-txt > b') || e).textContent.trim()));
    if (ops.length) await page.getByRole('button', { name: ops.includes('Não') ? 'Não' : ops[0], exact: true }).click();
    else await page.fill('#ent input, #ent textarea', 'Não lembro');
    await btn('Continuar').click(); await page.locator('#acoes .btn-primario').first().click();
  }
  assert.equal(await atual(), 'RESULTADO');
  const fr = nrm((await page.$$eval('#entendemos p', (x) => x.map((e) => e.textContent))).join(' '));
  for (const t of ['Lava-jato em domicílio', 'principalmente um serviço', 'Você já vende', 'falta de tempo para levar o carro', 'no local do cliente',
                   'R$ 2.000 por mês', 'dentro do limite do MEI']) assert.ok(fr.includes(t), `entendemos: "${t}" em: ${fr}`);
  assert.equal(await page.locator('details.respostas .veio').count(), 4, 'selo das 4 respostas herdadas no resumo');
  assert.ok(nrm(await page.textContent('details.respostas')).includes('R$ 2.000 por mês'));
  /* resumo: cartão com as respostas reaproveitadas + "Como calculamos" do ano (2.000 × 12 = 24.000) */
  assert.equal(await page.locator('#veio-res .veio-linha').count(), 4, 'resumo: cartão das 4 respostas reaproveitadas');
  assert.equal(nrm(await page.textContent('#calc-ano')), 'Como calculamos: R$ 2.000 por mês × 12 meses = R$ 24.000 por ano.', 'resumo: conta do ano');
  /* "Trocar" no resumo abre a tela pulada; trocar a resposta tira o selo e volta ao resumo */
  await page.click('#veio-res [data-trocar="M8.P01"]');
  assert.equal(await atual(), 'M8.P01', 'Trocar abre a pergunta pulada');
  assert.equal(nrm(await page.textContent('#herdou .veio')), 'Veio do Módulo 1', 'na troca, o selo continua');
  assert.equal(await page.inputValue('#ent textarea'), 'Lava-jato em domicílio', 'na troca, a resposta que veio já está no campo');
  await page.fill('#ent textarea', 'Lavo carros na garagem do cliente'); await btn('Continuar').click();
  assert.equal((await st()).R['M8.P01'].de, undefined, 'resposta alterada perde o selo');
  assert.equal((await st()).R['M8.P01'].reuso, undefined, 'resposta alterada deixa de ser reaproveitada');
  assert.equal(nrm(await page.textContent('#acoes .btn-primario')), 'Ver meu resumo', 'depois de trocar, volta ao resumo');
  await page.locator('#acoes .btn-primario').click();
  assert.equal(await atual(), 'RESULTADO');
  assert.equal(await page.locator('#veio-res .veio-linha').count(), 3, 'resumo: 3 respostas ainda reaproveitadas');

  /* "Não sei" herdado não conta; Mercadoria chega como Mercadoria; sem preço x quantidade nada é preenchido */
  await semear({
    'lg2-turma-a-m01': { v: 3, R: { 'M1.P03': { estado: 'naosei' }, 'M1.P03A': { estado: 'naosei' } } },
    'lg2-turma-a-m05': { versao: 3, R: { 'M5.P01': { estado: 'opcao', opcao: 'Mercadoria: compro pronto para revender' }, 'M5.P37': { estado: 'opcao', opcao: 'Ainda não comecei a vender' } } },
  });
  await page.reload(); await btn('Começar').click();
  assert.equal(await page.locator('#herdou').count(), 0, 'P01: "Não sei" do Módulo 1 não é herdado');
  assert.equal(await page.inputValue('#ent textarea'), '');
  await page.fill('#ent textarea', 'Revendo cosméticos'); await btn('Continuar').click(); await page.locator('#acoes .btn-primario').first().click();
  assert.equal(await atual(), 'M8.P03', 'P02 veio do Módulo 5: sem tela');
  assert.equal((await st()).R['M8.P02'].opcao, 'Mercadoria', 'P02: Mercadoria do Módulo 5 chega como Mercadoria');
  assert.ok(nrm(await page.textContent('#veio')).includes('O que você vende: Mercadoria') && nrm(await page.textContent('#veio .veio')) === 'Veio do Módulo 5', 'P03: cartão com o tipo que veio do Módulo 5');
  assert.equal(await page.locator('#herdou').count(), 0, 'P03: sem Módulo 9, sem herança');
  await page.getByRole('button', { name: 'Online', exact: true }).click(); await btn('Continuar').click(); await page.locator('#acoes .btn-primario').first().click();
  assert.equal(await atual(), 'M8.P04');
  assert.equal(await page.locator('#herdou').count(), 0, 'P04: sem preço e quantidade, sem conta');

  assert.deepEqual(errs, [], 'sem pageerror');
  assert.deepEqual(faltou.filter((u) => /\/lg2\/turma-b\/m08\//.test(u)), [], 'sem arquivo faltando');
  console.log(`PASS: M08 layout novo (capa, ${vistas.length} perguntas literais, resultado com "O que entendemos até aqui", retomada, Anexo, herança M1/M5/M9 com selo e conta, "Não sei" não herdado, zero pageerror)`);
  await b.close(); server.close();
})().catch((e) => { console.error('FAIL', e); process.exit(1); });
