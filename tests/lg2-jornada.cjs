/* Jornada completa do LG2 (public/lg2/jornada/); execute: node tests/lg2-jornada.cjs.
   Percorre os módulos de verdade, dentro da jornada, respondendo cada tela com a primeira opção
   ou um texto/número neutro, e confere que só o módulo seguinte libera. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const publicRoot = path.resolve(__dirname, '..', 'public');
let playwright;
try { playwright = require('playwright'); } catch { playwright = require(process.env.PW); }

// Ordem esperada, escrita à parte do app.
const PRONTOS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

(async () => {
  const server = http.createServer((req, res) => {
    const name = path.resolve(publicRoot, '.' + decodeURIComponent(req.url.split('?')[0]));
    if (!name.startsWith(publicRoot + path.sep)) { res.writeHead(403).end(); return; }
    fs.readFile(name, (error, bytes) => {
      if (error) { res.writeHead(404).end(); return; }
      const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.webp': 'image/webp', '.jpg': 'image/jpeg' };
      res.writeHead(200, { 'Content-Type': types[path.extname(name)] || 'application/octet-stream' }).end(bytes);
    });
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  let browser;
  try {
    browser = await playwright.chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('response', (r) => { if (r.status() >= 400) errors.push(r.status() + ' ' + r.url()); });
    page.on('dialog', (d) => d.accept());
    page.on('popup', (p) => p.close());
    const situacoes = () => page.$$eval('#trilha li', (xs) => xs.map((x) => x.className.replace(' atual', '')));
    const atual = () => page.$eval('#trilha li.atual button', (b) => Number(b.textContent)).catch(() => null);
    const caminhoIframe = () => page.evaluate(() => document.getElementById('modulo').contentWindow.location.pathname);
    const esperarModulo = async (n) => {
      await page.waitForFunction((n) => {
        const f = document.getElementById('modulo');
        try { return f.contentWindow.location.pathname.includes('/m' + String(n).padStart(2, '0') + '/') && f.contentDocument.readyState === 'complete' && f.contentDocument.body.children.length > 0; } catch { return false; }
      }, n, { timeout: 10000 });
    };

    await page.goto(base + '/lg2/jornada/index.html');
    await esperarModulo(1);
    assert.equal(await atual(), 1);
    assert.deepEqual(await situacoes(), ['liberado', ...Array(9).fill('bloqueado')]);

    // Tocar num módulo trancado não abre: avisa qual concluir.
    await page.click('#trilha li:nth-child(3) button');
    assert.match(await page.textContent('#aviso'), /Conclua o Módulo 2 para liberar o Módulo 3/);
    assert.equal(await atual(), 1);
    if (process.env.SHOTS) await page.screenshot({ path: path.join(process.env.SHOTS, 'jornada-bloqueado.png') });
    // Tentar pular pelo endereço dentro da moldura também não abre: volta ao módulo atual.
    await page.evaluate(() => { document.getElementById('modulo').contentWindow.location.href = '/lg2/turma-a/m05/index.html'; });
    await page.waitForTimeout(300);
    await esperarModulo(1);

    // Responde o módulo de verdade, tela por tela, até aparecer o botão do próximo módulo.
    const frame = () => page.frames().find((f) => f !== page.mainFrame());
    async function responderAteOFim(n) {
      let anterior = '', repetido = 0, viuEscondido = false;
      for (let passo = 0; passo < 300; passo++) {
        const f = frame();
        const tela = await f.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').slice(0, 600)).catch(() => '');
        repetido = tela === anterior ? repetido + 1 : 0;
        anterior = tela;
        const r = await f.evaluate((arg) => {
          const forcar = arg.forcar;
          const prox = document.querySelector('.lg2-proximo');
          if (prox && !prox.closest('[hidden]') && prox.getClientRects().length) return 'fim';
          // Resultado com o botão do próximo módulo ainda escondido (M7): avisa uma vez para o teste conferir.
          if (prox && !arg.viuEscondido) return 'escondido';
          const vis = (e) => e && e.offsetParent !== null && !e.disabled;
          // campos vazios: texto/número neutro
          for (const i of document.querySelectorAll('input:not([type=checkbox]):not([type=radio]), textarea')) {
            if (vis(i) && !i.value) {
              i.value = i.type === 'number' || i.inputMode === 'numeric' || i.inputMode === 'decimal' ? '10' : (i.type === 'date' ? '2026-10-20' : '10');
              i.dispatchEvent(new Event('input', { bubbles: true })); i.dispatchEvent(new Event('change', { bubbles: true }));
            }
          }
          for (const s of document.querySelectorAll('select')) {
            if (vis(s) && !s.value && s.options.length > 1) { s.selectedIndex = 1; s.dispatchEvent(new Event('change', { bubbles: true })); }
          }
          for (const g of document.querySelectorAll('input[type=radio]')) {
            const nome = g.name; if (vis(g) && !document.querySelector(`input[name="${nome}"]:checked`)) { g.click(); }
          }
          const botoes = [...document.querySelectorAll('button, a.btn')].filter(vis);
          const txt = (b) => b.textContent.replace(/\s+/g, ' ').trim();
          // A tela não mudou depois de avançar: falta escolher. Toca uma opção (alterna entre elas).
          if (forcar) {
            // Cada grupo de opções ainda sem escolha recebe a primeira opção (fora "Não sei").
            let tocou = 0;
            for (const g of document.querySelectorAll('.opcoes')) {
              if (!vis(g) || g.querySelector('.sel, [aria-pressed="true"], [aria-checked="true"]')) continue;
              const o = [...g.querySelectorAll('button')].find((b) => vis(b) && !/não sei/i.test(txt(b)));
              if (o) { o.click(); tocou++; }
            }
            if (tocou && forcar === 1) return 'grupos:' + tocou;
            const ops = botoes.filter((b) => (b.classList.contains('opcao') || b.closest('.opcoes')) && !/não sei/i.test(txt(b)));
            if (ops.length) { const op = ops[(forcar - 1) % ops.length]; op.click(); return 'forcou:' + txt(op).slice(0, 30); }
          }
          const avancar = ['Ver o resultado', 'Ver resultado', 'Ver meu resumo', 'Ver o resumo', 'Ver resumo', 'Ver meu resultado', 'Ver o diagnóstico', 'Ver meu diagnóstico', 'Continuar', 'Começar', 'Seguir', 'Próxima', 'Avançar', 'Gravar', 'Salvar', 'Concluir', 'Finalizar', 'Iniciar', 'Ir para o resultado'];
          const ver = botoes.find((x) => /^Ver (o |a |meu |minha )?(resultado|resumo|checklist|diagn[oó]stico|plano|retrato)/i.test(txt(x)));
          if (ver) { ver.click(); return 'avancou:' + txt(ver); }
          for (const a of avancar) { const b = botoes.find((x) => txt(x) === a || txt(x).startsWith(a)); if (b) { b.click(); return 'avancou:' + a; } }
          // escolha ainda sem resposta: primeira opção que não seja "Não sei"
          const op = botoes.find((b) => (b.classList.contains('opcao') || b.closest('.opcoes')) && !/não sei/i.test(txt(b)) && b.getAttribute('aria-pressed') !== 'true' && !b.classList.contains('marcada') && !b.classList.contains('ativa'));
          if (op) { op.click(); return 'opcao:' + txt(op).slice(0, 30); }
          return 'parado:' + botoes.map(txt).join(' | ').slice(0, 400);
        }, { forcar: repetido && repetido % 2 ? (repetido + 1) / 2 : 0, viuEscondido });
        if (process.env.DEBUG) console.log(n, r, process.env.DEBUG === '2' ? tela.slice(0, 260) : '');
        if (r === 'fim') return passo;
        if (r === 'escondido') {
          // O módulo ainda não liberou o botão do próximo: a jornada não pode dar como concluído.
          await page.waitForTimeout(1500);
          const feitos = await page.evaluate(() => JSON.parse(localStorage.getItem('lg2-jornada')).feitos);
          assert.ok(!feitos.includes(n), `módulo ${n} concluído antes de mostrar o botão do próximo módulo`);
          viuEscondido = true; escondidos.push(n);
          continue;
        }
        if (r.startsWith('parado') || repetido > 12) { if (process.env.DEBUG) console.log('TELA', anterior, await f.evaluate(() => [...document.querySelectorAll('button,a')].map((b) => b.textContent.replace(/\s+/g, ' ').trim() + (b.offsetParent ? '' : '(oculto)') + (b.disabled ? '(off)' : '')).join(' | '))); throw new Error(`Módulo ${n} parou: ${r}`); }
        await page.waitForTimeout(60);
      }
      throw new Error(`Módulo ${n} não terminou`);
    }

    const passos = {};
    const escondidos = [];
    for (let i = 0; i < PRONTOS.length; i++) {
      const n = PRONTOS[i];
      await esperarModulo(n);
      assert.equal(await atual(), n, `jornada deveria estar no módulo ${n}`);
      passos[n] = await responderAteOFim(n);
      await page.waitForFunction((n) => JSON.parse(localStorage.getItem('lg2-jornada')).feitos.includes(n), n, { timeout: 3000 });
      const sit = await situacoes();
      assert.equal(sit[n - 1], 'feito', `módulo ${n} concluído`);
      const prox = PRONTOS[i + 1];
      if (prox) {
        assert.equal(sit[prox - 1], 'liberado', `módulo ${prox} liberado após ${n}`);
        PRONTOS.slice(i + 2).forEach((m) => assert.equal(sit[m - 1], 'bloqueado', `módulo ${m} segue bloqueado`));
        if (n === 1 && process.env.SHOTS) await page.screenshot({ path: path.join(process.env.SHOTS, 'jornada-m01-fim.png') });
      }
      // O botão do próprio módulo ("Ir para o Módulo N" / "Voltar aos módulos") segue a jornada.
      await frame().evaluate(() => document.querySelector('.lg2-proximo a').click());
      if (prox) await esperarModulo(prox);
    }
    await page.waitForSelector('#fim:not([hidden])');
    assert.deepEqual(await situacoes(), Array(10).fill('feito'));

    // Concluído, qualquer módulo volta a abrir; recarregar mantém o progresso.
    await page.click('#trilha li:nth-child(5) button');
    await esperarModulo(5);
    await page.reload();
    await esperarModulo(5);
    assert.equal((await situacoes()).filter((s) => s === 'feito').length, 10);
    if (process.env.SHOTS) await page.screenshot({ path: path.join(process.env.SHOTS, 'jornada-concluida.png') });

    assert.deepEqual(escondidos, [7], 'o Módulo 7 esconde o botão do próximo até "Sim, pode seguir"');
    assert.deepEqual(errors, []);
    console.log('jornada ok · telas respondidas por módulo:', JSON.stringify(passos));
  } finally {
    if (browser) await browser.close();
    server.close();
  }
})().catch((e) => { console.error(e); process.exit(1); });
