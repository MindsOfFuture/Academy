/* Regras do Módulo 10 (Turma B), conforme as abas "Regras técnicas", "Caminhos por resposta" e
   "Cálculos a conferir" da planilha do Grupo 10. Funções puras: o app e os testes usam as mesmas. */
(function (raiz) {
  "use strict";
  const LIMITE_LISTA = 8;        // "Até 8 itens, sem repetição"
  const LIMITE_PRIORIDADES = 3;  // "Escolha até 3"
  const PRAZO_LONGO = 90;        // "Data acima de 90 dias"
  const PESO = { alta: 0, media: 1, baixa: 2 };
  const URGENCIA = ["piora muito", "piora um pouco", "fica igual", "não sei"];

  /* Lista de prioridades sugeridas (M10-09): gravidade alta primeiro; depois itens que bloqueiam
     outros; depois os demais. Empate: ordem em que apareceram (Módulo 1 → 10). Sem repetição de tema. */
  function prioridades(itens) {
    const vistos = new Set();
    const unicos = [];
    itens.forEach((x, i) => {
      const k = String(x.tema || "").trim().toLowerCase();
      if (!k || vistos.has(k)) return;
      vistos.add(k);
      unicos.push(Object.assign({ i }, x));
    });
    const grupo = (x) => (x.gravidade === "alta" ? 0 : x.bloqueia ? 1 : 1 + PESO[x.gravidade || "baixa"]);
    return unicos.sort((a, b) => grupo(a) - grupo(b) || a.i - b.i).slice(0, LIMITE_LISTA).map(({ i, ...x }) => x);
  }

  /* "Mais de 3": aceitar só os 3 primeiros */
  const limitar = (marcadas) => marcadas.slice(0, LIMITE_PRIORIDADES);

  /* "Não sei" em M10-09: as 3 primeiras da lista (ordem de gravidade) */
  const tresPrimeiras = (lista) => lista.slice(0, LIMITE_PRIORIDADES).map((x) => x.tema);

  /* M10-10: 'piora muito' primeiro; empate pela ordem de gravidade da lista */
  function ordenarPorUrgencia(prios, urgencia, ordemLista) {
    const pos = (t) => { const i = (ordemLista || []).indexOf(t); return i < 0 ? 999 : i; };
    const u = (t) => { const i = URGENCIA.indexOf(urgencia[t]); return i < 0 ? URGENCIA.length : i; };
    return prios.slice().sort((a, b) => u(a) - u(b) || pos(a) - pos(b) || prios.indexOf(a) - prios.indexOf(b));
  }

  /* datas em "aaaa-mm-dd" (campo de data do navegador); hoje no mesmo formato */
  const dia = (s) => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || "")); return m ? Date.UTC(+m[1], +m[2] - 1, +m[3]) : null; };
  function avaliarData(data, hoje) {
    const d = dia(data), h = dia(hoje);
    if (d == null || h == null) return "invalida";
    if (d < h) return "passada";
    return (d - h) / 86400000 > PRAZO_LONGO ? "longe" : "ok";
  }
  const dataBR = (s) => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || "")); return m ? `${m[3]}/${m[2]}/${m[1]}` : String(s || ""); };
  const somarDias = (hoje, n) => { const d = new Date(dia(hoje) + n * 86400000); return d.toISOString().slice(0, 10); };

  /* frase do plano, no formato do cartão do teste do Módulo 4:
     "[ação] até [data]; vai funcionar se [número] [sinal]" — com número, como no caso da aba
     "Cálculos a conferir": "…; vai funcionar se vierem 5 pedidos." */
  function frasePlano(p) {
    const acao = String(p.acao || "").trim().replace(/[.;]+$/, "");
    const A = acao.charAt(0).toUpperCase() + acao.slice(1);
    const sinal = String(p.sinal || "").trim().replace(/[.;]+$/, "");
    const n = num(p.numero);
    const se = n > 0 ? `vierem ${fmt(n)} ${sinal}`.trim() : sinal;
    return `${A} até ${dataBR(p.data)}${se ? `; vai funcionar se ${se}` : ""}.`;
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

  const M = { LIMITE_LISTA, LIMITE_PRIORIDADES, PRAZO_LONGO, URGENCIA, prioridades, limitar, tresPrimeiras, ordenarPorUrgencia, avaliarData, dataBR, somarDias, frasePlano, num, fmt };
  if (typeof module !== "undefined" && module.exports) module.exports = M;
  raiz.Motor10 = M;
})(typeof window !== "undefined" ? window : globalThis);
