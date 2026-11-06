/* Regras do Módulo 9 (documento final do Grupo 9, 30/10/2026), sem tela: quais perguntas aparecem,
   o checklist de endereço e licenças, os alertas, os próximos passos e os cruzamentos.
   As colunas "Aparece quando" e "Próximo passo / regra" do documento viram as funções abaixo.
   R = respostas deste módulo ({ cod: {estado: "opcao"|"naosei"|"valor", opcao, valor} });
   X = o que foi lido dos outros módulos neste aparelho (só leitura). */
(function (raiz) {
  "use strict";
  const NS = "Não sei";

  /* opções citadas nas regras (as mesmas do documento; o teste confere que existem nos dados) */
  const O = {
    casa: "Na minha casa", apto: "Em apartamento ou condomínio residencial", loja: "Em loja ou sala comercial",
    semLocal: "Sem local fixo (digital, na casa do cliente ou ambulante)", naoEscolhi: "Ainda não escolhi",
    internet: "Só pela internet ou por telefone", cliente: "Na casa ou na empresa do cliente",
    rua: "Na rua, em feiras ou eventos, em barraca, carrinho ou veículo (food truck)",
    pCasa: "Minha casa", pApto: "Apartamento ou condomínio", pLoja: "Loja ou sala comercial", pSem: "Sem local fixo", pIdeia: "Ainda não faço ideia",
    aprovada: "Sim, foi aprovada", negada: "Sim, foi negada", naoFiz: "Ainda não fiz",
    gasNao: "Não", encanado: "Sim, gás encanado da rua (gás natural)", botijao: "Sim, botijão ou cilindro (gás de cozinha, GLP)", revenda: "Vou vender gás de cozinha (revenda)",
    tres: "3 ou mais botijões de 13 kg", cilindros: "Cilindros de 20 kg ou 45 kg (P20, P45)",
    dentro: "Dentro da cozinha ou de outro cômodo fechado",
    inflMaior: "Sim, em maior quantidade ou para vender",
    obra: "Sim, obra que muda estrutura, área ou uso", alimentos: "Sim, alimentos ou bebidas",
  };
  /* perguntas em que o "Não sei" mostra o aviso com "Já verifiquei" (texto do documento + regra das linhas) */
  const AVISO_NS = ["M9-02", "M9-03a", "M9-04", "M9-06", "M9-07", "M9-07a", "M9-07b", "M9-07c", "M9-08", "M9-10", "M9-11", "M9-12"];

  const op = (R, c) => { const r = R[c]; return !r ? null : r.estado === "naosei" ? NS : r.estado === "opcao" ? r.opcao : r.estado === "valor" ? r.valor : null; };
  const ns = (R, c) => !!R[c] && R[c].estado === "naosei";
  const sim = (v) => typeof v === "string" && v.startsWith("Sim");

  /* tipo de local: escolhido (M9-03) ou pretendido (M9-03b); sem local fixo: forma (M9-03a) */
  function local(R) {
    const o3 = op(R, "M9-03"), o3b = op(R, "M9-03b"), o3a = op(R, "M9-03a");
    let tipo = { [O.casa]: "casa", [O.apto]: "apto", [O.loja]: "loja" }[o3] || null, planejado = false;
    if (!tipo && (o3 === O.naoEscolhi || o3 === NS)) { tipo = { [O.pCasa]: "casa", [O.pApto]: "apto", [O.pLoja]: "loja" }[o3b] || null; planejado = !!tipo; }
    const pedeForma = o3 === O.semLocal || ((o3 === O.naoEscolhi || o3 === NS) && o3b === O.pSem);
    const forma = !pedeForma ? null : o3a === O.internet || o3a === O.cliente ? "remoto" : o3a === O.rua ? "rua" : o3a === NS ? "indefinido" : null;
    const indefinido = o3b === O.pIdeia || forma === "indefinido";
    return { tipo, planejado, pedeForma, forma, indefinido, fixo: !!tipo, casaOuApto: tipo === "casa" || tipo === "apto" };
  }
  const sanitario = (R) => sim(op(R, "M9-02"));
  /* público no local: M9-06 = Sim (qualquer número); na rua, público no local = sim */
  const publico = (R) => sim(op(R, "M9-06")) || local(R).forma === "rua";

  /* "Aparece quando" de cada pergunta, na ordem do fluxo (M9-14 é a tela do resumo) */
  function sequencia(R) {
    const L = local(R), o3 = op(R, "M9-03");
    const s = ["M9-01", "M9-02", "M9-03"];
    if (o3 === O.semLocal) s.push("M9-03a");
    if (o3 === O.naoEscolhi || o3 === NS) { s.push("M9-03b"); if (op(R, "M9-03b") === O.pSem) s.push("M9-03a"); }
    s.push("M9-04");
    if (L.casaOuApto) s.push("M9-05");
    if (L.fixo) s.push("M9-06");
    if (L.fixo || L.forma === "rua") {
      s.push("M9-07");
      if (op(R, "M9-07") === O.botijao) s.push("M9-07a", "M9-07b");
      s.push("M9-07c");
    }
    if (L.tipo === "apto") s.push("M9-08");
    if (L.casaOuApto && sanitario(R)) s.push("M9-09");
    s.push("M9-10", "M9-11");
    if (L.fixo) s.push("M9-12");
    s.push("M9-13");
    return s;
  }

  /* ---------- texto do documento ---------- */
  const caminho = (D, cod, opcao) => {
    const q = D.perguntas.find((x) => x.codigo === cod);
    return q && q.caminhos.find((c) => c.opcao === opcao || c.opcoes.includes(opcao));
  };
  /* "Verifique ... ⚠ Atenção: ..." -> { verifique, atencao } */
  function partesAviso(t) {
    const s = String(t || ""), i = s.indexOf("⚠ Atenção:");
    return i < 0 ? { verifique: s, atencao: "" } : { verifique: s.slice(0, i).trim(), atencao: s.slice(i + "⚠ Atenção:".length).trim() };
  }
  const avisoNS = (D, cod) => partesAviso((caminho(D, cod, NS) || {}).texto).atencao;
  const linkEstado = (D, R) => { const e = D.viabilidade.estados.find((x) => x.estado === op(R, "M9-01")); return e ? e.link : D.viabilidade.geral; };

  /* ---------- checklist: itens na ordem do instrumento ---------- */
  const ORGAOS = {
    prefeitura: { nome: "Prefeitura e portal da Redesim ou Junta Comercial do estado", base: "M9.BT05" },
    vigilancia: { nome: "Vigilância Sanitária", base: "M9.BT11" },
    bombeiros: { nome: "Bombeiros", base: "M9.BT14" },
    ambiental: { nome: "Órgão ambiental", base: "M9.BT15" },
    conselho: { nome: "Conselho profissional", base: "M9.BT16" },
    condominio: { nome: "Condomínio", base: "M9.BT09" },
    anp: { nome: "ANP (revenda de gás)", base: "M9.BT22" },
    detran: { nome: "Detran (veículo adaptado)", base: "M9.BT23" },
  };
  const ITENS = [
    { id: "viabilidade", nome: "Consulta de viabilidade", base: "M9.BT05" },
    { id: "local", nome: "Condições do local (área, público, condomínio)", base: "M9.BT08" },
    { id: "gas", nome: "Gás (tipo, quantidade e onde fica) e inflamáveis", base: "M9.BT21" },
    { id: "bombeiros", nome: "Bombeiros", base: "M9.BT14" },
    { id: "vigilancia", nome: "Vigilância Sanitária", base: "M9.BT11" },
    { id: "ambulante", nome: "Uso de espaço público (ambulante)", base: "M9.BT23" },
    { id: "conselho", nome: "Conselho profissional", base: "M9.BT16" },
    { id: "ambiente", nome: "Meio ambiente", base: "M9.BT15" },
    { id: "obra", nome: "Obra", base: "M9.BT19" },
  ];
  const SIT = { feito: "feito", fazer: "a fazer", na: "não se aplica", conf: "a confirmar" };

  /* alimento percebido pelo que a pessoa vende (outros módulos ou ideias deste) e M9-02 = "Não":
     a Vigilância Sanitária fica "a confirmar" em vez de "não se aplica" */
  const alimentoSemSaude = (R, X) => !!(X && X.alimento) && op(R, "M9-02") === "Não";
  function checklist(D, R, feitos, X) {
    const L = local(R), o4 = op(R, "M9-04"), o7 = op(R, "M9-07"), o7c = op(R, "M9-07c");
    const pulado = (motivo) => (L.indefinido ? { sit: SIT.conf, motivo: "Local ainda não definido" } : { sit: SIT.na, motivo });
    const porNS = (cods) => cods.filter((c) => ns(R, c));
    const out = [];
    const add = (id, r, orgaos) => out.push(Object.assign({ id, orgaos }, r));

    /* 1. consulta de viabilidade */
    add("viabilidade",
      o4 === O.aprovada ? { sit: SIT.feito } : o4 === NS ? { sit: SIT.conf, ns: ["M9-04"] }
        : L.forma === "remoto" ? { sit: SIT.conf, motivo: "Endereço do registro" } : L.indefinido ? { sit: SIT.conf, motivo: "Local ainda não definido" } : { sit: SIT.fazer },
      ["prefeitura"]);
    /* 2. condições do local */
    if (!L.fixo) add("local", pulado("Sem local fixo"), ["prefeitura"]);
    else {
      const c = porNS(["M9-05", "M9-06", "M9-08"]);
      add("local", c.length ? { sit: SIT.conf, ns: c } : { sit: SIT.fazer }, L.tipo === "apto" ? ["prefeitura", "condominio"] : ["prefeitura"]);
    }
    /* 3. gás e inflamáveis (local fixo ou rua) */
    const temGas = !!o7 && o7 !== O.gasNao && o7 !== NS;
    if (!L.fixo && L.forma !== "rua") add("gas", pulado("Sem local fixo"), ["bombeiros"]);
    else {
      const c = porNS(["M9-07", "M9-07a", "M9-07b", "M9-07c"]);
      add("gas", c.length ? { sit: SIT.conf, ns: c } : temGas || o7c === O.inflMaior ? { sit: SIT.fazer } : { sit: SIT.na, motivo: "Sem gás e sem produtos que pegam fogo em maior quantidade" },
        o7 === O.revenda ? ["bombeiros", "anp"] : ["bombeiros"]);
    }
    /* 4. Bombeiros */
    if (!L.fixo && L.forma !== "rua") add("bombeiros", pulado("Sem local fixo"), ["bombeiros"]);
    else {
      const c = porNS(L.forma === "rua" ? ["M9-07"] : ["M9-06", "M9-07", "M9-07c"]);
      const aceso = L.tipo === "loja" || temGas || (L.fixo && (sim(op(R, "M9-06")) || o7c === O.inflMaior));
      add("bombeiros", aceso ? { sit: SIT.fazer } : c.length ? { sit: SIT.conf, ns: c } : { sit: SIT.na, motivo: L.forma === "rua" ? "Sem gás" : "Sem público, gás ou inflamáveis em maior quantidade" }, ["bombeiros"]);
    }
    /* 5. Vigilância Sanitária */
    add("vigilancia", sanitario(R) ? { sit: SIT.fazer } : ns(R, "M9-02") ? { sit: SIT.conf, ns: ["M9-02"] }
      : alimentoSemSaude(R, X) ? { sit: SIT.conf, motivo: "Você vende alimentos: confira com a Vigilância Sanitária" } : { sit: SIT.na, motivo: "Atividade sem interesse sanitário" }, ["vigilancia"]);
    /* 6. uso de espaço público (ambulante) */
    add("ambulante", L.forma === "rua" ? { sit: SIT.fazer } : L.forma === "indefinido" ? { sit: SIT.conf, ns: ["M9-03a"] } : { sit: SIT.na, motivo: "Não vende em local público" },
      ["prefeitura", "detran"]);
    /* 7. conselho, 8. meio ambiente */
    const sn = (cod, motivo) => (op(R, cod) === "Sim" ? { sit: SIT.fazer } : ns(R, cod) ? { sit: SIT.conf, ns: [cod] } : { sit: SIT.na, motivo });
    add("conselho", sn("M9-10", "Não exige profissional registrado em conselho"), ["conselho"]);
    add("ambiente", sn("M9-11", "Sem fumaça, barulho, água suja, pó ou restos químicos"), ["ambiental", "prefeitura"]);
    /* 9. obra */
    if (!L.fixo) add("obra", pulado("Sem local fixo"), ["prefeitura"]);
    else add("obra", op(R, "M9-12") === O.obra ? { sit: SIT.fazer } : ns(R, "M9-12") ? { sit: SIT.conf, ns: ["M9-12"] } : { sit: SIT.na, motivo: "Sem obra que mude estrutura, área ou uso" }, ["prefeitura"]);

    return out.map((it) => {
      const def = ITENS.find((x) => x.id === it.id);
      const marcado = !!(feitos && feitos[it.id]) && (it.sit === SIT.fazer || it.sit === SIT.conf);
      return Object.assign({}, def, it, {
        sit: marcado ? SIT.feito : it.sit,
        marcado,
        hipotese: L.planejado && ["local", "gas", "bombeiros", "obra"].includes(it.id),
        avisos: (it.ns || []).map((c) => avisoNS(D, c)).filter(Boolean),
      });
    });
  }

  /* ---------- cruzamentos entre respostas (tabela do documento, na mesma ordem) ---------- */
  function cruzamentos(D, R, X) {
    const L = local(R), C = D.resumo.cruzamentos;
    X = X || {};
    const lista = [
      { i: 0, cod: "M9-02", ok: X.m4Regulada && op(R, "M9-02") === "Não" },
      { i: 1, cod: "M9-12", ok: X.m6SemReforma && op(R, "M9-12") === O.obra },
      { i: 2, cod: "M9-06", ok: L.casaOuApto && sim(op(R, "M9-06")) },
      { i: 3, cod: "M9-03", ok: op(R, "M9-03") === O.naoEscolhi && X.semCnpj },
      { i: 4, cod: "M9-10", ok: op(R, "M9-10") === "Sim" && X.poucaExperiencia },
      { i: 5, cod: "M9-03a", ok: L.forma === "rua" && op(R, "M9-02") === O.alimentos },
      { i: 6, cod: "M9-07", ok: op(R, "M9-07") === O.revenda && X.semCnpj },
      { i: 7, cod: "M9-07b", ok: op(R, "M9-07b") === O.dentro && publico(R) },
      { i: 8, cod: "M9-07", ok: X.m7Gas && op(R, "M9-07") === O.gasNao },
    ];
    const seq = sequencia(R);
    return lista.filter((x) => x.ok && seq.includes(x.cod)).map((x) => Object.assign({ cod: x.cod, i: x.i }, C[x.i]));
  }

  /* ---------- resumo: no máximo 3 alertas, 3 próximos passos e 1 encaminhamento ---------- */
  const ATENCAO = "⚠ Atenção: ";
  const LIMITE = { alertas: 3, proximos: 3, encaminhamentos: 1 };
  function alertas(D, R, X) {
    const L = local(R), seq = sequencia(R), out = [];
    const txt = (cod, o) => (caminho(D, cod, o) || {}).texto;
    /* regras "Alerta no resumo" */
    if (seq.includes("M9-07") && op(R, "M9-07") === O.revenda) out.push(txt("M9-07", O.revenda));
    const a7 = op(R, "M9-07a");
    if (seq.includes("M9-07a") && (a7 === O.tres || a7 === O.cilindros)) out.push(txt("M9-07a", a7));
    if (seq.includes("M9-07b") && op(R, "M9-07b") === O.dentro) out.push(txt("M9-07b", O.dentro));
    /* cruzamentos de atenção (as perguntas gentis aparecem na própria pergunta) */
    const cz = cruzamentos(D, R, X);
    cz.filter((c) => c.forma === "Atenção").forEach((c) => out.push(c.mensagem));
    /* local não definido: voltar a esta etapa antes de alugar */
    if (op(R, "M9-03b") === O.pIdeia && seq.includes("M9-03b")) out.push(txt("M9-03b", O.pIdeia));
    else if (L.forma === "indefinido") out.push(ATENCAO + avisoNS(D, "M9-03a"));
    /* "Não sei" seguido sem responder: o aviso de cuidado, marcado com ⚠ como no documento */
    seq.filter((c) => AVISO_NS.includes(c) && c !== "M9-03a" && ns(R, c)).forEach((c) => out.push(ATENCAO + avisoNS(D, c)));
    cz.filter((c) => c.forma === "Dica").forEach((c) => out.push(c.mensagem));
    return out.filter(Boolean).filter((x, i, a) => a.indexOf(x) === i).slice(0, LIMITE.alertas);
  }
  function proximos(D, R, itens) {
    const L = local(R), P = D.resumo.proximos.map((x) => x.mensagem), o4 = op(R, "M9-04"), seq = sequencia(R), out = [];
    if (o4 === O.naoFiz || o4 === NS) out.push(P[0].replace("[link do estado]", linkEstado(D, R)));
    if (o4 === O.negada) out.push(P[1]);
    if (itens.some((i) => i.sit === SIT.conf)) out.push(P[2]);
    if (L.indefinido) out.push(P[3]);
    if (L.forma === "rua") out.push(P[4]);
    if (seq.includes("M9-07") && op(R, "M9-07") === O.revenda) out.push(P[5]);
    const a7 = seq.includes("M9-07a") ? op(R, "M9-07a") : null;
    if (a7 === O.tres || a7 === O.cilindros || (seq.includes("M9-07b") && op(R, "M9-07b") === O.dentro)) out.push(P[6]);
    if (!itens.some((i) => i.sit === SIT.conf)) out.push(P[7]);
    return out.slice(0, LIMITE.proximos);
  }
  /* encaminhamento: o órgão do primeiro item pendente do checklist (escolha do app; o documento não traz tabela) */
  function encaminhamento(itens) {
    const i = itens.find((x) => x.sit === SIT.fazer || x.sit === SIT.conf);
    return i ? { item: i.nome, orgao: i.orgaos[0] } : null;
  }
  /* órgãos acesos pelo checklist (itens que não ficaram "não se aplica") */
  function orgaos(itens) {
    const acesos = new Set();
    itens.filter((i) => i.sit !== SIT.na).forEach((i) => i.orgaos.forEach((o) => acesos.add(o)));
    return Object.keys(ORGAOS).filter((k) => acesos.has(k));
  }

  /* linha-resumo: fato, hipótese e o que falta (tabela "Situação de cada dado") */
  function linhaResumo(D, R, itens) {
    const L = local(R), o1 = op(R, "M9-01"), o4 = op(R, "M9-04"), p = [];
    p.push(o1 && o1 !== NS ? `Estado: ${o1} (fato)` : "Estado não definido (hipótese)");
    const nomeLocal = { casa: "casa", apto: "apartamento ou condomínio", loja: "loja ou sala comercial" }[L.tipo];
    if (L.tipo && !L.planejado) p.push(`local: ${nomeLocal} (fato)`);
    else if (L.tipo) p.push(`local pretendido: ${nomeLocal} (hipótese)`);
    else if (L.forma === "remoto" || L.forma === "rua") p.push("sem local fixo (fato)");
    else p.push("local não definido (hipótese)");
    p.push(o4 === O.aprovada ? "viabilidade aprovada (fato)" : o4 === O.negada ? "viabilidade negada (fato)" : "viabilidade ainda não confirmada (hipótese)");
    p.push("nível de risco provável a confirmar na consulta de viabilidade (hipótese)");
    const n = itens.filter((i) => i.sit === SIT.conf).length, f = itens.filter((i) => i.sit === SIT.fazer).length;
    p.push(`${n} ${n === 1 ? "item" : "itens"} a confirmar e ${f} a fazer no checklist (falta)`);
    return p.join("; ") + ".";
  }

  const api = { NS, O, AVISO_NS, LIMITE, SIT, ORGAOS, ITENS, op, ns, local, sanitario, publico, sequencia, alimentoSemSaude, caminho, partesAviso, avisoNS, linkEstado, checklist, cruzamentos, alertas, proximos, encaminhamento, orgaos, linhaResumo };
  raiz.Motor9 = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
