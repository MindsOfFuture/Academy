/* Motor do Módulo 3. Lê as condições exatamente como o grupo escreveu na planilha
   (ex.: "Sempre", "M3.P.. > 0", "M3.P.. = X ou M3.P.. = Y")
   e decide quais perguntas aparecem e quais regras valem.
   Não cria texto: só escolhe entre os textos da planilha. */
(function (raiz) {
  "use strict";
  const NS = "Não sei";
  const COD = /M3\.P\d{2}/g;

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
    if (r.estado === "opcoes") return r.opcoes.join("; ");
    return r.estado === "opcao" ? r.opcao : String(r.valor ?? "").trim();
  }
  /* texto mostrado no resumo: a resposta + o que a pessoa escreveu no campo extra */
  function texto(R, cod) {
    const r = R[cod], v = valor(R, cod);
    if (!r || r.estado === "naosei" || r.estado === "valor") return v;
    const extra = [r.estado === "opcao" ? r.valor : "", r.detalhe].map((s) => String(s || "").trim()).filter(Boolean);
    return extra.length ? `${v} — ${extra.join(" — ")}` : v;
  }

  function campo(q) {
    if (/m[uú]ltipla/i.test(q.tipo)) return "multipla";
    if (/escolha|sele[cç][aã]o|sim\/n/i.test(q.tipo)) return "escolha";
    if (/inteiro/i.test(q.tipo)) return "inteiro";
    if (/n[uú]mero/i.test(q.tipo)) return "numero";
    /* texto livre com opções da planilha de caminhos (M3.P05): botões + campo de detalhe */
    if (q.caminhos && q.opcoesLista.length > 1 && !q.opcoesLista.includes("Texto livre")) return "escolhatexto";
    return "texto";
  }
  /* rótulo do botão "Não sei" dos campos abertos ("Não sei", "Não sei ainda") */
  const temNaoSei = (q) => ["texto", "numero", "inteiro"].includes(campo(q)) ? (q.opcoesLista.find((o) => /^Não sei/.test(o)) || null) : null;

  /* ---- caminhos por resposta (planilha m03_caminhos) ---- */
  const inteiroValido = (v) => /^\d+$/.test(String(v).trim());
  const GENERICOS = new Set(("comida comidas produto produtos servico servicos coisa coisas roupa roupas venda vendas loja lojas " +
    "negocio negocios alimento alimentos alimentacao doce doces bebida bebidas lanche lanches artesanato outro outros " +
    "varios varias qualquer geral algo tudo item itens mercadoria mercadorias").split(" "));
  const VAZIAS = new Set("de da do das dos e em para pra um uma o a os as com".split(" "));
  function generica(txt) {
    const t = String(txt || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
    if (t.replace(/\s+/g, " ").length < 10) return true;
    const pal = t.split(/[^a-z0-9]+/).filter((w) => w && !VAZIAS.has(w));
    return pal.length > 0 && pal.every((w) => GENERICOS.has(w));
  }
  function caminho(q, opcao, n) {
    const c = (q.caminhos || []).find((x) => x.opcao === opcao);
    return c ? { opcao: c.opcao, tipo: c.tipo, texto: n === undefined ? c.texto : c.texto.replace(/\[N\]/g, n) } : null;
  }
  /* retornos (título Dica/Resposta + texto literal) de uma resposta salva */
  function retornos(q, r) {
    if (!q.caminhos || !r) return [];
    const tipo = campo(q);
    let lista = [];
    if (r.estado === "naosei") lista = [caminho(q, temNaoSei(q) || NS)];
    else if (tipo === "texto") lista = [caminho(q, generica(r.valor) ? "Resposta muito genérica" : "Resposta preenchida")];
    else if (tipo === "inteiro") {
      const n = parseInt(r.valor, 10);
      lista = [n === 0 ? caminho(q, "0") : caminho(q, "1 ou mais", n)];
    } else if (r.estado === "opcoes") lista = q.opcoesLista.filter((o) => r.opcoes.includes(o)).map((o) => caminho(q, o));
    else if (r.estado === "opcao") lista = [caminho(q, r.opcao)];
    return lista.filter(Boolean);
  }

  /* ---- condições escritas pelo grupo ---- */
  function atomo(M, R, txt) {
    txt = txt.trim();
    if (/^sempre$/i.test(txt)) return true;
    const m = txt.match(/^(M3\.P\d{2})\s*(<=|>=|≤|≥|≠|=|<|>)\s*(.+)$/);
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
    const ou = String(cond || "").split(/\s+ou\s+(?=M3\.P)/);
    let indef = false;
    for (const parte of ou) {
      const es = parte.split(/\s+e\s+(?=M3\.P)/).map((a) => atomo(M, R, a));
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

  /* regras da aba 4 (sem regras na v0.1; o motor já as aplica quando o grupo preencher) */
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

  const API = { montar, valor, texto, campo, temNaoSei, inteiroValido, generica, caminho, retornos, avaliar, proxima, regrasAgora, regrasTodas,
                respondidas, lacunas, encaminhamentos, alertas, NS };
  if (typeof module !== "undefined") module.exports = API; else raiz.Motor = API;
})(this);
