/* LG2 · Módulo 2 (Turma B) · teste headless do módulo publicado em public/lg2/turma-b/m02.
   Execute: PW=<caminho do playwright> node tests/lg2-m02-turma-b.cjs
   Opcional: LG2_M02_URL=http://127.0.0.1:8812/ (servidor externo); LG2_SHOTS=<pasta> (prints 390x844).
   Cobre: todas as regras da aba 4 alcançadas pela interface (N de N), casos da aba 8
   (divergências são relatadas, não falham), instrumentos M2.I04/M2.I05 contra a "saída esperada"
   da aba 5 e persistência após recarregar. Imprime PASS/FAIL e sai com código != 0 se falhar.
   Lote 3 (05/11/2026): Voltar no topo de todas as telas (um só), dica longa com "Ver mais" e caixas educativas
   recolhidas, nenhum código Mx.Pyy na tela (perguntas, retornos, instrumentos, resultado aberto), P08 com várias
   respostas + "Outra" com campo (migração v2 -> v3) e P15 dizendo onde fica o quadro, com botão até ele.
   Versão leve (nov/2026): capa curta (frase + tempo, resto em "Como funciona"), perguntas com até LIMITE_PALAVRAS
   palavras visíveis, "Ver dica" fechada entre a pergunta e as respostas, exemplo dentro do campo, "Como descobrir"
   (passos + pedido para a IA com Copiar) em todo "Não sei" sem mudar o valor salvo, resultado com o principal no topo.
   Sabotagem: M02_SABOTAGEM=1 serve o app sem a caixa "Como descobrir" (o teste tem de falhar).
   Lote 16/11: "Não sei" BLOQUEIA (mostra "Como descobrir", não grava, Continuar não anda); "Ainda não pensei nisso" fundida
   no "Não sei" da P01; sem "Não sei" nas perguntas sobre a própria pessoa (P03, P04, P15, P18, P19); P16 e P20 saíram
   (o Módulo 3 pergunta mais completo; respostas antigas ficam salvas); migração v3 -> v4; "Como calculamos" nas contas;
   exemplo sob opção difícil; botão "Ver o roteiro" que abre o roteiro de entrevista por cima da tela.
   Sabotagem 2: M02_SABOTAGEM=2 deixa a escolha "Não sei" ser gravada (o teste tem de falhar).
   Lote 17/11 (tira a fricção): um toque por pergunta (o retorno aparece ao vivo, antes do Continuar; o Continuar grava e
   já abre a próxima; nada de "Seguir"/"Corrigir minha resposta"); Continuar sempre ativo com mensagem role=alert logo
   acima; Continuar preso ao pé da tela (360x640, 390x844 com letra a 130%, 740x360); aria-pressed nas opções e foco no
   enunciado depois do Continuar; "Etapa" no lugar de "Módulo"; alvos de toque >= 44 px; "Pergunta N" sem total que pula
   e barra que nunca volta; tempo da capa pelo caminho típico (~35 s por pergunta, múltiplo de 5 min).
   Sabotagem 3: M02_SABOTAGEM=3 volta o passo extra (Continuar mostra "Seguir" + "Corrigir minha resposta"; o teste tem de falhar).
   Sabotagem 4: M02_SABOTAGEM=4 volta a P01 para "Não sei" que bloqueia (o teste tem de falhar). */
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
/* versão leve: palavras visíveis numa tela de pergunta, antes de tocar em nada (innerText: o que está fechado não conta) */
const LIMITE_PALAVRAS = 66;
const contaPalavras = (s) => String(s || '').split(/\s+/).filter((w) => /[A-Za-zÀ-ÿ0-9]/.test(w)).length;

let playwright;
try { playwright = require('playwright'); } catch { playwright = require(process.env.PW); }

/* ---------- estático ---------- */
const app = fs.readFileSync(path.join(dir, 'js/app.js'), 'utf8');
/* versão do estado salvo: 5 desde a auditoria 17/11 (P01/P16); as migrações v2→v3→v4 continuam rodando antes dela */
const VERSAO_ESTADO = 5;
ok(/const VERSAO = 5;/.test(app), 'app grava o estado na versão 5');
ok(/const CHAVE = "lg2-turma-b-m02";/.test(app), 'CHAVE deve ser lg2-turma-b-m02');
ok(D.modulo.turma === 'Turma de 18', 'Capa C7 deve ser Turma de 18');
const nP = M.perguntas.length, nR = D.regras.length;
ok(D.modulo.nome === 'Quem são seus clientes e como compram', 'título sem jargão');
ok(D.educativo.find((e) => e.codigo === 'M2.E02').onde === 'M2.P18', 'Faça conversas aparece depois da resposta P04');
const persist = ['M2.R05','M2.R15','M2.R16','M2.R17','M2.R19','M2.R60','M2.R61','M2.R62','M2.R73','M2.R74','M2.R75','M2.R77','M2.R78','M2.R82','M2.R83'];
ok(nP === 19 && nR === 87, `contagens 19 perguntas visíveis / 87 regras (obtido ${nP}/${nR})`);
/* Lote 16/11 G: alertas gerais não aparecem no retorno; alertas de risco dependentes da resposta permanecem. */
const ALERTA_NA_DICA = new Set(['M2.R05','M2.R15','M2.R16','M2.R17','M2.R19','M2.R60','M2.R61','M2.R62','M2.R73','M2.R74','M2.R75','M2.R77','M2.R78','M2.R82','M2.R83']);
const alertaVale = (r) => !ALERTA_NA_DICA.has(r.codigo);
for (const c of persist) ok(D.regras.some((r) => r.codigo === c && ALERTA_NA_DICA.has(r.codigo)), `${c}: alerta geral foi movido para a dica`);
const regraMorta = (r) => /=\s*(Não sei|Ainda não pensei nisso)\s*$/.test(String(r.condicao).trim()) || /M2\.P(16|20)\b/.test(r.condicao);
const VIVAS = D.regras.filter((r) => !regraMorta(r));
const nVivas = VIVAS.length;
ok(JSON.stringify(M.regras.map((r) => r.codigo)) === JSON.stringify(D.regras.filter((r) => !/M2\.P(16|20)\b/.test(r.condicao)).map((r) => r.codigo)), 'motor: regras de P16/P20 fora');
/* Auditoria 17/11: só P01 e P16 (sobre a própria pessoa) mudam; P05, P07, P10–P14 e P17 são fatos a descobrir e mantêm o "Não sei" que bloqueia. */
const SEM_NS = ['M2.P03', 'M2.P04', 'M2.P15', 'M2.P16', 'M2.P18', 'M2.P19', 'M2.P21'];
const COM_NS_FATO = ['M2.P05', 'M2.P07', 'M2.P10', 'M2.P11', 'M2.P12', 'M2.P13', 'M2.P14', 'M2.P17'];
for (const c of COM_NS_FATO) ok(M.porCodigo[c] && M.porCodigo[c].opcoesLista.includes('Não sei') && M.porCodigo[c].comoDescobrir && M.porCodigo[c].comoDescobrir.length >= 2, `${c}: fato a descobrir mantém "Não sei" com "Como descobrir"`);
for (const c of SEM_NS) { const q = D.perguntas.find((x) => x.codigo === c); ok(!q || !q.opcoes.split(';').map((x) => x.trim()).includes('Não sei'), `${c}: sem "Não sei" (pergunta sobre a própria pessoa)`); }
ok(JSON.stringify(M.porCodigo['M2.P01'].opcoesLista) === '["Sim","Em parte","Ainda não sei"]', 'P01: Ainda não sei é resposta real');
ok(JSON.stringify(M.porCodigo['M2.P21'].opcoesLista) === '["Contaram um problema de verdade","Só elogiaram a ideia"]', 'P21: situação da própria conversa, sem Não sei');
ok(JSON.stringify(M.porCodigo['M2.P04'].opcoesLista) === '["Sim","Não"]', 'P04: pergunta sim/não sobre situação própria, só Sim/Não');
ok(!/Ainda não pensei/.test(JSON.stringify(D.perguntas)), 'nenhuma pergunta com "Ainda não pensei"');
ok(M.porCodigo['M2.P10'].opcoesEx['Paga mais por diferencial'] && M.porCodigo['M2.P14'].opcoesEx['Órgãos públicos/instituições'], 'opções difíceis com exemplos curtos sob o rótulo literal');
for (const c of ALERTA_NA_DICA) {
  const r = D.regras.find((x) => x.codigo === c);
  if (r) ok(!alertaVale(r), `${c}: orientação geral não aparece como Atenção no retorno`);
}
for (const c of ['M2.R09','M2.R13','M2.R26','M2.R38','M2.R88','M2.R89']) ok(alertaVale(D.regras.find((r) => r.codigo === c)), `${c}: alerta de risco dependente da resposta mantido`);
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
    if (!M.porCodigo[cod]) continue;
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
    fs.readFile(f, (e, b) => {
      if (e) return res.writeHead(404).end();
      if (process.env.M02_SABOTAGEM && process.env.M02_SABOTAGEM !== '4' && f.endsWith(path.join('js', 'app.js'))) {
        const alvo = 'if (!q || !q.comoDescobrir || !q.comoDescobrir.length) return "";';
        if (!String(b).includes(alvo)) throw new Error('sabotagem: trecho não encontrado');
        b = String(b).replace(alvo, 'return "";');
      }
      if (process.env.M02_SABOTAGEM === '2' && f.endsWith(path.join('js', 'app.js'))) {
        const alvo = 'if (escolhida === Motor.NS) { ajudaAoVivo(true); return erro(MSG_NS_ESCOLHA); }';
        if (!String(b).includes(alvo)) throw new Error('sabotagem 2: trecho não encontrado');
        b = String(b).replace(alvo, '');
      }
      if (process.env.M02_SABOTAGEM === '3' && f.endsWith(path.join('js', 'app.js'))) {
        const alvo = '      avancar(prox);\n';
        if (!String(b).includes(alvo)) throw new Error('sabotagem 3: trecho não encontrado');
        b = String(b).replace(alvo, '      const a = p.querySelector("#acoes"); a.innerHTML = \'<button class="btn btn-primario" id="seguir">Seguir</button><button class="btn btn-claro">Corrigir minha resposta</button>\'; a.querySelector("#seguir").onclick = () => avancar(prox);\n');
      }
      if (process.env.M02_SABOTAGEM === '4' && f.endsWith(path.join('dados', 'modulo2.js'))) {
        const alvo = '"opcoes": "Sim; Em parte; Ainda não sei"';
        if (!String(b).includes(alvo)) throw new Error('sabotagem 4: trecho não encontrado');
        b = String(b).replace(alvo, '"opcoes": "Sim; Em parte; Não sei"');
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
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const erros = [];
  page.on('pageerror', (e) => erros.push(e.message));
  page.on('response', (r) => { if (r.status() >= 400) erros.push(r.url()); });
  const shot = async (nome) => { if (SHOTS) { await page.waitForTimeout(400); await page.screenshot({ path: path.join(SHOTS, `m02_${nome}.png`) }); } };
  const clicarTexto = (sel, t) => page.evaluate(([sel, t]) => {
    const b = [...document.querySelectorAll(sel)].find((x) => x.textContent.trim() === t);
    if (!b) return false; b.click(); return true;
  }, [sel, t]);
  const palavrasTela = () => page.evaluate(() => document.querySelector('#tela').innerText);
  const palavrasMax = {};
  const regrasNaTela = () => page.evaluate(() => [...document.querySelectorAll('.regra .r-texto')].map((x) => x.textContent));
  const dicaTexto = (cod) => norm(M.porCodigo[cod] ? [M.porCodigo[cod].ajuda, ...D.regras.filter((r) => r.pergunta === cod && ALERTA_NA_DICA.has(r.codigo)).map((r) => r.alerta), ...D.regras.filter((r) => r.pergunta === cod).map((r) => r.alerta).filter((a) => ALERTA_NA_DICA.has(D.regras.find((r) => r.pergunta === cod && r.alerta === a)?.codigo))].filter((x) => x && x !== 'Nenhum').join(' ') : '');
  const porTexto = new Map(D.regras.map((r) => [norm(Motor.limpa(r.texto)), r.codigo]));
  const alcancadas = new Set();

  async function inicio() {
    await page.goto(srv.url + 'index.html');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await clicarTexto('button', 'Começar');
  }
  /* lote 17/11: nenhum botão de passo extra na tela */
  const semPassoExtra = async (onde) => {
    const extra = await page.evaluate(() => [...document.querySelectorAll('button')].map((b) => b.textContent.trim()).filter((x) => /^(Seguir|Corrigir minha resposta)$/.test(x)));
    if (extra.length) falhas.push(`${onde}: passo extra na tela (${extra.join(', ')})`);
  };
  /* pos = posição esperada no caminho da pessoa (1, 2, 3…). Responde SEM tocar no Continuar: o retorno tem de aparecer
     ao vivo, logo abaixo da resposta (escolha: no toque; campo: ao sair dele ou ~700 ms depois de parar de digitar). */
  async function responder(cod, v, pos) {
    const q = M.porCodigo[cod];
    const t = Motor.campo(q);
    const passo = await page.locator('.passo').textContent();
    const m = passo.match(/^Pergunta (\d+)$/);
    if (!m) throw new Error(`passo fora do formato "Pergunta N" (sem total que muda no meio) em ${cod}: "${passo}"`);
    if (pos && +m[1] !== pos) throw new Error(`esperava ${cod} como pergunta ${pos}, tela mostra "${passo}"`);
    if (cod !== 'M2.P21' && norm(await page.locator('h2.q').textContent()) !== norm(q.pergunta)) throw new Error(`texto de ${cod} difere da planilha`);
    /* versão leve: até LIMITE_PALAVRAS palavras visíveis e "Ver dica" fechada entre a pergunta e as respostas */
    const txtTela = await palavrasTela();
    if (/a preencher/i.test(txtTela)) falhas.push(`${cod}: cartão de vídeo sem link ("a preencher") na tela`);
    if (/m[óo]dulo/i.test(txtTela)) falhas.push(`${cod}: "Módulo" no texto visível (a jornada chama de Etapa)`);
    const np = contaPalavras(txtTela);
    palavrasMax[cod] = Math.max(palavrasMax[cod] || 0, np);
    const dk = await page.evaluate(() => [...document.querySelectorAll('details.dica-toggle')].map((d) => ({ open: d.open, sum: d.querySelector('summary').textContent.trim(),
      entre: !!(document.querySelector('h2.q').compareDocumentPosition(d) & Node.DOCUMENT_POSITION_FOLLOWING) && !!(d.compareDocumentPosition(document.querySelector('#ent')) & Node.DOCUMENT_POSITION_FOLLOWING) })));
    if (!(dk.length === (q.ajuda ? 1 : 0) && dk.every((d) => !d.open && d.sum === 'Ver dica' && d.entre))) falhas.push(`${cod}: "Ver dica" fechada entre a pergunta e as respostas (obtido ${JSON.stringify(dk)})`);
    /* (B) Continuar sempre ativo; (D) barra registrada para conferir que nunca volta */
    if (await page.locator('#ok').isDisabled()) falhas.push(`${cod}: Continuar desabilitado`);
    barras.push(+(await page.locator('.heroi [role=progressbar]').getAttribute('aria-valuenow')));
    if (t === 'escolha') {
      if (!(await clicarTexto('#ent .opcao', v))) throw new Error(`opção "${v}" não existe em ${cod}`);
      /* (D) leitor de tela: a escolhida diz "marcada", as outras "não marcada" */
      const pr = await page.evaluate(() => [...document.querySelectorAll('#ent .opcao')].map((b) => [b.querySelector('.op-txt b').textContent, b.getAttribute('aria-pressed')]));
      if (!pr.every(([o, a]) => a === (o === v ? 'true' : 'false'))) falhas.push(`${cod}: aria-pressed errado depois do toque em "${v}" (obtido ${JSON.stringify(pr)})`);
    }
    else if (v === 'Não sei') await page.click('#ns');
    else await page.fill('#ent input, #ent textarea', v === 'TEXTO' ? 'Texto de teste' : v);
    if (v === 'Não sei') return;
    /* (A) o retorno aparece antes de tocar em Continuar e nada foi gravado ainda */
    await page.waitForSelector('#retorno .retorno', { timeout: 5000 });
    const ret = await page.locator('#retorno').innerText();
    if (/M2\.[PI]\d{2}/.test(ret)) falhas.push(`código interno aparece na tela de ${cod}: ${ret.match(/.{0,40}M2\.[PI]\d{2}.{0,20}/)[0]}`);
    for (const x of await regrasNaTela()) { const c = porTexto.get(norm(x)); if (c) alcancadas.add(c); }
    await semPassoExtra(cod);
  }
  /* (A) um toque: Continuar grava e já abre a próxima pergunta (ou o resumo); (D) foco no enunciado da nova pergunta */
  async function continuar(proxCod, nome) {
    const n0 = await page.locator('.passo').textContent();
    if (!(await clicarTexto('#acoes .btn', nome || 'Continuar'))) throw new Error(`botão "${nome || 'Continuar'}" não encontrado em "${n0}"`);
    if (proxCod === 'RESULTADO') { await page.waitForSelector('.passo:text("Resultado")', { timeout: 5000 }); return; }
    const q = M.porCodigo[proxCod];
    const ok1 = await page.evaluate(([t, p21]) => { const h = document.querySelector('h2.q'); return !!h && (p21 || h.textContent.replace(/\s+/g, ' ').trim() === t); }, [norm(q.pergunta), proxCod === 'M2.P21']);
    if (!ok1) throw new Error(`um toque em Continuar (em "${n0}") deveria abrir ${proxCod}; tela: ${norm(await page.locator('#tela').innerText()).slice(0, 160)}`);
    const foco = await page.evaluate(() => document.activeElement && document.activeElement.matches('h2.q') && document.activeElement.getAttribute('tabindex') === '-1');
    if (!foco) falhas.push(`depois de Continuar, o foco devia estar no enunciado de ${proxCod}`);
  }
  let barras = [];
  async function percorrer(seq, aoResponder) {
    await inicio();
    barras = [];
    for (const [i, [cod, v]] of seq.entries()) {
      await responder(cod, v, i + 1);
      if (aoResponder) await aoResponder(cod, v);
      const fim = i === seq.length - 1;
      await continuar(fim ? 'RESULTADO' : seq[i + 1][0], fim ? 'Ver meu resumo' : 'Continuar');
    }
    /* (G) a barra nunca volta para trás ao seguir em frente */
    if (barras.some((x, k) => k > 0 && x < barras[k - 1])) falhas.push(`barra voltou para trás no caminho ${seq.map((s) => s[0].slice(3)).join(',')}: ${barras.join(',')}`);
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
    for (const r of VIVAS) {
      if (alcancadas.has(r.codigo)) continue;
      const seq = planejar(atomos(r.condicao));
      caminhos++;
      await percorrer(seq, caminhos === 1 ? null : null);
      if (!alcancadas.has(r.codigo)) falhas.push(`regra ${r.codigo} (${r.condicao}) não apareceu no caminho ${seq.map((s) => s.join('=')).join('; ')}`);
    }
    const inal = VIVAS.filter((r) => !alcancadas.has(r.codigo)).map((r) => r.codigo);
    const mortasVistas = D.regras.filter((r) => regraMorta(r) && alcancadas.has(r.codigo)).map((r) => r.codigo);
    ok(!mortasVistas.length, `regras de "Não sei"/P16/P20 não devem aparecer (apareceram ${mortasVistas.join(', ')})`);
    console.log(`Regras alcançadas pela interface: ${alcancadas.size} de ${nVivas} que ainda podem disparar (${nR - nVivas} de "Não sei"/P16/P20 não disparam mais; ${caminhos} caminhos)${inal.length ? ' · inalcançáveis: ' + inal.join(', ') : ''}`);

    /* 3) pergunta que mudou na v0.3 (próximo passo genérico da aba 3) + print */
    await inicio();
    /* Auditoria 17/11: P01 "Ainda não sei" grava e avança num toque. */
    await clicarTexto('#ent .opcao', 'Ainda não sei');
    ok((await page.locator('#ajuda-ns .como-descobrir').count()) === 0, 'P01 ainda não sei: resposta real não bloqueia');
    await page.waitForTimeout(300);
    const dicaP01 = norm(await page.locator('#retorno .como-descobrir').textContent().catch(() => ''));
    ok(dicaP01.startsWith('Como descobrir') && M.porCodigo['M2.P01'].comoDescobrir.every((x) => dicaP01.includes(norm(x))) && (await page.locator('#ent .opcao[aria-pressed="true"]').textContent()).trim().startsWith('Ainda não sei'), `P01 ainda não sei: marcado e "Como descobrir" vira dica ao vivo no retorno (obtido "${dicaP01}")`);
    await page.click('#ok');
    const p01novo = JSON.parse(await page.evaluate(() => localStorage.getItem('lg2-turma-b-m02')));
    ok(p01novo.R['M2.P01'].opcao === 'Ainda não sei' && norm(await page.locator('h2.q').textContent()) === M.porCodigo['M2.P04'].pergunta, 'P01 ainda não sei grava e avança num toque pelo ramo sem público definido');
    await inicio();

    /* 10) relatório da Júlia: um bloco de cada, linguagem para o usuário, legal como Atenção, Continuar avança */
    const contar = () => page.evaluate(() => ({ a: document.querySelectorAll('#retorno .b-alerta').length, p: document.querySelectorAll('#retorno .b-proximo').length, ns: document.querySelectorAll('#retorno .b-naosei').length, t: document.querySelector('#retorno').innerText }));
    const alertasNaTela = async () => page.evaluate(() => [...document.querySelectorAll('#retorno .b-alerta')].map((x) => x.innerText));
    await inicio();
    /* (B) Continuar sem resposta: mensagem simples, role=alert, logo acima do botão; nada avança */
    await page.click('#ok');
    const eb = await page.evaluate(() => { const e = document.querySelector('#erro'), b = document.querySelector('#ok'); return { t: e.textContent, role: e.getAttribute('role'), vis: !e.hidden, acima: e.getBoundingClientRect().bottom <= b.getBoundingClientRect().top + 1, dis: b.disabled }; });
    ok(eb.t === 'Escolha uma opção para continuar.' && eb.role === 'alert' && eb.vis && eb.acima && !eb.dis, `P01 vazia: mensagem role=alert acima do Continuar (obtido ${JSON.stringify(eb)})`);
    await responder('M2.P01', 'Sim');
    ok(!(await page.evaluate(() => (JSON.parse(localStorage.getItem('lg2-turma-b-m02')) || { R: {} }).R['M2.P01'])), 'P01: o retorno ao vivo não grava nada antes do Continuar');
    let k = await contar();
    ok(k.p === 1 && k.a <= 1 && !/\bapp\b|próxima pergunta/.test(k.t), `P01 Sim: um Próximo passo, sem linguagem de montagem (obtido ${JSON.stringify(k)})`);
    ok(k.t.includes(M.porCodigo['M2.P01'].proximo), 'P01 Sim: o próximo passo é a frase para pensar (nova)');
    for (const q of M.perguntas) ok(!/\bo app\b/i.test(q.proximo), `${q.codigo}: próximo passo sem "o app"`);
    /* (A) um só botão, "Continuar", que leva direto à próxima pergunta */
    const nomes = await page.locator('#acoes .btn').allTextContents();
    ok(nomes.length === 1 && nomes[0] === 'Continuar', `um só botão, Continuar (obtido ${nomes.join('/')})`);
    await continuar('M2.P02');
    ok(norm(await page.locator('h2.q').textContent()) === M.porCodigo['M2.P02'].pergunta, 'Continuar leva à próxima pergunta (P02) num toque');
    /* (B) campo vazio: mensagem simples */
    await page.click('#ok');
    ok(norm(await page.locator('#erro').textContent()) === 'Escreva a sua resposta para continuar.' && await page.locator('#erro').isVisible(), 'P02 vazia: "Escreva a sua resposta para continuar."');
    /* (A) campo de texto: o retorno aparece sozinho ~700 ms depois de parar de digitar */
    await page.fill('#ent textarea', 'Mães do bairro');
    ok((await page.locator('#retorno .retorno').count()) === 0, 'P02: o retorno espera a pessoa parar de digitar');
    await page.waitForSelector('#retorno .retorno', { timeout: 3000 });
    ok(await page.locator('#ent textarea').evaluate((x) => x === document.activeElement), 'P02: retorno ao vivo sem tirar o foco do campo');
    await continuar('M2.P03');
    const dicaP03 = norm(await page.locator('.dica .ajuda').textContent());
    ok(dicaP03.length > 0 && (await page.locator('#retorno .b-alerta').count()) === 0, 'P03: dica aparece antes da resposta, sem alerta prematuro');
    await clicarTexto('#ent .opcao', 'Conversa com conhecidos');
    const alerta03 = norm(await page.locator('#retorno .b-alerta').textContent());
    ok(alerta03.includes(norm(D.regras.find((r) => r.codigo === 'M2.R09').alerta)) && await page.locator('#acoes .btn').count() > 0, 'P03: alerta específico para conversa com conhecidos fica como aviso, sem bloquear');
    /* em todas as regras: no máximo uma Atenção e um Próximo passo por pergunta; "Não sei" sempre explica */
    for (const seq of [planejar({ 'M2.P05': 'De dois a três grupos', 'M2.P04': 'Não' }), planejar({ 'M2.P05': 'Quase qualquer pessoa', 'M2.P08': 'Nenhuma muda muito' }), planejar({ 'M2.P04': 'Sim', 'M2.P18': '3', 'M2.P19': 'Não', 'M2.P21': 'Contaram um problema de verdade' }), planejar({ 'M2.P07': 'Os dois', 'M2.P08': 'Motivo da compra', 'M2.P14': 'Pequenos negócios', 'M2.P17': 'Toda semana' })]) {
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
      /* lote 16/11: "Não sei"/"Ainda não pensei nisso" não são mais gravados; P16/P20 saíram. O caso segue com a 1ª opção. */
      for (const k of Object.keys(alvo)) if (/^(Não sei|Ainda não pensei nisso)$/.test(alvo[k]) || !M.porCodigo[k]) { div.push(`${c.codigo}: ${k} = ${alvo[k]} não é mais aceito no app (lote 16/11); o caso segue sem essa resposta`); delete alvo[k]; }
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
    await continuar('M2.P02');
    await page.fill('#ent textarea', 'Mães do bairro');
    await page.reload();
    await clicarTexto('button', 'Continuar de onde parei');
    ok((await page.locator('.passo').textContent()) === 'Pergunta 2', 'recarregar volta à pergunta em que parou');
    await page.click('#v');
    ok(await page.locator('#ent .opcao.sel').textContent() === 'Em parte', 'resposta anterior persiste após recarregar');
    ok(await page.evaluate(() => !!localStorage.getItem('lg2-turma-b-m02')), 'respostas gravadas na chave lg2-turma-b-m02');

    /* 8) relatório do testador (05/11/2026) */
    // 8a) P21 reescrita: linguagem simples, ponte com as conversas, ajuda explica elogio x problema
    const q21 = M.porCodigo['M2.P21'];
    ok(/^As pessoas com quem conversou contaram um problema de verdade ou só elogiaram\?$/.test(q21.pergunta), 'P21: enunciado novo (versão leve)');
    ok(JSON.stringify(q21.opcoesLista) === JSON.stringify(['Contaram um problema de verdade', 'Só elogiaram a ideia']), 'P21: opções novas');
    ok(/que legal/.test(q21.ajuda) && /pergunta o preço/.test(q21.ajuda) && /reservar/.test(q21.ajuda), 'P21: ajuda explica elogio x problema de verdade');
    ok(!/Problema confirmado|Só elogios/.test(JSON.stringify(D)), 'nenhuma regra depende das opções antigas da P21');
    await percorrer(planejar({ 'M2.P04': 'Sim', 'M2.P18': '6', 'M2.P19': 'Sim', 'M2.P21': 'Contaram um problema de verdade' }), async (cod) => {
      if (cod !== 'M2.P21') return;
      ok(norm(await page.locator('h2.q').textContent()).startsWith('As 6 pessoas com quem você conversou'), 'P21 faz ponte com o número de pessoas da pergunta anterior');
      ok((await page.locator('.dica .ajuda').textContent()).includes('que legal'), 'P21 mostra a ajuda nova');
      await page.evaluate(() => { document.querySelector('#retorno').innerHTML = ''; window.scrollTo(0, 0); });
      await shot('p21');
    });
    ok(alcancadas.has('M2.R89'), 'regra das respostas consistentes (R89) segue alcançável com a opção nova');
    // 8b) ramo curto (não conversou com ninguém): P21 não aparece e o caminho fica com 7 perguntas
    const curto = planejar({ 'M2.P01': 'Em parte', 'M2.P04': 'Não', 'M2.P05': 'Um único grupo', 'M2.P08': 'Nenhuma muda muito' });
    ok(curto.length === 8 && !curto.some(([c]) => c === 'M2.P21'), `ramo curto deveria ter 8 perguntas sem a P21 (obtido ${curto.map((s) => s[0]).join(',')})`);
    await percorrer(curto);
    // 8c) herança: M1 (ideia, tipo, estágio) e M3 (perfil P10 + P11) semeados
    const M1 = { v: 3, R: { 'M1.P01': { estado: 'opcao', opcao: 'Já fiz um pouco para testar ou dar de amostra' }, 'M1.P03': { estado: 'valor', valor: 'Lavagem de carro em domicílio' }, 'M1.P03A': { estado: 'opcao', opcao: 'Serviço: meu cliente paga pelo trabalho que realizo' } } };
    const M3 = { v: 3, R: { 'M3.P10': { estado: 'opcao', opcao: 'Pessoas comuns (consumidor final)', campos: { Idade: '30 a 55 anos', Renda: '', Ocupação: 'trabalha fora o dia todo', 'Onde mora': 'condomínios do bairro', 'O que precisa resolver (a dor)': '' } }, 'M3.P11': { estado: 'valor', valor: 'falta de tempo para levar o carro ao lava-jato' } } };
    const enun = (cod) => M.porCodigo[cod].pergunta.replace(/\b(seu|este|esse) produto ou serviço/g, '$1 serviço').replace(/\b([Ss])eu produto serve/, '$1eu serviço serve');
    const semear = async (extra) => { await page.goto(srv.url + 'index.html'); await page.evaluate(([a, b, x]) => { localStorage.clear(); localStorage.setItem('lg2-turma-a-m01', a); localStorage.setItem('lg2-turma-a-m03', b); if (x) localStorage.setItem('lg2-turma-b-m02', x); }, [JSON.stringify(M1), JSON.stringify(M3), extra || null]); await page.reload(); };
    await semear();
    await clicarTexto('button', 'Começar');
    ok(norm(await page.locator('#contexto').innerText()).startsWith('Seu negócio: Lavagem de carro em domicílio Veio da Etapa 1'), 'ideia da Etapa 1 aparece como contexto');
    ok(norm(await page.locator('h2.q').textContent()) === 'Você já sabe quem mais compraria o seu serviço?', 'enunciado usa "serviço" (tipo vindo do Módulo 1)');
    await clicarTexto('#ent .opcao', 'Sim'); await page.click('#ok');
    const p02 = await page.locator('#ent textarea').inputValue();
    ok(p02 === 'Pessoas comuns de 30 a 55 anos (ocupação: trabalha fora o dia todo), que moram em condomínios do bairro. Problema que você resolve: falta de tempo para levar o carro ao lava-jato', `P02 pré-preenchida com o perfil do Módulo 3 em frase (obtido "${p02}")`);
    ok(norm(await page.locator('#herdado').innerText()) === 'Veio da Etapa 3 Confira e ajuste se quiser.', 'P02 mostra o selo "Veio da Etapa 3"');
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
      ok(norm(await page.locator('h2.q').textContent()) === norm(enun(cod)), `herança: um toque leva a ${cod}`);
      // 9c) exemplo da ajuda conforme o tipo (serviço vindo do Módulo 1): manicure, não bolo
      if (cod === 'M2.P05') { const aj = await page.locator('.dica .ajuda').textContent(); ok(/unhas/.test(aj) && !/bolo/.test(aj), `P05: exemplo de serviço para quem presta serviço (obtido "${aj}")`); }
      await clicarTexto('#ent .opcao', v); await page.click('#ok');
    }
    ok(norm(await page.locator('h2.q').textContent()) === M.porCodigo['M2.P07'].pergunta, 'chegou na P07');
    ok((await page.locator('#ent .opcao.sel').textContent()) === 'Pessoas' && (await page.locator('#herdado').count()) === 1, 'P07 vem marcada com "Pessoas" (Etapa 3) e selo');
    ok((await page.locator('#ent .opcao.sel').getAttribute('aria-pressed')) === 'true', 'P07 herdada: a opção marcada diz aria-pressed=true');
    ok((await regrasNaTela()).some((x) => norm(x) === norm(D.regras.find((r) => r.codigo === 'M2.R21').texto)), 'P07 herdada mostra o retorno de "Pessoas" já ao abrir');
    await page.click('#ok');
    // segue até o fim com respostas típicas e confere a caixa "O que entendemos até aqui"
    const resto = [['M2.P08', 'Hábitos de compra'], ['M2.P13', 'Praticidade/rapidez'], ['M2.P17', 'Todo mês'], ['M2.P18', '4'], ['M2.P19', 'Não'], ['M2.P21', 'Só elogiaram a ideia']];
    for (const [cod, v] of resto) {
      const q = M.porCodigo[cod];
      if (cod !== 'M2.P21') ok(norm(await page.locator('h2.q').textContent()) === norm(enun(cod)), `herança: um toque leva a ${cod}`);
      if (cod === 'M2.P18') {
        // 9d) campo de número: texto e negativo não gravam; número muito alto avisa e deixa seguir no 2º toque
        ok(await page.locator('#ent input').getAttribute('inputmode') === 'numeric', 'P18 abre o teclado numérico');
        for (const [x, re] of [['quatro', /Digite só números/], ['-3', /não pode ser negativo/]]) {
          await page.fill('#ent input', x); await page.click('#ok');
          ok(re.test(await page.locator('#erro').textContent()) && (await page.locator('#retorno .retorno').count()) === 0, `P18 "${x}" deveria ser recusado com mensagem simples`);
        }
        ok(!(await page.evaluate(() => JSON.parse(localStorage.getItem('lg2-turma-b-m02')).R['M2.P18'])), 'P18 inválido não é gravado');
        await page.fill('#ent input', '5000'); await page.click('#ok');
        ok(/parece alto/.test(await page.locator('#erro').textContent()) && norm(await page.locator('h2.q').textContent()) === norm(q.pergunta), 'P18 5000: aviso de valor alto no 1º toque (aviso de risco continua em 2 passos)');
        await page.click('#ok');
        ok(norm(await page.locator('h2.q').textContent()) === norm(M.porCodigo['M2.P19'].pergunta), 'P18 5000: o 2º Continuar com o mesmo valor segue');
        await semPassoExtra('P18 5000');
        await page.click('#v');
        ok((await page.locator('#ent input').inputValue()) === '5000', 'Voltar do topo reabre a P18 com o valor (no lugar do antigo "Corrigir minha resposta")');
      }
      if (Motor.campo(q) === 'escolha') { if (!(await clicarTexto('#ent .opcao', v))) throw new Error(`herança: opção ${v} ausente em ${cod}`); }
      else { await page.fill('#ent input, #ent textarea', v); }
      if (cod !== 'M2.P21') await page.click('#ok');
    }
    ok((await page.locator('.passo').textContent()) === 'Pergunta 12', 'caminho típico (lava-jato) termina na pergunta 12');
    ok((await page.locator('#ok').textContent()) === 'Ver meu resumo', 'última pergunta: o botão se chama "Ver meu resumo"');
    await clicarTexto('#acoes .btn', 'Ver meu resumo');
    await page.waitForSelector('#entendemos');
    const ent = await page.locator('#entendemos p:not(.mini-info)').allTextContents();
    /* texto corrido (relatório do Bento): 1 a 3 parágrafos, sem lista */
    ok(ent.length >= 1 && ent.length <= 3, `caixa "O que entendemos" em 1 a 3 parágrafos (obtido ${ent.length})`);
    ok(await page.evaluate(() => { const e = document.querySelector('#entendemos'); return !e.querySelector('ul, ol, li') && e.querySelectorAll('p:not(.mini-info)').length >= 1; }), 'caixa "O que entendemos" sem <li> e com pelo menos um <p>');
    ok(ent.join(' ').split(/(?<=[.!?])\s+(?=[A-ZÀ-Ú])/).length >= 3, 'caixa "O que entendemos" continua com 3 ou mais frases');
    const entT = ent.join(' ');
    for (const trecho of ['Você vende (ou quer vender) lavagem de carro em domicílio, que é um serviço, e você já começou a testar.', 'Seus clientes seriam principalmente pessoas que compram para si ou para a família', 'Você vê um único grupo de clientes; o que mais muda entre um cliente e outro é: hábitos de compra (praticidade/rapidez).', 'Cada cliente compraria todo mês.', 'Você já conversou com 4 pessoas, mas ninguém fez nada concreto ainda. Por enquanto, o que você ouviu foi mais elogio do que um problema de verdade.'])
      ok(entT.includes(trecho), `"O que entendemos" deveria trazer: ${trecho} (obtido: ${entT})`);
    ok(await page.evaluate(() => { const c = document.querySelector('.corpo'); const e = document.querySelector('#entendemos'); const r = document.querySelector('.res-num'); return e.compareDocumentPosition(r) & Node.DOCUMENT_POSITION_FOLLOWING; }), 'caixa "O que entendemos" fica acima dos números do resultado');
    ok(await page.evaluate(() => { const r = document.querySelector('.corpo'); return [...r.querySelectorAll('details')].length > 0 && [...r.querySelectorAll('details')].every((d) => d.open); }), 'todas as seções recolhíveis do resultado abrem por padrão');
    ok(await page.evaluate(() => { const d = document.querySelector('details#suas-respostas'); return d && d.open && /Ver suas respostas/.test(d.querySelector('summary').textContent); }), 'lista de respostas aberta em "Ver suas respostas"');
    ok((await page.locator('#suas-respostas .veio').count()) === 2, 'respostas herdadas (P02 e P07) aparecem com selo na lista');
    const corpoRes = await page.evaluate(() => { const c = document.querySelector('.corpo').cloneNode(true); c.querySelectorAll('details.saiba:not(#suas-respostas)').forEach((d) => d.remove()); return c.innerText; });
    ok(!/M2\.[PI]\d{2}/.test(corpoRes), 'resultado sem códigos internos (M2.Pxx/M2.Ixx)');
    await page.evaluate(() => document.querySelector('#entendemos').scrollIntoView());
    await shot('resultado_entendemos');
    // 9e) formato do estado salvo, lido por outros módulos (Módulo 10): {v, R:{código:{estado, opcao|valor}}}
    const est = await page.evaluate(() => JSON.parse(localStorage.getItem('lg2-turma-b-m02')));
    ok(est.v === VERSAO_ESTADO && est.R['M2.P17'].estado === 'opcao' && est.R['M2.P17'].opcao === 'Todo mês' && est.R['M2.P18'].estado === 'valor' && est.R['M2.P18'].valor === '4'
      && est.R['M2.P21'].opcao === 'Só elogiaram a ideia' && est.R['M2.P02'].estado === 'valor' && !est.R['M2.P20'] && !JSON.stringify(est.R).includes('naosei'), `estado salvo no formato esperado (obtido ${JSON.stringify(est.R).slice(0, 300)})`);
    const outros = await page.evaluate(() => [localStorage.getItem('lg2-turma-a-m01'), localStorage.getItem('lg2-turma-a-m03')]);
    ok(outros[0] === JSON.stringify(M1) && outros[1] === JSON.stringify(M3), 'Módulos 1 e 3 não são alterados (só leitura)');
    // 8d) "Não sei" no Módulo 3 não conta como herança
    await page.goto(srv.url + 'index.html');
    await page.evaluate(() => { localStorage.clear(); localStorage.setItem('lg2-turma-a-m03', JSON.stringify({ v: 3, R: { 'M3.P10': { estado: 'naosei' } } })); });
    await page.reload();
    await clicarTexto('button', 'Começar');
    ok((await page.locator('#contexto').count()) === 0, 'sem dado do Módulo 1, não mostra o contexto');
    for (const [cod, v] of [['M2.P01', 'Em parte'], ['M2.P02', 'Mães do bairro'], ['M2.P03', 'Conversa com conhecidos'], ['M2.P04', 'Não'], ['M2.P05', 'Um único grupo']]) { if (cod === 'M2.P02') await page.fill('#ent textarea', v); else await clicarTexto('#ent .opcao', v); await page.click('#ok'); }
    ok(norm(await page.locator('h2.q').textContent()) === M.porCodigo['M2.P07'].pergunta, 'cinco toques em Continuar levam à P07');
    ok((await page.locator('#ent .opcao.sel').count()) === 0 && (await page.locator('#herdado').count()) === 0, '"Não sei" do Módulo 3 não pré-marca a P07');
    // 9c) sem tipo do negócio, o exemplo da planilha (bolo) continua
    ok(/bolo/.test(M.porCodigo['M2.P05'].ajuda), 'P05 da planilha fala de bolo');
    // 9b) bug do relatório: "Empresas (Local: Bolos caseiros de pote)". Cada campo no lugar certo; o que repete a ideia sai; "Não sei" sai
    const p02De = async (m1, m3) => {
      await page.goto(srv.url + 'index.html');
      await page.evaluate(([a, b]) => { localStorage.clear(); localStorage.setItem('lg2-turma-a-m01', a); localStorage.setItem('lg2-turma-a-m03', b); }, [JSON.stringify(m1), JSON.stringify(m3)]);
      await page.reload(); await clicarTexto('button', 'Começar');
      await clicarTexto('#ent .opcao', 'Sim'); await page.click('#ok');
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
    ok(mig.v === VERSAO_ESTADO && mig.R['M2.P21'].opcao === 'Só elogiaram a ideia', 'resposta antiga "Só elogios" convertida para a opção nova');

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
    await clicarTexto('button', 'O que esta etapa não faz');
    ok(await voltarNoTopo('.cartao'), 'limites: Voltar no topo');
    await semCodigo('limites');
    await page.click('#v');
    await clicarTexto('button', 'Começar');
    ok(await voltarNoTopo('h2.q'), 'pergunta: um só "‹ Voltar", à esquerda, acima do texto da pergunta');
    ok(await page.evaluate(() => document.querySelector('#v').getBoundingClientRect().top < document.querySelector('#ok').getBoundingClientRect().top), 'pergunta: Voltar acima do Continuar');
    await page.click('#v');
    ok(await page.evaluate(() => !!document.querySelector('#ir')), '1ª pergunta: Voltar volta para a capa');
    // códigos (Nayara): em todos os caminhos, a tela inteira (pergunta + retorno) não mostra Mx.Pyy
    for (const seq of [planejar({ 'M2.P05': 'De dois a três grupos', 'M2.P15': 'Pode pagar mais', 'M2.P07': 'Os dois', 'M2.P04': 'Sim', 'M2.P18': '3' }), planejar({ 'M2.P05': 'Quase qualquer pessoa', 'M2.P08': 'Nenhuma muda muito', 'M2.P04': 'Não' }), planejar({ 'M2.P01': 'Em parte', 'M2.P03': 'Suposição, ainda sem conferir', 'M2.P08': 'Onde moram/trabalham', 'M2.P17': 'Uma vez' })])
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
        /* versão leve: a dica longa inteira fica em "Ver dica", fechada (nada dela à vista antes do toque) */
        const d = await page.evaluate(() => { const a = document.querySelector('details.dica'); return { tag: a.tagName, open: a.open, sum: a.querySelector('summary').textContent.trim(), txt: a.querySelector('p.ajuda').textContent, vis: document.querySelector('#tela').innerText.includes('que legal') }; });
        ok(d.tag === 'DETAILS' && !d.open && d.sum === 'Ver dica' && d.txt.includes('que legal') && !d.vis, `P21: dica longa dentro de "Ver dica" fechada (obtido ${JSON.stringify(d)})`);
      }
    });

    // P8 (Nayara): várias respostas, "Outra" com campo de texto, "Nenhuma"/"Não sei" sozinhas
    ok(Motor.multipla(M.porCodigo['M2.P08']) && M.porCodigo['M2.P08'].opcoesLista.includes('Outra'), 'P08: várias respostas e opção "Outra"');
    const ateP08 = async () => {
      await inicio();
      for (const [c, v] of [['M2.P01', 'Em parte'], ['M2.P02', 'TEXTO'], ['M2.P03', 'Conversa com conhecidos'], ['M2.P04', 'Não'], ['M2.P05', 'Um único grupo'], ['M2.P07', 'Pessoas']]) { await responder(c, v); await clicarTexto('#acoes .btn', 'Continuar'); }
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
    await page.waitForSelector('#retorno .retorno', { timeout: 3000 });
    await semCodigo('P08 (retorno)');
    ok(!(await page.evaluate(() => JSON.parse(localStorage.getItem('lg2-turma-b-m02')).R['M2.P08'])), 'P08: retorno ao vivo não grava');
    await continuar('M2.P09');
    const r8 = await page.evaluate(() => JSON.parse(localStorage.getItem('lg2-turma-b-m02')).R['M2.P08']);
    ok(JSON.stringify(r8) === JSON.stringify({ estado: 'opcao', opcao: 'Idade/fase da vida', opcoes: ['Idade/fase da vida', 'Hábitos de compra', 'Outra'], detalhe: 'Se é para presente' }), `P08: formato salvo (obtido ${JSON.stringify(r8)})`);
    // cada característica marcada abre a sua pergunta de detalhe
    const seguintes = [];
    for (let i = 0; i < 2; i++) { seguintes.push(norm(await page.locator('h2.q').textContent())); await clicarTexto('#ent .opcao', i === 0 ? 'Adultos que trabalham' : 'Praticidade/rapidez'); await page.click('#ok'); }
    ok(JSON.stringify(seguintes) === JSON.stringify([M.porCodigo['M2.P09'].pergunta, M.porCodigo['M2.P13'].pergunta]), `P08 com 2 marcadas abre P09 e P13 (obtido ${seguintes.join(' | ')})`);
    ok(norm(await page.locator('h2.q').textContent()) === M.porCodigo['M2.P17'].pergunta, 'P13 → P17 num toque');
    await clicarTexto('#ent .opcao', 'Todo mês');
    await continuar('RESULTADO', 'Ver meu resumo');
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
    ok(mig8.v === VERSAO_ESTADO && JSON.stringify(mig8.R['M2.P08'].opcoes) === '["Motivo da compra"]' && mig8.R['M2.P21'].opcao === 'Só elogiaram a ideia', 'P08: resposta única da versão 2 migrada para lista (v3)');
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
    ok(/quadro para comparar os grupos de clientes, que fica na tela de instrumentos desta etapa/.test(px15), `P15: o aviso diz onde fica o quadro (obtido "${px15}")`);
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

    /* ===== versão leve (nov/2026) ===== */
    // capa: título + 1 frase + tempo + Começar; o resto em "Como funciona" (fechado)
    await page.goto(srv.url + 'index.html'); await page.evaluate(() => localStorage.clear()); await page.reload();
    const capa = await page.evaluate(() => ({ cf: !!document.querySelector('details#como-funciona') && !document.querySelector('details#como-funciona').open,
      tempo: (document.querySelector('#tempo') || {}).textContent, frase: document.querySelector('.heroi p') && document.querySelector('.heroi p').textContent,
      txt: document.querySelector('#tela').innerText }));
    /* (G) tempo honesto: ~35 s por pergunta do caminho mais comum, arredondado para múltiplo de 5 min */
    const minTipico = Math.max(5, Math.round((Motor.caminho(M, {}).length * 35) / 60 / 5) * 5);
    ok(capa.tempo === `Esta etapa leva cerca de ${minTipico} minutos.`, `capa: tempo pelo caminho típico (${Motor.caminho(M, {}).length} perguntas → ${minTipico} min; obtido "${capa.tempo}")`);
    ok(!/m[óo]dulo/i.test(capa.txt), 'capa: "Etapa", nunca "Módulo", no texto visível');
    ok(capa.cf && /^Esta etapa leva cerca de \d+ minutos/.test(capa.tempo || '') && capa.frase === D.inicio.frase, `capa: frase, tempo e "Como funciona" fechado (obtido ${JSON.stringify({ cf: capa.cf, tempo: capa.tempo, frase: capa.frase })})`);
    ok(!capa.txt.includes(D.mapa.usuario.slice(0, 40)) && !capa.txt.includes(D.mapa.objetivo.slice(0, 40)), 'capa: explicações longas só dentro de "Como funciona"');
    console.log(`Capa: ${contaPalavras(capa.txt)} palavras visíveis`);
    // perguntas: até LIMITE_PALAVRAS palavras visíveis (medidas em todos os caminhos percorridos acima)
    const longas = Object.entries(palavrasMax).filter(([, n]) => n > LIMITE_PALAVRAS);
    ok(Object.keys(palavrasMax).length === nP, `palavras medidas em ${Object.keys(palavrasMax).length} perguntas (obtido ${Object.keys(palavrasMax).length})`);
    ok(!longas.length, `perguntas com mais de ${LIMITE_PALAVRAS} palavras visíveis: ${longas.map(([c, n]) => c + '=' + n).join(', ')}`);
    console.log(`Palavras visíveis por pergunta (máx.): ${Object.entries(palavrasMax).map(([c, n]) => c.slice(3) + '=' + n).join(' ')}`);
    // exemplo dentro do campo nas perguntas de escrever
    for (const q of M.perguntas.filter((x) => Motor.campo(x) !== 'escolha')) ok(/^Ex\.: /.test(q.placeholder || ''), `${q.codigo}: exemplo "Ex.: …" dentro do campo`);
    // lote 16/11: "Não sei" BLOQUEIA. Em cada pergunta que o mantém: tocar mostra "Como descobrir", não grava,
    // Continuar não avança (mensagem simples); depois de uma resposta de verdade, avança. Onde saiu, não há "Não sei".
    const comNS = M.perguntas.filter((q) => q.opcoesLista.includes(Motor.NS));
    ok(comNS.length === nP - SEM_NS.length && comNS.every((q) => !SEM_NS.includes(q.codigo)), `"Não sei" só nas perguntas de fato a descobrir (obtido ${comNS.map((q) => q.codigo).join(',')})`);
    const caixaNS = (sel) => page.evaluate((sel) => { const c = document.querySelector(sel); return c ? { tit: (c.querySelector('.como-tit') || {}).textContent, passos: [...c.querySelectorAll('ol > li')].map((x) => x.textContent.trim()), prompt: c.querySelector('[data-prompt]') ? c.querySelector('[data-prompt]').textContent : null, copiar: [...c.querySelectorAll('button')].map((b) => b.textContent.trim()), nota: (c.querySelector('.como-nota') || {}).textContent || '' } : null; }, sel);
    const estadoDe = () => page.evaluate(() => localStorage.getItem('lg2-turma-b-m02'));
    const abrirPergunta = async (q) => {
      const seq = planejar({ [q.codigo]: '__' });
      const i = seq.findIndex(([c]) => c === q.codigo);
      if (i < 0) return false;
      const R = {};
      seq.slice(0, i).forEach(([c, v]) => { const qq = M.porCodigo[c]; R[c] = Motor.campo(qq) === 'escolha' ? (Motor.multipla(qq) ? { estado: 'opcao', opcao: v, opcoes: [v] } : { estado: 'opcao', opcao: v }) : { estado: 'valor', valor: v === 'TEXTO' ? 'Texto de teste' : v }; });
      await page.goto(srv.url + 'index.html');
      await page.evaluate((e) => { localStorage.clear(); localStorage.setItem('lg2-turma-b-m02', e); }, JSON.stringify({ v: 4, R, hist: seq.slice(0, i + 1).map(([c]) => c), fichas: [], plano: { meta: '', prazo: '', feitos: [] }, grupos: [] }));
      await page.reload();
      await clicarTexto('button', 'Continuar de onde parei');
      return q.codigo === 'M2.P21' || norm(await page.locator('h2.q').textContent()) === norm(q.pergunta);
    };
    let nsConferidas = 0;
    for (const q of M.perguntas) {
      if (!(await abrirPergunta(q))) { falhas.push(`${q.codigo}: não abriu a pergunta`); continue; }
      const esc = Motor.campo(q) === 'escolha';
      if (!q.opcoesLista.includes(Motor.NS)) {
        const tem = await page.evaluate(() => !!document.querySelector('#ns') || [...document.querySelectorAll('#ent .opcao')].some((b) => b.textContent.trim() === 'Não sei'));
        ok(!tem, `${q.codigo}: sem botão/opção "Não sei"`);
        continue;
      }
      ok((await page.locator('.como-descobrir').count()) === 0, `${q.codigo}: sem "Como descobrir" antes de tocar em "Não sei"`);
      const antes = await estadoDe();
      if (esc) await clicarTexto('#ent .opcao', 'Não sei'); else await page.click('#ns');
      const vivo = await caixaNS('#ajuda-ns .como-descobrir');
      ok(vivo && vivo.tit === 'Como descobrir' && vivo.passos.length >= 2 && q.comoDescobrir.every((x, k) => vivo.passos[k] === norm(x)), `${q.codigo}: tocar em "Não sei" mostra "Como descobrir" com os passos (obtido ${JSON.stringify(vivo)})`);
      if (q.promptIA) ok(vivo && vivo.prompt === q.promptIA && vivo.copiar.includes('Copiar') && /IA de sua preferência/.test(vivo.nota), `${q.codigo}: pedido para a IA com "Copiar"`);
      ok(!/chatgpt|gemini|copilot|claude/i.test(JSON.stringify(vivo)), `${q.codigo}: sem marca de IA`);
      await page.click('#ok');
      ok((await page.locator('#retorno .retorno').count()) === 0 && (q.codigo === 'M2.P21' || norm(await page.locator('h2.q').textContent()) === norm(q.pergunta)), `${q.codigo}: Continuar com só "Não sei" não avança`);
      ok(/^Use a ajuda acima e (escolha uma opção|escreva a sua resposta) para continuar\.$/.test(norm(await page.locator('#erro').textContent())) && await page.locator('#erro').isVisible(), `${q.codigo}: mensagem simples para responder`);
      ok((await estadoDe()) === antes, `${q.codigo}: "Não sei" não grava nada`);
      ok((await page.locator('.como-descobrir').count()) === 1, `${q.codigo}: uma só caixa "Como descobrir"`);
      if (q.codigo === 'M2.P05') {
        await page.evaluate(() => { const c = document.querySelector('#ajuda-ns'); c.scrollIntoView({ block: 'start' }); window.scrollBy(0, -160); });
        await shot('l_naosei_p05');
        await page.click('#ajuda-ns [data-copiar]');
        let st = '';
        for (let k = 0; k < 20; k++) { st = await page.locator('#ajuda-ns [data-copiar]').textContent(); if (st !== 'Copiar') break; await page.waitForTimeout(100); }
        ok(st === 'Copiado!' || /Toque e segure/.test(st), `Copiar confirma a cópia ou seleciona o texto (obtido "${st}")`);
      }
      // depois de uma resposta de verdade, avança
      const real = esc ? q.opcoesLista.find((o) => o !== Motor.NS && o !== Motor.OUTRA) : null;
      if (esc) await clicarTexto('#ent .opcao', real); else await page.fill('#ent input, #ent textarea', 'Resposta de teste');
      await page.click('#ok');
      const avancou = await page.evaluate(([t, p21]) => { const h = document.querySelector('h2.q'); return !h || (!p21 && h.textContent.replace(/\s+/g, ' ').trim() !== t) || (p21 && !!document.querySelector('.concluido')); }, [norm(q.pergunta), q.codigo === 'M2.P21']);
      ok(avancou, `${q.codigo}: com resposta de verdade, um toque em Continuar avança`);
      const salvo = JSON.parse(await estadoDe()).R[q.codigo];
      ok(salvo && salvo.estado !== 'naosei' && salvo.opcao !== 'Não sei' && !(salvo.opcoes || []).includes('Não sei'), `${q.codigo}: grava a resposta de verdade (obtido ${JSON.stringify(salvo)})`);
      nsConferidas++;
    }
    console.log(`"Não sei" que bloqueia conferido em ${nsConferidas} de ${comNS.length} perguntas; sem "Não sei": ${SEM_NS.join(', ')}`);

    // migração v3 -> v5 (v4 + v5 em sequência): P01 "Ainda não pensei nisso" vira "Ainda não sei" (resposta real); P16 "Não sei" vira "Ainda não";
    // P05 "Não sei" (fato a descobrir) continua reabrindo sem resposta, com "Como descobrir"; o resto fica; P20 intocada
    await page.goto(srv.url + 'index.html');
    const velho = { v: 3, R: { 'M2.P01': { estado: 'opcao', opcao: 'Ainda não pensei nisso' }, 'M2.P04': { estado: 'opcao', opcao: 'Sim' }, 'M2.P05': { estado: 'opcao', opcao: 'Não sei' }, 'M2.P07': { estado: 'opcao', opcao: 'Pessoas' }, 'M2.P08': { estado: 'opcao', opcao: 'Motivo da compra', opcoes: ['Motivo da compra', 'Hábitos de compra'] }, 'M2.P16': { estado: 'opcao', opcao: 'Não sei' }, 'M2.P18': { estado: 'valor', valor: '3' }, 'M2.P20': { estado: 'naosei' } }, hist: ['M2.P01', 'M2.P04', 'M2.P18', 'M2.P20', 'M2.P05', 'M2.P07', 'M2.P08'], fichas: [{ situacao: 'Vizinha', frequencia: '1 vez por mês', motivo: 'preço', sinal: 'forte' }], plano: { meta: '', prazo: '', feitos: [] }, grupos: [] };
    await page.evaluate((e) => { localStorage.clear(); localStorage.setItem('lg2-turma-b-m02', e); }, JSON.stringify(velho));
    await page.reload();
    const mv = JSON.parse(await estadoDe());
    ok(mv.v === VERSAO_ESTADO && JSON.stringify(mv.R['M2.P01']) === '{"estado":"opcao","opcao":"Ainda não sei"}' && !mv.R['M2.P05'] && JSON.stringify(mv.pendentes) === '["M2.P05"]' && JSON.stringify(mv.R['M2.P08'].opcoes) === '["Motivo da compra","Hábitos de compra"]' && mv.R['M2.P04'].opcao === 'Sim' && mv.R['M2.P07'].opcao === 'Pessoas' && mv.R['M2.P18'].valor === '3'
      && JSON.stringify(mv.R['M2.P16']) === '{"estado":"opcao","opcao":"Ainda não"}' && JSON.stringify(mv.R['M2.P20']) === '{"estado":"naosei"}' && mv.fichas.length === 1, `migração v3→v5: P01 vira "Ainda não sei", P16 vira "Ainda não", P05 "Não sei" reabre sem resposta, resto intacto (obtido ${JSON.stringify(mv)})`);
    await clicarTexto('button', 'Continuar de onde parei');
    ok(norm(await page.locator('h2.q').textContent()) === M.porCodigo['M2.P05'].pergunta && (await page.locator('#ajuda-ns .como-descobrir').count()) === 1, 'migração: P01 antiga vira resposta válida e segue; reabre a 1ª pergunta de fato que era "Não sei" (P05), sem resposta e com "Como descobrir" à vista');
    await clicarTexto('#ent .opcao', 'Um único grupo'); await page.click('#ok');
    const mv2 = JSON.parse(await estadoDe());
    ok(mv2.R['M2.P05'].opcao === 'Um único grupo' && mv2.R['M2.P01'].opcao === 'Ainda não sei' && mv2.R['M2.P04'].opcao === 'Sim' && mv2.R['M2.P07'].opcao === 'Pessoas' && mv2.R['M2.P18'].valor === '3' && mv2.R['M2.P16'] && mv2.R['M2.P20'] && !(mv2.pendentes || []).includes('M2.P05'), `migração: responder a P05 não apaga as outras respostas (P01 "Ainda não sei") nem as de P16/P20 (obtido ${JSON.stringify(mv2.R)})`);

    // migração v4 -> v5: quem tinha P01 "Não sei" ficou na v4 sem resposta e com P01 pendente; volta como "Ainda não sei"
    const v4 = { v: 4, R: { 'M2.P04': { estado: 'opcao', opcao: 'Não' }, 'M2.P16': { estado: 'opcao', opcao: 'Não sei' } }, pendentes: ['M2.P01', 'M2.P07'], hist: ['M2.P01'], fichas: [], plano: { meta: '', prazo: '', feitos: [] }, grupos: [] };
    await page.evaluate((e) => { localStorage.clear(); localStorage.setItem('lg2-turma-b-m02', e); }, JSON.stringify(v4));
    await page.reload();
    const mv4 = JSON.parse(await estadoDe());
    ok(mv4.v === VERSAO_ESTADO && JSON.stringify(mv4.R['M2.P01']) === '{"estado":"opcao","opcao":"Ainda não sei"}' && JSON.stringify(mv4.pendentes) === '["M2.P07"]' && mv4.R['M2.P04'].opcao === 'Não' && mv4.R['M2.P16'].opcao === 'Ainda não', `migração v4→v5: P01 pendente vira "Ainda não sei", P07 (fato) segue pendente, P16 "Não sei" vira "Ainda não" (obtido ${JSON.stringify(mv4)})`);

    // resultado: o principal no topo (entendemos + tarefa + o que falta), o resto fechado
    await percorrer(planejar({ 'M2.P01': 'Em parte', 'M2.P04': 'Não', 'M2.P03': 'Suposição, ainda sem conferir' }));
    const res = await page.evaluate(() => {
      const ordem = ['#entendemos', '#tarefa', '#falta', '#mais-detalhes', '.lg2-proximo'].map((s) => document.querySelector(s));
      const emOrdem = ordem.every(Boolean) && ordem.every((e, i) => i === 0 || (ordem[i - 1].compareDocumentPosition(e) & Node.DOCUMENT_POSITION_FOLLOWING));
      return { emOrdem, mais: document.querySelector('#mais-detalhes') && document.querySelector('#mais-detalhes').open,
        tarefa: document.querySelector('#tarefa').innerText, ns: document.querySelectorAll('#falta .ns-item').length,
        regrasFora: [...document.querySelectorAll('.regra')].filter((r) => !r.closest('#mais-detalhes')).length };
    });
    ok(res.emOrdem && res.mais === true && res.regrasFora === 0, `resultado: entendemos → tarefa → o que falta → "Mais detalhes" aberto → próximo módulo (obtido ${JSON.stringify({ o: res.emOrdem, m: res.mais, r: res.regrasFora })})`);
    ok(/^Sua próxima tarefa/i.test(norm(res.tarefa)) && norm(res.tarefa).length > 30, `resultado: tarefa à vista (obtido "${res.tarefa}")`);
    ok(res.ns === 0, 'resultado: nenhum "Não sei" gravado para listar');
    ok((await page.locator('.lg2-proximo').count()) === 1 && /<div class="acoes lg2-proximo"><a class="btn btn-primario"[^>]*href="\/lg2\/turma-a\/m03\/index.html">Ir para a Etapa 3<\/a><\/div>/.test(app) && await page.locator('.lg2-proximo').isVisible(), 'caixa do próximo passo igual, visível, com "Ir para a Etapa 3"');
    ok(!/m[óo]dulo/i.test(await page.locator('#tela').innerText()), 'resultado: "Etapa", nunca "Módulo", no texto visível');

    await page.evaluate(() => window.scrollTo(0, 0));
    await shot('l_resultado');

    /* ===== roteiro de entrevista aberto por cima da tela (lote 16/11) ===== */
    // em toda pergunta, o botão "Ver o roteiro" existe se e só se algum texto mostrado cita o roteiro
    const roteiroNaPergunta = async (q, resp) => {
      await abrirPergunta(q);
      if (Motor.campo(q) === 'escolha') await clicarTexto('#ent .opcao', resp); else await page.fill('#ent input, #ent textarea', resp);
      await page.waitForSelector('#retorno .retorno', { timeout: 3000 });
    };
    // P04 = Sim: o próximo passo cita "O roteiro de entrevista ..."
    await roteiroNaPergunta(M.porCodigo['M2.P04'], 'Não');
    const retTxt = norm(await page.locator('#retorno').innerText());
    ok(/roteiro de entrevista/i.test(retTxt) && (await page.locator('#retorno [data-roteiro]').count()) === 1, `P04 Não: o retorno cita o roteiro e tem "Ver o roteiro" (obtido "${retTxt.slice(0, 200)}")`);
    await page.evaluate(() => { const b = document.querySelector('#retorno [data-roteiro]'); b.scrollIntoView({ block: 'center' }); });
    const antesRot = { y: await page.evaluate(() => window.scrollY), est: await estadoDe(), html: await page.evaluate(() => document.querySelector('#tela').innerHTML), passo: await page.locator('.passo').textContent() };
    await page.locator('#retorno [data-roteiro]').click();
    await page.waitForSelector('[role="dialog"]');
    await page.waitForTimeout(400);
    const dlg = await page.evaluate(() => { const d = document.querySelector('[role="dialog"]'); return { modal: d.getAttribute('aria-modal'), tit: d.querySelector('#lg2-rot-tit').textContent, txt: d.innerText, foco: d.contains(document.activeElement), fechar: [...d.querySelectorAll('button')].map((b) => b.textContent.trim()), telaInerte: document.querySelector('#tela').inert, url: location.href }; });
    ok(dlg.modal === 'true' && dlg.tit === 'Roteiro de entrevista' && dlg.foco && dlg.fechar.includes('Fechar') && dlg.telaInerte, `painel do roteiro: dialog modal com título, foco dentro e "Fechar" (obtido ${JSON.stringify({ ...dlg, txt: undefined })})`);
    const dtxt = norm(dlg.txt);
    for (const x of ['Para que serve', 'Com quem conversar', 'Quantas conversas', 'Comece pelo passado', 'onde comprou da última vez', 'quanto pagou', 'o que faria diferente', 'se pediria orçamento de novo', 'Feche a conversa', 'Anote no mesmo dia', norm(D.base.find((b) => /Entrevista com cliente/.test(b.conceito)).exemplo)])
      ok(dtxt.includes(x), `painel do roteiro: falta "${x}"`);
    ok(/Você ainda não registrou nenhuma conversa/.test(dtxt), 'painel do roteiro: sem fichas, diz que não há anotações');
    ok(!/M2\.[PI]\d{2}/.test(dtxt) && !/Grupo \d/.test(dtxt), 'painel do roteiro sem códigos internos nem "Grupo N"');
    await shot('l_roteiro_painel');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
    const depoisRot = { y: await page.evaluate(() => window.scrollY), est: await estadoDe(), html: await page.evaluate(() => document.querySelector('#tela').innerHTML), passo: await page.locator('.passo').textContent(), foco: await page.evaluate(() => document.activeElement && document.activeElement.hasAttribute('data-roteiro')), dlg: await page.locator('[role="dialog"]').count() };
    ok(depoisRot.dlg === 0, 'Esc fecha o painel do roteiro');
    ok(depoisRot.y === antesRot.y && depoisRot.est === antesRot.est && depoisRot.html === antesRot.html && depoisRot.passo === antesRot.passo, `fechar o roteiro volta ao mesmo ponto: mesma tela, rolagem e respostas (rolagem ${antesRot.y} → ${depoisRot.y})`);
    ok(depoisRot.foco, 'fechar o roteiro devolve o foco ao botão "Ver o roteiro"');
    // de uma pergunta com resposta ainda não confirmada: o que foi marcado continua marcado; com fichas, o painel mostra a contagem
    await abrirPergunta(M.porCodigo['M2.P08']);
    await clicarTexto('#ent .opcao', 'Motivo da compra');
    ok(await page.evaluate(() => [...document.querySelectorAll('#ent .op-ex')].some((x) => /festa, presente/.test(x.textContent))), 'P08: exemplo pequeno embaixo da opção difícil');
    ok(await page.evaluate(() => [...document.querySelectorAll('#ent .opcao')].map((b) => b.textContent).includes('Motivo da compra')), 'P08: o texto da opção não muda com o exemplo');
    await page.evaluate(() => window.scrollTo(0, 0));
    await shot('l_p08_exemplos');
    // P02: texto escrito e ainda não confirmado continua igual depois de abrir o roteiro pela caixa "Use a IA com cuidado"
    await abrirPergunta(M.porCodigo['M2.P02']);
    await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('lg2-turma-b-m02')); s.fichas = [{ situacao: 'Vizinha, compra para aniversário', frequencia: '1 vez por mês', motivo: 'preço', sinal: 'forte' }, { situacao: 'Colega de trabalho', frequencia: '', motivo: 'perto', sinal: 'fraco' }]; localStorage.setItem('lg2-turma-b-m02', JSON.stringify(s)); });
    await page.fill('#ent textarea', 'Mães que trabalham fora');
    // o retorno ao vivo aparece ~700 ms depois de parar de digitar e muda a altura da tela: mede depois dele
    await page.waitForTimeout(1000);
    const cxIA = page.locator('details.caixa-ia');
    await cxIA.evaluate((d) => { d.open = true; });
    ok((await cxIA.locator('[data-roteiro]').count()) === 1, 'P02: caixa "Use a IA" cita o roteiro e tem "Ver o roteiro"');
    await cxIA.locator('[data-roteiro]').scrollIntoViewIfNeeded();
    const yRot = await page.evaluate(() => { const t = parseFloat(document.body.style.top); return Number.isFinite(t) ? -t : document.scrollingElement.scrollTop; });
    await cxIA.locator('[data-roteiro]').click();
    await page.waitForSelector('[role="dialog"]');
    const notas = norm(await page.locator('.lg2-rot-notas').innerText());
    ok(/2 conversas registradas/.test(notas) && /1 com sinal forte, 1 com sinal fraco/.test(notas) && /Vizinha, compra para aniversário/.test(notas), `painel do roteiro mostra as anotações das conversas (obtido "${notas}")`);
    await page.getByRole('button', { name: 'Fechar', exact: true }).click();
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
    const yFechado = await page.evaluate(() => document.scrollingElement.scrollTop);
    ok((await page.locator('[role="dialog"]').count()) === 0 && Math.abs(yFechado - yRot) <= 2, `botão "Fechar" fecha e mantém a rolagem (${yRot} → ${yFechado})`);
    ok((await page.locator('#ent textarea').inputValue()) === 'Mães que trabalham fora' && !JSON.parse(await estadoDe()).R['M2.P02'], 'P02: o texto ainda não confirmado continua igual e nada é gravado ao abrir o roteiro');
    // resultado: a tarefa padrão cita o roteiro e tem o botão; o painel abre sem sair do resultado
    await page.goto(srv.url + 'index.html'); await page.evaluate(() => localStorage.clear()); await page.reload();
    await percorrer(planejar({ 'M2.P01': 'Em parte', 'M2.P04': 'Não', 'M2.P05': 'Um único grupo', 'M2.P08': 'Nenhuma muda muito' }));
    const tarefaRot = await page.evaluate(() => ({ t: document.querySelector('#tarefa').innerText, b: !!document.querySelector('#tarefa [data-roteiro]') }));
    ok(/roteiro de entrevista/i.test(tarefaRot.t) ? tarefaRot.b : true, `resultado: tarefa que cita o roteiro tem "Ver o roteiro" (obtido ${JSON.stringify(tarefaRot)})`);
    ok((await page.locator('#tela [data-roteiro]').count()) >= 1, 'resultado: pelo menos um "Ver o roteiro"');
    await page.locator('#tela [data-roteiro]').first().click();
    await page.waitForSelector('[role="dialog"]');
    ok(await page.evaluate(() => !!document.querySelector('.concluido')), 'resultado: o roteiro abre por cima, sem sair do resultado');
    await page.keyboard.press('Escape');
    // capa: "Como funciona" cita o roteiro na entrega
    await page.goto(srv.url + 'index.html');
    ok((await page.locator('#como-funciona [data-roteiro]').count()) === 1, 'capa: "Como funciona" cita o roteiro e tem "Ver o roteiro"');
    // sem texto que cite o roteiro, não há botão (P07)
    await abrirPergunta(M.porCodigo['M2.P07']);
    const cita07 = /roteiro de entrevista|M2\.I01/i.test([M.porCodigo['M2.P07'].ajuda, ...D.educativo.filter((e) => e.onde === 'M2.P07').map((e) => e.texto + e.exemplo)].join(' '));
    ok((await page.locator('#tela [data-roteiro]').count() > 0) === cita07, 'P07: "Ver o roteiro" só onde o texto cita o roteiro');

    /* ===== "Como calculamos" (lote 16/11) ===== */
    await page.goto(srv.url + 'index.html');
    await page.evaluate(() => { localStorage.clear(); localStorage.setItem('lg2-turma-b-m02', JSON.stringify({ v: 4, R: {}, hist: [], fichas: ['forte', 'forte', 'fraco', 'fraco', 'nenhum'].map((s) => ({ situacao: 'Pessoa ' + s, frequencia: '', motivo: 'preço', sinal: s })), plano: { meta: '', prazo: '', feitos: [] }, grupos: [{ nome: 'Mães', alcancar: 3, necessidade: 3, pagar: 2 }] })); });
    await page.reload();
    await clicarTexto('button', 'Instrumentos: roteiro, ficha, plano e quadro');
    const ce = norm(await page.locator('#calc-evid').textContent());
    ok(ce === 'Como calculamos: 2 pessoas com sinal forte ÷ 5 entrevistas salvas na ficha × 100 = 40%.', `quadro de evidências: "Como calculamos" com os números da pessoa (obtido "${ce}")`);   // conta à mão: 2/5 = 0,4 → 40%
    const cg = norm(await page.locator('#grupos .calc-grupo').first().textContent());
    ok(cg === 'Como calculamos: 3 (alcançar) + 3 (necessidade) + 2 (pagar) = 8 pontos.', `quadro dos grupos: "Como calculamos" (obtido "${cg}")`);
    await page.locator('#calc-evid').scrollIntoViewIfNeeded();
    await shot('l_calc_evidencias');

    /* ===== lote 17/11 (tira a fricção) ===== */
    // (C) Continuar inteiro dentro da tela, sem rolar, em toda pergunta: 360x640, 390x844 com letra a 130% e 740x360
    const TELAS = [[360, 640, ''], [390, 844, '130%'], [740, 360, '']];
    const okNaTela = () => page.evaluate(() => { const r = document.querySelector('#ok').getBoundingClientRect(); return { y: scrollY, top: Math.round(r.top), bottom: Math.round(r.bottom), left: Math.round(r.left), right: Math.round(r.right), h: innerHeight, w: innerWidth, pos: getComputedStyle(document.querySelector('#acoes')).position }; });
    const dentro = (o) => o.y === 0 && o.top >= 0 && o.bottom <= o.h && o.left >= 0 && o.right <= o.w && o.pos === 'sticky';
    let telasC = 0;
    for (const q of M.perguntas) {
      await page.setViewportSize({ width: 390, height: 844 });
      if (!(await abrirPergunta(q))) { falhas.push(`${q.codigo}: não abriu a pergunta (C)`); continue; }
      for (const [w, h, fs] of TELAS) {
        await page.setViewportSize({ width: w, height: h });
        await page.evaluate((fs) => { document.documentElement.style.fontSize = fs; window.scrollTo(0, 0); }, fs);
        await page.waitForTimeout(60);
        const o = await okNaTela();
        ok(dentro(o), `${q.codigo} ${w}x${h}${fs ? ' letra ' + fs : ''}: Continuar inteiro à vista sem rolar (obtido ${JSON.stringify(o)})`);
        telasC++;
      }
      await page.evaluate(() => { document.documentElement.style.fontSize = ''; });
    }
    // em 360x640: mensagem de erro e Continuar juntos, à vista; com o retorno ao vivo aberto, o Continuar segue à vista
    await page.setViewportSize({ width: 360, height: 640 });
    await abrirPergunta(M.porCodigo['M2.P03']);
    await page.click('#ok');
    const e360 = await page.evaluate(() => { const e = document.querySelector('#erro').getBoundingClientRect(), b = document.querySelector('#ok').getBoundingClientRect(); return e.top >= 0 && e.bottom <= b.top + 1 && b.bottom <= innerHeight; });
    ok(e360, '360x640: mensagem de erro logo acima do Continuar, os dois à vista');
    await clicarTexto('#ent .opcao', 'Conversa com conhecidos');
    await page.waitForSelector('#retorno .retorno');
    ok(dentro(await okNaTela()), '360x640: com o retorno ao vivo aberto, o Continuar continua à vista');
    await shot('l17_p03_360x640');
    await page.setViewportSize({ width: 390, height: 844 });
    console.log(`Continuar à vista conferido em ${telasC} telas (${nP} perguntas × ${TELAS.length} tamanhos)`);
    // (F) alvos de toque >= 44 px
    const pequenos = (onde) => page.evaluate((onde) => [...document.querySelectorAll('#tela summary, #tela .btn-alt, #tela .btn-copiar, #tela [data-roteiro], #tela .etapa-topo .x, #tela .opcoes.mini .opcao, #tela .voltar-topo, #tela .trilha-link, #tela .btn, #tela .opcao, #tela [data-copiar]')]
      .filter((x) => x.offsetParent !== null && !x.closest('details:not([open]) > :not(summary)')).map((x) => [x.textContent.trim().slice(0, 30), Math.round(x.getBoundingClientRect().height)]).filter(([, h]) => h > 0 && h < 44).map(([t, h]) => `${onde}: "${t}" ${h}px`), onde);
    const peq = [];
    await page.goto(srv.url + 'index.html'); await page.evaluate(() => localStorage.clear()); await page.reload();
    peq.push(...await pequenos('capa'));
    await abrirPergunta(M.porCodigo['M2.P02']);
    await page.fill('#ent textarea', 'Mães que trabalham fora'); await page.waitForSelector('#retorno .retorno');
    await page.evaluate(() => document.querySelectorAll('details.caixa').forEach((d) => { d.open = true; }));
    peq.push(...await pequenos('P02'));
    await abrirPergunta(M.porCodigo['M2.P05']); await clicarTexto('#ent .opcao', 'Não sei');
    peq.push(...await pequenos('P05 Não sei'));
    await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('lg2-turma-b-m02')); s.fichas = [{ situacao: 'Vizinha', frequencia: '', motivo: 'preço', sinal: 'forte' }]; s.grupos = [{ nome: 'Mães', alcancar: 3, necessidade: 3, pagar: 2 }]; localStorage.setItem('lg2-turma-b-m02', JSON.stringify(s)); });
    await page.goto(srv.url + 'index.html');
    await clicarTexto('button', 'Instrumentos: roteiro, ficha, plano e quadro');
    peq.push(...await pequenos('instrumentos'));
    // (D) sinal da ficha e notas dos grupos dizem se estão marcados
    await clicarTexto('#f-sinal .opcao', 'fraco');
    ok(JSON.stringify(await page.evaluate(() => [...document.querySelectorAll('#f-sinal .opcao')].map((b) => b.getAttribute('aria-pressed')))) === '["false","true","false"]', 'ficha: o sinal escolhido diz aria-pressed=true, os outros false');
    ok(JSON.stringify(await page.evaluate(() => [...document.querySelectorAll('#grupos .opcao[data-k="pagar"]')].map((b) => b.getAttribute('aria-pressed')))) === '["false","true","false"]', 'quadro dos grupos: a nota marcada diz aria-pressed=true');
    await percorrer(planejar({ 'M2.P01': 'Em parte', 'M2.P04': 'Não' }));
    peq.push(...await pequenos('resultado'));
    ok(!peq.length, `alvos de toque menores que 44 px: ${peq.join('; ')}`);
    // (G) caminho que cresce no meio (P08 com 2 marcadas abre P09 e P13): "Pergunta N" sem total e barra que não volta
    await inicio();
    const barrasG = [];
    const passoG = async () => { const t = await page.locator('.passo').textContent(); barrasG.push(+(await page.locator('.heroi [role=progressbar]').getAttribute('aria-valuenow'))); return t; };
    for (const [c, v] of [['M2.P01', 'Em parte'], ['M2.P02', 'TEXTO'], ['M2.P03', 'Conversa com conhecidos'], ['M2.P04', 'Sim'], ['M2.P05', 'Um único grupo'], ['M2.P07', 'Pessoas']]) { await passoG(); await responder(c, v); await page.click('#ok'); }
    await passoG();
    for (const o of ['Idade/fase da vida', 'Quanto podem pagar', 'Onde moram/trabalham', 'Motivo da compra']) await clicarTexto('#ent .opcao', o);
    await page.click('#ok');
    const passosG = [];
    for (let i = 0; i < 4; i++) { passosG.push(await passoG()); await page.locator('#ent .opcao').first().click(); await page.click('#ok'); }
    ok(passosG.every((x, i) => x === `Pergunta ${8 + i}`), `caminho que cresce: "Pergunta N" sem total (obtido ${passosG.join(' | ')})`);
    ok(barrasG.every((x, k) => k === 0 || x >= barrasG[k - 1]) && barrasG[barrasG.length - 1] > barrasG[0], `caminho que cresce: a barra nunca volta (obtido ${barrasG.join(',')})`);

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
  if (falhas.length) { [...new Set(falhas)].forEach((f) => console.log('  FALHA ' + f)); console.log(`FAIL (${falhas.length})`); process.exit(1); }
  console.log(`PASS: versão leve (capa curta, perguntas com até ${LIMITE_PALAVRAS} palavras, "Ver dica" fechada, exemplo no campo, "Como descobrir" + Copiar em todo "Não sei" com valor salvo igual, resultado com o principal no topo) · lote 4 (roteiro com como usar + passos, ficha e quadro dos grupos com como preencher, exemplo e validação) · lote 3 (Voltar no topo, menos texto, sem códigos na tela, P08 com várias respostas + Outra + migração v3, P15 com o quadro) · ${alcancadas.size} de ${nR} regras alcançadas; ${nP} perguntas (P21 reescrita); herança M1/M3, progresso pelo caminho e "O que entendemos" conferidos; M2.I04 e M2.I05 conferem com a aba 5; persistência ok · ${D.modulo.versao} ${D.modulo.data}`);
})();
