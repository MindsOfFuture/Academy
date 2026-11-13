/* Botão "Falar" ao lado de cada resposta aberta do LG2.
   Arquivo idêntico nos 10 módulos (tests/unit/lg2/falar.test.ts confere).
   - Todo <textarea> visível ganha o botão; <input> de texto só com o atributo data-falar
     (o módulo marca os campos de texto livre; números, dinheiro e datas ficam de fora).
   - data-falar="nao" tira o botão de um campo.
   - O texto ouvido entra no fim do campo e dispara "input" e "change", para o módulo gravar.
   - Sem reconhecimento de voz, ou quando o navegador não deixa usar o microfone
     (comum no iPhone dentro da jornada), mostra como ditar pelo teclado. */
(function () {
  "use strict";
  if (window.LG2Falar) return;

  var MSG_IPHONE = "No iPhone, toque no campo e use o microfone do teclado para ditar.";
  var MSG_BLOQUEADO = "O navegador não deixou usar o microfone. Toque no cadeado ao lado do endereço do site, permita o microfone e tente de novo, ou escreva a resposta.";
  var MSG_SEM_VOZ = "Este navegador não ouve a voz aqui. Toque no campo e use o microfone do teclado para ditar, ou escreva a resposta.";
  var MSG_NADA = "Não ouvimos nada. Toque em falar e tente de novo, mais perto do microfone.";
  var MSG_OUTRO = "Não deu para ouvir agora. Você pode escrever a resposta.";
  var ROTULO = "Falar";
  var NOME = "Falar a resposta";
  var OUVINDO = "Ouvindo… toque para parar";
  var ICONE = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>';
  var ESCONDIDO = "[hidden], [aria-hidden='true'], .so-impressao, .print-only, .apenas-impressao, .imprimir-so";
  var NAO_TEXTO = /^(number|date|datetime-local|month|week|time|tel|email|url|password|search|range|color|checkbox|radio|hidden|file|submit|button|reset|image)$/i;

  var ALTURA_TECLADO = 560;     // área visível menor que isso, com o campo em foco = teclado aberto
  var botoes = new WeakMap();   // campo -> botão
  var ativo = null;             // { rec, campo, botao }

  function iphone() {
    var ua = navigator.userAgent || "";
    return /iPhone|iPad|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  }
  function Reconhecer() { return window.SpeechRecognition || window.webkitSpeechRecognition || null; }

  function estilo() {
    if (document.getElementById("lg2-falar-estilo")) return;
    var s = document.createElement("style");
    s.id = "lg2-falar-estilo";
    s.textContent =
      ".lg2-falar{display:inline-flex;align-items:center;gap:8px;min-height:44px;padding:8px 16px;margin:8px 0 0;" +
      "border:2px solid var(--m-purple,#684A97);border-radius:999px;background:#fff;color:var(--m-purple,#684A97);" +
      "font:inherit;font-size:16px;font-weight:700;line-height:1.2;cursor:pointer;-webkit-tap-highlight-color:transparent}" +
      ".lg2-falar:focus-visible{outline:3px solid var(--m-purple,#684A97);outline-offset:2px}" +
      ".lg2-falar.ouvindo{background:var(--m-purple,#684A97);color:#fff}" +
      ".lg2-falar[hidden],.lg2-falar-aviso[hidden]{display:none!important}" +
      ".lg2-falar-aviso{margin:6px 0 0;font-size:15px;line-height:1.4;color:#333}" +
      "@media print{.lg2-falar,.lg2-falar-aviso{display:none!important}}";
    (document.head || document.documentElement).appendChild(s);
  }

  function elegivel(c) {
    if (c.readOnly || c.disabled) return false;
    var f = c.getAttribute("data-falar");
    if (f === "nao") return false;
    if (c.tagName === "TEXTAREA") return true;
    if (c.tagName !== "INPUT" || f === null) return false;
    var tipo = c.getAttribute("type") || "text";
    if (NAO_TEXTO.test(tipo)) return false;
    var modo = c.getAttribute("inputmode") || "";
    return !/^(numeric|decimal|tel)$/i.test(modo);
  }
  function visivel(c) {
    if (c.closest(ESCONDIDO)) return false;
    return c.getClientRects().length > 0;
  }

  /* Com o teclado do celular aberto, o próprio teclado tem microfone: o botão sai da frente
     para o campo e o Continuar continuarem à vista. Volta quando o teclado fecha. */
  function tecladoAberto(c) {
    if (document.activeElement !== c) return false;
    var alto = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    return alto < ALTURA_TECLADO;
  }

  function aviso(campo, texto) {
    var b = botoes.get(campo);
    var av = b && b.nextElementSibling && b.nextElementSibling.classList.contains("lg2-falar-aviso") ? b.nextElementSibling : null;
    if (!texto) { if (av) av.hidden = true; return; }
    if (!av) {
      av = document.createElement("p");
      av.className = "lg2-falar-aviso";
      av.setAttribute("role", "status");
      (b || campo).insertAdjacentElement("afterend", av);
    }
    av.hidden = false;
    av.textContent = texto;
  }

  function dicaTeclado(campo) {
    aviso(campo, iphone() ? MSG_IPHONE : MSG_SEM_VOZ);
    try { campo.focus(); } catch (e) { /* nada */ }
  }

  function rotulo(botao, ouvindo) {
    botao.classList.toggle("ouvindo", ouvindo);
    botao.setAttribute("aria-pressed", ouvindo ? "true" : "false");
    botao.setAttribute("aria-label", ouvindo ? OUVINDO : NOME);
    botao.querySelector("span").textContent = ouvindo ? OUVINDO : ROTULO;
  }

  function escrever(campo, texto) {
    var antes = campo.value.replace(/\s+$/, "");
    campo.value = (antes ? antes + " " : "") + texto;
    campo.dispatchEvent(new Event("input", { bubbles: true }));
    campo.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function parar() {
    if (!ativo) return;
    var a = ativo;
    ativo = null;
    rotulo(a.botao, false);
    try { a.rec.stop(); } catch (e) { /* já parou */ }
  }

  function tocar(campo, botao) {
    if (ativo && ativo.botao === botao) { parar(); return; }
    parar();
    aviso(campo, "");
    var Rec = Reconhecer();
    if (!Rec) { dicaTeclado(campo); return; }
    var rec;
    try { rec = new Rec(); } catch (e) { dicaTeclado(campo); return; }
    rec.lang = "pt-BR";
    rec.continuous = false;
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    var este = { rec: rec, campo: campo, botao: botao };
    ativo = este;
    rotulo(botao, true);
    rec.onresult = function (e) {
      var partes = [];
      for (var i = 0; i < e.results.length; i++) partes.push(e.results[i][0].transcript);
      var t = partes.join(" ").trim();
      if (t && campo.isConnected) escrever(campo, t);
    };
    rec.onend = function () { if (ativo === este) { ativo = null; rotulo(botao, false); } };
    rec.onerror = function (e) {
      if (ativo === este) { ativo = null; rotulo(botao, false); }
      var motivo = e && e.error;
      if (motivo === "aborted") return;
      if (motivo === "not-allowed" || motivo === "service-not-allowed" || motivo === "audio-capture") {
        if (iphone()) dicaTeclado(campo); else aviso(campo, MSG_BLOQUEADO);
      } else aviso(campo, motivo === "no-speech" ? MSG_NADA : MSG_OUTRO);
    };
    try { rec.start(); } catch (e) {
      ativo = null;
      rotulo(botao, false);
      if (iphone()) dicaTeclado(campo); else aviso(campo, MSG_OUTRO);
    }
  }

  function criar(campo) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "lg2-falar";
    b.setAttribute("aria-label", NOME);
    b.setAttribute("aria-pressed", "false");
    b.innerHTML = ICONE + "<span>" + ROTULO + "</span>";
    b.addEventListener("click", function (e) { e.preventDefault(); e.stopPropagation(); tocar(campo, b); });
    campo.insertAdjacentElement("afterend", b);
    botoes.set(campo, b);
    return b;
  }

  function varrer() {
    var campos = document.querySelectorAll("textarea, input[data-falar]");
    for (var i = 0; i < campos.length; i++) {
      var c = campos[i];
      var b = botoes.get(c);
      if (b && !b.isConnected) { botoes.delete(c); b = null; }
      if (!elegivel(c)) { if (b) b.hidden = true; continue; }
      var ver = visivel(c);
      if (!b) { if (ver) criar(c); continue; }
      if (b.previousElementSibling !== c) c.insertAdjacentElement("afterend", b);
      b.hidden = !ver || tecladoAberto(c);
    }
    if (ativo && !ativo.campo.isConnected) parar();
  }

  var agendado = false;
  function agendar() {
    if (agendado) return;
    agendado = true;
    setTimeout(function () { agendado = false; varrer(); }, 0);
  }

  function iniciar() {
    estilo();
    varrer();
    new MutationObserver(function (lista) {
      for (var i = 0; i < lista.length; i++) {
        var alvo = lista[i].target;
        // ignora as próprias mudanças do botão e do aviso
        if (alvo.nodeType === 1 && alvo.closest && alvo.closest(".lg2-falar, .lg2-falar-aviso")) continue;
        agendar();
        return;
      }
    }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["hidden", "class", "style", "open"] });
    document.addEventListener("toggle", agendar, true);
    document.addEventListener("focusin", agendar);
    document.addEventListener("focusout", agendar);
    window.addEventListener("resize", agendar);
    if (window.visualViewport) window.visualViewport.addEventListener("resize", agendar);
  }

  window.LG2Falar = { varrer: varrer, MSG_IPHONE: MSG_IPHONE };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar);
  else iniciar();
})();
