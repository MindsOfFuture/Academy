/* Motor do Módulo 6 (versão A). Lê as condições exatamente como o grupo escreveu:
   coluna F da aba 3 ("sempre", "M6.P01 ≠ Não sei", "M6.P05 = Sim") decide se a pergunta aparece;
   colunas B e C da aba 4 ("Resposta diferente de “Não sei”", "Resposta = “Parcelado” ou “...”",
   "À vista", "Não sei") decidem qual regra vale. Não cria texto: só escolhe entre os da planilha.
   As contas de caixa seguem as fórmulas escritas na aba 5 (M6.I01, I03, I04, I05). */
(function (raiz) {
  "use strict";
  const NS = "Não sei";
  const COD = /M6\.P\d{2}/g;

  function montar(D) {
    const perguntas = D.perguntas.filter((p) => p.codigo);
    const porCodigo = {};
    perguntas.forEach((p) => {
      p.opcoesLista = String(p.opcoes || "").split(";").map((s) => s.trim()).filter(Boolean);
      porCodigo[p.codigo] = p;
    });
    const instr = {};
    D.instrumentos.forEach((i) => { if (i.codigo) instr[i.codigo] = i; });
    return { D, perguntas, porCodigo, instr };
  }

  function valor(R, cod) {
    const r = R[cod];
    if (!r) return undefined;
    if (r.estado === "naosei") return NS;
    return r.estado === "opcao" ? r.opcao : String(r.valor ?? "").trim();
  }
  function campo(q) {
    if (/escolha|sim\/n/i.test(q.tipo)) return "escolha";
    if (/n[uú]mero/i.test(q.tipo)) return "numero";
    return "texto";
  }
  const temNaoSei = (q) => campo(q) !== "escolha" && q.opcoesLista.includes(NS);
  /* "R$ 5.000", "1.500,50", "2000" -> número */
  function num(v) {
    let s = String(v ?? "").replace(/[^\d,.-]/g, "");
    if (/,\d{1,2}$/.test(s)) s = s.replace(/\./g, "").replace(",", ".");
    else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, "");
    else s = s.replace(/,/g, "");
    return s === "" ? NaN : parseFloat(s);
  }

  /* ---- coluna F da aba 3 ---- */
  function atomo(R, txt) {
    txt = txt.trim();
    if (/^sempre$/i.test(txt)) return true;
    const m = txt.match(/^(M6\.P\d{2})\s*(≠|=)\s*(.+)$/);
    if (!m) return false;
    const v = valor(R, m[1]);
    if (v === undefined) return undefined;
    return m[2] === "=" ? v === m[3].trim() : v !== m[3].trim();
  }
  function avaliar(R, cond) {
    let indef = false;
    for (const parte of String(cond || "").split(/\s+ou\s+(?=M6\.P)/)) {
      const es = parte.split(/\s+e\s+(?=M6\.P)/).map((a) => atomo(R, a));
      if (es.every((x) => x === true)) return true;
      if (es.some((x) => x === undefined) && !es.some((x) => x === false)) indef = true;
    }
    return indef ? undefined : false;
  }
  function proxima(M, R, cod) {
    const i = cod ? M.perguntas.findIndex((p) => p.codigo === cod) : -1;
    for (let j = i + 1; j < M.perguntas.length; j++)
      if (avaliar(R, M.perguntas[j].condicao) === true) return M.perguntas[j].codigo;
    return "RESULTADO";
  }

  /* ---- coluna C da aba 4: condição sobre a resposta da pergunta da coluna B ---- */
  const aspas = (s) => (s.match(/“([^”]+)”/g) || []).map((x) => x.slice(1, -1).trim());
  function vale(regra, v) {
    if (v === undefined) return false;
    const c = String(regra.condicao || "").trim();
    if (/^Resposta diferente de/i.test(c)) return !aspas(c).includes(v);
    if (/^Resposta\s*=/i.test(c)) return aspas(c).includes(v);
    return v === c;   // "Não sei", "À vista", "Não  " (espaços da planilha ignorados)
  }
  const regrasAgora = (M, R, cod) => M.D.regras.filter((r) => r.pergunta === cod && vale(r, valor(R, cod)));
  const regrasTodas = (M, R) => M.D.regras.filter((r) => vale(r, valor(R, r.pergunta)));

  const semVazio = (rs, campo, nada) => [...new Set(rs.map((r) => r[campo]).filter((x) => x && x !== nada))];
  const lacunas = (rs) => semVazio(rs, "lacuna", "Nenhuma");
  const encaminhamentos = (rs) => semVazio(rs, "encaminhamento", "Nenhum");
  const alertas = (rs) => semVazio(rs, "alerta", "Nenhum");

  /* ---- cálculos da aba 5 ---- */
  const numDe = (R, cod) => { const v = valor(R, cod); return v === undefined || v === NS ? null : num(v); };

  /* M6.I01: perguntas M6.P01, P02, P03 -> o valor estimado é o informado em P02.
     O estoque (P06) é mostrado à parte, porque o I01 não lista a P06. */
  function investimento(R) {
    return { valor: numDe(R, "M6.P02"), forma: valor(R, "M6.P03"), estoque: valor(R, "M6.P05") === "Sim" ? numDe(R, "M6.P06") : null };
  }

  /* prazos das opções de P07 e P08 -> semana do fluxo de 13 semanas (só pré-preenchimento; editável) */
  const SEMANA = { "À vista": 1, "Na hora": 1, "Até 7 dias": 2, "8 a 30 dias": 5, "Mais de 30 dias": 6 };
  const semanaDe = (v) => SEMANA[v] || null;

  /* M6.I04: monta as 13 semanas a partir das respostas */
  function fluxoInicial(R) {
    const sem = Array.from({ length: 13 }, () => ({ entradas: 0, saidas: 0 }));
    const inv = investimento(R);
    const sPag = semanaDe(valor(R, "M6.P07")) || 1;
    const sRec = semanaDe(valor(R, "M6.P08")) || 1;
    if (inv.valor) sem[sPag - 1].saidas += inv.valor;
    if (inv.estoque) sem[sPag - 1].saidas += inv.estoque;
    const vendas = numDe(R, "M6.P04");
    if (vendas) sem[sRec - 1].entradas += vendas;
    return { saldoInicial: numDe(R, "M6.P09") || 0, semanas: sem, semanaPagamento: sPag, semanaRecebimento: sRec };
  }
  /* "Saldo final da semana = saldo inicial da semana + entradas previstas − saídas previstas.
      O saldo final de uma semana passa a ser o saldo inicial da semana seguinte." */
  function projetar(F) {
    let saldo = F.saldoInicial;
    return F.semanas.map((s, i) => {
      const ini = saldo;
      saldo = ini + (s.entradas || 0) - (s.saidas || 0);
      /* limite do I04: "Alertar quando as saídas previstas forem maiores que os recursos disponíveis no período." */
      return { semana: i + 1, inicial: ini, entradas: s.entradas || 0, saidas: s.saidas || 0, final: saldo,
               alerta: (s.saidas || 0) > 0 && (s.saidas || 0) > ini + (s.entradas || 0) };
    });
  }
  /* M6.I03: "Saldo do período = saldo inicial + entradas recebidas − saídas pagas." */
  function controle(F) {
    const e = F.semanas.reduce((a, s) => a + (s.entradas || 0), 0), s = F.semanas.reduce((a, x) => a + (x.saidas || 0), 0);
    return { inicial: F.saldoInicial, entradas: e, saidas: s, saldo: F.saldoInicial + e - s };
  }
  /* M6.I05: "Saldo do cenário = saldo inicial + entradas previstas no cenário − saídas previstas no cenário."
     limite: "Alertar quando houver período com saídas previstas superiores às entradas e ao saldo disponível." */
  function cenario(inicial, entradas, saidas) {
    const saldo = inicial + entradas - saidas;
    return { saldo, alerta: saidas > entradas + inicial };
  }
  /* M6.I02: itens de P01 para classificar; categorias literais da regra do grupo */
  function categorias(M) {
    const r = (M.instr["M6.I02"] || {}).regra || "";
    const m = r.split(":").slice(1).join(":");
    return m.split(/,| ou /).map((s) => s.trim().replace(/\.$/, "")).filter(Boolean);
  }
  function itens(R) {
    const v = valor(R, "M6.P01");
    if (!v || v === NS) return [];
    return v.split(/\n|;|,| e (?=[a-zà-ú])/i).map((s) => s.trim()).filter(Boolean);
  }

  const API = { montar, valor, campo, temNaoSei, num, avaliar, proxima, vale, regrasAgora, regrasTodas,
                lacunas, encaminhamentos, alertas, investimento, semanaDe, fluxoInicial, projetar, controle,
                cenario, categorias, itens, NS, COD };
  if (typeof module !== "undefined") module.exports = API; else raiz.Motor = API;
})(this);
