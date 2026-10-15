/* Motor do Módulo 1. Decide quais perguntas aparecem a partir da "condicao" de cada
   pergunta ('sempre' ou 'M1.P05 = "Até 1 hora por dia" ou M1.P05 = "Só nos fins de semana"').
   Não cria texto: só escolhe entre os textos dos dados. */
(function (raiz) {
  "use strict";
  const COD = /M1\.P\d{2}A?/g;

  function montar(D) {
    const perguntas = D.perguntas.filter((p) => p.codigo);
    const porCodigo = {};
    perguntas.forEach((p) => { porCodigo[p.codigo] = p; });
    return { D, perguntas, porCodigo };
  }

  /* resposta guardada -> texto para comparar e exibir */
  function valor(R, cod) {
    const r = R[cod];
    if (!r) return undefined;
    if (r.estado === "naosei") return r.texto;
    if (r.estado === "opcao") return r.opcao;
    return String(r.valor ?? "").trim();
  }
  /* uma resposta está completa quando dá para seguir (Continuar aceso) */
  function completa(q, r) {
    if (!r) return false;
    if (r.estado === "naosei") return true;
    if (r.estado === "valor") return !!String(r.valor || "").trim();
    if (r.estado === "opcao") {
      const op = (q.opcoes || []).find((o) => o.texto === r.opcao);
      if (!op) return false;
      return op.campo ? !!String(r.detalhe || "").trim() : true;
    }
    return false;
  }

  function atomo(R, txt) {
    txt = txt.trim();
    if (/^sempre$/i.test(txt)) return true;
    const m = txt.match(/^(M1\.P\d{2}A?)\s*=\s*"(.*)"$/);
    if (!m) return false;
    const v = valor(R, m[1]);
    if (v === undefined) return undefined;
    return v === m[2];
  }
  function avaliar(R, cond) {
    let indef = false;
    for (const parte of String(cond || "").split(/\s+ou\s+(?=M1\.P)/i)) {
      const es = parte.split(/\s+e\s+(?=M1\.P)/i).map((a) => atomo(R, a));
      if (es.every((x) => x === true)) return true;
      if (es.some((x) => x === undefined) && !es.some((x) => x === false)) indef = true;
    }
    return indef ? undefined : false;
  }
  const refs = (txt) => [...new Set(String(txt || "").match(COD) || [])];

  /* próxima pergunta: a primeira depois de `cod` cuja condição vale */
  function proxima(M, R, cod) {
    const i = cod ? M.perguntas.findIndex((p) => p.codigo === cod) : -1;
    for (let j = i + 1; j < M.perguntas.length; j++) {
      if (avaliar(R, M.perguntas[j].condicao) === true) return M.perguntas[j].codigo;
    }
    return "RESULTADO";
  }
  /* caminho previsto com as respostas de agora (extras ainda indefinidas ficam de fora) */
  function caminho(M, R) {
    const lista = [];
    let cod = proxima(M, R, null);
    while (cod !== "RESULTADO" && lista.length < 50) { lista.push(cod); cod = proxima(M, R, cod); }
    return lista;
  }

  /* texto da pergunta; a Pergunta 4 repete a resposta da Pergunta 3 quando houver */
  function textoPergunta(M, R, q) {
    const pr = q.pergunta_com_resposta;
    if (pr) {
      const r = R[pr.de];
      if (r && r.estado === "valor") {
        let t = String(r.valor || "").trim().replace(/[.!?;:,]+$/, "").trim();
        if (/^[A-ZÀ-Ý][a-zà-ÿ]/.test(t)) t = t[0].toLowerCase() + t.slice(1);
        if (t) return pr.modelo.replace("{resposta}", t);
      }
    }
    return q.pergunta;
  }

  const regrasTodas = (M, R) => (M.D.regras || []).filter((r) => avaliar(R, r.condicao) === true);

  /* retrato: as respostas do usuário, na ordem do fluxo */
  function retrato(M, R) {
    return caminho(M, R).filter((c) => R[c] !== undefined).map((c) => {
      const q = M.porCodigo[c], r = R[c];
      return { q, pergunta: textoPergunta(M, R, q), valor: valor(R, c), detalhe: r.detalhe || "",
        naosei: r.estado === "naosei" || valor(R, c) === "Não sei dizer" };
    });
  }

  const API = { montar, valor, completa, avaliar, proxima, caminho, textoPergunta, regrasTodas, retrato, refs };
  if (typeof module !== "undefined") module.exports = API; else raiz.Motor = API;
})(this);
