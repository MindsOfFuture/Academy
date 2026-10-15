/* Motor do Módulo 6 (versão A). Lê as condições exatamente como o grupo escreveu:
   coluna F da aba 3 ("sempre", "M6.P01 ≠ Não sei", "Negócio = Serviço") decide se a pergunta aparece;
   colunas B e C da aba 4 ("Resposta = “Não sei”", "Valor igual a zero", "Resposta vazia, negativa ou
   inválida", "Sim, sem detalhes", "À vista") decidem qual regra vale. Não cria texto: só escolhe entre
   os da planilha. As contas de caixa seguem as fórmulas escritas na aba 5 (M6.I01, I03, I04, I05). */
(function (raiz) {
  "use strict";
  const NS = "Não sei";
  const COD = /M6\.P\d{2}/g;
  const NEGOCIO = "Negócio";

  /* Leituras do app para condições que citam algo que a planilha não tem (relatadas ao grupo):
     - "M01 ≠ Não sei" (M6.P17): a pergunta anterior da seção MERCADORIA é a M6.P16.
     - "De 8 a 30 dias" (M6.R30): a opção da M6.P08 é "8 a 30 dias". */
  const LEITURA_COND = { "M01 ≠ Não sei": "M6.P16 ≠ Não sei" };
  const LEITURA_OPCAO = { "De 8 a 30 dias": "8 a 30 dias" };

  const aspas = (s) => (String(s || "").match(/“([^”]+)”/g) || []).map((x) => x.slice(1, -1).trim());
  const regrasDe = (D, cod) => D.regras.filter((r) => r.codigo && r.pergunta === cod);

  function montar(D) {
    const perguntas = D.perguntas.filter((p) => p.codigo);
    perguntas.forEach((p) => {
      p.opcoesLista = String(p.opcoes || "").split(";").map((s) => s.trim()).filter(Boolean);
      const rs = regrasDe(D, p.codigo);
      /* regras que falam de várias opções marcadas ("Uma ou mais formas", "junto com outras opções") */
      p.multi = rs.some((r) => /junto com outras op|^Uma ou mais/i.test(r.condicao || ""));
      /* pergunta de texto cujas regras pedem "Sim, com detalhes" / "Sim, sem detalhes" / "Não":
         os botões vêm do texto da regra de resposta vazia (“Sim”, “Não” ou “Não sei”) */
      if (rs.some((r) => /^Sim, (com|sem) detalhes/i.test(r.condicao || ""))) {
        const vazia = rs.find((r) => /^Resposta vazia/i.test(r.condicao || ""));
        p.simNaoDetalhe = true;
        p.opcoesLista = vazia ? aspas(vazia.texto) : ["Sim", "Não", NS];
      }
    });
    /* A coluna F usa "Negócio = Serviço / Produto / Mercadoria", mas nenhuma pergunta coleta o tipo de
       negócio. O app pergunta isso uma vez, antes da primeira seção que depende dele, só com os valores
       escritos nas condições. */
    const deps = perguntas.filter((p) => new RegExp("^" + NEGOCIO + "\\s*=").test(p.condicao || ""));
    if (deps.length) {
      const ops = [...new Set(deps.map((p) => p.condicao.split("=")[1].trim()))];
      const neg = { codigo: NEGOCIO, pergunta: NEGOCIO, tipo: "Escolha", condicao: "sempre", opcoesLista: ops, app: true };
      perguntas.splice(perguntas.indexOf(deps[0]), 0, neg);
    }
    const porCodigo = {};
    perguntas.forEach((p) => (porCodigo[p.codigo] = p));
    const instr = {};
    D.instrumentos.forEach((i) => { if (i.codigo) instr[i.codigo] = i; });
    return { D, perguntas, porCodigo, instr };
  }

  function valorDe(r) {
    if (!r) return undefined;
    if (r.estado === "naosei") return NS;
    if (r.estado === "multi") return r.opcoes.length === 1 && r.opcoes[0] === NS ? NS : r.opcoes.join("; ");
    if (r.estado === "opcao") return r.opcao;
    return String(r.valor ?? "").trim();
  }
  const valor = (R, cod) => valorDe(R[cod]);

  function campo(q) {
    if (q.simNaoDetalhe) return "simnao_texto";
    if (q.multi) return "multi";
    if (/escolha|sim\/n/i.test(q.tipo)) return "escolha";
    if (/n[uú]mero/i.test(q.tipo)) return "numero";
    return "texto";
  }
  const temNaoSei = (q) => !["escolha", "multi", "simnao_texto"].includes(campo(q)) && q.opcoesLista.includes(NS);
  /* "R$ 5.000", "1.500,50", "2000", "-3" -> número */
  function num(v) {
    let s = String(v ?? "").replace(/[^\d,.-]/g, "");
    if (/,\d{1,2}$/.test(s)) s = s.replace(/\./g, "").replace(",", ".");
    else if (/^-?\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, "");
    else s = s.replace(/,/g, "");
    return s === "" || s === "-" ? NaN : parseFloat(s);
  }
  /* estado de um envio: vazia, invalida, negativa ou o próprio valor */
  function envio(q, bruto) {
    const v = String(bruto ?? "").trim();
    if (!v) return { estado: "vazia" };
    if (campo(q) === "numero") {
      const n = num(v);
      if (isNaN(n)) return { estado: "invalida", valor: v };
      if (n < 0) return { estado: "negativa", valor: v };
    }
    return { estado: "valor", valor: v };
  }
  const valido = (r) => !!r && !["vazia", "invalida", "negativa"].includes(r.estado);

  /* ---- coluna F da aba 3 ---- */
  function atomo(R, txt) {
    txt = txt.trim();
    if (/^sempre$/i.test(txt)) return true;
    const m = txt.match(/^(M6\.P\d{2}|Negócio)\s*(≠|=)\s*(.+)$/);
    if (!m) return false;
    const v = valor(R, m[1]);
    if (v === undefined) return undefined;
    return m[2] === "=" ? v === m[3].trim() : v !== m[3].trim();
  }
  function avaliar(R, cond0) {
    const cond = LEITURA_COND[String(cond0 || "").trim()] || cond0;
    let indef = false;
    for (const parte of String(cond || "").split(/\s+ou\s+(?=M6\.P|Negócio)/)) {
      const es = parte.split(/\s+e\s+(?=M6\.P|Negócio)/).map((a) => atomo(R, a));
      if (es.every((x) => x === true)) return true;
      if (es.some((x) => x === undefined) && !es.some((x) => x === false)) indef = true;
    }
    return indef ? undefined : false;
  }
  function proxima(M, R, cod) {
    const i = cod ? M.perguntas.findIndex((p) => p.codigo === cod) : -1;
    for (let j = i + 1; j < M.perguntas.length; j++)
      if (avaliar(R, M.perguntas[j].condicao) === true) return M.perguntas[j].codigo;
    return "RESULTADO";
  }

  /* ---- coluna C da aba 4: condição sobre a resposta da pergunta da coluna B ---- */
  function casa(c0, r) {
    if (!r) return false;
    const c = String(c0 || "").trim(), e = r.estado;
    const soNS = valorDe(r) === NS;
    const n = e === "valor" ? num(r.valor) : NaN;
    if (/^Resposta vazia|^Nenhuma resposta/i.test(c))
      return e === "vazia" || (e === "negativa" && /negativa|inv[aá]lid/i.test(c)) || (e === "invalida" && /inv[aá]lid/i.test(c));
    if (!valido(r)) return false;
    if (/^Resposta diferente de/i.test(c)) return !aspas(c).includes(valorDe(r));
    if (/sem outras op/i.test(c)) return soNS;                                        // “Não sei” selecionado, sem outras opções
    if (/junto com outras op/i.test(c)) return e === "multi" && r.opcoes.includes(NS) && r.opcoes.length > 1;
    if (/^Uma ou mais/i.test(c)) return e === "multi" && r.opcoes.some((o) => o !== NS);
    if (/^Sim, com detalhes/i.test(c)) return r.opcao === "Sim" && !!String(r.detalhe || "").trim();
    if (/^Sim, sem detalhes/i.test(c)) return r.opcao === "Sim" && !String(r.detalhe || "").trim();
    if (/maior que zero/i.test(c)) return n > 0;
    if (/igual a zero/i.test(c)) return n === 0;
    if (/v[aá]lidos informados/i.test(c)) return n >= 0;
    if (/^Resposta preenchida|^Lista de .+ informada/i.test(c)) return e === "valor" && !soNS;
    const alvos = aspas(c).length ? aspas(c) : [LEITURA_OPCAO[c] || c];
    return alvos.includes(valorDe(r));      // "À vista", "Não", "Resposta = “Não sei”", "“Não sei”"
  }
  const regrasPara = (M, cod, r) => regrasDe(M.D, cod).filter((x) => casa(x.condicao, r));
  const regrasAgora = (M, R, cod) => regrasPara(M, cod, R[cod]);
  const regrasTodas = (M, R) => M.D.regras.filter((x) => x.codigo && casa(x.condicao, R[x.pergunta]));
  /* "Retornar à P02." no encaminhamento = fica na pergunta (comportamento, não texto exibido) */
  const retorna = (r) => /^Retornar à /i.test(String(r.encaminhamento || "").trim());

  const semVazio = (rs, campo, nada) => [...new Set(rs.map((r) => r[campo]).filter((x) => x && x !== nada))];
  const lacunas = (rs) => semVazio(rs, "lacuna", "Nenhuma");
  const encaminhamentos = (rs) => semVazio(rs.filter((r) => !retorna(r)), "encaminhamento", "Nenhum");
  const alertas = (rs) => semVazio(rs, "alerta", "Nenhum");

  /* ---- cálculos da aba 5 ---- */
  const numDe = (R, cod) => { const v = valor(R, cod); return v === undefined || v === NS ? null : num(v); };

  /* M6.I01: "Investimento inicial = soma dos valores dos equipamentos + instalações + estoque inicial +
     outros gastos". Valores perguntados: P02 (geral), P11 (serviço), P14 (produto), P17 (mercadoria). */
  const PARTES_INVEST = ["M6.P02", "M6.P11", "M6.P14", "M6.P17"];
  function investimento(R) {
    const partes = PARTES_INVEST.map((c) => ({ codigo: c, valor: numDe(R, c) })).filter((p) => p.valor !== null);
    return { valor: partes.length ? partes.reduce((a, p) => a + p.valor, 0) : null, partes, forma: valor(R, "M6.P03") };
  }

  /* prazo de recebimento (P08) -> semana do fluxo de 13 semanas (só pré-preenchimento; editável) */
  const SEMANA = { "À vista": 1, "Na hora": 1, "Até 7 dias": 2, "8 a 30 dias": 5, "Mais de 30 dias": 6 };
  const semanaDe = (v) => SEMANA[v] || null;

  /* M6.I04: monta as 13 semanas a partir das respostas. A v0.2 não tem pergunta de prazo de
     pagamento: o investimento entra na semana 1. */
  function fluxoInicial(R) {
    const sem = Array.from({ length: 13 }, () => ({ entradas: 0, saidas: 0 }));
    const inv = investimento(R);
    const sPag = 1;
    const sRec = semanaDe(valor(R, "M6.P08")) || 1;
    if (inv.valor) sem[sPag - 1].saidas += inv.valor;
    const vendas = numDe(R, "M6.P05");
    if (vendas) sem[sRec - 1].entradas += vendas;
    return { saldoInicial: numDe(R, "M6.P07") || 0, semanas: sem, semanaPagamento: sPag, semanaRecebimento: sRec };
  }
  /* "Saldo final da semana = saldo inicial da semana + entradas previstas − saídas previstas.
      O saldo final de uma semana passa a ser o saldo inicial da semana seguinte." */
  function projetar(F) {
    let saldo = F.saldoInicial;
    return F.semanas.map((s, i) => {
      const ini = saldo;
      saldo = ini + (s.entradas || 0) - (s.saidas || 0);
      /* limite do I04: "Alertar quando as saídas previstas forem maiores que os recursos disponíveis no período." */
      return { semana: i + 1, inicial: ini, entradas: s.entradas || 0, saidas: s.saidas || 0, final: saldo,
               alerta: (s.saidas || 0) > 0 && (s.saidas || 0) > ini + (s.entradas || 0) };
    });
  }
  /* M6.I03: "Saldo do período = saldo inicial + entradas recebidas − saídas pagas." */
  function controle(F) {
    const e = F.semanas.reduce((a, s) => a + (s.entradas || 0), 0), s = F.semanas.reduce((a, x) => a + (x.saidas || 0), 0);
    return { inicial: F.saldoInicial, entradas: e, saidas: s, saldo: F.saldoInicial + e - s };
  }
  /* M6.I05: "Saldo do cenário = saldo inicial + entradas previstas no cenário − saídas previstas no cenário."
     limite: "Alertar quando houver período com saídas previstas superiores às entradas e ao saldo disponível." */
  function cenario(inicial, entradas, saidas) {
    const saldo = inicial + entradas - saidas;
    return { saldo, alerta: saidas > entradas + inicial };
  }
  /* M6.I02: itens das listas de compras (P01 e as listas das seções); categorias literais da regra */
  function categorias(M) {
    const r = (M.instr["M6.I02"] || {}).regra || "";
    const m = r.split(":").slice(1).join(":");
    return m.split(/,| ou /).map((s) => s.trim().replace(/\.$/, "")).filter(Boolean);
  }
  const LISTAS = ["M6.P01", "M6.P10", "M6.P13", "M6.P15", "M6.P16"];
  function itens(R) {
    const out = [];
    LISTAS.forEach((c) => {
      const v = valor(R, c);
      if (!v || v === NS) return;
      v.split(/\n|;|,| e (?=[a-zà-ú])/i).map((s) => s.trim()).filter(Boolean).forEach((s) => { if (!out.includes(s)) out.push(s); });
    });
    return out;
  }

  const API = { montar, valor, valorDe, campo, temNaoSei, num, envio, valido, avaliar, proxima, casa, regrasPara,
                regrasAgora, regrasTodas, retorna, lacunas, encaminhamentos, alertas, investimento, semanaDe,
                fluxoInicial, projetar, controle, cenario, categorias, itens, NS, COD, NEGOCIO };
  if (typeof module !== "undefined") module.exports = API; else raiz.Motor = API;
})(this);
