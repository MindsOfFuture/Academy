/* LG2 · Módulo 2 (Turma A) · teste headless do módulo publicado em public/lg2/turma-a/m02.
   Execute: PW=<caminho do playwright> node tests/lg2-m02-turma-a.cjs
   Opcional: LG2_M02_URL=http://127.0.0.1:8812/ (servidor externo); LG2_SHOTS=<pasta> (prints 390x844).
   Cobre: todas as regras da aba 4 alcançadas pela interface (N de N), casos da aba 8
   (divergências são relatadas, não falham), instrumentos M2.I04/M2.I05 contra a "saída esperada"
   da aba 5 e persistência após recarregar. Imprime PASS/FAIL e sai com código != 0 se falhar. */
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const vm = require('node:vm');

const dir = path.resolve(__dirname, '..', 'public/lg2/turma-a/m02');
const ctx = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(dir, 'dados/modulo2.js'), 'utf8'), ctx);
const D = ctx.window.MODULO2;
const Motor = require(path.join(dir, 'js/motor.js'));
const M = Motor.montar(JSON.parse(JSON.stringify(D)));
const SHOTS = process.env.LG2_SHOTS || '';
const falhas = [];
const div = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };
const norm = (s) => String(s || '').replace(/\s+/g, ' ').trim();
const semAspas = (s) => norm(s).replace(/^["“]+|["”]+$/g, '');

let playwright;
try { playwright = require('playwright'); } catch { playwright = require(process.env.PW); }

/* ---------- estático ---------- */
const app = fs.readFileSync(path.join(dir, 'js/app.js'), 'utf8');
ok(/const CHAVE = "lg2-turma-a-m02";/.test(app), 'CHAVE deve ser lg2-turma-a-m02');
ok(D.modulo.turma === 'Turma de 18', 'Capa C7 deve ser Turma de 18 (Turma A)');
const nP = M.perguntas.length, nR = D.regras.length;
ok(nP === 21 && nR === 89, `contagens 21 perguntas / 89 regras (obtido ${nP}/${nR})`);
ok(!JSON.stringify(D).match(/\b\d{4,5}-?\d{4}\b/), 'nenhum telefone no dados/modulo2.js');

/* ---------- planejamento de caminhos (usa o próprio motor) ---------- */
const NUM = (cond) => {           // valor que satisfaz as faixas numéricas de uma pergunta
  if (/>=\s*1 e .*<=\s*4/.test(cond)) return '2';
  if (/>=\s*5/.test(cond)) return '6';
  if (/>\s*0/.test(cond)) return '3';
  return null;
};
function atomos(cond) {           // primeiro "ou"; dentro dele todos os "e"
  const parte = String(cond).split(/\s+ou\s+(?=M2\.P)/)[0];
  const out = {};
  for (const a of parte.split(/\s+e\s+(?=M2\.P)/)) {
    const m = a.trim().match(/^(M2\.P\d{2})\s*(<=|>=|=|<|>)\s*(.+)$/);
    if (!m) continue;
    const [, cod, op, alvo] = m;
    if (op === '=' && alvo.trim() === 'Preenchido') out[cod] = 'TEXTO';
    else if (op === '=') out[cod] = alvo.trim();
    else out[cod] = NUM(parte);
  }
  return out;
}
function comPreReq(alvo) {        // destrava a condição F de cada pergunta alvo
  const A = Object.assign({}, alvo);
  for (let k = 0; k < 5; k++) for (const cod of Object.keys(A)) {
    const q = M.porCodigo[cod];
    if (q && !/^sempre$/i.test(q.condicao)) for (const [c, v] of Object.entries(atomos(q.condicao))) if (!(c in A)) A[c] = v;
  }
  return A;
}
function padrao(q) {
  const t = Motor.campo(q);
  if (t === 'escolha') return q.opcoesLista[0];
  if (t === 'numero') return '3';
  return 'TEXTO';
}
function planejar(alvo) {         // sequência de [código, resposta] até o resultado
  const A = comPreReq(alvo), R = {}, seq = [];
  let cod = Motor.proxima(M, R, null);
  while (cod !== 'RESULTADO' && seq.length < 40) {
    const q = M.porCodigo[cod];
    const v = cod in A ? A[cod] : padrao(q);
    seq.push([cod, v]);
    R[cod] = v === 'Não sei' ? { estado: 'naosei' } : Motor.campo(q) === 'escolha' ? { estado: 'opcao', opcao: v }
      : { estado: 'valor', valor: v === 'TEXTO' ? 'Texto de teste' : v };
    cod = Motor.proxima(M, R, cod);
  }
  return seq;
}

/* ---------- servidor ---------- */
async function servidor() {
  if (process.env.LG2_M02_URL) return { url: process.env.LG2_M02_URL.replace(/\/?$/, '/'), close() {} };
  const tipos = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf' };
  const s = http.createServer((req, res) => {
    const f = path.resolve(dir, '.' + decodeURIComponent(req.url.split('?')[0]).replace(/\/$/, '/index.html'));
    if (!f.startsWith(dir)) return res.writeHead(403).end();
    fs.readFile(f, (e, b) => e ? res.writeHead(404).end() : res.writeHead(200, { 'Content-Type': tipos[path.extname(f)] || 'application/octet-stream' }).end(b));
  });
  await new Promise((r) => s.listen(0, '127.0.0.1', r));
  return { url: `http://127.0.0.1:${s.address().port}/`, close: () => s.close() };
}

(async () => {
  const srv = await servidor();
  const browser = await playwright.chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const erros = [];
  page.on('pageerror', (e) => erros.push(e.message));
  page.on('response', (r) => { if (r.status() >= 400) erros.push(r.url()); });
  const shot = async (nome) => { if (SHOTS) { await page.waitForTimeout(400); await page.screenshot({ path: path.join(SHOTS, `m02_${nome}.png`) }); } };
  const clicarTexto = (sel, t) => page.evaluate(([sel, t]) => {
    const b = [...document.querySelectorAll(sel)].find((x) => x.textContent.trim() === t);
    if (!b) return false; b.click(); return true;
  }, [sel, t]);
  const regrasNaTela = () => page.evaluate(() => [...document.querySelectorAll('.regra .r-texto')].map((x) => x.textContent));
  const porTexto = new Map(D.regras.map((r) => [norm(r.texto), r.codigo]));
  const alcancadas = new Set();

  async function inicio() {
    await page.goto(srv.url + 'index.html');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await clicarTexto('button', 'Começar');
  }
  async function responder(cod, v) {
    const q = M.porCodigo[cod];
    const t = Motor.campo(q);
    const passo = await page.locator('.passo').textContent();
    if (passo !== `Pergunta ${M.perguntas.indexOf(q) + 1} de ${nP}`) throw new Error(`esperava ${cod}, tela mostra "${passo}"`);
    if (norm(await page.locator('h2.q').textContent()) !== norm(q.pergunta)) throw new Error(`texto de ${cod} difere da planilha`);
    if (t === 'escolha') { if (!(await clicarTexto('#ent .opcao', v))) throw new Error(`opção "${v}" não existe em ${cod}`); await page.click('#ok'); }
    else if (v === 'Não sei') await page.click('#ns');
    else { await page.fill('#ent input, #ent textarea', v === 'TEXTO' ? 'Texto de teste' : v); await page.click('#ok'); }
    await page.waitForSelector('#retorno .retorno');
    for (const x of await regrasNaTela()) { const c = porTexto.get(norm(x)); if (c) alcancadas.add(c); }
  }
  async function percorrer(seq, aoResponder) {
    await inicio();
    for (const [cod, v] of seq) {
      await responder(cod, v);
      if (aoResponder) await aoResponder(cod, v);
      const fim = seq[seq.length - 1][0] === cod;
      await clicarTexto('#acoes .btn', fim ? 'Ver meu resumo' : 'Seguir');
    }
    await page.waitForSelector('.passo:text("Resultado")');
    for (const x of await regrasNaTela()) { const c = porTexto.get(norm(x)); if (c) alcancadas.add(c); }
  }

  try {
    /* 1) capa */
    await page.goto(srv.url + 'index.html');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await shot('inicio');
    ok((await page.locator('.rodape .credito').textContent()).includes(`versão ${D.modulo.versao}`), 'rodapé mostra a versão da planilha');

    /* 2) todas as regras da aba 4 */
    let caminhos = 0;
    for (const r of D.regras) {
      if (alcancadas.has(r.codigo)) continue;
      const seq = planejar(atomos(r.condicao));
      caminhos++;
      await percorrer(seq, caminhos === 1 ? null : null);
      if (!alcancadas.has(r.codigo)) falhas.push(`regra ${r.codigo} (${r.condicao}) não apareceu no caminho ${seq.map((s) => s.join('=')).join('; ')}`);
    }
    const inal = D.regras.filter((r) => !alcancadas.has(r.codigo)).map((r) => r.codigo);
    console.log(`Regras alcançadas pela interface: ${alcancadas.size} de ${nR} (${caminhos} caminhos)${inal.length ? ' · inalcançáveis: ' + inal.join(', ') : ''}`);

    /* 3) pergunta que mudou na v0.3 (próximo passo genérico da aba 3) + print */
    await inicio();
    await responder('M2.P01', 'Não sei');
    const prox = await page.locator('#retorno .b-proximo').allTextContents();
    ok(prox.some((t) => t.includes(M.porCodigo['M2.P01'].proximo)), 'P01 mostra o próximo passo da aba 3 (v0.3)');
    await page.locator('#retorno').scrollIntoViewIfNeeded();
    await shot('pergunta_v03');

    /* 4) casos de teste da aba 8 (o grupo valida; divergências não falham) */
    for (const c of D.casos) {
      const alvo = {};
      String(c.respostas).split(';').forEach((p) => { const m = p.trim().match(/^(M2\.P\d{2})\s*=\s*(.+)$/); if (m) alvo[m[1]] = m[2].trim(); });
      const seq = planejar(alvo);
      const destravadas = Object.keys(comPreReq(alvo)).filter((k) => !(k in alvo));
      /* regras disparadas só pelas respostas do próprio caso (para conferir os "Nenhum") */
      const Rc = {}; seq.forEach(([k, v]) => { const q = M.porCodigo[k]; Rc[k] = v === 'Não sei' ? { estado: 'naosei' } : Motor.campo(q) === 'escolha' ? { estado: 'opcao', opcao: v } : { estado: 'valor', valor: v === 'TEXTO' ? 'Texto de teste' : v }; });
      const doCaso = Motor.regrasTodas(M, Rc).filter((r) => (String(r.condicao).match(/M2\.P\d{2}/g) || []).every((k) => k in alvo));
      await percorrer(seq);
      const R = await page.evaluate(() => ({
        regras: [...document.querySelectorAll('.regra .r-texto')].map((x) => x.textContent),
        alertas: [...document.querySelectorAll('.bloco.b-alerta')].map((x) => x.textContent),
        prox: [...document.querySelectorAll('.bloco.b-proximo li')].map((x) => x.textContent),
        enc: [...document.querySelectorAll('.bloco.b-enc')].map((x) => x.textContent.replace(/^Quem procurar/, '')),
      }));
      const compoe = (esp, lista) => { const e = norm(esp); const usados = lista.map(norm).filter((t) => t && e.includes(t)); return usados.join(' ') === e; };
      const nada = (s) => /^Nenhum/i.test(norm(s));
      const ver = [
        ['texto', c.texto, R.regras, 'texto'],
        ['alerta', c.alerta, R.alertas, 'alerta'],
        ['próximo passo', c.proximo, R.prox, 'proximo'],
        ['encaminhamento', c.encaminhamento, R.enc, 'encaminhamento'],
      ];
      let bateu = 0;
      for (const [campo, esp, lista, chave] of ver) {
        if (vazioCaso(esp)) continue;
        const proprios = doCaso.map((r) => r[chave]).filter((x) => x && !/^Nenhum/i.test(norm(x)));
        const bate = nada(esp) ? proprios.length === 0 : compoe(esp, lista);
        if (bate) bateu++;
        else div.push(`${c.codigo} ${campo}: esperado "${norm(esp).slice(0, 90)}${norm(esp).length > 90 ? '…' : ''}"${nada(esp) ? ` mas as regras do caso (${doCaso.map((r) => r.codigo).join(', ')}) trazem: ${proprios.map((x) => '"' + norm(x).slice(0, 60) + '…"').join(' / ')}` : ' não aparece como texto de regra da aba 4 nesse caminho'}`);
      }
      console.log(`Caso ${c.codigo} (${c.tipo}): ${bateu}/4 campos esperados conferem; regras do caso: ${doCaso.map((r) => r.codigo).join(', ') || 'nenhuma'}${destravadas.length ? ` · destravado pela condição F: ${destravadas.map((k) => k + '=' + comPreReq(alvo)[k]).join(', ')}` : ''}`);
    }
    function vazioCaso(s) { return !norm(s); }

    /* 5) instrumentos contra a "saída esperada" da aba 5 */
    const i4 = D.instrumentos.lista.find((l) => l.codigo === 'M2.I04');
    const i5 = D.instrumentos.lista.find((l) => l.codigo === 'M2.I05');
    await page.goto(srv.url + 'index.html');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await clicarTexto('button', 'Instrumentos: roteiro, ficha, plano e quadro');
    for (const s of ['forte', 'forte', 'fraco', 'fraco', 'nenhum']) {   // aba 5, M2.I04, entrada: 2 forte, 2 fraco, 1 sem interesse
      await page.fill('#f-sit', `Pessoa ${s}`);
      await page.fill('#f-mot', 'preço');
      await clicarTexto('#f-sinal .opcao', s);
      await page.click('#f-ok');
    }
    /* regressão (Ana, 15/10): o placar muda ao salvar entrevistas e diz de onde vem a contagem */
    const placar = norm(await page.locator('.res-num .val').first().textContent());
    ok(placar === '2 · 2 · 1', `placar M2.I04 deveria ser "2 · 2 · 1" (obtido "${placar}")`);
    ok(/5 entrevista\(s\) salvas na ficha/.test(await page.locator('#quadro-origem').textContent()), 'nota de origem do placar ausente');
    const frase = norm(await page.locator('#frase').textContent());
    ok(frase === semAspas(i4.ex_saida), `M2.I04: "${frase}" ≠ saída esperada "${semAspas(i4.ex_saida)}"`);
    console.log(`M2.I04 obtido: ${frase}`);
    for (const [nome, notas] of [['Grupo B', [2, 1, 2]], ['Grupo A', [3, 3, 2]]]) {  // aba 5, M2.I05, entrada
      await page.fill('#g-nome', nome);
      await page.click('#g-ok');
      for (const [k, n] of [['alcancar', notas[0]], ['necessidade', notas[1]], ['pagar', notas[2]]]) {
        await page.evaluate(([nome, k, n]) => {
          const it = [...document.querySelectorAll('#grupos .item')].find((x) => x.querySelector('b').textContent === nome);
          it.querySelector(`.opcao[data-k="${k}"][data-n="${n}"]`).click();
        }, [nome, k, n]);
      }
    }
    /* regressão: tocar numa nota não joga a pessoa para o topo da página */
    await page.evaluate(() => document.querySelector('#grupos').scrollIntoView());
    const yAntes = await page.evaluate(() => window.scrollY);
    await page.evaluate(() => document.querySelector('#grupos .opcao[data-k="pagar"][data-n="2"]').click());
    const yDepois = await page.evaluate(() => window.scrollY);
    ok(yAntes > 300 && Math.abs(yDepois - yAntes) < 5, `rolagem deve ficar no lugar após tocar numa nota (antes ${yAntes}, depois ${yDepois})`);
    const tot = await page.evaluate(() => [...document.querySelectorAll('#grupos .item')].map((x) => `${x.querySelector('b').textContent} = ${x.querySelector('.etq') ? x.querySelector('.etq').textContent : '?'} pontos`));
    const esperado5 = (i5.ex_saida.match(/Grupo [A-Z] = \d+ pontos/g) || []);
    ok(JSON.stringify(tot) === JSON.stringify(esperado5), `M2.I05: ${tot.join('; ')} ≠ ${esperado5.join('; ')}`);
    console.log(`M2.I05 obtido: ${tot.join('; ')} (ordem do maior para o menor)`);
    if (!/Com as notas informadas/.test(await page.locator('#grupos').textContent())) div.push('M2.I05: a frase da saída esperada ("Com as notas informadas, o Grupo A merece ser testado primeiro…") não é exibida; o app mostra só os totais ordenados');
    await page.locator('#grupos').scrollIntoViewIfNeeded();
    await page.evaluate(() => document.querySelectorAll('.secao-titulo')[4].scrollIntoView());
    await shot('instrumentos');

    /* 6) persistência: instrumentos e respostas após recarregar */
    await page.reload();
    await clicarTexto('button', 'Instrumentos: roteiro, ficha, plano e quadro');
    ok((await page.locator('#fichas .cartao').count()) === 5, 'fichas persistem após recarregar');
    ok((await page.locator('#grupos .item').count()) === 2, 'grupos persistem após recarregar');
    await page.goto(srv.url + 'index.html');
    await clicarTexto('button', 'Começar');
    await responder('M2.P01', 'Em parte');
    await clicarTexto('#acoes .btn', 'Seguir');
    await page.fill('#ent textarea', 'Mães do bairro');
    await page.reload();
    await clicarTexto('button', 'Continuar de onde parei');
    ok((await page.locator('.passo').textContent()) === 'Pergunta 2 de 21', 'recarregar volta à pergunta em que parou');
    await page.click('#v');
    ok(await page.locator('#ent .opcao.sel').textContent() === 'Em parte', 'resposta anterior persiste após recarregar');
    ok(await page.evaluate(() => !!localStorage.getItem('lg2-turma-a-m02')), 'respostas gravadas na chave lg2-turma-a-m02');

    /* 7) resultado (caso T06 do grupo) para o print */
    const t06 = D.casos.find((c) => c.codigo === 'M2.T06');
    const alvo = {}; String(t06.respostas).split(';').forEach((p) => { const m = p.trim().match(/^(M2\.P\d{2})\s*=\s*(.+)$/); if (m) alvo[m[1]] = m[2].trim(); });
    await percorrer(planejar(alvo));
    await shot('resultado');
    ok(erros.length === 0, 'erros no navegador: ' + erros.join(' | '));
  } catch (e) {
    falhas.push('exceção: ' + (e.stack || e.message));
  } finally {
    await browser.close();
    srv.close();
  }
  console.log(`Casos da aba 8: ${D.casos.length} executados; divergências da planilha (não falham): ${div.length}`);
  div.forEach((d) => console.log('  DIVERGÊNCIA ' + d));
  if (falhas.length) { falhas.forEach((f) => console.log('  FALHA ' + f)); console.log(`FAIL (${falhas.length})`); process.exit(1); }
  console.log(`PASS: ${alcancadas.size} de ${nR} regras alcançadas; ${nP} perguntas literais; M2.I04 e M2.I05 conferem com a aba 5; persistência ok · ${D.modulo.versao} ${D.modulo.data}`);
})();
