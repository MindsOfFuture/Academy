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
    if (q.tipo === "multipla") {
      /* várias respostas: { estado:"opcao", opcao:<primeira marcada>, opcoes:[marcadas, na ordem da lista], detalhe? } */
      if (r.estado !== "opcao" || !Array.isArray(r.opcoes) || !r.opcoes.length) return false;
      const ops = r.opcoes.map((t) => (q.opcoes || []).find((o) => o.texto === t));
      if (ops.some((o) => !o)) return false;
      return ops.some((o) => o.campo) ? !!String(r.detalhe || "").trim() : true;
    }
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
    const r = R[m[1]];
    if (r && Array.isArray(r.opcoes)) return r.opcoes.includes(m[2]);
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

  /* pergunta como aparece para esta pessoa: "por_tipo" troca enunciado, opções ou exemplo conforme a
     palavra inicial da Pergunta 3A (Produto / Mercadoria / Serviço). Sem 3A respondida vale o texto base. */
  function efetiva(M, R, q) {
    if (!q || !q.por_tipo) return q;
    const t = tipoOferta(R);
    return t && q.por_tipo[t] ? Object.assign({}, q, q.por_tipo[t]) : q;
  }
  /* trocou o tipo na 3A: a resposta guardada da P4/P8 passa para o texto equivalente (mesma posição) da
     lista nova, para não perder o que a pessoa já tinha marcado */
  function remapear(M, R) {
    Object.keys(M.porCodigo).forEach((c) => {
      const q = M.porCodigo[c], r = R[c];
      if (!q.por_tipo || !r || r.estado !== "opcao") return;
      const agora = (efetiva(M, R, q).opcoes || []).map((o) => o.texto);
      if (!agora.length) return;
      const listas = [q.opcoes || []].concat(Object.values(q.por_tipo).map((v) => v.opcoes).filter(Boolean)).map((l) => l.map((o) => o.texto));
      const troca = (t) => {
        if (agora.includes(t)) return t;
        for (const l of listas) { const i = l.indexOf(t); if (i >= 0 && agora[i]) return agora[i]; }
        return t;
      };
      r.opcao = troca(r.opcao);
      if (Array.isArray(r.opcoes)) r.opcoes = r.opcoes.map(troca);
    });
    return R;
  }

  /* texto da pergunta; a Pergunta 4 repete a resposta da Pergunta 3 quando houver */
  function textoPergunta(M, R, q) {
    const pr = q.pergunta_com_resposta;
    if (pr) {
      const r = R[pr.de];
      if (r && r.estado === "valor" && !(pr.de === "M1.P03" && ideiaVaga(R))) {
        let t = String(r.valor || "").trim().replace(/[.!?;:,]+$/, "").trim();
        if (/^[A-ZÀ-Ý][a-zà-ÿ]/.test(t)) t = t[0].toLowerCase() + t.slice(1);
        if (t) return pr.modelo.replace("{resposta}", t);
      }
    }
    return q.pergunta;
  }

  const regrasTodas = (M, R) => (M.D.regras || []).filter((r) => avaliar(R, r.condicao) === true);

  /* itens marcados numa pergunta de várias respostas ("Outra coisa" leva o que a pessoa escreveu) */
  function itens(q, r) {
    if (!r || !Array.isArray(r.opcoes)) return [];
    return r.opcoes.map((t) => {
      const o = (q.opcoes || []).find((x) => x.texto === t);
      return o && o.campo && String(r.detalhe || "").trim() ? `${t}: ${String(r.detalhe).trim()}` : t;
    });
  }

  /* retrato: as respostas do usuário, na ordem do fluxo */
  function retrato(M, R) {
    return caminho(M, R).filter((c) => R[c] !== undefined).map((c) => {
      const q = efetiva(M, R, M.porCodigo[c]), r = R[c];
      if (q.tipo === "multipla") return { q, pergunta: textoPergunta(M, R, q), valor: itens(q, r).join("; "), itens: itens(q, r), detalhe: "", naosei: false };
      return { q, pergunta: textoPergunta(M, R, q), valor: valor(R, c), detalhe: r.detalhe || "",
        naosei: r.estado === "naosei" || valor(R, c) === "Não sei dizer" };
    });
  }

  /* ---------- "O que entendemos até aqui": frases montadas por regra a partir das respostas ---------- */
  const minuscula = (t) => (/^[A-ZÀ-Ý][a-zà-ÿ]/.test(t) ? t[0].toLowerCase() + t.slice(1) : t);
  const limpa = (t) => String(t || "").trim().replace(/[.!?;:,]+$/, "").trim();
  function juntar(l) { return l.length <= 1 ? (l[0] || "") : l.slice(0, -1).join(", ") + " e " + l[l.length - 1]; }
  const TIPO = {
    Produto: ", um produto: você compra os materiais e faz o que vende",
    Mercadoria: ", uma mercadoria: você compra pronto para revender",
    "Serviço": ", um serviço: o cliente paga pelo trabalho que você faz",
  };
  const ESTAGIO = {
    "Ainda está só na minha cabeça": "Por enquanto, a ideia está só na sua cabeça. O melhor agora é testar com pouca coisa antes de gastar.",
    "Já fiz um pouco para testar ou dar de amostra": "Você já fez um pouco para testar ou dar de amostra. É hora de ouvir quem provou: compraria? Por quanto?",
    "Já vendi algumas vezes": "Você já vendeu algumas vezes, então já sabe que tem gente que compra.",
    "Já vendo sempre": "Você já vende sempre, então o foco agora é organizar o que já funciona.",
  };
  const SABE = {
    "Sim, já faço bem": "Você já sabe fazer isso bem",
    "Sei um pouco, ainda estou aprendendo": "Você ainda está aprendendo a fazer isso",
    "Ainda não sei fazer": "Você ainda precisa aprender a fazer isso",
    /* Mercadoria: a Pergunta 4 fala de conhecer o produto e onde comprar */
    "Sim, conheço bem o produto e onde comprar": "Você já conhece bem o que vai revender e onde comprar",
    "Conheço um pouco, ainda estou pesquisando": "Você ainda está conhecendo o que vai revender e onde comprar",
    "Ainda não conheço": "Você ainda precisa conhecer melhor o que vai revender e onde comprar",
  };
  const TEMPO = {
    "Até 1 hora por dia": "tem até 1 hora por dia para o negócio",
    "De 1 a 3 horas por dia": "tem de 1 a 3 horas por dia para o negócio",
    "Mais de 3 horas por dia": "tem mais de 3 horas por dia para o negócio",
    "Só nos fins de semana": "só tem os fins de semana para o negócio",
  };
  const TEMPO_MAIS = {
    "Sim, consigo arrumar mais tempo": ", e consegue arrumar mais tempo se ele crescer",
    "Não, meus horários não podem mudar": ", e seus horários não podem mudar: o negócio cresce no seu ritmo",
    "Não sei dizer": ", e ainda não sabe se consegue arrumar mais tempo",
  };
  const DINHEIRO = {
    "Nada por enquanto": "Por enquanto, você não tem dinheiro para colocar no negócio",
    "Até R$ 100": "Você pode usar até R$ 100 sem faltar para as contas da casa",
    "Entre R$ 100 e R$ 500": "Você pode usar entre R$ 100 e R$ 500 sem faltar para as contas da casa",
    "Entre R$ 500 e R$ 1.000": "Você pode usar entre R$ 500 e R$ 1.000 sem faltar para as contas da casa",
    "Mais de R$ 1.000": "Você pode usar mais de R$ 1.000 sem faltar para as contas da casa",
  };
  const MATERIAL = {
    "Sim, tenho tudo": " e já tem tudo o que precisa para trabalhar",
    "Tenho só uma parte": " e já tem uma parte do que precisa para trabalhar",
    "Não tenho nada ainda": ", e ainda não tem o que precisa para trabalhar",
  };
  const PREOCUPA = {
    "Ainda não sei fazer direito": "ainda não saber fazer direito",
    "Ainda não conheço bem o produto ou os fornecedores": "ainda não conhecer bem o produto ou os fornecedores",
    "Me falta lugar ou equipamento": "a falta de lugar ou equipamento",
    "Conheço poucas pessoas para vender ou me ajudar": "conhecer poucas pessoas para vender ou te ajudar",
    "Tenho dificuldade com celular, internet ou redes sociais": "a dificuldade com celular, internet ou redes sociais",
  };
  /* palavra inicial da opção da 3A: Produto / Mercadoria / Serviço */
  function tipoOferta(R) {
    const r = R["M1.P03A"];
    const m = r && r.estado === "opcao" ? String(r.opcao).match(/^(Produto|Mercadoria|Serviço)(?=[:\s]|$)/) : null;
    return m ? m[1] : null;
  }
  /* texto corrido: as frases de cada assunto viram um parágrafo (1 a 3 parágrafos curtos, sem lista) */
  const emParagrafos = (fr, ...cortes) => [0, ...cortes].map((c, i, a) => fr.slice(c, i + 1 < a.length ? a[i + 1] : fr.length).join(" ")).filter(Boolean);
  function entendimento(M, R) {
    const op = (c) => (R[c] && R[c].estado === "opcao" ? R[c].opcao : null);
    const frases = [];
    const ideia = !ideiaVaga(R) && R["M1.P03"] && R["M1.P03"].estado === "valor" ? minuscula(limpa(R["M1.P03"].valor)) : "";
    const tipo = tipoOferta(R);
    const vende = ["Já vendi algumas vezes", "Já vendo sempre"].includes(op("M1.P01"));
    if (ideia) frases.push((vende ? "Você vende " : "Você quer vender ") + ideia + (tipo ? TIPO[tipo] : "") + ".");
    else if (tipo) frases.push("O que você oferece é" + TIPO[tipo].replace(/^,/, "") + ".");
    if (ESTAGIO[op("M1.P01")]) frases.push(ESTAGIO[op("M1.P01")]);
    const c1 = frases.length;   // 1º parágrafo: o que vende e em que ponto está
    const sabe = SABE[op("M1.P04")], tempo = TEMPO[op("M1.P05")];
    if (sabe || tempo) {
      let f = sabe || "Você";
      if (tempo) f += (sabe ? " e " : " ") + tempo + (TEMPO_MAIS[op("M1.P05A")] || "");
      frases.push(f + ".");
    }
    if (DINHEIRO[op("M1.P07")]) {
      let f = DINHEIRO[op("M1.P07")] + (MATERIAL[op("M1.P06")] || "");
      const a = op("M1.P07A");
      if (a && a !== "Não sei dizer") f += "; você pensa em começar " + minuscula(a);
      frases.push(f + ".");
    } else if (MATERIAL[op("M1.P06")]) frases.push("Você" + MATERIAL[op("M1.P06")].replace(/^,/, "") + ".");
    const c2 = frases.length;   // 2º: tempo, saber fazer e dinheiro; 3º: o que preocupa
    const q8 = efetiva(M, R, M.porCodigo["M1.P08"]);
    const pre = q8 ? (R["M1.P08"] && Array.isArray(R["M1.P08"].opcoes) ? R["M1.P08"].opcoes : []).map((t) => {
      const o = q8.opcoes.find((x) => x.texto === t);
      return o && o.campo ? (limpa(R["M1.P08"].detalhe) ? minuscula(limpa(R["M1.P08"].detalhe)) : "outra coisa") : (PREOCUPA[t] || minuscula(t));
    }) : [];
    if (pre.length) frases.push((pre.length > 1 ? "O que mais te preocupa agora: " : "O que mais te preocupa agora é: ") + juntar(pre) + ".");
    return emParagrafos(frases, c1, c2);
  }

  /* ---------- "O que ainda falta descobrir": respostas "Não sei" ou vagas, em linguagem simples ---------- */
  /* resposta da Pergunta 3 que não diz o que a pessoa vende */
  const IDEIA_VAGA = /^(n[ãa]o sei( ainda)?|ainda n[ãa]o sei|sei l[áa]|nada( ainda)?|qualquer coisa|alguma coisa|n[ãa]o tenho( ideia)?( ainda)?|talvez|\?+|-+|\.+)$/i;
  const IDEIA_MIN = 3;   // menos letras que isso também é vago ("x", "ok")
  function ideiaVaga(R) {
    const r = R["M1.P03"];
    if (!r) return false;
    if (r.estado === "naosei") return true;
    const t = limpa(r.valor);
    return t.replace(/[^A-Za-zÀ-ÿ]/g, "").length < IDEIA_MIN || IDEIA_VAGA.test(t);
  }
  const FALTA = {
    "M1.P03": "o que exatamente você vai vender",
    "M1.P05A": "se você consegue arrumar mais tempo quando o negócio crescer",
    "M1.P07A": "como você vai começar sem dinheiro ou sem material",
  };
  /* { codigo, texto }: o código deixa o resultado mostrar o "Como descobrir" daquela pergunta */
  function faltaItens(M, R) {
    const l = [];
    caminho(M, R).forEach((c) => {
      const r = R[c];
      if (!r) return;
      const ns = r.estado === "naosei" || (r.estado === "opcao" && r.opcao === "Não sei dizer");
      if ((c === "M1.P03" && ideiaVaga(R)) || ns)
        l.push({ codigo: c, texto: "Ainda falta saber: " + (FALTA[c] || minuscula(limpa(textoPergunta(M, R, efetiva(M, R, M.porCodigo[c]))))) + "." });
    });
    return l;
  }
  const faltaDescobrir = (M, R) => faltaItens(M, R).map((x) => x.texto);
  const NADA_FALTA = "Você respondeu tudo com clareza. Por enquanto, não falta descobrir nada nesta parte.";

  /* ---------- "Sua tarefa para fazer já": UMA tarefa, escolhida por regra (a primeira que vale) ---------- */
  function tarefa(M, R) {
    const op = (c) => (R[c] && R[c].estado === "opcao" ? R[c].opcao : null);
    const ideia = !ideiaVaga(R) && R["M1.P03"] && R["M1.P03"].estado === "valor" ? minuscula(limpa(R["M1.P03"].valor)) : "";
    const tipo = tipoOferta(R);
    if (!ideia) return "Escreva em uma frase o que você quer vender e para quem.";
    if (op("M1.P01") === "Ainda está só na minha cabeça") return `Pergunte a 3 pessoas próximas se comprariam ${ideia} e por quanto.`;
    if (op("M1.P01") === "Já fiz um pouco para testar ou dar de amostra") return `Pergunte a 3 pessoas que já experimentaram se comprariam ${ideia} e por quanto.`;
    if (tipo === "Mercadoria") return `Pesquise o preço de compra de ${ideia} em 2 fornecedores.`;
    if (tipo === "Serviço") return "Anote quanto tempo leva um atendimento, do começo ao fim.";
    if (tipo === "Produto") return `Anote quanto você gasta de material para fazer uma unidade de ${ideia}.`;
    return `Escreva quanto você cobra hoje por ${ideia} e quantas vendas fez no último mês.`;
  }

  /* ---------- avisos de combinação estranha (não travam; só aparecem no resultado) ---------- */
  function avisos(M, R) {
    const op = (c) => (R[c] && R[c].estado === "opcao" ? R[c].opcao : null);
    const l = [];
    const vende = ["Já vendi algumas vezes", "Já vendo sempre"].includes(op("M1.P01"));
    if (vende && op("M1.P04") === "Ainda não sei fazer")
      l.push("Você disse que já vende, mas também que ainda não sabe fazer o que vende. Se outra pessoa faz para você e você só revende, talvez a resposta sobre o que você oferece seja \"Mercadoria\". Confira suas respostas.");
    return l;
  }

  const API = { montar, valor, completa, avaliar, proxima, caminho, textoPergunta, regrasTodas, retrato, refs, itens, tipoOferta, entendimento,
    efetiva, remapear, ideiaVaga, faltaDescobrir, faltaItens, NADA_FALTA, tarefa, avisos };
  if (typeof module !== "undefined") module.exports = API; else raiz.Motor = API;
})(this);
