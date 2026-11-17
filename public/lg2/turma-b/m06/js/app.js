/* Telas do Módulo 6 (versão A). Todo texto de conteúdo vem de window.MODULO6 (a planilha),
   sem edição. As respostas ficam só neste aparelho.
   Layout do Módulo 5: barra do topo com trilha, faixa roxa com ilustração, etapas pelas seções
   da planilha (GERAL → seção do negócio → Resultado), cartão da pergunta e cartão de conclusão. */
(function () {
  "use strict";
  const D = window.MODULO6, M = Motor.montar(D);
  const tela = document.getElementById("tela");
  const CHAVE = "lg2-turma-b-m06";
  /* o módulo mudou de turma em 15/10: traz as respostas salvas na chave antiga */
  try { const antiga = localStorage.getItem("lg2-turma-a-m06"); if (antiga && !localStorage.getItem(CHAVE)) localStorage.setItem(CHAVE, antiga); } catch (e) {}
  const vazio = (s) => !s || !String(s).trim() || s === "—" || s === "-" || s === "Nenhum" || s === "Nenhuma";

  /* as respostas guardadas pela planilha v0.1 usam outra numeração de perguntas: começam do zero */
  const DADOS = "2026-10-15";
  const MSG_NUMERO = "Digite só números. Ex.: 12,50";
  /* "Não sei" não grava (lote 16/11): o Continuar só anda com uma resposta de verdade */
  const MSG_ESCREVA = "Use a ajuda acima e escreva a sua resposta para continuar.";
  const MSG_ESCOLHA_NS = "Use a ajuda acima e escolha uma opção para continuar.";
  const MSG_RESPONDA = "Responda para continuar.";
  const MSG_ESCREVA_SIMPLES = "Escreva a sua resposta para continuar.";
  const MSG_ESCOLHA = "Escolha uma opção para continuar.";
  const MSG_MARQUE = "Marque pelo menos uma opção para continuar.";
  const MSG_NEGATIVO = "O valor não pode ser negativo.";
  const MAX_PARCELAS = 60;
  const MAX_DICAS = 4;     // "Dicas gerais" fica curta
  const SEM_COMPRAS = "Não tenho compras a fazer agora";
  const SEM_COMPRAS_RET = "Tudo bem: sem compras para começar agora. Pulamos o valor das compras e a lista de prioridades.";
  /* relatório de 05/11 (Nayara): quem ainda não sabe o que vai comprar. Grava como "Não sei" (mesmo caminho:
     não pergunta o valor nem monta a lista de prioridades) + marca aindaNaoSei, para o resumo dizer "falta descobrir". */
  const AINDA_NAO_SEI = "Ainda não sei o que vou precisar comprar";
  const COMO_DESCOBRIR = [
    "Liste tudo o que você usa para fazer uma unidade ou um atendimento, do começo ao fim.",
    "Olhe a ficha técnica que você montou na Etapa 4.",
    "Confira os materiais que você informou na Etapa 5.",
    "Separe o que você já tem do que ainda precisa comprar.",
  ];
  const ehAindaNaoSei = (R) => !!(R["M6.P01"] && R["M6.P01"].aindaNaoSei);
  const LIMITE_TEXTO = 220;   // ajuda maior que isso: 1ª frase + "Ver mais"

  /* teclado do celular: o campo em foco (e o Continuar logo abaixo) vai para o meio da área visível */
  const ehCampo = (x) => x && x.matches && x.matches("input, textarea, select");
  function mostrarCampo(alvo) {
    alvo.scrollIntoView({ block: "center" });
    /* se o Continuar ainda ficou atrás do teclado, sobe um pouco mais, sem esconder o campo */
    const ok = document.querySelector("#ok"); if (!ok) return;
    const vh = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    const falta = ok.getBoundingClientRect().bottom - vh + 12, sobra = alvo.getBoundingClientRect().top - 8;
    if (falta > 0) window.scrollBy(0, Math.min(falta, sobra));
  }
  document.addEventListener("focusin", (e) => {
    if (!ehCampo(e.target)) return;
    const alvo = e.target;
    setTimeout(() => { if (document.activeElement === alvo) mostrarCampo(alvo); }, 300);
  });
  if (window.visualViewport) window.visualViewport.addEventListener("resize", () => {
    const a = document.activeElement;
    if (ehCampo(a)) mostrarCampo(a);
  });
  /* versão do estado salvo: 2 = lote 16/11 ("Não sei" não grava mais). Migra sem apagar as outras respostas. */
  const VERSAO = 2;
  let S = carregar();   // { R: respostas, hist: [códigos], prio: {item: categoria}, fluxo: null|{...}, cen: {...} }
  /* (herdarNegocio() roda logo abaixo, depois que o motor e as leituras estão prontos) */
  function carregar() { try { const s = JSON.parse(localStorage.getItem(CHAVE)); return s && s.dados === DADOS ? migrar(s) : novo(); } catch { return novo(); } }
  function novo() { return { dados: DADOS, v: VERSAO, R: {}, hist: [], prio: {}, fora: [], fluxo: null, cen: null }; }
  /* respostas antigas "Não sei" (botão, opção, "Ainda não sei o que vou precisar comprar" ou só "Não sei" marcado)
     viram "sem resposta": a pessoa responde quando passar por lá; o histórico para nessa pergunta */
  function migrar(s) {
    if ((s.v || 1) >= VERSAO) return s;
    const tiradas = [];
    Object.keys(s.R || {}).forEach((k) => {
      const r = s.R[k];
      if (!r) return;
      if (r.estado === "naosei" || r.aindaNaoSei || (r.estado === "opcao" && r.opcao === Motor.NS)) { delete s.R[k]; tiradas.push(k); }
      else if (r.estado === "multi" && r.opcoes.includes(Motor.NS)) {
        r.opcoes = r.opcoes.filter((o) => o !== Motor.NS);
        if (!r.opcoes.length) { delete s.R[k]; tiradas.push(k); }
      }
    });
    if (tiradas.length && Array.isArray(s.hist)) {
      const i = s.hist.findIndex((c) => tiradas.includes(c));
      if (i >= 0) s.hist = s.hist.slice(0, i + 1);
      else if (s.hist[s.hist.length - 1] === "RESULTADO") s.hist = [...s.hist.slice(0, -1), tiradas[0]];
    }
    /* formas de pagamento: as opções agora são as do Módulo 5 (as antigas viram a equivalente) */
    const r4 = s.R && s.R["M6.P04"];
    if (r4 && r4.estado === "multi") {
      const EQ = { "Cartão de crédito à vista": "Cartão de crédito", "Cartão de crédito parcelado": "Cartão de crédito", "Boleto": "Outra forma", "Transferência bancária": "Outra forma" };
      const novas = r4.opcoes.map((o) => EQ[o] || o);
      r4.opcoes = Motor.FORMAS_M5.filter((o) => novas.includes(o)).concat(novas.filter((o) => !Motor.FORMAS_M5.includes(o) && o !== Motor.NS)).filter((o, i, a) => a.indexOf(o) === i);
    }
    s.v = VERSAO; s.fluxo = s.fluxo && s.fluxo.v === 2 ? s.fluxo : null; s.cen = null;
    try { localStorage.setItem(CHAVE, JSON.stringify(s)); } catch {}
    return s;
  }
  function salvar() { try { localStorage.setItem(CHAVE, JSON.stringify(S)); } catch {} }

  /* ================= o que já veio de outros módulos (só leitura; nunca escreve nas chaves deles) ================= */
  function lerOutro(chave, cod) {
    try { const s = JSON.parse(localStorage.getItem(chave)); const r = s && s.R && s.R[cod]; return r || null; } catch { return null; }
  }
  const K = { 1: "lg2-turma-a-m01", 3: "lg2-turma-a-m03", 4: "lg2-turma-a-m04", 5: "lg2-turma-a-m05", 8: "lg2-turma-b-m08" };
  const opcaoDe = (r) => r && r.estado === "opcao" && r.opcao ? String(r.opcao) : null;
  const valorTxt = (r) => r && r.estado === "valor" && typeof r.valor === "string" && r.valor.trim() ? r.valor.trim() : null;
  const listaDe = (r) => r && r.estado === "valor" && Array.isArray(r.valor) ? r.valor.filter((x) => typeof x === "string" && x.trim()).map((x) => x.trim()) : [];
  const doM5 = (c) => lerOutro(K[5], "M5." + c);
  /* materiais que a pessoa listou no Módulo 5 (produto: P03; serviço: P19), sem repetir */
  const materiaisM5 = () => [...new Set([...listaDe(doM5("P03")), ...listaDe(doM5("P19"))])];
  /* tipo de oferta: M1.P03A → M5.P01 → M4.P02 → M8.P02, pela palavra inicial da opção */
  const TIPOS = { produto: "Produto", mercadoria: "Mercadoria", "serviço": "Serviço", servico: "Serviço" };
  function tipoDe(txt) { const m = /^\s*(produto|mercadoria|servi[çc]o)/i.exec(txt || ""); return m ? TIPOS[m[1].toLowerCase()] : null; }
  function tipoHerdado() {
    for (const [mod, cod] of [[1, "M1.P03A"], [5, "M5.P01"], [4, "M4.P02"], [8, "M8.P02"]]) {
      const t = tipoDe(opcaoDe(lerOutro(K[mod], cod)));
      if (t && M.porCodigo[Motor.NEGOCIO] && M.porCodigo[Motor.NEGOCIO].opcoesLista.includes(t)) return { tipo: t, modulo: mod };
    }
    return null;
  }
  /* com o tipo já conhecido, o seletor não vira pergunta: entra pronto, com selo e opção de trocar */
  function herdarNegocio() {
    if (S.R[Motor.NEGOCIO]) return;
    const t = tipoHerdado();
    if (t) { S.R[Motor.NEGOCIO] = { estado: "opcao", opcao: t.tipo, herdado: t.modulo }; salvar(); }
  }
  /* limite de investimento dito no Módulo 1 (M1.P07): aviso, sem trava */
  const TETO_M1 = { "Nada por enquanto": 0, "Até R$ 100": 100, "Entre R$ 100 e R$ 500": 500, "Entre R$ 500 e R$ 1.000": 1000, "Mais de R$ 1.000": null };
  function tetoM1() {
    const op = opcaoDe(lerOutro(K[1], "M1.P07"));
    if (!op) return null;
    const txt = op.replace(/^\s*\d+\.\s*/, "").trim();
    return txt in TETO_M1 ? { texto: txt, teto: TETO_M1[txt] } : null;
  }
  const brl0 = (n) => "R$ " + n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const numero = (n) => n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  /* contas do Módulo 5 (motor5.js = cópia do motor do Módulo 5): gastos do mês por tipo e custo de cada venda */
  function dadosM5() {
    try {
      const s = JSON.parse(localStorage.getItem(K[5]));
      if (!s || !s.R || !window.Motor5) return null;
      const c = window.Motor5.calcular(null, s.R);
      const n = (x) => (isFinite(x) && x > 0 ? x : 0);
      /* entrega (M5.ENT): custo por entrega × quantas de cada 10 vendas têm entrega; se o cliente paga a entrega à parte,
         desconta o que ele paga. Se o motor do Módulo 5 já somar a entrega no custo de cada venda, ela sai de lá (não conta duas vezes). */
      const e = s.R["M5.ENT"], preco = c.preco !== null && c.preco > 0 ? c.preco : 0;
      let entrega = null;
      if (e && e.estado === "opcao" && e.opcao) {
        if (/^Não/i.test(e.opcao)) entrega = { porVenda: 0, opcao: e.opcao, custo: 0, a10: 0, cobra: 0 };
        else {
          const custo = n(Motor.num(e.custo)), porEntrega = e.tipoCusto === "pct" ? custo / 100 * preco : custo;
          const cobra = /à parte/i.test(e.opcao) ? n(Motor.num(e.cobra)) : 0, a10 = e.aCada10 === null || e.aCada10 === undefined ? 10 : n(Number(e.aCada10));
          entrega = { opcao: e.opcao, custo: Motor.cent(porEntrega), pct: e.tipoCusto === "pct" ? custo : null, cobra, a10,
            porVenda: Motor.cent(Math.max(0, porEntrega - cobra) * a10 / 10) };
        }
      }
      const entNoCusto = (c.linhas || []).filter((l) => /entrega/i.test(l.nome || "")).reduce((a, l) => a + n(l.valor), 0);
      return { entrega, fixos: n(c.fixos), perdas: n(c.perdas), retirada: n(c.trabalho), mensal: n(c.mensal),
        /* só o custo de cada venda: a taxa do cartão sai das entradas, forma por forma (não conta duas vezes) */
        custoVenda: Motor.cent(Math.max(0, n(c.custoUnidade) - entNoCusto)),
        custoUnidade: n(c.custoUnidade), taxa: n(c.taxa), preco: c.preco !== null && c.preco > 0 ? c.preco : 0 };
    } catch (e) { return null; }
  }
  /* perguntas que repetem uma resposta já dada antes na jornada: com a resposta anterior, a tela não aparece
     (fica um cartão "Veio da Etapa N · Trocar"); sem ela, a pergunta aparece normalmente */
  const AUTO = ["M6.P04", "M6.PF", "M6.P05", "M6.SZ", "M6.P06", "M6.P07", "M6.P15", "M6.P16"];
  const CURTA = { "M6.P04": "Como seus clientes vão pagar", "M6.PF": "Taxa, prazo e parte das vendas de cada forma", "M6.SZ": "Vendas conforme a época do ano", "M6.P05": "Quanto espera vender por mês", "M6.P06": "Gastos de todo mês",
    "M6.P07": "Dinheiro para usar no negócio", "M6.P15": "Materiais para produzir", "M6.P16": "Mercadorias para revender" };
  /* faixa do Módulo 1 -> valor usado aqui (o limite que a pessoa disse; dá para trocar pelo valor exato) */
  const CAIXA_M1 = { "Nada por enquanto": 0, "Até R$ 100": 100, "Entre R$ 100 e R$ 500": 100, "Entre R$ 500 e R$ 1.000": 500, "Mais de R$ 1.000": 1000 };
  /* taxa, prazo e parte de cada forma (M5.P24/P25, formato [{forma, taxa, prazo, parte}]). completa = dá para não perguntar */
  function herancaFormas() {
    const formas = (S.R["M6.P04"] && S.R["M6.P04"].estado === "multi" ? S.R["M6.P04"].opcoes : []);
    if (!formas.length) return null;
    const p24 = opcaoDe(doM5("P24")), p25 = doM5("P25"), lista = p25 && Array.isArray(p25.valor) ? p25.valor : [];
    if (p24 !== "Sim" && p24 !== "Não") return null;
    let completa = true;
    const valor = formas.map((f) => {
      const x = lista.find((y) => y && y.forma === f);
      if (x) return { forma: f, taxa: String(x.taxa ?? ""), prazo: String(x.prazo ?? ""), parte: formas.length > 1 ? String(x.parte ?? "") : "100" };
      if (p24 === "Não" && !Motor.ehCartao(f)) return { forma: f, taxa: "0", prazo: "0", parte: "" };
      completa = false;
      return { forma: f, taxa: p24 === "Não" ? "0" : "", prazo: "", parte: "" };
    });
    if (formas.length > 1 && valor.some((x) => !String(x.parte).trim())) completa = false;
    return { formas: valor, completa, modulo: 5, nota: p24 === "Não" ? "Na Etapa 5 você disse que não fica taxa nas vendas." : "Taxas que você informou na Etapa 5." };
  }
  /* respostas do Módulo 5 que respondem perguntas daqui (pré-preenchidas; a pessoa confere e toca Continuar) */
  const FORMA_M5 = { "Pix": "Pix", "Dinheiro": "Dinheiro", "Cartão de débito": "Cartão de débito", "Cartão de crédito": "Cartão de crédito à vista", "Outra forma": "Outra forma" };
  function heranca(cod) {
    const q = M.porCodigo[cod];
    if (cod === "M6.P04") {
      const pg = listaDe(doM5("PG"));
      const ops = q.opcoesLista.filter((o) => pg.includes(o));       // mesmas opções do Módulo 5
      return ops.length ? { opcoes: ops, modulo: 5, nota: "" } : null;
    }
    if (cod === Motor.P_FORMAS) return herancaFormas();
    if (cod === Motor.P_SAZ) {
      const r = doM5("SZ");
      if (!r || r.estado !== "opcao" || ![Motor.SZ_NAO, Motor.SZ_SIM].includes(r.opcao)) return null;
      const sz = { estado: "opcao", opcao: r.opcao };
      if (r.opcao === Motor.SZ_SIM) Object.assign(sz, { fortes: (r.fortes || []).slice(), fracos: (r.fracos || []).slice(), maisPct: r.maisPct || 0, menosPct: r.menosPct || 0 });
      return { sz, modulo: 5, nota: "" };
    }
    if (cod === "M6.P05") {
      const preco = Motor.num(valorTxt(doM5("P36"))), qtd = Motor.num(valorTxt(doM5("P37")));
      if (!(preco > 0 && qtd > 0)) return null;
      return { valor: numero(preco * qtd), modulo: 5, nota: `Conta feita com o que você disse na Etapa 5: ${brl0(preco)} por venda × ${qtd.toLocaleString("pt-BR")} vendas no mês.` };
    }
    if (cod === "M6.P07") {
      const t = tetoM1();
      if (!t || !(t.texto in CAIXA_M1)) return null;
      const v = CAIXA_M1[t.texto];
      return { valor: numero(v), modulo: 1, nota: `Na Etapa 1 você disse “${t.texto}”. Usamos ${brl0(v)}${/^Entre|^Mais/.test(t.texto) ? " (o menor valor da faixa)" : ""}. Troque pelo valor exato, se souber.` };
    }
    if (cod === "M6.P06") {
      const it = [], sim = (c) => opcaoDe(doM5(c)) === "Sim", nao = (c) => opcaoDe(doM5(c)) === "Não";
      const v = (c) => { const n = Motor.num(valorTxt(doM5(c))); return n > 0 ? n : null; };
      if (sim("P28") && v("P29")) it.push(["Aluguel", v("P29")]);
      if (sim("P30") && v("P31")) it.push(["Água e luz", v("P31")]);
      const outros = doM5("P33");
      if (sim("P32") && outros && Array.isArray(outros.valor))
        outros.valor.forEach((x) => { const n = Motor.num(x && x.v); if (x && String(x.nome || "").trim() && n > 0) it.push([String(x.nome).trim(), n]); });
      const m5 = dadosM5() || {};
      const separadas = [m5.perdas ? `perdas (${brl0(m5.perdas)})` : "", m5.retirada ? `o que você separa para você (${brl0(m5.retirada)})` : "",
        m5.custoVenda ? `o custo de cada venda (${brl0(m5.custoVenda)})` : ""].filter(Boolean);
      const resto = separadas.length ? ` ${separadas.join(", ").replace(/, ([^,]*)$/, " e $1")} ${separadas.length > 1 ? "entram" : "entra"} como linhas próprias no caixa.` : "";
      if (!it.length) return nao("P28") && nao("P30") && nao("P32") ? { valor: "Nenhum gasto fixo todo mês", modulo: 5, nota: "Na Etapa 5 você disse que não paga aluguel, água e luz nem outros gastos todo mês." + resto } : null;
      const total = it.reduce((a, x) => a + x[1], 0);
      return { valor: it.map(([n, x]) => `${n}: ${brl0(x)}`).join("; "), modulo: 5, total, nota: `São os gastos fixos de todo mês que você informou na Etapa 5 (${brl0(total)} por mês).${resto}` };
    }
    const lista = { "M6.P10": "P19", "M6.P15": "P03" }[cod];
    if (lista) {
      const l = listaDe(doM5(lista));
      if (l.length) return { valor: l.join(", "), modulo: 5, nota: "" };
      const m4 = cod === "M6.P15" ? valorTxt(lerOutro(K[4], "M4.P03")) : null;      // materiais ou ingredientes do Módulo 4
      return m4 ? { valor: m4, modulo: 4, nota: "" } : null;
    }
    if (cod === "M6.P11") {
      const precos = (doM5("P20") || {}).valor;
      const soma = Array.isArray(precos) ? precos.map((x) => Motor.num(x)).filter((n) => n > 0).reduce((a, n) => a + n, 0) : 0;
      return soma > 0 ? { valor: numero(soma), modulo: 5, nota: "Soma dos preços de compra dos itens que você informou na Etapa 5." } : null;
    }
    if (cod === "M6.P16") { const t = valorTxt(doM5("P10")); return t ? { valor: t, modulo: 5, nota: "" } : null; }
    if (cod === "M6.P17") { const n = Motor.num(valorTxt(doM5("P11"))); return n > 0 ? { valor: numero(n), modulo: 5, nota: "É o valor de compra que você informou na Etapa 5." } : null; }
    return null;
  }

  /* Perguntas da seção do negócio que repetem as do começo (P01 "o que precisa comprar" e P02 "quanto vai gastar"):
     quem já respondeu a P01 não vê de novo a lista de equipamentos/materiais nem o valor deles.
     O dado não se perde: a lista e o valor do começo já entram nos itens e no investimento. */
  const REPETE_P01 = ["M6.P10", "M6.P11", "M6.P13", "M6.P14"];
  const p01Respondida = (R) => !!R["M6.P01"] && R["M6.P01"].estado === "valor";
  function pulada(c, R) {
    if (c === Motor.NEGOCIO) return !!(R[c] && R[c].herdado);
    if (autoHerdada(c, R)) return true;
    if (c === "M6.P08") return true;      // o prazo agora é perguntado por forma de pagamento (M6.PF)
    if (c === "M6.P02" && R["M6.P01"] && R["M6.P01"].semCompras) return true;     // sem compras: não pergunta quanto vai gastar
    /* "Ainda não sei o que vou precisar comprar": também não repete a lista nem o valor dos equipamentos */
    return REPETE_P01.includes(c) && (p01Respondida(R) || ehAindaNaoSei(R));
  }
  function proxima(R, cod) {
    let c = Motor.proxima(M, R, cod);
    while (c !== "RESULTADO" && pulada(c, R)) c = Motor.proxima(M, R, c);
    return c;
  }
  /* sem gravar nada: a próxima tela seria o resultado? (perguntas repetidas com resposta anterior não contam) */
  function proxPrevia(cod, R0) {
    const R = Object.assign({}, R0 || S.R);
    let c = proxima(R, cod);
    while (c !== "RESULTADO" && AUTO.includes(c) && !R[c]) { const h = heranca(c); if (!h || h.completa === false) break; R[c] = respHerdada(h); c = proxima(R, c); }
    return c;
  }
  const autoHerdada = (c, R) => AUTO.includes(c) && !!(R[c] && R[c].herdado) && S.trocando !== c;
  function respHerdada(h) {
    if (h.sz) return Object.assign({}, h.sz, { herdado: h.modulo });
    if (h.formas) return { estado: "valor", valor: h.formas.map((x) => Object.assign({}, x)), herdado: h.modulo };
    return h.opcoes ? { estado: "multi", opcoes: h.opcoes.slice(), herdado: h.modulo } : { estado: "valor", valor: String(h.valor), herdado: h.modulo };
  }
  /* próxima TELA: pergunta repetida com resposta anterior não aparece; a resposta é usada e fica um cartão na tela seguinte */
  function proxTela(cod) {
    let c = proxima(S.R, cod);
    while (c !== "RESULTADO" && AUTO.includes(c) && !S.R[c]) {
      const h = heranca(c);
      if (!h || h.completa === false) break;
      S.R[c] = respHerdada(h); S.fluxo = null; S.cen = null;
      S.pulou = [...(S.pulou || []).filter((x) => x !== c), c];
      salvar();
      c = proxima(S.R, c);
    }
    return c;
  }

  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const link = (u, t) => /^https?:/.test(u || "") ? `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(t || u)}</a>` : esc(t || u);
  const brl = (n) => (n < 0 ? "−" : "") + "R$ " + Math.abs(n).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  function el(html) { const d = document.createElement("div"); d.innerHTML = html.trim(); return d.firstElementChild; }
  /* nova pergunta: o foco vai para o enunciado (leitor de tela lê a pergunta nova) */
  function ir(f, a) {
    tela.innerHTML = ""; tela.appendChild(f(a)); window.scrollTo(0, 0);
    const h = tela.querySelector(".cartao-q h2.q");
    if (h) h.focus({ preventScroll: true });
  }

  /* conceitos ligados à pergunta: a página citada na fonte da pergunta (aba 3, coluna K)
     é a mesma do link do conceito (aba 2, coluna H) */
  const norm = (s) => String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  function conceitosDe(q) {
    const f = norm(q.fonte);
    return D.base.filter((b) => {
      if (String(q.fonte || "").includes(b.codigo)) return true;   // "com base em M6.BT04 e M6.BT05"
      const pag = norm(String(b.link || "").replace(/\/(Paginas\/default\.aspx)?$/i, "").split("/").filter(Boolean).pop());
      return pag && f.includes(pag.split(" ").slice(0, 4).join(" "));
    }).slice(0, 3);
  }
  const educativoDe = (cod) => D.educativo.filter((e) => e.onde === cod);
  const conceito = (cod) => D.base.find((b) => b.codigo === cod) || {};

  /* como descobrir o que comprar (P01 "Ainda não sei…"): orientação curta + materiais do Módulo 5 como ponto de partida */
  function blocoComoDescobrir(comBotao) {
    const mat = materiaisM5();
    return `<div class="bloco b-proximo como-descobrir" id="como-descobrir"><b>Como descobrir o que comprar</b>
      <ol>${COMO_DESCOBRIR.map((x) => `<li>${esc(x)}</li>`).join("")}</ol>
      ${mat.length ? `<div class="partida" id="partida-m5"><span class="selo">Veio da Etapa 5</span>
        <p>Você já listou estes materiais: ${esc(mat.join(", "))}. Eles podem ser o seu ponto de partida.</p>
        ${comBotao ? `<button class="btn-alt" id="usar-m5">Usar essa lista como ponto de partida</button>` : ""}</div>` : ""}
    </div>`;
  }
  /* menos texto na tela: ajuda longa mostra a 1ª frase e guarda o resto em "Ver mais" */
  function curto(texto) {
    const t = String(texto || "").trim();
    const m = /^(.+?[.!?:])\s+(.+)$/s.exec(t);
    if (t.length <= LIMITE_TEXTO || !m) return esc(t);
    return `${esc(m[1])}<details class="ver-mais"><summary>Ver mais</summary>${esc(m[2])}</details>`;
  }
  /* caixas "Entenda", "Faça" e "Use a IA com cuidado": recolhidas e discretas, embaixo do Continuar */
  function blocoEducativo(lista) {
    return lista.map((e) => `
      <details class="caixa recolhida caixa-${e.tipo === "Faça" ? "faca" : e.tipo === "Entenda" ? "entenda" : "ia"}">
        <summary><span class="tag">${esc(e.tipo)}</span> <b>${esc(e.titulo)}</b></summary>
        <p>${esc(e.texto)}</p>
        ${vazio(e.exemplo) ? "" : `<p class="ex">${esc(e.exemplo)}</p>`}
        ${vazio(e.prompt) ? "" : `<div class="prompt"><p>${esc(e.prompt)}</p><button class="btn-copiar" data-t="${esc(e.prompt)}">Copiar texto</button></div>
          ${vazio(e.conferir) ? "" : `<p class="ex">${esc(e.conferir)}</p>`}`}
        <span class="fonte">Fonte: ${esc(e.fonte)}</span>
      </details>`).join("");
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
    p.querySelectorAll("[data-copiar]").forEach((b) => {
      const alvo = b.parentNode.querySelector("[data-prompt]");
      b.onclick = () => copiar(alvo.textContent, b, alvo);
    });
  }
  /* copiar com reserva: área de transferência → execCommand → deixa o texto selecionado (como no Módulo 1) */
  function copiar(t, b, alvo) {
    const pronto = () => { b.textContent = "Copiado!"; setTimeout(() => { if (document.contains(b)) b.textContent = "Copiar"; }, 2000); };
    const reserva = () => {
      const ta = document.createElement("textarea");
      ta.value = t; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.top = "0"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      let foi = false;
      try { foi = document.execCommand("copy"); } catch (e) {}
      ta.remove();
      if (foi) return pronto();
      try { const r = document.createRange(); r.selectNodeContents(alvo); const sl = getSelection(); sl.removeAllRanges(); sl.addRange(r); } catch (e) {}
      b.textContent = "Toque e segure o texto para copiar";
    };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(t).then(pronto, reserva);
    else reserva();
  }
  /* ---------- "Não sei": caixa "Como descobrir" (passos + pedido pronto para a IA, com Copiar) ----------
     Os textos ficam nos dados de cada pergunta (comoDescobrir, promptIA); a resposta salva não muda. */
  /* texto da planilha para quem não sabe (regra "Não sei" da aba 4): entra na caixa como dica */
  function dicaNS(q) {
    const r = Motor.regrasPara(M, q.codigo, q.opcoesLista.includes(Motor.NS) && Motor.campo(q) === "multi" ? { estado: "multi", opcoes: [Motor.NS] } : { estado: "naosei" })[0];
    return r && !vazio(r.texto) ? r.texto : "";
  }
  function caixaComo(q, extra) {
    if (!q || !q.comoDescobrir || !q.comoDescobrir.length) return "";
    const d = dicaNS(q);
    return `<section class="como-descobrir como-ns" role="status">
      <b class="como-tit">Como descobrir</b>
      ${d ? `<p class="como-dica">${esc(d)}</p>` : ""}
      <ol>${q.comoDescobrir.map((x) => `<li>${esc(x)}</li>`).join("")}</ol>
      ${q.promptIA ? `<div class="pedir-ia">
        <b>Peça ajuda à IA</b>
        <p class="como-nota">Copie, cole numa IA de sua preferência e troque o que está entre colchetes.</p>
        <p class="prompt" data-prompt>${esc(q.promptIA)}</p>
        <button class="btn-alt copiar" type="button" data-copiar>Copiar</button>
      </div>` : ""}
      ${extra || ""}
    </section>`;
  }
  /* P01 "Não sei": os materiais listados no Módulo 5 podem ser o ponto de partida */
  function partidaM5() {
    const mat = materiaisM5();
    return mat.length ? `<div class="partida" id="partida-m5"><span class="selo">Veio da Etapa 5</span>
      <p>Você já listou estes materiais: ${esc(mat.join(", "))}. Eles podem ser o seu ponto de partida.</p>
      <button class="btn-alt" type="button" id="usar-m5">Usar essa lista como ponto de partida</button></div>` : "";
  }
  /* aviso quando o valor novo é diferente do que veio de outro módulo */
  function divergencia(cod, her, novo) {
    if (cod === "M6.P06") {
      const a = her.total !== undefined ? her.total : Motor.somaValores(her.valor), b = Motor.somaValores(novo);
      return Math.abs(a - b) >= 0.01 ? `Na Etapa ${her.modulo}, seus gastos fixos do mês somavam ${brl(a)}; aqui somam ${brl(b)}. Confira. Se estiver certo, toque em Continuar de novo.` : null;
    }
    if (Motor.campo(M.porCodigo[cod]) !== "numero") return null;
    const a = Motor.num(her.valor), b = Motor.num(novo);
    return isFinite(a) && isFinite(b) && Math.abs(a - b) >= 0.01 ? `Na Etapa ${her.modulo}, esse valor era ${brl(a)}. Confira. Se ${brl(b)} estiver certo, toque em Continuar de novo.` : null;
  }
  /* respostas que vieram de outro módulo, sem tela: cartão pequeno com "Trocar" */
  const pct = (x) => String(Motor.num(x)).replace(".", ",") + "%";
  const listaMeses = (l) => { const n = (l || []).map((m) => Motor.MESES[m - 1]); return n.length > 1 ? n.slice(0, -1).join(", ") + " e " + n[n.length - 1] : n.join(""); };
  function textoResp(r) {
    if (r.estado === "multi") return r.opcoes.join(", ");
    if (Array.isArray(r.valor)) return r.valor.map((x) => `${x.forma}: taxa ${pct(x.taxa || 0)}, cai em ${Motor.num(x.prazo) || 0} dias${r.valor.length > 1 ? `, ${pct(x.parte || 0)} das vendas` : ""}`).join("; ");
    if (r.opcao === Motor.SZ_SIM) return [r.fortes && r.fortes.length ? `mais forte em ${listaMeses(r.fortes)} (+${r.maisPct}%)` : "", r.fracos && r.fracos.length ? `mais fraco em ${listaMeses(r.fracos)} (−${r.menosPct}%)` : ""].filter(Boolean).join("; ");
    return Motor.valorDe(r);
  }
  function itemHerdado(c) {
    const r = S.R[c];
    const v = M.porCodigo[c] && Motor.campo(M.porCodigo[c]) === "numero" ? brl(Motor.num(r.valor)) : textoResp(r);
    return `<li><span class="selo">Veio da Etapa ${esc(r.herdado)}</span> <b>${esc(CURTA[c])}:</b> ${esc(v)}
      <button class="btn-alt trocar-h" type="button" data-trocar="${esc(c)}" aria-label="Trocar: ${esc(CURTA[c])}">Trocar</button></li>`;
  }
  function cartaoPulou() {
    const l = (S.pulou || []).filter((c) => S.R[c] && S.R[c].herdado);
    if (!l.length) return "";
    /* um item: à vista; vários: resumo fechado, para a pergunta não descer */
    return `<details class="herdadas" id="herdadas"${l.length === 1 ? " open" : ""}><summary>${l.length === 1 ? "Já respondido antes, não perguntamos de novo" : `${l.length} respostas vieram de etapas anteriores · ver ou trocar`}</summary><ul>${l.map(itemHerdado).join("")}</ul></details>`;
  }
  function ligarTrocar(p) {
    p.querySelectorAll("[data-trocar]").forEach((b) => (b.onclick = () => { S.trocando = b.dataset.trocar; S.pulou = []; salvar(); ir(telaPergunta, b.dataset.trocar); }));
  }
  /* retorno das perguntas criadas pelo app: a conta, com os valores da pessoa */
  function retornoApp(cod, R) {
    R = R || S.R;
    if (cod === Motor.P_PARCELAS) {
      const pl = Motor.planoInvestimento(R);
      if (!pl.n) return "";
      const sems = pl.semanas.map((x) => x.semana), dep = pl.depois.length;
      return `<p class="r-texto" id="ret-parcelas">No caixa das 13 semanas: ${pl.entrada ? `entrada de ${brl(pl.entrada)} na semana 1; ` : ""}${sems.length ? `parcelas de ${brl(pl.parcela)} na${sems.length > 1 ? "s semanas " + sems.slice(0, -1).join(", ") + " e " + sems[sems.length - 1] : " semana " + sems[0]}` : "nenhuma parcela vence nas 13 semanas"}${dep ? `; ${dep} ${dep === 1 ? "parcela fica" : "parcelas ficam"} para depois da semana 13` : ""}.</p>
        ${como(`uma parcela por mês, a 1ª um mês depois da compra. 1 mês ≈ 4,33 semanas (52 semanas ÷ 12 meses), então as parcelas caem nas semanas ${[...pl.semanas, ...pl.depois].map((x) => x.semana).join(", ")}.`, "como-sem-parcelas")}`;
    }
    if (cod === Motor.P_CARTAO) {
      const pct = Motor.PARTE_CARTAO[Motor.valor(R, Motor.P_CARTAO)];
      return pct === undefined ? "" : `<p class="r-texto">Certo: ${pct}% das vendas esperam o prazo do cartão; os outros ${100 - pct}% entram na semana da venda.</p>`;
    }
    return "";
  }
  /* o que falta, próximo passo e encaminhamento da regra: em "Ver mais" (no resultado eles aparecem de novo) */
  function detalhesRegra(r, aberto) {
    const l = [vazio(r.lacuna) ? "" : `<div class="bloco b-lacuna"><b>O que ainda falta</b>${esc(r.lacuna)}</div>`,
      vazio(r.proximo) ? "" : `<div class="bloco b-proximo"><b>Próximo passo</b>${esc(r.proximo)}</div>`,
      vazio(r.encaminhamento) || Motor.retorna(r) ? "" : `<div class="bloco b-enc"><b>Encaminhamento</b>${esc(r.encaminhamento)}</div>`].join("");
    return l ? `<details class="ver-mais r-mais"${aberto ? " open" : ""}><summary>Ver mais</summary>${l}</details>` : "";
  }
  /* "Ver dica" fechada, entre a pergunta e as respostas: a ajuda da pergunta + os termos */
  function verDica(q) {
    const cs = conceitosDe(q), cuidados = q.app ? [] : Motor.alertasDica(D, q);
    if (vazio(q.ajuda) && !cs.length && !cuidados.length) return "";
    return `<details class="dica-toggle" id="ver-dica"><summary>Ver dica</summary>
      ${vazio(q.ajuda) ? "" : `<p class="ajuda">${esc(q.ajuda)}</p>`}
      ${cuidados.length ? `<ul class="cuidados">${cuidados.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}
      ${cs.map((b) => `<div class="conceito"><b>${esc(b.conceito)}</b><p>${esc(vazio(b.definicao) ? b.porque : b.definicao)}</p>
        ${vazio(b.exemplo) ? "" : `<p class="ex">${esc(b.exemplo)}</p>`}</div>`).join("")}
    </details>`;
  }


  /* ================= peças do layout ================= */
  const titulo = (s) => { s = String(s || "").trim(); return s ? s.charAt(0) + s.slice(1).toLowerCase() : ""; };
  /* seção da planilha de cada pergunta; as seções que dependem de "Negócio" viram uma etapa só */
  const SECAO = {}, SECAO_NEG = {};
  { let sec = null;
    D.perguntas.forEach((p) => {
      if (!p.codigo) { sec = p.secao || sec; return; }
      SECAO[p.codigo] = sec;
      const m = /^Negócio\s*=\s*(.+)$/.exec(p.condicao || "");
      if (m) SECAO_NEG[m[1].trim()] = sec;
    }); }
  const secoesNeg = new Set(Object.values(SECAO_NEG));
  function nomeNegocio() {
    const r = S.R["Negócio"];
    return r && r.estado === "opcao" && SECAO_NEG[r.opcao] ? titulo(SECAO_NEG[r.opcao]) : "Negócio";
  }
  /* etapa da pergunta: 1 = primeira seção; 2 = seletor "Negócio" e sua seção; 3 = resultado */
  const etapaDe = (cod) => cod === "RESULTADO" ? 3 : cod === "Negócio" || secoesNeg.has(SECAO[cod]) ? 2 : 1;
  const nomeSecao = (cod) => etapaDe(cod) === 2 ? nomeNegocio() : titulo(SECAO[cod]);
  function topo(trilha) {
    return `<div class="barra-topo">
      <img class="logo-mini" src="assets/minds.svg" alt="Minds of the Future">
      <nav class="trilha" aria-label="Você está em"><button class="trilha-link" data-inicio>Início</button><span>/</span><span>Etapa ${esc(D.modulo.numero)}</span>${trilha ? `<span>/</span><span>${esc(trilha)}</span>` : ""}</nav>
    </div>`;
  }
  function heroi(o) {
    /* versão leve: nas perguntas, faixa compacta (só o passo e a barra de progresso, sem título repetido nem ilustração) */
    if (o.compacta) return `<section class="heroi heroi-compacta">
      <div class="heroi-txt"><div class="kicker ${o.kickerClasse || ""}">${esc(o.kicker)}</div></div>
      <div class="heroi-prog"><div class="barra" role="progressbar" aria-label="Progresso" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${o.pct}"><div class="barra-fill" style="width:${o.pct}%"></div></div></div>
    </section>`;
    return `<section class="heroi ${o.grande ? "heroi-grande" : ""}">
      <div class="heroi-topo">
        <div class="heroi-txt">
          <div class="kicker ${o.kickerClasse || ""}">${esc(o.kicker || "Etapa " + D.modulo.numero)}</div>
          <${o.h1 ? "h1" : "h2"} class="heroi-tit">${esc(o.titulo)}</${o.h1 ? "h1" : "h2"}>
          ${o.texto ? `<p>${esc(o.texto)}</p>` : ""}
        </div>
        <img class="heroi-img" src="assets/${o.img || "hero-tela.webp"}" alt="">
      </div>
    </section>`;
  }
  function etapas(n, tudo) {
    const nomes = [titulo(D.perguntas.find((p) => !p.codigo && p.secao).secao), nomeNegocio(), "Resultado"];
    return `<ol class="etapas" aria-label="Partes desta etapa">${nomes.map((nome, i) => {
      const k = i + 1, st = tudo || k < n ? "feita" : k === n ? "atual" : "";
      return `<li class="${st}"${k === n && !tudo ? ' aria-current="step"' : ""}><span class="bola" aria-hidden="true"></span><span class="rot">${esc(nome)}</span></li>`;
    }).join("")}</ol>`;
  }
  function dica(texto) {
    if (vazio(texto)) return "";
    return `<aside class="dica"><img src="assets/hero-tela.webp" alt=""><div><b>Dica</b><div class="ajuda">${curto(texto)}</div></div></aside>`;
  }
  /* "‹ Voltar" no topo do cartão, à esquerda, no mesmo lugar em todos os módulos (como no Módulo 1);
     na 1ª pergunta ele volta para a capa */
  const botaoVoltar = () => `<button class="voltar-topo" id="v" aria-label="Voltar"><span aria-hidden="true">‹</span> Voltar</button>`;
  let partidaP01 = null;      // lista do Módulo 5 escolhida como ponto de partida da P01 (só para a próxima tela)
  function ligar(p) {
    p.querySelectorAll("[data-inicio]").forEach((b) => { b.onclick = () => ir(telaCapa); });
  }

  /* ================= capa ================= */
  function telaCapa() {
    const iniciado = S.hist.length > 0;
    const p = el(`
      <div class="pag">
        ${topo("")}
        ${heroi({ grande: true, h1: true, kicker: "Etapa " + D.modulo.numero, titulo: D.modulo.nome, texto: D.capa.frase, img: "hero-inicio.webp" })}
        <main class="corpo">
          <p class="tempo">Esta etapa leva cerca de ${esc(D.capa.minutos)} minutos</p>
          <div class="acoes">
            <button class="btn btn-primario seta" id="ir">${iniciado ? "Continuar de onde parei" : "Começar"}</button>
            ${iniciado ? `<button class="btn btn-claro" id="zerar">Recomeçar do zero</button>` : ""}
          </div>
          <details class="como-funciona"><summary>Como funciona</summary>
            <h3>Para quem é</h3><p>${esc(D.mapa.usuario)}</p>
            <h3>O que ter em mãos</h3><p>${esc(D.mapa.ter_em_maos)}</p>
            <h3>O que você recebe no final</h3><p>${esc(D.mapa.entrega)}</p>
            <button class="btn btn-linha" id="limites">O que esta etapa não faz</button>
          </details>
          ${rodape()}
        </main>
      </div>`);
    ligar(p);
    p.querySelector("#ir").onclick = () => {
      const atual = S.hist[S.hist.length - 1];
      if (atual === "RESULTADO") ir(telaResultado);
      else ir(telaPergunta, atual || proxTela(null));
    };
    const z = p.querySelector("#zerar");
    if (z) z.onclick = () => { if (confirm("Apagar suas respostas e recomeçar?")) { S = novo(); herdarNegocio(); salvar(); ir(telaCapa); } };
    p.querySelector("#limites").onclick = () => ir(telaLimites);
    return p;
  }

  function telaLimites() {
    const p = el(`
      <div class="pag">
        ${topo("Limites")}
        ${heroi({ titulo: "Limites da etapa" })}
        <main class="corpo">
          ${botaoVoltar()}
          <div class="cartao"><h3>O que a etapa não faz</h3><p>${esc(D.mapa.nao_faz)}</p></div>
          <div class="cartao"><h3>Que decisões ele apoia</h3><p>${esc(D.mapa.decisoes)}</p></div>
          <div class="cartao"><h3>Quando procurar um profissional</h3><p>${esc(D.mapa.encaminhamentos)}</p></div>
          <div class="cartao"><h3>Cuidados</h3><p>${esc(D.mapa.riscos)}</p></div>
          <div class="aviso">${esc(D.mapa.mensagem_limite)}</div>
          ${rodape()}
        </main>
      </div>`);
    ligar(p);
    p.querySelector("#v").onclick = () => ir(telaCapa);
    return p;
  }

  /* ================= pergunta ================= */
  /* lote 17/11 (um toque por pergunta): o Continuar grava e já abre a próxima. O retorno da resposta aparece
     ao vivo, logo abaixo dela; se a pessoa tocou Continuar antes de ver, ele vem num cartão pequeno no alto da tela seguinte. */
  let sobreAnterior = null;
  function cartaoSobre() {
    const h = sobreAnterior; sobreAnterior = null;
    return h ? `<aside class="sobre-anterior" id="sobre-anterior"><b>Sobre a sua resposta anterior:</b> ${h}</aside>` : "";
  }
  /* contador estável: posição no caminho de agora; total = o caminho mais longo possível (não muda no meio) */
  const TOTAL = (() => {
    const base = M.perguntas.filter((q) => q.codigo !== Motor.NEGOCIO && q.codigo !== "M6.P08" && !REPETE_P01.includes(q.codigo) && etapaDe(q.codigo) === 1).length;
    const porSecao = {};
    M.perguntas.forEach((q) => { if (etapaDe(q.codigo) === 2 && q.codigo !== Motor.NEGOCIO && !REPETE_P01.includes(q.codigo)) porSecao[SECAO[q.codigo]] = (porSecao[SECAO[q.codigo]] || 0) + 1; });
    return base + 1 + Math.max(0, ...Object.values(porSecao));
  })();
  function posicao(cod) {
    let c = proxima(S.R, null), n = 1;
    for (let i = 0; c !== "RESULTADO" && c !== cod && i < 60; i++) { c = proxima(S.R, c); n++; }
    return Math.min(c === cod ? n : Math.max(1, S.hist.filter((x) => x !== "RESULTADO").length), TOTAL);
  }

  function telaPergunta(cod) {
    const q = M.porCodigo[cod];
    if (S.hist[S.hist.length - 1] !== cod) { S.hist.push(cod); salvar(); }
    const tipo = Motor.campo(q);
    const resp = S.R[cod] || null;
    let escolhida = resp && resp.estado === "opcao" ? resp.opcao : null;
    let marcadas = resp && resp.estado === "multi" ? resp.opcoes.slice() : resp && resp.estado === "naosei" && tipo === "multi" ? [Motor.NS] : [];
    if (resp && resp.estado === "naosei" && tipo !== "multi") escolhida = Motor.NS;
    const her = cod === "M6.P01" && partidaP01 ? partidaP01 : resp ? null : heranca(cod);
    partidaP01 = null;
    if (her && her.opcoes) marcadas = her.opcoes.slice();
    const neg = S.R[Motor.NEGOCIO];
    const faixaNeg = etapaDe(cod) === 2 && cod !== Motor.NEGOCIO && neg && neg.estado === "opcao"
      ? `<div class="negocio-atual"><span>Seu negócio: <b>${esc(neg.opcao)}</b></span>${neg.herdado ? `<span class="selo">Veio da Etapa ${esc(neg.herdado)}</span>` : ""}<button class="btn-alt" id="trocar">Trocar</button></div>` : "";
    const n = posicao(cod);

    const p = el(`
      <div class="pag">
        ${heroi({ compacta: true, kicker: `Pergunta ${n} de ${TOTAL}`, kickerClasse: "passo", pct: Math.round((n - 1) / TOTAL * 100) })}
        <main class="corpo">
          <div class="cartao-q pergunta" data-cod="${esc(cod)}">
            ${botaoVoltar()}
            ${cartaoSobre()}
            ${faixaNeg}
            ${cartaoPulou()}
            <h2 class="q" tabindex="-1">${esc(q.pergunta)}</h2>
            ${verDica(q)}
            ${cod === "M6.P08" && Motor.temCartao(S.R) ? `<p class="mini-info" id="nota-cartao">Se você aceita cartão, responda pensando no cartão. Pix e dinheiro entram na hora.</p>` : ""}
            ${her ? `<div class="herdado"><span class="selo">Veio da Etapa ${her.modulo}</span><span>Confira e ajuste se quiser.</span>${her.nota ? `<p class="mini-info">${esc(her.nota)}</p>` : ""}</div>` : ""}
            <div class="entrada" id="ent"></div>
            ${Motor.temNaoSei(q) || cod === "M6.P01" ? `<div class="alt">${Motor.temNaoSei(q) ? `<button class="btn-alt" type="button" id="ns">Não sei</button>` : ""}${cod === "M6.P01" ? `<button class="btn-alt" type="button" id="sem-compras-btn">${SEM_COMPRAS}</button>` : ""}</div>` : ""}
            <div id="retorno" aria-live="polite"></div>
            <div id="ajudans"></div>
            <div class="pe-acoes" id="pe">
              <div class="erro" id="erro" role="alert" hidden></div>
              <div class="acoes" id="acoes"><button class="btn btn-primario seta" type="button" id="ok">Continuar</button></div>
            </div>
            ${blocoEducativo(educativoDe(cod))}
          </div>
        </main>
      </div>`);
    ligarCopiar(p);
    ligar(p);
    ligarTrocar(p);

    p.querySelector("#v").onclick = () => {
      S.hist.pop();
      const ant = S.hist.pop();
      salvar();
      if (ant) ir(telaPergunta, ant); else ir(telaCapa);
    };

    const tr = p.querySelector("#trocar");
    if (tr) tr.onclick = () => ir(telaPergunta, Motor.NEGOCIO);
    const ent = p.querySelector("#ent");
    /* escolha única: aria-pressed diz ao leitor de tela qual está marcada */
    const marcar = (b) => { ent.querySelectorAll(".opcao").forEach((x) => { x.classList.toggle("sel", x === b); x.setAttribute("aria-pressed", String(x === b)); }); };
    let det = null;
    if (tipo === "escolha" || tipo === "simnao_texto") {
      ent.classList.add("opcoes");
      q.opcoesLista.forEach((op) => {
        const desc = q.descricoes && q.descricoes[op];
        const b = el(`<button type="button" class="opcao ${escolhida === op ? "sel" : ""}" aria-pressed="${escolhida === op}"><span class="radio" aria-hidden="true"></span><span class="op-txt"><b>${esc(op)}</b>${desc ? `<small class="op-desc">${esc(desc)}</small>` : ""}</span></button>`);
        b.onclick = () => { escolhida = op; marcar(b); ajudaNS(op === Motor.NS); aoVivo(); };
        ent.appendChild(b);
      });
      if (tipo === "simnao_texto") ent.appendChild(el(`<textarea class="campo" id="detalhe" rows="3"${q.exemplo ? ` placeholder="${esc(q.exemplo)}"` : ""}>${esc(resp && resp.detalhe || "")}</textarea>`));
    } else if (tipo === "multi") {
      ent.classList.add("opcoes", "multi");
      q.opcoesLista.forEach((op) => {
        const b = el(`<button type="button" class="opcao ${marcadas.includes(op) ? "sel" : ""}" aria-pressed="${marcadas.includes(op)}"><span class="radio" aria-hidden="true"></span><span class="op-txt"><b>${esc(op)}</b></span></button>`);
        b.onclick = () => {
          marcadas = marcadas.includes(op) ? marcadas.filter((x) => x !== op) : q.opcoesLista.filter((x) => x === op || marcadas.includes(x));
          b.classList.toggle("sel", marcadas.includes(op)); b.setAttribute("aria-pressed", String(marcadas.includes(op)));
          ajudaNS(marcadas.includes(Motor.NS));
          aoVivo();
        };
        ent.appendChild(b);
      });
    } else if (tipo === "formas") {
      /* partes iguais que somam 100 (a última fica com o resto: 33, 33, 34) */
      const partePadrao = (i, n) => (i < n - 1 ? Math.floor(100 / n) : 100 - Math.floor(100 / n) * (n - 1));
      /* uma caixa por forma: taxa (%), em quantos dias cai e parte das vendas (%); Pix e dinheiro já vêm com 0 */
      const fs = (S.R["M6.P04"] && S.R["M6.P04"].opcoes) || [];
      const ant = resp && Array.isArray(resp.valor) ? resp.valor : her && her.formas ? her.formas : [];
      const varias = fs.length > 1;
      fs.forEach((f) => {
        const x = ant.find((y) => y.forma === f) || {}, cartao = Motor.ehCartao(f);
        const pad = (v, d) => (v !== undefined && String(v).trim() !== "" ? String(v).replace(".", ",") : d);
        ent.appendChild(el(`<fieldset class="forma" data-forma="${esc(f)}"><legend>${esc(f)}</legend>
          <label class="linha"><span class="lbl">Taxa${cartao ? "" : " (se tiver)"}</span><input class="campo taxa" inputmode="decimal" placeholder="Ex.: 3,5" value="${esc(pad(x.taxa, cartao ? "" : "0"))}"><span class="unid">%</span></label>
          <label class="linha"><span class="lbl">O dinheiro cai em</span><input class="campo prazo" inputmode="numeric" placeholder="Ex.: 30" value="${esc(pad(x.prazo, cartao ? "" : "0"))}"><span class="unid">dias</span></label>
          ${varias ? `<label class="linha"><span class="lbl">Parte das vendas</span><input class="campo parte" inputmode="decimal" placeholder="Ex.: 50" value="${esc(pad(x.parte, String(partePadrao(fs.indexOf(f), fs.length))))}"><span class="unid">%</span></label>` : ""}
        </fieldset>`));
      });
      ent.appendChild(el(`<p class="mini-info">Cai na hora? Coloque 0 dias.${varias ? " As partes precisam somar 100%." : ""}</p>`));
    } else if (tipo === "sazonal") {
      const ant = resp && resp.estado === "opcao" ? resp : her && her.sz ? her.sz : null;
      escolhida = ant ? ant.opcao : null;
      const meses = (cls, sel) => `<div class="meses ${cls}">${Motor.MESES.map((n, i) => `<button type="button" class="mes ${sel.includes(i + 1) ? "sel" : ""}" data-m="${i + 1}" aria-pressed="${sel.includes(i + 1)}">${n.slice(0, 3)}</button>`).join("")}</div>`;
      ent.classList.add("opcoes");
      q.opcoesLista.forEach((op) => {
        const b = el(`<button type="button" class="opcao ${escolhida === op ? "sel" : ""}" aria-pressed="${escolhida === op}"><span class="radio" aria-hidden="true"></span><span class="op-txt"><b>${esc(op)}</b></span></button>`);
        b.onclick = () => { escolhida = op; marcar(b); det.hidden = op !== Motor.SZ_SIM; aoVivo(); };
        ent.appendChild(b);
      });
      det = el(`<div class="saz-det"${escolhida === Motor.SZ_SIM ? "" : " hidden"}>
        <p class="lbl-m">Meses mais fortes</p>${meses("fortes", ant && ant.fortes || [])}
        <label class="linha"><span class="lbl">Nesses meses vende</span><input class="campo" id="sz-mais" inputmode="numeric" placeholder="Ex.: 50" value="${ant && ant.maisPct ? ant.maisPct : ""}"><span class="unid">% a mais</span></label>
        <p class="lbl-m">Meses mais fracos</p>${meses("fracos", ant && ant.fracos || [])}
        <label class="linha"><span class="lbl">Nesses meses vende</span><input class="campo" id="sz-menos" inputmode="numeric" placeholder="Ex.: 30" value="${ant && ant.menosPct ? ant.menosPct : ""}"><span class="unid">% a menos</span></label></div>`);
      det.querySelectorAll(".mes").forEach((b) => (b.onclick = () => {
        const outro = det.querySelector(b.closest(".fortes") ? ".fracos" : ".fortes").querySelector(`[data-m="${b.dataset.m}"]`);
        b.classList.toggle("sel"); b.setAttribute("aria-pressed", b.classList.contains("sel"));
        if (b.classList.contains("sel")) { outro.classList.remove("sel"); outro.setAttribute("aria-pressed", "false"); }   // um mês não é forte e fraco ao mesmo tempo
        aoVivo();
      }));
      ent.after(det);
    } else if (tipo === "parcelas") {
      const forma = Motor.valor(S.R, "M6.P03"), comEntrada = forma === "Parte à vista e parte parcelado";
      ent.appendChild(el(`<div class="parcelas">
        ${comEntrada ? `<label class="linha"><span class="lbl">Entrada (paga agora)</span><span class="unid">R$</span><input class="campo" id="p-entrada" inputmode="decimal" placeholder="Ex.: 1.000,00" value="${resp && resp.entrada ? numero(resp.entrada) : ""}"></label>` : ""}
        <label class="linha"><span class="lbl">Quantas parcelas por mês</span><input class="campo" id="p-n" inputmode="numeric" placeholder="Ex.: 4" value="${resp && resp.parcelas ? resp.parcelas : ""}"></label>
        <p class="como" id="como-parcela"></p></div>`));
      const total = Motor.num(Motor.valor(S.R, "M6.P02")) || 0;
      const atualizar = () => {
        const e = comEntrada ? Motor.num(p.querySelector("#p-entrada").value) || 0 : 0, n = parseInt(p.querySelector("#p-n").value, 10);
        const t = p.querySelector("#como-parcela");
        if (!(n > 0) || e < 0 || e >= total) { t.innerHTML = `<b>Como calculamos:</b> ${comEntrada ? "(compra − entrada) ÷ parcelas" : "compra ÷ parcelas"}. Preencha para ver o valor de cada parcela.`; return; }
        t.innerHTML = `<b>Como calculamos:</b> ${comEntrada ? `(${brl(total)} da compra − ${brl(e)} de entrada)` : brl(total)} ÷ ${n} ${n === 1 ? "parcela" : "parcelas"} = ${brl(Motor.cent((total - e) / n))} por mês.`;
      };
      ent.querySelectorAll("input").forEach((x) => x.addEventListener("input", atualizar));
      setTimeout(atualizar);
    } else {
      const v = resp && resp.estado === "valor" ? resp.valor : her ? her.valor : "";
      ent.appendChild(el(tipo === "numero"
        ? `<div class="linha"><span class="unid">R$</span><input class="campo" inputmode="decimal" placeholder="${esc(q.exemplo || "0,00")}" value="${esc(v)}"></div>`
        : `<textarea class="campo" rows="3"${q.exemplo ? ` placeholder="${esc(q.exemplo)}"` : ""}>${esc(v)}</textarea>`));
    }
    /* tocar "Não sei" (opção) já mostra como descobrir; nada muda na resposta salva */
    let nsTocado = false;
    function ajudaNS(mostrar) {
      const a = p.querySelector("#ajudans");
      nsTocado = mostrar;
      if (mostrar) { p.querySelector("#erro").hidden = true; p.querySelector("#retorno").innerHTML = ""; }
      a.innerHTML = mostrar ? caixaComo(q, cod === "M6.P01" ? partidaM5() : "") : "";
      if (!mostrar) return;
      ligarCopiar(a);
      const usar = a.querySelector("#usar-m5");
      if (usar) usar.onclick = () => {
        const c = ent.querySelector("textarea"); c.value = materiaisM5().join(", ");
        ajudaNS(false);
        if (!p.querySelector(".herdado")) ent.before(el(`<div class="herdado"><span class="selo">Veio da Etapa 5</span><span>Apague o que não precisa comprar e acrescente o que faltar.</span></div>`));
        c.focus();
        aoVivo();
      };
      a.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
    if (escolhida === Motor.NS || marcadas.includes(Motor.NS)) ajudaNS(true);
    /* "Não sei": só mostra como descobrir; nada é gravado e o Continuar não anda sem resposta */
    const ns = p.querySelector("#ns");
    if (ns) ns.onclick = () => ajudaNS(true);
    const sc = p.querySelector("#sem-compras-btn");
    if (sc) sc.onclick = () => { vistoKey = null; responder({ estado: "valor", valor: SEM_COMPRAS, semCompras: true }); };
    const her0 = heranca(cod);       // resposta de outro módulo, para avisar quando o valor novo for diferente

    /* lê a resposta da tela, sem gravar: { r } ou { erro } */
    function ler() {
      if (tipo === "formas") {
        const lista = [...ent.querySelectorAll(".forma")].map((f) => ({ forma: f.dataset.forma, taxa: f.querySelector(".taxa").value.trim(), prazo: f.querySelector(".prazo").value.trim(),
          ...(f.querySelector(".parte") ? { parte: f.querySelector(".parte").value.trim() } : { parte: "100" }) }));
        for (const x of lista) {
          if (x.taxa === "" || x.prazo === "") return { erro: `Preencha a taxa e em quantos dias cai o dinheiro de “${x.forma}”. Não sabe? Veja no aplicativo da maquininha ou do banco (sem taxa: 0).` };
          const t = Motor.num(x.taxa), d = Number(x.prazo), pt = Motor.num(x.parte);
          if (isNaN(t) || t < 0 || t >= 100) return { erro: `Taxa de “${x.forma}”: digite um número de 0 a 99. Ex.: 3,5` };
          if (!/^\d+$/.test(x.prazo) || d > 365) return { erro: `Prazo de “${x.forma}”: digite os dias, só números. Ex.: 30 (na hora: 0)` };
          if (isNaN(pt) || pt < 0) return { erro: `Parte das vendas de “${x.forma}”: digite um número. Ex.: 50` };
        }
        const soma = lista.reduce((a, x) => a + Motor.num(x.parte), 0);
        if (Math.abs(soma - 100) > 0.5) return { erro: `As partes das vendas somam ${String(Math.round(soma * 10) / 10).replace(".", ",")}%. Ajuste para somar 100%.` };
        const r = { estado: "valor", valor: lista };
        if (her && her.formas && JSON.stringify(lista) === JSON.stringify(her.formas.map((x) => ({ forma: x.forma, taxa: x.taxa, prazo: x.prazo, parte: String(x.parte || "100") })))) r.herdado = her.modulo;
        return { r };
      }
      if (tipo === "sazonal") {
        if (!escolhida) return { erro: MSG_ESCOLHA };
        const r = { estado: "opcao", opcao: escolhida };
        if (escolhida === Motor.SZ_SIM) {
          const sel = (c) => [...p.querySelectorAll(`.saz-det .${c} .mes.sel`)].map((b) => +b.dataset.m);
          const mais = p.querySelector("#sz-mais").value.trim(), menos = p.querySelector("#sz-menos").value.trim();
          Object.assign(r, { fortes: sel("fortes"), fracos: sel("fracos"), maisPct: mais ? Number(mais) : 0, menosPct: menos ? Number(menos) : 0 });
          if (!r.fortes.length && !r.fracos.length) return { erro: "Toque nos meses mais fortes ou mais fracos." };
          if ((mais && !/^\d+$/.test(mais)) || (menos && !/^\d+$/.test(menos)) || r.menosPct > 100) return { erro: "Digite só números inteiros. Ex.: 50 (a menos: até 100)" };
          if ((r.fortes.length && !r.maisPct) || (r.fracos.length && !r.menosPct)) return { erro: "Diga quanto a mais ou a menos você vende nesses meses. Ex.: 50" };
        }
        if (her && her.sz && JSON.stringify(r) === JSON.stringify(her.sz)) r.herdado = her.modulo;
        return { r };
      }
      if (tipo === "parcelas") {
        const forma = Motor.valor(S.R, "M6.P03"), comEntrada = forma === "Parte à vista e parte parcelado";
        const total = Motor.num(Motor.valor(S.R, "M6.P02")) || 0;
        const eTxt = comEntrada ? p.querySelector("#p-entrada").value.trim() : "", nTxt = p.querySelector("#p-n").value.trim();
        const e = comEntrada ? Motor.num(eTxt) : 0, n = Number(nTxt);
        if ((comEntrada && !eTxt) || !nTxt) return { erro: MSG_RESPONDA };
        if (comEntrada && (isNaN(e) || e < 0)) return { erro: isNaN(e) ? MSG_NUMERO : MSG_NEGATIVO };
        if (comEntrada && e >= total) return { erro: `A entrada precisa ser menor que o valor da compra (${brl(total)}).` };
        if (!/^\d+$/.test(nTxt) || n < 1 || n > MAX_PARCELAS) return { erro: `Digite o número de parcelas, de 1 a ${MAX_PARCELAS}. Ex.: 4` };
        const parcela = Motor.cent((total - e) / n);
        return { r: { estado: "valor", entrada: e, parcelas: n,
          valor: (comEntrada ? `Entrada de ${brl(e)} e ` : "") + `${n} ${n === 1 ? "parcela" : "parcelas"} de ${brl(parcela)} por mês` } };
      }
      if (tipo === "escolha" || tipo === "simnao_texto") {
        if (!escolhida) return { erro: MSG_ESCOLHA };
        if (escolhida === Motor.NS) return { erro: MSG_ESCOLHA_NS };
        const r0 = { estado: "opcao", opcao: escolhida };
        if (tipo === "simnao_texto" && escolhida === "Sim") r0.detalhe = p.querySelector("#detalhe").value.trim();
        return { r: r0 };
      }
      if (tipo === "multi") {
        if (!marcadas.length || (marcadas.length === 1 && marcadas[0] === Motor.NS)) return { erro: MSG_MARQUE };
        const r1 = { estado: "multi", opcoes: marcadas.slice() };
        if (her && her.opcoes && JSON.stringify(her.opcoes) === JSON.stringify(r1.opcoes)) r1.herdado = her.modulo;
        return { r: r1 };
      }
      const r2 = Motor.envio(q, ent.querySelector("input,textarea").value);
      if (r2.estado === "vazia") return { erro: nsTocado ? MSG_ESCREVA : MSG_ESCREVA_SIMPLES };
      if (r2.estado === "invalida") return { erro: MSG_NUMERO };
      if (r2.estado === "negativa") return { erro: MSG_NEGATIVO };
      if (her0 && r2.estado === "valor" && r2.valor === String(her0.valor)) r2.herdado = her0.modulo;
      /* "nada, por enquanto." = sem compras agora: não vira item da lista de prioridades */
      if (cod === "M6.P01" && r2.estado === "valor" && Motor.semCompras(r2.valor)) r2.semCompras = true;
      return { r: r2, campo: true };
    }

    /* ---- retorno ao vivo: escolha = no toque; campo = ao sair dele ou 700 ms sem digitar ---- */
    let vistoKey = null, vistoEm = 0, espera = null;
    const Rcom = (r) => Object.assign({}, S.R, { [cod]: r });
    function aoVivo() {
      clearTimeout(espera);
      const x = ler(), box = p.querySelector("#retorno"), e = p.querySelector("#erro");
      if (!e.hidden && !e.classList.contains("aviso")) e.hidden = true;
      if (!x.r) { box.innerHTML = ""; vistoKey = null; nomeBotao(null); return; }
      const regras = Motor.regrasPara(M, cod, x.r);
      const parado = !Motor.valido(x.r) || regras.some(Motor.retorna);
      box.innerHTML = htmlRetorno(regras, x.r, parado);
      ligarCopiar(box);
      vistoKey = JSON.stringify(x.r); vistoEm = Date.now();
      nomeBotao(parado ? null : x.r);
    }
    const aoVivoDepois = () => { clearTimeout(espera); espera = setTimeout(aoVivo, 700); };
    p.addEventListener("input", (ev) => { if (ehCampo(ev.target) && !ev.target.closest(".como-ns")) aoVivoDepois(); });
    p.addEventListener("change", (ev) => { if (ehCampo(ev.target) && !ev.target.closest(".como-ns")) aoVivo(); });
    /* na última pergunta do caminho o botão diz para onde vai */
    function nomeBotao(r) {
      const ok = p.querySelector("#ok");
      ok.textContent = proxPrevia(cod, r ? Rcom(r) : S.R) === "RESULTADO" ? "Ver meu resumo" : "Continuar";
    }

    function htmlRetorno(regras, r, parado) {
      const atencao = [...new Set(regras.filter(Motor.ehRisco).map((x) => x.alerta).filter((a) => !vazio(a)).map((a) => String(a).trim()))];
      const extra = !parado && r.semCompras ? SEM_COMPRAS_RET : "";
      const corpo = `${parado || vazio(q.resposta) ? "" : `<p class="r-texto r-pergunta">${esc(q.resposta)}</p>`}
        ${extra ? `<p class="r-texto r-sem-compras">${esc(extra)}</p>` : ""}
        ${parado ? "" : retornoApp(cod, Rcom(r))}
        ${regras.map((x) => `
          <div class="regra">
            <p class="r-texto">${esc(x.texto)}</p>
            ${detalhesRegra(x, parado)}
          </div>`).join("")}
        ${atencao.length ? `<div class="bloco b-alerta b-aviso"><b>Fique de olho</b>${atencao.length === 1 ? esc(atencao[0]) : `<ul>${atencao.map((a) => `<li>${esc(a)}</li>`).join("")}</ul>`}</div>` : ""}`;
      return corpo.trim() ? `<div class="retorno${parado ? " parado" : ""}">${corpo}</div>` : "";
    }
    /* o que veio só no toque de Continuar (sem tempo de ler) vai para o cartão da próxima tela, curto */
    function textoSobre(regras, r) {
      const partes = [];
      if (r.semCompras) partes.push(esc(SEM_COMPRAS_RET));
      const app = retornoApp(cod, Rcom(r)).replace(/<p class="como"[\s\S]*$/, "").replace(/<[^>]+>/g, "").trim();
      if (app) partes.push(esc(app));
      /* só o que pesa (regra de risco e o aviso dela); o retorno comum já ficou ao vivo na tela anterior */
      regras.filter(Motor.ehRisco).forEach((x) => { if (!vazio(x.texto)) partes.push(esc(x.texto)); });
      const at = [...new Set(regras.filter(Motor.ehRisco).map((x) => x.alerta).filter((a) => !vazio(a)).map((a) => String(a).trim()))];
      if (at.length) partes.push(`<span class="sobre-alerta"><b>Fique de olho:</b> ${at.map(esc).join(" ")}</span>`);
      return partes.length ? partes.join(" ") : null;
    }

    p.querySelector("#ok").onclick = () => {
      clearTimeout(espera);
      const x = ler();
      if (x.erro) { p.querySelector("#retorno").innerHTML = ""; return erro(x.erro); }
      const r = x.r;
      if (x.campo) {
        /* valor diferente do que veio do outro módulo, ou fora do comum: avisa uma vez (o 2º Continuar com o mesmo valor segue) */
        const dif = her0 && !r.herdado && r.estado === "valor" ? divergencia(cod, her0, r.valor) : null;
        if (dif && avisado !== r.valor) { avisado = r.valor; return erro(dif, true); }
        const av = Motor.avisoValor(cod, r);
        if (av && avisado !== r.valor) { avisado = r.valor; return erro(av, true); }
      }
      responder(r);
    };
    let avisado = null;
    function erro(t, soAviso) { const e = p.querySelector("#erro"); e.textContent = t; e.className = soAviso ? "aviso aviso-valor" : "erro"; e.hidden = false; }

    function responder(r0) {
      p.querySelector("#erro").hidden = true;
      const regras = Motor.regrasPara(M, cod, r0);
      /* resposta vazia/inválida, ou regra cujo encaminhamento é "Retornar à Pxx": fica na pergunta, com o motivo à vista */
      if (!Motor.valido(r0) || regras.some(Motor.retorna)) {
        if (!regras.length) return erro(r0.estado === "invalida" ? MSG_NUMERO : MSG_RESPONDA);
        const box = p.querySelector("#retorno");
        box.innerHTML = htmlRetorno(regras, r0, true);
        erro("Complete a sua resposta (veja acima) para continuar.");
        box.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      const visto = vistoKey === JSON.stringify(r0) && Date.now() - vistoEm > 400;
      if (S.trocando === cod) S.trocando = null;
      S.pulou = [];
      /* formas de pagamento mudaram: taxa/prazo/parte de cada forma são perguntados de novo */
      if (cod === "M6.P04" && S.R[Motor.P_FORMAS] && Array.isArray(S.R[Motor.P_FORMAS].valor)
        && S.R[Motor.P_FORMAS].valor.map((x) => x.forma).join("|") !== (r0.opcoes || []).join("|")) delete S.R[Motor.P_FORMAS];
      S.R[cod] = r0;
      S.fluxo = null; S.cen = null;      // a projeção é refeita com as novas respostas
      limparInvisiveis();
      salvar();
      const prox = proxTela(cod);
      if (prox === "RESULTADO") { sobreAnterior = null; S.hist.push("RESULTADO"); salvar(); ir(telaResultado); return; }
      sobreAnterior = visto ? null : textoSobre(Motor.regrasAgora(M, S.R, cod), r0);
      ir(telaPergunta, prox);
    }
    /* resposta já dada (ou trazida de outra etapa): o retorno dela já aparece */
    setTimeout(() => { if (resp || her) aoVivo(); else nomeBotao(null); });
    return p;
  }

  function limparInvisiveis() {
    const R = {};
    if (S.R[Motor.NEGOCIO]) R[Motor.NEGOCIO] = S.R[Motor.NEGOCIO];   // o tipo de negócio vale para o módulo todo
    /* respostas que vieram de outro módulo (sem tela) contam para as condições das próximas perguntas */
    AUTO.forEach((k) => { if (autoHerdada(k, S.R)) R[k] = S.R[k]; });
    let cod = proxima(R, null);
    const vis = new Set();
    while (cod !== "RESULTADO") {
      vis.add(cod);
      if (S.R[cod] === undefined) break;
      R[cod] = S.R[cod];
      cod = proxima(R, cod);
    }
    const fica = (k) => vis.has(k) || k === Motor.NEGOCIO || k === "M6.P08" || (autoHerdada(k, S.R) && Motor.avaliar(S.R, M.porCodigo[k].condicao) === true);
    Object.keys(S.R).forEach((k) => { if (!fica(k)) delete S.R[k]; });
  }

  /* ================= resultado: instrumentos da aba 5 ================= */
  const I = (c) => M.instr[c] || {};
  function cabInstr(ins) {
    return `<div class="secao-titulo">${esc(ins.nome)}</div>
      <p class="ajuda">${esc(ins.objetivo)}</p>`;
  }
  const regraInstr = (ins) => `<p class="mini-info">${esc(ins.regra)}</p>`;
  /* o limite de cada instrumento vira nota curta (o único bloco de atenção da tela é o #atencao) */
  const limiteInstr = (ins) => vazio(ins.limite) ? "" : `<p class="mini-info">${esc(ins.limite)}</p>`;
  /* "Como calculamos: …" embaixo de cada número calculado */
  const como = (t, id) => `<p class="como"${id ? ` id="${id}"` : ""}><b>Como calculamos:</b> ${esc(t)}</p>`;

  function blocoI01() {
    const ins = I("M6.I01"), inv = Motor.investimento(S.R);
    const temValor = inv.valor !== null;
    const naoSeiP02 = D.regras.find((r) => r.pergunta === "M6.P02" && Motor.casa(r.condicao, { estado: "naosei" })) || {};
    return `${cabInstr(ins)}
      <div class="res-num">
        <div class="lbl">${esc(ins.mostra)}</div>
        <div class="val" id="i01-val">${temValor ? brl(inv.valor) : "—"}</div>
        <div class="sub">${temValor
          ? inv.partes.map((x) => `${esc(M.porCodigo[x.codigo].pergunta)} ${brl(x.valor)}`).join(" · ")
            + (inv.forma && inv.forma !== Motor.NS ? ` · ${esc(inv.forma)}` : "")
            + (S.R[Motor.P_PARCELAS] ? ` · ${esc(S.R[Motor.P_PARCELAS].valor)}` : "")
          : ehAindaNaoSei(S.R) ? "Falta descobrir o que você vai precisar comprar." : esc(naoSeiP02.texto)}</div>
      </div>
      ${como(inv.semCompras ? "você disse que não tem compras a fazer agora, então o valor para começar é zero."
        : !temValor && ehAindaNaoSei(S.R) ? "ainda não dá para calcular, porque falta descobrir o que você vai precisar comprar."
        : temValor ? `somamos os valores que você informou para começar (${inv.partes.map((x) => brl(x.valor)).join(" + ")}).`
        : "ainda não dá para calcular, porque o valor das compras ficou em “Não sei”.", "como-i01")}
      ${limiteInstr(ins)}`;
  }
  function avisoM1(valor) {
    const t = tetoM1();
    if (!t || t.teto === null || valor === null || !(valor > t.teto)) return "";
    return `<li id="aviso-m1"><span class="selo">Veio da Etapa 1</span> Na Etapa 1 você disse que pode usar
      “${esc(t.texto)}” no negócio sem faltar para as contas da casa. Aqui, o que você precisa para começar soma ${brl(valor)}.
      Confira os valores, veja o que pode ficar para depois ou como juntar a diferença antes de comprar.</li>`;
  }
  /* um só bloco de atenção no resultado: Módulo 1, semanas no vermelho, cenário e alertas das respostas, sem repetição */
  function blocoAtencao() {
    const inv = Motor.investimento(S.R), F = fluxo(), P = Motor.projetar(F), ins4 = I("M6.I04"), ins5 = I("M6.I05");
    const itens = [], vistos = new Set();
    const add = (html, txt) => { const k = String(txt).trim(); if (!k || vistos.has(k)) return; vistos.add(k); itens.push(html); };
    const m1 = avisoM1(inv.valor); if (m1) add(m1, "m1");
    const neg = P.filter((x) => x.alerta).map((x) => x.semana);
    if (neg.length) add(`<li id="atencao-fluxo">Vai sair mais dinheiro do que você terá em caixa na semana ${neg.join(", ")} da tabela de 13 semanas. Planeje como cobrir essa falta antes de começar.</li>`, "fluxo");
    cenario();
    if (Motor.cenario(S.cen.ini, S.cen.ent, S.cen.sai).alerta) add(`<li id="atencao-cen">No simulador de cenários, as saídas passam do que entra mais o dinheiro em caixa.</li>`, "cen");
    const fr = mesesFracos(F);
    if (fr.length) add(`<li id="atencao-saz">As vendas caem em ${listaMeses(fr)}: o caixa fica mais apertado.</li>`, "saz");
    const r31 = D.regras.find((r) => r.codigo === "M6.R31");
    if (r31 && (F.formas || []).some((f) => f.dias > 30)) add(`<li>${esc(r31.alerta)}</li>`, r31.alerta);
    const m5 = dadosM5();
    if (m5 && m5.mensal > 0) {
      const aqui = Motor.cent((F.gastosMes || 0) + (F.perdasMes || 0) + (F.retiradaMes || 0));
      if (Math.abs(aqui - m5.mensal) >= 0.005) add(`<li id="atencao-m5"><span class="selo">Veio da Etapa 5</span> Seus gastos do mês aqui (${brl(aqui)}) estão diferentes dos da Etapa 5 (${brl(m5.mensal)}). Confira em “Ver o caixa das 13 semanas”.</li>`, "m5");
    }
    Motor.alertas(Motor.regrasTodas(M, S.R)).forEach((a) => add(`<li>${esc(a)}</li>`, a));
    return itens.length ? `<div class="bloco b-alerta b-aviso"><b>Atenção, pelas suas respostas</b><ul>${itens.join("")}</ul></div>` : "";
  }

  function blocoI02() {
    const ins = I("M6.I02"), itens = Motor.itens(S.R, S.fora), cats = Motor.categorias(M);
    const naoSeiP01 = D.regras.find((r) => r.pergunta === "M6.P01" && Motor.casa(r.condicao, { estado: "naosei" })) || {};
    /* "Ainda não sei o que vou precisar comprar": entra no resumo como algo que falta descobrir, com o caminho para descobrir */
    const falta = ehAindaNaoSei(S.R) ? `<div class="bloco b-lacuna" id="falta-descobrir"><b>Falta descobrir</b>
      <p>O que você vai precisar comprar para começar. Com a lista em mãos, volte aqui para estimar o valor e ver o que é prioridade.</p></div>
      ${blocoComoDescobrir(false)}` : "";
    const fora = (S.fora || []).length ? `<p class="mini-info" id="fora">Tirados da lista: ${S.fora.map(esc).join(", ")}. <button class="btn-alt" id="repor">Pôr de volta</button></p>` : "";
    /* a lista só abre quando há itens de compra de verdade */
    if (!itens.length) {
      const nada = Motor.investimento(S.R).semCompras || (S.fora || []).length;
      return `<div id="sem-compras">${nada ? `<p class="mini-info">Sem compras a fazer agora: a lista de prioridade de compras fica de fora.</p>${fora}`
        : falta ? `${cabInstr(ins)}${falta}` : valor1NS() ? `${cabInstr(ins)}<div class="bloco b-lacuna">${esc(naoSeiP01.lacuna)}</div>` : ""}</div>`;
    }
    return `${cabInstr(ins)}
      ${falta}
      <div class="lista" id="prio">${itens.map((it, i) => `
        <div class="item"><div class="item-topo"><b class="nome">${esc(it)}</b><button class="btn-alt tirar" data-i="${i}" aria-label="Tirar ${esc(it)} da lista">Tirar da lista</button></div>
          <div class="opcoes mini">${cats.map((c) => `<button type="button" class="opcao ${S.prio[it] === c ? "sel" : ""}" aria-pressed="${S.prio[it] === c}" data-i="${i}" data-c="${esc(c)}">${esc(c)}</button>`).join("")}</div>
        </div>`).join("")}</div>
      ${fora}
      ${regraInstr(ins)}${limiteInstr(ins)}`;
  }

  const valor1NS = () => Motor.valor(S.R, "M6.P01") === Motor.NS;
  function fluxo() {
    /* fluxo de outra versão (05/11: venda do mês entrava uma vez só; 16/11: entram parcelas, cartão, perdas e custo de cada venda):
       refeito com as respostas; da versão 2 ficam os valores do mês que a pessoa mudou na tela */
    if (!S.fluxo || S.fluxo.v !== Motor.FLUXO_V) {
      const velho = S.fluxo;
      const m5 = dadosM5();
      S.fluxo = Motor.fluxoInicial(S.R, m5 && Object.assign({}, m5, { entregaVenda: m5.entrega ? m5.entrega.porVenda : 0 }));
      S.fluxo.entrega = m5 && m5.entrega;
      if (velho && velho.v === 2) { ["saldoInicial", "vendasMes", "gastosMes"].forEach((k) => { if (isFinite(velho[k])) S.fluxo[k] = velho[k]; }); Motor.montarSemanas(S.fluxo); }
      S.cen = null; salvar();
    }
    return S.fluxo;
  }
  /* linhas do mês que podem vir do Módulo 5: selo de origem ou aviso de que mudou */
  function origemM5(k, m5k) {
    const m5 = Object.assign({}, dadosM5());
    m5.entregaVenda = m5.entrega ? m5.entrega.porVenda : 0;
    if (!m5 || !(m5[m5k] > 0)) return "";
    const F = S.fluxo;
    return Math.abs((F[k] || 0) - m5[m5k]) < 0.005 ? `<span class="selo">Veio da Etapa 5</span>`
      : `<span class="mini-info dif-m5">Na Etapa 5: ${brl(m5[m5k])}</span>`;
  }
  const CAMPOS_MES = [
    ["f-ini", "saldoInicial", "Dinheiro em caixa hoje", null],
    ["f-vendas", "vendasMes", "Vendas por mês", null],
    ["f-gastos", "gastosMes", "Gastos fixos do mês", "fixos"],
    ["f-perdas", "perdasMes", "Perdas no mês", "perdas"],
    ["f-retirada", "retiradaMes", "O que você separa para você no mês", "retirada"],
    ["f-custo", "custoVenda", "Custo de cada venda", "custoVenda"],
    ["f-entrega", "entregaVenda", "Entrega por venda", "entregaVenda"],
    ["f-preco", "precoVenda", "Preço de cada venda", "preco"] ];
  /* gastos do mês aqui x Módulo 5 (fixos + perdas + o que separa para você) */
  function conferenciaM5() {
    const m5 = dadosM5(), F = fluxo();
    if (!m5 || !(m5.mensal > 0)) return "";
    const aqui = Motor.cent((F.gastosMes || 0) + (F.perdasMes || 0) + (F.retiradaMes || 0));
    const igual = Math.abs(aqui - m5.mensal) < 0.005;
    return `<div class="${igual ? "cartao" : "bloco b-lacuna"} confere-m5" id="confere-m5"><b>Gastos do mês: Etapa 5 × aqui</b>
      <p>Na Etapa 5: ${brl(m5.fixos)} fixos + ${brl(m5.perdas)} de perdas + ${brl(m5.retirada)} para você = <b>${brl(m5.mensal)}</b> por mês.</p>
      <p>Aqui: ${brl(F.gastosMes || 0)} + ${brl(F.perdasMes || 0)} + ${brl(F.retiradaMes || 0)} = <b>${brl(aqui)}</b> por mês.${igual ? " Os dois batem." : " Estão diferentes: confira qual está certo."}</p>
      <p class="mini-info">O custo de cada venda fica fora dessa soma, porque muda com o número de vendas.</p></div>`;
  }
  /* premissas da projeção, em linguagem simples, com a conta de cada uma */
  function premissas(F) {
    const FS = "× 12 ÷ 52";
    const nv = F.precoVenda > 0 ? F.nVendasMes : 0;
    const li = [];
    const pc = (n) => String(Math.round(n * 100) / 100).replace(".", ",");
    li.push(`<li id="pr-vendas">Vendas: ${brl(F.vendasMes || 0)} por mês ${FS} = ${brl(F.vendasSemana || 0)} por semana.</li>`);
    if (F.saz) {
      const fort = F.fatores.filter((x) => x.fator > 1), frac = F.fatores.filter((x) => x.fator < 1);
      li.push(`<li id="pr-saz">Época do ano: a semana 1 começa hoje (${dataBR(F.inicio)}). ${fort.length ? `Semanas ${fort.map((x) => F.fatores.indexOf(x) + 1).join(", ")} caem em mês forte: vendas × ${pc(fort[0].fator)} (+${F.saz.maisPct}%) = ${brl(Motor.cent(F.vendasSemana * fort[0].fator))} por semana. ` : ""}${frac.length ? `Semanas ${frac.map((x) => F.fatores.indexOf(x) + 1).join(", ")} caem em mês fraco: vendas × ${pc(frac[0].fator)} (−${F.saz.menosPct}%) = ${brl(Motor.cent(F.vendasSemana * frac[0].fator))} por semana. ` : ""}${!fort.length && !frac.length ? "nenhum mês forte ou fraco cai nessas 13 semanas." : ""}</li>`);
    }
    (F.formas || []).forEach((f, i) => {
      const nome = f.forma === "Todas as vendas" ? "Todas as vendas" : f.forma;
      const quando = f.sem ? `cai ${f.sem} ${f.sem === 1 ? "semana" : "semanas"} depois${f.dias !== null && f.dias !== undefined ? ` (${f.dias} dias ÷ 7, arredondado para cima)` : f.prazoTxt ? ` (${FRASE_PRAZO[f.prazoTxt]})` : ""}` : "cai na mesma semana";
      li.push(`<li class="pr-forma" id="pr-forma-${i}">${esc(nome)}: ${brl(F.vendasSemana || 0)} por semana${(F.formas.length > 1) ? ` × ${pc(f.parte)}%` : ""}${f.taxa ? ` × (1 − ${pc(f.taxa)}% de taxa)` : ""} = ${brl(Motor.cent((F.vendasSemana || 0) * f.parte / 100 * (1 - f.taxa / 100)))}${F.saz ? " (antes da época do ano)" : ""}; ${quando}.</li>`);
    });
    if (F.aReceberDepois) li.push(`<li id="pr-depois">Vendas das últimas semanas que só caem depois da semana 13: ${brl(F.aReceberDepois)} (fora da tabela).</li>`);
    li.push(`<li id="pr-gastos">Gastos fixos do mês: ${brl(F.gastosMes || 0)} ${FS} = ${brl(F.gastosSemana || 0)} por semana.</li>`);
    if (F.perdasMes) li.push(`<li id="pr-perdas">Perdas: ${brl(F.perdasMes)} por mês ${FS} = ${brl(F.perdasSemana)} por semana.</li>`);
    if (F.retiradaMes) li.push(`<li id="pr-retirada">O que você separa para você: ${brl(F.retiradaMes)} por mês ${FS} = ${brl(F.retiradaSemana)} por semana.</li>`);
    li.push(F.custoVenda && F.precoVenda > 0
      ? `<li id="pr-custo">Custo de cada venda (a taxa já sai das entradas): ${brl(F.custoVenda)} × ${numero(nv).replace(/,00$/, "")} vendas no mês (${brl(F.vendasMes || 0)} ÷ ${brl(F.precoVenda)}) = ${brl(F.variavelMes)} por mês ${FS} = ${brl(F.variavelSemana)} por semana.</li>`
      : `<li id="pr-custo">Custo de cada venda: ${F.custoVenda ? "falta o preço de cada venda para contar quantas vendas são" : "não informado"} (preencha acima).</li>`);
    const en = F.entrega;
    if (F.entregaVenda > 0 && F.precoVenda > 0) {
      const base = en && en.custo && Math.abs(en.porVenda - F.entregaVenda) < 0.005 ? `${en.pct !== null && en.pct !== undefined ? `${pc(en.pct)}% de ${brl(F.precoVenda)} = ` : ""}${brl(en.custo)} por entrega${en.cobra ? ` − ${brl(en.cobra)} que o cliente paga` : ""}${en.a10 !== 10 ? ` × ${en.a10} de cada 10 vendas` : ""} = ` : "";
      li.push(`<li id="pr-entrega">Entregas: ${base}${brl(F.entregaVenda)} por venda × ${numero(nv).replace(/,00$/, "")} vendas no mês = ${brl(F.entregasMes)} por mês × 12 ÷ 52 = ${brl(F.entregasSemana)} por semana.</li>`);
    } else if (en && /^Não/i.test(en.opcao)) li.push(`<li id="pr-entrega">Entregas: sem custo (na Etapa 5 você disse “${esc(en.opcao)}”).</li>`);
    else if (!(F.entregaVenda > 0)) li.push(`<li id="pr-entrega">Custo de entrega não informado (Etapa 5). <a href="/lg2/turma-a/m05/index.html">Trocar na Etapa 5</a> ou preencha “Entrega por venda” acima.</li>`);
    const pl = F.plano || {};
    if (pl.n) {
      li.push(`<li id="pr-invest">Compras para começar: ${brl(pl.total)}. ${pl.entrada ? `Entrada de ${brl(pl.entrada)}` : "Nada de entrada"}${pl.outros ? ` + ${brl(pl.outros)} de outras compras` : ""} na semana 1; ${pl.n} ${pl.n === 1 ? "parcela" : "parcelas"} de ${brl(pl.parcela)} por mês${pl.semanas.length ? `, nas semanas ${pl.semanas.map((x) => x.semana).join(", ")} (1 mês ≈ 4,33 semanas)` : ""}.`
        + (pl.depois.length ? ` Depois da semana 13 ainda ${pl.depois.length === 1 ? "falta 1 parcela" : `faltam ${pl.depois.length} parcelas`} (${brl(pl.depois.reduce((a, x) => a + x.valor, 0))}).` : "") + `</li>`);
    } else li.push(`<li id="pr-invest">O que você precisa para começar (${brl(F.investimento || 0)}) sai na semana 1.</li>`);
    li.push(`<li>Dinheiro em caixa hoje: ${brl(F.saldoInicial || 0)} (é o saldo do começo da semana 1).</li>`);
    return li.join("");
  }
  const dataBR = (iso) => { const [a, m, d] = String(iso).split("-"); return `${d}/${m}/${a}`; };
  /* meses fracos que caem nas 13 semanas */
  function mesesFracos(F) { return [...new Set((F.fatores || []).filter((x) => x.fator < 1).map((x) => x.mes))]; }
  const ind = () => Motor.indicadores({ fluxo: fluxo(), R: S.R });
  /* (b) operação do mês: entradas, saídas fixas e variáveis por linha, lucro do mês */
  function blocoOperacao() {
    const x = ind(), F = fluxo();
    const linhas = (l) => l.map((v) => `<li><span>${esc(v.nome)}</span><b>${brl(v.valor)}</b></li>`).join("");
    return `<div class="secao-titulo">Operação de um mês normal</div>
      <ul class="contas" id="op-linhas">
        <li class="c-ent"><span>Vendas do mês (entradas)</span><b>${brl(x.entradasMes)}</b></li>
        <li class="c-sub">Saídas fixas</li>${linhas(x.fixos) || `<li><span>Nenhuma</span><b>${brl(0)}</b></li>`}
        <li class="c-sub">Saídas que mudam com as vendas</li>${linhas(x.variaveis) || `<li><span>Nenhuma</span><b>${brl(0)}</b></li>`}
        <li class="c-tot" id="op-lucro"><span>${x.lucroMes >= 0 ? "Sobra no mês (lucro)" : "Falta no mês (prejuízo)"}</span><b>${brl(x.lucroMes)}</b></li>
      </ul>
      ${como(`${brl(x.entradasMes)} de vendas − ${brl(x.totalFixos)} de saídas fixas − ${brl(x.totalVariaveis)} de saídas que mudam com as vendas = ${brl(x.lucroMes)} por mês${F.saz ? " (mês normal, sem a época do ano)" : ""}.`, "como-lucro")}`;
  }
  /* (e) retorno do investimento: ROI ao ano e em quantos meses o investimento volta */
  function blocoRetorno() {
    const x = ind(), pc = (n) => String(n).replace(".", ",");
    if (!(x.investimento > 0)) return `<div class="secao-titulo">Retorno do investimento</div><p class="ajuda" id="ret-inv">Sem investimento inicial informado, não há retorno para calcular.</p>`;
    if (!x.sePaga) return `<div class="secao-titulo">Retorno do investimento</div>
      <div class="bloco b-lacuna" id="ret-inv"><b>Retorno</b>Com estes números o investimento não se paga: o mês não deixa sobra (${brl(x.lucroMes)}).</div>
      ${como(`para o investimento voltar, cada mês precisa deixar sobra. Aqui: ${brl(x.lucroMes)} por mês.`, "como-retorno")}`;
    return `<div class="secao-titulo">Retorno do investimento</div>
      <div class="mini-cards" id="ret-inv">
        <div class="cartao"><h3>Retorno ao ano</h3><p><b>${pc(x.roiAno)}%</b></p></div>
        <div class="cartao"><h3>Volta em</h3><p><b>${pc(x.paybackMeses)} meses</b></p></div>
      </div>
      ${como(`retorno ao ano = ${brl(x.lucroMes)} de sobra por mês × 12 ÷ ${brl(x.investimento)} investidos = ${pc(x.roiAno)}%. Volta em = ${brl(x.investimento)} ÷ ${brl(x.lucroMes)} = ${pc(x.paybackMeses)} meses.`, "como-retorno")}`;
  }
  /* menor saldo, saldo final e capital adicional, à vista no resultado */
  function blocoCaixa() {
    const F = fluxo(), r = Motor.resumoCaixa(F), c = Motor.controle(F);
    const falta = r.capital > 0;
    return `<div class="secao-titulo">Seu caixa nas 13 semanas</div>
      <p class="ajuda" id="cx-inicial">Começa com ${brl(c.inicial)} em caixa hoje.</p>
      <div class="mini-cards caixa-resumo">
        <div class="cartao" id="cx-min"><h3>Menor saldo</h3><p><b>${brl(r.min)}</b></p><p class="mini-info">na semana ${r.semanaMin}</p></div>
        <div class="cartao" id="cx-final"><h3>Saldo final</h3><p><b>${brl(r.final)}</b></p><p class="mini-info">na semana 13</p></div>
      </div>
      <div class="res-num" id="cx-capital"><div class="lbl">Dinheiro extra necessário para pagar as contas nos primeiros meses (capital de giro)</div><div class="val">${brl(r.capital)}</div>
        <div class="sub">${falta ? "Dinheiro a mais que você precisa ter no caixa para não ficar no negativo." : "Com essas contas, o caixa não fica negativo."}</div></div>
      ${como(`o saldo mais baixo das 13 semanas é ${brl(r.min)}, na semana ${r.semanaMin}. ${falta ? `Para ele não ficar negativo, faltam ${brl(r.capital)}` : "Ele não fica negativo, então não falta dinheiro"} (capital adicional = saldo mais baixo com o sinal trocado, ou zero).`, "como-capital")}
      ${como(`saldo final = ${brl(c.inicial)} (caixa hoje) + ${brl(c.entradas)} (tudo o que entra) − ${brl(c.saidas)} (tudo o que sai) = ${brl(c.saldo)}.`, "como-final")}
      <details class="premissas" id="premissas" open><summary>O que entrou na conta</summary><ul class="mini-info como-conta" id="como-conta">${premissas(F)}</ul></details>`;
  }
  function blocoI04() {
    const ins = I("M6.I04"), F = fluxo(), P = Motor.projetar(F);
    const p09 = S.R["M6.P09"], p06 = Motor.valor(S.R, "M6.P06");
    return `${cabInstr(ins)}
      ${CAMPOS_MES.map(([id, k, rot, m5k]) => `<div class="linha"><span class="lbl">${esc(rot)}${m5k ? ` ${origemM5(k, m5k)}` : ""}</span><span class="unid">R$</span><input class="campo f-mes" id="${id}" data-k="${k}" inputmode="decimal" value="${numero(F[k] || 0)}"></div>`).join("")}
      ${conferenciaM5()}
      ${como("em cada semana, saldo = saldo da semana anterior + entradas − saídas, começando pelo dinheiro em caixa hoje. Valores do mês viram valor por semana com × 12 ÷ 52 (um ano tem 12 meses e 52 semanas).", "como-i04")}
      <div class="tabela-wrap"><table class="fluxo">
        <thead><tr><th>Sem.</th><th>Entradas</th><th>Saídas</th><th>Saldo</th></tr></thead>
        <tbody>${P.map((s, i) => `<tr class="${s.final < 0 ? "neg" : ""}">
          <td>${s.semana}${F.fatores && F.fatores[i].fator !== 1 ? `<small class="fator">× ${String(F.fatores[i].fator).replace(".", ",")}</small>` : ""}</td>
          <td><input inputmode="decimal" aria-label="Entradas da semana ${s.semana}" data-i="${i}" data-k="entradas" value="${numero(s.entradas)}"></td>
          <td><input inputmode="decimal" aria-label="Saídas da semana ${s.semana}" data-i="${i}" data-k="saidas" value="${numero(s.saidas)}"></td>
          <td class="sf">${brl(s.final)}</td></tr>`).join("")}</tbody>
      </table></div>
      <p class="mini-info">Você pode mudar qualquer semana; mudar um valor do mês refaz a tabela.</p>
      ${p06 && p06 !== Motor.NS ? `<div class="bloco b-proximo"><b>${esc(M.porCodigo["M6.P06"].pergunta)}</b>${esc(p06)}</div>` : ""}
      ${p09 && p09.detalhe ? `<div class="bloco b-proximo"><b>${esc(M.porCodigo["M6.P09"].pergunta)}</b>${esc(p09.detalhe)}</div>` : ""}
      ${P.some((s) => s.alerta) ? `<p class="mini-info">Semanas em que falta dinheiro: ${P.filter((s) => s.alerta).map((s) => s.semana).join(", ")} (veja “Atenção” no alto do resumo).</p>` : ""}`;
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
      ${como(`dinheiro em caixa hoje (${brl(c.inicial)}) + tudo o que entra nas 13 semanas (${brl(c.entradas)}) − tudo o que sai (${brl(c.saidas)}) = ${brl(c.saldo)}.`, "como-i03")}
      ${limiteInstr(ins)}`;
  }
  function cenario() {
    if (!S.cen) { const c = Motor.controle(fluxo()); S.cen = { ini: c.inicial, ent: c.entradas, sai: c.saidas }; salvar(); }
    return S.cen;
  }
  function blocoI05() {
    const ins = I("M6.I05");
    cenario();
    const r = Motor.cenario(S.cen.ini, S.cen.ent, S.cen.sai);
    return `${cabInstr(ins)}
      <div class="linha"><span class="lbl">Saldo inicial</span><span class="unid">R$</span><input class="campo cen" data-k="ini" inputmode="decimal" value="${numero(S.cen.ini)}"></div>
      <div class="linha"><span class="lbl">Entradas previstas</span><span class="unid">R$</span><input class="campo cen" data-k="ent" inputmode="decimal" value="${numero(S.cen.ent)}"></div>
      <div class="linha"><span class="lbl">Saídas previstas</span><span class="unid">R$</span><input class="campo cen" data-k="sai" inputmode="decimal" value="${numero(S.cen.sai)}"></div>
      <div class="res-num ${r.alerta ? "coral" : ""}" id="cen-res"><div class="lbl">Saldo do cenário</div><div class="val">${brl(r.saldo)}</div></div>
      ${como(`${brl(S.cen.ini)} (saldo inicial) + ${brl(S.cen.ent)} (entradas) − ${brl(S.cen.sai)} (saídas) = ${brl(r.saldo)}. Mude os valores para testar outras situações.`, "como-i05")}
      ${r.alerta ? `<p class="mini-info">${esc(ins.limite)}</p>` : ""}`;
  }

  /* ================= "O que entendemos até aqui" (frases montadas por regra, sem IA) ================= */
  const FRASE_TIPO = { "Serviço": "um serviço", "Produto": "um produto que você mesmo faz", "Mercadoria": "mercadoria que você compra pronta para revender" };
  const FRASE_ESTAGIO = { "Ainda está só na minha cabeça": "Você ainda não começou a vender.",
    "Já fiz um pouco para testar ou dar de amostra": "Você está começando: já fez um pouco para testar.",
    "Já vendi algumas vezes": "Você já vende.", "Já vendo sempre": "Você já vende." };
  const FRASE_PRAZO = { "Na hora": "na hora", "Até 7 dias": "em até 7 dias", "8 a 30 dias": "entre 8 e 30 dias", "Mais de 30 dias": "depois de 30 dias" };
  function ideiaHerdada() {
    for (const [mod, cod] of [[1, "M1.P03"], [3, "M3.P01"], [4, "M4.P01"], [8, "M8.P01"]]) { const t = valorTxt(lerOutro(K[mod], cod)); if (t) return t.replace(/[.!\s]+$/, ""); }
    return null;
  }
  /* texto corrido: as frases de cada assunto viram um parágrafo (1 a 3 parágrafos curtos, sem lista) */
  const emParagrafos = (fr, ...cortes) => [0, ...cortes].map((c, i, a) => fr.slice(c, i + 1 < a.length ? a[i + 1] : fr.length).join(" ")).filter(Boolean);
  function frasesEntendemos() {
    const out = [], neg = S.R[Motor.NEGOCIO], tipo = neg && neg.estado === "opcao" ? neg.opcao : null, ideia = ideiaHerdada();
    if (ideia && tipo) out.push(`Você oferece ${FRASE_TIPO[tipo]}: ${ideia}.`);
    else if (ideia) out.push(`Você quer vender: ${ideia}.`);
    else if (tipo) out.push(`Você oferece ${FRASE_TIPO[tipo]}.`);
    const est = FRASE_ESTAGIO[opcaoDe(lerOutro(K[1], "M1.P01"))];
    if (est) out.push(est);
    const c1 = out.length;   // 1º parágrafo: o que oferece e em que ponto está
    const inv = Motor.investimento(S.R), forma = inv.forma && inv.forma !== Motor.NS ? inv.forma.toLowerCase() : null;
    out.push(inv.semCompras ? "Você não tem compras a fazer para começar agora." : inv.valor !== null ? `Para começar, você estima gastar ${brl(inv.valor)}${forma ? `, pagando ${forma}` : ""}.`
      : ehAindaNaoSei(S.R) ? "Você ainda vai descobrir o que precisa comprar para começar: liste o que usa em cada unidade ou atendimento."
      : "Você ainda não sabe quanto vai gastar para começar: vale pesquisar os preços antes.");
    const vendas = numDe("M6.P05"), prazo = FRASE_PRAZO[Motor.valor(S.R, "M6.P08")];
    out.push(vendas !== null ? `Você espera vender cerca de ${brl(vendas)} por mês${prazo ? ` e receber o dinheiro ${prazo}` : ""}.`
      : "Você ainda não estimou quanto vai vender por mês.");
    const c2 = out.length;   // 2º: gasto para começar e vendas; 3º: o caixa nas 13 semanas
    const F = fluxo(), P = Motor.projetar(F), neg1 = P.find((x) => x.final < 0), rc = Motor.resumoCaixa(F);
    const inicio = F.saldoInicial || numDe("M6.P07") !== null ? `Começando com ${brl(F.saldoInicial)} no caixa` : "Sem contar dinheiro guardado";
    out.push(`${inicio}, ${neg1
      ? `o seu dinheiro fica negativo na semana ${neg1.semana}: antes de começar, planeje como cobrir essa falta.`
      : "o seu dinheiro não fica negativo em nenhuma das 13 semanas da projeção."}`);
    if (rc.capital > 0) out.push(`Para atravessar as 13 semanas, você precisa de mais ${brl(rc.capital)} no caixa.`);
    return emParagrafos(out, c1, c2);
  }
  const numDe = (c) => { const v = Motor.valor(S.R, c); return v === undefined || v === Motor.NS || isNaN(Motor.num(v)) ? null : Motor.num(v); };
  function blocoEntendemos() {
    return `<h2>O que entendemos até aqui</h2>${frasesEntendemos().map((f) => `<p>${esc(f).replace(/R\$ /g, () => "R$&nbsp;")}</p>`).join("")}`;
  }
  /* como cada resposta aparece no resumo (com selo quando veio de outro módulo ou do começo deste) */
  function respostaResumo(q) {
    const r = S.R[q.codigo], v = Motor.valor(S.R, q.codigo), det = (r || {}).detalhe;
    if (v === undefined && REPETE_P01.includes(q.codigo) && p01Respondida(S.R) && etapaDe(q.codigo) === 2
        && S.R[Motor.NEGOCIO] && SECAO[q.codigo] === SECAO_NEG[S.R[Motor.NEGOCIO].opcao]) {
      const base = Motor.valor(S.R, ["M6.P11", "M6.P14"].includes(q.codigo) ? "M6.P02" : "M6.P01");
      return `<span class="selo">Respondido no começo</span> ${esc(base === undefined ? "—" : base)}`;
    }
    if (v === undefined && REPETE_P01.includes(q.codigo) && ehAindaNaoSei(S.R) && S.R[Motor.NEGOCIO] && SECAO[q.codigo] === SECAO_NEG[S.R[Motor.NEGOCIO].opcao])
      return `<span class="selo">Falta descobrir</span>`;
    if (v === undefined) return `<span class="mini-info">Não apareceu no seu caminho</span>`;
    if (r && r.aindaNaoSei) return `${esc(AINDA_NAO_SEI)} <span class="selo">Falta descobrir</span>`;
    return (r && r.herdado ? `<span class="selo">Veio da Etapa ${esc(r.herdado)}</span> ` : "") + esc(r && (Array.isArray(r.valor) || r.opcao === Motor.SZ_SIM) ? textoResp(r) : v) + (det ? ` · ${esc(det)}` : "");
  }

  /* resultado: cada "Não sei" leva o seu "Como descobrir" (fechado), com o pedido pronto para a IA */
  function blocoComoFalta() {
    const qs = M.perguntas.filter((q) => { const r = S.R[q.codigo]; return r && q.comoDescobrir
      && (r.estado === "naosei" || (r.estado === "multi" && r.opcoes.includes(Motor.NS))); });
    if (!qs.length) return "";
    return `<details class="resultado-mais" id="como-falta"><summary>Como descobrir o que falta</summary>
      ${qs.map((q) => `<details class="como-mini"><summary>${esc(q.pergunta)}</summary>${caixaComo(q)}</details>`).join("")}
    </details>`;
  }
  /* respostas reaproveitadas de outros módulos (sem tela aqui), com "Trocar" */
  function blocoHerdadas() {
    const l = AUTO.filter((c) => autoHerdada(c, S.R));
    return l.length ? `<details class="resultado-mais herdadas" id="herdadas-res"><summary>Respostas que vieram de outras etapas</summary><ul>${l.map(itemHerdado).join("")}</ul></details>` : "";
  }
  /* Resposta principal antes das listas: o caixa dá ou falta nos primeiros meses e quanto. */
  function conclusaoCaixa() {
    const r = Motor.resumoCaixa(fluxo());
    return `<div class="res-num" id="conclusao-principal"><div class="lbl">${r.capital > 0 ? "Falta dinheiro nos primeiros meses" : "O dinheiro dá para os primeiros meses"}</div><div class="val">${brl(r.capital)}</div><div class="sub">${r.capital > 0 ? `É quanto falta para o caixa não ficar negativo; o menor saldo é ${brl(r.min)} na semana ${r.semanaMin}.` : `Não falta dinheiro extra (R$ 0,00); o menor saldo previsto é ${brl(r.min)} na semana ${r.semanaMin}.`}</div></div>`;
  }
  function telaResultado() {
    const regras = Motor.regrasTodas(M, S.R);
    const lac = Motor.lacunas(regras), enc = Motor.encaminhamentos(regras), ale = Motor.alertas(regras);
    const dicas = Motor.dicasGerais(regras).slice(0, MAX_DICAS), falta = Motor.pendencias(M, S.R);
    const p = el(`
      <div class="pag">
        ${topo("Resultado")}
        ${heroi({ kicker: "Resultado", kickerClasse: "passo", titulo: "Seu resumo" })}
        ${etapas(3, true)}
        <main class="corpo">
          ${botaoVoltar()}
          <section class="concluido">
            <div class="conc-topo"><span class="check" aria-hidden="true"></span><div><h2>Você concluiu a Etapa ${esc(D.modulo.numero)}</h2><p>Seu resumo está logo abaixo.</p></div></div>
          </section>
          <section class="conclusao-caixa" id="conclusao-caixa">${conclusaoCaixa()}</section>
          <section class="entendemos" id="entendemos">${blocoEntendemos()}</section>
          <div class="secao-titulo">Sua próxima tarefa</div>
          ${falta.length ? `<ol class="roteiro" id="proximos">${falta.map((x) => `<li>${esc(x)}</li>`).join("")}</ol>`
            : `<p class="ajuda" id="proximos">Nada ficou em aberto nas suas respostas. Acompanhe a tabela das 13 semanas e atualize os valores quando souber os preços de verdade.</p>`}
          ${blocoComoFalta()}
          <div id="atencao">${blocoAtencao()}</div>
          <h2 class="contas-tit">Suas contas, separadas</h2>
          <div id="i01">${blocoI01()}</div>
          <div id="operacao">${blocoOperacao()}</div>
          <div id="caixa">${blocoCaixa()}</div>
          <div id="retorno-inv">${blocoRetorno()}</div>
          ${blocoHerdadas()}
          <details class="resultado-mais" id="mais-compras"><summary>Sua lista de compras</summary>
            <div id="i02">${blocoI02()}</div>
          </details>
          <details class="resultado-mais" id="mais-caixa"><summary>Ver o caixa das 13 semanas</summary>
            <div id="i04">${blocoI04()}</div>
            <div id="i03">${blocoI03()}</div>
            <div id="i05">${blocoI05()}</div>
          </details>
          <details class="resultado-mais" id="mais-detalhes"><summary>Mais detalhes</summary>
            <p class="ajuda">${esc(D.mapa.entrega)}</p>
            ${lac.length ? `<div class="bloco b-lacuna"><b>O que ainda falta saber</b><ul>${lac.map((l) => `<li>${esc(l)}</li>`).join("")}</ul></div>` : ""}
            ${dicas.length ? `<div class="secao-titulo">Dicas gerais</div><ul class="dicas-gerais" id="dicas">${dicas.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}
            <div class="bloco b-enc"><b>Encaminhamentos, pelas suas respostas</b>${enc.length ? `<ul>${enc.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}<p>${esc(D.mapa.encaminhamentos)}</p></div>
          </details>

          <details class="saiba respostas"><summary>Ver suas respostas</summary>
          ${M.perguntas.map((q) => `<div class="cartao"><h3>${esc(q.pergunta)}</h3><p>${respostaResumo(q)}</p></div>`).join("")}
          </details>

          <div class="aviso">${esc(D.mapa.mensagem_limite)}</div>
          <div class="acoes">
            <button class="btn btn-primario" id="imp">Salvar ou imprimir</button>
            <button class="btn btn-claro" id="rev">Revisar respostas</button>
            <button class="btn btn-linha" id="novo">Começar outra análise</button>
          </div>
          <div class="acoes lg2-proximo"><a class="btn btn-primario" style="text-decoration:none;text-align:center;box-sizing:border-box" href="/lg2/turma-b/m07/index.html">Ir para a Etapa 7</a></div>
          ${rodape()}
        </main>
      </div>`);

    /* relatório do módulo aberto por padrão (a pessoa ainda pode fechar) */
    const abrir = (raiz) => raiz.querySelectorAll("details").forEach((d) => { d.open = true; });
    abrir(p);
    const refazer = (id, f) => { p.querySelector(id).innerHTML = f(); abrir(p.querySelector(id)); ligar(); };
    function ligar() {
      p.querySelectorAll("#prio .opcao").forEach((b) => (b.onclick = () => {
        const it = Motor.itens(S.R, S.fora)[+b.dataset.i]; S.prio[it] = b.dataset.c; salvar(); refazer("#i02", blocoI02);
      }));
      p.querySelectorAll("#prio .tirar").forEach((b) => (b.onclick = () => {
        const it = Motor.itens(S.R, S.fora)[+b.dataset.i]; S.fora = [...(S.fora || []), it]; delete S.prio[it]; salvar(); refazer("#i02", blocoI02);
      }));
      const rp = p.querySelector("#repor");
      if (rp) rp.onclick = () => { S.fora = []; salvar(); refazer("#i02", blocoI02); };
      /* valores do mês: aceita "1.425,06", "1425,06" ou vazio (= zero); a tabela é refeita e o campo volta formatado */
      p.querySelectorAll(".f-mes").forEach((x) => (x.onchange = () => {
        S.fluxo[x.dataset.k] = Math.max(0, Motor.num(x.value) || 0); Motor.montarSemanas(S.fluxo); S.cen = null; salvar(); atualizarCaixa();
      }));
      p.querySelectorAll(".fluxo input").forEach((x) => (x.onchange = () => {
        S.fluxo.semanas[+x.dataset.i][x.dataset.k] = Math.max(0, Motor.num(x.value) || 0); S.cen = null; salvar(); atualizarCaixa();
      }));
      p.querySelectorAll(".cen").forEach((x) => (x.onchange = () => {
        S.cen[x.dataset.k] = Motor.num(x.value) || 0; salvar(); const y = window.scrollY; refazer("#i05", blocoI05); refazer("#atencao", blocoAtencao); window.scrollTo(0, y);
      }));
    }
    function atualizarCaixa() { const y = window.scrollY; p.querySelector("#conclusao-caixa").innerHTML = conclusaoCaixa(); p.querySelector("#entendemos").innerHTML = blocoEntendemos(); p.querySelector("#atencao").innerHTML = blocoAtencao(); p.querySelector("#caixa").innerHTML = blocoCaixa(); p.querySelector("#operacao").innerHTML = blocoOperacao(); p.querySelector("#retorno-inv").innerHTML = blocoRetorno(); p.querySelector("#i04").innerHTML = blocoI04(); p.querySelector("#i03").innerHTML = blocoI03(); p.querySelector("#i05").innerHTML = blocoI05(); ["#caixa", "#i04", "#i03", "#i05"].forEach((id) => abrir(p.querySelector(id))); ligar(); window.scrollTo(0, y); }
    ligar();
    ligarTrocar(p);
    ligarCopiar(p);
    p.querySelectorAll("[data-inicio]").forEach((b) => { b.onclick = () => ir(telaCapa); });

    p.querySelector("#v").onclick = () => { S.hist.pop(); const a = S.hist.pop(); salvar(); ir(telaPergunta, a); };
    p.querySelector("#imp").onclick = () => { p.querySelectorAll("details").forEach((d) => (d.open = true)); window.print(); };
    p.querySelector("#rev").onclick = () => { S.hist = []; salvar(); ir(telaPergunta, proxima({}, null)); };
    p.querySelector("#novo").onclick = () => { if (confirm("Começar uma nova análise? As respostas atuais serão apagadas.")) { S = novo(); herdarNegocio(); salvar(); ir(telaPergunta, proxTela(null)); } };
    return p;
  }

  function rodape() {
    return `<footer class="rodape">
      <p class="credito">Conteúdo produzido por estudantes do Laboratório de Gestão II · FACC/UFJF · versão ${esc(D.modulo.versao)} (A) · fontes consultadas em ${esc(D.modulo.data)}</p>
      <div class="logos">
        <img src="assets/logo_facc.png" alt="FACC">
        <img src="assets/logo_ufjf.svg" alt="UFJF">
        <img src="assets/logo_mg.svg" alt="Governo de Minas Gerais">
      </div>
    </footer>`;
  }

  /* BRIEF I: no resultado, as fontes (bloco posto pelo padrao.js, arquivo compartilhado) também abrem; uma vez só, a pessoa pode fechar */
  if (typeof MutationObserver !== "undefined") new MutationObserver(() => {
    if (!tela.querySelector(".lg2-proximo")) return;
    document.querySelectorAll("details.p-fontes:not([data-aberto])").forEach((d) => { d.open = true; d.dataset.aberto = "1"; });
  }).observe(document.body, { childList: true, subtree: true });
  herdarNegocio();
  /* perguntas novas (parcelas, taxa/prazo por forma, época do ano) em respostas que já chegaram ao resultado:
     usa o que já veio de outro módulo; se ainda faltar alguma, "Continuar de onde parei" abre nela */
  (function completarNovas() {
    if (!S.hist.length) return;
    let c = proxima(S.R, null), mudou = false, falta = null;
    for (let i = 0; c !== "RESULTADO" && i < 60; i++) {
      if (!S.R[c] && AUTO.includes(c)) { const h = heranca(c); if (h && h.completa !== false) { S.R[c] = respHerdada(h); mudou = true; } }
      if (!S.R[c] && !falta) falta = c;
      c = proxima(S.R, c);
    }
    if (falta && S.hist[S.hist.length - 1] === "RESULTADO") { S.hist[S.hist.length - 1] = falta; mudou = true; }
    if (mudou) { S.fluxo = null; S.cen = null; salvar(); }
  })();
  ir(telaCapa);
})();
