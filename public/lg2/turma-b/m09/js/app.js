/* Telas do Módulo 9. Todo texto de conteúdo vem de window.MODULO9 (a planilha),
   sem edição. As respostas ficam só neste aparelho. */
(function () {
  "use strict";
  const D = window.MODULO9, M = Motor.montar(D);
  const tela = document.getElementById("tela");
  const CHAVE = "lg2-turma-b-m09";
  const vazio = (s) => !s || !String(s).trim() || s === "—" || s === "-" || s === "Nenhum" || s === "Nenhuma";

  let S = carregar();               // { R: respostas, hist: [códigos] }
  function carregar() { try { return JSON.parse(localStorage.getItem(CHAVE)) || novo(); } catch { return novo(); } }
  function novo() { return { R: {}, hist: [] }; }
  function salvar() { try { localStorage.setItem(CHAVE, JSON.stringify(S)); } catch {} }

  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const link = (u, t) => /^https?:/.test(u || "") ? `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(t || u)}</a>` : esc(t || u);
  function el(html) { const d = document.createElement("div"); d.innerHTML = html.trim(); return d.firstElementChild; }
  function ir(f, a) { tela.innerHTML = ""; tela.appendChild(f(a)); window.scrollTo(0, 0); }

  /* conceitos da Base técnica ligados à pergunta: pela fonte citada na pergunta */
  function conceitosDe(q) {
    const f = String(q.fonte || "").split(",")[0].trim().toLowerCase();
    if (!f) return [];
    const chave = f.replace(/\s*\(.*$/, "").slice(0, 22);
    return D.base.filter((b) => String(b.fonte || "").toLowerCase().includes(chave)).slice(0, 2);
  }
  const educativoDe = (cod) => D.educativo.filter((e) => e.onde === cod);

  function blocoEducativo(lista) {
    return lista.map((e) => `
      <div class="caixa caixa-${e.tipo === "Faça" ? "faca" : e.tipo === "Entenda" ? "entenda" : "ia"}">
        <span class="tag">${esc(e.tipo)}</span>
        <b>${esc(e.titulo)}</b>
        <p>${esc(e.texto)}</p>
        ${vazio(e.exemplo) ? "" : `<p class="ex">${esc(e.exemplo)}</p>`}
        ${vazio(e.prompt) ? "" : `<div class="prompt"><p>${esc(e.prompt)}</p><button class="btn-copiar" data-t="${esc(e.prompt)}">Copiar texto</button></div>
          <p class="ex">${esc(e.conferir)}</p>`}
        <span class="fonte">Fonte: ${esc(e.fonte)}</span>
      </div>`).join("");
  }
  function blocoConceitos(lista) {
    if (!lista.length) return "";
    return `<details class="saiba"><summary>Entenda os termos</summary>${lista.map((b) => `
      <div class="conceito"><b>${esc(b.conceito)}</b><p>${esc(b.definicao)}</p>
      ${vazio(b.exemplo) ? "" : `<p class="ex">${esc(b.exemplo)}</p>`}
      <span class="fonte">Fonte: ${link(b.link, b.fonte)}${vazio(b.data) ? "" : ` · consultado em ${esc(b.data)}`}</span></div>`).join("")}
    </details>`;
  }
  function ligarCopiar(p) {
    p.querySelectorAll(".btn-copiar").forEach((b) => (b.onclick = () => {
      navigator.clipboard && navigator.clipboard.writeText(b.dataset.t);
      b.textContent = "Copiado";
    }));
  }

  /* ================= peças do layout (modelo do Módulo 5) ================= */
  function topo(trilha) {
    return `<div class="barra-topo">
      <img class="logo-mini" src="assets/minds.svg" alt="Minds of the Future">
      <nav class="trilha" aria-label="Você está em"><button class="trilha-link" data-inicio>Início</button><span>/</span><span>Módulo ${esc(D.modulo.numero)}</span>${trilha ? `<span>/</span><span>${esc(trilha)}</span>` : ""}</nav>
    </div>`;
  }
  /* faixa roxa: na capa, grande com hero-inicio; nas outras telas, pequena com hero-preco */
  function heroi(o) {
    const longo = String(o.titulo || "").length > 42;
    return `<section class="heroi ${o.grande ? "heroi-grande" : ""}">
      <div class="heroi-topo">
        <div class="heroi-txt">
          <div class="kicker ${o.kickerClasse || ""}">${esc(o.kicker || "Módulo " + D.modulo.numero)}</div>
          <${o.h1 ? "h1" : "h2"} class="heroi-tit ${longo && !o.grande ? "heroi-tit-longo" : ""}">${esc(o.titulo)}</${o.h1 ? "h1" : "h2"}>
          ${o.texto ? `<p>${esc(o.texto)}</p>` : ""}
        </div>
        <img class="heroi-img" src="assets/${o.grande ? "hero-inicio.webp" : "hero-preco.webp"}" alt="">
      </div>
      ${o.extra || ""}
    </section>`;
  }
  function dica(texto) {
    if (vazio(texto)) return "";
    return `<aside class="dica"><img src="assets/hero-preco.webp" alt=""><div><b>Dica</b><p class="ajuda">${esc(texto)}</p></div></aside>`;
  }
  const botaoVoltar = () => `<div class="acoes acoes-voltar"><button class="btn btn-linha voltar" id="v">Voltar</button></div>`;
  function ligar(p) {
    p.querySelectorAll("[data-inicio]").forEach((b) => { b.onclick = () => ir(telaCapa); });
  }

  /* ================= capa ================= */
  function telaCapa() {
    const iniciado = S.hist.length > 0;
    const p = el(`
      <div class="pag">
        ${topo("")}
        ${heroi({ grande: true, h1: true, titulo: D.modulo.nome, texto: D.mapa.objetivo })}
        <main class="corpo">
          <div class="cartao"><h3>Para quem é</h3><p>${esc(D.mapa.usuario)}</p></div>
          <div class="cartao"><h3>O que ter em mãos</h3><p>${esc(D.mapa.ter_em_maos)}</p></div>
          <div class="cartao"><h3>O que você recebe no final</h3><p>${esc(D.mapa.entrega)}</p></div>
          <div class="acoes">
            <button class="btn btn-primario seta" id="ir">${iniciado ? "Continuar de onde parei" : "Começar"}</button>
            ${iniciado ? `<button class="btn btn-claro" id="zerar">Recomeçar do zero</button>` : ""}
            <button class="btn btn-linha" id="base">Consultar a base local de CNAEs</button>
            <button class="btn btn-linha" id="limites">O que este módulo não faz</button>
          </div>
          ${rodape()}
        </main>
      </div>`);
    ligar(p);
    p.querySelector("#ir").onclick = () => {
      const atual = S.hist[S.hist.length - 1];
      if (atual === "RESULTADO") ir(telaResultado);
      else ir(telaPergunta, atual || Motor.proxima(M, S.R, null));
    };
    const z = p.querySelector("#zerar");
    if (z) z.onclick = () => { if (confirm("Apagar suas respostas e recomeçar?")) { S = novo(); salvar(); ir(telaCapa); } };
    p.querySelector("#limites").onclick = () => ir(telaLimites);
    p.querySelector("#base").onclick = () => ir(telaBase, telaCapa);
    return p;
  }

  function telaLimites() {
    const p = el(`
      <div class="pag">
        ${topo("Limites")}
        ${heroi({ titulo: "Limites do módulo" })}
        <main class="corpo">
          <div class="cartao"><h3>O que o módulo não faz</h3><p>${esc(D.mapa.nao_faz)}</p></div>
          <div class="cartao"><h3>Que decisões ele apoia</h3><p>${esc(D.mapa.decisoes)}</p></div>
          <div class="cartao"><h3>Quando procurar um profissional</h3><p>${esc(D.mapa.encaminhamentos)}</p></div>
          <div class="aviso">${esc(D.mapa.mensagem_limite)}</div>
          ${botaoVoltar()}
          ${rodape()}
        </main>
      </div>`);
    ligar(p);
    p.querySelector("#v").onclick = () => ir(telaCapa);
    return p;
  }

  /* ================= base local (M9.I02) ================= */
  function telaBase(voltar) {
    const I = D.instrumentos;
    const p = el(`
      <div class="pag">
        ${topo("Base local de CNAEs")}
        ${heroi({ titulo: I.I02_titulo })}
        <main class="corpo">
          <p class="ajuda">${esc(I.I02_intro)}</p>
          <input class="campo" id="busca" placeholder="Busque pelo CNAE ou pela atividade">
          <div id="lista"></div>
          ${botaoVoltar()}
          ${rodape()}
        </main>
      </div>`);
    ligar(p);
    const lista = p.querySelector("#lista");
    const sem = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const desenhar = (t) => {
      const q = sem(t || "");
      const linhas = I.I02.filter((l) => l.cnae && (!q || sem(l.cnae + " " + l.atividade + " " + l.grupo).includes(q)));
      lista.innerHTML = linhas.map(linhaCnae).join("") || `<p class="ajuda">Nenhum CNAE encontrado neste recorte.</p>`;
    };
    p.querySelector("#busca").oninput = (e) => desenhar(e.target.value);
    desenhar("");
    p.querySelector("#v").onclick = () => ir(voltar || telaCapa);
    return p;
  }
  function linhaCnae(l) {
    const n = { "Nível I": 1, "Nível II": 2, "Nível III": 3 }[l.nivel] || 0;
    return `<div class="cnae">
      <div class="cnae-topo"><b>${esc(l.cnae)}</b><span class="nivel n${n}">${esc(l.nivel)}</span></div>
      <p>${esc(l.atividade)}</p>
      <p class="ex">${esc(l.significa)}</p>
      <p class="mini-info">Residência (Dec. 15.004/2022): ${esc(l.residencia)}${vazio(l.alertas) ? "" : ` · ${esc(l.alertas)}`}</p>
    </div>`;
  }

  /* ================= pergunta ================= */
  function progresso() {
    const vistas = S.hist.filter((c) => c !== "RESULTADO").length;
    return Math.min(100, Math.round((vistas / M.perguntas.length) * 100));
  }

  function telaPergunta(cod) {
    const q = M.porCodigo[cod];
    if (S.hist[S.hist.length - 1] !== cod) { S.hist.push(cod); salvar(); }
    const tipo = Motor.campo(q);
    const resp = S.R[cod] || null;
    let escolhida = resp && resp.estado === "opcao" ? resp.opcao : null;

    const p = el(`
      <div class="pag">
        ${topo("Perguntas")}
        ${heroi({ titulo: D.modulo.nome, extra: `<div class="progresso">
          <div class="passo">Pergunta ${M.perguntas.indexOf(q) + 1} de ${M.perguntas.length}</div>
          <div class="barra"><div class="barra-fill" style="width:${progresso()}%"></div></div>
        </div>` })}
        <main class="corpo">
          <div class="cartao-q pergunta">
            <h2 class="q">${esc(q.pergunta)}</h2>
            <div class="entrada" id="ent"></div>
            ${Motor.temNaoSei(q) ? `<div class="alt"><button class="btn-alt" id="ns">Não sei</button></div>` : ""}
            <div class="erro" id="erro" hidden></div>
            ${dica(q.ajuda)}
            <div id="retorno"></div>
            ${blocoEducativo(educativoDe(cod))}
            ${blocoConceitos(conceitosDe(q))}
            <div class="acoes" id="acoes"><button class="btn btn-primario seta" id="ok">Continuar</button></div>
            ${botaoVoltar()}
          </div>
          ${rodape()}
        </main>
      </div>`);
    ligar(p);
    ligarCopiar(p);

    p.querySelector("#v").onclick = () => {
      S.hist.pop();
      const ant = S.hist.pop();
      salvar();
      if (ant) ir(telaPergunta, ant); else ir(telaCapa);
    };

    const ent = p.querySelector("#ent");
    if (tipo === "escolha") {
      ent.classList.add("opcoes");
      q.opcoesLista.forEach((op) => {
        const b = el(`<button class="opcao ${escolhida === op ? "sel" : ""}"><span class="radio" aria-hidden="true"></span><span class="op-txt"><b>${esc(op)}</b></span></button>`);
        b.onclick = () => { escolhida = op; ent.querySelectorAll(".opcao").forEach((x) => x.classList.remove("sel")); b.classList.add("sel"); };
        ent.appendChild(b);
      });
    } else {
      const v = resp && resp.estado === "valor" ? resp.valor : "";
      ent.appendChild(el(tipo === "numero"
        ? `<div class="linha"><input class="campo" inputmode="decimal" value="${esc(v)}"><span class="pre">m²</span></div>`
        : `<textarea class="campo" rows="3">${esc(v)}</textarea>`));
    }
    const ns = p.querySelector("#ns");
    if (ns) ns.onclick = () => responder({ estado: "naosei" });

    p.querySelector("#ok").onclick = () => {
      if (tipo === "escolha") {
        if (!escolhida) return erro("Escolha uma opção para continuar.");
        return responder({ estado: "opcao", opcao: escolhida });
      }
      const v = ent.querySelector("input,textarea").value.trim();
      if (!v) return erro(Motor.temNaoSei(q) ? "Responda ou toque em \"Não sei\"." : "Responda para continuar.");
      if (tipo === "numero" && isNaN(parseFloat(v.replace(/\./g, "").replace(",", ".")))) return erro("Informe um número.");
      responder({ estado: "valor", valor: v });
    };
    function erro(t) { const e = p.querySelector("#erro"); e.textContent = t; e.hidden = false; }

    function responder(r0) {
      p.querySelector("#erro").hidden = true;
      S.R[cod] = r0;
      /* respostas de perguntas que deixaram de aparecer são descartadas */
      limparInvisiveis();
      salvar();
      const regras = Motor.regrasAgora(M, S.R, cod);
      const prox = Motor.proxima(M, S.R, cod);
      mostrarRetorno(regras, prox);
    }

    function mostrarRetorno(regras, prox) {
      const box = p.querySelector("#retorno");
      const cnaes = cod === "M9.P05" ? Motor.cnaes(M, S.R) : [];
      box.innerHTML = `<div class="retorno">
        <p class="r-texto r-pergunta">${esc(q.resposta)}</p>
        ${cnaes.map((c) => c.linha ? linhaCnae(c.linha) : `<div class="cnae"><div class="cnae-topo"><b>${esc(c.cnae)}</b><span class="nivel n0">fora do recorte</span></div><p class="ex">${esc(D.instrumentos.lista[1].regra)}</p></div>`).join("")}
        ${regras.map((r) => `
          <div class="regra">
            <p class="r-texto">${esc(r.texto)}</p>
            ${vazio(r.alerta) ? "" : `<div class="bloco b-alerta"><b>Atenção</b>${esc(r.alerta)}</div>`}
            ${vazio(r.proximo) ? "" : `<div class="bloco b-proximo"><b>Próximo passo</b>${esc(r.proximo)}</div>`}
            ${vazio(r.encaminhamento) ? "" : `<div class="bloco b-enc"><b>Quem procurar</b>${esc(r.encaminhamento)}</div>`}
          </div>`).join("")}
        ${vazio(q.alerta) ? "" : `<div class="bloco b-alerta"><b>Atenção</b>${esc(q.alerta)}</div>`}
      </div>`;
      const acoes = p.querySelector("#acoes");
      acoes.innerHTML = "";
      const b = el(`<button class="btn btn-primario seta">${prox === "RESULTADO" ? "Ver meu checklist" : "Seguir"}</button>`);
      b.onclick = () => { if (prox === "RESULTADO") { S.hist.push("RESULTADO"); salvar(); ir(telaResultado); } else ir(telaPergunta, prox); };
      acoes.appendChild(b);
      const c = el(`<button class="btn btn-claro">Corrigir minha resposta</button>`);
      c.onclick = () => ir(telaPergunta, cod);
      acoes.appendChild(c);
      box.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    return p;
  }

  function limparInvisiveis() {
    let cod = Motor.proxima(M, {}, null);
    const vis = new Set();
    const R = {};
    while (cod !== "RESULTADO") {
      vis.add(cod);
      if (S.R[cod] === undefined) break;
      R[cod] = S.R[cod];
      cod = Motor.proxima(M, R, cod);
    }
    Object.keys(S.R).forEach((k) => { if (!vis.has(k)) delete S.R[k]; });
  }

  /* ================= resultado (M9.I01 + I03 + I04) ================= */
  function telaResultado() {
    const I = D.instrumentos;
    const nv = Motor.nivel(M, S.R);
    const regras = Motor.regrasTodas(M, S.R);
    const ck = Motor.checklist(M, S.R);
    const org = Motor.orgaos(M, S.R, ck);
    const rot = Motor.roteiro(M, S.R);
    const lac = Motor.lacunas(regras);
    const enc = Motor.encaminhamentos(regras);
    const ale = Motor.alertas(regras);
    const ordem = { "aplica-se": 0, confirmar: 1, "não se aplica": 2 };
    const cks = ck.slice().sort((a, b) => ordem[a.situacao] - ordem[b.situacao]);
    const cnaes = Motor.cnaes(M, S.R);
    const exemplo = I.lista[0] || {};

    const p = el(`
      <div class="pag">
        ${topo("Resultado")}
        ${heroi({ kicker: "Resultado", kickerClasse: "passo", titulo: I.I01_titulo })}
        <main class="corpo">
          <section class="concluido">
            <div class="conc-topo"><span class="check" aria-hidden="true"></span><div><h2>Você concluiu o Módulo ${esc(D.modulo.numero)}</h2><p>Veja abaixo o resultado pelas suas respostas.</p></div></div>
          </section>
          <div class="res-num">
            <div class="lbl">Nível de risco provável</div>
            <div class="val">${nv ? esc(nv.rotulo) : "A confirmar"}</div>
            ${nv ? `<div class="sub">${esc(nv.linha.significa)}</div>` : ""}
          </div>
          ${cnaes.length ? cnaes.map((c) => c.linha ? linhaCnae(c.linha) : `<div class="cnae"><div class="cnae-topo"><b>${esc(c.cnae)}</b><span class="nivel n0">fora do recorte</span></div><p class="ex">${esc(I.lista[1].regra)}</p></div>`).join("") : ""}
          <div class="aviso">${esc(exemplo.limite)}</div>

          <div class="secao-titulo">Checklist</div>
          <p class="ajuda">${esc(I.I01_intro)}</p>
          ${cks.map((l) => `
            <div class="etapa e-${l.situacao === "aplica-se" ? "sim" : l.situacao === "confirmar" ? "conf" : "nao"}">
              <div class="etapa-topo"><span class="etq">${esc(l.etapa)}</span><b>${esc(l.oque)}</b><span class="sit">${esc(l.situacao)}</span></div>
              ${l.situacao === "não se aplica" ? "" : `
                <p class="mini-info"><b>Quando:</b> ${esc(l.quando)} · <b>Órgão:</b> ${esc(l.orgao)}</p>
                <p>${esc(l.como)}</p>
                <span class="fonte">${link(l.link, l.fonte)}</span>`}
            </div>`).join("")}

          ${ale.length ? `<div class="secao-titulo">Alertas</div>${ale.map((a) => `<div class="bloco b-alerta">${esc(a)}</div>`).join("")}` : ""}

          <div class="secao-titulo">${esc(I.I03_titulo)}</div>
          <p class="ajuda">${esc(I.I03_intro)}</p>
          ${org.map((o) => `<div class="cartao"><h3>${esc(o.orgao)}</h3><p>${esc(o.quando)}</p>
            <p class="mini-info">${link(o.canal)}${vazio(o.obs) ? "" : ` · ${esc(o.obs)}`}</p></div>`).join("")}
          ${enc.length ? `<div class="bloco b-enc"><b>Quem procurar, pelas suas respostas</b>${enc.map(esc).join(" · ")}</div>` : ""}

          ${lac.length ? `<div class="bloco b-lacuna"><b>O que ainda falta saber</b><ul>${lac.map((l) => `<li>${esc(l)}</li>`).join("")}</ul></div>` : ""}

          <div class="secao-titulo">${esc(I.I04_titulo)}</div>
          <p class="ajuda">${esc(I.I04_intro)}</p>
          <ol class="roteiro">${rot.map((r) => `<li><b>${esc(r.tema)}</b> ${esc(r.pergunta)}</li>`).join("")}</ol>

          <div class="aviso">${esc(D.mapa.mensagem_limite)}</div>

          <div class="acoes">
            <button class="btn btn-primario" id="imp">Salvar ou imprimir</button>
            <button class="btn btn-claro" id="rev">Revisar respostas</button>
            <button class="btn btn-linha" id="base">Consultar a base local de CNAEs</button>
            <button class="btn btn-linha" id="novo">Começar outra análise</button>
          </div>
          ${botaoVoltar()}
          <div class="acoes lg2-proximo"><a class="btn btn-primario" style="text-decoration:none;text-align:center;box-sizing:border-box" href="/lg2/turma-b/m10/index.html">Ir para o Módulo 10</a></div>
          ${rodape()}
        </main>
      </div>`);
    ligar(p);
    p.querySelector("#v").onclick = () => { S.hist.pop(); const a = S.hist.pop(); salvar(); ir(telaPergunta, a); };
    p.querySelector("#imp").onclick = () => window.print();
    p.querySelector("#rev").onclick = () => { S.hist = []; salvar(); ir(telaPergunta, Motor.proxima(M, {}, null)); };
    p.querySelector("#base").onclick = () => ir(telaBase, telaResultado);
    p.querySelector("#novo").onclick = () => { if (confirm("Começar uma nova análise? As respostas atuais serão apagadas.")) { S = novo(); salvar(); ir(telaPergunta, Motor.proxima(M, {}, null)); } };
    return p;
  }

  function rodape() {
    return `<footer class="rodape">
      <p class="credito">Conteúdo do Grupo ${esc(D.modulo.numero)} · Laboratório de Gestão II · FACC/UFJF · versão ${esc(D.modulo.versao)} · fontes consultadas em ${esc(D.modulo.data)}</p>
      <div class="logos">
        <img src="assets/logo_facc.png" alt="FACC">
        <img src="assets/logo_ufjf.svg" alt="UFJF">
        <img src="assets/logo_mg.svg" alt="Governo de Minas Gerais">
      </div>
    </footer>`;
  }

  ir(telaCapa);
})();
