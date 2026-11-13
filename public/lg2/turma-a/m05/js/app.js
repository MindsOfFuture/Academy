/* Telas do Módulo 5. Todo texto de conteúdo vem de window.MODULO5 (a planilha),
   sem edição. As respostas ficam só neste aparelho.
   Proposta de layout (mockup do grupo): faixa roxa com ilustração, etapas
   (Seu produto → Gastos → Preço e resultado), etiqueta do item com "Alterar",
   cartão de dica, Voltar/Continuar e lista "Minhas análises". */
(function () {
  "use strict";
  const D = window.MODULO5, M = Motor.montar(D);
  const CAPA = (D.leve && D.leve.capa) || { frase: D.mapa.objetivo, minutos: 20, como_funciona: "" };
  const tela = document.getElementById("tela");
  const CHAVE = "lg2-turma-a-m05";
  const CHAVE_HIST = CHAVE + "-historico";          // análises concluídas
  const CHAVE_ATUAL = CHAVE + "-historico-atual";   // qual análise da lista é a de agora
  const vazio = (s) => !s || !String(s).trim() || s === "—" || s === "-";
  const ROTULO_REINICIO = "Analisar outro produto, serviço ou mercadoria";

  /* Versão do estado salvo: a 2 tirou o "Não sei" dos gastos fixos e passou o preço
     para o fim; a 3 trouxe a pergunta 1 do Módulo 1 (M5.P00), as formas de pagamento
     (M5.PG) e a taxa por forma (P25 virou lista). Respostas salvas em outra versão são descartadas. */
  const VERSAO = 3;
  const PRIMEIRA = Motor.P_INICIAL;
  /* Leitura (nunca escrita) das respostas de outros módulos neste aparelho. */
  function lerOutro(chave, cod) {
    try { const s = JSON.parse(localStorage.getItem(chave)); const r = s && s.R && s.R[cod]; return r || null; } catch { return null; }
  }
  const doM1 = (cod) => lerOutro("lg2-turma-a-m01", cod);
  function ideiaM1() {
    const r = lerOutro("lg2-turma-a-m01", "M1.P03");
    return r && r.estado === "valor" && r.valor && String(r.valor).trim() ? String(r.valor) : null;
  }
  function faixaM3() {
    const r = lerOutro("lg2-turma-a-m03", "M3.P20");
    return r && r.estado === "valor" ? r.valor : null;
  }
  /* Herança do Módulo 1 (relatório do testador, 05/11): "como está a ideia" (M1.P01) e
     "o que oferece" (M1.P03A, mesmas 3 opções da P01) entram prontos e as telas são puladas;
     o cartão "Seu negócio" mostra o que veio, com selo e "Trocar". Formato da resposta igual
     ao de antes ({estado, opcao}) + marca herdado:"M1" — quem lê a P01 em outro módulo não muda. */
  function herdar() {
    const est = Motor.herdarEstagio(M, doM1("M1.P01"));
    if (est && !S.R[PRIMEIRA]) S.R[PRIMEIRA] = { estado: "opcao", opcao: est, herdado: "M1" };
    const tipo = Motor.herdarTipo(M, doM1("M1.P03A"));
    if (tipo && !S.R["M5.P01"]) S.R["M5.P01"] = { estado: "opcao", opcao: tipo, herdado: "M1" };
    salvar();
  }
  const herdado = (cod) => !!(S.R[cod] && S.R[cod].herdado);
  /* primeira tela que realmente pergunta algo (pula as respostas que vieram do Módulo 1) */
  function pularHerdadas(cod) {
    if (cod === PRIMEIRA && herdado(PRIMEIRA)) cod = "M5.P01";
    if (cod === "M5.P01" && herdado("M5.P01")) cod = TIPOS[tipoAtual()].nome;
    return cod;
  }
  function comecar() { herdar(); ir(telaPergunta, pularHerdadas(PRIMEIRA)); }
  let S = carregar();               // { versao, R: respostas, hist: [códigos], lucro? }
  function carregar() {
    try {
      const s = JSON.parse(localStorage.getItem(CHAVE));
      return s && s.versao === VERSAO && s.R && Array.isArray(s.hist) ? s : novo();
    } catch { return novo(); }
  }
  function novo() { return { versao: VERSAO, R: {}, hist: [] }; }
  function salvar() { try { localStorage.setItem(CHAVE, JSON.stringify(S)); } catch {} }
  function reiniciar() {
    if (!confirm("Analisar outro produto, serviço ou mercadoria? As respostas atuais serão apagadas. Se já tiver um resultado, salve ou imprima antes de continuar.")) return;
    S = novo();
    salvar();
    try { localStorage.removeItem(CHAVE_ATUAL); } catch {}
    comecar();
  }

  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const brl = (n) => "R$ " + n.toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const pct = (n) => n.toFixed(1).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "%";
  /* "Como calculamos: …" embaixo de cada número calculado: a conta em linguagem simples, com os valores
     da pessoa. Recebe HTML já escapado (use esc() nos textos digitados). */
  const comoCalc = (html, id) => `<p class="como-calc"${id ? ` id="${id}"` : ""}>Como calculamos: ${html}</p>`;
  const qtdTxt = (n) => String(Math.round(n * 100) / 100).replace(".", ",");
  /* custo de uma unidade = soma do que vai em cada unidade (materiais, mercadoria, frete, embalagem) */
  function comoCusto(c) {
    const cada = c.tipo === "Serviço" ? "cada atendimento" : "cada unidade";
    if (!c.linhas.length) return comoCalc(`nenhum material informado para ${cada}, então o custo fica em ${brl(c.custoUnidade)}.`, "como-custo");
    if (c.linhas.length === 1) return comoCalc(`o que vai em ${cada}: ${esc(c.linhas[0].nome)} ${brl(c.linhas[0].valor)}.`, "como-custo");
    return comoCalc(`somamos o que vai em ${cada}: ${c.linhas.map((l) => `${esc(l.nome)} ${brl(l.valor)}`).join(" + ")} = ${brl(c.custoUnidade)}.`, "como-custo");
  }
  /* sobra em cada venda e margem sobre o preço */
  const comoSobra = (preco, custo, taxa, sobra, margem, id) => comoCalc(`${brl(preco)} de preço − ${brl(custo)} de custo${taxa ? ` − ${brl(taxa)} de taxas` : ""} = ${brl(sobra)} que sobram em cada venda${margem !== null && margem !== undefined ? `; ${brl(sobra)} ÷ ${brl(preco)} = ${pct(margem)} do preço` : ""}.`, id);
  /* Teclado do celular: o campo em foco vai para o centro da área visível (depois de ~300 ms
     e de novo quando o teclado muda o tamanho da tela), para o campo e o Continuar ficarem à vista. */
  let focoT = null;
  const centralizar = () => {
    const a = document.activeElement;
    if (!a || !a.matches || !a.matches("input, textarea, select")) return;
    a.scrollIntoView({ block: "center" });
    /* se o Continuar ficou abaixo da área visível, sobe mais um pouco, sem esconder o campo */
    const ok = document.getElementById("ok");
    if (!ok || ok.offsetParent === null) return;
    const alt = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    const falta = ok.getBoundingClientRect().bottom + 8 - alt, folga = a.getBoundingClientRect().top - 8;
    if (falta > 0 && folga > 0) window.scrollBy(0, Math.min(falta, folga));
  };
  document.addEventListener("focusin", (e) => {
    if (!e.target.matches || !e.target.matches("input, textarea, select")) return;
    clearTimeout(focoT); focoT = setTimeout(centralizar, 300);
  });
  if (window.visualViewport) window.visualViewport.addEventListener("resize", () => { clearTimeout(focoT); focoT = setTimeout(centralizar, 60); });

  function el(html) { const d = document.createElement("div"); d.innerHTML = html.trim(); return d.firstElementChild; }
  function ir(f, a) { tela.innerHTML = ""; tela.appendChild(f(a)); window.scrollTo(0, 0); }
  /* abre um passo do histórico: pergunta, análise do preço ou resultado */
  function abrir(cod) {
    if (cod === "RESULTADO") ir(telaResultado);
    else if (cod === Motor.PRECO) ir(telaPreco);
    else if (cod && M.porCodigo[cod]) ir(telaPergunta, cod);
    else ir(telaCapa);
  }

  /* ================= peças do layout ================= */
  const TIPOS = {
    Produto: { nome: "M5.P02", seu: "seu produto", etapa: "Seu produto", card: "card-produto.webp", dica: "dica-produto.webp", gastos: "dica-gastos.webp", heroi: "hero-produto.webp", heroiGastos: "hero-gastos.webp", ex: "Ex.: bolos, marmitas e artesanato." },
    Mercadoria: { nome: "M5.P10", seu: "sua mercadoria", etapa: "Sua mercadoria", card: "card-mercadoria.webp", dica: "card-mercadoria.webp", gastos: "card-mercadoria.webp", heroi: "hero-preco.webp", heroiGastos: "hero-preco.webp", ex: "Ex.: roupas, bebidas e acessórios." },
    "Serviço": { nome: "M5.P17", seu: "seu serviço", etapa: "Seu serviço", card: "card-servico.webp", dica: "card-servico.webp", gastos: "card-servico.webp", heroi: "hero-preco.webp", heroiGastos: "hero-preco.webp", ex: "Ex.: manicure, aulas e consertos." },
  };
  /* versão leve: descrição curta dos 3 tipos na P01 (o valor salvo continua "Produto: eu compro materiais…") */
  const DESC_TIPO = { Produto: "faço o que vendo", Mercadoria: "compro pronto e revendo", "Serviço": "cobro pelo meu trabalho" };
  function tipoAtual() {
    const r = S.R["M5.P01"];
    return r && r.estado === "opcao" ? r.opcao.split(":")[0].trim() : null;
  }
  const infoTipo = () => TIPOS[tipoAtual()] || null;
  /* etapa de cada passo: perguntas do tipo = 1; gastos fixos = 2; quantidade, preço e resultado = 3 */
  function etapa(cod) {
    if (["M5.P36", "M5.P37", Motor.PRECO, "RESULTADO"].includes(cod)) return 3;
    const q = M.porCodigo[cod];
    return q && q.secao === "Parte comum" ? 2 : 1;
  }

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
        ${o.img ? `<img class="heroi-img" src="assets/${o.img}" alt="" style="${o.foco ? `object-position:${o.foco}` : ""}">` : ""}
      </div>
      ${o.reinicio ? `<button class="reinicio" id="novo">${ROTULO_REINICIO}</button>` : ""}
    </section>`;
  }
  /* versão leve: perguntas, preço e resultado com faixa roxa curta (sem título repetido nem ilustração);
     fica só o botão de analisar outro item e, no resultado, a palavra "Resultado" */
  function faixaCurta(o) {
    o = o || {};
    return `<section class="heroi heroi-compacta">
      ${o.kicker ? `<div class="kicker ${o.kickerClasse || ""}">${esc(o.kicker)}</div>` : ""}
      <button class="reinicio" id="novo">${ROTULO_REINICIO}</button>
    </section>`;
  }
  function etapas(n, tudo) {
    const t = infoTipo();
    const nomes = [t ? t.etapa : "Seu negócio", "Gastos", "Preço e resultado"];
    return `<ol class="etapas" aria-label="Etapas da análise">${nomes.map((nome, i) => {
      const k = i + 1, st = tudo || k < n ? "feita" : k === n ? "atual" : "";
      return `<li class="${st}"${k === n && !tudo ? ' aria-current="step"' : ""}><span class="bola" aria-hidden="true"></span><span class="rot">${esc(nome)}</span></li>`;
    }).join("")}</ol>`;
  }
  /* etiqueta do item: "Produto: Bolo de cenoura · Alterar" (volta à pergunta do nome) */
  function contexto(cod) {
    const tipo = tipoAtual(), t = infoTipo();
    if (!t || cod === "M5.P01" || cod === PRIMEIRA) return "";
    const r = S.R[t.nome];
    const nome = r && r.estado === "valor" && !vazio(r.valor) ? r.valor : null;
    if (!nome || cod === t.nome) return `<div class="contexto"><span class="chip chip-tipo">Tipo escolhido: ${esc(tipo)}</span><button class="alterar" data-alterar="M5.P01">Alterar</button></div>`;
    return `<div class="contexto"><span class="chip">${esc(tipo)}: ${esc(nome)}</span><button class="alterar" data-alterar="${t.nome}">Alterar</button></div>`;
  }
  function voltarPara(cod) {
    const i = S.hist.lastIndexOf(cod);
    if (i >= 0) S.hist = S.hist.slice(0, i);
    salvar();
    ir(telaPergunta, cod);
  }
  /* "Trocar" uma resposta que veio do Módulo 1: abre a tela pulada no lugar da tela atual */
  function trocar(cod) {
    const ordem = (c) => c === PRIMEIRA ? 0 : c === "M5.P01" ? 1 : 2;   // P00 < P01 < demais telas
    const atual = S.hist[S.hist.length - 1];
    if (atual && atual !== cod && ordem(atual) > ordem(cod)) S.hist.pop();
    salvar();
    ir(telaPergunta, cod);
  }
  const seloMini = () => `<span class="selo-mini">Veio do Módulo 1</span>`;
  /* cartão "Seu negócio: <ideia> · <tipo>" no topo das primeiras perguntas (substitui a antiga tela
     que só repetia a resposta do Módulo 1). Só aparece quando há algo vindo do Módulo 1. */
  function cartaoNegocio(cod, comSelo) {
    const r3 = doM1("M1.P03");
    const ideia = r3 && r3.estado === "valor" && !vazio(r3.valor) ? String(r3.valor).trim() : null;
    const tipo = tipoAtual();
    const mostraTipo = tipo && cod !== "M5.P01" && cod !== PRIMEIRA;   // na P00 o tipo já aparece no cabeçalho do cartão
    const mostraEst = S.R[PRIMEIRA] && S.R[PRIMEIRA].estado === "opcao" && cod !== PRIMEIRA;
    if (!ideia && !herdado(PRIMEIRA) && !herdado("M5.P01")) return "";
    if (!ideia && !mostraTipo && !mostraEst) return "";
    const cab = [ideia, mostraTipo ? tipo : null].filter(Boolean).join(" · ");
    return `<div class="negocio" id="seu-negocio">
      <div class="neg-cab"><span class="neg-rot">Seu negócio:</span> <b>${esc(cab || "—")}</b></div>
      ${mostraTipo ? `<div class="neg-linha" id="neg-tipo"><span>Tipo: <b>${esc(tipo)}</b></span>${herdado("M5.P01") ? seloMini() : ""}<button class="alterar" data-trocar="M5.P01">Trocar</button></div>` : ""}
      ${mostraEst ? `<div class="neg-linha" id="neg-estagio"><span>Hoje: <b>${esc(S.R[PRIMEIRA].opcao)}</b></span>${herdado(PRIMEIRA) ? seloMini() : ""}<button class="alterar" data-trocar="${PRIMEIRA}">Trocar</button></div>` : ""}
      ${comSelo ? `<p class="neg-nota selo-m">Veio do Módulo 1. Confira e ajuste se quiser.</p>` : herdado(PRIMEIRA) || herdado("M5.P01") ? `<p class="neg-nota">Confira e ajuste se quiser.</p>` : ""}
    </div>`;
  }
  /* "Ver dica" (fechada): a ajuda da pergunta, a observação e as orientações de preenchimento */
  function verDica(q, extra) {
    const partes = [vazio(q.ajuda) ? "" : `<p class="ajuda">${esc(q.ajuda)}</p>`, obs(q.observacao), notas(q), extra || ""].join("");
    if (!partes.trim()) return "";
    return `<details class="dica-toggle" id="dica"><summary>Ver dica</summary><div class="dica-corpo">${partes}</div></details>`;
  }
  /* enunciado curto da versão leve (por tipo de negócio quando houver) */
  function textoQ(q) {
    const t = tipoAtual();
    return (q.curtaPorTipo && t && q.curtaPorTipo[t]) || q.curta || q.pergunta;
  }
  /* "‹ Voltar" no topo do cartão, à esquerda, no mesmo lugar em todos os módulos (como no Módulo 1) */
  const botaoVoltar = () => `<button class="voltar-topo" id="v" aria-label="Voltar"><span aria-hidden="true">‹</span> Voltar</button>`;
  /* liga os botões comuns a todas as telas */
  function ligar(p) {
    p.querySelectorAll("[data-inicio]").forEach((b) => { b.onclick = () => ir(telaCapa); });
    p.querySelectorAll("[data-alterar]").forEach((b) => { b.onclick = () => voltarPara(b.dataset.alterar); });
    p.querySelectorAll("[data-trocar]").forEach((b) => { b.onclick = () => trocar(b.dataset.trocar); });
    const n = p.querySelector("#novo");
    if (n) n.onclick = reiniciar;
  }

  const obs = (t) => vazio(t) ? "" : `<div class="obs"><b>Observação</b><p>${esc(t)}</p></div>`;
  /* orientação de preenchimento (diferente de aviso): consumo x equipamento e conta de luz/água */
  function notas(q) {
    if (!q.notaConsumo) return "";
    const n = q.notaConsumo;
    return `<div class="nota-orienta" id="nota-consumo"><b>${esc(n.titulo)}</b><p>${esc(n.texto)}</p><p class="ex"><b>Exemplo:</b> ${esc(n.exemplo)}</p></div>
      <div class="nota-orienta" id="nota-luz"><b>Conta de luz e de água</b><p>${esc(q.notaLuzAgua)}</p></div>`;
  }
  /* selo de resposta trazida de outro módulo */
  const selo = (n) => `<p class="selo-m">Veio do Módulo ${n}. Confira e corrija se precisar.</p>`;

  /* vídeo só aparece quando o campo "video" da pergunta estiver preenchido */
  function blocoVideo(url) {
    if (vazio(url)) return "";
    const yt = /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/.exec(url);
    if (yt) return `<div class="video"><iframe src="https://www.youtube-nocookie.com/embed/${esc(yt[1])}" title="Vídeo explicativo" allowfullscreen loading="lazy"></iframe></div>`;
    if (/\.(mp4|webm)(\?|$)/i.test(url)) return `<div class="video"><video src="${esc(url)}" controls preload="metadata"></video></div>`;
    return `<div class="video"><iframe src="${esc(url)}" title="Vídeo explicativo" allowfullscreen loading="lazy"></iframe></div>`;
  }

  /* ---------- "Não sei": caixa "Como descobrir" (2 passos + pedido pronto para a IA, com Copiar) ----------
     Os textos ficam nos dados de cada pergunta (comoDescobrir, promptIA). "Não sei" aqui é só ajuda:
     não grava resposta. Os termos da Base técnica ficam recolhidos em "O que quer dizer". */
  function caixaComo(q, reserva) {
    const passos = q.comoDescobrir && q.comoDescobrir.length ? q.comoDescobrir : reserva || [];
    if (!passos.length) return "";
    return `<section class="como-descobrir" role="status">
      <b class="como-tit">Como descobrir</b>
      <ol>${passos.map((x) => `<li>${esc(x)}</li>`).join("")}</ol>
      ${q.promptIA ? `<div class="pedir-ia">
        <b>Peça ajuda à IA</b>
        <p class="como-nota">Copie, cole numa IA de sua preferência e troque o que está entre colchetes.</p>
        <p class="prompt" data-prompt>${esc(q.promptIA)}</p>
        <button class="btn btn-claro copiar" type="button" data-copiar>Copiar</button>
      </div>` : ""}
    </section>`;
  }
  function copiar(t, b, alvo) {
    const pronto = () => { b.textContent = "Copiado!"; setTimeout(() => { if (document.contains(b)) b.textContent = "Copiar"; }, 2000); };
    const reserva = () => {
      const ta = document.createElement("textarea");
      ta.value = t; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.top = "0"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      let foi = false;
      try { foi = document.execCommand("copy"); } catch {}
      ta.remove();
      if (foi) return pronto();
      /* sem cópia automática: deixa o texto selecionado para a pessoa copiar */
      try { const r = document.createRange(); r.selectNodeContents(alvo); const s = getSelection(); s.removeAllRanges(); s.addRange(r); } catch {}
      b.textContent = "Toque e segure o texto para copiar";
    };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(t).then(pronto, reserva);
    else reserva();
  }
  function ligarCopiar(raiz) {
    raiz.querySelectorAll("[data-copiar]").forEach((b) => {
      const alvo = b.parentNode.querySelector("[data-prompt]");
      b.onclick = () => copiar(alvo.textContent, b, alvo);
    });
  }
  function painelNaoSei(q, a) {
    const extras = a.extra.filter((x) => x !== q.ajuda);
    return `<div class="painel-ajuda" id="painel" hidden>
      ${blocoVideo(a.video)}
      ${caixaComo(q, a.comoAchar)}
      ${extras.map((x) => `<p class="como-nota">${esc(x)}</p>`).join("")}
      ${a.conceitos.length ? `<details class="ver-mais termos"><summary>O que quer dizer ${a.conceitos.map((b) => `“${esc(b.conceito)}”`).join(" e ")}</summary>${a.conceitos.map((b) => `
        <div class="conceito"><b>${esc(b.conceito)}</b><p>${esc(b.definicao)}</p>
        ${vazio(b.porque) ? "" : `<p>${esc(b.porque)}</p>`}
        ${vazio(exConceito(b)) ? "" : `<p class="ex">Exemplo: ${esc(exConceito(b))}</p>`}
        <span class="fonte">Fonte: ${vazio(b.link) ? esc(b.fonte) : `<a href="${esc(b.link)}" target="_blank" rel="noopener">${esc(b.fonte)}</a>`}${vazio(b.data) ? "" : ` · consultado em ${esc(b.data)}`}</span></div>`).join("")}</details>` : ""}
      <p class="depois">Depois, responda acima para continuar.</p>
    </div>`;
  }

  const exConceito = (b) => Motor.exemploConceito(b, tipoAtual());   // exemplo do conceito pelo tipo de negócio

  /* ================= capa ================= */
  function telaCapa() {
    const iniciado = S.hist.length > 0;
    const p = el(`
      <div class="pag">
        ${topo("")}
        ${heroi({ grande: true, h1: true, kicker: "Módulo " + D.modulo.numero, titulo: D.modulo.nome, texto: CAPA.frase, img: "hero-inicio.webp" })}
        <main class="corpo">
          <details class="como-funciona" id="como-funciona"><summary>Como funciona</summary>
            <p>${esc(CAPA.como_funciona)}</p>
            <div class="cartao"><h3>O que ter em mãos</h3><p>${esc(D.mapa.ter_em_maos)}</p></div>
            <div class="cartao"><h3>O que você recebe no final</h3><p>${esc(D.mapa.entrega)}</p></div>
            <div class="cartao"><h3>Para quem é</h3><p>${esc(D.mapa.usuario)}</p></div>
            <button class="btn btn-linha" id="limites">O que este módulo não faz</button>
          </details>
          <p class="tempo">Este módulo leva uns ${esc(CAPA.minutos)} minutos</p>
          <div class="acoes">
            <button class="btn btn-primario seta" id="ir">${iniciado ? "Continuar de onde parei" : "Começar"}</button>
            ${iniciado ? `<button class="btn btn-claro" id="zerar">Recomeçar do zero</button>` : ""}
            <button class="btn btn-linha lista-ico" id="minhas">Ver minhas análises</button>
          </div>
          ${rodape(true)}
        </main>
      </div>`);
    ligar(p);
    p.querySelector("#ir").onclick = () => {
      const atual = S.hist[S.hist.length - 1];
      if (atual) abrir(atual); else comecar();
    };
    const z = p.querySelector("#zerar");
    if (z) z.onclick = reiniciar;
    p.querySelector("#minhas").onclick = () => ir(telaAnalises, telaCapa);
    p.querySelector("#limites").onclick = () => ir(telaLimites);
    return p;
  }

  function telaLimites() {
    const p = el(`
      <div class="pag">
        ${topo("Limites")}
        ${heroi({ titulo: "Limites do módulo", texto: "O que este módulo faz, o que não faz e quando procurar ajuda.", img: "hero-preco.webp" })}
        <main class="corpo">
          ${botaoVoltar()}
          <div class="cartao"><h3>O que o módulo não faz</h3><p>${esc(D.mapa.nao_faz)}</p></div>
          <div class="cartao"><h3>Que decisões ele apoia</h3><p>${esc(D.mapa.decisoes)}</p></div>
          <div class="cartao"><h3>Quando procurar um profissional</h3><p>${esc(D.mapa.encaminhamentos)}</p></div>
          <div class="aviso">${esc(D.mapa.mensagem_limite)}</div>
          ${rodape(true)}
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
    const alt = Motor.botoesAlternativos(M, q);
    const ajudaNS = Motor.ajudaNaoSei(M, q);
    const inicial = cod === "M5.P01" || cod === PRIMEIRA;
    const cartoesTipo = cod === "M5.P01";
    /* pergunta 1 do Módulo 1: traz a resposta de lá quando ainda não respondeu aqui */
    let veioM1 = false;
    if (cod === PRIMEIRA && !resp) {
      const r1 = doM1("M1.P01");
      if (r1 && r1.estado === "opcao" && q.opcoesLista.includes(r1.opcao)) { veioM1 = r1.opcao; }
    }
    /* nome do item: sugere o que a pessoa escreveu no Módulo 1 ("O que você vende ou quer vender?") */
    let nomeM1 = null;
    if (!resp && infoTipo() && cod === infoTipo().nome) {
      const r3 = doM1("M1.P03");
      if (r3 && r3.estado === "valor" && !vazio(r3.valor)) nomeM1 = String(r3.valor);
    }
    const n = etapa(cod);
    const t = infoTipo();
    const seloHerdado = inicial && resp && resp.herdado;
    const comSelo = !!(veioM1 || nomeM1 || seloHerdado);
    /* versão leve: o aviso "Veio do Módulo 1" entra no cartão "Seu negócio" quando ele aparece (um aviso só) */
    const neg = (inicial || (t && cod === t.nome)) ? cartaoNegocio(cod, comSelo) : "";

    const p = el(`
      <div class="pag">
        ${topo(inicial ? "" : t ? tipoAtual() : "")}
        ${faixaCurta()}
        ${inicial ? "" : etapas(n)}
        <main class="corpo">
          <div class="cartao-q pergunta">
            ${botaoVoltar()}
            ${inicial ? neg : neg || contexto(cod)}
            <h2 class="q">${esc(textoQ(q))}</h2>
            ${verDica(q, cartoesTipo ? `<p class="nota-info">Trabalha com mais de um tipo? Comece por um deles.</p>` : tipo === "taxas-formas" ? `<p class="nota-info">Prazo: em quantos dias o dinheiro cai na conta (deixe vazio se cai na hora). Com mais de uma forma, as partes das vendas precisam somar 100%.</p>` : "")}
            ${ajudaNS ? "" : blocoVideo(q.video)}
            ${comSelo && !neg ? selo(1) : ""}
            <div class="entrada" id="ent"></div>
            ${alt.length ? `<div class="alt" id="alt"></div>` : ""}
            ${ajudaNS ? `<div class="alt"><button class="btn-ajuda" id="naosei" aria-expanded="false" aria-controls="painel"><span aria-hidden="true">?</span> Não sei</button></div>${painelNaoSei(q, ajudaNS)}` : ""}
            <div class="erro" id="erro" hidden></div>
            <div id="retorno"></div>
            <div class="acoes" id="acoes"><button class="btn btn-primario seta" id="ok">Continuar</button></div>
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
      if (ant) abrir(ant); else ir(telaCapa);
    };

    const bNS = p.querySelector("#naosei");
    if (bNS) bNS.onclick = () => {
      const painel = p.querySelector("#painel");
      painel.hidden = !painel.hidden;
      bNS.setAttribute("aria-expanded", String(!painel.hidden));
      if (!painel.hidden) painel.scrollIntoView({ behavior: "smooth", block: "nearest" });
    };
    const ent = p.querySelector("#ent");
    let ler = () => null;           // devolve o valor digitado
    let escolhida = resp && resp.estado === "opcao" ? resp.opcao : veioM1 || null;

    if (tipo === "escolha") {
      ent.classList.add("opcoes");
      if (cartoesTipo) ent.classList.add("opcoes-tipo");
      q.opcoesLista.forEach((op) => {
        const [tit, desc0] = op.includes(":") ? [op.split(":")[0], op.slice(op.indexOf(":") + 1)] : [op, ""];
        const desc = cartoesTipo && DESC_TIPO[tit.trim()] || desc0;   // texto curto na tela; o valor salvo continua o da planilha
        const b = el(`<button class="opcao ${escolhida === op ? "sel" : ""}"><span class="radio" aria-hidden="true"></span><span class="op-txt"><b>${esc(tit.trim())}</b>${desc ? `<span class="op-desc">${esc(desc.trim())}</span>` : ""}</span></button>`);
        b.onclick = () => { escolhida = op; ent.querySelectorAll(".opcao").forEach((x) => x.classList.remove("sel")); b.classList.add("sel"); };
        ent.appendChild(b);
      });
      ler = () => null;
    } else {
      ler = montarEntrada(ent, q, tipo, resp && resp.estado === "valor" ? resp.valor : nomeM1);
    }

    const altBox = p.querySelector("#alt");
    alt.forEach((op) => {
      const b = el(`<button class="btn-alt">${esc(op)}</button>`);
      b.onclick = () => responder(op === "Não sei" ? { estado: "naosei" } : { estado: "opcao", opcao: op });
      altBox.appendChild(b);
    });

    ent.addEventListener("input", () => { p.querySelector("#erro").hidden = true; });
    ent.addEventListener("click", (e) => { if (e.target.closest(".opcao")) p.querySelector("#erro").hidden = true; });
    let avisoVisto = null;          // aviso de quantidade alta: mostra uma vez; o 2º Continuar segue
    ent.addEventListener("input", () => { avisoVisto = null; });
    ent.addEventListener("change", () => { avisoVisto = null; });
    p.querySelector("#ok").onclick = () => {
      if (tipo === "escolha") {
        if (!escolhida) return mostrarErro(Motor.MSG_RESPONDA);
        return responder({ estado: "opcao", opcao: escolhida });
      }
      const v = ler();
      const erro = Motor.validar(M, q, v, S.R);
      if (erro) return mostrarErro(erro);
      const aviso = Motor.avisoQuantidade(M, q, v, S.R) || Motor.avisoValor(M, q, v, S.R);
      const chaveAviso = JSON.stringify(v);
      if (aviso && avisoVisto !== chaveAviso) {
        avisoVisto = chaveAviso;
        return mostrarErro(aviso + " Se estiver certo, toque em Continuar de novo.", true);
      }
      responder({ estado: "valor", valor: v });
    };

    function mostrarErro(txt, aviso) {
      const e = p.querySelector("#erro");
      e.textContent = txt; e.hidden = false;
      e.classList.toggle("aviso-qtd", !!aviso);
    }

    function responder(r0) {
      p.querySelector("#erro").hidden = true;
      delete S.ajusteOrig;          // respondeu de novo nas perguntas: o "Limpar" do resultado passa a valer a partir daqui
      if (resp && resp.herdado && r0.estado === "opcao" && r0.opcao === resp.opcao) r0 = Object.assign({}, r0, { herdado: resp.herdado });
      S.R[cod] = r0;
      const r = Motor.regra(M, q, r0);
      const prox = cod === PRIMEIRA ? pularHerdadas(Motor.proxima(M, q, r0, r)) : Motor.proxima(M, q, r0, r);
      salvar();
      mostrarRetorno(r, prox);
    }

    function mostrarRetorno(r, prox) {
      const box = p.querySelector("#retorno");
      const fica = prox === cod;
      box.innerHTML = r ? `
        <div class="retorno">
          ${vazio(r.texto) ? "" : `<p class="r-texto">${esc(r.texto)}</p>`}
          ${vazio(r.alerta) ? "" : `<div class="bloco b-alerta"><b>Atenção</b>${esc(r.alerta)}</div>`}
          ${vazio(r.proximo) || /^ir para/i.test(r.proximo) ? "" : `<div class="bloco b-proximo"><b>Próximo passo</b>${esc(r.proximo)}</div>`}
        </div>` : "";
      const acoes = p.querySelector("#acoes");
      acoes.innerHTML = "";
      if (fica) {
        const b = el(`<button class="btn btn-primario">Entendi, vou informar</button>`);
        b.onclick = () => ir(telaPergunta, cod);
        acoes.appendChild(b);
        return;
      }
      const b = el(`<button class="btn btn-primario seta">${prox === "RESULTADO" ? "Ver o resultado" : "Seguir"}</button>`);
      b.onclick = () => {
        if (prox === "RESULTADO" || prox === Motor.PRECO) { S.hist.push(prox); salvar(); }
        abrir(prox);
      };
      acoes.appendChild(b);
      const c = el(`<button class="btn btn-claro">Corrigir minha resposta</button>`);
      c.onclick = () => ir(telaPergunta, cod);
      acoes.appendChild(c);
      b.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
    return p;
  }

  /* ----- campos ----- */
  const UNIDADES = ["kg", "g", "L", "ml", "unidade", "outro"];
  function selUnid(v) {
    return `<select class="unid">${UNIDADES.map((u) => `<option ${u === v ? "selected" : ""}>${u}</option>`).join("")}</select>`;
  }

  function montarEntrada(ent, q, tipo, val) {
    const itens = Motor.itensDe(M, q, S.R);
    /* exemplo dentro do campo ("Ex.: …", vem dos dados); com vários campos, um exemplo por posição */
    const ph = (i) => {
      const x = q.placeholder;
      const v = Array.isArray(x) ? x[Math.min(i || 0, x.length - 1)] : x;
      return v ? ` placeholder="${esc(v)}"` : "";
    };
    if (tipo === "multipla") {
      ent.classList.add("opcoes");
      const marcadas = new Set(Array.isArray(val) ? val : []);
      q.opcoesLista.forEach((op) => {
        const b = el(`<button class="opcao multi ${marcadas.has(op) ? "sel" : ""}" aria-pressed="${marcadas.has(op)}"><span class="caixa" aria-hidden="true"></span><span class="op-txt"><b>${esc(op)}</b></span></button>`);
        b.onclick = () => {
          if (marcadas.has(op)) marcadas.delete(op); else marcadas.add(op);
          b.classList.toggle("sel", marcadas.has(op));
          b.setAttribute("aria-pressed", String(marcadas.has(op)));
        };
        ent.appendChild(b);
      });
      return () => q.opcoesLista.filter((o) => marcadas.has(o));
    }
    if (tipo === "taxas-formas") {
      const r = S.R[Motor.P_FORMAS];
      const formas = r && Array.isArray(r.valor) && r.valor.length ? r.valor : ["Todas as vendas"];
      const v = Array.isArray(val) ? val : [];
      const varias = formas.length > 1;
      formas.forEach((f, i) => {
        const x = v.find((y) => y.forma === f) || {};
        ent.appendChild(el(`<fieldset class="forma" data-forma="${esc(f)}"><legend>${esc(f)}</legend>
          <label class="item"><span>Taxa</span><div class="linha"><input class="campo taxa" inputmode="decimal"${ph(0)} value="${esc(x.taxa ?? "")}"><span class="pre">%</span></div></label>
          <label class="item"><span>Prazo</span><div class="linha"><input class="campo prazo" inputmode="numeric"${ph(1)} value="${esc(x.prazo ?? "")}"><span class="pre">dias</span></div></label>
          ${varias ? `<label class="item"><span>Parte das vendas</span><div class="linha"><input class="campo parte" inputmode="decimal"${ph(2)} value="${esc(x.parte ?? "")}"><span class="pre">%</span></div></label>` : ""}
        </fieldset>`));
      });
      ent.appendChild(el(`<p class="nota">Sem taxa? Coloque 0.</p>`));
      return () => [...ent.querySelectorAll(".forma")].map((fs) => {
        const o = { forma: fs.dataset.forma, taxa: fs.querySelector(".taxa").value, prazo: fs.querySelector(".prazo").value };
        if (varias) o.parte = fs.querySelector(".parte").value;
        return o;
      });
    }
    if (tipo === "texto") {
      ent.appendChild(el(`<input class="campo" type="text" data-falar aria-label="${esc(textoQ(q))}"${ph(0)} value="${esc(val || "")}">`));
      return () => ent.querySelector("input").value;
    }
    if (tipo === "numero" || tipo === "percentual") {
      const suf = tipo === "percentual" ? "%" : "";
      const pre = /r\$/i.test(q.tipo) ? "R$" : "";
      ent.appendChild(el(`<div class="linha">${pre ? `<span class="pre">${pre}</span>` : ""}<input class="campo" inputmode="decimal" aria-label="${esc(textoQ(q))}"${ph(0)} value="${esc(val ?? "")}">${suf ? `<span class="pre">${suf}</span>` : ""}</div>`));
      return () => ent.querySelector("input").value;
    }
    if (tipo === "lista") {
      const lista = el(`<div class="lista"></div>`);
      const add = (v) => {
        const l = el(`<div class="linha"><input class="campo" aria-label="Item"${ph(0)} value="${esc(v || "")}"><button class="x" aria-label="remover">×</button></div>`);
        l.querySelector(".x").onclick = () => l.remove();
        lista.appendChild(l);
      };
      (val && val.length ? val : ["", ""]).forEach(add);
      ent.appendChild(lista);
      const b = el(`<button class="btn-mais">+ adicionar item</button>`);
      b.onclick = () => add("");
      ent.appendChild(b);
      return () => [...lista.querySelectorAll("input")].map((i) => i.value).filter((s) => s.trim());
    }
    if (tipo === "por-item-valor") {
      itens.forEach((nome, i) => ent.appendChild(el(`<label class="item"><span>${esc(nome)}</span><div class="linha"><span class="pre">R$</span><input class="campo" inputmode="decimal"${ph(0)} value="${esc(val ? val[i] ?? "" : "")}"></div></label>`)));
      return () => [...ent.querySelectorAll("input")].map((i) => i.value);
    }
    if (tipo === "por-item-unidade") {
      itens.forEach((nome, i) => {
        const v = val && val[i] || {};
        ent.appendChild(el(`<label class="item"><span>${esc(nome)}</span><div class="linha"><input class="campo" inputmode="decimal"${ph(0)} value="${esc(v.q ?? "")}">${selUnid(v.u || "unidade")}</div></label>`));
      });
      return () => [...ent.querySelectorAll(".item")].map((it) => ({ q: it.querySelector("input").value, u: it.querySelector("select").value }));
    }
    if (tipo === "pacote") {
      const v = val || {};
      ent.appendChild(el(`<div><label class="item"><span>Preço do pacote</span><div class="linha"><span class="pre">R$</span><input class="campo" id="pp" inputmode="decimal"${ph(0)} value="${esc(v.preco ?? "")}"></div></label>
        <label class="item"><span>Quantas vêm no pacote</span><div class="linha"><input class="campo" id="pq" inputmode="numeric"${ph(1)} value="${esc(v.qtd ?? "")}"></div></label></div>`));
      return () => ({ preco: ent.querySelector("#pp").value, qtd: ent.querySelector("#pq").value });
    }
    if (tipo === "lista-valor") {
      const lista = el(`<div class="lista"></div>`);
      const add = (x) => {
        x = x || {};
        const l = el(`<div class="linha"><input class="campo nome" aria-label="Conta"${ph(0) || ' placeholder="conta"'} value="${esc(x.nome || "")}"><span class="pre">R$</span><input class="campo valor" inputmode="decimal" aria-label="Valor por mês"${ph(1)} value="${esc(x.v || "")}"><button class="x" aria-label="remover">×</button></div>`);
        l.querySelector(".x").onclick = () => l.remove();
        lista.appendChild(l);
      };
      (val && val.length ? val : [null]).forEach(add);
      ent.appendChild(lista);
      const b = el(`<button class="btn-mais">+ adicionar conta</button>`);
      b.onclick = () => add();
      ent.appendChild(b);
      return () => [...lista.querySelectorAll(".linha")].map((l) => ({ nome: l.querySelector(".nome").value, v: l.querySelector(".valor").value }))
        .filter((x) => x.nome.trim() || x.v.trim());
    }
    if (tipo === "tempo") {
      const v = val || {};
      ent.appendChild(el(`<div class="linha"><input class="campo" id="th" inputmode="numeric" aria-label="Horas"${ph(0)} value="${esc(v.h ?? "")}"><span class="pre">h</span><input class="campo" id="tm" inputmode="numeric" aria-label="Minutos"${ph(1)} value="${esc(v.m ?? "")}"><span class="pre">min</span></div>`));
      return () => ({ h: ent.querySelector("#th").value, m: ent.querySelector("#tm").value });
    }
    return () => null;
  }

  /* ================= análise do preço (depois da P36) ================= */
  function blocoAnalise(a, comTitulo, semAvisos) {
    if (!a || a.pendente) return "";
    const avisos = a.mensagens.length && !semAvisos ? `<div class="bloco b-alerta"><b>Atenção</b>${a.mensagens.map((m) => `<p>${esc(m)}</p>`).join("")}</div>` : "";
    if (a.semCusto) return `<div class="analise">${avisos}</div>`;
    const bt = (n) => M.conceito["M5.BT" + n] || {};
    const mini = (t, v) => `<div class="mini"><span>${v}</span><small>${esc(t)}</small></div>`;
    /* versão leve: no passo do preço as contas ("Como calculamos") ficam recolhidas; no resultado já estão em "Ver as contas" */
    const contas = [];
    const conta = (html) => { if (comTitulo) return html; contas.push(html); return ""; };
    const corpo = `
      ${comTitulo && a.modo === "sugerido" ? `<div class="secao-titulo">Preço de venda (demonstração)</div>` : ""}
      ${a.abaixo && !comTitulo ? blocoAbaixo(a.abaixo) : ""}
      ${a.muitoAcima && !semAvisos ? avisoAcrescimo(a) : ""}
      ${a.modo === "sugerido" ? `
        <div class="res-num"><div class="lbl">Preço possível</div><div class="val" id="preco-possivel">${brl(a.preco)}</div>
          <div class="sub">${esc(bt("03").conceito || "Custo por unidade")} ${brl(a.custo)} + ${pct(a.pct)} sobre o custo</div></div>
        ${conta(comoCalc(`${brl(a.custo)} de custo + ${pct(a.pct)} de ${brl(a.custo)} (${brl(a.preco - a.custo)}) = ${brl(a.preco)}.`, "como-preco"))}
        <p class="nota">Este preço é só uma demonstração para ajudar você a pensar. A decisão do preço é sua.</p>` : `
        <div class="res-num"><div class="lbl">Acréscimo sobre o custo</div><div class="val" id="lucro-pct">${pct(a.pct)}</div>
          <div class="sub">Preço ${brl(a.preco)} · ${esc(bt("03").conceito || "Custo por unidade")} ${brl(a.custo)}</div></div>
        ${conta(comoCalc(`(${brl(a.preco)} de preço − ${brl(a.custo)} de custo) ÷ ${brl(a.custo)} de custo = ${pct(a.pct)}.`, "como-acrescimo"))}
        ${conta(`<p class="nota">Acréscimo sobre o custo = (preço − custo de uma unidade) ÷ custo de uma unidade.</p>`)}`}
      ${comTitulo ? "" : `<div class="mini-cards" id="sobra-margem">
        ${mini("Sobra em cada venda" + (a.taxa ? " (depois das taxas)" : ""), brl(a.sobra))}
        ${a.margem !== null ? mini("Margem sobre o preço", pct(a.margem)) : ""}
      </div>
      ${conta(comoSobra(a.preco, a.custo, a.taxa, a.sobra, a.margem, "como-sobra"))}`}
      ${a.precoMinimo !== null ? `<p class="nota" id="preco-minimo">Para cobrir o custo, as taxas e a parte dos gastos do mês em cada venda, o preço precisa ser de pelo menos <b>${brl(a.precoMinimo)}</b>.</p>
        ${conta(comoCalc(`${brl(a.custo)} de custo + ${brl(a.precoMinimo * (1 - a.taxaPct / 100) - a.custo)} dos gastos do mês em cada venda${a.taxaPct ? `, divididos por ${pct(100 - a.taxaPct)} (o que fica depois da taxa de ${pct(a.taxaPct)})` : ""} = ${brl(a.precoMinimo)}.`, "como-minimo"))}` : ""}
      ${a.faixa ? `<p class="nota" id="faixa-m3">Faixa de preço que você informou no Módulo 3: ${brl(a.faixa.min)}${a.faixa.max !== a.faixa.min ? ` a ${brl(a.faixa.max)}` : ""}.</p>` : ""}
      ${avisos}`;
    return `<div class="analise">${corpo}
      ${contas.length ? `<details class="saiba como-calculamos" id="como-calculamos"><summary>Ver como calculamos</summary>${contas.join("")}</details>` : ""}
    </div>`;
  }


  const avisoAcrescimo = (a) => `<div class="bloco b-alerta aviso-forte" id="aviso-acrescimo"><b>Confira os valores</b><p>${esc(a.muitoAcima)}</p></div>`;
  /* avisos da análise do preço, para o topo do resultado */
  function avisosAnalise(a) {
    if (!a || a.pendente) return "";
    return (a.muitoAcima ? avisoAcrescimo(a) : "") + (a.mensagens.length ? `<div class="bloco b-alerta"><b>Atenção</b>${a.mensagens.map((m) => `<p>${esc(m)}</p>`).join("")}</div>` : "");
  }
  /* preço informado abaixo do custo de uma unidade: aviso que não trava, com atalho para revisar o preço */
  const blocoAbaixo = (msg) => `<div class="bloco b-alerta aviso-forte" id="aviso-abaixo-custo"><b>Atenção</b><p>${esc(msg)}</p>
    <button class="btn btn-claro btn-peq revisar" data-alterar="M5.P36">Revisar o preço</button></div>`;
  /* explicação de acréscimo sobre o custo x margem sobre o preço (exemplo do grupo) */
  function blocoMargem() {
    const m = Motor.MARGEM_X_ACRESCIMO;
    return `<details class="saiba" id="margem-x-acrescimo"><summary>Acréscimo sobre o custo ou margem sobre o preço?</summary>
      <div class="conceito"><p>${esc(m.texto)}</p><p class="ex"><b>Exemplo:</b> ${esc(m.exemplo)}</p></div></details>`;
  }
  /* poucas vendas: explicação única (só no passo do preço), com a parcela dos gastos do mês em cada venda */
  function blocoPoucasVendas(c) {
    if (!(c.mensal > 0)) return "";
    const parcela = c.parcelaMensal !== null && c.mensal > 0;
    return `<details class="dica-toggle" id="poucas-vendas"><summary>Gastos do mês em cada venda${parcela ? `: ${brl(c.parcelaMensal)}` : ""}</summary><div class="dica-corpo"><p>${esc(Motor.POUCAS_VENDAS)}</p>
      ${parcela ? `<p>Pelo que você informou: ${brl(c.mensal)} de gastos do mês ÷ ${String(c.qtd).replace(".", ",")} vendas = <b>${brl(c.parcelaMensal)}</b> por venda.</p>` : ""}</div></details>`;
  }

  function telaPreco() {
    const sugerido = !(S.R["M5.P36"] && S.R["M5.P36"].estado === "valor");
    let a = Motor.analisarPreco(M, S.R, S.lucro, faixaM3());
    const cBase = Motor.calcular(M, S.R);
    const p = el(`
      <div class="pag">
        ${topo(tipoAtual() || "")}
        ${faixaCurta()}
        ${etapas(3)}
        <main class="corpo">
          <div class="cartao-q pergunta">
            ${botaoVoltar()}
            ${contexto(Motor.PRECO)}
            <h2 class="q">${sugerido ? "Quanto você quer acrescentar sobre o custo? (%)" : "Quanto você ganha em cada venda"}</h2>
            ${blocoPoucasVendas(cBase)}
            ${sugerido && a && !a.semCusto ? `<details class="dica-toggle" id="dica"><summary>Ver dica</summary><div class="dica-corpo"><p>Vamos somar essa porcentagem ao que você gasta ${tipoAtual() === "Serviço" ? "em cada atendimento" : tipoAtual() === "Mercadoria" ? "para comprar cada unidade" : "para fazer cada unidade"} e mostrar um preço possível. Ex.: 50% sobre um custo de R$ 10 dá R$ 15.</p></div></details>
              <div class="entrada" id="ent"><div class="linha"><input class="campo" id="lucro" inputmode="decimal" aria-label="Porcentagem sobre o custo" placeholder="Ex.: 50" value="${esc(S.lucro ?? "")}"><span class="pre">%</span></div></div>` : ""}
            <div class="erro" id="erro" hidden></div>
            <div id="analise">${blocoAnalise(a, false)}</div>
            ${blocoMargem()}
            <div class="acoes" id="acoes">
              ${sugerido && a && !a.semCusto ? `<button class="btn btn-primario seta" id="calc">Continuar</button>` : ""}
              <button class="btn ${sugerido && a && !a.semCusto ? "btn-claro" : "btn-primario seta"}" id="res" ${sugerido && a && !a.semCusto && (a.pendente) ? "hidden" : ""}>Ver o resultado</button>
            </div>
          </div>
          ${rodape()}
        </main>
      </div>`);
    ligar(p);
    p.querySelector("#v").onclick = () => { S.hist.pop(); const ant = S.hist.pop(); salvar(); abrir(ant); };
    const calc = p.querySelector("#calc");
    if (calc) calc.onclick = () => {
      const v = p.querySelector("#lucro").value;
      const n = Motor.num(v);
      const erro = p.querySelector("#erro");
      if (n === null && v.trim()) { erro.textContent = Motor.MSG_NUMERO; erro.hidden = false; return; }
      if (n === null || n < 0) { erro.textContent = "Informe a porcentagem que você quer acrescentar sobre o custo, por exemplo 30."; erro.hidden = false; return; }
      erro.hidden = true;
      S.lucro = v.trim();
      salvar();
      a = Motor.analisarPreco(M, S.R, S.lucro, faixaM3());
      p.querySelector("#analise").innerHTML = blocoAnalise(a, false);
      const res = p.querySelector("#res");
      res.hidden = false;
      res.scrollIntoView({ behavior: "smooth", block: "nearest" });
    };
    p.querySelector("#res").onclick = () => { S.hist.push("RESULTADO"); salvar(); ir(telaResultado); };
    return p;
  }

  /* ================= minhas análises (lista salva neste aparelho) ================= */
  function lerHist() {
    try { const l = JSON.parse(localStorage.getItem(CHAVE_HIST)); return Array.isArray(l) ? l : []; } catch { return []; }
  }
  function gravarHist(l) { try { localStorage.setItem(CHAVE_HIST, JSON.stringify(l)); } catch {} }
  function idAtual() { try { return localStorage.getItem(CHAVE_ATUAL); } catch { return null; } }
  /* guarda (ou atualiza) a análise de agora quando o resultado aparece */
  function registrarAnalise(c, a) {
    const l = lerHist();
    const id = idAtual() || String(Date.now());
    const estado = JSON.parse(JSON.stringify(S));
    const i = l.findIndex((x) => x.id === id);
    if (i >= 0 && JSON.stringify(l[i].estado) === JSON.stringify(estado)) return l[i];
    const ok = a && !a.semCusto && !a.pendente && isFinite(a.pct);
    const item = {
      id, nome: vazio(c.nome) ? "Sem nome" : c.nome, tipo: c.tipo || "", data: new Date().toISOString(),
      preco: c.precoInformado !== null ? c.precoInformado : ok ? a.preco : null,
      precoInformado: c.precoInformado !== null,
      lucro: ok ? a.pct : null,
      estado,
    };
    if (i >= 0) l[i] = item; else l.unshift(item);
    gravarHist(l);
    try { localStorage.setItem(CHAVE_ATUAL, id); } catch {}
    return item;
  }
  const dataBR = (iso) => { const d = new Date(iso); return isNaN(d) ? "" : d.toLocaleDateString("pt-BR"); };

  function telaAnalises(voltar) {
    const l = lerHist();
    const p = el(`
      <div class="pag">
        ${topo("Minhas análises")}
        ${heroi({ titulo: "Minhas análises", texto: "As análises que você concluiu ficam guardadas neste aparelho.", img: "hero-preco.webp" })}
        <main class="corpo">
          ${botaoVoltar()}
          ${l.length ? `<ul class="lista-analises">${l.map((x) => `
            <li class="analise-item" data-id="${esc(x.id)}">
              <div class="ai-topo">
                ${TIPOS[x.tipo] ? `<img src="assets/${TIPOS[x.tipo].card}" alt="">` : ""}
                <div><b>${esc(x.nome)}</b>${x.tipo ? `<span class="chip">${esc(x.tipo)}</span>` : ""}<small>Concluída em ${esc(dataBR(x.data))}</small></div>
              </div>
              <div class="ai-nums">
                <div><small>${x.precoInformado ? "Preço" : "Preço possível"}</small><span>${x.preco !== null && isFinite(x.preco) ? brl(x.preco) : "—"}</span></div>
                <div><small>Acréscimo sobre o custo</small><span>${x.lucro !== null && isFinite(x.lucro) ? pct(x.lucro) : "—"}</span></div>
              </div>
              <div class="ai-acoes"><button class="btn btn-primario btn-peq" data-abrir="${esc(x.id)}">Abrir</button><button class="btn btn-linha btn-peq" data-apagar="${esc(x.id)}">Apagar</button></div>
            </li>`).join("")}</ul>`
          : `<div class="cartao vazio-lista"><h3>Nenhuma análise ainda</h3><p>Quando você chegar ao resultado de um produto, serviço ou mercadoria, a análise aparece aqui.</p></div>`}
          ${rodape(true)}
        </main>
      </div>`);
    ligar(p);
    p.querySelector("#v").onclick = () => ir(voltar || telaCapa);
    p.querySelectorAll("[data-abrir]").forEach((b) => { b.onclick = () => {
      const x = lerHist().find((y) => y.id === b.dataset.abrir);
      if (!x) return;
      const atual = idAtual();
      const salvaNaLista = atual && lerHist().some((y) => y.id === atual);
      if (S.hist.length && atual !== x.id && !salvaNaLista &&
        !confirm("Abrir esta análise? As respostas que você ainda não terminou serão trocadas por ela.")) return;
      S = JSON.parse(JSON.stringify(x.estado));
      salvar();
      try { localStorage.setItem(CHAVE_ATUAL, x.id); } catch {}
      if (S.hist[S.hist.length - 1] !== "RESULTADO") S.hist.push("RESULTADO");
      salvar();
      ir(telaResultado);
    }; });
    p.querySelectorAll("[data-apagar]").forEach((b) => { b.onclick = () => {
      const x = lerHist().find((y) => y.id === b.dataset.apagar);
      if (!x || !confirm(`Apagar a análise de “${x.nome}” da lista?`)) return;
      gravarHist(lerHist().filter((y) => y.id !== x.id));
      if (idAtual() === x.id) { try { localStorage.removeItem(CHAVE_ATUAL); } catch {} }
      ir(telaAnalises, voltar);
    }; });
    return p;
  }

  /* ================= ajustar valores no resultado (relatório de 12/11/2026) =================
     A pessoa corrige preços e quantidades na própria tela do resultado e toca em "Recalcular", sem refazer
     as perguntas. Os valores são gravados nas MESMAS respostas das perguntas (P04–P09, P11–P16, P20–P22,
     P27–P35, P36, P37), no mesmo formato, porque outros módulos leem essas respostas. Antes do primeiro
     ajuste guardamos uma cópia das respostas (S.ajusteOrig) para o "Limpar" voltar ao que estava. */
  let msgAjuste = null;   // mensagem depois de recalcular ou limpar (mostrada uma vez)
  const MSG_AJ_VAZIO = "Preencha todos os valores. Para voltar ao que estava, toque em “Limpar”.";
  const MSG_AJ_NEG = "O valor não pode ser negativo.";
  const MSG_AJ_ZERO = "A quantidade deve ser maior que zero.";
  /* gastos do mês: pergunta Sim/Não que abre cada valor */
  const GASTOS = [["M5.P29", "M5.P28", "Aluguel"], ["M5.P31", "M5.P30", "Água e luz"], ["M5.P27", "M5.P26", "Perdas no mês"]];
  function camposAjuste() {
    const R = S.R, tipo = tipoAtual();
    const val = (cod) => (R[cod] && R[cod].estado === "valor" ? R[cod].valor : null);
    const sim = (cod) => !!(R[cod] && R[cod].estado === "opcao" && /^Sim\b/.test(R[cod].opcao));
    const cada = tipo === "Serviço" ? "O que vai em cada atendimento" : "O que vai em cada unidade";
    const grupos = [{ titulo: cada, linhas: [] }, { titulo: "Gastos do mês", linhas: [] }, { titulo: "Preço e vendas", linhas: [] }];
    const [custo, mes, venda] = grupos.map((g) => g.linhas);
    const L = (rot, cod, v, o) => Object.assign({ rot, cod, v: v === null || v === undefined ? "" : String(v) }, o);
    function materiais(pLista, pPreco, pComp, pUsa, usaRot) {
      const nomes = (val(pLista) || []).filter((s) => String(s).trim());
      const pr = val(pPreco) || [], co = val(pComp) || [], us = val(pUsa) || [];
      nomes.forEach((nome, i) => {
        custo.push({ cab: nome });
        custo.push(L("Preço que você paga", pPreco, pr[i], { i, pre: "R$", regra: "nn" }));
        custo.push(L("Quanto vem quando compra", pComp, co[i] && co[i].q, { i, k: "q", suf: (co[i] && co[i].u) || "unidade", regra: "pos" }));
        custo.push(L(usaRot, pUsa, us[i] && us[i].q, { i, k: "q", suf: (us[i] && us[i].u) || "unidade", regra: "nn" }));
      });
    }
    function pacote(pPac) {
      const pk = val(pPac);
      if (!pk) return;
      custo.push({ cab: "Embalagem" });
      custo.push(L("Preço do pacote", pPac, pk.preco, { k: "preco", pre: "R$", regra: "nn" }));
      custo.push(L("Quantas vêm no pacote", pPac, pk.qtd, { k: "qtd", regra: "pos" }));
    }
    if (tipo === "Produto") {
      materiais("M5.P03", "M5.P04", "M5.P05", "M5.P06", "Quanto usa");
      if (val("M5.P07") !== null) custo.push(L("Quantas unidades você faz com essas quantidades", "M5.P07", val("M5.P07"), { regra: "pos" }));
      if (sim("M5.P08")) pacote("M5.P09");
    } else if (tipo === "Mercadoria") {
      if (val("M5.P11") !== null) custo.push(L("Quanto você paga na compra", "M5.P11", val("M5.P11"), { pre: "R$", regra: "nn" }));
      if (val("M5.P12") !== null) custo.push(L("Quantas unidades vêm nessa compra", "M5.P12", val("M5.P12"), { regra: "pos" }));
      if (sim("M5.P13") && val("M5.P14") !== null) custo.push(L("Frete do pedido", "M5.P14", val("M5.P14"), { pre: "R$", regra: "nn" }));
      if (sim("M5.P15")) pacote("M5.P16");
    } else if (tipo === "Serviço" && sim("M5.P18")) {
      materiais("M5.P19", "M5.P20", "M5.P21", "M5.P22", "Quanto usa em cada atendimento");
    }
    GASTOS.forEach(([cod, gate, rot]) => mes.push(L(rot, cod, sim(gate) ? val(cod) : "", { gate, pre: "R$", regra: "gasto" })));
    (sim("M5.P32") ? val("M5.P33") || [] : []).forEach((x, i) => mes.push(L(String(x.nome || "").trim() || "Outro gasto", "M5.P33", x.v, { i, k: "v", pre: "R$", regra: "gasto" })));
    mes.push(L("O que você separa para você (seu trabalho)", "M5.P35", sim("M5.P34") ? val("M5.P35") : "", { gate: "M5.P34", pre: "R$", regra: "gasto" }));
    if (val("M5.P36") !== null) venda.push(L("Preço de venda", "M5.P36", val("M5.P36"), { pre: "R$", regra: "nn" }));
    if (val("M5.P37") !== null) venda.push(L(tipo === "Serviço" ? "Atendimentos no mês" : "Vendas no mês", "M5.P37", val("M5.P37"), { regra: "nn" }));
    return grupos.filter((g) => g.linhas.some((l) => !l.cab));
  }
  /* tabela editável: devolve o HTML e a lista dos campos (na ordem dos inputs #aj-0, #aj-1…) */
  function blocoAjuste() {
    const gs = camposAjuste();
    const specs = [];
    if (!gs.length) return { html: "", specs };
    const linha = (l) => {
      if (l.cab) return `<tr class="aj-cab"><td colspan="2">${esc(l.cab)}</td></tr>`;
      const n = specs.push(l) - 1;
      return `<tr><td><label for="aj-${n}">${esc(l.rot)}${l.suf ? ` <span class="aj-unid">(${esc(l.suf)})</span>` : ""}</label></td><td><div class="linha">${l.pre ? `<span class="pre">${l.pre}</span>` : ""}<input class="campo aj" id="aj-${n}" inputmode="decimal" value="${esc(l.v)}"></div></td></tr>`;
    };
    const html = `<details class="saiba ajuste" id="ajuste"${msgAjuste ? " open" : ""}><summary>Ajustar valores e recalcular</summary>
      <p class="aj-intro">Algum preço ou quantidade mudou? Corrija na tabela e toque em “Recalcular”. Não precisa refazer as perguntas. Gasto do mês em branco conta como zero.</p>
      ${msgAjuste ? `<div class="bloco b-proximo" id="ajuste-msg" role="status">${msgAjuste.map((m) => `<p>${esc(m)}</p>`).join("")}</div>` : ""}
      ${gs.map((g) => `<div class="secao-titulo aj-tit">${esc(g.titulo)}</div><table class="comp ajuste-tab">${g.linhas.map(linha).join("")}</table>`).join("")}
      <div class="erro" id="ajuste-erro" hidden></div>
      <div class="aj-botoes"><button class="btn btn-primario" id="aj-recalcular">Recalcular</button><button class="btn btn-claro" id="aj-limpar">Limpar</button></div>
      <p class="aj-intro">“Limpar” desfaz os ajustes feitos aqui e volta aos valores das suas respostas.</p>
    </details>`;
    return { html, specs };
  }
  /* grava um valor ajustado na resposta da pergunta correspondente (mesmo formato das perguntas) */
  function gravarAjuste(s, t) {
    const R = S.R;
    const sim = (cod) => !!(R[cod] && R[cod].estado === "opcao" && /^Sim\b/.test(R[cod].opcao));
    if (s.cod === "M5.P33") { R["M5.P33"].valor[s.i] = Object.assign({}, R["M5.P33"].valor[s.i], { v: t }); return; }
    if (s.gate) {
      if (!t || Motor.num(t) === 0) {                       // sem esse gasto: a pergunta Sim/Não passa a "Não"
        if (sim(s.gate) || R[s.cod]) { R[s.gate] = { estado: "opcao", opcao: "Não" }; delete R[s.cod]; }
        return;
      }
      if (!sim(s.gate)) R[s.gate] = { estado: "opcao", opcao: "Sim" };
      R[s.cod] = Object.assign({}, R[s.cod], { estado: "valor", valor: t });
      return;
    }
    const r = R[s.cod] = Object.assign({}, R[s.cod], { estado: "valor" });
    if (s.i !== undefined) {
      const arr = Array.isArray(r.valor) ? r.valor.slice() : [];
      arr[s.i] = s.k ? Object.assign({}, arr[s.i] || { [s.k]: "", u: s.suf || "unidade" }, { [s.k]: t }) : t;
      r.valor = arr;
    } else if (s.k) r.valor = Object.assign({}, r.valor, { [s.k]: t });
    else r.valor = t;
  }
  function ligarAjuste(p, specs) {
    const rec = p.querySelector("#aj-recalcular");
    if (!rec) return;
    const det = p.querySelector("#ajuste");
    p.querySelectorAll("[data-ir-ajuste]").forEach((a) => { a.onclick = (e) => { e.preventDefault(); det.open = true; det.scrollIntoView({ behavior: "smooth", block: "start" }); }; });
    const erroBox = p.querySelector("#ajuste-erro");
    det.addEventListener("input", (e) => { e.target.removeAttribute("aria-invalid"); erroBox.hidden = true; });
    rec.onclick = () => {
      let erro = null, primeiro = null;
      const vals = specs.map((s, n) => {
        const inp = p.querySelector(`#aj-${n}`), t = inp.value.trim(), x = Motor.num(t);
        let e = null;
        if (!t) e = s.regra === "gasto" ? null : MSG_AJ_VAZIO;
        else if (x === null) e = Motor.MSG_NUMERO;
        else if (x < 0) e = MSG_AJ_NEG;
        else if (s.regra === "pos" && x <= 0) e = MSG_AJ_ZERO;
        inp.toggleAttribute("aria-invalid", !!e);
        if (e && !erro) { erro = e; primeiro = inp; }
        return t;
      });
      if (erro) { erroBox.textContent = erro; erroBox.hidden = false; primeiro.focus(); return; }
      if (!S.ajusteOrig) S.ajusteOrig = JSON.parse(JSON.stringify(S.R));
      specs.forEach((s, n) => gravarAjuste(s, vals[n]));
      /* outros gastos zerados saem da lista; lista vazia = "Não" na pergunta dos outros gastos */
      const r33 = S.R["M5.P33"];
      if (r33 && Array.isArray(r33.valor)) {
        r33.valor = r33.valor.filter((x) => Motor.num(x.v) > 0);
        if (!r33.valor.length) { delete S.R["M5.P33"]; S.R["M5.P32"] = { estado: "opcao", opcao: "Não" }; }
      }
      salvar();
      const msgs = ["Pronto! Recalculamos o resultado com os valores novos."];
      ["M5.P06", "M5.P22"].forEach((c) => { const r = S.R[c]; const a = r && r.estado === "valor" && Motor.avisoQuantidade(M, M.porCodigo[c], r.valor, S.R); if (a) msgs.push(a); });
      msgAjuste = msgs;
      ir(telaResultado);
    };
    p.querySelector("#aj-limpar").onclick = () => {
      if (S.ajusteOrig) { S.R = S.ajusteOrig; delete S.ajusteOrig; salvar(); msgAjuste = ["Voltamos aos valores das suas respostas."]; }
      else msgAjuste = ["Os campos voltaram aos valores das suas respostas."];
      ir(telaResultado);
    };
    if (msgAjuste) { msgAjuste = null; setTimeout(() => det.scrollIntoView({ block: "start" }), 0); }   // depois de a tela entrar
  }

  /* ================= resultado ================= */
  /* "Sua tarefa para fazer já": um passo concreto, escolhido pelo que o resultado mostrou */
  function tarefaResultado(c, a, abaixo, lacunas) {
    const cada = c.tipo === "Serviço" ? "cada atendimento" : "cada venda";
    if (a && a.semCusto) return "Volte às perguntas dos materiais e confira os preços e as quantidades: sem eles não dá para saber quanto custa " + cada + ".";
    if (abaixo || c.semSobra) return `Revise o preço: hoje ${cada} não cobre o custo${c.custoUnidade > 0 ? ` de ${brl(c.custoUnidade)}` : ""}. Pesquise o preço de 3 concorrentes e teste um valor novo em “Simular outro preço”.`;
    if (lacunas.length) return `Descubra primeiro: ${lacunas[0].texto.charAt(0).toLowerCase() + lacunas[0].texto.slice(1)}. Veja “Como descobrir” abaixo e depois atualize em “Ajustar valores e recalcular”.`;
    if (c.simulacao) return "Mostre o que você vende e o preço para 3 pessoas que comprariam e anote quanto elas pagariam. Depois, ajuste os valores aqui.";
    if (c.pe !== null && c.mensal > 0) return `Anote num papel: você precisa de ${c.pe} ${c.tipo === "Serviço" ? "atendimentos" : "vendas"} por mês para cobrir os gastos. No fim do mês, compare com o que vendeu de verdade.`;
    return `Anote o custo de ${cada} (${brl(c.custoUnidade)}) e confira, na próxima compra, se os preços dos materiais mudaram.`;
  }
  function telaResultado() {
    const aPreco = Motor.analisarPreco(M, S.R, S.lucro, faixaM3());
    const okSug = aPreco && aPreco.modo === "sugerido" && !aPreco.semCusto && !aPreco.pendente;
    const c = Motor.calcular(M, S.R, okSug ? aPreco.preco : null);   // sem preço informado: usa o preço possível
    registrarAnalise(c, aPreco);
    const bt = (n) => M.conceito["M5.BT" + n] || {};
    const regraFinal = D.regras.find((r) => r.pergunta === "Resultado");
    const temCusto = c.linhas.length > 0 || c.tipo === "Serviço";
    const lacunas = [];
    Object.keys(S.R).forEach((cod) => {
      if (!S.hist.includes(cod) || !M.porCodigo[cod]) return;
      const r = Motor.regra(M, M.porCodigo[cod], S.R[cod]);
      if (r && !vazio(r.lacuna) && !lacunas.some((l) => l.texto === r.lacuna)) lacunas.push({ texto: r.lacuna, cod });
    });
    const tempoAlto = Motor.tempoExcede(c, (doM1("M1.P05") || {}).opcao);   // horas por dia do Módulo 1
    const investe = Motor.avisoInvestimento(M, S.R, doM1("M1.P07"));        // compra x quanto pode usar (Módulo 1)
    const num2 = (n) => n.toFixed(1).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    const card = (t, v, sub) => `<div class="mini"><span>${v}</span><small>${esc(t)}</small>${sub ? `<em>${esc(sub)}</em>` : ""}</div>`;
    const t = TIPOS[c.tipo];
    const abaixo = c.precoInformado !== null ? Motor.abaixoCusto(c.precoInformado, c.custoUnidade) : null;
    const aj = blocoAjuste();

    const tarefa = tarefaResultado(c, aPreco, abaixo, lacunas);
    const p = el(`
      <div class="pag">
        ${topo(c.tipo || "")}
        ${faixaCurta({ kicker: "Resultado", kickerClasse: "passo" })}
        ${etapas(3, true)}
        <main class="corpo">
          ${botaoVoltar()}
          <section class="concluido">
            <div class="conc-topo"><span class="check" aria-hidden="true"></span><div><h2>Você concluiu a análise deste item!</h2></div></div>
            <div class="item-salvo">
              <div class="is-txt"><b>${esc(c.nome || "Seu negócio")}</b>${c.tipo ? `<span class="chip">${esc(c.tipo)}</span>` : ""}${c.tipo && herdado("M5.P01") ? ` ${seloMini()} <button class="alterar" data-trocar="M5.P01">Trocar</button>` : ""}</div>
              <div class="is-rodape"><span class="salvo">Análise salva</span><a href="#contas" class="ver" id="ver">Ver as contas ↓</a></div>
            </div>
          </section>

          <div id="numeros" class="numeros">
          <section class="entendemos" id="entendemos"><h3>O que entendemos até aqui</h3>
            ${Motor.entendemos(S.R, c, ideiaM1()).map((f) => `<p>${esc(f)}</p>`).join("")}
          </section>
          <div class="tarefa" id="tarefa"><b>Sua tarefa para fazer já</b><p>${esc(tarefa)}</p></div>
          ${c.simulacao ? `<div class="bloco b-simulacao" id="simulacao"><b>Simulação</b>${esc(Motor.MSG_SIMULACAO)}</div>` : ""}
          ${abaixo ? blocoAbaixo(abaixo) : ""}
          ${avisosAnalise(aPreco)}
          ${c.semSobra ? `<div class="bloco b-alerta" id="sem-sobra"><b>Atenção</b>${esc(Motor.MSG_SEM_SOBRA)}</div>` : ""}
          ${c.fatAlto ? `<div class="bloco b-alerta aviso-forte" id="fat-alto"><b>Confira os valores</b><p>${esc(Motor.MSG_FAT_ALTO)}</p></div>` : ""}
          ${investe ? `<div class="bloco b-alerta" id="aviso-investimento"><b>Atenção</b><p>${esc(investe.texto)}</p>${seloMini()}</div>` : ""}
          ${tempoAlto ? `<div class="bloco b-alerta" id="tempo-alto"><b>Atenção</b>${esc(Motor.MSG_TEMPO)}
            <p>${String(Math.round(tempoAlto.horas * 10) / 10).replace(".", ",")} horas por mês para ${esc(String(c.qtd))} atendimentos; no Módulo 1 você disse ter até ${tempoAlto.limite} horas por mês.</p>
            <button class="btn btn-claro btn-peq" data-alterar="M5.P37">Conferir a quantidade</button></div>` : ""}
          ${lacunas.length ? `<div class="bloco b-lacuna" id="lacunas"><b>O que ainda falta saber</b><ul>${lacunas.map((l) => { const q = M.porCodigo[l.cod]; return `<li><span class="falta-txt">${esc(l.texto)}</span>${q && q.comoDescobrir ? `<details class="ver-mais como-mini"><summary>Como descobrir</summary>${caixaComo(q)}</details>` : ""}</li>`; }).join("")}</ul></div>` : ""}

          <details class="resultado-mais" id="contas"><summary>Ver as contas</summary>
          ${temCusto && regraFinal ? `
            <div class="res-num">
              <div class="lbl">${esc(bt("03").conceito || "")}</div>
              <div class="val">${brl(c.custoUnidade)}</div>
            </div>
            ${comoCusto(c)}
            <p class="r-texto">${esc(regraFinal.texto.replace("R$ X", brl(c.custoUnidade)))}</p>
            <div class="bloco b-alerta"><b>Atenção</b>${esc(regraFinal.alerta)}</div>
            ${c.linhas.length ? `<details class="saiba" open><summary>${esc(regraFinal.proximo)}</summary>
              <table class="comp">${c.linhas.map((l) => `<tr><td>${esc(l.nome)}</td><td>${brl(l.valor)}</td></tr>`).join("")}
              ${c.taxa ? `<tr><td>${esc(bt("05").conceito)} (${pct(c.taxaPct)} do preço)</td><td>${brl(c.taxa)}</td></tr>` : ""}</table>
              ${aj.html ? `<p class="nota"><a href="#ajuste" data-ir-ajuste>Mudou algum valor? Ajuste aqui e recalcule ↓</a></p>` : ""}</details>` : ""}
          ` : ""}

          ${c.mc !== null ? `
            <div class="secao-titulo">Preço e margem</div>
            <div class="mini-cards">
              ${card(c.precoInformado !== null ? bt("08").conceito : "Preço possível (simulação)", brl(c.preco))}
              ${card(bt("09").conceito, brl(c.mc))}
              ${c.mcPct !== null ? card(bt("10").conceito, pct(c.mcPct)) : ""}
            </div>
            ${comoSobra(c.preco, c.custoUnidade, c.taxa, c.mc, c.mcPct, "como-margem")}
            ${c.mc <= 0 ? `<div class="bloco b-alerta"><b>Atenção</b>${esc(bt("09").definicao)}</div>` : ""}
          ` : ""}
          ${blocoAnalise(aPreco, true, true)}
          ${blocoMargem()}
          ${c.taxasFormas.length ? `
            <div class="secao-titulo">Formas de pagamento e taxas</div>
            <table class="comp" id="tab-formas">${c.taxasFormas.map((x) => `<tr><td>${esc(x.forma)}${x.parte ? ` (${esc(x.parte)}% das vendas)` : ""}${String(x.prazo || "").trim() ? ` · recebe em ${esc(x.prazo)} dias` : ""}</td><td>${esc(x.taxa)}%</td></tr>`).join("")}
            ${c.taxasFormas.length > 1 ? `<tr class="total"><td>Taxa média das vendas</td><td>${pct(c.taxaPct)}</td></tr>` : ""}</table>` : ""}

          <div class="secao-titulo">Gastos do mês</div>
          <table class="comp">
            ${c.fixos ? `<tr><td>${esc(bt("02").conceito)}</td><td>${brl(c.fixos)}</td></tr>` : ""}
            ${c.perdas ? `<tr><td>${esc(bt("04").conceito)}</td><td>${brl(c.perdas)}</td></tr>` : ""}
            ${c.trabalho ? `<tr><td>${esc(bt("07").conceito)}</td><td>${brl(c.trabalho)}</td></tr>` : ""}
            <tr class="total"><td>Total</td><td>${brl(c.mensal)}</td></tr>
          </table>

          ${c.pe !== null && c.mensal > 0 ? `
            <div class="res-num coral">
              <div class="lbl">${esc(bt("13").conceito)}</div>
              <div class="val">${c.pe}</div>
              <div class="sub">${c.tipo === "Serviço" ? "atendimentos" : "unidades"} por mês</div>
            </div>
            <p class="r-texto">${esc(bt("13").definicao)}</p>
            ${comoCalc(`${brl(c.mensal)} de gastos do mês ÷ ${brl(c.mc)} que sobram em cada venda = ${num2(c.mensal / c.mc)}. Arredondamos para cima, porque não dá para vender só uma parte: <b>${c.pe}</b> ${c.tipo === "Serviço" ? "atendimentos" : "vendas"}.`, "pe-conta")}` : ""}
          ${c.peFalta ? `<div class="secao-titulo">${esc(bt("13").conceito || "Ponto de equilíbrio")}</div><p class="nota" id="pe-falta">${esc(c.peFalta)}</p>` : ""}

          ${c.fat !== null ? `
            <div class="secao-titulo">Um mês normal, pelo que você informou</div>
            <div class="mini-cards">
              ${card(bt("11").conceito, brl(c.fat))}
              ${card(bt("12").conceito, brl(c.resultado))}
            </div>
            ${comoCalc(`${brl(c.preco)} × ${qtdTxt(c.qtd)} vendas = ${brl(c.fat)}; ${brl(c.fat)} − ${brl((c.custoUnidade + c.taxa) * c.qtd)} de custo${c.taxa ? " e taxas" : ""} dessas vendas − ${brl(c.mensal)} de gastos do mês = ${brl(c.resultado)}.`, "como-resultado")}
            <p class="r-texto">${esc(bt("12").definicao)}</p>
            <p class="nota" id="descontados">${esc(Motor.MSG_DESCONTADOS)}</p>` : ""}
          ${c.tempo ? `<div class="mini-cards">${card(M.porCodigo["M5.P23"].resposta, c.tempo >= 60 ? `${Math.floor(c.tempo / 60)}h${String(c.tempo % 60).padStart(2, "0")}` : `${c.tempo} min`)}</div>` : ""}
          </details>

          ${aj.html}
          ${c.custoUnidade > 0 || c.linhas.length ? `
            <details class="resultado-mais" id="simula-det"><summary>Simular outro preço e outra quantidade</summary>
            <div class="simula" id="simula">
              <label class="item"><span>Preço</span><div class="linha"><span class="pre">R$</span><input class="campo" id="sim-preco" inputmode="decimal" value="${c.preco !== null ? esc(String(Math.round(c.preco * 100) / 100).replace(".", ",")) : ""}"></div></label>
              <label class="item"><span>Vendas no mês</span><div class="linha"><input class="campo" id="sim-qtd" inputmode="decimal" value="${c.qtd !== null ? esc(String(c.qtd)) : ""}"></div></label>
              <button class="btn btn-claro" id="sim-ok">Simular</button>
              <div id="sim-res" aria-live="polite"></div>
              <p class="nota">Os números da simulação são estimativas. A decisão final é sua.</p>
            </div></details>` : ""}

          <details class="resultado-mais" id="mais-detalhes"><summary>Mais detalhes</summary>
            <div class="aviso">${esc(D.mapa.mensagem_limite)}</div>
            <div class="cartao"><h3>Quando procurar um profissional</h3><p>${esc(D.mapa.encaminhamentos)}</p></div>
          </details>
          </div>

          <button class="btn btn-linha lista-ico" id="minhas">Ver minhas análises</button>
          <div class="acoes">
            <button class="btn btn-primario" id="imp">Salvar ou imprimir</button>
            <button class="btn btn-claro" id="rev">Revisar respostas</button>
          </div>
          <div class="acoes lg2-proximo"><a class="btn btn-primario" style="text-decoration:none;text-align:center;box-sizing:border-box" href="/lg2/turma-b/m06/index.html">Ir para o Módulo 6</a></div>
          ${rodape(true)}
        </main>
      </div>`);

    ligar(p);
    p.querySelector("#v").onclick = () => { S.hist.pop(); const a = S.hist.pop(); salvar(); abrir(a); };
    /* imprimir: abre os detalhes recolhidos (o ajuste continua fora da impressão) */
    p.querySelector("#imp").onclick = () => { p.querySelectorAll("details").forEach((d) => { d.open = true; }); window.print(); };
    ligarCopiar(p);
    const sim = p.querySelector("#sim-ok");
    if (sim) sim.onclick = () => {
      const r = Motor.simular(M, S.R, p.querySelector("#sim-preco").value, p.querySelector("#sim-qtd").value);
      const box = p.querySelector("#sim-res");
      if (!r && [p.querySelector("#sim-preco").value, p.querySelector("#sim-qtd").value].some((x) => x.trim() && Motor.num(x) === null)) { box.innerHTML = `<div class="erro">${esc(Motor.MSG_NUMERO)}</div>`; return; }
      if (!r) { box.innerHTML = `<div class="erro">Informe o preço e a quantidade de vendas para simular.</div>`; return; }
      box.innerHTML = `<div class="mini-cards">${card("Sobra em cada venda", brl(r.sobra))}${card(bt("12").conceito || "Resultado", brl(r.resultado))}${r.pe !== null ? card(bt("13").conceito || "Ponto de equilíbrio", String(r.pe)) : ""}</div>
        ${r.abaixo ? `<div class="bloco b-alerta" id="sim-abaixo"><b>Atenção</b>${esc(r.abaixo)}</div>` : ""}
        ${r.semSobra ? `<div class="bloco b-alerta"><b>Atenção</b>${esc(Motor.MSG_SEM_SOBRA)}</div>` : ""}`;
    };
    p.querySelector("#rev").onclick = () => { S.hist = []; salvar(); ir(telaPergunta, pularHerdadas(PRIMEIRA)); };
    p.querySelector("#minhas").onclick = () => ir(telaAnalises, telaResultado);
    p.querySelector("#ver").onclick = (e) => { e.preventDefault(); const d = p.querySelector("#contas"); d.open = true; d.scrollIntoView({ behavior: "smooth", block: "start" }); };
    if (aj.specs.length) ligarAjuste(p, aj.specs);
    return p;
  }

  function rodape(credito) {
    return `<footer class="rodape">
      ${credito ? `<p class="credito">Laboratório de Gestão II · FACC/UFJF · versão ${esc(D.modulo.versao)}</p>` : ""}
      <div class="logos">
        <img src="assets/logo_facc.png" alt="FACC">
        <img src="assets/logo_ufjf.svg" alt="UFJF">
        <img src="assets/logo_mg.svg" alt="Governo de Minas Gerais">
      </div>
    </footer>`;
  }

  ir(telaCapa);
})();
