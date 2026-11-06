/* Métricas de uso do Laboratório de Gestão.
   Avisa ao site que o módulo foi aberto e que chegou ao fim. Só o número do módulo sai daqui:
   nenhuma resposta, nome ou texto da pessoa. Fora do site (arquivo local, localhost) não envia nada.
   Arquivo igual em todos os módulos e na jornada; o número vem de data-modulo no <script>. */
(function () {
  'use strict';
  var ENDERECO = '/api/telemetry/events';
  var CHAVE_SESSAO = 'lg2-metricas-sessao';
  var ROTA_MODULO = '/lg2';

  function noSite(loc) {
    try {
      if (loc.protocol !== 'https:' && loc.protocol !== 'http:') return false;
      return !/^(localhost|127\.|0\.0\.0\.0$|\[::1\]$|::1$)|\.localhost$/.test(loc.hostname);
    } catch { return false; }
  }

  function uuid() {
    var c = window.crypto;
    if (c && typeof c.randomUUID === 'function') return c.randomUUID();
    var b = new Uint8Array(16);
    if (c && c.getRandomValues) c.getRandomValues(b);
    else for (var i = 0; i < 16; i++) b[i] = Math.floor(Math.random() * 256);
    b[6] = (b[6] & 0x0f) | 0x40; b[8] = (b[8] & 0x3f) | 0x80;
    var h = Array.prototype.map.call(b, function (x) { return (x + 256).toString(16).slice(1); }).join('');
    return h.slice(0, 8) + '-' + h.slice(8, 12) + '-' + h.slice(12, 16) + '-' + h.slice(16, 20) + '-' + h.slice(20);
  }

  var sessaoAtual = null;
  function sessao() {
    if (sessaoAtual) return sessaoAtual;
    try {
      sessaoAtual = window.sessionStorage.getItem(CHAVE_SESSAO);
      if (!sessaoAtual) { sessaoAtual = uuid(); window.sessionStorage.setItem(CHAVE_SESSAO, sessaoAtual); }
    } catch { sessaoAtual = sessaoAtual || uuid(); }
    return sessaoAtual;
  }

  function enviar(evento, rota, metadata) {
    try {
      if (!noSite(window.location) || typeof window.fetch !== 'function') return false;
      var corpo = { events: [{
        eventId: uuid(),
        occurredAt: new Date().toISOString(),
        sessionId: sessao(),
        eventName: evento,
        route: rota,
        metadata: metadata || {}
      }] };
      var p = window.fetch(ENDERECO, {
        method: 'POST',
        credentials: 'same-origin',
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(corpo)
      });
      if (p && typeof p.catch === 'function') p.catch(function () {});
      return true;
    } catch { return false; }
  }

  function visivel(el) {
    try {
      for (var n = el; n && n.nodeType === 1; n = n.parentElement) {
        if (n.hidden) return false;
        var s = window.getComputedStyle(n);
        if (s.display === 'none' || s.visibility === 'hidden') return false;
      }
      return true;
    } catch { return false; }
  }

  window.LG2Metricas = { enviar: enviar, noSite: noSite };

  try {
    var script = document.currentScript;
    var modulo = Number(script && script.getAttribute('data-modulo'));
    if (!(modulo >= 1 && modulo <= 10 && Math.floor(modulo) === modulo)) return;

    enviar('lg2_module_opened', ROTA_MODULO, { modulo: modulo });

    var concluido = false;
    var observador = null;
    var conferir = function () {
      if (concluido) return;
      var caixas = document.querySelectorAll('.lg2-proximo');
      for (var i = 0; i < caixas.length; i++) {
        if (visivel(caixas[i])) {
          concluido = true;
          if (observador) observador.disconnect();
          enviar('lg2_module_completed', ROTA_MODULO, { modulo: modulo });
          return;
        }
      }
    };
    if (typeof window.MutationObserver === 'function' && document.body) {
      observador = new window.MutationObserver(conferir);
      observador.observe(document.body, {
        childList: true, subtree: true, attributes: true, attributeFilter: ['hidden', 'class', 'style']
      });
    }
    conferir();
  } catch { /* métricas nunca atrapalham o módulo */ }
})();
