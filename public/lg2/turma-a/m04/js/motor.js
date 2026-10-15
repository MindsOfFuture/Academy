/* Motor do Módulo 4. Lê as condições exatamente como o grupo escreveu na planilha
   (ex.: "Sempre", "M4.P.. > 3", "M4.P.. = X ou M4.P.. = Y", "M4.P.. preenchida")
   e decide quais perguntas aparecem e quais regras valem.
   Onde a condição da planilha cita uma opção ou pergunta que mudou de nome, o extrator
   grava a leitura usada pelo app em `condicao_app` (o texto do grupo fica em `condicao`).
   Não cria texto: só escolhe entre os textos da planilha. */
(function (raiz) {
  "use strict";
  const NS = "Não sei";
  const COD = /M4\.P\d{2}/g;
  const lista = (s) => String(s || "").split(";").map((x) => x.trim()).filter(Boolean);

  function montar(D) {
    const perguntas = D.perguntas.filter((p) => p.codigo);
    const porCodigo = {};
    perguntas.forEach((p) => {
      p.opcoesLista = lista(p.opcoes);
      (p.variantes || []).forEach((v) => (v.opcoesLista = lista(v.opcoes)));
      porCodigo[p.codigo] = p;
    });
    return { D, perguntas, porCodigo };
  }
  const cond = (x) => (x.condicao_app !== undefined ? x.condicao_app : x.condicao);

  /* versão da pergunta que vale para as respostas atuais (M4.P14 tem uma versão para serviço) */
  function versao(M, R, q) {
    const v = (q.variantes || []).find((x) => avaliar(M, R, x.condicao_app) === true);
    return v ? { pergunta: v.pergunta, opcoesLista: v.opcoesLista, variante: true }
             : { pergunta: q.pergunta, opcoesLista: q.opcoesLista, variante: false };
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

  /* ---- condições escritas pelo grupo ---- */
  const norm = (s) => String(s).replace(/\s+/g, "").toLowerCase();
  function atomo(M, R, txt) {
    txt = String(txt || "").trim();
    if (/^sempre$/i.test(txt)) return true;
    const pre = txt.match(/^(M4\.P\d{2})\s+preenchida/i);
    if (pre) { const v = valor(R, pre[1]); return v === undefined ? undefined : v !== NS && v !== ""; }
    const m = txt.match(/^(M4\.P\d{2})\s*(<=|>=|≤|≥|≠|=|<|>)\s*(.+)$/);
    if (!m) return false;
    const [, cod, op, alvo] = m;
    const v = valor(R, cod);
    if (v === undefined) return undefined;
    if (op === "=") return norm(v) === norm(alvo);
    if (op === "≠") return norm(v) !== norm(alvo) && v !== "";
    const n = parseFloat(String(v).replace(/\./g, "").replace(",", "."));
    if (v === NS || isNaN(n)) return false;
    const a = parseFloat(alvo);
    return op === "<=" || op === "≤" ? n <= a : op === ">=" || op === "≥" ? n >= a : op === "<" ? n < a : n > a;
  }
  function avaliar(M, R, c) {
    const ou = String(c || "").split(/\s+ou\s+(?=M4\.P)/);
    let indef = false;
    for (const parte of ou) {
      const es = parte.split(/\s+e\s+(?=M4\.P)/).map((a) => atomo(M, R, a));
      if (es.every((x) => x === true)) return true;
      if (es.some((x) => x === undefined) && !es.some((x) => x === false)) indef = true;
    }
    return indef ? undefined : false;
  }
  const refs = (txt) => [...new Set(String(txt || "").match(COD) || [])];

  function proxima(M, R, cod) {
    const i = cod ? M.perguntas.findIndex((p) => p.codigo === cod) : -1;
    for (let j = i + 1; j < M.perguntas.length; j++) {
      if (avaliar(M, R, cond(M.perguntas[j])) === true) return M.perguntas[j].codigo;
    }
    return "RESULTADO";
  }

  /* regras da aba 4 */
  function regrasAgora(M, R, cod) {
    return M.D.regras.filter((r) => {
      const rs = refs(cond(r));
      return rs.includes(cod) && rs.every((c) => R[c] !== undefined) && avaliar(M, R, cond(r)) === true;
    });
  }
  const regrasTodas = (M, R) => M.D.regras.filter((r) => avaliar(M, R, cond(r)) === true);

  /* retorno condicional escrito pelo grupo (ex.: M4.P15 "se a resposta for Sim ou Não sei") */
  const retornoSe = (q, v) => (q.retorno_se && q.retorno_se.valores.includes(v) ? q.retorno_se.texto : "");

  /* perguntas respondidas, na ordem */
  const respondidas = (M, R) => M.perguntas.filter((q) => R[q.codigo] !== undefined);

  const nada = (x) => !x || /^nenhum[a]?\.?$/i.test(String(x).trim());
  const semVazio = (rs, c) => [...new Set(rs.map((r) => r[c]).filter((x) => !nada(x)))];
  const lacunas = (rs) => semVazio(rs, "lacuna");
  const encaminhamentos = (rs) => semVazio(rs, "encaminhamento");
  const alertas = (rs) => semVazio(rs, "alerta");

  const API = { montar, versao, valor, campo, temNaoSei, avaliar, proxima, regrasAgora, regrasTodas,
                retornoSe, respondidas, lacunas, encaminhamentos, alertas, NS, cond };
  if (typeof module !== "undefined") module.exports = API; else raiz.Motor = API;
})(this);
