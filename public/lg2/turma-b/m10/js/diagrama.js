/* Diagrama de fluxo do processo (Empreenda+). Arquivo autocontido: o mesmo par js/diagrama.js + css/diagrama.css
   serve a outros módulos (ex.: processo de vendas do Módulo 10).
   Uso:
     LG2Diagrama.render(container, passos, opcoes)   desenha dentro do container (substitui o conteúdo)
     LG2Diagrama.html(passos, opcoes)                devolve o HTML (para quem monta a tela como texto)
   passos = [{ titulo, detalhe?, marca? }]
     marca = texto curto ("Gargalo") ou { texto, tipo: "gargalo" | "info" }; "gargalo" destaca a caixa com borda coral.
   opcoes = { rotulo?: "nome do diagrama para leitor de tela", id?, legenda?: "linha embaixo (ex.: quem faz)" }
   Semântica: lista ordenada (<ol>), cada passo é um <li>; as setas são só desenho (aria-hidden).
   Celular: uma caixa por linha com seta ↓; tela larga (≥ 720 px): caixas lado a lado com seta →. */
(function (raiz) {
  "use strict";
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  function marcaDe(m) {
    if (!m) return null;
    if (typeof m === "string") return { texto: m, tipo: /gargalo/i.test(m) ? "gargalo" : "info" };
    return m.texto ? { texto: m.texto, tipo: m.tipo || "info" } : null;
  }
  function html(passos, opcoes) {
    const o = opcoes || {};
    const ps = (passos || []).filter((p) => p && String(p.titulo || "").trim());
    if (!ps.length) return "";
    const itens = ps.map((p, i) => {
      const m = marcaDe(p.marca);
      return `<li class="lg2-diag-passo${m && m.tipo === "gargalo" ? " lg2-diag-gargalo" : ""}">
        <div class="lg2-diag-caixa">
          <span class="lg2-diag-num" aria-hidden="true">${i + 1}</span>
          <span class="lg2-diag-txt"><span class="lg2-diag-tit">${esc(p.titulo)}</span>${p.detalhe ? `<span class="lg2-diag-det">${esc(p.detalhe)}</span>` : ""}</span>
          ${m ? `<span class="lg2-diag-marca lg2-diag-marca-${esc(m.tipo)}">${esc(m.texto)}</span>` : ""}
        </div>
        ${i < ps.length - 1 ? `<span class="lg2-diag-seta" aria-hidden="true"></span>` : ""}
      </li>`;
    }).join("");
    return `<figure class="lg2-diag"${o.id ? ` id="${esc(o.id)}"` : ""}>
      <ol class="lg2-diag-lista" role="list" aria-label="${esc(o.rotulo || "Etapas do processo, em ordem")}">${itens}</ol>
      ${o.legenda ? `<figcaption class="lg2-diag-legenda">${esc(o.legenda)}</figcaption>` : ""}
    </figure>`;
  }
  function render(container, passos, opcoes) {
    if (!container) return null;
    container.innerHTML = html(passos, opcoes);
    return container.firstElementChild;
  }
  raiz.LG2Diagrama = { render, html };
})(typeof window !== "undefined" ? window : globalThis);
