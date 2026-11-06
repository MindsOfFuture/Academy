/* Telas do Módulo 1. Todo texto de conteúdo vem de window.MODULO1, sem edição.
   As respostas ficam só neste aparelho. */
(function () {
  "use strict";
  const D = window.MODULO1, M = Motor.montar(D);
  const tela = document.getElementById("tela");
  const CHAVE = "lg2-turma-a-m01";
  const VERSAO = 4;                  // muda quando o conjunto de perguntas muda (v4: nova Pergunta 3A e Pergunta 8 com várias respostas)
  const vazio = (s) => !s || !String(s).trim() || s === "—" || s === "-" || s === "Nenhum" || s === "Nenhuma";

  let S = carregar();                // { v, R: respostas, atual: código da tela atual }
  Motor.remapear(M, S.R);           // P4/P8 no texto do tipo escolhido na 3A (mesmo formato salvo)
  /* pergunta como aparece para esta pessoa (enunciado/opções/exemplo conforme o tipo da 3A) */
  const Q = (c, R) => Motor.efetiva(M, R || S.R, M.porCodigo[c]);
  function carregar() {
    try {
      const s = JSON.parse(localStorage.getItem(CHAVE));
      if (s && s.v === 2 && s.R) return migrar3(migrar2(s));
      if (s && s.v === 3 && s.R) return migrar3(s);
      return s && s.v === VERSAO && s.R ? s : novo();
    }
    catch { return novo(); }
  }
  /* v2 -> v3 (ajuste do "Não sei"): as perguntas são as mesmas; só some a resposta que deixou de
     existir ("Não sei dizer" fora da 5A e da 7A, "Ainda não sei" da Pergunta 3). A pessoa volta
     para a primeira pergunta que ficou sem resposta. */
  function migrar2(s) {
    let tirou = false;
    Object.keys(s.R).forEach((c) => {
      const q = M.porCodigo[c];
      const r = s.R[c];
      if (!q || !Motor.completa(q, r) || (r.estado === "naosei" && !q.botao_naosei)) { delete s.R[c]; tirou = true; }
    });
    s.v = 3;
    if (tirou) {
      const falta = Motor.caminho(M, s.R).find((c) => !Motor.completa(M.porCodigo[c], s.R[c]));
      s.atual = falta || "RESULTADO";
    }
    return s;
  }
  /* v3 -> v4: a Pergunta 8 passou a aceitar várias respostas. A resposta única vira uma lista com ela
     (nada é descartado). Entrou a Pergunta 3A: quem já tinha terminado volta para ela. */
  function migrar3(s) {
    const r = s.R["M1.P08"];
    if (r && r.estado === "opcao" && !Array.isArray(r.opcoes)) r.opcoes = [r.opcao];
    if (r && !Motor.completa(M.porCodigo["M1.P08"], r)) delete s.R["M1.P08"];
    s.v = VERSAO;
    if (s.atual === "RESULTADO") s.atual = faltando(s.R) || "RESULTADO";
    return s;
  }
  /* primeira pergunta do caminho ainda sem resposta (ou null) */
  function faltando(R) { return Motor.caminho(M, R).find((c) => !Motor.completa(Motor.efetiva(M, R, M.porCodigo[c]), R[c])) || null; }
  function novo() { return { v: VERSAO, R: {}, atual: null }; }
  function salvar() { try { localStorage.setItem(CHAVE, JSON.stringify(S)); } catch {} }

  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  /* menos texto na tela: texto longo mostra a 1ª frase e o resto fica em "Ver mais" (fechado) */
  const TEXTO_LONGO = 220;
  function resumo(t, cls) {
    const s = String(t ?? "").trim();
    const m = s.length > TEXTO_LONGO && s.match(/^([^]+?[.!?])\s+([^]+)$/);
    if (!m) return `<p${cls ? ` class="${cls}"` : ""}>${esc(s)}</p>`;
    return `<p${cls ? ` class="${cls}"` : ""}>${esc(m[1])}</p><details class="ver-mais"><summary>Ver mais</summary><p>${esc(m[2])}</p></details>`;
  }
  function el(html) { const d = document.createElement("div"); d.innerHTML = html.trim(); return d.firstElementChild; }
  function ir(f, a) { parar(); fecharVideo(); tela.innerHTML = ""; tela.appendChild(f(a)); window.scrollTo(0, 0); }

  /* ---------- teclado do celular: o campo em foco vai para o meio da parte visível da tela ----------
     Um só listener. Roda ~300 ms depois do foco (tempo de o teclado abrir) e de novo a cada mudança do
     tamanho visível (visualViewport) enquanto o foco estiver no campo. O Continuar fica logo abaixo. */
  const CAMPO = "input, textarea, select";
  const ESPERA_TECLADO = 300;
  function centralizar() {
    const a = document.activeElement;
    if (a && a.matches && a.matches(CAMPO)) a.scrollIntoView({ block: "center" });
  }
  document.addEventListener("focusin", (e) => {
    if (e.target && e.target.matches && e.target.matches(CAMPO)) setTimeout(centralizar, ESPERA_TECLADO);
  });
  if (window.visualViewport) window.visualViewport.addEventListener("resize", centralizar);

  /* ---------- ícones simples das listas ---------- */
  const SVG = (d) => `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
  const ICO = {
    pessoa: SVG('<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/>'),
    ideia: SVG('<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>'),
    certo: SVG('<circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.8 2.8L16 10"/>'),
    nao: SVG('<circle cx="12" cy="12" r="9"/><path d="M9 9l6 6M15 9l-6 6"/>'),
    info: SVG('<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>'),
  };
  function blocos(lista, icones, classes) {
    return lista.map((b, i) => `
      <section class="bloco-lista ${classes ? classes[i] : ""}">
        <h3>${esc(b.titulo)}</h3>
        <ul>${b.lista.map((t) => `<li>${ICO[icones[i]]}<span>${esc(t)}</span></li>`).join("")}</ul>
      </section>`).join("");
  }

  /* ---------- Ouvir: lê a tela em voz alta ---------- */
  const fala = "speechSynthesis" in window && typeof window.SpeechSynthesisUtterance === "function" ? window.speechSynthesis : null;
  function parar() { if (fala) try { fala.cancel(); } catch {} }
  function botaoOuvir() { return fala ? `<button class="ouvir" type="button" data-ouvir>${SVG('<path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/>')}<span>Ouvir</span></button>` : ""; }
  function textoDaTela(p) {
    const partes = [];
    p.querySelectorAll("[data-ler]").forEach((e) => {
      if (e.closest("[hidden]") || e.closest("details:not([open]) > :not(summary)")) return;
      const t = e.innerText.replace(/\s+/g, " ").trim();
      if (t) partes.push(t);
    });
    return partes.join(". ").replace(/\.\s*\./g, ".");
  }
  function ligarOuvir(p) {
    const b = p.querySelector("[data-ouvir]");
    if (!b) return;
    b.onclick = () => {
      if (fala.speaking) { parar(); return; }
      const u = new SpeechSynthesisUtterance(textoDaTela(p));
      u.lang = "pt-BR";
      const voz = fala.getVoices().find((v) => /^pt(-|_)BR/i.test(v.lang));
      if (voz) u.voice = voz;
      fala.speak(u);
    };
  }

  /* ---------- peças do layout (as mesmas do Módulo 5) ---------- */
  const PARTE = "Parte " + D.modulo.numero;        // o documento do grupo chama o módulo de "Parte 1"
  function topo(trilha) {
    return `<div class="barra-topo">
      <img class="logo-mini" src="assets/minds.svg" alt="Minds of the Future">
      <nav class="trilha" aria-label="Você está em"><button class="trilha-link" type="button" data-inicio>Início</button><span>/</span><span>${esc(PARTE)}</span>${trilha ? `<span>/</span><span>${esc(trilha)}</span>` : ""}</nav>
    </div>`;
  }
  /* faixa roxa pequena: "< Voltar" e Ouvir no topo (regra do Módulo 1), título e, se houver, barra de progresso */
  function faixa(o) {
    return `<header class="heroi topo">
      <div class="topo-linha"><button class="voltar" id="v">&lt; Voltar</button>${botaoOuvir()}</div>
      <div class="heroi-topo">
        <div class="heroi-txt">
          ${o.kicker ? `<div class="kicker ${o.kickerClasse || ""}"${o.ler ? " data-ler" : ""}>${esc(o.kicker)}</div>` : ""}
          <h2 class="heroi-tit"${o.ler ? " data-ler" : ""}>${esc(o.titulo)}</h2>
        </div>
        <img class="heroi-img" src="assets/hero-tela.webp" alt="">
      </div>
      ${o.barra || ""}
    </header>`;
  }
  function ligarInicio(p) { p.querySelectorAll("[data-inicio]").forEach((b) => { b.onclick = () => ir(telaInicio); }); }

  function rodape() {
    return `<footer class="rodape">
      <p class="credito">${esc(D.limites.rodape)}</p>
      <div class="logos">
        <img src="assets/logo_facc.png" alt="FACC">
        <img src="assets/logo_ufjf.svg" alt="UFJF">
        <img src="assets/logo_mg.svg" alt="Governo de Minas Gerais">
      </div>
    </footer>`;
  }

  /* ================= tela inicial ================= */
  function telaInicio() {
    const I = D.inicio;
    const iniciado = Object.keys(S.R).length > 0 || !!S.atual;
    const p = el(`
      <div class="pag">
        ${topo("")}
        <header class="heroi heroi-grande capa">
          <div class="heroi-topo">
            <div class="heroi-txt">
              <div class="heroi-linha"><div class="kicker sobre" data-ler>${esc(I.rotulo)}</div>${botaoOuvir()}</div>
              <h1 class="heroi-tit" data-ler>${esc(I.titulo)}</h1>
              <p data-ler>${esc(I.descricao)}</p>
            </div>
            <img class="heroi-img" src="assets/hero-inicio.webp" alt="">
          </div>
        </header>
        <main class="corpo" data-ler>
          ${blocos(I.blocos, ["pessoa", "ideia", "certo"])}
          ${I.jornada ? `<p class="jornada-tempo">${esc(I.jornada)}</p>` : ""}
        </main>
        <div class="fixo">
          <p class="tempo" data-ler>${esc(I.tempo)}</p>
          <button class="btn btn-primario seta" id="ir">${esc(I.botao)}</button>
          <button class="link" id="limites">${esc(I.link)}</button>
          ${iniciado ? `<button class="link" id="zerar">Apagar respostas e recomeçar</button>` : ""}
        </div>
        <div class="corpo">${rodape()}</div>
      </div>`);
    ligarInicio(p);
    p.querySelector("#ir").onclick = () => {
      if (S.atual === "RESULTADO") return ir(telaResultado);
      ir(telaPergunta, S.atual && M.porCodigo[S.atual] ? S.atual : Motor.proxima(M, S.R, null));
    };
    const z = p.querySelector("#zerar");
    if (z) z.onclick = () => { if (confirm("Apagar suas respostas e recomeçar?")) { S = novo(); salvar(); ir(telaInicio); } };
    p.querySelector("#limites").onclick = () => ir(telaLimites);
    ligarOuvir(p);
    return p;
  }

  /* ================= O que esta parte não faz ================= */
  function telaLimites() {
    const L = D.limites;
    const p = el(`
      <div class="pag">
        ${topo(L.titulo)}
        ${faixa({ titulo: L.titulo, ler: true })}
        <main class="corpo">
          <div data-ler>${blocos(L.blocos, ["nao", "certo", "info"], ["b-nao", "", ""])}</div>
          <div class="aviso-roxo" data-ler>${esc(L.aviso)}</div>
          ${rodape()}
        </main>
      </div>`);
    p.querySelector("#v").onclick = () => ir(telaInicio);
    ligarInicio(p);
    ligarOuvir(p);
    return p;
  }

  /* ================= pergunta ================= */
  function progresso(cod) {
    const cam = Motor.caminho(M, S.R);
    const i = cam.indexOf(cod);
    return Math.max(4, Math.round(((i < 0 ? 0 : i) / cam.length) * 100));
  }
  /* respostas de perguntas que deixaram de aparecer são descartadas */
  function limparInvisiveis() {
    for (let k = 0; k < 5; k++) {
      const vis = new Set(Motor.caminho(M, S.R));
      let mudou = false;
      Object.keys(S.R).forEach((c) => { if (!vis.has(c)) { delete S.R[c]; mudou = true; } });
      if (!mudou) break;
    }
  }
  function caixaMensagem(m) {
    if (!m) return "";
    const cls = m.titulo === "Dica" ? "msg-dica" : "msg-tudobem";
    return `<div class="msg ${cls}" role="status" data-ler><b>${esc(m.titulo)}</b><p>${esc(m.texto)}</p></div>`;
  }

  /* ---------- card de vídeo (Perguntas 3 e 7) ----------
     Só aparece quando o vídeo do grupo chegar: basta preencher "video.url" nos dados.
     O vídeo abre por cima da pergunta; ao terminar ou fechar, a pessoa volta para a mesma
     pergunta, sem resposta gravada. */
  function cartaoVideo(q) {
    if (!q.video || !q.video.url) return "";
    return `<button class="video-card" type="button" data-video>${SVG('<circle cx="12" cy="12" r="10"/><path d="M10 8.5v7l6-3.5z" fill="currentColor"/>')}<span data-ler>${esc(q.video.texto)}</span></button>`;
  }
  let videoAberto = null;
  function fecharVideo() {
    if (!videoAberto) return;
    const { caixa, volta } = videoAberto;
    videoAberto = null;
    document.removeEventListener("keydown", teclaVideo);
    caixa.remove();
    document.body.classList.remove("com-video");
    if (volta && document.contains(volta)) volta.focus();
  }
  function teclaVideo(e) { if (e.key === "Escape") fecharVideo(); }
  function abrirVideo(v, volta) {
    parar(); fecharVideo();
    const arquivo = /\.(mp4|webm|ogg|m4v)(\?|#|$)/i.test(v.url);
    const midia = arquivo
      ? `<video class="video-midia" src="${esc(v.url)}" controls autoplay playsinline></video>`
      : `<iframe class="video-midia" src="${esc(v.url)}" title="${esc(v.texto)}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
    const caixa = el(`<div class="video-fundo" role="dialog" aria-modal="true" aria-label="${esc(v.texto)}">
      <div class="video-caixa">
        <button class="video-fechar" type="button" data-fechar>Fechar vídeo</button>
        ${midia}
      </div>
    </div>`);
    caixa.querySelector("[data-fechar]").onclick = fecharVideo;
    caixa.onclick = (e) => { if (e.target === caixa) fecharVideo(); };
    const vid = caixa.querySelector("video");
    if (vid) vid.addEventListener("ended", fecharVideo);
    document.body.appendChild(caixa);
    document.body.classList.add("com-video");
    document.addEventListener("keydown", teclaVideo);
    videoAberto = { caixa, volta };
    caixa.querySelector("[data-fechar]").focus();
  }

  function telaPergunta(cod) {
    const q = Q(cod);
    S.atual = cod; salvar();
    const p = el(`
      <div class="pag">
        ${topo("")}
        ${faixa({ kicker: PARTE, titulo: D.inicio.titulo, barra: `<div class="barra" role="progressbar" aria-label="Progresso" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progresso(cod)}"><div class="barra-fill" style="width:${progresso(cod)}%"></div></div>` })}
        <main class="corpo">
          <div class="cartao-q">
            <div class="pergunta" data-cod="${esc(cod)}">
              <h2 class="q" data-ler>${esc(Motor.textoPergunta(M, S.R, q))}</h2>
              <p class="apoio" data-ler>${esc(q.apoio)}</p>
              <div class="entrada" id="ent"></div>
              ${cartaoVideo(q)}
            </div>
            <div id="msg"></div>
            ${q.ajuda ? `<details class="ajuda-box"><summary data-ler>O que quer dizer isso?</summary>
              <p data-ler>${esc(q.ajuda.texto)}</p>${vazio(q.ajuda.exemplo) ? "" : `<p class="ex" data-ler>${esc(q.ajuda.exemplo)}</p>`}</details>` : ""}
          </div>
        </main>
        <div class="fixo"><button class="btn btn-primario seta" id="ok" disabled>Continuar</button></div>
      </div>`);
    ligarInicio(p);
    const ent = p.querySelector("#ent"), msg = p.querySelector("#msg"), ok = p.querySelector("#ok");

    function atualizar() {
      const r = S.R[cod];
      const pronto = Motor.completa(q, r);
      ok.disabled = !pronto;
      ok.setAttribute("aria-disabled", String(!pronto));
      let m = null;
      if (q.tipo === "multipla") {
        const marc = r && Array.isArray(r.opcoes) ? r.opcoes : [];
        ent.querySelectorAll(".opcao").forEach((b) => {
          const sel = marc.includes(b.dataset.op);
          b.classList.toggle("sel", sel);
          b.setAttribute("aria-pressed", String(sel));
        });
        /* caixas de dica: uma para cada opção marcada que tiver */
        const ms = q.opcoes.filter((o) => marc.includes(o.texto) && o.mensagem).map((o) => o.mensagem);
        msg.innerHTML = ms.map(caixaMensagem).join("");
        const extra = ent.querySelector(".outra");
        if (extra) extra.hidden = !q.opcoes.some((o) => o.campo && marc.includes(o.texto));
        return;
      } else if (q.tipo === "escolha") {
        ent.querySelectorAll(".opcao").forEach((b) => {
          const sel = !!r && r.estado === "opcao" && r.opcao === b.dataset.op;
          b.classList.toggle("sel", sel);
          b.setAttribute("aria-pressed", String(sel));
        });
        const op = r && r.estado === "opcao" ? q.opcoes.find((o) => o.texto === r.opcao) : null;
        m = op ? op.mensagem : null;
        const extra = ent.querySelector(".outra");
        if (extra) extra.hidden = !(op && op.campo);
      } else {
        const ns = ent.querySelector("#ns");
        const sel = !!r && r.estado === "naosei";
        if (ns) { ns.classList.toggle("sel", sel); ns.setAttribute("aria-pressed", String(sel)); }
        m = sel && q.botao_naosei ? q.botao_naosei.mensagem : null;
      }
      msg.innerHTML = caixaMensagem(m);
    }
    function gravar(r) {
      if (r) S.R[cod] = r; else delete S.R[cod];
      limparInvisiveis();
      Motor.remapear(M, S.R);
      salvar();
      atualizar();
    }

    if (q.tipo === "multipla") {
      ent.classList.add("opcoes", "multi");
      const lista = (r) => (r && Array.isArray(r.opcoes) ? r.opcoes : []);
      /* guarda as marcadas na ordem da lista; "opcao" = a primeira, para quem lê só uma resposta */
      const guardar = (marc, detalhe) => {
        const ord = q.opcoes.map((o) => o.texto).filter((t) => marc.includes(t));
        if (!ord.length) return gravar(null);
        const r = { estado: "opcao", opcao: ord[0], opcoes: ord };
        if (detalhe && q.opcoes.some((o) => o.campo && ord.includes(o.texto))) r.detalhe = detalhe;
        gravar(r);
      };
      q.opcoes.forEach((op) => {
        const b = el(`<button class="opcao" type="button" data-op="${esc(op.texto)}" aria-pressed="false"><span class="radio" aria-hidden="true"></span><span class="op-txt"><b data-ler>${esc(op.texto)}</b></span><span class="check" aria-hidden="true">✓</span></button>`);
        b.onclick = () => {
          const ant = S.R[cod];
          const marc = lista(ant);
          const novaLista = marc.includes(op.texto) ? marc.filter((t) => t !== op.texto) : marc.concat(op.texto);
          guardar(novaLista, ant && ant.detalhe);
          if (op.campo && novaLista.includes(op.texto)) { const t = ent.querySelector(".outra textarea"); if (t) t.focus(); }
        };
        ent.appendChild(b);
        if (op.campo) {
          const r0 = S.R[cod];
          const box = el(`<div class="outra" hidden><textarea class="campo" rows="2" aria-label="${esc(op.texto)}">${esc(r0 && r0.detalhe ? r0.detalhe : "")}</textarea></div>`);
          box.querySelector("textarea").oninput = (e) => {
            const r = S.R[cod];
            if (!r) return;
            if (e.target.value) r.detalhe = e.target.value; else delete r.detalhe;
            salvar(); atualizar();
          };
          ent.appendChild(box);
        }
      });
    } else if (q.tipo === "escolha") {
      ent.classList.add("opcoes");
      q.opcoes.forEach((op) => {
        const b = el(`<button class="opcao" type="button" data-op="${esc(op.texto)}" aria-pressed="false"><span class="radio" aria-hidden="true"></span><span class="op-txt"><b data-ler>${esc(op.texto)}</b></span><span class="check" aria-hidden="true">✓</span></button>`);
        b.onclick = () => {
          const ant = S.R[cod];
          const r = { estado: "opcao", opcao: op.texto };
          if (op.campo && ant && ant.opcao === op.texto && ant.detalhe) r.detalhe = ant.detalhe;
          gravar(r);
          if (op.campo) { const t = ent.querySelector(".outra textarea"); if (t) t.focus(); }
        };
        ent.appendChild(b);
        if (op.campo) {
          const r0 = S.R[cod];
          const box = el(`<div class="outra" hidden><textarea class="campo" rows="2" aria-label="${esc(op.texto)}">${esc(r0 && r0.opcao === op.texto ? r0.detalhe || "" : "")}</textarea></div>`);
          box.querySelector("textarea").oninput = (e) => {
            S.R[cod] = { estado: "opcao", opcao: op.texto, detalhe: e.target.value };
            salvar(); atualizar();
          };
          ent.appendChild(box);
        }
      });
    } else {
      const r0 = S.R[cod];
      const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
      ent.appendChild(el(`<div>
        <textarea class="campo" id="txt" rows="3" placeholder="${esc(q.placeholder || "")}" aria-label="${esc(q.pergunta)}">${esc(r0 && r0.estado === "valor" ? r0.valor : "")}</textarea>
        <div class="alt">
          ${Rec && q.botao_falar ? `<button class="btn-alt" type="button" id="falar">${SVG('<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>')}<span>${esc(q.botao_falar)}</span></button>` : ""}
          ${q.botao_naosei ? `<button class="btn-alt btn-ns" type="button" id="ns" aria-pressed="false"><span data-ler>${esc(q.botao_naosei.texto)}</span><span class="check" aria-hidden="true">✓</span></button>` : ""}
        </div>
      </div>`));
      const txt = ent.querySelector("#txt");
      txt.oninput = () => gravar(txt.value.trim() ? { estado: "valor", valor: txt.value } : null);
      const ns = ent.querySelector("#ns");
      if (ns) ns.onclick = () => { txt.value = ""; gravar({ estado: "naosei", texto: q.botao_naosei.texto }); };
      const fb = ent.querySelector("#falar");
      if (fb) {
        let rec = null;
        const rotulo = fb.querySelector("span");
        fb.onclick = () => {
          if (rec) { rec.stop(); return; }
          rec = new Rec();
          rec.lang = "pt-BR"; rec.interimResults = false; rec.maxAlternatives = 1;
          fb.classList.add("gravando"); rotulo.textContent = "Ouvindo… toque para parar";
          rec.onresult = (e) => {
            const t = Array.from(e.results).map((x) => x[0].transcript).join(" ").trim();
            if (t) { txt.value = (txt.value.trim() ? txt.value.trim() + " " : "") + t; txt.dispatchEvent(new Event("input")); }
          };
          const parar = () => { rec = null; fb.classList.remove("gravando"); rotulo.textContent = q.botao_falar; };
          rec.onend = parar;
          rec.onerror = (e) => {
            parar();
            const motivo = e && e.error;
            const msg = motivo === "not-allowed" || motivo === "service-not-allowed"
              ? "O navegador não deixou usar o microfone. Toque no cadeado ao lado do endereço do site, permita o microfone e tente de novo, ou escreva a resposta."
              : motivo === "no-speech" ? "Não ouvimos nada. Toque em falar e tente de novo, mais perto do microfone."
              : "Não deu para ouvir agora. Você pode escrever a resposta.";
            let av = ent.querySelector("#falar-aviso");
            if (!av) { av = el('<p id="falar-aviso" class="falar-aviso" role="status"></p>'); fb.parentNode.after(av); }
            av.textContent = msg;
          };
          try { rec.start(); } catch { parar(); }
        };
      }
    }
    atualizar();

    p.querySelector("#v").onclick = () => {
      const cam = Motor.caminho(M, S.R);
      const i = cam.indexOf(cod);
      if (i > 0) ir(telaPergunta, cam[i - 1]); else { S.atual = null; salvar(); ir(telaInicio); }
    };
    const cv = p.querySelector("[data-video]");
    if (cv) cv.onclick = () => abrirVideo(q.video, cv);
    ok.onclick = () => {
      if (!Motor.completa(q, S.R[cod])) return;
      let prox = Motor.proxima(M, S.R, cod);
      if (prox === "RESULTADO" && faltando(S.R)) prox = faltando(S.R);   // ex.: pergunta nova que ficou para trás
      if (prox === "RESULTADO") { S.atual = "RESULTADO"; salvar(); ir(telaResultado); }
      else ir(telaPergunta, prox);
    };
    ligarOuvir(p);
    return p;
  }

  /* ================= resultado: retrato inicial =================
     Junta as respostas do usuário com os textos do Mapa e gera o que a tela inicial promete: o que falta
     descobrir (respostas "Não sei" ou vagas) e uma tarefa fácil para fazer já. */
  function telaResultado() {
    const lista = Motor.retrato(M, S.R);
    const regras = Motor.regrasTodas(M, S.R);
    const falta = Motor.faltaDescobrir(M, S.R), tarefa = Motor.tarefa(M, S.R), avisos = Motor.avisos(M, S.R);
    const mostra = (x) => x.detalhe ? `${x.valor}: ${x.detalhe}` : x.valor;
    const entendemos = Motor.entendimento(M, S.R);
    const p = el(`
      <div class="pag">
        ${topo("Retrato inicial")}
        ${faixa({ kicker: "Resultado", kickerClasse: "passo", titulo: "Retrato inicial", ler: true })}
        <main class="corpo">
          <section class="concluido">
            <div class="conc-topo"><span class="conc-check" aria-hidden="true"></span><div><h2 data-ler>Você concluiu a ${esc(PARTE)}</h2><p data-ler>Veja abaixo o seu retrato inicial.</p></div></div>
          </section>
          ${entendemos.length ? `<section class="entendemos" data-ler>
            <h3>O que entendemos até aqui</h3>
            ${entendemos.map((f) => `<p>${esc(f)}</p>`).join("")}
          </section>` : ""}
          ${avisos.map((a) => `<div class="bloco b-aviso" role="status" data-ler><b>Confira esta combinação</b><p>${esc(a)}</p></div>`).join("")}
          <div class="bloco b-lacuna" data-ler><b>O que ainda falta descobrir</b>${falta.length
            ? `<ul>${falta.map((f) => `<li>${esc(f)}</li>`).join("")}</ul>`
            : `<p class="nada-falta">${esc(Motor.NADA_FALTA)}</p>`}</div>
          <div class="tarefa" data-ler><b>Sua tarefa para fazer já</b><p>${esc(tarefa)}</p></div>

          <details class="ajuda-box respostas">
            <summary data-ler>Ver suas respostas</summary>
            <div class="respostas-lista" data-ler>
            ${lista.map((x) => `
              <div class="cartao resp ${x.naosei ? "resp-ns" : ""}">
                <p class="mini-info">${esc(x.pergunta)}</p>
                ${x.itens ? `<ul class="resp-itens">${x.itens.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>` : `<h3>${esc(mostra(x))}</h3>`}
              </div>`).join("")}
            </div>
          </details>

          ${regras.map((r) => `<div class="regra"><p class="r-texto">${esc(r.texto)}</p></div>`).join("")}


          <div class="cartao" data-ler><h3>Quando procurar um profissional</h3>${resumo(D.mapa.encaminhamentos)}</div>

          <details class="ajuda-box para-onde">
            <summary data-ler>Para onde seguem estas informações</summary>
            ${D.conexoes.filter((c) => c.nome).map((c) => `<div class="cartao" data-ler><h3>Módulo ${esc(String(c.modulo).replace(/\.0$/, ""))}: ${esc(c.nome)}</h3><p>${esc(c.envia)}</p><p class="mini-info">${esc(c.obs)}</p></div>`).join("")}
          </details>

          <div class="aviso-roxo" data-ler>${resumo(D.mapa.mensagem_limite)}</div>

          <div class="acoes">
            <button class="btn btn-primario" id="imp">Salvar ou imprimir</button>
            <button class="btn btn-claro" id="rev">Revisar respostas</button>
            <button class="btn btn-linha" id="novo">Começar de novo</button>
          </div>
          <div class="acoes lg2-proximo"><a class="btn btn-primario" style="text-decoration:none;text-align:center;box-sizing:border-box" href="/lg2/turma-b/m02/index.html">Ir para o Módulo 2</a></div>
          ${rodape()}
        </main>
      </div>`);
    p.querySelector("#v").onclick = () => { const cam = Motor.caminho(M, S.R); ir(telaPergunta, cam[cam.length - 1]); };
    p.querySelector("#imp").onclick = () => { p.querySelectorAll("details").forEach((d) => { d.open = true; }); window.print(); };
    p.querySelector("#rev").onclick = () => ir(telaPergunta, Motor.proxima(M, {}, null));
    p.querySelector("#novo").onclick = () => { if (confirm("Começar de novo? As respostas atuais serão apagadas.")) { S = novo(); salvar(); ir(telaInicio); } };
    ligarInicio(p);
    ligarOuvir(p);
    return p;
  }

  ir(telaInicio);
})();
