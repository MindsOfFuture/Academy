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
  assert.equal(nrm(await page.textContent('.heroi-txt p')), nrm(D.mapa.objetivo));
  await btn('Começar').click();

  /* perguntas até o resultado */
  const resp = { 'M8.P02': 'Serviço', 'M8.P03': 'Minha casa', 'M8.P05': 'Não', 'M8.P07': 'Sim', 'M8.P08': 'Não', 'M8.P09': 'Não sei', 'M8.P10': null };
  const vistas = [];
  for (let i = 0; i < 20; i++) {
    const cod = await atual();
    if (cod === 'RESULTADO') break;
    assert.ok(cod && P[cod], 'pergunta desconhecida');
    vistas.push(cod);
    const q = P[cod];
    await layout(cod);
    assert.equal(await page.locator('.cartao-q .q').count(), 1, `${cod}: cartão da pergunta`);
    assert.equal(nrm(await page.textContent('.cartao-q .q')), nrm(q.pergunta), `${cod}: pergunta literal`);
    assert.equal(nrm(await page.textContent('.dica .ajuda')), nrm(q.ajuda), `${cod}: ajuda literal aberta`);
    assert.equal(await page.locator('.heroi .barra-fill').count(), 1, `${cod}: barra de progresso na faixa`);
    assert.equal(await page.locator('.etapas').count(), 0, `${cod}: sem stepper (módulo sem seções)`);
    const ops = await page.$$eval('#ent .opcao', (x) => x.map((e) => e.textContent.trim()));
    if (ops.length) {
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
  assert.equal(nrm(await page.textContent('.heroi-tit')), 'Resumo da sua formalização');
  assert.equal(nrm(await page.textContent('.concluido h2')), 'Você concluiu o Módulo 8');
  assert.equal(await page.locator('.concluido .check').count(), 1);
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

  assert.deepEqual(errs, [], 'sem pageerror');
  assert.deepEqual(faltou.filter((u) => /\/lg2\/turma-b\/m08\//.test(u)), [], 'sem arquivo faltando');
  console.log(`PASS: M08 layout novo (capa, ${vistas.length} perguntas literais, resultado, retomada, Anexo, zero pageerror)`);
  await b.close(); server.close();
})().catch((e) => { console.error('FAIL', e); process.exit(1); });
