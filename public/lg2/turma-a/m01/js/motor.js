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
      const q = M.porCodigo[c], r = R[c];
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
  function entendimento(M, R) {
    const op = (c) => (R[c] && R[c].estado === "opcao" ? R[c].opcao : null);
    const frases = [];
    const ideia = R["M1.P03"] && R["M1.P03"].estado === "valor" ? minuscula(limpa(R["M1.P03"].valor)) : "";
    const tipo = tipoOferta(R);
    const vende = ["Já vendi algumas vezes", "Já vendo sempre"].includes(op("M1.P01"));
    if (ideia) frases.push((vende ? "Você vende " : "Você quer vender ") + ideia + (tipo ? TIPO[tipo] : "") + ".");
    else if (tipo) frases.push("O que você oferece é" + TIPO[tipo].replace(/^,/, "") + ".");
    if (ESTAGIO[op("M1.P01")]) frases.push(ESTAGIO[op("M1.P01")]);
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
    const q8 = M.porCodigo["M1.P08"];
    const pre = q8 ? (R["M1.P08"] && Array.isArray(R["M1.P08"].opcoes) ? R["M1.P08"].opcoes : []).map((t) => {
      const o = q8.opcoes.find((x) => x.texto === t);
      return o && o.campo ? (limpa(R["M1.P08"].detalhe) ? minuscula(limpa(R["M1.P08"].detalhe)) : "outra coisa") : (PREOCUPA[t] || minuscula(t));
    }) : [];
    if (pre.length) frases.push((pre.length > 1 ? "O que mais te preocupa agora: " : "O que mais te preocupa agora é: ") + juntar(pre) + ".");
    return frases;
  }

  const API = { montar, valor, completa, avaliar, proxima, caminho, textoPergunta, regrasTodas, retrato, refs, itens, tipoOferta, entendimento };
  if (typeof module !== "undefined") module.exports = API; else raiz.Motor = API;
})(this);
