/* Diagnóstico final da jornada: o cenário atual (resumo do negócio) + todas as respostas guardadas
   neste aparelho, módulo por módulo, em português legível. Só lê; nunca grava nas chaves dos módulos.
   Os textos das perguntas vêm dos próprios dados de cada módulo (dados/moduloN.js), carregados na hora
   em que o diagnóstico abre: se um grupo mudar um texto ou a ordem, o diagnóstico acompanha sozinho. */
(function (raiz) {
  'use strict';

  var CHAVES = { 1: 'lg2-turma-a-m01', 2: 'lg2-turma-b-m02', 3: 'lg2-turma-a-m03', 4: 'lg2-turma-a-m04', 5: 'lg2-turma-a-m05',
    6: 'lg2-turma-b-m06', 7: 'lg2-turma-b-m07', 8: 'lg2-turma-b-m08', 9: 'lg2-turma-b-m09', 10: 'lg2-turma-b-m10' };

  /* Perguntas que o app criou fora da planilha (não estão em dados/moduloN.js): texto e lugar na ordem. */
  var EXTRAS = {
    5: [{ codigo: 'M5.PG', pergunta: 'Quais formas de pagamento você aceita?', antes: 'M5.P24' }],
    6: [{ codigo: 'Negócio', pergunta: 'O que você oferece: produto, mercadoria ou serviço?', antes: 'M6.P01' }]
  };
  /* Telas que só confirmam o resultado ("Este é o retrato... Está certo?") e respostas repetidas de outro módulo. */
  var FORA = { 'M5.P00': 1, 'M7-13': 1, 'M9-14': 1, 'M10-12': 1 };

  function lerLocal(n) { try { return JSON.parse(raiz.localStorage.getItem(CHAVES[n])) || null; } catch (e) { return null; } }

  /* ---------- números ---------- */
  function num(v) {
    if (v === null || v === undefined || v === '') return null;
    if (typeof v === 'number') return isFinite(v) ? v : null;
    var s = String(v).trim().replace(/[R$\s%]/g, '');
    if (!s) return null;
    if (s.indexOf(',') >= 0 || /^[1-9]\d{0,2}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '').replace(',', '.');
    var n = Number(s);
    return isFinite(n) && /^-?[\d.]+$/.test(s) ? n : null;
  }
  function nf(n) { return Number(n).toLocaleString('pt-BR', { maximumFractionDigits: 2 }); }
  function brl(n) {
    var r = Math.round(n * 100) / 100;
    return 'R$ ' + r.toLocaleString('pt-BR', { minimumFractionDigits: r % 1 ? 2 : 0, maximumFractionDigits: 2 });
  }
  /* número digitado: vira número formatado; texto que não é número fica como está */
  function numTxt(v, dinheiro) {
    var n = num(v);
    if (n === null) return limpo(v);
    return dinheiro ? brl(n) : nf(n);
  }
  function horas(h, m) {
    h = num(h) || 0; m = num(m) || 0;
    if (m >= 60) { h += Math.floor(m / 60); m = m % 60; }
    var p = [];
    if (h) p.push(nf(h) + (h === 1 ? ' hora' : ' horas'));
    if (m) p.push(nf(m) + (m === 1 ? ' minuto' : ' minutos'));
    return p.length ? p.join(' e ') : '0 minuto';
  }
  function juntar(xs) {
    xs = xs.filter(function (x) { return x !== null && x !== undefined && String(x).trim() !== ''; });
    return xs.length < 2 ? xs.join('') : xs.slice(0, -1).join(', ') + ' e ' + xs[xs.length - 1];
  }
  function limpo(v) { return String(v === null || v === undefined ? '' : v).replace(/\s+/g, ' ').trim(); }
  /* resposta que é só "Não sei" (opção inteira, não o começo de outra frase como "Ainda não sei fazer direito") */
  var NS = /^(não sei|nao sei|ainda não sei|ainda não defini)( \/ não sei)?\.?$/i;

  /* ---------- texto da pergunta ---------- */
  function contexto(ler) {
    var r1 = (ler(1) || {}).R || {}, e7 = ler(7) || {}, e10 = ler(10) || {};
    var i7 = e7.ini || {}, i10 = e10.ini || {};
    var txt = function (r) { return r && (r.estado === 'valor' || r.estado === 'opcao') && typeof (r.valor || r.opcao) === 'string' && !NS.test(r.valor || r.opcao) ? limpo(r.valor || r.opcao) : ''; };
    var oferta = limpo(i7.oferta) || limpo(i10.oferta) || txt(r1['M1.P03']);
    var tipo = limpo(i7.tipo) || txt(r1['M1.P03A']);
    var verbo = /^servi/i.test(tipo) ? 'atender' : /^mercadoria/i.test(tipo) ? 'separar e entregar' : 'fazer';
    return { oferta: oferta, verbo: verbo, canais: limpo(i10.canais).toLowerCase(), ideia: txt(r1['M1.P01']) === 'Ainda está só na minha cabeça' };
  }
  function textoPergunta(p, ctx) {
    var t = p.variantes && p.variantes.ideia && ctx.ideia && p.variantes.ideia.pergunta ? p.variantes.ideia.pergunta : p.pergunta;
    var s = limpo(t).replace(/\s*\(Ex\.?:[^)]*\)/g, '');
    var mapa = {
      '[Oferta em foco]': ctx.oferta || 'O que você vende', '[oferta em foco]': ctx.oferta || 'o que você vende',
      '[fazer/atender]': ctx.verbo, '[fazer]': ctx.verbo, '[canais de venda]': ctx.canais || 'onde você vende'
    };
    Object.keys(mapa).forEach(function (k) { s = s.split(k).join(mapa[k]); });
    s = s.replace(/\[([^\]]*)\]/g, '$1').replace(/\s+([.,?])/g, '$1').replace(/\s{2,}/g, ' ').trim();
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  /* ---------- resposta ---------- */
  function ehDinheiro(p) {
    var tipo = String(p.tipo || ''), q = String(p.pergunta || '');
    return /R\$/.test(tipo) || (/^Número$/i.test(tipo) && /reais|gastar|faturar|vender em um mês|dinheiro|valor estimado/i.test(q));
  }
  function comDetalhe(op, det) {
    op = limpo(op); det = limpo(det);
    if (!det) return op;
    return /^outr[oa]s?\b/i.test(op) ? 'Outro: ' + det : op + ': ' + det;
  }
  function lista(ops, det, outro) {
    var xs = (ops || []).map(function (o) { return /^outr[oa]s?\b/i.test(o) && det ? 'Outro: ' + limpo(det) : limpo(o); });
    if (outro && limpo(outro)) xs.push('Outro: ' + limpo(outro));
    return juntar(xs);
  }
  /* objeto ou lista sem formato conhecido: só os textos, nunca a estrutura */
  function folhas(v) {
    if (v === null || v === undefined) return [];
    if (typeof v !== 'object') return [limpo(v)];
    var out = [];
    (Array.isArray(v) ? v : Object.keys(v).map(function (k) { return v[k]; })).forEach(function (x) { out = out.concat(folhas(x)); });
    return out.filter(Boolean);
  }
  function campos(o) {
    return Object.keys(o || {}).filter(function (k) { return limpo(o[k]); }).map(function (k) { return k + ': ' + limpo(o[k]); }).join('; ');
  }
  function unidade(x) {
    if (!x || num(x.q) === null) return limpo(x && x.q);
    var u = limpo(x.u);
    if (u === 'unidade' && num(x.q) !== 1) u = 'unidades';
    return nf(num(x.q)) + (u ? ' ' + u : '');
  }

  /* Devolve o texto da resposta, '' quando não há resposta, ou 'Não sei'. */
  function formatar(r, p, est) {
    if (!r || typeof r !== 'object') return r === null || r === undefined ? '' : limpo(r);
    var R = (est && est.R) || {}, cod = p.codigo;
    switch (r.estado) {
      case 'naosei': return 'Não sei';
      case 'vazio': case 'vazia': case 'naoaplica': return '';
      case 'opcao': {
        if (NS.test(limpo(r.opcao))) return 'Não sei';
        var t = Array.isArray(r.opcoes) && r.opcoes.length > 1 ? lista(r.opcoes, r.detalhe) : comDetalhe(r.opcao, r.detalhe);
        if (r.campos && campos(r.campos)) t += ' (' + campos(r.campos) + ')';
        if (num(r.horas) > 0) t += ', cerca de ' + horas(r.horas, 0) + ' por semana';
        if (cod === 'M7-01' && Array.isArray(est.mapa) && est.mapa.length) t += '. Etapas: ' + juntar(est.mapa.map(limpo));
        return t;
      }
      case 'opcoes': case 'multi':
        if (r.naosei && !(r.opcoes || []).length && !r.outro) return 'Não sei';
        return lista(r.opcoes, r.detalhe, r.outro);
      case 'partes':
        return [limpo(r.p1), limpo(r.p2) + (num(r.dias) ? ' (' + nf(num(r.dias)) + ' dias)' : '')].filter(Boolean).join('; ');
      case 'etapas': {
        var por = {};
        Object.keys(r.quem || {}).forEach(function (et) { var q = limpo(r.quem[et]); if (q) (por[q] = por[q] || []).push(et); });
        return Object.keys(por).map(function (q) { return q + ': ' + juntar(por[q]).toLowerCase(); }).join('; ');
      }
      case 'escala':
        return Object.keys(r.u || {}).map(function (k) { return limpo(k) + ': ' + limpo(r.u[k]); }).join('; ');
      case 'plano':
        return limpo(r.frase) || folhas([r.acao, r.sinal]).join('; ');
      case 'valor': break;
      default: return folhas(r).filter(function (x) { return x !== r.estado; }).join('; ');
    }
    /* estado "valor" */
    if (r.texto !== undefined && r.valor === undefined && r.h === undefined && r.campos === undefined) return limpo(r.texto);
    if (r.campos && r.valor === undefined) return campos(r.campos);
    if (r.h !== undefined || r.m !== undefined) {
      var tt = horas(r.h, r.m);
      if (r.minVez !== undefined) return nf(num(r.un) || 0) + ' por vez, ' + tt + ' cada vez';
      return tt + (num(r.un) > 1 ? ' para ' + nf(num(r.un)) + ' unidades' : '');
    }
    var v = r.valor, din = ehDinheiro(p);
    if (v === null || v === undefined) return '';
    if (typeof v === 'string' || typeof v === 'number') {
      if (NS.test(limpo(v))) return 'Não sei';
      if (/R\$/.test(String(v))) return limpo(v);
      var numerico = din || /n[uú]mero|R\$|percent/i.test(String(p.tipo || '')) || /m²/.test(String(p.pergunta || ''));
      var s = numerico && num(v) !== null ? numTxt(v, din) : limpo(v);
      if (numerico && num(v) !== null && /%|Percentual/i.test(String(p.tipo))) s += '%';
      if (numerico && num(v) !== null && /quantos dias/i.test(p.pergunta)) s += ' dias';
      if (numerico && num(v) !== null && /m²/.test(p.pergunta)) s += ' m²';
      return s;
    }
    if (Array.isArray(v)) {
      var nomes = (cod === 'M5.P04' || cod === 'M5.P05' || cod === 'M5.P06') ? (R['M5.P03'] || {}).valor
        : (cod === 'M5.P20' || cod === 'M5.P21' || cod === 'M5.P22') ? (R['M5.P19'] || {}).valor : null;
      var rot = function (i, t) { return Array.isArray(nomes) && limpo(nomes[i]) ? limpo(nomes[i]) + ': ' + t : t; };
      var partes = v.map(function (x, i) {
        if (x === null || x === undefined) return '';
        if (typeof x !== 'object') return rot(i, din ? numTxt(x, true) : limpo(x));
        if (x.q !== undefined) return rot(i, unidade(x));
        if (x.forma !== undefined) {
          var f = limpo(x.forma), d = [];
          if (num(x.taxa) !== null) d.push('taxa de ' + nf(num(x.taxa)) + '%');
          if (num(x.parte) !== null) d.push(nf(num(x.parte)) + '% das vendas');
          if (num(x.prazo) !== null) d.push('recebe em ' + nf(num(x.prazo)) + (num(x.prazo) === 1 ? ' dia' : ' dias'));
          return d.length ? f + ' (' + d.join(', ') + ')' : f;
        }
        if (x.nome !== undefined) return limpo(x.nome) + (num(x.v) !== null ? ': ' + brl(num(x.v)) : '');
        return folhas(x).join(' ');
      }).filter(Boolean);
      return Array.isArray(nomes) || v.some(function (x) { return x && typeof x === 'object'; }) ? partes.join('; ') : juntar(partes);
    }
    if (typeof v === 'object') {
      if (v.preco !== undefined || v.qtd !== undefined) {
        return (num(v.preco) !== null ? brl(num(v.preco)) : limpo(v.preco)) + (num(v.qtd) ? ' por ' + nf(num(v.qtd)) + (num(v.qtd) === 1 ? ' unidade' : ' unidades') : '');
      }
      if (v.h !== undefined || v.m !== undefined) return horas(v.h, v.m);
      return folhas(v).join('; ');
    }
    return limpo(v);
  }

  /* ---------- montagem ---------- */
  function perguntasDe(n, dados) {
    var ps = ((dados && dados.perguntas) || []).filter(function (p) { return p && p.codigo; });
    var extras = EXTRAS[n] || [];
    if (n === 10 && dados && dados.socio && dados.socio.pergunta) extras = extras.concat([{ codigo: 'SOCIO', pergunta: dados.socio.pergunta, antes: 'M10-06' }]);
    var out = [];
    ps.forEach(function (p) {
      extras.filter(function (x) { return x.antes === p.codigo; }).forEach(function (x) { out.push(x); });
      out.push(p);
    });
    extras.filter(function (x) { return !ps.some(function (p) { return p.codigo === x.antes; }); }).forEach(function (x) { out.push(x); });
    return out;
  }

  /* modulos: [{n, nome, situacao: 'feito'|'andamento'|'nada'}]; dados(n) = window.MODULOn; ler(n) = estado salvo */
  function montar(modulos, dados, ler) {
    ler = ler || lerLocal;
    var ctx = contexto(ler);
    var abertos = [];
    var blocos = modulos.map(function (m) {
      var est = ler(m.n) || {}, R = est.R || {};
      var itens = [];
      perguntasDe(m.n, dados(m.n)).forEach(function (p) {
        if (FORA[p.codigo] || !(p.codigo in R)) return;
        var resp = formatar(R[p.codigo], p, est);
        if (!resp) return;
        var q = textoPergunta(p, ctx);
        itens.push({ codigo: p.codigo, pergunta: q, resposta: resp });
        if (resp === 'Não sei') abertos.push({ modulo: m.n, pergunta: q });
      });
      return { n: m.n, nome: m.nome, situacao: m.situacao, itens: itens };
    });
    return { blocos: blocos, abertos: abertos };
  }

  /* carrega dados/moduloN.js de cada módulo (uma vez); chama pronto() mesmo se algum falhar */
  var carregados = {};
  function carregarDados(modulos, pronto) {
    var falta = modulos.filter(function (m) { return m.caminho && !raiz['MODULO' + m.n] && !carregados[m.n]; });
    var resta = falta.length;
    if (!resta) { pronto(); return; }
    falta.forEach(function (m) {
      carregados[m.n] = true;
      var s = raiz.document.createElement('script');
      s.src = m.caminho.replace(/index\.html$/, '') + 'dados/modulo' + m.n + '.js';
      s.onload = s.onerror = function () { if (--resta === 0) pronto(); };
      raiz.document.head.appendChild(s);
    });
  }

  var API = { formatar: formatar, textoPergunta: textoPergunta, montar: montar, carregarDados: carregarDados, perguntasDe: perguntasDe, horas: horas, brl: brl };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  raiz.DiagnosticoLG2 = API;
})(typeof window !== 'undefined' ? window : globalThis);
