/* Roteiro de entrevista (Módulo 2) aberto POR CIMA da tela atual.
   Arquivo autocontido: os textos vêm embutidos aqui (os mesmos da tela de instrumentos do Módulo 2),
   sem depender do app de nenhum módulo. Pode ser copiado igual para outro módulo.
   Uso:
     - qualquer botão com o atributo data-roteiro abre o painel (ex.: LG2Roteiro.botao());
     - LG2Roteiro.abrir() abre por código; LG2Roteiro.fechar() fecha;
     - LG2Roteiro.cita(texto) diz se um texto fala do roteiro de entrevista;
     - LG2Roteiro.blocos({ ids, extras, ficha }) devolve o "como usar" + "passo a passo" em HTML;
     - LG2Roteiro.extras (opcional): função que devolve perguntas a mais pedidas pelas respostas da pessoa.
   O painel só lê as anotações das conversas salvas no Módulo 2 (localStorage "lg2-turma-b-m02"); nunca grava nada.
   Fechar (botão, Esc ou toque fora) volta ao mesmo ponto da mesma tela, sem mexer nas respostas. */
(function () {
  "use strict";
  if (window.LG2Roteiro) return;
  const CHAVE_M2 = "lg2-turma-b-m02";
  const T = {
    titulo: "Roteiro de entrevista",
    objetivo: "Um guia para conversar com um possível cliente sem puxar a resposta que você quer ouvir.",
    uso: [
      ["Para que serve", "Descobrir, conversando, como as pessoas compram hoje e se o problema que você imagina existe mesmo. Não é para vender nem para apresentar a sua ideia."],
      ["Com quem conversar", "Com pessoas do público que você imagina e que já compraram algo parecido. Prefira quem não é da sua família nem amigo próximo: elas tendem a concordar por educação."],
      ["Quantas conversas", "Comece com 3 nesta semana e chegue a pelo menos 5. O ideal é ouvir de 8 a 10 pessoas."],
      ["O que anotar", "Logo depois de cada conversa, registre a pessoa na ficha de perfil de cliente: quem é, de quanto em quanto tempo compra, por que escolhe e se mostrou interesse de verdade."],
      ["O que fazer com as respostas", "Depois das conversas, veja no quadro de evidências quantas pessoas mostraram interesse de verdade e use o quadro para comparar os grupos para decidir por quem começar."],
    ],
    /* conceito "Entrevista com cliente potencial" da base do Módulo 2: definição e exemplo */
    antes: "Conversa estruturada com possíveis clientes, focada em entender problemas e comportamentos passados, sem apresentar a ideia de negócio antes de ouvir.",
    exemplo: "Perguntar \"na última vez que você comprou algo parecido, o que te fez decidir?\" em vez de \"você compraria meu produto?\".",
    /* as perguntas do roteiro (exemplo do instrumento na planilha do Módulo 2) */
    perguntas: ["onde comprou da última vez", "quanto pagou", "o que faria diferente", "se pediria orçamento de novo"],
    fechar: "Agradeça. Só agora, se quiser, conte da sua ideia. Repare se a pessoa toma alguma atitude, como pedir orçamento ou indicar alguém.",
    anotar: "Registre a conversa na ficha de perfil de cliente",
    limite: "As respostas de poucas entrevistas não substituem uma pesquisa de mercado formal; use como ponto de partida.",
  };
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const CITA = /roteiro de entrevista|M2\.I01\b/i;

  function blocos(o) {
    o = o || {};
    const id = (x) => (o.ids ? ` id="${x}"` : "");
    const extras = (o.extras || []).filter(Boolean);
    const passos = [
      ["Antes da conversa", `<p>${esc(T.antes)}</p>`],
      ["Comece pelo passado", `<p>Peça para a pessoa lembrar da última vez que comprou algo parecido. Por exemplo:</p><p class="ex">${esc(T.exemplo)}</p>`],
      ["Faça as perguntas, uma de cada vez", `<p>Deixe a pessoa falar e não corrija. Pergunte sobre:</p>
        <ul>${T.perguntas.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
        ${extras.length ? `<p${id("roteiro-extras-tit")}>Pelas suas respostas neste módulo, vale perguntar também:</p><ul${id("roteiro-extras")}>${extras.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}`],
      ["Feche a conversa", `<p>${esc(T.fechar)}</p>`],
      ["Anote no mesmo dia", o.ficha ? `<p>${esc(T.anotar)}, logo abaixo. <a href="#form">Ir para a ficha</a></p>` : `<p>${esc(T.anotar)}, na tela de instrumentos do Módulo 2.</p>`],
    ];
    return `<div class="cartao roteiro-uso"${id("roteiro-uso")}><h3>Como usar este roteiro</h3>
      <dl>${T.uso.map(([t, d]) => `<dt>${esc(t)}</dt><dd>${esc(d)}</dd>`).join("")}</dl></div>
      <div class="cartao"><h3>O roteiro, passo a passo</h3>
      <ol class="roteiro-passos"${id("roteiro-passos")}>${passos.map(([t, h]) => `<li><b>${esc(t)}</b>${h}</li>`).join("")}</ol></div>`;
  }

  /* anotações das conversas salvas no Módulo 2 (só leitura) */
  function fichas() {
    try { const s = JSON.parse(localStorage.getItem(CHAVE_M2)); return Array.isArray(s && s.fichas) ? s.fichas : []; } catch (e) { return []; }
  }
  function blocoNotas() {
    const f = fichas();
    if (!f.length) return `<div class="cartao lg2-rot-notas"><h3>Suas anotações das conversas</h3>
      <p>Você ainda não registrou nenhuma conversa. As anotações ficam na ficha de perfil de cliente, na tela de instrumentos do Módulo 2.</p></div>`;
    const c = { forte: 0, fraco: 0, nenhum: 0 };
    f.forEach((x) => { if (c[x.sinal] !== undefined) c[x.sinal]++; });
    return `<div class="cartao lg2-rot-notas"><h3>Suas anotações das conversas</h3>
      <p class="lg2-rot-conta">${f.length === 1 ? "1 conversa registrada" : `${f.length} conversas registradas`} na ficha de perfil de cliente: ${c.forte} com sinal forte, ${c.fraco} com sinal fraco e ${c.nenhum} sem interesse.</p>
      <ol class="lg2-rot-fichas">${f.map((x) => `<li><b>${esc(x.situacao)}</b><span>sinal ${esc(x.sinal)}${x.frequencia ? ` · ${esc(x.frequencia)}` : ""}${x.motivo ? ` · ${esc(x.motivo)}` : ""}</span></li>`).join("")}</ol></div>`;
  }

  const CSS = `
.lg2-rot-fundo{position:fixed;inset:0;z-index:1000;background:rgba(43,35,64,.55);display:flex;align-items:flex-end;justify-content:center}
.lg2-rot{position:relative;width:100%;max-width:520px;height:calc(100% - 16px);background:#fff;border-radius:18px 18px 0 0;display:flex;flex-direction:column;overflow:hidden;color:#2b2340;font-family:inherit;outline:none}
.lg2-rot-topo{flex:0 0 auto;display:flex;align-items:center;gap:12px;background:#684A97;color:#fff;padding:12px 14px 12px 18px}
.lg2-rot-topo h2{flex:1;margin:0;font-size:20px;line-height:1.2;color:#fff}
.lg2-rot-fechar{flex:0 0 auto;min-height:44px;background:#fff;color:#684A97;border:none;border-radius:999px;padding:8px 18px;font:inherit;font-size:16px;font-weight:700;cursor:pointer}
.lg2-rot-corpo{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:14px 14px 28px;overscroll-behavior:contain}
.lg2-rot-corpo .lg2-rot-obj{font-size:16px;line-height:1.45;margin:0 0 12px;color:#2b2340}
.lg2-rot-corpo .cartao{border:2px solid #ECE9F3;border-radius:14px;padding:14px 16px;margin:0 0 12px;background:#fff}
.lg2-rot-corpo .cartao h3{color:#684A97;font-size:16px;margin:0 0 4px}
.lg2-rot-corpo p{font-size:15px;line-height:1.45;color:#4a4460;margin:4px 0}
.lg2-rot-corpo dl{margin:6px 0 0}
.lg2-rot-corpo dt{font-weight:700;color:#684A97;font-size:15px;margin-top:8px}
.lg2-rot-corpo dd{margin:2px 0 0;font-size:15px;color:#4a4460;line-height:1.45}
.lg2-rot-corpo .roteiro-passos{margin:6px 0 0 20px;padding:0;font-size:15px;color:#4a4460;line-height:1.45}
.lg2-rot-corpo .roteiro-passos>li{margin:0 0 10px;padding-left:2px}
.lg2-rot-corpo .roteiro-passos>li>b{display:block;color:#684A97}
.lg2-rot-corpo .roteiro-passos ul{margin:4px 0 4px 18px;padding:0}
.lg2-rot-corpo .ex{color:#4a4460;font-style:italic}
.lg2-rot-fichas{margin:8px 0 0 20px;padding:0;font-size:15px;color:#2b2340}
.lg2-rot-fichas li{margin:0 0 8px}
.lg2-rot-fichas b{display:block;font-weight:700}
.lg2-rot-fichas span{display:block;color:#4a4460;font-size:14.5px}
.lg2-rot-aviso{background:#ECE9F3;border-left:4px solid #684A97;border-radius:12px;padding:12px 14px;font-size:14.5px;line-height:1.45;color:#4a3d66;margin:4px 0 0}
html.lg2-rot-aberto,html.lg2-rot-aberto body{overflow:hidden}
@media print{.lg2-rot-fundo{display:none!important}}`;
  function estilo() {
    if (document.getElementById("lg2-rot-css")) return;
    const s = document.createElement("style");
    s.id = "lg2-rot-css"; s.textContent = CSS;
    document.head.appendChild(s);
  }

  let aberto = null;   // { fundo, de, y, inertes }
  function abrir(o) {
    o = o || {};
    if (aberto) return aberto.fundo;
    estilo();
    let extras = o.extras;
    if (!extras && typeof api.extras === "function") { try { extras = api.extras(); } catch (e) { extras = []; } }
    const de = o.de || document.activeElement;
    const y = window.scrollY;
    const bodyStyle = document.body.getAttribute("style");
    /* fixe a tela sob o painel sem perder a rolagem do documento (overflow:hidden sozinho pode saltar no celular) */
    document.body.style.position = "fixed";
    document.body.style.top = `-${y}px`;
    document.body.style.width = "100%";
    const fundo = document.createElement("div");
    fundo.className = "lg2-rot-fundo";
    fundo.innerHTML = `<div class="lg2-rot" role="dialog" aria-modal="true" aria-labelledby="lg2-rot-tit" tabindex="-1">
      <div class="lg2-rot-topo"><h2 id="lg2-rot-tit">${esc(T.titulo)}</h2><button type="button" class="lg2-rot-fechar">Fechar</button></div>
      <div class="lg2-rot-corpo">
        <p class="lg2-rot-obj">${esc(T.objetivo)}</p>
        ${blocos({ extras })}
        ${blocoNotas()}
        <p class="lg2-rot-aviso">${esc(T.limite)}</p>
      </div></div>`;
    /* o resto da página fica inerte enquanto o painel está aberto (leitor de tela e Tab ficam no painel) */
    const inertes = [...document.body.children].filter((x) => x !== fundo && !x.inert && x.tagName !== "SCRIPT");
    inertes.forEach((x) => { x.inert = true; });
    document.body.appendChild(fundo);
    document.documentElement.classList.add("lg2-rot-aberto");
    aberto = { fundo, de, y, inertes, bodyStyle };
    const painel = fundo.querySelector(".lg2-rot");
    fundo.querySelector(".lg2-rot-fechar").onclick = () => fechar();
    fundo.addEventListener("click", (e) => { if (e.target === fundo) fechar(); });
    fundo.addEventListener("keydown", tecla);
    painel.focus({ preventScroll: true });
    return fundo;
  }
  function tecla(e) {
    if (e.key === "Escape") { e.preventDefault(); fechar(); return; }
    if (e.key !== "Tab" || !aberto) return;
    const f = [...aberto.fundo.querySelectorAll("button, a[href], [tabindex]:not([tabindex='-1'])")];
    if (!f.length) return;
    const a = f[0], z = f[f.length - 1];
    if (e.shiftKey && (document.activeElement === a || document.activeElement === aberto.fundo.querySelector(".lg2-rot"))) { e.preventDefault(); z.focus(); }
    else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
  }
  function fechar() {
    if (!aberto) return;
    const { fundo, de, y, inertes, bodyStyle } = aberto;
    aberto = null;
    fundo.remove();
    inertes.forEach((x) => { x.inert = false; });
    if (bodyStyle === null) document.body.removeAttribute("style"); else document.body.setAttribute("style", bodyStyle);
    document.documentElement.classList.remove("lg2-rot-aberto");
    /* escrita direta no scroll root ignora scroll-behavior:smooth, para o foco e a leitura retomarem no mesmo ponto já neste frame */
    document.scrollingElement.scrollTop = y;
    if (de && de.isConnected && de.focus) de.focus({ preventScroll: true });
  }
  /* Esc também fecha quando o foco saiu do painel */
  document.addEventListener("keydown", (e) => { if (aberto && e.key === "Escape" && !aberto.fundo.contains(e.target)) { e.preventDefault(); fechar(); } });
  /* qualquer botão com data-roteiro abre o painel */
  document.addEventListener("click", (e) => {
    const b = e.target.closest && e.target.closest("[data-roteiro]");
    if (!b) return;
    e.preventDefault();
    abrir({ de: b });
  });

  const api = {
    abrir, fechar, blocos,
    estaAberto: () => !!aberto,
    cita: (t) => CITA.test(String(t ?? "")),
    botao: (rotulo) => `<button type="button" class="btn-alt btn-roteiro" data-roteiro>${esc(rotulo || "Ver o roteiro")}</button>`,
    extras: null,
  };
  window.LG2Roteiro = api;
})();
