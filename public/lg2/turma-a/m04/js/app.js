/* Telas do Módulo 4. O texto de conteúdo vem de window.MODULO4 (a planilha do grupo,
   com os ajustes do teste de 05/11/2026). As respostas ficam só neste aparelho; respostas de
   outros módulos são só lidas (para não perguntar de novo o que já foi respondido). */
(function () {
  "use strict";
  const D = window.MODULO4, M = Motor.montar(D);
  const tela = document.getElementById("tela");
  const CHAVE = "lg2-turma-a-m04";
  /* o módulo mudou de turma em 15/10: traz as respostas salvas na chave antiga */
  try { const antiga = localStorage.getItem("lg2-turma-b-m04"); if (antiga && !localStorage.getItem(CHAVE)) localStorage.setItem(CHAVE, antiga); } catch (e) {}
  const vazio = (s) => !s || !String(s).trim() || s === "—" || s === "-" || /^nenhum[a]?\.?$/i.test(String(s).trim());

  /* versão 2 (05/11/2026): a pergunta 14 ganhou opções novas; as respostas antigas são traduzidas */
  const VERSAO = 2;
  const P14_ANTIGA = { "Protótipo sem venda": "Mostrar uma amostra sem cobrar", "Oferta mínima com preço": "Vender pouca quantidade, já com preço", "Pré-venda/reserva": "Aceitar encomenda ou reserva antes de fazer" };
  const P14_ANTIGA_SERV = { "Oferta mínima com preço": "Atender poucos clientes, já cobrando", "Pré-venda/reserva": "Aceitar agendamento ou reserva antes de atender" };
  let S = carregar();               // { v, R: respostas, hist: [códigos] }
  function carregar() {
    try {
      const s = JSON.parse(localStorage.getItem(CHAVE));
      if (!s || !s.R || !Array.isArray(s.hist)) return novo();
      if (s.v !== VERSAO) {
        const r = s.R["M4.P14"], t = s.R["M4.P02"];
        const serv = t && t.estado === "opcao" && /Servi/.test(t.opcao);
        if (r && r.estado === "opcao") { const n = (serv ? P14_ANTIGA_SERV : P14_ANTIGA)[r.opcao]; if (n) r.opcao = n; }
        s.v = VERSAO;
      }
      return s;
    } catch { return novo(); }
  }
  function novo() { return { v: VERSAO, R: {}, hist: [] }; }

  /* ===== respostas de outros módulos (só leitura) ===== */
  function lerOutro(chave, cod) {
    try { const s = JSON.parse(localStorage.getItem(chave)); const r = s && s.R && s.R[cod]; return r || null; } catch { return null; }
  }
  const M1 = "lg2-turma-a-m01", M2 = "lg2-turma-b-m02", M3 = "lg2-turma-a-m03", M5 = "lg2-turma-a-m05";
  const textoDe = (r) => (r && r.estado === "valor" && typeof r.valor === "string" && r.valor.trim() ? r.valor.trim() : "");
  const opcaoDe = (r) => (r && r.estado === "opcao" && r.opcao ? String(r.opcao) : "");
  const tipoCurto = (s) => (/^produto/i.test(s) ? "Produto" : /^mercadoria/i.test(s) ? "Mercadoria" : /^servi/i.test(s) ? "Serviço" : "");
  /* resposta já dada em outro módulo para a mesma pergunta; "Não sei" não conta */
  function herdado(cod) {
    if (cod === "M4.P01") {
      const a = textoDe(lerOutro(M1, "M1.P03")); if (a) return { valor: a, de: 1 };
      const b = textoDe(lerOutro(M3, "M3.P01")); if (b) return { valor: b, de: 3 };
    }
    if (cod === "M4.P02") {
      const a = tipoCurto(opcaoDe(lerOutro(M1, "M1.P03A"))); if (a) return { opcao: a, de: 1 };
      const b = tipoCurto(opcaoDe(lerOutro(M5, "M5.P01"))); if (b) return { opcao: b, de: 5 };
    }
    if (cod === "M4.P08") {
      const r = lerOutro(M3, "M3.P10");
      const quem = opcaoDe(r).replace(/\s*\(.*\)\s*$/, "");
      const c = (r && r.campos) || {};
      const partes = Object.keys(c).filter((k) => !/resolver/i.test(k) && String(c[k] || "").trim()).map((k) => `${k.toLowerCase()}: ${String(c[k]).trim()}`);
      if (quem && partes.length) return { valor: `${quem} (${partes.join("; ")})`, de: 3 };
      const b = textoDe(lerOutro(M2, "M2.P02")); if (b) return { valor: b, de: 2 };
      if (quem) return { valor: quem, de: 3 };
    }
    if (cod === "M4.P09") {
      const a = textoDe(lerOutro(M3, "M3.P11")); if (a) return { valor: a, de: 3 };
      const r = lerOutro(M3, "M3.P10"), c = (r && r.campos) || {};
      const k = Object.keys(c).find((x) => /resolver/i.test(x) && String(c[x] || "").trim());
      if (k) return { valor: String(c[k]).trim(), de: 3 };
    }
    return null;
  }
  /* quem oferece só serviço lê "serviço" onde a planilha diz "produto" */
  function T(s) {
    if (Motor.valor(S.R, "M4.P02") !== "Serviço") return s;
    return String(s ?? "").replace(/produto ou serviço/g, "serviço").replace(/\bprodutos\b/g, "serviços").replace(/\bProdutos\b/g, "Serviços")
      .replace(/\bproduto\b/g, "serviço").replace(/\bProduto\b/g, "Serviço");
  }
  const selo = (n) => `<p class="selo-m"><b>Veio do Módulo ${n}</b> · Confira e ajuste se quiser.</p>`;
  function salvar() { try { localStorage.setItem(CHAVE, JSON.stringify(S)); } catch {} }

  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const link = (u, t) => /^https?:/.test(u || "") ? `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(t || u)}</a>` : esc(t || u);
  const txt = (s) => esc(String(s ?? "").trim()).replace(/\n/g, "<br>");   // quebras de linha da célula
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
  /* um conceito da Base técnica, aberto (pedido do grupo: "exibir também significado do termo") */
  function conceitoAberto(cod) {
    const b = D.base.find((x) => x.codigo === cod);
    if (!b) return "";
    return `<div class="caixa caixa-entenda"><b>${esc(b.conceito)}</b><p>${txt(b.definicao)}</p>
      ${vazio(b.exemplo) ? "" : `<p class="ex">${esc(b.exemplo)}</p>`}
      <span class="fonte">Fonte: ${link(b.link, b.fonte)}${vazio(b.data) ? "" : ` · consultado em ${esc(b.data)}`}</span></div>`;
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
  const opcaoHtml = (op, sel, attrs, sub) => `<button class="opcao ${sel ? "sel" : ""}"${attrs || ""}><span class="radio" aria-hidden="true"></span><span class="op-txt"><b>${esc(op)}</b>${sub ? `<small class="op-sub">${esc(sub)}</small>` : ""}</span></button>`;
  function concluido() {
    return `<section class="concluido"><div class="conc-topo"><span class="check" aria-hidden="true"></span><div><h2>Você concluiu o Módulo ${esc(D.modulo.numero)}</h2><p>Confira abaixo o resumo das suas respostas.</p></div></div></section>`;
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

  /* ================= pergunta ================= */
  function progresso() {
    const vistas = S.hist.filter((c) => c !== "RESULTADO").length;
    return Math.min(100, Math.round((vistas / M.perguntas.length) * 100));
  }

  function telaPergunta(cod) {
    const q = M.porCodigo[cod];
    if (S.hist[S.hist.length - 1] !== cod) { S.hist.push(cod); salvar(); }
    const tipo = Motor.campo(q);
    const V = Motor.versao(M, S.R, q);
    const resp = S.R[cod] || null;
    /* sem resposta própria: traz a de outro módulo, se houver */
    const her = resp ? null : herdado(cod);
    const origem = her || (resp && resp.de ? { valor: resp.valor, opcao: resp.opcao, de: resp.de } : null);
    let escolhida = resp && resp.estado === "opcao" && V.opcoesLista.includes(resp.opcao) ? resp.opcao
      : her && her.opcao && V.opcoesLista.includes(her.opcao) ? her.opcao : null;
    const unidade = /reais|R\$/.test(V.pergunta) ? "R$" : /dias/.test(V.pergunta) ? "dias" : "";

    const p = el(`
      <div class="pag">
        ${topo("Perguntas")}
        ${heroi({ titulo: `Pergunta ${M.perguntas.indexOf(q) + 1} de ${M.perguntas.length}`, titClasse: "passo", texto: D.modulo.nome, progresso: progresso() })}
        <main class="corpo">
          <div class="cartao-q pergunta">
            <h2 class="q">${esc(T(V.pergunta))}</h2>
            ${vazio(q.destaque) ? "" : `<div class="bloco b-proximo destaque">${txt(q.destaque)}</div>`}
            ${dica(txt(T(V.ajuda)))}
            ${vazio(q.destaque_alerta) ? "" : `<div class="bloco b-alerta destaque"><b>Atenção</b>${txt(T(q.destaque_alerta))}</div>`}
            ${q.conceito_destaque ? conceitoAberto(q.conceito_destaque) : ""}
            ${origem && (origem.valor || origem.opcao) ? selo(origem.de) : ""}
            <div class="entrada" id="ent"></div>
            ${Motor.temNaoSei(q) ? `<div class="alt"><button class="btn-alt" id="ns">Não sei</button></div>` : ""}
            <div class="erro" id="erro" hidden></div>
            <div id="retorno"></div>
            ${blocoEducativo(educativoDe(cod))}
            ${blocoConceitos(conceitosDe(q))}
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
      V.opcoesLista.forEach((op) => {
        const b = el(opcaoHtml(op, escolhida === op, "", q.opcoes_explica && q.opcoes_explica[op]));
        b.onclick = () => { escolhida = op; ent.querySelectorAll(".opcao").forEach((x) => x.classList.remove("sel")); b.classList.add("sel"); };
        ent.appendChild(b);
      });
    } else {
      const v = resp && resp.estado === "valor" ? resp.valor : (her && her.valor) || "";
      ent.appendChild(el(tipo === "numero"
        ? `<div class="linha">${unidade === "R$" ? `<span class="pre">R$</span>` : ""}<input class="campo" inputmode="decimal" value="${esc(v)}">${unidade === "dias" ? `<span class="pre">dias</span>` : ""}</div>`
        : `<textarea class="campo" rows="3">${esc(v)}</textarea>`));
    }
    const ns = p.querySelector("#ns");
    if (ns) ns.onclick = () => responder({ estado: "naosei" });

    p.querySelector("#ok").onclick = () => {
      if (tipo === "escolha") {
        if (!escolhida) return erro("Escolha uma opção para continuar.");
        return responder(marcar({ estado: "opcao", opcao: escolhida }));
      }
      const v = ent.querySelector("input,textarea").value.trim();
      if (!v) return erro(Motor.temNaoSei(q) ? "Responda ou toque em \"Não sei\"." : "Responda para continuar.");
      if (tipo === "numero" && isNaN(parseFloat(v.replace(/\./g, "").replace(",", ".")))) return erro("Informe um número.");
      responder(marcar({ estado: "valor", valor: v }));
    };
    /* guarda de qual módulo veio a resposta, se a pessoa manteve o que foi trazido */
    function marcar(r) {
      if (origem && ((r.estado === "opcao" && r.opcao === origem.opcao) || (r.estado === "valor" && r.valor === String(origem.valor || "").trim()))) r.de = origem.de;
      return r;
    }
    function erro(t) { const e = p.querySelector("#erro"); e.textContent = t; e.hidden = false; }

    function responder(r0) {
      p.querySelector("#erro").hidden = true;
      /* pedido do grupo (M4.P01): com "Não sei" a pessoa não avança enquanto não escrever a frase */
      if (q.bloqueia_naosei && r0.estado === "naosei") {
        const R = Object.assign({}, S.R, { [cod]: r0 });
        delete S.R[cod]; salvar();
        return mostrarRetorno(Motor.regrasAgora(M, R, cod), null, Motor.NS);
      }
      S.R[cod] = r0;
      /* respostas de perguntas que deixaram de aparecer são descartadas */
      limparInvisiveis();
      salvar();
      const regras = Motor.regrasAgora(M, S.R, cod);
      const prox = Motor.proxima(M, S.R, cod);
      mostrarRetorno(regras, prox, Motor.valor(S.R, cod));
    }

    function mostrarRetorno(regras, prox, v) {
      const ehNS = v === Motor.NS;
      const box = p.querySelector("#retorno");
      const se = Motor.retornoSe(q, v);
      box.innerHTML = `<div class="retorno">
        ${vazio(q.resposta) ? "" : `<p class="r-texto r-pergunta">${txt(T(q.resposta))}</p>`}
        ${ehNS && !vazio(q.resposta_naosei) ? `<p class="r-texto r-pergunta">${txt(T(q.resposta_naosei))}</p>` : ""}
        ${ehNS && !vazio(q.prompt_ia) ? `<div class="prompt"><p>${txt(q.prompt_ia)}</p><button class="btn-copiar" data-t="${esc(q.prompt_ia)}">Copiar texto</button></div>` : ""}
        ${ehNS && q.conceito_naosei ? conceitoAberto(q.conceito_naosei) : ""}
        ${vazio(se) ? "" : `<div class="bloco b-proximo">${txt(se)}</div>`}
        ${regras.map((r) => `
          <div class="regra">
            <p class="r-texto">${txt(T(r.texto))}</p>
            ${vazio(r.alerta) ? "" : `<div class="bloco b-alerta"><b>Atenção</b>${txt(T(r.alerta))}</div>`}
            ${vazio(r.proximo) || !prox ? "" : `<div class="bloco b-proximo"><b>Próximo passo</b>${txt(T(r.proximo))}</div>`}
            ${vazio(r.encaminhamento) ? "" : `<div class="bloco b-enc"><b>Quem procurar</b>${txt(r.encaminhamento)}</div>`}
          </div>`).join("")}
        ${vazio(q.alerta) ? "" : `<div class="bloco b-alerta"><b>Atenção</b>${txt(T(q.alerta))}</div>`}
        ${ehNS && !vazio(q.alerta_naosei) ? `<div class="bloco b-alerta bloqueio"><b>Atenção</b>${txt(T(q.alerta_naosei))}</div>` : ""}
        ${prox && !vazio(q.proximo) ? `<div class="bloco b-proximo"><b>Próximo passo</b>${txt(T(q.proximo))}</div>` : ""}
      </div>`;
      ligarCopiar(box);
      box.scrollIntoView({ behavior: "smooth", block: "start" });
      if (!prox) return;            // bloqueado: continua o botão "Continuar", que exige a resposta
      const acoes = p.querySelector("#acoes");
      acoes.innerHTML = "";
      const b = el(`<button class="btn btn-primario seta">${prox === "RESULTADO" ? "Ver meu resumo" : "Seguir"}</button>`);
      b.onclick = () => { if (prox === "RESULTADO") { S.hist.push("RESULTADO"); salvar(); ir(telaResultado); } else ir(telaPergunta, prox); };
      acoes.appendChild(b);
      const c = el(`<button class="btn btn-claro">Corrigir minha resposta</button>`);
      c.onclick = () => ir(telaPergunta, cod);
      acoes.appendChild(c);
    }
    return p;
  }

  function limparInvisiveis() {
    let cod = Motor.proxima(M, {}, null);
    const R = {};
    while (cod !== "RESULTADO") {
      const r = S.R[cod];
      /* resposta de opção que não existe mais nesta versão da pergunta (ex.: M4.P14 depois de trocar M4.P02) */
      if (r && r.estado === "opcao" && !Motor.versao(M, R, M.porCodigo[cod]).opcoesLista.includes(r.opcao)) break;
      if (r === undefined) break;
      R[cod] = r;
      cod = Motor.proxima(M, R, cod);
    }
    Object.keys(S.R).forEach((k) => { if (!(k in R)) delete S.R[k]; });
  }

  /* ================= resultado: resumo das respostas + alertas da planilha ================= */
  function telaResultado() {
    const regras = Motor.regrasTodas(M, S.R);
    const lac = Motor.lacunas(regras), enc = Motor.encaminhamentos(regras), ale = Motor.alertas(regras);
    const resp = Motor.respondidas(M, S.R);
    const ns = resp.filter((q) => Motor.valor(S.R, q.codigo) === Motor.NS);
    const p = el(`
      <div class="pag">
        ${topo("Resultado")}
        ${heroi({ kicker: "Resultado", kickerClasse: "passo", titulo: "Resumo das suas respostas" })}
        <main class="corpo">
          ${concluido()}
          ${entendemos(ns.length)}
          <div class="res-num">
            <div class="lbl">Perguntas respondidas</div>
            <div class="val">${resp.length}</div>
            <div class="sub">${ns.length ? `${ns.length} com “Não sei”` : "nenhuma com “Não sei”"}</div>
          </div>
          <div class="aviso">${esc(D.mapa.mensagem_limite)}</div>

          <details class="respostas"><summary>Ver suas respostas (${resp.length})</summary>
          ${resp.map((q, i) => { const v = Motor.valor(S.R, q.codigo), se = Motor.retornoSe(q, v), de = S.R[q.codigo].de; return `
            <div class="etapa ${v === Motor.NS ? "e-conf" : "e-sim"}">
              <div class="etapa-topo"><span class="etq">${i + 1}</span><b>${esc(T(Motor.versao(M, S.R, q).pergunta))}</b></div>
              <p>${txt(v)}</p>
              ${de ? `<p class="selo-m"><b>Veio do Módulo ${de}</b></p>` : ""}
              ${vazio(q.alerta) ? "" : `<p class="mini-info"><b>Atenção:</b> ${txt(T(q.alerta))}</p>`}
              ${vazio(se) ? "" : `<p class="mini-info">${txt(se)}</p>`}
              ${vazio(q.proximo) ? "" : `<p class="mini-info"><b>Próximo passo:</b> ${txt(T(q.proximo))}</p>`}
            </div>`; }).join("")}
          </details>

          ${regras.length ? `<div class="secao-titulo">Orientações</div>${regras.map((r) => `<div class="cartao"><p>${esc(T(r.texto))}</p>
            ${vazio(r.proximo) ? "" : `<p class="mini-info"><b>Próximo passo:</b> ${esc(T(r.proximo))}</p>`}</div>`).join("")}` : ""}
          ${ale.length ? `<div class="secao-titulo">Alertas</div>${ale.map((a) => `<div class="bloco b-alerta">${esc(T(a))}</div>`).join("")}` : ""}
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
          ${botaoVoltar()}
          <div class="acoes lg2-proximo"><a class="btn btn-primario" style="text-decoration:none;text-align:center;box-sizing:border-box" href="/lg2/turma-a/m05/index.html">Ir para o Módulo 5</a></div>
          ${rodape()}
        </main>
      </div>`);
    ligar(p);
    p.querySelector("#v").onclick = () => { S.hist.pop(); const a = S.hist.pop(); salvar(); ir(telaPergunta, a); };
    p.querySelector("#imp").onclick = () => { p.querySelectorAll("details.respostas").forEach((d) => (d.open = true)); window.print(); };
    p.querySelector("#rev").onclick = () => { S.hist = []; salvar(); ir(telaPergunta, Motor.proxima(M, {}, null)); };
    p.querySelector("#novo").onclick = () => { if (confirm("Começar uma nova análise? As respostas atuais serão apagadas.")) { S = novo(); salvar(); ir(telaPergunta, Motor.proxima(M, {}, null)); } };
    return p;
  }

  /* caixa "O que entendemos até aqui": frases montadas com as respostas deste e dos outros módulos */
  function entendemos(nNaoSei) {
    const val = (c) => { const v = Motor.valor(S.R, c); return v && v !== Motor.NS ? String(v).trim() : ""; };
    const aspas = (s) => `“${String(s).replace(/[.\s]+$/, "")}”`;
    const frases = [];
    const ideia = val("M4.P01"), tipo = val("M4.P02");
    const TIPO = { "Produto": "um produto (você faz o que vende)", "Mercadoria": "uma mercadoria (você compra pronto para revender)",
      "Serviço": "um serviço (o cliente paga pelo seu trabalho)", "Mercadoria+ Serviço": "uma mercadoria junto com um serviço",
      "Produto+ Serviço": "um produto junto com um serviço", "Mercadoria+Produto": "mercadorias para revender junto com produtos que você faz" };
    if (ideia) frases.push(`Você quer oferecer ${aspas(ideia)}${tipo ? `, que é ${TIPO[tipo] || tipo.toLowerCase()}` : ""}.`);
    else if (tipo) frases.push(`O que você oferece é ${TIPO[tipo] || tipo.toLowerCase()}.`);
    const est = opcaoDe(lerOutro(M1, "M1.P01"));
    if (/cabeça/i.test(est)) frases.push("Como a ideia ainda não saiu do papel, este teste vai ser o seu primeiro contato com clientes de verdade.");
    else if (/testar|amostra/i.test(est)) frases.push("Você já fez um pouco para testar; agora o teste ajuda a ver se as pessoas pagam de verdade.");
    else if (/vend/i.test(est)) frases.push("Você já vende, então o teste serve para confirmar ou ajustar o que já faz.");
    const cli = val("M4.P08"), dor = val("M4.P09");
    if (cli && dor) frases.push(`Seu primeiro cliente é ${aspas(cli)}, e o problema que você ajuda a resolver é ${aspas(dor)}.`);
    else if (cli) frases.push(`Seu primeiro cliente é ${aspas(cli)}.`);
    else if (dor) frases.push(`O problema que você ajuda a resolver é ${aspas(dor)}.`);
    const prop = val("M4.P12"), ganho = val("M4.P10"), motivo = val("M4.P11");
    if (prop) frases.push(`Sua proposta de valor, por enquanto: ${aspas(prop)}.`);
    else if (ganho || motivo) frases.push([ganho && `O cliente ganha ${aspas(ganho)}`, motivo && motivo !== "Outro" && `e escolheria você por ${motivo.toLowerCase()}`].filter(Boolean).join(" ") + ".");
    const teste = val("M4.P14"), dias = val("M4.P20"), gasto = val("M4.P21"), crit = val("M4.P19");
    if (teste) {
      let f = `No primeiro teste, você vai ${teste.charAt(0).toLowerCase() + teste.slice(1)}`;
      if (dias) f += `, durante ${dias} dias`;
      if (gasto) f += /^0+([,.]0+)?$/.test(gasto) ? ", sem gastar dinheiro" : `, gastando no máximo R$ ${gasto}`;
      f += crit ? `, e vai considerar que deu certo com ${aspas(crit)}.` : ".";
      frases.push(f);
    }
    if (nNaoSei) frases.push(`Ainda ${nNaoSei === 1 ? "ficou 1 ponto" : `ficaram ${nNaoSei} pontos`} em aberto (marcados com “Não sei”); vale voltar neles antes de testar.`);
    if (!frases.length) frases.push("Ainda faltam respostas para montarmos o resumo do seu negócio.");
    return `<section class="entendemos"><h2>O que entendemos até aqui</h2>${frases.map((f) => `<p>${esc(f)}</p>`).join("")}</section>`;
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
