/* LG2 · Etapa 2 (turma B) · quem JÁ VENDE não passa pelas conversas com possíveis clientes (lote 26/11, coordenação).
   Execute: PW=<caminho do playwright> node tests/lg2-m02-ja-vende.cjs
   Cobre: com a Etapa 1 em "Já vendo sempre", P04, P18, P19 e P21 não aparecem (caminho completo até o resumo, inclusive
   "Continuar de onde parei" com o histórico parado na P18), o resumo não fala de conversas, e as respostas antigas dessas
   perguntas continuam salvas. Com a Etapa 1 em "Ainda está só na minha cabeça", P04 = Sim abre a P18 como antes.
   Estático: a Etapa 10 e o diagnóstico da jornada ignoram essas respostas antigas de quem já vende.
   Sabotagem: M02V_SABOTAGEM=1 serve o app sem o bloqueio (o teste tem de falhar). */
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const vm = require('node:vm');

const dir = path.resolve(__dirname, '..', 'public/lg2/turma-b/m02');
const raiz = path.resolve(__dirname, '..', 'public/lg2');
const ctx = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(dir, 'dados/modulo2.js'), 'utf8'), ctx);
const D = ctx.window.MODULO2;
const BLOCO = ['M2.P04', 'M2.P18', 'M2.P19', 'M2.P21'];
const enun = Object.fromEntries(D.perguntas.map((p) => [p.codigo, p.pergunta]));
const falhas = [];
const ok = (c, m) => { if (!c) falhas.push(m); };
const norm = (s) => String(s || '').replace(/\s+/g, ' ').trim();
let playwright;
try { playwright = require('playwright'); } catch { playwright = require(process.env.PW); }

/* estático: consumidores fora da etapa */
const m10 = fs.readFileSync(path.join(raiz, 'turma-b/m10/js/app.js'), 'utf8');
ok(/const CONVERSAS_M2 = \["M2\.P04", "M2\.P18", "M2\.P19", "M2\.P21"\];/.test(m10) && /n === 2 \? CONVERSAS_M2/.test(m10), 'Etapa 10: lerR(2) tira as conversas de quem já vende');
const diag = fs.readFileSync(path.join(raiz, 'jornada/js/diagnostico.js'), 'utf8');
ok(BLOCO.every((c) => new RegExp(`'${c.replace('.', '\\.')}': 1`).test(diag)), 'diagnóstico: conversas da Etapa 2 fora para quem já vende');

async function servidor() {
  const tipos = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.ttf': 'font/ttf' };
  const s = http.createServer((req, res) => {
    const f = path.resolve(dir, '.' + decodeURIComponent(req.url.split('?')[0]).replace(/\/$/, '/index.html'));
    if (!f.startsWith(dir)) return res.writeHead(403).end();
    fs.readFile(f, (e, b) => {
      if (e) return res.writeHead(404).end();
      if (process.env.M02V_SABOTAGEM && f.endsWith(path.join('js', 'app.js'))) {
        const alvo = 'const M = Motor.montar(jaVende';
        if (!String(b).includes(alvo)) throw new Error('sabotagem: trecho não encontrado');
        b = String(b).replace(alvo, 'const M = Motor.montar(false');
      }
      res.writeHead(200, { 'Content-Type': tipos[path.extname(f)] || 'application/octet-stream' }).end(b);
    });
  });
  await new Promise((r) => s.listen(0, '127.0.0.1', r));
  return { url: `http://127.0.0.1:${s.address().port}/`, close: () => s.close() };
}

(async () => {
  const srv = await servidor();
  const browser = await playwright.chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const erros = [];
  page.on('pageerror', (e) => erros.push(e.message));
  const SHOTS = process.env.LG2_SHOTS || '';
  const clicar = (sel, t) => page.evaluate(([sel, t]) => { const b = [...document.querySelectorAll(sel)].find((x) => x.textContent.trim() === t); if (!b) return false; b.click(); return true; }, [sel, t]);
  const titulo = () => page.evaluate(() => { const h = document.querySelector('h2.q'); return h ? h.textContent.replace(/\s+/g, ' ').trim() : (document.querySelector('.passo') || {}).textContent || ''; });
  const M1 = (opcao) => JSON.stringify({ R: { 'M1.P01': { estado: 'opcao', opcao } } });
  async function abrir(m1, m2) {
    await page.goto(srv.url + 'index.html');
    await page.evaluate(([a, b]) => { localStorage.clear(); localStorage.setItem('lg2-turma-a-m01', a); if (b) localStorage.setItem('lg2-turma-b-m02', b); }, [m1, m2]);
    await page.reload();
  }
  /* responde cada tela com a 1ª opção real (ou a escolhida em `quer`) até o resumo; devolve os enunciados vistos */
  async function andar(quer = {}) {
    const vistos = [];
    for (let i = 0; i < 40; i++) {
      if (await page.locator('h2.q').count() === 0) break;
      const t = await titulo();
      vistos.push(t);
      const cod = Object.keys(enun).find((c) => norm(enun[c]) === t);
      const ops = await page.evaluate(() => [...document.querySelectorAll('#ent .opcao')].map((b) => (b.querySelector('.op-txt b') || b).textContent.trim()));
      if (ops.length) {
        const alvo = (cod && quer[cod]) || ops.find((o) => !/^(Não sei|Outra|Outro)/.test(o));
        await clicar('#ent .opcao', alvo);
      } else {
        const tipo = await page.evaluate(() => { const e = document.querySelector('#ent input, #ent textarea'); return e ? (e.getAttribute('inputmode') || e.type || '') : ''; });
        await page.fill('#ent input, #ent textarea', /numeric|decimal|number/.test(tipo) || (cod && quer[cod]) ? String((cod && quer[cod]) || '6') : 'Texto de teste');
      }
      await page.waitForTimeout(150);
      for (let k = 0; k < 3; k++) {
        await page.evaluate(() => { const b = document.querySelector('#acoes .btn'); if (b) b.click(); });
        await page.waitForTimeout(250);
        if (await titulo() !== t) break;
      }
      if (await titulo() === t) throw new Error(`travou em "${t}": ${norm(await page.locator('#tela').innerText()).slice(0, 200)}`);
    }
    return vistos;
  }
  try {
    /* A) quem já vende, do zero: nenhuma pergunta do bloco */
    await abrir(M1('Já vendo sempre'));
    await clicar('button', 'Começar');
    const vA = await andar();
    const doBloco = vA.filter((t) => BLOCO.some((c) => norm(enun[c]) === t));
    ok(doBloco.length === 0, `quem já vende viu pergunta das conversas: ${doBloco.join(' | ')}`);
    ok(await page.locator('.passo:text("Resultado")').count() === 1, 'quem já vende chega ao resumo');
    const res = norm(await page.locator('#tela').innerText());
    ok(!/conversou com (\d+ pessoas?|possíveis clientes)|ainda não conversou/i.test(res), 'resumo de quem já vende não fala das conversas com possíveis clientes');
    ok(!/Com quantas pessoas desse público|Alguma delas já pediu orçamento|contaram um problema de verdade ou só elogiaram/i.test(res), 'Ver suas respostas sem as perguntas do bloco');
    if (SHOTS) await page.screenshot({ path: path.join(SHOTS, 'm02v_resultado_vende.png'), fullPage: false });

    /* B) quem já vende com respostas antigas e o histórico parado na P18: não reabre a P18 e nada se perde */
    const antigo = { v: 6, R: { 'M2.P02': { estado: 'valor', valor: 'Mães do bairro' }, 'M2.P04': { estado: 'opcao', opcao: 'Sim' }, 'M2.P18': { estado: 'valor', valor: '6' },
      'M2.P19': { estado: 'opcao', opcao: 'Sim' }, 'M2.P21': { estado: 'opcao', opcao: 'Contaram um problema de verdade' } }, hist: ['M2.P02', 'M2.P22', 'M2.P23', 'M2.P24', 'M2.P03', 'M2.P04', 'M2.P05', 'M2.P07', 'M2.P08', 'M2.P13', 'M2.P17', 'M2.P18'], fichas: [], plano: { meta: '', prazo: '', feitos: [] }, grupos: [] };
    await abrir(M1('Já vendi algumas vezes'), JSON.stringify(antigo));
    await clicar('button', 'Continuar de onde parei');
    await page.waitForTimeout(300);
    const tB = await titulo();
    ok(!BLOCO.some((c) => norm(enun[c]) === tB), `"Continuar de onde parei" reabriu pergunta das conversas: ${tB}`);
    if (SHOTS) await page.screenshot({ path: path.join(SHOTS, 'm02v_continuar_vende.png') });
    const vB = await andar();
    ok(!vB.some((t) => BLOCO.some((c) => norm(enun[c]) === t)), `com respostas antigas, quem já vende viu o bloco: ${vB.join(' | ')}`);
    const salvo = await page.evaluate(() => JSON.parse(localStorage.getItem('lg2-turma-b-m02')).R);
    ok(BLOCO.every((c) => JSON.stringify(salvo[c]) === JSON.stringify(antigo.R[c])), `respostas antigas do bloco deviam continuar salvas (obtido ${JSON.stringify(BLOCO.map((c) => salvo[c]))})`);

    /* C) quem ainda não vende: P04 = Sim abre a P18 como antes */
    await abrir(M1('Ainda está só na minha cabeça'));
    await clicar('button', 'Começar');
    const vC = await andar({ 'M2.P04': 'Sim' });
    ok(vC.includes(norm(enun['M2.P04'])) && vC.includes(norm(enun['M2.P18'])), `quem ainda não vende devia ver P04 e P18 (viu ${vC.length} telas)`);
    ok(erros.length === 0, 'erros no navegador: ' + erros.join(' | '));
  } catch (e) {
    falhas.push('exceção: ' + (e.stack || e.message));
  } finally {
    await browser.close();
    srv.close();
  }
  if (falhas.length) { falhas.forEach((f) => console.log('  FALHA ' + f)); console.log(`FAIL (${falhas.length})`); process.exit(1); }
  console.log('PASS: quem já vende não vê P04/P18/P19/P21 (do zero e ao continuar), respostas antigas salvas; quem não vende vê como antes; Etapa 10 e diagnóstico filtram');
})();
