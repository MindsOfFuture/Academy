/* Telas do Módulo 8. Todo texto de conteúdo vem de window.MODULO8 (a planilha),
   sem edição. As respostas ficam só neste aparelho. */
(function () {
  "use strict";
  const D = window.MODULO8, M = Motor.montar(D);
  const tela = document.getElementById("tela");
  const CHAVE = "lg2-turma-b-m08";
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

  /* ================= capa ================= */
  function telaCapa() {
    const iniciado = S.hist.length > 0;
    const p = el(`
      <div class="pag">
        <header class="capa">
          <img class="logo" src="assets/minds.svg" alt="Minds of the Future">
          <div class="sobre">Módulo ${esc(D.modulo.numero)}</div>
          <h1>${esc(D.modulo.nome)}</h1>
          <p>${esc(D.mapa.objetivo)}</p>
        </header>
        <main class="corpo">
          <div class="cartao"><h3>Para quem é</h3><p>${esc(D.mapa.usuario)}</p></div>
          <div class="cartao"><h3>O que ter em mãos</h3><p>${esc(D.mapa.ter_em_maos)}</p></div>
          <div class="cartao"><h3>O que você recebe no final</h3><p>${esc(D.mapa.entrega)}</p></div>
          <div class="acoes">
            <button class="btn btn-primario" id="ir">${iniciado ? "Continuar de onde parei" : "Começar"}</button>
            ${iniciado ? `<button class="btn btn-claro" id="zerar">Recomeçar do zero</button>` : ""}
            <button class="btn btn-linha" id="base">Consultar as ocupações permitidas ao MEI</button>
            <button class="btn btn-linha" id="limites">O que este módulo não faz</button>
          </div>
          ${rodape()}
        </main>
      </div>`);
    p.querySelector("#ir").onclick = () => {
      const atual = S.hist[S.hist.length - 1];
      if (atual === "RESULTADO") ir(telaResultado);
      else ir(telaPergunta, atual || Motor.proxima(M, S.R, null));
    };
    const z = p.querySelector("#zerar");
    if (z) z.onclick = () => { if (confirm("Apagar suas respostas e recomeçar?")) { S = novo(); salvar(); ir(telaCapa); } };
    p.querySelector("#limites").onclick = () => ir(telaLimites);
    p.querySelector("#base").onclick = () => ir(telaBase, () => ir(telaCapa));
    return p;
  }

  function telaLimites() {
    const p = el(`
      <div class="pag">
        <header class="topo"><button class="voltar" id="v">‹ voltar</button><h2>Limites do módulo</h2></header>
        <main class="corpo">
          <div class="cartao"><h3>O que o módulo não faz</h3><p>${esc(D.mapa.nao_faz)}</p></div>
          <div class="cartao"><h3>Que decisões ele apoia</h3><p>${esc(D.mapa.decisoes)}</p></div>
          <div class="cartao"><h3>Quando procurar um profissional</h3><p>${esc(D.mapa.encaminhamentos)}</p></div>
          <div class="aviso">${esc(D.mapa.mensagem_limite)}</div>
          ${rodape()}
        </main>
      </div>`);
    p.querySelector("#v").onclick = () => ir(telaCapa);
    return p;
  }

  /* ================= Anexo XI (ocupações permitidas ao MEI) ================= */
  function telaBase(voltar, termo) {
    const AX = D.anexo;
    const p = el(`
      <div class="pag">
        <header class="topo"><button class="voltar" id="v">‹ voltar</button><h2>Ocupações permitidas ao MEI</h2></header>
        <main class="corpo">
          <p class="ajuda">${esc(AX.titulo)}</p>
          <input class="campo" id="busca" placeholder="Busque pela ocupação, pelo CNAE ou pela descrição" value="${esc(termo || "")}">
          <p class="mini-info" id="conta"></p>
          <div id="lista"></div>
          ${rodape()}
        </main>
      </div>`);
    const lista = p.querySelector("#lista");
    const desenhar = (t) => {
      const linhas = Motor.buscarAnexo(M, t);
      p.querySelector("#conta").textContent = `${linhas.length} de ${AX.linhas.length} ocupações`;
      lista.innerHTML = linhas.slice(0, 80).map(linhaAnexo).join("") || `<p class="ajuda">Nenhuma ocupação encontrada.</p>`;
    };
    p.querySelector("#busca").oninput = (e) => desenhar(e.target.value);
    desenhar(termo || "");
    p.querySelector("#v").onclick = () => voltar ? voltar() : ir(telaCapa);
    return p;
  }
  function linhaAnexo(l) {
    return `<div class="cnae">
      <div class="cnae-topo"><b>${esc(l.cnae)}</b><span class="nivel n1">${esc(l.tabela)}</span></div>
      <p><b>${esc(l.ocupacao)}</b></p>
      <p class="ex">${esc(l.descricao)}</p>
      <p class="mini-info">ISS: ${esc(l.iss)} · ICMS: ${esc(l.icms)}</p>
    </div>`;
  }

  /* ================= pergunta ================= */
  function progresso() {
    const vistas = S.hist.filter((c) => c !== "RESULTADO").length;
    return Math.min(100, Math.round((vistas / M.perguntas.length) * 100));
  }

  const LIGA_ANEXO = ["M8.P06", "M8.P07"];   // perguntas que citam CNAE / lista de ocupações MEI
  function telaPergunta(cod) {
    const q = M.porCodigo[cod];
    if (S.hist[S.hist.length - 1] !== cod) { S.hist.push(cod); salvar(); }
    const tipo = Motor.campo(q);
    const resp = S.R[cod] || null;
    let escolhida = resp && resp.estado === "opcao" ? resp.opcao : null;

    const p = el(`
      <div class="pag">
        <header class="topo">
          <button class="voltar" id="v">‹ ${S.hist.length > 1 ? "voltar" : "início"}</button>
          <div class="passo">Pergunta ${M.perguntas.indexOf(q) + 1} de ${M.perguntas.length}</div>
          <div class="barra"><div class="barra-fill" style="width:${progresso()}%"></div></div>
        </header>
        <main class="corpo">
          <div class="pergunta">
            <h2 class="q">${esc(q.pergunta)}</h2>
            <p class="ajuda">${esc(q.ajuda)}</p>
            <div class="entrada" id="ent"></div>
            ${Motor.temNaoSei(q) ? `<div class="alt"><button class="btn-alt" id="ns">Não sei</button></div>` : ""}
            <div class="erro" id="erro" hidden></div>
            ${LIGA_ANEXO.includes(cod) ? `<div class="alt"><button class="btn-alt" id="anexo">Consultar as ocupações permitidas ao MEI</button></div>` : ""}
          </div>
          <div id="retorno"></div>
          ${blocoEducativo(educativoDe(cod))}
          ${blocoConceitos(conceitosDe(q))}
          <div class="acoes" id="acoes"><button class="btn btn-primario" id="ok">Continuar</button></div>
        </main>
      </div>`);
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
        const b = el(`<button class="opcao ${escolhida === op ? "sel" : ""}"><b>${esc(op)}</b></button>`);
        b.onclick = () => { escolhida = op; ent.querySelectorAll(".opcao").forEach((x) => x.classList.remove("sel")); b.classList.add("sel"); };
        ent.appendChild(b);
      });
    } else {
      const v = resp && resp.estado === "valor" ? resp.valor : "";
      ent.appendChild(el(tipo === "numero"
        ? `<div class="linha"><input class="campo" inputmode="decimal" value="${esc(v)}"><span class="pre">R$</span></div>`
        : `<textarea class="campo" rows="3">${esc(v)}</textarea>`));
    }
    const ax = p.querySelector("#anexo");
    if (ax) ax.onclick = () => {
      const t = ent.querySelector("input,textarea");
      ir(telaBase, () => ir(telaPergunta, cod), t && cod === "M8.P06" ? t.value : "");
    };
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
      const cnaes = cod === "M8.P06" ? Motor.cnaes(M, S.R) : [];
      box.innerHTML = `<div class="retorno">
        ${vazio(q.resposta) ? "" : `<p class="r-texto r-pergunta">${esc(q.resposta)}</p>`}
        ${cnaes.map(blocoCnae).join("")}
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
      const b = el(`<button class="btn btn-primario">${prox === "RESULTADO" ? "Ver meu resumo" : "Seguir"}</button>`);
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

  function blocoCnae(c) {
    return c.linhas.length
      ? `<p class="mini-info">CNAE ${esc(c.cnae)} na lista de ocupações permitidas ao MEI (Anexo XI):</p>${c.linhas.map(linhaAnexo).join("")}`
      : `<div class="cnae"><div class="cnae-topo"><b>${esc(c.cnae)}</b><span class="nivel n0">não consta no Anexo XI</span></div></div>`;
  }

  /* ================= resultado: resumo das respostas + alertas da planilha ================= */
  function telaResultado() {
    const regras = Motor.regrasTodas(M, S.R);
    const lac = Motor.lacunas(regras), enc = Motor.encaminhamentos(regras), ale = Motor.alertas(regras);
    const resp = Motor.respondidas(M, S.R);
    const ns = resp.filter((q) => Motor.valor(S.R, q.codigo) === Motor.NS);
    const cnaes = Motor.cnaes(M, S.R);
    const p = el(`
      <div class="pag">
        <header class="topo">
          <button class="voltar" id="v">‹ voltar</button>
          <div class="passo">Resultado</div>
          <h2>Resumo da sua formalização</h2>
        </header>
        <main class="corpo">
          <div class="res-num">
            <div class="lbl">Perguntas respondidas</div>
            <div class="val">${resp.length}</div>
            <div class="sub">${ns.length ? `${ns.length} com “Não sei”` : "nenhuma com “Não sei”"}</div>
          </div>
          <div class="aviso">${esc(D.mapa.mensagem_limite)}</div>

          <div class="secao-titulo">Suas respostas</div>
          ${resp.map((q) => `
            <div class="etapa ${Motor.valor(S.R, q.codigo) === Motor.NS ? "e-conf" : "e-sim"}">
              <div class="etapa-topo"><span class="etq">${esc(q.codigo.slice(3))}</span><b>${esc(q.pergunta)}</b></div>
              <p>${esc(Motor.valor(S.R, q.codigo))}</p>
              ${vazio(q.alerta) ? "" : `<p class="mini-info"><b>Atenção:</b> ${esc(q.alerta)}</p>`}
            </div>`).join("")}
          ${cnaes.map(blocoCnae).join("")}

          ${regras.length ? `<div class="secao-titulo">Orientações</div>${regras.map((r) => `<div class="cartao"><p>${esc(r.texto)}</p>
            ${vazio(r.proximo) ? "" : `<p class="mini-info"><b>Próximo passo:</b> ${esc(r.proximo)}</p>`}</div>`).join("")}` : ""}
          ${ale.length ? `<div class="secao-titulo">Alertas</div>${ale.map((a) => `<div class="bloco b-alerta">${esc(a)}</div>`).join("")}` : ""}
          ${lac.length ? `<div class="bloco b-lacuna"><b>O que ainda falta saber</b><ul>${lac.map((l) => `<li>${esc(l)}</li>`).join("")}</ul></div>` : ""}
          ${enc.length ? `<div class="bloco b-enc"><b>Quem procurar, pelas suas respostas</b>${enc.map(esc).join(" · ")}</div>` : ""}

          <div class="secao-titulo">O que este módulo entrega</div>
          <div class="cartao"><p>${esc(D.mapa.entrega)}</p></div>
          <div class="cartao"><h3>Quando procurar um profissional</h3><p>${esc(D.mapa.encaminhamentos)}</p></div>
          ${blocoConceitos(D.base)}

          <div class="acoes">
            <button class="btn btn-primario" id="imp">Salvar ou imprimir</button>
            <button class="btn btn-claro" id="rev">Revisar respostas</button>
            <button class="btn btn-linha" id="base">Consultar as ocupações permitidas ao MEI</button>
            <button class="btn btn-linha" id="novo">Começar outra análise</button>
          </div>
          ${rodape()}
        </main>
      </div>`);
    p.querySelector("#v").onclick = () => { S.hist.pop(); const a = S.hist.pop(); salvar(); ir(telaPergunta, a); };
    p.querySelector("#imp").onclick = () => window.print();
    p.querySelector("#rev").onclick = () => { S.hist = []; salvar(); ir(telaPergunta, Motor.proxima(M, {}, null)); };
    p.querySelector("#base").onclick = () => ir(telaBase, () => ir(telaResultado));
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
