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
     (M5.PG) e a taxa por forma (P25 virou lista); a 4 (16/11) não aceita mais "Não sei"/"Ainda não defini" como
     resposta: estados antigos (inclusive sem versão) são migrados — só essas respostas viram "sem resposta"; o resto fica. */
  const VERSAO = 4;
  const PRIMEIRA = Motor.P_INICIAL;
  /* Leitura (nunca escrita) das respostas de outros módulos neste aparelho. */
  function lerOutro(chave, cod) {
    try { const s = JSON.parse(localStorage.getItem(chave)); const r = s && s.R && s.R[cod]; return r || null; } catch { return null; }
  }
  const doM1 = (cod) => lerOutro("lg2-turma-a-m01", cod);
  const doM4 = (cod) => lerOutro("lg2-turma-a-m04", cod);
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
  /* Sem pergunta repetida na jornada (16/11): o tipo também vem do Módulo 4 (M4.P02, só quando é um tipo só) e o nome
     do item vem do que a pessoa escreveu no Módulo 1 (M1.P03). As telas puladas aparecem num cartão com "Trocar". */
  function herdar(comNome) {
    const est = Motor.herdarEstagio(M, doM1("M1.P01"));
    if (est && !S.R[PRIMEIRA]) S.R[PRIMEIRA] = { estado: "opcao", opcao: est, herdado: "M1" };
    const t1 = Motor.herdarTipo(M, doM1("M1.P03A")), t4 = t1 ? null : Motor.herdarTipo(M, doM4("M4.P02"));
    if ((t1 || t4) && !S.R["M5.P01"]) S.R["M5.P01"] = { estado: "opcao", opcao: t1 || t4, herdado: t1 ? "M1" : "M4" };
    nomeDoM1 = !!comNome;          // "Analisar outro produto" não reaproveita o nome do Módulo 1 (fica fora do estado salvo)
    salvar();
  }
  let nomeDoM1 = true;
  const herdado = (cod) => !!(S.R[cod] && S.R[cod].herdado);
  const deModulo = (cod) => (S.R[cod] && S.R[cod].herdado ? String(S.R[cod].herdado).replace("M", "") : "1");
  /* nome do item a partir do Módulo 1 ("O que você vende ou quer vender?"), gravado na pergunta do nome do tipo */
  function herdarNome(cod) {
    if (!nomeDoM1 || S.R[cod]) return;
    const id = ideiaM1();
    if (id) { S.R[cod] = { estado: "valor", valor: id.trim(), herdado: "M1" }; salvar(); }
  }
  /* primeira tela que realmente pergunta algo (pula as respostas que vieram de módulos anteriores) */
  function pularHerdadas(cod) {
    if (cod === PRIMEIRA && herdado(PRIMEIRA)) cod = "M5.P01";
    if (cod === "M5.P01" && herdado("M5.P01")) cod = TIPOS[tipoAtual()].nome;
    if (cod === Motor.P_TEMPO && !S.R[cod] && tempoM7()) {
      const mm = Math.round(tempoM7());
      S.R[cod] = { estado: "valor", valor: { h: String(Math.floor(mm / 60)), m: String(mm % 60) }, herdado: "M7" };
      salvar();
    }
    if (cod === Motor.P_TEMPO && herdado(cod)) cod = "M5.P08";
    const t = infoTipo();
    if (t && cod === t.nome) {
      herdarNome(cod);
      if (herdado(cod)) cod = Motor.proxima(M, M.porCodigo[cod], S.R[cod], Motor.regra(M, M.porCodigo[cod], S.R[cod]));
    }
    return cod;
  }
  const horasM1 = () => (doM1("M1.P05") || {}).opcao;
  /* tempo de uma unidade já informado no Módulo 7 (em minutos) */
  function tempoM7() {
    const r = lerOutro("lg2-turma-b-m07", "M7-02");
    return r && r.estado === "valor" && Motor.num(r.minUn) > 0 ? Motor.num(r.minUn) : null;
  }
  function comecar(comNome) { herdar(comNome !== false); ir(telaPergunta, pularHerdadas(PRIMEIRA)); }
  let S = carregar();               // { versao, R: respostas, hist: [códigos], lucro? }
  function carregar() {
    try {
      const s = JSON.parse(localStorage.getItem(CHAVE));
      /* nenhuma resposta real se perde (16/11, J): qualquer estado com respostas (sem versão, 1, 2, 3) é migrado;
         só "Não sei"/"Ainda não defini" viram sem resposta. Perguntas novas (entrega, época do ano, tempo) ficam sem resposta. */
      if (!(s && s.R && typeof s.R === "object" && !Array.isArray(s.R))) return novo();
      if (!Array.isArray(s.hist)) s.hist = [];
      if (s.versao !== VERSAO) { Motor.migrar(s); s.versao = VERSAO; try { localStorage.setItem(CHAVE, JSON.stringify(s)); } catch {} }
      return s;
    } catch { return novo(); }
  }
  function novo() { return { versao: VERSAO, R: {}, hist: [] }; }
  function salvar() { try { localStorage.setItem(CHAVE, JSON.stringify(S)); } catch {} }
  function reiniciar() {
    if (!confirm("Analisar outro produto, serviço ou mercadoria? As respostas atuais serão apagadas. Se já tiver um resultado, salve ou imprima antes de continuar.")) return;
    S = novo();
    salvar();
    try { localStorage.removeItem(CHAVE_ATUAL); } catch {}
    comecar(false);
  }

  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const brl = (n) => (n < 0 && Math.round(n * 100) !== 0 ? "−" : "") + "R$ " + Math.abs(n).toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const pct = (n) => n.toFixed(1).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "%";
  /* taxa: até 3 casas, sem zeros sobrando (2,375% não vira 2,4%, para a conta da taxa bater) */
  const pctT = (n) => String(Math.round(n * 1000) / 1000).replace(".", ",") + "%";
  /* "Como calculamos: …" embaixo de cada número calculado: a conta em linguagem simples, com os valores
     da pessoa. Recebe HTML já escapado (use esc() nos textos digitados). */
  const comoCalc = (html, id) => `<p class="como-calc"${id ? ` id="${id}"` : ""}>Como calculamos: ${html}</p>`;
  const qtdTxt = (n) => String(Math.round(n * 1000) / 1000).replace(".", ",").replace(/^(\d+)/, (x) => x.replace(/\B(?=(\d{3})+(?!\d))/g, "."));
  /* número em padrão brasileiro para campos editáveis ("1.425,06") */
  const brNum = (n) => n.toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const vezesTxt = (n) => n >= 10 ? String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ".") : String(Math.round(n * 10) / 10).replace(".", ",");
  const UN_TXT = { kg: "kg", g: "g", l: "L", ml: "ml", unidade: "unidade(s)" };
  const unTxt = (u) => UN_TXT[String(u || "").toLowerCase()] || esc(u || "");
  /* conta de cada linha do custo (material, mercadoria, frete, embalagem), com os valores da pessoa */
  function contaLinha(l, cada) {
    if (l.conta === "material") return `${esc(l.nome)}: ${brl(l.preco)} × ${qtdTxt(l.usado)} ${unTxt(l.unUsado)} usados ÷ ${qtdTxt(l.comprado)} ${unTxt(l.unUsado)} comprados${l.divisor !== 1 ? ` ÷ ${qtdTxt(l.divisor)} unidades feitas` : ""} = ${brl(l.valor)}`;
    if (l.conta === "divide") return `${esc(l.nome)}: ${brl(l.total)} ÷ ${qtdTxt(l.qtd)} ${l.un} = ${brl(l.valor)}`;
    return `${esc(l.nome)} ${brl(l.valor)}`;
  }
  /* custo de uma unidade = soma do que vai em cada unidade (materiais, mercadoria, frete, embalagem) */
  function comoCusto(c) {
    const cada = c.tipo === "Serviço" ? "cada atendimento" : "cada unidade";
    if (!c.linhas.length) return comoCalc(`nenhum material informado para ${cada}, então o custo fica em ${brl(c.custoUnidade)}.`, "como-custo");
    const contas = c.linhas.map((l) => contaLinha(l, cada)).join("; ");
    if (c.linhas.length === 1) return comoCalc(`${contas}. Esse é o gasto de ${cada}.`, "como-custo");
    return comoCalc(`${contas}. Somamos o que vai em ${cada}: ${c.linhas.map((l) => brl(l.valor)).join(" + ")} = ${brl(c.custoUnidade)}.`, "como-custo");
  }
  /* sobra em cada venda e margem sobre o preço */
  const comoSobra = (preco, custo, taxa, sobra, margem, id, taxaPct, entrega) => comoCalc(`${taxa ? `taxa: ${pctT(taxaPct)} de ${brl(preco)} = ${brl(taxa)}; ` : ""}${brl(preco)} de preço − ${brl(custo)} de custo${taxa ? ` − ${brl(taxa)} de taxas` : ""}${entrega ? ` − ${brl(entrega)} de entrega` : ""} = ${brl(sobra)} que sobram em cada venda${margem !== null && margem !== undefined ? `; ${brl(sobra)} ÷ ${brl(preco)} = ${pct(margem)} do preço` : ""}.`, id);
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
  function ir(f, a) { tela.innerHTML = ""; tela.appendChild(f(a)); window.scrollTo(0, 0); focarEnunciado(); }
  /* leitor de tela (17/11, D): a tela nova começa pelo enunciado da pergunta */
  function focarEnunciado() {
    const h = tela.querySelector("h2.q");
    if (!h) return;
    h.setAttribute("tabindex", "-1");
    try { h.focus({ preventScroll: true }); } catch { h.focus(); }
  }
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
    if (["M5.P36", "M5.P37", Motor.P_SAZONAL, Motor.PRECO, "RESULTADO"].includes(cod)) return 3;
    const q = M.porCodigo[cod];
    return q && q.secao === "Parte comum" ? 2 : 1;
  }

  function topo(trilha) {
    return `<div class="barra-topo">
      <img class="logo-mini" src="assets/minds.svg" alt="Minds of the Future">
      <nav class="trilha" aria-label="Você está em"><button class="trilha-link" data-inicio>Início</button><span>/</span><span>Etapa ${esc(D.modulo.numero)}</span>${trilha ? `<span>/</span><span>${esc(trilha)}</span>` : ""}</nav>
    </div>`;
  }
  function heroi(o) {
    return `<section class="heroi ${o.grande ? "heroi-grande" : ""}">
      <div class="heroi-topo">
        <div class="heroi-txt">
          <div class="kicker ${o.kickerClasse || ""}">${esc(o.kicker || "Etapa " + D.modulo.numero)}</div>
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
    if (herdado(t.nome)) return `<div class="contexto" id="ctx-herdado"><span class="chip">${esc(tipo)}: ${esc(nome)}</span>${seloMini(deModulo(t.nome))}<button class="alterar" data-trocar="${t.nome}">Trocar</button></div>`;
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
    const ordem = (c) => { const i = M.ordem.findIndex((q) => q.codigo === c); return i < 0 ? 999 : i; };   // ordem das telas
    const atual = S.hist[S.hist.length - 1];
    if (atual && atual !== cod && ordem(atual) > ordem(cod)) S.hist.pop();
    salvar();
    ir(telaPergunta, cod);
  }
  const seloMini = (n) => `<span class="selo-mini">Veio da Etapa ${n || 1}</span>`;
  /* cartão "Seu negócio: <ideia> · <tipo>" no topo das primeiras perguntas (substitui a antiga tela
     que só repetia a resposta do Módulo 1). Só aparece quando há algo vindo do Módulo 1. */
  function cartaoNegocio(cod, comSelo) {
    const r3 = doM1("M1.P03");
    const ideia = r3 && r3.estado === "valor" && !vazio(r3.valor) ? String(r3.valor).trim() : null;
    const tipo = tipoAtual();
    const mostraTipo = tipo && cod !== "M5.P01" && cod !== PRIMEIRA;   // na P00 o tipo já aparece no cabeçalho do cartão
    const mostraEst = S.R[PRIMEIRA] && S.R[PRIMEIRA].estado === "opcao" && cod !== PRIMEIRA;
    const tn = infoTipo() && infoTipo().nome;
    const mostraNome = tn && cod !== tn && cod !== "M5.P01" && herdado(tn);   // nome do item pulado (veio do Módulo 1)
    /* nome igual à ideia (já no título do cartão): só o "Trocar" no título, para não repetir o texto */
    const nomeNoTitulo = mostraNome && ideia && String(S.R[tn].valor).trim().toLowerCase() === ideia.toLowerCase();
    if (!ideia && !herdado(PRIMEIRA) && !herdado("M5.P01")) return "";
    if (!ideia && !mostraTipo && !mostraEst) return "";
    const cab = [ideia, mostraTipo ? tipo : null].filter(Boolean).join(" · ");
    return `<div class="negocio" id="seu-negocio">
      <div class="neg-cab"><span class="neg-rot">Seu negócio:</span> <b>${esc(cab || "—")}</b>${nomeNoTitulo ? ` <button class="alterar" id="neg-cab-trocar" data-trocar="${tn}" aria-label="Trocar o nome">Trocar</button>` : ""}</div>
      ${mostraTipo ? `<div class="neg-linha" id="neg-tipo"><span>Tipo: <b>${esc(tipo)}</b></span>${herdado("M5.P01") ? seloMini(deModulo("M5.P01")) : ""}<button class="alterar" data-trocar="M5.P01">Trocar</button></div>` : ""}
      ${mostraNome && !nomeNoTitulo ? `<div class="neg-linha" id="neg-nome"><span>Item: <b>${esc(S.R[tn].valor)}</b></span>${seloMini(deModulo(tn))}<button class="alterar" data-trocar="${tn}">Trocar</button></div>` : ""}
      ${mostraEst ? `<div class="neg-linha" id="neg-estagio"><span>Hoje: <b>${esc(S.R[PRIMEIRA].opcao)}</b></span>${herdado(PRIMEIRA) ? seloMini() : ""}<button class="alterar" data-trocar="${PRIMEIRA}">Trocar</button></div>` : ""}
      ${comSelo ? `<p class="neg-nota selo-m">Veio da Etapa ${typeof comSelo === "number" ? comSelo : 1}. Confira e ajuste se quiser.</p>` : herdado(PRIMEIRA) || herdado("M5.P01") ? `<p class="neg-nota">Confira e ajuste se quiser.</p>` : ""}
    </div>`;
  }
  /* 16/11 (G): alertas da planilha que abriam para QUALQUER resposta viram texto da dica (antes de responder);
     o "Atenção" que era ordem para o app (não mostrar estimativa como resultado real) já é comportamento (aviso de simulação);
     o da P34 = Não é orientação, não risco: aparece como nota simples. */
  const ALERTA_NA_DICA = { "M5.P27": "M5.R57" };
  const ALERTA_INSTRUCAO = ["M5.R83"];
  const ALERTA_NOTA = ["M5.R75"];
  const dicaSemGasto = (q) => (Motor.DICA_SEM_GASTO[q.codigo] ? `<p class="ajuda dica-sem-gasto" id="dica-sem-gasto">${esc(Motor.DICA_SEM_GASTO[q.codigo])}</p>` : "");
  const alertaDaDica = (q) => { const r = ALERTA_NA_DICA[q.codigo] && D.regras.find((x) => x.codigo === ALERTA_NA_DICA[q.codigo]); return r && !vazio(r.alerta) ? `<p class="ajuda" id="dica-alerta">${esc(r.alerta)}</p>` : ""; };
  /* "Ver dica" (fechada): a ajuda da pergunta, a observação e as orientações de preenchimento */
  function verDica(q, extra) {
    const partes = [vazio(q.ajuda) ? "" : `<p class="ajuda">${esc(q.ajuda)}</p>`, alertaDaDica(q), dicaSemGasto(q), obs(q.observacao), notas(q), extra || ""].join("");
    if (!partes.trim()) return "";
    return `<details class="dica-toggle" id="dica"><summary>Ver dica</summary><div class="dica-corpo">${partes}</div></details>`;
  }
  /* enunciado curto da versão leve (por tipo de negócio quando houver) */
  function textoQ(q) {
    const t = tipoAtual();
    if (q.codigo === Motor.P_SAZONAL && S.R[PRIMEIRA] && S.R[PRIMEIRA].opcao === Motor.OPCOES_M1[0]) return Motor.SZ_TEXTO_IDEIA;   // ainda é só ideia
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
  const selo = (n) => `<p class="selo-m">Veio da Etapa ${n}. Confira e corrija se precisar.</p>`;

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
  function caixaComo(q, reserva, titulo) {
    const passos = q.comoDescobrir && q.comoDescobrir.length ? q.comoDescobrir : reserva || [];
    if (!passos.length) return "";
    return `<section class="como-descobrir" role="status">
      <b class="como-tit">${titulo || "Como descobrir"}</b>
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
  /* termos da Base técnica recolhidos em "O que quer dizer" (no painel do Não sei ou, sem Não sei, dentro do "Ver dica") */
  function termos(a) {
    if (!a || !a.conceitos.length) return "";
    return `<details class="ver-mais termos"><summary>O que quer dizer ${a.conceitos.map((b) => `“${esc(b.conceito)}”`).join(" e ")}</summary>${a.conceitos.map((b) => `
        <div class="conceito"><b>${esc(b.conceito)}</b><p>${esc(b.definicao)}</p>
        ${vazio(b.porque) ? "" : `<p>${esc(b.porque)}</p>`}
        ${vazio(exConceito(b)) ? "" : `<p class="ex">Exemplo: ${esc(exConceito(b))}</p>`}
        <span class="fonte">Fonte: ${vazio(b.link) ? esc(b.fonte) : `<a href="${esc(b.link)}" target="_blank" rel="noopener">${esc(b.fonte)}</a>`}${vazio(b.data) ? "" : ` · consultado em ${esc(b.data)}`}</span></div>`).join("")}</details>`;
  }
  /* texto da regra do grupo para quem não sabe (aba 4), reaproveitado como dica dentro da caixa (a regra não dispara mais) */
  function dicaRegra(q) {
    const r = (M.regrasDe[q.codigo] || []).find((x) => /n[ãa]o sab|n[ãa]o sei|n[ãa]o lembra|n[ãa]o informad|incomplet/i.test(Motor.valorCond(x)));
    if (!r) return "";
    const partes = [r.texto, r.alerta].filter((x) => !vazio(x));
    return partes.length ? `<p class="como-nota dica-regra">${esc(partes.join(" "))}</p>` : "";
  }
  function painelNaoSei(q, a) {
    const extras = a.extra.filter((x) => x !== q.ajuda);
    return `<div class="painel-ajuda" id="painel" hidden>
      ${blocoVideo(a.video)}
      ${caixaComo(q, a.comoAchar)}
      ${q.codigo === "M5.P36" ? calcPrecoPossivel() : ""}
      ${dicaRegra(q)}
      ${extras.map((x) => `<p class="como-nota">${esc(x)}</p>`).join("")}
      ${termos(a)}
      <p class="depois">Depois, responda acima para continuar.</p>
    </div>`;
  }
  /* 17/11: valor que a própria pessoa paga/recebe: "Como estimar" (passos + pedido para a IA). Não grava nada. */
  function painelEstimar(q) {
    return `<div class="painel-ajuda" id="painel" hidden>
      ${caixaComo(q, null, "Como estimar")}
      <p class="depois">Depois, escreva acima o seu valor aproximado para continuar.</p>
    </div>`;
  }
  /* P36 "Não sei": conta de um preço possível (custo + a porcentagem que a pessoa quiser), ao vivo. Não grava nada:
     "Usar este preço" só coloca o valor no campo; a pessoa confirma no Continuar. */
  function calcPrecoPossivel() {
    const c = Motor.calcular(M, S.R);
    if (!(c.custoUnidade > 0)) return "";
    const cada = tipoAtual() === "Serviço" ? "cada atendimento" : "cada unidade";
    return `<div class="calc-preco" id="calc-preco"><b>Um preço possível</b>
      <p>Você gasta ${brl(c.custoUnidade)} em ${cada}. Quanto quer acrescentar sobre esse gasto?</p>
      <div class="linha"><input class="campo" id="pp-pct" inputmode="decimal" aria-label="Porcentagem sobre o custo" placeholder="Ex.: 50"><span class="pre">%</span></div>
      <div id="pp-res" aria-live="polite"></div>
    </div>`;
  }
  function ligarCalcPreco(p) {
    const inp = p.querySelector("#pp-pct");
    if (!inp) return;
    const out = p.querySelector("#pp-res");
    const atualizar = () => {
      const r = Motor.precoPossivel(M, S.R, inp.value);
      if (r.preco === null) { out.innerHTML = inp.value.trim() ? `<p class="nota">${esc(Motor.MSG_NUMERO)}</p>` : ""; return; }
      out.innerHTML = `<p class="pp-val">Preço possível: <b id="pp-preco">${brl(r.preco)}</b></p>
        ${comoCalc(`${brl(r.custo)} (seu gasto) + ${pct(r.pct)} de ${brl(r.custo)} (${brl(r.acrescimo)}) = ${brl(r.preco)}.`, "como-pp")}
        <button class="btn btn-claro btn-peq" type="button" id="pp-usar">Usar este preço</button>`;
      out.querySelector("#pp-usar").onclick = () => {
        const campo = p.querySelector("#ent input");
        campo.value = brNum(r.preco);
        campo.dispatchEvent(new Event("input", { bubbles: true }));
        campo.focus();
      };
    };
    inp.addEventListener("input", atualizar);
  }
  /* aviso do preço (P36): a conta por trás do aviso */
  function comoAvisoPreco(preco) {
    const c = Motor.calcular(M, S.R);
    if (preco === null || !(c.custoUnidade > 0)) return "";
    if (preco < c.custoUnidade) return comoCusto(c).replace('id="como-custo"', 'id="como-aviso"');
    return comoCalc(`${brl(preco)} (preço) ÷ ${brl(c.custoUnidade)} (seu gasto em cada venda) = ${vezesTxt(preco / c.custoUnidade)} vezes.`, "como-aviso");
  }

  const exConceito = (b) => Motor.exemploConceito(b, tipoAtual());   // exemplo do conceito pelo tipo de negócio

  /* ================= capa ================= */
  function telaCapa() {
    const iniciado = S.hist.length > 0;
    const p = el(`
      <div class="pag">
        ${topo("")}
        ${heroi({ grande: true, h1: true, kicker: "Etapa " + D.modulo.numero, titulo: D.modulo.nome, texto: CAPA.frase, img: "hero-inicio.webp" })}
        <main class="corpo">
          <details class="como-funciona" id="como-funciona"><summary>Como funciona</summary>
            <p>${esc(CAPA.como_funciona)}</p>
            <div class="cartao"><h3>O que ter em mãos</h3><p>${esc(D.mapa.ter_em_maos)}</p></div>
            <div class="cartao"><h3>O que você recebe no final</h3><p>${esc(D.mapa.entrega)}</p></div>
            <div class="cartao"><h3>Para quem é</h3><p>${esc(D.mapa.usuario)}</p></div>
            <button class="btn btn-linha" id="limites">O que esta etapa não faz</button>
          </details>
          <p class="tempo">Esta etapa leva cerca de ${esc(CAPA.minutos)} minutos</p>
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
        ${heroi({ titulo: "Limites da etapa", texto: "O que esta etapa faz, o que não faz e quando procurar ajuda.", img: "hero-preco.webp" })}
        <main class="corpo">
          ${botaoVoltar()}
          <div class="cartao"><h3>O que a etapa não faz</h3><p>${esc(D.mapa.nao_faz)}</p></div>
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
  /* 17/11 (relatório F8): o preço pago e quanto vem na compra ficam na mesma tela (P04 + P05 / P20 + P21): o preço diz
     de quê ele é ("Preço de 1 kg", "Preço das 12 unidades"). Quem tinha parado na P05/P21 volta para essa tela. */
  const JUNTA_DE = { "M5.P05": "M5.P04", "M5.P21": "M5.P20" };
  /* Enquanto o dedo está no Continuar, o retorno ao vivo não se mexe: sair do campo (focusout) acontece no mesmo
     toque e um texto novo empurraria o botão para baixo do dedo (o toque se perderia). */
  let segurarVivo = false, soltarT = null;
  document.addEventListener("pointerdown", (e) => { if (e.target.closest && e.target.closest("#acoes-fixas")) { segurarVivo = true; clearTimeout(soltarT); } }, true);
  const soltar = () => { clearTimeout(soltarT); soltarT = setTimeout(() => { segurarVivo = false; }, 600); };
  document.addEventListener("pointerup", soltar, true);
  document.addEventListener("pointercancel", soltar, true);
  /* texto que depende da resposta (regra do grupo): aparece AO VIVO, logo abaixo da resposta (17/11, A) */
  function htmlRetorno(cod, r) {
    if (!r) return "";
    const tipoAlerta = ALERTA_NA_DICA[cod] === r.codigo || ALERTA_INSTRUCAO.includes(r.codigo) ? "fora" : ALERTA_NOTA.includes(r.codigo) ? "nota" : "alerta";
    const partes = [
      vazio(r.texto) ? "" : `<p class="r-texto">${esc(r.texto)}</p>`,
      vazio(r.alerta) || tipoAlerta === "fora" ? "" : tipoAlerta === "nota" ? `<p class="nota" id="nota-retorno">${esc(r.alerta)}</p>` : `<div class="bloco b-alerta"><b>Atenção</b>${esc(r.alerta)}</div>`,
      vazio(r.proximo) || /^ir para/i.test(r.proximo) ? "" : `<div class="bloco b-proximo"><b>Próximo passo</b>${esc(r.proximo)}</div>`,
    ].join("");
    return partes ? `<div class="retorno">${partes}</div>` : "";
  }
  function telaPergunta(cod) {
    if (JUNTA_DE[cod]) { if (S.hist[S.hist.length - 1] === cod) S.hist.pop(); cod = JUNTA_DE[cod]; }
    const q = M.porCodigo[cod];
    if (S.hist[S.hist.length - 1] !== cod) { S.hist.push(cod); salvar(); }
    const junta = Motor.JUNTAS[cod] ? M.porCodigo[Motor.JUNTAS[cod]] : null;   // P05/P21, respondida nesta mesma tela
    const tipo = junta ? "compra-item" : Motor.campo(q);
    const resp = S.R[cod] || null;
    const alt = Motor.botoesAlternativos(M, q);
    const ajudaNS = Motor.ajudaNaoSei(M, q);
    const comBotaoNS = !!(ajudaNS && q.botaoNaoSei);   // 16/11: "Não sei" só onde a resposta é um fato a descobrir
    const comEstimar = !comBotaoNS && Motor.COMO_ESTIMAR.includes(cod) && !!(q.comoDescobrir && q.comoDescobrir.length);   // 17/11
    const inicial = cod === "M5.P01" || cod === PRIMEIRA;
    const cartoesTipo = cod === "M5.P01";
    /* pergunta 1 da Etapa 1: traz a resposta de lá quando ainda não respondeu aqui */
    let veioM1 = false;
    if (cod === PRIMEIRA && !resp) {
      const r1 = doM1("M1.P01");
      if (r1 && r1.estado === "opcao" && q.opcoesLista.includes(r1.opcao)) { veioM1 = r1.opcao; }
    }
    /* nome do item: sugere o que a pessoa escreveu na Etapa 1 ("O que você vende ou quer vender?") */
    let nomeM1 = null;
    if (!resp && infoTipo() && cod === infoTipo().nome) {
      const r3 = doM1("M1.P03");
      if (r3 && r3.estado === "valor" && !vazio(r3.valor)) nomeM1 = String(r3.valor);
    }
    /* entrega: na Etapa 4 só "Retirada presencial pelo cliente" -> já vem marcado "o cliente busca" (com selo) */
    let entregaM4 = null;
    if (!resp && cod === Motor.P_ENTREGA) {
      const r4 = doM4("M4.P04");
      const ops = r4 ? (Array.isArray(r4.opcoes) ? r4.opcoes : r4.opcao ? [r4.opcao] : []) : [];
      if (ops.length === 1 && /^retirada presencial/i.test(ops[0])) entregaM4 = { estado: "opcao", opcao: Motor.ENT_NAO };
    }
    /* materiais do produto: sugere a lista que a pessoa escreveu na Etapa 4 ("Quais materiais ou ingredientes…") */
    let listaM4 = null;
    if (!resp && cod === "M5.P03") {
      const r4 = doM4("M4.P03");
      if (r4 && r4.estado === "valor" && !vazio(r4.valor)) {
        const itens = String(r4.valor).split(/\s*(?:[,;\n]|\be\b)\s*/).map((x) => x.trim().replace(/\.$/, "")).filter(Boolean);
        if (itens.length) listaM4 = itens.map((x) => x.charAt(0).toUpperCase() + x.slice(1));
      }
    }
    const n = etapa(cod);
    const t = infoTipo();
    const seloHerdado = (inicial || (t && cod === t.nome)) && resp && resp.herdado;
    const comSelo = seloHerdado ? Number(String(resp.herdado).replace("M", "")) || 1 : (veioM1 || nomeM1) ? 1 : false;
    /* versão leve: o aviso "Veio da Etapa 1" entra no cartão "Seu negócio" quando ele aparece (um aviso só) */
    /* 1ª tela depois das puladas também mostra o cartão (com "Trocar" de cada resposta que veio de outra etapa) */
    const primeiraTela = S.hist.length === 1 && !inicial;
    const neg = (inicial || (t && cod === t.nome) || primeiraTela) ? cartaoNegocio(cod, comSelo) : "";

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
            ${verDica(q, (cartoesTipo ? `<p class="nota-info">Trabalha com mais de um tipo? Comece por um deles.</p>` : tipo === "taxas-formas" ? `<p class="nota-info">Prazo: em quantos dias o dinheiro cai na conta (deixe vazio se cai na hora). Com mais de uma forma, as partes das vendas precisam somar 100%.</p>` : junta ? `<p class="nota-info">Escreva quanto vem quando você compra (ex.: 1 kg, 12 unidades) e o preço que paga por essa quantidade.</p>` : "") + (comBotaoNS ? "" : termos(ajudaNS)))}
            ${comBotaoNS ? "" : blocoVideo(q.video)}
            ${comSelo && !neg ? selo(comSelo) : ""}
            ${listaM4 || entregaM4 ? selo(4) : ""}
            ${cod === Motor.P_SAZONAL ? `<p class="ex-visivel" id="sz-exemplo">${esc(Motor.SZ_EXEMPLO)}</p>` : ""}
            ${cod === Motor.P_ENTREGA ? `<p class="ex-visivel" id="ent-exemplo">${esc(Motor.ENT_EXEMPLO)}</p>` : ""}
            <div class="entrada" id="ent"></div>
            ${cod === Motor.P_SAZONAL ? painelSazonal(resp) : ""}
            ${cod === Motor.P_ENTREGA ? painelEntrega(resp || entregaM4) : ""}
            ${alt.length ? `<div class="alt" id="alt"></div>` : ""}
            ${comBotaoNS ? `<div class="alt"><button class="btn-ajuda" id="naosei" aria-expanded="false" aria-controls="painel"><span aria-hidden="true">?</span> Não sei</button></div>${painelNaoSei(q, ajudaNS)}` : ""}
            ${comEstimar ? `<div class="alt"><button class="btn-ajuda" id="estimar" type="button" aria-expanded="false" aria-controls="painel"><span aria-hidden="true">?</span> Como estimar</button></div>${painelEstimar(q)}` : ""}
            <div id="retorno" class="retorno-vivo" aria-live="polite"></div>
            <div class="acoes-fixas" id="acoes-fixas">
              <div class="erro" id="erro" role="alert" hidden></div>
              <div class="acoes" id="acoes"><button class="btn btn-primario seta" id="ok">Continuar</button></div>
            </div>
          </div>
          ${rodape()}
        </main>
      </div>`);
    ligar(p);
    ligarCopiar(p);
    ligarCalcPreco(p);
    ligarSazonal(p);

    p.querySelector("#v").onclick = () => {
      S.hist.pop();
      const ant = S.hist.pop();
      salvar();
      if (ant) abrir(ant); else ir(telaCapa);
    };

    const bNS = p.querySelector("#naosei") || p.querySelector("#estimar");
    let abriuAjuda = false;         // tocou em "Não sei": a mensagem de campo vazio aponta para a ajuda
    if (bNS) bNS.onclick = () => {
      const painel = p.querySelector("#painel");
      painel.hidden = !painel.hidden;
      if (!painel.hidden) abriuAjuda = true;
      bNS.setAttribute("aria-expanded", String(!painel.hidden));
      if (!painel.hidden) painel.scrollIntoView({ behavior: "smooth", block: "nearest" });
    };
    const ent = p.querySelector("#ent");
    const boxRet = p.querySelector("#retorno");
    /* retorno ao vivo: escolha -> no toque; campo -> ao sair do campo ou ~700 ms depois de parar de digitar */
    const aoVivo = (r0) => { boxRet.innerHTML = htmlRetorno(cod, r0 ? Motor.regra(M, q, r0) : null); };
    let ler = () => null;           // devolve o valor digitado
    let escolhida = resp && resp.estado === "opcao" ? resp.opcao : veioM1 || (entregaM4 && entregaM4.opcao) || null;

    if (tipo === "escolha") {
      ent.classList.add("opcoes");
      if (cartoesTipo) ent.classList.add("opcoes-tipo");
      q.opcoesLista.forEach((op) => {
        const [tit, desc0] = op.includes(":") ? [op.split(":")[0], op.slice(op.indexOf(":") + 1)] : [op, ""];
        const desc = cartoesTipo && DESC_TIPO[tit.trim()] || desc0;   // texto curto na tela; o valor salvo continua o da planilha
        const b = el(`<button class="opcao ${escolhida === op ? "sel" : ""}" aria-pressed="${escolhida === op}"><span class="radio" aria-hidden="true"></span><span class="op-txt"><b>${esc(tit.trim())}</b>${desc ? `<span class="op-desc">${esc(desc.trim())}</span>` : ""}</span></button>`);
        b.onclick = () => {
          escolhida = op;
          ent.querySelectorAll(".opcao").forEach((x) => { x.classList.remove("sel"); x.setAttribute("aria-pressed", "false"); });
          b.classList.add("sel"); b.setAttribute("aria-pressed", "true");
          const sz = p.querySelector("#sz-meses"); if (sz) sz.hidden = op !== Motor.SZ_SIM;
          mostrarEntrega(p, op);
          aoVivo({ estado: "opcao", opcao: op });
        };
        ent.appendChild(b);
      });
      ler = () => null;
      if (escolhida) aoVivo({ estado: "opcao", opcao: escolhida });
    } else if (junta) {
      ler = montarEntrada(ent, q, tipo, { precos: resp && resp.estado === "valor" ? resp.valor : null, comp: S.R[junta.codigo] && S.R[junta.codigo].estado === "valor" ? S.R[junta.codigo].valor : null });
    } else {
      ler = montarEntrada(ent, q, tipo, resp && resp.estado === "valor" ? resp.valor : nomeM1 || listaM4);
      let vivoT = null;
      const vivoCampo = () => { const v = ler(); aoVivo(Motor.validar(M, q, v, S.R) ? null : { estado: "valor", valor: v }); };
      ent.addEventListener("input", () => { clearTimeout(vivoT); vivoT = setTimeout(vivoCampo, 700); });
      ent.addEventListener("focusout", () => { clearTimeout(vivoT); if (!segurarVivo) vivoCampo(); });
      if (tipo === "multipla") ent.addEventListener("click", () => { clearTimeout(vivoT); vivoT = setTimeout(vivoCampo, 0); });
      if (resp && resp.estado === "valor") vivoCampo();
    }

    const altBox = p.querySelector("#alt");
    alt.forEach((op) => {
      const b = el(`<button class="btn-alt">${esc(op)}</button>`);
      b.onclick = () => responder(op === "Não sei" ? { estado: "naosei" } : { estado: "opcao", opcao: op });
      altBox.appendChild(b);
    });

    ent.addEventListener("input", () => { p.querySelector("#erro").hidden = true; });
    p.querySelectorAll(".sz-meses, .ent-campos").forEach((b) => b.addEventListener("input", () => { p.querySelector("#erro").hidden = true; }));
    ent.addEventListener("click", (e) => { if (e.target.closest(".opcao")) p.querySelector("#erro").hidden = true; });
    ent.addEventListener("change", () => { p.querySelector("#erro").hidden = true; });
    let avisoVisto = null;          // aviso de quantidade alta / valor alto: mostra uma vez; o 2º Continuar segue
    ent.addEventListener("input", () => { avisoVisto = null; });
    ent.addEventListener("change", () => { avisoVisto = null; });
    p.querySelector("#ok").onclick = () => {
      if (tipo === "escolha") {
        if (!escolhida) return mostrarErro(Motor.msgFalta(q, abriuAjuda));
        if (cod === Motor.P_ENTREGA) {
          const r0 = lerEntrega(p, escolhida);
          const e = Motor.validarEntrega(r0);
          return e ? mostrarErro(e) : responder(r0);
        }
        if (cod === Motor.P_SAZONAL) {
          const r0 = lerSazonal(p, escolhida);
          const e = Motor.validarSazonal(r0);
          return e ? mostrarErro(e) : responder(r0);
        }
        return responder({ estado: "opcao", opcao: escolhida });
      }
      if (junta) {
        const v = ler();
        const es = [Motor.validar(M, junta, v.comp, S.R), Motor.validar(M, q, v.precos, S.R)].filter(Boolean);
        const e = es.find((x) => x === Motor.MSG_NUMERO) || es[0];
        if (e) return mostrarErro(e === Motor.MSG_RESPONDA ? Motor.msgFalta(q, abriuAjuda) : e);
        S.R[junta.codigo] = { estado: "valor", valor: v.comp };
        return responder({ estado: "valor", valor: v.precos });
      }
      const v = ler();
      const erro = Motor.validar(M, q, v, S.R);
      if (erro) return mostrarErro(erro === Motor.MSG_RESPONDA ? Motor.msgFalta(q, abriuAjuda) : erro);
      const aviso = Motor.avisoQuantidade(M, q, v, S.R) || Motor.avisoValor(M, q, v, S.R);
      const chaveAviso = JSON.stringify(v);
      if (aviso && avisoVisto !== chaveAviso) {
        avisoVisto = chaveAviso;
        return mostrarErro(aviso + " Se estiver certo, toque em Continuar de novo.", true, cod === "M5.P36" ? comoAvisoPreco(Motor.num(v)) : "");
      }
      responder({ estado: "valor", valor: v });
    };

    function mostrarErro(txt, aviso, como) {
      const e = p.querySelector("#erro");
      e.textContent = txt; e.hidden = false;
      if (como) e.insertAdjacentHTML("beforeend", como);
      e.classList.toggle("aviso-qtd", !!aviso);
    }

    /* Continuar grava e já abre a próxima pergunta, num toque só (17/11, A) */
    function responder(r0) {
      p.querySelector("#erro").hidden = true;
      delete S.ajusteOrig;          // respondeu de novo nas perguntas: o "Limpar" do resultado passa a valer a partir daqui
      if (resp && resp.herdado && ((r0.estado === "opcao" && r0.opcao === resp.opcao) || (r0.estado === "valor" && JSON.stringify(r0.valor) === JSON.stringify(resp.valor)))) r0 = Object.assign({}, r0, { herdado: resp.herdado });
      S.R[cod] = r0;
      const r = Motor.regra(M, q, r0);
      let prox = pularHerdadas(Motor.proxima(M, q, r0, r));
      /* horas no mês para dar valor à hora: só se a Etapa 1 não disse e a pessoa separa dinheiro para ela */
      if (cod === "M5.P35" && Motor.precisaHoras(M, S.R, horasM1())) prox = Motor.P_HORAS;
      salvar();
      if (prox === cod) { boxRet.innerHTML = htmlRetorno(cod, r); return; }   // a regra pede para ficar: o texto diz o que falta
      if (prox === "RESULTADO" || prox === Motor.PRECO) { S.hist.push(prox); salvar(); }
      abrir(prox);
    }
    return p;
  }

  /* ----- sazonalidade: meses fortes/fracos (um mês não pode estar nos dois) e quanto vende a mais/a menos ----- */
  function painelSazonal(resp) {
    const r = resp && resp.opcao === Motor.SZ_SIM ? resp : {};
    const chips = (tipo, sel, outro) => Motor.MESES.map((nm, i) => { const n = i + 1; return `<button type="button" class="mes ${sel.includes(n) ? "sel" : ""}" data-${tipo}="${n}" aria-pressed="${sel.includes(n)}"${outro.includes(n) ? " disabled" : ""}>${nm}</button>`; }).join("");
    const fo = r.fortes || [], fr = r.fracos || [];
    return `<div class="sz-meses" id="sz-meses"${resp && resp.opcao === Motor.SZ_SIM ? "" : " hidden"}>
      <p class="sz-rot"><b>Meses mais fortes</b></p><div class="meses" id="sz-fortes">${chips("forte", fo, fr)}</div>
      <label class="item"><span>Num mês forte, quanto você vende a mais? (%)</span><div class="linha"><input class="campo" id="sz-mais" inputmode="numeric" placeholder="Ex.: 50 = metade a mais" value="${r.maisPct ?? ""}"><span class="pre">%</span></div></label>
      <p class="sz-rot"><b>Meses mais fracos</b></p><div class="meses" id="sz-fracos">${chips("fraco", fr, fo)}</div>
      <label class="item"><span>Num mês fraco, quanto a menos? (%)</span><div class="linha"><input class="campo" id="sz-menos" inputmode="numeric" placeholder="Ex.: 30" value="${r.menosPct ?? ""}"><span class="pre">%</span></div></label>
    </div>`;
  }
  function ligarSazonal(p) {
    const box = p.querySelector("#sz-meses");
    if (!box) return;
    box.addEventListener("click", (e) => {
      const b = e.target.closest(".mes");
      if (!b || b.disabled) return;
      const on = !b.classList.contains("sel");
      b.classList.toggle("sel", on); b.setAttribute("aria-pressed", String(on));
      const n = b.dataset.forte || b.dataset.fraco, outro = b.dataset.forte ? "fraco" : "forte";
      const par = box.querySelector(`[data-${outro}="${n}"]`);
      if (par) par.disabled = on;                       // o mesmo mês não pode ser forte e fraco
      p.querySelector("#erro").hidden = true;
    });
  }
  function lerSazonal(p, opcao) {
    if (opcao !== Motor.SZ_SIM) return { estado: "opcao", opcao };
    const meses = (sel) => [...p.querySelectorAll(sel + " .mes.sel")].map((b) => Number(b.dataset.forte || b.dataset.fraco));
    const int = (id) => { const v = p.querySelector(id).value.trim(); return /^\d+$/.test(v) ? Number(v) : v === "" ? null : NaN; };
    const fortes = meses("#sz-fortes"), fracos = meses("#sz-fracos");
    return { estado: "opcao", opcao, fortes, fracos, maisPct: fortes.length ? int("#sz-mais") : 0, menosPct: fracos.length ? int("#sz-menos") : 0 };
  }
  /* ----- entrega: quanto custa cada entrega (R$ ou % do pedido) e de cada 10 vendas quantas têm entrega ----- */
  function painelEntrega(resp) {
    const r = resp || {};
    const v = (n) => (n === null || n === undefined ? "" : String(n).replace(".", ","));
    const pct = r.tipoCusto === "pct";
    return `<div class="ent-campos" id="ent-preco"${r.opcao === Motor.ENT_PRECO ? "" : " hidden"}>
      <label class="item"><span>Quanto custa cada entrega para você?</span><div class="linha">
        <input class="campo" id="ent-custo" inputmode="decimal" placeholder="${pct ? "Ex.: 20" : "Ex.: 8,00"}" value="${esc(v(r.custo))}">
        <select class="unid" id="ent-tipo" aria-label="Em reais ou % do pedido"><option value="reais"${pct ? "" : " selected"}>R$</option><option value="pct"${pct ? " selected" : ""}>% do pedido</option></select></div></label>
      <p class="nota">Ex.: motoboy R$ 8,00; aplicativo que cobra 20% do pedido.</p>
      <label class="item"><span>De cada 10 vendas, quantas têm entrega?</span><div class="linha"><input class="campo" id="ent-10" inputmode="numeric" placeholder="Ex.: 6" value="${esc(v(r.aCada10))}"><span class="pre">de 10</span></div></label>
    </div>
    <div class="ent-campos" id="ent-cobra"${r.opcao === Motor.ENT_COBRA ? "" : " hidden"}>
      <label class="item"><span>Quanto você cobra pela entrega? (R$)</span><div class="linha"><span class="pre">R$</span><input class="campo" id="ent-cobra-v" inputmode="decimal" placeholder="Ex.: 5,00" value="${esc(v(r.cobra))}"></div></label>
      <p class="nota">Esse valor é do cliente: não entra no seu custo.</p>
    </div>`;
  }
  function mostrarEntrega(p, op) {
    const a = p.querySelector("#ent-preco"), b = p.querySelector("#ent-cobra");
    if (a) a.hidden = op !== Motor.ENT_PRECO;
    if (b) b.hidden = op !== Motor.ENT_COBRA;
  }
  function lerEntrega(p, opcao) {
    const r = { estado: "opcao", opcao, custo: null, tipoCusto: null, aCada10: null, cobra: null };
    const n = (id) => { const s = p.querySelector(id).value.trim(); return s === "" ? null : Motor.num(s) === null ? NaN : Motor.num(s); };
    if (opcao === Motor.ENT_PRECO) {
      r.custo = n("#ent-custo"); r.tipoCusto = p.querySelector("#ent-tipo").value;
      const a10 = p.querySelector("#ent-10").value.trim(); r.aCada10 = /^\d+$/.test(a10) ? Number(a10) : a10 === "" ? null : NaN;
    }
    if (opcao === Motor.ENT_COBRA) r.cobra = n("#ent-cobra-v");
    return r;
  }
  /* resultado: mês normal, forte e fraco */
  function blocoSazonal(c) {
    const s = Motor.sazonal(c, S.R);
    if (!s) return "";
    const nomes = (l) => l.map((n) => Motor.MESES[n - 1]).join(", ");
    const un = c.tipo === "Serviço" ? "atendimentos" : "vendas";
    const linha = (rot, x, como) => x ? `<tr><td>${rot}</td><td>${qtdTxt(x.qtd)} ${un}</td><td>${brl(x.fat)}</td><td>${brl(x.resultado)}</td></tr>` : "";
    const como = (x) => `${brl(c.preco)} × ${qtdTxt(x.qtd)} = ${brl(x.fat)}; ${brl(x.fat)} − ${brl(c.custoTaxa)} × ${qtdTxt(x.qtd)} (${brl(x.custo)}) − ${brl(c.mensal)} = ${brl(x.resultado)}`;
    const arred = (q, pctTxt, sinal) => { const ex = c.qtd * (1 + sinal * pctTxt / 100); return `${qtdTxt(c.qtd)} × (1 ${sinal > 0 ? "+" : "−"} ${pctTxt}%) = ${qtdTxt(ex)}${Number.isInteger(Math.round(ex * 1000) / 1000) ? "" : `, arredondado para ${q}`}`; };
    const linhasComo = [];
    if (s.forte) linhasComo.push(`mês forte: ${arred(s.forte.qtd, s.maisPct, 1)} ${un}; ${como(s.forte)}`);
    if (s.fraco) linhasComo.push(`mês fraco: ${arred(s.fraco.qtd, s.menosPct, -1)} ${un}; ${como(s.fraco)}`);
    return `<section class="sazonal" id="sazonal"><h3>Meses fortes e fracos</h3>
      <table class="comp sz-tab"><tr><th></th><th>Vendas</th><th>Faturamento</th><th>Resultado</th></tr>
        ${linha("Mês normal", s.normal)}${linha(`Mês forte (${nomes(s.fortes)})`, s.forte)}${linha(`Mês fraco (${nomes(s.fracos)})`, s.fraco)}</table>
      ${comoCalc(linhasComo.join("; ") + ".", "como-sazonal")}
      ${s.fraco && c.pe !== null && c.mensal > 0 ? (s.fracoAbaixo
        ? `<div class="bloco b-alerta" id="sz-fraco-abaixo"><b>Atenção</b><p>Num mês fraco você vende ${qtdTxt(s.fraco.qtd)} ${un}, menos que as ${c.pe} que cobrem os gastos do mês. Guarde parte da sobra dos meses fortes para esses meses.</p>${comoCalc(`${qtdTxt(s.fraco.qtd)} ${un} no mês fraco < ${c.pe} (vendas para cobrir o mês).`, "como-sz-pe")}</div>`
        : `<p class="nota" id="sz-fraco-ok">Mesmo num mês fraco (${qtdTxt(s.fraco.qtd)} ${un}) você passa das ${c.pe} vendas que cobrem os gastos do mês.</p>${comoCalc(`${qtdTxt(s.fraco.qtd)} ≥ ${c.pe}.`, "como-sz-pe")}`) : ""}
    </section>`;
  }
  /* ----- campos ----- */
  const UNIDADES = ["kg", "g", "L", "ml", "unidade", "outro"];
  /* 17/11 (relatório F8): a unidade não vem marcada ("unidade" para tudo enganava: carne, gás); a pessoa escolhe */
  function selUnid(v, nome) {
    return `<select class="unid" aria-label="Unidade${nome ? " de " + esc(nome) : ""}"><option value=""${v ? "" : " selected"}>Escolha</option>${UNIDADES.map((u) => `<option ${u === v ? "selected" : ""}>${u}</option>`).join("")}</select>`;
  }
  /* exemplo do campo de quantidade conforme a unidade (sem unidade, sem exemplo) */
  const PH_COMPRA = { kg: "Ex.: 1", g: "Ex.: 500", L: "Ex.: 2", ml: "Ex.: 900", unidade: "Ex.: 12" };
  const PH_USO = { kg: "Ex.: 0,5", g: "Ex.: 300", L: "Ex.: 0,2", ml: "Ex.: 100", unidade: "Ex.: 2" };
  const phUn = (tab, u) => (tab[u] ? ` placeholder="${tab[u]}"` : "");
  const UN_ROT = { kg: "kg", g: "g", l: "L", ml: "ml" };
  /* de quê é o preço: "Preço de 1 kg", "Preço de 500 g", "Preço das 12 unidades" */
  function rotPreco(qt, u) {
    const n = Motor.num(qt), un = String(u || "").toLowerCase();
    if (!un || un === "outro" || n === null || !(n > 0)) return "Preço que você paga";
    if (un === "unidade") return n === 1 ? "Preço de 1 unidade" : `Preço das ${qtdTxt(n)} unidades`;
    return `Preço de ${qtdTxt(n)} ${UN_ROT[un]}`;
  }
  /* retorno ao vivo de cada item: quanto sai o kg, o litro ou a unidade (com a conta) */
  function porUnidade(pr, qt, u) {
    const p = Motor.num(pr), n = Motor.num(qt), un = String(u || "").toLowerCase();
    if (p === null || p < 0 || !(n > 0) || !["kg", "g", "l", "ml", "unidade"].includes(un)) return "";
    if (n === 1 && ["kg", "l", "unidade"].includes(un)) return "";
    const div = un === "g" || un === "ml" ? n / 1000 : n;
    const rot = un === "g" || un === "kg" ? "o kg" : un === "ml" || un === "l" ? "o litro" : "cada unidade";
    const v = Math.round((p / div) * 100) / 100;
    const conv = un === "g" ? ` (${qtdTxt(div)} kg)` : un === "ml" ? ` (${qtdTxt(div)} L)` : "";
    return `<p class="por-un">Sai a <b>${brl(v)}</b> ${rot}.</p>${comoCalc(`${brl(p)} ÷ ${qtdTxt(n)} ${un === "unidade" ? "unidades" : UN_ROT[un]}${conv} = ${brl(v)} ${rot}.`)}`;
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
      /* quanto usa: a unidade começa igual à da compra do mesmo item (resposta da própria pessoa), nunca "unidade" para tudo */
      const daCompra = { "M5.P06": "M5.P05", "M5.P22": "M5.P21" }[q.codigo];
      const comp = daCompra && S.R[daCompra] && Array.isArray(S.R[daCompra].valor) ? S.R[daCompra].valor : [];
      const tab = daCompra ? PH_USO : PH_COMPRA;
      itens.forEach((nome, i) => {
        const v = val && val[i] || {}, c = comp[i] || {};
        const u = v.u || c.u || "";
        const ref = !vazio(c.q) && c.u ? ` <small class="compra-ref">(compra: ${esc(c.q)} ${esc(c.u)})</small>` : "";
        ent.appendChild(el(`<label class="item"><span>${esc(nome)}${ref}</span><div class="linha"><input class="campo" inputmode="decimal" aria-label="${esc(nome)}"${phUn(tab, u)} value="${esc(v.q ?? "")}">${selUnid(u, nome)}</div></label>`));
      });
      ent.addEventListener("change", (e) => { const s = e.target.closest("select"); if (s) { const inp = s.parentNode.querySelector("input"); inp.placeholder = (tab[s.value] || "").replace(/^ placeholder="|"$/g, ""); } });
      return () => [...ent.querySelectorAll(".item")].map((it) => ({ q: it.querySelector("input").value, u: it.querySelector("select").value }));
    }
    /* preço + quanto vem na compra, por item, na mesma tela (P04+P05 / P20+P21): o rótulo do preço muda com a unidade */
    if (tipo === "compra-item") {
      const pr = (val && val.precos) || [], co = (val && val.comp) || [];
      itens.forEach((nome, i) => {
        const c = co[i] || {};
        ent.appendChild(el(`<fieldset class="compra forma" data-i="${i}"><legend id="leg-${i}">${esc(nome)}</legend>
          <label class="item"><span>Quanto vem na compra</span><div class="linha"><input class="campo cq" inputmode="decimal" aria-label="Quanto vem na compra de ${esc(nome)}"${phUn(PH_COMPRA, c.u)} value="${esc(c.q ?? "")}">${selUnid(c.u || "", nome)}</div></label>
          <label class="item"><span class="rot-preco" id="rp-${i}">${esc(rotPreco(c.q, c.u))}</span><div class="linha"><span class="pre">R$</span><input class="campo cp" inputmode="decimal" aria-labelledby="rp-${i} leg-${i}" value="${esc(pr[i] ?? "")}"></div></label>
          <div class="por-un-box retorno-vivo" aria-live="polite">${porUnidade(pr[i], c.q, c.u)}</div>
        </fieldset>`));
      });
      const partes = (fs) => ({ q: fs.querySelector(".cq"), u: fs.querySelector("select"), p: fs.querySelector(".cp") });
      const rotular = (fs) => { const x = partes(fs); fs.querySelector(".rot-preco").textContent = rotPreco(x.q.value, x.u.value); x.q.placeholder = PH_COMPRA[x.u.value] || ""; };
      const vivo = (fs) => { const x = partes(fs); fs.querySelector(".por-un-box").innerHTML = porUnidade(x.p.value, x.q.value, x.u.value); };
      let tv = null;
      ent.addEventListener("input", (e) => { const fs = e.target.closest(".compra"); if (!fs) return; rotular(fs); clearTimeout(tv); tv = setTimeout(() => vivo(fs), 700); });
      ent.addEventListener("change", (e) => { const fs = e.target.closest(".compra"); if (fs) { rotular(fs); vivo(fs); } });
      ent.addEventListener("focusout", (e) => { const fs = e.target.closest(".compra"); if (fs && !segurarVivo) { clearTimeout(tv); vivo(fs); } });
      const fss = () => [...ent.querySelectorAll(".compra")];
      return () => ({ precos: fss().map((fs) => partes(fs).p.value), comp: fss().map((fs) => ({ q: partes(fs).q.value, u: partes(fs).u.value })) });
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
    const conta = (html) => html;   // 16/11: a conta aparece logo abaixo do número, no mesmo momento (nada recolhido)
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
      ${conta(comoSobra(a.preco, a.custo, a.taxa, a.sobra, a.margem, "como-sobra", a.taxaPct, a.entrega))}`}
      ${a.precoMinimo !== null ? `<p class="nota" id="preco-minimo">Para cobrir o custo, as taxas e a parte dos gastos do mês em cada venda, o preço precisa ser de pelo menos <b>${brl(a.precoMinimo)}</b>.</p>
        ${conta(comoCalc((() => { const fixo = `${brl(a.custo)} de custo${a.entregaFixo ? ` + ${brl(a.entregaFixo)} de entrega` : ""} + ${brl(a.parcela)} dos gastos do mês em cada venda`; const p = a.taxaPct + (a.entregaPct || 0); return p ? `(${fixo}) ÷ ${pctT(100 - p)} (o que fica depois de ${pctT(p)} de ${a.entregaPct ? "taxas e entrega" : "taxa"}) = ${brl(a.precoMinimo)}, arredondado para cima.` : `${fixo} = ${brl(a.precoMinimo)}.`; })(), "como-minimo"))}` : ""}
      ${a.faixa ? `<p class="nota" id="faixa-m3">Faixa de preço que você informou na Etapa 3: ${brl(a.faixa.min)}${a.faixa.max !== a.faixa.min ? ` a ${brl(a.faixa.max)}` : ""}.</p>` : ""}
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
    return `<details class="dica-toggle" id="poucas-vendas"><summary>Por que vender pouco pesa no preço?</summary><div class="dica-corpo"><p>${esc(Motor.POUCAS_VENDAS)}</p>
      ${parcela ? `<p>Gastos do mês em cada venda: <b>${brl(c.parcelaMensal)}</b></p>${comoCalc(`${brl(c.mensal)} de gastos do mês ÷ ${qtdTxt(c.qtd)} vendas = ${brl(c.parcelaMensal)} por venda.`, "como-parcela")}` : ""}</div></details>`;
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
            <div id="analise" aria-live="polite">${blocoAnalise(a, false)}</div>
            ${blocoMargem()}
            <div class="acoes-fixas" id="acoes-fixas">
              <div class="erro" id="erro" role="alert" hidden></div>
              <div class="acoes" id="acoes"><button class="btn btn-primario seta" id="res">Ver o resultado</button></div>
            </div>
          </div>
          ${rodape()}
        </main>
      </div>`);
    ligar(p);
    p.querySelector("#v").onclick = () => { S.hist.pop(); const ant = S.hist.pop(); salvar(); abrir(ant); };
    /* sem preço informado (estado antigo): a porcentagem mostra o preço possível ao vivo e "Ver o resultado" grava e
       segue, num toque só (17/11, A) */
    const lucro = p.querySelector("#lucro");
    const lerLucro = () => {
      const v = lucro.value, n = Motor.num(v);
      if (n === null && v.trim()) return Motor.MSG_NUMERO;
      if (n === null || n < 0) return "Informe a porcentagem que você quer acrescentar sobre o custo, por exemplo 30.";
      return null;
    };
    if (lucro) {
      let tl = null;
      const vivo = () => { if (lerLucro()) return; a = Motor.analisarPreco(M, S.R, lucro.value.trim(), faixaM3()); p.querySelector("#analise").innerHTML = blocoAnalise(a, false); };
      lucro.addEventListener("input", () => { p.querySelector("#erro").hidden = true; clearTimeout(tl); tl = setTimeout(vivo, 700); });
      lucro.addEventListener("focusout", () => { clearTimeout(tl); if (!segurarVivo) vivo(); });
    }
    p.querySelector("#res").onclick = () => {
      if (lucro) {
        const e = lerLucro(), erro = p.querySelector("#erro");
        if (e) { erro.textContent = e; erro.hidden = false; return; }
        S.lucro = lucro.value.trim();
      }
      S.hist.push("RESULTADO"); salvar(); ir(telaResultado);
    };
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
      if (S.versao !== VERSAO) { Motor.migrar(S); S.versao = VERSAO; }   // análise guardada na versão antiga
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
        custo.push(L(co[i] ? rotPreco(co[i].q, co[i].u) : "Preço que você paga", pPreco, pr[i], { i, pre: "R$", regra: "nn" }));
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
  /* valor do campo em padrão brasileiro: dinheiro "1.425,06", quantidade "0,5" */
  function campoBR(l) {
    const n = Motor.num(l.v);
    if (n === null) return l.v;
    return l.pre ? brNum(n) : qtdTxt(n);
  }
  /* tabela editável: devolve o HTML e a lista dos campos (na ordem dos inputs #aj-0, #aj-1…) */
  function blocoAjuste() {
    const gs = camposAjuste();
    const specs = [];
    if (!gs.length) return { html: "", specs };
    const linha = (l) => {
      if (l.cab) return `<tr class="aj-cab"><td colspan="2">${esc(l.cab)}</td></tr>`;
      const n = specs.push(l) - 1;
      return `<tr><td><label for="aj-${n}">${esc(l.rot)}${l.suf ? ` <span class="aj-unid">(${esc(l.suf)})</span>` : ""}</label></td><td><div class="linha">${l.pre ? `<span class="pre">${l.pre}</span>` : ""}<input class="campo aj" id="aj-${n}" inputmode="decimal" value="${esc(campoBR(l))}"></div></td></tr>`;
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
      /* só grava o que mudou: valor igual ao respondido continua no formato em que foi respondido */
      specs.forEach((s, n) => { if (String(s.v).trim() !== "" && Motor.num(vals[n]) === Motor.num(s.v)) return; gravarAjuste(s, vals[n]); });
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
  const cent2 = (n) => Math.round(n * 100) / 100;
  /* faturamento e resultado do mês, com os mesmos valores (em centavos) que aparecem na tela */
  function comoMes(preco, qtd, fat, custoTaxa, taxa, custoVendas, mensal, resultado, entrega) {
    return `${brl(preco)} × ${qtdTxt(qtd)} vendas = ${brl(fat)} de faturamento; ${brl(custoTaxa)} de custo${taxa ? " e taxas" : ""}${entrega ? " e entrega" : ""} de cada venda × ${qtdTxt(qtd)} = ${brl(custoVendas)}; ${brl(fat)} − ${brl(custoVendas)} − ${brl(mensal)} de gastos do mês = ${brl(resultado)}.`;
  }
  /* total dos gastos do mês = soma do que a pessoa informou */
  function comoGastos(c) {
    const partes = [[c.aluguel, "aluguel"], [c.aguaLuz, "água e luz"], [c.outros, "outras contas"], [c.perdas, "perdas"], [c.trabalho, "seu trabalho"]].filter(([v]) => v > 0);
    if (!partes.length) return "";
    return comoCalc(partes.length === 1 ? `só ${partes[0][1]}: ${brl(partes[0][0])} por mês.` : `${partes.map(([v, n]) => `${brl(v)} (${n})`).join(" + ")} = ${brl(c.mensal)} por mês.`, "como-gastos");
  }
  /* resumo das contas do "O que entendemos" (os mesmos números do texto) */
  function comoEntendemos(c) {
    if (c.mc === null || c.preco === null || !(c.mc > 0)) return c.custoUnidade > 0 ? comoCusto(c).replace('id="como-custo"', 'id="como-entendemos"') : "";
    let t = `${brl(c.preco)} (preço) − ${brl(c.custoTaxa)} (custo${c.taxa ? " e taxas" : ""}${c.entrega ? " e entrega" : ""}) = ${brl(c.mc)} por venda`;
    if (c.pe !== null && c.mensal > 0) t += `; ${brl(c.mensal)} (gastos do mês) ÷ ${brl(c.mc)} = ${num2r(c.mensal / c.mc)}, para cima: ${c.pe} vendas`;
    if (c.qtd > 0 && c.resultado !== null && c.mensal > 0) t += `; ${qtdTxt(c.qtd)} × ${brl(c.mc)} − ${brl(c.mensal)} = ${brl(c.resultado)}`;
    return comoCalc(t + ".", "como-entendemos");
  }
  const num2r = (n) => n.toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  /* "O que entrou na conta" (pedido do dono, 16/11): cada parte do custo com ✓ (e o valor) ou ⚠ (e o porquê).
     Tom de aviso, não de erro; não trava. A mão de obra traz o valor da hora e quanto paga o seu tempo em cada unidade. */
  /* conta da entrega por venda */
  function comoEntrega(e, preco, valor) {
    if (!e || e.opcao !== Motor.ENT_PRECO || !(e.aCada10 >= 0) || e.custo === null) return "";
    if (e.tipoCusto === "pct") return preco === null ? "" : comoCalc(`entrega: ${pctT(e.custo)} de ${brl(preco)} × ${e.aCada10} de cada 10 vendas = ${brl(valor)} por venda.`, "como-entrega");
    return comoCalc(`entrega: ${brl(e.custo)} × ${e.aCada10} de cada 10 vendas = ${brl(valor)} por venda.`, "como-entrega");
  }
  /* reserva para imprevistos + "Se um dia pagar aluguel de R$ ___" (recalcula ao vivo) */
  function blocoReserva(c) {
    const r = Motor.reserva(c);
    const un = c.tipo === "Serviço" ? "atendimentos" : "vendas";
    const semAluguel = !(c.aluguel > 0) && c.mc > 0;
    if (!r && !semAluguel) return "";
    return `<div class="reserva" id="reserva">
      ${r ? `<p class="res-linha">Reserve por mês: <b id="reserva-valor">${brl(r.valor)}</b> para imprevistos (conserto, equipamento, mudança).</p>
      ${comoCalc(`${r.pct}% de ${brl(c.fat)} (faturamento do mês) = ${brl(r.valor)}.${r.peCom !== null ? ` Com a reserva, os gastos do mês vão a ${brl(c.mensal)} + ${brl(r.valor)} = ${brl(r.mensalCom)}; ÷ ${brl(c.mc)} = ${num2r(r.mensalCom / c.mc)}, para cima: ${r.peCom} ${un}.` : ""}`, "como-reserva")}
      ${r.peCom !== null ? `<p class="nota" id="reserva-pe">${c.mensal > 0 && c.pe !== null ? `Com a reserva, o ponto de equilíbrio sobe para <b>${r.peCom}</b> ${un} por mês (hoje: ${c.pe}).` : `Com a reserva, você precisa de <b>${r.peCom}</b> ${un} por mês para cobri-la.`}</p>` : ""}` : ""}
      ${semAluguel ? `<label class="item" id="sim-aluguel-box"><span>Se um dia pagar aluguel de</span><div class="linha"><span class="pre">R$</span><input class="campo" id="sim-aluguel" inputmode="decimal" placeholder="Ex.: 400,00"></div></label>
      <div id="sim-aluguel-res" aria-live="polite"></div>` : ""}
    </div>`;
  }
  function ligarSimAluguel(p, c) {
    const inp = p.querySelector("#sim-aluguel");
    if (!inp) return;
    const out = p.querySelector("#sim-aluguel-res");
    const un = c.tipo === "Serviço" ? "atendimentos" : "vendas";
    inp.addEventListener("input", () => {
      const r = Motor.peComGasto(c, inp.value);
      if (!inp.value.trim()) { out.innerHTML = ""; return; }
      if (!r) { out.innerHTML = `<p class="nota">${esc(Motor.MSG_NUMERO)}</p>`; return; }
      out.innerHTML = `<p class="res-linha" id="sim-aluguel-pe">Com esse aluguel, você precisaria de <b>${r.pe}</b> ${un} por mês.</p>
        ${comoCalc(`${brl(c.mensal)} + ${brl(r.extra)} (aluguel) = ${brl(r.mensal)} de gastos do mês ÷ ${brl(c.mc)} = ${num2r(r.mensal / c.mc)}, para cima: ${r.pe} ${un}.`, "como-sim-aluguel")}`;
    });
  }
  function blocoEntrou(c) {
    if (!c.tipo) return "";
    const L = Motor.componentes(c, S.R);
    const porMes = { perdas: 1, aluguel: 1, agua_luz: 1, outros: 1, mao_de_obra: 1 };
    const cada = c.tipo === "Serviço" ? "atendimento" : "unidade";
    const faltam = L.filter((x) => !x.considerado && !x.naoSeAplica);
    const mo = L.find((x) => x.chave === "mao_de_obra");
    const destaque = [];
    if (mo && !mo.considerado) destaque.push(`<p class="entrou-alerta" id="alerta-mao-de-obra"><b>Mão de obra não foi considerada:</b> o preço pode estar baixo. Seu tempo também tem valor; você pode informar quanto quer ganhar por mês em “Ajustar valores e recalcular”.</p>`);
    const al = L.find((x) => x.chave === "aluguel");
    if (al && !al.considerado) destaque.push(`<p class="entrou-alerta" id="alerta-aluguel"><b>Aluguel não foi considerado.</b> Se usa um espaço, mesmo em casa, a parte que o negócio usa pode entrar.</p>${S.R["M5.P28"] && /^Não/.test(S.R["M5.P28"].opcao || "") ? `<p class="dica-tip" id="dica-aluguel-topo"><b>Dica:</b> ${esc(Motor.DICA_SEM_GASTO["M5.P28"])}</p>` : ""}`);
    /* dica de quem respondeu "Não" (fique de olho e reserve um valor) ao lado do ⚠ */
    const dicaNao = (cod, chave) => { const r = S.R[cod]; const x = L.find((y) => y.chave === chave); return r && r.estado === "opcao" && /^Não/.test(r.opcao) && x && !x.considerado ? `<p class="dica-tip" id="dica-${chave}"><b>Dica:</b> ${esc(Motor.DICA_SEM_GASTO[cod])}</p>` : ""; };
    const dicas = { aluguel: dicaNao("M5.P28", "aluguel"), agua_luz: dicaNao("M5.P30", "agua_luz"), outros: dicaNao("M5.P32", "outros") };
    let mao = "";
    if (c.pagaSe && c.valorHora !== null) {
      const tempoTxt = c.tempoUnidade >= 60 ? `${Math.floor(c.tempoUnidade / 60)}h${String(Math.round(c.tempoUnidade % 60)).padStart(2, "0")}` : `${Math.round(c.tempoUnidade || 0)} min`;
      mao = `<p class="entrou-mao" id="mao-de-obra">Seu tempo vale <b>${brl(c.valorHora)} por hora</b>${c.maoDeObraUnidade !== null ? `; em cada ${cada}, <b>${brl(c.maoDeObraUnidade)}</b>` : ""}. Esse valor já está nos gastos do mês (seu pagamento).</p>
        ${comoCalc(`${brl(c.trabalho)} (seu pagamento) ÷ ${qtdTxt(c.horasMes)} horas por mês = ${brl(c.valorHora)} por hora${c.maoDeObraUnidade !== null ? `; ${brl(c.valorHora)} × ${tempoTxt} = ${brl(c.maoDeObraUnidade)} por ${cada}` : ""}.`, "como-mao-de-obra")}`;
    }
    return `<section class="entrou" id="entrou"><h3>O que entrou na conta</h3>
      ${destaque.join("")}
      <ul>${L.map((x) => `<li class="${x.considerado ? "ok" : x.naoSeAplica ? "na" : "falta"}" data-chave="${x.chave}"><span class="ico" aria-hidden="true">${x.considerado ? "✓" : x.naoSeAplica ? "–" : "⚠"}</span> <span><b>${esc(x.nome)}</b>: ${x.considerado ? `considerado, ${brl(x.valor)}${porMes[x.chave] ? " por mês" : ` por ${x.chave === "taxas" || x.chave === "entrega" ? "venda" : cada}`}` : x.naoSeAplica ? `não se aplica (${esc(x.porque)})` : `não considerado (${esc(x.porque)})`}${x.chave !== "aluguel" ? dicas[x.chave] || "" : ""}</span></li>`).join("")}</ul>
      ${comoEntrega(c.entregaInfo, c.preco, c.entrega)}
      ${mao}
      ${blocoReserva(c)}
      ${faltam.length ? `<p class="nota">Itens com ⚠ não entraram nas contas. Se eles existem no seu negócio, o custo real é maior.</p>` : ""}
    </section>`;
  }
  function telaResultado() {
    const aPreco = Motor.analisarPreco(M, S.R, S.lucro, faixaM3());
    const okSug = aPreco && aPreco.modo === "sugerido" && !aPreco.semCusto && !aPreco.pendente;
    const c = Motor.calcular(M, S.R, okSug ? aPreco.preco : null, { horasM1: horasM1() });   // sem preço informado: usa o preço possível
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
    const num2 = (n) => n.toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
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
              <div class="is-txt"><b>${esc(c.nome || "Seu negócio")}</b>${c.tipo ? `<span class="chip">${esc(c.tipo)}</span>` : ""}${c.tipo && herdado("M5.P01") ? ` ${seloMini(deModulo("M5.P01"))} <button class="alterar" data-trocar="M5.P01">Trocar</button>` : ""}${t && herdado(t.nome) ? ` <span class="nome-herdado">Nome: ${seloMini(deModulo(t.nome))} <button class="alterar" data-trocar="${t.nome}">Trocar</button></span>` : ""}</div>
              <div class="is-rodape"><span class="salvo">Análise salva</span><a href="#contas" class="ver" id="ver">Ver as contas ↓</a></div>
            </div>
          </section>

          <div id="numeros" class="numeros">
          <section class="entendemos" id="entendemos"><h3>O que entendemos até aqui</h3>
            ${Motor.entendemos(S.R, c, ideiaM1()).map((f) => `<p>${esc(f)}</p>`).join("")}
            ${comoEntendemos(c)}
          </section>
          <div class="tarefa" id="tarefa"><b>Sua tarefa para fazer já</b><p>${esc(tarefa)}</p></div>
          ${blocoEntrou(c)}
          ${blocoSazonal(c)}
          ${c.simulacao ? `<div class="bloco b-simulacao" id="simulacao"><b>Simulação</b>${esc(Motor.MSG_SIMULACAO)}</div>` : ""}
          ${abaixo ? blocoAbaixo(abaixo) : ""}
          ${avisosAnalise(aPreco)}
          ${c.semSobra ? `<div class="bloco b-alerta" id="sem-sobra"><b>Atenção</b>${esc(Motor.MSG_SEM_SOBRA)}</div>` : ""}
          ${c.fatAlto ? `<div class="bloco b-alerta aviso-forte" id="fat-alto"><b>Confira os valores</b><p>${esc(Motor.MSG_FAT_ALTO)}</p></div>` : ""}
          ${investe ? `<div class="bloco b-alerta" id="aviso-investimento"><b>Atenção</b><p>${esc(investe.texto)}</p>${comoCalc(`${Motor.gastoInicialPartes(M, S.R).map((x) => `${esc(x.nome)} ${brl(x.valor)}`).join(" + ")} = ${brl(investe.total)}.`, "como-investe")}${seloMini()}</div>` : ""}
          ${tempoAlto ? `<div class="bloco b-alerta" id="tempo-alto"><b>Atenção</b>${esc(Motor.MSG_TEMPO)}
            <p>${String(Math.round(tempoAlto.horas * 10) / 10).replace(".", ",")} horas por mês para ${esc(String(c.qtd))} atendimentos; na Etapa 1 você disse ter até ${tempoAlto.limite} horas por mês.</p>
            ${comoCalc(`${c.tempo} minutos por atendimento × ${qtdTxt(c.qtd)} atendimentos = ${qtdTxt(c.tempo * c.qtd)} minutos ÷ 60 = ${String(Math.round(tempoAlto.horas * 10) / 10).replace(".", ",")} horas por mês.`, "como-tempo")}
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
            <p class="nota" id="nota-estimativa">${esc(regraFinal.alerta)}</p>
            ${c.linhas.length ? `<details class="saiba" open><summary>${esc(regraFinal.proximo)}</summary>
              <table class="comp">${c.linhas.map((l) => `<tr><td>${esc(l.nome)}</td><td>${brl(l.valor)}</td></tr>`).join("")}
              ${c.taxa ? `<tr><td>${esc(bt("05").conceito)} (${pct(c.taxaPct)} do preço)</td><td>${brl(c.taxa)}</td></tr>` : ""}</table>
              ${aj.html ? `<p class="nota"><a href="#ajuste" data-ir-ajuste>Mudou algum valor? Ajuste aqui e recalcule ↓</a></p>` : ""}</details>` : ""}
          ` : ""}

          ${c.mc !== null ? `
            <div class="secao-titulo">Preço e margem</div>
            <div class="mini-cards">
              ${card(c.precoInformado !== null ? bt("08").conceito : "Preço possível (simulação)", brl(c.preco))}
              ${card(bt("09").conceito, brl(c.mc), "o que sobra de cada venda para pagar as contas do mês")}
              ${c.mcPct !== null ? card(bt("10").conceito, pct(c.mcPct), "quanto do preço sobra. Ex.: 30% = R$ 3 de cada R$ 10") : ""}
            </div>
            ${comoSobra(c.preco, c.custoUnidade, c.taxa, c.mc, c.mcPct, "como-margem", c.taxaPct, c.entrega)}
            ${c.mc <= 0 ? `<div class="bloco b-alerta"><b>Atenção</b>${esc(bt("09").definicao)}</div>` : ""}
          ` : ""}
          ${blocoAnalise(aPreco, true, true)}
          ${blocoMargem()}
          ${c.taxasFormas.length ? `
            <div class="secao-titulo">Formas de pagamento e taxas</div>
            <table class="comp" id="tab-formas">${c.taxasFormas.map((x) => `<tr><td>${esc(x.forma)}${x.parte ? ` (${esc(x.parte)}% das vendas)` : ""}${String(x.prazo || "").trim() ? ` · recebe em ${esc(x.prazo)} dias` : ""}</td><td>${esc(x.taxa)}%</td></tr>`).join("")}
            ${c.taxasFormas.length > 1 ? `<tr class="total"><td>Taxa média das vendas</td><td>${pctT(c.taxaPct)}</td></tr>` : ""}</table>
            ${c.taxasFormas.length > 1 ? comoCalc(`${c.taxasFormas.map((x) => `${pctT(Motor.num(x.taxa) || 0)} × ${pctT(Motor.num(x.parte) || 0)} das vendas`).join(" + ")} = ${pctT(c.taxaPct)}.`, "como-taxa-media") : ""}` : ""}

          <div class="secao-titulo">Gastos do mês</div>
          <table class="comp">
            ${c.fixos ? `<tr><td>${esc(bt("02").conceito)}</td><td>${brl(c.fixos)}</td></tr>` : ""}
            ${c.perdas ? `<tr><td>${esc(bt("04").conceito)}</td><td>${brl(c.perdas)}</td></tr>` : ""}
            ${c.trabalho ? `<tr><td>${esc(bt("07").conceito)}</td><td>${brl(c.trabalho)}</td></tr>` : ""}
            <tr class="total"><td>Total</td><td>${brl(c.mensal)}</td></tr>
          </table>
          ${comoGastos(c)}

          ${c.pe !== null && c.mensal > 0 ? `
            <div class="res-num coral" id="pe-card">
              <div class="lbl">${esc(bt("13").conceito)}</div>
              <div class="val">${c.pe}</div>
              <div class="sub">${c.tipo === "Serviço" ? "atendimentos" : "unidades"} por mês</div>
            </div>
            ${comoCalc(`${brl(c.mensal)} de gastos do mês ÷ ${brl(c.mc)} que sobram em cada venda = ${num2(c.mensal / c.mc)}. Arredondamos para cima, porque não dá para vender só uma parte: <b>${c.pe}</b> ${c.tipo === "Serviço" ? "atendimentos" : "vendas"}.`, "pe-conta")}
            <p class="r-texto">${esc(bt("13").definicao)} Em palavras simples: quantas vendas por mês pagam todas as contas, sem sobrar nem faltar.</p>` : ""}
          ${c.peFalta ? `<div class="secao-titulo">${esc(bt("13").conceito || "Ponto de equilíbrio")}</div><p class="nota" id="pe-falta">${esc(c.peFalta)}</p>` : ""}

          ${c.fat !== null ? `
            <div class="secao-titulo">Um mês normal, pelo que você informou</div>
            <div class="mini-cards">
              ${card(bt("11").conceito, brl(c.fat))}
              ${card(bt("12").conceito, brl(c.resultado))}
            </div>
            ${comoCalc(comoMes(c.preco, c.qtd, c.fat, c.custoTaxa, c.taxa, c.custoVendas, c.mensal, c.resultado, c.entrega), "como-resultado")}
            <p class="r-texto">${esc(bt("12").definicao)}</p>
            <p class="nota" id="descontados">${esc(Motor.MSG_DESCONTADOS)}</p>` : ""}
          ${c.tempo ? `<div class="mini-cards">${card(M.porCodigo["M5.P23"].resposta, c.tempo >= 60 ? `${Math.floor(c.tempo / 60)}h${String(c.tempo % 60).padStart(2, "0")}` : `${c.tempo} min`)}</div>` : ""}
          </details>

          ${aj.html}
          ${c.custoUnidade > 0 || c.linhas.length ? `
            <details class="resultado-mais" id="simula-det"><summary>Simular outro preço e outra quantidade</summary>
            <div class="simula" id="simula">
              <label class="item"><span>Preço</span><div class="linha"><span class="pre">R$</span><input class="campo" id="sim-preco" inputmode="decimal" value="${c.preco !== null ? esc(brNum(c.preco)) : ""}"></div></label>
              <label class="item"><span>Vendas no mês</span><div class="linha"><input class="campo" id="sim-qtd" inputmode="decimal" value="${c.qtd !== null ? esc(qtdTxt(c.qtd)) : ""}"></div></label>
              <button class="btn btn-claro" id="sim-ok">Simular</button>
              <p class="nota">Os números mudam enquanto você digita.</p>
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
          <div class="acoes lg2-proximo"><a class="btn btn-primario" style="text-decoration:none;text-align:center;box-sizing:border-box" href="/lg2/turma-b/m06/index.html">Ir para a Etapa 6</a></div>
          ${rodape(true)}
        </main>
      </div>`);

    ligar(p);
    p.querySelector("#v").onclick = () => { S.hist.pop(); const a = S.hist.pop(); salvar(); abrir(a); };
    /* imprimir: abre os detalhes recolhidos (o ajuste continua fora da impressão) */
    p.querySelector("#imp").onclick = () => { p.querySelectorAll("details").forEach((d) => { d.open = true; }); window.print(); };
    ligarCopiar(p);
    const sim = p.querySelector("#sim-ok");
    const simular = () => {
      const r = Motor.simular(M, S.R, p.querySelector("#sim-preco").value, p.querySelector("#sim-qtd").value);
      const box = p.querySelector("#sim-res");
      if (!r && [p.querySelector("#sim-preco").value, p.querySelector("#sim-qtd").value].some((x) => x.trim() && Motor.num(x) === null)) { box.innerHTML = `<div class="erro">${esc(Motor.MSG_NUMERO)}</div>`; return; }
      if (!r) { box.innerHTML = `<div class="erro">Informe o preço e a quantidade de vendas para simular.</div>`; return; }
      box.innerHTML = `<div class="mini-cards">${card("Sobra em cada venda", brl(r.sobra))}${card(bt("12").conceito || "Resultado", brl(r.resultado))}${r.pe !== null ? card(bt("13").conceito || "Ponto de equilíbrio", String(r.pe)) : ""}</div>
        ${comoCalc(`${r.taxa ? `taxa: ${pctT(r.taxaPct)} de ${brl(r.preco)} = ${brl(r.taxa)}; ` : ""}${brl(r.preco)} − ${brl(r.custo)} de custo${r.taxa ? ` − ${brl(r.taxa)} de taxas` : ""}${r.entrega ? ` − ${brl(r.entrega)} de entrega` : ""} = ${brl(r.sobra)} por venda; ${comoMes(r.preco, r.qtd, r.fat, r.custoTaxa, r.taxa, r.custoVendas, r.mensal, r.resultado, r.entrega)}${r.pe !== null && r.mensal > 0 ? ` Vendas para cobrir o mês: ${brl(r.mensal)} ÷ ${brl(r.sobra)} = ${num2(r.mensal / r.sobra)}, para cima: ${r.pe}.` : ""}`, "como-sim")}
        ${r.abaixo ? `<div class="bloco b-alerta" id="sim-abaixo"><b>Atenção</b>${esc(r.abaixo)}</div>` : ""}
        ${r.semSobra ? `<div class="bloco b-alerta"><b>Atenção</b>${esc(Motor.MSG_SEM_SOBRA)}</div>` : ""}`;
    };
    if (sim) {
      sim.onclick = simular;
      /* simulador editável: os números e a linha "Como calculamos" mudam ao vivo */
      ["#sim-preco", "#sim-qtd"].forEach((id) => p.querySelector(id).addEventListener("input", simular));
    }
    p.querySelector("#rev").onclick = () => { S.hist = []; salvar(); ir(telaPergunta, pularHerdadas(PRIMEIRA)); };
    p.querySelector("#minhas").onclick = () => ir(telaAnalises, telaResultado);
    p.querySelector("#ver").onclick = (e) => { e.preventDefault(); const d = p.querySelector("#contas"); d.open = true; d.scrollIntoView({ behavior: "smooth", block: "start" }); };
    if (aj.specs.length) ligarAjuste(p, aj.specs);
    ligarSimAluguel(p, c);
    /* 16/11 (I): no resultado, toda seção recolhível vem aberta (a pessoa pode fechar); inclui as que outros scripts
       acrescentam depois (fontes) */
    const abrirTudo = () => p.querySelectorAll("details").forEach((d) => { if (!d.dataset.fechou) d.open = true; });
    p.querySelectorAll("details").forEach((d) => d.addEventListener("toggle", () => { if (!d.open) d.dataset.fechou = "1"; }));
    abrirTudo(); setTimeout(abrirTudo, 0);
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
