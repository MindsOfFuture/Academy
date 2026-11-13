/* Jornada completa do LG2 (public/lg2/jornada/); execute: node tests/lg2-jornada.cjs.
   A jornada abre na "Sua trilha" (caminho com as 10 etapas). Percorre os módulos de verdade, dentro da jornada,
   respondendo cada tela com a primeira opção ou um texto/número neutro; ao tocar no botão do fim de cada módulo
   aparece a tela "Etapa N concluída!", que leva à etapa seguinte ou de volta à trilha.
   A trava é a constante TRAVAR do jornada.js. O teste roda os DOIS modos, seja qual for o valor do arquivo:
   o servidor de teste troca a constante na hora de servir (com trava: percurso completo; sem trava: tudo aberto). */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const publicRoot = path.resolve(__dirname, '..', 'public');
let playwright;
try { playwright = require('playwright'); } catch { playwright = require(process.env.PW); }

// Ordem esperada, escrita à parte do app.
const PRONTOS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const JS_JORNADA = fs.readFileSync(path.join(publicRoot, 'lg2', 'jornada', 'js', 'jornada.js'), 'utf8');
const LINHA_TRAVAR = /var TRAVAR = (true|false);/;
assert.match(JS_JORNADA, LINHA_TRAVAR, 'jornada.js precisa da constante TRAVAR');
const travarNoArquivo = LINHA_TRAVAR.exec(JS_JORNADA)[1] === 'true';
let forcarTravar = null; // null = serve o arquivo como está

(async () => {
  const server = http.createServer((req, res) => {
    const name = path.resolve(publicRoot, '.' + decodeURIComponent(req.url.split('?')[0]));
    if (!name.startsWith(publicRoot + path.sep)) { res.writeHead(403).end(); return; }
    fs.readFile(name, (error, bytes) => {
      if (error) { res.writeHead(404).end(); return; }
      if (forcarTravar !== null && name.endsWith(path.join('jornada', 'js', 'jornada.js'))) {
        bytes = Buffer.from(String(bytes).replace(LINHA_TRAVAR, `var TRAVAR = ${forcarTravar};`));
      }
      const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.webp': 'image/webp', '.jpg': 'image/jpeg' };
      res.writeHead(200, { 'Content-Type': types[path.extname(name)] || 'application/octet-stream' }).end(bytes);
    });
  });
  await new Promise((resolve) => server.listen(Number(process.env.PORT) || 0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  let browser;
  try {
    browser = await playwright.chromium.launch({ headless: true });

    // ---- Modo SEM trava (TRAVAR = false): a trilha abre primeiro e todas as etapas prontas abrem, sem aviso de "Conclua".
    forcarTravar = false;
    {
      const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
      const pg = await ctx.newPage();
      const errs = [];
      pg.on('pageerror', (e) => errs.push(e.message));
      pg.on('response', (r) => { if (r.status() >= 400) errs.push(r.status() + ' ' + r.url()); });
      pg.on('dialog', (d) => d.accept());
      const noModulo = (n) => pg.waitForFunction((n) => {
        const f = document.getElementById('modulo');
        try { return !f.hidden && f.contentWindow.location.pathname.includes('/m' + String(n).padStart(2, '0') + '/') && f.contentDocument.readyState === 'complete'; } catch { return false; }
      }, n, { timeout: 10000 });
      await pg.goto(base + '/lg2/jornada/index.html');
      await pg.waitForSelector('#trilha-tela:not([hidden])');
      // A trilha é a primeira tela: nenhum módulo carregado ainda.
      assert.equal(await pg.$eval('#modulo', (f) => f.hidden && !/\/lg2\/turma/.test(f.getAttribute('src') || '')), true, 'a trilha abre antes de qualquer módulo');
      assert.equal(await pg.textContent('#topo-titulo'), 'Sua trilha');
      assert.equal(await pg.textContent('#trilha-prog-texto'), '0 de 10 etapas');
      assert.match(await pg.textContent('.calma'), /Faça no seu ritmo: pode parar quando quiser, seu progresso fica salvo\./);
      assert.equal(await pg.$$eval('.trilha-tela .logos img', (xs) => xs.map((i) => i.alt).join(',')), 'FACC,UFJF,Governo de Minas Gerais');
      const sit = await pg.$$eval('#trilha li', (xs) => xs.map((x) => x.dataset.estado));
      assert.deepEqual(sit, Array(10).fill('nada'), 'sem trava: as 10 etapas abertas e não começadas');
      assert.deepEqual(await pg.$$eval('#trilha li.sugerida', (xs) => xs.map((x) => Number(x.dataset.n))), [1], 'a etapa sugerida é a 1');
      assert.equal(await pg.textContent('#trilha li.sugerida .bolha'), 'Começar');
      // Tocar na Etapa 3 sem ter feito a 1 e a 2 abre o Módulo 3, com o botão "Trilha" no topo.
      await pg.click('#trilha li[data-n="3"] .no-btn');
      await noModulo(3);
      assert.doesNotMatch(await pg.textContent('#aviso'), /Conclua/);
      assert.ok(await pg.isVisible('#volta-trilha'), 'botão "Trilha" no topo dentro do módulo');
      assert.equal(await pg.textContent('#topo-kicker'), 'Etapa 3 de 10');
      // Ir direto a outro módulo pelo endereço dentro da moldura também vale.
      await pg.evaluate(() => { document.getElementById('modulo').contentWindow.location.href = '/lg2/turma-a/m05/index.html'; });
      await noModulo(5);
      await pg.waitForTimeout(400);
      assert.equal(await pg.textContent('#topo-kicker'), 'Etapa 5 de 10');
      await pg.click('#abre-painel');
      const lista = await pg.$$eval('#painel-lista li', (xs) => xs.map((li) => ({ revisar: !!li.querySelector('.revisar'), trava: !!li.querySelector('.trava'), txt: li.textContent })));
      assert.deepEqual(lista.map((x) => x.revisar), Array(10).fill(true), 'sem trava: todos abrem pelo painel');
      assert.ok(lista.every((x) => !x.trava && !/Abre depois/.test(x.txt)), 'sem trava: nada de "Abre depois do Módulo N"');
      assert.ok(await pg.isVisible('#ver-diag-painel'), 'botão do diagnóstico no painel');
      if (process.env.SHOTS) {
        await pg.waitForTimeout(400);
        await pg.$eval('.painel-corpo', (c) => { c.scrollTop = c.scrollHeight; });
        await pg.waitForTimeout(300);
        await pg.screenshot({ path: path.join(process.env.SHOTS, 'trilha_sem_trava_painel.png') });
      }
      await pg.keyboard.press('Escape');
      // "Trilha" volta ao caminho e esconde o módulo; a etapa que estava aberta vira a sugerida.
      await pg.click('#volta-trilha');
      await pg.waitForSelector('#trilha-tela:not([hidden])');
      assert.equal(await pg.$eval('#modulo', (f) => f.hidden), true, '"Trilha" esconde o módulo');
      assert.equal(await pg.isVisible('#volta-trilha'), false);
      assert.deepEqual(await pg.$$eval('#trilha li.sugerida', (xs) => xs.map((x) => Number(x.dataset.n))), [5]);
      assert.deepEqual(errs, []);
      await ctx.close();
    }

    // ---- Modo COM trava (TRAVAR = true): percurso completo, um módulo libera o seguinte.
    forcarTravar = true;
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('response', (r) => { if (r.status() >= 400) errors.push(r.status() + ' ' + r.url()); });
    page.on('dialog', (d) => d.accept());
    page.on('popup', (p) => p.close());
    const situacoes = () => page.$$eval('#trilha li', (xs) => xs.map((x) => x.dataset.estado));
    const sugeridas = () => page.$$eval('#trilha li.sugerida', (xs) => xs.map((x) => Number(x.dataset.n)));
    const atual = () => page.$eval('#modulo', (f) => (f.hidden ? null : Number((/Etapa (\d+) de/.exec(document.getElementById('topo-kicker').textContent) || [])[1]) || null));
    const visivel = (sel) => page.$eval(sel, (e) => !e.hidden);
    const caminhoIframe = () => page.evaluate(() => document.getElementById('modulo').contentWindow.location.pathname);
    const esperarModulo = async (n) => {
      await page.waitForFunction((n) => {
        const f = document.getElementById('modulo');
        try { return !f.hidden && f.contentWindow.location.pathname.includes('/m' + String(n).padStart(2, '0') + '/') && f.contentDocument.readyState === 'complete' && f.contentDocument.body.children.length > 0; } catch { return false; }
      }, n, { timeout: 10000 });
    };

    await page.goto(base + '/lg2/jornada/index.html');
    await page.waitForSelector('#trilha-tela:not([hidden])');
    assert.equal(await atual(), null, 'a trilha abre primeiro, sem módulo aberto');
    assert.deepEqual(await situacoes(), ['nada', ...Array(9).fill('bloqueado')]);
    assert.deepEqual(await sugeridas(), [1]);

    // Painel "Seu negócio até aqui": abre no topo, sem respostas diz isso de forma simples, fecha com Esc.
    const painelAberto = () => page.$eval('#painel', (e) => !e.hidden);
    const painelInfo = () => page.evaluate(() => ({
      pars: [...document.querySelectorAll('#painel-resumo p:not(.vazio)')].map((p) => p.textContent.trim()).filter(Boolean),
      vazio: (document.querySelector('#painel-resumo .vazio') || {}).textContent || '',
      nota: !document.getElementById('painel-nota').hidden ? document.getElementById('painel-nota').textContent : '',
      mods: [...document.querySelectorAll('#painel-lista li')].map((li) => ({
        n: Number(li.dataset.modulo), estado: li.querySelector('.estado').textContent, revisar: !!li.querySelector('.revisar') })),
    }));
    assert.ok(await page.isVisible('#abre-painel'), 'botão "Seu negócio até aqui" visível no topo');
    await page.click('#abre-painel');
    assert.ok(await painelAberto());
    let info = await painelInfo();
    assert.deepEqual(info.pars, []);
    assert.match(info.vazio, /ainda não respondeu nenhuma pergunta/);
    assert.equal(info.mods.length, 10);
    assert.deepEqual(info.mods.map((m) => m.revisar), [true, ...Array(9).fill(false)], 'só o módulo liberado abre para revisar');
    assert.deepEqual(info.mods.map((m) => m.estado), Array(10).fill('Não começado'));
    if (process.env.SHOTS) { await page.waitForTimeout(400); await page.screenshot({ path: path.join(process.env.SHOTS, 'jornada_painel_vazio.png') }); }
    await page.keyboard.press('Escape');
    assert.equal(await painelAberto(), false, 'Esc fecha o painel');

    // Tocar numa etapa trancada não abre: avisa qual concluir.
    await page.click('#trilha li[data-n="3"] .no-btn');
    assert.match(await page.textContent('#aviso'), /Conclua a Etapa 2 para liberar a Etapa 3/);
    assert.equal(await atual(), null);
    assert.ok(await visivel('#trilha-tela'));
    if (process.env.SHOTS) await page.screenshot({ path: path.join(process.env.SHOTS, 'trilha_bloqueada.png') });
    // O balão "Começar" abre a etapa sugerida.
    await page.click('#trilha li.sugerida .bolha');
    await esperarModulo(1);
    assert.equal(await atual(), 1);
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
              i.value = i.type === 'number' || i.inputMode === 'numeric' || i.inputMode === 'decimal' ? '10' : (i.type === 'date' ? new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10) : '10');
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
          // Dica que deixa seguir sem completar (perfil do cliente no M3): segue.
          const mesmo = botoes.find((b) => txt(b) === 'Continuar mesmo assim');
          if (mesmo) { mesmo.click(); return 'avancou:Continuar mesmo assim'; }
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
      assert.equal(await atual(), n, `jornada deveria estar na etapa ${n}`);
      passos[n] = await responderAteOFim(n);
      await page.waitForFunction((n) => JSON.parse(localStorage.getItem('lg2-jornada')).feitos.includes(n), n, { timeout: 3000 });
      // Chegar ao resultado conclui a etapa, mas a pessoa continua no módulo lendo o resultado.
      assert.equal(await atual(), n, 'o resultado continua na tela depois de concluir');
      assert.equal(await visivel('#concluida'), false);
      const prox = PRONTOS[i + 1];
      // O botão do próprio módulo ("Ir para o Módulo N" / "Voltar aos módulos") mostra a tela de etapa concluída.
      await frame().evaluate(() => document.querySelector('.lg2-proximo a').click());
      if (!prox) break;
      await page.waitForSelector('#concluida:not([hidden])');
      assert.equal(await page.$eval('#modulo', (f) => f.hidden), true, 'não pula direto para o próximo módulo');
      assert.equal(await page.textContent('#conc-titulo'), `Etapa ${n} concluída!`);
      assert.equal(await page.textContent('#conc-prog-texto'), `${i + 1} de 10 etapas`);
      assert.equal(await page.$$eval('#conc-mini li.feito', (xs) => xs.length), i + 1);
      assert.equal((await page.textContent('#conc-proxima')).trim(), `Começar a etapa ${prox}`);
      assert.ok(await page.getByRole('button', { name: `Começar a etapa ${prox}`, exact: true }).isVisible());
      assert.ok(await page.getByRole('button', { name: 'Voltar à trilha', exact: true }).isVisible());
      if (n === 1) {
        if (process.env.SHOTS) { await page.waitForTimeout(1900); await page.screenshot({ path: path.join(process.env.SHOTS, 'trilha_etapa1_concluida_teste.png') }); }
        // "Voltar à trilha": a Etapa 1 aparece concluída, a 2 liberada e sugerida, as outras fechadas.
        await page.click('#conc-trilha');
        await page.waitForSelector('#trilha-tela:not([hidden])');
        assert.equal(await visivel('#concluida'), false);
        const sit = await situacoes();
        assert.equal(sit[0], 'feito');
        assert.ok(['nada', 'andamento'].includes(sit[1]), 'Etapa 2 liberada: ' + sit[1]);
        assert.deepEqual(sit.slice(2), Array(8).fill('bloqueado'));
        assert.deepEqual(await sugeridas(), [2]);
        assert.equal(await page.textContent('#trilha-prog-texto'), '1 de 10 etapas');
        // Na trilha, o painel mostra o resumo com o que foi respondido no Módulo 1.
        await page.click('#abre-painel');
        assert.ok(await painelAberto(), 'painel abre no meio da jornada');
        info = await painelInfo();
        assert.ok(info.pars.length >= 1, 'pelo menos um parágrafo depois de responder o Módulo 1');
        assert.equal(info.vazio, '');
        assert.equal(info.nota, 'Montado com o que você respondeu. Se algo não estiver certo, abra o módulo e corrija.');
        assert.equal(info.mods[0].estado, 'Feito');
        assert.deepEqual(info.mods.map((m) => m.revisar), [true, true, ...Array(8).fill(false)]);
        // Legível no celular: o painel cabe na largura e o conteúdo rola dentro dele.
        const caixa = await page.evaluate(() => {
          const c = document.querySelector('.painel-corpo'), r = document.querySelector('.painel').getBoundingClientRect();
          return { largura: r.width, direita: r.right, rolavel: c.scrollWidth <= c.clientWidth, overflow: getComputedStyle(c).overflowY, base: r.bottom };
        });
        assert.ok(caixa.direita <= 390 && caixa.rolavel && caixa.overflow === 'auto' && caixa.base <= 844, 'painel cabe na tela do celular: ' + JSON.stringify(caixa));
        if (process.env.SHOTS) {
          await page.waitForTimeout(400); await page.screenshot({ path: path.join(process.env.SHOTS, 'trilha_painel_m01.png') });
        }
        await page.click('#fecha-painel');
        assert.equal(await painelAberto(), false, 'Fechar fecha o painel');
        // "Abrir para revisar" abre o módulo certo; depois a Etapa 2 abre pelo mesmo painel.
        await page.click('#abre-painel');
        await page.click('#painel-lista li[data-modulo="1"] .revisar');
        assert.equal(await painelAberto(), false);
        await esperarModulo(1);
        assert.equal(await atual(), 1, '"Abrir para revisar" abre o Módulo 1');
        await page.click('#abre-painel');
        await page.click('#painel-lista li[data-modulo="2"] .revisar');
        await esperarModulo(2);
        assert.equal(await atual(), 2);
      } else {
        // "Começar a etapa N+1" abre a etapa seguinte.
        await page.click('#conc-proxima');
      }
    }
    // Depois da última etapa: o fim da jornada, com o resumo e o diagnóstico.
    await page.waitForSelector('#fim:not([hidden])');
    assert.equal(await page.$eval('#modulo', (f) => f.hidden), true);
    assert.equal(await visivel('#concluida'), false);
    assert.ok(await page.isVisible('#ver-diag-fim'), 'botão "Ver o diagnóstico final" no fim da jornada');
    // "Ver a trilha": as 10 concluídas, sem etapa sugerida.
    await page.click('#fim-trilha');
    await page.waitForSelector('#trilha-tela:not([hidden])');
    assert.deepEqual(await situacoes(), Array(10).fill('feito'));
    assert.deepEqual(await sugeridas(), []);
    assert.equal(await page.textContent('#trilha-prog-texto'), '10 de 10 etapas');

    // Concluída, qualquer etapa volta a abrir; recarregar mantém o progresso.
    await page.click('#trilha li[data-n="5"] .no-btn');
    await esperarModulo(5);
    await page.reload();
    await page.waitForSelector('#fim:not([hidden])');
    await page.click('#fim-trilha');
    assert.equal((await situacoes()).filter((s) => s === 'feito').length, 10);
    if (process.env.SHOTS) await page.screenshot({ path: path.join(process.env.SHOTS, 'trilha_concluida.png') });

    assert.deepEqual(escondidos, [7], 'o Módulo 7 esconde o botão do próximo até "Sim, pode seguir"');
    assert.deepEqual(errors, []);
    console.log('jornada ok · modos testados: sem trava e com trava · TRAVAR no arquivo =', travarNoArquivo, '· telas respondidas por módulo:', JSON.stringify(passos));
  } finally {
    if (browser) await browser.close();
    server.close();
  }
})().catch((e) => { console.error(e); process.exit(1); });
