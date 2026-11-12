/* Teste do LG2 M03 (Turma A) — perguntas reescritas pelo grupo + correções dos testes da turma.
   Lote 4 (relatórios da Ana Luiza, nov/2026): capa em linguagem simples, dica junto da pergunta, "Não sei" que
   ajuda mas não responde (sem segundo campo), aviso de IA antes de todo prompt, perguntas fechadas (riscos,
   comparação), perfil do cliente com opções, um nome por campo nos concorrentes, ordem nova, perguntas
   escondidas, herança dos Módulos 1 e 2, botão "Não" e quadro dos concorrentes no resultado.
   Execute: PW=<pacote playwright> node tests/lg2-m03-turma-a.cjs
   Opcional: SHOTS=<pasta> grava prints de celular (390x844). Sai com código 1 se algo falhar. */
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { chromium } = require(process.env.PW || 'playwright');

const DIR = path.resolve(__dirname, '../public/lg2/turma-a/m03');
const CHAVE = 'lg2-turma-a-m03';
const SHOTS = process.env.SHOTS || '';
const TIPOS = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.webp': 'image/webp' };
const servidor = http.createServer((req, res) => {
  const f = path.join(DIR, decodeURIComponent(req.url.split('?')[0]).replace(/\/$/, '/index.html'));
  if (!f.startsWith(DIR) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': TIPOS[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});

const falhas = [];
let ok = 0;
function check(cond, nome) { if (cond) ok++; else { falhas.push(nome); console.log('FALHA:', nome); } }
const norm = (s) => String(s || '').replace(/\s+/g, ' ').trim();

/* ---------- dados (lidos do arquivo, comparados com o esperado escrito aqui) ---------- */
const ctx = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(DIR, 'dados/modulo3.js'), 'utf8'), ctx);
const D = JSON.parse(JSON.stringify(ctx.window.MODULO3));
const Q = Object.fromEntries(D.perguntas.map((q) => [q.codigo, q]));
const COD = (n) => 'M3.P' + String(n).padStart(2, '0');
const P = (n) => Q[COD(n)];
const Motor = require(path.join(DIR, 'js/motor.js'));
const MM = Motor.montar(D);

/* Tabela "dicas" do relatório (22 perguntas), texto literal sem o "Dica:" */
const DICAS = {
  1: 'Diga com suas palavras o que você vende e para quem. Se não souber como explicar, pense em como você responderia a um vizinho na rua. Exemplo: "Faço bolos caseiros para festas no meu bairro".',
  2: 'Marque Sim se você está ativamente tentando aumentar as vendas ou criar algo novo no momento. Marque Não se quer apenas manter o ritmo atual da sua loja ou serviço.',
  3: 'Pense em quem "rouba" o seu cliente quando ele não compra com você. Se você vende marmitas, a alternativa pode ser a padaria da esquina, o salgado ou o mercado.',
  4: 'Preste atenção ao seu redor! Mudou algo no bairro? Tem um evento novo, uma obra por perto ou mais pessoas pedindo entrega pelo WhatsApp? Isso é uma oportunidade.',
  5: 'Explique o motivo de achar essa ideia boa. Exemplo: "Acho que vai dar certo porque meus clientes sempre pedem isso e não tem ninguém vendendo perto daqui".',
  6: 'Faça duas listas rápidas: uma com o que já está na sua mão (como um celular ou fogão) e outra com o que precisa conseguir (dinheiro, embalagens ou ajuda).',
  7: 'Pense no que pode dar errado no dia a dia. Pode ser o preço dos ingredientes subindo, a chuva forte que esvazia a rua ou um concorrente novo que abriu do lado.',
  8: 'Pense no futuro do seu negócio. As pessoas vão comprar mais pela internet? Usar mais Pix? Exigir entregas mais rápidas? Anote o que você acha que vai mudar.',
  9: 'Escolha o tamanho do seu alcance hoje: apenas no seu bairro/cidade, na região vizinha, no Brasil todo ou até para fora do país.',
  10: 'Pense no seu cliente principal. Se for Pessoa, pense na idade, onde mora e no que ela precisa. Se for Empresa, pense no ramo e tamanho do negócio dela.',
  11: 'Qual "alívio" ou "alegria" você entrega? Exemplos: economizar o tempo do cliente de cozinhar, deixar a pessoa bonita para uma festa ou consertar algo rápido.',
  12: 'Pense no que impede qualquer pessoa de te copiar amanhã. É o valor das máquinas? Uma autorização difícil de conseguir? Ou o fato de seu nome já ser muito famoso?',
  13: 'Marque os lugares onde você fecha negócio: na sua loja física, na conversa do WhatsApp, no perfil do Instagram, em feiras ou em sites/aplicativos.',
  14: 'Seja sincero: escreva o seu "superpoder" (ex.: atendimento rápido e simpático) e o seu ponto fraco (ex.: demora para organizar as contas).',
  15: 'Liste o nome das lojas, pessoas ou perfis do Instagram da sua região que vendem produtos ou serviços praticamente iguais aos seus.',
  16: 'Pense no que faz o seu cliente sumir e ir comprar no vizinho. É o preço mais baixo? O prazo de entrega mais rápido? A variedade de produtos?',
  17: 'Procure no Google Maps como se fosse um cliente (ex.: "salão de beleza perto de mim") ou busque hashtags da sua cidade no Instagram para ver quem aparece.',
  18: 'Descubra detalhes dos vizinhos: qual o horário de funcionamento deles, quanto cobram pelo frete e como respondem no WhatsApp.',
  19: 'Compare lado a lado o seu negócio com os outros em 4 pontos: Preço, Qualidade, Atendimento e Prazo de Entrega. Avalie se você é melhor, igual ou pior.',
  20: 'Descubra o valor cobrado por 3 concorrentes. Anote o valor mais baixo, o mais alto e o valor médio cobrado por eles. Exemplo: "De R$ 30 a R$ 50".',
  21: 'Diga o seu grande atrativo! Pode ser um brinde exclusivo, atendimento personalizado, entregar no mesmo dia ou garantia facilitada.',
  22: 'Leia as avaliações no Google Maps ou comentários no Instagram dos concorrentes. Veja o que os clientes elogiam e do que mais reclamam (ex.: atraso na entrega).',
};
const AVISO_IA = 'Peça perguntas, não conclusões sobre o mercado. A IA pode ajudar a entender melhor seu negócio e público, mas não conhece o seu cliente real nem tem dados atualizados de mercado. Use-a para organizar o roteiro de entrevista e busque as respostas de verdade conversando com pessoas.';
const CONFERIR_IA = 'Confira sempre se as respostas oferecidas pela IA combinam com o que você realmente faz, descarte qualquer número ou estatística que ela mencionar sem indicar uma fonte confiável.';
const MSG_ESCREVA = 'Escreva a sua resposta no campo acima para continuar. Se não souber, toque em “Não sei” para ver uma sugestão.';
const ESCONDIDAS = [6, 11, 16, 17, 21];
/* telas na ordem nova (P02 = Sim): faixa de preço e pontos fortes/fracos dos outros antes da comparação */
const TELAS_SIM = [1, 2, 3, 4, 5, 7, 8, 9, 10, 12, 13, 14, 15, 18, 20, 22, 19];
const TELAS_NAO = [1, 2, 9, 10, 12, 13, 14, 15, 18, 20, 22, 19];
const PROX = (n) => { const i = TELAS_SIM.indexOf(n); return i >= 0 && i + 1 < TELAS_SIM.length ? TELAS_SIM[i + 1] : null; };
const LUGARES = ['No meu bairro ou arredores (local)', 'Em vários bairros da minha cidade', 'Em outras cidades da região', 'Em todo o Brasil (vendas online/entrega)', 'Não sei dizer'];
const DORES = ['Economizar dinheiro / Buscar o menor preço', 'Economizar tempo / Praticidade no dia a dia', 'Resolver uma emergência ou problema imediato',
  'Buscar qualidade, status ou experiência diferenciada', 'Estilo de vida, lazer ou bem-estar', 'Outro', 'Não sei dizer'];
const DOR = 'O que precisa resolver (a dor)', PESSOAS = 'Pessoas comuns (consumidor final)';
const TEXTO_OK = 'Resposta de teste com bastante detalhe';

/* ============ 0. dados ============ */
check(D.perguntas.length === 22 && Object.keys(Q).length === 22, 'dados: os 22 códigos continuam existindo');
for (let n = 1; n <= 22; n++) check(P(n).dica === DICAS[n], `dados: dica nova literal na pergunta ${n}`);
check(JSON.stringify(D.perguntas.filter((q) => q.oculta).map((q) => +q.codigo.slice(4))) === JSON.stringify(ESCONDIDAS), 'dados: escondidas = já tem/falta, problema do cliente, concorrente de verdade, como descobrir, o que o cliente ganha');
check(P(6).pergunta.startsWith('O que você já tem e o que ainda falta') && P(11).pergunta.startsWith('Que problema ou vontade do seu cliente') && P(21).pergunta.startsWith('O que o seu cliente ganha'), 'dados: as escondidas são as da lista de exclusão');
check(JSON.stringify(Motor.telas(MM, { 'M3.P02': { estado: 'opcao', opcao: 'Sim' } }, {}).map((t) => +t[0].slice(4))) === JSON.stringify(TELAS_SIM), 'motor: 17 telas na ordem nova, uma pergunta por tela');
check(JSON.stringify(Motor.telas(MM, { 'M3.P02': { estado: 'opcao', opcao: 'Não' } }, {}).map((t) => +t[0].slice(4))) === JSON.stringify(TELAS_NAO), 'motor: P02 Não pula 3 a 8 (12 telas)');
check(!/rafael/i.test(JSON.stringify(D)), 'dados: sem "Rafael"');
const promptsVis = D.perguntas.filter((q) => !q.oculta).flatMap((q) => q.caminhos.filter((c) => c.tipo === 'Prompt de IA').map((c) => [q.codigo, Motor.partesPrompt(c.texto).prompt]));
check(promptsVis.length >= 9 && promptsVis.every(([, p]) => /Me faça 5 perguntas simples/.test(p)), `prompts: todos no mesmo gabarito, pedindo perguntas (${promptsVis.filter(([, p]) => !/Me faça 5 perguntas/.test(p)).map((x) => x[0])})`);
check(['M3.P01', 'M3.P04', 'M3.P08', 'M3.P12', 'M3.P13'].every((c) => promptsVis.some(([k, p]) => k === c && /^Eu /.test(p))), 'prompts 1, 4, 8, 12 e 13: começam pelo contexto da pessoa');
check(Q['M3.P03'].caminhos.find((c) => c.opcao === 'Não sei').texto === 'Tudo bem. Pense em onde o cliente compraria se você não existisse.', 'P03: dica do Não sei sem "você pode voltar e preencher depois"');
check(P(7).pergunta === 'Existe alguma coisa que pode atrapalhar suas vendas?' && !/\(Ex\./.test(P(7).variantes.ideia.pergunta), 'P07: enunciado sem o "(Ex.: …)"');
check(JSON.stringify(P(7).opcoes) === JSON.stringify(['Concorrente novo', 'Preço dos insumos subindo', 'Queda nas vendas em certa época', 'Mudança de regra', 'Outro', 'Não sei']), 'P07: opções das figuras + Outro + Não sei por último');
check(P(10).rotulo_naosei === 'Ainda não tenho clientes' && P(13).rotulo_naosei === 'Ainda não defini o canal de vendas' && P(13).opcoes[P(13).opcoes.length - 1] === 'Não sei', 'P10/P13: "Não sei" com o texto novo e por último');
check(P(10).marcadores.Idade[0] === 'Até 10 anos (infantil)' && JSON.stringify(P(10).marcadores['Onde mora']) === JSON.stringify(LUGARES) && JSON.stringify(P(10).marcadores[DOR]) === JSON.stringify(DORES), 'P10: faixa infantil, onde vivem e problema com as opções do relatório');
check(P(10).caminhos.find((c) => c.opcao === 'Campos complementares incompletos').texto === 'Preencha o que você já sabe.', 'P10: dica sem "o que ficar de fora dá para completar depois"');
check(!P(12).exemplos && !P(7).exemplos, 'P12/P07: sem as opções que apareciam no Não sei');
check(P(15).pergunta === 'Quem já vende o mesmo que você quer vender, ou algo muito parecido? Cite lojas, pessoas ou perfis que você conhece.' && P(15).campos_min === 3, 'P15: enunciado novo e pelo menos 3 campos');
check(!/Perguntar a clientes onde mais já compraram/.test(JSON.stringify(P(17))) && !/Perguntar a clientes onde mais já compraram/.test(JSON.stringify(P(15))), 'passo a passo de como descobrir: sem a sugestão 4');
check(P(19).naosei === false && P(19).outro === 'Outro ponto', 'P19: fechada, sem Não sei, com Outro ponto');

(async () => {
  await new Promise((r) => servidor.listen(0, '127.0.0.1', r));
  const URL = `http://127.0.0.1:${servidor.address().port}/index.html`;
  const browser = await chromium.launch();
  const ctxB = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await ctxB.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: URL.replace('/index.html', '') });
  const page = await ctxB.newPage();
  const erros = [];
  page.on('pageerror', (e) => erros.push(String(e)));
  page.on('dialog', (d) => d.accept());

  const clicar = (sel, txt) => page.evaluate(([s, t]) => {
    const n = [...document.querySelectorAll(s)].find((x) => x.textContent.replace(/\s+/g, ' ').trim() === t);
    if (!n) return false; n.click(); return true;
  }, [sel, txt]);
  const espera = (ms = 120) => page.waitForTimeout(ms);
  const titulo = () => page.evaluate(() => (document.querySelector('h2.q') || {}).textContent || '');
  const titulos = () => page.evaluate(() => [...document.querySelectorAll('h2.q')].map((x) => x.textContent.replace(/\s+/g, ' ').trim()));
  const tela = () => page.evaluate(() => document.body.innerText);
  const estado = () => page.evaluate((k) => JSON.parse(localStorage.getItem(k)), CHAVE);
  const RR = async () => (await estado()).R;
  const erroTxt = () => page.evaluate(() => { const e = document.querySelector('#erro'); return e && !e.hidden ? e.textContent : ''; });
  const naTela = async (n) => norm(await titulo()) === norm(P(n).pergunta);
  async function semCodigos(onde) { check(!/\bP\d{2}\b|M3\.|rafael/i.test(await tela()), `sem códigos/nome na tela (${onde})`); }
  async function fonte16(onde) {
    const pequenos = await page.evaluate(() => [...document.querySelectorAll('body *')].filter((e) => {
      const temTexto = [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
      const r = e.getBoundingClientRect();
      return temTexto && r.width > 0 && r.height > 0 && parseFloat(getComputedStyle(e).fontSize) < 16;
    }).map((e) => e.tagName + '.' + e.className));
    check(!pequenos.length, `letra >= 16px (${onde}) ${pequenos.slice(0, 3).join(',')}`);
  }
  async function caixas(sel = '.caminho') {
    return page.evaluate((sel) => [...document.querySelectorAll(sel)].map((b) => {
      const c = b.cloneNode(true); const tit = c.querySelector('b').textContent; c.querySelector('b').remove();
      c.querySelectorAll('.btn-copiar').forEach((x) => x.remove());
      return { op: b.dataset.op, tipo: b.dataset.tipo, tit, txt: c.innerText.replace(/\s+/g, ' ').trim(), li: [...b.querySelectorAll('li')].map((x) => x.textContent.trim()),
        aviso: (b.querySelector('.ia-aviso') || {}).textContent || '', conferir: (b.querySelector('.conferir') || {}).textContent || '', prompt: (b.querySelector('.prompt-txt') || {}).textContent || '' };
    }), sel);
  }
  async function shot(nome) { if (!SHOTS) return; await espera(400); fs.mkdirSync(SHOTS, { recursive: true }); await page.screenshot({ path: path.join(SHOTS, nome + '.png'), fullPage: false }); }

  /* abre a pergunta n com respostas anteriores (P02 = Sim quando a pergunta é de 3 a 8) */
  async function abrir(n, R = {}, outros = {}, txt = null, v = 7) {
    const base = n >= 3 && n <= 8 ? { 'M3.P02': { estado: 'opcao', opcao: 'Sim' } } : {};
    await page.goto(URL);
    await page.evaluate(([k, s, o]) => { localStorage.clear(); localStorage.setItem(k, s); Object.entries(o).forEach(([c, x]) => localStorage.setItem(c, JSON.stringify(x))); },
      [CHAVE, JSON.stringify({ v, R: Object.assign(base, R), hist: [COD(n)] }), outros]);
    await page.reload();
    await clicar('button', 'Continuar de onde parei');
    await espera();
    check((await titulos()).includes(norm(txt || P(n).pergunta)), `abre pergunta ${n}`);
  }
  async function digitar(txt, i = 0) { await page.locator('#ent textarea, #ent input').nth(i).fill(txt); }

  /* ============ 1. capa em linguagem simples (Figura 2) ============ */
  await page.goto(URL); await page.evaluate(() => localStorage.clear()); await page.reload(); await espera();
  const capa = await page.evaluate(() => ({ h1: document.querySelector('h1').textContent.trim(), txt: document.querySelector('.heroi-txt p').textContent.trim(),
    cart: [...document.querySelectorAll('.cartao')].map((c) => ({ h: c.querySelector('h3').textContent, li: [...c.querySelectorAll('li')].map((x) => x.textContent), p: (c.querySelector(':scope > p') || {}).textContent || '' })),
    ir: document.querySelector('#ir').offsetParent !== null }));
  check(capa.h1 === 'Conhecendo o mercado e os concorrentes' && capa.txt === D.mapa.objetivo && /^Aqui você vai descobrir quem são seus concorrentes/.test(capa.txt), `capa: título e texto simples (${capa.h1})`);
  check(capa.cart[0].p === 'Para quem já tem uma ideia de negócio, mas quer pesquisar melhor o mercado, descobrir quem faz a mesma coisa e saber como se destacar na sua região.', 'capa: "Para quem é" simples');
  check(capa.cart[1].li.length === 3 && capa.cart[1].li[0] === 'A descrição simples da sua ideia de negócio.', 'capa: "O que ter em mãos" em 3 itens curtos');
  check(capa.cart[2].li.length === 3 && capa.cart[2].li.some((x) => /Módulo 4: Produto, proposta de valor e teste da ideia/.test(x)) && !/Oferta e experimentação|Oferta e Testes/.test(capa.cart[2].li.join(' ')), 'capa: entrega com o nome certo do Módulo 4');
  check(capa.ir, 'capa: Começar visível');
  await semCodigos('capa'); await fonte16('capa');
  check(await page.evaluate(() => [...document.querySelectorAll('.rodape img')].map((i) => i.alt).join()) === 'FACC,UFJF,Governo de Minas Gerais', 'rodapé com FACC/UFJF/MG');
  await shot('l4_m03_capa');

  /* ============ 2. dica junto da pergunta (sem tocar em nada) ============ */
  for (const n of TELAS_SIM.filter((n) => n !== 1)) {
    await abrir(n);
    /* pergunta de escrever (um campo só): a dica fica dentro do campo, antes de digitar; nas outras, no cartão */
    if (Motor.campo(P(n)) === 'texto') {
      const c = await page.evaluate(() => { const t = document.querySelector('#ent textarea'); return { ph: t && t.placeholder, vazio: t && !t.value, cx: !!document.querySelector('.dica-q') }; });
      check(c.vazio && norm(c.ph) === norm('Dica: ' + DICAS[n]) && !c.cx, `pergunta ${n}: dica dentro do campo de escrever, texto literal, sem cartão repetido`);
      await semCodigos(`pergunta ${n}`);
      continue;
    }
    const d = await page.evaluate(() => { const b = document.querySelector('.dica-q'); return b && { t: b.querySelector('b').textContent, txt: [...b.querySelectorAll('p')].map((p) => p.textContent).join(' '), vis: b.offsetParent !== null }; });
    check(d && d.vis && d.t === 'Dica' && norm(d.txt) === norm(DICAS[n]), `pergunta ${n}: dica aparece com a pergunta, texto literal`);
    await semCodigos(`pergunta ${n}`);
  }

  /* ============ 3. "Não sei": sugestão sem segundo campo; só segue depois de escrever no campo da pergunta ============ */
  const ABERTAS = [1, 3, 4, 5, 8, 12, 14, 15, 18, 20, 22];
  for (const n of ABERTAS) {
    await abrir(n);
    const nsBtn = await page.locator('#ns').count();
    check(nsBtn === 1, `pergunta ${n}: botão Não sei`);
    await clicar('#ns', 'Não sei'); await espera();
    const cx = await caixas('#ajudans .caminho');
    const esperadas = P(n).caminhos.filter((c) => /^Não sei/.test(c.opcao)).map((c) => c.tipo);
    check(JSON.stringify(cx.map((c) => c.tipo)) === JSON.stringify(esperadas), `pergunta ${n} Não sei: mostra a sugestão (${cx.map((c) => c.tipo)})`);
    const campos = await page.evaluate(() => ({ fora: document.querySelectorAll('#ajudans textarea, #ajudans input, #msg textarea, #msg input').length, frase: !!document.querySelector('.frase'), nota: (document.querySelector('#nota-ns') || {}).textContent || '' }));
    check(campos.fora === 0 && !campos.frase, `pergunta ${n} Não sei: nenhum segundo campo de resposta`);
    check(/escreva a sua resposta no campo da pergunta/i.test(campos.nota), `pergunta ${n} Não sei: diz para responder no campo da pergunta`);
    for (const c of cx.filter((c) => c.tipo === 'Prompt de IA')) {
      check(c.tit === 'USE A IA COM CUIDADO' && norm(c.aviso) === AVISO_IA && norm(c.conferir) === CONFERIR_IA && /Me faça 5 perguntas/.test(c.prompt), `pergunta ${n}: aviso de IA antes do prompt e frase de conferir depois`);
    }
    await clicar('#ok', 'Continuar'); await espera();
    const e = await erroTxt();
    check(await naTela(n) && e && !(await RR())[COD(n)], `pergunta ${n} Não sei + Continuar vazio: não avança nem grava (${e})`);
    if (n === 3 || n === 4) check(e === MSG_ESCREVA, `pergunta ${n}: mensagem pede a resposta no campo`);
    if (n === 4) { await page.evaluate(() => document.querySelector('.b-ia').scrollIntoView({ block: 'center' })); await shot('l4_m03_nao_sei_ia'); await fonte16('pergunta com prompt'); }
    /* responde no campo original e segue */
    if (n === 20) { await digitar('40', 0); await digitar('60', 1); }
    else if (n === 14 || n === 22) { await digitar(TEXTO_OK, 0); await digitar(TEXTO_OK, 1); }
    else if (n === 15) { await page.locator('#ent input[data-nome]').nth(0).fill('Doces da Ana'); }
    else await digitar(TEXTO_OK);
    check(await page.evaluate(() => document.querySelectorAll('#ajudans .caminho').length > 0), `pergunta ${n}: a sugestão continua à vista enquanto escreve`);
    await clicar('#ok', 'Continuar'); await espera();
    const r = (await RR())[COD(n)];
    check(r && r.estado === 'valor', `pergunta ${n}: grava a resposta escrita (não "Não sei")`);
    if (PROX(n)) check(await naTela(PROX(n)), `pergunta ${n}: segue para a pergunta ${PROX(n)}`);
  }
  /* prompt copiável com [colchetes] */
  await abrir(4); await clicar('#ns', 'Não sei'); await espera();
  await page.locator('.btn-copiar').first().click(); await espera(300);
  const copiado = await page.evaluate(() => navigator.clipboard.readText());
  check(copiado === Motor.partesPrompt(P(4).caminhos.find((c) => c.opcao === 'Não sei').texto).prompt && /\[cidade ou bairro\]/.test(copiado), 'prompt copiado inteiro, com [colchetes]');
  check(norm(await page.locator('.btn-copiar').first().textContent()) === 'Copiado', 'botão mostra Copiado');
  /* resposta antiga "Não sei" (antes deste lote): reabre com a sugestão e espera a resposta */
  await abrir(3, { 'M3.P03': { estado: 'naosei' } });
  check((await caixas('#ajudans .caminho')).length === 1 && await page.inputValue('#ent textarea') === '', 'Não sei antigo: reabre com a sugestão e o campo vazio');

  /* ============ 4. botão "Não" ao lado do "Não sei" ============ */
  for (const n of [4, 12]) {
    await abrir(n);
    const alt = await page.evaluate(() => [...document.querySelectorAll('#alt button')].map((b) => b.textContent));
    check(JSON.stringify(alt) === '["Não","Não sei"]', `pergunta ${n}: "Não" ao lado do "Não sei"`);
    await clicar('#nao', 'Não'); await espera();
    check(await page.inputValue('#ent textarea') === 'Não' && await page.evaluate(() => document.querySelector('#nao').getAttribute('aria-pressed') === 'true'), `pergunta ${n}: "Não" responde sem digitar`);
    await clicar('#ok', 'Continuar'); await espera();
    check(JSON.stringify((await RR())[COD(n)]) === '{"estado":"valor","valor":"Não"}' && await naTela(PROX(n)), `pergunta ${n}: "Não" grava e segue sem dica de resposta curta`);
  }

  /* ============ 5. riscos (P07): resposta fechada + Outro; Não sei não responde ============ */
  await abrir(7);
  const ops7 = await page.evaluate(() => [...document.querySelectorAll('#ent .opcao')].map((b) => b.textContent.trim()));
  check(JSON.stringify(ops7) === JSON.stringify(P(7).opcoes), 'P07: opções fechadas na tela');
  await clicar('.opcao', 'Não sei'); await espera();
  const cx7 = await caixas('#msg .caminho');
  check(cx7.length === 1 && cx7[0].tit === 'USE A IA COM CUIDADO' && norm(cx7[0].conferir) === CONFERIR_IA, 'P07 Não sei: sugestão da IA com o aviso');
  await clicar('#ok', 'Continuar'); await espera();
  check(await naTela(7) && (await caixas('#msg .caminho')).some((c) => c.tipo === 'Alerta' && c.txt === 'Marque pelo menos uma opção para continuar.') && !(await RR())['M3.P07'], 'P07: só "Não sei" não deixa seguir');
  await clicar('.opcao', 'Preço dos insumos subindo'); await clicar('.opcao', 'Outro'); await espera();
  check(JSON.stringify(await page.evaluate(() => [...document.querySelectorAll('#ent .opcao.sel')].map((b) => b.dataset.op))) === '["Preço dos insumos subindo","Outro"]', 'P07: marcar uma opção tira o "Não sei"');
  await clicar('#ok', 'Continuar'); await espera();
  check(await erroTxt() === 'Escreva o que é “Outro” ou desmarque essa opção.', 'P07: Outro vazio pede o texto');
  await page.locator('.extra textarea').fill('Chuva forte esvazia a feira');
  await clicar('#ok', 'Continuar'); await espera();
  check(JSON.stringify((await RR())['M3.P07']) === JSON.stringify({ estado: 'opcoes', opcoes: ['Preço dos insumos subindo', 'Outro'], detalhe: 'Chuva forte esvazia a feira' }) && await naTela(8), 'P07: grava opções + Outro e segue');
  await abrir(7, { 'M3.P07': { estado: 'valor', valor: 'Concorrente abriu do lado' } });
  check(JSON.stringify(await page.evaluate(() => [...document.querySelectorAll('#ent .opcao.sel')].map((b) => b.dataset.op))) === '["Outro"]' && await page.inputValue('.extra textarea') === 'Concorrente abriu do lado', 'P07: resposta antiga em texto reabre como "Outro" com o texto');

  /* ============ 6. perfil do cliente (P10) ============ */
  await abrir(10);
  check(await page.evaluate(() => document.querySelector('#ns').textContent) === 'Ainda não tenho clientes', 'P10: "Não sei" virou "Ainda não tenho clientes"');
  await clicar('#ns', 'Ainda não tenho clientes'); await espera();
  const cx10 = await caixas('#ajudans .caminho');
  check(cx10.length === 1 && cx10[0].tit === 'USE A IA COM CUIDADO' && /ainda não tenho clientes/.test(cx10[0].prompt) && /cliente ideal/.test(cx10[0].prompt), 'P10: sugestão de cliente ideal com o aviso de IA');
  check(/marque acima quem você imagina/.test(await page.evaluate(() => document.querySelector('#nota-ns').textContent)) && !/lista de “Não sei”/.test(await tela()), 'P10: pede para marcar quem compraria (sem seguir com "Não sei")');
  await clicar('#ok', 'Continuar'); await espera();
  check(await naTela(10) && /Escolha uma opção acima/.test(await erroTxt()) && !(await RR())['M3.P10'], 'P10: quem mais compra é obrigatório');
  await clicar('.opcao', PESSOAS); await espera();
  const rot10 = await page.evaluate(() => [...document.querySelectorAll('.campos .item > span')].map((s) => s.textContent));
  check(JSON.stringify(rot10) === JSON.stringify(['Idade', 'Renda', 'Ocupação', 'Onde vivem os seus clientes?', 'Qual principal problema ou necessidade eles buscam resolver?']), `P10: perguntas do perfil (${rot10.join(' | ')})`);
  check(await page.evaluate(() => document.querySelectorAll('.campos .item-marcar').length === 5 && document.querySelectorAll('.campos .campo-outro').length === 1), 'P10: todos os itens com opções; "Outro" com campo');
  check(await page.evaluate(() => [...document.querySelectorAll('.item-marcar[data-c="Idade"] .chip')].some((c) => c.textContent === 'Até 10 anos (infantil)')), 'P10: faixa etária infantil');
  check(await page.evaluate(() => document.querySelector('.campo-outro').offsetParent === null), 'P10: campo do Outro fechado até marcar');
  await clicar('.item-marcar[data-c="Onde mora"] .chip', 'Em vários bairros da minha cidade');
  await clicar('.item-marcar[data-c="Onde mora"] .chip', 'Não sei dizer');
  check(JSON.stringify(await page.evaluate(() => [...document.querySelectorAll('.item-marcar[data-c="Onde mora"] .chip.sel')].map((c) => c.textContent))) === '["Não sei dizer"]', 'P10: "Não sei dizer" é exclusivo');
  await clicar('.item-marcar[data-c="Onde mora"] .chip', 'No meu bairro ou arredores (local)');
  await clicar('.item-marcar[data-c="O que precisa resolver (a dor)"] .chip', DORES[1]);
  await clicar('.item-marcar[data-c="O que precisa resolver (a dor)"] .chip', 'Outro'); await espera();
  await page.locator('.campo-outro').fill('Festa de aniversário');
  await clicar('.chip', 'Até 10 anos (infantil)');
  await shot('l4_m03_perfil');
  await clicar('#ok', 'Continuar'); await espera();
  check(await clicar('#ok', 'Continuar mesmo assim'), 'P10: perfil incompleto não trava (Continuar mesmo assim)');
  await espera();
  let R = await RR();
  check(R['M3.P10'].opcao === PESSOAS && R['M3.P10'].campos['Onde mora'] === 'No meu bairro ou arredores (local)' && R['M3.P10'].campos[DOR] === `${DORES[1]}; Outro: Festa de aniversário` && R['M3.P10'].campos.Idade === 'Até 10 anos (infantil)',
    `P10: marcas guardadas como texto, no formato que os outros módulos leem (${JSON.stringify(R['M3.P10'].campos)})`);
  check(R['M3.P11'] && R['M3.P11'].valor === `${DORES[1]}; Festa de aniversário` && R['M3.P11'].doPerfil, 'P10: o problema marcado vai para a pergunta escondida da dor');
  check(await naTela(12), 'P10: segue para a 12 (a pergunta da dor está escondida)');
  /* herança do Módulo 2: tipo de cliente e marcas */
  const M2 = { v: 9, R: { 'M2.P07': { estado: 'opcao', opcao: 'Os dois' }, 'M2.P11': { estado: 'opcao', opcao: 'Meu bairro' }, 'M2.P13': { estado: 'opcao', opcao: 'Qualidade' }, 'M2.P09': { estado: 'opcao', opcao: 'Idosos/aposentados' } } };
  await abrir(10, {}, { 'lg2-turma-b-m02': M2 });
  const h2 = await page.evaluate(() => ({ sel: [...document.querySelectorAll('#ent .opcao.sel')].map((b) => b.dataset.op), selo: (document.querySelector('.selo-m') || {}).textContent,
    chips: [...document.querySelectorAll('.campos .chip.sel')].map((c) => c.textContent), nota: (document.querySelector('.nota-perfil') || {}).textContent }));
  check(JSON.stringify(h2.sel) === `["${PESSOAS}","Empresas"]` && h2.selo === 'Veio do Módulo 2. Confira e troque se quiser.', `P10: tipo de cliente do Módulo 2 já marcado, com selo (${JSON.stringify(h2)})`);
  check(['60 anos ou mais', 'Aposentados', 'No meu bairro ou arredores (local)', DORES[3]].every((x) => h2.chips.includes(x)) && /já respondeu antes/.test(h2.nota || ''), 'P10: marcas do perfil vindas do Módulo 2');
  await shot('l4_m03_perfil_modulo2');
  await clicar('.opcao', 'Empresas'); await clicar('#ok', 'Continuar'); await espera();
  if (await page.locator('#ok').textContent() === 'Continuar mesmo assim') await clicar('#ok', 'Continuar mesmo assim');
  await espera();
  R = await RR();
  check(JSON.stringify(R['M3.P10'].opcoes) === `["${PESSOAS}"]` && R['M3.P10'].campos.Idade === '60 anos ou mais', 'P10: dá para trocar o que veio do Módulo 2');
  check(await page.evaluate(() => localStorage.getItem('lg2-turma-b-m02')) === JSON.stringify(M2), 'Módulo 2 nunca é alterado');
  /* sem o Módulo 2: onde vivem já vem marcado pelo que a pessoa disse sobre até onde vende */
  await abrir(10, { 'M3.P09': { estado: 'opcao', opcao: 'Na minha região (estado e cidades próximas)' } });
  await clicar('.opcao', PESSOAS); await espera();
  check(JSON.stringify(await page.evaluate(() => [...document.querySelectorAll('.item-marcar[data-c="Onde mora"] .chip.sel')].map((c) => c.textContent))) === '["Em outras cidades da região"]', 'P10: onde vivem pré-marcado pela resposta de até onde vende (sem repetir)');
  /* empresas: local também com opções */
  await clicar('.opcao', PESSOAS); await clicar('.opcao', 'Empresas'); await espera();
  check(JSON.stringify(await page.evaluate(() => [...document.querySelectorAll('.campos .item > span')].map((s) => s.textContent))) === '["Ramo","Tamanho","Equipe","Onde ficam essas empresas?"]', 'P10 Empresas: 4 itens com opções');

  /* ============ 7. canais (P13) ============ */
  await abrir(13);
  const ops13 = await page.evaluate(() => [...document.querySelectorAll('#ent .opcao')].map((b) => b.textContent.trim()));
  check(ops13[ops13.length - 1] === 'Ainda não defini o canal de vendas' && ops13.length === 10, 'P13: "Ainda não defini o canal de vendas" por último');
  await clicar('.opcao', 'Ainda não defini o canal de vendas'); await espera();
  const cx13 = await caixas('#msg .caminho');
  check(cx13.length === 1 && /ainda não defini como vou vender/.test(cx13[0].prompt) && cx13[0].tit === 'USE A IA COM CUIDADO', 'P13: prompt para quem ainda não definiu, com o aviso');
  await clicar('#ok', 'Continuar'); await espera();
  check(await naTela(13) && (await caixas('#msg .caminho')).some((c) => c.txt === 'Marque pelo menos um canal para continuar.'), 'P13: precisa marcar um canal');
  await clicar('.opcao', 'WhatsApp (WhatsApp Business)'); await clicar('.opcao', 'Outro'); await page.locator('.extra textarea').fill('Feira de domingo');
  await clicar('#ok', 'Continuar'); await espera();
  check(JSON.stringify((await RR())['M3.P13']) === JSON.stringify({ estado: 'opcoes', opcoes: ['WhatsApp (WhatsApp Business)', 'Outro'], detalhe: 'Feira de domingo' }), 'P13: canais + Outro no formato que o Módulo 10 lê');

  /* ============ 8. concorrentes: um nome por campo; cada pergunta na sua tela ============ */
  await abrir(15);
  check(JSON.stringify(await titulos()) === JSON.stringify([norm(P(15).pergunta)]), 'P15: sozinha na tela');
  check(await page.locator('#ent input[data-nome]').count() === 3, 'P15: 3 campos de nome');
  await clicar('#mais-nome', '+ Adicionar outro nome'); await espera();
  check(await page.locator('#ent input[data-nome]').count() === 4, 'P15: "Adicionar outro nome" abre mais um campo');
  await clicar('#ok', 'Continuar'); await espera();
  check(/pelo menos um nome/.test(await erroTxt()) && await naTela(15), 'P15: sem nenhum nome não segue');
  await page.locator('#ent input[data-nome]').nth(0).fill('Doces da Ana');
  await page.locator('#ent input[data-nome]').nth(1).fill('Padaria Central');
  await shot('l4_m03_concorrentes_nomes');
  await clicar('#ok', 'Continuar'); await espera();
  check(JSON.stringify((await RR())['M3.P15']) === JSON.stringify({ estado: 'valor', valor: 'Doces da Ana, Padaria Central', nomes: ['Doces da Ana', 'Padaria Central'] }) && await naTela(18), 'P15: grava os nomes (e o texto que o Módulo 10 lê) e segue para "onde ficam"');
  check(JSON.stringify(await titulos()) === JSON.stringify([norm(P(18).pergunta)]), 'P18: sozinha na tela');
  await abrir(15, { 'M3.P15': { estado: 'valor', valor: 'Lava-jato do Zé e o posto da avenida' } });
  check(await page.inputValue('#ent input[data-nome="1"]') === 'Lava-jato do Zé' && await page.inputValue('#ent input[data-nome="2"]') === 'O posto da avenida', 'P15: resposta antiga em texto abre separada, um nome por campo');

  /* ============ 9. faixa de preço (P20): sem a "Resposta" extra; números com erro e aviso ============ */
  await abrir(20);
  check(await page.evaluate(() => [...document.querySelectorAll('#ent input')].every((i) => i.inputMode === 'decimal')), 'P20: teclado de números');
  for (const [txt, msg] of [['Bolos caseiros de pote', 'Digite só números. Ex.: 12,50'], ['-5', 'O preço não pode ser negativo. Digite só números. Ex.: 12,50'], ['', 'Digite o menor preço que você viu ou toque em “Não sei”.']]) {
    await digitar(txt, 0); await clicar('#ok', 'Continuar'); await espera();
    check(await erroTxt() === msg && !(await RR())['M3.P20'] && await naTela(20), `P20 "${txt}": erro simples, não grava`);
  }
  await digitar('1.500', 0); await clicar('#ok', 'Continuar'); await espera();
  check(/parece alto/.test(await erroTxt()) && await clicar('#ok', 'Continuar mesmo assim'), 'P20 R$ 1.500: aviso que não trava');
  await espera();
  check((await RR())['M3.P20'].min === 1500 && await naTela(22), 'P20: segundo toque grava e segue para a 22');
  await abrir(20);
  await digitar('40', 0); await digitar('60', 1); await clicar('#ok', 'Continuar'); await espera();
  check(await naTela(22) && JSON.stringify((await RR())['M3.P20']) === JSON.stringify({ estado: 'valor', valor: 'de R$ 40,00 a R$ 60,00', min: 40, max: 60 }), 'P20: segue direto, sem a caixa "Os outros costumam cobrar…", formato lido pelo Módulo 5');

  /* ============ 10. comparação (P19) fechada ============ */
  await abrir(19);
  check(await page.locator('#ns').count() === 0, 'P19: sem "Não sei"');
  check(JSON.stringify(await page.evaluate(() => [...document.querySelectorAll('.t-linha')].map((x) => x.dataset.crit))) === JSON.stringify(P(19).criterios), 'P19: tabela com os 4 pontos');
  const marca = (c, i) => page.evaluate(([c, i]) => [...document.querySelectorAll('.t-linha')].find((x) => x.dataset.crit === c).querySelectorAll('.t-op')[i].click(), [c, i]);
  await marca('Preço', 2); await marca('Qualidade', 2);
  await clicar('#ok', 'Continuar'); await espera();
  check(await erroTxt() === 'Marque Melhor, Igual ou Pior em cada item para continuar.' && await naTela(19), 'P19: falta marcar = não segue');
  await marca('Atendimento', 2); await espera();
  check((await caixas('#msg .caminho')).some((c) => c.tipo === 'Resposta'), 'P19: 3 "Pior" mostra a mensagem do grupo');
  await marca('Atendimento', 0); await marca('Prazo (tempo para entregar)', 1); await espera();
  check(!(await caixas('#msg .caminho')).some((c) => c.tipo === 'Resposta'), 'P19: trocar volta a 2 "Pior"');
  await clicar('#outro-t', 'Outro ponto'); await espera();
  await clicar('#ok', 'Continuar'); await espera();
  check(/outro ponto/.test(await erroTxt()), 'P19: Outro ponto vazio pede o texto');
  await page.locator('.extra textarea').fill('Variedade de sabores: melhor');
  await page.evaluate(() => document.querySelector('.tabela').scrollIntoView({ block: 'start' }));
  await shot('l4_m03_comparacao');
  await clicar('#ok', 'Continuar'); await espera();
  R = await RR();
  check(R['M3.P19'] && R['M3.P19'].valor === 'Preço: Pior; Qualidade: Pior; Atendimento: Melhor; Prazo (tempo para entregar): Igual; Outro ponto: Variedade de sabores: melhor' && R['M3.P19'].outro === 'Variedade de sabores: melhor', `P19: grava a tabela em texto (${R['M3.P19'] && R['M3.P19'].valor})`);
  check(await page.evaluate(() => !!document.querySelector('#entendemos')), 'P19 é a última: vai ao resultado');

  /* ============ 11. o que vende veio do Módulo 1: bloco fixo para confirmar ============ */
  const SO_CABECA = { estado: 'opcao', opcao: 'Ainda está só na minha cabeça' };
  const M1 = (p01, extra = {}) => ({ v: 3, R: Object.assign({ 'M1.P01': p01, 'M1.P03': { estado: 'valor', valor: 'lavagem de carro em casa' },
    'M1.P03A': { estado: 'opcao', opcao: 'Serviço: meu cliente paga pelo trabalho que realizo' } }, extra) });
  await page.goto(URL);
  await page.evaluate((m1) => { localStorage.clear(); localStorage.setItem('lg2-turma-a-m01', m1); }, JSON.stringify(M1(SO_CABECA)));
  await page.reload(); await clicar('button', 'Começar'); await espera();
  const b1 = await page.evaluate(() => ({ kick: document.querySelector('.passo').textContent, bloco: (document.querySelector('.herdado-txt') || {}).textContent, campo: document.querySelector('#ent').offsetParent !== null,
    selo: (document.querySelector('.selo-m') || {}).textContent, ns: !!document.querySelector('#ns') && document.querySelector('#ns').offsetParent !== null }));
  check(b1.kick === 'Pergunta 1 de 17' && b1.bloco === 'lavagem de carro em casa (serviço)' && !b1.campo && !b1.ns && /^Veio do Módulo 1/.test(b1.selo), `P01: resposta do Módulo 1 em bloco fixo para confirmar (${JSON.stringify(b1)})`);
  await shot('l4_m03_p01_modulo1');
  await clicar('#ok', 'Continuar'); await espera();
  check(JSON.stringify((await RR())['M3.P01']) === JSON.stringify({ estado: 'valor', valor: 'lavagem de carro em casa (serviço)', doM1: true }) && norm(await titulo()) === norm(P(2).variantes.ideia.pergunta), 'P01: confirmar grava com o selo e segue');
  await clicar('#v', 'Voltar'); await espera();
  await clicar('#trocar', 'Trocar'); await espera();
  check(await page.evaluate(() => document.querySelector('#ent textarea').offsetParent !== null) && await page.inputValue('#ent textarea') === 'lavagem de carro em casa (serviço)', 'P01: "Trocar" abre o campo com o que veio do Módulo 1');
  await digitar('Lava-jato que vai até a casa do cliente'); await clicar('#ok', 'Continuar'); await espera();
  check(JSON.stringify((await RR())['M3.P01']) === JSON.stringify({ estado: 'valor', valor: 'Lava-jato que vai até a casa do cliente' }), 'P01: a troca fica guardada neste módulo');
  check(await page.evaluate(() => localStorage.getItem('lg2-turma-a-m01')) === JSON.stringify(M1(SO_CABECA)), 'Módulo 1 nunca é alterado');
  await page.goto(URL);
  await page.evaluate((m1) => { localStorage.clear(); localStorage.setItem('lg2-turma-a-m01', m1); }, JSON.stringify(M1(SO_CABECA, { 'M1.P03': { estado: 'naosei' } })));
  await page.reload(); await clicar('button', 'Começar'); await espera();
  check(!(await page.locator('.herdado').count()) && await page.inputValue('#ent textarea') === '', 'P01: "Não sei" no Módulo 1 não conta como herança');

  /* ============ 12. caminhos completos até o resultado ============ */
  async function responderAtual(p02) {
    const t = norm(await titulo());
    const n = D.perguntas.findIndex((q) => norm(q.pergunta) === t || (q.variantes && Object.values(q.variantes).some((v) => norm(v.pergunta) === t))) + 1;
    const q = D.perguntas[n - 1], num = +q.codigo.slice(4);
    if (num === 2) { await clicar('.opcao', p02); }
    else if (num === 9) await clicar('.opcao', 'No meu bairro e na minha cidade');
    else if (num === 10) { await clicar('.opcao', PESSOAS); await espera(); await clicar('.item-marcar[data-c="O que precisa resolver (a dor)"] .chip', DORES[1]); }
    else if (num === 7) await clicar('.opcao', 'Concorrente novo');
    else if (num === 13) await clicar('.opcao', 'WhatsApp (WhatsApp Business)');
    else if (num === 14) { await digitar(TEXTO_OK, 0); await digitar(TEXTO_OK, 1); }
    else if (num === 22) { await digitar('Entregam rápido', 0); await digitar('Demoram para responder', 1); }
    else if (num === 15) { await page.locator('#ent input[data-nome]').nth(0).fill('Doces da Ana'); await page.locator('#ent input[data-nome]').nth(1).fill('Padaria Central'); }
    else if (num === 20) { await digitar('40', 0); await digitar('60', 1); }
    else if (num === 19) { for (const [c, i] of [['Preço', 0], ['Qualidade', 1], ['Atendimento', 2], ['Prazo (tempo para entregar)', 2]]) await marca(c, i); }
    else if (num === 4) await digitar('Mais gente pedindo pelo WhatsApp');
    else if (num === 3) await digitar('Padaria da esquina');
    else await digitar(`Resposta da pergunta ${num} com detalhe`);
    await clicar('#ok', 'Continuar'); await espera();
    for (let k = 0; k < 2; k++) { const b = await page.$('#ok'); if (b && /Seguir|mesmo/.test(await b.textContent())) { await b.click(); await espera(); } }
    return num;
  }
  async function caminho(p02) {
    await page.goto(URL); await page.evaluate(() => localStorage.clear()); await page.reload();
    await clicar('button', 'Começar'); await espera();
    const vistos = [];
    for (let i = 0; i < 30; i++) {
      if (await page.evaluate(() => !!document.querySelector('#entendemos'))) break;
      vistos.push(await responderAtual(p02));
      if (i === 3) {
        const antes = norm(await titulo());
        await page.reload(); await espera();
        check(await clicar('button', 'Continuar de onde parei'), 'persistência: capa oferece continuar');
        await espera();
        check(norm(await titulo()) === antes, 'persistência: volta na mesma pergunta após recarregar');
      }
    }
    return vistos;
  }
  const vSim = await caminho('Sim');
  check(JSON.stringify(vSim) === JSON.stringify(TELAS_SIM), `P02 Sim: 17 telas na ordem nova (${vSim.join(',')})`);
  await semCodigos('resultado'); await fonte16('resultado');
  const res = await page.evaluate(() => ({
    cont: document.querySelector('.res-num .val').textContent.trim(), sub: document.querySelector('.res-num .sub').textContent.trim(),
    blocos: [...document.querySelectorAll('.bloco-titulo')].map((x) => x.textContent),
    etapas: [...document.querySelectorAll('.etapa')].map((e) => e.dataset.cod),
    ent: [...document.querySelectorAll('#entendemos p')].map((x) => x.textContent), li: document.querySelectorAll('#entendemos li').length,
    conc: [...document.querySelectorAll('#tabela-conc .conc')].map((c) => [c.dataset.nome, ...[...c.querySelectorAll('dd')].map((x) => x.textContent)]),
    quadro: Object.fromEntries([...document.querySelectorAll('#quadro-conc .q-cel')].map((c) => [c.dataset.q, [c.querySelector('h3').textContent, ...[...c.querySelectorAll('li')].map((x) => x.textContent), (c.querySelector('p') || {}).textContent || '']])),
    prox: !!document.querySelector('.acoes.lg2-proximo a'), pend: document.querySelectorAll('.pend').length,
  }));
  check(res.cont === '17 de 17' && res.sub === 'nenhuma com “Não sei”' && res.pend === 0, `resultado: contagem igual à do topo (${res.cont}; ${res.sub})`);
  check(!res.etapas.some((c) => ESCONDIDAS.map(COD).includes(c)) && res.etapas.length === 17, 'resultado: perguntas escondidas não aparecem');
  check(res.ent.length >= 1 && res.ent.length <= 3 && res.li === 0 && res.ent.join(' ').includes('eles cobram em torno de R$ 50,00') && res.ent.join(' ').includes('Economizar tempo / Praticidade no dia a dia'), `resultado: "O que entendemos" em texto corrido (${res.ent.join(' / ')})`);
  check(JSON.stringify(res.conc.map((c) => c[0])) === '["Doces da Ana","Padaria Central","Padaria da esquina"]' && res.conc[0][3] === 'Entregam rápido' && res.conc[0][2] === 'de R$ 40,00 a R$ 60,00', `resultado: tabela com um cartão por nome citado (${res.conc.map((c) => c[0])})`);
  check(res.quadro.fortes && res.quadro.fortes[0] === 'Pontos fortes dos concorrentes' && res.quadro.fortes[1] === 'Entregam rápido', 'quadro: pontos fortes = o que os outros fazem bem');
  check(res.quadro.fracos && res.quadro.fracos[1] === 'Demoram para responder', 'quadro: pontos fracos = onde os outros deixam a desejar');
  check(res.quadro.oportunidades && res.quadro.oportunidades.includes('Novidade que pode ajudar: “Mais gente pedindo pelo WhatsApp”') && res.quadro.oportunidades.includes('Você se sai melhor em preço'), `quadro: oportunidades montadas com as respostas (${res.quadro.oportunidades})`);
  check(res.quadro.ameacas && res.quadro.ameacas.includes('O que pode atrapalhar: concorrente novo') && res.quadro.ameacas.includes('O cliente pode comprar no lugar: “Padaria da esquina”') && res.quadro.ameacas.includes('Os outros se saem melhor em atendimento e prazo (tempo para entregar)'), `quadro: ameaças montadas com as respostas (${res.quadro.ameacas})`);
  check(res.prox, 'resultado: botão do próximo módulo');
  await page.evaluate(() => document.querySelector('#quadro-conc').scrollIntoView({ block: 'start' }));
  await shot('l4_m03_quadro');
  const vNao = await caminho('Não');
  check(JSON.stringify(vNao) === JSON.stringify(TELAS_NAO), `P02 Não: 12 telas (${vNao.join(',')})`);
  const qNao = await page.evaluate(() => Object.fromEntries([...document.querySelectorAll('#quadro-conc .q-cel')].map((c) => [c.dataset.q, (c.querySelector('p') || {}).textContent || ''])));
  check(qNao.oportunidades === '' && /a anotar/.test(await page.evaluate(() => document.querySelector('#quadro-conc').textContent)), 'quadro: só com o que foi respondido; sem invenção');
  /* trocar Sim por Não descarta as respostas puladas, mas não as escondidas */
  await abrir(2, { 'M3.P03': { estado: 'valor', valor: 'Padaria do bairro' }, 'M3.P21': { estado: 'valor', valor: 'Entrego no mesmo dia' }, 'M3.P16': { estado: 'valor', valor: 'Mesmo bairro' } });
  await clicar('.opcao', 'Não'); await clicar('#ok', 'Continuar'); await espera();
  R = await RR();
  check(!R['M3.P03'] && R['M3.P21'] && R['M3.P16'], 'P02 Não: descarta 3 a 8; respostas das perguntas escondidas continuam salvas');

  /* ============ 13. migração do estado salvo (versão 6 → 7) ============ */
  await page.goto(URL);
  await page.evaluate(([k, P, Dr]) => { localStorage.clear(); localStorage.setItem(k, JSON.stringify({ v: 6, R: {
    'M3.P02': { estado: 'opcao', opcao: 'Sim' },
    'M3.P07': { estado: 'naosei', marcados: ['concorrente novo', 'mudança de regra'] },
    'M3.P12': { estado: 'naosei', marcados: ['clientes fiéis'] },
    'M3.P19': { estado: 'naosei', tabela: { 'Preço': 'Pior', Qualidade: 'Melhor' } },
    'M3.P10': { estado: 'opcao', opcao: P, opcoes: [P], campos: { Idade: 'Até 17 anos; 18 a 29 anos', 'Onde mora': 'Centro', [Dr]: 'Falta de tempo' } },
    'M3.P06': { estado: 'valor', valor: 'Tenho fogão' } }, hist: ['RESULTADO'] })); }, [CHAVE, PESSOAS, DOR]);
  await page.reload(); await espera();
  let S7 = await estado();
  check(S7.v === 7, 'migração: estado da versão 6 vira 7 na abertura');
  check(JSON.stringify(S7.R['M3.P07']) === '{"estado":"opcoes","opcoes":["Concorrente novo","Mudança de regra"]}', 'migração: exemplos marcados nos riscos viram resposta fechada');
  check(JSON.stringify(S7.R['M3.P12']) === '{"estado":"valor","valor":"clientes fiéis"}', 'migração: exemplos marcados nas barreiras viram resposta');
  check(S7.R['M3.P19'].estado === 'valor' && S7.R['M3.P19'].valor === 'Preço: Pior; Qualidade: Melhor', 'migração: tabela da comparação vira resposta');
  check(S7.R['M3.P10'].campos.Idade === 'Até 10 anos (infantil); 11 a 17 anos; 18 a 29 anos' && S7.R['M3.P10'].campos['Onde mora'] === 'Centro', 'migração: "Até 17 anos" vira as duas faixas novas; texto antigo fica');
  check(S7.R['M3.P06'] && S7.R['M3.P06'].valor === 'Tenho fogão', 'migração: resposta de pergunta escondida não é apagada');
  await clicar('button', 'Continuar de onde parei'); await espera();
  check(await page.evaluate(() => !!document.querySelector('#entendemos')), 'migração: o resultado abre com o estado migrado');
  await abrir(10, { 'M3.P10': { estado: 'opcao', opcao: PESSOAS, opcoes: [PESSOAS], campos: { 'Onde mora': 'Centro', [DOR]: 'Falta de tempo' } } });
  const antigo10 = await page.evaluate(() => [...document.querySelectorAll('.item-marcar .mini-info')].map((x) => x.textContent));
  check(antigo10.includes('Você tinha escrito: Centro') && antigo10.includes('Você tinha escrito: Falta de tempo'), 'perfil antigo: o texto escrito antes aparece e não se perde');
  await clicar('.item-marcar[data-c="Onde mora"] .chip', LUGARES[1]);
  await clicar('#ok', 'Continuar'); await espera();
  if (await page.locator('#ok').textContent() === 'Continuar mesmo assim') await clicar('#ok', 'Continuar mesmo assim');
  check((await RR())['M3.P10'].campos['Onde mora'] === `${LUGARES[1]}; Centro`, 'perfil antigo: marcar uma opção mantém o texto antigo junto');
  /* versões antigas: canais da versão 4 e estado de 15 perguntas */
  await page.goto(URL);
  await page.evaluate((k) => { localStorage.clear(); localStorage.setItem(k, JSON.stringify({ v: 4, R: { 'M3.P13': { estado: 'opcoes', opcoes: ['Loja física', 'Redes sociais (Instagram, Facebook, WhatsApp)', 'Outro'], detalhe: 'Feira' } }, hist: ['M3.P13'] })); }, CHAVE);
  await page.reload(); await clicar('button', 'Continuar de onde parei'); await espera();
  check(JSON.stringify(await page.evaluate(() => [...document.querySelectorAll('.opcao.sel')].map((x) => x.dataset.op))) === JSON.stringify(['WhatsApp (WhatsApp Business)', 'Instagram e outras redes sociais (catálogo)', 'Atendimento direto ou presencial (loja, feira, ponto)', 'Outro']) && (await estado()).v === 7, 'versão 4: canais antigos migrados até a versão 7');
  const antigo = JSON.stringify({ v: 2, R: { 'M3.P01': { estado: 'valor', valor: 'bolo' } }, hist: ['M3.P01'] });
  for (const [nome, chave] of [['mesma chave', CHAVE], ['chave antiga da turma B', 'lg2-turma-b-m03']]) {
    await page.goto(URL);
    await page.evaluate(([k, s]) => { localStorage.clear(); localStorage.setItem(k, s); }, [chave, antigo]);
    await page.reload(); await espera();
    check(await page.evaluate(() => [...document.querySelectorAll('button')].some((b) => b.textContent === 'Começar')), `estado antigo (${nome}): começa do zero`);
  }

  /* ============ 14. receita A: teclado aberto ============ */
  check(await page.evaluate(() => /interactive-widget=resizes-content/.test(document.querySelector('meta[name=viewport]').content)), 'viewport com interactive-widget=resizes-content');
  for (const [n, sel] of [[4, '#ent textarea'], [20, '#ent input[data-c="min"]'], [20, '#ent input[data-c="max"]'], [15, '#ent input[data-nome="3"]']]) {
    await page.setViewportSize({ width: 390, height: 844 });
    await abrir(n);
    await page.locator(sel).first().focus();
    await page.setViewportSize({ width: 390, height: 450 });
    await espera(700);
    const bx = await page.evaluate((sel) => { const r = (e) => { const b = e.getBoundingClientRect(); return [b.top, b.bottom]; }; return { f: r(document.querySelector(sel)), ok: r(document.querySelector('#ok')), h: innerHeight }; }, sel);
    check(bx.f[0] >= 0 && bx.f[1] <= bx.h && bx.ok[0] >= 0 && bx.ok[1] <= bx.h, `teclado aberto (pergunta ${n}, ${sel}): campo e Continuar visíveis (${JSON.stringify(bx)})`);
  }
  await page.setViewportSize({ width: 390, height: 844 });

  /* ============ 15. escolha única, Voltar no topo, versões "o que você imagina", exemplos por tipo ============ */
  await abrir(2);
  check(await page.evaluate(() => document.querySelector('#ent').getAttribute('role') === 'radiogroup'), 'Sim/Não: escolha única');
  for (const o of ['Sim', 'Não', 'Sim']) await page.locator(`#ent .opcao[data-op="${o}"]`).click();
  check(JSON.stringify(await page.evaluate(() => [...document.querySelectorAll('#ent .opcao.sel')].map((x) => x.dataset.op))) === '["Sim"]', 'Sim/Não: só a última fica marcada');
  check(await page.evaluate(() => getComputedStyle(document.querySelector('#ent .opcao')).webkitTapHighlightColor === 'rgba(0, 0, 0, 0)'), 'Sim/Não: sem realce azul do toque');
  for (const n of [2, 10, 15, 19]) {
    await abrir(n);
    const v = await page.evaluate(() => { const b = document.querySelector('#v'), q = document.querySelector('.cartao-q h2.q'); return { n: document.querySelectorAll('#v').length, acima: b.getBoundingClientRect().bottom <= q.getBoundingClientRect().top + 1, txt: b.textContent.trim() }; });
    check(v.n === 1 && v.acima && v.txt === 'Voltar', `Voltar no topo do cartão (tela ${n})`);
  }
  await page.goto(URL); await page.evaluate(() => localStorage.clear()); await page.reload(); await espera();
  await clicar('button', 'Começar'); await espera(); await clicar('#v', 'Voltar'); await espera();
  check(await page.evaluate(() => !!document.querySelector('#ir')), 'Voltar na 1ª pergunta abre a capa');
  await clicar('#limites', 'O que este módulo não faz'); await espera();
  check(!/Quando procurar um profissional/.test(await tela()), 'limites: sem o quadro de profissional');
  const SERV = { v: 3, R: { 'M1.P01': { estado: 'opcao', opcao: 'Já vendo sempre' }, 'M1.P03': { estado: 'naosei' }, 'M1.P03A': { estado: 'opcao', opcao: 'Serviço: meu cliente paga pelo trabalho que realizo' } } };
  await abrir(1, {}, { 'lg2-turma-a-m01': SERV }, P(1).pergunta.replace('Vendo marmitas para trabalhadores do bairro', 'Faço unhas em domicílio para mulheres do bairro'));
  await abrir(3, {}, { 'lg2-turma-a-m01': SERV }, P(3).pergunta.replace('quem vende bolo caseiro perde cliente para a padaria ou para o bolo de pote', 'quem faz unhas em casa perde cliente para o salão ou para a cliente que faz sozinha'));
  await abrir(19, {}, { 'lg2-turma-a-m01': SERV });
  check(/Prazo \(tempo para atender\)/.test(await tela()), 'serviço: critério de prazo com texto de serviço');
  const TESTANDO = { estado: 'opcao', opcao: 'Já fiz um pouco para testar ou dar de amostra' };
  for (const q of D.perguntas.filter((q) => !q.oculta && q.variantes && q.variantes.ideia && q.codigo !== 'M3.P01')) {
    const n = +q.codigo.slice(4);
    const txt = Motor.variante(q, 'comecando').pergunta.split('quem vende bolo caseiro perde cliente para a padaria ou para o bolo de pote').join('quem faz unhas em casa perde cliente para o salão ou para a cliente que faz sozinha');
    await abrir(n, {}, { 'lg2-turma-a-m01': M1(TESTANDO) }, txt);
  }
  await abrir(13, {}, { 'lg2-turma-a-m01': M1(SO_CABECA) }, P(13).variantes.ideia.pergunta);
  await clicar('.opcao', 'Ainda não defini o canal de vendas'); await espera();
  check((await caixas('#msg .caminho'))[0].prompt.startsWith('Eu quero vender lavagem de carro em casa em [cidade ou bairro]'), 'prompt: "Eu quero vender" + o que vende do Módulo 1');

  check(erros.length === 0, 'sem erros de JavaScript: ' + erros.join(' | '));
  await browser.close(); servidor.close();
  console.log(`\n${ok} verificações OK, ${falhas.length} falhas`);
  if (falhas.length) { console.log('FALHOU'); process.exit(1); }
  console.log('PASS');
})().catch((e) => { console.error(e); process.exit(1); });
