/* Métricas do LG2 (js/metricas.js) em navegador de verdade; execute: node tests/lg2-metricas.cjs.
   1) Em 127.0.0.1 nenhum módulo chama a rota de telemetria.
   2) Num endereço de produção simulado (https), cada módulo avisa a abertura com o próprio número,
      a conclusão sai uma vez só quando a caixa .lg2-proximo aparece, e nenhuma resposta vai junto. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
let playwright;
try { playwright = require('playwright'); } catch { playwright = require(process.env.PW); }

const publicRoot = path.resolve(__dirname, '..', 'public');
const MODULOS = { 1: 'turma-a/m01', 2: 'turma-b/m02', 3: 'turma-a/m03', 4: 'turma-a/m04', 5: 'turma-a/m05', 6: 'turma-b/m06', 7: 'turma-b/m07', 8: 'turma-b/m08', 9: 'turma-b/m09', 10: 'turma-b/m10' };
const TIPOS = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.mp4': 'video/mp4' };
const PRODUCAO = 'https://academy.lg2-teste.example';

function arquivo(urlPath) {
  let nome = path.resolve(publicRoot, '.' + decodeURIComponent(urlPath));
  if (!nome.startsWith(publicRoot + path.sep)) return null;
  if (fs.existsSync(nome) && fs.statSync(nome).isDirectory()) nome = path.join(nome, 'index.html');
  return fs.existsSync(nome) ? nome : null;
}

(async () => {
  const server = http.createServer((req, res) => {
    const nome = arquivo(req.url.split('?')[0]);
    if (!nome) { res.writeHead(404).end(); return; }
    res.writeHead(200, { 'Content-Type': TIPOS[path.extname(nome)] || 'application/octet-stream' }).end(fs.readFileSync(nome));
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await playwright.chromium.launch({ headless: true });
  let checks = 0;
  try {
    // 1) Local: nenhuma chamada à telemetria.
    const local = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const pedidosLocais = [];
    const errosLocais = [];
    local.on('request', (r) => { if (r.url().includes('/api/')) pedidosLocais.push(r.url()); });
    local.on('pageerror', (e) => errosLocais.push(e.message));
    for (const pasta of [...Object.values(MODULOS), 'jornada']) {
      await local.goto(`${base}/lg2/${pasta}/`);
      await local.waitForLoadState('load');
      await local.evaluate(() => { const d = document.createElement('div'); d.className = 'lg2-proximo'; d.textContent = 'fim'; document.body.appendChild(d); });
      await local.waitForTimeout(50);
    }
    assert.deepEqual(pedidosLocais, [], 'em 127.0.0.1 não pode haver chamada à telemetria');
    assert.deepEqual(errosLocais, []);
    checks += 2;

    // 2) Produção simulada.
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const enviados = [];
    await ctx.route(`${PRODUCAO}/**`, (route) => {
      const url = new URL(route.request().url());
      if (url.pathname === '/api/telemetry/events') {
        assert.equal(route.request().method(), 'POST');
        enviados.push(JSON.parse(route.request().postData()));
        return route.fulfill({ status: 200, contentType: 'application/json', body: '{"accepted":true,"inserted":1}' });
      }
      if (url.pathname === '/api/lg2/progresso') return route.fulfill({ status: 200, contentType: 'application/json', body: '{"u":"teste","dados":null,"atualizado_em":null}' });
      const nome = arquivo(url.pathname);
      if (!nome) return route.fulfill({ status: 404, body: '' });
      return route.fulfill({ status: 200, contentType: TIPOS[path.extname(nome)] || 'application/octet-stream', body: fs.readFileSync(nome) });
    });
    const page = await ctx.newPage();
    const erros = [];
    page.on('pageerror', (e) => erros.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error') erros.push('console: ' + m.text()); });

    for (const [n, pasta] of Object.entries(MODULOS)) {
      enviados.length = 0;
      await page.goto(`${PRODUCAO}/lg2/${pasta}/`);
      await page.waitForLoadState('load');
      await page.waitForFunction(() => window.LG2Metricas, null, { timeout: 5000 });
      await page.waitForTimeout(150);
      const nomes = enviados.map((b) => b.events[0].eventName);
      assert.deepEqual(nomes, ['lg2_module_opened'], `Módulo ${n}: só a abertura ao carregar (veio ${nomes})`);
      const ev = enviados[0].events[0];
      assert.deepEqual(Object.keys(enviados[0]), ['events']);
      assert.deepEqual(Object.keys(ev).sort(), ['eventId', 'eventName', 'metadata', 'occurredAt', 'route', 'sessionId']);
      assert.deepEqual(ev.metadata, { modulo: Number(n) });
      assert.equal(ev.route, '/lg2');
      assert.match(ev.sessionId, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
      checks += 5;

      // Fim do módulo: caixa escondida não conta; ao aparecer conta uma vez só.
      await page.evaluate(() => {
        const w = document.createElement('div'); w.id = 'teste-fim'; w.hidden = true;
        w.innerHTML = '<div class="acoes lg2-proximo"><a href="#">Ir</a></div>';
        document.body.appendChild(w);
      });
      await page.waitForTimeout(80);
      assert.equal(enviados.length, 1, `Módulo ${n}: caixa escondida não conclui`);
      for (const h of [false, true, false]) {
        await page.evaluate((h) => { document.getElementById('teste-fim').hidden = h; }, h);
        await page.waitForTimeout(80);
      }
      const fim = enviados.slice(1).map((b) => b.events[0]);
      assert.equal(fim.length, 1, `Módulo ${n}: conclusão uma vez só`);
      assert.equal(fim[0].eventName, 'lg2_module_completed');
      assert.deepEqual(fim[0].metadata, { modulo: Number(n) });
      assert.equal(fim[0].sessionId, ev.sessionId, 'mesma aba, mesma sessão');
      checks += 4;
    }

    // Jornada: carregar não envia nada; o envio de fim existe.
    enviados.length = 0;
    await page.goto(`${PRODUCAO}/lg2/jornada/`);
    await page.waitForLoadState('load');
    await page.waitForTimeout(300);
    const daJornada = enviados.filter((b) => b.events[0].route === '/lg2/jornada');
    assert.deepEqual(daJornada, [], 'abrir a jornada não conta como fim');
    assert.equal(await page.evaluate(() => typeof window.LG2Metricas.enviar), 'function');
    checks += 2;

    assert.deepEqual(erros, []);
    checks += 1;
    console.log(`PASS ${checks} checagens · 10 módulos avisam abertura e conclusão (uma vez) só no site; nada em 127.0.0.1; jornada sem envio ao abrir`);
  } finally {
    await browser.close();
    server.close();
  }
})().catch((e) => { console.error('FAIL', e); process.exit(1); });
