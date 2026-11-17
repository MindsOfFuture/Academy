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
     as respostas que já existiam. Migração abaixo.
     VERSAO 8 (lote 16/11): "Não sei" não é mais resposta (respostas antigas "naosei" viram "sem resposta");
     perguntas duplas viraram duas (P12/P12B, P13A/P13, P14/P14B, P22/P22B); concorrentes respondidos um a um
     (porNome); a pergunta 3 marca tipos de alternativa. Migração abaixo, sem apagar as outras respostas. */
  const VERSAO = 8;
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
  const semNS = (xs) => xs.filter((x) => !Motor.ehNS(x));
  function migrar7(s) {
    const R = s.R || {};
    Object.keys(R).forEach((k) => { if (R[k] && R[k].estado === "naosei") delete R[k]; });
    /* "Indicação" saiu de "por onde compra" e foi para "como fica sabendo" */
    const IND = "Indicação (boca a boca)";
    ["M3.P07", "M3.P13"].forEach((k) => {
      const r = R[k];
      if (!r || r.estado !== "opcoes") return;
      r.opcoes = semNS(r.opcoes || []);
      if (k === "M3.P13" && r.opcoes.includes(IND)) {
        r.opcoes = r.opcoes.filter((o) => o !== IND);
        if (!R["M3.P13A"]) R["M3.P13A"] = { estado: "opcoes", opcoes: [IND] };
      }
      if (!r.opcoes.length) delete R[k];
    });
    const r10 = R["M3.P10"];
    if (r10 && r10.campos) Object.keys(r10.campos).forEach((c) => { r10.campos[c] = String(r10.campos[c] || "").split(/;\s*/).filter((x) => x && !Motor.ehNS(x)).join("; "); });
    /* P12 (texto com o botão "Não") virou escolha + "o que dificulta" */
    const r12 = R["M3.P12"];
    if (r12 && r12.estado === "valor") {
      const v = String(r12.valor || "").trim();
      if (v === "Não") R["M3.P12"] = { estado: "opcao", opcao: "Não, seria fácil" };
      else if (v) { R["M3.P12"] = { estado: "opcao", opcao: "Sim, seria difícil" }; if (!R["M3.P12B"]) R["M3.P12B"] = { estado: "valor", valor: v }; }
      else delete R["M3.P12"];
    }
    /* dois campos viraram duas perguntas */
    [["M3.P14", "M3.P14B"], ["M3.P22", "M3.P22B"]].forEach(([a, b]) => {
      const r = R[a];
      if (!r || !r.campos) return;
      const [v1, v2] = Object.values(r.campos).map((x) => String(x || "").trim());
      if (v1) R[a] = { estado: "valor", valor: v1 }; else delete R[a];
      if (v2 && !R[b]) R[b] = { estado: "valor", valor: v2 };
    });
    s.v = 8;
  }
  let migrou = false;
  let S = carregar();               // { v, R: respostas, hist: [códigos] }
  function carregar() {
    try {
      const s = JSON.parse(localStorage.getItem(CHAVE));
      /* J: estados antigos sem campo de versão são legados, não dados inválidos */
      if (s && s.v == null && s.R && typeof s.R === "object" && Array.isArray(s.hist)) s.v = 7;
      if (s && s.v === 3) s.v = 4;
      if (s && s.v === 4) migrar4(s);
      if (s && s.v === 5) { migrar5(s); migrou = true; }
      if (s && s.v === 6) { migrar6(s); migrou = true; }
      if (s && s.v === 7) { migrar7(s); migrou = true; }
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
  const DO_TIPO = { Produto: "do seu produto", "Serviço": "do seu serviço", Mercadoria: "da mercadoria que você vende" };
  const enunciado = (q) => porTipo(Motor.variante(q, est()).pergunta || q.pergunta)
    .replace(/\[(do que você (?:quer vender|vende))\]/g, (m, x) => (H.tipo ? DO_TIPO[H.tipo].replace("você vende", /quer/.test(x) ? "você quer vender" : "você vende") : x));
  /* Pergunta 3: quando veio do Módulo 1, nomeia o que a pessoa vende no enunciado. */
  const enunciadoPergunta = (q) => {
    let t = enunciado(q), v = q.codigo === "M3.P03" ? oQueVende() : null;
    if (v) return `Quando alguém precisa de ${v}, o que pode escolher no lugar?`;
    return t;
  };
  /* o que a pessoa vende, em poucas palavras (para lembrar na pergunta 3) */
  function oQueVende() {
    const r = S.R["M3.P01"];
    const v = r && r.estado === "valor" && !r.doM1 && !vazio(r.valor) ? r.valor : H.ideia;
    return v ? String(v).trim().replace(/[.\s]+$/, "") : null;
  }
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
  const verMais = (resto, dentro) => `<details class="ver-mais" open><summary>Ver mais</summary>${dentro || `<p>${esc(resto)}</p>`}</details>`;
  function textoCurto(t) { const [a, b] = partir(t); return `<p>${esc(a)}</p>${b ? verMais(b) : ""}`; }
  /* texto com uma ideia por linha vira lista curta (capa) */
  function listaOuTexto(t) {
    const xs = String(t || "").split("\n").map((x) => x.trim()).filter(Boolean);
    return xs.length > 1 ? `<ul class="lista-capa">${xs.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : textoCurto(t);
  }
  /* escolha única que continua única: diz como escolher quando mais de uma parece servir */
  const AJUDA_UNICA = { "M3.P09": "Se você vende em mais de um desses lugares, escolha o mais distante." };
  const selo = (txt) => `<p class="selo-m">${esc(txt)}</p>`;
  const SELO_M1 = "Veio da Etapa 1. Confira e ajuste se quiser.";
  const SELO_DOR = "Veio do perfil do cliente que você descreveu. Confira e ajuste se quiser.";
  const SELO_M2 = "Veio da Etapa 2. Confira e troque se quiser.";
  const NOTA_PERFIL = "Marcamos o que você já respondeu antes. Confira e ajuste se quiser.";
  /* aviso de risco antes de todo prompt de IA e frase de conferir depois (texto pedido no relatório da Ana Luiza) */
  const AVISO_IA_TIT = "USE A IA COM CUIDADO";
  const AVISO_IA = "Peça perguntas, não conclusões sobre o mercado. A IA pode ajudar a entender melhor seu negócio e público, mas não conhece o seu cliente real nem tem dados atualizados de mercado. Use-a para organizar o roteiro de entrevista e busque as respostas de verdade conversando com pessoas.";
  const CONFERIR_IA = "Confira sempre se as respostas oferecidas pela IA combinam com o que você realmente faz, descarte qualquer número ou estatística que ela mencionar sem indicar uma fonte confiável.";
  /* "Não sei" ajuda a responder, mas não responde: a pessoa segue depois de escrever no campo da pergunta */
  const MSG_ESCREVA = "Escreva a sua resposta no campo acima para continuar. Se não souber, toque em “Não sei” para ver uma sugestão.";
  const MSG_ESCREVA_SEM = "Escreva a sua resposta no campo acima para continuar.";
  /* lote 16/11: depois de abrir a ajuda do "Não sei", o Continuar pede a resposta de verdade */
  const MSG_AJUDA = "Use a ajuda acima e escreva a sua resposta para continuar.";
  const MSG_AJUDA_MARQUE = "Use a ajuda acima e marque pelo menos uma opção para continuar.";
  const NOTA_NS_MARQUE = "Use a sugestão e marque acima o que as pessoas escolhem no lugar. Você segue depois de responder.";
  const NOTA_NS_CONC = "Use a sugestão e responda acima, em cada concorrente. Você segue depois de responder.";
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
  /* lote 17/11 (tempo e contador honestos): o total é o do caminho mais longo (sem o desvio do "Não" na pergunta 2 e
     com o "o que dificultaria"), então não pula no meio; o número é a posição no caminho da pessoa e só anda para frente. */
  const totalEstavel = () => M.perguntas.filter((q) => !q.oculta && !Motor.pulada(q, S.R, H)).length;
  function posicao(cod) {
    const ts = Motor.telas(M, S.R, H), k = ts.findIndex((t) => t.includes(cod));
    return k >= 0 ? `Pergunta ${k + 1} de ${Math.max(totalEstavel(), ts.length)}` : "Ajuste a sua resposta";
  }
  /* ~35 s por pergunta do caminho mais comum (o mais longo; o que veio das Etapas 1 e 2 não conta), múltiplo de 5 min */
  const minutosCapa = () => Math.max(5, Math.round((totalEstavel() * 35) / 60 / 5) * 5);
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

  /* lote 16/11 (sem pergunta repetida): o que vende (Módulo 1) e quem compra (Módulo 2) entram prontos;
     as telas são puladas e aparecem num cartão "Veio do Módulo N" com "Trocar" na tela seguinte. */
  function herdar() {
    const q01 = M.porCodigo["M3.P01"], q10 = M.porCodigo["M3.P10"];
    if (Motor.pulada(q01, S.R, H)) {
      const r = S.R["M3.P01"];
      if (!r || r.valor !== H.p01) { S.R["M3.P01"] = { estado: "valor", valor: H.p01, doM1: true }; salvar(); }
    }
    if (Motor.pulada(q10, S.R, H)) {
      const ini = perfilInicial(S.R);
      const r = { estado: "opcao", opcao: ini.ops[0], opcoes: ini.ops.slice(), campos: ini.campos, herdado: "M2" };
      if (JSON.stringify(r) !== JSON.stringify(S.R["M3.P10"])) gravarR("M3.P10", r);
    }
  }
  const ROT_HERDADO = { "M3.P01": ["Etapa 1", "O que você vende"], "M3.P10": ["Etapa 2", "Quem compra de você"] };
  function puladasAntes(cod) {
    const ts = Motor.telas(M, S.R, H), k = ts.findIndex((t) => t.includes(cod));
    if (k < 0) return [];
    const idx = (c) => M.perguntas.findIndex((x) => x.codigo === c);
    const de = k > 0 ? idx(ts[k - 1][ts[k - 1].length - 1]) : -1, ate = idx(cod);
    return M.perguntas.filter((x, i) => i > de && i < ate && Motor.mostrada(x, S.R) && Motor.pulada(x, S.R, H) && ROT_HERDADO[x.codigo]);
  }
  function cartaoHerdado(x) {
    const r = S.R[x.codigo], [mod, rot] = ROT_HERDADO[x.codigo];
    const txt = x.codigo === "M3.P10" ? Motor.opcoesDe(r).map((o) => o.replace(/\s*\(.*\)$/, "")).join(" e ") : H.p01;
    return `<div class="herdado-mini" data-cod="${esc(x.codigo)}"><span class="selo-m">Veio da ${esc(mod)}</span>
      <p class="herdado-txt">${esc(rot)}: ${esc(txt)}</p><button class="btn-alt trocar-h" type="button" data-cod="${esc(x.codigo)}">Trocar</button></div>`;
  }

  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  function el(html) { const d = document.createElement("div"); d.innerHTML = html.trim(); return d.firstElementChild; }
  /* lote 17/11: depois de Continuar, o foco vai para o enunciado da tela nova (leitor de tela anuncia a pergunta) */
  let focarQ = false, anterior = null;
  function ir(f, a, b) {
    H = heranca(); herdar(); tela.innerHTML = ""; tela.appendChild(f(a, b)); window.scrollTo(0, 0);
    if (focarQ) { focarQ = false; const h = tela.querySelector("h2.q, .conc-topo h2"); if (h) h.focus({ preventScroll: true }); }
  }

  /* copiar com reserva: área de transferência → execCommand → deixa o texto selecionado para a pessoa copiar (como no Módulo 1) */
  function copiar(t, b, alvo) {
    const ok = () => (b.textContent = "Copiado");
    const reserva = () => {
      const a = document.createElement("textarea");
      a.value = t; a.setAttribute("readonly", ""); a.style.position = "fixed"; a.style.top = "0"; a.style.opacity = "0";
      document.body.appendChild(a); a.select();
      let foi = false;
      try { foi = document.execCommand("copy"); } catch (e) {}
      a.remove();
      if (foi) return ok();
      try { const r = document.createRange(); r.selectNodeContents(alvo); const s = getSelection(); s.removeAllRanges(); s.addRange(r); } catch (e) {}
      b.textContent = "Toque e segure o texto para copiar";
    };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(t).then(ok, reserva); else reserva();
  }
  /* ---------- "Não sei": caixa "Como descobrir" (2 passos concretos) ----------
     Os textos ficam nos dados de cada pergunta (comoDescobrir). O pedido para a IA vem logo abaixo,
     na caixa com o aviso de cuidado (promptIA nos dados ou o prompt do "Não sei" nos caminhos). */
  function caixaComo(q) {
    if (!q.comoDescobrir || !q.comoDescobrir.length) return null;
    const d = (q.caminhos || []).find((c) => /^Não sei/.test(c.opcao) && c.tipo === "Dica");
    const intro = d ? (Motor.variante(q, est()).caminhos || {})[d.opcao] || d.texto : "";
    return el(`<section class="como-descobrir" role="note"><b class="como-tit">Como descobrir</b>${intro ? `<p class="como-ns-intro">${esc(adaptar(intro))}</p>` : ""}
      <ol>${q.comoDescobrir.map((x) => `<li>${esc(adaptar(x))}</li>`).join("")}</ol></section>`);
  }
  /* o que aparece no "Não sei": os passos e um pedido pronto para a IA (sem repetir o passo a passo antigo) */
  function ajudaNaoSei(q, lista) {
    const ia = lista.filter((c) => c.tipo === "Prompt de IA");
    if (!q.comoDescobrir) return lista;
    if (!ia.length && q.promptIA) ia.push({ opcao: Motor.NS, tipo: "Prompt de IA", texto: `Prompt: "${q.promptIA}"` });
    return ia;
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
      corpo = `<p class="ia-aviso">${esc(AVISO_IA)}</p>${window.LG2Roteiro ? `<p class="ia-roteiro">${window.LG2Roteiro.botao("Ver o roteiro de entrevista")}</p>` : ""}${p.antes ? `<p class="antes">${esc(p.antes)}</p>` : ""}
        <p class="pedir-tit">Peça ajuda à IA</p>
        <p class="como-nota">Copie, cole numa IA de sua preferência e troque o que está entre colchetes.</p>
        <div class="prompt"><p class="prompt-txt">${esc(p.prompt)}</p><button class="btn-copiar" type="button">Copiar</button></div>
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
    if (bc) bc.onclick = () => copiar(b.querySelector(".prompt-txt").textContent, bc, b.querySelector(".prompt-txt"));
    return b;
  }
  function mostrar(box, lista, como) {
    box.innerHTML = "";
    if (como) box.appendChild(como);
    lista.filter((c) => c.tipo !== "Nenhum").forEach((c) => box.appendChild(caixa(c)));
  }

  /* ================= peças do layout (as mesmas do Módulo 5) ================= */
  function topo(trilha) {
    return `<div class="barra-topo">
      <img class="logo-mini" src="assets/minds.svg" alt="Minds of the Future">
      <nav class="trilha" aria-label="Você está em"><button class="trilha-link" type="button" data-inicio>Início</button><span>/</span><span>Etapa ${esc(D.modulo.numero)}</span>${trilha ? `<span>/</span><span>${esc(trilha)}</span>` : ""}</nav>
    </div>`;
  }
  function heroi(o) {
    /* versão leve: nas perguntas, faixa compacta (o passo e o nome do bloco, sem ilustração) */
    if (o.compacta) return `<section class="heroi heroi-compacta">
      <div class="heroi-txt"><div class="kicker ${o.kickerClasse || ""}">${esc(o.kicker)}</div><p class="heroi-tit ${o.titClasse || ""}">${esc(o.titulo)}</p></div>
    </section>`;
    return `<section class="heroi ${o.grande ? "heroi-grande" : ""}">
      <div class="heroi-topo">
        <div class="heroi-txt">
          <div class="kicker ${o.kickerClasse || ""}">${esc(o.kicker || "Etapa " + D.modulo.numero)}</div>
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
    return `<ol class="etapas" aria-label="Blocos da etapa">${D.blocos.map((nome, i) => {
      const k = i + 1, st = tudo || k < n ? "feita" : k === n ? "atual" : "";
      /* versão leve: só as bolinhas; o nome do bloco já aparece na faixa roxa */
      return `<li class="${st}" aria-label="${esc(nome)}"${k === n && !tudo ? ' aria-current="step"' : ""}><span class="bola" aria-hidden="true"></span></li>`;
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
        ${heroi({ grande: true, h1: true, titulo: D.modulo.titulo_capa || D.modulo.nome, texto: D.inicio.frase, img: "hero-inicio.webp" })}
        <main class="corpo">
          <p class="tempo">Esta etapa leva cerca de ${esc(minutosCapa())} minutos.</p>
          <details class="como-funciona"><summary>Como funciona</summary>
            <p class="como-intro">${esc(D.mapa.objetivo)}</p>
            <div class="cartao"><h3>Para quem é</h3><p>${esc(D.mapa.usuario)}</p></div>
            <div class="cartao"><h3>O que ter em mãos</h3>${listaOuTexto(D.mapa.ter_em_maos)}</div>
            <div class="cartao"><h3>O que você recebe no final</h3>${listaOuTexto(D.mapa.entrega)}</div>
          </details>
          <div class="acoes">
            <button class="btn btn-primario seta" id="ir">${iniciado ? "Continuar de onde parei" : "Começar"}</button>
            ${iniciado ? `<button class="btn btn-claro" id="zerar">Recomeçar do zero</button>` : ""}
            <button class="btn btn-linha" id="limites">O que esta etapa não faz</button>
          </div>
          ${rodape(true)}
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
        ${heroi({ titulo: "Limites da etapa" })}
        <main class="corpo">
          ${botaoVoltar()}
          <div class="cartao"><h3>O que a etapa não faz</h3><p>${esc(D.mapa.nao_faz)}</p></div>
          <div class="cartao"><h3>Que decisões ele apoia</h3><p>${esc(D.mapa.decisoes)}</p></div>
          ${ENCAMINHA ? `<div class="cartao encaminha"><h3>Quando procurar um profissional</h3><p>${esc(D.mapa.encaminhamentos)}</p></div>` : ""}
          <div class="aviso">${esc(D.mapa.mensagem_limite)}</div>
          ${rodape(true)}
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
    const sobre = anterior; anterior = null;
    if (!q) { throw new Error(`Pergunta da etapa não encontrada: ${cod}`); }
    if (S.hist[S.hist.length - 1] !== cod) { S.hist.push(cod); salvar(); }
    const tipo = Motor.campo(q), varias = Motor.varias(q);
    let resp = S.R[cod] || null;
    /* resposta que já veio de antes: aparece preenchida, com o selo */
    let seloTxt = "", notaPerfil = false;
    /* o que vende veio do Módulo 1: bloco fixo só para confirmar (dá para trocar) */
    /* lote 16/11: a tela só abre por "Trocar"/"Ajustar"; o campo já vem com o que veio do Módulo 1 */
    const doM1 = cod === "M3.P01" && H.p01 && (!resp || resp.doM1);
    if (doM1) { resp = { estado: "valor", valor: H.p01, doM1: true }; seloTxt = SELO_M1; }
    if (cod === "M3.P10" && resp && resp.herdado === "M2") seloTxt = SELO_M2;
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
    const rotOp = (op) => (op === Motor.NS ? rotNS : (q.rotulos_opcoes || {})[op] || op);

    const p = el(`
      <div class="pag">
        ${topo("")}
        ${heroi({ compacta: true, kicker: posicao(cod), kickerClasse: "passo", titulo: q.bloco.replace(/^Bloco \d+:\s*/, ""), titClasse: "bloco-nome" })}
        ${etapas(D.blocos.indexOf(q.bloco) + 1)}
        <main class="corpo">
          <div class="cartao-q">
          ${botaoVoltar()}
          ${sobre && sobre.length ? `<div class="bloco b-dica sobre-ant" role="note"><b>Sobre a sua resposta anterior</b>${sobre.map((c) => `<p>${esc(adaptar(c.texto))}</p>`).join("")}</div>` : ""}
          ${doResumo ? "" : puladasAntes(cod).map(cartaoHerdado).join("")}
          <div class="pergunta">
            <h2 class="q" tabindex="-1">${esc(enunciadoPergunta(q))}</h2>
            ${seloTxt ? selo(seloTxt) : ""}
            ${q.dica && !dicaNoCampo ? `<details class="dica-toggle dica-q"><summary>Ver dica</summary><p>${esc(porTipo(q.dica))}</p></details>` : ""}
            ${tipo === "multipla" || varias ? `<p class="mini-info">Marque quantas quiser.</p>` : ""}
            ${AJUDA_UNICA[cod] ? `<p class="mini-info">${esc(AJUDA_UNICA[cod])}</p>` : ""}
            ${tipo === "alternativas" && oQueVende() ? `<p class="mini-info contexto">Pensando em: <b>${esc(oQueVende())}</b></p>` : ""}
            <div class="entrada" id="ent"></div>
            ${(q.naosei && tipo !== "multipla") || q.nao ? `<div class="alt" id="alt">${q.nao ? `<button class="btn-alt" id="nao" type="button" aria-pressed="false">${Motor.NAO}</button>` : ""}${q.naosei && tipo !== "multipla" ? `<button class="btn-alt" id="ns" type="button" aria-pressed="false">${esc(rotNS)}</button>` : ""}</div>` : ""}
            <div id="ajudans"></div>
            <div id="msg" aria-live="polite"></div>
          </div>
          </div>
          <div class="fixo-q" id="fixo"><div class="erro" id="erro" role="alert" hidden></div><div class="acoes" id="acoes"></div></div>
          ${rodape()}
        </main>
      </div>`);
    ligar(p);
    p.querySelectorAll(".trocar-h").forEach((b) => (b.onclick = () => ir(telaPergunta, b.dataset.cod)));

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

    /* lote 17/11 (um toque por pergunta): Continuar grava e já abre a próxima. O retorno da resposta aparece ao vivo,
       logo abaixo dela. Só o aviso de risco real (preço fora do comum) pede um 2º toque: "Continuar mesmo assim". */
    let modoAtual = "", notaMesmo = null;
    function botoes(modo) {
      /* modo: "continuar" (normal) | "mesmo" (aviso de preço fora do comum) */
      if (modo === modoAtual && acoes.firstChild) return;
      modoAtual = modo;
      acoes.innerHTML = "";
      const rot = modo === "mesmo" ? "Continuar mesmo assim" : "Continuar";
      const b = el(`<button class="btn btn-primario seta" id="ok" type="button">${rot}</button>`);
      b.onclick = modo === "mesmo" ? () => { const r = coletar(); if (r) gravar(r); salvarNomes(); if (notaMesmo) anterior = notaMesmo; avancar(); } : continuar;
      acoes.appendChild(b);
    }
    function avancar() {
      focarQ = true;
      if (doResumo) { S.hist.pop(); S.hist.push("RESULTADO"); salvar(); return ir(telaResultado); }
      const prox = Motor.proxima(M, S.R, cod, H);
      if (prox === "RESULTADO") { S.hist.push("RESULTADO"); salvar(); ir(telaResultado); } else ir(telaPergunta, prox);
    }
    /* texto, dois campos e perfil: o retorno é desenhado ao vivo (aoVivo), então digitar não apaga o que está à vista */
    const VIVO = tipo === "texto" || tipo === "doiscampos" || tipo === "escolhacampos";
    const reabrir = () => { erroBox.hidden = true; erroBox.classList.remove("aviso-num"); if (!VIVO) msg.innerHTML = ""; notaMesmo = null; botoes("continuar"); };
    let vivoT = null, vivoChave = "", vistoEm = 0;
    function aoVivo(saiu) {
      clearTimeout(vivoT);
      if (!VIVO) return;
      const r = coletar();
      const rets = r && !faltando(r) ? Motor.mostraveis(q, r, est()).filter((c) => c.tipo !== "Alerta") : [];
      const chave = JSON.stringify(rets);
      if (chave === vivoChave) return;
      vivoChave = chave; vistoEm = rets.length ? Date.now() : 0;
      mostrar(msg, rets);
      /* celular pequeno: ao sair do campo, traz o retorno para a parte visível (acima do Continuar fixo) */
      if (saiu === true && rets.length && msg.scrollIntoView) msg.scrollIntoView({ block: "nearest" });
    }
    const agendar = () => { clearTimeout(vivoT); vivoT = setTimeout(aoVivo, 700); };

    /* ---- entradas por tipo ---- */
    let outro = null, camposBox = null, tab = null, outroT = null;
    let altSel = [], antigoTxt = "", concNomes = [], concR = {}, desenharConc = null;
    const ajudaAberta = () => !!ajudans.children.length;
    const SE_NS = " Se não souber, toque em “Não sei” para ver como descobrir.";
    /* ---- pergunta 3: alternativas ---- */
    function pintarAlt() {
      ent.querySelectorAll(".opcao").forEach((x) => { const on = altSel.includes(x.dataset.op); x.classList.toggle("sel", on); x.setAttribute("aria-pressed", String(on)); });
      ent.querySelectorAll(".alt-quais, .alt-nota").forEach((x) => { x.hidden = !altSel.includes(x.dataset.op); });
    }
    /* ---- concorrentes um a um ---- */
    function blocoConc(n) {
      const v = concR[n], modo = q.porConcorrente;
      const b = el(`<fieldset class="conc-bloco" data-nome="${esc(n)}"><legend class="conc-nome">${esc(n)}</legend></fieldset>`);
      if (modo === "texto") b.appendChild(el(`<textarea class="campo" rows="2" aria-label="${esc(n)}" placeholder="${esc(porTipo(q.placeholder || ""))}">${esc(typeof v === "string" ? v : "")}</textarea>`));
      else if (modo === "preco") {
        const x = v || {}, f = (k) => (x[k] == null ? "" : typeof x[k] === "number" ? Motor.reais(x[k]) : x[k]);
        const um = typeof x.min === "number" && x.min === x.max;
        q.campos.forEach((c, i) => b.appendChild(el(`<label class="item"><span>${esc(c)}</span><input class="campo" inputmode="decimal" autocomplete="off" data-c="${i ? "max" : "min"}" aria-label="${esc(n + ": " + c)}" placeholder="Ex.: ${i ? "60,00" : "40,00"}" value="${esc(i && um ? "" : f(i ? "max" : "min"))}"></label>`)));
      } else {
        const t = (v && v.tabela) || {};
        q.criterios.forEach((c) => {
          const linha = el(`<div class="t-linha" data-crit="${esc(c)}"><span class="t-crit">${esc(porTipo(c))}</span><div class="t-ops opcoes" role="group" aria-label="${esc(n + ": " + porTipo(c))}"></div></div>`);
          q.escala.forEach((e) => {
            const o = el(`<button type="button" class="t-op">${esc(e)}</button>`);
            o.dataset.v = e; o.classList.toggle("sel", t[c] === e); o.setAttribute("aria-pressed", String(t[c] === e));
            o.onclick = () => { linha.querySelectorAll(".t-op").forEach((z) => { z.classList.toggle("sel", z === o); z.setAttribute("aria-pressed", String(z === o)); }); reabrir();
              lerConc(); mostrar(msg, Motor.retornos(q, { estado: "valor", porNome: concR }, est()).filter((x) => x.tipo === "Resposta")); };
            linha.querySelector(".t-ops").appendChild(o);
          });
          b.appendChild(linha);
        });
      }
      return b;
    }
    function lerConc() {
      ent.querySelectorAll(".conc-bloco").forEach((b) => {
        const n = b.dataset.nome, modo = q.porConcorrente;
        if (modo === "texto") concR[n] = b.querySelector("textarea").value;
        else if (modo === "preco") concR[n] = { min: b.querySelector('[data-c="min"]').value, max: b.querySelector('[data-c="max"]').value };
        else { const t = {}; b.querySelectorAll(".t-linha").forEach((l) => { const x = l.querySelector(".t-op.sel"); if (x) t[l.dataset.crit] = x.dataset.v; }); concR[n] = { tabela: t }; }
      });
    }
    function coletarConc() {
      lerConc();
      const modo = q.porConcorrente, porNome = {}, vazios = [], erros = [], avisos = [];
      concNomes.forEach((n) => {
        const v = concR[n];
        if (modo === "texto") { if (vazio(v)) vazios.push(n); else porNome[n] = String(v).trim(); }
        else if (modo === "preco") {
          if (!v || (vazio(v.min) && vazio(v.max))) return vazios.push(n);
          const f = Motor.faixaPreco(v.min, v.max);
          if (f.erro) return erros.push(`${n}: ${f.erro}`);
          if (f.aviso) avisos.push(`${n}: ${f.aviso}`);
          porNome[n] = { min: f.r.min, max: f.r.max, valor: f.r.valor };
        } else {
          const t = (v && v.tabela) || {}, k = q.criterios.filter((c) => t[c]).length;
          if (!k) vazios.push(n);
          else if (k < q.criterios.length) erros.push(`Marque Melhor, Igual ou Pior em cada item de ${n}, ou deixe ${n} todo em branco.`);
          else porNome[n] = { tabela: t };
        }
      });
      const ns = Object.keys(porNome);
      let r = null;
      if (ns.length) {
        if (modo === "preco") {
          const todos = [].concat(...ns.map((n) => [porNome[n].min, porNome[n].max])), min = Math.min(...todos), max = Math.max(...todos);
          /* "valor" só com a faixa geral: o Módulo 5 lê os números deste texto */
          r = { estado: "valor", valor: min === max ? `R$ ${Motor.reais(min)}` : `de R$ ${Motor.reais(min)} a R$ ${Motor.reais(max)}`, min, max, porNome };
        } else if (modo === "tabela") r = { estado: "valor", valor: ns.map((n) => `${n}: ${q.criterios.map((c) => `${c} ${porNome[n].tabela[c]}`).join(", ")}`).join("; "), porNome };
        else r = { estado: "valor", valor: ns.map((n) => `${n}: ${porNome[n]}`).join("; "), porNome };
      }
      return { r, vazios, erros, avisos };
    }
    /* nome incluído aqui entra também na lista de concorrentes (pergunta "quem vende o mesmo") */
    function salvarNomes() {
      if (tipo !== "conc" || JSON.stringify(concNomes) === JSON.stringify(nomesConc(S.R))) return;
      S.R["M3.P15"] = { estado: "valor", valor: concNomes.join(", "), nomes: concNomes.slice() };
      salvar();
    }
    if (tipo === "escolha" || tipo === "escolhacampos" || tipo === "multipla") {
      ent.classList.add("opcoes");
      /* escolha única (Sim/Não e outras): grupo de rádio; tocar uma opção desmarca as outras */
      const multi = tipo === "multipla" || varias;
      /* lote 17/11: cada opção diz ao leitor de tela se está marcada (aria-pressed, como na Etapa 1) */
      ent.setAttribute("role", "group");
      ent.setAttribute("aria-label", enunciado(q));
      q.opcoes.forEach((op) => {
        const b = el(`<button class="opcao${multi ? " multi" : ""}" type="button" aria-pressed="false"><span class="radio" aria-hidden="true"></span><span class="op-txt"><b>${esc(rotOp(op))}</b></span></button>`);
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
            ent.querySelectorAll(".opcao").forEach((x) => { if (x !== b) { x.classList.remove("sel"); x.setAttribute("aria-pressed", "false"); x.blur(); } });
          }
          erroBox.hidden = true;
          botoes("continuar");
          pintar();
        };
        ent.appendChild(b);
      });
      if (q.opcoes.includes("Outro")) {
        outro = el(`<label class="item extra"><span>Outro</span><textarea class="campo" rows="2" placeholder="${esc(q.placeholder_outro || "")}">${esc(resp && resp.detalhe)}</textarea></label>`);
        ent.after(outro);
      }
      if (tipo === "escolhacampos") { camposBox = el(`<div class="campos"></div>`); ent.after(camposBox); }
    } else if (tipo === "doiscampos") {
      q.campos.forEach((c) => ent.appendChild(el(`<label class="item"><span>${esc(rotulo(q, c))}</span>
        <textarea class="campo" rows="3" data-c="${esc(c)}" placeholder="${esc((q.placeholders || {})[c] || "")}">${esc(resp && resp.campos && resp.campos[c])}</textarea></label>`)));
    } else if (tipo === "preco") {
      /* dois campos de número; só o primeiro é obrigatório */
      const ns = resp && resp.estado === "valor" ? (resp.min != null ? [resp.min, resp.max] : Motor.numeros(resp.valor)) : [];
      const ini = ns.length ? [Math.min(...ns), Math.max(...ns)] : [];
      const fmt = (n) => (n == null ? "" : Motor.reais(n));   // padrão brasileiro também no campo (1.500,00)
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
        ent.insertBefore(el(`<label class="item item-nome"><span>Nome ${k}</span><input class="campo" data-nome="${k}" autocomplete="off"${k === 1 && q.placeholder ? ` placeholder="${esc(q.placeholder)}"` : ""} value="${esc(v || "")}"></label>`), mais);
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
        const linha = el(`<div class="t-linha"><span class="t-crit">${esc(porTipo(c))}</span><div class="t-ops opcoes" role="group" aria-label="${esc(porTipo(c))}"></div></div>`);
        linha.dataset.crit = c;
        const pinta = () => linha.querySelectorAll(".t-op").forEach((b) => { const on = tab[c] === b.dataset.v; b.classList.toggle("sel", on); b.setAttribute("aria-pressed", String(on)); });
        q.escala.forEach((v) => {
          const b = el(`<button type="button" class="t-op" aria-pressed="false">${esc(v)}</button>`);
          b.dataset.v = v;
          b.onclick = () => { tab[c] = v; pinta(); reabrir(); mostrar(msg, Motor.retornos(q, { estado: "valor", tabela: tab }, est()).filter((x) => x.tipo === "Resposta")); };
          linha.querySelector(".t-ops").appendChild(b);
        });
        pinta(); box.appendChild(linha);
      });
      ent.appendChild(box);
      const temOutro = !!(resp && resp.outro);
      const bo = el(`<button type="button" class="btn-alt" id="outro-t" aria-pressed="${temOutro}">${esc(q.outro || "Outro")}</button>`);
      outroT = el(`<label class="item extra"><span>Qual outro ponto? Como você se sai nele?</span><textarea class="campo" rows="2" placeholder="${esc(q.placeholder_outro || "")}">${esc(resp && resp.outro)}</textarea></label>`);
      outroT.hidden = !temOutro;
      bo.classList.toggle("sel", temOutro);
      bo.onclick = () => { const on = outroT.hidden; outroT.hidden = !on; bo.classList.toggle("sel", on); bo.setAttribute("aria-pressed", on); reabrir(); if (on) outroT.querySelector("textarea").focus(); };
      ent.appendChild(el(`<div class="alt"></div>`)).appendChild(bo);
      ent.appendChild(outroT);
    } else if (tipo === "alternativas") {
      /* pergunta 3 (lote 16/11): tipos de alternativa com exemplo do tipo de negócio; "outra coisa" pede quais */
      const tn = H.tipo || "";
      altSel = resp && Array.isArray(resp.tipos) ? resp.tipos.slice() : [];
      const quais = Object.assign({}, resp && resp.quais);
      antigoTxt = resp && resp.estado === "valor" && !resp.tipos && !vazio(resp.valor) ? String(resp.valor) : "";
      ent.classList.add("opcoes");
      if (antigoTxt) ent.appendChild(el(`<p class="mini-info antigo">Você tinha escrito: ${esc(antigoTxt)}. Marque as opções acima para trocar, ou toque em Continuar para manter.</p>`));
      ent.setAttribute("role", "group"); ent.setAttribute("aria-label", enunciado(q));
      q.alternativas.forEach((a) => {
        const rot = (a.rotulo || {})[tn] || a.valor, ex = a.ex[tn] || a.ex[""];
        const b = el(`<button class="opcao multi" type="button" aria-pressed="false"><span class="radio" aria-hidden="true"></span><span class="op-txt"><b>${esc(rot)}</b><span class="op-ex">${esc(ex)}</span></span></button>`);
        b.dataset.op = a.valor;
        b.onclick = () => { altSel = altSel.includes(a.valor) ? altSel.filter((x) => x !== a.valor) : q.alternativas.map((x) => x.valor).filter((v) => v === a.valor || altSel.includes(v)); reabrir(); pintarAlt(); };
        ent.appendChild(b);
        if (a.quais) ent.appendChild(el(`<label class="item extra alt-quais" data-op="${esc(a.valor)}"><span>Quais?</span><input class="campo" data-falar data-quais="${esc(a.valor)}" autocomplete="off" placeholder="${esc((a.ph || {})[tn] || a.ph[""])}" value="${esc(quais[a.valor] || "")}"></label>`));
        if (a.nota) ent.appendChild(el(`<p class="mini-info alt-nota" data-op="${esc(a.valor)}">${esc(a.nota)}</p>`));
      });
    } else if (tipo === "conc") {
      /* concorrentes um a um (lote 16/11): um bloco por nome citado, com o nome como título */
      concNomes = nomesConc(S.R);
      concR = JSON.parse(JSON.stringify((resp && resp.porNome) || {}));
      antigoTxt = resp && resp.estado === "valor" && !resp.porNome && !vazio(Motor.texto(q, resp, est())) ? Motor.texto(q, resp, est()) : "";
      if (antigoTxt) ent.appendChild(el(`<p class="mini-info antigo">Você tinha escrito: ${esc(antigoTxt)}</p>`));
      if (!concNomes.length) ent.appendChild(el(`<p class="mini-info">Você ainda não citou concorrentes. Inclua um nome abaixo.</p>`));
      const box = el(`<div class="conc-blocos"></div>`);
      ent.appendChild(box);
      const mais = el(`<div class="conc-mais"><button type="button" class="btn-alt" id="mais-conc">+ Adicionar outro concorrente</button>
        <div class="conc-novo" hidden><label class="item"><span>Nome do concorrente</span><input class="campo" id="novo-nome" autocomplete="off" placeholder="Ex.: Padaria Central"></label>
        <button type="button" class="btn-alt" id="incluir">Incluir</button></div></div>`);
      ent.appendChild(mais);
      desenharConc = () => {
        lerConc();
        box.innerHTML = "";
        concNomes.forEach((n) => box.appendChild(blocoConc(n)));
        mais.querySelector("#mais-conc").hidden = concNomes.length >= MAX_CONC;
      };
      mais.querySelector("#mais-conc").onclick = () => { mais.querySelector(".conc-novo").hidden = false; mais.querySelector("#novo-nome").focus(); };
      mais.querySelector("#incluir").onclick = () => {
        const i = mais.querySelector("#novo-nome"), n = i.value.trim();
        if (!n) return i.focus();
        if (!concNomes.some((x) => x.toLowerCase() === n.toLowerCase())) { lerConc(); concNomes.push(n.charAt(0).toUpperCase() + n.slice(1)); }
        i.value = ""; mais.querySelector(".conc-novo").hidden = true; desenharConc(); reabrir();
      };
      desenharConc();
    } else {
      const linhas = dicaNoCampo ? Math.min(8, Math.max(4, Math.ceil(q.dica.length / 34))) : 4;
      ent.appendChild(el(`<textarea class="campo${dicaNoCampo ? " dica-campo" : ""}" rows="${linhas}"${dicaNoCampo ? ` placeholder="Dica: ${esc(q.dica)}"` : ""} aria-label="${esc(enunciadoPergunta(q))}">${esc(resp && resp.estado === "valor" ? resp.valor : "")}</textarea>`));
    }
    ent.addEventListener("input", () => { reabrir(); marcarNao(); agendar(); });
    /* ao sair do campo, o retorno aparece na hora (sem esperar os 700 ms) */
    /* ...mas não quando a pessoa está tocando no Continuar: o retorno empurraria o botão para baixo do dedo
       (o que ela não viu vai para o topo da próxima tela) */
    let tocandoFixo = false;
    const fixo = p.querySelector("#fixo");
    fixo.addEventListener("pointerdown", () => { tocandoFixo = true; });
    const soltar = () => setTimeout(() => { tocandoFixo = false; }, 0);
    fixo.addEventListener("pointerup", soltar); fixo.addEventListener("pointercancel", soltar);
    p.addEventListener("focusout", (e) => {
      if (!VIVO || !e.target.matches || !e.target.matches("input, textarea")) return;
      if (tocandoFixo || (e.relatedTarget && fixo.contains(e.relatedTarget))) { clearTimeout(vivoT); return; }
      aoVivo(true);
    });

    /* bloco do que veio do Módulo 1: o campo só aparece ao tocar em "Trocar" */

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
          box.querySelectorAll(".chip").forEach((b) => { const on = sel.includes(b.dataset.v); b.classList.toggle("sel", on); b.setAttribute("aria-pressed", String(on)); });
          if (campoOutro) campoOutro.hidden = !sel.includes("Outro");
        };
        MARC[c].forEach((o) => {
          const b = el(`<button type="button" class="chip" aria-pressed="false"></button>`);
          b.textContent = o; b.dataset.v = o;
          b.onclick = () => {
            sel = sel.includes(o) ? sel.filter((x) => x !== o) : Motor.ehNS(o) ? [o] : sel.filter((x) => !Motor.ehNS(x)).concat(o);
            pinta(); reabrir(); agendar();
          };
          box.querySelector(".marcar").appendChild(b);
        });
        if (campoOutro) { box.appendChild(campoOutro); campoOutro.addEventListener("input", pinta); }
        if (antigos.length) box.appendChild(el(`<p class="mini-info">Você tinha escrito: ${esc(antigos.join("; "))}</p>`));
        pinta(); camposBox.appendChild(box);
      });
      });
      camposBox.oninput = () => { reabrir(); agendar(); };
    }
    function pintar() {
      if (tipo === "alternativas") return pintarAlt();
      ent.querySelectorAll(".opcao").forEach((x) => {
        const on = tipo === "multipla" || varias ? marcadas.includes(x.dataset.op) : escolhida === x.dataset.op;
        x.classList.toggle("sel", on);
        x.setAttribute("aria-pressed", String(on));
      });
      if (outro) outro.hidden = !marcadas.includes("Outro");
      const chave = varias ? marcadas.join("|") : escolhida || "";
      if (tipo === "escolhacampos" && camposBox.dataset.op !== chave) { camposBox.dataset.op = chave; desenharCampos(); }
      /* retorno ao vivo das opções (Dica de cada alcance/canal; sugestão do "Não sei" das perguntas de marcar) */
      if (tipo === "multipla") mostrar(msg, marcadas.length ? Motor.retornos(q, { estado: "opcoes", opcoes: marcadas }, est()) : [], marcadas.includes(Motor.NS) ? caixaComo(q) : null);
      else if (tipo === "escolha" && escolhida) mostrar(msg, Motor.retornos(q, { estado: "opcao", opcao: escolhida }, est()));
      else if (tipo === "escolhacampos") { msg.innerHTML = ""; vivoChave = ""; }
    }

    function coletar() {
      if (tipo === "alternativas") {
        if (!altSel.length && antigoTxt) return resp;
        const quais = {};
        ent.querySelectorAll("[data-quais]").forEach((i) => { if (altSel.includes(i.dataset.quais) && i.value.trim()) quais[i.dataset.quais] = i.value.trim(); });
        return { estado: "valor", valor: altSel.map((t) => (quais[t] ? `${t}: ${quais[t]}` : t)).join("; "), tipos: altSel.slice(), quais };
      }
      if (tipo === "conc") return coletarConc().r || (antigoTxt ? resp : null);
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
      if (tipo === "texto" && vazio(r.valor)) return ajudaAberta() ? MSG_AJUDA : q.naosei ? MSG_ESCREVA : MSG_ESCREVA_SEM;
      if (tipo === "doiscampos" && q.campos.every((c) => vazio(r.campos[c]))) return ajudaAberta() ? MSG_AJUDA : "Escreva a sua resposta nos campos acima para continuar." + (q.naosei ? SE_NS : "");
      if (tipo === "alternativas") {
        if (!(r.tipos || []).length && !antigoTxt) return ajudaAberta() ? MSG_AJUDA_MARQUE : "Marque pelo menos uma opção para continuar." + (q.naosei ? SE_NS : "");
        const semQuais = q.alternativas.find((a) => a.quais && altSel.includes(a.valor) && !(r.quais || {})[a.valor]);
        if (semQuais) return "Escreva o que as pessoas escolhem no lugar, ou desmarque essa opção.";
      }
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
      if (tipo === "conc") {
        const c = coletarConc(), modo = q.porConcorrente;
        if (c.erros.length) return erro(c.erros.join(" "));
        if (!c.r) {
          if (antigoTxt) return avancar();            // resposta antiga (um texto só) fica como estava
          if (ajudaAberta()) return erro(modo === "alternativas" ? MSG_AJUDA_MARQUE : MSG_AJUDA);
          return erro((modo === "preco" ? "Digite o preço de pelo menos um concorrente para continuar." : modo === "tabela" ? "Marque Melhor, Igual ou Pior em cada item de pelo menos um concorrente para continuar."
            : "Responda para pelo menos um concorrente para continuar.") + (q.naosei ? SE_NS : ""));
        }
        /* concorrente sem resposta não é risco: grava o que foi respondido e avisa num cartão pequeno na próxima tela */
        const nota = c.vazios.length ? [{ tipo: "Dica", texto: `Você não respondeu para ${lista(c.vazios)}. Se quiser completar, toque em Voltar.` }] : null;
        if (c.avisos.length) { erroBox.classList.add("aviso-num"); erro(c.avisos.join(" ")); botoes("mesmo"); notaMesmo = nota; return; }
        gravar(c.r); salvarNomes();
        if (nota) anterior = nota;
        return avancar();
      }
      const r = coletar();
      const falta = faltando(r);
      if (tipo === "alternativas" && !antigoTxt && !(r && r.tipos && r.tipos.length) && ajudaAberta()) return erro(MSG_AJUDA_MARQUE);
      if (falta) return erro(falta);
      /* "rets" (e não "lista"): um const "lista" aqui escondia a função lista() usada no aviso dos concorrentes acima */
      const rets = Motor.retornos(q, r, est());
      /* Alerta (ex.: nada marcado): não grava, não avança; a mensagem fica logo acima do Continuar */
      if (Motor.bloqueia(rets)) return erro(rets.filter((c) => c.tipo === "Alerta").map((c) => adaptar(c.texto)).join(" "));
      gravar(r);
      if (r.doM1) return avancar();                                   // confirmou o que veio da Etapa 1
      /* retorno que a pessoa não chegou a ver ao vivo (tocou logo depois de digitar) vai para o topo da próxima tela */
      const vis = VIVO ? Motor.mostraveis(q, r, est()).filter((c) => c.tipo !== "Alerta") : [];
      if (vis.length && (!vistoEm || Date.now() - vistoEm < 800)) anterior = vis;
      avancar();
    }

    /* ---- "Não sei": mostra a sugestão (dica, passo a passo ou prompt de IA) e não grava nada ---- */
    const ns = p.querySelector("#ns"), nao = p.querySelector("#nao");
    function naoSei() {
      erroBox.hidden = true;
      mostrar(ajudans, ajudaNaoSei(q, Motor.retornos(q, { estado: "naosei" }, est())), caixaComo(q));
      ajudans.appendChild(el(`<p class="mini-info nota-ns" id="nota-ns">${esc(cod === "M3.P10" ? NOTA_NS_PERFIL : tipo === "alternativas" ? NOTA_NS_MARQUE : tipo === "conc" ? NOTA_NS_CONC : NOTA_NS)}</p>`));
      if (ns) { ns.classList.add("sel"); ns.setAttribute("aria-pressed", "true"); }
    }
    /* botão "Não": responde a pergunta aberta sem precisar digitar */
    function marcarNao() {
      if (!nao) return;
      const t = ent.querySelector("textarea"), on = !!t && t.value.trim() === Motor.NAO;
      nao.classList.toggle("sel", on); nao.setAttribute("aria-pressed", on);
    }
    if (ns) ns.onclick = naoSei;
    if (nao) nao.onclick = () => { const t = ent.querySelector("textarea"); t.value = Motor.NAO; reabrir(); marcarNao(); aoVivo(); };

    /* estado inicial */
    botoes("continuar");
    if (ent.classList.contains("opcoes")) pintar();
    marcarNao();
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
    const canais = (c, mapa) => { const r = RR[c]; return r && r.estado === "opcoes" ? r.opcoes.filter((o) => o !== "Outro" && !Motor.ehNS(o)).map((o) => mapa[o] || o.toLowerCase()).concat(r.detalhe ? [r.detalhe] : []) : []; };
    const sabe = canais("M3.P13A", { "Indicação (boca a boca)": "indicação (boca a boca)", "Google ou Google Maps": "Google" }), compra = canais("M3.P13", CANAL);
    if (sabe.length && compra.length) f.push(`As pessoas ${ideia ? "vão ficar" : "ficam"} sabendo de você por ${lista(sabe)} e ${ideia ? "vão comprar" : "compram"} por ${lista(compra)}.`);
    else if (compra.length) f.push(`Por onde o cliente ${ideia ? "vai comprar" : "compra"} de você: ${lista(compra)}.`);
    else if (sabe.length) f.push(`Como as pessoas ${ideia ? "vão ficar" : "ficam"} sabendo de você: ${lista(sabe)}.`);
    const conc = val("M3.P15"), preco = val("M3.P20"), dif = val("M3.P21");
    const ns = preco ? Motor.precos(RR["M3.P20"]) : [];
    const partes = [conc && `Quem vende algo parecido: ${aspas(conc)}`, ns.length && `eles cobram em torno de R$ ${Motor.reais(Motor.media(ns))}`].filter(Boolean);
    if (partes.length) f.push(partes.join("; ") + ".");
    if (dif) f.push(`O que ${ideia ? "vai fazer" : "faz"} o cliente preferir você: ${aspas(dif)}.`);
    /* até 6 frases: com a pergunta do diferencial de volta (lote 16/11), 5 cortava justo o diferencial */
    const out = f.slice(0, 6), c2 = out.length;   // 2º: canais, concorrentes e diferencial; 3º: o que ficou em aberto
    if (nPend) out.push(nPend === 1 ? "Ficou 1 pergunta com “Não sei”: vale voltar nela quando tiver a informação." : `Ficaram ${nPend} perguntas com “Não sei”: vale voltar nelas quando tiver a informação.`);
    if (!out.length) out.push("Você ainda não respondeu o suficiente para montarmos este retrato. Volte às perguntas quando puder.");
    return emParagrafos(out, Math.min(c1, c2), c2);
  }

  /* "Como calculamos" do preço médio dos concorrentes (mesmos números da frase acima dela) */
  function contaMedia(r) {
    const ns = Motor.precos(r);
    if (!ns.length) return "";
    if (ns.length === 1) return `Como calculamos: você informou um preço só, R$ ${Motor.reais(ns[0])}.`;
    return `Como calculamos: (${ns.map((n) => `R$ ${Motor.reais(n)}`).join(" + ")}) ÷ ${ns.length} = R$ ${Motor.reais(Motor.media(ns))}, a média dos preços que você viu.`;
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
  /* resposta de um concorrente: a dele (porNome) ou, na resposta antiga de um texto só, a geral */
  function doConc(RR, c, n) {
    const r = RR[c];
    if (!r || r.estado !== "valor") return { v: null };
    if (r.porNome) { const x = r.porNome[n]; return { v: x == null ? null : typeof x === "string" ? x : x.valor || null }; }
    return { v: vazio(r.valor) ? null : String(r.valor), geral: true };
  }
  /* alternativas da pergunta 3 em palavras curtas (sem "outro negócio", que já está nos cartões dos concorrentes) */
  function alternativasCurtas(RR, comConc) {
    const r = RR["M3.P03"];
    if (!r || r.estado !== "valor") return [];
    if (!Array.isArray(r.tipos)) return vazio(r.valor) ? [] : [aspas(r.valor)];
    return M.porCodigo["M3.P03"].alternativas.filter((a) => r.tipos.includes(a.valor) && (comConc || !a.nota)).map((a) => ((r.quais || {})[a.valor] || a.curto));
  }
  function tabelaConc(RR) {
    const nomes = nomesConc(RR);
    let geral = false;
    const linhas = nomes.map((n) => {
      const g = (c) => { const x = doConc(RR, c, n); if (x.geral && x.v) geral = true; return x.v; };
      return { nome: n, tipo: "Vende o mesmo que você (concorrente direto)", preco: g("M3.P20"), bem: g("M3.P22"), mal: g("M3.P22B"), como: g("M3.P18") };
    });
    if (!linhas.length) for (let i = 1; i <= 3; i++) linhas.push({ nome: `Concorrente ${i}`, tipo: "Vende o mesmo que você (concorrente direto)", vazio: true });
    const subst = alternativasCurtas(RR, false);
    if (subst.length) linhas.push({ nome: subst.map((x) => x.charAt(0).toUpperCase() + x.slice(1)).join("; "), tipo: "O que as pessoas escolhem no lugar (substituto)" });
    return { linhas, geral: geral && nomes.length > 1, modelo: !nomes.length };
  }
  function roteiro(RR) {
    const op = (c) => { const r = RR[c]; return r && r.estado === "opcoes" ? r.opcoes : []; };
    const cs = op("M3.P13").concat(op("M3.P13A"));
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
    const bem = valorDe(RR, "M3.P22"), mal = valorDe(RR, "M3.P22B");
    passos.push(bem && mal ? "Leia as avaliações no Google Maps e os comentários no Instagram e confira se o que você respondeu sobre os pontos fortes e fracos deles se repete."
      : "Leia 5 avaliações boas e 5 ruins no Google Maps ou nos comentários do Instagram e anote os elogios e as reclamações que mais se repetem.");
    passos.push(`Pergunte a 5 ${ideia ? "pessoas que comprariam de você" : "clientes"} onde ${ideia ? "elas compram hoje" : "mais eles já compraram"} e o que pesa na escolha: preço, qualidade, atendimento ou prazo.`);
    passos.push("Anote tudo na tabela de concorrentes abaixo, com onde você viu e a data.");
    return passos;
  }
  /* quadro dos concorrentes (relatório geral): pontos fortes e fracos dos outros, oportunidades e ameaças,
     só com frases tiradas das respostas; o que faltar fica "a anotar" */
  function quadro(RR) {
    const q19 = M.porCodigo["M3.P19"], r19 = RR["M3.P19"];
    /* comparação: por concorrente (nova) ou geral (resposta antiga) */
    const tabs = r19 && r19.porNome ? Object.entries(r19.porNome).map(([n, x]) => [n, (x && x.tabela) || {}]) : [[null, (r19 && r19.tabela) || {}]];
    const em = (t, v) => q19.criterios.filter((c) => t[c] === v).map((c) => porTipo(c).toLowerCase());
    const porNome = (c) => { const r = RR[c]; return r && r.porNome ? Object.entries(r.porNome).filter(([, v]) => !vazio(v)).map(([n, v]) => `${n}: ${v}`) : [valorDe(RR, c)]; };
    const sim = (c) => { const v = valorDe(RR, c); return v && v !== Motor.NAO ? v : null; };
    const r07 = RR["M3.P07"];
    const riscos = r07 && r07.estado === "opcoes" ? (r07.opcoes || []).filter((o) => o !== "Outro" && !Motor.ehNS(o)).map((o) => porTipo(o).toLowerCase()).concat(r07.detalhe ? [r07.detalhe] : [])
      : r07 && r07.estado === "valor" && !vazio(r07.valor) ? [r07.valor] : [];
    const melhor = tabs.map(([n, t]) => em(t, "Melhor").length && (n ? `Você se sai melhor que ${n} em ${lista(em(t, "Melhor"))}` : `Você se sai melhor em ${lista(em(t, "Melhor"))}`));
    const pior = tabs.map(([n, t]) => em(t, "Pior").length && (n ? `${n} se sai melhor que você em ${lista(em(t, "Pior"))}` : `Os outros se saem melhor em ${lista(em(t, "Pior"))}`));
    const alt = alternativasCurtas(RR, true);
    return [
      { id: "fortes", tit: "Pontos fortes dos concorrentes", xs: porNome("M3.P22") },
      { id: "fracos", tit: "Pontos fracos dos concorrentes", xs: porNome("M3.P22B") },
      { id: "oportunidades", tit: "Oportunidades para você", xs: [sim("M3.P04") && `Novidade que pode ajudar: ${aspas(sim("M3.P04"))}`,
        valorDe(RR, "M3.P08") && `O que pode mudar no jeito de comprar: ${aspas(valorDe(RR, "M3.P08"))}`, ...melhor] },
      { id: "ameacas", tit: "Ameaças para você", xs: [riscos.length && `O que pode atrapalhar: ${lista(riscos)}`,
        alt.length && `As pessoas podem escolher no lugar: ${lista(alt)}`, ...pior] },
    ].map((c) => Object.assign(c, { xs: c.xs.filter(Boolean) }));
  }
  function htmlEntregas(RR) {
    const t = tabelaConc(RR), anotar = `<span class="anotar">a anotar</span>`;
    const cel = (v) => (v ? esc(v) : anotar);
    const rot = (k) => porTipo(k);
    /* versão leve: cada entrega fica recolhida; o primeiro passo do roteiro aparece como tarefa no alto */
    return `<details class="resultado-mais" open><summary>Seu roteiro de pesquisa</summary><section class="entrega-m" id="roteiro">
        <ol class="roteiro">${roteiro(RR).map((x) => `<li>${esc(x)}</li>`).join("")}</ol>
      </section></details>
      <details class="resultado-mais" open><summary>Sua tabela de concorrentes</summary><section class="entrega-m" id="tabela-conc">
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
      </section></details>
      <details class="resultado-mais" open><summary>Quadro dos concorrentes</summary><section class="entrega-m" id="quadro-conc">
        <p class="mini-info">Montado só com as suas respostas. O que estiver “a anotar”, complete ao pesquisar.</p>
        <div class="quadro">${quadro(RR).map((c) => `<div class="q-cel q-${c.id}" data-q="${c.id}"><h3>${esc(c.tit)}</h3>${c.xs.length ? `<ul>${c.xs.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : `<p>${anotar}</p>`}</div>`).join("")}</div>
      </section></details>`;
  }

  function telaResultado() {
    anterior = null;
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
            <div class="conc-topo"><span class="check" aria-hidden="true"></span><div><h2 tabindex="-1">Você concluiu a Etapa ${esc(D.modulo.numero)}</h2></div></div>
          </section>
          <section class="entendemos" id="entendemos">
            <h2>O que entendemos até aqui</h2>
            ${entendemos(RR, telasPend.length).map((t) => `<p>${esc(t)}</p>`).join("")}
            ${RR["M3.P20"] && RR["M3.P20"].estado === "valor" && Motor.precos(RR["M3.P20"]).length ? `<p class="como-calc">${esc(contaMedia(RR["M3.P20"]))}</p>` : ""}
          </section>
          <div class="tarefa" id="tarefa"><b>Sua tarefa para fazer já</b><p>${esc(roteiro(RR)[0])}</p></div>
          <div class="res-num">
            <div class="lbl">Perguntas respondidas</div>
            <div class="val">${telasResp.length} de ${telas.length}</div>
            <div class="sub">${telasPend.length ? `${telasPend.length} com “Não sei”` : "nenhuma com “Não sei”"}</div>
          </div>
          ${pend.length || semResp.length ? `<section class="pendentes" id="pendentes">
            ${pend.length ? `<div class="secao-titulo">Perguntas que você marcou como Não sei</div>
            ${pend.map((q) => `<div class="pend" data-cod="${q.codigo}"><p>${esc(enunciadoPergunta(q))}</p><button class="btn btn-claro preencher" data-cod="${q.codigo}">Preencher agora</button></div>`).join("")}` : ""}
            ${semResp.length ? `<div class="secao-titulo">Perguntas sem resposta</div>
            ${semResp.map((q) => `<div class="pend" data-cod="${q.codigo}"><p>${esc(enunciadoPergunta(q))}</p><button class="btn btn-claro preencher" data-cod="${q.codigo}">Responder agora</button></div>`).join("")}` : ""}
          </section>` : ""}

          ${htmlEntregas(RR)}

          <details class="respostas" id="respostas" open>
          <summary>Ver suas respostas</summary>
          ${blocos.map((b) => `<section class="res-bloco"><div class="bloco-titulo">${esc(b.nome)}</div>
            ${b.qs.map((q) => {
              const r = RR[q.codigo];
              const msgs = r ? Motor.retornos(q, r, est()).filter((c) => c.tipo === "Resposta") : [];
              const veio = r && r.doM1 ? "Veio da Etapa 1" : r && r.herdado === "M2" ? "Veio da Etapa 2" : r && r.doPerfil ? "Veio do perfil do cliente" : "";
              return `<div class="etapa ${!r ? "e-nao" : Motor.pendente(r) ? "e-conf" : "e-sim"}" data-cod="${q.codigo}">
                <b class="etapa-q">${esc(enunciadoPergunta(q))}</b>
                ${veio ? `<span class="selo-m selo-res">${veio}</span>` : ""}
                ${Motor.hipotese(q, r) ? `<span class="hip">hipótese a investigar</span>` : ""}
                <p class="etapa-r">${r ? esc(Motor.texto(q, r, est()) || "Sem resposta") : "Sem resposta"}</p>
                ${msgs.map((c) => `<p class="etapa-m">${esc(adaptar(c.texto))}</p>${q.codigo === "M3.P20" ? `<p class="como-calc">${esc(contaMedia(r))}</p>` : ""}`).join("")}
                ${veio ? `<button class="btn btn-claro ajustar" data-cod="${q.codigo}">Ajustar</button>` : ""}
              </div>`;
            }).join("")}</section>`).join("")}
          </details>

          <details class="resultado-mais" open><summary>Mais detalhes</summary>
            <div class="cartao"><h3>O que esta etapa entrega</h3>${listaOuTexto(D.mapa.entrega)}</div>
            ${ENCAMINHA ? `<div class="cartao encaminha"><h3>Quando procurar um profissional</h3><p>${esc(D.mapa.encaminhamentos)}</p></div>` : ""}
            <div class="aviso">${esc(D.mapa.mensagem_limite)}</div>
          </details>

          <div class="acoes">
            <button class="btn btn-primario" id="imp">Salvar ou imprimir</button>
            <button class="btn btn-claro" id="rev">Revisar respostas</button>
            <button class="btn btn-linha" id="novo">Começar outra análise</button>
          </div>
          <div class="acoes lg2-proximo"><a class="btn btn-primario" style="text-decoration:none;text-align:center;box-sizing:border-box" href="/lg2/turma-a/m04/index.html">Ir para a Etapa 4</a></div>
          ${rodape(true)}
        </main>
      </div>`);
    p.querySelector("#v").onclick = () => {
      S.hist.pop(); const a = S.hist.pop(); salvar();
      if (a && M.porCodigo[a]) ir(telaPergunta, a); else ir(telaCapa);
    };
    ligar(p);
    p.querySelectorAll(".preencher, .ajustar").forEach((b) => (b.onclick = () => ir(telaPergunta, b.dataset.cod, true)));
    p.querySelector("#imp").onclick = () => { p.querySelectorAll("details").forEach((d) => { d.open = true; }); window.print(); };
    p.querySelector("#rev").onclick = () => { S.hist = []; salvar(); ir(telaPergunta, Motor.proxima(M, S.R, null, H)); };
    p.querySelector("#novo").onclick = () => { if (confirm("Começar uma nova análise? As respostas atuais serão apagadas.")) { S = novo(); salvar(); ir(telaPergunta, Motor.proxima(M, {}, null, H)); } };
    return p;
  }

  /* versão leve: o crédito em texto só na capa, nos limites e no resultado; nas perguntas, só as marcas */
  function rodape(credito) {
    return `<footer class="rodape">
      ${credito ? `<p class="credito">Laboratório de Gestão II · FACC/UFJF · versão ${esc(D.modulo.versao)} · fontes consultadas em ${esc(D.modulo.data)}</p>` : ""}
      <div class="logos">
        <img src="assets/logo_facc.png" alt="FACC">
        <img src="assets/logo_ufjf.svg" alt="UFJF">
        <img src="assets/logo_mg.svg" alt="Governo de Minas Gerais">
      </div>
    </footer>`;
  }

  /* I: o rodapé compartilhado injeta as fontes após a tela; abra-as apenas na tela de resultado. */
  const obsResultado = new MutationObserver(() => {
    if (!document.querySelector(".lg2-proximo")) return;
    document.querySelectorAll(".p-fontes").forEach((d) => { d.open = true; });
  });
  obsResultado.observe(document.body, { childList: true, subtree: true });
  ir(telaCapa);
})();
