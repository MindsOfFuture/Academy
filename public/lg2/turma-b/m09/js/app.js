/* Telas do Módulo 9 (Turma B). Todo texto de conteúdo vem de window.MODULO9 (documento final do
   Grupo 9, 30/10/2026), sem edição. As regras (quais perguntas aparecem, checklist, resumo) ficam em
   motor.js. Lê as respostas dos Módulos 1, 4, 6, 7 e 8 guardadas neste aparelho só para pré-preencher
   e cruzar; nunca escreve nelas. As respostas deste módulo ficam só neste aparelho. */
(function () {
  "use strict";
  const D = window.MODULO9, Mo = window.Motor9;
  const tela = document.getElementById("tela");
  const CHAVE = "lg2-turma-b-m09";
  const VERSAO = 2; // v2 = documento final (códigos M9-01…); descarta as respostas da versão anterior
  const NS = Mo.NS;
  const Q = Object.fromEntries(D.perguntas.map((q) => [q.codigo, q]));
  const BASE = Object.fromEntries(D.base.map((b) => [b.codigo, b]));

  /* ---------- estado ---------- */
  function novo() { return { v: VERSAO, R: {}, feitos: {}, voltarResumo: false }; }
  function carregar() { try { const s = JSON.parse(localStorage.getItem(CHAVE)); return migrar(s && s.v === VERSAO && s.R ? Object.assign(novo(), s) : novo()); } catch (e) { return novo(); } }
  /* o estado (UF) não aceita mais "Não sei": resposta antiga com "Não sei" é apagada e a pergunta volta a ser feita */
  function migrar(s) { const r = s.R["M9-01"]; if (r && (r.estado !== "opcao" || r.opcao === NS)) delete s.R["M9-01"]; return s; }
  let S = carregar();
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
  function ir(f, a) { tela.innerHTML = ""; tela.appendChild(f(a)); window.scrollTo(0, 0); }
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
  function rodape() {
    return `<footer class="rodape">
      <p class="credito">Conteúdo do Laboratório de Gestão II · FACC/UFJF · ${esc(D.modulo.versao)} · ${esc(D.modulo.data)}</p>
      <div class="logos"><img src="assets/logo_facc.png" alt="FACC"><img src="assets/logo_ufjf.svg" alt="UFJF"><img src="assets/logo_mg.svg" alt="Governo de Minas Gerais"></div>
    </footer>`;
  }
  function topo(trilha) {
    return `<div class="barra-topo">
      <img class="logo-mini" src="assets/minds.svg" alt="Minds of the Future">
      <nav class="trilha" aria-label="Você está em"><button class="trilha-link" data-inicio>Início</button><span>/</span><span>Módulo 9</span>${trilha ? `<span>/</span><span>${esc(trilha)}</span>` : ""}</nav>
    </div>`;
  }
  function heroi(o) {
    return `<section class="heroi ${o.grande ? "heroi-grande" : ""}">
      <div class="heroi-topo">
        <div class="heroi-txt">
          <div class="kicker ${o.kickerClasse || ""}">${esc(o.kicker || "Módulo 9")}</div>
          <${o.h1 ? "h1" : "h2"} class="heroi-tit">${esc(o.titulo)}</${o.h1 ? "h1" : "h2"}>
          ${o.texto ? `<p>${esc(o.texto)}</p>` : ""}
        </div>
        <img class="heroi-img" src="assets/${o.grande ? "hero-inicio.webp" : "hero-tela.webp"}" alt="">
      </div>
      ${o.extra || ""}
      ${o.reinicio ? `<button class="reinicio" id="zerar">Recomeçar do zero</button>` : ""}
    </section>`;
  }
  function barraFases(atual, tudo) {
    const fs = D.fases, n = fs.indexOf(atual);
    return `<ol class="etapas" aria-label="Fases do módulo">${fs.map((f, i) => {
      const st = tudo || i < n ? "feita" : i === n ? "atual" : "";
      return `<li class="${st}"${i === n && !tudo ? ' aria-current="step"' : ""}><span class="bola" aria-hidden="true"></span><span class="rot">${esc(f)}</span></li>`;
    }).join("")}</ol>`;
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
    p.querySelectorAll(".btn-copiar").forEach((b) => (b.onclick = () => { try { navigator.clipboard.writeText(b.dataset.t); } catch (e) {} b.textContent = "Copiado"; }));
  }
  function reiniciar() {
    if (!confirm("Apagar todas as respostas deste módulo e recomeçar? Se quiser guardar, imprima o resultado antes.")) return;
    try { localStorage.removeItem(CHAVE); } catch (e) {}
    S = novo();
    ir(telaCapa);
  }
  /* caixa de retorno da opção: texto literal da coluna "Retorno / mensagem sugerida" */
  function caixa(t, extra) {
    if (!t) return "";
    t = String(t).split("[estado]").join(extra && extra.estado ? extra.estado : "[estado]");
    const pa = Mo.partesAviso(t);
    if (pa.atencao) return `<div class="bloco b-ok">${curto(pa.verifique)}</div><div class="bloco b-alerta"><b>⚠ Atenção</b><p>${comLinks(pa.atencao)}</p></div>`;
    if (/^Atenção: /.test(t)) return `<div class="bloco b-alerta"><b>Atenção</b><p>${comLinks(t.replace(/^Atenção: /, ""))}</p></div>`;
    return `<div class="bloco b-ok">${curto(t)}</div>`;
  }
  const cruzBox = (c) => `<div class="bloco ${c.forma === "Dica" ? "b-proximo" : "b-alerta"} cruz"><b>${esc(c.forma)}</b><p>${esc(c.mensagem)}</p></div>`;
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
    return `<details class="saiba"><summary><span>Entenda os termos</span></summary>${ts.map((t) => `<div class="conceito"><b>${esc(t.conceito)}</b><p>${esc(t.definicao)}</p>${t.semFonte ? `<span class="fonte">${esc(bombeirosEstado())}</span>` : `<span class="fonte">Fonte: ${link(t.link, t.referencia)} · consulta em ${esc(t.data)}</span>`}</div>`).join("")}</details>`;
  }
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
      `Antes de registrar, confira na prefeitura se a atividade é permitida na sua rua (as regras de uso e ocupação do solo da cidade). ${ondeConfirmar}`,
      apto ? "Em apartamento ou condomínio, confira também o que a convenção do condomínio permite." : "",
    ].filter(Boolean);
  }
  /* atendimento em domicílio: sem alvará de ponto próprio, mas a atividade pode pedir licença */
  function notaDomicilio(X) {
    return [
      "Como você atende na casa do cliente, não precisa de alvará para um ponto próprio.",
      "Mas a atividade em si pode precisar de licença, por exemplo da Vigilância Sanitária (procedimentos no corpo, como cabelo, unhas e estética) ou do conselho da profissão.",
      "O registro do negócio ainda pede um endereço, em geral o da sua casa.",
      cidadeJF(X) ? "Em Juiz de Fora, confira na Sala do Empreendedor da prefeitura." : "Confira na prefeitura ou na Sala do Empreendedor da sua cidade.",
    ];
  }
  const blocoCasa = (X, apto) => `<div class="bloco b-proximo extra nota-casa"><b>Trabalhar em casa</b>${notaCasa(X, apto).map((t) => `<p>${esc(t)}</p>`).join("")}</div>`;
  function textoAlimento(X) {
    return [
      "Quem faz ou vende alimentos normalmente precisa da licença sanitária (o alvará da Vigilância Sanitária), mesmo sendo MEI e mesmo trabalhando em casa.",
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
      X.cnae ? ["CNAE", X.cnae, 8] : null,
      X.estado ? ["Estado", X.estado, 3] : null,
    ].filter(Boolean);
    const p = el(`<div class="pag">
      ${topo("")}
      ${heroi({ grande: true, h1: true, kicker: "Módulo 9", titulo: D.modulo.nome, texto: K.objetivo })}
      <main class="corpo">
        <div class="cartao"><h3>Para quem é</h3><p>${esc(K.usuario)}</p></div>
        <div class="cartao"><h3>O que ter em mãos</h3><p>${esc(K.ter_em_maos)}</p></div>
        <div class="cartao"><h3>O que você recebe no final</h3><p>${esc(K.entrega)}</p></div>
        ${herdado.length ? `<div class="cartao"><h3>Do que você já respondeu</h3>${herdado.map(([r, v, m]) => `<p class="diag-q">${esc(r)} <span class="veio">Veio do Módulo ${m}</span></p><p class="diag-r">${esc(v)}</p>`).join("")}</div>` : ""}
        <p class="aviso">${esc(K.mensagem_limite)}</p>
        <div class="acoes">
          <button class="btn btn-primario seta" id="ir">${comecou ? "Continuar de onde parei" : "Começar"}</button>
          ${comecou ? `<button class="btn btn-claro" id="zerar">Recomeçar do zero</button>` : ""}
          <button class="btn btn-linha" id="limites">O que este módulo não faz</button>
        </div>
        ${rodape()}
      </main>
    </div>`);
    p.querySelector("#ir").onclick = () => {
      S.voltarResumo = false;
      const falta = Mo.sequencia(S.R).find((c) => !S.R[c]);
      falta ? ir(telaPergunta, falta) : ir(telaResultado);
    };
    p.querySelector("#limites").onclick = () => ir(telaLimites);
    ligar(p);
    return p;
  }

  function telaLimites() {
    const p = el(`<div class="pag">
      ${topo("Limites")}
      ${heroi({ titulo: "Limites do módulo" })}
      <main class="corpo">
        ${botaoVoltar()}
        <div class="cartao"><h3>O que este módulo não faz</h3><p>${esc(D.mapa.nao_faz)}</p></div>
        <p class="aviso">${esc(D.mapa.mensagem_limite)}</p>
        ${rodape()}
      </main>
    </div>`);
    p.querySelector("#v").onclick = () => ir(telaCapa);
    ligar(p);
    return p;
  }

  function limparInvisiveis() {
    const vis = new Set(Mo.sequencia(S.R));
    Object.keys(S.R).forEach((k) => { if (k !== "M9-14" && !vis.has(k)) delete S.R[k]; });
  }

  /* ================= pergunta ================= */
  function telaPergunta(cod) {
    const q = Q[cod];
    const seq = Mo.sequencia(S.R);
    const n = Math.max(1, seq.indexOf(cod) + 1);
    const X = contexto();
    const resp = S.R[cod];
    const ultima = cod === "M9-13";
    const p = el(`<div class="pag">
      ${topo(q.fase)}
      ${heroi({ titulo: q.fase, reinicio: true, kicker: `Pergunta ${n} de ${seq.length}`, kickerClasse: "passo", extra: chipNegocio() })}
      <main class="corpo">
        ${barraFases(q.fase)}
        <div class="cartao-q pergunta">
          ${botaoVoltar()}
          <h2 class="q" id="pergunta">${esc(q.pergunta)}</h2>
          <div class="entrada" id="ent"></div>
          <div class="erro" id="erro" hidden></div>
          <div id="retorno" aria-live="polite"></div>
          <div class="acoes" id="acoes"><button class="btn btn-primario seta" id="ok">${ultima ? "Ver meu checklist" : "Continuar"}</button></div>
          ${termos(CONCEITO[cod])}
        </div>
        ${rodape()}
      </main>
    </div>`);
    const ent = p.querySelector("#ent"), box = p.querySelector("#retorno"), err = p.querySelector("#erro"), ok = p.querySelector("#ok");
    const mostrar = (html) => { box.innerHTML = html || ""; err.hidden = true; };
    const erro = (t) => { err.textContent = t; err.hidden = false; };
    const rotuloOk = (t) => { ok.textContent = t; ok.classList.toggle("seta", t !== "Seguir sem responder"); };
    p.querySelector("#v").onclick = () => {
      const s = Mo.sequencia(S.R), i = s.indexOf(cod);
      if (S.voltarResumo) { S.voltarResumo = false; salvar(); return ir(telaResultado); }
      i > 0 ? ir(telaPergunta, s[i - 1]) : ir(telaCapa);
    };
    ligar(p);

    function avancar(r0) {
      S.R[cod] = r0;
      limparInvisiveis();
      salvar();
      const s2 = Mo.sequencia(S.R);
      if (S.voltarResumo && s2.every((c) => S.R[c])) { S.voltarResumo = false; salvar(); return ir(telaResultado); }
      const prox = s2.slice(s2.indexOf(cod) + 1).find((c) => !S.voltarResumo || !S.R[c]) || s2[s2.indexOf(cod) + 1];
      prox ? ir(telaPergunta, prox) : ir(telaResultado);
    }
    /* cruzamentos com a opção marcada agora */
    const cruzAgora = (r0) => Mo.cruzamentos(D, Object.assign({}, S.R, { [cod]: r0 }), X).filter((c) => c.cod === cod).map(cruzBox).join("");
    const veio = (m) => `<p class="veio-linha"><span class="veio">Veio do Módulo ${m}</span> Confira e ajuste se quiser.</p>`;
    let coletar = null;

    if (cod === "M9-01") {
      /* sem "Não sei": todo mundo sabe em que estado está; resposta antiga "Não sei" não vale e a pergunta é feita de novo */
      const resp1 = resp && resp.estado === "opcao" ? resp : null;
      let r0 = resp1 || (X.estado ? { estado: "opcao", opcao: X.estado, de: 3 } : null);
      const sel = el(`<div><label class="rot-campo" for="uf">Estado</label><select class="campo" id="uf"><option value="">Escolha o estado</option>${D.viabilidade.estados.map((e) => `<option ${r0 && r0.opcao === e.estado ? "selected" : ""}>${esc(e.estado)}</option>`).join("")}</select></div>`);
      const ret = () => mostrar(!r0 ? "" : caixa(q.caminhos[0].texto, { estado: r0.opcao }));
      sel.querySelector("select").onchange = (e) => { r0 = e.target.value ? { estado: "opcao", opcao: e.target.value } : null; ret(); };
      if (!resp1 && X.estado) ent.appendChild(el(veio(3)));
      ent.appendChild(sel);
      ret();
      coletar = () => { if (!r0) { erro("Escolha o estado onde você vai trabalhar."); return null; } const { de, ...r } = r0; return r; };
    } else if (cod === "M9-05") {
      const v0 = resp && resp.estado === "valor" ? resp.valor : "";
      let naosei = !!(resp && resp.estado === "naosei");
      const w = el(`<div><div class="linha"><input class="campo" id="area" inputmode="decimal" aria-label="Área em m²" value="${esc(v0)}"><span class="unid">m²</span></div>
        <div class="opcoes"><button class="opcao ${naosei ? "sel" : ""}" id="nsb"><span class="radio" aria-hidden="true"></span><span class="op-txt"><b>${NS}</b></span></button></div></div>`);
      const inp = w.querySelector("#area"), nb = w.querySelector("#nsb");
      const num = (s) => { s = String(s || "").trim(); if (!/^\d{1,3}(\.\d{3})*(,\d+)?$|^\d+([.,]\d+)?$/.test(s)) return NaN; return Number(s.includes(",") ? s.replace(/\./g, "").replace(",", ".") : s); };
      const ret = () => {
        if (naosei) return mostrar(caixa(Mo.caminho(D, cod, NS).texto));
        const s = inp.value.trim();
        if (!s) return mostrar("");
        const x = num(s);
        mostrar(x > 0 ? caixa(q.caminhos.find((c) => c.opcao.startsWith("Área informada")).texto) : caixa(q.caminhos.find((c) => c.opcao === "Valor inválido").texto));
      };
      inp.oninput = () => { naosei = false; nb.classList.remove("sel"); ret(); };
      nb.onclick = () => { naosei = true; inp.value = ""; nb.classList.add("sel"); ret(); };
      ent.appendChild(w);
      ret();
      coletar = () => {
        if (naosei) return { estado: "naosei" };
        const s = inp.value.trim();
        if (!s) { erro("Informe a área ou toque em “Não sei”."); return null; }
        if (!(num(s) > 0)) { ret(); return null; }
        return { estado: "valor", valor: s };
      };
    } else if (cod === "M9-13") {
      const v0 = resp && resp.estado === "valor" ? resp.valor : "";
      const ta = el(`<textarea class="campo" rows="4" id="ideias" aria-label="Suas ideias">${esc(v0)}</textarea>`);
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
      let op = resp ? (resp.estado === "naosei" ? NS : resp.opcao) : pre;
      let avisando = false;
      const wrap = el(`<div class="opcoes"></div>`);
      /* "Outra atividade" (M9-02): campo para escrever qual */
      const outraBox = cod === "M9-02" ? el(`<div class="outra-box" id="outra-box" hidden><label class="rot-campo" for="outra">Qual é a sua atividade?</label>
        <input class="campo" id="outra" placeholder="Ex.: revenda de joias" value="${esc(resp && resp.detalhe ? resp.detalhe : "")}"></div>`) : null;
      const pintar = () => {
        wrap.querySelectorAll(".opcao").forEach((x) => x.classList.toggle("sel", x.dataset.v === op));
        if (outraBox) outraBox.hidden = op !== Mo.O.outra;
      };
      const ret = () => {
        if (!op) { mostrar(""); avisando = false; rotuloOk("Continuar"); return; }
        const r0 = op === NS ? { estado: "naosei" } : { estado: "opcao", opcao: op };
        const c = Mo.caminho(D, cod, op);
        avisando = op === NS && Mo.AVISO_NS.includes(cod);
        mostrar(caixa(c.texto) + extras(op) + (avisando ? `<div class="acoes ns-acoes"><button class="btn btn-claro" id="verifiquei">Já verifiquei</button></div>` : "") + cruzAgora(r0));
        rotuloOk(avisando ? "Seguir sem responder" : "Continuar");
        const jv = box.querySelector("#verifiquei");
        if (jv) jv.onclick = () => { op = null; pintar(); ret(); p.querySelector("#pergunta").scrollIntoView({ block: "start" }); };
      };
      /* notas novas ao tocar: alimento com "Não" na pergunta de saúde; trabalho em casa */
      const extras = (o) => {
        if (cod === "M9-02" && o === "Não" && X.alimento) return `<div class="bloco b-alerta extra aviso-alimento"><b>Confira</b><p>${esc(avisoAlimentoNao(X))}</p></div>`;
        if (cod === "M9-03" && (o === Mo.O.casa || o === Mo.O.apto)) return blocoCasa(X, o === Mo.O.apto);
        if (cod === "M9-03b" && (o === Mo.O.pCasa || o === Mo.O.pApto)) return blocoCasa(X, o === Mo.O.pApto);
        return "";
      };
      if (pre) ent.appendChild(el(veio(h.m)));
      else if (!resp && cod === "M9-02" && X.m4Regulada) ent.appendChild(el(`<p class="veio-linha"><span class="veio">Veio do Módulo 4</span> Lá você disse que sua oferta tem regras específicas para vender. Escolha abaixo qual é o seu caso.</p>`));
      else if (cod === "M9-02" && X.alimento) ent.appendChild(el(`<p class="veio-linha dica-alimento">${esc(quemVende(X))}. Alimentos costumam afetar a saúde de quem compra.</p>`));
      ops.forEach((o) => {
        const b = el(`<button class="opcao" data-v="${esc(o)}"><span class="radio" aria-hidden="true"></span><span class="op-txt"><b>${esc(o)}</b></span></button>`);
        b.onclick = () => { op = o; pintar(); ret(); if (o === Mo.O.outra) outraBox.querySelector("#outra").focus(); };
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
        return op === NS ? { estado: "naosei" } : { estado: "opcao", opcao: op };
      };
    }
    ok.onclick = () => { const r0 = coletar(); if (r0) avancar(r0); };
    /* campo digitado: o botão fica logo abaixo do campo, para o teclado do celular não escondê-lo */
    if (cod === "M9-05" || cod === "M9-13") err.after(p.querySelector("#acoes"));
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

  /* ================= resultado: checklist e resumo (tela M9-14) ================= */
  function telaResultado() {
    const X = contexto();
    const R = S.R, seq = Mo.sequencia(R);
    const itens = Mo.checklist(D, R, S.feitos, X);
    const ale = Mo.alertas(D, R, X), prox = Mo.proximos(D, R, itens), enc = Mo.encaminhamento(itens), orgs = Mo.orgaos(itens);
    const L = Mo.local(R);
    const q14 = Q["M9-14"], r14 = R["M9-14"];
    const estado = Mo.op(R, "M9-01");
    const linkUF = Mo.linkEstado(D, R);
    const linkOrgao = (k) => k === "prefeitura"
      ? { u: linkUF, t: estado && estado !== NS ? `Consulta de viabilidade · ${estado}` : "Consulta de viabilidade · portais de todos os estados", d: D.viabilidade.data }
      : { u: BASE[Mo.ORGAOS[k].base].link, t: BASE[Mo.ORGAOS[k].base].referencia, d: BASE[Mo.ORGAOS[k].base].data };
    /* respostas que explicam cada item */
    const LIGA = { viabilidade: ["M9-04"], local: ["M9-05", "M9-06", "M9-08", "M9-09"], gas: ["M9-07", "M9-07a", "M9-07b", "M9-07c"], bombeiros: ["M9-06", "M9-07", "M9-07c"], vigilancia: ["M9-02", "M9-09"], ambulante: ["M9-03a"], conselho: ["M9-10"], ambiente: ["M9-11"], obra: ["M9-12"] };
    const resposta = (c) => { const v = Mo.op(R, c); return v == null ? "" : c === "M9-05" && v !== NS ? `${v} m²` : R[c].detalhe ? `${v}: ${R[c].detalhe}` : v; };
    const cls = { "feito": "e-sim", "a fazer": "e-fazer", "não se aplica": "e-nao", "a confirmar": "e-conf" };
    const I1 = instr("Checklist"), I2 = instr("Nível de risco"), I3 = instr("Lista de órgãos"), I4 = instr("Linha-resumo");
    const datas = [...new Set(orgs.map((k) => linkOrgao(k).d))].join(" e ");
    const respostas = seq.map((k) => [Q[k].pergunta, k]);
    const ia = D.pedidos_ia[0];
    const iaTexto = ia.texto.replace("[município/UF]", estado && estado !== NS ? `[seu município]/${estado}` : "[município/UF]").replace("[descrição do Módulo 8]", X.descricao || X.oferta || "[descrição do Módulo 8]");
    const p = el(`<div class="pag">
      ${topo("Resultado")}
      ${heroi({ kicker: "Resultado", kickerClasse: "passo", titulo: "Seu checklist de endereço e licenças", extra: chipNegocio() })}
      <main class="corpo">
        ${botaoVoltar()}
        ${barraFases(null, true)}
        <section class="concluido">
          <div class="conc-topo"><span class="check" aria-hidden="true"></span><div><h2>Você concluiu o Módulo 9</h2><p>Veja abaixo o resultado pelas suas respostas.</p></div></div>
        </section>
        <section class="cartao entendemos" id="entendemos"><h3>O que entendemos até aqui</h3>${entendemos(X, R, itens, enc).map((f) => `<p>${esc(f)}</p>`).join("")}</section>
        ${Mo.op(R, "M9-02") === Mo.O.alimentos || X.alimento ? `<section class="cartao" id="alimentos"><h3>Você trabalha com alimentos</h3>
          ${Mo.alimentoSemSaude(R, X) ? `<div class="bloco b-alerta"><b>Confira</b><p>${esc(avisoAlimentoNao(X))}</p></div>` : ""}
          <div class="bloco b-alerta"><b>Licença sanitária e boas práticas</b>${textoAlimento(X).map((t) => `<p>${esc(t)}</p>`).join("")}</div></section>` : ""}
        ${L.domicilio ? `<section class="cartao" id="nota-domicilio"><h3>Atendimento na casa do cliente</h3>${notaDomicilio(X).map((t) => `<p>${esc(t)}</p>`).join("")}</section>` : ""}
        ${L.casaOuApto ? `<section class="cartao" id="nota-casa"><h3>Trabalhar em casa</h3>${notaCasa(X, L.tipo === "apto").map((t) => `<p>${esc(t)}</p>`).join("")}</section>` : ""}
        <section class="cartao" id="linha-resumo"><h3>Em uma linha</h3><p>${esc(Mo.linhaResumo(D, R, itens))}</p><p class="aviso-inst">${esc(I4.aviso)}</p></section>
        <section class="cartao" id="risco"><h3>Nível de risco provável</h3>
          <p class="diag-r"><b>A confirmar na consulta de viabilidade.</b></p>
          ${X.cnae ? `<p class="diag-q">CNAE <span class="veio">Veio do Módulo 8</span></p><p class="diag-r">${esc(X.cnae)}</p>` : ""}
          ${X.cnpj ? `<p class="diag-q">CNPJ <span class="veio">Veio do Módulo 8</span></p><p class="diag-r">${esc(X.cnpj)}</p>` : ""}
          <p class="aviso-inst">${esc(I2.aviso)}</p>
        </section>
        ${ale.length ? `<section class="cartao" id="alertas"><h3>Alertas</h3>${ale.map((a) => `<div class="bloco b-alerta"><p>${comLinks(a)}</p></div>`).join("")}</section>` : ""}
        ${prox.length ? `<section class="cartao" id="proximos"><h3>Próximos passos</h3><ol class="lista-capa">${prox.map((x) => `<li>${comLinks(x)}</li>`).join("")}</ol></section>` : ""}
        ${enc ? `<section class="cartao" id="encaminhamento"><h3>Encaminhamento</h3><div class="bloco b-enc"><p>${esc(Mo.ORGAOS[enc.orgao].nome)} · ${esc(enc.item)}</p><p>${link(linkOrgao(enc.orgao).u, linkOrgao(enc.orgao).t)}</p></div></section>` : ""}
        <div class="secao-titulo">Checklist</div>
        ${L.planejado ? `<div class="bloco b-proximo"><b>Local pretendido</b><p>${esc(Mo.caminho(D, "M9-03b", Mo.op(R, "M9-03b")).texto)}</p></div>` : ""}
        <div id="checklist">${itens.map((it) => `
          <div class="etapa ${cls[it.sit]}" data-item="${it.id}">
            <div class="etapa-topo"><b>${esc(it.nome)}</b>${it.hipotese ? `<span class="hip">hipótese</span>` : ""}<span class="sit">${esc(it.sit)}</span></div>
            ${it.motivo ? `<p class="mini-info">${esc(it.motivo)}</p>` : ""}
            ${LIGA[it.id].filter((c) => seq.includes(c) && R[c]).map((c) => `<p class="mini-info"><b>${esc(Q[c].descobre)}:</b> ${esc(resposta(c))}</p>`).join("")}
            ${it.avisos.map((a) => `<p class="aviso-ck">⚠ Atenção: ${esc(a)}</p>`).join("")}
            ${it.sit === "não se aplica" ? "" : `<p class="mini-info"><b>Onde confirmar:</b> ${it.orgaos.map((k) => esc(Mo.ORGAOS[k].nome)).join(" · ")}</p>
              ${(it.id === "gas" || it.id === "bombeiros") && bombeirosEstado() ? `<p class="mini-info bombeiros-uf">${esc(bombeirosEstado())}</p>` : ""}
              <p class="fonte">${it.id === "viabilidade" ? link(linkUF, linkOrgao("prefeitura").t) : it.id === "gas" && Mo.op(R, "M9-01") !== RJ ? link(BASE["M9.BT14"].link, BASE["M9.BT14"].referencia) : link(BASE[it.base].link, BASE[it.base].referencia)}</p>`}
            ${it.sit === "a fazer" || it.sit === "a confirmar" || it.marcado ? `<label class="chk"><input type="checkbox" data-feito="${it.id}" ${it.marcado ? "checked" : ""}><span>Já fiz</span></label>` : ""}
          </div>`).join("")}</div>
        <p class="aviso-inst">${esc(I1.aviso)}</p>
        ${orgs.length ? `<section class="cartao" id="orgaos"><h3>Órgãos a procurar</h3>${orgs.map((k) => { const l = linkOrgao(k); return `<p class="diag-q">${esc(Mo.ORGAOS[k].nome)}</p><p class="diag-r">${link(l.u, l.t)}</p>`; }).join("")}
          <p class="aviso-inst">${esc(I3.aviso.replace("[data]", datas))}</p></section>` : ""}
        <details class="saiba"><summary><span>${esc(ia.pedido)} (pedido para ferramentas de IA)</span></summary><div class="caixa caixa-ia"><div class="prompt"><p>${esc(iaTexto)}</p><button class="btn-copiar" data-t="${esc(iaTexto)}">Copiar texto</button></div><p class="ex">${esc(ia.conferir)}</p><p class="ex">${esc(ia.obs)}</p></div></details>
        ${termos(TERMOS_RESULTADO)}
        <p class="aviso">${esc(D.mapa.mensagem_limite)}</p>
        <section class="cartao-q pergunta" id="q14">
          <h2 class="q">${esc(q14.pergunta)}</h2>
          <div class="opcoes" id="op14">${q14.caminhos.flatMap((c) => c.opcoes).map((o) => `<button class="opcao ${r14 && r14.opcao === o ? "sel" : ""}" data-o="${esc(o)}"><span class="radio" aria-hidden="true"></span><span class="op-txt"><b>${esc(o)}</b></span></button>`).join("")}</div>
          <div id="ret14">${r14 ? caixa(Mo.caminho(D, "M9-14", r14.opcao).texto) : ""}</div>
          <div id="corr" ${r14 && r14.opcao === "Quero corrigir algo" ? "" : "hidden"}>${respostas.map(([tx, k]) => `<div class="corr-item"><span>${esc(tx)}</span><button class="btn btn-claro editar" data-c="${k}">Corrigir minha resposta</button></div>`).join("")}</div>
        </section>
        <div class="acoes"><button class="btn btn-primario" id="imprimir">Imprimir resultado</button><button class="btn btn-linha" id="zerar2">Recomeçar do zero</button></div>
        <div class="acoes lg2-proximo"><a class="btn btn-primario" style="text-decoration:none;text-align:center;box-sizing:border-box" href="/lg2/turma-b/m10/index.html">Ir para o Módulo 10</a></div>
        ${rodape()}
      </main>
    </div>`);
    const re = () => { salvar(); redesenhar(telaResultado); };
    p.querySelector("#v").onclick = () => { const s = Mo.sequencia(S.R); ir(telaPergunta, s[s.length - 1]); };
    p.querySelector("#imprimir").onclick = () => window.print();
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
