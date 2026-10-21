/* Módulo 10 (Turma B) contra a planilha "Modulo_10_Perguntas_e_Caminhos.xlsx" do Grupo 10.
   Execute: PW=<caminho do pacote playwright> node tests/lg2-m10.cjs   (SHOTS=<pasta> grava prints 390x844)
   ESPERADO foi copiado da planilha (abas "Passo a passo" e "Caminhos por resposta"); roda sem a planilha.
   1) o texto em dados/modulo10.js é o da planilha, sem edição;
   2) regras: casos da aba "Cálculos a conferir" contra motor.js;
   3) cada linha da aba "Caminhos por resposta" é alcançada na tela, com o conjunto exato de caixas;
   4) cruzamentos, encaminhamento e herança dos Módulos 1 a 9; percurso inteiro, recarregar e retomar.
   Sai com código 1 se algo falhar. */
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { chromium } = require(process.env.PW || 'playwright');

const DIR = path.resolve(__dirname, '../public/lg2/turma-b/m10');
const ESPERADO = {
 "perguntas": [
  [
   "M10-01",
   "Como você vende",
   "Além de [canais de venda], por onde os clientes falam com você?"
  ],
  [
   "M10-02",
   "Como você vende",
   "Em quanto tempo você costuma responder a um cliente?"
  ],
  [
   "M10-03",
   "Como você vende",
   "Quando alguém demonstra interesse, você segue uma sequência até fechar a venda?"
  ],
  [
   "M10-04",
   "Como você vende",
   "Depois da entrega, você volta a falar com o cliente?"
  ],
  [
   "M10-05",
   "Como você vende",
   "Como as pessoas vão saber que [oferta em foco] existe nas próximas semanas?"
  ],
  [
   "M10-06",
   "Pessoas",
   "Vocês já combinaram por escrito quem faz o quê, quanto cada um coloca e como dividem o resultado?"
  ],
  [
   "M10-07",
   "Pessoas",
   "Quem cuida destas etapas do seu processo?"
  ],
  [
   "M10-08",
   "Pessoas",
   "Você pensa em contratar alguém nos próximos meses?"
  ],
  [
   "M10-08a",
   "Pessoas",
   "Antes de contratar, quais outras formas você já considerou?"
  ],
  [
   "M10-09",
   "Seu plano",
   "Estes são os pontos que apareceram no seu percurso. Quais são os 3 mais urgentes para você?"
  ],
  [
   "M10-10",
   "Seu plano",
   "Se você esperar 3 meses sem agir, o que tende a acontecer com cada uma?"
  ],
  [
   "M10-11",
   "Seu plano",
   "Para a prioridade mais urgente: o que você vai fazer, até quando, e que sinal vai mostrar que funcionou?"
  ],
  [
   "M10-12",
   "Fechamento",
   "Este é o seu plano de ação e o retrato do seu negócio. Está certo?"
  ]
 ],
 "caminhos": [
  [
   "M10-01",
   "Uma ou mais opções (WhatsApp, Instagram ou outra rede, telefone, pessoalmente, e-mail)",
   "Resposta",
   "Anotado. Concentrar a conversa em poucos canais ajuda a não perder pedidos."
  ],
  [
   "M10-01",
   "Ainda não falo com clientes",
   "Dica",
   "Pense em por onde o seu cliente prefere falar: o Módulo 2 mostrou onde ele procura ([onde procuram])."
  ],
  [
   "M10-01",
   "Não sei",
   "Dica",
   "Lembre como foram os últimos contatos: mensagem, ligação ou pessoalmente?"
  ],
  [
   "M10-02",
   "Em até 1 hora / No mesmo dia",
   "Resposta",
   "Responder rápido costuma pesar na decisão de compra."
  ],
  [
   "M10-02",
   "Em 1 ou 2 dias",
   "Dica",
   "Separar dois momentos fixos por dia para responder pode ajudar. [Se tempo de apoio alto no M7]: isso também pesa no seu tempo de apoio."
  ],
  [
   "M10-02",
   "Mais de 2 dias",
   "Atenção",
   "Quem espera muito pode comprar de outra pessoa. Uma mensagem automática dizendo quando você responde pode ajudar."
  ],
  [
   "M10-02",
   "Ainda não vendo / Não sei",
   "Dica",
   "Quando começar, anote a hora da mensagem e a hora da sua resposta em alguns contatos."
  ],
  [
   "M10-03",
   "Sim, sigo passos parecidos",
   "Resposta",
   "Confira o roteiro. Ele usa o que você já respondeu nos outros módulos."
  ],
  [
   "M10-03",
   "Depende do cliente",
   "Dica",
   "Um roteiro base ajuda a não esquecer passos, mesmo que cada conversa seja diferente."
  ],
  [
   "M10-03",
   "Ainda não vendi",
   "Dica",
   "Use o roteiro no seu teste e anote o que funcionou."
  ],
  [
   "M10-03",
   "Não sei",
   "Dica",
   "Lembre a última venda: o que aconteceu entre o primeiro contato e o pagamento?"
  ],
  [
   "M10-04",
   "Sim, peço opinião / Sim, ofereço de novo",
   "Resposta",
   "Anote o que os clientes dizem: isso alimenta o seu padrão de qualidade (Módulo 7)."
  ],
  [
   "M10-04",
   "Não, só se o cliente me procura",
   "Dica",
   "Uma mensagem alguns dias depois, perguntando se deu tudo certo, pode trazer a próxima venda e indicações."
  ],
  [
   "M10-04",
   "Ainda não vendi / Não sei",
   "Dica",
   "Inclua uma mensagem depois da entrega no seu roteiro de venda."
  ],
  [
   "M10-05",
   "Indicação de quem já comprou / Redes sociais próprias / Grupos de mensagem / Cartaz ou panfleto no bairro / Parceria com outro negócio",
   "Resposta",
   "Anotado. A mensagem de apresentação usa o seu diferencial; confira e ajuste."
  ],
  [
   "M10-05",
   "Anúncio pago",
   "Atenção",
   "Anúncio pago é um gasto. Confira se ele entrou nos seus gastos do Módulo 5 e defina um limite antes de começar."
  ],
  [
   "M10-05",
   "Ainda não sei",
   "Dica",
   "Comece pelo que não custa: avisar quem já comprou e pedir indicação."
  ],
  [
   "M10-06",
   "Sim, por escrito",
   "Resposta",
   "Ótimo. Guardem o documento e revisem se algo mudar."
  ],
  [
   "M10-06",
   "Só combinamos de boca / Ainda não",
   "Atenção",
   "Um acordo escrito evita desentendimentos sobre trabalho, dinheiro e saída de um sócio. Para a forma do documento, procure um contador ou advogado."
  ],
  [
   "M10-06",
   "Não sei",
   "Dica",
   "Converse com o sócio sobre os itens do checklist de acordo."
  ],
  [
   "M10-07",
   "Responsável escolhido por etapa (eu, sócio, ajudante, ninguém ainda)",
   "Resposta",
   "Mapa atualizado."
  ],
  [
   "M10-07",
   "'Ninguém ainda' em alguma etapa",
   "Dica",
   "Etapa sem responsável costuma ser a que atrasa."
  ],
  [
   "M10-08",
   "Não",
   "Resposta",
   "Anotado."
  ],
  [
   "M10-08",
   "Sim, para produzir ou atender / para vender ou divulgar / para tarefas administrativas",
   "Atenção",
   "Contratar tem custo todo mês e regras próprias. Antes de decidir, veja as alternativas e converse com um contador sobre a forma de contratar."
  ],
  [
   "M10-08",
   "Não sei",
   "Dica",
   "Pense no que você deixa de fazer por falta de tempo. É isso que alguém faria."
  ],
  [
   "M10-08a",
   "Uma ou mais (parceria com outro negócio, profissional por serviço avulso, ajuda da família, menos variedade de opções, rever o tempo de apoio, ainda nenhuma)",
   "Resposta",
   "Anotado. O plano pode começar testando uma alternativa antes de contratar."
  ],
  [
   "M10-09",
   "Até 3 itens da lista",
   "Resposta",
   "Anotado. Vamos ver qual delas é a mais urgente."
  ],
  [
   "M10-09",
   "Outro (texto)",
   "Resposta",
   "Anotado."
  ],
  [
   "M10-09",
   "Mais de 3",
   "Dica",
   "Com três prioridades fica mais fácil começar. As outras ficam guardadas."
  ],
  [
   "M10-09",
   "Não sei",
   "Dica",
   "Deixamos marcadas as três que mais pesam pelo que você respondeu. Você pode trocar."
  ],
  [
   "M10-10",
   "Para cada prioridade: piora muito / piora um pouco / fica igual / não sei",
   "Resposta",
   "A mais urgente parece ser: [prioridade]."
  ],
  [
   "M10-11",
   "Ação, data, sinal e número preenchidos",
   "Resposta",
   "Seu plano: [frase]. Combine com você mesmo de olhar o resultado nessa data."
  ],
  [
   "M10-11",
   "Sem número",
   "Dica",
   "Quanto basta para dizer que funcionou? Definir antes evita mudar a régua depois."
  ],
  [
   "M10-11",
   "Data acima de 90 dias",
   "Dica",
   "Um prazo longo dificulta acompanhar. Qual seria um primeiro passo para as próximas duas semanas?"
  ],
  [
   "M10-11",
   "Data inválida (passada)",
   "Dica",
   "Escolha uma data a partir de hoje."
  ],
  [
   "M10-11",
   "Não sei",
   "Dica",
   "Comece pelo menor passo possível desta semana."
  ],
  [
   "M10-12",
   "Sim, salvar",
   "Resposta",
   "Pronto! Seu plano está salvo. Tudo aqui são estimativas e orientações; as decisões são suas. [Se houver ofertas guardadas]: Quer fazer o percurso com [próxima oferta]?"
  ],
  [
   "M10-12",
   "Quero corrigir algo",
   "Resposta",
   "Qual resposta você quer mudar?"
  ]
 ],
 "apoio": {
  "M10-01": "Marque todos. Não informe números nem perfis.",
  "M10-02": "Pense na última semana. Se ainda não vende, pense no que consegue fazer.",
  "M10-03": "Você já ouviu [pessoas ouvidas] pessoas no Módulo 2. Montamos um roteiro com o que você respondeu: [etapas]. Confira.",
  "M10-04": "[Se compra recorrente no Módulo 2]: Você disse que o cliente compra [frequência]. Voltar a falar pode trazer a próxima venda.",
  "M10-05": "Escolha a principal. A mensagem pode partir do seu diferencial: [diferencial do Módulo 3].",
  "M10-06": "Você disse no Módulo 8 que terá sócio. Combinar antes evita desentendimentos depois.",
  "M10-07": "Etapas do seu mapa (Módulo 7) que ainda estão sem responsável: [etapas].",
  "M10-08": "[Se capacidade curta no Módulo 7]: Com o tempo informado, cabem cerca de [N] por mês, e você pretende [volume].",
  "M10-08a": "Marque as que você já pensou. Contratar tem custo fixo e regras próprias.",
  "M10-09": "Juntamos o que ficou em aberto nos módulos anteriores. Escolha até 3 ou escreva outro.",
  "M10-10": "Responda para cada prioridade. Isso ajuda a decidir por onde começar.",
  "M10-11": "Ex.: 'Fazer a consulta de viabilidade até sexta; sinal: resposta da prefeitura'. Ou: 'Divulgar no grupo do bairro por 2 semanas; sinal: 5 pedidos'.",
  "M10-12": "Confira antes de salvar. Você pode corrigir qualquer resposta, de qualquer módulo."
 }
};
const TIPOS = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.webp': 'image/webp' };
const servidor = http.createServer((req, res) => {
  const f = path.join(DIR, decodeURIComponent(req.url.split('?')[0]).replace(/\/$/, '/index.html'));
  if (!f.startsWith(DIR) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': TIPOS[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});
let falhas = 0;
function check(nome, ok, extra) {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${nome}${!ok && extra !== undefined ? ' :: ' + JSON.stringify(extra).slice(0, 600) : ''}`);
  if (!ok) falhas++;
}
const nrm = (s) => String(s || '').replace(/\s+/g, ' ').trim();
const CHAVE = 'lg2-turma-b-m10';

/* ---------- 1. dados literais ---------- */
const src = fs.readFileSync(path.join(DIR, 'dados/modulo10.js'), 'utf8');
const ctx = { window: {} }; vm.createContext(ctx); vm.runInContext(src, ctx);
const D = JSON.parse(JSON.stringify(ctx.window.MODULO10));
check('dados: 13 perguntas na ordem da planilha', JSON.stringify(D.perguntas.map((q) => [q.codigo, q.fase, q.pergunta])) === JSON.stringify(ESPERADO.perguntas), D.perguntas.map((q) => q.codigo));
const cams = D.perguntas.flatMap((q) => q.caminhos.map((c) => [q.codigo, c.opcao, c.retorno, c.texto]));
check('dados: 38 caminhos literais (opção, tipo de retorno, mensagem)', JSON.stringify(cams) === JSON.stringify(ESPERADO.caminhos), cams.length);
check('dados: texto de apoio literal', D.perguntas.every((q) => q.apoio === ESPERADO.apoio[q.codigo]));
check('dados: nenhuma ordem ao implementador nos dados públicos', !/rafael/i.test(src));
check('dados: sem códigos de pergunta nas mensagens da tela final', !/M\d+-\d+/.test(JSON.stringify(D.resumo.proximos)));

/* ---------- 2. regras (aba "Cálculos a conferir") ---------- */
const Mo = require(path.join(DIR, 'js/motor.js'));
{
  const it = [
    { tema: 'Preço abaixo do mercado', gravidade: 'alta' },
    { tema: 'Medir o tempo de produção', gravidade: 'media' },
    { tema: 'Fazer a consulta de viabilidade na prefeitura', gravidade: 'media', bloqueia: true },
    { tema: 'Definir a divulgação', gravidade: 'media' },
    { tema: 'Acordo entre sócios', gravidade: 'alta' },
    { tema: 'acordo entre sócios', gravidade: 'baixa' },
  ];
  const l = Mo.prioridades(it).map((x) => x.tema);
  check('Caso: lista de prioridades sem repetição e por gravidade (alta, bloqueia, demais)', JSON.stringify(l) === JSON.stringify(['Preço abaixo do mercado', 'Acordo entre sócios', 'Fazer a consulta de viabilidade na prefeitura', 'Medir o tempo de produção', 'Definir a divulgação']), l);
  const muitos = Array.from({ length: 12 }, (_, i) => ({ tema: 'Item ' + i, gravidade: 'baixa' }));
  check('Caso: lista com até 8 itens', Mo.prioridades(muitos).length === 8);
  const o = Mo.ordenarPorUrgencia(['A', 'B', 'C'], { A: 'piora muito', B: 'fica igual', C: 'piora muito' }, ['C', 'A', 'B']);
  check('Caso: ordem por urgência = A e C (empate pela gravidade da lista), depois B', JSON.stringify(o) === JSON.stringify(['C', 'A', 'B']), o);
  const o2 = Mo.ordenarPorUrgencia(['A', 'B', 'C'], { A: 'piora muito', B: 'fica igual', C: 'piora muito' }, ['A', 'B', 'C']);
  check('Caso: ordem por urgência com A antes de C na lista = A, C, B', JSON.stringify(o2) === JSON.stringify(['A', 'C', 'B']), o2);
  const f = Mo.frasePlano({ acao: 'divulgar no grupo do bairro', data: '2026-11-04', sinal: 'pedidos', numero: '5' });
  check("Caso: frase do plano 'Divulgar no grupo do bairro até [data]; vai funcionar se vierem 5 pedidos.'", f === 'Divulgar no grupo do bairro até 04/11/2026; vai funcionar se vierem 5 pedidos.', f);
  check('Regra: data passada é bloqueada; acima de 90 dias pede passo intermediário', Mo.avaliarData('2026-10-01', '2026-10-21') === 'passada' && Mo.avaliarData('2027-02-01', '2026-10-21') === 'longe' && Mo.avaliarData('2026-11-04', '2026-10-21') === 'ok');
  check('Regra: "Não sei" em prioridades marca as 3 primeiras da lista', JSON.stringify(Mo.tresPrimeiras([{ tema: 'a' }, { tema: 'b' }, { tema: 'c' }, { tema: 'd' }])) === '["a","b","c"]');
}

/* ---------- respostas dos outros módulos (sementes) ---------- */
const HERANCA = {
  'lg2-turma-a-m01': { R: { 'M1.P01': { estado: 'opcao', opcao: 'Já vendo sempre' }, 'M1.P03': { estado: 'valor', valor: 'Bolo de pote' } } },
  'lg2-turma-b-m02': { R: { 'M2.P18': { estado: 'valor', valor: '6' }, 'M2.P11': { estado: 'opcao', opcao: 'Meu bairro' }, 'M2.P17': { estado: 'opcao', opcao: 'Toda semana' } } },
  'lg2-turma-a-m03': { R: { 'M3.P13': { estado: 'opcoes', opcoes: ['Redes sociais (Instagram, Facebook, WhatsApp)'] }, 'M3.P21': { estado: 'valor', valor: 'Bolo fresco entregue no mesmo dia' }, 'M3.P15': { estado: 'valor', valor: 'Doceria da esquina, padaria' } } },
  'lg2-turma-a-m04': { R: { 'M4.P08': { estado: 'valor', valor: 'trabalhadores do bairro' }, 'M4.P12': { estado: 'valor', valor: 'Sobremesa caseira pronta para levar.' }, 'M4.P04': { estado: 'opcao', opcao: 'Retirada presencial pelo cliente' }, 'M4.P19': { estado: 'valor', valor: '10' }, 'M4.P05': { estado: 'valor', valor: 'Três sabores' } } },
  'lg2-turma-a-m05': { versao: 1, R: { 'M5.P36': { estado: 'valor', valor: '12' }, 'M5.P32': { estado: 'opcao', opcao: 'Não' } } },
  'lg2-turma-b-m06': { R: { 'M6.P04': { estado: 'multi', opcoes: ['Pix', 'Dinheiro'] } } },
  /* Módulo 7: até 10 h, apoio até 2 h, 30 min por unidade = no máximo 69 por mês; volume 55 = folga de 14 */
  'lg2-turma-b-m07': { v: 1, ini: { horas: 'Até 10 h', volume: '55', minUn: 30 }, mapa: ['Receber o pedido', 'Fazer', 'Entregar'], R: { 'M7-03': { estado: 'opcao', opcao: 'Até 2 h' }, 'M7-11': { estado: 'multi', opcoes: ['Pedidos entregues no prazo'] } } },
  'lg2-turma-b-m09': { R: { 'M9.P10': { estado: 'opcao', opcao: 'Ainda não fiz' }, 'M9.P09': { estado: 'opcao', opcao: 'Não' } } },
};
const INI = { oferta: 'Bolo de pote', grupo: 'trabalhadores do bairro', proposta: 'Sobremesa caseira pronta para levar.', diferencial: 'Bolo fresco entregue no mesmo dia', estagio: 'Já vendo', canais: 'Redes sociais (Instagram, Facebook, WhatsApp)', preco: '12', entrega: 'Retirada presencial pelo cliente', pagamento: 'Pix, Dinheiro', de: {} };
const NEUTRO = {
  'M10-01': { estado: 'multi', opcoes: ['WhatsApp'] },
  'M10-02': { estado: 'opcao', opcao: 'No mesmo dia' },
  'M10-03': { estado: 'opcao', opcao: 'Sim, sigo passos parecidos' },
  'M10-04': { estado: 'opcao', opcao: 'Sim, peço opinião' },
  'M10-05': { estado: 'opcao', opcao: 'Indicação de quem já comprou' },
  SOCIO: { estado: 'opcao', opcao: 'Sim' },
  'M10-06': { estado: 'opcao', opcao: 'Sim, por escrito' },
  'M10-07': { estado: 'etapas', quem: { 'Receber o pedido': 'Eu', Fazer: 'Eu', Entregar: 'Eu' } },
  'M10-08': { estado: 'opcao', opcao: 'Não' },
  'M10-09': { estado: 'multi', opcoes: [], outro: 'Organizar a agenda', naosei: false },
  'M10-10': { estado: 'escala', u: { 'Organizar a agenda': 'piora muito' } },
  'M10-11': { estado: 'plano', acao: 'a', data: '2099-01-01', sinal: 'b', numero: '1', frase: 'A até 01/01/2099; vai funcionar se vierem 1 b.' },
};
const ORDEM = ['M10-01', 'M10-02', 'M10-03', 'M10-04', 'M10-05', 'SOCIO', 'M10-06', 'M10-07', 'M10-08', 'M10-08a', 'M10-09', 'M10-10', 'M10-11'];
function estadoAte(cod, rExtra) {
  const R = {};
  for (const c of ORDEM) { if (c === cod) break; if (NEUTRO[c]) R[c] = NEUTRO[c]; }
  Object.assign(R, rExtra || {});
  return { v: 2, ini: INI, R, roteiro: null, hist: [], inst: { mensagem: null, checklist: {} }, voltarResumo: false };
}
/* fragmentos literais de um texto com [colchetes]; a parte "[Se …]:" só aparece quando vale */
const fragmentos = (t) => t.replace(/\s*\[Se [^\]]+\]:[\s\S]*$/, '').split(/\[[^\]]*\]/).map((x) => nrm(x).replace(/^[.,:;\s]+|[.,:;\s]+$/g, '')).filter((x) => x.length > 3);

(async () => {
  await new Promise((r) => servidor.listen(0, '127.0.0.1', r));
  const URL = `http://127.0.0.1:${servidor.address().port}/index.html`;
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const erros = [];
  page.on('pageerror', (e) => erros.push(e.message));
  page.on('dialog', (d) => d.accept());
  await page.goto(URL);

  const semear = async (estado, heranca) => {
    await page.evaluate(([e, h, k]) => {
      localStorage.clear();
      Object.entries(h).forEach(([kk, v]) => localStorage.setItem(kk, JSON.stringify(v)));
      if (e) localStorage.setItem(k, JSON.stringify(e));
    }, [estado, heranca || HERANCA, CHAVE]);
    await page.reload();
  };
  const clicar = async (t) => {
    const ok = await page.evaluate((t) => { const b = [...document.querySelectorAll('button')].find((x) => x.textContent.replace(/\s+/g, ' ').trim() === t); if (b) { b.click(); return true; } return false; }, t);
    if (!ok) throw new Error('botão não encontrado: ' + t);
    await page.waitForTimeout(60);
  };
  const abrir = async (cod, rExtra, heranca) => {
    await semear(estadoAte(cod, rExtra), heranca);
    await clicar('Continuar de onde parei');
  };
  const titulo = () => page.evaluate(() => document.querySelector('.q').innerText);
  const blocos = (sel) => page.evaluate((s) => [...document.querySelectorAll(s + ' .bloco')].map((b) => b.innerText.replace(/\s+/g, ' ').trim()), sel || '#retorno');
  const temTexto = (bs, t) => fragmentos(t).every((f) => bs.some((b) => b.includes(f)));
  const caminhoTexto = (cod, op) => D.perguntas.find((q) => q.codigo === cod).caminhos.find((c) => c.opcao === op).texto;
  async function confere(nome, cod, op, n, sel) {
    const bs = await blocos(sel);
    check(`Caminho ${cod} · ${op}`, temTexto(bs, caminhoTexto(cod, op)) && bs.length === (n || 1), { nome, bs });
  }

  /* ---------- 3. cada linha de "Caminhos por resposta" ---------- */
  let alcancadas = 0;
  const conta = () => alcancadas++;
  /* M10-01 */
  await abrir('M10-01');
  check('M10-01: [canais de venda] vem do Módulo 3', (await titulo()) === 'Além de redes sociais (Instagram, Facebook, WhatsApp), por onde os clientes falam com você?', await titulo());
  await clicar('WhatsApp'); await confere('', 'M10-01', ESPERADO.caminhos[0][1]); conta();
  await clicar('Ainda não falo com clientes'); await confere('', 'M10-01', 'Ainda não falo com clientes'); conta();
  check('M10-01: [onde procuram] vem do Módulo 2', (await blocos()).join(' ').includes('(meu bairro)'));
  await clicar('Não sei'); await confere('', 'M10-01', 'Não sei'); conta();
  /* escolhas únicas: cada opção da linha mostra a mensagem da linha */
  const UNICAS = {
    'M10-02': ['Em até 1 hora / No mesmo dia', 'Em 1 ou 2 dias', 'Mais de 2 dias', 'Ainda não vendo / Não sei'],
    'M10-03': ['Sim, sigo passos parecidos', 'Depende do cliente', 'Ainda não vendi', 'Não sei'],
    'M10-04': ['Sim, peço opinião / Sim, ofereço de novo', 'Não, só se o cliente me procura', 'Ainda não vendi / Não sei'],
    'M10-05': ['Indicação de quem já comprou / Redes sociais próprias / Grupos de mensagem / Cartaz ou panfleto no bairro / Parceria com outro negócio', 'Anúncio pago', 'Ainda não sei'],
    'M10-06': ['Sim, por escrito', 'Só combinamos de boca / Ainda não', 'Não sei'],
    'M10-08': ['Não', 'Sim, para produzir ou atender / para vender ou divulgar / para tarefas administrativas', 'Não sei'],
  };
  for (const [cod, linhas] of Object.entries(UNICAS)) {
    await abrir(cod);
    for (const linha of linhas) {
      const ops = linha.split(' / ').map((x) => (/^para /.test(x) ? 'Sim, ' + x : x));
      for (const op of ops) {
        await clicar(op);
        /* contratar com folga no Módulo 7: a observação do cruzamento vem junto (2 caixas) */
        await confere(op, cod, linha, cod === 'M10-08' && op.startsWith('Sim') ? 2 : 1);
      }
      conta();
    }
  }
  /* M10-02 "Em 1 ou 2 dias" com tempo de apoio alto no Módulo 7: a parte condicional aparece */
  const h7 = JSON.parse(JSON.stringify(HERANCA)); h7['lg2-turma-b-m07'].R['M7-03'] = { estado: 'opcao', opcao: 'De 6 a 10 h' };
  await abrir('M10-02', {}, h7); await clicar('Em 1 ou 2 dias');
  check('M10-02: [Se tempo de apoio alto no M7] aparece só quando vale', (await blocos()).join(' ').includes('isso também pesa no seu tempo de apoio'));
  await abrir('M10-02'); await clicar('Em 1 ou 2 dias');
  check('M10-02: sem apoio alto, a parte condicional não aparece', !(await blocos()).join(' ').includes('tempo de apoio'));
  /* M10-03: texto de apoio com pessoas ouvidas e roteiro pré-montado */
  await abrir('M10-03');
  const ap3 = await page.evaluate(() => document.querySelector('.ajuda').innerText);
  check('M10-03: apoio com [pessoas ouvidas] e [etapas] do roteiro', ap3.startsWith('Você já ouviu 6 pessoas no Módulo 2.') && ap3.includes('Preço: R$ 12') && ap3.includes('Receber: pix, dinheiro'), ap3);
  /* M10-04: apoio condicional (compra recorrente no Módulo 2) */
  await abrir('M10-04');
  check('M10-04: [Se compra recorrente no Módulo 2] com [frequência]', (await page.evaluate(() => document.querySelector('.ajuda').innerText)) === 'Você disse que o cliente compra toda semana. Voltar a falar pode trazer a próxima venda.');
  /* M10-05: [oferta em foco] e [diferencial do Módulo 3] */
  await abrir('M10-05');
  check('M10-05: pergunta e apoio preenchidos', (await titulo()).includes('saber que Bolo de pote existe') && (await page.evaluate(() => document.querySelector('.ajuda').innerText)).includes('diferencial: Bolo fresco entregue no mesmo dia.'));
  /* M10-07 */
  await abrir('M10-07');
  check('M10-07: as etapas vêm do mapa do Módulo 7', (await page.evaluate(() => [...document.querySelectorAll('#ent p.rot-campo')].map((x) => x.innerText))).join('|') === 'Receber o pedido|Fazer|Entregar');
  const porEtapa = async (idx) => page.evaluate((idx) => { [...document.querySelectorAll('#ent .opcoes')].forEach((g, i) => g.querySelectorAll('.opcao')[idx[i]].click()); }, idx);
  await porEtapa([0, 0, 0]); await page.waitForTimeout(60); await confere('', 'M10-07', ESPERADO.caminhos.find((c) => c[0] === 'M10-07')[1]); conta();
  await porEtapa([0, 0, 3]); await page.waitForTimeout(60); await confere('', 'M10-07', "'Ninguém ainda' em alguma etapa"); conta();
  /* M10-08: capacidade curta no Módulo 7 (volume 100) */
  const hc = JSON.parse(JSON.stringify(HERANCA)); hc['lg2-turma-b-m07'].ini.volume = '100';
  await abrir('M10-08', {}, hc);
  check('M10-08: [Se capacidade curta no Módulo 7] com [N] e [volume]', (await page.evaluate(() => document.querySelector('.ajuda').innerText)) === 'Com o tempo informado, cabem cerca de 69 por mês, e você pretende 100 por mês.');
  await abrir('M10-08'); await clicar('Sim, para vender ou divulgar');
  check("Caso: contratar com folga = 'Com o tempo informado, ainda cabem cerca de 14 por mês.'", (await blocos()).some((b) => b.includes('Com o tempo informado, ainda cabem cerca de 14 por mês.')));
  check('Caso: contratar com folga, sem dizer "não contrate"', !(await blocos()).join(' ').toLowerCase().includes('não contrate'));
  /* M10-08a */
  await abrir('M10-08a', { 'M10-08': { estado: 'opcao', opcao: 'Sim, para produzir ou atender' } });
  await clicar('Menos variedade de opções'); await clicar('Rever o tempo de apoio');
  const b8a = await blocos();
  check('Caminho M10-08a · Uma ou mais (+ M4 e M7 juntos)', temTexto(b8a, caminhoTexto('M10-08a', ESPERADO.caminhos.find((c) => c[0] === 'M10-08a')[1])) && b8a.length === 3 && b8a[1].includes('Três sabores') && b8a[2].includes('Até 2 h'), b8a); conta();
  await clicar('Ainda nenhuma');
  check('M10-08a: "Ainda nenhuma" desmarca as outras', (await page.evaluate(() => [...document.querySelectorAll('#ent .opcao.sel')].map((x) => x.innerText))).join() === 'Ainda nenhuma');
  /* M10-09: lista vinda do percurso */
  const h9 = JSON.parse(JSON.stringify(HERANCA));
  h9['lg2-turma-b-m07'].R['M7-02'] = { estado: 'naosei' };
  h9['lg2-turma-a-m05'].R['M5.P36'] = { estado: 'naosei' };
  await abrir('M10-09', { 'M10-02': { estado: 'opcao', opcao: 'Mais de 2 dias' }, 'M10-05': { estado: 'opcao', opcao: 'Ainda não sei' }, 'M10-06': { estado: 'opcao', opcao: 'Ainda não' } }, h9);
  const lista = await page.evaluate(() => [...document.querySelectorAll('#ent .opcao')].map((x) => x.innerText.trim()));
  check('M10-09: lista do percurso por gravidade, sem códigos', JSON.stringify(lista) === JSON.stringify(['Definir o preço de venda', 'Acordo entre sócios', 'Fazer a consulta de viabilidade na prefeitura', 'Medir o tempo de produção', 'Tempo de resposta aos clientes', 'Definir a divulgação', 'Completar a resposta “Não sei” do Módulo 5', 'Completar a resposta “Não sei” do Módulo 7']) && !/M\d/.test(lista.join()), lista);
  await clicar(lista[0]); await confere('', 'M10-09', 'Até 3 itens da lista'); conta();
  await clicar(lista[1]); await clicar(lista[2]); await clicar(lista[3]);
  check('M10-09: a 4ª escolha não entra', (await page.evaluate(() => document.querySelectorAll('#ent .opcao.sel').length)) === 3);
  await confere('', 'M10-09', 'Mais de 3'); conta();
  await clicar('Não sei'); await confere('', 'M10-09', 'Não sei'); conta();
  check('M10-09: "Não sei" marca as 3 primeiras', JSON.stringify(await page.evaluate(() => [...document.querySelectorAll('#ent .opcao.sel')].map((x) => x.innerText.trim()))) === JSON.stringify(lista.slice(0, 3)));
  await clicar(lista[2]); await page.fill('#outro', 'Organizar a agenda'); await clicar('Continuar');
  await confere('', 'M10-09', 'Outro (texto)'); conta();
  await clicar('Continuar');
  /* M10-10 com as três escolhidas */
  check('M10-10: uma escala por prioridade', (await page.evaluate(() => [...document.querySelectorAll('#ent p.rot-campo')].map((x) => x.innerText))).join('|') === [lista[0], lista[1], 'Organizar a agenda'].join('|'));
  await page.evaluate(() => { const gs = [...document.querySelectorAll('#ent .opcoes')]; gs[0].querySelectorAll('.opcao')[2].click(); gs[1].querySelectorAll('.opcao')[0].click(); gs[2].querySelectorAll('.opcao')[0].click(); });
  await page.waitForTimeout(60);
  check('Caminho M10-10 · A mais urgente: piora muito, empate pela ordem da lista', (await blocos()).join() === 'A mais urgente parece ser: Acordo entre sócios.', await blocos()); conta();
  await clicar('Continuar');
  /* M10-11 */
  const hoje = await page.evaluate(() => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10));
  const dias = (n) => new Date(Date.parse(hoje) + n * 864e5).toISOString().slice(0, 10);
  check('M10-11: mostra a prioridade mais urgente', (await page.evaluate(() => document.querySelector('#ent .bloco').innerText)).includes('Acordo entre sócios'));
  const plano = async (a, d, s, n) => { await page.fill('#acao', a); await page.fill('#data', d); await page.fill('#sinal', s); await page.fill('#numero', n); await clicar('Continuar'); };
  await plano('conversar com o sócio', dias(-3), 'acordo assinado', '1'); await confere('', 'M10-11', 'Data inválida (passada)'); conta();
  check('M10-11: data passada não avança', (await titulo()).startsWith('Para a prioridade'));
  await plano('conversar com o sócio', dias(10), 'acordo assinado', ''); await confere('', 'M10-11', 'Sem número', 1);
  const sug = await page.evaluate(() => document.querySelector('#retorno').innerText);
  check('Caso: plano sem número = pergunta gentil com o critério do teste (Módulo 4), sem bloquear', sug.includes('você combinou: 10') && sug.includes('pedidos entregues no prazo'), sug); conta();
  await clicar('Continuar');
  check('M10-11: segue sem número no segundo toque', (await blocos()).join(' ').startsWith('Seu plano:'));
  await abrir('M10-11', { 'M10-09': { estado: 'multi', opcoes: [], outro: 'Organizar a agenda' } });
  await plano('divulgar no grupo do bairro', dias(120), 'pedidos', '5'); await confere('', 'M10-11', 'Data acima de 90 dias'); conta();
  await plano('divulgar no grupo do bairro', dias(14), 'pedidos', '5');
  const frase = `Divulgar no grupo do bairro até ${dias(14).split('-').reverse().join('/')}; vai funcionar se vierem 5 pedidos`;
  check('Caminho M10-11 · completo: "Seu plano: [frase]."', (await blocos()).join() === `Seu plano: ${frase}. Combine com você mesmo de olhar o resultado nessa data.`, await blocos()); conta();
  await abrir('M10-11', { 'M10-09': { estado: 'multi', opcoes: [], outro: 'Organizar a agenda' } });
  await clicar('Não sei'); await confere('', 'M10-11', 'Não sei'); conta();
  /* M10-12 (tela final) */
  await semear(estadoAte('FIM'));
  await clicar('Continuar de onde parei');
  await clicar('Sim, salvar'); await confere('', 'M10-12', 'Sim, salvar', 1, '#ret12'); conta();
  check('M10-12: sem "[Se houver ofertas guardadas]" (o Módulo 1 não guarda outras ofertas)', !(await blocos('#ret12')).join().includes('próxima oferta'));
  await clicar('Quero corrigir algo'); await confere('', 'M10-12', 'Quero corrigir algo', 1, '#ret12'); conta();
  check('M10-12: lista "Corrigir minha resposta"', (await page.evaluate(() => document.querySelectorAll('#corr .editar').length)) === ORDEM.length - 1 + 1);
  check(`Caminhos alcançados: ${alcancadas} de ${ESPERADO.caminhos.length}`, alcancadas === ESPERADO.caminhos.length, alcancadas);

  /* ---------- 4. cruzamentos e encaminhamento no resumo ---------- */
  const resumo = async (r, h) => { await semear(estadoAte('FIM', r), h); await clicar('Continuar de onde parei'); return page.evaluate(() => document.querySelector('.corpo').innerText.replace(/\s+/g, ' ')); };
  let t = await resumo({ 'M10-05': { estado: 'opcao', opcao: 'Anúncio pago' } });
  check('Caso: anúncio pago sem gasto no Módulo 5 = pergunta gentil', t.includes('PERGUNTA GENTIL') && t.includes('O anúncio não aparece nos seus gastos. Quer incluir?'));
  const hg = JSON.parse(JSON.stringify(HERANCA)); hg['lg2-turma-a-m05'].R['M5.P33'] = { estado: 'valor', valor: [{ nome: 'Anúncio no Instagram', valor: '50' }] };
  t = await resumo({ 'M10-05': { estado: 'opcao', opcao: 'Anúncio pago' } }, hg);
  check('Anúncio pago com gasto de anúncio no Módulo 5 = sem pergunta', !t.includes('O anúncio não aparece'));
  t = await resumo({ 'M10-06': { estado: 'opcao', opcao: 'Ainda não' } });
  const enc = await page.evaluate(() => [...document.querySelectorAll('.b-enc')].map((x) => x.innerText.trim()));
  check('Caso: sócio sem acordo = observação + um encaminhamento só no resumo', t.includes('Combinar por escrito antes de investir juntos evita desentendimentos.') && enc.length === 1 && enc[0] === 'Para a forma do documento, procure um contador ou advogado.', enc);
  check('Resumo: checklist de acordo entre sócios com os 5 itens', (await page.evaluate(() => document.querySelectorAll('.chk input').length)) === 5);
  t = await resumo({ 'M10-01': { estado: 'opcao', opcao: 'Ainda não falo com clientes' }, 'M10-04': { estado: 'opcao', opcao: 'Não, só se o cliente me procura' }, 'M10-02': { estado: 'opcao', opcao: 'Mais de 2 dias' } });
  check('Cruzamentos: vende sem canal; recorrente sem pós-venda; resposta lenta com concorrente', t.includes('Você já vende, mas não marcou por onde fala com clientes. Quer rever?') && t.includes('Seu cliente compra toda semana.') && t.includes('Quem espera muito pode comprar de Doceria da esquina ou de outra pessoa.'));
  check('Resumo: no máximo 3 alertas', (await page.evaluate(() => { const s = [...document.querySelectorAll('section.cartao')].find((x) => x.querySelector('h3').innerText === 'Pontos para conferir'); return s ? s.querySelectorAll('.bloco').length : 0; })) === 3);
  check('Resumo: retrato com uma linha por módulo (1 a 9)', (await page.evaluate(() => document.querySelectorAll('.retrato').length)) === 9);
  check('Resumo: sem "Turma B", sem versão e sem "salvas apenas neste navegador"', !/Turma B|vers[aã]o \d|apenas neste navegador/i.test(t));
  check('Resumo: botão de volta aos módulos (.lg2-proximo) visível', await page.isVisible('.lg2-proximo a'));

  /* ---------- 5. percurso inteiro, com dados herdados ---------- */
  await semear(null);
  if (process.env.SHOTS) fs.mkdirSync(process.env.SHOTS, { recursive: true });
  const foto = async (n) => { if (process.env.SHOTS) { await page.waitForTimeout(350); await page.screenshot({ path: path.join(process.env.SHOTS, n + '.png'), fullPage: n.includes('resultado') }); } };
  await foto('m10_capa');
  await clicar('Começar');
  const partida = await page.evaluate(() => Object.fromEntries([...document.querySelectorAll('[data-campo]')].map((i) => [i.dataset.campo, i.value])));
  check('Partida: dados herdados dos Módulos 1, 3, 4, 5 e 6', partida.oferta === 'Bolo de pote' && partida.proposta === 'Sobremesa caseira pronta para levar.' && partida.preco === '12' && partida.pagamento === 'Pix, Dinheiro' && partida.canais.startsWith('Redes sociais'), partida);
  check('Partida: selo "Veio do Módulo N"', (await page.evaluate(() => document.querySelectorAll('.veio').length)) >= 8);
  await foto('m10_partida');
  await clicar('Continuar');
  const passos = [];
  for (let i = 0; i < 20; i++) {
    if (await page.$('#q12')) break;
    const q = await titulo(); passos.push(q);
    if (/falam com você/.test(q)) { await clicar('WhatsApp'); await foto('m10_pergunta'); }
    else if (/Em quanto tempo/.test(q)) await clicar('No mesmo dia');
    else if (/sequência/.test(q)) { await clicar('Depende do cliente'); await foto('m10_roteiro'); }
    else if (/Depois da entrega/.test(q)) await clicar('Sim, peço opinião');
    else if (/vão saber/.test(q)) await clicar('Grupos de mensagem');
    else if (/sócio\?/.test(q)) await clicar('Não');
    else if (/Quem cuida/.test(q)) await porEtapa([0, 0, 3]);
    else if (/contratar alguém/.test(q)) await clicar('Não');
    else if (/mais urgentes/.test(q)) { await page.evaluate(() => [...document.querySelectorAll('#ent .opcao')].slice(0, 2).forEach((b) => b.click())); await foto('m10_prioridades'); }
    else if (/esperar 3 meses/.test(q)) await page.evaluate(() => [...document.querySelectorAll('#ent .opcoes')].forEach((g, i) => g.querySelectorAll('.opcao')[i].click()));
    else if (/prioridade mais urgente/.test(q)) { await plano('fazer a consulta de viabilidade', dias(7), 'resposta da prefeitura', '1'); await foto('m10_plano'); }
    await page.waitForTimeout(60);
    await clicar('Continuar');
  }
  check('Percurso: sócio "Não" pula o acordo; contratar "Não" pula as alternativas', passos.length === 11 && !passos.some((x) => /combinaram|outras formas/.test(x)), passos);
  await foto('m10_resultado');
  const r1 = await page.evaluate(() => document.querySelector('.corpo').innerText.replace(/\s+/g, ' '));
  check('Resultado: plano com a frase e prioridades', r1.includes('Fazer a consulta de viabilidade até') && r1.includes('vai funcionar se vierem 1 resposta da prefeitura.'));
  check('Resultado: roteiro "base" com pós-venda', r1.includes('Roteiro de venda (base)') && r1.includes('Depois da entrega: pedir a opinião do cliente'));
  check('Resultado: etapa sem responsável vira prioridade na lista seguinte', r1.includes('Entregar: Ninguém ainda'));
  await page.reload();
  check('Recarregar: retoma no resultado', (await page.evaluate(() => document.querySelector('#ir').innerText)) === 'Continuar de onde parei');
  await clicar('Continuar de onde parei');
  check('Recarregar: o resultado volta igual', (await page.evaluate(() => document.querySelector('.corpo').innerText.replace(/\s+/g, ' '))) === r1);
  /* corrigir uma resposta e voltar ao resumo */
  await clicar('Quero corrigir algo');
  await page.evaluate(() => [...document.querySelectorAll('.editar')].find((b) => b.closest('.corr-item').innerText.includes('Em quanto tempo')).click());
  await clicar('Mais de 2 dias'); await clicar('Continuar');
  check('Corrigir: volta direto ao resumo com a resposta nova', (await page.$('#q12')) && (await page.evaluate(() => document.querySelector('.corpo').innerText)).includes('Mais de 2 dias'));
  /* estado salvo da versão anterior (sem v: 2) é descartado */
  await page.evaluate((k) => { localStorage.setItem(k, JSON.stringify({ R: { 'M10.P01': { estado: 'opcao', opcao: 'Até 1 hora' } }, hist: [] })); }, CHAVE);
  await page.reload();
  check('Versão: respostas da versão anterior são descartadas', (await page.evaluate(() => document.querySelector('#ir').innerText)) === 'Começar');
  /* recomeçar */
  await semear(estadoAte('FIM'));
  await clicar('Continuar de onde parei'); await clicar('Recomeçar do zero');
  check('Recomeçar: apaga só o Módulo 10', (await page.evaluate((k) => localStorage.getItem(k) === null && localStorage.getItem('lg2-turma-b-m07') !== null, CHAVE)));
  check('Nunca escreve nas chaves dos outros módulos', (await page.evaluate((h) => Object.entries(h).every(([k, v]) => localStorage.getItem(k) === JSON.stringify(v)), HERANCA)));

  check('Sem erros de JavaScript', erros.length === 0, erros);
  await browser.close();
  servidor.close();
  console.log(falhas ? `\n${falhas} FALHA(S)` : '\nTUDO OK');
  process.exit(falhas ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
