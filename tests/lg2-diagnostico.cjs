/* Diagnóstico final da jornada do LG2 (public/lg2/jornada/); execute: node tests/lg2-diagnostico.cjs.
   Semeia respostas de vários módulos (com "Não sei", múltipla, "Outro" com texto, dinheiro, horas),
   abre o diagnóstico pelo painel e pelo fim da jornada e confere o que a pessoa lê.
   Sabotagem: DIAG_SABOTAGEM=1 faz a formatação devolver JSON; o teste tem de falhar. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const vm = require('node:vm');
const publicRoot = path.resolve(__dirname, '..', 'public');
let playwright;
try { playwright = require('playwright'); } catch { playwright = require(process.env.PW); }

// Textos das perguntas lidos dos dados dos módulos (a mesma fonte que o app usa).
const PASTAS = { 1: 'turma-a/m01', 3: 'turma-a/m03', 4: 'turma-a/m04', 5: 'turma-a/m05', 7: 'turma-b/m07', 8: 'turma-b/m08' };
const DADOS = {};
for (const [n, p] of Object.entries(PASTAS)) {
  const ctx = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(publicRoot, 'lg2', p, 'dados', `modulo${n}.js`), 'utf8'), ctx);
  DADOS[n] = JSON.parse(JSON.stringify(ctx.window['MODULO' + n])); // fora do realm do vm, para o deepEqual
}
const norm = (s) => String(s).replace(/\s+/g, ' ').trim();
const semExemplo = (s) => norm(s).replace(/\s*\(Ex\.?:[^)]*\)/g, '');
const pergunta = (n, cod) => {
  const p = DADOS[n].perguntas.find((x) => x.codigo === cod);
  assert.ok(p, `pergunta ${cod} existe nos dados do Módulo ${n}`);
  return p;
};

const OFERTA = 'bolo de pote';
const ESTADO = {
  'lg2-jornada': { v: 1, feitos: [1, 3, 4, 5, 7], atual: 1 },
  'lg2-turma-a-m01': { v: 4, atual: 'RESULTADO', R: {
    'M1.P01': { estado: 'opcao', opcao: 'Já vendi algumas vezes' },
    'M1.P03': { estado: 'valor', valor: OFERTA },
    'M1.P03A': { estado: 'opcao', opcao: 'Produto: eu compro materiais e faço o que vendo' },
    'M1.P05': { estado: 'opcao', opcao: 'Até 1 hora por dia' },
    'M1.P08': { estado: 'opcao', opcao: 'Ainda não sei fazer direito', opcoes: ['Ainda não sei fazer direito', 'Me falta lugar ou equipamento'] },
  } },
  'lg2-turma-a-m03': { v: 6, R: {
    'M3.P02': { estado: 'opcao', opcao: 'Sim' },
    'M3.P04': { estado: 'naosei' },
    'M3.P10': { estado: 'opcao', opcao: 'Pessoas comuns (consumidor final)', opcoes: ['Pessoas comuns (consumidor final)'], campos: { Idade: '', 'Onde mora': 'Centro' } },
    'M3.P11': { estado: 'valor', valor: 'falta de tempo para fazer doce' },
    'M3.P13': { estado: 'opcoes', opcoes: ['Indicação (boca a boca)', 'Outro'], detalhe: 'feira do bairro' },
    'M3.P14': { estado: 'valor', campos: { 'O que meu negócio faz de melhor': 'sabor caseiro', 'O que ainda preciso melhorar': 'divulgação' } },
  }, hist: ['M3.P02', 'RESULTADO'] },
  'lg2-turma-a-m04': { v: 5, R: {
    'M4.P11': { estado: 'opcao', opcao: 'Outro', detalhe: 'entrego no mesmo dia' },
    'M4.P20': { estado: 'valor', valor: '7' },
    'M4.P21': { estado: 'valor', valor: '250' },
  }, hist: ['M4.P11', 'RESULTADO'] },
  'lg2-turma-a-m05': { versao: 3, R: {
    'M5.P00': { estado: 'opcao', opcao: 'Já vendi algumas vezes', herdado: 'M1' },
    'M5.P01': { estado: 'opcao', opcao: 'Produto: eu compro materiais e faço o que vendo', herdado: 'M1' },
    'M5.P03': { estado: 'valor', valor: ['farinha', 'leite condensado'] },
    'M5.P04': { estado: 'valor', valor: ['12,50', '8'] },
    'M5.P05': { estado: 'valor', valor: [{ q: '1', u: 'kg' }, { q: '395', u: 'g' }] },
    'M5.P23': { estado: 'valor', valor: { h: '1', m: '30' } },
    'M5.PG': { estado: 'valor', valor: ['Pix', 'Dinheiro'] },
    'M5.P27': { estado: 'naosei' },
    'M5.P36': { estado: 'valor', valor: '1500' },
  }, hist: ['M5.P03', 'RESULTADO'] },
  'lg2-turma-b-m07': { v: 1, ini: { oferta: OFERTA, tipo: 'Produto: eu faço o que vendo', horas: 'Até 10 h' }, R: {
    'M7-02': { estado: 'valor', h: '2', m: '15', un: '10', min: 135, minUn: 13.5 },
    'M7-04': { estado: 'opcao', opcao: 'Sim, alguém da família', horas: 4 },
    'M7-11': { estado: 'multi', opcoes: ['Horas trabalhadas no negócio', 'Pedidos entregues no prazo'] },
    'M7-13': { estado: 'opcao', opcao: 'Sim, pode seguir' },
  }, mapa: ['Pedido', 'Preparo', 'Entrega'], hist: ['M7-02', 'RESULTADO'] },
  'lg2-turma-b-m08': { R: { 'M8.P04': { estado: 'valor', valor: '2.000' }, 'M8.P05': { estado: 'opcao', opcao: 'Não' } }, hist: ['M8.P04', 'M8.P05'] },
};

(async () => {
  const server = http.createServer((req, res) => {
    const name = path.resolve(publicRoot, '.' + decodeURIComponent(req.url.split('?')[0]));
    if (!name.startsWith(publicRoot + path.sep)) { res.writeHead(403).end(); return; }
    fs.readFile(name, (error, bytes) => {
      if (error) { res.writeHead(404).end(); return; }
      if (process.env.DIAG_SABOTAGEM && name.endsWith(path.join('jornada', 'js', 'diagnostico.js'))) {
        bytes = Buffer.from(String(bytes).replace('function formatar(r, p, est) {', 'function formatar(r, p, est) { return JSON.stringify(r);'));
      }
      const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.webp': 'image/webp', '.jpg': 'image/jpeg' };
      res.writeHead(200, { 'Content-Type': types[path.extname(name)] || 'application/octet-stream' }).end(bytes);
    });
  });
  await new Promise((resolve) => server.listen(Number(process.env.PORT) || 0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  let browser;
  const shots = process.env.SHOTS;
  try {
    browser = await playwright.chromium.launch({ headless: true });
    async function abrirJornada(estado, viewport) {
      const ctx = await browser.newContext({ viewport: viewport || { width: 390, height: 844 } });
      await ctx.addInitScript((est) => {
        if (window.top === window && !sessionStorage.getItem('semeado')) {
          sessionStorage.setItem('semeado', '1');
          localStorage.clear();
          for (const [k, v] of Object.entries(est)) localStorage.setItem(k, JSON.stringify(v));
        }
      }, estado);
      const page = await ctx.newPage();
      page.errors = [];
      page.on('pageerror', (e) => page.errors.push(e.message));
      page.on('response', (r) => { if (r.status() >= 400) page.errors.push(r.status() + ' ' + r.url()); });
      await page.goto(base + '/lg2/jornada/index.html');
      await page.waitForFunction(() => document.getElementById('modulo').contentDocument && document.getElementById('modulo').contentDocument.readyState === 'complete');
      return { ctx, page };
    }
    const esperarDiag = (page) => page.waitForFunction(() => {
      const d = document.getElementById('diagnostico');
      return d && !d.hidden && document.querySelectorAll('#diag-corpo .diag-modulo').length === 10 && !document.getElementById('diag-corpo').hasAttribute('aria-busy');
    }, null, { timeout: 15000 });
    const ler = (page) => page.evaluate(() => ({
      texto: document.getElementById('diagnostico').innerText,
      titulo: document.getElementById('diag-titulo').textContent,
      data: document.getElementById('diag-data').textContent,
      secoes: [...document.querySelectorAll('#diag-corpo .diag-secao > h2')].map((h) => h.textContent),
      proximo: document.querySelector('.diag-proximo')?.innerText || '',
      continuar: document.querySelector('.diag-proximo button')?.textContent || '',
      cenario: [...document.querySelectorAll('.diag-cenario p:not(.diag-vazio)')].map((p) => p.textContent),
      abertos: [...document.querySelectorAll('.diag-lista-abertos li')].map((li) => ({ q: li.querySelector('.diag-q').textContent, m: li.querySelector('.diag-mod').textContent, revisar: li.querySelector('.diag-rever')?.textContent })),
      blocos: [...document.querySelectorAll('.diag-modulo')].map((a) => ({
        n: Number(a.dataset.modulo), titulo: a.querySelector('h3').textContent, estado: a.querySelector('.diag-estado').textContent,
        itens: [...a.querySelectorAll('.diag-item')].map((d) => ({ q: d.querySelector('dt').textContent, r: d.querySelector('dd').textContent })),
      })),
    }));

    // ---------- 1. Pelo painel "Seu negócio até aqui", no meio da jornada ----------
    const { ctx, page } = await abrirJornada(ESTADO);
    await page.click('#abre-painel');
    assert.ok(await page.isVisible('#ver-diag-painel'), 'botão do diagnóstico no painel');
    await page.click('#ver-diag-painel');
    await esperarDiag(page);
    assert.equal(await page.$eval('#painel', (e) => e.hidden), true, 'o painel fecha quando o diagnóstico abre');
    const d = await ler(page);

    assert.equal(d.titulo, 'Diagnóstico final do seu negócio');
    assert.match(d.data, new RegExp(`Situação em \\d{1,2} de [a-zç]+ de ${new Date().getFullYear()}`));
    assert.deepEqual(d.secoes, ['Como está o seu negócio hoje', 'Pontos em aberto', 'Seu próximo passo', 'Suas respostas, módulo por módulo']);
    assert.ok(d.proximo.includes('Comece por um ponto em aberto acima') && d.proximo.includes('salve seu progresso'), 'próximo passo usa as lacunas reais e orienta a salvar');
    assert.ok(d.cenario.length >= 1 && d.cenario.length <= 3, 'cenário = 1 a 3 parágrafos do resumo');
    assert.ok(d.cenario.join(' ').includes(OFERTA), 'o cenário fala do negócio da pessoa');
    assert.match(d.texto, /não verifica os dados nem garante resultados/, 'limites do resumo ficam explícitos');

    // Um bloco por módulo, na ordem, com a situação.
    assert.deepEqual(d.blocos.map((b) => b.n), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    const bloco = (n) => d.blocos.find((b) => b.n === n);
    assert.match(bloco(1).titulo, /^Módulo 1 · Perfil do empreendedor/);
    assert.equal(bloco(1).estado, 'concluído');
    assert.equal(bloco(8).estado, 'em andamento');
    assert.equal(bloco(2).estado, 'não começou');
    assert.deepEqual(bloco(2).itens, []);
    assert.match(await page.$eval('.diag-modulo[data-modulo="2"]', (a) => a.innerText), /Nenhuma resposta ainda/);

    // Perguntas com o texto real dos dados, na ordem do módulo.
    const ordemM1 = DADOS[1].perguntas.map((p) => p.codigo).filter((c) => c in ESTADO['lg2-turma-a-m01'].R);
    assert.deepEqual(bloco(1).itens.map((i) => i.q), ordemM1.map((c) => semExemplo(pergunta(1, c).pergunta)));
    const item = (n, cod) => {
      const q = semExemplo(pergunta(n, cod).pergunta);
      const it = bloco(n).itens.find((i) => i.q === q);
      assert.ok(it, `Módulo ${n}: pergunta "${q}" aparece`);
      return it.r;
    };
    // Respostas formatadas.
    assert.equal(item(1, 'M1.P03'), OFERTA);
    assert.equal(item(1, 'M1.P08'), 'Ainda não sei fazer direito e Me falta lugar ou equipamento', 'múltipla vira lista com "e"');
    assert.equal(item(4, 'M4.P11'), 'Outro: entrego no mesmo dia', '"Outro" mostra o que a pessoa escreveu');
    assert.equal(item(4, 'M4.P20'), '7 dias');
    assert.equal(item(4, 'M4.P21'), 'R$ 250', 'valor em reais');
    assert.equal(item(3, 'M3.P13'), 'Indicação (boca a boca) e Outro: feira do bairro');
    assert.equal(item(3, 'M3.P10'), 'Pessoas comuns (consumidor final) (Onde mora: Centro)');
    assert.equal(item(3, 'M3.P14'), 'O que meu negócio faz de melhor: sabor caseiro; O que ainda preciso melhorar: divulgação');
    assert.equal(item(3, 'M3.P04'), 'Não sei');
    assert.equal(item(5, 'M5.P36'), 'R$ 1.500', 'R$ com ponto de milhar');
    assert.equal(item(5, 'M5.P04'), 'farinha: R$ 12,50; leite condensado: R$ 8', 'R$ com vírgula e o nome do item');
    assert.equal(item(5, 'M5.P05'), 'farinha: 1 kg; leite condensado: 395 g');
    assert.equal(item(5, 'M5.P23'), '1 hora e 30 minutos', 'horas e minutos');
    assert.equal(item(8, 'M8.P04'), 'R$ 2.000');
    assert.ok(bloco(5).itens.some((i) => i.q === 'Quais formas de pagamento você aceita?' && i.r === 'Pix e Dinheiro'), 'pergunta criada pelo app (formas de pagamento)');
    assert.equal(bloco(5).itens.filter((i) => i.q === 'Como está a sua ideia hoje?').length, 0, 'a pergunta repetida do Módulo 1 não aparece de novo no Módulo 5');
    // Colchetes de modelo trocados pelo dado da pessoa.
    const q702 = bloco(7).itens.find((i) => /Quanto tempo você leva/.test(i.q));
    assert.equal(q702.q, `Quanto tempo você leva para fazer ${OFERTA}?`);
    assert.equal(q702.r, '2 horas e 15 minutos para 10 unidades');
    assert.equal(bloco(7).itens.find((i) => /Alguém ajuda você/.test(i.q)).r, 'Sim, alguém da família, cerca de 4 horas por semana');
    assert.equal(bloco(7).itens.find((i) => /números você quer acompanhar/.test(i.q)).r, 'Horas trabalhadas no negócio e Pedidos entregues no prazo');
    assert.ok(!bloco(7).itens.some((i) => /Está certo\?/.test(i.q)), 'a tela de confirmação do resultado não entra como pergunta');

    // Pontos em aberto = respostas "Não sei", com o módulo.
    assert.deepEqual(d.abertos, [
      { q: semExemplo(pergunta(3, 'M3.P04').pergunta), m: 'Módulo 3', revisar: 'Rever Módulo 3' },
      { q: semExemplo(pergunta(5, 'M5.P27').pergunta), m: 'Módulo 5', revisar: 'Rever Módulo 5' },
    ]);

    // Nada técnico na tela.
    assert.doesNotMatch(d.texto, /\bM\d{1,2}[.-]P?\d/, 'nenhum código de pergunta');
    assert.doesNotMatch(d.texto, /[{}]|"estado"|\bestado\b|\bopcao\b|\bnaosei\b|undefined|null|NaN|\[object/, 'nada de JSON nem campo interno');
    assert.doesNotMatch(d.texto, /\[|\]/, 'nenhum colchete de modelo');
    assert.doesNotMatch(d.texto, /Grupo \d|Rafael/i, 'nem "Grupo N" nem "Rafael"');

    // Imprimir: botão chama window.print; na impressão só o diagnóstico aparece, sem botões nem moldura.
    const imprimir = page.getByRole('button', { name: 'Imprimir ou salvar em PDF', exact: true });
    assert.ok(await imprimir.isVisible());
    await page.evaluate(() => { window.__impressoes = 0; window.print = () => { window.__impressoes++; }; });
    await imprimir.click();
    assert.equal(await page.evaluate(() => window.__impressoes), 1);
    await page.emulateMedia({ media: 'print' });
    const imp = await page.evaluate(() => ({
      barra: getComputedStyle(document.querySelector('.diag-barra')).display,
      topo: getComputedStyle(document.querySelector('header.topo')).display,
      palco: getComputedStyle(document.querySelector('main.palco')).display,
      diag: getComputedStyle(document.getElementById('diagnostico')).position,
    }));
    assert.deepEqual(imp, { barra: 'none', topo: 'none', palco: 'none', diag: 'static' }, 'impressão limpa: ' + JSON.stringify(imp));
    if (shots) await page.pdf({ path: path.join(shots, 'l4_jornada_diagnostico.pdf'), format: 'A4', printBackground: true });
    await page.emulateMedia({ media: 'screen' });
    if (shots) {
      await page.waitForTimeout(400);
      await page.screenshot({ path: path.join(shots, 'l4_jornada_diagnostico_topo.png') });
      await page.$eval('#diagnostico', (e) => { e.scrollTop = document.querySelector('.diag-respostas').offsetTop - 60; });
      await page.waitForTimeout(400);
      await page.screenshot({ path: path.join(shots, 'l4_jornada_diagnostico_modulos.png') });
    }
    // Esc fecha e devolve o foco.
    await page.keyboard.press('Escape');
    assert.equal(await page.$eval('#diagnostico', (e) => e.hidden), true, 'Esc fecha o diagnóstico');
    assert.deepEqual(page.errors, []);
    await ctx.close();

    // ---------- 2. No fim da jornada (todos concluídos), junto do resumo ----------
    const fimEstado = { ...ESTADO, 'lg2-jornada': { v: 1, feitos: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], atual: null } };
    const fim = await abrirJornada(fimEstado, { width: 1200, height: 1400 });
    const p2 = fim.page;
    await p2.waitForSelector('#fim:not([hidden])');
    assert.ok(await p2.isVisible('#resumo-negocio'), 'resumo no fim');
    await p2.click('#ver-diag-fim');
    await esperarDiag(p2);
    const d2 = await ler(p2);
    assert.ok(d2.blocos.slice(0, 1).every((b) => b.estado === 'concluído'));
    assert.equal(d2.abertos.length, 2);
    if (shots) { await p2.waitForTimeout(400); await p2.screenshot({ path: path.join(shots, 'l4_jornada_diagnostico_1200.png') }); }
    await p2.click('#fecha-diag');
    assert.ok(await p2.isVisible('#fim'), 'Fechar volta ao fim da jornada');
    await p2.click('#ver-diag-fim');
    await esperarDiag(p2);
    await p2.click('.diag-lista-abertos .diag-rever');
    await p2.waitForFunction(() => {
      const iframe = document.getElementById('modulo');
      return document.getElementById('diagnostico').hidden && !iframe.hidden && (iframe.getAttribute('src') || '').endsWith('/m03/index.html');
    });
    await p2.waitForFunction(() => document.getElementById('modulo').contentDocument?.readyState === 'complete');
    assert.deepEqual(p2.errors, []);
    await fim.ctx.close();

    // ---------- 3. Sem nenhuma resposta: abre do mesmo jeito e diz que não há respostas ----------
    const vazio = await abrirJornada({});
    await vazio.page.click('#abre-painel');
    await vazio.page.click('#ver-diag-painel');
    await esperarDiag(vazio.page);
    const d3 = await ler(vazio.page);
    // (o Módulo 1 está aberto na moldura e pode ter gravado o próprio estado inicial)
    assert.ok(d3.blocos.slice(1).every((x) => x.estado === 'não começou' && !x.itens.length), 'sem respostas: módulos não começaram');
    assert.deepEqual(d3.abertos, []);
    assert.match(d3.texto, /Nenhuma pergunta ficou com “Não sei”/);
    assert.ok(d3.proximo.includes('Continue pelo primeiro módulo') && d3.continuar === 'Continuar Módulo 1', 'sem lacunas, oferece o primeiro módulo pendente');
    await vazio.page.click('.diag-proximo button');
    await vazio.page.waitForFunction(() => document.getElementById('diagnostico').hidden && !document.getElementById('modulo').hidden && (document.getElementById('modulo').getAttribute('src') || '').endsWith('/m01/index.html'));
    assert.deepEqual(vazio.page.errors, []);
    await vazio.ctx.close();

    console.log('diagnóstico ok · blocos:', d.blocos.map((b) => `M${b.n}=${b.itens.length}`).join(' '), '· pontos em aberto:', d.abertos.length);
  } finally {
    if (browser) await browser.close();
    server.close();
  }
})().catch((e) => { console.error(e); process.exit(1); });
