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
  /* SABOTAGEM=seguir: volta o passo extra (retorno + 2º toque) | SABOTAGEM=semfixo: tira o Continuar preso ao pé da tela */
  const sab = process.env.M03_SABOTAGEM;
  if (sab === 'seguir' && f.endsWith('js/app.js')) return res.end(fs.readFileSync(f, 'utf8').replace('if (vis.length && (!vistoEm || Date.now() - vistoEm < 800)) anterior = vis;', 'if (vis.length) { mostrar(msg, vis); return botoes("mesmo"); }'));
  if (sab === 'semfixo' && f.endsWith('css/estilo.css')) return res.end(fs.readFileSync(f, 'utf8').replace('.fixo-q{position:sticky;', '.fixo-q{position:static;'));
  /* lote 26/11: SABOTAGEM=enunciado volta a encaixar o texto livre na pergunta 3 | p04 deixa "Não" escrito passar na novidade |
     p11 desliga a herança da M2.P22 na pergunta do problema do cliente */
  if (sab === 'enunciado' && f.endsWith('js/app.js')) return res.end(fs.readFileSync(f, 'utf8').replace('const enunciadoPergunta = (q) => enunciado(q);', 'const enunciadoPergunta = (q) => { const v = q.codigo === "M3.P03" ? oQueVende() : null; return v ? `Quando alguém precisa de ${v}, o que pode escolher no lugar?` : enunciado(q); };'));
  if (sab === 'p04' && f.endsWith('js/app.js')) return res.end(fs.readFileSync(f, 'utf8').replace('if (q.semNovidade && r &&', 'if (false && q.semNovidade && r &&'));
  if (sab === 'p11' && f.endsWith('js/motor.js')) return res.end(fs.readFileSync(f, 'utf8').replace('if (q.codigo === "M3.P11") return !!H.m2p22', 'if (false) return !!H.m2p22'));
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
const COD = (n) => 'M3.P' + String(n).padStart(String(n).length > 2 ? 3 : 2, '0');
const NUM = (n) => parseInt(String(n), 10);
const PBY = (c) => Q['M3.P' + String(c).replace(/^0/, '').padStart(2, '0')];
/* enunciado como aparece na tela sem o Módulo 1 (o colchete some) */
const SEMCOL = (t) => String(t).replace(/\[|\]/g, '');
const P = (n) => Q[COD(n)];
const PC = (n) => Q['M3.P' + String(n)];
const Motor = require(path.join(DIR, 'js/motor.js'));
const MM = Motor.montar(D);

/* Tabela "dicas" do relatório (22 perguntas), texto literal sem o "Dica:" */
const DICAS = {
  1: 'Diga com suas palavras o que você vende e para quem. Se não souber como explicar, pense em como você responderia a um vizinho na rua. Exemplo: "Faço bolos caseiros para festas no meu bairro".',
  2: 'Marque Sim se você está ativamente tentando aumentar as vendas ou criar algo novo no momento. Marque Não se quer apenas manter o ritmo atual da sua loja ou serviço.',
  3: 'Pense em tudo o que a pessoa pode fazer em vez de comprar de você: comprar de outro negócio, levar outra coisa, fazer sozinha ou deixar para depois.',
  4: 'Preste atenção ao seu redor! Mudou algo no bairro? Tem um evento novo, uma obra por perto ou mais pessoas pedindo entrega pelo WhatsApp? Isso é uma oportunidade.',
  5: 'Explique o motivo de achar essa ideia boa. Exemplo: "Acho que vai dar certo porque meus clientes sempre pedem isso e não tem ninguém vendendo perto daqui".',
  6: 'Pense só no que falta especificamente para esta novidade ou oportunidade. Ex.: para vender marmitas no evento novo, falta conseguir embalagens térmicas e combinar quem fará as entregas.',
  7: 'Pense no que pode dar errado no dia a dia. Pode ser o preço dos ingredientes subindo, a chuva forte que esvazia a rua ou um concorrente novo que abriu do lado.',
  8: 'Pense no futuro do seu negócio. As pessoas vão comprar mais pela internet? Usar mais Pix? Exigir entregas mais rápidas? Anote o que você acha que vai mudar.',
  9: 'Escolha o tamanho do seu alcance hoje: apenas no seu bairro/cidade, na região vizinha, no Brasil todo ou até para fora do país. Quanto mais longe você vende, mais precisa pensar em frete, prazo de entrega e venda pela internet.',
  10: 'Pense no seu cliente principal. Se for Pessoa, pense na idade, onde mora e no que ela precisa. Se for Empresa, pense no ramo e tamanho do negócio dela.',
  11: 'Qual "alívio" ou "alegria" você entrega? Exemplos: economizar o tempo do cliente de cozinhar, deixar a pessoa bonita para uma festa ou consertar algo rápido.',
  12: 'Pense se qualquer pessoa conseguiria começar a vender o mesmo que você amanhã, com pouco dinheiro e sem licença.',
  '12B': 'Pense no que impede qualquer pessoa de te copiar amanhã. É o valor das máquinas? Uma autorização difícil de conseguir? Ou o fato de seu nome já ser muito famoso?',
  '13A': 'Pense em como alguém ouviu falar de você pela primeira vez: alguém indicou, viu no Instagram, achou no Google ou passou na frente. Para quem está começando, a indicação de clientes satisfeitos costuma ser o caminho mais forte.',
  13: 'Marque onde o cliente faz o pedido e paga: na conversa do WhatsApp, no Instagram, na sua loja ou feira, na casa dele ou em sites e aplicativos. O WhatsApp Business é gratuito e tem catálogo e respostas prontas.',
  14: 'Pense em algo que você faz de um jeito próprio e que ajuda o cliente. Ex.: lembra o pedido de cada cliente ou entrega no horário combinado.',
  '14B': 'Todo negócio tem pontos a melhorar. Ex.: demora para organizar as contas, pouca divulgação, falta de embalagem boa.',
  15: 'Liste o nome das lojas, pessoas ou perfis do Instagram da sua região que vendem produtos ou serviços praticamente iguais aos seus.',
  16: 'Pense no que faz o seu cliente sumir e ir comprar no vizinho. É o preço mais baixo? O prazo de entrega mais rápido? A variedade de produtos?',
  17: 'Procure no Google Maps como se fosse um cliente (ex.: "salão de beleza perto de mim") ou busque hashtags da sua cidade no Instagram para ver quem aparece.',
  18: 'Para cada um, anote o horário, se entrega (e quanto cobra de frete) e como responde no WhatsApp.',
  19: 'Para cada concorrente, marque Melhor, Igual ou Pior em cada ponto. Ex.: seu preço é Melhor, a qualidade é Igual e o prazo é Pior.',
  20: 'Veja o preço de algo parecido com o que você vende no perfil, no cardápio ou pedindo um orçamento. Se viu mais de um preço, anote o menor e o maior.',
  21: 'Resuma o motivo mais importante para escolher você. Ex.: “Recebe marmita quente no horário que combinamos”.',
  22: 'Leia as avaliações no Google Maps ou os comentários no Instagram e veja o que os clientes elogiam.',
  '22B': 'Leia as avaliações no Google Maps ou os comentários no Instagram e veja do que os clientes mais reclamam (ex.: atraso na entrega).',
};
const AVISO_IA = 'Peça perguntas, não conclusões sobre o mercado. A IA pode ajudar a entender melhor seu negócio e público, mas não conhece o seu cliente real nem tem dados atualizados de mercado. Use-a para organizar o roteiro de entrevista e busque as respostas de verdade conversando com pessoas.';
const CONFERIR_IA = 'Confira sempre se as respostas oferecidas pela IA combinam com o que você realmente faz, descarte qualquer número ou estatística que ela mencionar sem indicar uma fonte confiável.';
const MSG_ESCREVA = 'Escreva a sua resposta no campo acima para continuar. Se não souber, toque em “Não sei” para ver uma sugestão.';
const MSG_AJUDA = 'Use a ajuda acima e escreva a sua resposta para continuar.';
const MSG_AJUDA_MARQUE = 'Use a ajuda acima e marque pelo menos uma opção para continuar.';
const NOTA_NS_T = 'Use a sugestão e escreva a sua resposta no campo da pergunta. Você segue depois de responder.';
const NOTA_NS_MARQUE_T = 'Use a sugestão e marque acima o que as pessoas escolhem no lugar. Você segue depois de responder.';
const NOTA_NS_CONC_T = 'Use a sugestão e responda acima, em cada concorrente. Você segue depois de responder.';
const NOTA_NS_PERFIL_T = 'Use a sugestão para imaginar o seu cliente ideal e marque acima quem você imagina que compraria de você.';
const ESCONDIDAS = [6, 11, 16, 17];
/* telas na ordem nova (P02 = Sim): faixa de preço e pontos fortes/fracos dos outros antes da comparação */
/* lote 16/11: perguntas duplas viraram duas telas (12/12B, 13A/13, 14/14B, 22/22B) e a 21 voltou a aparecer */
const TELAS_SIM = ['1', '2', '3', '4', '5', '7', '8', '9', '10', '12', '12B', '13A', '13', '14', '14B', '15', '18', '20', '22', '22B', '19', '21'];
const TELAS_NAO = ['1', '2', '9', '10', '12', '12B', '13A', '13', '14', '14B', '15', '18', '20', '22', '22B', '19', '21'];
const PROX = (n) => { n = String(n); const i = TELAS_SIM.indexOf(n); return i >= 0 && i + 1 < TELAS_SIM.length ? TELAS_SIM[i + 1] : null; };
const LUGARES = ['No meu bairro ou arredores (local)', 'Em vários bairros da minha cidade', 'Em outras cidades da região', 'Em todo o Brasil (vendas online/entrega)'];
const DORES = ['Economizar dinheiro / Buscar o menor preço', 'Economizar tempo / Praticidade no dia a dia', 'Resolver uma emergência ou problema imediato',
  'Buscar qualidade, status ou experiência diferenciada', 'Estilo de vida, lazer ou bem-estar', 'Outro'];
const NOMES1 = { 'M3.P15': { estado: 'valor', valor: 'Doces da Ana', nomes: ['Doces da Ana'] } };
const NOMES2 = { 'M3.P15': { estado: 'valor', valor: 'Doces da Ana, Padaria Central', nomes: ['Doces da Ana', 'Padaria Central'] } };
const DOR = 'O que precisa resolver (a dor)', PESSOAS = 'Pessoas comuns (consumidor final)';
const TEXTO_OK = 'Resposta de teste com bastante detalhe';


/* Auditoria 17/11: reaproveitamento M1 e distinção entre força, comparação e frase de escolha. */
check(/M1\.P05[\s\S]*M1\.P06[\s\S]*M1\.P07[\s\S]*M1\.P07A/.test(fs.readFileSync(path.join(DIR, 'js/app.js'), 'utf8')), 'P06: lê tempo, materiais, dinheiro e alternativa da Etapa 1');
check(fs.readFileSync(path.join(DIR, 'js/app.js'), 'utf8').includes('Use o que você já disse:') && fs.readFileSync(path.join(DIR, 'js/app.js'), 'utf8').includes('Na comparação:'), 'P21: reúne P14 e P19 como base');
/* ============ 0. dados ============ */
check(D.perguntas.length === 26 && Object.keys(Q).length === 26 && ['M3.P12B', 'M3.P13A', 'M3.P14B', 'M3.P22B'].every((c) => Q[c]), 'dados: os 22 códigos continuam e entram 12B, 13A, 14B e 22B');
for (const n of Object.keys(DICAS)) check(P(n).dica === DICAS[n], `dados: dica literal na pergunta ${n}`);
check(JSON.stringify(D.perguntas.filter((q) => q.oculta).map((q) => +q.codigo.slice(4))) === JSON.stringify(ESCONDIDAS), 'dados: escondidas = já tem/falta, problema do cliente, concorrente de verdade, como descobrir, o que o cliente ganha');
check(P(6).pergunta.includes('o que falta especificamente para esta oportunidade') && P(6).dica.includes('especificamente para esta novidade ou oportunidade') && P(11).pergunta.startsWith('Que problema ou vontade do seu cliente') && !P(21).oculta, 'dados: P06 pergunta só o que falta para esta oportunidade; as demais escondidas preservadas e P21 visível');
check(P(14).pergunta.includes('ponto forte do seu jeito de trabalhar') && P(19).pergunta.includes('Lado a lado') && P(21).pergunta.startsWith('Em uma frase, por que o cliente escolheria') && P(21).dica.includes('Resuma'), 'dados: P14 ponto forte, P19 comparação lado a lado, P21 motivo em uma frase');
check(JSON.stringify(Motor.telas(MM, { 'M3.P02': { estado: 'opcao', opcao: 'Sim' } }, {}).map((t) => t[0].slice(4).replace(/^0/, ''))) === JSON.stringify(TELAS_SIM), 'motor: 22 telas, uma pergunta por tela');
check(JSON.stringify(Motor.telas(MM, { 'M3.P02': { estado: 'opcao', opcao: 'Não' } }, {}).map((t) => t[0].slice(4).replace(/^0/, ''))) === JSON.stringify(TELAS_NAO), 'motor: P02 Não pula 3 a 8 (17 telas)');
check(Motor.telas(MM, { 'M3.P12': { estado: 'opcao', opcao: 'Não, seria fácil' } }, {}).every((t) => t[0] !== 'M3.P12B'), 'motor: "copiar seria fácil" pula "o que dificultaria"');
const HM = { p01: 'bolo (produto)', m2: { tipo: 'Pessoas' } };
check(!Motor.telas(MM, {}, HM).some((t) => t[0] === 'M3.P01' || t[0] === 'M3.P10') && Motor.telas(MM, {}, HM).length === 20, 'motor: o que veio dos Módulos 1 e 2 não vira tela de novo');
check(Motor.telas(MM, { 'M3.P10': { estado: 'opcao', opcao: PESSOAS } }, HM).some((t) => t[0] === 'M3.P10'), 'motor: depois de trocar, a pergunta volta a ser da pessoa');
check(!/rafael/i.test(JSON.stringify(D)), 'dados: sem "Rafael"');
const promptsVis = D.perguntas.filter((q) => !q.oculta).flatMap((q) => q.caminhos.filter((c) => c.tipo === 'Prompt de IA').map((c) => [q.codigo, Motor.partesPrompt(c.texto).prompt]));
check(promptsVis.length >= 9 && promptsVis.every(([, p]) => /Me faça 5 perguntas simples/.test(p)), `prompts: todos no mesmo gabarito, pedindo perguntas (${promptsVis.filter(([, p]) => !/Me faça 5 perguntas/.test(p)).map((x) => x[0])})`);
check(['M3.P01', 'M3.P04', 'M3.P08', 'M3.P12B', 'M3.P13', 'M3.P13A'].every((c) => promptsVis.some(([k, p]) => k === c && /^Eu /.test(p))), 'prompts 1, 4, 8, 12B, 13 e 13A: começam pelo contexto da pessoa');
check(Q['M3.P03'].caminhos.find((c) => c.opcao === 'Não sei').texto === 'Tudo bem. Pense no que as pessoas fazem quando querem isso e não compram de você.' && !/o cliente/.test(P(3).pergunta), 'P03: não supõe que a pessoa já tem clientes');
check(JSON.stringify(P(3).alternativas.map((a) => a.valor)) === JSON.stringify(['Compra de outro negócio que vende o mesmo', 'Compra outra coisa que resolve a mesma necessidade', 'Faz em casa ou faz sozinho', 'Deixa para depois ou fica sem'])
  && P(3).alternativas.every((a) => ['Produto', 'Serviço', 'Mercadoria', ''].every((t) => /^Ex\.: /.test(a.ex[t]))), 'P03: 4 tipos de alternativa, cada um com exemplo por tipo de negócio');
/* A: "Não sei" só onde a resposta é um fato a descobrir */
check(['1', '5', '12', '14', '14B', '21', '19', '9', '2'].every((n) => !P(n).naosei), 'Não sei: saiu das perguntas sobre a própria pessoa');
check(!P(12).nao && !P(4).nao && D.perguntas.every((q) => !q.nao), 'lote 26/11: botão "Não" saiu da novidade (P04) e não existe em nenhuma pergunta');
check(P(4).semNovidade === true && P(4).naosei === true && P(5).mostrarSe && P(5).mostrarSe.codigo === 'M3.P04' && P(5).mostrarSe.novidade === true, 'lote 26/11: P04 bloqueia "não/não sei" escrito; P05 depende de uma novidade escrita na P04');
check(JSON.stringify(P(4).comoDescobrir.map((x) => /concorrentes/.test(x) ? 'conc' : /clientes/.test(x) ? 'cli' : /redes sociais/.test(x) && /bairro/.test(x) ? 'redes' : /datas/.test(x) && /eventos/.test(x) ? 'datas' : '?')) === '["conc","cli","redes","datas"]', 'lote 26/11: P04 "Como descobrir" com 4 passos práticos (concorrentes, clientes, redes/bairro, datas e eventos)');
check(/concorrentes/.test(iaP04()) && /datas e eventos/.test(iaP04()) && /^Eu vendo \[produto ou serviço\]/.test(iaP04()) && /Me faça 5 perguntas simples/.test(iaP04()), 'lote 26/11: pedido para a IA da P04 cobre concorrentes, clientes, redes e datas');
check(P(3).pergunta === 'Quando alguém precisa [do que você vende], o que pode escolher no lugar?' && P(3).variantes.ideia.pergunta === 'Quando alguém precisa [do que você quer vender], o que pode escolher no lugar?', 'lote 26/11: P03 com enunciado fixo (o que a pessoa escreveu não entra na frase)');
const R0N = { 'M3.P02': { estado: 'opcao', opcao: 'Sim' } };
const telasCom = (p04) => Motor.telas(MM, Object.assign({}, R0N, p04 ? { 'M3.P04': { estado: 'valor', valor: p04 } } : {}), {}).flat();
check(telasCom(null).includes('M3.P05') && telasCom('Mais gente pedindo pelo WhatsApp').includes('M3.P05') && ['Não', 'não', 'Não sei', 'nenhuma', 'Nada.'].every((v) => !telasCom(v).includes('M3.P05')), 'motor: P05 só aparece quando a P04 tem uma novidade escrita (some com "Não" antigo)');
check(Motor.proxima(MM, Object.assign({}, R0N, { 'M3.P04': { estado: 'valor', valor: 'Não' } }), 'M3.P04', {}) === 'M3.P07', 'motor: "Não" antigo na P04 segue direto para a 7');
const HP22 = { m2p22: 'Roupa confortável para dormir' };
check(Motor.pulada(Q['M3.P11'], {}, HP22) && Motor.pulada(Q['M3.P11'], { 'M3.P11': { estado: 'valor', valor: 'x', doPerfil: true } }, HP22) && !Motor.pulada(Q['M3.P11'], { 'M3.P11': { estado: 'valor', valor: 'minha' } }, HP22) && !Motor.pulada(Q['M3.P11'], {}, {}),
  'motor: P11 herdada da M2.P22 (precedência: resposta própria > Etapa 2 > perfil)');
check(Motor.proxima(MM, R0N, 'M3.P11', {}) === 'M3.P12', 'motor: depois de "Trocar" na P11 (escondida), segue para a 12');
/* G: balões que abriam para qualquer resposta foram para a dica */
check(P(9).caminhos.filter((c) => c.tipo !== 'Nenhum').map((c) => c.opcao).join() === 'Também fora do Brasil' && P(13).caminhos.filter((c) => c.tipo === 'Dica').map((c) => c.opcao).join() === 'Aplicativos de entrega (iFood e outros)'
  && !P('13A').caminhos.some((c) => c.tipo === 'Dica'), 'G: retornos que abriam sempre viraram dica; ficam só fora do Brasil e taxa do aplicativo');
check(P(7).pergunta === 'Existe alguma coisa que pode atrapalhar suas vendas?' && !/\(Ex\./.test(P(7).variantes.ideia.pergunta), 'P07: enunciado sem o "(Ex.: …)"');
check(JSON.stringify(P(7).opcoes) === JSON.stringify(['Concorrente novo', 'Preço dos insumos subindo', 'Queda nas vendas em certa época', 'Mudança de regra', 'Outro', 'Não sei']), 'P07: opções das figuras + Outro + Não sei por último');
check(P(10).rotulo_naosei === 'Ainda não tenho clientes' && !P(13).rotulo_naosei && P(13).opcoes[P(13).opcoes.length - 1] === 'Não sei' && !P(13).opcoes.includes('Indicação (boca a boca)'), 'P10/P13: "Ainda não defini" = "Não sei" (uma opção só); indicação foi para "como fica sabendo"');
check(P(10).marcadores.Idade[0] === 'Até 10 anos (infantil)' && JSON.stringify(P(10).marcadores['Onde mora']) === JSON.stringify(LUGARES) && JSON.stringify(P(10).marcadores[DOR]) === JSON.stringify(DORES)
  && Object.values(P(10).marcadores).every((xs) => !xs.some((x) => /^Não sei/.test(x))), 'P10: opções do relatório, sem "Não sei" nos marcadores');
check(P(10).caminhos.find((c) => c.opcao === 'Campos complementares incompletos').texto === 'Preencha o que você já sabe.', 'P10: dica sem "o que ficar de fora dá para completar depois"');
check(!P(12).exemplos && !P(7).exemplos, 'P12/P07: sem as opções que apareciam no Não sei');
check(P(15).pergunta === 'Quem já vende o mesmo que você, ou algo bem parecido?' && P(15).campos_min === 3, 'P15: enunciado curto e pelo menos 3 campos');
check(!/Perguntar a clientes onde mais já compraram/.test(JSON.stringify(P(17))) && !/Perguntar a clientes onde mais já compraram/.test(JSON.stringify(P(15))), 'passo a passo de como descobrir: sem a sugestão 4');
check(P(19).naosei === false && P(19).outro === 'Outro ponto', 'P19: fechada, sem Não sei, com Outro ponto');
/* versão leve: perguntas curtas e ajuda de verdade em todo "Não sei" (textos nos dados, não no código) */
const VISIVEIS = D.perguntas.filter((q) => !q.oculta);
const palavrasQ = (t) => String(t).split(/\s+/).filter(Boolean).length;
check(VISIVEIS.every((q) => palavrasQ(q.pergunta) <= 20 && Object.values(q.variantes || {}).every((v) => !v.pergunta || palavrasQ(v.pergunta) <= 20)), `leve: perguntas à vista com até ~20 palavras (${VISIVEIS.filter((q) => palavrasQ(q.pergunta) > 20).map((q) => q.codigo)})`);
const COM_NS = VISIVEIS.filter((q) => q.naosei);
const iaTexto = (q) => q.promptIA ? `Prompt: "${q.promptIA}"` : (q.caminhos.find((c) => /^Não sei/.test(c.opcao) && c.tipo === 'Prompt de IA') || {}).texto || '';
const adaptarSemM1 = (t) => t;   // sem o Módulo 1 no aparelho, o texto do pedido aparece como está nos dados
function iaP04() { return Motor.partesPrompt(P(4).caminhos.find((c) => c.opcao === 'Não sei').texto).prompt }
const iaDe = (q) => q.promptIA || ((q.caminhos.find((c) => /^Não sei/.test(c.opcao) && c.tipo === 'Prompt de IA') || {}).texto ? Motor.partesPrompt(q.caminhos.find((c) => /^Não sei/.test(c.opcao) && c.tipo === 'Prompt de IA').texto).prompt : '');
check(COM_NS.length === 13 && COM_NS.every((q) => Array.isArray(q.comoDescobrir) && q.comoDescobrir.length === (q.codigo === 'M3.P04' ? 4 : 2) && q.comoDescobrir.every((s) => s.trim().length > 20) && iaDe(q)), `leve: todo "Não sei" à vista tem 2 passos e um pedido para a IA (${COM_NS.filter((q) => !(q.comoDescobrir && iaDe(q))).map((q) => q.codigo)})`);
check(COM_NS.filter((q) => q.promptIA).every((q) => /^Eu vendo \[produto ou serviço\]/.test(q.promptIA) && /Me faça 5 perguntas simples/.test(q.promptIA)), 'leve: pedidos novos no mesmo gabarito (Eu vendo [..], 5 perguntas)');
check(!/chatgpt|gemini|copilot|claude/i.test(JSON.stringify(D)), 'leve: nenhuma marca de IA nos textos');
check(D.inicio && /\S/.test(D.inicio.frase) && palavrasQ(D.inicio.frase) <= 15 && D.inicio.minutos > 0, 'leve: capa com uma frase e o tempo');

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
  /* E (lote 17/11): a jornada chama de Etapa; nenhum "Módulo" no texto visível */
  async function semModulo(onde) { const t = await page.evaluate(() => document.body.innerText); const m = t.match(/.{0,30}m[óo]dulo.{0,30}/i); check(!m, `E: sem "Módulo" no texto visível (${onde}) ${m ? m[0] : ''}`); }
  /* F (lote 17/11): botões, links-botão e summary com pelo menos 44 px de altura (as fontes do rodapé comum ficam com o pai) */
  async function alvos44(onde) {
    const pq = await page.evaluate(() => [...document.querySelectorAll('button, summary, a, [role=button]')].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.height < 44 && !e.closest('.p-fontes li'); })
      .map((e) => `${e.className || e.tagName} "${e.textContent.trim().slice(0, 20)}" ${Math.round(e.getBoundingClientRect().height)}`));
    check(!pq.length, `F: alvos de toque >= 44 px (${onde}) ${pq.slice(0, 4).join(' | ')}`);
  }
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
  const abreCod = async (cod, txt) => { await page.goto(URL); await page.evaluate(() => localStorage.clear()); await page.reload(); await espera(); await clicar('#ir', 'Começar'); await espera(); while (norm(await titulo()) !== norm(txt)) { const t=await titulo(); if (t.includes('escolhem no lugar') || t.includes('escolher no lugar')) { if(cod==='M3.P03') break; const op=page.locator('#ent .opcao').first(); await op.click(); await page.locator('#ok').click(); } else if (t.includes('Em que ramo')) { await page.locator('#ent textarea').fill('Meu negócio de teste'); await page.locator('#ok').click(); } else if (t.includes('buscando vender')) { await page.locator('#ent .opcao').filter({hasText:'Sim'}).first().click(); await page.locator('#ok').click(); } else { throw new Error('unexpected navigation '+t); } await espera(); } };
  async function abrir(n, R = {}, outros = {}, txt = null, v = 8) {
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
  check(capa.h1 === 'Conhecendo o mercado e os concorrentes' && capa.txt === D.inicio.frase, `capa: título e uma frase (${capa.h1})`);
  const capaLeve = await page.evaluate(() => ({ tempo: (document.querySelector('.tempo') || {}).textContent, aberto: document.querySelector('.como-funciona').open,
    dentro: [...document.querySelectorAll('.cartao')].every((c) => c.closest('.como-funciona')), sum: document.querySelector('.como-funciona summary').textContent }));
  check(capaLeve.tempo === 'Esta etapa leva cerca de 15 minutos.' && capaLeve.sum === 'Como funciona' && !capaLeve.aberto && capaLeve.dentro, `capa leve: tempo + "Como funciona" fechado com os cartões (${JSON.stringify(capaLeve)})`);
  check(!/Para quem já tem uma ideia/.test(await tela()), 'capa leve: explicações só ao abrir "Como funciona"');
  const palavrasTela = () => page.evaluate(() => { const n = (t) => t.split(/\s+/).filter((w) => /[A-Za-zÀ-ÿ0-9]/.test(w)).length; return n(document.querySelector('#tela').innerText) - [...document.querySelectorAll('.p-linha-integrada, .p-fontes summary')].reduce((a, e) => a + n(e.innerText), 0); });
  check(capa.cart[0].p === 'Para quem já tem uma ideia de negócio, mas quer pesquisar melhor o mercado, descobrir quem faz a mesma coisa e saber como se destacar na sua região.', 'capa: "Para quem é" simples');
  check(capa.cart[1].li.length === 3 && capa.cart[1].li[0] === 'A descrição simples da sua ideia de negócio.', 'capa: "O que ter em mãos" em 3 itens curtos');
  check(capa.cart[2].li.length === 3 && capa.cart[2].li.some((x) => /Etapa 4: Produto, por que comprar de você e teste da ideia/.test(x)) && !/Oferta e experimentação|Oferta e Testes/.test(capa.cart[2].li.join(' ')), 'capa: entrega com o nome certo do Módulo 4');
  check(capa.ir, 'capa: Começar visível');
  await semCodigos('capa'); await fonte16('capa'); await semModulo('capa');
  check(await page.evaluate(() => [...document.querySelectorAll('.rodape img')].map((i) => i.alt).join()) === 'FACC,UFJF,Governo de Minas Gerais', 'rodapé com FACC/UFJF/MG');
  await shot('l4_m03_capa');

  /* ============ 2. dica junto da pergunta (sem tocar em nada) ============ */
  for (const n of TELAS_SIM.filter((n) => Number(n) !== 3)) {
    if (Number(n) === 3) continue;
    await abrir(n);
    const pal = await palavrasTela();
    check(pal <= 60, `pergunta ${n}: tela com até 60 palavras antes de tocar (${pal})`);
    if (n === 1) continue;
    /* pergunta de escrever (um campo só): a dica fica dentro do campo, antes de digitar; nas outras, no cartão */
    if (Motor.campo(P(n)) === 'texto') {
      const c = await page.evaluate(() => { const t = document.querySelector('#ent textarea'); return { ph: t && t.placeholder, vazio: t && !t.value, cx: !!document.querySelector('.dica-q') }; });
      check(c.vazio && norm(c.ph) === norm('Dica: ' + DICAS[n]) && !c.cx, `pergunta ${n}: dica dentro do campo de escrever, texto literal, sem cartão repetido`);
      await semCodigos(`pergunta ${n}`);
      continue;
    }
    const d = await page.evaluate(() => { const b = document.querySelector('.dica-q'); return b && { tag: b.tagName, aberto: b.open, t: b.querySelector('summary').textContent, txt: [...b.querySelectorAll('p')].map((p) => p.textContent).join(' '),
      antes: !!(b.compareDocumentPosition(document.querySelector('#ent')) & Node.DOCUMENT_POSITION_FOLLOWING), depois: !!(b.compareDocumentPosition(document.querySelector('h2.q')) & Node.DOCUMENT_POSITION_PRECEDING) }; });
    check(d && d.tag === 'DETAILS' && !d.aberto && d.t === 'Ver dica' && norm(d.txt) === norm(DICAS[n]) && d.antes && d.depois, `pergunta ${n}: "Ver dica" fechada entre a pergunta e as respostas, texto literal`);
    await semCodigos(`pergunta ${n}`);
  }

  /* ============ 3. P03: alternativas estruturadas, exemplos por tipo, compatibilidade texto antigo ============ */
  await abreCod('M3.P03', 'Quando alguém precisa do que você vende, o que pode escolher no lugar?');
  check(norm(await page.locator('.contexto').textContent()) === 'Pensando em: Meu negócio de teste' && !(await titulo()).includes('Meu negócio de teste'), 'lote 26/11: P03 com enunciado fixo; o que a pessoa escreveu fica só em "Pensando em"');
  await shot('m03_depois_p03');
  check(await page.locator('#ent .opcao').count() === 4, 'P03: quatro tipos de alternativa');
  await page.locator('#ent .opcao').nth(1).click(); await espera();
  const p3 = await page.evaluate(() => ({ label: document.querySelector('#ent .opcao.sel .op-ex')?.textContent, hidden: document.querySelector('.alt-quais')?.hidden, text: document.querySelector('.q')?.textContent }));
  check(p3.label && /Ex\.:/.test(p3.label) && p3.hidden === false, 'P03: exemplo concreto e campo "Quais?"');
  await page.locator('.alt-quais input').fill('sorvete do mercado'); await clicar('#ok','Continuar'); await espera();
  check((await RR())['M3.P03']?.tipos?.length === 1 && (await RR())['M3.P03']?.quais, 'P03: grava tipos e quais em estrutura');

  /* H: revisão dos yes/no existentes: P02 é situação própria; P12 é avaliação da própria pessoa, sem "Não sei". */
  check(!['M3.P02','M3.P12'].some((c) => Q[c].naosei) && JSON.stringify(Q['M3.P02'].opcoes) === JSON.stringify(['Sim','Não']), 'H: yes/no próprios só Sim/Não');

  /* lote 16/11 focused smoke: question numbering follows the expanded order */
  const ordem = Motor.telas(MM, { 'M3.P02': { estado: 'opcao', opcao: 'Sim' } }, {}).flat();
  check(ordem[2] === 'M3.P03' && ordem.indexOf('M3.P12B') === ordem.indexOf('M3.P12') + 1 && ordem.indexOf('M3.P13A') < ordem.indexOf('M3.P13') && ordem.includes('M3.P22B'), 'numeração: continua ordenada após as novas perguntas');
  /* G/H/I */
  check(Q['M3.P09'].caminhos.some(c => c.opcao === 'Também fora do Brasil' && c.tipo === 'Dica') && Q['M3.P09'].dica.includes('frete'), 'G: orientação de alcance/frete está na dica');
  check(Q['M3.P13'].caminhos.filter(c => c.tipo === 'Dica').length === 1 && Q['M3.P13A'].caminhos.every(c => c.tipo !== 'Dica'), 'G: informação geral das opções comerciais foi para as dicas');
  check(!Q['M3.P02'].naosei && !Q['M3.P12'].naosei && ['Sim','Não'].every(x => Q['M3.P02'].opcoes.includes(x)), 'H: sim/não sobre situação própria só Sim/Não');
  /* J: estado legado sem versão, mesma forma v/R/hist do backup; dados inventados, sem texto real. */
  await page.evaluate(() => { localStorage.setItem('lg2-turma-a-m03', JSON.stringify({ R: {
    'M3.P01': { estado:'valor', valor:'Produto inventado' }, 'M3.P02': { estado:'opcao', opcao:'Sim' },
    'M3.P03': { estado:'valor', valor:'Alternativa antiga inventada' }, 'M3.P10': { estado:'opcao', opcao:'Pessoas comuns (consumidor final)', opcoes:['Pessoas comuns (consumidor final)'], campos:{'Idade':'Adulto inventado'} },
    'M3.P12': { estado:'valor', valor:'Barreira inventada' }, 'M3.P14': { estado:'campos', campos:{'O que você faz de melhor':'Ponto forte inventado','O que precisa melhorar':'Ponto a melhorar inventado'} },
    'M3.P15': { estado:'valor', valor:'Loja inventada', nomes:['Loja inventada'] }, 'M3.P22': { estado:'campos', campos:{'O que os outros fazem bem':'Força inventada','Onde os outros deixam a desejar':'Falha inventada'} }
  }, hist:['M3.P03'] })); }); await page.reload(); await espera();
  const mig=await RR();
  check(mig['M3.P03']?.valor==='Alternativa antiga inventada' && mig['M3.P12']?.opcao==='Sim, seria difícil' && mig['M3.P12B']?.valor==='Barreira inventada' && mig['M3.P14']?.valor==='Ponto forte inventado' && mig['M3.P14B']?.valor==='Ponto a melhorar inventado' && mig['M3.P15']?.nomes?.[0]==='Loja inventada' && mig['M3.P22']?.valor==='Força inventada' && mig['M3.P22B']?.valor==='Falha inventada', 'J: resposta antiga e campos preservados sem versão');
  await clicar('#ir','Continuar de onde parei'); await espera();
  check((await page.locator('.antigo').textContent()).includes('Você tinha escrito: Alternativa antiga inventada'), 'J: resposta antiga da P03 aparece no novo campo');
  /* Dois concorrentes recebem campos independentes, sem perder o valor-compatibilidade. */
  await page.evaluate(() => localStorage.setItem('lg2-turma-a-m03', JSON.stringify({v:8,R:{'M3.P02':{estado:'opcao',opcao:'Sim'},'M3.P15':{estado:'valor',valor:'Padaria X, Mercado Y',nomes:['Padaria X','Mercado Y']}},hist:['M3.P18']})));
  await page.reload(); await espera(); await clicar('#ir','Continuar de onde parei'); await espera();
  check(await page.locator('.conc-bloco').count()===2, 'concorrentes: dois blocos por nome');
  const cs=page.locator('.conc-bloco textarea'); await cs.nth(0).fill('Abre cedo, entrega no bairro'); await cs.nth(1).fill('Abre tarde, vende no balcão');
  await clicar('#ok','Continuar'); await espera(); const cr=(await RR())['M3.P18'];
  check(cr?.porNome?.['Padaria X']==='Abre cedo, entrega no bairro' && cr?.porNome?.['Mercado Y']==='Abre tarde, vende no balcão' && /Padaria X:/.test(cr.valor) && /Mercado Y:/.test(cr.valor), 'concorrentes: campos separados e valor legível');
  await page.evaluate(() => { const s=JSON.parse(localStorage.getItem('lg2-turma-a-m03')||'{"v":8,"R":{},"hist":[]}'); s.v=8; s.hist=['RESULTADO']; localStorage.setItem('lg2-turma-a-m03',JSON.stringify(s)); }); await page.reload(); await espera(); await clicar('#ir','Continuar de onde parei'); await espera();
  check(await page.locator('details').count() > 0 && await page.locator('details:not([open])').count() === 0, `I: todas as seções recolhíveis do resultado abrem por padrão (${await page.locator('details').count()} total, ${await page.locator('details:not([open])').count()} fechadas: ${await page.locator('details:not([open])').evaluateAll(xs=>xs.map(x=>x.className+':'+x.textContent.trim()).join('|'))}, ${await titulo()})`);


  /* ================================================================================================
     Cobertura restaurada (lote 16/11): os cenários do teste antigo de 17 telas, adaptados ao fluxo novo
     (22 telas, perguntas duplas separadas, concorrentes um a um, herança que pula a tela, "Não sei" que bloqueia).
     ================================================================================================ */
  const hist = async () => (await estado()).hist;
  const atual = async () => { const h = await hist(); return h[h.length - 1]; };
  const kicker = () => page.evaluate(() => (document.querySelector('.passo') || {}).textContent || '');
  const marcaC = (nome, c, i) => page.evaluate(([n, c, i]) => { const b = [...document.querySelectorAll('.conc-bloco')].find((x) => x.dataset.nome === n);
    [...b.querySelectorAll('.t-linha')].find((x) => x.dataset.crit === c).querySelectorAll('.t-op')[i].click(); }, [nome, c, i]);
  const concTxt = (nome, v) => page.locator(`.conc-bloco[data-nome="${nome}"] textarea`).fill(v);
  const concPreco = async (nome, a, b) => { await page.locator(`.conc-bloco[data-nome="${nome}"] input[data-c="min"]`).fill(a); await page.locator(`.conc-bloco[data-nome="${nome}"] input[data-c="max"]`).fill(b); };
  const caixasR = (sel) => page.evaluate((sel) => [...document.querySelectorAll(sel)].map((b) => ({ tipo: b.dataset.tipo, tit: b.querySelector('b').textContent,
    aviso: (b.querySelector('.ia-aviso') || {}).textContent || '', conferir: (b.querySelector('.conferir') || {}).textContent || '', prompt: (b.querySelector('.prompt-txt') || {}).textContent || '',
    copiar: (b.querySelector('.btn-copiar') || {}).textContent || '', nota: (b.querySelector('.como-nota') || {}).textContent || '', roteiro: (b.querySelector('.btn-roteiro') || {}).textContent || '' })), sel);
  const T3 = SEMCOL(P(3).pergunta);
  const textoNS = (q) => q.promptIA ? `Prompt: "${q.promptIA}"` : (q.caminhos.find((c) => /^Não sei/.test(c.opcao) && c.tipo === 'Prompt de IA') || {}).texto || '';

  /* ============ R1. "Não sei" BLOQUEIA (perguntas com botão): ajuda, nada gravado, Continuar não anda; depois responde ============ */
  const NS_CASOS = [['3', {}, 'alt'], ['4', {}, 'texto'], ['8', {}, 'texto'], ['12B', {}, 'texto'], ['15', {}, 'lista'],
    ['18', NOMES1, 'conc'], ['20', NOMES1, 'preco'], ['22', NOMES1, 'conc'], ['22B', NOMES1, 'conc']];
  const NOTA_POR = { alt: NOTA_NS_MARQUE_T, texto: NOTA_NS_T, lista: NOTA_NS_T, conc: NOTA_NS_CONC_T, preco: NOTA_NS_CONC_T };
  for (const [n, R0, tipo] of NS_CASOS) {
    await abrir(n, R0, {}, n === '3' ? T3 : null);
    check(await page.locator('#ns').count() === 1 && norm(await page.locator('#ns').textContent()) === 'Não sei', `pergunta ${n}: botão Não sei`);
    const antes = JSON.stringify(await estado());
    await clicar('#ns', 'Não sei'); await espera();
    const cx = await caixasR('#ajudans .caminho');
    check(cx.length === 1 && cx[0].tipo === 'Prompt de IA', `pergunta ${n} Não sei: um pedido pronto para a IA (${cx.map((c) => c.tipo)})`);
    const como = await page.evaluate(() => { const s = document.querySelector('#ajudans .como-descobrir'); return s && { t: s.querySelector('.como-tit').textContent, li: [...s.querySelectorAll('li')].map((x) => x.textContent.trim()),
      intro: (s.querySelector('.como-ns-intro') || {}).textContent || '', prim: document.querySelector('#ajudans').firstElementChild === s }; });
    check(como && como.t === 'Como descobrir' && como.prim && JSON.stringify(como.li) === JSON.stringify(P(n).comoDescobrir), `pergunta ${n} Não sei: "Como descobrir" com os 2 passos dos dados`);
    if (n === '3') check(como && como.intro === P(3).caminhos.find((c) => c.opcao === 'Não sei').texto, 'pergunta 3 Não sei: a dica do grupo abre a caixa');
    check(cx[0] && cx[0].copiar === 'Copiar' && cx[0].nota === 'Copie, cole numa IA de sua preferência e troque o que está entre colchetes.' && cx[0].prompt === Motor.partesPrompt(textoNS(P(n))).prompt,
      `pergunta ${n} Não sei: pedido para a IA com Copiar e a nota sem marca`);
    check(cx[0] && cx[0].tit === 'USE A IA COM CUIDADO' && norm(cx[0].aviso) === AVISO_IA && norm(cx[0].conferir) === CONFERIR_IA, `pergunta ${n}: aviso de IA antes do prompt e frase de conferir depois`);
    check(cx[0] && cx[0].roteiro === 'Ver o roteiro de entrevista', `pergunta ${n}: botão do roteiro dentro do aviso de IA`);
    check(JSON.stringify(await estado()) === antes, `pergunta ${n} Não sei: nada é gravado ao tocar`);
    const campos = await page.evaluate(() => ({ fora: document.querySelectorAll('#ajudans textarea, #ajudans input').length, nota: (document.querySelector('#nota-ns') || {}).textContent || '' }));
    check(campos.fora === 0 && campos.nota === NOTA_POR[tipo], `pergunta ${n} Não sei: sem segundo campo; nota manda responder na pergunta (${campos.nota})`);
    await clicar('#ok', 'Continuar'); await espera();
    const e = await erroTxt();
    const esperado = tipo === 'alt' ? MSG_AJUDA_MARQUE : tipo === 'lista' ? 'Escreva pelo menos um nome para continuar. Se não souber, toque em “Não sei” para ver como descobrir.' : MSG_AJUDA;
    check(e === esperado && JSON.stringify(await estado()) === antes, `pergunta ${n} Não sei + Continuar: não avança nem grava (${e})`);
    check(norm(await titulo()) === norm(n === '3' ? T3 : P(n).pergunta), `pergunta ${n} Não sei + Continuar: continua na mesma tela`);
    if (n === '4') { await page.evaluate(() => document.querySelector('.b-ia').scrollIntoView({ block: 'center' })); await shot('l5_m03_nao_sei_ia'); await fonte16('pergunta com a ajuda do Não sei'); }
    /* responde de verdade e segue */
    if (tipo === 'alt') await page.locator('#ent .opcao').nth(2).click();
    else if (tipo === 'lista') await page.locator('#ent input[data-nome]').nth(0).fill('Doces da Ana');
    else if (tipo === 'conc') await concTxt('Doces da Ana', TEXTO_OK);
    else if (tipo === 'preco') await concPreco('Doces da Ana', '40', '60');
    else await digitar(TEXTO_OK);
    check(await page.evaluate(() => document.querySelectorAll('#ajudans .caminho').length > 0), `pergunta ${n}: a sugestão continua à vista enquanto responde`);
    await clicar('#ok', 'Continuar'); await espera();
    const r = (await RR())[COD(n)];
    check(r && r.estado === 'valor', `pergunta ${n}: grava a resposta de verdade (não "Não sei")`);
    check(await naTela(PROX(n)), `pergunta ${n}: segue para a pergunta ${PROX(n)}`);
  }
  /* pergunta de escrever sem tocar em "Não sei": a mensagem aponta o botão; sem o botão, só pede a resposta */
  await abrir('4'); await clicar('#ok', 'Continuar'); await espera();
  check(await erroTxt() === MSG_ESCREVA && await naTela('4') && !(await RR())['M3.P04'], 'pergunta 4 vazia: mensagem pede a resposta e aponta o Não sei');
  await abrir('5'); await clicar('#ok', 'Continuar'); await espera();
  check(await erroTxt() === 'Escreva a sua resposta no campo acima para continuar.' && await naTela('5'), 'pergunta 5 vazia (sem Não sei): só pede a resposta');
  /* perguntas sobre a própria pessoa: o botão "Não sei" não existe */
  for (const [n, R0] of [['1', {}], ['2', {}], ['5', {}], ['9', {}], ['12', {}], ['14', {}], ['14B', {}], ['21', {}], ['19', NOMES1]]) {
    await abrir(n, R0);
    check(await page.locator('#ns').count() === 0 && !(await page.evaluate(() => [...document.querySelectorAll('#ent .opcao')].some((b) => /^Não sei/.test(b.dataset.op)))), `pergunta ${n}: sem "Não sei"`);
  }
  /* prompt copiável com [colchetes] */
  await abrir('4'); await clicar('#ns', 'Não sei'); await espera();
  await page.locator('#ajudans .btn-copiar').first().click();
  let rotCop = '';
  for (let k = 0; k < 20 && rotCop !== 'Copiado'; k++) { await espera(100); rotCop = norm(await page.locator('#ajudans .btn-copiar').first().textContent()); }
  const copiado = await page.evaluate(() => navigator.clipboard.readText());
  check(copiado === Motor.partesPrompt(P(4).caminhos.find((c) => c.opcao === 'Não sei').texto).prompt && /\[cidade ou bairro\]/.test(copiado), 'prompt copiado inteiro, com [colchetes]');
  check(rotCop === 'Copiado', 'botão mostra Copiado');

  /* ============ R2. roteiro de entrevista por cima da tela: fechar mantém tela, respostas e rolagem ============ */
  await abrir('4');
  await digitar('Rascunho que não pode sumir');
  await clicar('#ns', 'Não sei'); await espera();
  const antesRot = JSON.stringify(await estado());
  await page.evaluate(() => document.activeElement.blur()); await espera(400);   // o centrar do teclado (300 ms) já rodou
  await page.evaluate(() => document.querySelector('#ajudans .btn-roteiro').scrollIntoView({ block: 'center' }));
  const yRot = await page.evaluate(() => Math.round(window.scrollY));
  await page.locator('#ajudans .btn-roteiro').click(); await espera(200);
  const yFixo = await page.evaluate(() => -parseInt(document.body.style.top || '0', 10));
  check(yRot > 0 && yFixo === yRot, `roteiro: a tela de baixo fica parada no mesmo ponto (${yRot} / ${yFixo})`);
  const rot = await page.evaluate(() => { const f = document.querySelector('.lg2-rot-fundo'); const d = f && f.querySelector('[role=dialog]');
    return f && { vis: f.getBoundingClientRect().height > 0, modal: d && d.getAttribute('aria-modal'), tit: (f.querySelector('#lg2-rot-tit') || {}).textContent, uso: /Como usar este roteiro/.test(f.textContent),
      inerte: document.querySelector('#tela').closest('[inert]') !== null || document.querySelector('#tela').inert }; });
  check(rot && rot.vis && rot.modal === 'true' && rot.tit === 'Roteiro de entrevista' && rot.uso, `roteiro: abre o painel por cima da pergunta (${JSON.stringify(rot)})`);
  check(rot && rot.inerte, 'roteiro: a tela de baixo fica inerte enquanto o painel está aberto');
  await shot('l5_m03_roteiro');
  await page.locator('.lg2-rot-fechar').click(); await espera(150);
  const depoisRot = await page.evaluate(() => ({ aberto: !!document.querySelector('.lg2-rot-fundo'), y: Math.round(document.scrollingElement.scrollTop), txt: document.querySelector('#ent textarea').value,
    ajuda: document.querySelectorAll('#ajudans .caminho').length, body: document.body.getAttribute('style') }));
  check(!depoisRot.aberto && await naTela('4') && depoisRot.txt === 'Rascunho que não pode sumir' && depoisRot.ajuda === 1, `roteiro: Fechar volta à mesma pergunta com o texto e a ajuda (${JSON.stringify(depoisRot)})`);
  check(Math.abs(depoisRot.y - yRot) <= 1 && !/position:\s*fixed/.test(depoisRot.body || ''), `roteiro: Fechar devolve a rolagem (${yRot} → ${depoisRot.y})`);
  check(JSON.stringify(await estado()) === antesRot, 'roteiro: abrir e fechar não grava nem apaga respostas');
  await page.locator('#ajudans .btn-roteiro').click(); await espera(150);
  await page.keyboard.press('Escape'); await espera(150);
  check(!(await page.locator('.lg2-rot-fundo').count()) && await naTela('4') && await page.inputValue('#ent textarea') === 'Rascunho que não pode sumir', 'roteiro: Esc também fecha e mantém a tela');
  await clicar('#ok', 'Continuar'); await espera();
  check((await RR())['M3.P04'].valor === 'Rascunho que não pode sumir' && await naTela('5'), 'roteiro: depois de fechar, a resposta segue normalmente');
  /* também na pergunta de marcar (caixa do "Não sei" no retorno) */
  await abrir('7'); await page.locator('#ent .opcao[data-op="Não sei"]').click(); await espera();
  await page.locator('#msg .btn-roteiro').click(); await espera(150);
  check(await page.locator('.lg2-rot-fundo').count() === 1, 'roteiro: abre também na pergunta de marcar');
  await page.locator('.lg2-rot-fechar').click(); await espera(150);
  check(!(await page.locator('.lg2-rot-fundo').count()) && await naTela('7') && await page.evaluate(() => document.querySelector('#ent .opcao[data-op="Não sei"]').classList.contains('sel')), 'roteiro: fechar mantém a marcação da pergunta de marcar');

  /* ============ R3. lote 26/11: a novidade (P04) não tem mais "Não"; "não"/"não sei" escrito bloqueia com a ajuda ============ */
  await abrir('4');
  check(JSON.stringify(await page.evaluate(() => [...document.querySelectorAll('#alt button')].map((b) => b.textContent))) === '["Não sei"]' && await page.locator('#nao').count() === 0, 'pergunta 4: só "Não sei" (sem o atalho "Não")');
  for (const v of ['Não', 'não sei', 'Nenhuma']) {
    await abrir('4');
    const antes4 = JSON.stringify(await estado());
    await digitar(v); await clicar('#ok', 'Continuar'); await espera();
    const cx4 = await page.evaluate(() => ({ li: [...document.querySelectorAll('#ajudans .como-descobrir li')].map((x) => x.textContent.trim()), copiar: (document.querySelector('#ajudans .btn-copiar') || {}).textContent }));
    check(await naTela('4') && await erroTxt() === 'Escreva uma novidade que você viu. Se ainda não viu nenhuma, use a ajuda acima para descobrir.' && JSON.stringify(await estado()) === antes4,
      `pergunta 4 "${v}" escrito: não grava nem avança (${await erroTxt()})`);
    check(JSON.stringify(cx4.li) === JSON.stringify(P(4).comoDescobrir) && cx4.copiar === 'Copiar', `pergunta 4 "${v}" escrito: mostra "Como descobrir" com os 4 passos e o pedido para a IA`);
  }
  await page.evaluate(() => document.querySelector('#ajudans .como-descobrir').scrollIntoView({ block: 'start' }));
  await shot('m03_depois_p04_nao');
  await digitar('Abriu uma academia na rua de cima'); await clicar('#ok', 'Continuar'); await espera();
  check((await RR())['M3.P04'].valor === 'Abriu uma academia na rua de cima' && await naTela('5'), 'pergunta 4: com uma novidade escrita, grava e segue para a 5');
  /* quem ainda não vende: a mesma regra na versão "a sua ideia" */
  await abrir('4', {}, { 'lg2-turma-a-m01': { v: 3, R: { 'M1.P01': { estado: 'opcao', opcao: 'Ainda está só na minha cabeça' } } } }, P(4).variantes.ideia.pergunta);
  check(await page.locator('#nao').count() === 0 && await page.locator('#ns').count() === 1, 'pergunta 4 (ainda não vende): sem "Não", com "Não sei"');
  await digitar('não'); await clicar('#ok', 'Continuar'); await espera();
  check(norm(await titulo()) === norm(P(4).variantes.ideia.pergunta) && await page.locator('#ajudans .como-descobrir li').count() === 4 && !(await RR())['M3.P04'], 'pergunta 4 (ainda não vende): "não" escrito bloqueia e abre a ajuda');
  check((await caixasR('#ajudans .caminho'))[0].prompt.startsWith('Eu quero vender [produto ou serviço]'), 'pergunta 4 (ainda não vende): pedido para a IA em "Eu quero vender"');
  /* respostas antigas: "Não" fica salvo e a 5 some; "Não sei" reabre vazia com a ajuda */
  await page.goto(URL);
  await page.evaluate((k) => { localStorage.clear(); localStorage.setItem(k, JSON.stringify({ v: 8, R: { 'M3.P02': { estado: 'opcao', opcao: 'Sim' }, 'M3.P04': { estado: 'valor', valor: 'Não' }, 'M3.P05': { estado: 'valor', valor: 'Resposta antiga da cinco' } }, hist: ['RESULTADO'] })); }, CHAVE);
  await page.reload(); await espera(); await clicar('#ir', 'Continuar de onde parei'); await espera();
  const leg = await page.evaluate(() => ({ e: [...document.querySelectorAll('.etapa')].map((x) => x.dataset.cod), r04: (document.querySelector('.etapa[data-cod="M3.P04"] .etapa-r') || {}).textContent }));
  check(!leg.e.includes('M3.P05') && leg.r04 === 'Não' && (await RR())['M3.P04'].valor === 'Não' && (await RR())['M3.P05'].valor === 'Resposta antiga da cinco', `"Não" antigo na 4: continua salvo, a 5 sai do resumo e a resposta dela fica guardada (${JSON.stringify(leg)})`);
  await page.goto(URL);
  await page.evaluate((k) => { localStorage.clear(); localStorage.setItem(k, JSON.stringify({ v: 8, R: { 'M3.P02': { estado: 'opcao', opcao: 'Sim' }, 'M3.P03': { estado: 'valor', valor: 'Padaria' }, 'M3.P04': { estado: 'valor', valor: 'Não' } }, hist: ['M3.P03'] })); }, CHAVE);
  await page.reload(); await espera(); await clicar('#ir', 'Continuar de onde parei'); await espera();
  await page.locator('#ent .opcao').nth(2).click(); await clicar('#ok', 'Continuar'); await espera();
  check(await naTela('4') && await page.inputValue('#ent textarea') === 'Não', '"Não" antigo: a 4 reabre com o que estava salvo');
  check(JSON.stringify(Motor.telas(MM, (await RR()), {}).flat().slice(0, 5)) === '["M3.P01","M3.P02","M3.P03","M3.P04","M3.P07"]', '"Não" antigo: a 5 não está no caminho');
  for (const [nome, v, r04] of [['texto "Não sei"', 8, { estado: 'valor', valor: 'Não sei' }], ['"naosei" da versão 7', 7, { estado: 'naosei' }]]) {
    await page.goto(URL);
    await page.evaluate(([k, v, r04]) => { localStorage.clear(); localStorage.setItem(k, JSON.stringify({ v, R: { 'M3.P02': { estado: 'opcao', opcao: 'Sim' }, 'M3.P04': r04, 'M3.P01': { estado: 'valor', valor: 'Bolo' } }, hist: ['M3.P04'] })); }, [CHAVE, v, r04]);
    await page.reload(); await espera();
    const sv = await estado();
    check(!sv.R['M3.P04'] && sv.R['M3.P01'].valor === 'Bolo' && JSON.stringify(sv.reabrir) === '["M3.P04"]', `"Não sei" antigo na 4 (${nome}): vira sem resposta, o resto fica`);
    await clicar('#ir', 'Continuar de onde parei'); await espera();
    check(await naTela('4') && await page.inputValue('#ent textarea') === '' && await page.locator('#ajudans .como-descobrir li').count() === 4 && await page.evaluate(() => document.querySelector('#ns').getAttribute('aria-pressed') === 'true'), `"Não sei" antigo na 4 (${nome}): reabre vazia, com a ajuda à vista`);
  }
  await digitar('Feira nova no sábado'); await clicar('#ok', 'Continuar'); await espera();
  check(await naTela('5') && !(await estado()).reabrir, '"Não sei" antigo: depois de responder, a marca de reabrir sai');
  await abrir('12');
  check(JSON.stringify(await page.evaluate(() => [...document.querySelectorAll('#ent .opcao')].map((b) => b.dataset.op))) === JSON.stringify(P(12).opcoes) && await page.locator('#nao').count() === 0, 'pergunta 12: escolha fechada, sem botão "Não"');
  await clicar('.opcao', 'Não, seria fácil'); await clicar('#ok', 'Continuar'); await espera();
  check(await naTela('13A') && JSON.stringify((await RR())['M3.P12']) === '{"estado":"opcao","opcao":"Não, seria fácil"}', 'pergunta 12 "seria fácil": pula "o que dificultaria" e vai para "como ficam sabendo"');
  await clicar('#v', 'Voltar'); await espera();
  check(await naTela('12') && await page.evaluate(() => document.querySelector('#ent .opcao.sel').dataset.op) === 'Não, seria fácil', 'Voltar: volta à 12 com a escolha marcada');
  await clicar('.opcao', 'Sim, seria difícil'); await clicar('#ok', 'Continuar'); await espera();
  check(await naTela('12B'), 'pergunta 12 "seria difícil": abre "o que dificultaria"');
  await page.goto(URL);
  await page.evaluate((k) => { localStorage.setItem(k, JSON.stringify({ v: 8, R: { 'M3.P12': { estado: 'opcao', opcao: 'Sim, seria difícil' }, 'M3.P12B': { estado: 'valor', valor: 'Receita da família' } }, hist: ['M3.P12'] })); }, CHAVE);
  await page.reload(); await clicar('#ir', 'Continuar de onde parei'); await espera();
  await clicar('.opcao', 'Não, seria fácil'); await clicar('#ok', 'Continuar'); await espera();
  check(!(await RR())['M3.P12B'], 'pergunta 12 trocada para "seria fácil": a resposta de 12B (que sumiu do caminho) é descartada');

  /* ============ R4. riscos (P07): marcar várias; "Não sei" sozinho não responde; Outro pede texto ============ */
  await abrir('7');
  check(JSON.stringify(await page.evaluate(() => [...document.querySelectorAll('#ent .opcao')].map((b) => b.textContent.trim()))) === JSON.stringify(P(7).opcoes), 'P07: opções fechadas na tela');
  check(await page.evaluate(() => document.querySelector('#ent').getAttribute('role') === 'group' && /Marque quantas quiser/.test(document.querySelector('.pergunta').textContent)), 'P07: de marcar várias');
  const antes7 = JSON.stringify(await estado());
  await page.locator('#ent .opcao[data-op="Não sei"]').click(); await espera();
  const cx7 = await caixasR('#msg .caminho');
  check(cx7.length === 1 && cx7[0].tit === 'USE A IA COM CUIDADO' && norm(cx7[0].conferir) === CONFERIR_IA && cx7[0].roteiro === 'Ver o roteiro de entrevista', 'P07 Não sei: sugestão da IA com o aviso');
  check(JSON.stringify(await page.evaluate(() => [...document.querySelectorAll('#msg .como-descobrir li')].map((x) => x.textContent))) === JSON.stringify(P(7).comoDescobrir), 'P07 Não sei: "Como descobrir" com os passos');
  check(JSON.stringify(await estado()) === antes7, 'P07 Não sei: nada é gravado ao tocar');
  await shot('l5_m03_p07_naosei');
  await clicar('#ok', 'Continuar'); await espera();
  check(await naTela('7') && await erroTxt() === 'Marque pelo menos uma opção para continuar.' && JSON.stringify(await estado()) === antes7, 'P07: só "Não sei" não deixa seguir (mensagem logo acima do Continuar)');
  check((await caixasR('#msg .caminho')).some((c) => c.tit === 'USE A IA COM CUIDADO'), 'P07: o pedido para a IA do "Não sei" continua à vista depois da mensagem');
  check(await page.locator('#msg .como-descobrir').count() === 1, 'P07: os passos continuam à vista depois do aviso');
  await clicar('.opcao', 'Preço dos insumos subindo'); await clicar('.opcao', 'Outro'); await espera();
  check(JSON.stringify(await page.evaluate(() => [...document.querySelectorAll('#ent .opcao.sel')].map((b) => b.dataset.op))) === '["Preço dos insumos subindo","Outro"]', 'P07: marcar uma opção tira o "Não sei"');
  await clicar('#ok', 'Continuar'); await espera();
  check(await erroTxt() === 'Escreva o que é “Outro” ou desmarque essa opção.', 'P07: Outro vazio pede o texto');
  await page.locator('.extra textarea').fill('Chuva forte esvazia a feira');
  await clicar('#ok', 'Continuar'); await espera();
  check(JSON.stringify((await RR())['M3.P07']) === JSON.stringify({ estado: 'opcoes', opcoes: ['Preço dos insumos subindo', 'Outro'], detalhe: 'Chuva forte esvazia a feira' }) && await naTela('8'), 'P07: grava opções + Outro e segue');
  await abrir('7', { 'M3.P07': { estado: 'valor', valor: 'Concorrente abriu do lado' } });
  check(JSON.stringify(await page.evaluate(() => [...document.querySelectorAll('#ent .opcao.sel')].map((b) => b.dataset.op))) === '["Outro"]' && await page.inputValue('.extra textarea') === 'Concorrente abriu do lado', 'P07: resposta antiga em texto reabre como "Outro" com o texto');

  /* ============ R5. perfil do cliente (P10) ============ */
  await abrir('10');
  check(await page.evaluate(() => document.querySelector('#ns').textContent) === 'Ainda não tenho clientes', 'P10: "Não sei" virou "Ainda não tenho clientes"');
  const antes10 = JSON.stringify(await estado());
  await clicar('#ns', 'Ainda não tenho clientes'); await espera();
  const cx10 = await caixasR('#ajudans .caminho');
  check(cx10.length === 1 && cx10[0].tit === 'USE A IA COM CUIDADO' && /ainda não tenho clientes/.test(cx10[0].prompt) && /cliente ideal/.test(cx10[0].prompt), 'P10: sugestão de cliente ideal com o aviso de IA');
  check(await page.locator('#ajudans .como-descobrir li').count() === 2 && JSON.stringify(await estado()) === antes10, 'P10: "Como descobrir" com 2 passos e nada gravado');
  check(await page.evaluate(() => document.querySelector('#nota-ns').textContent) === NOTA_NS_PERFIL_T, 'P10: pede para marcar quem compraria');
  await clicar('#ok', 'Continuar'); await espera();
  check(await naTela('10') && /Escolha uma opção acima/.test(await erroTxt()) && !(await RR())['M3.P10'], 'P10: quem mais compra é obrigatório');
  await clicar('.opcao', PESSOAS); await espera();
  const rot10 = await page.evaluate(() => [...document.querySelectorAll('.campos .item > span')].map((s) => s.textContent));
  check(JSON.stringify(rot10) === JSON.stringify(['Idade', 'Renda', 'Ocupação', 'Onde vivem os seus clientes?', 'Qual principal problema ou necessidade eles buscam resolver?']), `P10: perguntas do perfil (${rot10.join(' | ')})`);
  check(await page.evaluate(() => document.querySelectorAll('.campos .item-marcar').length === 5 && document.querySelectorAll('.campos .campo-outro').length === 1), 'P10: todos os itens com opções; "Outro" com campo');
  check(!(await page.evaluate(() => [...document.querySelectorAll('.campos .chip')].some((c) => /^Não sei/.test(c.textContent)))), 'P10: nenhum "Não sei" nas marcas do perfil');
  check(await page.evaluate(() => document.querySelector('.campo-outro').offsetParent === null), 'P10: campo do Outro fechado até marcar');
  await clicar('.item-marcar[data-c="Onde mora"] .chip', 'Em vários bairros da minha cidade');
  await clicar('.item-marcar[data-c="Onde mora"] .chip', 'No meu bairro ou arredores (local)');
  check(JSON.stringify(await page.evaluate(() => [...document.querySelectorAll('.item-marcar[data-c="Onde mora"] .chip.sel')].map((c) => c.textContent))) === JSON.stringify([LUGARES[0], LUGARES[1]]), 'P10: marcas de várias opções no mesmo item');
  await clicar('.item-marcar[data-c="Onde mora"] .chip', 'Em vários bairros da minha cidade');
  await clicar('.item-marcar[data-c="O que precisa resolver (a dor)"] .chip', DORES[1]);
  await clicar('.item-marcar[data-c="O que precisa resolver (a dor)"] .chip', 'Outro'); await espera();
  await page.locator('.campo-outro').fill('Festa de aniversário');
  await clicar('.chip', 'Até 10 anos (infantil)'); await espera(900);
  check(await page.evaluate(() => [...document.querySelectorAll('#msg .caminho')].some((b) => b.dataset.op === 'Campos complementares incompletos')), 'A: P10 incompleto mostra a dica ao vivo, antes do Continuar');
  await clicar('#ok', 'Continuar'); await espera();
  check(await page.locator('#ok').textContent() !== 'Continuar mesmo assim' && await naTela('12'), 'A: P10 perfil incompleto segue com UM toque (sem "Continuar mesmo assim")');
  let R5 = await RR();
  check(R5['M3.P10'].opcao === PESSOAS && R5['M3.P10'].campos['Onde mora'] === LUGARES[0] && R5['M3.P10'].campos[DOR] === `${DORES[1]}; Outro: Festa de aniversário` && R5['M3.P10'].campos.Idade === 'Até 10 anos (infantil)',
    `P10: marcas guardadas como texto, no formato que os outros módulos leem (${JSON.stringify(R5['M3.P10'].campos)})`);
  check(R5['M3.P11'] && R5['M3.P11'].valor === `${DORES[1]}; Festa de aniversário` && R5['M3.P11'].doPerfil, 'P10: o problema marcado vai para a pergunta escondida da dor');
  check(await naTela('12'), 'P10: segue para a 12 (a pergunta da dor está escondida)');
  /* sem o Módulo 2: onde vivem já vem marcado pelo que a pessoa disse sobre até onde vende */
  await abrir('10', { 'M3.P09': { estado: 'opcao', opcao: 'Na minha região (estado e cidades próximas)' } });
  await clicar('.opcao', PESSOAS); await espera();
  check(JSON.stringify(await page.evaluate(() => [...document.querySelectorAll('.item-marcar[data-c="Onde mora"] .chip.sel')].map((c) => c.textContent))) === '["Em outras cidades da região"]', 'P10: onde vivem pré-marcado pela resposta de até onde vende (sem repetir)');
  await clicar('.opcao', PESSOAS); await clicar('.opcao', 'Empresas'); await espera();
  check(JSON.stringify(await page.evaluate(() => [...document.querySelectorAll('.campos .item > span')].map((s) => s.textContent))) === '["Ramo","Tamanho","Equipe","Onde ficam essas empresas?"]', 'P10 Empresas: 4 itens com opções');

  /* ============ R6. herança do Módulo 2: a tela do perfil é pulada e vira cartão "Veio do Módulo 2 · Trocar" ============ */
  const M2 = { v: 9, R: { 'M2.P07': { estado: 'opcao', opcao: 'Os dois' }, 'M2.P11': { estado: 'opcao', opcao: 'Meu bairro' }, 'M2.P13': { estado: 'opcao', opcao: 'Qualidade' }, 'M2.P09': { estado: 'opcao', opcao: 'Idosos/aposentados' } } };
  await abrir('12', { 'M3.P09': { estado: 'opcao', opcao: 'No meu bairro e na minha cidade' } }, { 'lg2-turma-b-m02': M2 });
  let R6 = await RR();
  check(R6['M3.P10'] && R6['M3.P10'].herdado === 'M2' && JSON.stringify(R6['M3.P10'].opcoes) === `["${PESSOAS}","Empresas"]` && R6['M3.P10'].campos.Idade === '60 anos ou mais' && R6['M3.P10'].campos['Ocupação'] === 'Aposentados'
    && R6['M3.P10'].campos['Onde mora'] === LUGARES[0] && R6['M3.P10'].campos[DOR] === DORES[3], `Módulo 2: quem compra entra pronto, com as marcas do perfil (${JSON.stringify(R6['M3.P10'])})`);
  check(!Motor.telas(MM, R6, { m2: { tipo: 'Os dois' } }).some((t) => t[0] === 'M3.P10'), 'Módulo 2: a tela do perfil não aparece de novo');
  const card2 = await page.evaluate(() => { const c = document.querySelector('.herdado-mini[data-cod="M3.P10"]'); return c && { selo: c.querySelector('.selo-m').textContent, txt: c.querySelector('.herdado-txt').textContent, b: c.querySelector('.trocar-h').textContent,
    antes: !!(c.compareDocumentPosition(document.querySelector('h2.q')) & Node.DOCUMENT_POSITION_FOLLOWING) }; });
  check(card2 && card2.selo === 'Veio da Etapa 2' && card2.txt === 'Quem compra de você: Pessoas comuns e Empresas' && card2.b === 'Trocar' && card2.antes, `Módulo 2: cartão na tela seguinte, acima da pergunta (${JSON.stringify(card2)})`);
  await shot('l5_m03_cartao_modulo2');
  await clicar('.trocar-h', 'Trocar'); await espera();
  const h2 = await page.evaluate(() => ({ sel: [...document.querySelectorAll('#ent .opcao.sel')].map((b) => b.dataset.op), selo: (document.querySelector('.selo-m') || {}).textContent,
    chips: [...document.querySelectorAll('.campos .chip.sel')].map((c) => c.textContent) }));
  check(await naTela('10') && JSON.stringify(h2.sel) === `["${PESSOAS}","Empresas"]` && h2.selo === 'Veio da Etapa 2. Confira e troque se quiser.', `Módulo 2: "Trocar" abre o perfil já marcado, com selo (${JSON.stringify(h2)})`);
  check(['60 anos ou mais', 'Aposentados', LUGARES[0], DORES[3]].every((x) => h2.chips.includes(x)), 'Módulo 2: marcas do perfil vindas do Módulo 2');
  await clicar('.opcao', 'Empresas'); await clicar('#ok', 'Continuar'); await espera();
  R6 = await RR();
  check(JSON.stringify(R6['M3.P10'].opcoes) === `["${PESSOAS}"]` && !R6['M3.P10'].herdado && R6['M3.P10'].campos.Idade === '60 anos ou mais' && await naTela('12'), 'Módulo 2: a troca fica guardada neste módulo e volta para a 12');
  check(await page.locator('.herdado-mini[data-cod="M3.P10"]').count() === 0 && Motor.telas(MM, R6, { m2: { tipo: 'Os dois' } }).some((t) => t[0] === 'M3.P10'), 'Módulo 2: depois de trocar, a pergunta passa a ser da pessoa (sem cartão)');
  check(await page.evaluate(() => localStorage.getItem('lg2-turma-b-m02')) === JSON.stringify(M2), 'Módulo 2 nunca é alterado');

  /* ============ R7. canais: como fica sabendo (P13A) e por onde compra (P13) ============ */
  await abrir('13A');
  await page.locator('#ent .opcao[data-op="Não sei"]').click(); await espera();
  check((await caixasR('#msg .caminho')).length === 1 && await page.locator('#msg .como-descobrir li').count() === 2, 'P13A Não sei: passos e pedido para a IA');
  await clicar('#ok', 'Continuar'); await espera();
  check(await naTela('13A') && !(await RR())['M3.P13A'], 'P13A: só "Não sei" não deixa seguir');
  await clicar('.opcao', 'Indicação (boca a boca)'); await clicar('.opcao', 'Google ou Google Maps'); await clicar('#ok', 'Continuar'); await espera();
  check(JSON.stringify((await RR())['M3.P13A']) === JSON.stringify({ estado: 'opcoes', opcoes: ['Indicação (boca a boca)', 'Google ou Google Maps'] }) && await naTela('13'), 'P13A: grava as marcas e segue para "por onde compra"');
  await abrir('13');
  const ops13 = await page.evaluate(() => [...document.querySelectorAll('#ent .opcao')].map((b) => b.textContent.trim()));
  check(ops13[ops13.length - 1] === 'Não sei' && ops13.length === 9, 'P13: "Não sei" por último');
  check(ops13[0] === 'WhatsApp' && JSON.stringify(await page.evaluate(() => [...document.querySelectorAll('#ent .opcao')].map((b) => b.dataset.op))) === JSON.stringify(P(13).opcoes), 'P13: rótulos curtos na tela, valores de sempre por trás');
  await page.locator('#ent .opcao[data-op="Não sei"]').click(); await espera();
  const cx13 = await caixasR('#msg .caminho');
  check(cx13.length === 1 && /ainda não defini como vou vender/.test(cx13[0].prompt) && cx13[0].tit === 'USE A IA COM CUIDADO', 'P13: prompt para quem ainda não definiu, com o aviso');
  await clicar('#ok', 'Continuar'); await espera();
  check(await naTela('13') && await erroTxt() === 'Marque pelo menos um canal para continuar.', 'P13: precisa marcar um canal');
  await clicar('.opcao', 'Aplicativo de entrega'); await espera();
  check((await caixasR('#msg .caminho')).some((c) => c.tipo === 'Dica'), 'P13: aplicativo de entrega mostra a dica da taxa ao tocar');
  await clicar('.opcao', 'Aplicativo de entrega'); await clicar('.opcao', 'WhatsApp'); await clicar('.opcao', 'Outro'); await page.locator('.extra textarea').fill('Feira de domingo');
  await clicar('#ok', 'Continuar'); await espera();
  check(JSON.stringify((await RR())['M3.P13']) === JSON.stringify({ estado: 'opcoes', opcoes: ['WhatsApp (WhatsApp Business)', 'Outro'], detalhe: 'Feira de domingo' }) && await naTela('14'), 'P13: canais + Outro no formato que o Módulo 10 lê');

  /* ============ R8. concorrentes: um nome por campo ============ */
  await abrir('15');
  check(JSON.stringify(await titulos()) === JSON.stringify([norm(P(15).pergunta)]), 'P15: sozinha na tela');
  check(await page.locator('#ent input[data-nome]').count() === 3, 'P15: 3 campos de nome');
  await clicar('#mais-nome', '+ Adicionar outro nome'); await espera();
  check(await page.locator('#ent input[data-nome]').count() === 4, 'P15: "Adicionar outro nome" abre mais um campo');
  await clicar('#ok', 'Continuar'); await espera();
  check(/pelo menos um nome/.test(await erroTxt()) && await naTela('15'), 'P15: sem nenhum nome não segue');
  await page.locator('#ent input[data-nome]').nth(0).fill('Doces da Ana');
  await page.locator('#ent input[data-nome]').nth(1).fill('Padaria Central');
  await clicar('#ok', 'Continuar'); await espera();
  check(JSON.stringify((await RR())['M3.P15']) === JSON.stringify(NOMES2['M3.P15']) && await naTela('18'), 'P15: grava os nomes (e o texto que o Módulo 10 lê) e segue para "como cada um trabalha"');
  check(await page.locator('.conc-bloco').count() === 2 && JSON.stringify(await page.evaluate(() => [...document.querySelectorAll('.conc-nome')].map((x) => x.textContent))) === '["Doces da Ana","Padaria Central"]', 'P18: um bloco por nome citado, com o nome como título');
  await abrir('15', { 'M3.P15': { estado: 'valor', valor: 'Lava-jato do Zé e o posto da avenida' } });
  check(await page.inputValue('#ent input[data-nome="1"]') === 'Lava-jato do Zé' && await page.inputValue('#ent input[data-nome="2"]') === 'O posto da avenida', 'P15: resposta antiga em texto abre separada, um nome por campo');
  /* concorrente incluído numa pergunta de concorrentes entra também na lista de nomes */
  await abrir('22', NOMES1);
  await clicar('#mais-conc', '+ Adicionar outro concorrente'); await page.locator('#novo-nome').fill('mercado do Zé'); await clicar('#incluir', 'Incluir'); await espera();
  check(JSON.stringify(await page.evaluate(() => [...document.querySelectorAll('.conc-nome')].map((x) => x.textContent))) === '["Doces da Ana","Mercado do Zé"]', 'concorrentes: "Adicionar outro concorrente" abre mais um bloco');
  await concTxt('Doces da Ana', 'Entregam rápido'); await concTxt('Mercado do Zé', 'Preço baixo');
  await clicar('#ok', 'Continuar'); await espera();
  const r22 = await RR();
  check(JSON.stringify(r22['M3.P15'].nomes) === '["Doces da Ana","Mercado do Zé"]' && r22['M3.P22'].porNome['Mercado do Zé'] === 'Preço baixo' && await naTela('22B'), 'concorrentes: o nome novo entra na lista de quem vende o mesmo');
  /* um concorrente sem resposta: aviso que não trava, e só o respondido é gravado */
  await abrir('18', NOMES2);
  await concTxt('Doces da Ana', 'Abre cedo, entrega no bairro');
  await clicar('#ok', 'Continuar'); await espera();
  check(JSON.stringify((await RR())['M3.P18'].porNome) === JSON.stringify({ 'Doces da Ana': 'Abre cedo, entrega no bairro' }) && await naTela('20'), 'A: concorrente sem resposta não é passo extra: um toque grava só o respondido e segue');
  check(/Você não respondeu para Padaria Central/.test(await page.evaluate(() => (document.querySelector('.sobre-ant') || {}).textContent || '')) && /Sobre a sua resposta anterior/.test(await page.evaluate(() => (document.querySelector('.sobre-ant b') || {}).textContent || '')), 'A: o aviso do concorrente sem resposta vem no topo da próxima tela');

  /* ============ R9. preço de cada concorrente (P20): menor e maior, erros e aviso ============ */
  await abrir('20', NOMES1);
  check(await page.evaluate(() => [...document.querySelectorAll('.conc-bloco input')].every((i) => i.inputMode === 'decimal')) && await page.locator('#ent input[data-c="min"]').count() === 1 && await page.locator('#ent input[data-c="max"]').count() === 1, 'P20: menor e maior preço com teclado de números');
  for (const [txt, msg] of [['Bolos caseiros de pote', 'Doces da Ana: Digite só números. Ex.: 12,50'], ['-5', 'Doces da Ana: O preço não pode ser negativo. Digite só números. Ex.: 12,50'],
    ['', 'Digite o preço de pelo menos um concorrente para continuar. Se não souber, toque em “Não sei” para ver como descobrir.']]) {
    await page.locator('#ent input[data-c="min"]').fill(txt); await clicar('#ok', 'Continuar'); await espera();
    check(await erroTxt() === msg && !(await RR())['M3.P20'] && await naTela('20'), `P20 "${txt}": erro simples, não grava (${await erroTxt()})`);
  }
  await page.locator('#ent input[data-c="min"]').fill('1.500'); await clicar('#ok', 'Continuar'); await espera();
  check(/parece alto/.test(await erroTxt()) && !(await RR())['M3.P20'] && await clicar('#ok', 'Continuar mesmo assim'), 'P20 R$ 1.500: aviso que não trava');
  await espera();
  check((await RR())['M3.P20'].min === 1500 && (await RR())['M3.P20'].valor === 'R$ 1.500,00' && await naTela('22'), 'P20: segundo toque grava e segue para a 22');
  await abrir('20', Object.assign({}, NOMES1, { 'M3.P20': { estado: 'valor', valor: 'R$ 1.500,00', min: 1500, max: 1500, porNome: { 'Doces da Ana': { min: 1500, max: 1500, valor: 'R$ 1.500,00' } } } }));
  check(await page.inputValue('#ent input[data-c="min"]') === '1.500,00' && await page.inputValue('#ent input[data-c="max"]') === '', 'P20: valor salvo reabre em padrão brasileiro (1.500,00)');
  await abrir('20', NOMES1);
  await concPreco('Doces da Ana', '40', '60'); await clicar('#ok', 'Continuar'); await espera();
  check(await naTela('22') && JSON.stringify((await RR())['M3.P20']) === JSON.stringify({ estado: 'valor', valor: 'de R$ 40,00 a R$ 60,00', min: 40, max: 60, porNome: { 'Doces da Ana': { min: 40, max: 60, valor: 'de R$ 40,00 a R$ 60,00' } } }),
    'P20: segue direto; faixa geral no "valor" (lido pelo Módulo 5) e a de cada concorrente em porNome');

  /* ============ R10. comparação (P19) fechada, por concorrente ============ */
  await abrir('19', NOMES1);
  check(await page.locator('#ns').count() === 0, 'P19: sem "Não sei"');
  check(JSON.stringify(await page.evaluate(() => [...document.querySelectorAll('.conc-bloco .t-linha')].map((x) => x.dataset.crit))) === JSON.stringify(P(19).criterios), 'P19: tabela com os 4 pontos no bloco do concorrente');
  await clicar('#ok', 'Continuar'); await espera();
  check(await erroTxt() === 'Marque Melhor, Igual ou Pior em cada item de pelo menos um concorrente para continuar.' && await naTela('19'), 'P19: nada marcado = não segue');
  await marcaC('Doces da Ana', 'Preço', 2); await marcaC('Doces da Ana', 'Qualidade', 2);
  await clicar('#ok', 'Continuar'); await espera();
  check(await erroTxt() === 'Marque Melhor, Igual ou Pior em cada item de Doces da Ana, ou deixe Doces da Ana todo em branco.' && await naTela('19'), 'P19: falta marcar = não segue');
  await marcaC('Doces da Ana', 'Atendimento', 2); await espera();
  check((await caixasR('#msg .caminho')).some((c) => c.tipo === 'Resposta'), 'P19: 3 "Pior" mostra a mensagem do grupo');
  await marcaC('Doces da Ana', 'Atendimento', 0); await marcaC('Doces da Ana', 'Prazo (tempo para entregar)', 1); await espera();
  check(!(await caixasR('#msg .caminho')).some((c) => c.tipo === 'Resposta'), 'P19: trocar volta a 2 "Pior"');
  check(JSON.stringify(await page.evaluate(() => [...document.querySelectorAll('.conc-bloco .t-linha[data-crit="Preço"] .t-op.sel')].map((b) => b.dataset.v))) === '["Pior"]', 'P19: escolha única em cada ponto');
  await page.evaluate(() => document.querySelector('.conc-bloco').scrollIntoView({ block: 'start' }));
  await shot('l5_m03_comparacao');
  await clicar('#ok', 'Continuar'); await espera();
  const r19 = (await RR())['M3.P19'];
  check(r19 && r19.valor === 'Doces da Ana: Preço Pior, Qualidade Pior, Atendimento Melhor, Prazo (tempo para entregar) Igual' && JSON.stringify(r19.porNome['Doces da Ana'].tabela) === JSON.stringify({ 'Preço': 'Pior', Qualidade: 'Pior', Atendimento: 'Melhor', 'Prazo (tempo para entregar)': 'Igual' }),
    `P19: grava a tabela de cada concorrente e o texto (${r19 && r19.valor})`);
  check(await naTela('21'), 'P19: segue para "o que o cliente ganha com você" (a 21 voltou)');

  /* ============ R11. o que vende veio do Módulo 1: tela pulada, cartão "Veio do Módulo 1 · Trocar" ============ */
  const SO_CABECA = { estado: 'opcao', opcao: 'Ainda está só na minha cabeça' };
  const M1 = (p01, extra = {}) => ({ v: 3, R: Object.assign({ 'M1.P01': p01, 'M1.P05': {estado:'opcao',opcao:'De 1 a 3 horas por dia'}, 'M1.P06': {estado:'opcao',opcao:'Tenho só uma parte'}, 'M1.P07': {estado:'opcao',opcao:'Até R$ 500'}, 'M1.P07A': {estado:'opcao',opcao:'Pegando emprestado com amigos ou família'}, 'M1.P03': { estado: 'valor', valor: 'lavagem de carro em casa' },
    'M1.P03A': { estado: 'opcao', opcao: 'Serviço: meu cliente paga pelo trabalho que realizo' } }, extra) });
  await page.goto(URL);
  await page.evaluate((m1) => { localStorage.clear(); localStorage.setItem('lg2-turma-a-m01', m1); }, JSON.stringify(M1(SO_CABECA)));
  await page.reload(); await clicar('button', 'Começar'); await espera();
  const b1 = await page.evaluate(() => { const c = document.querySelector('.herdado-mini[data-cod="M3.P01"]'); return { kick: document.querySelector('.passo').textContent, txt: c && c.querySelector('.herdado-txt').textContent,
    selo: c && c.querySelector('.selo-m').textContent, trocar: c && c.querySelector('.trocar-h').textContent }; });
  check(await atual() === 'M3.P02' && norm(await titulo()) === norm(P(2).variantes.ideia.pergunta) && b1.kick === 'Pergunta 1 de 21', `Módulo 1: a pergunta "o que vende" não aparece; começa na 2 (${b1.kick})`);
  check(b1.txt === 'O que você vende: lavagem de carro em casa (serviço)' && b1.selo === 'Veio da Etapa 1' && b1.trocar === 'Trocar', `Módulo 1: cartão com o que veio e "Trocar" (${JSON.stringify(b1)})`);
  check(JSON.stringify((await RR())['M3.P01']) === JSON.stringify({ estado: 'valor', valor: 'lavagem de carro em casa (serviço)', doM1: true }), 'Módulo 1: a resposta fica gravada com a marca de herança (outros módulos leem)');
  await shot('l5_m03_cartao_modulo1');
  await clicar('.trocar-h', 'Trocar'); await espera();
  check(await page.inputValue('#ent textarea') === 'lavagem de carro em casa (serviço)' && await page.evaluate(() => (document.querySelector('.selo-m') || {}).textContent) === 'Veio da Etapa 1. Confira e ajuste se quiser.', 'Módulo 1: "Trocar" abre o campo com o que veio, com o selo');
  await digitar('Lava-jato que vai até a casa do cliente'); await clicar('#ok', 'Continuar'); await espera();
  check(JSON.stringify((await RR())['M3.P01']) === JSON.stringify({ estado: 'valor', valor: 'Lava-jato que vai até a casa do cliente' }) && await atual() === 'M3.P02', 'Módulo 1: a troca fica guardada neste módulo e volta para a 2');
  check(await page.locator('.herdado-mini').count() === 0 && await kicker() === 'Pergunta 2 de 22', 'Módulo 1: depois de trocar, a pergunta volta a contar como da pessoa (sem cartão)');
  check(await page.evaluate(() => localStorage.getItem('lg2-turma-a-m01')) === JSON.stringify(M1(SO_CABECA)), 'Módulo 1 nunca é alterado');
  await page.goto(URL);
  await page.evaluate((m1) => { localStorage.clear(); localStorage.setItem('lg2-turma-a-m01', m1); }, JSON.stringify(M1(SO_CABECA, { 'M1.P03': { estado: 'naosei' } })));
  await page.reload(); await clicar('button', 'Começar'); await espera();
  check(!(await page.locator('.herdado-mini').count()) && await atual() === 'M3.P01' && await page.inputValue('#ent textarea') === '', 'Módulo 1: "Não sei" no Módulo 1 não conta como herança (a pergunta aparece vazia)');

  await abrir('21', {'M3.P14':{estado:'valor',valor:'Entrega no horário'},'M3.P19':{estado:'valor',valor:'Doces: Preço Melhor, Qualidade Igual',porNome:{Doces:{tabela:{Preço:'Melhor',Qualidade:'Igual'}}}}});
  check((await page.locator('#base-p21').innerText()).includes('Entrega no horário') && (await page.locator('#base-p21').innerText()).includes('Preço Melhor'), 'auditoria: P21 apresenta P14 e P19 como base');

  /* auditoria 17/11: dados da Etapa 1 no cartão de P06; sem estado anterior fica escondido. */
  const m1Completo = {v:5,R:{'M1.P05':{estado:'opcao',opcao:'De 1 a 3 horas por dia'},'M1.P06':{estado:'opcao',opcao:'Tenho só uma parte'},'M1.P07':{estado:'opcao',opcao:'Até R$ 500'},'M1.P07A':{estado:'opcao',opcao:'Pegando emprestado com amigos ou família'}}};
  await page.goto(URL); await page.evaluate((x)=>{localStorage.clear();localStorage.setItem('lg2-turma-a-m01',JSON.stringify(x));},m1Completo); await page.reload(); await espera();
  await page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('lg2-turma-a-m03')||'{"v":8,"R":{},"hist":[]}');s.R={'M3.P02':{estado:'opcao',opcao:'Sim'}};s.hist=['M3.P06'];localStorage.setItem('lg2-turma-a-m03',JSON.stringify(s));});
  await page.reload(); await clicar('#ir','Continuar de onde parei'); await espera();
  check(await naTela('6') && await page.locator('#veio-m1').count()===1 && (await page.locator('#veio-m1').innerText()).includes('De 1 a 3 horas por dia') && (await page.locator('#veio-m1').innerText()).includes('Até R$ 500'), 'auditoria: cartão M1 mostra tempo, equipamento, dinheiro e opção sem dinheiro na P06');
  await page.locator('#trocar-m1').click();
  check(await page.locator('[data-m1]').count()===4, 'auditoria: Trocar abre os quatro campos para revisar');
  await page.locator('#salvar-m1').click();
  await page.goto(URL); await page.evaluate(()=>{localStorage.clear();localStorage.setItem('lg2-turma-a-m03',JSON.stringify({v:8,R:{'M3.P02':{estado:'opcao',opcao:'Sim'}},hist:['M3.P06']}));}); await page.reload(); await clicar('#ir','Continuar de onde parei'); await espera();
  check(await page.locator('#veio-m1').count()===0 && await naTela('6'), 'auditoria: sem respostas da Etapa 1, cartão não aparece e pergunta original segue visível');

  /* ============ R12. Voltar, teclado e visibilidade ============ */
  await page.goto(URL); await page.evaluate(() => localStorage.clear()); await page.reload(); await espera();
  await clicar('button', 'Começar'); await espera();
  await digitar('Bolos caseiros para festas no bairro'); await clicar('#ok', 'Continuar'); await espera();
  await clicar('.opcao', 'Sim'); await clicar('#ok', 'Continuar'); await espera();
  check(norm(await titulo()) === norm('Quando alguém precisa do que você vende, o que pode escolher no lugar?') && norm(await page.locator('.contexto').textContent()) === 'Pensando em: Bolos caseiros para festas no bairro', 'pergunta 3: enunciado fixo e lembra o que a pessoa vende em "Pensando em"');
  await clicar('#v', 'Voltar'); await espera();
  check(await naTela('2') && await page.evaluate(() => document.querySelector('#ent .opcao.sel').dataset.op) === 'Sim', 'Voltar: volta à pergunta anterior com a resposta marcada');
  await clicar('#v', 'Voltar'); await espera();
  check(await naTela('1') && await page.inputValue('#ent textarea') === 'Bolos caseiros para festas no bairro', 'Voltar: volta à 1 com o texto');
  await clicar('#v', 'Voltar'); await espera();
  check(await page.evaluate(() => !!document.querySelector('#ir')) && (await RR())['M3.P01'].valor === 'Bolos caseiros para festas no bairro' && (await RR())['M3.P02'].opcao === 'Sim', 'Voltar na 1ª pergunta abre a capa, sem perder as respostas');
  await clicar('#ir', 'Começar'); await espera();
  check(await naTela('1') && await page.inputValue('#ent textarea') === 'Bolos caseiros para festas no bairro', 'capa → Começar: reabre a 1 com o texto');
  await page.reload(); await espera();
  check(await page.evaluate(() => document.querySelector('#ir').textContent === 'Continuar de onde parei' && document.querySelector('#zerar') && document.querySelector('#zerar').textContent === 'Recomeçar do zero'), 'capa: oferece continuar e recomeçar quando já começou');
  await clicar('#zerar', 'Recomeçar do zero'); await espera();
  check(JSON.stringify(await estado()) === JSON.stringify({ v: 8, R: {}, hist: [] }) && await page.evaluate(() => document.querySelector('#ir').textContent === 'Começar'), 'Recomeçar do zero: apaga as respostas deste módulo');
  check(await page.evaluate(() => /interactive-widget=resizes-content/.test(document.querySelector('meta[name=viewport]').content)), 'viewport com interactive-widget=resizes-content');
  for (const [n, R0, sel] of [['4', {}, '#ent textarea'], ['20', NOMES1, '#ent input[data-c="min"]'], ['20', NOMES1, '#ent input[data-c="max"]'], ['15', {}, '#ent input[data-nome="3"]'], ['18', NOMES2, '.conc-bloco[data-nome="Padaria Central"] textarea']]) {
    await page.setViewportSize({ width: 390, height: 844 });
    await abrir(n, R0);
    await page.locator(sel).first().focus();
    await page.setViewportSize({ width: 390, height: 450 });
    await espera(700);
    const bx = await page.evaluate((sel) => { const r = (e) => { const b = e.getBoundingClientRect(); return [Math.round(b.top), Math.round(b.bottom)]; }; return { f: r(document.querySelector(sel)), ok: r(document.querySelector('#ok')), h: innerHeight }; }, sel);
    check(bx.f[0] >= 0 && bx.f[1] <= bx.h && bx.ok[0] >= 0 && bx.ok[1] <= bx.h, `teclado aberto (pergunta ${n}, ${sel}): campo e Continuar visíveis (${JSON.stringify(bx)})`);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await abrir('2');
  check(await page.evaluate(() => [...document.querySelectorAll('#ent .opcao')].every((b) => b.getAttribute('aria-pressed') === 'false' && !b.hasAttribute('role'))), 'D: opções começam com aria-pressed="false"');
  for (const o of ['Sim', 'Não', 'Sim']) await page.locator(`#ent .opcao[data-op="${o}"]`).click();
  check(JSON.stringify(await page.evaluate(() => [...document.querySelectorAll('#ent .opcao.sel')].map((x) => x.dataset.op))) === '["Sim"]', 'Sim/Não: só a última fica marcada');
  check(JSON.stringify(await page.evaluate(() => [...document.querySelectorAll('#ent .opcao')].map((x) => x.dataset.op + '=' + x.getAttribute('aria-pressed')))) === '["Sim=true","Não=false"]', 'D: escolha única: aria-pressed true na escolhida e false nas outras');
  check(await page.evaluate(() => getComputedStyle(document.querySelector('#ent .opcao')).webkitTapHighlightColor === 'rgba(0, 0, 0, 0)'), 'Sim/Não: sem realce azul do toque');
  for (const [n, R0] of [['2', {}], ['10', {}], ['15', {}], ['20', NOMES1], ['19', NOMES1], ['22B', NOMES1]]) {
    await abrir(n, R0);
    const v = await page.evaluate(() => { const b = document.querySelector('#v'), q = document.querySelector('.cartao-q h2.q'); return { n: document.querySelectorAll('#v').length, acima: b.getBoundingClientRect().bottom <= q.getBoundingClientRect().top + 1, txt: b.textContent.trim() }; });
    check(v.n === 1 && v.acima && v.txt === 'Voltar', `Voltar no topo do cartão (tela ${n})`);
  }
  await page.goto(URL); await page.evaluate(() => localStorage.clear()); await page.reload(); await espera();
  await clicar('#limites', 'O que esta etapa não faz'); await espera();
  await semModulo('limites'); await alvos44('limites');
  check(/Limites da etapa/.test(await tela()) && !/Quando procurar um profissional/.test(await tela()), 'limites: abre sem o quadro de profissional');
  await clicar('#v', 'Voltar'); await espera();
  check(await page.evaluate(() => !!document.querySelector('#ir')), 'limites: Voltar abre a capa');

  /* ============ R13. textos por tipo de negócio e versão "o que você imagina" ============ */
  const SERV = { v: 3, R: { 'M1.P01': { estado: 'opcao', opcao: 'Já vendo sempre' }, 'M1.P03': { estado: 'naosei' }, 'M1.P03A': { estado: 'opcao', opcao: 'Serviço: meu cliente paga pelo trabalho que realizo' } } };
  await abrir('3', {}, { 'lg2-turma-a-m01': SERV }, 'Quando alguém precisa do seu serviço, o que pode escolher no lugar?');
  const alt3 = await page.evaluate(() => { const b = document.querySelector('#ent .opcao'); return { rot: b.querySelector('b').textContent, ex: b.querySelector('.op-ex').textContent }; });
  check(alt3.rot === 'Contrata outra pessoa ou empresa que faz o mesmo' && alt3.ex === 'Ex.: o salão do bairro, outra manicure', `serviço: alternativa e exemplo de serviço na pergunta 3 (${JSON.stringify(alt3)})`);
  await abrir('19', NOMES1, { 'lg2-turma-a-m01': SERV });
  check(/Prazo \(tempo para atender\)/.test(await tela()), 'serviço: critério de prazo com texto de serviço');
  const EX_SERV = [['Vendo marmitas para trabalhadores do bairro', 'Faço unhas em domicílio para mulheres do bairro'], ['Quero vender marmitas para trabalhadores do bairro', 'Quero fazer unhas em domicílio para mulheres do bairro'],
    ['quem vende bolo caseiro perde cliente para a padaria ou para o bolo de pote', 'quem faz unhas em casa perde cliente para o salão ou para a cliente que faz sozinha'], ['quem vende bolo caseiro perde cliente para a padaria', 'quem faz unhas em casa perde cliente para o salão'],
    ['preço dos insumos subindo', 'preço do material de trabalho subindo'], ['vende o mesmo produto', 'faz o mesmo serviço'], ['(ex.: "bolos perto de mim")', '(ex.: "manicure perto de mim")'],
    ['entrega no mesmo dia, bolo sob medida, atendimento pelo WhatsApp', 'atendimento em casa, horário à noite, lembrete pelo WhatsApp'], ['entrega atrasada', 'atrasam o horário marcado'],
    ['(Horário, entrega, forma de atender)', '(Horário, se atendem em casa, forma de atender)'], ['Prazo (tempo para entregar)', 'Prazo (tempo para atender)']];
  const comoServ = (t) => EX_SERV.reduce((x, [de, para]) => x.split(de).join(para), String(t).replace(/\[do que você (?:quer vender|vende)\]/g, 'do seu serviço'));
  const TESTANDO = { estado: 'opcao', opcao: 'Já fiz um pouco para testar ou dar de amostra' };
  for (const q of D.perguntas.filter((q) => !q.oculta && q.variantes && q.variantes.ideia && q.codigo !== 'M3.P01')) {
    const n = q.codigo.slice(4).replace(/^0/, '');
    const txt = comoServ(Motor.variante(q, 'comecando').pergunta);
    await abrir(n, {}, { 'lg2-turma-a-m01': M1(TESTANDO) }, txt);
  }
  await abrir('13', {}, { 'lg2-turma-a-m01': M1(SO_CABECA) }, P(13).variantes.ideia.pergunta);
  await page.locator('#ent .opcao[data-op="Não sei"]').click(); await espera();
  { const pr = (await caixasR('#msg .caminho'))[0].prompt;
    check(pr.startsWith('Eu quero vender [produto ou serviço] em [cidade ou bairro]') && !pr.includes('lavagem'), `prompt: "Eu quero vender" e o colchete para a pessoa trocar (o texto dela não entra no meio da frase) (${pr.slice(0, 60)})`); }

  /* ============ R14. caminhos completos até o resultado (persistência, contagem, "O que entendemos", entregas) ============ */
  async function responderAtual(p02) {
    const cod = await atual();
    const n = cod.slice(4).replace(/^0/, '');
    const igual = p02 === 'Não';
    if (n === '1') await digitar('Resposta da pergunta 1 com detalhe');
    else if (n === '2') await clicar('.opcao', p02);
    else if (n === '3') { await page.locator('#ent .opcao').nth(1).click(); await page.locator('.alt-quais input').fill('lanche da padaria'); await page.locator('#ent .opcao').nth(2).click(); }
    else if (n === '4') await digitar('Mais gente pedindo pelo WhatsApp');
    else if (n === '7') await clicar('.opcao', 'Concorrente novo');
    else if (n === '9') await clicar('.opcao', 'No meu bairro e na minha cidade');
    else if (n === '10') { await clicar('.opcao', PESSOAS); await espera(); await clicar('.item-marcar[data-c="O que precisa resolver (a dor)"] .chip', DORES[1]); }
    else if (n === '12') await clicar('.opcao', 'Sim, seria difícil');
    else if (n === '13A') await clicar('.opcao', 'Indicação (boca a boca)');
    else if (n === '13') await clicar('.opcao', 'WhatsApp');
    else if (n === '15') { await page.locator('#ent input[data-nome]').nth(0).fill('Doces da Ana'); await page.locator('#ent input[data-nome]').nth(1).fill('Padaria Central'); }
    else if (n === '18') { await concTxt('Doces da Ana', 'Abre cedo, entrega no bairro'); await concTxt('Padaria Central', 'Só balcão, abre à tarde'); }
    else if (n === '20') { await concPreco('Doces da Ana', '40', '60'); await concPreco('Padaria Central', '30', '50'); }
    else if (n === '22') { await concTxt('Doces da Ana', 'Entregam rápido'); await concTxt('Padaria Central', 'Preço baixo'); }
    else if (n === '22B') { await concTxt('Doces da Ana', 'Demoram para responder'); await concTxt('Padaria Central', 'Fila grande'); }
    else if (n === '19') {
      for (const [c, i] of [['Preço', 0], ['Qualidade', 1], ['Atendimento', 2], ['Prazo (tempo para entregar)', 2]]) await marcaC('Doces da Ana', c, igual ? 1 : i);
      for (const [c, i] of [['Preço', 2], ['Qualidade', 0], ['Atendimento', 1], ['Prazo (tempo para entregar)', 1]]) await marcaC('Padaria Central', c, igual ? 1 : i);
    }
    else if (n === '21') await digitar('Entrego no mesmo dia e faço sob medida');
    else await digitar(`Resposta da pergunta ${n} com detalhe`);
    check(await page.evaluate(() => { const b = document.querySelector('#ok'); return !!b && !b.disabled && b.getAttribute('aria-disabled') !== 'true'; }), `B: Continuar sempre ativo (pergunta ${n})`);
    await clicar('#ok', 'Continuar'); await espera();
    /* A: um toque grava e já abre a próxima (ou o resultado); nada de "Seguir" nem "Corrigir minha resposta" */
    const depois = await atual();
    check(depois !== cod, `A: pergunta ${n} avança com UM toque em Continuar (${cod} → ${depois})`);
    check(!(await page.evaluate(() => [...document.querySelectorAll('button')].some((b) => /^(Seguir|Corrigir minha resposta)$/.test(b.textContent.trim())))), `A: sem "Seguir"/"Corrigir minha resposta" depois da pergunta ${n}`);
    check(await page.evaluate(() => { const a = document.activeElement; return !!a && (a.matches('h2.q') || a.matches('.conc-topo h2')); }), `D: depois de Continuar, o foco vai para o enunciado (${n})`);
    return n;
  }
  async function caminho(p02) {
    await page.goto(URL); await page.evaluate(() => localStorage.clear()); await page.reload();
    await clicar('button', 'Começar'); await espera();
    const vistos = [], kicks = [];
    for (let i = 0; i < 30; i++) {
      if (await page.evaluate(() => !!document.querySelector('#entendemos'))) break;
      kicks.push(await kicker());
      vistos.push(await responderAtual(p02));
      if (i === 3) {
        const antes = norm(await titulo()), antesE = JSON.stringify(await estado());
        await page.reload(); await espera();
        check(await clicar('button', 'Continuar de onde parei'), 'persistência: capa oferece continuar');
        await espera();
        check(norm(await titulo()) === antes && JSON.stringify(await estado()) === antesE, 'persistência: volta na mesma pergunta, com as respostas, após recarregar');
      }
    }
    return { vistos, kicks };
  }
  const cSim = await caminho('Sim');
  check(JSON.stringify(cSim.vistos) === JSON.stringify(TELAS_SIM), `P02 Sim: 22 telas na ordem nova (${cSim.vistos.join(',')})`);
  check(cSim.kicks[0] === 'Pergunta 1 de 22' && cSim.kicks[21] === 'Pergunta 22 de 22', `P02 Sim: "Pergunta N de M" acompanha o caminho (${cSim.kicks[0]} … ${cSim.kicks[21]})`);
  await semCodigos('resultado'); await fonte16('resultado');
  const RS = await RR();
  check(JSON.stringify(RS['M3.P18'].porNome) === JSON.stringify({ 'Doces da Ana': 'Abre cedo, entrega no bairro', 'Padaria Central': 'Só balcão, abre à tarde' })
    && JSON.stringify(RS['M3.P22'].porNome) === JSON.stringify({ 'Doces da Ana': 'Entregam rápido', 'Padaria Central': 'Preço baixo' })
    && JSON.stringify(RS['M3.P22B'].porNome) === JSON.stringify({ 'Doces da Ana': 'Demoram para responder', 'Padaria Central': 'Fila grande' }), 'dois concorrentes: respostas de texto guardadas separadas');
  check(RS['M3.P20'].min === 30 && RS['M3.P20'].max === 60 && RS['M3.P20'].valor === 'de R$ 30,00 a R$ 60,00' && RS['M3.P20'].porNome['Doces da Ana'].valor === 'de R$ 40,00 a R$ 60,00' && RS['M3.P20'].porNome['Padaria Central'].valor === 'de R$ 30,00 a R$ 50,00',
    `dois concorrentes: preço de cada um separado e faixa geral (${JSON.stringify(RS['M3.P20'])})`);
  check(RS['M3.P19'].porNome['Doces da Ana'].tabela['Preço'] === 'Melhor' && RS['M3.P19'].porNome['Padaria Central'].tabela['Preço'] === 'Pior' && RS['M3.P19'].porNome['Padaria Central'].tabela.Qualidade === 'Melhor', 'dois concorrentes: comparação de cada um separada');
  check(JSON.stringify(RS['M3.P03']) === JSON.stringify({ estado: 'valor', valor: 'Compra outra coisa que resolve a mesma necessidade: lanche da padaria; Faz em casa ou faz sozinho', tipos: ['Compra outra coisa que resolve a mesma necessidade', 'Faz em casa ou faz sozinho'], quais: { 'Compra outra coisa que resolve a mesma necessidade': 'lanche da padaria' } }),
    `P03: várias alternativas + "quais" (${JSON.stringify(RS['M3.P03'])})`);
  const res = await page.evaluate(() => ({
    cont: document.querySelector('.res-num .val').textContent.trim(), sub: document.querySelector('.res-num .sub').textContent.trim(),
    etapas: [...document.querySelectorAll('.etapa')].map((e) => e.dataset.cod), semResp: document.querySelectorAll('.etapa.e-nao').length,
    ent: [...document.querySelectorAll('#entendemos > p:not(.como-calc)')].map((x) => x.textContent), li: document.querySelectorAll('#entendemos li').length, calc: (document.querySelector('#entendemos .como-calc') || {}).textContent,
    conc: [...document.querySelectorAll('#tabela-conc .conc')].map((c) => [c.dataset.nome, ...[...c.querySelectorAll('dd')].map((x) => x.textContent)]),
    quadro: Object.fromEntries([...document.querySelectorAll('#quadro-conc .q-cel')].map((c) => [c.dataset.q, [c.querySelector('h3').textContent, ...[...c.querySelectorAll('li')].map((x) => x.textContent)]])),
    prox: (document.querySelector('.acoes.lg2-proximo a') || {}).textContent, pend: document.querySelectorAll('.pend').length,
  }));
  check(res.cont === '22 de 22' && res.sub === 'nenhuma com “Não sei”' && res.pend === 0, `resultado: contagem igual à do topo (${res.cont}; ${res.sub})`);
  check(!res.etapas.some((c) => ESCONDIDAS.map((n) => COD(n)).includes(c)) && res.etapas.length === 22 && res.semResp === 0, `resultado: as 22 perguntas respondidas, sem as escondidas (${res.etapas.length})`);
  const entJ = res.ent.join(' ');
  check(res.ent.length >= 1 && res.ent.length <= 3 && res.li === 0, `resultado: "O que entendemos" em 1 a 3 parágrafos, sem lista (${res.ent.length})`);
  check(entJ.includes('O que você vende: “Resposta da pergunta 1 com detalhe”') && entJ.includes('Você vende no seu bairro e na sua cidade, e os clientes que você mais atende são pessoas comuns')
    && entJ.includes(`O que o cliente quer resolver com você: “${DORES[1]}”`), `"O que entendemos": negócio, alcance, cliente e dor (${res.ent[0]})`);
  check(entJ.includes('As pessoas ficam sabendo de você por indicação (boca a boca) e compram por WhatsApp.') && entJ.includes('Quem vende algo parecido: “Doces da Ana, Padaria Central”; eles cobram em torno de R$ 45,00.')
    && entJ.includes('O que faz o cliente preferir você: “Entrego no mesmo dia e faço sob medida”.'), `"O que entendemos": canais, concorrentes, preço médio e diferencial (${res.ent.slice(1).join(' / ')})`);
  check(res.calc === 'Como calculamos: (R$ 40,00 + R$ 60,00 + R$ 30,00 + R$ 50,00) ÷ 4 = R$ 45,00, a média dos preços que você viu.', `"Como calculamos" do preço médio, conferido à mão (${res.calc})`);
  check(JSON.stringify(res.conc.map((c) => c[0])) === '["Doces da Ana","Padaria Central","Lanche da padaria; Fazer em casa ou sozinho"]', `tabela: um cartão por concorrente + o que escolhem no lugar (${res.conc.map((c) => c[0])})`);
  check(JSON.stringify(res.conc[0].slice(2, 6)) === JSON.stringify(['de R$ 40,00 a R$ 60,00', 'Entregam rápido', 'Demoram para responder', 'Abre cedo, entrega no bairro'])
    && JSON.stringify(res.conc[1].slice(2, 6)) === JSON.stringify(['de R$ 30,00 a R$ 50,00', 'Preço baixo', 'Fila grande', 'Só balcão, abre à tarde']), 'tabela: cada concorrente com as próprias respostas (preço, bem, mal, como trabalha)');
  check(JSON.stringify(res.quadro.fortes) === JSON.stringify(['Pontos fortes dos concorrentes', 'Doces da Ana: Entregam rápido', 'Padaria Central: Preço baixo']), `quadro: pontos fortes por concorrente (${res.quadro.fortes})`);
  check(JSON.stringify(res.quadro.fracos) === JSON.stringify(['Pontos fracos dos concorrentes', 'Doces da Ana: Demoram para responder', 'Padaria Central: Fila grande']), `quadro: pontos fracos por concorrente (${res.quadro.fracos})`);
  check(res.quadro.oportunidades.includes('Novidade que pode ajudar: “Mais gente pedindo pelo WhatsApp”') && res.quadro.oportunidades.includes('O que pode mudar no jeito de comprar: “Resposta da pergunta 8 com detalhe”')
    && res.quadro.oportunidades.includes('Você se sai melhor que Doces da Ana em preço') && res.quadro.oportunidades.includes('Você se sai melhor que Padaria Central em qualidade'), `quadro: oportunidades montadas com as respostas (${res.quadro.oportunidades})`);
  check(res.quadro.ameacas.includes('O que pode atrapalhar: concorrente novo') && res.quadro.ameacas.includes('As pessoas podem escolher no lugar: lanche da padaria e fazer em casa ou sozinho')
    && res.quadro.ameacas.includes('Doces da Ana se sai melhor que você em atendimento e prazo (tempo para entregar)') && res.quadro.ameacas.includes('Padaria Central se sai melhor que você em preço'), `quadro: ameaças montadas com as respostas (${res.quadro.ameacas})`);
  check(res.prox === 'Ir para a Etapa 4', 'E: resultado: link exato "Ir para a Etapa 4" na caixa lg2-proximo');
  check(await page.evaluate(() => { const a = document.querySelector('.acoes.lg2-proximo a'); const r = a.getBoundingClientRect(); return r.height >= 44 && getComputedStyle(a).visibility === 'visible'; }), 'resultado: lg2-proximo visível');
  await semModulo('resultado'); await alvos44('resultado');
  const leve = await page.evaluate(() => { const t = document.querySelector('#tarefa'), e = document.querySelector('#entendemos');
    return { tarefa: t && t.querySelector('b').textContent, txt: t && t.querySelector('p').textContent, ordem: !!(t && (e.compareDocumentPosition(t) & Node.DOCUMENT_POSITION_FOLLOWING)),
      abertos: [...document.querySelectorAll('.resultado-mais, #respostas')].every((d) => d.open), n: document.querySelectorAll('.resultado-mais').length,
      dentro: ['#roteiro', '#tabela-conc', '#quadro-conc'].every((s) => document.querySelector(s).closest('details.resultado-mais')) }; });
  check(leve.tarefa === 'Sua tarefa para fazer já' && /^Procure pelo menos 3 concorrentes/.test(leve.txt) && leve.ordem && leve.abertos && leve.n === 4 && leve.dentro, `resultado: "O que entendemos" + tarefa no alto, seções abertas (${JSON.stringify(leve)})`);
  await page.evaluate(() => document.querySelector('#quadro-conc').scrollIntoView({ block: 'start' }));
  await shot('l5_m03_quadro');
  /* Ajustar no resultado: abre a pergunta e volta ao resultado */
  await page.goto(URL); await clicar('#ir', 'Continuar de onde parei'); await espera();
  check(await page.evaluate(() => !!document.querySelector('#entendemos')), 'persistência: resultado reabre depois de recarregar');
  await clicar('#rev', 'Revisar respostas'); await espera();
  check(await naTela('1') && await page.inputValue('#ent textarea') === 'Resposta da pergunta 1 com detalhe', 'Revisar respostas: volta à 1ª pergunta com a resposta');
  const cNao = await caminho('Não');
  check(JSON.stringify(cNao.vistos) === JSON.stringify(TELAS_NAO), `P02 Não: 17 telas (${cNao.vistos.join(',')})`);
  check(cNao.kicks[2] === 'Pergunta 3 de 22', `G: P02 Não: o total do topo não pula no meio (${cNao.kicks[2]})`);
  for (const [nome, ks] of [['Sim', cSim.kicks], ['Não', cNao.kicks]]) {
    const ns = ks.map((k) => k.match(/^Pergunta (\d+) de (\d+)$/)).map((m) => m && [+m[1], +m[2]]);
    check(ns.every(Boolean) && new Set(ns.map((x) => x[1])).size === 1 && ns.every((x, i) => i === 0 || x[0] === ns[i - 1][0] + 1), `G: P02 ${nome}: total estável e número que só anda para frente (${ks.join(', ')})`);
  }
  const qNao = await page.evaluate(() => Object.fromEntries([...document.querySelectorAll('#quadro-conc .q-cel')].map((c) => [c.dataset.q, { li: c.querySelectorAll('li').length, txt: c.textContent }])));
  check(qNao.oportunidades.li === 0 && /a anotar/.test(qNao.oportunidades.txt) && !/O que pode atrapalhar/.test(qNao.ameacas.txt), 'quadro: só com o que foi respondido; sem invenção');
  check(await page.evaluate(() => document.querySelector('.res-num .val').textContent.trim()) === '17 de 17', 'P02 Não: resultado conta 17 de 17');
  /* trocar Sim por Não descarta as respostas puladas, mas não as escondidas */
  await abrir('2', { 'M3.P03': { estado: 'valor', valor: 'Padaria do bairro' }, 'M3.P21': { estado: 'valor', valor: 'Entrego no mesmo dia' }, 'M3.P16': { estado: 'valor', valor: 'Mesmo bairro' } });
  await clicar('.opcao', 'Não'); await clicar('#ok', 'Continuar'); await espera();
  const RN = await RR();
  check(!RN['M3.P03'] && RN['M3.P21'] && RN['M3.P16'] && await naTela('9'), 'P02 Não: descarta 3 a 8; outras respostas e as das escondidas continuam salvas');

  /* ============ R15. migração do estado salvo (versões 6, 7 e 4 → 8) ============ */
  await page.goto(URL);
  await page.evaluate(([k, P, Dr]) => { localStorage.clear(); localStorage.setItem(k, JSON.stringify({ v: 6, R: {
    'M3.P02': { estado: 'opcao', opcao: 'Sim' },
    'M3.P07': { estado: 'naosei', marcados: ['concorrente novo', 'mudança de regra'] },
    'M3.P12': { estado: 'naosei', marcados: ['clientes fiéis'] },
    'M3.P19': { estado: 'naosei', tabela: { 'Preço': 'Pior', Qualidade: 'Melhor' } },
    'M3.P10': { estado: 'opcao', opcao: P, opcoes: [P], campos: { Idade: 'Até 17 anos; 18 a 29 anos', 'Onde mora': 'Centro', [Dr]: 'Falta de tempo' } },
    'M3.P06': { estado: 'valor', valor: 'Tenho fogão' } }, hist: ['RESULTADO'] })); }, [CHAVE, PESSOAS, DOR]);
  await page.reload(); await espera();
  const S8 = await estado();
  check(S8.v === 8, 'migração: estado da versão 6 vira 8 na abertura');
  check(JSON.stringify(S8.R['M3.P07']) === '{"estado":"opcoes","opcoes":["Concorrente novo","Mudança de regra"]}', 'migração: exemplos marcados nos riscos viram resposta fechada');
  check(JSON.stringify(S8.R['M3.P12']) === '{"estado":"opcao","opcao":"Sim, seria difícil"}' && JSON.stringify(S8.R['M3.P12B']) === '{"estado":"valor","valor":"clientes fiéis"}', 'migração: barreiras marcadas viram "seria difícil" + o que dificulta');
  check(S8.R['M3.P19'].estado === 'valor' && S8.R['M3.P19'].valor === 'Preço: Pior; Qualidade: Melhor', 'migração: tabela da comparação vira resposta');
  check(S8.R['M3.P10'].campos.Idade === 'Até 10 anos (infantil); 11 a 17 anos; 18 a 29 anos' && S8.R['M3.P10'].campos['Onde mora'] === 'Centro', 'migração: "Até 17 anos" vira as duas faixas novas; texto antigo fica');
  check(S8.R['M3.P06'] && S8.R['M3.P06'].valor === 'Tenho fogão', 'migração: resposta de pergunta escondida não é apagada');
  await clicar('button', 'Continuar de onde parei'); await espera();
  const res6 = await page.evaluate(() => ({ ok: !!document.querySelector('#entendemos'), r19: (document.querySelector('.etapa[data-cod="M3.P19"] .etapa-r') || {}).textContent,
    op: [...document.querySelectorAll('#quadro-conc .q-oportunidades li')].map((x) => x.textContent), am: [...document.querySelectorAll('#quadro-conc .q-ameacas li')].map((x) => x.textContent) }));
  check(res6.ok && res6.r19 === 'Preço: Pior; Qualidade: Melhor' && res6.op.includes('Você se sai melhor em qualidade') && res6.am.includes('Os outros se saem melhor em preço'), `migração: o resultado abre e usa a comparação antiga (${JSON.stringify(res6)})`);
  await abrir('10', { 'M3.P10': { estado: 'opcao', opcao: PESSOAS, opcoes: [PESSOAS], campos: { 'Onde mora': 'Centro', [DOR]: 'Falta de tempo' } } });
  const antigo10 = await page.evaluate(() => [...document.querySelectorAll('.item-marcar .mini-info')].map((x) => x.textContent));
  check(antigo10.includes('Você tinha escrito: Centro') && antigo10.includes('Você tinha escrito: Falta de tempo'), 'perfil antigo: o texto escrito antes aparece e não se perde');
  await clicar('.item-marcar[data-c="Onde mora"] .chip', LUGARES[1]);
  await clicar('#ok', 'Continuar'); await espera();
  check((await RR())['M3.P10'].campos['Onde mora'] === `${LUGARES[1]}; Centro`, 'perfil antigo: marcar uma opção mantém o texto antigo junto');
  /* versão 7 (antes deste lote): "Não sei" vira sem resposta; o resto fica e aparece no resultado */
  await page.goto(URL);
  await page.evaluate((k) => { localStorage.clear(); localStorage.setItem(k, JSON.stringify({ v: 7, R: {
    'M3.P01': { estado: 'valor', valor: 'Negócio inventado de teste' }, 'M3.P02': { estado: 'opcao', opcao: 'Sim' }, 'M3.P03': { estado: 'naosei' },
    'M3.P04': { estado: 'valor', valor: 'Novidade inventada' }, 'M3.P08': { estado: 'naosei' },
    'M3.P13': { estado: 'opcoes', opcoes: ['Indicação (boca a boca)', 'WhatsApp (WhatsApp Business)', 'Não sei'] },
    'M3.P14': { estado: 'valor', campos: { 'O que você faz de melhor': 'Força inventada', 'O que precisa melhorar': 'Fraqueza inventada' } },
    'M3.P20': { estado: 'valor', valor: 'de R$ 10,00 a R$ 20,00', min: 10, max: 20 } }, hist: ['RESULTADO'] })); }, CHAVE);
  await page.reload(); await espera();
  const S7 = await estado();
  check(S7.v === 8 && !S7.R['M3.P03'] && !S7.R['M3.P08'] && S7.R['M3.P04'].valor === 'Novidade inventada' && S7.R['M3.P01'].valor === 'Negócio inventado de teste', 'migração v7: "Não sei" vira sem resposta; as outras respostas ficam');
  check(JSON.stringify(S7.R['M3.P13']) === '{"estado":"opcoes","opcoes":["WhatsApp (WhatsApp Business)"]}' && JSON.stringify(S7.R['M3.P13A']) === '{"estado":"opcoes","opcoes":["Indicação (boca a boca)"]}', 'migração v7: indicação vai para "como fica sabendo"; "Não sei" sai da lista');
  check(S7.R['M3.P14'].valor === 'Força inventada' && S7.R['M3.P14B'].valor === 'Fraqueza inventada' && S7.R['M3.P20'].min === 10, 'migração v7: pontos forte e fraco viram duas respostas; preço antigo fica');
  await clicar('button', 'Continuar de onde parei'); await espera();
  const res7 = await page.evaluate(() => ({ r04: (document.querySelector('.etapa[data-cod="M3.P04"] .etapa-r') || {}).textContent, r14b: (document.querySelector('.etapa[data-cod="M3.P14B"] .etapa-r') || {}).textContent,
    r20: (document.querySelector('.etapa[data-cod="M3.P20"] .etapa-r') || {}).textContent, sem: [...document.querySelectorAll('#pendentes .pend')].map((x) => x.dataset.cod), naoE3: !!document.querySelector('.etapa.e-nao[data-cod="M3.P03"]') }));
  check(res7.r04 === 'Novidade inventada' && res7.r14b === 'Fraqueza inventada' && res7.r20 === 'de R$ 10,00 a R$ 20,00', `migração v7: respostas mantidas aparecem no resultado (${JSON.stringify(res7)})`);
  check(res7.sem.includes('M3.P03') && res7.sem.includes('M3.P08') && res7.naoE3, 'migração v7: o antigo "Não sei" aparece em "Perguntas sem resposta"');
  await clicar('.preencher[data-cod="M3.P03"]', 'Responder agora'); await espera();
  check(norm(await titulo()) === norm('Quando alguém precisa do que você vende, o que pode escolher no lugar?') && await page.locator('#ent .opcao.sel').count() === 0 && await page.locator('#ajudans .caminho').count() === 0, 'migração v7: "Responder agora" abre a pergunta vazia');
  await page.locator('#ent .opcao').nth(3).click(); await clicar('#ok', 'Continuar'); await espera();
  check(await page.evaluate(() => !!document.querySelector('#entendemos')) && (await RR())['M3.P03'].tipos[0] === 'Deixa para depois ou fica sem', 'migração v7: depois de responder, volta ao resultado');
  /* versão 4: canais antigos */
  await page.goto(URL);
  await page.evaluate((k) => { localStorage.clear(); localStorage.setItem(k, JSON.stringify({ v: 4, R: { 'M3.P13': { estado: 'opcoes', opcoes: ['Loja física', 'Redes sociais (Instagram, Facebook, WhatsApp)', 'Outro'], detalhe: 'Feira' } }, hist: ['M3.P13'] })); }, CHAVE);
  await page.reload(); await clicar('button', 'Continuar de onde parei'); await espera();
  check(JSON.stringify(await page.evaluate(() => [...document.querySelectorAll('.opcao.sel')].map((x) => x.dataset.op))) === JSON.stringify(['WhatsApp (WhatsApp Business)', 'Instagram e outras redes sociais (catálogo)', 'Atendimento direto ou presencial (loja, feira, ponto)', 'Outro'])
    && await page.inputValue('.extra textarea') === 'Feira' && (await estado()).v === 8, 'versão 4: canais antigos migrados até a versão 8');
  const antigoV2 = JSON.stringify({ v: 2, R: { 'M3.P01': { estado: 'valor', valor: 'bolo' } }, hist: ['M3.P01'] });
  for (const [nome, chave] of [['mesma chave', CHAVE], ['chave antiga da turma B', 'lg2-turma-b-m03']]) {
    await page.goto(URL);
    await page.evaluate(([k, s]) => { localStorage.clear(); localStorage.setItem(k, s); }, [chave, antigoV2]);
    await page.reload(); await espera();
    check(await page.evaluate(() => [...document.querySelectorAll('button')].some((b) => b.textContent === 'Começar')), `estado antigo (${nome}): começa do zero`);
  }
  await page.goto(URL);
  await page.evaluate((s) => { localStorage.clear(); localStorage.setItem('lg2-turma-b-m03', s); }, JSON.stringify({ v: 8, R: { 'M3.P01': { estado: 'valor', valor: 'Bolo da turma B' } }, hist: ['M3.P01'] }));
  await page.reload(); await espera();
  check((await RR())['M3.P01'].valor === 'Bolo da turma B' && await page.evaluate(() => document.querySelector('#ir').textContent === 'Continuar de onde parei'), 'chave antiga da turma B (versão atual): as respostas vêm para a turma A');


  /* ============ R16. lote 17/11 "tira a fricção" (A–G) ============ */
  await page.setViewportSize({ width: 390, height: 844 });
  /* A: retorno ao vivo num campo de texto (antes de tocar Continuar) e UM toque para seguir */
  await abrir('4');
  await digitar('Pix'); await espera(900);
  const vivo4 = await caixasR('#msg .caminho');
  check(vivo4.length === 1 && vivo4[0].tipo === 'Dica' && await naTela('4'), `A: texto curto mostra a dica ao vivo, sem tocar Continuar (${vivo4.map((c) => c.tipo)})`);
  await espera(1000);   // a pessoa lê a dica antes de tocar
  await clicar('#ok', 'Continuar'); await espera();
  check(await naTela('5') && (await RR())['M3.P04'].valor === 'Pix', 'A: com a dica à vista, UM toque em Continuar grava e abre a próxima');
  check(!(await page.locator('.sobre-ant').count()), 'A: retorno já visto ao vivo não se repete na próxima tela');
  /* ao sair do campo o retorno aparece na hora */
  await abrir('5'); await digitar('Sim'); await page.locator('#ent textarea').evaluate((t) => t.blur()); await espera(150);
  check((await caixasR('#msg .caminho')).length === 1, 'A: ao sair do campo, o retorno aparece sem esperar');
  /* tocou Continuar logo depois de digitar: o retorno vai num cartão pequeno no topo da próxima tela */
  await abrir('5'); await digitar('Sim'); await clicar('#ok', 'Continuar'); await espera();
  const sob = await page.evaluate(() => { const c = document.querySelector('.sobre-ant'); return c && { t: c.querySelector('b').textContent, p: c.querySelector('p').textContent, antes: !!(c.compareDocumentPosition(document.querySelector('h2.q')) & Node.DOCUMENT_POSITION_FOLLOWING) }; });
  check(await naTela('7') && sob && sob.t === 'Sobre a sua resposta anterior' && sob.p === P(5).caminhos.find((c) => c.opcao === 'Resposta vazia ou muito curta').texto && sob.antes, `A: retorno não visto vai para o topo da próxima tela (${JSON.stringify(sob)})`);
  /* escolha: retorno no toque */
  await abrir('9'); await clicar('.opcao', 'Também fora do Brasil'); await espera();
  check((await caixasR('#msg .caminho')).some((c) => c.tipo === 'Dica') && await naTela('9'), 'A: escolha mostra o retorno no toque');
  await clicar('#ok', 'Continuar'); await espera();
  check(await naTela('10') && !(await page.evaluate(() => [...document.querySelectorAll('button')].some((b) => /^(Seguir|Corrigir minha resposta)$/.test(b.textContent.trim())))), 'A: escolha com retorno segue com UM toque');
  /* só o aviso de risco real (preço fora do comum) pede o 2º toque: coberto em R9 */

  /* B: Continuar sempre ativo; sem resposta, mensagem simples logo acima do botão, com role="alert" */
  for (const [n, R0, esperado] of [['2', {}, 'Escolha uma opção para continuar.'], ['5', {}, 'Escreva a sua resposta no campo acima para continuar.']]) {
    await abrir(n, R0);
    check(await page.evaluate(() => !document.querySelector('#ok').disabled), `B: Continuar ativo sem resposta (pergunta ${n})`);
    await clicar('#ok', 'Continuar'); await espera();
    const e = await page.evaluate(() => { const e = document.querySelector('#erro'), ok = document.querySelector('#ok'); const a = e.getBoundingClientRect(), b = ok.getBoundingClientRect();
      return { txt: e.textContent, role: e.getAttribute('role'), acima: a.bottom <= b.top + 1 && b.top - a.bottom < 40, vis: a.top >= 0 && b.bottom <= innerHeight }; });
    check(e.txt === esperado && e.role === 'alert' && e.acima && e.vis, `B: mensagem logo acima do Continuar, à vista (${n}: ${JSON.stringify(e)})`);
  }

  /* C: Continuar inteiro dentro da tela, sem rolar: 360x640, 390x844 com letra 130% e 740x360, em todas as perguntas */
  const N2 = NOMES2, PREC = { 'M3.P02': { estado: 'opcao', opcao: 'Sim' } };
  for (const n of TELAS_SIM) {
    await page.setViewportSize({ width: 390, height: 844 });
    await abrir(n, Object.assign({}, PREC, ['18', '20', '22', '22B', '19'].includes(n) ? N2 : {}), {}, n === '3' ? T3 : null);
    const fora = [];
    for (const [w, h, fs] of [[360, 640, ''], [390, 844, '130%'], [740, 360, '']]) {
      await page.setViewportSize({ width: w, height: h });
      const m = await page.evaluate((fs) => { document.documentElement.style.fontSize = fs; window.scrollTo(0, 0); const b = document.querySelector('#ok').getBoundingClientRect();
        return { y: Math.round(scrollY), top: Math.round(b.top), bot: Math.round(b.bottom), h: innerHeight }; }, fs);
      if (!(m.y === 0 && m.top >= 0 && m.bot <= m.h)) fora.push(`${w}x${h}${fs}: ${JSON.stringify(m)}`);
    }
    await page.evaluate(() => { document.documentElement.style.fontSize = ''; });
    check(!fora.length, `C: Continuar à vista sem rolar (pergunta ${n}) ${fora.join(' ')}`);
  }
  await page.setViewportSize({ width: 360, height: 640 });
  await abrir('10'); await clicar('.opcao', PESSOAS); await clicar('.opcao', 'Empresas'); await espera();
  const ultimo = await page.evaluate(() => { window.scrollTo(0, document.scrollingElement.scrollHeight); const cs = [...document.querySelectorAll('.cartao-q button, .cartao-q input, .cartao-q textarea')].filter((e) => e.offsetParent);
    const u = cs[cs.length - 1].getBoundingClientRect(), f = document.querySelector('#fixo').getBoundingClientRect(); return { u: Math.round(u.bottom), f: Math.round(f.top) }; });
  check(ultimo.u <= ultimo.f, `C: rolando até o fim, o último campo não fica embaixo do Continuar fixo (${JSON.stringify(ultimo)})`);
  await page.setViewportSize({ width: 390, height: 844 });

  /* D: múltipla, marcadores e tabela dizem se estão marcados; foco no enunciado depois de Continuar */
  await abrir('7'); await clicar('.opcao', 'Concorrente novo'); await clicar('.opcao', 'Mudança de regra');
  check(JSON.stringify(await page.evaluate(() => [...document.querySelectorAll('#ent .opcao')].filter((b) => b.getAttribute('aria-pressed') === 'true').map((b) => b.dataset.op))) === '["Concorrente novo","Mudança de regra"]'
    && await page.evaluate(() => [...document.querySelectorAll('#ent .opcao')].every((b) => ['true', 'false'].includes(b.getAttribute('aria-pressed')))), 'D: múltipla escolha com aria-pressed');
  await clicar('#ok', 'Continuar'); await espera();
  check(await naTela('8') && await page.evaluate(() => document.activeElement && document.activeElement.matches('h2.q') && document.activeElement.getAttribute('tabindex') === '-1'), 'D: depois de Continuar, o foco está no enunciado da pergunta nova');
  await abrir('10'); await clicar('.opcao', PESSOAS); await clicar('.item-marcar[data-c="Idade"] .chip', '18 a 29 anos');
  check(await page.evaluate(() => { const cs = [...document.querySelectorAll('.item-marcar[data-c="Idade"] .chip')]; return cs.every((c) => c.getAttribute('aria-pressed') === String(c.textContent === '18 a 29 anos')); }), 'D: marcadores do perfil com aria-pressed');
  await abrir('19', NOMES1); await marcaC('Doces da Ana', 'Preço', 0);
  check(await page.evaluate(() => [...document.querySelectorAll('.t-linha[data-crit="Preço"] .t-op')].map((b) => b.getAttribute('aria-pressed')).join() === 'true,false,false'), 'D: Melhor/Igual/Pior com aria-pressed');
  await abrir('3', {}, {}, T3); await page.locator('#ent .opcao').nth(0).click();
  check(await page.evaluate(() => [...document.querySelectorAll('#ent .opcao')].map((b) => b.getAttribute('aria-pressed')).join() === 'true,false,false,false'), 'D: alternativas da pergunta 3 com aria-pressed');

  /* E/F: perguntas sem "Módulo" e com alvos de toque >= 44 px (inclusive dica aberta, Não sei aberto, cartão Veio da Etapa) */
  for (const [n, R0, extra] of [['3', {}, 'ns'], ['4', {}, 'ns'], ['7', {}, 'dica'], ['10', {}, 'campos'], ['15', {}, 'ns'], ['18', NOMES1, 'ns'], ['19', NOMES1, ''], ['20', NOMES1, 'ns']]) {
    await abrir(n, R0, {}, n === '3' ? T3 : null);
    if (extra === 'ns') { await page.locator('#ns').click(); await espera(); }
    if (extra === 'dica') await page.locator('.dica-q summary').click();
    if (extra === 'campos') { await clicar('.opcao', PESSOAS); await espera(); }
    await semModulo(`pergunta ${n}`); await alvos44(`pergunta ${n}${extra ? ' + ' + extra : ''}`);
  }
  await abrir('12', {}, { 'lg2-turma-b-m02': { v: 9, R: { 'M2.P07': { estado: 'opcao', opcao: 'Pessoas' } } } });
  await semModulo('cartão Veio da Etapa 2'); await alvos44('cartão Veio da Etapa 2');
  await page.goto(URL); await page.evaluate(() => localStorage.clear()); await page.reload(); await espera();
  await page.locator('.como-funciona summary').click(); await semModulo('capa aberta'); await alvos44('capa com Como funciona aberto');

  /* G: tempo da capa = ~35 s por pergunta do caminho mais comum, em múltiplo de 5 min */
  const min = (n) => Math.max(5, Math.round((n * 35) / 60 / 5) * 5);
  check(min(22) === 15 && min(20) === 10, 'G: conta do tempo (22 perguntas → 15 min; 20 → 10 min)');
  await page.goto(URL);
  await page.evaluate(([m1, m2]) => { localStorage.clear(); localStorage.setItem('lg2-turma-a-m01', m1); localStorage.setItem('lg2-turma-b-m02', m2); },
    [JSON.stringify({ v: 3, R: { 'M1.P03': { estado: 'valor', valor: 'bolo caseiro' } } }), JSON.stringify({ v: 9, R: { 'M2.P07': { estado: 'opcao', opcao: 'Pessoas' } } })]);
  await page.reload(); await espera();
  check(await page.evaluate(() => document.querySelector('.tempo').textContent) === 'Esta etapa leva cerca de 10 minutos.', 'G: com as Etapas 1 e 2 feitas (20 perguntas), a capa promete 10 minutos');
  await clicar('#ir', 'Começar'); await espera();
  check(await kicker() === 'Pergunta 1 de 20', `G: com as Etapas 1 e 2 feitas, o contador é de 20 (${await kicker()})`);

  /* ============ R17. lote 26/11 ============ */
  /* A: texto livre da pessoa nunca no meio da frase (enunciado, pedido para a IA, roteiro, "O que entendemos") */
  const PIJ = { v: 3, R: { 'M1.P01': { estado: 'opcao', opcao: 'Já vendo sempre' }, 'M1.P03': { estado: 'valor', valor: 'tenho uma loja de pijamas' }, 'M1.P03A': { estado: 'opcao', opcao: 'Mercadoria: compro pronto para revender' } } };
  await abrir('3', {}, { 'lg2-turma-a-m01': PIJ }, 'Quando alguém precisa da mercadoria que você vende, o que pode escolher no lugar?');
  check(!(await titulo()).includes('pijamas') && /Pensando em: tenho uma loja de pijamas/.test(norm(await page.locator('.contexto').textContent())), 'A: pergunta 3 sem o texto livre no enunciado; "Pensando em" mostra o que a pessoa escreveu');
  await shot('m03_depois_pijamas');
  await clicar('#ns', 'Não sei'); await espera();
  check(!(await caixasR('#ajudans .caminho'))[0].prompt.includes('pijamas'), 'A: pedido para a IA sem o texto livre encaixado');
  await page.goto(URL);
  await page.evaluate(([k, m1]) => { localStorage.clear(); localStorage.setItem('lg2-turma-a-m01', m1); localStorage.setItem(k, JSON.stringify({ v: 8, R: { 'M3.P02': { estado: 'opcao', opcao: 'Sim' } }, hist: ['RESULTADO'] })); }, [CHAVE, JSON.stringify(PIJ)]);
  await page.reload(); await espera(); await clicar('#ir', 'Continuar de onde parei'); await espera();
  const rPij = await page.evaluate(() => ({ rot: document.querySelector('#roteiro').textContent, ent: document.querySelector('#entendemos').textContent }));
  check(!/pijamas perto de mim/.test(rPij.rot) && /o que você vende e “perto de mim”/.test(rPij.rot), 'A: roteiro de pesquisa sem o texto livre encaixado na busca');
  check(!/Você vende “/.test(rPij.ent) && /Sobre o seu negócio, você disse: “tenho uma loja de pijamas”/.test(rPij.ent), `A: "O que entendemos" põe o texto livre depois de dois-pontos (${rPij.ent.slice(0, 120)})`);
  /* C: M2.P22 "O que os clientes buscam?" vale como a P11 (sem tela, cartão "Veio da Etapa 2 · Trocar") */
  const P22 = 'Roupa confortável para dormir';
  const M2C = { v: 9, R: { 'M2.P07': { estado: 'opcao', opcao: 'Pessoas' }, 'M2.P13': { estado: 'opcao', opcao: 'Qualidade' }, 'M2.P22': { estado: 'valor', valor: P22 } } };
  await abrir('12', {}, { 'lg2-turma-b-m02': M2C });
  let R17 = await RR();
  check(JSON.stringify(R17['M3.P11']) === JSON.stringify({ estado: 'valor', valor: P22, herdado: 'M2' }), `C: P11 gravada com a resposta da Etapa 2, mesmo com a dor do perfil (${JSON.stringify(R17['M3.P11'])})`);
  const c11 = await page.evaluate(() => { const c = document.querySelector('.herdado-mini[data-cod="M3.P11"]'); return c && { selo: c.querySelector('.selo-m').textContent, txt: c.querySelector('.herdado-txt').textContent, b: c.querySelector('.trocar-h').textContent }; });
  check(c11 && c11.selo === 'Veio da Etapa 2' && c11.txt === `O que os clientes buscam: ${P22}` && c11.b === 'Trocar' && await naTela('12'), `C: cartão "Veio da Etapa 2 · Trocar" da P11 na tela seguinte (${JSON.stringify(c11)})`);
  await page.evaluate(() => document.querySelector('.herdado-mini[data-cod="M3.P11"]').scrollIntoView({ block: 'center' }));
  await shot('m03_depois_p11_etapa2');
  await alvos44('cartão da P11');
  await page.locator('.herdado-mini[data-cod="M3.P11"] .trocar-h').click(); await espera();
  check(await naTela('11') && await page.inputValue('#ent textarea') === P22 && await page.evaluate(() => document.querySelector('.selo-m').textContent) === 'Veio da Etapa 2. Confira e troque se quiser.', 'C: "Trocar" abre a P11 com o que veio da Etapa 2');
  await digitar('Dormir bem e com conforto'); await clicar('#ok', 'Continuar'); await espera();
  R17 = await RR();
  check(JSON.stringify(R17['M3.P11']) === '{"estado":"valor","valor":"Dormir bem e com conforto"}' && await naTela('12') && await page.locator('.herdado-mini[data-cod="M3.P11"]').count() === 0, 'C: a troca vira resposta própria (vale mais que a Etapa 2) e o cartão sai');
  check(await page.evaluate(() => localStorage.getItem('lg2-turma-b-m02')) === JSON.stringify(M2C), 'C: Etapa 2 nunca é alterada');
  /* sem a M2.P22: a P11 segue como antes (escondida, recebe a dor do perfil), sem cartão */
  await abrir('12', {}, { 'lg2-turma-b-m02': { v: 9, R: { 'M2.P07': { estado: 'opcao', opcao: 'Pessoas' }, 'M2.P13': { estado: 'opcao', opcao: 'Qualidade' } } } });
  R17 = await RR();
  check(R17['M3.P11'] && R17['M3.P11'].doPerfil && R17['M3.P11'].valor === DORES[3] && !R17['M3.P11'].herdado && await page.locator('.herdado-mini[data-cod="M3.P11"]').count() === 0, `C: sem a M2.P22, a P11 vem do perfil como antes, sem cartão da Etapa 2 (${JSON.stringify(R17['M3.P11'])})`);
  /* a M2.P22 sumiu depois: a P11 volta para a dor do perfil */
  await abrir('12', { 'M3.P11': { estado: 'valor', valor: P22, herdado: 'M2' } }, { 'lg2-turma-b-m02': { v: 9, R: { 'M2.P07': { estado: 'opcao', opcao: 'Pessoas' } } } });
  check(!(await RR())['M3.P11'], 'C: sem a M2.P22 e sem dor no perfil, a resposta herdada sai');
  /* P10 respondido na tela com dor marcada: não passa por cima da Etapa 2 */
  await abrir('10', {}, { 'lg2-turma-b-m02': { v: 9, R: { 'M2.P22': { estado: 'valor', valor: P22 } } } });
  await clicar('.opcao', PESSOAS); await espera(); await clicar('.item-marcar[data-c="O que precisa resolver (a dor)"] .chip', DORES[1]); await clicar('#ok', 'Continuar'); await espera();
  check(JSON.stringify((await RR())['M3.P11']) === JSON.stringify({ estado: 'valor', valor: P22, herdado: 'M2' }) && await page.locator('.herdado-mini[data-cod="M3.P11"]').count() === 1, 'C: perfil com dor não passa por cima da Etapa 2 (Etapa 2 > perfil)');
  /* resposta própria antiga da P11 vale mais que a Etapa 2 */
  await abrir('12', { 'M3.P11': { estado: 'valor', valor: 'Resposta minha' } }, { 'lg2-turma-b-m02': M2C });
  check(JSON.stringify((await RR())['M3.P11']) === '{"estado":"valor","valor":"Resposta minha"}' && await page.locator('.herdado-mini[data-cod="M3.P11"]').count() === 0, 'C: resposta própria da P11 vale mais que a Etapa 2');

  check(erros.length === 0, 'sem erros de JavaScript: ' + erros.join(' | '));
  await browser.close(); servidor.close();
  console.log(`\n${ok} verificações OK, ${falhas.length} falhas`);
  if (falhas.length) { console.log('FALHOU'); process.exit(1); }
  console.log('PASS');
})().catch((e) => { console.error(e); process.exit(1); });
