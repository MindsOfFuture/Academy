/* Teste de navegação do LG2 M06 (Turma B) no navegador headless.
   Execute: PW=<caminho do pacote playwright> node tests/lg2-m06-turma-b.cjs
   Opcional: SHOTS=<pasta> grava os prints de celular (390x844); M06_DIR=<pasta> testa outra cópia.
   Alcança todas as regras da aba 4, roda os casos da aba 8 (divergências são relatadas, não falham),
   confere os instrumentos contra a "saída esperada" da aba 5. Sai com código 1 se algo falhar. */
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.PW || 'playwright');

const DIR = path.resolve(process.env.M06_DIR || path.resolve(__dirname, '../public/lg2/turma-b/m06'));
const TIPOS = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf' };
const servidor = http.createServer((req, res) => {
  const f = path.join(DIR, decodeURIComponent(req.url.split('?')[0]).replace(/\/$/, '/index.html'));
  if (!f.startsWith(DIR) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': TIPOS[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});

let falhas = 0;
const divergencias = [];
function check(nome, ok, extra) {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${nome}${!ok && extra !== undefined ? ' :: ' + JSON.stringify(extra).slice(0, 400) : ''}`);
  if (!ok) falhas++;
}
const nrm = (s) => String(s || '').replace(/\s+/g, ' ').trim();
const CHAVE = 'lg2-turma-b-m06';

/* funções que rodam dentro da página */
const NA_PAGINA = {
  atual: () => {
    const t = document.querySelector('.passo');
    if (!t) return null;
    if (/Resultado/.test(t.textContent)) return 'RESULTADO';
    const n = +t.textContent.match(/Pergunta (\d+)/)[1];
    return Motor.montar(window.MODULO6).perguntas[n - 1].codigo;
  },
  agir: (a) => {
    const opc = [...document.querySelectorAll('#ent .opcao')];
    const clicar = (v) => {
      const b = opc.find((x) => x.textContent.trim() === v);
      if (!b) throw new Error('opção inexistente: ' + v + ' em ' + opc.map((x) => x.textContent.trim()).join('|'));
      b.click();
    };
    if (a.tipo === 'NS') { if (document.querySelector('#ns')) { document.querySelector('#ns').click(); return; } clicar('Não sei'); }
    else if (a.tipo === 'opcao') { clicar(a.v); if (a.detalhe !== undefined) document.querySelector('#detalhe').value = a.detalhe; }
    else if (a.tipo === 'multi') a.vs.forEach(clicar);
    else if (a.tipo === 'texto') document.querySelector('#ent input, #ent textarea').value = a.v;
    document.querySelector('#ok').click();
  },
  seguir: () => {
    const b = [...document.querySelectorAll('#acoes .btn-primario')].find((x) => /Seguir|Ver meu resumo/.test(x.textContent));
    if (!b) return false;
    b.click(); return true;
  },
  retorno: () => (document.querySelector('#retorno') || {}).innerText || '',
};

(async () => {
  await new Promise((r) => servidor.listen(0, '127.0.0.1', r));
  const URL = `http://127.0.0.1:${servidor.address().port}/index.html`;
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  const errosJS = [];
  page.on('pageerror', (e) => errosJS.push(e.message));
  page.on('dialog', (d) => d.accept());
  await page.goto(URL);
  const D = await page.evaluate(() => window.MODULO6);
  const ordem = await page.evaluate(() => Motor.montar(window.MODULO6).perguntas.map((p) => ({ codigo: p.codigo, campo: Motor.campo(p), opcoes: p.opcoesLista, condicao: p.condicao })));
  const Q = Object.fromEntries(ordem.map((p) => [p.codigo, p]));
  const P = D.perguntas.filter((p) => p.codigo), R = D.regras.filter((r) => r.codigo);
  const telasComRafael = [];

  /* ---------- dados ---------- */
  const dadosTxt = fs.readFileSync(path.join(DIR, 'dados/modulo6.js'), 'utf8');
  check('dados/modulo6.js sem "Rafael" (grep -ci = 0)', (dadosTxt.match(/rafael/gi) || []).length === 0);
  check('18 perguntas e 70 regras carregadas da planilha v0.2', P.length === 18 && R.length === 70, [P.length, R.length]);
  if (P.length !== 21) divergencias.push(`Capa C31 diz 21 perguntas; a aba 3 tem ${P.length}`);
  if (R.length !== 73) divergencias.push(`Capa C33 diz 73 regras; a aba 4 tem ${R.length}`);
  check('chave da turma mantida (lg2-turma-b-m06)', fs.readFileSync(path.join(DIR, 'js/app.js'), 'utf8').includes(`const CHAVE = "${CHAVE}"`));
  check('versão exibida = Capa literal', D.modulo.versao === 'v0.1' && D.modulo.data === '25/09/2026', D.modulo);

  /* ---------- condutor de caminhos ---------- */
  const SECAO_NEGOCIO = {};   // código da pergunta -> valor de "Negócio" que a mostra
  { let sec = null; const negPorSec = {};
    D.perguntas.forEach((p) => { if (p.secao) sec = p.secao; else { const m = /^Negócio\s*=\s*(.+)$/.exec(p.condicao || ''); if (m) negPorSec[sec] = m[1].trim(); } });
    sec = null; D.perguntas.forEach((p) => { if (p.secao) sec = p.secao; else if (negPorSec[sec]) SECAO_NEGOCIO[p.codigo] = negPorSec[sec]; }); }
  const neutro = (cod, alvo) => {
    const q = Q[cod];
    if (cod === 'Negócio') return { tipo: 'opcao', v: SECAO_NEGOCIO[alvo] || q.opcoes[0] };
    if (q.campo === 'numero') return { tipo: 'texto', v: '1000' };
    if (q.campo === 'texto') return { tipo: 'texto', v: 'Resposta de teste' };
    if (q.campo === 'multi') return { tipo: 'multi', vs: [q.opcoes.find((o) => o !== 'Não sei')] };
    if (q.campo === 'simnao_texto') return { tipo: 'opcao', v: 'Não' };
    return { tipo: 'opcao', v: q.opcoes.find((o) => o !== 'Não sei') };
  };
  async function olharRafael(rotulo) {
    if (/rafael/i.test(await page.evaluate(() => document.body.innerText))) telasComRafael.push(rotulo);
  }
  /* começa do zero; responde até chegar em `alvo` (ou ao resultado), usando `resp` ou valores neutros */
  async function caminho(resp, alvo) {
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.click('#ir');
    const vistas = [], textos = [];
    for (let i = 0; i < 40; i++) {
      const cod = await page.evaluate(NA_PAGINA.atual);
      if (cod === 'RESULTADO' || cod === alvo) return { cod, vistas, textos };
      vistas.push(cod);
      await page.evaluate(NA_PAGINA.agir, resp[cod] || neutro(cod, alvo));
      textos.push(await page.evaluate(NA_PAGINA.retorno));
      await olharRafael(cod);
      if (!(await page.evaluate(NA_PAGINA.seguir))) return { cod, vistas, textos, bloqueado: true };
    }
    throw new Error('caminho sem fim');
  }

  /* ---------- 1. todas as regras da aba 4 ---------- */
  const LEITURA_OPCAO = { 'De 8 a 30 dias': '8 a 30 dias' };
  function acaoDaRegra(r) {
    const c = r.condicao.trim(), q = Q[r.pergunta];
    if (/^Resposta vazia|^Nenhuma resposta/i.test(c)) return { tipo: 'vazio', para: true };
    if (/sem outras op/i.test(c)) return { tipo: 'multi', vs: ['Não sei'] };
    if (/junto com outras op/i.test(c)) return { tipo: 'multi', vs: [q.opcoes[0], 'Não sei'] };
    if (/^Uma ou mais/i.test(c)) return { tipo: 'multi', vs: [q.opcoes[0], q.opcoes[1]] };
    if (/^Sim, com detalhes/i.test(c)) return { tipo: 'opcao', v: 'Sim', detalhe: 'Aluguel pago a cada 60 dias' };
    if (/^Sim, sem detalhes/i.test(c)) return { tipo: 'opcao', v: 'Sim', detalhe: '', para: true };
    if (/maior que zero/i.test(c)) return { tipo: 'texto', v: '1500' };
    if (/igual a zero/i.test(c)) return { tipo: 'texto', v: '0' };
    if (/v[aá]lidos informados/i.test(c)) return { tipo: 'texto', v: '2000' };
    if (/^Resposta preenchida|^Lista de .+ informada/i.test(c)) return { tipo: 'texto', v: 'Balcão, freezer e estoque inicial' };
    if (/Não sei/.test(c)) return { tipo: 'NS' };
    return { tipo: 'opcao', v: LEITURA_OPCAO[c] || c.trim() };
  }
  /* regras que, pela redação do grupo, valem junto com a regra-alvo (executadas como escritas) */
  const JUNTAS = { 'M6.R16': ['M6.R13'], 'M6.R18': ['M6.R17'] };
  const alcancadas = [], faltando = [];
  for (const r of R) {
    const a = acaoDaRegra(r);
    const c = await caminho({}, r.pergunta);
    if (c.cod !== r.pergunta) { faltando.push(`${r.codigo} (pergunta ${r.pergunta} não apareceu)`); continue; }
    await page.evaluate(NA_PAGINA.agir, a);
    const txt = nrm(await page.evaluate(NA_PAGINA.retorno));
    await olharRafael(r.codigo);
    const agora = await page.evaluate(NA_PAGINA.atual);
    const temSeguir = await page.evaluate(() => [...document.querySelectorAll('#acoes .btn-primario')].some((x) => /Seguir|Ver meu resumo/.test(x.textContent)));
    const mostradas = (await page.$$eval('#retorno .regra .r-texto', (x) => x.map((e) => e.textContent))).map(nrm).sort();
    const esperadas = [r.codigo, ...(JUNTAS[r.codigo] || [])].map((c) => nrm(R.find((x) => x.codigo === c).texto)).sort();
    const ok = JSON.stringify(mostradas) === JSON.stringify(esperadas) && txt.includes(nrm(r.texto)) && (!r.alerta || txt.includes(nrm(r.alerta))) && agora === r.pergunta && (a.para ? !temSeguir : temSeguir)
      && !(/^Retornar à /.test(r.encaminhamento || '') && txt.includes(nrm(r.encaminhamento)));
    (ok ? alcancadas : faltando).push(ok ? r.codigo : `${r.codigo} (${r.condicao}) -> ${txt.slice(0, 120)}`);
  }
  console.log(`INFO regras alcançadas: ${alcancadas.length} de ${R.length}`);
  check(`todas as regras da aba 4 alcançadas (${alcancadas.length} de ${R.length})`, faltando.length === 0, faltando);

  /* valores negativos e inválidos também param na regra "vazia, negativa ou inválida" */
  for (const [cod, v] of [['M6.P02', '-5'], ['M6.P02', 'abc'], ['M6.P05', '-1'], ['M6.P07', 'xyz'], ['M6.P11', '-2']]) {
    const r = R.find((x) => x.pergunta === cod && /inv[aá]lid/i.test(x.condicao));
    await caminho({}, cod);
    await page.evaluate(NA_PAGINA.agir, { tipo: 'texto', v });
    const txt = nrm(await page.evaluate(NA_PAGINA.retorno));
    check(`${cod} = "${v}" mostra ${r.codigo} e não avança`, txt.includes(nrm(r.texto)) && (await page.evaluate(NA_PAGINA.atual)) === cod
      && !(await page.evaluate((c) => JSON.parse(localStorage.getItem('lg2-turma-b-m06')).R[c], cod)));
  }
  /* condições F */
  { const c = await caminho({ 'M6.P01': { tipo: 'NS' }, 'M6.P04': { tipo: 'multi', vs: ['Não sei'] } }, null);
    check('P01 = Não sei esconde P02/P03; P04 só "Não sei" esconde P08', !c.vistas.includes('M6.P02') && !c.vistas.includes('M6.P03') && !c.vistas.includes('M6.P08'), c.vistas);
    check('Negócio = Serviço mostra só P10..P12', JSON.stringify(c.vistas.slice(c.vistas.indexOf('Negócio') + 1)) === JSON.stringify(['M6.P10', 'M6.P11', 'M6.P12']), c.vistas); }
  { const c = await caminho({ 'Negócio': { tipo: 'opcao', v: 'Mercadoria' }, 'M6.P16': { tipo: 'NS' } }, null);
    check('"M01 ≠ Não sei" lido como P16 ≠ Não sei (P16 = Não sei esconde P17)', c.vistas.includes('M6.P16') && !c.vistas.includes('M6.P17') && c.vistas.includes('M6.P18'), c.vistas); }
  { const c = await caminho({ 'Negócio': { tipo: 'opcao', v: 'Produto' }, 'M6.P13': { tipo: 'NS' } }, null);
    check('Negócio = Produto: P13 = Não sei esconde P14, mostra P15', c.vistas.includes('M6.P15') && !c.vistas.includes('M6.P14') && !c.vistas.includes('M6.P10'), c.vistas); }

  /* ---------- 2. casos de teste da aba 8 ---------- */
  for (const caso of D.casos) {
    const resp = {}, nota = [];
    for (const par of caso.respostas.split(';')) {
      const m = /^\s*(M6\.P\d{2})\s*=\s*(.+?)\s*$/.exec(par);
      if (!m) continue;
      const [, cod, v] = m, q = Q[cod];
      if (v === 'Não sei') { resp[cod] = { tipo: 'NS' }; continue; }
      if (q.campo === 'numero') { if (/^(R\$\s*)?-?[\d.,]+$/.test(v)) resp[cod] = { tipo: 'texto', v }; else nota.push(`${cod} = "${v}" não é número na v0.2`); }
      else if (q.campo === 'texto') resp[cod] = { tipo: 'texto', v };
      else if (q.opcoes.includes(v)) resp[cod] = q.campo === 'multi' ? { tipo: 'multi', vs: [v] } : { tipo: 'opcao', v };
      else nota.push(`${cod} = "${v}" não é opção da v0.2 (${q.opcoes.join('/')})`);
    }
    const c = await caminho(resp, null);
    Object.keys(resp).forEach((k) => { if (!c.vistas.includes(k)) nota.push(`${k} não aparece pela coluna F`); });
    const fim = nrm(await page.evaluate(() => document.body.innerText)) + ' ' + nrm(c.textos.join(' '));
    for (const [campo, rot] of [['texto', 'texto'], ['alerta', 'alerta'], ['proximo', 'próximo passo'], ['encaminhamento', 'encaminhamento']]) {
      const esp = caso[campo];
      if (!esp || esp === 'Nenhum') continue;
      if (!fim.includes(nrm(esp))) nota.push(`${rot} esperado não existe nas regras v0.2 ("${esp.slice(0, 60)}…")`);
    }
    check(`caso ${caso.codigo} (${caso.tipo}) roda até o resultado`, c.cod === 'RESULTADO', c);
    nota.forEach((n) => divergencias.push(`${caso.codigo}: ${n}`));
  }

  /* ---------- 3. instrumentos x "saída esperada" da aba 5 ---------- */
  const I = Object.fromEntries(D.instrumentos.map((i) => [i.codigo, i]));
  const reais = (s) => (String(s).match(/R\$\s*[\d.]+(,\d+)?/g) || []).map((x) => +x.replace(/[^\d,]/g, '').replace(',', '.'));
  const brl = (n) => 'R$ ' + n.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  { const e = reais(I['M6.I01'].ex_entrada), esp = reais(I['M6.I01'].ex_saida)[0];
    const m = await page.evaluate((e) => Motor.investimento({ 'M6.P02': { estado: 'valor', valor: String(e[0]) }, 'M6.P11': { estado: 'valor', valor: String(e[1]) }, 'M6.P14': { estado: 'valor', valor: String(e[2]) } }).valor, e);
    check(`I01 motor: ${e.join(' + ')} = ${esp} (saída esperada)`, m === esp, m);
    await caminho({ 'M6.P02': { tipo: 'texto', v: String(e[0]) }, 'Negócio': { tipo: 'opcao', v: 'Serviço' }, 'M6.P11': { tipo: 'texto', v: String(e[1] + e[2]) } }, null);
    const v = await page.textContent('#i01-val');
    check(`I01 na tela: ${v} = ${brl(esp)}`, nrm(v) === nrm(brl(esp)), v); }
  { const e = reais(I['M6.I03'].ex_entrada), s = reais(I['M6.I03'].ex_saida), esp = s[1];
    const m = await page.evaluate(([e, s]) => Motor.controle({ saldoInicial: e[0], semanas: [{ entradas: e[1], saidas: s[0] }] }).saldo, [e, s]);
    check(`I03 motor: ${e[0]} + ${e[1]} − ${s[0]} = ${esp}`, m === esp, m);
    await caminho({ 'M6.P02': { tipo: 'texto', v: String(s[0]) }, 'M6.P05': { tipo: 'texto', v: String(e[1]) }, 'M6.P07': { tipo: 'texto', v: String(e[0]) }, 'M6.P08': { tipo: 'opcao', v: 'Na hora' }, 'M6.P10': { tipo: 'NS' } }, null);
    const t = nrm(await page.textContent('#i03'));
    check(`I03 na tela mostra saldo ${brl(esp)}`, t.replace(/\s/g, '').includes(('Saldo' + brl(esp)).replace(/\s/g, '')), t); }
  { const e = reais(I['M6.I04'].ex_entrada), s = reais(I['M6.I04'].ex_saida), esp = s[1];
    const m = await page.evaluate(([e, s]) => Motor.projetar({ saldoInicial: e[0], semanas: [{ entradas: e[1], saidas: s[0] }] })[0].final, [e, s]);
    check(`I04 motor: ${e[0]} + ${e[1]} − ${s[0]} = ${esp}`, m === esp, m);
    await caminho({ 'M6.P02': { tipo: 'texto', v: String(s[0]) }, 'M6.P05': { tipo: 'texto', v: String(e[1]) }, 'M6.P07': { tipo: 'texto', v: String(e[0]) }, 'M6.P08': { tipo: 'opcao', v: 'Na hora' }, 'M6.P10': { tipo: 'NS' } }, null);
    const sf = nrm(await page.textContent('.fluxo tbody tr:first-child .sf'));
    check(`I04 na tela: semana 1 = ${sf} (esperado ${brl(esp)})`, sf === nrm(brl(esp)), sf);
    /* editar uma semana recalcula e passa o saldo adiante */
    await page.fill('.fluxo input[data-i="1"][data-k="saidas"]', '2000'); await page.dispatchEvent('.fluxo input[data-i="1"][data-k="saidas"]', 'change');
    const sf2 = nrm(await page.textContent('.fluxo tbody tr:nth-child(2) .sf'));
    check('I04: semana 2 = saldo da semana 1 − R$ 2.000 e alerta do limite', sf2 === nrm('−' + brl(500)) && nrm(await page.textContent('#i04')).includes(nrm(I['M6.I04'].limite)), sf2); }
  { const e = reais(I['M6.I05'].ex_entrada), esp = reais(I['M6.I05'].ex_saida)[0];
    for (const [k, v] of [['ini', 0], ['ent', e[0]], ['sai', e[1]]]) { await page.fill(`.cen[data-k="${k}"]`, String(v)); await page.dispatchEvent(`.cen[data-k="${k}"]`, 'change'); }
    const t = nrm(await page.textContent('#cen-res'));
    check(`I05 na tela: 0 + ${e[0]} − ${e[1]} = ${brl(esp)}`, t.includes(brl(esp)), t); }
  { const cats = await page.evaluate(() => Motor.categorias(Motor.montar(window.MODULO6)));
    check('I02 categorias literais da regra', JSON.stringify(cats) === JSON.stringify(['essencial agora', 'necessário depois', 'desejável', 'dispensável']), cats);
    await caminho({ 'M6.P01': { tipo: 'texto', v: 'Equipamento, decoração' } }, null);
    for (const [it, cat] of [[0, 'essencial agora'], [1, 'desejável']]) await page.evaluate(([i, c]) => [...document.querySelectorAll('#prio .opcao')].find((b) => b.dataset.i === String(i) && b.dataset.c === c).click(), [it, cat]);
    await page.reload(); await page.click('#ir');
    const pr = await page.evaluate(() => JSON.parse(localStorage.getItem('lg2-turma-b-m06')).prio);
    check(`I02: "${I['M6.I02'].ex_saida}" guardado após recarregar`, pr.Equipamento === 'essencial agora' && pr['decoração'] === 'desejável' && (await page.$$('#prio .opcao.sel')).length === 2, pr); }

  /* ---------- 4. persistência ---------- */
  await caminho({ 'M6.P01': { tipo: 'texto', v: 'Forno e balcão' } }, 'M6.P04');
  await page.evaluate(NA_PAGINA.agir, { tipo: 'multi', vs: ['Pix', 'Boleto'] });
  await page.reload();
  check('após recarregar: botão "Continuar de onde parei"', (await page.textContent('#ir')).includes('Continuar'));
  await page.click('#ir');
  check('após recarregar volta à P04 com Pix e Boleto marcados', (await page.evaluate(NA_PAGINA.atual)) === 'M6.P04'
    && JSON.stringify(await page.$$eval('#ent .opcao.sel', (b) => b.map((x) => x.textContent.trim()))) === '["Pix","Boleto"]');
  await page.evaluate(() => { localStorage.setItem('lg2-turma-b-m06', JSON.stringify({ R: { 'M6.P05': { estado: 'opcao', opcao: 'Sim' } }, hist: ['M6.P05'], prio: {} })); });
  await page.reload();
  check('respostas guardadas pela versão v0.1 são descartadas (começa do zero)', (await page.textContent('#ir')).includes('Começar'));

  /* ---------- 5. P09 Sim com detalhes aparece no fluxo; texto ao implementador ausente ---------- */
  await caminho({ 'M6.P09': { tipo: 'opcao', v: 'Sim', detalhe: 'Aluguel pago a cada 60 dias' }, 'M6.P06': { tipo: 'texto', v: 'Aluguel e energia' } }, null);
  const fim = nrm(await page.evaluate(() => document.body.innerText));
  check('resultado mostra o detalhe da P09 e as despesas da P06', fim.includes('Aluguel pago a cada 60 dias') && fim.includes('Aluguel e energia'));
  check('resultado não mostra "Retornar à Pxx"', !/Retornar à P\d/.test(fim));
  await olharRafael('RESULTADO');
  check('nenhum texto "Rafael" aparece em nenhuma tela', telasComRafael.length === 0, telasComRafael);
  check('sem erro de JavaScript na página', errosJS.length === 0, errosJS);

  /* ---------- prints de celular ---------- */
  if (process.env.SHOTS) {
    const S = process.env.SHOTS, foto = async (n) => { await page.waitForTimeout(400); await page.screenshot({ path: path.join(S, `m06_${n}.png`) }); };
    await page.evaluate(() => localStorage.clear()); await page.reload(); await foto('01_inicio');
    await caminho({}, 'M6.P04');
    await page.evaluate(NA_PAGINA.agir, { tipo: 'multi', vs: ['Pix', 'Cartão de crédito parcelado', 'Não sei'] });
    await page.waitForTimeout(500); await page.evaluate(() => window.scrollTo(0, 0)); await foto('02_p04_varias_formas');
    await caminho({}, 'M6.P09');
    await page.evaluate(NA_PAGINA.agir, { tipo: 'opcao', v: 'Sim', detalhe: '' });
    await page.waitForTimeout(500); await page.evaluate(() => window.scrollTo(0, 0)); await foto('03_p09_sim_sem_detalhes');
    await caminho({}, 'Negócio'); await foto('04_negocio');
    await caminho({ 'M6.P02': { tipo: 'texto', v: '1500' }, 'M6.P05': { tipo: 'texto', v: '1000' }, 'M6.P07': { tipo: 'texto', v: '2000' }, 'M6.P08': { tipo: 'opcao', v: 'Mais de 30 dias' }, 'Negócio': { tipo: 'opcao', v: 'Serviço' }, 'M6.P11': { tipo: 'texto', v: '2000' } }, null);
    await page.evaluate(() => window.scrollTo(0, 0)); await foto('05_resultado');
    await page.evaluate(() => document.querySelector('#i04').scrollIntoView()); await foto('06_fluxo_13_semanas');
  }

  console.log('\nDIVERGÊNCIAS DA PLANILHA (relatadas, não falham):');
  divergencias.forEach((d) => console.log('DIVERG ' + d));
  await browser.close(); servidor.close();
  console.log(falhas ? `\n${falhas} FALHA(S)` : '\nTODOS OS TESTES PASSARAM');
  process.exit(falhas ? 1 : 0);
})().catch((e) => { console.error('FAIL erro inesperado:', e); process.exit(1); });
