/* Telas do Módulo 6 (versão A). Todo texto de conteúdo vem de window.MODULO6 (a planilha),
   sem edição. As respostas ficam só neste aparelho. */
(function () {
  "use strict";
  const D = window.MODULO6, M = Motor.montar(D);
  const tela = document.getElementById("tela");
  const CHAVE = "lg2-turma-a-m06";
  const vazio = (s) => !s || !String(s).trim() || s === "—" || s === "-" || s === "Nenhum" || s === "Nenhuma";

  let S = carregar();   // { R: respostas, hist: [códigos], prio: {item: categoria}, fluxo: null|{...}, cen: {...} }
  function carregar() { try { return JSON.parse(localStorage.getItem(CHAVE)) || novo(); } catch { return novo(); } }
  function novo() { return { R: {}, hist: [], prio: {}, fluxo: null, cen: null }; }
  function salvar() { try { localStorage.setItem(CHAVE, JSON.stringify(S)); } catch {} }

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

  /* ================= capa ================= */
  function telaCapa() {
    const iniciado = S.hist.length > 0;
    const p = el(`
      <div class="pag">
        <header class="capa">
          <img class="logo" src="assets/minds.svg" alt="Minds of the Future">
          <div class="sobre">Módulo ${esc(D.modulo.numero)}</div>
          <h1>${esc(D.modulo.nome)}</h1>
          <p>${esc(D.mapa.objetivo)}</p>
        </header>
        <main class="corpo">
          <div class="cartao"><h3>Para quem é</h3><p>${esc(D.mapa.usuario)}</p></div>
          <div class="cartao"><h3>O que ter em mãos</h3><p>${esc(D.mapa.ter_em_maos)}</p></div>
          <div class="cartao"><h3>O que você recebe no final</h3><p>${esc(D.mapa.entrega)}</p></div>
          <div class="acoes">
            <button class="btn btn-primario" id="ir">${iniciado ? "Continuar de onde parei" : "Começar"}</button>
            ${iniciado ? `<button class="btn btn-claro" id="zerar">Recomeçar do zero</button>` : ""}
            <button class="btn btn-linha" id="limites">O que este módulo não faz</button>
          </div>
          ${rodape()}
        </main>
      </div>`);
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
        <header class="topo"><button class="voltar" id="v">‹ voltar</button><h2>Limites do módulo</h2></header>
        <main class="corpo">
          <div class="cartao"><h3>O que o módulo não faz</h3><p>${esc(D.mapa.nao_faz)}</p></div>
          <div class="cartao"><h3>Que decisões ele apoia</h3><p>${esc(D.mapa.decisoes)}</p></div>
          <div class="cartao"><h3>Quando procurar um profissional</h3><p>${esc(D.mapa.encaminhamentos)}</p></div>
          <div class="cartao"><h3>Cuidados</h3><p>${esc(D.mapa.riscos)}</p></div>
          <div class="aviso">${esc(D.mapa.mensagem_limite)}</div>
          ${rodape()}
        </main>
      </div>`);
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
    const resp = S.R[cod] || null;
    let escolhida = resp && resp.estado === "opcao" ? resp.opcao : null;

    const p = el(`
      <div class="pag">
        <header class="topo">
          <button class="voltar" id="v">‹ ${S.hist.length > 1 ? "voltar" : "início"}</button>
          <div class="passo">Pergunta ${M.perguntas.indexOf(q) + 1} de ${M.perguntas.length}</div>
          <div class="barra"><div class="barra-fill" style="width:${progresso()}%"></div></div>
        </header>
        <main class="corpo">
          <div class="pergunta">
            <h2 class="q">${esc(q.pergunta)}</h2>
            <p class="ajuda">${esc(q.ajuda)}</p>
            <div class="entrada" id="ent"></div>
            ${Motor.temNaoSei(q) ? `<div class="alt"><button class="btn-alt" id="ns">Não sei</button></div>` : ""}
            <div class="erro" id="erro" hidden></div>
          </div>
          <div id="retorno"></div>
          ${blocoEducativo(educativoDe(cod))}
          ${blocoConceitos(conceitosDe(q))}
          <div class="acoes" id="acoes"><button class="btn btn-primario" id="ok">Continuar</button></div>
        </main>
      </div>`);
    ligarCopiar(p);

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
        const b = el(`<button class="opcao ${escolhida === op ? "sel" : ""}"><b>${esc(op)}</b></button>`);
        b.onclick = () => { escolhida = op; ent.querySelectorAll(".opcao").forEach((x) => x.classList.remove("sel")); b.classList.add("sel"); };
        ent.appendChild(b);
      });
    } else {
      const v = resp && resp.estado === "valor" ? resp.valor : "";
      ent.appendChild(el(tipo === "numero"
        ? `<div class="linha"><span class="unid">R$</span><input class="campo" inputmode="decimal" placeholder="0,00" value="${esc(v)}"></div>`
        : `<textarea class="campo" rows="3">${esc(v)}</textarea>`));
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
      if (tipo === "numero" && isNaN(Motor.num(v))) return erro("Informe um valor em reais.");
      responder({ estado: "valor", valor: v });
    };
    function erro(t) { const e = p.querySelector("#erro"); e.textContent = t; e.hidden = false; }

    function responder(r0) {
      p.querySelector("#erro").hidden = true;
      S.R[cod] = r0;
      S.fluxo = null; S.cen = null;      // a projeção é refeita com as novas respostas
      limparInvisiveis();
      salvar();
      mostrarRetorno(Motor.regrasAgora(M, S.R, cod), Motor.proxima(M, S.R, cod));
    }

    function mostrarRetorno(regras, prox) {
      const box = p.querySelector("#retorno");
      box.innerHTML = `<div class="retorno">
        <p class="r-texto r-pergunta">${esc(q.resposta)}</p>
        ${regras.map((r) => `
          <div class="regra">
            <p class="r-texto">${esc(r.texto)}</p>
            ${vazio(r.alerta) ? "" : `<div class="bloco b-alerta"><b>Atenção</b>${esc(r.alerta)}</div>`}
            ${vazio(r.lacuna) ? "" : `<div class="bloco b-lacuna"><b>O que ainda falta</b>${esc(r.lacuna)}</div>`}
            ${vazio(r.proximo) ? "" : `<div class="bloco b-proximo"><b>Próximo passo</b>${esc(r.proximo)}</div>`}
            ${vazio(r.encaminhamento) ? "" : `<div class="bloco b-enc"><b>Quem procurar</b>${esc(r.encaminhamento)}</div>`}
          </div>`).join("")}
        ${vazio(q.alerta) ? "" : `<div class="bloco b-alerta"><b>Atenção</b>${esc(q.alerta)}</div>`}
      </div>`;
      const acoes = p.querySelector("#acoes");
      acoes.innerHTML = "";
      const b = el(`<button class="btn btn-primario">${prox === "RESULTADO" ? "Ver meu resumo" : "Seguir"}</button>`);
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
    let cod = Motor.proxima(M, {}, null);
    const vis = new Set(), R = {};
    while (cod !== "RESULTADO") {
      vis.add(cod);
      if (S.R[cod] === undefined) break;
      R[cod] = S.R[cod];
      cod = Motor.proxima(M, R, cod);
    }
    Object.keys(S.R).forEach((k) => { if (!vis.has(k)) delete S.R[k]; });
  }

  /* ================= resultado: instrumentos da aba 5 ================= */
  const I = (c) => M.instr[c] || {};
  function cabInstr(ins) {
    return `<div class="secao-titulo">${esc(ins.nome)}</div>
      <p class="ajuda">${esc(ins.objetivo)}</p>`;
  }
  const regraInstr = (ins) => `<p class="mini-info">${esc(ins.regra)}</p>`;
  const limiteInstr = (ins) => vazio(ins.limite) ? "" : `<div class="aviso">${esc(ins.limite)}</div>`;

  function blocoI01() {
    const ins = I("M6.I01"), inv = Motor.investimento(S.R);
    const total = (inv.valor || 0) + (inv.estoque || 0);
    const temValor = inv.valor !== null || inv.estoque !== null;
    return `${cabInstr(ins)}
      <div class="res-num">
        <div class="lbl">${esc(ins.mostra)}</div>
        <div class="val">${temValor ? brl(total) : "—"}</div>
        <div class="sub">${temValor
          ? `${esc(conceito("M6.BT01").conceito)}: ${inv.valor !== null ? brl(inv.valor) : "não informado"}`
            + (inv.estoque !== null ? ` · ${esc(conceito("M6.BT07").conceito)}: ${brl(inv.estoque)}` : "")
            + (inv.forma && inv.forma !== Motor.NS ? ` · ${esc(inv.forma)}` : "")
          : esc((D.regras.find((r) => r.codigo === "M6.R04") || {}).texto)}</div>
      </div>
      ${regraInstr(ins)}${limiteInstr(ins)}`;
  }

  function blocoI02() {
    const ins = I("M6.I02"), itens = Motor.itens(S.R), cats = Motor.categorias(M);
    if (!itens.length) return `${cabInstr(ins)}<div class="bloco b-lacuna">${esc((D.regras.find((r) => r.codigo === "M6.R02") || {}).lacuna)}</div>`;
    return `${cabInstr(ins)}
      <div class="lista" id="prio">${itens.map((it, i) => `
        <div class="item"><b class="nome">${esc(it)}</b>
          <div class="opcoes mini">${cats.map((c) => `<button class="opcao ${S.prio[it] === c ? "sel" : ""}" data-i="${i}" data-c="${esc(c)}">${esc(c)}</button>`).join("")}</div>
        </div>`).join("")}</div>
      ${regraInstr(ins)}${limiteInstr(ins)}`;
  }

  function fluxo() {
    if (!S.fluxo) { S.fluxo = Motor.fluxoInicial(S.R); salvar(); }
    return S.fluxo;
  }
  function blocoI04() {
    const ins = I("M6.I04"), F = fluxo(), P = Motor.projetar(F);
    const p10 = Motor.valor(S.R, "M6.P10");
    return `${cabInstr(ins)}
      <div class="linha"><span class="lbl">Saldo inicial</span><span class="unid">R$</span><input class="campo" id="f-ini" inputmode="decimal" value="${F.saldoInicial}"></div>
      <div class="tabela-wrap"><table class="fluxo">
        <thead><tr><th>Sem.</th><th>Entradas</th><th>Saídas</th><th>Saldo final</th></tr></thead>
        <tbody>${P.map((s, i) => `<tr class="${s.alerta ? "neg" : ""}">
          <td>${s.semana}</td>
          <td><input inputmode="decimal" data-i="${i}" data-k="entradas" value="${s.entradas || ""}"></td>
          <td><input inputmode="decimal" data-i="${i}" data-k="saidas" value="${s.saidas || ""}"></td>
          <td class="sf">${brl(s.final)}</td></tr>`).join("")}</tbody>
      </table></div>
      <p class="mini-info">Os valores das suas respostas já entraram na semana do prazo escolhido. Você pode mudar qualquer semana.</p>
      ${p10 && p10 !== Motor.NS ? `<div class="bloco b-proximo"><b>${esc(M.porCodigo["M6.P10"].pergunta)}</b>${esc(p10)}</div>` : ""}
      ${P.some((s) => s.alerta) ? `<div class="bloco b-alerta"><b>Atenção</b>${esc(ins.limite)} (semana ${P.filter((s) => s.alerta).map((s) => s.semana).join(", ")})</div>` : ""}
      ${regraInstr(ins)}`;
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
      ${regraInstr(ins)}${limiteInstr(ins)}`;
  }
  function blocoI05() {
    const ins = I("M6.I05"), c = Motor.controle(fluxo());
    if (!S.cen) { S.cen = { ini: c.inicial, ent: c.entradas, sai: c.saidas }; salvar(); }
    const r = Motor.cenario(S.cen.ini, S.cen.ent, S.cen.sai);
    return `${cabInstr(ins)}
      <div class="linha"><span class="lbl">Saldo inicial</span><span class="unid">R$</span><input class="campo cen" data-k="ini" inputmode="decimal" value="${S.cen.ini}"></div>
      <div class="linha"><span class="lbl">Entradas previstas</span><span class="unid">R$</span><input class="campo cen" data-k="ent" inputmode="decimal" value="${S.cen.ent}"></div>
      <div class="linha"><span class="lbl">Saídas previstas</span><span class="unid">R$</span><input class="campo cen" data-k="sai" inputmode="decimal" value="${S.cen.sai}"></div>
      <div class="res-num ${r.alerta ? "coral" : ""}" id="cen-res"><div class="lbl">Saldo do cenário</div><div class="val">${brl(r.saldo)}</div></div>
      ${r.alerta ? `<div class="bloco b-alerta"><b>Atenção</b>${esc(ins.limite)}</div>` : ""}
      ${regraInstr(ins)}`;
  }

  function telaResultado() {
    const regras = Motor.regrasTodas(M, S.R);
    const lac = Motor.lacunas(regras), enc = Motor.encaminhamentos(regras), ale = Motor.alertas(regras);
    const p = el(`
      <div class="pag">
        <header class="topo">
          <button class="voltar" id="v">‹ voltar</button>
          <div class="passo">Resultado</div>
          <h2>Seu resumo</h2>
        </header>
        <main class="corpo">
          <p class="ajuda">${esc(D.mapa.entrega)}</p>
          <div id="i01">${blocoI01()}</div>
          <div id="i02">${blocoI02()}</div>
          <div id="i04">${blocoI04()}</div>
          <div id="i03">${blocoI03()}</div>
          <div id="i05">${blocoI05()}</div>

          ${ale.length ? `<div class="secao-titulo">Alertas</div>${ale.map((a) => `<div class="bloco b-alerta">${esc(a)}</div>`).join("")}` : ""}
          ${lac.length ? `<div class="bloco b-lacuna"><b>O que ainda falta saber</b><ul>${lac.map((l) => `<li>${esc(l)}</li>`).join("")}</ul></div>` : ""}
          ${regras.length ? `<div class="secao-titulo">Próximos passos</div><ol class="roteiro">${[...new Set(regras.map((r) => r.proximo).filter((x) => !vazio(x)))].map((x) => `<li>${esc(x)}</li>`).join("")}</ol>` : ""}
          <div class="bloco b-enc"><b>Quem procurar, pelas suas respostas</b>${enc.length ? enc.map(esc).join(" · ") : esc(D.mapa.caso_real)}</div>

          <div class="secao-titulo">Suas respostas</div>
          ${M.perguntas.map((q) => { const v = Motor.valor(S.R, q.codigo);
            return `<div class="cartao"><h3>${esc(q.pergunta)}</h3><p>${v === undefined ? `<span class="mini-info">Não apareceu no seu caminho</span>` : esc(v)}</p></div>`; }).join("")}

          <div class="aviso">${esc(D.mapa.mensagem_limite)}</div>
          <div class="acoes">
            <button class="btn btn-primario" id="imp">Salvar ou imprimir</button>
            <button class="btn btn-claro" id="rev">Revisar respostas</button>
            <button class="btn btn-linha" id="novo">Começar outra análise</button>
          </div>
          ${rodape()}
        </main>
      </div>`);

    const refazer = (id, f) => { p.querySelector(id).innerHTML = f(); ligar(); };
    function ligar() {
      p.querySelectorAll("#prio .opcao").forEach((b) => (b.onclick = () => {
        const it = Motor.itens(S.R)[+b.dataset.i]; S.prio[it] = b.dataset.c; salvar(); refazer("#i02", blocoI02);
      }));
      const ini = p.querySelector("#f-ini");
      ini.onchange = () => { S.fluxo.saldoInicial = Motor.num(ini.value) || 0; S.cen = null; salvar(); atualizarCaixa(); };
      p.querySelectorAll(".fluxo input").forEach((x) => (x.onchange = () => {
        S.fluxo.semanas[+x.dataset.i][x.dataset.k] = Motor.num(x.value) || 0; S.cen = null; salvar(); atualizarCaixa();
      }));
      p.querySelectorAll(".cen").forEach((x) => (x.onchange = () => {
        S.cen[x.dataset.k] = Motor.num(x.value) || 0; salvar(); refazer("#i05", blocoI05);
      }));
    }
    function atualizarCaixa() { p.querySelector("#i04").innerHTML = blocoI04(); p.querySelector("#i03").innerHTML = blocoI03(); p.querySelector("#i05").innerHTML = blocoI05(); ligar(); }
    ligar();

    p.querySelector("#v").onclick = () => { S.hist.pop(); const a = S.hist.pop(); salvar(); ir(telaPergunta, a); };
    p.querySelector("#imp").onclick = () => window.print();
    p.querySelector("#rev").onclick = () => { S.hist = []; salvar(); ir(telaPergunta, Motor.proxima(M, {}, null)); };
    p.querySelector("#novo").onclick = () => { if (confirm("Começar uma nova análise? As respostas atuais serão apagadas.")) { S = novo(); salvar(); ir(telaPergunta, Motor.proxima(M, {}, null)); } };
    return p;
  }

  function rodape() {
    return `<footer class="rodape">
      <p class="credito">Conteúdo do Grupo ${esc(D.modulo.numero)} · Laboratório de Gestão II · FACC/UFJF · versão ${esc(D.modulo.versao)} (A) · fontes consultadas em ${esc(D.modulo.data)}</p>
      <div class="logos">
        <img src="assets/logo_facc.png" alt="FACC">
        <img src="assets/logo_ufjf.svg" alt="UFJF">
        <img src="assets/logo_mg.svg" alt="Governo de Minas Gerais">
      </div>
    </footer>`;
  }

  ir(telaCapa);
})();
