/* Teste do LG2 M07 (Turma B) no navegador headless.
   Execute: PW=<caminho do pacote playwright> node tests/lg2-m07-turma-b.cjs
   Opcional: SHOTS=<pasta> grava prints de celular (390x844).
   1) confere as contas com os casos da aba "Cálculos a conferir" do grupo;
   2) alcança cada linha da aba "Caminhos por resposta" e confere o texto exibido;
   3) percorre o módulo do começo ao resumo, com dados herdados dos Módulos 1, 4 e 5, recarrega e retoma.
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
  const faltaCapa = [A.titulo, A.objetivo, ...A.para_voce, ...A.no_final, ...A.nao_faz].filter((t) => !capa.includes(nrm(t)));
  check('Capa mostra todo o texto do PDF de abertura', !faltaCapa.length, faltaCapa);
  check('Nenhum "rafael" nos dados públicos', !/rafael/i.test(fs.readFileSync(path.join(DIR, 'dados/modulo7.js'), 'utf8')));
  await foto('m07_01_capa');

  /* ---------- 2. cada linha da aba "Caminhos por resposta" ---------- */
  const abrir = async (st) => {
    await page.evaluate(([k, v]) => { localStorage.clear(); localStorage.setItem(k, JSON.stringify(v)); }, [CHAVE, st]);
    await page.goto(URL);
    await page.click('#ir');
  };
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

  /* ---------- 3. percurso completo com dados herdados ---------- */
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('lg2-turma-a-m01', JSON.stringify({ v: 9, R: { 'M1.P01': { estado: 'opcao', opcao: 'Já vendo sempre' }, 'M1.P03': { estado: 'valor', valor: 'Pão caseiro' }, 'M1.P08': { estado: 'opcao', opcao: 'Ainda não sei fazer direito' } } }));
    localStorage.setItem('lg2-turma-a-m04', JSON.stringify({ R: { 'M4.P15': { estado: 'opcao', opcao: 'Sim' }, 'M4.P19': { estado: 'valor', valor: '60' }, 'M4.P20': { estado: 'valor', valor: '7' } } }));
    localStorage.setItem('lg2-turma-a-m05', JSON.stringify({ versao: 9, R: { 'M5.P01': { estado: 'opcao', opcao: 'Produto: eu compro materiais e faço o que vendo' }, 'M5.P02': { estado: 'valor', valor: 'Pão de fermentação natural' }, 'M5.P03': { estado: 'valor', valor: ['Farinha', 'Sal'] }, 'M5.P26': { estado: 'opcao', opcao: 'Sim' }, 'M5.P37': { estado: 'valor', valor: '200' } } }));
  });
  await page.goto(URL);
  await page.click('#ir');
  const partida = nrm(await page.innerText('body'));
  check('Partida traz a oferta do Módulo 5', (await page.inputValue('#f-oferta')) === 'Pão de fermentação natural');
  check('Partida marca o tipo e o estágio herdados e mostra "Veio do Módulo"', /Veio do Módulo 5/.test(partida) && /Veio do Módulo 1/.test(partida) && await page.evaluate(() => document.querySelector('[data-campo="tipo"] .opcao.sel').textContent.trim().startsWith('Produto')));
  check('Partida traz volume, item e teste herdados', (await page.inputValue('#f-volume')) === '200' && (await page.inputValue('#f-item')) === 'Farinha' && (await page.inputValue('#f-testeN')) === '60');
  await foto('m07_02_partida');
  await tocar('Até 10 h');
  await preenche('#f-uso', '0,5');
  await tocar('Toda semana');
  await preenche('#f-perda', '5');
  await ok();
  check('Primeira pergunta = mapa do processo com o modelo de fabricação', /Este é o caminho de Pão de fermentação natural/.test(nrm(await page.innerText('#pergunta'))) && (await page.locator('.etapa-ed').count()) === 8);
  await foto('m07_03_mapa');
  await ok(); await ok();
  await preenche('#th', '0'); await preenche('#tm', '10'); await ok();
  await foto('m07_04_tempo');
  check('M7-02 mostra "Anotado: cerca de 10 min por unidade"', /Anotado: cerca de 10 min por unidade/.test(await caixa()), await caixa());
  await ok();
  await tocar('Até 2 h'); await ok();
  await tocar('Não, faço sozinho(a)'); await ok();
  await tocar('Um equipamento ou o espaço'); await ok();
  await preenche('#uv', '4'); await preenche('#tvm', '50'); await ok();
  check('M7-05a mostra a conta do forno: 36 por semana', /cabem cerca de 36 por semana/.test(await caixa()), await caixa());
  await foto('m07_05_equipamento');
  await ok();
  check('Fase "Fornecedores e estoque" aparece para fabricação', /Fornecedores e estoque/.test(nrm(await page.innerText('.etapas'))));
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
  check('Resumo: checklist tem fornecedor único, prazo longo, validade curta e atividade regulada', ['Depender de um só fornecedor', 'Prazo de entrega do fornecedor acima de 7 dias', 'Itens que estragam em poucos dias', 'Atividade com regras próprias'].every((x) => res.includes(x)));
  check('Resumo: avisos dos instrumentos', D.instrumentos.every((i) => res.includes(nrm(i.avisos[0]).replace('[fizer] [oferta em foco]', 'fizer Pão de fermentação natural'))), D.instrumentos.map((i) => i.avisos[0]).filter((a) => !res.includes(a)));
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
  await abrir(estadoAte('M7-01', { tipo: 'Serviço: atendo o cliente', material: 'Não', oferta: 'Manicure' }));
  const fs3 = await page.evaluate(() => [...document.querySelectorAll('.etapas li')].map((x) => x.textContent.trim()));
  check('Serviço sem material: barra com 3 fases', fs3.length === 3 && !fs3.includes('Fornecedores e estoque'), fs3);
  await ok(); await ok();
  check('Serviço: a pergunta de tempo usa "atender"', /Quanto tempo você leva para atender Manicure\?/.test(await page.innerText('#pergunta')), await page.innerText('#pergunta'));
  check('Sem erros de página', !erros.length, erros);
  await browser.close();
  servidor.close();
  console.log(falhas ? `\n${falhas} falha(s)` : '\nTudo certo');
  process.exit(falhas ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
