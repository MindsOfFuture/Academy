/* Progresso da jornada guardado na conta.
   As respostas dos módulos ficam no navegador (chaves "lg2-*"). Este arquivo mantém uma cópia
   delas na conta da pessoa, para ela parar quando quiser e continuar em outro aparelho.
   - Ao abrir a jornada, ANTES do primeiro módulo, busca a cópia da conta (espera no máximo 4 s;
     sem resposta, segue só com o que está no aparelho).
   - Depois de uma combinação segura, envia mudanças automaticamente (a cada 5 s e ao sair da página).
   - Se o mesmo módulo diverge entre aparelho e conta, mantém as duas cópias e pede escolha em "Salvar e sair".
   - O mesmo arquivo vai em cada módulo. Dentro da jornada (módulo no iframe) o módulo usa a cópia
     da jornada, sem abrir outra conexão. Fora da jornada, se a conta restaurar respostas, a página recarrega uma vez.
   - salvar() aguarda confirmação da conta; nunca confirma envio de respostas locais sem vínculo sem escolha explícita.
   Fora do site (arquivo local, localhost) não envia nada, como o js/metricas.js.
   A regra de conflito está em mesclar(), função pura testada à parte. */
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

  function temChaves(o) { return !!o && typeof o === 'object' && Object.keys(o).length > 0; }

  /* Decide o que fazer ao abrir a jornada.
     Quando há progresso nos dois lados e os dados divergem, não há timestamp local confiável
     para escolher vencedor: preserve ambos e aguarde uma escolha explícita.
     Devolve { limpar, gravar, enviar, confirmar, marcador }:
       limpar    = apagar LG2 local de outra conta;
       gravar    = copiar da conta para o aparelho;
       enviar    = sincronização inicial segura;
       confirmar = há progresso local sem vínculo ou conflito com a conta;
       marcador  = conta associada ao aparelho. */
  function mesclar(local, servidor, marcador, usuario) {
    var dadosServ = servidor && servidor.dados && typeof servidor.dados === 'object' && !Array.isArray(servidor.dados) ? servidor.dados : null;
    var marca = marcador && typeof marcador === 'object' && marcador.u ? marcador : null;
    var outraPessoa = !!marca && marca.u !== usuario;
    var localTem = temChaves(local);
    var servidorTem = temChaves(dadosServ);
    var novoMarcador = { u: usuario, em: servidor && servidor.atualizado_em || (marca && marca.u === usuario ? marca.em : null) };

    if (outraPessoa) {
      return { limpar: true, gravar: servidorTem ? dadosServ : null, enviar: false, confirmar: false,
        marcador: { u: usuario, em: servidor && servidor.atualizado_em || null } };
    }
    if (localTem && servidorTem) {
      var colisao = Object.keys(local).some(function (k) {
        return Object.prototype.hasOwnProperty.call(dadosServ, k) && local[k] !== dadosServ[k];
      });
      if (colisao) {
        return { limpar: false, gravar: null, enviar: false, confirmar: true, marcador: novoMarcador };
      }
      var combinado = {};
      Object.keys(dadosServ).forEach(function (k) { combinado[k] = dadosServ[k]; });
      Object.keys(local).forEach(function (k) { combinado[k] = local[k]; });
      return { limpar: false, gravar: serializar(combinado) === serializar(local) ? null : combinado,
        enviar: false, confirmar: false, marcador: novoMarcador };
    }
    if (localTem) {
      return { limpar: false, gravar: null, enviar: false, confirmar: true, marcador: novoMarcador };
    }
    if (servidorTem) {
      return { limpar: false, gravar: dadosServ, enviar: false, confirmar: false, marcador: novoMarcador };
    }
    return { limpar: false, gravar: null, enviar: false, confirmar: false, marcador: novoMarcador };
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

  // Módulo dentro da jornada: usa a cópia da jornada (mesmo site, mesmo aparelho).
  function daJornada(win) {
    try {
      if (win.parent && win.parent !== win && win.parent.LG2Progresso && win.parent.location.origin === win.location.origin) return win.parent.LG2Progresso;
    } catch (e) {}
    return null;
  }

  function iniciar(win, recarregar) {
    var pai = daJornada(win);
    if (pai) return pai;
    var ls;
    try { ls = win.localStorage; } catch (e) { ls = null; }
    var api = {
      mesclar: mesclar, ativo: false, pronto: Promise.resolve(false),
      needsConfirmation: false, contaTemDados: false,
      enviarAgora: function () { return false; },
      salvar: function () { return Promise.resolve(false); },
      usarConta: function () { return Promise.resolve(false); }
    };
    if (!ls || !noSite(win.location) || typeof win.fetch !== 'function') return api;

    var usuario = null;
    var ultimo = null; // texto do último estado que a conta tem
    var dadosConta = {};
    var dataConta = null;
    var enviando = false;
    var emCurso = null; // promessa do envio em andamento

    // Manda a cópia para a conta. Devolve uma promessa: true = a conta tem o estado atual.
    function enviar(aoSair, forcar) {
      if (!usuario || (api.needsConfirmation && !forcar)) return Promise.resolve(false);
      if (enviando) {
        if (!forcar) return emCurso || Promise.resolve(false);
        return (emCurso || Promise.resolve(false)).then(function () { return enviar(aoSair, true); });
      }
      var dados = coletar(ls);
      var txt = serializar(dados);
      if (txt === ultimo && !forcar) return Promise.resolve(true);
      var corpo = JSON.stringify({ dados: dados });
      if (corpo.length > LIMITE_BYTES) return Promise.resolve(false);
      var opcoes = { method: 'PUT', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: corpo };
      if (aoSair && corpo.length < LIMITE_KEEPALIVE) opcoes.keepalive = true;
      enviando = true;
      var anterior = ultimo;
      ultimo = txt; // evita mandar o mesmo de novo enquanto a resposta não chega
      function confirmar(j) {
        api.needsConfirmation = false;
        api.contaTemDados = temChaves(dados);
        if (j && j.atualizado_em) dataConta = j.atualizado_em;
        gravarMarca(ls, { u: usuario, em: dataConta });
        return true;
      }
      try {
        emCurso = win.fetch(ENDERECO, opcoes).then(function (r) {
          if (!r || !r.ok) { enviando = false; emCurso = null; if (ultimo === txt) ultimo = anterior; return false; }
          return Promise.resolve().then(function () { return r.json ? r.json() : null; }).then(confirmar, function () { return confirmar(null); });
        }).catch(function () { if (ultimo === txt) ultimo = anterior; return false; }).then(function (ok) {
          enviando = false; emCurso = null; return ok;
        });
      } catch (e) { enviando = false; emCurso = null; ultimo = anterior; return Promise.resolve(false); }
      return emCurso;
    }

    api.ativo = true;
    api.enviarAgora = function () { if (api.needsConfirmation) return false; enviar(false); return !!usuario; };
    // O conflito só é resolvido após confirmação explícita. Conta-only modules are preserved on merge.
    api.salvar = function (confirmar) {
      return api.pronto.then(function (ok) {
        if (!ok || (api.needsConfirmation && !confirmar)) return false;
        if (api.needsConfirmation) {
          Object.keys(dadosConta).forEach(function (k) {
            if (k.indexOf('lg2-') === 0 && k !== MARCA && typeof dadosConta[k] === 'string' && ls.getItem(k) === null) {
              try { ls.setItem(k, dadosConta[k]); } catch (e) {}
            }
          });
        }
        return enviar(false, true);
      });
    };
    api.usarConta = function () {
      return api.pronto.then(function (ok) {
        if (!ok || !api.needsConfirmation || !api.contaTemDados) return false;
        limparLocal(ls);
        Object.keys(dadosConta).forEach(function (k) {
          if (k.indexOf('lg2-') === 0 && k !== MARCA && typeof dadosConta[k] === 'string') {
            try { ls.setItem(k, dadosConta[k]); } catch (e) {}
          }
        });
        gravarMarca(ls, { u: usuario, em: dataConta });
        ultimo = serializar(dadosConta);
        api.needsConfirmation = false;
        return true;
      });
    };
    api.pronto = buscar(win.fetch.bind(win)).then(function (serv) {
      usuario = serv.u;
      dadosConta = serv && serv.dados && typeof serv.dados === 'object' && !Array.isArray(serv.dados) ? serv.dados : {};
      dataConta = serv && serv.atualizado_em || null;
      var d = mesclar(coletar(ls), serv, lerMarca(ls), usuario);
      api.needsConfirmation = d.confirmar;
      api.contaTemDados = temChaves(dadosConta);
      var antes = recarregar ? serializar(coletar(ls)) : null;
      if (d.limpar) limparLocal(ls);
      if (d.gravar) {
        Object.keys(d.gravar).forEach(function (k) {
          if (k.indexOf('lg2-') === 0 && k !== MARCA && typeof d.gravar[k] === 'string') {
            try { ls.setItem(k, d.gravar[k]); } catch (e) {}
          }
        });
      }
      gravarMarca(ls, d.marcador);
      ultimo = serializar(dadosConta);
      if (d.enviar) enviar(false);
      // Módulo aberto sozinho: a tela já foi montada com o que havia no aparelho. Se a conta trouxe
      // outra coisa, recarrega uma vez (no máximo a cada 30 s) para a pessoa ver as respostas da conta.
      if (recarregar && serializar(coletar(ls)) !== antes) {
        var agora = Date.now(), ultima = 0;
        try { ultima = Number(win.sessionStorage.getItem('lg2-recarregou')) || 0; } catch (e) {}
        if (agora - ultima > 30000) {
          try { win.sessionStorage.setItem('lg2-recarregou', String(agora)); } catch (e) {}
          win.location.reload();
          return true;
        }
      }
      win.setInterval(function () { enviar(false); }, INTERVALO_MS);
      win.document.addEventListener('visibilitychange', function () { if (win.document.visibilityState === 'hidden') enviar(true); });
      win.addEventListener('pagehide', function () { enviar(true); });
      return true;
    }).catch(function () { return false; }); // sem conexão ou sem login: segue só com o aparelho
    return api;
  }

  if (typeof window !== 'undefined') {
    var eu = typeof document !== 'undefined' ? document.currentScript : null;
    window.LG2Progresso = iniciar(window, !!(eu && eu.hasAttribute('data-recarregar')));
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { mesclar: mesclar, serializar: serializar };
})();
