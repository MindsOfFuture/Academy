/* Módulo 9 (Turma B): layout no modelo do M5. Percorre do início ao checklist,
   confere barra do topo, faixa roxa, cartão da pergunta, dica, conclusão, abas extras
   (base local, limites), textos literais de dados/modulo9.js, retomada e zero pageerror. */
const http = require('node:http'), fsp = require('node:fs/promises'), path = require('node:path'), assert = require('node:assert/strict');
const { chromium } = require(process.env.PW);
const root = path.join(__dirname, '..', 'public');
global.window = {}; require(path.join(root, 'lg2/turma-b/m09/dados/modulo9.js'));
const D = global.window.MODULO9; delete global.window;
const P = Object.fromEntries(D.perguntas.filter((p) => p.codigo).map((p) => [p.codigo, p]));
const norm = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();
const server = http.createServer(async (req, res) => {
  try { res.end(await fsp.readFile(path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://x').pathname)))); } catch { res.writeHead(404).end(); }
});
(async () => {
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const b = await chromium.launch();
  const page = await b.newPage({ viewport: { width: 390, height: 844 } });
  page.setDefaultTimeout(8000);
  const errs = []; page.on('pageerror', (e) => errs.push(e.message)); page.on('dialog', (d) => d.accept());
  page.on('response', (r) => { if (r.status() >= 400) errs.push(r.url()); });
  const K = 'lg2-turma-b-m09';
  const st = () => page.evaluate((k) => JSON.parse(localStorage.getItem(k)), K);
  const btn = (name) => page.getByRole('button', { name, exact: true });
  const txt = async (sel) => norm(await page.textContent(sel));
  const trilha = async () => norm(await page.innerText('.trilha'));
  const cnae = D.instrumentos.I02.find((l) => l.cnae).cnae;

  await page.goto(`http://127.0.0.1:${server.address().port}/lg2/turma-b/m09/index.html`);
  await page.evaluate(() => localStorage.clear()); await page.reload();

  // capa
  assert.equal(await page.locator('.barra-topo .logo-mini').count(), 1);
  assert.equal(await trilha(), `Início / Módulo ${D.modulo.numero}`);
  assert.equal(await page.locator('.heroi.heroi-grande img[src="assets/hero-inicio.webp"]').count(), 1);
  assert.equal(await txt('.heroi h1'), norm(D.modulo.nome));
  assert.equal(await txt('.heroi-txt p'), norm(D.mapa.objetivo));
  assert.equal(await page.locator('#ir.seta').count(), 1);
  assert.equal(await page.locator('.rodape .logos img').count(), 3);

  // aba extra: base local de CNAEs
  await btn('Consultar a base local de CNAEs').click();
  assert.equal(await txt('.heroi-tit'), norm(D.instrumentos.I02_titulo));
  assert.equal(await page.locator('.heroi img[src="assets/hero-preco.webp"]').count(), 1);
  await page.fill('#busca', cnae);
  assert.ok(await page.locator('.cnae').count() >= 1);
  await btn('Voltar').click();
  assert.equal(await page.locator('.heroi-grande').count(), 1);
  // limites
  await btn('O que este módulo não faz').click();
  assert.equal(await txt('.heroi-tit'), 'Limites do módulo');
  await page.click('[data-inicio]');
  assert.equal(await page.locator('.heroi-grande').count(), 1);

  // perguntas
  await btn('Começar').click();
  let vistas = 0, recarregou = false, voltou = false;
  for (let i = 0; i < 40 && await page.locator('#ok').count(); i++) {
    const cod = (await st()).hist.at(-1);
    const q = P[cod];
    assert.ok(q, cod);
    vistas++;
    assert.equal(await page.locator('.barra-topo').count(), 1);
    assert.match(await trilha(), /Perguntas$/);
    assert.equal(await page.locator('.heroi .progresso .barra-fill').count(), 1, 'barra amarela na faixa');
    assert.equal(await txt('.heroi .passo'), `Pergunta ${D.perguntas.filter((p) => p.codigo).indexOf(q) + 1} de ${Object.keys(P).length}`);
    assert.equal(await txt('.cartao-q h2.q'), norm(q.pergunta), `texto de ${cod}`);
    if (norm(q.ajuda)) assert.equal(await txt('.cartao-q .dica .ajuda'), norm(q.ajuda), `ajuda de ${cod}`);
    const ops = page.locator('#ent .opcao');
    if (await ops.count()) {
      assert.deepEqual((await ops.locator('.op-txt b').allTextContents()).map(norm), String(q.opcoes).split(';').map(norm).filter(Boolean));
      assert.equal(await ops.locator('.radio[aria-hidden="true"]').count(), await ops.count());
      // nome acessível = texto da opção
      const primeira = norm((await ops.locator('.op-txt b').allTextContents())[0]);
      await page.getByRole('button', { name: primeira, exact: true }).first().click();
      assert.equal(await page.locator('#ent .opcao.sel .radio').count(), 1);
    } else if (await page.locator('#ent input').count()) await page.fill('#ent input', '40');
    else await page.fill('#ent textarea', cnae);
    if (i === 1 && !recarregou) {                       // retomada depois de recarregar
      recarregou = true;
      await page.reload();
      await btn('Continuar de onde parei').click();
      assert.equal((await st()).hist.at(-1), cod);
      assert.equal(await txt('.cartao-q h2.q'), norm(q.pergunta));
      if (await ops.count()) await ops.first().click(); else if (await page.locator('#ent input').count()) await page.fill('#ent input', '40'); else await page.fill('#ent textarea', cnae);
    }
    await page.click('#ok');
    const seguir = page.locator('#acoes button').first();
    const rot = norm(await seguir.textContent());
    assert.ok(rot === 'Seguir' || rot === 'Ver meu checklist', rot);
    assert.equal(await page.locator('#acoes button.seta').count(), 1);
    if (i === 2 && !voltou) {                           // Voltar (contorno, embaixo) volta uma pergunta
      voltou = true;
      await btn('Voltar').click();
      const ant = (await st()).hist.at(-1);
      assert.notEqual(ant, cod);
      assert.equal(await page.locator('.acoes-voltar #v.btn-linha.voltar').count(), 1);
      await page.click('#ok');                          // resposta anterior continua marcada
      await page.locator('#acoes button').first().click();
      continue;
    }
    await seguir.click();
  }
  assert.ok(vistas >= 15, `perguntas vistas: ${vistas}`);

  // resultado
  assert.equal((await st()).hist.at(-1), 'RESULTADO');
  assert.equal(await txt('.heroi .kicker'), 'Resultado');
  assert.equal(await txt('.heroi-tit'), norm(D.instrumentos.I01_titulo));
  assert.equal(await page.locator('.concluido .check').count(), 1);
  assert.equal(await txt('.concluido h2'), `Você concluiu o Módulo ${D.modulo.numero}`);
  assert.ok(await page.locator('.etapa').count() >= 1, 'checklist');
  assert.ok((await txt('#tela')).includes(norm(D.instrumentos.I03_titulo)));
  assert.ok((await txt('#tela')).includes(norm(D.instrumentos.I04_titulo)));
  assert.equal(await page.locator('.lg2-proximo a[href="/lg2/turma-b/m10/index.html"]').count(), 1);
  for (const n of ['Salvar ou imprimir', 'Revisar respostas', 'Consultar a base local de CNAEs', 'Começar outra análise', 'Voltar']) assert.equal(await btn(n).count(), 1, n);
  await page.reload(); await btn('Continuar de onde parei').click();
  assert.equal(await page.locator('.concluido').count(), 1, 'retoma no resultado');
  await page.emulateMedia({ media: 'print' });
  assert.equal(await page.locator('.barra-topo').isVisible(), false);
  assert.equal(await btn('Voltar').isVisible(), false);
  await page.emulateMedia({ media: 'screen' });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  assert.deepEqual(errs, []);
  console.log(`PASS: M09 layout — capa, base local, limites, ${vistas} perguntas literais, retomada, Voltar, checklist com conclusão, impressão, sem erros`);
  await b.close(); server.close();
})().catch((e) => { console.error(e); process.exit(1); });
