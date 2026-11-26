/* Teste de navegação do LG2 M04 (Turma A) no navegador headless.
   Execute: PW=<caminho do pacote playwright> node tests/lg2-m04-turma-a.cjs
   Opcional: SHOTS=<pasta> grava os prints de celular (390x844). Sai com código 1 se algo falhar. */
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.PW || 'playwright');

const DIR = path.resolve(__dirname, '../public/lg2/turma-a/m04');
const TIPOS = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf' };
/* SABOTAGEM=1 tira a caixa "Como descobrir" do app servido (o teste tem de acusar) */
const SABOTAGEM = process.env.SABOTAGEM === '1';
/* SABOTAGEM=2 faz o botão "Não sei" gravar {estado:"naosei"} (o teste tem de acusar: "Não sei" não pode gravar) */
const SABOTAGEM2 = process.env.SABOTAGEM === '2';
/* SABOTAGEM=3 põe de volta o passo extra (Continuar mostra o retorno e troca por "Seguir" + "Corrigir minha resposta") */
const SABOTAGEM3 = process.env.SABOTAGEM === '3';
/* SABOTAGEM=4 tira a área de ações presa ao pé da tela (o Continuar some em tela pequena) */
const SABOTAGEM4 = process.env.SABOTAGEM === '4';
/* SABOTAGEM=5 desfaz o lote 17/11 (auditoria): sem rascunho na pergunta 12 e sem a lembrança da Etapa 3 nas perguntas 9 e 10 */
const SABOTAGEM5 = process.env.SABOTAGEM === '5';
/* SABOTAGEM=6 mostra a lembrança da Etapa 3 mesmo sem resposta lá (o teste tem de acusar) */
const SABOTAGEM6 = process.env.SABOTAGEM === '6';
/* SABOTAGEM=7 desliga a regra do lote 26/11 (quem já vende não passa pelo bloco do teste da primeira oferta) */
const SABOTAGEM7 = process.env.SABOTAGEM === '7';
const servidor = http.createServer((req, res) => {
  const f = path.join(DIR, decodeURIComponent(req.url.split('?')[0]).replace(/\/$/, '/index.html'));
  if (!f.startsWith(DIR) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': TIPOS[path.extname(f)] || 'application/octet-stream' });
  if (SABOTAGEM && f.endsWith(path.join('js', 'app.js'))) return res.end(fs.readFileSync(f, 'utf8').replace('function caixaComo(q) {', 'function caixaComo(q) { return "";'));
  if (SABOTAGEM2 && f.endsWith(path.join('js', 'app.js'))) return res.end(fs.readFileSync(f, 'utf8').replace('if (ns) ns.onclick = () => { p.querySelector("#erro").hidden = true;', 'if (ns) ns.onclick = () => { S.R[cod] = { estado: "naosei" }; salvar();'));
  if (SABOTAGEM3 && f.endsWith(path.join('js', 'app.js'))) return res.end(fs.readFileSync(f, 'utf8').replace('const prox = seguinte(cod);\n      if (prox === "RESULTADO")',
    'const prox = seguinte(cod); { const ac = p.querySelector("#acoes"); ac.innerHTML = ""; const b = document.createElement("button"); b.className = "btn btn-primario"; b.textContent = "Seguir"; b.onclick = () => { if (prox === "RESULTADO") { S.hist.push("RESULTADO"); salvar(); ir(telaResultado); } else ir(telaPergunta, prox); }; ac.appendChild(b); const c = document.createElement("button"); c.className = "btn btn-claro"; c.textContent = "Corrigir minha resposta"; c.onclick = () => ir(telaPergunta, cod); ac.appendChild(c); return; }\n      if (prox === "RESULTADO")'));
  if (SABOTAGEM5 && f.endsWith(path.join('js', 'app.js'))) return res.end(fs.readFileSync(f, 'utf8').replace('if (cod === "M4.P12") { const r = rascunhoP12();', 'if (false) { const r = rascunhoP12();').replace('function refEtapa3(cod, atual) {', 'function refEtapa3(cod, atual) { return "";'));
  if (SABOTAGEM6 && f.endsWith(path.join('js', 'app.js'))) return res.end(fs.readFileSync(f, 'utf8').replace('if (!v || v === String(atual || "").trim()) return "";', 'if (v && v === String(atual || "").trim()) return "";'));
  if (SABOTAGEM7 && f.endsWith(path.join('js', 'app.js'))) return res.end(fs.readFileSync(f, 'utf8').replace('const jaVende = () => /vend/i.test(opcaoDe(lerOutro(M1, "M1.P01")));', 'const jaVende = () => false;'));
  if (SABOTAGEM4 && f.endsWith(path.join('css', 'estilo.css'))) return res.end(fs.readFileSync(f, 'utf8').replace('.corpo>.acoes-fixas{position:sticky;bottom:0;', '.corpo>.acoes-fixas{'));
  fs.createReadStream(f).pipe(res);
});
/* versão leve: maior número de palavras visto em cada tela de pergunta (antes de tocar) */
const PALAVRAS = {};
const LIMITE_PALAVRAS = 60;

let falhas = 0;
function check(nome, ok, extra) {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${nome}${!ok && extra !== undefined ? ' :: ' + JSON.stringify(extra).slice(0, 300) : ''}`);
  if (!ok) falhas++;
}

/* funções que rodam dentro da página */
const NA_PAGINA = {
  atual: () => {
    const c = document.querySelector('.cartao-q[data-cod]');
    if (c) return c.dataset.cod;
    const t = document.querySelector('.passo');
    return t && /Resultado/.test(t.textContent) ? 'RESULTADO' : null;
  },
  /* lote 17/11: marca/escreve a resposta SEM tocar em Continuar (o retorno aparece ao vivo); campo = sai do campo */
  preparar: (v) => {
    const opc = [...document.querySelectorAll('.opcao')];
    if (opc.length) {
      const rot = (x) => x.dataset.op || (x.querySelector('.op-txt b') || x).textContent.trim();
      const b = opc.find((x) => rot(x) === v);
      if (!b) return 'opcao inexistente: ' + v + ' em ' + opc.map(rot).join('|');
      if (!(b.classList.contains('sel') && b.closest('.multipla'))) b.click();
    } else {
      const i = document.querySelector('#ent input, #ent textarea');
      i.value = v; i.dispatchEvent(new Event('input', { bubbles: true })); i.dispatchEvent(new Event('change', { bubbles: true }));
    }
    return '';
  },
  /* botão de passo extra (não pode existir mais) */
  extra: () => [...document.querySelectorAll('button')].map((x) => x.textContent.trim()).filter((t) => /^(Seguir|Corrigir minha resposta)$/.test(t)).join('|'),
  /* D: escolha única e múltipla dizem se estão marcadas (aria-pressed igual à marca visível) */
  aria: () => [...document.querySelectorAll('#ent .opcao')].filter((x) => x.getAttribute('aria-pressed') !== (x.classList.contains('sel') ? 'true' : 'false')).map((x) => x.dataset.op),
  /* G: contador e barra */
  contador: () => { const k = (document.querySelector('.passo') || {}).textContent || ''; const m = k.match(/Pergunta (\d+) de (\d+)/); const b = document.querySelector('[role=progressbar]'); return m ? { n: +m[1], de: +m[2], barra: b ? +b.getAttribute('aria-valuenow') : -1 } : null; },
  responder: (v) => {
    const opc = [...document.querySelectorAll('.opcao')];
    if (v === 'NS' && document.querySelector('#ns')) document.querySelector('#ns').click();
    else if (opc.length) {
      const alvo = v === 'NS' ? 'Não sei' : v;
      const rot = (x) => x.dataset.op || (x.querySelector('.op-txt b') || x).textContent.trim();   // valor gravado (a tela mostra "Mercadoria + Serviço")
      const b = opc.find((x) => rot(x) === alvo);
      if (!b) return 'opcao inexistente: ' + alvo + ' em ' + opc.map(rot).join('|');
      b.click(); document.querySelector('#ok').click();
    } else {
      document.querySelector('#ent input, #ent textarea').value = v;
      document.querySelector('#ok').click();
    }
    return '';
  },
};
/* lote 17/11 (item A): um toque por pergunta. Onde antes havia "Seguir", agora só se confere que nenhum passo extra apareceu */
const A17 = { extras: [], semAvanco: [], aria: [], foco: [], contador: [], retornoVivo: 0, palavrasModulo: [] };

async function caminho(page, respostas, outros, opts) {
  const TOTAL_ESPERADO = (opts && opts.de) || 21;   // lote 26/11: quem já vende tem um caminho de 12 perguntas
  /* começa do zero, responde cada pergunta pelo mapa (código -> valor) ou com um valor neutro;
     outros = estado de outros módulos semeado no localStorage ({ chave: estado }) */
  await page.evaluate((o) => { localStorage.clear(); Object.entries(o || {}).forEach(([k, v]) => localStorage.setItem(k, JSON.stringify(v))); }, outros);
  await page.reload();
  await page.click('#ir');
  const visitadas = [], telas = {}, rafael = [];
  let ultimo = null;
  for (let i = 0; i < 40; i++) {
    const cod = await page.evaluate(NA_PAGINA.atual);
    if (cod === 'RESULTADO') break;
    visitadas.push(cod);
    const q = await page.evaluate((c) => {
      const p = window.MODULO4.perguntas.find((x) => x.codigo === c);
      return { tipo: p.tipo, opcoes: [...document.querySelectorAll('.opcao')].map((x) => x.dataset.op || (x.querySelector('.op-txt b') || x).textContent.trim()), pergunta: document.querySelector('.q').textContent.replace(/^\s+|\s+$/g, '') };
    }, cod);
    let v = respostas[cod];
    const neutro = q.opcoes.length ? q.opcoes.find((o) => o !== 'Não sei') : /N[uú]mero/.test(q.tipo) ? '5' : 'Resposta de teste';
    if (v === undefined) v = neutro;
    /* versão leve: o que a tela mostra antes de tocar em nada */
    const antes = await page.evaluate(() => ({
      palavras: (() => { const n = (t) => t.split(/\s+/).filter((w) => /[A-Za-zÀ-ÿ0-9]/.test(w)).length; return n(document.querySelector('#tela').innerText) - [...document.querySelectorAll('.p-linha-integrada, .p-fontes summary, .op-sub, .reuso')].reduce((a, e) => a + n(e.innerText), 0); })(),
      dica: [...document.querySelectorAll('details.dica-toggle')].map((d) => d.open),
      valor0: (document.querySelector('#ent textarea, #ent input') || {}).value || '',
      ref3: (document.querySelector('#ref-etapa') || {}).textContent || '',
      ph: (document.querySelector('#ent textarea, #ent input') || {}).placeholder || '',
    }));
    const temNS = await page.evaluate(() => !!document.querySelector('#ns') || [...document.querySelectorAll('.opcao')].some((x) => x.dataset.op === 'Não sei'));
    /* lote 16/11: "Não sei" mostra a ajuda, não grava e não deixa seguir; depois a pessoa responde de verdade */
    let ns = null;
    if (v === 'NS' && temNS) {
      const antesNS = await page.evaluate(() => localStorage.getItem('lg2-turma-a-m04'));
      await page.evaluate(() => { const b = document.querySelector('#ns'); if (b) b.click(); else [...document.querySelectorAll('.opcao')].find((x) => x.dataset.op === 'Não sei').click(); document.querySelector('#ok').click(); });
      ns = await page.evaluate(([a, c]) => ({ igual: localStorage.getItem('lg2-turma-a-m04') === a, erro: document.querySelector('#erro').hidden ? '' : document.querySelector('#erro').textContent, alerta: document.querySelector('#erro').getAttribute('role') === 'alert', seguir: ((document.querySelector('.cartao-q[data-cod]') || {}).dataset || {}).cod !== c }), [antesNS, cod]);
      ns.mesma = (await page.evaluate(NA_PAGINA.atual)) === cod;
    }
    if (v === 'NS') v = neutro;
    const corpoNS = ns ? await page.evaluate(() => document.body.innerText) : null;
    const todoNS = ns ? await page.evaluate(() => document.querySelector('#tela').textContent.replace(/\s+/g, ' ')) : null;
    const comoNS = ns ? await page.evaluate((c) => { const cx = document.querySelector('#tela .como-descobrir'); return { n: document.querySelectorAll('.como-descobrir').length, passos: cx ? [...cx.querySelectorAll('ol > li')].map((li) => li.textContent.trim()) : [], copiar: !!(cx && cx.querySelector('[data-copiar]')), prompt: cx && cx.querySelector('[data-prompt]') ? cx.querySelector('[data-prompt]').textContent : '', salvo: (JSON.parse(localStorage.getItem('lg2-turma-a-m04')).R || {})[c] || null }; }, cod) : null;
    const k = await page.evaluate(NA_PAGINA.contador);
    if (!k || k.de !== TOTAL_ESPERADO || (ultimo && (k.n < ultimo.n || k.barra < ultimo.barra))) A17.contador.push({ cod, k, ultimo });
    ultimo = k;
    const e = await page.evaluate(NA_PAGINA.preparar, v);
    if (e) throw new Error(cod + ': ' + e);
    /* o retorno (texto que depende da resposta) já está na tela, antes do Continuar */
    if (await page.evaluate(() => !!document.querySelector('#retorno .retorno'))) A17.retornoVivo++;
    const ar = await page.evaluate(NA_PAGINA.aria);
    if (ar.length) A17.aria.push({ cod, ar });
    const corpo = corpoNS || await page.evaluate(() => document.body.innerText);
    const todo = todoNS || await page.evaluate(() => document.querySelector('#tela').textContent.replace(/\s+/g, ' '));   // inclui o que está em "Ver mais"
    /* caixa "Como descobrir" (no "Não sei", antes de responder) e a resposta gravada */
    const como = comoNS || await page.evaluate((c) => {
      const cx = document.querySelector('#tela .como-descobrir');
      return { n: document.querySelectorAll('.como-descobrir').length, passos: cx ? [...cx.querySelectorAll('ol > li')].map((li) => li.textContent.trim()) : [], copiar: !!(cx && cx.querySelector('[data-copiar]')), prompt: cx && cx.querySelector('[data-prompt]') ? cx.querySelector('[data-prompt]').textContent : '',
        salvo: (JSON.parse(localStorage.getItem('lg2-turma-a-m04')).R || {})[c] || null };
    }, cod);
    telas[cod] = { ...q, corpo, todo, ...antes, como, ns, temNS, alertas: await page.evaluate(() => [...document.querySelectorAll('#retorno .b-alerta')].map((x) => x.textContent.replace(/\\s+/g, ' ').trim())), depois: await page.evaluate(() => document.body.innerText) };
    PALAVRAS[cod] = Math.max(PALAVRAS[cod] || 0, antes.palavras);
    if (/rafael/i.test(corpo)) rafael.push(cod);
    if (/m[óo]dulo/i.test(telas[cod].depois)) A17.palavrasModulo.push(cod);
    /* UM toque em Continuar: grava e já abre a próxima pergunta */
    await page.evaluate(() => document.querySelector('#ok').click());
    const ex = await page.evaluate(NA_PAGINA.extra);
    if (ex) A17.extras.push(cod + ': ' + ex);
    const depois = await page.evaluate(NA_PAGINA.atual);
    /* fica na mesma tela só quando deve: "Outro" sem texto ou aviso de valor fora do comum ("Continuar mesmo assim") */
    if (depois === cod) { telas[cod].bloqueado = true; if (!(respostas[cod] === 'Outro') && !(await page.evaluate(() => !!document.querySelector('#erro.aviso-num:not([hidden])')))) A17.semAvanco.push(cod); break; }
    if (depois !== 'RESULTADO' && !(await page.evaluate(() => document.activeElement === document.querySelector('.cartao-q .q')))) A17.foco.push(cod);
  }
  const final = await page.evaluate(() => document.body.innerText);
  const finalTodo = await page.evaluate(() => document.querySelector('#tela').textContent);   // inclui a lista recolhida
  if (/rafael/i.test(finalTodo)) rafael.push('RESULTADO');
  if (/m[óo]dulo/i.test(final)) A17.palavrasModulo.push('RESULTADO');
  return { visitadas, telas, final, finalTodo, rafael };
}

(async () => {
  await new Promise((r) => servidor.listen(0, '127.0.0.1', r));
  const URL = `http://127.0.0.1:${servidor.address().port}/index.html`;
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  const errosJS = [];
  page.on('pageerror', (e) => errosJS.push(e.message));
  await page.goto(URL);
  const D = await page.evaluate(() => window.MODULO4);
  const semPassoExtra = async () => { const ex = await page.evaluate(NA_PAGINA.extra); if (ex) A17.extras.push('fora do caminho: ' + ex); return !ex; };
  const P = Object.fromEntries(D.perguntas.filter((p) => p.codigo).map((p) => [p.codigo, p]));

  check('24 perguntas carregadas (21 do grupo + 3 da proposta de valor)', Object.keys(P).length === 24, Object.keys(P).length);
  check('tela inicial com botão Começar', (await page.textContent('#ir')).includes('Começar'));

  /* ---- P01: não avança sem a frase ---- */
  await page.click('#ir');
  await page.evaluate(() => document.querySelector('#ok').click());
  check('P01 vazio mostra erro e não avança', await page.evaluate(() => !document.querySelector('#erro').hidden) && (await page.evaluate(NA_PAGINA.atual)) === 'M4.P01');
  const antesP01 = await page.evaluate(() => localStorage.getItem('lg2-turma-a-m04'));
  await page.evaluate(NA_PAGINA.responder, 'NS');
  let txt = await page.evaluate(() => document.body.innerText);
  check('P01 "Não sei" mostra o alerta do grupo', txt.includes(P['M4.P01'].alerta_naosei));
  check('P01 "Não sei" mostra a regra M4.R02', txt.includes(D.regras.find((r) => r.codigo === 'M4.R02').texto));
  check('P01 "Não sei" não avança e não abre passo extra', (await semPassoExtra()) && (await page.evaluate(NA_PAGINA.atual)) === 'M4.P01');
  check('P01 "Não sei" não é gravado como resposta (estado salvo igual)', await page.evaluate((a) => localStorage.getItem('lg2-turma-a-m04') === a && !(JSON.parse(a).R['M4.P01']), antesP01));
  await page.evaluate(() => document.querySelector('#ok').click());
  check('P01 "Não sei" + Continuar com o campo vazio: pede a resposta e não avança', await page.evaluate(() => document.querySelector('#erro').textContent === 'Use a ajuda acima e escreva a sua resposta para continuar.' && !document.querySelector('#erro').hidden) && (await page.evaluate(NA_PAGINA.atual)) === 'M4.P01' && await page.evaluate((a) => localStorage.getItem('lg2-turma-a-m04') === a, antesP01));
  {
    const cx = await page.evaluate(() => { const c = document.querySelector('#como .como-descobrir'); return c && { passos: [...c.querySelectorAll('ol > li')].map((x) => x.textContent.trim()), copiar: !!c.querySelector('button[data-copiar]'), prompt: c.querySelector('[data-prompt]').textContent, nota: c.innerText }; });
    check('leve: P01 "Não sei" abre "Como descobrir" com 2 passos escritos e o pedido para a IA com Copiar', !!cx && cx.passos.length === 2 && cx.passos.every((x) => x.length > 30) && cx.copiar && /\[o que você sabe fazer\]/.test(cx.prompt) && /Copie, cole numa IA de sua preferência e troque o que está entre colchetes\./.test(cx.nota) && !/ChatGPT|Gemini|Copilot|Claude/i.test(cx.nota), cx);
    const bt = await page.evaluate(() => { const b = document.querySelector('#como [data-copiar]'); if (!b) return 'sem botão Copiar'; b.click(); return new Promise((r) => setTimeout(() => r(b.textContent), 300)); });
    check('leve: Copiar responde (copiado ou texto selecionado para copiar)', /Copiado!|Toque e segure/.test(bt), bt);
  }
  /* A (17/11): o retorno do campo aparece ao vivo, ~700 ms depois de parar de digitar (sem sair do campo e sem Continuar) */
  await page.fill('#ent textarea', '');
  await page.locator('#ent textarea').pressSequentially('Bolo de pote para lanche escolar', { delay: 5 });
  const r01 = D.regras.find((r) => r.codigo === 'M4.R01').texto;
  const vivo0 = await page.evaluate(() => document.querySelector('#retorno').innerText);
  await page.waitForTimeout(900);
  const vivo1 = await page.evaluate(() => ({ t: document.querySelector('#retorno').innerText, foco: document.activeElement === document.querySelector('#ent textarea'), cod: document.querySelector('.cartao-q').dataset.cod }));
  check('A: campo de texto — o retorno (regra M4.R01) aparece ao vivo ~700 ms depois de parar de digitar, antes do Continuar', !vivo0.includes(r01) && vivo1.t.includes(r01) && vivo1.foco && vivo1.cod === 'M4.P01', { vivo0, vivo1 });
  await page.evaluate(() => document.querySelector('#ok').click());
  check('A: P01 com frase avança com UM toque em Continuar, sem "Seguir" nem "Corrigir minha resposta"', (await page.evaluate(NA_PAGINA.atual)) === 'M4.P02' && (await page.evaluate(NA_PAGINA.extra)) === '');
  check('D: depois de Continuar, o foco vai para o enunciado da pergunta nova', await page.evaluate(() => document.activeElement === document.querySelector('.cartao-q .q') && document.activeElement.getAttribute('tabindex') === '-1'));
  check('P02 aparece depois de P01', (await page.evaluate(NA_PAGINA.atual)) === 'M4.P02');
  {
    /* D (17/11): escolha única diz qual está marcada; A: retorno de escolha aparece no toque */
    const antes = await page.evaluate(() => [...document.querySelectorAll('#ent .opcao')].map((x) => x.getAttribute('aria-pressed')));
    await page.evaluate(() => [...document.querySelectorAll('#ent .opcao')].find((x) => x.dataset.op === 'Serviço').click());
    const depois = await page.evaluate(() => [...document.querySelectorAll('#ent .opcao')].map((x) => [x.dataset.op, x.getAttribute('aria-pressed')]));
    await page.evaluate(() => [...document.querySelectorAll('#ent .opcao')].find((x) => x.dataset.op === 'Produto').click());
    const depois2 = await page.evaluate(() => [...document.querySelectorAll('#ent .opcao')].map((x) => [x.dataset.op, x.getAttribute('aria-pressed')]));
    check('D: escolha única com aria-pressed: "true" só na tocada, "false" nas outras (e troca no toque)', antes.every((x) => x === 'false') && depois.every(([o, a]) => a === (o === 'Serviço' ? 'true' : 'false')) && depois2.every(([o, a]) => a === (o === 'Produto' ? 'true' : 'false')), { antes, depois, depois2 });
    check('B: Continuar sempre ativo (nunca disabled)', await page.evaluate(() => !document.querySelector('#ok').disabled && !document.querySelector('#ok[disabled], #ok[aria-disabled=true]')));
  }
  const ops2 = await page.evaluate(() => [...document.querySelectorAll('.opcao')].map((x) => x.dataset.op));
  check('P02 tem 6 opções, sem opção vazia', JSON.stringify(ops2) === JSON.stringify(['Produto', 'Serviço', 'Mercadoria', 'Mercadoria+ Serviço', 'Produto+ Serviço', 'Mercadoria+Produto']), ops2);
  const rot2 = await page.evaluate(() => [...document.querySelectorAll('.opcao .op-txt b')].map((x) => x.textContent.trim()));
  check('L5-6: P02 mostra as combinações com espaço dos dois lados do "+"', JSON.stringify(rot2.slice(3)) === JSON.stringify(['Mercadoria + Serviço', 'Produto + Serviço', 'Mercadoria + Produto']), rot2);
  check('P02 mostra a legenda curta de produto, serviço e mercadoria logo após a pergunta', await page.evaluate(() => { const d = document.querySelector('.q').nextElementSibling; return !!d && d.classList.contains('destaque') && d.textContent.startsWith('Produto: você mesmo faz') && /Serviço: /.test(d.textContent) && /Mercadoria: /.test(d.textContent); }));

  /* ---- todos os ramos de P02 ---- */
  const RAMO = {
    'Produto': ['M4.P03', 'M4.P04', 'M4.P05'],
    'Serviço': ['M4.P06'],
    'Mercadoria': ['M4.P03'],
    'Mercadoria+ Serviço': ['M4.P03', 'M4.P06'],
    'Produto+ Serviço': ['M4.P03', 'M4.P04', 'M4.P05', 'M4.P06'],
    'Mercadoria+Produto': ['M4.P03', 'M4.P04', 'M4.P05'],
  };
  const SERV = ['Serviço', 'Mercadoria+ Serviço', 'Produto+ Serviço'];
  const PROD_P14 = ['Mostrar uma amostra sem cobrar', 'Vender pouca quantidade, já com preço', 'Aceitar encomenda ou reserva antes de fazer'];
  const SERV_P14 = ['Atender poucos clientes, já cobrando', 'Aceitar agendamento ou reserva antes de atender'];
  const RAMIFICADAS = ['M4.P03', 'M4.P04', 'M4.P05', 'M4.P06'];
  let rafael = [];
  let TIPICO = 0;   // perguntas do caminho mais comum (produto, 2 versões, venda com preço)
  for (const [op, esperadas] of Object.entries(RAMO)) {
    const c = await caminho(page, { 'M4.P02': op, 'M4.P05': '2', 'M4.P14': SERV.includes(op) ? 'Atender poucos clientes, já cobrando' : 'Vender pouca quantidade, já com preço' });
    if (op === 'Produto') TIPICO = c.visitadas.length;
    rafael = rafael.concat(c.rafael);
    const vistas = c.visitadas.filter((x) => RAMIFICADAS.includes(x));
    check(`P02="${op}" -> ${esperadas.join(', ')}`, JSON.stringify(vistas) === JSON.stringify(esperadas), c.visitadas);
    const t14 = c.telas['M4.P14'];
    if (SERV.includes(op)) check(`P02="${op}" -> P14 versão serviço, 2 opções`, t14.pergunta === P['M4.P14'].variantes[0].pergunta && JSON.stringify(t14.opcoes) === JSON.stringify(SERV_P14), t14);
    else check(`P02="${op}" -> P14 original, 3 opções (sem "Não sei")`, t14.pergunta === P['M4.P14'].pergunta && JSON.stringify(t14.opcoes) === JSON.stringify(PROD_P14), t14);
    check(`P02="${op}" chega ao resultado`, /Resumo das suas respostas/.test(c.final));
    /* versão leve: "Ver dica" existe e vem fechada em toda pergunta; exemplo dentro do campo de escrever */
    const semDica = c.visitadas.filter((k) => !(c.telas[k].dica.length === 1 && c.telas[k].dica[0] === false));
    check(`leve: "Ver dica" fechada em todas as perguntas (${op})`, semDica.length === 0, semDica);
    const semEx = c.visitadas.filter((k) => /Texto|N[uú]mero/.test(P[k].tipo) && !/^Ex\.: /.test(c.telas[k].ph));
    check(`leve: exemplo "Ex.: …" dentro do campo em toda pergunta de escrever (${op})`, semEx.length === 0, semEx);
  }

  /* ---- "Não sei" em todas as perguntas que têm "Não sei" ---- */
  const nsTodos = {};
  const PASSOS_VISTOS = new Set();
  Object.values(P).forEach((p) => { if (p.codigo !== 'M4.P01' && /Não sei/.test(p.opcoes || '')) nsTodos[p.codigo] = 'NS'; });
  for (const op of ['Produto+ Serviço', 'Produto']) {
    const mapa = { ...nsTodos, 'M4.P02': op, 'M4.P14': op === 'Produto' ? 'Vender pouca quantidade, já com preço' : 'Aceitar agendamento ou reserva antes de atender' };
    const c = await caminho(page, mapa);
    rafael = rafael.concat(c.rafael);
    const so = (s) => s.replace(/\s+/g, ' ');   // innerText junta espaços duplos
    for (const cod of c.visitadas.filter((x) => mapa[x] === 'NS')) {
      const p = P[cod], t = so(c.telas[cod].corpo), cx = c.telas[cod].como;
      /* textos do grupo que continuam depois do "Não sei" (o texto antigo do "Não sei" e o roteiro solto deram lugar à caixa) */
      const esperados = [p.alerta_naosei, Motor_retorno(p, 'Não sei')].filter(Boolean).map((s) => so(s.trim().split('\n')[0]));
      const faltam = esperados.filter((s) => !t.includes(s)).concat(p.alerta && !so(c.telas[cod].todo).includes(so(p.alerta.trim().split('\n')[0])) ? ['(dica) ' + p.alerta] : []);
      check(`${cod} "Não sei" (${op}) mostra os textos do grupo que valem`, faltam.length === 0 && /Não sei/.test(t), faltam);
      /* versão leve: 2 passos escritos para esta pergunta + pedido para a IA com Copiar; a caixa aparece uma vez só */
      const temPrompt = !!(p.promptIA || p.prompt_ia);
      check(`leve: ${cod} "Não sei" (${op}) abre "Como descobrir" com 2 passos${temPrompt ? ' e Copiar' : ''}`, cx.n === 1 && cx.passos.length === 2 && cx.passos.every((x) => x.length > 30) && (!temPrompt || (cx.copiar && cx.prompt.length > 80)), cx);
      const NS_SALVO = { escolha: { estado: 'opcao', opcao: 'Não sei' }, multipla: { estado: 'opcoes', opcoes: ['Não sei'] } };
      const tp = /m[uú]ltipla/i.test(p.tipo) ? 'multipla' : /escolha|sim\/n/i.test(p.tipo) ? 'escolha' : 'texto';
      void NS_SALVO; void tp;
      const n = c.telas[cod].ns;
      check(`16/11: ${cod} "Não sei" (${op}) não grava nada (estado salvo igual) e o Continuar não avança`, !!n && n.igual && cx.salvo === null && n.mesma && !n.seguir && /^Use a ajuda acima e (escreva a sua resposta|escolha uma opção) para continuar\.$/.test(n.erro), n);
      check(`16/11: ${cod} depois de responder de verdade, avança`, c.visitadas.indexOf(cod) < c.visitadas.length - 1 || /Resumo das suas respostas/.test(c.final));
      PASSOS_VISTOS.add(cod);
    }
    /* cada passo é próprio da pergunta (nenhum par de passos repetido entre perguntas) */
    const pares = c.visitadas.filter((x) => mapa[x] === 'NS').map((x) => c.telas[x].como.passos.join('|'));
    check(`leve: passos do "Não sei" diferentes em cada pergunta (${op})`, new Set(pares).size === pares.length, pares.length);
    if (op === 'Produto+ Serviço') {
      check('P03 "Não sei" mostra o botão Copiar com o roteiro da ficha técnica e o conceito de ficha técnica', /\bCopiar\b/.test(c.telas['M4.P03'].corpo) && c.telas['M4.P03'].como.prompt.startsWith('Você vai me ajudar a montar a FICHA TÉCNICA') && c.telas['M4.P03'].todo.includes('Ficha técnica do produto'));
      check('P14 "Não sei" (sem opção na versão serviço) não aparece', !c.telas['M4.P14'].opcoes.includes('Não sei'));
    }
    /* perguntas sobre a própria pessoa (decisão, situação): sem "Não sei" */
    const SEM_NS = ['M4.P02', 'M4.P04', 'M4.P05', 'M4.P07', 'M4.P12', 'M4.P13', 'M4.P14', 'M4.P16', 'M4.P17', 'M4.P18', 'M4.P19', 'M4.P20', 'M4.P21', 'M4.PV1', 'M4.PV2', 'M4.PV3'];
    const comNS = c.visitadas.filter((k) => SEM_NS.includes(k) && c.telas[k].temNS);
    check(`16/11: perguntas sobre a própria pessoa sem "Não sei" (${op})`, comNS.length === 0 && c.visitadas.filter((k) => SEM_NS.includes(k)).length >= 8, comNS);
    const R0 = await page.evaluate(() => JSON.parse(localStorage.getItem('lg2-turma-a-m04')).R);
    check(`16/11: nenhuma resposta "Não sei" gravada no fim (${op})`, !JSON.stringify(R0).includes('Não sei') && !JSON.stringify(R0).includes('naosei'), R0);
    /* resultado leve: cada "Não sei" aparece em "O que falta descobrir" com o seu "Como descobrir" recolhido */
    const falta = await page.evaluate(() => { const f = document.querySelector('.falta'); return f ? { itens: f.querySelectorAll(':scope > ul > li').length, mini: [...f.querySelectorAll('details.como-mini')].map((d) => ({ aberto: d.open, n: d.querySelectorAll('ol > li').length })) } : null; });
    const nNS = c.visitadas.filter((x) => mapa[x] === 'NS').length;
    check(`16/11: resultado sem "O que falta" (os ${nNS} "Não sei" foram respondidos) (${op})`, !falta && !/com “Não sei”/.test(c.final), falta);
  }
  check('leve: todas as perguntas com "Não sei" (fora a 1, testada acima) têm a sua caixa "Como descobrir"', Object.keys(nsTodos).every((k) => PASSOS_VISTOS.has(k)), Object.keys(nsTodos).filter((k) => !PASSOS_VISTOS.has(k)));
  check('P05 > 3 -> P07 aparece', (await caminho(page, { 'M4.P02': 'Produto', 'M4.P05': '5 sabores' })).visitadas.includes('M4.P07'));
  check('P05 <= 3 -> P07 não aparece', !(await caminho(page, { 'M4.P02': 'Produto', 'M4.P05': '3' })).visitadas.includes('M4.P07'));

  /* ---- P14 -> P15 ---- */
  for (const [op, ve] of [['Mostrar uma amostra sem cobrar', false], ['Vender pouca quantidade, já com preço', true], ['Aceitar encomenda ou reserva antes de fazer', true]]) {
    const c = await caminho(page, { 'M4.P02': 'Produto', 'M4.P05': '2', 'M4.P14': op });
    check(`P14="${op === 'NS' ? 'Não sei' : op}" -> P15 ${ve ? 'aparece' : 'não aparece'}`, c.visitadas.includes('M4.P15') === ve, c.visitadas);
    if (op === 'Vender pouca quantidade, já com preço') check('P14 mostra o significado de Pré-venda (em "Ver dica")', c.telas['M4.P14'].todo.includes(D.base.find((b) => b.codigo === 'M4.BT07').definicao));
  }
  check('P14 versão serviço "Atender poucos clientes, já cobrando" -> P15 aparece', (await caminho(page, { 'M4.P02': 'Serviço', 'M4.P14': 'Atender poucos clientes, já cobrando' })).visitadas.includes('M4.P15'));
  check('P14 versão serviço "Aceitar agendamento ou reserva antes de atender" -> P15 aparece', (await caminho(page, { 'M4.P02': 'Serviço', 'M4.P14': 'Aceitar agendamento ou reserva antes de atender' })).visitadas.includes('M4.P15'));
  for (const [v, mostra] of [['Sim', true], ['Não', false], ['NS', true]]) {
    const c = await caminho(page, { 'M4.P02': 'Produto', 'M4.P05': '2', 'M4.P14': 'Aceitar encomenda ou reserva antes de fazer', 'M4.P15': v });
    const so = (x) => x.replace(/\s+/g, ' ');
    const t = c.telas['M4.P15'].corpo, t2 = c.telas['M4.P15'].depois;
    if (v === 'NS') check('P15 "Não sei" -> o texto da Anvisa/Inmetro vem na ajuda (sem gravar); depois de responder, alerta', t.includes('consulte a Anvisa') && c.telas['M4.P15'].todo.includes(so(P['M4.P15'].alerta).trim()) && !/Atenção/.test(t2.split('Continuar')[0].split(c.telas['M4.P15'].pergunta).pop()) && c.telas['M4.P15'].ns.igual);
    else {
      check(`P15="${v}" -> retorno Anvisa/Inmetro ${mostra ? 'aparece' : 'não aparece'} (depende da resposta); o cuidado geral fica na dica`, t.includes('consulte a Anvisa') === mostra && c.telas['M4.P15'].todo.includes(so(P['M4.P15'].alerta).trim()));
      if (v === 'Sim') check('G: risco real da atividade regulada aparece como aviso sem impedir o avanço', c.telas['M4.P15'].alertas.length === 1 && /Atenção/.test(c.telas['M4.P15'].alertas[0]) && /Vender sem conhecer as regras/.test(c.telas['M4.P15'].alertas[0]) && !c.telas['M4.P15'].bloqueado, c.telas['M4.P15'].alertas);
    }
  }

  /* ---- P17 Outra -> P18 ---- */
  check('P17="Outra" -> P18 aparece', (await caminho(page, { 'M4.P02': 'Serviço', 'M4.P17': 'Outra' })).visitadas.includes('M4.P18'));
  check('P17="Pedidos/reservas" -> P18 não aparece', !(await caminho(page, { 'M4.P02': 'Serviço', 'M4.P17': 'Pedidos/reservas' })).visitadas.includes('M4.P18'));

  /* ---- trocar P02 descarta respostas que não valem mais ---- */
  {
    await caminho(page, { 'M4.P02': 'Produto', 'M4.P05': '2', 'M4.P14': 'Mostrar uma amostra sem cobrar' });
    await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('lg2-turma-a-m04')); s.hist = ['M4.P01', 'M4.P02']; localStorage.setItem('lg2-turma-a-m04', JSON.stringify(s)); });
    await page.reload(); await page.click('#ir');
    await page.evaluate(NA_PAGINA.responder, 'Serviço');
    const R = await page.evaluate(() => JSON.parse(localStorage.getItem('lg2-turma-a-m04')).R);
    check('trocar P02 para Serviço remove P03/P05 e a P14 não aplicável, mas conserva a resposta ainda válida de P08', !R['M4.P03'] && !R['M4.P05'] && !R['M4.P14'] && !!R['M4.P08'], Object.keys(R));
  }

  /* ---- persistência ao recarregar ---- */
  await page.evaluate(() => localStorage.clear()); await page.reload(); await page.click('#ir');
  await page.evaluate(NA_PAGINA.responder, 'Minha frase de teste'); await semPassoExtra();
  await page.evaluate(NA_PAGINA.responder, 'Produto+ Serviço'); await semPassoExtra();
  await page.evaluate(NA_PAGINA.responder, 'farinha, ovos'); await semPassoExtra();
  await page.reload();
  check('após recarregar, a capa oferece "Continuar de onde parei"', (await page.textContent('#ir')).includes('Continuar de onde parei'));
  await page.click('#ir');
  check('após recarregar, volta à mesma pergunta (P04)', (await page.evaluate(NA_PAGINA.atual)) === 'M4.P04');
  await page.evaluate(() => document.querySelector('#v').click());
  check('respostas mantidas após recarregar (P03)', await page.evaluate(() => document.querySelector('#ent textarea').value === 'farinha, ovos'));
  const cfim = await caminho(page, { 'M4.P02': 'Produto', 'M4.P05': '2' });
  await page.reload();
  await page.click('#ir');
  check('após recarregar no fim, abre o resumo', /Resumo das suas respostas/.test(await page.evaluate(() => document.body.innerText)));
  check('resumo lista as respostas (recolhidas em "Ver suas respostas") e textos do grupo', cfim.finalTodo.includes('Resposta de teste') && cfim.finalTodo.includes(P['M4.P08'].proximo) && !cfim.finalTodo.includes(P['M4.P21'].proximo) && cfim.finalTodo.includes(D.mapa.entrega) && /Ver suas respostas/.test(cfim.final));
  check('resumo não mostra códigos internos (M4.P.., P01)', !/M\d\.P\d|\bP\d{2}\b/.test(cfim.finalTodo.replace(/Etapa \d+/g, '')), (cfim.finalTodo.match(/M\d\.P\d+|\bP\d{2}\b/g) || []).slice(0, 5));

  /* ---- herança: o que já foi respondido em outros módulos vem preenchido ---- */
  const M1_SERV = { R: { 'M1.P01': { estado: 'opcao', opcao: 'Ainda está só na minha cabeça' }, 'M1.P03': { estado: 'valor', valor: 'Lavagem de carro na casa do cliente' }, 'M1.P03A': { estado: 'opcao', opcao: 'Serviço: meu cliente paga pelo trabalho que realizo' } } };
  const M3_CLI = { v: 3, R: { 'M3.P10': { estado: 'opcao', opcao: 'Pessoas comuns (consumidor final)', campos: { 'Idade': '30 a 50', 'Ocupação': 'trabalha fora o dia todo', 'Onde mora': 'bairro São Pedro', 'O que precisa resolver (a dor)': 'sem tempo' } }, 'M3.P11': { estado: 'valor', valor: 'Falta de tempo para lavar o carro' } } };
  const semear = async (o) => { await page.evaluate((o) => { localStorage.clear(); Object.entries(o).forEach(([k, v]) => localStorage.setItem(k, JSON.stringify(v))); }, o); await page.reload(); await page.click('#ir'); };
  const tela = () => page.evaluate(() => ({ cod: null, txt: document.body.innerText, campo: (document.querySelector('#ent textarea, #ent input') || {}).value, sel: [...document.querySelectorAll('.opcao.sel')].map((x) => x.dataset.op), ops: [...document.querySelectorAll('.opcao')].map((x) => x.dataset.op), q: (document.querySelector('.q') || {}).textContent, ajuda: (document.querySelector('.dica .ajuda') || {}).textContent }));
  const estado = () => page.evaluate(() => JSON.parse(localStorage.getItem('lg2-turma-a-m04')).R);
  /* lote 16/11 (item F): pergunta já respondida antes não ganha tela; a resposta vem num cartão "Veio da Etapa N · Trocar" */
  const cartao = () => page.evaluate(() => [...document.querySelectorAll('.reuso li')].map((li) => ({ rot: li.querySelector('.ru-rot').textContent, val: li.querySelector('.ru-val').textContent, de: li.querySelector('.ru-de').textContent, trocar: li.querySelector('[data-trocar]').dataset.trocar })));
  {
    await semear({ 'lg2-turma-a-m01': M1_SERV, 'lg2-turma-a-m03': M3_CLI });
    let t = await tela();
    check('F: com Módulo 1 respondido, as perguntas 1 e 2 não aparecem: abre direto a do serviço (6)', /realizar o serviço uma vez/.test(t.q) && (await page.evaluate(NA_PAGINA.atual)) === 'M4.P06', t.q);
    let cr = await cartao();
    check('F: cartão "Já sabemos" mostra a ideia e o tipo, com "Veio da Etapa 1 · Trocar"', cr.length === 2 && cr[0].val === 'Lavagem de carro na casa do cliente' && cr[1].val === 'Serviço' && cr.every((x) => /Veio da Etapa 1/.test(x.de) && /Trocar/.test(x.de)), cr);
    let R = await estado();
    check('F: respostas reaproveitadas gravadas no formato de sempre, com a origem', JSON.stringify(R['M4.P01']) === JSON.stringify({ estado: 'valor', valor: 'Lavagem de carro na casa do cliente', de: 1 }) && JSON.stringify(R['M4.P02']) === JSON.stringify({ estado: 'opcao', opcao: 'Serviço', de: 1 }), [R['M4.P01'], R['M4.P02']]);
    await page.evaluate(NA_PAGINA.responder, 'Combinar horário, ir até a casa, lavar, conferir'); await semPassoExtra();
    t = await tela();
    check('F: cliente (8) e problema (9) do Módulo 3 não aparecem: segue para a 10', (await page.evaluate(NA_PAGINA.atual)) === 'M4.P10', t.q);
    cr = await cartao();
    check('F: cartão traz o cliente montado com o perfil do Módulo 3 e o problema (M3.P11)', cr.length === 2 && /^Pessoas comuns \(idade: 30 a 50; ocupação: trabalha fora o dia todo; onde mora: bairro São Pedro\)$/.test(cr[0].val) && cr[1].val === 'Falta de tempo para lavar o carro' && cr.every((x) => /Veio da Etapa 3/.test(x.de)), cr);
    check('Serviço: ajuda da P10 sem "produto"', /característica do serviço/.test(t.ajuda) && !/produto/i.test(t.ajuda + t.q), t.ajuda);
    /* Trocar: abre a pergunta com a resposta trazida; a nova resposta fica sem a marca de origem */
    await page.evaluate(() => document.querySelector('[data-trocar="M4.P08"]').click());
    t = await tela();
    check('F: "Trocar" abre a pergunta 8 com o texto trazido e o selo', (await page.evaluate(NA_PAGINA.atual)) === 'M4.P08' && /^Pessoas comuns/.test(t.campo) && /Veio da Etapa 3/.test(t.txt), t.campo);
    await page.evaluate(NA_PAGINA.responder, 'Moradores do bairro São Pedro que trabalham fora'); await semPassoExtra();
    check('F: resposta trocada é gravada sem a marca de origem', (await estado())['M4.P08'].de === undefined && (await estado())['M4.P08'].valor === 'Moradores do bairro São Pedro que trabalham fora');
    check('F: depois de trocar, segue sem repetir a pergunta 9', (await page.evaluate(NA_PAGINA.atual)) === 'M4.P10');
    await page.evaluate(() => document.querySelector('#v').click());
    check('F: voltar depois de trocar mostra a resposta gravada', (await tela()).campo === 'Moradores do bairro São Pedro que trabalham fora');
  }
  {
    /* fallback: sem M1.P03A, o tipo vem do Módulo 5; sem M3, o cliente vem do Módulo 2 */
    await semear({ 'lg2-turma-a-m05': { versao: 3, R: { 'M5.P01': { estado: 'opcao', opcao: 'Mercadoria: compro pronto para revender' } }, hist: [] }, 'lg2-turma-b-m02': { R: { 'M2.P02': { estado: 'valor', valor: 'Mães que trabalham fora' } }, hist: [] } });
    let t = await tela();
    check('sem ideia em outro módulo, P01 aparece vazia e sem selo', t.campo === '' && !/Veio da Etapa/.test(t.txt) && (await page.evaluate(NA_PAGINA.atual)) === 'M4.P01');
    await page.evaluate(NA_PAGINA.responder, 'Roupas infantis'); await semPassoExtra();
    const cr = await cartao();
    check('F: tipo do Módulo 5 (Mercadoria) não pergunta de novo: cartão "Veio da Etapa 5"', (await page.evaluate(NA_PAGINA.atual)) === 'M4.P03' && cr.length === 1 && cr[0].val === 'Mercadoria' && /Veio da Etapa 5/.test(cr[0].de), cr);
    await page.evaluate(() => document.querySelector('[data-trocar="M4.P02"]').click());
    t = await tela();
    check('F: "Trocar" o tipo abre a pergunta 2 já marcada', JSON.stringify(t.sel) === '["Mercadoria"]' && /Veio da Etapa 5/.test(t.txt), t.sel);
    await page.evaluate(NA_PAGINA.responder, 'Produto+ Serviço');
    check('herança P02: pessoa pode trocar para uma combinação', (await estado())['M4.P02'].opcao === 'Produto+ Serviço' && (await estado())['M4.P02'].de === undefined);
    const c = await caminho(page, { 'M4.P02': 'Produto', 'M4.P05': '2' }, { 'lg2-turma-b-m02': { R: { 'M2.P02': { estado: 'valor', valor: 'Mães que trabalham fora' } } } });
    check('F: cliente do Módulo 2 (sem perfil no Módulo 3) não pergunta de novo', !c.visitadas.includes('M4.P08') && /Veio da Etapa 2/.test(c.telas['M4.P09'].corpo) && JSON.stringify((await estado())['M4.P08']) === JSON.stringify({ estado: 'valor', valor: 'Mães que trabalham fora', de: 2 }), c.visitadas);
  }
  {
    /* M3.P21 (o que o cliente ganha comprando com você e não com o vizinho) = M4.P11 + M4.PV2; PV1 = P09; PV3 = P10 */
    const M3_P21 = { 'lg2-turma-a-m03': { v: 7, R: { 'M3.P21': { estado: 'valor', valor: 'Entrego na porta da escola, na hora do lanche' } } } };
    const c = await caminho(page, { 'M4.P02': 'Produto', 'M4.P05': '2', 'M4.P09': 'Pais sem tempo de fazer lanche', 'M4.P10': 'Lanche pronto sem esforço' }, M3_P21);
    check('F: com M3.P21 respondida, as perguntas 11 e PV2 não aparecem; PV1 e PV3 também não (já respondidas na 9 e na 10)', !['M4.P11', 'M4.PV1', 'M4.PV2', 'M4.PV3'].some((k) => c.visitadas.includes(k)) && c.visitadas.join(',').includes('M4.P10,M4.P12'), c.visitadas);
    const R = await estado();
    check('F: PV1–PV3 gravadas no formato lido pelo Módulo 10 ({estado:"valor", valor})', R['M4.PV1'].estado === 'valor' && R['M4.PV1'].valor === 'Pais sem tempo de fazer lanche' && R['M4.PV2'].valor === 'Entrego na porta da escola, na hora do lanche' && R['M4.PV2'].de === 3 && R['M4.PV3'].valor === 'Lanche pronto sem esforço' && R['M4.PV3'].igual === 'M4.P10' && !R['M4.P11'], [R['M4.PV1'], R['M4.PV2'], R['M4.PV3'], R['M4.P11']]);
    const t12 = c.telas['M4.P12'].corpo;
    check('auditoria 17/11: com M3.P21, a pergunta 10 lembra o diferencial dito na Etapa 3 (para não parecer repetida)', c.telas['M4.P10'].ref3 === 'Na Etapa 3 você disse que o seu diferencial é: “Entrego na porta da escola, na hora do lanche”. Agora pense no que muda na vida do cliente.', c.telas['M4.P10'].ref3);
    check('auditoria 17/11: a pergunta 12 já vem com o rascunho montado (problema da 9, ganho da 10, motivo da Etapa 3), editável', c.telas['M4.P12'].valor0.startsWith('Ofereço ') && c.telas['M4.P12'].valor0.endsWith('Resolvo este problema: pais sem tempo de fazer lanche. O cliente ganha: lanche pronto sem esforço. Por que comprar de mim: entrego na porta da escola, na hora do lanche.') && /Rascunho pronto/.test(t12), c.telas['M4.P12'].valor0);
    check('F: cartão na tela 12 com o problema, o motivo (Módulo 3) e o benefício', /Veio da sua resposta anterior/.test(t12) && /Veio da Etapa 3/.test(t12) && t12.includes('Entrego na porta da escola'), t12.slice(0, 700));
    const fim = await page.evaluate(() => ({ cartao: (document.querySelector('main .reuso') || {}).innerText || '', caixa: document.querySelector('.entendemos').innerText }));
    check('F: resultado tem "Respostas que já tínhamos" com Trocar, e o resumo usa a resposta do Módulo 3', /Respostas que já tínhamos/.test(fim.cartao) && /Trocar/.test(fim.cartao) && fim.caixa.includes('Entrego na porta da escola'), fim);
  }
  {
    /* "Não sei" em outro módulo não conta como resposta */
    await semear({ 'lg2-turma-a-m01': { R: { 'M1.P03': { estado: 'naosei' }, 'M1.P03A': { estado: 'naosei' } } } });
    let t = await tela();
    check('"Não sei" no Módulo 1 não preenche P01', t.campo === '' && !/Veio da Etapa/.test(t.txt));
    await page.evaluate(NA_PAGINA.responder, 'Bolo'); await semPassoExtra();
    t = await tela();
    check('"Não sei" no Módulo 1 não marca P02', t.sel.length === 0 && !/Veio da Etapa/.test(t.txt));
  }
  {
    /* P14 reescrita: enunciado claro + cada caminho explicado */
    const c = await caminho(page, { 'M4.P02': 'Produto', 'M4.P05': '2', 'M4.P14': 'Aceitar encomenda ou reserva antes de fazer' });
    const t = c.telas['M4.P14'];
    check('P14 nova pergunta "Como você quer testar sua oferta pela primeira vez?"', t.pergunta === 'Como você quer testar sua oferta pela primeira vez?', t.pergunta);
    check('P14 a opção escolhida explica o caminho (dica ao tocar)', t.corpo.includes(P['M4.P14'].opcoes_explica['Aceitar encomenda ou reserva antes de fazer']));
    check('P14 sem o texto antigo ("investir na produção", "Protótipo sem venda")', !/investir na produção|Protótipo sem venda|Oferta mínima com preço/.test(t.corpo));
    const s = await caminho(page, { 'M4.P02': 'Serviço', 'M4.P14': 'Atender poucos clientes, já cobrando' });
    check('P14 versão serviço: ajuda própria, sem "produto"', s.telas['M4.P14'].todo.includes(P['M4.P14'].variantes[0].ajuda) && !/produto/i.test(s.telas['M4.P14'].pergunta));
  }
  {
    /* estado salvo antes da reescrita: a opção antiga é traduzida */
    await page.evaluate(() => { localStorage.clear(); localStorage.setItem('lg2-turma-a-m04', JSON.stringify({ R: { 'M4.P01': { estado: 'valor', valor: 'Bolo' }, 'M4.P02': { estado: 'opcao', opcao: 'Serviço' }, 'M4.P14': { estado: 'opcao', opcao: 'Pré-venda/reserva' } }, hist: ['M4.P01', 'M4.P02', 'M4.P14'] })); });
    await page.reload(); await page.click('#ir');
    const t = await tela();
    check('estado antigo: P14 "Pré-venda/reserva" (serviço) vira "Aceitar agendamento ou reserva antes de atender"', JSON.stringify(t.sel) === '["Aceitar agendamento ou reserva antes de atender"]', t.sel);
  }
  {
    /* "O que entendemos até aqui" no topo do resultado */
    const c = await caminho(page, { 'M4.P01': 'Lavagem de carro na casa do cliente', 'M4.P02': 'Serviço', 'M4.P08': 'NS', 'M4.P09': 'Falta de tempo para lavar o carro', 'M4.P12': 'Para quem trabalha fora, lavo o carro na porta de casa', 'M4.P14': 'Atender poucos clientes, já cobrando', 'M4.P19': '5', 'M4.P20': '7', 'M4.P21': '0' },
      { 'lg2-turma-a-m01': M1_SERV, 'lg2-turma-a-m03': M3_CLI });
    const caixa = await page.evaluate(() => { const e = document.querySelector('.entendemos'); return e && { txt: e.innerText, topo: e.previousElementSibling && e.previousElementSibling.classList.contains('concluido') }; });
    check('resultado: caixa "O que entendemos até aqui" logo abaixo do "Você concluiu"', !!caixa && caixa.topo && /O que entendemos até aqui/.test(caixa.txt), caixa);
    const f = caixa ? caixa.txt : '';
    check('caixa: ideia + tipo (do Módulo 1)', f.includes('Você quer oferecer “Lavagem de carro na casa do cliente”, que é um serviço (o cliente paga pelo seu trabalho).'), f);
    check('caixa: estágio do Módulo 1', f.includes('ainda não saiu do papel'), f);
    check('caixa: problema do cliente (herdado do Módulo 3)', f.includes('problema que você ajuda a resolver é “Falta de tempo para lavar o carro”'), f);
    check('caixa: proposta de valor', f.includes('Por que comprar de você, por enquanto: “Para quem trabalha fora, lavo o carro na porta de casa”.'), f);
    check('caixa: teste com prazo, gasto e critério', f.includes('No primeiro teste, você vai atender poucos clientes, já cobrando, durante 7 dias, sem gastar dinheiro, e vai considerar que deu certo se chegar a 5 pedidos ou reservas.'), f);
    check('16/11: caixa sem "pontos em aberto" (nada de "Não sei" gravado)', !/em aberto|falta responder/.test(f), f);
    /* texto corrido (relatório do Bento): frases agrupadas por assunto em 1 a 3 parágrafos, sem lista */
    const par = await page.evaluate(() => { const e = document.querySelector('.entendemos'); return { n: e.querySelectorAll('p').length, li: e.querySelectorAll('ul, ol, li').length, p: [...e.querySelectorAll('p')].map((x) => x.textContent) }; });
    check('caixa: texto corrido em 1 a 3 parágrafos, sem <li> e com <p>', par.n >= 1 && par.n <= 3 && par.li === 0, par);
    check('caixa: 1º parágrafo = negócio, estágio e cliente; 2º = proposta e teste', par.n === 2 && par.p[0].startsWith('Você quer oferecer') && /problema que você ajuda/.test(par.p[0]) && par.p[1].startsWith('Por que comprar de você') && /No primeiro teste/.test(par.p[1]), par.p);
    check('I: lista de respostas aberta no relatório e com selo de origem', await page.evaluate(() => { const d = document.querySelector('details.respostas'); return !!d && d.open && /Veio da Etapa 1/.test(d.textContent); }));
    check('jornada: caixa lg2-proximo continua no fim', /class="acoes lg2-proximo"/.test(await page.content()));
  }


  /* ================= lote de 05/11/2026 (testes da turma) ================= */
  /* abre a pergunta `cod` com as anteriores respondidas (caminho completo e depois volta o histórico) */
  async function abrirEm(cod, respostas, outros) {
    await caminho(page, respostas, outros);
    await page.evaluate((c) => { const s = JSON.parse(localStorage.getItem('lg2-turma-a-m04')); s.hist = s.hist.slice(0, s.hist.indexOf(c) + 1); localStorage.setItem('lg2-turma-a-m04', JSON.stringify(s)); }, cod);
    await page.reload(); await page.click('#ir');
    const atual = await page.evaluate(NA_PAGINA.atual);
    if (atual !== cod) throw new Error('abrirEm ' + cod + ' parou em ' + atual);
  }
  const digitar = (v) => page.evaluate((v) => { const i = document.querySelector('#ent input, #ent textarea'); i.value = v; i.dispatchEvent(new Event('input', { bubbles: true })); document.querySelector('#ok').click(); }, v);
  /* lote 17/11: depois do Continuar a tela já é a próxima (ou o resumo, que não tem #erro) */
  const situacao = (cod) => page.evaluate((c) => ({ erro: !document.querySelector('#erro') || document.querySelector('#erro').hidden ? '' : document.querySelector('#erro').innerText.replace(/\s+/g, ' '), aviso: !!document.querySelector('#erro.aviso-num'), ok: document.querySelector('#ok') && document.querySelector('#ok').textContent, salvo: (JSON.parse(localStorage.getItem('lg2-turma-a-m04')).R[c] || {}).valor, seguir: ((document.querySelector('.cartao-q[data-cod]') || {}).dataset || {}).cod !== c, inputmode: (document.querySelector('#ent input') || {}).inputMode }), cod);
  const ATE100 = { 'lg2-turma-a-m01': { v: 4, R: { 'M1.P07': { estado: 'opcao', opcao: 'Até R$ 100' } } } };

  /* ---- receita A: teclado do celular ---- */
  check('A: viewport com interactive-widget=resizes-content', /interactive-widget=resizes-content/.test(await page.getAttribute('meta[name=viewport]', 'content')));
  for (const [cod, campo] of [['M4.P01', '#ent textarea'], ['M4.P21', '#ent input']]) {
    if (cod === 'M4.P01') { await page.evaluate(() => localStorage.clear()); await page.reload(); await page.click('#ir'); }
    else await abrirEm(cod, { 'M4.P02': 'Produto', 'M4.P05': '2' });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.focus(campo);
    await page.setViewportSize({ width: 390, height: 450 });
    await page.waitForTimeout(700);
    const bc = await page.locator(campo).boundingBox(), bo = await page.locator('#ok').boundingBox();
    const dentro = (b) => b && b.y >= 0 && b.y + b.height <= 450;
    check(`A: ${cod} com o teclado aberto (390x450), campo e Continuar visíveis`, dentro(bc) && dentro(bo), { bc, bo });
    await page.setViewportSize({ width: 390, height: 844 });
  }
  check('A: nada recolhível entre o campo e o Continuar; "Ver dica" (com os termos) fica antes do campo', await page.evaluate(() => { const ent = document.querySelector('#ent'), ok = document.querySelector('#acoes'), d = document.querySelector('.cartao-q details.dica-toggle'); const entre = [...document.querySelectorAll('.cartao-q details')].filter((x) => (ent.compareDocumentPosition(x) & Node.DOCUMENT_POSITION_FOLLOWING) && (x.compareDocumentPosition(ok) & Node.DOCUMENT_POSITION_FOLLOWING)); return entre.length === 0 && !!d && !!(d.compareDocumentPosition(ent) & Node.DOCUMENT_POSITION_FOLLOWING); }));

  /* ---- receita B: números ---- */
  {
    await abrirEm('M4.P19', { 'M4.P02': 'Produto', 'M4.P05': '2' });
    check('B: P19 (número mínimo) é campo numérico', (await situacao('M4.P19')).inputmode === 'numeric');
    await digitar('muitas pessoas');
    let s = await situacao('M4.P19');
    check('B: P19 com texto = erro "Digite só números" e não grava', /Digite só números/.test(s.erro) && !s.aviso && !s.seguir, s);
    await digitar('0');
    s = await situacao('M4.P19');
    check('B: P19 = 0 = erro', /pelo menos 1/.test(s.erro) && !s.seguir, s);
    await digitar('150');
    s = await situacao('M4.P19');
    check('B: P19 = 150 = aviso (mais de 100), botão "Continuar mesmo assim"', s.aviso && /parece alto/.test(s.erro) && s.ok === 'Continuar mesmo assim' && !s.seguir, s);
    await page.evaluate(() => document.querySelector('#ok').click());
    s = await situacao('M4.P19');
    check('B: P19 segundo toque com o mesmo valor segue', s.seguir && s.salvo === '150', s);
    await semPassoExtra();
    check('B: P20 é campo numérico inteiro', (await situacao('M4.P20')).inputmode === 'numeric');
    await digitar('duas semanas');
    s = await situacao('M4.P20');
    check('B: P20 com texto = erro e não grava', /Digite só números/.test(s.erro) && !s.seguir, s);
    await digitar('-3');
    s = await situacao('M4.P20');
    check('B: P20 negativo = erro', /negativo/.test(s.erro) && !s.seguir, s);
    await digitar('7,5');
    check('B: P20 com fração de dia = erro', /inteiro/.test((await situacao('M4.P20')).erro));
    await digitar('1.500');
    s = await situacao('M4.P20');
    check('B: P20 = 1.500 dias = aviso (mais de 90 dias), não trava', s.aviso && /1\.500 dias é mais de 90 dias/.test(s.erro) && !s.seguir, s);
    await digitar('90');
    s = await situacao('M4.P20');
    check('B: P20 = 90 dias segue sem aviso; trocar o valor tira o aviso', s.seguir && !s.erro && s.salvo === '90', s);
    await semPassoExtra();
    check('B: P21 (R$) aceita decimal', (await situacao('M4.P21')).inputmode === 'decimal');
    await digitar('dez reais');
    check('B: P21 com texto = erro', /Digite só números/.test((await situacao('M4.P21')).erro));
    await digitar('12,50');
    s = await situacao('M4.P21');
    check('B: P21 = 12,50 (sem teto do Módulo 1) segue sem aviso', s.seguir && !s.erro, s);
    check('B: P21 era a última: o Continuar já abriu o resumo', /Resumo das suas respostas/.test(await page.evaluate(() => document.body.innerText)));
    await page.evaluate(() => document.querySelector('#v').click());   // "Voltar" do resumo reabre a pergunta 21 (o "Corrigir" saiu)
    await digitar('5000');
    s = await situacao('M4.P21');
    check('B: P21 = R$ 5.000 sem Módulo 1 = aviso de valor alto (mais de R$ 1.000)', s.aviso && /parece alto/.test(s.erro) && /R\$ 1\.000/.test(s.erro), s);
  }

  /* ---- cruzamento com o Módulo 1 (P07 = "Até R$ 100") ---- */
  {
    await abrirEm('M4.P21', { 'M4.P02': 'Produto', 'M4.P05': '2' }, ATE100);
    await digitar('1500');
    let s = await situacao('M4.P21');
    const MSG = 'Na Etapa 1 você disse que pode usar até R$ 100 sem faltar para as contas da casa. Esse teste custa R$ 1.500. Dá para fazer uma versão menor?';
    check('M1: gasto de R$ 1.500 com teto "Até R$ 100" mostra o aviso combinado', s.aviso && s.erro.includes(MSG) && /Veio da Etapa 1/.test(s.erro), s.erro);
    check('M1: o aviso não grava nem trava (botão "Continuar mesmo assim")', s.ok === 'Continuar mesmo assim' && s.salvo === '5' && !s.seguir, s);
    await page.evaluate(() => document.querySelector('#ok').click());
    s = await situacao('M4.P21');
    check('M1: segundo toque segue e grava R$ 1.500 (no padrão brasileiro)', s.seguir && s.salvo === '1.500', s);
    await semPassoExtra();
    const fim = await page.evaluate(() => (document.querySelector('.avisos-num') || {}).innerText || '');
    check('M1: o resumo repete o aviso, com "Veio da Etapa 1"', fim.includes(MSG) && /Veio da Etapa 1/i.test(fim), fim);
    await abrirEm('M4.P21', { 'M4.P02': 'Produto', 'M4.P05': '2' }, ATE100);
    await digitar('80');
    check('M1: gasto dentro do teto (R$ 80) segue sem aviso', (await situacao('M4.P21')).seguir);
    await abrirEm('M4.P21', { 'M4.P02': 'Produto', 'M4.P05': '2' }, { 'lg2-turma-a-m01': { R: { 'M1.P07': { estado: 'opcao', opcao: 'Nada por enquanto' } } } });
    await digitar('10');
    s = await situacao('M4.P21');
    check('M1: "Nada por enquanto" + R$ 10 avisa e sugere testar sem gastar', s.aviso && /não tem dinheiro para usar no negócio/.test(s.erro) && /R\$ 10\b/.test(s.erro), s.erro);
  }

  /* ---- textos corrigidos ---- */
  {
    await page.evaluate(() => localStorage.clear()); await page.reload();
    const capa = await page.evaluate(() => document.body.textContent);   // inclui o "Como funciona" recolhido
    const tudo = JSON.stringify(D);
    const RUINS = ['apessoa', 'ideial', 'Nossos usuários', 'o usuário será capaz', 'instruí ', 'matéria prima', 'O que serviço?', 'presta à alguém', 'cabeleleiro', 'psicologo', 'eletronicos', 'ficha tecnica', 'produto.Sem', 'especifico', 'negocio ', 'Plataformas (ifood)', 'o minimo', 'seu publico', 'hipotese', 'confirmada.Talvez', 'inmetro).Para', 'criar-se', 'passarem mal', 'gluten', 'Eaemidiadigital', 'anunciar venda'];
    const achados = RUINS.filter((r) => tudo.includes(r));
    check('textos: erros de digitação listados foram corrigidos nos dados', achados.length === 0, achados);
    check('textos: "O que você recebe" sem "apessoa"/"ideial" e com "viabilidade ideal"', D.mapa.entrega.includes('viabilidade ideal') && capa.includes(D.mapa.entrega));
    check('textos: "Para quem é" fala com você', /^Esta etapa é para você/.test(D.mapa.usuario) && capa.includes(D.mapa.usuario));
    check('textos: rodapé sem "Grupo N"', !/Grupo \d/.test(capa), capa.match(/Grupo \d/));
  }

  /* ---- exemplos pelo tipo do negócio ---- */
  const M1_TIPO = (op) => ({ 'lg2-turma-a-m01': { R: { 'M1.P03A': { estado: 'opcao', opcao: op } } } });
  {
    const s = await caminho(page, { 'M4.P02': 'Serviço', 'M4.P06': 'NS', 'M4.P14': 'Aceitar agendamento ou reserva antes de atender' }, M1_TIPO('Serviço: meu cliente paga pelo trabalho que realizo'));
    const sem = (cod) => !/bolo|picolé|farinha/i.test(s.telas[cod].corpo);
    check('tipo Serviço: P01 já traz exemplo de manicure (tipo do Módulo 1), no campo e na dica', /manicure em domicílio/.test(s.telas['M4.P01'].ph) && /manicure em domicílio/.test(s.telas['M4.P01'].todo) && sem('M4.P01'));
    for (const cod of ['M4.P09', 'M4.P10', 'M4.P12', 'M4.P13', 'M4.P19']) check(`tipo Serviço: ${cod} sem exemplo de bolo/picolé`, sem(cod) && !/bolo|picolé|farinha/i.test(s.telas[cod].todo + s.telas[cod].ph) && /manicure|salão|horários marcados/.test(s.telas[cod].todo), s.telas[cod].corpo.slice(0, 400));
    check('tipo Serviço: P14 mostra Pré-venda com exemplo de agendamento (em "Ver exemplos")', s.telas['M4.P14'].todo.includes(D.base.find((b) => b.codigo === 'M4.BT07').por_tipo['Serviço'].exemplo) && !/bolo|picolé|farinha/i.test(s.telas['M4.P14'].todo));
    /* ficha técnica do serviço */
    const t6 = s.telas['M4.P06'].todo;   // a orientação fica em "Ver dica"
    check('ficha Serviço: P06 orienta etapas, tempo, materiais e custo por atendimento', /ficha técnica do seu atendimento/.test(t6) && /tempo/.test(t6) && /materiais que você usa em cada atendimento/.test(t6) && /custam por atendimento/.test(t6));
    check('ficha Serviço: "Não sei" na P06 dá o texto de IA do serviço e o conceito da ficha do serviço', t6.includes('FICHA TÉCNICA de um serviço') && t6.includes('Ficha técnica do serviço') && !t6.includes('FICHA TÉCNICA de um produto') && /\bCopiar\b/.test(s.telas['M4.P06'].corpo) && s.telas['M4.P06'].como.copiar && s.telas['M4.P06'].ns.igual);
    check('ficha Serviço: texto de IA pede tempo total e custo por atendimento', /tempo total e o custo de material por atendimento/.test(P['M4.P06'].prompt_ia));
    const fim = await page.evaluate(() => document.querySelector('#tela').textContent);
    check('ficha Serviço: resumo mostra "Ficha técnica do serviço" e não a do produto', fim.includes('Ficha técnica do serviço') && !fim.includes('Ficha técnica do produto'));
    check('ficha Produto: texto de IA do produto ficou igual', P['M4.P03'].prompt_ia.startsWith('Você vai me ajudar a montar a FICHA TÉCNICA de um produto que eu quero fazer.') && /ENTREGA FINAL\nQuando eu disser que terminei, monte a ficha técnica organizada em seções/.test(P['M4.P03'].prompt_ia));
  }
  {
    const r = await caminho(page, { 'M4.P02': 'Mercadoria' }, M1_TIPO('Mercadoria: compro pronto para revender'));
    check('tipo Mercadoria: P03 vira a lista de mercadorias para revender', /comprar prontas para revender/.test(r.telas['M4.P03'].pergunta) && !/ingredientes/.test(r.telas['M4.P03'].corpo));
    check('tipo Mercadoria: P01 e P12 com exemplo de revenda', /revender roupas infantis/.test(r.telas['M4.P01'].todo) && /roupas infantis/.test(r.telas['M4.P01'].ph) && /roupas infantis/.test(r.telas['M4.P12'].todo) && !/bolo/i.test(r.telas['M4.P12'].todo));
    const p = await caminho(page, { 'M4.P02': 'Produto', 'M4.P05': 'NS' }, M1_TIPO('Produto: eu faço o que vendo'));
    check('tipo Produto: exemplos de produto mantidos (bolo de pote, sabores)', /bolo de pote para lanche escolar/.test(p.telas['M4.P01'].todo) && p.telas['M4.P01'].ph === 'Ex.: bolo de pote para lanche escolar' && /sabores/.test(p.telas['M4.P05'].ph) && /bolo de pote/.test(p.telas['M4.P12'].todo + p.telas['M4.P12'].ph));
    check('tipo Produto: resumo mostra a ficha técnica do produto, sem a do serviço', p.finalTodo.includes('Ficha técnica do produto') && !p.finalTodo.includes('Ficha técnica do serviço'));
  }
  {
    /* 4º lote (Alicia: brownies; Levi: hamburgueria): produto de ALIMENTO tem ficha técnica da receita */
    const AL = P['M4.P03'].por_tipo && P['M4.P03'].por_tipo.Alimento, so = (s) => s.replace(/\s+/g, ' ');
    const GEN1 = P['M4.P03'].prompt_ia.split('\n')[0], AL1 = AL && AL.prompt_ia.split('\n')[0];
    check('alimento: dados têm a variante Alimento da P03 e do conceito M4.BT09', !!AL && !!D.base.find((b) => b.codigo === 'M4.BT09').por_tipo.Alimento);
    const ITENS = [/gramas ou ml/, /rende/, /[Pp]erd[ae] no preparo/, /[Ee]mbalagem de cada unidade/, /[Vv]alidade e como guardar/, /[Tt]empo de preparo de cada fornada ou pedido/, /custo da receita ÷/];
    check('alimento: texto de IA pede quantidades, rendimento, perda, embalagem, validade, tempo e custo por unidade', ITENS.every((r) => r.test(AL.prompt_ia)) && /brownie/.test(AL.prompt_ia) && /R\$ 30 ÷ 10 = R\$ 3,00/.test(AL.prompt_ia), ITENS.filter((r) => !r.test(AL.prompt_ia)).map(String));
    const ALA = AL.ajuda + ' ' + AL.ajuda_mais;   // parte à vista + "Ver mais"
    check('alimento: ajuda pede os mesmos 7 pontos, com exemplo de brownie e conta simples', ITENS.slice(0, 6).every((r) => r.test(ALA)) && /Custo por unidade = custo da receita ÷ rendimento, mais a embalagem/.test(ALA) && /brownie/.test(AL.ajuda_exemplo.titulo) && /R\$ 30 ÷ 10 = R\$ 3,00 \+ R\$ 0,50 da embalagem = R\$ 3,50/.test(AL.ajuda_exemplo.texto));
    const M1_IDEIA = (ideia) => ({ 'lg2-turma-a-m01': { R: { 'M1.P03': { estado: 'valor', valor: ideia }, 'M1.P03A': { estado: 'opcao', opcao: 'Produto: eu faço o que vendo' } } } });
    /* ideia do Módulo 1 = brownies artesanais (a pergunta 1 respondida com texto neutro: vale a ideia do Módulo 1) */
    const b = await caminho(page, { 'M4.P02': 'Produto', 'M4.P03': 'NS', 'M4.P05': '2' }, M1_IDEIA('brownies artesanais'));
    const t3 = so(b.telas['M4.P03'].corpo), t3t = so(b.telas['M4.P03'].todo);   // todo = inclui "Ver dica" e o conceito recolhido
    check('alimento (M1 = brownies artesanais): P03 pergunta pela receita e rendimento', b.telas['M4.P03'].pergunta === AL.pergunta, b.telas['M4.P03'].pergunta);
    check('alimento (M1 = brownies artesanais): ajuda da receita na dica, sem o exemplo genérico', t3t.includes(so(AL.ajuda)) && /Ver um exemplo com brownie/.test(t3t) && !t3t.includes('Ex.: farinha, ovos, açúcar, embalagem.') && /rende/.test(b.telas['M4.P03'].ph));
    check('alimento (M1 = brownies artesanais): "Não sei" dá o texto de IA de alimento, com Copiar', t3.includes(AL1) && !t3.includes(GEN1) && /\bCopiar\b/.test(t3) && t3.includes('Perda no preparo') && /receita uma vez/.test(b.telas['M4.P03'].como.passos[0]));
    check('alimento: conceito da ficha técnica com exemplo de brownie', t3.includes('Ficha técnica do produto') && /Brownie: 200 g de chocolate/.test(t3t));
    check('alimento: resumo mostra a ficha técnica da receita', b.finalTodo.includes(D.base.find((x) => x.codigo === 'M4.BT09').por_tipo.Alimento.definicao));
    await abrirEm('M4.P03', { 'M4.P02': 'Produto', 'M4.P05': '2' }, M1_IDEIA('brownies artesanais'));
    await page.evaluate(() => { document.querySelector('details.dica-toggle').open = true; });   // a pessoa toca em "Ver dica"
    const ex = await page.evaluate(() => { const d = document.querySelector('.dica .dica-mais:not(.dica-resto)'), ok = document.querySelector('#ok').getBoundingClientRect(); const fechado = !!d && !d.open; if (d) d.open = true; return { fechado, texto: d ? d.innerText : '', okTop: ok.top + window.scrollY }; });
    check('alimento: exemplo do brownie recolhido na dica (o campo fica perto) e com a conta ao abrir', ex.fechado && /R\$ 30 ÷ 10 = R\$ 3,00/.test(ex.texto) && /12 pedaços/.test(ex.texto), ex);
    /* sem Módulo 1: a própria resposta da pergunta 1 (hamburgueria) */
    const h = await caminho(page, { 'M4.P01': 'Hambúrguer artesanal no bairro', 'M4.P02': 'Produto', 'M4.P03': 'NS', 'M4.P05': '2' });
    check('alimento (pergunta 1 = hambúrguer): P03 com ficha da receita e IA de alimento', h.telas['M4.P03'].pergunta === AL.pergunta && so(h.telas['M4.P03'].corpo).includes(AL1));
    /* não é alimento: velas aromáticas = ficha atual */
    const v = await caminho(page, { 'M4.P02': 'Produto', 'M4.P03': 'NS', 'M4.P05': '2' }, M1_IDEIA('velas aromáticas'));
    const tv = so(v.telas['M4.P03'].todo);
    check('não alimento (velas aromáticas): P03 com a pergunta, a ajuda e a IA genéricas', v.telas['M4.P03'].pergunta === P['M4.P03'].pergunta && tv.includes('Ex.: farinha, ovos, açúcar, embalagem.') && tv.includes(GEN1) && !tv.includes(AL1) && !/Brownie: 200 g/.test(tv));
    check('não alimento: resumo com a ficha técnica genérica do produto', v.finalTodo.includes(D.base.find((x) => x.codigo === 'M4.BT09').definicao));
    /* Produto + Serviço de alimento: a parte do produto vira receita; a ficha do serviço não muda */
    const ps = await caminho(page, { 'M4.P02': 'Produto+ Serviço', 'M4.P06': 'NS', 'M4.P14': 'Aceitar agendamento ou reserva antes de atender' }, { 'lg2-turma-a-m01': { R: { 'M1.P03': { estado: 'valor', valor: 'brownies artesanais' } } } });
    check('alimento + serviço: P03 de receita e P06 com a ficha do serviço de antes', ps.telas['M4.P03'].pergunta === AL.pergunta && so(ps.telas['M4.P06'].corpo).includes(P['M4.P06'].prompt_ia.split('\n')[0]) && /ficha técnica do seu atendimento/.test(ps.telas['M4.P06'].todo));
    /* Mercadoria de comida (compra pronta): continua a ficha de mercadoria */
    const mc = await caminho(page, { 'M4.P01': 'Revenda de chocolates', 'M4.P02': 'Mercadoria' });
    check('alimento comprado pronto (Mercadoria): continua a lista de mercadorias', /comprar prontas para revender/.test(mc.telas['M4.P03'].pergunta));
  }
  {
    /* estado da versão 2: opção antiga da pergunta 4 é traduzida */
    await page.evaluate(() => { localStorage.clear(); localStorage.setItem('lg2-turma-a-m04', JSON.stringify({ v: 2, R: { 'M4.P01': { estado: 'valor', valor: 'Bolo' }, 'M4.P02': { estado: 'opcao', opcao: 'Produto' }, 'M4.P03': { estado: 'valor', valor: 'farinha' }, 'M4.P04': { estado: 'opcao', opcao: 'Plataformas (ifood)' } }, hist: ['M4.P01', 'M4.P02', 'M4.P03', 'M4.P04'] })); });
    await page.reload(); await page.click('#ir');
    const t = await tela();
    check('estado v2: P04 "Plataformas (ifood)" vira "Plataformas (iFood)"', JSON.stringify(t.sel) === '["Plataformas (iFood)"]', t.sel);
    await page.evaluate(() => document.querySelector('#ok').click());
    check('estado v2: ao responder, grava como versão 6, em lista, com a opção nova', await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('lg2-turma-a-m04')); return s.v === 6 && JSON.stringify(s.R['M4.P04']) === JSON.stringify({ estado: 'opcoes', opcoes: ['Plataformas (iFood)'] }); }));
  }


  /* ================= 3º lote de 05/11/2026 (relatório da Júlia) ================= */
  const so = (x) => String(x || '').replace(/\s+/g, ' ');
  {
    /* 1. papel e caneta na abertura */
    await page.evaluate(() => localStorage.clear()); await page.reload();
    check('J1: abertura pede papel e caneta à mão (em "Como funciona")', /papel e caneta à mão para anotar o que precisar/.test(await page.evaluate(() => document.body.textContent)));
  }
  {
    /* 2. sem "Próximo passo" nas perguntas, menos na 8; na 11, alerta e próximo passo num alerta só */
    const c = await caminho(page, { 'M4.P02': 'Produto+ Serviço', 'M4.P05': '2', 'M4.P11': 'Preço' });
    const comProx = c.visitadas.filter((k) => /Próximo passo/i.test(c.telas[k].corpo));
    check('J2: "Próximo passo" só aparece na pergunta do primeiro cliente', JSON.stringify(comProx) === '["M4.P08"]', comProx);
    const t8 = so(c.telas['M4.P08'].corpo), t11 = so(c.telas['M4.P11'].corpo);
    check('J2 + G: pergunta 8 mantém o próximo passo; o alerta geral foi para a dica (antes de responder)', so(c.telas['M4.P08'].todo).includes(so(P['M4.P08'].alerta).trim()) && t8.includes(so(P['M4.P08'].proximo)));
    const at11 = await page.evaluate(() => 0);
    check('J2 + G: pergunta 11: alerta e próximo passo juntos, agora na dica; nenhum balão "Atenção" depois de responder', so(P['M4.P11'].alerta).includes('Gostar da própria ideia') && so(P['M4.P11'].alerta).includes('compare o seu motivo') && !P['M4.P11'].proximo && !/Atenção/i.test(t11.split(c.telas['M4.P11'].pergunta).pop().split('Continuar')[0]) && !/Próximo passo/i.test(t11) && so(c.telas['M4.P11'].todo).includes(so(P['M4.P11'].alerta).trim()), t11.slice(0, 300));
    /* G: nenhuma pergunta mostra balão "Atenção" no retorno de uma resposta comum */
    /* (a pergunta 15 com "Sim" é o risco real, com o seu aviso conferido à parte) */
    const comBalao = c.visitadas.filter((k) => k !== 'M4.P15' && /\bAtenção\b/i.test(so(c.telas[k].corpo).split(c.telas[k].pergunta).pop().split('Continuar')[0]));
    check('G: nenhum balão "Atenção" depois de responder (orientação geral está na dica)', comBalao.length === 0, comBalao);
    const r01 = D.regras.find((r) => r.codigo === 'M4.R01');
    check('J2: pergunta 1 não repete o alerta "frases muito amplas" depois de responder', !so(c.telas['M4.P01'].corpo).includes(so(r01.alerta)) && so(c.telas['M4.P01'].corpo).includes(so(r01.texto)));
    check('J2: resumo sem "Próximo passo: Próxima pergunta."', !/Próxima pergunta\./.test(c.finalTodo));
    void at11;
  }
  {
    /* 3. pergunta 4 com caixas de seleção */
    await abrirEm('M4.P04', { 'M4.P02': 'Produto', 'M4.P05': '2' });
    const info = await page.evaluate(() => ({ n: document.querySelectorAll('#ent.multipla .opcao.caixa-sel[aria-pressed]').length, ns: !!document.querySelector('#ns') }));
    check('J3 + 16/11: pergunta 4 mostra 5 caixas de seleção, sem "Não sei"', info.n === 5 && !info.ns && await page.evaluate(() => ![...document.querySelectorAll('#ent .opcao')].some((x) => x.dataset.op === 'Não sei')), info);
    check('16/11: opções da pergunta 4 com exemplo curto embaixo (o texto da opção não muda)', await page.evaluate(() => [...document.querySelectorAll('#ent .opcao')].every((x) => /^Ex\.: /.test((x.querySelector('.op-sub') || {}).textContent || '') && x.dataset.op === x.querySelector('.op-txt b').textContent)));
    await page.evaluate(() => { const b = [...document.querySelectorAll('#ent .opcao')]; b.forEach((x) => x.classList.contains('sel') && x.click()); });
    await page.evaluate(() => document.querySelector('#ok').click());
    check('J3: nenhuma marcada = erro e não grava', await page.evaluate(() => !document.querySelector('#erro').hidden && /Marque pelo menos uma/.test(document.querySelector('#erro').textContent)));
    const marcar = (t) => page.evaluate((t) => [...document.querySelectorAll('#ent .opcao')].find((x) => x.querySelector('.op-txt b').textContent === t).click(), t);
    await marcar('De porta a porta pessoalmente'); await marcar('Retirada presencial pelo cliente');
    check('J3: duas opções ficam marcadas juntas', JSON.stringify((await tela()).sel) === '["De porta a porta pessoalmente","Retirada presencial pelo cliente"]', (await tela()).sel);
    check('D: múltipla escolha com aria-pressed "true" nas marcadas e "false" nas outras', await page.evaluate(() => [...document.querySelectorAll('#ent .opcao')].every((x) => x.getAttribute('aria-pressed') === (['De porta a porta pessoalmente', 'Retirada presencial pelo cliente'].includes(x.dataset.op) ? 'true' : 'false'))));
    await marcar('De porta a porta pessoalmente'); await marcar('Entregador parceiro');
    await page.evaluate(() => document.querySelector('#ok').click());
    check('J3: grava a lista na ordem das opções', JSON.stringify((await estado())['M4.P04']) === JSON.stringify({ estado: 'opcoes', opcoes: ['Entregador parceiro', 'Retirada presencial pelo cliente'] }), (await estado())['M4.P04']);
    await semPassoExtra(); await page.evaluate(() => document.querySelector('#v').click());
    check('J3: voltar mostra as duas marcadas', JSON.stringify((await tela()).sel) === '["Entregador parceiro","Retirada presencial pelo cliente"]');
    /* estado v3 (opção única) vira lista de um item */
    await page.evaluate(() => { localStorage.clear(); localStorage.setItem('lg2-turma-a-m04', JSON.stringify({ v: 3, R: { 'M4.P01': { estado: 'valor', valor: 'Bolo' }, 'M4.P02': { estado: 'opcao', opcao: 'Produto' }, 'M4.P03': { estado: 'valor', valor: 'farinha' }, 'M4.P04': { estado: 'opcao', opcao: 'Loja própria ou parceira' } }, hist: ['M4.P01', 'M4.P02', 'M4.P03', 'M4.P04'] })); });
    await page.reload(); await page.click('#ir');
    const selV3 = (await tela()).sel;
    await page.evaluate(() => document.querySelector('#ok').click());
    check('J3: estado v3 com opção única vira lista de um item (v6)', JSON.stringify(selV3) === '["Loja própria ou parceira"]' && await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('lg2-turma-a-m04')); return s.v === 6 && s.R['M4.P04'].estado === 'opcoes' && s.R['M4.P04'].opcoes[0] === 'Loja própria ou parceira'; }));
    const r = await caminho(page, { 'M4.P02': 'Produto', 'M4.P05': '2', 'M4.P04': 'Entregador parceiro' });
    check('J3: resumo mostra as formas de entrega', r.finalTodo.includes('Entregador parceiro'));
    /* relatório do Bento: a 4ª tela (como o produto chega até o cliente) aceita várias formas, também com produto + serviço */
    for (const tipo of ['Produto', 'Produto+ Serviço']) {
      await abrirEm('M4.P04', { 'M4.P02': tipo, 'M4.P05': '2', 'M4.P06': 'Agenda e material' });
      const t4 = await page.evaluate(() => ({ passo: (document.querySelector('.passo') || {}).textContent || '', cx: document.querySelectorAll('#ent.multipla .opcao.caixa-sel[aria-pressed]').length }));
      const marcar4 = (t) => page.evaluate((t) => [...document.querySelectorAll('#ent .opcao')].find((x) => x.querySelector('.op-txt b').textContent === t).click(), t);
      await page.evaluate(() => document.querySelectorAll('#ent .opcao.sel').forEach((x) => x.click()));   // a resposta do caminho fica desmarcada
      await marcar4('De porta a porta pessoalmente'); await marcar4('Plataformas (iFood)'); await marcar4('Retirada presencial pelo cliente');
      check(`Bento (${tipo}): pergunta 4 com caixas de seleção e três formas marcadas juntas`, /Pergunta 4 de/.test(t4.passo) && t4.cx === 5 && (await tela()).sel.length === 3, [t4, (await tela()).sel]);
    }
  }
  {
    /* auditoria 17/11: pergunta 9 respondida aqui antes; a Etapa 3 tem outro problema -> lembrança discreta; igual -> nada */
    const base9 = { v: 6, hist: ['M4.P01', 'M4.P02', 'M4.P03', 'M4.P04', 'M4.P05', 'M4.P07', 'M4.P08', 'M4.P09'], R: { 'M4.P01': { estado: 'valor', valor: 'Bolo de pote' }, 'M4.P02': { estado: 'opcao', opcao: 'Produto' }, 'M4.P03': { estado: 'valor', valor: 'farinha' }, 'M4.P04': { estado: 'opcoes', opcoes: ['Retirada presencial pelo cliente'] }, 'M4.P05': { estado: 'valor', valor: '2' }, 'M4.P07': { estado: 'valor', valor: 'bolo' }, 'M4.P08': { estado: 'valor', valor: 'pais da escola' }, 'M4.P09': { estado: 'valor', valor: 'Sem tempo de manhã' } } };
    const ref9 = async (m3) => { await page.evaluate(([a, b]) => { localStorage.clear(); localStorage.setItem('lg2-turma-a-m04', JSON.stringify(a)); if (b) localStorage.setItem('lg2-turma-a-m03', JSON.stringify(b)); }, [base9, m3]); await page.reload(); await page.click('#ir'); return page.evaluate(() => ({ cod: document.querySelector('.cartao-q').dataset.cod, q: document.querySelector('.q').textContent, ref: (document.querySelector('#ref-etapa') || {}).textContent || '' })); };
    let r9 = await ref9({ v: 7, R: { 'M3.P11': { estado: 'valor', valor: 'Falta de tempo para cozinhar.' } } });
    check('auditoria 17/11: pergunta 9 pede o momento do dia a dia (diferente da Etapa 3) e lembra o problema dito lá', r9.cod === 'M4.P09' && /momento do dia a dia/.test(r9.q) && r9.ref === 'Na Etapa 3 você disse que o problema do cliente é: “Falta de tempo para cozinhar”. Agora pense em quando ele sente isso no dia a dia.', r9);
    r9 = await ref9(null);
    check('auditoria 17/11: sem resposta na Etapa 3, a pergunta 9 não mostra a lembrança', r9.cod === 'M4.P09' && r9.ref === '', r9);
    r9 = await ref9({ v: 7, R: { 'M3.P11': { estado: 'valor', valor: 'Sem tempo de manhã' } } });
    check('auditoria 17/11: lembrança não aparece quando o campo já tem a mesma resposta da Etapa 3', r9.ref === '', r9);
  }
  {
    /* 5. perguntas 12 e 13 sem "Não sei" */
    check('J5: perguntas 12 e 13 sem "Não sei" nos dados', !/Não sei/.test(P['M4.P12'].opcoes) && !/Não sei/.test(P['M4.P13'].opcoes));
    await abrirEm('M4.P12', { 'M4.P02': 'Produto', 'M4.P05': '2' });
    check('J5: pergunta 12 sem botão "Não sei"', await page.evaluate(() => !document.querySelector('#ns')));
    await digitar('');
    const s12 = await situacao('M4.P12');
    check('J5: pergunta 12 vazia pede a resposta e aponta o exemplo', /Escreva a sua resposta/.test(s12.erro) && /exemplo/.test(s12.erro) && !s12.seguir, s12);
    await digitar('Para pais da escola, bolo de pote na saída'); await semPassoExtra();
    check('J5: pergunta 13 sem botão "Não sei"', (await page.evaluate(NA_PAGINA.atual)) === 'M4.P13' && await page.evaluate(() => !document.querySelector('#ns')));
  }
  {
    /* 6. proposta de valor (lida pelo Módulo 10) */
    const ENUN = { 'M4.PV1': 'Qual problema do cliente o seu produto resolve?', 'M4.PV2': 'Por que o cliente escolheria o seu produto em vez de outro?', 'M4.PV3': 'Qual é o principal benefício que ele recebe?' };
    check('J6: três perguntas M4.PV1–PV3 com o texto combinado', Object.entries(ENUN).every(([k, v]) => P[k] && P[k].pergunta === v && P[k].tipo === 'Texto'));
    const ordem = D.perguntas.map((p) => p.codigo);
    check('J6: ficam depois da pergunta do motivo (P11) e antes da frase da proposta (P12)', ordem.indexOf('M4.P11') + 1 === ordem.indexOf('M4.PV1') && ordem.indexOf('M4.PV3') + 1 === ordem.indexOf('M4.P12'), ordem);
    const c = await caminho(page, { 'M4.P01': 'Bolo de pote', 'M4.P02': 'Produto', 'M4.P05': '2', 'M4.P09': 'Pais sem tempo de fazer lanche', 'M4.P10': 'Lanche pronto sem esforço', 'M4.P11': 'Conveniência', 'M4.P12': 'Para pais da escola, bolo de pote na saída' });
    check('auditoria 17/11: sem M3.P21, a pergunta 10 não mostra lembrança da Etapa 3', c.telas['M4.P10'].ref3 === '' && !/Na Etapa 3 você disse/.test(c.telas['M4.P10'].corpo), c.telas['M4.P10'].ref3);
    check('auditoria 17/11: rascunho da 12 montado com o que você oferece, o problema (9), o ganho (10) e o motivo (11)', /^Ofereço bolo de pote para resposta de teste\. Resolvo este problema: pais sem tempo de fazer lanche\. O cliente ganha: lanche pronto sem esforço\. Por que comprar de mim: conveniência\.$/.test(c.telas['M4.P12'].valor0), c.telas['M4.P12'].valor0);
    check('auditoria 17/11: a frase editada pela pessoa é a que fica gravada na 12', (await estado())['M4.P12'].valor === 'Para pais da escola, bolo de pote na saída' && !(await estado())['M4.P12'].de && !(await estado())['M4.P12'].igual);
    check('J6 + F: P11 respondida -> PV2 reutilizada sem repetir; PV1 e PV3 não repetem 9 e 10', c.visitadas.join(',').includes('M4.P11,M4.P12') && !['M4.PV1','M4.PV2','M4.PV3'].some((k) => c.visitadas.includes(k)), c.visitadas);
    const R = await estado();
    check('J6: PV1–PV3 gravadas em campos value compatíveis com Módulo 10 (origem interna registrada)', ['M4.PV1','M4.PV2','M4.PV3'].every((k) => R[k].estado === 'valor' && typeof R[k].valor === 'string') && R['M4.PV1'].valor === 'Pais sem tempo de fazer lanche' && R['M4.PV1'].igual === 'M4.P09' && R['M4.PV2'].valor === 'Conveniência' && R['M4.PV2'].igual === 'M4.P11' && R['M4.PV3'].valor === 'Lanche pronto sem esforço' && R['M4.PV3'].igual === 'M4.P10', [R['M4.PV1'], R['M4.PV2'], R['M4.PV3']]);
    const caixa = await page.evaluate(() => document.querySelector('.entendemos').innerText);
    check('J6: "O que entendemos até aqui" traz a proposta de valor', caixa.includes('o cliente escolheria você porque “Conveniência”'), caixa);
    const card = await page.evaluate(() => ((document.querySelector('.proposta-valor') || {}).textContent || '').replace(/\s+/g, ' '));   // fica em "Mais detalhes"
    check('J6: resultado tem o cartão "Por que comprar de você (sua proposta de valor)" com as três respostas', /Por que comprar de você \(sua proposta de valor\)/.test(card) && card.includes('Conveniência') && card.includes(ENUN['M4.PV1']) && card.includes(ENUN['M4.PV3']), card);
    /* Trocar no resultado: a PV1 abre com o problema da pergunta 9 e "Confira e ajuste se quiser" */
    await page.evaluate(() => document.querySelector('[data-trocar="M4.PV1"]').click());
    let t = await tela();
    check('J6 + F: "Trocar" abre a PV1 com o problema da pergunta 9', (await page.evaluate(NA_PAGINA.atual)) === 'M4.PV1' && t.campo === 'Pais sem tempo de fazer lanche' && /Veio da sua resposta anterior/.test(t.txt), t.campo);
    await page.evaluate(() => document.querySelector('#ok').click());
    check('J6: confirmar a PV1 grava sem marca de outro módulo', JSON.stringify((await estado())['M4.PV1']) === JSON.stringify({ estado: 'valor', valor: 'Pais sem tempo de fazer lanche' }));
    /* serviço: rota direta isolada para testar texto; na jornada normal, P11 alimenta PV2 sem repetir pergunta. */
    await page.evaluate(() => { localStorage.clear(); localStorage.setItem('lg2-turma-a-m04', JSON.stringify({ v: 6, R: { 'M4.P02': { estado: 'opcao', opcao: 'Serviço' } }, hist: ['M4.PV2'] })); });
    await page.reload(); await page.click('#ir');
    const servPV2 = await tela();
    check('J6: serviço lê "serviço" no enunciado da PV2', servPV2.q === 'Por que o cliente escolheria o seu serviço em vez de outro?' && await page.evaluate(() => !document.querySelector('#ns')));
  }


  /* ================= 5º lote de 05/11/2026 (Nayara: revenda de joias; Arthur: marmitas) ================= */
  const M1_JOIAS = { 'lg2-turma-a-m01': { R: { 'M1.P03': { estado: 'valor', valor: 'Revenda de joias folheadas' }, 'M1.P03A': { estado: 'opcao', opcao: 'Mercadoria: compro pronto para revender' } } } };
  {
    /* receita C: "‹ Voltar" no topo do cartão da pergunta */
    await page.evaluate(() => localStorage.clear()); await page.reload(); await page.click('#ir');
    const v = await page.evaluate(() => { const c = document.querySelector('.cartao-q'), b = c.querySelector('#v'); return { primeiro: c.firstElementChild === b, antesDaPergunta: !!(b.compareDocumentPosition(c.querySelector('.q')) & Node.DOCUMENT_POSITION_FOLLOWING), n: document.querySelectorAll('#v, .voltar').length, esq: b.getBoundingClientRect().left - c.getBoundingClientRect().left }; });
    check('C: Voltar é o 1º item do cartão, à esquerda, acima da pergunta, e não há outro embaixo', v.primeiro && v.antesDaPergunta && v.n === 1 && v.esq < 30, v);
    check('C: nome acessível do botão é exatamente "Voltar"', await page.getByRole('button', { name: 'Voltar', exact: true }).count() === 1);
    await page.getByRole('button', { name: 'Voltar', exact: true }).click();
    check('C: na 1ª pergunta, Voltar leva à capa', !!(await page.$('#ir')));
    await abrirEm('M4.P09', { 'M4.P02': 'Produto', 'M4.P05': '2' });
    await page.getByRole('button', { name: 'Voltar', exact: true }).click();
    check('C: no meio do módulo, Voltar leva à pergunta anterior', (await page.evaluate(NA_PAGINA.atual)) === 'M4.P08');
  }
  {
    /* item 1 (receita D): dica longa = essencial à vista + "Ver mais" fechado */
    /* o que fica à vista: a ajuda inteira quando há "Ver mais" (ajuda_mais) ou é curta; senão, a 1ª frase */
    const aVista = (ajuda, mais) => (mais || ajuda.length <= 220 ? ajuda : (ajuda.match(/^[\s\S]+?[.!?](?=\s)/) || [ajuda])[0]).length;
    const vista = [];
    Object.values(P).forEach((q) => {
      if (q.ajuda) vista.push([q.codigo, aVista(q.ajuda, q.ajuda_mais)]);
      Object.entries(q.por_tipo || {}).forEach(([t, o]) => { if (o.ajuda) vista.push([q.codigo + ' ' + t, aVista(o.ajuda, 'ajuda_mais' in o ? o.ajuda_mais : q.ajuda_mais)]); });
      (q.variantes || []).forEach((o) => { if (o.ajuda) vista.push([q.codigo + ' versão', aVista(o.ajuda, '')]); });
    });
    const longas = vista.filter(([, n]) => n > 230);
    check('D: nenhuma dica mostra mais de ~230 letras antes do "Ver mais"', longas.length === 0, longas);
    await page.evaluate(() => localStorage.clear()); await page.reload(); await page.click('#ir');
    const abrirDica = () => page.evaluate(() => { document.querySelector('details.dica-toggle').open = true; });   // a pessoa toca em "Ver dica"
    await abrirDica();
    let d = await page.evaluate(() => { const x = document.querySelector('.dica .dica-resto'); return { vista: document.querySelector('.dica .ajuda').innerText, fechado: !!x && !x.open, sum: x && x.querySelector('summary').textContent, resto: x && x.textContent }; });
    check('D: pergunta 1 mostra como descrever + exemplo; o resto fica em "Ver mais" fechado', /Descreva como explicaria/.test(d.vista) && /bolo de pote para lanche escolar/.test(d.vista) && !/muito amplas/.test(d.vista) && d.fechado && d.sum === 'Ver mais' && /muito amplas/.test(d.resto), d);
    await abrirEm('M4.P06', { 'M4.P02': 'Serviço', 'M4.P14': 'Atender poucos clientes, já cobrando' });
    await abrirDica();
    d = await page.evaluate(() => { const x = document.querySelector('.dica .dica-resto'); return { vista: document.querySelector('.dica .ajuda').innerText, fechado: !!x && !x.open, resto: x && x.textContent }; });
    check('D: pergunta da ficha do serviço: o que anotar à vista; exemplo da manicure em "Ver mais"', /ficha técnica do seu atendimento/.test(d.vista) && !/manicure/.test(d.vista) && d.fechado && /manicure em domicílio/.test(d.resto), d);
    await abrirEm('M4.P14', { 'M4.P02': 'Produto', 'M4.P05': '2' });
    d = await page.evaluate(() => { const c = document.querySelector('.conceitos-juntos'); const det = c && c.querySelector('details'); return { exFechado: !!det && !det.open, ok: document.querySelector('#ok').getBoundingClientRect().top + scrollY, ent: document.querySelector('#ent').getBoundingClientRect().top + scrollY }; });
    check('D: na pergunta 14, os exemplos dos três jeitos de testar ficam em "Ver exemplos" fechado', d.exFechado, d);
  }
  {
    /* item 2: quem é o cliente já foi respondido antes -> pergunta 8 vem preenchida */
    const M3_DUAS = { 'lg2-turma-a-m03': { v: 5, R: { 'M3.P10': { estado: 'opcao', opcao: 'Pessoas comuns (consumidor final)', opcoes: ['Pessoas comuns (consumidor final)', 'Empresas'], campos: { 'Idade': '25 a 45', 'Ocupação': 'trabalha no centro', 'Ramo': 'salões de beleza' } } } } };
    const c = await caminho(page, { 'M4.P02': 'Mercadoria' }, Object.assign({}, M1_JOIAS, M3_DUAS));
    const t8 = c.telas['M4.P08'];
    check('Cliente: perfil do Módulo 3 com duas opções marcadas vem na pergunta 8, com o selo', /Veio da Etapa 3/.test(t8.corpo) && /Confira e ajuste se quiser/.test(t8.corpo), t8.corpo.slice(0, 500));
    await abrirEm('M4.P08', { 'M4.P02': 'Mercadoria', 'M4.P08': undefined }, Object.assign({}, M1_JOIAS, M3_DUAS));
    await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('lg2-turma-a-m04')); delete s.R['M4.P08']; localStorage.setItem('lg2-turma-a-m04', JSON.stringify(s)); });
    await page.reload(); await page.click('#ir');
    const campo = await page.evaluate(() => document.querySelector('#ent textarea').value);
    check('Cliente: texto trazido junta as duas opções e os campos (Módulo 3)', campo === 'Pessoas comuns e Empresas (idade: 25 a 45; ocupação: trabalha no centro; ramo: salões de beleza)', campo);
    const m2 = await caminho(page, { 'M4.P02': 'Mercadoria' }, Object.assign({}, M1_JOIAS, { 'lg2-turma-b-m02': { R: { 'M2.P02': { estado: 'valor', valor: 'Mulheres de 25 a 45 anos que gostam de acessórios' } } } }));
    check('Cliente + F: sem perfil no Módulo 3, o público específico do Módulo 2 é usado sem repetir a pergunta 8 (cartão "Veio da Etapa 2")', !m2.visitadas.includes('M4.P08') && /Veio da Etapa 2/.test(m2.telas['M4.P09'].corpo) && /Trocar/.test(m2.telas['M4.P09'].corpo), m2.visitadas);
  }
  {
    /* lote 4 (Ana Luiza, Pergunta 8): público amplo ou várias opções do Módulo 3 -> herdado + selo + aviso curto que não trava */
    const abrir8 = async (m3, extra) => {
      await abrirEm('M4.P08', { 'M4.P02': 'Mercadoria', 'M4.P08': undefined }, M1_JOIAS);
      await page.evaluate(([m3, extra]) => {
        const s = JSON.parse(localStorage.getItem('lg2-turma-a-m04')); delete s.R['M4.P08']; localStorage.setItem('lg2-turma-a-m04', JSON.stringify(s));
        if (m3) localStorage.setItem('lg2-turma-a-m03', JSON.stringify(m3)); else localStorage.removeItem('lg2-turma-a-m03');
        Object.entries(extra || {}).forEach(([k, v]) => localStorage.setItem(k, JSON.stringify(v)));
      }, [m3, extra]);
      await page.reload(); await page.click('#ir');
      return page.evaluate(() => ({ campo: document.querySelector('#ent textarea').value, txt: document.querySelector('.cartao-q').innerText, aviso: (document.getElementById('aviso-amplo') || {}).innerText || '' }));
    };
    const DUAS = { v: 5, R: { 'M3.P10': { estado: 'opcao', opcao: 'Pessoas comuns (consumidor final)', opcoes: ['Pessoas comuns (consumidor final)', 'Empresas'], campos: { 'Idade': '25 a 45', 'Ramo': 'salões de beleza' } } } };
    let t = await abrir8(DUAS);
    check('Amplo: duas opções do Módulo 3 -> texto trazido, selo e aviso "escolha o grupo principal para começar"', /^Pessoas comuns e Empresas \(/.test(t.campo) && /Veio da Etapa 3/.test(t.txt) && /mais de um tipo de cliente \(Pessoas comuns e Empresas\)/.test(t.aviso) && /escolha o grupo principal para começar/.test(t.aviso) && /pode seguir assim/.test(t.aviso), t);
    check('Amplo: o aviso não fala em "não generalizado" nem traz código', !/generaliz|M3\.|P10/.test(t.aviso), t.aviso);
    if (process.env.SHOTS) { await page.waitForTimeout(400); await page.screenshot({ path: path.join(process.env.SHOTS, 'l4_m04_p08_publico_amplo.png') }); }
    await page.evaluate(() => document.querySelector('#ok').click());
    let s = await situacao('M4.P08');
    check('Amplo: Continuar sem mudar nada grava o trazido e segue (não trava)', s.salvo && /^Pessoas comuns e Empresas/.test(s.salvo) && s.seguir && !s.erro, s);
    check('Amplo: resposta mantida guarda a origem (Módulo 3)', (await estado())['M4.P08'].de === 3);
    /* formato novo do Módulo 3: várias opções marcadas, sem campos */
    t = await abrir8({ v: 7, R: { 'M3.P10': { estado: 'opcao', opcao: 'Mães que trabalham fora', opcoes: ['Mães que trabalham fora', 'Estudantes'] } } });
    check('Amplo (formato novo do Módulo 3): várias opções viram o texto trazido + aviso', t.campo === 'Mães que trabalham fora e Estudantes' && /Veio da Etapa 3/.test(t.txt) && /Mães que trabalham fora e Estudantes/.test(t.aviso), t);
    /* uma opção só, sem detalhe: categoria ampla */
    t = await abrir8({ v: 6, R: { 'M3.P10': { estado: 'opcao', opcao: 'Pessoas comuns (consumidor final)', opcoes: ['Pessoas comuns (consumidor final)'] } } });
    check('Amplo: só "Pessoas comuns", sem detalhe -> aviso de público amplo', t.campo === 'Pessoas comuns' && /ainda está amplo/.test(t.aviso) && /escolha o grupo principal/.test(t.aviso), t);
    /* "Ainda não tenho clientes" = sem cliente definido: não vira resposta nem aviso */
    t = await abrir8({ v: 7, R: { 'M3.P10': { estado: 'opcao', opcao: 'Ainda não tenho clientes', opcoes: ['Ainda não tenho clientes'] } } });
    check('"Ainda não tenho clientes" no Módulo 3: pergunta 8 vazia, sem selo e sem aviso', t.campo === '' && !/Veio da Etapa/.test(t.txt) && !t.aviso, t);
    t = await abrir8({ v: 7, R: { 'M3.P10': { estado: 'opcao', opcao: 'Ainda não tenho clientes', opcoes: ['Ainda não tenho clientes'] } } }, { 'lg2-turma-b-m02': { R: { 'M2.P02': { estado: 'valor', valor: 'Mães que trabalham fora, do bairro Centro' } } } });
    check('"Ainda não tenho clientes" no Módulo 3: vale o cliente do Módulo 2, sem aviso', t.campo === 'Mães que trabalham fora, do bairro Centro' && /Veio da Etapa 2/.test(t.txt) && !t.aviso, t);
    t = await abrir8({ v: 7, R: { 'M3.P10': { estado: 'opcao', opcao: 'Ainda não tenho clientes', opcoes: ['Ainda não tenho clientes'] } } }, { 'lg2-turma-b-m02': { R: { 'M2.P02': { estado: 'valor', valor: 'Todo mundo que gosta de doce' } } } });
    check('Texto amplo do Módulo 2 ("todo mundo") também gera o aviso', /Veio da Etapa 2/.test(t.txt) && /ainda está amplo/.test(t.aviso), t);
    /* público específico (uma opção com detalhes): sem aviso */
    t = await abrir8({ v: 6, R: { 'M3.P10': { estado: 'opcao', opcao: 'Pessoas comuns (consumidor final)', opcoes: ['Pessoas comuns (consumidor final)'], campos: { 'Idade': '30 a 50', 'Onde mora': 'bairro São Pedro' } } } });
    check('Público específico do Módulo 3: selo, sem aviso de público amplo', /Veio da Etapa 3/.test(t.txt) && !t.aviso, t);
  }
  {
    /* item 3: pergunta 11, "Outro" abre campo e grava o texto junto */
    await abrirEm('M4.P11', { 'M4.P02': 'Mercadoria' }, M1_JOIAS);
    const escolher = (op) => page.evaluate((op) => [...document.querySelectorAll('#ent .opcao')].find((x) => x.dataset.op === op).click(), op);
    const campoOutro = () => page.evaluate(() => { const l = document.querySelector('.outro-campo'); return { visivel: !!l && !l.hidden && l.offsetHeight > 0, foco: document.activeElement === (l && l.querySelector('textarea')), rotulo: l && l.querySelector('span').textContent }; });
    await escolher('Preço');
    check('Outro: com outra opção marcada, o campo fica escondido', !(await campoOutro()).visivel);
    await escolher('Outro');
    let o = await campoOutro();
    check('Outro: ao tocar em "Outro" abre um campo para escrever, já com o cursor', o.visivel && o.foco && o.rotulo === 'Qual é esse outro motivo?', o);
    await page.focus('.outro-campo textarea'); await page.setViewportSize({ width: 390, height: 450 }); await page.waitForTimeout(700);
    const bc = await page.locator('.outro-campo textarea').boundingBox(), bo = await page.locator('#ok').boundingBox();
    check('Outro: com o teclado aberto (390x450), o campo e o Continuar ficam visíveis', bc && bo && bc.y >= 0 && bc.y + bc.height <= 450 && bo.y >= 0 && bo.y + bo.height <= 450, { bc, bo });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => document.querySelector('#ok').click());
    const s0 = await situacao('M4.P11');
    check('Outro: campo vazio pede o texto e não grava', /Escreva qual é o outro motivo/.test(s0.erro) && !s0.seguir && ((await estado())['M4.P11'] || {}).opcao === 'Preço', s0);
    await page.fill('.outro-campo textarea', 'Peças com garantia de um ano');
    await page.evaluate(() => document.querySelector('#ok').click());
    check('Outro: grava a opção e o texto ({opcao:"Outro", detalhe})', JSON.stringify((await estado())['M4.P11']) === JSON.stringify({ estado: 'opcao', opcao: 'Outro', detalhe: 'Peças com garantia de um ano' }), (await estado())['M4.P11']);
    await semPassoExtra();
    const pv2 = await estado();
    check('F: PV2 reutiliza o motivo escrito em P11 sem repetir a pergunta; mantém formato valor e origem interna', pv2['M4.PV2'].valor === 'Peças com garantia de um ano' && pv2['M4.PV2'].igual === 'M4.P11' && (await page.evaluate(NA_PAGINA.atual)) === 'M4.P12', pv2['M4.PV2']);
    await page.getByRole('button', { name: 'Voltar', exact: true }).click();
    o = await page.evaluate(() => ({ v: (document.querySelector('.outro-campo textarea') || {}).value, aberto: !!document.querySelector('.outro-campo') && !document.querySelector('.outro-campo').hidden }));
    check('Outro: ao voltar, o campo aparece aberto com o texto', o.v === 'Peças com garantia de um ano' && o.aberto, o);
    const c = await caminho(page, { 'M4.P02': 'Mercadoria', 'M4.P11': 'Outro' }, M1_JOIAS).catch((e) => ({ erro: String(e) }));
    check('Outro: "Outro" sem texto para na pergunta 11 (campo obrigatório)', !!c.telas && c.telas['M4.P11'].bloqueado === true, c.erro || c.visitadas);
  }
  {
    /* resumo com o "Outro" escrito */
    await page.evaluate(() => { localStorage.clear(); localStorage.setItem('lg2-turma-a-m04', JSON.stringify({ v: 5, R: { 'M4.P01': { estado: 'valor', valor: 'Joias folheadas' }, 'M4.P02': { estado: 'opcao', opcao: 'Mercadoria+ Serviço' }, 'M4.P10': { estado: 'valor', valor: 'Ficar bonita gastando pouco' }, 'M4.P11': { estado: 'opcao', opcao: 'Outro', detalhe: 'Peças com garantia de um ano' } }, hist: ['RESULTADO'] })); });
    await page.reload(); await page.click('#ir');
    const r = await page.evaluate(() => ({ lista: document.querySelector('details.respostas').textContent, caixa: document.querySelector('.entendemos').innerText }));
    check('Outro: resumo mostra "Outro: texto" e o tipo como "Mercadoria + Serviço"', r.lista.includes('Outro: Peças com garantia de um ano') && r.lista.includes('Mercadoria + Serviço'), r.lista.slice(0, 600));
    check('Outro: "O que entendemos" usa o motivo escrito', r.caixa.includes('escolheria você por “Peças com garantia de um ano”'), r.caixa);
  }
  {
    /* item 4: protótipo e oferta mínima explicados junto da pré-venda, e dica ao tocar cada opção */
    await abrirEm('M4.P14', { 'M4.P02': 'Mercadoria' }, M1_JOIAS);
    check('leve: na pergunta 14, os jeitos de testar ficam em "Ver dica", fechada', await page.evaluate(() => { const d = document.querySelector('details.dica-toggle'); return !!d && !d.open && !!d.querySelector('.conceitos-juntos'); }));
    await page.evaluate(() => { document.querySelector('details.dica-toggle').open = true; });
    const caixa = await page.evaluate(() => { const c = document.querySelector('.conceitos-juntos'); return c ? { txt: c.innerText, antesDasOpcoes: !!(c.compareDocumentPosition(document.querySelector('#ent')) & Node.DOCUMENT_POSITION_FOLLOWING) } : null; });
    const B = (c) => D.base.find((b) => b.codigo === c);
    check('Teste: protótipo, oferta mínima e pré-venda no mesmo cartão, antes das opções', !!caixa && caixa.antesDasOpcoes && ['M4.BT05', 'M4.BT04', 'M4.BT07'].every((c) => caixa.txt.includes(B(c).definicao)) && /Protótipo:/.test(caixa.txt) && /Oferta mínima/.test(caixa.txt) && /Pré-venda:/.test(caixa.txt), caixa);
    check('Teste: protótipo explicado sem a sigla MVP', !/MVP/.test(B('M4.BT05').definicao) && /não mostra se as pessoas pagariam/.test(B('M4.BT05').definicao));
    check('Teste: sem texto fixo embaixo de cada opção; uma só dica, a da opção marcada', await page.evaluate(() => !document.querySelector('#ent .op-sub') && document.querySelectorAll('#dica-op').length === 1 && document.querySelector('#dica-op').textContent === window.MODULO4.perguntas.find((x) => x.codigo === 'M4.P14').opcoes_explica[document.querySelector('#ent .opcao.sel').dataset.op]));
    const toque = async (op) => { await page.evaluate((op) => [...document.querySelectorAll('#ent .opcao')].find((x) => x.dataset.op === op).click(), op); return page.evaluate(() => { const d = document.querySelector('#dica-op'); return d.hidden ? '' : d.textContent; }); };
    const vistos = {};
    for (const op of PROD_P14) vistos[op] = await toque(op);
    check('16/11: pergunta 14 (como você quer testar) sem "Não sei"', await page.evaluate(() => ![...document.querySelectorAll('#ent .opcao')].some((x) => x.dataset.op === 'Não sei')));
    check('Teste: tocar cada opção mostra o que ela significa', PROD_P14.filter((op) => op !== 'Não sei').every((op) => vistos[op] === P['M4.P14'].opcoes_explica[op]) && /^Isto é um protótipo/.test(vistos['Mostrar uma amostra sem cobrar']) && /^Isto é uma oferta mínima/.test(vistos['Vender pouca quantidade, já com preço']) && /^Isto é uma pré-venda/.test(vistos['Aceitar encomenda ou reserva antes de fazer']), vistos);
    const s = await caminho(page, { 'M4.P02': 'Serviço', 'M4.P14': 'Aceitar agendamento ou reserva antes de atender' });
    const ts = s.telas['M4.P14'];
    check('Teste (serviço): oferta mínima e pré-venda explicadas; a dica da opção escolhida aparece', /Oferta mínima/.test(ts.todo) && /Pré-venda:/.test(ts.todo) && !/Protótipo:/.test(ts.todo) && ts.corpo.includes(P['M4.P14'].opcoes_explica['Aceitar agendamento ou reserva antes de atender']) && !/produto/i.test(ts.corpo.split('Continuar')[0].replace(/Produto,/g, '')), ts.corpo.slice(0, 900));
  }
  {
    /* item 5: pergunta 16, "Não sei" sem texto sobre o aplicativo */
    {
      const c = await caminho(page, { 'M4.P02': 'Mercadoria', 'M4.P16': 'Sim' }, M1_JOIAS);
      const t = so(c.telas['M4.P16'].corpo);
      check('P16 "Sim": sem o texto roxo sobre o app ("O app não guarda dados")', !/O app não guarda|aplicativo não guarda/.test(t), t.slice(0, 600));
      check('16/11: P16 (vai anotar dados?) é escolha da pessoa: só Sim e Não', JSON.stringify(c.telas['M4.P16'].opcoes) === '["Sim","Não"]', c.telas['M4.P16'].opcoes);
      const h = await caminho(page, { 'M4.P02': 'Mercadoria', 'M4.P14': 'Vender pouca quantidade, já com preço', 'M4.P15': 'NS' }, M1_JOIAS);
      check('H: P15 (regra externa/licença) mantém Sim, Não e Não sei; Não sei mostra Como descobrir e bloqueia', JSON.stringify(h.telas['M4.P15'].opcoes) === '["Sim","Não","Não sei"]' && h.telas['M4.P15'].ns.igual && !h.telas['M4.P15'].ns.seguir && /Como descobrir/.test(h.telas['M4.P15'].todo), h.telas['M4.P15'].ns);
    }
    check('P16 "Não sei": orientação fala do negócio da pessoa (contato dos clientes)', /contato dos clientes/.test(P['M4.P16'].resposta_naosei) && !/\bapp\b|aplicativo/i.test(P['M4.P16'].resposta_naosei));
  }
  {
    /* item 6: gramática, escrita e espaçamento */
    const tudo = JSON.stringify(D);
    const RUINS2 = ['Mercadoria, produto ou serviço', 'Lembre-se: Dizer', '‘as pessoas vão gostar’', 'compraria/marcaria um horário [produto ou serviço]', 'Ao invés de', 'pessoas reservarem, ou então', 'pagariam 18 reais', '200g farinha', 'dados pessoais já que', 'cartão de experimento', 'risco, é preciso', 'condições de gastos', 'opção Outra.', 'como é no caso de', 'Pense se para você e para o seu negócio,', 'pareça incompleto"', 'desconforto algum, proporcionando um produto de qualidade', 'O app não guarda dados dos seus clientes'];
    const achados = RUINS2.filter((r) => tudo.includes(r));
    check('L5 textos: erros de escrita encontrados foram corrigidos', achados.length === 0, achados);
    check('L5 textos: regra do "Não sei" da pergunta 1 termina com ponto', /incompleto\.$/.test(D.regras.find((r) => r.codigo === 'M4.R02').texto));
  }

  /* ================= lote 16/11/2026 ================= */
  {
    /* B: conta do custo por unidade na ficha técnica, com "Como calculamos" ao vivo (conferida à mão) */
    await abrirEm('M4.P03', { 'M4.P01': 'Brownie artesanal', 'M4.P02': 'Produto', 'M4.P05': '2' });
    await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('lg2-turma-a-m04')); delete s.R['M4.P03']; localStorage.setItem('lg2-turma-a-m04', JSON.stringify(s)); });
    await page.reload(); await page.click('#ir');
    check('B: ficha do alimento traz a conta do custo por unidade (fechada, opcional)', await page.evaluate(() => { const d = document.querySelector('details.calc-ficha'); return !!d && !d.open && /custo de cada unidade/i.test(d.querySelector('summary').textContent); }));
    await page.evaluate(() => { document.querySelector('details.calc-ficha').open = true; });
    for (const [sel, v] of [['#f-rec', '30'], ['#f-ren', '12'], ['#f-per', '2'], ['#f-emb', '0,5']]) await page.fill(sel, v);
    await page.locator('#f-rec').focus(); await page.locator('#f-emb').focus(); await page.locator('#f-ren').focus();
    let res = await page.evaluate(() => ({ t: document.querySelector('#f-res').innerText.replace(/\s+/g, ' '), rec: document.querySelector('#f-rec').value, emb: document.querySelector('#f-emb').value }));
    /* à mão: 12 − 2 = 10 unidades boas; 30 ÷ 10 = 3,00; 3,00 + 0,50 = 3,50 */
    const LINHA = 'Como calculamos: R$ 30,00 (receita) ÷ 10 unidades boas (12 que rende − 2 perdidas) = R$ 3,00 por unidade; R$ 3,00 + R$ 0,50 (embalagem) = R$ 3,50 por unidade.';
    check('B: custo por unidade R$ 3,50 com a linha "Como calculamos" e os valores da pessoa', res.t.includes('Custo de cada unidade: R$ 3,50') && res.t.includes(LINHA), res.t);
    check('B: dinheiro no padrão brasileiro dentro do campo (30 → 30,00; 0,5 → 0,50)', res.rec === '30,00' && res.emb === '0,50', res);
    await page.fill('#f-emb', '1'); await page.fill('#f-per', '0'); await page.fill('#f-rec', '10'); await page.fill('#f-ren', '3');
    res = await page.evaluate(() => document.querySelector('#f-res').innerText.replace(/\s+/g, ' '));
    /* à mão: 10 ÷ 3 = 3,333… → R$ 3,33; 3,33 + 1,00 = 4,33 */
    check('B: a linha se atualiza ao vivo e o arredondamento bate (10 ÷ 3 = R$ 3,33; + R$ 1,00 = R$ 4,33)', res.includes('Custo de cada unidade: R$ 4,33') && res.includes('R$ 10,00 (receita) ÷ 3 unidades = R$ 3,33 por unidade; R$ 3,33 + R$ 1,00 (embalagem) = R$ 4,33 por unidade.'), res);
    await page.fill('#f-per', '3');
    check('B: perdidas iguais ao rendimento = aviso, sem número', /perdidas precisam ser menos/.test(await page.evaluate(() => document.querySelector('#f-res').innerText)));
    await page.fill('#f-per', '0');
    await page.fill('#ent textarea', '200 g de chocolate, 3 ovos; rende 3');
    await page.evaluate(() => document.querySelector('#ok').click());
    const r3 = (await estado())['M4.P03'];
    check('B: grava a lista como antes (valor) e a conta à parte (ficha)', r3.valor === '200 g de chocolate, 3 ovos; rende 3' && JSON.stringify(r3.ficha) === JSON.stringify({ receita: 10, rende: 3, perda: 0, embalagem: 1, custo_unidade: 4.33 }), r3);
    check('B + A: a conta com "Como calculamos" fica ao vivo na ficha; um toque em Continuar grava e abre a pergunta 4', (await page.evaluate(NA_PAGINA.atual)) === 'M4.P04' && (await page.evaluate(NA_PAGINA.extra)) === '');
    const fim = await caminho(page, { 'M4.P01': 'Brownie artesanal', 'M4.P02': 'Produto', 'M4.P05': '2', 'M4.P03': '200 g de chocolate' }).catch((e) => ({ erro: String(e) }));
    void fim;
    await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('lg2-turma-a-m04')); s.R['M4.P03'].ficha = { receita: 30, rende: 12, perda: 2, embalagem: 0.5, custo_unidade: 3.5 }; localStorage.setItem('lg2-turma-a-m04', JSON.stringify(s)); });
    await page.reload(); await page.click('#ir');
    const lista = await page.evaluate(() => { document.querySelector('details.respostas').open = true; return document.querySelector('details.respostas').innerText.replace(/\s+/g, ' '); });
    check('B: no resumo, a resposta da ficha mostra o custo e a conta', lista.includes('Custo de cada unidade: R$ 3,50') && lista.includes(LINHA), lista.slice(0, 500));
    const nao = await caminho(page, { 'M4.P01': 'Revenda de roupas', 'M4.P02': 'Mercadoria' });
    check('B: mercadoria (compra pronto) não tem a conta da receita', !/custo de cada unidade/i.test(nao.telas['M4.P03'].todo));
  }
  {
    /* A: "Não sei" salvo antes do lote vira "sem resposta", sem apagar as outras; reabre com a ajuda à vista */
    await page.evaluate(() => { localStorage.clear(); localStorage.setItem('lg2-turma-a-m04', JSON.stringify({ v: 5, R: { 'M4.P01': { estado: 'valor', valor: 'Bolo de pote' }, 'M4.P02': { estado: 'opcao', opcao: 'Produto' }, 'M4.P03': { estado: 'naosei' }, 'M4.P04': { estado: 'opcoes', opcoes: ['Não sei'] }, 'M4.P05': { estado: 'valor', valor: '2' }, 'M4.P08': { estado: 'naosei' }, 'M4.P09': { estado: 'valor', valor: 'Pais sem tempo' }, 'M4.P11': { estado: 'opcao', opcao: 'Não sei' }, 'M4.P14': { estado: 'opcao', opcao: 'Não sei' }, 'M4.P20': { estado: 'valor', valor: '7' } }, hist: ['M4.P01', 'M4.P02', 'M4.P03'] })); });
    await page.reload(); await page.click('#ir');
    const R = await estado();
    check('A: estado antigo — os "Não sei" viram sem resposta e as outras respostas ficam', !R['M4.P03'] && !R['M4.P04'] && !R['M4.P08'] && !R['M4.P11'] && !R['M4.P14'] && R['M4.P01'].valor === 'Bolo de pote' && R['M4.P09'].valor === 'Pais sem tempo' && R['M4.P20'].valor === '7', R);
    const t = await page.evaluate(() => ({ cod: document.querySelector('.passo').textContent, como: !!document.querySelector('#como .como-descobrir'), campo: document.querySelector('#ent textarea').value }));
    check('A: a pergunta que era "Não sei" reabre vazia, com "Como descobrir" à vista', /Pergunta 3 de/.test(t.cod) && t.como && t.campo === '', t);
    await page.evaluate(() => { const i = document.querySelector('#ent textarea'); i.value = 'farinha, ovos'; document.querySelector('#ok').click(); });
    await semPassoExtra();
    check('A: respondida, segue e não apaga respostas depois nem chaves reaproveitadas', (await estado())['M4.P09'] && (await estado())['M4.P20'] && (await estado())['M4.P03'].valor === 'farinha, ovos');
    /* resultado: o que ficou para responder, com o botão "Responder agora" */
    await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('lg2-turma-a-m04')); s.hist.push('RESULTADO'); localStorage.setItem('lg2-turma-a-m04', JSON.stringify(s)); });
    await page.reload(); await page.click('#ir');
    const f = await page.evaluate(() => { const x = document.querySelector('.falta'); return x ? { t: x.innerText, n: x.querySelectorAll(':scope > ul > li').length } : null; });
    check('A: relatório lista os "Não sei" antigos ainda sem resposta (entrega, cliente, motivo e teste)', !!f && f.n === 4 && /Responder agora/.test(f.t), f);
    await page.click('#responder-falta');
    check('A: "Responder agora" abre a primeira pergunta antiga que ainda falta (P04), sem restaurar a resposta Não sei', (await page.evaluate(NA_PAGINA.atual)) === 'M4.P04' && await page.evaluate(() => !document.querySelector('#ns')));
  }
  {
    /* J: migração em estado de mesmo formato do progresso real; apenas valores inventados, sem texto de backups. */
    const seed = { v: 5, hist: ['M4.P01','M4.P02','M4.P03','M4.P04','M4.P08','M4.P09','M4.P10','M4.P11','M4.PV1','M4.PV2','M4.PV3','RESULTADO'], R: {
      'M4.P01': { estado: 'valor', valor: 'Item fictício', de: 1 }, 'M4.P02': { estado: 'opcao', opcao: 'Produto', de: 1 },
      'M4.P03': { estado: 'naosei' }, 'M4.P04': { estado: 'opcoes', opcoes: ['Retirada presencial pelo cliente'] },
      'M4.P08': { estado: 'valor', valor: 'grupo inventado', de: 3 }, 'M4.P09': { estado: 'valor', valor: 'problema fictício', de: 3 },
      'M4.P10': { estado: 'valor', valor: 'benefício inventado' }, 'M4.P11': { estado: 'opcao', opcao: 'Preço' },
      'M4.PV1': { estado: 'valor', valor: 'problema fictício' }, 'M4.PV2': { estado: 'valor', valor: 'motivo inventado' },
      'M4.PV3': { estado: 'valor', valor: 'benefício inventado' }
    } };
    const keep = structuredClone(seed.R); delete keep['M4.P03'];
    await page.evaluate((seed) => { localStorage.clear(); localStorage.setItem('lg2-turma-a-m04', JSON.stringify(seed)); }, seed);
    await page.reload(); await page.click('#ir');
    const mig = await estado();
    check('J: migração de estado no formato real preserva respostas concretas e chaves reutilizadas; remove só Não sei', JSON.stringify(mig) === JSON.stringify(keep), Object.keys(mig));
    check('J: estado migrado grava v6, remove só Não sei e mantém a chave no histórico', await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('lg2-turma-a-m04')); return s.v === 6 && !s.R['M4.P03'] && s.hist.includes('M4.P03') && s.R['M4.P01'].valor === 'Item fictício'; }));
    const visibles = ['Item fictício','Produto','Retirada presencial pelo cliente','grupo inventado','problema fictício','benefício inventado','Preço','motivo inventado'];
    const corpoMigrado = await page.evaluate(() => document.body.innerText);
    check('J: todas as respostas concretas migradas aparecem no relatório aberto', visibles.every((v) => corpoMigrado.includes(v)) && await page.evaluate(() => document.querySelector('details.respostas').open), visibles.filter((v) => !corpoMigrado.includes(v)));
  }
  {
    /* D: opções com exemplo curto embaixo, pelo tipo do negócio */
    await abrirEm('M4.P11', { 'M4.P02': 'Produto', 'M4.P05': '2' });
    const ex = await page.evaluate(() => Object.fromEntries([...document.querySelectorAll('#ent .opcao')].map((x) => [x.dataset.op, (x.querySelector('.op-sub') || {}).textContent || ''])));
    check('D: pergunta 11 com exemplo embaixo das opções (o texto da opção não muda)', /^Ex\.: entrega em casa/.test(ex['Conveniência']) && /^Ex\./.test(ex['Prazo/rapidez']) && ex['Não sei'] === '' && Object.keys(ex).join('|') === P['M4.P11'].opcoes.split(';').map((x) => x.trim()).filter(Boolean).join('|'), ex);
    const s = await caminho(page, { 'M4.P02': 'Serviço', 'M4.P14': 'Atender poucos clientes, já cobrando' });
    check('D: no serviço, os exemplos falam de serviço (atende na casa do cliente; marcaram horário)', /atende na casa do cliente/.test(s.telas['M4.P11'].corpo) && /marcaram horário/.test(s.telas['M4.P17'].corpo), s.telas['M4.P17'].corpo.slice(0, 400));
    check('D: pergunta 12 sem o termo "proposta de valor" no enunciado', !/proposta de valor/i.test(P['M4.P12'].pergunta));
  }

  /* ================= versão leve (13/11/2026) ================= */
  {
    const vistas = Object.keys(PALAVRAS), acima = Object.entries(PALAVRAS).filter(([, n]) => n > LIMITE_PALAVRAS), REPETIDAS = ['M4.PV1','M4.PV2','M4.PV3'];
    check('F: PV1–PV3 reutilizadas no fluxo sem segunda tela; as demais perguntas foram medidas', Object.keys(P).filter((k) => !REPETIDAS.includes(k)).every((k) => vistas.includes(k)) && REPETIDAS.every((k) => !vistas.includes(k)), Object.keys(P).filter((k) => !vistas.includes(k)));
    check(`leve: texto da pergunta tem até ${LIMITE_PALAVRAS} palavras visíveis antes de tocar (exemplos e cartões reutilizados verificados à parte; maiores: ${Object.entries(PALAVRAS).sort((x, y) => y[1] - x[1]).slice(0, 3).map(([k, n]) => k + ' ' + n).join(', ')})`, acima.length === 0, acima);
    check('leve: enunciados curtos (até 15 palavras)', Object.values(P).every((q) => q.pergunta.split(/\s+/).length <= 15 && Object.values(q.por_tipo || {}).every((o) => !o.pergunta || o.pergunta.split(/\s+/).length <= 15)), Object.values(P).filter((q) => q.pergunta.split(/\s+/).length > 15).map((q) => q.codigo));
    await page.evaluate(() => localStorage.clear()); await page.reload();
    const capa = await page.evaluate(() => ({ n: (() => { const n = (t) => t.split(/\s+/).filter((w) => /[A-Za-zÀ-ÿ0-9]/.test(w)).length; return n(document.querySelector('#tela').innerText) - [...document.querySelectorAll('.p-linha-integrada, .p-fontes summary')].reduce((a, e) => a + n(e.innerText), 0); })(), frase: (document.querySelector('.heroi-txt p') || {}).textContent || '', tempo: (document.querySelector('.tempo') || {}).textContent || '', como: (() => { const d = document.querySelector('details.como-funciona'); return !!d && !d.open && /Como funciona/.test(d.querySelector('summary').textContent); })(), cartoes: document.querySelectorAll('main > div.cartao').length }));
    check('leve: capa = título + uma frase + tempo + Começar; o resto em "Como funciona" fechado', capa.n <= LIMITE_PALAVRAS && (capa.frase.match(/[.!?]/g) || []).length === 1 && /^Esta etapa leva cerca de \d+ minutos$/.test(capa.tempo) && capa.como && capa.cartoes === 0 && (await page.textContent('#ir')) === 'Começar', capa);
    const c = await caminho(page, { 'M4.P02': 'Produto', 'M4.P05': '2', 'M4.P09': 'NS', 'M4.P14': 'Aceitar encomenda ou reserva antes de fazer', 'M4.P19': '5', 'M4.P20': '7' });
    const r = await page.evaluate(() => { const m = document.querySelector('main.corpo'); const filhos = [...m.children].map((x) => x.className || x.tagName); return { filhos, fechados: [...m.querySelectorAll('details')].map((d) => d.open), tarefa: (document.querySelector('.tarefa') || {}).innerText || '' }; });
    check('lote I: relatório abre todas as seções recolhíveis; dicas nas perguntas continuam fechadas', r.filhos.indexOf('entendemos') === 1 && /tarefa/.test(r.filhos[2]) && r.fechados.length >= 2 && r.fechados.every(Boolean), r.fechados);
    check('leve: a próxima tarefa usa o teste planejado (encomenda, 7 dias, meta 5)', /aceitar encomenda ou reserva antes de fazer, por 7 dias/.test(r.tarefa) && /meta: 5/.test(r.tarefa) && !/Primeiro, responda/.test(r.tarefa), r.tarefa);
    void c;
  }

  /* ================= lote 17/11/2026 ("tira a fricção") ================= */
  check('A: nenhum "Seguir" nem "Corrigir minha resposta" em nenhuma tela', A17.extras.length === 0, A17.extras.slice(0, 5));
  check('A: cada pergunta avança com UM toque em Continuar (só "Não sei", "Outro" vazio e aviso de número param)', A17.semAvanco.length === 0, A17.semAvanco);
  check(`A: o retorno da resposta aparece na tela antes do Continuar (${A17.retornoVivo} telas)`, A17.retornoVivo >= 30, A17.retornoVivo);
  check('D: em toda pergunta de escolha, aria-pressed acompanha a opção marcada', A17.aria.length === 0, A17.aria.slice(0, 3));
  check('D: depois de cada Continuar, o foco está no enunciado da pergunta nova', A17.foco.length === 0, A17.foco.slice(0, 5));
  check('G: "Pergunta N de 21" com total fixo; número e barra nunca voltam ao avançar', A17.contador.length === 0, A17.contador.slice(0, 3));
  check('E: nenhuma tela de pergunta nem resultado diz "Módulo"', A17.palavrasModulo.length === 0, [...new Set(A17.palavrasModulo)]);
  {
    /* A: escolha — o retorno aparece no toque, e um toque em Continuar abre a próxima */
    await abrirEm('M4.P15', { 'M4.P02': 'Produto', 'M4.P05': '2', 'M4.P14': 'Vender pouca quantidade, já com preço' });
    await page.evaluate(() => [...document.querySelectorAll('#ent .opcao')].find((x) => x.dataset.op === 'Não').click());   // a resposta salva no caminho era "Sim"
    const antes = await page.evaluate(() => document.querySelector('#retorno').innerText);
    await page.evaluate(() => [...document.querySelectorAll('#ent .opcao')].find((x) => x.dataset.op === 'Sim').click());
    const vivo = await page.evaluate(() => ({ t: document.querySelector('#retorno').innerText, cod: document.querySelector('.cartao-q').dataset.cod, live: document.querySelector('#retorno').getAttribute('aria-live') }));
    check('A: escolha — no toque em "Sim" o aviso e o retorno da Anvisa aparecem logo abaixo, ainda na mesma pergunta', !/Anvisa/.test(antes) && /consulte a Anvisa/.test(vivo.t) && /Atenção/i.test(vivo.t) && vivo.cod === 'M4.P15' && vivo.live === 'polite', vivo);
    await page.evaluate(() => [...document.querySelectorAll('#ent .opcao')].find((x) => x.dataset.op === 'Não').click());
    check('A: trocar a escolha atualiza o retorno ao vivo (some o aviso)', !/consulte a Anvisa/.test(await page.evaluate(() => document.querySelector('#retorno').innerText)));
    await page.evaluate(() => document.querySelector('#ok').click());
    check('A: um toque em Continuar grava "Não" e abre a pergunta 16', (await page.evaluate(NA_PAGINA.atual)) === 'M4.P16' && (await estado())['M4.P15'].opcao === 'Não');
    /* B: pergunta de escolha ainda sem resposta (a 2, começando do zero) */
    await page.evaluate(() => localStorage.clear()); await page.reload(); await page.click('#ir');
    await page.evaluate(NA_PAGINA.responder, 'Bolo de pote');
    await page.evaluate(() => document.querySelector('#ok').click());
    const b = await page.evaluate(() => { const e = document.querySelector('#erro'), ac = document.querySelector('#acoes'); return { t: e.hidden ? '' : e.textContent, role: e.getAttribute('role'), acimaDoBotao: e.parentElement === ac && e.nextElementSibling === document.querySelector('#ok'), cod: document.querySelector('.cartao-q').dataset.cod }; });
    check('B: sem resposta, Continuar (ativo) mostra "Escolha uma opção para continuar." com role=alert logo acima do botão', b.t === 'Escolha uma opção para continuar.' && b.role === 'alert' && b.acimaDoBotao && b.cod === 'M4.P02', b);
    await abrirEm('M4.P21', { 'M4.P02': 'Produto', 'M4.P05': '2' });
    await page.fill('#ent input', '');
    check('A: na última pergunta o botão se chama "Ver meu resumo"', (await page.textContent('#ok')).trim() === 'Ver meu resumo');
    await page.evaluate(() => document.querySelector('#ok').click());
    check('B: campo vazio mostra "Escreva a sua resposta para continuar…" com role=alert', await page.evaluate(() => /^Escreva a sua resposta para continuar/.test(document.querySelector('#erro').textContent) && !document.querySelector('#erro').hidden && document.querySelector('#erro').getAttribute('role') === 'alert'));
    await page.fill('#ent input', '50');
    await page.evaluate(() => document.querySelector('#ok').click());
    check('A: "Ver meu resumo" abre o resultado num toque', /Resumo das suas respostas/.test(await page.evaluate(() => document.body.innerText)));
    /* E: resultado e link do fim */
    const fim = await page.evaluate(() => { const a = document.querySelector('div.acoes.lg2-proximo > a'); const r = a.getBoundingClientRect(); return { txt: a.textContent, href: a.getAttribute('href'), visivel: r.height > 0 && getComputedStyle(a).visibility !== 'hidden', conc: document.querySelector('.concluido h2').textContent, corpo: document.querySelector('#tela').textContent }; });
    check('E: o fim diz "Você concluiu a Etapa 4" e o link é exatamente "Ir para a Etapa 5", visível, dentro de div.acoes.lg2-proximo', fim.txt === 'Ir para a Etapa 5' && fim.href === '/lg2/turma-a/m05/index.html' && fim.visivel && fim.conc === 'Você concluiu a Etapa 4', fim);
    check('E: resultado (com as seções abertas) sem "Módulo"', !/m[óo]dulo/i.test(fim.corpo), (fim.corpo.match(/.{40}m[óo]dulo.{20}/i) || [])[0]);
    await page.evaluate(() => localStorage.clear()); await page.reload();
    const capaT = await page.evaluate(() => document.querySelector('#tela').textContent);
    await page.evaluate(() => { document.querySelector('details.como-funciona').open = true; }); await page.click('#limites');
    const limT = await page.evaluate(() => document.querySelector('#tela').textContent);
    check('E: capa (com "Como funciona") e limites sem "Módulo"; trilha diz "Etapa 4"', !/m[óo]dulo/i.test(capaT + limT) && /Etapa 4/.test(capaT), ((capaT + limT).match(/.{40}m[óo]dulo.{20}/i) || [])[0]);
    const min = Math.max(5, Math.round((TIPICO * 35) / 60 / 5) * 5);
    check(`G: tempo da capa = caminho típico (${TIPICO} perguntas × 35 s, arredondado a 5 min = ${min} min)`, TIPICO >= 15 && D.leve.minutos === min && capaT.includes(`Esta etapa leva cerca de ${min} minutos`), { TIPICO, min, dado: D.leve.minutos });
  }
  {
    /* C: Continuar inteiro na tela, sem rolar, em celular pequeno, letra grande e celular deitado */
    const fora = [];
    let vistas = 0;
    for (const [w, h, fs] of [[360, 640, ''], [390, 844, '130%'], [740, 360, '']]) {
      for (const [mapa, outros] of [[{ 'M4.P02': 'Produto+ Serviço', 'M4.P05': '5', 'M4.P07': 'Resposta de teste', 'M4.P17': 'Outra' }, {}], [{}, { 'lg2-turma-a-m01': M1_SERV, 'lg2-turma-a-m03': M3_CLI }]]) {
        await page.setViewportSize({ width: w, height: h });
        await page.evaluate((o) => { localStorage.clear(); Object.entries(o).forEach(([k, v]) => localStorage.setItem(k, JSON.stringify(v))); }, outros);
        await page.reload();
        if (fs) await page.evaluate((f) => { document.documentElement.style.fontSize = f; }, fs);
        await page.click('#ir');
        for (let i = 0; i < 40; i++) {
          const cod = await page.evaluate(NA_PAGINA.atual);
          if (!cod || cod === 'RESULTADO') break;
          const mede = () => page.evaluate(() => { const r = document.querySelector('#ok').getBoundingClientRect(); return { top: Math.round(r.top), bottom: Math.round(r.bottom), alto: innerHeight, rolou: Math.round(scrollY) }; });
          const m0 = await mede();
          const ops = await page.evaluate(() => [...document.querySelectorAll('#ent .opcao')].map((x) => x.dataset.op).filter((o) => o !== 'Não sei'));
          const v = mapa[cod] !== undefined ? mapa[cod] : ops.length ? ops[0] : /N[uú]mero/.test(P[cod].tipo) ? '5' : 'Resposta de teste';
          await page.evaluate(NA_PAGINA.preparar, v);
          const m1 = await mede();
          for (const [m, quando] of [[m0, 'ao abrir'], [m1, 'depois de responder']]) if (!(m.top >= 0 && m.bottom <= m.alto && m.rolou === 0)) fora.push({ tela: `${w}x${h}${fs ? ' ' + fs : ''}`, cod, quando, ...m });
          vistas++;
          await page.evaluate(() => document.querySelector('#ok').click());
          if ((await page.evaluate(NA_PAGINA.atual)) === cod) { fora.push({ cod, travou: true }); break; }
        }
        if (fs) await page.evaluate(() => { document.documentElement.style.fontSize = ''; });
      }
    }
    await page.setViewportSize({ width: 390, height: 844 });
    check(`C: Continuar inteiro à vista sem rolar em 360x640, 390x844 a 130% e 740x360 (${vistas} telas de pergunta, ao abrir e depois de responder)`, fora.length === 0 && vistas >= 90, fora.slice(0, 6));
    const css = await page.evaluate(() => { const a = getComputedStyle(document.querySelector('#acoes') || document.body); return [a.position, a.bottom, a.backgroundColor]; });
    void css;
  }
  {
    /* F: alvos de toque com pelo menos 44 px (resumos "Ver dica"/"Como funciona"/"Ver mais", Trocar, Copiar, Voltar, Início) */
    const pequenos = [];
    const medir = async (nome) => {
      const r = await page.evaluate(() => {
        document.querySelectorAll('#tela details').forEach((d) => { d.open = true; });
        return [...document.querySelectorAll('#tela summary, #tela button, #tela a.btn, #tela .lg2-proximo a')]
          .filter((e) => e.getClientRects().length && !e.closest('[hidden]'))
          .map((e) => [e.textContent.trim().slice(0, 30), Math.round(e.getBoundingClientRect().height * 10) / 10]).filter(([, h]) => h < 44);
      });
      r.forEach((x) => pequenos.push(nome + ': ' + x.join(' = ')));
      return r;
    };
    await page.evaluate(() => localStorage.clear()); await page.reload(); await medir('capa');
    await page.click('#limites'); await medir('limites');
    await page.reload(); await page.click('#ir'); await page.click('#ns'); await medir('P01 Não sei');
    await abrirEm('M4.P03', { 'M4.P01': 'Brownie artesanal', 'M4.P02': 'Produto', 'M4.P05': '2' }); await medir('P03 ficha');
    await abrirEm('M4.P14', { 'M4.P02': 'Produto', 'M4.P05': '2' }); await medir('P14');
    await semear({ 'lg2-turma-a-m01': M1_SERV, 'lg2-turma-a-m03': M3_CLI }); await medir('P06 Já sabemos');
    await caminho(page, { 'M4.P02': 'Produto', 'M4.P05': '2' }, { 'lg2-turma-a-m03': { v: 7, R: { 'M3.P21': { estado: 'valor', valor: 'Entrego na porta da escola' } } } }); await medir('resultado');
    check('F: todo resumo recolhível, botão e link-botão do módulo tem pelo menos 44 px de altura', pequenos.length === 0, pequenos.slice(0, 10));
  }

  /* ---- lote 26/11 (Ana Beatriz): quem JÁ VENDE (Etapa 1) não passa pelo bloco do teste da primeira oferta ---- */
  {
    const BLOCO = ['M4.P13', 'M4.P14', 'M4.P15', 'M4.P16', 'M4.P17', 'M4.P18', 'M4.P19', 'M4.P20', 'M4.P21'];
    const m1 = (op) => ({ 'lg2-turma-a-m01': { R: { 'M1.P01': { estado: 'opcao', opcao: op } } } });
    /* respostas antigas do bloco (de quando a pessoa ainda não vendia): ficam salvas, só deixam de aparecer */
    const ANTIGAS = { 'M4.P13': { estado: 'valor', valor: 'Acho que vão gostar' }, 'M4.P14': { estado: 'opcao', opcao: 'Vender pouca quantidade, já com preço' }, 'M4.P15': { estado: 'opcao', opcao: 'Não' },
      'M4.P16': { estado: 'opcao', opcao: 'Sim' }, 'M4.P17': { estado: 'opcao', opcao: 'Pedidos/reservas' }, 'M4.P19': { estado: 'valor', valor: '5' }, 'M4.P20': { estado: 'valor', valor: '7' }, 'M4.P21': { estado: 'valor', valor: '50' } };
    const capaTempo = async (outros) => { await page.evaluate((o) => { localStorage.clear(); Object.entries(o).forEach(([k, v]) => localStorage.setItem(k, JSON.stringify(v))); }, outros); await page.reload(); return page.evaluate(() => (document.querySelector('.tempo') || {}).textContent || ''); };
    const resumo = () => page.evaluate(() => ({ tarefa: (document.querySelector('.tarefa p') || {}).textContent || '', ent: (document.querySelector('.entendemos') || {}).textContent || '',
      prox: (() => { const a = document.querySelector('.lg2-proximo a'); return a && a.getClientRects().length ? a.textContent.trim() : ''; })() }));
    for (const op of ['Já vendo sempre', 'Já vendi algumas vezes']) {
      const tempo = await capaTempo(m1(op));
      check(`26/11 (${op}): tempo da capa pelo caminho mais curto (5 minutos)`, /cerca de 5 minutos/.test(tempo), tempo);
      const outros = Object.assign(m1(op), op === 'Já vendo sempre' ? { 'lg2-turma-a-m04': { v: 6, R: ANTIGAS, hist: [] } } : {});
      const n0 = A17.contador.length;
      const c = await caminho(page, { 'M4.P02': 'Produto', 'M4.P05': '2' }, outros, { de: 12 });
      const vistas = c.visitadas.filter((x) => BLOCO.includes(x));
      check(`26/11 (${op}): nenhuma pergunta do teste da primeira oferta (13 a 21) aparece`, vistas.length === 0 && c.visitadas[c.visitadas.length - 1] === 'M4.P12', c.visitadas);
      check(`26/11 (${op}): contador "Pergunta N de 12" e barra que nunca volta`, A17.contador.length === n0 && c.visitadas.length > 0, A17.contador.slice(n0));
      check(`26/11 (${op}): na última pergunta (12) o botão já é "Ver meu resumo"`, /Ver meu resumo/.test((c.telas['M4.P12'] || {}).depois || ''));
      const r = await resumo();
      check(`26/11 (${op}): resultado troca o plano de teste por uma frase simples para quem já vende`, /^Como você já vende, use as vendas de agora para conferir o que funciona/.test(r.tarefa) && /Como você já vende, não precisa de um teste da primeira oferta/.test(r.ent), r);
      const textosBloco = BLOCO.map((k) => P[k].pergunta);
      check(`26/11 (${op}): resultado sem "não informado", sem pendência de teste e sem as perguntas do teste`, !/não informado|No primeiro teste|faça o teste|antes de testar|antes de gastar com o teste/i.test(c.finalTodo) && !textosBloco.some((t) => c.finalTodo.includes(t)) && !/Confira estes números/.test(c.finalTodo), textosBloco.filter((t) => c.finalTodo.includes(t)));
      check(`26/11 (${op}): a caixa "Ir para a Etapa 5" continua igual e visível`, r.prox === 'Ir para a Etapa 5', r.prox);
      if (op === 'Já vendo sempre') {
        const R = await estado();
        check('26/11: respostas antigas do bloco do teste continuam salvas (não apagadas)', Object.keys(ANTIGAS).every((k) => JSON.stringify(R[k]) === JSON.stringify(ANTIGAS[k])), Object.keys(ANTIGAS).filter((k) => JSON.stringify(R[k]) !== JSON.stringify(ANTIGAS[k])));
        /* "Revisar respostas" passa pelo caminho de novo e as respostas antigas seguem salvas */
        await page.evaluate(() => document.querySelector('#rev').click());
        check('26/11: "Revisar respostas" de quem já vende começa sem o bloco do teste', !BLOCO.includes(await page.evaluate(NA_PAGINA.atual)) && (await page.evaluate(NA_PAGINA.contador) || {}).de === 12);
        /* "Continuar de onde parei" com histórico antigo parado na pergunta 14: não reabre o bloco */
        await page.evaluate((a) => { const s = JSON.parse(localStorage.getItem('lg2-turma-a-m04')); s.hist = ['M4.P01', 'M4.P02', 'M4.P13', 'M4.P14']; s.R = Object.assign({ 'M4.P01': { estado: 'valor', valor: 'Bolo de pote' }, 'M4.P02': { estado: 'opcao', opcao: 'Produto' } }, a); localStorage.setItem('lg2-turma-a-m04', JSON.stringify(s)); }, ANTIGAS);
        await page.reload(); await page.click('#ir');
        const onde = await page.evaluate(NA_PAGINA.atual);
        check('26/11: "Continuar de onde parei" parado no bloco do teste volta para fora dele', onde && !BLOCO.includes(onde), onde);
        const R2 = await estado();
        check('26/11: depois de continuar, as respostas antigas do bloco seguem salvas', Object.keys(ANTIGAS).every((k) => JSON.stringify(R2[k]) === JSON.stringify(ANTIGAS[k])));
      }
    }
    /* quem ainda não vende (ou sem Etapa 1): tudo como antes */
    for (const [nome, outros] of [['Ainda está só na minha cabeça', m1('Ainda está só na minha cabeça')], ['Já fiz um pouco para testar ou dar de amostra', m1('Já fiz um pouco para testar ou dar de amostra')], ['sem Etapa 1', {}]]) {
      const tempo = await capaTempo(outros);
      check(`26/11 (${nome}): tempo da capa como antes (10 minutos)`, /cerca de 10 minutos/.test(tempo), tempo);
      const n0 = A17.contador.length;
      const c = await caminho(page, { 'M4.P02': 'Produto', 'M4.P05': '2', 'M4.P14': 'Vender pouca quantidade, já com preço' }, outros);
      const falta = BLOCO.filter((k) => k !== 'M4.P18' && !c.visitadas.includes(k));
      check(`26/11 (${nome}): o bloco do teste aparece inteiro (13 a 21), com "Pergunta N de 21"`, falta.length === 0 && A17.contador.length === n0, { falta, cont: A17.contador.slice(n0) });
      const r = await resumo();
      check(`26/11 (${nome}): resultado mantém o plano de teste`, /^Faça o teste/.test(r.tarefa) && /No primeiro teste, você vai vender pouca quantidade/.test(r.ent) && !/Como você já vende/.test(r.tarefa + r.ent) && r.prox === 'Ir para a Etapa 5', r);
    }
  }

  check('nenhum texto "Rafael" aparece em nenhuma tela', rafael.length === 0, rafael);
  check('o roteiro de vídeo (P14) não aparece', !/Vídeo \(conteúdo/.test(cfim.telas['M4.P14'].corpo));
  check('sem erro de JavaScript na página', errosJS.length === 0, errosJS);

  /* ---- prints de celular ---- */
  if (process.env.SHOTS) {
    const S = process.env.SHOTS, foto = async (n) => { await page.waitForTimeout(400); await page.screenshot({ path: path.join(S, `m04_${n}.png`) }); };
    await page.evaluate(() => localStorage.clear()); await page.reload(); await foto('01_inicio');
    await page.click('#ir'); await page.evaluate(NA_PAGINA.responder, 'NS'); await foto('02_p01_nao_sei_bloqueio');
    await page.evaluate(NA_PAGINA.responder, 'Eu pretendo oferecer aos meus clientes um bolo de pote para lanche escolar'); await semPassoExtra();
    await page.waitForTimeout(400); await page.evaluate(() => window.scrollTo(0, 0)); await foto('03_p02_nota');
    await page.evaluate(NA_PAGINA.responder, 'Produto'); await semPassoExtra();
    await page.evaluate(NA_PAGINA.responder, 'NS'); await page.waitForTimeout(600); await foto('04_p03_nao_sei_prompt');
    const c = await caminho(page, { 'M4.P02': 'Produto', 'M4.P05': '2', 'M4.P14': undefined });
    await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('lg2-turma-a-m04')); s.hist = s.hist.slice(0, s.hist.indexOf('M4.P14') + 1); localStorage.setItem('lg2-turma-a-m04', JSON.stringify(s)); });
    await page.reload(); await page.click('#ir'); await foto('05_p14_pre_venda');
    await page.evaluate(() => document.querySelector('.caixa-entenda').scrollIntoView()); await foto('05b_p14_pre_venda_conceito');
    await caminho(page, { 'M4.P02': 'Produto', 'M4.P05': '2', 'M4.P08': 'NS' }); await page.evaluate(() => window.scrollTo(0, 0)); await foto('06_resultado');
    void c;
  }

  await browser.close(); servidor.close();
  console.log(falhas ? `\n${falhas} FALHA(S)` : '\nTODOS OS TESTES PASSARAM');
  process.exit(falhas ? 1 : 0);
})().catch((e) => { console.error('FAIL erro inesperado:', e); process.exit(1); });

function Motor_retorno(p, v) { return p.retorno_se && p.retorno_se.valores.includes(v) ? p.retorno_se.texto : ''; }
