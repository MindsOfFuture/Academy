/* Confere o que é novo na proposta: etapas, etiqueta "Alterar", lista "Minhas análises" (abrir/apagar). */
const http = require('node:http'), fsp = require('node:fs/promises'), path = require('node:path'), assert = require('node:assert/strict');
const { chromium } = require(process.env.PW);
const root = path.join(__dirname, '..', 'public');
const server = http.createServer(async (req, res) => {
  try { res.end(await fsp.readFile(path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://x').pathname)))); } catch { res.writeHead(404).end(); }
});
(async () => {
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const b = await chromium.launch();
  const page = await b.newPage({ viewport: { width: 390, height: 844 } });
  page.setDefaultTimeout(5000);
  const errs = []; page.on('pageerror', (e) => errs.push(e.message)); page.on('dialog', (d) => d.accept());
  const K = 'lg2-turma-a-m05';
  const st = () => page.evaluate((k) => JSON.parse(localStorage.getItem(k)), K);
  const hist = () => page.evaluate((k) => JSON.parse(localStorage.getItem(k + '-historico') || '[]'), K);
  const cl = (sel, t) => page.evaluate(([s, t]) => { const e = [...document.querySelectorAll(s)].find((e) => e.textContent.replace(/\s+/g, ' ').trim() === t && e.offsetParent); if (e) e.click(); return !!e; }, [sel, t]);
  const cont = async () => { await page.click('#ok'); assert.ok(await cl('#acoes button', 'Seguir') || await cl('#acoes button', 'Ver o resultado')); };
  const esc = async (t) => { assert.ok(await cl('#ent .opcao b', t), t); await cont(); };
  const fill = async (v) => { const ins = await page.locator('#ent input').all(); for (let i = 0; i < v.length; i++) await ins[i].fill(String(v[i])); await cont(); };
  const etapaAtual = () => page.evaluate(() => [...document.querySelectorAll('.etapas li')].findIndex((l) => l.classList.contains('atual')) + 1);
  await page.goto(`http://127.0.0.1:${server.address().port}/lg2/turma-a/m05/index.html`);
  await page.evaluate(() => localStorage.clear()); await page.reload();
  await page.click('#ir');
  assert.equal(await page.locator('.etapas').count(), 0, 'P01 sem etapas (como o mockup)');
  await esc('Mercadoria');
  assert.equal(await etapaAtual(), 1); assert.match(await page.textContent('.contexto'), /Tipo escolhido: Mercadoria/);
  await fill(['Camiseta']);
  assert.match(await page.textContent('.contexto .chip'), /^Mercadoria: Camiseta$/);
  await fill(['200']); await fill(['10']); await esc('Não'); await esc('Não');
  assert.equal(await etapaAtual(), 2, 'gastos fixos = etapa 2');
  assert.equal((await st()).hist.at(-1), 'M5.P24');
  // Alterar volta à pergunta do nome, com o nome preenchido
  await page.click('.alterar');
  assert.equal((await st()).hist.at(-1), 'M5.P10');
  assert.equal(await page.inputValue('#ent input'), 'Camiseta');
  assert.deepEqual((await st()).hist, ['M5.P01', 'M5.P10']);
  await fill(['Camiseta lisa']); await fill(['200']); await fill(['10']); await esc('Não'); await esc('Não');
  for (let i = 0; i < 6; i++) await esc('Não');
  assert.equal(await etapaAtual(), 3, 'quantidade = etapa 3');
  await fill(['50']);
  assert.equal(await etapaAtual(), 3, 'preço = etapa 3');
  await fill(['30']);
  assert.equal(await etapaAtual(), 3, 'análise do preço = etapa 3');
  await page.click('#res');
  let h = await hist();
  assert.equal(h.length, 1); assert.equal(h[0].nome, 'Camiseta lisa'); assert.equal(h[0].preco, 30); assert.equal(Math.round(h[0].lucro), 50);
  await page.reload(); await page.click('#ir');                     // reabrir o resultado não duplica
  assert.equal((await hist()).length, 1);
  await page.click('#novo');
  await esc('Serviço'); await fill(['Corte']);
  await page.click('[data-inicio]'); await page.click('#minhas');
  assert.equal(await page.locator('.analise-item').count(), 1);
  await page.click('[data-abrir]');                                 // abre a salva (aceita o aviso)
  assert.equal((await st()).hist.at(-1), 'RESULTADO');
  assert.match(await page.textContent('#tela'), /Camiseta lisa/);
  await page.click('#minhas');
  await page.click('[data-apagar]');
  assert.equal((await hist()).length, 0); assert.equal(await page.locator('.vazio-lista').count(), 1);
  assert.deepEqual(errs, []);
  console.log('PASS: etapas, Alterar, Minhas análises (salvar, não duplicar, abrir, apagar)');
  await b.close(); server.close();
})().catch((e) => { console.error(e); process.exit(1); });
