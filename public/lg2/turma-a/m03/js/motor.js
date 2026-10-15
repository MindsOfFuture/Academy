/* Motor do Módulo 3 (22 perguntas reescritas pelo grupo).
   Decide a próxima pergunta (único desvio: "Não" na pergunta 2 pula as perguntas 3 a 8)
   e escolhe, para cada resposta, a linha da aba "Caminhos por resposta" que vale.
   Não cria texto: só escolhe entre os textos da planilha. */
(function (raiz) {
  "use strict";
  const NS = "Não sei";
  const DESVIO = { de: "M3.P02", se: "Não", pula: ["M3.P03", "M3.P04", "M3.P05", "M3.P06", "M3.P07", "M3.P08"] };
  /* respostas que mostram a dica e deixam corrigir ou seguir ("Permitir corrigir e continuar") */
  const CORRIGIR = new Set(["Resposta vazia ou muito curta", "Resposta muito genérica", "Texto sem valor em reais",
    "Preencheu só um dos campos", "Campos complementares incompletos"]);
  /* resumo: "Não transformar hipótese em fato" */
  const HIPOTESE = new Set(["M3.P04", "M3.P08", "M3.P11", "M3.P19"]);

  function montar(D) {
    const perguntas = D.perguntas.slice();
    const porCodigo = {};
    perguntas.forEach((p) => (porCodigo[p.codigo] = p));
    return { D, perguntas, porCodigo };
  }

  function campo(q) {
    const t = String(q.tipo || "");
    if (/m[uú]ltipla/i.test(t)) return "multipla";
    if (/\+\s*campos/i.test(t)) return "escolhacampos";
    if (/sele[cç][aã]o [uú]nica/i.test(t)) return "escolha";
    if (/2 campos/.test(t)) return "doiscampos";
    return "texto";
  }

  const visivel = (q, R) => !(DESVIO.pula.includes(q.codigo) && R[DESVIO.de] && R[DESVIO.de].opcao === DESVIO.se);
  const visiveis = (M, R) => M.perguntas.filter((q) => visivel(q, R));
  function proxima(M, R, cod) {
    const lista = M.perguntas;
    const i = cod ? lista.findIndex((p) => p.codigo === cod) : -1;
    for (let j = i + 1; j < lista.length; j++) if (visivel(lista[j], R)) return lista[j].codigo;
    return "RESULTADO";
  }

  /* ---- leitura das respostas ---- */
  const curta = (v) => String(v || "").trim().length < 10;
  const sem = (s) => String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  /* "só termos como 'qualidade' ou 'bom atendimento'" */
  const GENERICOS = new Set(("qualidade bom boa bons boas otimo otima otimos otimas excelente atendimento preco precos " +
    "justo justos melhor melhores produto produtos servico servicos confianca confiavel muito mais simpatia carinho " +
    "honestidade compromisso").split(" "));
  const VAZIAS = new Set("de da do das dos e em para pra um uma o a os as com no na nos nas ter tem".split(" "));
  function generica(txt) {
    const pal = sem(txt).split(/[^a-z0-9]+/).filter((w) => w && !VAZIAS.has(w));
    return pal.every((w) => GENERICOS.has(w));       // vazio também é genérico
  }
  /* números em pt-BR ("R$ 1.200,50", "40", "59,90"); se houver "R$", usa só os valores com "R$" */
  function numeros(txt) {
    const t = String(txt || "");
    const re = /(R\$\s*)?(\d{1,3}(?:\.\d{3})+(?:,\d+)?|\d+(?:,\d+)?)/g;
    const todos = [];
    let m;
    while ((m = re.exec(t))) todos.push({ rs: !!m[1], n: parseFloat(m[2].replace(/\./g, "").replace(",", ".")) });
    const comRS = todos.filter((x) => x.rs);
    return (comRS.length ? comRS : todos).map((x) => x.n);
  }
  const media = (ns) => ns.reduce((a, b) => a + b, 0) / ns.length;
  const reais = (n) => n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const piores = (tab) => Object.values(tab || {}).filter((v) => v === "Pior").length;

  function linha(q, opcao, troca) {
    const c = (q.caminhos || []).find((x) => x.opcao === opcao);
    if (!c) return null;
    return { opcao: c.opcao, tipo: c.tipo, texto: troca ? c.texto.replace(/\[valor\]/g, troca) : c.texto };
  }
  const linhaNaoSei = (q) => (q.caminhos || []).find((x) => /^Não sei/.test(x.opcao));

  /* linhas da aba 2 que valem para a resposta r (inclui as do tipo "Nenhum") */
  function retornos(q, r) {
    if (!r) return [];
    const tipo = campo(q);
    let lista = [];
    if (r.estado === "naosei") {
      const ns = linhaNaoSei(q);
      lista = [ns && linha(q, ns.opcao)];
      if (q.criterios && piores(r.tabela) >= 3) lista.push(linha(q, "Marcou 'Pior' em 3 ou mais critérios"));
    } else if (tipo === "escolha") lista = [linha(q, r.opcao)];
    else if (tipo === "escolhacampos") {
      lista = [linha(q, r.opcao)];
      const vals = q.campos[r.opcao].map((c) => (r.campos || {})[c]);
      if (vals.some((v) => !String(v || "").trim())) lista.push(linha(q, "Campos complementares incompletos"));
    } else if (tipo === "multipla") {
      const ops = r.opcoes || [];
      lista = ops.length ? q.opcoes.filter((o) => ops.includes(o)).map((o) => linha(q, o)) : [linha(q, "Nenhuma opção marcada")];
    } else if (tipo === "doiscampos") {
      const n = q.campos.filter((c) => String((r.campos || {})[c] || "").trim()).length;
      lista = [linha(q, n === 2 ? "Preencheu os dois campos" : "Preencheu só um dos campos")];
    } else {
      const ops = q.caminhos.map((c) => c.opcao);
      if (ops.includes("Informou valores")) {
        const ns = numeros(r.valor);
        lista = [ns.length ? linha(q, "Informou valores", reais(media(ns))) : linha(q, "Texto sem valor em reais")];
      } else if (ops.includes("Resposta muito genérica")) {
        lista = [linha(q, generica(r.valor) ? "Resposta muito genérica" : "Resposta preenchida")];
      } else {
        const cheia = ops.find((o) => !/^Não sei/.test(o) && o !== "Resposta vazia ou muito curta");
        lista = [linha(q, curta(r.valor) ? "Resposta vazia ou muito curta" : cheia)];
      }
    }
    return lista.filter(Boolean);
  }
  const mostraveis = (q, r) => retornos(q, r).filter((c) => c.tipo !== "Nenhum");
  const bloqueia = (lista) => lista.some((c) => c.tipo === "Alerta");
  const corrigir = (lista) => lista.some((c) => CORRIGIR.has(c.opcao));

  /* "Prompt: \"...\"" dentro do texto do grupo: antes, prompt, depois (instrução de conferir) */
  function partesPrompt(texto) {
    const m = String(texto).match(/^([\s\S]*?)\s*Prompt:\s*"([\s\S]*)"\s*([\s\S]*)$/);
    return m ? { antes: m[1].trim(), prompt: m[2].trim(), depois: m[3].trim() } : { antes: "", prompt: String(texto), depois: "" };
  }
  /* "1. ... 2. ..." vira lista */
  const passos = (texto) => String(texto).split(/(?:^|\s)\d+\.\s+/).map((s) => s.trim()).filter(Boolean);

  const pendente = (r) => !!r && r.estado === "naosei";
  function texto(q, r) {
    if (!r) return "";
    const tipo = campo(q);
    const pares = (obj, nomes) => nomes.map((c) => `${c}: ${String((obj || {})[c] || "").trim() || "—"}`);
    if (r.estado === "naosei") {
      const extra = [];
      if (r.marcados && r.marcados.length) extra.push(r.marcados.join("; "));
      if (q.criterios && r.tabela && Object.keys(r.tabela).length) extra.push(q.criterios.filter((c) => r.tabela[c]).map((c) => `${c}: ${r.tabela[c]}`).join("; "));
      if (r.frase) extra.push(r.frase);
      return [NS].concat(extra).join(" — ");
    }
    if (tipo === "escolha") return r.opcao;
    if (tipo === "escolhacampos") return [r.opcao].concat(pares(r.campos, q.campos[r.opcao])).join(" — ");
    if (tipo === "multipla") return (r.opcoes || []).join("; ") + (r.detalhe ? ` — ${r.detalhe}` : "");
    if (tipo === "doiscampos") return pares(r.campos, q.campos).join(" — ");
    return String(r.valor || "").trim();
  }
  /* o resumo marca como hipótese só quando há algo informado */
  function hipotese(q, r) {
    if (!HIPOTESE.has(q.codigo) || !r) return false;
    if (r.estado === "naosei") return !!(q.criterios && r.tabela && Object.keys(r.tabela).length);
    return !!String(r.valor || "").trim();
  }

  const API = { montar, campo, visivel, visiveis, proxima, curta, generica, numeros, media, reais, piores, linha, retornos,
                mostraveis, bloqueia, corrigir, partesPrompt, passos, pendente, texto, hipotese, NS, DESVIO };
  if (typeof module !== "undefined") module.exports = API; else raiz.Motor = API;
})(this);
