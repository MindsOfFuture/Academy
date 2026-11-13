/* Telas do Módulo 8. Todo texto de conteúdo vem de window.MODULO8 (a planilha),
   sem edição. As respostas ficam só neste aparelho.
   Layout do Módulo 5: barra do topo com trilha, faixa roxa com ilustração, cartão da pergunta e
   cartão de conclusão. A planilha não divide as perguntas em seções: o progresso fica numa barra
   amarela dentro da faixa roxa, no lugar das etapas. */
(function () {
  "use strict";
  const D = window.MODULO8, M = Motor.montar(D);
  const tela = document.getElementById("tela");
  const CHAVE = "lg2-turma-b-m08";
  /* Limites (nov/2026). Limite do MEI em 2026: R$ 81 mil por ano (gov.br, "Teto do MEI", e Lei Complementar 123/2006,
     art. 18-A). A Lei Complementar 238/2026 (sancionada em 21/10/2026) sobe o teto para R$ 110 mil em 2027 e R$ 140 mil
     a partir de 2028. Passar até 20% do limite tira do MEI no ano seguinte; mais que isso, desde janeiro do mesmo ano. */
  const LIMITE_MEI_ANO = 81000;          // vale até 31/12/2026
  const LIMITE_MEI_2027 = 110000;        // LC 238/2026
  const TOLERANCIA_MEI = 0.2;            // até 20% acima do limite
  const FAT_MES_ALTO = 20000;            // acima disso por mês: aviso "parece alto para um pequeno negócio" (não trava)
  const ESPERA_TECLADO = 300;            // ms até rolar o campo para o centro, depois que o teclado abre
  const LIMITE_TEXTO = 220;              // dica com mais que isso: 1ª frase à vista e o resto em "Ver mais"
  const DOMICILIO = "Na casa do cliente (atendimento em domicílio)";   // opção do local (lote 3); o Módulo 10 usa o mesmo texto
  /* fontes oficiais (consultadas em 06/11/2026) */
  const FONTE = {
    criterios: "https://www.gov.br/pt-br/servicos/realizar-registro-como-microempreendedor-individual-mei",   // gov.br: condições a), c) e d) do serviço
    portal: "https://www.gov.br/empresas-e-negocios/pt-br/empreendedor",
    salaJF: "https://desenvolvejf.pjf.mg.gov.br/sme.html",                                                  // Sala Mineira do Empreendedor, Prefeitura de Juiz de Fora
    sebrae: "https://sebrae.com.br/sites/PortalSebrae/estamosai",
    lei238: "https://www2.camara.leg.br/legin/fed/leicom/2026/leicomplementar-238-21-outubro-2026-800071-publicacaooriginal-181678-pl.html",
    tetoMei: "https://www.gov.br/memp/pt-br/prospera-mei/teto-do-mei",
  };
  const SEBRAE_TEL = "0800 570 0800";
  /* "Não sei" que não grava nem avança (nov/2026): estas respostas decidem o resto do módulo.
     P01 → busca das ocupações do MEI · P02 → mostra ou não a pergunta do responsável técnico e o aviso do tipo
     P03 → mostra ou não a pergunta das licenças · P04 → conta do limite do MEI e pergunta da lista do MEI
     P05 → perguntas do CNAE e da lista do MEI e o alerta do limite. Nas outras perguntas o "Não sei" continua valendo.
     Tocar em "Não sei" aqui mostra como descobrir a resposta e pede uma resposta. */
  const NS_PRECISA = new Set(["M8.P01", "M8.P02", "M8.P03", "M8.P04", "M8.P05"]);
  /* versão leve (nov/2026): todo "Não sei" abre a caixa "Como descobrir" com os passos e o pedido para a IA
     de cada pergunta (dados/modulo8.js: comoDescobrir, promptIA). Nas perguntas acima a resposta continua obrigatória;
     nas outras o "Não sei" é gravado como antes. */

  const vazio = (s) => !s || !String(s).trim() || s === "—" || s === "-" || s === "Nenhum" || s === "Nenhuma";

  let S = carregar();               // { R: respostas, hist: [códigos] }
  function carregar() { try { return migrar(JSON.parse(localStorage.getItem(CHAVE)) || novo()); } catch { return novo(); } }
  /* resposta antiga "Não sei" numa pergunta que agora precisa de resposta: apaga e volta para ela */
  function migrar(s) {
    if (!s.R) s.R = {};
    if (!Array.isArray(s.hist)) s.hist = [];
    let corte = -1, mudou = false;
    for (const cod of NS_PRECISA) {
      if (!s.R[cod] || Motor.valor(s.R, cod) !== Motor.NS) continue;   // "Não sei" em botão de opção ou no botão à parte
      delete s.R[cod]; mudou = true;
      const i = s.hist.indexOf(cod);
      if (i >= 0 && (corte < 0 || i < corte)) corte = i;
      else if (i < 0) { corte = -1; s.hist = []; }   // fora da trilha salva: recomeça a navegação do início, com as respostas guardadas
    }
    if (corte >= 0) s.hist = s.hist.slice(0, corte + 1);
    if (mudou) try { localStorage.setItem(CHAVE, JSON.stringify(s)); } catch {}   // a última da trilha é a pergunta apagada: "Continuar de onde parei" abre nela
    return s;
  }
  function novo() { return { R: {}, hist: [] }; }
  function salvar() { try { localStorage.setItem(CHAVE, JSON.stringify(S)); } catch {} }

  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const link = (u, t) => /^https?:/.test(u || "") ? `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(t || u)}</a>` : esc(t || u);
  function el(html) { const d = document.createElement("div"); d.innerHTML = html.trim(); return d.firstElementChild; }
  function ir(f, a) { tela.innerHTML = ""; tela.appendChild(f(a)); window.scrollTo(0, 0); }

  /* ================= herança: o que já foi respondido em outros módulos (só leitura) =================
     P01 atividade ← M1.P03 (depois M3.P01, M4.P01) · P02 tipo ← M1.P03A, M5.P01, M4.P02
     P03 local ← M9-03 (+ M9-03a / M9-03b) · P04 faturamento ← M5.P36 × M5.P37.
     A resposta herdada só pré-preenche a pergunta; a pessoa confere e toca Continuar. "Não sei" não conta. */
  const NS = Motor.NS;
  function lerR(chave) { try { const s = JSON.parse(localStorage.getItem(chave)); return (s && s.R) || {}; } catch { return {}; } }
  const textoDe = (r) => { if (!r) return null; let v = r.estado === "opcao" ? r.opcao : r.estado === "valor" ? r.valor : null; if (typeof v === "number") v = String(v); return typeof v === "string" && v.trim() && v.trim() !== NS ? v.trim() : null; };
  function numero(v) {
    let s = String(v ?? "").replace(/[R$\s]/g, "");
    if (!s) return null;
    if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
    else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, "");
    const n = parseFloat(s);
    return isFinite(n) ? n : null;
  }
  const reais = (n) => "R$\u00a0" + n.toLocaleString("pt-BR", { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 });
  const qtd = (n) => n.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
  /* tipo de oferta dos outros módulos → opção deste módulo:
     "Produto: …" → Produto · "Mercadoria: …" → Mercadoria · "Serviço: …" → Serviço
     Produto+Serviço ou Mercadoria+Serviço (Módulo 4) → Produto e serviço · Mercadoria+Produto → Produto */
  function tipoP02(t) {
    if (!t) return null;
    const temS = /servi[cç]o/i.test(t), temP = /produto/i.test(t), temM = /mercadoria/i.test(t);
    return temS && (temP || temM) ? "Produto e serviço" : temS ? "Serviço" : temP ? "Produto" : temM ? "Mercadoria" : null;
  }
  function localP03(m9) {
    const a = textoDe(m9["M9-03"]), sa = textoDe(m9["M9-03a"]), sb = textoDe(m9["M9-03b"]);
    const casa = (x) => /casa|apartamento|condom/i.test(x || "") && !/cliente/i.test(x || "");
    const loja = (x) => /loja|sala comercial/i.test(x || "");
    const semFixo = () => /internet|telefone/i.test(sa || "") ? "Online" : sa ? "Atendimento externo" : null;
    if (/^Na casa do cliente/i.test(a || "")) return DOMICILIO;
    if (casa(a)) return "Minha casa";
    if (loja(a)) return "Ponto comercial";
    if (/sem local fixo/i.test(a || "")) return semFixo();
    if (casa(sb)) return "Minha casa";
    if (loja(sb)) return "Ponto comercial";
    if (/sem local fixo/i.test(sb || "")) return semFixo();
    return null;
  }
  /* devolve { r, de, nota } com a resposta já no formato deste módulo, ou null */
  function herdado(cod) {
    const m1 = lerR("lg2-turma-a-m01");
    if (cod === "M8.P01") {
      const fontes = [[m1, "M1.P03", 1], [lerR("lg2-turma-a-m03"), "M3.P01", 3], [lerR("lg2-turma-a-m04"), "M4.P01", 4]];
      for (const [R, c, n] of fontes) { const t = textoDe(R[c]); if (t) return { r: { estado: "valor", valor: t }, de: n }; }
    }
    if (cod === "M8.P02") {
      const fontes = [[m1, "M1.P03A", 1], [lerR("lg2-turma-a-m05"), "M5.P01", 5], [lerR("lg2-turma-a-m04"), "M4.P02", 4]];
      for (const [R, c, n] of fontes) { const t = tipoP02(textoDe(R[c])); if (t) return { r: { estado: "opcao", opcao: t }, de: n }; }
    }
    if (cod === "M8.P03") {
      const t = localP03(lerR("lg2-turma-b-m09"));
      if (t) return { r: { estado: "opcao", opcao: t }, de: 9 };
    }
    if (cod === "M8.P04") {
      const m5 = lerR("lg2-turma-a-m05");
      const preco = numero(textoDe(m5["M5.P36"])), vendas = numero(textoDe(m5["M5.P37"]));
      if (preco > 0 && vendas > 0) {
        const total = Math.round(preco * vendas * 100) / 100;
        return { r: { estado: "valor", valor: String(total).replace(".", ",") }, de: 5,
                 nota: `${reais(preco)} por venda × ${qtd(vendas)} ${vendas === 1 ? "venda" : "vendas"} por mês = ${reais(total)} por mês` };
      }
    }
    return null;
  }
  /* o que os outros módulos dizem do tipo de oferta, mesmo depois de respondido aqui: { opcao, de, original } */
  function tipoHerdado() {
    const fontes = [["lg2-turma-a-m01", "M1.P03A", 1], ["lg2-turma-a-m05", "M5.P01", 5], ["lg2-turma-a-m04", "M4.P02", 4]];
    for (const [k, c, n] of fontes) { const o = textoDe(lerR(k)[c]); const t = tipoP02(o); if (t) return { opcao: t, de: n, original: o }; }
    return null;
  }
  function avisoTipo(escolhida) {
    const h = tipoHerdado();
    if (!h || !escolhida || escolhida === NS || escolhida === h.opcao) return "";
    return `<div class="bloco b-alerta" id="aviso-tipo"><b>Confira o tipo de atividade</b>No Módulo ${esc(h.de)} você respondeu “${esc(h.original)}”. Aqui você escolheu “${esc(escolhida)}”. Se mudou de ideia, tudo bem, pode seguir. Se foi engano, toque em “Corrigir minha resposta”. ${selo(h.de)}</div>`;
  }

  /* faturamento por ano: o informado aqui (por mês × 12) ou, se respondeu "Não sei", preço × vendas por mês do Módulo 5 × 12 */
  function faturamentoAno() {
    const v = Motor.valor(S.R, "M8.P04"), n = v && v !== NS ? numero(v) : null;
    if (n != null && n >= 0) return { ano: n * 12, mes: n, de: S.R["M8.P04"] && S.R["M8.P04"].de };
    const m5 = lerR("lg2-turma-a-m05"), preco = numero(textoDe(m5["M5.P36"])), vendas = numero(textoDe(m5["M5.P37"]));
    if (preco > 0 && vendas > 0) return { ano: preco * vendas * 12, mes: preco * vendas, de: 5 };
    return null;
  }
  /* tipo de CNPJ pela sigla: "MEI (Microempreendedor Individual)" e o antigo "MEI" valem igual */
  const sigla = (v) => (v == null ? v : String(v).split(" (")[0].trim());
  /* alerta forte quando o faturamento passa do limite do MEI */
  function alertaMei() {
    const f = faturamentoAno();
    if (!f || f.ano <= LIMITE_MEI_ANO) return "";
    const cnpj = sigla(Motor.valor(S.R, "M8.P05"));
    if (cnpj && !["MEI", "Não", NS].includes(cnpj)) return "";          // ME, EI, SLU ou LTDA já não são MEI
    const teto20 = LIMITE_MEI_ANO * (1 + TOLERANCIA_MEI);
    const origem = f.de ? ` ${selo(f.de)}` : "";
    const conta = `Você estima faturar ${reais(Math.round(f.mes))} por mês, cerca de <b class="num">${reais(Math.round(f.ano))} por ano</b>.${origem} O limite do MEI em 2026 é de ${reais(LIMITE_MEI_ANO)} por ano (${reais(LIMITE_MEI_ANO / 12)} por mês, em média).`;
    const corpo = cnpj === "MEI"
      ? `<p>${conta}</p><p>Com esse faturamento, o seu negócio <b>sai do MEI</b>. Isso se chama <b>desenquadramento</b>: a empresa passa a ser microempresa, com outros impostos e obrigações.</p>
         <p>${f.ano <= teto20 ? `Como passou até 20% do limite (até ${reais(teto20)}), a mudança vale a partir de janeiro do ano seguinte, e você paga um imposto a mais sobre o que passou.` : `Como passou mais de 20% do limite (acima de ${reais(teto20)}), a mudança vale desde janeiro deste ano, e pode haver imposto a pagar sobre o ano todo.`}</p>`
      : `<p>${conta}</p><p>Com esse faturamento, o <b>MEI não serve</b> para o seu negócio: quem passa do limite sai do MEI (desenquadramento). Será preciso abrir o CNPJ de outra forma, como microempresa.</p>`;
    return `<section class="alerta-forte" id="alerta-mei" role="alert">
      <b class="af-tit">Atenção: faturamento acima do limite do MEI</b>
      ${corpo}
      <p><b>O que fazer:</b> procure um contador ou a Sala do Empreendedor da sua cidade antes de seguir vendendo nesse ritmo.</p>
      ${f.ano <= LIMITE_MEI_2027 ? `<p class="mini-info">Em 2027 o limite sobe para ${reais(LIMITE_MEI_2027)} por ano (Lei Complementar 238/2026). Confira a sua situação com o contador.</p>` : ""}
      <p class="mini-info">Fonte: gov.br, “Teto do MEI” e Lei Complementar 238/2026.</p>
    </section>`;
  }

  const mesmo = (a, b) => !!a && !!b && a.estado === b.estado && (a.opcao ?? a.valor) === (b.opcao ?? b.valor);
  const selo = (de) => `<span class="veio">Veio do Módulo ${esc(de)}</span>`;

  /* conceitos da Base técnica ligados à pergunta: pela fonte citada na pergunta */
  function conceitosDe(q) {
    const f = String(q.fonte || "").split(",")[0].trim().toLowerCase();
    if (!f) return [];
    const chave = f.replace(/\s*\(.*$/, "").slice(0, 22);
    return D.base.filter((b) => String(b.fonte || "").toLowerCase().includes(chave)).slice(0, 2);
  }
  const educativoDe = (cod) => D.educativo.filter((e) => e.onde === cod);

  function blocoEducativo(lista) {
    return lista.map((e) => `
      <div class="caixa caixa-${e.tipo === "Faça" ? "faca" : e.tipo === "Entenda" ? "entenda" : "ia"}">
        <span class="tag">${esc(e.tipo)}</span>
        <b>${esc(e.titulo)}</b>
        <p>${esc(e.texto)}</p>
        ${vazio(e.exemplo) ? "" : `<p class="ex">${esc(e.exemplo)}</p>`}
        ${vazio(e.prompt) ? "" : `<div class="prompt"><p>${esc(e.prompt)}</p><button class="btn-copiar" data-t="${esc(e.prompt)}">Copiar texto</button></div>
          <p class="ex">${esc(e.conferir)}</p>`}
        <span class="fonte">Fonte: ${esc(e.fonte)}</span>
      </div>`).join("");
  }
  function blocoConceitos(lista) {
    if (!lista.length) return "";
    return `<details class="saiba"><summary>Entenda os termos</summary>${lista.map((b) => `
      <div class="conceito"><b>${esc(b.conceito)}</b><p>${esc(b.definicao)}</p>
      ${vazio(b.exemplo) ? "" : `<p class="ex">${esc(b.exemplo)}</p>`}
      <span class="fonte">Fonte: ${link(b.link, b.fonte)}${vazio(b.data) ? "" : ` · consultado em ${esc(b.data)}`}</span></div>`).join("")}
    </details>`;
  }
  /* "Não sei": caixa "Como descobrir" (2 passos + pedido pronto para a IA com Copiar) */
  function caixaComo(q, cls) {
    if (!q || !q.comoDescobrir || !q.comoDescobrir.length) return "";
    return `<b class="como-tit">Como descobrir</b>
      <ol>${q.comoDescobrir.map((x) => `<li>${esc(x)}</li>`).join("")}</ol>
      ${q.promptIA ? `<div class="pedir-ia">
        <b>Peça ajuda à IA</b>
        <p class="como-nota">Copie, cole numa IA de sua preferência e troque o que está entre colchetes.</p>
        <p class="prompt" data-prompt>${esc(q.promptIA)}</p>
        <button class="btn-alt copiar" type="button" data-copiar>Copiar</button>
      </div>` : ""}`;
  }
  /* copiar com reserva: área de transferência → execCommand → deixa o texto selecionado (como nos Módulos 1 e 10) */
  function copiarPrompt(b) {
    const alvo = b.parentNode.querySelector("[data-prompt]"), t = alvo.textContent;
    const pronto = () => { b.textContent = "Copiado!"; setTimeout(() => { if (document.contains(b)) b.textContent = "Copiar"; }, 2000); };
    const reserva = () => {
      const ta = document.createElement("textarea");
      ta.value = t; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.top = "0"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      let foi = false;
      try { foi = document.execCommand("copy"); } catch (e) {}
      ta.remove();
      if (foi) return pronto();
      try { const r = document.createRange(); r.selectNodeContents(alvo); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r); } catch (e) {}
      b.textContent = "Toque e segure o texto para copiar";
    };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(t).then(pronto, reserva);
    else reserva();
  }
  document.addEventListener("click", (e) => { const b = e.target.closest && e.target.closest("[data-copiar]"); if (b) copiarPrompt(b); });

  function ligarCopiar(p) {
    p.querySelectorAll(".btn-copiar").forEach((b) => (b.onclick = () => {
      navigator.clipboard && navigator.clipboard.writeText(b.dataset.t);
      b.textContent = "Copiado";
    }));
  }


  /* ================= peças do layout ================= */
  function topo(trilha) {
    return `<div class="barra-topo">
      <img class="logo-mini" src="assets/minds.svg" alt="Minds of the Future">
      <nav class="trilha" aria-label="Você está em"><button class="trilha-link" data-inicio>Início</button><span>/</span><span>Módulo ${esc(D.modulo.numero)}</span>${trilha ? `<span>/</span><span>${esc(trilha)}</span>` : ""}</nav>
    </div>`;
  }
  function heroi(o) {
    /* versão leve: nas perguntas, faixa compacta (só o passo e a barra, sem ilustração) */
    if (o.compacta) return `<section class="heroi heroi-compacta">
      <div class="heroi-txt"><div class="kicker passo">${esc(o.titulo)}</div></div>
      <div class="heroi-prog"><div class="barra" role="progressbar" aria-label="Progresso" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${o.progresso}"><div class="barra-fill" style="width:${o.progresso}%"></div></div></div>
    </section>`;
    return `<section class="heroi ${o.grande ? "heroi-grande" : ""}">
      <div class="heroi-topo">
        <div class="heroi-txt">
          <div class="kicker ${o.kickerClasse || ""}">${esc(o.kicker || "Módulo " + D.modulo.numero)}</div>
          <${o.h1 ? "h1" : "h2"} class="heroi-tit ${o.tituloClasse || ""}">${esc(o.titulo)}</${o.h1 ? "h1" : "h2"}>
          ${o.texto ? `<p>${esc(o.texto)}</p>` : ""}
        </div>
        <img class="heroi-img" src="assets/${o.img || "hero-tela.webp"}" alt="">
      </div>
      ${o.progresso !== undefined ? `<div class="heroi-prog"><div class="barra" role="progressbar" aria-label="Progresso" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${o.progresso}"><div class="barra-fill" style="width:${o.progresso}%"></div></div></div>` : ""}
    </section>`;
  }
  /* texto longo: a 1ª frase fica à vista e o resto vai para "Ver mais" (fechado) */
  function curto(texto) {
    const t = String(texto || "").trim();
    if (t.length <= LIMITE_TEXTO) return esc(t);
    const m = /^(.+?[.!?:])\s+(?=[A-ZÀ-Ú“"(])/.exec(t);
    if (!m || m[1].length >= t.length - 20) return esc(t);
    return `${esc(m[1])} <details class="mais"><summary>Ver mais</summary>${esc(t.slice(m[0].length))}</details>`;
  }
  /* "Ver dica" fechada entre a pergunta e as respostas: o texto de apoio + os termos da Base técnica */
  function dica(texto, termos) {
    termos = termos || [];
    if (vazio(texto) && !termos.length) return "";
    return `<details class="dica-toggle"><summary>Ver dica</summary>
      ${vazio(texto) ? "" : `<p class="ajuda">${esc(texto)}</p>`}
      ${termos.map((b) => `<div class="conceito"><b>${esc(b.conceito)}</b><p>${esc(b.definicao)}</p></div>`).join("")}
    </details>`;
  }
  /* "Voltar" no topo, à esquerda, no mesmo lugar em todas as telas (padrão do Módulo 1) */
  const botaoVoltar = () => `<button class="voltar voltar-topo" id="v">Voltar</button>`;
  function ligar(p) {
    p.querySelectorAll("[data-inicio]").forEach((b) => { b.onclick = () => ir(telaCapa); });
  }

  /* ================= capa ================= */
  function telaCapa() {
    const iniciado = S.hist.length > 0;
    const p = el(`
      <div class="pag">
        ${topo("")}
        ${heroi({ grande: true, h1: true, kicker: "Módulo " + D.modulo.numero, titulo: D.modulo.nome, texto: D.capa.frase, img: "hero-inicio.webp" })}
        <main class="corpo">
          <p class="tempo">Este módulo leva uns ${esc(D.capa.minutos)} minutos</p>
          <div class="acoes">
            <button class="btn btn-primario seta" id="ir">${iniciado ? "Continuar de onde parei" : "Começar"}</button>
            ${iniciado ? `<button class="btn btn-claro" id="zerar">Recomeçar do zero</button>` : ""}
          </div>
          <details class="como-funciona cartao"><summary>Como funciona</summary>
            <h3>Para quem é</h3><p>${esc(D.mapa.usuario)}</p>
            <h3>O que ter em mãos</h3><p>${esc(D.mapa.ter_em_maos)}</p>
            <h3>O que você recebe no final</h3><p>${esc(D.mapa.entrega)}</p>
            <div class="acoes">
              <button class="btn btn-linha" id="base">Consultar as ocupações permitidas ao MEI</button>
              <button class="btn btn-linha" id="limites">O que este módulo não faz</button>
            </div>
          </details>
          ${rodape(true)}
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
    p.querySelector("#base").onclick = () => ir(telaBase, () => ir(telaCapa));
    return p;
  }

  function telaLimites() {
    const p = el(`
      <div class="pag">
        ${topo("Limites")}
        ${heroi({ titulo: "Limites do módulo" })}
        <main class="corpo">
          ${botaoVoltar()}
          <div class="cartao"><h3>O que o módulo não faz</h3><p>${esc(D.mapa.nao_faz)}</p></div>
          <div class="cartao"><h3>Que decisões ele apoia</h3><p>${esc(D.mapa.decisoes)}</p></div>
          <div class="cartao"><h3>Quando procurar um profissional</h3><p>${esc(D.mapa.encaminhamentos)}</p></div>
          <div class="aviso">${esc(D.mapa.mensagem_limite)}</div>
          ${rodape()}
        </main>
      </div>`);
    ligar(p);
    p.querySelector("#v").onclick = () => ir(telaCapa);
    return p;
  }

  /* ================= Anexo XI (ocupações permitidas ao MEI) ================= */
  function telaBase(voltar, termo) {
    const AX = D.anexo;
    const p = el(`
      <div class="pag">
        ${topo("Ocupações permitidas ao MEI")}
        ${heroi({ titulo: "Ocupações permitidas ao MEI" })}
        <main class="corpo">
          ${botaoVoltar()}
          <p class="ajuda">${esc(AX.titulo)}</p>
          <input class="campo" id="busca" placeholder="Busque pela ocupação, pelo CNAE ou pela descrição" value="${esc(termo || "")}">
          <p class="mini-info" id="conta"></p>
          <div id="lista"></div>
          ${rodape()}
        </main>
      </div>`);
    const lista = p.querySelector("#lista");
    const desenhar = (t) => {
      const linhas = Motor.buscarAnexo(M, t);
      p.querySelector("#conta").textContent = `${linhas.length} de ${AX.linhas.length} ocupações`;
      lista.innerHTML = linhas.slice(0, 80).map((l) => linhaAnexo(l, true)).join("") || `<p class="ajuda">Nenhuma ocupação encontrada.</p>`;
    };
    ligarCnae(p);
    p.querySelector("#busca").oninput = (e) => desenhar(e.target.value);
    desenhar(termo || "");
    ligar(p);
    p.querySelector("#v").onclick = () => voltar ? voltar() : ir(telaCapa);
    return p;
  }
  /* com acoes = true, a ocupação ganha "Copiar" (código e nome) e "Escolher este" (salva como CNAE escolhido) */
  function linhaAnexo(l, acoes) {
    const esc1 = S.cnae && S.cnae.cnae === l.cnae && S.cnae.ocupacao === l.ocupacao;
    return `<div class="cnae${esc1 ? " cnae-escolhido" : ""}">
      <div class="cnae-topo"><b>${esc(l.cnae)}</b><span class="nivel n1">${esc(l.tabela)}</span></div>
      <p><b>${esc(l.ocupacao)}</b></p>
      <p class="ex">${esc(l.descricao)}</p>
      <p class="mini-info">ISS: ${esc(l.iss)} · ICMS: ${esc(l.icms)}</p>
      ${acoes ? `<div class="cnae-acoes"><button class="btn-mini btn-copiar-cnae" data-t="${esc(l.cnae + " - " + l.ocupacao)}">Copiar</button>
        <button class="btn-mini btn-escolher" data-cnae="${esc(l.cnae)}" data-ocup="${esc(l.ocupacao)}" aria-pressed="${esc1}">${esc1 ? "Escolhido" : "Escolher este"}</button></div>` : ""}
    </div>`;
  }
  function copiarTexto(t) {
    try { if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(t).catch(() => copiarAntigo(t)); } catch (e) {}
    copiarAntigo(t);
  }
  function copiarAntigo(t) {
    const a = document.createElement("textarea"); a.value = t; a.setAttribute("readonly", ""); a.style.position = "absolute"; a.style.left = "-9999px";
    document.body.appendChild(a); a.select(); try { document.execCommand("copy"); } catch (e) {} a.remove();
  }
  /* "Copiar" e "Escolher este" nas listas de ocupações (sugestões do resumo e consulta) */
  function ligarCnae(p) {
    p.addEventListener("click", (e) => {
      const c = e.target.closest(".btn-copiar-cnae");
      if (c) { copiarTexto(c.dataset.t); c.textContent = "Copiado"; return; }
      const b = e.target.closest(".btn-escolher");
      if (!b) return;
      S.cnae = { cnae: b.dataset.cnae, ocupacao: b.dataset.ocup };
      salvar();
      p.querySelectorAll(".btn-escolher").forEach((x) => {
        const sel = x.dataset.cnae === S.cnae.cnae && x.dataset.ocup === S.cnae.ocupacao;
        x.textContent = sel ? "Escolhido" : "Escolher este"; x.setAttribute("aria-pressed", String(sel));
        x.closest(".cnae").classList.toggle("cnae-escolhido", sel);
      });
      const box = p.querySelector("#cnae-escolhido");
      if (box) box.outerHTML = blocoEscolhido();
    });
  }
  function blocoEscolhido() {
    if (!S.cnae) return `<div id="cnae-escolhido" hidden></div>`;
    return `<section class="cartao cnae-esc" id="cnae-escolhido"><h3>CNAE escolhido</h3><p><b>${esc(S.cnae.cnae)}</b> · ${esc(S.cnae.ocupacao)}</p>
      <p class="mini-info">Leve este código quando for à Sala do Empreendedor ou ao contador, para conferir se ele descreve o que você faz.</p></section>`;
  }

  /* "Quem pode ser MEI": critérios básicos antes de procurar contador ou Sebrae */
  function blocoQuemMei(aberto) {
    const corpo = `<ul class="criterios">
        <li>Faturar até ${reais(LIMITE_MEI_ANO)} por ano em 2026 (cerca de ${reais(LIMITE_MEI_ANO / 12)} por mês). Em 2027 o limite sobe para ${reais(LIMITE_MEI_2027)} por ano.</li>
        <li>Ter uma atividade que esteja na lista de ocupações permitidas ao MEI.</li>
        <li>Não ser sócio nem titular de outra empresa.</li>
        <li>Em 2026, ter no máximo 1 empregado. A partir de 1º de janeiro de 2027, até 2, cada um recebendo 1 salário mínimo ou o piso da categoria.</li>
      </ul>
      <p>Confira na Sala do Empreendedor ou no ${link(FONTE.portal, "Portal do Empreendedor (gov.br)")}.</p>
      <span class="fonte">Fonte: ${link(FONTE.criterios, "gov.br, “Cadastrar/formalizar Microempreendedor Individual”")}, ${link(FONTE.lei238, "Lei Complementar 238/2026")} e ${link(FONTE.tetoMei, "MEMP: Teto do MEI")}.</span>`;
    return aberto
      ? `<section class="cartao quem-mei" id="quem-mei"><h3>Quem pode ser MEI</h3>${corpo}</section>`
      : `<details class="saiba quem-mei" id="quem-mei"><summary>Quem pode ser MEI</summary>${corpo}</details>`;
  }

  /* onde tirar as dúvidas sobre formalização (depois da pergunta da dúvida principal) */
  function blocoFontes() {
    return `<section class="bloco b-enc fontes" id="fontes-duvida"><b>Onde tirar suas dúvidas</b>
      <ul class="criterios">
        <li>${link(FONTE.salaJF, "Sala do Empreendedor de Juiz de Fora")}, da prefeitura (em outra cidade, procure a Sala do Empreendedor ou a prefeitura da sua cidade).</li>
        <li>${link(FONTE.portal, "Portal do Empreendedor (gov.br)")}: quem pode ser MEI, atividades permitidas e abertura do MEI.</li>
        <li>${link(FONTE.sebrae, "Sebrae")}: ${SEBRAE_TEL}, ligação gratuita.</li>
        <li>Um contador, para dúvidas sobre impostos, CNAE e tipo de empresa.</li>
      </ul></section>`;
  }

  /* ================= pergunta ================= */
  function progresso() {
    const vistas = S.hist.filter((c) => c !== "RESULTADO").length;
    return Math.min(100, Math.round((vistas / M.perguntas.length) * 100));
  }

  const LIGA_ANEXO = ["M8.P06", "M8.P07"];   // perguntas que citam CNAE / lista de ocupações MEI
  function telaPergunta(cod) {
    const q = M.porCodigo[cod];
    if (S.hist[S.hist.length - 1] !== cod) { S.hist.push(cod); salvar(); }
    const tipo = Motor.campo(q);
    const H = S.R[cod] ? null : herdado(cod);       // pré-preenchimento só quando ainda não respondeu aqui
    const resp = S.R[cod] || (H && H.r) || null;
    let escolhida = resp && resp.estado === "opcao" ? resp.opcao : null;
    const deOnde = H ? H.de : S.R[cod] && S.R[cod].de;
    const nota = H && H.nota ? H.nota : S.R[cod] && S.R[cod].nota;

    const p = el(`
      <div class="pag">
        ${heroi({ compacta: true, titulo: `Pergunta ${M.perguntas.indexOf(q) + 1} de ${M.perguntas.length}`, progresso: progresso() })}
        <main class="corpo">
          <div class="cartao-q pergunta">
            ${botaoVoltar()}
            <h2 class="q">${esc(q.pergunta)}</h2>
            ${deOnde ? `<div class="herdou" id="herdou">${selo(deOnde)}<span>${H ? "Confira e ajuste se quiser." : "Você já conferiu esta resposta."}</span>${nota ? `<p class="conta">${esc(nota)}</p>` : ""}</div>` : ""}
            ${dica(q.ajuda, conceitosDe(q))}
            <div class="entrada" id="ent"></div>
            ${Motor.temNaoSei(q) ? `<div class="alt"><button class="btn-alt" id="ns">Não sei</button></div>` : ""}
            <div class="erro" id="erro" hidden></div>
            <section class="como-descobrir" id="ns-ajuda" role="status" hidden></section>
            <div id="retorno"></div>
            <div class="acoes" id="acoes"><button class="btn btn-primario seta" id="ok">Continuar</button></div>
            ${LIGA_ANEXO.includes(cod) ? `<div class="alt"><button class="btn-alt" id="anexo">Consultar as ocupações permitidas ao MEI</button></div>` : ""}
            ${cod === "M8.P07" ? blocoQuemMei(false) : ""}
            ${blocoEducativo(educativoDe(cod))}
          </div>
          ${rodape(false)}
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
        const b = el(`<button class="opcao ${escolhida === op ? "sel" : ""}"><span class="radio" aria-hidden="true"></span><span class="op-txt"><b>${esc(op)}</b></span></button>`);
        b.onclick = () => {
          ent.querySelectorAll(".opcao").forEach((x) => x.classList.remove("sel"));
          if (op === NS && NS_PRECISA.has(cod)) { escolhida = null; return pedirResposta(); }   // não marca, não grava
          if (op === NS) mostrarComo(); else escondeNs();   // nas outras, "Não sei" vale e já mostra como descobrir
          escolhida = op; b.classList.add("sel");
        };
        ent.appendChild(b);
      });
    } else {
      const v = resp && resp.estado === "valor" ? resp.valor : "";
      ent.appendChild(el(tipo === "numero"
        ? `<div class="linha"><input class="campo" inputmode="decimal" placeholder="${esc(q.exemplo || "Ex.: 2.500,00")}" value="${esc(v)}"><span class="pre">R$</span></div>`
        : `<textarea class="campo" rows="3" placeholder="${esc(q.exemplo || "")}">${esc(v)}</textarea>`));
    }
    const ax = p.querySelector("#anexo");
    if (ax) ax.onclick = () => {
      const t = ent.querySelector("input,textarea");
      ir(telaBase, () => ir(telaPergunta, cod), t && cod === "M8.P06" ? t.value : "");
    };
    const ns = p.querySelector("#ns");
    if (ns) ns.onclick = () => NS_PRECISA.has(cod) ? pedirResposta() : responder({ estado: "naosei" });
    /* "Não sei" numa pergunta necessária: explica como descobrir e pede a resposta (nada é gravado) */
    function pedirResposta() {
      p.querySelector("#erro").hidden = true;
      const box = mostrarComo(`<p class="ns-pede"><b>Precisamos desta resposta para seguir.</b> ${tipo === "escolha" ? "Escolha a opção que mais se aproxima e toque em Continuar." : "Escreva a sua resposta no campo e toque em Continuar."}</p>`);
      const f = ent.querySelector("input,textarea");
      if (f) f.focus({ preventScroll: true });
      box.scrollIntoView({ block: "nearest" });
    }
    /* caixa "Como descobrir" desta pergunta (passos + pedido para a IA); extra = aviso de que a resposta é obrigatória */
    function mostrarComo(extra) {
      const box = p.querySelector("#ns-ajuda");
      box.innerHTML = caixaComo(q) + (extra || "");
      box.hidden = !box.innerHTML.trim();
      return box;
    }
    function escondeNs() { const box = p.querySelector("#ns-ajuda"); if (box) box.hidden = true; }

    p.querySelector("#ok").onclick = () => {
      if (tipo === "escolha") {
        if (!escolhida) return erro("Escolha uma opção para continuar.");
        return responder({ estado: "opcao", opcao: escolhida });
      }
      const v = ent.querySelector("input,textarea").value.trim();
      if (!v) return erro(Motor.temNaoSei(q) && !NS_PRECISA.has(cod) ? "Responda ou toque em \"Não sei\"." : "Responda para continuar.");
      if (tipo === "numero") {
        if (/^-/.test(v.replace(/^R\$\s*/i, ""))) return erro("O valor não pode ser negativo. Digite quanto espera faturar por mês.");
        if (!/^(R\$\s*)?\d[\d.\s]*(,\d+)?$|^(R\$\s*)?\d+(\.\d+)?$/i.test(v) || numero(v) == null) return erro("Digite só números. Ex.: 2500 ou 2.500,00");
        const n = numero(v);
        /* valor muito alto: avisa uma vez; o segundo Continuar com o mesmo valor segue */
        if (n > FAT_MES_ALTO && avisado !== v) {
          avisado = v;
          return erro(`Esse valor parece alto para um pequeno negócio: ${reais(n)} por mês dá cerca de ${reais(Math.round(n * 12))} por ano. Confira se digitou certo. Se estiver certo, toque em Continuar de novo.`, true);
        }
      }
      responder({ estado: "valor", valor: v });
    };
    let avisado = null;
    function erro(t, aviso) {
      const e = p.querySelector("#erro"); e.textContent = t; e.hidden = false; e.classList.toggle("erro-aviso", !!aviso);
      const ok = p.querySelector("#ok"); if (ok && ok.scrollIntoView) ok.scrollIntoView({ block: "nearest" });   // o Continuar continua à vista
    }

    function responder(r0) {
      p.querySelector("#erro").hidden = true;
      if (r0.estado === "naosei" || r0.opcao === NS) mostrarComo(); else escondeNs();   // "Não sei" gravado: a caixa fica à vista
      /* guarda de onde veio quando a pessoa manteve o valor herdado (aparece com o selo no resumo) */
      const h = H || (S.R[cod] && S.R[cod].de ? S.R[cod] : null);
      if (h && mesmo(r0, h.r || h)) { r0.de = h.de; if (h.nota) r0.nota = h.nota; }
      S.R[cod] = r0;
      /* respostas de perguntas que deixaram de aparecer são descartadas */
      limparInvisiveis();
      salvar();
      const regras = Motor.regrasAgora(M, S.R, cod);
      const prox = Motor.proxima(M, S.R, cod);
      mostrarRetorno(regras, prox);
    }

    function mostrarRetorno(regras, prox) {
      const box = p.querySelector("#retorno");
      const cnaes = cod === "M8.P06" ? Motor.cnaes(M, S.R) : [];
      box.innerHTML = `<div class="retorno">
        ${vazio(q.resposta) ? "" : `<p class="r-texto r-pergunta">${esc(q.resposta)}</p>`}
        ${cod === "M8.P02" ? avisoTipo(Motor.valor(S.R, cod)) : ""}
        ${cod === "M8.P04" || cod === "M8.P05" ? alertaMei() : ""}
        ${cnaes.map(blocoCnae).join("")}
        ${regras.map((r) => `
          <div class="regra">
            <p class="r-texto">${esc(r.texto)}</p>
            ${vazio(r.alerta) ? "" : `<div class="bloco b-alerta"><b>Atenção</b>${esc(r.alerta)}</div>`}
            ${vazio(r.proximo) ? "" : `<div class="bloco b-proximo"><b>Próximo passo</b>${esc(r.proximo)}</div>`}
            ${vazio(r.encaminhamento) ? "" : `<div class="bloco b-enc"><b>Quem procurar</b>${esc(r.encaminhamento)}</div>`}
          </div>`).join("")}
        ${vazio(q.alerta) ? "" : `<div class="bloco b-alerta"><b>Atenção</b>${esc(q.alerta)}</div>`}
        ${cod === "M8.P10" ? blocoFontes() : ""}
      </div>`;
      const acoes = p.querySelector("#acoes");
      acoes.innerHTML = "";
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

  /* "possíveis CNAEs compatíveis": busca por palavras da descrição da atividade na lista de ocupações do MEI */
  function blocoSugestoes() {
    const ativ = Motor.valor(S.R, "M8.P01");
    const desc = ativ && ativ !== NS ? ativ : textoDe(lerR("lg2-turma-a-m01")["M1.P03"]);
    const confira = `<p class="mini-info">Esta é só uma busca pelas palavras que você usou. Confira na Sala do Empreendedor ou com um contador qual ocupação descreve de verdade o que você faz.</p>`;
    let corpo;
    if (!desc) corpo = `<p>Você não descreveu a sua atividade, então não foi possível procurar ocupações do MEI que combinem com ela. Use o botão “Consultar as ocupações permitidas ao MEI” logo abaixo para procurar por conta própria.</p>`;
    else {
      const ls = Motor.sugerirAnexo(M, desc);
      corpo = ls.length
        ? `<p>Pela sua descrição (“${esc(desc)}”), estas ocupações permitidas ao MEI podem combinar com a sua atividade. Toque em “Escolher este” para guardar a que mais combina, ou em “Copiar” para levar o código.</p>${ls.map((l) => linhaAnexo(l, true)).join("")}${confira}`
        : `<p>Não encontramos, na lista de ocupações permitidas ao MEI, nenhuma que combine com as palavras da sua descrição (“${esc(desc)}”). Isso não quer dizer que a sua atividade não possa ser MEI: procure com outras palavras no botão “Consultar as ocupações permitidas ao MEI” ou peça ajuda na Sala do Empreendedor.</p>`;
    }
    return `<section class="sugestoes" id="sugestoes"><div class="secao-titulo">Possíveis CNAEs compatíveis</div>${corpo}</section>`;
  }

  function blocoCnae(c) {
    return c.linhas.length
      ? `<p class="mini-info">CNAE ${esc(c.cnae)} na lista de ocupações permitidas ao MEI (Anexo XI):</p>${c.linhas.map((l) => linhaAnexo(l)).join("")}`
      : `<div class="cnae"><div class="cnae-topo"><b>${esc(c.cnae)}</b><span class="nivel n0">não consta no Anexo XI</span></div></div>`;
  }

  /* ================= resultado: resumo das respostas + alertas da planilha ================= */
  function telaResultado() {
    const regras = Motor.regrasTodas(M, S.R);
    const lac = Motor.lacunas(regras), enc = Motor.encaminhamentos(regras), ale = Motor.alertas(regras);
    const resp = Motor.respondidas(M, S.R);
    const ns = resp.filter((q) => Motor.valor(S.R, q.codigo) === Motor.NS);
    const cnaes = Motor.cnaes(M, S.R);
    const p = el(`
      <div class="pag">
        ${topo("Resultado")}
        ${heroi({ kicker: "Resultado", kickerClasse: "passo", titulo: "Resumo da sua formalização" })}
        <main class="corpo">
          ${botaoVoltar()}
          <section class="concluido">
            <div class="conc-topo"><span class="check" aria-hidden="true"></span><div><h2>Você concluiu o Módulo ${esc(D.modulo.numero)}</h2></div></div>
          </section>
          <section class="entendemos" id="entendemos">
            <h3>O que entendemos até aqui</h3>
            ${entendemos().map((f) => `<p>${esc(f)}</p>`).join("")}
          </section>
          ${alertaMei()}
          ${avisoTipo(Motor.valor(S.R, "M8.P02"))}
          <section class="bloco b-proximo" id="tarefa"><b>Seu próximo passo</b><p>${esc(tarefa())}</p></section>
          ${ns.length ? `<section class="bloco b-lacuna" id="falta"><b>O que falta descobrir</b><ul>${ns.map((q) => `<li>${esc(q.pergunta)}
            ${q.comoDescobrir && q.comoDescobrir.length ? `<details class="como-mini"><summary>Como descobrir</summary><section class="como-descobrir">${caixaComo(q)}</section></details>` : ""}</li>`).join("")}</ul></section>` : ""}

          <details class="saiba respostas"><summary>Ver suas respostas</summary>
          <div class="res-num">
            <div class="lbl">Perguntas respondidas</div>
            <div class="val">${resp.length}</div>
            <div class="sub">${ns.length ? `${ns.length} com “Não sei”` : "nenhuma com “Não sei”"}</div>
          </div>
          ${resp.map((q, i) => `
            <div class="etapa ${Motor.valor(S.R, q.codigo) === Motor.NS ? "e-conf" : "e-sim"}">
              <div class="etapa-topo"><span class="etq">${i + 1}</span><b>${esc(q.pergunta)}</b></div>
              <p>${esc(mostrar(q.codigo))}${S.R[q.codigo].de ? " " + selo(S.R[q.codigo].de) : ""}</p>
              ${S.R[q.codigo].nota ? `<p class="mini-info">${esc(S.R[q.codigo].nota)}</p>` : ""}
              ${vazio(q.alerta) ? "" : `<p class="mini-info"><b>Atenção:</b> ${esc(q.alerta)}</p>`}
            </div>`).join("")}
          </details>
          <details class="saiba ocupacoes" id="ocupacoes"><summary>Ocupações do MEI para a sua atividade</summary>
            ${blocoSugestoes()}
            ${blocoEscolhido()}
            ${cnaes.map(blocoCnae).join("")}
          </details>
          <details class="saiba detalhes" id="mais-detalhes"><summary>Mais detalhes</summary>
            ${blocoQuemMei(true)}
            ${regras.length ? `<div class="secao-titulo">Orientações</div>${regras.map((r) => `<div class="cartao"><p>${esc(r.texto)}</p>
              ${vazio(r.proximo) ? "" : `<p class="mini-info"><b>Próximo passo:</b> ${esc(r.proximo)}</p>`}</div>`).join("")}` : ""}
            ${ale.length ? `<div class="secao-titulo">Alertas</div>${ale.map((a) => `<div class="bloco b-alerta">${esc(a)}</div>`).join("")}` : ""}
            ${lac.length ? `<div class="bloco b-lacuna"><b>O que ainda falta saber</b><ul>${lac.map((l) => `<li>${esc(l)}</li>`).join("")}</ul></div>` : ""}
            ${enc.length ? `<div class="bloco b-enc"><b>Quem procurar, pelas suas respostas</b>${enc.map(esc).join(" · ")}</div>` : ""}
            ${S.R["M8.P10"] ? blocoFontes() : ""}
            <div class="aviso">${esc(D.mapa.mensagem_limite)}</div>
            <div class="cartao"><h3>O que este módulo entrega</h3><p>${esc(D.mapa.entrega)}</p></div>
            <div class="cartao"><h3>Quando procurar um profissional</h3><p>${esc(D.mapa.encaminhamentos)}</p></div>
            ${blocoConceitos(D.base)}
          </details>

          <div class="acoes">
            <button class="btn btn-primario" id="imp">Salvar ou imprimir</button>
            <button class="btn btn-claro" id="rev">Revisar respostas</button>
            <button class="btn btn-linha" id="base">Consultar as ocupações permitidas ao MEI</button>
            <button class="btn btn-linha" id="novo">Começar outra análise</button>
          </div>
          <div class="acoes lg2-proximo"><a class="btn btn-primario" style="text-decoration:none;text-align:center;box-sizing:border-box" href="/lg2/turma-b/m09/index.html">Ir para o Módulo 9</a></div>
          ${rodape()}
        </main>
      </div>`);
    ligar(p);
    ligarCnae(p);
    p.querySelector("#v").onclick = () => { S.hist.pop(); const a = S.hist.pop(); salvar(); ir(telaPergunta, a); };
    p.querySelector("#imp").onclick = () => { p.querySelectorAll("details.respostas, details.ocupacoes, details.detalhes").forEach((d) => (d.open = true)); window.print(); };
    p.querySelector("#rev").onclick = () => { S.hist = []; salvar(); ir(telaPergunta, Motor.proxima(M, {}, null)); };
    p.querySelector("#base").onclick = () => ir(telaBase, () => ir(telaResultado));
    p.querySelector("#novo").onclick = () => { if (confirm("Começar uma nova análise? As respostas atuais serão apagadas.")) { S = novo(); salvar(); ir(telaPergunta, Motor.proxima(M, {}, null)); } };
    return p;
  }

  /* "Seu próximo passo": uma tarefa só, pela dúvida principal (P10) e pelo que ficou em aberto */
  function tarefa() {
    const f = faturamentoAno(), cnpj = sigla(Motor.valor(S.R, "M8.P05"));
    if (f && f.ano > LIMITE_MEI_ANO && (!cnpj || ["MEI", "Não", NS].includes(cnpj)))
      return "Leve este resumo a um contador ou à Sala do Empreendedor de Juiz de Fora: o seu faturamento passa do limite do MEI.";
    const porDuvida = {
      "Como escolher o CNAE": "Abra “Ocupações do MEI para a sua atividade”, logo abaixo, escolha a que mais descreve o que você faz e confirme o código na Sala do Empreendedor.",
      "Se posso ser MEI": "Confira os 4 pontos de “Quem pode ser MEI”, em “Mais detalhes”, e leve este resumo à Sala do Empreendedor de Juiz de Fora.",
      "Quais licenças preciso": "Faça o Módulo 9: ele mostra as licenças mais comuns para a sua atividade e o seu local.",
      "Obrigações do CNPJ": "Converse com um contador ou ligue de graça para o Sebrae (" + SEBRAE_TEL + ") sobre os impostos e as obrigações de cada mês.",
    };
    return porDuvida[Motor.valor(S.R, "M8.P10")] || "Leve este resumo à Sala do Empreendedor de Juiz de Fora (ou da sua cidade) para tirar as dúvidas e ver o primeiro passo.";
  }

  /* valor mostrado no resumo (faturamento em reais) */
  function mostrar(cod) {
    const v = Motor.valor(S.R, cod);
    if (cod === "M8.P04" && v !== NS && numero(v) != null) return reais(numero(v)) + " por mês";
    return v;
  }

  /* "O que entendemos até aqui": frases montadas por regras com as respostas deste módulo
     e o que já existe nos módulos anteriores (estágio do Módulo 1, cliente do Módulo 3) */
  /* texto corrido: as frases de cada assunto viram um parágrafo (1 a 3 parágrafos curtos, sem lista) */
  const emParagrafos = (fr, ...cortes) => [0, ...cortes].map((c, i, a) => fr.slice(c, i + 1 < a.length ? a[i + 1] : fr.length).join(" ")).filter(Boolean);
  function entendemos() {
    const v = (c) => { const x = Motor.valor(S.R, c); return x && x !== NS ? x : null; };
    const minus = (t) => t.charAt(0).toLowerCase() + t.slice(1);
    const semPonto = (t) => String(t).trim().replace(/[.!]+$/, "");
    const m1 = lerR("lg2-turma-a-m01"), m3 = lerR("lg2-turma-a-m03");
    const f = [];
    const ativ = v("M8.P01"), tipo = v("M8.P02");
    const tipoTxt = { "Produto": "um produto (você faz o que vende)", "Mercadoria": "revenda de mercadoria (você compra pronto e revende)",
                      "Serviço": "um serviço", "Produto e serviço": "produto e serviço ao mesmo tempo" }[tipo];
    if (ativ) f.push(`Sua atividade é: ${semPonto(ativ)}${tipoTxt ? ` — principalmente ${tipoTxt}` : ""}.`);
    else if (tipoTxt) f.push(`Sua atividade envolve principalmente ${tipoTxt}.`);
    const est = { "Ainda está só na minha cabeça": "Seu negócio ainda está no papel: você não começou a vender.",
                  "Já fiz um pouco para testar ou dar de amostra": "Você está começando: já fez testes ou deu amostras.",
                  "Já vendi algumas vezes": "Você já vende, ainda de vez em quando.",
                  "Já vendo sempre": "Você já vende com frequência." }[textoDe(m1["M1.P01"])];
    if (est) f.push(est);
    const dor = textoDe(m3["M3.P11"]);
    if (dor) f.push(`Para o seu cliente, você resolve: ${minus(semPonto(dor))}.`);
    const local = { "Minha casa": "Você trabalha na sua casa", "Ponto comercial": "Você trabalha em um ponto comercial",
                    "Atendimento externo": "Você atende fora, no local do cliente", "Online": "Você trabalha pela internet",
                    [DOMICILIO]: "Você atende na casa do cliente" }[v("M8.P03")];
    if (local) f.push(local + (local.includes("internet") ? "."
      : v("M8.P03") === DOMICILIO ? ": não precisa de alvará de um ponto, mas a atividade pode pedir licença da prefeitura." : ", e isso pode pedir licenças da prefeitura."));
    const c1 = f.length;   // 1º parágrafo: a atividade, o estágio, o cliente e o lugar
    const fat = numero(v("M8.P04"));
    if (fat > 0) {
      const ano = fat * 12;
      f.push(`Você estima faturar ${reais(fat)} por mês, cerca de ${reais(Math.round(ano))} por ano — ${ano <= LIMITE_MEI_ANO
        ? "dentro do limite do MEI (R$ 81 mil por ano), então o MEI pode ser um caminho se a sua ocupação for permitida."
        : sigla(v("M8.P05")) === "MEI"
          ? "acima do limite do MEI (R$ 81 mil por ano): com esse faturamento, o seu negócio sai do MEI. Procure um contador ou a Sala do Empreendedor."
          : "acima do limite do MEI (R$ 81 mil por ano); converse com um contador sobre outras formas de abrir o CNPJ."}`);
    }
    const cnpj = v("M8.P05");
    if (cnpj === "Não") f.push("Você ainda não tem CNPJ.");
    else if (cnpj && cnpj !== NS) f.push(`Você já tem CNPJ: ${cnpj}.`);
    if (S.cnae) f.push(`Você escolheu o CNAE ${S.cnae.cnae} (${minus(S.cnae.ocupacao.toLowerCase())}).`);
    const c2 = f.length;   // 2º: faturamento e CNPJ; 3º: a dúvida principal
    const duv = v("M8.P10");
    if (duv && f.length < 6) f.push(`Sua principal dúvida agora é: ${minus(duv)}.`);
    if (!f.length) f.push("Você ainda não deu detalhes suficientes sobre o seu negócio. Volte às perguntas quando souber mais.");
    return emParagrafos(f.slice(0, 6), c1, c2);
  }

  function rodape(credito) {
    return `<footer class="rodape">
      ${credito === false ? "" : `<p class="credito">Conteúdo do Laboratório de Gestão II · FACC/UFJF · versão ${esc(D.modulo.versao)} · fontes consultadas em ${esc(D.modulo.data)}</p>`}
      <div class="logos">
        <img src="assets/logo_facc.png" alt="FACC">
        <img src="assets/logo_ufjf.svg" alt="UFJF">
        <img src="assets/logo_mg.svg" alt="Governo de Minas Gerais">
      </div>
    </footer>`;
  }

  /* teclado do celular: o campo em foco vai para o centro da área visível (com o Continuar logo abaixo) */
  let focado = null, espera = 0;
  const centrar = () => { if (focado && document.activeElement === focado) focado.scrollIntoView({ block: "center" }); };
  document.addEventListener("focusin", (e) => {
    if (!e.target.matches || !e.target.matches("input, textarea, select")) return;
    focado = e.target; clearTimeout(espera); espera = setTimeout(centrar, ESPERA_TECLADO);
  });
  document.addEventListener("focusout", () => { focado = null; });
  if (window.visualViewport) window.visualViewport.addEventListener("resize", centrar);

  ir(telaCapa);
})();
