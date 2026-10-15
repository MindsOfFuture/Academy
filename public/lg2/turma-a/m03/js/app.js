/* Telas do Módulo 3. Todo texto de conteúdo vem de window.MODULO3 (a planilha),
   sem edição. As respostas ficam só neste aparelho. */
(function () {
  "use strict";
  const D = window.MODULO3, M = Motor.montar(D);
  const tela = document.getElementById("tela");
  const CHAVE = "lg2-turma-a-m03";
  /* o módulo mudou de turma em 15/10: traz as respostas salvas na chave antiga */
  try { const antiga = localStorage.getItem("lg2-turma-b-m03"); if (antiga && !localStorage.getItem(CHAVE)) localStorage.setItem(CHAVE, antiga); } catch (e) {}
  const vazio = (s) => !s || !String(s).trim() || s === "—" || s === "-" || s === "Nenhum" || s === "Nenhuma";

  /* VERSAO: sobe quando o formato das respostas muda (caminhos por resposta, P15 múltipla),
     para descartar respostas antigas gravadas sob a mesma CHAVE */
  const VERSAO = 2;
  let S = carregar();               // { v, R: respostas, hist: [códigos] }
  function carregar() {
    try { const s = JSON.parse(localStorage.getItem(CHAVE)); return s && s.v === VERSAO ? s : novo(); } catch { return novo(); }
  }
  function novo() { return { v: VERSAO, R: {}, hist: [] }; }
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
    const nsRot = Motor.temNaoSei(q);
    let escolhida = resp && resp.estado === "opcao" ? resp.opcao : null;
    let marcadas = resp && resp.estado === "opcoes" ? resp.opcoes.slice() : [];
    const abreCampo = (op) => /^Outr[oa]\b/.test(op);   // "Outro" (P02) e "Outra dúvida" (P15) abrem campo

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
            ${tipo === "multipla" ? `<p class="mini-info" id="multi-aviso">Você pode marcar mais de uma opção.</p>` : ""}
            <div class="entrada" id="ent"></div>
            ${nsRot ? `<div class="alt"><button class="btn-alt" id="ns">${esc(nsRot)}</button></div>` : ""}
            <div class="erro" id="erro" hidden></div>
            <div id="caminho"></div>
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
    const boxCaminho = p.querySelector("#caminho");
    function mostrarCaminhos(lista) {
      boxCaminho.innerHTML = lista.map((c) => `
        <div class="bloco caminho ${c.tipo === "Resposta" ? "b-resp" : "b-dica"}" data-op="${esc(c.opcao)}"><b>${esc(c.tipo)}</b>${esc(c.texto)}</div>`).join("");
    }
    /* campo extra: "Outro"/"Outra dúvida" (abre só quando marcado) e o detalhe livre da M3.P05 */
    let extra = null;
    if (tipo === "escolha" || tipo === "multipla" || tipo === "escolhatexto") {
      ent.classList.add("opcoes");
      q.opcoesLista.forEach((op) => {
        const sel = tipo === "multipla" ? marcadas.includes(op) : escolhida === op;
        const b = el(`<button class="opcao ${sel ? "sel" : ""}" ${tipo === "multipla" ? `role="checkbox" aria-checked="${sel}"` : ""}><b>${esc(op)}</b></button>`);
        b.dataset.op = op;
        b.onclick = () => {
          if (tipo === "multipla") {
            if (marcadas.includes(op)) marcadas = marcadas.filter((x) => x !== op);
            /* "Não sei" é exclusivo: marcá-lo limpa as outras, e marcar outra limpa o "Não sei" */
            else marcadas = op === Motor.NS ? [op] : marcadas.filter((x) => x !== Motor.NS).concat(op);
          } else escolhida = op;
          pintar();
        };
        ent.appendChild(b);
      });
      const precisaExtra = q.opcoesLista.some(abreCampo) || tipo === "escolhatexto";
      if (precisaExtra) {
        const v0 = resp ? (tipo === "escolhatexto" ? resp.valor : resp.detalhe) || "" : "";
        extra = el(`<label class="item extra" id="extra"><span>${tipo === "escolhatexto" ? "Se quiser, conte com suas palavras" : "Explique aqui"}</span>
          <textarea class="campo" rows="3">${esc(v0)}</textarea></label>`);
        ent.after(extra);
      }
    } else {
      const v = resp && resp.estado === "valor" ? resp.valor : "";
      ent.appendChild(el(tipo === "numero"
        ? `<div class="linha"><input class="campo" inputmode="decimal" value="${esc(v)}"><span class="pre">R$</span></div>`
        : tipo === "inteiro"
        ? `<div class="linha"><input class="campo" type="text" inputmode="numeric" pattern="[0-9]*" autocomplete="off" value="${esc(v)}"></div>`
        : `<textarea class="campo" rows="3">${esc(v)}</textarea>`));
    }
    function pintar() {
      ent.querySelectorAll(".opcao").forEach((x) => {
        const on = tipo === "multipla" ? marcadas.includes(x.dataset.op) : escolhida === x.dataset.op;
        x.classList.toggle("sel", on);
        if (tipo === "multipla") x.setAttribute("aria-checked", on);
      });
      if (extra && tipo !== "escolhatexto") extra.hidden = !(tipo === "multipla" ? marcadas.some(abreCampo) : abreCampo(escolhida || ""));
      if (tipo === "multipla") mostrarCaminhos(Motor.retornos(q, { estado: "opcoes", opcoes: marcadas }));
      else if (escolhida) mostrarCaminhos(Motor.retornos(q, { estado: "opcao", opcao: escolhida }));
    }
    if (ent.classList.contains("opcoes")) pintar();
    else if (resp) mostrarCaminhos(Motor.retornos(q, resp));

    const ns = p.querySelector("#ns");
    if (ns) ns.onclick = () => responder({ estado: "naosei" });

    p.querySelector("#ok").onclick = () => {
      const txtExtra = extra ? extra.querySelector("textarea").value.trim() : "";
      if (tipo === "escolha") {
        if (!escolhida) return erro("Escolha uma opção para continuar.");
        const r = { estado: "opcao", opcao: escolhida };
        if (abreCampo(escolhida) && txtExtra) r.detalhe = txtExtra;
        return responder(r);
      }
      if (tipo === "multipla") {
        if (!marcadas.length) return erro("Marque pelo menos uma opção para continuar.");
        const r = { estado: "opcoes", opcoes: q.opcoesLista.filter((o) => marcadas.includes(o)) };
        if (marcadas.some(abreCampo) && txtExtra) r.detalhe = txtExtra;
        return responder(r);
      }
      if (tipo === "escolhatexto") {
        if (!escolhida && !txtExtra) return erro("Escolha uma opção ou escreva sua resposta para continuar.");
        return responder(escolhida ? Object.assign({ estado: "opcao", opcao: escolhida }, txtExtra ? { valor: txtExtra } : {}) : { estado: "valor", valor: txtExtra });
      }
      const v = ent.querySelector("input,textarea").value.trim();
      if (!v) return erro(nsRot ? `Responda ou toque em "${nsRot}".` : "Responda para continuar.");
      if (tipo === "inteiro" && !Motor.inteiroValido(v)) {
        /* número inválido: mostra a dica do grupo e não avança */
        p.querySelector("#erro").hidden = true;
        p.querySelector("#retorno").innerHTML = "";
        return mostrarCaminhos([Motor.caminho(q, "Número inválido")].filter(Boolean));
      }
      if (tipo === "numero" && isNaN(parseFloat(v.replace(/\./g, "").replace(",", ".")))) return erro("Informe um número.");
      responder({ estado: "valor", valor: tipo === "inteiro" ? String(parseInt(v, 10)) : v });
    };
    function erro(t) { const e = p.querySelector("#erro"); e.textContent = t; e.hidden = false; }

    function responder(r0) {
      p.querySelector("#erro").hidden = true;
      S.R[cod] = r0;
      /* respostas de perguntas que deixaram de aparecer são descartadas */
      limparInvisiveis();
      salvar();
      mostrarCaminhos(Motor.retornos(q, r0));
      const regras = Motor.regrasAgora(M, S.R, cod);
      const prox = Motor.proxima(M, S.R, cod);
      mostrarRetorno(regras, prox);
    }

    function mostrarRetorno(regras, prox) {
      const box = p.querySelector("#retorno");
      box.innerHTML = `<div class="retorno">
        ${vazio(q.resposta) ? "" : `<p class="r-texto r-pergunta">${esc(q.resposta)}</p>`}
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

  /* ================= resultado: resumo das respostas + alertas da planilha ================= */
  function telaResultado() {
    const regras = Motor.regrasTodas(M, S.R);
    const lac = Motor.lacunas(regras), enc = Motor.encaminhamentos(regras), ale = Motor.alertas(regras);
    const resp = Motor.respondidas(M, S.R);
    const ns = resp.filter((q) => Motor.valor(S.R, q.codigo) === Motor.NS);
    const p = el(`
      <div class="pag">
        <header class="topo">
          <button class="voltar" id="v">‹ voltar</button>
          <div class="passo">Resultado</div>
          <h2>Resumo das suas respostas</h2>
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
              <p>${esc(Motor.texto(S.R, q.codigo))}</p>
              ${Motor.retornos(q, S.R[q.codigo]).map((c) => `<p class="mini-info"><b>${esc(c.tipo)}:</b> ${esc(c.texto)}</p>`).join("")}
              ${vazio(q.alerta) ? "" : `<p class="mini-info"><b>Atenção:</b> ${esc(q.alerta)}</p>`}
            </div>`).join("")}
  
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
            <button class="btn btn-linha" id="novo">Começar outra análise</button>
          </div>
          ${rodape()}
        </main>
      </div>`);
    p.querySelector("#v").onclick = () => { S.hist.pop(); const a = S.hist.pop(); salvar(); ir(telaPergunta, a); };
    p.querySelector("#imp").onclick = () => window.print();
    p.querySelector("#rev").onclick = () => { S.hist = []; salvar(); ir(telaPergunta, Motor.proxima(M, {}, null)); };
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
