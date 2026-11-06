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
  /* preço dos concorrentes (campo numérico, nov/2026): o que é texto bloqueia; o que é fora do comum só avisa */
  const PRECO_ALTO = 1000;      // acima disto (R$ por unidade ou por atendimento) mostra aviso que não trava
  const PRECO_RAZAO = 10;       // maior preço mais de 10 vezes o menor: aviso de conferir se é a mesma coisa
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
    if (/faixa de pre[cç]o/i.test(t)) return "preco";
    return "texto";
  }

  const visivel = (q, R) => !(DESVIO.pula.includes(q.codigo) && R[DESVIO.de] && R[DESVIO.de].opcao === DESVIO.se);
  const visiveis = (M, R) => M.perguntas.filter((q) => visivel(q, R));

  /* ---- telas: perguntas puladas por já terem resposta e perguntas que dividem a mesma tela ----
     H = o que veio de outros módulos ({ ideia, tipo, estagio }), montado pelo app. */
  const PESSOAS = "Pessoas comuns (consumidor final)", DOR = "O que precisa resolver (a dor)";
  /* concorrentes: duas perguntas curtas na mesma tela (cada uma guarda a sua resposta) */
  const PARES = [["M3.P15", "M3.P16"], ["M3.P17", "M3.P18"]];
  function dorDoPerfil(R) {
    const r = R["M3.P10"];
    const d = r && r.estado === "opcao" && r.opcao === PESSOAS && r.campos ? String(r.campos[DOR] || "").trim() : "";
    return d || null;
  }
  /* o que vende já veio do Módulo 1; a dor já foi escrita no perfil do cliente */
  function pulada(q, R, H) {
    if (q.codigo === "M3.P01") return !!(H && H.ideia);
    if (q.codigo === "M3.P11") return !!dorDoPerfil(R);
    return false;
  }
  function telas(M, R, H) {
    const lista = M.perguntas.filter((q) => visivel(q, R) && !pulada(q, R, H)).map((q) => q.codigo);
    const out = [];
    for (let i = 0; i < lista.length; i++) {
      const par = PARES.find((p) => p[0] === lista[i]);
      if (par && lista[i + 1] === par[1]) { out.push(par.slice()); i++; } else out.push([lista[i]]);
    }
    return out;
  }
  const tela = (M, R, H, cod) => telas(M, R, H).find((t) => t.includes(cod)) || [cod];
  function proxima(M, R, cod, H) {
    const idx = (c) => M.perguntas.findIndex((p) => p.codigo === c);
    const i = cod ? idx(cod) : -1;
    const t = telas(M, R, H).find((t) => t.some((c) => idx(c) > i) && !t.some((c) => idx(c) === i) && idx(t[0]) > i);
    return t ? t[0] : "RESULTADO";
  }
  /* textos da versão "o que você imagina" (quem ainda não começou) */
  const variante = (q, est) => (est && q.variantes && q.variantes[est]) || {};

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
  /* um campo de preço: "40", "59,90", "R$ 1.200,50", "12.5". Devolve {n} ou {erro} */
  function lerPreco(txt) {
    const t = String(txt || "").replace(/^\s*R\$\s*/i, "").replace(/\s+/g, "");
    if (!t) return { vazio: true };
    if (/^-/.test(t) && /^-\d/.test(t)) return { erro: "O preço não pode ser negativo. Digite só números. Ex.: 12,50" };
    let m;
    if ((m = t.match(/^\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?$/))) return { n: parseFloat(t.replace(/\./g, "").replace(",", ".")) };
    if ((m = t.match(/^\d+(?:[.,]\d{1,2})?$/))) return { n: parseFloat(t.replace(",", ".")) };
    return { erro: "Digite só números. Ex.: 12,50" };
  }
  /* os dois campos (menor e maior): erro que bloqueia, aviso que não trava e a resposta a gravar */
  function faixaPreco(a, b) {
    const x = lerPreco(a), y = lerPreco(b);
    if (x.erro || y.erro) return { erro: x.erro || y.erro };
    if (x.vazio && y.vazio) return { erro: "Digite o menor preço que você viu ou toque em “Não sei”." };
    let ns = [x.n, y.n].filter((n) => n != null);
    const min = Math.min(...ns), max = Math.max(...ns);
    const avisos = [];
    if (max > PRECO_ALTO) avisos.push(`Esse valor parece alto para o preço de uma unidade ou de um atendimento num pequeno negócio (R$ ${reais(max)}). Confira se digitou certo.`);
    if (min === 0) avisos.push("Um dos preços ficou em zero. Confira se digitou certo.");
    else if (ns.length === 2 && max > min * PRECO_RAZAO) avisos.push("O maior preço é mais de 10 vezes o menor. Confira se está comparando a mesma coisa.");
    const valor = min === max ? `R$ ${reais(min)}` : `de R$ ${reais(min)} a R$ ${reais(max)}`;
    return { r: { estado: "valor", valor, min, max }, aviso: avisos.join(" ") || null };
  }
  const media = (ns) => ns.reduce((a, b) => a + b, 0) / ns.length;
  const reais = (n) => n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const piores = (tab) => Object.values(tab || {}).filter((v) => v === "Pior").length;

  function linhaE(q, opcao, troca, est) {
    const c = (q.caminhos || []).find((x) => x.opcao === opcao);
    if (!c) return null;
    const t = (variante(q, est).caminhos || {})[c.opcao] || c.texto;
    return { opcao: c.opcao, tipo: c.tipo, texto: troca ? t.replace(/\[valor\]/g, troca) : t };
  }
  const linha = linhaE;
  const linhaNaoSei = (q) => (q.caminhos || []).find((x) => /^Não sei/.test(x.opcao));

  /* linhas da aba 2 que valem para a resposta r (inclui as do tipo "Nenhum") */
  function retornos(q, r, est) {
    if (!r) return [];
    const tipo = campo(q);
    const linha = (q, o, troca) => linhaE(q, o, troca, est);
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
    } else if (tipo === "preco") {
      const ns = r.min != null ? [...new Set([r.min, r.max])] : numeros(r.valor);
      lista = [ns.length ? linha(q, "Informou valores", reais(media(ns))) : null];
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
  const mostraveis = (q, r, est) => retornos(q, r, est).filter((c) => c.tipo !== "Nenhum");
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
  function texto(q, r, est) {
    if (!r) return "";
    const tipo = campo(q);
    const rot = variante(q, est).campos || {};
    const pares = (obj, nomes) => nomes.map((c) => `${rot[c] || c}: ${String((obj || {})[c] || "").trim() || "—"}`);
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

  const API = { montar, campo, visivel, visiveis, proxima, telas, tela, pulada, dorDoPerfil, variante, PARES, PESSOAS, DOR, curta, generica, numeros, media, reais, piores, linha, retornos,
                mostraveis, bloqueia, corrigir, lerPreco, faixaPreco, PRECO_ALTO, PRECO_RAZAO, partesPrompt, passos, pendente, texto, hipotese, NS, DESVIO };
  if (typeof module !== "undefined") module.exports = API; else raiz.Motor = API;
})(this);
