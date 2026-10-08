/* Telas do Módulo 5. Todo texto de conteúdo vem de window.MODULO5 (a planilha),
   sem edição. As respostas ficam só neste aparelho. */
(function () {
  "use strict";
  const D = window.MODULO5, M = Motor.montar(D);
  const tela = document.getElementById("tela");
  const CHAVE = "lg2-turma-a-m05";
  const vazio = (s) => !s || !String(s).trim() || s === "—" || s === "-";

  let S = carregar();               // { R: respostas, hist: [códigos], fb: {cod: regra} }
  function carregar() { try { return JSON.parse(localStorage.getItem(CHAVE)) || novo(); } catch { return novo(); } }
  function novo() { return { R: {}, hist: [] }; }
  function salvar() { try { localStorage.setItem(CHAVE, JSON.stringify(S)); } catch {} }
  function reiniciar() {
    if (!confirm("Analisar outro produto, serviço ou mercadoria? As respostas atuais serão apagadas. Se já tiver um resultado, salve ou imprima antes de continuar.")) return;
    S = novo();
    salvar();
    ir(telaPergunta, "M5.P01");
  }
  function acaoReiniciar() {
    return `<div class="acoes"><button class="btn btn-claro" id="novo">Analisar outro produto, serviço ou mercadoria</button></div>`;
  }

  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const brl = (n) => "R$ " + n.toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const pct = (n) => n.toFixed(1).replace(".", ",") + "%";
  function el(html) { const d = document.createElement("div"); d.innerHTML = html.trim(); return d.firstElementChild; }
  function ir(f, a) { tela.innerHTML = ""; tela.appendChild(f(a)); window.scrollTo(0, 0); }

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
        <header class="capa">
          <img class="logo" src="assets/minds.svg" alt="Minds of the Future">
          <div class="sobre">Módulo ${esc(D.modulo.numero)}</div>
          <h1>${esc(D.modulo.nome)}</h1>
          <p>${esc(D.mapa.objetivo)}</p>
        </header>
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
      else ir(telaPergunta, atual || "M5.P01");
    };
    const z = p.querySelector("#zerar");
    if (z) z.onclick = reiniciar;
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
          <div class="aviso">${esc(D.mapa.mensagem_limite)}</div>
          ${rodape()}
        </main>
      </div>`);
    p.querySelector("#v").onclick = () => ir(telaCapa);
    return p;
  }

  /* ================= pergunta ================= */
  function progresso() {
    const r = S.R["M5.P01"];
    const ramo = r && r.estado === "opcao" ? Motor.valorCond({ condicao: "=" + r.opcao.split(":")[0] }) : null;
    const secRamo = { Produto: "Perguntas Produto", Mercadoria: "Perguntas Mercadoria", "Serviço": "Perguntas Serviço" }[ramo];
    const total = 1 + M.ordem.filter((x) => x.secao === secRamo || x.secao === "Parte comum").length;
    return Math.min(100, Math.round(((S.hist.length - 1) / (secRamo ? total : 20)) * 100));
  }

  function telaPergunta(cod) {
    const q = M.porCodigo[cod];
    if (S.hist[S.hist.length - 1] !== cod) { S.hist.push(cod); salvar(); }
    const tipo = Motor.campo(q);
    const resp = S.R[cod] || null;
    const alt = Motor.botoesAlternativos(M, q);

    const p = el(`
      <div class="pag">
        <header class="topo">
          <button class="voltar" id="v">‹ ${S.hist.length > 1 ? "voltar" : "início"}</button>
          <div class="passo">${esc(q.secao)}</div>
          <div class="barra"><div class="barra-fill" style="width:${progresso()}%"></div></div>
          ${acaoReiniciar()}
        </header>
        <main class="corpo">
          <div class="pergunta">
            <h2 class="q">${esc(q.pergunta)}</h2>
            <p class="ajuda">${esc(q.ajuda)}</p>
            <div class="entrada" id="ent"></div>
            ${alt.length ? `<div class="alt" id="alt"></div>` : ""}
            <div class="erro" id="erro" hidden></div>
          </div>
          <div id="retorno"></div>
          ${blocoConceitos(conceitos(q.fonte))}
          <div class="acoes" id="acoes"><button class="btn btn-primario" id="ok">Continuar</button></div>
        </main>
      </div>`);

    p.querySelector("#v").onclick = () => {
      S.hist.pop();
      const ant = S.hist.pop();
      salvar();
      if (ant) ir(telaPergunta, ant); else ir(telaCapa);
    };

    p.querySelector("#novo").onclick = reiniciar;
    const ent = p.querySelector("#ent");
    let ler = () => null;           // devolve o valor digitado
    let escolhida = resp && resp.estado === "opcao" ? resp.opcao : null;

    if (tipo === "escolha") {
      ent.classList.add("opcoes");
      q.opcoesLista.forEach((op) => {
        const [tit, desc] = op.includes(":") ? [op.split(":")[0], op.slice(op.indexOf(":") + 1)] : [op, ""];
        const b = el(`<button class="opcao ${escolhida === op ? "sel" : ""}"><b>${esc(tit.trim())}</b>${desc ? `<span>${esc(desc.trim())}</span>` : ""}</button>`);
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

    p.querySelector("#ok").onclick = () => {
      if (tipo === "escolha") {
        if (!escolhida) return mostrarErro("Escolha uma opção para continuar.");
        return responder({ estado: "opcao", opcao: escolhida });
      }
      const v = ler();
      const erro = Motor.validar(M, q, v, S.R);
      if (erro) return mostrarErro(erro);
      responder({ estado: "valor", valor: v });
    };

    function mostrarErro(t) { const e = p.querySelector("#erro"); e.textContent = t; e.hidden = false; }

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
      const b = el(`<button class="btn btn-primario">${prox === "RESULTADO" ? "Ver o resultado" : "Seguir"}</button>`);
      b.onclick = () => { if (prox === "RESULTADO") { S.hist.push("RESULTADO"); salvar(); ir(telaResultado); } else ir(telaPergunta, prox); };
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
      const suf = tipo === "percentual" ? "%" : /r\$/i.test(q.tipo) ? "" : "";
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

  /* ================= resultado ================= */
  function telaResultado() {
    const c = Motor.calcular(M, S.R);
    const bt = (n) => M.conceito["M5.BT" + n] || {};
    const regraFinal = D.regras.find((r) => r.pergunta === "Resultado");
    const temCusto = c.linhas.length > 0 || c.tipo === "Serviço";
    const lacunas = [];
    Object.keys(S.R).forEach((cod) => {
      if (!S.hist.includes(cod)) return;
      const r = Motor.regra(M, M.porCodigo[cod], S.R[cod]);
      if (r && !vazio(r.lacuna) && !lacunas.includes(r.lacuna)) lacunas.push(r.lacuna);
    });
    const card = (t, v, sub) => `<div class="mini"><span>${v}</span><small>${esc(t)}</small>${sub ? `<em>${esc(sub)}</em>` : ""}</div>`;

    const p = el(`
      <div class="pag">
        <header class="topo">
          <button class="voltar" id="v">‹ voltar</button>
          <div class="passo">Resultado</div>
          <h2>${esc(c.nome || "Seu negócio")}</h2>
          ${acaoReiniciar()}
        </header>
        <main class="corpo">
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

          <div class="acoes">
            <button class="btn btn-primario" id="imp">Salvar ou imprimir</button>
            <button class="btn btn-claro" id="rev">Revisar respostas</button>
          </div>
          ${rodape()}
        </main>
      </div>`);
    p.querySelector("#v").onclick = () => { S.hist.pop(); const a = S.hist.pop(); salvar(); ir(telaPergunta, a); };
    p.querySelector("#imp").onclick = () => window.print();
    p.querySelector("#rev").onclick = () => { S.hist = []; salvar(); ir(telaPergunta, "M5.P01"); };
    p.querySelector("#novo").onclick = reiniciar;
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
