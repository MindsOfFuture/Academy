/* Telas do Módulo 6 (versão A). Todo texto de conteúdo vem de window.MODULO6 (a planilha),
   sem edição. As respostas ficam só neste aparelho.
   Layout do Módulo 5: barra do topo com trilha, faixa roxa com ilustração, etapas pelas seções
   da planilha (GERAL → seção do negócio → Resultado), cartão da pergunta e cartão de conclusão. */
(function () {
  "use strict";
  const D = window.MODULO6, M = Motor.montar(D);
  const tela = document.getElementById("tela");
  const CHAVE = "lg2-turma-b-m06";
  /* o módulo mudou de turma em 15/10: traz as respostas salvas na chave antiga */
  try { const antiga = localStorage.getItem("lg2-turma-a-m06"); if (antiga && !localStorage.getItem(CHAVE)) localStorage.setItem(CHAVE, antiga); } catch (e) {}
  const vazio = (s) => !s || !String(s).trim() || s === "—" || s === "-" || s === "Nenhum" || s === "Nenhuma";

  /* as respostas guardadas pela planilha v0.1 usam outra numeração de perguntas: começam do zero */
  const DADOS = "2026-10-15";
  const MSG_NUMERO = "Digite só números. Ex.: 12,50";
  const MAX_DICAS = 4;     // "Dicas gerais" fica curta
  const SEM_COMPRAS = "Não tenho compras a fazer agora";
  const SEM_COMPRAS_RET = "Tudo bem: sem compras para começar agora. Pulamos o valor das compras e a lista de prioridades.";

  /* teclado do celular: o campo em foco (e o Continuar logo abaixo) vai para o meio da área visível */
  const ehCampo = (x) => x && x.matches && x.matches("input, textarea, select");
  function mostrarCampo(alvo) {
    alvo.scrollIntoView({ block: "center" });
    /* se o Continuar ainda ficou atrás do teclado, sobe um pouco mais, sem esconder o campo */
    const ok = document.querySelector("#ok"); if (!ok) return;
    const vh = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    const falta = ok.getBoundingClientRect().bottom - vh + 12, sobra = alvo.getBoundingClientRect().top - 8;
    if (falta > 0) window.scrollBy(0, Math.min(falta, sobra));
  }
  document.addEventListener("focusin", (e) => {
    if (!ehCampo(e.target)) return;
    const alvo = e.target;
    setTimeout(() => { if (document.activeElement === alvo) mostrarCampo(alvo); }, 300);
  });
  if (window.visualViewport) window.visualViewport.addEventListener("resize", () => {
    const a = document.activeElement;
    if (ehCampo(a)) mostrarCampo(a);
  });
  let S = carregar();   // { R: respostas, hist: [códigos], prio: {item: categoria}, fluxo: null|{...}, cen: {...} }
  /* (herdarNegocio() roda logo abaixo, depois que o motor e as leituras estão prontos) */
  function carregar() { try { const s = JSON.parse(localStorage.getItem(CHAVE)); return s && s.dados === DADOS ? s : novo(); } catch { return novo(); } }
  function novo() { return { dados: DADOS, R: {}, hist: [], prio: {}, fora: [], fluxo: null, cen: null }; }
  function salvar() { try { localStorage.setItem(CHAVE, JSON.stringify(S)); } catch {} }

  /* ================= o que já veio de outros módulos (só leitura; nunca escreve nas chaves deles) ================= */
  function lerOutro(chave, cod) {
    try { const s = JSON.parse(localStorage.getItem(chave)); const r = s && s.R && s.R[cod]; return r || null; } catch { return null; }
  }
  const K = { 1: "lg2-turma-a-m01", 3: "lg2-turma-a-m03", 4: "lg2-turma-a-m04", 5: "lg2-turma-a-m05", 8: "lg2-turma-b-m08" };
  const opcaoDe = (r) => r && r.estado === "opcao" && r.opcao ? String(r.opcao) : null;
  const valorTxt = (r) => r && r.estado === "valor" && typeof r.valor === "string" && r.valor.trim() ? r.valor.trim() : null;
  const listaDe = (r) => r && r.estado === "valor" && Array.isArray(r.valor) ? r.valor.filter((x) => typeof x === "string" && x.trim()).map((x) => x.trim()) : [];
  const doM5 = (c) => lerOutro(K[5], "M5." + c);
  /* tipo de oferta: M1.P03A → M5.P01 → M4.P02 → M8.P02, pela palavra inicial da opção */
  const TIPOS = { produto: "Produto", mercadoria: "Mercadoria", "serviço": "Serviço", servico: "Serviço" };
  function tipoDe(txt) { const m = /^\s*(produto|mercadoria|servi[çc]o)/i.exec(txt || ""); return m ? TIPOS[m[1].toLowerCase()] : null; }
  function tipoHerdado() {
    for (const [mod, cod] of [[1, "M1.P03A"], [5, "M5.P01"], [4, "M4.P02"], [8, "M8.P02"]]) {
      const t = tipoDe(opcaoDe(lerOutro(K[mod], cod)));
      if (t && M.porCodigo[Motor.NEGOCIO] && M.porCodigo[Motor.NEGOCIO].opcoesLista.includes(t)) return { tipo: t, modulo: mod };
    }
    return null;
  }
  /* com o tipo já conhecido, o seletor não vira pergunta: entra pronto, com selo e opção de trocar */
  function herdarNegocio() {
    if (S.R[Motor.NEGOCIO]) return;
    const t = tipoHerdado();
    if (t) { S.R[Motor.NEGOCIO] = { estado: "opcao", opcao: t.tipo, herdado: t.modulo }; salvar(); }
  }
  /* limite de investimento dito no Módulo 1 (M1.P07): aviso, sem trava */
  const TETO_M1 = { "Nada por enquanto": 0, "Até R$ 100": 100, "Entre R$ 100 e R$ 500": 500, "Entre R$ 500 e R$ 1.000": 1000, "Mais de R$ 1.000": null };
  function tetoM1() {
    const op = opcaoDe(lerOutro(K[1], "M1.P07"));
    if (!op) return null;
    const txt = op.replace(/^\s*\d+\.\s*/, "").trim();
    return txt in TETO_M1 ? { texto: txt, teto: TETO_M1[txt] } : null;
  }
  const brl0 = (n) => "R$ " + n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const numero = (n) => n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  /* respostas do Módulo 5 que respondem perguntas daqui (pré-preenchidas; a pessoa confere e toca Continuar) */
  const FORMA_M5 = { "Pix": "Pix", "Dinheiro": "Dinheiro", "Cartão de débito": "Cartão de débito", "Cartão de crédito": "Cartão de crédito à vista", "Outra forma": "Outra forma" };
  function heranca(cod) {
    const q = M.porCodigo[cod];
    if (cod === "M6.P04") {
      const pg = listaDe(doM5("PG"));
      const ops = q.opcoesLista.filter((o) => pg.some((f) => FORMA_M5[f] === o));
      if (!ops.length) return null;
      return { opcoes: ops, modulo: 5, nota: pg.includes("Cartão de crédito") ? "No Módulo 5 você marcou cartão de crédito. Se for aceitar parcelar, marque também “Cartão de crédito parcelado”." : "" };
    }
    if (cod === "M6.P05") {
      const preco = Motor.num(valorTxt(doM5("P36"))), qtd = Motor.num(valorTxt(doM5("P37")));
      if (!(preco > 0 && qtd > 0)) return null;
      return { valor: numero(preco * qtd), modulo: 5, nota: `Conta feita com o que você disse no Módulo 5: ${brl0(preco)} por venda × ${qtd.toLocaleString("pt-BR")} vendas no mês.` };
    }
    if (cod === "M6.P06") {
      const it = [], sim = (c) => opcaoDe(doM5(c)) === "Sim";
      const v = (c) => { const n = Motor.num(valorTxt(doM5(c))); return n > 0 ? n : null; };
      if (sim("P28") && v("P29")) it.push(["Aluguel", v("P29")]);
      if (sim("P30") && v("P31")) it.push(["Água e luz", v("P31")]);
      const outros = doM5("P33");
      if (sim("P32") && outros && Array.isArray(outros.valor))
        outros.valor.forEach((x) => { const n = Motor.num(x && x.v); if (x && String(x.nome || "").trim() && n > 0) it.push([String(x.nome).trim(), n]); });
      if (!it.length) return null;
      const total = it.reduce((a, x) => a + x[1], 0);
      return { valor: it.map(([n, x]) => `${n}: ${brl0(x)}`).join("; "), modulo: 5, nota: `São os gastos de todo mês que você informou no Módulo 5 (total de ${brl0(total)} por mês).` };
    }
    const lista = { "M6.P10": "P19", "M6.P15": "P03" }[cod];
    if (lista) { const l = listaDe(doM5(lista)); return l.length ? { valor: l.join(", "), modulo: 5, nota: "" } : null; }
    if (cod === "M6.P11") {
      const precos = (doM5("P20") || {}).valor;
      const soma = Array.isArray(precos) ? precos.map((x) => Motor.num(x)).filter((n) => n > 0).reduce((a, n) => a + n, 0) : 0;
      return soma > 0 ? { valor: numero(soma), modulo: 5, nota: "Soma dos preços de compra dos itens que você informou no Módulo 5." } : null;
    }
    if (cod === "M6.P16") { const t = valorTxt(doM5("P10")); return t ? { valor: t, modulo: 5, nota: "" } : null; }
    if (cod === "M6.P17") { const n = Motor.num(valorTxt(doM5("P11"))); return n > 0 ? { valor: numero(n), modulo: 5, nota: "É o valor de compra que você informou no Módulo 5." } : null; }
    return null;
  }

  /* Perguntas da seção do negócio que repetem as do começo (P01 "o que precisa comprar" e P02 "quanto vai gastar"):
     quem já respondeu a P01 não vê de novo a lista de equipamentos/materiais nem o valor deles.
     O dado não se perde: a lista e o valor do começo já entram nos itens e no investimento. */
  const REPETE_P01 = ["M6.P10", "M6.P11", "M6.P13", "M6.P14"];
  const p01Respondida = (R) => !!R["M6.P01"] && R["M6.P01"].estado === "valor";
  function pulada(c, R) {
    if (c === Motor.NEGOCIO) return !!(R[c] && R[c].herdado);
    if (c === "M6.P02" && R["M6.P01"] && R["M6.P01"].semCompras) return true;     // sem compras: não pergunta quanto vai gastar
    return REPETE_P01.includes(c) && p01Respondida(R);
  }
  function proxima(R, cod) {
    let c = Motor.proxima(M, R, cod);
    while (c !== "RESULTADO" && pulada(c, R)) c = Motor.proxima(M, R, c);
    return c;
  }

  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const link = (u, t) => /^https?:/.test(u || "") ? `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(t || u)}</a>` : esc(t || u);
  const brl = (n) => (n < 0 ? "−" : "") + "R$ " + Math.abs(n).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  function el(html) { const d = document.createElement("div"); d.innerHTML = html.trim(); return d.firstElementChild; }
  function ir(f, a) { tela.innerHTML = ""; tela.appendChild(f(a)); window.scrollTo(0, 0); }

  /* conceitos ligados à pergunta: a página citada na fonte da pergunta (aba 3, coluna K)
     é a mesma do link do conceito (aba 2, coluna H) */
  const norm = (s) => String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  function conceitosDe(q) {
    const f = norm(q.fonte);
    return D.base.filter((b) => {
      if (String(q.fonte || "").includes(b.codigo)) return true;   // "com base em M6.BT04 e M6.BT05"
      const pag = norm(String(b.link || "").replace(/\/(Paginas\/default\.aspx)?$/i, "").split("/").filter(Boolean).pop());
      return pag && f.includes(pag.split(" ").slice(0, 4).join(" "));
    }).slice(0, 3);
  }
  const educativoDe = (cod) => D.educativo.filter((e) => e.onde === cod);
  const conceito = (cod) => D.base.find((b) => b.codigo === cod) || {};

  function blocoEducativo(lista) {
    return lista.map((e) => `
      <div class="caixa caixa-${e.tipo === "Faça" ? "faca" : e.tipo === "Entenda" ? "entenda" : "ia"}">
        <span class="tag">${esc(e.tipo)}</span>
        <b>${esc(e.titulo)}</b>
        <p>${esc(e.texto)}</p>
        ${vazio(e.exemplo) ? "" : `<p class="ex">${esc(e.exemplo)}</p>`}
        ${vazio(e.prompt) ? "" : `<div class="prompt"><p>${esc(e.prompt)}</p><button class="btn-copiar" data-t="${esc(e.prompt)}">Copiar texto</button></div>
          ${vazio(e.conferir) ? "" : `<p class="ex">${esc(e.conferir)}</p>`}`}
        <span class="fonte">Fonte: ${esc(e.fonte)}</span>
      </div>`).join("");
  }
  function blocoConceitos(lista) {
    if (!lista.length) return "";
    return `<details class="saiba"><summary>Entenda os termos</summary>${lista.map((b) => `
      <div class="conceito"><b>${esc(b.conceito)}</b><p>${esc(vazio(b.definicao) ? b.porque : b.definicao)}</p>
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
  const titulo = (s) => { s = String(s || "").trim(); return s ? s.charAt(0) + s.slice(1).toLowerCase() : ""; };
  /* seção da planilha de cada pergunta; as seções que dependem de "Negócio" viram uma etapa só */
  const SECAO = {}, SECAO_NEG = {};
  { let sec = null;
    D.perguntas.forEach((p) => {
      if (!p.codigo) { sec = p.secao || sec; return; }
      SECAO[p.codigo] = sec;
      const m = /^Negócio\s*=\s*(.+)$/.exec(p.condicao || "");
      if (m) SECAO_NEG[m[1].trim()] = sec;
    }); }
  const secoesNeg = new Set(Object.values(SECAO_NEG));
  function nomeNegocio() {
    const r = S.R["Negócio"];
    return r && r.estado === "opcao" && SECAO_NEG[r.opcao] ? titulo(SECAO_NEG[r.opcao]) : "Negócio";
  }
  /* etapa da pergunta: 1 = primeira seção; 2 = seletor "Negócio" e sua seção; 3 = resultado */
  const etapaDe = (cod) => cod === "RESULTADO" ? 3 : cod === "Negócio" || secoesNeg.has(SECAO[cod]) ? 2 : 1;
  const nomeSecao = (cod) => etapaDe(cod) === 2 ? nomeNegocio() : titulo(SECAO[cod]);
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
          <${o.h1 ? "h1" : "h2"} class="heroi-tit">${esc(o.titulo)}</${o.h1 ? "h1" : "h2"}>
          ${o.texto ? `<p>${esc(o.texto)}</p>` : ""}
        </div>
        <img class="heroi-img" src="assets/${o.img || "hero-tela.webp"}" alt="">
      </div>
    </section>`;
  }
  function etapas(n, tudo) {
    const nomes = [titulo(D.perguntas.find((p) => !p.codigo && p.secao).secao), nomeNegocio(), "Resultado"];
    return `<ol class="etapas" aria-label="Etapas do módulo">${nomes.map((nome, i) => {
      const k = i + 1, st = tudo || k < n ? "feita" : k === n ? "atual" : "";
      return `<li class="${st}"${k === n && !tudo ? ' aria-current="step"' : ""}><span class="bola" aria-hidden="true"></span><span class="rot">${esc(nome)}</span></li>`;
    }).join("")}</ol>`;
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
            <button class="btn btn-linha" id="limites">O que este módulo não faz</button>
          </div>
          ${rodape()}
        </main>
      </div>`);
    ligar(p);
    p.querySelector("#ir").onclick = () => {
      const atual = S.hist[S.hist.length - 1];
      if (atual === "RESULTADO") ir(telaResultado);
      else ir(telaPergunta, atual || proxima(S.R, null));
    };
    const z = p.querySelector("#zerar");
    if (z) z.onclick = () => { if (confirm("Apagar suas respostas e recomeçar?")) { S = novo(); herdarNegocio(); salvar(); ir(telaCapa); } };
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
          <div class="cartao"><h3>Cuidados</h3><p>${esc(D.mapa.riscos)}</p></div>
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
  function telaPergunta(cod) {
    const q = M.porCodigo[cod];
    if (S.hist[S.hist.length - 1] !== cod) { S.hist.push(cod); salvar(); }
    const tipo = Motor.campo(q);
    const resp = S.R[cod] || null;
    let escolhida = resp && resp.estado === "opcao" ? resp.opcao : null;
    let marcadas = resp && resp.estado === "multi" ? resp.opcoes.slice() : resp && resp.estado === "naosei" && tipo === "multi" ? [Motor.NS] : [];
    if (resp && resp.estado === "naosei" && tipo !== "multi") escolhida = Motor.NS;
    const her = resp ? null : heranca(cod);
    if (her && her.opcoes) marcadas = her.opcoes.slice();
    const neg = S.R[Motor.NEGOCIO];
    const faixaNeg = etapaDe(cod) === 2 && cod !== Motor.NEGOCIO && neg && neg.estado === "opcao"
      ? `<div class="negocio-atual"><span>Seu negócio: <b>${esc(neg.opcao)}</b></span>${neg.herdado ? `<span class="selo">Veio do Módulo ${esc(neg.herdado)}</span>` : ""}<button class="btn-alt" id="trocar">Trocar</button></div>` : "";

    const p = el(`
      <div class="pag">
        ${topo(nomeSecao(cod))}
        ${heroi({ kicker: `Pergunta ${M.perguntas.indexOf(q) + 1} de ${M.perguntas.length}`, kickerClasse: "passo", titulo: nomeSecao(cod) })}
        ${etapas(etapaDe(cod))}
        <main class="corpo">
          <div class="cartao-q pergunta" data-cod="${esc(cod)}">
            ${faixaNeg}
            <h2 class="q">${esc(q.pergunta)}</h2>
            ${her ? `<div class="herdado"><span class="selo">Veio do Módulo ${her.modulo}</span><span>Confira e ajuste se quiser.</span>${her.nota ? `<p class="mini-info">${esc(her.nota)}</p>` : ""}</div>` : ""}
            <div class="entrada" id="ent"></div>
            ${Motor.temNaoSei(q) || cod === "M6.P01" ? `<div class="alt">${Motor.temNaoSei(q) ? `<button class="btn-alt" id="ns">Não sei</button>` : ""}${cod === "M6.P01" ? `<button class="btn-alt" id="sem-compras-btn">${SEM_COMPRAS}</button>` : ""}</div>` : ""}
            <div class="erro" id="erro" hidden></div>
            <div class="acoes" id="acoes"><button class="btn btn-primario seta" id="ok">Continuar</button></div>
            <div id="retorno"></div>
            ${dica(q.ajuda)}
            ${blocoEducativo(educativoDe(cod))}
            ${blocoConceitos(conceitosDe(q))}
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

    const tr = p.querySelector("#trocar");
    if (tr) tr.onclick = () => ir(telaPergunta, Motor.NEGOCIO);
    const ent = p.querySelector("#ent");
    if (tipo === "escolha" || tipo === "simnao_texto") {
      ent.classList.add("opcoes");
      q.opcoesLista.forEach((op) => {
        const desc = q.descricoes && q.descricoes[op];
        const b = el(`<button class="opcao ${escolhida === op ? "sel" : ""}"><span class="radio" aria-hidden="true"></span><span class="op-txt"><b>${esc(op)}</b>${desc ? `<small class="op-desc">${esc(desc)}</small>` : ""}</span></button>`);
        b.onclick = () => { escolhida = op; ent.querySelectorAll(".opcao").forEach((x) => x.classList.remove("sel")); b.classList.add("sel"); };
        ent.appendChild(b);
      });
      if (tipo === "simnao_texto") ent.appendChild(el(`<textarea class="campo" id="detalhe" rows="3">${esc(resp && resp.detalhe || "")}</textarea>`));
    } else if (tipo === "multi") {
      ent.classList.add("opcoes", "multi");
      q.opcoesLista.forEach((op) => {
        const b = el(`<button class="opcao ${marcadas.includes(op) ? "sel" : ""}"><span class="radio" aria-hidden="true"></span><span class="op-txt"><b>${esc(op)}</b></span></button>`);
        b.onclick = () => {
          marcadas = marcadas.includes(op) ? marcadas.filter((x) => x !== op) : q.opcoesLista.filter((x) => x === op || marcadas.includes(x));
          b.classList.toggle("sel", marcadas.includes(op));
        };
        ent.appendChild(b);
      });
    } else {
      const v = resp && resp.estado === "valor" ? resp.valor : her ? her.valor : "";
      ent.appendChild(el(tipo === "numero"
        ? `<div class="linha"><span class="unid">R$</span><input class="campo" inputmode="decimal" placeholder="0,00" value="${esc(v)}"></div>`
        : `<textarea class="campo" rows="3">${esc(v)}</textarea>`));
    }
    const ns = p.querySelector("#ns");
    if (ns) ns.onclick = () => responder({ estado: "naosei" });
    const sc = p.querySelector("#sem-compras-btn");
    if (sc) sc.onclick = () => responder({ estado: "valor", valor: SEM_COMPRAS, semCompras: true });

    p.querySelector("#ok").onclick = () => {
      if (tipo === "escolha" || tipo === "simnao_texto") {
        if (!escolhida) return responder({ estado: "vazia" });
        if (escolhida === Motor.NS) return responder({ estado: "naosei" });
        const r0 = { estado: "opcao", opcao: escolhida };
        if (tipo === "simnao_texto" && escolhida === "Sim") r0.detalhe = p.querySelector("#detalhe").value.trim();
        return responder(r0);
      }
      if (tipo === "multi") {
        if (!marcadas.length) return responder({ estado: "vazia" });
        const r1 = { estado: "multi", opcoes: marcadas.slice() };
        if (her && her.opcoes && JSON.stringify(her.opcoes) === JSON.stringify(r1.opcoes)) r1.herdado = her.modulo;
        return responder(r1);
      }
      const r2 = Motor.envio(q, ent.querySelector("input,textarea").value);
      if (her && r2.estado === "valor" && r2.valor === String(her.valor)) r2.herdado = her.modulo;
      /* valor fora do comum: avisa uma vez; o segundo Continuar com o mesmo valor segue */
      /* "nada, por enquanto." = sem compras agora: não vira item da lista de prioridades */
      if (cod === "M6.P01" && r2.estado === "valor" && Motor.semCompras(r2.valor)) r2.semCompras = true;
      const av = Motor.avisoValor(cod, r2);
      if (av && avisado !== r2.valor) { avisado = r2.valor; return erro(av, true); }
      responder(r2);
    };
    let avisado = null;
    function erro(t, soAviso) { const e = p.querySelector("#erro"); e.textContent = t; e.className = soAviso ? "aviso aviso-valor" : "erro"; e.hidden = false; }

    function responder(r0) {
      p.querySelector("#erro").hidden = true;
      const regras = Motor.regrasPara(M, cod, r0);
      /* resposta vazia/inválida, ou regra cujo encaminhamento é "Retornar à Pxx": fica na pergunta */
      if (!Motor.valido(r0) || regras.some(Motor.retorna)) {
        if (r0.estado === "invalida") erro(MSG_NUMERO);
        if (!regras.length) return erro(r0.estado === "invalida" ? MSG_NUMERO : "Responda para continuar.");
        return mostrarRetorno(regras, null, true);
      }
      S.R[cod] = r0;
      S.fluxo = null; S.cen = null;      // a projeção é refeita com as novas respostas
      limparInvisiveis();
      salvar();
      mostrarRetorno(Motor.regrasAgora(M, S.R, cod), proxima(S.R, cod));
    }

    function mostrarRetorno(regras, prox, parado) {
      const box = p.querySelector("#retorno");
      /* um só bloco de atenção na tela: alertas das regras + alerta da pergunta, sem repetição */
      const atencao = [...new Set([...regras.map((r) => r.alerta), ...(parado ? [] : [q.alerta])].filter((a) => !vazio(a)).map((a) => String(a).trim()))];
      const extra = !parado && S.R[cod] && S.R[cod].semCompras ? SEM_COMPRAS_RET : "";
      box.innerHTML = `<div class="retorno${parado ? " parado" : ""}">
        ${parado || vazio(q.resposta) ? "" : `<p class="r-texto r-pergunta">${esc(q.resposta)}</p>`}
        ${extra ? `<p class="r-texto r-sem-compras">${esc(extra)}</p>` : ""}
        ${regras.map((r) => `
          <div class="regra">
            <p class="r-texto">${esc(r.texto)}</p>
            ${vazio(r.lacuna) ? "" : `<div class="bloco b-lacuna"><b>O que ainda falta</b>${esc(r.lacuna)}</div>`}
            ${vazio(r.proximo) ? "" : `<div class="bloco b-proximo"><b>Próximo passo</b>${esc(r.proximo)}</div>`}
            ${vazio(r.encaminhamento) || Motor.retorna(r) ? "" : `<div class="bloco b-enc"><b>Encaminhamento</b>${esc(r.encaminhamento)}</div>`}
          </div>`).join("")}
        ${atencao.length ? `<div class="bloco b-alerta"><b>Atenção</b>${atencao.length === 1 ? esc(atencao[0]) : `<ul>${atencao.map((a) => `<li>${esc(a)}</li>`).join("")}</ul>`}</div>` : ""}
      </div>`;
      if (parado) { box.scrollIntoView({ behavior: "smooth", block: "start" }); return; }
      const acoes = p.querySelector("#acoes");
      acoes.innerHTML = "";
      box.after(acoes);          // depois de ler o retorno, o Seguir fica logo abaixo dele
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
    const R = {};
    if (S.R[Motor.NEGOCIO]) R[Motor.NEGOCIO] = S.R[Motor.NEGOCIO];   // o tipo de negócio vale para o módulo todo
    let cod = proxima(R, null);
    const vis = new Set();
    while (cod !== "RESULTADO") {
      vis.add(cod);
      if (S.R[cod] === undefined) break;
      R[cod] = S.R[cod];
      cod = proxima(R, cod);
    }
    Object.keys(S.R).forEach((k) => { if (!vis.has(k) && k !== Motor.NEGOCIO) delete S.R[k]; });
  }

  /* ================= resultado: instrumentos da aba 5 ================= */
  const I = (c) => M.instr[c] || {};
  function cabInstr(ins) {
    return `<div class="secao-titulo">${esc(ins.nome)}</div>
      <p class="ajuda">${esc(ins.objetivo)}</p>`;
  }
  const regraInstr = (ins) => `<p class="mini-info">${esc(ins.regra)}</p>`;
  /* o limite de cada instrumento vira nota curta (o único bloco de atenção da tela é o #atencao) */
  const limiteInstr = (ins) => vazio(ins.limite) ? "" : `<p class="mini-info">${esc(ins.limite)}</p>`;
  /* "Como calculamos: …" embaixo de cada número calculado */
  const como = (t, id) => `<p class="como"${id ? ` id="${id}"` : ""}><b>Como calculamos:</b> ${esc(t)}</p>`;

  function blocoI01() {
    const ins = I("M6.I01"), inv = Motor.investimento(S.R);
    const temValor = inv.valor !== null;
    const naoSeiP02 = D.regras.find((r) => r.pergunta === "M6.P02" && Motor.casa(r.condicao, { estado: "naosei" })) || {};
    return `${cabInstr(ins)}
      <div class="res-num">
        <div class="lbl">${esc(ins.mostra)}</div>
        <div class="val" id="i01-val">${temValor ? brl(inv.valor) : "—"}</div>
        <div class="sub">${temValor
          ? inv.partes.map((x) => `${esc(M.porCodigo[x.codigo].pergunta)} ${brl(x.valor)}`).join(" · ")
            + (inv.forma && inv.forma !== Motor.NS ? ` · ${esc(inv.forma)}` : "")
          : esc(naoSeiP02.texto)}</div>
      </div>
      ${como(inv.semCompras ? "você disse que não tem compras a fazer agora, então o valor para começar é zero."
        : temValor ? `somamos os valores que você informou para começar (${inv.partes.map((x) => brl(x.valor)).join(" + ")}).`
        : "ainda não dá para calcular, porque o valor das compras ficou em “Não sei”.", "como-i01")}
      ${limiteInstr(ins)}`;
  }
  function avisoM1(valor) {
    const t = tetoM1();
    if (!t || t.teto === null || valor === null || !(valor > t.teto)) return "";
    return `<li id="aviso-m1"><span class="selo">Veio do Módulo 1</span> No Módulo 1 você disse que pode usar
      “${esc(t.texto)}” no negócio sem faltar para as contas da casa. Aqui, o que você precisa para começar soma ${brl(valor)}.
      Confira os valores, veja o que pode ficar para depois ou como juntar a diferença antes de comprar.</li>`;
  }
  /* um só bloco de atenção no resultado: Módulo 1, semanas no vermelho, cenário e alertas das respostas, sem repetição */
  function blocoAtencao() {
    const inv = Motor.investimento(S.R), F = fluxo(), P = Motor.projetar(F), ins4 = I("M6.I04"), ins5 = I("M6.I05");
    const itens = [], vistos = new Set();
    const add = (html, txt) => { const k = String(txt).trim(); if (!k || vistos.has(k)) return; vistos.add(k); itens.push(html); };
    const m1 = avisoM1(inv.valor); if (m1) add(m1, "m1");
    const neg = P.filter((x) => x.alerta).map((x) => x.semana);
    if (neg.length) add(`<li id="atencao-fluxo">Vai sair mais dinheiro do que você terá em caixa na semana ${neg.join(", ")} da tabela de 13 semanas. Planeje como cobrir essa falta antes de começar.</li>`, "fluxo");
    cenario();
    if (Motor.cenario(S.cen.ini, S.cen.ent, S.cen.sai).alerta) add(`<li id="atencao-cen">No simulador de cenários, as saídas passam do que entra mais o dinheiro em caixa.</li>`, "cen");
    Motor.alertas(Motor.regrasTodas(M, S.R)).forEach((a) => add(`<li>${esc(a)}</li>`, a));
    return itens.length ? `<div class="bloco b-alerta"><b>Atenção, pelas suas respostas</b><ul>${itens.join("")}</ul></div>` : "";
  }

  function blocoI02() {
    const ins = I("M6.I02"), itens = Motor.itens(S.R, S.fora), cats = Motor.categorias(M);
    const naoSeiP01 = D.regras.find((r) => r.pergunta === "M6.P01" && Motor.casa(r.condicao, { estado: "naosei" })) || {};
    const fora = (S.fora || []).length ? `<p class="mini-info" id="fora">Tirados da lista: ${S.fora.map(esc).join(", ")}. <button class="btn-alt" id="repor">Pôr de volta</button></p>` : "";
    /* a lista só abre quando há itens de compra de verdade */
    if (!itens.length) {
      const nada = Motor.investimento(S.R).semCompras || (S.fora || []).length;
      return `<div id="sem-compras">${nada ? `<p class="mini-info">Sem compras a fazer agora: a lista de prioridade de compras fica de fora.</p>${fora}`
        : valor1NS() ? `${cabInstr(ins)}<div class="bloco b-lacuna">${esc(naoSeiP01.lacuna)}</div>` : ""}</div>`;
    }
    return `${cabInstr(ins)}
      <div class="lista" id="prio">${itens.map((it, i) => `
        <div class="item"><div class="item-topo"><b class="nome">${esc(it)}</b><button class="btn-alt tirar" data-i="${i}" aria-label="Tirar ${esc(it)} da lista">Tirar da lista</button></div>
          <div class="opcoes mini">${cats.map((c) => `<button class="opcao ${S.prio[it] === c ? "sel" : ""}" data-i="${i}" data-c="${esc(c)}">${esc(c)}</button>`).join("")}</div>
        </div>`).join("")}</div>
      ${fora}
      ${regraInstr(ins)}${limiteInstr(ins)}`;
  }

  const valor1NS = () => Motor.valor(S.R, "M6.P01") === Motor.NS;
  function fluxo() {
    /* fluxo guardado antes da correção de 05/11 (venda do mês entrava uma vez só): refeito com as respostas */
    if (!S.fluxo || S.fluxo.v !== Motor.FLUXO_V) { S.fluxo = Motor.fluxoInicial(S.R); S.cen = null; salvar(); }
    return S.fluxo;
  }
  function blocoI04() {
    const ins = I("M6.I04"), F = fluxo(), P = Motor.projetar(F);
    const p09 = S.R["M6.P09"], p06 = Motor.valor(S.R, "M6.P06");
    const entra = F.atraso ? `a partir da semana ${F.atraso + 1}, porque o dinheiro das vendas chega ${FRASE_PRAZO[F.prazo] || "depois"}` : "desde a semana 1";
    return `${cabInstr(ins)}
      <div class="linha"><span class="lbl">Dinheiro em caixa hoje</span><span class="unid">R$</span><input class="campo" id="f-ini" inputmode="decimal" value="${numero(F.saldoInicial)}"></div>
      <div class="linha"><span class="lbl">Vendas por mês</span><span class="unid">R$</span><input class="campo" id="f-vendas" inputmode="decimal" value="${numero(F.vendasMes || 0)}"></div>
      <div class="linha"><span class="lbl">Gastos de todo mês</span><span class="unid">R$</span><input class="campo" id="f-gastos" inputmode="decimal" value="${numero(F.gastosMes || 0)}"></div>
      ${como("em cada semana, saldo = saldo da semana anterior + entradas − saídas, começando pelo dinheiro em caixa hoje.", "como-i04")}
      <ul class="mini-info como-conta" id="como-conta">
        <li>Vendas: ${brl(F.vendasMes || 0)} por mês = ${brl(F.vendasSemana || 0)} por semana (mês × 12 ÷ 52), ${entra}.</li>
        <li>Gastos de todo mês: ${brl(F.gastosMes || 0)} = ${brl(F.gastosSemana || 0)} por semana${p06 && p06 !== Motor.NS ? " (somamos os valores que você escreveu; ajuste acima se faltar algum)" : ""}.</li>
        <li>O que você precisa para começar (${brl(F.investimento || 0)}) sai na semana 1.</li>
      </ul>
      <div class="tabela-wrap"><table class="fluxo">
        <thead><tr><th>Sem.</th><th>Entradas</th><th>Saídas</th><th>Saldo</th></tr></thead>
        <tbody>${P.map((s, i) => `<tr class="${s.final < 0 ? "neg" : ""}">
          <td>${s.semana}</td>
          <td><input inputmode="decimal" aria-label="Entradas da semana ${s.semana}" data-i="${i}" data-k="entradas" value="${numero(s.entradas)}"></td>
          <td><input inputmode="decimal" aria-label="Saídas da semana ${s.semana}" data-i="${i}" data-k="saidas" value="${numero(s.saidas)}"></td>
          <td class="sf">${brl(s.final)}</td></tr>`).join("")}</tbody>
      </table></div>
      <p class="mini-info">Você pode mudar qualquer semana; mudar vendas ou gastos do mês refaz a tabela.</p>
      ${p06 && p06 !== Motor.NS ? `<div class="bloco b-proximo"><b>${esc(M.porCodigo["M6.P06"].pergunta)}</b>${esc(p06)}</div>` : ""}
      ${p09 && p09.detalhe ? `<div class="bloco b-proximo"><b>${esc(M.porCodigo["M6.P09"].pergunta)}</b>${esc(p09.detalhe)}</div>` : ""}
      ${P.some((s) => s.alerta) ? `<p class="mini-info">Semanas em que falta dinheiro: ${P.filter((s) => s.alerta).map((s) => s.semana).join(", ")} (veja “Atenção” no alto do resumo).</p>` : ""}`;
  }
  function blocoI03() {
    const ins = I("M6.I03"), c = Motor.controle(fluxo());
    return `${cabInstr(ins)}
      <div class="mini-cards">
        <div class="cartao"><h3>Saldo inicial</h3><p>${brl(c.inicial)}</p></div>
        <div class="cartao"><h3>Entradas</h3><p>${brl(c.entradas)}</p></div>
        <div class="cartao"><h3>Saídas</h3><p>${brl(c.saidas)}</p></div>
        <div class="cartao"><h3>Saldo</h3><p><b>${brl(c.saldo)}</b></p></div>
      </div>
      ${como(`dinheiro em caixa hoje (${brl(c.inicial)}) + tudo o que entra nas 13 semanas (${brl(c.entradas)}) − tudo o que sai (${brl(c.saidas)}) = ${brl(c.saldo)}.`, "como-i03")}
      ${limiteInstr(ins)}`;
  }
  function cenario() {
    if (!S.cen) { const c = Motor.controle(fluxo()); S.cen = { ini: c.inicial, ent: c.entradas, sai: c.saidas }; salvar(); }
    return S.cen;
  }
  function blocoI05() {
    const ins = I("M6.I05");
    cenario();
    const r = Motor.cenario(S.cen.ini, S.cen.ent, S.cen.sai);
    return `${cabInstr(ins)}
      <div class="linha"><span class="lbl">Saldo inicial</span><span class="unid">R$</span><input class="campo cen" data-k="ini" inputmode="decimal" value="${S.cen.ini}"></div>
      <div class="linha"><span class="lbl">Entradas previstas</span><span class="unid">R$</span><input class="campo cen" data-k="ent" inputmode="decimal" value="${S.cen.ent}"></div>
      <div class="linha"><span class="lbl">Saídas previstas</span><span class="unid">R$</span><input class="campo cen" data-k="sai" inputmode="decimal" value="${S.cen.sai}"></div>
      <div class="res-num ${r.alerta ? "coral" : ""}" id="cen-res"><div class="lbl">Saldo do cenário</div><div class="val">${brl(r.saldo)}</div></div>
      ${como("saldo inicial + entradas previstas − saídas previstas no cenário. Mude os valores para testar outras situações.", "como-i05")}
      ${r.alerta ? `<p class="mini-info">${esc(ins.limite)}</p>` : ""}`;
  }

  /* ================= "O que entendemos até aqui" (frases montadas por regra, sem IA) ================= */
  const FRASE_TIPO = { "Serviço": "um serviço", "Produto": "um produto que você mesmo faz", "Mercadoria": "mercadoria que você compra pronta para revender" };
  const FRASE_ESTAGIO = { "Ainda está só na minha cabeça": "Você ainda não começou a vender.",
    "Já fiz um pouco para testar ou dar de amostra": "Você está começando: já fez um pouco para testar.",
    "Já vendi algumas vezes": "Você já vende.", "Já vendo sempre": "Você já vende." };
  const FRASE_PRAZO = { "Na hora": "na hora", "Até 7 dias": "em até 7 dias", "8 a 30 dias": "entre 8 e 30 dias", "Mais de 30 dias": "depois de 30 dias" };
  function ideiaHerdada() {
    for (const [mod, cod] of [[1, "M1.P03"], [3, "M3.P01"], [4, "M4.P01"], [8, "M8.P01"]]) { const t = valorTxt(lerOutro(K[mod], cod)); if (t) return t.replace(/[.!\s]+$/, ""); }
    return null;
  }
  /* texto corrido: as frases de cada assunto viram um parágrafo (1 a 3 parágrafos curtos, sem lista) */
  const emParagrafos = (fr, ...cortes) => [0, ...cortes].map((c, i, a) => fr.slice(c, i + 1 < a.length ? a[i + 1] : fr.length).join(" ")).filter(Boolean);
  function frasesEntendemos() {
    const out = [], neg = S.R[Motor.NEGOCIO], tipo = neg && neg.estado === "opcao" ? neg.opcao : null, ideia = ideiaHerdada();
    if (ideia && tipo) out.push(`Você oferece ${FRASE_TIPO[tipo]}: ${ideia}.`);
    else if (ideia) out.push(`Você quer vender: ${ideia}.`);
    else if (tipo) out.push(`Você oferece ${FRASE_TIPO[tipo]}.`);
    const est = FRASE_ESTAGIO[opcaoDe(lerOutro(K[1], "M1.P01"))];
    if (est) out.push(est);
    const c1 = out.length;   // 1º parágrafo: o que oferece e em que ponto está
    const inv = Motor.investimento(S.R), forma = inv.forma && inv.forma !== Motor.NS ? inv.forma.toLowerCase() : null;
    out.push(inv.semCompras ? "Você não tem compras a fazer para começar agora." : inv.valor !== null ? `Para começar, você estima gastar ${brl(inv.valor)}${forma ? `, pagando ${forma}` : ""}.`
      : "Você ainda não sabe quanto vai gastar para começar: vale pesquisar os preços antes.");
    const vendas = numDe("M6.P05"), prazo = FRASE_PRAZO[Motor.valor(S.R, "M6.P08")];
    out.push(vendas !== null ? `Você espera vender cerca de ${brl(vendas)} por mês${prazo ? ` e receber o dinheiro ${prazo}` : ""}.`
      : "Você ainda não estimou quanto vai vender por mês.");
    const c2 = out.length;   // 2º: gasto para começar e vendas; 3º: o caixa nas 13 semanas
    const F = fluxo(), P = Motor.projetar(F), neg1 = P.find((x) => x.final < 0);
    const inicio = F.saldoInicial || numDe("M6.P07") !== null ? `Começando com ${brl(F.saldoInicial)} no caixa` : "Sem contar dinheiro guardado";
    out.push(`${inicio}, ${neg1
      ? `o seu dinheiro fica negativo na semana ${neg1.semana}: antes de começar, planeje como cobrir essa falta.`
      : "o seu dinheiro não fica negativo em nenhuma das 13 semanas da projeção."}`);
    return emParagrafos(out, c1, c2);
  }
  const numDe = (c) => { const v = Motor.valor(S.R, c); return v === undefined || v === Motor.NS || isNaN(Motor.num(v)) ? null : Motor.num(v); };
  function blocoEntendemos() {
    return `<h2>O que entendemos até aqui</h2>${frasesEntendemos().map((f) => `<p>${esc(f).replace(/R\$ /g, () => "R$&nbsp;")}</p>`).join("")}`;
  }
  /* como cada resposta aparece no resumo (com selo quando veio de outro módulo ou do começo deste) */
  function respostaResumo(q) {
    const r = S.R[q.codigo], v = Motor.valor(S.R, q.codigo), det = (r || {}).detalhe;
    if (v === undefined && REPETE_P01.includes(q.codigo) && p01Respondida(S.R) && etapaDe(q.codigo) === 2
        && S.R[Motor.NEGOCIO] && SECAO[q.codigo] === SECAO_NEG[S.R[Motor.NEGOCIO].opcao]) {
      const base = Motor.valor(S.R, ["M6.P11", "M6.P14"].includes(q.codigo) ? "M6.P02" : "M6.P01");
      return `<span class="selo">Respondido no começo</span> ${esc(base === undefined ? "—" : base)}`;
    }
    if (v === undefined) return `<span class="mini-info">Não apareceu no seu caminho</span>`;
    return (r && r.herdado ? `<span class="selo">Veio do Módulo ${esc(r.herdado)}</span> ` : "") + esc(v) + (det ? ` · ${esc(det)}` : "");
  }

  function telaResultado() {
    const regras = Motor.regrasTodas(M, S.R);
    const lac = Motor.lacunas(regras), enc = Motor.encaminhamentos(regras), ale = Motor.alertas(regras);
    const dicas = Motor.dicasGerais(regras).slice(0, MAX_DICAS), falta = Motor.pendencias(M, S.R);
    const p = el(`
      <div class="pag">
        ${topo("Resultado")}
        ${heroi({ kicker: "Resultado", kickerClasse: "passo", titulo: "Seu resumo" })}
        ${etapas(3, true)}
        <main class="corpo">
          <section class="concluido">
            <div class="conc-topo"><span class="check" aria-hidden="true"></span><div><h2>Você concluiu o Módulo ${esc(D.modulo.numero)}</h2><p>Seu resumo está logo abaixo.</p></div></div>
          </section>
          <section class="entendemos" id="entendemos">${blocoEntendemos()}</section>
          <div id="atencao">${blocoAtencao()}</div>
          <p class="ajuda">${esc(D.mapa.entrega)}</p>
          <div id="i01">${blocoI01()}</div>
          <div id="i02">${blocoI02()}</div>
          <div id="i04">${blocoI04()}</div>
          <div id="i03">${blocoI03()}</div>
          <div id="i05">${blocoI05()}</div>

          ${lac.length ? `<div class="bloco b-lacuna"><b>O que ainda falta saber</b><ul>${lac.map((l) => `<li>${esc(l)}</li>`).join("")}</ul></div>` : ""}
          <div class="secao-titulo">Próximos passos</div>
          ${falta.length ? `<ol class="roteiro" id="proximos">${falta.map((x) => `<li>${esc(x)}</li>`).join("")}</ol>`
            : `<p class="ajuda" id="proximos">Nada ficou em aberto nas suas respostas. Acompanhe a tabela das 13 semanas e atualize os valores quando souber os preços de verdade.</p>`}
          ${dicas.length ? `<div class="secao-titulo">Dicas gerais</div><ul class="dicas-gerais" id="dicas">${dicas.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}
          <div class="bloco b-enc"><b>Encaminhamentos, pelas suas respostas</b>${enc.length ? `<ul>${enc.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}<p>${esc(D.mapa.encaminhamentos)}</p></div>

          <details class="saiba respostas"><summary>Ver suas respostas</summary>
          ${M.perguntas.map((q) => `<div class="cartao"><h3>${esc(q.pergunta)}</h3><p>${respostaResumo(q)}</p></div>`).join("")}
          </details>

          <div class="aviso">${esc(D.mapa.mensagem_limite)}</div>
          <div class="acoes">
            <button class="btn btn-primario" id="imp">Salvar ou imprimir</button>
            <button class="btn btn-claro" id="rev">Revisar respostas</button>
            <button class="btn btn-linha" id="novo">Começar outra análise</button>
          </div>
          ${botaoVoltar()}
          <div class="acoes lg2-proximo"><a class="btn btn-primario" style="text-decoration:none;text-align:center;box-sizing:border-box" href="/lg2/turma-b/m07/index.html">Ir para o Módulo 7</a></div>
          ${rodape()}
        </main>
      </div>`);

    const refazer = (id, f) => { p.querySelector(id).innerHTML = f(); ligar(); };
    function ligar() {
      p.querySelectorAll("#prio .opcao").forEach((b) => (b.onclick = () => {
        const it = Motor.itens(S.R, S.fora)[+b.dataset.i]; S.prio[it] = b.dataset.c; salvar(); refazer("#i02", blocoI02);
      }));
      p.querySelectorAll("#prio .tirar").forEach((b) => (b.onclick = () => {
        const it = Motor.itens(S.R, S.fora)[+b.dataset.i]; S.fora = [...(S.fora || []), it]; delete S.prio[it]; salvar(); refazer("#i02", blocoI02);
      }));
      const rp = p.querySelector("#repor");
      if (rp) rp.onclick = () => { S.fora = []; salvar(); refazer("#i02", blocoI02); };
      const ini = p.querySelector("#f-ini");
      ini.onchange = () => { S.fluxo.saldoInicial = Math.max(0, Motor.num(ini.value) || 0); S.cen = null; salvar(); atualizarCaixa(); };
      [["#f-vendas", "vendasMes"], ["#f-gastos", "gastosMes"]].forEach(([sel, k]) => {
        const x = p.querySelector(sel);
        x.onchange = () => { S.fluxo[k] = Math.max(0, Motor.num(x.value) || 0); Motor.montarSemanas(S.fluxo); S.cen = null; salvar(); atualizarCaixa(); };
      });
      p.querySelectorAll(".fluxo input").forEach((x) => (x.onchange = () => {
        S.fluxo.semanas[+x.dataset.i][x.dataset.k] = Math.max(0, Motor.num(x.value) || 0); S.cen = null; salvar(); atualizarCaixa();
      }));
      p.querySelectorAll(".cen").forEach((x) => (x.onchange = () => {
        S.cen[x.dataset.k] = Motor.num(x.value) || 0; salvar(); refazer("#i05", blocoI05); refazer("#atencao", blocoAtencao);
      }));
    }
    function atualizarCaixa() { p.querySelector("#entendemos").innerHTML = blocoEntendemos(); p.querySelector("#atencao").innerHTML = blocoAtencao(); p.querySelector("#i04").innerHTML = blocoI04(); p.querySelector("#i03").innerHTML = blocoI03(); p.querySelector("#i05").innerHTML = blocoI05(); ligar(); }
    ligar();
    p.querySelectorAll("[data-inicio]").forEach((b) => { b.onclick = () => ir(telaCapa); });

    p.querySelector("#v").onclick = () => { S.hist.pop(); const a = S.hist.pop(); salvar(); ir(telaPergunta, a); };
    p.querySelector("#imp").onclick = () => { p.querySelectorAll("details").forEach((d) => (d.open = true)); window.print(); };
    p.querySelector("#rev").onclick = () => { S.hist = []; salvar(); ir(telaPergunta, proxima({}, null)); };
    p.querySelector("#novo").onclick = () => { if (confirm("Começar uma nova análise? As respostas atuais serão apagadas.")) { S = novo(); herdarNegocio(); salvar(); ir(telaPergunta, proxima({}, null)); } };
    return p;
  }

  function rodape() {
    return `<footer class="rodape">
      <p class="credito">Conteúdo produzido por estudantes do Laboratório de Gestão II · FACC/UFJF · versão ${esc(D.modulo.versao)} (A) · fontes consultadas em ${esc(D.modulo.data)}</p>
      <div class="logos">
        <img src="assets/logo_facc.png" alt="FACC">
        <img src="assets/logo_ufjf.svg" alt="UFJF">
        <img src="assets/logo_mg.svg" alt="Governo de Minas Gerais">
      </div>
    </footer>`;
  }

  herdarNegocio();
  ir(telaCapa);
})();
