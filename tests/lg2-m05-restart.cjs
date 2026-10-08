const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require('C:/Users/faelr/Downloads/reps/Academy/node_modules/playwright');

const root = path.resolve(__dirname, '../public');
const label = 'Analisar outro produto, serviço ou mercadoria';
const key = 'lg2-turma-a-m05';
const artifacts = 'C:/Users/faelr/AppData/Local/hermes/work/lg2-m05-restart';
const server = http.createServer(async (req, res) => {
  try {
    const file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
    if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
    const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf' };
    res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
    res.end(await fs.readFile(file));
  } catch { res.writeHead(404).end(); }
});

(async () => {
  let browser;
  try {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    console.log(`Owned HTTP server PID ${process.pid}, port ${server.address().port}`);
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
    page.setDefaultTimeout(5000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`http://127.0.0.1:${server.address().port}/lg2/turma-a/m05/index.html`);
    await page.getByRole('button', { name: 'Começar', exact: true }).click();
    assert.equal(await page.getByRole('button', { name: label, exact: true }).count(), 1, 'Restart must be discoverable on questions');
    console.log('PASS: explicit restart on questions');
    const state = () => page.evaluate(key => JSON.parse(localStorage.getItem(key)), key);
    const restart = async accept => {
      const dialogHandled = new Promise((resolve, reject) => page.once('dialog', async dialog => {
        try {
          assert.equal(dialog.type(), 'confirm');
          assert.match(dialog.message(), /respostas atuais serão apagadas/);
          assert.match(dialog.message(), /salve ou imprima/);
          await (accept ? dialog.accept() : dialog.dismiss());
          resolve();
        } catch (error) { await dialog.dismiss(); reject(error); }
      }));
      await page.getByRole('button', { name: label, exact: true }).click();
      await dialogHandled;
    };
    const assertFresh = async () => {
      assert.deepEqual(await state(), { R: {}, hist: ['M5.P01'] });
      assert.equal(await page.locator('.opcao').count(), 3);
      assert.equal(await page.locator('.opcao.sel').count(), 0);
    };
    const assertTop = async () => {
      await page.evaluate(() => window.scrollTo(0, 0));
      const box = await page.getByRole('button', { name: label, exact: true }).boundingBox();
      assert.ok(box && box.y >= 0 && box.y + box.height <= 844, 'Restart visible without scrolling');
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'No horizontal overflow');
    };
    await fs.mkdir(artifacts, { recursive: true });
    await assertTop();
    await page.screenshot({ path: path.join(artifacts, 'mobile-question.png') });

    for (const [branch, first] of [['Produto', 'M5.P02'], ['Serviço', 'M5.P17'], ['Mercadoria', 'M5.P10']]) {
      await assertFresh();
      await page.getByRole('button', { name: new RegExp('^' + branch) }).click();
      await page.getByRole('button', { name: 'Continuar', exact: true }).click();
      await page.getByRole('button', { name: 'Seguir', exact: true }).click();
      assert.equal((await state()).hist.at(-1), first);
      await page.locator('#ent input').fill('Item de teste ' + branch);
      const before = await state();
      const heading = await page.locator('h2.q').textContent();
      await restart(false);
      assert.deepEqual(await state(), before, 'Cancel preserves saved answers/history');
      assert.equal(await page.locator('#ent input').inputValue(), 'Item de teste ' + branch, 'Cancel preserves unsaved input');
      assert.equal(await page.locator('h2.q').textContent(), heading);
      await page.getByRole('button', { name: 'Continuar', exact: true }).click();
      await page.getByRole('button', { name: 'Seguir', exact: true }).click();
      const saved = await state();
      await page.reload();
      await page.getByRole('button', { name: 'Continuar de onde parei', exact: true }).click();
      assert.deepEqual(await state(), saved, 'Progress persists on reload');

      // Responde pelo DOM real até o resultado; não injeta respostas no armazenamento.
      for (let step = 0; step < 50 && (await state()).hist.at(-1) !== 'RESULTADO'; step++) {
        if (await page.locator('#ent .opcao').count()) {
          const no = page.locator('#ent .opcao').filter({ hasText: /^Não$/ });
          await (await no.count() ? no : page.locator('#ent .opcao').first()).click();
        } else {
          for (const input of await page.locator('#ent input').all()) {
            const numeric = await input.getAttribute('inputmode');
            const cls = await input.getAttribute('class');
            await input.fill(numeric || /valor/.test(cls || '') ? '10' : 'Insumo de teste');
          }
        }
        await page.getByRole('button', { name: 'Continuar', exact: true }).click();
        assert.equal(await page.locator('#erro').isVisible(), false, 'Valid fixture answer');
        await page.getByRole('button', { name: /^(Seguir|Ver o resultado)$/ }).click();
      }
      assert.equal((await state()).hist.at(-1), 'RESULTADO');
      assert.equal(await page.locator('.passo').textContent(), 'Resultado');
      await assertTop();
      assert.equal(await page.locator('#novo').count(), 1);
      const resultState = await state();
      const resultHtml = await page.locator('#tela').innerHTML();
      await restart(false);
      assert.deepEqual(await state(), resultState);
      assert.equal(await page.locator('#tela').innerHTML(), resultHtml, 'Cancel leaves results intact');
      await page.reload();
      await page.getByRole('button', { name: 'Continuar de onde parei', exact: true }).click();
      assert.equal(await page.locator('.passo').textContent(), 'Resultado');
      assert.deepEqual(await state(), resultState);
      if (branch === 'Produto') await page.screenshot({ path: path.join(artifacts, 'mobile-results.png') });
      await restart(true);
      await assertFresh();
      await page.reload();
      await page.getByRole('button', { name: 'Continuar de onde parei', exact: true }).click();
      await assertFresh();
      console.log(`PASS: ${branch} branch through real results; cancel, confirm and reload persistence`);
    }
    await page.locator('.opcao').first().click();
    await page.getByRole('button', { name: 'Continuar', exact: true }).click();
    await page.getByRole('button', { name: 'Seguir', exact: true }).click();
    await restart(true);
    await assertFresh();
    await page.reload();
    await page.getByRole('button', { name: 'Continuar de onde parei', exact: true }).click();
    await assertFresh();
    console.log('PASS: question confirmation clears answers/history and persists');
    await page.emulateMedia({ media: 'print' });
    assert.equal(await page.getByRole('button', { name: label, exact: true }).isVisible(), false);
    assert.deepEqual(errors, []);
    console.log('PASS: restart hidden in print; no browser errors');
    console.log(`Screenshots: ${artifacts}/mobile-question.png and mobile-results.png`);
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
