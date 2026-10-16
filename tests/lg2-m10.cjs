/* Módulo 10 (Turma B) contra o documento "Módulo 10 v2.docx" do grupo; execute: node tests/lg2-m10.cjs.
   ESPERADO foi copiado do documento (Telas 2, 3 e 4); o fluxo esperado abaixo é escrito à parte do app. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const dir = path.join(root, 'public/lg2/turma-b/m10');
const ESPERADO = {
 "nome": "Comunicação, vendas, pessoas e plano de ação",
 "objetivo": "Ao final do módulo, o usuário será capaz de organizar sua mensagem de vendas, mapear seus canais de atendimento, identificar gargalos de rotina, analisar a necessidade de sociedade ou contratação e definir as prioridades mais urgentes do negócio. Também poderá elaborar um plano de ação focado para resolver os principais problemas.",
 "para_quem": "Destinado para pessoas que desejam estruturar a operação e a comunicação de um pequeno negócio. Geralmente, esses usuários chegam ao módulo com dificuldades para explicar o que vendem, lidar com clientes nos diversos canais, organizar o tempo entre a operação e a gestão, e tomar decisões sobre sociedade e contratação. O módulo busca ajudá-los a analisar essas informações e priorizar ações imediatas.",
 "ter_em_maos": "O usuário precisa ter em mente ou anotado como realiza o seu atendimento hoje, os canais que utiliza, as dificuldades que enfrenta na rotina diária e as expectativas sobre parcerias ou contratações.",
 "entrega": "Ao final, o módulo entrega um diagnóstico sobre a comunicação, rotina e necessidades de equipe, além de um resumo com os 3 problemas mais urgentes e próximos passos para compor um plano de ação direcionado.",
 "perguntas": [
  [
   "M10.P01",
   null,
   "Em quanto tempo você costuma responder a um cliente?"
  ],
  [
   "M10.P02",
   null,
   "Quando alguém demonstra interesse, você segue uma sequência até fechar a venda?"
  ],
  [
   "M10.P03",
   null,
   "Depois da entrega, você volta a falar com o cliente?"
  ],
  [
   "M10.P04",
   null,
   "Quais tarefas você tem dificuldade para fazer ou não tem tempo de fazer?"
  ],
  [
   "M10.P05",
   null,
   "Você tem ou pretende ter sócio?"
  ],
  [
   "M10.P06",
   "M10.P05 = Sim",
   "Vocês já combinaram por escrito quem faz o quê, quanto cada um coloca e como dividem o resultado?"
  ],
  [
   "M10.P07",
   null,
   "Para cada tarefa principal do negócio, há uma pessoa responsável, mesmo que seja você?"
  ],
  [
   "M10.P08",
   null,
   "Você está pensando em contratar alguém?"
  ],
  [
   "M10.P09",
   "M10.P08 = Sim",
   "Você já considerou outras formas de resolver essa necessidade?"
  ],
  [
   "M10.P10",
   null,
   "Quais são os 3 problemas ou tarefas mais urgentes do seu negócio hoje?"
  ],
  [
   "M10.P11",
   null,
   "Se você esperar 3 meses sem agir, o que tende a acontecer com cada um deles?"
  ],
  [
   "M10.P12",
   null,
   "Para cada prioridade, que sinal observável mostraria que a ação funcionou?"
  ]
 ],
 "regras": [
  [
   "M10.R01",
   "M10.P01 = Até 1 hora",
   "Resposta rápida aumenta significativamente as chances de conversão e demonstra profissionalismo inicial.",
   "Manter a rapidez à medida que o volume cresce exigirá automatização ou equipe."
  ],
  [
   "M10.R02",
   "M10.P01 = Entre 1 e 4 horas",
   "Responder em poucas horas mantém o cliente interessado, mas exige atenção para não perder o impulso de compra.",
   "Se o cliente tiver urgência, ele pode procurar a concorrência nesse intervalo."
  ],
  [
   "M10.R03",
   "M10.P01 = Até 24 horas",
   "Um prazo de um dia pode ser aceitável para serviços complexos, mas é arriscado para compras por impulso.",
   "Ao responder no dia seguinte, o cliente já pode ter resolvido a necessidade de outra forma."
  ],
  [
   "M10.R04",
   "M10.P01 = Mais de 24 horas",
   "Uma resposta lenta é um dos principais motivos de desistência de compra, encaminhando o cliente para a concorrência.",
   "A demora no primeiro contato reduz drasticamente a chance de fechamento."
  ],
  [
   "M10.R05",
   "M10.P01 = Não sei",
   "Medir o tempo médio de resposta é o primeiro passo para melhorar o padrão de atendimento.",
   "A ausência de resposta padronizada costuma gerar frustração no cliente."
  ],
  [
   "M10.R06",
   "M10.P02 = Sim",
   "Seguir uma sequência testada ajuda a entender em qual etapa exata as vendas costumam travar.",
   "Vendas fechadas muito rapidamente sem qualificação podem gerar clientes insatisfeitos depois."
  ],
  [
   "M10.R07",
   "M10.P02 = Não",
   "Vender sem uma sequência padronizada depende muito da sorte e do talento individual de quem atende no momento.",
   "A falta de um processo repetível impede escalar as vendas do negócio."
  ],
  [
   "M10.R08",
   "M10.P02 = Não sei",
   "Não ter clareza sobre o processo prático de venda dificulta o treino de novas pessoas no futuro.",
   "Sem etapas claras, é impossível medir o desempenho de vendas."
  ],
  [
   "M10.R09",
   "M10.P03 = Sim",
   "O pós-venda ativo é uma das formas mais baratas de gerar recompra e indicações espontâneas.",
   "Ignorar reclamações no pós-venda anula o benefício desse contato."
  ],
  [
   "M10.R10",
   "M10.P03 = Não",
   "Deixar de falar com o cliente após a entrega é perder a chance de fidelizar e de corrigir falhas que você ainda não viu.",
   "Vender apenas uma vez para cada cliente encarece o custo de aquisição (marketing)."
  ],
  [
   "M10.R11",
   "M10.P03 = Não sei",
   "Sem contato pós-venda, não é possível saber de fato se o produto ou serviço resolveu o problema do cliente.",
   ""
  ],
  [
   "M10.R12",
   "M10.P04 = Preenchido",
   "Identificar os gargalos de rotina ajuda a priorizar o que precisa ser simplificado ou delegado.",
   "Tentar abraçar todas as tarefas sem auxílio reduz a qualidade das entregas essenciais."
  ],
  [
   "M10.R13",
   "M10.P04 = Não sei",
   "Não mapear as dificuldades de tempo impede reconhecer onde o negócio está perdendo eficiência.",
   "A sobrecarga crônica costuma ser percebida apenas quando prazos e vendas já foram prejudicados."
  ],
  [
   "M10.R14",
   "M10.P05 = Sim",
   "Ter sócio permite somar competências complementares e dividir responsabilidades de gestão.",
   "Expectativas não alinhadas entre sócios são uma das maiores causas de encerramento precoce."
  ],
  [
   "M10.R15",
   "M10.P05 = Não",
   "Empreender sozinho dá agilidade na decisão, mas exige disciplina rigorosa para equilibrar operação e gestão.",
   "Centralizar tudo aumenta o risco de estafa e cria dependência total da presença física do titular."
  ],
  [
   "M10.R16",
   "M10.P05 = Não sei",
   "Avaliar a necessidade de sociedade depende de identificar se faltam recursos financeiros ou habilidades técnicas.",
   "Convidar um sócio apenas por insegurança inicial pode gerar vínculos contratuais difíceis de desfazer."
  ],
  [
   "M10.R17",
   "M10.P06 = Sim",
   "Formalizar os papéis, aportes e regras de retirada previne atritos operacionais e societários.",
   "Acordos informais perdem força com o tempo se não forem registrados documentalmente."
  ],
  [
   "M10.R18",
   "M10.P06 = Não",
   "A ausência de regras claras por escrito gera dúvidas frequentes sobre esforço individual e remuneração.",
   "Divergências sobre dedicação e dinheiro costumam paralisar as operações da empresa."
  ],
  [
   "M10.R19",
   "M10.P06 = Não sei",
   "A falta de alinhamento explícito indica indefinição sobre o papel de cada integrante no negócio.",
   "Não saber como as decisões serão tomadas deixa a sociedade vulnerável a conflitos internos."
  ],
  [
   "M10.R20",
   "M10.P07 = Sim",
   "Atribuir um responsável único para cada atividade garante cobrança de prazos e consistência.",
   "Mesmo que uma única pessoa execute várias funções, é recomendado que o papel operacional esteja delimitado."
  ],
  [
   "M10.R21",
   "M10.P07 = Não",
   "Tarefas sem dono definido tendem a ser esquecidas ou executadas com atraso e erros.",
   "A falta de responsabilidade clara gera retrabalho e descompasso na rotina de entrega."
  ],
  [
   "M10.R22",
   "M10.P07 = Não sei",
   "Indefinição sobre papéis operacionais impede a padronização e o treinamento futuro de terceiros.",
   "Sem clareza de quem responde por cada processo, problemas operacionais ficam sem solução definitiva."
  ],
  [
   "M10.R23",
   "M10.P08 = Sim",
   "Contratar amplia a capacidade de entrega, mas cria uma obrigação financeira fixa e contínua.",
   "Lembre-se de calcular os encargos trabalhistas, que podem elevar o custo consideravelmente além do salário nominal."
  ],
  [
   "M10.R24",
   "M10.P08 = Não",
   "Manter a operação enxuta preserva a margem e mantém custos fixos sob controle no início.",
   "Se a demanda crescer além do limite pessoal de atendimento, a qualidade do produto pode cair."
  ],
  [
   "M10.R25",
   "M10.P08 = Não sei",
   "A dúvida sobre contratar indica necessidade de medir primeiro o volume real de trabalho excedente.",
   "Contratações precipitadas antes da estabilização da receita geram custos rescisórios prematuros."
  ],
  [
   "M10.R26",
   "M10.P09 = Sim",
   "Avaliar alternativas como automação, parcerias ou terceirização flexibiliza o custo da operação.",
   "Contratos terceirizados exigem alinhamento claro de nível de serviço para não comprometer a qualidade."
  ],
  [
   "M10.R27",
   "M10.P09 = Não",
   "Contratar diretamente sem explorar soluções alternativas pode gerar custo fixo desnecessário.",
   "Ferramentas digitais gratuitas ou serviços pontuais poderiam suprir a demanda com menor compromisso financeiro."
  ],
  [
   "M10.R28",
   "M10.P09 = Não sei",
   "Conhecer opções de apoio disponíveis no mercado evita assumir compromissos empregatícios precoces.",
   "Deixar de pesquisar alternativas de suporte encarece a gestão da rotina inicial."
  ],
  [
   "M10.R29",
   "M10.P10 = Preenchido",
   "Listar os 3 problemas mais urgentes evita a perda de foco e ajuda a concentrar esforços no que é vital.",
   "Tratar tudo como urgente gera ansiedade e impede a conclusão aprofundada de qualquer tarefa."
  ],
  [
   "M10.R30",
   "M10.P10 = Não sei",
   "A ausência de prioridades claras faz o empreendedor reagir apenas a imprevistos cotidianos.",
   "Sem foco definido, o tempo é consumido por rotinas secundárias enquanto gargalos graves persistem."
  ],
  [
   "M10.R31",
   "M10.P11 = Piora grave / Risco",
   "Reconhecer o custo da inação ajuda a classificar a real gravidade do problema para a sobrevivência do negócio.",
   "Postergar soluções críticas transforma dificuldades pontuais em crises financeiras ou operacionais."
  ],
  [
   "M10.R32",
   "M10.P11 = Pouco impacto",
   "Problemas que não se agravam com o tempo não devem consumir o tempo escasso da liderança.",
   "Gastar energia resolvendo detalhes de baixo impacto desvia o foco de vendas e entregas essenciais."
  ],
  [
   "M10.R33",
   "M10.P11 = Não sei",
   "Não antecipar os desdobramentos de um problema impede agir de forma preventiva.",
   "Ignorar a evolução de um gargalo transfere a decisão para um momento de emergência."
  ],
  [
   "M10.R34",
   "M10.P12 = Preenchido",
   "Definir um indicador observável permite saber com precisão se o esforço gerou a melhoria esperada.",
   "Metas subjetivas dificultam avaliar se a rotina melhorou ou se os recursos foram mal aproveitados."
  ],
  [
   "M10.R35",
   "M10.P12 = Não sei",
   "Agir sem um critério de sucesso mensurável impede saber quando a tarefa foi concluída satisfatoriamente.",
   "A ausência de métricas claras perpetua ações corretivas ineficazes por longos períodos."
  ]
 ],
 "base": [
  [
   "M10-C01",
   "Mensagem",
   "Frase curta que diz para quem é o negócio, o que ele oferece, qual benefício entrega e o que o diferencia.",
   "Se o cliente não entende o que você faz em poucos segundos, tende a não perguntar nem comprar. Também orienta o que você escreve e posta."
  ],
  [
   "M10-C02",
   "Canais físicos",
   "Lugares onde o cliente encontra o negócio ou conversa com ele: WhatsApp, Instagram, loja, indicação, site, entre outros.",
   "Estar em todos os canais cansa e dispersa. Escolher poucos que você consegue manter ativos costuma ser mais viável, sempre com o mesmo preço, prazo e jeito de falar."
  ],
  [
   "M10-C03",
   "Atendimento",
   "Como você recebe, responde e resolve as demandas do cliente antes, durante e depois da compra.",
   "É onde muitos pequenos negócios ganham ou perdem clientes: resposta lenta ou confusa afasta, resposta clara aproxima."
  ],
  [
   "M10-C04",
   "Vendas",
   "Sequência de passos para vender: abordar, entender a necessidade, fazer a proposta, negociar, fechar e acompanhar.",
   "Vender sem sequência depende de sorte. Registrar as etapas mostra onde as vendas travam e o que testar primeiro."
  ],
  [
   "M10-C05",
   "Pós-venda",
   "Contato depois da entrega: confirmar se deu certo, ouvir reclamações, pedir feedbacks e convidar para voltar.",
   "Cliente que volta e indica costuma custar menos do que conquistar um novo. Também revela falhas que você ainda não via."
  ],
  [
   "M10-C06",
   "Competências",
   "Conhecimentos, habilidades e atitudes necessários para executar as tarefas do negócio.",
   "Antes de chamar um sócio ou contratar, é preciso saber o que você já sabe fazer e o que falta. Uma lacuna pode ser resolvida aprendendo, terceirizando ou fazendo parceria."
  ],
  [
   "M10-C07",
   "Sócios",
   "Pessoas que dividem com você o negócio, em dinheiro, trabalho, resultado e responsabilidades.",
   "Sociedade sem regras claras é fonte comum de conflito. Combinar antes quem entra com o quê e como se divide o resultado ajuda a evitar problemas. Os detalhes jurídicos devem ser confirmados com profissional habilitado."
  ],
  [
   "M10-C08",
   "Responsabilidades",
   "Definição por escrito de quem faz o quê, até quando e quem decide cada assunto.",
   "Evita tarefas sem dono ou feitas em duplicidade. Vale também para quem trabalha sozinho, para decidir onde colocar o próprio tempo."
  ],
  [
   "M10-C09",
   "Contratação",
   "Decidir se vale colocar alguém para trabalhar no negócio, analisando demanda, carga de trabalho, capacidade de pagar e alternativas.",
   "Contratar cria um compromisso contínuo, além do salário. Analisar antes reduz o risco de assumir um custo que o negócio não sustenta. Regras trabalhistas devem ser confirmadas em fonte oficial."
  ],
  [
   "M10-C10",
   "Prioridades",
   "O que merece atenção primeiro, considerando impacto, prazo e risco de piorar.",
   "Com pouco tempo e dinheiro, tentar fazer tudo ao mesmo tempo costuma terminar em nada concluído. Priorizar permite montar um plano de 90 dias com poucas ações."
  ]
 ]
};
const ctx = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(dir, 'dados/modulo10.js'), 'utf8'), ctx);
const D = JSON.parse(JSON.stringify(ctx.window.MODULO10));
for (const k of ['nome', 'objetivo', 'para_quem', 'ter_em_maos', 'entrega']) assert.equal(D[k], ESPERADO[k], k);
assert.deepEqual(D.perguntas.map((q) => [q.codigo, q.condicao, q.pergunta]), ESPERADO.perguntas);
assert.deepEqual(D.regras.map((g) => [g.codigo, g.condicao, g.texto, g.alerta]), ESPERADO.regras);
assert.deepEqual(D.base.map((b) => [b.codigo, b.conceito, b.definicao, b.porque]), ESPERADO.base);
assert.equal(/rafael/i.test(fs.readFileSync(path.join(dir, 'dados/modulo10.js'), 'utf8')), false);
console.log(`PASS dados: ${D.perguntas.length} perguntas, ${D.regras.length} regras e ${D.base.length} conceitos literais do documento.`);

/* respostas possíveis por pergunta (escrito à parte): P01 tem a lista do documento; P04/P10/P12 são texto + Não sei */
const SNN = ['Sim', 'Não', 'Não sei'];
const OPC = { 'M10.P01': ['Até 1 hora', 'Entre 1 e 4 horas', 'Até 24 horas', 'Mais de 24 horas', 'Não sei'], 'M10.P02': SNN, 'M10.P03': SNN,
  'M10.P05': SNN, 'M10.P06': SNN, 'M10.P07': SNN, 'M10.P08': SNN, 'M10.P09': SNN, 'M10.P11': ['Piora grave / Risco', 'Pouco impacto', 'Não sei'] };
const TEXTO = ['M10.P04', 'M10.P10', 'M10.P12'];
const ORDEM = ESPERADO.perguntas.map((q) => q[0]);
const valor = (cod, r) => r === 'Não sei' ? 'Não sei' : TEXTO.includes(cod) ? 'Preenchido' : r;
const esperadas = (cod, r) => ESPERADO.regras.filter((g) => g[1] === `${cod} = ${valor(cod, r)}`).map((g) => g[2]);
/* respostas anteriores que deixam a pergunta visível */
function antes(cod) {
  const R = {};
  for (const c of ORDEM) {
    if (c === cod) break;
    R[c] = c === 'M10.P05' || c === 'M10.P08' ? { estado: 'opcao', opcao: 'Sim' }
      : TEXTO.includes(c) ? { estado: 'valor', itens: c === 'M10.P10' ? ['Atrasos', 'Estoque', ''] : ['ok'] } : { estado: 'opcao', opcao: 'Sim' };
  }
  return R;
}

const http = require('node:http');
let playwright;
try { playwright = require('playwright'); } catch { playwright = require(process.env.PW); }
const norm = (s) => s.replace(/\s+/g, ' ').trim();
(async () => {
  const publicRoot = path.join(root, 'public');
  const server = http.createServer((req, res) => {
    const name = path.resolve(publicRoot, '.' + decodeURIComponent(req.url.split('?')[0]));
    if (!name.startsWith(publicRoot + path.sep)) { res.writeHead(403).end(); return; }
    fs.readFile(name, (error, bytes) => {
      if (error) { res.writeHead(404).end(); return; }
      const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf' };
      res.writeHead(200, { 'Content-Type': types[path.extname(name)] || 'application/octet-stream' }).end(bytes);
    });
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${server.address().port}/lg2/turma-b/m10/index.html`;
  const KEY = 'lg2-turma-b-m10';
  let browser;
  try {
    browser = await playwright.chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('response', (r) => { if (r.status() >= 400) errors.push(r.url()); });
    page.on('dialog', (d) => d.accept());
    const clicar = (t) => page.evaluate((t) => { const b = [...document.querySelectorAll('button')].find((x) => x.textContent.trim() === t); if (!b) throw new Error('sem botão ' + t); b.click(); }, t);
    const regrasNaTela = () => page.$$eval('#retorno .regra .r-texto', (xs) => xs.map((x) => x.textContent));
    await page.goto(url);
    await page.evaluate((k) => localStorage.setItem(k, JSON.stringify({ respostas: { 'M10.P01': 'texto antigo' }, indice: 3, iniciado: true })), KEY);
    await page.reload();
    assert.ok(await page.getByRole('button', { name: 'Começar', exact: true }).isVisible(), 'estado da versão anterior deve ser descartado');

    /* cada resposta de cada pergunta mostra exatamente as regras da Tela 4 */
    const alcancadas = new Set();
    for (const cod of ORDEM) {
      const respostas = OPC[cod] || ['texto', 'Não sei'];
      for (const r of respostas) {
        await page.evaluate(([k, R]) => localStorage.setItem(k, JSON.stringify({ v: 2, R, hist: [] })), [KEY, antes(cod)]);
        await page.reload();
        await clicar(Object.keys(antes(cod)).length ? 'Continuar de onde parei' : 'Começar');
        assert.equal(await page.locator('#pergunta').textContent(), ESPERADO.perguntas.find((q) => q[0] === cod)[2], cod);
        if (OPC[cod]) {
          assert.deepEqual(await page.$$eval('#ent .opcao', (xs) => xs.map((x) => x.textContent)), OPC[cod], cod + ' opções');
          await clicar(r);
        } else if (r === 'Não sei') { await clicar('Não sei'); }
        else { await page.locator('#ent .campo').first().fill('Uma resposta'); }
        if (r !== 'Não sei' || OPC[cod]) await clicar('Continuar');
        const vistas = await regrasNaTela();
        assert.deepEqual(vistas, esperadas(cod, r), `${cod} = ${r}`);
        vistas.forEach((t) => alcancadas.add(t));
      }
    }
    assert.equal(alcancadas.size, ESPERADO.regras.length);
    console.log(`PASS regras: ${alcancadas.size} de ${ESPERADO.regras.length} alcançadas, cada uma com o conjunto exato.`);

    /* resposta vazia não avança */
    await page.evaluate((k) => localStorage.removeItem(k), KEY); await page.reload();
    await clicar('Começar'); await clicar('Continuar');
    assert.ok(await page.locator('#erro').isVisible());
    assert.equal(await page.locator('#retorno .regra').count(), 0);

    /* percurso completo pela tela: P05 = Não esconde P06; P08 = Sim mostra P09 */
    const xss = '<img src=x onerror="window.injetado=true"> & "teste"';
    const vistasPerg = [];
    const plano = { 'M10.P01': 'Até 24 horas', 'M10.P02': 'Não', 'M10.P03': 'Não sei', 'M10.P04': xss, 'M10.P05': 'Não', 'M10.P07': 'Sim',
      'M10.P08': 'Sim', 'M10.P09': 'Não', 'M10.P10': ['Atender mais rápido', 'Organizar estoque', 'Contratar ajudante'], 'M10.P11': 'Piora grave / Risco',
      'M10.P12': ['Responder em 1 hora', 'Zero falta', 'Ajudante em 30 dias'] };
    for (;;) {
      const t = await page.locator('#pergunta').textContent();
      const cod = ESPERADO.perguntas.find((q) => q[2] === t)[0];
      vistasPerg.push(cod);
      const r = plano[cod];
      if (Array.isArray(r)) {
        const campos = page.locator('#ent .campo');
        assert.equal(await campos.count(), 3, cod);
        if (cod === 'M10.P12') assert.deepEqual(await page.$$eval('#ent label', (xs) => xs.map((x) => x.textContent)), plano['M10.P10']);
        for (let i = 0; i < 3; i++) await campos.nth(i).fill(r[i]);
      } else if (OPC[cod]) await clicar(r); else await page.locator('#ent .campo').first().fill(r);
      await clicar('Continuar');
      if (cod === 'M10.P02') { await page.reload(); await clicar('Continuar de onde parei'); assert.equal(await page.locator('#pergunta').textContent(), ESPERADO.perguntas[2][2], 'retoma na P03'); continue; }
      const fim = await page.getByRole('button', { name: 'Ver o resultado', exact: true }).count();
      if (fim) { await clicar('Ver o resultado'); break; }
      await clicar('Seguir');
    }
    assert.deepEqual(vistasPerg, ['M10.P01', 'M10.P02', 'M10.P03', 'M10.P04', 'M10.P05', 'M10.P07', 'M10.P08', 'M10.P09', 'M10.P10', 'M10.P11', 'M10.P12'].flatMap((c) => c === 'M10.P03' ? [c] : [c]));
    assert.equal(await page.locator('.passo').textContent(), 'Resultado');
    const corpo = norm(await page.locator('main').innerText());
    for (const s of [...plano['M10.P10'], ...plano['M10.P12'], 'Piora grave / Risco', xss, ...esperadas('M10.P05', 'Não'), ...esperadas('M10.P09', 'Não')]) assert.ok(corpo.includes(norm(s)), 'resultado sem: ' + s);
    for (const s of esperadas('M10.P06', 'Sim')) assert.ok(!corpo.includes(s), 'P06 não deveria aparecer');
    assert.equal(await page.evaluate(() => window.injetado), undefined);
    assert.equal(await page.locator('.lg2-proximo a').getAttribute('href'), '/protected/modulos/laboratorio-de-gestao?aba=b');
    if (process.env.LG2_M10_SCREENSHOT) await page.screenshot({ path: process.env.LG2_M10_SCREENSHOT, fullPage: true });

    /* editar P05 para Sim abre a P06; voltar para Não apaga a resposta da P06 */
    await page.locator('[data-c="M10.P05"]').click();
    await clicar('Sim'); await clicar('Continuar'); await clicar('Seguir');
    assert.equal(await page.locator('#pergunta').textContent(), ESPERADO.perguntas[5][2]);
    await clicar('Não'); await clicar('Continuar');
    await page.locator('#v').click();
    assert.equal(await page.locator('#pergunta').textContent(), ESPERADO.perguntas[4][2], 'voltar leva à P05');
    await clicar('Não'); await clicar('Continuar');
    const salvo = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)), KEY);
    assert.equal(salvo.R['M10.P06'], undefined);
    assert.equal(salvo.R['M10.P05'].opcao, 'Não');

    /* recomeçar */
    await clicar('Recomeçar do zero');
    assert.ok(await page.getByRole('button', { name: 'Começar', exact: true }).isVisible());
    assert.equal(await page.evaluate((k) => localStorage.getItem(k), KEY), null);
    assert.deepEqual(errors, []);
    console.log('PASS tela: condições P06/P09, retomada após recarregar, resultado com os 3 problemas, XSS escapado, recomeçar.');
  } finally {
    if (browser) await browser.close();
    server.close();
  }
})().catch((e) => { console.error(e); process.exit(1); });
