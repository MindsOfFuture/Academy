/* Plano de negócio para imprimir ou salvar em PDF (Empreenda+).
   Monta um documento próprio (capa, capítulos, indicadores financeiros separados por bloco, fontes e limites)
   com as respostas que a pessoa guardou nos 10 módulos. Só lê; nunca grava nas chaves dos módulos.

   Contas: tudo em PlanoNegocio.indicadores(estados), função pura (testada em Node: tests/lg2-plano.cjs).
   Campos lidos (estado salvo de cada módulo, chave lg2-turma-<t>-mNN, formato {R:{código:{estado,opcao|valor}}}):
   - Módulo 5 (js/motor5.js = cópia idêntica de turma-a/m05/js/motor.js; Motor5.calcular(null, R)):
       linhas do custo de uma unidade (materiais P03–P07 / P19–P22, embalagem P08–P09 / P15–P16, compra P11–P12, frete P13–P14),
       taxa média (P24–P25) e entrega por venda (ENT), preço P36, vendas por mês P37.
       Custos do mês lidos direto das respostas (respeitando o Sim/Não): aluguel P28/P29, água e luz P30/P31,
       outros gastos P32/P33 (um por linha), pagamento da pessoa P34/P35, perdas P26/P27. Época do ano: SZ (ou M6.SZ).
   - Módulo 6 (js/motor6.js = cópia idêntica de turma-b/m06/js/motor.js):
       investimento = Motor6.investimento(R) (P02 + P11 + P14 + P17; P01 "sem compras" = R$ 0), itens = Motor6.itens(R, fora),
       forma de pagamento P03 + parcelas P03A (Motor6.planoInvestimento);
       capital de giro = Motor6.resumoCaixa(fluxo): o fluxo de 13 semanas salvo pelo módulo (estado.fluxo, quando é da versão
       atual) ou refeito com Motor6.fluxoInicial(R, dados do Módulo 5); vendas por mês P05 servem de reserva para a receita. */
(function (raiz) {
  'use strict';

  var CHAVES = { 1: 'lg2-turma-a-m01', 2: 'lg2-turma-b-m02', 3: 'lg2-turma-a-m03', 4: 'lg2-turma-a-m04', 5: 'lg2-turma-a-m05',
    6: 'lg2-turma-b-m06', 7: 'lg2-turma-b-m07', 8: 'lg2-turma-b-m08', 9: 'lg2-turma-b-m09', 10: 'lg2-turma-b-m10' };
  var AVISO = 'Este plano organiza o que você informou; não verifica os dados nem garante resultados. Confirme informações fiscais, jurídicas e de licenças com fontes oficiais ou profissionais.';
  var FALTA = function (n) { return 'não informado (Etapa ' + n + ')'; };
  var SZ_SIM = 'Sim, tem meses mais fortes e mais fracos';
  var MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  var INVEST_NOMES = { 'M6.P02': 'Compras para começar', 'M6.P11': 'Equipamentos e materiais para o serviço',
    'M6.P14': 'Equipamentos ou instalações para produzir', 'M6.P17': 'Primeira compra de mercadorias' };

  /* ---------- números e textos ---------- */
  function num(v) {
    if (v === null || v === undefined || v === '') return null;
    if (typeof v === 'number') return isFinite(v) ? v : null;
    var s = String(v).trim().replace(/[R$\s%]/g, '');
    if (!s) return null;
    if (s.indexOf(',') >= 0 || /^[1-9]\d{0,2}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '').replace(',', '.');
    var n = Number(s);
    return isFinite(n) && /^-?[\d.]+$/.test(s) ? n : null;
  }
  function cent(n) { return Math.round((n + (n >= 0 ? 1e-9 : -1e-9)) * 100) / 100; }
  function brl(n) {
    var r = cent(n), s = Math.abs(r).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return (r < 0 ? '−R$ ' : 'R$ ') + s;
  }
  function nf(n, casas) {
    var r = Number(n);
    return (r < 0 ? '−' : '') + Math.abs(r).toLocaleString('pt-BR', { maximumFractionDigits: casas === undefined ? 1 : casas });
  }
  function pct(n) { return nf(n, 1) + '%'; }
  /* meses com 1 casa; abaixo de 1 mês, em dias (30 dias por mês) */
  function meses(n) {
    if (n < 1) { var d = Math.max(1, Math.round(n * 30)); return 'menos de 1 mês (cerca de ' + d + (d === 1 ? ' dia)' : ' dias)'); }
    return nf(n, 1) + (nf(n, 1) === '1' ? ' mês' : ' meses');
  }
  function un(n, um, varios) { return nf(n, 1) + ' ' + (n === 1 ? um : varios); }
  function limpo(v) { return String(v === null || v === undefined ? '' : v).replace(/\s+/g, ' ').trim(); }
  function juntar(xs) { xs = xs.filter(Boolean); return xs.length < 2 ? xs.join('') : xs.slice(0, -1).join(', ') + ' e ' + xs[xs.length - 1]; }
  function soma(partes) { return partes.map(function (p) { return brl(p[0]) + ' (' + p[1] + ')'; }).join(' + '); }

  /* ---------- motores (navegador: globais; Node: require das cópias ao lado) ---------- */
  function motor5() {
    if (raiz.Motor5 && raiz.Motor5.calcular) return raiz.Motor5;
    if (raiz.Motor && raiz.Motor.calcular) return raiz.Motor;
    if (typeof require === 'function' && typeof __dirname !== 'undefined') { try { return require(__dirname + '/motor5.js'); } catch (e) { /* sem motor */ } }
    return null;
  }
  function motor6() {
    if (raiz.Motor && raiz.Motor.investimento) return raiz.Motor;
    if (typeof require === 'function' && typeof __dirname !== 'undefined') { try { return require(__dirname + '/motor6.js'); } catch (e) { /* sem motor */ } }
    return null;
  }
  function hojeISO() { var d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10); }

  /* dados do Módulo 5 no formato que o fluxo do Módulo 6 usa (mesma conta de dadosM5() em turma-b/m06/js/app.js) */
  function m5ParaFluxo(c, R5, M6) {
    if (!c) return null;
    var n = function (x) { return isFinite(x) && x > 0 ? x : 0; };
    var e = R5 && R5['M5.ENT'], preco = c.preco !== null && c.preco > 0 ? c.preco : 0, entrega = 0;
    if (e && e.estado === 'opcao' && e.opcao && !/^Não/i.test(e.opcao)) {
      var custo = n(num(e.custo)), porEntrega = e.tipoCusto === 'pct' ? custo / 100 * preco : custo;
      var cobra = /à parte/i.test(e.opcao) ? n(num(e.cobra)) : 0, a10 = e.aCada10 === null || e.aCada10 === undefined ? 10 : n(Number(e.aCada10));
      entrega = cent(Math.max(0, porEntrega - cobra) * a10 / 10);
    }
    var entNoCusto = (c.linhas || []).filter(function (l) { return /entrega/i.test(l.nome || ''); }).reduce(function (a, l) { return a + n(l.valor); }, 0);
    return { perdas: n(c.perdas), retirada: n(c.trabalho), custoVenda: cent(Math.max(0, n(c.custoUnidade) - entNoCusto)), entregaVenda: entrega, preco: preco };
  }

  /* ================= indicadores financeiros (função pura) =================
     estados = {1: estado do Módulo 1, …, 10: …} (objetos já lidos do localStorage); opts = {Motor5, Motor6, hoje: 'aaaa-mm-dd'}.
     Cada bloco: {id, titulo, explica, linhas:[{rotulo, valor|null, tipo:'brl'|'pct'|'un'|'meses'|'texto', falta, nota, total}], como:[…], faltas:[…]}. */
  function indicadores(estados, opts) {
    estados = estados || {}; opts = opts || {};
    var M5 = opts.Motor5 || motor5(), M6 = opts.Motor6 || motor6();
    var e5 = estados[5] || null, e6 = estados[6] || null;
    var R5 = (e5 && e5.R) || {}, R6 = (e6 && e6.R) || {};
    var tem5 = Object.keys(R5).length > 0, tem6 = Object.keys(R6).length > 0;
    var c = null;
    if (tem5 && M5) { try { c = M5.calcular(null, R5); } catch (err) { c = null; } }
    var op5 = function (k) { var r = R5['M5.' + k]; return r && r.estado === 'opcao' && typeof r.opcao === 'string' ? r.opcao.split(':')[0].trim() : null; };
    var val5 = function (k) { var r = R5['M5.' + k]; return r && r.estado === 'valor' ? r.valor : null; };
    var faltasGerais = [];
    function bloco(id, titulo, explica) { return { id: id, titulo: titulo, explica: explica, linhas: [], como: [], faltas: [] }; }

    /* ----- (c) custos fixos do mês ----- */
    var bc = bloco('c', 'Custos fixos do mês', 'Gastos que existem todo mês, vendendo pouco ou muito.');
    var fixosOk = tem5, fixos = 0, partesFixos = [];
    function simNao(rotulo, pSN, pVal, nao) {
      var sn = op5(pSN), v = num(val5(pVal));
      if (sn === 'Não') { bc.linhas.push({ rotulo: rotulo, valor: 0, tipo: 'brl', nota: nao }); return; }
      if (sn === 'Sim' && v !== null) { bc.linhas.push({ rotulo: rotulo, valor: v, tipo: 'brl' }); fixos += v; if (v) partesFixos.push([v, rotulo.replace(/ pelo trabalho.*$/, '').replace(/ de produtos ou materiais$/, '').toLowerCase()]); return; }
      bc.linhas.push({ rotulo: rotulo, valor: null, tipo: 'brl', falta: FALTA(5) }); fixosOk = false;
    }
    if (!tem5) { bc.linhas.push({ rotulo: 'Custos fixos do mês', valor: null, tipo: 'brl', falta: FALTA(5) }); bc.faltas.push('Custos do mês ' + FALTA(5) + '.'); fixosOk = false; }
    else {
      simNao('Aluguel', 'P28', 'P29', 'você não paga aluguel');
      simNao('Água e luz', 'P30', 'P31', 'você não paga essas contas para o negócio');
      var s32 = op5('P32'), outros = (val5('P33') || []).filter(function (x) { return x && (limpo(x.nome) || num(x.v) !== null); });
      if (s32 === 'Não') bc.linhas.push({ rotulo: 'Outros gastos do mês', valor: 0, tipo: 'brl', nota: 'você não tem outros gastos fixos' });
      else if (s32 === 'Sim' && outros.length) outros.forEach(function (x) {
        var v = num(x.v), nome = limpo(x.nome) || 'Outro gasto';
        if (v === null) { bc.linhas.push({ rotulo: nome, valor: null, tipo: 'brl', falta: FALTA(5) }); fixosOk = false; return; }
        bc.linhas.push({ rotulo: nome, valor: v, tipo: 'brl' }); fixos += v; if (v) partesFixos.push([v, nome.toLowerCase()]);
      });
      else { bc.linhas.push({ rotulo: 'Outros gastos do mês', valor: null, tipo: 'brl', falta: FALTA(5) }); fixosOk = false; }
      simNao('Seu pagamento pelo trabalho (pró-labore)', 'P34', 'P35', 'você não separa dinheiro para você');
      simNao('Perdas de produtos ou materiais', 'P26', 'P27', 'você não tem perdas');
      fixos = cent(fixos);
      bc.linhas.push({ rotulo: fixosOk ? 'Total por mês' : 'Total por mês (só o que foi informado)', valor: fixos, tipo: 'brl', total: true });
      bc.como.push('Como calculamos: ' + (partesFixos.length ? soma(partesFixos) + ' = ' + brl(fixos) + ' por mês.' : 'nenhum gasto fixo informado, então o total é R$ 0,00.'));
      if (!fixosOk) bc.faltas.push('Algum custo do mês está ' + FALTA(5) + ': o total pode estar menor do que o real.');
    }

    /* ----- (d) custo variável de cada venda ----- */
    var bd = bloco('d', 'Custo variável de cada venda', 'O que sai do seu bolso a cada venda: materiais, embalagem, frete, taxas e entrega.');
    var cv = null, cvOk = false;
    if (!tem5 || !c || !c.tipo) { bd.faltas.push('Custo de cada venda ' + FALTA(5) + '.'); bd.linhas.push({ rotulo: 'Custo de cada venda', valor: null, tipo: 'brl', falta: FALTA(5) }); }
    else {
      var partesCv = [];
      (c.linhas || []).forEach(function (l) {
        var nome = l.conta === 'material' ? 'Material: ' + limpo(l.nome) : limpo(l.nome);
        bd.linhas.push({ rotulo: nome, valor: l.valor, tipo: 'brl' }); partesCv.push([l.valor, l.conta === 'material' ? limpo(l.nome) : nome.toLowerCase()]);
      });
      (c.faltas || []).forEach(function (f) { bd.linhas.push({ rotulo: limpo(f), valor: null, tipo: 'brl', falta: FALTA(5) }); });
      if (c.tipo === 'Serviço' && !(c.linhas || []).length && op5('P18') === 'Não') bd.linhas.push({ rotulo: 'Materiais', valor: 0, tipo: 'brl', nota: 'você não usa material no serviço' });
      if (c.taxaPct > 0) {
        if (c.preco !== null) { bd.linhas.push({ rotulo: 'Taxas de cartão ou aplicativo (' + pct(c.taxaPct) + ' do preço)', valor: c.taxa, tipo: 'brl' }); partesCv.push([c.taxa, 'taxas']); }
        else bd.linhas.push({ rotulo: 'Taxas de cartão ou aplicativo (' + pct(c.taxaPct) + ' do preço)', valor: null, tipo: 'brl', falta: 'depende do preço, ' + FALTA(5) });
      } else if (op5('P24') === 'Não') bd.linhas.push({ rotulo: 'Taxas de cartão ou aplicativo', valor: 0, tipo: 'brl', nota: 'você não paga taxa' });
      if (c.entrega > 0) { bd.linhas.push({ rotulo: 'Entrega (média por venda)', valor: c.entrega, tipo: 'brl' }); partesCv.push([c.entrega, 'entrega']); }
      cv = cent(c.custoTaxa);
      cvOk = !(c.faltas || []).length && (c.taxaPct > 0 ? c.preco !== null : true);
      bd.linhas.push({ rotulo: cvOk ? 'Total por venda' : 'Total por venda (só o que foi informado)', valor: cv, tipo: 'brl', total: true });
      bd.como.push('Como calculamos: ' + (partesCv.length ? soma(partesCv) + ' = ' + brl(cv) + ' por venda.' : 'nenhum custo por venda informado, então o total é R$ 0,00.'));
      bd.como.push('As perdas entram por mês, junto dos custos fixos (como na Etapa 5).');
      if (!cvOk) bd.faltas.push('Parte do custo de cada venda está ' + FALTA(5) + ': o custo pode estar menor do que o real.');
    }

    /* ----- (e) preço e margem de contribuição ----- */
    var be = bloco('e', 'Preço e margem de contribuição', 'Margem de contribuição é o que sobra de cada venda, depois do custo dela, para pagar os custos do mês.');
    var preco = c && c.preco !== null && c.preco !== undefined && c.preco > 0 ? c.preco : null;
    var mc = null, mcPct = null;
    if (preco === null) { be.linhas.push({ rotulo: 'Preço de venda', valor: null, tipo: 'brl', falta: FALTA(5) }); be.faltas.push('Preço ' + FALTA(5) + ': sem ele não dá para calcular a margem, o ponto de equilíbrio, o lucro e o retorno.'); }
    else {
      be.linhas.push({ rotulo: 'Preço de venda', valor: preco, tipo: 'brl' });
      if (cv === null) { be.linhas.push({ rotulo: 'Margem de contribuição', valor: null, tipo: 'brl', falta: 'falta o custo de cada venda (Etapa 5)' }); }
      else {
        mc = cent(preco - cv); mcPct = mc / preco * 100;
        be.linhas.push({ rotulo: 'Custo variável de cada venda', valor: cv, tipo: 'brl' });
        be.linhas.push({ rotulo: 'Margem de contribuição por venda', valor: mc, tipo: 'brl', total: true });
        be.linhas.push({ rotulo: 'Margem de contribuição em % do preço', valor: mcPct, tipo: 'pct', total: true });
        be.como.push('Como calculamos: ' + brl(preco) + ' (preço) − ' + brl(cv) + ' (custo de cada venda) = ' + brl(mc) + ' por venda.');
        be.como.push('Em porcentagem: ' + brl(mc) + ' ÷ ' + brl(preco) + ' = ' + pct(mcPct) + ' do preço.');
        if (mc <= 0) be.faltas.push('O preço não cobre o custo de cada venda: cada venda dá prejuízo antes mesmo dos custos do mês.');
      }
    }

    /* ----- (f) ponto de equilíbrio ----- */
    var bf = bloco('f', 'Ponto de equilíbrio', 'Quantas vendas por mês pagam todos os custos, sem lucro nem prejuízo.');
    var pe = null;
    if (mc === null) { bf.linhas.push({ rotulo: 'Vendas por mês para empatar', valor: null, tipo: 'un', falta: 'não calculado: falta ' + (preco === null ? 'o preço' : 'o custo de cada venda') + ' (Etapa 5)' }); }
    else if (mc <= 0) { bf.linhas.push({ rotulo: 'Vendas por mês para empatar', valor: null, tipo: 'un', falta: 'não calculado: cada venda não deixa sobra' }); }
    else if (!tem5 || (!fixosOk && fixos <= 0)) { bf.linhas.push({ rotulo: 'Vendas por mês para empatar', valor: null, tipo: 'un', falta: 'não calculado: custos do mês ' + FALTA(5) }); }
    else if (fixos <= 0) { bf.linhas.push({ rotulo: 'Vendas por mês para empatar', valor: null, tipo: 'texto', nota: 'não se aplica: sem custos fixos, qualquer venda já deixa lucro' }); }
    else {
      pe = M5 && M5.vendasParaCobrir ? M5.vendasParaCobrir(fixos, mc) : Math.ceil(Math.round(fixos * 100) / Math.round(mc * 100) - 1e-9);
      var peR = cent(pe * preco);
      bf.linhas.push({ rotulo: 'Vendas por mês para empatar', valor: pe, tipo: 'un', total: true });
      bf.linhas.push({ rotulo: 'Faturamento por mês para empatar', valor: peR, tipo: 'brl', total: true });
      bf.como.push('Como calculamos: ' + brl(fixos) + ' (custos do mês) ÷ ' + brl(mc) + ' (sobra de cada venda) = ' + nf(fixos / mc, 1) + '; arredondamos para cima: ' + un(pe, 'venda', 'vendas') + ' por mês.');
      bf.como.push('Em reais: ' + nf(pe, 0) + ' × ' + brl(preco) + ' = ' + brl(peR) + ' por mês.');
      if (!fixosOk) bf.faltas.push('Calculado só com os custos do mês que foram informados.');
    }

    /* ----- (g) receita e lucro do mês ----- */
    var bg = bloco('g', 'Receita e lucro do mês (estimativa)', 'Quanto entra e quanto sobra num mês, com as vendas que você espera fazer.');
    var qtd = num(val5('P37')), origemQtd = 'Etapa 5';
    if (!(qtd > 0)) qtd = null;
    var p05 = M6 ? (function () { try { var v = M6.valor(R6, 'M6.P05'); return v === M6.NS ? null : num(v); } catch (err) { return null; } })() : null;
    if (qtd === null && p05 > 0 && preco !== null) { qtd = p05 / preco; origemQtd = 'Etapa 6'; }
    var lucro = null, cen = null;
    function mes(q) { var rec = cent(preco * q), cvm = cent(cv * q); return { qtd: q, receita: rec, variavel: cvm, fixos: fixos, lucro: cent(rec - cvm - fixos) }; }
    if (preco === null || cv === null) bg.linhas.push({ rotulo: 'Lucro do mês', valor: null, tipo: 'brl', falta: 'não calculado: falta ' + (preco === null ? 'o preço' : 'o custo de cada venda') + ' (Etapa 5)' });
    else if (qtd === null) { bg.linhas.push({ rotulo: 'Vendas por mês', valor: null, tipo: 'un', falta: FALTA(5) }); bg.linhas.push({ rotulo: 'Lucro do mês', valor: null, tipo: 'brl', falta: 'não calculado: falta quantas vendas você espera por mês (Etapa 5)' }); bg.faltas.push('Quantidade de vendas por mês ' + FALTA(5) + '.'); }
    else {
      var normal = mes(qtd); lucro = normal.lucro;
      bg.linhas.push({ rotulo: 'Vendas por mês' + (origemQtd === 'Etapa 6' ? ' (pelas vendas em reais da Etapa 6)' : ''), valor: qtd, tipo: 'un' });
      bg.linhas.push({ rotulo: 'Receita (faturamento) do mês', valor: normal.receita, tipo: 'brl' });
      bg.linhas.push({ rotulo: 'Custo variável das vendas do mês', valor: normal.variavel, tipo: 'brl' });
      bg.linhas.push({ rotulo: 'Custos fixos do mês', valor: fixos, tipo: 'brl' });
      bg.linhas.push({ rotulo: 'Lucro do mês' + (lucro < 0 ? ' (prejuízo)' : ''), valor: lucro, tipo: 'brl', total: true });
      bg.como.push('Como calculamos: ' + nf(qtd, 1) + ' vendas × ' + brl(preco) + ' = ' + brl(normal.receita) + ' de receita; ' + brl(normal.receita) + ' − ' + brl(normal.variavel) + ' (custo das vendas) − ' + brl(fixos) + ' (custos fixos) = ' + brl(lucro) + '.');
      if (fixos > 0) bg.como.push('O seu pagamento (pró-labore) já está nos custos fixos: o lucro é o que sobra depois de você receber.');
      /* época do ano (contrato M5.SZ, também usado em M6.SZ) */
      var sz = R5['M5.SZ'] && R5['M5.SZ'].estado === 'opcao' ? R5['M5.SZ'] : R6['M6.SZ'] && R6['M6.SZ'].estado === 'opcao' ? R6['M6.SZ'] : null;
      if (sz && sz.opcao === SZ_SIM) {
        var fortes = (sz.fortes || []).filter(function (m) { return m >= 1 && m <= 12; }), fracos = (sz.fracos || []).filter(function (m) { return m >= 1 && m <= 12 && fortes.indexOf(m) < 0; });
        var mais = num(sz.maisPct) || 0, menos = num(sz.menosPct) || 0;
        cen = { normal: normal, forte: fortes.length ? mes(Math.round(qtd * (1 + mais / 100))) : null, fraco: fracos.length ? mes(Math.round(qtd * (1 - menos / 100))) : null,
          fortes: fortes, fracos: fracos, maisPct: mais, menosPct: menos };
        if (cen.forte) { bg.linhas.push({ rotulo: 'Lucro num mês forte (' + juntar(fortes.map(function (m) { return MESES[m - 1]; })) + ')', valor: cen.forte.lucro, tipo: 'brl' });
          bg.como.push('Mês forte: ' + pct(mais) + ' a mais de vendas = ' + nf(cen.forte.qtd, 0) + ' vendas; ' + brl(cen.forte.receita) + ' − ' + brl(cen.forte.variavel) + ' − ' + brl(fixos) + ' = ' + brl(cen.forte.lucro) + '.'); }
        if (cen.fraco) { bg.linhas.push({ rotulo: 'Lucro num mês fraco (' + juntar(fracos.map(function (m) { return MESES[m - 1]; })) + ')', valor: cen.fraco.lucro, tipo: 'brl' });
          bg.como.push('Mês fraco: ' + pct(menos) + ' a menos de vendas = ' + nf(cen.fraco.qtd, 0) + ' vendas; ' + brl(cen.fraco.receita) + ' − ' + brl(cen.fraco.variavel) + ' − ' + brl(fixos) + ' = ' + brl(cen.fraco.lucro) + '.'); }
      }
      if (!fixosOk || !cvOk) bg.faltas.push('Calculado só com os custos que foram informados: o lucro real pode ser menor.');
    }

    /* ----- (a) investimento inicial ----- */
    var ba = bloco('a', 'Investimento inicial', 'O dinheiro para começar: equipamentos, instalações, primeira compra e outros gastos de abertura.');
    var inv = null, invInfo = null;
    if (!tem6 || !M6) { ba.linhas.push({ rotulo: 'Investimento inicial', valor: null, tipo: 'brl', falta: FALTA(6) }); ba.faltas.push('Investimento inicial ' + FALTA(6) + '.'); }
    else {
      try { invInfo = M6.investimento(R6); } catch (err) { invInfo = null; }
      if (!invInfo || invInfo.valor === null) { ba.linhas.push({ rotulo: 'Investimento inicial', valor: null, tipo: 'brl', falta: FALTA(6) }); ba.faltas.push('Valor do investimento inicial ' + FALTA(6) + '.'); }
      else {
        inv = cent(invInfo.valor);
        var partesInv = [];
        if (invInfo.semCompras) ba.linhas.push({ rotulo: 'Compras para começar', valor: 0, tipo: 'brl', nota: 'você não tem compras a fazer agora' });
        invInfo.partes.forEach(function (p) { ba.linhas.push({ rotulo: INVEST_NOMES[p.codigo] || 'Outros gastos para começar', valor: p.valor, tipo: 'brl' }); partesInv.push([p.valor, (INVEST_NOMES[p.codigo] || 'outros').toLowerCase()]); });
        ba.linhas.push({ rotulo: 'Total do investimento inicial', valor: inv, tipo: 'brl', total: true });
        ba.como.push('Como calculamos: ' + (partesInv.length > 1 ? soma(partesInv) + ' = ' + brl(inv) + '.' : partesInv.length ? 'é o valor que você informou: ' + brl(inv) + '.' : 'você não tem compras a fazer agora, então o investimento é R$ 0,00.'));
        var lista = []; try { lista = M6.itens(R6, (e6 && e6.fora) || []); } catch (err) { lista = []; }
        if (lista.length) ba.itens = lista;
        try {
          var pl = M6.planoInvestimento(R6);
          if (pl && pl.n > 0) ba.como.push('Pagamento: ' + (pl.entrada > 0 ? brl(pl.entrada) + ' de entrada e ' : '') + pl.n + (pl.n === 1 ? ' parcela' : ' parcelas') + ' de cerca de ' + brl(pl.parcela) + (pl.outros > 0 ? '; o restante (' + brl(pl.outros) + ') à vista' : '') + '.');
          else if (invInfo.forma && invInfo.forma !== M6.NS && inv > 0) ba.como.push('Forma de pagamento: ' + limpo(invInfo.forma).toLowerCase() + '.');
        } catch (err) { /* sem plano de pagamento */ }
      }
    }

    /* ----- (b) capital de giro ----- */
    var bb = bloco('b', 'Capital de giro (reserva para o caixa)', 'Dinheiro guardado para pagar as contas enquanto as vendas ainda não cobrem tudo. Vem da projeção de 13 semanas da Etapa 6.');
    var giro = null;
    if (!tem6 || !M6) { bb.linhas.push({ rotulo: 'Capital de giro necessário', valor: null, tipo: 'brl', falta: FALTA(6) }); bb.faltas.push('Fluxo de caixa ' + FALTA(6) + '.'); }
    else {
      try {
        var F = e6 && e6.fluxo && e6.fluxo.v === M6.FLUXO_V && Array.isArray(e6.fluxo.semanas) && e6.fluxo.semanas.length === 13 ? e6.fluxo
          : M6.fluxoInicial(R6, m5ParaFluxo(c, R5, M6), opts.hoje || hojeISO());
        var rc = M6.resumoCaixa(F);
        giro = { saldoInicial: F.saldoInicial || 0, menor: rc.min, semana: rc.semanaMin, final: rc.final, capital: rc.capital, semanas: rc.P, vendasMes: F.vendasMes || 0 };
      } catch (err) { giro = null; }
      var temCaixa = (function () { try { var v = M6.valor(R6, 'M6.P07'); return v !== undefined && v !== M6.NS; } catch (err) { return false; } })();
      if (!giro) { bb.linhas.push({ rotulo: 'Capital de giro necessário', valor: null, tipo: 'brl', falta: FALTA(6) }); }
      else if (!temCaixa && !(giro.vendasMes > 0)) { giro = null; bb.linhas.push({ rotulo: 'Capital de giro necessário', valor: null, tipo: 'brl', falta: 'não calculado: dinheiro em caixa e vendas do mês ' + FALTA(6) }); bb.faltas.push('Dinheiro em caixa e vendas por mês ' + FALTA(6) + '.'); }
      else {
        bb.linhas.push({ rotulo: 'Dinheiro que você tem hoje para o negócio', valor: giro.saldoInicial, tipo: 'brl', falta: temCaixa ? null : undefined, nota: temCaixa ? null : 'não informado na Etapa 6: contamos R$ 0,00' });
        bb.linhas.push({ rotulo: 'Saldo mais baixo previsto (semana ' + giro.semana + ')', valor: giro.menor, tipo: 'brl' });
        bb.linhas.push({ rotulo: 'Saldo no fim das 13 semanas', valor: giro.final, tipo: 'brl' });
        bb.linhas.push({ rotulo: 'Capital de giro que falta (reserva a conseguir)', valor: giro.capital, tipo: 'brl', total: true });
        bb.como.push('Como calculamos: começamos com ' + brl(giro.saldoInicial) + '; a cada semana somamos o dinheiro das vendas que cai e tiramos os gastos do mês, as perdas, o seu pagamento, o custo das vendas e o pagamento do investimento. O saldo mais baixo é ' + brl(giro.menor) + ', na semana ' + giro.semana + '.');
        bb.como.push(giro.capital > 0 ? 'Capital de giro que falta = o que falta para esse saldo não ficar negativo: ' + brl(giro.capital) + '.'
          : 'Como o saldo não fica negativo em nenhuma semana, não falta capital de giro nessa projeção (R$ 0,00).');
        if (!temCaixa) bb.faltas.push('Dinheiro em caixa hoje ' + FALTA(6) + ': a projeção começou do zero.');
      }
    }

    /* ----- (h) retorno ----- */
    var bh = bloco('h', 'Retorno do investimento', 'Em quanto tempo o lucro paga o dinheiro investido para começar.');
    var anual = null, roi = null, payback = null, lucroMedio = null;
    if (lucro === null) { bh.linhas.push({ rotulo: 'Lucro em um ano', valor: null, tipo: 'brl', falta: 'não calculado: falta o lucro do mês (bloco G)' }); }
    else {
      if (cen && (cen.forte || cen.fraco)) {
        var nF = cen.forte ? cen.fortes.length : 0, nFr = cen.fraco ? cen.fracos.length : 0, nN = 12 - nF - nFr;
        anual = cent(lucro * nN + (cen.forte ? cen.forte.lucro * nF : 0) + (cen.fraco ? cen.fraco.lucro * nFr : 0));
        bh.como.push('Lucro em um ano: ' + juntar([nN ? nN + ' × ' + brl(lucro) + ' (meses normais)' : '', nF ? nF + ' × ' + brl(cen.forte.lucro) + ' (meses fortes)' : '', nFr ? nFr + ' × ' + brl(cen.fraco.lucro) + ' (meses fracos)' : '']).replace(/ e /, ' + ').replace(/, /g, ' + ') + ' = ' + brl(anual) + '.');
      } else {
        anual = cent(lucro * 12);
        bh.como.push('Lucro em um ano: 12 × ' + brl(lucro) + ' = ' + brl(anual) + '.');
      }
      lucroMedio = anual / 12;
      bh.linhas.push({ rotulo: 'Lucro em um ano', valor: anual, tipo: 'brl' });
      if (inv === null) {
        bh.linhas.push({ rotulo: 'Retorno sobre o investimento (ROI) em um ano', valor: null, tipo: 'pct', falta: 'não calculado: investimento inicial ' + FALTA(6) });
        bh.linhas.push({ rotulo: 'Tempo para recuperar o investimento (payback)', valor: null, tipo: 'meses', falta: 'não calculado: investimento inicial ' + FALTA(6) });
      } else if (inv <= 0) {
        bh.linhas.push({ rotulo: 'Retorno sobre o investimento (ROI) e payback', valor: null, tipo: 'texto', nota: 'não se aplica: você informou que não tem investimento inicial' });
      } else if (anual <= 0) {
        bh.linhas.push({ rotulo: 'Retorno sobre o investimento (ROI) em um ano', valor: null, tipo: 'pct', falta: 'não calculado: com estes números não há lucro no ano, então o investimento não volta' });
        bh.linhas.push({ rotulo: 'Tempo para recuperar o investimento (payback)', valor: null, tipo: 'meses', falta: 'não calculado: sem lucro, o investimento não é recuperado' });
      } else {
        roi = anual / inv * 100; payback = inv / lucroMedio;
        bh.linhas.push({ rotulo: 'Retorno sobre o investimento (ROI) em um ano', valor: roi, tipo: 'pct', total: true });
        bh.linhas.push({ rotulo: 'Tempo para recuperar o investimento (payback)', valor: payback, tipo: 'meses', total: true });
        bh.como.push('ROI: ' + brl(anual) + ' (lucro em um ano) ÷ ' + brl(inv) + ' (investimento inicial) = ' + pct(roi) + ' ao ano.');
        bh.como.push('Payback: ' + brl(inv) + ' (investimento) ÷ ' + brl(cent(lucroMedio)) + ' (lucro médio por mês) = ' + meses(payback) + '.');
      }
    }

    var blocos = [ba, bb, bc, bd, be, bf, bg, bh];
    blocos.forEach(function (b) { b.faltas.forEach(function (f) { if (faltasGerais.indexOf(f) < 0) faltasGerais.push(f); }); });
    return {
      blocos: blocos, faltas: faltasGerais,
      investimento: { total: inv, itens: ba.itens || [] },
      giro: giro,
      fixos: { total: tem5 ? fixos : null, completo: fixosOk },
      variavel: { total: cv, completo: cvOk },
      margem: { preco: preco, mc: mc, pct: mcPct },
      equilibrio: { unidades: pe, reais: pe !== null ? cent(pe * preco) : null },
      resultado: { qtd: qtd, lucro: lucro, cenarios: cen },
      retorno: { anual: anual, roi: roi, payback: payback, lucroMedio: lucroMedio }
    };
  }

  /* ================= documento ================= */
  function esc(s) { return String(s === null || s === undefined ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function lerLocal(n) { try { return JSON.parse(raiz.localStorage.getItem(CHAVES[n])) || null; } catch (e) { return null; } }
  function estadosLocal() { var o = {}; Object.keys(CHAVES).forEach(function (n) { o[n] = lerLocal(n); }); return o; }
  function fmtValor(l) {
    if (l.valor === null || l.valor === undefined) return l.falta ? l.falta : l.nota || '';
    if (l.tipo === 'pct') return pct(l.valor);
    if (l.tipo === 'un') return nf(l.valor, 1) + (l.valor === 1 ? ' venda' : ' vendas');
    if (l.tipo === 'meses') return meses(l.valor);
    if (l.tipo === 'texto') return l.nota || '';
    return brl(l.valor);
  }
  function blocoHTML(b) {
    var h = '<article class="pl-ind" data-bloco="' + b.id + '"><header class="pl-ind-cab"><span class="pl-ind-letra">' + b.id.toUpperCase() + '</span><h3>' + esc(b.titulo) + '</h3></header>';
    h += '<div class="pl-ind-corpo"><p class="pl-ind-explica">' + esc(b.explica) + '</p><table class="pl-ind-tab"><tbody>';
    b.linhas.forEach(function (l) {
      var falta = (l.valor === null || l.valor === undefined) && l.falta;
      h += '<tr class="' + (l.total ? 'pl-total' : '') + (falta ? ' pl-falta' : '') + '"><th scope="row">' + esc(l.rotulo) + (l.nota && l.valor !== null && l.valor !== undefined ? '<span class="pl-nota">' + esc(l.nota) + '</span>' : '') + '</th><td>' + esc(fmtValor(l)) + '</td></tr>';
    });
    h += '</tbody></table>';
    if (b.itens && b.itens.length) h += '<p class="pl-ind-itens"><b>Itens que você listou:</b> ' + esc(juntar(b.itens)) + '.</p>';
    b.como.forEach(function (t) { h += '<p class="pl-como">' + esc(t) + '</p>'; });
    b.faltas.forEach(function (t) { h += '<p class="pl-aviso">' + esc(t) + '</p>'; });
    return h + '</div></article>';
  }
  function itensHTML(itens) {
    if (!itens.length) return '';
    return '<dl class="pl-qa">' + itens.map(function (it) {
      return '<div class="pl-qa-item' + (it.resposta === 'Não sei' ? ' pl-ns' : '') + '"><dt>' + esc(it.pergunta) + '</dt><dd>' + esc(it.resposta === 'Não sei' ? 'Ainda em aberto' : it.resposta) + '</dd></div>';
    }).join('') + '</dl>';
  }
  function vazioHTML(n) { return '<p class="pl-vazio">Você ainda não respondeu a Etapa ' + n + '. Abra essa etapa na sua trilha para completar esta parte do plano.</p>'; }
  function capitulo(num, titulo, corpo, extraCls) {
    return '<section class="pl-cap' + (extraCls ? ' ' + extraCls : '') + '" data-cap="' + num + '"><header class="pl-cab"><span class="pl-cab-num">' + num + '</span><h2>' + esc(titulo) + '</h2></header>' + corpo + '</section>';
  }
  function respTexto(r) {
    if (!r) return '';
    if (r.estado === 'opcao') return limpo(r.opcao);
    if (r.estado === 'valor' && (typeof r.valor === 'string' || typeof r.valor === 'number')) return limpo(r.valor);
    return '';
  }
  /* concorrentes do Módulo 3: uma linha por concorrente (formato porNome de turma-a/m03/js/app.js) */
  function concorrentes(R3) {
    var cods = { trabalha: 'M3.P18', preco: 'M3.P20', bem: 'M3.P22', mal: 'M3.P22B', tab: 'M3.P19' };
    var por = {}; Object.keys(cods).forEach(function (k) { var r = R3[cods[k]]; por[k] = r && r.porNome && typeof r.porNome === 'object' ? r.porNome : null; });
    var nomes = (R3['M3.P15'] && Array.isArray(R3['M3.P15'].nomes) ? R3['M3.P15'].nomes : []).map(limpo).filter(Boolean);
    Object.keys(por).forEach(function (k) { if (por[k]) Object.keys(por[k]).forEach(function (n) { if (nomes.indexOf(n) < 0) nomes.push(n); }); });
    if (!nomes.length || !Object.keys(por).some(function (k) { return por[k]; })) return null;
    var precoDe = function (x) {
      if (!x) return '';
      if (typeof x === 'string') return limpo(x);
      if (num(x.min) !== null && num(x.max) !== null) return num(x.min) === num(x.max) ? brl(num(x.min)) : 'de ' + brl(num(x.min)) + ' a ' + brl(num(x.max));
      return limpo(x.valor);
    };
    var tabDe = function (x) { var t = x && x.tabela; return t ? Object.keys(t).map(function (k) { return k.replace(/\s*\(.*\)$/, '') + ': ' + limpo(t[k]).toLowerCase(); }).join('; ') : ''; };
    var txt = function (x) { return typeof x === 'string' ? limpo(x) : x ? limpo(x.valor || '') : ''; };
    var linhas = nomes.map(function (n) {
      return { nome: n, trabalha: por.trabalha ? txt(por.trabalha[n]) : '', preco: por.preco ? precoDe(por.preco[n]) : '', bem: por.bem ? txt(por.bem[n]) : '', mal: por.mal ? txt(por.mal[n]) : '', tab: por.tab ? tabDe(por.tab[n]) : '' };
    });
    var usados = Object.keys(cods).filter(function (k) { return por[k]; }).map(function (k) { return cods[k]; }).concat(['M3.P15']);
    var h = '<h3 class="pl-sub">Concorrentes, um a um</h3><table class="pl-tab pl-conc"><thead><tr><th>Concorrente</th><th>Como trabalha</th><th>Preço</th><th>Faz bem</th><th>Deixa a desejar</th><th>Você, comparado a ele</th></tr></thead><tbody>';
    linhas.forEach(function (l) { h += '<tr><th scope="row">' + esc(l.nome) + '</th>' + ['trabalha', 'preco', 'bem', 'mal', 'tab'].map(function (k) { return '<td>' + esc(l[k] || '—') + '</td>'; }).join('') + '</tr>'; });
    return { html: h + '</tbody></table>', usados: usados };
  }
  function fluxoHTML(passos, gargalo) {
    if (!passos.length) return '';
    if (raiz.LG2Diagrama && raiz.LG2Diagrama.html) {
      try { return '<div class="pl-diagrama">' + raiz.LG2Diagrama.html(passos.map(function (p) { return { titulo: p }; }), { rotulo: 'Etapas do processo, em ordem' }) + '</div>'; } catch (e) { /* lista abaixo */ }
    }
    return '<ol class="pl-fluxo" aria-label="Etapas do processo, em ordem">' + passos.map(function (p, i) {
      return '<li><span class="pl-fluxo-num">' + (i + 1) + '</span><span class="pl-fluxo-txt">' + esc(p) + '</span></li>';
    }).join('') + '</ol>' + (gargalo ? '<p class="pl-nota-fluxo">O que mais limita a produção hoje: ' + esc(gargalo) + '.</p>' : '');
  }
  function dataBR(iso) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || '')); return m ? m[3] + '/' + m[2] + '/' + m[1] : limpo(iso); }
  function planoAcao(r) {
    if (!r || r.estado !== 'plano') return '';
    if (limpo(r.frase)) return limpo(r.frase);
    var p = [];
    if (limpo(r.acao)) p.push(limpo(r.acao).replace(/[.]+$/, ''));
    if (limpo(r.data)) p.push('até ' + dataBR(r.data));
    var s = p.join(' ');
    if (limpo(r.sinal) || num(r.numero) > 0) s += (s ? '. ' : '') + 'Vai saber que deu certo por: ' + juntar([num(r.numero) > 0 ? nf(num(r.numero), 1) + (limpo(r.unidade) ? ' ' + limpo(r.unidade) : '') : '', limpo(r.sinal)]);
    return s ? s + '.' : '';
  }

  var TITULOS = ['Resumo executivo', 'O empreendedor', 'Clientes', 'Mercado e concorrência', 'Produto e proposta de valor', 'Custos e preço',
    'Investimento e fluxo de caixa', 'Operação', 'Formalização', 'Licenças e endereço', 'Vendas, pessoas e plano de ação', 'Indicadores financeiros',
    'Pontos em aberto e próximos passos', 'Fontes consultadas'];

  /* monta o HTML do plano. ctx = {modulos:[{n,nome,caminho,situacao}], dados(n), estados, fontes:[...], nome, hoje, Resumo, Diagnostico} */
  function montarHTML(ctx) {
    var est = ctx.estados || estadosLocal();
    var ler = function (n) { return est[n] || null; };
    var R = function (n) { return (est[n] && est[n].R) || {}; };
    var D = ctx.Diagnostico || raiz.DiagnosticoLG2, RN = ctx.Resumo || raiz.ResumoNegocio;
    var diag = { blocos: [], abertos: [] };
    try { diag = D.montar(ctx.modulos, ctx.dados, ler); } catch (e) { /* sem respostas formatadas */ }
    var bloco = function (n) { return diag.blocos.filter(function (b) { return b.n === n; })[0] || { itens: [] }; };
    var itensSem = function (n, fora) { return bloco(n).itens.filter(function (it) { return (fora || []).indexOf(it.codigo) < 0; }); };
    var ind = indicadores(est, { hoje: ctx.hoje });
    var pars = []; try { pars = (RN.paragrafos ? RN.paragrafos(ler) : [RN.frases(ler).join(' ')]).filter(Boolean); } catch (e) { pars = []; }

    var r1 = R(1), r5 = R(5);
    var negocio = respTexto(r1['M1.P03']) || respTexto(r5['M5.P02']) || respTexto(r5['M5.P10']) || respTexto(r5['M5.P17']) || limpo((ler(7) || {}).ini && ler(7).ini.oferta);
    if (/^(não sei|nao sei)/i.test(negocio)) negocio = '';
    var hoje = ctx.hoje ? new Date(ctx.hoje + 'T12:00:00') : new Date();
    var data = hoje.getDate() + ' de ' + MESES[hoje.getMonth()] + ' de ' + hoje.getFullYear();
    var nomePessoa = limpo(ctx.nome);

    var h = '';
    /* capa */
    h += '<section class="pl-capa"><div class="pl-capa-topo"><img class="pl-capa-logo" src="assets/minds.svg" alt="Minds of the Future"><p class="pl-capa-kicker">Empreenda+ · Apoio a pequenos negócios</p>' +
      '<h1 class="pl-capa-titulo">Plano de negócio</h1><p class="pl-capa-negocio">' + esc(negocio || 'Meu negócio') + '</p></div>' +
      '<div class="pl-capa-meio"><dl class="pl-capa-dados"><div><dt>Empreendedor(a)</dt><dd>' + (nomePessoa ? esc(nomePessoa) : '<span class="pl-linha" aria-label="espaço para escrever o nome"></span>') + '</dd></div>' +
      '<div><dt>Data</dt><dd>' + esc(data) + '</dd></div></dl>' +
      '<h2 class="pl-sumario-tit">Sumário</h2><ol class="pl-sumario">' + TITULOS.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ol></div>' +
      '<footer class="pl-capa-rodape"><p>Montado com as respostas da jornada Empreenda+, um projeto de extensão da FACC/UFJF no Minds of the Future.</p>' + logosHTML() + '</footer></section>';

    /* 1 resumo executivo */
    var destaques = [
      ['Investimento inicial', ind.investimento.total !== null ? brl(ind.investimento.total) : FALTA(6)],
      ['Lucro estimado por mês', ind.resultado.lucro !== null ? brl(ind.resultado.lucro) : 'não calculado'],
      ['Retorno em um ano (ROI)', ind.retorno.roi !== null ? pct(ind.retorno.roi) : 'não calculado'],
      ['Tempo para recuperar o investimento', ind.retorno.payback !== null ? meses(ind.retorno.payback) : 'não calculado']
    ];
    var c1 = (pars.length ? pars.map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('') : '<p class="pl-vazio">Ainda não dá para montar o resumo: continue respondendo as etapas.</p>') +
      '<div class="pl-destaques">' + destaques.map(function (d) { return '<div class="pl-dest"><span class="pl-dest-rot">' + esc(d[0]) + '</span><span class="pl-dest-val">' + esc(d[1]) + '</span></div>'; }).join('') + '</div>' +
      '<p class="pl-nota">Os números acima são explicados, conta por conta, no capítulo 12.</p>';
    h += capitulo(1, TITULOS[0], c1);

    /* 2 a 11: um capítulo por módulo */
    var c2 = bloco(1).itens.length ? itensHTML(bloco(1).itens) : vazioHTML(1);
    h += capitulo(2, TITULOS[1], '<p class="pl-intro">Quem está à frente do negócio, em que ponto a ideia está e com que tempo e dinheiro conta.</p>' + c2);

    var e2 = ler(2) || {}, extra2 = '';
    if (e2.plano && (limpo(e2.plano.meta) || limpo(e2.plano.prazo))) extra2 = '<p class="pl-destaque-txt"><b>Meta de conversas com clientes:</b> ' + esc(juntar([limpo(e2.plano.meta), limpo(e2.plano.prazo) ? 'prazo: ' + limpo(e2.plano.prazo) : ''])) + '.</p>';
    h += capitulo(3, TITULOS[2], '<p class="pl-intro">Para quem você vende, o que essas pessoas procuram e o que você já confirmou conversando com elas.</p>' + (bloco(2).itens.length ? itensHTML(bloco(2).itens) + extra2 : vazioHTML(2)));

    var conc = concorrentes(R(3));
    var c4 = bloco(3).itens.length || conc ? (conc ? conc.html : '') + (itensSem(3, conc ? conc.usados : []).length ? '<h3 class="pl-sub">Mercado e oportunidades</h3>' + itensHTML(itensSem(3, conc ? conc.usados : [])) : '') : vazioHTML(3);
    h += capitulo(4, TITULOS[3], '<p class="pl-intro">Onde você vende, quem já vende algo parecido e como você se compara.</p>' + c4);

    var pv = null; try { pv = RN.proposta(R(4), null); } catch (e) { pv = null; }
    var c5 = (pv && pv.frase ? '<p class="pl-destaque-txt">' + esc(pv.frase) + '</p>' : '') + (bloco(4).itens.length ? itensHTML(bloco(4).itens) : vazioHTML(4));
    h += capitulo(5, TITULOS[4], '<p class="pl-intro">O que você oferece, para quem, por que o cliente escolheria você e como vai testar a ideia.</p>' + c5);

    var resumo6 = ind.margem.preco !== null ? '<div class="pl-destaques">' + [
      ['Preço de venda', brl(ind.margem.preco)], ['Custo de cada venda', ind.variavel.total !== null ? brl(ind.variavel.total) : FALTA(5)],
      ['Sobra de cada venda', ind.margem.mc !== null ? brl(ind.margem.mc) : 'não calculado'], ['Custos fixos do mês', ind.fixos.total !== null ? brl(ind.fixos.total) : FALTA(5)]
    ].map(function (d) { return '<div class="pl-dest"><span class="pl-dest-rot">' + esc(d[0]) + '</span><span class="pl-dest-val">' + esc(d[1]) + '</span></div>'; }).join('') + '</div>' : '';
    h += capitulo(6, TITULOS[5], '<p class="pl-intro">Quanto custa fazer cada venda, quais são os gastos do mês e por quanto você vende. As contas completas estão no capítulo 12.</p>' + resumo6 + (bloco(5).itens.length ? itensHTML(bloco(5).itens) : vazioHTML(5)));

    var g = ind.giro, c7 = '';
    if (g && g.semanas && g.semanas.length) {
      c7 += '<h3 class="pl-sub">Fluxo de caixa das próximas 13 semanas</h3><table class="pl-tab pl-caixa"><thead><tr><th>Semana</th><th>Entra</th><th>Sai</th><th>Saldo no fim</th></tr></thead><tbody>' +
        g.semanas.map(function (s) { return '<tr' + (s.final < 0 ? ' class="pl-neg"' : '') + '><th scope="row">' + s.semana + '</th><td>' + brl(s.entradas) + '</td><td>' + brl(s.saidas) + '</td><td>' + brl(s.final) + '</td></tr>'; }).join('') +
        '</tbody></table><p class="pl-nota">Saldo no fim da semana = saldo do começo + o que entra − o que sai. Começa com ' + brl(g.saldoInicial) + '.</p>';
    }
    h += capitulo(7, TITULOS[6], '<p class="pl-intro">Quanto é preciso para começar, como vai pagar e como o dinheiro entra e sai nas primeiras semanas.</p>' + (bloco(6).itens.length ? itensHTML(bloco(6).itens) + c7 : vazioHTML(6) + c7));

    var e7 = ler(7) || {}, passos = Array.isArray(e7.mapa) ? e7.mapa.map(limpo).filter(Boolean) : [];
    var garg = respTexto((e7.R || {})['M7-05']);
    var cap = null; try { cap = RN.capM7 ? RN.capM7(e7) : null; } catch (e) { cap = null; }
    var c8 = (passos.length ? '<h3 class="pl-sub">Caminho do pedido até o cliente</h3>' + fluxoHTML(passos, garg) : '') +
      (cap && cap.texto ? '<p class="pl-destaque-txt"><b>Capacidade:</b> no tempo que você tem, dá para fazer ' + esc(cap.texto) + ' por mês.</p>' : '') +
      (bloco(7).itens.length ? itensHTML(itensSem(7, passos.length ? ['M7-01'] : [])) : vazioHTML(7));
    h += capitulo(8, TITULOS[7], '<p class="pl-intro">Como o trabalho acontece, quanto você consegue fazer, com quem compra e como garante a qualidade.</p>' + c8);

    h += capitulo(9, TITULOS[8], '<p class="pl-intro">Como o negócio pode ser registrado e o que isso muda nos impostos.</p>' + (bloco(8).itens.length ? itensHTML(bloco(8).itens) : vazioHTML(8)));
    h += capitulo(10, TITULOS[9], '<p class="pl-intro">Onde a atividade vai funcionar e quais licenças e autorizações podem ser necessárias.</p>' + (bloco(9).itens.length ? itensHTML(bloco(9).itens) : vazioHTML(9)));

    var r11 = R(10)['M10-11'], acao = planoAcao(r11);
    h += capitulo(11, TITULOS[10], '<p class="pl-intro">Como os clientes chegam até você, quem faz cada parte do trabalho e o que fazer primeiro.</p>' +
      (acao ? '<p class="pl-destaque-txt"><b>Primeira ação do plano:</b> ' + esc(acao) + '</p>' : '') + (bloco(10).itens.length ? itensHTML(itensSem(10, acao ? ['M10-11'] : [])) : vazioHTML(10)));

    /* 12 indicadores financeiros, em blocos separados */
    h += capitulo(12, TITULOS[11], '<p class="pl-intro">As contas do negócio, separadas por assunto. Cada bloco mostra de onde vem cada número. Quando falta um dado, o bloco diz qual etapa completar.</p>' +
      '<div class="pl-inds">' + ind.blocos.map(blocoHTML).join('') + '</div>', 'pl-cap-ind');

    /* 13 pontos em aberto e próximos passos */
    var abertos = diag.abertos.map(function (a) { return a.pergunta + ' (Etapa ' + a.modulo + ')'; });
    var naoComecou = (ctx.modulos || []).filter(function (m) { return !bloco(m.n).itens.length; }).map(function (m) { return 'Etapa ' + m.n + ' · ' + m.nome; });
    var passosProx = [];
    if (acao) passosProx.push('Fazer a primeira ação do plano: ' + acao.replace(/[.]+$/, '') + '.');
    if (naoComecou.length) passosProx.push('Responder ' + (naoComecou.length === 1 ? 'a etapa que falta' : 'as etapas que faltam') + ' para completar o plano.');
    if (abertos.length) passosProx.push('Usar a ajuda “Como descobrir” de cada ponto em aberto e atualizar a resposta.');
    if (ind.faltas.length) passosProx.push('Completar os dados que faltam nas contas (capítulo 12) para ter o ponto de equilíbrio, o lucro e o retorno completos.');
    passosProx.push('Confirmar com fontes oficiais ou um profissional as regras de registro, impostos e licenças antes de decidir.');
    passosProx.push('Voltar ao plano a cada mês, comparar com o que aconteceu e ajustar preço, custos e metas.');
    var c13 = '<h3 class="pl-sub">Perguntas que ficaram em aberto</h3>' + (abertos.length ? '<ul class="pl-lista">' + abertos.map(function (a) { return '<li>' + esc(a) + '</li>'; }).join('') + '</ul>' : '<p class="pl-vazio">Nenhuma pergunta ficou em aberto.</p>') +
      (ind.faltas.length ? '<h3 class="pl-sub">Dados que faltam para as contas</h3><ul class="pl-lista">' + ind.faltas.map(function (f) { return '<li>' + esc(f) + '</li>'; }).join('') + '</ul>' : '') +
      (naoComecou.length ? '<h3 class="pl-sub">Etapas ainda sem resposta</h3><ul class="pl-lista">' + naoComecou.map(function (f) { return '<li>' + esc(f) + '</li>'; }).join('') + '</ul>' : '') +
      '<h3 class="pl-sub">Próximos passos</h3><ol class="pl-lista pl-passos">' + passosProx.map(function (p) { return '<li>' + esc(p) + '</li>'; }).join('') + '</ol>';
    h += capitulo(13, TITULOS[12], c13);

    /* fontes + limites */
    var fontes = ctx.fontes || [];
    var cF = '<div class="pl-limites"><h3>Limites deste plano</h3><p>' + esc(AVISO) + '</p></div>' + (fontes.length ? '<ul class="pl-fontes">' + fontes.map(function (f) {
      return '<li><b>' + esc(f.titulo) + '</b>' + (f.orgao ? ' · ' + esc(f.orgao) : '') + (f.consulta ? ' · <span class="pl-consulta">consultado em ' + esc(f.consulta) + '</span>' : '') + (f.link ? '<br><span class="pl-link">' + esc(f.link) + '</span>' : '') + '</li>';
    }).join('') + '</ul>' : '<p class="pl-vazio">As fontes de cada assunto estão dentro das etapas.</p>') + logosHTML();
    h += '<section class="pl-cap pl-cap-fontes" data-cap="fontes"><header class="pl-cab"><span class="pl-cab-num">·</span><h2>' + TITULOS[13] + '</h2></header>' + cF + '</section>';
    return { html: h, indicadores: ind, negocio: negocio };
  }
  function logosHTML() {
    return '<div class="pl-logos"><img src="assets/logo_facc.png" alt="FACC"><img src="assets/logo_ufjf.svg" alt="UFJF"><img src="assets/logo_mg.svg" alt="Governo de Minas Gerais"></div>';
  }

  /* fontes de cada módulo (dados/fontes.js define window.LG2_FONTES): carrega uma de cada vez e junta, sem repetir link */
  var fontesCache = null;
  function carregarFontes(modulos, pronto) {
    if (fontesCache) { pronto(fontesCache); return; }
    var lista = (modulos || []).filter(function (m) { return m.caminho; }), out = [], vistos = {}, i = 0;
    var antes = raiz.LG2_FONTES;
    function proximo() {
      if (i >= lista.length) { raiz.LG2_FONTES = antes; fontesCache = out; pronto(out); return; }
      var m = lista[i++], s = raiz.document.createElement('script'), feito = false;
      var fim = function () {
        if (feito) return; feito = true;
        var F = raiz.LG2_FONTES; raiz.LG2_FONTES = undefined;
        ((F && F.fontes) || []).forEach(function (f) {
          var k = limpo(f.link) || limpo(f.titulo);
          if (!k || vistos[k] || !limpo(f.titulo)) return; vistos[k] = 1;
          out.push({ titulo: limpo(f.titulo), orgao: limpo(f.orgao), link: limpo(f.link), consulta: limpo(f.consulta) });
        });
        if (s.parentNode) s.parentNode.removeChild(s);
        proximo();
      };
      raiz.LG2_FONTES = undefined;
      s.src = m.caminho.replace(/index\.html$/, '') + 'dados/fontes.js';
      s.onload = s.onerror = fim;
      setTimeout(fim, 4000);
      raiz.document.head.appendChild(s);
    }
    proximo();
  }

  /* botão "Baixar meu plano de negócio": monta o documento escondido (#plano) e abre a impressão (salvar em PDF) */
  var tituloAntes = null;
  function limparImpressao() {
    raiz.document.body.classList.remove('imprime-plano');
    if (tituloAntes !== null) { raiz.document.title = tituloAntes; tituloAntes = null; }
  }
  function preparar(opts, pronto) {
    var doc = raiz.document, alvo = doc.getElementById('plano');
    var D = raiz.DiagnosticoLG2;
    var seguir = function () {
      carregarFontes(opts.modulos, function (fontes) {
        var r;
        try {
          r = montarHTML({ modulos: opts.modulos, dados: function (n) { return raiz['MODULO' + n] || null; }, fontes: fontes, nome: opts.nome, hoje: opts.hoje });
        } catch (e) { if (raiz.console) console.warn('plano:', e); pronto(null); return; }
        alvo.innerHTML = r.html;
        alvo.setAttribute('data-pronto', '1');
        pronto(r);
      });
    };
    if (D && D.carregarDados) D.carregarDados(opts.modulos, seguir); else seguir();
  }
  function imprimir(opts) {
    opts = opts || {};
    var bt = opts.botao, rotulo = bt ? bt.textContent : '';
    if (bt) { bt.disabled = true; bt.setAttribute('aria-busy', 'true'); bt.textContent = 'Preparando o plano…'; }
    preparar(opts, function (r) {
      if (bt) { bt.disabled = false; bt.removeAttribute('aria-busy'); bt.textContent = rotulo; }
      if (!r) { if (opts.aviso) opts.aviso('Não conseguimos montar o plano agora. Tente de novo; suas respostas continuam salvas.'); return; }
      raiz.document.body.classList.add('imprime-plano');
      if (tituloAntes === null) tituloAntes = raiz.document.title;
      raiz.document.title = 'Plano de negócio' + (r.negocio ? ' - ' + r.negocio : '');
      setTimeout(function () { raiz.print(); }, 60);
    });
  }
  if (typeof window !== 'undefined' && raiz.addEventListener) raiz.addEventListener('afterprint', limparImpressao);

  var API = { indicadores: indicadores, montarHTML: montarHTML, imprimir: imprimir, preparar: preparar, limparImpressao: limparImpressao, carregarFontes: carregarFontes,
    brl: brl, AVISO: AVISO, TITULOS: TITULOS };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  raiz.PlanoNegocio = API;
})(typeof window !== 'undefined' ? window : globalThis);
