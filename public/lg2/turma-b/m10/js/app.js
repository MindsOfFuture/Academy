/* Telas do Módulo 10 (Turma B). Todo texto de conteúdo vem de window.MODULO10
   (documento "Módulo 10 v2" do grupo), sem edição. As respostas ficam só neste aparelho. */
(function () {
  "use strict";
  const D = window.MODULO10;
  const tela = document.getElementById("tela");
  const CHAVE = "lg2-turma-b-m10";
  const NS = "Não sei";
  /* a versão anterior só tinha 15 perguntas em texto aberto, com outra numeração: começa do zero */
  const DADOS = 2;
  const P = D.perguntas;
  const porCod = Object.fromEntries(P.map((q) => [q.codigo, q]));
  const conceito = Object.fromEntries(D.base.map((b) => [b.codigo, b]));

  let S = carregar();
  function novo() { return { v: DADOS, R: {}, hist: [] }; }
  function carregar() { try { const s = JSON.parse(localStorage.getItem(CHAVE)); return s && s.v === DADOS && s.R ? s : novo(); } catch { return novo(); } }
  let aviso = "";
  function salvar() {
    try { localStorage.setItem(CHAVE, JSON.stringify(S)); aviso = ""; }
    catch { aviso = "Não foi possível salvar neste navegador. Mantenha a página aberta e imprima o resultado para guardar suas respostas."; }
  }

  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  function el(html) { const d = document.createElement("div"); d.innerHTML = html.trim(); return d.firstElementChild; }
  function ir(f, a) { tela.innerHTML = ""; tela.appendChild(f(a)); window.scrollTo(0, 0); }

  /* ---------- motor: condição de exibição e regras da Tela 4 ---------- */
  const partes = (c) => { const i = c.indexOf("="); return [c.slice(0, i).trim(), c.slice(i + 1).trim()]; };
  /* valor que a resposta tem para comparar com "Mx.Pyy = valor" */
  function valorDe(r) {
    if (!r) return null;
    if (r.estado === "naosei") return NS;
    if (r.estado === "opcao") return r.opcao;
    if (r.estado === "valor") return "Preenchido";
    return null;
  }
  function visivel(q, R) {
    if (!q.condicao) return true;
    const [cod, v] = partes(q.condicao);
    return valorDe(R[cod]) === v;
  }
  function regrasPara(cod, r) {
    const v = valorDe(r);
    return D.regras.filter((g) => { const [c, x] = partes(g.condicao); return c === cod && x === v; });
  }
  function proxima(R, cod) {
    let i = cod ? P.findIndex((q) => q.codigo === cod) + 1 : 0;
    for (; i < P.length; i++) if (visivel(P[i], R)) return P[i].codigo;
    return "RESULTADO";
  }
  function sequencia(R) {
    const out = [];
    let c = proxima(R, null);
    while (c !== "RESULTADO") { out.push(c); c = proxima(R, c); }
    return out;
  }
  /* uma resposta que muda a condição (ex.: P05 deixa de ser Sim) apaga a pergunta que sumiu */
  function limparInvisiveis() {
    const vis = new Set(sequencia(S.R));
    Object.keys(S.R).forEach((k) => { if (!vis.has(k)) delete S.R[k]; });
  }
  /* P12 é respondida "para cada prioridade" da P10 */
  const problemas = () => (S.R["M10.P10"] && S.R["M10.P10"].estado === "valor") ? S.R["M10.P10"].itens.filter((t) => t.trim()) : [];

  /* ---------- peças ---------- */
  function rodape() {
    return `<footer class="rodape">
      <p class="credito">Conteúdo do Grupo 10 · Laboratório de Gestão II · FACC/UFJF · versão v2</p>
      <div class="logos"><img src="assets/logo_facc.png" alt="FACC"><img src="assets/logo_ufjf.svg" alt="UFJF"><img src="assets/logo_mg.svg" alt="Governo de Minas Gerais"></div>
    </footer>`;
  }
  /* ---------- peças do layout (modelo do Módulo 5) ---------- */
  function topo(trilha) {
    return `<div class="barra-topo">
      <img class="logo-mini" src="assets/minds.svg" alt="Minds of the Future">
      <nav class="trilha" aria-label="Você está em"><button class="trilha-link" data-inicio>Início</button><span>/</span><span>Módulo 10</span>${trilha ? `<span>/</span><span>${esc(trilha)}</span>` : ""}</nav>
    </div>`;
  }
  /* faixa roxa: na capa, grande com hero-inicio; nas outras telas, pequena com hero-tela */
  function heroi(o) {
    const longo = String(o.titulo || "").length > 42;
    return `<section class="heroi ${o.grande ? "heroi-grande" : ""}">
      <div class="heroi-topo">
        <div class="heroi-txt">
          <div class="kicker ${o.kickerClasse || ""}">${esc(o.kicker || "Módulo 10")}</div>
          <${o.h1 ? "h1" : "h2"} class="heroi-tit ${longo && !o.grande ? "heroi-tit-longo" : ""}">${esc(o.titulo)}</${o.h1 ? "h1" : "h2"}>
          ${o.texto ? `<p>${esc(o.texto)}</p>` : ""}
        </div>
        <img class="heroi-img" src="assets/${o.grande ? "hero-inicio.webp" : "hero-tela.webp"}" alt="">
      </div>
      ${o.extra || ""}
      ${o.reinicio ? `<button class="reinicio" id="zerar">Recomeçar do zero</button>` : ""}
    </section>`;
  }
  const botaoVoltar = () => `<div class="acoes acoes-voltar"><button class="btn btn-linha voltar" id="v">Voltar</button></div>`;
  function ligar(p) { p.querySelectorAll("[data-inicio]").forEach((b) => { b.onclick = () => ir(telaCapa); }); }

  const blocoConceitos = (cods, titulo) => !cods.length ? "" : `<details class="saiba dica"><summary><img src="assets/hero-tela.webp" alt=""><span>${titulo || "Entenda os termos"}</span></summary>
    ${cods.map((c) => conceito[c]).map((b) => `<div class="conceito"><b>${esc(b.conceito)}</b><p>${esc(b.definicao)}</p><p class="ex">${esc(b.porque)}</p></div>`).join("")}
  </details>`;
  const blocoRegra = (g) => `<div class="regra"><p class="r-texto">${esc(g.texto)}</p>${g.alerta ? `<div class="bloco b-alerta"><b>Atenção</b>${esc(g.alerta)}</div>` : ""}${g.lacuna ? `<div class="bloco b-lacuna"><b>O que ainda falta</b>${esc(g.lacuna)}</div>` : ""}</div>`;
  function reiniciar() {
    if (!confirm("Apagar todas as respostas deste módulo e recomeçar? Se quiser guardar, imprima o resultado antes.")) return;
    try { localStorage.removeItem(CHAVE); } catch {}
    S = novo();
    ir(telaCapa);
  }

  /* ---------- capa ---------- */
  function telaCapa() {
    const comecou = Object.keys(S.R).length > 0;
    const p = el(`<div class="pag">
      ${topo("")}
      ${heroi({ grande: true, h1: true, titulo: D.nome, texto: D.objetivo })}
      <main class="corpo">
        <div class="cartao"><h3>Para quem é</h3><p>${esc(D.para_quem)}</p></div>
        <div class="cartao"><h3>O que ter em mãos</h3><p>${esc(D.ter_em_maos)}</p></div>
        <div class="cartao"><h3>O que você recebe no final</h3><p>${esc(D.entrega)}</p></div>
        <p class="aviso">Não inclua nomes, telefones, documentos ou outros dados pessoais nas respostas. Elas ficam salvas apenas neste navegador.</p>
        <div class="acoes">
          <button class="btn btn-primario seta" id="ir">${comecou ? "Continuar de onde parei" : "Começar"}</button>
          ${comecou ? `<button class="btn btn-linha" id="zerar">Recomeçar do zero</button>` : ""}
        </div>
        ${rodape()}
      </main>
    </div>`);
    p.querySelector("#ir").onclick = () => {
      if (!comecou) { S.hist = []; return ir(telaPergunta, proxima(S.R, null)); }
      const falta = sequencia(S.R).find((c) => !S.R[c]);
      if (!falta) return ir(telaResultado);
      ir(telaPergunta, falta);
    };
    const z = p.querySelector("#zerar"); if (z) z.onclick = reiniciar;
    ligar(p);
    return p;
  }

  /* ---------- pergunta ---------- */
  function telaPergunta(cod) {
    const q = porCod[cod];
    const seq = sequencia(Object.assign({}, S.R));
    const n = Math.max(1, seq.indexOf(cod) + 1);
    if (S.hist[S.hist.length - 1] !== cod) { S.hist.push(cod); salvar(); }
    const resp = S.R[cod];
    let escolhida = resp && resp.estado === "opcao" ? resp.opcao : resp && resp.estado === "naosei" && q.tipo === "escolha" ? NS : null;
    const p = el(`<div class="pag">
      ${topo("Perguntas")}
      ${heroi({ titulo: D.nome, reinicio: true, extra: `<div class="progresso">
        <div class="passo">Pergunta ${n} de ${seq.length}</div>
        <div class="barra"><div class="barra-fill" style="width:${Math.round((n / seq.length) * 100)}%"></div></div>
      </div>` })}
      <main class="corpo">
        <div class="cartao-q pergunta">
          <h2 class="q" id="pergunta">${esc(q.pergunta)}</h2>
          <div class="entrada" id="ent"></div>
          ${q.tipo === "texto" ? `<div class="alt"><button class="btn-alt" id="ns">${NS}</button></div>` : ""}
          <div class="erro" id="erro" hidden></div>
          <div id="retorno"></div>
          ${blocoConceitos(q.conceitos)}
          <div class="acoes" id="acoes"><button class="btn btn-primario seta" id="ok">Continuar</button></div>
          ${botaoVoltar()}
        </div>
        ${rodape()}
      </main>
    </div>`);
    p.querySelector("#v").onclick = () => {
      S.hist.pop();
      const ant = S.hist.pop();
      salvar();
      if (ant) ir(telaPergunta, ant); else ir(telaCapa);
    };
    p.querySelector("#zerar").onclick = reiniciar;
    ligar(p);
    const ent = p.querySelector("#ent");
    let campos = [];
    if (q.tipo === "escolha") {
      ent.classList.add("opcoes");
      q.opcoes.forEach((op) => {
        const b = el(`<button class="opcao ${escolhida === op ? "sel" : ""}"><span class="radio" aria-hidden="true"></span><span class="op-txt"><b>${esc(op)}</b></span></button>`);
        b.onclick = () => { escolhida = op; ent.querySelectorAll(".opcao").forEach((x) => x.classList.remove("sel")); b.classList.add("sel"); };
        ent.appendChild(b);
      });
    } else {
      const itens = resp && resp.estado === "valor" ? resp.itens : [];
      ent.classList.add("lista-campos");
      if (cod === "M10.P10") {
        campos = [0, 1, 2].map((i) => el(`<input class="campo" aria-label="Problema ou tarefa ${i + 1}" placeholder="${i + 1}." value="${esc(itens[i] || "")}">`));
      } else if (cod === "M10.P12" && problemas().length) {
        problemas().forEach((pr, i) => {
          ent.appendChild(el(`<label for="p12-${i}">${esc(pr)}</label>`));
          campos.push(el(`<input class="campo" id="p12-${i}" value="${esc(itens[i] || "")}">`));
          ent.appendChild(campos[i]);
        });
      } else {
        campos = [el(`<textarea class="campo" rows="4" aria-labelledby="pergunta">${esc(itens[0] || "")}</textarea>`)];
      }
      campos.forEach((c) => { if (c.parentNode !== ent) ent.appendChild(c); });
      p.querySelector("#ns").onclick = () => responder({ estado: "naosei" });
    }
    p.querySelector("#ok").onclick = () => {
      if (q.tipo === "escolha") {
        if (!escolhida) return erro("Escolha uma opção para continuar.");
        return responder(escolhida === NS ? { estado: "naosei" } : { estado: "opcao", opcao: escolhida });
      }
      const itens = campos.map((c) => c.value.trim());
      if (!itens.some(Boolean)) return erro(`Escreva sua resposta ou toque em “${NS}” para continuar.`);
      responder({ estado: "valor", itens });
    };
    function erro(t) { const e = p.querySelector("#erro"); e.textContent = t; e.hidden = false; }
    function responder(r0) {
      p.querySelector("#erro").hidden = true;
      S.R[cod] = r0;
      limparInvisiveis();
      salvar();
      const prox = proxima(S.R, cod);
      const box = p.querySelector("#retorno");
      box.innerHTML = `<div class="retorno">${regrasPara(cod, r0).map(blocoRegra).join("")}${aviso ? `<p class="erro">${esc(aviso)}</p>` : ""}</div>`;
      const acoes = p.querySelector("#acoes");
      acoes.innerHTML = "";
      const b = el(`<button class="btn btn-primario seta">${prox === "RESULTADO" ? "Ver o resultado" : "Seguir"}</button>`);
      b.onclick = () => prox === "RESULTADO" ? ir(telaResultado) : ir(telaPergunta, prox);
      acoes.appendChild(b);
      const c = el(`<button class="btn btn-claro">Corrigir minha resposta</button>`);
      c.onclick = () => { S.hist.pop(); ir(telaPergunta, cod); };
      acoes.appendChild(c);
      box.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    return p;
  }

  /* ---------- resultado ---------- */
  function respostaTexto(q, r) {
    if (!r) return "Sem resposta";
    if (r.estado === "naosei") return NS;
    if (r.estado === "opcao") return r.opcao;
    return r.itens.filter(Boolean).join("\n");
  }
  function telaResultado() {
    if (S.hist[S.hist.length - 1] !== "RESULTADO") { S.hist.push("RESULTADO"); salvar(); }
    const seq = sequencia(S.R);
    const grupos = [
      [["M10-C03", "M10-C04", "M10-C05"], ["M10.P01", "M10.P02", "M10.P03"]],
      [["M10-C06", "M10-C07", "M10-C08", "M10-C09"], ["M10.P04", "M10.P05", "M10.P06", "M10.P07", "M10.P08", "M10.P09"]],
      [["M10-C10"], ["M10.P10", "M10.P11", "M10.P12"]],
    ];
    const cartao = (cod) => {
      const q = porCod[cod], r = S.R[cod];
      return `<article class="cartao"><p class="diag-q">${esc(q.pergunta)}</p><p class="diag-r">${esc(respostaTexto(q, r))}</p>${r ? regrasPara(cod, r).map(blocoRegra).join("") : ""}
        <button class="btn btn-claro editar" data-c="${cod}">Editar resposta</button></article>`;
    };
    const probs = problemas();
    const sinais = S.R["M10.P12"] && S.R["M10.P12"].estado === "valor" ? S.R["M10.P12"].itens : [];
    const p11 = S.R["M10.P11"] ? respostaTexto(porCod["M10.P11"], S.R["M10.P11"]) : "";
    const p = el(`<div class="pag">
      ${topo("Resultado")}
      ${heroi({ kicker: "Resultado", kickerClasse: "passo", titulo: D.nome })}
      <main class="corpo">
        <section class="concluido">
          <div class="conc-topo"><span class="check" aria-hidden="true"></span><div><h2>Você concluiu o Módulo 10</h2><p>Veja abaixo o resultado pelas suas respostas.</p></div></div>
        </section>
        <div class="cartao"><h3>O que você recebe no final</h3><p>${esc(D.entrega)}</p></div>
        ${probs.length ? `<div class="cartao"><h3>${esc(porCod["M10.P10"].pergunta)}</h3>
          ${probs.map((pr, i) => `<div class="prob"><b>${i + 1}. ${esc(pr)}</b></div>`).join("")}
          ${p11 ? `<p class="diag-q">${esc(porCod["M10.P11"].pergunta)}</p><p class="diag-r">${esc(p11)}</p>` : ""}
          ${sinais.some(Boolean) ? `<p class="diag-q">${esc(porCod["M10.P12"].pergunta)}</p>${probs.map((pr, i) => sinais[i] ? `<div class="prob"><b>${i + 1}. ${esc(pr)}</b><span>${esc(sinais[i])}</span></div>` : "").join("")}` : ""}
        </div>` : ""}
        ${grupos.map(([cs, qs]) => {
          const vis = qs.filter((c) => seq.includes(c));
          return !vis.length ? "" : `<h3 class="secao-titulo">${cs.map((c) => esc(conceito[c].conceito)).join(" · ")}</h3>${vis.map(cartao).join("")}`;
        }).join("")}
        ${blocoConceitos(D.base.map((b) => b.codigo), "Entenda todos os termos do módulo")}
        <div class="acoes"><button class="btn btn-primario" id="imprimir">Imprimir resultado</button><button class="btn btn-linha" id="zerar">Recomeçar do zero</button></div>
        ${botaoVoltar()}
        <div class="acoes lg2-proximo"><a class="btn btn-claro" style="text-decoration:none;text-align:center;box-sizing:border-box" href="/protected/modulos/laboratorio-de-gestao?aba=b">Voltar aos módulos</a></div>
        ${rodape()}
      </main>
    </div>`);
    p.querySelector("#v").onclick = () => { S.hist.pop(); const ant = S.hist.pop(); salvar(); ant ? ir(telaPergunta, ant) : ir(telaCapa); };
    p.querySelectorAll("[data-c]").forEach((b) => { b.onclick = () => { S.hist.pop(); ir(telaPergunta, b.dataset.c); }; });
    p.querySelector("#imprimir").onclick = () => window.print();
    p.querySelector("#zerar").onclick = reiniciar;
    ligar(p);
    return p;
  }

  ir(telaCapa);
})();
