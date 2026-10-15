/* Telas do Módulo 5. Todo texto de conteúdo vem de window.MODULO5 (a planilha),
   sem edição. As respostas ficam só neste aparelho.
   Proposta de layout (mockup do grupo): faixa roxa com ilustração, etapas
   (Seu produto → Gastos → Preço e resultado), etiqueta do item com "Alterar",
   cartão de dica, Voltar/Continuar e lista "Minhas análises". */
(function () {
  "use strict";
  const D = window.MODULO5, M = Motor.montar(D);
  const tela = document.getElementById("tela");
  const CHAVE = "lg2-turma-a-m05";
  const CHAVE_HIST = CHAVE + "-historico";          // análises concluídas
  const CHAVE_ATUAL = CHAVE + "-historico-atual";   // qual análise da lista é a de agora
  const vazio = (s) => !s || !String(s).trim() || s === "—" || s === "-";
  const ROTULO_REINICIO = "Analisar outro produto, serviço ou mercadoria";

  /* Versão do estado salvo: a 2 tirou o "Não sei" dos gastos fixos e passou o preço
     para o fim. Respostas salvas em outra versão são descartadas. */
  const VERSAO = 2;
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
    ir(telaPergunta, "M5.P01");
  }

  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const brl = (n) => "R$ " + n.toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const pct = (n) => n.toFixed(1).replace(".", ",") + "%";
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
  function heroiEtapa(n) {
    const t = infoTipo();
    if (n === 1) return heroi({ titulo: `Vamos conhecer ${t ? t.seu : "seu negócio"}.`, texto: "Responda uma pergunta por vez. Nós te ajudamos no caminho.", img: t ? t.heroi : "hero-preco.webp", reinicio: true });
    if (n === 2) return heroi({ titulo: "Vamos organizar seus gastos.", texto: "Agora, os gastos que você tem todo mês para manter o negócio.", img: t ? t.heroiGastos : "hero-preco.webp", reinicio: true });
    return heroi({ titulo: "Vamos chegar ao seu preço.", texto: "Quanto você vende, quanto cobra e quanto sobra em cada venda.", img: "hero-preco.webp", reinicio: true });
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
    if (!t || cod === "M5.P01") return "";
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
  function dica(texto, img) {
    if (vazio(texto)) return "";
    return `<aside class="dica">${img ? `<img src="assets/${img}" alt="">` : ""}<div><b>Dica</b><p class="ajuda">${esc(texto)}</p></div></aside>`;
  }
  function imgDica(n) {
    const t = infoTipo();
    if (n === 3) return "hero-preco.webp";
    if (!t) return "dica-produto.webp";
    return n === 2 ? t.gastos : t.dica;
  }
  const botaoVoltar = () => `<div class="acoes acoes-voltar"><button class="btn btn-linha voltar" id="v">Voltar</button></div>`;
  /* liga os botões comuns a todas as telas */
  function ligar(p) {
    p.querySelectorAll("[data-inicio]").forEach((b) => { b.onclick = () => ir(telaCapa); });
    p.querySelectorAll("[data-alterar]").forEach((b) => { b.onclick = () => voltarPara(b.dataset.alterar); });
    const n = p.querySelector("#novo");
    if (n) n.onclick = reiniciar;
  }

  const obs = (t) => vazio(t) ? "" : `<div class="obs"><b>Observação</b>${esc(t)}</div>`;

  /* vídeo só aparece quando o campo "video" da pergunta estiver preenchido */
  function blocoVideo(url) {
    if (vazio(url)) return "";
    const yt = /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/.exec(url);
    if (yt) return `<div class="video"><iframe src="https://www.youtube-nocookie.com/embed/${esc(yt[1])}" title="Vídeo explicativo" allowfullscreen loading="lazy"></iframe></div>`;
    if (/\.(mp4|webm)(\?|$)/i.test(url)) return `<div class="video"><video src="${esc(url)}" controls preload="metadata"></video></div>`;
    return `<div class="video"><iframe src="${esc(url)}" title="Vídeo explicativo" allowfullscreen loading="lazy"></iframe></div>`;
  }

  /* painel aberto pelo botão "Não sei" dos gastos fixos */
  function painelNaoSei(a) {
    return `<div class="painel-ajuda" id="painel" hidden>
      ${blocoVideo(a.video)}
      ${a.conceitos.map((b) => `
        <h3>${esc(b.conceito)}</h3>
        <p><b>O que é:</b> ${esc(b.definicao)}</p>
        ${vazio(b.porque) ? "" : `<p><b>Por que é importante para dividir o custo:</b> ${esc(b.porque)}</p>`}
        ${vazio(b.exemplo) ? "" : `<p class="ex"><b>Exemplo:</b> ${esc(b.exemplo)}</p>`}`).join("")}
      ${a.comoAchar.length ? `<p><b>Como descobrir:</b> ${a.comoAchar.map(esc).join(" ")}</p>` : ""}
      <p class="depois">Depois de ler, escolha uma resposta acima para continuar.</p>
    </div>`;
  }

  const conceitos = (txt) => (String(txt || "").match(/M5\.BT\d{2}/g) || []).map((c) => M.conceito[c]).filter(Boolean);

  function blocoConceitos(lista) {
    if (!lista.length) return "";
    return `<details class="saiba"><summary>Entenda os termos</summary>${lista.map((b) => `
      <div class="conceito"><b>${esc(b.conceito)}</b><p>${esc(b.definicao)}</p>
      ${vazio(b.exemplo) ? "" : `<p class="ex">${esc(b.exemplo)}</p>`}
      <span class="fonte">Fonte: ${vazio(b.link) ? esc(b.fonte) : `<a href="${esc(b.link)}" target="_blank" rel="noopener">${esc(b.fonte)}</a>`}${vazio(b.data) ? "" : ` · consultado em ${esc(b.data)}`}</span></div>`).join("")}
    </details>`;
  }

  /* ================= capa ================= */
  function telaCapa() {
    const iniciado = S.hist.length > 0;
    const p = el(`
      <div class="pag">
        ${topo("")}
        ${heroi({ grande: true, h1: true, kicker: "Módulo " + D.modulo.numero, titulo: D.modulo.nome, texto: D.mapa.objetivo, img: "hero-inicio.webp" })}
        <main class="corpo">
          <div class="cartao">
            <h3>Para quem é</h3><p>${esc(D.mapa.usuario)}</p>
          </div>
          <div class="cartao">
            <h3>O que ter em mãos</h3><p>${esc(D.mapa.ter_em_maos)}</p>
          </div>
          <div class="cartao">
            <h3>O que você recebe no final</h3><p>${esc(D.mapa.entrega)}</p>
          </div>
          <div class="acoes">
            <button class="btn btn-primario seta" id="ir">${iniciado ? "Continuar de onde parei" : "Começar"}</button>
            ${iniciado ? `<button class="btn btn-claro" id="zerar">Recomeçar do zero</button>` : ""}
            <button class="btn btn-linha lista-ico" id="minhas">Ver minhas análises</button>
            <button class="btn btn-linha" id="limites">O que este módulo não faz</button>
          </div>
          ${rodape()}
        </main>
      </div>`);
    ligar(p);
    p.querySelector("#ir").onclick = () => {
      const atual = S.hist[S.hist.length - 1];
      if (atual) abrir(atual); else ir(telaPergunta, "M5.P01");
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
  function telaPergunta(cod) {
    const q = M.porCodigo[cod];
    if (S.hist[S.hist.length - 1] !== cod) { S.hist.push(cod); salvar(); }
    const tipo = Motor.campo(q);
    const resp = S.R[cod] || null;
    const alt = Motor.botoesAlternativos(M, q);
    const ajudaNS = Motor.ajudaNaoSei(M, q);
    const inicial = cod === "M5.P01";
    const n = etapa(cod);
    const t = infoTipo();

    const p = el(`
      <div class="pag">
        ${topo(inicial ? "" : t ? tipoAtual() : "")}
        ${inicial ? heroi({ titulo: "Entenda seus gastos. Defina melhor seu preço.", texto: "Organize os gastos do seu negócio e descubra quanto sobra em cada venda, um passo de cada vez.", img: "hero-inicio.webp", foco: "22% 30%", reinicio: true }) : heroiEtapa(n)}
        ${inicial ? "" : etapas(n)}
        <main class="corpo">
          <div class="cartao-q pergunta">
            ${inicial ? `<div class="kicker-q">Vamos conhecer seu negócio</div>` : contexto(cod)}
            <h2 class="q">${esc(q.pergunta)}</h2>
            ${inicial ? `<p class="sub-q">${esc(q.ajuda)}</p>` : ""}
            ${obs(q.observacao)}
            ${ajudaNS ? "" : blocoVideo(q.video)}
            <div class="entrada" id="ent"></div>
            ${inicial ? `<p class="nota-info">Trabalha com mais de um tipo? Comece por um deles.</p>` : ""}
            ${alt.length ? `<div class="alt" id="alt"></div>` : ""}
            ${ajudaNS ? `<div class="alt"><button class="btn-ajuda" id="naosei" aria-expanded="false"><span aria-hidden="true">?</span> Não sei</button></div>${painelNaoSei(ajudaNS)}` : ""}
            <div class="erro" id="erro" hidden></div>
            ${inicial ? "" : dica(q.ajuda, imgDica(n))}
            <div id="retorno"></div>
            ${blocoConceitos(conceitos(q.fonte))}
            <div class="acoes" id="acoes"><button class="btn btn-primario seta" id="ok">Continuar</button></div>
            ${botaoVoltar()}
          </div>
          ${rodape()}
        </main>
      </div>`);
    ligar(p);

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
    let escolhida = resp && resp.estado === "opcao" ? resp.opcao : null;

    if (tipo === "escolha") {
      ent.classList.add("opcoes");
      if (inicial) ent.classList.add("opcoes-tipo");
      q.opcoesLista.forEach((op) => {
        const [tit, desc] = op.includes(":") ? [op.split(":")[0], op.slice(op.indexOf(":") + 1)] : [op, ""];
        const info = inicial ? TIPOS[tit.trim()] : null;
        const b = el(`<button class="opcao ${info ? "opcao-tipo" : ""} ${escolhida === op ? "sel" : ""}"><span class="radio" aria-hidden="true"></span><span class="op-txt"><b>${esc(tit.trim())}</b>${desc ? `<span class="op-desc">${esc(desc.trim())}</span>` : ""}${info ? `<small>${esc(info.ex)}</small>` : ""}</span>${info ? `<img src="assets/${info.card}" alt="">` : ""}</button>`);
        b.onclick = () => { escolhida = op; ent.querySelectorAll(".opcao").forEach((x) => x.classList.remove("sel")); b.classList.add("sel"); };
        ent.appendChild(b);
      });
      ler = () => null;
    } else {
      ler = montarEntrada(ent, q, tipo, resp && resp.estado === "valor" ? resp.valor : null);
    }

    const altBox = p.querySelector("#alt");
    alt.forEach((op) => {
      const b = el(`<button class="btn-alt">${esc(op)}</button>`);
      b.onclick = () => responder(op === "Não sei" ? { estado: "naosei" } : { estado: "opcao", opcao: op });
      altBox.appendChild(b);
    });

    ent.addEventListener("input", () => { p.querySelector("#erro").hidden = true; });
    ent.addEventListener("click", (e) => { if (e.target.closest(".opcao")) p.querySelector("#erro").hidden = true; });
    p.querySelector("#ok").onclick = () => {
      if (tipo === "escolha") {
        if (!escolhida) return mostrarErro(q.ajudaNaoSei ? Motor.MSG_RESPONDA : "Escolha uma opção para continuar.");
        return responder({ estado: "opcao", opcao: escolhida });
      }
      const v = ler();
      const erro = Motor.validar(M, q, v, S.R);
      if (erro) return mostrarErro(erro);
      responder({ estado: "valor", valor: v });
    };

    function mostrarErro(txt) { const e = p.querySelector("#erro"); e.textContent = txt; e.hidden = false; }

    function responder(r0) {
      p.querySelector("#erro").hidden = true;
      S.R[cod] = r0;
      const r = Motor.regra(M, q, r0);
      const prox = Motor.proxima(M, q, r0, r);
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
    if (tipo === "texto") {
      ent.appendChild(el(`<input class="campo" type="text" value="${esc(val || "")}">`));
      return () => ent.querySelector("input").value;
    }
    if (tipo === "numero" || tipo === "percentual") {
      const suf = tipo === "percentual" ? "%" : "";
      const pre = /r\$/i.test(q.tipo) ? "R$" : "";
      ent.appendChild(el(`<div class="linha">${pre ? `<span class="pre">${pre}</span>` : ""}<input class="campo" inputmode="decimal" value="${esc(val ?? "")}">${suf ? `<span class="pre">${suf}</span>` : ""}</div>`));
      return () => ent.querySelector("input").value;
    }
    if (tipo === "lista") {
      const lista = el(`<div class="lista"></div>`);
      const add = (v) => {
        const l = el(`<div class="linha"><input class="campo" value="${esc(v || "")}"><button class="x" aria-label="remover">×</button></div>`);
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
      itens.forEach((nome, i) => ent.appendChild(el(`<label class="item"><span>${esc(nome)}</span><div class="linha"><span class="pre">R$</span><input class="campo" inputmode="decimal" value="${esc(val ? val[i] ?? "" : "")}"></div></label>`)));
      return () => [...ent.querySelectorAll("input")].map((i) => i.value);
    }
    if (tipo === "por-item-unidade") {
      itens.forEach((nome, i) => {
        const v = val && val[i] || {};
        ent.appendChild(el(`<label class="item"><span>${esc(nome)}</span><div class="linha"><input class="campo" inputmode="decimal" value="${esc(v.q ?? "")}">${selUnid(v.u || "unidade")}</div></label>`));
      });
      return () => [...ent.querySelectorAll(".item")].map((it) => ({ q: it.querySelector("input").value, u: it.querySelector("select").value }));
    }
    if (tipo === "pacote") {
      const v = val || {};
      ent.appendChild(el(`<div><label class="item"><span>Preço do pacote</span><div class="linha"><span class="pre">R$</span><input class="campo" id="pp" inputmode="decimal" value="${esc(v.preco ?? "")}"></div></label>
        <label class="item"><span>Quantas vêm no pacote</span><div class="linha"><input class="campo" id="pq" inputmode="numeric" value="${esc(v.qtd ?? "")}"></div></label></div>`));
      return () => ({ preco: ent.querySelector("#pp").value, qtd: ent.querySelector("#pq").value });
    }
    if (tipo === "lista-valor") {
      const lista = el(`<div class="lista"></div>`);
      const add = (x) => {
        x = x || {};
        const l = el(`<div class="linha"><input class="campo nome" placeholder="conta" value="${esc(x.nome || "")}"><span class="pre">R$</span><input class="campo valor" inputmode="decimal" value="${esc(x.v || "")}"><button class="x" aria-label="remover">×</button></div>`);
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
      ent.appendChild(el(`<div class="linha"><input class="campo" id="th" inputmode="numeric" value="${esc(v.h ?? "")}"><span class="pre">h</span><input class="campo" id="tm" inputmode="numeric" value="${esc(v.m ?? "")}"><span class="pre">min</span></div>`));
      return () => ({ h: ent.querySelector("#th").value, m: ent.querySelector("#tm").value });
    }
    return () => null;
  }

  /* ================= análise do preço (depois da P36) ================= */
  function blocoAnalise(a, comTitulo) {
    if (!a || a.pendente) return "";
    const avisos = a.mensagens.length ? `<div class="bloco b-alerta"><b>Atenção</b>${a.mensagens.map((m) => `<p>${esc(m)}</p>`).join("")}</div>` : "";
    if (a.semCusto) return `<div class="analise">${avisos}</div>`;
    const bt = (n) => M.conceito["M5.BT" + n] || {};
    return `<div class="analise">
      ${comTitulo ? `<div class="secao-titulo">${a.modo === "sugerido" ? "Preço de venda (demonstração)" : "Lucro sobre o custo"}</div>` : ""}
      ${a.modo === "sugerido" ? `
        <div class="res-num"><div class="lbl">Preço possível</div><div class="val" id="preco-possivel">${brl(a.preco)}</div>
          <div class="sub">${esc(bt("03").conceito || "Custo por unidade")} ${brl(a.custo)} + ${pct(a.pct)} de lucro</div></div>
        <p class="nota">Este preço é só uma demonstração para ajudar você a pensar. A decisão do preço é sua.</p>` : `
        <div class="res-num"><div class="lbl">Lucro em cada venda</div><div class="val" id="lucro-pct">${pct(a.pct)}</div>
          <div class="sub">Preço ${brl(a.preco)} · ${esc(bt("03").conceito || "Custo por unidade")} ${brl(a.custo)}</div></div>
        <p class="nota">Lucro em cada venda = (preço − custo de uma unidade) ÷ custo de uma unidade.</p>`}
      ${avisos}
    </div>`;
  }

  function telaPreco() {
    const q36 = M.porCodigo["M5.P36"];
    const sugerido = !(S.R["M5.P36"] && S.R["M5.P36"].estado === "valor");
    let a = Motor.analisarPreco(M, S.R, S.lucro);
    const p = el(`
      <div class="pag">
        ${topo(tipoAtual() || "")}
        ${heroiEtapa(3)}
        ${etapas(3)}
        <main class="corpo">
          <div class="cartao-q pergunta">
            ${contexto(Motor.PRECO)}
            <h2 class="q">${sugerido ? "Quanto de lucro você quer ganhar em cada venda? (%)" : "Quanto você ganha em cada venda"}</h2>
            ${obs(q36.observacao)}
            ${sugerido && a && !a.semCusto ? `<p class="ajuda">Vamos somar essa porcentagem ao que você gasta para fazer cada unidade e mostrar um preço possível.</p>
              <div class="entrada" id="ent"><div class="linha"><input class="campo" id="lucro" inputmode="decimal" value="${esc(S.lucro ?? "")}"><span class="pre">%</span></div></div>` : ""}
            <div class="erro" id="erro" hidden></div>
            <div id="analise">${blocoAnalise(a, false)}</div>
            <div class="acoes" id="acoes">
              ${sugerido && a && !a.semCusto ? `<button class="btn btn-primario seta" id="calc">Continuar</button>` : ""}
              <button class="btn ${sugerido && a && !a.semCusto ? "btn-claro" : "btn-primario seta"}" id="res" ${sugerido && a && !a.semCusto && (a.pendente) ? "hidden" : ""}>Ver o resultado</button>
            </div>
            ${botaoVoltar()}
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
      if (n === null || n < 0) { erro.textContent = "Informe a porcentagem de lucro que você quer, por exemplo 30."; erro.hidden = false; return; }
      erro.hidden = true;
      S.lucro = v.trim();
      salvar();
      a = Motor.analisarPreco(M, S.R, S.lucro);
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
      preco: c.preco !== null ? c.preco : ok ? a.preco : null,
      precoInformado: c.preco !== null,
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
          ${l.length ? `<ul class="lista-analises">${l.map((x) => `
            <li class="analise-item" data-id="${esc(x.id)}">
              <div class="ai-topo">
                ${TIPOS[x.tipo] ? `<img src="assets/${TIPOS[x.tipo].card}" alt="">` : ""}
                <div><b>${esc(x.nome)}</b>${x.tipo ? `<span class="chip">${esc(x.tipo)}</span>` : ""}<small>Concluída em ${esc(dataBR(x.data))}</small></div>
              </div>
              <div class="ai-nums">
                <div><small>${x.precoInformado ? "Preço" : "Preço possível"}</small><span>${x.preco !== null && isFinite(x.preco) ? brl(x.preco) : "—"}</span></div>
                <div><small>Lucro em cada venda</small><span>${x.lucro !== null && isFinite(x.lucro) ? pct(x.lucro) : "—"}</span></div>
              </div>
              <div class="ai-acoes"><button class="btn btn-primario btn-peq" data-abrir="${esc(x.id)}">Abrir</button><button class="btn btn-linha btn-peq" data-apagar="${esc(x.id)}">Apagar</button></div>
            </li>`).join("")}</ul>`
          : `<div class="cartao vazio-lista"><h3>Nenhuma análise ainda</h3><p>Quando você chegar ao resultado de um produto, serviço ou mercadoria, a análise aparece aqui.</p></div>`}
          ${botaoVoltar()}
          ${rodape()}
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

  /* ================= resultado ================= */
  function telaResultado() {
    const c = Motor.calcular(M, S.R);
    const aPreco = Motor.analisarPreco(M, S.R, S.lucro);
    registrarAnalise(c, aPreco);
    const bt = (n) => M.conceito["M5.BT" + n] || {};
    const regraFinal = D.regras.find((r) => r.pergunta === "Resultado");
    const temCusto = c.linhas.length > 0 || c.tipo === "Serviço";
    const lacunas = [];
    Object.keys(S.R).forEach((cod) => {
      if (!S.hist.includes(cod) || !M.porCodigo[cod]) return;
      const r = Motor.regra(M, M.porCodigo[cod], S.R[cod]);
      if (r && !vazio(r.lacuna) && !lacunas.includes(r.lacuna)) lacunas.push(r.lacuna);
    });
    const card = (t, v, sub) => `<div class="mini"><span>${v}</span><small>${esc(t)}</small>${sub ? `<em>${esc(sub)}</em>` : ""}</div>`;
    const t = TIPOS[c.tipo];

    const p = el(`
      <div class="pag">
        ${topo(c.tipo || "")}
        ${heroi({ kicker: "Resultado", kickerClasse: "passo", titulo: "Uma análise concluída.", texto: "Você organizou os gastos e entendeu o preço deste item.", img: "hero-inicio.webp", foco: "22% 30%" })}
        ${etapas(3, true)}
        <main class="corpo">
          <section class="concluido">
            <div class="conc-topo"><span class="check" aria-hidden="true"></span><div><h2>Você concluiu a análise deste item!</h2><p>Agora você pode analisar outro produto, serviço ou mercadoria.</p></div></div>
            <div class="item-salvo">
              ${t ? `<img src="assets/${t.card}" alt="">` : ""}
              <div class="is-txt"><b>${esc(c.nome || "Seu negócio")}</b>${c.tipo ? `<span class="chip">${esc(c.tipo)}</span>` : ""}</div>
              <div class="is-rodape"><span class="salvo">Análise salva</span><a href="#numeros" class="ver" id="ver">Ver análise ↓</a></div>
            </div>
            <div class="outra">
              <h3>Seu negócio tem mais de uma oferta?</h3>
              <p>Recomece as perguntas para outro item. Suas análises anteriores ficam salvas.</p>
              <button class="btn btn-primario seta" id="novo">${ROTULO_REINICIO}</button>
              <small>Você poderá escolher Produto, Serviço ou Mercadoria novamente.</small>
            </div>
            <button class="btn btn-linha lista-ico" id="minhas">Ver minhas análises</button>
          </section>

          <div id="numeros" class="numeros">
          ${temCusto && regraFinal ? `
            <div class="res-num">
              <div class="lbl">${esc(bt("03").conceito || "")}</div>
              <div class="val">${brl(c.custoUnidade)}</div>
            </div>
            <p class="r-texto">${esc(regraFinal.texto.replace("R$ X", brl(c.custoUnidade)))}</p>
            <div class="bloco b-alerta"><b>Atenção</b>${esc(regraFinal.alerta)}</div>
            ${c.linhas.length ? `<details class="saiba" open><summary>${esc(regraFinal.proximo)}</summary>
              <table class="comp">${c.linhas.map((l) => `<tr><td>${esc(l.nome)}</td><td>${brl(l.valor)}</td></tr>`).join("")}
              ${c.taxa ? `<tr><td>${esc(bt("05").conceito)} (${pct(c.taxaPct)} do preço)</td><td>${brl(c.taxa)}</td></tr>` : ""}</table></details>` : ""}
          ` : ""}

          ${c.mc !== null ? `
            <div class="secao-titulo">Preço e margem</div>
            <div class="mini-cards">
              ${card(bt("08").conceito, brl(c.preco))}
              ${card(bt("09").conceito, brl(c.mc))}
              ${c.mcPct !== null ? card(bt("10").conceito, pct(c.mcPct)) : ""}
            </div>
            ${c.mc <= 0 ? `<div class="bloco b-alerta"><b>Atenção</b>${esc(bt("09").definicao)}</div>` : ""}
          ` : ""}
          ${blocoAnalise(aPreco, true)}

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
            <p class="r-texto">${esc(bt("13").definicao)}</p>` : ""}

          ${c.fat !== null ? `
            <div class="secao-titulo">Um mês normal, pelo que você informou</div>
            <div class="mini-cards">
              ${card(bt("11").conceito, brl(c.fat))}
              ${card(bt("12").conceito, brl(c.resultado))}
            </div>
            <p class="r-texto">${esc(bt("12").definicao)}</p>` : ""}

          ${c.tempo ? `<div class="mini-cards">${card(M.porCodigo["M5.P23"].resposta, c.tempo >= 60 ? `${Math.floor(c.tempo / 60)}h${String(c.tempo % 60).padStart(2, "0")}` : `${c.tempo} min`)}</div>` : ""}

          ${lacunas.length ? `<div class="bloco b-lacuna"><b>O que ainda falta saber</b><ul>${lacunas.map((l) => `<li>${esc(l)}</li>`).join("")}</ul></div>` : ""}

          <div class="aviso">${esc(D.mapa.mensagem_limite)}</div>
          <div class="cartao"><h3>Quando procurar um profissional</h3><p>${esc(D.mapa.encaminhamentos)}</p></div>
          </div>

          <div class="acoes">
            <button class="btn btn-primario" id="imp">Salvar ou imprimir</button>
            <button class="btn btn-claro" id="rev">Revisar respostas</button>
          </div>
          ${botaoVoltar()}
          ${rodape()}
        </main>
      </div>`);
    ligar(p);
    p.querySelector("#v").onclick = () => { S.hist.pop(); const a = S.hist.pop(); salvar(); abrir(a); };
    p.querySelector("#imp").onclick = () => window.print();
    p.querySelector("#rev").onclick = () => { S.hist = []; salvar(); ir(telaPergunta, "M5.P01"); };
    p.querySelector("#minhas").onclick = () => ir(telaAnalises, telaResultado);
    p.querySelector("#ver").onclick = (e) => { e.preventDefault(); p.querySelector("#numeros").scrollIntoView({ behavior: "smooth", block: "start" }); };
    return p;
  }

  function rodape() {
    return `<footer class="rodape">
      <p class="credito">Conteúdo do Grupo ${esc(D.modulo.numero)} · Laboratório de Gestão II · FACC/UFJF · versão ${esc(D.modulo.versao)}</p>
      <div class="logos">
        <img src="assets/logo_facc.png" alt="FACC">
        <img src="assets/logo_ufjf.svg" alt="UFJF">
        <img src="assets/logo_mg.svg" alt="Governo de Minas Gerais">
      </div>
    </footer>`;
  }

  ir(telaCapa);
})();
