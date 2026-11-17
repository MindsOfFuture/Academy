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
  /* versão 6 (16/11/2026): "Não sei" não é mais resposta. As respostas antigas "Não sei" viram "sem resposta"
       (as outras ficam); a pergunta reabre com a ajuda "Como descobrir" à vista (lista em S.reabrir).
     Pergunta já respondida antes (em outro módulo ou aqui mesmo) não ganha tela de novo: a resposta é usada
     e aparece num cartão "Veio do Módulo N · Trocar" (S.forcar = perguntas que a pessoa pediu para trocar). */
  const VERSAO = 6;
  const MSG_NS_TEXTO = "Use a ajuda acima e escreva a sua resposta para continuar.";
  const MSG_NS_ESCOLHA = "Use a ajuda acima e escolha uma opção para continuar.";
  const MSG_VAZIO_NS = "Escreva a sua resposta para continuar. Se não souber, toque em “Não sei” para ver como descobrir.";
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
  const ALERTA_REPETIDO = ["M4.R01", "M4.R02", "M4.R04", "M4.R05", "M4.R07"];   // R01 = dica da pergunta 1; R02 = aviso de não avançar sem a frase; R04/R05/R07: lote 16/11, orientação geral (vai para a dica)
  /* lote 16/11 (item G): alerta que aparecia para qualquer resposta vira parte da dica, mostrada antes de responder */
  const REGRA_NA_DICA = { "M4.P03": ["M4.R07"], "M4.P06": ["M4.R04"] };
  const cuidado = (t) => (vazio(t) ? "" : `<p class="ajuda dica-cuidado">${txt(T(t))}</p>`);
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
      if (!(s.v >= 6)) {
        const reabrir = [];
        Object.keys(s.R).forEach((k) => {
          const r = s.R[k];
          if (!r) return;
          if (r.estado === "naosei" || (r.estado === "opcao" && r.opcao === Motor.NS)) { delete s.R[k]; reabrir.push(k); }
          else if (r.estado === "opcoes" && Array.isArray(r.opcoes) && r.opcoes.includes(Motor.NS)) {
            r.opcoes = r.opcoes.filter((o) => o !== Motor.NS);
            if (!r.opcoes.length) { delete s.R[k]; reabrir.push(k); }
          }
        });
        if (reabrir.length) s.reabrir = reabrir;
      }
      const precisaSalvar = s.v !== VERSAO;
      s.v = VERSAO;
      if (precisaSalvar) { try { localStorage.setItem(CHAVE, JSON.stringify(s)); } catch (e) {} }
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
      ? `Você marcou mais de um tipo de cliente (${h.grupos.join(" e ")}). Para o primeiro teste, escolha o grupo principal para começar. Se preferir, pode seguir assim.`
      : `O público que veio da Etapa ${h.de} ainda está amplo. Para o primeiro teste, escolha o grupo principal para começar. Se preferir, pode seguir assim.`;
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
    if (cod === "M4.P12") { const r = rascunhoP12(); return r ? { valor: r, nota: "Rascunho pronto" } : null; }
    const d = VEIO_DE_DENTRO[cod]; if (!d) return null;
    const v = Motor.valor(S.R, d[0]);
    return v && v !== Motor.NS ? { valor: v, nota: d[1] } : null;
  }

  /* lote 17/11 (auditoria): a pergunta 12 vem com um rascunho montado das respostas anteriores, editável.
     problema = P09 (ou PV1), ganho = P10 (ou PV3), motivo = PV2 (= P11 ou M3.P21). Sem nenhuma parte: campo vazio. */
  const semPonto = (s) => String(s ?? "").trim().replace(/[.!;\s]+$/, "");
  const minuscula = (s) => (/^[A-ZÀ-Ú][a-zà-ú]/.test(s) ? s.charAt(0).toLowerCase() + s.slice(1) : s);
  function rascunhoP12() {
    const val = (c) => { const v = Motor.valor(S.R, c); return v && v !== Motor.NS ? semPonto(v) : ""; };
    const oferta = val("M4.P01"), cliente = val("M4.P08"), prob = val("M4.P09") || val("M4.PV1"), ganho = val("M4.P10") || val("M4.PV3");
    const motivo = semPonto(val("M4.PV2") || textoDe(lerOutro(M3, "M3.P21")) || motivoP11());
    if (!prob && !ganho && !motivo) return "";
    const fr = [];
    if (oferta) fr.push(`Ofereço ${minuscula(oferta)}${cliente ? ` para ${minuscula(cliente)}` : ""}.`);
    else if (cliente) fr.push(`Para ${minuscula(cliente)}.`);
    if (prob) fr.push(`Resolvo este problema: ${minuscula(prob)}.`);
    if (ganho) fr.push(`O cliente ganha: ${minuscula(ganho)}.`);
    if (motivo) fr.push(`Por que comprar de mim: ${minuscula(motivo)}.`);
    return fr.join(" ");
  }
  /* lote 17/11 (auditoria): a pergunta 9 e a 10 lembram, discretas, o que a pessoa disse na Etapa 3 sobre um assunto
     parecido, para ela ver que agora a pergunta é outra (não está repetindo). Só aparece se a Etapa 3 tem a resposta. */
  const REF_ETAPA3 = {
    "M4.P09": ["M3.P11", "Na Etapa 3 você disse que o problema do cliente é", "Agora pense em quando ele sente isso no dia a dia."],
    "M4.P10": ["M3.P21", "Na Etapa 3 você disse que o seu diferencial é", "Agora pense no que muda na vida do cliente."],
  };
  function refEtapa3(cod, atual) {
    const r = REF_ETAPA3[cod]; if (!r) return "";
    const v = textoDe(lerOutro(M3, r[0]));
    if (!v || v === String(atual || "").trim()) return "";
    return `<p class="ref-etapa" id="ref-etapa">${esc(r[1])}: “${esc(semPonto(v))}”. ${esc(r[2])}</p>`;
  }

  /* ===== pergunta repetida na jornada (lote 16/11, item F) =====
     Resposta já dada antes = a tela não aparece: a resposta é gravada no formato de sempre (com `de` = módulo de
     origem, ou `igual` = pergunta deste módulo) e mostrada num cartão pequeno com "Trocar".
       M4.P01 ← M1.P03 / M3.P01 · M4.P02 ← M1.P03A / M5.P01 · M4.P08 ← M3.P10 / M2.P02 (só se o público não for amplo)
       M4.P09 ← M3.P11 · M4.PV1 ← M4.P09 · M4.PV3 ← M4.P10 · M4.PV2 ← M3.P21 (e a M4.P11, escolha do mesmo
       assunto, fica sem tela quando o Módulo 3 já respondeu) */
  const ROTULO_REUSO = { "M4.P01": "O que você vai oferecer", "M4.P02": "Tipo do que você oferece", "M4.P08": "Seu primeiro cliente",
    "M4.P09": "Problema que você resolve", "M4.PV1": "Problema que você resolve", "M4.PV2": "Por que o cliente escolheria você",
    "M4.PV3": "O que o cliente ganha", "M4.P10": "O que o cliente ganha" };
  const INTERNO = { "M4.PV1": "M4.P09", "M4.PV3": "M4.P10" };
  function reuso(cod) {
    if (INTERNO[cod]) {
      const v = Motor.valor(S.R, INTERNO[cod]);
      return v && v !== Motor.NS ? { valor: v, igual: INTERNO[cod] } : null;
    }
    if (cod === "M4.PV2" || cod === "M4.P11") {
      const a = textoDe(lerOutro(M3, "M3.P21"));
      if (a) return cod === "M4.PV2" ? { valor: a, de: 3 } : { pulo: true, de: 3 };
      if (cod === "M4.PV2") {
        const anterior = S.R["M4.P11"], motivo = anterior && anterior.estado === "opcao" && anterior.opcao === "Outro" ? anterior.detalhe : Motor.valor(S.R, "M4.P11");
        if (motivo && motivo !== Motor.NS) return { valor: motivo, igual: "M4.P11" };
      }
      return null;
    }
    if (!["M4.P01", "M4.P02", "M4.P08", "M4.P09"].includes(cod)) return null;
    const h = herdado(cod);
    if (!h || h.amplo) return null;   // público amplo: a tela aparece, com o aviso para escolher o grupo principal
    if (h.opcao && !Motor.versao(M, S.R, M.porCodigo[cod]).opcoesLista.includes(h.opcao)) return null;
    return h.opcao ? { opcao: h.opcao, de: h.de } : { valor: h.valor, de: h.de };
  }
  const ehAuto = (r) => !!(r && (r.de || r.igual));
  /* aplica o reaproveitamento na pergunta `cod`: true = a tela não aparece */
  function aplicarReuso(cod) {
    if ((S.forcar || []).includes(cod)) return false;
    const r = S.R[cod];
    if (r && !ehAuto(r)) return false;   // resposta escrita aqui mesmo: a tela segue normal (Revisar)
    const x = reuso(cod);
    if (!x) return false;
    if (x.pulo) return true;
    S.R[cod] = x.opcao ? { estado: "opcao", opcao: x.opcao, de: x.de } : Object.assign({ estado: "valor", valor: x.valor }, x.de ? { de: x.de } : { igual: x.igual });
    return true;
  }
  /* próxima pergunta com tela; as puladas ficam em `pulados` para o cartão da tela seguinte */
  let pulados = [];
  function seguinte(cod) {
    let c = Motor.proxima(M, S.R, cod);
    while (c !== "RESULTADO" && aplicarReuso(c)) { if (S.R[c]) pulados.push(c); c = Motor.proxima(M, S.R, c); }
    salvar();
    return c;
  }
  /* cartão "Já sabemos": resposta reaproveitada + de onde veio + Trocar */
  function itemReuso(c) {
    const r = S.R[c]; if (!r) return "";
    const de = r.de ? `Veio da Etapa ${r.de}` : "Veio da sua resposta anterior";
    return `<li><span class="ru-rot">${esc(ROTULO_REUSO[c] || "")}</span><span class="ru-val">${esc(rotulo(Motor.valor(S.R, c)))}</span><span class="ru-de">${de} · <button type="button" class="ru-trocar" data-trocar="${c}">Trocar</button></span></li>`;
  }
  function cartaoReuso(cods, titulo) {
    const itens = [...new Set(cods)].map(itemReuso).filter(Boolean);
    return itens.length ? `<section class="reuso" aria-label="${esc(titulo)}"><b class="ru-tit">${esc(titulo)}</b><ul>${itens.join("")}</ul></section>` : "";
  }
  function ligarTrocar(p) {
    p.querySelectorAll("[data-trocar]").forEach((b) => (b.onclick = () => {
      const c = b.dataset.trocar;
      S.forcar = [...new Set((S.forcar || []).concat(c))];
      S.hist = S.hist.filter((x) => x !== "RESULTADO");
      salvar(); ir(telaPergunta, c);
    }));
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
      ? `Na Etapa 1 você disse que, por enquanto, não tem dinheiro para usar no negócio sem faltar para as contas da casa. Esse teste custa R$ ${fmt(n)}. Dá para fazer uma versão sem gastar?`
      : `Na Etapa 1 você disse que pode usar até R$ ${fmt(TETO_M1[op])} sem faltar para as contas da casa. Esse teste custa R$ ${fmt(n)}. Dá para fazer uma versão menor?`;
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

  const selo = (n) => `<p class="selo-m"><b>Veio da Etapa ${n}</b> · Confira e ajuste se quiser.</p>`;
  function salvar() { try { localStorage.setItem(CHAVE, JSON.stringify(S)); } catch {} }

  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const link = (u, t) => /^https?:/.test(u || "") ? `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(t || u)}</a>` : esc(t || u);
  const txt = (s) => esc(String(s ?? "").trim()).replace(/\n/g, "<br>");   // quebras de linha da célula
  function el(html) { const d = document.createElement("div"); d.innerHTML = html.trim(); return d.firstElementChild; }
  function ir(f, a) {
    tela.innerHTML = ""; tela.appendChild(f(a)); window.scrollTo(0, 0);
    /* lote 17/11 (item D): na pergunta nova, o leitor de tela começa pelo enunciado */
    const q = tela.querySelector(".cartao-q .q");
    if (q) q.focus({ preventScroll: true });
  }

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
  function blocoConceitos(lista, dentroDaDica) {
    if (!lista.length) return "";
    const itens = lista.map(adapt).map((b) => `
      <div class="conceito"><b>${esc(b.conceito)}</b><p>${esc(b.definicao)}</p>
      ${vazio(b.exemplo) ? "" : `<p class="ex">${esc(b.exemplo)}</p>`}
      <span class="fonte">Fonte: ${link(b.link, b.fonte)}${vazio(b.data) ? "" : ` · consultado em ${esc(b.data)}`}</span></div>`).join("");
    /* dentro de "Ver dica" os termos não abrem outra caixa */
    if (dentroDaDica) return `<div class="termos"><b class="termos-tit">Entenda os termos</b>${itens}</div>`;
    return `<details class="saiba"><summary>Entenda os termos</summary>${itens}
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
    /* botão "Copiar" da caixa "Como descobrir" */
    p.querySelectorAll("[data-copiar]").forEach((b) => {
      const alvo = b.parentNode.querySelector("[data-prompt]");
      b.onclick = () => copiar(alvo.textContent, b, alvo);
    });
  }
  /* copiar com reserva: área de transferência → execCommand → deixa o texto selecionado (como nos Módulos 1 e 10) */
  function copiar(t, b, alvo) {
    const rotulo = b.dataset.rotulo || "Copiar";
    const pronto = () => { b.textContent = "Copiado!"; setTimeout(() => { if (document.contains(b)) b.textContent = rotulo; }, 2000); };
    const reserva = () => {
      const ta = document.createElement("textarea");
      ta.value = t; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.top = "0"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      let foi = false;
      try { foi = document.execCommand("copy"); } catch (e) {}
      ta.remove();
      if (foi) return pronto();
      try { const r = document.createRange(); r.selectNodeContents(alvo); const s = getSelection(); s.removeAllRanges(); s.addRange(r); } catch (e) {}
      b.textContent = "Toque e segure o texto para copiar";
    };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(t).then(pronto, reserva);
    else reserva();
  }
  /* ---------- "Não sei": caixa "Como descobrir" (2 passos + pedido pronto para a IA, com Copiar) ----------
     Os textos ficam nos dados de cada pergunta (comoDescobrir, promptIA; por tipo em por_tipo). Nas fichas técnicas
     (perguntas 3 e 6) o pedido é o roteiro da ficha (prompt_ia). A resposta salva não muda. */
  function caixaComo(q) {
    if (!q.comoDescobrir || !q.comoDescobrir.length) return "";
    const prompt = q.promptIA || q.prompt_ia || "";
    const termo = q.conceito_naosei && adapt(D.base.find((x) => x.codigo === q.conceito_naosei));
    return `<section class="como-descobrir" role="status">
      <b class="como-tit">Como descobrir</b>
      <ol>${q.comoDescobrir.map((x) => `<li>${esc(T(x))}</li>`).join("")}</ol>
      ${termo ? `<details class="dica-mais como-termo"><summary>O que é: ${esc(termo.conceito)}</summary><p class="ajuda">${txt(termo.definicao)}</p>${vazio(termo.exemplo) ? "" : `<p class="ex">${esc(termo.exemplo)}</p>`}</details>` : ""}
      ${prompt ? `<div class="pedir-ia">
        <b>Peça ajuda à IA</b>
        <p class="como-nota">Copie, cole numa IA de sua preferência e troque o que está entre colchetes.</p>
        <p class="prompt" data-prompt>${esc(prompt)}</p>
        <button class="btn-alt copiar" type="button" data-copiar>Copiar</button>
      </div>` : ""}
    </section>`;
  }
  /* "Não sei" (lote 16/11): a caixa "Como descobrir" + os textos do grupo para quem não sabe (alerta, regra,
     retorno condicional) + o pedido de resposta. Nada é gravado. */
  function ajudaNaoSei(q, cod, tipo) {
    const ns = tipo === "texto" || tipo === "numero" ? { estado: "naosei" } : { estado: "opcao", opcao: Motor.NS };
    const regras = Motor.regrasAgora(M, Object.assign({}, S.R, { [cod]: ns }), cod);
    const se = Motor.retornoSe(q, Motor.NS);
    return `<div class="ajuda-ns" id="ajuda-ns">
      ${vazio(q.alerta_naosei) ? "" : `<div class="bloco b-alerta bloqueio"><b>Atenção</b>${txt(T(q.alerta_naosei))}</div>`}
      ${regras.map((r) => `<p class="r-texto ns-regra">${txt(T(r.texto))}</p>`).join("")}
      ${vazio(se) ? "" : `<div class="bloco b-proximo">${txt(se)}</div>`}
      ${caixaComo(q)}
      <p class="nota-ns" id="nota-ns">${esc(tipo === "texto" || tipo === "numero" ? MSG_NS_TEXTO : MSG_NS_ESCOLHA)}</p>
    </div>`;
  }

  /* ===== ficha técnica (pergunta 3, produto e alimento): conta do custo por unidade, ao vivo =====
     custo por unidade = custo da receita ÷ unidades boas (rende − perdidas) + embalagem de uma unidade */
  const MSG_FICHA = "Confira a conta do custo por unidade: use só números, e as unidades perdidas precisam ser menos que as que rende.";
  const fmtR = (n) => "R$ " + Number(n).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtN = (n) => Number(n).toLocaleString("pt-BR", { maximumFractionDigits: 2 });
  const red2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
  function fichaVale(cod) {
    if (cod !== "M4.P03" || tipoEx() !== "Produto") return "";
    return ehAlimento() ? "Alimento" : "Produto";
  }
  const FICHA_ROT = {
    Alimento: { tit: "Calcular o custo de cada unidade (opcional)", rec: "Quanto custaram os ingredientes da receita", ren: "Quantas unidades a receita rende", per: "Quantas se perdem (quebram, queimam)", emb: "Embalagem de cada unidade", nome: "receita" },
    Produto: { tit: "Calcular o custo de cada unidade (opcional)", rec: "Quanto custa o material de uma leva", ren: "Quantas unidades saem dessa leva", per: "Quantas se perdem ou saem com defeito", emb: "Embalagem de cada unidade", nome: "material" },
  };
  function fichaHtml(kind, resp) {
    const f = (resp && resp.ficha) || {}, L = FICHA_ROT[kind];
    const v = (k, din) => (f[k] === undefined || f[k] === "" ? "" : din ? fmtN2(f[k]) : fmtN(f[k]));
    const lin = (id, rot, din, val) => `<label class="fc-linha"><span>${esc(rot)}</span><span class="fc-campo">${din ? `<span class="pre">R$</span>` : ""}<input class="campo" id="${id}" inputmode="decimal" data-falar="nao" value="${esc(val)}" placeholder="${din ? "0,00" : "0"}"></span></label>`;
    return `<details class="calc-ficha"${resp && resp.ficha ? " open" : ""}><summary>${esc(L.tit)}</summary>
      <p class="fc-dica">${kind === "Alimento" ? "Ex.: R$ 30,00 de ingredientes, rende 12, 2 quebram, saquinho de R$ 0,50." : "Ex.: R$ 40,00 de material, saem 10 peças, 1 com defeito, embalagem de R$ 1,00."}</p>
      ${lin("f-rec", L.rec, true, v("receita", true))}
      ${lin("f-ren", L.ren, false, v("rende"))}
      ${lin("f-per", L.per, false, v("perda"))}
      ${lin("f-emb", L.emb, true, v("embalagem", true))}
      <div class="fc-res" id="f-res" aria-live="polite"></div>
    </details>`;
  }
  const fmtN2 = (n) => Number(n).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  /* conta: devolve { custo, linha } ou { erro } ou null (faltam o custo e quanto rende) */
  function contaFicha(f, kind) {
    const L = FICHA_ROT[kind] || FICHA_ROT.Produto;
    if (f.receita === undefined || f.rende === undefined) return null;
    const perda = f.perda || 0, emb = f.embalagem || 0, boas = f.rende - perda;
    if (!(boas > 0)) return { erro: "As unidades perdidas precisam ser menos que as que a receita rende." };
    const parte = red2(f.receita / boas), custo = red2(parte + emb);
    let linha = `${fmtR(f.receita)} (${L.nome}) ÷ ${fmtN(boas)} unidades${perda ? ` boas (${fmtN(f.rende)} que rende − ${fmtN(perda)} perdidas)` : ""} = ${fmtR(parte)} por unidade`;
    linha += emb ? `; ${fmtR(parte)} + ${fmtR(emb)} (embalagem) = ${fmtR(custo)} por unidade.` : ".";
    return { custo, linha };
  }
  function fichaResHtml(f, kind) {
    const c = contaFicha(f, kind);
    if (!c) return `<p class="fc-falta">Preencha o custo e quanto rende para ver a conta.</p>`;
    if (c.erro) return `<p class="fc-falta">${esc(c.erro)}</p>`;
    return `<p class="fc-total">Custo de cada unidade: <b>${fmtR(c.custo)}</b></p><p class="como-calc">Como calculamos: ${esc(c.linha)}</p>`;
  }
  /* lê os campos da conta: undefined = nada preenchido; null = número inválido */
  function lerFicha(p) {
    const ids = { receita: "#f-rec", rende: "#f-ren", perda: "#f-per", embalagem: "#f-emb" }, f = {};
    let algum = false, ruim = false;
    Object.entries(ids).forEach(([k, sel]) => {
      const i = p.querySelector(sel); const t = i ? i.value.trim() : "";
      if (!t) return;
      algum = true;
      const n = lerNumero(t);
      if (isNaN(n) || n < 0) ruim = true; else f[k] = n;
    });
    if (!algum) return undefined;
    if (ruim) return null;
    const c = contaFicha(f, fichaVale("M4.P03"));
    if (c && c.erro) return null;
    if (c) f.custo_unidade = c.custo;
    return f;
  }
  function ligarFicha(p, kind) {
    const res = p.querySelector("#f-res");
    const atualizar = () => { const f = lerFicha(p); res.innerHTML = f === null ? `<p class="fc-falta">${esc(MSG_FICHA)}</p>` : fichaResHtml(f || {}, kind); };
    p.querySelectorAll(".calc-ficha input").forEach((i) => {
      i.addEventListener("input", atualizar);
      /* dinheiro no padrão brasileiro dentro do campo: 30 → 30,00 */
      if (i.id === "f-rec" || i.id === "f-emb") i.addEventListener("blur", () => { const n = lerNumero(i.value); if (i.value.trim() && !isNaN(n) && n >= 0) i.value = fmtN2(n); });
    });
    atualizar();
  }

  /* "Ver dica" fechada entre a pergunta e as respostas: ajuda, avisos, conceitos e termos da pergunta */
  function verDica(partes) {
    const corpo = partes.filter(Boolean).join("");
    return corpo ? `<details class="dica-toggle"><summary>Ver dica</summary>${corpo}</details>` : "";
  }

  /* ================= peças do layout (modelo do Módulo 5) ================= */
  function topo(trilha) {
    return `<div class="barra-topo">
      <img class="logo-mini" src="assets/minds.svg" alt="Minds of the Future">
      <nav class="trilha" aria-label="Você está em"><button class="trilha-link" data-inicio>Início</button><span>/</span><span>Etapa ${esc(D.modulo.numero)}</span>${trilha ? `<span>/</span><span>${esc(trilha)}</span>` : ""}</nav>
    </div>`;
  }
  /* faixa roxa: o.kicker e o.titulo vêm do que a tela já mostrava; o.progresso (0-100) desenha a barra amarela */
  function heroi(o) {
    /* versão leve: nas perguntas, faixa compacta (só o passo e a barra de progresso, sem título repetido nem ilustração) */
    if (o.compacta) return `<section class="heroi heroi-compacta">
      <div class="heroi-txt"><div class="kicker passo">${esc(o.kicker)}</div></div>
      <div class="heroi-prog"><div class="barra" role="progressbar" aria-label="Progresso" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${o.progresso}"><div class="barra-fill" style="width:${o.progresso}%"></div></div></div>
    </section>`;
    const tag = o.h1 ? "h1" : "h2";
    return `<section class="heroi ${o.grande ? "heroi-grande" : ""}">
      <div class="heroi-topo">
        <div class="heroi-txt">
          <div class="kicker ${o.kickerClasse || ""}">${esc(o.kicker || "Etapa " + D.modulo.numero)}</div>
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
    /* versão leve: a dica fica dentro de "Ver dica" (fechada), sem ilustração */
    return `<div class="dica dica-in"><p class="ajuda">${antes || ""}${txt(vista)}</p>${
      mais ? `<details class="dica-mais dica-resto"><summary>Ver mais</summary><p class="ajuda">${txt(mais)}</p></details>` : ""}${
      exemplo ? `<details class="dica-mais"><summary>${esc(exemplo.titulo)}</summary><p class="ajuda">${txt(exemplo.texto)}</p></details>` : ""}</div>`;
  }
  const botaoVoltar = () => `<div class="acoes acoes-voltar"><button class="btn btn-linha voltar" id="v">Voltar</button></div>`;
  /* "‹ Voltar" no topo do cartão da pergunta, à esquerda (mesmo lugar em todos os módulos); o nome acessível é "Voltar" */
  const voltarTopo = () => `<button class="voltar-topo" id="v"><span aria-hidden="true">‹</span> Voltar</button>`;
  /* nome da opção na tela: "Mercadoria+ Serviço" (como está gravado) aparece "Mercadoria + Serviço" */
  const rotulo = (op) => String(op ?? "").replace(/\s*\+\s*/g, " + ");
  /* opção com bolinha; sem espaços entre as tags para o nome do botão continuar igual ao texto da opção */
  const opcaoHtml = (op, sel, attrs, sub) => `<button type="button" class="opcao ${sel ? "sel" : ""}" data-op="${esc(op)}" aria-pressed="${sel ? "true" : "false"}"${attrs || ""}><span class="radio" aria-hidden="true"></span><span class="op-txt"><b>${esc(rotulo(op))}</b>${sub ? `<small class="op-sub">${esc(sub)}</small>` : ""}</span></button>`;
  function concluido() {
    return `<section class="concluido"><div class="conc-topo"><span class="check" aria-hidden="true"></span><div><h2>Você concluiu a Etapa ${esc(D.modulo.numero)}</h2><p>Confira abaixo o resumo das suas respostas.</p></div></div></section>`;
  }
  /* liga os botões comuns a todas as telas */
  function ligar(p) { p.querySelectorAll("[data-inicio]").forEach((b) => { b.onclick = () => ir(telaCapa); }); }

  /* ================= capa ================= */
  function telaCapa() {
    const iniciado = S.hist.length > 0;
    const p = el(`
      <div class="pag">
        ${topo("")}
        ${heroi({ grande: true, h1: true, titulo: D.modulo.nome, texto: D.leve.frase, img: "hero-inicio.webp" })}
        <main class="corpo">
          <details class="como-funciona cartao"><summary>Como funciona</summary>
            <h3>Para quem é</h3><p>${esc(D.mapa.usuario)}</p>
            <h3>O que ter em mãos</h3><p>${esc(D.mapa.ter_em_maos)}</p>
            <h3>O que você recebe no final</h3><p>${esc(D.mapa.entrega)}</p>
            <button class="btn btn-linha" id="limites">O que esta etapa não faz</button>
          </details>
          <p class="tempo">Esta etapa leva cerca de ${esc(D.leve.minutos)} minutos</p>
          <div class="acoes">
            <button class="btn btn-primario seta" id="ir">${iniciado ? "Continuar de onde parei" : "Começar"}</button>
            ${iniciado ? `<button class="btn btn-claro" id="zerar">Recomeçar do zero</button>` : ""}
          </div>
          ${rodape(true)}
        </main>
      </div>`);
    ligar(p);
    p.querySelector("#ir").onclick = () => {
      const atual = S.hist[S.hist.length - 1];
      if (atual === "RESULTADO") ir(telaResultado);
      else ir(telaPergunta, atual || seguinte(null));
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
        ${heroi({ titulo: "Limites da etapa" })}
        <main class="corpo">
          <div class="cartao"><h3>O que a etapa não faz</h3><p>${esc(D.mapa.nao_faz)}</p></div>
          <div class="cartao"><h3>Que decisões ele apoia</h3><p>${esc(D.mapa.decisoes)}</p></div>
          <div class="cartao"><h3>Quando procurar um profissional</h3><p>${esc(D.mapa.encaminhamentos)}</p></div>
          <div class="aviso">${esc(D.mapa.mensagem_limite)}</div>
          ${botaoVoltar()}
          ${rodape(true)}
        </main>
      </div>`);
    ligar(p);
    p.querySelector("#v").onclick = () => ir(telaCapa);
    return p;
  }

  /* ================= pergunta ================= */
  /* lote 17/11 (item G): total estável = o caminho mais longo possível (21 perguntas; as três da proposta de
     valor, PV1–PV3, nunca ganham tela no caminho normal: reaproveitam a 9, a 11 e a 10). O número de cada pergunta
     é a sua posição nessa lista, então nunca volta e o total nunca muda; a PV usa o número da pergunta 11. */
  const ORD = {};
  M.perguntas.filter((q) => !/^M4\.PV/.test(q.codigo)).forEach((q, i) => { ORD[q.codigo] = i + 1; });
  const TOTAL = Object.keys(ORD).length;
  const ordem = (cod) => ORD[cod] || ORD["M4.P11"];
  function progresso(cod) { return Math.min(100, Math.round(((ordem(cod) - 1) / TOTAL) * 100)); }

  function telaPergunta(cod) {
    const q0 = M.porCodigo[cod], q = adapt(q0);
    if (S.hist[S.hist.length - 1] !== cod) { S.hist.push(cod); salvar(); }
    const tipo = Motor.campo(q);
    const V = Motor.versao(M, S.R, q);
    const resp = S.R[cod] || null;
    /* sem resposta própria: traz a de outro módulo, se houver */
    const her = resp ? null : (herdado(cod) || daqui(cod));
    const origem = her || (resp && (resp.de || resp.igual) ? { valor: resp.valor, opcao: resp.opcao, de: resp.de, nota: resp.igual ? "Veio da sua resposta anterior" : "" } : null);
    let marcadas = resp && resp.estado === "opcoes" ? resp.opcoes.filter((o) => V.opcoesLista.includes(o)) : [];
    let escolhida = resp && resp.estado === "opcao" && V.opcoesLista.includes(resp.opcao) ? resp.opcao
      : her && her.opcao && V.opcoesLista.includes(her.opcao) ? her.opcao : null;
    const unidade = /reais|R\$/.test(V.pergunta) ? "R$" : /dias/.test(V.pergunta) ? "dias" : "";
    const inteiro = NUMEROS[cod] && NUMEROS[cod].inteiro;

    const motivo = cod === "M4.PV2" && motivoP11();
    /* respostas reaproveitadas logo antes desta tela (cartão pequeno com "Trocar") */
    const jaSabemos = cartaoReuso(pulados, "Já sabemos pelas suas respostas anteriores");
    pulados = [];
    const ficha = fichaVale(cod);
    const p = el(`
      <div class="pag">
        ${heroi({ compacta: true, kicker: `Pergunta ${ordem(cod)} de ${TOTAL}`, progresso: progresso(cod) })}
        <main class="corpo">
          <div class="cartao-q pergunta" data-cod="${esc(cod)}">
            ${voltarTopo()}
            <h2 class="q" tabindex="-1">${esc(T(V.pergunta))}</h2>
            ${vazio(q.destaque) || !q.destaque_visivel ? "" : `<div class="bloco b-proximo destaque">${txt(q.destaque)}</div>`}
            ${motivo ? `<p class="lembra">Antes você marcou “${esc(motivo)}”. Explique com as suas palavras.</p>` : ""}
            ${verDica([
              dica(T(V.ajuda), V.variante ? "" : T(q.ajuda_mais || ""), q.ajuda_exemplo, ""),
              vazio(q.destaque) || q.destaque_visivel ? "" : `<p class="ajuda destaque-dica">${txt(T(q.destaque))}</p>`,
              cuidado(q.destaque_alerta),
              cuidado(q.alerta),
              ...(REGRA_NA_DICA[cod] || []).map((c) => cuidado((D.regras.find((r) => r.codigo === c) || {}).alerta)),
              q.conceito_destaque ? conceitoAberto(q.conceito_destaque) : "",
              q.conceitos_destaque ? conceitosJuntos(q.conceitos_destaque, V.opcoesLista) : "",
              blocoEducativo(educativoDe(cod)),
              blocoConceitos(conceitosDe(q), true),
            ])}
            ${her && her.nota ? `<p class="selo-m"><b>${esc(her.nota)}</b> · Confira e ajuste se quiser.</p>` : origem && (origem.de || origem.nota) && (origem.valor || origem.opcao) ? (origem.de ? selo(origem.de) : `<p class="selo-m"><b>${esc(origem.nota)}</b> · Confira e ajuste se quiser.</p>`) : ""}
            ${cod === "M4.P08" ? avisoAmplo(her) : ""}
            ${refEtapa3(cod, resp && resp.estado === "valor" ? resp.valor : her && her.valor)}
            ${ficha ? fichaHtml(ficha, resp) : ""}
            <div class="entrada" id="ent"></div>
            ${Motor.temNaoSei(q) ? `<div class="alt"><button class="btn-alt" id="ns">Não sei</button></div>` : ""}
            <div id="como" aria-live="polite"></div>
            <div id="retorno" aria-live="polite"></div>
          </div>
          ${jaSabemos /* lote 17/11: abaixo da pergunta, para a pergunta ficar no topo mesmo com o celular deitado */}
          <div class="acoes acoes-fixas" id="acoes"><div class="erro" id="erro" role="alert" hidden></div><button class="btn btn-primario seta" id="ok">Continuar</button></div>
          ${rodape()}
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
    /* "Outro" com campo (pergunta 11): o texto é gravado junto da opção, em detalhe */
    const oc = q.outro_campo;
    let outroBox = null;
    if (tipo === "escolha") {
      ent.classList.add("opcoes");
      V.opcoesLista.forEach((op) => {
        const b = el(opcaoHtml(op, escolhida === op, "", (q.opcoes_ex || {})[op]));
        b.onclick = () => { escolhida = op; ent.querySelectorAll(".opcao").forEach((x) => { const on = x === b; x.classList.toggle("sel", on); x.setAttribute("aria-pressed", on ? "true" : "false"); }); mostrarEscolha(); };
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
        const b = el(`<button type="button" class="opcao caixa-sel ${marcadas.includes(op) ? "sel" : ""}" data-op="${esc(op)}" aria-pressed="${marcadas.includes(op)}"><span class="radio quadrado" aria-hidden="true"></span><span class="op-txt"><b>${esc(rotulo(op))}</b>${(q.opcoes_ex || {})[op] ? `<small class="op-sub">${esc(q.opcoes_ex[op])}</small>` : ""}</span></button>`);
        b.onclick = () => {
          if (marcadas.includes(op)) marcadas = marcadas.filter((x) => x !== op);
          else marcadas = op === Motor.NS ? [op] : marcadas.filter((x) => x !== Motor.NS).concat(op);
          ent.querySelectorAll(".opcao").forEach((x) => { const on = marcadas.includes(x.dataset.op); x.classList.toggle("sel", on); x.setAttribute("aria-pressed", on ? "true" : "false"); });
          mostrarComo(marcadas.includes(Motor.NS));
          aoVivo();
        };
        ent.appendChild(b);
      });
    } else {
      const v = resp && resp.estado === "valor" ? resp.valor : (her && her.valor) || "";
      /* exemplo dentro do campo (versão leve): "Ex.: …" dos dados, pelo tipo do negócio */
      const ph = q.placeholder ? ` placeholder="${esc(T(q.placeholder))}"` : "";
      ent.appendChild(el(tipo === "numero"
        ? `<div class="linha">${unidade === "R$" ? `<span class="pre">R$</span>` : ""}<input class="campo" inputmode="${inteiro ? "numeric" : "decimal"}"${ph} aria-label="${esc(T(V.pergunta))}" value="${esc(v)}">${unidade === "dias" ? `<span class="pre">dias</span>` : ""}</div>`
        : `<textarea class="campo" rows="${cod === "M4.P12" ? Math.min(8, Math.max(3, Math.ceil(String(v).length / 34))) : 3}"${ph} aria-label="${esc(T(V.pergunta))}">${esc(v)}</textarea>`));
    }
    /* "Não sei" entre as opções: a caixa "Como descobrir" aparece ao tocar (a resposta só é gravada no Continuar) */
    const como = p.querySelector("#como");
    let nsAberto = false;
    const mostrarComo = (sim) => { nsAberto = !!sim; como.innerHTML = sim ? ajudaNaoSei(q, cod, tipo) : ""; ligarCopiar(como); };
    if (tipo === "multipla" && marcadas.includes(Motor.NS)) mostrarComo(true);
    /* "Não sei" antigo (antes do lote 16/11): a pergunta reabre sem resposta e com a ajuda à vista */
    const reaberta = !resp && (S.reabrir || []).includes(cod) && (Motor.temNaoSei(q) || V.opcoesLista.includes(Motor.NS));
    /* dica da opção marcada e campo do "Outro" (abre com o cursor só quando a pessoa toca) */
    let initEscolha = true;
    function mostrarEscolha() {
      const d = ent.querySelector("#dica-op");
      if (d) { const t = escolhida && escolhida !== Motor.NS && q.opcoes_explica[escolhida]; d.textContent = t || ""; d.hidden = !t; }
      mostrarComo(escolhida === Motor.NS);
      if (outroBox) {
        const abre = escolhida === oc.opcao, era = outroBox.hidden;
        outroBox.hidden = !abre;
        if (abre && era && !initEscolha) outroBox.querySelector("textarea").focus();
      }
      if (!initEscolha) aoVivo();
    }
    if (tipo === "escolha") mostrarEscolha();
    initEscolha = false;
    if (reaberta) mostrarComo(true);
    /* "Não sei" (botão): mostra a ajuda e não grava nada; o Continuar só anda com uma resposta de verdade */
    const ns = p.querySelector("#ns");
    if (ns) ns.onclick = () => { p.querySelector("#erro").hidden = true; mostrarComo(true); como.scrollIntoView({ behavior: "smooth", block: "start" }); };
    if (ficha) ligarFicha(p, ficha);

    /* aviso de número fora do comum: aparece uma vez; tocar de novo com o mesmo valor segue */
    let avisoVisto = null;
    const okBtn = p.querySelector("#ok");
    ent.addEventListener("input", () => { if (avisoVisto !== null) { avisoVisto = null; p.querySelector("#erro").hidden = true; } nomeOk(); });
    /* lote 17/11 (item A): o retorno aparece enquanto a pessoa responde. Escolha: no toque. Campo: ao sair dele
       ou depois de ~700 ms sem digitar. O Continuar grava e já abre a próxima pergunta. */
    let vivoT = null;
    if (tipo === "texto" || tipo === "numero") {
      const campoR = ent.querySelector("input,textarea");
      campoR.addEventListener("input", () => { clearTimeout(vivoT); vivoT = setTimeout(aoVivo, 700); });
      campoR.addEventListener("change", () => { clearTimeout(vivoT); aoVivo(); });
      campoR.addEventListener("blur", () => { clearTimeout(vivoT); aoVivo(); });
    }
    if (outroBox) outroBox.querySelector("textarea").addEventListener("input", nomeOk);
    okBtn.onclick = () => {
      if (tipo === "escolha") {
        if (!escolhida) return erro("Escolha uma opção para continuar.");
        if (escolhida === Motor.NS) return erro(MSG_NS_ESCOLHA);
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
      if (!v) return erro(nsAberto ? MSG_NS_TEXTO : Motor.temNaoSei(q) ? MSG_VAZIO_NS : "Escreva a sua resposta para continuar. Se travar, veja o exemplo dentro do campo ou toque em “Ver dica”.");
      if (tipo === "numero") {
        const c = checarNumero(cod, v);
        if (c.erro) return erro(c.erro);
        if (c.aviso && avisoVisto !== v) { avisoVisto = v; return avisar(c.aviso); }
      }
      const r = marcar({ estado: "valor", valor: cod === "M4.P21" ? fmt(lerNumero(v)) : v });
      if (ficha) { const fi = lerFicha(p); if (fi === null) return erro(MSG_FICHA); if (fi) r.ficha = fi; }
      responder(r);
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
      e.innerHTML = `<b>Confira</b>${esc(t)}${/Etapa 1/.test(t) ? `<span class="selo-m"><b>Veio da Etapa 1</b></span>` : ""}<span class="aviso-dica">Se estiver certo, toque em “Continuar mesmo assim”.</span>`;
      e.hidden = false;
      okBtn.textContent = "Continuar mesmo assim";
    }
    /* resposta da tela agora (sem gravar): null se ainda não há resposta que valha */
    function provisoria() {
      if (tipo === "escolha") return escolhida && escolhida !== Motor.NS ? { estado: "opcao", opcao: escolhida } : null;
      if (tipo === "multipla") return marcadas.length && !marcadas.includes(Motor.NS) ? { estado: "opcoes", opcoes: V.opcoesLista.filter((o) => marcadas.includes(o)) } : null;
      const v = ent.querySelector("input,textarea").value.trim();
      if (!v) return null;
      if (tipo === "numero") { const c = checarNumero(cod, v); if (c.erro) return null; return { estado: "valor", valor: cod === "M4.P21" ? fmt(lerNumero(v)) : v }; }
      return { estado: "valor", valor: v };
    }
    /* na última pergunta do caminho o botão se chama "Ver meu resumo" */
    function nomeOk() {
      if (avisoVisto !== null) return;
      const r = provisoria();
      const R = r ? Object.assign({}, S.R, { [cod]: r }) : S.R;
      okBtn.textContent = Motor.proxima(M, R, cod) === "RESULTADO" ? "Ver meu resumo" : "Continuar";
    }
    function aoVivo() {
      nomeOk();
      const r = provisoria();
      const box = p.querySelector("#retorno");
      if (!r) { box.innerHTML = ""; return; }
      const R = Object.assign({}, S.R, { [cod]: r });
      box.innerHTML = retornoHtml(Motor.regrasAgora(M, R, cod), Motor.valor(R, cod));
      ligarCopiar(box); ligarTrocar(box);
    }

    function responder(r0) {
      p.querySelector("#erro").hidden = true;
      /* "Não sei" nunca chega aqui (lote 16/11): a caixa de ajuda aparece no toque e nada é gravado */
      if (r0.estado === "naosei" || (r0.estado === "opcao" && r0.opcao === Motor.NS)) return erro(MSG_NS_TEXTO);
      S.R[cod] = r0;
      mostrarComo(false);
      if (S.reabrir) { S.reabrir = S.reabrir.filter((x) => x !== cod); if (!S.reabrir.length) delete S.reabrir; }
      /* respostas de perguntas que deixaram de aparecer são descartadas */
      limparInvisiveis();
      salvar();
      const prox = seguinte(cod);
      if (prox === "RESULTADO") { S.hist.push("RESULTADO"); salvar(); ir(telaResultado); } else ir(telaPergunta, prox);
    }

    /* retorno da resposta (lote 17/11: mostrado ao vivo, antes do Continuar; a conta da ficha já fica ao vivo na própria ficha) */
    function retornoHtml(regras, v) {
      const se = Motor.retornoSe(q, v);
      return `<div class="retorno">
        ${vazio(q.resposta) ? "" : cod === "M4.P15" && v === "Sim" ? `<div class="bloco b-alerta"><b>Atenção</b>${txt(T(q.resposta))}</div>` : `<p class="r-texto r-pergunta">${txt(T(q.resposta))}</p>`}
        ${vazio(se) ? "" : `<div class="bloco b-proximo">${txt(se)}</div>`}
        ${regras.map((r) => `
          <div class="regra">
            <p class="r-texto">${txt(T(r.texto))}</p>
            ${vazio(r.alerta) || ALERTA_REPETIDO.includes(r.codigo) ? "" : `<div class="bloco b-alerta"><b>Atenção</b>${txt(T(r.alerta))}</div>`}
            ${vazio(r.encaminhamento) ? "" : `<div class="bloco b-enc"><b>Quem procurar</b>${txt(r.encaminhamento)}</div>`}
          </div>`).join("")}
        ${!vazio(q.proximo) && PROXIMO_FICA.includes(cod) ? `<div class="bloco b-proximo"><b>Próximo passo</b>${txt(T(q.proximo))}</div>` : ""}
      </div>`;
    }
    /* resposta já gravada (voltar/revisar): o retorno dela aparece de saída */
    if (resp && !ehAuto(resp)) aoVivo(); else nomeOk();
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
      if (r === undefined) {
        /* sem resposta: pula a tela vazia nesta varredura, mas segue avaliando e preservando as chaves respondidas depois */
        cod = Motor.proxima(M, R, cod);
        continue;
      }
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
    /* "Não sei" não é mais gravado; o que ficou para responder são os "Não sei" antigos que reabriram */
    const ns = (S.reabrir || []).filter((c) => !S.R[c] && M.porCodigo[c] && Motor.avaliar(M, S.R, Motor.cond(M.porCodigo[c])) === true).map((c) => M.porCodigo[c]);
    const reusadas = resp.filter((q) => ehAuto(S.R[q.codigo]) && ROTULO_REUSO[q.codigo] && !(S.forcar || []).includes(q.codigo)).map((q) => q.codigo);
    const p = el(`
      <div class="pag resultado">
        ${heroi({ kicker: "Resultado", kickerClasse: "passo", titulo: "Resumo das suas respostas" })}
        <main class="corpo">
          ${concluido()}
          ${entendemos(ns.length)}
          <section class="cartao tarefa"><h3>Sua próxima tarefa</h3><p>${esc(tarefa(ns.length))}</p></section>
          ${avisosNumeros()}
          ${cartaoReuso(reusadas, "Respostas que já tínhamos")}
          ${ns.length ? `<div class="bloco b-lacuna falta"><b>O que falta responder (${ns.length})</b><ul>${ns.map((q) => { const a = adapt(q); return `<li><span>${esc(T(Motor.versao(M, S.R, a).pergunta))}</span>${
            a.comoDescobrir ? `<details class="como-mini"><summary>Como descobrir</summary><ol>${a.comoDescobrir.map((x) => `<li>${esc(T(x))}</li>`).join("")}</ol></details>` : ""}</li>`; }).join("")}</ul><button class="btn btn-claro" id="responder-falta">Responder agora</button></div>` : ""}

          <details class="respostas"><summary>Ver suas respostas (${resp.length})</summary>
          ${resp.map((q, i) => { const v = Motor.valor(S.R, q.codigo), se = Motor.retornoSe(q, v), de = S.R[q.codigo].de; return `
            <div class="etapa ${v === Motor.NS ? "e-conf" : "e-sim"}">
              <div class="etapa-topo"><span class="etq">${i + 1}</span><b>${esc(T(Motor.versao(M, S.R, adapt(q)).pergunta))}</b></div>
              <p>${txt(mostrar(q.codigo))}</p>
              ${S.R[q.codigo].ficha && S.R[q.codigo].ficha.custo_unidade !== undefined ? `<div class="fc-res">${fichaResHtml(S.R[q.codigo].ficha, fichaVale(q.codigo) || "Produto")}</div>` : ""}
              ${de ? `<p class="selo-m"><b>Veio da Etapa ${de}</b></p>` : S.R[q.codigo].igual ? `<p class="selo-m"><b>Veio da sua resposta anterior</b></p>` : ""}
              ${vazio(se) ? "" : `<p class="mini-info">${txt(se)}</p>`}
              ${vazio(adapt(q).proximo) || !PROXIMO_FICA.includes(q.codigo) ? "" : `<p class="mini-info"><b>Próximo passo:</b> ${txt(T(adapt(q).proximo))}</p>`}
            </div>`; }).join("")}
          </details>

          <details class="resultado-mais"><summary>Mais detalhes</summary>
          ${propostaValor()}
          ${regras.length ? `<div class="secao-titulo">Orientações</div>${regras.map((r) => `<div class="cartao"><p>${esc(T(r.texto))}</p></div>`).join("")}` : ""}
          ${ale.length ? "" : ""}
          ${lac.length ? `<div class="bloco b-lacuna"><b>O que ainda falta saber</b><ul>${lac.map((l) => `<li>${esc(l)}</li>`).join("")}</ul></div>` : ""}
          ${enc.length ? `<div class="bloco b-enc"><b>Quem procurar, pelas suas respostas</b>${enc.map(esc).join(" · ")}</div>` : ""}
          <div class="secao-titulo">O que esta etapa entrega</div>
          <div class="cartao"><p>${esc(D.mapa.entrega)}</p></div>
          <div class="cartao"><h3>Quando procurar um profissional</h3><p>${esc(D.mapa.encaminhamentos)}</p></div>
          <div class="aviso">${esc(D.mapa.mensagem_limite)}</div>
          ${blocoConceitos(D.base.filter(baseVale), true)}
          </details>

          <div class="acoes">
            <button class="btn btn-primario" id="imp">Salvar ou imprimir</button>
            <button class="btn btn-claro" id="rev">Revisar respostas</button>
            <button class="btn btn-linha" id="novo">Começar outra análise</button>
          </div>
          ${botaoVoltar()}
          <div class="acoes lg2-proximo"><a class="btn btn-primario" style="text-decoration:none;text-align:center;box-sizing:border-box" href="/lg2/turma-a/m05/index.html">Ir para a Etapa 5</a></div>
          ${rodape(true)}
        </main>
      </div>`);
    /* Item I (16/11): toda seção recolhível do relatório começa aberta; dicas das perguntas não mudam. */
    p.querySelectorAll("details").forEach((d) => { d.open = true; });
    ligar(p);
    ligarCopiar(p);
    ligarTrocar(p);
    const rf = p.querySelector("#responder-falta");
    if (rf) rf.onclick = () => { S.hist = S.hist.filter((x) => x !== "RESULTADO"); salvar(); ir(telaPergunta, ns[0].codigo); };
    p.querySelector("#v").onclick = () => { S.hist.pop(); const a = S.hist.pop(); salvar(); ir(telaPergunta, a); };
    p.querySelector("#imp").onclick = () => { p.querySelectorAll("details.respostas, details.resultado-mais").forEach((d) => (d.open = true)); window.print(); };
    p.querySelector("#rev").onclick = () => { S.hist = []; salvar(); ir(telaPergunta, seguinte(null)); };
    p.querySelector("#novo").onclick = () => { if (confirm("Começar uma nova análise? As respostas atuais serão apagadas.")) { S = novo(); salvar(); ir(telaPergunta, seguinte(null)); } };
    return p;
  }

  /* números fora do comum que a pessoa confirmou: o aviso continua no resumo */
  function avisosNumeros() {
    const lista = ["M4.P19", "M4.P20", "M4.P21"].map((c) => {
      const v = Motor.valor(S.R, c), n = lerNumero(v);
      return v && v !== Motor.NS && !isNaN(n) ? avisoNumero(c, n) : "";
    }).filter(Boolean);
    if (!lista.length) return "";
    return `<div class="bloco b-alerta avisos-num"><b>Confira estes números</b>${lista.map((t) => `<p>${esc(t)}</p>${/Etapa 1/.test(t) ? `<p class="selo-m"><b>Veio da Etapa 1</b></p>` : ""}`).join("")}</div>`;
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
    return `<section class="cartao proposta-valor"><h3>Por que comprar de você (sua proposta de valor)</h3>${linhas.join("")}${frase ? `<div class="pv-item"><b>A sua frase</b><p>${txt(frase)}</p></div>` : ""}</section>`;
  }

  /* "Sua próxima tarefa" (versão leve): uma ação concreta com o que a pessoa planejou */
  function tarefa(nNaoSei) {
    const val = (c) => { const v = Motor.valor(S.R, c); return v && v !== Motor.NS ? String(v).trim() : ""; };
    const teste = val("M4.P14"), dias = val("M4.P20"), crit = val("M4.P19"), unid = UNID_P17[val("M4.P17")];
    const n = lerNumero(crit);
    const acao = !teste ? "mostre a sua ideia a 3 pessoas do seu público e anote o que disseram, antes de gastar com o teste."
      : `faça o teste (${teste.charAt(0).toLowerCase() + teste.slice(1)}${dias ? `, por ${dias} dias` : ""}) e anote numa folha, com a data, ${unid || "cada pedido ou reserva"}.${crit && !isNaN(n) ? ` No fim, compare com a sua meta: ${crit}.` : ""}`;
    const f = (nNaoSei ? "Primeiro, responda o que falta (abaixo). Depois, " : "") + acao;
    return f.charAt(0).toUpperCase() + f.slice(1);
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
    if (prop) frases.push(`Por que comprar de você, por enquanto: ${aspas(prop)}.${pvTxt ? ` Ela ${pvTxt}.` : ""}`);
    else if (pvTxt) frases.push(`O que você oferece ${pvTxt}.`);
    else if (ganho || motivo) frases.push([ganho && `O cliente ganha ${aspas(ganho)}`, motivo && `e escolheria você por ${S.R["M4.P11"].detalhe ? aspas(motivo) : motivo.toLowerCase()}`].filter(Boolean).join(" ") + ".");
    const teste = val("M4.P14"), dias = val("M4.P20"), gasto = val("M4.P21"), crit = val("M4.P19");
    if (teste) {
      let f = `No primeiro teste, você vai ${teste.charAt(0).toLowerCase() + teste.slice(1)}`;
      if (dias) f += `, durante ${dias} dias`;
      const nG = lerNumero(gasto);
      if (gasto) f += nG === 0 ? ", sem gastar dinheiro" : `, gastando no máximo R$ ${isNaN(nG) ? gasto : fmt(nG)}`;
      const nCrit = lerNumero(crit), unid = UNID_P17[val("M4.P17")];
      f += !crit ? "." : isNaN(nCrit) ? `, e vai considerar que deu certo com ${aspas(crit)}.`
        : `, e vai considerar que deu certo se chegar a ${crit}${unid ? " " + unid : ""}.`;
      frases.push(f);
    }
    const c2 = frases.length;   // 2º: proposta de valor e o teste; 3º: o que ficou em aberto
    if (nNaoSei) frases.push(`Ainda ${nNaoSei === 1 ? "falta responder 1 pergunta" : `faltam responder ${nNaoSei} perguntas`}; vale voltar nelas antes de testar.`);
    if (!frases.length) frases.push("Ainda faltam respostas para montarmos o resumo do seu negócio.");
    return `<section class="entendemos"><h2>O que entendemos até aqui</h2>${emParagrafos(frases, c1, c2).map((f) => `<p>${esc(f)}</p>`).join("")}</section>`;
  }

  /* versão leve: o crédito em texto só na capa, nos limites e no resultado; nas perguntas, só as marcas */
  function rodape(credito) {
    return `<footer class="rodape">
      ${credito ? `<p class="credito">Laboratório de Gestão II · FACC/UFJF</p>` : ""}
      <div class="logos">
        <img src="assets/logo_facc.png" alt="FACC">
        <img src="assets/logo_ufjf.svg" alt="UFJF">
        <img src="assets/logo_mg.svg" alt="Governo de Minas Gerais">
      </div>
    </footer>`;
  }

  ir(telaCapa);
})();
