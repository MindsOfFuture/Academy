/* Telas do Módulo 9 (Turma B). Todo texto de conteúdo vem de window.MODULO9 (documento final do
   Grupo 9, 30/10/2026), sem edição. As regras (quais perguntas aparecem, checklist, resumo) ficam em
   motor.js. Lê as respostas dos Módulos 1, 4, 6, 7 e 8 guardadas neste aparelho só para pré-preencher
   e cruzar; nunca escreve nelas. As respostas deste módulo ficam só neste aparelho. */
(function () {
  "use strict";
  const D = window.MODULO9, Mo = window.Motor9;
  const tela = document.getElementById("tela");
  const CHAVE = "lg2-turma-b-m09";
  const VERSAO = 2; // v2 = documento final (códigos M9-01…); descarta as respostas da versão anterior
  const NS = Mo.NS;
  const Q = Object.fromEntries(D.perguntas.map((q) => [q.codigo, q]));
  const BASE = Object.fromEntries(D.base.map((b) => [b.codigo, b]));

  /* ---------- estado ---------- */
  function novo() { return { v: VERSAO, R: {}, feitos: {}, voltarResumo: false }; }
  function carregar() { try { const s = JSON.parse(localStorage.getItem(CHAVE)); return s && s.v === VERSAO && s.R ? Object.assign(novo(), s) : novo(); } catch (e) { return novo(); } }
  let S = carregar();
  let aviso = "";
  function salvar() {
    try { localStorage.setItem(CHAVE, JSON.stringify(S)); aviso = ""; }
    catch (e) { aviso = "Não foi possível salvar. Mantenha a página aberta e imprima o resultado para guardar suas respostas."; }
  }

  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  /* texto com endereço da internet: o endereço vira link */
  const comLinks = (s) => esc(s).replace(/https?:\/\/[^\s)]*[^\s).,;]/g, (u) => `<a href="${u}" target="_blank" rel="noopener">${u}</a>`);
  const link = (u, t) => `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(t || u)}</a>`;
  function el(html) { const d = document.createElement("div"); d.innerHTML = html.trim(); return d.firstElementChild; }
  function ir(f, a) { tela.innerHTML = ""; tela.appendChild(f(a)); window.scrollTo(0, 0); }
  function redesenhar(f, a) { const y = window.scrollY; tela.innerHTML = ""; tela.appendChild(f(a)); window.scrollTo(0, y); }
  const cap1 = (s) => { s = String(s || "").trim(); return s.charAt(0).toUpperCase() + s.slice(1); };

  /* ---------- respostas dos outros módulos neste aparelho (só leitura) ---------- */
  function lerR(chave) { try { const s = JSON.parse(localStorage.getItem(chave)); return (s && s.R) || {}; } catch (e) { return {}; } }
  function lerEstado(chave) { try { return JSON.parse(localStorage.getItem(chave)) || {}; } catch (e) { return {}; } }
  const valor = (r) => !r ? null : r.estado === "opcao" ? r.opcao : r.estado === "valor" ? r.valor : r.estado === "naosei" ? NS : null;
  const texto = (r) => { const v = valor(r); return typeof v === "string" && v.trim() && v !== NS ? v.trim() : null; };
  const primeiro = (R, cods) => { for (const c of cods) { const t = texto(R[c]); if (t) return t; } return null; };
  const UF = { AC: "Acre", AL: "Alagoas", AP: "Amapá", AM: "Amazonas", BA: "Bahia", CE: "Ceará", DF: "Distrito Federal", ES: "Espírito Santo", GO: "Goiás", MA: "Maranhão", MT: "Mato Grosso", MS: "Mato Grosso do Sul", MG: "Minas Gerais", PA: "Pará", PB: "Paraíba", PR: "Paraná", PE: "Pernambuco", PI: "Piauí", RJ: "Rio de Janeiro", RN: "Rio Grande do Norte", RS: "Rio Grande do Sul", RO: "Rondônia", RR: "Roraima", SC: "Santa Catarina", SP: "São Paulo", SE: "Sergipe", TO: "Tocantins" };
  /* estado a partir da cidade do Módulo 3 ("Juiz de Fora - MG", "Juiz de Fora/MG" ou o nome do estado) */
  function estadoDe(t) {
    if (!t) return null;
    const m = /(?:^|[\s,/–-])([A-Z]{2})\s*$/.exec(t.trim());
    if (m && UF[m[1]]) return UF[m[1]];
    const nomes = D.viabilidade.estados.map((e) => e.estado);
    return nomes.find((n) => t.toLowerCase().includes(n.toLowerCase())) || null;
  }
  function contexto() {
    const m1 = lerR("lg2-turma-a-m01"), m3 = lerR("lg2-turma-a-m03"), m4 = lerR("lg2-turma-a-m04"), m6 = lerR("lg2-turma-b-m06"), m8 = lerR("lg2-turma-b-m08");
    const e7 = lerEstado("lg2-turma-b-m07");
    const reg4 = valor(m4["M4-11"]) || valor(m4["M4.P15"]);
    const cnpj = valor(m8["M8-02"]) || valor(m8["M8.P05"]);
    const exp = valor(m1["M1-08"]) || valor(m1["M1.P04"]);
    const preoc = valor(m1["M1.P08"]);
    const itens6 = ["M6-01", "M6.P01", "M6.P10", "M6.P13"].map((c) => texto(m6[c])).filter(Boolean).join(" ");
    const texto7 = JSON.stringify([e7.mapa || [], e7.R || {}, e7.ini || {}]);
    const cidade = primeiro(m3, ["M3-08"]);
    return {
      descricao: primeiro(m8, ["M8-01", "M8.P01"]),
      oferta: primeiro(m1, ["M1-01", "M1.P03"]),
      cnpj: cnpj && cnpj !== NS ? cnpj : null,
      cnae: primeiro(m8, ["M8-04", "M8.P06"]),
      estado: estadoDe(cidade),
      m4Regulada: typeof reg4 === "string" && reg4.startsWith("Sim"),
      m4NaoRegulada: reg4 === "Não",
      semCnpj: cnpj === "Não",
      poucaExperiencia: exp === "Sei um pouco, ainda estou aprendendo" || exp === "Ainda não sei fazer" || preoc === "Ainda não sei fazer direito",
      m6SemReforma: !!itens6 && !/reform|obra|instala|constru|pedreiro/i.test(itens6),
      m7Gas: /\bg[aá]s\b|botij|glp|fog[aã]o/i.test(texto7),
    };
  }

  /* ---------- peças do layout (modelo dos Módulos 6, 7 e 10) ---------- */
  function rodape() {
    return `<footer class="rodape">
      <p class="credito">Conteúdo do Grupo 9 · Laboratório de Gestão II · FACC/UFJF · ${esc(D.modulo.versao)} · ${esc(D.modulo.data)}</p>
      <div class="logos"><img src="assets/logo_facc.png" alt="FACC"><img src="assets/logo_ufjf.svg" alt="UFJF"><img src="assets/logo_mg.svg" alt="Governo de Minas Gerais"></div>
    </footer>`;
  }
  function topo(trilha) {
    return `<div class="barra-topo">
      <img class="logo-mini" src="assets/minds.svg" alt="Minds of the Future">
      <nav class="trilha" aria-label="Você está em"><button class="trilha-link" data-inicio>Início</button><span>/</span><span>Módulo 9</span>${trilha ? `<span>/</span><span>${esc(trilha)}</span>` : ""}</nav>
    </div>`;
  }
  function heroi(o) {
    return `<section class="heroi ${o.grande ? "heroi-grande" : ""}">
      <div class="heroi-topo">
        <div class="heroi-txt">
          <div class="kicker ${o.kickerClasse || ""}">${esc(o.kicker || "Módulo 9")}</div>
          <${o.h1 ? "h1" : "h2"} class="heroi-tit">${esc(o.titulo)}</${o.h1 ? "h1" : "h2"}>
          ${o.texto ? `<p>${esc(o.texto)}</p>` : ""}
        </div>
        <img class="heroi-img" src="assets/${o.grande ? "hero-inicio.webp" : "hero-tela.webp"}" alt="">
      </div>
      ${o.extra || ""}
      ${o.reinicio ? `<button class="reinicio" id="zerar">Recomeçar do zero</button>` : ""}
    </section>`;
  }
  function barraFases(atual, tudo) {
    const fs = D.fases, n = fs.indexOf(atual);
    return `<ol class="etapas" aria-label="Fases do módulo">${fs.map((f, i) => {
      const st = tudo || i < n ? "feita" : i === n ? "atual" : "";
      return `<li class="${st}"${i === n && !tudo ? ' aria-current="step"' : ""}><span class="bola" aria-hidden="true"></span><span class="rot">${esc(f)}</span></li>`;
    }).join("")}</ol>`;
  }
  function chipNegocio() {
    const X = contexto(), t = X.descricao || X.oferta;
    return t ? `<div class="chip-oferta"><span>${esc(t)}</span></div>` : "";
  }
  const botaoVoltar = () => `<div class="acoes acoes-voltar"><button class="btn btn-linha voltar" id="v">Voltar</button></div>`;
  function ligar(p) {
    p.querySelectorAll("[data-inicio]").forEach((b) => { b.onclick = () => ir(telaCapa); });
    p.querySelectorAll("#zerar,#zerar2").forEach((z) => { z.onclick = reiniciar; });
    p.querySelectorAll(".btn-copiar").forEach((b) => (b.onclick = () => { try { navigator.clipboard.writeText(b.dataset.t); } catch (e) {} b.textContent = "Copiado"; }));
  }
  function reiniciar() {
    if (!confirm("Apagar todas as respostas deste módulo e recomeçar? Se quiser guardar, imprima o resultado antes.")) return;
    try { localStorage.removeItem(CHAVE); } catch (e) {}
    S = novo();
    ir(telaCapa);
  }
  /* caixa de retorno da opção: texto literal da coluna "Retorno / mensagem sugerida" */
  function caixa(t, extra) {
    if (!t) return "";
    t = String(t).split("[estado]").join(extra && extra.estado ? extra.estado : "[estado]");
    const pa = Mo.partesAviso(t);
    if (pa.atencao) return `<div class="bloco b-ok"><p>${comLinks(pa.verifique)}</p></div><div class="bloco b-alerta"><b>⚠ Atenção</b><p>${comLinks(pa.atencao)}</p></div>`;
    if (/^Atenção: /.test(t)) return `<div class="bloco b-alerta"><b>Atenção</b><p>${comLinks(t.replace(/^Atenção: /, ""))}</p></div>`;
    return `<div class="bloco b-ok"><p>${comLinks(t)}</p></div>`;
  }
  const cruzBox = (c) => `<div class="bloco ${c.forma === "Dica" ? "b-proximo" : "b-alerta"} cruz"><b>${esc(c.forma)}</b><p>${esc(c.mensagem)}</p></div>`;
  /* conceitos da Base técnica ligados a cada pergunta: escolha do app (o documento não liga) */
  const CONCEITO = {
    "M9-01": ["M9.BT05", "M9.BT20"], "M9-02": ["M9.BT12", "M9.BT11"], "M9-03": ["M9.BT08", "M9.BT09"], "M9-03a": ["M9.BT23"], "M9-03b": ["M9.BT08", "M9.BT17"],
    "M9-04": ["M9.BT05", "M9.BT17", "M9.BT18"], "M9-05": ["M9.BT08"], "M9-06": ["M9.BT14"], "M9-07": ["M9.BT21", "M9.BT22"], "M9-07a": ["M9.BT21"], "M9-07b": ["M9.BT21"],
    "M9-07c": ["M9.BT14"], "M9-08": ["M9.BT09"], "M9-09": ["M9.BT13"], "M9-10": ["M9.BT16"], "M9-11": ["M9.BT15"], "M9-12": ["M9.BT19"],
  };
  const TERMOS_RESULTADO = ["M9.BT01", "M9.BT02", "M9.BT03", "M9.BT04", "M9.BT06", "M9.BT07", "M9.BT10"];
  function termos(cods) {
    const ts = (cods || []).map((c) => BASE[c]).filter(Boolean);
    if (!ts.length) return "";
    return `<details class="saiba"><summary><span>Entenda os termos</span></summary>${ts.map((t) => `<div class="conceito"><b>${esc(t.conceito)}</b><p>${esc(t.definicao)}</p><span class="fonte">Fonte: ${link(t.link, t.referencia)} · consulta em ${esc(t.data)}</span></div>`).join("")}</details>`;
  }
  const instr = (nome) => D.instrumentos.find((x) => x.nome.startsWith(nome)) || {};

  /* ================= capa ================= */
  function telaCapa() {
    const K = D.mapa, X = contexto();
    const comecou = Object.keys(S.R).length > 0;
    const herdado = [
      X.descricao ? ["O que você faz", X.descricao, 8] : X.oferta ? ["O que você vende", X.oferta, 1] : null,
      X.cnpj ? ["CNPJ", X.cnpj, 8] : null,
      X.cnae ? ["CNAE", X.cnae, 8] : null,
      X.estado ? ["Estado", X.estado, 3] : null,
    ].filter(Boolean);
    const p = el(`<div class="pag">
      ${topo("")}
      ${heroi({ grande: true, h1: true, kicker: "Módulo 9", titulo: D.modulo.nome, texto: K.objetivo })}
      <main class="corpo">
        <div class="cartao"><h3>Para quem é</h3><p>${esc(K.usuario)}</p></div>
        <div class="cartao"><h3>O que ter em mãos</h3><p>${esc(K.ter_em_maos)}</p></div>
        <div class="cartao"><h3>O que você recebe no final</h3><p>${esc(K.entrega)}</p></div>
        ${herdado.length ? `<div class="cartao"><h3>Do que você já respondeu</h3>${herdado.map(([r, v, m]) => `<p class="diag-q">${esc(r)} <span class="veio">Veio do Módulo ${m}</span></p><p class="diag-r">${esc(v)}</p>`).join("")}</div>` : ""}
        <p class="aviso">${esc(K.mensagem_limite)}</p>
        <div class="acoes">
          <button class="btn btn-primario seta" id="ir">${comecou ? "Continuar de onde parei" : "Começar"}</button>
          ${comecou ? `<button class="btn btn-claro" id="zerar">Recomeçar do zero</button>` : ""}
          <button class="btn btn-linha" id="limites">O que este módulo não faz</button>
        </div>
        ${rodape()}
      </main>
    </div>`);
    p.querySelector("#ir").onclick = () => {
      S.voltarResumo = false;
      const falta = Mo.sequencia(S.R).find((c) => !S.R[c]);
      falta ? ir(telaPergunta, falta) : ir(telaResultado);
    };
    p.querySelector("#limites").onclick = () => ir(telaLimites);
    ligar(p);
    return p;
  }

  function telaLimites() {
    const p = el(`<div class="pag">
      ${topo("Limites")}
      ${heroi({ titulo: "Limites do módulo" })}
      <main class="corpo">
        <div class="cartao"><h3>O que este módulo não faz</h3><p>${esc(D.mapa.nao_faz)}</p></div>
        <p class="aviso">${esc(D.mapa.mensagem_limite)}</p>
        ${botaoVoltar()}
        ${rodape()}
      </main>
    </div>`);
    p.querySelector("#v").onclick = () => ir(telaCapa);
    ligar(p);
    return p;
  }

  function limparInvisiveis() {
    const vis = new Set(Mo.sequencia(S.R));
    Object.keys(S.R).forEach((k) => { if (k !== "M9-14" && !vis.has(k)) delete S.R[k]; });
  }

  /* ================= pergunta ================= */
  function telaPergunta(cod) {
    const q = Q[cod];
    const seq = Mo.sequencia(S.R);
    const n = Math.max(1, seq.indexOf(cod) + 1);
    const X = contexto();
    const resp = S.R[cod];
    const ultima = cod === "M9-13";
    const p = el(`<div class="pag">
      ${topo(q.fase)}
      ${heroi({ titulo: q.fase, reinicio: true, kicker: `Pergunta ${n} de ${seq.length}`, kickerClasse: "passo", extra: chipNegocio() })}
      <main class="corpo">
        ${barraFases(q.fase)}
        <div class="cartao-q pergunta">
          <h2 class="q" id="pergunta">${esc(q.pergunta)}</h2>
          <div class="entrada" id="ent"></div>
          <div class="erro" id="erro" hidden></div>
          <div id="retorno" aria-live="polite"></div>
          ${termos(CONCEITO[cod])}
          <div class="acoes" id="acoes"><button class="btn btn-primario seta" id="ok">${ultima ? "Ver meu checklist" : "Continuar"}</button></div>
          ${botaoVoltar()}
        </div>
        ${rodape()}
      </main>
    </div>`);
    const ent = p.querySelector("#ent"), box = p.querySelector("#retorno"), err = p.querySelector("#erro"), ok = p.querySelector("#ok");
    const mostrar = (html) => { box.innerHTML = html || ""; err.hidden = true; };
    const erro = (t) => { err.textContent = t; err.hidden = false; };
    const rotuloOk = (t) => { ok.textContent = t; ok.classList.toggle("seta", t !== "Seguir sem responder"); };
    p.querySelector("#v").onclick = () => {
      const s = Mo.sequencia(S.R), i = s.indexOf(cod);
      if (S.voltarResumo) { S.voltarResumo = false; salvar(); return ir(telaResultado); }
      i > 0 ? ir(telaPergunta, s[i - 1]) : ir(telaCapa);
    };
    ligar(p);

    function avancar(r0) {
      S.R[cod] = r0;
      limparInvisiveis();
      salvar();
      const s2 = Mo.sequencia(S.R);
      if (S.voltarResumo && s2.every((c) => S.R[c])) { S.voltarResumo = false; salvar(); return ir(telaResultado); }
      const prox = s2.slice(s2.indexOf(cod) + 1).find((c) => !S.voltarResumo || !S.R[c]) || s2[s2.indexOf(cod) + 1];
      prox ? ir(telaPergunta, prox) : ir(telaResultado);
    }
    /* cruzamentos com a opção marcada agora */
    const cruzAgora = (r0) => Mo.cruzamentos(D, Object.assign({}, S.R, { [cod]: r0 }), X).filter((c) => c.cod === cod).map(cruzBox).join("");
    const veio = (m) => `<p class="veio-linha"><span class="veio">Veio do Módulo ${m}</span></p>`;
    let coletar = null;

    if (cod === "M9-01") {
      let r0 = resp || (X.estado ? { estado: "opcao", opcao: X.estado, de: 3 } : null);
      const sel = el(`<div><label class="rot-campo" for="uf">Estado</label><select class="campo" id="uf"><option value="">Escolha o estado</option>${D.viabilidade.estados.map((e) => `<option ${r0 && r0.opcao === e.estado ? "selected" : ""}>${esc(e.estado)}</option>`).join("")}</select></div>`);
      const nsB = el(`<div class="opcoes"><button class="opcao ${r0 && r0.estado === "naosei" ? "sel" : ""}"><span class="radio" aria-hidden="true"></span><span class="op-txt"><b>${NS}</b></span></button></div>`);
      const ret = () => mostrar(!r0 ? "" : r0.estado === "naosei" ? caixa(Mo.caminho(D, cod, NS).texto) : caixa(q.caminhos[0].texto, { estado: r0.opcao }));
      sel.querySelector("select").onchange = (e) => { r0 = e.target.value ? { estado: "opcao", opcao: e.target.value } : null; nsB.firstElementChild.classList.remove("sel"); ret(); };
      nsB.firstElementChild.onclick = () => { r0 = { estado: "naosei" }; sel.querySelector("select").value = ""; nsB.firstElementChild.classList.add("sel"); ret(); };
      if (!resp && X.estado) ent.appendChild(el(veio(3)));
      ent.appendChild(sel); ent.appendChild(nsB);
      ret();
      coletar = () => { if (!r0) { erro("Escolha o estado ou toque em “Não sei”."); return null; } const { de, ...r } = r0; return r; };
    } else if (cod === "M9-05") {
      const v0 = resp && resp.estado === "valor" ? resp.valor : "";
      let naosei = !!(resp && resp.estado === "naosei");
      const w = el(`<div><div class="linha"><input class="campo" id="area" inputmode="decimal" aria-label="Área em m²" value="${esc(v0)}"><span class="unid">m²</span></div>
        <div class="opcoes"><button class="opcao ${naosei ? "sel" : ""}" id="nsb"><span class="radio" aria-hidden="true"></span><span class="op-txt"><b>${NS}</b></span></button></div></div>`);
      const inp = w.querySelector("#area"), nb = w.querySelector("#nsb");
      const num = (s) => { s = String(s || "").trim(); if (!/^\d{1,3}(\.\d{3})*(,\d+)?$|^\d+([.,]\d+)?$/.test(s)) return NaN; return Number(s.includes(",") ? s.replace(/\./g, "").replace(",", ".") : s); };
      const ret = () => {
        if (naosei) return mostrar(caixa(Mo.caminho(D, cod, NS).texto));
        const s = inp.value.trim();
        if (!s) return mostrar("");
        const x = num(s);
        mostrar(x > 0 ? caixa(q.caminhos.find((c) => c.opcao.startsWith("Área informada")).texto) : caixa(q.caminhos.find((c) => c.opcao === "Valor inválido").texto));
      };
      inp.oninput = () => { naosei = false; nb.classList.remove("sel"); ret(); };
      nb.onclick = () => { naosei = true; inp.value = ""; nb.classList.add("sel"); ret(); };
      ent.appendChild(w);
      ret();
      coletar = () => {
        if (naosei) return { estado: "naosei" };
        const s = inp.value.trim();
        if (!s) { erro("Informe a área ou toque em “Não sei”."); return null; }
        if (!(num(s) > 0)) { ret(); return null; }
        return { estado: "valor", valor: s };
      };
    } else if (cod === "M9-13") {
      const v0 = resp && resp.estado === "valor" ? resp.valor : "";
      const ta = el(`<textarea class="campo" rows="4" id="ideias" aria-label="Suas ideias">${esc(v0)}</textarea>`);
      const ret = () => mostrar(caixa(q.caminhos.find((c) => c.opcao === (ta.value.trim() ? "Texto preenchido" : "Em branco")).texto));
      ta.oninput = ret;
      ent.appendChild(ta);
      if (resp) ret();
      coletar = () => ({ estado: "valor", valor: ta.value.trim() });
    } else {
      /* escolha única com retorno ao tocar */
      const ops = q.caminhos.flatMap((c) => c.opcoes);
      let pre = null;
      if (!resp && cod === "M9-02" && X.m4NaoRegulada) pre = "Não";
      let op = resp ? (resp.estado === "naosei" ? NS : resp.opcao) : pre;
      let avisando = false;
      const wrap = el(`<div class="opcoes"></div>`);
      const pintar = () => wrap.querySelectorAll(".opcao").forEach((x) => x.classList.toggle("sel", x.dataset.v === op));
      const ret = () => {
        if (!op) { mostrar(""); avisando = false; rotuloOk("Continuar"); return; }
        const r0 = op === NS ? { estado: "naosei" } : { estado: "opcao", opcao: op };
        const c = Mo.caminho(D, cod, op);
        avisando = op === NS && Mo.AVISO_NS.includes(cod);
        mostrar(caixa(c.texto) + (avisando ? `<div class="acoes ns-acoes"><button class="btn btn-claro" id="verifiquei">Já verifiquei</button></div>` : "") + cruzAgora(r0));
        rotuloOk(avisando ? "Seguir sem responder" : "Continuar");
        const jv = box.querySelector("#verifiquei");
        if (jv) jv.onclick = () => { op = null; pintar(); ret(); p.querySelector("#pergunta").scrollIntoView({ block: "start" }); };
      };
      if (pre) ent.appendChild(el(veio(4)));
      ops.forEach((o) => {
        const b = el(`<button class="opcao" data-v="${esc(o)}"><span class="radio" aria-hidden="true"></span><span class="op-txt"><b>${esc(o)}</b></span></button>`);
        b.onclick = () => { op = o; pintar(); ret(); };
        wrap.appendChild(b);
      });
      ent.appendChild(wrap);
      pintar();
      if (op) ret();
      coletar = () => {
        if (!op) { erro("Escolha uma opção para continuar."); return null; }
        return op === NS ? { estado: "naosei" } : { estado: "opcao", opcao: op };
      };
    }
    ok.onclick = () => { const r0 = coletar(); if (r0) avancar(r0); };
    return p;
  }

  /* ================= resultado: checklist e resumo (tela M9-14) ================= */
  function telaResultado() {
    const X = contexto();
    const R = S.R, seq = Mo.sequencia(R);
    const itens = Mo.checklist(D, R, S.feitos);
    const ale = Mo.alertas(D, R, X), prox = Mo.proximos(D, R, itens), enc = Mo.encaminhamento(itens), orgs = Mo.orgaos(itens);
    const L = Mo.local(R);
    const q14 = Q["M9-14"], r14 = R["M9-14"];
    const estado = Mo.op(R, "M9-01");
    const linkUF = Mo.linkEstado(D, R);
    const linkOrgao = (k) => k === "prefeitura"
      ? { u: linkUF, t: estado && estado !== NS ? `Consulta de viabilidade · ${estado}` : "Consulta de viabilidade · portais de todos os estados", d: D.viabilidade.data }
      : { u: BASE[Mo.ORGAOS[k].base].link, t: BASE[Mo.ORGAOS[k].base].referencia, d: BASE[Mo.ORGAOS[k].base].data };
    /* respostas que explicam cada item */
    const LIGA = { viabilidade: ["M9-04"], local: ["M9-05", "M9-06", "M9-08", "M9-09"], gas: ["M9-07", "M9-07a", "M9-07b", "M9-07c"], bombeiros: ["M9-06", "M9-07", "M9-07c"], vigilancia: ["M9-02", "M9-09"], ambulante: ["M9-03a"], conselho: ["M9-10"], ambiente: ["M9-11"], obra: ["M9-12"] };
    const resposta = (c) => { const v = Mo.op(R, c); return v == null ? "" : c === "M9-05" && v !== NS ? `${v} m²` : v; };
    const cls = { "feito": "e-sim", "a fazer": "e-fazer", "não se aplica": "e-nao", "a confirmar": "e-conf" };
    const I1 = instr("Checklist"), I2 = instr("Nível de risco"), I3 = instr("Lista de órgãos"), I4 = instr("Linha-resumo");
    const datas = [...new Set(orgs.map((k) => linkOrgao(k).d))].join(" e ");
    const respostas = seq.map((k) => [Q[k].pergunta, k]);
    const ia = D.pedidos_ia[0];
    const iaTexto = ia.texto.replace("[município/UF]", estado && estado !== NS ? `[seu município]/${estado}` : "[município/UF]").replace("[descrição do Módulo 8]", X.descricao || X.oferta || "[descrição do Módulo 8]");
    const p = el(`<div class="pag">
      ${topo("Resultado")}
      ${heroi({ kicker: "Resultado", kickerClasse: "passo", titulo: "Seu checklist de endereço e licenças", extra: chipNegocio() })}
      <main class="corpo">
        ${barraFases(null, true)}
        <section class="concluido">
          <div class="conc-topo"><span class="check" aria-hidden="true"></span><div><h2>Você concluiu o Módulo 9</h2><p>Veja abaixo o resultado pelas suas respostas.</p></div></div>
        </section>
        <section class="cartao" id="linha-resumo"><h3>Em uma linha</h3><p>${esc(Mo.linhaResumo(D, R, itens))}</p><p class="aviso-inst">${esc(I4.aviso)}</p></section>
        <section class="cartao" id="risco"><h3>Nível de risco provável</h3>
          <p class="diag-r"><b>A confirmar na consulta de viabilidade.</b></p>
          ${X.cnae ? `<p class="diag-q">CNAE <span class="veio">Veio do Módulo 8</span></p><p class="diag-r">${esc(X.cnae)}</p>` : ""}
          ${X.cnpj ? `<p class="diag-q">CNPJ <span class="veio">Veio do Módulo 8</span></p><p class="diag-r">${esc(X.cnpj)}</p>` : ""}
          <p class="aviso-inst">${esc(I2.aviso)}</p>
        </section>
        ${ale.length ? `<section class="cartao" id="alertas"><h3>Alertas</h3>${ale.map((a) => `<div class="bloco b-alerta"><p>${comLinks(a)}</p></div>`).join("")}</section>` : ""}
        ${prox.length ? `<section class="cartao" id="proximos"><h3>Próximos passos</h3><ol class="lista-capa">${prox.map((x) => `<li>${comLinks(x)}</li>`).join("")}</ol></section>` : ""}
        ${enc ? `<section class="cartao" id="encaminhamento"><h3>Encaminhamento</h3><div class="bloco b-enc"><p>${esc(Mo.ORGAOS[enc.orgao].nome)} · ${esc(enc.item)}</p><p>${link(linkOrgao(enc.orgao).u, linkOrgao(enc.orgao).t)}</p></div></section>` : ""}
        <div class="secao-titulo">Checklist</div>
        ${L.planejado ? `<div class="bloco b-proximo"><b>Local pretendido</b><p>${esc(Mo.caminho(D, "M9-03b", Mo.op(R, "M9-03b")).texto)}</p></div>` : ""}
        <div id="checklist">${itens.map((it) => `
          <div class="etapa ${cls[it.sit]}" data-item="${it.id}">
            <div class="etapa-topo"><b>${esc(it.nome)}</b>${it.hipotese ? `<span class="hip">hipótese</span>` : ""}<span class="sit">${esc(it.sit)}</span></div>
            ${it.motivo ? `<p class="mini-info">${esc(it.motivo)}</p>` : ""}
            ${LIGA[it.id].filter((c) => seq.includes(c) && R[c]).map((c) => `<p class="mini-info"><b>${esc(Q[c].descobre)}:</b> ${esc(resposta(c))}</p>`).join("")}
            ${it.avisos.map((a) => `<p class="aviso-ck">⚠ Atenção: ${esc(a)}</p>`).join("")}
            ${it.sit === "não se aplica" ? "" : `<p class="mini-info"><b>Onde confirmar:</b> ${it.orgaos.map((k) => esc(Mo.ORGAOS[k].nome)).join(" · ")}</p>
              <p class="fonte">${it.id === "viabilidade" ? link(linkUF, linkOrgao("prefeitura").t) : link(BASE[it.base].link, BASE[it.base].referencia)}</p>`}
            ${it.sit === "a fazer" || it.sit === "a confirmar" || it.marcado ? `<label class="chk"><input type="checkbox" data-feito="${it.id}" ${it.marcado ? "checked" : ""}><span>Já fiz</span></label>` : ""}
          </div>`).join("")}</div>
        <p class="aviso-inst">${esc(I1.aviso)}</p>
        ${orgs.length ? `<section class="cartao" id="orgaos"><h3>Órgãos a procurar</h3>${orgs.map((k) => { const l = linkOrgao(k); return `<p class="diag-q">${esc(Mo.ORGAOS[k].nome)}</p><p class="diag-r">${link(l.u, l.t)}</p>`; }).join("")}
          <p class="aviso-inst">${esc(I3.aviso.replace("[data]", datas))}</p></section>` : ""}
        <details class="saiba"><summary><span>${esc(ia.pedido)} (pedido para ferramentas de IA)</span></summary><div class="caixa caixa-ia"><div class="prompt"><p>${esc(iaTexto)}</p><button class="btn-copiar" data-t="${esc(iaTexto)}">Copiar texto</button></div><p class="ex">${esc(ia.conferir)}</p><p class="ex">${esc(ia.obs)}</p></div></details>
        ${termos(TERMOS_RESULTADO)}
        <p class="aviso">${esc(D.mapa.mensagem_limite)}</p>
        <section class="cartao-q pergunta" id="q14">
          <h2 class="q">${esc(q14.pergunta)}</h2>
          <div class="opcoes" id="op14">${q14.caminhos.flatMap((c) => c.opcoes).map((o) => `<button class="opcao ${r14 && r14.opcao === o ? "sel" : ""}" data-o="${esc(o)}"><span class="radio" aria-hidden="true"></span><span class="op-txt"><b>${esc(o)}</b></span></button>`).join("")}</div>
          <div id="ret14">${r14 ? caixa(Mo.caminho(D, "M9-14", r14.opcao).texto) : ""}</div>
          <div id="corr" ${r14 && r14.opcao === "Quero corrigir algo" ? "" : "hidden"}>${respostas.map(([tx, k]) => `<div class="corr-item"><span>${esc(tx)}</span><button class="btn btn-claro editar" data-c="${k}">Corrigir minha resposta</button></div>`).join("")}</div>
        </section>
        <div class="acoes"><button class="btn btn-primario" id="imprimir">Imprimir resultado</button><button class="btn btn-linha" id="zerar2">Recomeçar do zero</button></div>
        ${botaoVoltar()}
        <div class="acoes lg2-proximo"><a class="btn btn-primario" style="text-decoration:none;text-align:center;box-sizing:border-box" href="/lg2/turma-b/m10/index.html">Ir para o Módulo 10</a></div>
        ${rodape()}
      </main>
    </div>`);
    const re = () => { salvar(); redesenhar(telaResultado); };
    p.querySelector("#v").onclick = () => { const s = Mo.sequencia(S.R); ir(telaPergunta, s[s.length - 1]); };
    p.querySelector("#imprimir").onclick = () => window.print();
    p.querySelectorAll("#op14 .opcao").forEach((b) => (b.onclick = () => { S.R["M9-14"] = { estado: "opcao", opcao: b.dataset.o }; re(); }));
    p.querySelectorAll("[data-c]").forEach((b) => (b.onclick = () => { S.voltarResumo = true; salvar(); ir(telaPergunta, b.dataset.c); }));
    p.querySelectorAll("[data-feito]").forEach((x) => (x.onchange = () => { if (x.checked) S.feitos[x.dataset.feito] = true; else delete S.feitos[x.dataset.feito]; re(); }));
    ligar(p);
    if (aviso) p.querySelector(".corpo").insertBefore(el(`<p class="erro">${esc(aviso)}</p>`), p.querySelector(".corpo").firstChild);
    return p;
  }

  ir(telaCapa);
})();
