/* Teste do LG2 M03 (Turma B): caminhos por resposta (planilha m03_caminhos.xlsx) + campo inteiro da P04.
   Execute: PW=<pacote playwright> NODE_OPTIONS=--no-experimental-webstorage node tests/lg2-m03-turma-b.cjs
   Opcional: SHOTS=<pasta> grava prints de celular (390x844). Sai com código 1 se algo falhar. */
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.PW || 'playwright');

const DIR = path.resolve(__dirname, '../public/lg2/turma-b/m03');
const CHAVE = 'lg2-turma-b-m03';
const SHOTS = process.env.SHOTS || '';
const TIPOS = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf' };
const servidor = http.createServer((req, res) => {
  const f = path.join(DIR, decodeURIComponent(req.url.split('?')[0]).replace(/\/$/, '/index.html'));
  if (!f.startsWith(DIR) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': TIPOS[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});

/* As 31 linhas da aba "Caminhos por resposta" (P06 da planilha = M3.P11; P07 = M3.P15). Texto literal da coluna G. */
const LINHAS = [
 {
  "p": "M3.P01",
  "planilha": "P01",
  "opcao": "Resposta preenchida",
  "tipo": "Dica",
  "texto": "Descreva de forma simples o que você pretende vender ou pesquisar. Ex.: bolos de aniversário, manutenção de celulares ou aulas particulares."
 },
 {
  "p": "M3.P01",
  "planilha": "P01",
  "opcao": "Resposta muito genérica",
  "tipo": "Dica",
  "texto": "Tente especificar melhor. Em vez de 'comida', escreva 'marmitas fitness para trabalhadores da região'."
 },
 {
  "p": "M3.P01",
  "planilha": "P01",
  "opcao": "Não sei ainda",
  "tipo": "Dica",
  "texto": "Você pode começar pela necessidade que pretende atender e definir o produto ou serviço com mais detalhes depois."
 },
 {
  "p": "M3.P02",
  "planilha": "P02",
  "opcao": "Produto que eu fabrico",
  "tipo": "Resposta",
  "texto": "Você pretende produzir o próprio produto para vender."
 },
 {
  "p": "M3.P02",
  "planilha": "P02",
  "opcao": "Produto que eu revendo",
  "tipo": "Resposta",
  "texto": "Você pretende comprar produtos prontos e revendê-los."
 },
 {
  "p": "M3.P02",
  "planilha": "P02",
  "opcao": "Serviço",
  "tipo": "Resposta",
  "texto": "Seu negócio será baseado principalmente na prestação de um serviço."
 },
 {
  "p": "M3.P02",
  "planilha": "P02",
  "opcao": "Outro",
  "tipo": "Dica",
  "texto": "Explique brevemente como seu negócio funcionará para que as próximas orientações sejam mais adequadas."
 },
 {
  "p": "M3.P02",
  "planilha": "P02",
  "opcao": "Ainda estou decidindo",
  "tipo": "Dica",
  "texto": "Tudo bem. Continue a pesquisa e use as próximas respostas para entender melhor sua ideia."
 },
 {
  "p": "M3.P03",
  "planilha": "P03",
  "opcao": "Presencialmente",
  "tipo": "Dica",
  "texto": "Considere loja, feira, ponto de atendimento, venda direta ou outro espaço físico."
 },
 {
  "p": "M3.P03",
  "planilha": "P03",
  "opcao": "Pela internet",
  "tipo": "Dica",
  "texto": "Considere site, redes sociais, WhatsApp, marketplace ou outra plataforma digital."
 },
 {
  "p": "M3.P03",
  "planilha": "P03",
  "opcao": "Nos dois",
  "tipo": "Dica",
  "texto": "Escolha esta opção se pretende combinar vendas ou atendimento físico e digital."
 },
 {
  "p": "M3.P03",
  "planilha": "P03",
  "opcao": "Ainda não sei",
  "tipo": "Dica",
  "texto": "Observe onde seu público costuma procurar esse produto ou serviço antes de decidir."
 },
 {
  "p": "M3.P04",
  "planilha": "P04",
  "opcao": "0",
  "tipo": "Dica",
  "texto": "Zero significa que você ainda não identificou nenhum negócio. Isso não garante que não existam concorrentes."
 },
 {
  "p": "M3.P04",
  "planilha": "P04",
  "opcao": "1 ou mais",
  "tipo": "Resposta",
  "texto": "Você identificou [N] negócio(s) que atendem à mesma necessidade."
 },
 {
  "p": "M3.P04",
  "planilha": "P04",
  "opcao": "Número inválido",
  "tipo": "Dica",
  "texto": "Informe um número inteiro igual ou maior que zero."
 },
 {
  "p": "M3.P04",
  "planilha": "P04",
  "opcao": "Não sei",
  "tipo": "Dica",
  "texto": "Pesquise negócios que resolvem a mesma necessidade, incluindo concorrentes diretos, indiretos e produtos ou serviços substitutos."
 },
 {
  "p": "M3.P05",
  "planilha": "P05",
  "opcao": "Compra de outro concorrente",
  "tipo": "Dica",
  "texto": "Se souber, informe qual tipo de negócio ou solução o cliente costuma procurar."
 },
 {
  "p": "M3.P05",
  "planilha": "P05",
  "opcao": "Faz por conta própria",
  "tipo": "Dica",
  "texto": "Ex.: prepara em casa, conserta sozinho, pesquisa e compra os materiais ou realiza o serviço por conta própria."
 },
 {
  "p": "M3.P05",
  "planilha": "P05",
  "opcao": "Usa outro produto ou serviço substituto",
  "tipo": "Dica",
  "texto": "Pense em outra solução que resolve a mesma necessidade, mesmo que seja diferente do seu produto ou serviço."
 },
 {
  "p": "M3.P05",
  "planilha": "P05",
  "opcao": "Não faz nada / não resolve",
  "tipo": "Dica",
  "texto": "Isso pode significar que a necessidade ainda não é percebida como importante ou que existe uma oportunidade a investigar."
 },
 {
  "p": "M3.P05",
  "planilha": "P05",
  "opcao": "Não sei",
  "tipo": "Dica",
  "texto": "Converse com possíveis clientes ou observe como eles resolvem essa necessidade atualmente."
 },
 {
  "p": "M3.P11",
  "planilha": "P06",
  "opcao": "Sim",
  "tipo": "Dica",
  "texto": "Indique datas, meses, estações, férias ou outros períodos em que a procura pode aumentar ou diminuir."
 },
 {
  "p": "M3.P11",
  "planilha": "P06",
  "opcao": "Não",
  "tipo": "Resposta",
  "texto": "Você não identificou uma mudança relevante na procura ao longo do ano."
 },
 {
  "p": "M3.P11",
  "planilha": "P06",
  "opcao": "Não sei",
  "tipo": "Dica",
  "texto": "Pesquise se o setor possui períodos de maior ou menor procura ou converse com clientes e concorrentes."
 },
 {
  "p": "M3.P15",
  "planilha": "P07",
  "opcao": "Preços praticados",
  "tipo": "Dica",
  "texto": "Use esta opção se ainda precisar entender quanto os concorrentes cobram e como os preços variam."
 },
 {
  "p": "M3.P15",
  "planilha": "P07",
  "opcao": "Quantidade de clientes / tamanho do público",
  "tipo": "Dica",
  "texto": "Use quando quiser descobrir se existe público suficiente ou qual é o tamanho aproximado da demanda."
 },
 {
  "p": "M3.P15",
  "planilha": "P07",
  "opcao": "Concorrentes",
  "tipo": "Dica",
  "texto": "Use quando ainda quiser descobrir quem são os concorrentes diretos, indiretos ou substitutos."
 },
 {
  "p": "M3.P15",
  "planilha": "P07",
  "opcao": "Comportamento / necessidade dos clientes",
  "tipo": "Dica",
  "texto": "Use quando ainda precisar entender melhor o que o cliente procura, valoriza ou faz atualmente."
 },
 {
  "p": "M3.P15",
  "planilha": "P07",
  "opcao": "Canais de venda e divulgação",
  "tipo": "Dica",
  "texto": "Use quando quiser descobrir onde os clientes procuram, compram ou contratam esse tipo de produto ou serviço."
 },
 {
  "p": "M3.P15",
  "planilha": "P07",
  "opcao": "Outra dúvida",
  "tipo": "Dica",
  "texto": "Escreva qual informação ainda falta para você se sentir mais seguro para decidir sobre o negócio."
 },
 {
  "p": "M3.P15",
  "planilha": "P07",
  "opcao": "Não sei",
  "tipo": "Dica",
  "texto": "Revise suas respostas e pense: qual informação ainda falta para saber se existe público, concorrência e oportunidade?"
 }
];

let falhas = 0;
const cobertas = new Set();
function check(nome, ok, extra) {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${nome}${!ok && extra !== undefined ? ' :: ' + JSON.stringify(extra).slice(0, 400) : ''}`);
  if (!ok) falhas++;
  return ok;
}
const linha = (p, opcao) => { const l = LINHAS.find((x) => x.p === p && x.opcao === opcao); if (!l) throw new Error('linha ' + p + ' ' + opcao); return l; };
const esperado = (l, n) => ({ t: l.tipo, x: n === undefined ? l.texto : l.texto.replace('[N]', n) });

/* funções que rodam na página */
const caixas = () => [...document.querySelectorAll('#caminho .caminho')].map((b) => ({ t: b.querySelector('b').textContent, x: b.textContent.slice(b.querySelector('b').textContent.length).trim() }));
const atual = () => {
  const t = document.querySelector('.passo');
  if (!t) return null;
  if (/Resultado/.test(t.textContent)) return 'RESULTADO';
  const n = +t.textContent.match(/Pergunta (\d+)/)[1];
  return window.MODULO3.perguntas.filter((p) => p.codigo)[n - 1].codigo;
};
const clicarOpcao = (op) => {
  const b = [...document.querySelectorAll('.opcao')].find((x) => x.textContent.trim() === op);
  if (!b) return 'sem opcao ' + op + ' em ' + [...document.querySelectorAll('.opcao')].map((x) => x.textContent.trim()).join('|');
  b.click(); return '';
};
const clicarBotao = (re) => {
  const b = [...document.querySelectorAll('button')].find((x) => new RegExp(re).test(x.textContent.trim()));
  if (!b) return false; b.click(); return true;
};
const temSeguir = () => [...document.querySelectorAll('#acoes .btn-primario')].some((x) => /Seguir|Ver meu resumo/.test(x.textContent));

(async () => {
  await new Promise((r) => servidor.listen(0, '127.0.0.1', r));
  const URL = `http://127.0.0.1:${servidor.address().port}/index.html`;
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  const errosJS = [];
  page.on('pageerror', (e) => errosJS.push(e.message));
  await page.goto(URL);
  const shot = async (nome, inteira = false) => { if (!SHOTS) return; fs.mkdirSync(SHOTS, { recursive: true }); await page.waitForTimeout(400); await page.screenshot({ path: path.join(SHOTS, nome), fullPage: inteira }); };

  /* abre a pergunta cod com um estado salvo (respostas anteriores R) */
  /* respostas neutras das perguntas anteriores (o app descarta respostas fora da sequência respondida) */
  const BASE = {
    'M3.P01': { estado: 'valor', valor: 'Bolos de aniversário por encomenda' }, 'M3.P02': { estado: 'opcao', opcao: 'Serviço' },
    'M3.P03': { estado: 'opcao', opcao: 'Nos dois' }, 'M3.P04': { estado: 'valor', valor: '2' },
    'M3.P05': { estado: 'opcao', opcao: 'Não sei' }, 'M3.P06': { estado: 'valor', valor: '45' },
    'M3.P07': { estado: 'opcao', opcao: 'Variam pouco' }, 'M3.P08': { estado: 'opcao', opcao: 'Instagram ou WhatsApp' },
    'M3.P09': { estado: 'valor', valor: 'Elogiam o sabor' }, 'M3.P10': { estado: 'valor', valor: 'Entrega no fim de semana' },
    'M3.P11': { estado: 'opcao', opcao: 'Não' }, 'M3.P13': { estado: 'opcao', opcao: 'Sim' }, 'M3.P14': { estado: 'opcao', opcao: 'Sim' },
  };
  async function abrir(cod, R0 = {}) {
    const R = {};
    for (const [k, v] of Object.entries(BASE)) if (k < cod) R[k] = v;
    Object.assign(R, R0);
    await page.evaluate(([k, c, r]) => localStorage.setItem(k, JSON.stringify({ v: 2, R: r, hist: [c] })), [CHAVE, cod, R]);
    await page.reload();
    await page.click('#ir');
    const a = await page.evaluate(atual);
    if (a !== cod) throw new Error(`esperava ${cod}, está em ${a}`);
  }
  const ver = () => page.evaluate(caixas);
  const igual = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  async function escrever(v) { await page.fill('#ent input, #ent textarea', v); await page.evaluate(() => document.querySelector('#ok').click()); }

  const D = await page.evaluate(() => window.MODULO3);
  const P = Object.fromEntries(D.perguntas.filter((p) => p.codigo).map((p) => [p.codigo, p]));
  check('15 perguntas', Object.keys(P).length === 15, Object.keys(P).length);
  check('CHAVE da turma B no app', fs.readFileSync(path.join(DIR, 'js/app.js'), 'utf8').includes(`const CHAVE = "${CHAVE}"`));
  const dados = fs.readFileSync(path.join(DIR, 'dados/modulo3.js'), 'utf8');
  check('dados sem "rafael"', !/rafael/i.test(dados));
  check('dados sem telefone', !/\(?\d{2}\)?\s?9?\d{4}-?\d{4}/.test(dados.replace(/\d{2}\/\d{2}\/\d{4}/g, '')));
  check('31 linhas da planilha', LINHAS.length === 31);
  for (const l of LINHAS) check(`dados ${l.p} "${l.opcao}" = planilha`, (P[l.p].caminhos || []).some((c) => c.opcao === l.opcao && c.tipo === l.tipo && c.texto === l.texto));

  /* ---- P01 ---- */
  await abrir('M3.P01');
  await page.evaluate(() => document.querySelector('#ok').click());
  check('P01 vazio: pede preenchimento e não avança', await page.evaluate(() => !document.querySelector('#erro').hidden) && !(await page.evaluate(temSeguir)));
  await escrever('Bolos de aniversário por encomenda');
  if (check('P01 "Resposta preenchida" -> Dica G', igual(await ver(), [esperado(linha('M3.P01', 'Resposta preenchida'))]), await ver())) cobertas.add('M3.P01|Resposta preenchida');
  await abrir('M3.P01');
  await escrever('comida');
  const gen = await ver();
  if (check('P01 "Resposta muito genérica" -> Dica G, sem bloquear', igual(gen, [esperado(linha('M3.P01', 'Resposta muito genérica'))]) && await page.evaluate(temSeguir) && await page.evaluate(() => [...document.querySelectorAll('button')].some((b) => b.textContent === 'Corrigir minha resposta')), gen)) cobertas.add('M3.P01|Resposta muito genérica');
  await abrir('M3.P01');
  check('P01 tem botão "Não sei ainda"', (await page.textContent('#ns')) === 'Não sei ainda');
  await page.click('#ns');
  const st1 = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)).R['M3.P01'], CHAVE);
  if (check('P01 "Não sei ainda" -> Dica G, registra indefinido, não bloqueia', igual(await ver(), [esperado(linha('M3.P01', 'Não sei ainda'))]) && st1.estado === 'naosei' && await page.evaluate(temSeguir), await ver())) cobertas.add('M3.P01|Não sei ainda');

  /* ---- opções únicas: P02, P03, P05, P11 ---- */
  for (const cod of ['M3.P02', 'M3.P03', 'M3.P05', 'M3.P11']) {
    const ls = LINHAS.filter((l) => l.p === cod);
    await abrir(cod);
    const ops = await page.evaluate(() => [...document.querySelectorAll('.opcao')].map((x) => x.textContent.trim()));
    check(`${cod} opções = planilha`, igual(ops, ls.map((l) => l.opcao)), ops);
    for (const l of ls) {
      await page.evaluate(clicarOpcao, l.opcao);
      const v = await ver();
      if (check(`${cod} "${l.opcao}" -> ${l.tipo}: ${l.texto.slice(0, 40)}...`, igual(v, [esperado(l)]), v)) cobertas.add(`${cod}|${l.opcao}`);
    }
    await page.evaluate(() => document.querySelector('#ok').click());
    check(`${cod} avança depois da escolha`, await page.evaluate(temSeguir) && igual(await ver(), [esperado(ls[ls.length - 1])]));
  }
  /* P02 "Outro" abre campo */
  await abrir('M3.P02');
  check('P02 campo extra fechado no início', await page.evaluate(() => document.querySelector('#extra').hidden));
  await page.evaluate(clicarOpcao, 'Outro');
  check('P02 "Outro" abre campo extra', await page.evaluate(() => !document.querySelector('#extra').hidden));
  await page.fill('#extra textarea', 'Aluguel de brinquedos para festas');
  await shot('p02-outro.png');
  await page.evaluate(() => document.querySelector('#ok').click());
  const st2 = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)).R['M3.P02'], CHAVE);
  check('P02 "Outro" grava a descrição e segue para P03', st2.opcao === 'Outro' && st2.detalhe === 'Aluguel de brinquedos para festas');
  await page.evaluate(clicarBotao, '^Seguir$');
  check('P02 "Outro" -> P03', (await page.evaluate(atual)) === 'M3.P03');
  /* P05 detalhe livre */
  await abrir('M3.P05');
  check('P05 mantém campo de texto livre', await page.evaluate(() => !!document.querySelector('#extra textarea') && !document.querySelector('#extra').hidden));
  await page.fill('#extra textarea', 'Compram na padaria do bairro');
  await page.evaluate(() => document.querySelector('#ok').click());
  check('P05 só com texto avança', await page.evaluate(temSeguir));
  /* P11 Sim abre a pergunta complementar (M3.P12) */
  await abrir('M3.P11');
  await page.evaluate(clicarOpcao, 'Sim');
  await page.evaluate(() => document.querySelector('#ok').click());
  await shot('p11-sim.png');
  await page.evaluate(clicarBotao, '^Seguir$');
  check('P11 "Sim" abre a pergunta sobre os períodos (M3.P12)', (await page.evaluate(atual)) === 'M3.P12');
  await abrir('M3.P11');
  await page.evaluate(clicarOpcao, 'Não');
  await page.evaluate(() => document.querySelector('#ok').click());
  await page.evaluate(clicarBotao, '^Seguir$');
  check('P11 "Não" não abre M3.P12', (await page.evaluate(atual)) !== 'M3.P12');

  /* ---- P04 inteiro ---- */
  await abrir('M3.P04', { 'M3.P01': { estado: 'valor', valor: 'Bolos de aniversário' } });
  const txt4 = await page.evaluate(() => document.querySelector('.pergunta').innerText);
  check('P04 sem "R$"', !txt4.includes('R$'), txt4);
  check('P04 campo de número inteiro (teclado numérico)', await page.evaluate(() => document.querySelector('#ent input').getAttribute('inputmode') === 'numeric'));
  check('P04 texto da pergunta = planilha', P['M3.P04'].pergunta === 'Quantos negócios que atendem à mesma necessidade você já identificou (diretos, indiretos ou substitutos)?');
  for (const ruim of ['-1', '2.5', '2,5', 'abc']) {
    await escrever(ruim);
    const v = await ver();
    const salvo = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)).R['M3.P04'], CHAVE);
    if (check(`P04 "${ruim}" bloqueado com a dica de número inválido`, igual(v, [esperado(linha('M3.P04', 'Número inválido'))]) && !(await page.evaluate(temSeguir)) && salvo === undefined, { v, salvo })) cobertas.add('M3.P04|Número inválido');
    if (ruim === '-1') await shot('p04-erro.png');
  }
  await escrever('0');
  if (check('P04 "0" -> Dica', igual(await ver(), [esperado(linha('M3.P04', '0'))]) && await page.evaluate(temSeguir), await ver())) cobertas.add('M3.P04|0');
  await abrir('M3.P04');
  await escrever('3');
  if (check('P04 "3" -> Resposta com [N]=3', igual(await ver(), [esperado(linha('M3.P04', '1 ou mais'), 3)]) && await page.evaluate(temSeguir), await ver())) cobertas.add('M3.P04|1 ou mais');
  check('P04 grava 3', (await page.evaluate((k) => JSON.parse(localStorage.getItem(k)).R['M3.P04'], CHAVE)).valor === '3');
  await shot('p04-valido.png');
  await abrir('M3.P04');
  await page.click('#ns');
  if (check('P04 "Não sei" -> Dica, não bloqueia', igual(await ver(), [esperado(linha('M3.P04', 'Não sei'))]) && await page.evaluate(temSeguir), await ver())) cobertas.add('M3.P04|Não sei');

  /* ---- P15 múltipla ---- */
  const l15 = LINHAS.filter((l) => l.p === 'M3.P15');
  await abrir('M3.P15');
  check('M3.P15 opções = planilha', igual(await page.evaluate(() => [...document.querySelectorAll('.opcao')].map((x) => x.textContent.trim())), l15.map((l) => l.opcao)));
  for (const l of l15) {
    await abrir('M3.P15');
    await page.evaluate(clicarOpcao, l.opcao);
    if (check(`M3.P15 "${l.opcao}" -> Dica`, igual(await ver(), [esperado(l)]), await ver())) cobertas.add(`M3.P15|${l.opcao}`);
  }
  await abrir('M3.P15');
  for (const o of ['Preços praticados', 'Concorrentes', 'Outra dúvida']) await page.evaluate(clicarOpcao, o);
  check('M3.P15 múltipla: 3 marcadas, 3 dicas na ordem', igual(await ver(), ['Preços praticados', 'Concorrentes', 'Outra dúvida'].map((o) => esperado(linha('M3.P15', o)))) && (await page.evaluate(() => document.querySelectorAll('.opcao.sel').length)) === 3);
  check('M3.P15 "Outra dúvida" abre campo livre', await page.evaluate(() => !document.querySelector('#extra').hidden));
  await page.fill('#extra textarea', 'Se a prefeitura exige algo para feira');
  await shot('p15-multipla.png', true);
  await page.evaluate(clicarOpcao, 'Concorrentes');
  check('M3.P15 desmarcar tira a dica', igual(await ver(), ['Preços praticados', 'Outra dúvida'].map((o) => esperado(linha('M3.P15', o)))));
  await page.evaluate(clicarOpcao, 'Não sei');
  check('M3.P15 "Não sei" é exclusivo (limpa as outras)', igual(await ver(), [esperado(linha('M3.P15', 'Não sei'))]) && await page.evaluate(() => document.querySelector('#extra').hidden));
  await page.evaluate(clicarOpcao, 'Concorrentes');
  check('M3.P15 marcar outra limpa o "Não sei"', igual(await ver(), [esperado(linha('M3.P15', 'Concorrentes'))]));
  await page.evaluate(clicarOpcao, 'Concorrentes');
  await page.evaluate(() => document.querySelector('#ok').click());
  check('M3.P15 sem nenhuma marcada não avança', await page.evaluate(() => !document.querySelector('#erro').hidden) && !(await page.evaluate(temSeguir)));

  /* ---- caminho completo até o resultado + persistência ---- */
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.click('#ir');
  const roteiro = {
    'M3.P01': 'Bolos de aniversário por encomenda', 'M3.P02': 'Produto que eu fabrico', 'M3.P03': 'Nos dois', 'M3.P04': '4',
    'M3.P05': 'Faz por conta própria', 'M3.P06': '45', 'M3.P11': 'Sim', 'M3.P12': 'Dezembro e datas comemorativas',
    'M3.P15': ['Preços praticados', 'Canais de venda e divulgação'],
  };
  const vistas = [];
  for (let i = 0; i < 30; i++) {
    const cod = await page.evaluate(atual);
    if (cod === 'RESULTADO') break;
    vistas.push(cod);
    if (cod === 'M3.P04') {
      check('fluxo: P04 sem "R$"', !(await page.evaluate(() => document.querySelector('.pergunta').innerText.includes('R$'))));
    }
    if (cod === 'M3.P06') check('fluxo: P06 (preço) mantém "R$"', await page.evaluate(() => document.querySelector('.pergunta').innerText.includes('R$')));
    if (cod === 'M3.P03') {   // persistência no meio do caminho
      await page.reload();
      await page.click('#ir');
      check('reload no meio: volta à mesma pergunta', (await page.evaluate(atual)) === 'M3.P03');
    }
    const ops = await page.evaluate(() => [...document.querySelectorAll('.opcao')].map((x) => x.textContent.trim()));
    let v = roteiro[cod];
    if (v === undefined) v = ops.length ? ops[0] : 'Resposta de teste';
    if (ops.length) { for (const o of [].concat(v)) await page.evaluate(clicarOpcao, o); await page.evaluate(() => document.querySelector('#ok').click()); }
    else await escrever(v);
    if (!(await page.evaluate(clicarBotao, '^(Seguir|Ver meu resumo)$'))) { check(`fluxo travou em ${cod}`, false); break; }
  }
  const final = await page.evaluate(() => document.body.innerText);
  check('fluxo chega ao resultado', /Resumo das suas respostas/.test(final), vistas);
  check('fluxo passa por todas as 15 perguntas (P04>0, P11=Sim)', vistas.length === 15, vistas);
  check('resultado mostra a resposta da P04 com [N]', final.includes('Você identificou 4 negócio(s) que atendem à mesma necessidade.'));
  check('resultado mostra as 2 dicas da M3.P15', final.includes(linha('M3.P15', 'Preços praticados').texto) && final.includes(linha('M3.P15', 'Canais de venda e divulgação').texto));
  check('resultado sem "rafael"', !/rafael/i.test(final));
  await shot('resultado.png');
  await page.reload();
  check('reload: botão continua', (await page.textContent('#ir')).includes('Continuar'));
  await page.click('#ir');
  const depois = await page.evaluate(() => document.body.innerText);
  check('reload: volta ao resultado com as respostas', /Resumo das suas respostas/.test(depois) && depois.includes('Bolos de aniversário por encomenda'));
  /* corrigir mantém o retorno salvo */
  await abrir('M3.P04', { 'M3.P04': { estado: 'valor', valor: '2' } });
  check('resposta salva reaparece com seu retorno', igual(await ver(), [esperado(linha('M3.P04', '1 ou mais'), 2)]));

  /* estado antigo (sem versão) é descartado */
  await page.evaluate((k) => localStorage.setItem(k, JSON.stringify({ R: { 'M3.P15': { estado: 'opcao', opcao: 'Não sei' } }, hist: ['M3.P15'] })), CHAVE);
  await page.reload();
  check('estado antigo descartado (tela mostra Começar)', (await page.textContent('#ir')).includes('Começar'));

  check('31 de 31 linhas da planilha exibidas', cobertas.size === LINHAS.length, LINHAS.filter((l) => !cobertas.has(`${l.p}|${l.opcao}`)).map((l) => l.p + ' ' + l.opcao));
  check('sem erro de JavaScript', errosJS.length === 0, errosJS);

  await browser.close();
  servidor.close();
  console.log(falhas ? `\n${falhas} falha(s)` : `\nTUDO OK (${cobertas.size}/${LINHAS.length} caminhos)`);
  process.exit(falhas ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
