/* Motor do Módulo 5 — lê o conteúdo da planilha (window.MODULO5) sem alterar
   nenhum texto. Aqui só há navegação, validação e conta. Funciona no navegador
   e no Node (para os testes). */
(function (raiz) {
  "use strict";

  const NAO_SEI = /n[ãa]o sab|n[ãa]o sei|n[ãa]o lembra|n[ãa]o informad|incomplet/i;

  function montar(D) {
    const ordem = [];          // perguntas na ordem da planilha (sem as linhas de seção)
    const porCodigo = {};
    let secao = "";
    D.perguntas.forEach((p) => {
      if (p.secao) { secao = p.secao; return; }
      const q = Object.assign({ secao }, p);
      q.opcoesLista = opcoes(q);
      ordem.push(q);
      porCodigo[q.codigo] = q;
    });
    const regrasDe = {};
    D.regras.forEach((r) => { (regrasDe[r.pergunta] = regrasDe[r.pergunta] || []).push(r); });
    const conceito = {};
    D.base.forEach((b) => { conceito[b.codigo] = b; });
    return { D, ordem, porCodigo, regrasDe, conceito };
  }

  /* "Sim / Não / Não sei" -> lista; "—" e "-" -> vazio */
  function opcoes(q) {
    const g = (q.opcoes || "").trim();
    if (!g || g === "—" || g === "-") return [];
    return g.split(" / ").map((s) => s.trim()).filter(Boolean);
  }

  /* Tipo de campo a partir da coluna Tipo da planilha */
  function campo(q) {
    const t = (q.tipo || "").toLowerCase();
    if (t.startsWith("escolha") || t === "sim/não") return "escolha";
    if (t === "lista de texto") return "lista";
    if (t.startsWith("lista + número")) return "lista-valor";   // nome + valor (P33)
    if (t.startsWith("lista +")) return "por-item-valor";       // um R$ por item da lista anterior
    if (t.startsWith("número + unidade")) return "por-item-unidade";
    if (t.startsWith("r$ + número")) return "pacote";
    if (t.startsWith("horas")) return "tempo";
    if (t === "percentual") return "percentual";
    if (t.startsWith("número")) return "numero";
    return "texto";
  }

  /* Botões extras de quem não sabe: os que a planilha lista em Opções
     (fora das escolhas) ou "Não sei" quando existe regra para isso. */
  function botoesAlternativos(M, q) {
    if (campo(q) === "escolha") return [];
    const ops = q.opcoesLista.filter((o) => !/^(kg|g|l|ml|unidade|outro)$/i.test(o));
    if (ops.length) return ops;
    const temRegra = (M.regrasDe[q.codigo] || []).some((r) => NAO_SEI.test(valorCond(r)));
    return temRegra ? ["Não sei"] : [];
  }

  function valorCond(r) {
    const c = r.condicao || "";
    const i = c.indexOf("=");
    return (i >= 0 ? c.slice(i + 1) : c).trim();
  }

  const rotulo = (op) => op.split(":")[0].trim();   // "Produto: eu compro..." -> "Produto"

  /* Escolhe a regra da aba 4 que corresponde à resposta */
  function regra(M, q, resp) {
    const rs = M.regrasDe[q.codigo] || [];
    if (!resp) return null;
    if (resp.estado === "opcao") {
      const alvo = rotulo(resp.opcao).toLowerCase();
      return rs.find((r) => valorCond(r).toLowerCase() === alvo)
        || rs.find((r) => /^ainda n/i.test(alvo) && /^ainda n/i.test(valorCond(r)))
        || rs.find((r) => alvo === "não sei" && NAO_SEI.test(valorCond(r)))
        || null;
    }
    if (resp.estado === "naosei") return rs.find((r) => NAO_SEI.test(valorCond(r))) || null;
    return rs.find((r) => !NAO_SEI.test(valorCond(r)) && !/^ainda n/i.test(valorCond(r))) || null;
  }

  /* Próxima pergunta: "Ir para Pxx" da regra; se não houver, a coluna
     Próximo passo da pergunta (com os desvios Sim/Não escritos pelo grupo). */
  function proxima(M, q, resp, r) {
    const cod = (s) => {
      const m = /P(\d{2})/.exec(s || "");
      return m ? "M5.P" + m[1] : null;
    };
    if (r && /permanecer/i.test(r.encaminhamento || "")) return q.codigo;
    if (r) {
      for (const s of [r.proximo, r.encaminhamento]) {
        if (/ir para p\d{2}/i.test(s || "")) return cod(s);
      }
    }
    const j = q.proximo || "";
    if (/resultado/i.test(j)) return "RESULTADO";
    const escolha = resp && resp.estado === "opcao" ? rotulo(resp.opcao) : resp && resp.estado === "naosei" ? "Não sei" : null;
    if (/[→]|\bse\b/.test(j) && escolha) {
      for (const parte of j.split(";")) {
        let conds, alvo;
        if (parte.includes("→")) { [conds, alvo] = parte.split("→"); }
        else { const m = /(P\d{2})\s+se\s+(.+)/.exec(parte); if (!m) continue; alvo = m[1]; conds = m[2]; }
        const lista = conds.split("/").map((s) => s.trim().toLowerCase());
        if (lista.includes(escolha.toLowerCase())) return cod(alvo);
      }
    }
    return cod(j);
  }

  /* ---------------- números e unidades ---------------- */
  function num(v) {
    if (v === null || v === undefined) return null;
    let s = String(v).trim().replace(/[R$\s%]/g, "");
    if (!s) return null;
    if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
    const n = Number(s);
    return isFinite(n) ? n : null;
  }
  const FAMILIA = { kg: ["massa", 1000], g: ["massa", 1], l: ["vol", 1000], ml: ["vol", 1], unidade: ["un", 1] };
  function base(q, u) {
    const f = FAMILIA[(u || "").toLowerCase()];
    return f ? { fam: f[0], v: q * f[1] } : { fam: "outro:" + (u || ""), v: q };
  }
  function compativel(u1, u2) {
    return base(1, u1).fam === base(1, u2).fam;
  }

  /* Validação a partir do texto da coluna Alerta da pergunta.
     Devolve o texto do grupo quando a resposta não passa; null se ok. */
  function validar(M, q, valor, R) {
    const msg = q.alerta || "";
    const c = campo(q);
    const falha = msg && msg !== "—" ? msg : "Preencha para continuar, ou use o botão de quem não sabe.";
    const neg = (n) => n !== null && n < 0;
    if (c === "texto") return String(valor || "").trim() ? null : falha;
    if (c === "lista") return (valor || []).filter((s) => s.trim()).length ? null : falha;
    if (c === "numero" || c === "percentual") {
      const n = num(valor);
      if (n === null) return falha;
      if (/maior que zero/i.test(msg) && n <= 0) return msg;
      if (/negativ/i.test(msg) && neg(n)) return msg;
      if (c === "percentual" && (n < 0 || n > 100)) return msg || falha;
      if (n < 0) return falha;
      return null;
    }
    if (c === "por-item-valor") {
      const ns = (valor || []).map(num);
      if (ns.some((n) => n === null)) return falha;
      if (ns.some(neg)) return msg && /negativ/i.test(msg) ? msg : falha;
      return null;
    }
    if (c === "por-item-unidade") {
      const vs = valor || [];
      if (vs.some((x) => num(x.q) === null || !x.u)) return falha;
      if (vs.some((x) => num(x.q) <= 0) && /maior que zero/i.test(msg)) return msg;
      if (vs.some((x) => num(x.q) < 0)) return falha;
      const ant = anteriorPorItem(M, q, R);
      if (ant && /compat/i.test(msg)) {
        const prev = R[ant.codigo] && R[ant.codigo].valor || [];
        if (vs.some((x, i) => prev[i] && !compativel(x.u, prev[i].u))) return msg;
      }
      return null;
    }
    if (c === "pacote") {
      const p = num(valor && valor.preco), n = num(valor && valor.qtd);
      if (p === null || n === null) return falha;
      if (n <= 0 && /maior que zero/i.test(msg)) return msg;
      if (p < 0 || n <= 0) return falha;
      return null;
    }
    if (c === "lista-valor") {
      const vs = (valor || []).filter((x) => (x.nome || "").trim() || (x.v || "").trim());
      if (!vs.length || vs.some((x) => !(x.nome || "").trim() || num(x.v) === null)) return falha;
      if (vs.some((x) => num(x.v) < 0)) return /negativ/i.test(msg) ? msg : falha;
      return null;
    }
    if (c === "tempo") {
      const h = num(valor && valor.h) || 0, m = num(valor && valor.m) || 0;
      return h * 60 + m > 0 && h >= 0 && m >= 0 ? null : falha;
    }
    return null;
  }

  /* Para P04-P06 / P20-P22: a lista de itens vem da última "Lista de texto" antes delas */
  function listaDeOrigem(M, q) {
    const i = M.ordem.indexOf(q);
    for (let k = i - 1; k >= 0; k--) if (campo(M.ordem[k]) === "lista") return M.ordem[k];
    return null;
  }
  function anteriorPorItem(M, q) {
    const i = M.ordem.indexOf(q);
    const k = i - 1;
    return k >= 0 && campo(M.ordem[k]) === "por-item-unidade" ? M.ordem[k] : null;
  }
  function itensDe(M, q, R) {
    const src = listaDeOrigem(M, q);
    const r = src && R[src.codigo];
    return r && r.valor ? r.valor.filter((s) => s.trim()) : [];
  }

  /* ---------------- conta do resultado ---------------- */
  function calcular(M, R) {
    const v = (c) => (R["M5." + c] && R["M5." + c].estado === "valor" ? R["M5." + c].valor : null);
    const op = (c) => (R["M5." + c] && R["M5." + c].estado === "opcao" ? rotulo(R["M5." + c].opcao) : null);
    const tipo = op("P01");
    const linhas = [];      // composição do custo de uma unidade
    const faltas = [];      // itens que não entraram por falta de dado

    function materiais(pLista, pPreco, pComprado, pUsado, divisor) {
      const nomes = (v(pLista) || (R["M5." + pLista] && R["M5." + pLista].valor) || []).filter((s) => s.trim());
      const precos = (R["M5." + pPreco] && R["M5." + pPreco].valor) || [];
      const comp = (R["M5." + pComprado] && R["M5." + pComprado].valor) || [];
      const usa = (R["M5." + pUsado] && R["M5." + pUsado].valor) || [];
      nomes.forEach((nome, i) => {
        const p = num(precos[i]), c = comp[i] && num(comp[i].q), u = usa[i] && num(usa[i].q);
        if (p === null || !c || u === null || !compativel(comp[i].u, usa[i].u)) { faltas.push(nome); return; }
        const usado = base(u, usa[i].u).v / base(c, comp[i].u).v;
        linhas.push({ nome, valor: (p * usado) / divisor });
      });
    }
    function pacote(cond, pPac) {
      if (op(cond) !== "Sim") return;
      const pk = v(pPac);
      if (pk && num(pk.qtd) > 0) linhas.push({ nome: "Embalagem", valor: num(pk.preco) / num(pk.qtd) });
      else faltas.push("Embalagem");
    }

    let nome = null;
    if (tipo === "Produto") {
      nome = v("P02");
      const n = num(v("P07"));
      if (n > 0) materiais("P03", "P04", "P05", "P06", n); else faltas.push("Quantidade produzida");
      pacote("P08", "P09");
    } else if (tipo === "Mercadoria") {
      nome = v("P10");
      const compra = num(v("P11")), qtd = num(v("P12"));
      const frete = op("P13") === "Sim" ? num(v("P14")) : 0;
      if (compra !== null && qtd > 0) {
        linhas.push({ nome: "Compra da mercadoria", valor: compra / qtd });
        if (frete) linhas.push({ nome: "Frete", valor: frete / qtd });
        else if (op("P13") === "Sim") faltas.push("Frete");
      } else faltas.push("Compra da mercadoria");
      pacote("P15", "P16");
    } else if (tipo === "Serviço") {
      nome = v("P17");
      if (op("P18") === "Sim") materiais("P19", "P20", "P21", "P22", 1);
    }
    const custoUnidade = linhas.reduce((s, l) => s + l.valor, 0);

    const preco = num(v("P36"));
    const taxaPct = op("P24") === "Sim" ? num(v("P25")) : 0;
    const taxa = preco !== null && taxaPct ? (preco * taxaPct) / 100 : 0;
    const mc = preco !== null ? preco - custoUnidade - taxa : null;
    const mcPct = mc !== null && preco > 0 ? (mc / preco) * 100 : null;

    const outros = (v("P33") || []).reduce((s, x) => s + (num(x.v) || 0), 0);
    const fixos = (num(v("P29")) || 0) + (num(v("P31")) || 0) + outros;
    const perdas = num(v("P27")) || 0;
    const trabalho = num(v("P35")) || 0;
    const mensal = fixos + perdas + trabalho;

    const qtd = num(v("P37"));
    const fat = preco !== null && qtd !== null ? preco * qtd : null;
    const resultado = fat !== null ? fat - (custoUnidade + taxa) * qtd - mensal : null;
    const pe = mc !== null && mc > 0 ? Math.ceil(mensal / mc) : null;

    let tempo = null;
    const t = v("P23");
    if (t) tempo = (num(t.h) || 0) * 60 + (num(t.m) || 0);

    return { tipo, nome, linhas, faltas, custoUnidade, preco, taxaPct, taxa, mc, mcPct,
      fixos, outros, perdas, trabalho, mensal, qtd, fat, resultado, pe, tempo };
  }

  const API = { montar, campo, opcoes, botoesAlternativos, regra, proxima, validar, calcular,
    itensDe, listaDeOrigem, num, compativel, valorCond };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  else raiz.Motor = API;
})(typeof window !== "undefined" ? window : globalThis);
