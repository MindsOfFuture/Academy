/* Teste do LG2 M07 (Turma B) no navegador headless.
   Execute: PW=<caminho do pacote playwright> node tests/lg2-m07-turma-b.cjs
   Opcional: SHOTS=<pasta> grava prints de celular (390x844).
   1) confere as contas com os casos da aba "Cálculos a conferir" do grupo;
   2) alcança cada linha da aba "Caminhos por resposta" e confere o texto exibido;
   3) percorre o módulo do começo ao resumo, com dados herdados dos Módulos 1, 4 e 5, recarrega e retoma;
   6) versão leve: capa curta, "Ver dica" fechada, até 60 palavras por pergunta e ajuda de verdade no "Não sei".
   Sai com código 1 se algo falhar. */
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { chromium } = require(process.env.PW || 'playwright');

const DIR = path.resolve(__dirname, '../public/lg2/turma-b/m07');
const TIPOS = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.webp': 'image/webp' };
const servidor = http.createServer((req, res) => {
  const f = path.join(DIR, decodeURIComponent(req.url.split('?')[0]).replace(/\/$/, '/index.html'));
  if (!f.startsWith(DIR) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': TIPOS[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});
let falhas = 0;
function check(nome, ok, extra) {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${nome}${!ok && extra !== undefined ? ' :: ' + JSON.stringify(extra).slice(0, 500) : ''}`);
  if (!ok) falhas++;
}
const nrm = (s) => String(s || '').replace(/\s+/g, ' ').trim();
const CHAVE = 'lg2-turma-b-m07';

/* ---------- dados ---------- */
const ctx = { window: {} }; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(DIR, 'dados/modulo7.js'), 'utf8'), ctx);
const D = JSON.parse(JSON.stringify(ctx.window ? ctx.window.MODULO7 : ctx.MODULO7));
const Mo = require(path.join(DIR, 'js/motor.js'));

/* ---------- 1. contas: casos da aba "Cálculos a conferir" ---------- */
function contas() {
  const cap = (o) => Mo.capacidade(o);
  let c = cap({ horas: 'Até 10 h', apoio: 'De 3 a 5 h', minUn: 90 });
  check('Caso: capacidade por tempo (serviço) = 3 por semana, no máximo 14 por mês', c.hi.semana === 3 && Mo.texto(c, 'mes') === 'no máximo 14', c);
  check('Caso: arredondamento só no fim do mês (14, não 12)', c.hi.mes === 14);
  c = cap({ horas: 'De 11 a 20 h', apoio: 'Até 2 h', minUn: 60 });
  check('Caso: capacidade em faixa de 38 a 77; volume 120 passa em pelo menos 43', Mo.texto(c, 'mes') === 'de 38 a 77' && Mo.comparar(c, 120).n === 43, c);
  c = cap({ horas: 'Até 10 h', apoio: 'Até 2 h', minUn: 10, equip: { un: 4, minVez: 50 } });
  check('Caso: gargalo de equipamento = 36 por semana, 164 por mês (tempo 48/207)', c.hi.semana === 36 && c.hi.mes === 164 && c.hi.tempo.semana === 48 && c.hi.tempo.mes === 207 && c.limite === 'equipamento', c);
  c = cap({ horas: 'Até 10 h', apoio: 'De 3 a 5 h', ajuda: 4, minUn: 90 });
  check('Caso: ajuda de 4 h = 6 por semana, 25 por mês', c.hi.semana === 6 && c.hi.mes === 25, c);
  check('Caso: apoio maior que as horas = capacidade não calculada', cap({ horas: 'Até 10 h', apoio: 'Mais de 10 h', minUn: 90 }).estado === 'sem-producao');
  c = cap({ horas: 'Até 10 h', apoio: 'De 3 a 5 h', minUn: 90 });
  check('Caso: teste de 10 em 7 dias passa da capacidade semanal de 3', Mo.teste(c, 10, 7).passa === true && Mo.teste(c, 10, 7).semana === 3);
  check('Caso: folga de 14 (volume 50, capacidade 64)', Mo.comparar({ estado: 'ok', modo: 'max', lo: { mes: 64 }, hi: { mes: 64 } }, 50).n === 14);
  c = cap({ horas: 'Mais de 20 h', apoio: 'De 6 a 10 h', minUn: 120 });
  check('Caso: faixa "mais de 20h" = pelo menos 21', Mo.texto(c, 'mes') === 'pelo menos 21', c);
  check('Caso: ponto de pedido = 47', Mo.pontoDePedido(200, 1, 7, 0) === 47);
  check('Caso: compra com perda = 211 (dividir, não multiplicar)', Mo.compraComPerda(200, 5) === 211);
  check('Caso: tudo "Não sei" = capacidade não calculada', cap({ horas: 'Até 10 h', apoio: 'Não sei' }).estado === 'sem-tempo');
  /* --- correções dos testes da turma (05/11), conferidas à mão --- */
  /* bug do testador: 1500 h 12 min por unidade (90.012 min), 11 a 20 h/semana, apoio de 2 h e "1500 h de ajuda".
     Antes: (20 − 2 + 1500) × 60 = 91.080 min/semana → 91.080 × 4,33 ÷ 90.012 = 4,38 → "cerca de 4".
     Agora a ajuda acima de 168 h/semana (impossível) não entra: (20 − 2) × 60 = 1.080 → 1.080 × 4,33 ÷ 90.012 = 0,05 → 0;
     (11 − 2) × 60 = 540 → 0. */
  c = cap({ horas: 'De 11 a 20 h', apoio: 'Até 2 h', ajuda: 1500, minUn: 1500 * 60 + 12 });
  check('Bug 1500 h 12 min + ajuda de 1500 h: cabem 0 por mês (antes: cerca de 4)', c.estado === 'ok' && c.lo.mes === 0 && c.hi.mes === 0 && Mo.texto(c, 'mes') === 'cerca de 0', c);
  c = cap({ horas: 'De 11 a 20 h', apoio: 'Até 2 h', ajuda: 10, minUn: 90012 });
  check('1500 h 12 min com 10 h de ajuda: (20 − 2 + 10) × 60 = 1.680 → 1.680 × 4,33 ÷ 90.012 = 0,08 → 0', c.hi.mes === 0, c);
  /* 168 h ainda conta: (10 − 2 + 168) × 60 = 10.560 min → 176 por semana; 10.560 × 4,33 ÷ 60 = 762,08 → 762 */
  c = cap({ horas: 'Até 10 h', apoio: 'Até 2 h', ajuda: 168, minUn: 60 });
  check('Ajuda de 168 h (a semana inteira) ainda entra: 176 por semana, 762 por mês', c.hi.semana === 176 && c.hi.mes === 762, c);
  /* 169 h não entra: (10 − 2) × 60 = 480 → 8 por semana; 480 × 4,33 ÷ 60 = 34,64 → 34 */
  c = cap({ horas: 'Até 10 h', apoio: 'Até 2 h', ajuda: 169, minUn: 60 });
  check('Ajuda de 169 h (impossível) fica fora da conta: 8 por semana, 34 por mês', c.hi.semana === 8 && c.hi.mes === 34, c);
  check('Limites nomeados: tempo alto 720 min, ajuda 44 h (aviso) e 168 h (máximo), volume 1.000', Mo.LIMITE.minUnAlto === 720 && Mo.LIMITE.ajudaAviso === 44 && Mo.LIMITE.ajudaMax === 168 && Mo.LIMITE.volumeAlto === 1000);
  check('Número "1.500" (ponto de milhar) = 1500; "1,5" = 1,5; "1.5" = 1,5', Mo.num('1.500') === 1500 && Mo.num('1,5') === 1.5 && Mo.num('1.5') === 1.5 && Mo.num('12.345,6') === 12345.6);
  /* reposição: 1.500 por mês ÷ 30 = 50 por dia; 1 por venda e 3 dias de prazo → 150; 12 por venda → 600 por dia, 1.800 */
  check('Reposição: 1.500 por mês = 50 vendas por dia; 1 item por venda = 50 por dia', Mo.vendasDia(1500) === 50 && Mo.consumoDia(1500, 1) === 50);
  check('Reposição: ponto de pedido com 3 dias = 150 (1 por venda) e 1.800 (12 por venda)', Mo.pontoDePedido(1500, 1, 3, 0) === 150 && Mo.pontoDePedido(1500, 12, 3, 0) === 1800 && Mo.pontoDePedido(1500, 1, 3, 20) === 170);
  /* "Cenários do Módulo 6" não é testado: o Módulo 6 publicado não guarda cenários de faturamento */
}

/* ---------- estado-base para abrir cada pergunta ---------- */
const INI = { tipo: 'Produto: eu faço o que vendo', oferta: 'Bolo de pote', estagio: 'Já vendo', horas: 'Até 10 h', volume: '120', item: 'Pote', uso: '1', reposicao: 'Todo mês', regulada: 'Não', de: {} };
const NEUTRO = {
  'M7-01': { estado: 'opcao', opcao: 'Sim, está parecido' },
  'M7-02': { estado: 'valor', h: '0', m: '30', un: '1', min: 30, minUn: 30 },
  'M7-03': { estado: 'opcao', opcao: 'Até 2 h' },
  'M7-04': { estado: 'opcao', opcao: 'Não, faço sozinho(a)', horas: 0 },
  'M7-05': { estado: 'opcao', opcao: 'Meu tempo' },
  'M7-06': { estado: 'partes', p1: 'Dois ou mais', p2: 'De 1 a 3 dias', dias: '' },
  'M7-07': { estado: 'multi', opcoes: ['Prazo de entrega'] },
  'M7-08': { estado: 'opcao', opcao: 'Não' },
  'M7-09': { estado: 'opcao', opcao: 'Sigo um padrão ou receita anotada' },
  'M7-10': { estado: 'multi', opcoes: ['Errar o pedido'] },
  'M7-11': { estado: 'multi', opcoes: ['Pedidos entregues no prazo', 'Horas trabalhadas no negócio'] },
  'M7-12': { estado: 'vazio' },
};
const ORDEM = ['M7-01', 'M7-02', 'M7-03', 'M7-04', 'M7-05', 'M7-05a', 'M7-06', 'M7-07', 'M7-08', 'M7-09', 'M7-10', 'M7-11', 'M7-12'];
function estadoAte(cod, iniExtra, rExtra) {
  const R = {};
  for (const c of ORDEM) { if (c === cod) break; if (NEUTRO[c]) R[c] = NEUTRO[c]; }
  Object.assign(R, rExtra || {});
  return { v: 1, ini: Object.assign({}, INI, iniExtra || {}), R, mapa: null, hist: [], inst: { forn: [], plano: {}, padrao: [], painel: [], folga: '' }, voltarResumo: false };
}

/* fragmentos literais de um texto com [colchetes] */
const fragmentos = (t) => t.replace(/\[Se [^\]]*\]:/g, '').split(/\[[^\]]*\]/).map((x) => nrm(x).replace(/^[.,:;\s]+|[.,:;\s]+$/g, '')).filter((x) => x.length > 3);

(async () => {
  contas();
  await new Promise((r) => servidor.listen(0, '127.0.0.1', r));
  const URL = `http://127.0.0.1:${servidor.address().port}/index.html`;
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const erros = [];
  page.on('pageerror', (e) => erros.push(String(e)));
  const SHOTS = process.env.SHOTS;
  const foto = async (n) => { if (SHOTS) { await page.waitForTimeout(400); await page.screenshot({ path: path.join(SHOTS, n + '.png'), fullPage: n.includes('resumo') }); } };

  await page.goto(URL);
  /* ---------- capa = PDF de abertura ---------- */
  const capa = nrm(await page.innerText('body'));
  const A = D.abertura;
  check('Capa leve: título, uma frase, tempo estimado e Começar', capa.includes(nrm(A.titulo)) && capa.includes(nrm(A.frase)) && capa.includes(`Este módulo leva uns ${A.minutos} minutos`) && (await page.innerText('#ir')).trim() === 'Começar', capa);
  const comoF = await page.evaluate(() => { const d = document.querySelector('details.como-funciona'); return d ? { aberto: d.open, resumo: d.querySelector('summary').textContent.trim(), txt: d.textContent.replace(/\s+/g, ' ') } : null; });
  const faltaCapa = [A.objetivo, ...A.para_voce, ...A.no_final, ...A.nao_faz].filter((t) => !comoF || !comoF.txt.includes(nrm(t)));
  check('Capa: o texto do PDF de abertura fica em "Como funciona", fechado', comoF && !comoF.aberto && comoF.resumo === 'Como funciona' && !faltaCapa.length && !capa.includes(nrm(A.para_voce[0])), [comoF && comoF.aberto, faltaCapa]);
  check('Nenhum "rafael" nos dados públicos', !/rafael/i.test(fs.readFileSync(path.join(DIR, 'dados/modulo7.js'), 'utf8')));
  await foto('m07_01_capa');

  /* ---------- 2. cada linha da aba "Caminhos por resposta" ---------- */
  const abrir = async (st) => {
    await page.evaluate(([k, v]) => { localStorage.clear(); localStorage.setItem(k, JSON.stringify(v)); }, [CHAVE, st]);
    await page.goto(URL);
    await page.click('#ir');
  };
  /* resultado: o retrato completo fica num painel fechado; abre como a pessoa faria (toque no resumo) */
  const abrirRetrato = async () => { if (!(await page.evaluate(() => document.querySelector('#retrato').open))) await page.click('#retrato > summary'); };
  const tocar = (txt) => page.evaluate((t) => {
    const b = [...document.querySelectorAll('.opcao')].find((x) => x.textContent.trim() === t);
    if (!b) throw new Error('opção inexistente: ' + t + ' :: ' + [...document.querySelectorAll('.opcao')].map((x) => x.textContent.trim()).join('|'));
    b.click();
  }, txt);
  const caixa = async () => nrm(await page.evaluate(() => ['#retorno', '#junto', '#b1', '#b2'].map((s) => (document.querySelector(s) || {}).innerText || '').join(' ')));
  const ok = () => page.click('#ok');
  const preenche = (sel, v) => page.fill(sel, v);
  const coberto = new Set();
  async function linha(cod, opcao, montar, acao, nome) {
    const row = D.perguntas.find((q) => q.codigo === cod).caminhos.find((c) => c.opcao === opcao);
    if (!row) return check(`linha existe: ${cod} / ${opcao}`, false);
    await abrir(montar);
    await acao();
    await page.waitForTimeout(60);
    const t = await caixa();
    const falta = row.texto === '—' ? [] : fragmentos(row.texto).filter((f) => !t.includes(f));
    check(`${cod} · ${opcao}${nome ? ' · ' + nome : ''}`, !falta.length, { falta, tela: t });
    if (!falta.length) coberto.add(cod + '|' + opcao);
  }
  const E = estadoAte;
  /* M7-01 */
  await linha('M7-01', 'Sim, está parecido', E('M7-01'), ok);
  await linha('M7-01', 'Ajustei as etapas', E('M7-01'), async () => { await page.fill('.etapa-ed input >> nth=0', 'Receber o pedido'); await ok(); });
  await linha('M7-01', 'Mais de 8 etapas', E('M7-01'), async () => { await page.click('#mais'); await page.fill('.etapa-ed input >> nth=8', 'Pós-venda'); await page.click('#mais'); });
  await linha('M7-01', 'Retirou todas as etapas (vazio)', E('M7-01'), async () => { for (let i = 0; i < 8; i++) await page.click('.etapa-ed .x >> nth=0'); await ok(); });
  await linha('M7-01', 'Não sei', E('M7-01'), () => page.click('#ns'));
  await linha('M7-01', 'Qualquer resposta, com estágio = ideia', E('M7-01', { estagio: 'Ainda é uma ideia' }), async () => {});
  /* M7-02 */
  await linha('M7-02', 'Tempo por unidade', E('M7-02'), async () => { await preenche('#th', '1'); await preenche('#tm', '30'); await ok(); });
  await linha('M7-02', 'Tempo do lote e unidades por lote', E('M7-02'), async () => { await preenche('#th', '1'); await preenche('#tm', '0'); await preenche('#un', '20'); await ok(); });
  await linha('M7-02', 'Tempo zero, negativo ou texto', E('M7-02'), async () => { await preenche('#th', '0'); await preenche('#tm', '0'); await ok(); });
  await linha('M7-02', 'Tempo muito alto (acima de 12 h por unidade; limiar a validar)', E('M7-02'), async () => { await preenche('#th', '90'); await ok(); });
  await linha('M7-02', 'Não sei', E('M7-02'), () => page.click('#ns'));
  /* M7-03 */
  for (const o of ['Até 2 h', 'De 3 a 5 h', 'De 6 a 10 h', 'Mais de 10 h', 'Não sei']) await linha('M7-03', o, E('M7-03'), () => tocar(o));
  /* M7-04 */
  for (const o of ['Não, faço sozinho(a)', 'Sim, sem pagamento (família, amigo, parceiro)', 'Sim, pago alguém', 'Não sei']) await linha('M7-04', o, E('M7-04'), () => tocar(o));
  await linha('M7-04', 'Horas inválidas (negativo ou texto)', E('M7-04'), async () => { await tocar('Sim, pago alguém'); await preenche('#hajuda', '-3'); await ok(); });
  /* M7-05 */
  for (const o of ['Meu tempo', 'Um equipamento ou o espaço', 'Uma etapa que demora ou acumula', 'Falta ou atraso de material', 'Não sei']) await linha('M7-05', o, E('M7-05'), () => tocar(o));
  /* M7-05a */
  const e5a = E('M7-05a', {}, { 'M7-05': { estado: 'opcao', opcao: 'Um equipamento ou o espaço' } });
  await linha('M7-05a', 'Unidades por vez e tempo por vez', e5a, async () => { await preenche('#uv', '4'); await preenche('#tvm', '50'); await ok(); });
  await linha('M7-05a', 'Valor inválido (zero, negativo ou texto)', e5a, async () => { await preenche('#uv', '0'); await preenche('#tvm', '50'); await ok(); });
  await linha('M7-05a', 'Não sei', e5a, () => page.click('#ns'));
  /* M7-06 */
  for (const o of ['Só um', 'Dois ou mais', 'Ainda não procurei', 'Não sei']) await linha('M7-06', 'Parte 1: ' + o, E('M7-06'), () => tocar(o));
  await linha('M7-06', 'Parte 2: No mesmo dia ou compro na hora', E('M7-06'), () => tocar('No mesmo dia ou compro na hora'));
  await linha('M7-06', 'Parte 2: De 1 a 3 dias / De 4 a 7 dias', E('M7-06'), () => tocar('De 1 a 3 dias'), '1 a 3');
  await linha('M7-06', 'Parte 2: De 1 a 3 dias / De 4 a 7 dias', E('M7-06'), () => tocar('De 4 a 7 dias'), '4 a 7');
  await linha('M7-06', 'Parte 2: Mais de 7 dias', E('M7-06'), () => tocar('Mais de 7 dias'));
  await linha('M7-06', 'Parte 2: Não sei', E('M7-06'), async () => { await page.evaluate(() => { const bs = [...document.querySelectorAll('.opcao')].filter((x) => x.textContent.trim() === 'Não sei'); bs[1].click(); }); });
  /* M7-07 */
  await linha('M7-07', 'De 1 a 3 critérios', E('M7-07'), async () => { await tocar('Prazo de entrega'); await tocar('Pedido mínimo'); });
  await linha('M7-07', 'Mais de 3 critérios', E('M7-07'), async () => { for (const o of ['Prazo de entrega', 'Pedido mínimo', 'Frete', 'Troca ou devolução']) await tocar(o); });
  await linha('M7-07', 'Só o preço', E('M7-07'), () => tocar('Só o preço'));
  await linha('M7-07', 'Nota fiscal e origem comprovada', E('M7-07'), () => tocar('Nota fiscal e origem comprovada'));
  await linha('M7-07', 'Não sei', E('M7-07'), () => tocar('Não sei'));
  /* M7-08 */
  for (const o of ['Sim, em poucos dias', 'Sim, em semanas ou meses', 'Não', 'Não sei']) await linha('M7-08', o, E('M7-08'), () => tocar(o));
  /* M7-09 */
  for (const o of ['Sigo um padrão ou receita anotada', 'Confiro no olho ou provando, sem nada anotado', 'Fico sabendo pelo cliente', 'Ainda não confiro', 'Não sei']) await linha('M7-09', o, E('M7-09'), () => tocar(o));
  await linha('M7-09', 'Qualquer resposta, com atividade regulada em M4-11', E('M7-09', { regulada: 'Sim' }), () => tocar('Ainda não confiro'));
  /* M7-10 */
  for (const o of ['Atrasar a entrega', 'Errar o pedido', 'Produto chegar danificado ou estragado', 'Faltar material', 'Equipamento quebrar', 'Eu ficar doente ou sem tempo', 'Não sei']) await linha('M7-10', o, E('M7-10'), () => tocar(o));
  await linha('M7-10', 'Outro', E('M7-10'), async () => { await tocar('Outro'); await ok(); });
  await linha('M7-10', 'Mais de 3 opções', E('M7-10'), async () => { for (const o of ['Atrasar a entrega', 'Errar o pedido', 'Faltar material', 'Equipamento quebrar']) await tocar(o); });
  /* M7-11 (já vem com sugestões marcadas) */
  await linha('M7-11', '2 ou 3 números', E('M7-11'), async () => {});
  await linha('M7-11', '1 número', E('M7-11'), async () => { await tocar('Quantidade feita ou atendida na semana'); await tocar('Pedidos entregues no prazo'); });
  await linha('M7-11', 'Mais de 3 números', E('M7-11', {}, { 'M7-05': { estado: 'opcao', opcao: 'Meu tempo' } }), async () => { await tocar('Reclamações ou refações'); await tocar('Vezes que faltou material'); });
  await linha('M7-11', 'Não sei', E('M7-11'), () => tocar('Não sei'));
  /* M7-12 */
  await linha('M7-12', 'Texto preenchido', E('M7-12'), async () => { await preenche('#txt', 'Ver se preciso de alvará.'); await ok(); });
  await linha('M7-12', 'Em branco', E('M7-12'), ok);
  /* M7-13: no resumo */
  const tudo = estadoAte('ZZ');
  for (const o of ['Sim, pode seguir', 'Quero corrigir algo']) {
    await linha('M7-13', o, tudo, async () => {
      await page.evaluate((t) => [...document.querySelectorAll('#op13 .opcao')].find((x) => x.textContent.trim() === t).click(), o);
      await page.waitForTimeout(60);
      await page.evaluate(() => { const r = document.querySelector('#retorno') || document.body.appendChild(Object.assign(document.createElement('div'), { id: 'retorno' })); r.innerText = document.querySelector('#ret13').innerText; });
    });
  }
  const todas = D.perguntas.flatMap((q) => q.caminhos.map((c) => q.codigo + '|' + c.opcao));
  const nao = todas.filter((k) => !coberto.has(k));
  check(`Linhas da aba "Caminhos por resposta" alcançadas: ${todas.length - nao.length} de ${todas.length}`, !nao.length, nao);

  /* ---------- 2b. etapas móveis (relato das alunas, 05/11): instrução + ▲/▼ acessíveis, por toque ---------- */
  {
    const valores = () => page.$$eval('.etapa-ed input', (xs) => xs.map((x) => x.value));
    await abrir(E('M7-01'));
    check('Etapas: instrução diz que dá para mudar a ordem com as setas', nrm(await page.innerText('#dica-ordem')) === 'Você pode mudar a ordem: use as setas para subir ou descer a etapa.');
    const nEt = await page.locator('.etapa-ed').count();
    const sobe = page.getByRole('button', { name: 'Subir etapa', exact: true }), desce = page.getByRole('button', { name: 'Descer etapa', exact: true });
    check('Etapas: um ▲ "Subir etapa" e um ▼ "Descer etapa" por etapa (primeira não sobe, última não desce)', (await sobe.count()) === nEt && (await desce.count()) === nEt && await sobe.first().isDisabled() && await desce.last().isDisabled() && (await sobe.nth(1).textContent()) === '▲' && (await desce.first().textContent()) === '▼');
    const bb = await sobe.nth(1).boundingBox();
    check('Etapas: setas com área de toque de pelo menos 36 × 44 px', bb && bb.width >= 36 && bb.height >= 44, bb);
    const v0 = await valores();
    await desce.first().click();
    const v1 = await valores();
    check('Etapas: "Descer etapa" troca a 1ª com a 2ª', v1[0] === v0[1] && v1[1] === v0[0] && v1.slice(2).join('|') === v0.slice(2).join('|'), v1);
    check('Etapas: depois de mover, o foco acompanha a etapa (2ª linha)', await page.evaluate(() => { const a = document.activeElement; return !!a && a.dataset.a === 'desce' && a.getAttribute('aria-describedby') === 'etapa-1'; }));
    await page.click('#mais');
    await page.fill('.etapa-ed input >> nth=-1', 'Separar a encomenda');
    check('Etapas: etapa incluída avisa que pode subir até o lugar certo', /Etapa incluída no fim\. Toque em ▲/.test(await page.innerText('.mapa-edit')));
    if (process.env.SHOTS7B) { await page.locator('.etapa-ed.nova').scrollIntoViewIfNeeded(); await page.waitForTimeout(400); await page.screenshot({ path: path.join(process.env.SHOTS7B, 'm07b_etapa_incluida_setas.png') }); }
    await sobe.last().click(); await sobe.nth(nEt - 1).click();
    const v2 = await valores();
    check('Etapas: a etapa nova sobe duas posições com "Subir etapa"', v2.length === nEt + 1 && v2[nEt - 2] === 'Separar a encomenda' && v2[nEt] === v0[nEt - 1], v2);
    await ok();
    const retorno = await caixa();
    await ok();
    const st = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)), CHAVE);
    check('Etapas: a nova ordem é gravada (mapa salvo e resposta "Ajustei as etapas")', st.mapa && st.mapa.join('|') === v2.join('|') && st.R['M7-01'] && st.R['M7-01'].opcao === 'Ajustei as etapas' && fragmentos(D.perguntas[0].caminhos.find((c) => c.opcao === 'Ajustei as etapas').texto).every((f) => retorno.includes(f)), [st.mapa, st.R['M7-01'], retorno]);
    /* por toque (celular): mesma tela num contexto com tela de toque */
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    const tp = await ctx.newPage();
    await tp.goto(URL);
    await tp.evaluate(([k, v]) => { localStorage.clear(); localStorage.setItem(k, JSON.stringify(v)); }, [CHAVE, E('M7-01')]);
    await tp.goto(URL); await tp.click('#ir');
    const t0 = await tp.$$eval('.etapa-ed input', (xs) => xs.map((x) => x.value));
    await tp.getByRole('button', { name: 'Subir etapa', exact: true }).nth(2).tap();
    const t1 = await tp.$$eval('.etapa-ed input', (xs) => xs.map((x) => x.value));
    check('Etapas: ▲ funciona por toque (3ª etapa sobe para 2ª)', t1[1] === t0[2] && t1[2] === t0[1], t1);
    await ctx.close();
  }

  /* ---------- 3. percurso completo com dados herdados ---------- */
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('lg2-turma-a-m01', JSON.stringify({ v: 9, R: { 'M1.P01': { estado: 'opcao', opcao: 'Já vendo sempre' }, 'M1.P03': { estado: 'valor', valor: 'Pão caseiro' }, 'M1.P08': { estado: 'opcao', opcao: 'Ainda não sei fazer direito' } } }));
    localStorage.setItem('lg2-turma-a-m04', JSON.stringify({ R: { 'M4.P15': { estado: 'opcao', opcao: 'Sim' }, 'M4.P19': { estado: 'valor', valor: '60 pedidos' }, 'M4.P20': { estado: 'valor', valor: '7' } } }));
    localStorage.setItem('lg2-turma-a-m05', JSON.stringify({ versao: 9, R: { 'M5.P01': { estado: 'opcao', opcao: 'Produto: eu compro materiais e faço o que vendo' }, 'M5.P02': { estado: 'valor', valor: 'Pão de fermentação natural' }, 'M5.P03': { estado: 'valor', valor: ['Farinha', 'Sal'] }, 'M5.P06': { estado: 'valor', valor: [{ q: '1', u: 'kg' }, { q: '20', u: 'g' }] }, 'M5.P07': { estado: 'valor', valor: '10' }, 'M5.P26': { estado: 'opcao', opcao: 'Sim' }, 'M5.P37': { estado: 'valor', valor: '200' } } }));
  });
  await page.goto(URL);
  await page.click('#ir');
  const partida = nrm(await page.innerText('body'));
  check('Partida traz a oferta do Módulo 5', (await page.inputValue('#f-oferta')) === 'Pão de fermentação natural');
  check('Partida marca o tipo e o estágio herdados e mostra "Veio do Módulo"', /Veio do Módulo 5/.test(partida) && /Veio do Módulo 1/.test(partida) && await page.evaluate(() => document.querySelector('[data-campo="tipo"] .opcao.sel').textContent.trim().startsWith('Produto')));
  check('Partida traz volume, item e teste herdados (só o número de "60 pedidos")', (await page.inputValue('#f-volume')) === '200' && (await page.inputValue('#f-item')) === 'Farinha' && (await page.inputValue('#f-testeN')) === '60');
  check('Herança: quantidade da farinha por unidade = 1 kg ÷ 10 pães = 0,1 (em kg), com selo', (await page.inputValue('#f-uso')) === '0,1' && /\(em kg\)\s*Veio do Módulo 5/.test(nrm(await page.innerText('label[for="f-uso"]'))), nrm(await page.innerText('label[for="f-uso"]')));
  await page.fill('#f-item', 'Sal'); await page.dispatchEvent('#f-item', 'change');
  check('Trocar o item para outro material do Módulo 5 traz a quantidade dele (20 g ÷ 10 = 2 g)', (await page.inputValue('#f-uso')) === '2' && /\(em g\)/.test(await page.innerText('label[for="f-uso"]')));
  await page.fill('#f-item', 'Farinha'); await page.dispatchEvent('#f-item', 'change');
  await foto('m07_02_partida');
  await tocar('Até 10 h');
  await preenche('#f-uso', '0,5');
  await tocar('Toda semana');
  /* bug do testador: perda em branco ("deixe em branco se não sabe") tem de passar */
  await preenche('#f-perda', '-2');
  await ok();
  const errPerda = nrm(await page.innerText('#e-perda'));
  check('Perda inválida: mensagem simples ao lado do campo (sem "do teste")', errPerda === 'Use um número de 0 a 99, ou deixe em branco.' && !/do teste/.test(nrm(await page.innerText('body'))), errPerda);
  await preenche('#f-testeN', 'muitos');
  await preenche('#f-perda', '');
  await ok();
  check('Número do teste inválido: "Use só números iguais ou maiores que zero" no próprio campo', nrm(await page.innerText('#e-testeN')) === 'Use só números iguais ou maiores que zero, ou deixe em branco.' && await page.isHidden('#e-perda'));
  await foto('m07_08_erro_campo');
  await preenche('#f-testeN', '60');
  await ok();
  check('Perda em branco é aceita (vira "não sei")', !!(await page.$('#pergunta')));
  /* volta e põe a perda de 5% para a conta da compra */
  await page.click('#v');
  await preenche('#f-perda', '5%');
  await ok();
  check('Primeira pergunta = mapa do processo com o modelo de fabricação', /Este é o caminho de Pão de fermentação natural/.test(nrm(await page.innerText('#pergunta'))) && (await page.locator('.etapa-ed').count()) === 8);
  await foto('m07_03_mapa');
  await ok(); await ok();
  check('M7-02: unidades por vez vêm do rendimento da receita (Módulo 5), com selo', (await page.inputValue('#un')) === '10' && /Veio do Módulo 5/.test(await page.innerText('#ent')) && /Confira ou ajuste/.test(await page.innerText('#ent')));
  await foto('m07_04_tempo');
  await preenche('#un', '1');
  await preenche('#th', '0'); await preenche('#tm', '10'); await ok();
  check('M7-02 mostra "Anotado: cerca de 10 min por unidade"', /Anotado: cerca de 10 min por unidade/.test(await caixa()), await caixa());
  await ok();
  await tocar('Até 2 h'); await ok();
  await tocar('Não, faço sozinho(a)'); await ok();
  await tocar('Um equipamento ou o espaço'); await ok();
  await preenche('#uv', '4'); await preenche('#tvm', '50'); await ok();
  check('M7-05a mostra a conta do forno: 36 por semana', /cabem cerca de 36 por semana/.test(await caixa()), await caixa());
  await foto('m07_05_equipamento');
  await ok();
  check('Fase "Fornecedores e estoque" aparece para fabricação (pergunta dos fornecedores)', /quantos fornecedores você tem/.test(nrm(await page.innerText('#pergunta'))), await page.innerText('#pergunta'));
  await tocar('Só um'); await tocar('Mais de 7 dias'); await preenche('#dias', '10');
  await foto('m07_06_fornecedor');
  await ok();
  await tocar('Qualidade que não varia'); await tocar('Prazo de entrega'); await ok();
  await tocar('Sim, em poucos dias'); await ok();
  await tocar('Fico sabendo pelo cliente'); await ok();
  await tocar('Atrasar a entrega'); await tocar('Faltar material'); await ok();
  const sug = await page.evaluate(() => [...document.querySelectorAll('.opcao.sel')].map((x) => x.textContent.trim()));
  check('M7-11 vem com sugestões ligadas ao gargalo e aos riscos', sug.includes('Quantidade feita ou atendida na semana') && sug.includes('Reclamações ou refações') && sug.length <= 3, sug);
  await ok();
  await preenche('#txt', 'Ver a licença da vigilância.'); await ok(); await ok();
  check('Resultado leve: o retrato completo começa fechado, com o essencial à vista', await page.evaluate(() => { const d = document.querySelector('#retrato'); return !!d && !d.open && !!document.querySelector('#entendemos') && !!document.querySelector('#proximos') && !d.contains(document.querySelector('#entendemos')); }));
  check('Resultado: Fornecedores e estoque na barra de fases (fabricação)', /Fornecedores e estoque/.test(nrm(await page.innerText('.etapas'))));
  await abrirRetrato();
  const res = nrm(await page.innerText('body'));
  if (process.env.DUMP) fs.writeFileSync(process.env.DUMP, res);
  check('Resumo: capacidade do forno no máximo 36 por semana e 164 por mês', /no máximo 36/.test(res) && /no máximo 164/.test(res), res.slice(0, 600));
  check('Resumo: volume 200 passa da capacidade (cruzamento do Módulo 5)', res.includes('Você pretende 200 por mês, e com o tempo informado cabem cerca de 164. Quer rever algum desses números?'));
  check('Resumo: teste de 60 em 7 dias acima da capacidade semanal', /Seu teste pede 60 em 7 dias/.test(res));
  check('Resumo: encaminhamento de atividade regulada', res.includes(D.resumo.cruzamentos.find((x) => x.quando.startsWith('Atividade regulada')).mensagem));
  check('Resumo: no máximo 3 alertas', (await page.locator('section.cartao .bloco.b-alerta, section.cartao .bloco.b-proximo').filter({ hasNot: page.locator('xx') }).count()) <= 4);
  const pp = Mo.pontoDePedido(200, 0.5, 10, 0);
  check(`Resumo: ponto de pedido com prazo de 10 dias = ${pp}`, new RegExp(`quando restarem ${pp}\\b`, 'i').test(res), pp);
  check('Resumo: compra do mês com perda de 5% = 106', /perda de 5%: 106/.test(res));
  /* "Como calculamos" embaixo dos números (relato das alunas, 05/11) */
  check('Como calculamos (capacidade do forno): 480 min ÷ 50 min = 9 vezes × 4 = 36 por semana; no mês 164', nrm(await page.innerText('#como-capacidade')) === 'Como calculamos: 10 h por semana − 2 h de tarefas de apoio = 480 min para fazer; 480 min ÷ 50 min por vez = 9 vezes × 4 por vez = 36 por semana. No mês (4,33 semanas) = 164.', nrm(await page.innerText('#como-capacidade')));
  check('Como calculamos (compra do mês): 200 × 0,5 kg = 100 kg ÷ 95% = 106', nrm(await page.innerText('#como-compra')) === 'Como calculamos: 200 por mês × 0,5 kg em cada um = 100 kg; com a perda de 5%, dividimos por 95% (o que sobra depois da perda) = 106 (arredondado para cima).', nrm(await page.innerText('#como-compra')));
  check(`Como calculamos (reposição): ${pp} kg com 10 dias de prazo`, nrm(await page.innerText('#como-reposicao')).startsWith('Como calculamos: ') && nrm(await page.innerText('#como-reposicao')).includes(`× 10 dias de prazo do fornecedor = ${pp} kg`), nrm(await page.innerText('#como-reposicao')));
  check('Como calculamos: fonte menor que o texto do resultado', await page.evaluate(() => parseFloat(getComputedStyle(document.querySelector('.como-calc')).fontSize) < parseFloat(getComputedStyle(document.querySelector('.diag-r')).fontSize)));
  check('Resumo: checklist tem fornecedor único, prazo longo, validade curta e atividade regulada', ['Depender de um só fornecedor', 'Prazo de entrega do fornecedor acima de 7 dias', 'Itens que estragam em poucos dias', 'Atividade com regras próprias'].every((x) => res.includes(x)));
  check('Resumo: avisos dos instrumentos', D.instrumentos.every((i) => res.includes(nrm(i.avisos[0]).replace('[fizer] [oferta em foco]', 'fizer Pão de fermentação natural'))), D.instrumentos.map((i) => i.avisos[0]).filter((a) => !res.includes(a)));
  const ent = nrm(await page.innerText('#entendemos'));
  check('Resultado: caixa "O que entendemos até aqui" acima do retrato', await page.evaluate(() => { const a = document.querySelector('#entendemos'), b = document.querySelector('.concluido'); return !!a && !!b && !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING); }));
  check('Entendemos: oferta, tipo e estágio', ent.includes('Você oferece Pão de fermentação natural, um produto que você mesmo faz, e já vende.'), ent);
  check('Entendemos: capacidade e volume', ent.includes('Com até 10 horas por semana e cerca de 10 min para fazer cada um, cabem no máximo 164 por mês.') && ent.includes('Você quer vender 200 por mês, mais do que cabe hoje'), ent);
  check('Entendemos: gargalo e fornecedor único', ent.includes('O que mais segura o seu ritmo hoje é um equipamento ou o espaço.') && ent.includes('Você depende de um só fornecedor para Farinha'), ent);
  /* texto corrido (relatório do Bento): frases agrupadas por assunto em 1 a 3 parágrafos, sem lista */
  check('Entendemos: texto corrido em 1 a 3 parágrafos, sem <li> e com <p>', await page.evaluate(() => { const e = document.querySelector('#entendemos'), n = e.querySelectorAll('p').length; return !e.querySelector('ul, ol, li') && n >= 1 && n <= 3; }));
  { const ps = await page.$$eval('#entendemos p', (x) => x.map((e) => e.textContent.replace(/\s+/g, ' ')));
    check('Entendemos: parágrafos por assunto (oferta · tempo e meta · o que segura o ritmo)', ps.length === 3 && ps[0].startsWith('Você oferece') && /cabem/.test(ps[1]) && /ritmo/.test(ps[2]), ps); }
  check('Sem código interno na tela (M7-, M4-, M5-)', !/\bM\d-\d/.test(res), (res.match(/.{20}\bM\d-\d.{20}/) || [])[0]);
  await foto('m07_07_resumo');
  /* instrumento: quadro de fornecedores conta critérios sem voltar ao topo */
  await page.evaluate(() => document.querySelector('.forn').scrollIntoView());
  const y0 = await page.evaluate(() => window.scrollY);
  await page.selectOption('.forn >> nth=0 >> select >> nth=0', 'atende');
  await page.waitForTimeout(100);
  check('Quadro de fornecedores conta 1 de 2 sem voltar ao topo', /Atende 1 de 2/.test(await page.innerText('.forn >> nth=0')) && Math.abs((await page.evaluate(() => window.scrollY)) - y0) < 5);
  /* M7-13: confirmar libera o próximo módulo */
  await page.evaluate(() => [...document.querySelectorAll('#op13 .opcao')].find((x) => x.textContent.trim() === 'Sim, pode seguir').click());
  check('Confirmar o retrato mostra o link para o Módulo 8', await page.isVisible('.lg2-proximo a[href="/lg2/turma-b/m08/index.html"]'));
  /* corrigir volta ao resumo */
  await page.evaluate(() => [...document.querySelectorAll('#op13 .opcao')].find((x) => x.textContent.trim() === 'Quero corrigir algo').click());
  await page.evaluate(() => document.querySelector('[data-c="M7-03"]').click());
  await tocar('De 6 a 10 h'); await ok();
  check('Corrigir uma resposta volta direto ao resumo', /Você chegou ao retrato da sua operação/.test(await page.innerText('body')));
  /* recarrega e retoma */
  await page.reload();
  check('Recarregar: capa oferece "Continuar de onde parei"', /Continuar de onde parei/.test(await page.innerText('#ir')));
  await page.click('#ir');
  check('Recarregar: retoma no resumo', /Você chegou ao retrato da sua operação/.test(await page.innerText('body')));
  /* serviço sem material: 3 fases, sem fornecedores */
  await abrir(estadoAte('ZZ', { tipo: 'Serviço: atendo o cliente', material: 'Não', oferta: 'Manicure' }));
  const fs3 = await page.evaluate(() => [...document.querySelectorAll('.etapas li')].map((x) => x.textContent.trim()));
  check('Serviço sem material: barra com 3 fases', fs3.length === 3 && !fs3.includes('Fornecedores e estoque'), fs3);
  await abrir(estadoAte('M7-01', { tipo: 'Serviço: atendo o cliente', material: 'Não', oferta: 'Manicure' }));
  await ok(); await ok();
  check('Serviço: a pergunta de tempo usa "atender"', /Quanto tempo você leva para atender Manicure\?/.test(await page.innerText('#pergunta')), await page.innerText('#pergunta'));
  /* serviço (lava-jato do testador): tipo do Módulo 1, volume, material e tempo do Módulo 5 */
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('lg2-turma-a-m01', JSON.stringify({ R: { 'M1.P01': { estado: 'opcao', opcao: 'Ainda está só na minha cabeça' }, 'M1.P03': { estado: 'valor', valor: 'Lavagem de carro em casa' }, 'M1.P03A': { estado: 'opcao', opcao: 'Serviço: meu cliente paga pelo trabalho que realizo' } } }));
    localStorage.setItem('lg2-turma-a-m03', JSON.stringify({ R: { 'M3.P11': { estado: 'valor', valor: 'Falta de tempo para levar o carro ao lava-jato' } } }));
    localStorage.setItem('lg2-turma-a-m05', JSON.stringify({ versao: 3, R: { 'M5.P18': { estado: 'opcao', opcao: 'Sim' }, 'M5.P19': { estado: 'valor', valor: ['Shampoo automotivo', 'Cera'] }, 'M5.P22': { estado: 'valor', valor: [{ q: '200', u: 'ml' }, { q: '50', u: 'g' }] }, 'M5.P23': { estado: 'valor', valor: { h: '1', m: '30' } }, 'M5.P37': { estado: 'valor', valor: '40' } } }));
  });
  await page.goto(URL);
  await page.click('#ir');
  check('Serviço: tipo vem do Módulo 1 (nova pergunta do tipo)', await page.evaluate(() => document.querySelector('[data-campo="tipo"] .opcao.sel').textContent.trim().startsWith('Serviço')) && /Veio do Módulo 1/.test(await page.innerText('[data-campo="tipo"] legend')));
  check('Serviço: volume 40, material, item e quantidade por atendimento (200 ml) herdados do Módulo 5', (await page.inputValue('#f-volume')) === '40' && (await page.inputValue('#f-item')) === 'Shampoo automotivo' && (await page.inputValue('#f-uso')) === '200' && /\(em ml\)/.test(await page.innerText('label[for="f-uso"]')) && /Veio do Módulo 5/.test(await page.innerText('label[for="f-volume"]')));
  check('Serviço: tempo de 90 min herdado do Módulo 5', (await page.inputValue('#f-minUn')) === '90');
  await foto('m07_09_partida_servico');
  await tocar('Até 10 h');
  await ok();
  check('Serviço com tempo herdado: pula a pergunta de tempo', !/Quanto tempo você leva/.test(await page.innerText('body')));
  await page.evaluate(([k]) => { const s = JSON.parse(localStorage.getItem(k)); s.R = { 'M7-01': { estado: 'opcao', opcao: 'Sim, está parecido' }, 'M7-03': { estado: 'opcao', opcao: 'Até 2 h' }, 'M7-04': { estado: 'opcao', opcao: 'Não, faço sozinho(a)', horas: 0 }, 'M7-05': { estado: 'opcao', opcao: 'Meu tempo' }, 'M7-06': { estado: 'partes', p1: 'Dois ou mais', p2: 'De 1 a 3 dias', dias: '' }, 'M7-07': { estado: 'multi', opcoes: ['Prazo de entrega'] }, 'M7-08': { estado: 'opcao', opcao: 'Não' }, 'M7-09': { estado: 'opcao', opcao: 'Confiro no olho ou provando, sem nada anotado' }, 'M7-10': { estado: 'multi', opcoes: ['Errar o pedido'] }, 'M7-11': { estado: 'multi', opcoes: ['Pedidos entregues no prazo'] }, 'M7-12': { estado: 'vazio' } }; localStorage.setItem(k, JSON.stringify(s)); }, [CHAVE]);
  await page.goto(URL); await page.click('#ir');
  const entS = nrm(await page.innerText('#entendemos'));
  check('Entendemos (serviço): ideia, cliente, capacidade e volume', entS.includes('Você oferece Lavagem de carro em casa, um serviço, e ainda está na fase da ideia.') && entS.includes('Seu cliente procura você por isto: Falta de tempo para levar o carro ao lava-jato.') && entS.includes('cerca de 1 h 30 min para atender cada um, cabem no máximo 23 por mês') && entS.includes('Você quer vender 40 por mês, mais do que cabe hoje'), entS);
  check('Serviço: botão final continua escondido até "Sim, pode seguir"', await page.isHidden('.lg2-proximo'));
  await foto('m07_10_entendemos');

  /* ---------- 4. correções dos testes da turma (05/11) ---------- */
  /* 4a. cenário do testador: mercadoria, 1500 h 12 min herdado do Módulo 5 e 1.500 vendas por mês */
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('lg2-turma-a-m01', JSON.stringify({ R: { 'M1.P01': { estado: 'opcao', opcao: 'Já vendo sempre' }, 'M1.P03': { estado: 'valor', valor: 'Bolo de pote' }, 'M1.P03A': { estado: 'opcao', opcao: 'Mercadoria: compro pronto e revendo' } } }));
    localStorage.setItem('lg2-turma-a-m05', JSON.stringify({ versao: 3, R: { 'M5.P01': { estado: 'opcao', opcao: 'Mercadoria: compro pronto para revender' }, 'M5.P23': { estado: 'valor', valor: { h: '1500', m: '12' } }, 'M5.P37': { estado: 'valor', valor: '1.500' } } }));
  });
  await page.goto(URL); await page.click('#ir');
  check('Testador: tempo de 1500 h 12 min herdado (90.012 min) e volume "1.500" lido como 1500', (await page.inputValue('#f-minUn')) === '90012' && Mo.num(await page.inputValue('#f-volume')) === 1500, [await page.inputValue('#f-minUn'), await page.inputValue('#f-volume')]);
  await tocar('De 11 a 20 h');
  await preenche('#f-volume', '60 pedidos'); await ok();
  check('Receita B: texto em campo de número é recusado ("60 pedidos")', /Use só números/.test(await page.innerText('#e-volume')) && !(await page.$('#pergunta')));
  await preenche('#f-volume', '1.500'); await ok();
  const avP = nrm(await page.innerText('#e-minUn')) + ' | ' + nrm(await page.innerText('#e-volume'));
  check('Partida: tempo de 1500 h 12 min e 1.500 por mês geram aviso, sem gravar', /1500 h 12 min para cada unidade ou atendimento parece muito tempo/.test(avP) && /cerca de 50 por dia/.test(avP) && !(await page.$('#pergunta')) && (await page.innerText('#ok')).trim() === 'Continuar mesmo assim', avP);
  await page.waitForTimeout(400);
  if (SHOTS) await page.screenshot({ path: path.join(SHOTS, 'm07_aviso_tempo_partida.png') });
  await ok();
  check('Partida: o segundo Continuar com os mesmos valores segue', !!(await page.$('#pergunta')));
  /* 4b. horas de ajuda: 1500 é impossível (trava), 50 é alto (aviso que não trava) */
  await abrir(E('M7-04'));
  await tocar('Sim, sem pagamento (família, amigo, parceiro)');
  await preenche('#hajuda', '1500'); await ok();
  check('Ajuda de 1500 h por semana: recusada ("Uma semana tem 168 horas")', /Uma semana tem 168 horas/.test(await page.innerText('#erro')) && /Horas de ajuda/.test(await page.innerText('body')) && !(await page.evaluate((k) => JSON.parse(localStorage.getItem(k)).R['M7-04'], CHAVE)));
  await preenche('#hajuda', '50'); await ok();
  check('Ajuda de 50 h: aviso "mais que uma jornada inteira" sem gravar', /mais que uma jornada inteira/.test(await page.innerText('#erro')) && !(await page.evaluate((k) => JSON.parse(localStorage.getItem(k)).R['M7-04'], CHAVE)));
  await ok();
  check('Ajuda de 50 h: o segundo Continuar grava e segue', (await page.evaluate((k) => JSON.parse(localStorage.getItem(k)).R['M7-04'], CHAVE) || {}).horas === 50);
  /* 4c. resultado do testador (estado antigo com 1500 h de ajuda): cabe 0, sem "cerca de 4" */
  const iniTestador = { tipo: 'Mercadoria: compro pronto para revender', oferta: 'Bolo de pote', horas: 'De 11 a 20 h', volume: '1500', minUn: 90012, item: 'Bolo de pote', uso: '1', usoUn: '' };
  await abrir(E('ZZ', iniTestador, { 'M7-04': { estado: 'opcao', opcao: 'Sim, sem pagamento (família, amigo, parceiro)', horas: 1500 }, 'M7-06': { estado: 'partes', p1: 'Dois ou mais', p2: 'De 1 a 3 dias', dias: '' } })); await abrirRetrato();
  const resT = nrm(await page.innerText('body')), entT = nrm(await page.innerText('#entendemos'));
  check('Resultado do testador: cabem cerca de 0 por mês, nunca "cerca de 4"', entT.includes('cerca de 1500 h 12 min para separar e entregar cada um, cabem cerca de 0 por mês') && !/cerca de 4\b/.test(resT), entT);
  check('Resultado do testador: aviso de tempo por unidade muito alto', /Você informou 1500 h 12 min para separar e entregar cada unidade/.test(await page.innerText('#aviso-tempo')));
  check('Reposição: 1.500 por mês ÷ 30 dias = cerca de 50 por dia; 3 dias de prazo = 150', resT.includes('Vendas por dia: 1.500 por mês ÷ 30 dias = cerca de 50 por dia.') && /quando restarem 150\b/i.test(resT) && resT.includes('50 × 3 = 150') && !/\b600\b/.test(resT), (resT.match(/Lembrete de reposição.{0,400}/) || [])[0]);
  check('Como calculamos (reposição do testador): 50 por dia × 3 dias = 150', nrm(await page.innerText('#como-reposicao')) === 'Como calculamos: 50 por dia × 3 dias de prazo do fornecedor = 150 (arredondado para cima).', nrm(await page.innerText('#como-reposicao')));
  await page.evaluate(() => document.querySelector('#conta-reposicao').scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(400);
  if (SHOTS) await page.screenshot({ path: path.join(SHOTS, 'm07_reposicao.png') });
  /* 4d. sem ajuda x com ajuda: tabela e resumo dizem as duas coisas.
     Até 10 h, apoio 2 h, 60 min por unidade. Sem ajuda: 8 h = 480 min → 480 × 4,33 ÷ 60 = 34,6 → 34.
     Com 4 h de ajuda: 12 h = 720 min → 720 × 4,33 ÷ 60 = 51,96 → 51. */
  await abrir(E('ZZ', { minUn: 60 }, { 'M7-04': { estado: 'opcao', opcao: 'Sim, sem pagamento (família, amigo, parceiro)', horas: 4 } })); await abrirRetrato();
  const entA = nrm(await page.innerText('#entendemos')), tabA = nrm(await page.innerText('#sem-com'));
  check('Sem/com ajuda: tabela = sem ajuda no máximo 34; com ajuda no máximo 51', tabA === 'Por mês, sem ajuda: no máximo 34; com ajuda: no máximo 51.', tabA);
  check('Sem/com ajuda: o resumo diz as duas coisas, igual à tabela', entA.includes('cabem no máximo 34 por mês sem ajuda e no máximo 51 por mês com a ajuda que você contou'), entA);
  {
    const cc = nrm(await page.innerText('#como-capacidade'));
    check('Como calculamos (com ajuda): 10 h − 2 h de apoio + 4 h de ajuda = 720 min ÷ 1 h = 12 por semana; 720 × 4,33 ÷ 1 h = 51', cc === 'Como calculamos: 10 h por semana − 2 h de tarefas de apoio + 4 h de ajuda = 720 min para fazer ÷ 1 h cada um = 12 por semana. No mês: 720 min × 4,33 semanas ÷ 1 h = 51 (sempre arredondado para baixo).', cc);
    if (process.env.SHOTS7B) { await page.evaluate(() => document.querySelector('#como-capacidade').scrollIntoView({ block: 'center' })); await page.waitForTimeout(400); await page.screenshot({ path: path.join(process.env.SHOTS7B, 'm07b_como_calculamos_capacidade.png') }); }
  }
  await page.evaluate(() => document.querySelector('#sem-com').scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(400);
  if (SHOTS) await page.screenshot({ path: path.join(SHOTS, 'm07_sem_com_ajuda.png') });
  /* 4e. quadro de fornecedores sem critério */
  await abrir(E('ZZ', {}, { 'M7-07': { estado: 'multi', opcoes: ['Só o preço'] } })); await abrirRetrato();
  const fz = nrm(await page.innerText('.forn >> nth=0'));
  check('Fornecedores sem critério: "Nenhum critério escolhido", sem "Atende 0 de"', fz.includes('Nenhum critério escolhido.') && !/Atende \d+ de/.test(await page.innerText('body')), fz);
  await abrir(E('ZZ', {}, { 'M7-07': { estado: 'multi', opcoes: ['Prazo de entrega'] } })); await abrirRetrato();
  const f1 = nrm(await page.innerText('.forn >> nth=0'));
  check('Fornecedores com 1 critério ainda não marcado: pede para marcar, sem "Atende 0 de 1"', f1.includes('Marque se este fornecedor atende o critério.') && !/Atende 0 de 1/.test(await page.innerText('body')), f1);
  await page.selectOption('.forn >> nth=0 >> select >> nth=0', 'não atende');
  check('Resultado: o retrato completo continua aberto depois de marcar no quadro (a tela se redesenha)', await page.evaluate(() => document.querySelector('#retrato').open));
  check('Fornecedores: depois de marcar, "Atende 0 de 1 critério" (singular)', /Atende 0 de 1 critério\b/.test(await page.innerText('.forn >> nth=0')));
  /* 4f. pedidos para IA: visíveis e preenchidos */
  check('Pedidos para IA: seção aberta com os textos preenchidos (oferta no lugar do colchete)', await page.isVisible('#pedidos-ia') && /Quero organizar as etapas de Bolo de pote/.test(await page.innerText('#pedidos-ia')) && (await page.locator('#pedidos-ia .caixa-ia').count()) === 3 && !/\[/.test(await page.innerText('#pedidos-ia')));
  await page.evaluate(() => document.querySelector('#pedidos-ia').scrollIntoView({ block: 'start' }));
  await page.waitForTimeout(400);
  if (SHOTS) await page.screenshot({ path: path.join(SHOTS, 'm07_pedidos_ia.png') });
  await abrir(E('ZZ', { tipo: 'Serviço: atendo o cliente', material: 'Não', oferta: 'Manicure' })); await abrirRetrato();
  check('Pedidos para IA (serviço sem material): sem o item de fornecedores', (await page.locator('#pedidos-ia .caixa-ia').count()) === 2 && !/Fornecedores/.test(await page.innerText('#pedidos-ia')));
  /* 4g. receita A: teclado do celular (viewport 390x844 → 390x450 com o campo em foco) */
  check('Receita A: viewport com interactive-widget=resizes-content', /interactive-widget=resizes-content/.test(fs.readFileSync(path.join(DIR, 'index.html'), 'utf8')));
  for (const [nome, st, campo] of [['tempo', E('M7-02'), '#th'], ['ideias', E('M7-12'), '#txt']]) {
    await page.setViewportSize({ width: 390, height: 844 });
    await abrir(st);
    await page.focus(campo);
    await page.waitForTimeout(350);
    await page.setViewportSize({ width: 390, height: 450 });
    await page.waitForTimeout(450);
    const bc = await page.locator(campo).boundingBox(), bo = await page.locator('#ok').boundingBox();
    check(`Receita A (${nome}): campo e Continuar visíveis com o teclado aberto`, bc && bo && bc.y >= 0 && bc.y + bc.height <= 450 && bo.y >= 0 && bo.y + bo.height <= 450, { bc, bo });
    if (nome === 'tempo' && SHOTS) await page.screenshot({ path: path.join(SHOTS, 'm07_teclado.png') });
  }
  await page.setViewportSize({ width: 390, height: 844 });

  /* ---------- 5. lote 3 (relatos de Nayara e José Inácio, 05/11) ---------- */
  /* 5a. receita C: "‹ Voltar" no topo do cartão, à esquerda, acima da pergunta; nenhum Voltar embaixo */
  {
    await abrir(Object.assign(E('M7-03'), { hist: ['M7-01', 'M7-02'] }));
    const v = await page.evaluate(() => {
      const vs = [...document.querySelectorAll('button')].filter((b) => /Voltar/.test(b.textContent));
      const b = document.querySelector('#v'), q = document.querySelector('#pergunta'), ok = document.querySelector('#ok'), card = document.querySelector('.cartao-q');
      return { n: vs.length, noCartao: card.firstElementChild === b, acima: b.getBoundingClientRect().bottom <= q.getBoundingClientRect().top + 1, esquerda: b.getBoundingClientRect().left - card.getBoundingClientRect().left < 30, antesOk: !!(b.compareDocumentPosition(ok) & Node.DOCUMENT_POSITION_FOLLOWING), txt: b.textContent.replace(/\s+/g, ' ').trim() };
    });
    check('Receita C: um só Voltar, no topo do cartão, à esquerda, acima da pergunta e antes do Continuar', v.n === 1 && v.noCartao && v.acima && v.esquerda && v.antesOk && v.txt === '‹ Voltar', v);
    check('Receita C: nome acessível exatamente "Voltar"', (await page.getByRole('button', { name: 'Voltar', exact: true }).count()) === 1);
    await page.click('#v');
    check('Receita C: Voltar da pergunta volta para a anterior', /Quanto tempo você leva/.test(await page.innerText('#pergunta')));
    await abrir(E('M7-01'));
    await page.click('#v');
    check('Receita C: Voltar da 1ª pergunta leva ao ponto de partida, cujo Voltar (no topo) leva à capa', /Seu ponto de partida/.test(await page.innerText('body')) && await page.evaluate(() => document.querySelector('.cartao-q').firstElementChild.id === 'v'));
    await page.click('#v');
    check('Receita C: ponto de partida → capa', !!(await page.$('#ir')));
    await abrir(E('ZZ'));
    check('Receita C (resultado): Voltar no topo, antes da caixa "O que entendemos"', await page.evaluate(() => { const b = document.querySelector('#v'), e = document.querySelector('#entendemos'); return [...document.querySelectorAll('button')].filter((x) => /Voltar/.test(x.textContent)).length === 1 && !!(b.compareDocumentPosition(e) & Node.DOCUMENT_POSITION_FOLLOWING); }));
  }
  /* 5b. versão leve: a ajuda (apoio) e os termos ficam inteiros em "Ver dica", fechada, entre a pergunta e as respostas */
  {
    const longo = 'Receber o pedido pelo WhatsApp, separar os ingredientes, bater a massa, assar, montar os potes com recheio, decorar, colocar a tampa e a etiqueta, embalar em caixa térmica e entregar de moto';
    await abrir(E('M7-01', { etapas4: longo }));
    const d = await page.evaluate(() => { const v = document.querySelector('.pergunta .dica-toggle'); return { tem: !!v, aberto: v && v.open, resumo: v && v.querySelector('summary').textContent.trim(), txt: v && v.textContent.replace(/\s+/g, ' '), verMais: !!document.querySelector('.ver-mais') }; });
    check('Ver dica: ajuda longa inteira dentro de "Ver dica" fechada, sem "Ver mais"', d.tem && !d.aberto && d.resumo === 'Ver dica' && d.txt.includes('Montamos com o que você já contou:') && d.txt.includes('Mude a ordem') && !d.verMais, d);
    check('Ver dica: ajuda escondida até tocar; campos e Continuar visíveis', !(await page.isVisible('.dica-toggle .ajuda')) && await page.isVisible('.etapa-ed input >> nth=0') && await page.isVisible('#ok'));
    await page.click('.dica-toggle summary');
    check('Ver dica: um toque abre a ajuda', await page.isVisible('.dica-toggle .ajuda'));
    await abrir(E('M7-05'));
    check('Ver dica: termos (Gargalo) dentro da dica, sem "Entenda os termos" solto', await page.evaluate(() => { const v = document.querySelector('.dica-toggle'); return !!v && /Gargalo/.test(v.textContent) && !document.querySelector('.pergunta .saiba'); }));
  }
  /* 5c. disponibilidade: Módulo 1 pergunta por dia; aqui é por semana. Faixa mais próxima, com selo e "Confira e ajuste" */
  const semear = (mods) => page.evaluate((m) => { localStorage.clear(); for (const [k, v] of Object.entries(m)) localStorage.setItem(k, JSON.stringify(v)); }, mods);
  for (const [m1, m7] of [['Até 1 hora por dia', 'Até 10 h'], ['De 1 a 3 horas por dia', 'De 11 a 20 h'], ['Mais de 3 horas por dia', 'Mais de 20 h'], ['Só nos fins de semana', 'Até 10 h']]) {
    await semear({ 'lg2-turma-a-m01': { R: { 'M1.P03': { estado: 'valor', valor: 'Bolo de pote' }, 'M1.P05': { estado: 'opcao', opcao: m1 } } } });
    await page.goto(URL); await page.click('#ir');
    const sel = await page.evaluate(() => (document.querySelector('[data-campo="horas"] .opcao.sel') || {}).textContent);
    const leg = nrm(await page.innerText('[data-campo="horas"] legend')), nota = nrm(await page.innerText('#nota-horas'));
    check(`Disponibilidade: "${m1}" (Módulo 1) → "${m7}", com selo e "Confira e ajuste"`, nrm(sel) === m7 && /Veio do Módulo 1/.test(leg) && nota.includes(`No Módulo 1 você respondeu “${m1}”`) && /Confira e ajuste/.test(nota), [sel, leg, nota]);
  }
  await tocar('Mais de 20 h');
  await page.click('[data-campo="tipo"] .opcao >> nth=0');
  await ok();
  check('Disponibilidade: a pessoa pode trocar a faixa herdada e a troca fica gravada', (await page.evaluate((k) => JSON.parse(localStorage.getItem(k)).ini, CHAVE)).horas === 'Mais de 20 h');
  /* estado salvo antes desta mudança (sem horas): ao abrir o ponto de partida, as horas do Módulo 1 aparecem */
  await page.evaluate(([k]) => { const s = JSON.parse(localStorage.getItem(k)); delete s.ini.horas; s.ini.de = {}; localStorage.setItem(k, JSON.stringify(s)); localStorage.setItem('lg2-turma-a-m01', JSON.stringify({ R: { 'M1.P05': { estado: 'opcao', opcao: 'De 1 a 3 horas por dia' } } })); }, [CHAVE]);
  await page.goto(URL); await page.click('#ir'); await page.click('#v');
  check('Disponibilidade: estado antigo sem horas recebe a faixa do Módulo 1 ao voltar ao ponto de partida', nrm(await page.evaluate(() => (document.querySelector('[data-campo="horas"] .opcao.sel') || {}).textContent)) === 'De 11 a 20 h');
  /* 5d. herança: "Não sei" herdado não conta; material do serviço pelo Módulo 6 */
  await semear({ 'lg2-turma-a-m01': { R: { 'M1.P03A': { estado: 'opcao', opcao: 'Serviço: meu cliente paga pelo trabalho que realizo' } } }, 'lg2-turma-a-m04': { R: { 'M4.P15': { estado: 'naosei' } } }, 'lg2-turma-b-m06': { R: { 'M6.P12': { estado: 'opcao', opcao: 'Sim' } } }, 'lg2-turma-a-m05': { R: { 'M5.P37': { estado: 'valor', valor: '80' } } } });
  await page.goto(URL); await page.click('#ir');
  check('Herança: vendas por mês (Módulo 5) e material do serviço (Módulo 6) com selo', (await page.inputValue('#f-volume')) === '80' && /Veio do Módulo 6/.test(await page.innerText('[data-campo="material"] legend')) && nrm(await page.evaluate(() => document.querySelector('[data-campo="material"] .opcao.sel').textContent)) === 'Sim');
  check('Herança: "Não sei" do Módulo 4 não vira resposta', !(await page.$('[data-campo="regulada"] .opcao.sel')));
  /* 5e. revenda (distribuidora de bebidas): sem perguntas de fabricação; estoque, armazenamento, validade e entrega */
  await semear({
    'lg2-turma-a-m01': { R: { 'M1.P01': { estado: 'opcao', opcao: 'Já vendo sempre' }, 'M1.P03': { estado: 'valor', valor: 'Distribuidora de bebidas' }, 'M1.P03A': { estado: 'opcao', opcao: 'Mercadoria: compro pronto e revendo' }, 'M1.P05': { estado: 'opcao', opcao: 'Mais de 3 horas por dia' } } },
    'lg2-turma-a-m04': { R: { 'M4.P04': { estado: 'opcoes', opcoes: ['Entregador parceiro', 'Retirada presencial pelo cliente'] } } },
    'lg2-turma-a-m05': { R: { 'M5.P01': { estado: 'opcao', opcao: 'Mercadoria: compro pronto para revender' }, 'M5.P10': { estado: 'valor', valor: 'Refrigerante 2 L' }, 'M5.P37': { estado: 'valor', valor: '300' } } },
    'lg2-turma-b-m06': { R: { 'M6.P18': { estado: 'opcao', opcao: 'Sim' } } },
  });
  await page.goto(URL); await page.click('#ir');
  const pRev = nrm(await page.innerText('.cartao-q'));
  check('Revenda: item = mercadoria do Módulo 5, 1 por venda, estoque do Módulo 6 com selo', (await page.inputValue('#f-item')) === 'Refrigerante 2 L' && /Veio do Módulo 5/.test(await page.innerText('label[for="f-item"]')) && (await page.inputValue('#f-uso')) === '1' && nrm(await page.evaluate(() => document.querySelector('[data-campo="estoque"] .opcao.sel').textContent)) === 'Sim, mantenho mercadoria guardada' && /Veio do Módulo 6/.test(await page.innerText('[data-campo="estoque"] legend')), pRev);
  check('Revenda: ponto de partida fala em mercadoria, sem "material" nem "cada unidade ou atendimento"', /Mercadoria principal e estoque/i.test(pRev) && !/Material principal|vai em cada unidade/i.test(pRev), (pRev.match(/.{80}(Material principal|vai em cada unidade).{40}/) || [pRev.slice(-300)])[0]);
  if (SHOTS) { await page.locator('#f-item').scrollIntoViewIfNeeded(); await page.waitForTimeout(400); await page.screenshot({ path: path.join(SHOTS, 'l3_m07_partida_revenda.png') }); }
  await ok();
  await ok(); await ok(); /* mapa: retorno e segue */
  const t2 = nrm(await page.innerText('.cartao-q'));
  check('Revenda (tempo): fala em separar e entregar pedidos, sem "preparo e produção"', /Quanto tempo você leva para separar e entregar Refrigerante 2 L\?/.test(t2) && /Pedidos separados de uma vez/.test(t2) && !/produção|preparo/i.test(t2), t2);
  await page.click('#na');
  check('Revenda (tempo): "Não se aplica ao meu negócio" deixa seguir', /fica de fora/.test(await caixa()));
  if (SHOTS) { await page.waitForTimeout(400); await page.screenshot({ path: path.join(SHOTS, 'l3_m07_revenda_tempo_nao_se_aplica.png') }); }
  await ok();
  const t3 = nrm(await page.innerText('#pergunta'));
  check('Revenda (apoio): pergunta curta, com mercadoria e sem "entregar" repetido', t3 === 'Por semana, quantas horas vão para clientes, compras de mercadoria e divulgação?', t3);
  await tocar('Até 2 h'); await ok();
  check('Revenda (ajuda): sem "preparo e produção"', !/produção|preparo/i.test(await page.innerText('.cartao-q')));
  await tocar('Não, faço sozinho(a)'); await ok();
  check('Revenda (gargalo): espaço/veículo e mercadoria no lugar de equipamento e material', await page.evaluate(() => { const t = [...document.querySelectorAll('.opcao')].map((x) => x.textContent.trim()); return t.includes('O espaço para guardar ou o veículo de entrega') && t.includes('Falta ou atraso de mercadoria') && !t.includes('Um equipamento ou o espaço'); }));
  await tocar('O espaço para guardar ou o veículo de entrega'); await ok();
  check('Revenda (espaço): exemplo com carro, sem forno (na dica)', /carro leva 20 caixas/.test(await page.textContent('.cartao-q')) && !/forno/.test(await page.textContent('.cartao-q')));
  await preenche('#uv', '20'); await preenche('#tvh', '1'); await ok(); await ok();
  await tocar('Dois ou mais'); await tocar('De 1 a 3 dias'); await ok();
  await tocar('Prazo de entrega'); await ok();
  check('Revenda (validade): pergunta sobre as mercadorias e dica de armazenamento em "Ver dica"', /Suas mercadorias estragam, vencem/.test(await page.innerText('#pergunta')) && /lugar limpo, seco e arejado/.test(await page.textContent('.dica-toggle #dica-estoque')));
  if (SHOTS) { await page.waitForTimeout(400); await page.screenshot({ path: path.join(SHOTS, 'l3_m07_revenda_validade.png') }); }
  await tocar('Sim, em semanas ou meses'); await ok();
  check('Revenda (qualidade): conferência sem "receita" nem "provando"', await page.evaluate(() => { const t = [...document.querySelectorAll('.opcao')].map((x) => x.textContent.trim()); return t.includes('Sigo uma lista de conferência anotada') && !t.some((x) => /receita|provando/.test(x)); }));
  await tocar('Sigo uma lista de conferência anotada'); await ok();
  await tocar('Faltar mercadoria'); await ok();
  await ok(); await ok(); await ok();
  await abrirRetrato();
  const rRev = nrm(await page.innerText('body'));
  const cuid = nrm(await page.innerText('#cuidados-revenda'));
  check('Revenda (resultado): cuidados com estoque, armazenamento, validade e entrega (forma de entrega do Módulo 4)', ['Estoque', 'Armazenamento', 'Validade', 'Entrega'].every((x) => cuid.includes(x)) && cuid.includes('Você vai manter mercadoria guardada') && cuid.includes('entregador parceiro, retirada presencial pelo cliente'), cuid);
  check('Revenda (resultado): tempo "não se aplica" não vira pendência ("cronometre", "ainda falta medir")', !rRev.includes('cronometre do começo ao fim') && !/Ainda falta medir/.test(rRev) && /cabem pelo menos/.test(nrm(await page.innerText('#entendemos'))), nrm(await page.innerText('#entendemos')));
  check('Revenda (resultado): riscos e gargalo com palavras de revenda', rRev.includes('Faltar mercadoria') && rRev.includes('Sigo uma lista de conferência anotada'));
  if (SHOTS) { await page.evaluate(() => document.querySelector('#cuidados-revenda').scrollIntoView({ block: 'center' })); await page.waitForTimeout(400); await page.screenshot({ path: path.join(SHOTS, 'l3_m07_revenda_cuidados.png') }); }
  check('Revenda: o valor gravado continua o da planilha (só o texto muda)', (await page.evaluate((k) => JSON.parse(localStorage.getItem(k)).R, CHAVE))['M7-05'].opcao === 'Um equipamento ou o espaço');

  /* ---------- 6. versão leve: perguntas curtas, "Ver dica" fechada e ajuda de verdade no "Não sei" ---------- */
  {
    const palavras = async () => (await page.evaluate(() => document.querySelector('#tela').innerText)).split(/\s+/).filter((w) => /[A-Za-zÀ-ÿ0-9]/.test(w)).length;
    const e5 = { 'M7-05': { estado: 'opcao', opcao: 'Um equipamento ou o espaço' } };
    const estadoDe = (cod, ini) => estadoAte(cod, ini || {}, cod === 'M7-05a' ? e5 : {});
    const REVI = { tipo: 'Mercadoria: compro pronto para revender', oferta: 'Refrigerante 2 L', item: 'Refrigerante 2 L', estoque: 'Sim, mantenho mercadoria guardada' };
    const SERV = { tipo: 'Serviço: atendo o cliente', material: 'Sim', oferta: 'Lavagem de carro em casa', item: 'Shampoo automotivo' };
    const longas = [];
    for (const [nome, ini] of [['fabricação', {}], ['revenda', REVI], ['serviço', SERV]]) {
      for (const cod of ORDEM) {
        if (nome !== 'fabricação' && cod === 'M7-02') continue;
        await abrir(estadoDe(cod, ini));
        if (!(await page.$('#pergunta'))) { longas.push([nome, cod, 'sem pergunta']); continue; }
        const n = await palavras();
        const dica = await page.evaluate(() => { const d = document.querySelector('.pergunta .dica-toggle'), q = document.querySelector('#pergunta'), ent = document.querySelector('#ent'); return !d || (!d.open && !!(q.compareDocumentPosition(d) & Node.DOCUMENT_POSITION_FOLLOWING) && !!(d.compareDocumentPosition(ent) & Node.DOCUMENT_POSITION_FOLLOWING)); });
        const q = nrm(await page.innerText('#pergunta')).split(' ').length;
        if (n > 60 || !dica || q > 16) longas.push([nome, cod, n, q, dica]);
      }
    }
    check('Leve: toda pergunta (fabricação, revenda, serviço) com até 60 palavras na tela, enunciado de até 16 palavras e "Ver dica" fechada entre a pergunta e as respostas', !longas.length, longas);

    /* "Não sei" em cada pergunta: caixa "Como descobrir" com 2 passos, Copiar quando há pedido para a IA, e a resposta gravada continua "Não sei" */
    const comoBox = (sel) => page.evaluate((s) => { const b = document.querySelector(s); if (!b) return null; const p = b.querySelector('[data-prompt]'); return { passos: [...b.querySelectorAll('li')].map((x) => x.textContent.trim()).filter(Boolean), tit: (b.querySelector('.como-tit') || {}).textContent, prompt: p ? p.textContent.trim() : '', copiar: !!b.querySelector('button[data-copiar]'), nota: (b.querySelector('.como-nota') || {}).textContent || '' }; }, sel);
    const marcas = /chatgpt|gemini|copilot|claude|openai|bard/i;
    const NSQ = ['M7-01', 'M7-02', 'M7-03', 'M7-04', 'M7-05', 'M7-05a', 'M7-06', 'M7-07', 'M7-08', 'M7-09', 'M7-10', 'M7-11'];
    const ruins = [];
    for (const cod of NSQ) {
      const q = D.perguntas.find((x) => x.codigo === cod);
      await abrir(estadoDe(cod));
      check(`Não sei (${cod}): nada de "Como descobrir" antes de tocar`, !(await page.$('.como-descobrir')));
      if (await page.$('#ns')) await page.click('#ns'); else await tocar('Não sei');
      const b = await comoBox(cod === 'M7-06' ? '#b1 .como-descobrir' : '#retorno .como-descobrir');
      const okBox = b && b.tit === 'Como descobrir' && b.passos.length >= 2 && b.passos.every((x) => x.length > 20) && b.passos.join(' ') === q.comoDescobrir.join(' ')
        && (q.promptIA ? b.copiar && b.prompt.length > 40 && b.nota === 'Copie, cole numa IA de sua preferência e troque o que está entre colchetes.' : !b.copiar)
        && !marcas.test(b.passos.join(' ') + b.prompt + b.nota);
      if (!okBox) ruins.push([cod, b]);
      if (q.promptIA && b && b.copiar) {
        await page.click('#tela [data-copiar]');
        await page.waitForTimeout(150);
        const t = (await page.textContent('#tela [data-copiar]')).trim();
        if (!/^(Copiado!|Toque e segure o texto para copiar)$/.test(t)) ruins.push([cod, 'copiar', t]);
      }
      if (cod === 'M7-06') {
        const bs = await page.$$('.opcao');
        await page.evaluate(() => { const bs = [...document.querySelectorAll('.opcao')].filter((x) => x.textContent.trim() === 'Não sei'); bs[1].click(); });
        const b2 = await comoBox('#b2 .como-descobrir');
        if (!(b2 && b2.passos.join(' ') === q.comoDescobrir2.join(' ') && !b2.copiar)) ruins.push([cod, 'parte 2', b2, bs.length]);
      }
      await ok();
      const st = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)).R, CHAVE);
      const r = st[cod] || {};
      const gravou = cod === 'M7-06' ? r.estado === 'partes' && r.p1 === 'Não sei' && r.p2 === 'Não sei' : r.estado === 'naosei';
      if (!gravou) ruins.push([cod, 'gravado', r]);
      if (!(await page.$('#pergunta')) && !(await page.$('#entendemos'))) ruins.push([cod, 'não seguiu']);
    }
    check(`Não sei: ${NSQ.length} perguntas mostram "Como descobrir" com 2 passos dos dados (+ Copiar onde há pedido para a IA), sem nome de IA, gravam "Não sei" igual a antes e deixam seguir`, !ruins.length, ruins);
    check('Não sei: os pedidos para a IA e os passos ficam nos dados (comoDescobrir/promptIA), sem marca de IA', NSQ.every((c) => (D.perguntas.find((x) => x.codigo === c).comoDescobrir || []).length >= 2) && !marcas.test(fs.readFileSync(path.join(DIR, 'dados/modulo7.js'), 'utf8')) && !marcas.test(fs.readFileSync(path.join(DIR, 'js/app.js'), 'utf8')));
    /* o que já sabemos (oferta) entra no pedido; o resto fica entre colchetes para a pessoa trocar */
    await abrir(estadoDe('M7-03')); await tocar('Não sei');
    const pr3 = ((await comoBox('#retorno .como-descobrir')) || {}).prompt || '';
    check('Não sei: o pedido para a IA já traz a oferta e deixa colchetes para a pessoa trocar', pr3.includes('Bolo de pote') && /\[[^\]]+\]/.test(pr3) && !pr3.includes('[o que você vende]'), pr3);
    /* reabrir uma pergunta respondida com "Não sei" mostra a ajuda de novo */
    await abrir(Object.assign(estadoDe('M7-09'), { hist: ['M7-09'], R: Object.assign(estadoDe('M7-09').R, { 'M7-09': { estado: 'naosei' } }) }));
    await page.click('#v');
    check('Não sei: Voltar leva à pergunta já respondida com "Não sei"', /confere se/.test(await page.innerText('#pergunta')));
    check('Não sei: reabrir a pergunta já respondida com "Não sei" mostra a ajuda', !!(await page.$('#retorno .como-descobrir')));
    if (SHOTS) await foto('m07_naosei_ajuda');
    /* ponto de partida: "Não sei" nas escolhas também ajuda, e grava "Não sei" */
    await semear({ 'lg2-turma-a-m01': { R: { 'M1.P03': { estado: 'valor', valor: 'Bolo de pote' } } } });
    await page.goto(URL); await page.click('#ir');
    await page.click('[data-campo="tipo"] .opcao >> nth=0');
    await page.click('[data-campo="horas"] .opcao[data-v="Não sei"]');
    const bp = await comoBox('[data-campo="horas"] .como-descobrir');
    check('Ponto de partida: "Não sei" nas horas mostra 2 passos para descobrir', bp && bp.passos.length === 2 && bp.passos.join(' ') === D.partida_ajuda.horas.comoDescobrir.join(' '), bp);
    await page.click('[data-campo="horas"] .opcao[data-v="Até 10 h"]');
    check('Ponto de partida: trocar a resposta tira a ajuda', !(await page.$('[data-campo="horas"] .como-descobrir')));
    await page.click('[data-campo="horas"] .opcao[data-v="Não sei"]');
    await ok();
    check('Ponto de partida: "Não sei" continua gravado como antes', (await page.evaluate((k) => JSON.parse(localStorage.getItem(k)).ini, CHAVE)).horas === 'Não sei');
  }

  check('Sem erros de página', !erros.length, erros);
  await browser.close();
  servidor.close();
  console.log(falhas ? `\n${falhas} falha(s)` : '\nTudo certo');
  process.exit(falhas ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
