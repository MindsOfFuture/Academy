/* Telas do Módulo 9 (Turma B). Todo texto de conteúdo vem de window.MODULO9 (documento final do
   Grupo 9, 30/10/2026), sem edição. As regras (quais perguntas aparecem, checklist, resumo) ficam em
   motor.js. Lê as respostas dos Módulos 1, 4, 6, 7 e 8 guardadas neste aparelho só para pré-preencher
   e cruzar; nunca escreve nelas. As respostas deste módulo ficam só neste aparelho. */
(function () {
  "use strict";
  const D = window.MODULO9, Mo = window.Motor9;
  const tela = document.getElementById("tela");
  const CHAVE = "lg2-turma-b-m09";
  const VERSAO = 3; // v2 = documento final (códigos M9-01…); v3 = lote 16/11, "Não sei" não grava mais (v2 é migrada, v1 descartada)
  const NS = Mo.NS;
  const Q = Object.fromEntries(D.perguntas.map((q) => [q.codigo, q]));
  const BASE = Object.fromEntries(D.base.map((b) => [b.codigo, b]));

  /* ---------- estado ---------- */
  function novo() { return { v: VERSAO, R: {}, feitos: {}, voltarResumo: false }; }
  function carregar() { try { const s = JSON.parse(localStorage.getItem(CHAVE)); return migrar(s && (s.v === VERSAO || s.v === 2) && s.R ? Object.assign(novo(), s) : novo()); } catch (e) { return novo(); } }
  /* "Não sei" não é mais resposta: o que foi salvo como "Não sei" (e o antigo "Ainda não faço ideia" do M9-03b) volta a
     ficar sem resposta, e a pessoa responde quando passar por lá. As outras respostas ficam. O estado (UF) só aceita um estado. */
  function migrar(s) {
    Object.keys(s.R).forEach((c) => { const r = s.R[c]; if (r && (r.estado === "naosei" || r.opcao === NS || (c === "M9-03b" && r.opcao === Mo.O.pIdeia))) delete s.R[c]; });
    const r = s.R["M9-01"]; if (r && r.estado !== "opcao") delete s.R["M9-01"];
    s.v = VERSAO;
    return s;
  }
  let S = carregar();
  /* migração (respostas "Não sei" antigas viram "sem resposta"): grava já, para quem lê este módulo ver o estado novo */
  try { const s0 = JSON.parse(localStorage.getItem(CHAVE)); if (s0 && s0.R && (s0.v !== VERSAO || Object.keys(s0.R).length !== Object.keys(S.R).length)) localStorage.setItem(CHAVE, JSON.stringify(S)); } catch (e) {}
  let aviso = "";
  function salvar() {
    try { localStorage.setItem(CHAVE, JSON.stringify(S)); aviso = ""; }
    catch (e) { aviso = "Não foi possível salvar. Mantenha a página aberta e imprima o resultado para guardar suas respostas."; }
  }

  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  /* texto com endereço da internet: o endereço vira link */
  const comLinks = (s) => esc(s).replace(/https?:\/\/[^\s)]*[^\s).,;]/g, (u) => `<a href="${u}" target="_blank" rel="noopener">${u}</a>`);
  const link = (u, t) => `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(t || u)}</a>`;
  function el(html) { const d = document.createElement("div"); d.innerHTML = html.trim(); return d.firstElementChild; }
  /* D (lote 17/11): a cada pergunta nova o foco vai para o enunciado, para o leitor de tela anunciar a pergunta */
  function ir(f, a) { tela.innerHTML = ""; tela.appendChild(f(a)); window.scrollTo(0, 0); const q = tela.querySelector("#pergunta"); if (q) q.focus({ preventScroll: true }); }
  function redesenhar(f, a) { const y = window.scrollY; tela.innerHTML = ""; tela.appendChild(f(a)); window.scrollTo(0, y); }
  const cap1 = (s) => { s = String(s || "").trim(); return s.charAt(0).toUpperCase() + s.slice(1); };

  /* ---------- respostas dos outros módulos neste aparelho (só leitura) ---------- */
  function lerR(chave) { try { const s = JSON.parse(localStorage.getItem(chave)); return (s && s.R) || {}; } catch (e) { return {}; } }
  function lerEstado(chave) { try { return JSON.parse(localStorage.getItem(chave)) || {}; } catch (e) { return {}; } }
  const valor = (r) => !r ? null : r.estado === "opcao" ? r.opcao : r.estado === "valor" ? r.valor : r.estado === "naosei" ? NS : null;
  const texto = (r) => { const v = valor(r); return typeof v === "string" && v.trim() && v !== NS ? v.trim() : null; };
  const primeiro = (R, cods) => { for (const c of cods) { const t = texto(R[c]); if (t) return t; } return null; };
  const UF = { AC: "Acre", AL: "Alagoas", AP: "Amapá", AM: "Amazonas", BA: "Bahia", CE: "Ceará", DF: "Distrito Federal", ES: "Espírito Santo", GO: "Goiás", MA: "Maranhão", MT: "Mato Grosso", MS: "Mato Grosso do Sul", MG: "Minas Gerais", PA: "Pará", PB: "Paraíba", PR: "Paraná", PE: "Pernambuco", PI: "Piauí", RJ: "Rio de Janeiro", RN: "Rio Grande do Norte", RS: "Rio Grande do Sul", RO: "Rondônia", RR: "Roraima", SC: "Santa Catarina", SP: "São Paulo", SE: "Sergipe", TO: "Tocantins" };
  /* estado a partir da cidade do Módulo 3 ("Juiz de Fora - MG", "Juiz de Fora/MG" ou o nome do estado) */
  function estadoDe(t) {
    if (!t) return null;
    const m = /(?:^|[\s,/–-])([A-Z]{2})\s*$/.exec(t.trim());
    if (m && UF[m[1]]) return UF[m[1]];
    const nomes = D.viabilidade.estados.map((e) => e.estado);
    return nomes.find((n) => t.toLowerCase().includes(n.toLowerCase())) || null;
  }
  /* alimento pelo que a pessoa vende: palavras comuns de comida e bebida */
  const ALIMENTO = /bolo|doce|salgad|comida|marmit|quentinha|lanche|aliment|bebida|suco|sorvete|picol[eé]|gelad|confeit|padaria|\bp[aã]o\b|\bp[aã]es\b|torta|brigadeiro|trufa|bombo|cupcake|biscoit|cookie|chocolate|pizza|hamb[uú]rg|sandu[ií]che|pastel|coxinha|empad|petisco|geleia|cerveja|quitut|refei[cç]|caf[eé]\b|a[cç]a[ií]\b|tempero|conserva|queijo/i;
  /* CNAE de alimentos e bebidas: fabricação (10, 11), restaurantes e comida (561, 562), comércio de alimentos (4721 a 4724) */
  const cnaeAlimento = (t) => { const d = String(t || "").replace(/\D/g, ""); return d.length >= 4 && /^(10|11|561|562|472[1-4])/.test(d); };
  /* quando o Módulo 4 disse "atividade com regras específicas": qual opção do M9-02, pelo que a pessoa vende */
  function tipoSaude(t) {
    if (!t) return null;
    if (/\bpets?\b|cachorr|\bc[aã]es\b|gatos?\b|animal|animais|banho e tosa|ra[cç][aã]o/i.test(t)) return "Sim, animais";
    if (/cabel|unha|manicure|pedicure|est[eé]tic|massag|sobrancelh|depila|tatua|maquiador|cuidador|enferm|barbe/i.test(t)) return "Sim, procedimentos no corpo ou cuidado com pessoas";
    if (/cosm[eé]t|sabonete|perfum|hidratante|saneante|desinfetante|rem[eé]dio|medicament/i.test(t)) return "Sim, cosméticos, saneantes, medicamentos ou produtos para a saúde";
    if (ALIMENTO.test(t)) return "Sim, alimentos ou bebidas";
    return null;
  }
  /* respostas que já vieram de outro módulo: pré-marcadas com selo (a pessoa confere e toca Continuar) */
  const LOCAL8 = { [Mo.O.domicilio]: Mo.O.domicilio, "Minha casa": "Na minha casa", "Ponto comercial": "Em loja ou sala comercial", "Atendimento externo": "Sem local fixo (digital, na casa do cliente ou ambulante)", "Online": "Sem local fixo (digital, na casa do cliente ou ambulante)" };
  const FORMA8 = { "Atendimento externo": "Na casa ou na empresa do cliente", "Online": "Só pela internet ou por telefone" };
  function herdado(cod, X, R) {
    if (cod === "M9-02") {
      /* "Não" nunca vem pré-marcado: a pessoa precisa responder (no Módulo 4, quem vende bolos chegou a marcar "Não") */
      if (X.m4Regulada && X.saudeTipo) return { op: X.saudeTipo, m: 4 };
    }
    if (cod === "M9-03" && X.m8Local) return { op: LOCAL8[X.m8Local], m: 8 };
    if (cod === "M9-03a" && FORMA8[X.m8Local] && Mo.op(R, "M9-03") === Mo.O.semLocal) return { op: FORMA8[X.m8Local], m: 8 };
    if (cod === "M9-10" && X.m8Tecnico) return { op: X.m8Tecnico, m: 8 };
    return null;
  }
  /* F (lote 16/11): pergunta já respondida num módulo anterior, com resposta que casa sem dúvida, não aparece de novo.
     A resposta é gravada aqui com "herdado: N" (mesmo formato {estado, opcao} que os outros módulos leem) e aparece num
     cartão "Veio do Módulo N · Trocar". "Minha casa" do Módulo 8 não casa sem dúvida (casa ou apartamento?): a tela
     continua, com a opção pré-marcada. M9-02 só é pulada quando o Módulo 4 disse "Sim" e o que a pessoa vende mostra o tipo. */
  const LIMPO_LOCAL8 = { "Ponto comercial": Mo.O.loja, "Atendimento externo": Mo.O.semLocal, "Online": Mo.O.semLocal, [Mo.O.domicilio]: Mo.O.domicilio };
  const ROTULO_HERDADO = { "M9-02": "O que você faz e a saúde", "M9-03": "Onde vai funcionar", "M9-03a": "Como vai trabalhar", "M9-10": "Profissional formado e registrado em conselho" };
  function limpo(cod, X, R) {
    if (cod === "M9-03" && LIMPO_LOCAL8[X.m8Local]) return { op: LIMPO_LOCAL8[X.m8Local], m: 8 };
    if (cod === "M9-03a" && FORMA8[X.m8Local] && Mo.op(R, "M9-03") === Mo.O.semLocal) return { op: FORMA8[X.m8Local], m: 8 };
    if (cod === "M9-10" && X.m8Tecnico) return { op: X.m8Tecnico, m: 8 };
    if (cod === "M9-02" && X.m4Regulada && X.saudeTipo) return { op: X.saudeTipo, m: 4 };
    return null;
  }
  let pulados = [];   // perguntas puladas agora (o cartão aparece na tela seguinte)
  /* 1ª pergunta sem resposta, gravando antes as que já vieram de outro módulo; também atualiza as herdadas
     (o módulo de origem pode ter mudado) */
  function proximaTela(depois) {
    const X = contexto();
    Mo.sequencia(S.R).forEach((c) => {
      const r = S.R[c]; if (!r || !r.herdado) return;
      const h = limpo(c, X, S.R);
      if (!h) delete S.R[c]; else if (h.op !== r.opcao) S.R[c] = { estado: "opcao", opcao: h.op, herdado: h.m };
    });
    for (let i = 0; i < 30; i++) {
      const s = Mo.sequencia(S.R), ini = depois && s.includes(depois) ? s.indexOf(depois) + 1 : 0;
      const c = s.slice(ini).find((k) => !S.R[k]);
      if (!c) { salvar(); return null; }
      const h = limpo(c, X, S.R);
      if (!h) { salvar(); return c; }
      S.R[c] = { estado: "opcao", opcao: h.op, herdado: h.m };
      pulados.push(c);
      limparInvisiveis();
    }
    return null;
  }
  const irProxima = (depois) => { const c = proximaTela(depois); c ? ir(telaPergunta, c) : ir(telaResultado); };
  function cartaoHerdado(cods) {
    const l = cods.filter((c) => S.R[c] && S.R[c].herdado);
    if (!l.length) return "";
    return `<section class="cartao-herdado" id="herdadas">${l.map((c) => `<div class="herd-item"><p><span class="veio">Veio da Etapa ${S.R[c].herdado}</span> <b>${esc(ROTULO_HERDADO[c])}:</b> ${esc(S.R[c].opcao)}</p><button class="trocar" type="button" data-trocar="${c}">Trocar</button></div>`).join("")}</section>`;
  }
  function contexto() {
    const m1 = lerR("lg2-turma-a-m01"), m3 = lerR("lg2-turma-a-m03"), m4 = lerR("lg2-turma-a-m04"), m5 = lerR("lg2-turma-a-m05"), m6 = lerR("lg2-turma-b-m06"), m8 = lerR("lg2-turma-b-m08");
    const e7 = lerEstado("lg2-turma-b-m07");
    const reg4 = valor(m4["M4-11"]) || valor(m4["M4.P15"]);
    const cnpj = valor(m8["M8-02"]) || valor(m8["M8.P05"]);
    const exp = valor(m1["M1-08"]) || valor(m1["M1.P04"]);
    const preoc = valor(m1["M1.P08"]);
    const itens6 = ["M6-01", "M6.P01", "M6.P10", "M6.P13"].map((c) => texto(m6[c])).filter(Boolean).join(" ");
    const texto7 = JSON.stringify([e7.mapa || [], e7.R || {}, e7.ini || {}]);
    const cidade = primeiro(m3, ["M3-08"]);
    const ideia = primeiro(m1, ["M1.P03", "M1-01"]) || primeiro(m3, ["M3.P01"]) || primeiro(m4, ["M4.P01"]) || primeiro(m8, ["M8.P01", "M8-01"]);
    /* tipo de oferta: Módulo 1 (nova pergunta), depois 5, 4 e 8; vale a palavra inicial */
    let tipo = null, tipoDe = null;
    for (const [r, m] of [[m1["M1.P03A"], 1], [m5["M5.P01"], 5], [m4["M4.P02"], 4], [m8["M8.P02"], 8]]) {
      const w = (texto(r) || "").split(/[:+\s]/)[0];
      if (["Produto", "Mercadoria", "Serviço"].includes(w)) { tipo = w; tipoDe = m; break; }
    }
    const est1 = texto(m1["M1.P01"]);
    const estagio = !est1 ? null : est1.startsWith("Ainda está") ? "ideia" : est1.startsWith("Já fiz") ? "testes" : est1.startsWith("Já vend") ? "vende" : null;
    const loc8 = texto(m8["M8.P03"]), tec8 = texto(m8["M8.P08"]);
    /* o que a pessoa vende (Módulos 1, 3, 4 e 8 e as ideias deste módulo) e o CNAE do Módulo 8: é alimento? */
    const e8 = lerEstado("lg2-turma-b-m08").cnae;   // CNAE escolhido na lista do Módulo 8 (lote 3)
    const cnae = primeiro(m8, ["M8-04", "M8.P06"]) || (e8 && e8.cnae ? `${e8.cnae}${e8.ocupacao ? ` (${e8.ocupacao})` : ""}` : null);
    const falas = [ideia, primeiro(m1, ["M1.P03", "M1-01"]), primeiro(m8, ["M8.P01", "M8-01"]), primeiro(m4, ["M4.P01"]), primeiro(m3, ["M3.P01"]), texto(S.R["M9-13"]), cnae].filter(Boolean);
    const falaAlimento = falas.find((t) => ALIMENTO.test(t)) || (cnaeAlimento(cnae) ? cnae : null);
    return {
      ideia, tipo, tipoDe, estagio,
      m8Local: ["Minha casa", "Ponto comercial", "Atendimento externo", "Online", Mo.O.domicilio].includes(loc8) ? loc8 : null,
      m8Tecnico: tec8 === "Sim" || tec8 === "Não" ? tec8 : null,
      saudeTipo: tipoSaude([ideia, primeiro(m8, ["M8.P01", "M8-01"]), primeiro(m4, ["M4.P01"])].filter(Boolean).join(" ")),
      descricao: primeiro(m8, ["M8-01", "M8.P01"]),
      oferta: primeiro(m1, ["M1-01", "M1.P03"]),
      cnpj: cnpj && cnpj !== NS ? cnpj : null,
      cnae,
      alimento: !!falaAlimento,
      alimentoTexto: falaAlimento,
      cidade,
      estado: estadoDe(cidade),
      m4Regulada: typeof reg4 === "string" && reg4.startsWith("Sim"),
      m4NaoRegulada: reg4 === "Não",
      semCnpj: cnpj === "Não",
      poucaExperiencia: exp === "Sei um pouco, ainda estou aprendendo" || exp === "Ainda não sei fazer" || preoc === "Ainda não sei fazer direito",
      m6SemReforma: !!itens6 && !/reform|obra|instala|constru|pedreiro/i.test(itens6),
      m7Gas: /\bg[aá]s\b|botij|glp|fog[aã]o/i.test(texto7),
    };
  }

  /* ---------- peças do layout (modelo dos Módulos 6, 7 e 10) ---------- */
  /* versão leve: o crédito em texto só na capa e no resultado; nas perguntas, só as marcas */
  function rodape(credito) {
    return `<footer class="rodape">
      ${credito ? `<p class="credito">Laboratório de Gestão II · FACC/UFJF</p>` : ""}
      <div class="logos"><img src="assets/logo_facc.png" alt="FACC"><img src="assets/logo_ufjf.svg" alt="UFJF"><img src="assets/logo_mg.svg" alt="Governo de Minas Gerais"></div>
    </footer>`;
  }
  function topo(trilha) {
    return `<div class="barra-topo">
      <img class="logo-mini" src="assets/minds.svg" alt="Minds of the Future">
      <nav class="trilha" aria-label="Você está em"><button class="trilha-link" data-inicio>Início</button><span>/</span><span>Etapa 9</span>${trilha ? `<span>/</span><span>${esc(trilha)}</span>` : ""}</nav>
    </div>`;
  }
  function heroi(o) {
    /* versão leve: nas perguntas, faixa compacta (só a barra de progresso, sem título repetido nem ilustração) */
    if (o.compacta) return `<section class="heroi heroi-compacta">
      <div class="heroi-prog"><div class="barra" role="progressbar" aria-label="Progresso" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${o.pct}"><div class="barra-fill" style="width:${o.pct}%"></div></div></div>
    </section>`;
    return `<section class="heroi ${o.grande ? "heroi-grande" : ""}">
      <div class="heroi-topo">
        <div class="heroi-txt">
          <div class="kicker ${o.kickerClasse || ""}">${esc(o.kicker || "Etapa 9")}</div>
          <${o.h1 ? "h1" : "h2"} class="heroi-tit">${esc(o.titulo)}</${o.h1 ? "h1" : "h2"}>
          ${o.texto ? `<p>${esc(o.texto)}</p>` : ""}
        </div>
        <img class="heroi-img" src="assets/${o.grande ? "hero-inicio.webp" : "hero-tela.webp"}" alt="">
      </div>
      ${o.extra || ""}
      ${o.reinicio ? `<button class="reinicio" id="zerar">Recomeçar do zero</button>` : ""}
    </section>`;
  }
  function chipNegocio() {
    const X = contexto(), t = X.descricao || X.oferta;
    return t ? `<div class="chip-oferta"><span>${esc(t)}</span></div>` : "";
  }
  /* "Voltar" no topo, à esquerda, no mesmo lugar em todas as telas (padrão do Módulo 1) */
  const botaoVoltar = () => `<button class="voltar voltar-topo" id="v">Voltar</button>`;
  /* texto longo (mais de LIMITE_TEXTO): a 1ª frase fica à vista e o resto vai para "Ver mais" (fechado) */
  const LIMITE_TEXTO = 220;
  function curto(t) {
    const m = /^(.+?[.!?:])\s+(?=[A-ZÀ-Ú“"(])/.exec(t);
    if (t.length <= LIMITE_TEXTO || !m || m[1].length >= t.length - 20) return `<p>${comLinks(t)}</p>`;
    return `<p>${comLinks(m[1])}</p><details class="mais"><summary>Ver mais</summary><p>${comLinks(t.slice(m[0].length))}</p></details>`;
  }
  function ligar(p) {
    p.querySelectorAll("[data-inicio]").forEach((b) => { b.onclick = () => ir(telaCapa); });
    p.querySelectorAll("#zerar,#zerar2").forEach((z) => { z.onclick = reiniciar; });
    p.querySelectorAll("[data-trocar]").forEach((b) => { b.onclick = () => { S.trocando = true; salvar(); ir(telaPergunta, b.dataset.trocar); }; });
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
  /* ---------- "Não sei": caixa "Como descobrir" (passos + pedido pronto para a IA, com Copiar) ----------
     Os textos ficam nos dados de cada pergunta (comoDescobrir, promptIA); a resposta salva não muda. */
  const ehNS = (cod, o) => o === NS || (cod === "M9-03b" && o === Mo.O.pIdeia);
  /* "Não sei" bloqueia: mostra a ajuda, não grava, e o Continuar pede uma resposta de verdade */
  const NS_ESCOLHA = "Use a ajuda acima e escolha a sua resposta para continuar.";
  const NS_AREA = "Use a ajuda acima e escreva a área para continuar.";
  function caixaComo(cod, classe, dentro) {
    const q = Q[cod] || {};
    if (!q.comoDescobrir || !q.comoDescobrir.length) return "";
    return `<section class="como-descobrir ${classe || ""}">
      <b class="como-tit">Como descobrir</b>
      <ol>${q.comoDescobrir.map((x) => `<li>${esc(x)}</li>`).join("")}</ol>
      ${q.comoTec ? tecHtml(`<p>${esc(q.comoTec)}</p>`) : ""}
      ${dentro || ""}
      ${q.promptIA ? `<div class="pedir-ia">
        <b>Peça ajuda à IA</b>
        <p class="como-nota">Copie, cole numa IA de sua preferência e troque o que está entre colchetes.</p>
        <p class="prompt" data-prompt>${esc(q.promptIA)}</p>
        <button class="btn-alt copiar" type="button" data-copiar>Copiar</button>
      </div>` : ""}
    </section>`;
  }
  const enunciado = (cod) => Q[cod].curta || Q[cod].pergunta;
  function reiniciar() {
    if (!confirm("Apagar todas as respostas desta etapa e recomeçar? Se quiser guardar, imprima o resultado antes.")) return;
    try { localStorage.removeItem(CHAVE); } catch (e) {}
    S = novo();
    ir(telaCapa);
  }
  /* caixa de retorno da opção: texto literal da coluna "Retorno / mensagem sugerida" */
  function caixa(t, extra) {
    if (!t) return "";
    t = String(t).split("[estado]").join(extra && extra.estado ? extra.estado : "[estado]");
    /* B1 (lote 17/11): "[link do estado]" vira o link de verdade (antes só o resultado trocava; a caixa mostrava o colchete) */
    t = t.split("[link do estado]").join(MARCA_LINK);
    const pl = plano(t); t = pl.t;
    const pa = Mo.partesAviso(t);
    let h;
    if (pa.atencao) h = `<div class="bloco b-ok">${curto(pa.verifique)}</div><div class="bloco b-alerta"><b>⚠ Atenção</b><p>${comLinks(pa.atencao)}</p></div>`;
    else if (/^Atenção: /.test(t)) h = `<div class="bloco b-alerta"><b>Atenção</b><p>${comLinks(t.replace(/^Atenção: /, ""))}</p>${pl.tec}</div>`;
    else h = `<div class="bloco b-ok">${curto(t)}${pl.tec}</div>`;
    return h.split(MARCA_LINK).join(linkEstadoHtml());
  }
  /* link do portal da consulta de viabilidade do estado escolhido (ou a lista de todos os estados) */
  const MARCA_LINK = "\u0001linkUF\u0001";
  const nomeLinkEstado = () => { const uf = Mo.op(S.R, "M9-01"); return uf && uf !== NS ? `abrir o site de ${uf}` : "abrir a lista com o site de cada estado"; };
  const linkEstadoHtml = () => `<a class="link-estado" href="${esc(Mo.linkEstado(D, S.R))}" target="_blank" rel="noopener">${esc(nomeLinkEstado())}</a>`;
  /* "Não sei": só a parte "Verifique…" do documento dentro da ajuda; o cuidado geral ("⚠ Atenção") já está na "Ver dica",
     à vista antes de responder (item G: sem balão de alerta que não depende da resposta) */
  const caixaNS = (t) => (t ? `<div class="bloco b-ok">${curto(Mo.partesAviso(t).verifique)}</div>` : "");
  /* cruzamento: só o de "Atenção" (risco que depende da resposta) tem tom de aviso; "Dica" e "Pergunta gentil" são neutros */
  const cruzBox = (c) => { const pl = plano(c.mensagem); return `<div class="bloco ${c.forma === "Atenção" ? "b-alerta" : "b-proximo"} cruz"><b>${esc(c.forma)}</b><p>${esc(pl.t)}</p>${pl.tec}</div>`; };
  /* conceitos da Base técnica ligados a cada pergunta: escolha do app (o documento não liga) */
  const CONCEITO = {
    "M9-01": ["M9.BT05", "M9.BT20"], "M9-02": ["M9.BT12", "M9.BT11"], "M9-03": ["M9.BT08", "M9.BT09"], "M9-03a": ["M9.BT23"], "M9-03b": ["M9.BT08", "M9.BT17"],
    "M9-04": ["M9.BT05", "M9.BT17", "M9.BT18"], "M9-05": ["M9.BT08"], "M9-06": ["M9.BT14"], "M9-07": ["M9.BT21", "M9.BT22"], "M9-07a": ["M9.BT21"], "M9-07b": ["M9.BT21"],
    "M9-07c": ["M9.BT14"], "M9-08": ["M9.BT09"], "M9-09": ["M9.BT13"], "M9-10": ["M9.BT16"], "M9-11": ["M9.BT15"], "M9-12": ["M9.BT19"],
  };
  const TERMOS_RESULTADO = ["M9.BT01", "M9.BT02", "M9.BT03", "M9.BT04", "M9.BT06", "M9.BT07", "M9.BT10"];
  function termos(cods) {
    const ts = (cods || []).map((c) => BASE[c]).filter(Boolean).map((t) => (t.codigo === "M9.BT21" ? conceitoGas(t) : t));
    if (!ts.length) return "";
    return `<details class="saiba"><summary><span>Entenda os termos</span></summary>${conceitosHtml(ts)}</details>`;
  }
  /* D (lote 16/11, 3ª rodada): cada termo aparece em palavras simples; o nome técnico, a definição da lei/norma e a fonte
     ficam em "Detalhes técnicos" (fechado nas perguntas; no resultado todo <details> já vem aberto) */
  const SIMPLES = {
    "M9.BT01": ["Licenças em geral", "É o nome que a lei dá a qualquer licença, alvará, autorização ou registro que o governo pede para um negócio funcionar."],
    "M9.BT02": ["Nível de risco da atividade", "Cada atividade tem um nível de risco. Baixo: não precisa de alvará nem de licença. Médio: a licença sai logo depois do registro e a vistoria vem depois. Alto: só pode funcionar depois da vistoria."],
    "M9.BT03": ["Código da atividade", "Número oficial que diz qual é a sua atividade. Ele aparece no cartão do CNPJ e no certificado do MEI. A empresa tem uma atividade principal e pode ter outras."],
    "M9.BT04": ["Nível de risco na sua cidade", "A sua cidade ou o seu estado podem ter uma lista própria com o risco de cada atividade. Se não tiverem, vale a lista do governo federal. Quem tem mais de uma atividade segue, em geral, a de maior risco."],
    "M9.BT05": ["verificação do endereço na prefeitura", "É perguntar à prefeitura, antes de abrir ou de mudar de endereço, se o seu tipo de negócio pode funcionar naquele lugar. Ela é feita pela internet, no site da Junta Comercial do seu estado, e muitas vezes a resposta já diz se você precisa de alvará."],
    "M9.BT06": ["Licença provisória (risco médio)", "Na atividade de risco médio, a licença sai logo depois do registro, com base na sua palavra de que cumpre as regras. A vistoria vem depois. O nome, o prazo e as condições mudam de cidade para cidade."],
    "M9.BT07": ["Sem alvará não quer dizer sem regras", "Mesmo sem precisar de alvará, o negócio tem de seguir as regras da cidade, de higiene, de meio ambiente e de segurança, e pode ser fiscalizado. As regras de obra também continuam valendo."],
    "M9.BT08": ["Trabalhar em casa", "No MEI, você pode usar a sua casa como endereço do negócio quando a atividade não precisa de um lugar próprio. Atividades simples, de baixo risco, podem funcionar em casa sem alvará. Mas a prefeitura pode pôr condições: a rua aceitar comércio, tamanho máximo, número de clientes, gás e produtos que pegam fogo."],
    "M9.BT09": ["Trabalhar em apartamento ou condomínio", "Em prédio ou condomínio, vale o que dizem as regras do condomínio (a convenção): elas podem proibir ou limitar o comércio. Algumas prefeituras também pedem a autorização do condomínio por escrito, aprovada em assembleia."],
    "M9.BT10": ["MEI e alvará", "Ao se registrar, o MEI recebe um certificado que dispensa o alvará e a licença de funcionamento. Mas as regras de higiene, de meio ambiente, de segurança e de onde pode ter comércio continuam valendo, e pode haver fiscalização."],
    "M9.BT11": ["Licença da Vigilância Sanitária", "Quanto maior o risco à saúde, mais a Vigilância Sanitária pede. Algumas atividades não precisam de licença, mas seguem as regras de higiene. Outras recebem a licença logo e têm vistoria depois. As de maior risco só funcionam depois da vistoria. Em geral, quem dá a licença é a prefeitura."],
    "M9.BT12": ["O que passa pela Vigilância Sanitária", "Tudo o que pode afetar a saúde de quem compra ou é atendido: comida e bebida; cosmético, produto de limpeza e remédio; procedimento no corpo (cabelo, unha, estética, tatuagem); cuidado com pessoas; e animais."],
    "M9.BT13": ["Alimento, beleza ou saúde em casa", "A Vigilância Sanitária pode liberar o MEI para trabalhar em casa, se você aceitar a vistoria do local. Na prática, costuma pedir um espaço de trabalho separado da casa e utensílios só do negócio. As regras exatas dependem da sua cidade e do seu estado."],
    "M9.BT14": ["Licença dos Bombeiros", "Os Bombeiros do seu estado conferem se o local é seguro contra incêndio: extintor, saída, gás e produtos que pegam fogo. O alvará da prefeitura costuma depender dessa vistoria. O documento e as exigências mudam de estado para estado."],
    "M9.BT15": ["Licença ambiental", "Pode ser pedida quando o trabalho gera fumaça, barulho, água suja ou lixo perigoso. Atividade pequena, que só afeta a vizinhança, em geral é com a prefeitura; as maiores, com o órgão ambiental do estado."],
    "M9.BT16": ["Conselho da profissão", "Algumas atividades precisam registrar a empresa no conselho da profissão e ter um profissional formado que responde pelo trabalho (o responsável técnico). Ex.: nutricionista, farmacêutico, veterinário."],
    "M9.BT17": ["Onde pode ter comércio na cidade", "Cada cidade tem regras que dizem o que pode funcionar em cada rua ou bairro. Ex.: algumas ruas só aceitam casas. A consulta de viabilidade confere isso para o seu endereço."],
    "M9.BT18": ["Prazo para a resposta", "Você tem o direito de saber em quanto tempo o seu pedido será respondido. Nos pedidos ao governo federal, se o prazo vencer sem resposta, o pedido conta como aprovado. Na prefeitura e no estado, isso só vale se a regra local disser."],
    "M9.BT19": ["Reforma e alvará de obra", "Pequena reforma (pintura, piso, troca de tomada ou de torneira) muitas vezes não precisa de alvará. Obra que mexe na estrutura, aumenta a área ou muda o uso do local precisa de licença da prefeitura e de um engenheiro ou arquiteto responsável."],
    "M9.BT20": ["Site para abrir e regularizar empresa", "Um sistema na internet que junta a Junta Comercial, a Receita Federal e a prefeitura para abrir, mudar ou regularizar empresas. No seu estado, ele fica no site da Junta Comercial."],
    "M9.BT21": ["Gás de cozinha no local", "Botijões e cilindros seguem as regras dos Bombeiros do seu estado, e os limites mudam de um estado para outro. Quanto mais gás, mais exigências: com muito gás, é preciso um abrigo ou uma central de gás, com projeto de um engenheiro ou arquiteto."],
    "M9.BT22": ["Vender gás de cozinha", "Só empresa com autorização do governo federal pode vender botijões. O pedido é feito pela internet, na agência nacional que cuida do gás e dos combustíveis. A quantidade de gás que pode ficar guardada depende dessa autorização."],
    "M9.BT23": ["Vender na rua, em feira ou em veículo", "Para vender na rua, você precisa de licença ou permissão da prefeitura. Com comida, a Vigilância Sanitária também confere a barraca ou o food truck. Veículo adaptado é regularizado no Detran, e o gás segue as regras dos Bombeiros. Algumas prefeituras pedem uma cozinha de apoio com licença. As regras mudam de cidade para cidade."],
  };
  /* siglas por extenso, só dentro de "Detalhes técnicos" */
  const SIGLAS = {
    "M9.BT03": "CCMEI = Certificado da Condição de Microempreendedor Individual.",
    "M9.BT05": "Redesim = Rede Nacional para a Simplificação do Registro e da Legalização de Empresas e Negócios.",
    "M9.BT11": "Anvisa = Agência Nacional de Vigilância Sanitária; RDC = Resolução da Diretoria Colegiada; IN = Instrução Normativa.",
    "M9.BT12": "Anvisa = Agência Nacional de Vigilância Sanitária; CNAE = Classificação Nacional de Atividades Econômicas.",
    "M9.BT14": "AVCB = Auto de Vistoria do Corpo de Bombeiros (o nome muda em alguns estados).",
    "M9.BT19": "ART = Anotação de Responsabilidade Técnica (engenheiro); RRT = Registro de Responsabilidade Técnica (arquiteto).",
    "M9.BT20": "Redesim = Rede Nacional para a Simplificação do Registro e da Legalização de Empresas e Negócios.",
    "M9.BT21": "GLP = gás liquefeito de petróleo (o gás de cozinha); ABNT NBR = norma técnica brasileira; ART/RRT = documento de responsabilidade do engenheiro ou do arquiteto.",
    "M9.BT22": "ANP = Agência Nacional do Petróleo, Gás Natural e Biocombustíveis; GLP = gás liquefeito de petróleo (o gás de cozinha).",
  };
  /* sem <p> dentro: os parágrafos do texto principal continuam sendo só o texto simples */
  const tecHtml = (corpo) => corpo ? `<details class="tec"><summary>Detalhes técnicos</summary><div class="tec-txt">${corpo.replace(/<p class="fonte">/g, '<span class="fonte">').replace(/<p>/g, '<span class="tec-l">').replace(/<\/p>/g, "</span>")}</div></details>` : "";
  const conceitosHtml = (ts) => ts.map((t) => {
    const [tit, txt] = SIMPLES[t.codigo] || [t.conceito, t.definicao];
    const def = t.definicao.replace(/\s*\(links na tabela que acompanha a regra M9\.R\d+\)/, "");
    const tec = `<p><b>Nome técnico: ${esc(t.conceito)}.</b> ${esc(def)}</p>${SIGLAS[t.codigo] ? `<p>${esc(SIGLAS[t.codigo])}</p>` : ""}${t.semFonte ? "" : `<span class="fonte">Fonte: ${link(t.link, t.referencia)} · consulta em ${esc(t.data)}</span>`}`;
    return `<div class="conceito" data-bt="${esc(t.codigo)}"><b>${esc(tit)}</b><p>${esc(txt)}</p>${t.semFonte ? `<span class="fonte">${esc(bombeirosEstado())}</span>` : ""}${SIMPLES[t.codigo] ? tecHtml(tec) : ""}</div>`;
  }).join("");
  /* textos do documento com norma, sigla ou lei no meio: na tela vai a versão simples; o original fica em "Detalhes técnicos" */
  const PLANO = {
    "A ligação é feita pela distribuidora, e a instalação interna (tubos, registros e ventilação dos aparelhos) deve ser feita por empresa ou profissional habilitado, com ART ou RRT. Em comércio, os Bombeiros podem conferir a instalação no projeto ou na vistoria.":
      ["A ligação é feita pela companhia de gás. A instalação dentro do imóvel (canos, registros e ventilação dos aparelhos) deve ser feita por empresa ou profissional habilitado, que assina como responsável. Em comércio, os Bombeiros podem conferir a instalação.",
        "O profissional registra a responsabilidade numa ART (Anotação de Responsabilidade Técnica, de engenheiro) ou num RRT (Registro de Responsabilidade Técnica, de arquiteto). Os Bombeiros podem conferir a instalação no projeto ou na vistoria."],
    "Vender botijões exige empresa com autorização da ANP para revenda de GLP, área de armazenamento compatível com a classe autorizada e regularização nos Bombeiros e na prefeitura. Não comece a vender antes dessa autorização.":
      ["Para vender botijões, você precisa de empresa com autorização da agência nacional do gás, lugar para guardar os botijões do tamanho permitido e liberação dos Bombeiros e da prefeitura. Não comece a vender antes.",
        "Autorização da ANP (Agência Nacional do Petróleo, Gás Natural e Biocombustíveis) para revenda de GLP (gás liquefeito de petróleo); a área de armazenamento segue a classe autorizada. Regras: Resolução ANP 958/2023 e ABNT NBR 15514."],
    "Com mais gás, os Bombeiros costumam exigir abrigo ou central de gás, feita por profissional habilitado (com ART ou RRT), conforme a norma de gás do seu estado e a ABNT NBR 13523. Confirme antes de comprar os cilindros ou fazer a instalação.":
      ["Com mais gás, os Bombeiros costumam exigir um abrigo ou uma central de gás, feita por engenheiro ou arquiteto que assina como responsável, conforme as regras do seu estado. Confirme antes de comprar os cilindros ou fazer a instalação.",
        "Documento de responsabilidade: ART (Anotação de Responsabilidade Técnica) ou RRT (Registro de Responsabilidade Técnica). Normas: a norma de gás dos Bombeiros do estado e a ABNT NBR 13523 (central de gás)."],
    "A revenda de gás só pode ser feita por empresa autorizada pela ANP. Abra a empresa e peça a autorização antes de vender.":
      ["Só empresa com autorização da agência nacional do gás pode vender botijões. Abra a empresa e peça a autorização antes de vender.",
        "ANP = Agência Nacional do Petróleo, Gás Natural e Biocombustíveis (Resolução ANP 958/2023)."],
    "Peça a autorização de revenda de GLP na ANP e a regularização nos Bombeiros antes de vender.":
      ["Peça a autorização para vender gás à agência nacional do gás e a liberação dos Bombeiros antes de vender.",
        "Autorização de revenda de GLP (gás liquefeito de petróleo) na ANP (Agência Nacional do Petróleo, Gás Natural e Biocombustíveis)."],
  };
  const plano = (t) => PLANO[t] ? { t: PLANO[t][0], tec: tecHtml(`<p>${esc(PLANO[t][1])}</p>`) } : { t, tec: "" };
  /* "Ver dica" fechada entre a pergunta e as respostas: a dica curta da pergunta + os termos da Base técnica */
  function dicaHtml(cod) {
    const q = Q[cod] || {};
    const ts = (CONCEITO[cod] || []).map((c) => BASE[c]).filter(Boolean).map((t) => (t.codigo === "M9.BT21" ? conceitoGas(t) : t));
    /* pergunta que perdeu o "Não sei": os passos de "Como descobrir" viram ajuda para decidir, dentro da dica */
    const decidir = Mo.SEM_NS.includes(cod) && (q.comoDescobrir || []).length ? `<div class="para-decidir"><b>Para decidir</b><ol>${q.comoDescobrir.map((x) => `<li>${esc(x)}</li>`).join("")}</ol>${q.comoTec ? tecHtml(`<p>${esc(q.comoTec)}</p>`) : ""}</div>` : "";
    if (!q.dica && !ts.length && !decidir) return "";
    return `<details class="dica-toggle"><summary>Ver dica</summary>${q.dica ? `<p class="ajuda">${esc(q.dica)}</p>` : ""}${decidir}${conceitosHtml(ts)}</details>`;
  }
  /* linguagem simples: exemplo curto e visível embaixo da pergunta e das opções com termo difícil.
     O texto da opção não muda (outros módulos comparam o valor salvo); o exemplo é uma linha à parte. */
  function exemploPergunta(cod, X) {
    if (cod === "M9-04") return "Ex.: perguntar se pode abrir um salão ou uma lanchonete naquele endereço.";
    if (cod === "M9-05") return "Ex.: IPTU ou contrato mostram a área; um cômodo de 6 m × 4 m tem 24 m².";
    if (cod === "M9-10") return "Ex.: nutricionista, veterinário, engenheiro, contador, educador físico.";
    return "";
  }
  const EX_OPCAO = {
    "Sim, alimentos ou bebidas": "Ex.: bolo, marmita, salgado, suco.",
    "Sim, cosméticos, saneantes, medicamentos ou produtos para a saúde": "Ex.: sabonete, perfume, produto de limpeza, remédio.",
    "Sim, procedimentos no corpo ou cuidado com pessoas": "Ex.: cabelo, unha, massagem, cuidador de idosos.",
    "Sim, animais": "Ex.: banho e tosa, ração, pet shop.",
    [Mo.O.semLocal]: "Ex.: vende pelo Instagram, vai até o cliente, vende na feira.",
    [Mo.O.domicilio]: "Ex.: manicure ou cabeleireira que vai até a cliente.",
    "Sim, gás encanado da rua (gás natural)": "Ex.: tem medidor e conta da companhia de gás.",
    "Vou vender gás de cozinha (revenda)": "Ex.: vender botijões para os vizinhos.",
    "Sim, em maior quantidade ou para vender": "Ex.: galões de álcool, tintas para revender.",
    "Área separada, de uso exclusivo, com equipamentos exclusivos": "Ex.: um cômodo ou bancada só do negócio, com utensílios só do trabalho.",
    "Sim, obra que muda estrutura, área ou uso": "Ex.: derrubar parede, aumentar um cômodo, virar a garagem em loja.",
    "Só pequenos reparos": "Ex.: pintura, troca de piso ou de tomada.",
  };
  /* ---------- notas novas: alimento, trabalho em casa, Bombeiros do estado ---------- */
  const quemVende = (X) => X.alimentoTexto && X.alimentoTexto === X.cnae ? `A atividade que você escolheu (${X.alimentoTexto}) é de alimentos` : `Você vende “${X.alimentoTexto}”`;
  const avisoAlimentoNao = (X) => `${quemVende(X)}: alimentos normalmente passam pela Vigilância Sanitária. Confira.`;
  function cidadeJF(X) { const uf = Mo.op(S.R, "M9-01"); return /juiz de fora/i.test(X.cidade || "") || (!X.cidade && uf === "Minas Gerais"); }
  function notaCasa(X, apto) {
    const ondeConfirmar = cidadeJF(X)
      ? "Em Juiz de Fora, tire as dúvidas na Sala do Empreendedor da prefeitura."
      : "Tire as dúvidas na prefeitura ou na Sala do Empreendedor da sua cidade, se houver.";
    return [
      "No MEI, é comum registrar o negócio no endereço de casa quando a atividade não precisa de um local próprio.",
      "Se clientes forem até a sua casa ou se você trabalhar com alimentos, a prefeitura ou a Vigilância Sanitária podem pedir vistoria ou licença do espaço.",
      `Antes de registrar, confira na prefeitura se a atividade é permitida na sua rua (as regras de uso e ocupação do solo da cidade, que dizem onde pode ter comércio; ex.: algumas ruas só aceitam casas). ${ondeConfirmar}`,
      apto ? "Em apartamento ou condomínio, confira também o que a convenção do condomínio permite." : "",
    ].filter(Boolean);
  }
  /* atendimento em domicílio: sem alvará de ponto próprio, mas a atividade pode pedir licença */
  function notaDomicilio(X) {
    return [
      "Como você atende na casa do cliente, não precisa de alvará para um ponto próprio.",
      "Alvará é a licença da prefeitura para um negócio funcionar num endereço.",
      "Mas a atividade em si pode precisar de licença, por exemplo da Vigilância Sanitária (procedimentos no corpo, como cabelo, unhas e estética) ou do conselho da profissão.",
      "O registro do negócio ainda pede um endereço, em geral o da sua casa.",
      cidadeJF(X) ? "Em Juiz de Fora, confira na Sala do Empreendedor da prefeitura." : "Confira na prefeitura ou na Sala do Empreendedor da sua cidade.",
    ];
  }
  const blocoCasa = (X, apto) => `<div class="bloco b-proximo extra nota-casa"><b>Trabalhar em casa</b>${notaCasa(X, apto).map((t) => `<p>${esc(t)}</p>`).join("")}</div>`;
  function textoAlimento(X) {
    return [
      "Quem faz ou vende alimentos normalmente precisa da licença sanitária (o alvará da Vigilância Sanitária: a autorização que mostra que o local e o preparo da comida são seguros), mesmo sendo MEI e mesmo trabalhando em casa.",
      "Siga as boas práticas de manipulação de alimentos: mãos, local e utensílios limpos; ingredientes e produtos guardados na temperatura certa e dentro da validade; embalagem com rótulo.",
      "Faça um curso de boas práticas ou de manipulação de alimentos. Ele ajuda a vender com segurança e pode ser pedido pela Vigilância Sanitária. Há cursos gratuitos ou de baixo custo, por exemplo no Sebrae.",
      `Confira as exigências com a Vigilância Sanitária da ${cidadeJF(X) ? "prefeitura de Juiz de Fora" : "sua cidade"}.`,
    ];
  }
  /* norma de gás dos Bombeiros: a do Rio de Janeiro (fonte do grupo) só vale para quem está no RJ */
  const RJ = "Rio de Janeiro";
  function bombeirosEstado() {
    const uf = Mo.op(S.R, "M9-01");
    if (uf === "Minas Gerais") return "Confira as regras do Corpo de Bombeiros de MG para gás e prevenção de incêndio.";
    if (uf && uf !== NS && uf !== RJ) return `Confira as regras do Corpo de Bombeiros do seu estado (${uf}) para gás e prevenção de incêndio.`;
    if (uf === RJ) return "";
    return "Confira as regras do Corpo de Bombeiros do seu estado para gás e prevenção de incêndio.";
  }
  /* conceito do gás: tira os exemplos de outros estados (RJ, PR) e a fonte do RJ para quem não está lá */
  function conceitoGas(t) {
    const uf = Mo.op(S.R, "M9-01");
    const frases = t.definicao.split(/(?<=\.)\s+(?=[A-ZÀ-Ú])/).filter((f) => !(/^No Rio de Janeiro/.test(f) && uf !== RJ) && !(/^No Paraná/.test(f) && uf !== "Paraná"));
    return Object.assign({}, t, { definicao: frases.join(" "), semFonte: uf !== RJ });
  }
  const instr = (nome) => D.instrumentos.find((x) => x.nome.startsWith(nome)) || {};

  /* ================= capa ================= */
  function telaCapa() {
    const K = D.mapa, X = contexto();
    const comecou = Object.keys(S.R).length > 0;
    const herdado = [
      X.descricao ? ["O que você faz", X.descricao, 8] : X.oferta ? ["O que você vende", X.oferta, 1] : null,
      X.cnpj ? ["CNPJ", X.cnpj, 8] : null,
      X.cnae ? ["Código da sua atividade (CNAE)", X.cnae, 8] : null,
      X.estado ? ["Estado", X.estado, 3] : null,
    ].filter(Boolean);
    /* versão leve: título + uma frase + tempo + Começar; o resto fica em "Como funciona" (fechado) */
    const p = el(`<div class="pag">
      ${topo("")}
      ${heroi({ grande: true, h1: true, kicker: "Etapa 9", titulo: D.modulo.nome, texto: D.capa.frase })}
      <main class="corpo">
        <details class="como-funciona cartao"><summary>Como funciona</summary>
          <h3>Para quem é</h3><p>${esc(K.usuario)}</p>
          <h3>O que ter em mãos</h3><p>${esc(K.ter_em_maos)}</p>
          <h3>O que você recebe no final</h3><p>${esc(K.entrega)}</p>
          ${herdado.length ? `<h3>Do que você já respondeu</h3>${herdado.map(([r, v, m]) => `<p class="diag-q">${esc(r)} <span class="veio">Veio da Etapa ${m}</span></p><p class="diag-r">${esc(v)}</p>`).join("")}` : ""}
          <h3>O que esta etapa não faz</h3><p>${esc(K.nao_faz)}</p>
          <p class="aviso">${esc(K.mensagem_limite)}</p>
        </details>
        <p class="tempo">Esta etapa leva cerca de ${esc(D.capa.minutos)} minutos</p>
        <div class="acoes">
          <button class="btn btn-primario seta" id="ir">${comecou ? "Continuar de onde parei" : "Começar"}</button>
          ${comecou ? `<button class="btn btn-linha" id="zerar">Recomeçar do zero</button>` : ""}
        </div>
        ${rodape(true)}
      </main>
    </div>`);
    p.querySelector("#ir").onclick = () => {
      S.voltarResumo = false;
      irProxima();
    };
    ligar(p);
    return p;
  }

  function limparInvisiveis() {
    const vis = new Set(Mo.sequencia(S.R));
    Object.keys(S.R).forEach((k) => { if (k !== "M9-14" && !vis.has(k)) delete S.R[k]; });
  }

  /* G (lote 17/11): barra de progresso estável. Toda sequência possível segue esta ordem; a posição da pergunta nela
     (e não na sequência atual, que cresce ou encolhe com as respostas) faz a barra só andar para a frente. */
  const ORDEM = ["M9-01", "M9-02", "M9-03", "M9-03b", "M9-03a", "M9-04", "M9-05", "M9-06", "M9-07", "M9-07a", "M9-07b", "M9-07c", "M9-08", "M9-09", "M9-10", "M9-11", "M9-12", "M9-13"];
  const progresso = (cod) => Math.round((ORDEM.indexOf(cod) + 1) / ORDEM.length * 100);

  /* ================= pergunta ================= */
  function telaPergunta(cod) {
    const q = Q[cod];
    const seq = Mo.sequencia(S.R);
    const n = Math.max(1, seq.indexOf(cod) + 1);
    const X = contexto();
    const resp = S.R[cod];
    const ultima = cod === "M9-13";
    /* cartão "Veio do Módulo N · Trocar": as puladas agora + as herdadas logo antes desta pergunta
       (assim o cartão continua à vista depois de Voltar e responder uma pergunta anterior) */
    const antesHerdadas = [];
    for (let i = seq.indexOf(cod) - 1; i >= 0 && S.R[seq[i]] && S.R[seq[i]].herdado; i--) antesHerdadas.unshift(seq[i]);
    const agoraPulados = [...new Set([...pulados, ...antesHerdadas])]; pulados = [];
    const p = el(`<div class="pag">
      ${heroi({ compacta: true, pct: progresso(cod) })}
      <main class="corpo">
        <div class="cartao-q pergunta">
          ${botaoVoltar()}
          ${cartaoHerdado(agoraPulados)}
          <h2 class="q" id="pergunta" tabindex="-1">${esc(enunciado(cod))}</h2>
          ${exemploPergunta(cod, X) ? `<p class="ex-q">${esc(exemploPergunta(cod, X))}</p>` : ""}
          ${dicaHtml(cod)}
          <div class="entrada" id="ent"></div>
          <div id="retorno" aria-live="polite"></div>
          <div class="pe-fixo" id="pe">
            <div class="erro" id="erro" role="alert" hidden></div>
            <div class="acoes" id="acoes"><button class="btn btn-primario seta" id="ok">${ultima ? "Ver meu checklist" : "Continuar"}</button></div>
          </div>
        </div>
        ${rodape()}
      </main>
    </div>`);
    const ent = p.querySelector("#ent"), box = p.querySelector("#retorno"), err = p.querySelector("#erro"), ok = p.querySelector("#ok");
    const mostrar = (html) => { box.innerHTML = html || ""; err.hidden = true; ligar(box); };
    const erro = (t) => { err.textContent = t; err.hidden = false; };
    /* C (lote 17/11): depois do toque, se o retorno ficou escondido atrás do Continuar (celular pequeno ou deitado), a tela
       sobe o bastante para o começo dele aparecer */
    const verRetorno = () => {
      if (!box.textContent.trim() || !document.contains(box)) return;
      const r = box.getBoundingClientRect(), limite = p.querySelector("#pe").getBoundingClientRect().top - 24;
      if (r.top > limite) window.scrollBy(0, r.top - Math.min(limite, window.innerHeight * 0.45));
    };
    p.querySelector("#v").onclick = () => {
      const s = Mo.sequencia(S.R), i = s.indexOf(cod);
      if (S.voltarResumo) { S.voltarResumo = false; salvar(); return ir(telaResultado); }
      if (S.trocando) { S.trocando = false; salvar(); return irProxima(); }
      /* as perguntas que vieram de outro módulo não reaparecem no Voltar (ficam no cartão "Trocar") */
      const ant = s.slice(0, Math.max(0, i)).reverse().find((c) => !(S.R[c] && S.R[c].herdado));
      ant ? ir(telaPergunta, ant) : ir(telaCapa);
    };
    ligar(p);

    function avancar(r0) {
      S.R[cod] = r0;
      limparInvisiveis();
      salvar();
      const s2 = Mo.sequencia(S.R);
      if (S.trocando) { S.trocando = false; salvar(); return irProxima(); }
      if (S.voltarResumo && s2.every((c) => S.R[c])) { S.voltarResumo = false; salvar(); return ir(telaResultado); }
      let prox = s2.slice(s2.indexOf(cod) + 1).find((c) => !S.voltarResumo || !S.R[c]) || s2[s2.indexOf(cod) + 1];
      /* a próxima já veio de outro módulo (gravada antes ou agora): pula para a 1ª que falta */
      if (prox && (!S.R[prox] ? limpo(prox, contexto(), S.R) : S.R[prox].herdado)) return irProxima(cod);
      prox ? ir(telaPergunta, prox) : ir(telaResultado);
    }
    /* cruzamentos com a opção marcada agora */
    const cruzAgora = (r0) => Mo.cruzamentos(D, Object.assign({}, S.R, { [cod]: r0 }), X).filter((c) => c.cod === cod).map(cruzBox).join("");
    const veio = (m) => `<p class="veio-linha"><span class="veio">Veio da Etapa ${m}</span> Confira e ajuste se quiser.</p>`;
    let coletar = null;

    if (cod === "M9-01") {
      /* sem "Não sei": todo mundo sabe em que estado está; resposta antiga "Não sei" não vale e a pergunta é feita de novo */
      const resp1 = resp && resp.estado === "opcao" ? resp : null;
      let r0 = resp1 || (X.estado ? { estado: "opcao", opcao: X.estado, de: 3 } : null);
      const sel = el(`<div><label class="rot-campo" for="uf">Estado</label><select class="campo" id="uf"><option value="">Escolha o estado</option>${D.viabilidade.estados.map((e) => `<option ${r0 && r0.opcao === e.estado ? "selected" : ""}>${esc(e.estado)}</option>`).join("")}</select></div>`);
      const ret = () => mostrar(!r0 ? "" : caixa(q.caminhos[0].texto, { estado: r0.opcao }));
      sel.querySelector("select").onchange = (e) => { r0 = e.target.value ? { estado: "opcao", opcao: e.target.value } : null; ret(); verRetorno(); };
      if (!resp1 && X.estado) ent.appendChild(el(veio(3)));
      ent.appendChild(sel);
      ret();
      coletar = () => { if (!r0) { erro("Escolha o estado onde você vai trabalhar."); return null; } const { de, ...r } = r0; return r; };
    } else if (cod === "M9-05") {
      const v0 = resp && resp.estado === "valor" ? resp.valor : "";
      let naosei = false;   // "Não sei" só mostra a ajuda; nunca é gravado
      const w = el(`<div><div class="linha"><input class="campo" id="area" inputmode="decimal" aria-label="Área em m²" placeholder="Ex.: 60" value="${esc(v0)}"><span class="unid">m²</span></div>
        <div class="opcoes"><button class="opcao ${naosei ? "sel" : ""}" type="button" aria-pressed="${naosei}" id="nsb"><span class="radio" aria-hidden="true"></span><span class="op-txt"><b>${NS}</b></span></button></div></div>`);
      const inp = w.querySelector("#area"), nb = w.querySelector("#nsb");
      const num = (s) => { s = String(s || "").trim(); if (!/^\d{1,3}(\.\d{3})*(,\d+)?$|^\d+([.,]\d+)?$/.test(s)) return NaN; return Number(s.includes(",") ? s.replace(/\./g, "").replace(",", ".") : s); };
      const ret = () => {
        if (naosei) return mostrar(caixaComo(cod, "", caixaNS(Mo.caminho(D, cod, NS).texto)));
        const s = inp.value.trim();
        if (!s) return mostrar("");
        const x = num(s);
        mostrar(x > 0 ? caixa(q.caminhos.find((c) => c.opcao.startsWith("Área informada")).texto) : caixa(q.caminhos.find((c) => c.opcao === "Valor inválido").texto));
      };
      /* A (lote 17/11): o retorno do número aparece ao sair do campo ou 700 ms depois da última tecla (sem piscar
         "valor inválido" no meio da digitação); a ajuda do "Não sei" sai na hora */
      let espera = 0;
      inp.oninput = () => { if (naosei) mostrar(""); naosei = false; nb.classList.remove("sel"); nb.setAttribute("aria-pressed", "false"); clearTimeout(espera); espera = setTimeout(ret, 700); };
      inp.onchange = () => { clearTimeout(espera); ret(); };
      nb.onclick = () => { clearTimeout(espera); naosei = true; inp.value = ""; nb.classList.add("sel"); nb.setAttribute("aria-pressed", "true"); ret(); verRetorno(); };
      ent.appendChild(w);
      ret();
      coletar = () => {
        if (naosei) { erro(NS_AREA); return null; }
        const s = inp.value.trim();
        if (!s) { erro("Informe a área. Se não souber, toque em “Não sei” para ver como descobrir."); return null; }
        if (!(num(s) > 0)) { ret(); return null; }
        return { estado: "valor", valor: s };
      };
    } else if (cod === "M9-13") {
      const v0 = resp && resp.estado === "valor" ? resp.valor : "";
      const ta = el(`<textarea class="campo" rows="4" id="ideias" aria-label="Suas ideias" placeholder="Ex.: vender também em feiras; chamar minha irmã para ajudar nas encomendas.">${esc(v0)}</textarea>`);
      const ret = () => mostrar(caixa(q.caminhos.find((c) => c.opcao === (ta.value.trim() ? "Texto preenchido" : "Em branco")).texto));
      ta.oninput = ret;
      ent.appendChild(ta);
      if (resp) ret();
      coletar = () => ({ estado: "valor", valor: ta.value.trim() });
    } else {
      /* escolha única com retorno ao tocar */
      const ops = Mo.opcoes(D, cod);
      const h = resp ? null : herdado(cod, X, S.R);
      const pre = h && ops.includes(h.op) ? h.op : null;
      let op = resp && resp.estado === "opcao" ? resp.opcao : pre;
      const wrap = el(`<div class="opcoes"></div>`);
      /* "Outra atividade" (M9-02): campo para escrever qual */
      const outraBox = cod === "M9-02" ? el(`<div class="outra-box" id="outra-box" hidden><label class="rot-campo" for="outra">Qual é a sua atividade?</label>
        <input class="campo" id="outra" data-falar placeholder="Ex.: revenda de joias" value="${esc(resp && resp.detalhe ? resp.detalhe : "")}"></div>`) : null;
      const pintar = () => {
        wrap.querySelectorAll(".opcao").forEach((x) => { x.classList.toggle("sel", x.dataset.v === op); x.setAttribute("aria-pressed", String(x.dataset.v === op)); });
        if (outraBox) outraBox.hidden = op !== Mo.O.outra;
      };
      const ret = () => {
        if (!op) { mostrar(""); return; }
        const c = Mo.caminho(D, cod, op);
        /* "Não sei": a ajuda "Como descobrir" com o texto do documento dentro; nada é gravado */
        if (ehNS(cod, op)) return mostrar(caixaComo(cod, "", caixaNS(c.texto)) || caixaNS(c.texto));
        mostrar(caixa(c.texto) + extras(op) + cruzAgora({ estado: "opcao", opcao: op }));
      };
      /* notas novas ao tocar: alimento com "Não" na pergunta de saúde; trabalho em casa */
      const extras = (o) => {
        if (cod === "M9-02" && o === "Não" && X.alimento) return `<div class="bloco b-alerta extra aviso-alimento"><b>Confira</b><p>${esc(avisoAlimentoNao(X))}</p></div>`;
        if (cod === "M9-03" && (o === Mo.O.casa || o === Mo.O.apto)) return blocoCasa(X, o === Mo.O.apto);
        if (cod === "M9-03b" && (o === Mo.O.pCasa || o === Mo.O.pApto)) return blocoCasa(X, o === Mo.O.pApto);
        return "";
      };
      if (pre) ent.appendChild(el(veio(h.m)));
      else if (resp && resp.herdado) ent.appendChild(el(veio(resp.herdado)));
      else if (!resp && cod === "M9-02" && X.m4Regulada) ent.appendChild(el(`<p class="veio-linha"><span class="veio">Veio da Etapa 4</span> Lá você disse que sua oferta tem regras específicas para vender. Escolha abaixo qual é o seu caso.</p>`));
      else if (cod === "M9-02" && X.alimento) ent.appendChild(el(`<p class="veio-linha dica-alimento">${esc(quemVende(X))}. Alimentos costumam afetar a saúde de quem compra.</p>`));
      ops.forEach((o) => {
        const b = el(`<button class="opcao" type="button" aria-pressed="false" data-v="${esc(o)}"><span class="radio" aria-hidden="true"></span><span class="op-txt"><b>${esc(o)}</b>${EX_OPCAO[o] ? `<span class="op-ex">${esc(EX_OPCAO[o])}</span>` : ""}</span></button>`);
        b.onclick = () => { op = o; pintar(); ret(); if (o === Mo.O.outra) outraBox.querySelector("#outra").focus(); else verRetorno(); };
        wrap.appendChild(b);
      });
      ent.appendChild(wrap);
      if (outraBox) { ent.appendChild(outraBox); outraBox.querySelector("#outra").oninput = () => { err.hidden = true; }; }
      pintar();
      if (op) ret();
      coletar = () => {
        if (!op) { erro("Escolha uma opção para continuar."); return null; }
        if (op === Mo.O.outra) {
          const d = outraBox.querySelector("#outra").value.trim();
          if (!d) { erro("Escreva qual é a sua atividade."); outraBox.querySelector("#outra").focus(); return null; }
          return { estado: "opcao", opcao: op, detalhe: d };
        }
        if (ehNS(cod, op)) { erro(NS_ESCOLHA); return null; }
        return { estado: "opcao", opcao: op };
      };
    }
    ok.onclick = () => { const r0 = coletar(); if (r0) avancar(r0); };
    /* C (lote 17/11): Continuar e a mensagem de erro ficam presos ao pé da tela (.pe-fixo), com teclado aberto também */
    return p;
  }

  /* ================= "O que entendemos até aqui": frases por regra, juntando este módulo e os anteriores ================= */
  /* texto corrido: as frases de cada assunto viram um parágrafo (1 a 3 parágrafos curtos, sem lista) */
  const emParagrafos = (fr, ...cortes) => [0, ...cortes].map((c, i, a) => fr.slice(c, i + 1 < a.length ? a[i + 1] : fr.length).join(" ")).filter(Boolean);
  function entendemos(X, R, itens, enc) {
    const f = [], L = Mo.local(R), o1 = Mo.op(R, "M9-01"), o2 = Mo.op(R, "M9-02"), o3a = Mo.op(R, "M9-03a"), o4 = Mo.op(R, "M9-04");
    const TIPO = { "Serviço": "um serviço (o cliente paga pelo seu trabalho)", "Produto": "um produto que você mesmo faz", "Mercadoria": "mercadoria que você compra pronta para revender" };
    const EST = { ideia: "você ainda não começou a vender", testes: "você já fez testes ou amostras", vende: "você já vende" };
    if (X.ideia) f.push(`Seu negócio é “${X.ideia}”${X.tipo ? `, ${TIPO[X.tipo]}` : ""}${X.estagio ? `, e ${EST[X.estagio]}` : ""}.`);
    else if (X.tipo || X.estagio) f.push(cap1([X.tipo ? `seu negócio é ${TIPO[X.tipo]}` : "", X.estagio ? EST[X.estagio] : ""].filter(Boolean).join(", e ")) + ".");
    const uf = o1 && o1 !== NS ? ` (${o1})` : "";
    const NOME = { casa: "na sua casa", apto: "num apartamento ou condomínio", loja: "numa loja ou sala comercial" };
    if (L.tipo) f.push(`Você ${L.planejado ? "pretende trabalhar" : "vai trabalhar"} ${NOME[L.tipo]}${uf}.`);
    else if (L.domicilio) f.push(`Você vai atender na casa do cliente, em domicílio${uf}.`);
    else if (L.forma === "remoto") f.push(`Você não terá local fixo: ${o3a === Mo.O.cliente ? "vai atender na casa ou na empresa do cliente" : "vai atender pela internet ou por telefone"}${uf}.`);
    else if (L.forma === "rua") f.push(`Você vai trabalhar na rua, em feiras ou eventos${uf}.`);
    else f.push(`O lugar onde você vai trabalhar ainda não está definido${uf}.`);
    const c1 = f.length;   // 1º parágrafo: o negócio e o lugar; 2º: saúde, conselho e prefeitura; 3º: o checklist
    if (Mo.sanitario(R)) f.push("Como o que você faz pode afetar a saúde de quem compra ou é atendido, a Vigilância Sanitária faz parte do seu caminho.");
    else if (o2 === "Não" && X.alimento) f.push(`Você respondeu que o que faz não afeta a saúde de quem compra, mas ${quemVende(X).replace(/^Você/, "você").replace(/^A atividade/, "a atividade")}. Alimentos normalmente passam pela Vigilância Sanitária: confira.`);
    else if (o2 === "Não") f.push("Pelo que você respondeu, o que você faz não afeta a saúde de quem compra, então a Vigilância Sanitária não entra no seu caminho.");
    else if (o2 === Mo.O.outra) f.push(`Sua atividade${R["M9-02"].detalhe ? ` (“${R["M9-02"].detalhe}”)` : ""} não está nas opções de saúde; confira na prefeitura se ela precisa de alguma licença ou autorização.`);
    else f.push("Ainda falta saber se o que você faz pode afetar a saúde de quem compra ou é atendido.");
    if (Mo.op(R, "M9-10") === "Sim") f.push("Sua atividade precisa de um profissional formado e registrado em conselho.");
    f.push(o4 === Mo.O.aprovada ? "A prefeitura já confirmou que a atividade pode funcionar no endereço."
      : o4 === Mo.O.negada ? "A prefeitura não liberou a atividade nesse endereço, então será preciso pensar em outro local."
        : "Ainda falta confirmar com a prefeitura se a atividade pode funcionar no endereço que você vai usar.");
    const c2 = f.length;
    const nf = itens.filter((i) => i.sit === Mo.SIT.fazer).length, nc = itens.filter((i) => i.sit === Mo.SIT.conf).length;
    const pl = (n, s, p) => `${n} ${n === 1 ? s : p}`;
    f.push(nf + nc === 0 ? "Pelo que você respondeu, não há nenhum passo pendente no seu checklist."
      : `No seu checklist há ${pl(nf, "passo", "passos")} a fazer e ${pl(nc, "item", "itens")} a confirmar${enc ? `; comece por: ${enc.item.toLowerCase()} (${Mo.ORGAOS[enc.orgao].nome})` : ""}.`);
    return emParagrafos(f.slice(0, 6), c1, c2);
  }

  /* B (lote 16/11): a conta do número de pendências, mostrada junto do número */
  function comoCalculamos(itens) {
    const n = (s) => itens.filter((i) => i.sit === s).length;
    const f = n(Mo.SIT.fazer), c = n(Mo.SIT.conf);
    return `Como calculamos: ${f} ${f === 1 ? "item" : "itens"} “a fazer” + ${c} “a confirmar” = ${f + c} ${f + c === 1 ? "pendente" : "pendentes"}. Itens feitos ou que não se aplicam não entram.`;
  }
  /* D (lote 16/11): o que é cada item do checklist, em palavras simples e com exemplo */
  const O_QUE_E = {
    viabilidade: "O que é: perguntar à prefeitura se o seu tipo de negócio pode funcionar naquele endereço. Ex.: algumas ruas só aceitam casas, não comércio.",
    local: "O que é: conferir se o lugar serve para o negócio: tamanho, quantas pessoas vão lá e, em prédio, o que o condomínio permite.",
    gas: "O que é: conferir se o gás e os produtos que pegam fogo estão guardados do jeito seguro. Ex.: botijão em lugar aberto e ventilado.",
    bombeiros: "O que é: os Bombeiros conferem se o local é seguro contra incêndio (extintor, saída, gás). Quando aprovam, dão um documento: a licença dos Bombeiros.",
    vigilancia: "O que é: a Vigilância Sanitária é o setor da prefeitura que cuida da saúde de quem compra. Ex.: confere a cozinha de quem vende marmita ou o salão de beleza.",
    ambulante: "O que é: a autorização da prefeitura para vender na rua, em feira ou em carrinho.",
    conselho: "O que é: o órgão de cada profissão (de nutricionistas, de veterinários, de engenheiros...). Algumas atividades precisam de um profissional registrado nele.",
    ambiente: "O que é: conferir se o trabalho suja o ar, a água ou faz barulho demais. Ex.: fumaça de forno a lenha, tinta jogada no ralo.",
    obra: "O que é: obra grande no local precisa de autorização da prefeitura. Ex.: derrubar parede ou aumentar a área.",
  };
  /* nomes técnicos dos documentos, só em "Detalhes técnicos" */
  const O_QUE_E_TEC = {
    bombeiros: "Nome técnico do documento: AVCB (Auto de Vistoria do Corpo de Bombeiros), CLCB (Certificado de Licença do Corpo de Bombeiros) ou equivalente; o nome muda de estado para estado.",
    gas: "GLP = gás liquefeito de petróleo (o gás de cozinha). As regras seguem a norma de gás dos Bombeiros do estado e as normas da ABNT (NBR 13523, central de gás; NBR 15526, rede interna; NBR 13103, ventilação dos aparelhos).",
    obra: "O profissional responsável registra a obra numa ART (Anotação de Responsabilidade Técnica, de engenheiro) ou num RRT (Registro de Responsabilidade Técnica, de arquiteto).",
  };
  /* ================= resultado: checklist e resumo (tela M9-14) ================= */
  /* item I (16/11): no resultado, todo painel recolhível vem ABERTO; o que a pessoa fechar continua fechado ao redesenhar */
  const fechados = new Set();
  /* para imprimir, os painéis fechados abrem (senão o papel sai sem o checklist) */
  const abrirTudo = (r) => (r || document).querySelectorAll("details").forEach((d) => { d.open = true; });
  window.addEventListener("beforeprint", () => abrirTudo());
  function telaResultado() {
    pulados = [];
    const X = contexto();
    const R = S.R, seq = Mo.sequencia(R);
    const itens = Mo.checklist(D, R, S.feitos, X);
    const ale = Mo.alertas(D, R, X), prox = Mo.proximos(D, R, itens), enc = Mo.encaminhamento(itens), orgs = Mo.orgaos(itens);
    const L = Mo.local(R);
    const q14 = Q["M9-14"], r14 = R["M9-14"];
    const estado = Mo.op(R, "M9-01");
    const linkUF = Mo.linkEstado(D, R);
    /* o endereço do portal do estado (vindo de "[link do estado]") aparece com nome simples, como na pergunta */
    const bonito = (h) => h.split(`>${esc(linkUF)}</a>`).join(`>${esc(nomeLinkEstado())}</a>`);
    const linkOrgao = (k) => k === "prefeitura"
      ? { u: linkUF, t: estado && estado !== NS ? `verificação do endereço na prefeitura · ${estado}` : "verificação do endereço na prefeitura · portais de todos os estados", d: D.viabilidade.data }
      : { u: BASE[Mo.ORGAOS[k].base].link, t: BASE[Mo.ORGAOS[k].base].referencia, d: BASE[Mo.ORGAOS[k].base].data };
    /* na tela, o link tem nome simples; o nome da lei ou norma fica em "Detalhes técnicos" */
    const linkSimples = (k) => { const l = linkOrgao(k); return k === "prefeitura" ? link(l.u, l.t) : `${link(l.u, "Ver a regra oficial")}${tecHtml(`<p>Regra: ${esc(l.t)}</p>`)}`; };
    /* respostas que explicam cada item */
    const LIGA = { viabilidade: ["M9-04"], local: ["M9-05", "M9-06", "M9-08", "M9-09"], gas: ["M9-07", "M9-07a", "M9-07b", "M9-07c"], bombeiros: ["M9-06", "M9-07", "M9-07c"], vigilancia: ["M9-02", "M9-09"], ambulante: ["M9-03a"], conselho: ["M9-10"], ambiente: ["M9-11"], obra: ["M9-12"] };
    const resposta = (c) => { const v = Mo.op(R, c); return v == null ? "" : c === "M9-05" && v !== NS ? `${v} m²` : R[c].detalhe ? `${v}: ${R[c].detalhe}` : v; };
    const cls = { "feito": "e-sim", "a fazer": "e-fazer", "não se aplica": "e-nao", "a confirmar": "e-conf" };
    const I1 = instr("Checklist"), I2 = instr("Nível de risco"), I3 = instr("Lista de órgãos"), I4 = instr("Linha-resumo");
    const datas = [...new Set(orgs.map((k) => linkOrgao(k).d))].join(" e ");
    const respostas = seq.map((k) => [enunciado(k), k]);
    const ia = D.pedidos_ia[0];
    const iaTexto = ia.texto.replace("[município/UF]", estado && estado !== NS ? `[seu município]/${estado}` : "[município/UF]").replace("[descrição do Módulo 8]", X.descricao || X.oferta || "[o que você vende ou faz]");
    /* "Não sei" (e "Ainda não faço ideia" do local) que ficaram no percurso: cada um com a sua ajuda */
    const faltam = seq.filter((c) => R[c] && (R[c].estado === "naosei" || ehNS(c, R[c].opcao)) && (Q[c].comoDescobrir || []).length);
    const nPend = itens.filter((i) => i.sit === Mo.SIT.fazer || i.sit === Mo.SIT.conf).length;
    /* primeiro o que importa (o que entendemos, a próxima tarefa, o que falta descobrir); o resto em painéis que já vêm abertos */
    const p = el(`<div class="pag">
      ${topo("Resultado")}
      ${heroi({ kicker: "Resultado", kickerClasse: "passo", titulo: "Seu checklist de endereço e licenças", extra: chipNegocio() })}
      <main class="corpo">
        ${botaoVoltar()}
        <section class="concluido">
          <div class="conc-topo"><span class="check" aria-hidden="true"></span><div><h2>Você concluiu a Etapa 9</h2><p>Comece pela sua próxima tarefa.</p></div></div>
        </section>
        <section class="cartao entendemos" id="entendemos"><h3>O que entendemos até aqui</h3>${entendemos(X, R, itens, enc).map((f) => `<p>${esc(f)}</p>`).join("")}</section>
        ${cartaoHerdado(seq)}
        ${enc ? `<section class="cartao tarefa" id="encaminhamento"><h3>Sua próxima tarefa</h3><div class="bloco b-enc"><p>${esc(Mo.ORGAOS[enc.orgao].nome)} · ${esc(enc.item)}</p><p>${linkSimples(enc.orgao)}</p></div></section>`
          : prox.length ? `<section class="cartao tarefa" id="tarefa"><h3>Sua próxima tarefa</h3><p>${bonito(comLinks(plano(prox[0]).t))}</p>${plano(prox[0]).tec}</section>` : ""}
        ${faltam.length ? `<section class="cartao b-lacuna" id="falta"><h3>O que falta descobrir</h3><ul>${faltam.map((c) => `<li><span>${esc(enunciado(c))}</span><details class="como-mini"><summary>Como descobrir</summary>${caixaComo(c)}</details></li>`).join("")}</ul></section>` : ""}
        <details class="resultado-mais" id="mais-checklist"><summary>Ver seu checklist (${nPend} ${nPend === 1 ? "item pendente" : "itens pendentes"})<span class="como-calc" id="calc-pend"> ${esc(comoCalculamos(itens))}</span></summary>
        ${L.planejado ? `<div class="bloco b-proximo"><b>Local pretendido</b><p>${esc(Mo.caminho(D, "M9-03b", Mo.op(R, "M9-03b")).texto)}</p></div>` : ""}
        <div id="checklist">${itens.map((it) => `
          <div class="etapa ${cls[it.sit]}" data-item="${it.id}">
            <div class="etapa-topo"><b>${esc(it.nome)}</b>${it.hipotese ? `<span class="hip">hipótese</span>` : ""}<span class="sit">${esc(it.sit)}</span></div>
            ${O_QUE_E[it.id] ? `<p class="mini-info o-que-e">${esc(O_QUE_E[it.id])}</p>` : ""}
            ${O_QUE_E_TEC[it.id] ? tecHtml(`<p>${esc(O_QUE_E_TEC[it.id])}</p>`) : ""}
            ${it.motivo ? `<p class="mini-info">${esc(it.motivo)}</p>` : ""}
            ${LIGA[it.id].filter((c) => seq.includes(c) && R[c]).map((c) => `<p class="mini-info resp"><b>${esc(Q[c].descobre)}:</b> ${esc(resposta(c))}</p>`).join("")}
            ${it.avisos.map((a) => `<p class="aviso-ck">⚠ Atenção: ${esc(a)}</p>`).join("")}
            ${it.sit === "não se aplica" ? "" : `<p class="mini-info"><b>Onde confirmar:</b> ${it.orgaos.map((k) => esc(Mo.ORGAOS[k].nome)).join(" · ")}</p>
              ${(it.id === "gas" || it.id === "bombeiros") && bombeirosEstado() ? `<p class="mini-info bombeiros-uf">${esc(bombeirosEstado())}</p>` : ""}
              ${it.id === "viabilidade" ? `<p class="fonte">${link(linkUF, linkOrgao("prefeitura").t)}</p>` : tecHtml(`<p class="fonte">Fonte: ${it.id === "gas" && Mo.op(R, "M9-01") !== RJ ? link(BASE["M9.BT14"].link, BASE["M9.BT14"].referencia) : link(BASE[it.base].link, BASE[it.base].referencia)}</p>`)}`}
            ${it.sit === "a fazer" || it.sit === "a confirmar" || it.marcado ? `<label class="chk"><input type="checkbox" data-feito="${it.id}" ${it.marcado ? "checked" : ""}><span>Já fiz</span></label>` : ""}
          </div>`).join("")}</div>
        <p class="aviso-inst">${esc(I1.aviso)}</p>
        </details>
        <details class="resultado-mais" id="mais-detalhes"><summary>Mais detalhes</summary>
        ${ale.length ? `<section class="cartao" id="alertas"><h3>Alertas</h3>${ale.map((a) => { const pl = plano(a); return `<div class="bloco b-alerta"><p>${comLinks(pl.t)}</p>${pl.tec}</div>`; }).join("")}</section>` : ""}
        ${Mo.op(R, "M9-02") === Mo.O.alimentos || X.alimento ? `<section class="cartao" id="alimentos"><h3>Você trabalha com alimentos</h3>
          ${Mo.alimentoSemSaude(R, X) ? `<div class="bloco b-alerta"><b>Confira</b><p>${esc(avisoAlimentoNao(X))}</p></div>` : ""}
          <div class="bloco b-alerta"><b>Licença sanitária e boas práticas</b>${textoAlimento(X).map((t) => `<p>${esc(t)}</p>`).join("")}</div></section>` : ""}
        ${L.domicilio ? `<section class="cartao" id="nota-domicilio"><h3>Atendimento na casa do cliente</h3>${notaDomicilio(X).map((t) => `<p>${esc(t)}</p>`).join("")}</section>` : ""}
        ${L.casaOuApto ? `<section class="cartao" id="nota-casa"><h3>Trabalhar em casa</h3>${notaCasa(X, L.tipo === "apto").map((t) => `<p>${esc(t)}</p>`).join("")}</section>` : ""}
        ${prox.length ? `<section class="cartao" id="proximos"><h3>Próximos passos</h3><ol class="lista-capa">${prox.map((x) => { const pl = plano(x); return `<li>${bonito(comLinks(pl.t))}${pl.tec}</li>`; }).join("")}</ol></section>` : ""}
        <section class="cartao" id="linha-resumo"><h3>Em uma linha</h3><p>${esc(Mo.linhaResumo(D, R, itens))}</p><p class="aviso-inst">${esc(I4.aviso)}</p></section>
        <section class="cartao" id="risco"><h3>Nível de risco provável</h3>
          <p class="diag-r"><b>A confirmar na consulta de viabilidade.</b></p>
          ${X.cnae ? `<p class="diag-q">Código da sua atividade (CNAE) <span class="veio">Veio da Etapa 8</span></p><p class="diag-r">${esc(X.cnae)}</p>` : ""}
          ${X.cnpj ? `<p class="diag-q">CNPJ <span class="veio">Veio da Etapa 8</span></p><p class="diag-r">${esc(X.cnpj)}</p>` : ""}
          <p class="aviso-inst">${esc(I2.aviso)}</p>
        </section>
        ${orgs.length ? `<section class="cartao" id="orgaos"><h3>Órgãos a procurar</h3>${orgs.map((k) => `<p class="diag-q">${esc(Mo.ORGAOS[k].nome)}</p><div class="diag-r">${linkSimples(k)}</div>`).join("")}
          <p class="aviso-inst">${esc(I3.aviso.replace("[data]", datas))}</p></section>` : ""}
        <details class="saiba"><summary><span>${esc(ia.pedido)} (pedido para ferramentas de IA)</span></summary><div class="caixa caixa-ia"><p class="como-nota">Copie, cole numa IA de sua preferência e troque o que está entre colchetes.</p><div class="prompt"><p data-prompt>${esc(iaTexto)}</p><button class="btn-alt copiar" type="button" data-copiar data-rotulo="Copiar texto">Copiar texto</button></div><p class="ex">${esc(ia.conferir)}</p><p class="ex">${esc(ia.obs)}</p></div></details>
        ${termos(TERMOS_RESULTADO)}
        <p class="aviso">${esc(D.mapa.mensagem_limite)}</p>
        </details>
        <section class="cartao-q pergunta" id="q14">
          <h2 class="q">${esc(q14.pergunta)}</h2>
          <div class="opcoes" id="op14">${q14.caminhos.flatMap((c) => c.opcoes).map((o) => `<button class="opcao ${r14 && r14.opcao === o ? "sel" : ""}" type="button" aria-pressed="${!!(r14 && r14.opcao === o)}" data-o="${esc(o)}"><span class="radio" aria-hidden="true"></span><span class="op-txt"><b>${esc(o)}</b></span></button>`).join("")}</div>
          <div id="ret14">${r14 ? caixa(Mo.caminho(D, "M9-14", r14.opcao).texto) : ""}</div>
          <div id="corr" ${r14 && r14.opcao === "Quero corrigir algo" ? "" : "hidden"}>${respostas.map(([tx, k]) => `<div class="corr-item"><span>${esc(tx)}</span><button class="btn btn-claro editar" data-c="${k}">Mudar esta resposta</button></div>`).join("")}</div>
        </section>
        <div class="acoes"><button class="btn btn-primario" id="imprimir">Imprimir resultado</button><button class="btn btn-linha" id="zerar2">Recomeçar do zero</button></div>
        <div class="acoes lg2-proximo"><a class="btn btn-primario" style="text-decoration:none;text-align:center;box-sizing:border-box" href="/lg2/turma-b/m10/index.html">Ir para a Etapa 10</a></div>
        ${rodape(true)}
      </main>
    </div>`);
    /* todo painel do resultado abre por padrão; um painel fechado pela pessoa continua fechado quando a tela se redesenha (marcar "Já fiz") */
    p.querySelectorAll("details").forEach((d) => {
      d.open = !(d.id && fechados.has(d.id));
      d.addEventListener("toggle", () => { if (d.id) (d.open ? fechados.delete(d.id) : fechados.add(d.id)); });
    });
    const re = () => { salvar(); redesenhar(telaResultado); };
    p.querySelector("#v").onclick = () => { const s = Mo.sequencia(S.R); ir(telaPergunta, s[s.length - 1]); };
    p.querySelector("#imprimir").onclick = () => { abrirTudo(p); window.print(); };
    p.querySelectorAll("#op14 .opcao").forEach((b) => (b.onclick = () => { S.R["M9-14"] = { estado: "opcao", opcao: b.dataset.o }; re(); }));
    p.querySelectorAll("[data-c]").forEach((b) => (b.onclick = () => { S.voltarResumo = true; salvar(); ir(telaPergunta, b.dataset.c); }));
    p.querySelectorAll("[data-feito]").forEach((x) => (x.onchange = () => { if (x.checked) S.feitos[x.dataset.feito] = true; else delete S.feitos[x.dataset.feito]; re(); }));
    ligar(p);
    if (aviso) p.querySelector(".corpo").insertBefore(el(`<p class="erro">${esc(aviso)}</p>`), p.querySelector(".corpo").firstChild);
    return p;
  }

  /* teclado do celular: o campo em foco vai para o centro da área visível (e o Continuar logo abaixo dele) */
  let focado = null, timer = 0;
  const centralizar = () => { if (focado && document.activeElement === focado) focado.scrollIntoView({ block: "center" }); };
  document.addEventListener("focusin", (e) => {
    const t = e.target;
    if (!t || !t.matches || !t.matches("input, textarea, select")) return;
    focado = t; clearTimeout(timer); timer = setTimeout(centralizar, 300);
  });
  document.addEventListener("focusout", () => { focado = null; });
  if (window.visualViewport) window.visualViewport.addEventListener("resize", () => { clearTimeout(timer); timer = setTimeout(centralizar, 100); });

  ir(telaCapa);
})();
