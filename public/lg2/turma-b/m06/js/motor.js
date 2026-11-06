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
  const NEG_PERGUNTA = "Para seguir, diga o que você oferece aos seus clientes";
  const NEG_AJUDA = "As próximas perguntas mudam conforme o seu tipo de negócio. Escolha o que mais parece com o que você vende.";
  const NEG_DESCR = { "Serviço": "Seu cliente paga pelo trabalho que você realiza", "Produto": "Você compra materiais e faz o que vende",
                      "Mercadoria": "Você compra pronto para revender" };

  /* Leituras do app para condições que citam algo que a planilha não tem (relatadas ao grupo):
     - "M01 ≠ Não sei" (M6.P17): a pergunta anterior da seção MERCADORIA é a M6.P16.
     - "De 8 a 30 dias" (M6.R30): a opção da M6.P08 é "8 a 30 dias". */
  const LEITURA_COND = { "M01 ≠ Não sei": "M6.P16 ≠ Não sei" };
  const LEITURA_OPCAO = { "De 8 a 30 dias": "8 a 30 dias" };

  /* ---- escolhas do app (relatório dos testadores de 05/11/2026) ---- */
  /* vendas e gastos do mês viram valor por semana: mês × 12 ÷ 52 (um ano tem 52 semanas e 12 meses ≈ 4,33 semanas por mês) */
  const FATOR_SEMANA = 12 / 52;
  /* prazo de recebimento (P08) -> quantas semanas o dinheiro de uma venda demora para entrar no caixa */
  const ATRASO = { "Na hora": 0, "À vista": 0, "Até 7 dias": 1, "8 a 30 dias": 3, "Mais de 30 dias": 5 };
  /* valores que pedem conferência (aviso que não trava: o 2º Continuar com o mesmo valor segue) */
  const LIMITE_INVEST = 50000, LIMITE_VENDAS_MES = 50000, LIMITE_CAIXA = 100000;
  const LIMITES_AVISO = {
    "M6.P02": [LIMITE_INVEST, "para começar um pequeno negócio"], "M6.P11": [LIMITE_INVEST, "para equipamentos e materiais de um pequeno negócio"],
    "M6.P14": [LIMITE_INVEST, "para equipamentos de um pequeno negócio"], "M6.P17": [LIMITE_INVEST, "para a primeira compra de um pequeno negócio"],
    "M6.P05": [LIMITE_VENDAS_MES, "de vendas por mês em um negócio que está começando"], "M6.P07": [LIMITE_CAIXA, "de dinheiro guardado para um pequeno negócio"] };
  /* textos da planilha que citavam códigos de pergunta ("Preencher P02"): reescritos em linguagem simples */
  const SEM_CODIGO = {
    "M6.R01": { proximo: "Responda quanto você estima gastar com esses itens." },
    "M6.R04": { proximo: "Diga como e quando vai pagar essas compras." },
    "M6.R13": { proximo: "Informe em quanto tempo o dinheiro de cada forma de pagamento chega para você." },
    "M6.R16": { encaminhamento: "Confirmar as formas de pagamento que você vai aceitar." },
    "M6.R39": { proximo: "Responda quanto você estima gastar com esses equipamentos e materiais." },
    "M6.R50": { proximo: "Responda quanto custam esses equipamentos, máquinas ou instalações." },
    "M6.R60": { proximo: "Responda quanto você estima gastar na primeira compra de mercadorias." } };
  /* o que falta, em linguagem simples, quando a resposta ficou em "Não sei" */
  const FALTA = {
    "M6.P01": "Liste o que você precisa comprar ou pagar para começar e quanto custa cada item.",
    "M6.P02": "Informe quanto você estima gastar com essas compras para começar.",
    "M6.P03": "Decida como vai pagar essas compras: à vista, parcelado ou parte de cada jeito.",
    "M6.P04": "Escolha as formas de pagamento que seus clientes poderão usar (Pix, dinheiro, cartão…).",
    "M6.P05": "Estime quanto você espera vender em um mês.",
    "M6.P06": "Liste os gastos de todo mês para manter o negócio (aluguel, luz, internet…) e quanto custa cada um.",
    "M6.P07": "Informe quanto você tem em caixa hoje para usar no negócio.",
    "M6.P08": "Descubra em quanto tempo o dinheiro de cada venda chega para você.",
    "M6.P09": "Confira se algum pagamento ou recebimento tem prazo diferente dos outros.",
    "M6.P10": "Liste os equipamentos, ferramentas e materiais de que você precisa para o serviço.",
    "M6.P11": "Estime quanto vão custar esses equipamentos, ferramentas e materiais.",
    "M6.P12": "Veja se você precisa ter materiais guardados para atender seus clientes.",
    "M6.P13": "Liste os equipamentos, máquinas ou instalações de que você precisa para produzir.",
    "M6.P14": "Estime quanto vão custar esses equipamentos, máquinas ou instalações.",
    "M6.P15": "Liste os insumos e materiais que você vai comprar para produzir.",
    "M6.P16": "Liste as mercadorias que você vai comprar para revender.",
    "M6.P17": "Estime quanto vai gastar na primeira compra de mercadorias.",
    "M6.P18": "Decida se vai manter mercadorias em estoque." };
  /* regras de resposta "normal" (preenchida, maior que zero, à vista, na hora…) trazem cuidados que valem para
     qualquer negócio: vão para "Dicas gerais". As demais dependem do que a pessoa respondeu. */
  const GENERICA = /^Resposta preenchida|^Lista de .+ informada|maior que zero|v[aá]lidos informados|^Uma ou mais|^Sim, com detalhes|^À vista$|^Na hora$/i;
  const REGRAS_GENERICAS = ["M6.R36"];

  const aspas = (s) => (String(s || "").match(/“([^”]+)”/g) || []).map((x) => x.slice(1, -1).trim());
  const regrasDe = (D, cod) => D.regras.filter((r) => r.codigo && r.pergunta === cod);

  function montar(D) {
    D.regras.forEach((r) => { if (r.codigo && SEM_CODIGO[r.codigo]) Object.assign(r, SEM_CODIGO[r.codigo]); });
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
      /* texto escrito pelo app (relatório do testador: o seletor "aparecia do nada") */
      const neg = { codigo: NEGOCIO, pergunta: NEG_PERGUNTA, ajuda: NEG_AJUDA, tipo: "Escolha", condicao: "sempre",
                    opcoesLista: ops, descricoes: NEG_DESCR, app: true };
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
      if (!/^(R\$)?-?[\d.,]*\d[\d.,]*$/i.test(v.replace(/\s+/g, ""))) return { estado: "invalida", valor: v };
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
    if (/^Resposta preenchida|^Lista de .+ informada/i.test(c)) return e === "valor" && !soNS && !r.semCompras;
    const alvos = aspas(c).length ? aspas(c) : [LEITURA_OPCAO[c] || c];
    return alvos.includes(valorDe(r));      // "À vista", "Não", "Resposta = “Não sei”", "“Não sei”"
  }
  const regrasPara = (M, cod, r) => regrasDe(M.D, cod).filter((x) => casa(x.condicao, r));
  const regrasAgora = (M, R, cod) => regrasPara(M, cod, R[cod]);
  const regrasTodas = (M, R) => M.D.regras.filter((x) => x.codigo && casa(x.condicao, R[x.pergunta]));
  /* "Retornar à P02." no encaminhamento = fica na pergunta (comportamento, não texto exibido) */
  const retorna = (r) => /^Retornar à /i.test(String(r.encaminhamento || "").trim());

  const semVazio = (rs, campo, nada) => [...new Set(rs.map((r) => r[campo]).filter((x) => x && x !== nada))];
  const generica = (r) => GENERICA.test(String(r.condicao || "").trim()) || REGRAS_GENERICAS.includes(r.codigo);
  const especificas = (rs) => rs.filter((r) => !generica(r));
  const lacunas = (rs) => semVazio(especificas(rs), "lacuna", "Nenhuma");
  const alertas = (rs) => semVazio(especificas(rs), "alerta", "Nenhum");
  const dicasGerais = (rs) => semVazio(rs.filter(generica), "alerta", "Nenhum");
  /* "Estimativa do investimento inicial" e "Estimativa do investimento" são o mesmo encaminhamento */
  const QUALIF = /\b(inicial|futuras|produtivo|para servicos|em mercadorias|em estoque)\b/g;
  const chaveEnc = (s) => String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[.]/g, "").replace(QUALIF, "").replace(/\s+/g, " ").trim();
  function encaminhamentos(rs) {
    const vistos = new Set(), out = [];
    semVazio(rs.filter((r) => !retorna(r)), "encaminhamento", "Nenhum").forEach((e) => { const k = chaveEnc(e); if (!vistos.has(k)) { vistos.add(k); out.push(e); } });
    return out;
  }
  /* o que de fato falta: só as perguntas respondidas com "Não sei" (as vazias não são gravadas) */
  const pendencias = (M, R) => M.perguntas.filter((q) => FALTA[q.codigo] && valor(R, q.codigo) === NS).map((q) => FALTA[q.codigo]);
  /* valor fora do comum: devolve o texto do aviso ou null */
  function avisoValor(cod, r) {
    const L = LIMITES_AVISO[cod];
    if (!L || !r || r.estado !== "valor") return null;
    const n = num(r.valor);
    return n > L[0] ? `Esse valor parece alto ${L[1]} (mais de R$ ${L[0].toLocaleString("pt-BR")}). Confira se digitou certo. Se estiver certo, toque em Continuar de novo.` : null;
  }

  /* ---- cálculos da aba 5 ---- */
  const numDe = (R, cod) => { const v = valor(R, cod); return v === undefined || v === NS ? null : num(v); };

  /* M6.I01: "Investimento inicial = soma dos valores dos equipamentos + instalações + estoque inicial +
     outros gastos". Valores perguntados: P02 (geral), P11 (serviço), P14 (produto), P17 (mercadoria). */
  const PARTES_INVEST = ["M6.P02", "M6.P11", "M6.P14", "M6.P17"];
  function investimento(R) {
    const partes = PARTES_INVEST.map((c) => ({ codigo: c, valor: numDe(R, c) })).filter((p) => p.valor !== null);
    const nada = !partes.length && !!(R["M6.P01"] && R["M6.P01"].semCompras);     // "Não tenho compras a fazer agora" = R$ 0
    return { valor: partes.length ? partes.reduce((a, p) => a + p.valor, 0) : nada ? 0 : null, semCompras: nada, partes, forma: valor(R, "M6.P03") };
  }

  /* prazo de recebimento (P08) -> 1ª semana em que entra dinheiro de venda */
  const semanaDe = (v) => v in ATRASO ? ATRASO[v] + 1 : null;
  const cent = (n) => Math.round(n * 100) / 100;
  /* gastos de todo mês (P06 é texto): soma dos valores escritos ("Aluguel: R$ 800,00; luz 150" = 950) */
  function somaValores(txt) {
    if (!txt || txt === NS) return 0;
    return cent((String(txt).match(/\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?|\d+(?:,\d{1,2})?/g) || []).reduce((a, x) => a + num(x), 0));
  }

  /* M6.I04: monta as 13 semanas a partir das respostas.
     - entradas: vendas do mês (P05) × 12 ÷ 52 em toda semana, a partir da semana em que o prazo da P08 deixa o dinheiro entrar;
     - saídas: gastos de todo mês (P06) × 12 ÷ 52 em toda semana + investimento inicial (P02+P11+P14+P17) na semana 1
       (a v0.2 não pergunta número nem datas de parcelas, então o investimento sai todo na semana 1);
     - saldo inicial = dinheiro que a pessoa já tem (P07). */
  const FLUXO_V = 2;
  function fluxoInicial(R) {
    const p08 = valor(R, "M6.P08");
    return montarSemanas({ v: FLUXO_V, saldoInicial: numDe(R, "M6.P07") || 0, vendasMes: numDe(R, "M6.P05") || 0,
      gastosMes: somaValores(valor(R, "M6.P06")), investimento: investimento(R).valor || 0,
      atraso: p08 in ATRASO ? ATRASO[p08] : 0, prazo: p08 in ATRASO ? p08 : null });
  }
  /* refaz as 13 semanas a partir dos valores do mês (usado também quando a pessoa muda vendas/gastos na tela) */
  function montarSemanas(F) {
    const ent = cent((F.vendasMes || 0) * FATOR_SEMANA), sai = cent((F.gastosMes || 0) * FATOR_SEMANA);
    F.vendasSemana = ent; F.gastosSemana = sai;
    F.semanas = Array.from({ length: 13 }, (_, i) => ({
      entradas: i >= (F.atraso || 0) ? ent : 0,
      saidas: cent(sai + (i === 0 ? F.investimento || 0 : 0)) }));
    return F;
  }
  /* "Saldo final da semana = saldo inicial da semana + entradas previstas − saídas previstas.
      O saldo final de uma semana passa a ser o saldo inicial da semana seguinte." */
  function projetar(F) {
    let saldo = F.saldoInicial;
    return F.semanas.map((s, i) => {
      const ini = saldo;
      saldo = cent(ini + (s.entradas || 0) - (s.saidas || 0));
      /* limite do I04: "Alertar quando as saídas previstas forem maiores que os recursos disponíveis no período." */
      return { semana: i + 1, inicial: ini, entradas: s.entradas || 0, saidas: s.saidas || 0, final: saldo,
               alerta: (s.saidas || 0) > 0 && (s.saidas || 0) > ini + (s.entradas || 0) };
    });
  }
  /* M6.I03: "Saldo do período = saldo inicial + entradas recebidas − saídas pagas." */
  function controle(F) {
    const e = F.semanas.reduce((a, s) => a + (s.entradas || 0), 0), s = F.semanas.reduce((a, x) => a + (x.saidas || 0), 0);
    return { inicial: F.saldoInicial, entradas: cent(e), saidas: cent(s), saldo: cent(F.saldoInicial + e - s) };
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
  /* pedaços que não são item de compra ("nada, por enquanto." virava dois itens: "nada" e "por enquanto.") */
  const NAO_ITEM = new Set(("nada nenhum nenhuma ainda nao por enquanto sei sem tenho preciso vou compras compra comprar fazer " +
    "mais agora no momento so isso tudo ja eu nem de a o por ora hoje outro outra outros").split(" "));
  const semAcento = (x) => String(x).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const ehItem = (pedaco) => { const ws = semAcento(pedaco).split(/[^a-z0-9]+/).filter(Boolean); return ws.length > 0 && !ws.every((w) => NAO_ITEM.has(w)); };
  function itensDe(txt) {
    if (!txt || txt === NS) return [];
    return String(txt).split(/\n|;|,| e (?=[a-zà-ú])/i).map((x) => x.trim().replace(/[.!?…]+$/, "").trim()).filter((x) => x && ehItem(x));
  }
  /* resposta sem nenhum item de verdade ("nada", "nenhum", "ainda não", "por enquanto") = sem compras agora */
  const semCompras = (txt) => !!String(txt || "").trim() && txt !== NS && !itensDe(txt).length;
  function itens(R, fora) {
    const out = [];
    LISTAS.forEach((c) => {
      if (R[c] && R[c].semCompras) return;
      itensDe(valor(R, c)).forEach((x) => { if (!out.includes(x) && !(fora || []).includes(x)) out.push(x); });
    });
    return out;
  }

  const API = { montar, valor, valorDe, campo, temNaoSei, num, envio, valido, avaliar, proxima, casa, regrasPara,
                regrasAgora, regrasTodas, retorna, lacunas, encaminhamentos, alertas, dicasGerais, pendencias, avisoValor,
                investimento, semanaDe, somaValores, montarSemanas, FATOR_SEMANA, ATRASO, FLUXO_V, LIMITES_AVISO,
                fluxoInicial, projetar, itensDe, semCompras, controle, cenario, categorias, itens, NS, COD, NEGOCIO };
  if (typeof module !== "undefined") module.exports = API; else raiz.Motor = API;
})(this);
