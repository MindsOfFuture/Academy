/* LG2 · Módulo 5 (Turma A) · teste headless das correções do grupo ("Correções Módulo 5").
   Execute: PW=<caminho do playwright> node tests/lg2-m05-turma-a.cjs
   Opcional: LG2_SHOTS=<pasta> (prints 390x844).
   Cobre: "Não sei" dos gastos fixos (P24–P35) vira botão de ajuda com o conceito da Base técnica,
   não deixa avançar sem resposta, preço (P36) depois da quantidade (P37), passo de análise do preço
   (preço possível pelo % de lucro e % de lucro reverso, faixas baixa/alta/negativa), observações,
   resultado sem NaN nos três tipos de negócio, largura do campo de nome na P33, versão do estado salvo
   e persistência após recarregar. Imprime PASS/FAIL e sai com código != 0 se falhar. */
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const http = require('node:http');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..', 'public');
const dir = path.join(root, 'lg2/turma-a/m05');
const ctx = { window: {} };
const dadosSrc = fs.readFileSync(path.join(dir, 'dados/modulo5.js'), 'utf8');
vm.runInNewContext(dadosSrc, ctx);
const D = ctx.window.MODULO5;
const Motor = require(path.join(dir, 'js/motor.js'));
const M = Motor.montar(JSON.parse(JSON.stringify(D)));
const SHOTS = process.env.LG2_SHOTS || '';
const KEY = 'lg2-turma-a-m05';
const falhas = [];
let passes = 0;
const ok = (cond, msg) => { if (!cond) { falhas.push(msg); console.log('FAIL: ' + msg); } else passes++; };
const norm = (s) => String(s || '').replace(/\s+/g, ' ').trim();
const brl = (n) => 'R$ ' + n.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const pct1 = (n) => n.toFixed(1).replace('.', ',') + '%';

let playwright;
try { playwright = require(process.env.PW); } catch { playwright = require('playwright'); }

/* ---------- estático ---------- */
const app = fs.readFileSync(path.join(dir, 'js/app.js'), 'utf8');
const motorSrc = fs.readFileSync(path.join(dir, 'js/motor.js'), 'utf8');
ok(/const CHAVE = "lg2-turma-a-m05";/.test(app), 'CHAVE deve continuar lg2-turma-a-m05');
ok(/const LUCRO_BAIXO = 20;/.test(motorSrc) && /const LUCRO_ALTO = 100;/.test(motorSrc), 'constantes LUCRO_BAIXO=20 e LUCRO_ALTO=100 no motor');
ok(!/rafael/i.test(dadosSrc), 'nenhum "rafael" em dados/modulo5.js');
ok(!/\b\d{4,5}-?\d{4}\b/.test(JSON.stringify(D)), 'nenhum telefone em dados/modulo5.js');
const perguntas = D.perguntas.filter((p) => p.codigo);
ok(perguntas.every((p) => 'video' in p && p.video === ''), 'campo video (vazio) em todas as perguntas');
const FIXOS = ['M5.P24', 'M5.P25', 'M5.P26', 'M5.P27', 'M5.P28', 'M5.P29', 'M5.P30', 'M5.P31', 'M5.P32', 'M5.P33', 'M5.P34', 'M5.P35'];
for (const c of FIXOS) {
  ok(!M.porCodigo[c].opcoesLista.some((o) => /n[ãa]o sei/i.test(o)), `${c}: "Não sei" fora das opções`);
  ok(Motor.botoesAlternativos(M, M.porCodigo[c]).length === 0, `${c}: sem botão de resposta alternativa`);
}
/* conta do motor contra a conta à mão (unidade) */
ok(Motor.classificar(19.9) === 'baixo' && Motor.classificar(20) === null && Motor.classificar(100) === null && Motor.classificar(100.1) === 'alto', 'faixas 20/100 no classificar');

/* ---------- servidor ---------- */
const server = http.createServer(async (req, res) => {
  try {
    const file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
    if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
    const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf' };
    res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
    res.end(await fsp.readFile(file));
  } catch { res.writeHead(404).end(); }
});

(async () => {
  let browser;
  try {
    await new Promise((r) => server.listen(0, '127.0.0.1', r));
    const URL0 = `http://127.0.0.1:${server.address().port}/lg2/turma-a/m05/index.html`;
    browser = await playwright.chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
    page.setDefaultTimeout(5000);
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('dialog', (d) => d.accept());
    if (SHOTS) await fsp.mkdir(SHOTS, { recursive: true });
    const shot = async (n) => { if (!SHOTS) return; await page.waitForTimeout(400); await page.screenshot({ path: path.join(SHOTS, n) }); };

    const state = () => page.evaluate((k) => JSON.parse(localStorage.getItem(k)), KEY);
    const atual = async () => ((await state()) || { hist: [] }).hist.at(-1);
    const clicar = (sel, txt) => page.evaluate(([sel, txt]) => {
      const n = (s) => String(s || '').replace(/\s+/g, ' ').trim();
      const el = [...document.querySelectorAll(sel)].find((e) => n(e.textContent) === txt && !e.hidden && e.offsetParent !== null);
      if (el) el.click();
      return !!el;
    }, [sel, txt]);
    const texto = async (sel) => norm(await page.evaluate((s) => [...document.querySelectorAll(s)].map((e) => e.textContent).join(' '), sel));
    const erroVisivel = () => page.evaluate(() => { const e = document.getElementById('erro'); return !!e && !e.hidden; });
    const seguir = async () => {
      ok(await clicar('#acoes button', 'Seguir') || await clicar('#acoes button', 'Ver o resultado'), `botão Seguir após ${await atual()}`);
    };
    const continuar = async () => { ok(await clicar('#ok', 'Continuar'), `Continuar em ${await atual()}`); };
    const escolher = async (rot) => {
      const c = await atual();
      ok(await clicar('#ent .opcao', rot) || await clicar('#ent .opcao b', rot), `${c}: opção ${rot}`);
      await continuar();
      ok(!(await erroVisivel()), `${c}: resposta ${rot} aceita`);
      await seguir();
    };
    const alt = async (rot) => {
      const c = await atual();
      ok(await clicar('.btn-alt', rot), `${c}: botão ${rot}`);
      await seguir();
    };
    const preencher = async (vals, sels = [], seg = true) => {
      const c = await atual();
      const ins = await page.locator('#ent input').all();
      for (let i = 0; i < vals.length; i++) await ins[i].fill(String(vals[i]));
      const ss = await page.locator('#ent select').all();
      for (let i = 0; i < sels.length; i++) await ss[i].selectOption({ label: sels[i] });
      await continuar();
      const e = await erroVisivel();
      ok(!e, `${c}: valores ${vals.join('|')} aceitos` + (e ? ' — erro: ' + await texto('#erro') : ''));
      if (seg) await seguir();
    };
    const semNaN = async (onde) => {
      const t = await texto('#tela');
      ok(!/NaN|undefined|Infinity|null/.test(t), `${onde}: sem NaN/undefined/null na tela`);
    };
    /* pergunta de gasto fixo: sem "Não sei" como resposta, botão de ajuda abre o conceito */
    const checarFixo = async (testarBloqueio) => {
      const c = await atual();
      const q = M.porCodigo[c];
      ok(FIXOS.includes(c), `${c} deveria ser gasto fixo`);
      const opNaoSei = await page.evaluate(() => [...document.querySelectorAll('#ent .opcao, .btn-alt')].filter((b) => /n[ãa]o sei/i.test(b.textContent)).length);
      ok(opNaoSei === 0, `${c}: "Não sei" não aparece como opção de resposta`);
      ok(await page.locator('#naosei').count() === 1, `${c}: botão de ajuda "Não sei"`);
      ok(await page.locator('#painel').isHidden(), `${c}: painel fechado no início`);
      await page.click('#naosei');
      ok(await page.locator('#painel').isVisible(), `${c}: painel abre`);
      const painel = await texto('#painel');
      const bts = (q.fonte.match(/M5\.BT\d{2}/g) || []).map((b) => M.conceito[b]);
      for (const b of bts) {
        ok(painel.includes(norm(b.definicao)) && painel.includes(norm(b.porque)), `${c}: painel traz definição e porquê de ${b.codigo}`);
      }
      const rNS = (M.regrasDe[c] || []).filter((r) => /n[ãa]o sab|n[ãa]o sei/i.test(Motor.valorCond(r)));
      for (const r of rNS) ok(painel.includes(norm(r.texto)), `${c}: painel traz "como descobrir" (${r.codigo})`);
      ok(!/em breve/i.test(painel) && await page.locator('#painel iframe, #painel video').count() === 0, `${c}: sem vídeo/placeholder quando video vazio`);
      if (testarBloqueio) {
        await continuar();
        ok(await erroVisivel(), `${c}: Continuar sem resposta mostra erro`);
        ok((await texto('#erro')) === Motor.MSG_RESPONDA, `${c}: erro pede a resposta e indica o "Não sei" (${await texto('#erro')})`);
        ok(await atual() === c, `${c}: não avança sem resposta`);
        ok(!(await clicar('#acoes button', 'Seguir')), `${c}: sem botão Seguir sem resposta`);
      }
      return painel;
    };
    const fonte16 = async (sel) => {
      const fs_ = await page.evaluate((s) => [...document.querySelectorAll(s)].filter((e) => e.offsetParent !== null).map((e) => parseFloat(getComputedStyle(e).fontSize)), sel);
      ok(fs_.length > 0 && fs_.every((f) => f >= 16), `fonte >= 16px em ${sel} (${fs_.join(',')})`);
    };
    const inicio = async () => {
      await page.goto(URL0);
      await page.evaluate(() => localStorage.clear());
      await page.reload();
      ok(await clicar('#ir', 'Começar'), 'Começar');
    };

    /* ===== 0. versão do estado: resposta salva no formato antigo é descartada ===== */
    await page.goto(URL0);
    await page.evaluate((k) => localStorage.setItem(k, JSON.stringify({ R: { 'M5.P24': { estado: 'naosei' } }, hist: ['M5.P01', 'M5.P24'] })), KEY);
    await page.reload();
    ok(await page.locator('#ir').textContent() === 'Começar' && await page.locator('#zerar').count() === 0, 'estado antigo (sem versão) descartado');
    console.log('PASS-stage: versão do estado');

    /* ===== 1. Produto: todos os gastos fixos "Sim", preço ainda não definido (a) ===== */
    await inicio();
    await escolher('Produto');
    await preencher(['Bolo de pote']);                               // P02
    await preencher(['Farinha', 'Ovo']);                            // P03
    await preencher(['10', '12']);                                  // P04 preço pago
    await preencher(['1', '12'], ['kg', 'unidade']);                // P05 quanto vem
    await preencher(['500', '6'], ['g', 'unidade']);                // P06 quanto usa
    await preencher(['10']);                                        // P07 quantas unidades
    await escolher('Sim');                                          // P08 embalagem
    await preencher(['20', '10']);                                  // P09 pacote
    // custo à mão: farinha 10*(0,5kg/1kg)/10 = 0,50; ovo 12*(6/12)/10 = 0,60; embalagem 20/10 = 2,00 -> 3,10
    const custoProd = 0.5 + 0.6 + 2;
    ok(await atual() === 'M5.P24', 'Produto chega à P24');
    await checarFixo(true);
    await shot('02-naosei-painel-P24.png');
    await escolher('Sim');                                          // P24
    await checarFixo(true);                                         // P25 (valor): bloqueia vazio
    await preencher(['5']);
    await checarFixo(false); await escolher('Sim');                 // P26
    await checarFixo(true); await preencher(['100']);               // P27
    await checarFixo(false); await escolher('Sim');                 // P28
    await checarFixo(false);                                        // P29 aluguel
    ok((await texto('.obs')).includes('Se o seu negócio funciona dentro da sua casa, não coloque o valor total do aluguel. Coloque só a parte que o negócio usa.'), 'P29: observação do aluguel');
    await fonte16('.obs'); await fonte16('.btn-ajuda'); await fonte16('#painel p');
    await page.click('#naosei');                                    // fecha o painel para o print
    await shot('03-aluguel-observacao-P29.png');
    await preencher(['500']);
    await checarFixo(false); await escolher('Sim');                 // P30
    await checarFixo(false);                                        // P31
    ok((await texto('.obs')).includes('Se o negócio funciona na sua casa, coloque só a parte da conta que o negócio gasta, não a conta inteira.'), 'P31: observação de água e luz');
    await preencher(['150']);
    await checarFixo(false); await escolher('Sim');                 // P32
    await checarFixo(true);                                         // P33 lista vazia bloqueia
    await page.click('#naosei');
    await page.locator('.lista .nome').first().fill('Internet fibra do negócio');
    await page.locator('.lista .valor').first().fill('100');
    await clicar('.btn-mais', '+ adicionar conta');
    await page.locator('.lista .nome').nth(1).fill('Contador');
    await page.locator('.lista .valor').nth(1).fill('200');
    const larg = await page.evaluate(() => [...document.querySelectorAll('.lista .campo.nome')].map((e) => e.getBoundingClientRect().width));
    ok(larg.every((w) => w >= 120), `P33: campo do nome com largura >= 120px (${larg.map(Math.round).join(',')})`);
    ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'P33: sem rolagem horizontal');
    await shot('01-P33-gastos-com-nomes.png');
    await continuar(); ok(!(await erroVisivel()), 'P33 aceita'); await seguir();
    await checarFixo(false); await escolher('Sim');                 // P34
    await checarFixo(true); await preencher(['1000']);              // P35
    ok(await atual() === 'M5.P37', 'depois da P35 vem a P37 (quantidade), não o preço');
    ok(!(await state()).hist.includes('M5.P36'), 'P36 ainda não visitada antes da P37');
    await preencher(['100']);                                       // P37
    ok(await atual() === 'M5.P36', 'P36 (preço) vem depois da P37');
    ok((await texto('.obs')).includes('Se você está começando a vender, pode precisar de um lucro maior em cada venda para compensar a quantidade pequena de vendas no início.'), 'P36: observação do início de vendas');
    await alt('Ainda não defini');
    ok(await atual() === 'PRECO', 'P36 "Ainda não defini" abre o passo do lucro');
    ok((await texto('h2.q')) === 'Quanto de lucro você quer ganhar em cada venda? (%)', 'pergunta do % de lucro');
    ok((await texto('.obs')).includes('compensar a quantidade pequena de vendas'), 'passo do preço: observação');
    ok(await page.locator('#res').isHidden(), 'Ver o resultado só depois de informar o %');
    await clicar('#calc', 'Continuar');
    ok(await erroVisivel() && await atual() === 'PRECO', 'passo do lucro não avança vazio');
    const MSG = Motor.MSG_PRECO;
    const lucro = async (v) => { await page.fill('#lucro', String(v)); await clicar('#calc', 'Continuar'); return texto('#analise'); };
    let t = await lucro(50);
    ok(t.includes(brl(custoProd * 1.5)) && brl(custoProd * 1.5) === 'R$ 4,65', `50% -> preço possível R$ 4,65 (tela: ${t.slice(0, 80)})`);
    ok(!t.includes(MSG.sugerido.baixo) && !t.includes(MSG.sugerido.alto), '50%: sem aviso');
    t = await lucro(10);
    ok(t.includes(brl(custoProd * 1.1)) && t.includes(MSG.sugerido.baixo) && !t.includes(MSG.sugerido.alto), '10%: aviso de lucro baixo (a)');
    await fonte16('#analise .bloco p'); await fonte16('#analise .nota');
    await shot('04-preco-possivel-10pct-aviso.png');
    t = await lucro(150);
    ok(t.includes(brl(custoProd * 2.5)) && t.includes(MSG.sugerido.alto) && !t.includes(MSG.sugerido.baixo), '150%: aviso de lucro alto (a)');
    await semNaN('passo do preço (a)');
    await lucro(50);
    ok(await clicar('#res', 'Ver o resultado'), 'Ver o resultado');
    ok(await atual() === 'RESULTADO', 'Produto chega ao resultado');
    let tr = await texto('#tela');
    ok(tr.includes('R$ 3,10') && tr.includes('R$ 4,65'), 'resultado Produto: custo R$ 3,10 e preço possível R$ 4,65');
    // gastos do mês à mão: aluguel 500 + água/luz 150 + outros 300 = 950 fixos; perdas 100; trabalho 1000 -> 2050
    ok(tr.includes('R$ 950,00') && tr.includes('R$ 2.050,00'), 'resultado Produto: gastos do mês 950 / total 2.050');
    await semNaN('resultado Produto');
    await shot('06-resultado-produto.png');
    const salvo = await state();
    await page.reload();
    ok(await clicar('#ir', 'Continuar de onde parei'), 'Continuar de onde parei após recarregar');
    ok(await atual() === 'RESULTADO' && (await texto('#tela')).includes('R$ 4,65'), 'resultado persiste após recarregar');
    ok(JSON.stringify(await state()) === JSON.stringify(salvo) && salvo.versao === 2 && salvo.lucro === '50', 'estado salvo (versão 2, lucro 50) persiste');
    console.log('PASS-stage: Produto + preço possível');

    /* ===== 2. Mercadoria: gastos fixos "Não", preço informado (b) ===== */
    await inicio();
    await escolher('Mercadoria');
    await preencher(['Camiseta']);   // P10
    await preencher(['200']);        // P11 compra
    await preencher(['10']);         // P12 quantidade -> custo 20
    await escolher('Não');           // P13 frete
    await escolher('Não');           // P15 embalagem
    for (const c of ['M5.P24', 'M5.P26', 'M5.P28', 'M5.P30', 'M5.P32', 'M5.P34']) {
      ok(await atual() === c, `Mercadoria/Não: passa pela ${c}`);
      await checarFixo(c === 'M5.P24');
      await escolher('Não');
    }
    ok(await atual() === 'M5.P37', 'P34 Não -> P37');
    await preencher(['50']);
    ok(await atual() === 'M5.P36', 'P37 -> P36');
    const precoB = async (v) => {
      if (await atual() === 'PRECO') { await page.click('#v'); }
      ok(await atual() === 'M5.P36', 'volta para a P36');
      await preencher([v]);
      ok(await atual() === 'PRECO', 'P36 com preço -> análise');
      return texto('#analise');
    };
    const custoMerc = 20;
    const casos = [
      ['30', null], ['22', 'baixo'], ['45', 'alto'], ['15', 'neg'], ['23,33', 'baixo'], ['24', null], ['40', null], ['40,02', 'alto'],
    ];
    for (const [v, esp] of casos) {
      t = await precoB(v);
      const p = Number(v.replace(',', '.'));
      const pctMao = (p - custoMerc) / custoMerc * 100;
      ok(t.includes(pct1(pctMao)), `preço ${v}: lucro ${pct1(pctMao)} (tela: ${t.slice(0, 60)})`);
      const temB = t.includes(MSG.reverso.baixo), temA = t.includes(MSG.reverso.alto), temN = t.includes(MSG.negativo);
      if (esp === null) ok(!temB && !temA && !temN, `preço ${v}: sem aviso`);
      if (esp === 'baixo') ok(temB && !temA && !temN, `preço ${v}: aviso de lucro baixo (b)`);
      if (esp === 'alto') ok(temA && !temB && !temN, `preço ${v}: aviso de lucro alto (b)`);
      if (esp === 'neg') ok(temB && temN && !temA, `preço ${v}: lucro negativo = baixo + "abaixo do que gasta"`);
      if (v === '15') await shot('05b-lucro-negativo.png');
      if (v === '22') await shot('05-lucro-reverso-baixo.png');
    }
    ok(pct1((23.33 - 20) / 20 * 100) === '16,6%' || pct1((23.33 - 20) / 20 * 100) === '16,7%', 'arredondamento 1 casa');
    await precoB('30');
    await semNaN('passo do preço (b)');
    ok(await clicar('#res', 'Ver o resultado'), 'Ver o resultado (b)');
    tr = await texto('#tela');
    ok(tr.includes('50,0%') && tr.includes('R$ 20,00') && tr.includes('R$ 30,00'), 'resultado Mercadoria: lucro 50,0%, custo 20, preço 30');
    ok(tr.includes('R$ 1.500,00'), 'resultado Mercadoria: faturamento 50 x 30 = 1.500');
    await semNaN('resultado Mercadoria');
    console.log('PASS-stage: Mercadoria + lucro reverso');

    /* ===== 3. Serviço: com materiais, mistura Sim/Não, "Ainda não comecei" e "Não sei" no preço ===== */
    await inicio();
    await escolher('Serviço');
    await preencher(['Corte de cabelo']);   // P17
    await escolher('Sim');                  // P18
    await preencher(['Shampoo']);           // P19
    await preencher(['30']);                // P20
    await preencher(['1'], ['L']);          // P21
    await preencher(['50'], ['ml']);        // P22 -> 30 * 0,05 = 1,50
    await preencher(['1', '0']);            // P23
    await checarFixo(false); await escolher('Sim'); await preencher(['3']);   // P24/P25
    await escolher('Não');                  // P26
    await escolher('Sim'); await preencher(['300']);                          // P28/P29
    await escolher('Não');                  // P30
    await escolher('Não');                  // P32
    await escolher('Não');                  // P34
    await alt('Ainda não comecei a vender'); // P37
    ok(await atual() === 'M5.P36', 'Serviço: P37 -> P36');
    await alt('Não sei');                   // P36
    ok(await atual() === 'PRECO', 'Serviço: P36 Não sei -> passo do lucro');
    t = await lucro(30);
    ok(t.includes(brl(1.5 * 1.3)), 'Serviço: 30% -> preço possível R$ 1,95');
    ok(await clicar('#res', 'Ver o resultado'), 'Ver o resultado (Serviço)');
    tr = await texto('#tela');
    ok(tr.includes('R$ 1,50') && tr.includes('R$ 1,95'), 'resultado Serviço: custo 1,50 e preço possível 1,95');
    await semNaN('resultado Serviço');
    console.log('PASS-stage: Serviço + preço possível');

    /* ===== 4. Serviço sem materiais: custo por unidade não calculável -> mensagem clara, sem % ===== */
    await inicio();
    await escolher('Serviço');
    await preencher(['Aula particular']);
    await escolher('Não');                  // P18 -> P23
    await preencher(['1', '30']);
    for (let i = 0; i < 6; i++) await escolher('Não');
    await preencher(['20']);                // P37
    await preencher(['80']);                // P36
    t = await texto('#analise');
    ok(t.includes(MSG.semCusto) && !/%/.test(t), 'sem custo por unidade: mensagem clara, sem %');
    await semNaN('passo do preço sem custo');
    ok(await clicar('#res', 'Ver o resultado'), 'Ver o resultado (sem custo)');
    await semNaN('resultado sem custo');
    console.log('PASS-stage: sem custo por unidade');

    ok(errors.length === 0, 'sem erros de JavaScript: ' + errors.join(' | '));
  } catch (e) {
    falhas.push('exceção: ' + (e && e.stack || e));
  } finally {
    if (browser) await browser.close();
    await new Promise((r) => server.close(r));
  }
  if (falhas.length) {
    console.log(`\nFAIL: ${falhas.length} falha(s), ${passes} verificações ok`);
    falhas.forEach((f) => console.log(' - ' + f));
    process.exitCode = 1;
  } else {
    console.log(`\nPASS: ${passes} verificações ok`);
  }
})();
