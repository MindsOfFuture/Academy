/* Módulo 10 (Turma B) contra a planilha "Modulo_10_Perguntas_e_Caminhos.xlsx" do Grupo 10.
   Execute: PW=<caminho do pacote playwright> node tests/lg2-m10.cjs   (SHOTS=<pasta> grava prints 390x844)
   ESPERADO foi copiado da planilha (abas "Passo a passo" e "Caminhos por resposta"); roda sem a planilha.
   CAPA_PDF veio do PDF "Módulo 10 - Versão 2910" (capa: Para quem é, O que ter em mãos, O que você recebe no final).
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
const CAPA_PDF = {
 "nome": "Vendas, pessoas e plano de ação",
 "objetivo": "Ao final da etapa, o usuário será capaz de organizar sua mensagem de vendas, mapear seus canais de atendimento, identificar gargalos de rotina, analisar a necessidade de sociedade ou contratação e definir as prioridades mais urgentes do negócio. Também poderá elaborar um plano de ação focado para resolver os principais problemas.",
 "para_quem": "Destinado para pessoas que desejam estruturar a operação e a comunicação de um pequeno negócio. Geralmente, esses usuários chegam à etapa com dificuldades para explicar o que vendem, lidar com clientes nos diversos canais, organizar o tempo entre a operação e a gestão, e tomar decisões sobre sociedade e contratação. A etapa busca ajudá-los a analisar essas informações e priorizar ações imediatas.",
 "ter_em_maos": "O usuário precisa ter em mente ou anotado como realiza o seu atendimento hoje, os canais que utiliza, as dificuldades que enfrenta na rotina diária e as expectativas sobre parcerias ou contratações.",
 "entrega": "Ao final, a etapa entrega um diagnóstico sobre a comunicação, rotina e necessidades de equipe, além de um resumo com os 3 problemas mais urgentes e próximos passos para compor um plano de ação direcionado."
};
const ESPERADO = {
 "perguntas": [
  [
   "M10-01",
   "Como você vende",
   "Além de [canais de venda], por onde falam os clientes?"
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
   "Vocês já combinaram por escrito como dividem o trabalho, o dinheiro e o resultado?"
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
   "Quais 3 pontos são mais urgentes agora?"
  ],
  [
   "M10-10",
   "Seu plano",
   "O que pode acontecer após 3 meses sem agir?"
  ],
  [
   "M10-11",
   "Seu plano",
   "Para sua prioridade mais urgente: o que fazer, até quando e como saber se deu certo?"
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
   "Pense em por onde o seu cliente prefere falar: a Etapa 2 mostrou onde ele procura ([onde procuram])."
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
   "Confira o roteiro. Ele usa o que você já respondeu nas outras etapas."
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
   "Anote o que os clientes dizem: isso alimenta o seu padrão de qualidade (Etapa 7)."
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
   "Anúncio pago é um gasto. Confira se ele entrou nos seus gastos da Etapa 5 e defina um limite antes de começar."
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
  "M10-03": "Você já ouviu [pessoas ouvidas] pessoas na Etapa 2. Montamos um roteiro com o que você respondeu: [etapas]. Confira.",
  "M10-04": "[Se compra recorrente no Módulo 2]: Você disse que o cliente compra [frequência]. Voltar a falar pode trazer a próxima venda.",
  "M10-05": "Escolha a principal. A mensagem pode partir do seu diferencial: [diferencial do Módulo 3].",
  "M10-06": "Você disse na Etapa 8 que terá sócio. Combinar antes evita desentendimentos depois.",
  "M10-07": "Passos do seu mapa do processo (Etapa 7) que ainda estão sem responsável: [etapas].",
  "M10-08": "[Se capacidade curta no Módulo 7]: Com o tempo informado, cabem cerca de [N] por mês, e você pretende [volume].",
  "M10-08a": "Marque as que você já pensou. Contratar tem custo fixo e regras próprias.",
  "M10-09": "Juntamos o que ficou em aberto nas etapas anteriores. Escolha até 3 ou escreva outro.",
  "M10-10": "Responda para cada prioridade. Isso ajuda a decidir por onde começar.",
  "M10-11": "Ex.: 'Fazer a consulta de viabilidade até sexta; sinal: resposta da prefeitura'. Ou: 'Divulgar no grupo do bairro por 2 semanas; sinal: 5 pedidos'.",
  "M10-12": "Confira antes de salvar. Você pode corrigir qualquer resposta, de qualquer etapa."
 }
};
const TIPOS = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.webp': 'image/webp' };
const servidor = http.createServer((req, res) => {
  const f = path.join(DIR, decodeURIComponent(req.url.split('?')[0]).replace(/\/$/, '/index.html'));
  if (!f.startsWith(DIR) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': TIPOS[path.extname(f)] || 'application/octet-stream' });
  /* sabotagem (M10_SABOTAGEM=1): o "Não sei" volta a valer como resposta; o teste tem de falhar */
  /* sabotagem do item A (M10_SABOTAGEM_A=1): volta o passo extra (1º toque só mostra o retorno, 2º avança); o teste tem de falhar */
  if (process.env.M10_SABOTAGEM_A && f.endsWith(path.join('js', 'app.js'))) return res.end(fs.readFileSync(f, 'utf8').replace('p.querySelector("#ok").onclick = () => { const r0 = coletar(); if (r0) avancar(r0); };', 'let _sab = false; p.querySelector("#ok").onclick = () => { const r0 = coletar(); if (!r0) return; if (!_sab) { _sab = true; return; } avancar(r0); };'));
  /* sabotagem do B6 (M10_SABOTAGEM_B6=1): volta o lc() antigo e a oferta inteira no enunciado */
  if (process.env.M10_SABOTAGEM_B6 && f.endsWith(path.join('js', 'app.js'))) return res.end(fs.readFileSync(f, 'utf8').replace('const lc = (s) => String(s || "").split(/,\\s*(?![^()]*\\))/).map(minusc).join(", ");', 'const lc = (s) => String(s || "").split(/,\\s*(?![^()]*\\))/).map((x) => x.charAt(0).toLowerCase() + x.slice(1)).join(", ");').replace('{ "[oferta em foco]": ofertaNaFrase() }', '{ "[oferta em foco]": oferta() || "o que você vende" }'));
  /* sabotagem do lote 17/11 (M10_SABOTAGEM_1117=1): sem cartão da Etapa 3, sem ajuda da Etapa 7, retorno único da planilha na M10-05 */
  if (process.env.M10_SABOTAGEM_1117 && f.endsWith(path.join('js', 'app.js'))) return res.end(fs.readFileSync(f, 'utf8').replace('cod === "M10-05" && hoje05() ?', 'false ?').replace('const h05 = cod === "M10-05" ? hoje05() : null;', 'const h05 = null;').split('const a7 = ajuda7();').join('const a7 = null;').replace('const ret1 = (o) => (cod === "M10-05" && caixa05(o)) || caixa(caminho(cod, o));', 'const ret1 = (o) => caixa(caminho(cod, o));'));
  if (process.env.M10_SABOTAGEM && f.endsWith(path.join('js', 'app.js'))) return res.end(fs.readFileSync(f, 'utf8').replace('if (o === NS) { op = null; pediuNS = true; return ajudaNS(); }', 'if (o === NS) { op = "Ainda não sei"; ajudaNS(); return; }'));
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
check('dados: 13 perguntas na ordem e textos leves', JSON.stringify(D.perguntas.map((q) => [q.codigo, q.fase, q.pergunta])) === JSON.stringify(ESPERADO.perguntas), D.perguntas.map((q) => [q.codigo,q.pergunta]));
  const ajudaCodigos = [...D.perguntas.filter(q => q.codigo !== 'M10-12' && q.opcoes?.some(o => /não sei/i.test(typeof o === 'string' ? o : o.texto || ''))).map(q=>q.codigo), 'SOCIO'];
  check('dados: toda pergunta com Não sei tem 2 passos e prompt sem marca', ajudaCodigos.every(c => { const q = c === 'SOCIO' ? D.socio : D.perguntas.find(x=>x.codigo===c); return q.comoDescobrir?.length === 2 && q.promptIA && !/chatgpt|gemini/i.test(q.promptIA); }), ajudaCodigos);
  check('dados: instruções curtas disponíveis', D.perguntas.filter(q=>q.instrucao).length >= 5);
const cams = D.perguntas.flatMap((q) => q.caminhos.map((c) => [q.codigo, c.opcao, c.retorno, c.texto]));
const camsEsperados = ESPERADO.caminhos.map((x) => { const y=x.slice(); if (['M10-02','M10-05','M10-06','M10-08'].includes(y[0]) && y[2] === 'Atenção') y[2]='Dica'; return y; });
check('dados: caminhos; orientação geral não aparece como alerta', JSON.stringify(cams) === JSON.stringify(camsEsperados), cams.length);
check('dados: capa literal do PDF v2910 (objetivo, para quem é, o que ter em mãos, o que recebe)', D.modulo.nome === CAPA_PDF.nome && ['objetivo', 'para_quem', 'ter_em_maos', 'entrega'].every((k) => D.capa[k] === CAPA_PDF[k]), D.capa);
check('dados: textos de apoio literal ou orientação geral movida à dica', D.perguntas.every((q) => { const a=ESPERADO.apoio[q.codigo]; return q.apoio === a || (['M10-02','M10-05','M10-06','M10-08','M10-08a'].includes(q.codigo) && q.apoio.startsWith(a)); }));
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
  /* frase montada: o sinal escrito nunca ocupa o lugar da unidade; concordância; pedaço vazio some */
  const fp = (o) => Mo.frasePlano(Object.assign({ acao: 'divulgar no grupo', data: '2026-11-04' }, o));
  check('Frase do plano: \"1.500\" + sinal \"Juiz de Fora\" não vira \"vierem 1.500 Juiz de Fora\"', fp({ sinal: 'Juiz de Fora', numero: '1.500' }) === 'Divulgar no grupo até 04/11/2026; sinal de que funcionou: Juiz de Fora (meta: 1.500).', fp({ sinal: 'Juiz de Fora', numero: '1.500' }));
  check('Frase do plano: unidade escolhida e singular (\"vier 1 venda\")', fp({ numero: '1', unidade: 'vendas' }) === 'Divulgar no grupo até 04/11/2026; vai funcionar se vier 1 venda.' && fp({ numero: '12', unidade: 'clientes novos' }) === 'Divulgar no grupo até 04/11/2026; vai funcionar se vierem 12 clientes novos.', [fp({ numero: '1', unidade: 'vendas' }), fp({ numero: '12', unidade: 'clientes novos' })]);
  check('Frase do plano: sinal + número + unidade; sem número e sem sinal = só ação e data', fp({ sinal: 'resposta da prefeitura', numero: '1', unidade: 'respostas' }) === 'Divulgar no grupo até 04/11/2026; sinal de que funcionou: resposta da prefeitura (meta: 1 resposta).' && fp({}) === 'Divulgar no grupo até 04/11/2026.', [fp({ sinal: 'resposta da prefeitura', numero: '1', unidade: 'respostas' }), fp({})]);
  check('Número: \"1.500\" = 1500 (ponto de milhar), \"1,5\" = 1,5', Mo.num('1.500') === 1500 && Mo.num('1,5') === 1.5 && Mo.num('12.5') === 12.5);
  check('Regra: data passada é bloqueada; acima de 90 dias pede passo intermediário', Mo.avaliarData('2026-10-01', '2026-10-21') === 'passada' && Mo.avaliarData('2027-02-01', '2026-10-21') === 'longe' && Mo.avaliarData('2026-11-04', '2026-10-21') === 'ok');
  check('Regra: "Não sei" em prioridades marca as 3 primeiras da lista', JSON.stringify(Mo.tresPrimeiras([{ tema: 'a' }, { tema: 'b' }, { tema: 'c' }, { tema: 'd' }])) === '["a","b","c"]');
  /* lote 3 (Gaby, Arthur): "Por onde começar" = 3 ações em ordem; prioridades da pessoa primeiro, depois pontos para conferir e lacunas */
  const LAC = [{ tema: 'Fazer a consulta de viabilidade na prefeitura', gravidade: 'alta', modulo: 9 }, { tema: 'Saber quanto dinheiro você tem para começar', gravidade: 'media', modulo: 6 }, { tema: 'Rever uma resposta “Não sei” da Etapa 3', gravidade: 'baixa', modulo: 3 }];
  { /* cenário 1: a pessoa marcou o preço como prioridade (Gaby) */
    const a = Mo.porOndeComecar({ estagio: 'comeca', prioridades: ['Definição dos preços'], conferir: [{ chave: 'limite', detalhe: 'Os gastos previstos passam do que você disse na Etapa 1 que pode usar (até R$ 100).' }], lacunas: LAC });
    check('Por onde começar (prioridade preço): 3 ações; a 1ª é o preço, com a ação e a etapa', a.length === 3 && a[0].chave === 'preco' && a[0].origem === 'prioridade' && a[0].modulo === 5 && a[0].texto.startsWith('Refaça a conta do preço na Etapa 5'), a);
    check('Por onde começar (prioridade preço): depois o ponto para conferir e a lacuna mais grave', a[1].chave === 'limite' && a[1].origem === 'conferir' && a[1].detalhe.includes('até R$ 100') && a[2].chave === 'viabilidade' && a[2].origem === 'lacuna', a);
    const b = Mo.porOndeComecar({ estagio: 'comeca', prioridades: ['Definir o preço de venda'], conferir: [{ chave: 'preco', detalhe: 'Seu preço (R$ 8) está abaixo do custo de uma unidade (R$ 10).' }], lacunas: [] });
    check('Por onde começar: preço marcado + preço abaixo do custo = uma ação só, com o aviso junto', b.filter((x) => x.chave === 'preco').length === 1 && b[0].detalhe.startsWith('Seu preço (R$ 8) está abaixo do custo') && b[0].origem === 'prioridade', b);
  }
  { /* cenário 2: lacunas, sem prioridade marcada */
    const a = Mo.porOndeComecar({ estagio: 'comeca', prioridades: [], conferir: [{ chave: 'vigilancia', detalhe: 'x' }, { chave: 'preco', detalhe: 'y' }], lacunas: LAC });
    check('Por onde começar (lacunas sem prioridade): pontos para conferir na ordem, depois a lacuna alta', JSON.stringify(a.map((x) => x.chave)) === '["vigilancia","preco","viabilidade"]' && a.every((x) => x.origem !== 'prioridade'), a);
    const c = Mo.porOndeComecar({ estagio: 'comeca', prioridades: [], conferir: [], lacunas: LAC });
    check('Por onde começar (lacunas sem prioridade): alta, depois média; "Não sei" leve só completa com ações do estágio', JSON.stringify(c.map((x) => x.chave)) === '["viabilidade","caixa","vendas"]' && c[1].modulo === 6 && c[2].origem === 'estagio', c);
  }
  { /* cenário 3: nada em aberto */
    const v = Mo.porOndeComecar({ estagio: 'vende', prioridades: [], conferir: [], lacunas: [] });
    const n = Mo.porOndeComecar({ estagio: 'comeca', prioridades: [], conferir: [], lacunas: [] });
    check('Por onde começar (nada em aberto): 3 ações gerais do estágio', v.length === 3 && n.length === 3 && v.every((x) => x.origem === 'estagio') && v[0].texto.startsWith('Anote as vendas da semana') && n[0].texto.startsWith('Faça 5 vendas-teste'), { v, n });
  }
  { /* item 3 (Gaby): o estágio da Etapa 1 muda o texto das ações */
    check('Estágio da Etapa 1: "Já vendo sempre"/"Já vendi algumas vezes" = vende; ideia e amostras = começando', Mo.estagioDe('Já vendo sempre') === 'vende' && Mo.estagioDe('Já vendi algumas vezes') === 'vende' && Mo.estagioDe('Ainda está só na minha cabeça') === 'comeca' && Mo.estagioDe('Já fiz um pouco para testar ou dar de amostra') === 'comeca' && Mo.estagioDe('') === null);
    const pv = Mo.porOndeComecar({ estagio: 'vende', prioridades: ['Definição dos preços', 'Definir a divulgação'] });
    const pc = Mo.porOndeComecar({ estagio: 'comeca', prioridades: ['Definição dos preços', 'Definir a divulgação'] });
    check('Estágio: quem já vende recebe ações de organizar e melhorar (anotar as vendas da semana)', pv[0].texto.includes('anote as vendas da semana') && pv[1].texto.includes('cliente desta semana') && pv[2].texto.startsWith('Anote as vendas da semana') && !pv.some((x) => /vendas-teste/.test(x.texto)), pv);
    check('Estágio: quem ainda não começou recebe ações de testar (5 vendas-teste)', pc[0].texto.includes('5 vendas-teste') && pc[1].texto.startsWith('Escolha um lugar para divulgar') && pc[2].texto.startsWith('Faça 5 vendas-teste') && !pc.some((x) => /vendas da semana/.test(x.texto)), pc);
    check('Estágio: todas as ações de todos os temas têm texto para quem vende e para quem começa, sem códigos', Mo.TEMAS.every((x) => x.vende && x.comeca && x.vende !== x.comeca && !/M\d+[.-]|P\d\d/.test(x.vende + x.comeca)));
    const o = Mo.porOndeComecar({ estagio: 'vende', prioridades: ['Organizar o estoque'] });
    check('Por onde começar: prioridade escrita pela pessoa (sem tema conhecido) vira a 1ª ação com o texto dela', o[0].origem === 'prioridade' && o[0].texto.startsWith('Comece por: organizar o estoque.'), o);
  }
}

/* ---------- 2b. resumo do negócio (texto corrido montado por regras) ---------- */
require(path.join(DIR, 'js/motor7.js'));
const RN = require(path.join(DIR, 'js/resumo-negocio.js'));
const JORNADA = path.resolve(__dirname, '../public/lg2/jornada');
/* a jornada (outra pasta) recebe a cópia depois do Módulo 10: enquanto ela ainda é a versão de antes
   do lote de 05/11 (md5 conhecido), o teste avisa a cópia pendente; qualquer outra diferença falha */
{
  const md5 = (f) => require('node:crypto').createHash('md5').update(fs.readFileSync(f)).digest('hex');
  const ANTES = { 'resumo-negocio.js': '8882ba7ed1e690e18f6291c71b28ad45', 'motor7.js': 'b537ece415f967c622199866a5e8f645' };
  const pend = [];
  const ok = Object.keys(ANTES).every((f) => {
    const igual = fs.readFileSync(path.join(DIR, 'js', f), 'utf8') === fs.readFileSync(path.join(JORNADA, 'js', f), 'utf8');
    if (!igual && md5(path.join(JORNADA, 'js', f)) === ANTES[f]) { pend.push(f); return true; }
    return igual;
  });
  check('Resumo: a cópia da jornada é igual à da Etapa 10 (resumo e capacidade)' + (pend.length ? ` [PENDENTE: copiar ${pend.join(', ')} de turma-b/m10/js/ para jornada/js/]` : ''), ok);
}
const LAVA = {
  1: { v: 3, R: { 'M1.P01': { estado: 'opcao', opcao: 'Já vendi algumas vezes' }, 'M1.P03': { estado: 'valor', valor: 'Lavagem de carros na casa do cliente' }, 'M1.P03A': { estado: 'opcao', opcao: 'Serviço: meu cliente paga pelo trabalho que realizo' } } },
  3: { R: { 'M3.P11': { estado: 'valor', valor: 'Falta de tempo para levar o carro ao lava-jato.' } } },
  4: { R: { 'M4.P08': { estado: 'valor', valor: 'Pessoas que trabalham o dia todo' } } },
  /* custo: 30 × 100 ml/1 L + 40 × 50 g/500 g = 3 + 4 = 7; taxa 5% de 60 = 3; sobra 50; gastos 50 + 1000 = 1050; 1050 / 50 = 21 vendas */
  5: { versao: 3, R: { 'M5.P01': { estado: 'opcao', opcao: 'Serviço: meu cliente paga pelo trabalho que realizo' }, 'M5.P18': { estado: 'opcao', opcao: 'Sim' }, 'M5.P19': { estado: 'valor', valor: ['Shampoo automotivo', 'Cera'] }, 'M5.P20': { estado: 'valor', valor: ['30', '40'] }, 'M5.P21': { estado: 'valor', valor: [{ q: '1', u: 'L' }, { q: '500', u: 'g' }] }, 'M5.P22': { estado: 'valor', valor: [{ q: '100', u: 'ml' }, { q: '50', u: 'g' }] }, 'M5.P24': { estado: 'opcao', opcao: 'Sim' }, 'M5.P25': { estado: 'valor', valor: [{ forma: 'Cartão de crédito', taxa: '5', parte: '100' }] }, 'M5.P31': { estado: 'valor', valor: '50' }, 'M5.P35': { estado: 'valor', valor: '1000' }, 'M5.P36': { estado: 'valor', valor: '60' }, 'M5.P37': { estado: 'valor', valor: '40' } } },
  6: { R: { 'M6.P02': { estado: 'valor', valor: '800' }, 'M6.P07': { estado: 'valor', valor: '500' } } },
  7: { v: 1, ini: { horas: 'Até 10 h', volume: '55', minUn: 30 }, R: { 'M7-03': { estado: 'opcao', opcao: 'Até 2 h' } } },
  8: { R: { 'M8.P05': { estado: 'opcao', opcao: 'Não' }, 'M8.P07': { estado: 'opcao', opcao: 'Sim' } } },
  9: { v: 2, R: { 'M9-04': { estado: 'opcao', opcao: 'Ainda não fiz' } } },
  10: { v: 2, ini: { oferta: '' }, prioridade: 'Fazer a consulta de viabilidade na prefeitura', R: { 'M10-11': { estado: 'plano', frase: 'Ligar para a prefeitura até 12/11/2026; vai funcionar se vierem 1 resposta.' } } },
};
const RESUMO_LAVA = [
  'Seu negócio é lavagem de carros na casa do cliente, um serviço, e você já vendeu algumas vezes.',
  'Você vende para pessoas que trabalham o dia todo e ajuda com falta de tempo para levar o carro ao lava-jato.',
  'Você cobra R$ 60 por venda; tirando R$ 10 de custo e taxas, sobram R$ 50 em cada venda.',
  'Seus gastos do mês somam R$ 1.050, então você precisa de pelo menos 21 vendas por mês para cobri-los, e as 40 que você espera fazer já cobrem.',
  'Para começar, você precisa de cerca de R$ 800 e tem R$ 500: faltam R$ 300.',
  'No tempo que você tem, dá para fazer no máximo 69 por mês, o que dá conta dos 55 que você pretende fazer.',
  'Na parte de documentos, você ainda não tem CNPJ e a sua atividade pode ser MEI; ainda falta perguntar à prefeitura se a atividade pode funcionar no endereço.',
  'Sua prioridade agora é fazer a consulta de viabilidade na prefeitura, e o próximo passo é: ligar para a prefeitura até 12/11/2026; vai funcionar se vierem 1 resposta.',
];
{
  const fr = RN.frases((n) => LAVA[n] || null);
  check('Resumo (lava-jato, 10 etapas): 8 frases conferidas à mão, na ordem ideia → cliente → preço → mês → caixa → capacidade → documentos → plano', JSON.stringify(fr) === JSON.stringify(RESUMO_LAVA), fr);
  const so1 = RN.frases((n) => (n === 1 ? LAVA[1] : null));
  check('Resumo: só há frase para o que existe (só a Etapa 1 = 1 frase)', JSON.stringify(so1) === JSON.stringify([RESUMO_LAVA[0]]), so1);
  check('Resumo: nada respondido = nenhuma frase', RN.frases(() => null).length === 0);
  /* texto corrido em até 3 parágrafos, por assunto (pedido da turma: resumo em tópicos confunde) */
  const pg = RN.paragrafos((n) => LAVA[n] || null);
  check('Resumo em parágrafos: 3 parágrafos (negócio e cliente; dinheiro e tempo; documentos e próximo passo), mesmas frases', JSON.stringify(pg) === JSON.stringify([RESUMO_LAVA.slice(0, 2).join(' '), RESUMO_LAVA.slice(2, 6).join(' '), RESUMO_LAVA.slice(6).join(' ')]), pg);
  check('Resumo em parágrafos: só a Etapa 1 = 1 parágrafo; nada respondido = nenhum', JSON.stringify(RN.paragrafos((n) => (n === 1 ? LAVA[1] : null))) === JSON.stringify([RESUMO_LAVA[0]]) && RN.paragrafos(() => null).length === 0);
  const ns = JSON.parse(JSON.stringify(LAVA)); ns[4].R['M4.P08'] = { estado: 'naosei' }; ns[6].R['M6.P07'] = { estado: 'naosei' };
  const frNs = RN.frases((n) => ns[n] || null);
  check('Resumo: "Não sei" não vira dado', frNs[1] === 'Você ajuda o seu cliente com falta de tempo para levar o carro ao lava-jato.' && frNs[4] === 'Para começar, você estima gastar cerca de R$ 800.', frNs);
  /* preço sugerido no Módulo 5 (sem preço digitado): custo 100/10 = 10, + 50% = 15 */
  const c5 = RN.contaM5({ versao: 3, lucro: '50', R: { 'M5.P01': { estado: 'opcao', opcao: 'Mercadoria: compro pronto para revender' }, 'M5.P11': { estado: 'valor', valor: '100' }, 'M5.P12': { estado: 'valor', valor: '10' }, 'M5.P36': { estado: 'opcao', opcao: 'Ainda não defini' } } });
  check('Resumo: preço sugerido da Etapa 5 = custo × (1 + acréscimo)', c5.preco === 15 && c5.sugerido && c5.sobra === 5, c5);
  /* concordância e números com ponto de milhar */
  const um = RN.frases((n) => ({ 5: { R: { 'M5.P36': { estado: 'valor', valor: '1.500' }, 'M5.P37': { estado: 'valor', valor: '1' } } } })[n] || null);
  check('Resumo: \"1.500\" é mil e quinhentos e \"1 venda\" no singular', JSON.stringify(um) === JSON.stringify(['Você cobra R$ 1.500 por venda.', 'Com 1 venda por mês, entram cerca de R$ 1.500.']), um);
  const zero = RN.frases((n) => ({ 7: { v: 1, ini: { horas: 'Até 10 h', volume: '1.500', minUn: 1500 * 60 }, R: {} } })[n] || null);
  check('Resumo: 1.500 h por unidade = nem uma unidade por mês (sem \"no máximo 0\")', zero.length === 1 && zero[0].startsWith('No tempo que você tem, ainda não dá para fazer nem uma unidade por mês, e você pretende fazer 1.500.'), zero);
  const lav2 = JSON.parse(JSON.stringify(LAVA)); lav2[5].R['M5.P37'] = { estado: 'valor', valor: '1.500' }; lav2[5].R['M5.P35'] = { estado: 'valor', valor: '100000' };
  const fr2 = RN.frases((n) => lav2[n] || null);
  check('Resumo: vendas com ponto de milhar (\"2.021 vendas\", \"1.500\")', fr2[3] === 'Seus gastos do mês somam R$ 100.050, então você precisa de pelo menos 2.001 vendas por mês para cobri-los, e hoje você espera fazer 1.500 vendas.', fr2[3]);
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
  'lg2-turma-b-m09': { v: 2, R: { 'M9-04': { estado: 'opcao', opcao: 'Ainda não fiz' }, 'M9-03': { estado: 'opcao', opcao: 'Ainda não escolhi' } } },
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

  const contagensVisiveis = [];
  const palavrasVisiveis = () => page.evaluate(() => { const n = (t) => t.split(/\s+/).filter((w) => /[A-Za-zÀ-ÿ0-9]/.test(w)).length; return n(document.querySelector('#tela').innerText) - [...document.querySelectorAll('.p-linha-integrada, .p-fontes summary')].reduce((a, e) => a + n(e.innerText), 0); });
  const semear = async (estado, heranca) => {
    await page.evaluate(([e, h, k]) => {
      localStorage.clear();
      Object.entries(h).forEach(([kk, v]) => localStorage.setItem(kk, JSON.stringify(v)));
      if (e) localStorage.setItem(k, JSON.stringify(e));
    }, [estado, heranca || HERANCA, CHAVE]);
    await page.reload();
  };
  const temBotao = (t) => page.evaluate((t) => [...document.querySelectorAll('button')].some((x) => x.textContent.replace(/\s+/g, ' ').trim() === t || ((x.querySelector('.op-txt b') || {}).textContent || '').trim() === t), t);
  const clicar = async (t) => {
    const ok = await page.evaluate((t) => { const b = [...document.querySelectorAll('button')].find((x) => x.textContent.replace(/\s+/g, ' ').trim() === t || ((x.querySelector('.op-txt b') || {}).textContent || '').trim() === t); if (b) { b.click(); return true; } return false; }, t);
    if (!ok) throw new Error('botão não encontrado: ' + t);
    await page.waitForTimeout(60);
  };
  const abrir = async (cod, rExtra, heranca) => {
    await semear(estadoAte(cod, rExtra), heranca);
    await clicar('Continuar de onde parei');
    contagensVisiveis.push([cod, await palavrasVisiveis()]);
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
  check('M10-01: [canais de venda] vem da Etapa 3', (await titulo()) === 'Além de redes sociais (Instagram, Facebook, WhatsApp), por onde falam os clientes?', await titulo());
  const ops01 = await page.evaluate(() => [...document.querySelectorAll('#ent .opcao')].map((x) => (x.querySelector('.op-txt b') || x).innerText.trim()));
  check('M10-01: as opções não repetem os canais de venda da pergunta (redes sociais = sem WhatsApp e Instagram)', JSON.stringify(ops01) === JSON.stringify(['Pessoalmente (atendimento direto)', 'Na casa do cliente (atendimento em domicílio)', 'Aplicativo de entrega (iFood e outros)', 'Telefone', 'E-mail', 'Site ou loja virtual próprios', 'Marketplace (Mercado Livre, Shopee e outros)', 'Ainda não falo com clientes']), ops01);
  await clicar('Telefone'); await confere('', 'M10-01', ESPERADO.caminhos[0][1]); conta();
  await clicar('Aplicativo de entrega (iFood e outros)'); await confere('', 'M10-01', ESPERADO.caminhos[0][1]);
  await clicar('Ainda não falo com clientes'); await confere('', 'M10-01', 'Ainda não falo com clientes'); conta();
  check('M10-01: [onde procuram] vem da Etapa 2', (await blocos()).join(' ').includes('(meu bairro)'));
  /* 16/11: pergunta sobre a própria pessoa = sem "Não sei" */
  check('Não sei saiu (M10-01): o botão não existe', !(await temBotao('Não sei')));
  /* sem canais de venda (Módulo 3 não feito): pergunta sem "Além de" e com todas as opções */
  { const h0 = JSON.parse(JSON.stringify(HERANCA)); delete h0['lg2-turma-a-m03'];
    await semear(Object.assign(estadoAte('M10-01'), { ini: Object.assign({}, INI, { canais: '' }) }), h0); await clicar('Continuar de onde parei');
    const o0 = await page.evaluate(() => [...document.querySelectorAll('#ent .opcao')].map((x) => (x.querySelector('.op-txt b') || x).innerText.trim()));
    check('M10-01: sem canais de venda, a pergunta é "Por onde falam os clientes?" com todas as opções', (await titulo()) === 'Por onde falam os clientes?' && JSON.stringify(o0.slice(0, 5)) === JSON.stringify(['WhatsApp Business ou WhatsApp', 'Catálogo no Instagram ou outra rede social', 'Pessoalmente (atendimento direto)', 'Na casa do cliente (atendimento em domicílio)', 'Aplicativo de entrega (iFood e outros)']), [await titulo(), o0]);
    check('Canais (M10-01): do dia a dia primeiro; site e marketplace depois', o0.indexOf('Site ou loja virtual próprios') > o0.indexOf('Aplicativo de entrega (iFood e outros)') && o0.indexOf('Marketplace (Mercado Livre, Shopee e outros)') > o0.indexOf('Site ou loja virtual próprios'), o0); }
  /* loja física + redes sociais herdadas do Módulo 3: lista com "e", selo e sem "Pessoalmente" */
  { const h1 = JSON.parse(JSON.stringify(HERANCA)); h1['lg2-turma-a-m03'].R['M3.P13'] = { estado: 'opcoes', opcoes: ['Loja física', 'Redes sociais (Instagram, Facebook, WhatsApp)', 'Outro'], detalhe: 'Feira do bairro' };
    await semear(Object.assign(estadoAte('M10-01'), { ini: Object.assign({}, INI, { canais: '' }) }), h1); await clicar('Continuar de onde parei');
    const o1 = await page.evaluate(() => [...document.querySelectorAll('#ent .opcao')].map((x) => (x.querySelector('.op-txt b') || x).innerText.trim()));
    check('M10-01: canais reais da Etapa 3 por nome (com "Outro" escrito) e opções sem repetição', (await titulo()) === 'Além de loja física, redes sociais (Instagram, Facebook, WhatsApp) e feira do bairro, por onde falam os clientes?' && JSON.stringify(o1) === JSON.stringify(['Na casa do cliente (atendimento em domicílio)', 'Aplicativo de entrega (iFood e outros)', 'Telefone', 'E-mail', 'Site ou loja virtual próprios', 'Marketplace (Mercado Livre, Shopee e outros)', 'Ainda não falo com clientes']), [await titulo(), o1]);
    check('M10-01: selo "Veio da Etapa 3" + "Confira e ajuste se quiser"', nrm(await page.evaluate(() => (document.querySelector('.herdado') || {}).innerText)).startsWith('Veio da Etapa 3') && (await page.evaluate(() => document.querySelector('.herdado').innerText)).includes('Veio da Etapa 3')); }
  /* SOCIO (pergunta extra): ajuda útil, resposta local ainda inalterada até Continuar */
  await abrir('SOCIO');
  check('Menos texto: tela da pergunta de sócio ≤ 60 palavras', (await palavrasVisiveis()) <= 60, await palavrasVisiveis());
  check('Não sei saiu (Sócio): o botão não existe; só Sim e Não', !(await temBotao('Não sei')) && JSON.stringify(await page.evaluate(() => [...document.querySelectorAll('#ent .opcao')].map((x) => x.innerText.trim()))) === '["Sim","Não"]');
  /* escolhas únicas: cada opção da linha mostra a mensagem da linha */
  const UNICAS = {
    'M10-02': ['Em até 1 hora / No mesmo dia', 'Em 1 ou 2 dias', 'Mais de 2 dias', 'Ainda não vendo / Não sei'],
    'M10-03': ['Sim, sigo passos parecidos', 'Depende do cliente', 'Ainda não vendi', 'Não sei'],
    'M10-04': ['Sim, peço opinião / Sim, ofereço de novo', 'Não, só se o cliente me procura', 'Ainda não vendi / Não sei'],
    'M10-05': ['Indicação de quem já comprou / Redes sociais próprias / Grupos de mensagem / Cartaz ou panfleto no bairro / Parceria com outro negócio', 'Anúncio pago', 'Ainda não sei'],
    'M10-06': ['Sim, por escrito', 'Só combinamos de boca / Ainda não', 'Não sei'],
    'M10-08': ['Não', 'Sim, para produzir ou atender / para vender ou divulgar / para tarefas administrativas', 'Não sei'],
  };
  /* M10-05: opções do app (canais do dia a dia primeiro) e a linha da planilha que responde a cada uma */
  const APP05 = {
    [UNICAS['M10-05'][0]]: ['Indicação', 'WhatsApp', 'Redes sociais', 'Grupos do bairro', 'Atendimento direto', 'Atendimento em domicílio', 'Aplicativo de entrega', 'Cartaz ou panfleto', 'Parceria', 'Site próprio', 'Marketplace'],
    'Ainda não sei': ['Não sei'], /* 16/11: "Ainda não sei" = "Não sei" (uma opção só) */
  };
  /* 17/11: retorno ao vivo de cada opção da M10-05 (o texto da opção não muda) */
  const RET05 = {
    'Indicação': 'Boa escolha: não custa nada. Peça a quem já comprou para indicar você a um conhecido.',
    'WhatsApp': 'Poste no status e mande para a sua lista de contatos uma ou duas vezes por semana, sem exagerar. No resultado há uma mensagem de apresentação pronta para usar.',
    'Redes sociais': 'Poste com frequência fotos do que você vende, com preço e como pedir. No resultado há uma mensagem de apresentação pronta para usar.',
    'Grupos do bairro': 'Antes de postar, veja as regras do grupo. No resultado há uma mensagem de apresentação pronta para usar.',
    'Atendimento direto': 'Deixar provar ou ver de perto convence quem ainda não conhece. Tenha um jeito fácil de a pessoa pedir depois.',
    'Atendimento em domicílio': 'Ir até a casa do cliente é um jeito de vender. Para mais gente saber de você, aproveite a visita: deixe um cartão e peça indicação de vizinhos.',
    'Aplicativo de entrega': 'O aplicativo é um lugar de venda que também mostra você para quem procura nele. Ele cobra uma parte de cada venda: confira essa taxa nos gastos da Etapa 5.',
    'Cartaz ou panfleto': 'Coloque onde o seu cliente passa (padaria, mercado, ponto de ônibus) e ponha um jeito fácil de falar com você.',
    'Parceria': 'Combine com o outro negócio o que cada um ganha. Ex.: o seu cartão no balcão dele e um desconto para os clientes dele.',
    'Site próprio': 'Um site só traz clientes se as pessoas chegarem até ele. Divulgue o endereço no WhatsApp e nas redes.',
    'Marketplace': 'O marketplace mostra você para quem já procura no site, mas cobra uma parte de cada venda: confira essa taxa nos gastos da Etapa 5.',
  };
  /* 16/11: perguntas sobre a própria pessoa ficaram sem "Não sei"; nas outras ele só abre a ajuda */
  const SEM_NS = ['M10-01', 'M10-02', 'M10-03', 'M10-04', 'SOCIO', 'M10-06', 'M10-08'];
  const SAIRAM = [['M10-01', 'Não sei'], ['M10-03', 'Não sei'], ['M10-06', 'Não sei'], ['M10-08', 'Não sei'], ['M10-09', 'Não sei']];
  /* "Não sei" que bloqueia: ajuda com passos, pedido e Copiar + a dica da planilha; nada marcado, nada gravado; Continuar não anda */
  async function confereBloqueio(cod, textoDica) {
    const a = await page.evaluate((k) => ({
      box: !!document.querySelector('.como-descobrir'), passos: document.querySelectorAll('.como-descobrir ol > li').length,
      prompt: !!document.querySelector('.como-descobrir [data-prompt]'), copiar: [...document.querySelectorAll('.como-descobrir button')].some((b) => b.textContent.trim() === 'Copiar'),
      txt: (document.querySelector('.como-descobrir') || {}).innerText || '', sel: [...document.querySelectorAll('#ent .opcao.sel')].map((x) => x.innerText),
      antes: window.__nsAntes, agora: JSON.parse(localStorage.getItem(k) || 'null'), q: document.querySelector('.q').innerText }), CHAVE);
    const dicaOk = !textoDica || fragmentos(textoDica).every((f) => nrm(a.txt).includes(f));
    if (cod === 'M10-05') {
      await page.click('.como-descobrir [data-copiar]');
      let estadoCopiar = '';
      for (let k = 0; k < 20; k++) { estadoCopiar = await page.locator('.como-descobrir [data-copiar]').innerText(); if (estadoCopiar !== 'Copiar') break; await page.waitForTimeout(100); }
      check('Copiar pedido de ajuda: confirma cópia ou seleciona texto como alternativa', ['Copiado!', 'Toque e segure o texto para copiar'].includes(estadoCopiar), estadoCopiar);
    }
    check(`Não sei bloqueia ${cod}: ajuda (2 passos, pedido, Copiar${textoDica ? ', dica da planilha' : ''}), nada marcado e estado salvo igual`, a.box && a.passos === 2 && a.prompt && a.copiar && dicaOk && JSON.stringify(a.agora) === JSON.stringify(a.antes) && (cod === 'M10-09' || cod === 'M10-10' || a.sel.length === 0), a);
    await clicar('Continuar');
    const d = await page.evaluate((k) => ({ q: document.querySelector('.q') && document.querySelector('.q').innerText, erro: !document.querySelector('#erro').hidden && document.querySelector('#erro').innerText, agora: JSON.parse(localStorage.getItem(k) || 'null') }), CHAVE);
    check(`Não sei bloqueia ${cod}: Continuar não avança nem grava, e pede a resposta`, d.q === a.q && !!d.erro && JSON.stringify(d.agora.R[cod]) === JSON.stringify((a.antes && a.antes.R[cod]) || undefined), d);
    return a;
  }
  await abrir('M10-05');
  { const o5 = await page.evaluate(() => [...document.querySelectorAll('#ent .opcao')].map((x) => (x.querySelector('.op-txt b') || x).innerText.trim()));
    check('Canais (M10-05): WhatsApp Business, catálogo, indicação, atendimento direto/domicílio e iFood antes de site e marketplace', JSON.stringify(o5) === JSON.stringify(APP05[UNICAS['M10-05'][0]].concat(['Anúncio pago', 'Não sei'])), o5); }
  for (const [cod, linhas] of Object.entries(UNICAS)) {
    await abrir(cod);
    for (const linha of linhas) {
      const ops = APP05[linha] || linha.split(' / ').map((x) => (/^para /.test(x) ? 'Sim, ' + x : x));
      let alcancou = false;
      for (const op of ops) {
        if (op === 'Não sei' && SEM_NS.includes(cod)) { check(`Não sei saiu (${cod}): o botão não existe`, !(await temBotao('Não sei'))); continue; }
        if (op === 'Não sei') {
          await page.evaluate((k) => { window.__nsAntes = JSON.parse(localStorage.getItem(k) || 'null'); }, CHAVE);
          await clicar(op);
          await confereBloqueio(cod, caminhoTexto(cod, linha));
          alcancou = true; continue;
        }
        alcancou = true;
        await clicar(op);
        /* 17/11: cada opção da M10-05 tem retorno próprio (a frase única da planilha, "usa o seu diferencial", não servia para Parceria, domicílio, aplicativo…) */
        if (cod === 'M10-05' && RET05[op]) { const bs = await blocos(); check(`Caminho M10-05 · ${op}: retorno próprio da opção`, bs.length === 1 && nrm(bs[0]).includes(RET05[op]) && !bs[0].includes('usa o seu diferencial'), bs); continue; }
        /* contratar com folga no Módulo 7: a observação do cruzamento vem junto (2 caixas) */
        await confere(op, cod, linha, cod === 'M10-08' && op.startsWith('Sim') ? 2 : 1);
      }
      if (alcancou) conta();
    }
  }
  /* opção visivelmente curta mantém o valor salvo de antes da redução */
  await abrir('M10-05'); await clicar('Redes sociais'); await clicar('Continuar');
  const salvoM05 = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)).R['M10-05'] || {}, CHAVE);
  check('M10-05: rótulo curto preserva o valor salvo antigo', salvoM05.opcao === 'Catálogo no Instagram ou outra rede social', salvoM05);
  await semear(estadoAte('FIM', { 'M10-05': { estado: 'opcao', opcao: 'Catálogo no Instagram ou outra rede social' } }));
  await clicar('Continuar de onde parei'); await clicar('Quero corrigir algo');
  await page.evaluate(() => [...document.querySelectorAll('.editar')].find((b) => b.dataset.c === 'M10-05').click()); await page.waitForTimeout(60);
  check('M10-05: resposta antiga volta marcada com o rótulo curto', await page.evaluate(() => [...document.querySelectorAll('#ent .opcao.sel')].map((x) => (x.querySelector('.op-txt b') || x).innerText.trim()).join()) === 'Redes sociais');
  /* M10-02 "Em 1 ou 2 dias" com tempo de apoio alto no Módulo 7: a parte condicional aparece */
  const h7 = JSON.parse(JSON.stringify(HERANCA)); h7['lg2-turma-b-m07'].R['M7-03'] = { estado: 'opcao', opcao: 'De 6 a 10 h' };
  await abrir('M10-02', {}, h7); await clicar('Em 1 ou 2 dias');
  check('M10-02: [Se tempo de apoio alto no M7] aparece só quando vale', (await blocos()).join(' ').includes('isso também pesa no seu tempo de apoio'));
  await abrir('M10-02'); await clicar('Em 1 ou 2 dias');
  check('M10-02: sem apoio alto, a parte condicional não aparece', !(await blocos()).join(' ').includes('tempo de apoio'));
  /* M10-03: texto de apoio com pessoas ouvidas e roteiro pré-montado */
  await abrir('M10-03');
  const ap3 = await page.evaluate(() => document.querySelector('.ajuda').textContent.replace(/\s+/g, ' '));
  check('M10-03: apoio com [pessoas ouvidas] e [etapas] do roteiro', ap3.startsWith('Você já ouviu 6 pessoas na Etapa 2.') && ap3.includes('Preço: R$ 12') && ap3.includes('Receber: Pix, dinheiro'), ap3);
  { /* menos texto (receita D): ajuda com mais de 220 caracteres mostra a 1ª frase e o resto em "Ver mais" fechado */
    const vm3 = await page.evaluate(() => { const a = document.querySelector('.dica-toggle'); return { aberto: a ? a.open : null, resumo: a?.querySelector('summary').innerText || '' }; });
    check('Menos texto: dica fechada por padrão entre pergunta e opções', vm3.aberto === false && vm3.resumo === 'Ver dica', vm3); }
  /* M10-04: apoio condicional (compra recorrente no Módulo 2) */
  await abrir('M10-04');
  check('M10-04: [Se compra recorrente no Módulo 2] com [frequência]', (await page.evaluate(() => { const d=document.querySelector('.dica-toggle'); d.open=true; return d.innerText; })) .includes('Você disse que o cliente compra toda semana. Voltar a falar pode trazer a próxima venda.'));
  /* M10-05: [oferta em foco] e [diferencial do Módulo 3] */
  await abrir('M10-05');
  check('M10-05: sem resposta, vem marcado "Redes sociais próprias" (canais da Etapa 3) com selo', (await page.evaluate(() => [...document.querySelectorAll('#ent .opcao.sel')].map((x) => (x.querySelector('.op-txt b') || x).innerText.trim()).join())) === 'Redes sociais' && (await page.evaluate(() => document.querySelector('.herdado').innerText)).startsWith('Veio da Etapa 3') && (await blocos()).length === 0);
  { const ha = JSON.parse(JSON.stringify(HERANCA)); ha['lg2-turma-a-m05'].R['M5.P33'] = { estado: 'valor', valor: [{ nome: 'Anúncio no Instagram', v: '50' }] };
    await abrir('M10-05', {}, ha);
    check('M10-05: anúncio nos gastos da Etapa 5 = "Anúncio pago" marcado, selo da Etapa 5', (await page.evaluate(() => document.querySelector('#ent .opcao.sel .op-txt b').innerText.trim())) === 'Anúncio pago' && (await page.evaluate(() => document.querySelector('.herdado').innerText)).startsWith('Veio da Etapa 5')); }
  await abrir('M10-05');
  check('M10-05: pergunta e apoio preenchidos', (await titulo()).includes('saber que bolo de pote existe') && (await page.evaluate(() => { const d=document.querySelector('.dica-toggle'); d.open=true; return d.innerText; })).includes('diferencial: Bolo fresco entregue no mesmo dia.'));
  /* ---------- 17/11 item 1: M3.P13A (Etapa 3, "Como as pessoas ficam sabendo de você?") ---------- */
  /* telas com resposta reaproveitada (cartão/nota "Veio da Etapa N"): limite próprio de palavras, +15 sobre a tela de origem */
  const LIM_HERANCA = 95, LIM_HERANCA_60 = 75;
  const abrirH = async (cod, rExtra, heranca) => { await semear(estadoAte(cod, rExtra), heranca); await clicar('Continuar de onde parei'); };
  { /* sem M3.P13A: igual a antes (enunciado da planilha, sem cartão) */
    await abrirH('M10-05');
    check('Etapa 3 sem M3.P13A: M10-05 igual a antes (enunciado da planilha, sem cartão)', (await titulo()) === 'Como as pessoas vão saber que bolo de pote existe nas próximas semanas?' && !(await page.evaluate(() => !!document.querySelector('#veio05'))), await titulo());
    const h3 = JSON.parse(JSON.stringify(HERANCA)); h3['lg2-turma-a-m03'].R['M3.P13A'] = { estado: 'opcoes', opcoes: ['Indicação (boca a boca)', 'Google ou Google Maps'] };
    await abrirH('M10-05', {}, h3);
    const lerV = () => page.evaluate(() => ({ q: document.querySelector('.q').innerText, card: (document.querySelector('#veio05') || {}).innerText || '', trocar: !!document.querySelector('#veio05 #trocar05'), aberto: !!document.querySelector('#troca05:not([hidden])'), sel: [...document.querySelectorAll('#ent > .opcoes .opcao.sel')].map((x) => x.querySelector('.op-txt b').innerText.trim()), seloAntigo: !!document.querySelector('#ent > p.herdado'), bs: [...document.querySelectorAll('#retorno .bloco')].length })).then(async (x) => Object.assign(x, { palavras: await palavrasVisiveis() }));
    let v = await lerV();
    check('Etapa 3 com M3.P13A: cartão "Veio da Etapa 3 · Trocar" com como as pessoas ficam sabendo hoje', nrm(v.card).startsWith('Veio da Etapa 3') && v.trocar && !v.aberto && nrm(v.card).includes('Hoje as pessoas ficam sabendo de você por: indicação (boca a boca) e Google ou Google Maps.') && v.palavras <= LIM_HERANCA, v);
    check('Etapa 3 com M3.P13A: enunciado muda para o que é novo (o que reforçar)', v.q === 'Qual caminho de divulgação você vai reforçar nas próximas semanas?', v.q);
    check('Etapa 3 com M3.P13A: opção equivalente marcada (Indicação), sem o selo antigo e sem retorno antes do toque', v.sel.join() === 'Indicação' && !v.seloAntigo && v.bs === 0, v);
    if (process.env.SHOTS) { await page.waitForTimeout(400); await page.screenshot({ path: path.join(process.env.SHOTS, 'm10_05_etapa3.png') }); }
    /* Trocar: a lista da Etapa 3 abre ali; trocar Indicação por Instagram muda o cartão e a marcação sugerida */
    if (await temBotao('Trocar')) await clicar('Trocar');
    await page.evaluate(() => { const b = [...document.querySelectorAll('#troca05 .opcao')]; if (!b.length) return; b.find((x) => x.dataset.v === 'Indicação (boca a boca)').click(); b.find((x) => x.dataset.v === 'Instagram ou outras redes sociais').click(); });
    await page.waitForTimeout(60);
    v = await lerV();
    check('Etapa 3 · Trocar: lista aberta na própria tela; cartão e marcação acompanham a troca', v.aberto && nrm(v.card).includes('Hoje as pessoas ficam sabendo de você por: Google ou Google Maps e Instagram ou outras redes sociais.') && v.sel.join() === 'Redes sociais', v);
    if (process.env.SHOTS) { await page.waitForTimeout(400); await page.screenshot({ path: path.join(process.env.SHOTS, 'm10_05_trocar.png') }); }
    await clicar('Continuar');
    const s5 = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)).R['M10-05'], CHAVE);
    check('Etapa 3 · Trocar: Continuar grava a opção e o que veio da Etapa 3 (de: 3, trocado)', s5.opcao === 'Catálogo no Instagram ou outra rede social' && s5.hoje && s5.hoje.de === 3 && s5.hoje.trocado === true && JSON.stringify(s5.hoje.opcoes) === JSON.stringify(['Google ou Google Maps', 'Instagram ou outras redes sociais']), s5);
    /* M3.P13A sem equivalência clara (só Google): cartão aparece, nada vem marcado */
    const h3g = JSON.parse(JSON.stringify(HERANCA)); h3g['lg2-turma-a-m03'].R['M3.P13A'] = { estado: 'opcoes', opcoes: ['Google ou Google Maps'] };
    await abrirH('M10-05', {}, h3g);
    v = await lerV();
    check('Etapa 3 com M3.P13A sem equivalente claro (Google): cartão sim, nenhuma opção marcada', nrm(v.card).startsWith('Veio da Etapa 3') && v.sel.length === 0, v);
    /* resultado: como ficam sabendo hoje aparece em "Como você vende" */
    await semear(estadoAte('FIM'), h3);
    await clicar('Continuar de onde parei');
    const rv = nrm(await page.evaluate(() => document.querySelector('.resultado-mais').innerText));
    check('Etapa 3 com M3.P13A: resultado mostra como as pessoas ficam sabendo (Etapa 3)', rv.includes('Como as pessoas ficam sabendo de você (Etapa 3) Indicação (boca a boca) e Google ou Google Maps'), rv.slice(0, 400));
  }
  /* ---------- 17/11 item 2: M7-04 (Etapa 7, "Alguém ajuda você?") em M10-07, sócio e contratar ---------- */
  { await abrirH('M10-07');
    check('Etapa 7 sem M7-04: M10-07 sem nota de ajuda e nada marcado', !(await page.evaluate(() => !!document.querySelector('#ajuda7') || document.querySelectorAll('#ent .opcao.sel').length > 0)));
    const h7f = JSON.parse(JSON.stringify(HERANCA)); h7f['lg2-turma-b-m07'].R['M7-04'] = { estado: 'opcao', opcao: 'Sim, sem pagamento (família, amigo, parceiro)', horas: 4 };
    await abrirH('M10-07', {}, h7f);
    const a = await page.evaluate(() => ({ nota: (document.querySelector('#ajuda7') || {}).innerText || '', ex: [...document.querySelectorAll('#ent > .opcoes')].map((g) => { const o = [...g.querySelectorAll('.opcao')].find((x) => x.querySelector('.op-txt b').innerText.trim() === 'Ajudante'); return o && (o.querySelector('.op-ex') || {}).innerText; }), sel: document.querySelectorAll('#ent .opcao.sel').length }));
    check('Etapa 7 (ajuda de família): M10-07 traz quem ajuda como sugestão de responsável ("Ajudante")', nrm(a.nota).startsWith('Veio da Etapa 7') && a.nota.includes('família, amigo ou parceiro, 4 h por semana') && a.nota.includes('marque “Ajudante”') && a.sel === 0 && (await palavrasVisiveis()) <= LIM_HERANCA_60, Object.assign(a, { palavras: await palavrasVisiveis() }));
    if (process.env.SHOTS) { await page.waitForTimeout(400); await page.screenshot({ path: path.join(process.env.SHOTS, 'm10_07_ajuda7.png') }); }
    await abrirH('SOCIO', {}, h7f);
    const ns = await page.evaluate(() => (document.querySelector('#ajuda7') || {}).innerText || '');
    check('Etapa 7 (ajuda de família): pergunta de sócio parte do que já se sabe (quem só ajuda não é sócio)', nrm(ns).startsWith('Veio da Etapa 7') && ns.includes('Quem só ajuda não é sócio') && (await palavrasVisiveis()) <= 60 && JSON.stringify(await page.evaluate(() => [...document.querySelectorAll('#ent .opcao')].map((x) => x.innerText.trim()))) === '["Sim","Não"]', ns);
    const h7p = JSON.parse(JSON.stringify(HERANCA)); h7p['lg2-turma-b-m07'].R['M7-04'] = { estado: 'opcao', opcao: 'Sim, pago alguém', horas: 6 };
    await abrirH('M10-08', {}, h7p);
    const n8 = await page.evaluate(() => (document.querySelector('#ajuda7') || {}).innerText || '');
    check('Etapa 7 (ajuda paga): M10-08 lembra que já paga alguém (6 h por semana)', nrm(n8).includes('Você já paga uma pessoa para ajudar (6 h por semana)') && (await palavrasVisiveis()) <= 60, n8);
    await abrirH('M10-07', {}, h7p);
    check('Etapa 7 (ajuda paga): "Ajudante" = uma pessoa que você paga', nrm(await page.evaluate(() => (document.querySelector('#ajuda7') || {}).innerText)).includes('Você tem ajuda de uma pessoa que você paga, 6 h por semana: marque “Ajudante” onde ela ajuda.'));
    /* sozinho(a) e sem sócio: "Eu" já vem marcado em todas; Continuar grava */
    const h7s = JSON.parse(JSON.stringify(HERANCA)); h7s['lg2-turma-b-m07'].R['M7-04'] = { estado: 'opcao', opcao: 'Não, faço sozinho(a)', horas: 0 };
    await abrirH('M10-07', { SOCIO: { estado: 'opcao', opcao: 'Não' } }, h7s);
    const so = await page.evaluate(() => ({ nota: (document.querySelector('#ajuda7') || {}).innerText || '', sel: [...document.querySelectorAll('#ent > .opcoes')].map((g) => (g.querySelector('.opcao.sel .op-txt b') || {}).innerText) }));
    check('Etapa 7 (sozinho, sem sócio): M10-07 já vem com "Eu" em todas, com nota', so.sel.join() === 'Eu,Eu,Eu' && nrm(so.nota).startsWith('Veio da Etapa 7') && (await palavrasVisiveis()) <= LIM_HERANCA_60, so);
    await clicar('Continuar');
    const q7 = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)).R['M10-07'], CHAVE);
    check('Etapa 7 (sozinho): Continuar grava "Eu" nas 3 etapas', q7 && JSON.stringify(q7.quem) === JSON.stringify({ 'Receber o pedido': 'Eu', Fazer: 'Eu', Entregar: 'Eu' }), q7);
  }
  /* M10-06: acordo entre sócios só aparece para quem respondeu que tem/pretende ter sócio. */
  await abrir('M10-06', { SOCIO: { estado: 'opcao', opcao: 'Sim' } });
  const socTip = await page.evaluate(() => { const d=document.querySelector('.dica-toggle'), t=d?.querySelector('.dica-sociedade'), closedBefore=d ? !d.open : false; if(d) d.open=true; return { closedBefore, text:t?.innerText || '', prompt:t?.querySelector('[data-prompt]')?.innerText || '', passos:t?.querySelectorAll('.como-descobrir ol li').length || 0 }; });
  check('M10-06: dica de sociedade antes da resposta, inclui combinado, exemplo, MEI e fontes', !!socTip.text && socTip.closedBefore && ['quem faz cada tarefa','dinheiro, tempo e equipamento','lucro e as retiradas','sair','discordarem','assinado pelos dois','MEI é individual e não pode ter sócio','Ana produz e Bia vende','R$ 300','Sebrae/PR','gov.br'].every((x) => nrm(socTip.text).includes(nrm(x))) && socTip.passos === 2 && socTip.prompt.includes('rascunhar um acordo simples'), socTip);
  check('M10-06: Não sei saiu em pergunta Sim/Não sobre situação própria', !(await temBotao('Não sei')));
  if (process.env.SHOTS) { await page.waitForTimeout(200); await page.screenshot({ path: path.join(process.env.SHOTS, 'm10_dica_sociedade.png') }); }
  /* M10-07 */
  await abrir('M10-07');
  check('M10-07: as etapas vêm do mapa da Etapa 7', (await page.evaluate(() => [...document.querySelectorAll('#ent .responsaveis-diagrama .lg2-diag-tit')].map((x) => x.innerText))).join('|') === 'Receber o pedido|Fazer|Entregar');
  const porEtapa = async (idx) => page.evaluate((idx) => { [...document.querySelectorAll('#ent .opcoes')].forEach((g, i) => g.querySelectorAll('.opcao')[idx[i]].click()); }, idx);
  await porEtapa([0, 0, 0]); await page.waitForTimeout(60); await confere('', 'M10-07', ESPERADO.caminhos.find((c) => c[0] === 'M10-07')[1]); conta();
  await porEtapa([0, 0, 3]); await page.waitForTimeout(60); await confere('', 'M10-07', "'Ninguém ainda' em alguma etapa"); conta();
  /* M10-08: capacidade curta no Módulo 7 (volume 100) */
  const hc = JSON.parse(JSON.stringify(HERANCA)); hc['lg2-turma-b-m07'].ini.volume = '100';
  await abrir('M10-08', {}, hc);
  check('M10-08: [Se capacidade curta no Módulo 7] com [N] e [volume]', (await page.evaluate(() => { const d=document.querySelector('.dica-toggle'); d.open=true; return d.innerText; })) .includes('Com o tempo informado, cabem cerca de 69 por mês, e você pretende 100 por mês.'));
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
  h9['lg2-turma-a-m03'].R['M3.P20'] = { estado: 'naosei' };
  h9['lg2-turma-b-m08'] = { R: { 'M8.P06': { estado: 'naosei' }, 'M8.P05': { estado: 'opcao', opcao: 'MEI' } } };
  await abrir('M10-09', { 'M10-02': { estado: 'opcao', opcao: 'Mais de 2 dias' }, 'M10-05': { estado: 'opcao', opcao: 'Anúncio pago' }, 'M10-06': { estado: 'opcao', opcao: 'Ainda não' } }, h9);
  const lista = await page.evaluate(() => [...document.querySelectorAll('#ent .opcao')].map((x) => (x.querySelector('.op-txt b') || x).innerText.trim()));
  check('M10-09: lista do percurso por gravidade, sem códigos; cada "Não sei" diz qual era a pergunta', JSON.stringify(lista) === JSON.stringify(['Definir o preço de venda', 'Acordo entre sócios', 'Fazer a consulta de viabilidade na prefeitura', 'Medir o tempo de produção', 'Tempo de resposta aos clientes', 'Descobrir quanto os concorrentes cobram (Etapa 3)', 'Descobrir o CNAE, o código da sua atividade (Etapa 8)']) && !/M\d/.test(lista.join()) && !/Completar a resposta/.test(lista.join()), lista);
  await clicar(lista[0]); await confere('', 'M10-09', 'Até 3 itens da lista'); conta();
  await clicar(lista[1]); await clicar(lista[2]); await clicar(lista[3]);
  check('M10-09: a 4ª escolha não entra', (await page.evaluate(() => document.querySelectorAll('#ent .opcao.sel').length)) === 3);
  await confere('', 'M10-09', 'Mais de 3'); conta();
  { const selAntes = await page.evaluate(() => [...document.querySelectorAll('#ent .opcao.sel')].length);
    await page.evaluate((k) => { window.__nsAntes = JSON.parse(localStorage.getItem(k) || 'null'); }, CHAVE);
    await clicar('Não sei');
    const a9 = await page.evaluate(() => document.querySelector('.como-descobrir').innerText);
    check('M10-09 Não sei: sugere as 3 que mais pesam (texto), sem marcar nem desmarcar nada', a9.includes('as que mais pesam são: ' + lista.slice(0, 3).join('; ')) && (await page.evaluate(() => document.querySelectorAll('#ent .opcao.sel').length)) === selAntes, a9);
    const a = await page.evaluate((k) => JSON.parse(localStorage.getItem(k) || 'null'), CHAVE);
    check('M10-09 Não sei: estado salvo igual', JSON.stringify(a) === JSON.stringify(await page.evaluate(() => window.__nsAntes)));
    /* lista vazia + Não sei: Continuar não anda */
    await page.evaluate(() => [...document.querySelectorAll('#ent .opcao.sel')].forEach((b) => b.click())); await clicar('Não sei');
    await confereBloqueio('M10-09');
    await clicar(lista[0]); await clicar(lista[1]); await clicar(lista[2]); }
  await clicar(lista[2]); await page.fill('#outro', 'Organizar a agenda'); await page.waitForTimeout(800);
  /* A (17/11): o retorno do "Outro" aparece ao vivo, antes do Continuar; um toque só avança */
  await confere('', 'M10-09', 'Outro (texto)', 2); conta();
  check('A: retorno do campo "Outro" aparece antes de tocar Continuar (junto com o das escolhidas)', (await blocos()).length === 2, await blocos());
  await clicar('Continuar');
  check('A: M10-09 com "Outro" avança com UM toque em Continuar', (await titulo()).startsWith('O que pode acontecer'), await titulo());
  /* M10-10 com as três escolhidas */
  check('M10-10: uma escala por prioridade', (await page.evaluate(() => [...document.querySelectorAll('#ent p.rot-campo')].map((x) => x.innerText))).join('|') === [lista[0], lista[1], 'Organizar a agenda'].join('|'));
  { await page.evaluate((k) => { window.__nsAntes = JSON.parse(localStorage.getItem(k) || 'null'); }, CHAVE);
    await page.evaluate(() => { const gs = [...document.querySelectorAll('#ent .opcoes')]; gs[1].querySelectorAll('.opcao')[0].click(); gs[0].querySelectorAll('.opcao')[3].click(); });
    await page.waitForTimeout(60);
    check('M10-10 Não sei numa linha: a linha fica sem resposta (nada marcado nela)', (await page.evaluate(() => document.querySelectorAll('#ent .opcoes')[0].querySelectorAll('.opcao.sel').length)) === 0);
    await confereBloqueio('M10-10'); }
  await page.evaluate(() => { const gs = [...document.querySelectorAll('#ent .opcoes')]; gs[0].querySelectorAll('.opcao')[2].click(); gs[1].querySelectorAll('.opcao')[0].click(); gs[2].querySelectorAll('.opcao')[0].click(); });
  await page.waitForTimeout(60);
  check('Caminho M10-10 · A mais urgente: piora muito, empate pela ordem da lista', (await blocos()).join() === 'A mais urgente parece ser: Acordo entre sócios.', await blocos()); conta();
  contagensVisiveis.push(['M10-10', await palavrasVisiveis()]);
  await clicar('Continuar');
  /* M10-11 */
  const hoje = await page.evaluate(() => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10));
  const dias = (n) => new Date(Date.parse(hoje) + n * 864e5).toISOString().slice(0, 10);
  check('M10-11: mostra a prioridade mais urgente', (await page.evaluate(() => document.querySelector('#ent .bloco').innerText)).includes('Acordo entre sócios'));
  const planoVivo = async (a, d, s, n) => { await page.fill('#acao', a); await page.fill('#data', d); await page.fill('#sinal', s); await page.fill('#numero', n); await page.waitForTimeout(800); };
  const plano = async (a, d, s, n) => { await planoVivo(a, d, s, n); await clicar('Continuar'); };
  await plano('conversar com o sócio', dias(-3), 'acordo assinado', '1'); await confere('', 'M10-11', 'Data inválida (passada)'); conta();
  check('M10-11: data passada não avança', (await titulo()).startsWith('Para sua prioridade'));
  /* A (17/11): sem número e data longe são lembretes ao vivo, junto com a frase do plano; o Continuar grava num toque */
  await planoVivo('conversar com o sócio', dias(10), 'acordo assinado', ''); await confere('', 'M10-11', 'Sem número', 2);
  const sug = await page.evaluate(() => document.querySelector('#retorno').innerText);
  /* 26/11: quem já vende (a herança diz "Já vendo sempre") não passa pelo teste da primeira oferta da Etapa 4: o critério dele não entra */
  check('Caso: plano sem número = pergunta gentil, ao vivo e sem bloquear; quem já vende não recebe o critério do teste da Etapa 4', !sug.includes('você combinou') && sug.includes('pedidos entregues no prazo') && (await blocos()).join(' ').startsWith('Seu plano:'), sug); conta();
  await clicar('Continuar');
  check('A: M10-11 sem número segue com UM toque (vai ao resultado)', !!(await page.$('#q12')) && (await page.evaluate((k) => JSON.parse(localStorage.getItem(k)).R['M10-11'].numero, CHAVE)) === '');
  await abrir('M10-11', { 'M10-09': { estado: 'multi', opcoes: [], outro: 'Organizar a agenda' } });
  await planoVivo('divulgar no grupo do bairro', dias(120), 'pedidos', '5'); await confere('', 'M10-11', 'Data acima de 90 dias', 2); conta();
  await planoVivo('divulgar no grupo do bairro', dias(14), 'pedidos', '5');
  const frase = `Divulgar no grupo do bairro até ${dias(14).split('-').reverse().join('/')}; vai funcionar se vierem 5 pedidos`;
  check('Caminho M10-11 · completo: "Seu plano: [frase]." ao vivo, antes do Continuar', (await blocos()).join() === `Seu plano: ${frase}. Combine com você mesmo de olhar o resultado nessa data.`, await blocos()); conta();
  await clicar('Continuar');
  check('A: M10-11 completo grava a frase e vai ao resultado com UM toque', !!(await page.$('#q12')) && (await page.evaluate((k) => JSON.parse(localStorage.getItem(k)).R['M10-11'].frase, CHAVE)) === frase + '.');
  await abrir('M10-11', { 'M10-09': { estado: 'multi', opcoes: [], outro: 'Organizar a agenda' } });
  await page.evaluate((k) => { window.__nsAntes = JSON.parse(localStorage.getItem(k) || 'null'); }, CHAVE);
  await clicar('Não sei'); await confereBloqueio('M10-11', caminhoTexto('M10-11', 'Não sei')); conta();
  /* M10-12 (tela final) */
  await semear(estadoAte('FIM'));
  await clicar('Continuar de onde parei');
  await clicar('Sim, salvar'); await confere('', 'M10-12', 'Sim, salvar', 1, '#ret12'); conta();
  check('M10-12: sem "[Se houver ofertas guardadas]" (a Etapa 1 não guarda outras ofertas)', !(await blocos('#ret12')).join().includes('próxima oferta'));
  await clicar('Quero corrigir algo'); await confere('', 'M10-12', 'Quero corrigir algo', 1, '#ret12'); conta();
  check('M10-12: lista "Corrigir minha resposta"', (await page.evaluate(() => document.querySelectorAll('#corr .editar').length)) === ORDEM.length - 1 + 1);
  /* 16/11: as linhas "Não sei" das perguntas sem "Não sei" (e a de M10-09, que marcava as 3 sozinha) não aparecem mais */
  check(`Caminhos alcançados: ${alcancadas} de ${ESPERADO.caminhos.length - SAIRAM.length} (${SAIRAM.length} linhas "Não sei" saíram)`, alcancadas === ESPERADO.caminhos.length - SAIRAM.length, alcancadas);

  /* ---------- 4. cruzamentos e encaminhamento no resumo ---------- */
  const resumo = async (r, h) => { await semear(estadoAte('FIM', r), h); await clicar('Continuar de onde parei'); await page.evaluate(() => document.querySelectorAll('.resultado-mais').forEach((d) => { d.open = true; })); return page.evaluate(() => document.querySelector('.corpo').innerText.replace(/\s+/g, ' ')); };
  let t = await resumo({ 'M10-05': { estado: 'opcao', opcao: 'Anúncio pago' } });
  check('Caso: anúncio pago sem gasto na Etapa 5 = pergunta gentil', t.includes('PERGUNTA GENTIL') && t.includes('O anúncio não aparece nos seus gastos. Quer incluir?'));
  const hg = JSON.parse(JSON.stringify(HERANCA)); hg['lg2-turma-a-m05'].R['M5.P33'] = { estado: 'valor', valor: [{ nome: 'Anúncio no Instagram', valor: '50' }] };
  t = await resumo({ 'M10-05': { estado: 'opcao', opcao: 'Anúncio pago' } }, hg);
  check('Anúncio pago com gasto de anúncio na Etapa 5 = sem pergunta', !t.includes('O anúncio não aparece'));
  t = await resumo({ 'M10-06': { estado: 'opcao', opcao: 'Ainda não' } });
  const enc = await page.evaluate(() => [...document.querySelectorAll('.b-enc')].map((x) => (x.querySelector('.op-txt b') || x).innerText.trim()));
  check('Caso: sócio sem acordo = observação + um encaminhamento só no resumo', t.includes('Combinar por escrito antes de investir juntos evita desentendimentos.') && enc.length === 1 && enc[0] === 'Para a forma do documento, procure um contador ou advogado.', enc);
  check('Resumo: checklist de acordo entre sócios com os 5 itens', (await page.evaluate(() => document.querySelectorAll('.chk input').length)) === 5);
  t = await resumo({ 'M10-01': { estado: 'opcao', opcao: 'Ainda não falo com clientes' }, 'M10-04': { estado: 'opcao', opcao: 'Não, só se o cliente me procura' }, 'M10-02': { estado: 'opcao', opcao: 'Mais de 2 dias' } });
  check('Cruzamentos: vende sem canal; recorrente sem pós-venda; resposta lenta com concorrente', t.includes('Você já vende, mas não marcou por onde fala com clientes. Quer rever?') && t.includes('Seu cliente compra toda semana.') && t.includes('Quem espera muito pode comprar de Doceria da esquina ou de outra pessoa.'));
  check('Resumo: no máximo 3 alertas', (await page.evaluate(() => { const s = [...document.querySelectorAll('section.cartao')].find((x) => x.querySelector('h3').innerText === 'Pontos para conferir'); return s ? s.querySelectorAll('.bloco').length : 0; })) === 3);
  check('Resumo: retrato com uma linha por etapa (1 a 9)', (await page.evaluate(() => document.querySelectorAll('.retrato').length)) === 9);
  check('Resumo: sem "Turma B", sem versão e sem "salvas apenas neste navegador"', !/Turma B|vers[aã]o \d|apenas neste navegador/i.test(t));
  check('Resumo: botão de volta aos etapas (.lg2-proximo) visível', await page.isVisible('.lg2-proximo a'));
  /* "O que entendemos até aqui": resumo do negócio no topo do resultado */
  t = await resumo({});
  const ent = await page.evaluate(() => { const x = document.querySelector('#entendemos'); return x ? { t: x.querySelector('h3').innerText, p: x.querySelector('.resumo-negocio').innerText, antes: !!(x.compareDocumentPosition(document.querySelector('.bloco-res')) & 4) } : null; });
  const ESP_ENT = 'Seu negócio é bolo de pote e você já vende com frequência. Você vende para trabalhadores do bairro. Você cobra R$ 12 por venda. No tempo que você tem, dá para fazer no máximo 69 por mês, o que dá conta dos 55 que você pretende fazer. Na parte de documentos, ainda falta perguntar à prefeitura se a atividade pode funcionar no endereço. Sua prioridade agora é organizar a agenda, e o próximo passo é: A até 01/01/2099; sinal de que funcionou: b (meta: 1).';
  check('Resultado: caixa "O que entendemos até aqui" no topo, com o resumo do negócio dos 10 etapas', ent && ent.t === 'O que entendemos até aqui' && ent.antes && nrm(ent.p) === ESP_ENT, ent);
  { const fmt = await page.evaluate(() => { const x = document.querySelector('#entendemos'); return { li: x.querySelectorAll('li, ul, ol').length, ps: [...x.querySelectorAll('.resumo-negocio p')].map((p) => p.innerText.trim()) }; });
    check('Resultado: "O que entendemos até aqui" em texto corrido (1 a 3 parágrafos, sem lista com marcadores)', fmt.li === 0 && fmt.ps.length >= 1 && fmt.ps.length <= 3 && fmt.ps.every((t) => t && !/^[•·\-–*]/.test(t)), fmt);
    check('Resultado: parágrafos agrupados por assunto (negócio e cliente / tempo / documentos e próximo passo)', fmt.ps.length === 3 && fmt.ps[0].startsWith('Seu negócio é bolo de pote') && fmt.ps[1].startsWith('Você cobra R$ 12') && fmt.ps[2].startsWith('Na parte de documentos'), fmt.ps); }
  check('Resultado: canais de venda (Etapa 3) e canais de conversa (Etapa 10) em linhas separadas', t.includes('Onde o cliente encontra você e compra') && t.includes('Por onde mais os clientes falam com você'));

  /* ---------- 4a. lote 3: Voltar no topo e "Por onde começar" ---------- */
  { await semear(null); await clicar('Começar'); await clicar('Continuar');
    await clicar('Telefone'); await clicar('Continuar');
    const vt = await page.evaluate(() => { const c = document.querySelector('.cartao-q'); const v = document.querySelectorAll('#v'); const b = v[0]; return { n: v.length, primeiro: c.firstElementChild.contains(b), antesQ: !!(b.compareDocumentPosition(c.querySelector('.q')) & 4), antesOk: !!(b.compareDocumentPosition(document.querySelector('#ok')) & 4), nome: b.getAttribute('aria-label'), texto: b.textContent.replace(/\s+/g, ' ').trim(), esq: Math.round(b.getBoundingClientRect().left - c.getBoundingClientRect().left) }; });
    check('Voltar: um só, no topo do cartão da pergunta, à esquerda, acima da pergunta e do Continuar', vt.n === 1 && vt.primeiro && vt.antesQ && vt.antesOk && vt.nome === 'Voltar' && vt.texto === '‹ Voltar' && vt.esq < 30, vt);
    check('Voltar: nome acessível "Voltar"', (await page.getByRole('button', { name: 'Voltar', exact: true }).count()) === 1);
    await page.click('#v'); await page.waitForTimeout(60);
    check('Voltar: da 2ª pergunta volta para a 1ª', (await titulo()).includes('por onde falam os clientes'), await titulo());
    await page.click('#v'); await page.waitForTimeout(60);
    const partidaV = await page.evaluate(() => { const c = document.querySelector('.cartao-q.partida'); return c ? { primeiro: c.firstElementChild.querySelector('#v') !== null, n: document.querySelectorAll('#v').length } : null; });
    check('Voltar: da 1ª pergunta volta ao ponto de partida, com o Voltar no topo do cartão', partidaV && partidaV.primeiro && partidaV.n === 1, partidaV);
    await page.click('#v'); await page.waitForTimeout(60);
    check('Voltar: do ponto de partida volta para a capa', !!(await page.$('#ir')));
    await resumo({});
    const vr = await page.evaluate(() => { const v = document.querySelectorAll('#v'); return { n: v.length, topo: v.length && document.querySelector('.corpo').firstElementChild.contains(v[0]) }; });
    check('Voltar: no resultado, um só e no topo', vr.n === 1 && vr.topo, vr);
    const termosAbaixo = await abrir('M10-01').then(() => page.evaluate(() => { const s = document.querySelector('.cartao-q .dica-toggle'); return s ? { fechado: !s.open, antes: !!(s.compareDocumentPosition(document.querySelector('#ok')) & 4) } : null; }));
    check('Menos texto: "Ver dica" recolhida antes das opções', termosAbaixo && termosAbaixo.fechado && termosAbaixo.antes, termosAbaixo);
  }
  { const sec = (h) => page.evaluate((h) => { const s = [...document.querySelectorAll('section.cartao')].find((x) => x.querySelector('h3').innerText === h); return s ? s.innerText.replace(/\s+/g, ' ') : ''; }, h);
    const acoesC = () => page.evaluate(() => [...document.querySelectorAll('#comecar .lista-comecar li')].map((x) => ({ o: x.dataset.origem, t: x.querySelector('.acao-c').innerText.replace(/\s+/g, ' '), p: (x.querySelector('.por-que') || {}).innerText || '' })));
    /* Gaby: começando (ideia), marcou "definição dos preços"; preço abaixo do custo; limite do Módulo 1 estourado */
    const hg = JSON.parse(JSON.stringify(HERANCA));
    hg['lg2-turma-a-m01'].R['M1.P01'] = { estado: 'opcao', opcao: 'Ainda está só na minha cabeça' };
    hg['lg2-turma-a-m01'].R['M1.P07'] = { estado: 'opcao', opcao: 'Até R$ 100' };
    hg['lg2-turma-a-m05'] = { versao: 3, R: { 'M5.P01': { estado: 'opcao', opcao: 'Mercadoria: compro pronto para revender' }, 'M5.P11': { estado: 'valor', valor: '100' }, 'M5.P12': { estado: 'valor', valor: '10' }, 'M5.P36': { estado: 'valor', valor: '8' } } };
    hg['lg2-turma-b-m06'].R['M6.P02'] = { estado: 'valor', valor: '1.500' };
    const eg = estadoAte('FIM', { 'M10-09': { estado: 'multi', opcoes: [], outro: 'Definição dos preços', naosei: false }, 'M10-10': { estado: 'escala', u: { 'Definição dos preços': 'piora muito' } } });
    eg.ini = Object.assign({}, INI, { preco: '8', estagio: 'Ainda é uma ideia' });
    await semear(eg, hg); await clicar('Continuar de onde parei');
    const pos = await page.evaluate(() => { const c = document.querySelector('#comecar'), e = document.querySelector('#entendemos'); return c && e ? { depoisEnt: !!(e.compareDocumentPosition(c) & 4), logoDepois: e.nextElementSibling === c, h: c.querySelector('h3').innerText } : null; });
    check('Por onde começar: logo depois de "O que entendemos até aqui", com o título certo', pos && pos.depoisEnt && pos.logoDepois && pos.h === 'Por onde começar', pos);
    const ag = await acoesC();
    check('Por onde começar (Gaby): 3 ações numeradas; a 1ª é o preço que ela marcou, com o aviso de preço abaixo do custo e a Etapa 5', ag.length === 3 && ag[0].o === 'prioridade' && ag[0].t.startsWith('Seu preço (R$ 8) está abaixo do custo de uma unidade (R$ 10). Refaça a conta do preço na Etapa 5') && ag[0].p.includes('Você marcou como prioridade') && ag[0].p.includes('Abrir a Etapa 5'), ag);
    check('Por onde começar (Gaby): depois o limite da Etapa 1 e a consulta na prefeitura, com texto de quem está começando', ag[1].o === 'conferir' && ag[1].t.includes('(até R$ 100)') && ag[1].t.includes('5 vendas-teste') && ag[2].o === 'lacuna' && ag[2].t.includes('consulta de viabilidade'), ag);
    check('Por onde começar: sem códigos nem nomes de pergunta', !ag.some((x) => /M\d+[.-]|P\d\d|Grupo \d/.test(x.t + x.p)));
    check('Pontos para conferir: preço abaixo do custo (Etapa 5)', (await sec('Pontos para conferir')).includes('Seu preço de venda é R$ 8, mas fazer uma unidade custa R$ 10.'), await sec('Pontos para conferir'));
    const nums = await page.evaluate(() => [...document.querySelectorAll('#comecar .num-c')].map((x) => (x.querySelector('.op-txt b') || x).innerText.trim()).join());
    check('Por onde começar: números 1, 2 e 3 à vista', nums === '1,2,3', nums);
    if (process.env.SHOTS) { await page.waitForTimeout(400); await (await page.$('#comecar')).screenshot({ path: path.join(process.env.SHOTS, 'l3_m10_comecar_gaby.png') }); }
    /* mesma prioridade, quem já vende: organizar e melhorar */
    const hv2 = JSON.parse(JSON.stringify(hg)); hv2['lg2-turma-a-m01'].R['M1.P01'] = { estado: 'opcao', opcao: 'Já vendo sempre' };
    await semear(Object.assign({}, eg, { ini: Object.assign({}, eg.ini, { estagio: 'Já vendo' }) }), hv2); await clicar('Continuar de onde parei');
    const av = await acoesC();
    check('Por onde começar (já vende): mesmas prioridades, texto de organizar e melhorar (anote as vendas da semana)', av[0].t.includes('anote as vendas da semana') && !av.some((x) => /vendas-teste/.test(x.t)) && (await page.evaluate(() => document.querySelector('.comecar-intro').innerText)).startsWith('Você já vende'), av);
    if (process.env.SHOTS) { await page.waitForTimeout(400); await (await page.$('#comecar')).screenshot({ path: path.join(process.env.SHOTS, 'l3_m10_comecar_ja_vende.png') }); }
    /* nada em aberto: ações gerais do estágio */
    const hn = { 'lg2-turma-a-m01': { R: { 'M1.P01': { estado: 'opcao', opcao: 'Já vendo sempre' }, 'M1.P03': { estado: 'valor', valor: 'Bolo de pote' } } } };
    const en = estadoAte('FIM', { SOCIO: { estado: 'opcao', opcao: 'Não' }, 'M10-07': undefined }); delete en.R['M10-06']; delete en.R['M10-07'];
    await semear(en, hn); await clicar('Continuar de onde parei');
    const an = await acoesC();
    check('Por onde começar (nada em aberto além da prioridade escrita): a prioridade e depois ações do estágio', an.length === 3 && an[0].o === 'prioridade' && an.slice(1).every((x) => x.o === 'estagio') && an[1].t.startsWith('Anote as vendas da semana'), an);
  }

  /* ---------- 4b. correções dos testes da turma (05/11) ---------- */
  /* sócio \"Não\": \"Sócio\" não é oferecido nas etapas; se já estava escolhido, aviso que não trava */
  await abrir('M10-07', { SOCIO: { estado: 'opcao', opcao: 'Não' } });
  { const ops7 = await page.evaluate(() => [...document.querySelectorAll('#ent .opcoes')].map((g) => [...g.querySelectorAll('.opcao')].map((x) => (x.querySelector('.op-txt b') || x).innerText.trim())));
    check('Sócio \"Não\": as etapas não oferecem \"Sócio\"', ops7.length === 3 && ops7.every((o) => !o.includes('Sócio') && o.includes('Eu')), ops7); }
  { const rS = { SOCIO: { estado: 'opcao', opcao: 'Não' }, 'M10-07': { estado: 'etapas', quem: { 'Receber o pedido': 'Sócio', Fazer: 'Sócio', Entregar: 'Sócio' } } };
    const est = estadoAte('FIM', rS); delete est.R['M10-06'];
    await semear(est); await clicar('Continuar de onde parei');
    const pcS = await page.evaluate(() => { const s = [...document.querySelectorAll('section.cartao')].find((x) => x.querySelector('h3').innerText === 'Pontos para conferir'); return s ? s.innerText.replace(/\s+/g, ' ') : ''; });
    check('Sócio \"Não\" x etapas pelo sócio = ponto para conferir no resultado', pcS.includes('Você respondeu que não tem sócio, mas marcou o sócio como responsável por: receber o pedido, fazer e entregar.') && pcS.includes('Veio das Etapas 7 e 10'), pcS);
    await clicar('Quero corrigir algo');
    await page.evaluate(() => [...document.querySelectorAll('.editar')].find((b) => b.dataset.c === 'M10-07').click());
    await page.waitForTimeout(60);
    const b7 = (await blocos()).join(' ');
    check('Sócio já escolhido: a opção continua na etapa e aparece o aviso, sem travar', b7.includes('Você respondeu que não tem sócio') && (await page.evaluate(() => [...document.querySelectorAll('#ent .opcao')].some((x) => x.innerText.trim() === 'Sócio'))), b7);
    await clicar('Continuar');
    check('Sócio já escolhido: o Continuar segue', !!(await page.$('#q12'))); }
  /* o erro some quando os campos são preenchidos */
  await abrir('M10-11', { 'M10-09': { estado: 'multi', opcoes: [], outro: 'Organizar a agenda' } });
  await clicar('Continuar');
  const erroVis = () => page.evaluate(() => { const e = document.querySelector('#erro'); return !e.hidden ? e.innerText : ''; });
  check('M10-11: sem ação e data, mostra o erro', (await erroVis()).startsWith('Escreva o que você vai fazer e até quando'));
  await page.fill('#acao', 'divulgar no grupo do bairro');
  check('M10-11: só a ação preenchida, o erro continua', (await erroVis()).startsWith('Escreva o que você vai fazer'));
  await page.fill('#data', dias(10));
  check('M10-11: ação e data preenchidas, o erro some sozinho', (await erroVis()) === '');
  await page.fill('#numero', 'cinco'); await clicar('Continuar');
  check('M10-11: número com texto = \"digite só números\", não grava', (await erroVis()).includes('digite só números') && (await titulo()).startsWith('Para sua prioridade'));
  await page.fill('#numero', '1.500');
  check('M10-11: número corrigido, o erro some', (await erroVis()) === '');
  await page.fill('#sinal', 'Juiz de Fora'); await page.selectOption('#unidade', 'vendas'); await page.waitForTimeout(800);
  check('M10-11: a frase certa aparece ao vivo (sem \"vierem 1.500 Juiz de Fora\")', (await blocos()).join(' ').includes('sinal de que funcionou: Juiz de Fora (meta: 1.500 vendas)'), await blocos());
  await clicar('Continuar');
  check('M10-11: 1.500 = aviso de valor alto (risco: único caso de 2 toques), sem travar', (await blocos()).join(' ').includes('1.500 parece muito para um primeiro passo') && (await titulo()).startsWith('Para sua prioridade'));
  await clicar('Continuar');
  check('M10-11: no 2º toque segue com a frase certa', !!(await page.$('#q12')) && (await page.evaluate((k) => JSON.parse(localStorage.getItem(k)).R['M10-11'].frase, CHAVE)).includes('sinal de que funcionou: Juiz de Fora (meta: 1.500 vendas)'));
  /* teclado do celular: campo e Continuar visíveis com a tela reduzida */
  for (const [cod, campo, extra] of [['M10-11', '#numero', { 'M10-09': { estado: 'multi', opcoes: [], outro: 'Organizar a agenda' } }], ['M10-09', '#outro', {}]]) {
    await page.setViewportSize({ width: 390, height: 844 });
    await abrir(cod, extra);
    await page.focus(campo); await page.waitForTimeout(350);
    await page.setViewportSize({ width: 390, height: 450 }); await page.waitForTimeout(400);
    const bx = await page.evaluate((c) => { const r = (s) => { const b = document.querySelector(s).getBoundingClientRect(); return [Math.round(b.top), Math.round(b.bottom)]; }; return { campo: r(c), ok: r('#ok'), h: window.innerHeight }; }, campo);
    check(`Teclado (${cod}): o campo e o Continuar ficam na tela (390x450)`, bx.campo[0] >= 0 && bx.campo[1] <= bx.h && bx.ok[0] >= 0 && bx.ok[1] <= bx.h, bx);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  check('Teclado: viewport com interactive-widget=resizes-content', (await page.evaluate(() => document.querySelector('meta[name=viewport]').content)).includes('interactive-widget=resizes-content'));
  /* preço do ponto de partida: texto bloqueia, valor alto avisa e segue */
  await semear(null); await clicar('Começar');
  await page.fill('#f-preco', 'doze'); await clicar('Continuar');
  check('Partida: preço com texto = \"digite só números\"', (await erroVis()).includes('digite só números'));
  await page.fill('#f-preco', '1500'); await clicar('Continuar');
  check('Partida: preço de R$ 1500 = aviso que não trava', (await erroVis()).includes('parece alto') && !(await page.$('.q')));
  await clicar('Continuar');
  check('Partida: 2º toque com o mesmo preço segue', !!(await page.$('.q')));
  /* retrato: \"Não sei\"/em branco de fato, Módulo 2 com as respostas e pontos para conferir entre módulos */
  { const hr = JSON.parse(JSON.stringify(HERANCA));
    Object.assign(hr['lg2-turma-a-m01'].R, { 'M1.P07': { estado: 'opcao', opcao: 'Até R$ 100' }, 'M1.P03A': { estado: 'opcao', opcao: 'Serviço: meu cliente paga pelo trabalho que realizo' } });
    hr['lg2-turma-b-m06'].R['M6.P02'] = { estado: 'valor', valor: '1.500' };
    hr['lg2-turma-a-m05'].R['M5.P01'] = { estado: 'opcao', opcao: 'Produto: eu compro materiais e faço o que vendo' };
    hr['lg2-turma-b-m08'] = { R: { 'M8.P02': { estado: 'opcao', opcao: 'Mercadoria' }, 'M8.P03': { estado: 'opcao', opcao: 'Minha casa' } } };
    hr['lg2-turma-b-m09'].R['M9-02'] = { estado: 'opcao', opcao: 'Não' };
    Object.assign(hr['lg2-turma-b-m02'].R, { 'M2.P02': { estado: 'valor', valor: 'Mães que trabalham fora. Problema que você resolve: falta de tempo para fazer sobremesa' }, 'M2.P20': { estado: 'valor', valor: 'Sabor de bolo caseiro' }, 'M2.P13': { estado: 'naosei' } });
    Object.assign(hr['lg2-turma-a-m04'].R, { 'M4.P19': { estado: 'naosei' }, 'M4.P10': { estado: 'valor', valor: '' } });
    /* 26/11: o "Não sei" da P19 (teste da primeira oferta) só conta para quem ainda não vende */
    { const hs = JSON.parse(JSON.stringify(hr)); await resumo({}, hs);
      const r4 = await page.evaluate(() => [...document.querySelectorAll('.retrato')].map((x) => x.innerText.replace(/\s+/g, ' '))[3] || '');
      check('Retrato: quem já vende não tem o \"Não sei\" do teste da Etapa 4 contado', r4.includes('Etapa 4') && !r4.includes('“Não sei”') && r4.includes('1 em branco'), r4); }
    hr['lg2-turma-a-m01'].R['M1.P01'] = { estado: 'opcao', opcao: 'Já fiz um pouco para testar ou dar de amostra' };
    const tr = await resumo({}, hr);
    const sec = (h) => page.evaluate((h) => { const s = [...document.querySelectorAll('section.cartao')].find((x) => x.querySelector('h3').innerText === h); return s ? s.innerText.replace(/\s+/g, ' ') : ''; }, h);
    const pc = await sec('Pontos para conferir');
    check('Pontos para conferir: limite da Etapa 1 x gasto da Etapa 6', pc.includes('Na Etapa 1 você disse que pode usar até R$ 100 no negócio sem faltar para as contas da casa. Mas na Etapa 6, a estimativa para começar é de R$ 1.500.') && pc.includes('Veio das Etapas 1 e 6'), pc);
    check('Pontos para conferir: tipo de oferta diferente entre as Etapas 1, 5 e 8', pc.includes('serviço (Etapa 1); produto (Etapa 5); mercadoria (Etapa 8)'), pc);
    check('Pontos para conferir: alimento x \"Não\" para a Vigilância Sanitária na Etapa 9', pc.includes('Você vende bolo de pote, que parece envolver alimento, mas na Etapa 9 respondeu') && pc.includes('Veio das Etapas 1 e 9'), pc);
    const ret = await page.evaluate(() => [...document.querySelectorAll('.retrato')].map((x) => x.innerText.replace(/\s+/g, ' ')));
    check('Retrato: não diz mais \"Sem respostas em aberto\"', !tr.includes('Sem respostas em aberto'));
    check('Retrato: Etapa 1 com o limite "até R$ 100" (sem minúscula no R$)', ret[0].includes('Dinheiro que pode usar: até R$ 100'), ret[0]);
    check('Retrato: Etapa 2 com clientes, problema que resolve, onde estão e pessoas ouvidas', ret[1].includes('Clientes: Mães que trabalham fora') && ret[1].includes('Problema que você resolve: falta de tempo para fazer sobremesa') && ret[1].includes('Onde estão os clientes: meu bairro') && ret[1].includes('Pessoas ouvidas: 6'), ret[1]);
    check('Retrato: Etapa 2 conta o \"Não sei\" e diz qual era a pergunta', ret[1].includes('Em aberto: 1 resposta “Não sei”. Falta: entender o que mais pesa na escolha do cliente.'), ret[1]);
    check('Retrato: Etapa 4 com \"Não sei\" e resposta em branco contados', ret[3].includes('Em aberto: 1 resposta “Não sei” e 1 em branco.'), ret[3]);
    check('Retrato: etapa sem pendência diz isso em linguagem simples', ret[2].includes('Nenhuma resposta “Não sei” ou em branco.'), ret[2]);
    check('Retrato: etapas com contradição apontam para \"Pontos para conferir\"', [0, 4, 5, 7, 8].every((i) => ret[i].includes('Há um ponto para conferir')) && !ret[2].includes('Há um ponto para conferir'), ret);
    /* mensagem de apresentação montada por modelo */
    const msg = await page.inputValue('#msg');
    check('Mensagem de apresentação: ideia + cliente + diferencial + local + canais', msg === 'Olá! Trabalho com bolo de pote para trabalhadores do bairro. Bolo fresco entregue no mesmo dia. Atendo na minha casa. Para pedir, fale comigo pelo WhatsApp.', msg);
    /* a caixa cresce com o texto: a mensagem inteira aparece sem rolar dentro dela */
    const rolaMsg = () => page.evaluate(() => { const t = document.querySelector('#msg'); return { sh: t.scrollHeight, ch: t.clientHeight }; });
    await page.waitForTimeout(100);
    const m0 = await rolaMsg();
    check('Mensagem de apresentação: ao abrir, a caixa mostra o texto inteiro (sem rolar)', m0.sh <= m0.ch + 2, m0);
    await page.fill('#msg', msg + ' Faço encomendas para festas e aniversários, com entrega no bairro e retirada combinada. Aceito Pix, dinheiro e cartão. Pergunte pelos sabores da semana e pelos kits para presente.');
    await page.waitForTimeout(100);
    const m1 = await rolaMsg();
    check('Mensagem de apresentação: ao digitar mais texto, a caixa cresce junto (sem rolar)', m1.sh <= m1.ch + 2 && m1.ch > m0.ch, { m0, m1 });
    await page.fill('#msg', msg);
  }
  /* proposta de valor do Módulo 4 (M4.PV1–PV3, estado v4): mensagem de apresentação, retrato e \"O que entendemos\" */
  { const PV = { 'M4.PV1': { estado: 'valor', valor: 'Falta de tempo para fazer sobremesa' }, 'M4.PV2': { estado: 'valor', valor: 'Porque o bolo é feito no dia, com receita de família' }, 'M4.PV3': { estado: 'valor', valor: 'Ter sobremesa caseira pronta sem sair de casa.' } };
    const FRASE_PV = 'Sua proposta de valor: o problema que você resolve é falta de tempo para fazer sobremesa; o cliente escolhe você porque o bolo é feito no dia, com receita de família; e o principal benefício para ele é ter sobremesa caseira pronta sem sair de casa.';
    const hv = JSON.parse(JSON.stringify(HERANCA)); hv['lg2-turma-a-m04'] = { v: 4, R: Object.assign({}, hv['lg2-turma-a-m04'].R, PV), hist: [] };
    hv['lg2-turma-b-m08'] = { R: { 'M8.P03': { estado: 'opcao', opcao: 'Minha casa' } } };
    await resumo({}, hv);
    const msgPV = await page.inputValue('#msg');
    check('Proposta de valor: mensagem usa o motivo da escolha (M4) como diferencial e o benefício (M4)', msgPV === 'Olá! Trabalho com bolo de pote para trabalhadores do bairro. O bolo é feito no dia, com receita de família. O que você ganha: ter sobremesa caseira pronta sem sair de casa. Atendo na minha casa. Para pedir, fale comigo pelo WhatsApp.', msgPV);
    const r4 = await page.evaluate(() => document.querySelectorAll('.retrato')[3].innerText.replace(/\s+/g, ' '));
    check('Proposta de valor: retrato da Etapa 4 em frase natural (problema, motivo, benefício)', r4.includes('Proposta de valor: ' + FRASE_PV.replace('Sua proposta de valor: ', '')) && !r4.includes('Falta na proposta de valor'), r4);
    const entPV = nrm(await page.evaluate(() => document.querySelector('#entendemos .resumo-negocio').innerText));
    check('Proposta de valor: \"O que entendemos até aqui\" traz a frase logo depois do cliente', entPV.includes('Você vende para trabalhadores do bairro. ' + FRASE_PV + ' Você cobra R$ 12'), entPV);
    /* parcial: \"Não sei\" e em branco ficam de fora da frase e aparecem como falta */
    const hp = JSON.parse(JSON.stringify(hv)); hp['lg2-turma-a-m04'].R['M4.PV2'] = { estado: 'naosei' }; hp['lg2-turma-a-m04'].R['M4.PV3'] = { estado: 'valor', valor: '' };
    await resumo({}, hp);
    const r4p = await page.evaluate(() => document.querySelectorAll('.retrato')[3].innerText.replace(/\s+/g, ' '));
    check('Proposta de valor: \"Não sei\"/em branco = omitidos e listados como falta', r4p.includes('Proposta de valor: o problema que você resolve é falta de tempo para fazer sobremesa.') && r4p.includes('Falta na proposta de valor: por que o cliente escolheria você e o principal benefício para o cliente') && r4p.includes('Falta: dizer por que o cliente escolheria você em vez de outro'), r4p);
    const msgP = await page.inputValue('#msg');
    check('Proposta de valor: sem motivo nem benefício, a mensagem volta ao diferencial do Módulo 3', msgP === 'Olá! Trabalho com bolo de pote para trabalhadores do bairro. Bolo fresco entregue no mesmo dia. Atendo na minha casa. Para pedir, fale comigo pelo WhatsApp.', msgP);
    /* estado antigo do Módulo 4 (v3, sem PV): tudo como antes */
    const h3 = JSON.parse(JSON.stringify(hv)); h3['lg2-turma-a-m04'] = { v: 3, R: JSON.parse(JSON.stringify(HERANCA['lg2-turma-a-m04'].R)), hist: [] };
    await resumo({}, h3);
    const msg3 = await page.inputValue('#msg');
    const r43 = await page.evaluate(() => document.querySelectorAll('.retrato')[3].innerText.replace(/\s+/g, ' '));
    const ent3 = nrm(await page.evaluate(() => document.querySelector('#entendemos .resumo-negocio').innerText));
    check('Proposta de valor: Etapa 4 antigo (v3, sem PV) = mensagem, retrato e resumo de antes', msg3 === msgP && r43.includes('Proposta de valor: Sobremesa caseira pronta para levar.') && !r43.includes('Falta na proposta') && !ent3.includes('proposta de valor'), { msg3, r43, ent3 });
    /* a parte \"problema\" que já saiu como dor do cliente (M4.P09) não se repete */
    const dup = RN.frases((n) => (n === 4 ? { v: 4, R: { 'M4.P08': { estado: 'valor', valor: 'Mães' }, 'M4.P09': { estado: 'valor', valor: 'Falta de tempo' }, 'M4.PV1': { estado: 'valor', valor: 'falta de tempo.' }, 'M4.PV3': { estado: 'valor', valor: 'Sobremesa pronta' } } } : null));
    check('Proposta de valor: problema igual à dor do cliente não se repete', JSON.stringify(dup) === JSON.stringify(['Você vende para mães e ajuda com falta de tempo.', 'Sua proposta de valor: o principal benefício para ele é sobremesa pronta.']), dup);
    check('Proposta de valor: tudo \"Não sei\" = nenhuma frase', RN.frases((n) => (n === 4 ? { v: 4, R: { 'M4.PV1': { estado: 'naosei' }, 'M4.PV2': { estado: 'valor', valor: 'Não sei' }, 'M4.PV3': { estado: 'valor', valor: ' ' } } } : null)).length === 0);
    if (process.env.SHOTS) { fs.mkdirSync(process.env.SHOTS, { recursive: true }); await resumo({}, hv); await page.waitForTimeout(400);
      await (await page.$('#entendemos')).screenshot({ path: path.join(process.env.SHOTS, 'm10b_pv_entendemos.png') });
      await page.evaluate(() => document.querySelectorAll('.retrato')[3].scrollIntoView({ block: 'center' })); await page.waitForTimeout(400);
      await page.screenshot({ path: path.join(process.env.SHOTS, 'm10b_pv_retrato.png') });
      await page.evaluate(() => document.querySelector('#msg').scrollIntoView({ block: 'center' })); await page.waitForTimeout(400);
      await page.screenshot({ path: path.join(process.env.SHOTS, 'm10b_pv_mensagem.png') }); }
  }
  { const h0 = JSON.parse(JSON.stringify(HERANCA)); delete h0['lg2-turma-a-m01'];
    const est = estadoAte('FIM'); est.ini = Object.assign({}, INI, { oferta: '' });
    await semear(est, h0); await clicar('Continuar de onde parei'); await page.evaluate(() => document.querySelector('.resultado-mais').open=true);
    const falta = await page.evaluate(() => (document.querySelector('#msg-falta') || {}).innerText || '');
    check('Mensagem de apresentação: sem a ideia, diz o que falta em vez de ficar vazia', falta.startsWith('Para montar a mensagem, falta: o que você vende (Etapa 1)') && falta.includes('onde você atende'), falta); }
  { /* mensagem antiga gravada vazia: volta a ser montada */
    const est = estadoAte('FIM'); est.inst = { mensagem: '', checklist: {} };
    await semear(est); await clicar('Continuar de onde parei'); await page.evaluate(() => document.querySelector('.resultado-mais').open=true);
    check('Mensagem de apresentação: a gravada vazia antes é montada de novo', (await page.inputValue('#msg')).startsWith('Olá! Trabalho com bolo de pote')); }

  /* ---------- 4c. lote 16/11: \"Não sei\" antigo, contas \"Como calculamos\", exemplos ---------- */
  { /* estado v2 com \"Não sei\" salvo: vira sem resposta; o resto fica */
    const v2 = estadoAte('FIM', {
      'M10-02': { estado: 'naosei' },
      'M10-05': { estado: 'opcao', opcao: 'Ainda não sei' },
      'M10-07': { estado: 'etapas', quem: { 'Preparar pedidos': 'Eu', 'Produzir encomendas': 'Ajudante', 'Falar com clientes': 'Eu' } },
      'M10-10': { estado: 'escala', u: { 'Organizar a agenda': 'piora muito', 'Rever embalagem': 'não sei' } },
      'M10-11': { estado: 'plano', acao: 'Montar calendário de pedidos', data: '2099-03-10', sinal: 'Pedidos recebidos', numero: '4', unidade: 'pedidos', frase: 'Montar calendário até 10/03/2099; vai funcionar se vierem 4 pedidos.' },
    });
    v2.prioridade = 'Organizar a agenda';
    await semear(v2);
    const st = await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('lg2-turma-b-m10')); return s; });
    await clicar('Continuar de onde parei');
    const st2 = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)), CHAVE);
    check('Migração (formato real): só "Não sei" perde resposta; sócio, etapas, escala e plano ficam', st2.v === 3 && !st2.R['M10-02'] && !st2.R['M10-05'] && st2.R.SOCIO.opcao === 'Sim' && JSON.stringify(st2.R['M10-07'].quem) === JSON.stringify(v2.R['M10-07'].quem) && JSON.stringify(st2.R['M10-10'].u) === JSON.stringify({ 'Organizar a agenda': 'piora muito' }) && ['acao','data','sinal','numero','unidade'].every((k) => st2.R['M10-11'][k] === v2.R['M10-11'][k]) && st2.ini.oferta === 'Bolo de pote', { version: st2.v, soc: st2.R.SOCIO.opcao, etapas: st2.R['M10-07'], escala: st2.R['M10-10'], plano: Object.fromEntries(['acao','data','sinal','numero','unidade'].map((k) => [k,st2.R['M10-11'][k]])) });
    check('Migração: "Continuar de onde parei" abre a 1ª pergunta que ficou sem resposta (M10-02)', (await titulo()).startsWith('Em quanto tempo'), await titulo());
  }
  { /* v2 no-lacunas com os formatos reais da coordenadora, mas com conteúdo inventado; carregar deve mostrar o resultado sem perder campos. */
    const v2Completo = estadoAte('FIM'); v2Completo.prioridade = 'Organizar a agenda';
    v2Completo.R['M10-07'] = { estado: 'etapas', quem: { 'Preparar pedidos': 'Eu', 'Separar embalagens': 'Ajudante', 'Responder clientes': 'Eu' } };
    v2Completo.R['M10-10'] = { estado: 'escala', u: { 'Organizar a agenda': 'piora muito' } };
    v2Completo.R['M10-11'] = { estado: 'plano', acao: 'Montar calendário de pedidos', data: '2099-03-10', sinal: 'Pedidos recebidos', numero: '4', unidade: 'pedidos', frase: 'Montar calendário até 10/03/2099; vai funcionar se vierem 4 pedidos.' };
    v2Completo.v = 2;
    await semear(v2Completo); await clicar('Continuar de onde parei');
    const migrado = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)), CHAVE);
    const rep = await page.evaluate(() => document.querySelector('.corpo').innerText.replace(/\\s+/g, ' '));
    check('Migração formato real (inventado): SOCIO, etapas M10-07, escala M10-10 e plano M10-11 aparecem no resultado', migrado.v === 3 && migrado.R.SOCIO.opcao === 'Sim' && migrado.R['M10-07'].quem['Separar embalagens'] === 'Ajudante' && migrado.R['M10-10'].u['Organizar a agenda'] === 'piora muito' && migrado.R['M10-11'].acao === 'Montar calendário de pedidos' && rep.includes('Separar embalagens') && rep.includes('Responsável: Ajudante') && rep.includes('Organizar a agenda: Piora muito') && rep.includes('Montar calendário de pedidos'), { state: migrado.v, resultado: rep.includes('Separar embalagens') && rep.includes('Organizar a agenda: Piora muito') && rep.includes('Montar calendário de pedidos') });
  }
  { /* contas do resumo conferidas à mão: preço 60 (preço 60, custo 7, taxa 3, gastos 50 + 1.000; M6 800 − 500; M7 até 10 h, apoio 2 h, 30 min) */
    const hl = JSON.parse(JSON.stringify(HERANCA)); hl['lg2-turma-a-m05'] = LAVA[5]; hl['lg2-turma-b-m06'] = LAVA[6];
    const e = estadoAte('FIM'); e.ini = Object.assign({}, INI, { preco: '60' });
    await semear(e, hl); await clicar('Continuar de onde parei');
    const contas = await page.evaluate(() => [...document.querySelectorAll('#entendemos .como-calc')].map((x) => x.innerText.replace(/\s+/g, ' ').trim()));
    const ESP_CONTAS = [
      'Como calculamos: R$ 60 (preço) − R$ 7 (custo de uma unidade) − R$ 3 (taxas) = R$ 50 de sobra em cada venda.',
      'Como calculamos: R$ 50 + R$ 1.000 = R$ 1.050 (gastos do mês informados na Etapa 5).',
      'Como calculamos: R$ 1.050 (gastos do mês) ÷ R$ 50 (sobra por venda) = 21 vendas por mês.',
      'Como calculamos: R$ 800 (para começar) − R$ 500 (o que você tem) = R$ 300 que faltam.',
      'Como calculamos: (10 h por semana − 2 h de apoio) × 60 = 480 min por semana; × 4,33 semanas = 2.078 min por mês; ÷ 30 min por unidade = 69 por mês (arredondado para baixo).',
    ];
    check('Como calculamos (resumo): 5 contas com os valores da pessoa, conferidas à mão', JSON.stringify(contas) === JSON.stringify(ESP_CONTAS), contas);
    const par = nrm(await page.evaluate(() => document.querySelector('#entendemos .resumo-negocio').innerText));
    check('Como calculamos: os números da conta são os mesmos do texto (sobram R$ 50; 21 vendas; faltam R$ 300; no máximo 69)', par.includes('sobram R$ 50') && par.includes('21 vendas') && par.includes('faltam R$ 300') && par.includes('no máximo 69'), par);
    await page.evaluate(() => document.querySelector('.resultado-mais').open = true);
    const r7 = await page.evaluate(() => document.querySelectorAll('.retrato')[6].innerText.replace(/\s+/g, ' '));
    check('Como calculamos (retrato da Etapa 7): a capacidade vem com a conta', r7.includes('Cabem no máximo 69 por mês') && r7.includes('÷ 30 min por unidade = 69 por mês'), r7);
    /* M10-08: contratar com folga = 69 − 55 = 14 */
    await abrir('M10-08'); await clicar('Sim, para vender ou divulgar');
    const cf = (await blocos()).join(' ');
    check('Como calculamos (folga do M10-08): 69 (o que cabe por mês) − 55 (o que você pretende fazer) = 14', cf.includes('Como calculamos: 69 (o que cabe por mês) − 55 (o que você pretende fazer) = 14 por mês.'), cf);
    /* preço abaixo do custo com taxa: 7 + 5% de 8 (0,40) = 7,40 */
    const hb = JSON.parse(JSON.stringify(hl)); const eb = estadoAte('FIM'); eb.ini = Object.assign({}, INI, { preco: '6' });
    await semear(eb, hb); await clicar('Continuar de onde parei');
    const pcb = await page.evaluate(() => { const s = [...document.querySelectorAll('section.cartao')].find((x) => x.querySelector('h3').innerText === 'Pontos para conferir'); return s ? s.innerText.replace(/\s+/g, ' ') : ''; });
    check('Como calculamos (preço abaixo do custo): R$ 7 + R$ 0,30 (taxas, 5% do preço) = R$ 7,30', pcb.includes('Como calculamos: R$ 7 (custo de uma unidade) + R$ 0,30 (taxas, 5% do preço) = R$ 7,30.'), pcb);
  }
  { /* exemplos embaixo das opções difíceis (o texto da opção não muda) */
    await abrir('M10-05');
    const ex = await page.evaluate(() => Object.fromEntries([...document.querySelectorAll('#ent .opcao')].map((x) => [x.querySelector('.op-txt b').innerText.trim(), (x.querySelector('.op-ex') || {}).innerText || ''])));
    check('Exemplos (M10-05): Parceria, Marketplace, Grupos do bairro e Anúncio pago têm linha \"Ex.:\"', ['Parceria', 'Marketplace', 'Grupos do bairro', 'Anúncio pago', 'Redes sociais'].every((k) => (ex[k] || '').startsWith('Ex.:')), ex);
    await semear(null); await clicar('Começar');
    const ph = await page.evaluate(() => document.querySelector('#f-canais').placeholder);
    check('Exemplos (partida): onde o cliente encontra você = \"Ex.: Instagram, WhatsApp, indicação de amigos, feira do bairro\"', ph === 'Ex.: Instagram, WhatsApp, indicação de amigos, feira do bairro', ph);
    if (process.env.SHOTS) { await page.waitForTimeout(400); await page.screenshot({ path: path.join(process.env.SHOTS, 'm10_partida_exemplos.png') }); }
  }

  /* ---------- 5. percurso inteiro, com dados herdados ---------- */
  await semear(null);
  if (process.env.SHOTS) fs.mkdirSync(process.env.SHOTS, { recursive: true });
  const foto = async (n) => { if (process.env.SHOTS) { await page.waitForTimeout(350); await page.screenshot({ path: path.join(process.env.SHOTS, n + '.png'), fullPage: n.includes('resultado') }); } };
  await foto('m10_capa');
  { const tc = nrm(await page.evaluate(() => document.body.innerText));
    check('Capa leve: frase, tempo, começar; detalhes recolhidos', tc.includes('Organize como você vende') && tc.includes('cerca de 10 minutos') && tc.includes('Começar') && tc.includes('Como funciona') && !tc.includes(nrm(CAPA_PDF['para_quem'])), tc.slice(0, 300)); }
  await clicar('Começar');
  const partida = await page.evaluate(() => Object.fromEntries([...document.querySelectorAll('[data-campo]')].map((i) => [i.dataset.campo, i.value])));
  check('Partida: dados herdados das Etapas 1, 3, 4, 5 e 6', partida.oferta === 'Bolo de pote' && partida.proposta === 'Sobremesa caseira pronta para levar.' && partida.preco === '12' && partida.pagamento === 'Pix, Dinheiro' && partida.canais.startsWith('Redes sociais'), partida);
  check('Partida: selo "Veio da Etapa N"', (await page.evaluate(() => document.querySelectorAll('.veio').length)) >= 8);
  await foto('m10_partida');
  { /* preço sugerido na Etapa 5 quando não há preço digitado lá */
    const hp = JSON.parse(JSON.stringify(HERANCA)); hp['lg2-turma-a-m05'] = { versao: 3, lucro: '50', R: { 'M5.P01': { estado: 'opcao', opcao: 'Mercadoria: compro pronto para revender' }, 'M5.P11': { estado: 'valor', valor: '100' }, 'M5.P12': { estado: 'valor', valor: '10' }, 'M5.P36': { estado: 'opcao', opcao: 'Ainda não defini' } } };
    await semear(null, hp); await clicar('Começar');
    check('Partida: sem preço digitado na Etapa 5, vem o preço sugerido lá (R$ 15) com selo', (await page.inputValue('#f-preco')) === '15' && (await page.evaluate(() => document.querySelector('label[for=f-preco]').innerText)).includes('Veio da Etapa 5'));
    const cp = await page.evaluate(() => (document.querySelector('#como-preco') || {}).innerText || '');
    check('Como calculamos (preço sugerido): R$ 10 (custo de uma unidade) + 50% (acréscimo escolhido na Etapa 5) = R$ 15', nrm(cp) === 'Como calculamos: R$ 10 (custo de uma unidade) + 50% (acréscimo escolhido na Etapa 5) = R$ 15.', cp);
    await page.fill('#f-preco', '18');
    check('Como calculamos (preço sugerido): some quando a pessoa troca o preço', await page.evaluate(() => document.querySelector('#como-preco').hidden));
    /* 26/11 (coordenação): "Como chega ao cliente" vazio não deixa seguir */
    { await semear(Object.assign(estadoAte('M10-01'), { ini: Object.assign({}, INI, { entrega: '' }) })); await clicar('Continuar de onde parei');
      await page.evaluate(() => { const v = document.querySelector('#v'); if (v && !document.querySelector('#f-entrega')) v.click(); });
      await page.waitForTimeout(300);
      if (await page.$('#f-entrega')) { await page.fill('#f-entrega', ''); await clicar('Continuar'); await page.waitForTimeout(200);
        const er = await page.evaluate(() => { const e = document.querySelector('#erro'); return e && !e.hidden ? e.innerText : ''; });
        check('Partida: "Como chega ao cliente" vazio bloqueia com mensagem', !!(await page.$('#f-entrega')) && /Como chega ao cliente/.test(er), er);
        await page.fill('#f-entrega', 'Retirada'); await clicar('Continuar'); await page.waitForTimeout(300);
        check('Partida: com "Como chega ao cliente" preenchido segue', !(await page.$('#f-entrega')));
      } else check('Partida: tela do ponto de partida alcançada para testar "Como chega ao cliente"', false); }
    /* ponto de partida já salvo com o preço vazio (Módulo 5 feito depois): completa sem apagar o resto */
    await semear(Object.assign(estadoAte('M10-01'), { ini: Object.assign({}, INI, { preco: '', oferta: 'Bolo no pote', de: {} }) }));
    const ini2 = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)).ini, CHAVE);
    check('Partida: campo vazio recebe o dado que apareceu depois nas outras etapas; o que foi escrito fica', ini2.preco === '12' && ini2.de.preco === 5 && ini2.oferta === 'Bolo no pote', ini2);
    await semear(null); await clicar('Começar'); }
  await clicar('Continuar');
  const passos = [], telas = [], vistos = [];
  /* C: Continuar inteiro dentro da tela, sem rolar, em 360x640, 390x844 com letra 130% e 740x360 (deitado) */
  const continuarAVista = async (q) => {
    const out = { q, ok: true, medidas: [] };
    for (const [w, h, fonte] of [[360, 640, ''], [390, 844, '130%'], [740, 360, '']]) {
      await page.setViewportSize({ width: w, height: h });
      const m = await page.evaluate((f) => { document.documentElement.style.fontSize = f; window.scrollTo(0, 0); return new Promise((r) => requestAnimationFrame(() => { const b = document.querySelector('#ok').getBoundingClientRect(); r({ top: Math.round(b.top), bottom: Math.round(b.bottom), h: window.innerHeight, w: window.innerWidth, sy: window.scrollY }); })); }, fonte);
      m.vp = `${w}x${h}${fonte ? ' ' + fonte : ''}`;
      out.medidas.push(m);
      if (!(m.top >= 0 && m.bottom <= m.h && m.sy === 0)) out.ok = false;
    }
    await page.evaluate(() => { document.documentElement.style.fontSize = ''; window.scrollTo(0, 0); });
    await page.setViewportSize({ width: 390, height: 844 });
    return out;
  };
  for (let i = 0; i < 20; i++) {
    if (await page.$('#q12')) break;
    const q = await titulo(); passos.push(q);
    /* 17/11: estado da tela antes de responder (foco, barra, botões extras, "Módulo", Continuar ativo) e o Continuar à vista em 3 telas */
    telas.push(Object.assign({ q }, await page.evaluate(() => ({ foco: document.activeElement && document.activeElement.id, focoTxt: document.activeElement && document.activeElement.innerText, pct: +document.querySelector('.heroi-prog [role=progressbar]').getAttribute('aria-valuenow'), extra: [...document.querySelectorAll('button')].filter((b) => /^(Seguir|Corrigir minha resposta)$/.test(b.textContent.trim())).length, desab: document.querySelector('#ok').disabled, modulo: /m[óo]dulos?\b/i.test(document.body.innerText) }))));
    vistos.push(await continuarAVista(q));
    if (/falam os clientes/.test(q)) { await clicar('Telefone'); await foto('m10_pergunta'); }
    else if (/Em quanto tempo/.test(q)) await clicar('No mesmo dia');
    else if (/sequência/.test(q)) { await clicar('Depende do cliente'); await foto('m10_roteiro'); }
    else if (/Depois da entrega/.test(q)) await clicar('Sim, peço opinião');
    else if (/vão saber/.test(q)) await clicar('Grupos do bairro');
    else if (/sócio\?/.test(q)) await clicar('Não');
    else if (/Quem cuida/.test(q)) await porEtapa([0, 0, 2]); /* sócio "Não": Eu, Ajudante, Ninguém ainda */
    else if (/contratar alguém/.test(q)) await clicar('Não');
    else if (/mais urgentes/.test(q)) { await page.evaluate(() => [...document.querySelectorAll('#ent .opcao')].slice(0, 2).forEach((b) => b.click())); await foto('m10_prioridades'); }
    else if (/após 3 meses/.test(q)) await page.evaluate(() => [...document.querySelectorAll('#ent .opcoes')].forEach((g, i) => g.querySelectorAll('.opcao')[i].click()));
    else if (/prioridade mais urgente/.test(q)) { await page.selectOption('#unidade', 'respostas'); await planoVivo('fazer a consulta de viabilidade', dias(7), 'resposta da prefeitura', '1'); await foto('m10_plano'); }
    await page.waitForTimeout(60);
    await clicar('Continuar');
  }
  check('Percurso: sócio "Não" pula o acordo; contratar "Não" pula as alternativas', passos.length === 11 && !passos.some((x) => /combinaram|outras formas/.test(x)), passos);
  check('A: percurso inteiro com UM toque em Continuar por pergunta (nenhuma tela repete) e sem "Seguir"/"Corrigir minha resposta"', passos.every((x, i) => i === 0 || x !== passos[i - 1]) && telas.every((t) => t.extra === 0), telas.map((t) => [t.q.slice(0, 30), t.extra]));
  check('B: Continuar nunca desativado nas perguntas', telas.every((t) => t.desab === false));
  check('C: Continuar inteiro na tela, sem rolar, em 360x640, 390x844 (letra 130%) e 740x360, em todas as perguntas', vistos.length === 11 && vistos.every((v) => v.ok), vistos.filter((v) => !v.ok));
  check('D: depois de Continuar, o foco está no enunciado da pergunta nova', telas.every((t) => t.foco === 'pergunta' && nrm(t.focoTxt) === nrm(t.q)), telas.map((t) => [t.foco, t.q.slice(0, 20)]));
  check('E: nenhuma tela de pergunta diz "Módulo"', telas.every((t) => !t.modulo), telas.filter((t) => t.modulo).map((t) => t.q));
  check('G: barra de progresso com total estável, sempre para a frente', telas.every((t, i) => i === 0 || t.pct > telas[i - 1].pct), telas.map((t) => t.pct));
  { const fimTxt = await page.evaluate(() => { document.querySelectorAll('details').forEach((d) => { d.open = true; }); return document.body.innerText; });
    check('E: resultado sem "Módulo" no texto visível; link final "Voltar às etapas" dentro de .acoes.lg2-proximo', !/m[óo]dulos?\b/i.test(fimTxt) && (await page.evaluate(() => document.querySelector('.acoes.lg2-proximo a').textContent.trim())) === 'Voltar às etapas' && await page.isVisible('.lg2-proximo a'), (fimTxt.match(/.{0,40}m[óo]dulos?\b.{0,20}/gi) || []).slice(0, 5)); }
  await foto('m10_resultado');
  check('Resultado leve: todas as seções recolhíveis começam abertas', await page.evaluate(() => [...document.querySelectorAll('.resultado-mais')].length === 1 && [...document.querySelectorAll('.corpo details')].length > 0 && [...document.querySelectorAll('.corpo details')].every((d) => d.open)));
  await page.evaluate(() => document.querySelectorAll('.resultado-mais').forEach((d) => { d.open = true; }));
  const r1 = await page.evaluate(() => document.querySelector('.corpo').innerText.replace(/\s+/g, ' '));
  check('Resultado: plano com a frase e prioridades', r1.includes('Fazer a consulta de viabilidade até') && r1.includes('sinal de que funcionou: resposta da prefeitura (meta: 1 resposta).'), r1.slice(0, 900));
  check('Resultado: roteiro "base" com pós-venda', r1.includes('Roteiro de venda (base)') && r1.includes('Depois da entrega: pedir a opinião do cliente'));
  check('Resultado: etapa sem responsável vira prioridade na lista seguinte', r1.includes('Entregar') && r1.includes('Responsável: Ninguém ainda'));
  check('Resultado sem sócio: dica de sociedade não aparece', !(await page.$('.dica-sociedade')));
  const estadoSemSocio = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)), CHAVE);
  const estadoComSocio = JSON.parse(JSON.stringify(estadoSemSocio));
  estadoComSocio.R.SOCIO = { estado: 'opcao', opcao: 'Sim' };
  estadoComSocio.R['M10-06'] = { estado: 'opcao', opcao: 'Só combinamos de boca' };
  await semear(estadoComSocio, HERANCA); await clicar('Continuar de onde parei');
  check('Resultado com sócio: inclui a dica completa e deixa os detalhes abertos', await page.evaluate(() => !!document.querySelector('.dica-sociedade') && [...document.querySelectorAll('.corpo details')].every((d) => d.open) && document.querySelector('.dica-sociedade').innerText.includes('Ana produz e Bia vende')));
  await semear(estadoSemSocio, HERANCA); await clicar('Continuar de onde parei');
  await page.reload();
  check('Recarregar: retoma no resultado', (await page.evaluate(() => document.querySelector('#ir').innerText)) === 'Continuar de onde parei');
  await clicar('Continuar de onde parei'); await page.evaluate(() => document.querySelector('.resultado-mais').open=true);
  check('Recarregar: o resultado volta igual', (await page.evaluate(() => document.querySelector('.corpo').innerText.replace(/\s+/g, ' '))) === r1);
  /* corrigir uma resposta e voltar ao resumo */
  await clicar('Quero corrigir algo');
  await page.evaluate(() => [...document.querySelectorAll('.editar')].find((b) => b.closest('.corr-item').innerText.includes('Em quanto tempo')).click());
  await clicar('Mais de 2 dias'); await clicar('Continuar'); await page.evaluate(() => document.querySelector('.resultado-mais').open=true);
  check('Corrigir: volta direto ao resumo com a resposta nova', (await page.$('#q12')) && (await page.evaluate(() => document.querySelector('.corpo').innerText)).includes('Mais de 2 dias'));
  /* estado salvo da versão anterior (sem v: 2) é descartado */
  await page.evaluate((k) => { localStorage.setItem(k, JSON.stringify({ R: { 'M10.P01': { estado: 'opcao', opcao: 'Até 1 hora' } }, hist: [] })); }, CHAVE);
  await page.reload();
  check('Versão: respostas da versão anterior são descartadas', (await page.evaluate(() => document.querySelector('#ir').innerText)) === 'Começar');
  /* recomeçar */
  await semear(estadoAte('FIM'));
  await clicar('Continuar de onde parei'); await clicar('Recomeçar do zero');
  check('Recomeçar: apaga só a Etapa 10', (await page.evaluate((k) => localStorage.getItem(k) === null && localStorage.getItem('lg2-turma-b-m07') !== null, CHAVE)));
  check('Nunca escreve nas chaves dos outros etapas', (await page.evaluate((h) => Object.entries(h).every(([k, v]) => localStorage.getItem(k) === JSON.stringify(v)), HERANCA)));

  /* ---------- 6. jornada concluída: resumo do negócio (lê as mesmas chaves, mesma origem) ---------- */
  {
    const PUB = path.resolve(__dirname, '../public');
    const srvJ = http.createServer((req, res) => {
      const f = path.join(PUB, decodeURIComponent(req.url.split('?')[0]));
      if (!f.startsWith(PUB) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
      res.writeHead(200, { 'Content-Type': TIPOS[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
    });
    await new Promise((r) => srvJ.listen(0, '127.0.0.1', r));
    const pj = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const errJ = []; pj.on('pageerror', (e) => errJ.push(e.message)); pj.on('response', (r) => { if (r.status() >= 400) errJ.push(r.status() + ' ' + r.url()); });
    const base = `http://127.0.0.1:${srvJ.address().port}`;
    await pj.goto(base + '/lg2/jornada/index.html');
    await pj.evaluate((L) => {
      localStorage.clear();
      Object.entries(L).forEach(([n, v]) => localStorage.setItem({ 1: 'lg2-turma-a-m01', 3: 'lg2-turma-a-m03', 4: 'lg2-turma-a-m04', 5: 'lg2-turma-a-m05', 6: 'lg2-turma-b-m06', 7: 'lg2-turma-b-m07', 8: 'lg2-turma-b-m08', 9: 'lg2-turma-b-m09', 10: 'lg2-turma-b-m10' }[n], JSON.stringify(v)));
      localStorage.setItem('lg2-jornada', JSON.stringify({ v: 1, feitos: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], atual: null }));
    }, LAVA);
    await pj.reload(); await pj.waitForSelector('#fim:not([hidden])');
    const rj = await pj.evaluate(() => ({ vis: !document.getElementById('resumo-negocio').hidden, h: document.querySelector('#resumo-negocio h3').innerText, p: document.getElementById('resumo-texto').innerText }));
    check('Jornada concluída: mostra o resumo do negócio (8 frases, mesmo texto da Etapa 10)', rj.vis && rj.h === 'Resumo do seu negócio' && nrm(rj.p) === RESUMO_LAVA.join(' '), rj);
    if (process.env.SHOTS) { await pj.waitForTimeout(400); await pj.screenshot({ path: path.join(process.env.SHOTS, 'm10_jornada_concluida.png'), fullPage: true }); }
    await pj.evaluate(() => { Object.keys(localStorage).filter((k) => k !== 'lg2-jornada').forEach((k) => localStorage.removeItem(k)); });
    await pj.reload(); await pj.waitForSelector('#fim:not([hidden])');
    check('Jornada concluída sem respostas: a caixa do resumo não aparece', await pj.evaluate(() => document.getElementById('resumo-negocio').hidden));
    check('Jornada: sem erros nem arquivos faltando', errJ.length === 0, errJ);
    await pj.close(); srvJ.close();
  }


  /* ---------- 7. lote 17/11 \"tira a fricção\" ---------- */
  { /* B6: as palavras da própria pessoa não mudam de caixa (marcas e nomes de rede) */
    await semear(Object.assign(estadoAte('M10-01'), { ini: Object.assign({}, INI, { canais: 'Instagram e WhatsApp, Indicação' }) })); await clicar('Continuar de onde parei');
    check('B6: \"Instagram e WhatsApp\" ficam como a pessoa escreveu; \"Indicação\" vira minúscula', (await titulo()) === 'Além de Instagram e WhatsApp e indicação, por onde falam os clientes?', await titulo());
    await semear(Object.assign(estadoAte('M10-01'), { ini: Object.assign({}, INI, { canais: 'TikTok, iFood, Feira do bairro, PIX' }) })); await clicar('Continuar de onde parei');
    check('B6: TikTok, iFood e siglas não mudam; palavra comum capitalizada vira minúscula', (await titulo()) === 'Além de TikTok, iFood, feira do bairro e PIX, por onde falam os clientes?', await titulo());
    /* roteiro de venda: pagamento e entrega com marca */
    await semear(Object.assign(estadoAte('M10-03'), { ini: Object.assign({}, INI, { pagamento: 'Pix, Dinheiro', entrega: 'Uber Flash ou retirada' }) })); await clicar('Continuar de onde parei');
    const rot = await page.evaluate(() => [...document.querySelectorAll('.etapas-edicao input')].map((i) => i.value));
    check('B6: roteiro com \"Receber: Pix, dinheiro\" e \"Combinar a entrega: Uber Flash ou retirada\"', rot.includes('Receber: Pix, dinheiro') && rot.includes('Combinar a entrega: Uber Flash ou retirada'), rot);
    /* [oferta em foco]: oferta longa ou com \":\" não quebra a frase */
    for (const [o, esp] of [['Doces caseiros: brigadeiro gourmet e bolo de pote', 'Como as pessoas vão saber que o seu negócio existe nas próximas semanas?'],
      ['Conserto de celulares, tablets e notebooks com garantia', 'Como as pessoas vão saber que o seu negócio existe nas próximas semanas?'],
      ['Marmitas fit', 'Como as pessoas vão saber que marmitas fit existe nas próximas semanas?'],
      ['', 'Como as pessoas vão saber que o seu negócio existe nas próximas semanas?']]) {
      await semear(Object.assign(estadoAte('M10-05'), { ini: Object.assign({}, INI, { oferta: o }) }), Object.assign({}, HERANCA, { 'lg2-turma-a-m01': { R: {} } })); await clicar('Continuar de onde parei');
      check(`B6: [oferta em foco] = \"${o.slice(0, 25)}\" → frase inteira e coerente`, (await titulo()) === esp, await titulo());
    }
  }
  { /* B e D: Continuar sem resposta = aviso simples com role=alert logo acima do botão; aria-pressed nas escolhas */
    await abrir('M10-02');
    check('B: Continuar ativo antes de responder', !(await page.evaluate(() => document.querySelector('#ok').disabled)));
    await clicar('Continuar');
    const eb = await page.evaluate(() => { const e = document.querySelector('#erro'), ok = document.querySelector('#ok'); return { vis: !e.hidden, t: e.innerText, role: e.getAttribute('role'), acima: e.getBoundingClientRect().bottom <= ok.getBoundingClientRect().top + 1, junto: e.parentElement === ok.parentElement, q: document.querySelector('.q').innerText }; });
    check('B: sem resposta, \"Escolha uma opção para continuar.\" com role=alert logo acima do Continuar, na mesma pergunta', eb.vis && eb.t === 'Escolha uma opção para continuar.' && eb.role === 'alert' && eb.acima && eb.junto && eb.q.startsWith('Em quanto tempo'), eb);
    await clicar('Em 1 ou 2 dias');
    const ap = await page.evaluate(() => [...document.querySelectorAll('#ent .opcao')].map((b) => [b.querySelector('.op-txt b').innerText.trim(), b.getAttribute('aria-pressed')]));
    check('D: escolha única: aria-pressed=\"true\" só na tocada, \"false\" nas outras', ap.filter(([, a]) => a === 'true').map(([t]) => t).join() === 'Em 1 ou 2 dias' && ap.every(([t, a]) => a === (t === 'Em 1 ou 2 dias' ? 'true' : 'false')), ap);
    check('A: retorno da escolha aparece no toque, antes do Continuar', (await blocos()).length === 1 && (await page.evaluate(() => document.querySelector('#erro').hidden)), await blocos());
    await abrir('M10-01'); await clicar('Telefone'); await clicar('E-mail'); await clicar('Telefone');
    const am = await page.evaluate(() => [...document.querySelectorAll('#ent .opcao')].map((b) => [b.querySelector('.op-txt b').innerText.trim(), b.getAttribute('aria-pressed')]));
    check('D: múltipla escolha: aria-pressed acompanha o que está marcado', am.every(([t, a]) => a === (t === 'E-mail' ? 'true' : 'false')), am);
    await abrir('M10-01'); await clicar('Continuar');
    check('B: múltipla sem resposta = \"Marque pelo menos uma opção para continuar.\"', (await page.evaluate(() => document.querySelector('#erro').innerText)) === 'Marque pelo menos uma opção para continuar.');
    /* Não sei continua bloqueando (2 passos só para Não sei e aviso de risco) */
    await abrir('M10-05'); await clicar('Não sei');
    check('D: \"Não sei\" não fica marcado (aria-pressed=false)', (await page.evaluate(() => [...document.querySelectorAll('#ent .opcao')].find((b) => b.querySelector('.op-txt b').innerText.trim() === 'Não sei').getAttribute('aria-pressed'))) === 'false');
  }
  { /* F: alvos de toque ≥ 44 px (botões, resumos de \"Ver dica\"/\"Ver mais\", links-botão) */
    const pequenos = () => page.evaluate(() => [...document.querySelectorAll('.corpo button, .corpo summary, .corpo a.btn, .retrato a, .corpo .chk')].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && !e.closest('details:not([open]) > :not(summary)'); }).map((e) => { const r = e.getBoundingClientRect(); return { t: (e.getAttribute('aria-label') || e.textContent).trim().slice(0, 30), w: Math.round(r.width), h: Math.round(r.height) }; }).filter((x) => x.h < 44 || x.w < 44));
    await abrir('M10-03'); await clicar('Sim, sigo passos parecidos');
    const p3 = await pequenos();
    const mini = await page.evaluate(() => [...document.querySelectorAll('.mini-b')].map((b) => { const r = b.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; }));
    check('F: botões ↑/↓/× do roteiro de venda com 44 px ou mais', mini.length > 0 && mini.every(([w, h]) => w >= 44 && h >= 44), mini);
    check('F: tela do roteiro sem alvo de toque menor que 44 px', p3.length === 0, p3);
    await abrir('M10-05'); await clicar('Não sei');
    const p5 = await pequenos();
    check('F: \"Ver dica\", \"Não sei\" e \"Copiar\" com 44 px ou mais', p5.length === 0, p5);
    await resumo({});
    await page.evaluate(() => document.querySelectorAll('details').forEach((d) => { d.open = true; }));
    const pr = await pequenos();
    check('F: resultado sem alvo de toque menor que 44 px (Copiar texto, Abrir a Etapa, checklist, resumos)', pr.length === 0, pr);
  }
  { /* E: respostas guardadas com o texto antigo \"(Módulo N)\" passam a \"(Etapa N)\" e continuam marcadas */
    const h9 = JSON.parse(JSON.stringify(HERANCA)); h9['lg2-turma-a-m03'].R['M3.P20'] = { estado: 'naosei' };
    const velho = 'Descobrir quanto os concorrentes cobram (Módulo 3)';
    const est = estadoAte('M10-10', { 'M10-09': { estado: 'multi', opcoes: [velho], outro: '', naosei: false }, 'M10-10': { estado: 'escala', u: { [velho]: 'piora muito' } } });
    est.prioridade = velho; est.v = 3; est.hist = ['M10-09', 'M10-10', 'M10-11'];
    await semear(est, h9);
    await clicar('Continuar de onde parei');
    await page.click('#v'); await page.waitForTimeout(80); await page.click('#v'); await page.waitForTimeout(80);
    const mg = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)), CHAVE);
    const novoT = 'Descobrir quanto os concorrentes cobram (Etapa 3)';
    check('E/migração: prioridade guardada \"(Módulo 3)\" vira \"(Etapa 3)\" na lista, na escala e na prioridade principal, sem perder a resposta', JSON.stringify(mg.R['M10-09'].opcoes) === JSON.stringify([novoT]) && mg.R['M10-10'].u[novoT] === 'piora muito' && mg.prioridade === novoT, mg);
    check('E/migração: a prioridade migrada continua marcada em \"Quais 3 pontos\"', (await page.evaluate(() => [...document.querySelectorAll('#ent .opcao.sel')].map((x) => x.querySelector('.op-txt b').innerText.trim()))).join() === novoT, await page.evaluate(() => [...document.querySelectorAll('#ent .opcao')].map((x) => x.innerText)));
  }
  { /* passada geral 17/11: no resultado, a 1ª coisa é a conclusão (prioridade mais urgente + primeiro passo) */
    await semear(estadoAte('FIM')); await clicar('Continuar de onde parei');
    const c = await page.evaluate(() => { const e = document.querySelector('#conc-principal'), en = document.querySelector('#entendemos'); return { t: e ? e.innerText : '', antes: !!(e && en && (e.compareDocumentPosition(en) & Node.DOCUMENT_POSITION_FOLLOWING)) }; });
    check('Resultado: a conclusão vem primeiro (prioridade mais urgente + primeiro passo)', nrm(c.t).startsWith('Sua prioridade mais urgente: Organizar a agenda.') && c.t.includes('Primeiro passo:') && c.antes, c);
  }
  check('G: capa promete \"cerca de 10 minutos\" (11 perguntas do caminho comum + ponto de partida, ~35 s cada)', D.capa.minutos === 10);
  /* 16/11: +10 palavras só nas telas com linhas "Ex.:" embaixo de opções difíceis (M10-05 divulgação, M10-09 prioridades) */
  /* 17/11: M10-05 ganhou linha explicando as opções que são venda, não divulgação (domicílio, aplicativo): +10 */
  const LIMITE_PAL = { 'M10-05': 80, 'M10-09': 70 };
  const maiores = Object.fromEntries(contagensVisiveis.filter(([c, n]) => n > (LIMITE_PAL[c] || 60)));
  check('Menos texto: telas de pergunta com até 60 palavras antes de responder (70 nas telas com exemplos)', Object.keys(maiores).length === 0, { maiores, amostras: contagensVisiveis });
  check('Sem erros de JavaScript', erros.length === 0, erros);
  await browser.close();
  servidor.close();
  console.log(falhas ? `\n${falhas} FALHA(S)` : '\nTUDO OK');
  process.exit(falhas ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
