/* Contas do Módulo 7 (Turma B), conforme as abas "Instrumentos" e "Cálculos a conferir" da planilha
   do Grupo 7. Funções puras: o app e os testes usam as mesmas. */
(function (raiz) {
  "use strict";
  const SEMANAS_MES = 4.33;
  /* folga numérica para 300 × 4,33 não virar 1298,999… antes do arredondamento */
  const piso = (x) => Math.floor(x + 1e-9);
  const teto = (x) => Math.ceil(x - 1e-9);

  /* faixas de horas por semana (leitura proposta pelo grupo: "até 10h = no máximo 10 h" etc.) */
  const HORAS = {
    "Até 10 h": { modo: "max", lo: 10, hi: 10 },
    "De 11 a 20 h": { modo: "faixa", lo: 11, hi: 20 },
    "Mais de 20 h": { modo: "min", lo: 20, hi: 20 },
  };
  /* tempo de apoio (M7-03): valores de referência do grupo; "Não sei" usa 5 h como suposição */
  const APOIO = { "Até 2 h": 2, "De 3 a 5 h": 5, "De 6 a 10 h": 10, "Mais de 10 h": 10, "Não sei": 5 };

  function porTempo(minProd, minUn) {
    return { semana: piso(minProd / minUn), mes: piso((minProd * SEMANAS_MES) / minUn) };
  }
  function porEquip(minProd, un, minVez) {
    return { semana: piso(minProd / minVez) * un, mes: piso((minProd * SEMANAS_MES) / minVez) * un };
  }

  /* o = { horas, apoio, ajuda (h/semana), minUn, equip: {un, minVez} } */
  function capacidade(o) {
    const f = HORAS[o.horas];
    if (!f) return { estado: "sem-horas" };
    const apoio = APOIO[o.apoio] ?? 0;
    const temTempo = o.minUn > 0, temEquip = o.equip && o.equip.un > 0 && o.equip.minVez > 0;
    if (!temTempo && !temEquip) return { estado: "sem-tempo", modo: f.modo };
    const conta = (h) => {
      const minProd = (h - apoio + (o.ajuda || 0)) * 60;
      if (minProd <= 0) return null;
      const t = temTempo ? porTempo(minProd, o.minUn) : null;
      const e = temEquip ? porEquip(minProd, o.equip.un, o.equip.minVez) : null;
      const usa = t && e ? (e.mes < t.mes || (e.mes === t.mes && e.semana < t.semana) ? "equipamento" : "tempo") : t ? "tempo" : "equipamento";
      const c = usa === "tempo" ? t : e;
      return { minProd, semana: c.semana, mes: c.mes, limite: usa, tempo: t, equip: e };
    };
    const lo = conta(f.lo), hi = conta(f.hi);
    if (!hi) return { estado: "sem-producao", modo: f.modo };
    return { estado: "ok", modo: lo ? f.modo : "max", lo: lo || hi, hi, limite: hi.limite };
  }

  /* como mostrar: "no máximo 14", "de 38 a 77", "pelo menos 21" */
  function texto(c, campo) {
    const a = c.lo[campo], b = c.hi[campo];
    if (c.modo === "max") return `no máximo ${b}`;
    if (c.modo === "min") return `pelo menos ${a}`;
    return a === b ? `cerca de ${a}` : `de ${a} a ${b}`;
  }

  /* volume pretendido x capacidade por mês */
  function comparar(c, volume) {
    if (!(volume > 0) || !c || c.estado !== "ok") return null;
    if (c.modo !== "min" && volume > c.hi.mes) return { tipo: "falta", n: volume - c.hi.mes };
    if (volume <= c.lo.mes) return { tipo: "folga", n: c.lo.mes - volume };
    return { tipo: "dentro", n: 0 };
  }

  /* critério do teste (N em D dias) x o que cabe nesse prazo */
  function teste(c, n, dias) {
    if (!c || c.estado !== "ok" || !(n > 0) || !(dias > 0)) return null;
    const cabe = c.modo === "min" ? Infinity : (c.hi.semana * dias) / 7;
    return n > cabe ? { passa: true, semana: c.hi.semana } : { passa: false, semana: c.hi.semana };
  }

  /* lembrete de reposição: dias corridos; arredonda para cima */
  function pontoDePedido(volumeMes, usoPorUn, prazoDias, folga) {
    if (!(volumeMes > 0) || !(usoPorUn > 0) || prazoDias == null || prazoDias < 0) return null;
    return teto((volumeMes * usoPorUn * prazoDias) / 30) + (folga > 0 ? folga : 0);
  }
  const consumoDia = (volumeMes, usoPorUn) => (volumeMes * usoPorUn) / 30;
  /* compra com perda: dividir, não multiplicar */
  function compraComPerda(necessidade, perdaPct) {
    if (!(necessidade > 0)) return null;
    if (!(perdaPct > 0) || perdaPct >= 100) return teto(necessidade);
    return teto(necessidade / (1 - perdaPct / 100));
  }

  /* número digitado em pt-BR ("1.234,5", "90", "1,5") */
  function num(s) {
    if (typeof s === "number") return s;
    const t = String(s ?? "").trim().replace(/\s/g, "").replace(/^R\$/i, "");
    if (!t) return null;
    const n = Number(/,/.test(t) ? t.replace(/\./g, "").replace(",", ".") : t);
    return Number.isFinite(n) ? n : NaN;
  }
  const fmt = (n, casas = 0) => Number(n).toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });

  const M = { SEMANAS_MES, HORAS, APOIO, capacidade, texto, comparar, teste, pontoDePedido, consumoDia, compraComPerda, num, fmt, piso, teto };
  if (typeof module !== "undefined" && module.exports) module.exports = M;
  raiz.Motor7 = M;
})(typeof window !== "undefined" ? window : globalThis);
