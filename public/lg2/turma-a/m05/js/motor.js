/* Motor do Módulo 5 — lê o conteúdo da planilha (window.MODULO5) sem alterar
   nenhum texto. Aqui só há navegação, validação e conta. Funciona no navegador
   e no Node (para os testes). */
(function (raiz) {
  "use strict";

  const NAO_SEI = /n[ãa]o sab|n[ãa]o sei|n[ãa]o lembra|n[ãa]o informad|incomplet/i;

  /* Faixas da porcentagem de lucro sobre o custo de uma unidade (correção do grupo). */
  const LUCRO_BAIXO = 20;    // abaixo disso: lucro baixo
  const LUCRO_ALTO = 100;    // acima disso: lucro alto

  /* Valores fora do comum (relatório dos testadores, 05/11): avisos que não travam. */
  const LIMITE_ACRESCIMO = 500;        // acréscimo sobre o custo acima disso (%) = preço mais de 6 vezes o custo
  const LIMITE_FATURAMENTO = 100000;   // faturamento por mês acima disso (R$) = alto para um negócio caseiro
  /* Quanto a pessoa disse que pode usar no negócio (pergunta 7 do Módulo 1) -> teto em R$ (sem teto: não compara). */
  const TETO_M1 = { "Nada por enquanto": 0, "Até R$ 100": 100, "Entre R$ 100 e R$ 500": 500, "Entre R$ 500 e R$ 1.000": 1000 };
  const MSG_NUMERO = "Digite só números. Ex.: 12,50";
  const MSG_FAT_ALTO = "Esse faturamento parece alto para um negócio caseiro (mais de R$ 100.000,00 por mês). Confira se o preço e a quantidade de vendas que você informou estão certos.";

  /* Gastos fixos/indiretos (Parte comum): "Não sei" deixa de ser resposta e vira
     botão de ajuda; a pessoa precisa responder Sim/Não ou o valor para seguir. */
  const AJUDA_NAO_SEI = ["M5.P24", "M5.P25", "M5.P26", "M5.P27", "M5.P28", "M5.P29",
    "M5.P30", "M5.P31", "M5.P32", "M5.P33", "M5.P34", "M5.P35"];

  /* O preço vai para o fim: ... P35 -> P37 (quantidade) -> P36 (preço) -> análise do preço -> resultado. */
  const PRECO = "PRECO";

  /* Correções de 15/10 e 22/10 (documento do grupo):
     - "Não sei" vira botão de ajuda em TODAS as perguntas, do começo ao fim;
     - a 1ª pergunta é a pergunta 1 do Módulo 1 (pré-preenchida com a resposta de lá);
     - formas de pagamento antes das taxas, com taxa e prazo separados por forma. */
  const P_INICIAL = "M5.P00";      // pergunta 1 do Módulo 1, repetida aqui
  const P_FORMAS = "M5.PG";        // formas de pagamento (antes das taxas)
  const OPCOES_M1 = ["Ainda está só na minha cabeça", "Já fiz um pouco para testar ou dar de amostra",
    "Já vendi algumas vezes", "Já vendo sempre", "Não sei dizer"];   // texto literal do Módulo 1
  const SIMULACAO_M1 = OPCOES_M1.slice(0, 2);                           // ainda não vende: resultado é simulação
  const FORMAS = ["Pix", "Dinheiro", "Cartão de débito", "Cartão de crédito", "Outra forma"];
  const EXTRAS = [
    { codigo: P_INICIAL, secao: "Pergunta Separatória", pergunta: "Como está a sua ideia hoje?",
      ajuda: "Escolha a frase que mais parece com você. Não tem resposta errada.", tipo: "Escolha única",
      opcoes: OPCOES_M1.join(" / "), proximo: "P01", alerta: "—", fonte: "", video: "", observacao: null, antes: "M5.P01" },
    { codigo: P_FORMAS, secao: "Parte comum", pergunta: "Quais formas de pagamento você aceita?",
      ajuda: "Marque todas as que você usa: Pix, dinheiro, cartão de débito, cartão de crédito ou outra forma.", tipo: "Múltipla escolha",
      opcoes: FORMAS.join(" / "), proximo: "P24", alerta: "—", fonte: "M5.BT05", video: "", observacao: null, antes: "M5.P24" },
  ];

  /* Textos novos tirados do documento de correções (15/10 e 22/10). */
  const NOTA_CONSUMO = {
    titulo: "Materiais de consumo e equipamentos",
    texto: "Ingredientes, embalagens e materiais utilizados durante um atendimento entram no cálculo conforme a quantidade consumida. Já itens como formas, panelas, máquinas e tesouras não devem ter seu valor total de compra colocado como custo de um único produto ou atendimento: essas compras são investimentos e são registradas no Módulo 6.",
    exemplo: "Se você trabalha como cabeleireiro, informe quanto de shampoo usa em cada atendimento. Não coloque o preço inteiro da tesoura como gasto de um único corte.",
    exemploProduto: "Se você faz bolos, informe quanto de farinha usa em cada receita. Não coloque o preço inteiro da forma ou da batedeira como gasto de um único bolo.",
  };
  /* Exemplos dos conceitos que só falavam de produto feito em casa: versão para serviço e revenda (item 6 do relatório de 05/11). */
  const EXEMPLO_TIPO = {
    "M5.BT04": {
      "Serviço": "Uma manicure abre um esmalte novo e parte dele seca no frasco antes de ser usada. Esse desperdício aumenta o gasto de cada atendimento.",
      Mercadoria: "Uma pessoa compra 50 camisetas para revender e 2 chegam manchadas e não podem ser vendidas. Essa perda aumenta o gasto com as camisetas que foram vendidas.",
    },
    "M5.BT06": {
      Mercadoria: "Uma camiseta vendida por R$ 40 vai para o cliente numa sacola que custa R$ 0,80. Esse valor pode ser considerado na composição do custo da venda.",
    },
    "M5.BT07": {
      "Serviço": "Uma manicure que trabalha sozinha pode considerar o valor destinado à sua própria remuneração na análise dos gastos do negócio.",
      Mercadoria: "Uma pessoa que revende roupas sozinha pode considerar o valor destinado à sua própria remuneração na análise dos gastos do negócio.",
    },
  };
  function exemploConceito(b, tipo) {
    const e = b && EXEMPLO_TIPO[b.codigo];
    return e && e[tipo] ? e[tipo] : b ? b.exemplo : "";
  }
  const NOTA_LUZ_AGUA = "Não coloque aqui a conta de luz nem a de água: tem uma pergunta sobre isso depois, e o valor ficaria contado duas vezes.";
  const MSG_QTD_ALTA = "A quantidade utilizada está maior que a embalagem. Confira o valor e a unidade informados.";
  const MSG_SOMA_PARTES = "A soma das partes das vendas precisa dar 100%.";
  const POUCAS_VENDAS = "Com poucas vendas, os gastos mensais ficam divididos entre menos unidades, aumentando a parcela que cada venda precisa cobrir.";
  const MARGEM_X_ACRESCIMO = {
    texto: "Acrescentar uma porcentagem ao custo é diferente de calcular a margem sobre o preço de venda.",
    exemplo: "Se o custo considerado é de R$ 10 e você vende por R$ 20, sem outros gastos ou taxas, sobram R$ 10. Você acrescentou 100% sobre o custo, mas essa sobra representa 50% do preço de venda.",
  };
  const MSG_SEM_SOBRA = "Com esses valores, cada venda não deixa sobra para cobrir os gastos do mês. Por isso, aumentar a quantidade vendida não resolve o problema.";
  const MSG_SIMULACAO = "Você ainda não vende com frequência: este resultado é uma simulação feita com estimativas.";
  const MSG_ACIMA_MERCADO = "Seu preço está acima da faixa de mercado que você informou no Módulo 3. Avalie se os clientes percebem benefícios que justifiquem esse preço. A decisão final é sua.";
  const MSG_TEMPO = "Com o tempo informado, essa quantidade de atendimentos exige mais horas do que você tem disponíveis. Quer conferir esses dados?";
  /* Horas por mês, no máximo, pela resposta da pergunta 5 do Módulo 1 (todos os dias do mês).
     "Mais de 3 horas" e "Só nos fins de semana" não têm limite em número: não há comparação. */
  const HORAS_MES_M1 = { "Até 1 hora por dia": 30, "De 1 a 3 horas por dia": 90 };
  const MSG_DESCONTADOS = "Neste resultado já foram descontados: o custo de cada venda, as taxas, os gastos fixos do mês, as perdas e o valor que você separa pelo seu trabalho (quando informado). Por isso, esse valor não deve ser somado de novo à sua remuneração.";
  /* Ajuda extra (botão "Não sei") das perguntas que não têm conceito nem texto de "como descobrir". */
  const AJUDA_EXTRA = {
    "M5.P00": ["Se você ainda não começou a vender, pode responder com estimativas. O resultado será uma simulação."],
    "M5.P01": ["Produto: eu compro materiais e faço o que vendo. Ex.: bolos, marmitas e artesanato.",
      "Mercadoria: compro pronto para revender. Ex.: roupas, bebidas e acessórios.",
      "Serviço: meu cliente paga pelo trabalho que realizo. Ex.: manicure, aulas e consertos."],
    "M5.P05": ["Quilos e gramas, litros e mililitros podem ser misturados: o aplicativo converte (1 kg = 1.000 g; 1 L = 1.000 ml)."],
    "M5.P06": ["Quilos e gramas, litros e mililitros podem ser misturados: o aplicativo converte (1 kg = 1.000 g; 1 L = 1.000 ml)."],
    "M5.P21": ["Quilos e gramas, litros e mililitros podem ser misturados: o aplicativo converte (1 kg = 1.000 g; 1 L = 1.000 ml)."],
    "M5.P22": ["Quilos e gramas, litros e mililitros podem ser misturados: o aplicativo converte (1 kg = 1.000 g; 1 L = 1.000 ml)."],
    "M5.P32": ["Também entram aqui gastos do mês com impostos, transporte, entrega, divulgação e manutenção. Nas dúvidas sobre impostos, consulte um contador."],
    "M5.P33": ["Também entram aqui gastos do mês com impostos, transporte, entrega, divulgação e manutenção. Nas dúvidas sobre impostos, consulte um contador."],
    "M5.PG": ["Cada forma de pagamento pode ter uma taxa e um prazo diferentes. Por isso, primeiro marque as formas que você aceita."],
  };

  const MSG_RESPONDA = "Responda para continuar. Se não souber, toque em “Não sei” para ver uma explicação.";

  const MSG_PRECO = {
    sugerido: {
      baixo: "Esse preço pode ficar baixo demais para cobrir seus gastos. Você pode aumentar a porcentagem de lucro ou conferir se os preços que você paga nas mercadorias e materiais estão corretos.",
      alto: "Uma porcentagem de lucro muito alta pode deixar o preço acima do que os clientes estão dispostos a pagar e atrapalhar as vendas.",
    },
    reverso: {
      baixo: "Seu lucro em cada venda está baixo. Com esse preço, qualquer gasto a mais pode fazer você trabalhar sem ganhar. Confira os valores que você informou ou pense em ajustar o preço.",
      alto: "Seu lucro em cada venda está alto. Isso pode ajudar, mas um preço muito acima dos concorrentes pode atrapalhar as vendas.",
    },
    negativo: "Com esse preço você vende abaixo do que gasta para fazer cada unidade.",
    semCusto: "Não foi possível calcular quanto você gasta em cada venda (cada unidade ou atendimento) com as informações que você deu. Por isso não dá para calcular a porcentagem de lucro agora. Você pode voltar e conferir os valores.",
  };

  function montar(D) {
    const ordem = [];          // perguntas na ordem da planilha (sem as linhas de seção)
    const porCodigo = {};
    let secao = "";
    const incluir = (q) => {
      q.fixo = AJUDA_NAO_SEI.includes(q.codigo);   // gastos fixos (correção de 15/10)
      q.ajudaNaoSei = true;                         // "Não sei" = ajuda em todas as perguntas (22/10)
      q.opcoesLista = opcoes(q).filter((o) => !NAO_SEI.test(o));
      if (q.codigo === "M5.P03" || q.codigo === "M5.P19") {
        q.notaConsumo = q.codigo === "M5.P03" ? Object.assign({}, NOTA_CONSUMO, { exemplo: NOTA_CONSUMO.exemploProduto }) : NOTA_CONSUMO;
        q.notaLuzAgua = NOTA_LUZ_AGUA;
      }
      if (q.codigo === "M5.P36") q.observacao = null;   // orientação retirada pelo grupo (15/10); a explicação nova fica no passo do preço
      if (q.codigo === "M5.P25") q.tipoApp = "taxas-formas";
      ordem.push(q);
      porCodigo[q.codigo] = q;
    };
    D.perguntas.forEach((p) => {
      if (p.secao) { secao = p.secao; return; }
      EXTRAS.filter((x) => x.antes === p.codigo).forEach((x) => incluir(Object.assign({}, x)));
      incluir(Object.assign({ secao }, p));
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
    if (q.tipoApp) return q.tipoApp;
    const t = (q.tipo || "").toLowerCase();
    if (t.startsWith("múltipla")) return "multipla";
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
    if (campo(q) === "escolha" || campo(q) === "multipla") return [];
    /* "Não sei" já saiu das opções (vira ajuda); ficam "Ainda não defini" (P36) e "Ainda não comecei a vender" (P37) */
    return q.opcoesLista.filter((o) => !/^(kg|g|l|ml|unidade|outro)$/i.test(o));
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
    if (resp.estado === "naosei" && q.ajudaNaoSei) return null;
    if (resp.estado === "naosei") return rs.find((r) => NAO_SEI.test(valorCond(r))) || null;
    return rs.find((r) => !NAO_SEI.test(valorCond(r)) && !/^ainda n/i.test(valorCond(r))) || null;
  }

  /* Próxima pergunta: "Ir para Pxx" da regra; se não houver, a coluna
     Próximo passo da pergunta (com os desvios Sim/Não escritos pelo grupo). */
  function proxima(M, q, resp, r) {
    if (q.codigo === P_INICIAL) return "M5.P01";      // pergunta do Módulo 1 -> tipo de oferta
    if (q.codigo === P_FORMAS) return "M5.P24";       // formas de pagamento -> taxas
    if (q.codigo === "M5.P37") return "M5.P36";       // quantidade antes do preço
    if (q.codigo === "M5.P36") return PRECO;          // depois do preço, a análise do preço
    const p = proximaPlanilha(M, q, resp, r);
    if (p === "M5.P24") return P_FORMAS;              // quem ia para as taxas passa antes pelas formas de pagamento
    return p === "M5.P36" ? "M5.P37" : p;             // quem ia para o preço vai antes para a quantidade
  }

  function proximaPlanilha(M, q, resp, r) {
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
    const escolha = resp && resp.estado === "opcao" ? rotulo(resp.opcao) : resp && resp.estado === "naosei" && !q.ajudaNaoSei ? "Não sei" : null;
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
    else if (/^-?[1-9]\d{0,2}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, "");   // "1.500" = mil e quinhentos
    if (!/^-?(\d+\.?\d*|\.\d+)$/.test(s)) return null;                        // texto, "1e5" etc. não é número
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
    /* campo vazio nunca vale R$ 0: pede a resposta. O texto do Alerta só é usado quando é uma mensagem de validação. */
    const ehValidacao = /preencha|maior que zero|negativ|compat|entre 0%/i.test(msg);
    const falha = !q.fixo && ehValidacao ? msg : MSG_RESPONDA;
    if (numerosDe(c, valor).some(naoNumero)) return MSG_NUMERO;     // texto em campo de número: não grava
    if (c === "multipla") return (valor || []).length ? null : falha;
    if (c === "taxas-formas") {
      const vs = valor || [];
      if (!vs.length || vs.some((x) => num(x.taxa) === null)) return falha;
      if (vs.some((x) => num(x.taxa) < 0 || num(x.taxa) > 100)) return msg;
      if (vs.some((x) => String(x.prazo || "").trim() && !(num(x.prazo) >= 0))) return falha;
      if (vs.length > 1) {
        if (vs.some((x) => num(x.parte) === null)) return falha;
        if (vs.some((x) => num(x.parte) < 0 || num(x.parte) > 100)) return MSG_SOMA_PARTES;
        const soma = vs.reduce((s, x) => s + num(x.parte), 0);
        if (Math.abs(soma - 100) > 0.01) return MSG_SOMA_PARTES;
      }
      return null;
    }
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

  /* Valores digitados nos campos de número de cada tipo de pergunta. */
  function numerosDe(c, valor) {
    const v = valor || {};
    if (c === "numero" || c === "percentual") return [valor];
    if (c === "por-item-valor") return Array.isArray(valor) ? valor : [];
    if (c === "por-item-unidade") return Array.isArray(valor) ? valor.map((x) => x && x.q) : [];
    if (c === "pacote") return [v.preco, v.qtd];
    if (c === "lista-valor") return Array.isArray(valor) ? valor.map((x) => x && x.v) : [];
    if (c === "tempo") return [v.h, v.m];
    if (c === "taxas-formas") return Array.isArray(valor) ? valor.flatMap((x) => [x.taxa, x.prazo, x.parte]) : [];
    return [];
  }
  /* preenchido, mas não é número (ex.: "abc", "doze") */
  const naoNumero = (x) => x !== null && x !== undefined && String(x).trim() !== "" && num(x) === null;

  /* "6 vezes", "1.500 vezes" */
  function vezes(n) {
    return n >= 10 ? String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ".") : String(Math.round(n * 10) / 10).replace(".", ",");
  }
  const msgVezes = (preco, custo) => `Seu preço está ${vezes(preco / custo)} vezes o custo. Confira se o custo ou o preço estão certos.`;
  /* Aviso (não trava) no preço: acréscimo sobre o custo acima de LIMITE_ACRESCIMO. */
  function avisoValor(M, q, valor, R) {
    if (q.codigo !== "M5.P36") return null;
    const preco = num(valor), custo = calcular(M, R).custoUnidade;
    if (preco === null || !(custo > 0)) return null;
    if (preco < custo) return msgAbaixoCusto(custo);          // relatório de 05/11: preço menor que o custo
    return ((preco - custo) / custo) * 100 > LIMITE_ACRESCIMO ? msgVezes(preco, custo) : null;
  }
  /* preço abaixo do custo de uma unidade: aviso claro que não trava (na pergunta do preço, no passo do preço,
     no resultado e na simulação) */
  const msgAbaixoCusto = (custo) => `O preço informado está abaixo do custo (${brl(custo)}). Assim você perde dinheiro em cada venda. Quer revisar?`;
  function abaixoCusto(preco, custo) { return preco !== null && isFinite(preco) && custo > 0 && preco < custo ? msgAbaixoCusto(custo) : null; }

  /* Aviso (não bloqueia de vez): quantidade usada maior que a embalagem comprada (P06/P22). */
  function avisoQuantidade(M, q, valor, R) {
    const ant = anteriorPorItem(M, q);
    if (!ant || campo(q) !== "por-item-unidade") return null;
    const prev = R[ant.codigo] && R[ant.codigo].valor || [];
    const alto = (valor || []).some((x, i) => {
      const p = prev[i];
      if (!p || !compativel(x.u, p.u) || num(x.q) === null || num(p.q) === null) return false;
      return base(num(x.q), x.u).v > base(num(p.q), p.u).v;
    });
    return alto ? MSG_QTD_ALTA : null;
  }

  /* Faixa de mercado escrita no Módulo 3 (M3.P20, texto livre: "de R$ 40 a R$ 60"). */
  function faixaMercado(texto) {
    const ns = (String(texto || "").match(/\d+(?:[.,]\d+)*/g) || []).map(num).filter((n) => n !== null && n > 0);
    if (!ns.length) return null;
    return { min: Math.min(...ns), max: Math.max(...ns) };
  }

  /* Taxa média ponderada pelas formas de pagamento (P25 por forma). */
  function taxaMedia(v25) {
    if (!Array.isArray(v25)) return num(v25) || 0;
    if (v25.length === 1) return num(v25[0].taxa) || 0;
    return v25.reduce((s, x) => s + (num(x.taxa) || 0) * (num(x.parte) || 0) / 100, 0);
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
  function calcular(M, R, precoAlt) {
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

    const precoInformado = num(v("P36"));
    /* sem preço informado, o resultado usa o preço possível do passo do preço (quando houver) */
    const preco = precoInformado !== null ? precoInformado : precoAlt !== undefined && precoAlt !== null && isFinite(precoAlt) ? precoAlt : null;
    const formas = (R["M5.PG"] && R["M5.PG"].valor) || [];
    const taxasFormas = op("P24") === "Sim" && Array.isArray(v("P25")) ? v("P25") : [];
    const taxaPct = op("P24") === "Sim" ? taxaMedia(v("P25")) : 0;
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
    const pe = mc !== null && mc > 0 ? Math.ceil(mensal / mc) : null;      // sempre arredondado para cima
    /* sem ponto de equilíbrio: uma frase com o que falta para a conta */
    let peFalta = null;
    if (pe === null || !(mensal > 0)) {
      const f = [];
      if (preco === null) f.push("o preço de venda");
      if (!(mensal > 0)) f.push("os gastos fixos do mês (aluguel, contas de água e luz, outras contas, perdas ou o valor do seu trabalho)");
      if (f.length) peFalta = "Para calcular quantas vendas cobrem seus gastos fixos, falta informar " + f.join(" e ") + ".";
      else if (mc !== null && mc <= 0) peFalta = "Para calcular quantas vendas cobrem seus gastos fixos, falta um preço que deixe sobra em cada venda, depois do custo e das taxas.";
    }
    const fatAlto = fat !== null && fat > LIMITE_FATURAMENTO;
    const semSobra = mc !== null && mc <= 0 && mensal > 0;
    const parcelaMensal = qtd > 0 ? mensal / qtd : null;                 // parte dos gastos do mês em cada venda

    let tempo = null;
    const t = v("P23");
    if (t) tempo = (num(t.h) || 0) * 60 + (num(t.m) || 0);

    const r00 = R[P_INICIAL];
    const simulacao = (r00 && r00.estado === "opcao" && SIMULACAO_M1.includes(r00.opcao)) || op("P37") === "Ainda não comecei a vender";
    return { tipo, nome, linhas, faltas, custoUnidade, preco, precoInformado, taxaPct, taxa, mc, mcPct,
      fixos, outros, perdas, trabalho, mensal, qtd, fat, fatAlto, resultado, pe, peFalta, semSobra, parcelaMensal, tempo,
      formas, taxasFormas, simulacao };
  }

  /* Painel "Não sei" dos gastos fixos: conceito(s) da Base técnica citados pela
     pergunta e o texto que o grupo escreveu para quem não sabe (como descobrir). */
  function ajudaNaoSei(M, q) {
    if (!q.ajudaNaoSei) return null;
    const conceitos = (String(q.fonte || "").match(/M5\.BT\d{2}/g) || []).map((c) => M.conceito[c]).filter(Boolean);
    const comoAchar = (M.regrasDe[q.codigo] || []).filter((r) => NAO_SEI.test(valorCond(r))).map((r) => r.texto)
      .filter((t) => t && t.trim() && t !== "—");
    const extra = (AJUDA_EXTRA[q.codigo] || []).slice();
    if (!conceitos.length && !comoAchar.length && !extra.length && q.ajuda) extra.push(q.ajuda);
    return { conceitos, comoAchar, extra, video: (q.video || "").trim() };
  }

  /* Análise do preço (passo depois da P36). Reaproveita o custo de uma unidade de calcular().
     modo "sugerido": a pessoa ainda não tem preço -> preço possível = custo x (1 + lucro%/100).
     modo "reverso": a pessoa informou o preço -> lucro% = (preço - custo) / custo x 100. */
  function classificar(pct) {
    return pct < LUCRO_BAIXO ? "baixo" : pct > LUCRO_ALTO ? "alto" : null;
  }
  function analisarPreco(M, R, lucro, mercado) {
    const r36 = R["M5.P36"];
    if (!r36) return null;
    const c = calcular(M, R);
    const custo = c.custoUnidade;
    const modo = r36.estado === "valor" ? "reverso" : "sugerido";
    const a = { modo, custo, tipo: c.tipo };
    if (!(isFinite(custo) && custo > 0)) return Object.assign(a, { semCusto: true, mensagens: [MSG_PRECO.semCusto] });
    let pct, preco;
    const taxaPct = c.taxaPct || 0;
    if (modo === "reverso") {
      preco = num(r36.valor);
      pct = ((preco - custo) / custo) * 100;
    } else {
      pct = num(lucro);
      if (pct === null || pct < 0) return Object.assign(a, { pendente: true, mensagens: [] });
      preco = custo * (1 + pct / 100);
    }
    const nivel = classificar(pct);
    const negativo = pct < 0;
    const mensagens = [];
    if (nivel) mensagens.push(MSG_PRECO[modo][nivel]);
    const abaixo = modo === "reverso" ? abaixoCusto(preco, custo) : null;   // aviso próprio, em destaque (não entra em mensagens)
    /* acréscimo sobre o custo (pct) x margem sobre o preço; sobra depois do custo e das taxas */
    const taxa = (preco * taxaPct) / 100;
    const sobra = preco - custo - taxa;
    const margem = preco > 0 ? (sobra / preco) * 100 : null;          // margem sobre o preço (depois das taxas)
    const faixa = faixaMercado(mercado);
    /* preço que cobre o custo, a taxa e a parte dos gastos do mês em cada venda (quando há quantidade de vendas) */
    const precoMinimo = c.parcelaMensal !== null && c.mensal > 0 && taxaPct < 100 ? (custo + c.parcelaMensal) / (1 - taxaPct / 100) : null;
    if (faixa && preco > faixa.max) mensagens.push(MSG_ACIMA_MERCADO);
    const muitoAcima = pct > LIMITE_ACRESCIMO ? msgVezes(preco, custo) : null;   // aviso em destaque, separado dos outros
    return Object.assign(a, { preco, pct, margem, taxa, taxaPct, sobra, faixa, precoMinimo, nivel, negativo, abaixo, mensagens, muitoAcima });
  }

  /* ---------------- gasto inicial x quanto pode investir (Módulo 1, pergunta 7) ----------------
     Soma do que a pessoa paga em cada compra informada aqui: materiais (preço de cada item),
     mercadoria (compra + frete) e pacote de embalagens. Só avisa; não trava. */
  function gastoInicial(M, R) {
    const v = (c) => (R["M5." + c] && R["M5." + c].estado === "valor" ? R["M5." + c].valor : null);
    const op = (c) => (R["M5." + c] && R["M5." + c].estado === "opcao" ? rotulo(R["M5." + c].opcao) : null);
    const soma = (l) => (Array.isArray(l) ? l : []).reduce((s, x) => s + (num(x) || 0), 0);
    const pac = (c) => num(v(c) && v(c).preco) || 0;
    const tipo = op("P01");
    if (tipo === "Produto") return soma(v("P04")) + (op("P08") === "Sim" ? pac("P09") : 0);
    if (tipo === "Mercadoria") return (num(v("P11")) || 0) + (op("P13") === "Sim" ? num(v("P14")) || 0 : 0) + (op("P15") === "Sim" ? pac("P16") : 0);
    if (tipo === "Serviço") return op("P18") === "Sim" ? soma(v("P20")) : 0;
    return 0;
  }
  const O_QUE_COMPRA = { Produto: "comprar os materiais e as embalagens", Mercadoria: "comprar a mercadoria (com frete e embalagens)", "Serviço": "comprar os materiais" };
  function avisoInvestimento(M, R, r07) {
    const opcao = r07 && r07.estado === "opcao" ? r07.opcao : null;
    if (!opcao || !(opcao in TETO_M1)) return null;
    const total = gastoInicial(M, R), teto = TETO_M1[opcao];
    if (!(total > teto)) return null;
    const tipo = (R["M5.P01"] && R["M5.P01"].estado === "opcao") ? rotulo(R["M5.P01"].opcao) : null;
    return { total, teto, opcao,
      texto: `No Módulo 1, sobre quanto dinheiro pode usar no negócio, você respondeu “${opcao}”. Só o que você informou aqui para ${O_QUE_COMPRA[tipo] || "as compras"} soma ${brl(total)}, acima desse valor. Confira os valores ou pense em começar com uma compra menor.` };
  }

  /* ---------------- herança do Módulo 1 (relatório do testador, 05/11) ----------------
     M1.P01 (como está a ideia) = M5.P00; M1.P03A (o que oferece, mesmas 3 opções) = M5.P01.
     Mapeia pela palavra inicial (Produto / Mercadoria / Serviço). "Não sei" não é herança. */
  function herdarEstagio(M, r1) {
    return r1 && r1.estado === "opcao" && M.porCodigo[P_INICIAL].opcoesLista.includes(r1.opcao) ? r1.opcao : null;
  }
  function herdarTipo(M, r1) {
    if (!r1 || r1.estado !== "opcao" || !r1.opcao) return null;
    const alvo = rotulo(r1.opcao).toLowerCase();
    return M.porCodigo["M5.P01"].opcoesLista.find((o) => rotulo(o).toLowerCase() === alvo) || null;
  }

  /* ---------------- "O que entendemos até aqui" (texto por regras, sem IA) ---------------- */
  const SEU_TIPO = { Produto: "o produto", Mercadoria: "a mercadoria", "Serviço": "o serviço" };
  const UNID = { Produto: ["unidade", "unidades"], Mercadoria: ["unidade", "unidades"], "Serviço": ["atendimento", "atendimentos"] };
  function brl(n) { return "R$\u00a0" + n.toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, "."); }
  /* c = calcular(...); ideia = texto do Módulo 1 (M1.P03) ou null */
  /* texto corrido: as frases de cada assunto viram um parágrafo (1 a 3 parágrafos curtos, sem lista) */
  const emParagrafos = (fr, ...cortes) => [0, ...cortes].map((c, i, a) => fr.slice(c, i + 1 < a.length ? a[i + 1] : fr.length).join(" ")).filter(Boolean);
  function entendemos(R, c, ideia) {
    const fr = [];
    const [un1, unN] = UNID[c.tipo] || ["venda", "vendas"];
    const nome = c.nome && String(c.nome).trim();
    const id = ideia && String(ideia).trim();
    if (c.tipo) {
      const item = nome ? `${SEU_TIPO[c.tipo]} “${nome}”` : SEU_TIPO[c.tipo];
      fr.push(id && (!nome || id.toLowerCase() !== nome.toLowerCase())
        ? `Seu negócio é “${id}” e, aqui, você analisou ${item}.`
        : `Você analisou ${item}.`);
    }
    const est = R[P_INICIAL] && R[P_INICIAL].estado === "opcao" ? R[P_INICIAL].opcao : null;
    const naoComecou = R["M5.P37"] && R["M5.P37"].estado === "opcao" && /^ainda n/i.test(R["M5.P37"].opcao);
    if (est === OPCOES_M1[0] || naoComecou) fr.push("Você ainda não vende, então estes números são uma simulação feita com estimativas.");
    else if (est === OPCOES_M1[1]) fr.push("Você está começando a vender, então alguns números ainda são estimativas.");
    else if (est) fr.push("Você já vende, então os números partem do que acontece hoje no seu negócio.");
    const c1 = fr.length;   // 1º parágrafo: o que analisou e em que ponto está; 2º: os números
    const COM = { Produto: "com materiais e embalagem", Mercadoria: "com a compra, o frete e a embalagem", "Serviço": "com os materiais que usa" };
    if (c.custoUnidade > 0) fr.push(`Em cada ${un1}, você gasta cerca de ${brl(c.custoUnidade)} ${COM[c.tipo] || ""}.`.replace(" .", "."));
    else if (c.tipo === "Serviço" && !c.faltas.length) fr.push("Seu serviço não gasta materiais a cada atendimento, então o custo de cada venda vem das taxas e dos gastos do mês.");
    if (c.mensal > 0) fr.push(`Todo mês, o negócio precisa cobrir ${brl(c.mensal)} de gastos (contas, perdas e o valor do seu trabalho, quando informados).`);
    else fr.push("Você não informou gastos do mês, como aluguel ou contas.");
    if (c.mc !== null && c.preco !== null) {
      const qual = c.precoInformado !== null ? "Cobrando" : "Com o preço possível de";
      if (c.mc > 0) {
        let f = `${qual} ${brl(c.preco)}, sobram ${brl(c.mc)} em cada ${un1}`;
        if (c.pe !== null && c.mensal > 0) {
          f += `, e você precisa de ${c.pe} ${c.pe === 1 ? un1 : unN} por mês para cobrir os gastos do mês`;
          if (c.qtd > 0 && c.resultado !== null) f += c.resultado >= 0 ? `. Vendendo ${c.qtd} por mês, sobram ${brl(c.resultado)} no fim do mês` : `. Vendendo ${c.qtd} por mês, faltam ${brl(-c.resultado)} para fechar o mês`;
        }
        fr.push(f + ".");
      } else fr.push(`${qual} ${brl(c.preco)}, cada ${un1} não deixa sobra depois do custo e das taxas: vale rever o preço ou os gastos.`);
    }
    return emParagrafos(fr.slice(0, 6), c1);
  }

  /* Simulação de outro preço e outra quantidade de vendas (resultado). */
  function simular(M, R, preco, qtd) {
    const c = calcular(M, R);
    const p = num(preco), q = num(qtd);
    if (p === null || p < 0 || q === null || q < 0) return null;
    const sobra = p - c.custoUnidade - (p * c.taxaPct) / 100;
    return { sobra, resultado: sobra * q - c.mensal, pe: sobra > 0 ? Math.ceil(c.mensal / sobra) : null, semSobra: sobra <= 0 && c.mensal > 0, abaixo: abaixoCusto(p, c.custoUnidade) };
  }
  /* Serviço: horas que a quantidade de atendimentos exige x horas disponíveis (Módulo 1). */
  function tempoExcede(c, opcaoM1) {
    const lim = HORAS_MES_M1[opcaoM1];
    if (c.tipo !== "Serviço" || !lim || !c.tempo || !(c.qtd > 0)) return null;
    const horas = (c.tempo * c.qtd) / 60;
    return horas > lim ? { horas, limite: lim } : null;
  }

  const API = { montar, ajudaNaoSei, analisarPreco, classificar, LUCRO_BAIXO, LUCRO_ALTO, MSG_PRECO, MSG_RESPONDA, PRECO, campo, opcoes, botoesAlternativos, regra, proxima, validar, calcular,
    itensDe, listaDeOrigem, num, compativel, valorCond, avisoQuantidade, faixaMercado, taxaMedia,
    P_INICIAL, P_FORMAS, OPCOES_M1, FORMAS, NOTA_CONSUMO, NOTA_LUZ_AGUA, MSG_QTD_ALTA, MSG_SOMA_PARTES, POUCAS_VENDAS,
    MARGEM_X_ACRESCIMO, MSG_SEM_SOBRA, MSG_SIMULACAO, MSG_ACIMA_MERCADO, MSG_TEMPO, MSG_DESCONTADOS, HORAS_MES_M1, simular, tempoExcede,
    herdarEstagio, herdarTipo, entendemos,
    LIMITE_ACRESCIMO, LIMITE_FATURAMENTO, TETO_M1, MSG_NUMERO, MSG_FAT_ALTO, avisoValor, msgVezes, msgAbaixoCusto, abaixoCusto, gastoInicial, avisoInvestimento,
    exemploConceito, EXEMPLO_TIPO };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  else raiz.Motor = API;
})(typeof window !== "undefined" ? window : globalThis);
