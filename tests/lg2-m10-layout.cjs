/* Módulo 10 (Turma B): layout no modelo do M5 sem mudar os botões.
   Reproduz os fluxos de botão de tests/lg2-m10.cjs (que exige a planilha original)
   com os mesmos nomes exatos e compara os textos exibidos com dados/perguntas.json. */
const http = require('node:http'), fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const { chromium } = require(process.env.PW);
const root = path.join(__dirname, '..', 'public');
const dir = path.join(root, 'lg2/turma-b/m10');
const data = JSON.parse(fs.readFileSync(path.join(dir, 'dados/perguntas.json'), 'utf8'));
const expected = data.perguntas;
const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.ttf': 'font/ttf' };
const server = http.createServer((req, res) => {
  const name = path.resolve(root, '.' + decodeURIComponent(req.url.split('?')[0]));
  if (!name.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  fs.readFile(name, (e, bytes) => { if (e) { res.writeHead(404).end(); return; } res.writeHead(200, { 'Content-Type': types[path.extname(name)] || 'application/octet-stream' }).end(bytes); });
});
(async () => {
  assert.equal(expected.length, 15);
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
    page.setDefaultTimeout(8000);
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('response', (r) => { if (r.status() >= 400) errors.push(r.url()); });
    const btn = (name, exact = true) => page.getByRole('button', { name, exact });
    const key = 'lg2-turma-b-m10';
    await page.goto(`http://127.0.0.1:${server.address().port}/lg2/turma-b/m10/index.html`);
    await page.evaluate(() => localStorage.clear()); await page.reload();

    // capa: barra do topo, faixa grande, botões
    await btn('Começar').waitFor();
    assert.equal(await page.locator('.barra-topo .logo-mini').count(), 1);
    assert.equal(await page.locator('.heroi.heroi-grande img[src="assets/hero-inicio.webp"]').count(), 1);
    assert.equal((await page.textContent('.heroi h1')).trim(), data.nome);
    assert.equal(await page.locator('#iniciar.seta').count(), 1);
    assert.equal(await page.locator('.rodape .logos img').count(), 3);
    await btn('Começar').click();
    await page.evaluate(() => localStorage.setItem('lg2-turma-a-m09', 'sentinela'));
    const malicious = '<img src=x onerror="window.injetado=true"> & "teste"';
    for (let i = 0; i < 15; i++) {
      assert.equal(await page.locator('#pergunta').textContent(), expected[i].pergunta, `pergunta ${i + 1}`);
      assert.equal(await page.locator('.cartao-q #pergunta.q').count(), 1);
      assert.equal(await page.locator('.heroi:not(.heroi-grande) img[src="assets/hero-preco.webp"]').count(), 1);
      assert.equal((await page.textContent('.heroi .passo')).trim(), `Pergunta ${i + 1} de 15`);
      assert.equal(await page.locator('.heroi .barra-fill').count(), 1);
      assert.equal(await page.locator('.heroi #reiniciar.reinicio').count(), 1, 'reinício na faixa');
      assert.equal(await page.locator('.acoes-voltar #voltar.btn-linha.voltar').count(), 1, 'Voltar de contorno embaixo');
      assert.equal(await page.locator('textarea').count(), 1);
      assert.equal(await page.locator('select,input[type=radio],input[type=checkbox]').count(), 0);
      await page.locator('textarea').fill(i === 0 ? malicious : `Resposta ${i + 1}`);
      if (i === 0) {
        await page.reload();
        await btn('Continuar de onde parei', false).click();
        assert.equal(await page.locator('textarea').inputValue(), malicious);
      }
      if (i === 1) {
        await btn('Voltar').click();
        assert.equal(await page.locator('textarea').inputValue(), malicious);
        await btn('Próxima').click();
        assert.equal(await page.locator('textarea').inputValue(), 'Resposta 2');
      }
      await btn(i === 14 ? 'Ver resumo' : 'Próxima').click();
    }
    // resumo: conclusão no topo e conteúdo igual embaixo
    assert.equal(await page.locator('.concluido .check').count(), 1);
    assert.equal((await page.textContent('.concluido h2')).trim(), 'Você concluiu o Módulo 10');
    assert.equal(await page.locator('.resposta').count(), 15);
    assert.deepEqual((await page.locator('.resumo .cartao h2').allTextContents()), expected.map((q) => q.pergunta));
    assert.equal(await page.locator('.resposta').first().textContent(), malicious);
    assert.equal(await page.locator('.resposta').nth(14).textContent(), 'Resposta 15');
    assert.equal(await page.evaluate(() => window.injetado), undefined);
    assert.equal(await page.locator('.resumo img').count(), 0);
    assert.equal(await page.locator('.lg2-proximo a').count(), 1);
    await page.reload();
    await btn('Continuar de onde parei', false).click();
    assert.equal(await page.locator('.resposta').count(), 15);
    await btn('Editar resposta 8').click();
    assert.equal(await page.locator('#pergunta').textContent(), expected[7].pergunta);
    await page.locator('textarea').fill('Resposta editada');
    await btn('Voltar ao resumo').click();
    assert.equal(await page.locator('.resposta').nth(7).textContent(), 'Resposta editada');
    await page.evaluate(() => { window.print = () => { window.imprimiu = true; }; });
    await btn('Imprimir resumo', false).click();
    assert.equal(await page.evaluate(() => window.imprimiu), true);
    await page.emulateMedia({ media: 'print' });
    assert.equal(await btn('Editar resposta 8').isVisible(), false);
    assert.equal(await page.locator('.barra-topo').isVisible(), false);
    await page.emulateMedia({ media: 'screen' });
    // trilha "Início" volta à capa
    await page.click('[data-inicio]');
    assert.equal(await page.locator('.heroi-grande').count(), 1);
    await btn('Continuar de onde parei', false).click();
    assert.equal(await page.locator('.resposta').count(), 15);
    const before = await page.evaluate((k) => localStorage.getItem(k), key);
    page.once('dialog', (d) => d.dismiss());
    await btn('Recomeçar do zero', false).click();
    assert.equal(await page.evaluate((k) => localStorage.getItem(k), key), before);
    page.once('dialog', (d) => d.accept());
    await btn('Recomeçar do zero', false).click();
    assert.equal(await page.evaluate((k) => localStorage.getItem(k), key), null);
    assert.equal(await page.evaluate(() => localStorage.getItem('lg2-turma-a-m09')), 'sentinela');
    await page.reload();
    await btn('Começar').click();
    assert.equal(await page.locator('textarea').inputValue(), '');
    // reinício da faixa (pergunta) também apaga, depois de confirmar
    await page.locator('textarea').fill('x');
    page.once('dialog', (d) => d.accept());
    await btn('Recomeçar do zero', false).click();
    assert.equal(await page.evaluate((k) => localStorage.getItem(k), key), null);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    assert.deepEqual(errors, []);
    console.log('PASS: M10 layout — 15/15 perguntas literais de dados/perguntas.json; Começar, Próxima, Ver resumo, Editar resposta N, Voltar ao resumo, Voltar, Continuar de onde parei, Recomeçar do zero e Imprimir resumo com os nomes de sempre; faixa, cartão, conclusão, impressão e 390x844 sem erros.');
  } finally {
    await browser.close();
    await new Promise((r) => server.close(r));
  }
})().catch((e) => { console.error(e); process.exitCode = 1; });
