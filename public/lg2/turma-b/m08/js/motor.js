/* Motor do Módulo 8. Lê as condições exatamente como o grupo escreveu na planilha
   ("Sempre", "M8.P05=Não", "M8.P04 ≤ 6750 ou M8.P05 = Não", "M8.P03 ≠ Online")
   e decide quais perguntas aparecem e quais regras valem.
   Não cria texto: só escolhe entre os textos da planilha. */
(function (raiz) {
  "use strict";
  const NS = "Não sei";
  const COD = /M8\.P\d{2}/g;
  const CNAE = /\d{4}-?\d\/?\d{2}/g;

  function montar(D) {
    const perguntas = D.perguntas.filter((p) => p.codigo);
    const porCodigo = {};
    perguntas.forEach((p) => {
      p.opcoesLista = String(p.opcoes || "").split(";").map((s) => s.trim()).filter(Boolean);
      porCodigo[p.codigo] = p;
    });
    const anexo = (D.anexo && D.anexo.linhas) || [];
    return { D, perguntas, porCodigo, anexo };
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

  /* ---- Anexo XI: busca literal por CNAE, ocupação ou descrição ---- */
  const sem = (s) => String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ");
  const soDig = (s) => String(s || "").replace(/\D/g, "");
  function buscarAnexo(M, termo) {
    const t = sem(termo).trim();
    if (!t) return M.anexo.slice();
    const d = soDig(t);
    return M.anexo.filter((l) => sem(l.ocupacao + " " + l.cnae + " " + l.descricao).includes(t) || (d.length >= 4 && soDig(l.cnae).startsWith(d)));
  }
  /* CNAEs digitados em P06 cruzados com o Anexo XI */
  function cnaes(M, R) {
    const v = valor(R, "M8.P06");
    if (!v || v === NS) return [];
    return [...new Set(v.match(CNAE) || [])].map((c) => {
      const d = soDig(c);
      return { cnae: c, linhas: M.anexo.filter((l) => soDig(l.cnae) === d) };
    });
  }

  /* ---- condições escritas pelo grupo ---- */
  function atomo(M, R, txt) {
    txt = txt.trim();
    if (/^sempre$/i.test(txt)) return true;
    const m = txt.match(/^(M8\.P\d{2})\s*(<=|>=|≤|≥|≠|=|<|>)\s*(.+)$/);
    if (!m) return false;
    const [, cod, op, alvo] = m;
    const v = valor(R, cod);
    if (v === undefined) return undefined;
    if (op === "=") return v === alvo.trim();
    if (op === "≠") return v !== alvo.trim() && v !== "";
    const n = parseFloat(String(v).replace(/\./g, "").replace(",", "."));
    if (v === NS || isNaN(n)) return false;
    const a = parseFloat(alvo);
    return op === "<=" || op === "≤" ? n <= a : op === ">=" || op === "≥" ? n >= a : op === "<" ? n < a : n > a;
  }
  function avaliar(M, R, cond) {
    const ou = String(cond || "").split(/\s+ou\s+(?=M8\.P)/);
    let indef = false;
    for (const parte of ou) {
      const es = parte.split(/\s+e\s+(?=M8\.P)/).map((a) => atomo(M, R, a));
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

  /* regras da aba 4 (vazia na v0.1; o motor já as aplica quando o grupo preencher) */
  function regrasAgora(M, R, cod) {
    return M.D.regras.filter((r) => {
      const rs = refs(r.condicao);
      return rs.includes(cod) && rs.every((c) => R[c] !== undefined) && avaliar(M, R, r.condicao) === true;
    });
  }
  const regrasTodas = (M, R) => M.D.regras.filter((r) => avaliar(M, R, r.condicao) === true);

  /* perguntas respondidas, na ordem, com o alerta da coluna I */
  const respondidas = (M, R) => M.perguntas.filter((q) => R[q.codigo] !== undefined);

  const semVazio = (rs, campo, nada) => [...new Set(rs.map((r) => r[campo]).filter((x) => x && x !== nada))];
  const lacunas = (rs) => semVazio(rs, "lacuna", "Nenhuma");
  const encaminhamentos = (rs) => semVazio(rs, "encaminhamento", "Nenhum");
  const alertas = (rs) => semVazio(rs, "alerta", "Nenhum");

  const API = { montar, valor, campo, temNaoSei, buscarAnexo, cnaes, avaliar, proxima, regrasAgora, regrasTodas,
                respondidas, lacunas, encaminhamentos, alertas, NS };
  if (typeof module !== "undefined") module.exports = API; else raiz.Motor = API;
})(this);
