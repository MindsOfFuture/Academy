/* Telas do Módulo 10 (Turma B). Todo texto de conteúdo vem de window.MODULO10 (planilha
   "Perguntas e Caminhos" do Grupo 10; capa e conceitos do documento v2 do grupo), sem edição.
   O módulo fecha o percurso: lê as respostas dos Módulos 1 a 9 guardadas neste aparelho (só leitura).
   As regras da lista de prioridades e do plano ficam em motor.js; a capacidade do Módulo 7 em motor7.js. */
(function () {
  "use strict";
  const D = window.MODULO10;
  const Mo = window.Motor10;
  const M7c = window.Motor7;
  const tela = document.getElementById("tela");
  const CHAVE = "lg2-turma-b-m10";
  const VERSAO = 2; // v2 = planilha "Perguntas e Caminhos"; descarta as respostas da versão anterior
  const NS = "Não sei";
  const Q = Object.fromEntries(D.perguntas.map((q) => [q.codigo, q]));
  const SOCIO = "SOCIO"; // pergunta do documento v2 ("Você tem ou pretende ter sócio?"): o Módulo 8 publicado não a faz

  /* ---------- estado ---------- */
  function novo() { return { v: VERSAO, ini: null, R: {}, roteiro: null, hist: [], inst: { mensagem: null, checklist: {} }, voltarResumo: false }; }
  function carregar() { try { const s = JSON.parse(localStorage.getItem(CHAVE)); return s && s.v === VERSAO && s.R ? Object.assign(novo(), s) : novo(); } catch (e) { return novo(); } }
  let S = carregar();
  let aviso = "";
  function salvar() {
    try { localStorage.setItem(CHAVE, JSON.stringify(S)); aviso = ""; }
    catch (e) { aviso = "Não foi possível salvar. Mantenha a página aberta e imprima o resultado para guardar suas respostas."; }
  }

  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  function el(html) { const d = document.createElement("div"); d.innerHTML = html.trim(); return d.firstElementChild; }
  function ir(f, a) { tela.innerHTML = ""; tela.appendChild(f(a)); window.scrollTo(0, 0); }
  function redesenhar(f, a) { const y = window.scrollY; tela.innerHTML = ""; tela.appendChild(f(a)); window.scrollTo(0, y); }
  const cap1 = (s) => { s = String(s || "").trim(); return s.charAt(0).toUpperCase() + s.slice(1); };
  /* minúscula só na 1ª letra de cada item ("Redes sociais (Instagram, …), Loja física" → "redes sociais (Instagram, …), loja física") */
  const lc = (s) => String(s || "").split(/,\s*(?![^()]*\))/).map((x) => x.charAt(0).toLowerCase() + x.slice(1)).join(", ");
  const curto = (s, n) => { s = String(s || "").replace(/\s+/g, " ").trim(); return s.length > (n || 90) ? s.slice(0, (n || 90) - 1).trimEnd() + "…" : s; };

  /* ---------- respostas dos Módulos 1 a 9 guardadas neste aparelho (só leitura) ---------- */
  const MODS = { 1: "lg2-turma-a-m01", 2: "lg2-turma-b-m02", 3: "lg2-turma-a-m03", 4: "lg2-turma-a-m04", 5: "lg2-turma-a-m05", 6: "lg2-turma-b-m06", 7: "lg2-turma-b-m07", 8: "lg2-turma-b-m08", 9: "lg2-turma-b-m09" };
  const LINK = (n) => `/lg2/${MODS[n].replace("lg2-", "").replace(/-m\d\d$/, "")}/m${String(n).padStart(2, "0")}/index.html`;
  function lerEstado(n) { try { return JSON.parse(localStorage.getItem(MODS[n])) || null; } catch (e) { return null; } }
  const lerR = (n) => { const s = lerEstado(n); return (s && s.R) || {}; };
  const valor = (r) => !r ? null : r.estado === "opcao" ? r.opcao : r.estado === "valor" ? r.valor : null;
  const textoDe = (r) => { const x = valor(r); return typeof x === "string" && x.trim() ? x.trim() : typeof x === "number" ? String(x) : null; };
  const listaDe = (r) => !r ? [] : Array.isArray(r.opcoes) ? r.opcoes.filter((x) => x !== NS) : r.estado === "opcao" && r.opcao !== NS ? [r.opcao] : [];
  const ehNS = (r) => !!r && (r.estado === "naosei" || (r.estado === "opcao" && /^Não sei/.test(r.opcao)));

  const ESTAGIOS = ["Ainda é uma ideia", "Já fiz testes ou amostras", "Já vendo"];
  const RECORRENTE = ["Algumas vezes por ano", "Todo mês", "Toda semana"];
  const APOIO_ALTO = ["De 6 a 10 h", "Mais de 10 h"];

  /* tela de partida: o que dá para trazer dos módulos anteriores */
  function herdar() {
    const m1 = lerR(1), m3 = lerR(3), m4 = lerR(4), m5 = lerR(5), m6 = lerR(6);
    const ini = { de: {} };
    const pega = (campo, v, mod) => { if (v != null && v !== "" && ini[campo] == null) { ini[campo] = v; ini.de[campo] = mod; } };
    pega("oferta", textoDe(m5["M5.P02"]) || textoDe(m5["M5.P10"]) || textoDe(m5["M5.P17"]), 5);
    pega("oferta", textoDe(m4["M4.P01"]), 4);
    pega("oferta", textoDe(m1["M1.P03"]), 1);
    pega("grupo", textoDe(m4["M4.P08"]), 4);
    pega("proposta", textoDe(m4["M4.P12"]), 4);
    pega("diferencial", textoDe(m3["M3.P21"]), 3);
    const canais = listaDe(m3["M3.P13"]);
    pega("canais", canais.length ? canais.join(", ") : null, 3);
    const preco = Mo.num(textoDe(m5["M5.P36"]));
    pega("preco", preco > 0 ? textoDe(m5["M5.P36"]) : null, 5);
    const est = { "Ainda está só na minha cabeça": ESTAGIOS[0], "Já fiz um pouco para testar ou dar de amostra": ESTAGIOS[1], "Já vendi algumas vezes": ESTAGIOS[2], "Já vendo sempre": ESTAGIOS[2] }[textoDe(m1["M1.P01"])];
    pega("estagio", est, 1);
    const ent = textoDe(m4["M4.P04"]); pega("entrega", ent && ent !== NS ? ent : null, 4);
    const pag = listaDe(m6["M6.P04"]); pega("pagamento", pag.length ? pag.join(", ") : null, 6);
    return ini;
  }

  /* contexto que não vira campo: lido na hora, para valer o que estiver salvo agora */
  function ctx() {
    const m2 = lerR(2), m3 = lerR(3), m4 = lerR(4), m5 = lerR(5), e7 = lerEstado(7) || {}, m7 = e7.R || {};
    const g33 = valor(m5["M5.P33"]);
    const gastos = Array.isArray(g33) ? g33.map((x) => (x && (x.nome || x.item || x.texto)) || (typeof x === "string" ? x : "")).join(" ") : "";
    const ouv = Mo.num(textoDe(m2["M2.P18"]));
    const onde = textoDe(m2["M2.P11"]);
    const freq = textoDe(m2["M2.P17"]);
    const conc = textoDe(m3["M3.P15"]);
    const n11 = m7["M7-11"];
    return {
      ouvidas: ouv !== null && !isNaN(ouv) && ouv >= 0 ? ouv : null,
      onde: onde && onde !== NS ? onde.toLowerCase() : null,
      frequencia: freq && freq !== NS ? freq : null,
      recorrente: RECORRENTE.includes(freq),
      concorrente: conc ? curto(conc.split(/[,;\n]| e /)[0], 40) : null,
      divulgacaoM5: /divulga|an[uú]nci|propaganda|impulsion|tr[aá]fego|panflet|marketing/i.test(gastos),
      testeN: textoDe(m4["M4.P19"]),
      variedade: textoDe(m4["M4.P05"]),
      apoio7: textoDe(m7["M7-03"]),
      numeros7: n11 && Array.isArray(n11.opcoes) ? n11.opcoes : n11 && Array.isArray(n11.sugeridos) ? n11.sugeridos : [],
      etapas7: Array.isArray(e7.mapa) ? e7.mapa.filter((x) => String(x || "").trim()) : [],
      cap7: capM7(e7),
    };
  }
  /* capacidade do Módulo 7 com as mesmas contas daquele módulo (cópia de motor.js do M7) */
  function capM7(e7) {
    const ini = e7.ini || {}, R = e7.R || {};
    const r2 = R["M7-02"], r3 = R["M7-03"], r4 = R["M7-04"], r5a = R["M7-05a"];
    const minUn = ini.minUn > 0 ? ini.minUn : r2 && r2.estado === "valor" ? r2.minUn : null;
    const apoio = r3 ? (r3.estado === "naosei" ? NS : r3.opcao) : null;
    const ajuda = r4 && r4.estado === "opcao" ? r4.horas || 0 : 0;
    const equip = r5a && r5a.estado === "valor" ? { un: M7c.num(r5a.un), minVez: r5a.minVez } : null;
    const c = M7c.capacidade({ horas: ini.horas, apoio, ajuda, minUn, equip });
    const vol = M7c.num(ini.volume);
    const cmp = M7c.comparar(c, vol > 0 ? vol : null);
    return { c, vol: vol > 0 ? vol : null, cmp, mes: c.estado === "ok" ? M7c.texto(c, "mes") : null };
  }

  /* número para "cabem cerca de [N]" (como no Módulo 7) */
  const nCap = (c) => !c || c.estado !== "ok" ? "" : c.modo === "max" ? Mo.fmt(c.hi.mes) : c.modo === "min" ? `${Mo.fmt(c.lo.mes)} ou mais` : c.lo.mes === c.hi.mes ? Mo.fmt(c.hi.mes) : `${Mo.fmt(c.lo.mes)} a ${Mo.fmt(c.hi.mes)}`;

  /* ---------- leitura do estado ---------- */
  const I = () => S.ini || {};
  const oferta = () => (I().oferta || "").trim();
  const opR = (cod) => { const r = S.R[cod]; return r && r.estado === "opcao" ? r.opcao : r && r.estado === "naosei" ? NS : null; };
  const temSocio = () => opR(SOCIO) === "Sim";
  const contrata = () => (opR("M10-08") || "").startsWith("Sim");
  const vende = () => I().estagio === ESTAGIOS[2];
  const SEM_ACORDO = ["Só combinamos de boca", "Ainda não"];

  /* ---------- opções: tiradas da coluna "Resposta / opção" ---------- */
  const META = new Set(["Mais de 3", "Outro (texto)", "Até 3 itens da lista", "Sem número", "Data acima de 90 dias", "Data inválida (passada)", "Ação, data, sinal e número preenchidos"]);
  function partes(e) {
    const dentro = /\(([^)]+)\)\s*$/.exec(e);
    if (dentro && /^(Uma ou mais|Responsável escolhido)/.test(e)) return dentro[1].split(", ").map(cap1);
    if (/^Para cada prioridade:/.test(e)) return e.replace(/^Para cada prioridade:\s*/, "").split(" / ").map(cap1);
    return e.split(" / ").map((x) => (/^para /.test(x) ? "Sim, " + x : x.trim()));
  }
  const opcoesDe = (cod) => Q[cod].caminhos.filter((c) => !META.has(c.opcao) && !c.opcao.startsWith("'")).flatMap((c) => partes(c.opcao));
  const caminho = (cod, op) => Q[cod].caminhos.find((c) => c.opcao === op || partes(c.opcao).includes(op));

  /* ---------- colchetes preenchidos pelo sistema ---------- */
  function preencher(t, extra) {
    const C = ctx();
    let s = String(t || "");
    const cond = {
      "Se tempo de apoio alto no M7": APOIO_ALTO.includes(C.apoio7),
      "Se compra recorrente no Módulo 2": C.recorrente,
      "Se capacidade curta no Módulo 7": !!(C.cap7.cmp && C.cap7.cmp.tipo === "falta"),
      "Se houver ofertas guardadas": false, // o Módulo 1 publicado não guarda outras ofertas
    };
    s = s.replace(/\s*\[(Se [^\]]+)\]:\s*([\s\S]*)$/, (_, k, x) => (cond[k] ? " " + x : ""));
    if (C.ouvidas == null) s = s.replace(/Você já ouviu \[pessoas ouvidas\] pessoas no Módulo 2\.\s*/, "");
    if (!C.onde) s = s.replace(/: o Módulo 2 mostrou onde ele procura \(\[onde procuram\]\)/, "");
    if (!I().diferencial) s = s.replace(/\s*A mensagem pode partir do seu diferencial: \[diferencial do Módulo 3\]\./, "");
    const mapa = {
      "[canais de venda do Módulo 3]": I().canais ? lc(I().canais) : "onde você vende",
      "[canais de venda]": I().canais ? lc(I().canais) : "onde você vende",
      "[onde procuram]": C.onde || "",
      "[pessoas ouvidas]": C.ouvidas != null ? Mo.fmt(C.ouvidas) : "",
      "[oferta em foco]": oferta() || "o que você vende",
      "[diferencial do Módulo 3]": I().diferencial || "",
      "[diferencial]": I().diferencial || "[o que o cliente ganha com você]",
      "[grupo em foco]": I().grupo || "[para quem]",
      "[frequência]": C.frequencia ? C.frequencia.toLowerCase() : "",
      "[N]": nCap(C.cap7.c),
      "[volume]": C.cap7.vol ? Mo.fmt(C.cap7.vol) + " por mês" : "",
      "[concorrente]": C.concorrente || "um concorrente",
      "[etapas]": roteiro().join(" · "),
    };
    Object.assign(mapa, extra || {});
    for (const k of Object.keys(mapa)) s = s.split(k).join(mapa[k]);
    return s.replace(/\s+([.,?])/g, "$1").replace(/\s{2,}/g, " ").trim();
  }

  /* ---------- roteiro de venda pré-montado (M10-03, instrumento "Roteiro de venda") ---------- */
  function roteiroModelo() {
    const r = ["Contato", "Entender a necessidade"];
    r.push(I().proposta ? `Apresentar a oferta: ${curto(I().proposta, 120)}` : "Apresentar a oferta");
    r.push(I().preco ? `Preço: R$ ${I().preco}` : "Preço");
    r.push(I().entrega ? `Combinar a entrega: ${lc(I().entrega)}` : "Combinar a entrega");
    r.push("Confirmar o pedido por escrito");
    r.push(I().pagamento ? `Receber: ${lc(I().pagamento)}` : "Receber");
    return r;
  }
  const roteiro = () => (S.roteiro && S.roteiro.length ? S.roteiro : roteiroModelo());
  const roteiroFinal = () => {
    const r = roteiro().slice();
    const pv = opR("M10-04");
    if (pv && !r.some((x) => /depois da entrega/i.test(x))) {
      if (pv === "Sim, peço opinião") r.push("Depois da entrega: pedir a opinião do cliente");
      else if (pv === "Sim, ofereço de novo") r.push("Depois da entrega: oferecer de novo");
      else if (pv === "Ainda não vendi" || pv === NS) r.push("Depois da entrega: mandar uma mensagem");
    }
    return r;
  };

  /* ---------- perguntas: quais aparecem ---------- */
  function sequencia() {
    const seq = ["M10-01", "M10-02", "M10-03", "M10-04", "M10-05", SOCIO];
    if (temSocio()) seq.push("M10-06");
    if (ctx().etapas7.length) seq.push("M10-07");
    seq.push("M10-08");
    if (contrata()) seq.push("M10-08a");
    seq.push("M10-09");
    if (escolhidas().length) seq.push("M10-10", "M10-11");
    return seq;
  }
  const FASE = (cod) => (cod === SOCIO ? "Pessoas" : Q[cod].fase);
  const TXT = (cod) => (cod === SOCIO ? D.socio.pergunta : preencher(Q[cod].pergunta));

  /* ---------- lista de prioridades (M10-09): lacunas e alertas dos Módulos 1 a 10 ---------- */
  function itensPercurso() {
    const it = [];
    const add = (tema, gravidade, modulo, bloqueia) => it.push({ tema, gravidade, modulo, bloqueia: !!bloqueia });
    const m1 = lerR(1), m2 = lerR(2), m4 = lerR(4), m5 = lerR(5), m6 = lerR(6), m7 = lerR(7), m8 = lerR(8), m9 = lerR(9);
    const C = ctx();
    /* gravidade alta */
    if (textoDe(m1["M1.P04"]) === "Ainda não sei fazer") add("Aprender a fazer o que você vai vender", "alta", 1);
    if (C.ouvidas === 0) add("Conversar com possíveis clientes", "alta", 2);
    if (ehNS(m5["M5.P36"])) add("Definir o preço de venda", "alta", 5);
    if (C.cap7.cmp && C.cap7.cmp.tipo === "falta") add("O que você quer vender não cabe no seu tempo", "alta", 7);
    if (textoDe(m9["M9.P10"]) === "Sim, foi negada") add("Rever o endereço: a atividade foi negada nesse local", "alta", 9);
    if (textoDe(m9["M9.P10"]) === "Ainda não fiz" || ehNS(m9["M9.P10"])) add("Fazer a consulta de viabilidade na prefeitura", textoDe(m9["M9.P09"]) === "Sim" ? "alta" : "media", 9, true);
    if (SEM_ACORDO.includes(opR("M10-06"))) add("Acordo entre sócios", "alta", 10);
    /* gravidade média */
    if (textoDe(m2["M2.P21"]) === "Só elogios") add("Confirmar com clientes se o problema é real", "media", 2);
    if (ehNS(m4["M4.P19"])) add("Definir o número que confirma o teste da ideia", "media", 4);
    if (ehNS(m6["M6.P07"])) add("Saber quanto dinheiro você tem para começar", "media", 6);
    const r76 = m7["M7-06"];
    if (r76 && (r76.p1 === "Só um" || r76.p1 === "Ainda não procurei")) add("Procurar mais fornecedores", "media", 7);
    if (textoDe(m7["M7-09"]) === "Ainda não confiro") add("Conferir a qualidade antes de entregar", "media", 7);
    if (m7["M7-02"] && m7["M7-02"].estado === "naosei") add("Medir o tempo de produção", "media", 7);
    if (textoDe(m8["M8.P05"]) === "Não") {
      const d = textoDe(m8["M8.P10"]);
      add(d && d !== NS ? `Tirar a dúvida sobre formalização: ${d.toLowerCase()}` : "Entender o que falta para formalizar o negócio", "media", 8);
    }
    if (opR("M10-02") === "Mais de 2 dias") add("Tempo de resposta aos clientes", "media", 10);
    if (opR("M10-05") === "Ainda não sei") add("Definir a divulgação", "media", 10);
    const r7 = S.R["M10-07"];
    if (r7 && r7.quem) Object.entries(r7.quem).forEach(([e, q]) => { if (q === "Ninguém ainda") add(`Definir quem cuida de: ${e}`, "media", 10); });
    /* gravidade baixa: respostas "Não sei" que ficaram em cada módulo */
    for (let n = 1; n <= 9; n++) {
      const k = Object.values(lerR(n)).filter((r) => r && r.estado === "naosei").length;
      if (k) add(`Completar ${k === 1 ? "a resposta" : `as ${k} respostas`} “Não sei” do Módulo ${n}`, "baixa", n);
    }
    return it;
  }
  const listaPrioridades = () => Mo.prioridades(itensPercurso());
  function escolhidas() {
    const r = S.R["M10-09"];
    if (!r) return [];
    return (r.opcoes || []).concat(r.outro ? [r.outro] : []).slice(0, Mo.LIMITE_PRIORIDADES);
  }
  const ordemLista = () => listaPrioridades().map((x) => x.tema);
  function priosOrdenadas() {
    const r = S.R["M10-10"];
    return r && r.u ? Mo.ordenarPorUrgencia(escolhidas(), r.u, ordemLista()) : escolhidas();
  }

  /* ---------- peças do layout (modelo dos Módulos 6 e 7) ---------- */
  function rodape() {
    return `<footer class="rodape">
      <p class="credito">Conteúdo do ${esc(D.origem)}</p>
      <div class="logos"><img src="assets/logo_facc.png" alt="FACC"><img src="assets/logo_ufjf.svg" alt="UFJF"><img src="assets/logo_mg.svg" alt="Governo de Minas Gerais"></div>
    </footer>`;
  }
  function topo(trilha) {
    return `<div class="barra-topo">
      <img class="logo-mini" src="assets/minds.svg" alt="Minds of the Future">
      <nav class="trilha" aria-label="Você está em"><button class="trilha-link" data-inicio>Início</button><span>/</span><span>Módulo 10</span>${trilha ? `<span>/</span><span>${esc(trilha)}</span>` : ""}</nav>
    </div>`;
  }
  function heroi(o) {
    return `<section class="heroi ${o.grande ? "heroi-grande" : ""}">
      <div class="heroi-topo">
        <div class="heroi-txt">
          <div class="kicker ${o.kickerClasse || ""}">${esc(o.kicker || "Módulo 10")}</div>
          <${o.h1 ? "h1" : "h2"} class="heroi-tit">${esc(o.titulo)}</${o.h1 ? "h1" : "h2"}>
          ${o.texto ? `<p>${esc(o.texto)}</p>` : ""}
        </div>
        <img class="heroi-img" src="assets/${o.grande ? "hero-inicio.webp" : "hero-tela.webp"}" alt="">
      </div>
      ${o.extra || ""}
      ${o.reinicio ? `<button class="reinicio" id="zerar">Recomeçar do zero</button>` : ""}
    </section>`;
  }
  function barraFases(atual, tudo) {
    const fs = D.fases, n = fs.indexOf(atual);
    return `<ol class="etapas" aria-label="Fases do módulo">${fs.map((f, i) => {
      const st = tudo || i < n ? "feita" : i === n ? "atual" : "";
      return `<li class="${st}"${i === n && !tudo ? ' aria-current="step"' : ""}><span class="bola" aria-hidden="true"></span><span class="rot">${esc(f)}</span></li>`;
    }).join("")}</ol>`;
  }
  const chipOferta = () => `<div class="chip-oferta"><span>${esc(oferta() || "Seu negócio")}</span><button class="chip-alterar" id="alterar">Alterar</button></div>`;
  const botaoVoltar = () => `<div class="acoes acoes-voltar"><button class="btn btn-linha voltar" id="v">Voltar</button></div>`;
  function ligar(p) {
    p.querySelectorAll("[data-inicio]").forEach((b) => { b.onclick = () => ir(telaCapa); });
    const a = p.querySelector("#alterar"); if (a) a.onclick = () => ir(telaPartida, { volta: true });
    const z = p.querySelector("#zerar"); if (z) z.onclick = reiniciar;
    p.querySelectorAll(".btn-copiar").forEach((b) => (b.onclick = () => { try { navigator.clipboard.writeText(b.dataset.t); } catch (e) {} b.textContent = "Copiado"; }));
  }
  function reiniciar() {
    if (!confirm("Apagar todas as respostas deste módulo e recomeçar? Se quiser guardar, imprima o resultado antes.")) return;
    try { localStorage.removeItem(CHAVE); } catch (e) {}
    S = novo();
    ir(telaCapa);
  }
  function caixa(c, extra) {
    if (!c || !c.texto) return "";
    const t = preencher(c.texto, extra);
    if (!t) return "";
    const tit = c.retorno === "Dica" || c.retorno === "Atenção" ? c.retorno : "";
    const cls = c.retorno === "Atenção" ? "b-alerta" : c.retorno === "Dica" ? "b-proximo" : "b-ok";
    return `<div class="bloco ${cls}">${tit ? `<b>${tit}</b>` : ""}<p>${esc(t)}</p></div>`;
  }
  /* conceitos da Base técnica (documento v2) ligados a cada pergunta: escolha do app */
  const CONCEITO = { "M10-01": ["M10-C02"], "M10-02": ["M10-C03"], "M10-03": ["M10-C04"], "M10-04": ["M10-C05"], "M10-05": ["M10-C01"], [SOCIO]: ["M10-C07"], "M10-06": ["M10-C07"], "M10-07": ["M10-C08"], "M10-08": ["M10-C09"], "M10-08a": ["M10-C06"], "M10-09": ["M10-C10"] };
  function termos(cods) {
    const ts = D.base.filter((b) => cods.includes(b.codigo));
    if (!ts.length) return "";
    return `<details class="saiba"><summary><span>Entenda os termos</span></summary>${ts.map((t) => `<div class="conceito"><b>${esc(t.conceito)}</b><p>${esc(t.definicao)}</p><p class="ex">${esc(t.porque)}</p></div>`).join("")}</details>`;
  }

  /* ================= capa ================= */
  function telaCapa() {
    const K = D.capa;
    const comecou = !!S.ini;
    const inst = D.instrumentos.filter((x) => x.nome !== "Checklist de acordo entre sócios");
    const p = el(`<div class="pag">
      ${topo("")}
      ${heroi({ grande: true, h1: true, kicker: "Módulo 10", titulo: D.modulo.nome, texto: K.objetivo })}
      <main class="corpo">
        <div class="cartao"><h3>Para quem é</h3><p>${esc(K.para_quem)}</p></div>
        <div class="cartao"><h3>No final, você vai ter</h3><ul class="lista-capa">${inst.map((x) => `<li><b>${esc(x.nome)}.</b> ${esc(x.mostra)}</li>`).join("")}</ul></div>
        <div class="cartao"><h3>O que ter em mãos</h3><p>${esc(K.ter_em_maos)}</p></div>
        <p class="aviso">Não inclua nomes, telefones, documentos ou outros dados pessoais nas respostas.</p>
        <div class="acoes">
          <button class="btn btn-primario seta" id="ir">${comecou ? "Continuar de onde parei" : "Começar"}</button>
          ${comecou ? `<button class="btn btn-linha" id="zerar">Recomeçar do zero</button>` : ""}
        </div>
        ${rodape()}
      </main>
    </div>`);
    p.querySelector("#ir").onclick = () => {
      S.voltarResumo = false;
      if (!S.ini) return ir(telaPartida);
      const falta = sequencia().find((c) => !S.R[c]);
      if (falta) return ir(telaPergunta, falta);
      ir(telaResultado);
    };
    ligar(p);
    return p;
  }

  /* ================= ponto de partida (o que veio dos Módulos 1 a 6) ================= */
  function telaPartida(o) {
    const volta = o && o.volta;
    const base = S.ini ? Object.assign({ de: {} }, S.ini) : herdar();
    const f = Object.assign({}, base);
    const veio = (campo) => base.de && base.de[campo] ? `<span class="veio">Veio do Módulo ${base.de[campo]}</span>` : "";
    const txt = (campo, rot, attrs) => `<label class="rot-campo" for="f-${campo}">${esc(rot)} ${veio(campo)}</label><input class="campo" id="f-${campo}" data-campo="${campo}" value="${esc(f[campo] ?? "")}" ${attrs || ""}>`;
    const area = (campo, rot) => `<label class="rot-campo" for="f-${campo}">${esc(rot)} ${veio(campo)}</label><textarea class="campo" rows="2" id="f-${campo}" data-campo="${campo}">${esc(f[campo] ?? "")}</textarea>`;
    const sel = (campo, ops, rot) => `<fieldset class="grupo" data-sel="${campo}"><legend>${esc(rot)} ${veio(campo)}</legend>
      <div class="opcoes mini">${ops.map((x) => `<button type="button" class="opcao ${f[campo] === x ? "sel" : ""}" data-v="${esc(x)}"><span class="radio" aria-hidden="true"></span><span class="op-txt"><b>${esc(x)}</b></span></button>`).join("")}</div></fieldset>`;
    const p = el(`<div class="pag">
      ${topo("Antes de começar")}
      ${heroi({ kicker: "Antes de começar", titulo: "Seu ponto de partida", texto: "Trouxemos o que você já respondeu nos módulos anteriores. Confira, corrija ou complete. Nada aqui é obrigatório." })}
      <main class="corpo">
        <div class="cartao-q partida">
          <h3 class="secao-titulo">Sua oferta</h3>
          ${txt("oferta", "O que você vende (a oferta em foco)")}
          ${txt("grupo", "Para quem")}
          ${area("proposta", "Sua proposta de valor")}
          ${area("diferencial", "O que o cliente ganha comprando com você")}
          ${sel("estagio", ESTAGIOS, "Em que momento você está?")}
          <h3 class="secao-titulo">Como você vende hoje</h3>
          ${txt("canais", "Onde o cliente encontra você e compra")}
          ${txt("preco", "Preço de venda (R$)", 'inputmode="decimal"')}
          ${txt("entrega", "Como chega ao cliente")}
          ${txt("pagamento", "Formas de pagamento")}
          <div class="erro" id="erro" hidden></div>
          <div class="acoes"><button class="btn btn-primario seta" id="ok">Continuar</button></div>
          ${botaoVoltar()}
        </div>
        ${rodape()}
      </main>
    </div>`);
    p.querySelectorAll("fieldset[data-sel]").forEach((fs) => fs.querySelectorAll(".opcao").forEach((b) => {
      b.onclick = () => { const k = fs.dataset.sel; f[k] = f[k] === b.dataset.v ? null : b.dataset.v; fs.querySelectorAll(".opcao").forEach((x) => x.classList.toggle("sel", f[k] === x.dataset.v)); };
    }));
    p.querySelector("#v").onclick = () => { const u = S.hist[S.hist.length - 1]; if (S.voltarResumo || u === "RESULTADO") { S.voltarResumo = false; return ir(telaResultado); } volta && S.ini && u ? ir(telaPergunta, u) : ir(telaCapa); };
    p.querySelector("#ok").onclick = () => {
      p.querySelectorAll("[data-campo]").forEach((i) => { f[i.dataset.campo] = i.value.trim(); });
      const e = p.querySelector("#erro");
      const n = f.preco ? Mo.num(f.preco) : null;
      if (n !== null && (isNaN(n) || n < 0)) { e.textContent = "Confira o preço: use só números iguais ou maiores que zero, ou deixe em branco."; e.hidden = false; return; }
      f.de = Object.fromEntries(Object.entries(base.de || {}).filter(([k]) => String(f[k] ?? "") === String(base[k] ?? "")));
      S.ini = f;
      limparInvisiveis();
      salvar();
      if (S.voltarResumo) { S.voltarResumo = false; return ir(telaResultado); }
      const falta = sequencia().find((c) => !S.R[c]);
      ir(falta ? telaPergunta : telaResultado, falta);
    };
    ligar(p);
    return p;
  }
  function limparInvisiveis() {
    const vis = new Set(sequencia());
    Object.keys(S.R).forEach((k) => { if (k !== "M10-12" && !vis.has(k)) delete S.R[k]; });
  }

  /* ================= pergunta ================= */
  function telaPergunta(cod) {
    const q = cod === SOCIO ? { apoio: "" } : Q[cod];
    const seq = sequencia();
    const n = Math.max(1, seq.indexOf(cod) + 1);
    if (S.hist[S.hist.length - 1] !== cod) { S.hist.push(cod); salvar(); }
    const resp = S.R[cod];
    const p = el(`<div class="pag">
      ${topo(FASE(cod))}
      ${heroi({ titulo: FASE(cod), reinicio: true, kicker: `Pergunta ${n} de ${seq.length}`, kickerClasse: "passo", extra: chipOferta() })}
      <main class="corpo">
        ${barraFases(FASE(cod))}
        <div class="cartao-q pergunta">
          <h2 class="q" id="pergunta">${esc(TXT(cod))}</h2>
          ${q.apoio ? `<p class="ajuda">${esc(preencher(q.apoio))}</p>` : ""}
          <div class="entrada" id="ent"></div>
          <div class="erro" id="erro" hidden></div>
          <div id="retorno" aria-live="polite"></div>
          ${termos(CONCEITO[cod] || [])}
          <div class="acoes" id="acoes"><button class="btn btn-primario seta" id="ok">Continuar</button></div>
          ${botaoVoltar()}
        </div>
        ${rodape()}
      </main>
    </div>`);
    const ent = p.querySelector("#ent"), box = p.querySelector("#retorno"), err = p.querySelector("#erro");
    const mostrar = (html) => { box.innerHTML = html || ""; err.hidden = true; };
    const erro = (t) => { err.textContent = t; err.hidden = false; };
    p.querySelector("#v").onclick = () => {
      S.hist.pop();
      const ant = S.hist.pop();
      salvar();
      if (ant && ant !== "RESULTADO") ir(telaPergunta, ant); else ir(telaPartida, { volta: true });
    };
    ligar(p);
    let coletar = null;

    function unica(ops, atual, aoTocar) {
      const wrap = el(`<div class="opcoes"></div>`);
      ops.forEach((op) => {
        const b = el(`<button class="opcao ${atual === op ? "sel" : ""}"><span class="radio" aria-hidden="true"></span><span class="op-txt"><b>${esc(op)}</b></span></button>`);
        b.onclick = () => { wrap.querySelectorAll(".opcao").forEach((x) => x.classList.toggle("sel", x === b)); aoTocar(op); };
        wrap.appendChild(b);
      });
      return wrap;
    }
    /* múltipla escolha; "exclusivas" desmarcam as outras */
    function multipla(ops, marcadas, exclusivas, aoMudar) {
      const wrap = el(`<div class="opcoes multi"></div>`);
      const pintar = () => wrap.querySelectorAll(".opcao").forEach((x) => x.classList.toggle("sel", marcadas.includes(x.dataset.v)));
      ops.forEach((op) => {
        const b = el(`<button class="opcao" data-v="${esc(op)}"><span class="radio" aria-hidden="true"></span><span class="op-txt"><b>${esc(op)}</b></span></button>`);
        b.onclick = () => {
          if (marcadas.includes(op)) marcadas.splice(marcadas.indexOf(op), 1);
          else if (exclusivas.includes(op)) marcadas.splice(0, marcadas.length, op);
          else { exclusivas.forEach((x) => { if (marcadas.includes(x)) marcadas.splice(marcadas.indexOf(x), 1); }); marcadas.push(op); }
          pintar();
          aoMudar(op);
        };
        wrap.appendChild(b);
      });
      wrap.pintar = pintar;
      pintar();
      return wrap;
    }
    const btnNaoSei = (fn) => { const b = el(`<div class="alt"><button class="btn-alt" id="ns">${NS}</button></div>`); b.querySelector("button").onclick = fn; return b; };
    function avancar(r0) {
      S.R[cod] = r0;
      limparInvisiveis();
      salvar();
      const seq2 = sequencia();
      if (S.voltarResumo && seq2.every((c) => S.R[c])) { S.voltarResumo = false; return ir(telaResultado); }
      const prox = seq2[seq2.indexOf(cod) + 1];
      prox ? ir(telaPergunta, prox) : ir(telaResultado);
    }
    function trocarParaSeguir(r0) {
      const acoes = p.querySelector("#acoes");
      acoes.innerHTML = "";
      const b = el(`<button class="btn btn-primario seta" id="ok">Continuar</button>`);
      b.onclick = () => avancar(r0);
      acoes.appendChild(b);
    }

    if (cod === "M10-01") {
      const ops = opcoesDe(cod);
      const EXC = ["Ainda não falo com clientes", NS];
      const marcadas = resp && resp.estado === "multi" ? resp.opcoes.slice() : resp && resp.estado === "naosei" ? [NS] : resp && resp.opcao ? [resp.opcao] : [];
      const ret = () => mostrar(!marcadas.length ? "" : EXC.includes(marcadas[0]) ? caixa(caminho(cod, marcadas[0])) : caixa(Q[cod].caminhos[0]));
      ent.appendChild(multipla(ops, marcadas, EXC, ret));
      ret();
      coletar = () => {
        if (!marcadas.length) { erro("Marque pelo menos uma opção, ou toque em “Não sei”."); return null; }
        if (marcadas[0] === NS) return { estado: "naosei" };
        if (marcadas[0] === EXC[0]) return { estado: "opcao", opcao: EXC[0] };
        return { estado: "multi", opcoes: ops.filter((o) => marcadas.includes(o)) };
      };
    } else if (cod === "M10-03") {
      let op = resp ? (resp.estado === "naosei" ? NS : resp.opcao) : null;
      const lista = roteiro().slice();
      const wrap = el(`<div class="mapa-edit"></div>`);
      const desenhar = () => {
        wrap.innerHTML = `<p class="rot-campo">Seu roteiro de venda (confira e ajuste)</p>`;
        lista.forEach((nome, i) => {
          const l = el(`<div class="etapa-ed"><span class="num">${i + 1}</span><input class="campo" aria-label="Passo ${i + 1}" value="${esc(nome)}">
            <button class="mini-b" data-a="sobe" aria-label="Subir passo ${i + 1}" ${i === 0 ? "disabled" : ""}>↑</button><button class="mini-b" data-a="desce" aria-label="Descer passo ${i + 1}" ${i === lista.length - 1 ? "disabled" : ""}>↓</button><button class="mini-b x" data-a="tira" aria-label="Retirar passo ${i + 1}">×</button></div>`);
          l.querySelector("input").oninput = (e) => { lista[i] = e.target.value; };
          l.querySelectorAll("[data-a]").forEach((b) => (b.onclick = () => {
            const a = b.dataset.a;
            if (a === "tira") lista.splice(i, 1);
            if (a === "sobe") [lista[i - 1], lista[i]] = [lista[i], lista[i - 1]];
            if (a === "desce") [lista[i + 1], lista[i]] = [lista[i], lista[i + 1]];
            desenhar();
          }));
          wrap.appendChild(l);
        });
        const add = el(`<button class="btn-mais" id="mais">+ Incluir passo</button>`);
        add.onclick = () => { lista.push(""); desenhar(); const ins = wrap.querySelectorAll("input"); ins[ins.length - 1].focus(); };
        wrap.appendChild(add);
      };
      ent.appendChild(unica(opcoesDe(cod), op, (o) => { op = o; mostrar(caixa(caminho(cod, o))); }));
      desenhar();
      ent.appendChild(wrap);
      if (op) mostrar(caixa(caminho(cod, op)));
      coletar = () => {
        if (!op) { erro("Escolha uma opção para continuar."); return null; }
        const limpa = lista.map((x) => x.trim()).filter(Boolean);
        S.roteiro = limpa.length ? limpa : null;
        return op === NS ? { estado: "naosei" } : { estado: "opcao", opcao: op };
      };
    } else if (cod === "M10-07") {
      const ops = opcoesDe(cod);
      const etapas = ctx().etapas7;
      const quem = Object.assign({}, resp && resp.quem);
      const ret = () => {
        if (!etapas.every((e) => quem[e])) return mostrar("");
        mostrar(etapas.some((e) => quem[e] === "Ninguém ainda") ? caixa(Q[cod].caminhos[1]) : caixa(Q[cod].caminhos[0]));
      };
      etapas.forEach((e) => {
        ent.appendChild(el(`<p class="rot-campo">${esc(e)}</p>`));
        ent.appendChild(unica(ops, quem[e], (o) => { quem[e] = o; ret(); }));
      });
      ret();
      coletar = () => {
        if (!etapas.every((e) => quem[e])) { erro("Escolha quem cuida de cada etapa."); return null; }
        return { estado: "etapas", quem };
      };
    } else if (cod === "M10-08a") {
      const ops = opcoesDe(cod);
      const marcadas = resp && resp.estado === "multi" ? resp.opcoes.slice() : [];
      const C = ctx();
      const ret = () => {
        const extra = [];
        if (marcadas.includes("Menos variedade de opções") && C.variedade) extra.push(`<div class="bloco b-proximo"><b>Do Módulo 4</b><p>${esc(curto(C.variedade, 160))}</p></div>`);
        if (marcadas.includes("Rever o tempo de apoio") && C.apoio7) extra.push(`<div class="bloco b-proximo"><b>Do Módulo 7</b><p>Tempo de apoio por semana: ${esc(C.apoio7)}.</p></div>`);
        mostrar(marcadas.length ? caixa(Q[cod].caminhos[0]) + extra.join("") : "");
      };
      ent.appendChild(multipla(ops, marcadas, ["Ainda nenhuma"], ret));
      ret();
      coletar = () => {
        if (!marcadas.length) { erro("Marque pelo menos uma opção."); return null; }
        return { estado: "multi", opcoes: ops.filter((o) => marcadas.includes(o)) };
      };
    } else if (cod === "M10-09") {
      const lista = listaPrioridades();
      const ops = lista.map((x) => x.tema);
      const marcadas = resp ? (resp.opcoes || []).filter((x) => ops.includes(x)) : [];
      let naosei = !!(resp && resp.naosei);
      const outro = el(`<div><label class="rot-campo" for="outro">Outro (escreva)</label><input class="campo" id="outro" value="${esc((resp && resp.outro) || "")}"></div>`);
      const total = () => marcadas.length + (outro.querySelector("input").value.trim() ? 1 : 0);
      if (!ops.length) ent.appendChild(el(`<p class="diag-r">Nenhum ponto em aberto apareceu nos módulos deste aparelho. Escreva o que é mais urgente para você.</p>`));
      const m = multipla(ops, marcadas, [], (op) => {
        naosei = false;
        if (marcadas.includes(op) && total() > Mo.LIMITE_PRIORIDADES) {
          marcadas.splice(marcadas.indexOf(op), 1);
          m.pintar();
          return mostrar(caixa(caminho(cod, "Mais de 3")));
        }
        mostrar(marcadas.length ? caixa(caminho(cod, "Até 3 itens da lista")) : "");
      });
      ent.appendChild(m);
      ent.appendChild(outro);
      outro.querySelector("input").oninput = () => { if (total() > Mo.LIMITE_PRIORIDADES) mostrar(caixa(caminho(cod, "Mais de 3"))); };
      if (ops.length) ent.appendChild(btnNaoSei(() => {
        naosei = true;
        marcadas.splice(0, marcadas.length, ...Mo.tresPrimeiras(lista));
        m.pintar();
        mostrar(caixa(caminho(cod, NS)));
      }));
      if (marcadas.length) mostrar(naosei ? caixa(caminho(cod, NS)) : caixa(caminho(cod, "Até 3 itens da lista")));
      let mostrouOutro = false;
      coletar = () => {
        const o = outro.querySelector("input").value.trim();
        if (total() > Mo.LIMITE_PRIORIDADES) { mostrar(caixa(caminho(cod, "Mais de 3"))); return null; }
        if (!marcadas.length && !o) { erro(ops.length ? "Escolha até 3 pontos, escreva outro ou toque em “Não sei”." : "Escreva o que é mais urgente para você."); return null; }
        const r0 = { estado: "multi", opcoes: ops.filter((x) => marcadas.includes(x)), outro: o, naosei };
        if (o && !mostrouOutro) { mostrouOutro = true; mostrar(caixa(caminho(cod, "Outro (texto)"))); trocarParaSeguir(r0); return null; }
        return r0;
      };
    } else if (cod === "M10-10") {
      const ops = partes(Q[cod].caminhos[0].opcao);
      const u = Object.assign({}, resp && resp.u);
      const prios = escolhidas();
      const ret = () => {
        if (!prios.every((t) => u[t])) return mostrar("");
        mostrar(caixa(Q[cod].caminhos[0], { "[prioridade]": Mo.ordenarPorUrgencia(prios, u, ordemLista())[0] }));
      };
      prios.forEach((t) => {
        ent.appendChild(el(`<p class="rot-campo">${esc(t)}</p>`));
        ent.appendChild(unica(ops, u[t] ? cap1(u[t]) : null, (o) => { u[t] = o.toLowerCase(); ret(); }));
      });
      ret();
      coletar = () => {
        if (!prios.every((t) => u[t])) { erro("Responda para cada prioridade."); return null; }
        return { estado: "escala", u };
      };
    } else if (cod === "M10-11") {
      const v = resp && resp.estado === "plano" ? resp : {};
      const prin = priosOrdenadas()[0];
      const hoje = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
      ent.appendChild(el(`<div>
        ${prin ? `<div class="bloco b-ok"><b>Prioridade mais urgente</b><p>${esc(prin)}</p></div>` : ""}
        <label class="rot-campo" for="acao">O que você vai fazer</label><input class="campo" id="acao" value="${esc(v.acao || "")}">
        <label class="rot-campo" for="data">Até quando</label><input class="campo" id="data" type="date" min="${hoje}" value="${esc(v.data || "")}">
        <label class="rot-campo" for="sinal">Que sinal vai mostrar que funcionou</label><input class="campo" id="sinal" value="${esc(v.sinal || "")}">
        <label class="rot-campo" for="numero">Quanto basta (número)</label><input class="campo" id="numero" inputmode="decimal" value="${esc(v.numero || "")}">
      </div>`));
      ent.appendChild(btnNaoSei(() => {
        mostrar(caixa(caminho(cod, NS)) + (prin ? `<p class="diag-r">${esc(exemploPara(prin))}</p>` : ""));
        trocarParaSeguir({ estado: "naosei" });
      }));
      let avisouNum = false, avisouLonge = false;
      const C = ctx();
      coletar = () => {
        const g = (id) => p.querySelector("#" + id).value.trim();
        const r0 = { estado: "plano", acao: g("acao"), data: g("data"), sinal: g("sinal"), numero: g("numero") };
        if (!r0.acao || !r0.data) { erro("Escreva o que você vai fazer e até quando, ou toque em “Não sei”."); return null; }
        const d = Mo.avaliarData(r0.data, hoje);
        if (d === "invalida" || d === "passada") { mostrar(caixa(caminho(cod, "Data inválida (passada)"))); return null; }
        const nn = Mo.num(r0.numero);
        if (r0.numero && (isNaN(nn) || nn <= 0)) { erro("Quanto basta: use um número maior que zero, ou deixe em branco."); return null; }
        if (!(nn > 0) && !avisouNum) {
          avisouNum = true;
          const sug = [C.testeN && C.testeN !== NS ? `No teste da ideia (Módulo 4), você combinou: ${C.testeN}.` : "", C.numeros7.length ? `Números que você quer acompanhar (Módulo 7): ${C.numeros7.join(", ").toLowerCase()}.` : ""].filter(Boolean);
          mostrar(caixa(caminho(cod, "Sem número")) + sug.map((x) => `<p class="diag-r">${esc(x)}</p>`).join(""));
          return null;
        }
        if (d === "longe" && !avisouLonge) { avisouLonge = true; mostrar(caixa(caminho(cod, "Data acima de 90 dias"))); return null; }
        r0.frase = Mo.frasePlano(r0);
        mostrar(caixa(caminho(cod, "Ação, data, sinal e número preenchidos"), { "[frase]": r0.frase.replace(/\.$/, "") }));
        trocarParaSeguir(r0);
        return null;
      };
    } else if (cod === SOCIO) {
      let op = resp ? (resp.estado === "naosei" ? NS : resp.opcao) : null;
      ent.appendChild(unica(D.socio.opcoes, op, (o) => { op = o; }));
      coletar = () => {
        if (!op) { erro("Escolha uma opção para continuar."); return null; }
        return op === NS ? { estado: "naosei" } : { estado: "opcao", opcao: op };
      };
    } else {
      /* escolha única com retorno ao tocar: M10-02, 04, 05, 06, 08 */
      let op = resp ? (resp.estado === "naosei" ? NS : resp.opcao) : null;
      const C = ctx();
      const cruz = (o) => (cod === "M10-08" && o && o.startsWith("Sim") && C.cap7.cmp && C.cap7.cmp.tipo === "folga" ? cruzamento("Contratar e capacidade com folga (M7)", { "[folga]": Mo.fmt(C.cap7.cmp.n) }) : "");
      ent.appendChild(unica(opcoesDe(cod), op, (o) => { op = o; mostrar(caixa(caminho(cod, o)) + cruz(o)); }));
      if (op) mostrar(caixa(caminho(cod, op)) + cruz(op));
      coletar = () => {
        if (!op) { erro("Escolha uma opção para continuar."); return null; }
        return op === NS ? { estado: "naosei" } : { estado: "opcao", opcao: op };
      };
    }
    p.querySelector("#ok").onclick = () => { const r0 = coletar(); if (r0) avancar(r0); };
    return p;
  }
  /* exemplo ligado à prioridade (M10-11 "Não sei"): os exemplos são os da própria pergunta */
  function exemploPara(t) {
    const ex = Q["M10-11"].apoio.match(/'[^']+'/g) || [];
    return `Exemplo: ${/viabilidade|prefeitura|endereço/i.test(t) ? ex[0] || "" : ex[1] || ex[0] || ""}`;
  }
  function cruzamento(quando, extra) {
    const x = D.resumo.cruzamentos.find((c) => c.quando === quando);
    return x ? `<div class="bloco ${x.forma === "Pergunta gentil" ? "b-alerta" : "b-proximo"}"><b>${esc(x.forma)}</b><p>${esc(preencher(x.mensagem, extra))}</p></div>` : "";
  }

  /* ================= resumo final: cruzamentos, próximos passos, retrato ================= */
  function cruzamentos() {
    const C = ctx();
    const out = [];
    const add = (k, extra) => { const x = D.resumo.cruzamentos.find((c) => c.quando === k); out.push({ x, texto: preencher(x.mensagem, extra) }); };
    if (vende() && opR("M10-01") === "Ainda não falo com clientes") add("Estágio = vendas e nenhum canal de conversa");
    if (opR("M10-05") === "Anúncio pago" && !C.divulgacaoM5) add("Anúncio pago sem gasto no Módulo 5");
    if (C.recorrente && opR("M10-04") === "Não, só se o cliente me procura") add("Compra recorrente (M2-05) e sem pós-venda");
    if (opR("M10-02") === "Mais de 2 dias" && C.concorrente) add("Resposta em mais de 2 dias e concorrentes no Módulo 3");
    if (contrata() && C.cap7.cmp && C.cap7.cmp.tipo === "folga") add("Contratar e capacidade com folga (M7)", { "[folga]": Mo.fmt(C.cap7.cmp.n) });
    if (temSocio() && SEM_ACORDO.includes(opR("M10-06"))) add("Sócio sem acordo escrito");
    /* no máximo 3 alertas: perguntas gentis primeiro */
    return out.sort((a, b) => (a.x.forma === "Pergunta gentil" ? 0 : 1) - (b.x.forma === "Pergunta gentil" ? 0 : 1)).slice(0, 3);
  }
  /* um encaminhamento só, o mais importante */
  function encaminhamento() {
    if (temSocio() && SEM_ACORDO.includes(opR("M10-06"))) return D.instrumentos.find((x) => x.nome === "Checklist de acordo entre sócios").aviso;
    if (contrata()) return "Contratar tem custo todo mês e regras próprias. Converse com um contador sobre a forma de contratar.";
    const p10 = textoDe(lerR(9)["M9.P10"]);
    if (p10 === "Ainda não fiz" || ehNS(lerR(9)["M9.P10"])) return "Antes de alugar ou reformar, consulte a prefeitura sobre a atividade no endereço.";
    return "";
  }
  function proximosPassos() {
    const B = Object.fromEntries(D.resumo.proximos.map((x) => [x.situacao, x.mensagem]));
    const r = S.R["M10-11"];
    if (r && r.estado === "plano" && Mo.num(r.numero) > 0 && r.sinal) return [B["Plano completo"]];
    if (r) return [B["Plano sem sinal ou número"]];
    return [];
  }
  function lacunas() {
    const out = [];
    sequencia().forEach((c) => {
      const r = S.R[c];
      if (!r) return;
      if (r.estado === "naosei" || (c === "M10-05" && r.opcao === "Ainda não sei")) out.push(c === SOCIO ? "Sócios" : Q[c].descobre);
    });
    return out;
  }
  /* retrato: uma linha por módulo (o que já se sabe, o que é hipótese, o que falta) */
  function retrato() {
    const C = ctx();
    const t = (n, cod) => textoDe(lerR(n)[cod]);
    const sabe = {
      1: oferta() ? `Você vende: ${curto(oferta(), 70)}` : null,
      2: C.ouvidas != null ? `Pessoas ouvidas: ${Mo.fmt(C.ouvidas)}` : null,
      3: I().diferencial ? `Diferencial: ${curto(I().diferencial, 70)}` : null,
      4: I().proposta ? `Proposta de valor: ${curto(I().proposta, 70)}` : null,
      5: I().preco ? `Preço: R$ ${I().preco}` : null,
      6: I().pagamento ? `Formas de pagamento: ${curto(I().pagamento, 70)}` : null,
      7: C.cap7.mes ? `Cabem ${C.cap7.mes} por mês` : C.etapas7.length ? `${C.etapas7.length} etapas no mapa do processo` : null,
      8: t(8, "M8.P05") && t(8, "M8.P05") !== NS ? `CNPJ: ${t(8, "M8.P05")}` : null,
      9: t(9, "M9.P10") && t(9, "M9.P10") !== NS ? `Consulta na prefeitura: ${t(9, "M9.P10").toLowerCase()}` : null,
    };
    const hip = {
      1: I().estagio && I().estagio !== ESTAGIOS[2] ? "Ainda não vendeu: a ideia é uma hipótese" : null,
      2: t(2, "M2.P21") === "Só elogios" ? "O problema do cliente ainda não foi confirmado" : null,
      4: t(4, "M4.P13") ? `Hipótese do teste: ${curto(t(4, "M4.P13"), 70)}` : null,
    };
    return D.modulos.filter((x) => x.numero < 10).map((x) => {
      const R = lerR(x.numero);
      const feito = Object.keys(R).length > 0;
      const falta = Object.values(R).filter((r) => r && r.estado === "naosei").length;
      return { n: x.numero, nome: x.nome, feito, sabe: sabe[x.numero], hip: hip[x.numero], falta };
    });
  }

  /* ================= resumo (tela M10-12) ================= */
  const INST = Object.fromEntries(D.instrumentos.map((x) => [x.nome, x]));
  const avisoInst = (nome) => `<p class="aviso-inst">${esc(INST[nome].aviso)}</p>`;
  function telaResultado() {
    if (S.hist[S.hist.length - 1] !== "RESULTADO") { S.hist.push("RESULTADO"); salvar(); }
    const q12 = Q["M10-12"];
    const prios = priosOrdenadas();
    const r11 = S.R["M10-11"];
    const plano = r11 && r11.estado === "plano" ? r11 : null;
    const cz = cruzamentos(), enc = encaminhamento(), passos = proximosPassos(), lac = lacunas(), ret = retrato();
    const r12 = S.R["M10-12"];
    if (S.inst.mensagem == null) S.inst.mensagem = [I().proposta, I().diferencial].filter(Boolean).join(" ");
    const canais = S.R["M10-01"];
    const canaisTxt = canais ? (canais.estado === "multi" ? canais.opcoes.join(", ") : canais.estado === "naosei" ? "Ainda não definido" : canais.opcao) : "";
    const r7 = S.R["M10-07"], r8a = S.R["M10-08a"];
    const respostas = [["Seu ponto de partida", null]].concat(sequencia().map((k) => [TXT(k), k]));
    const linha = (rot, v) => v ? `<p class="diag-q">${esc(rot)}</p><p class="diag-r">${esc(v)}</p>` : "";
    const p = el(`<div class="pag">
      ${topo("Resultado")}
      ${heroi({ kicker: "Resultado", kickerClasse: "passo", titulo: "Seu plano de ação", extra: chipOferta() })}
      <main class="corpo">
        ${barraFases(null, true)}
        <section class="concluido">
          <div class="conc-topo"><span class="check" aria-hidden="true"></span><div><h2>Você chegou ao fim do percurso</h2><p>${esc(preencher(q12.apoio))}</p></div></div>
        </section>
        ${cz.length ? `<section class="cartao"><h3>Pontos para conferir</h3>${cz.map((a) => `<div class="bloco ${a.x.forma === "Pergunta gentil" ? "b-alerta" : "b-proximo"}"><b>${esc(a.x.forma)}</b><p>${esc(a.texto)}</p></div>`).join("")}</section>` : ""}
        <section class="cartao bloco-res"><h3>Seu plano</h3>
          ${prios.length ? `<ol class="lista-capa">${prios.map((t, i) => `<li>${i === 0 ? `<b>${esc(t)}</b>` : esc(t)}</li>`).join("")}</ol>` : `<p class="diag-r">Nenhuma prioridade escolhida.</p>`}
          ${plano ? `<p class="diag-q">Para a prioridade mais urgente</p><p class="plano-frase">${esc(plano.frase)}</p>` : r11 ? `<p class="diag-r">Plano da prioridade principal: ainda não definido.</p>` : ""}
          ${avisoInst("Plano de ação")}
        </section>
        <section class="cartao bloco-res"><h3>Como você vende</h3>
          ${linha("Por onde os clientes falam com você", canaisTxt)}
          ${linha("Tempo de resposta", opR("M10-02"))}
          ${linha("Divulgação principal", opR("M10-05"))}
          <h4>Roteiro de venda${opR("M10-03") === "Depende do cliente" ? " (base)" : opR("M10-03") === "Ainda não vendi" ? " (para testar)" : ""}</h4>
          <ol class="mapa">${roteiroFinal().map((e) => `<li><span>${esc(e)}</span></li>`).join("")}</ol>
          ${avisoInst("Roteiro de venda")}
          <h4>Mensagem de apresentação</h4>
          <textarea class="campo" rows="4" id="msg" aria-label="Mensagem de apresentação">${esc(S.inst.mensagem)}</textarea>
          ${avisoInst("Mensagem de apresentação")}
          ${D.pedidos_ia.map((x) => { const tt = preencher(x.texto); return `<details class="saiba"><summary><span>Pedido para ferramentas de IA (só para organizar)</span></summary><div class="caixa caixa-ia"><b>${esc(x.pedido)}</b><div class="prompt"><p>${esc(tt)}</p><button class="btn-copiar" data-t="${esc(tt)}">Copiar texto</button></div><p class="ex">${esc(x.conferir)}</p><p class="ex">${esc(x.obs)}</p></div></details>`; }).join("")}
        </section>
        <section class="cartao bloco-res"><h3>Pessoas</h3>
          ${linha("Sócio", opR(SOCIO))}
          ${temSocio() ? linha("Acordo por escrito", opR("M10-06")) : ""}
          ${temSocio() ? `<h4>Checklist de acordo entre sócios</h4>${D.checklist_socios.map((x, i) => `<label class="chk"><input type="checkbox" data-ck="${i}" ${S.inst.checklist[i] ? "checked" : ""}><span>${esc(cap1(x))}</span></label>`).join("")}${avisoInst("Checklist de acordo entre sócios")}` : ""}
          ${r7 && r7.quem ? `<h4>Quem cuida de cada etapa</h4><ul class="lista-capa">${Object.entries(r7.quem).map(([e, q]) => `<li>${esc(e)}: <b>${esc(q)}</b></li>`).join("")}</ul>` : ""}
          ${linha("Contratar nos próximos meses", opR("M10-08"))}
          ${r8a && r8a.opcoes ? linha("Alternativas que você já considerou", r8a.opcoes.join(", ")) : ""}
        </section>
        <section class="cartao bloco-res"><h3>Retrato do negócio</h3>
          ${ret.map((x) => `<div class="retrato"><p class="diag-q">Módulo ${x.n} · ${esc(x.nome)}</p>
            ${!x.feito ? `<p class="diag-r">Ainda não feito neste aparelho. <a href="${LINK(x.n)}">Abrir o Módulo ${x.n}</a></p>` : `
            ${x.sabe ? `<p class="diag-r">Já se sabe: ${esc(x.sabe)}</p>` : ""}
            ${x.hip ? `<p class="diag-r">Hipótese: ${esc(x.hip)}</p>` : ""}
            <p class="diag-r">${x.falta ? `Falta: ${x.falta === 1 ? "1 resposta" : `${x.falta} respostas`} “Não sei”` : "Sem respostas em aberto"} · <a href="${LINK(x.n)}">Abrir o Módulo ${x.n}</a></p>`}</div>`).join("")}
          ${avisoInst("Retrato final do percurso")}
        </section>
        ${enc ? `<section class="cartao"><h3>Encaminhamento</h3><div class="bloco b-enc"><p>${esc(enc)}</p></div></section>` : ""}
        ${lac.length ? `<section class="cartao"><h3>O que ainda falta definir</h3><ul class="lista-capa">${lac.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></section>` : ""}
        ${passos.length ? `<section class="cartao"><h3>Próximo passo</h3><ol class="lista-capa">${passos.map((x) => `<li>${esc(x)}</li>`).join("")}</ol></section>` : ""}
        <section class="cartao-q pergunta" id="q12">
          <h2 class="q">${esc(preencher(q12.pergunta))}</h2>
          <div class="opcoes" id="op12">${opcoesDe("M10-12").map((o) => `<button class="opcao ${r12 && r12.opcao === o ? "sel" : ""}" data-o="${esc(o)}"><span class="radio" aria-hidden="true"></span><span class="op-txt"><b>${esc(o)}</b></span></button>`).join("")}</div>
          <div id="ret12">${r12 ? caixa(caminho("M10-12", r12.opcao)) : ""}</div>
          <div id="corr" ${r12 && r12.opcao === "Quero corrigir algo" ? "" : "hidden"}>${respostas.map(([tx, k]) => `<div class="corr-item"><span>${esc(tx)}</span><button class="btn btn-claro editar" data-c="${k || "PARTIDA"}">Corrigir minha resposta</button></div>`).join("")}
            <p class="diag-r">Para mudar uma resposta de outro módulo, use os links do retrato acima.</p></div>
        </section>
        <div class="acoes"><button class="btn btn-primario" id="imprimir">Imprimir resultado</button><button class="btn btn-linha" id="zerar2">Recomeçar do zero</button></div>
        ${botaoVoltar()}
        <div class="acoes lg2-proximo"><a class="btn btn-claro" style="text-decoration:none;text-align:center;box-sizing:border-box" href="/protected/modulos/laboratorio-de-gestao?aba=b">Voltar aos módulos</a></div>
        ${rodape()}
      </main>
    </div>`);
    const re = () => { salvar(); redesenhar(telaResultado); };
    p.querySelector("#v").onclick = () => { S.hist.pop(); const ant = S.hist.pop(); salvar(); ant && ant !== "RESULTADO" ? ir(telaPergunta, ant) : ir(telaCapa); };
    p.querySelector("#imprimir").onclick = () => window.print();
    p.querySelector("#zerar2").onclick = reiniciar;
    p.querySelectorAll("#op12 .opcao").forEach((b) => (b.onclick = () => { S.R["M10-12"] = { estado: "opcao", opcao: b.dataset.o }; re(); }));
    p.querySelectorAll("[data-c]").forEach((b) => (b.onclick = () => {
      S.voltarResumo = true; salvar();
      b.dataset.c === "PARTIDA" ? ir(telaPartida, { volta: true }) : ir(telaPergunta, b.dataset.c);
    }));
    p.querySelector("#msg").onchange = (e) => { S.inst.mensagem = e.target.value; salvar(); };
    p.querySelectorAll("[data-ck]").forEach((x) => (x.onchange = () => { S.inst.checklist[x.dataset.ck] = x.checked; salvar(); }));
    ligar(p);
    if (aviso) p.querySelector(".corpo").insertBefore(el(`<p class="erro">${esc(aviso)}</p>`), p.querySelector(".corpo").firstChild);
    return p;
  }

  ir(telaCapa);
})();
