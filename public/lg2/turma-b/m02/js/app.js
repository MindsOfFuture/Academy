/* Telas do Módulo 2. Todo texto de conteúdo vem de window.MODULO2 (a planilha),
   sem edição. As respostas ficam só neste aparelho. */
(function () {
  "use strict";
  const D = window.MODULO2, M = Motor.montar(D);
  const tela = document.getElementById("tela");
  const CHAVE = "lg2-turma-b-m02";
  /* número de pessoas ouvidas (pergunta de número): acima disso mostra um aviso que não trava */
  const LIMITE_PESSOAS_OUVIDAS = 200;
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
  /* exemplos das ajudas: os da planilha falam de bolo (produto que a pessoa faz). Para quem presta serviço
     ou revende mercadoria, troca pelo exemplo do mesmo tipo de negócio (tipo vindo do Módulo 1 ou 5). */
  const EX_TIPO = {
    "M2.P05.ajuda": {
      "Serviço": "Grupo = pessoas com necessidades ou hábitos parecidos. Exemplo: quem faz as unhas para uma festa ou casamento e quem faz toda semana, por costume.",
      "Mercadoria": "Grupo = pessoas com necessidades ou hábitos parecidos. Exemplo: quem compra roupa para dar de presente e quem compra para usar no dia a dia.",
    },
    "M2.P06.ajuda": {
      "Serviço": "Exemplo: \"noivas e madrinhas que se arrumam para casamento\"; \"mulheres que trabalham fora e fazem as unhas toda semana\". Não use nomes de pessoas.",
      "Mercadoria": "Exemplo: \"mães que compram roupa infantil para presente\"; \"jovens que compram roupa para sair no fim de semana\". Não use nomes de pessoas.",
    },
    "educativo.0": {
      "Serviço": "Em vez de \"mulheres que gostam de unhas bonitas\", um público-alvo mais útil é \"mulheres que trabalham fora e querem fazer as unhas perto de casa, no fim do dia\".",
      "Mercadoria": "Em vez de \"pessoas que gostam de roupa\", um público-alvo mais útil é \"mães do bairro que compram roupa infantil para dar de presente\".",
    },
    "educativo.1": {
      "Serviço": "Perguntar a uma vizinha: \"quando você fez as unhas pela última vez, o que te fez escolher aquela manicure?\"",
      "Mercadoria": "Perguntar a uma vizinha: \"quando você comprou uma roupa pela última vez, o que te fez escolher aquela loja?\"",
    },
    "educativo.3": {
      "Serviço": "Entre quem faz as unhas, separar quem faz para festas e eventos de quem faz toda semana, por costume.",
      "Mercadoria": "Entre quem compra roupa, separar quem compra para dar de presente de quem compra para usar no dia a dia.",
    },
    "base.0": {
      "Serviço": "Para uma manicure, o público-alvo pode ser \"mulheres que trabalham fora e querem fazer as unhas perto de casa\".",
      "Mercadoria": "Para quem revende roupas, o público-alvo pode ser \"mães do bairro que compram roupa infantil para presente\".",
    },
    "base.4": {
      "Serviço": "Fazer as unhas para um casamento costuma ser marcado com dias de antecedência; já a manutenção das unhas pode ser feita toda semana.",
      "Mercadoria": "Uma roupa para presente costuma ser comprada perto de datas especiais; já peças do dia a dia podem ser compradas todo mês.",
    },
    "base.5": {
      "Serviço": "Dentro de \"pessoas que fazem as unhas\", separar \"quem faz para festas e eventos\" de \"quem faz toda semana, por costume\".",
      "Mercadoria": "Dentro de \"pessoas que compram roupa\", separar \"quem compra para presente\" de \"quem compra para usar no dia a dia\".",
    },
    "base.6": {
      "Serviço": "Para uma manicure: dividir por local (quem mora no bairro), por ocasião (festas ou dia a dia) ou por hábito (faz as unhas toda semana).",
      "Mercadoria": "Para quem revende roupas: dividir por local (quem mora no bairro), por ocasião (presente ou dia a dia) ou por hábito (compra todo mês).",
    },
  };
  function exTipo(chave, original) {
    const tp = tipoNegocio();
    return (tp && EX_TIPO[chave] && EX_TIPO[chave][tp.v]) || original;
  }

  /* celular: com o teclado aberto, o campo em foco vai para o meio da parte visível da tela */
  let emFoco = null, tFoco = null;
  const centralizar = () => { if (emFoco && document.activeElement === emFoco && emFoco.isConnected) emFoco.scrollIntoView({ block: "center" }); };
  document.addEventListener("focusin", (e) => {
    const t = e.target;
    if (!t.matches || !t.matches("input:not([type=checkbox]):not([type=radio]),textarea,select")) return;
    emFoco = t; clearTimeout(tFoco); tFoco = setTimeout(centralizar, 300);
  });
  if (window.visualViewport) window.visualViewport.addEventListener("resize", centralizar);

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
      /* quem compra = perfil do Módulo 3 (P10); problema = a dor escrita no perfil ou a P11 do Módulo 3.
         Se não houver, Módulo 4 (P08 quem, P09 problema). */
      const quem = p10 ? perfilM3(p10) : null;
      const dor = (p10 && semNS(p10.campos && p10.campos[DOR_M3])) || txtDe(M03, "M3.P11");
      if (quem && (dor || !/^(Pessoas comuns|Empresas)$/.test(quem))) return { resp: { estado: "valor", valor: `${quem}${dor ? `. Problema que você resolve: ${semPonto(dor)}` : ""}` }, n: 3 };
      const p8 = txtDe(M04, "M4.P08"), p9 = txtDe(M04, "M4.P09");
      if (p8) return { resp: { estado: "valor", valor: `${semPonto(p8)}${p9 ? `. Problema que você resolve: ${semPonto(p9)}` : ""}` }, n: 4 };
    }
    return null;
  }
  /* ---- perfil do cliente do Módulo 3 (P10) em frase: cada campo no seu lugar; campo vazio ou "Não sei" sai da frase ---- */
  const DOR_M3 = "O que precisa resolver (a dor)";
  const OCUP_M3 = ["Estudantes", "Trabalhadores com carteira assinada", "Autônomos e trabalhadores por conta própria", "Servidores públicos", "Aposentados", "Donas e donos de casa"];
  const semPonto = (s) => String(s).trim().replace(/[.!;]+$/, "");
  const semNS = (s) => {
    const v = String(s ?? "").split(/;\s*/).map((x) => x.trim()).filter((x) => x && !/^n[ãa]o sei$/i.test(x));
    return v.length ? v.join("; ") : null;
  };
  const ou = (s) => { const l = String(s).split(/;\s*/).map((x) => minus(semPonto(x))); return l.length > 1 ? l.slice(0, -1).join(", ") + " ou " + l[l.length - 1] : l[0]; };
  const lugar = (s) => (/^(em|no|na|nos|nas|perto|longe|ao lado|aqui|por|pelo|pela|todo|toda)\b/i.test(s) ? minus(s) : "em " + s);
  const mesmo = (a, b) => !!a && !!b && semPonto(a).toLowerCase() === semPonto(b).toLowerCase();
  function perfilM3(p10) {
    const c = p10.campos || {}, f = (k) => semNS(c[k]);
    const ide = ideia();
    if (/^Pessoas/i.test(p10.opcao)) {
      const idade = f("Idade"), renda = f("Renda"), ocup = f("Ocupação"), mora = f("Onde mora");
      const p = ["Pessoas comuns"];
      if (idade) p.push(/^(até|mais)/i.test(idade) || /ou mais$/i.test(idade) ? ` com ${ou(idade)}` : ` de ${ou(idade)}`);
      if (renda) p.push(`, com renda ${/^(de|até)\b/i.test(renda) ? ou(renda) : "de " + ou(renda)}`);
      /* ocupação marcada nas opções do Módulo 3 ("Estudantes", "Aposentados"…) entra como "que são…"; texto livre fica entre parênteses */
      if (ocup) p.push(ocup.split(/;\s*/).every((x) => OCUP_M3.includes(x)) ? `, que são ${ou(ocup)}` : ` (ocupação: ${minus(semPonto(ocup))})`);
      if (mora && !mesmo(mora, ide && ide.v)) p.push(`, que moram ${lugar(semPonto(mora))}`);
      return p.join("");
    }
    if (/^Empresas/i.test(p10.opcao)) {
      const ramo = f("Ramo"), tam = f("Tamanho"), eq = f("Equipe"), local = f("Local");
      const p = ["Empresas"];
      if (ramo) p.push(` do ramo de ${ou(ramo)}`);
      if (tam) p.push(`, ${ou(tam)}`);
      if (eq) p.push(/^só o dono$/i.test(eq) ? ", em que só o dono trabalha" : `, com ${ou(eq)}`);
      /* o "Local" é onde a empresa fica; se repetir o que a pessoa vende (Módulo 1), não é um local e fica de fora */
      if (local && !mesmo(local, ide && ide.v)) p.push(`, ${lugar(semPonto(local))}`);
      return p.join("");
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
        ${vazio(e.exemplo) ? "" : `<p class="ex">${L(exTipo("educativo." + D.educativo.indexOf(e), e.exemplo))}</p>`}
        ${vazio(e.prompt) ? "" : `<div class="prompt"><p>${esc(e.prompt)}</p><button class="btn-copiar" data-t="${esc(e.prompt)}">Copiar texto</button></div>
          <p class="ex">${esc(e.conferir)}</p>`}
        <span class="fonte">Fonte: ${esc(e.fonte)}</span>
      </div>`).join("");
  }
  function blocoConceitos(lista) {
    if (!lista.length) return "";
    return `<details class="saiba"><summary>Entenda os termos</summary>${lista.map((b) => `
      <div class="conceito"><b>${esc(b.conceito)}</b><p>${esc(b.definicao)}</p>
      ${vazio(b.exemplo) ? "" : `<p class="ex">${esc(exTipo("base." + D.base.indexOf(b), b.exemplo))}</p>`}
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
  /* fica acima do campo; se for longa, vem recolhida para o campo e o Continuar caberem na tela com o teclado aberto */
  const DICA_LONGA = 160;
  const dica = (html) => !html ? "" : html.length > DICA_LONGA
    ? `<details class="dica-dobra"><summary>Dica para responder</summary><aside class="dica"><img src="assets/hero-tela.webp" alt=""><div><b>Dica</b><p class="ajuda">${html}</p></div></aside></details>`
    : `<aside class="dica"><img src="assets/hero-tela.webp" alt=""><div><b>Dica</b><p class="ajuda">${html}</p></div></aside>`;
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
    return `<div class="secao-titulo">${esc(l.nome)}</div>
      <p class="ajuda">${esc(l.objetivo)}</p>
      <p class="mini-info"><b>${esc(l.tipo)}.</b> ${esc(l.regra)}</p>
      <details class="saiba"><summary>Exemplo</summary><div class="conceito"><p>${esc(l.ex_entrada)}</p><p class="ex">${esc(l.ex_saida)}</p></div></details>`;
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
            <div class="erro" id="p-erro" hidden></div>
            <label class="mini-info">Prazo</label><input class="campo" type="date" id="p-prazo" value="${esc(S.plano.prazo)}">
          </div>
          <div class="aviso">${esc(i3.limite)}</div>

          ${cabInst(i4)}
          <div class="res-num">
            <div class="lbl">${esc(i4.nome)}</div>
            <div class="val">${Q.contagem.forte} · ${Q.contagem.fraco} · ${Q.contagem.nenhum}</div>
            <div class="sub">forte · fraco · nenhum${Q.motivo ? ` — motivo mais citado: ${esc(Q.motivo.t)}` : ""}</div>
          </div>
          <p class="mini-info" id="quadro-origem">${Q.total ? `Contado a partir das ${Q.total} entrevista(s) salvas na ficha de perfil de cliente.` : `O quadro conta as entrevistas salvas na ficha de perfil de cliente. Registre uma pessoa entrevistada e toque em “Salvar na ficha” para ele mudar.`} <a href="#form">Registrar entrevista</a></p>
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
    p.querySelector("#p-meta").onchange = (e) => {
      const v = e.target.value.trim(), er = p.querySelector("#p-erro");
      if (v && !/^\d+$/.test(v)) { er.textContent = "Digite só números, sem letras. Ex.: 8"; er.hidden = false; return; }
      S.plano.meta = v; salvar(); refazer(voltar);
    };
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
            ${vazio(q.ajuda) ? "" : dica(L(exTipo(cod + ".ajuda", q.ajuda)))}
            <div class="entrada" id="ent"></div>
            ${Motor.temNaoSei(q) ? `<div class="alt"><button class="btn-alt" id="ns">Não sei</button></div>` : ""}
            <div class="erro" id="erro" hidden></div>
            <div id="retorno"></div>
            <div class="acoes" id="acoes"><button class="btn btn-primario seta" id="ok">Continuar</button></div>
            ${botaoVoltar()}
            ${blocoEducativo(educativoDe(cod))}
            ${blocoVideos(videosDe(cod))}
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
        ? `<div class="linha"><input class="campo" inputmode="numeric" value="${esc(v)}"></div>`
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
      if (tipo === "numero") {
        /* a única pergunta de número conta pessoas ouvidas: só inteiro, sem negativo */
        if (!/^\d+$/.test(v.replace(/\./g, ""))) return erro(/^-/.test(v) ? "O número não pode ser negativo." : "Digite só números, sem letras. Ex.: 8");
        const n = parseInt(v.replace(/\./g, ""), 10);
        /* número fora do comum: avisa uma vez e deixa seguir com o mesmo valor */
        if (n > LIMITE_PESSOAS_OUVIDAS && avisado !== v) { avisado = v; return erro(`Esse número parece alto para conversas feitas por uma pessoa (mais de ${LIMITE_PESSOAS_OUVIDAS}); confira. Se estiver certo, toque em Continuar de novo.`, true); }
      }
      responder({ estado: "valor", valor: v });
    };
    let avisado = null;
    function erro(t, aviso) { const e = p.querySelector("#erro"); e.textContent = t; e.classList.toggle("aviso-num", !!aviso); e.hidden = false; }

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
      const B = blocosRetorno(q, regras, S.R[cod]);
      box.innerHTML = `<div class="retorno">
        ${regras.length ? regras.map((r) => `<div class="regra"><p class="r-texto">${L(r.texto)}</p></div>`).join("") : `<p class="r-texto r-pergunta">${L(q.resposta)}</p>`}
        ${B.naosei ? `<div class="bloco b-naosei"><b>Como descobrir</b>${B.naosei}</div>` : ""}
        ${B.alerta ? `<div class="bloco b-alerta"><b>Atenção</b>${B.alerta}</div>` : ""}
        ${B.proximo ? `<div class="bloco b-proximo"><b>Próximo passo</b>${B.proximo}</div>` : ""}
      </div>`;
      const acoes = p.querySelector("#acoes");
      acoes.innerHTML = "";
      /* o mesmo nome "Continuar": a resposta já foi gravada e este botão leva para a próxima pergunta */
      const b = el(`<button class="btn btn-primario seta" id="seguir">${prox === "RESULTADO" ? "Ver meu resumo" : "Continuar"}</button>`);
      b.onclick = () => { if (prox === "RESULTADO") { S.hist.push("RESULTADO"); salvar(); ir(telaResultado); } else ir(telaPergunta, prox); };
      acoes.appendChild(b);
      const c = el(`<button class="btn btn-claro">Corrigir minha resposta</button>`);
      c.onclick = () => ir(telaPergunta, cod);
      acoes.appendChild(c);
      /* o retorno fica logo abaixo do campo: a tela desce até ele, nunca volta para cima */
      if (box.getBoundingClientRect().top > 0) box.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    return p;
  }

  /* ---- retorno de uma resposta: uma Atenção e um Próximo passo por pergunta, sem repetição ----
     - regra que junta duas respostas (mais específica) vem antes da regra simples, que vem antes do texto geral da pergunta;
     - próximo passo que só manda responder a pergunta seguinte não aparece (o app já vai fazer essa pergunta);
     - o que é regra legal (fonte oficial, Sebrae, contador, contratos) e "quem procurar" vão para a Atenção, num bloco só;
     - "Não sei": em vez do próximo passo, "Como descobrir" (o caminho da regra ou, se não houver, a ajuda da pergunta). */
  const SO_NAVEGA = /^(Responda|Informe|Descreva|Siga para)\b[^]*M2\.P\d{2}/;
  const LEGAL = /fonte oficial|Sebrae|contador|nota fiscal|emiss[ãa]o de nota|contrata[çc]/i;
  /* "Responda M2.P08 e anote…" → "Anote…": a parte que só manda para a próxima pergunta sai */
  const semNavegar = (x) => {
    const t = String(x || "").replace(/^(Responda|Informe)\b[^.;]*?M2\.P\d{2}\)?[^.;]*?\s+e\s+(?=[a-zà-ú])/, "");
    return t === x ? x : t.charAt(0).toUpperCase() + t.slice(1);
  };
  const tem = (x) => !vazio(x) && !/^Nenhum/i.test(String(x).trim());
  const nRef = (r) => (String(r.condicao).match(/M2\.P\d{2}/g) || []).length;
  const especificas = (rs) => rs.slice().sort((a, b) => nRef(b) - nRef(a));
  function blocosRetorno(q, regras, resp) {
    const rs = especificas(regras);
    const naoSei = resp && Motor.valor({ x: resp }, "x") === Motor.NS;
    /* a Atenção geral da pergunta não vale para quem respondeu "Não sei" (fala de outra resposta) */
    const al = [rs.map((r) => r.alerta).find(tem) || (!naoSei && tem(q.alerta) ? q.alerta : null)];
    rs.forEach((r) => { if (tem(r.proximo) && LEGAL.test(r.proximo)) al.push(r.proximo); });
    const enc = [...new Set(rs.map((r) => r.encaminhamento).filter(tem))];
    const alerta = al.filter(Boolean).map(L).join(" ") + (enc.length ? `${al.some(Boolean) ? " " : ""}Quem procurar: ${enc.map(L).join("; ")}.` : "");
    const util = (x) => tem(x) && !SO_NAVEGA.test(x) && !LEGAL.test(x);
    const rp = rs.map((r) => semNavegar(r.proximo));
    const proximo = rp.find(util) || (util(q.proximo) ? q.proximo : null);
    const caminho = rp.find(util);
    if (naoSei) return { alerta, naosei: L(caminho || (tem(q.ajuda) ? exTipo(q.codigo + ".ajuda", q.ajuda) : "Converse com duas ou três pessoas que comprariam de você e volte a esta pergunta depois.")), proximo: "" };
    return { alerta, proximo: proximo ? L(proximo) : "" };
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
    const ale = Motor.alertas(regras), prox = Motor.proximos(regras).filter((x) => !SO_NAVEGA.test(x));
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
  /* texto corrido: as frases de cada assunto viram um parágrafo (1 a 3 parágrafos curtos, sem lista) */
  const emParagrafos = (fr, ...cortes) => [0, ...cortes].map((c, i, a) => fr.slice(c, i + 1 < a.length ? a[i + 1] : fr.length).join(" ")).filter(Boolean);
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
    const c1 = f.length;   // 1º parágrafo: o que vende e quem compra
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
    const c2 = f.length;   // 2º: grupos e como compram; 3º: conversas com clientes
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
    return emParagrafos(f, c1, c2);
  }
  function entendemos() {
    const fr = frasesEntendemos();
    return `<section class="entendemos" id="entendemos"><h2>O que entendemos até aqui</h2>${fr.map((x) => `<p>${esc(x)}</p>`).join("")}
      <p class="mini-info">Juntamos as suas respostas deste módulo com o que você já contou nos outros. Se algo não estiver certo, toque em “Revisar respostas”.</p></section>`;
  }

  function rodape() {
    return `<footer class="rodape">
      <p class="credito">Conteúdo feito por estudantes do Laboratório de Gestão II · FACC/UFJF · versão ${esc(D.modulo.versao)} · fontes consultadas em ${esc(D.modulo.data)}</p>
      <div class="logos">
        <img src="assets/logo_facc.png" alt="FACC">
        <img src="assets/logo_ufjf.svg" alt="UFJF">
        <img src="assets/logo_mg.svg" alt="Governo de Minas Gerais">
      </div>
    </footer>`;
  }

  ir(telaCapa);
})();
