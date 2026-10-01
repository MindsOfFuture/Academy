/* Motor do Módulo 1. Lê as condições da coluna F exatamente como o grupo escreveu
   ("sempre", 'M1.P04 = "3. Nenhuma experiência"', 'M1.P07 = 0 OU M1.P06 = "3"')
   e decide quais perguntas aparecem. Não cria texto: só escolhe entre os textos da planilha.
   A aba 4 (regras) veio vazia: o retorno de cada pergunta é o da própria aba 3 (H e I). */
(function (raiz) {
  "use strict";
  const NS = "Não sei";
  const COD = /M1\.P\d{2}(?:\.\d+)?/g;            // aceita M1.P04 e M1.P04.1
  const MARCADOR = /^\[Campo (de texto|numérico)\]$/i;

  function montar(D) {
    const perguntas = D.perguntas.filter((p) => p.codigo);
    const porCodigo = {};
    perguntas.forEach((p) => {
      const partes = String(p.opcoes || "").split("|").map((s) => s.trim()).filter(Boolean);
      p.marcador = partes.find((s) => MARCADOR.test(s)) || null;   // "[Campo de texto]" = campo livre, não opção
      p.opcoesLista = partes.filter((s) => !MARCADOR.test(s));
      porCodigo[p.codigo] = p;
    });
    return { D, perguntas, porCodigo };
  }

  /* número da opção ("3. Nenhuma experiência" -> "3") e texto sem o número (só exibição) */
  const numero = (op) => (String(op).match(/^(\d+)\.\s/) || [])[1] || null;
  const rotulo = (op) => String(op).replace(/^\d+\.\s+/, "");

  function campo(q) {
    if (q.marcador) return /num/i.test(q.marcador) || /n[uú]mero/i.test(q.tipo) ? "numero" : "texto";
    if (/escolha|sim\/n/i.test(q.tipo)) return "escolha";
    if (/n[uú]mero/i.test(q.tipo)) return "numero";
    return "texto";
  }
  /* botão "Não sei" fora da lista (campos de texto e número) */
  const temNaoSei = (q) => campo(q) !== "escolha" && q.opcoesLista.includes(NS);

  function valor(R, cod) {
    const r = R[cod];
    if (!r) return undefined;
    if (r.estado === "naosei") return NS;
    return r.estado === "opcao" ? r.opcao : String(r.valor ?? "").trim();
  }
  const num = (v) => parseFloat(String(v).replace(/\./g, "").replace(",", "."));

  function atomo(M, R, txt) {
    txt = txt.trim();
    if (/^sempre$/i.test(txt)) return true;
    const m = txt.match(/^(M1\.P\d{2}(?:\.\d+)?)\s*=\s*(.+)$/);
    if (!m) return false;
    const [, cod, bruto] = m;
    const alvo = bruto.trim().replace(/^"(.*)"$/, "$1");
    const v = valor(R, cod);
    if (v === undefined) return undefined;
    const q = M.porCodigo[cod];
    if (campo(q) === "escolha") {
      if (/^\d+$/.test(alvo)) return numero(v) === alvo;     // 'M1.P06 = "3"' = opção número 3
      return v === alvo;                                      // texto completo da opção
    }
    if (campo(q) === "numero") {
      if (v === NS) return alvo === NS;
      return !isNaN(num(v)) && !isNaN(num(alvo)) ? num(v) === num(alvo) : v === alvo;
    }
    return v === alvo;
  }
  function avaliar(M, R, cond) {
    const ou = String(cond || "").split(/\s+ou\s+(?=M1\.P)/i);   // "OU" maiúsculo na planilha
    let indef = false;
    for (const parte of ou) {
      const es = parte.split(/\s+e\s+(?=M1\.P)/i).map((a) => atomo(M, R, a));
      if (es.every((x) => x === true)) return true;
      if (es.some((x) => x === undefined) && !es.some((x) => x === false)) indef = true;
    }
    return indef ? undefined : false;
  }
  const refs = (txt) => [...new Set(String(txt || "").match(COD) || [])];

  /* próxima pergunta: a primeira depois de `cod` cuja condição (coluna F) vale */
  function proxima(M, R, cod) {
    const i = cod ? M.perguntas.findIndex((p) => p.codigo === cod) : -1;
    for (let j = i + 1; j < M.perguntas.length; j++) {
      if (avaliar(M, R, M.perguntas[j].condicao) === true) return M.perguntas[j].codigo;
    }
    return "RESULTADO";
  }

  /* regras da aba 4 (vazia nesta versão; o motor já as aplicaria se viessem) */
  function regrasAgora(M, R, cod) {
    return M.D.regras.filter((r) => {
      const rs = refs(r.condicao);
      return rs.includes(cod) && rs.every((c) => R[c] !== undefined) && avaliar(M, R, r.condicao) === true;
    });
  }
  const regrasTodas = (M, R) => M.D.regras.filter((r) => avaliar(M, R, r.condicao) === true);

  /* retrato inicial: só as respostas do usuário, na ordem do fluxo, com os textos do grupo */
  function retrato(M, R) {
    return M.perguntas.filter((q) => R[q.codigo] !== undefined).map((q) => {
      const v = valor(R, q.codigo);
      return { q, valor: v, naosei: v === NS || numero(v) && rotulo(v) === NS };
    });
  }

  const API = { montar, valor, campo, temNaoSei, numero, rotulo, avaliar, proxima, regrasAgora, regrasTodas, retrato, refs, NS };
  if (typeof module !== "undefined") module.exports = API; else raiz.Motor = API;
})(this);
