/* Progresso da jornada guardado na conta.
   As respostas dos módulos ficam no navegador (chaves "lg2-*"). Este arquivo mantém uma cópia
   delas na conta da pessoa, para ela parar quando quiser e continuar em outro aparelho.
   - Ao abrir a jornada, ANTES do primeiro módulo, busca a cópia da conta (espera no máximo 4 s;
     sem resposta, segue só com o que está no aparelho).
   - Depois, sempre que algo muda, manda a cópia nova (confere a cada 5 s e ao sair da página).
   Fora do site (arquivo local, localhost) não envia nada, como o js/metricas.js.
   A regra de quem ganha (aparelho ou conta) está em mesclar(), função pura testada à parte. */
(function () {
  'use strict';
  var ENDERECO = '/api/lg2/progresso';
  var MARCA = 'lg2-sync';
  var ESPERA_MS = 4000;
  var INTERVALO_MS = 5000;
  var LIMITE_BYTES = 500 * 1024;
  var LIMITE_KEEPALIVE = 60 * 1024; // o navegador recusa envio "ao sair" acima de ~64 KB

  function noSite(loc) {
    try {
      if (loc.protocol !== 'https:' && loc.protocol !== 'http:') return false;
      return !/^(localhost|127\.|0\.0\.0\.0$|\[::1\]$|::1$)|\.localhost$/.test(loc.hostname);
    } catch (e) { return false; }
  }

  function tempo(t) { var n = Date.parse(t || ''); return isNaN(n) ? -Infinity : n; }
  function temChaves(o) { return !!o && typeof o === 'object' && Object.keys(o).length > 0; }

  /* Decide o que fazer ao abrir a jornada.
     local: { 'lg2-…': texto } do aparelho (sem a marca); servidor: { dados, atualizado_em } ou null;
     marcador: { u, em } guardado na última sincronização ou null; usuario: id devolvido pela conta.
     Devolve { limpar, gravar, enviar, marcador }:
       limpar  = apagar as chaves lg2-* do aparelho antes (outra pessoa usou este navegador);
       gravar  = objeto a escrever no aparelho (vem da conta) ou null;
       enviar  = mandar já o que está no aparelho para a conta (primeiro acesso com progresso antigo);
       marcador = novo valor da marca. */
  function mesclar(local, servidor, marcador, usuario) {
    var dadosServ = servidor && servidor.dados && typeof servidor.dados === 'object' && !Array.isArray(servidor.dados) ? servidor.dados : null;
    var marca = marcador && typeof marcador === 'object' && marcador.u ? marcador : null;
    var outraPessoa = !!marca && marca.u !== usuario;
    if (temChaves(dadosServ)) {
      var maisNovo = !marca || outraPessoa || tempo(servidor.atualizado_em) > tempo(marca.em);
      if (maisNovo) {
        return { limpar: outraPessoa, gravar: dadosServ, enviar: false, marcador: { u: usuario, em: servidor.atualizado_em || null } };
      }
      return { limpar: false, gravar: null, enviar: false, marcador: { u: usuario, em: marca.em } };
    }
    if (temChaves(local)) {
      // Conta vazia e aparelho com respostas: se são da mesma pessoa (ou de antes do login), sobem;
      // se são de outra pessoa, saem do aparelho.
      if (outraPessoa) return { limpar: true, gravar: null, enviar: false, marcador: { u: usuario, em: null } };
      return { limpar: false, gravar: null, enviar: true, marcador: { u: usuario, em: marca ? marca.em : null } };
    }
    return { limpar: false, gravar: null, enviar: false, marcador: { u: usuario, em: marca ? marca.em : null } };
  }

  // Texto estável (chaves em ordem) para comparar se algo mudou.
  function serializar(o) {
    var ks = Object.keys(o || {}).sort();
    var out = {};
    ks.forEach(function (k) { out[k] = o[k]; });
    return JSON.stringify(out);
  }

  function coletar(ls) {
    var o = {};
    try {
      for (var i = 0; i < ls.length; i++) {
        var k = ls.key(i);
        if (k && k.indexOf('lg2-') === 0 && k !== MARCA) o[k] = ls.getItem(k);
      }
    } catch (e) {}
    return o;
  }
  function limparLocal(ls) {
    try {
      var ks = [];
      for (var i = 0; i < ls.length; i++) { var k = ls.key(i); if (k && k.indexOf('lg2-') === 0) ks.push(k); }
      ks.forEach(function (k) { ls.removeItem(k); });
    } catch (e) {}
  }
  function lerMarca(ls) {
    try { var m = JSON.parse(ls.getItem(MARCA) || 'null'); return m && typeof m === 'object' ? m : null; } catch (e) { return null; }
  }
  function gravarMarca(ls, m) { try { ls.setItem(MARCA, JSON.stringify(m)); } catch (e) {} }

  function buscar(f) {
    return new Promise(function (resolve, reject) {
      var ctrl = typeof AbortController === 'function' ? new AbortController() : null;
      var timer = setTimeout(function () { if (ctrl) ctrl.abort(); reject(new Error('tempo')); }, ESPERA_MS);
      f(ENDERECO, { method: 'GET', credentials: 'same-origin', cache: 'no-store', headers: { Accept: 'application/json' }, signal: ctrl ? ctrl.signal : undefined })
        .then(function (r) {
          if (!r || !r.ok) throw new Error('status');
          return r.json();
        })
        .then(function (j) { clearTimeout(timer); if (!j || !j.u) throw new Error('sem usuário'); resolve(j); })
        .catch(function (e) { clearTimeout(timer); reject(e); });
    });
  }

  function iniciar(win) {
    var ls;
    try { ls = win.localStorage; } catch (e) { ls = null; }
    var api = { mesclar: mesclar, ativo: false, pronto: Promise.resolve(false), enviarAgora: function () { return false; } };
    if (!ls || !noSite(win.location) || typeof win.fetch !== 'function') return api;

    var usuario = null;
    var ultimo = null; // texto do último estado que a conta tem
    var enviando = false;

    function enviar(aoSair) {
      if (!usuario) return false;
      var dados = coletar(ls);
      var txt = serializar(dados);
      if (txt === ultimo || (enviando && !aoSair)) return false;
      var corpo = JSON.stringify({ dados: dados });
      if (corpo.length > LIMITE_BYTES) return false;
      var opcoes = { method: 'PUT', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: corpo };
      if (aoSair && corpo.length < LIMITE_KEEPALIVE) opcoes.keepalive = true;
      enviando = true;
      var anterior = ultimo;
      ultimo = txt; // evita mandar o mesmo de novo enquanto a resposta não chega
      try {
        win.fetch(ENDERECO, opcoes).then(function (r) {
          enviando = false;
          if (!r || !r.ok) { if (ultimo === txt) ultimo = anterior; return null; }
          return r.json().then(function (j) {
            if (j && j.atualizado_em) gravarMarca(ls, { u: usuario, em: j.atualizado_em });
          });
        }).catch(function () { enviando = false; if (ultimo === txt) ultimo = anterior; });
      } catch (e) { enviando = false; ultimo = anterior; return false; }
      return true;
    }

    api.ativo = true;
    api.enviarAgora = function () { return enviar(false); };
    api.pronto = buscar(win.fetch.bind(win)).then(function (serv) {
      usuario = serv.u;
      var d = mesclar(coletar(ls), serv, lerMarca(ls), usuario);
      if (d.limpar) limparLocal(ls);
      if (d.gravar) {
        Object.keys(d.gravar).forEach(function (k) {
          if (k.indexOf('lg2-') === 0 && k !== MARCA && typeof d.gravar[k] === 'string') {
            try { ls.setItem(k, d.gravar[k]); } catch (e) {}
          }
        });
      }
      gravarMarca(ls, d.marcador);
      ultimo = serializar(serv && serv.dados && typeof serv.dados === 'object' ? serv.dados : {});
      if (d.enviar) enviar(false);
      win.setInterval(function () { enviar(false); }, INTERVALO_MS);
      win.document.addEventListener('visibilitychange', function () { if (win.document.visibilityState === 'hidden') enviar(true); });
      win.addEventListener('pagehide', function () { enviar(true); });
      return true;
    }).catch(function () { return false; }); // sem conexão ou sem login: segue só com o aparelho
    return api;
  }

  if (typeof window !== 'undefined') window.LG2Progresso = iniciar(window);
  if (typeof module !== 'undefined' && module.exports) module.exports = { mesclar: mesclar, serializar: serializar };
})();
