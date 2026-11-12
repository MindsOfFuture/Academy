/* LG2 · Módulo 2 (Turma B) · teste headless do módulo publicado em public/lg2/turma-b/m02.
   Execute: PW=<caminho do playwright> node tests/lg2-m02-turma-b.cjs
   Opcional: LG2_M02_URL=http://127.0.0.1:8812/ (servidor externo); LG2_SHOTS=<pasta> (prints 390x844).
   Cobre: todas as regras da aba 4 alcançadas pela interface (N de N), casos da aba 8
   (divergências são relatadas, não falham), instrumentos M2.I04/M2.I05 contra a "saída esperada"
   da aba 5 e persistência após recarregar. Imprime PASS/FAIL e sai com código != 0 se falhar.
   Lote 3 (05/11/2026): Voltar no topo de todas as telas (um só), dica longa com "Ver mais" e caixas educativas
   recolhidas, nenhum código Mx.Pyy na tela (perguntas, retornos, instrumentos, resultado aberto), P08 com várias
   respostas + "Outra" com campo (migração v2 -> v3) e P15 dizendo onde fica o quadro, com botão até ele. */
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const vm = require('node:vm');

const dir = path.resolve(__dirname, '..', 'public/lg2/turma-b/m02');
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
ok(/const CHAVE = "lg2-turma-b-m02";/.test(app), 'CHAVE deve ser lg2-turma-b-m02');
ok(D.modulo.turma === 'Turma de 18', 'Capa C7 deve ser Turma de 18');
const nP = M.perguntas.length, nR = D.regras.length;
ok(nP === 21 && nR === 89, `contagens 21 perguntas / 89 regras (obtido ${nP}/${nR})`);
ok(!JSON.stringify(D).match(/\b\d{4,5}-?\d{4}\b/), 'nenhum telefone no dados/modulo2.js');
/* relatório de testadores (05/11/2026): erros de redação corrigidos */
for (const errado of ['passo da separar', 'para serem comparados', 'comprar para a ideia', 'comprar para o produto', 'ainda ainda', 'datas exige planejamento', 'Não sei se você já conversou', '(separar os clientes em grupos)', '(a forma de dividir o público em grupos)', 'serão comparados entre si', 'interessada em comprar por trás', 'Responda as perguntas'])
  ok(!JSON.stringify(D).includes(errado), `erro de redação ainda presente: "${errado}"`);
ok(D.regras.some((r) => r.texto.includes('é um passo para separar os clientes em grupos')), 'texto corrigido: "um passo para separar"');
ok(D.regras.some((r) => r.texto.startsWith('Esses grupos entram no quadro para comparar os grupos de clientes. ')), 'texto corrigido: quadro para comparar');
/* receita do teclado do celular */
const html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
ok(/content="width=device-width, initial-scale=1, interactive-widget=resizes-content"/.test(html), 'viewport com interactive-widget=resizes-content');
ok((app.match(/addEventListener\("focusin"/g) || []).length === 1 && /scrollIntoView\(\{ block: "center" \}\)/.test(app) && !/scrollTo\(0, ?0\)[^;]*focus/.test(app), 'um único focusin que centraliza o campo');
ok(!/position:\s*fixed/.test(fs.readFileSync(path.join(dir, 'css/estilo.css'), 'utf8')), 'nada fixo no rodapé');

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
  const porTexto = new Map(D.regras.map((r) => [norm(Motor.limpa(r.texto)), r.codigo]));
  const alcancadas = new Set();

  async function inicio() {
    await page.goto(srv.url + 'index.html');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await clicarTexto('button', 'Começar');
  }
  /* pos = posição esperada no caminho da pessoa (1, 2, 3…); total = tamanho do caminho, conferido na última */
  async function responder(cod, v, pos, total) {
    const q = M.porCodigo[cod];
    const t = Motor.campo(q);
    const passo = await page.locator('.passo').textContent();
    const m = passo.match(/^Pergunta (\d+) de (\d+)$/);
    if (!m) throw new Error(`passo fora do formato em ${cod}: "${passo}"`);
    if (pos && +m[1] !== pos) throw new Error(`esperava ${cod} como pergunta ${pos}, tela mostra "${passo}"`);
    if (total && +m[2] !== total) throw new Error(`na última pergunta (${cod}) o total devia ser ${total}, tela mostra "${passo}"`);
    if (cod !== 'M2.P21' && norm(await page.locator('h2.q').textContent()) !== norm(q.pergunta)) throw new Error(`texto de ${cod} difere da planilha`);
    if (t === 'escolha') { if (!(await clicarTexto('#ent .opcao', v))) throw new Error(`opção "${v}" não existe em ${cod}`); await page.click('#ok'); }
    else if (v === 'Não sei') await page.click('#ns');
    else { await page.fill('#ent input, #ent textarea', v === 'TEXTO' ? 'Texto de teste' : v); await page.click('#ok'); }
    await page.waitForSelector('#retorno .retorno');
    const ret = await page.locator('#retorno').innerText();
    if (/M2\.[PI]\d{2}/.test(ret)) falhas.push(`código interno aparece na tela de ${cod}: ${ret.match(/.{0,40}M2\.[PI]\d{2}.{0,20}/)[0]}`);
    for (const x of await regrasNaTela()) { const c = porTexto.get(norm(x)); if (c) alcancadas.add(c); }
  }
  async function percorrer(seq, aoResponder) {
    await inicio();
    for (const [i, [cod, v]] of seq.entries()) {
      await responder(cod, v, i + 1, i === seq.length - 1 ? seq.length : 0);
      if (aoResponder) await aoResponder(cod, v);
      const fim = seq[seq.length - 1][0] === cod;
      await clicarTexto('#acoes .btn', fim ? 'Ver meu resumo' : 'Continuar');
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
    /* 10d) "Não sei" mostra um caminho para descobrir antes de seguir (regra da própria pergunta) */
    const nsTxt = norm(await page.locator('#retorno .b-naosei').textContent());
    ok(nsTxt.startsWith('Como descobrir') && nsTxt.includes('Pense na última pessoa que pediu algo parecido'), `P01 Não sei: "Como descobrir" com o caminho da regra (obtido "${nsTxt}")`);
    ok((await page.locator('#retorno .b-proximo').count()) === 0, 'P01 Não sei: sem Próximo passo repetido');
    await page.locator('#retorno').scrollIntoViewIfNeeded();
    await shot('pergunta_v03');

    /* 10) relatório da Júlia: um bloco de cada, linguagem para o usuário, legal como Atenção, Continuar avança */
    const contar = () => page.evaluate(() => ({ a: document.querySelectorAll('#retorno .b-alerta').length, p: document.querySelectorAll('#retorno .b-proximo').length, ns: document.querySelectorAll('#retorno .b-naosei').length, t: document.querySelector('#retorno').innerText }));
    await inicio();
    await responder('M2.P01', 'Sim');
    let k = await contar();
    ok(k.p === 1 && k.a <= 1 && !/\bapp\b|próxima pergunta/.test(k.t), `P01 Sim: um Próximo passo, sem linguagem de montagem (obtido ${JSON.stringify(k)})`);
    ok(k.t.includes(M.porCodigo['M2.P01'].proximo), 'P01 Sim: o próximo passo é a frase para pensar (nova)');
    for (const q of M.perguntas) ok(!/\bo app\b/i.test(q.proximo), `${q.codigo}: próximo passo sem "o app"`);
    /* Continuar depois do retorno: a tela não volta para cima e o botão leva à próxima pergunta */
    const y0 = await page.evaluate(() => window.scrollY);
    await page.waitForTimeout(600);
    const y1 = await page.evaluate(() => window.scrollY);
    ok(y1 >= y0, `depois de responder a tela não sobe (antes ${y0}, depois ${y1})`);
    const nomes = await page.locator('#acoes .btn').allTextContents();
    ok(nomes[0] === 'Continuar', `botão depois do retorno se chama Continuar (obtido ${nomes.join('/')})`);
    await clicarTexto('#acoes .btn', 'Continuar');
    ok(norm(await page.locator('h2.q').textContent()) === M.porCodigo['M2.P02'].pergunta, 'Continuar leva à próxima pergunta (P02)');
    /* em todas as regras: no máximo uma Atenção e um Próximo passo por pergunta; "Não sei" sempre explica */
    for (const seq of [planejar({ 'M2.P05': 'De dois a três grupos', 'M2.P04': 'Não' }), planejar({ 'M2.P05': 'Quase qualquer pessoa', 'M2.P08': 'Nenhuma muda muito' }), planejar({ 'M2.P04': 'Sim', 'M2.P18': '3', 'M2.P19': 'Não', 'M2.P21': 'Contaram um problema de verdade' }), planejar({ 'M2.P07': 'Os dois', 'M2.P08': 'Não sei', 'M2.P14': 'Não sei', 'M2.P17': 'Não sei', 'M2.P16': 'Não sei' })]) {
      await percorrer(seq, async (cod, v) => {
        const c = await contar();
        ok(c.a <= 1 && c.p <= 1 && c.ns <= 1, `${cod}=${v}: no máximo 1 Atenção e 1 Próximo passo (obtido ${c.a}/${c.p})`);
        if (v === 'Não sei') ok(c.ns === 1 && c.p === 0, `${cod}=Não sei: mostra "Como descobrir"`);
      });
    }
    /* legal (empresa que é órgão público): vai para a Atenção, num bloco só; o Próximo passo fica sem a parte legal */
    await percorrer(planejar({ 'M2.P07': 'Empresas', 'M2.P14': 'Órgãos públicos/instituições' }), async (cod) => {
      if (cod !== 'M2.P14') return;
      const c = await contar();
      const at = norm(await page.locator('#retorno .b-alerta').textContent()), px = norm(await page.locator('#retorno .b-proximo').textContent());
      ok(c.a === 1 && /Consulte fonte oficial e o Sebrae/.test(at) && /Quem procurar: Órgão público ou Sebrae/.test(at), `P14: regra legal e quem procurar na Atenção (obtido "${at}")`);
      ok(c.p === 1 && !/Sebrae|fonte oficial/.test(px), `P14: Próximo passo sem a parte legal (obtido "${px}")`);
      await page.locator('#retorno').scrollIntoViewIfNeeded();
      await shot('retorno_legal');
    });

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
      const compoe = (esp, lista) => { const e = norm(Motor.limpa(esp)); const usados = lista.map(norm).filter((t) => t && e.includes(t)); return usados.join(' ') === e; };
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
    /* lote 4 (Ana Luiza, 12/11): roteiro com "para que serve / como usar" no topo e em passos */
    const uso = norm(await page.locator('#roteiro-uso').innerText());
    for (const t of ['Para que serve', 'Com quem conversar', 'Quantas conversas', 'O que anotar', 'O que fazer com as respostas'])
      ok(uso.includes(t), `roteiro: explicação no topo sem "${t}"`);
    ok(await page.evaluate(() => { const u = document.querySelector('#roteiro-uso'), t = document.querySelector('.secao-titulo'); return !!u && t.nextElementSibling.nextElementSibling === u; }), 'roteiro: explicação logo abaixo do título do roteiro');
    ok((await page.locator('#roteiro-passos > li').count()) === 5, 'roteiro organizado em 5 passos');
    const passosTxt = norm(await page.locator('#roteiro-passos').innerText());
    const i1 = D.instrumentos.lista.find((l) => l.codigo === 'M2.I01');
    for (const x of ['onde comprou da última vez', 'quanto pagou', 'o que faria diferente', 'se pediria orçamento de novo'])
      ok(i1.ex_saida.includes(x) && passosTxt.includes(x), `roteiro: pergunta do grupo "${x}" (literal) ausente`);
    ok(passosTxt.includes(norm(D.base.find((b) => /Entrevista com cliente/.test(b.conceito)).exemplo)), 'roteiro: exemplo de pergunta do grupo literal');
    ok((await page.locator('#roteiro-extras').count()) === 0, 'roteiro: sem respostas, não há perguntas extras');
    await page.evaluate(() => localStorage.setItem('lg2-turma-b-m02', JSON.stringify({ v: 3, R: { 'M2.P10': { estado: 'opcao', opcao: 'Busca o menor preço' } }, hist: [], fichas: [], plano: { meta: '', prazo: '', feitos: [] }, grupos: [] })));
    await page.reload();
    await clicarTexto('button', 'Instrumentos: roteiro, ficha, plano e quadro');
    const extras = norm(await page.locator('#roteiro-extras').innerText().catch(() => ''));
    ok(/quanto pagaram na última compra parecida/.test(extras) && !/M2\./.test(extras), `roteiro: pergunta extra pedida pela resposta (obtido "${extras}")`);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await clicarTexto('button', 'Instrumentos: roteiro, ficha, plano e quadro');
    /* lote 4: ficha e quadro dos grupos com "como preencher", exemplo e validação simples */
    ok(/Situação/.test(await page.locator('#como-ficha').innerText()) && /Forte/.test(await page.locator('#como-ficha').innerText()), 'ficha: como preencher cada coluna');
    await page.click('#f-ok');
    ok(/Escreva quem é a pessoa entrevistada/.test(await page.locator('#f-erro').textContent()) && (await page.locator('#fichas .cartao').count()) === 0, 'ficha vazia: mensagem simples e não salva');
    await page.fill('#f-sit', '123');
    await clicarTexto('#f-sinal .opcao', 'forte'); await page.click('#f-ok');
    ok(/com palavras/.test(await page.locator('#f-erro').textContent()) && (await page.locator('#fichas .cartao').count()) === 0, 'ficha: situação só com número é recusada');
    await page.fill('#f-sit', 'Vizinha, compra para aniversário'); await page.fill('#f-freq', '2'); await page.fill('#f-mot', 'preço');
    await page.click('#f-ok');
    ok(/de quanto em quanto tempo/.test(await page.locator('#f-erro').textContent()) && (await page.locator('#fichas .cartao').count()) === 0, 'ficha: frequência só com número gera aviso no 1º toque');
    await page.click('#f-ok');
    ok((await page.locator('#fichas .cartao').count()) === 1, 'ficha: o 2º toque com os mesmos dados salva (aviso não trava)');
    await page.click('#fichas .x');
    ok((await page.locator('#fichas .cartao').count()) === 0, 'ficha de teste removida');
    const exQ = await page.evaluate(() => [...document.querySelectorAll('#ex-quadro tbody tr')].map((r) => r.lastElementChild.textContent));
    ok(JSON.stringify(exQ) === '["8","5"]', `quadro dos grupos: exemplo preenchido com totais 8 e 5 (obtido ${exQ})`);
    ok(/1 = difícil/.test(await page.locator('#como-quadro').innerText()), 'quadro dos grupos: o que significa cada nota');
    await page.fill('#g-nome', ''); await page.click('#g-ok');
    ok(/Escreva o nome do grupo/.test(await page.locator('#g-erro').textContent()) && (await page.locator('#grupos .item').count()) === 0, 'grupo sem nome: mensagem simples');
    await page.fill('#g-nome', '42'); await page.click('#g-ok');
    ok(/com palavras/.test(await page.locator('#g-erro').textContent()) && (await page.locator('#grupos .item').count()) === 0, 'grupo só com número é recusado');
    for (const s of ['forte', 'forte', 'fraco', 'fraco', 'nenhum']) {   // aba 5, M2.I04, entrada: 2 forte, 2 fraco, 1 sem interesse
      await page.fill('#f-sit', `Pessoa ${s}`);
      await page.fill('#f-mot', 'preço');
      await clicarTexto('#f-sinal .opcao', s);
      await page.click('#f-ok');
    }
    /* regressão (Ana, 15/10): o placar muda ao salvar entrevistas e diz de onde vem a contagem */
    const txtInst = await page.locator('.corpo').innerText();
    ok(!/M2\.[PI]\d{2}/.test(txtInst), 'instrumentos sem códigos internos (M2.Ixx)');
    ok(!/Grupo \d|Exemplo do grupo/.test(txtInst), 'instrumentos e rodapé sem "Grupo N" / "do grupo"');
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
    /* lote 4: a frase da saída esperada passou a aparecer (antes era só divergência relatada) */
    const fraseG = norm(await page.locator('#frase-grupos').textContent().catch(() => ''));
    ok(fraseG === 'Com as notas informadas, “Grupo A” merece ser testado primeiro; confirme com mais conversas.', `M2.I05: frase da saída esperada (obtido "${fraseG}")`);
    await page.fill('#g-nome', 'grupo a'); await page.click('#g-ok');
    ok(/já está no quadro/.test(await page.locator('#g-erro').textContent()) && (await page.locator('#grupos .item').count()) === 2, 'grupo repetido: mensagem simples e não duplica');
    await page.fill('#g-nome', 'Grupo C'); await page.click('#g-ok');
    ok(/Falta dar nota: facilidade de alcançar, necessidade, capacidade de pagar/.test(await page.locator('#grupos').innerText()), 'grupo sem notas: diz quais notas faltam');
    await page.evaluate(() => [...document.querySelectorAll('#grupos .item')].find((x) => x.querySelector('b').textContent === 'Grupo C').querySelector('[data-gx]').click());
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
    await clicarTexto('#acoes .btn', 'Continuar');
    await page.fill('#ent textarea', 'Mães do bairro');
    await page.reload();
    await clicarTexto('button', 'Continuar de onde parei');
    ok((await page.locator('.passo').textContent()) === 'Pergunta 2 de 14', 'recarregar volta à pergunta em que parou (caminho típico: 14 perguntas, não 21)');
    await page.click('#v');
    ok(await page.locator('#ent .opcao.sel').textContent() === 'Em parte', 'resposta anterior persiste após recarregar');
    ok(await page.evaluate(() => !!localStorage.getItem('lg2-turma-b-m02')), 'respostas gravadas na chave lg2-turma-b-m02');

    /* 8) relatório do testador (05/11/2026) */
    // 8a) P21 reescrita: linguagem simples, ponte com as conversas, ajuda explica elogio x problema
    const q21 = M.porCodigo['M2.P21'];
    ok(/elas contaram um problema que têm de verdade, ou só elogiaram a sua ideia\?$/.test(q21.pergunta), 'P21: enunciado novo');
    ok(JSON.stringify(q21.opcoesLista) === JSON.stringify(['Contaram um problema de verdade', 'Só elogiaram a ideia', 'Não sei']), 'P21: opções novas');
    ok(/que legal/.test(q21.ajuda) && /pergunta o preço/.test(q21.ajuda) && /reservar/.test(q21.ajuda), 'P21: ajuda explica elogio x problema de verdade');
    ok(!/Problema confirmado|Só elogios/.test(JSON.stringify(D)), 'nenhuma regra depende das opções antigas da P21');
    await percorrer(planejar({ 'M2.P04': 'Sim', 'M2.P18': '6', 'M2.P19': 'Sim', 'M2.P21': 'Contaram um problema de verdade' }), async (cod) => {
      if (cod !== 'M2.P21') return;
      ok(norm(await page.locator('h2.q').textContent()).startsWith('Pelo que você ouviu dessas 6 pessoas com quem você conversou'), 'P21 faz ponte com o número de pessoas da pergunta anterior');
      ok((await page.locator('.dica .ajuda').textContent()).includes('que legal'), 'P21 mostra a ajuda nova');
      await page.evaluate(() => { document.querySelector('#retorno').innerHTML = ''; window.scrollTo(0, 0); });
      await shot('p21');
    });
    ok(alcancadas.has('M2.R89'), 'regra das respostas consistentes (R89) segue alcançável com a opção nova');
    // 8b) ramo curto (não conversou com ninguém): P21 não aparece e o caminho fica com 7 perguntas
    const curto = planejar({ 'M2.P01': 'Ainda não pensei nisso', 'M2.P04': 'Não', 'M2.P05': 'Um único grupo', 'M2.P08': 'Nenhuma muda muito' });
    ok(curto.length === 7 && !curto.some(([c]) => c === 'M2.P21'), `ramo curto deveria ter 7 perguntas sem a P21 (obtido ${curto.map((s) => s[0]).join(',')})`);
    await percorrer(curto);
    // 8c) herança: M1 (ideia, tipo, estágio) e M3 (perfil P10 + P11) semeados
    const M1 = { v: 3, R: { 'M1.P01': { estado: 'opcao', opcao: 'Já fiz um pouco para testar ou dar de amostra' }, 'M1.P03': { estado: 'valor', valor: 'Lavagem de carro em domicílio' }, 'M1.P03A': { estado: 'opcao', opcao: 'Serviço: meu cliente paga pelo trabalho que realizo' } } };
    const M3 = { v: 3, R: { 'M3.P10': { estado: 'opcao', opcao: 'Pessoas comuns (consumidor final)', campos: { Idade: '30 a 55 anos', Renda: '', Ocupação: 'trabalha fora o dia todo', 'Onde mora': 'condomínios do bairro', 'O que precisa resolver (a dor)': '' } }, 'M3.P11': { estado: 'valor', valor: 'falta de tempo para levar o carro ao lava-jato' } } };
    const semear = async (extra) => { await page.goto(srv.url + 'index.html'); await page.evaluate(([a, b, x]) => { localStorage.clear(); localStorage.setItem('lg2-turma-a-m01', a); localStorage.setItem('lg2-turma-a-m03', b); if (x) localStorage.setItem('lg2-turma-b-m02', x); }, [JSON.stringify(M1), JSON.stringify(M3), extra || null]); await page.reload(); };
    await semear();
    await clicarTexto('button', 'Começar');
    ok(norm(await page.locator('#contexto').innerText()).startsWith('Seu negócio: Lavagem de carro em domicílio Veio do Módulo 1'), 'ideia do Módulo 1 aparece como contexto');
    ok(norm(await page.locator('h2.q').textContent()) === 'Você já tem uma ideia de quem seria o principal comprador do seu serviço?', 'enunciado usa "serviço" (tipo vindo do Módulo 1)');
    await clicarTexto('#ent .opcao', 'Sim'); await page.click('#ok'); await clicarTexto('#acoes .btn', 'Continuar');
    const p02 = await page.locator('#ent textarea').inputValue();
    ok(p02 === 'Pessoas comuns de 30 a 55 anos (ocupação: trabalha fora o dia todo), que moram em condomínios do bairro. Problema que você resolve: falta de tempo para levar o carro ao lava-jato', `P02 pré-preenchida com o perfil do Módulo 3 em frase (obtido "${p02}")`);
    ok(norm(await page.locator('#herdado').innerText()) === 'Veio do Módulo 3 Confira e ajuste se quiser.', 'P02 mostra o selo "Veio do Módulo 3"');
    // 9a) teclado do celular: com o campo em foco e a janela encolhida (teclado aberto), o campo e o Continuar continuam à vista
    await page.focus('#ent textarea');
    await page.setViewportSize({ width: 390, height: 450 });
    await page.waitForTimeout(600);
    const caixas = await page.evaluate(() => ['#ent textarea', '#ok'].map((s) => { const r = document.querySelector(s).getBoundingClientRect(); return [r.top, r.bottom]; }));
    ok(caixas.every(([a, b]) => a >= 0 && b <= 450), `teclado aberto (390x450): campo e Continuar deveriam estar visíveis (obtido ${JSON.stringify(caixas)})`);
    await shot('teclado_p02');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => document.activeElement && document.activeElement.blur());
    await shot('heranca_p02');
    await page.click('#ok');
    ok((await page.evaluate(() => JSON.parse(localStorage.getItem('lg2-turma-b-m02')).R['M2.P02'].veio)) === 3, 'P02 confirmada guarda a origem (Módulo 3)');
    for (const [cod, v] of [['M2.P03', 'Experiência própria com esse público'], ['M2.P04', 'Sim'], ['M2.P05', 'Um único grupo']]) {
      await clicarTexto('#acoes .btn', 'Continuar');
      // 9c) exemplo da ajuda conforme o tipo (serviço vindo do Módulo 1): manicure, não bolo
      if (cod === 'M2.P05') { const aj = await page.locator('.dica .ajuda').textContent(); ok(/unhas/.test(aj) && !/bolo/.test(aj), `P05: exemplo de serviço para quem presta serviço (obtido "${aj}")`); }
      await clicarTexto('#ent .opcao', v); await page.click('#ok');
    }
    await clicarTexto('#acoes .btn', 'Continuar');
    ok(norm(await page.locator('h2.q').textContent()) === M.porCodigo['M2.P07'].pergunta, 'chegou na P07');
    ok((await page.locator('#ent .opcao.sel').textContent()) === 'Pessoas' && (await page.locator('#herdado').count()) === 1, 'P07 vem marcada com "Pessoas" (Módulo 3) e selo');
    await page.click('#ok');
    ok(alcancadas.has('M2.R21') || (await regrasNaTela()).some((x) => norm(x) === norm(D.regras.find((r) => r.codigo === 'M2.R21').texto)), 'P07 herdada dispara a regra de "Pessoas"');
    // segue até o fim com respostas típicas e confere a caixa "O que entendemos até aqui"
    const resto = [['M2.P08', 'Hábitos de compra'], ['M2.P13', 'Praticidade/rapidez'], ['M2.P16', 'Em parte'], ['M2.P17', 'Todo mês'], ['M2.P18', '4'], ['M2.P19', 'Não'], ['M2.P20', 'Não sei'], ['M2.P21', 'Só elogiaram a ideia']];
    for (const [cod, v] of resto) {
      await clicarTexto('#acoes .btn', 'Continuar');
      const q = M.porCodigo[cod];
      if (cod === 'M2.P18') {
        // 9d) campo de número: texto e negativo não gravam; número muito alto avisa e deixa seguir no 2º toque
        ok(await page.locator('#ent input').getAttribute('inputmode') === 'numeric', 'P18 abre o teclado numérico');
        for (const [x, re] of [['quatro', /Digite só números/], ['-3', /não pode ser negativo/]]) {
          await page.fill('#ent input', x); await page.click('#ok');
          ok(re.test(await page.locator('#erro').textContent()) && (await page.locator('#retorno .retorno').count()) === 0, `P18 "${x}" deveria ser recusado com mensagem simples`);
        }
        ok(!(await page.evaluate(() => JSON.parse(localStorage.getItem('lg2-turma-b-m02')).R['M2.P18'])), 'P18 inválido não é gravado');
        await page.fill('#ent input', '5000'); await page.click('#ok');
        ok(/parece alto/.test(await page.locator('#erro').textContent()) && (await page.locator('#retorno .retorno').count()) === 0, 'P18 5000: aviso de valor alto no 1º toque');
        await page.click('#ok');
        ok((await page.locator('#retorno .retorno').count()) === 1, 'P18 5000: o 2º Continuar com o mesmo valor segue');
        ok(await clicarTexto('#acoes .btn', 'Corrigir minha resposta'), 'botão "Corrigir minha resposta" mantido');
      }
      if (Motor.campo(q) === 'escolha') { if (!(await clicarTexto('#ent .opcao', v))) throw new Error(`herança: opção ${v} ausente em ${cod}`); await page.click('#ok'); }
      else if (v === 'Não sei') await page.click('#ns'); else { await page.fill('#ent input, #ent textarea', v); await page.click('#ok'); }
    }
    ok((await page.locator('.passo').textContent()) === 'Pergunta 14 de 14', 'caminho típico (lava-jato) termina em 14 de 14');
    await clicarTexto('#acoes .btn', 'Ver meu resumo');
    await page.waitForSelector('#entendemos');
    const ent = await page.locator('#entendemos p:not(.mini-info)').allTextContents();
    /* texto corrido (relatório do Bento): 1 a 3 parágrafos, sem lista */
    ok(ent.length >= 1 && ent.length <= 3, `caixa "O que entendemos" em 1 a 3 parágrafos (obtido ${ent.length})`);
    ok(await page.evaluate(() => { const e = document.querySelector('#entendemos'); return !e.querySelector('ul, ol, li') && e.querySelectorAll('p:not(.mini-info)').length >= 1; }), 'caixa "O que entendemos" sem <li> e com pelo menos um <p>');
    ok(ent.join(' ').split(/(?<=[.!?])\s+(?=[A-ZÀ-Ú])/).length >= 3, 'caixa "O que entendemos" continua com 3 ou mais frases');
    const entT = ent.join(' ');
    for (const trecho of ['Você vende (ou quer vender) lavagem de carro em domicílio, que é um serviço, e você já começou a testar.', 'Seus clientes seriam principalmente pessoas que compram para si ou para a família', 'Você vê um único grupo de clientes; o que mais muda entre um cliente e outro é: hábitos de compra (praticidade/rapidez).', 'Cada cliente compraria todo mês, e você sabe em parte onde encontrar essas pessoas.', 'Você já conversou com 4 pessoas, mas ninguém fez nada concreto ainda. Por enquanto, o que você ouviu foi mais elogio do que um problema de verdade.'])
      ok(entT.includes(trecho), `"O que entendemos" deveria trazer: ${trecho} (obtido: ${entT})`);
    ok(await page.evaluate(() => { const c = document.querySelector('.corpo'); const e = document.querySelector('#entendemos'); const r = document.querySelector('.res-num'); return e.compareDocumentPosition(r) & Node.DOCUMENT_POSITION_FOLLOWING; }), 'caixa "O que entendemos" fica acima dos números do resultado');
    ok(await page.evaluate(() => { const d = document.querySelector('details#suas-respostas'); return d && !d.open && /Ver suas respostas/.test(d.querySelector('summary').textContent); }), 'lista de respostas recolhida em "Ver suas respostas"');
    ok((await page.locator('#suas-respostas .veio').count()) === 2, 'respostas herdadas (P02 e P07) aparecem com selo na lista');
    const corpoRes = await page.evaluate(() => { const c = document.querySelector('.corpo').cloneNode(true); c.querySelectorAll('details.saiba:not(#suas-respostas)').forEach((d) => d.remove()); return c.innerText; });
    ok(!/M2\.[PI]\d{2}/.test(corpoRes), 'resultado sem códigos internos (M2.Pxx/M2.Ixx)');
    await page.evaluate(() => document.querySelector('#entendemos').scrollIntoView());
    await shot('resultado_entendemos');
    // 9e) formato do estado salvo, lido por outros módulos (Módulo 10): {v, R:{código:{estado, opcao|valor}}}
    const est = await page.evaluate(() => JSON.parse(localStorage.getItem('lg2-turma-b-m02')));
    ok(est.v === 3 && est.R['M2.P17'].estado === 'opcao' && est.R['M2.P17'].opcao === 'Todo mês' && est.R['M2.P18'].estado === 'valor' && est.R['M2.P18'].valor === '4'
      && est.R['M2.P21'].opcao === 'Só elogiaram a ideia' && est.R['M2.P02'].estado === 'valor' && est.R['M2.P20'].estado === 'naosei', `estado salvo no formato esperado (obtido ${JSON.stringify(est.R).slice(0, 300)})`);
    const outros = await page.evaluate(() => [localStorage.getItem('lg2-turma-a-m01'), localStorage.getItem('lg2-turma-a-m03')]);
    ok(outros[0] === JSON.stringify(M1) && outros[1] === JSON.stringify(M3), 'Módulos 1 e 3 não são alterados (só leitura)');
    // 8d) "Não sei" no Módulo 3 não conta como herança
    await page.goto(srv.url + 'index.html');
    await page.evaluate(() => { localStorage.clear(); localStorage.setItem('lg2-turma-a-m03', JSON.stringify({ v: 3, R: { 'M3.P10': { estado: 'naosei' } } })); });
    await page.reload();
    await clicarTexto('button', 'Começar');
    ok((await page.locator('#contexto').count()) === 0, 'sem dado do Módulo 1, não mostra o contexto');
    for (const [cod, v] of [['M2.P01', 'Ainda não pensei nisso'], ['M2.P04', 'Não'], ['M2.P05', 'Um único grupo']]) { await clicarTexto('#ent .opcao', v); await page.click('#ok'); await clicarTexto('#acoes .btn', 'Continuar'); }
    ok((await page.locator('#ent .opcao.sel').count()) === 0 && (await page.locator('#herdado').count()) === 0, '"Não sei" do Módulo 3 não pré-marca a P07');
    // 9c) sem tipo do negócio, o exemplo da planilha (bolo) continua
    ok(/bolo/.test(M.porCodigo['M2.P05'].ajuda), 'P05 da planilha fala de bolo');
    // 9b) bug do relatório: "Empresas (Local: Bolos caseiros de pote)". Cada campo no lugar certo; o que repete a ideia sai; "Não sei" sai
    const p02De = async (m1, m3) => {
      await page.goto(srv.url + 'index.html');
      await page.evaluate(([a, b]) => { localStorage.clear(); localStorage.setItem('lg2-turma-a-m01', a); localStorage.setItem('lg2-turma-a-m03', b); }, [JSON.stringify(m1), JSON.stringify(m3)]);
      await page.reload(); await clicarTexto('button', 'Começar');
      await clicarTexto('#ent .opcao', 'Sim'); await page.click('#ok'); await clicarTexto('#acoes .btn', 'Continuar');
      return page.locator('#ent textarea').inputValue();
    };
    const M1b = { v: 3, R: { 'M1.P03': { estado: 'valor', valor: 'Bolos caseiros de pote' }, 'M1.P03A': { estado: 'opcao', opcao: 'Produto: eu mesmo faço o que vendo' } } };
    let e02 = await p02De(M1b, { v: 3, R: { 'M3.P10': { estado: 'opcao', opcao: 'Empresas', campos: { Ramo: 'Restaurantes e alimentação', Tamanho: 'Micro ou pequena empresa', Equipe: '2 a 9 pessoas', Local: 'Bolos caseiros de pote' } }, 'M3.P11': { estado: 'valor', valor: 'Falta de sobremesa pronta para vender.' } } });
    ok(e02 === 'Empresas do ramo de restaurantes e alimentação, micro ou pequena empresa, com 2 a 9 pessoas. Problema que você resolve: Falta de sobremesa pronta para vender', `P02 (empresas, local = ideia) em frase sem o local errado (obtido "${e02}")`);
    await shot('heranca_empresas');
    e02 = await p02De(M1b, { v: 3, R: { 'M3.P10': { estado: 'opcao', opcao: 'Empresas', campos: { Ramo: 'Não sei', Tamanho: '', Equipe: 'Só o dono', Local: 'Juiz de Fora' } } } });
    ok(e02 === 'Empresas, em que só o dono trabalha, em Juiz de Fora', `P02 (empresas, sem dor, "Não sei" omitido) (obtido "${e02}")`);
    e02 = await p02De(M1b, { v: 3, R: { 'M3.P10': { estado: 'opcao', opcao: 'Pessoas comuns (consumidor final)', campos: { Idade: '18 a 29 anos; 30 a 44 anos', Renda: 'Não sei', Ocupação: 'Estudantes', 'Onde mora': 'no bairro São Pedro', 'O que precisa resolver (a dor)': 'vontade de um doce barato depois da aula' } } } });
    ok(e02 === 'Pessoas comuns de 18 a 29 anos ou 30 a 44 anos, que são estudantes, que moram no bairro São Pedro. Problema que você resolve: vontade de um doce barato depois da aula', `P02 (pessoas, dor do perfil) (obtido "${e02}")`);
    ok(!/[A-Za-zçã ]+: (?!vontade)/.test(e02.split('. Problema')[0]), 'P02 sem rótulos de campo');
    // 8e) estado salvo antes (opção antiga da P21) é convertido
    await page.goto(srv.url + 'index.html');
    await page.evaluate(() => { localStorage.clear(); localStorage.setItem('lg2-turma-b-m02', JSON.stringify({ R: { 'M2.P04': { estado: 'opcao', opcao: 'Sim' }, 'M2.P21': { estado: 'opcao', opcao: 'Só elogios' } }, hist: [] })); });
    await page.reload();
    await clicarTexto('button', 'Começar');
    const mig = await page.evaluate(() => JSON.parse(localStorage.getItem('lg2-turma-b-m02')));
    ok(mig.v === 3 && mig.R['M2.P21'].opcao === 'Só elogiaram a ideia', 'resposta antiga "Só elogios" convertida para a opção nova');

    /* ===== lote 3 (Duda, Gaby, José Inácio, Nayara, Arthur) ===== */
    const CODIGO = /\bM\d{1,2}\s*[.\-]\s*[PIRT]\s*\d{1,2}|\b[PI]\d{2}\b/;
    /* texto inteiro da tela, inclusive o que está recolhido em "Ver mais"/caixas (textContent) */
    const semCodigo = async (onde) => { const t = await page.evaluate(() => document.querySelector('#tela').textContent); const m = t.match(CODIGO); ok(!m, `${onde}: código visível na tela (${m ? t.slice(Math.max(0, m.index - 40), m.index + 20) : ''})`); };
    const voltarNoTopo = (sel) => page.evaluate((sel) => {
      const v = [...document.querySelectorAll('button')].filter((b) => /Voltar/.test(b.textContent));
      const r = v[0] && v[0].getBoundingClientRect(), alvo = document.querySelector(sel).getBoundingClientRect();
      return v.length === 1 && v[0].id === 'v' && v[0].textContent.trim() === '‹ Voltar' && r.bottom <= alvo.top + 1 && r.left < innerWidth / 2 && !document.querySelector('.acoes-voltar');
    }, sel);
    // C) Voltar no topo, acima da pergunta (e no topo das outras telas); um só, sem o de baixo
    await page.goto(srv.url + 'index.html'); await page.evaluate(() => localStorage.clear()); await page.reload();
    await semCodigo('capa');
    await clicarTexto('button', 'O que este módulo não faz');
    ok(await voltarNoTopo('.cartao'), 'limites: Voltar no topo');
    await semCodigo('limites');
    await page.click('#v');
    await clicarTexto('button', 'Começar');
    ok(await voltarNoTopo('h2.q'), 'pergunta: um só "‹ Voltar", à esquerda, acima do texto da pergunta');
    ok(await page.evaluate(() => document.querySelector('#v').getBoundingClientRect().top < document.querySelector('#ok').getBoundingClientRect().top), 'pergunta: Voltar acima do Continuar');
    await page.click('#v');
    ok(await page.evaluate(() => !!document.querySelector('#ir')), '1ª pergunta: Voltar volta para a capa');
    // códigos (Nayara): em todos os caminhos, a tela inteira (pergunta + retorno) não mostra Mx.Pyy
    for (const seq of [planejar({ 'M2.P05': 'De dois a três grupos', 'M2.P15': 'Não sei', 'M2.P07': 'Os dois', 'M2.P04': 'Sim', 'M2.P18': '3' }), planejar({ 'M2.P05': 'Quase qualquer pessoa', 'M2.P08': 'Nenhuma muda muito', 'M2.P04': 'Não' }), planejar({ 'M2.P01': 'Não sei', 'M2.P08': 'Não sei', 'M2.P16': 'Não sei', 'M2.P17': 'Não sei' })])
      await percorrer(seq, async (cod) => { await semCodigo(cod + ' (pergunta e retorno)'); });
    await page.evaluate(() => document.querySelectorAll('details').forEach((d) => { d.open = true; }));
    await semCodigo('resultado (tudo aberto, como na impressão)');
    ok(await voltarNoTopo('.concluido'), 'resultado: Voltar no topo');
    ok(/a pergunta sobre o que mais muda entre um cliente e outro/.test(Motor.limpa('Responda M2.P08 e anote.')) && !CODIGO.test(Motor.limpa('Veja M1.P03 e (M3-02) e M2.P02.')), 'limpeza troca o código pelo assunto da pergunta');
    await clicarTexto('button', 'Abrir os instrumentos');
    await semCodigo('instrumentos');
    ok(await voltarNoTopo('.secao-titulo'), 'instrumentos: Voltar no topo');
    await page.click('#v');
    ok(await page.evaluate(() => !!document.querySelector('.concluido')), 'instrumentos: Voltar volta para o resultado');

    // D) menos texto: dica longa com a 1ª frase e "Ver mais"; caixas educativas recolhidas embaixo do Continuar
    await percorrer(planejar({ 'M2.P04': 'Sim', 'M2.P18': '6', 'M2.P21': 'Contaram um problema de verdade' }), async (cod) => {
      if (cod === 'M2.P02') {
        const cx = await page.evaluate(() => [...document.querySelectorAll('.caixa')].map((c) => ({ tag: c.tagName, open: c.open, abaixo: c.getBoundingClientRect().top > document.querySelector('#acoes').getBoundingClientRect().top, sum: c.querySelector('summary') && c.querySelector('summary').textContent.trim() })));
        ok(cx.length === 2 && cx.every((c) => c.tag === 'DETAILS' && !c.open && c.abaixo && c.sum), `P02: caixas "Entenda"/"Use a IA" recolhidas embaixo do Continuar (obtido ${JSON.stringify(cx)})`);
        await page.evaluate(() => { document.querySelector('#retorno').innerHTML = ''; window.scrollTo(0, 0); });
        await shot('l3_m02_pergunta_voltar_topo');
      }
      if (cod === 'M2.P21') {
        const d = await page.evaluate(() => { const a = document.querySelector('.dica'); const vm = a.querySelector('details.ver-mais'); return { vis: a.querySelector('p.ajuda').textContent, vm: !!vm && !vm.open && vm.querySelector('summary').textContent }; });
        ok(d.vm === 'Ver mais' && d.vis.length <= 220 && d.vis.includes('que legal'), `P21: dica longa mostra só a 1ª frase e "Ver mais" fechado (obtido ${JSON.stringify(d)})`);
      }
    });

    // P8 (Nayara): várias respostas, "Outra" com campo de texto, "Nenhuma"/"Não sei" sozinhas
    ok(Motor.multipla(M.porCodigo['M2.P08']) && M.porCodigo['M2.P08'].opcoesLista.includes('Outra'), 'P08: várias respostas e opção "Outra"');
    const ateP08 = async () => {
      await inicio();
      for (const [c, v] of [['M2.P01', 'Ainda não pensei nisso'], ['M2.P04', 'Não'], ['M2.P05', 'Um único grupo'], ['M2.P07', 'Pessoas']]) { await responder(c, v); await clicarTexto('#acoes .btn', 'Continuar'); }
      ok(norm(await page.locator('h2.q').textContent()) === M.porCodigo['M2.P08'].pergunta, 'chegou na P08');
    };
    await ateP08();
    const marc = () => page.evaluate(() => [...document.querySelectorAll('#ent .opcao.sel')].map((b) => b.textContent));
    for (const o of ['Idade/fase da vida', 'Hábitos de compra']) await clicarTexto('#ent .opcao', o);
    ok(JSON.stringify(await marc()) === JSON.stringify(['Idade/fase da vida', 'Hábitos de compra']), 'P08: marca mais de uma');
    ok(await page.evaluate(() => getComputedStyle(document.querySelector('#ent .radio')).borderRadius === '6px'), 'P08: quadradinho (várias respostas)');
    await clicarTexto('#ent .opcao', 'Não sei');
    ok(JSON.stringify(await marc()) === JSON.stringify(['Não sei']), 'P08: "Não sei" desmarca as outras');
    await clicarTexto('#ent .opcao', 'Idade/fase da vida');
    ok(JSON.stringify(await marc()) === JSON.stringify(['Idade/fase da vida']), 'P08: marcar outra desmarca "Não sei"');
    await clicarTexto('#ent .opcao', 'Hábitos de compra');
    await clicarTexto('#ent .opcao', 'Outra');
    ok(await page.locator('.outra textarea').isVisible(), 'P08: "Outra" abre o campo de texto');
    await page.click('#ok');
    ok(/Escreva qual é a outra/.test(await page.locator('#erro').textContent()) && (await page.locator('#retorno .retorno').count()) === 0, 'P08: "Outra" sem texto pede para escrever');
    await page.fill('.outra textarea', 'Se é para presente');
    await page.evaluate(() => { document.querySelector('#erro').hidden = true; window.scrollTo(0, 0); });
    await shot('l3_m02_p08_multipla');
    await page.click('#ok');
    await page.waitForSelector('#retorno .retorno');
    const r8 = await page.evaluate(() => JSON.parse(localStorage.getItem('lg2-turma-b-m02')).R['M2.P08']);
    ok(JSON.stringify(r8) === JSON.stringify({ estado: 'opcao', opcao: 'Idade/fase da vida', opcoes: ['Idade/fase da vida', 'Hábitos de compra', 'Outra'], detalhe: 'Se é para presente' }), `P08: formato salvo (obtido ${JSON.stringify(r8)})`);
    await semCodigo('P08 (retorno)');
    // cada característica marcada abre a sua pergunta de detalhe
    const seguintes = [];
    for (let i = 0; i < 2; i++) { await clicarTexto('#acoes .btn', 'Continuar'); seguintes.push(norm(await page.locator('h2.q').textContent())); await clicarTexto('#ent .opcao', i === 0 ? 'Adultos que trabalham' : 'Praticidade/rapidez'); await page.click('#ok'); }
    ok(JSON.stringify(seguintes) === JSON.stringify([M.porCodigo['M2.P09'].pergunta, M.porCodigo['M2.P13'].pergunta]), `P08 com 2 marcadas abre P09 e P13 (obtido ${seguintes.join(' | ')})`);
    for (const [c, v] of [['M2.P16', 'Sim'], ['M2.P17', 'Todo mês']]) { await clicarTexto('#acoes .btn', 'Continuar'); await clicarTexto('#ent .opcao', v); await page.click('#ok'); }
    await clicarTexto('#acoes .btn', 'Ver meu resumo');
    await page.waitForSelector('#entendemos');
    const ent8 = norm(await page.locator('#entendemos').innerText());
    ok(ent8.includes('as características que mais mudam entre um cliente e outro são: idade/fase da vida (adultos que trabalham), hábitos de compra (praticidade/rapidez) e se é para presente.'), `P08: "O que entendemos" junta as marcadas (obtido ${ent8})`);
    await page.evaluate(() => { document.querySelector('#suas-respostas').open = true; });
    ok((await page.locator('#suas-respostas').innerText()).includes('Idade/fase da vida; Hábitos de compra; Outra: Se é para presente'), 'P08: "Ver suas respostas" lista as marcadas e o texto de "Outra"');
    // migração: resposta única antiga da P08 vira lista
    await page.goto(srv.url + 'index.html');
    await page.evaluate(() => { localStorage.clear(); localStorage.setItem('lg2-turma-b-m02', JSON.stringify({ v: 2, R: { 'M2.P08': { estado: 'opcao', opcao: 'Motivo da compra' }, 'M2.P21': { estado: 'opcao', opcao: 'Só elogiaram a ideia' } }, hist: ['M2.P08'] })); });
    await page.reload();
    await clicarTexto('button', 'Continuar de onde parei');
    const mig8 = await page.evaluate(() => JSON.parse(localStorage.getItem('lg2-turma-b-m02')));
    ok(mig8.v === 3 && JSON.stringify(mig8.R['M2.P08'].opcoes) === '["Motivo da compra"]' && mig8.R['M2.P21'].opcao === 'Só elogiaram a ideia', 'P08: resposta única da versão 2 migrada para lista (v3)');
    ok(JSON.stringify(await marc()) === JSON.stringify(['Motivo da compra']), 'P08 migrada aparece marcada');

    // P15 (Nayara): o aviso diz onde fica o quadro e leva até ele
    await inicio();
    const s15 = planejar({ 'M2.P05': 'De dois a três grupos', 'M2.P15': 'Maior necessidade' });
    for (const [i, [c, v]] of s15.entries()) {
      await responder(c, v, i + 1);
      if (c === 'M2.P15') break;
      await clicarTexto('#acoes .btn', 'Continuar');
    }
    const px15 = norm(await page.locator('#retorno .b-proximo').textContent());
    ok(/quadro para comparar os grupos de clientes, que fica na tela de instrumentos deste módulo/.test(px15), `P15: o aviso diz onde fica o quadro (obtido "${px15}")`);
    ok(norm(await page.locator('#abrir-quadro').textContent()) === 'Abrir o quadro para comparar os grupos', 'P15: botão que leva ao quadro');
    await page.locator('#onde-quadro').scrollIntoViewIfNeeded();
    await shot('l3_m02_p15_quadro');
    await page.click('#abrir-quadro');
    const noQuadro = await page.evaluate(() => { const t = document.querySelector('#quadro-grupos'); const r = t && t.getBoundingClientRect(); return !!t && t.textContent === 'Quadro para comparar os grupos de clientes' && r.top >= -2 && r.top < innerHeight / 2 && !!document.querySelector('#grupos'); });
    ok(noQuadro, 'P15: o botão abre os instrumentos já no quadro para comparar os grupos');
    await shot('l3_m02_quadro_grupos');
    await page.click('#v');
    ok(norm(await page.locator('h2.q').textContent()) === M.porCodigo['M2.P15'].pergunta && (await page.locator('#ent .opcao.sel').textContent()) === 'Maior necessidade', 'P15: Voltar do quadro volta para a pergunta, com a resposta marcada');
    // outros avisos que citam um quadro também dizem onde ele fica (ex.: P06 e P19)
    await percorrer(planejar({ 'M2.P05': 'De dois a três grupos', 'M2.P04': 'Sim', 'M2.P18': '3', 'M2.P19': 'Sim' }), async (cod) => {
      if (cod === 'M2.P06' || cod === 'M2.P19') ok((await page.locator('#onde-quadro').count()) === 1 && /fica na tela de instrumentos/.test(await page.locator('#retorno').innerText()), `${cod}: aviso do quadro diz onde ele fica`);
    });

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
  console.log(`PASS: lote 4 (roteiro com como usar + passos, ficha e quadro dos grupos com como preencher, exemplo e validação) · lote 3 (Voltar no topo, menos texto, sem códigos na tela, P08 com várias respostas + Outra + migração v3, P15 com o quadro) · ${alcancadas.size} de ${nR} regras alcançadas; ${nP} perguntas (P21 reescrita); herança M1/M3, progresso pelo caminho e "O que entendemos" conferidos; M2.I04 e M2.I05 conferem com a aba 5; persistência ok · ${D.modulo.versao} ${D.modulo.data}`);
})();
