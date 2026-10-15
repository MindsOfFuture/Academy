/* LG2 · Módulo 1 (Turma A) · teste headless do módulo publicado em public/lg2/turma-a/m01.
   Execute: PW=<caminho do playwright> node tests/lg2-m01-turma-a.cjs
   Opcional: LG2_SHOTS=<pasta> (prints 390x844).
   Confere o documento "Módulo 1 – Textos do app em linguagem simples": fluxo (5A e 7A),
   mensagem de cada opção, regras de todas as telas, tela inicial, "O que esta parte não faz",
   persistência e descarte de respostas antigas. Sai com código != 0 se falhar. */
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
   ],
   [
    "Não sei dizer",
    "Tudo bem: Vamos descobrir juntos nas próximas perguntas."
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
   ],
   [
    "Não sei dizer",
    "Tudo bem: Vamos descobrir juntos nas próximas perguntas."
   ]
  ],
  "ajuda": false
 },
 "M1.P03": {
  "pergunta": "O que você vende ou quer vender?",
  "apoio": "Pode ser uma coisa que você faz ou um trabalho que você oferece.",
  "placeholder": "Ex.: bolo de pote, conserto de celular, unha de gel",
  "naosei": [
   "Ainda não sei",
   "Tudo bem: Pense em algo que você já sabe fazer bem ou que as pessoas pedem para você. Você pode mudar depois."
  ],
  "ajuda": false
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
   ],
   [
    "Não sei dizer",
    "Tudo bem: Vamos descobrir juntos nas próximas perguntas."
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
   ],
   [
    "Não sei dizer",
    "Tudo bem: Pense em um dia comum: quanto tempo livre você tem? Você pode mudar depois."
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
   ],
   [
    "Não sei dizer",
    "Tudo bem: Faça uma lista do que você usa para fazer seu produto e veja o que já tem em casa."
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
   ],
   [
    "Não sei dizer",
    "Tudo bem: Veja quanto sobra no fim do mês depois de pagar as contas. É um bom começo."
   ]
  ],
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
  "apoio": "Escolha só uma opção.",
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
   ],
   [
    "Não sei dizer",
    null
   ]
  ],
  "ajuda": false
 }
};
const ORDEM = ['M1.P01', 'M1.P02', 'M1.P03', 'M1.P04', 'M1.P05', 'M1.P05A', 'M1.P06', 'M1.P07', 'M1.P07A', 'M1.P08'];
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
    const e = EXP[c];
    const t = await texto();
    const q = await page.evaluate(() => document.querySelector('.q').textContent);
    let qEsp = e.pergunta;
    if (c === 'M1.P04' && R['M1.P03'] && R['M1.P03'] !== 'Ainda não sei') qEsp = `Você já sabe fazer ${R.__p4}?`;
    ok(q === qEsp, `${c}: pergunta "${q}" != "${qEsp}"`);
    ok(t.includes(e.apoio), `${c}: apoio`);
    ok(await page.evaluate(() => [...document.querySelectorAll('.topo button')].some((b) => b.textContent.trim() === '< Voltar')), `${c}: "< Voltar" no topo`);
    ok(await page.evaluate(() => !!document.querySelector('.barra')), `${c}: barra de progresso`);
    const d = await page.evaluate(() => [...document.querySelectorAll('details')].map((x) => [x.open, x.querySelector('summary').textContent]));
    ok(e.ajuda ? d.length === 1 && d[0][0] === false && d[0][1] === 'O que quer dizer isso?' : d.length === 0, `${c}: caixa de ajuda (fechada, título)`);
    if (e.ajuda) ok(t.includes('O que quer dizer isso?') && !/Fonte/i.test(t), `${c}: ajuda sem fonte`);
    await regrasGerais(c);
    if (R.__novo) ok(await continuarDesligado() === true, `${c}: Continuar deve começar apagado`);
    if (e.opcoes) {
      const ops = await estadoOpcoes();
      ok(JSON.stringify(ops.map((o) => o.t)) === JSON.stringify(e.opcoes.map((o) => o[0])), `${c}: opções ${JSON.stringify(ops.map((o) => o.t))}`);
      ok(ops.length && ops[ops.length - 1].t === 'Não sei dizer', `${c}: "Não sei dizer" deve ser a última`);
      if (R.__novo) ok((await msgAgora()) === null, `${c}: sem mensagem antes de responder`);
      if (todasMsgs) for (const [op, m] of e.opcoes) {
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
      if (v === 'Ainda não sei') {
        ok(await clicarTexto('button', 'Ainda não sei'), 'P3: botão Ainda não sei');
        ok((await msgAgora()) === EXP[c].naosei[1], `P3: mensagem do "Ainda não sei": ${await msgAgora()}`);
        ok(await page.evaluate(() => document.querySelector('#ns').classList.contains('sel')), 'P3: ✓ no Ainda não sei');
      } else {
        await page.fill('#txt', v);
        ok((await msgAgora()) === null, 'P3: sem mensagem ao escrever');
      }
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
    for (let i = 0; i < 15; i++) {
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
    'M1.P04': 'Sim, já faço bem', 'M1.P05': 'De 1 a 3 horas por dia', 'M1.P05A': 'Sim, consigo arrumar mais tempo',
    'M1.P06': 'Sim, tenho tudo', 'M1.P07': 'Entre R$ 100 e R$ 500', 'M1.P07A': 'Juntando dinheiro primeiro', 'M1.P08': 'Ainda não sei fazer direito' };
  const com = (x) => Object.assign({}, base, x);

  /* ---------- tela inicial e "O que esta parte não faz" ---------- */
  await inicio();
  let t = await texto();
  for (const s of ['PARTE 1', 'Você e a sua ideia', 'Vamos conversar sobre você e sobre o que você quer vender. Não existe resposta certa ou errada.',
    'Isso é para você se:', 'Antes de começar, pense nisto:', 'No final, você vai ter:', 'Leva uns 10 minutos', 'O que esta parte não faz',
    'Quanto dinheiro você pode usar sem faltar para as contas da casa', 'Uma tarefa fácil para fazer já'])
    ok(t.includes(s), `início: falta "${s}"`);
  ok(!t.includes('confirmar o tempo'), 'início: nota "(confirmar o tempo real)" não pode aparecer');
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
    'Feito pelo Grupo 1 · Laboratório de Gestão II · FACC/UFJF'])
    ok(t.includes(s), `limites: falta "${s}"`);
  ok(!/vers[ãa]o|v0\.|sem versão|internas/i.test(t), 'limites: sem versão/data');
  ok(await page.evaluate(() => getComputedStyle(document.querySelector('.aviso-roxo')).backgroundColor === 'rgb(104, 74, 151)'), 'limites: caixa roxa');
  await regrasGerais('limites');
  await shot('02-o-que-esta-parte-nao-faz');
  await clicarTexto('button', '< Voltar');
  ok(await page.evaluate(() => !!document.querySelector('#ir')), 'limites: Voltar leva ao início');

  /* ---------- caminhos ---------- */
  // 1: todas as mensagens, 5A e 7A pelos gatilhos P5 = "Até 1 hora por dia" e P7 = "Nada por enquanto"
  await caminho('A (mensagens, 5A, 7A por P7)', com({ 'M1.P05': 'Até 1 hora por dia', 'M1.P07': 'Nada por enquanto', 'M1.P08': 'Outra coisa', __outra: 'Medo de não vender' }), {
    todasMsgs: true,
    shots: {
      'M1.P01': async () => { await opcao('Já fiz um pouco para testar ou dar de amostra'); await shot('03-pergunta-dica-check'); },
      'M1.P04': async () => { await page.evaluate(() => { document.querySelector('details').open = true; }); await shot('04-ajuda-aberta'); },
      'M1.P07': async () => { await opcao('Até R$ 100'); await shot('05-p7-faixas'); },
    },
  });
  t = await texto();
  ok(t.includes('Outra coisa: Medo de não vender'), 'resultado: mostra o texto de "Outra coisa"');
  ok(t.includes('Você já sabe fazer bolo de pote?') && t.includes('Bolo de pote'), 'resultado: resumo com P3/P4');
  ok(/Suas respostas/i.test(t) && /Para onde seguem estas informações/i.test(t), 'resultado: resumo + textos do Mapa');
  await regrasGerais('resultado');
  await shot('06-resultado');

  // 5A para cada opção da Pergunta 5
  for (const op of EXP['M1.P05'].opcoes.map((o) => o[0]))
    await caminho(`P5 = ${op}`, com({ 'M1.P05': op }));
  // 7A: P6 = "Não tenho nada ainda" com P7 diferente de "Nada"; e cada faixa da P7 com P6 = "Sim, tenho tudo"
  await caminho('7A por P6', com({ 'M1.P06': 'Não tenho nada ainda', 'M1.P07': 'Mais de R$ 1.000' }));
  for (const op of EXP['M1.P07'].opcoes.map((o) => o[0]))
    await caminho(`P7 = ${op}`, com({ 'M1.P07': op }));
  // P3 "Ainda não sei": P4 volta ao texto geral
  await caminho('P3 Ainda não sei', com({ 'M1.P03': 'Ainda não sei', 'M1.P08': 'Não sei dizer' }));

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
  console.log(`PASS ${checks} checagens · caminhos: 5A (5 opções da P5), 7A (P6 e 6 opções da P7), P8 e resultado alcançados`);
})().catch((e) => { console.error('FAIL', e); process.exit(1); });
