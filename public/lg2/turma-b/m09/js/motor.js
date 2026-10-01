/* Motor do Módulo 9. Lê as condições exatamente como o grupo escreveu na planilha
   ("M9.P06 = Na minha casa ou M9.P06 = ...", "≠ Não sei", "<= 200") e decide
   quais perguntas aparecem, quais regras valem e o que entra no checklist.
   Não cria texto: só escolhe entre os textos da planilha. */
(function (raiz) {
  "use strict";
  const NS = "Não sei";
  const COD = /M9\.P\d{2}/g;
  const CNAE = /\d{4}-\d\/\d{2}/g;
  const NIVEL = { "Nível I": 1, "Nível II": 2, "Nível III": 3 };

  function montar(D) {
    const perguntas = D.perguntas.filter((p) => p.codigo);
    const porCodigo = {};
    perguntas.forEach((p) => {
      p.opcoesLista = String(p.opcoes || "").split(";").map((s) => s.trim()).filter(Boolean);
      porCodigo[p.codigo] = p;
    });
    const base = {};
    D.instrumentos.I02.forEach((l) => { if (l.cnae) base[l.cnae] = l; });
    return { D, perguntas, porCodigo, base };
  }

  /* o que o usuário respondeu, como texto comparável à planilha */
  function valor(R, cod) {
    const r = R[cod];
    if (!r) return undefined;
    if (r.estado === "naosei") return NS;
    return r.estado === "opcao" ? r.opcao : String(r.valor ?? "").trim();
  }

  function campo(q) {
    if (/escolha|sim\/n/i.test(q.tipo)) return "escolha";
    if (/n[uú]mero/i.test(q.tipo)) return "numero";
    return "texto";
  }
  /* botão "Não sei" fora da lista de opções (perguntas de texto e número) */
  const temNaoSei = (q) => campo(q) !== "escolha" && q.opcoesLista.includes(NS);

  /* CNAEs digitados em P05 cruzados com a base local (M9.I02) */
  function cnaes(M, R) {
    const v = valor(R, "M9.P05");
    if (!v || v === NS) return [];
    return [...new Set(v.match(CNAE) || [])].map((c) => ({ cnae: c, linha: M.base[c] || null }));
  }
  function aplicaJF(R) {
    const v = valor(R, "M9.P01");
    return v !== "Outro município de MG" && v !== "Outro estado" && v !== NS;
  }
  function nivel(M, R) {
    if (!aplicaJF(R)) return null;
    const lista = cnaes(M, R).filter((c) => c.linha);
    if (!lista.length) return null;
    const n = Math.max(...lista.map((c) => NIVEL[c.linha.nivel] || 0));
    return n ? { n, rotulo: Object.keys(NIVEL).find((k) => NIVEL[k] === n), linha: lista.find((c) => NIVEL[c.linha.nivel] === n).linha } : null;
  }

  /* ---- condições escritas pelo grupo ---- */
  function atomo(M, R, txt) {
    txt = txt.trim();
    if (/^sempre$/i.test(txt)) return true;
    if (/^#\d+$/.test(txt)) return GRUPOS[+txt.slice(1)];
    if (/M9\.P05 com CNAE de nível III/i.test(txt)) {
      if (R["M9.P05"] === undefined) return undefined;
      return cnaes(M, R).some((c) => c.linha && c.linha.nivel === "Nível III");
    }
    if (/M9\.P05 com 2 ou mais CNAEs de níveis diferentes/i.test(txt)) {
      if (R["M9.P05"] === undefined) return undefined;
      return new Set(cnaes(M, R).filter((c) => c.linha).map((c) => c.linha.nivel)).size >= 2;
    }
    /* coluna G da base local ("Pode na residência?") = Não */
    if (/M9\.P05 com CNAE fora do anexo do Dec\. 15\.004/i.test(txt)) {
      if (R["M9.P05"] === undefined) return undefined;
      return cnaes(M, R).some((c) => c.linha && /^Não/.test(c.linha.residencia || ""));
    }
    const m = txt.match(/^(M9\.P\d{2})\s*(<=|>=|≠|=|<|>)\s*(.+)$/);
    if (!m) return false;
    const [, cod, op, alvo] = m;
    const v = valor(R, cod);
    if (v === undefined) return undefined;
    if (op === "=") return v === alvo.trim();
    if (op === "≠") return v !== alvo.trim() && v !== "";
    const n = parseFloat(String(v).replace(/\./g, "").replace(",", "."));
    if (v === NS || isNaN(n)) return false;
    const a = parseFloat(alvo);
    return op === "<=" ? n <= a : op === ">=" ? n >= a : op === "<" ? n < a : n > a;
  }
  /* parênteses da coluna F: "(A ou B) e C". O grupo de dentro é avaliado primeiro e vira #n */
  let GRUPOS = [];
  function avaliar(M, R, cond) {
    let txt = String(cond || "");
    const salvo = GRUPOS; GRUPOS = salvo.slice();
    let m;
    /* só parênteses que contêm uma condição; "(revenda de produtos)" é texto da opção */
    while ((m = txt.match(/\(([^()]*M9\.P\d{2}\s*(?:=|≠|<|>)[^()]*)\)/))) {
      const v = avaliar(M, R, m[1]);
      GRUPOS.push(v);
      txt = txt.replace(m[0], "#" + (GRUPOS.length - 1));
    }
    const r = avaliarSimples(M, R, txt);
    GRUPOS = salvo;
    return r;
  }
  function avaliarSimples(M, R, cond) {
    const ou = String(cond || "").split(/\s+ou\s+(?=M9\.P|#)/);
    let indef = false;
    for (const parte of ou) {
      const es = parte.split(/\s+e\s+(?=M9\.P|#)/).map((a) => atomo(M, R, a));
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
      const q = M.perguntas[j];
      if (avaliar(M, R, q.condicao) === true) return q.codigo;
    }
    return "RESULTADO";
  }

  /* regras que acabaram de ficar completas ao responder `cod` */
  function regrasAgora(M, R, cod) {
    return M.D.regras.filter((r) => {
      const rs = refs(r.condicao);
      return rs.includes(cod) && rs.every((c) => R[c] !== undefined) && avaliar(M, R, r.condicao) === true;
    });
  }
  /* todas as regras que valem com as respostas finais */
  function regrasTodas(M, R) {
    return M.D.regras.filter((r) => avaliar(M, R, r.condicao) === true);
  }

  /* ---- checklist M9.I01: aplica-se / não se aplica / confirmar ---- */
  /* interesse sanitário: P07 começa com "Sim", ou algum CNAE da base local é de um grupo de saúde */
  const SANIT = /^(Alimentação|Beleza|Saúde|Animais)/;
  function checklist(M, R) {
    const v = (c) => valor(R, c);
    const local = v("M9.P08"), p07 = v("M9.P07");
    const casa = local === "Na minha casa" || local === "Em apartamento ou condomínio residencial";
    const localIndef = local === undefined || local === NS || local === "Ainda não escolhi";
    const sanit = /^Sim/.test(p07 || "") || cnaes(M, R).some((c) => c.linha && SANIT.test(c.linha.grupo));
    const sanitIndef = !sanit && (p07 === undefined || p07 === NS);
    const nv = nivel(M, R);
    const tri = (sim, talvez) => (sim ? "aplica-se" : talvez ? "confirmar" : "não se aplica");
    const sitP = (c, sim, talvez) => {
      const x = v(c);
      if (x === undefined || x === NS) return "confirmar";
      return sim(x) ? "aplica-se" : talvez && talvez(x) ? "confirmar" : "não se aplica";
    };
    const nivelSt = (k) => (nv ? tri(nv.n === k) : aplicaJF(R) ? "confirmar" : "não se aplica");
    const st = {
      "1": "aplica-se",
      "2": aplicaJF(R) ? "aplica-se" : v("M9.P01") === NS ? "confirmar" : "não se aplica",
      "3": "aplica-se",
      "4": tri(casa, localIndef),
      "5": tri(local === "Em apartamento ou condomínio residencial", localIndef),
      "6": sitP("M9.P02", (x) => x === "Ainda não"),
      "7a": nivelSt(1), "7b": nivelSt(2), "7c": nivelSt(3),
      "8": local === "Sem local fixo (digital, na casa do cliente ou ambulante)" || localIndef ? "confirmar" : "aplica-se",
      "9": tri(sanit, sanitIndef),
      "10": tri(sanit && casa, (sanit && localIndef) || (sanitIndef && casa)),
      "11": sitP("M9.P17", (x) => x === "Sim"),
      "12": sitP("M9.P16", (x) => x === "Sim"),
      "13": sitP("M9.P18", (x) => x.startsWith("Sim"), (x) => x === "Só pequenos reparos"),
      "14": "aplica-se",
    };
    return M.D.instrumentos.I01.filter((l) => l.etapa).map((l) => Object.assign({}, l, { situacao: st[l.etapa] || "confirmar" }));
  }

  /* ---- M9.I03: só os órgãos acionados pelas respostas ---- */
  function orgaos(M, R, lista) {
    const s = {}; lista.forEach((l) => (s[l.etapa] = l.situacao));
    const ativo = (k) => s[k] && s[k] !== "não se aplica";
    const enc = new Set(regrasTodas(M, R).map((r) => r.encaminhamento));
    const p02 = valor(R, "M9.P02");
    const quer = [
      true, true,                                        // Sala do Empreendedor, Redesim-MG
      p02 === "Ainda não" || p02 === NS,                 // Portal do Empreendedor
      ativo("9") && aplicaJF(R),                         // Vigilância Sanitária de JF
      ativo("9") && !aplicaJF(R),                        // SES-MG
      ativo("8"),                                        // CBMMG
      ativo("11") || ativo("13"),                        // SESMAUR
      ativo("11"),                                       // SEMAD-MG
      ativo("12"),                                       // Conselho profissional
      enc.has("Contador"),                               // Contador
      enc.has("Sebrae"),                                 // Sebrae
    ];
    return M.D.instrumentos.I03.filter((l, i) => l.orgao && quer[i]);
  }

  /* ---- M9.I04: perguntas para levar, pela coluna "Quando incluir" ---- */
  function roteiro(M, R) {
    const v = (c) => valor(R, c);
    const p05 = v("M9.P05"), p07 = v("M9.P07");
    /* uma linha por linha da aba M9.I04, coluna "Quando incluir" */
    const testes = [
      () => ["Ainda não fiz", NS].includes(v("M9.P10")),                                   // M9.P10 = Ainda não fiz ou Não sei
      () => p05 !== undefined && p05 !== NS && p05 !== "",                                 // M9.P05 informado
      () => v("M9.P08") === "Na minha casa",                                               // M9.P08 = Na minha casa
      () => v("M9.P08") === "Em apartamento ou condomínio residencial",                    // M9.P08 = Em apartamento...
      () => p07 !== undefined && p07 !== "Não",                                            // M9.P07 ≠ Não
      () => v("M9.P12") === "Sim, mais de 20 pessoas" || /^Sim, (mais que isso|líquidos)/.test(v("M9.P13") || ""), // P12 ou P13 com valores altos
      () => ["Sim", NS].includes(v("M9.P17")),                                             // M9.P17 = Sim ou Não sei
      () => ["Sim", NS].includes(v("M9.P16")),                                             // M9.P16 = Sim ou Não sei
      () => /^Sim/.test(v("M9.P18") || "") || v("M9.P18") === NS,                          // M9.P18 = Sim ou Não sei
      () => true,                                                                          // Sempre
    ];
    return M.D.instrumentos.I04.filter((l, i) => l.tema && testes[i] && testes[i]());
  }

  const semVazio = (rs, campo, nada) => [...new Set(rs.map((r) => r[campo]).filter((x) => x && x !== nada))];
  const lacunas = (rs) => semVazio(rs, "lacuna", "Nenhuma");
  const encaminhamentos = (rs) => semVazio(rs, "encaminhamento", "Nenhum");
  const alertas = (rs) => semVazio(rs, "alerta", "Nenhum");

  const API = { montar, valor, campo, temNaoSei, cnaes, nivel, aplicaJF, avaliar, proxima, regrasAgora, regrasTodas,
                checklist, orgaos, roteiro, lacunas, encaminhamentos, alertas, NS };
  if (typeof module !== "undefined") module.exports = API; else raiz.Motor = API;
})(this);
