/* Resumo do negócio em texto corrido, montado por regras a partir das respostas dos Módulos 1 a 10
   guardadas neste aparelho (só leitura). Cada frase só aparece quando o dado existe.
   O MESMO arquivo está em turma-b/m10/js/ e em jornada/js/ (cada página é autocontida; há teste que
   confere que as duas cópias são iguais). A capacidade usa window.Motor7 (motor7.js), se carregado. */
(function (raiz) {
  "use strict";
  var CHAVES = { 1: "lg2-turma-a-m01", 2: "lg2-turma-b-m02", 3: "lg2-turma-a-m03", 4: "lg2-turma-a-m04", 5: "lg2-turma-a-m05",
    6: "lg2-turma-b-m06", 7: "lg2-turma-b-m07", 8: "lg2-turma-b-m08", 9: "lg2-turma-b-m09", 10: "lg2-turma-b-m10" };

  function lerLocal(n) {
    try { return JSON.parse(raiz.localStorage.getItem(CHAVES[n])) || null; } catch (e) { return null; }
  }

  /* ---------- leitura das respostas ---------- */
  var NS = /^(não sei|nao sei|ainda não defini)/i;
  function valor(r) { return !r ? null : r.estado === "opcao" ? r.opcao : r.estado === "valor" ? r.valor : null; }
  function texto(r) {
    var x = valor(r);
    if (typeof x === "number") return String(x);
    if (typeof x !== "string") return null;
    x = x.replace(/\s+/g, " ").trim();
    return x && !NS.test(x) ? x : null;
  }
  function num(v) {
    if (v === null || v === undefined) return null;
    if (typeof v === "number") return isFinite(v) ? v : null;
    var s = String(v).trim().replace(/[R$\s%]/g, "");
    if (!s) return null;
    if (s.indexOf(",") >= 0) s = s.replace(/\./g, "").replace(",", ".");
    var n = Number(s);
    return isFinite(n) ? n : null;
  }
  function brl(n) {
    var r = Math.round(n * 100) / 100;
    return "R$ " + r.toLocaleString("pt-BR", { minimumFractionDigits: r % 1 ? 2 : 0, maximumFractionDigits: 2 });
  }
  /* texto livre dentro de uma frase: sem ponto final, 1ª letra minúscula (exceto siglas), curto */
  function trecho(s, max) {
    s = String(s || "").replace(/\s+/g, " ").trim().replace(/[.;!]+$/, "");
    if (s.length > (max || 110)) s = s.slice(0, (max || 110) - 1).replace(/\s+\S*$/, "") + "…";
    return /^[A-ZÀ-Ú][a-zà-ú]/.test(s) ? s.charAt(0).toLowerCase() + s.slice(1) : s;
  }
  function juntar(xs) { return xs.length < 2 ? xs.join("") : xs.slice(0, -1).join(", ") + " e " + xs[xs.length - 1]; }
  function primeiro() { for (var i = 0; i < arguments.length; i++) if (arguments[i]) return arguments[i]; return null; }

  /* ---------- tipo e estágio ---------- */
  function tipoDe(s) {
    var m = /^(produto|mercadoria|serviço|servico)/i.exec(String(s || "").trim());
    if (!m) return null;
    var t = m[1].toLowerCase();
    return t === "produto" ? "Produto" : t === "mercadoria" ? "Mercadoria" : "Serviço";
  }
  var ESTAGIO_M1 = { "Ainda está só na minha cabeça": "ideia", "Já fiz um pouco para testar ou dar de amostra": "teste",
    "Já vendi algumas vezes": "algumas", "Já vendo sempre": "sempre" };
  var ESTAGIO_M10 = { "Ainda é uma ideia": "ideia", "Já fiz testes ou amostras": "teste", "Já vendo": "vende" };

  /* ---------- Módulo 5: custo de uma unidade, preço, sobra e gastos do mês (mesma conta do Módulo 5) ---------- */
  var FAMILIA = { kg: ["massa", 1000], g: ["massa", 1], l: ["vol", 1000], ml: ["vol", 1], unidade: ["un", 1] };
  function base(q, u) { var f = FAMILIA[String(u || "").toLowerCase()]; return f ? { fam: f[0], v: q * f[1] } : { fam: "outro:" + (u || ""), v: q }; }
  function taxaMedia(v25) {
    if (!Array.isArray(v25)) return num(v25) || 0;
    if (v25.length === 1) return num(v25[0].taxa) || 0;
    return v25.reduce(function (s, x) { return s + (num(x.taxa) || 0) * (num(x.parte) || 0) / 100; }, 0);
  }
  function contaM5(e5) {
    var R = (e5 && e5.R) || {};
    var v = function (c) { var r = R["M5." + c]; return r && r.estado === "valor" ? r.valor : null; };
    var op = function (c) { var r = R["M5." + c]; return r && r.estado === "opcao" ? String(r.opcao).split(":")[0].trim() : null; };
    var tipo = tipoDe(op("P01"));
    var custo = 0, faltou = false, temItens = false;
    function materiais(pL, pP, pC, pU, div) {
      var nomes = (v(pL) || []).filter(function (s) { return String(s).trim(); });
      var precos = v(pP) || [], comp = v(pC) || [], usa = v(pU) || [];
      nomes.forEach(function (nome, i) {
        var p = num(precos[i]), c = comp[i] && num(comp[i].q), u = usa[i] && num(usa[i].q);
        if (p === null || !c || u === null || base(1, comp[i].u).fam !== base(1, usa[i].u).fam) { faltou = true; return; }
        temItens = true;
        custo += (p * (base(u, usa[i].u).v / base(c, comp[i].u).v)) / div;
      });
    }
    function pacote(cond, pPac) {
      if (op(cond) !== "Sim") return;
      var pk = v(pPac);
      if (pk && num(pk.qtd) > 0) { temItens = true; custo += num(pk.preco) / num(pk.qtd); } else faltou = true;
    }
    if (tipo === "Produto") {
      var n = num(v("P07"));
      if (n > 0) materiais("P03", "P04", "P05", "P06", n); else faltou = true;
      pacote("P08", "P09");
    } else if (tipo === "Mercadoria") {
      var compra = num(v("P11")), qtd0 = num(v("P12"));
      if (compra !== null && qtd0 > 0) {
        temItens = true; custo += compra / qtd0;
        if (op("P13") === "Sim") { var fr = num(v("P14")); if (fr) custo += fr / qtd0; else faltou = true; }
      } else faltou = true;
      pacote("P15", "P16");
    } else if (tipo === "Serviço") {
      if (op("P18") === "Sim") materiais("P19", "P20", "P21", "P22", 1);
    }
    var precoInf = num(v("P36"));
    var lucro = num(e5 && e5.lucro);
    var preco = precoInf !== null && precoInf > 0 ? precoInf : !faltou && custo > 0 && lucro !== null && lucro >= 0 ? custo * (1 + lucro / 100) : null;
    var taxaPct = op("P24") === "Sim" ? taxaMedia(v("P25")) : 0;
    var taxa = preco !== null ? (preco * taxaPct) / 100 : 0;
    var custoOk = tipo && !faltou && (temItens || tipo === "Serviço");
    var sobra = preco !== null && custoOk ? preco - custo - taxa : null;
    var outros = (v("P33") || []).reduce(function (s, x) { return s + (num(x && x.v) || 0); }, 0);
    var mensal = (num(v("P29")) || 0) + (num(v("P31")) || 0) + outros + (num(v("P27")) || 0) + (num(v("P35")) || 0);
    var qtd = num(v("P37"));
    return { tipo: tipo, custo: custoOk ? custo : null, taxa: taxa, preco: preco, sugerido: preco !== null && precoInf === null,
      sobra: sobra, mensal: mensal, qtd: qtd > 0 ? qtd : null, pe: sobra > 0 && mensal > 0 ? Math.ceil(mensal / sobra - 1e-9) : null };
  }

  /* ---------- Módulo 7: capacidade por mês (mesmas contas do Módulo 7) ---------- */
  function capM7(e7) {
    var M7 = raiz.Motor7;
    if (!M7 || !e7) return null;
    var ini = e7.ini || {}, R = e7.R || {};
    var r2 = R["M7-02"], r3 = R["M7-03"], r4 = R["M7-04"], r5a = R["M7-05a"];
    var minUn = ini.minUn > 0 ? ini.minUn : r2 && r2.estado === "valor" ? r2.minUn : null;
    var apoio = r3 ? (r3.estado === "naosei" ? "Não sei" : r3.opcao) : null;
    var ajuda = r4 && r4.estado === "opcao" ? r4.horas || 0 : 0;
    var equip = r5a && r5a.estado === "valor" ? { un: M7.num(r5a.un), minVez: r5a.minVez } : null;
    var c = M7.capacidade({ horas: ini.horas, apoio: apoio, ajuda: ajuda, minUn: minUn, equip: equip });
    if (!c || c.estado !== "ok") return null;
    var vol = M7.num(ini.volume);
    return { texto: M7.texto(c, "mes"), vol: vol > 0 ? vol : null, cmp: M7.comparar(c, vol > 0 ? vol : null) };
  }

  /* ---------- frases ---------- */
  var TIPO_TXT = { Produto: "um produto feito por você", Mercadoria: "uma mercadoria que você compra pronta para revender", "Serviço": "um serviço" };
  var EST_TXT = { ideia: "e por enquanto ainda é uma ideia", teste: "e você já fez os primeiros testes", algumas: "e você já vendeu algumas vezes",
    sempre: "e você já vende com frequência", vende: "e você já vende" };
  var EST_SO = { ideia: "Seu negócio ainda é uma ideia.", teste: "Você já fez os primeiros testes do seu negócio.", algumas: "Você já vendeu algumas vezes.",
    sempre: "Você já vende com frequência.", vende: "Você já vende." };

  /* ler(n) devolve o estado salvo do Módulo n; m10 (opcional) traz o que o Módulo 10 tem na tela agora */
  function frases(ler, m10) {
    ler = ler || lerLocal;
    var R = function (n) { var s = ler(n); return (s && s.R) || {}; };
    var r1 = R(1), r2 = R(2), r3 = R(3), r4 = R(4), r8 = R(8), r9 = R(9), r6 = R(6);
    var e10 = ler(10) || {};
    var ini10 = (m10 && m10.ini) || e10.ini || {};
    var out = [];

    /* 1. ideia, tipo e estágio */
    var ideia = primeiro(ini10.oferta && String(ini10.oferta).trim(), texto(r1["M1.P03"]), texto(r3["M3.P01"]), texto(r4["M4.P01"]), texto(r8["M8.P01"]));
    var c5 = contaM5(ler(5));
    var tipo = primeiro(tipoDe(texto(r1["M1.P03A"])), c5.tipo, tipoDe(texto(r4["M4.P02"])), tipoDe(texto(r8["M8.P02"])));
    var est = primeiro(ESTAGIO_M10[ini10.estagio], ESTAGIO_M1[texto(r1["M1.P01"])]);
    if (est === "vende" && ESTAGIO_M1[texto(r1["M1.P01"])] === "algumas") est = "algumas";
    if (est === "vende" && ESTAGIO_M1[texto(r1["M1.P01"])] === "sempre") est = "sempre";
    if (ideia || tipo) {
      var s1 = "Seu negócio é " + (ideia ? trecho(ideia, 90) + (tipo ? ", " + TIPO_TXT[tipo] : "") : TIPO_TXT[tipo]);
      out.push(s1 + (est ? (ideia && tipo ? ", " : " ") + EST_TXT[est] : "") + ".");
    } else if (est) out.push(EST_SO[est]);

    /* 2. cliente e dor */
    var p10 = r3["M3.P10"], p10op = p10 && p10.estado === "opcao" ? p10.opcao : null;
    var cliente = primeiro(texto(r4["M4.P08"]), texto(r2["M2.P02"]), ini10.grupo,
      p10op === "Empresas" ? "empresas" : p10op && /^Pessoas/.test(p10op) ? "pessoas comuns, que compram para si" : null);
    var dor = primeiro(texto(r4["M4.P09"]), texto(r3["M3.P11"]));
    if (cliente && dor) out.push("Você vende para " + trecho(cliente, 80) + " e ajuda com " + trecho(dor, 90) + ".");
    else if (cliente) out.push("Você vende para " + trecho(cliente, 80) + ".");
    else if (dor) out.push("Você ajuda o seu cliente com " + trecho(dor, 90) + ".");

    /* 3. preço, custo e sobra (Módulo 5) */
    var preco = c5.preco;
    var precoM10 = num(ini10.preco);
    if (precoM10 !== null && precoM10 > 0 && (preco === null || Math.abs(precoM10 - preco) > 0.004)) { preco = precoM10; c5.sugerido = false; c5.sobra = c5.custo !== null ? preco - c5.custo - c5.taxa : null; c5.pe = c5.sobra > 0 && c5.mensal > 0 ? Math.ceil(c5.mensal / c5.sobra - 1e-9) : null; }
    if (preco !== null) {
      var s3 = (c5.sugerido ? "O preço sugerido para você é " : "Você cobra ") + brl(preco) + " por venda";
      if (c5.sobra !== null && c5.custo > 0) {
        var gasto = c5.custo + c5.taxa;
        s3 += c5.sobra > 0 ? "; tirando " + brl(gasto) + " de " + (c5.taxa > 0 ? "custo e taxas" : "custo") + ", sobram " + brl(c5.sobra) + " em cada venda"
          : "; com " + brl(gasto) + " de " + (c5.taxa > 0 ? "custo e taxas" : "custo") + ", não sobra dinheiro em cada venda";
      }
      out.push(s3 + ".");
    }
    /* 4. gastos do mês e vendas */
    if (c5.mensal > 0) {
      var s4 = "Seus gastos do mês somam " + brl(c5.mensal);
      if (c5.pe) {
        s4 += ", então você precisa de pelo menos " + c5.pe + (c5.pe === 1 ? " venda" : " vendas") + " por mês para cobri-los";
        if (c5.qtd) s4 += c5.qtd >= c5.pe ? ", e as " + c5.qtd + " que você espera fazer já cobrem" : ", e hoje você espera fazer " + c5.qtd;
      }
      out.push(s4 + ".");
    } else if (preco !== null && c5.qtd) out.push("Com " + c5.qtd + " vendas por mês, entram cerca de " + brl(preco * c5.qtd) + ".");

    /* 5. dinheiro para começar (Módulo 6) */
    var invest = ["M6.P02", "M6.P11", "M6.P14", "M6.P17"].reduce(function (s, k) { var n = num(texto(r6[k])); return n > 0 ? s + n : s; }, 0);
    var tem = num(texto(r6["M6.P07"]));
    if (invest > 0 && tem !== null && tem >= 0) out.push("Para começar, você precisa de cerca de " + brl(invest) + " e tem " + brl(tem) + (tem >= invest ? ", o que cobre esse começo." : ": faltam " + brl(invest - tem) + "."));
    else if (invest > 0) out.push("Para começar, você estima gastar cerca de " + brl(invest) + ".");
    else if (tem > 0) out.push("Você tem " + brl(tem) + " para usar no negócio.");

    /* 6. capacidade (Módulo 7) */
    var cap = capM7(ler(7));
    if (cap) {
      var s6 = "No tempo que você tem, dá para fazer " + cap.texto + " por mês";
      if (cap.cmp && cap.cmp.tipo === "falta") s6 += ", menos do que os " + cap.vol + " que você pretende fazer";
      else if (cap.cmp) s6 += ", o que dá conta dos " + cap.vol + " que você pretende fazer";
      out.push(s6 + ".");
    }

    /* 7. formalização (Módulo 8) e licenças (Módulo 9) */
    var leg = [];
    var cnpj = texto(r8["M8.P05"]);
    if (cnpj === "Não") leg.push("você ainda não tem CNPJ" + (texto(r8["M8.P07"]) === "Sim" ? " e a sua atividade pode ser MEI" : ""));
    else if (cnpj) leg.push("você já tem CNPJ (" + cnpj + ")");
    var via = texto(r9["M9-04"]);
    if (via === "Sim, foi aprovada") leg.push("a prefeitura já aprovou a atividade no endereço");
    else if (via === "Sim, foi negada") leg.push("a prefeitura negou a atividade no endereço escolhido");
    else if (via === "Ainda não fiz" || (r9["M9-04"] && r9["M9-04"].estado === "naosei")) leg.push("ainda falta perguntar à prefeitura se a atividade pode funcionar no endereço");
    if (/^Sim/.test(texto(r9["M9-02"]) || "")) leg.push("a Vigilância Sanitária faz parte do seu caminho");
    if (leg.length) out.push("Na parte de documentos, " + leg.join("; ") + ".");

    /* 8. prioridade e próxima ação (Módulo 10) */
    var R10 = (m10 && m10.R) || e10.R || {};
    var r9p = R10["M10-09"];
    var prio = primeiro(m10 && m10.prioridade, e10.prioridade, r9p && r9p.opcoes && r9p.opcoes[0], r9p && r9p.outro);
    var r11 = R10["M10-11"];
    var plano = r11 && r11.estado === "plano" && r11.frase ? r11.frase : null;
    if (prio && plano) out.push("Sua prioridade agora é " + trecho(prio, 90) + ", e o próximo passo é: " + trecho(plano, 140) + ".");
    else if (prio) out.push("Sua prioridade agora é " + trecho(prio, 90) + ".");

    return out.slice(0, 8);
  }

  var API = { CHAVES: CHAVES, frases: frases, contaM5: contaM5, capM7: capM7, brl: brl, lerLocal: lerLocal };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  raiz.ResumoNegocio = API;
})(typeof window !== "undefined" ? window : globalThis);
