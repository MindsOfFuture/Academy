/* Telas do Módulo 2. Todo texto de conteúdo vem de window.MODULO2 (a planilha),
   sem edição. As respostas ficam só neste aparelho. */
(function () {
  "use strict";
  const D = window.MODULO2, M = Motor.montar(D);
  const tela = document.getElementById("tela");
  const CHAVE = "lg2-turma-a-m02";
  const vazio = (s) => !s || !String(s).trim() || s === "—" || s === "-" || s === "Nenhum" || s === "Nenhuma";

  let S = carregar();               // { R: respostas, hist: [códigos] }
  function carregar() { try { return Object.assign(novo(), JSON.parse(localStorage.getItem(CHAVE)) || {}); } catch { return novo(); } }
  function novo() { return { R: {}, hist: [], fichas: [], plano: { meta: "", prazo: "", feitos: [] }, grupos: [] }; }
  function salvar() { try { localStorage.setItem(CHAVE, JSON.stringify(S)); } catch {} }

  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const link = (u, t) => /^https?:/.test(u || "") ? `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(t || u)}</a>` : esc(t || u);
  function el(html) { const d = document.createElement("div"); d.innerHTML = html.trim(); return d.firstElementChild; }
  function ir(f, a) { tela.innerHTML = ""; tela.appendChild(f(a)); window.scrollTo(0, 0); }

  /* conceitos da Base técnica: a planilha não liga conceito a pergunta; mostramos todos em "Entenda os termos" no resultado */
  const conceitosDe = () => [];
  const videosDe = (cod) => (D.videos || []).filter((v) => v.onde === cod);
  function blocoVideos(lista) {
    return lista.map((v) => `<div class="cartao"><span class="tag">Vídeo · ${esc(v.duracao)} s</span><h3>${esc(v.titulo)}</h3><p>${esc(v.objetivo)}</p>
      <p class="mini-info">${link(v.link, v.link)}</p></div>`).join("");
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
            <button class="btn btn-linha" id="inst">Instrumentos: roteiro, ficha, plano e quadro</button>
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
    p.querySelector("#inst").onclick = () => ir(telaInstrumentos, telaCapa);
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

  /* ================= instrumentos (aba 5: M2.I01 a M2.I05) ================= */
  const I = (c) => D.instrumentos.lista.find((l) => l.codigo === c) || {};
  function cabInst(l) {
    return `<div class="secao-titulo">${esc(l.codigo)} · ${esc(l.nome)}</div>
      <p class="ajuda">${esc(l.objetivo)}</p>
      <p class="mini-info"><b>${esc(l.tipo)}.</b> ${esc(l.regra)}</p>
      <details class="saiba"><summary>Exemplo do grupo</summary><div class="conceito"><p>${esc(l.ex_entrada)}</p><p class="ex">${esc(l.ex_saida)}</p></div></details>`;
  }
  /* passos do plano de coleta: os trechos literais da coluna "O que calcula ou mostra" */
  function passosPlano() {
    const t = String(I("M2.I03").mostra || "");
    const corpo = t.includes(":") ? t.slice(t.indexOf(":") + 1) : t;
    return corpo.split(/,\s+|\s+e\s+(?=registrar)/).map((s) => s.trim()).filter(Boolean);
  }
  function telaInstrumentos(voltar) {
    const i1 = I("M2.I01"), i2 = I("M2.I02"), i3 = I("M2.I03"), i4 = I("M2.I04"), i5 = I("M2.I05");
    S.grupos = S.grupos || [];
    const SG = Motor.segmentos(S.grupos);
    const nota = (g, k) => `<div class="opcoes mini">${[1, 2, 3].map((n) => `<button class="opcao ${+g[k] === n ? "sel" : ""}" data-g="${g.i}" data-k="${k}" data-n="${n}">${n}</button>`).join("")}</div>`;
    const Q = Motor.quadro(S.fichas);
    const passos = passosPlano();
    const p = el(`
      <div class="pag">
        <header class="topo"><button class="voltar" id="v">‹ voltar</button><h2>Instrumentos</h2></header>
        <main class="corpo">
          ${cabInst(i1)}
          <div class="cartao"><h3>Antes da conversa</h3><p>${esc(D.base[2] ? D.base[2].definicao : "")}</p><p class="ex">${esc(D.base[2] ? D.base[2].exemplo : "")}</p></div>
          ${blocoEducativo(D.educativo.filter((e) => e.tipo === "Faça"))}
          <div class="aviso">${esc(i1.limite)}</div>

          ${cabInst(i2)}
          <div class="cartao" id="form">
            <h3>Registrar uma pessoa entrevistada</h3>
            <label class="mini-info">situação</label><textarea class="campo" rows="2" id="f-sit"></textarea>
            <label class="mini-info">frequência de compra</label><input class="campo" id="f-freq">
            <label class="mini-info">motivo de escolha</label><input class="campo" id="f-mot">
            <label class="mini-info">sinal de interesse (forte, fraco ou nenhum)</label>
            <div class="opcoes" id="f-sinal">${Motor.SINAIS.map((s) => `<button class="opcao" data-s="${s}"><b>${s}</b></button>`).join("")}</div>
            <div class="erro" id="f-erro" hidden></div>
            <div class="acoes"><button class="btn btn-primario" id="f-ok">Salvar na ficha</button></div>
          </div>
          <div id="fichas">${S.fichas.map((f, n) => `<div class="cartao"><div class="etapa-topo"><span class="etq">${n + 1}</span><b>sinal ${esc(f.sinal)}</b><button class="voltar x" data-n="${n}">remover</button></div>
            <p>${esc(f.situacao)}</p><p class="mini-info">${esc(f.frequencia)} · ${esc(f.motivo)}</p></div>`).join("")}</div>
          <div class="aviso">${esc(i2.limite)}</div>

          ${cabInst(i3)}
          <div class="cartao">
            ${passos.map((s, n) => `<label class="passo-plano ${S.plano.feitos[n] ? "feito" : ""}"><input type="checkbox" data-n="${n}" ${S.plano.feitos[n] ? "checked" : ""}> ${esc(s)}</label>`).join("")}
            <p class="mini-info">Entrevistas registradas na ficha: <b>${Q.total}</b>${S.plano.meta ? ` de ${esc(S.plano.meta)}` : ""}</p>
            <label class="mini-info">Meta de entrevistas</label><input class="campo" inputmode="numeric" id="p-meta" value="${esc(S.plano.meta)}">
            <label class="mini-info">Prazo</label><input class="campo" type="date" id="p-prazo" value="${esc(S.plano.prazo)}">
          </div>
          <div class="aviso">${esc(i3.limite)}</div>

          ${cabInst(i4)}
          <div class="res-num">
            <div class="lbl">${esc(i4.nome)}</div>
            <div class="val">${Q.contagem.forte} · ${Q.contagem.fraco} · ${Q.contagem.nenhum}</div>
            <div class="sub">forte · fraco · nenhum${Q.motivo ? ` — motivo mais citado: ${esc(Q.motivo.t)}` : ""}</div>
          </div>
          ${Q.total ? `<p class="r-texto" id="frase">${esc(Q.frase)}</p>` : ""}
          <div class="aviso">${esc(i4.limite)}</div>

          ${i5.codigo ? `${cabInst(i5)}
          <div class="cartao" id="grupos">
            ${SG.map((g) => `<div class="item"><div class="etapa-topo"><b>${esc(g.nome)}</b>${g.total !== null ? `<span class="etq">${g.total}</span>` : ""}<button class="voltar x" data-gx="${g.i}">remover</button></div>
              <label class="mini-info">facilidade de alcançar</label>${nota(g, "alcancar")}
              <label class="mini-info">necessidade</label>${nota(g, "necessidade")}
              <label class="mini-info">capacidade de pagar</label>${nota(g, "pagar")}</div>`).join("")}
            <label class="mini-info">Novo grupo</label><input class="campo" id="g-nome" value="${S.grupos.length ? "" : esc(Motor.valor(S.R, "M2.P06") && Motor.valor(S.R, "M2.P06") !== Motor.NS ? Motor.valor(S.R, "M2.P06") : "")}">
            <div class="acoes"><button class="btn btn-claro" id="g-ok">Adicionar grupo</button></div>
          </div>
          <div class="aviso">${esc(i5.limite)}</div>` : ""}
          ${rodape()}
        </main>
      </div>`);
    let sinal = null;
    p.querySelectorAll("#f-sinal .opcao").forEach((b) => (b.onclick = () => {
      sinal = b.dataset.s; p.querySelectorAll("#f-sinal .opcao").forEach((x) => x.classList.remove("sel")); b.classList.add("sel");
    }));
    p.querySelector("#f-ok").onclick = () => {
      const g = (id) => p.querySelector(id).value.trim();
      if (!sinal) { const e = p.querySelector("#f-erro"); e.textContent = "Escolha o sinal de interesse."; e.hidden = false; return; }
      S.fichas.push({ situacao: g("#f-sit"), frequencia: g("#f-freq"), motivo: g("#f-mot"), sinal });
      salvar(); ir(telaInstrumentos, voltar);
    };
    p.querySelectorAll("#fichas .x").forEach((b) => (b.onclick = () => { S.fichas.splice(+b.dataset.n, 1); salvar(); ir(telaInstrumentos, voltar); }));
    p.querySelectorAll("input[type=checkbox]").forEach((c) => (c.onchange = () => { S.plano.feitos[+c.dataset.n] = c.checked; salvar(); ir(telaInstrumentos, voltar); }));
    p.querySelector("#p-meta").onchange = (e) => { S.plano.meta = e.target.value.trim(); salvar(); ir(telaInstrumentos, voltar); };
    p.querySelector("#p-prazo").onchange = (e) => { S.plano.prazo = e.target.value; salvar(); };
    const gok = p.querySelector("#g-ok");
    if (gok) gok.onclick = () => { const v = p.querySelector("#g-nome").value.trim(); if (!v) return; S.grupos.push({ nome: v }); salvar(); ir(telaInstrumentos, voltar); };
    p.querySelectorAll("#grupos .opcao").forEach((b) => (b.onclick = () => { S.grupos[+b.dataset.g][b.dataset.k] = +b.dataset.n; salvar(); ir(telaInstrumentos, voltar); }));
    p.querySelectorAll("#grupos [data-gx]").forEach((b) => (b.onclick = () => { S.grupos.splice(+b.dataset.gx, 1); salvar(); ir(telaInstrumentos, voltar); }));
    p.querySelector("#v").onclick = () => ir(voltar || telaCapa);
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
          </div>
          <div id="retorno"></div>
          ${blocoEducativo(educativoDe(cod))}
          ${blocoVideos(videosDe(cod))}
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
        ? `<div class="linha"><input class="campo" inputmode="decimal" value="${esc(v)}"></div>`
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
      box.innerHTML = `<div class="retorno">
        <p class="r-texto r-pergunta">${esc(q.resposta)}</p>
        ${regras.map((r) => `
          <div class="regra">
            <p class="r-texto">${esc(r.texto)}</p>
            ${vazio(r.alerta) ? "" : `<div class="bloco b-alerta"><b>Atenção</b>${esc(r.alerta)}</div>`}
            ${vazio(r.proximo) ? "" : `<div class="bloco b-proximo"><b>Próximo passo</b>${esc(r.proximo)}</div>`}
            ${vazio(r.encaminhamento) ? "" : `<div class="bloco b-enc"><b>Quem procurar</b>${esc(r.encaminhamento)}</div>`}
          </div>`).join("")}
        ${vazio(q.alerta) ? "" : `<div class="bloco b-alerta"><b>Atenção</b>${esc(q.alerta)}</div>`}
        ${vazio(q.proximo) ? "" : `<div class="bloco b-proximo"><b>Próximo passo</b>${esc(q.proximo)}</div>`}
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

  /* ================= resultado ================= */
  function telaResultado() {
    const regras = Motor.regrasTodas(M, S.R);
    const lac = Motor.lacunas(regras), enc = Motor.encaminhamentos(regras);
    const ale = Motor.alertas(regras), prox = Motor.proximos(regras);
    const Q = Motor.quadro(S.fichas);
    const resp = M.perguntas.filter((q) => S.R[q.codigo] !== undefined);
    const p = el(`
      <div class="pag">
        <header class="topo">
          <button class="voltar" id="v">‹ voltar</button>
          <div class="passo">Resultado</div>
          <h2>${esc(D.modulo.nome)}</h2>
        </header>
        <main class="corpo">
          <div class="res-num">
            <div class="lbl">${esc(D.base[3] ? D.base[3].conceito : "")}</div>
            <div class="val">${Q.total ? `${Q.contagem.forte} de ${Q.total}` : "—"}</div>
            <div class="sub">${Q.total ? esc(Q.frase) : "Registre as entrevistas na ficha de perfil (M2.I02) para ver a contagem."}</div>
          </div>
          <div class="secao-titulo">Suas respostas</div>
          ${resp.map((q) => `<div class="cartao"><p class="mini-info">${esc(q.pergunta)}</p><p><b>${esc(Motor.valor(S.R, q.codigo))}</b></p></div>`).join("")}
          ${regras.length ? `<div class="secao-titulo">O que suas respostas indicam</div>${regras.map((r) => `<div class="regra"><p class="r-texto">${esc(r.texto)}</p></div>`).join("")}` : ""}
          ${ale.length ? `<div class="secao-titulo">Alertas</div>${ale.map((a) => `<div class="bloco b-alerta">${esc(a)}</div>`).join("")}` : ""}
          ${lac.length ? `<div class="bloco b-lacuna"><b>O que ainda falta saber</b><ul>${lac.map((l) => `<li>${esc(l)}</li>`).join("")}</ul></div>` : ""}
          ${prox.length ? `<div class="bloco b-proximo"><b>Próximo passo</b><ul>${prox.map((l) => `<li>${esc(l)}</li>`).join("")}</ul></div>` : ""}
          ${enc.length ? `<div class="bloco b-enc"><b>Quem procurar</b>${enc.map(esc).join(" · ")}</div>` : ""}
          ${blocoConceitos(D.base)}
          <div class="aviso">${esc(D.mapa.mensagem_limite)}</div>
          <div class="acoes">
            <button class="btn btn-primario" id="inst">Abrir os instrumentos</button>
            <button class="btn btn-claro" id="imp">Salvar ou imprimir</button>
            <button class="btn btn-claro" id="rev">Revisar respostas</button>
            <button class="btn btn-linha" id="novo">Começar outra análise</button>
          </div>
          ${rodape()}
        </main>
      </div>`);
    p.querySelector("#v").onclick = () => { S.hist.pop(); const a = S.hist.pop(); salvar(); ir(telaPergunta, a); };
    p.querySelector("#inst").onclick = () => ir(telaInstrumentos, telaResultado);
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
