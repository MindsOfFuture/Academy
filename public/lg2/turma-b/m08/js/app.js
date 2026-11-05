/* Telas do Módulo 8. Todo texto de conteúdo vem de window.MODULO8 (a planilha),
   sem edição. As respostas ficam só neste aparelho.
   Layout do Módulo 5: barra do topo com trilha, faixa roxa com ilustração, cartão da pergunta e
   cartão de conclusão. A planilha não divide as perguntas em seções: o progresso fica numa barra
   amarela dentro da faixa roxa, no lugar das etapas. */
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

  /* ================= herança: o que já foi respondido em outros módulos (só leitura) =================
     P01 atividade ← M1.P03 (depois M3.P01, M4.P01) · P02 tipo ← M1.P03A, M5.P01, M4.P02
     P03 local ← M9-03 (+ M9-03a / M9-03b) · P04 faturamento ← M5.P36 × M5.P37.
     A resposta herdada só pré-preenche a pergunta; a pessoa confere e toca Continuar. "Não sei" não conta. */
  const NS = Motor.NS;
  function lerR(chave) { try { const s = JSON.parse(localStorage.getItem(chave)); return (s && s.R) || {}; } catch { return {}; } }
  const textoDe = (r) => { if (!r) return null; let v = r.estado === "opcao" ? r.opcao : r.estado === "valor" ? r.valor : null; if (typeof v === "number") v = String(v); return typeof v === "string" && v.trim() && v.trim() !== NS ? v.trim() : null; };
  function numero(v) {
    let s = String(v ?? "").replace(/[R$\s]/g, "");
    if (!s) return null;
    if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
    else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, "");
    const n = parseFloat(s);
    return isFinite(n) ? n : null;
  }
  const reais = (n) => "R$\u00a0" + n.toLocaleString("pt-BR", { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 });
  const qtd = (n) => n.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
  /* tipo por palavra inicial: Produto / Mercadoria (conta como Produto) / Serviço; combinações com serviço = os dois */
  function tipoP02(t) {
    if (!t) return null;
    const temS = /servi[cç]o/i.test(t), temP = /produto|mercadoria/i.test(t);
    return temS && temP ? "Produto e serviço" : temS ? "Serviço" : temP ? "Produto" : null;
  }
  function localP03(m9) {
    const a = textoDe(m9["M9-03"]), sa = textoDe(m9["M9-03a"]), sb = textoDe(m9["M9-03b"]);
    const casa = (x) => /casa|apartamento|condom/i.test(x || "") && !/cliente/i.test(x || "");
    const loja = (x) => /loja|sala comercial/i.test(x || "");
    const semFixo = () => /internet|telefone/i.test(sa || "") ? "Online" : sa ? "Atendimento externo" : null;
    if (casa(a)) return "Minha casa";
    if (loja(a)) return "Ponto comercial";
    if (/sem local fixo/i.test(a || "")) return semFixo();
    if (casa(sb)) return "Minha casa";
    if (loja(sb)) return "Ponto comercial";
    if (/sem local fixo/i.test(sb || "")) return semFixo();
    return null;
  }
  /* devolve { r, de, nota } com a resposta já no formato deste módulo, ou null */
  function herdado(cod) {
    const m1 = lerR("lg2-turma-a-m01");
    if (cod === "M8.P01") {
      const fontes = [[m1, "M1.P03", 1], [lerR("lg2-turma-a-m03"), "M3.P01", 3], [lerR("lg2-turma-a-m04"), "M4.P01", 4]];
      for (const [R, c, n] of fontes) { const t = textoDe(R[c]); if (t) return { r: { estado: "valor", valor: t }, de: n }; }
    }
    if (cod === "M8.P02") {
      const fontes = [[m1, "M1.P03A", 1], [lerR("lg2-turma-a-m05"), "M5.P01", 5], [lerR("lg2-turma-a-m04"), "M4.P02", 4]];
      for (const [R, c, n] of fontes) { const t = tipoP02(textoDe(R[c])); if (t) return { r: { estado: "opcao", opcao: t }, de: n }; }
    }
    if (cod === "M8.P03") {
      const t = localP03(lerR("lg2-turma-b-m09"));
      if (t) return { r: { estado: "opcao", opcao: t }, de: 9 };
    }
    if (cod === "M8.P04") {
      const m5 = lerR("lg2-turma-a-m05");
      const preco = numero(textoDe(m5["M5.P36"])), vendas = numero(textoDe(m5["M5.P37"]));
      if (preco > 0 && vendas > 0) {
        const total = Math.round(preco * vendas * 100) / 100;
        return { r: { estado: "valor", valor: String(total).replace(".", ",") }, de: 5,
                 nota: `${reais(preco)} por venda × ${qtd(vendas)} ${vendas === 1 ? "venda" : "vendas"} por mês = ${reais(total)} por mês` };
      }
    }
    return null;
  }
  const mesmo = (a, b) => !!a && !!b && a.estado === b.estado && (a.opcao ?? a.valor) === (b.opcao ?? b.valor);
  const selo = (de) => `<span class="veio">Veio do Módulo ${esc(de)}</span>`;

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


  /* ================= peças do layout ================= */
  function topo(trilha) {
    return `<div class="barra-topo">
      <img class="logo-mini" src="assets/minds.svg" alt="Minds of the Future">
      <nav class="trilha" aria-label="Você está em"><button class="trilha-link" data-inicio>Início</button><span>/</span><span>Módulo ${esc(D.modulo.numero)}</span>${trilha ? `<span>/</span><span>${esc(trilha)}</span>` : ""}</nav>
    </div>`;
  }
  function heroi(o) {
    return `<section class="heroi ${o.grande ? "heroi-grande" : ""}">
      <div class="heroi-topo">
        <div class="heroi-txt">
          <div class="kicker ${o.kickerClasse || ""}">${esc(o.kicker || "Módulo " + D.modulo.numero)}</div>
          <${o.h1 ? "h1" : "h2"} class="heroi-tit ${o.tituloClasse || ""}">${esc(o.titulo)}</${o.h1 ? "h1" : "h2"}>
          ${o.texto ? `<p>${esc(o.texto)}</p>` : ""}
        </div>
        <img class="heroi-img" src="assets/${o.img || "hero-tela.webp"}" alt="">
      </div>
      ${o.progresso !== undefined ? `<div class="heroi-prog"><div class="barra" role="progressbar" aria-label="Progresso" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${o.progresso}"><div class="barra-fill" style="width:${o.progresso}%"></div></div></div>` : ""}
    </section>`;
  }
  function dica(texto) {
    if (vazio(texto)) return "";
    return `<aside class="dica"><img src="assets/hero-tela.webp" alt=""><div><b>Dica</b><p class="ajuda">${esc(texto)}</p></div></aside>`;
  }
  const botaoVoltar = (rot) => `<div class="acoes acoes-voltar"><button class="btn btn-linha voltar" id="v">${rot || "Voltar"}</button></div>`;
  function ligar(p) {
    p.querySelectorAll("[data-inicio]").forEach((b) => { b.onclick = () => ir(telaCapa); });
  }

  /* ================= capa ================= */
  function telaCapa() {
    const iniciado = S.hist.length > 0;
    const p = el(`
      <div class="pag">
        ${topo("")}
        ${heroi({ grande: true, h1: true, kicker: "Módulo " + D.modulo.numero, titulo: D.modulo.nome, texto: D.mapa.objetivo, img: "hero-inicio.webp" })}
        <main class="corpo">
          <div class="cartao"><h3>Para quem é</h3><p>${esc(D.mapa.usuario)}</p></div>
          <div class="cartao"><h3>O que ter em mãos</h3><p>${esc(D.mapa.ter_em_maos)}</p></div>
          <div class="cartao"><h3>O que você recebe no final</h3><p>${esc(D.mapa.entrega)}</p></div>
          <div class="acoes">
            <button class="btn btn-primario seta" id="ir">${iniciado ? "Continuar de onde parei" : "Começar"}</button>
            ${iniciado ? `<button class="btn btn-claro" id="zerar">Recomeçar do zero</button>` : ""}
            <button class="btn btn-linha" id="base">Consultar as ocupações permitidas ao MEI</button>
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
    p.querySelector("#base").onclick = () => ir(telaBase, () => ir(telaCapa));
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

  /* ================= Anexo XI (ocupações permitidas ao MEI) ================= */
  function telaBase(voltar, termo) {
    const AX = D.anexo;
    const p = el(`
      <div class="pag">
        ${topo("Ocupações permitidas ao MEI")}
        ${heroi({ titulo: "Ocupações permitidas ao MEI" })}
        <main class="corpo">
          <p class="ajuda">${esc(AX.titulo)}</p>
          <input class="campo" id="busca" placeholder="Busque pela ocupação, pelo CNAE ou pela descrição" value="${esc(termo || "")}">
          <p class="mini-info" id="conta"></p>
          ${botaoVoltar()}
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
    ligar(p);
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
    const H = S.R[cod] ? null : herdado(cod);       // pré-preenchimento só quando ainda não respondeu aqui
    const resp = S.R[cod] || (H && H.r) || null;
    let escolhida = resp && resp.estado === "opcao" ? resp.opcao : null;
    const deOnde = H ? H.de : S.R[cod] && S.R[cod].de;
    const nota = H && H.nota ? H.nota : S.R[cod] && S.R[cod].nota;

    const p = el(`
      <div class="pag">
        ${topo(`Pergunta ${M.perguntas.indexOf(q) + 1}`)}
        ${heroi({ titulo: `Pergunta ${M.perguntas.indexOf(q) + 1} de ${M.perguntas.length}`, tituloClasse: "passo", progresso: progresso() })}
        <main class="corpo">
          <div class="cartao-q pergunta">
            <h2 class="q">${esc(q.pergunta)}</h2>
            ${deOnde ? `<div class="herdou" id="herdou">${selo(deOnde)}<span>${H ? "Confira e ajuste se quiser." : "Você já conferiu esta resposta."}</span>${nota ? `<p class="conta">${esc(nota)}</p>` : ""}</div>` : ""}
            <div class="entrada" id="ent"></div>
            ${Motor.temNaoSei(q) ? `<div class="alt"><button class="btn-alt" id="ns">Não sei</button></div>` : ""}
            <div class="erro" id="erro" hidden></div>
            ${LIGA_ANEXO.includes(cod) ? `<div class="alt"><button class="btn-alt" id="anexo">Consultar as ocupações permitidas ao MEI</button></div>` : ""}
            ${dica(q.ajuda)}
            <div id="retorno"></div>
            ${blocoEducativo(educativoDe(cod))}
            ${blocoConceitos(conceitosDe(q))}
            <div class="acoes" id="acoes"><button class="btn btn-primario seta" id="ok">Continuar</button></div>
            ${botaoVoltar(S.hist.length > 1 ? "Voltar" : "Início")}
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
        const b = el(`<button class="opcao ${escolhida === op ? "sel" : ""}"><span class="radio" aria-hidden="true"></span><span class="op-txt"><b>${esc(op)}</b></span></button>`);
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
      /* guarda de onde veio quando a pessoa manteve o valor herdado (aparece com o selo no resumo) */
      const h = H || (S.R[cod] && S.R[cod].de ? S.R[cod] : null);
      if (h && mesmo(r0, h.r || h)) { r0.de = h.de; if (h.nota) r0.nota = h.nota; }
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
        ${topo("Resultado")}
        ${heroi({ kicker: "Resultado", kickerClasse: "passo", titulo: "Resumo da sua formalização" })}
        <main class="corpo">
          <section class="concluido">
            <div class="conc-topo"><span class="check" aria-hidden="true"></span><div><h2>Você concluiu o Módulo ${esc(D.modulo.numero)}</h2><p>Seu resumo está logo abaixo.</p></div></div>
          </section>
          <section class="entendemos" id="entendemos">
            <h3>O que entendemos até aqui</h3>
            ${entendemos().map((f) => `<p>${esc(f)}</p>`).join("")}
          </section>
          <div class="res-num">
            <div class="lbl">Perguntas respondidas</div>
            <div class="val">${resp.length}</div>
            <div class="sub">${ns.length ? `${ns.length} com “Não sei”` : "nenhuma com “Não sei”"}</div>
          </div>
          <div class="aviso">${esc(D.mapa.mensagem_limite)}</div>

          <details class="saiba respostas"><summary>Ver suas respostas</summary>
          ${resp.map((q, i) => `
            <div class="etapa ${Motor.valor(S.R, q.codigo) === Motor.NS ? "e-conf" : "e-sim"}">
              <div class="etapa-topo"><span class="etq">${i + 1}</span><b>${esc(q.pergunta)}</b></div>
              <p>${esc(mostrar(q.codigo))}${S.R[q.codigo].de ? " " + selo(S.R[q.codigo].de) : ""}</p>
              ${S.R[q.codigo].nota ? `<p class="mini-info">${esc(S.R[q.codigo].nota)}</p>` : ""}
              ${vazio(q.alerta) ? "" : `<p class="mini-info"><b>Atenção:</b> ${esc(q.alerta)}</p>`}
            </div>`).join("")}
          </details>
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
          ${botaoVoltar()}
          <div class="acoes lg2-proximo"><a class="btn btn-primario" style="text-decoration:none;text-align:center;box-sizing:border-box" href="/lg2/turma-b/m09/index.html">Ir para o Módulo 9</a></div>
          ${rodape()}
        </main>
      </div>`);
    ligar(p);
    p.querySelector("#v").onclick = () => { S.hist.pop(); const a = S.hist.pop(); salvar(); ir(telaPergunta, a); };
    p.querySelector("#imp").onclick = () => { p.querySelectorAll("details.respostas").forEach((d) => (d.open = true)); window.print(); };
    p.querySelector("#rev").onclick = () => { S.hist = []; salvar(); ir(telaPergunta, Motor.proxima(M, {}, null)); };
    p.querySelector("#base").onclick = () => ir(telaBase, () => ir(telaResultado));
    p.querySelector("#novo").onclick = () => { if (confirm("Começar uma nova análise? As respostas atuais serão apagadas.")) { S = novo(); salvar(); ir(telaPergunta, Motor.proxima(M, {}, null)); } };
    return p;
  }

  /* valor mostrado no resumo (faturamento em reais) */
  function mostrar(cod) {
    const v = Motor.valor(S.R, cod);
    if (cod === "M8.P04" && v !== NS && numero(v) != null) return reais(numero(v)) + " por mês";
    return v;
  }

  /* "O que entendemos até aqui": frases montadas por regras com as respostas deste módulo
     e o que já existe nos módulos anteriores (estágio do Módulo 1, cliente do Módulo 3) */
  const LIMITE_MEI_ANO = 81000;   // "até R$ 81 mil/ano" (Base técnica, MEI)
  function entendemos() {
    const v = (c) => { const x = Motor.valor(S.R, c); return x && x !== NS ? x : null; };
    const minus = (t) => t.charAt(0).toLowerCase() + t.slice(1);
    const semPonto = (t) => String(t).trim().replace(/[.!]+$/, "");
    const m1 = lerR("lg2-turma-a-m01"), m3 = lerR("lg2-turma-a-m03");
    const f = [];
    const ativ = v("M8.P01"), tipo = v("M8.P02");
    const tipoTxt = { "Produto": "um produto", "Serviço": "um serviço", "Produto e serviço": "produto e serviço ao mesmo tempo" }[tipo];
    if (ativ) f.push(`Sua atividade é: ${semPonto(ativ)}${tipoTxt ? ` — principalmente ${tipoTxt}` : ""}.`);
    else if (tipoTxt) f.push(`Sua atividade envolve principalmente ${tipoTxt}.`);
    const est = { "Ainda está só na minha cabeça": "Seu negócio ainda está no papel: você não começou a vender.",
                  "Já fiz um pouco para testar ou dar de amostra": "Você está começando: já fez testes ou deu amostras.",
                  "Já vendi algumas vezes": "Você já vende, ainda de vez em quando.",
                  "Já vendo sempre": "Você já vende com frequência." }[textoDe(m1["M1.P01"])];
    if (est) f.push(est);
    const dor = textoDe(m3["M3.P11"]);
    if (dor) f.push(`Para o seu cliente, você resolve: ${minus(semPonto(dor))}.`);
    const local = { "Minha casa": "Você trabalha na sua casa", "Ponto comercial": "Você trabalha em um ponto comercial",
                    "Atendimento externo": "Você atende fora, no local do cliente", "Online": "Você trabalha pela internet" }[v("M8.P03")];
    if (local) f.push(local + (local.includes("internet") ? "." : ", e isso pode pedir licenças da prefeitura."));
    const fat = numero(v("M8.P04"));
    if (fat > 0) {
      const ano = fat * 12;
      f.push(`Você estima faturar ${reais(fat)} por mês, cerca de ${reais(Math.round(ano))} por ano — ${ano <= LIMITE_MEI_ANO
        ? "dentro do limite do MEI (R$ 81 mil por ano), então o MEI pode ser um caminho se a sua ocupação for permitida."
        : "acima do limite do MEI (R$ 81 mil por ano); converse com um contador sobre outras formas de abrir o CNPJ."}`);
    }
    const cnpj = v("M8.P05");
    if (cnpj === "Não") f.push("Você ainda não tem CNPJ.");
    else if (cnpj) f.push(`Você já tem CNPJ (${cnpj}).`);
    const duv = v("M8.P10");
    if (duv && f.length < 6) f.push(`Sua principal dúvida agora é: ${minus(duv)}.`);
    if (!f.length) f.push("Você ainda não deu detalhes suficientes sobre o seu negócio. Volte às perguntas quando souber mais.");
    return f.slice(0, 6);
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
