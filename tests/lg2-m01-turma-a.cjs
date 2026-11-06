/* LG2 · Módulo 1 (Turma A) · teste headless do módulo publicado em public/lg2/turma-a/m01.
   Execute: PW=<caminho do playwright> node tests/lg2-m01-turma-a.cjs
   Opcional: LG2_SHOTS=<pasta> (prints 390x844).
   Confere o documento "Módulo 1 – Textos do app em linguagem simples": fluxo (5A e 7A),
   mensagem de cada opção, regras de todas as telas, tela inicial, "O que esta parte não faz",
   persistência e descarte de respostas antigas. Também confere o "Ajuste do “Não sei” e vídeos":
   "Não sei dizer" só na 5A e na 7A (última opção), sem "Ainda não sei" na Pergunta 3, card de vídeo
   das Perguntas 3 e 7 escondido enquanto não houver vídeo (e, com um vídeo de teste, abre por cima e
   volta para a mesma pergunta sem resposta) e a migração das respostas da versão anterior.
   Lote do testador (05/11/2026): Pergunta 3A nova (Produto/Mercadoria/Serviço), Pergunta 8 com várias
   respostas (e migração da resposta única antiga para lista), caixa "O que entendemos até aqui" no
   resultado com as respostas recolhidas em "Ver suas respostas".
   Lote 05/11 (b): teclado do celular, "O que ainda falta descobrir" e "Sua tarefa para fazer já" gerados no
   resultado, P4/P8 adaptadas para Mercadoria, exemplos por tipo, aviso de combinação, sem texto aos grupos.
   Inclui teste de sabotagem dos próprios conferidores. Sai com código != 0 se falhar. */
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');

const dir = path.resolve(__dirname, '..', 'public/lg2/turma-a/m01');
const SHOTS = process.env.LG2_SHOTS || '';
const falhas = [];
let checks = 0;
const ok = (cond, msg) => { checks++; if (!cond) falhas.push(msg); };
const norm = (s) => String(s || '').replace(/\s+/g, ' ').trim();
let playwright;
try { playwright = require('playwright'); } catch { playwright = require(process.env.PW); }

/* textos esperados, copiados do documento (Texto no app / Mensagem ao escolher) */
const EXP = {
 "M1.P01": {
  "pergunta": "Como está a sua ideia hoje?",
  "apoio": "Escolha a frase que mais parece com você. Não tem resposta errada.",
  "opcoes": [
   [
    "Ainda está só na minha cabeça",
    "Dica: Antes de gastar dinheiro, teste sua ideia com pouca coisa. A gente te ajuda nas próximas perguntas."
   ],
   [
    "Já fiz um pouco para testar ou dar de amostra",
    "Dica: Ótimo começo! Pergunte a quem provou se compraria e por quanto."
   ],
   [
    "Já vendi algumas vezes",
    null
   ],
   [
    "Já vendo sempre",
    null
   ]
  ],
  "ajuda": false
 },
 "M1.P02": {
  "pergunta": "O que fez você querer ter um negócio?",
  "apoio": "Escolha o motivo mais importante para você.",
  "opcoes": [
   [
    "Preciso de dinheiro logo para pagar as contas",
    "Dica: Comece com algo que você já sabe fazer e que dá para vender rápido, gastando pouco."
   ],
   [
    "Vi que as pessoas precisam de algo que eu posso vender",
    "Dica: Antes de gastar, pergunte a algumas pessoas se elas comprariam."
   ],
   [
    "Quero ganhar um dinheiro a mais",
    null
   ],
   [
    "Quero trabalhar por conta própria",
    null
   ]
  ],
  "ajuda": false
 },
 "M1.P03": {
  "pergunta": "O que você vende ou quer vender?",
  "apoio": "Pode ser uma coisa que você faz ou um trabalho que você oferece.",
  "placeholder": "Ex.: bolo de pote, conserto de celular, unha de gel",
  "video": true,
  "ajuda": false
 },
 "M1.P03A": {
  "pergunta": "O que você oferece aos seus clientes?",
  "apoio": "Escolha a opção que mais combina com o que você vende.",
  "opcoes": [
   ["Produto: eu compro materiais e faço o que vendo", null],
   ["Mercadoria: compro pronto para revender", null],
   ["Serviço: meu cliente paga pelo trabalho que realizo", null]
  ],
  "ajuda": true,
  "ajuda_texto": "Produto é algo que você mesmo faz com materiais que compra. Mercadoria é algo que você compra pronto e vende sem mudar. Serviço é quando o cliente paga pelo seu trabalho, e não por uma coisa."
 },
 "M1.P04": {
  "pergunta": "Você já sabe fazer isso?",
  "apoio": "Vale o que você aprendeu em outro trabalho, em casa ou sozinho.",
  "opcoes": [
   [
    "Sim, já faço bem",
    null
   ],
   [
    "Sei um pouco, ainda estou aprendendo",
    "Dica: Pratique com amigos e família antes de vender. Assim você ganha confiança."
   ],
   [
    "Ainda não sei fazer",
    "Dica: Tudo bem começar do zero. Procure um curso gratuito, como os do Sebrae, ou alguém que possa te ensinar."
   ]
  ],
  "ajuda": true,
  "ajuda_texto": "Queremos saber se você já fez esse tipo de trabalho antes. Quem já sabe fazer começa com mais facilidade."
 },
 "M1.P05": {
  "pergunta": "Quanto tempo por dia você tem para o seu negócio?",
  "apoio": "Pense no tempo que sobra depois do trabalho, da casa e da família.",
  "opcoes": [
   [
    "Até 1 hora por dia",
    "Dica: Pouco tempo também dá certo. Comece com poucos clientes e faça sob encomenda."
   ],
   [
    "De 1 a 3 horas por dia",
    null
   ],
   [
    "Mais de 3 horas por dia",
    null
   ],
   [
    "Só nos fins de semana",
    "Dica: Venda em feiras, eventos ou por encomenda para entregar no fim de semana."
   ]
  ],
  "ajuda": true,
  "ajuda_texto": "Queremos saber quanto tempo você tem de verdade. Com pouco tempo também dá para começar, mas o negócio cresce mais devagar."
 },
 "M1.P05A": {
  "pergunta": "Se o negócio crescer, você consegue arrumar mais tempo para ele?",
  "apoio": "Pense na sua rotina de hoje.",
  "opcoes": [
   [
    "Sim, consigo arrumar mais tempo",
    null
   ],
   [
    "Não, meus horários não podem mudar",
    "Dica: Tudo bem. Seu negócio pode crescer devagar, no seu ritmo."
   ],
   [
    "Não sei dizer",
    "Tudo bem: Você pode pensar nisso mais para frente."
   ]
  ],
  "ajuda": false
 },
 "M1.P06": {
  "pergunta": "Você já tem o que precisa para trabalhar?",
  "apoio": "Por exemplo: ferramentas, máquinas, panelas, forno ou um espaço em casa.",
  "opcoes": [
   [
    "Sim, tenho tudo",
    null
   ],
   [
    "Tenho só uma parte",
    "Dica: Antes de comprar o que falta, veja se dá para pegar emprestado ou alugar."
   ],
   [
    "Não tenho nada ainda",
    "Dica: Comece com o mínimo. Dá para pegar emprestado ou alugar no começo."
   ]
  ],
  "ajuda": false
 },
 "M1.P07": {
  "pergunta": "Quanto dinheiro você pode usar no negócio sem faltar para as contas da casa?",
  "apoio": "Pense num dinheiro que, se for perdido, não vai fazer falta para comida, aluguel e contas.",
  "opcoes": [
   [
    "Nada por enquanto",
    "Tudo bem: Dá para começar sem dinheiro. Na próxima pergunta vamos ver como."
   ],
   [
    "Até R$ 100",
    "Dica: Comece pequeno e use esse dinheiro aos poucos."
   ],
   [
    "Entre R$ 100 e R$ 500",
    null
   ],
   [
    "Entre R$ 500 e R$ 1.000",
    null
   ],
   [
    "Mais de R$ 1.000",
    "Dica: Mesmo podendo usar mais, teste antes com pouco. Não pegue empréstimo no banco para começar."
   ]
  ],
  "video": true,
  "ajuda": true,
  "ajuda_texto": "É o dinheiro que você pode colocar no negócio e, se der errado, não vai faltar nada em casa."
 },
 "M1.P07A": {
  "pergunta": "Como você pensa em começar sem dinheiro ou sem material?",
  "apoio": "Pense em jeitos de começar gastando pouco ou nada.",
  "opcoes": [
   [
    "Pegando emprestado com amigos ou família",
    "Dica: Combine por escrito quanto e quando você vai devolver."
   ],
   [
    "Pagando alguém para fazer uma parte do trabalho",
    null
   ],
   [
    "Vendendo por encomenda, com o cliente pagando uma parte antes",
    null
   ],
   [
    "Juntando dinheiro primeiro",
    null
   ],
   [
    "Não sei dizer",
    "Tudo bem: Um jeito comum é vender por encomenda e pedir parte do pagamento antes."
   ]
  ],
  "ajuda": false
 },
 "M1.P08": {
  "pergunta": "O que mais te preocupa agora?",
  "apoio": "Pode marcar mais de uma opção.",
  "multi": true,
  "opcoes": [
   [
    "Ainda não sei fazer direito",
    null
   ],
   [
    "Me falta lugar ou equipamento",
    null
   ],
   [
    "Conheço poucas pessoas para vender ou me ajudar",
    null
   ],
   [
    "Tenho dificuldade com celular, internet ou redes sociais",
    null
   ],
   [
    "Outra coisa",
    null
   ]
  ],
  "ajuda": false
 }
};
/* lote 05/11 (b): o que muda conforme o tipo da 3A (Mercadoria não pergunta se sabe FAZER; exemplos de
   serviço e de revenda). Só os campos listados trocam; o resto vem de EXP. */
const EX_P05 = 'Exemplo: "Trabalho de segunda a sexta. Só posso fazer meus doces no sábado."';
const EX_P07 = 'Exemplo: "Tenho R$ 500 guardados para comprar ingredientes. Se eu não vender nada, não vai faltar comida em casa."';
const OPS_P08_MERC = ['Ainda não conheço bem o produto ou os fornecedores', 'Me falta lugar ou equipamento', 'Conheço poucas pessoas para vender ou me ajudar',
  'Tenho dificuldade com celular, internet ou redes sociais', 'Outra coisa'].map((t) => [t, null]);
const EXP_TIPO = {
  Produto: {
    'M1.P04': { exemplo: 'Exemplo: Joana faz bolo para a família há anos. Agora ela vende bolo de pote para os vizinhos.' },
    'M1.P05': { exemplo: EX_P05 }, 'M1.P07': { exemplo: EX_P07 },
  },
  Mercadoria: {
    'M1.P04': { pergunta: 'Você já conhece bem o que vai revender?', apoio: 'Pense na qualidade, no preço e em onde comprar.',
      opcoes: [['Sim, conheço bem o produto e onde comprar', null],
        ['Conheço um pouco, ainda estou pesquisando', 'Dica: Compare preço e qualidade em mais de um fornecedor antes de comprar muito.'],
        ['Ainda não conheço', 'Dica: Tudo bem começar do zero. Compre pouco no começo e pesquise pelo menos 2 fornecedores.']],
      ajuda_texto: 'Queremos saber se você conhece o que vai revender: a qualidade, o preço e onde comprar. Quem conhece o produto e os fornecedores começa com mais segurança.',
      exemplo: 'Exemplo: Ana sempre comprou roupas numa fábrica para ela mesma. Agora ela compra lá e revende para as vizinhas.' },
    'M1.P05': { exemplo: 'Exemplo: "Trabalho de segunda a sexta. Só posso buscar e entregar as encomendas no sábado."' },
    'M1.P06': { apoio: 'Por exemplo: um lugar para guardar a mercadoria, embalagens ou um jeito de entregar.' },
    'M1.P07': { exemplo: 'Exemplo: "Tenho R$ 500 guardados para comprar as primeiras peças para revender. Se eu não vender nada, não vai faltar comida em casa."' },
    'M1.P08': { opcoes: OPS_P08_MERC },
  },
  'Serviço': {
    'M1.P04': { exemplo: 'Exemplo: Maria trabalhou 5 anos como costureira numa fábrica. Agora ela faz consertos de roupa em casa.' },
    'M1.P05': { exemplo: 'Exemplo: "Trabalho de segunda a sexta. Só posso atender minhas clientes de manicure no sábado."' },
    'M1.P06': { apoio: 'Por exemplo: ferramentas, materiais de trabalho ou um espaço para atender.' },
    'M1.P07': { exemplo: 'Exemplo: "Tenho R$ 300 guardados para comprar esmaltes e alicates. Se eu não tiver clientes, não vai faltar comida em casa."' },
  },
};
const tipoDe = (R) => (String(R['M1.P03A'] || '').match(/^(Produto|Mercadoria|Serviço)/) || [])[1] || null;
const expDe = (c, R) => Object.assign({}, EXP[c], (EXP_TIPO[tipoDe(R)] || {})[c] || {});
const ORDEM = ['M1.P01', 'M1.P02', 'M1.P03', 'M1.P03A', 'M1.P04', 'M1.P05', 'M1.P05A', 'M1.P06', 'M1.P07', 'M1.P07A', 'M1.P08'];
/* fluxo do documento, escrito à parte do motor do app */
function esperado(R) {
  return ORDEM.filter((c) => {
    if (c === 'M1.P05A') return ['Até 1 hora por dia', 'Só nos fins de semana'].includes(R['M1.P05']);
    if (c === 'M1.P07A') return R['M1.P07'] === 'Nada por enquanto' || R['M1.P06'] === 'Não tenho nada ainda';
    return true;
  });
}

/* ---------- estático ---------- */
const app = fs.readFileSync(path.join(dir, 'js/app.js'), 'utf8');
const dados = fs.readFileSync(path.join(dir, 'dados/modulo1.js'), 'utf8');
ok(/const CHAVE = "lg2-turma-a-m01";/.test(app), 'CHAVE deve ser lg2-turma-a-m01');
for (const f of ['dados/modulo1.js', 'js/app.js', 'js/motor.js', 'index.html', 'css/estilo.css'])
  ok(!/rafael/i.test(fs.readFileSync(path.join(dir, f), 'utf8')), `"rafael" em ${f}`);
ok(!/\(?\d{2}\)?\s?9?\d{4}-?\d{4}\b/.test(dados.replace(/\d{2}\/\d{2}\/\d{4}/g, '')), 'nenhum telefone em dados/modulo1.js');
ok(!/M1\.P04\.1|suprir essa falta/.test(dados), 'Pergunta 4A deve sair dos dados');

/* ---------- ajuste do "Não sei" e vídeos, direto nos dados ---------- */
const CARD = 'Não sabe ou não entendeu? Assista ao vídeo';
const COM_NAOSEI = ['M1.P05A', 'M1.P07A'];
const COM_VIDEO = ['M1.P03', 'M1.P07'];
function lerDados(txt) {
  const ctx = { window: {} };
  require('node:vm').runInNewContext(txt, ctx);
  return JSON.parse(JSON.stringify(ctx.window.MODULO1));
}
/* devolve a lista de problemas; vazia = dados de acordo com o documento de ajuste */
function conferirAjuste(D) {
  const p = [];
  for (const q of D.perguntas) {
    const ops = (q.opcoes || []).map((o) => o.texto);
    const ns = ops.filter((o) => /n[ãa]o sei/i.test(o) && o !== 'Ainda não sei fazer' && o !== 'Ainda não sei fazer direito');
    if (COM_NAOSEI.includes(q.codigo)) {
      if (ns.length !== 1 || ops[ops.length - 1] !== 'Não sei dizer') p.push(`${q.codigo}: "Não sei dizer" deve ser a última opção`);
    } else if (ns.length) p.push(`${q.codigo}: não pode ter "${ns.join('", "')}"`);
    if (q.botao_naosei) p.push(`${q.codigo}: não pode ter botão "${q.botao_naosei.texto}"`);
    if (COM_VIDEO.includes(q.codigo)) {
      if (!q.video || q.video.texto !== CARD) p.push(`${q.codigo}: falta o card de vídeo`);
      else if (q.video.url !== null) p.push(`${q.codigo}: vídeo ainda não chegou, url deve ser null`);
    } else if (q.video) p.push(`${q.codigo}: não deveria ter card de vídeo`);
    if (/Tudo bem/.test(JSON.stringify(q.botao_naosei || '')) ) p.push(`${q.codigo}: mensagem "Tudo bem" do Não sei`);
  }
  return p;
}
const DADOS = lerDados(dados);
const probs = conferirAjuste(DADOS);
ok(probs.length === 0, 'ajuste nos dados: ' + probs.join(' | '));
/* sabotagem: cada estrago tem de ser apontado pelo conferidor */
const sabot = [
  ['"Não sei dizer" volta na P1', (D) => D.perguntas[0].opcoes.push({ texto: 'Não sei dizer', mensagem: null })],
  ['"Não sei dizer" sai da 5A', (D) => { const q = D.perguntas.find((x) => x.codigo === 'M1.P05A'); q.opcoes.pop(); }],
  ['"Não sei dizer" fora do fim na 7A', (D) => { const q = D.perguntas.find((x) => x.codigo === 'M1.P07A'); q.opcoes.unshift(q.opcoes.pop()); }],
  ['"Ainda não sei" volta na P3', (D) => { D.perguntas.find((x) => x.codigo === 'M1.P03').botao_naosei = { texto: 'Ainda não sei', mensagem: null }; }],
  ['card sem vídeo na P7', (D) => { delete D.perguntas.find((x) => x.codigo === 'M1.P07').video; }],
  ['card na P1', (D) => { D.perguntas[0].video = { texto: CARD, url: null }; }],
];
for (const [nome, estraga] of sabot) {
  const D = JSON.parse(JSON.stringify(DADOS)); estraga(D);
  ok(conferirAjuste(D).length > 0, `sabotagem não detectada: ${nome}`);
}

/* ---------- servidor ---------- */
async function servidor() {
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
  page.on('response', (r) => { if (r.status() >= 400) erros.push(r.url() + ' ' + r.status()); });
  page.on('dialog', (d) => d.accept());
  /* registra o que o botão Ouvir mandaria falar */
  await page.addInitScript(() => {
    window.__fala = [];
    if (window.speechSynthesis) window.speechSynthesis.speak = (u) => window.__fala.push(u.text + '|' + u.lang);
  });
  const shot = async (nome) => {
    if (!SHOTS) return;
    fs.mkdirSync(SHOTS, { recursive: true });
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(SHOTS, nome + '.png') });
  };

  const texto = () => page.evaluate(() => document.body.innerText);
  const cod = () => page.evaluate(() => { const p = document.querySelector('.pergunta'); return p ? p.dataset.cod : (document.querySelector('h2') || {}).textContent === 'Retrato inicial' ? 'RESULTADO' : null; });
  const clicarTexto = (sel, t) => page.evaluate(([sel, t]) => {
    const b = [...document.querySelectorAll(sel)].find((x) => x.textContent.replace(/\s+/g, ' ').replace('✓', '').trim() === t);
    if (!b) return false; b.click(); return true;
  }, [sel, t]);
  const opcao = (t) => clicarTexto('.opcao', t);
  const continuarDesligado = () => page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => x.textContent.trim() === 'Continuar'); return b ? b.disabled : null; });
  const continuar = async () => { ok(await clicarTexto('button', 'Continuar'), 'botão Continuar'); await page.waitForTimeout(30); };
  const msgAgora = () => page.evaluate(() => { const m = document.querySelector('#msg .msg'); return m ? m.querySelector('b').textContent + ': ' + m.querySelector('p').textContent : null; });
  const estadoOpcoes = () => page.evaluate(() => [...document.querySelectorAll('.opcao')].map((b) => ({
    t: b.querySelector('b').textContent, sel: b.classList.contains('sel'),
    check: getComputedStyle(b.querySelector('.check')).display !== 'none' && b.querySelector('.check').textContent === '✓' })));

  async function regrasGerais(onde) {
    const t = await texto();
    ok(!/Pergunta\s+\d+[A-Z]?\s+de/i.test(t), `${onde}: contador "Pergunta X de"`);
    ok(!/aten[çc][ãa]o/i.test(t), `${onde}: texto ATENÇÃO`);
    ok(!/\bSeguir\b/.test(t) && !/Corrigir/.test(t), `${onde}: Seguir/Corrigir`);
    ok(!/BT\d{2}|M1\.P\d|rafael/i.test(t), `${onde}: código ou nome interno na tela`);
    ok(!/\bGrupo\s*\d|pr[óo]ximos grupos|M[óo]dulo\s*\d+\s+usar[áa]|mapeados por voc[êe]s/i.test(t), `${onde}: texto dirigido aos grupos na tela`);
    ok(!/objetivo de renda/i.test(t), `${onde}: cita "objetivo de renda", que não é perguntado`);
    const menor = await page.evaluate(() => {
      let m = 99, qual = '';
      document.querySelectorAll('#tela *').forEach((e) => {
        const temTexto = [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
        if (!temTexto || !e.getClientRects().length) return;
        const f = parseFloat(getComputedStyle(e).fontSize);
        if (f < m) { m = f; qual = e.tagName + '.' + e.className + ' ' + e.textContent.slice(0, 30); }
      });
      return [m, qual];
    });
    ok(menor[0] >= 16, `${onde}: letra menor que 16px (${menor[0]}px em ${menor[1]})`);
    const ouvir = await page.evaluate(() => !!window.speechSynthesis === !![...document.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Ouvir'));
    ok(ouvir, `${onde}: botão Ouvir`);
  }

  /* checagens de uma pergunta antes de responder */
  async function conferirPergunta(c, R, todasMsgs) {
    const e = expDe(c, R);
    const t = await texto();
    const q = await page.evaluate(() => document.querySelector('.q').textContent);
    let qEsp = e.pergunta;
    if (c === 'M1.P04' && R['M1.P03'] && !R.__vaga) qEsp = tipoDe(R) === 'Mercadoria' ? `Você já conhece bem ${R.__p4} e sabe onde comprar?` : `Você já sabe fazer ${R.__p4}?`;
    if (e.exemplo) ok(await page.evaluate(() => (document.querySelector('.ajuda-box .ex') || {}).textContent) === e.exemplo, `${c} (${tipoDe(R)}): exemplo da ajuda conforme o tipo`);
    ok(q === qEsp, `${c}: pergunta "${q}" != "${qEsp}"`);
    ok(t.includes(e.apoio), `${c}: apoio`);
    ok(await page.evaluate(() => [...document.querySelectorAll('.topo button')].some((b) => b.textContent.trim() === '< Voltar')), `${c}: "< Voltar" no topo`);
    ok(await page.evaluate(() => !!document.querySelector('.barra')), `${c}: barra de progresso`);
    const d = await page.evaluate(() => [...document.querySelectorAll('details')].map((x) => [x.open, x.querySelector('summary').textContent]));
    ok(e.ajuda ? d.length === 1 && d[0][0] === false && d[0][1] === 'O que quer dizer isso?' : d.length === 0, `${c}: caixa de ajuda (fechada, título)`);
    if (e.ajuda) ok(t.includes('O que quer dizer isso?') && !/Fonte/i.test(t), `${c}: ajuda sem fonte`);
    if (e.ajuda) ok(await page.evaluate(() => document.querySelector('.ajuda-box p').textContent) === e.ajuda_texto, `${c}: texto da ajuda`);
    if (e.multi) {
      ok(!t.includes('Escolha só uma opção'), `${c}: não pode dizer "Escolha só uma opção"`);
      ok(await page.evaluate(() => getComputedStyle(document.querySelector('.opcao .radio')).borderRadius === '6px'), `${c}: quadradinho (várias respostas), não bolinha`);
    }
    await regrasGerais(c);
    ok(!/Não sei dizer|Ainda não sei\b(?! fazer)/.test(t.replace(/Não sei dizer/g, COM_NAOSEI.includes(c) ? '' : 'Não sei dizer')), `${c}: "Não sei" fora da 5A/7A`);
    ok(await page.evaluate(() => !document.querySelector('#ns, .video-card, .video-fundo')), `${c}: sem botão Não sei e sem card de vídeo (vídeo ainda não chegou)`);
    if (R.__novo) ok(await continuarDesligado() === true, `${c}: Continuar deve começar apagado`);
    if (e.opcoes) {
      const ops = await estadoOpcoes();
      ok(JSON.stringify(ops.map((o) => o.t)) === JSON.stringify(e.opcoes.map((o) => o[0])), `${c}: opções ${JSON.stringify(ops.map((o) => o.t))}`);
      if (COM_NAOSEI.includes(c)) ok(ops.length && ops[ops.length - 1].t === 'Não sei dizer', `${c}: "Não sei dizer" deve ser a última`);
      else ok(!ops.some((o) => o.t === 'Não sei dizer'), `${c}: "Não sei dizer" não pode aparecer`);
      if (R.__novo) ok((await msgAgora()) === null, `${c}: sem mensagem antes de responder`);
      if (todasMsgs && e.multi) {
        /* várias respostas: cada toque acrescenta; tocar de novo tira */
        const marcadas = [];
        for (const [op] of e.opcoes) {
          await opcao(op); marcadas.push(op);
          const st = await estadoOpcoes();
          ok(st.every((x) => marcadas.includes(x.t) === x.sel && x.sel === x.check), `${c} / ${op}: ✓ em todas as marcadas (${marcadas.length})`);
          ok((await continuarDesligado()) === (op === 'Outra coisa'), `${c} / ${op}: Continuar ${op === 'Outra coisa' ? 'apagado até escrever a outra coisa' : 'aceso'}`);
        }
        const salvoP8 = await page.evaluate(() => JSON.parse(localStorage.getItem('lg2-turma-a-m01')).R['M1.P08']);
        ok(JSON.stringify(salvoP8.opcoes) === JSON.stringify(e.opcoes.map((o) => o[0])) && salvoP8.opcao === e.opcoes[0][0] && salvoP8.estado === 'opcao', `${c}: grava a lista na ordem e a 1ª em "opcao": ${JSON.stringify(salvoP8)}`);
        for (const [op] of e.opcoes) await opcao(op);
        ok((await estadoOpcoes()).every((x) => !x.sel) && (await continuarDesligado()) === true, `${c}: tocar de novo desmarca; sem nada marcado, Continuar apagado`);
        ok(await page.evaluate(() => !JSON.parse(localStorage.getItem('lg2-turma-a-m01')).R['M1.P08']), `${c}: sem nada marcado não guarda resposta`);
      } else if (todasMsgs) for (const [op, m] of e.opcoes) {
        await opcao(op);
        ok((await msgAgora()) === m, `${c} / ${op}: mensagem "${await msgAgora()}" != "${m}"`);
        const st = await estadoOpcoes();
        ok(st.every((x) => (x.t === op) === x.sel && x.sel === x.check), `${c} / ${op}: ✓ só na escolhida`);
        if (c !== 'M1.P08' || op !== 'Outra coisa') ok(await continuarDesligado() === false, `${c} / ${op}: Continuar aceso`);
      }
    }
  }

  async function responder(c, R) {
    const v = R[c];
    if (c === 'M1.P03') {
      ok(await page.evaluate(() => document.querySelector('#txt').placeholder) === EXP[c].placeholder, 'P3: exemplo cinza');
      const temRec = await page.evaluate(() => !!(window.SpeechRecognition || window.webkitSpeechRecognition));
      const temBotao = await page.evaluate(() => [...document.querySelectorAll('button')].some((b) => b.textContent.trim() === 'Falar em vez de escrever'));
      ok(temRec === temBotao, 'P3: botão "Falar em vez de escrever" só quando há reconhecimento de voz');
      ok(await continuarDesligado() === true, 'P3: Continuar apagado sem texto');
      await page.fill('#txt', v);
      ok((await msgAgora()) === null, 'P3: sem mensagem ao escrever');
    } else if (Array.isArray(v)) {
      for (const x of v) ok(await opcao(x), `${c}: opção "${x}" não encontrada`);
      ok((await estadoOpcoes()).filter((o) => o.sel).length === v.length, `${c}: ${v.length} marcadas`);
      if (v.includes('Outra coisa')) {
        ok(await page.evaluate(() => { const o = document.querySelector('.outra'); return o && !o.hidden && !!o.querySelector('textarea'); }), 'P8: "Outra coisa" abre campo de texto');
        ok(await continuarDesligado() === true, 'P8: Continuar apagado com "Outra coisa" sem texto');
        await page.fill('.outra textarea', R.__outra);
      } else ok(await page.evaluate(() => { const o = document.querySelector('.outra'); return !o || o.hidden; }), 'P8: campo de "Outra coisa" fechado sem essa opção');
    } else {
      ok(await opcao(v), `${c}: opção "${v}" não encontrada`);
      if (v === 'Outra coisa') {
        ok(await page.evaluate(() => { const o = document.querySelector('.outra'); return o && !o.hidden && !!o.querySelector('textarea'); }), 'P8: "Outra coisa" abre campo de texto');
        ok(await continuarDesligado() === true, 'P8: Continuar apagado com "Outra coisa" sem texto');
        await page.fill('.outra textarea', R.__outra);
      } else if (c === 'M1.P08') {
        ok(await page.evaluate(() => { const o = document.querySelector('.outra'); return !o || o.hidden; }), 'P8: campo de "Outra coisa" fechado nas outras opções');
      }
    }
    ok(await continuarDesligado() === false, `${c}: Continuar aceso depois de responder`);
  }

  async function inicio(limpar = true) {
    await page.goto(srv.url);
    if (limpar) { await page.evaluate(() => localStorage.clear()); await page.reload(); }
    await page.waitForSelector('#ir');
  }

  /* percorre um caminho inteiro e devolve a sequência de telas */
  async function caminho(nome, R, opts = {}) {
    await inicio();
    await clicarTexto('button', 'Começar');
    const seq = [];
    for (let i = 0; i < 16; i++) {
      const c = await cod();
      if (!c || c === 'RESULTADO') break;
      seq.push(c);
      await conferirPergunta(c, Object.assign({ __novo: true }, R), opts.todasMsgs);
      if (opts.shots && opts.shots[c]) await opts.shots[c]();
      await responder(c, R);
      await continuar();
    }
    const esp = esperado(R);
    ok(JSON.stringify(seq) === JSON.stringify(esp), `${nome}: caminho ${seq.join(' > ')} != ${esp.join(' > ')}`);
    ok((await cod()) === 'RESULTADO', `${nome}: deve chegar à tela de resultado`);
    return seq;
  }

  const base = { 'M1.P01': 'Já vendi algumas vezes', 'M1.P02': 'Quero ganhar um dinheiro a mais', 'M1.P03': 'Bolo de pote', __p4: 'bolo de pote',
    'M1.P03A': 'Produto: eu compro materiais e faço o que vendo',
    'M1.P04': 'Sim, já faço bem', 'M1.P05': 'De 1 a 3 horas por dia', 'M1.P05A': 'Sim, consigo arrumar mais tempo',
    'M1.P06': 'Sim, tenho tudo', 'M1.P07': 'Entre R$ 100 e R$ 500', 'M1.P07A': 'Juntando dinheiro primeiro', 'M1.P08': ['Ainda não sei fazer direito'] };
  const com = (x) => Object.assign({}, base, x);

  /* ---------- tela inicial e "O que esta parte não faz" ---------- */
  await inicio();
  let t = await texto();
  for (const s of ['PARTE 1', 'Você e a sua ideia', 'Vamos conversar sobre você e sobre o que você quer vender. Não existe resposta certa ou errada.',
    'Isso é para você se:', 'Antes de começar, pense nisto:', 'No final, você vai ter:', 'Este módulo leva uns 10 minutos', 'O que esta parte não faz',
    'Quanto dinheiro você pode usar sem faltar para as contas da casa', 'Uma tarefa fácil para fazer já'])
    ok(t.includes(s), `início: falta "${s}"`);
  ok(!t.includes('confirmar o tempo'), 'início: nota "(confirmar o tempo real)" não pode aparecer');
  // item novo (Júlia): os ~10 min são deste módulo; a jornada inteira leva horas e fica salva no aparelho
  ok(t.includes('Este é o Módulo 1 de 10. A jornada completa, com os 10 módulos, leva de 3 a 5 horas no total.'), 'início: falta o tempo da jornada completa');
  ok(t.includes('dá para fazer em vários dias, e suas respostas ficam salvas neste aparelho'), 'início: falta o aviso de que as respostas ficam salvas');
  ok(!/(^|\n)Leva uns 10 minutos/.test(t), 'início: "Leva uns 10 minutos" sozinho parece o tempo da jornada inteira');
  ok(await page.evaluate(() => document.querySelectorAll('.bloco-lista li').length === 11 && [...document.querySelectorAll('.bloco-lista li')].every((l) => l.querySelector('svg'))), 'início: 11 linhas, cada uma com ícone');
  ok(await page.evaluate(() => { const b = document.querySelector('#ir'); const r = b.getBoundingClientRect(); return b.textContent === 'Começar' && r.bottom <= innerHeight && getComputedStyle(b.parentElement).position === 'sticky'; }), 'início: Começar fixo no rodapé e visível');
  await regrasGerais('início');
  await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Ouvir').click());
  const falou = await page.evaluate(() => window.__fala.slice(-1)[0] || '');
  ok(/Você e a sua ideia/.test(falou) && /\|pt-BR$/.test(falou), `Ouvir lê a tela em pt-BR (${falou.slice(0, 60)})`);
  await shot('01-inicio');

  await clicarTexto('button', 'O que esta parte não faz');
  t = await texto();
  for (const s of ['O que você pode esperar', 'O app não faz:', 'Não promete lucro nem vendas', 'O app te ajuda a:', 'Escolher um próximo passo fácil',
    'Quando pedir ajuda a um profissional', 'O app ajuda você a pensar e se organizar. Os resultados dependem das suas respostas e não são garantidos. Regras de impostos, registro e licenças devem ser confirmadas em sites do governo e com profissionais.',
    'Laboratório de Gestão II · FACC/UFJF'])
    ok(t.includes(s), `limites: falta "${s}"`);
  ok(!/vers[ãa]o|v0\.|sem versão|internas/i.test(t), 'limites: sem versão/data');
  ok(await page.evaluate(() => getComputedStyle(document.querySelector('.aviso-roxo')).backgroundColor === 'rgb(104, 74, 151)'), 'limites: caixa roxa');
  await regrasGerais('limites');
  await shot('02-o-que-esta-parte-nao-faz');
  await clicarTexto('button', '< Voltar');
  ok(await page.evaluate(() => !!document.querySelector('#ir')), 'limites: Voltar leva ao início');

  /* ---------- caminhos ---------- */
  // 1: todas as mensagens, 5A e 7A pelos gatilhos P5 = "Até 1 hora por dia" e P7 = "Nada por enquanto"
  await caminho('A (mensagens, 5A, 7A por P7)', com({ 'M1.P05': 'Até 1 hora por dia', 'M1.P07': 'Nada por enquanto', 'M1.P08': ['Conheço poucas pessoas para vender ou me ajudar', 'Outra coisa'], __outra: 'Medo de não vender' }), {
    todasMsgs: true,
    shots: {
      'M1.P01': async () => { await opcao('Já fiz um pouco para testar ou dar de amostra'); await shot('03-pergunta-dica-check'); },
      'M1.P04': async () => { await page.evaluate(() => { document.querySelector('details').open = true; }); await shot('04-ajuda-aberta'); },
      'M1.P07': async () => { await opcao('Até R$ 100'); await shot('05-p7-faixas'); },
    },
  });
  /* caixa "O que entendemos até aqui" em cima; respostas recolhidas em "Ver suas respostas" */
  const entendemos = () => page.evaluate(() => { const e = document.querySelector('.entendemos'); return e ? [...e.querySelectorAll('p')].map((x) => x.textContent) : null; });
  const tarefaAgora = () => page.evaluate(() => { const e = document.querySelectorAll('.tarefa'); return e.length === 1 && e[0].querySelector('b').textContent === 'Sua tarefa para fazer já' ? e[0].querySelector('p').textContent : null; });
  const faltaAgora = () => page.evaluate(() => [...document.querySelectorAll('.b-lacuna li')].map((l) => l.textContent));
  const avisosAgora = () => page.evaluate(() => [...document.querySelectorAll('.b-aviso p')].map((l) => l.textContent));
  /* texto corrido (relatório do Bento): frases agrupadas por assunto em 1 a 3 parágrafos, sem lista */
  ok(JSON.stringify(await entendemos()) === JSON.stringify([
    'Você vende bolo de pote, um produto: você compra os materiais e faz o que vende. Você já vendeu algumas vezes, então já sabe que tem gente que compra.',
    'Você já sabe fazer isso bem e tem até 1 hora por dia para o negócio, e consegue arrumar mais tempo se ele crescer. Por enquanto, você não tem dinheiro para colocar no negócio e já tem tudo o que precisa para trabalhar; você pensa em começar juntando dinheiro primeiro.',
    'O que mais te preocupa agora: conhecer poucas pessoas para vender ou te ajudar e medo de não vender.',
  ]), 'resultado: "O que entendemos até aqui" em 3 parágrafos ' + JSON.stringify(await entendemos()));
  ok(await page.evaluate(() => { const e = document.querySelector('.entendemos'); const n = e.querySelectorAll('p').length; return !e.querySelector('ul, ol, li') && n >= 1 && n <= 3; }),
    'resultado: "O que entendemos" em texto corrido (sem <li>, 1 a 3 <p>)');
  ok(await page.evaluate(() => { const e = document.querySelector('.entendemos'), d = document.querySelector('details.respostas');
    return e.querySelector('h3').textContent === 'O que entendemos até aqui' && e.getBoundingClientRect().top < innerHeight && !!d && !d.open && d.querySelector('summary').textContent === 'Ver suas respostas' && (e.compareDocumentPosition(d) & Node.DOCUMENT_POSITION_FOLLOWING); }),
    'resultado: caixa no topo (visível sem rolar) e respostas recolhidas abaixo dela');
  ok(!(await texto()).includes('Você já sabe fazer bolo de pote?'), 'resultado: lista de respostas começa recolhida');
  await shot('06-resultado');
  await page.evaluate(() => { document.querySelector('details.respostas').open = true; });
  t = await texto();
  ok(t.includes('Outra coisa: Medo de não vender'), 'resultado: mostra o texto de "Outra coisa"');
  ok(await page.evaluate(() => { const c = [...document.querySelectorAll('.resp')].find((x) => x.textContent.includes('O que mais te preocupa agora?')); return c ? [...c.querySelectorAll('li')].map((l) => l.textContent).join('|') : ''; }) ===
    'Conheço poucas pessoas para vender ou me ajudar|Outra coisa: Medo de não vender', 'resultado: Pergunta 8 lista as duas preocupações');
  ok(t.includes('O que você oferece aos seus clientes?') && t.includes('Produto: eu compro materiais e faço o que vendo'), 'resultado: resposta da 3A');
  ok(t.includes('Você já sabe fazer bolo de pote?') && t.includes('Bolo de pote'), 'resultado: resumo com P3/P4');
  ok(/Ver suas respostas/i.test(t) && /Para onde seguem estas informações/i.test(t), 'resultado: resumo + textos do Mapa');
  await regrasGerais('resultado');
  await shot('06b-resultado-respostas');

  // 5A para cada opção da Pergunta 5
  for (const op of EXP['M1.P05'].opcoes.map((o) => o[0]))
    await caminho(`P5 = ${op}`, com({ 'M1.P05': op }));
  // 7A: P6 = "Não tenho nada ainda" com P7 diferente de "Nada"; e cada faixa da P7 com P6 = "Sim, tenho tudo"
  await caminho('7A por P6', com({ 'M1.P06': 'Não tenho nada ainda', 'M1.P07': 'Mais de R$ 1.000' }));
  for (const op of EXP['M1.P07'].opcoes.map((o) => o[0]))
    await caminho(`P7 = ${op}`, com({ 'M1.P07': op }));
  // "Não sei dizer" na 5A e na 7A (as únicas que ainda têm a opção) vira lacuna no resultado
  await caminho('Não sei na 5A e na 7A', com({ 'M1.P05': 'Só nos fins de semana', 'M1.P05A': 'Não sei dizer', 'M1.P06': 'Não tenho nada ainda', 'M1.P07A': 'Não sei dizer' }));
  t = await texto();
  ok(await page.evaluate(() => [...document.querySelectorAll('.b-lacuna li')].map((l) => l.textContent).join('|')) ===
    'Ainda falta saber: se você consegue arrumar mais tempo quando o negócio crescer.|Ainda falta saber: como você vai começar sem dinheiro ou sem material.', 'resultado: o que falta descobrir = 5A e 7A, em linguagem simples');
  ok(await page.evaluate(() => document.querySelector('.b-lacuna b').textContent) === 'O que ainda falta descobrir', 'resultado: título "O que ainda falta descobrir"');
  {
    const f = [((await entendemos()) || []).join(' ')];
    ok(f[0].includes('Você já sabe fazer isso bem e só tem os fins de semana para o negócio, e ainda não sabe se consegue arrumar mais tempo.') &&
      f[0].includes('Você pode usar entre R$ 100 e R$ 500 sem faltar para as contas da casa, e ainda não tem o que precisa para trabalhar.') &&
      f[0].includes('O que mais te preocupa agora é: ainda não saber fazer direito.'), 'entendemos: "Não sei dizer" da 5A/7A e preocupação única ' + JSON.stringify(f));
  }
  // serviço, ideia ainda só na cabeça e todas as preocupações
  await caminho('serviço só na cabeça', com({ 'M1.P01': 'Ainda está só na minha cabeça', 'M1.P03': 'Lavagem de carro em domicílio.', __p4: 'lavagem de carro em domicílio',
    'M1.P03A': 'Serviço: meu cliente paga pelo trabalho que realizo', 'M1.P04': 'Ainda não sei fazer', 'M1.P05': 'Mais de 3 horas por dia', 'M1.P06': 'Tenho só uma parte', 'M1.P07': 'Até R$ 100',
    'M1.P08': EXP['M1.P08'].opcoes.map((o) => o[0]), __outra: 'Chuva' }));
  ok(JSON.stringify(await entendemos()) === JSON.stringify([
    'Você quer vender lavagem de carro em domicílio, um serviço: o cliente paga pelo trabalho que você faz. Por enquanto, a ideia está só na sua cabeça. O melhor agora é testar com pouca coisa antes de gastar.',
    'Você ainda precisa aprender a fazer isso e tem mais de 3 horas por dia para o negócio. Você pode usar até R$ 100 sem faltar para as contas da casa e já tem uma parte do que precisa para trabalhar.',
    'O que mais te preocupa agora: ainda não saber fazer direito, a falta de lugar ou equipamento, conhecer poucas pessoas para vender ou te ajudar, a dificuldade com celular, internet ou redes sociais e chuva.',
  ]), 'entendemos (serviço): ' + JSON.stringify(await entendemos()));
  ok(await tarefaAgora() === 'Pergunte a 3 pessoas próximas se comprariam lavagem de carro em domicílio e por quanto.', 'tarefa (só na cabeça): ' + await tarefaAgora());
  ok(JSON.stringify(await faltaAgora()) === '[]' && JSON.stringify(await avisosAgora()) === '[]', 'serviço só na cabeça: nada falta, sem aviso');
  // mercadoria: a Pergunta 4 fala de conhecer o produto e onde comprar (não de saber fazer)
  const MERC = { 'M1.P03A': 'Mercadoria: compro pronto para revender', 'M1.P04': 'Conheço um pouco, ainda estou pesquisando', 'M1.P08': ['Ainda não conheço bem o produto ou os fornecedores'] };
  await caminho('mercadoria', com(Object.assign({ 'M1.P01': 'Já fiz um pouco para testar ou dar de amostra' }, MERC)));
  ok(((await entendemos()) || [])[0] === 'Você quer vender bolo de pote, uma mercadoria: você compra pronto para revender. Você já fez um pouco para testar ou dar de amostra. É hora de ouvir quem provou: compraria? Por quanto?', 'entendemos (mercadoria)');
  ok(await tarefaAgora() === 'Pergunte a 3 pessoas que já experimentaram se comprariam bolo de pote e por quanto.', 'tarefa (amostra): ' + await tarefaAgora());
  await caminho('mercadoria já vende (todas as mensagens)', com(Object.assign({ 'M1.P01': 'Já vendo sempre', 'M1.P03': 'Roupas femininas', __p4: 'roupas femininas',
    'M1.P08': ['Ainda não conheço bem o produto ou os fornecedores', 'Me falta lugar ou equipamento'] }, MERC, { 'M1.P08': OPS_P08_MERC.slice(0, 2).map((o) => o[0]) })), { todasMsgs: true });
  {
    const f = [((await entendemos()) || []).join(' ')];
    ok(f[0].includes('Você ainda está conhecendo o que vai revender e onde comprar e tem de 1 a 3 horas por dia para o negócio.') &&
      f[0].includes('O que mais te preocupa agora: ainda não conhecer bem o produto ou os fornecedores e a falta de lugar ou equipamento.') &&
      !f.join(' ').includes('aprendendo a fazer'), 'entendemos (mercadoria): fala de conhecer o produto, não de saber fazer ' + JSON.stringify(f));
    ok(await tarefaAgora() === 'Pesquise o preço de compra de roupas femininas em 2 fornecedores.', 'tarefa (mercadoria): ' + await tarefaAgora());
    await shot('m01-resultado-mercadoria');
  }
  // serviço que já vende mas "ainda não sabe fazer": aviso que não trava
  await caminho('serviço manicure com aviso', com({ 'M1.P03': 'Manicure', __p4: 'manicure', 'M1.P03A': 'Serviço: meu cliente paga pelo trabalho que realizo', 'M1.P04': 'Ainda não sei fazer' }));
  ok(await tarefaAgora() === 'Anote quanto tempo leva um atendimento, do começo ao fim.', 'tarefa (serviço): ' + await tarefaAgora());
  ok(JSON.stringify(await avisosAgora()) === JSON.stringify(['Você disse que já vende, mas também que ainda não sabe fazer o que vende. Se outra pessoa faz para você e você só revende, talvez a resposta sobre o que você oferece seja "Mercadoria". Confira suas respostas.']),
    'aviso: já vende + ainda não sabe fazer ' + JSON.stringify(await avisosAgora()));
  ok(await page.evaluate(() => !!document.querySelector('.lg2-proximo')), 'aviso não trava: o resultado chega ao botão do próximo módulo');
  // ideia vaga na Pergunta 3: entra no que falta descobrir e a tarefa pede para definir a ideia
  await caminho('ideia vaga', com({ 'M1.P03': 'não sei', __vaga: true, 'M1.P05': 'Até 1 hora por dia', 'M1.P05A': 'Não sei dizer' }));
  ok(JSON.stringify(await faltaAgora()) === JSON.stringify(['Ainda falta saber: o que exatamente você vai vender.', 'Ainda falta saber: se você consegue arrumar mais tempo quando o negócio crescer.']), 'falta descobrir (ideia vaga + 5A): ' + JSON.stringify(await faltaAgora()));
  ok(await tarefaAgora() === 'Escreva em uma frase o que você quer vender e para quem.', 'tarefa (ideia vaga): ' + await tarefaAgora());
  ok(!((await entendemos()) || []).join(' ').includes('não sei'), 'entendemos: não repete a ideia vaga');
  await shot('m01-resultado-falta-e-tarefa');
  // sem nenhum "Não sei", não há bloco de lacunas
  await caminho('sem Não sei', com({}));
  ok(await page.evaluate(() => !document.querySelector('.b-lacuna li') && (document.querySelector('.b-lacuna .nada-falta') || {}).textContent ===
    'Você respondeu tudo com clareza. Por enquanto, não falta descobrir nada nesta parte.'), 'resultado: sem nada para descobrir, diz isso');
  ok(await tarefaAgora() === 'Anote quanto você gasta de material para fazer uma unidade de bolo de pote.', 'tarefa (produto, já vende): ' + await tarefaAgora());
  ok(await page.evaluate(() => !document.querySelector('.b-aviso')), 'resultado: sem aviso quando não há combinação estranha');
  {
    const t2 = await texto();
    ok(!/O que você recebe no final/.test(t2), 'resultado: sai o cartão que só descrevia a entrega');
    for (const s of ['No Módulo 2 você vai usar essa ideia para descobrir quem são os seus possíveis clientes.',
      'No Módulo 4 você vai usar essas informações para montar uma primeira oferta simples e testar a ideia gastando pouco.',
      'No Módulo 6 você vai usar esse valor para planejar quanto investir no começo sem se arriscar.',
      'No Módulo 10, o seu tempo e o que limita você vão ajudar a definir o ritmo e as prioridades do seu plano de 90 dias.',
      'Seu retrato inicial: o tempo que você tem, o que limita você e o que motiva você.'])
      ok(t2.includes(s), `resultado: falta "${s}"`);
  }

  /* ---------- Voltar ---------- */
  await inicio();
  await clicarTexto('button', 'Começar');
  await opcao('Já vendo sempre'); await continuar();
  ok(await cod() === 'M1.P02', 'Voltar: estar na P2');
  await clicarTexto('button', '< Voltar');
  ok(await cod() === 'M1.P01', 'Voltar: P2 -> P1');
  ok((await estadoOpcoes()).find((o) => o.t === 'Já vendo sempre').check, 'Voltar: P1 mantém a escolha com ✓');
  ok(await continuarDesligado() === false, 'Voltar: Continuar aceso com resposta salva');
  await clicarTexto('button', '< Voltar');
  ok(await page.evaluate(() => !!document.querySelector('#ir')), 'Voltar: P1 -> tela inicial');

  /* ---------- persistência ---------- */
  await clicarTexto('button', 'Começar');
  await continuar();
  await opcao('Quero trabalhar por conta própria'); await continuar();
  await page.fill('#txt', 'Conserto de celular'); await continuar();
  ok(await cod() === 'M1.P03A', 'P3A logo depois da P3');
  await opcao('Serviço: meu cliente paga pelo trabalho que realizo'); await continuar();
  await opcao('Ainda não sei fazer'); await continuar();
  await opcao('Só nos fins de semana'); await continuar();
  ok(await cod() === 'M1.P05A', 'persistência: 5A depois de "Só nos fins de semana"');
  await page.reload(); await page.waitForSelector('#ir');
  ok((await texto()).includes('Apagar respostas e recomeçar'), 'persistência: início reconhece respostas salvas');
  await clicarTexto('button', 'Começar');
  ok(await cod() === 'M1.P05A', 'persistência: volta para a 5A depois de recarregar');
  await clicarTexto('button', '< Voltar');
  ok((await estadoOpcoes()).find((o) => o.t === 'Só nos fins de semana').check, 'persistência: P5 mantém a escolha');
  await clicarTexto('button', '< Voltar');
  ok(await page.evaluate(() => document.querySelector('.q').textContent) === 'Você já sabe fazer conserto de celular?', 'persistência: P4 repete a resposta da P3');
  // trocar a P5 para uma opção sem 5A remove a resposta extra do caminho
  await continuar();
  await opcao('Mais de 3 horas por dia'); await continuar();
  ok(await cod() === 'M1.P06', 'trocar P5 pula a 5A');

  /* ---------- card de vídeo com um vídeo de teste (como ficará quando o grupo mandar) ---------- */
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const pv = await ctx.newPage();
    pv.on('pageerror', (e) => erros.push('vídeo: ' + e.message));
    await pv.route('**/dados/modulo1.js', (rt) => { let n = 0; rt.fulfill({ contentType: 'text/javascript',
      body: dados.replace(/"url": null/g, () => (++n === 1 ? '"url": "about:blank"' : '"url": "teste.mp4"')) }); });
    await pv.route('**/teste.mp4', (rt) => rt.fulfill({ status: 200, contentType: 'video/mp4', body: '' }));
    await pv.goto(srv.url); await pv.evaluate(() => localStorage.clear()); await pv.reload(); await pv.waitForSelector('#ir');
    const pc = () => pv.evaluate(() => (document.querySelector('.pergunta') || {}).dataset?.cod);
    const clica = (sel, txt) => pv.evaluate(([sel, txt]) => { const b = [...document.querySelectorAll(sel)].find((x) => x.textContent.replace('✓', '').trim() === txt); if (b) b.click(); return !!b; }, [sel, txt]);
    const card = () => pv.evaluate(() => { const c = document.querySelector('.video-card'); return c ? c.textContent.trim() : null; });
    const aberto = () => pv.evaluate(() => { const d = document.querySelector('.video-fundo[role=dialog]'); return !!d && d.getBoundingClientRect().height > 0; });
    const salvo = (c) => pv.evaluate((c) => (JSON.parse(localStorage.getItem('lg2-turma-a-m01') || '{}').R || {})[c] || null, c);
    const desligado = () => pv.evaluate(() => [...document.querySelectorAll('button')].find((x) => x.textContent.trim() === 'Continuar').disabled);
    await clica('button', 'Começar');
    const vistos = {};
    for (let i = 0; i < 12; i++) {
      const c = await pc();
      if (!c) break;
      vistos[c] = await card();
      if (COM_VIDEO.includes(c)) {
        ok(vistos[c] === CARD, `${c}: card "${vistos[c]}" com vídeo`);
        ok(await pv.evaluate(() => { const c = document.querySelector('.video-card'), e = document.querySelector('#ent');
          return e.compareDocumentPosition(c) & Node.DOCUMENT_POSITION_FOLLOWING && c.getBoundingClientRect().top >= e.getBoundingClientRect().bottom; }), `${c}: card logo abaixo das opções/campo`);
        await pv.click('.video-card');
        ok(await aberto(), `${c}: tocar no card abre o vídeo`);
        ok(await pv.evaluate((c) => c === 'M1.P03' ? !!document.querySelector('.video-fundo iframe[src="about:blank"]') : !!document.querySelector('.video-fundo video[src="teste.mp4"]'), c), `${c}: vídeo certo na caixa`);
        if (c === 'M1.P03') await clica('button', 'Fechar vídeo');
        else await pv.evaluate(() => document.querySelector('.video-fundo video').dispatchEvent(new Event('ended')));
        ok(!(await aberto()), `${c}: ${c === 'M1.P03' ? 'fechar' : 'terminar'} o vídeo fecha a caixa`);
        ok(await pc() === c && (await salvo(c)) === null && (await desligado()) === true, `${c}: volta para a mesma pergunta, sem resposta`);
        await pv.click('.video-card'); await pv.keyboard.press('Escape');
        ok(!(await aberto()) && await pc() === c, `${c}: Esc fecha o vídeo`);
      }
      if (c === 'M1.P03') await pv.fill('#txt', 'Bolo de pote');
      else await clica('.opcao', c === 'M1.P07' ? 'Nada por enquanto' : (await pv.evaluate(() => document.querySelector('.opcao b').textContent)));
      await clica('button', 'Continuar');
    }
    ok(JSON.stringify(Object.keys(vistos).filter((c) => vistos[c])) === JSON.stringify(COM_VIDEO), `card só nas Perguntas 3 e 7: ${JSON.stringify(vistos)}`);
    await ctx.close();
  }

  /* ---------- respostas da versão anterior (v2, com "Não sei" em toda pergunta) ---------- */
  await page.evaluate(() => localStorage.setItem('lg2-turma-a-m01', JSON.stringify({ v: 2, atual: 'RESULTADO', R: {
    'M1.P01': { estado: 'opcao', opcao: 'Já vendo sempre' }, 'M1.P02': { estado: 'opcao', opcao: 'Não sei dizer' },
    'M1.P03': { estado: 'naosei', texto: 'Ainda não sei' }, 'M1.P04': { estado: 'opcao', opcao: 'Sim, já faço bem' },
    'M1.P05': { estado: 'opcao', opcao: 'Até 1 hora por dia' }, 'M1.P05A': { estado: 'opcao', opcao: 'Não sei dizer' } } })));
  await page.reload(); await page.waitForSelector('#ir');
  ok((await texto()).includes('Apagar respostas'), 'v2: mantém as respostas que continuam valendo');
  await clicarTexto('button', 'Começar');
  ok(await cod() === 'M1.P02' && (await estadoOpcoes()).every((o) => !o.sel), 'v2: volta para a P2, que perdeu o "Não sei dizer"');
  const mig = await page.evaluate(() => JSON.parse(localStorage.getItem('lg2-turma-a-m01')));
  ok(mig.v === 4 && JSON.stringify(Object.keys(mig.R).sort()) === JSON.stringify(['M1.P01', 'M1.P04', 'M1.P05', 'M1.P05A']) && mig.R['M1.P05A'].opcao === 'Não sei dizer',
    'v2: tira só "Não sei dizer" da P2 e "Ainda não sei" da P3, guarda o resto (inclusive o da 5A): ' + JSON.stringify(mig));

  /* ---------- respostas da v3 (Pergunta 8 com uma resposta só, sem a 3A) ---------- */
  const v3R = { 'M1.P01': { estado: 'opcao', opcao: 'Já vendo sempre' }, 'M1.P02': { estado: 'opcao', opcao: 'Quero trabalhar por conta própria' },
    'M1.P03': { estado: 'valor', valor: 'Lavagem de carro' }, 'M1.P04': { estado: 'opcao', opcao: 'Sim, já faço bem' },
    'M1.P05': { estado: 'opcao', opcao: 'Mais de 3 horas por dia' }, 'M1.P06': { estado: 'opcao', opcao: 'Sim, tenho tudo' },
    'M1.P07': { estado: 'opcao', opcao: 'Até R$ 100' }, 'M1.P08': { estado: 'opcao', opcao: 'Outra coisa', detalhe: 'Chuva' } };
  await page.evaluate((R) => localStorage.setItem('lg2-turma-a-m01', JSON.stringify({ v: 3, atual: 'M1.P08', R })), v3R);
  await page.reload(); await page.waitForSelector('#ir');
  await clicarTexto('button', 'Começar');
  ok(await cod() === 'M1.P08', 'v3: volta para a P8 onde estava');
  ok(JSON.stringify((await estadoOpcoes()).filter((o) => o.sel).map((o) => o.t)) === '["Outra coisa"]' && await page.evaluate(() => document.querySelector('.outra textarea').value) === 'Chuva',
    'v3: a resposta única da P8 vira lista, com o texto de "Outra coisa"');
  ok(JSON.stringify((await page.evaluate(() => JSON.parse(localStorage.getItem('lg2-turma-a-m01')))).R['M1.P08']) === JSON.stringify({ estado: 'opcao', opcao: 'Outra coisa', detalhe: 'Chuva', opcoes: ['Outra coisa'] }), 'v3: P8 migrada no formato novo');
  await opcao('Me falta lugar ou equipamento'); await continuar();
  ok(await cod() === 'M1.P03A', 'v3: sem a 3A, o Continuar da última pergunta leva para a 3A (não para o resultado)');
  await opcao('Serviço: meu cliente paga pelo trabalho que realizo');
  for (let i = 0; i < 10 && (await cod()) !== 'RESULTADO'; i++) await continuar();
  ok(await cod() === 'RESULTADO' && ((await entendemos()) || [])[0].startsWith('Você vende lavagem de carro, um serviço: o cliente paga pelo trabalho que você faz.'), 'v3: chega ao resultado com o tipo');
  await page.evaluate((R) => localStorage.setItem('lg2-turma-a-m01', JSON.stringify({ v: 3, atual: 'RESULTADO', R })), v3R);
  await page.reload(); await page.waitForSelector('#ir');
  await clicarTexto('button', 'Começar');
  ok(await cod() === 'M1.P03A', 'v3 terminado: Começar leva para a 3A nova');

  /* ---------- caixas de dica por opção na P8: aparecem as de todas as marcadas ---------- */
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const pd = await ctx.newPage();
    pd.on('pageerror', (e) => erros.push('dicas P8: ' + e.message));
    await pd.route('**/dados/modulo1.js', (rt) => rt.fulfill({ contentType: 'text/javascript',
      body: dados.replace('"texto": "Ainda não sei fazer direito",\n     "mensagem": null', '"texto": "Ainda não sei fazer direito",\n     "mensagem": {"titulo": "Dica", "texto": "DICA-A"}')
        .replace('"texto": "Me falta lugar ou equipamento",\n     "mensagem": null', '"texto": "Me falta lugar ou equipamento",\n     "mensagem": {"titulo": "Dica", "texto": "DICA-B"}') }));
    await pd.goto(srv.url);
    await pd.evaluate((R) => localStorage.setItem('lg2-turma-a-m01', JSON.stringify({ v: 4, atual: 'M1.P08', R: Object.assign({}, R, { 'M1.P03A': { estado: 'opcao', opcao: 'Produto: eu compro materiais e faço o que vendo' } }) })), Object.assign({}, v3R, { 'M1.P08': undefined }));
    await pd.reload(); await pd.waitForSelector('#ir');
    const clica = (t) => pd.evaluate((t) => { const b = [...document.querySelectorAll('button')].find((x) => x.textContent.replace('✓', '').trim() === t); if (b) b.click(); return !!b; }, t);
    const dicas = () => pd.evaluate(() => [...document.querySelectorAll('#msg .msg p')].map((p) => p.textContent).join('|'));
    await clica('Começar');
    await clica('Ainda não sei fazer direito'); await clica('Me falta lugar ou equipamento');
    ok(await dicas() === 'DICA-A|DICA-B', 'P8: mostra a dica de cada opção marcada: ' + await dicas());
    await clica('Ainda não sei fazer direito');
    ok(await dicas() === 'DICA-B', 'P8: desmarcar tira a dica daquela opção');
    await ctx.close();
  }

  /* ---------- trocar o tipo na 3A: a P4 vira a pergunta de revenda e a resposta acompanha ---------- */
  {
    await inicio();
    await clicarTexto('button', 'Começar');
    await opcao('Já vendo sempre'); await continuar();
    await opcao('Quero ganhar um dinheiro a mais'); await continuar();
    await page.fill('#txt', 'Roupas'); await continuar();
    await opcao('Produto: eu compro materiais e faço o que vendo'); await continuar();
    ok(await page.evaluate(() => document.querySelector('.q').textContent) === 'Você já sabe fazer roupas?', 'troca de tipo: P4 de produto');
    await opcao('Sim, já faço bem');
    await clicarTexto('button', '< Voltar');
    await opcao('Mercadoria: compro pronto para revender');
    ok(JSON.stringify((await page.evaluate(() => JSON.parse(localStorage.getItem('lg2-turma-a-m01')))).R['M1.P03A']) === JSON.stringify({ estado: 'opcao', opcao: 'Mercadoria: compro pronto para revender' }), 'troca de tipo: 3A no mesmo formato');
    await continuar();
    ok(await page.evaluate(() => document.querySelector('.q').textContent) === 'Você já conhece bem roupas e sabe onde comprar?', 'troca de tipo: P4 de revenda');
    ok(JSON.stringify((await estadoOpcoes()).filter((o) => o.sel).map((o) => o.t)) === '["Sim, conheço bem o produto e onde comprar"]' && (await continuarDesligado()) === false,
      'troca de tipo: a resposta da P4 passa para a opção equivalente, Continuar aceso');
    ok(!(await texto()).includes('ainda estou aprendendo'), 'troca de tipo: sem opção de "aprender a fazer" na revenda');
    await page.evaluate(() => { document.querySelector('details').open = true; });
    await shot('m01-p4-mercadoria');
    await clicarTexto('button', '< Voltar');
    await opcao('Serviço: meu cliente paga pelo trabalho que realizo'); await continuar();
    ok(JSON.stringify((await estadoOpcoes()).filter((o) => o.sel).map((o) => o.t)) === '["Sim, já faço bem"]', 'troca de tipo: voltar para serviço restaura a opção de saber fazer');
  }

  /* ---------- teclado do celular (receita A): campo e Continuar visíveis com o teclado aberto ---------- */
  {
    const html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
    ok(/<meta name="viewport" content="width=device-width, initial-scale=1, interactive-widget=resizes-content">/.test(html), 'teclado: meta viewport com interactive-widget=resizes-content');
    ok((app.match(/addEventListener\("focusin"/g) || []).length === 1 && /scrollIntoView\(\{ block: "center" \}\)/.test(app) && /visualViewport\.addEventListener\("resize"/.test(app) && !/scrollTo\(0,\s*0\)[^;]*focus/.test(app), 'teclado: um listener focusin que centraliza o campo (também no resize do visualViewport)');
    const kb = await browser.newPage({ viewport: { width: 390, height: 844 } });
    kb.on('pageerror', (e) => erros.push('teclado: ' + e.message));
    await kb.goto(srv.url);
    const dentro = (sel) => kb.evaluate((sel) => { const r = document.querySelector(sel).getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight; }, sel);
    const okBtn = () => kb.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => x.textContent.trim() === 'Continuar'); const r = b.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight; });
    for (const [nome, R, sel] of [
      ['P3', { 'M1.P01': { estado: 'opcao', opcao: 'Já vendo sempre' }, 'M1.P02': { estado: 'opcao', opcao: 'Quero ganhar um dinheiro a mais' } }, '#txt'],
      ['P8 (Outra coisa)', null, '.outra textarea'],
    ]) {
      await kb.setViewportSize({ width: 390, height: 844 });
      if (R) await kb.evaluate((R) => localStorage.setItem('lg2-turma-a-m01', JSON.stringify({ v: 4, atual: 'M1.P03', R })), R);
      else await kb.evaluate((R) => localStorage.setItem('lg2-turma-a-m01', JSON.stringify({ v: 4, atual: 'M1.P08', R })), Object.assign({}, v3R, { 'M1.P03A': { estado: 'opcao', opcao: 'Serviço: meu cliente paga pelo trabalho que realizo' }, 'M1.P08': { estado: 'opcao', opcao: 'Outra coisa', opcoes: ['Outra coisa'] } }));
      await kb.reload(); await kb.waitForSelector('#ir');
      await kb.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Começar').click());
      await kb.waitForSelector(sel);
      await kb.focus(sel);
      await kb.setViewportSize({ width: 390, height: 450 });   // teclado aberto
      await kb.waitForTimeout(450);
      ok(await dentro(sel) && await okBtn(), `teclado (${nome}): campo e Continuar dentro da janela 390x450`);
    }
    await kb.close();
  }

  /* ---------- respostas da versão antiga são descartadas ---------- */
  await page.evaluate(() => localStorage.setItem('lg2-turma-a-m01', JSON.stringify({ R: { 'M1.P01': { estado: 'opcao', opcao: '1. Só na cabeça' } }, hist: ['M1.P01', 'M1.P02'] })));
  await page.reload(); await page.waitForSelector('#ir');
  ok(!(await texto()).includes('Apagar respostas'), 'versão antiga: não reconhece respostas antigas');
  await clicarTexto('button', 'Começar');
  ok(await cod() === 'M1.P01' && (await estadoOpcoes()).every((o) => !o.sel), 'versão antiga: começa do zero na P1');
  ok(await continuarDesligado() === true, 'versão antiga: Continuar apagado');

  ok(erros.length === 0, 'erros na página: ' + erros.join(' | '));
  await browser.close(); srv.close();
  if (falhas.length) { console.log(`FAIL ${falhas.length} de ${checks} checagens`); falhas.forEach((f) => console.log(' - ' + f)); process.exit(1); }
  console.log(`PASS ${checks} checagens · lote 05/11 (b): teclado, o que falta descobrir + tarefa, P4/P8 de revenda e exemplos por tipo, aviso de combinação, sem texto aos grupos · 3A (Produto/Mercadoria/Serviço), P8 com várias respostas + migração v3, "O que entendemos até aqui" · caminhos: 5A (4 opções da P5), 7A (P6 e 5 opções da P7), "Não sei dizer" só na 5A/7A, card de vídeo (escondido; com vídeo de teste nas P3 e P7), ${sabot.length} sabotagens detectadas, P8 e resultado alcançados`);
})().catch((e) => { console.error('FAIL', e); process.exit(1); });
