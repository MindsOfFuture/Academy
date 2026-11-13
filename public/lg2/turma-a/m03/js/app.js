/* Telas do Módulo 3 (Turma A). O texto de conteúdo vem de window.MODULO3 (a planilha do grupo,
   com as correções aprovadas dos testes da turma). As respostas ficam só neste aparelho. */
(function () {
  "use strict";
  const D = window.MODULO3, M = Motor.montar(D);
  const tela = document.getElementById("tela");
  const CHAVE = "lg2-turma-a-m03";
  /* o módulo mudou de turma em 15/10: traz as respostas salvas na chave antiga */
  try { const antiga = localStorage.getItem("lg2-turma-b-m03"); if (antiga && !localStorage.getItem(CHAVE)) localStorage.setItem(CHAVE, antiga); } catch (e) {}
  const vazio = (s) => !s || !String(s).trim() || s === "—" || s === "-";

  /* VERSAO 3: 22 perguntas reescritas. Respostas da versão de 15 perguntas (v1/v2, inclusive as
     trazidas da chave antiga) são descartadas.
     VERSAO 4: perfil do cliente com marcadores e a dor copiada para a pergunta seguinte. As respostas
     da versão 3 têm os mesmos códigos e o mesmo formato: são mantidas (migração).
     VERSAO 5 (testes da turma, nov/2026): os canais de venda ganharam opções de pequeno negócio
     ("Loja física" virou atendimento presencial; "Redes sociais (…WhatsApp)" virou WhatsApp + Instagram)
     e o preço dos concorrentes virou dois campos de número (guarda também min/max). Migração abaixo.
     VERSAO 6 (lote 3, nov/2026): o perfil do cliente aceita pessoas comuns E empresas. A resposta ganha
     "opcoes" (lista); "opcao" continua sendo a primeira marcada, que é o que os outros módulos leem.
     VERSAO 7 (lote 4, relatórios da Ana Luiza): faixa etária infantil no perfil; os exemplos marcados no
     "Não sei" das perguntas de riscos, barreiras e comparação viram resposta. Perguntas escondidas guardam
     as respostas que já existiam. Migração abaixo. */
  const VERSAO = 7;
  const CANAIS_V4 = { "Loja física": ["Atendimento direto ou presencial (loja, feira, ponto)"],
    "Redes sociais (Instagram, Facebook, WhatsApp)": ["WhatsApp (WhatsApp Business)", "Instagram e outras redes sociais (catálogo)"] };
  function migrar4(s) {
    const r13 = s.R && s.R["M3.P13"];
    if (r13 && Array.isArray(r13.opcoes)) {
      const q = M.porCodigo["M3.P13"], novas = [].concat(...r13.opcoes.map((o) => CANAIS_V4[o] || [o]));
      r13.opcoes = q.opcoes.filter((o) => novas.includes(o));
    }
    const r20 = s.R && s.R["M3.P20"];
    if (r20 && r20.estado === "valor" && r20.min == null) {
      const ns = Motor.numeros(r20.valor);
      if (ns.length) { r20.min = Math.min(...ns); r20.max = Math.max(...ns); }
    }
    s.v = 5;
  }
  function migrar5(s) {
    const r10 = s.R && s.R["M3.P10"];
    if (r10 && r10.estado === "opcao" && r10.opcao && !Array.isArray(r10.opcoes)) r10.opcoes = [r10.opcao];
    s.v = 6;
  }
  /* tabela Melhor / Igual / Pior em texto ("Preço: Melhor; Qualidade: Igual; Outro ponto: entrega") */
  function textoTabela(q, tab, outro) {
    const xs = q.criterios.filter((c) => tab && tab[c]).map((c) => `${c}: ${tab[c]}`);
    if (outro) xs.push(`${q.outro || "Outro"}: ${outro}`);
    return xs.join("; ");
  }
  function migrar6(s) {
    const R = s.R || {};
    const r10 = R["M3.P10"];
    if (r10 && r10.campos && r10.campos.Idade) r10.campos.Idade = String(r10.campos.Idade).split(/;\s*/).map((x) => (x === "Até 17 anos" ? "Até 10 anos (infantil); 11 a 17 anos" : x)).join("; ");
    const r07 = R["M3.P07"], q07 = M.porCodigo["M3.P07"];
    if (r07 && r07.estado === "naosei" && Array.isArray(r07.marcados)) {
      const ops = q07.opcoes.filter((o) => r07.marcados.some((m) => Motor.ehNS(o) ? false : String(m).toLowerCase() === o.toLowerCase()));
      if (ops.length) R["M3.P07"] = { estado: "opcoes", opcoes: ops };
    }
    const r12 = R["M3.P12"];
    if (r12 && r12.estado === "naosei" && Array.isArray(r12.marcados) && r12.marcados.length) R["M3.P12"] = { estado: "valor", valor: r12.marcados.join("; ") };
    const r19 = R["M3.P19"], q19 = M.porCodigo["M3.P19"];
    if (r19 && r19.estado === "naosei" && r19.tabela && Object.keys(r19.tabela).length) R["M3.P19"] = { estado: "valor", valor: textoTabela(q19, r19.tabela), tabela: r19.tabela };
    s.v = 7;
  }
  let migrou = false;
  let S = carregar();               // { v, R: respostas, hist: [códigos] }
  function carregar() {
    try {
      const s = JSON.parse(localStorage.getItem(CHAVE));
      if (s && s.v === 3) s.v = 4;
      if (s && s.v === 4) migrar4(s);
      if (s && s.v === 5) { migrar5(s); migrou = true; }
      if (s && s.v === 6) { migrar6(s); migrou = true; }
      const ok = s && s.v === VERSAO && s.R && typeof s.R === "object" && Array.isArray(s.hist) &&
        Object.keys(s.R).every((k) => M.porCodigo[k]) && s.hist.every((k) => k === "RESULTADO" || M.porCodigo[k]);
      return ok ? s : novo();
    } catch (e) { return novo(); }
  }
  function novo() { return { v: VERSAO, R: {}, hist: [] }; }
  function salvar() { try { localStorage.setItem(CHAVE, JSON.stringify(S)); } catch (e) {} }
  if (migrou) salvar();             // o estado migrado fica gravado já na abertura

  /* ===== teclado do celular: o campo em foco (e o Continuar) ficam na parte visível da tela ===== */
  let focoEl = null, focoT = null;
  function centrar() {
    if (!focoEl || document.activeElement !== focoEl || !focoEl.isConnected) return;
    focoEl.scrollIntoView({ block: "center" });
    const ok = document.getElementById("ok"), vh = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    if (!ok) return;
    const b = ok.getBoundingClientRect(), f = focoEl.getBoundingClientRect();
    if (b.bottom > vh) window.scrollBy(0, Math.max(0, Math.min(b.bottom - vh + 8, f.top - 8)));
  }
  document.addEventListener("focusin", (e) => {
    if (!e.target.matches || !e.target.matches("input, textarea, select")) return;
    focoEl = e.target; clearTimeout(focoT); focoT = setTimeout(centrar, 300);
  });
  if (window.visualViewport) window.visualViewport.addEventListener("resize", () => { clearTimeout(focoT); focoT = setTimeout(centrar, 60); });

  /* ===== o que já veio do Módulo 1 (só leitura; nunca grava na chave de outro módulo) ===== */
  function lerOutro(chave, cod) {
    try { const s = JSON.parse(localStorage.getItem(chave)); return (s && s.R && s.R[cod]) || null; } catch (e) { return null; }
  }
  const TIPOS = [["Produto", "um produto que você mesmo faz"], ["Mercadoria", "uma mercadoria que você compra pronta para revender"], ["Serviço", "um serviço"]];
  function heranca() {
    const p03 = lerOutro("lg2-turma-a-m01", "M1.P03"), p03a = lerOutro("lg2-turma-a-m01", "M1.P03A"), p01 = lerOutro("lg2-turma-a-m01", "M1.P01");
    const ideia = p03 && p03.estado === "valor" && !vazio(p03.valor) ? String(p03.valor).trim() : null;
    const t = p03a && p03a.estado === "opcao" ? TIPOS.find((x) => String(p03a.opcao).startsWith(x[0])) : null;
    const op = p01 && p01.estado === "opcao" ? String(p01.opcao) : "";
    const estagio = op === "Ainda está só na minha cabeça" ? "ideia" : /^Já fiz um pouco/.test(op) ? "comecando" : /^Já vend/.test(op) ? "vende" : null;
    /* Módulo 2 (só leitura): tipo de cliente e o que ajuda a marcar o perfil */
    const op2 = (c) => { const r = lerOutro("lg2-turma-b-m02", c); return r && r.estado === "opcao" && r.opcao && !Motor.ehNS(r.opcao) ? String(r.opcao) : null; };
    const m2 = { tipo: op2("M2.P07"), fase: op2("M2.P09"), preco: op2("M2.P10"), onde: op2("M2.P11"), situacao: op2("M2.P12"), pesa: op2("M2.P13") };
    return { ideia, tipo: t ? t[0] : null, tipoFrase: t ? t[1] : null, estagio, m2,
      /* resposta pronta para "em que ramo e o que vende" */
      p01: ideia ? ideia + (t ? ` (${t[0].toLowerCase()})` : "") : null };
  }
  let H = heranca();
  const est = () => H.estagio;
  /* "Ainda está só na minha cabeça" e "Já fiz um pouco para testar": ainda não vende (textos de quem imagina o negócio) */
  const naoVende = () => Motor.naoVende(est());
  const enunciado = (q) => porTipo(Motor.variante(q, est()).pergunta || q.pergunta);
  const rotulo = (q, c) => (Motor.variante(q, est()).campos || {})[c] || c;
  /* prompts: quem ainda não começou "quer vender"; o que vende entra no lugar do colchete */
  /* exemplos por tipo de oferta (Módulo 1): onde o exemplo só serve para produto físico */
  const EX_TIPO = [
    ["Vendo marmitas para trabalhadores do bairro", { "Serviço": "Faço unhas em domicílio para mulheres do bairro", "Mercadoria": "Revendo cosméticos para vizinhas e colegas de trabalho" }],
    ["Quero vender marmitas para trabalhadores do bairro", { "Serviço": "Quero fazer unhas em domicílio para mulheres do bairro", "Mercadoria": "Quero revender cosméticos para vizinhas e colegas de trabalho" }],
    ["quem vende bolo caseiro perde cliente para a padaria ou para o bolo de pote", { "Serviço": "quem faz unhas em casa perde cliente para o salão ou para a cliente que faz sozinha", "Mercadoria": "quem revende cosméticos perde cliente para a farmácia ou para a loja da internet" }],
    ["quem vende bolo caseiro perde cliente para a padaria", { "Serviço": "quem faz unhas em casa perde cliente para o salão", "Mercadoria": "quem revende cosméticos perde cliente para a farmácia" }],
    ["preço dos insumos subindo", { "Serviço": "preço do material de trabalho subindo", "Mercadoria": "preço do fornecedor subindo" }],
    ["vende o mesmo produto", { "Serviço": "faz o mesmo serviço" }],
    ["(ex.: \"bolos perto de mim\")", { "Serviço": "(ex.: \"manicure perto de mim\")", "Mercadoria": "(ex.: \"loja de cosméticos perto de mim\")" }],
    ["entrega no mesmo dia, bolo sob medida, atendimento pelo WhatsApp", { "Serviço": "atendimento em casa, horário à noite, lembrete pelo WhatsApp", "Mercadoria": "entrega no mesmo dia, preço menor que o da loja, parcelamento" }],
    ["entrega atrasada", { "Serviço": "atrasam o horário marcado" }],
    ["(Horário, entrega, forma de atender)", { "Serviço": "(Horário, se atendem em casa, forma de atender)" }],
    ["Ex.: horário, entrega, forma de atender.", { "Serviço": "Ex.: horário, se atendem em casa, forma de atender." }],
    ["Prazo (tempo para entregar)", { "Serviço": "Prazo (tempo para atender)" }],
  ];
  function porTipo(t) {
    let x = String(t ?? "");
    if (!H.tipo) return x;
    EX_TIPO.forEach(([de, para]) => { if (para[H.tipo]) x = x.split(de).join(para[H.tipo]); });
    return x;
  }
  function adaptar(t) {
    let x = porTipo(t);
    if (naoVende()) x = x.replace(/\bEu vendo \[/g, "Eu quero vender [");
    if (H.ideia) x = x.replace(/\[produto ou serviço\]/g, H.ideia);
    return x;
  }
  /* menos texto na tela: ajuda com mais de LIMITE_TEXTO letras mostra a 1ª frase (ou linha); o resto fica em "Ver mais" */
  const LIMITE_TEXTO = 220;
  function partir(t) {
    const x = String(t || "").trim();
    if (x.length <= LIMITE_TEXTO) return [x, ""];
    const m = x.match(/^[^\n]*?[.!?:](?=\s)|^[^\n]+(?=\n)/);
    const a = m ? m[0].trim() : x;
    return a.length < x.length ? [a, x.slice(m[0].length).trim()] : [x, ""];
  }
  const verMais = (resto, dentro) => `<details class="ver-mais"><summary>Ver mais</summary>${dentro || `<p>${esc(resto)}</p>`}</details>`;
  function textoCurto(t) { const [a, b] = partir(t); return `<p>${esc(a)}</p>${b ? verMais(b) : ""}`; }
  /* texto com uma ideia por linha vira lista curta (capa) */
  function listaOuTexto(t) {
    const xs = String(t || "").split("\n").map((x) => x.trim()).filter(Boolean);
    return xs.length > 1 ? `<ul class="lista-capa">${xs.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : textoCurto(t);
  }
  /* escolha única que continua única: diz como escolher quando mais de uma parece servir */
  const AJUDA_UNICA = { "M3.P09": "Se você vende em mais de um desses lugares, escolha o mais distante." };
  const selo = (txt) => `<p class="selo-m">${esc(txt)}</p>`;
  const SELO_M1 = "Veio do Módulo 1. Confira e ajuste se quiser.";
  const SELO_DOR = "Veio do perfil do cliente que você descreveu. Confira e ajuste se quiser.";
  const SELO_M2 = "Veio do Módulo 2. Confira e troque se quiser.";
  const NOTA_PERFIL = "Marcamos o que você já respondeu antes. Confira e ajuste se quiser.";
  /* aviso de risco antes de todo prompt de IA e frase de conferir depois (texto pedido no relatório da Ana Luiza) */
  const AVISO_IA_TIT = "USE A IA COM CUIDADO";
  const AVISO_IA = "Peça perguntas, não conclusões sobre o mercado. A IA pode ajudar a entender melhor seu negócio e público, mas não conhece o seu cliente real nem tem dados atualizados de mercado. Use-a para organizar o roteiro de entrevista e busque as respostas de verdade conversando com pessoas.";
  const CONFERIR_IA = "Confira sempre se as respostas oferecidas pela IA combinam com o que você realmente faz, descarte qualquer número ou estatística que ela mencionar sem indicar uma fonte confiável.";
  /* "Não sei" ajuda a responder, mas não responde: a pessoa segue depois de escrever no campo da pergunta */
  const MSG_ESCREVA = "Escreva a sua resposta no campo acima para continuar. Se não souber, toque em “Não sei” para ver uma sugestão.";
  const NOTA_NS = "Use a sugestão e escreva a sua resposta no campo da pergunta. Você segue depois de responder.";
  const NOTA_NS_PERFIL = "Use a sugestão para imaginar o seu cliente ideal e marque acima quem você imagina que compraria de você.";
  /* Módulo 2 → perfil do cliente (só o que tem equivalente direto; o resto a pessoa marca) */
  const M2_TIPO = { "Pessoas": ["Pessoas comuns (consumidor final)"], "Empresas": ["Empresas"], "Os dois": ["Pessoas comuns (consumidor final)", "Empresas"] };
  const LUG = ["No meu bairro ou arredores (local)", "Em vários bairros da minha cidade", "Em outras cidades da região", "Em todo o Brasil (vendas online/entrega)"];
  const M2_ONDE = { "Meu bairro": [LUG[0]], "Minha cidade/região": [LUG[1]], "Outras cidades/online": [LUG[2], LUG[3]] };
  const P09_ONDE = { "No meu bairro e na minha cidade": [LUG[0], LUG[1]], "Na minha região (estado e cidades próximas)": [LUG[2]], "No Brasil todo": [LUG[3]], "Também fora do Brasil": [LUG[3]] };
  const DORES = ["Economizar dinheiro / Buscar o menor preço", "Economizar tempo / Praticidade no dia a dia", "Resolver uma emergência ou problema imediato", "Buscar qualidade, status ou experiência diferenciada"];
  const M2_DOR = { "Busca o menor preço": DORES[0], "Necessidade urgente": DORES[2], "Preço": DORES[0], "Praticidade/rapidez": DORES[1], "Qualidade": DORES[3] };
  /* perfil inicial do cliente: tipo do Módulo 2 e marcas que já dá para saber (Módulo 2 ou a pergunta "até onde você vende") */
  function perfilInicial(R) {
    const m2 = H.m2 || {}, campos = {};
    const ops = (m2.tipo && M2_TIPO[m2.tipo]) || [];
    const junta = (xs) => [...new Set(xs.filter(Boolean))].join("; ");
    if (m2.fase === "Idosos/aposentados") { campos.Idade = "60 anos ou mais"; campos["Ocupação"] = "Aposentados"; }
    if (m2.fase === "Jovens/estudantes") campos["Ocupação"] = "Estudantes";
    const p09 = R["M3.P09"], lugar = (m2.onde && M2_ONDE[m2.onde]) || (p09 && p09.estado === "opcao" && P09_ONDE[p09.opcao]) || [];
    if (lugar.length) { campos["Onde mora"] = junta(lugar); campos.Local = junta(lugar); }
    const dor = junta([m2.preco, m2.situacao, m2.pesa].map((x) => M2_DOR[x]));
    if (dor) campos[Motor.DOR] = dor;
    return { ops, campos, doM2: ops.length > 0 };
  }
  function posicao(cod) {
    const ts = Motor.telas(M, S.R, H), k = ts.findIndex((t) => t.includes(cod));
    return k >= 0 ? `Pergunta ${k + 1} de ${ts.length}` : "Ajuste a sua resposta";
  }
  /* grava uma resposta; a dor escrita no perfil do cliente vira a resposta da pergunta seguinte */
  function gravarR(cod, r) {
    S.R[cod] = r;
    if (cod === "M3.P10") {
      const d = Motor.dorDoPerfil(S.R), p11 = S.R["M3.P11"];
      if (d && (!p11 || p11.doPerfil || (p11.estado === "valor" && vazio(p11.valor)))) S.R["M3.P11"] = { estado: "valor", valor: d, doPerfil: true };
      else if (!d && p11 && p11.doPerfil) delete S.R["M3.P11"];
    }
    /* "Não" na pergunta 2: as perguntas puladas não ficam no resumo */
    Object.keys(S.R).forEach((k) => { if (!Motor.visivel(M.porCodigo[k], S.R)) delete S.R[k]; });
    salvar();
  }

  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  function el(html) { const d = document.createElement("div"); d.innerHTML = html.trim(); return d.firstElementChild; }
  function ir(f, a, b) { H = heranca(); tela.innerHTML = ""; tela.appendChild(f(a, b)); window.scrollTo(0, 0); }

  function copiar(t, b) {
    const ok = () => (b.textContent = "Copiado");
    const reserva = () => {
      const a = document.createElement("textarea"); a.value = t; document.body.appendChild(a); a.select();
      try { document.execCommand("copy"); } catch (e) {} a.remove(); ok();
    };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(ok, reserva); else reserva();
  }

  /* caixa de retorno: Dica / Resposta / Alerta / Prompt de IA / Passo a passo (tipo "Nenhum" não aparece) */
  function caixa(c) {
    const cls = { Dica: "b-dica", Resposta: "b-resp", Alerta: "b-alerta", "Prompt de IA": "b-ia", "Passo a passo": "b-passos" }[c.tipo] || "b-dica";
    c = Object.assign({}, c, { texto: adaptar(c.texto) });
    let corpo = textoCurto(c.texto), tit = c.tipo;
    if (c.tipo === "Prompt de IA") {
      /* mesmo gabarito em todo prompt: aviso de risco, prompt para copiar e a frase de conferir */
      const p = Motor.partesPrompt(c.texto);
      tit = AVISO_IA_TIT;
      corpo = `<p class="ia-aviso">${esc(AVISO_IA)}</p>${p.antes ? `<p class="antes">${esc(p.antes)}</p>` : ""}
        <div class="prompt"><p class="prompt-txt">${esc(p.prompt)}</p><button class="btn-copiar" type="button">Copiar texto</button></div>
        <p class="conferir">${esc(CONFERIR_IA)}</p>`;
    } else if (c.tipo === "Passo a passo") {
      /* texto antes do "1." (ex.: "Tudo bem, …") fica como frase de abertura, fora da lista */
      const ps = Motor.passos(c.texto), intro = /^\s*1\.\s/.test(c.texto) ? "" : ps.shift();
      /* passo a passo longo: os 2 primeiros passos à vista, os outros em "Ver mais" */
      const vis = c.texto.length > LIMITE_TEXTO ? ps.slice(0, 2) : ps, resto = ps.slice(vis.length);
      corpo = `${intro ? `<p class="antes">${esc(intro)}</p>` : ""}<ol class="passos">${vis.map((s) => `<li>${esc(s)}</li>`).join("")}</ol>` +
        (resto.length ? verMais("", `<ol class="passos" start="${vis.length + 1}">${resto.map((s) => `<li>${esc(s)}</li>`).join("")}</ol>`) : "");
    }
    const b = el(`<div class="bloco caminho ${cls}" data-op="${esc(c.opcao)}" data-tipo="${esc(c.tipo)}" role="${c.tipo === "Alerta" ? "alert" : "note"}"><b>${esc(tit)}</b>${corpo}</div>`);
    const bc = b.querySelector(".btn-copiar");
    if (bc) bc.onclick = () => copiar(b.querySelector(".prompt-txt").textContent, bc);
    return b;
  }
  function mostrar(box, lista) {
    box.innerHTML = "";
    lista.filter((c) => c.tipo !== "Nenhum").forEach((c) => box.appendChild(caixa(c)));
  }

  /* ================= peças do layout (as mesmas do Módulo 5) ================= */
  function topo(trilha) {
    return `<div class="barra-topo">
      <img class="logo-mini" src="assets/minds.svg" alt="Minds of the Future">
      <nav class="trilha" aria-label="Você está em"><button class="trilha-link" type="button" data-inicio>Início</button><span>/</span><span>Módulo ${esc(D.modulo.numero)}</span>${trilha ? `<span>/</span><span>${esc(trilha)}</span>` : ""}</nav>
    </div>`;
  }
  function heroi(o) {
    return `<section class="heroi ${o.grande ? "heroi-grande" : ""}">
      <div class="heroi-topo">
        <div class="heroi-txt">
          <div class="kicker ${o.kickerClasse || ""}">${esc(o.kicker || "Módulo " + D.modulo.numero)}</div>
          <${o.h1 ? "h1" : "h2"} class="heroi-tit ${o.titClasse || ""}">${esc(o.titulo)}</${o.h1 ? "h1" : "h2"}>
          ${o.texto ? `<p>${esc(o.texto)}</p>` : ""}
        </div>
        <img class="heroi-img" src="assets/${o.img || "hero-tela.webp"}" alt="">
      </div>
    </section>`;
  }
  /* etapas = os 4 blocos da planilha ("Bloco 1: ..." aparece como "Bloco 1"; o nome inteiro fica na faixa) */
  const curto = (b) => String(b).split(":")[0].trim();
  function etapas(n, tudo) {
    return `<ol class="etapas" aria-label="Blocos do módulo">${D.blocos.map((nome, i) => {
      const k = i + 1, st = tudo || k < n ? "feita" : k === n ? "atual" : "";
      return `<li class="${st}"${k === n && !tudo ? ' aria-current="step"' : ""}><span class="bola" aria-hidden="true"></span><span class="rot">${esc(curto(nome))}</span></li>`;
    }).join("")}</ol>`;
  }
  /* "Voltar" no topo do cartão, à esquerda, acima da pergunta (mesmo lugar em todos os módulos); a seta é desenhada */
  const botaoVoltar = () => `<div class="voltar-topo"><button class="btn-voltar voltar" id="v" type="button">Voltar</button></div>`;
  /* "Quando procurar um profissional": só aparece se o módulo de fato encaminhar alguém (neste, nenhuma regra encaminha) */
  const ENCAMINHA = !/^\s*Nenhum/i.test(D.mapa.encaminhamentos || "Nenhum");
  function ligar(p) { p.querySelectorAll("[data-inicio]").forEach((b) => { b.onclick = () => ir(telaCapa); }); }

  /* ================= capa ================= */
  function telaCapa() {
    const iniciado = S.hist.length > 0;
    const p = el(`
      <div class="pag">
        ${topo("")}
        ${heroi({ grande: true, h1: true, titulo: D.modulo.titulo_capa || D.modulo.nome, texto: D.mapa.objetivo, img: "hero-inicio.webp" })}
        <main class="corpo">
          <div class="cartao"><h3>Para quem é</h3><p>${esc(D.mapa.usuario)}</p></div>
          <div class="cartao"><h3>O que ter em mãos</h3>${listaOuTexto(D.mapa.ter_em_maos)}</div>
          <div class="cartao"><h3>O que você recebe no final</h3>${listaOuTexto(D.mapa.entrega)}</div>
          <div class="acoes">
            <button class="btn btn-primario seta" id="ir">${iniciado ? "Continuar de onde parei" : "Começar"}</button>
            ${iniciado ? `<button class="btn btn-claro" id="zerar">Recomeçar do zero</button>` : ""}
            <button class="btn btn-linha" id="limites">O que este módulo não faz</button>
          </div>
          ${rodape()}
        </main>
      </div>`);
    p.querySelector("#ir").onclick = () => {
      const atual = S.hist[S.hist.length - 1];
      if (atual === "RESULTADO") ir(telaResultado);
      else ir(telaPergunta, atual || Motor.proxima(M, S.R, null, H));
    };
    const z = p.querySelector("#zerar");
    if (z) z.onclick = () => { if (confirm("Apagar suas respostas e recomeçar?")) { S = novo(); salvar(); ir(telaCapa); } };
    p.querySelector("#limites").onclick = () => ir(telaLimites);
    ligar(p);
    return p;
  }

  function telaLimites() {
    const p = el(`
      <div class="pag">
        ${topo("Limites")}
        ${heroi({ titulo: "Limites do módulo" })}
        <main class="corpo">
          ${botaoVoltar()}
          <div class="cartao"><h3>O que o módulo não faz</h3><p>${esc(D.mapa.nao_faz)}</p></div>
          <div class="cartao"><h3>Que decisões ele apoia</h3><p>${esc(D.mapa.decisoes)}</p></div>
          ${ENCAMINHA ? `<div class="cartao encaminha"><h3>Quando procurar um profissional</h3><p>${esc(D.mapa.encaminhamentos)}</p></div>` : ""}
          <div class="aviso">${esc(D.mapa.mensagem_limite)}</div>
          ${rodape()}
        </main>
      </div>`);
    ligar(p);
    p.querySelector("#v").onclick = () => ir(telaCapa);
    return p;
  }

  /* ================= pergunta ================= */
  /* lote 4: a dica aparece junto com a pergunta; "Não sei" mostra uma sugestão e não responde (a pessoa só
     segue depois de escrever no campo da pergunta); o prompt de IA vem com o aviso de risco. */
  function telaPergunta(cod, doResumo) {
    const q = M.porCodigo[cod];
    if (S.hist[S.hist.length - 1] !== cod) { S.hist.push(cod); salvar(); }
    const tipo = Motor.campo(q), varias = Motor.varias(q);
    let resp = S.R[cod] || null;
    /* resposta que já veio de antes: aparece preenchida, com o selo */
    let seloTxt = "", notaPerfil = false;
    /* o que vende veio do Módulo 1: bloco fixo só para confirmar (dá para trocar) */
    const doM1 = cod === "M3.P01" && H.p01 && (!resp || resp.doM1);
    if (doM1) { resp = { estado: "valor", valor: H.p01, doM1: true }; seloTxt = SELO_M1; }
    const confirmar = doM1 && !doResumo;
    if (cod === "M3.P11" && resp && resp.doPerfil) seloTxt = SELO_DOR;
    let escolhida = resp && resp.opcao ? resp.opcao : null;
    let marcadas = resp && resp.opcoes ? resp.opcoes.slice() : resp && resp.estado === "naosei" && tipo === "multipla" ? [Motor.NS] : [];
    /* pergunta que virou de marcar: a resposta antiga em texto vira "Outro" com o texto (nada se perde) */
    if (tipo === "multipla" && resp && resp.estado === "valor" && !vazio(resp.valor)) { marcadas = ["Outro"]; resp = Object.assign({}, resp, { detalhe: resp.valor }); }
    /* perfil do cliente: "marcadas" = opções marcadas; "escolhida" = a primeira delas */
    if (varias) marcadas = Motor.opcoesDe(resp && resp.estado === "opcao" ? resp : null).slice();
    /* o que já foi escrito nos campos não se perde ao marcar ou desmarcar outra opção */
    const rasc = Object.assign({}, resp && resp.estado === "opcao" && resp.campos);
    if (cod === "M3.P10" && !(resp && resp.estado === "opcao")) {
      const ini = perfilInicial(S.R);
      if (ini.doM2) { marcadas = ini.ops.slice(); escolhida = marcadas[0]; seloTxt = SELO_M2; }
      Object.assign(rasc, ini.campos);
      notaPerfil = Object.keys(ini.campos).length > 0;
    }
    /* pedido da equipe (12/11): em pergunta de escrever, a dica fica dentro do campo (some quando a pessoa digita) */
    const dicaNoCampo = tipo === "texto" && !vazio(q.dica);
    const rotNS = q.rotulo_naosei || Motor.NS;
    const rotOp = (op) => (op === Motor.NS ? rotNS : op);

    const p = el(`
      <div class="pag">
        ${topo(curto(q.bloco))}
        ${heroi({ kicker: posicao(cod), kickerClasse: "passo", titulo: q.bloco, titClasse: "bloco-nome" })}
        ${etapas(D.blocos.indexOf(q.bloco) + 1)}
        <main class="corpo">
          <div class="cartao-q">
          ${botaoVoltar()}
          <div class="pergunta">
            <h2 class="q">${esc(enunciado(q))}</h2>
            ${seloTxt ? selo(seloTxt) : ""}
            ${q.dica && !dicaNoCampo ? `<div class="bloco dica-q" role="note"><b>Dica</b>${textoCurto(q.dica)}</div>` : ""}
            ${tipo === "multipla" || varias ? `<p class="mini-info">Você pode marcar mais de uma opção.</p>` : ""}
            ${AJUDA_UNICA[cod] ? `<p class="mini-info">${esc(AJUDA_UNICA[cod])}</p>` : ""}
            ${confirmar ? `<div class="herdado" id="herdado"><p class="herdado-txt">${esc(H.p01)}</p><button class="btn-alt" id="trocar" type="button">Trocar</button></div>` : ""}
            <div class="entrada" id="ent"></div>
            ${(q.naosei && tipo !== "multipla") || q.nao ? `<div class="alt" id="alt">${q.nao ? `<button class="btn-alt" id="nao" type="button" aria-pressed="false">${Motor.NAO}</button>` : ""}${q.naosei && tipo !== "multipla" ? `<button class="btn-alt" id="ns" type="button" aria-pressed="false">${esc(rotNS)}</button>` : ""}</div>` : ""}
            <div id="ajudans"></div>
            <div class="erro" id="erro" hidden></div>
            <div id="msg"></div>
          </div>
          <div class="acoes" id="acoes"></div>
          </div>
          ${rodape()}
        </main>
      </div>`);
    ligar(p);

    p.querySelector("#v").onclick = () => {
      if (doResumo) { S.hist.pop(); salvar(); return ir(telaResultado); }
      S.hist.pop();
      const ant = S.hist.pop();
      salvar();
      if (ant === "RESULTADO") ir(telaResultado); else if (ant) ir(telaPergunta, ant); else ir(telaCapa);
    };

    const ent = p.querySelector("#ent"), msg = p.querySelector("#msg"), ajudans = p.querySelector("#ajudans"), acoes = p.querySelector("#acoes");
    const erroBox = p.querySelector("#erro"), alt = p.querySelector("#alt");
    function erro(t) { erroBox.textContent = t; erroBox.hidden = false; }

    function botoes(modo) {
      /* modo: "continuar" (normal) | "seguir" (há retorno para ler) | "mesmo" (dica para corrigir) */
      acoes.innerHTML = "";
      const rot = modo === "seguir" ? "Seguir" : modo === "mesmo" ? "Continuar mesmo assim" : "Continuar";
      const b = el(`<button class="btn btn-primario seta" id="ok">${rot}</button>`);
      b.onclick = modo === "continuar" ? continuar : modo === "mesmo" ? () => { gravar(coletar()); avancar(); } : avancar;
      acoes.appendChild(b);
    }
    function avancar() {
      if (doResumo) { S.hist.pop(); S.hist.push("RESULTADO"); salvar(); return ir(telaResultado); }
      const prox = Motor.proxima(M, S.R, cod, H);
      if (prox === "RESULTADO") { S.hist.push("RESULTADO"); salvar(); ir(telaResultado); } else ir(telaPergunta, prox);
    }
    const reabrir = () => { erroBox.hidden = true; msg.innerHTML = ""; botoes("continuar"); };

    /* ---- entradas por tipo ---- */
    let outro = null, camposBox = null, tab = null, outroT = null;
    if (tipo === "escolha" || tipo === "escolhacampos" || tipo === "multipla") {
      ent.classList.add("opcoes");
      /* escolha única (Sim/Não e outras): grupo de rádio; tocar uma opção desmarca as outras */
      const multi = tipo === "multipla" || varias;
      ent.setAttribute("role", multi ? "group" : "radiogroup");
      ent.setAttribute("aria-label", enunciado(q));
      q.opcoes.forEach((op) => {
        const b = el(`<button class="opcao" type="button" ${multi ? 'role="checkbox"' : 'role="radio"'}><span class="radio" aria-hidden="true"></span><span class="op-txt"><b>${esc(rotOp(op))}</b></span></button>`);
        b.dataset.op = op;
        b.onclick = () => {
          if (tipo === "multipla") {
            if (marcadas.includes(op)) marcadas = marcadas.filter((x) => x !== op);
            /* "Não sei" é exclusivo */
            else marcadas = op === Motor.NS ? [op] : marcadas.filter((x) => x !== Motor.NS).concat(op);
          } else if (varias) {
            marcadas = marcadas.includes(op) ? marcadas.filter((x) => x !== op) : q.opcoes.filter((o) => o === op || marcadas.includes(o));
            escolhida = marcadas[0] || null;
            if (b.blur) b.blur();
          } else {
            escolhida = op;
            ent.querySelectorAll(".opcao").forEach((x) => { if (x !== b) { x.classList.remove("sel"); x.setAttribute("aria-checked", "false"); x.blur(); } });
          }
          erroBox.hidden = true;
          botoes("continuar");
          pintar();
        };
        ent.appendChild(b);
      });
      if (q.opcoes.includes("Outro")) {
        outro = el(`<label class="item extra"><span>Outro</span><textarea class="campo" rows="2">${esc(resp && resp.detalhe)}</textarea></label>`);
        ent.after(outro);
      }
      if (tipo === "escolhacampos") { camposBox = el(`<div class="campos"></div>`); ent.after(camposBox); }
    } else if (tipo === "doiscampos") {
      q.campos.forEach((c) => ent.appendChild(el(`<label class="item"><span>${esc(rotulo(q, c))}</span>
        <textarea class="campo" rows="3" data-c="${esc(c)}">${esc(resp && resp.campos && resp.campos[c])}</textarea></label>`)));
    } else if (tipo === "preco") {
      /* dois campos de número; só o primeiro é obrigatório */
      const ns = resp && resp.estado === "valor" ? (resp.min != null ? [resp.min, resp.max] : Motor.numeros(resp.valor)) : [];
      const ini = ns.length ? [Math.min(...ns), Math.max(...ns)] : [];
      const fmt = (n) => (n == null ? "" : String(Math.round(n * 100) / 100).replace(".", ","));
      q.campos.forEach((c, i) => ent.appendChild(el(`<label class="item"><span>${esc(c)}</span>
        <input class="campo" inputmode="decimal" autocomplete="off" data-c="${i ? "max" : "min"}" placeholder="Ex.: ${i ? "60,00" : "40,00"}" value="${esc(i && ini[1] === ini[0] ? "" : fmt(ini[i]))}"></label>`)));
      ent.appendChild(el(`<p class="mini-info">Se você viu um preço só, preencha só o primeiro campo.</p>`));
    } else if (tipo === "lista") {
      /* um nome por campo (pelo menos 3 campos); "Adicionar outro nome" abre mais um, até o limite */
      const nomes = resp && resp.estado === "valor" ? (Array.isArray(resp.nomes) ? resp.nomes : separarNomes(resp.valor)) : [];
      const MIN = q.campos_min || 3, MAX = q.campos_max || MAX_CONC;
      const mais = el(`<button type="button" class="btn-alt mais-nome" id="mais-nome">+ Adicionar outro nome</button>`);
      const novoCampo = (v) => {
        const k = ent.querySelectorAll("input[data-nome]").length + 1;
        ent.insertBefore(el(`<label class="item item-nome"><span>Nome ${k}</span><input class="campo" data-nome="${k}" autocomplete="off" value="${esc(v || "")}"></label>`), mais);
        mais.hidden = k >= MAX;
      };
      ent.appendChild(mais);
      for (let i = 0; i < Math.max(MIN, Math.min(nomes.length, MAX)); i++) novoCampo(nomes[i]);
      mais.onclick = () => { novoCampo(""); const c = ent.querySelectorAll("input[data-nome]"); c[c.length - 1].focus(); };
    } else if (tipo === "tabela") {
      /* comparação fechada: Melhor / Igual / Pior em cada ponto, e um "Outro ponto" com campo */
      tab = Object.assign({}, resp && resp.tabela);
      const box = el(`<div class="tabela"></div>`);
      q.criterios.forEach((c) => {
        const linha = el(`<div class="t-linha"><span class="t-crit">${esc(porTipo(c))}</span><div class="t-ops opcoes" role="radiogroup" aria-label="${esc(porTipo(c))}"></div></div>`);
        linha.dataset.crit = c;
        const pinta = () => linha.querySelectorAll(".t-op").forEach((b) => { const on = tab[c] === b.dataset.v; b.classList.toggle("sel", on); b.setAttribute("aria-checked", on); });
        q.escala.forEach((v) => {
          const b = el(`<button type="button" class="t-op" role="radio">${esc(v)}</button>`);
          b.dataset.v = v;
          b.onclick = () => { tab[c] = v; pinta(); reabrir(); mostrar(msg, Motor.retornos(q, { estado: "valor", tabela: tab }, est()).filter((x) => x.tipo === "Resposta")); };
          linha.querySelector(".t-ops").appendChild(b);
        });
        pinta(); box.appendChild(linha);
      });
      ent.appendChild(box);
      const temOutro = !!(resp && resp.outro);
      const bo = el(`<button type="button" class="btn-alt" id="outro-t" aria-pressed="${temOutro}">${esc(q.outro || "Outro")}</button>`);
      outroT = el(`<label class="item extra"><span>Qual outro ponto? Como você se sai nele?</span><textarea class="campo" rows="2">${esc(resp && resp.outro)}</textarea></label>`);
      outroT.hidden = !temOutro;
      bo.classList.toggle("sel", temOutro);
      bo.onclick = () => { const on = outroT.hidden; outroT.hidden = !on; bo.classList.toggle("sel", on); bo.setAttribute("aria-pressed", on); reabrir(); if (on) outroT.querySelector("textarea").focus(); };
      ent.appendChild(el(`<div class="alt"></div>`)).appendChild(bo);
      ent.appendChild(outroT);
    } else {
      const linhas = dicaNoCampo ? Math.min(8, Math.max(4, Math.ceil(q.dica.length / 34))) : 4;
      ent.appendChild(el(`<textarea class="campo${dicaNoCampo ? " dica-campo" : ""}" rows="${linhas}"${dicaNoCampo ? ` placeholder="Dica: ${esc(q.dica)}"` : ""} aria-label="${esc(enunciado(q))}">${esc(resp && resp.estado === "valor" ? resp.valor : "")}</textarea>`));
    }
    ent.addEventListener("input", () => { reabrir(); marcarNao(); });

    /* bloco do que veio do Módulo 1: o campo só aparece ao tocar em "Trocar" */
    if (confirmar) {
      ent.hidden = true; if (alt) alt.hidden = true;
      p.querySelector("#trocar").onclick = () => {
        p.querySelector("#herdado").hidden = true; ent.hidden = false; if (alt) alt.hidden = false;
        const t = ent.querySelector("textarea"); t.focus();
      };
    }

    /* guarda o que está escrito/marcado nos campos antes de redesenhar */
    function lerCampos() {
      const campos = {};
      if (camposBox) camposBox.querySelectorAll("[data-c]").forEach((i) => (campos[i.dataset.c] = String(i.dataset.chips ? i.dataset.val || "" : i.value).trim()));
      return campos;
    }
    function desenharCampos() {
      if (!camposBox) return;
      Object.assign(rasc, lerCampos());
      camposBox.innerHTML = "";
      const ops = (varias ? marcadas : [escolhida]).filter((o) => o && q.campos[o]);
      if (!ops.length) return;
      const antes = varias ? rasc : resp && resp.opcao === escolhida ? resp.campos || {} : {};
      const MARC = q.marcadores || {}, ROT = q.rotulos || {};
      if (notaPerfil) camposBox.appendChild(el(`<p class="mini-info nota-perfil">${esc(NOTA_PERFIL)}</p>`));
      if (ops.some((o) => q.campos[o].some((c) => MARC[c]))) camposBox.appendChild(el(`<p class="mini-info">Nos itens com opções, você pode marcar mais de uma.</p>`));
      ops.forEach((o) => {
      /* duas opções marcadas: cada grupo de campos ganha um título curto */
      if (ops.length > 1) camposBox.appendChild(el(`<p class="grupo-campos">${esc(o.replace(/\s*\(.*\)\s*$/, ""))}</p>`));
      q.campos[o].forEach((c) => {
        const nome = ROT[c] || c;
        if (!MARC[c]) return camposBox.appendChild(el(`<label class="item"><span>${esc(nome)}</span>
          <input class="campo" data-c="${esc(c)}" value="${esc(antes[c])}"></label>`));
        /* marcadores: opções para tocar ("Não sei" sozinho); guarda como texto "a; b"; "Outro" abre campo.
           Texto antigo que não é uma das opções continua guardado e aparece abaixo das opções. */
        const partes = String(antes[c] || "").split(/;\s*/).map((x) => x.trim()).filter(Boolean);
        const outroTxt = (partes.find((x) => /^Outro:\s*/.test(x)) || "").replace(/^Outro:\s*/, "");
        let sel = MARC[c].filter((x) => partes.includes(x) || (x === "Outro" && outroTxt));
        const antigos = partes.filter((x) => !MARC[c].includes(x) && !/^Outro:/.test(x));
        const box = el(`<div class="item item-marcar" data-c="${esc(c)}" data-chips="1"><span>${esc(nome)}</span><div class="marcar" role="group" aria-label="${esc(nome)}"></div></div>`);
        const campoOutro = MARC[c].includes("Outro") ? el(`<input class="campo campo-outro" data-falar aria-label="Outro: qual?" placeholder="Qual?" value="${esc(outroTxt)}">`) : null;
        const pinta = () => {
          const txtO = campoOutro ? campoOutro.value.trim() : "";
          box.dataset.val = MARC[c].filter((o) => sel.includes(o)).map((o) => (o === "Outro" && txtO ? `Outro: ${txtO}` : o)).concat(antigos).join("; ");
          box.querySelectorAll(".chip").forEach((b) => { const on = sel.includes(b.dataset.v); b.classList.toggle("sel", on); b.setAttribute("aria-checked", on); });
          if (campoOutro) campoOutro.hidden = !sel.includes("Outro");
        };
        MARC[c].forEach((o) => {
          const b = el(`<button type="button" class="chip" role="checkbox"></button>`);
          b.textContent = o; b.dataset.v = o;
          b.onclick = () => {
            sel = sel.includes(o) ? sel.filter((x) => x !== o) : Motor.ehNS(o) ? [o] : sel.filter((x) => !Motor.ehNS(x)).concat(o);
            pinta(); reabrir();
          };
          box.querySelector(".marcar").appendChild(b);
        });
        if (campoOutro) { box.appendChild(campoOutro); campoOutro.addEventListener("input", pinta); }
        if (antigos.length) box.appendChild(el(`<p class="mini-info">Você tinha escrito: ${esc(antigos.join("; "))}</p>`));
        pinta(); camposBox.appendChild(box);
      });
      });
      camposBox.oninput = reabrir;
    }
    function pintar() {
      ent.querySelectorAll(".opcao").forEach((x) => {
        const on = tipo === "multipla" || varias ? marcadas.includes(x.dataset.op) : escolhida === x.dataset.op;
        x.classList.toggle("sel", on);
        x.setAttribute("aria-checked", on);
      });
      if (outro) outro.hidden = !marcadas.includes("Outro");
      const chave = varias ? marcadas.join("|") : escolhida || "";
      if (tipo === "escolhacampos" && camposBox.dataset.op !== chave) { camposBox.dataset.op = chave; desenharCampos(); }
      /* retorno ao vivo das opções (Dica de cada alcance/canal; sugestão do "Não sei" das perguntas de marcar) */
      if (tipo === "multipla") mostrar(msg, marcadas.length ? Motor.retornos(q, { estado: "opcoes", opcoes: marcadas }, est()) : []);
      else if (tipo === "escolha" && escolhida) mostrar(msg, Motor.retornos(q, { estado: "opcao", opcao: escolhida }, est()));
      else if (tipo === "escolhacampos") msg.innerHTML = "";
    }

    function coletar() {
      if (tipo === "escolha") return escolhida ? { estado: "opcao", opcao: escolhida } : null;
      if (tipo === "escolhacampos") {
        if (!escolhida) return null;
        const campos = lerCampos();
        /* "opcao" (a primeira marcada) continua no formato que os Módulos 2, 4 e 10 leem */
        return varias ? { estado: "opcao", opcao: marcadas[0], opcoes: marcadas.slice(), campos } : { estado: "opcao", opcao: escolhida, campos };
      }
      if (tipo === "multipla") {
        /* "Não sei" sozinho não é resposta: fica sem opção marcada (o Alerta pede para marcar) */
        const r = { estado: "opcoes", opcoes: q.opcoes.filter((o) => marcadas.includes(o) && o !== Motor.NS) };
        const d = outro ? outro.querySelector("textarea").value.trim() : "";
        if (marcadas.includes("Outro") && d) r.detalhe = d;
        return r;
      }
      if (tipo === "preco") {
        const f = Motor.faixaPreco(ent.querySelector('[data-c="min"]').value, ent.querySelector('[data-c="max"]').value);
        return f.r || null;
      }
      if (tipo === "doiscampos") {
        const campos = {};
        ent.querySelectorAll("[data-c]").forEach((i) => (campos[i.dataset.c] = i.value.trim()));
        return { estado: "valor", campos };
      }
      if (tipo === "lista") {
        const nomes = [...new Set([...ent.querySelectorAll("input[data-nome]")].map((i) => i.value.trim()).filter(Boolean))];
        return { estado: "valor", valor: nomes.join(", "), nomes };
      }
      if (tipo === "tabela") {
        const o = outroT && !outroT.hidden ? outroT.querySelector("textarea").value.trim() : "";
        const r = { estado: "valor", valor: textoTabela(q, tab, o), tabela: Object.assign({}, tab) };
        if (o) r.outro = o;
        return r;
      }
      const r = { estado: "valor", valor: ent.querySelector("textarea").value.trim() };
      if (cod === "M3.P01" && H.p01 && r.valor === H.p01) r.doM1 = true;
      return r;
    }
    const gravar = (r) => gravarR(cod, r);
    /* o que falta para a resposta valer (campo obrigatório vazio bloqueia; o resto só avisa) */
    function faltando(r) {
      if (!r) return tipo === "escolhacampos" ? `Escolha uma opção acima para continuar. Se ainda não sabe, toque em “${rotNS}” para ver uma sugestão.` : "Escolha uma opção para continuar.";
      if (tipo === "texto" && vazio(r.valor)) return MSG_ESCREVA;
      if (tipo === "doiscampos" && q.campos.every((c) => vazio(r.campos[c]))) return "Escreva a sua resposta nos campos acima para continuar. Se não souber, toque em “Não sei” para ver uma sugestão.";
      if (tipo === "lista" && !r.nomes.length) return "Escreva pelo menos um nome para continuar. Se não souber, toque em “Não sei” para ver como descobrir.";
      if (tipo === "tabela") {
        if (q.criterios.some((c) => !tab[c])) return "Marque Melhor, Igual ou Pior em cada item para continuar.";
        if (outroT && !outroT.hidden && !r.outro) return `Escreva qual é o outro ponto ou toque de novo em “${q.outro || "Outro"}” para tirar.`;
      }
      if (tipo === "multipla" && marcadas.includes("Outro") && !r.detalhe) return "Escreva o que é “Outro” ou desmarque essa opção.";
      return null;
    }

    function continuar() {
      erroBox.hidden = true;
      if (tipo === "preco") {
        /* texto ou número negativo: erro que não grava; valor fora do comum: aviso, e o 2º toque segue */
        const f = Motor.faixaPreco(ent.querySelector('[data-c="min"]').value, ent.querySelector('[data-c="max"]').value);
        if (f.erro) return erro(f.erro);
        if (f.aviso) { erroBox.classList.add("aviso-num"); erro(f.aviso); return botoes("mesmo"); }
      }
      erroBox.classList.remove("aviso-num");
      const r = coletar();
      const falta = faltando(r);
      if (falta) return erro(falta);
      const lista = Motor.retornos(q, r, est());
      if (Motor.bloqueia(lista)) return mostrar(msg, lista);        // Alerta: não grava, não avança
      gravar(r);
      if (r.doM1) return avancar();                                   // confirmou o que veio do Módulo 1
      if (Motor.corrigir(lista)) { mostrar(msg, lista); return botoes("mesmo"); }
      if (tipo === "texto" || tipo === "doiscampos") {
        if (Motor.mostraveis(q, r, est()).length) { mostrar(msg, lista); return botoes("seguir"); }
      }
      avancar();
    }

    /* ---- "Não sei": mostra a sugestão (dica, passo a passo ou prompt de IA) e não grava nada ---- */
    const ns = p.querySelector("#ns"), nao = p.querySelector("#nao");
    function naoSei() {
      erroBox.hidden = true;
      mostrar(ajudans, Motor.retornos(q, { estado: "naosei" }, est()));
      ajudans.appendChild(el(`<p class="mini-info nota-ns" id="nota-ns">${esc(cod === "M3.P10" ? NOTA_NS_PERFIL : NOTA_NS)}</p>`));
      if (ns) { ns.classList.add("sel"); ns.setAttribute("aria-pressed", "true"); }
    }
    /* botão "Não": responde a pergunta aberta sem precisar digitar */
    function marcarNao() {
      if (!nao) return;
      const t = ent.querySelector("textarea"), on = !!t && t.value.trim() === Motor.NAO;
      nao.classList.toggle("sel", on); nao.setAttribute("aria-pressed", on);
    }
    if (ns) ns.onclick = naoSei;
    if (nao) nao.onclick = () => { const t = ent.querySelector("textarea"); t.value = Motor.NAO; reabrir(); marcarNao(); };

    /* estado inicial */
    botoes("continuar");
    if (ent.classList.contains("opcoes")) pintar();
    marcarNao();
    /* resposta antiga marcada como "Não sei": a sugestão aparece e a pergunta espera a resposta */
    if (resp && resp.estado === "naosei" && tipo !== "multipla" && q.naosei) naoSei();
    return p;
  }

  /* ================= resultado ================= */
  /* respostas do módulo + o que veio do Módulo 1 (a pergunta pulada aparece com o selo) */
  function respostas() {
    const RR = Object.assign({}, S.R);
    if (!RR["M3.P01"] && H.p01) RR["M3.P01"] = { estado: "valor", valor: H.p01, doM1: true };
    return RR;
  }
  /* ===== "O que entendemos até aqui": frases montadas por regras, sem inventar ===== */
  const ALCANCE = { "No meu bairro e na minha cidade": "no seu bairro e na sua cidade", "Na minha região (estado e cidades próximas)": "na sua região (estado e cidades próximas)",
    "No Brasil todo": "no Brasil todo", "Também fora do Brasil": "no Brasil e também fora dele" };
  const CANAL = { "Indicação (boca a boca)": "indicação (boca a boca)", "WhatsApp (WhatsApp Business)": "WhatsApp",
    "Instagram e outras redes sociais (catálogo)": "redes sociais como o Instagram", "Atendimento direto ou presencial (loja, feira, ponto)": "atendimento presencial (loja, feira ou ponto)",
    "Atendimento em domicílio (vou até o cliente)": "atendimento em domicílio", "Aplicativos de entrega (iFood e outros)": "aplicativos de entrega",
    "Marketplace (ex.: Mercado Livre, Shopee)": "sites de venda como Mercado Livre e Shopee", "Site ou aplicativo próprio": "site ou aplicativo próprio" };
  const semAcento = (t) => String(t || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  /* texto escrito no campo errado (ex.: a ideia no campo "Local"): não entra na frase */
  const repete = (t, ...outros) => {
    const a = semAcento(t);
    return !a || outros.some((o) => { const b = semAcento(o); return b && (a === b || (a.length >= 8 && b.includes(a)) || (b.length >= 8 && a.includes(b))); });
  };
  const aspas = (t) => `“${String(t).trim().replace(/[.;\s]+$/, "")}”`;
  const lista = (xs) => xs.length < 2 ? xs.join("") : xs.slice(0, -1).join(", ") + " e " + xs[xs.length - 1];
  /* texto corrido: as frases de cada assunto viram um parágrafo (1 a 3 parágrafos curtos, sem lista) */
  const emParagrafos = (fr, ...cortes) => [0, ...cortes].map((c, i, a) => fr.slice(c, i + 1 < a.length ? a[i + 1] : fr.length).join(" ")).filter(Boolean);
  function entendemos(RR, nPend) {
    const ideia = naoVende(), val = (c) => { const r = RR[c]; return r && r.estado === "valor" && !vazio(r.valor) ? r.valor : null; };
    const f = [];
    const oque = RR["M3.P01"] && RR["M3.P01"].doM1 ? H.ideia : val("M3.P01");
    const estagio = { ideia: " A ideia ainda está no começo: você ainda não começou a vender.", comecando: " Você já fez um pouco para testar.", vende: " Você já vende." }[est()] || "";
    /* resposta escrita como frase ("Vendo marmitas…", "Faço unhas…") não cabe depois de "Você vende" */
    const frase = oque && /^(eu\s+)?(vendo|revendo|fa[cç]o|trabalho|quero|ofere[cç]o|sou|tenho|presto)\b/i.test(String(oque).trim());
    if (oque) f.push(`${frase ? `Sobre o seu negócio, você disse: ${aspas(oque)}` : `Você ${ideia ? "quer vender" : "vende"} ${aspas(oque)}`}${H.tipoFrase ? ` — é ${H.tipoFrase}` : ""}.${estagio}`);
    const p09 = RR["M3.P09"], p10 = RR["M3.P10"];
    let cli = "";
    if (p10 && p10.estado === "opcao") {
      const c = p10.campos || {}, livre = (k) => c[k] && c[k] !== Motor.NS ? c[k] : null;
      /* marcadores: em minúsculas e "ou" entre as opções; texto livre fica como a pessoa escreveu */
      const ok = (k) => { const v = livre(k); return v ? v.split(/;\s*/).filter((x) => x && !Motor.ehNS(x) && x !== "Outro").map((x) => x.replace(/^Outro:\s*/, "")).join(" ou ").toLowerCase() || null : null; };
      /* lugar escrito igual ao que vende (ou ao que já foi dito) fica de fora: a pessoa escreveu no campo errado.
         Lugar marcado nas opções (lote 4) entra em minúsculas, como os outros marcadores. */
      const lugar = (k) => { const v = livre(k); if (!v) return null; if ((M.porCodigo["M3.P10"].marcadores[k] || []).some((o) => v.split(/;\s*/).includes(o))) return ok(k); return !repete(v, oque, H.ideia, val("M3.P01"), c[Motor.DOR]) ? v : null; };
      const ops = Motor.opcoesDe(p10), partes = [];
      if (ops.includes(Motor.PESSOAS)) {
        const det = [ok("Idade") && `idade: ${ok("Idade")}`, ok("Renda") && `renda: ${ok("Renda")}`, ok("Ocupação") && `ocupação: ${ok("Ocupação")}`, lugar("Onde mora") && `onde moram: ${lugar("Onde mora")}`].filter(Boolean);
        partes.push(`pessoas comuns${det.length ? ` (${det.join("; ")})` : ""}`);
      }
      if (ops.includes("Empresas")) {
        const det = [ok("Ramo") && `ramo: ${ok("Ramo")}`, ok("Tamanho") && `porte: ${ok("Tamanho")}`, ok("Equipe") && `equipe: ${ok("Equipe")}`, lugar("Local") && `local: ${lugar("Local")}`].filter(Boolean);
        partes.push(`empresas${det.length ? ` (${det.join("; ")})` : ""}`);
      }
      cli = partes.join(" e ");
    }
    /* "os clientes … são": sujeito no plural, concorda com "pessoas comuns" / "empresas" */
    const quem = `os clientes que você ${ideia ? "imagina" : "mais atende"} são ${cli}`;
    const onde = p09 && p09.estado === "opcao" ? ALCANCE[p09.opcao] : null;
    if (onde && cli) f.push(`Você ${ideia ? "pretende vender" : "vende"} ${onde}, e ${quem}.`);
    else if (onde) f.push(`Você ${ideia ? "pretende vender" : "vende"} ${onde}.`);
    else if (cli) f.push(quem.charAt(0).toUpperCase() + quem.slice(1) + ".");
    const dor = val("M3.P11");
    if (dor) f.push(`O que o cliente quer resolver com você: ${aspas(dor)}.`);
    const c1 = f.length;   // 1º parágrafo: o negócio, o cliente e o que ele quer resolver
    const p13 = RR["M3.P13"];
    if (p13 && p13.estado === "opcoes") {
      const cs = p13.opcoes.filter((o) => CANAL[o]).map((o) => CANAL[o]).concat(p13.detalhe ? [p13.detalhe] : []);
      if (cs.length) f.push(`Por onde o cliente ${ideia ? "vai encontrar e comprar" : "encontra e compra"} de você: ${lista(cs)}.`);
    }
    const conc = val("M3.P15"), preco = val("M3.P20"), dif = val("M3.P21");
    const ns = preco ? Motor.numeros(preco) : [];
    const partes = [conc && `Quem vende algo parecido: ${aspas(conc)}`, ns.length && `eles cobram em torno de R$ ${Motor.reais(Motor.media(ns))}`].filter(Boolean);
    if (partes.length) f.push(partes.join("; ") + ".");
    if (dif) f.push(`O que ${ideia ? "vai fazer" : "faz"} o cliente preferir você: ${aspas(dif)}.`);
    const out = f.slice(0, 5), c2 = out.length;   // 2º: canais, concorrentes e diferencial; 3º: o que ficou em aberto
    if (nPend) out.push(nPend === 1 ? "Ficou 1 pergunta com “Não sei”: vale voltar nela quando tiver a informação." : `Ficaram ${nPend} perguntas com “Não sei”: vale voltar nelas quando tiver a informação.`);
    if (!out.length) out.push("Você ainda não respondeu o suficiente para montarmos este retrato. Volte às perguntas quando puder.");
    return emParagrafos(out, Math.min(c1, c2), c2);
  }

  /* ===== entregas prometidas na abertura: roteiro de pesquisa e tabela de concorrentes ===== */
  const valorDe = (RR, c) => { const r = RR[c]; return r && r.estado === "valor" && !vazio(r.valor) ? String(r.valor).trim() : null; };
  const camposDe = (RR, c, k) => { const r = RR[c]; const v = r && r.estado === "valor" && r.campos ? String(r.campos[k] || "").trim() : ""; return v || null; };
  const MAX_CONC = 6;
  /* nomes citados na pergunta "quem vende o mesmo que você" (separados por vírgula, ";", "e", "ou" ou linha) */
  function separarNomes(t) {
    const ns = String(t || "").split(/\s*(?:[,;\n/]|\s+e\s+|\s+ou\s+)\s*/).map((x) => x.trim().replace(/[.]+$/, "")).filter((x) => x.length >= 2);
    return [...new Set(ns)].slice(0, MAX_CONC).map((x) => x.charAt(0).toUpperCase() + x.slice(1));
  }
  function nomesConc(RR) {
    const r = RR["M3.P15"];
    if (r && r.estado === "valor" && Array.isArray(r.nomes) && r.nomes.length) return [...new Set(r.nomes.map((x) => String(x).trim()).filter(Boolean))].slice(0, MAX_CONC).map((x) => x.charAt(0).toUpperCase() + x.slice(1));
    return separarNomes(valorDe(RR, "M3.P15"));
  }
  function tabelaConc(RR) {
    const nomes = nomesConc(RR);
    const p20 = RR["M3.P20"], preco = p20 && p20.estado === "valor" && !vazio(p20.valor) ? String(p20.valor) : null;
    const bem = camposDe(RR, "M3.P22", "O que os outros fazem bem"), mal = camposDe(RR, "M3.P22", "Onde os outros deixam a desejar");
    const como = valorDe(RR, "M3.P18");
    const linhas = nomes.map((n) => ({ nome: n, tipo: "Vende o mesmo que você (concorrente direto)", preco, bem, mal, como }));
    if (!linhas.length) for (let i = 1; i <= 3; i++) linhas.push({ nome: `Concorrente ${i}`, tipo: "Vende o mesmo que você (concorrente direto)", vazio: true });
    const subst = valorDe(RR, "M3.P03");
    if (subst) linhas.push({ nome: subst, tipo: "O que o cliente compra no lugar (substituto)" });
    return { linhas, geral: nomes.length > 1 && !!(preco || bem || mal || como), modelo: !nomes.length };
  }
  function roteiro(RR) {
    const p13 = RR["M3.P13"], cs = p13 && p13.estado === "opcoes" ? p13.opcoes : [];
    const tem = (re) => cs.some((o) => re.test(o));
    const servico = H.tipo === "Serviço", ideia = naoVende();
    const oque = H.ideia || valorDe(RR, "M3.P01");
    const termo = oque && oque.length <= 40 ? `“${oque.replace(/[.\s]+$/, "")} perto de mim”` : `o que você ${ideia ? "quer vender" : "vende"} e “perto de mim”`;
    const nomes = nomesConc(RR);
    const p09 = RR["M3.P09"], longe = p09 && p09.estado === "opcao" && /Brasil/.test(p09.opcao);
    const onde = [];
    if (tem(/Indicação|WhatsApp|Instagram/) || !cs.length) onde.push("no Instagram e nos grupos de WhatsApp da sua cidade");
    if (!longe || tem(/presencial|domicílio/)) onde.push(`no Google Maps, buscando ${termo}`);
    if (tem(/Aplicativos de entrega/)) onde.push("no aplicativo de entrega, vendo quem aparece primeiro na sua região");
    if (longe || tem(/Marketplace|Site/)) onde.push("no Mercado Livre e na Shopee, vendo os anúncios que mais vendem");
    const n = Math.max(3, nomes.length);
    const passos = [`Procure pelo menos ${n} concorrentes ${lista(onde)}.`];
    if (nomes.length) passos.push(`Olhe o perfil ou passe em frente de ${lista(nomes)}: veja horário, como ${servico ? "atendem e se vão até o cliente" : "atendem e como entregam"}.`);
    const p20 = RR["M3.P20"], faixa = p20 && p20.min != null ? (p20.min === p20.max ? `perto de R$ ${Motor.reais(p20.min)}` : `entre R$ ${Motor.reais(p20.min)} e R$ ${Motor.reais(p20.max)}`) : null;
    passos.push((servico ? `Peça a ${n} deles o preço de um serviço parecido com o seu (um orçamento pelo WhatsApp serve) e anote.`
      : `Anote o preço de algo parecido com o seu em ${n} deles; se o preço não estiver à vista, peça um orçamento pelo WhatsApp.`) + (faixa ? ` Confira se continua ${faixa}, como você respondeu.` : ""));
    const bem = camposDe(RR, "M3.P22", "O que os outros fazem bem"), mal = camposDe(RR, "M3.P22", "Onde os outros deixam a desejar");
    passos.push(bem && mal ? "Leia as avaliações no Google Maps e os comentários no Instagram e confira se o que você respondeu sobre os pontos fortes e fracos deles se repete."
      : "Leia 5 avaliações boas e 5 ruins no Google Maps ou nos comentários do Instagram e anote os elogios e as reclamações que mais se repetem.");
    passos.push(`Pergunte a 5 ${ideia ? "pessoas que comprariam de você" : "clientes"} onde ${ideia ? "elas compram hoje" : "mais eles já compraram"} e o que pesa na escolha: preço, qualidade, atendimento ou prazo.`);
    passos.push("Anote tudo na tabela de concorrentes abaixo, com onde você viu e a data.");
    return passos;
  }
  /* quadro dos concorrentes (relatório geral): pontos fortes e fracos dos outros, oportunidades e ameaças,
     só com frases tiradas das respostas; o que faltar fica "a anotar" */
  function quadro(RR) {
    const q19 = M.porCodigo["M3.P19"], r19 = RR["M3.P19"], t19 = (r19 && r19.tabela) || {};
    const em = (v) => q19.criterios.filter((c) => t19[c] === v).map((c) => porTipo(c).toLowerCase());
    const sim = (c) => { const v = valorDe(RR, c); return v && v !== Motor.NAO ? v : null; };
    const r07 = RR["M3.P07"];
    const riscos = r07 && r07.estado === "opcoes" ? (r07.opcoes || []).filter((o) => o !== "Outro" && !Motor.ehNS(o)).map((o) => porTipo(o).toLowerCase()).concat(r07.detalhe ? [r07.detalhe] : [])
      : r07 && r07.estado === "valor" && !vazio(r07.valor) ? [r07.valor] : [];
    const melhor = em("Melhor"), pior = em("Pior");
    return [
      { id: "fortes", tit: "Pontos fortes dos concorrentes", xs: [camposDe(RR, "M3.P22", "O que os outros fazem bem")] },
      { id: "fracos", tit: "Pontos fracos dos concorrentes", xs: [camposDe(RR, "M3.P22", "Onde os outros deixam a desejar")] },
      { id: "oportunidades", tit: "Oportunidades para você", xs: [sim("M3.P04") && `Novidade que pode ajudar: ${aspas(sim("M3.P04"))}`,
        valorDe(RR, "M3.P08") && `O que pode mudar no jeito de comprar: ${aspas(valorDe(RR, "M3.P08"))}`, melhor.length && `Você se sai melhor em ${lista(melhor)}`] },
      { id: "ameacas", tit: "Ameaças para você", xs: [riscos.length && `O que pode atrapalhar: ${lista(riscos)}`,
        valorDe(RR, "M3.P03") && `O cliente pode comprar no lugar: ${aspas(valorDe(RR, "M3.P03"))}`, pior.length && `Os outros se saem melhor em ${lista(pior)}`] },
    ].map((c) => Object.assign(c, { xs: c.xs.filter(Boolean) }));
  }
  function htmlEntregas(RR) {
    const t = tabelaConc(RR), anotar = `<span class="anotar">a anotar</span>`;
    const cel = (v) => (v ? esc(v) : anotar);
    const rot = (k) => porTipo(k);
    return `<section class="entrega-m" id="roteiro">
        <h2>Seu roteiro de pesquisa</h2>
        <ol class="roteiro">${roteiro(RR).map((x) => `<li>${esc(x)}</li>`).join("")}</ol>
      </section>
      <section class="entrega-m" id="tabela-conc">
        <h2>Sua tabela de concorrentes</h2>
        <p class="mini-info">${t.modelo ? "Você ainda não citou concorrentes. Use este modelo ao pesquisar." : "Montada com o que você respondeu. O que estiver “a anotar”, complete ao pesquisar."}</p>
        ${t.linhas.map((l) => `<div class="conc" data-nome="${esc(l.nome)}">
          <h3>${esc(l.nome)}</h3>
          <dl>
            <dt>Tipo</dt><dd>${esc(l.tipo)}</dd>
            <dt>Preço que você viu</dt><dd>${cel(l.preco)}</dd>
            <dt>O que faz bem</dt><dd>${cel(l.bem)}</dd>
            <dt>Onde deixa a desejar</dt><dd>${cel(l.mal)}</dd>
            <dt>${esc(rot("Onde fica e como atende"))}</dt><dd>${cel(l.como)}</dd>
            <dt>Onde você viu e quando</dt><dd>${anotar}</dd>
          </dl>
        </div>`).join("")}
        ${t.geral ? `<p class="mini-info">Preço, pontos fortes e fracos foram respondidos para os concorrentes em geral. Ao pesquisar, anote os de cada um.</p>` : ""}
      </section>
      <section class="entrega-m" id="quadro-conc">
        <h2>Quadro dos concorrentes</h2>
        <p class="mini-info">Montado só com as suas respostas. O que estiver “a anotar”, complete ao pesquisar.</p>
        <div class="quadro">${quadro(RR).map((c) => `<div class="q-cel q-${c.id}" data-q="${c.id}"><h3>${esc(c.tit)}</h3>${c.xs.length ? `<ul>${c.xs.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : `<p>${anotar}</p>`}</div>`).join("")}</div>
      </section>`;
  }

  function telaResultado() {
    const RR = respostas();
    const vis = Motor.visiveis(M, S.R);
    const resp = vis.filter((q) => RR[q.codigo]);
    const pend = resp.filter((q) => Motor.pendente(RR[q.codigo]));
    /* contagem igual à do topo ("Pergunta N de M"): conta as telas que a pessoa vê no caminho dela.
       Duas perguntas na mesma tela contam uma vez; a que veio pronta (Módulo 1 ou perfil do cliente) não conta. */
    const telas = Motor.telas(M, S.R, H);
    const telasResp = telas.filter((t) => t.every((c) => RR[c]));
    const telasPend = telas.filter((t) => t.some((c) => Motor.pendente(RR[c])));
    const semResp = vis.filter((q) => !RR[q.codigo]);
    const blocos = D.blocos.map((b) => ({ nome: b, qs: vis.filter((q) => q.bloco === b) })).filter((b) => b.qs.length);
    const p = el(`
      <div class="pag">
        ${topo("Resultado")}
        ${heroi({ kicker: "Resultado", kickerClasse: "passo", titulo: "Resumo das suas respostas" })}
        ${etapas(D.blocos.length, true)}
        <main class="corpo">
          ${botaoVoltar()}
          <section class="concluido">
            <div class="conc-topo"><span class="check" aria-hidden="true"></span><div><h2>Você concluiu o Módulo ${esc(D.modulo.numero)}</h2><p>Veja abaixo o que entendemos do seu negócio.</p></div></div>
          </section>
          <section class="entendemos" id="entendemos">
            <h2>O que entendemos até aqui</h2>
            ${entendemos(RR, telasPend.length).map((t) => `<p>${esc(t)}</p>`).join("")}
          </section>
          <div class="res-num">
            <div class="lbl">Perguntas respondidas</div>
            <div class="val">${telasResp.length} de ${telas.length}</div>
            <div class="sub">${telasPend.length ? `${telasPend.length} com “Não sei”` : "nenhuma com “Não sei”"}</div>
          </div>
          <div class="aviso">${esc(D.mapa.mensagem_limite)}</div>

          ${pend.length || semResp.length ? `<section class="pendentes" id="pendentes">
            ${pend.length ? `<div class="secao-titulo">Perguntas que você marcou como Não sei</div>
            ${pend.map((q) => `<div class="pend" data-cod="${q.codigo}"><p>${esc(enunciado(q))}</p><button class="btn btn-claro preencher" data-cod="${q.codigo}">Preencher agora</button></div>`).join("")}` : ""}
            ${semResp.length ? `<div class="secao-titulo">Perguntas sem resposta</div>
            ${semResp.map((q) => `<div class="pend" data-cod="${q.codigo}"><p>${esc(enunciado(q))}</p><button class="btn btn-claro preencher" data-cod="${q.codigo}">Responder agora</button></div>`).join("")}` : ""}
          </section>` : ""}

          ${htmlEntregas(RR)}

          <details class="respostas" id="respostas">
          <summary>Ver suas respostas</summary>
          ${blocos.map((b) => `<section class="res-bloco"><div class="bloco-titulo">${esc(b.nome)}</div>
            ${b.qs.map((q) => {
              const r = RR[q.codigo];
              const msgs = r ? Motor.retornos(q, r, est()).filter((c) => c.tipo === "Resposta") : [];
              const veio = r && r.doM1 ? "Veio do Módulo 1" : r && r.doPerfil ? "Veio do perfil do cliente" : "";
              return `<div class="etapa ${!r ? "e-nao" : Motor.pendente(r) ? "e-conf" : "e-sim"}" data-cod="${q.codigo}">
                <b class="etapa-q">${esc(enunciado(q))}</b>
                ${veio ? `<span class="selo-m selo-res">${veio}</span>` : ""}
                ${Motor.hipotese(q, r) ? `<span class="hip">hipótese a investigar</span>` : ""}
                <p class="etapa-r">${r ? esc(Motor.texto(q, r, est()) || "Sem resposta") : "Sem resposta"}</p>
                ${msgs.map((c) => `<p class="etapa-m">${esc(adaptar(c.texto))}</p>`).join("")}
                ${veio ? `<button class="btn btn-claro ajustar" data-cod="${q.codigo}">Ajustar</button>` : ""}
              </div>`;
            }).join("")}</section>`).join("")}
          </details>

          <div class="secao-titulo">O que este módulo entrega</div>
          <div class="cartao">${listaOuTexto(D.mapa.entrega)}</div>
          ${ENCAMINHA ? `<div class="cartao encaminha"><h3>Quando procurar um profissional</h3><p>${esc(D.mapa.encaminhamentos)}</p></div>` : ""}

          <div class="acoes">
            <button class="btn btn-primario" id="imp">Salvar ou imprimir</button>
            <button class="btn btn-claro" id="rev">Revisar respostas</button>
            <button class="btn btn-linha" id="novo">Começar outra análise</button>
          </div>
          <div class="acoes lg2-proximo"><a class="btn btn-primario" style="text-decoration:none;text-align:center;box-sizing:border-box" href="/lg2/turma-a/m04/index.html">Ir para o Módulo 4</a></div>
          ${rodape()}
        </main>
      </div>`);
    p.querySelector("#v").onclick = () => {
      S.hist.pop(); const a = S.hist.pop(); salvar();
      if (a && M.porCodigo[a]) ir(telaPergunta, a); else ir(telaCapa);
    };
    ligar(p);
    p.querySelectorAll(".preencher, .ajustar").forEach((b) => (b.onclick = () => ir(telaPergunta, b.dataset.cod, true)));
    p.querySelector("#imp").onclick = () => { p.querySelector("#respostas").open = true; window.print(); };
    p.querySelector("#rev").onclick = () => { S.hist = []; salvar(); ir(telaPergunta, Motor.proxima(M, S.R, null, H)); };
    p.querySelector("#novo").onclick = () => { if (confirm("Começar uma nova análise? As respostas atuais serão apagadas.")) { S = novo(); salvar(); ir(telaPergunta, Motor.proxima(M, {}, null, H)); } };
    return p;
  }

  function rodape() {
    return `<footer class="rodape">
      <p class="credito">Laboratório de Gestão II · FACC/UFJF · versão ${esc(D.modulo.versao)} · fontes consultadas em ${esc(D.modulo.data)}</p>
      <div class="logos">
        <img src="assets/logo_facc.png" alt="FACC">
        <img src="assets/logo_ufjf.svg" alt="UFJF">
        <img src="assets/logo_mg.svg" alt="Governo de Minas Gerais">
      </div>
    </footer>`;
  }

  ir(telaCapa);
})();
