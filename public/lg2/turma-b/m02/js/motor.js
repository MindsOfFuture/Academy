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

  /* pergunta de várias respostas ("Múltipla escolha" na planilha): guarda {estado:"opcao", opcao: a 1ª marcada,
     opcoes: [todas, na ordem da lista], detalhe: o que a pessoa escreveu em "Outra"} */
  const multipla = (q) => /m[uú]ltipla/i.test(String(q && q.tipo));
  const OUTRA = "Outra";
  const itens = (r) => (r && Array.isArray(r.opcoes) ? r.opcoes : r && r.opcao ? [r.opcao] : [])
    .map((o) => (o === OUTRA && String(r.detalhe || "").trim() ? `${OUTRA}: ${String(r.detalhe).trim()}` : o));
  function valor(R, cod) {
    const r = R[cod];
    if (!r) return undefined;
    if (r.estado === "naosei") return NS;
    if (r.estado === "opcao" && Array.isArray(r.opcoes)) return itens(r).join("; ");
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
    /* várias respostas: "=" vale se a opção estiver entre as marcadas */
    const r = R[cod];
    if (r.estado === "opcao" && Array.isArray(r.opcoes) && (op === "=" || op === "≠")) return op === "=" ? r.opcoes.includes(a) : !r.opcoes.includes(a);
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
  function quadro(fichas, modelo) {
    const c = { forte: 0, fraco: 0, nenhum: 0 };
    const motivos = {};
    (fichas || []).forEach((f) => {
      if (c[f.sinal] !== undefined) c[f.sinal]++;
      const m = String(f.motivo || "").trim();
      if (m) motivos[m.toLowerCase()] = { t: m, n: ((motivos[m.toLowerCase()] || {}).n || 0) + 1 };
    });
    const total = (fichas || []).length;
    const top = Object.values(motivos).sort((a, b) => b.n - a.n)[0] || null;
    /* frase no formato do exemplo do grupo (aba 5, M2.I04, saída esperada): só os números
       do início mudam; o resto da frase vem literal da planilha (modelo = ex_saida) */
    const pct = total ? Math.floor((c.forte / total) * 100) : 0;
    const m = String(modelo || "").replace(/^["“\s]+|["”\s]+$/g, "").match(/^\d+ de \d+ pessoas \(\d+%\)(.*)$/);
    const frase = total ? `${c.forte} de ${total} pessoas (${pct}%)${m ? m[1] : ""}` : "";
    return { contagem: c, total, pct, motivo: top, frase };
  }

  /* ---- M2.I05 (aba 5): soma as três notas (1 a 3) e ordena do maior para o menor ---- */
  function segmentos(grupos) {
    return (grupos || []).map((g, i) => {
      const notas = [g.alcancar, g.necessidade, g.pagar].map((x) => parseInt(x, 10));
      const completo = notas.every((x) => x >= 1 && x <= 3);
      return Object.assign({}, g, { i, total: completo ? notas.reduce((a, b) => a + b, 0) : null });
    }).sort((a, b) => (b.total ?? -1) - (a.total ?? -1));
  }

  /* ---- caminho estimado: as perguntas que a pessoa verá, assumindo a 1ª opção nas que ainda
     não respondeu (é o caminho mais comum). Serve para o "Pergunta X de Y" mostrar o tamanho
     real do percurso dela, e não as 21 perguntas de todos os ramos. ---- */
  function caminho(M, R) {
    const Rs = Object.assign({}, R), lista = [];
    let cod = proxima(M, Rs, null);
    while (cod !== "RESULTADO" && lista.length < M.perguntas.length) {
      lista.push(cod);
      if (Rs[cod] === undefined) {
        const q = M.porCodigo[cod], t = campo(q);
        Rs[cod] = t === "escolha" ? { estado: "opcao", opcao: q.opcoesLista[0] } : { estado: "valor", valor: t === "numero" ? "1" : "x" };
      }
      cod = proxima(M, Rs, cod);
    }
    return lista;
  }

  /* ---- textos na tela sem códigos internos ("(M2.I01)", "M2.P08"): a pessoa não sabe o que são.
     Código solto no meio da frase vira o assunto da pergunta ("a pergunta sobre…"); código de qualquer
     módulo (M1.P03, M3-02…) entre parênteses sai, e solto vira "uma pergunta anterior". ---- */
  const TEMA = {
    "M2.P01": "quem seria o principal comprador", "M2.P02": "quem teria mais interesse em comprar", "M2.P03": "de onde vem o que você sabe sobre o público",
    "M2.P04": "conversas com possíveis clientes", "M2.P05": "quantos grupos de clientes você imagina", "M2.P06": "os grupos que você imagina",
    "M2.P07": "se os clientes são pessoas ou empresas", "M2.P08": "o que mais muda entre um cliente e outro", "M2.P09": "a fase da vida dos clientes",
    "M2.P10": "como os clientes reagem ao preço", "M2.P11": "onde estão os clientes", "M2.P12": "em que situação os clientes compram",
    "M2.P13": "o que pesa na escolha dos clientes", "M2.P14": "o tipo de empresa que compraria de você", "M2.P15": "por qual grupo começar",
    "M2.P16": "como chegar até os clientes", "M2.P17": "a frequência de compra", "M2.P18": "quantas pessoas você já ouviu",
    "M2.P19": "se alguém já tomou uma ação concreta", "M2.P20": "o motivo para escolherem você", "M2.P21": "se contaram um problema de verdade",
  };
  const CODIGO = /\bM\d{1,2}\s*[.\-]\s*[PIRT]\s*\d{1,2}[A-Za-z]?\b/;
  function limpa(t) {
    return String(t ?? "")
      .replace(/\s*\([^()]*\bM\d{1,2}\s*[.\-]\s*[PIRT]\s*\d{1,2}[^()]*\)/g, "")
      .replace(/\b(M2\.P\d{2})\b/g, (c) => (TEMA[c] ? `a pergunta sobre ${TEMA[c]}` : "uma pergunta anterior"))
      .replace(new RegExp(CODIGO.source, "g"), "uma pergunta anterior")
      .replace(/\s+([.,;:])/g, "$1");
  }

  const semVazio = (rs, campo, nada) => [...new Set(rs.map((r) => r[campo]).filter((x) => x && x !== nada))];
  const lacunas = (rs) => semVazio(rs, "lacuna", "Nenhuma");
  const encaminhamentos = (rs) => semVazio(rs, "encaminhamento", "Nenhum");
  const alertas = (rs) => semVazio(rs, "alerta", "Nenhum");
  const proximos = (rs) => semVazio(rs, "proximo", "Nenhum");

  const API = { montar, valor, itens, multipla, OUTRA, CODIGO, campo, temNaoSei, avaliar, proxima, regrasAgora, regrasTodas, quadro, segmentos, SINAIS, caminho, limpa,
                lacunas, encaminhamentos, alertas, proximos, NS };
  if (typeof module !== "undefined") module.exports = API; else raiz.Motor = API;
})(this);
