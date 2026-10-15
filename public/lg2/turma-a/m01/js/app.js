/* Telas do Módulo 1. Todo texto de conteúdo vem de window.MODULO1, sem edição.
   As respostas ficam só neste aparelho. */
(function () {
  "use strict";
  const D = window.MODULO1, M = Motor.montar(D);
  const tela = document.getElementById("tela");
  const CHAVE = "lg2-turma-a-m01";
  const VERSAO = 2;                  // muda quando o conjunto de perguntas muda: respostas antigas são descartadas
  const vazio = (s) => !s || !String(s).trim() || s === "—" || s === "-" || s === "Nenhum" || s === "Nenhuma";

  let S = carregar();                // { v, R: respostas, atual: código da tela atual }
  function carregar() {
    try { const s = JSON.parse(localStorage.getItem(CHAVE)); return s && s.v === VERSAO && s.R ? s : novo(); }
    catch { return novo(); }
  }
  function novo() { return { v: VERSAO, R: {}, atual: null }; }
  function salvar() { try { localStorage.setItem(CHAVE, JSON.stringify(S)); } catch {} }

  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  function el(html) { const d = document.createElement("div"); d.innerHTML = html.trim(); return d.firstElementChild; }
  function ir(f, a) { parar(); tela.innerHTML = ""; tela.appendChild(f(a)); window.scrollTo(0, 0); }

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
        <header class="capa">
          <div class="capa-topo"><img class="logo" src="assets/minds.svg" alt="Minds of the Future">${botaoOuvir()}</div>
          <div class="sobre" data-ler>${esc(I.rotulo)}</div>
          <h1 data-ler>${esc(I.titulo)}</h1>
          <p data-ler>${esc(I.descricao)}</p>
        </header>
        <main class="corpo" data-ler>
          ${blocos(I.blocos, ["pessoa", "ideia", "certo"])}
        </main>
        <div class="fixo">
          <p class="tempo" data-ler>${esc(I.tempo)}</p>
          <button class="btn btn-primario" id="ir">${esc(I.botao)}</button>
          <button class="link" id="limites">${esc(I.link)}</button>
          ${iniciado ? `<button class="link" id="zerar">Apagar respostas e recomeçar</button>` : ""}
        </div>
        <div class="corpo">${rodape()}</div>
      </div>`);
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
        <header class="topo">
          <div class="topo-linha"><button class="voltar" id="v">&lt; Voltar</button>${botaoOuvir()}</div>
          <h2 data-ler>${esc(L.titulo)}</h2>
        </header>
        <main class="corpo">
          <div data-ler>${blocos(L.blocos, ["nao", "certo", "info"], ["b-nao", "", ""])}</div>
          <div class="aviso-roxo" data-ler>${esc(L.aviso)}</div>
          ${rodape()}
        </main>
      </div>`);
    p.querySelector("#v").onclick = () => ir(telaInicio);
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

  function telaPergunta(cod) {
    const q = M.porCodigo[cod];
    S.atual = cod; salvar();
    const p = el(`
      <div class="pag">
        <header class="topo">
          <div class="topo-linha"><button class="voltar" id="v">&lt; Voltar</button>${botaoOuvir()}</div>
          <div class="barra" role="progressbar" aria-label="Progresso" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progresso(cod)}"><div class="barra-fill" style="width:${progresso(cod)}%"></div></div>
        </header>
        <main class="corpo">
          <div class="pergunta" data-cod="${esc(cod)}">
            <h2 class="q" data-ler>${esc(Motor.textoPergunta(M, S.R, q))}</h2>
            <p class="apoio" data-ler>${esc(q.apoio)}</p>
            <div class="entrada" id="ent"></div>
          </div>
          <div id="msg"></div>
          ${q.ajuda ? `<details class="ajuda-box"><summary data-ler>O que quer dizer isso?</summary>
            <p data-ler>${esc(q.ajuda.texto)}</p>${vazio(q.ajuda.exemplo) ? "" : `<p class="ex" data-ler>${esc(q.ajuda.exemplo)}</p>`}</details>` : ""}
        </main>
        <div class="fixo"><button class="btn btn-primario" id="ok" disabled>Continuar</button></div>
      </div>`);
    const ent = p.querySelector("#ent"), msg = p.querySelector("#msg"), ok = p.querySelector("#ok");

    function atualizar() {
      const r = S.R[cod];
      const pronto = Motor.completa(q, r);
      ok.disabled = !pronto;
      ok.setAttribute("aria-disabled", String(!pronto));
      let m = null;
      if (q.tipo === "escolha") {
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
      salvar();
      atualizar();
    }

    if (q.tipo === "escolha") {
      ent.classList.add("opcoes");
      q.opcoes.forEach((op) => {
        const b = el(`<button class="opcao" type="button" data-op="${esc(op.texto)}" aria-pressed="false"><b data-ler>${esc(op.texto)}</b><span class="check" aria-hidden="true">✓</span></button>`);
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
          rec.onend = rec.onerror = () => { rec = null; fb.classList.remove("gravando"); rotulo.textContent = q.botao_falar; };
          try { rec.start(); } catch { rec.onend(); }
        };
      }
    }
    atualizar();

    p.querySelector("#v").onclick = () => {
      const cam = Motor.caminho(M, S.R);
      const i = cam.indexOf(cod);
      if (i > 0) ir(telaPergunta, cam[i - 1]); else { S.atual = null; salvar(); ir(telaInicio); }
    };
    ok.onclick = () => {
      if (!Motor.completa(q, S.R[cod])) return;
      const prox = Motor.proxima(M, S.R, cod);
      if (prox === "RESULTADO") { S.atual = "RESULTADO"; salvar(); ir(telaResultado); }
      else ir(telaPergunta, prox);
    };
    ligarOuvir(p);
    return p;
  }

  /* ================= resultado: retrato inicial =================
     Junta as respostas do usuário com os textos que o grupo escreveu no Mapa. */
  function telaResultado() {
    const lista = Motor.retrato(M, S.R);
    const regras = Motor.regrasTodas(M, S.R);
    const naosei = lista.filter((x) => x.naosei);
    const mostra = (x) => x.detalhe ? `${x.valor}: ${x.detalhe}` : x.valor;
    const p = el(`
      <div class="pag">
        <header class="topo">
          <div class="topo-linha"><button class="voltar" id="v">&lt; Voltar</button>${botaoOuvir()}</div>
          <div class="passo" data-ler>Resultado</div>
          <h2 data-ler>Retrato inicial</h2>
        </header>
        <main class="corpo">
          <div class="cartao" data-ler><h3>O que você recebe no final</h3><p>${esc(D.mapa.entrega)}</p></div>

          <div class="secao-titulo" data-ler>Suas respostas</div>
          ${lista.map((x) => `
            <div class="cartao resp ${x.naosei ? "resp-ns" : ""}" data-ler>
              <p class="mini-info">${esc(x.pergunta)}</p>
              <h3>${esc(mostra(x))}</h3>
            </div>`).join("")}

          ${regras.map((r) => `<div class="regra"><p class="r-texto">${esc(r.texto)}</p></div>`).join("")}

          ${naosei.length ? `<div class="bloco b-lacuna" data-ler><b>Perguntas que você ainda não soube responder</b><ul>${naosei.map((x) => `<li>${esc(x.pergunta)}</li>`).join("")}</ul></div>` : ""}

          <div class="cartao" data-ler><h3>Quando procurar um profissional</h3><p>${esc(D.mapa.encaminhamentos)}</p></div>

          <div class="secao-titulo" data-ler>Para onde seguem estas informações</div>
          ${D.conexoes.filter((c) => c.nome).map((c) => `<div class="cartao" data-ler><h3>Módulo ${esc(String(c.modulo).replace(/\.0$/, ""))}: ${esc(c.nome)}</h3><p>${esc(c.envia)}</p><p class="mini-info">${esc(c.obs)}</p></div>`).join("")}

          <div class="aviso-roxo" data-ler>${esc(D.mapa.mensagem_limite)}</div>

          <div class="acoes">
            <button class="btn btn-primario" id="imp">Salvar ou imprimir</button>
            <button class="btn btn-claro" id="rev">Revisar respostas</button>
            <button class="btn btn-linha" id="novo">Começar de novo</button>
          </div>
          ${rodape()}
        </main>
      </div>`);
    p.querySelector("#v").onclick = () => { const cam = Motor.caminho(M, S.R); ir(telaPergunta, cam[cam.length - 1]); };
    p.querySelector("#imp").onclick = () => window.print();
    p.querySelector("#rev").onclick = () => ir(telaPergunta, Motor.proxima(M, {}, null));
    p.querySelector("#novo").onclick = () => { if (confirm("Começar de novo? As respostas atuais serão apagadas.")) { S = novo(); salvar(); ir(telaInicio); } };
    ligarOuvir(p);
    return p;
  }

  ir(telaInicio);
})();
