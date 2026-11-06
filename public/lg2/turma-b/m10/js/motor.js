/* Regras do Módulo 10 (Turma B), conforme as abas "Regras técnicas", "Caminhos por resposta" e
   "Cálculos a conferir" da planilha do Grupo 10. Funções puras: o app e os testes usam as mesmas. */
(function (raiz) {
  "use strict";
  const LIMITE_LISTA = 8;        // "Até 8 itens, sem repetição"
  const LIMITE_PRIORIDADES = 3;  // "Escolha até 3"
  const PRAZO_LONGO = 90;        // "Data acima de 90 dias"
  /* limites de aviso (receita B): avisam e deixam seguir */
  const META_ALTA = 300;   // "quanto basta" do plano acima de 300 numa ação de até 90 dias
  const PRECO_ALTO = 1000; // preço de venda acima de R$ 1.000 para um pequeno negócio caseiro
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

  /* o que se conta no "quanto basta" do plano (plural → singular, para concordar com o número) */
  const UNIDADES = { vendas: "venda", pedidos: "pedido", "clientes novos": "cliente novo", respostas: "resposta", "contatos de interesse": "contato de interesse", encomendas: "encomenda", clientes: "cliente", mensagens: "mensagem" };
  const UNIDADES_PLANO = ["vendas", "pedidos", "clientes novos", "respostas", "contatos de interesse"];
  const semPonto = (s) => String(s || "").replace(/\s+/g, " ").trim().replace(/[.;]+$/, "");

  /* frase do plano. Com o que se conta (unidade) e sem outro sinal, fica como no caso da aba
     "Cálculos a conferir": "…; vai funcionar se vierem 5 pedidos." O sinal escrito pela pessoa nunca
     ocupa o lugar da unidade (antes saía "vierem 1.500 Juiz de Fora"); pedaço vazio não aparece. */
  function frasePlano(p) {
    const acao = semPonto(p.acao);
    const A = acao.charAt(0).toUpperCase() + acao.slice(1);
    let sinal = semPonto(p.sinal); // como a pessoa escreveu (pode ter nome de lugar)
    let u = UNIDADES[String(p.unidade || "").trim()] ? String(p.unidade).trim() : null;
    /* sinal que já é uma unidade ("pedidos"): vira a unidade, como no caso da planilha */
    if (UNIDADES[sinal.toLowerCase()] && (!u || u === sinal.toLowerCase())) { u = sinal.toLowerCase(); sinal = ""; }
    const n = num(p.numero);
    const qtd = n > 0 ? `${fmt(n, n % 1 ? 1 : 0)}${u ? " " + (n === 1 ? UNIDADES[u] : u) : ""}` : "";
    let fim = "";
    if (qtd && u && !sinal) fim = `; vai funcionar se ${n === 1 ? "vier" : "vierem"} ${qtd}`;
    else if (sinal && qtd) fim = `; sinal de que funcionou: ${sinal} (meta: ${qtd})`;
    else if (sinal) fim = `; sinal de que funcionou: ${sinal}`;
    else if (qtd) fim = `; meta: ${qtd}`;
    return `${A}${p.data ? ` até ${dataBR(p.data)}` : ""}${fim}.`;
  }

  /* número digitado em pt-BR ("1.234,5", "90", "1,5") */
  function num(s) {
    if (typeof s === "number") return s;
    const t = String(s ?? "").trim().replace(/\s/g, "").replace(/^R\$/i, "");
    if (!t) return null;
    /* "1.500" sem vírgula = mil e quinhentos (ponto de milhar), não 1,5 */
    const milhar = /^[1-9]\d{0,2}(\.\d{3})+$/.test(t);
    const n = Number(/,/.test(t) || milhar ? t.replace(/\./g, "").replace(",", ".") : t);
    return Number.isFinite(n) ? n : NaN;
  }
  const fmt = (n, casas = 0) => Number(n).toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });

  const M = { META_ALTA, PRECO_ALTO, UNIDADES, UNIDADES_PLANO, LIMITE_LISTA, LIMITE_PRIORIDADES, PRAZO_LONGO, URGENCIA, prioridades, limitar, tresPrimeiras, ordenarPorUrgencia, avaliarData, dataBR, somarDias, frasePlano, num, fmt };
  if (typeof module !== "undefined" && module.exports) module.exports = M;
  raiz.Motor10 = M;
})(typeof window !== "undefined" ? window : globalThis);
