/* Telas do Módulo 3 (Turma A). Todo texto de conteúdo vem de window.MODULO3 (a planilha do
   grupo), sem edição. As respostas ficam só neste aparelho. */
(function () {
  "use strict";
  const D = window.MODULO3, M = Motor.montar(D);
  const tela = document.getElementById("tela");
  const CHAVE = "lg2-turma-a-m03";
  /* o módulo mudou de turma em 15/10: traz as respostas salvas na chave antiga */
  try { const antiga = localStorage.getItem("lg2-turma-b-m03"); if (antiga && !localStorage.getItem(CHAVE)) localStorage.setItem(CHAVE, antiga); } catch (e) {}
  const vazio = (s) => !s || !String(s).trim() || s === "—" || s === "-";

  /* VERSAO 3: 22 perguntas reescritas. Respostas da versão de 15 perguntas (v1/v2, inclusive as
     trazidas da chave antiga) são descartadas.
     VERSAO 4: perfil do cliente com marcadores e a dor copiada para a pergunta seguinte. As respostas
     da versão 3 têm os mesmos códigos e o mesmo formato: são mantidas (migração). */
  const VERSAO = 4;
  let S = carregar();               // { v, R: respostas, hist: [códigos] }
  function carregar() {
    try {
      const s = JSON.parse(localStorage.getItem(CHAVE));
      if (s && s.v === 3) s.v = VERSAO;
      const ok = s && s.v === VERSAO && s.R && typeof s.R === "object" && Array.isArray(s.hist) &&
        Object.keys(s.R).every((k) => M.porCodigo[k]) && s.hist.every((k) => k === "RESULTADO" || M.porCodigo[k]);
      return ok ? s : novo();
    } catch (e) { return novo(); }
  }
  function novo() { return { v: VERSAO, R: {}, hist: [] }; }
  function salvar() { try { localStorage.setItem(CHAVE, JSON.stringify(S)); } catch (e) {} }

  /* ===== o que já veio do Módulo 1 (só leitura; nunca grava na chave de outro módulo) ===== */
  function lerOutro(chave, cod) {
    try { const s = JSON.parse(localStorage.getItem(chave)); return (s && s.R && s.R[cod]) || null; } catch (e) { return null; }
  }
  const TIPOS = [["Produto", "um produto que você mesmo faz"], ["Mercadoria", "uma mercadoria que você compra pronta para revender"], ["Serviço", "um serviço"]];
  function heranca() {
    const p03 = lerOutro("lg2-turma-a-m01", "M1.P03"), p03a = lerOutro("lg2-turma-a-m01", "M1.P03A"), p01 = lerOutro("lg2-turma-a-m01", "M1.P01");
    const ideia = p03 && p03.estado === "valor" && !vazio(p03.valor) ? String(p03.valor).trim() : null;
    const t = p03a && p03a.estado === "opcao" ? TIPOS.find((x) => String(p03a.opcao).startsWith(x[0])) : null;
    const op = p01 && p01.estado === "opcao" ? String(p01.opcao) : "";
    const estagio = op === "Ainda está só na minha cabeça" ? "ideia" : /^Já fiz um pouco/.test(op) ? "comecando" : /^Já vend/.test(op) ? "vende" : null;
    return { ideia, tipo: t ? t[0] : null, tipoFrase: t ? t[1] : null, estagio,
      /* resposta pronta para "em que ramo e o que vende" */
      p01: ideia ? ideia + (t ? ` (${t[0].toLowerCase()})` : "") : null };
  }
  let H = heranca();
  const est = () => H.estagio;
  const enunciado = (q) => Motor.variante(q, est()).pergunta || q.pergunta;
  const rotulo = (q, c) => (Motor.variante(q, est()).campos || {})[c] || c;
  /* prompts: quem ainda não começou "quer vender"; o que vende entra no lugar do colchete */
  function adaptar(t) {
    let x = String(t);
    if (est() === "ideia") x = x.replace(/\bEu vendo \[/g, "Eu quero vender [");
    if (H.ideia) x = x.replace(/\[produto ou serviço\]/g, H.ideia);
    return x;
  }
  const selo = (txt) => `<p class="selo-m">${esc(txt)}</p>`;
  const SELO_M1 = "Veio do Módulo 1. Confira e ajuste se quiser.";
  const SELO_DOR = "Veio do perfil do cliente que você descreveu. Confira e ajuste se quiser.";
  function posicao(cod) {
    const ts = Motor.telas(M, S.R, H), k = ts.findIndex((t) => t.includes(cod));
    return k >= 0 ? `Pergunta ${k + 1} de ${ts.length}` : "Ajuste a sua resposta";
  }
  /* grava uma resposta; a dor escrita no perfil do cliente vira a resposta da pergunta seguinte */
  function gravarR(cod, r) {
    S.R[cod] = r;
    if (cod === "M3.P10") {
      const d = Motor.dorDoPerfil(S.R), p11 = S.R["M3.P11"];
      if (d && (!p11 || p11.doPerfil || (p11.estado === "valor" && vazio(p11.valor)))) S.R["M3.P11"] = { estado: "valor", valor: d, doPerfil: true };
      else if (!d && p11 && p11.doPerfil) delete S.R["M3.P11"];
    }
    /* "Não" na pergunta 2: as perguntas puladas não ficam no resumo */
    Object.keys(S.R).forEach((k) => { if (!Motor.visivel(M.porCodigo[k], S.R)) delete S.R[k]; });
    salvar();
  }

  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  function el(html) { const d = document.createElement("div"); d.innerHTML = html.trim(); return d.firstElementChild; }
  function ir(f, a, b) { H = heranca(); tela.innerHTML = ""; tela.appendChild(f(a, b)); window.scrollTo(0, 0); }

  function copiar(t, b) {
    const ok = () => (b.textContent = "Copiado");
    const reserva = () => {
      const a = document.createElement("textarea"); a.value = t; document.body.appendChild(a); a.select();
      try { document.execCommand("copy"); } catch (e) {} a.remove(); ok();
    };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(ok, reserva); else reserva();
  }

  /* caixa de retorno: Dica / Resposta / Alerta / Prompt de IA / Passo a passo (tipo "Nenhum" não aparece) */
  function caixa(c) {
    const cls = { Dica: "b-dica", Resposta: "b-resp", Alerta: "b-alerta", "Prompt de IA": "b-ia", "Passo a passo": "b-passos" }[c.tipo] || "b-dica";
    c = Object.assign({}, c, { texto: adaptar(c.texto) });
    let corpo = `<p>${esc(c.texto)}</p>`;
    if (c.tipo === "Prompt de IA") {
      const p = Motor.partesPrompt(c.texto);
      corpo = `${p.antes ? `<p class="antes">${esc(p.antes)}</p>` : ""}
        <div class="prompt"><p class="prompt-txt">${esc(p.prompt)}</p><button class="btn-copiar" type="button">Copiar texto</button></div>
        ${p.depois ? `<p class="conferir">${esc(p.depois)}</p>` : ""}`;
    } else if (c.tipo === "Passo a passo") {
      corpo = `<ol class="passos">${Motor.passos(c.texto).map((s) => `<li>${esc(s)}</li>`).join("")}</ol>`;
    }
    const b = el(`<div class="bloco caminho ${cls}" data-op="${esc(c.opcao)}" data-tipo="${esc(c.tipo)}" role="${c.tipo === "Alerta" ? "alert" : "note"}"><b>${esc(c.tipo)}</b>${corpo}</div>`);
    const bc = b.querySelector(".btn-copiar");
    if (bc) bc.onclick = () => copiar(b.querySelector(".prompt-txt").textContent, bc);
    return b;
  }
  function mostrar(box, lista) {
    box.innerHTML = "";
    lista.filter((c) => c.tipo !== "Nenhum").forEach((c) => box.appendChild(caixa(c)));
  }

  /* ================= peças do layout (as mesmas do Módulo 5) ================= */
  function topo(trilha) {
    return `<div class="barra-topo">
      <img class="logo-mini" src="assets/minds.svg" alt="Minds of the Future">
      <nav class="trilha" aria-label="Você está em"><button class="trilha-link" type="button" data-inicio>Início</button><span>/</span><span>Módulo ${esc(D.modulo.numero)}</span>${trilha ? `<span>/</span><span>${esc(trilha)}</span>` : ""}</nav>
    </div>`;
  }
  function heroi(o) {
    return `<section class="heroi ${o.grande ? "heroi-grande" : ""}">
      <div class="heroi-topo">
        <div class="heroi-txt">
          <div class="kicker ${o.kickerClasse || ""}">${esc(o.kicker || "Módulo " + D.modulo.numero)}</div>
          <${o.h1 ? "h1" : "h2"} class="heroi-tit ${o.titClasse || ""}">${esc(o.titulo)}</${o.h1 ? "h1" : "h2"}>
          ${o.texto ? `<p>${esc(o.texto)}</p>` : ""}
        </div>
        <img class="heroi-img" src="assets/${o.img || "hero-tela.webp"}" alt="">
      </div>
    </section>`;
  }
  /* etapas = os 4 blocos da planilha ("Bloco 1: ..." aparece como "Bloco 1"; o nome inteiro fica na faixa) */
  const curto = (b) => String(b).split(":")[0].trim();
  function etapas(n, tudo) {
    return `<ol class="etapas" aria-label="Blocos do módulo">${D.blocos.map((nome, i) => {
      const k = i + 1, st = tudo || k < n ? "feita" : k === n ? "atual" : "";
      return `<li class="${st}"${k === n && !tudo ? ' aria-current="step"' : ""}><span class="bola" aria-hidden="true"></span><span class="rot">${esc(curto(nome))}</span></li>`;
    }).join("")}</ol>`;
  }
  /* Voltar embaixo, em contorno; o rótulo do botão continua o mesmo ("‹ voltar"), com a seta desenhada */
  const botaoVoltar = (rot) => `<div class="acoes acoes-voltar"><button class="btn btn-linha voltar" id="v"><span class="sr">‹ </span>${esc(rot)}</button></div>`;
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
    p.querySelector("#ir").onclick = () => {
      const atual = S.hist[S.hist.length - 1];
      if (atual === "RESULTADO") ir(telaResultado);
      else ir(telaPergunta, atual || Motor.proxima(M, S.R, null, H));
    };
    const z = p.querySelector("#zerar");
    if (z) z.onclick = () => { if (confirm("Apagar suas respostas e recomeçar?")) { S = novo(); salvar(); ir(telaCapa); } };
    p.querySelector("#limites").onclick = () => ir(telaLimites);
    ligar(p);
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
          ${botaoVoltar("voltar")}
          ${rodape()}
        </main>
      </div>`);
    ligar(p);
    p.querySelector("#v").onclick = () => ir(telaCapa);
    return p;
  }

  /* ================= pergunta ================= */
  function telaPergunta(cod, doResumo) {
    const grupo = Motor.tela(M, S.R, H, cod);
    if (grupo.length > 1) return telaPar(grupo, doResumo);
    const q = M.porCodigo[cod];
    if (S.hist[S.hist.length - 1] !== cod) { S.hist.push(cod); salvar(); }
    const tipo = Motor.campo(q);
    let resp = S.R[cod] || null;
    /* resposta que já veio de antes: aparece preenchida, com o selo */
    let seloTxt = "";
    if (cod === "M3.P01" && H.p01 && (!resp || resp.doM1)) { resp = resp || { estado: "valor", valor: H.p01 }; seloTxt = SELO_M1; }
    if (cod === "M3.P11" && resp && resp.doPerfil) seloTxt = SELO_DOR;
    let escolhida = resp && resp.opcao ? resp.opcao : null;
    let marcadas = resp && resp.opcoes ? resp.opcoes.slice() : resp && resp.estado === "naosei" && tipo === "multipla" ? [Motor.NS] : [];

    const p = el(`
      <div class="pag">
        ${topo(curto(q.bloco))}
        ${heroi({ kicker: posicao(cod), kickerClasse: "passo", titulo: q.bloco, titClasse: "bloco-nome" })}
        ${etapas(D.blocos.indexOf(q.bloco) + 1)}
        <main class="corpo">
          <div class="cartao-q">
          <div class="pergunta">
            <h2 class="q">${esc(enunciado(q))}</h2>
            ${seloTxt ? selo(seloTxt) : ""}
            ${tipo === "multipla" ? `<p class="mini-info">Você pode marcar mais de uma opção.</p>` : ""}
            <div class="entrada" id="ent"></div>
            ${q.naosei && tipo !== "multipla" ? `<div class="alt"><button class="btn-alt" id="ns">${Motor.NS}</button></div>` : ""}
            <div class="erro" id="erro" hidden></div>
            <div id="msg"></div>
            <div id="extra"></div>
          </div>
          <div class="acoes" id="acoes"></div>
          ${botaoVoltar(doResumo ? "resumo" : S.hist.length > 1 ? "voltar" : "início")}
          </div>
          ${rodape()}
        </main>
      </div>`);
    ligar(p);

    p.querySelector("#v").onclick = () => {
      if (doResumo) { S.hist.pop(); salvar(); return ir(telaResultado); }
      S.hist.pop();
      const ant = S.hist.pop();
      salvar();
      if (ant === "RESULTADO") ir(telaResultado); else if (ant) ir(telaPergunta, ant); else ir(telaCapa);
    };

    const ent = p.querySelector("#ent"), msg = p.querySelector("#msg"), extra = p.querySelector("#extra"), acoes = p.querySelector("#acoes");
    const erroBox = p.querySelector("#erro");
    function erro(t) { erroBox.textContent = t; erroBox.hidden = false; }

    function botoes(modo) {
      /* modo: "continuar" (normal) | "seguir" (há retorno para ler) | "mesmo" (dica para corrigir) */
      acoes.innerHTML = "";
      const rot = modo === "seguir" ? "Seguir" : modo === "mesmo" ? "Continuar mesmo assim" : "Continuar";
      const b = el(`<button class="btn btn-primario seta" id="ok">${rot}</button>`);
      b.onclick = modo === "continuar" ? continuar : modo === "mesmo" ? () => { gravar(coletar()); avancar(); } : avancar;
      acoes.appendChild(b);
    }
    function avancar() {
      if (doResumo) { S.hist.pop(); S.hist.push("RESULTADO"); salvar(); return ir(telaResultado); }
      const prox = Motor.proxima(M, S.R, cod, H);
      if (prox === "RESULTADO") { S.hist.push("RESULTADO"); salvar(); ir(telaResultado); } else ir(telaPergunta, prox);
    }
    const reabrir = () => { erroBox.hidden = true; msg.innerHTML = ""; extra.innerHTML = ""; botoes("continuar"); };

    /* ---- entradas por tipo ---- */
    let outro = null, camposBox = null;
    if (tipo === "escolha" || tipo === "escolhacampos" || tipo === "multipla") {
      ent.classList.add("opcoes");
      q.opcoes.forEach((op) => {
        const b = el(`<button class="opcao" type="button" ${tipo === "multipla" ? 'role="checkbox"' : 'role="radio"'}><span class="radio" aria-hidden="true"></span><span class="op-txt"><b>${esc(op)}</b></span></button>`);
        b.dataset.op = op;
        b.onclick = () => {
          if (tipo === "multipla") {
            if (marcadas.includes(op)) marcadas = marcadas.filter((x) => x !== op);
            /* "Não sei" é exclusivo */
            else marcadas = op === Motor.NS ? [op] : marcadas.filter((x) => x !== Motor.NS).concat(op);
          } else escolhida = op;
          erroBox.hidden = true;
          extra.innerHTML = "";
          botoes("continuar");
          pintar();
        };
        ent.appendChild(b);
      });
      if (q.opcoes.includes("Outro")) {
        outro = el(`<label class="item extra"><span>Outro</span><textarea class="campo" rows="2">${esc(resp && resp.detalhe)}</textarea></label>`);
        ent.after(outro);
      }
      if (tipo === "escolhacampos") { camposBox = el(`<div class="campos"></div>`); ent.after(camposBox); }
    } else if (tipo === "doiscampos") {
      q.campos.forEach((c) => ent.appendChild(el(`<label class="item"><span>${esc(rotulo(q, c))}</span>
        <textarea class="campo" rows="3" data-c="${esc(c)}">${esc(resp && resp.campos && resp.campos[c])}</textarea></label>`)));
    } else {
      ent.appendChild(el(`<textarea class="campo" rows="4">${esc(resp && resp.estado === "valor" ? resp.valor : "")}</textarea>`));
    }
    ent.addEventListener("input", reabrir);

    function desenharCampos() {
      if (!camposBox) return;
      camposBox.innerHTML = "";
      if (!escolhida || !q.campos[escolhida]) return;
      const antes = resp && resp.opcao === escolhida ? resp.campos || {} : {};
      const MARC = q.marcadores || {};
      if (q.campos[escolhida].some((c) => MARC[c])) camposBox.appendChild(el(`<p class="mini-info">Nos itens com opções, você pode marcar mais de uma.</p>`));
      q.campos[escolhida].forEach((c) => {
        if (!MARC[c]) return camposBox.appendChild(el(`<label class="item"><span>${esc(c)}</span>
          <input class="campo" data-c="${esc(c)}" value="${esc(antes[c])}"></label>`));
        /* marcadores: opções para tocar ("Não sei" sozinho); guarda como texto "a; b" */
        let sel = String(antes[c] || "").split(/;\s*/).filter((x) => MARC[c].includes(x));
        const box = el(`<div class="item item-marcar" data-c="${esc(c)}" data-chips="1"><span>${esc(c)}</span><div class="marcar" role="group" aria-label="${esc(c)}"></div></div>`);
        const pinta = () => { box.dataset.val = MARC[c].filter((o) => sel.includes(o)).join("; ");
          box.querySelectorAll(".chip").forEach((b) => { const on = sel.includes(b.dataset.v); b.classList.toggle("sel", on); b.setAttribute("aria-checked", on); }); };
        MARC[c].forEach((o) => {
          const b = el(`<button type="button" class="chip" role="checkbox"></button>`);
          b.textContent = o; b.dataset.v = o;
          b.onclick = () => {
            sel = sel.includes(o) ? sel.filter((x) => x !== o) : o === Motor.NS ? [o] : sel.filter((x) => x !== Motor.NS).concat(o);
            pinta(); reabrir();
          };
          box.querySelector(".marcar").appendChild(b);
        });
        pinta(); camposBox.appendChild(box);
      });
      camposBox.oninput = reabrir;
    }
    function pintar() {
      ent.querySelectorAll(".opcao").forEach((x) => {
        const on = tipo === "multipla" ? marcadas.includes(x.dataset.op) : escolhida === x.dataset.op;
        x.classList.toggle("sel", on);
        x.setAttribute("aria-checked", on);
      });
      if (outro) outro.hidden = !marcadas.includes("Outro");
      if (tipo === "escolhacampos" && camposBox.dataset.op !== (escolhida || "")) { camposBox.dataset.op = escolhida || ""; desenharCampos(); }
      /* retorno ao vivo das opções (Dica de cada alcance/canal; prompt do "Não sei" dos canais) */
      if (tipo === "multipla") mostrar(msg, marcadas.length ? Motor.retornos(q, { estado: "opcoes", opcoes: marcadas }, est()) : []);
      else if (tipo === "escolha" && escolhida) mostrar(msg, Motor.retornos(q, { estado: "opcao", opcao: escolhida }, est()));
      else if (tipo === "escolhacampos") msg.innerHTML = "";
    }

    function coletar() {
      if (tipo === "escolha") return escolhida ? { estado: "opcao", opcao: escolhida } : null;
      if (tipo === "escolhacampos") {
        if (!escolhida) return null;
        const campos = {};
        camposBox.querySelectorAll("[data-c]").forEach((i) => (campos[i.dataset.c] = String(i.dataset.chips ? i.dataset.val || "" : i.value).trim()));
        return { estado: "opcao", opcao: escolhida, campos };
      }
      if (tipo === "multipla") {
        if (marcadas.length === 1 && marcadas[0] === Motor.NS) return { estado: "naosei" };
        const r = { estado: "opcoes", opcoes: q.opcoes.filter((o) => marcadas.includes(o)) };
        const d = outro ? outro.querySelector("textarea").value.trim() : "";
        if (marcadas.includes("Outro") && d) r.detalhe = d;
        return r;
      }
      if (tipo === "doiscampos") {
        const campos = {};
        ent.querySelectorAll("[data-c]").forEach((i) => (campos[i.dataset.c] = i.value.trim()));
        return { estado: "valor", campos };
      }
      return { estado: "valor", valor: ent.querySelector("textarea").value.trim() };
    }
    const gravar = (r) => gravarR(cod, r);

    function continuar() {
      erroBox.hidden = true;
      const r = coletar();
      if (!r) return erro(tipo === "escolhacampos" ? `Escolha uma opção ou toque em “${Motor.NS}”.` : "Escolha uma opção para continuar.");
      const lista = Motor.retornos(q, r, est());
      if (Motor.bloqueia(lista)) return mostrar(msg, lista);        // Alerta: não grava, não avança
      gravar(r);
      if (r.estado === "naosei") return naoSei(true);
      if (Motor.corrigir(lista)) { mostrar(msg, lista); return botoes("mesmo"); }
      if (tipo === "texto" || tipo === "doiscampos") {
        if (Motor.mostraveis(q, r, est()).length) { mostrar(msg, lista); return botoes("seguir"); }
      }
      avancar();
    }

    /* ---- "Não sei": nunca bloqueia; mostra a orientação e fica pendente ---- */
    function naoSei(jaGravado) {
      if (!jaGravado) {
        const ant = S.R[cod] && S.R[cod].estado === "naosei" ? S.R[cod] : { estado: "naosei" };
        if (tipo !== "multipla") { ent.querySelectorAll("textarea,input").forEach((i) => (i.value = "")); escolhida = null; if (camposBox) camposBox.innerHTML = ""; pintarSemRetorno(); }
        gravar(ant);
      }
      const r = S.R[cod];
      erroBox.hidden = true;
      mostrar(msg, Motor.retornos(q, r, est()));
      extra.innerHTML = "";
      if (q.exemplos) extra.appendChild(chips(r));
      if (q.criterios) extra.appendChild(tabela(r));
      if (cod === "M3.P01") extra.appendChild(frase(r));
      botoes("seguir");
    }
    function pintarSemRetorno() { ent.querySelectorAll(".opcao").forEach((x) => { x.classList.remove("sel"); x.setAttribute("aria-checked", false); }); }

    function chips(r) {
      const box = el(`<div class="marcar" role="group"></div>`);
      q.exemplos.forEach((ex) => {
        const b = el(`<button type="button" class="chip" role="checkbox"></button>`);
        b.textContent = ex; b.dataset.ex = ex;
        const on = () => { const s = (r.marcados || []).includes(ex); b.classList.toggle("sel", s); b.setAttribute("aria-checked", s); };
        b.onclick = () => {
          const m = r.marcados || [];
          r.marcados = m.includes(ex) ? m.filter((x) => x !== ex) : q.exemplos.filter((x) => m.includes(x) || x === ex);
          salvar(); on();
        };
        on(); box.appendChild(b);
      });
      return box;
    }
    function tabela(r) {
      r.tabela = r.tabela || {};
      const box = el(`<div class="tabela"></div>`);
      const res = el(`<div></div>`);
      const atual = () => mostrar(res, Motor.retornos(q, r, est()).filter((c) => c.tipo === "Resposta"));
      q.criterios.forEach((c) => {
        const linha = el(`<div class="t-linha" role="radiogroup"><span class="t-crit">${esc(c)}</span><div class="t-ops"></div></div>`);
        linha.dataset.crit = c;
        q.escala.forEach((v) => {
          const b = el(`<button type="button" class="t-op" role="radio">${esc(v)}</button>`);
          b.dataset.v = v;
          b.onclick = () => {
            if (r.tabela[c] === v) delete r.tabela[c]; else r.tabela[c] = v;   // tocar de novo deixa em branco
            salvar(); pinta(); atual();
          };
          linha.querySelector(".t-ops").appendChild(b);
        });
        const pinta = () => linha.querySelectorAll(".t-op").forEach((b) => { const s = r.tabela[c] === b.dataset.v; b.classList.toggle("sel", s); b.setAttribute("aria-checked", s); });
        pinta(); box.appendChild(linha);
      });
      box.appendChild(res); atual();
      return box;
    }
    function frase(r) {
      const box = el(`<div class="frase"><label class="item"><span>Cole aqui a frase, se quiser</span>
        <textarea class="campo" rows="3">${esc(r.frase)}</textarea></label>
        <button type="button" class="btn btn-claro" id="salvar-frase">Salvar a frase</button><p class="mini-info" id="frase-ok" ${r.frase ? "" : "hidden"}>Frase salva.</p></div>`);
      /* "Salvar o texto gerado somente se o usuário confirmar" */
      box.querySelector("#salvar-frase").onclick = () => {
        const v = box.querySelector("textarea").value.trim();
        if (v) r.frase = v; else delete r.frase;
        salvar();
        box.querySelector("#frase-ok").hidden = !v;
      };
      return box;
    }

    const ns = p.querySelector("#ns");
    if (ns) ns.onclick = () => naoSei(false);

    /* estado inicial */
    botoes("continuar");
    if (ent.classList.contains("opcoes")) pintar();
    if (resp && resp.estado === "naosei" && tipo !== "multipla") naoSei(true);
    return p;
  }

  /* ================= duas perguntas curtas na mesma tela (concorrentes) =================
     Cada pergunta guarda a própria resposta e mostra as próprias dicas; o "Não sei" vale só para ela. */
  function telaPar(cods, doResumo) {
    const qs = cods.map((c) => M.porCodigo[c]);
    if (S.hist[S.hist.length - 1] !== cods[0]) { S.hist.push(cods[0]); salvar(); }
    const p = el(`
      <div class="pag">
        ${topo(curto(qs[0].bloco))}
        ${heroi({ kicker: posicao(cods[0]), kickerClasse: "passo", titulo: qs[0].bloco, titClasse: "bloco-nome" })}
        ${etapas(D.blocos.indexOf(qs[0].bloco) + 1)}
        <main class="corpo">
          <div class="cartao-q">
          ${qs.map((q, i) => `<div class="pergunta pergunta-par${i ? " par-2" : ""}" data-cod="${q.codigo}">
            <h2 class="q">${esc(enunciado(q))}</h2>
            <div class="entrada"><textarea class="campo" rows="3" aria-label="${esc(enunciado(q))}"></textarea></div>
            <div class="alt"><button class="btn-alt ns" type="button">${Motor.NS}</button></div>
            <div class="msg"></div>
          </div>`).join("")}
          <div class="acoes" id="acoes"></div>
          ${botaoVoltar(doResumo ? "resumo" : S.hist.length > 1 ? "voltar" : "início")}
          </div>
          ${rodape()}
        </main>
      </div>`);
    ligar(p);
    p.querySelector("#v").onclick = () => {
      if (doResumo) { S.hist.pop(); salvar(); return ir(telaResultado); }
      S.hist.pop();
      const ant = S.hist.pop();
      salvar();
      if (ant === "RESULTADO") ir(telaResultado); else if (ant) ir(telaPergunta, ant); else ir(telaCapa);
    };
    const acoes = p.querySelector("#acoes");
    const caixas = qs.map((q, i) => {
      const box = p.querySelectorAll(".pergunta")[i];
      return { q, box, ta: box.querySelector("textarea"), msg: box.querySelector(".msg"), ns: box.querySelector(".ns") };
    });
    function avancar() {
      if (doResumo) { S.hist.pop(); S.hist.push("RESULTADO"); salvar(); return ir(telaResultado); }
      const prox = Motor.proxima(M, S.R, cods[0], H);
      if (prox === "RESULTADO") { S.hist.push("RESULTADO"); salvar(); ir(telaResultado); } else ir(telaPergunta, prox);
    }
    function botoes(mesmo) {
      acoes.innerHTML = "";
      const b = el(`<button class="btn btn-primario seta" id="ok">${mesmo ? "Continuar mesmo assim" : "Continuar"}</button>`);
      b.onclick = mesmo ? avancar : continuar;
      acoes.appendChild(b);
    }
    function marcarNS(c, on) { c.ns.classList.toggle("sel", on); c.ns.setAttribute("aria-pressed", on); }
    caixas.forEach((c) => {
      const r = S.R[c.q.codigo];
      if (r && r.estado === "valor") c.ta.value = r.valor || "";
      if (r && r.estado === "naosei") { marcarNS(c, true); mostrar(c.msg, Motor.retornos(c.q, r, est())); }
      c.ta.addEventListener("input", () => { c.msg.innerHTML = ""; marcarNS(c, false); botoes(false); });
      c.ns.onclick = () => {
        c.ta.value = "";
        gravarR(c.q.codigo, { estado: "naosei" });
        marcarNS(c, true);
        mostrar(c.msg, Motor.retornos(c.q, S.R[c.q.codigo], est()));
        botoes(false);
      };
    });
    function continuar() {
      let corrigir = false;
      caixas.forEach((c) => {
        const v = c.ta.value.trim(), atual = S.R[c.q.codigo];
        if (!v && atual && atual.estado === "naosei") return;       // Não sei: fica pendente, já mostra a orientação
        const r = { estado: "valor", valor: v };
        gravarR(c.q.codigo, r);
        const lista = Motor.retornos(c.q, r, est());
        if (Motor.corrigir(lista)) { mostrar(c.msg, lista); corrigir = true; } else c.msg.innerHTML = "";
      });
      if (corrigir) return botoes(true);
      avancar();
    }
    botoes(false);
    return p;
  }

  /* ================= resultado ================= */
  /* respostas do módulo + o que veio do Módulo 1 (a pergunta pulada aparece com o selo) */
  function respostas() {
    const RR = Object.assign({}, S.R);
    if (!RR["M3.P01"] && H.p01) RR["M3.P01"] = { estado: "valor", valor: H.p01, doM1: true };
    return RR;
  }
  /* ===== "O que entendemos até aqui": frases montadas por regras, sem inventar ===== */
  const ALCANCE = { "No meu bairro e na minha cidade": "no seu bairro e na sua cidade", "Na minha região (estado e cidades próximas)": "na sua região (estado e cidades próximas)",
    "No Brasil todo": "no Brasil todo", "Também fora do Brasil": "no Brasil e também fora dele" };
  const CANAL = { "Loja física": "loja ou ponto físico", "Marketplace (ex.: Mercado Livre, Shopee)": "sites de venda como Mercado Livre e Shopee",
    "Redes sociais (Instagram, Facebook, WhatsApp)": "redes sociais e WhatsApp", "Site ou aplicativo próprio": "site ou aplicativo próprio" };
  const aspas = (t) => `“${String(t).trim().replace(/[.;\s]+$/, "")}”`;
  const lista = (xs) => xs.length < 2 ? xs.join("") : xs.slice(0, -1).join(", ") + " e " + xs[xs.length - 1];
  function entendemos(RR, nPend) {
    const ideia = est() === "ideia", val = (c) => { const r = RR[c]; return r && r.estado === "valor" && !vazio(r.valor) ? r.valor : null; };
    const f = [];
    const oque = RR["M3.P01"] && RR["M3.P01"].doM1 ? H.ideia : val("M3.P01");
    const estagio = { ideia: " A ideia ainda está no começo: você ainda não começou a vender.", comecando: " Você já fez um pouco para testar.", vende: " Você já vende." }[est()] || "";
    if (oque) f.push(`Você ${ideia ? "quer vender" : "vende"} ${aspas(oque)}${H.tipoFrase ? ` — é ${H.tipoFrase}` : ""}.${estagio}`);
    const p09 = RR["M3.P09"], p10 = RR["M3.P10"];
    let cli = "";
    if (p10 && p10.estado === "opcao") {
      const c = p10.campos || {}, livre = (k) => c[k] && c[k] !== Motor.NS ? c[k] : null;
      /* marcadores: em minúsculas e "ou" entre as opções; texto livre fica como a pessoa escreveu */
      const ok = (k) => { const v = livre(k); return v ? v.split(/;\s*/).filter((x) => x !== Motor.NS).join(" ou ").toLowerCase() || null : null; };
      if (p10.opcao === Motor.PESSOAS) {
        const det = [ok("Idade") && `idade: ${ok("Idade")}`, ok("Renda") && `renda: ${ok("Renda")}`, ok("Ocupação") && `ocupação: ${ok("Ocupação")}`, livre("Onde mora") && `moram em ${livre("Onde mora")}`].filter(Boolean);
        cli = `pessoas comuns${det.length ? ` (${det.join("; ")})` : ""}`;
      } else {
        const det = [ok("Ramo") && `ramo: ${ok("Ramo")}`, ok("Tamanho") && `porte: ${ok("Tamanho")}`, ok("Equipe") && `equipe: ${ok("Equipe")}`, livre("Local") && `em ${livre("Local")}`].filter(Boolean);
        cli = `empresas${det.length ? ` (${det.join("; ")})` : ""}`;
      }
    }
    const onde = p09 && p09.estado === "opcao" ? ALCANCE[p09.opcao] : null;
    if (onde && cli) f.push(`Você ${ideia ? "pretende vender" : "vende"} ${onde}, e o cliente que você ${ideia ? "imagina" : "mais atende"} são ${cli}.`);
    else if (onde) f.push(`Você ${ideia ? "pretende vender" : "vende"} ${onde}.`);
    else if (cli) f.push(`O cliente que você ${ideia ? "imagina" : "mais atende"} são ${cli}.`);
    const dor = val("M3.P11");
    if (dor) f.push(`Ele procura você para resolver isto: ${aspas(dor)}.`);
    const p13 = RR["M3.P13"];
    if (p13 && p13.estado === "opcoes") {
      const cs = p13.opcoes.filter((o) => CANAL[o]).map((o) => CANAL[o]).concat(p13.detalhe ? [p13.detalhe] : []);
      if (cs.length) f.push(`Ele ${ideia ? "vai encontrar" : "encontra"} você por ${lista(cs)}.`);
    }
    const conc = val("M3.P15"), preco = val("M3.P20"), dif = val("M3.P21");
    const ns = preco ? Motor.numeros(preco) : [];
    const partes = [conc && `Quem vende algo parecido: ${aspas(conc)}`, ns.length && `eles cobram em torno de R$ ${Motor.reais(Motor.media(ns))}`].filter(Boolean);
    if (partes.length) f.push(partes.join("; ") + ".");
    if (dif) f.push(`O que ${ideia ? "vai fazer" : "faz"} o cliente preferir você: ${aspas(dif)}.`);
    const out = f.slice(0, 5);
    if (nPend) out.push(nPend === 1 ? "Ficou 1 pergunta com “Não sei”: vale voltar nela quando tiver a informação." : `Ficaram ${nPend} perguntas com “Não sei”: vale voltar nelas quando tiver a informação.`);
    if (!out.length) out.push("Você ainda não respondeu o suficiente para montarmos este retrato. Volte às perguntas quando puder.");
    return out;
  }

  function telaResultado() {
    const RR = respostas();
    const vis = Motor.visiveis(M, S.R);
    const resp = vis.filter((q) => RR[q.codigo]);
    const pend = resp.filter((q) => Motor.pendente(RR[q.codigo]));
    const semResp = vis.filter((q) => !RR[q.codigo]);
    const blocos = D.blocos.map((b) => ({ nome: b, qs: vis.filter((q) => q.bloco === b) })).filter((b) => b.qs.length);
    const p = el(`
      <div class="pag">
        ${topo("Resultado")}
        ${heroi({ kicker: "Resultado", kickerClasse: "passo", titulo: "Resumo das suas respostas" })}
        ${etapas(D.blocos.length, true)}
        <main class="corpo">
          <section class="concluido">
            <div class="conc-topo"><span class="check" aria-hidden="true"></span><div><h2>Você concluiu o Módulo ${esc(D.modulo.numero)}</h2><p>Veja abaixo o que entendemos do seu negócio.</p></div></div>
          </section>
          <section class="entendemos" id="entendemos">
            <h2>O que entendemos até aqui</h2>
            ${entendemos(RR, pend.length).map((t) => `<p>${esc(t)}</p>`).join("")}
          </section>
          <div class="res-num">
            <div class="lbl">Perguntas respondidas</div>
            <div class="val">${resp.length} de ${vis.length}</div>
            <div class="sub">${pend.length ? `${pend.length} com “Não sei”` : "nenhuma com “Não sei”"}</div>
          </div>
          <div class="aviso">${esc(D.mapa.mensagem_limite)}</div>

          ${pend.length || semResp.length ? `<section class="pendentes" id="pendentes">
            ${pend.length ? `<div class="secao-titulo">Perguntas que você marcou como Não sei</div>
            ${pend.map((q) => `<div class="pend" data-cod="${q.codigo}"><p>${esc(enunciado(q))}</p><button class="btn btn-claro preencher" data-cod="${q.codigo}">Preencher agora</button></div>`).join("")}` : ""}
            ${semResp.length ? `<div class="secao-titulo">Perguntas sem resposta</div>
            ${semResp.map((q) => `<div class="pend" data-cod="${q.codigo}"><p>${esc(enunciado(q))}</p><button class="btn btn-claro preencher" data-cod="${q.codigo}">Responder agora</button></div>`).join("")}` : ""}
          </section>` : ""}

          <details class="respostas" id="respostas">
          <summary>Ver suas respostas</summary>
          ${blocos.map((b) => `<section class="res-bloco"><div class="bloco-titulo">${esc(b.nome)}</div>
            ${b.qs.map((q) => {
              const r = RR[q.codigo];
              const msgs = r ? Motor.retornos(q, r, est()).filter((c) => c.tipo === "Resposta") : [];
              const veio = r && r.doM1 ? "Veio do Módulo 1" : r && r.doPerfil ? "Veio do perfil do cliente" : "";
              return `<div class="etapa ${!r ? "e-nao" : Motor.pendente(r) ? "e-conf" : "e-sim"}" data-cod="${q.codigo}">
                <b class="etapa-q">${esc(enunciado(q))}</b>
                ${veio ? `<span class="selo-m selo-res">${veio}</span>` : ""}
                ${Motor.hipotese(q, r) ? `<span class="hip">hipótese a investigar</span>` : ""}
                <p class="etapa-r">${r ? esc(Motor.texto(q, r, est()) || "Sem resposta") : "Sem resposta"}</p>
                ${msgs.map((c) => `<p class="etapa-m">${esc(adaptar(c.texto))}</p>`).join("")}
                ${veio ? `<button class="btn btn-claro ajustar" data-cod="${q.codigo}">Ajustar</button>` : ""}
              </div>`;
            }).join("")}</section>`).join("")}
          </details>

          <div class="secao-titulo">O que este módulo entrega</div>
          <div class="cartao"><p>${esc(D.mapa.entrega)}</p></div>
          <div class="cartao"><h3>Quando procurar um profissional</h3><p>${esc(D.mapa.encaminhamentos)}</p></div>

          <div class="acoes">
            <button class="btn btn-primario" id="imp">Salvar ou imprimir</button>
            <button class="btn btn-claro" id="rev">Revisar respostas</button>
            <button class="btn btn-linha" id="novo">Começar outra análise</button>
          </div>
          ${botaoVoltar("voltar")}
          <div class="acoes lg2-proximo"><a class="btn btn-primario" style="text-decoration:none;text-align:center;box-sizing:border-box" href="/lg2/turma-a/m04/index.html">Ir para o Módulo 4</a></div>
          ${rodape()}
        </main>
      </div>`);
    p.querySelector("#v").onclick = () => {
      S.hist.pop(); const a = S.hist.pop(); salvar();
      if (a && M.porCodigo[a]) ir(telaPergunta, a); else ir(telaCapa);
    };
    ligar(p);
    p.querySelectorAll(".preencher, .ajustar").forEach((b) => (b.onclick = () => ir(telaPergunta, b.dataset.cod, true)));
    p.querySelector("#imp").onclick = () => { p.querySelector("#respostas").open = true; window.print(); };
    p.querySelector("#rev").onclick = () => { S.hist = []; salvar(); ir(telaPergunta, Motor.proxima(M, S.R, null, H)); };
    p.querySelector("#novo").onclick = () => { if (confirm("Começar uma nova análise? As respostas atuais serão apagadas.")) { S = novo(); salvar(); ir(telaPergunta, Motor.proxima(M, {}, null, H)); } };
    return p;
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
