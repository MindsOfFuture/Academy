/* Telas do Módulo 8. Todo texto de conteúdo vem de window.MODULO8 (a planilha),
   sem edição. As respostas ficam só neste aparelho.
   Layout do Módulo 5: barra do topo com trilha, faixa roxa com ilustração, cartão da pergunta e
   cartão de conclusão. A planilha não divide as perguntas em seções: o progresso fica numa barra
   amarela dentro da faixa roxa, no lugar das etapas. */
(function () {
  "use strict";
  const D = window.MODULO8, M = Motor.montar(D);
  const tela = document.getElementById("tela");
  const CHAVE = "lg2-turma-b-m08";
  /* Limites (nov/2026). Limite do MEI em 2026: R$ 81 mil por ano (gov.br, "Teto do MEI", e Lei Complementar 123/2006,
     art. 18-A). A Lei Complementar 238/2026 (sancionada em 21/10/2026) sobe o teto para R$ 110 mil em 2027 e R$ 140 mil
     a partir de 2028. Passar até 20% do limite tira do MEI no ano seguinte; mais que isso, desde janeiro do mesmo ano. */
  const LIMITE_MEI_ANO = 81000;          // vale até 31/12/2026
  const LIMITE_MEI_2027 = 110000;        // LC 238/2026
  const TOLERANCIA_MEI = 0.2;            // até 20% acima do limite
  const FAT_MES_ALTO = 20000;            // acima disso por mês: aviso "parece alto para um pequeno negócio" (não trava)
  const ESPERA_TECLADO = 300;            // ms até rolar o campo para o centro, depois que o teclado abre
  const ESPERA_RETORNO = 700;            // ms sem digitar até mostrar o retorno ao vivo (lote 17/11, item A)
  const LIMITE_TEXTO = 220;              // dica com mais que isso: 1ª frase à vista e o resto em "Ver mais"
  const DOMICILIO = "Na casa do cliente (atendimento em domicílio)";   // opção do local (lote 3); o Módulo 10 usa o mesmo texto
  /* fontes oficiais (consultadas em 06/11/2026) */
  const FONTE = {
    criterios: "https://www.gov.br/pt-br/servicos/realizar-registro-como-microempreendedor-individual-mei",   // gov.br: condições a), c) e d) do serviço
    portal: "https://www.gov.br/empresas-e-negocios/pt-br/empreendedor",
    salaJF: "https://desenvolvejf.pjf.mg.gov.br/sme.html",                                                  // Sala Mineira do Empreendedor, Prefeitura de Juiz de Fora
    sebrae: "https://sebrae.com.br/sites/PortalSebrae/estamosai",
    lei238: "https://www2.camara.leg.br/legin/fed/leicom/2026/leicomplementar-238-21-outubro-2026-800071-publicacaooriginal-181678-pl.html",
    tetoMei: "https://www.gov.br/memp/pt-br/prospera-mei/teto-do-mei",
  };
  const SEBRAE_TEL = "0800 570 0800";
  /* "Não sei" (lote 16/11): em TODA pergunta que o mantém, tocar em "Não sei" mostra a caixa "Como descobrir"
     (passos + pedido para a IA, dados/modulo8.js: comoDescobrir, promptIA), não grava nada e o Continuar só anda
     com uma resposta de verdade. O "Não sei" saiu de P01 (o que você faz), P03 (onde trabalha) e P10 (sua dúvida):
     são perguntas sobre a própria pessoa. Resposta antiga "Não sei" vira "sem resposta" ao carregar (migrar). */
  /* Perguntas repetidas na jornada (lote 16/11, item F): quando outro módulo já tem a resposta, a tela não aparece;
     a resposta entra no formato deste módulo (com de: N e reuso: true) e um cartão "Veio do Módulo N · Trocar" mostra o que veio.
     P01 ← M1.P03 / M3.P01 / M4.P01 · P02 ← M1.P03A / M5.P01 / M4.P02 · P03 ← M9-03 · P04 ← M6.P05 ou M5.P36 × M5.P37 */
  const REUSO = ["M8.P01", "M8.P02", "M8.P03", "M8.P04"];
  const ROTULO_REUSO = { "M8.P01": "O que você faz", "M8.P02": "O que você vende", "M8.P03": "Onde trabalha", "M8.P04": "Faturamento por mês",
                         "M8.P07": "Está na lista do MEI" };
  /* P07 ("está na lista do MEI?") sai respondida "Sim" quando o CNAE da P06 está na lista de ocupações do MEI (de: "CNAE") */
  const DE_CNAE = "CNAE";
  /* anotações da pesquisa: perguntas que dependem de pesquisar (lote 16/11) */
  const NOTAS_EM = ["M8.P02", "M8.P04", "M8.P05", "M8.P06", "M8.P07", "M8.P08", "M8.P09"];
  /* exemplos de faturamento e de CNAE pelo tipo do negócio (P02) */
  const EX_FAT = {
    "Produto": "Ex.: vendeu 100 bolos de R$ 10 no mês: faturou R$ 1.000.",
    "Mercadoria": "Ex.: revendeu 30 perfumes de R$ 50 no mês: faturou R$ 1.500.",
    "Serviço": "Ex.: fez 40 cortes de cabelo de R$ 30 no mês: faturou R$ 1.200.",
    "Produto e serviço": "Ex.: R$ 800 de bolos + R$ 400 de decoração de festas = R$ 1.200 no mês.",
  };
  const EX_CNAE = {
    "Produto": "Ex.: 1091-1/02 é o código de quem faz bolos e doces para vender.",
    "Mercadoria": "Ex.: 4772-5/00 é o código de quem revende cosméticos.",
    "Serviço": "Ex.: 9602-5/01 é o código de cabeleireiro e de manicure.",
    "Produto e serviço": "Ex.: 1091-1/02 é o código de quem faz bolos e doces para vender.",
  };
  const MSG_ESCOLHA = "Escolha uma opção para continuar. Se não souber, toque em “Não sei” para ver como descobrir.";
  const MSG_ESCREVA = "Escreva a sua resposta para continuar. Se não souber, toque em “Não sei” para ver como descobrir.";

  const vazio = (s) => !s || !String(s).trim() || s === "—" || s === "-" || s === "Nenhum" || s === "Nenhuma";

  let S = carregar();               // { R: respostas, hist: [códigos] }
  function carregar() { try { return migrar(JSON.parse(localStorage.getItem(CHAVE)) || novo()); } catch { return novo(); } }
  /* resposta antiga "Não sei" (em qualquer pergunta): vira "sem resposta" e a trilha volta para ela; as outras ficam */
  function migrar(s) {
    if (!s.R) s.R = {};
    if (!Array.isArray(s.hist)) s.hist = [];
    let corte = -1, mudou = false;
    for (const cod of Object.keys(s.R)) {
      if (!/^M8\.P/.test(cod) || Motor.valor(s.R, cod) !== Motor.NS) continue;   // "Não sei" em botão de opção ou no botão à parte
      delete s.R[cod]; mudou = true;
      const i = s.hist.indexOf(cod);
      if (i >= 0 && (corte < 0 || i < corte)) corte = i;
      else if (i < 0) { corte = -1; s.hist = []; }   // fora da trilha salva: recomeça a navegação do início, com as respostas guardadas
    }
    if (corte >= 0) s.hist = s.hist.slice(0, corte + 1);
    if (mudou) try { localStorage.setItem(CHAVE, JSON.stringify(s)); } catch {}   // a última da trilha é a pergunta apagada: "Continuar de onde parei" abre nela
    return s;
  }
  function novo() { return { R: {}, hist: [] }; }
  function salvar() { try { localStorage.setItem(CHAVE, JSON.stringify(S)); } catch {} }

  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const link = (u, t) => /^https?:/.test(u || "") ? `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(t || u)}</a>` : esc(t || u);
  function el(html) { const d = document.createElement("div"); d.innerHTML = html.trim(); return d.firstElementChild; }
  /* item D (17/11): a tela nova leva o foco para o enunciado (pergunta) ou o título da conclusão, sem rolar */
  function ir(f, ...a) {
    tela.innerHTML = ""; tela.appendChild(f(...a)); window.scrollTo(0, 0);
    const alvo = tela.querySelector("[data-foco]");
    if (alvo) alvo.focus({ preventScroll: true });
  }

  /* ================= herança: o que já foi respondido em outros módulos (só leitura) =================
     P01 atividade ← M1.P03 (depois M3.P01, M4.P01) · P02 tipo ← M1.P03A, M5.P01, M4.P02
     P03 local ← M9-03 (+ M9-03a / M9-03b) · P04 faturamento ← M5.P36 × M5.P37.
     A resposta herdada só pré-preenche a pergunta; a pessoa confere e toca Continuar. "Não sei" não conta. */
  const NS = Motor.NS;
  function lerR(chave) { try { const s = JSON.parse(localStorage.getItem(chave)); return (s && s.R) || {}; } catch { return {}; } }
  const textoDe = (r) => { if (!r) return null; let v = r.estado === "opcao" ? r.opcao : r.estado === "valor" ? r.valor : null; if (typeof v === "number") v = String(v); return typeof v === "string" && v.trim() && v.trim() !== NS ? v.trim() : null; };
  function numero(v) {
    let s = String(v ?? "").replace(/[R$\s]/g, "");
    if (!s) return null;
    if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
    else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, "");
    const n = parseFloat(s);
    return isFinite(n) ? n : null;
  }
  const round2 = (n) => Math.round(n * 100) / 100;
  /* número no padrão brasileiro (2.250.000 · 2.500,50), também para o valor que vai dentro do campo */
  const brNum = (n) => round2(n).toLocaleString("pt-BR", { minimumFractionDigits: Number.isInteger(round2(n)) ? 0 : 2, maximumFractionDigits: 2 });
  const reais = (n) => "R$\u00a0" + brNum(n);
  const qtd = (n) => n.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
  /* "Como calculamos" do faturamento por ano (os mesmos valores arredondados da conta mostrada) */
  const calcAno = (mes) => `Como calculamos: ${reais(mes)} por mês × 12 meses = ${reais(round2(mes) * 12)} por ano.`;
  /* tipo de oferta dos outros módulos → opção deste módulo:
     "Produto: …" → Produto · "Mercadoria: …" → Mercadoria · "Serviço: …" → Serviço
     Produto+Serviço ou Mercadoria+Serviço (Módulo 4) → Produto e serviço · Mercadoria+Produto → Produto */
  function tipoP02(t) {
    if (!t) return null;
    const temS = /servi[cç]o/i.test(t), temP = /produto/i.test(t), temM = /mercadoria/i.test(t);
    return temS && (temP || temM) ? "Produto e serviço" : temS ? "Serviço" : temP ? "Produto" : temM ? "Mercadoria" : null;
  }
  function localP03(m9) {
    const a = textoDe(m9["M9-03"]), sa = textoDe(m9["M9-03a"]), sb = textoDe(m9["M9-03b"]);
    const casa = (x) => /casa|apartamento|condom/i.test(x || "") && !/cliente/i.test(x || "");
    const loja = (x) => /loja|sala comercial/i.test(x || "");
    const semFixo = () => /internet|telefone/i.test(sa || "") ? "Online" : sa ? "Atendimento externo" : null;
    if (/^Na casa do cliente/i.test(a || "")) return DOMICILIO;
    if (casa(a)) return "Minha casa";
    if (loja(a)) return "Ponto comercial";
    if (/sem local fixo/i.test(a || "")) return semFixo();
    if (casa(sb)) return "Minha casa";
    if (loja(sb)) return "Ponto comercial";
    if (/sem local fixo/i.test(sb || "")) return semFixo();
    return null;
  }
  /* devolve { r, de, nota } com a resposta já no formato deste módulo, ou null */
  function herdado(cod) {
    const m1 = lerR("lg2-turma-a-m01");
    if (cod === "M8.P01") {
      const fontes = [[m1, "M1.P03", 1], [lerR("lg2-turma-a-m03"), "M3.P01", 3], [lerR("lg2-turma-a-m04"), "M4.P01", 4]];
      for (const [R, c, n] of fontes) { const t = textoDe(R[c]); if (t) return { r: { estado: "valor", valor: t }, de: n }; }
    }
    if (cod === "M8.P02") {
      const fontes = [[m1, "M1.P03A", 1], [lerR("lg2-turma-a-m05"), "M5.P01", 5], [lerR("lg2-turma-a-m04"), "M4.P02", 4]];
      for (const [R, c, n] of fontes) { const t = tipoP02(textoDe(R[c])); if (t) return { r: { estado: "opcao", opcao: t }, de: n }; }
    }
    if (cod === "M8.P03") {
      const t = localP03(lerR("lg2-turma-b-m09"));
      if (t) return { r: { estado: "opcao", opcao: t }, de: 9 };
    }
    if (cod === "M8.P04") {
      /* Módulo 6: quanto espera vender em um mês (já é o faturamento) */
      const m6 = numero(textoDe(lerR("lg2-turma-b-m06")["M6.P05"]));
      if (m6 > 0) return { r: { estado: "valor", valor: brNum(m6) }, de: 6 };
      const m5 = lerR("lg2-turma-a-m05");
      const preco = numero(textoDe(m5["M5.P36"])), vendas = numero(textoDe(m5["M5.P37"]));
      if (preco > 0 && vendas > 0) {
        const total = round2(preco * vendas);
        return { r: { estado: "valor", valor: brNum(total) }, de: 5,
                 nota: `${reais(preco)} (preço de uma venda) × ${qtd(vendas)} (${vendas === 1 ? "venda" : "vendas"} por mês) = ${reais(total)} por mês` };
      }
    }
    return null;
  }
  /* o que os outros módulos dizem do tipo de oferta, mesmo depois de respondido aqui: { opcao, de, original } */
  function tipoHerdado() {
    const fontes = [["lg2-turma-a-m01", "M1.P03A", 1], ["lg2-turma-a-m05", "M5.P01", 5], ["lg2-turma-a-m04", "M4.P02", 4]];
    for (const [k, c, n] of fontes) { const o = textoDe(lerR(k)[c]); const t = tipoP02(o); if (t) return { opcao: t, de: n, original: o }; }
    return null;
  }
  /* naPergunta: o aviso aparece ao vivo, logo abaixo das opções (lote 17/11, item A); no resumo, aponta "Revisar respostas" */
  function avisoTipo(escolhida, naPergunta) {
    const h = tipoHerdado();
    if (!h || !escolhida || escolhida === NS || escolhida === h.opcao) return "";
    const engano = naPergunta ? "escolha outra opção acima" : "toque em “Revisar respostas”, no fim desta página";
    return `<div class="bloco b-alerta" id="aviso-tipo"><b>Confira o tipo de atividade</b>Na Etapa ${esc(h.de)} você respondeu “${esc(h.original)}”. Aqui você escolheu “${esc(escolhida)}”. Se mudou de ideia, tudo bem, pode seguir. Se foi engano, ${engano}. ${selo(h.de)}</div>`;
  }

  /* faturamento por ano: o informado aqui (por mês × 12) ou, se respondeu "Não sei", preço × vendas por mês do Módulo 5 × 12 */
  function faturamentoAno() {
    const v = Motor.valor(S.R, "M8.P04"), n = v && v !== NS ? numero(v) : null;
    if (n != null && n >= 0) return { ano: round2(n) * 12, mes: round2(n), de: S.R["M8.P04"] && S.R["M8.P04"].de };
    const m5 = lerR("lg2-turma-a-m05"), preco = numero(textoDe(m5["M5.P36"])), vendas = numero(textoDe(m5["M5.P37"]));
    if (preco > 0 && vendas > 0) { const mes = round2(preco * vendas); return { ano: mes * 12, mes, de: 5 }; }
    return null;
  }
  /* tipo de CNPJ pela sigla: "MEI (Microempreendedor Individual)" e o antigo "MEI" valem igual */
  const sigla = (v) => (v == null ? v : String(v).split(" (")[0].trim());
  /* alerta forte quando o faturamento passa do limite do MEI */
  function alertaMei() {
    const f = faturamentoAno();
    if (!f || f.ano <= LIMITE_MEI_ANO) return "";
    const cnpj = sigla(Motor.valor(S.R, "M8.P05"));
    if (cnpj && !["MEI", "Não", NS].includes(cnpj)) return "";          // ME, EI, SLU ou LTDA já não são MEI
    const teto20 = LIMITE_MEI_ANO * (1 + TOLERANCIA_MEI);
    const origem = f.de ? ` ${selo(f.de)}` : "";
    const conta = `Você estima faturar ${reais(f.mes)} por mês, cerca de <b class="num">${reais(f.ano)} por ano</b>.${origem} O limite do MEI em 2026 é de ${reais(LIMITE_MEI_ANO)} por ano (${reais(LIMITE_MEI_ANO / 12)} por mês, em média).</p>
      <p class="como-calc">${calcAno(f.mes)} Limite por mês: ${reais(LIMITE_MEI_ANO)} ÷ 12 meses = ${reais(LIMITE_MEI_ANO / 12)}.`;
    const calc20 = `<p class="como-calc">Como calculamos: ${reais(LIMITE_MEI_ANO)} + 20% (${reais(LIMITE_MEI_ANO * TOLERANCIA_MEI)}) = ${reais(teto20)} por ano.</p>`;
    const corpo = cnpj === "MEI"
      ? `<p>${conta}</p><p>Com esse faturamento, o seu negócio <b>sai do MEI</b>. Isso se chama <b>desenquadramento</b>: a empresa passa a ser microempresa, com outros impostos e obrigações.</p>
         <p>${f.ano <= teto20 ? `Como passou até 20% do limite (até ${reais(teto20)}), a mudança vale a partir de janeiro do ano seguinte, e você paga um imposto a mais sobre o que passou.` : `Como passou mais de 20% do limite (acima de ${reais(teto20)}), a mudança vale desde janeiro deste ano, e pode haver imposto a pagar sobre o ano todo.`}</p>${calc20}`
      : `<p>${conta}</p><p>Com esse faturamento, o <b>MEI não serve</b> para o seu negócio: quem passa do limite sai do MEI (desenquadramento). Será preciso abrir o CNPJ de outra forma, como microempresa.</p>`;
    return `<section class="alerta-forte" id="alerta-mei" role="alert">
      <b class="af-tit">Atenção: faturamento acima do limite do MEI</b>
      ${corpo}
      <p><b>O que fazer:</b> procure um contador ou a Sala do Empreendedor da sua cidade antes de seguir vendendo nesse ritmo.</p>
      ${f.ano <= LIMITE_MEI_2027 ? `<p class="mini-info">Em 2027 o limite sobe para ${reais(LIMITE_MEI_2027)} por ano (Lei Complementar 238/2026). Confira a sua situação com o contador.</p>` : ""}
      <p class="mini-info">Fonte: gov.br, “Teto do MEI” e Lei Complementar 238/2026.</p>
    </section>`;
  }

  const mesmo = (a, b) => !!a && !!b && a.estado === b.estado && (a.opcao ?? a.valor) === (b.opcao ?? b.valor);
  /* faturamento por ano dentro do limite: a conta logo na resposta da P04 (acima do limite, o alerta já mostra a conta) */
  function blocoAno() {
    const f = faturamentoAno();
    if (!f || f.ano > LIMITE_MEI_ANO) return "";
    return `<div class="bloco b-proximo" id="conta-ano"><b>Seu faturamento no ano</b>
      <p>Cerca de <strong>${reais(f.ano)} por ano</strong>: dentro do limite do MEI em 2026, que é de ${reais(LIMITE_MEI_ANO)} por ano.</p>
      <p class="como-calc">${calcAno(f.mes)}</p></div>`;
  }
  /* B4 (17/11): quem JÁ é MEI e fatura dentro do limite não lê "o MEI pode ser um caminho": vê a folga até o limite */
  const jaMei = () => sigla(Motor.valor(S.R, "M8.P05")) === "MEI";
  const calcFolga = (ano) => `Como calculamos: ${reais(LIMITE_MEI_ANO)} (limite do MEI em 2026) − ${reais(ano)} (seu faturamento no ano) = ${reais(LIMITE_MEI_ANO - ano)} de folga por ano.`;
  function blocoFolga() {
    const f = faturamentoAno();
    if (!f || f.ano > LIMITE_MEI_ANO || !jaMei()) return "";
    return `<div class="bloco b-proximo" id="folga-mei"><b>Você continua dentro do limite do MEI</b>
      <p>Você fatura cerca de ${reais(f.ano)} por ano. Ainda cabem <strong>${reais(LIMITE_MEI_ANO - f.ano)} por ano</strong> até o limite do MEI em 2026 (${reais(LIMITE_MEI_ANO)}).</p>
      <p class="como-calc">${calcAno(f.mes)} ${calcFolga(f.ano)}</p></div>`;
  }
  const selo = (de) => `<span class="veio">${de === DE_CNAE ? "Veio da sua escolha do CNAE" : `Veio da Etapa ${esc(de)}`}</span>`;

  /* conceitos da Base técnica ligados à pergunta: pela fonte citada na pergunta */
  function conceitosDe(q) {
    const f = String(q.fonte || "").split(",")[0].trim().toLowerCase();
    if (!f) return [];
    const chave = f.replace(/\s*\(.*$/, "").slice(0, 22);
    return D.base.filter((b) => String(b.fonte || "").toLowerCase().includes(chave)).slice(0, 2);
  }
  const educativoDe = (cod) => D.educativo.filter((e) => e.onde === cod);

  function blocoEducativo(lista) {
    return lista.map((e) => `
      <div class="caixa caixa-${e.tipo === "Faça" ? "faca" : e.tipo === "Entenda" ? "entenda" : "ia"}">
        <span class="tag">${esc(e.tipo)}</span>
        <b>${esc(e.titulo)}</b>
        <p>${esc(e.texto)}</p>
        ${vazio(e.exemplo) ? "" : `<p class="ex">${esc(e.exemplo)}</p>`}
        ${vazio(e.prompt) ? "" : `<div class="prompt"><p>${esc(e.prompt)}</p><button class="btn-copiar" data-t="${esc(e.prompt)}">Copiar texto</button></div>
          <p class="ex">${esc(e.conferir)}</p>`}
        <span class="fonte">Fonte: ${esc(e.fonte)}</span>
      </div>`).join("");
  }
  function blocoConceitos(lista) {
    if (!lista.length) return "";
    return `<details class="saiba"><summary>Entenda os termos</summary>${lista.map((b) => `
      <div class="conceito"><b>${esc(b.conceito)}</b><p>${esc(b.definicao)}</p>
      ${vazio(b.exemplo) ? "" : `<p class="ex">${esc(b.exemplo)}</p>`}
      <span class="fonte">Fonte: ${link(b.link, b.fonte)}${vazio(b.data) ? "" : ` · consultado em ${esc(b.data)}`}</span></div>`).join("")}
    </details>`;
  }
  /* "Não sei": caixa "Como descobrir" (2 passos + pedido pronto para a IA com Copiar) */
  function caixaComo(q, cls) {
    if (!q || !q.comoDescobrir || !q.comoDescobrir.length) return "";
    return `<b class="como-tit">Como descobrir</b>
      <ol>${q.comoDescobrir.map((x) => `<li>${esc(x)}</li>`).join("")}</ol>
      ${q.promptIA ? `<div class="pedir-ia">
        <b>Peça ajuda à IA</b>
        <p class="como-nota">Copie, cole numa IA de sua preferência e troque o que está entre colchetes.</p>
        <p class="prompt" data-prompt>${esc(q.promptIA)}</p>
        <button class="btn-alt copiar" type="button" data-copiar>Copiar</button>
      </div>` : ""}`;
  }
  /* copiar com reserva: área de transferência → execCommand → deixa o texto selecionado (como nos Módulos 1 e 10) */
  function copiarPrompt(b) {
    const alvo = b.parentNode.querySelector("[data-prompt]"), t = alvo.textContent;
    const pronto = () => { b.textContent = "Copiado!"; setTimeout(() => { if (document.contains(b)) b.textContent = "Copiar"; }, 2000); };
    const reserva = () => {
      const ta = document.createElement("textarea");
      ta.value = t; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.top = "0"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      let foi = false;
      try { foi = document.execCommand("copy"); } catch (e) {}
      ta.remove();
      if (foi) return pronto();
      try { const r = document.createRange(); r.selectNodeContents(alvo); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r); } catch (e) {}
      b.textContent = "Toque e segure o texto para copiar";
    };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(t).then(pronto, reserva);
    else reserva();
  }
  document.addEventListener("click", (e) => { const b = e.target.closest && e.target.closest("[data-copiar]"); if (b) copiarPrompt(b); });

  function ligarCopiar(p) {
    p.querySelectorAll(".btn-copiar").forEach((b) => (b.onclick = () => {
      navigator.clipboard && navigator.clipboard.writeText(b.dataset.t);
      b.textContent = "Copiado";
    }));
  }


  /* ================= peças do layout ================= */
  function topo(trilha) {
    return `<div class="barra-topo">
      <img class="logo-mini" src="assets/minds.svg" alt="Minds of the Future">
      <nav class="trilha" aria-label="Você está em"><button class="trilha-link" data-inicio>Início</button><span>/</span><span>Etapa ${esc(D.modulo.numero)}</span>${trilha ? `<span>/</span><span>${esc(trilha)}</span>` : ""}</nav>
    </div>`;
  }
  function heroi(o) {
    /* versão leve: nas perguntas, faixa compacta (só o passo e a barra, sem ilustração) */
    if (o.compacta) return `<section class="heroi heroi-compacta">
      <div class="heroi-txt"><div class="kicker passo">${esc(o.titulo)}</div></div>
      <div class="heroi-prog"><div class="barra" role="progressbar" aria-label="Progresso" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${o.progresso}"><div class="barra-fill" style="width:${o.progresso}%"></div></div></div>
    </section>`;
    return `<section class="heroi ${o.grande ? "heroi-grande" : ""}">
      <div class="heroi-topo">
        <div class="heroi-txt">
          <div class="kicker ${o.kickerClasse || ""}">${esc(o.kicker || "Etapa " + D.modulo.numero)}</div>
          <${o.h1 ? "h1" : "h2"} class="heroi-tit ${o.tituloClasse || ""}">${esc(o.titulo)}</${o.h1 ? "h1" : "h2"}>
          ${o.texto ? `<p>${esc(o.texto)}</p>` : ""}
        </div>
        <img class="heroi-img" src="assets/${o.img || "hero-tela.webp"}" alt="">
      </div>
      ${o.progresso !== undefined ? `<div class="heroi-prog"><div class="barra" role="progressbar" aria-label="Progresso" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${o.progresso}"><div class="barra-fill" style="width:${o.progresso}%"></div></div></div>` : ""}
    </section>`;
  }
  /* texto longo: a 1ª frase fica à vista e o resto vai para "Ver mais" (fechado) */
  function curto(texto) {
    const t = String(texto || "").trim();
    if (t.length <= LIMITE_TEXTO) return esc(t);
    const m = /^(.+?[.!?:])\s+(?=[A-ZÀ-Ú“"(])/.exec(t);
    if (!m || m[1].length >= t.length - 20) return esc(t);
    return `${esc(m[1])} <details class="mais"><summary>Ver mais</summary>${esc(t.slice(m[0].length))}</details>`;
  }
  /* "Ver dica" fechada entre a pergunta e as respostas: o texto de apoio + os termos da Base técnica */
  function dica(texto, termos, extra) {
    termos = termos || [];
    if (vazio(texto) && vazio(extra) && !termos.length) return "";
    return `<details class="dica-toggle"><summary>Ver dica</summary>
      ${vazio(texto) ? "" : `<p class="ajuda">${esc(texto)}</p>`}
      ${vazio(extra) ? "" : `<p class="dica-extra" id="dica-extra">${esc(extra)}</p>`}
      ${termos.map((b) => `<div class="conceito"><b>${esc(b.conceito)}</b><p>${esc(b.definicao)}</p></div>`).join("")}
    </details>`;
  }
  /* linha curta e sempre à vista com o termo difícil em palavras simples + exemplo (item D);
     faturamento e CNAE ganham exemplo do tipo de negócio que a pessoa escolheu */
  function explica(q) {
    const tipo = Motor.valor(S.R, "M8.P02");
    if (q.codigo === "M8.P04") return `${q.explica} ${EX_FAT[tipo] || EX_FAT.Produto}`;
    if (q.codigo === "M8.P06") return `${q.explica} ${EX_CNAE[tipo] || EX_CNAE.Produto}`;
    return q.explica || "";
  }
  /* item G (16/11): o alerta da coluna I abria para QUALQUER resposta e parecia erro: agora fica na dica (antes de responder).
     Só vira aviso (tom amarelo, não trava) quando a resposta da pessoa aponta um risco real:
     P07 = Não (a atividade não está na lista do MEI) · P08 = Sim (a atividade exige habilitação). */
  const ALERTA_SE = { "M8.P07": "Não", "M8.P08": "Sim" };
  function alertaDaResposta(cod) {
    const q = M.porCodigo[cod];
    if (!q || vazio(q.alerta) || !ALERTA_SE[cod] || Motor.valor(S.R, cod) !== ALERTA_SE[cod]) return "";
    return `<div class="bloco b-alerta" id="alerta-resposta"><b>Fique atento</b> ${esc(q.alerta)}</div>`;
  }
  /* "Voltar" no topo, à esquerda, no mesmo lugar em todas as telas (padrão do Módulo 1) */
  const botaoVoltar = () => `<button class="voltar voltar-topo" id="v">Voltar</button>`;
  function ligar(p) {
    p.querySelectorAll("[data-inicio]").forEach((b) => { b.onclick = () => ir(telaCapa); });
  }

  /* item G (17/11): tempo honesto na capa. Caminho mais comum = 10 perguntas (P01–P05, P06 e P07 de quem ainda não
     tem CNPJ, P09 de quem não é só online, P10; P08 só para serviço). 35 s por pergunta, arredondado para múltiplo de 5 min. */
  const SEG_POR_PERGUNTA = 35, CAMINHO_COMUM = 10;
  const minutosCapa = () => Math.max(5, Math.round((CAMINHO_COMUM * SEG_POR_PERGUNTA) / 60 / 5) * 5);
  /* ================= capa ================= */
  function telaCapa() {
    const iniciado = S.hist.length > 0;
    const p = el(`
      <div class="pag">
        ${topo("")}
        ${heroi({ grande: true, h1: true, kicker: "Etapa " + D.modulo.numero, titulo: D.modulo.nome, texto: D.capa.frase, img: "hero-inicio.webp" })}
        <main class="corpo">
          <p class="tempo">Esta etapa leva cerca de ${esc(minutosCapa())} minutos</p>
          <div class="acoes">
            <button class="btn btn-primario seta" id="ir">${iniciado ? "Continuar de onde parei" : "Começar"}</button>
            ${iniciado ? `<button class="btn btn-claro" id="zerar">Recomeçar do zero</button>` : ""}
          </div>
          <details class="como-funciona cartao"><summary>Como funciona</summary>
            <h3>Para quem é</h3><p>${esc(D.mapa.usuario)}</p>
            <h3>O que ter em mãos</h3><p>${esc(D.mapa.ter_em_maos)}</p>
            <h3>O que você recebe no final</h3><p>${esc(D.mapa.entrega)}</p>
            <div class="acoes">
              <button class="btn btn-linha" id="base">Consultar as ocupações permitidas ao MEI</button>
              <button class="btn btn-linha" id="limites">O que esta etapa não faz</button>
            </div>
          </details>
          ${rodape(true)}
        </main>
      </div>`);
    ligar(p);
    p.querySelector("#ir").onclick = () => {
      const atual = S.hist[S.hist.length - 1];
      if (atual === "RESULTADO") ir(telaResultado);
      else abrir(atual);   // pula as perguntas que já vieram de outros módulos
    };
    const z = p.querySelector("#zerar");
    if (z) z.onclick = () => { if (confirm("Apagar suas respostas e recomeçar?")) { S = novo(); salvar(); ir(telaCapa); } };
    p.querySelector("#limites").onclick = () => ir(telaLimites);
    p.querySelector("#base").onclick = () => ir(telaBase, () => ir(telaCapa));
    return p;
  }

  function telaLimites() {
    const p = el(`
      <div class="pag">
        ${topo("Limites")}
        ${heroi({ titulo: "Limites da etapa" })}
        <main class="corpo">
          ${botaoVoltar()}
          <div class="cartao"><h3>O que a etapa não faz</h3><p>${esc(D.mapa.nao_faz)}</p></div>
          <div class="cartao"><h3>Que decisões ele apoia</h3><p>${esc(D.mapa.decisoes)}</p></div>
          <div class="cartao"><h3>Quando procurar um profissional</h3><p>${esc(D.mapa.encaminhamentos)}</p></div>
          <div class="aviso">${esc(D.mapa.mensagem_limite)}</div>
          ${rodape()}
        </main>
      </div>`);
    ligar(p);
    p.querySelector("#v").onclick = () => ir(telaCapa);
    return p;
  }

  /* ================= Anexo XI (ocupações permitidas ao MEI) ================= */
  /* alvo = "M8.P06" quando a lista foi aberta pela pergunta do CNAE: "Escolher este" responde a pergunta e volta para ela */
  function telaBase(voltar, termo, alvo) {
    const AX = D.anexo;
    const p = el(`
      <div class="pag">
        ${topo("Ocupações permitidas ao MEI")}
        ${heroi({ titulo: "Ocupações permitidas ao MEI" })}
        <main class="corpo">
          ${botaoVoltar()}
          ${alvo ? `<p class="explica">Ache a sua ocupação e toque em “Escolher este”: ela vira a sua resposta.</p>` : ""}
          <p class="ajuda">${esc(AX.titulo)}</p>
          <input class="campo" id="busca" placeholder="Busque pela ocupação, pelo CNAE ou pela descrição" value="${esc(termo || "")}">
          <p class="mini-info" id="conta"></p>
          <div id="lista"></div>
          ${rodape()}
        </main>
      </div>`);
    const lista = p.querySelector("#lista");
    const desenhar = (t) => {
      const linhas = Motor.buscarAnexo(M, t);
      p.querySelector("#conta").textContent = `${linhas.length} de ${AX.linhas.length} ocupações`;
      lista.innerHTML = linhas.slice(0, 80).map((l) => linhaAnexo(l, true)).join("") || `<p class="ajuda">Nenhuma ocupação encontrada.</p>`;
    };
    ligarCnae(p, alvo);
    p.querySelector("#busca").oninput = (e) => desenhar(e.target.value);
    desenhar(termo || "");
    ligar(p);
    p.querySelector("#v").onclick = () => voltar ? voltar() : ir(telaCapa);
    return p;
  }
  /* com acoes = true, a ocupação ganha "Copiar" (código e nome) e "Escolher este" (salva como CNAE escolhido) */
  function linhaAnexo(l, acoes) {
    const esc1 = S.cnae && S.cnae.cnae === l.cnae && S.cnae.ocupacao === l.ocupacao;
    return `<div class="cnae${esc1 ? " cnae-escolhido" : ""}">
      <div class="cnae-topo"><b>${esc(l.cnae)}</b><span class="nivel n1">${esc(l.tabela)}</span></div>
      <p><b>${esc(l.ocupacao)}</b></p>
      <p class="ex">${esc(l.descricao)}</p>
      <p class="mini-info">ISS: ${esc(l.iss)} · ICMS: ${esc(l.icms)}</p>
      ${acoes ? `<div class="cnae-acoes"><button class="btn-mini btn-copiar-cnae" data-t="${esc(l.cnae + " - " + l.ocupacao)}">Copiar</button>
        <button class="btn-mini btn-escolher" data-cnae="${esc(l.cnae)}" data-ocup="${esc(l.ocupacao)}" aria-pressed="${esc1}">${esc1 ? "Escolhido" : "Escolher este"}</button></div>` : ""}
    </div>`;
  }
  function copiarTexto(t) {
    try { if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(t).catch(() => copiarAntigo(t)); } catch (e) {}
    copiarAntigo(t);
  }
  function copiarAntigo(t) {
    const a = document.createElement("textarea"); a.value = t; a.setAttribute("readonly", ""); a.style.position = "absolute"; a.style.left = "-9999px";
    document.body.appendChild(a); a.select(); try { document.execCommand("copy"); } catch (e) {} a.remove();
  }
  /* "Copiar" e "Escolher este" nas listas de ocupações (sugestões do resumo e consulta) */
  function ligarCnae(p, alvo) {
    p.addEventListener("click", (e) => {
      const c = e.target.closest(".btn-copiar-cnae");
      if (c) { copiarTexto(c.dataset.t); c.textContent = "Copiado"; return; }
      const b = e.target.closest(".btn-escolher");
      if (!b) return;
      S.cnae = { cnae: b.dataset.cnae, ocupacao: b.dataset.ocup };
      salvar();
      p.querySelectorAll(".btn-escolher").forEach((x) => {
        const sel = x.dataset.cnae === S.cnae.cnae && x.dataset.ocup === S.cnae.ocupacao;
        x.textContent = sel ? "Escolhido" : "Escolher este"; x.setAttribute("aria-pressed", String(sel));
        x.closest(".cnae").classList.toggle("cnae-escolhido", sel);
      });
      const box = p.querySelector("#cnae-escolhido");
      if (box) box.outerHTML = blocoEscolhido();
      /* bug 16/11 ("escolho o CNAE e não acontece nada"): antes só guardava S.cnae; agora a escolha vira a resposta da P06 */
      if (alvo === "M8.P06") {
        S.R["M8.P06"] = { estado: "valor", valor: `${S.cnae.cnae} - ${S.cnae.ocupacao}` };
        salvar();
        ir(telaPergunta, "M8.P06", { escolheu: true });
      }
    });
  }
  function blocoEscolhido() {
    if (!S.cnae) return `<div id="cnae-escolhido" hidden></div>`;
    return `<section class="cartao cnae-esc" id="cnae-escolhido"><h3>CNAE escolhido</h3><p><b>${esc(S.cnae.cnae)}</b> · ${esc(S.cnae.ocupacao)}</p>
      <p class="mini-info">Leve este código quando for à Sala do Empreendedor ou ao contador, para conferir se ele descreve o que você faz.</p></section>`;
  }

  /* "Quem pode ser MEI": critérios básicos antes de procurar contador ou Sebrae */
  function blocoQuemMei(aberto) {
    const corpo = `<ul class="criterios">
        <li>Faturar até ${reais(LIMITE_MEI_ANO)} por ano em 2026 (cerca de ${reais(LIMITE_MEI_ANO / 12)} por mês). Em 2027 o limite sobe para ${reais(LIMITE_MEI_2027)} por ano.<span class="como-calc">Como calculamos: ${reais(LIMITE_MEI_ANO)} ÷ 12 meses = ${reais(LIMITE_MEI_ANO / 12)} por mês.</span></li>
        <li>Ter uma atividade que esteja na lista de ocupações permitidas ao MEI.</li>
        <li>Não ser sócio nem titular de outra empresa.</li>
        <li>Em 2026, ter no máximo 1 empregado. A partir de 1º de janeiro de 2027, até 2, cada um recebendo 1 salário mínimo ou o piso da categoria.</li>
      </ul>
      <p>Confira na Sala do Empreendedor ou no ${link(FONTE.portal, "Portal do Empreendedor (gov.br)")}.</p>
      <span class="fonte">Fonte: ${link(FONTE.criterios, "gov.br, “Cadastrar/formalizar Microempreendedor Individual”")}, ${link(FONTE.lei238, "Lei Complementar 238/2026")} e ${link(FONTE.tetoMei, "MEMP: Teto do MEI")}.</span>`;
    return aberto
      ? `<section class="cartao quem-mei" id="quem-mei"><h3>Quem pode ser MEI</h3>${corpo}</section>`
      : `<details class="saiba quem-mei" id="quem-mei"><summary>Quem pode ser MEI</summary>${corpo}</details>`;
  }

  /* onde tirar as dúvidas sobre formalização (depois da pergunta da dúvida principal) */
  function blocoFontes() {
    return `<section class="bloco b-enc fontes" id="fontes-duvida"><b>Onde tirar suas dúvidas</b>
      <ul class="criterios">
        <li>${link(FONTE.salaJF, "Sala do Empreendedor de Juiz de Fora")}, da prefeitura (em outra cidade, procure a Sala do Empreendedor ou a prefeitura da sua cidade).</li>
        <li>${link(FONTE.portal, "Portal do Empreendedor (gov.br)")}: quem pode ser MEI, atividades permitidas e abertura do MEI.</li>
        <li>${link(FONTE.sebrae, "Sebrae")}: ${SEBRAE_TEL}, ligação gratuita.</li>
        <li>Um contador, para dúvidas sobre impostos, CNAE e tipo de empresa.</li>
      </ul></section>`;
  }

  /* ================= reuso: pergunta já respondida em outro módulo não aparece de novo (item F) ================= */
  /* põe no formato deste módulo as respostas que outros módulos já têm (só onde ainda não há resposta aqui) */
  function herdarTudo() {
    let mudou = false;
    for (const cod of REUSO) {
      if (S.R[cod]) continue;
      const H = herdado(cod);
      if (!H) continue;
      S.R[cod] = Object.assign({}, H.r, { de: H.de, reuso: true }, H.nota ? { nota: H.nota } : {});
      mudou = true;
    }
    /* P07 pela escolha do CNAE (só quando a P07 aparece no caminho) */
    const listado = Motor.cnaes(M, S.R).some((c) => c.linhas.length);
    const r7 = S.R["M8.P07"];
    if (r7 && r7.de === DE_CNAE && !listado) { delete S.R["M8.P07"]; mudou = true; }
    else if (!r7 && listado && Motor.avaliar(M, S.R, M.porCodigo["M8.P07"].condicao) === true) {
      S.R["M8.P07"] = { estado: "opcao", opcao: "Sim", de: DE_CNAE, reuso: true }; mudou = true;
    }
    if (mudou) salvar();
  }
  const reusada = (cod) => !!(S.R[cod] && S.R[cod].reuso);
  /* pula as telas cujas respostas vieram de outro módulo; guarda em "pulei" quais foram puladas */
  function pularReusadas(cod, pulei) {
    while (cod && cod !== "RESULTADO" && reusada(cod)) { if (pulei) pulei.push(cod); cod = Motor.proxima(M, S.R, cod); }
    return cod;
  }
  /* abre a próxima tela de verdade (pergunta ou resumo) a partir de cod */
  function abrir(cod) {
    herdarTudo();
    const pulei = [];
    cod = pularReusadas(cod || Motor.proxima(M, S.R, null), pulei);
    if (cod === "RESULTADO") { if (S.hist[S.hist.length - 1] !== "RESULTADO") S.hist.push("RESULTADO"); salvar(); return ir(telaResultado); }
    ir(telaPergunta, cod, { pulei });
  }
  /* primeira pergunta do caminho ainda sem resposta (ou o resumo) */
  function primeiraSemResposta() {
    let cod = Motor.proxima(M, S.R, null);
    while (cod !== "RESULTADO" && S.R[cod]) cod = Motor.proxima(M, S.R, cod);
    return cod;
  }
  /* "Trocar": abre a tela pulada; do resumo, depois de responder, volta ao resumo (ou à 1ª pergunta que ficou sem resposta) */
  function trocar(cod) {
    const atual = S.hist[S.hist.length - 1], doResumo = atual === "RESULTADO";
    if (atual && atual !== cod) S.hist.pop();
    salvar();
    ir(telaPergunta, cod, { doResumo });
  }
  function valorReuso(cod) {
    if (cod === "M8.P04") { const n = numero(Motor.valor(S.R, cod)); return n != null ? reais(n) : Motor.valor(S.R, cod); }
    return Motor.valor(S.R, cod);
  }
  /* cartão pequeno "Veio do Módulo N · Trocar" com as respostas reaproveitadas */
  function cartaoReuso(cods, id, titulo) {
    cods = cods.filter(reusada);
    if (!cods.length) return "";
    return `<section class="veio-card" id="${id}"><b class="veio-tit">${esc(titulo)}</b>
      ${cods.map((c) => {
        const r = S.R[c], fat = c === "M8.P04" ? faturamentoAno() : null;
        return `<div class="veio-linha" data-cod="${c}">
          <p><span class="veio-rot">${esc(ROTULO_REUSO[c])}:</span> <b>${esc(valorReuso(c))}</b>${c === "M8.P04" ? " por mês" : ""}</p>
          <div class="veio-acoes">${selo(r.de)}<button class="alterar" type="button" data-trocar="${c}">Trocar</button></div>
          ${r.nota ? `<p class="como-calc">Como calculamos: ${esc(r.nota)}.</p>` : ""}
          ${fat ? `<p class="como-calc">${esc(calcAno(fat.mes))}</p>` : ""}
        </div>`;
      }).join("")}
    </section>`;
  }
  function ligarTrocar(p) { p.querySelectorAll("[data-trocar]").forEach((b) => { b.onclick = () => trocar(b.dataset.trocar); }); }

  /* P06: explica o CNAE escrito ou escolhido (está ou não na lista de ocupações do MEI) */
  function feedbackCnae(v, escolheu) {
    const cs = Motor.cnaes(M, { "M8.P06": { estado: "valor", valor: v } });
    return cs.map((c) => c.linhas.length
      ? `<div class="bloco b-proximo cnae-ok"><b>${escolheu ? "Você escolheu" : "Código"} ${esc(c.cnae)}</b> ${esc(c.linhas[0].ocupacao)}: está na lista de ocupações permitidas ao MEI. Toque em Continuar.</div>`
      : `<div class="bloco b-alerta cnae-nao"><b>Código ${esc(c.cnae)}</b> Não achamos este código na lista de ocupações permitidas ao MEI. Confira o número ou toque em “Consultar as ocupações permitidas ao MEI”.</div>`).join("");
  }
  /* "Minhas anotações da pesquisa": S.notas[cod] = { texto, onde, data } (só acrescenta ao estado salvo) */
  const nota = (cod) => (S.notas && S.notas[cod]) || {};
  function blocoNotas(cod) {
    const n = nota(cod), tem = !!(n.texto || n.onde || n.data);
    return `<details class="notas" id="notas"${tem ? " open" : ""}><summary>Minhas anotações da pesquisa</summary>
      <label class="nota-rot" for="nota-texto">O que descobri</label>
      <textarea class="campo" id="nota-texto" rows="3" placeholder="Ex.: Na Sala do Empreendedor me disseram que a minha atividade pode ser MEI.">${esc(n.texto || "")}</textarea>
      <label class="nota-rot" for="nota-onde">Onde pesquisei (se quiser)</label>
      <input class="campo" id="nota-onde" placeholder="Ex.: Portal do Empreendedor (gov.br), Sebrae, prefeitura, contador" value="${esc(n.onde || "")}">
      <label class="nota-rot" for="nota-data">Data (se quiser)</label>
      <input class="campo" id="nota-data" type="date" value="${esc(n.data || "")}">
      <p class="mini-info">Suas anotações ficam guardadas e aparecem no seu resumo.</p>
    </details>`;
  }
  function ligarNotas(p, cod) {
    const t = p.querySelector("#nota-texto");
    if (!t) return;
    const o = p.querySelector("#nota-onde"), d = p.querySelector("#nota-data");
    const gravar = () => {
      S.notas = S.notas || {};
      const n = { texto: t.value.trim(), onde: o.value.trim(), data: d.value };
      if (n.texto || n.onde || n.data) S.notas[cod] = n; else delete S.notas[cod];
      salvar();
    };
    [t, o, d].forEach((x) => { x.addEventListener("input", gravar); x.addEventListener("change", gravar); });
  }
  const dataBr = (iso) => /^\d{4}-\d{2}-\d{2}$/.test(iso || "") ? iso.split("-").reverse().join("/") : iso;
  /* resumo: "O que você pesquisou", na ordem das perguntas */
  function blocoPesquisou() {
    const cods = M.perguntas.map((q) => q.codigo).filter((c) => { const n = nota(c); return n.texto || n.onde || n.data; });
    if (!cods.length) return "";
    return `<section class="cartao pesquisou" id="pesquisou"><h3>O que você pesquisou</h3>
      ${cods.map((c) => { const n = nota(c); return `<div class="nota-item" data-cod="${c}">
        <p class="nota-q">${esc(M.porCodigo[c].pergunta)}</p>
        ${n.texto ? `<p>${esc(n.texto)}</p>` : ""}
        ${n.onde || n.data ? `<p class="mini-info">${n.onde ? `Onde: ${esc(n.onde)}` : ""}${n.onde && n.data ? " · " : ""}${n.data ? `Data: ${esc(dataBr(n.data))}` : ""}</p>` : ""}
      </div>`; }).join("")}
    </section>`;
  }

  /* ================= pergunta ================= */
  /* item G (17/11): total estável (as 10 perguntas, o caminho mais longo) e barra pela posição da pergunta:
     "Pergunta N de 10" e a barra andam juntas e nunca voltam ao seguir em frente */
  function progresso(q) {
    return Math.min(100, Math.round(((M.perguntas.indexOf(q) + 1) / M.perguntas.length) * 100));
  }

  const LIGA_ANEXO = ["M8.P06", "M8.P07"];   // perguntas que citam CNAE / lista de ocupações MEI
  function telaPergunta(cod, opts) {
    opts = opts || {};
    const q = M.porCodigo[cod];
    if (S.hist[S.hist.length - 1] !== cod) { S.hist.push(cod); salvar(); }
    const tipo = Motor.campo(q);
    const H = S.R[cod] ? null : herdado(cod);       // pré-preenchimento só quando ainda não respondeu aqui
    const resp = S.R[cod] || (H && H.r) || null;
    let escolhida = resp && resp.estado === "opcao" ? resp.opcao : null;
    const deOnde = H ? H.de : S.R[cod] && S.R[cod].de;
    const nota = H && H.nota ? H.nota : S.R[cod] && S.R[cod].nota;

    const p = el(`
      <div class="pag">
        ${heroi({ compacta: true, titulo: `Pergunta ${M.perguntas.indexOf(q) + 1} de ${M.perguntas.length}`, progresso: progresso(q) })}
        <main class="corpo corpo-pergunta">
          <div class="cartao-q pergunta">
            ${botaoVoltar()}
            ${cartaoReuso(opts.pulei || [], "veio", "Já respondido antes")}
            <h2 class="q" id="enunciado" tabindex="-1" data-foco>${esc(q.pergunta)}</h2>
            ${explica(q) ? `<p class="explica" id="explica">${esc(explica(q))}</p>` : ""}
            ${deOnde ? `<div class="herdou" id="herdou">${selo(deOnde)}<span>${H ? "Confira e ajuste se quiser." : "Se quiser, troque a resposta abaixo."}</span>${nota ? `<p class="conta">Como calculamos: ${esc(nota)}.</p>` : ""}</div>` : ""}
            ${dica(q.ajuda, conceitosDe(q), q.alerta)}
            <div class="entrada" id="ent"></div>
            ${cod === "M8.P06" ? `<div id="cnae-feedback" role="status"></div>` : ""}
            <div id="retorno" aria-live="polite"></div>
            ${Motor.temNaoSei(q) ? `<div class="alt"><button class="btn-alt" id="ns">Não sei</button></div>` : ""}
            <section class="como-descobrir" id="ns-ajuda" role="status" hidden></section>
            <div class="acoes acoes-fixas" id="acoes">
              <div class="erro" id="erro" role="alert" hidden></div>
              <button class="btn btn-primario seta" id="ok">Continuar</button>
            </div>
            ${LIGA_ANEXO.includes(cod) ? `<div class="alt"><button class="btn-alt" id="anexo">Consultar as ocupações permitidas ao MEI</button></div>` : ""}
            ${cod === "M8.P07" ? blocoQuemMei(false) : ""}
            ${NOTAS_EM.includes(cod) ? blocoNotas(cod) : ""}
            ${blocoEducativo(educativoDe(cod))}
          </div>
          ${rodape(false)}
        </main>
      </div>`);
    ligarCopiar(p);
    ligar(p);
    ligarTrocar(p);

    p.querySelector("#v").onclick = () => {
      S.hist.pop();
      const ant = S.hist.pop();
      salvar();
      if (ant) ir(telaPergunta, ant); else ir(telaCapa);
    };

    const ent = p.querySelector("#ent");
    if (tipo === "escolha") {
      ent.classList.add("opcoes");
      q.opcoesLista.forEach((op) => {
        const ex = q.exOpcoes && q.exOpcoes[op];   // exemplo pequeno embaixo da opção difícil (o texto da opção não muda)
        /* item D (17/11): o leitor de tela diz se a opção está marcada (aria-pressed, modelo da Etapa 1) */
        const b = el(`<button class="opcao ${escolhida === op ? "sel" : ""}" aria-label="${esc(op)}" aria-pressed="${escolhida === op}"><span class="radio" aria-hidden="true"></span><span class="op-txt"><b>${esc(op)}</b>${ex ? `<span class="op-ex">${esc(ex)}</span>` : ""}</span></button>`);
        b.onclick = () => {
          ent.querySelectorAll(".opcao").forEach((x) => { x.classList.remove("sel"); x.setAttribute("aria-pressed", "false"); });
          if (op === NS) { escolhida = null; previa(); return pedirResposta(); }   // "Não sei": mostra como descobrir, não marca, não grava
          escondeNs();
          p.querySelector("#erro").hidden = true;
          escolhida = op; b.classList.add("sel"); b.setAttribute("aria-pressed", "true");
          previa();   // item A: o retorno aparece no toque, logo abaixo das opções
          const rb = p.querySelector("#retorno");
          if (rb.innerHTML.trim() && rb.scrollIntoView) rb.scrollIntoView({ block: "nearest" });   // sobe só o necessário para o retorno aparecer acima do Continuar
        };
        ent.appendChild(b);
      });
    } else {
      const v = resp && resp.estado === "valor" ? resp.valor : "";
      ent.appendChild(el(tipo === "numero"
        ? `<div class="linha"><input class="campo" inputmode="decimal" placeholder="${esc(q.exemplo || "Ex.: 2.500,00")}" value="${esc(v)}"><span class="pre">R$</span></div>`
        : `<textarea class="campo" rows="3" placeholder="${esc(q.exemplo || "")}">${esc(v)}</textarea>`));
      /* item A: campo de texto/número mostra o retorno ao sair do campo ou depois de ~700 ms sem digitar */
      const f = ent.querySelector("input,textarea");
      let espera = 0;
      f.addEventListener("input", () => { clearTimeout(espera); espera = setTimeout(previa, ESPERA_RETORNO); });
      /* ao sair do campo; se saiu tocando no Continuar, a tela já vai trocar (redesenhar agora tiraria o botão de baixo do dedo) */
      f.addEventListener("blur", (e) => {
        clearTimeout(espera);
        if (e.relatedTarget && e.relatedTarget.id === "ok") { espera = setTimeout(previa, 400); return; }   // se a tela não trocar (erro/aviso), o retorno aparece logo depois
        previa();
      });
    }
    const ax = p.querySelector("#anexo");
    if (ax) ax.onclick = () => {
      const t = ent.querySelector("input,textarea");
      ir(telaBase, () => ir(telaPergunta, cod), t && cod === "M8.P06" ? t.value : "", cod === "M8.P06" ? cod : null);
    };
    /* P06: o que o código quer dizer, logo abaixo do campo (ao abrir e enquanto digita) */
    const fb = p.querySelector("#cnae-feedback");
    if (fb) {
      const campoC = ent.querySelector("textarea");
      const atualizar = () => { fb.innerHTML = feedbackCnae(campoC.value, opts.escolheu); };
      campoC.addEventListener("input", atualizar);
      atualizar();
      if (opts.escolheu) setTimeout(() => fb.scrollIntoView({ block: "center" }), 0);
    }
    ligarNotas(p, cod);
    const ns = p.querySelector("#ns");
    if (ns) ns.onclick = () => pedirResposta();   // nunca grava "Não sei"
    /* "Não sei" numa pergunta necessária: explica como descobrir e pede a resposta (nada é gravado) */
    function pedirResposta() {
      p.querySelector("#erro").hidden = true;
      const box = mostrarComo(`<p class="ns-pede"><b>Precisamos desta resposta para seguir.</b> ${tipo === "escolha" ? "Use a ajuda acima, escolha a opção que mais se aproxima e toque em Continuar." : "Use a ajuda acima, escreva a sua resposta no campo e toque em Continuar."}${cod === "M8.P06" ? " Se não achar o código, escreva o que você faz (ex.: fabricação de bolos)." : ""}</p>`);
      const f = ent.querySelector("input,textarea");
      if (f) f.focus({ preventScroll: true });
      box.scrollIntoView({ block: "nearest" });
    }
    /* caixa "Como descobrir" desta pergunta (passos + pedido para a IA); extra = aviso de que a resposta é obrigatória */
    function mostrarComo(extra) {
      const notas = p.querySelector("#notas"); if (notas) notas.open = true;   // anotar o que pesquisou fica logo à mão
      const box = p.querySelector("#ns-ajuda");
      box.innerHTML = caixaComo(q) + (extra || "");
      box.hidden = !box.innerHTML.trim();
      return box;
    }
    function escondeNs() { const box = p.querySelector("#ns-ajuda"); if (box) box.hidden = true; }

    /* resposta que está na tela agora (sem gravar), no formato salvo; null se ainda não há resposta válida */
    function candidata() {
      if (tipo === "escolha") return escolhida ? { estado: "opcao", opcao: escolhida } : null;
      const v = ent.querySelector("input,textarea").value.trim();
      if (!v) return null;
      if (tipo !== "numero") return { estado: "valor", valor: v };
      const n = numero(v);
      if (/^-/.test(v.replace(/^R\$\s*/i, "")) || n == null || n < 0 || !/^(R\$\s*)?\d[\d.\s]*(,\d+)?$|^(R\$\s*)?\d+(\.\d+)?$/i.test(v)) return null;
      return { estado: "valor", valor: brNum(n) };
    }
    /* item A (17/11): o retorno (conta do ano, alerta do MEI, folga, aviso do tipo, ocupação do CNAE, fontes) aparece
       ao vivo, logo abaixo da resposta, antes do Continuar. Calcula com a resposta da tela sem gravar nada. */
    function previa() {
      const box = p.querySelector("#retorno"), r0 = candidata();
      if (!r0) { box.innerHTML = ""; return; }
      const antes = S.R[cod];
      S.R[cod] = r0;
      try { box.innerHTML = htmlRetorno(); }
      finally { if (antes === undefined) delete S.R[cod]; else S.R[cod] = antes; }
    }
    function htmlRetorno() {
      const regras = Motor.regrasAgora(M, S.R, cod);
      const cnaes = cod === "M8.P06" ? Motor.cnaes(M, S.R) : [];
      const corpo = [
        vazio(q.resposta) ? "" : `<p class="r-texto r-pergunta">${esc(q.resposta)}</p>`,
        cod === "M8.P02" ? avisoTipo(Motor.valor(S.R, cod), true) : "",
        cod === "M8.P04" || cod === "M8.P05" ? alertaMei() : "",
        cod === "M8.P04" ? blocoAno() : "",
        cod === "M8.P05" ? blocoFolga() : "",
        cnaes.map(blocoCnae).join(""),
        regras.map((r) => `
          <div class="regra">
            <p class="r-texto">${esc(r.texto)}</p>
            ${vazio(r.alerta) ? "" : `<div class="bloco b-alerta"><b>Atenção</b>${esc(r.alerta)}</div>`}
            ${vazio(r.proximo) ? "" : `<div class="bloco b-proximo"><b>Próximo passo</b>${esc(r.proximo)}</div>`}
            ${vazio(r.encaminhamento) ? "" : `<div class="bloco b-enc"><b>Quem procurar</b>${esc(r.encaminhamento)}</div>`}
          </div>`).join(""),
        alertaDaResposta(cod),
        cod === "M8.P10" ? blocoFontes() : "",
      ].join("");
      return corpo.trim() ? `<div class="retorno">${corpo}</div>` : "";
    }
    previa();   // resposta já guardada (ou que veio de outra etapa): o retorno já aparece ao abrir

    /* item A (17/11): um toque por pergunta. Continuar grava e já abre a próxima pergunta (sem "Seguir" nem "Corrigir").
       Ficam em 2 passos só: o aviso de valor alto (toque de novo para confirmar) e o "Não sei" (bloqueia, não grava). */
    p.querySelector("#ok").onclick = () => {
      if (tipo === "escolha") {
        if (!escolhida) return erro(q.opcoesLista.includes(NS) ? MSG_ESCOLHA : "Escolha uma opção para continuar.");
        return responder({ estado: "opcao", opcao: escolhida });
      }
      const v = ent.querySelector("input,textarea").value.trim();
      if (!v) return erro(Motor.temNaoSei(q) ? MSG_ESCREVA : "Escreva a sua resposta para continuar.");
      if (tipo === "numero") {
        if (/^-/.test(v.replace(/^R\$\s*/i, ""))) return erro("O valor não pode ser negativo. Digite quanto espera faturar por mês.");
        if (!/^(R\$\s*)?\d[\d.\s]*(,\d+)?$|^(R\$\s*)?\d+(\.\d+)?$/i.test(v) || numero(v) == null) return erro("Digite só números. Ex.: 2500 ou 2.500,00");
        const n = numero(v);
        /* valor muito alto: avisa uma vez; o segundo Continuar com o mesmo valor segue */
        if (n > FAT_MES_ALTO && avisado !== v) {
          avisado = v;
          return erro(`Esse valor parece alto para um pequeno negócio: ${reais(n)} por mês dá cerca de ${reais(round2(n) * 12)} por ano (${reais(n)} × 12 meses). Confira se digitou certo. Se estiver certo, toque em Continuar de novo.`, true);
        }
        return responder({ estado: "valor", valor: brNum(n) });   // guardado no padrão brasileiro (2.500,50)
      }
      responder({ estado: "valor", valor: v });
    };
    let avisado = null;
    /* item B: Continuar sempre ativo; sem resposta, a mensagem aparece logo acima dele (role="alert"), na barra presa ao pé da tela */
    function erro(t, aviso) {
      const e = p.querySelector("#erro"); e.textContent = t; e.hidden = false; e.classList.toggle("erro-aviso", !!aviso);
    }

    function responder(r0) {
      /* guarda de onde veio quando a pessoa manteve o valor herdado (aparece com o selo no resumo) */
      const h = H || (S.R[cod] && S.R[cod].de ? S.R[cod] : null);
      if (h && mesmo(r0, h.r || h)) { r0.de = h.de; if (h.nota) r0.nota = h.nota; if (h.reuso) r0.reuso = true; }
      S.R[cod] = r0;
      /* respostas de perguntas que deixaram de aparecer são descartadas */
      limparInvisiveis();
      salvar();
      if (opts.doResumo) { herdarTudo(); return abrir(primeiraSemResposta()); }   // veio do resumo: volta a ele (ou à 1ª sem resposta)
      abrir(Motor.proxima(M, S.R, cod));
    }
    return p;
  }

  function limparInvisiveis() {
    let cod = Motor.proxima(M, {}, null);
    const vis = new Set();
    const R = {};
    while (cod !== "RESULTADO") {
      vis.add(cod);
      if (S.R[cod] === undefined) break;
      R[cod] = S.R[cod];
      cod = Motor.proxima(M, R, cod);
    }
    Object.keys(S.R).forEach((k) => { if (!vis.has(k)) delete S.R[k]; });
  }

  /* "possíveis CNAEs compatíveis": busca por palavras da descrição da atividade na lista de ocupações do MEI */
  function blocoSugestoes() {
    const ativ = Motor.valor(S.R, "M8.P01");
    const desc = ativ && ativ !== NS ? ativ : textoDe(lerR("lg2-turma-a-m01")["M1.P03"]);
    const confira = `<p class="mini-info">Esta é só uma busca pelas palavras que você usou. Confira na Sala do Empreendedor ou com um contador qual ocupação descreve de verdade o que você faz.</p>`;
    let corpo;
    if (!desc) corpo = `<p>Você não descreveu a sua atividade, então não foi possível procurar ocupações do MEI que combinem com ela. Use o botão “Consultar as ocupações permitidas ao MEI” logo abaixo para procurar por conta própria.</p>`;
    else {
      const ls = Motor.sugerirAnexo(M, desc);
      corpo = ls.length
        ? `<p>Pela sua descrição (“${esc(desc)}”), estas ocupações permitidas ao MEI podem combinar com a sua atividade. Toque em “Escolher este” para guardar a que mais combina, ou em “Copiar” para levar o código.</p>${ls.map((l) => linhaAnexo(l, true)).join("")}${confira}`
        : `<p>Não encontramos, na lista de ocupações permitidas ao MEI, nenhuma que combine com as palavras da sua descrição (“${esc(desc)}”). Isso não quer dizer que a sua atividade não possa ser MEI: procure com outras palavras no botão “Consultar as ocupações permitidas ao MEI” ou peça ajuda na Sala do Empreendedor.</p>`;
    }
    return `<section class="sugestoes" id="sugestoes"><div class="secao-titulo">Possíveis CNAEs compatíveis</div>${corpo}</section>`;
  }

  function blocoCnae(c) {
    return c.linhas.length
      ? `<p class="mini-info">CNAE ${esc(c.cnae)} na lista de ocupações permitidas ao MEI (Anexo XI):</p>${c.linhas.map((l) => linhaAnexo(l)).join("")}`
      : `<div class="cnae"><div class="cnae-topo"><b>${esc(c.cnae)}</b><span class="nivel n0">não consta no Anexo XI</span></div></div>`;
  }

  /* ================= resultado: resumo das respostas + alertas da planilha ================= */
  function telaResultado() {
    const regras = Motor.regrasTodas(M, S.R);
    const lac = Motor.lacunas(regras), enc = Motor.encaminhamentos(regras), ale = Motor.alertas(regras);
    const resp = Motor.respondidas(M, S.R);
    const ns = resp.filter((q) => Motor.valor(S.R, q.codigo) === Motor.NS);
    const cnaes = Motor.cnaes(M, S.R);
    const p = el(`
      <div class="pag">
        ${topo("Resultado")}
        ${heroi({ kicker: "Resultado", kickerClasse: "passo", titulo: "Resumo da sua formalização" })}
        <main class="corpo">
          ${botaoVoltar()}
          <section class="concluido">
            <div class="conc-topo"><span class="check" aria-hidden="true"></span><div><h2 tabindex="-1" data-foco>Você concluiu a Etapa ${esc(D.modulo.numero)}</h2></div></div>
          </section>
          <section class="entendemos" id="entendemos">
            <h3>O que entendemos até aqui</h3>
            ${entendemos().map((f) => `<p>${esc(f)}</p>`).join("")}
            ${(() => { const f = numero(Motor.valor(S.R, "M8.P04")); return f > 0 ? `<div class="como-calc" id="calc-ano">${esc(calcAno(f))}</div>` : ""; })()}
            ${(() => { const f = faturamentoAno(); return f && f.ano <= LIMITE_MEI_ANO && jaMei() && numero(Motor.valor(S.R, "M8.P04")) > 0 ? `<div class="como-calc" id="calc-folga">${esc(calcFolga(f.ano))}</div>` : ""; })()}
          </section>
          ${cartaoReuso(REUSO.concat("M8.P07"), "veio-res", "Respostas reaproveitadas")}
          ${alertaMei()}
          ${blocoFolga()}
          ${avisoTipo(Motor.valor(S.R, "M8.P02"))}
          <section class="bloco b-proximo" id="tarefa"><b>Seu próximo passo</b><p>${esc(tarefa())}</p></section>
          ${blocoPesquisou()}
          ${ns.length ? `<section class="bloco b-lacuna" id="falta"><b>O que falta descobrir</b><ul>${ns.map((q) => `<li>${esc(q.pergunta)}
            ${q.comoDescobrir && q.comoDescobrir.length ? `<details class="como-mini"><summary>Como descobrir</summary><section class="como-descobrir">${caixaComo(q)}</section></details>` : ""}</li>`).join("")}</ul></section>` : ""}

          <details class="saiba respostas"><summary>Ver suas respostas</summary>
          <div class="res-num">
            <div class="lbl">Perguntas respondidas</div>
            <div class="val">${resp.length}</div>
            <div class="sub">${ns.length ? `${ns.length} com “Não sei”` : "nenhuma com “Não sei”"}</div>
          </div>
          ${resp.map((q, i) => `
            <div class="etapa ${Motor.valor(S.R, q.codigo) === Motor.NS ? "e-conf" : "e-sim"}">
              <div class="etapa-topo"><span class="etq">${i + 1}</span><b>${esc(q.pergunta)}</b></div>
              <p>${esc(mostrar(q.codigo))}${S.R[q.codigo].de ? " " + selo(S.R[q.codigo].de) : ""}</p>
              ${S.R[q.codigo].nota ? `<p class="como-calc">Como calculamos: ${esc(S.R[q.codigo].nota)}.</p>` : ""}
              ${alertaDaResposta(q.codigo) ? `<p class="mini-info"><b>Fique atento:</b> ${esc(q.alerta)}</p>` : ""}
            </div>`).join("")}
          </details>
          <details class="saiba ocupacoes" id="ocupacoes"><summary>Ocupações do MEI para a sua atividade</summary>
            ${blocoSugestoes()}
            ${blocoEscolhido()}
            ${cnaes.map(blocoCnae).join("")}
          </details>
          <details class="saiba detalhes" id="mais-detalhes"><summary>Mais detalhes</summary>
            ${blocoQuemMei(true)}
            ${regras.length ? `<div class="secao-titulo">Orientações</div>${regras.map((r) => `<div class="cartao"><p>${esc(r.texto)}</p>
              ${vazio(r.proximo) ? "" : `<p class="mini-info"><b>Próximo passo:</b> ${esc(r.proximo)}</p>`}</div>`).join("")}` : ""}
            ${ale.length ? `<div class="secao-titulo">Alertas</div>${ale.map((a) => `<div class="bloco b-alerta">${esc(a)}</div>`).join("")}` : ""}
            ${lac.length ? `<div class="bloco b-lacuna"><b>O que ainda falta saber</b><ul>${lac.map((l) => `<li>${esc(l)}</li>`).join("")}</ul></div>` : ""}
            ${enc.length ? `<div class="bloco b-enc"><b>Quem procurar, pelas suas respostas</b>${enc.map(esc).join(" · ")}</div>` : ""}
            ${S.R["M8.P10"] ? blocoFontes() : ""}
            <div class="aviso">${esc(D.mapa.mensagem_limite)}</div>
            <div class="cartao"><h3>O que esta etapa entrega</h3><p>${esc(D.mapa.entrega)}</p></div>
            <div class="cartao"><h3>Quando procurar um profissional</h3><p>${esc(D.mapa.encaminhamentos)}</p></div>
            ${blocoConceitos(D.base)}
          </details>

          <div class="acoes">
            <button class="btn btn-primario" id="imp">Salvar ou imprimir</button>
            <button class="btn btn-claro" id="rev">Revisar respostas</button>
            <button class="btn btn-linha" id="base">Consultar as ocupações permitidas ao MEI</button>
            <button class="btn btn-linha" id="novo">Começar outra análise</button>
          </div>
          <div class="acoes lg2-proximo"><a class="btn btn-primario" style="text-decoration:none;text-align:center;box-sizing:border-box" href="/lg2/turma-b/m09/index.html">Ir para a Etapa 9</a></div>
          ${rodape()}
        </main>
      </div>`);
    /* item I (16/11): no resumo, toda seção recolhível já vem aberta (a pessoa ainda pode fechar) */
    p.querySelectorAll("details").forEach((d) => { d.open = true; });
    ligar(p);
    ligarCnae(p);
    ligarTrocar(p);
    p.querySelector("#v").onclick = () => { S.hist.pop(); const a = S.hist.pop(); salvar(); if (a) ir(telaPergunta, a); else ir(telaCapa); };
    p.querySelector("#imp").onclick = () => { p.querySelectorAll("details.respostas, details.ocupacoes, details.detalhes").forEach((d) => (d.open = true)); window.print(); };
    p.querySelector("#rev").onclick = () => { S.hist = []; salvar(); abrir(null); };
    p.querySelector("#base").onclick = () => ir(telaBase, () => ir(telaResultado));
    p.querySelector("#novo").onclick = () => { if (confirm("Começar uma nova análise? As respostas atuais serão apagadas.")) { S = novo(); salvar(); abrir(null); } };
    return p;
  }

  /* "Seu próximo passo": uma tarefa só, pela dúvida principal (P10) e pelo que ficou em aberto */
  function tarefa() {
    const f = faturamentoAno(), cnpj = sigla(Motor.valor(S.R, "M8.P05"));
    if (f && f.ano > LIMITE_MEI_ANO && (!cnpj || ["MEI", "Não", NS].includes(cnpj)))
      return "Leve este resumo a um contador ou à Sala do Empreendedor de Juiz de Fora: o seu faturamento passa do limite do MEI.";
    const porDuvida = {
      "Como escolher o CNAE": "Abra “Ocupações do MEI para a sua atividade”, logo abaixo, escolha a que mais descreve o que você faz e confirme o código na Sala do Empreendedor.",
      "Se posso ser MEI": "Confira os 4 pontos de “Quem pode ser MEI”, em “Mais detalhes”, e leve este resumo à Sala do Empreendedor de Juiz de Fora.",
      "Quais licenças preciso": "Faça a Etapa 9: ela mostra as licenças mais comuns para a sua atividade e o seu local.",
      "Obrigações do CNPJ": "Converse com um contador ou ligue de graça para o Sebrae (" + SEBRAE_TEL + ") sobre os impostos e as obrigações de cada mês.",
    };
    return porDuvida[Motor.valor(S.R, "M8.P10")] || "Leve este resumo à Sala do Empreendedor de Juiz de Fora (ou da sua cidade) para tirar as dúvidas e ver o primeiro passo.";
  }

  /* valor mostrado no resumo (faturamento em reais) */
  function mostrar(cod) {
    const v = Motor.valor(S.R, cod);
    if (cod === "M8.P04" && v !== NS && numero(v) != null) return reais(numero(v)) + " por mês";
    return v;
  }

  /* "O que entendemos até aqui": frases montadas por regras com as respostas deste módulo
     e o que já existe nos módulos anteriores (estágio do Módulo 1, cliente do Módulo 3) */
  /* texto corrido: as frases de cada assunto viram um parágrafo (1 a 3 parágrafos curtos, sem lista) */
  const emParagrafos = (fr, ...cortes) => [0, ...cortes].map((c, i, a) => fr.slice(c, i + 1 < a.length ? a[i + 1] : fr.length).join(" ")).filter(Boolean);
  function entendemos() {
    const v = (c) => { const x = Motor.valor(S.R, c); return x && x !== NS ? x : null; };
    const minus = (t) => t.charAt(0).toLowerCase() + t.slice(1);
    const semPonto = (t) => String(t).trim().replace(/[.!]+$/, "");
    const m1 = lerR("lg2-turma-a-m01"), m3 = lerR("lg2-turma-a-m03");
    const f = [];
    const ativ = v("M8.P01"), tipo = v("M8.P02");
    const tipoTxt = { "Produto": "um produto (você faz o que vende)", "Mercadoria": "revenda de mercadoria (você compra pronto e revende)",
                      "Serviço": "um serviço", "Produto e serviço": "produto e serviço ao mesmo tempo" }[tipo];
    if (ativ) f.push(`Sua atividade é: ${semPonto(ativ)}${tipoTxt ? ` — principalmente ${tipoTxt}` : ""}.`);
    else if (tipoTxt) f.push(`Sua atividade envolve principalmente ${tipoTxt}.`);
    const est = { "Ainda está só na minha cabeça": "Seu negócio ainda está no papel: você não começou a vender.",
                  "Já fiz um pouco para testar ou dar de amostra": "Você está começando: já fez testes ou deu amostras.",
                  "Já vendi algumas vezes": "Você já vende, ainda de vez em quando.",
                  "Já vendo sempre": "Você já vende com frequência." }[textoDe(m1["M1.P01"])];
    if (est) f.push(est);
    const dor = textoDe(m3["M3.P11"]);
    if (dor) f.push(`Para o seu cliente, você resolve: ${minus(semPonto(dor))}.`);
    const local = { "Minha casa": "Você trabalha na sua casa", "Ponto comercial": "Você trabalha em um ponto comercial",
                    "Atendimento externo": "Você atende fora, no local do cliente", "Online": "Você trabalha pela internet",
                    [DOMICILIO]: "Você atende na casa do cliente" }[v("M8.P03")];
    if (local) f.push(local + (local.includes("internet") ? "."
      : v("M8.P03") === DOMICILIO ? ": não precisa de alvará de um ponto, mas a atividade pode pedir licença da prefeitura." : ", e isso pode pedir licenças da prefeitura."));
    const c1 = f.length;   // 1º parágrafo: a atividade, o estágio, o cliente e o lugar
    const fat = numero(v("M8.P04"));
    if (fat > 0) {
      const ano = round2(fat) * 12, tipoCnpj = sigla(v("M8.P05"));
      /* B4 (17/11): quem já é MEI lê que continua dentro do limite, com a folga (a conta fica logo abaixo, em "Como calculamos") */
      f.push(`Você estima faturar ${reais(fat)} por mês, cerca de ${reais(ano)} por ano — ${ano <= LIMITE_MEI_ANO
        ? tipoCnpj === "MEI"
          ? `dentro do limite do MEI (R$ 81 mil por ano): como você já é MEI, continua dentro do limite, com folga de ${reais(LIMITE_MEI_ANO - ano)} por ano.`
          : tipoCnpj && tipoCnpj !== "Não"
            ? "dentro do limite do MEI (R$ 81 mil por ano). Você já tem CNPJ de outro tipo: se pensar em passar para o MEI, confira com um contador se a sua ocupação é permitida."
            : "dentro do limite do MEI (R$ 81 mil por ano), então o MEI pode ser um caminho se a sua ocupação for permitida."
        : tipoCnpj === "MEI"
          ? "acima do limite do MEI (R$ 81 mil por ano): com esse faturamento, o seu negócio sai do MEI. Procure um contador ou a Sala do Empreendedor."
          : "acima do limite do MEI (R$ 81 mil por ano); converse com um contador sobre outras formas de abrir o CNPJ."}`);
    }
    const cnpj = v("M8.P05");
    if (cnpj === "Não") f.push("Você ainda não tem CNPJ.");
    else if (cnpj && cnpj !== NS) f.push(`Você já tem CNPJ: ${cnpj}.`);
    if (S.cnae) f.push(`Você escolheu o CNAE ${S.cnae.cnae} (${minus(S.cnae.ocupacao.toLowerCase())}).`);
    const c2 = f.length;   // 2º: faturamento e CNPJ; 3º: a dúvida principal
    const duv = v("M8.P10");
    if (duv && f.length < 6) f.push(`Sua principal dúvida agora é: ${minus(duv)}.`);
    if (!f.length) f.push("Você ainda não deu detalhes suficientes sobre o seu negócio. Volte às perguntas quando souber mais.");
    return emParagrafos(f.slice(0, 6), c1, c2);
  }

  function rodape(credito) {
    return `<footer class="rodape">
      ${credito === false ? "" : `<p class="credito">Conteúdo do Laboratório de Gestão II · FACC/UFJF · versão ${esc(D.modulo.versao)} · fontes consultadas em ${esc(D.modulo.data)}</p>`}
      <div class="logos">
        <img src="assets/logo_facc.png" alt="FACC">
        <img src="assets/logo_ufjf.svg" alt="UFJF">
        <img src="assets/logo_mg.svg" alt="Governo de Minas Gerais">
      </div>
    </footer>`;
  }

  /* teclado do celular: o campo em foco vai para o centro da área visível (com o Continuar logo abaixo) */
  let focado = null, espera = 0;
  const centrar = () => { if (focado && document.activeElement === focado) focado.scrollIntoView({ block: "center" }); };
  document.addEventListener("focusin", (e) => {
    if (!e.target.matches || !e.target.matches("input, textarea, select")) return;
    focado = e.target; clearTimeout(espera); espera = setTimeout(centrar, ESPERA_TECLADO);
  });
  document.addEventListener("focusout", () => { focado = null; });
  if (window.visualViewport) window.visualViewport.addEventListener("resize", centrar);

  ir(telaCapa);
  /* item I: as "Fontes consultadas" que o padrão comum acrescenta ao resumo também vêm abertas (uma vez por tela) */
  if (typeof MutationObserver !== "undefined") new MutationObserver(() => {
    const f = tela.querySelector(".pag .p-fontes:not([data-aberto])");
    if (f && tela.querySelector(".lg2-proximo")) { f.open = true; f.dataset.aberto = "1"; }
  }).observe(tela, { childList: true, subtree: true });
})();
