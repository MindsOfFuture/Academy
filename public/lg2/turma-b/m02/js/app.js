/* Telas do Módulo 2. Todo texto de conteúdo vem de window.MODULO2 (a planilha),
   sem edição. As respostas ficam só neste aparelho. */
(function () {
  "use strict";
  const D = window.MODULO2, M = Motor.montar(D);
  const tela = document.getElementById("tela");
  const CHAVE = "lg2-turma-b-m02";
  /* o módulo mudou de turma em 15/10: traz as respostas salvas na chave antiga */
  try { const antiga = localStorage.getItem("lg2-turma-a-m02"); if (antiga && !localStorage.getItem(CHAVE)) localStorage.setItem(CHAVE, antiga); } catch (e) {}
  const vazio = (s) => !s || !String(s).trim() || s === "—" || s === "-" || s === "Nenhum" || s === "Nenhuma";

  /* v2 (05/11/2026): a pergunta sobre "problema de verdade ou só elogio" ganhou opções novas.
     Respostas salvas antes são convertidas para as opções novas. */
  const VERSAO = 2;
  const P21_ANTIGAS = { "Problema confirmado": "Contaram um problema de verdade", "Só elogios": "Só elogiaram a ideia" };
  let S = carregar();               // { v, R: respostas (+ veio: módulo de origem), hist: [códigos] }
  function carregar() {
    try {
      const lido = JSON.parse(localStorage.getItem(CHAVE)) || {};
      const s = Object.assign(novo(), lido);
      if (lido.v !== VERSAO) {
        const r = s.R["M2.P21"];
        if (r && r.estado === "opcao") { if (P21_ANTIGAS[r.opcao]) r.opcao = P21_ANTIGAS[r.opcao]; else delete s.R["M2.P21"]; }
        s.v = VERSAO;
      }
      return s;
    } catch { return novo(); }
  }
  function novo() { return { v: VERSAO, R: {}, hist: [], fichas: [], plano: { meta: "", prazo: "", feitos: [] }, grupos: [] }; }

  /* ================= o que já veio de outros módulos (só leitura; nunca grava na chave deles) ================= */
  function lerOutro(chave, cod) {
    try { const s = JSON.parse(localStorage.getItem(chave)); return (s && s.R && s.R[cod]) || null; } catch { return null; }
  }
  const txtDe = (chave, cod) => { const r = lerOutro(chave, cod); return r && r.estado === "valor" && String(r.valor ?? "").trim() ? String(r.valor).trim() : null; };
  const opDe = (chave, cod) => { const r = lerOutro(chave, cod); return r && r.estado === "opcao" && r.opcao && r.opcao !== Motor.NS ? r : null; };
  const M01 = "lg2-turma-a-m01", M03 = "lg2-turma-a-m03", M04 = "lg2-turma-a-m04", M05 = "lg2-turma-a-m05", M08 = "lg2-turma-b-m08";
  /* o que a pessoa vende: Módulo 1 primeiro, depois 3, 4 e 8 */
  function ideia() {
    for (const [ch, c, n] of [[M01, "M1.P03", 1], [M03, "M3.P01", 3], [M04, "M4.P01", 4], [M08, "M8.P01", 8]]) { const v = txtDe(ch, c); if (v) return { v, n }; }
    return null;
  }
  /* produto, mercadoria ou serviço: Módulo 1 (pergunta nova) e, se não houver, Módulo 5 */
  function tipoNegocio() {
    for (const [ch, c, n] of [[M01, "M1.P03A", 1], [M05, "M5.P01", 5]]) {
      const r = opDe(ch, c);
      const m = r && String(r.opcao).match(/^(Produto|Mercadoria|Servi[cç]o)/i);
      if (m) return { v: /^servi/i.test(m[1]) ? "Serviço" : /^merc/i.test(m[1]) ? "Mercadoria" : "Produto", n };
    }
    return null;
  }
  const ESTAGIO = [
    [/^Ainda está só na minha cabeça/i, "a ideia ainda está só no papel"],
    [/^Já fiz um pouco/i, "você já começou a testar"],
    [/^Já vendi algumas vezes/i, "você já vendeu algumas vezes"],
    [/^Já vendo sempre/i, "você já vende sempre"],
  ];
  function estagio() { const r = opDe(M01, "M1.P01"); const e = r && ESTAGIO.find(([re]) => re.test(r.opcao)); return e ? e[1] : null; }
  /* respostas que outro módulo já tem: a pessoa só confere (contrato de herança) */
  function heranca(cod) {
    const p10 = opDe(M03, "M3.P10");
    if (cod === "M2.P07" && p10) {
      const op = /^Pessoas/i.test(p10.opcao) ? "Pessoas" : /^Empresas/i.test(p10.opcao) ? "Empresas" : null;
      if (op) return { resp: { estado: "opcao", opcao: op }, n: 3 };
    }
    if (cod === "M2.P02") {
      const partes = p10 ? Object.entries(p10.campos || {}).filter(([, v]) => String(v || "").trim()).map(([k, v]) => `${k}: ${String(v).trim()}`) : [];
      const dor = txtDe(M03, "M3.P11");
      if (p10 && (partes.length || dor)) {
        const quem = /^Pessoas/i.test(p10.opcao) ? "Pessoas comuns" : p10.opcao;
        return { resp: { estado: "valor", valor: `${quem}${partes.length ? " (" + partes.join("; ") + ")" : ""}${dor ? `. Problema que você resolve: ${dor}` : ""}` }, n: 3 };
      }
      const p8 = txtDe(M04, "M4.P08"), p9 = txtDe(M04, "M4.P09");
      if (p8) return { resp: { estado: "valor", valor: `${p8}${p9 ? `. Problema que você resolve: ${p9}` : ""}` }, n: 4 };
    }
    return null;
  }
  const igual = (a, b) => a && b && a.estado === b.estado && (a.opcao ?? a.valor) === (b.opcao ?? b.valor);
  /* enunciado ajustado ao negócio da pessoa ("seu serviço" para quem presta serviço) e às respostas anteriores */
  function enunciado(q) {
    let t = q.pergunta;
    const tp = tipoNegocio();
    if (tp) {
      const pal = tp.v === "Serviço" ? "serviço" : "produto";
      t = t.replace(/\b(seu|este|esse) produto ou serviço/g, `$1 ${pal}`);
      if (tp.v === "Serviço") t = t.replace("seu produto serve", "seu serviço serve");
    }
    if (q.codigo === "M2.P21") {
      const n = parseInt(Motor.valor(S.R, "M2.P18"), 10);
      if (n >= 2) t = t.replace("das pessoas com quem conversou", `dessas ${n} pessoas com quem você conversou`);
    }
    return t;
  }
  const L = (s) => esc(Motor.limpa(s));    // texto da planilha sem códigos internos
  function salvar() { try { localStorage.setItem(CHAVE, JSON.stringify(S)); } catch {} }

  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const link = (u, t) => /^https?:/.test(u || "") ? `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(t || u)}</a>` : esc(t || u);
  function el(html) { const d = document.createElement("div"); d.innerHTML = html.trim(); return d.firstElementChild; }
  function ir(f, a) { tela.innerHTML = ""; tela.appendChild(f(a)); window.scrollTo(0, 0); }
  /* instrumentos: redesenha sem voltar ao topo (cada toque numa nota ou ficha redesenhava e jogava a pessoa para o início) */
  function refazer(a) { const y = window.scrollY; tela.innerHTML = ""; tela.appendChild(telaInstrumentos(a)); window.scrollTo(0, y); }

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
        <p>${L(e.texto)}</p>
        ${vazio(e.exemplo) ? "" : `<p class="ex">${L(e.exemplo)}</p>`}
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
  /* faixa roxa: o.kicker e o.titulo vêm do que a tela já mostrava; o.progresso (0-100) desenha a barra amarela */
  function heroi(o) {
    const tag = o.h1 ? "h1" : "h2";
    return `<section class="heroi ${o.grande ? "heroi-grande" : ""}">
      <div class="heroi-topo">
        <div class="heroi-txt">
          <div class="kicker ${o.kickerClasse || ""}">${esc(o.kicker || "Módulo " + D.modulo.numero)}</div>
          <${tag} class="heroi-tit ${o.titClasse || ""}">${esc(o.titulo)}</${tag}>
          ${o.texto ? `<p>${esc(o.texto)}</p>` : ""}
        </div>
        <img class="heroi-img" src="assets/${o.img || "hero-tela.webp"}" alt="">
      </div>
      ${o.progresso === undefined ? "" : `<div class="heroi-prog"><div class="barra" role="progressbar" aria-label="Progresso" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${o.progresso}"><div class="barra-fill" style="width:${o.progresso}%"></div></div></div>`}
    </section>`;
  }
  /* ajuda aberta da planilha, em cartão de dica (html já escapado) */
  const dica = (html) => html ? `<aside class="dica"><img src="assets/hero-tela.webp" alt=""><div><b>Dica</b><p class="ajuda">${html}</p></div></aside>` : "";
  const botaoVoltar = () => `<div class="acoes acoes-voltar"><button class="btn btn-linha voltar" id="v">Voltar</button></div>`;
  /* opção com bolinha; sem espaços entre as tags para o nome do botão continuar igual ao texto da opção */
  const opcaoHtml = (op, sel, attrs) => `<button class="opcao ${sel ? "sel" : ""}"${attrs || ""}><span class="radio" aria-hidden="true"></span><span class="op-txt"><b>${esc(op)}</b></span></button>`;
  function concluido() {
    return `<section class="concluido"><div class="conc-topo"><span class="check" aria-hidden="true"></span><div><h2>Você concluiu o Módulo ${esc(D.modulo.numero)}</h2><p>Confira abaixo o que entendemos sobre os seus clientes.</p></div></div></section>`;
  }
  /* liga os botões comuns a todas as telas */
  function ligar(p) { p.querySelectorAll("[data-inicio]").forEach((b) => { b.onclick = () => ir(telaCapa); }); }

  /* ================= capa ================= */
  function telaCapa() {
    const iniciado = S.hist.length > 0;
    const p = el(`
      <div class="pag">
        ${topo("")}
        ${heroi({ grande: true, h1: true, titulo: D.modulo.nome, texto: D.mapa.objetivo, img: "hero-inicio.webp" })}
        <main class="corpo">
          <div class="cartao"><h3>Para quem é</h3><p>${esc(D.mapa.usuario)}</p></div>
          <div class="cartao"><h3>O que ter em mãos</h3><p>${esc(D.mapa.ter_em_maos)}</p></div>
          <div class="cartao"><h3>O que você recebe no final</h3><p>${esc(D.mapa.entrega)}</p></div>
          <div class="acoes">
            <button class="btn btn-primario seta" id="ir">${iniciado ? "Continuar de onde parei" : "Começar"}</button>
            ${iniciado ? `<button class="btn btn-claro" id="zerar">Recomeçar do zero</button>` : ""}
            <button class="btn btn-linha" id="inst">Instrumentos: roteiro, ficha, plano e quadro</button>
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
    p.querySelector("#inst").onclick = () => ir(telaInstrumentos, telaCapa);
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
    const Q = Motor.quadro(S.fichas, I("M2.I04").ex_saida);
    const passos = passosPlano();
    const p = el(`
      <div class="pag">
        ${topo("Instrumentos")}
        ${heroi({ titulo: "Instrumentos" })}
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
            <div class="opcoes" id="f-sinal">${Motor.SINAIS.map((s) => opcaoHtml(s, false, ` data-s="${esc(s)}"`)).join("")}</div>
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
          <p class="mini-info" id="quadro-origem">${Q.total ? `Contado a partir das ${Q.total} entrevista(s) salvas na ficha (${esc(i2.codigo)}).` : `O quadro conta as entrevistas salvas na ficha (${esc(i2.codigo)}). Registre uma pessoa entrevistada e toque em “Salvar na ficha” para ele mudar.`} <a href="#form">Registrar entrevista</a></p>
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
          ${botaoVoltar()}
          ${rodape()}
        </main>
      </div>`);
    ligar(p);
    let sinal = null;
    p.querySelectorAll("#f-sinal .opcao").forEach((b) => (b.onclick = () => {
      sinal = b.dataset.s; p.querySelectorAll("#f-sinal .opcao").forEach((x) => x.classList.remove("sel")); b.classList.add("sel");
    }));
    p.querySelector("#f-ok").onclick = () => {
      const g = (id) => p.querySelector(id).value.trim();
      if (!sinal) { const e = p.querySelector("#f-erro"); e.textContent = "Escolha o sinal de interesse."; e.hidden = false; return; }
      S.fichas.push({ situacao: g("#f-sit"), frequencia: g("#f-freq"), motivo: g("#f-mot"), sinal });
      salvar(); refazer(voltar);
    };
    p.querySelectorAll("#fichas .x").forEach((b) => (b.onclick = () => { S.fichas.splice(+b.dataset.n, 1); salvar(); refazer(voltar); }));
    p.querySelectorAll("input[type=checkbox]").forEach((c) => (c.onchange = () => { S.plano.feitos[+c.dataset.n] = c.checked; salvar(); refazer(voltar); }));
    p.querySelector("#p-meta").onchange = (e) => { S.plano.meta = e.target.value.trim(); salvar(); refazer(voltar); };
    p.querySelector("#p-prazo").onchange = (e) => { S.plano.prazo = e.target.value; salvar(); };
    const gok = p.querySelector("#g-ok");
    if (gok) gok.onclick = () => { const v = p.querySelector("#g-nome").value.trim(); if (!v) return; S.grupos.push({ nome: v }); salvar(); refazer(voltar); };
    p.querySelectorAll("#grupos .opcao").forEach((b) => (b.onclick = () => { S.grupos[+b.dataset.g][b.dataset.k] = +b.dataset.n; salvar(); refazer(voltar); }));
    p.querySelectorAll("#grupos [data-gx]").forEach((b) => (b.onclick = () => { S.grupos.splice(+b.dataset.gx, 1); salvar(); refazer(voltar); }));
    p.querySelector("#v").onclick = () => ir(voltar || telaCapa);
    return p;
  }

  /* ================= pergunta ================= */
  /* posição no caminho DESTA pessoa (as perguntas dos outros ramos não contam) */
  function posicao(cod) {
    const c = Motor.caminho(M, S.R);
    const i = c.indexOf(cod);
    return { n: i < 0 ? c.length : i + 1, total: Math.max(c.length, i + 1) };
  }

  function telaPergunta(cod) {
    const q = M.porCodigo[cod];
    if (S.hist[S.hist.length - 1] !== cod) { S.hist.push(cod); salvar(); }
    const tipo = Motor.campo(q);
    const resp = S.R[cod] || null;
    const her = resp ? null : heranca(cod);
    const r0 = resp || (her && her.resp);
    const veio = her ? her.n : resp && resp.veio;
    let escolhida = r0 && r0.estado === "opcao" ? r0.opcao : null;
    const pos = posicao(cod), restam = pos.total - pos.n;
    const ide = ideia();

    const p = el(`
      <div class="pag">
        ${topo("Perguntas")}
        ${heroi({ titulo: `Pergunta ${pos.n} de ${pos.total}`, titClasse: "passo", texto: restam ? `Depois desta, faltam ${restam} ${restam === 1 ? "pergunta" : "perguntas"}` : "Esta é a última pergunta", progresso: Math.round(((pos.n - 1) / pos.total) * 100) })}
        <main class="corpo">
          <div class="cartao-q pergunta">
            ${ide ? `<p class="contexto" id="contexto">Seu negócio: <b>${esc(ide.v)}</b> <span class="veio">Veio do Módulo ${ide.n}</span></p>` : ""}
            <h2 class="q">${esc(enunciado(q))}</h2>
            ${veio ? `<p class="herdado" id="herdado"><span class="veio">Veio do Módulo ${esc(veio)}</span> Confira e ajuste se quiser.</p>` : ""}
            <div class="entrada" id="ent"></div>
            ${Motor.temNaoSei(q) ? `<div class="alt"><button class="btn-alt" id="ns">Não sei</button></div>` : ""}
            <div class="erro" id="erro" hidden></div>
            ${vazio(q.ajuda) ? "" : dica(L(q.ajuda))}
            <div id="retorno"></div>
            ${blocoEducativo(educativoDe(cod))}
            ${blocoVideos(videosDe(cod))}
            <div class="acoes" id="acoes"><button class="btn btn-primario seta" id="ok">Continuar</button></div>
            ${botaoVoltar()}
          </div>
          ${rodape()}
        </main>
      </div>`);
    ligarCopiar(p);
    ligar(p);

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
        const b = el(opcaoHtml(op, escolhida === op));
        b.onclick = () => { escolhida = op; ent.querySelectorAll(".opcao").forEach((x) => x.classList.remove("sel")); b.classList.add("sel"); };
        ent.appendChild(b);
      });
    } else {
      const v = r0 && r0.estado === "valor" ? r0.valor : "";
      ent.appendChild(el(tipo === "numero"
        ? `<div class="linha"><input class="campo" inputmode="decimal" value="${esc(v)}"></div>`
        : `<textarea class="campo" rows="${String(v).length > 90 ? 5 : 3}">${esc(v)}</textarea>`));
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

    function responder(nova) {
      p.querySelector("#erro").hidden = true;
      /* guarda de onde veio quando a pessoa só confirmou o que outro módulo já tinha */
      const origem = her ? her.resp : resp && resp.veio ? resp : null;
      if (veio && igual(nova, origem)) nova.veio = veio;
      S.R[cod] = nova;
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
        <p class="r-texto r-pergunta">${L(q.resposta)}</p>
        ${regras.map((r) => `
          <div class="regra">
            <p class="r-texto">${L(r.texto)}</p>
            ${vazio(r.alerta) ? "" : `<div class="bloco b-alerta"><b>Atenção</b>${L(r.alerta)}</div>`}
            ${vazio(r.proximo) ? "" : `<div class="bloco b-proximo"><b>Próximo passo</b>${L(r.proximo)}</div>`}
            ${vazio(r.encaminhamento) ? "" : `<div class="bloco b-enc"><b>Quem procurar</b>${L(r.encaminhamento)}</div>`}
          </div>`).join("")}
        ${vazio(q.alerta) ? "" : `<div class="bloco b-alerta"><b>Atenção</b>${L(q.alerta)}</div>`}
        ${vazio(q.proximo) ? "" : `<div class="bloco b-proximo"><b>Próximo passo</b>${L(q.proximo)}</div>`}
      </div>`;
      const acoes = p.querySelector("#acoes");
      acoes.innerHTML = "";
      const b = el(`<button class="btn btn-primario seta">${prox === "RESULTADO" ? "Ver meu resumo" : "Seguir"}</button>`);
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
    const Q = Motor.quadro(S.fichas, I("M2.I04").ex_saida);
    const resp = M.perguntas.filter((q) => S.R[q.codigo] !== undefined);
    const p = el(`
      <div class="pag">
        ${topo("Resultado")}
        ${heroi({ kicker: "Resultado", kickerClasse: "passo", titulo: D.modulo.nome })}
        <main class="corpo">
          ${concluido()}
          ${entendemos()}
          <div class="res-num">
            <div class="lbl">${esc(D.base[3] ? D.base[3].conceito : "")}</div>
            <div class="val">${Q.total ? `${Q.contagem.forte} de ${Q.total}` : "—"}</div>
            <div class="sub">${Q.total ? esc(Q.frase) : "Registre as conversas na ficha de perfil, em “Abrir os instrumentos”, para ver a contagem."}</div>
          </div>
          <details class="saiba" id="suas-respostas"><summary>Ver suas respostas (${resp.length})</summary>
          ${resp.map((q) => `<div class="cartao"><p class="mini-info">${esc(enunciado(q))}</p><p><b>${esc(Motor.valor(S.R, q.codigo))}</b>${S.R[q.codigo].veio ? ` <span class="veio">Veio do Módulo ${esc(S.R[q.codigo].veio)}</span>` : ""}</p></div>`).join("")}
          </details>
          ${regras.length ? `<div class="secao-titulo">O que suas respostas indicam</div>${regras.map((r) => `<div class="regra"><p class="r-texto">${L(r.texto)}</p></div>`).join("")}` : ""}
          ${ale.length ? `<div class="secao-titulo">Alertas</div>${ale.map((a) => `<div class="bloco b-alerta">${L(a)}</div>`).join("")}` : ""}
          ${lac.length ? `<div class="bloco b-lacuna"><b>O que ainda falta saber</b><ul>${lac.map((l) => `<li>${L(l)}</li>`).join("")}</ul></div>` : ""}
          ${prox.length ? `<div class="bloco b-proximo"><b>Próximo passo</b><ul>${prox.map((l) => `<li>${L(l)}</li>`).join("")}</ul></div>` : ""}
          ${enc.length ? `<div class="bloco b-enc"><b>Quem procurar</b>${enc.map(L).join(" · ")}</div>` : ""}
          ${blocoConceitos(D.base)}
          <div class="aviso">${esc(D.mapa.mensagem_limite)}</div>
          <div class="acoes">
            <button class="btn btn-primario" id="inst">Abrir os instrumentos</button>
            <button class="btn btn-claro" id="imp">Salvar ou imprimir</button>
            <button class="btn btn-claro" id="rev">Revisar respostas</button>
            <button class="btn btn-linha" id="novo">Começar outra análise</button>
          </div>
          ${botaoVoltar()}
          <div class="acoes lg2-proximo"><a class="btn btn-primario" style="text-decoration:none;text-align:center;box-sizing:border-box" href="/lg2/turma-a/m03/index.html">Ir para o Módulo 3</a></div>
          ${rodape()}
        </main>
      </div>`);
    ligar(p);
    p.querySelector("#v").onclick = () => { S.hist.pop(); const a = S.hist.pop(); salvar(); ir(telaPergunta, a); };
    p.querySelector("#inst").onclick = () => ir(telaInstrumentos, telaResultado);
    p.querySelector("#imp").onclick = () => { p.querySelector("#suas-respostas").open = true; window.print(); };
    p.querySelector("#rev").onclick = () => { S.hist = []; salvar(); ir(telaPergunta, Motor.proxima(M, {}, null)); };
    p.querySelector("#novo").onclick = () => { if (confirm("Começar uma nova análise? As respostas atuais serão apagadas.")) { S = novo(); salvar(); ir(telaPergunta, Motor.proxima(M, {}, null)); } };
    return p;
  }

  /* ================= "O que entendemos até aqui": frases montadas por regra, sem IA ================= */
  const minus = (s) => String(s || "").charAt(0).toLowerCase() + String(s || "").slice(1);
  function frasesEntendemos() {
    const v = (c) => { const x = Motor.valor(S.R, c); return x === undefined || x === Motor.NS || x === "" ? null : x; };
    const f = [];
    const ide = ideia(), tp = tipoNegocio(), est = estagio();
    if (ide || tp) {
      const oque = tp ? { "Serviço": "um serviço", "Produto": "um produto que você mesmo faz", "Mercadoria": "uma mercadoria que você revende" }[tp.v] : null;
      f.push(`${ide ? `Você vende (ou quer vender) ${minus(ide.v.replace(/[.!]+$/, ""))}` : "Você vende"}${oque ? `${ide ? ", que é " : " "}${oque}` : ""}${est ? `, e ${est}` : ""}.`);
    }
    const p07 = v("M2.P07"), p02 = v("M2.P02");
    const quem = { "Pessoas": "pessoas que compram para si ou para a família", "Empresas": "empresas que compram para o próprio negócio", "Os dois": "tanto pessoas quanto empresas" }[p07];
    if (quem || p02) f.push(`Seus clientes seriam principalmente ${quem || "este público"}${p02 ? `. Como você descreve quem mais compraria: “${p02.replace(/[.]+$/, "")}”` : ""}${v("M2.P14") ? `. Entre as empresas, ${minus(v("M2.P14"))}` : ""}.`);
    else f.push("Você ainda não sabe bem quem compraria: descobrir isso é o primeiro passo.");
    const p05 = v("M2.P05"), p08 = v("M2.P08");
    const det = ["M2.P09", "M2.P10", "M2.P11", "M2.P12", "M2.P13"].map(v).find(Boolean);
    let g = "";
    if (p05 === "Um único grupo") g = "Você vê um único grupo de clientes";
    else if (p05 === "De dois a três grupos") g = `Você vê de dois a três grupos de clientes${v("M2.P06") ? ` (${v("M2.P06")})` : ""}${v("M2.P15") ? `, e começaria pelo que for ${minus(v("M2.P15")).replace(/^maior necessidade/, "de maior necessidade").replace(/^pode pagar mais/, "capaz de pagar mais")}` : ""}`;
    else if (p05 === "Quase qualquer pessoa") g = "Você acha que quase qualquer pessoa compraria, então vale escolher um grupo para começar";
    if (p08 && p08 !== "Nenhuma muda muito") g += `${g ? "; o" : "O"} que mais muda entre um cliente e outro é: ${minus(p08)}${det ? ` (${minus(det)})` : ""}`;
    if (g) f.push(g + ".");
    const p17 = v("M2.P17"), p16 = v("M2.P16");
    if (p17 || p16) {
      const freq = p17 ? `Cada cliente compraria ${p17 === "Uma vez" ? "uma vez só" : minus(p17)}` : "";
      const onde = { "Sim": "você já sabe onde encontrar essas pessoas", "Em parte": "você sabe em parte onde encontrar essas pessoas", "Ainda não": "você ainda não sabe onde encontrar essas pessoas" }[p16];
      if (freq || onde) f.push(`${freq}${freq && onde ? (p16 === "Ainda não" ? ", mas " : ", e ") : ""}${onde ? (freq ? onde : onde.charAt(0).toUpperCase() + onde.slice(1)) : ""}.`);
    }
    const p04 = v("M2.P04");
    if (p04 === "Não") f.push("Você ainda não conversou com possíveis clientes: esse é o passo mais importante agora.");
    else if (p04 === "Sim") {
      const n = parseInt(v("M2.P18"), 10);
      let s = n > 0 ? `Você já conversou com ${n} ${n === 1 ? "pessoa" : "pessoas"}` : "Você já conversou com possíveis clientes";
      const p19 = v("M2.P19"), p21 = v("M2.P21");
      if (p19 === "Sim") s += ", e alguém já fez algo concreto (perguntou o preço, reservou ou pagou um sinal)";
      else if (p19 === "Não") s += ", mas ninguém fez nada concreto ainda";
      if (p21 === "Contaram um problema de verdade") s += ". Pelo que você ouviu, elas contam um problema que têm de verdade";
      else if (p21 === "Só elogiaram a ideia") s += ". Por enquanto, o que você ouviu foi mais elogio do que um problema de verdade";
      f.push(s + ".");
    } else if (p04) f.push("Você não tem certeza se já conversou com possíveis clientes.");
    return f.slice(0, 6);
  }
  function entendemos() {
    const fr = frasesEntendemos();
    return `<section class="entendemos" id="entendemos"><h2>O que entendemos até aqui</h2>${fr.map((x) => `<p>${esc(x)}</p>`).join("")}
      <p class="mini-info">Juntamos as suas respostas deste módulo com o que você já contou nos outros. Se algo não estiver certo, toque em “Revisar respostas”.</p></section>`;
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
