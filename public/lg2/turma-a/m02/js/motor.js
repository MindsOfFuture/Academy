/* Motor do Módulo 2. Lê as condições exatamente como o grupo escreveu na planilha
   ("sempre", "M2.P01 = Sim", "M2.P04 > 0") e decide quais perguntas aparecem e
   quais regras valem. Não cria texto: só escolhe entre os textos da planilha. */
(function (raiz) {
  "use strict";
  const NS = "Não sei";
  const COD = /M2\.P\d{2}/g;

  function montar(D) {
    const perguntas = D.perguntas.filter((p) => p.codigo);
    const porCodigo = {};
    perguntas.forEach((p) => {
      p.opcoesLista = String(p.opcoes || "").split(";").map((s) => s.trim()).filter(Boolean);
      porCodigo[p.codigo] = p;
    });
    return { D, perguntas, porCodigo };
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
  /* botão "Não sei" fora da lista (perguntas de texto e número) */
  const temNaoSei = (q) => campo(q) !== "escolha" && q.opcoesLista.includes(NS);
  const num = (v) => parseFloat(String(v).replace(/\./g, "").replace(",", "."));

  function atomo(M, R, txt) {
    txt = txt.trim();
    if (/^sempre$/i.test(txt)) return true;
    const m = txt.match(/^(M2\.P\d{2})\s*(<=|>=|≠|=|<|>)\s*(.+)$/);
    if (!m) return false;
    const [, cod, op, alvo] = m;
    const v = valor(R, cod);
    if (v === undefined) return undefined;
    const a = alvo.trim();
    /* "M2.P02 = Preenchido": a pessoa escreveu algo (não tocou em "Não sei") */
    if (op === "=" && a === "Preenchido") return v !== NS && v !== "";
    /* "M2.P04 = 0": comparação numérica quando os dois lados são número */
    if (op === "=") return v === a || (!isNaN(num(v)) && !isNaN(Number(a)) && num(v) === Number(a));
    if (op === "≠") return v !== a && v !== "";
    const n = num(v);
    if (v === NS || isNaN(n)) return false;
    const x = parseFloat(a);
    return op === "<=" ? n <= x : op === ">=" ? n >= x : op === "<" ? n < x : n > x;
  }
  function avaliar(M, R, cond) {
    const ou = String(cond || "").split(/\s+ou\s+(?=M2\.P)/);
    let indef = false;
    for (const parte of ou) {
      const es = parte.split(/\s+e\s+(?=M2\.P)/).map((a) => atomo(M, R, a));
      if (es.every((x) => x === true)) return true;
      if (es.some((x) => x === undefined) && !es.some((x) => x === false)) indef = true;
    }
    return indef ? undefined : false;
  }
  const refs = (txt) => [...new Set(String(txt || "").match(COD) || [])];

  function proxima(M, R, cod) {
    const i = cod ? M.perguntas.findIndex((p) => p.codigo === cod) : -1;
    for (let j = i + 1; j < M.perguntas.length; j++) {
      if (avaliar(M, R, M.perguntas[j].condicao) === true) return M.perguntas[j].codigo;
    }
    return "RESULTADO";
  }
  function regrasAgora(M, R, cod) {
    return M.D.regras.filter((r) => {
      const rs = refs(r.condicao);
      return rs.includes(cod) && rs.every((c) => R[c] !== undefined) && avaliar(M, R, r.condicao) === true;
    });
  }
  const regrasTodas = (M, R) => M.D.regras.filter((r) => avaliar(M, R, r.condicao) === true);

  /* ---- M2.I04 Quadro de evidências: conta as linhas da ficha (M2.I02) ---- */
  const SINAIS = ["forte", "fraco", "nenhum"];
  function quadro(fichas) {
    const c = { forte: 0, fraco: 0, nenhum: 0 };
    const motivos = {};
    (fichas || []).forEach((f) => {
      if (c[f.sinal] !== undefined) c[f.sinal]++;
      const m = String(f.motivo || "").trim();
      if (m) motivos[m.toLowerCase()] = { t: m, n: ((motivos[m.toLowerCase()] || {}).n || 0) + 1 };
    });
    const total = (fichas || []).length;
    const top = Object.values(motivos).sort((a, b) => b.n - a.n)[0] || null;
    /* frase no formato do exemplo do grupo (aba 5, M2.I04, saída esperada) */
    const pct = total ? Math.floor((c.forte / total) * 100) : 0;
    const frase = total ? `${c.forte} de ${total} pessoas (${pct}%) mostraram um sinal forte de interesse; ainda é uma amostra pequena.` : "";
    return { contagem: c, total, pct, motivo: top, frase };
  }

  /* ---- M2.I05 Quadro de segmentos: soma as três notas (1 a 3) e ordena do maior para o menor ---- */
  function segmentos(grupos) {
    return (grupos || []).map((g, i) => {
      const notas = [g.alcancar, g.necessidade, g.pagar].map((x) => parseInt(x, 10));
      const completo = notas.every((x) => x >= 1 && x <= 3);
      return Object.assign({}, g, { i, total: completo ? notas.reduce((a, b) => a + b, 0) : null });
    }).sort((a, b) => (b.total ?? -1) - (a.total ?? -1));
  }

  const semVazio = (rs, campo, nada) => [...new Set(rs.map((r) => r[campo]).filter((x) => x && x !== nada))];
  const lacunas = (rs) => semVazio(rs, "lacuna", "Nenhuma");
  const encaminhamentos = (rs) => semVazio(rs, "encaminhamento", "Nenhum");
  const alertas = (rs) => semVazio(rs, "alerta", "Nenhum");
  const proximos = (rs) => semVazio(rs, "proximo", "Nenhum");

  const API = { montar, valor, campo, temNaoSei, avaliar, proxima, regrasAgora, regrasTodas, quadro, segmentos, SINAIS,
                lacunas, encaminhamentos, alertas, proximos, NS };
  if (typeof module !== "undefined") module.exports = API; else raiz.Motor = API;
})(this);
