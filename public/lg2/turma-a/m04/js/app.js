/* Telas do Módulo 4. O texto de conteúdo vem de window.MODULO4 (a planilha do grupo,
   com os ajustes do teste de 05/11/2026). As respostas ficam só neste aparelho; respostas de
   outros módulos são só lidas (para não perguntar de novo o que já foi respondido). */
(function () {
  "use strict";
  const D = window.MODULO4, M = Motor.montar(D);
  const tela = document.getElementById("tela");
  const CHAVE = "lg2-turma-a-m04";
  /* o módulo mudou de turma em 15/10: traz as respostas salvas na chave antiga */
  try { const antiga = localStorage.getItem("lg2-turma-b-m04"); if (antiga && !localStorage.getItem(CHAVE)) localStorage.setItem(CHAVE, antiga); } catch (e) {}
  const vazio = (s) => !s || !String(s).trim() || s === "—" || s === "-" || /^nenhum[a]?\.?$/i.test(String(s).trim());

  /* versão 2 (05/11/2026): a pergunta 14 ganhou opções novas; as respostas antigas são traduzidas.
     versão 3 (05/11/2026, 2º lote): opções da pergunta 4 com a grafia corrigida
     versão 4 (05/11/2026, 3º lote): a pergunta 4 virou múltipla escolha ({estado:"opcoes", opcoes:[...]})
     versão 5 (05/11/2026, 5º lote): "Outro" na pergunta 11 grava também o texto escrito ({estado:"opcao", opcao:"Outro", detalhe});
       o formato antigo continua válido, não há o que traduzir */
  const VERSAO = 5;
  const P04_ANTIGA = { "Plataformas (ifood)": "Plataformas (iFood)", "entregador parceiro": "Entregador parceiro", "loja própria ou parceira": "Loja própria ou parceira" };

  /* limites dos campos de número: abaixo do mínimo ou texto = erro; acima do aviso = aviso que deixa seguir */
  const DIAS_AVISO = 90;          // teste com mais de 90 dias
  const CRITERIO_AVISO = 100;     // número mínimo de sinais acima de 100
  const GASTO_AVISO = 1000;       // gasto no teste acima de R$ 1.000 (quando o Módulo 1 não deu um teto)
  const NUMEROS = {
    "M4.P19": { inteiro: true, min: 1, ex: "5", abaixo: "O número mínimo precisa ser pelo menos 1." },
    "M4.P20": { inteiro: true, min: 1, ex: "7", abaixo: "O teste precisa durar pelo menos 1 dia." },
    "M4.P21": { inteiro: false, min: 0, ex: "50 ou 12,50", abaixo: "" },
  };
  /* teto do quanto pode usar, pela resposta da pergunta 7 do Módulo 1 ("Mais de R$ 1.000" = sem teto) */
  const TETO_M1 = { "Nada por enquanto": 0, "Até R$ 100": 100, "Entre R$ 100 e R$ 500": 500, "Entre R$ 500 e R$ 1.000": 1000 };
  /* retorno depois de responder (relatório de 05/11): sem "Próximo passo", que repetia a ajuda; só a
     pergunta do primeiro cliente mantém o seu. Alertas de regra que repetem a dica ou o aviso da pergunta saem. */
  const PROXIMO_FICA = ["M4.P08"];
  const ALERTA_REPETIDO = ["M4.R01", "M4.R02"];   // R01 = dica da pergunta 1; R02 = aviso de não avançar sem a frase
  const UNID_P17 = { "Pedidos/reservas": "pedidos ou reservas", "Pedidos de preço/informações": "pedidos de preço ou informação", "Aceitaram experimentar": "pessoas que aceitaram experimentar" };
  const P14_ANTIGA = { "Protótipo sem venda": "Mostrar uma amostra sem cobrar", "Oferta mínima com preço": "Vender pouca quantidade, já com preço", "Pré-venda/reserva": "Aceitar encomenda ou reserva antes de fazer" };
  const P14_ANTIGA_SERV = { "Oferta mínima com preço": "Atender poucos clientes, já cobrando", "Pré-venda/reserva": "Aceitar agendamento ou reserva antes de atender" };
  let S = carregar();               // { v, R: respostas, hist: [códigos] }
  function carregar() {
    try {
      const s = JSON.parse(localStorage.getItem(CHAVE));
      if (!s || !s.R || !Array.isArray(s.hist)) return novo();
      if (!(s.v >= 2)) {
        const r = s.R["M4.P14"], t = s.R["M4.P02"];
        const serv = t && t.estado === "opcao" && /Servi/.test(t.opcao);
        if (r && r.estado === "opcao") { const n = (serv ? P14_ANTIGA_SERV : P14_ANTIGA)[r.opcao]; if (n) r.opcao = n; }
      }
      if (!(s.v >= 3)) {
        const r = s.R["M4.P04"];
        if (r && r.estado === "opcao" && P04_ANTIGA[r.opcao]) r.opcao = P04_ANTIGA[r.opcao];
      }
      if (!(s.v >= 4)) {
        const r = s.R["M4.P04"];
        if (r && r.estado === "opcao") s.R["M4.P04"] = Object.assign({ estado: "opcoes", opcoes: [r.opcao] }, r.de ? { de: r.de } : {});
      }
      s.v = VERSAO;
      return s;
    } catch { return novo(); }
  }
  function novo() { return { v: VERSAO, R: {}, hist: [] }; }

  /* ===== respostas de outros módulos (só leitura) ===== */
  function lerOutro(chave, cod) {
    try { const s = JSON.parse(localStorage.getItem(chave)); const r = s && s.R && s.R[cod]; return r || null; } catch { return null; }
  }
  const M1 = "lg2-turma-a-m01", M2 = "lg2-turma-b-m02", M3 = "lg2-turma-a-m03", M5 = "lg2-turma-a-m05";
  const textoDe = (r) => (r && r.estado === "valor" && typeof r.valor === "string" && r.valor.trim() ? r.valor.trim() : "");
  const opcaoDe = (r) => (r && r.estado === "opcao" && r.opcao ? String(r.opcao) : "");
  /* pergunta do cliente no Módulo 3: "Ainda não tenho clientes" (versão nova) e "Não sei" não definem um cliente */
  const SEM_CLIENTE = /^(ainda n[ãa]o tenho clientes?|n[ãa]o sei)\.?$/i;
  /* texto que descreve o público de forma ampla demais para um primeiro teste */
  const PUBLICO_AMPLO = /todo mundo|qualquer pessoa|qualquer um|p[úu]blico em geral|pessoas em geral|de todas as idades|todas as idades|todos os p[úu]blicos/i;
  /* aviso da pergunta do primeiro cliente quando o público trazido é amplo; não trava */
  function avisoAmplo(h) {
    if (!h || !h.amplo) return "";
    const t = h.amplo === "varios"
      ? `No Módulo ${h.de} você marcou mais de um tipo de cliente (${h.grupos.join(" e ")}). Tudo bem. Para o primeiro teste, escolha o grupo principal para começar e deixe os outros para depois. Se preferir, pode seguir assim.`
      : `O público que veio do Módulo ${h.de} ainda está amplo. Para o primeiro teste, escolha o grupo principal para começar, por exemplo “mães que trabalham fora, do meu bairro”. Se preferir, pode seguir assim.`;
    return `<div class="bloco b-proximo aviso-amplo" id="aviso-amplo"><b>Para começar</b>${esc(t)}</div>`;
  }
  const tipoCurto = (s) => (/^produto/i.test(s) ? "Produto" : /^mercadoria/i.test(s) ? "Mercadoria" : /^servi/i.test(s) ? "Serviço" : "");
  /* resposta já dada em outro módulo para a mesma pergunta; "Não sei" não conta */
  function herdado(cod) {
    if (cod === "M4.P01") {
      const a = textoDe(lerOutro(M1, "M1.P03")); if (a) return { valor: a, de: 1 };
      const b = textoDe(lerOutro(M3, "M3.P01")); if (b) return { valor: b, de: 3 };
    }
    if (cod === "M4.P02") {
      const a = tipoCurto(opcaoDe(lerOutro(M1, "M1.P03A"))); if (a) return { opcao: a, de: 1 };
      const b = tipoCurto(opcaoDe(lerOutro(M5, "M5.P01"))); if (b) return { opcao: b, de: 5 };
    }
    if (cod === "M4.P08") {
      const r = lerOutro(M3, "M3.P10");
      /* o Módulo 3 pode guardar mais de uma opção marcada (opcoes); a antiga, só opcao.
         "Ainda não tenho clientes" (e "Não sei") = sem cliente definido: não entra */
      const ops = r && r.estado === "opcao" ? (Array.isArray(r.opcoes) && r.opcoes.length ? r.opcoes : [opcaoDe(r)]) : [];
      const grupos = ops.map((o) => String(o || "").replace(/\s*\(.*\)\s*$/, "").trim()).filter((o) => o && !SEM_CLIENTE.test(o));
      const quem = grupos.join(" e ");
      const c = (r && r.campos) || {};
      const partes = Object.keys(c).filter((k) => !/resolver/i.test(k) && String(c[k] || "").trim()).map((k) => `${k.toLowerCase()}: ${String(c[k]).trim()}`);
      /* público amplo: mais de um grupo marcado, só a categoria (sem detalhe) ou texto do tipo "todo mundo" */
      const amplo = (v, n, soCategoria) => (n > 1 ? "varios" : soCategoria || PUBLICO_AMPLO.test(v) ? "amplo" : "");
      if (quem && partes.length) { const v = `${quem} (${partes.join("; ")})`; return { valor: v, de: 3, amplo: amplo(v, grupos.length, false), grupos }; }
      const b = textoDe(lerOutro(M2, "M2.P02")); if (b) return { valor: b, de: 2, amplo: amplo(b, 1, false) };
      if (quem) return { valor: quem, de: 3, amplo: amplo(quem, grupos.length, true), grupos };
    }
    if (cod === "M4.P09") {
      const a = textoDe(lerOutro(M3, "M3.P11")); if (a) return { valor: a, de: 3 };
      const r = lerOutro(M3, "M3.P10"), c = (r && r.campos) || {};
      const k = Object.keys(c).find((x) => /resolver/i.test(x) && String(c[x] || "").trim());
      if (k) return { valor: String(c[k]).trim(), de: 3 };
    }
    return null;
  }
  /* proposta de valor: o que a pessoa já escreveu neste módulo vem preenchido (o problema e o benefício) */
  const VEIO_DE_DENTRO = { "M4.PV1": ["M4.P09", "Trouxemos a sua resposta sobre o problema do cliente."], "M4.PV3": ["M4.P10", "Trouxemos a sua resposta sobre o que o cliente ganha."] };
  function daqui(cod) {
    const d = VEIO_DE_DENTRO[cod]; if (!d) return null;
    const v = Motor.valor(S.R, d[0]);
    return v && v !== Motor.NS ? { valor: v, nota: d[1] } : null;
  }
  /* quem oferece só serviço lê "serviço" onde a planilha diz "produto" */
  function T(s) {
    if (Motor.valor(S.R, "M4.P02") !== "Serviço") return s;
    return String(s ?? "").replace(/produto ou serviço/g, "serviço").replace(/\bprodutos\b/g, "serviços").replace(/\bProdutos\b/g, "Serviços")
      .replace(/\bproduto\b/g, "serviço").replace(/\bProduto\b/g, "Serviço");
  }
  /* tipo usado para escolher os exemplos: a resposta da pergunta 2 (que já vem do Módulo 1);
     antes dela, o tipo do Módulo 1 e depois o do Módulo 5. Combinação com produto usa os exemplos de produto. */
  function tipoEx() {
    const p = Motor.valor(S.R, "M4.P02");
    const t = p && p !== Motor.NS ? p : (tipoCurto(opcaoDe(lerOutro(M1, "M1.P03A"))) || tipoCurto(opcaoDe(lerOutro(M5, "M5.P01"))));
    return t === "Serviço" ? "Serviço" : /^Mercadoria(\+ ?Serviço)?$/.test(t || "") ? "Mercadoria" : "Produto";
  }
  /* alimento pelo que a pessoa vende: palavras comuns de comida e bebida (cópia da lista do Módulo 9, com brownie e afins) */
  const ALIMENTO = /bolo|brownie|doce|salgad|comida|marmit|quentinha|lanche|aliment|bebida|suco|sorvete|picol[eé]|gelad|confeit|padaria|\bp[aã]o\b|\bp[aã]es\b|torta|brigadeiro|trufa|bombo|cupcake|biscoit|cookie|chocolate|pizza|hamb[uú]rg|sandu[ií]che|pastel|coxinha|empad|petisco|geleia|cerveja|quitut|refei[cç]|caf[eé]\b|a[cç]a[ií]\b|tempero|conserva|queijo|cocada|pudim|p[aã]o de mel|esfiha|tapioca|cachorro-quente|hot ?dog/i;
  /* onde procurar: a ideia do Módulo 1 e as respostas de texto deste módulo (ideia, ficha e versões) */
  const FALAS_ALIMENTO = ["M4.P01", "M4.P03", "M4.P05"];
  function ehAlimento() {
    const falas = [textoDe(lerOutro(M1, "M1.P03"))].concat(FALAS_ALIMENTO.map((c) => { const v = Motor.valor(S.R, c); return v && v !== Motor.NS ? String(v) : ""; }));
    return falas.some((t) => t && ALIMENTO.test(t));
  }
  /* textos e exemplos próprios do tipo (campo por_tipo dos dados), por cima dos de produto;
     produto de comida ou bebida usa a variante "Alimento" (ficha técnica da receita) quando ela existe */
  function adapt(o) {
    const pt = o && o.por_tipo, k = tipoEx();
    const x = pt && ((k === "Produto" && pt.Alimento && ehAlimento() && pt.Alimento) || pt[k]);
    return x ? Object.assign({}, o, x) : o;
  }
  /* conceitos que valem para as respostas: a ficha técnica do serviço só aparece quando há serviço */
  function baseVale(b) {
    const t = String(Motor.valor(S.R, "M4.P02") || "");
    if (b.so_servico) return /Servi/.test(t) || (!t && tipoEx() === "Serviço");
    if (b.codigo === "M4.BT09") return tipoEx() !== "Serviço";
    return true;
  }

  /* ===== números (aceita vírgula ou ponto decimal e ponto de milhar: 1.500 / 12,50 / 12.50) ===== */
  function lerNumero(s) {
    s = String(s ?? "").replace(/\s+/g, "").replace(/^R\$/i, "");
    const milhar = /^-?\d{1,3}(\.\d{3})+(,\d+)?$/, simples = /^-?\d+([.,]\d+)?$/;
    if (milhar.test(s)) return parseFloat(s.replace(/\./g, "").replace(",", "."));
    if (simples.test(s)) return parseFloat(s.replace(",", "."));
    return NaN;
  }
  const fmt = (n) => n % 1 ? n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : n.toLocaleString("pt-BR");
  function checarNumero(cod, v) {
    const r = NUMEROS[cod] || { inteiro: false, min: 0, ex: "10", abaixo: "" };
    const n = lerNumero(v);
    if (isNaN(n)) return { erro: `Digite só números. Ex.: ${r.ex}` };
    if (n < 0) return { erro: "O número não pode ser negativo." };
    if (r.inteiro && n % 1) return { erro: `Digite um número inteiro, sem vírgula. Ex.: ${r.ex}` };
    if (n < r.min) return { erro: r.abaixo };
    const aviso = avisoNumero(cod, n);
    return aviso ? { aviso } : {};
  }
  function avisoM1(n) {
    const op = opcaoDe(lerOutro(M1, "M1.P07"));
    if (!(op in TETO_M1) || n <= TETO_M1[op]) return "";
    return TETO_M1[op] === 0
      ? `No Módulo 1 você disse que, por enquanto, não tem dinheiro para usar no negócio sem faltar para as contas da casa. Esse teste custa R$ ${fmt(n)}. Dá para fazer uma versão sem gastar?`
      : `No Módulo 1 você disse que pode usar até R$ ${fmt(TETO_M1[op])} sem faltar para as contas da casa. Esse teste custa R$ ${fmt(n)}. Dá para fazer uma versão menor?`;
  }
  function avisoNumero(cod, n) {
    if (cod === "M4.P20" && n > DIAS_AVISO) return `Esse prazo parece longo para um primeiro teste: ${fmt(n)} dias é mais de ${DIAS_AVISO} dias. Um teste curto, de 7 a 30 dias, ajuda você a decidir mais rápido. Confira o número.`;
    if (cod === "M4.P19" && n > CRITERIO_AVISO) return `Esse número parece alto para um primeiro teste pequeno (mais de ${CRITERIO_AVISO}). Confira se é isso mesmo.`;
    if (cod === "M4.P21") {
      const m1 = avisoM1(n); if (m1) return m1;
      if (n > GASTO_AVISO) return `Esse valor parece alto para o primeiro teste de um pequeno negócio (mais de R$ ${fmt(GASTO_AVISO)}). Confira se é isso mesmo.`;
    }
    return "";
  }

  /* ===== teclado do celular: o campo em foco vai para o meio da área visível, com o Continuar logo abaixo ===== */
  let focoT = null;
  function centrarCampo() {
    const el = document.activeElement;
    if (!el || !el.matches || !el.matches("input, textarea, select")) return;
    el.scrollIntoView({ block: "center" });
    const ok = document.getElementById("ok"), vv = window.visualViewport;
    if (!ok || ok.hidden) return;
    const alto = vv ? vv.height : window.innerHeight, b = ok.getBoundingClientRect(), c = el.getBoundingClientRect();
    const falta = b.bottom + 8 - alto;
    if (falta > 0) window.scrollBy(0, Math.min(falta, Math.max(0, c.top - 8)));
  }
  document.addEventListener("focusin", (e) => {
    if (!e.target.matches || !e.target.matches("input, textarea, select")) return;
    clearTimeout(focoT); focoT = setTimeout(centrarCampo, 300);
  });
  if (window.visualViewport) window.visualViewport.addEventListener("resize", () => { clearTimeout(focoT); focoT = setTimeout(centrarCampo, 50); });

  const selo = (n) => `<p class="selo-m"><b>Veio do Módulo ${n}</b> · Confira e ajuste se quiser.</p>`;
  function salvar() { try { localStorage.setItem(CHAVE, JSON.stringify(S)); } catch {} }

  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const link = (u, t) => /^https?:/.test(u || "") ? `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(t || u)}</a>` : esc(t || u);
  const txt = (s) => esc(String(s ?? "").trim()).replace(/\n/g, "<br>");   // quebras de linha da célula
  function el(html) { const d = document.createElement("div"); d.innerHTML = html.trim(); return d.firstElementChild; }
  function ir(f, a) { tela.innerHTML = ""; tela.appendChild(f(a)); window.scrollTo(0, 0); }

  /* conceitos da Base técnica ligados à pergunta: pela fonte citada na pergunta */
  function conceitosDe(q) {
    const f = String(q.fonte || "").split(",")[0].trim().toLowerCase();
    if (!f) return [];
    const chave = f.replace(/\s*\(.*$/, "").slice(0, 22);
    return D.base.filter((b) => baseVale(b) && String(b.fonte || "").toLowerCase().includes(chave)).slice(0, 2);
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
    return `<details class="saiba"><summary>Entenda os termos</summary>${lista.map(adapt).map((b) => `
      <div class="conceito"><b>${esc(b.conceito)}</b><p>${esc(b.definicao)}</p>
      ${vazio(b.exemplo) ? "" : `<p class="ex">${esc(b.exemplo)}</p>`}
      <span class="fonte">Fonte: ${link(b.link, b.fonte)}${vazio(b.data) ? "" : ` · consultado em ${esc(b.data)}`}</span></div>`).join("")}
    </details>`;
  }
  /* um conceito da Base técnica, aberto (pedido do grupo: "exibir também significado do termo") */
  function conceitoAberto(cod) {
    const b = adapt(D.base.find((x) => x.codigo === cod));
    if (!b) return "";
    return `<div class="caixa caixa-entenda"><b>${esc(b.conceito)}</b><p>${txt(b.definicao)}</p>
      ${vazio(b.exemplo) ? "" : `<p class="ex">${esc(b.exemplo)}</p>`}
      <span class="fonte">Fonte: ${link(b.link, b.fonte)}${vazio(b.data) ? "" : ` · consultado em ${esc(b.data)}`}</span></div>`;
  }
  /* vários conceitos no mesmo cartão (pergunta 14: protótipo, oferta mínima e pré-venda, na ordem das opções);
     só os das opções que aparecem nesta versão da pergunta; exemplos e fontes ficam em "Ver exemplos" */
  function conceitosJuntos(cods, opcoes) {
    const lista = cods.map((c) => D.base.find((x) => x.codigo === c)).filter((b) => b && (!b.opcao || opcoes.includes(b.opcao) || opcoes.some((o) => mesmoTipoDeTeste(o, b.opcao)))).map(adapt);
    if (!lista.length) return "";
    const fontes = [...new Set(lista.map((b) => b.fonte))];
    return `<div class="caixa caixa-entenda conceitos-juntos"><span class="tag">Entenda</span><b>O que quer dizer cada jeito de testar</b>
      ${lista.map((b) => `<p class="cj-item"><strong>${esc(T(b.conceito))}:</strong> ${esc(T(b.definicao))}</p>`).join("")}
      <details class="dica-mais"><summary>Ver exemplos</summary>${lista.map((b) => vazio(b.exemplo) ? "" : `<p class="ex"><strong>${esc(T(b.conceito))}:</strong> ${esc(b.exemplo)}</p>`).join("")}
        <span class="fonte">Fontes: ${fontes.map(esc).join("; ")}</span></details></div>`;
  }
  /* as opções da versão de serviço (pergunta 14) correspondem às de produto pela ordem: cobrar já = oferta mínima, reserva = pré-venda */
  const PAR_SERV = { "Atender poucos clientes, já cobrando": "Vender pouca quantidade, já com preço", "Aceitar agendamento ou reserva antes de atender": "Aceitar encomenda ou reserva antes de fazer" };
  const mesmoTipoDeTeste = (op, opBase) => PAR_SERV[op] === opBase;
  function ligarCopiar(p) {
    p.querySelectorAll(".btn-copiar").forEach((b) => (b.onclick = () => {
      navigator.clipboard && navigator.clipboard.writeText(b.dataset.t);
      b.textContent = "Copiado";
    }));
  }

  /* ================= peças do layout (modelo do Módulo 5) ================= */
  function topo(trilha) {
    return `<div class="barra-topo">
      <img class="logo-mini" src="assets/minds.svg" alt="Minds of the Future">
      <nav class="trilha" aria-label="Você está em"><button class="trilha-link" data-inicio>Início</button><span>/</span><span>Módulo ${esc(D.modulo.numero)}</span>${trilha ? `<span>/</span><span>${esc(trilha)}</span>` : ""}</nav>
    </div>`;
  }
  /* faixa roxa: o.kicker e o.titulo vêm do que a tela já mostrava; o.progresso (0-100) desenha a barra amarela */
  function heroi(o) {
    const tag = o.h1 ? "h1" : "h2";
    return `<section class="heroi ${o.grande ? "heroi-grande" : ""}">
      <div class="heroi-topo">
        <div class="heroi-txt">
          <div class="kicker ${o.kickerClasse || ""}">${esc(o.kicker || "Módulo " + D.modulo.numero)}</div>
          <${tag} class="heroi-tit ${o.titClasse || ""}">${esc(o.titulo)}</${tag}>
          ${o.texto ? `<p>${esc(o.texto)}</p>` : ""}
        </div>
        <img class="heroi-img" src="assets/${o.img || "hero-tela.webp"}" alt="">
      </div>
      ${o.progresso === undefined ? "" : `<div class="heroi-prog"><div class="barra" role="progressbar" aria-label="Progresso" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${o.progresso}"><div class="barra-fill" style="width:${o.progresso}%"></div></div></div>`}
    </section>`;
  }
  /* ajuda da pergunta em cartão de dica: a parte essencial fica à vista e o resto em "Ver mais" (relatório da Nayara:
     dicas longas cansam no celular). resto = ajuda_mais dos dados; sem ele, ajuda acima de DICA_MAX caracteres
     mostra só a 1ª frase. exemplo = exemplo longo recolhido (ficha técnica de alimento). antes = html já escapado. */
  const DICA_MAX = 220;
  function dividir(s) {
    s = String(s ?? "").trim();
    if (s.length <= DICA_MAX) return [s, ""];
    const m = s.match(/^([\s\S]+?[.!?])(?:\s*\n+\s*|\s+(?=[A-ZÀ-Ú"“(]))([\s\S]+)$/);
    return m ? [m[1], m[2]] : [s, ""];
  }
  function dica(texto, resto, exemplo, antes) {
    let [vista, mais] = resto ? [texto, resto] : dividir(texto);
    if (!vista && !antes) return "";
    return `<aside class="dica"><img src="assets/hero-tela.webp" alt=""><div><b>Dica</b><p class="ajuda">${antes || ""}${txt(vista)}</p>${
      mais ? `<details class="dica-mais dica-resto"><summary>Ver mais</summary><p class="ajuda">${txt(mais)}</p></details>` : ""}${
      exemplo ? `<details class="dica-mais"><summary>${esc(exemplo.titulo)}</summary><p class="ajuda">${txt(exemplo.texto)}</p></details>` : ""}</div></aside>`;
  }
  const botaoVoltar = () => `<div class="acoes acoes-voltar"><button class="btn btn-linha voltar" id="v">Voltar</button></div>`;
  /* "‹ Voltar" no topo do cartão da pergunta, à esquerda (mesmo lugar em todos os módulos); o nome acessível é "Voltar" */
  const voltarTopo = () => `<button class="voltar-topo" id="v"><span aria-hidden="true">‹</span> Voltar</button>`;
  /* nome da opção na tela: "Mercadoria+ Serviço" (como está gravado) aparece "Mercadoria + Serviço" */
  const rotulo = (op) => String(op ?? "").replace(/\s*\+\s*/g, " + ");
  /* opção com bolinha; sem espaços entre as tags para o nome do botão continuar igual ao texto da opção */
  const opcaoHtml = (op, sel, attrs, sub) => `<button class="opcao ${sel ? "sel" : ""}" data-op="${esc(op)}"${attrs || ""}><span class="radio" aria-hidden="true"></span><span class="op-txt"><b>${esc(rotulo(op))}</b>${sub ? `<small class="op-sub">${esc(sub)}</small>` : ""}</span></button>`;
  function concluido() {
    return `<section class="concluido"><div class="conc-topo"><span class="check" aria-hidden="true"></span><div><h2>Você concluiu o Módulo ${esc(D.modulo.numero)}</h2><p>Confira abaixo o resumo das suas respostas.</p></div></div></section>`;
  }
  /* liga os botões comuns a todas as telas */
  function ligar(p) { p.querySelectorAll("[data-inicio]").forEach((b) => { b.onclick = () => ir(telaCapa); }); }

  /* ================= capa ================= */
  function telaCapa() {
    const iniciado = S.hist.length > 0;
    const p = el(`
      <div class="pag">
        ${topo("")}
        ${heroi({ grande: true, h1: true, titulo: D.modulo.nome, texto: D.mapa.objetivo, img: "hero-inicio.webp" })}
        <main class="corpo">
          <div class="cartao"><h3>Para quem é</h3><p>${esc(D.mapa.usuario)}</p></div>
          <div class="cartao"><h3>O que ter em mãos</h3><p>${esc(D.mapa.ter_em_maos)}</p></div>
          <div class="cartao"><h3>O que você recebe no final</h3><p>${esc(D.mapa.entrega)}</p></div>
          <div class="acoes">
            <button class="btn btn-primario seta" id="ir">${iniciado ? "Continuar de onde parei" : "Começar"}</button>
            ${iniciado ? `<button class="btn btn-claro" id="zerar">Recomeçar do zero</button>` : ""}
            <button class="btn btn-linha" id="limites">O que este módulo não faz</button>
          </div>
          ${rodape()}
        </main>
      </div>`);
    ligar(p);
    p.querySelector("#ir").onclick = () => {
      const atual = S.hist[S.hist.length - 1];
      if (atual === "RESULTADO") ir(telaResultado);
      else ir(telaPergunta, atual || Motor.proxima(M, S.R, null));
    };
    const z = p.querySelector("#zerar");
    if (z) z.onclick = () => { if (confirm("Apagar suas respostas e recomeçar?")) { S = novo(); salvar(); ir(telaCapa); } };
    p.querySelector("#limites").onclick = () => ir(telaLimites);
    return p;
  }

  function telaLimites() {
    const p = el(`
      <div class="pag">
        ${topo("Limites")}
        ${heroi({ titulo: "Limites do módulo" })}
        <main class="corpo">
          <div class="cartao"><h3>O que o módulo não faz</h3><p>${esc(D.mapa.nao_faz)}</p></div>
          <div class="cartao"><h3>Que decisões ele apoia</h3><p>${esc(D.mapa.decisoes)}</p></div>
          <div class="cartao"><h3>Quando procurar um profissional</h3><p>${esc(D.mapa.encaminhamentos)}</p></div>
          <div class="aviso">${esc(D.mapa.mensagem_limite)}</div>
          ${botaoVoltar()}
          ${rodape()}
        </main>
      </div>`);
    ligar(p);
    p.querySelector("#v").onclick = () => ir(telaCapa);
    return p;
  }

  /* ================= pergunta ================= */
  function progresso() {
    const vistas = S.hist.filter((c) => c !== "RESULTADO").length;
    return Math.min(100, Math.round((vistas / M.perguntas.length) * 100));
  }

  function telaPergunta(cod) {
    const q0 = M.porCodigo[cod], q = adapt(q0);
    if (S.hist[S.hist.length - 1] !== cod) { S.hist.push(cod); salvar(); }
    const tipo = Motor.campo(q);
    const V = Motor.versao(M, S.R, q);
    const resp = S.R[cod] || null;
    /* sem resposta própria: traz a de outro módulo, se houver */
    const her = resp ? null : (herdado(cod) || daqui(cod));
    const origem = her || (resp && resp.de ? { valor: resp.valor, opcao: resp.opcao, de: resp.de } : null);
    let marcadas = resp && resp.estado === "opcoes" ? resp.opcoes.filter((o) => V.opcoesLista.includes(o)) : [];
    let escolhida = resp && resp.estado === "opcao" && V.opcoesLista.includes(resp.opcao) ? resp.opcao
      : her && her.opcao && V.opcoesLista.includes(her.opcao) ? her.opcao : null;
    const unidade = /reais|R\$/.test(V.pergunta) ? "R$" : /dias/.test(V.pergunta) ? "dias" : "";
    const inteiro = NUMEROS[cod] && NUMEROS[cod].inteiro;

    const p = el(`
      <div class="pag">
        ${topo("Perguntas")}
        ${heroi({ titulo: `Pergunta ${M.perguntas.indexOf(q0) + 1} de ${M.perguntas.length}`, titClasse: "passo", texto: D.modulo.nome, progresso: progresso() })}
        <main class="corpo">
          <div class="cartao-q pergunta">
            ${voltarTopo()}
            <h2 class="q">${esc(T(V.pergunta))}</h2>
            ${vazio(q.destaque) ? "" : `<div class="bloco b-proximo destaque">${txt(q.destaque)}</div>`}
            ${dica(T(V.ajuda), V.variante ? "" : T(q.ajuda_mais || ""), q.ajuda_exemplo, cod === "M4.PV2" && motivoP11() ? `Antes você marcou “${esc(motivoP11())}” como o principal motivo. Explique com as suas palavras.<br>` : "")}
            ${vazio(q.destaque_alerta) ? "" : `<div class="bloco b-alerta destaque"><b>Atenção</b>${txt(T(q.destaque_alerta))}</div>`}
            ${q.conceito_destaque ? conceitoAberto(q.conceito_destaque) : ""}
            ${q.conceitos_destaque ? conceitosJuntos(q.conceitos_destaque, V.opcoesLista) : ""}
            ${her && her.nota ? `<p class="selo-m"><b>${esc(her.nota)}</b> · Confira e ajuste se quiser.</p>` : origem && origem.de && (origem.valor || origem.opcao) ? selo(origem.de) : ""}
            ${cod === "M4.P08" ? avisoAmplo(her) : ""}
            <div class="entrada" id="ent"></div>
            ${Motor.temNaoSei(q) ? `<div class="alt"><button class="btn-alt" id="ns">Não sei</button></div>` : ""}
            <div class="erro" id="erro" hidden></div>
            <div id="retorno"></div>
            <div class="acoes" id="acoes"><button class="btn btn-primario seta" id="ok">Continuar</button></div>
            ${blocoEducativo(educativoDe(cod))}
            ${blocoConceitos(conceitosDe(q))}
          </div>
          ${rodape()}
        </main>
      </div>`);
    ligarCopiar(p);
    ligar(p);

    p.querySelector("#v").onclick = () => {
      S.hist.pop();
      const ant = S.hist.pop();
      salvar();
      if (ant) ir(telaPergunta, ant); else ir(telaCapa);
    };

    const ent = p.querySelector("#ent");
    /* "Outro" com campo (pergunta 11): o texto é gravado junto da opção, em detalhe */
    const oc = q.outro_campo;
    let outroBox = null;
    if (tipo === "escolha") {
      ent.classList.add("opcoes");
      V.opcoesLista.forEach((op) => {
        const b = el(opcaoHtml(op, escolhida === op, ""));
        b.onclick = () => { escolhida = op; ent.querySelectorAll(".opcao").forEach((x) => x.classList.remove("sel")); b.classList.add("sel"); mostrarEscolha(); };
        ent.appendChild(b);
      });
      /* dica curta ao tocar cada opção: o que significa escolher aquilo (pergunta 14) */
      if (q.opcoes_explica) ent.appendChild(el(`<p class="dica-op" id="dica-op" aria-live="polite" hidden></p>`));
      if (oc) {
        const antes = resp && resp.estado === "opcao" && resp.opcao === oc.opcao ? resp.detalhe || "" : "";
        outroBox = el(`<label class="outro-campo" hidden><span>${esc(oc.rotulo)}</span><textarea class="campo" rows="2">${esc(antes)}</textarea></label>`);
        ent.appendChild(outroBox);
      }
    } else if (tipo === "multipla") {
      /* caixas de seleção: marca quantas quiser; "Não sei" desmarca as outras (e vice-versa) */
      ent.classList.add("opcoes", "multipla");
      ent.appendChild(el(`<p class="dica-multi">Marque todas as que valem.</p>`));
      V.opcoesLista.forEach((op) => {
        const b = el(`<button class="opcao caixa-sel ${marcadas.includes(op) ? "sel" : ""}" data-op="${esc(op)}" role="checkbox" aria-checked="${marcadas.includes(op)}"><span class="radio quadrado" aria-hidden="true"></span><span class="op-txt"><b>${esc(rotulo(op))}</b></span></button>`);
        b.onclick = () => {
          if (marcadas.includes(op)) marcadas = marcadas.filter((x) => x !== op);
          else marcadas = op === Motor.NS ? [op] : marcadas.filter((x) => x !== Motor.NS).concat(op);
          ent.querySelectorAll(".opcao").forEach((x) => { const on = marcadas.includes(x.dataset.op); x.classList.toggle("sel", on); x.setAttribute("aria-checked", on); });
        };
        ent.appendChild(b);
      });
    } else {
      const v = resp && resp.estado === "valor" ? resp.valor : (her && her.valor) || "";
      ent.appendChild(el(tipo === "numero"
        ? `<div class="linha">${unidade === "R$" ? `<span class="pre">R$</span>` : ""}<input class="campo" inputmode="${inteiro ? "numeric" : "decimal"}" value="${esc(v)}">${unidade === "dias" ? `<span class="pre">dias</span>` : ""}</div>`
        : `<textarea class="campo" rows="3">${esc(v)}</textarea>`));
    }
    /* dica da opção marcada e campo do "Outro" (abre com o cursor só quando a pessoa toca) */
    let initEscolha = true;
    function mostrarEscolha() {
      const d = ent.querySelector("#dica-op");
      if (d) { const t = escolhida && q.opcoes_explica[escolhida]; d.textContent = t || ""; d.hidden = !t; }
      if (outroBox) {
        const abre = escolhida === oc.opcao, era = outroBox.hidden;
        outroBox.hidden = !abre;
        if (abre && era && !initEscolha) outroBox.querySelector("textarea").focus();
      }
    }
    if (tipo === "escolha") mostrarEscolha();
    initEscolha = false;
    const ns = p.querySelector("#ns");
    if (ns) ns.onclick = () => responder({ estado: "naosei" });

    /* aviso de número fora do comum: aparece uma vez; tocar de novo com o mesmo valor segue */
    let avisoVisto = null;
    const okBtn = p.querySelector("#ok");
    ent.addEventListener("input", () => { if (avisoVisto !== null) { avisoVisto = null; okBtn.textContent = "Continuar"; p.querySelector("#erro").hidden = true; } });
    okBtn.onclick = () => {
      if (tipo === "escolha") {
        if (!escolhida) return erro("Escolha uma opção para continuar.");
        if (oc && escolhida === oc.opcao) {
          const d = outroBox.querySelector("textarea").value.trim();
          if (!d) { outroBox.querySelector("textarea").focus(); return erro(oc.erro); }
          return responder({ estado: "opcao", opcao: escolhida, detalhe: d });
        }
        return responder(marcar({ estado: "opcao", opcao: escolhida }));
      }
      if (tipo === "multipla") {
        if (!marcadas.length) return erro("Marque pelo menos uma opção para continuar.");
        return responder({ estado: "opcoes", opcoes: V.opcoesLista.filter((o) => marcadas.includes(o)) });
      }
      const v = ent.querySelector("input,textarea").value.trim();   // (texto e número: o único campo da tela)
      if (!v) return erro(Motor.temNaoSei(q) ? "Responda ou toque em \"Não sei\"." : "Escreva a sua resposta para continuar. Se travar, veja o exemplo na dica acima.");
      if (tipo === "numero") {
        const c = checarNumero(cod, v);
        if (c.erro) return erro(c.erro);
        if (c.aviso && avisoVisto !== v) { avisoVisto = v; return avisar(c.aviso); }
      }
      responder(marcar({ estado: "valor", valor: v }));
    };
    /* guarda de qual módulo veio a resposta, se a pessoa manteve o que foi trazido */
    function marcar(r) {
      if (origem && origem.de && ((r.estado === "opcao" && r.opcao === origem.opcao) || (r.estado === "valor" && r.valor === String(origem.valor || "").trim()))) r.de = origem.de;
      return r;
    }
    function erro(t) { const e = p.querySelector("#erro"); e.classList.remove("aviso-num"); e.textContent = t; e.hidden = false; }
    function avisar(t) {
      const e = p.querySelector("#erro");
      e.classList.add("aviso-num");
      e.innerHTML = `<b>Confira</b>${esc(t)}${/Módulo 1/.test(t) ? `<span class="selo-m"><b>Veio do Módulo 1</b></span>` : ""}<span class="aviso-dica">Se estiver certo, toque em “Continuar mesmo assim”.</span>`;
      e.hidden = false;
      okBtn.textContent = "Continuar mesmo assim";
    }

    function responder(r0) {
      p.querySelector("#erro").hidden = true;
      okBtn.textContent = "Continuar";
      /* pedido do grupo (M4.P01): com "Não sei" a pessoa não avança enquanto não escrever a frase */
      if (q.bloqueia_naosei && r0.estado === "naosei") {
        const R = Object.assign({}, S.R, { [cod]: r0 });
        delete S.R[cod]; salvar();
        return mostrarRetorno(Motor.regrasAgora(M, R, cod), null, Motor.NS);
      }
      S.R[cod] = r0;
      /* respostas de perguntas que deixaram de aparecer são descartadas */
      limparInvisiveis();
      salvar();
      const regras = Motor.regrasAgora(M, S.R, cod);
      const prox = Motor.proxima(M, S.R, cod);
      mostrarRetorno(regras, prox, Motor.valor(S.R, cod));
    }

    function mostrarRetorno(regras, prox, v) {
      const ehNS = v === Motor.NS;
      const box = p.querySelector("#retorno");
      const se = Motor.retornoSe(q, v);
      box.innerHTML = `<div class="retorno">
        ${vazio(q.resposta) ? "" : `<p class="r-texto r-pergunta">${txt(T(q.resposta))}</p>`}
        ${ehNS && !vazio(q.resposta_naosei) ? `<p class="r-texto r-pergunta">${txt(T(q.resposta_naosei))}</p>` : ""}
        ${ehNS && !vazio(q.prompt_ia) ? `<div class="prompt"><p>${txt(q.prompt_ia)}</p><button class="btn-copiar" data-t="${esc(q.prompt_ia)}">Copiar texto</button></div>` : ""}
        ${ehNS && q.conceito_naosei ? conceitoAberto(q.conceito_naosei) : ""}
        ${vazio(se) ? "" : `<div class="bloco b-proximo">${txt(se)}</div>`}
        ${regras.map((r) => `
          <div class="regra">
            <p class="r-texto">${txt(T(r.texto))}</p>
            ${vazio(r.alerta) || ALERTA_REPETIDO.includes(r.codigo) ? "" : `<div class="bloco b-alerta"><b>Atenção</b>${txt(T(r.alerta))}</div>`}
            ${vazio(r.encaminhamento) ? "" : `<div class="bloco b-enc"><b>Quem procurar</b>${txt(r.encaminhamento)}</div>`}
          </div>`).join("")}
        ${vazio(q.alerta) ? "" : `<div class="bloco b-alerta"><b>Atenção</b>${txt(T(q.alerta))}</div>`}
        ${ehNS && !vazio(q.alerta_naosei) ? `<div class="bloco b-alerta bloqueio"><b>Atenção</b>${txt(T(q.alerta_naosei))}</div>` : ""}
        ${prox && !vazio(q.proximo) && PROXIMO_FICA.includes(cod) ? `<div class="bloco b-proximo"><b>Próximo passo</b>${txt(T(q.proximo))}</div>` : ""}
      </div>`;
      ligarCopiar(box);
      box.scrollIntoView({ behavior: "smooth", block: "start" });
      if (!prox) return;            // bloqueado: continua o botão "Continuar", que exige a resposta
      const acoes = p.querySelector("#acoes");
      acoes.innerHTML = "";
      const b = el(`<button class="btn btn-primario seta">${prox === "RESULTADO" ? "Ver meu resumo" : "Seguir"}</button>`);
      b.onclick = () => { if (prox === "RESULTADO") { S.hist.push("RESULTADO"); salvar(); ir(telaResultado); } else ir(telaPergunta, prox); };
      acoes.appendChild(b);
      const c = el(`<button class="btn btn-claro">Corrigir minha resposta</button>`);
      c.onclick = () => ir(telaPergunta, cod);
      acoes.appendChild(c);
    }
    return p;
  }

  function limparInvisiveis() {
    let cod = Motor.proxima(M, {}, null);
    const R = {};
    while (cod !== "RESULTADO") {
      const r = S.R[cod];
      /* resposta de opção que não existe mais nesta versão da pergunta (ex.: M4.P14 depois de trocar M4.P02) */
      if (r && r.estado === "opcao" && !Motor.versao(M, R, M.porCodigo[cod]).opcoesLista.includes(r.opcao)) break;
      if (r && r.estado === "opcoes" && !r.opcoes.every((o) => Motor.versao(M, R, M.porCodigo[cod]).opcoesLista.includes(o))) break;
      if (r === undefined) break;
      R[cod] = r;
      cod = Motor.proxima(M, R, cod);
    }
    Object.keys(S.R).forEach((k) => { if (!(k in R)) delete S.R[k]; });
  }

  /* ================= resultado: resumo das respostas + alertas da planilha ================= */
  function telaResultado() {
    const regras = Motor.regrasTodas(M, S.R);
    const lac = Motor.lacunas(regras), enc = Motor.encaminhamentos(regras), ale = Motor.alertas(regras);
    const resp = Motor.respondidas(M, S.R);
    const ns = resp.filter((q) => Motor.valor(S.R, q.codigo) === Motor.NS);
    const p = el(`
      <div class="pag">
        ${topo("Resultado")}
        ${heroi({ kicker: "Resultado", kickerClasse: "passo", titulo: "Resumo das suas respostas" })}
        <main class="corpo">
          ${concluido()}
          ${entendemos(ns.length)}
          <div class="res-num">
            <div class="lbl">Perguntas respondidas</div>
            <div class="val">${resp.length}</div>
            <div class="sub">${ns.length ? `${ns.length} com “Não sei”` : "nenhuma com “Não sei”"}</div>
          </div>
          <div class="aviso">${esc(D.mapa.mensagem_limite)}</div>

          <details class="respostas"><summary>Ver suas respostas (${resp.length})</summary>
          ${resp.map((q, i) => { const v = Motor.valor(S.R, q.codigo), se = Motor.retornoSe(q, v), de = S.R[q.codigo].de; return `
            <div class="etapa ${v === Motor.NS ? "e-conf" : "e-sim"}">
              <div class="etapa-topo"><span class="etq">${i + 1}</span><b>${esc(T(Motor.versao(M, S.R, adapt(q)).pergunta))}</b></div>
              <p>${txt(mostrar(q.codigo))}</p>
              ${de ? `<p class="selo-m"><b>Veio do Módulo ${de}</b></p>` : ""}
              ${vazio(q.alerta) ? "" : `<p class="mini-info"><b>Atenção:</b> ${txt(T(q.alerta))}</p>`}
              ${vazio(se) ? "" : `<p class="mini-info">${txt(se)}</p>`}
              ${vazio(adapt(q).proximo) || !PROXIMO_FICA.includes(q.codigo) ? "" : `<p class="mini-info"><b>Próximo passo:</b> ${txt(T(adapt(q).proximo))}</p>`}
            </div>`; }).join("")}
          </details>

          ${propostaValor()}
          ${regras.length ? `<div class="secao-titulo">Orientações</div>${regras.map((r) => `<div class="cartao"><p>${esc(T(r.texto))}</p></div>`).join("")}` : ""}
          ${avisosNumeros()}
          ${ale.length ? `<div class="secao-titulo">Alertas</div>${ale.map((a) => `<div class="bloco b-alerta">${esc(T(a))}</div>`).join("")}` : ""}
          ${lac.length ? `<div class="bloco b-lacuna"><b>O que ainda falta saber</b><ul>${lac.map((l) => `<li>${esc(l)}</li>`).join("")}</ul></div>` : ""}
          ${enc.length ? `<div class="bloco b-enc"><b>Quem procurar, pelas suas respostas</b>${enc.map(esc).join(" · ")}</div>` : ""}

          <div class="secao-titulo">O que este módulo entrega</div>
          <div class="cartao"><p>${esc(D.mapa.entrega)}</p></div>
          <div class="cartao"><h3>Quando procurar um profissional</h3><p>${esc(D.mapa.encaminhamentos)}</p></div>
          ${blocoConceitos(D.base.filter(baseVale))}

          <div class="acoes">
            <button class="btn btn-primario" id="imp">Salvar ou imprimir</button>
            <button class="btn btn-claro" id="rev">Revisar respostas</button>
            <button class="btn btn-linha" id="novo">Começar outra análise</button>
          </div>
          ${botaoVoltar()}
          <div class="acoes lg2-proximo"><a class="btn btn-primario" style="text-decoration:none;text-align:center;box-sizing:border-box" href="/lg2/turma-a/m05/index.html">Ir para o Módulo 5</a></div>
          ${rodape()}
        </main>
      </div>`);
    ligar(p);
    p.querySelector("#v").onclick = () => { S.hist.pop(); const a = S.hist.pop(); salvar(); ir(telaPergunta, a); };
    p.querySelector("#imp").onclick = () => { p.querySelectorAll("details.respostas").forEach((d) => (d.open = true)); window.print(); };
    p.querySelector("#rev").onclick = () => { S.hist = []; salvar(); ir(telaPergunta, Motor.proxima(M, {}, null)); };
    p.querySelector("#novo").onclick = () => { if (confirm("Começar uma nova análise? As respostas atuais serão apagadas.")) { S = novo(); salvar(); ir(telaPergunta, Motor.proxima(M, {}, null)); } };
    return p;
  }

  /* números fora do comum que a pessoa confirmou: o aviso continua no resumo */
  function avisosNumeros() {
    const lista = ["M4.P19", "M4.P20", "M4.P21"].map((c) => {
      const v = Motor.valor(S.R, c), n = lerNumero(v);
      return v && v !== Motor.NS && !isNaN(n) ? avisoNumero(c, n) : "";
    }).filter(Boolean);
    if (!lista.length) return "";
    return `<div class="bloco b-alerta avisos-num"><b>Confira estes números</b>${lista.map((t) => `<p>${esc(t)}</p>${/Módulo 1/.test(t) ? `<p class="selo-m"><b>Veio do Módulo 1</b></p>` : ""}`).join("")}</div>`;
  }

  /* resposta como aparece no resumo: nome da opção arrumado e, no "Outro", o texto escrito */
  function mostrar(cod) {
    const r = S.R[cod], v = Motor.valor(S.R, cod);
    if (r && r.estado === "opcao" && r.detalhe) return `${rotulo(v)}: ${r.detalhe}`;
    return r && (r.estado === "opcao" || r.estado === "opcoes") ? rotulo(v) : v;
  }
  /* motivo marcado na pergunta 11 (para a ajuda da proposta de valor); no "Outro", o que a pessoa escreveu */
  function motivoP11() {
    const r = S.R["M4.P11"], v = Motor.valor(S.R, "M4.P11");
    if (v === "Outro") return (r && r.detalhe) || "";
    return v && v !== Motor.NS ? v : "";
  }
  /* cartão da proposta de valor no resultado (as três respostas M4.PV1–M4.PV3 e a frase da pergunta 12) */
  function propostaValor() {
    const linhas = ["M4.PV1", "M4.PV2", "M4.PV3"].map((c) => { const v = Motor.valor(S.R, c); return v && v !== Motor.NS ? `<div class="pv-item"><b>${esc(T(M.porCodigo[c].pergunta))}</b><p>${txt(v)}</p></div>` : ""; }).filter(Boolean);
    const frase = Motor.valor(S.R, "M4.P12");
    if (!linhas.length && !frase) return "";
    return `<section class="cartao proposta-valor"><h3>Sua proposta de valor</h3>${linhas.join("")}${frase ? `<div class="pv-item"><b>A sua frase</b><p>${txt(frase)}</p></div>` : ""}</section>`;
  }

  /* caixa "O que entendemos até aqui": frases montadas com as respostas deste e dos outros módulos */
  /* texto corrido: as frases de cada assunto viram um parágrafo (1 a 3 parágrafos curtos, sem lista) */
  const emParagrafos = (fr, ...cortes) => [0, ...cortes].map((c, i, a) => fr.slice(c, i + 1 < a.length ? a[i + 1] : fr.length).join(" ")).filter(Boolean);
  function entendemos(nNaoSei) {
    const val = (c) => { const v = Motor.valor(S.R, c); return v && v !== Motor.NS ? String(v).trim() : ""; };
    const aspas = (s) => `“${String(s).replace(/[.\s]+$/, "")}”`;
    const frases = [];
    const ideia = val("M4.P01"), tipo = val("M4.P02");
    const TIPO = { "Produto": "um produto (você faz o que vende)", "Mercadoria": "uma mercadoria (você compra pronto para revender)",
      "Serviço": "um serviço (o cliente paga pelo seu trabalho)", "Mercadoria+ Serviço": "uma mercadoria junto com um serviço",
      "Produto+ Serviço": "um produto junto com um serviço", "Mercadoria+Produto": "mercadorias para revender junto com produtos que você faz" };
    if (ideia) frases.push(`Você quer oferecer ${aspas(ideia)}${tipo ? `, que é ${TIPO[tipo] || tipo.toLowerCase()}` : ""}.`);
    else if (tipo) frases.push(`O que você oferece é ${TIPO[tipo] || tipo.toLowerCase()}.`);
    const est = opcaoDe(lerOutro(M1, "M1.P01"));
    if (/cabeça/i.test(est)) frases.push("Como a ideia ainda não saiu do papel, este teste vai ser o seu primeiro contato com clientes de verdade.");
    else if (/testar|amostra/i.test(est)) frases.push("Você já fez um pouco para testar; agora o teste ajuda a ver se as pessoas pagam de verdade.");
    else if (/vend/i.test(est)) frases.push("Você já vende, então o teste serve para confirmar ou ajustar o que já faz.");
    const cli = val("M4.P08"), dor = val("M4.P09");
    if (cli && dor) frases.push(`Seu primeiro cliente é ${aspas(cli)}, e o problema que você ajuda a resolver é ${aspas(dor)}.`);
    else if (cli) frases.push(`Seu primeiro cliente é ${aspas(cli)}.`);
    else if (dor) frases.push(`O problema que você ajuda a resolver é ${aspas(dor)}.`);
    const c1 = frases.length;   // 1º parágrafo: o que oferece, em que ponto está e para quem
    const prop = val("M4.P12"), ganho = val("M4.P10"), motivo = motivoP11();
    const pv1 = val("M4.PV1"), pv2 = val("M4.PV2"), pv3 = val("M4.PV3");
    const pv = [pv1 && pv1 !== dor && `resolve ${aspas(pv1)}`, pv2 && `o cliente escolheria você porque ${aspas(pv2)}`, pv3 && `o principal benefício é ${aspas(pv3)}`].filter(Boolean);
    const pvTxt = pv.length ? (pv.length > 1 ? pv.slice(0, -1).join(", ") + " e " + pv[pv.length - 1] : pv[0]) : "";
    if (prop) frases.push(`Sua proposta de valor, por enquanto: ${aspas(prop)}.${pvTxt ? ` Ela ${pvTxt}.` : ""}`);
    else if (pvTxt) frases.push(`Na sua proposta de valor, o que você oferece ${pvTxt}.`);
    else if (ganho || motivo) frases.push([ganho && `O cliente ganha ${aspas(ganho)}`, motivo && `e escolheria você por ${S.R["M4.P11"].detalhe ? aspas(motivo) : motivo.toLowerCase()}`].filter(Boolean).join(" ") + ".");
    const teste = val("M4.P14"), dias = val("M4.P20"), gasto = val("M4.P21"), crit = val("M4.P19");
    if (teste) {
      let f = `No primeiro teste, você vai ${teste.charAt(0).toLowerCase() + teste.slice(1)}`;
      if (dias) f += `, durante ${dias} dias`;
      if (gasto) f += /^0+([,.]0+)?$/.test(gasto) ? ", sem gastar dinheiro" : `, gastando no máximo R$ ${gasto}`;
      const nCrit = lerNumero(crit), unid = UNID_P17[val("M4.P17")];
      f += !crit ? "." : isNaN(nCrit) ? `, e vai considerar que deu certo com ${aspas(crit)}.`
        : `, e vai considerar que deu certo se chegar a ${crit}${unid ? " " + unid : ""}.`;
      frases.push(f);
    }
    const c2 = frases.length;   // 2º: proposta de valor e o teste; 3º: o que ficou em aberto
    if (nNaoSei) frases.push(`Ainda ${nNaoSei === 1 ? "ficou 1 ponto" : `ficaram ${nNaoSei} pontos`} em aberto (marcados com “Não sei”); vale voltar neles antes de testar.`);
    if (!frases.length) frases.push("Ainda faltam respostas para montarmos o resumo do seu negócio.");
    return `<section class="entendemos"><h2>O que entendemos até aqui</h2>${emParagrafos(frases, c1, c2).map((f) => `<p>${esc(f)}</p>`).join("")}</section>`;
  }

  function rodape() {
    return `<footer class="rodape">
      <p class="credito">Conteúdo produzido por estudantes do Laboratório de Gestão II · FACC/UFJF · versão ${esc(D.modulo.versao)} · fontes consultadas em ${esc(D.modulo.data)}</p>
      <div class="logos">
        <img src="assets/logo_facc.png" alt="FACC">
        <img src="assets/logo_ufjf.svg" alt="UFJF">
        <img src="assets/logo_mg.svg" alt="Governo de Minas Gerais">
      </div>
    </footer>`;
  }

  ir(telaCapa);
})();
