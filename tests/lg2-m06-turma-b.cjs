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
      const rot = (x) => (x.querySelector('.op-txt b') || x).textContent.trim();
      const b = opc.find((x) => rot(x) === v);
      if (!b) throw new Error('opção inexistente: ' + v + ' em ' + opc.map(rot).join('|'));
      b.click();
    };
    if (a.tipo === 'ainda') { document.querySelector('#ainda-nao-sei').click(); return; }
    if (a.tipo === 'NS') { if (document.querySelector('#ns')) { document.querySelector('#ns').click(); return; } clicar('Não sei'); }
    else if (a.tipo === 'opcao') { clicar(a.v); if (a.detalhe !== undefined) document.querySelector('#detalhe').value = a.detalhe; }
    else if (a.tipo === 'multi') a.vs.forEach(clicar);
    else if (a.tipo === 'texto') document.querySelector('#ent input, #ent textarea').value = a.v;
    /* 'manter': só toca Continuar (resposta pré-preenchida pela herança) */
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
  const telasComRafael = [], telasComCodigo = [], telasComVariosAlertas = [];

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
    const corpo = await page.evaluate(() => document.body.innerText);
    if (/rafael/i.test(corpo)) telasComRafael.push(rotulo);
    const cod = corpo.match(/\b(M\d+\.)?P\d{2}\b/);
    if (cod) telasComCodigo.push(`${rotulo}: ${cod[0]}`);
    const nAlerta = await page.evaluate(() => document.querySelectorAll('.b-alerta').length);
    if (nAlerta > 1) telasComVariosAlertas.push(`${rotulo}: ${nAlerta}`);
  }
  /* começa do zero; responde até chegar em `alvo` (ou ao resultado), usando `resp` ou valores neutros */
  async function caminho(resp, alvo, semente) {
    await page.evaluate((s) => { localStorage.clear(); Object.entries(s || {}).forEach(([k, v]) => localStorage.setItem(k, JSON.stringify(v))); }, semente || null);
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
  /* perguntas da seção do negócio que repetem P01/P02: só aparecem quando P01 = Não sei */
  const REPETE_P01 = ['M6.P10', 'M6.P11', 'M6.P13', 'M6.P14'];
  const JUNTAS = { 'M6.R16': ['M6.R13'], 'M6.R18': ['M6.R17'] };
  const alcancadas = [], faltando = [];
  for (const r of R) {
    const a = acaoDaRegra(r);
    const c = await caminho(REPETE_P01.includes(r.pergunta) ? { 'M6.P01': { tipo: 'NS' } } : {}, r.pergunta);
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
    await caminho(REPETE_P01.includes(cod) ? { 'M6.P01': { tipo: 'NS' } } : {}, cod);
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
  { const c = await caminho({ 'M6.P01': { tipo: 'NS' }, 'Negócio': { tipo: 'opcao', v: 'Produto' }, 'M6.P13': { tipo: 'NS' } }, null);
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
    /* P11/P14 (equipamentos do serviço/produto) não aparecem para quem já respondeu P01/P02: usa a P17 (mercadoria) */
    await caminho({ 'M6.P02': { tipo: 'texto', v: String(e[0]) }, 'Negócio': { tipo: 'opcao', v: 'Mercadoria' }, 'M6.P17': { tipo: 'texto', v: String(e[1] + e[2]) } }, null);
    const v = await page.textContent('#i01-val');
    check(`I01 na tela: ${v} = ${brl(esp)}`, nrm(v) === nrm(brl(esp)), v); }
  { const e = reais(I['M6.I03'].ex_entrada), s = reais(I['M6.I03'].ex_saida), esp = s[1];
    const m = await page.evaluate(([e, s]) => Motor.controle({ saldoInicial: e[0], semanas: [{ entradas: e[1], saidas: s[0] }] }).saldo, [e, s]);
    check(`I03 motor: ${e[0]} + ${e[1]} − ${s[0]} = ${esp}`, m === esp, m); }
  { const e = reais(I['M6.I04'].ex_entrada), s = reais(I['M6.I04'].ex_saida), esp = s[1];
    const m = await page.evaluate(([e, s]) => Motor.projetar({ saldoInicial: e[0], semanas: [{ entradas: e[1], saidas: s[0] }] })[0].final, [e, s]);
    check(`I04 motor: ${e[0]} + ${e[1]} − ${s[0]} = ${esp}`, m === esp, m);
    /* BUG ALTO (05/11): a venda do mês entrava uma vez só e o saldo ficava parado. Caso conferido à mão:
       caixa hoje R$ 2.000; investimento R$ 1.500 (sai na semana 1); vendas R$ 1.000/mês recebidas "Até 7 dias";
       gastos de todo mês "Aluguel 300, luz 90" = R$ 390/mês.
       vendas por semana = 1.000 × 12 ÷ 52 = 230,769… → R$ 230,77 (entram a partir da semana 2);
       gastos por semana = 390 × 12 ÷ 52 = R$ 90,00 (toda semana).
       semana 1: 2.000 + 0 − (1.500 + 90) = R$ 410,00
       semana 2: 410 + 230,77 − 90 = R$ 550,77
       semana 13: 410 + 12 × (230,77 − 90) = 410 + 12 × 140,77 = 410 + 1.689,24 = R$ 2.099,24
       controle do período: entradas 12 × 230,77 = 2.769,24; saídas 1.590 + 12 × 90 = 2.670,00; saldo 2.000 + 2.769,24 − 2.670 = 2.099,24 */
    await caminho({ 'M6.P02': { tipo: 'texto', v: '1500' }, 'M6.P05': { tipo: 'texto', v: '1000' }, 'M6.P06': { tipo: 'texto', v: 'Aluguel 300, luz 90' },
      'M6.P07': { tipo: 'texto', v: '2000' }, 'M6.P08': { tipo: 'opcao', v: 'Até 7 dias' } }, null);
    const linhas = await page.$$eval('.fluxo tbody tr', (tr) => tr.map((r) => ({ e: r.querySelector('[data-k="entradas"]').value, s: r.querySelector('[data-k="saidas"]').value, sf: r.querySelector('.sf').textContent.replace(/\s+/g, ' ').trim() })));
    check('I04: 13 semanas, cada uma com Entradas, Saídas e Saldo preenchidos', linhas.length === 13 && linhas.every((l) => l.e !== '' && l.s !== '' && l.sf !== ''), linhas.slice(0, 3));
    check('I04 conferido à mão: semana 1 = entradas 0,00 · saídas 1.590,00 · saldo R$ 410,00', linhas[0].e === '0,00' && linhas[0].s === '1.590,00' && linhas[0].sf === nrm(brl(410)), linhas[0]);
    check('I04 conferido à mão: semana 2 = entradas 230,77 · saídas 90,00 · saldo R$ 550,77', linhas[1].e === '230,77' && linhas[1].s === '90,00' && linhas[1].sf === nrm(brl(550.77)), linhas[1]);
    check('I04 conferido à mão: semana 13 = saldo R$ 2.099,24', linhas[12].sf === nrm(brl(2099.24)), linhas[12]);
    check('I04: o saldo muda toda semana (não fica parado da semana 3 em diante)', new Set(linhas.map((l) => l.sf)).size === 13, linhas.map((l) => l.sf));
    const como = nrm(await page.textContent('#como-conta'));
    check('I04 explica a conta: vendas e gastos do mês por semana (× 12 ÷ 52), recebimento a partir da semana 2, investimento na semana 1',
      como.includes('R$ 1.000,00 por mês = R$ 230,77 por semana (mês × 12 ÷ 52), a partir da semana 2') && como.includes('R$ 390,00 = R$ 90,00 por semana') && como.includes('(R$ 1.500,00) sai na semana 1'), como);
    const t = nrm(await page.textContent('#i03'));
    check('I03 na tela (13 semanas): entradas R$ 2.769,24, saídas R$ 2.670,00, saldo R$ 2.099,24', ['Entradas' + brl(2769.24), 'Saídas' + brl(2670), 'Saldo' + brl(2099.24)].every((x) => t.replace(/\s/g, '').includes(x.replace(/\s/g, ''))), t);
    /* editar uma semana recalcula e passa o saldo adiante */
    await page.fill('.fluxo input[data-i="1"][data-k="saidas"]', '2000'); await page.dispatchEvent('.fluxo input[data-i="1"][data-k="saidas"]', 'change');
    const sf2 = nrm(await page.textContent('.fluxo tbody tr:nth-child(2) .sf'));
    check('I04: semana 2 com saída de R$ 2.000 = 410 + 230,77 − 2.000 = −R$ 1.359,23 e aviso da semana 2 no bloco Atenção', sf2 === nrm('−' + brl(1359.23)) && /Vai sair mais dinheiro do que você terá em caixa na semana 2\b/.test(nrm(await page.textContent('#atencao'))), sf2);
    /* mudar as vendas do mês refaz a tabela: 2.000 × 12 ÷ 52 = 461,54; semana 2 = 410 + 461,54 − 90 = 781,54 */
    await page.fill('#f-vendas', '2000'); await page.dispatchEvent('#f-vendas', 'change');
    const sf3 = nrm(await page.textContent('.fluxo tbody tr:nth-child(2) .sf'));
    check('I04: vendas do mês = R$ 2.000 refaz a tabela (semana 2 = R$ 781,54)', sf3 === nrm(brl(781.54)), sf3); }
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


  /* ---------- 6. relatório do testador (05/11): tipo herdado, herança do Módulo 5, repetição, resumo ---------- */
  const M1 = (r) => ({ versao: 3, R: r });
  const SERV_M1 = 'Serviço: meu cliente paga pelo trabalho que realizo';
  { // sem herança: o seletor continua, explicado
    await caminho({}, 'Negócio');
    const tx = nrm(await page.evaluate(() => document.querySelector('.cartao-q').innerText));
    check('sem herança: seletor explicado ("Para seguir, diga o que você oferece") com descrição das 3 opções',
      tx.includes('Para seguir, diga o que você oferece aos seus clientes') && tx.includes('Seu cliente paga pelo trabalho que você realiza')
      && tx.includes('Você compra pronto para revender') && !(await page.$('.selo')), tx.slice(0, 300)); }
  { // herança do tipo pelo M1.P03A: sem seletor, faixa com selo e "Trocar"
    const c = await caminho({}, null, { 'lg2-turma-a-m01': M1({ 'M1.P03A': { estado: 'opcao', opcao: SERV_M1 } }) });
    check('tipo herdado do Módulo 1: o seletor "Negócio" não aparece como pergunta', !c.vistas.includes('Negócio') && c.vistas.includes('M6.P12'), c.vistas);
    const est = await page.evaluate(() => JSON.parse(localStorage.getItem('lg2-turma-b-m06')).R['Negócio']);
    check('tipo herdado gravado como Serviço com origem Módulo 1', est && est.opcao === 'Serviço' && est.herdado === 1, est);
    check('M1 nunca é escrito pelo M6', (await page.evaluate(() => localStorage.getItem('lg2-turma-a-m01'))).includes('M1.P03A')
      && !(await page.evaluate(() => localStorage.getItem('lg2-turma-a-m01'))).includes('M6.')); }
  { // a faixa na 1ª pergunta da seção e o botão Trocar
    await caminho({}, 'M6.P12', { 'lg2-turma-a-m01': M1({ 'M1.P03A': { estado: 'opcao', opcao: SERV_M1 } }) });
    const fx = nrm(await page.evaluate(() => (document.querySelector('.negocio-atual') || {}).innerText || ''));
    check('faixa "Seu negócio: Serviço" + selo "Veio do Módulo 1" + Trocar', /Seu negócio: Serviço/.test(fx) && fx.includes('Veio do Módulo 1') && fx.includes('Trocar'), fx);
    await page.click('#trocar');
    check('Trocar abre o seletor com Serviço marcado', (await page.evaluate(NA_PAGINA.atual)) === 'Negócio'
      && (await page.$$eval('#ent .opcao.sel b', (b) => b.map((x) => x.textContent))).join() === 'Serviço');
    await page.evaluate(NA_PAGINA.agir, { tipo: 'opcao', v: 'Mercadoria' }); await page.evaluate(NA_PAGINA.seguir);
    const est = await page.evaluate(() => JSON.parse(localStorage.getItem('lg2-turma-b-m06')).R);
    check('depois de trocar: vai para a seção Mercadoria, sem selo de herança e sem respostas do serviço',
      (await page.evaluate(NA_PAGINA.atual)) === 'M6.P16' && est['Negócio'].opcao === 'Mercadoria' && !est['Negócio'].herdado && !est['M6.P12'], est); }
  { // ordem de prioridade do tipo e "Não sei" não conta
    const tipo = async (sem) => { await caminho({}, 'M6.P01', sem); return page.evaluate(() => (JSON.parse(localStorage.getItem('lg2-turma-b-m06') || '{}').R || {})['Negócio'] || null); };
    const a = await tipo({ 'lg2-turma-a-m05': { versao: 3, R: { 'M5.P01': { estado: 'opcao', opcao: 'Mercadoria: compro pronto para revender' } } }, 'lg2-turma-a-m04': { R: { 'M4.P02': { estado: 'opcao', opcao: 'Serviço' } } } });
    const b = await tipo({ 'lg2-turma-a-m04': { R: { 'M4.P02': { estado: 'opcao', opcao: 'Produto+ Serviço' } } } });
    const c = await tipo({ 'lg2-turma-b-m08': { R: { 'M8.P02': { estado: 'opcao', opcao: 'Não sei' } } }, 'lg2-turma-a-m01': M1({ 'M1.P03A': { estado: 'naosei' } }) });
    check('prioridade do tipo: M5 antes do M4; M4 "Produto+ Serviço" = Produto; "Não sei" não é herança',
      a && a.opcao === 'Mercadoria' && a.herdado === 5 && b && b.opcao === 'Produto' && b.herdado === 4 && c === null, [a, b, c]); }

  const M5 = { versao: 3, R: {
    'M5.P01': { estado: 'opcao', opcao: 'Serviço: meu cliente paga pelo trabalho que realizo' },
    'M5.P19': { estado: 'valor', valor: ['Shampoo automotivo', 'Cera'] }, 'M5.P20': { estado: 'valor', valor: ['30', '45,50'] },
    'M5.P28': { estado: 'opcao', opcao: 'Sim' }, 'M5.P29': { estado: 'valor', valor: '800' },
    'M5.P30': { estado: 'opcao', opcao: 'Sim' }, 'M5.P31': { estado: 'valor', valor: '150' },
    'M5.P32': { estado: 'opcao', opcao: 'Sim' }, 'M5.P33': { estado: 'valor', valor: [{ nome: 'Internet', v: '100' }] },
    'M5.PG': { estado: 'valor', valor: ['Pix', 'Dinheiro', 'Cartão de crédito'] },
    'M5.P36': { estado: 'valor', valor: '50' }, 'M5.P37': { estado: 'valor', valor: '20' } } };
  const semM5 = { 'lg2-turma-a-m05': M5 };
  const tela = async () => page.evaluate(() => ({ selo: (document.querySelector('.herdado') || {}).innerText || '',
    sel: [...document.querySelectorAll('#ent .opcao.sel b')].map((x) => x.textContent), campo: (document.querySelector('#ent input, #ent textarea') || {}).value }));
  { await caminho({}, 'M6.P04', semM5); const x = await tela();
    check('P04 pré-marcada com as formas do Módulo 5 (crédito → à vista) e selo "Veio do Módulo 5"',
      x.sel.join('|') === 'Dinheiro|Pix|Cartão de crédito à vista' && x.selo.includes('Veio do Módulo 5') && x.selo.includes('Confira e ajuste se quiser') && x.selo.includes('parcelado'), x);
    await page.evaluate(NA_PAGINA.agir, { tipo: 'manter' });
    const r = await page.evaluate(() => JSON.parse(localStorage.getItem('lg2-turma-b-m06')).R['M6.P04']);
    check('P04: só tocar Continuar grava as formas herdadas (com origem)', r && r.estado === 'multi' && r.opcoes.length === 3 && r.herdado === 5 && (await page.evaluate(NA_PAGINA.seguir)), r); }
  { await caminho({}, 'M6.P05', semM5); const x = await tela();
    check('P05 = preço × quantidade do Módulo 5 (50 × 20 = 1.000,00), com selo e a conta explicada', x.campo === '1.000,00' && x.selo.includes('R$ 50,00 por venda × 20 vendas'), x); }
  { await caminho({}, 'M6.P06', semM5); const x = await tela();
    check('P06 pré-preenchida com os gastos fixos do Módulo 5', x.campo === 'Aluguel: R$ 800,00; Água e luz: R$ 150,00; Internet: R$ 100,00' && x.selo.includes('R$ 1.050,00'), x); }
  { const s2 = { 'lg2-turma-a-m05': { versao: 3, R: { ...M5.R, 'M5.P36': { estado: 'naosei' } } } };
    await caminho({}, 'M6.P05', s2); const x = await tela();
    check('"Não sei" no Módulo 5 não conta como herança (P05 vazia, sem selo)', x.campo === '' && !x.selo, x); }
  { await caminho({ 'M6.P01': { tipo: 'NS' } }, 'M6.P10', semM5); const x = await tela();
    check('P10 (P01 = Não sei) pré-preenchida com os itens do Módulo 5', x.campo === 'Shampoo automotivo, Cera' && x.selo.includes('Veio do Módulo 5'), x);
    await page.evaluate(NA_PAGINA.agir, { tipo: 'manter' }); await page.evaluate(NA_PAGINA.seguir);
    const y = await tela();
    check('P11 pré-preenchida com a soma dos preços do Módulo 5 (30 + 45,50 = 75,50)', (await page.evaluate(NA_PAGINA.atual)) === 'M6.P11' && y.campo === '75,50', y); }
  { // repetição dentro do módulo: P10/P11 repetem P01/P02
    const c = await caminho({ 'M6.P01': { tipo: 'texto', v: 'Lavadora de alta pressão, aspirador' }, 'M6.P02': { tipo: 'texto', v: '3000' }, 'Negócio': { tipo: 'opcao', v: 'Serviço' } }, null);
    check('quem respondeu P01/P02 não vê P10/P11 (mesma pergunta); P12 continua', !c.vistas.includes('M6.P10') && !c.vistas.includes('M6.P11') && c.vistas.includes('M6.P12'), c.vistas);
    check('investimento não conta duas vezes (só P02 = R$ 3.000,00)', nrm(await page.textContent('#i01-val')) === nrm('R$ 3.000,00'));
    const resumo = nrm(await page.evaluate(() => document.querySelector('details.respostas').textContent));
    check('resumo: P10/P11 mostram "Respondido no começo" com a lista e o valor da P01/P02', resumo.includes('Respondido no começo Lavadora de alta pressão, aspirador') && resumo.includes('Respondido no começo 3000'), resumo.slice(0, 400));
    const c2 = await caminho({ 'M6.P01': { tipo: 'texto', v: 'Forno' }, 'Negócio': { tipo: 'opcao', v: 'Produto' } }, null);
    check('o mesmo vale para Produto: P13/P14 pulam, P15 aparece', !c2.vistas.includes('M6.P13') && !c2.vistas.includes('M6.P14') && c2.vistas.includes('M6.P15'), c2.vistas); }
  { // "O que entendemos até aqui"
    const sem = { ...semM5, 'lg2-turma-a-m01': M1({ 'M1.P01': { estado: 'opcao', opcao: 'Ainda está só na minha cabeça' }, 'M1.P03': { estado: 'valor', valor: 'Lavagem de carro em domicílio' }, 'M1.P03A': { estado: 'opcao', opcao: SERV_M1 } }) };
    await caminho({ 'M6.P01': { tipo: 'texto', v: 'Lavadora' }, 'M6.P02': { tipo: 'texto', v: '3000' }, 'M6.P03': { tipo: 'opcao', v: 'À vista' }, 'M6.P04': { tipo: 'manter' }, 'M6.P05': { tipo: 'manter' }, 'M6.P06': { tipo: 'manter' },
      'M6.P07': { tipo: 'texto', v: '500' }, 'M6.P08': { tipo: 'opcao', v: 'Até 7 dias' } }, null, sem);
    const box = await page.evaluate(() => { const b = document.querySelector('#entendemos'); return b && { txt: b.innerText, n: b.querySelectorAll('p').length, li: b.querySelectorAll('ul, ol, li').length,
      p: [...b.querySelectorAll('p')].map((x) => x.textContent.replace(/\s+/g, ' ')),
      antes: !!(b.compareDocumentPosition(document.querySelector('#i01')) & Node.DOCUMENT_POSITION_FOLLOWING) }; });
    const bt = nrm(box && box.txt);
    /* texto corrido (relatório do Bento): 1 a 3 parágrafos, sem lista */
    check('resultado: caixa "O que entendemos até aqui" acima do caixa, texto corrido em 1 a 3 parágrafos (sem <li>, com <p>)', box && box.antes && box.n >= 1 && box.n <= 3 && box.li === 0 && bt.startsWith('O que entendemos até aqui'), box);
    check('caixa: parágrafos por assunto (negócio · gasto e vendas · caixa nas 13 semanas)', box && box.n === 3 && box.p[0].startsWith('Você oferece') && /Para começar/.test(box.p[1]) && /semana/.test(box.p[2]), box && box.p);
    check('caixa junta módulos anteriores e este (ideia, tipo, estágio, investimento, vendas, semana negativa)',
      bt.includes('Você oferece um serviço: Lavagem de carro em domicílio.') && bt.includes('Você ainda não começou a vender.')
      && bt.includes('Para começar, você estima gastar R$ 3.000,00, pagando à vista.') && bt.includes('Você espera vender cerca de R$ 1.000,00 por mês e receber o dinheiro em até 7 dias.')
      && bt.includes('Começando com R$ 500,00 no caixa, o seu dinheiro fica negativo na semana 1'), bt);
    check('lista de respostas recolhida em "Ver suas respostas"', await page.evaluate(() => { const d = document.querySelector('details.respostas'); return !!d && !d.open && /Ver suas respostas/.test(d.querySelector('summary').textContent); }));
    const resumo = nrm(await page.evaluate(() => document.querySelector('details.respostas').textContent));
    check('resumo mostra o selo "Veio do Módulo 5" nas respostas herdadas e "Veio do Módulo 1" no tipo', /Veio do Módulo 5 Dinheiro; Pix/.test(resumo) && /Veio do Módulo 1 Serviço/.test(resumo), resumo.slice(0, 500)); }

  /* ---------- 7. relatório 05/11: próximos passos, encaminhamentos, alertas, Módulo 1, campos numéricos, teclado ---------- */
  { const c = await caminho({ 'M6.P01': { tipo: 'texto', v: 'Forno' }, 'M6.P02': { tipo: 'texto', v: '3000' }, 'M6.P07': { tipo: 'NS' }, 'M6.P09': { tipo: 'NS' },
      'Negócio': { tipo: 'opcao', v: 'Mercadoria' }, 'M6.P16': { tipo: 'texto', v: 'Potes' }, 'M6.P17': { tipo: 'texto', v: '1000' } }, null);
    const px = await page.$$eval('#proximos li', (l) => l.map((x) => x.textContent.trim()));
    check('Próximos passos = só o que ficou em "Não sei", em linguagem simples', JSON.stringify(px) === JSON.stringify(['Informe quanto você tem em caixa hoje para usar no negócio.', 'Confira se algum pagamento ou recebimento tem prazo diferente dos outros.']), px);
    const corpo = await page.evaluate(() => document.body.innerText);
    check('resultado sem códigos internos (P02, "Preencher P17", "na P08")', !/\b(M\d+\.)?P\d{2}\b/.test(corpo), (corpo.match(/.{30}\bP\d{2}\b.{10}/) || [])[0]);
    const enc = await page.$$eval('.b-enc li', (l) => l.map((x) => x.textContent.trim()));
    check('encaminhamentos sem repetição ("Estimativa do investimento" aparece uma vez só)', enc.filter((x) => /^Estimativa do investimento/.test(x)).length === 1 && new Set(enc).size === enc.length, enc);
    const ale = nrm(await page.evaluate(() => (document.querySelector('#atencao') || {}).innerText || ''));
    await olharRafael('RESULTADO com alertas');
    const dic = await page.$$eval('#dicas li', (l) => l.map((x) => x.textContent.trim()));
    check('alerta que depende da resposta fica em "Atenção, pelas suas respostas" (caixa = Não sei)', ale.includes('Sem essa informação, não é possível comparar os recursos disponíveis com as necessidades.'), ale);
    check('alertas genéricos saem dos alertas e vão para "Dicas gerais" (no máximo 4)', !ale.includes('O valor pode mudar após consultar preços e fornecedores.')
      && dic.length >= 1 && dic.length <= 4 && dic.every((d) => !ale.includes(nrm(d))), { ale, dic });
    await caminho({ 'M6.P01': { tipo: 'texto', v: 'Forno' }, 'M6.P02': { tipo: 'texto', v: '3000' } }, null);
    check('nada em aberto: Próximos passos diz isso em vez de listar perguntas já respondidas', /Nada ficou em aberto/.test(await page.textContent('#proximos')) && !(await page.$('#proximos li'))); }
  { const m1 = (op) => ({ 'lg2-turma-a-m01': M1({ 'M1.P07': { estado: 'opcao', opcao: op } }) });
    const resp = { 'M6.P01': { tipo: 'texto', v: 'Potes e forno' }, 'M6.P02': { tipo: 'texto', v: '3000' } };
    await caminho(resp, null, m1('Até R$ 100'));
    const av = nrm(await page.evaluate(() => (document.querySelector('#aviso-m1') || {}).innerText || ''));
    check('investimento R$ 3.000 acima de "Até R$ 100" (Módulo 1): aviso no resultado citando o Módulo 1', av.includes('Veio do Módulo 1') && av.includes('“Até R$ 100”') && av.includes('R$ 3.000,00'), av);
    await caminho(resp, null, m1('Mais de R$ 1.000'));
    const a2 = await page.$('#aviso-m1');
    await caminho({ ...resp, 'M6.P02': { tipo: 'texto', v: '800' } }, null, m1('Entre R$ 500 e R$ 1.000'));
    check('sem aviso do Módulo 1 quando o investimento cabe no limite (ou "Mais de R$ 1.000")', !a2 && !(await page.$('#aviso-m1'))); }
  { await caminho({ 'M6.P01': { tipo: 'texto', v: 'Forno' } }, 'M6.P02');
    await page.evaluate(NA_PAGINA.agir, { tipo: 'texto', v: '12abc' });
    check('número com letras: "Digite só números. Ex.: 12,50" e não grava', nrm(await page.textContent('#erro')).includes('Digite só números. Ex.: 12,50')
      && !(await page.evaluate(() => JSON.parse(localStorage.getItem('lg2-turma-b-m06')).R['M6.P02'])));
    const inp = await page.getAttribute('#ent input', 'inputmode');
    await page.evaluate(NA_PAGINA.agir, { tipo: 'texto', v: '60000' });
    const aviso1 = nrm(await page.textContent('#erro')), gravou1 = await page.evaluate(() => !!JSON.parse(localStorage.getItem('lg2-turma-b-m06')).R['M6.P02']);
    await page.evaluate(() => document.querySelector('#ok').click());
    const gravou2 = await page.evaluate(() => !!JSON.parse(localStorage.getItem('lg2-turma-b-m06')).R['M6.P02']);
    check('valor alto (R$ 60.000) avisa sem travar: 1º Continuar avisa, 2º com o mesmo valor segue', inp === 'decimal' && /parece alto/.test(aviso1) && !gravou1 && gravou2
      && (await page.evaluate(NA_PAGINA.seguir)), { inp, aviso1, gravou1, gravou2 }); }
  { // teclado do celular: campo e Continuar continuam visíveis
    check('viewport com interactive-widget=resizes-content', /interactive-widget=resizes-content/.test(fs.readFileSync(path.join(DIR, 'index.html'), 'utf8')));
    for (const [cod, sel, pre] of [['M6.P01', '#ent textarea', {}], ['M6.P05', '#ent input', {}]]) {
      await caminho(pre, cod);
      await page.focus(sel);
      await page.setViewportSize({ width: 390, height: 450 });
      await page.waitForTimeout(600);
      const [bc, bo] = [await (await page.$(sel)).boundingBox(), await (await page.$('#ok')).boundingBox()];
      await page.setViewportSize({ width: 390, height: 844 });
      check(`teclado aberto (390x450) em ${cod}: campo e Continuar dentro da tela`, bc.y >= 0 && bc.y + bc.height <= 450 && bo.y >= 0 && bo.y + bo.height <= 450, { bc, bo });
    } }
  { // estado salvo antes da correção (venda do mês uma vez só): a tabela é refeita
    await page.evaluate(() => { localStorage.clear(); localStorage.setItem('lg2-turma-b-m06', JSON.stringify({ dados: '2026-10-15',
      R: { 'M6.P01': { estado: 'valor', valor: 'Potes' }, 'M6.P02': { estado: 'valor', valor: '1500' }, 'M6.P05': { estado: 'valor', valor: '1000' }, 'M6.P07': { estado: 'valor', valor: '2000' } },
      hist: ['M6.P01', 'RESULTADO'], prio: {}, cen: null,
      fluxo: { saldoInicial: 2000, semanas: [{ entradas: 1000, saidas: 1500 }, ...Array.from({ length: 12 }, () => ({ entradas: 0, saidas: 0 }))], semanaPagamento: 1, semanaRecebimento: 1 } })); });
    await page.reload(); await page.click('#ir');
    const sf = await page.$$eval('.fluxo .sf', (x) => x.map((e) => e.textContent.replace(/\s+/g, ' ').trim()));
    // 2.000 − 1.500 + 230,77 por semana desde a semana 1 (prazo não informado) = 730,77 … 500 + 13 × 230,77 = 3.500,01
    check('fluxo salvo na versão antiga é refeito com as respostas (semana 1 = R$ 730,77; semana 13 = R$ 3.500,01)', sf[0] === nrm(brl(730.77)) && sf[12] === nrm(brl(3500.01)), sf); }

  /* ---------- 8. novas testadoras: atenção única, prioridade de compras, "Como calculamos" ---------- */
  { // (a) pergunta com regra + alerta da pergunta = um bloco só, sem repetição
    await caminho({}, 'M6.P05');
    await page.evaluate(NA_PAGINA.agir, { tipo: 'texto', v: '0' });
    const blocos = await page.$$eval('.b-alerta', (b) => b.map((x) => x.innerText));
    const itensAt = await page.$$eval('.b-alerta li', (l) => l.map((x) => x.textContent.trim()));
    check('P05 = 0 (duas regras + alerta da pergunta): um único bloco "Atenção" com os alertas sem repetição', blocos.length === 1 && itensAt.length >= 2 && new Set(itensAt).size === itensAt.length, { blocos, itensAt });
    // resultado com M1 acima do teto + semana negativa + alertas das respostas: um bloco só
    await caminho({ 'M6.P01': { tipo: 'texto', v: 'Forno' }, 'M6.P02': { tipo: 'texto', v: '3000' }, 'M6.P07': { tipo: 'texto', v: '0' } }, null,
      { 'lg2-turma-a-m01': M1({ 'M1.P07': { estado: 'opcao', opcao: 'Até R$ 100' } }) });
    const nb = await page.$$eval('.b-alerta', (b) => b.length), li = await page.$$eval('#atencao li', (l) => l.map((x) => x.textContent.trim()));
    check('resultado: Módulo 1, semana no vermelho e alertas das respostas no MESMO bloco "Atenção", sem repetição', nb === 1 && li.some((x) => /Veio do Módulo 1/.test(x)) && li.some((x) => /semana 1/.test(x)) && new Set(li).size === li.length, { nb, li }); }
  { // (b) "nada, por enquanto." não vira item
    const its = await page.evaluate(() => [Motor.itensDe('nada, por enquanto.'), Motor.itensDe('farinha, chocolate em pó, nada mais'), Motor.itensDe('Nenhum. Ainda não sei'), Motor.semCompras('nada, por enquanto.'), Motor.semCompras('farinha')]);
    check('motor: "nada, por enquanto." = nenhum item (sem compras); "farinha, chocolate em pó, nada mais" = 2 itens', JSON.stringify(its) === JSON.stringify([[], ['farinha', 'chocolate em pó'], [], true, false]), its);
    const c = await caminho({ 'M6.P01': { tipo: 'texto', v: 'nada, por enquanto.' } }, null);
    const r1 = await page.evaluate(() => JSON.parse(localStorage.getItem('lg2-turma-b-m06')).R['M6.P01']);
    check('P01 = "nada, por enquanto.": sem compras, pula o valor das compras (P02/P03) e não abre a lista de prioridades',
      r1.semCompras === true && !c.vistas.includes('M6.P02') && !c.vistas.includes('M6.P03') && !(await page.$('#prio')) && !/por enquanto/.test(await page.textContent('#i02'))
      && nrm(await page.textContent('#i01-val')) === nrm(brl(0)), { r1, vistas: c.vistas });
    await caminho({}, 'M6.P01');
    check('P01 tem o botão "Não tenho compras a fazer agora"', !!(await page.$('#sem-compras-btn')) && nrm(await page.textContent('#sem-compras-btn')) === 'Não tenho compras a fazer agora');
    await page.click('#sem-compras-btn');
    const ret = nrm(await page.evaluate(NA_PAGINA.retorno));
    await page.evaluate(NA_PAGINA.seguir);
    check('o botão grava "sem compras" e pula para as formas de pagamento', ret.includes('sem compras para começar agora') && (await page.evaluate(NA_PAGINA.atual)) === 'M6.P04', ret);
    // tirar um item antes de classificar
    await caminho({ 'M6.P01': { tipo: 'texto', v: 'farinha, chocolate em pó, nada' } }, null);
    const antes = await page.$$eval('#prio .nome', (n) => n.map((x) => x.textContent));
    await page.evaluate(() => [...document.querySelectorAll('#prio .tirar')][1].click());
    const depois = await page.$$eval('#prio .nome', (n) => n.map((x) => x.textContent));
    await page.reload(); await page.click('#ir');
    const recarr = await page.$$eval('#prio .nome', (n) => n.map((x) => x.textContent));
    check('lista de prioridades: "nada" não entra; "Tirar da lista" remove um item e continua fora ao recarregar',
      JSON.stringify(antes) === '["farinha","chocolate em pó"]' && JSON.stringify(depois) === '["farinha"]' && JSON.stringify(recarr) === '["farinha"]' && /chocolate em pó/.test(await page.textContent('#fora')), { antes, depois, recarr }); }
  { // (c) "Como calculamos" embaixo de cada número
    await caminho({ 'M6.P02': { tipo: 'texto', v: '1500' }, 'M6.P05': { tipo: 'texto', v: '1000' }, 'M6.P06': { tipo: 'texto', v: 'Aluguel 300, luz 90' },
      'M6.P07': { tipo: 'texto', v: '2000' }, 'M6.P08': { tipo: 'opcao', v: 'Até 7 dias' } }, null);
    const cm = await page.evaluate(() => Object.fromEntries(['i01', 'i03', 'i04', 'i05'].map((k) => [k, (document.querySelector('#como-' + k) || {}).innerText || ''])));
    check('"Como calculamos:" no investimento, no saldo, no fluxo e no cenário',
      Object.values(cm).every((x) => nrm(x).startsWith('Como calculamos:')) && nrm(cm.i01).includes('R$ 1.500,00')
      && nrm(cm.i03).includes('(R$ 2.000,00)') && nrm(cm.i03).includes('= R$ 2.099,24') && /semana anterior \+ entradas − saídas/.test(cm.i04), cm); }

  /* ---------- lote 3 (05/11): Voltar no topo, caixas educativas recolhidas, "Ainda não sei o que vou precisar comprar" ---------- */
  { // Voltar no topo do cartão, à esquerda, acima do texto; um só; na 1ª pergunta volta para a capa
    await caminho({}, 'M6.P01');
    const vt = await page.evaluate(() => {
      const v = document.querySelector('#v'), q = document.querySelector('.cartao-q h2.q'), bv = v.getBoundingClientRect(), bq = q.getBoundingClientRect();
      return { n: document.querySelectorAll('#v, .acoes-voltar, .btn.voltar').length, dentro: !!v.closest('.cartao-q'), acima: bv.bottom <= bq.top + 1, esq: bv.left < 60, txt: v.textContent.replace(/\s+/g, ' ').trim() };
    });
    check('Voltar: um só "‹ Voltar", no topo do cartão, à esquerda, acima da pergunta', vt.n === 1 && vt.dentro && vt.acima && vt.esq && vt.txt === '‹ Voltar', vt);
    check('Voltar: nome acessível "Voltar"', (await page.getByRole('button', { name: 'Voltar', exact: true }).count()) === 1);
    await page.click('#v');
    check('Voltar na 1ª pergunta volta para a capa', !!(await page.$('#ir')) && !(await page.$('.cartao-q')));
    await caminho({}, 'M6.P04');
    await page.click('#v');
    check('Voltar na P04 volta para a pergunta anterior', (await page.evaluate(NA_PAGINA.atual)) !== 'M6.P04' && !!(await page.$('.cartao-q')));
    await caminho({}, null);
    const vr = await page.evaluate(() => { const v = document.querySelector('#v'); return { n: document.querySelectorAll('#v, .acoes-voltar').length, topo: v && v.getBoundingClientRect().bottom <= document.querySelector('.concluido').getBoundingClientRect().top + 1 }; });
    check('resultado: "‹ Voltar" no topo, nenhum embaixo', vr.n === 1 && vr.topo, vr); }
  { // caixas "Entenda", "Faça" e "Use a IA com cuidado": recolhidas, discretas, embaixo do Continuar
    await caminho({}, 'M6.P01');
    const cx = await page.evaluate(() => {
      const ok = document.querySelector('#ok').getBoundingClientRect();
      return [...document.querySelectorAll('.cartao-q .caixa')].map((c) => ({ tag: c.tagName, aberta: c.open, abaixo: c.getBoundingClientRect().top >= ok.bottom, alt: c.getBoundingClientRect().height, tipo: c.querySelector('.tag').textContent }));
    });
    check('P01: caixas educativas (Entenda, Faça, IA) são <details> fechados, embaixo do Continuar e baixinhas',
      cx.length === 3 && cx.every((c) => c.tag === 'DETAILS' && !c.aberta && c.abaixo && c.alt < 90) && ['Entenda', 'Faça'].every((t) => cx.some((c) => c.tipo === t)), cx);
    await page.click('.caixa-faca summary');
    check('caixa "Faça" abre ao tocar', await page.evaluate(() => document.querySelector('.caixa-faca').open && document.querySelector('.caixa-faca p').getBoundingClientRect().height > 0));
    if (process.env.SHOTS) { await page.evaluate(() => { document.querySelector('.caixa-faca').open = false; window.scrollTo(0, 0); }); await page.waitForTimeout(400); await page.screenshot({ path: path.join(process.env.SHOTS, 'l3_m06_p01_botoes.png'), fullPage: true }); } }
  { // "Ainda não sei o que vou precisar comprar": sem calculadora, orientação curta, "falta descobrir" no resumo
    await caminho({}, 'M6.P01');
    check('P01 tem o botão "Ainda não sei o que vou precisar comprar"', nrm(await page.textContent('#ainda-nao-sei')) === 'Ainda não sei o que vou precisar comprar');
    await page.click('#ainda-nao-sei');
    const ret = nrm(await page.evaluate(NA_PAGINA.retorno));
    const r1 = await page.evaluate(() => JSON.parse(localStorage.getItem('lg2-turma-b-m06')).R['M6.P01']);
    check('"Ainda não sei": grava como "Não sei" + marca aindaNaoSei e mostra como descobrir (unidade/atendimento, Módulo 4, Módulo 5)',
      r1.estado === 'naosei' && r1.aindaNaoSei === true && /como descobrir o que comprar/i.test(ret) && ret.includes('uma unidade ou um atendimento')
      && ret.includes('ficha técnica que você montou no Módulo 4') && ret.includes('materiais que você informou no Módulo 5') && !(await page.$('#retorno .b-alerta')), { r1, ret });
    check('"Ainda não sei" sem Módulo 5: não oferece lista de partida', !(await page.$('#partida-m5')));
    await page.evaluate(NA_PAGINA.seguir);
    check('"Ainda não sei" não abre a calculadora: pula o valor e a forma de pagar as compras', (await page.evaluate(NA_PAGINA.atual)) === 'M6.P04');
    const c = await caminho({ 'M6.P01': { tipo: 'ainda' } }, null);
    const i02 = nrm(await page.textContent('#i02')), i01 = nrm(await page.textContent('#i01')), ent = nrm(await page.textContent('#entendemos'));
    check('resumo: "Falta descobrir" o que comprar, com o caminho para descobrir, sem lista de prioridades e sem valor',
      !c.vistas.includes('M6.P02') && !c.vistas.includes('M6.P03') && /falta descobrir/i.test(i02) && /como descobrir o que comprar/i.test(i02) && !(await page.$('#prio'))
      && nrm(await page.textContent('#i01-val')) === '—' && i01.includes('falta descobrir o que você vai precisar comprar'), { vistas: c.vistas, i02, i01 });
    check('"Ainda não sei" não repete a lista nem o valor dos equipamentos na seção do negócio', !c.vistas.includes('M6.P10') && !c.vistas.includes('M6.P11') && c.vistas.includes('M6.P12'), c.vistas);
    check('resumo: "O que entendemos" diz que ainda vai descobrir o que comprar', ent.includes('Você ainda vai descobrir o que precisa comprar para começar'), ent);
    const resp = nrm(await page.evaluate(() => [...document.querySelectorAll('.respostas .cartao')].find((x) => /O que você precisa comprar/.test(x.textContent)).textContent));
    check('"Ver suas respostas": P01 aparece como "Ainda não sei o que vou precisar comprar · Falta descobrir"', resp.includes('Ainda não sei o que vou precisar comprar') && resp.includes('Falta descobrir'), resp);
    check('resumo: o próximo passo pede a lista do que comprar', nrm(await page.textContent('#proximos')).includes('Liste o que você precisa comprar ou pagar para começar'));
    if (process.env.SHOTS) { await page.evaluate(() => document.querySelector('#i02').scrollIntoView()); await page.waitForTimeout(400); await page.screenshot({ path: path.join(process.env.SHOTS, 'l3_m06_resultado_falta_descobrir.png') }); } }
  { // com materiais no Módulo 5: oferece como ponto de partida e preenche a P01
    const M5 = { 'lg2-turma-a-m05': { versao: 3, R: { 'M5.P03': { estado: 'valor', valor: ['farinha', 'leite condensado', 'pote com tampa'] } } } };
    await caminho({}, 'M6.P01', M5);
    await page.click('#ainda-nao-sei');
    const pt = nrm(await page.evaluate(() => (document.querySelector('#partida-m5') || {}).innerText || ''));
    check('"Ainda não sei" com Módulo 5: mostra os materiais de lá como ponto de partida, com selo', pt.includes('Veio do Módulo 5') && pt.includes('farinha, leite condensado, pote com tampa'), pt);
    if (process.env.SHOTS) { await page.evaluate(() => document.querySelector('#retorno').scrollIntoView()); await page.waitForTimeout(400); await page.screenshot({ path: path.join(process.env.SHOTS, 'l3_m06_p01_ainda_nao_sei.png') }); }
    await page.click('#usar-m5');
    check('"Usar essa lista como ponto de partida" volta à P01 com a lista no campo e o selo do Módulo 5',
      (await page.evaluate(NA_PAGINA.atual)) === 'M6.P01' && (await page.inputValue('#ent textarea')) === 'farinha, leite condensado, pote com tampa' && nrm(await page.textContent('.herdado')).includes('Veio do Módulo 5'));
    await page.click('#ok'); await page.evaluate(NA_PAGINA.seguir);
    const r1 = await page.evaluate(() => JSON.parse(localStorage.getItem('lg2-turma-b-m06')).R['M6.P01']);
    check('lista de partida confirmada: grava os itens e segue para o valor das compras', r1.estado === 'valor' && !r1.aindaNaoSei && (await page.evaluate(NA_PAGINA.atual)) === 'M6.P02', r1);
    check('M5 nunca é escrito pelo M6', !(await page.evaluate(() => localStorage.getItem('lg2-turma-a-m05'))).includes('M6.')); }

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
  check('nenhum código de pergunta (P02, M6.P17…) aparece em nenhuma tela', telasComCodigo.length === 0, telasComCodigo.slice(0, 8));
  check('no máximo um bloco de atenção por tela (todas as regras e resultados vistos)', telasComVariosAlertas.length === 0, telasComVariosAlertas.slice(0, 8));
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
