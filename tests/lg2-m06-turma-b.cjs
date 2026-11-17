/* Teste de navegação do LG2 M06 (Turma B) no navegador headless.
   Execute: PW=<caminho do pacote playwright> node tests/lg2-m06-turma-b.cjs
   Opcional: SHOTS=<pasta> grava os prints de celular (390x844); M06_DIR=<pasta> testa outra cópia;
   M06_SABOTAGEM=1 serve o app sem a caixa "Como descobrir"; M06_SABOTAGEM=2 faz o "Não sei" gravar "naosei"
   (lote 16/11: o teste tem de falhar nos dois); M06_SABOTAGEM=3 põe de volta o passo extra "Seguir" depois do Continuar
   (lote 17/11, um toque por pergunta: o teste tem de falhar). M06_SABOTAGEM=4 tira a conclusão principal do resultado
   (passada geral: o teste tem de falhar).
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
  if (process.env.M06_SABOTAGEM === '1' && f.endsWith(path.join('js', 'app.js')))
    return res.end(fs.readFileSync(f, 'utf8').replace('function caixaComo(q, extra) {', 'function caixaComo(q, extra) { return "";'));
  if (process.env.M06_SABOTAGEM === '2' && f.endsWith(path.join('js', 'app.js')))
    return res.end(fs.readFileSync(f, 'utf8').replace('if (ns) ns.onclick = () => ajudaNS(true);', 'if (ns) ns.onclick = () => responder({ estado: "naosei" });'));
  if (process.env.M06_SABOTAGEM === '3' && f.endsWith(path.join('js', 'app.js')))
    return res.end(fs.readFileSync(f, 'utf8').replace('sobreAnterior = visto ? null : textoSobre(Motor.regrasAgora(M, S.R, cod), r0);\n      ir(telaPergunta, prox);',
      'const sg = el(`<button class="btn btn-primario">Seguir</button>`); sg.onclick = () => ir(telaPergunta, prox); const ac = p.querySelector("#acoes"); ac.innerHTML = ""; ac.appendChild(sg);'));
  if (process.env.M06_SABOTAGEM === '4' && f.endsWith(path.join('js', 'app.js')))
    return res.end(fs.readFileSync(f, 'utf8').replace('${conclusaoCaixa()}', ''));
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
  /* o contador mostra a posição no caminho (não o número da planilha): a pergunta vem de data-cod */
  atual: () => {
    const c = document.querySelector('.cartao-q[data-cod]');
    if (c) return c.dataset.cod;
    const t = document.querySelector('.passo');
    return t && /Resultado/.test(t.textContent) ? 'RESULTADO' : null;
  },
  agir: (a) => {
    /* como a pessoa: o campo avisa que mudou (input + change), o retorno ao vivo aparece */
    const por = (el, v) => { el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); };
    const opc = [...document.querySelectorAll('#ent .opcao')];
    const clicar = (v) => {
      const rot = (x) => (x.querySelector('.op-txt b') || x).textContent.trim();
      const b = opc.find((x) => rot(x) === v);
      if (!b) throw new Error('opção inexistente: ' + v + ' em ' + opc.map(rot).join('|'));
      b.click();
    };
    if (a.tipo === 'formas') {   // a.vals = { forma: [taxa, dias, parte] }; o que não vier = 0 / divisão igual já preenchida
      document.querySelectorAll('.forma').forEach((f) => { const v = (a.vals || {})[f.dataset.forma];
        const put = (sel, x) => { const i = f.querySelector(sel); if (i && x !== undefined) por(i, x); else if (i && !i.value) por(i, '0'); };
        put('.taxa', v && v[0]); put('.prazo', v && v[1]); if (v && v[2] !== undefined && f.querySelector('.parte')) por(f.querySelector('.parte'), v[2]); }); }
    if (a.tipo === 'saz') { [...document.querySelectorAll('#ent .opcao')].find((x) => x.textContent.trim().startsWith(a.v)).click();
      (a.fortes || []).forEach((m) => document.querySelector(`.fortes [data-m="${m}"]`).click()); (a.fracos || []).forEach((m) => document.querySelector(`.fracos [data-m="${m}"]`).click());
      if (a.mais !== undefined) por(document.querySelector('#sz-mais'), a.mais); if (a.menos !== undefined) por(document.querySelector('#sz-menos'), a.menos); }
    if (a.tipo === 'parcelas') { const e = document.querySelector('#p-entrada'); if (e) por(e, a.entrada); por(document.querySelector('#p-n'), a.n); }
    if (a.tipo === 'NS') { if (document.querySelector('#ns')) { document.querySelector('#ns').click(); return; } clicar('Não sei'); }
    else if (a.tipo === 'opcao') { clicar(a.v); if (a.detalhe !== undefined) por(document.querySelector('#detalhe'), a.detalhe); }
    else if (a.tipo === 'multi') a.vs.forEach(clicar);
    else if (a.tipo === 'texto') por(document.querySelector('#ent input, #ent textarea'), a.v);
    /* 'manter': só toca Continuar (resposta pré-preenchida pela herança); semOk: só responde, sem tocar Continuar */
    if (!a.semOk) document.querySelector('#ok').click();
  },
  /* lote 17/11: nenhum passo extra depois do Continuar */
  passoExtra: () => [...document.querySelectorAll('button, a')].filter((b) => /^(Seguir|Corrigir minha resposta)$/.test(b.textContent.trim())).map((b) => b.textContent.trim()),
  contador: () => { const k = document.querySelector('.cartao-q[data-cod]') && document.querySelector('.passo'); const m = k && /Pergunta (\d+) de (\d+)/.exec(k.textContent);
    const b = document.querySelector('.heroi-prog [role="progressbar"]'); return m ? { n: +m[1], de: +m[2], pct: b ? +b.getAttribute('aria-valuenow') : null } : null; },
  retorno: () => (document.querySelector('#retorno') || {}).innerText || '',
};

(async () => {
  await new Promise((r) => servidor.listen(0, '127.0.0.1', r));
  const URL = `http://127.0.0.1:${servidor.address().port}/index.html`;
  const browser = await chromium.launch();
  const contexto = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await contexto.newPage();
  const errosJS = [];
  page.on('pageerror', (e) => errosJS.push(e.message));
  page.on('dialog', (d) => d.accept());
  /* resultado leve: caixa, lista de compras e detalhes ficam em <details> fechados; abre para editar */
  const abrirResultado = () => page.evaluate(() => document.querySelectorAll('details.resultado-mais').forEach((d) => { d.open = true; }));
  /* data fixa: a semana 1 do caixa começa "hoje" = 16/11/2026 (época do ano conferida à mão) */
  await page.clock.setFixedTime(new Date('2026-11-16T10:00:00'));
  await page.goto(URL);
  const D = await page.evaluate(() => window.MODULO6);
  const ordem = await page.evaluate(() => Motor.montar(window.MODULO6).perguntas.map((p) => ({ codigo: p.codigo, campo: Motor.campo(p), opcoes: p.opcoesLista, condicao: p.condicao })));
  const Q = Object.fromEntries(ordem.map((p) => [p.codigo, p]));
  const P = D.perguntas.filter((p) => p.codigo), R = D.regras.filter((r) => r.codigo);
  const telasComRafael = [], telasComCodigo = [], telasComVariosAlertas = [], telasComModulo = [];
  const passosExtras = [], doisToques = [], contadorRuim = [], continuarInativo = [];
  let porTela = null;      // gancho opcional rodado em cada pergunta do caminho (teste do Continuar à vista)

  /* ---------- dados ---------- */
  const dadosTxt = fs.readFileSync(path.join(DIR, 'dados/modulo6.js'), 'utf8');
  check('dados/modulo6.js sem "Rafael" (grep -ci = 0)', (dadosTxt.match(/rafael/gi) || []).length === 0);
  check('18 perguntas e 70 regras carregadas da planilha v0.2', P.length === 18 && R.length === 70, [P.length, R.length]);
  if (P.length !== 21) divergencias.push(`Capa C31 diz 21 perguntas; a aba 3 tem ${P.length}`);
  if (R.length !== 73) divergencias.push(`Capa C33 diz 73 regras; a aba 4 tem ${R.length}`);
  check('chave da turma mantida (lg2-turma-b-m06)', fs.readFileSync(path.join(DIR, 'js/app.js'), 'utf8').includes(`const CHAVE = "${CHAVE}"`));
  check('versão exibida = Capa literal', D.modulo.versao === 'v0.1' && D.modulo.data === '25/09/2026', D.modulo);
  const dadosQ = Object.fromEntries(D.perguntas.filter((q) => q.codigo).map((q) => [q.codigo, q]));
  check('passada geral: ajuda de P01/P02/P03/P09 usa palavras simples, unidade e exemplos concretos', /Ex.:/.test(dadosQ['M6.P01'].exemplo) && /em reais/.test(dadosQ['M6.P02'].ajuda) && /à vista.*parcelas/.test(dadosQ['M6.P03'].ajuda) && /a cada 3 meses/.test(dadosQ['M6.P09'].ajuda));
  check('título em palavras simples e “capital de giro” explicado na capa', /^Dinheiro para começar/i.test(D.modulo.nome) && !/capital de giro/i.test(D.modulo.nome) && /capital de giro/i.test(D.capa.frase) && /dinheiro para pagar contas/i.test(D.capa.frase));

  /* ---------- condutor de caminhos ---------- */
  const SECAO_NEGOCIO = {};   // código da pergunta -> valor de "Negócio" que a mostra
  { let sec = null; const negPorSec = {};
    D.perguntas.forEach((p) => { if (p.secao) sec = p.secao; else { const m = /^Negócio\s*=\s*(.+)$/.exec(p.condicao || ''); if (m) negPorSec[sec] = m[1].trim(); } });
    sec = null; D.perguntas.forEach((p) => { if (p.secao) sec = p.secao; else if (negPorSec[sec]) SECAO_NEGOCIO[p.codigo] = negPorSec[sec]; }); }
  const neutro = (cod, alvo) => {
    const q = Q[cod];
    if (cod === 'Negócio') return { tipo: 'opcao', v: SECAO_NEGOCIO[alvo] || q.opcoes[0] };
    if (q.campo === 'parcelas') return { tipo: 'parcelas', entrada: '100', n: '2' };
    if (q.campo === 'formas') return { tipo: 'formas' };
    if (q.campo === 'sazonal') return { tipo: 'saz', v: 'Não' };
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
    /* BRIEF E: a jornada chama de Etapa; nenhum "Módulo" no texto visível */
    const mod = corpo.match(/.{0,30}\bm[óo]dulos?\b.{0,20}/i);
    if (mod) telasComModulo.push(`${rotulo}: ${mod[0]}`);
    const extra = await page.evaluate(NA_PAGINA.passoExtra);
    if (extra.length) passosExtras.push(`${rotulo}: ${extra.join(', ')}`);
  }
  /* BRIEF G: total estável = caminho mais longo possível (lido do app; conferido contra um caminho real mais abaixo) */
  const TOTAL_ESPERADO = 15;
  /* começa do zero; responde até chegar em `alvo` (ou ao resultado), usando `resp` ou valores neutros */
  async function caminho(resp, alvo, semente) {
    await page.evaluate((s) => { localStorage.clear(); Object.entries(s || {}).forEach(([k, v]) => localStorage.setItem(k, JSON.stringify(v))); }, semente || null);
    await page.reload();
    await page.click('#ir');
    const vistas = [], textos = [];
    let pctAntes = -1;
    for (let i = 0; i < 40; i++) {
      const cod = await page.evaluate(NA_PAGINA.atual);
      if (cod === 'RESULTADO' || cod === alvo) return { cod, vistas, textos };
      vistas.push(cod);
      /* BRIEF G: "Pergunta N de M" = posição no caminho, total estável, barra só anda para a frente */
      const k = await page.evaluate(NA_PAGINA.contador);
      if (!k || k.n !== vistas.length || k.de !== TOTAL_ESPERADO || k.pct < pctAntes) contadorRuim.push(`${cod}: ${JSON.stringify(k)} (esperado ${vistas.length} de ${TOTAL_ESPERADO}, barra ≥ ${pctAntes})`);
      pctAntes = k ? k.pct : pctAntes;
      if (porTela) await porTela(cod);
      await page.evaluate(NA_PAGINA.agir, { ...(resp[cod] || neutro(cod, alvo)), semOk: true });
      textos.push(await page.evaluate(NA_PAGINA.retorno));      // retorno ao vivo, antes do Continuar
      if (await page.evaluate(() => document.querySelector('#ok').disabled)) continuarInativo.push(cod);
      await page.evaluate(() => document.querySelector('#ok').click());
      /* aviso que não trava (valor alto ou diferente do outro módulo): o 2º Continuar segue */
      let toques = 1;
      if (await page.evaluate(() => { const e = document.querySelector('#erro'); return e && !e.hidden && e.classList.contains('aviso'); })) { await page.evaluate(() => document.querySelector('#ok').click()); toques++; }
      const depois = await page.evaluate(NA_PAGINA.atual);
      await olharRafael(`${cod} → ${depois}`);
      /* BRIEF A: um toque por pergunta (o 2º só no aviso de valor) */
      if (depois === cod) { doisToques.push(`${cod}: não avançou com ${toques} toque(s)`); return { cod, vistas, textos, bloqueado: true }; }
    }
    throw new Error('caminho sem fim');
  }

  /* ---------- 1. todas as regras da aba 4 (lote 16/11) ----------
     - regras de "Não sei" não disparam mais: o "Não sei" só mostra a ajuda e não grava (testado na seção do "Não sei");
     - regras de resposta vazia/negativa/inválida citavam o "Não sei": viraram mensagem simples, sem gravar nem avançar;
     - P10/P11/P13/P14 só apareciam com P01 = "Não sei": agora a P01 sempre tem resposta e elas não aparecem (relatado). */
  const LEITURA_OPCAO = { 'De 8 a 30 dias': '8 a 30 dias' };
  const ehNS = (c) => /Não sei|sem outras op|junto com outras op/i.test(c);
  const ehVazia = (c) => /^Resposta vazia|^Nenhuma resposta/i.test(c);
  function acaoDaRegra(r) {
    const c = r.condicao.trim(), q = Q[r.pergunta];
    if (/^Uma ou mais/i.test(c)) return { tipo: 'multi', vs: [q.opcoes[0], q.opcoes[1]] };
    if (/^Sim, com detalhes/i.test(c)) return { tipo: 'opcao', v: 'Sim', detalhe: 'Aluguel pago a cada 60 dias' };
    if (/^Sim, sem detalhes/i.test(c)) return { tipo: 'opcao', v: 'Sim', detalhe: '', para: true };
    if (/maior que zero/i.test(c)) return { tipo: 'texto', v: '1500' };
    if (/igual a zero/i.test(c)) return { tipo: 'texto', v: '0' };
    if (/v[aá]lidos informados/i.test(c)) return { tipo: 'texto', v: '2000' };
    if (/^Resposta preenchida|^Lista de .+ informada/i.test(c)) return { tipo: 'texto', v: 'Balcão, freezer e estoque inicial' };
    return { tipo: 'opcao', v: LEITURA_OPCAO[c] || c.trim() };
  }
  const REPETE_P01 = ['M6.P10', 'M6.P11', 'M6.P13', 'M6.P14'];
  const JUNTAS = { 'M6.R18': ['M6.R17'] };
  const alcancadas = [], faltando = [], semNS = [], vazias = [];
  for (const r of R) {
    if (REPETE_P01.includes(r.pergunta)) { divergencias.push(`${r.codigo}: ${r.pergunta} só aparecia com P01 = "Não sei"; agora não aparece`); continue; }
    if (r.pergunta === 'M6.P08') { divergencias.push(`${r.codigo}: o prazo único (P08) virou prazo por forma de pagamento (taxa, dias e parte); a regra não aparece mais`); continue; }
    if (ehNS(r.condicao)) { semNS.push(r.codigo); continue; }
    const c = await caminho({}, r.pergunta);
    if (c.cod !== r.pergunta) { faltando.push(`${r.codigo} (pergunta ${r.pergunta} não apareceu)`); continue; }
    if (ehVazia(r.condicao)) {
      await page.evaluate(() => document.querySelector('#ok').click());
      const e = nrm(await page.evaluate(() => { const x = document.querySelector('#erro'); return x && !x.hidden ? x.textContent : ''; }));
      const ok = /para continuar\.$/.test(e) && !/Não sei/.test(e) && (await page.evaluate(NA_PAGINA.atual)) === r.pergunta
        && !(await page.evaluate((cd) => (JSON.parse(localStorage.getItem('lg2-turma-b-m06')) || { R: {} }).R[cd], r.pergunta))
        && !(await page.$('#retorno .regra'));
      (ok ? vazias : faltando).push(ok ? r.codigo : `${r.codigo} (vazia) -> "${e}"`);
      continue;
    }
    const a = acaoDaRegra(r);
    /* lote 17/11: o retorno aparece ao vivo, logo abaixo da resposta, ANTES do Continuar */
    await page.evaluate(NA_PAGINA.agir, { ...a, semOk: true });
    const txt = nrm(await page.evaluate(NA_PAGINA.retorno));
    await olharRafael(r.codigo);
    const mostradas = (await page.$$eval('#retorno .regra .r-texto', (x) => x.map((e) => e.textContent))).map(nrm).sort();
    const esperadas = [r.codigo, ...(JUNTAS[r.codigo] || [])].map((c) => nrm(R.find((x) => x.codigo === c).texto)).sort();
    /* BRIEF G: alerta de risco que depende da resposta fica no retorno (tom de aviso); os outros estão na "Ver dica", não no retorno */
    const dicaTxt = nrm(await page.evaluate(() => (document.querySelector('#ver-dica') || {}).textContent || ''));
    const risco = await page.evaluate((c) => Motor.ehRisco({ codigo: c }), r.codigo);
    const okAlerta = !r.alerta || r.alerta === 'Nenhum' || (risco ? txt.includes(nrm(r.alerta)) : !txt.includes(nrm(r.alerta)) && dicaTxt.includes(nrm(r.alerta)));
    const qAlerta = nrm(P.find((x) => x.codigo === r.pergunta).alerta);
    /* um toque: Continuar grava e abre a próxima; só a regra "Retornar à" (resposta incompleta) segura na pergunta */
    await page.evaluate(() => document.querySelector('#ok').click());
    if (await page.evaluate(() => { const e = document.querySelector('#erro'); return e && !e.hidden && e.classList.contains('aviso'); })) await page.evaluate(() => document.querySelector('#ok').click());
    const agora = await page.evaluate(NA_PAGINA.atual);
    const ok = JSON.stringify(mostradas) === JSON.stringify(esperadas) && txt.includes(nrm(r.texto)) && okAlerta && (!qAlerta || (!txt.includes(qAlerta) && dicaTxt.includes(qAlerta))) && (a.para ? agora === r.pergunta : agora !== r.pergunta)
      && !(/^Retornar à /.test(r.encaminhamento || '') && txt.includes(nrm(r.encaminhamento)));
    (ok ? alcancadas : faltando).push(ok ? r.codigo : `${r.codigo} (${r.condicao}) -> ${txt.slice(0, 120)}`);
  }
  console.log(`INFO regras alcançadas: ${alcancadas.length}; vazias -> mensagem simples: ${vazias.length}; de "Não sei" (não disparam mais): ${semNS.length}; fora do caminho: ${R.length - alcancadas.length - vazias.length - semNS.length - faltando.length}`);
  check(`regras da aba 4: respostas reais alcançadas, vazias com mensagem simples (${alcancadas.length} + ${vazias.length})`, faltando.length === 0 && alcancadas.length >= 20, faltando);

  /* valores negativos e inválidos: mensagem simples, não grava, não avança */
  for (const [cod, v, msg] of [['M6.P02', '-5', 'O valor não pode ser negativo.'], ['M6.P02', 'abc', 'Digite só números. Ex.: 12,50'], ['M6.P05', '-1', 'O valor não pode ser negativo.'], ['M6.P07', 'xyz', 'Digite só números. Ex.: 12,50']]) {
    await caminho({}, cod);
    await page.evaluate(NA_PAGINA.agir, { tipo: 'texto', v });
    check(`${cod} = "${v}": "${msg}" e não avança`, nrm(await page.textContent('#erro')) === msg && (await page.evaluate(NA_PAGINA.atual)) === cod
      && !(await page.evaluate((c) => JSON.parse(localStorage.getItem('lg2-turma-b-m06')).R[c], cod)));
  }
  /* condições F */
  { const c = await caminho({ 'M6.P01': { tipo: 'texto', v: 'nada por enquanto' } }, null);
    check('P01 sem compras esconde P02/P03; Negócio = Serviço mostra só P12 (P10/P11 repetem P01/P02)', !c.vistas.includes('M6.P02') && !c.vistas.includes('M6.P03')
      && JSON.stringify(c.vistas.slice(c.vistas.indexOf('Negócio') + 1)) === JSON.stringify(['M6.P12']), c.vistas); }
  { const c = await caminho({ 'Negócio': { tipo: 'opcao', v: 'Mercadoria' } }, null);
    check('Negócio = Mercadoria: P16, P17 e P18', ['M6.P16', 'M6.P17', 'M6.P18'].every((x) => c.vistas.includes(x)), c.vistas); }
  { const c = await caminho({ 'Negócio': { tipo: 'opcao', v: 'Produto' } }, null);
    check('Negócio = Produto: P15 aparece, P13/P14 (repetem P01/P02) não', c.vistas.includes('M6.P15') && !c.vistas.includes('M6.P14') && !c.vistas.includes('M6.P13') && !c.vistas.includes('M6.P10'), c.vistas); }
  { const c1 = await caminho({ 'M6.P03': { tipo: 'opcao', v: 'À vista' } }, null);
    const c2 = await caminho({ 'M6.P03': { tipo: 'opcao', v: 'Parcelado' } }, null);
    check('parcelas (pergunta nova) só para "Parcelado" / "Parte à vista e parte parcelado"', !c1.vistas.includes('M6.P03A') && c2.vistas.includes('M6.P03A'), [c1.vistas, c2.vistas]);
    const c3 = await caminho({}, null);
    check('P04 tem as mesmas opções do Módulo 5; depois dela vem taxa/prazo/parte por forma (M6.PF); o prazo único (P08) não aparece mais',
      JSON.stringify(Q['M6.P04'].opcoes) === JSON.stringify(['Pix', 'Dinheiro', 'Cartão de débito', 'Cartão de crédito', 'Outra forma']) && c3.vistas.indexOf('M6.PF') === c3.vistas.indexOf('M6.P04') + 1 && !c3.vistas.includes('M6.P08'), c3.vistas); }

  /* ---------- 2. casos de teste da aba 8 ---------- */
  for (const caso of D.casos) {
    const resp = {}, nota = [];
    for (const par of caso.respostas.split(';')) {
      const m = /^\s*(M6\.P\d{2})\s*=\s*(.+?)\s*$/.exec(par);
      if (!m) continue;
      const [, cod, v] = m, q = Q[cod];
      if (v === 'Não sei') { nota.push(`${cod} = "Não sei" não grava mais (lote 16/11): respondido com valor neutro`); continue; }
      if (q.campo === 'numero') { if (/^(R\$\s*)?-?[\d.,]+$/.test(v)) resp[cod] = { tipo: 'texto', v }; else nota.push(`${cod} = "${v}" não é número na v0.2`); }
      else if (q.campo === 'texto') resp[cod] = { tipo: 'texto', v };
      else if ((q.opcoes || []).includes(v)) resp[cod] = q.campo === 'multi' ? { tipo: 'multi', vs: [v] } : { tipo: 'opcao', v };
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
       caixa hoje R$ 2.000; investimento R$ 1.500 (sai na semana 1); vendas R$ 1.000/mês no cartão de débito, sem taxa, caindo em 7 dias (1 semana depois);
       gastos de todo mês "Aluguel 300, luz 90" = R$ 390/mês.
       vendas por semana = 1.000 × 12 ÷ 52 = 230,769… → R$ 230,77 (entram a partir da semana 2);
       gastos por semana = 390 × 12 ÷ 52 = R$ 90,00 (toda semana).
       semana 1: 2.000 + 0 − (1.500 + 90) = R$ 410,00
       semana 2: 410 + 230,77 − 90 = R$ 550,77
       semana 13: 410 + 12 × (230,77 − 90) = 410 + 12 × 140,77 = 410 + 1.689,24 = R$ 2.099,24
       controle do período: entradas 12 × 230,77 = 2.769,24; saídas 1.590 + 12 × 90 = 2.670,00; saldo 2.000 + 2.769,24 − 2.670 = 2.099,24 */
    await caminho({ 'M6.P02': { tipo: 'texto', v: '1500' }, 'M6.P04': { tipo: 'multi', vs: ['Cartão de débito'] }, 'M6.PF': { tipo: 'formas', vals: { 'Cartão de débito': ['0', '7'] } },
      'M6.P05': { tipo: 'texto', v: '1000' }, 'M6.P06': { tipo: 'texto', v: 'Aluguel 300, luz 90' }, 'M6.P07': { tipo: 'texto', v: '2000' } }, null);
    const linhas = await page.$$eval('.fluxo tbody tr', (tr) => tr.map((r) => ({ e: r.querySelector('[data-k="entradas"]').value, s: r.querySelector('[data-k="saidas"]').value, sf: r.querySelector('.sf').textContent.replace(/\s+/g, ' ').trim() })));
    check('I04: 13 semanas, cada uma com Entradas, Saídas e Saldo preenchidos', linhas.length === 13 && linhas.every((l) => l.e !== '' && l.s !== '' && l.sf !== ''), linhas.slice(0, 3));
    check('I04 conferido à mão: semana 1 = entradas 0,00 · saídas 1.590,00 · saldo R$ 410,00', linhas[0].e === '0,00' && linhas[0].s === '1.590,00' && linhas[0].sf === nrm(brl(410)), linhas[0]);
    check('I04 conferido à mão: semana 2 = entradas 230,77 · saídas 90,00 · saldo R$ 550,77', linhas[1].e === '230,77' && linhas[1].s === '90,00' && linhas[1].sf === nrm(brl(550.77)), linhas[1]);
    check('I04 conferido à mão: semana 13 = saldo R$ 2.099,24', linhas[12].sf === nrm(brl(2099.24)), linhas[12]);
    check('I04: o saldo muda toda semana (não fica parado da semana 3 em diante)', new Set(linhas.map((l) => l.sf)).size === 13, linhas.map((l) => l.sf));
    const como = nrm(await page.textContent('#como-conta'));
    check('I04 explica a conta: vendas e gastos do mês por semana (× 12 ÷ 52), recebimento a partir da semana 2, investimento na semana 1',
      como.includes('Vendas: R$ 1.000,00 por mês × 12 ÷ 52 = R$ 230,77 por semana.') && como.includes('Cartão de débito: R$ 230,77 por semana = R$ 230,77; cai 1 semana depois (7 dias ÷ 7, arredondado para cima)') && como.includes('R$ 390,00 × 12 ÷ 52 = R$ 90,00 por semana') && como.includes('(R$ 1.500,00) sai na semana 1'), como);
    const t = nrm(await page.textContent('#i03'));
    check('I03 na tela (13 semanas): entradas R$ 2.769,24, saídas R$ 2.670,00, saldo R$ 2.099,24', ['Entradas' + brl(2769.24), 'Saídas' + brl(2670), 'Saldo' + brl(2099.24)].every((x) => t.replace(/\s/g, '').includes(x.replace(/\s/g, ''))), t);
    /* editar uma semana recalcula e passa o saldo adiante (a tabela fica em "Ver o caixa das 13 semanas", fechado) */
    await abrirResultado();
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
    check('faixa "Seu negócio: Serviço" + selo "Veio da Etapa 1" + Trocar', /Seu negócio: Serviço/.test(fx) && fx.includes('Veio da Etapa 1') && fx.includes('Trocar'), fx);
    await page.click('#trocar');
    check('Trocar abre o seletor com Serviço marcado', (await page.evaluate(NA_PAGINA.atual)) === 'Negócio'
      && (await page.$$eval('#ent .opcao.sel b', (b) => b.map((x) => x.textContent))).join() === 'Serviço');
    await page.evaluate(NA_PAGINA.agir, { tipo: 'opcao', v: 'Mercadoria' });
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
  /* BRIEF F (nenhuma pergunta repetida): com a resposta do Módulo 5, P04/P05/P06 não aparecem; ficam num cartão "Veio da Etapa 5 · Trocar" */
  { const c = await caminho({}, null, semM5);
    check('F: com o Módulo 5 respondido, formas de pagamento, vendas do mês e gastos fixos não aparecem de novo', !['M6.P04', 'M6.P05', 'M6.P06'].some((x) => c.vistas.includes(x)) && c.vistas.includes('M6.P07'), c.vistas);
    const R6 = await page.evaluate(() => JSON.parse(localStorage.getItem('lg2-turma-b-m06')).R);
    check('F: respostas reaproveitadas gravadas no formato de sempre, com a origem (Módulo 5)',
      R6['M6.P04'] && R6['M6.P04'].estado === 'multi' && R6['M6.P04'].opcoes.join('|') === 'Pix|Dinheiro|Cartão de crédito' && R6['M6.P04'].herdado === 5
      && R6['M6.P05'].valor === '1.000,00' && R6['M6.P05'].herdado === 5 && R6['M6.P06'].valor === 'Aluguel: R$ 800,00; Água e luz: R$ 150,00; Internet: R$ 100,00' && R6['M6.P06'].herdado === 5, R6);
    await abrirResultado();
    const hr = nrm(await page.evaluate(() => (document.querySelector('#herdadas-res') || {}).innerText || ''));
    check('F: resultado lista as respostas que vieram de outros módulos, cada uma com "Trocar"', hr.includes('Veio da Etapa 5') && /vender por mês: R\$ 1\.000,00/.test(hr)
      && (await page.$$('#herdadas-res [data-trocar]')).length === 3, hr); }
  { await caminho({}, 'M6.PF', semM5);
    const c0 = nrm(await page.evaluate(() => (document.querySelector('#herdadas') || {}).textContent || ''));
    check('F: a tela seguinte mostra o cartão pequeno com a resposta reaproveitada e "Trocar"', c0.startsWith('Já respondido antes') && c0.includes('Veio da Etapa 5') && c0.includes('Como seus clientes vão pagar: Pix, Dinheiro, Cartão de crédito') && c0.includes('Trocar'), c0);
    await caminho({}, 'M6.SZ', semM5);
    const card = nrm(await page.evaluate(() => (document.querySelector('#herdadas') || {}).textContent || ''));
    check('F: vendas do mês (Módulo 5) no cartão da tela seguinte', card.includes('Quanto espera vender por mês: R$ 1.000,00'), card);
    await page.evaluate(() => { document.querySelector('#herdadas').open = true; document.querySelector('[data-trocar="M6.P05"]').click(); });
    const x = await tela();
    check('F: "Trocar" abre a pergunta com o valor de antes no campo', (await page.evaluate(NA_PAGINA.atual)) === 'M6.P05' && x.campo === '1.000,00', x);
    /* divergência: valor diferente do Módulo 5 avisa uma vez e segue no 2º Continuar */
    await page.evaluate(NA_PAGINA.agir, { tipo: 'texto', v: '1.200,00' });
    const av = nrm(await page.textContent('#erro'));
    await page.evaluate(() => document.querySelector('#ok').click());
    const r5 = await page.evaluate(() => JSON.parse(localStorage.getItem('lg2-turma-b-m06')).R['M6.P05']);
    check('valor diferente da Etapa 5: avisa ("Na Etapa 5, esse valor era R$ 1.000,00") e o 2º Continuar grava sem a origem',
      av.includes('Na Etapa 5, esse valor era R$ 1.000,00') && r5 && r5.valor === '1.200,00' && !r5.herdado, { av, r5 });
    check('depois de trocar, segue para a pergunta seguinte que ainda não foi respondida', (await page.evaluate(NA_PAGINA.atual)) === 'M6.SZ'); }
  { const s2 = { 'lg2-turma-a-m05': { versao: 3, R: { ...M5.R, 'M5.P36': { estado: 'naosei' } } } };
    await caminho({}, 'M6.P05', s2); const x = await tela();
    check('"Não sei" no Módulo 5 não conta como resposta anterior (P05 aparece vazia, sem selo)', x.campo === '' && !x.selo, x); }
  { const m1 = { 'lg2-turma-a-m01': M1({ 'M1.P07': { estado: 'opcao', opcao: 'Entre R$ 500 e R$ 1.000' } }) };
    const c = await caminho({}, null, m1);
    const r7 = await page.evaluate(() => JSON.parse(localStorage.getItem('lg2-turma-b-m06')).R['M6.P07']);
    check('F: dinheiro para usar (P07) vem do Módulo 1 ("Entre R$ 500 e R$ 1.000" = R$ 500,00, o menor da faixa) sem tela', !c.vistas.includes('M6.P07') && r7 && r7.valor === '500,00' && r7.herdado === 1, { v: c.vistas, r7 }); }
  { const c = await caminho({ 'Negócio': { tipo: 'opcao', v: 'Produto' } }, null, { 'lg2-turma-a-m04': { R: { 'M4.P03': { estado: 'valor', valor: 'farinha, ovos' } } } });
    const r15 = await page.evaluate(() => JSON.parse(localStorage.getItem('lg2-turma-b-m06')).R['M6.P15']);
    check('F: materiais para produzir (P15) vêm do Módulo 4 sem tela', !c.vistas.includes('M6.P15') && r15 && r15.valor === 'farinha, ovos' && r15.herdado === 4, { v: c.vistas, r15 }); }
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
    const principal = await page.evaluate(() => { const x = document.querySelector('#conclusao-principal'); return x && { txt: x.innerText, valor: x.querySelector('.val')?.textContent.trim(), antes: !!(x.compareDocumentPosition(document.querySelector('#proximos')) & Node.DOCUMENT_POSITION_FOLLOWING), sec: x.closest('main')?.querySelector('.concluido')?.compareDocumentPosition(x) }; });
    check('passada geral: primeira conclusão financeira vem antes das listas, informa falta/sobra e valor em reais', principal && principal.antes && /Falta dinheiro nos primeiros meses|O dinheiro dá para os primeiros meses/i.test(principal.txt) && /^R\$ [0-9.]+,[0-9]{2}$/.test(principal.valor), principal);
    check('caixa: parágrafos por assunto (negócio · gasto e vendas · caixa nas 13 semanas)', box && box.n === 3 && box.p[0].startsWith('Você oferece') && /Para começar/.test(box.p[1]) && /semana/.test(box.p[2]), box && box.p);
    check('caixa junta módulos anteriores e este (ideia, tipo, estágio, investimento, vendas, semana negativa)',
      bt.includes('Você oferece um serviço: Lavagem de carro em domicílio.') && bt.includes('Você ainda não começou a vender.')
      && bt.includes('Para começar, você estima gastar R$ 3.000,00, pagando à vista.') && bt.includes('Você espera vender cerca de R$ 1.000,00 por mês')
      && bt.includes('Começando com R$ 500,00 no caixa, o seu dinheiro fica negativo na semana 1'), bt);
    check('BRIEF I: "Ver suas respostas" vem aberto no resultado', await page.evaluate(() => { const d = document.querySelector('details.respostas'); return !!d && d.open && /Ver suas respostas/.test(d.querySelector('summary').textContent); }));
    const resumo = nrm(await page.evaluate(() => document.querySelector('details.respostas').textContent));
    check('resumo mostra o selo "Veio da Etapa 5" nas respostas herdadas e "Veio da Etapa 1" no tipo', /Veio da Etapa 5 Pix; Dinheiro/.test(resumo) && /Veio da Etapa 1 Serviço/.test(resumo), resumo.slice(0, 500)); }

  /* ---------- 7. relatório 05/11: próximos passos, encaminhamentos, alertas, Módulo 1, campos numéricos, teclado ---------- */
  { const c = await caminho({ 'M6.P01': { tipo: 'texto', v: 'Forno' }, 'M6.P02': { tipo: 'texto', v: '3000' }, 'M6.P07': { tipo: 'texto', v: '0' },
      'Negócio': { tipo: 'opcao', v: 'Mercadoria' }, 'M6.P16': { tipo: 'texto', v: 'Potes' }, 'M6.P17': { tipo: 'texto', v: '1000' } }, null);
    const corpo = await page.evaluate(() => document.body.innerText);
    check('resultado sem códigos internos (P02, "Preencher P17", "na P08")', !/\b(M\d+\.)?P\d{2}\b/.test(corpo), (corpo.match(/.{30}\bP\d{2}\b.{10}/) || [])[0]);
    const enc = await page.$$eval('.b-enc li', (l) => l.map((x) => x.textContent.trim()));
    check('encaminhamentos sem repetição ("Estimativa do investimento" aparece uma vez só)', enc.filter((x) => /^Estimativa do investimento/.test(x)).length === 1 && new Set(enc).size === enc.length, enc);
    const ale = nrm(await page.evaluate(() => (document.querySelector('#atencao') || {}).innerText || ''));
    await olharRafael('RESULTADO com alertas');
    const dic = await page.$$eval('#dicas li', (l) => l.map((x) => x.textContent.trim()));
    const r25 = R.find((x) => x.codigo === 'M6.R25');
    check('alerta que depende da resposta fica em "Atenção, pelas suas respostas" (caixa = 0)', !r25.alerta || r25.alerta === 'Nenhum' || ale.includes(nrm(r25.alerta)), { ale, a: r25.alerta });
    check('alertas genéricos saem dos alertas e vão para "Dicas gerais" (no máximo 4)', !ale.includes('O valor pode mudar após consultar preços e fornecedores.')
      && dic.length >= 1 && dic.length <= 4 && dic.every((d) => !ale.includes(nrm(d))), { ale, dic });
    await caminho({ 'M6.P01': { tipo: 'texto', v: 'Forno' }, 'M6.P02': { tipo: 'texto', v: '3000' } }, null);
    check('nada em aberto: Próximos passos diz isso em vez de listar perguntas já respondidas', /Nada ficou em aberto/.test(await page.textContent('#proximos')) && !(await page.$('#proximos li'))); }
  { const m1 = (op) => ({ 'lg2-turma-a-m01': M1({ 'M1.P07': { estado: 'opcao', opcao: op } }) });
    const resp = { 'M6.P01': { tipo: 'texto', v: 'Potes e forno' }, 'M6.P02': { tipo: 'texto', v: '3000' } };
    await caminho(resp, null, m1('Até R$ 100'));
    const av = nrm(await page.evaluate(() => (document.querySelector('#aviso-m1') || {}).innerText || ''));
    check('investimento R$ 3.000 acima de "Até R$ 100" (Módulo 1): aviso no resultado citando o Módulo 1', av.includes('Veio da Etapa 1') && av.includes('“Até R$ 100”') && av.includes('R$ 3.000,00'), av);
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
    check('valor alto (R$ 60.000) avisa sem travar: 1º Continuar avisa, 2º com o mesmo valor grava e segue', inp === 'decimal' && /parece alto/.test(aviso1) && !gravou1 && gravou2
      && (await page.evaluate(NA_PAGINA.atual)) !== 'M6.P02', { inp, aviso1, gravou1, gravou2 }); }
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
      R: { 'M6.P01': { estado: 'valor', valor: 'Potes' }, 'M6.P02': { estado: 'valor', valor: '1500' }, 'M6.P03': { estado: 'opcao', opcao: 'À vista' }, 'M6.P04': { estado: 'multi', opcoes: ['Pix'] },
        'M6.PF': { estado: 'valor', valor: [{ forma: 'Pix', taxa: '0', prazo: '0', parte: '100' }] }, 'M6.P05': { estado: 'valor', valor: '1000' }, 'M6.SZ': { estado: 'opcao', opcao: 'Não, é parecido o ano todo' },
        'M6.P06': { estado: 'valor', valor: 'nada' }, 'M6.P07': { estado: 'valor', valor: '2000' }, 'M6.P09': { estado: 'opcao', opcao: 'Não' }, 'Negócio': { estado: 'opcao', opcao: 'Serviço' }, 'M6.P12': { estado: 'opcao', opcao: 'Não' } },
      hist: ['M6.P01', 'RESULTADO'], prio: {}, cen: null,
      fluxo: { saldoInicial: 2000, semanas: [{ entradas: 1000, saidas: 1500 }, ...Array.from({ length: 12 }, () => ({ entradas: 0, saidas: 0 }))], semanaPagamento: 1, semanaRecebimento: 1 } })); });
    await page.reload(); await page.click('#ir');
    const sf = await page.$$eval('.fluxo .sf', (x) => x.map((e) => e.textContent.replace(/\s+/g, ' ').trim()));
    // 2.000 − 1.500 + 230,77 por semana desde a semana 1 (Pix, na hora) = 730,77 … 500 + 13 × 230,77 = 3.500,01
    check('fluxo salvo na versão antiga é refeito com as respostas (semana 1 = R$ 730,77; semana 13 = R$ 3.500,01)', sf[0] === nrm(brl(730.77)) && sf[12] === nrm(brl(3500.01)), sf); }
  { // estado real do aplicativo (mesmo formato, valores inventados): sem versão; P04 com as opções antigas; P05/P06 vindas do Módulo 5
    const M5real = { versao: 3, R: { 'M5.PG': { estado: 'valor', valor: ['Pix', 'Dinheiro', 'Cartão de débito', 'Cartão de crédito'] }, 'M5.P24': { estado: 'opcao', opcao: 'Sim' },
      'M5.P25': { estado: 'valor', valor: [{ forma: 'Pix', taxa: '0', prazo: '0', parte: '30' }, { forma: 'Dinheiro', taxa: '0', prazo: '0', parte: '10' }, { forma: 'Cartão de débito', taxa: '1,5', prazo: '1', parte: '30' }, { forma: 'Cartão de crédito', taxa: '3', prazo: '30', parte: '30' }] } } };
    const antigo = { dados: '2026-10-15', R: { 'Negócio': { estado: 'opcao', opcao: 'Produto', herdado: 1 }, 'M6.P01': { estado: 'valor', valor: 'Forno' }, 'M6.P02': { estado: 'valor', valor: '2.000,00' },
      'M6.P03': { estado: 'opcao', opcao: 'Parte à vista e parte parcelado' }, 'M6.P04': { estado: 'multi', opcoes: ['Dinheiro', 'Pix', 'Cartão de débito', 'Cartão de crédito à vista', 'Cartão de crédito parcelado'] },
      'M6.P05': { estado: 'valor', valor: '4.000,00', herdado: 5 }, 'M6.P06': { estado: 'valor', valor: 'Água e luz: R$ 80,00', herdado: 5 }, 'M6.P07': { estado: 'valor', valor: '500' },
      'M6.P08': { estado: 'opcao', opcao: 'Na hora' }, 'M6.P09': { estado: 'opcao', opcao: 'Sim', detalhe: 'Fornecedor a cada 15 dias' }, 'M6.P15': { estado: 'valor', valor: 'farinha', herdado: 5 } },
      hist: ['M6.P01', 'M6.P09', 'M6.P15', 'RESULTADO'], prio: {}, fora: [], fluxo: { saldoInicial: 500, semanas: [] }, cen: { ini: 500, ent: 0, sai: 0 } };
    await page.evaluate(([a, m5]) => { localStorage.clear(); localStorage.setItem('lg2-turma-b-m06', JSON.stringify(a)); localStorage.setItem('lg2-turma-a-m05', JSON.stringify(m5)); }, [antigo, M5real]);
    await page.reload();
    const s = await page.evaluate(() => JSON.parse(localStorage.getItem('lg2-turma-b-m06')));
    check('estado real: respostas mantidas (P05/P06 com a origem, P09 com detalhe, P08 guardada); P04 nas opções do Módulo 5; taxas do Módulo 5 reaproveitadas',
      s.v === 2 && s.R['M6.P05'].valor === '4.000,00' && s.R['M6.P05'].herdado === 5 && s.R['M6.P06'].herdado === 5 && s.R['M6.P09'].detalhe === 'Fornecedor a cada 15 dias' && s.R['M6.P08'].opcao === 'Na hora'
      && JSON.stringify(s.R['M6.P04'].opcoes) === JSON.stringify(['Pix', 'Dinheiro', 'Cartão de débito', 'Cartão de crédito']) && s.R['M6.PF'] && s.R['M6.PF'].herdado === 5 && s.R['M6.PF'].valor.length === 4, s.R);
    await page.click('#ir');
    check('estado real: "Continuar" abre a pergunta nova que falta (parcelas da compra), sem perder nada', (await page.evaluate(NA_PAGINA.atual)) === 'M6.P03A'); }
  /* ---------- 8. novas testadoras: atenção única, prioridade de compras, "Como calculamos" ---------- */
  { // (a) pergunta com regra + alerta da pergunta = um bloco só, sem repetição
    await caminho({}, 'M6.P05');
    await page.evaluate(NA_PAGINA.agir, { tipo: 'texto', v: '0', semOk: true });
    const blocos = await page.$$eval('.b-alerta', (b) => b.map((x) => x.innerText));
    const itensAt = await page.$$eval('.b-alerta li', (l) => l.map((x) => x.textContent.trim()));
    const r18 = nrm(R.find((x) => x.codigo === 'M6.R18').alerta), r17 = nrm(R.find((x) => x.codigo === 'M6.R17').alerta), qa = nrm(P.find((x) => x.codigo === 'M6.P05').alerta);
    check('G: P05 = 0: um único aviso "Fique de olho" só com o risco da resposta (sem vendas); o alerta geral da pergunta e o de "valor informado" ficam na dica',
      blocos.length === 1 && nrm(blocos[0]).includes(r18) && !nrm(blocos[0]).includes(r17) && !nrm(blocos[0]).includes(qa) && /^Fique de olho/i.test(nrm(blocos[0])), { blocos });
    await caminho({}, 'M6.P02'); await page.evaluate(NA_PAGINA.agir, { tipo: 'texto', v: '1500', semOk: true });
    check('G: resposta comum (P02 = 1.500) não abre balão de atenção', !(await page.$('#retorno .b-alerta')));
    // resultado com M1 acima do teto + semana negativa + alertas das respostas: um bloco só
    await caminho({ 'M6.P01': { tipo: 'texto', v: 'Forno' }, 'M6.P02': { tipo: 'texto', v: '3000' }, 'M6.P07': { tipo: 'texto', v: '0' } }, null,
      { 'lg2-turma-a-m01': M1({ 'M1.P07': { estado: 'opcao', opcao: 'Até R$ 100' } }) });
    const nb = await page.$$eval('.b-alerta', (b) => b.length), li = await page.$$eval('#atencao li', (l) => l.map((x) => x.textContent.trim()));
    check('resultado: Módulo 1, semana no vermelho e alertas das respostas no MESMO bloco "Atenção", sem repetição', nb === 1 && li.some((x) => /Veio da Etapa 1/.test(x)) && li.some((x) => /semana 1/.test(x)) && new Set(li).size === li.length, { nb, li }); }
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
    const ret = nrm(await page.evaluate(() => (document.querySelector('#sobre-anterior') || {}).textContent || ''));
    check('o botão grava "sem compras" num toque e pula para as formas de pagamento, com "Sobre a sua resposta anterior" no alto', ret.startsWith('Sobre a sua resposta anterior:') && ret.includes('sem compras para começar agora') && (await page.evaluate(NA_PAGINA.atual)) === 'M6.P04', ret);
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
    await caminho({ 'M6.P02': { tipo: 'texto', v: '1500' }, 'M6.P04': { tipo: 'multi', vs: ['Cartão de débito'] }, 'M6.PF': { tipo: 'formas', vals: { 'Cartão de débito': ['0', '7'] } },
      'M6.P05': { tipo: 'texto', v: '1000' }, 'M6.P06': { tipo: 'texto', v: 'Aluguel 300, luz 90' }, 'M6.P07': { tipo: 'texto', v: '2000' } }, null);
    await abrirResultado();
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
  { // P01 "Não sei" (fundiu "Ainda não sei o que vou precisar comprar"): ajuda + materiais do Módulo 5 como ponto de partida, sem gravar
    await caminho({}, 'M6.P01');
    check('P01: um só "Não sei" (saiu "Ainda não sei o que vou precisar comprar")', !(await page.$('#ainda-nao-sei')) && !!(await page.$('#ns')) && !/Ainda não sei o que vou/.test(await page.textContent('#tela')));
    const M5m = { 'lg2-turma-a-m05': { versao: 3, R: { 'M5.P03': { estado: 'valor', valor: ['farinha', 'leite condensado', 'pote com tampa'] } } } };
    await caminho({}, 'M6.P01', M5m);
    const antes = await page.evaluate(() => localStorage.getItem('lg2-turma-b-m06'));
    await page.click('#ns');
    const pt = nrm(await page.evaluate(() => (document.querySelector('#ajudans #partida-m5') || {}).innerText || ''));
    check('P01 "Não sei" com Módulo 5: a ajuda mostra os materiais de lá como ponto de partida, com selo, e nada é gravado',
      pt.includes('Veio da Etapa 5') && pt.includes('farinha, leite condensado, pote com tampa') && (await page.evaluate(() => localStorage.getItem('lg2-turma-b-m06'))) === antes, pt);
    if (process.env.SHOTS) { await page.evaluate(() => document.querySelector('#ajudans').scrollIntoView()); await page.waitForTimeout(400); await page.screenshot({ path: path.join(process.env.SHOTS, 'm06_depois_ajuda_naosei.png') }); }
    await page.click('#usar-m5');
    check('"Usar essa lista como ponto de partida" põe a lista no campo, com o selo do Módulo 5',
      (await page.inputValue('#ent textarea')) === 'farinha, leite condensado, pote com tampa' && nrm(await page.textContent('.herdado')).includes('Veio da Etapa 5'));
    await page.click('#ok');
    const r1 = await page.evaluate(() => JSON.parse(localStorage.getItem('lg2-turma-b-m06')).R['M6.P01']);
    check('lista de partida confirmada: grava os itens e segue para o valor das compras', r1.estado === 'valor' && (await page.evaluate(NA_PAGINA.atual)) === 'M6.P02', r1);
    check('M5 nunca é escrito pelo M6', !(await page.evaluate(() => localStorage.getItem('lg2-turma-a-m05'))).includes('M6.')); }

  /* ---------- versão leve (nov/2026): capa curta, ≤ 60 palavras por pergunta, "Ver dica" fechada, ajuda no "Não sei" ---------- */
  const palavras = () => page.evaluate(() => { const n = (t) => t.split(/\s+/).filter((w) => /[A-Za-zÀ-ÿ0-9]/.test(w)).length; return n(document.querySelector('#tela').innerText) - [...document.querySelectorAll('.p-linha-integrada, .p-fontes summary')].reduce((a, e) => a + n(e.innerText), 0); });
  { await page.evaluate(() => localStorage.clear()); await page.reload();
    const capa = await page.evaluate(() => ({ tempo: (document.querySelector('.tempo') || {}).textContent || '', cf: document.querySelector('details.como-funciona'),
      fechado: !!document.querySelector('details.como-funciona:not([open])'), tit: document.querySelector('h1').textContent }));
    const n = await palavras();
    check(`capa: título + 1 frase + tempo + Começar; "Como funciona" fechado (${n} palavras ≤ 60)`, n <= 60 && /Esta etapa leva cerca de \d+ minutos/.test(capa.tempo) && capa.fechado
      && (await page.getByRole('button', { name: 'Começar', exact: true }).count()) === 1, { n, capa }); }
  const NEG_DE = { 'M6.P10': 'Serviço', 'M6.P11': 'Serviço', 'M6.P12': 'Serviço', 'M6.P13': 'Produto', 'M6.P14': 'Produto', 'M6.P15': 'Produto', 'M6.P16': 'Mercadoria', 'M6.P17': 'Mercadoria', 'M6.P18': 'Mercadoria' };
  async function abrirDireto(cod) {   // a pergunta como a pessoa a vê ao chegar, sem nada tocado
    await page.evaluate(([c, neg]) => { localStorage.clear(); localStorage.setItem('lg2-turma-b-m06', JSON.stringify({ dados: '2026-10-15',
      R: neg ? { 'Negócio': { estado: 'opcao', opcao: neg }, 'M6.P01': { estado: 'naosei' } } : {}, hist: [c], prio: {}, fora: [], fluxo: null, cen: null })); }, [cod, NEG_DE[cod]]);
    await page.reload(); await page.click('#ir');
  }
  /* BRIEF D (16/11): a P08 ganhou um exemplo curto embaixo de cada prazo (Pix, débito, crédito…): limite 72 só nela */
  const LIMITE_PALAVRAS = { 'M6.P08': 72 };
  { const muitas = [], dicas = [], exemplos = [];
    for (const q of ordem) {
      await abrirDireto(q.codigo);
      if ((await page.evaluate(NA_PAGINA.atual)) !== q.codigo) { muitas.push(`${q.codigo}: não abriu`); continue; }
      const n = await palavras();
      if (n > (LIMITE_PALAVRAS[q.codigo] || 60)) muitas.push(`${q.codigo}: ${n}`);
      const d = await page.evaluate(() => { const v = document.querySelector('details#ver-dica'), h = document.querySelector('h2.q'), e = document.querySelector('#ent');
        return v && { aberta: v.open, txt: v.querySelector('summary').textContent.trim(), depoisQ: !!(h.compareDocumentPosition(v) & Node.DOCUMENT_POSITION_FOLLOWING), antesEnt: !!(v.compareDocumentPosition(e) & Node.DOCUMENT_POSITION_FOLLOWING),
          conteudo: v.querySelector('.ajuda, .conceito') ? v.querySelector('.ajuda, .conceito').textContent.trim().length : 0 }; });
      if (!d || d.aberta || d.txt !== 'Ver dica' || !d.depoisQ || !d.antesEnt || !d.conteudo) dicas.push(`${q.codigo}: ${JSON.stringify(d)}`);
      if (q.campo === 'texto' || q.campo === 'numero') {
        const ph = await page.getAttribute('#ent input, #ent textarea', 'placeholder');
        if (!/^Ex\.: \S/.test(ph || '')) exemplos.push(`${q.codigo}: ${ph}`);
      }
    }
    check('toda tela de pergunta tem ≤ 60 palavras visíveis antes de tocar em algo', muitas.length === 0, muitas);
    check('"Ver dica" fechada por padrão, entre a pergunta e as respostas, com a ajuda dentro', dicas.length === 0, dicas);
    check('campos de escrever e de valor trazem o exemplo dentro ("Ex.: …")', exemplos.length === 0, exemplos); }
  /* ---------- BRIEF A: "Não sei" bloqueia (mostra a ajuda, não grava, Continuar não anda; com resposta, anda) ---------- */
  { await contexto.grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {});
    const sem = [], gravou = [], andou = [], depois = [], marca = [], semBotao = [];
    const SEM_NS = ['M6.P03', 'M6.P04', 'M6.P07', 'M6.P09', 'M6.P12', 'M6.P18'];
    const comNS = ordem.filter((q) => (q.opcoes || []).includes('Não sei') && !REPETE_P01.includes(q.codigo) && q.codigo !== 'M6.P08');
    check(`"Não sei" saiu de P03, P04, P07, P09, P12 e P18 (sobre a própria pessoa; Sim/Não da própria situação) e ficou em ${comNS.length} perguntas de fato a descobrir`,
      SEM_NS.every((c) => !(Q[c].opcoes || []).includes('Não sei')) && comNS.length === 7, comNS.map((q) => q.codigo));
    for (const c of SEM_NS) {
      await caminho({ 'Negócio': { tipo: 'opcao', v: NEG_DE[c] || 'Mercadoria' } }, c);
      if ((await page.evaluate(NA_PAGINA.atual)) !== c) { semBotao.push(c + ' (não abriu)'); continue; }
      const tem = await page.evaluate(() => !!document.querySelector('#ns') || [...document.querySelectorAll('#ent .opcao')].some((x) => /^Não sei$/.test(x.textContent.trim())));
      if (tem) semBotao.push(c);
    }
    check('onde o "Não sei" saiu, o botão/opção não existe', semBotao.length === 0, semBotao);
    for (const q of comNS) {
      const dq = D.perguntas.find((p) => p.codigo === q.codigo);
      if (/chatgpt|gemini|copilot|claude/i.test(JSON.stringify(dq))) marca.push(q.codigo);
      await caminho({ 'Negócio': { tipo: 'opcao', v: NEG_DE[q.codigo] || 'Mercadoria' } }, q.codigo);
      if ((await page.evaluate(NA_PAGINA.atual)) !== q.codigo) { sem.push(`${q.codigo}: não abriu`); continue; }
      const antes = await page.evaluate(() => localStorage.getItem('lg2-turma-b-m06'));
      if (await page.$('#ns')) await page.click('#ns');
      else await page.evaluate(() => [...document.querySelectorAll('#ent .opcao')].find((x) => x.querySelector('.op-txt b').textContent.trim() === 'Não sei').click());
      const cx = await page.evaluate(() => { const c = document.querySelector('#ajudans .como-ns');
        return c && { tit: c.querySelector('.como-tit').textContent.trim(), passos: [...c.querySelectorAll('ol > li')].map((l) => l.textContent.trim()), prompt: (c.querySelector('[data-prompt]') || {}).textContent || '',
          copiar: [...c.querySelectorAll('button')].filter((b) => b.textContent.trim() === 'Copiar').length, nota: c.innerText, vis: c.getBoundingClientRect().height > 0, dup: document.querySelectorAll('.como-ns').length }; });
      const okCx = cx && cx.vis && cx.dup === 1 && cx.tit === 'Como descobrir' && cx.passos.length === dq.comoDescobrir.length && cx.passos.every((x) => x.length > 0)
        && (dq.promptIA ? cx.prompt === dq.promptIA && cx.copiar === 1 && cx.nota.includes('Copie, cole numa IA de sua preferência e troque o que está entre colchetes.') : cx.copiar === 0);
      if (!okCx) sem.push(`${q.codigo}: ${JSON.stringify(cx)}`);
      if ((await page.evaluate(() => localStorage.getItem('lg2-turma-b-m06'))) !== antes) gravou.push(q.codigo);
      await page.evaluate(() => document.querySelector('#ok').click());
      const msg = nrm(await page.evaluate(() => { const e = document.querySelector('#erro'); return e && !e.hidden ? e.textContent : ''; }));
      if ((await page.evaluate(() => localStorage.getItem('lg2-turma-b-m06'))) !== antes) gravou.push(q.codigo + ' (Continuar)');
      if ((await page.evaluate(NA_PAGINA.atual)) !== q.codigo || (await page.$('#acoes .btn-primario:not(#ok)')) || !/^Use a ajuda acima e (escreva a sua resposta|escolha uma opção) para continuar\.$/.test(msg)) andou.push(`${q.codigo}: "${msg}"`);
      if (q.codigo === 'M6.P05') {   // Copiar: área de transferência (ou reserva) e aviso no botão
        await page.click('#ajudans [data-copiar]');
        let bt = '';
        for (let i = 0; i < 10 && bt !== 'Copiado!'; i++) { await page.waitForTimeout(200); bt = (await page.textContent('#ajudans [data-copiar]')).trim(); }
        const clip = await page.evaluate(() => navigator.clipboard.readText().catch(() => null));
        check('Copiar põe o pedido na área de transferência e avisa "Copiado!"', bt === 'Copiado!' && (clip === null || clip === dq.promptIA), { bt, clip });
      }
      /* com resposta de verdade, anda */
      const r = q.campo === 'numero' ? { tipo: 'texto', v: '100' } : q.campo === 'texto' ? { tipo: 'texto', v: 'Resposta de teste' } : { tipo: 'opcao', v: q.opcoes.find((o) => o !== 'Não sei') };
      await page.evaluate(NA_PAGINA.agir, r);
      if ((await page.evaluate(NA_PAGINA.atual)) === q.codigo) depois.push(q.codigo);
    }
    check('"Não sei" mostra "Como descobrir" (passos + pedido para a IA com Copiar) em todas as perguntas que o mantêm', sem.length === 0, sem);
    check('"Não sei" não grava nada (estado salvo igual, ao tocar e ao tocar Continuar)', gravou.length === 0, gravou);
    check('"Não sei" + Continuar: não avança e pede a resposta com mensagem simples', andou.length === 0, andou);
    check('depois de responder de verdade, Continuar avança', depois.length === 0, depois);
    check('nenhum pedido para IA cita marca de ferramenta', marca.length === 0, marca); }
  { // respostas antigas "Não sei" (estado v1) viram "sem resposta"; as outras ficam; versão sobe para 2
    await page.evaluate(() => { localStorage.clear(); localStorage.setItem('lg2-turma-b-m06', JSON.stringify({ dados: '2026-10-15',
      R: { 'M6.P01': { estado: 'valor', valor: 'Forno' }, 'M6.P02': { estado: 'valor', valor: '1500' }, 'M6.P03': { estado: 'naosei' },
        'M6.P04': { estado: 'multi', opcoes: ['Pix', 'Não sei'] }, 'M6.P05': { estado: 'naosei' }, 'M6.P07': { estado: 'opcao', opcao: 'Não sei' } },
      hist: ['M6.P01', 'M6.P02', 'M6.P03', 'M6.P04', 'M6.P05', 'RESULTADO'], prio: { Forno: 'essencial agora' }, fora: [], fluxo: null, cen: null })); });
    await page.reload();
    const s = await page.evaluate(() => JSON.parse(localStorage.getItem('lg2-turma-b-m06')));
    check('migração: "Não sei" salvo vira sem resposta, o resto fica (P01, P02, Pix, prioridades), versão 2',
      s.v === 2 && s.R['M6.P01'].valor === 'Forno' && s.R['M6.P02'].valor === '1500' && !s.R['M6.P03'] && !s.R['M6.P05'] && !s.R['M6.P07']
      && JSON.stringify(s.R['M6.P04'].opcoes) === '["Pix"]' && s.prio.Forno === 'essencial agora', s);
    await page.click('#ir');
    check('migração: "Continuar de onde parei" abre a primeira pergunta que ficou sem resposta (P03)', (await page.evaluate(NA_PAGINA.atual)) === 'M6.P03'); }
  /* ---------- relatório de revisão (16/11): testes de aceite 2 a 6 ----------
     Cenário do relatório, conferido à mão: preço R$ 9,50; custo de cada venda R$ 1,00 (a taxa do cartão agora sai das entradas);
     50 vendas/mês = R$ 475,00; gastos fixos R$ 1.600,00 (aluguel 1.000, água e luz 300, gás 300) + perdas R$ 100,00 = R$ 1.700,00 (Módulo 5);
     formas do Módulo 5: Pix 50% (sem taxa, na hora) e Cartão de crédito 50% (taxa 3,68%, cai em 30 dias = 5 semanas depois, arredondado para cima);
     caixa hoje R$ 1.000,00 (Módulo 1, "Mais de R$ 1.000"); compras para começar R$ 5.000,00 = entrada R$ 1.000,00 + 4 × R$ 1.000,00 por mês;
     vendas parecidas o ano todo.
     vendas/semana = 475 × 12 ÷ 52 = 109,615… → 109,62; Pix 109,62 × 50% = 54,81 (semanas 1 a 13);
     cartão 109,62 × 50% × (1 − 3,68%) = 52,79 (vendas da semana 1 caem na semana 6 -> semanas 6 a 13; 5 × 52,79 = 263,95 caem depois da 13)
     saídas/semana = 369,23 (1.600) + 23,08 (100) + 11,54 (1,00 × 50 = 50,00) = 403,85; parcelas: entrada na semana 1, parcelas nas semanas 5 e 10
     (k × 52 ÷ 12 → 4,33 e 8,67 semanas depois, arredondado); as parcelas 3 e 4 (semanas 14 e 18) ficam fora das 13 semanas.
     semana 1: 1.000 + 54,81 − (403,85 + 1.000) = −349,04
     entradas 13 sem.: 5 × 54,81 + 8 × (54,81 + 52,79) = 274,05 + 860,80 = 1.134,85; saídas: 13 × 403,85 + 3 × 1.000 = 8.250,05
     saldo final = 1.000 + 1.134,85 − 8.250,05 = −6.115,20 (é também o menor saldo, semana 13) -> capital adicional R$ 6.115,20 */
  const M5r = { versao: 3, R: { 'M5.P01': { estado: 'opcao', opcao: 'Mercadoria: compro pronto para revender' }, 'M5.P10': { estado: 'valor', valor: 'Brigadeiro' }, 'M5.P11': { estado: 'valor', valor: '50' }, 'M5.P12': { estado: 'valor', valor: '50' },
    'M5.P24': { estado: 'opcao', opcao: 'Sim' }, 'M5.P25': { estado: 'valor', valor: [{ forma: 'Pix', taxa: '0', prazo: '', parte: '50' }, { forma: 'Cartão de crédito', taxa: '3,68', prazo: '30', parte: '50' }] },
    'M5.P26': { estado: 'opcao', opcao: 'Sim' }, 'M5.P27': { estado: 'valor', valor: '100' }, 'M5.P28': { estado: 'opcao', opcao: 'Sim' }, 'M5.P29': { estado: 'valor', valor: '1000' },
    'M5.P30': { estado: 'opcao', opcao: 'Sim' }, 'M5.P31': { estado: 'valor', valor: '300' }, 'M5.P32': { estado: 'opcao', opcao: 'Sim' }, 'M5.P33': { estado: 'valor', valor: [{ nome: 'Gás', v: '300' }] },
    'M5.PG': { estado: 'valor', valor: ['Pix', 'Cartão de crédito'] }, 'M5.P36': { estado: 'valor', valor: '9,50' }, 'M5.P37': { estado: 'valor', valor: '50' },
    'M5.SZ': { estado: 'opcao', opcao: 'Não, é parecido o ano todo' } } };
  { const sem = { 'lg2-turma-a-m05': M5r, 'lg2-turma-a-m01': M1({ 'M1.P07': { estado: 'opcao', opcao: 'Mais de R$ 1.000' } }) };
    const resp = { 'M6.P01': { tipo: 'texto', v: 'Freezer, balcão' }, 'M6.P02': { tipo: 'texto', v: '5000' }, 'M6.P03': { tipo: 'opcao', v: 'Parte à vista e parte parcelado' },
      'M6.P03A': { tipo: 'parcelas', entrada: '1.000,00', n: '4' }, 'M6.P09': { tipo: 'opcao', v: 'Não' }, 'M6.P17': { tipo: 'texto', v: '0' }, 'M6.P18': { tipo: 'opcao', v: 'Não' } };
    /* "Como calculamos" na própria pergunta das parcelas, ao vivo */
    await caminho(resp, 'M6.P03A', sem);
    await page.fill('#p-entrada', '1.000,00'); await page.fill('#p-n', '4');
    await page.waitForTimeout(900);      // retorno ao vivo: 700 ms depois de parar de digitar
    const cp = nrm(await page.textContent('#como-parcela'));
    check('B: parcela calculada na hora, com a conta ("(R$ 5.000,00 da compra − R$ 1.000,00 de entrada) ÷ 4 parcelas = R$ 1.000,00 por mês")',
      cp === 'Como calculamos: (R$ 5.000,00 da compra − R$ 1.000,00 de entrada) ÷ 4 parcelas = R$ 1.000,00 por mês.', cp);
    const rp = nrm(await page.evaluate(NA_PAGINA.retorno));
    check('parcelas: o retorno (ao vivo, antes do Continuar) diz em que semanas caem (1, 5 e 10; 2 depois da semana 13)', rp.includes('entrada de R$ 1.000,00 na semana 1; parcelas de R$ 1.000,00 nas semanas 5 e 10; 2 parcelas ficam para depois da semana 13'), rp);
    const c = await caminho(resp, null, sem);
    check('dono: com o Módulo 5 respondido, as telas de formas de pagamento, taxas/prazos, vendas, época do ano, gastos e caixa não aparecem',
      c.cod === 'RESULTADO' && !['M6.P04', 'M6.PF', 'M6.P05', 'M6.SZ', 'M6.P06', 'M6.P07', 'M6.P08'].some((x) => c.vistas.includes(x)), c.vistas);
    const res = await page.evaluate(() => ({ abertos: [...document.querySelectorAll('#tela details')].every((d) => d.open),
      prox: document.querySelector('.lg2-proximo').getBoundingClientRect().height > 0, caixa: !!document.querySelector('#caixa') && !document.querySelector('#caixa').closest('details') }));
    check('BRIEF I: resultado com todas as seções abertas; menor saldo/capital à vista; botão do próximo módulo visível', res.abertos && res.prox && res.caixa, res);
    const L = await page.$$eval('.fluxo tbody tr', (tr) => tr.map((r) => ({ e: r.querySelector('[data-k="entradas"]').value, s: r.querySelector('[data-k="saidas"]').value, sf: r.querySelector('.sf').textContent.replace(/\s+/g, ' ').trim() })));
    const cf = nrm(await page.textContent('#confere-m5')), pr = nrm(await page.textContent('#como-conta'));
    check('aceite 2: gastos do mês Módulo 5 (R$ 1.700,00) = aqui (R$ 1.600,00 + R$ 100,00 de perdas), origem mostrada',
      cf.includes('Na Etapa 5: R$ 1.600,00 fixos + R$ 100,00 de perdas + R$ 0,00 para você = R$ 1.700,00 por mês') && cf.includes('= R$ 1.700,00 por mês. Os dois batem.')
      && pr.includes('Perdas: R$ 100,00 por mês × 12 ÷ 52 = R$ 23,08 por semana') && (await page.$$('#i04 .lbl .selo')).length >= 3, { cf });
    check('aceite 2: custo de cada venda entra no caixa (R$ 1,00 × 50 vendas = R$ 50,00 por mês = R$ 11,54 por semana; a taxa sai das entradas)',
      pr.includes('Custo de cada venda (a taxa já sai das entradas): R$ 1,00 × 50 vendas no mês (R$ 475,00 ÷ R$ 9,50) = R$ 50,00 por mês × 12 ÷ 52 = R$ 11,54 por semana'), pr);
    check('aceite 3: entrada + parcela nas semanas 1, 5 e 10 (R$ 1.403,85 = 403,85 + 1.000); demais semanas R$ 403,85',
      L.length === 13 && L.every((l, i) => l.s === ([0, 4, 9].includes(i) ? '1.403,85' : '403,85')), L.map((l) => l.s));
    check('aceite 3: o que passa da semana 13 aparece à parte (2 parcelas, R$ 2.000,00)', pr.includes('Depois da semana 13 ainda faltam 2 parcelas (R$ 2.000,00)'), pr);
    check('aceite 4: semanas 1 a 5 só Pix (R$ 54,81); da semana 6 em diante + cartão já sem taxa (54,81 + 52,79 = R$ 107,60)', L.every((l, i) => l.e === (i < 5 ? '54,81' : '107,60')), L.map((l) => l.e));
    check('aceite 4 / dono: conta de cada forma explicada (vendas × parte × (1 − taxa), semana em que cai)',
      pr.includes('Cartão de crédito: R$ 109,62 por semana × 50% × (1 − 3,68% de taxa) = R$ 52,79; cai 5 semanas depois (30 dias ÷ 7, arredondado para cima)')
      && pr.includes('Pix: R$ 109,62 por semana × 50% = R$ 54,81; cai na mesma semana') && pr.includes('só caem depois da semana 13: R$ 263,95'), pr);
    const n = (x) => +String(x).replace(/[^\d,−-]/g, '').replace('−', '-').replace(/\./g, '').replace(',', '.');
    const soma = (k) => Math.round(L.reduce((a, l) => a + n(l[k]), 0) * 100) / 100;
    const fim = n(L[12].sf);
    check('aceite 5: saldo final = inicial + entradas − saídas (1.000 + 1.134,85 − 8.250,05 = −6.115,20)', soma('e') === 1134.85 && soma('s') === 8250.05 && Math.abs(1000 + soma('e') - soma('s') - fim) < 0.005 && fim === -6115.2 && L[0].sf === nrm('−R$ 349,04'), { e: soma('e'), s: soma('s'), fim, s1: L[0].sf });
    const cx = await page.evaluate(() => ({ min: document.querySelector('#cx-min').innerText, fin: document.querySelector('#cx-final').innerText, cap: document.querySelector('#cx-capital .val').innerText,
      cc: document.querySelector('#como-capital').innerText, cfin: document.querySelector('#como-final').innerText }));
    check('aceite 5: menor saldo (semana 13), saldo final e capital adicional R$ 6.115,20, cada um com "Como calculamos"',
      nrm(cx.min).includes('−R$ 6.115,20') && nrm(cx.min).includes('semana 13') && nrm(cx.fin).includes('−R$ 6.115,20') && nrm(cx.cap) === 'R$ 6.115,20'
      && nrm(cx.cc).startsWith('Como calculamos: o saldo mais baixo das 13 semanas é −R$ 6.115,20, na semana 13. Para ele não ficar negativo, faltam R$ 6.115,20')
      && nrm(cx.cfin) === 'Como calculamos: saldo final = R$ 1.000,00 (caixa hoje) + R$ 1.134,85 (tudo o que entra) − R$ 8.250,05 (tudo o que sai) = −R$ 6.115,20.', cx);
    if (process.env.SHOTS) { await page.evaluate(() => document.querySelector('#caixa').scrollIntoView()); await page.waitForTimeout(400); await page.screenshot({ path: path.join(process.env.SHOTS, 'm06_depois_caixa_resumo.png') });
      await page.evaluate(() => document.querySelector('#i04').scrollIntoView()); await page.waitForTimeout(400); await page.screenshot({ path: path.join(process.env.SHOTS, 'm06_depois_simulador.png') }); }
    const tipar = async (sel, v) => { await page.fill(sel, v); await page.dispatchEvent(sel, 'change'); return page.inputValue(sel); };
    const fmt = {};
    for (const v of ['1425,06', '1.425,06', '1425.06', '', '0', '0,5', '1.000.000', '7.000,00']) fmt[v] = await tipar('#f-ini', v);
    check('aceite 6: campo de dinheiro aceita vírgula e volta no padrão brasileiro (vazio = 0,00; 0,5 = 0,50; 1.000.000 = 1.000.000,00)',
      JSON.stringify(fmt) === JSON.stringify({ '1425,06': '1.425,06', '1.425,06': '1.425,06', '1425.06': '1.425,06', '': '0,00', '0': '0,00', '0,5': '0,50', '1.000.000': '1.000.000,00', '7.000,00': '7.000,00' }), fmt);
    const cc2 = nrm(await page.textContent('#como-capital')), cap2 = nrm(await page.textContent('#cx-capital .val'));
    check('B: "Como calculamos" do capital se atualiza ao vivo (caixa R$ 7.000,00 -> menor saldo −R$ 115,20, capital R$ 115,20)', cap2 === 'R$ 115,20' && cc2.includes('−R$ 115,20'), { cap2, cc2 });
    const ruins = await page.$$eval('#tela input[inputmode="decimal"]', (xs) => xs.map((x) => x.value).filter((v) => !/^\d{1,3}(\.\d{3})*,\d{2}$/.test(v)));
    check('aceite 6: nenhum campo de dinheiro do resultado com ponto decimal (ex.: "1425.06")', ruins.length === 0, ruins);
    await tipar('.cen[data-k="ent"]', '1425,06');
    check('simulador de cenários: "1425,06" vira "1.425,06" e o resultado sai em R$ brasileiro', (await page.inputValue('.cen[data-k="ent"]')) === '1.425,06' && /R\$ [\d.]+,\d{2}/.test(await page.textContent('#cen-res')));
    await tipar('#f-perdas', '0');
    check('perdas mudadas: aviso de que os gastos do mês diferem do Módulo 5 e "No Módulo 5: R$ 100,00" ao lado do campo',
      /diferentes dos da Etapa 5 \(R\$ 1\.700,00\)/.test(nrm(await page.textContent('#atencao'))) && nrm(await page.textContent('#i04')).includes('Na Etapa 5: R$ 100,00')); }
  /* ---------- dono: taxa e prazo por forma de pagamento + época do ano ----------
     Conferido à mão: vendas R$ 1.300,00/mês × 12 ÷ 52 = R$ 300,00 por semana. Pix 40% = R$ 120,00 na mesma semana;
     cartão de crédito 60% com 3,5% de taxa = 300 × 0,6 × 0,965 = R$ 173,70, caindo 30 dias depois = 5 semanas (semana 6 em diante).
     Com época do ano (meses fortes: novembro, +50%; hoje = 16/11/2026): semanas 1 (16-22/11) e 2 (23-29/11) têm vendas de R$ 450,00 (× 1,5);
     semana 3 (meio em 03/12) volta a × 1. Pix: 180, 180, 120…; cartão das semanas 1-2: 450 × 0,6 × 0,965 = R$ 260,55 caem nas semanas 6 e 7.
     entradas: s1 180; s2 180; s3-s5 120; s6-s7 120 + 260,55 = 380,55; s8-s13 120 + 173,70 = 293,70. Sem época: s1-s5 120; s6-s13 293,70. */
  { const resp = { 'M6.P01': { tipo: 'texto', v: 'Freezer' }, 'M6.P02': { tipo: 'texto', v: '0' }, 'M6.P04': { tipo: 'multi', vs: ['Pix', 'Cartão de crédito'] },
      'M6.PF': { tipo: 'formas', vals: { 'Pix': ['0', '0', '40'], 'Cartão de crédito': ['3,5', '30', '60'] } }, 'M6.P05': { tipo: 'texto', v: '1300' },
      'M6.P06': { tipo: 'texto', v: 'nada' }, 'M6.P07': { tipo: 'texto', v: '0' } };
    await caminho(resp, 'M6.P04');
    check('dono: sem Módulo 5, P04 pergunta com as MESMAS opções do Módulo 5', JSON.stringify(await page.$$eval('#ent .opcao .op-txt b', (b) => b.map((x) => x.textContent.trim()))) === JSON.stringify(['Pix', 'Dinheiro', 'Cartão de débito', 'Cartão de crédito', 'Outra forma']));
    await page.evaluate(NA_PAGINA.agir, resp['M6.P04']);
    const pf = await page.evaluate(() => [...document.querySelectorAll('.forma')].map((f) => ({ forma: f.dataset.forma, taxa: f.querySelector('.taxa').value, prazo: f.querySelector('.prazo').value, parte: (f.querySelector('.parte') || {}).value })));
    check('dono: taxa, dias e parte por forma; Pix já vem sem taxa e na hora; partes começam divididas igualmente (50/50)',
      JSON.stringify(pf) === JSON.stringify([{ forma: 'Pix', taxa: '0', prazo: '0', parte: '50' }, { forma: 'Cartão de crédito', taxa: '', prazo: '', parte: '50' }]), pf);
    await page.evaluate(() => document.querySelector('#ok').click());
    check('cartão sem taxa/prazo: pede para preencher e não grava', /Preencha a taxa e em quantos dias cai o dinheiro de “Cartão de crédito”/.test(await page.textContent('#erro'))
      && !(await page.evaluate(() => JSON.parse(localStorage.getItem('lg2-turma-b-m06')).R['M6.PF'])));
    await page.evaluate(NA_PAGINA.agir, { tipo: 'formas', vals: { 'Pix': ['0', '0', '30'], 'Cartão de crédito': ['3,5', '30', '60'] } });
    check('partes que não somam 100%: pede para ajustar', /somam 90%/.test(await page.textContent('#erro')));
    const ent = async (sz) => { await caminho({ ...resp, 'M6.SZ': sz }, null); return page.$$eval('.fluxo tbody tr', (tr) => tr.map((r) => r.querySelector('[data-k="entradas"]').value)); };
    const e1 = await ent({ tipo: 'saz', v: 'Não' });
    check('dono: cartão 60% com 3,5% caindo em 30 dias + Pix 40% -> semanas 1-5 R$ 120,00; 6-13 R$ 293,70 (120 + 173,70)',
      JSON.stringify(e1) === JSON.stringify([...Array(5).fill('120,00'), ...Array(8).fill('293,70')]), e1);
    const e2 = await ent({ tipo: 'saz', v: 'Sim', fortes: [11], mais: '50' });
    check('dono: novembro forte (+50%): semanas 1-2 × 1,5 (Pix 180,00); o cartão delas (260,55) cai nas semanas 6-7',
      JSON.stringify(e2) === JSON.stringify(['180,00', '180,00', '120,00', '120,00', '120,00', '380,55', '380,55', ...Array(6).fill('293,70')]), e2);
    const fat = await page.$$eval('.fluxo .fator', (x) => x.map((e) => e.textContent.trim()));
    const pr = nrm(await page.textContent('#como-conta'));
    check('época do ano: fator na linha da semana e na conta ("Semanas 1, 2 caem em mês forte: vendas × 1,5 (+50%) = R$ 450,00 por semana")',
      JSON.stringify(fat) === '["× 1,5","× 1,5"]' && pr.includes('a semana 1 começa hoje (16/11/2026)') && pr.includes('Semanas 1, 2 caem em mês forte: vendas × 1,5 (+50%) = R$ 450,00 por semana'), { fat, pr });
    await ent({ tipo: 'saz', v: 'Sim', fracos: [1], menos: '20' });
    check('época do ano: mês fraco dentro das 13 semanas vira aviso ("As vendas caem em janeiro: o caixa fica mais apertado.")', nrm(await page.textContent('#atencao')).includes('As vendas caem em janeiro: o caixa fica mais apertado.'));
    const szM5 = { 'lg2-turma-a-m05': { versao: 3, R: { 'M5.SZ': { estado: 'opcao', opcao: 'Sim, tem meses mais fortes e mais fracos', fortes: [11], fracos: [], maisPct: 50, menosPct: 0 } } } };
    const c2 = await caminho(resp, null, szM5);
    const rz = await page.evaluate(() => JSON.parse(localStorage.getItem('lg2-turma-b-m06')).R['M6.SZ']);
    const e3 = await page.$$eval('.fluxo tbody tr', (tr) => tr.map((r) => r.querySelector('[data-k="entradas"]').value));
    check('época do ano do Módulo 5 (M5.SZ): sem tela aqui, gravada como M6.SZ com a origem, e entra na conta', !c2.vistas.includes('M6.SZ') && rz && rz.herdado === 5 && rz.maisPct === 50 && e3[0] === '180,00', { v: c2.vistas, rz, e3 });
    const pf5 = { 'lg2-turma-a-m05': { versao: 3, R: { 'M5.PG': { estado: 'valor', valor: ['Pix', 'Cartão de crédito'] }, 'M5.P24': { estado: 'opcao', opcao: 'Sim' },
      'M5.P25': { estado: 'valor', valor: [{ forma: 'Pix', taxa: '0', prazo: '', parte: '40' }, { forma: 'Cartão de crédito', taxa: '3,5', prazo: '30', parte: '60' }] } } } };
    const c3 = await caminho({ ...resp, 'M6.P04': undefined, 'M6.PF': undefined }, null, pf5);
    const r4 = await page.evaluate(() => JSON.parse(localStorage.getItem('lg2-turma-b-m06')).R);
    const e4 = await page.$$eval('.fluxo tbody tr', (tr) => tr.map((r) => r.querySelector('[data-k="entradas"]').value));
    check('dono: M5.PG + taxas do Módulo 5 respondidos -> as telas de formas e de taxa/prazo não aparecem; a conta usa as taxas de lá',
      !c3.vistas.includes('M6.P04') && !c3.vistas.includes('M6.PF') && r4['M6.PF'].herdado === 5 && r4['M6.P04'].herdado === 5 && e4[5] === '293,70', { v: c3.vistas, e4 }); }
  /* ---------- dono: contas separadas (investimento, operação, caixa, capital de giro, retorno) ----------
     Conferido à mão (mesmas respostas do cenário do relatório, vendas R$ 5.000,00/mês e preço R$ 10,00):
     taxas = 5.000 × 50% × 3,68% = 92,00; custo = 500 vendas × R$ 1,00 = 500,00; perdas 100,00 -> variáveis 692,00
     fixos 1.000 + 300 + 300 = 1.600,00; lucro = 5.000 − 1.600 − 692 = 2.708,00
     retorno ao ano = 2.708 × 12 ÷ 5.000 = 6,4992 -> 649,9%; volta em 5.000 ÷ 2.708 = 1,846 -> 1,8 meses.
     Com vendas de R$ 475,00 o lucro é 475 − 1.600 − (50 + 8,74 + 100) = −1.283,74: "o investimento não se paga". */
  { const R0 = { 'M6.P02': { estado: 'valor', valor: '5000' }, 'M6.P03': { estado: 'opcao', opcao: 'Parte à vista e parte parcelado' }, 'M6.P03A': { estado: 'valor', valor: 'x', entrada: 1000, parcelas: 4 },
      'M6.P04': { estado: 'multi', opcoes: ['Pix', 'Cartão de crédito'] }, 'M6.PF': { estado: 'valor', valor: [{ forma: 'Pix', taxa: '0', prazo: '0', parte: '50' }, { forma: 'Cartão de crédito', taxa: '3,68', prazo: '30', parte: '50' }] },
      'M6.P05': { estado: 'valor', valor: '5000' }, 'M6.P06': { estado: 'valor', valor: 'Aluguel: R$ 1.000,00; Água e luz: R$ 300,00; Gás: R$ 300,00' }, 'M6.P07': { estado: 'valor', valor: '1000' } };
    const x = await page.evaluate((R) => Motor.indicadores({ R, m5: { perdas: 100, custoVenda: 1, preco: 10 }, hoje: '2026-11-16' }), R0);
    check('Motor.indicadores: investimento, fixos e variáveis por linha, lucro 2.708,00, retorno 649,9% ao ano, volta em 1,8 meses',
      x.investimento === 5000 && x.parcelado.n === 4 && JSON.stringify(x.fixos.map((f) => [f.nome, f.valor])) === '[["Aluguel",1000],["Água e luz",300],["Gás",300]]'
      && JSON.stringify(x.variaveis.map((f) => [f.nome, f.valor])) === '[["Materiais e custo de cada venda",500],["Taxas das vendas",92],["Perdas",100]]'
      && x.entradasMes === 5000 && x.totalFixos === 1600 && x.totalVariaveis === 692 && x.lucroMes === 2708 && x.roiAno === 649.9 && x.paybackMeses === 1.8 && x.sePaga
      && ['menorSaldo', 'semanaMenor', 'saldoFinal', 'capitalExtra', 'saldoInicial'].every((k) => typeof x[k] === 'number'), x);
    const y = await page.evaluate((R) => Motor.indicadores({ R: { ...R, 'M6.P05': { estado: 'valor', valor: '475' } }, m5: { perdas: 100, custoVenda: 1, preco: 9.5 }, hoje: '2026-11-16' }), R0);
    check('Motor.indicadores: lucro negativo (−1.283,74) -> sem retorno negativo (roiAno/paybackMeses = null, sePaga = false); capital extra = −menor saldo (6.115,20)',
      y.lucroMes === -1283.74 && y.roiAno === null && y.paybackMeses === null && !y.sePaga && y.capitalExtra === 6115.2 && y.menorSaldo === -6115.2 && y.semanaMenor === 13, y); }
  { // na tela: blocos separados com "Como calculamos" (cenário do relatório = prejuízo)
    await caminho({ 'M6.P01': { tipo: 'texto', v: 'Freezer, balcão' }, 'M6.P02': { tipo: 'texto', v: '5000' }, 'M6.P03': { tipo: 'opcao', v: 'À vista' }, 'M6.P09': { tipo: 'opcao', v: 'Não' }, 'M6.P17': { tipo: 'texto', v: '0' } }, null,
      { 'lg2-turma-a-m05': M5r, 'lg2-turma-a-m01': M1({ 'M1.P07': { estado: 'opcao', opcao: 'Mais de R$ 1.000' } }) });
    const b = await page.evaluate(() => ({ ordem: ['#i01', '#operacao', '#caixa', '#retorno-inv'].every((s, i, a) => !i || !!(document.querySelector(a[i - 1]).compareDocumentPosition(document.querySelector(s)) & Node.DOCUMENT_POSITION_FOLLOWING)),
      op: document.querySelector('#operacao').innerText, ret: document.querySelector('#retorno-inv').innerText }));
    check('resultado: investimento → operação do mês → caixa/capital de giro → retorno, cada um com a conta; prejuízo dito com clareza',
      b.ordem && nrm(b.op).includes('Vendas do mês (entradas) R$ 475,00') && nrm(b.op).includes('Taxas das vendas R$ 8,74') && nrm(b.op).includes('Falta no mês (prejuízo) −R$ 1.283,74')
      && nrm(b.op).includes('Como calculamos: R$ 475,00 de vendas − R$ 1.600,00 de saídas fixas − R$ 158,74 de saídas que mudam com as vendas = −R$ 1.283,74 por mês')
      && nrm(b.ret).includes('Com estes números o investimento não se paga') && !/−\d+[,.]?\d*%/.test(b.ret), b); }

  /* ---------- dono: custo de entrega (M5.ENT) ----------
     Conferido à mão: preço R$ 10,00 × 52 vendas = R$ 520,00/mês -> 520 × 12 ÷ 52 = R$ 120,00 por semana.
     (a) entrega no preço: R$ 8,00 por entrega, 5 de cada 10 vendas -> R$ 4,00 por venda × 52 = R$ 208,00/mês × 12 ÷ 52 = R$ 48,00 por semana.
     (b) cliente paga à parte R$ 5,00: (8 − 5) × 5/10 = R$ 1,50 por venda × 52 = R$ 78,00/mês -> R$ 18,00 por semana.
     Sem gastos, compras nem caixa: a saída de cada semana é só a entrega. */
  { const base = (ent) => ({ 'lg2-turma-a-m05': { versao: 3, R: { 'M5.PG': { estado: 'valor', valor: ['Pix'] }, 'M5.P24': { estado: 'opcao', opcao: 'Não' },
      'M5.P36': { estado: 'valor', valor: '10' }, 'M5.P37': { estado: 'valor', valor: '52' }, 'M5.SZ': { estado: 'opcao', opcao: 'Não, é parecido o ano todo' },
      'M5.P28': { estado: 'opcao', opcao: 'Não' }, 'M5.P30': { estado: 'opcao', opcao: 'Não' }, 'M5.P32': { estado: 'opcao', opcao: 'Não' }, ...(ent ? { 'M5.ENT': ent } : {}) } } });
    const resp = { 'M6.P01': { tipo: 'texto', v: 'nada' }, 'M6.P07': { tipo: 'texto', v: '0' } };
    const saidas = () => page.$$eval('.fluxo tbody tr', (tr) => tr.map((r) => r.querySelector('[data-k="saidas"]').value));
    await caminho(resp, null, base({ estado: 'opcao', opcao: 'Sim, e a entrega já está no meu preço', custo: 8, tipoCusto: 'reais', aCada10: 5, cobra: null }));
    const pa = nrm(await page.textContent('#pr-entrega')), sa = await saidas();
    check('entrega no preço: linha "Entregas" (R$ 8,00 × 5 de cada 10 = R$ 4,00 por venda × 52 = R$ 208,00/mês = R$ 48,00/semana) e saídas de R$ 48,00',
      pa === 'Entregas: R$ 8,00 por entrega × 5 de cada 10 vendas = R$ 4,00 por venda × 52 vendas no mês = R$ 208,00 por mês × 12 ÷ 52 = R$ 48,00 por semana.' && sa.every((x) => x === '48,00')
      && (await page.inputValue('#f-entrega')) === '4,00', { pa, sa });
    await caminho(resp, null, base({ estado: 'opcao', opcao: 'Sim, e o cliente paga a entrega à parte', custo: 8, tipoCusto: 'reais', aCada10: 5, cobra: 5 }));
    const pb = nrm(await page.textContent('#pr-entrega')), sb = await saidas();
    check('cliente paga a entrega à parte (R$ 5,00): (8 − 5) × 5/10 = R$ 1,50 por venda -> R$ 18,00 por semana', pb.includes('R$ 8,00 por entrega − R$ 5,00 que o cliente paga × 5 de cada 10 vendas = R$ 1,50 por venda') && sb.every((x) => x === '18,00'), { pb, sb });
    await caminho(resp, null, base(null));
    const pc0 = nrm(await page.textContent('#pr-entrega'));
    check('sem a resposta de entrega no Módulo 5: não pergunta aqui; nota "Custo de entrega não informado (Módulo 5)" com link', pc0.startsWith('Custo de entrega não informado (Etapa 5).')
      && !!(await page.$('#pr-entrega a[href*="m05"]')) && (await saidas()).every((x) => x === '0,00'), pc0); }

  { // motor: parcela fecha o total e semanas pela regra 1 + arredondar(k × 52 ÷ 12)
    const m = await page.evaluate(() => [1, 2, 3, 4, 6, 12].map(Motor.semanaParcela));
    const pl = await page.evaluate(() => Motor.planoInvestimento({ 'M6.P02': { estado: 'valor', valor: '1000' }, 'M6.P03': { estado: 'opcao', opcao: 'Parcelado' }, 'M6.P03A': { estado: 'valor', valor: 'x', entrada: 0, parcelas: 3 } }));
    check('motor: parcelas mensais nas semanas 5, 10, 14, 18, 27, 53; R$ 1.000 em 3 = 333,33 + 333,33 + 333,34', JSON.stringify(m) === '[5,10,14,18,27,53]'
      && JSON.stringify([...pl.semanas, ...pl.depois].map((x) => x.valor)) === '[333.33,333.33,333.34]' && pl.aVista === 0, { m, pl }); }


  /* ---------- lote 17/11 (tira a fricção): um toque, Continuar igual e à vista, leitor de tela, contador e tempo honestos ---------- */
  { // A: retorno ao vivo ANTES do Continuar — escolha (no toque) e campo (700 ms sem digitar, sem sair do campo)
    await caminho({}, 'M6.P03');
    await page.evaluate(() => [...document.querySelectorAll('#ent .opcao')].find((b) => b.textContent.trim() === 'À vista').click());
    const rEsc = nrm(await page.evaluate(NA_PAGINA.retorno)), r03 = R.find((x) => x.pergunta === 'M6.P03' && x.condicao.trim() === 'À vista');
    check('A: escolha -> o retorno aparece no toque, logo abaixo da resposta, antes do Continuar', !!r03 && rEsc.includes(nrm(r03.texto)) && (await page.evaluate(NA_PAGINA.atual)) === 'M6.P03'
      && await page.evaluate(() => { const r = document.querySelector('#retorno'), e = document.querySelector('#ent'); return !!(e.compareDocumentPosition(r) & Node.DOCUMENT_POSITION_FOLLOWING) && !!(r.compareDocumentPosition(document.querySelector('#ok')) & Node.DOCUMENT_POSITION_FOLLOWING); }), rEsc);
    /* D: escolha única diz qual está marcada */
    const ap = await page.$$eval('#ent .opcao', (b) => b.map((x) => [x.querySelector('b').textContent.trim(), x.getAttribute('aria-pressed')]));
    check('D: aria-pressed = "true" só na opção escolhida, "false" nas outras', ap.length > 1 && ap.every(([t, v]) => v === (t === 'À vista' ? 'true' : 'false')), ap);
    await page.click('#ok');
    const foco = await page.evaluate(() => ({ cod: document.querySelector('.cartao-q').dataset.cod, ehQ: document.activeElement === document.querySelector('.cartao-q h2.q'), tab: document.activeElement.getAttribute('tabindex') }));
    check('A + D: UM toque em Continuar grava e abre a próxima; o foco vai para o enunciado novo', foco.cod !== 'M6.P03' && foco.ehQ && foco.tab === '-1'
      && (await page.evaluate(() => JSON.parse(localStorage.getItem('lg2-turma-b-m06')).R['M6.P03'].opcao)) === 'À vista', foco);
    /* múltipla escolha também diz o estado */
    await caminho({}, 'M6.P04');
    await page.evaluate(() => [...document.querySelectorAll('#ent .opcao')].filter((b) => /^(Pix|Dinheiro)$/.test(b.textContent.trim())).forEach((b) => b.click()));
    const am = await page.$$eval('#ent .opcao', (b) => b.map((x) => [x.textContent.trim(), x.getAttribute('aria-pressed')]));
    check('D: múltipla escolha com aria-pressed (Pix e Dinheiro = "true", o resto "false")', am.every(([t, v]) => v === (/^(Pix|Dinheiro)$/.test(t) ? 'true' : 'false')), am);
    /* campo: digitar e parar (sem sair do campo) mostra o retorno em ~700 ms */
    await caminho({}, 'M6.P05');
    await page.click('#ent input'); await page.keyboard.type('0');
    const cedo = nrm(await page.evaluate(NA_PAGINA.retorno));
    await page.waitForTimeout(900);
    const tarde = nrm(await page.evaluate(NA_PAGINA.retorno)), r18 = R.find((x) => x.codigo === 'M6.R18');
    check('A: campo -> o retorno aparece ~700 ms depois de parar de digitar, antes do Continuar', !cedo.includes(nrm(r18.texto)) && tarde.includes(nrm(r18.texto)) && (await page.evaluate(NA_PAGINA.atual)) === 'M6.P05', { cedo, tarde });
    /* quem toca Continuar sem ter visto o retorno recebe um cartão pequeno no alto da próxima tela (nunca um passo extra) */
    await caminho({}, 'M6.P05');
    await page.evaluate(() => { const i = document.querySelector('#ent input'); i.value = '0'; document.querySelector('#ok').click(); });
    const sobre = nrm(await page.evaluate(() => (document.querySelector('#sobre-anterior') || {}).textContent || ''));
    check('A: Continuar direto (sem ver o retorno) -> próxima pergunta com "Sobre a sua resposta anterior: …"', (await page.evaluate(NA_PAGINA.atual)) !== 'M6.P05' && sobre.startsWith('Sobre a sua resposta anterior:') && sobre.includes(nrm(r18.texto)), sobre);
    check('A: nenhum botão "Seguir" nem "Corrigir minha resposta" (em todas as telas vistas até aqui)', passosExtras.length === 0, passosExtras.slice(0, 5)); }
  { // B: Continuar sempre ativo; sem resposta, mensagem simples logo acima do botão, com role="alert"
    const vazio = async (cod, msg) => {
      await caminho({}, cod);
      const dis = await page.evaluate(() => document.querySelector('#ok').disabled || document.querySelector('#ok').getAttribute('aria-disabled') === 'true');
      await page.click('#ok');
      return page.evaluate(([m, d]) => { const e = document.querySelector('#erro'), ok = document.querySelector('#ok');
        return { d, txt: e.textContent.trim(), vis: !e.hidden, role: e.getAttribute('role'), acima: e.getBoundingClientRect().bottom <= ok.getBoundingClientRect().top + 1, ok: e.textContent.trim() === m }; }, [msg, dis]);
    };
    const b1 = await vazio('M6.P03', 'Escolha uma opção para continuar.'), b2 = await vazio('M6.P05', 'Escreva a sua resposta para continuar.');
    check('B: Continuar ativo sem resposta; escolha -> "Escolha uma opção para continuar." acima do botão, role=alert', !b1.d && b1.vis && b1.ok && b1.role === 'alert' && b1.acima, b1);
    check('B: campo vazio -> "Escreva a sua resposta para continuar." acima do botão, role=alert', !b2.d && b2.vis && b2.ok && b2.role === 'alert' && b2.acima, b2);
    check('B: Continuar nunca desativado nas perguntas visitadas', continuarInativo.length === 0, continuarInativo); }
  { // C: Continuar inteiro dentro da tela, sem rolar, em celular pequeno, letra grande e celular deitado
    const fora = [];
    for (const [w, h, fonte] of [[360, 640, ''], [390, 844, '130%'], [740, 360, '']]) {
      await page.setViewportSize({ width: w, height: h });
      porTela = async (cod) => {
        if (fonte) { await page.evaluate((f) => { document.documentElement.style.fontSize = f; }, fonte); await page.waitForTimeout(50); }
        const r = await page.evaluate(() => { const b = document.querySelector('#ok').getBoundingClientRect(); return { top: b.top, bottom: b.bottom, h: innerHeight, y: scrollY }; });
        if (!(r.top >= 0 && r.bottom <= r.h && r.y === 0)) fora.push(`${w}x${h}${fonte ? ' ' + fonte : ''} ${cod}: ${JSON.stringify(r)}`);
      };
      for (const resp of [{ 'M6.P03': { tipo: 'opcao', v: 'Parcelado' }, 'Negócio': { tipo: 'opcao', v: 'Mercadoria' } }, { 'Negócio': { tipo: 'opcao', v: 'Produto' } }, {}]) await caminho(resp, null);
      porTela = null;
    }
    await page.setViewportSize({ width: 390, height: 844 });
    check('C: Continuar inteiro na tela sem rolar (360x640, 390x844 com letra 130%, 740x360) em todas as perguntas visitadas', fora.length === 0, fora.slice(0, 6));
    /* o pé fixo não cobre o último campo nem a última opção */
    await page.setViewportSize({ width: 360, height: 640 });
    await caminho({}, 'M6.P04');
    const cobre = await page.evaluate(() => { const ult = [...document.querySelectorAll('#ent .opcao')].pop(); ult.scrollIntoView({ block: 'end' }); window.scrollBy(0, 400);
      ult.scrollIntoView({ block: 'nearest' }); const a = ult.getBoundingClientRect(), pe = document.querySelector('#pe').getBoundingClientRect(); return { ult: a.bottom, pe: pe.top, sticky: getComputedStyle(document.querySelector('#pe')).position }; });
    await page.setViewportSize({ width: 390, height: 844 });
    check('C: área do Continuar presa ao pé (sticky) sem cobrir a última opção', cobre.sticky === 'sticky' && cobre.ult <= cobre.pe + 1, cobre); }
  { // G: contador estável e honesto; tempo da capa = caminho comum × 35 s, arredondado para múltiplo de 5 min
    const longo = await caminho({ 'M6.P03': { tipo: 'opcao', v: 'Parcelado' }, 'Negócio': { tipo: 'opcao', v: 'Mercadoria' } }, null);
    check(`G: total do contador (${TOTAL_ESPERADO}) = caminho mais longo possível (${longo.vistas.length} perguntas)`, longo.vistas.length === TOTAL_ESPERADO, longo.vistas);
    const comum = await caminho({}, null);
    await page.evaluate(() => localStorage.clear()); await page.reload();
    const min = +((await page.textContent('.tempo')).match(/cerca de (\d+) minutos/) || [])[1];
    const esp = Math.ceil(comum.vistas.length * 35 / 60 / 5) * 5;
    check(`G: capa promete ${min} min = ${comum.vistas.length} perguntas do caminho comum × 35 s, arredondado para múltiplo de 5`, min === esp, { min, esp, n: comum.vistas.length });
    check('G: "Pergunta N de M" sem pular: N = posição no caminho, M fixo, barra nunca volta (todas as perguntas visitadas)', contadorRuim.length === 0, contadorRuim.slice(0, 6)); }
  { // E: link do fim exatamente "Ir para a Etapa 7", visível
    await caminho({}, null);
    const px = await page.evaluate(() => { const a = document.querySelector('.acoes.lg2-proximo a'); return a && { t: a.textContent.trim(), vis: a.getBoundingClientRect().height > 0, h: a.getAttribute('href') }; });
    check('E: fim com "Ir para a Etapa 7" dentro de <div class="acoes lg2-proximo">, visível', px && px.t === 'Ir para a Etapa 7' && px.vis && /turma-b\/m07/.test(px.h), px);
    const conc = nrm(await page.textContent('.concluido h2'));
    check('E: "Você concluiu a Etapa 6"', conc === 'Você concluiu a Etapa 6', conc); }
  { // F: alvos de toque ≥ 44 px (Ver dica, Ver mais, Trocar, Não sei, Voltar, meses, Tirar da lista…)
    const peq = [];
    const medir = async (rot) => peq.push(...(await page.evaluate((rot) => [...document.querySelectorAll('#tela summary, #tela button, #tela .btn')]
      .filter((x) => { if (!(x.getBoundingClientRect().height > 0)) return false;      // cabeçalho/rodapé do padrao.js (arquivo do pai) ficam de fora
        for (let e = x; e; e = e.parentElement) if ([...e.classList].some((c) => c.startsWith('p-') && c !== 'p-fontes')) return false; return true; })
      .filter((x) => x.getBoundingClientRect().height < 44).map((x) => `${rot}: "${x.textContent.trim().slice(0, 30)}" ${Math.round(x.getBoundingClientRect().height)}px`), rot)));
    await page.evaluate(() => localStorage.clear()); await page.reload(); await medir('capa');
    await page.evaluate(() => { const d = document.querySelector('.como-funciona'); if (d) d.open = true; }); await medir('capa aberta');
    await caminho({}, 'M6.P01'); await medir('P01');
    await caminho({}, 'M6.SZ'); await page.evaluate(() => [...document.querySelectorAll('#ent .opcao')].find((b) => /^Sim/.test(b.textContent.trim())).click()); await medir('época do ano');
    await caminho({}, 'M6.PF', semM5); await page.evaluate(() => { const d = document.querySelector('#herdadas'); if (d) d.open = true; }); await medir('herdadas');
    await caminho({ 'M6.P01': { tipo: 'texto', v: 'farinha, forno' } }, null); await medir('resultado');
    check('F: summaries e botões do módulo com ≥ 44 px de altura', peq.length === 0, peq.slice(0, 10)); }
  /* ---------- 4. persistência ---------- */
  await caminho({ 'M6.P01': { tipo: 'texto', v: 'Forno e balcão' } }, 'M6.P04');
  await page.evaluate(NA_PAGINA.agir, { tipo: 'multi', vs: ['Pix', 'Outra forma'] });
  await page.reload();
  check('após recarregar: botão "Continuar de onde parei"', (await page.textContent('#ir')).includes('Continuar'));
  await page.click('#ir');
  check('após recarregar abre onde parou (taxa/prazo das formas escolhidas)', (await page.evaluate(NA_PAGINA.atual)) === 'M6.PF');
  await page.click('#v');
  check('Voltar (do topo) reabre a P04 com Pix e Outra forma marcados', (await page.evaluate(NA_PAGINA.atual)) === 'M6.P04'
    && JSON.stringify(await page.$$eval('#ent .opcao.sel', (b) => b.map((x) => x.textContent.trim()))) === '["Pix","Outra forma"]');
  await page.evaluate(() => { localStorage.setItem('lg2-turma-b-m06', JSON.stringify({ R: { 'M6.P05': { estado: 'opcao', opcao: 'Sim' } }, hist: ['M6.P05'], prio: {} })); });
  await page.reload();
  check('respostas guardadas pela versão v0.1 são descartadas (começa do zero)', (await page.textContent('#ir')).includes('Começar'));

  /* ---------- 5. P09 Sim com detalhes aparece no fluxo; texto ao implementador ausente ---------- */
  await caminho({ 'M6.P09': { tipo: 'opcao', v: 'Sim', detalhe: 'Aluguel pago a cada 60 dias' }, 'M6.P06': { tipo: 'texto', v: 'Aluguel e energia' } }, null);
  await abrirResultado();   // o detalhe fica em "Ver o caixa das 13 semanas"
  const fim = nrm(await page.evaluate(() => document.body.innerText));
  check('resultado mostra o detalhe da P09 e as despesas da P06', fim.includes('Aluguel pago a cada 60 dias') && fim.includes('Aluguel e energia'));
  check('resultado não mostra "Retornar à Pxx"', !/Retornar à P\d/.test(fim));
  await olharRafael('RESULTADO');
  check('nenhum texto "Rafael" aparece em nenhuma tela', telasComRafael.length === 0, telasComRafael);
  check('nenhum código de pergunta (P02, M6.P17…) aparece em nenhuma tela', telasComCodigo.length === 0, telasComCodigo.slice(0, 8));
  check('E: nenhum "Módulo" no texto visível (a jornada chama de Etapa)', telasComModulo.length === 0, [...new Set(telasComModulo)].slice(0, 8));
  check('A: nenhum "Seguir"/"Corrigir minha resposta" em nenhuma tela; cada pergunta anda com UM Continuar', passosExtras.length === 0 && doisToques.length === 0, { passosExtras: passosExtras.slice(0, 5), doisToques: doisToques.slice(0, 5) });
  check('G: contador estável em todas as perguntas de todos os caminhos', contadorRuim.length === 0, contadorRuim.slice(0, 6));
  check('no máximo um bloco de atenção por tela (todas as regras e resultados vistos)', telasComVariosAlertas.length === 0, telasComVariosAlertas.slice(0, 8));
  check('sem erro de JavaScript na página', errosJS.length === 0, errosJS);

  /* ---------- prints de celular ---------- */
  if (process.env.SHOTS) {
    const S = process.env.SHOTS, foto = async (n, full) => { await page.waitForTimeout(400); await page.screenshot({ path: path.join(S, `m06_depois_${n}.png`), fullPage: !!full }); };
    await page.evaluate(() => localStorage.clear()); await page.reload(); await foto('capa');
    await caminho({}, 'M6.P02'); await foto('pergunta');
    await page.click('#ns'); await page.evaluate(() => document.querySelector('#ok').click()); await page.evaluate(() => window.scrollTo(0, 0)); await foto('naosei_bloqueia', true);
    await caminho({}, 'M6.P03');
    await page.evaluate(() => document.querySelector('#ent .opcao').click()); await foto('opcao_selecionada');
    await caminho({ 'M6.P04': { tipo: 'multi', vs: ['Pix', 'Cartão de crédito'] } }, 'M6.PF'); await foto('formas', true);
    await caminho({}, 'M6.SZ'); await page.evaluate(NA_PAGINA.agir, { tipo: 'saz', v: 'Sim', fortes: [11, 12], fracos: [1], mais: '50', menos: '30' });
    await page.evaluate(() => { document.querySelector('#erro').hidden = true; window.scrollTo(0, 0); }); await foto('sazonal', true);
    await caminho({ 'M6.P03': { tipo: 'opcao', v: 'Parte à vista e parte parcelado' } }, 'M6.P03A');
    await page.fill('#p-entrada', '1.000,00'); await page.fill('#p-n', '4'); await foto('parcelas');
    const sem = { 'lg2-turma-a-m05': M5, 'lg2-turma-a-m01': M1({ 'M1.P07': { estado: 'opcao', opcao: 'Entre R$ 500 e R$ 1.000' } }) };
    await caminho({}, 'M6.SZ', sem); await page.evaluate(() => { const d = document.querySelector('#herdadas'); if (d) d.open = true; }); await foto('herdadas_trocar');
  }

  console.log('\nDIVERGÊNCIAS DA PLANILHA (relatadas, não falham):');
  divergencias.forEach((d) => console.log('DIVERG ' + d));
  await browser.close(); servidor.close();
  console.log(falhas ? `\n${falhas} FALHA(S)` : '\nTODOS OS TESTES PASSARAM');
  process.exit(falhas ? 1 : 0);
})().catch((e) => { console.error('FAIL erro inesperado:', e); process.exit(1); });
