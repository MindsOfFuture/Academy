/* Telas do Módulo 10 (Turma B). Todo texto de conteúdo vem de window.MODULO10 (planilha
   "Perguntas e Caminhos" do Grupo 10; capa e conceitos do documento v2 do grupo), sem edição.
   O módulo fecha o percurso: lê as respostas dos Módulos 1 a 9 guardadas neste aparelho (só leitura).
   As regras da lista de prioridades e do plano ficam em motor.js; a capacidade do Módulo 7 em motor7.js. */
(function () {
  "use strict";
  const D = window.MODULO10;
  const Mo = window.Motor10;
  const RN = window.ResumoNegocio;
  const PERG = window.PERGUNTAS_LG2 || {};
  const M7c = window.Motor7;
  const tela = document.getElementById("tela");
  const CHAVE = "lg2-turma-b-m10";
  const VERSAO = 3; // v2 = planilha "Perguntas e Caminhos"; v3 (16/11) = "Não sei" não grava mais (v2 é migrada)
  const NS = "Não sei";
  /* 16/11: perguntas sobre a própria pessoa (o que ela faz, quer ou pretende) não têm mais "Não sei" */
  const SEM_NS = new Set(["M10-01", "M10-02", "M10-03", "M10-04", "SOCIO", "M10-06", "M10-08"]);
  /* nas demais, "Não sei" só abre a ajuda "Como descobrir" e não grava nada */
  const MSG_NS = "Use a ajuda acima e escolha uma opção para continuar.";
  const Q = Object.fromEntries(D.perguntas.map((q) => [q.codigo, q]));
  const SOCIO = "SOCIO"; // pergunta do documento v2 ("Você tem ou pretende ter sócio?"): o Módulo 8 publicado não a faz

  /* ---------- estado ---------- */
  function novo() { return { v: VERSAO, ini: null, R: {}, roteiro: null, hist: [], inst: { mensagem: null, checklist: {} }, voltarResumo: false }; }
  function carregar() { try { const s = JSON.parse(localStorage.getItem(CHAVE)); return s && (s.v === VERSAO || s.v === 2) && s.R ? migrar(Object.assign(novo(), s)) : novo(); } catch (e) { return novo(); } }
  /* nov/2026: opções de canais renomeadas (canais do dia a dia primeiro), frase do plano refeita e
     mensagem de apresentação montada na hora. O formato do estado não muda: só os textos antigos. */
  const OP_ANTIGA = {
    "M10-01": { "WhatsApp": "WhatsApp Business ou WhatsApp", "Instagram ou outra rede": "Catálogo no Instagram ou outra rede social", "Pessoalmente": "Pessoalmente (atendimento direto)" },
    "M10-05": { "Indicação de quem já comprou": "Indicação e boca a boca de quem já comprou", "Redes sociais próprias": "Catálogo no Instagram ou outra rede social", "Grupos de mensagem": "Grupos de mensagem do bairro ou da comunidade" },
  };
  function migrar(s) {
    /* v2 → v3: resposta "Não sei" salva vira "sem resposta" (a pessoa responde quando passar por lá);
       as outras respostas ficam como estão */
    Object.keys(s.R).forEach((k) => {
      const r = s.R[k];
      if (!r) return;
      if (r.estado === "naosei" || (k === "M10-05" && r.opcao === "Ainda não sei")) delete s.R[k];
      else if (k === "M10-09" && r.naosei) r.naosei = false; /* as 3 marcadas foram confirmadas no Continuar: ficam */
      else if (k === "M10-10" && r.u) Object.keys(r.u).forEach((t) => { if (r.u[t] === "não sei") delete r.u[t]; });
    });
    s.v = VERSAO;
    /* 17/11: "Módulo N" virou "Etapa N" no texto. Os pontos da lista de prioridades guardados com o texto antigo
       ("… (Módulo 3)", "Rever uma resposta “Não sei” do Módulo 4") passam ao texto novo, para continuarem marcados */
    const etapaTxt = (t) => typeof t === "string" ? t.replace(/\(Módulo (\d+)\)/g, "(Etapa $1)").replace(/“Não sei” do Módulo (\d+)/g, "“Não sei” da Etapa $1") : t;
    const r9 = s.R["M10-09"];
    if (r9 && Array.isArray(r9.opcoes)) r9.opcoes = r9.opcoes.map(etapaTxt);
    const r10 = s.R["M10-10"];
    if (r10 && r10.u) r10.u = Object.fromEntries(Object.entries(r10.u).map(([k, v]) => [etapaTxt(k), v]));
    if (s.prioridade) s.prioridade = etapaTxt(s.prioridade);
    Object.entries(OP_ANTIGA).forEach(([cod, m]) => {
      const r = s.R[cod];
      if (!r) return;
      if (r.estado === "opcao" && m[r.opcao]) r.opcao = m[r.opcao];
      if (Array.isArray(r.opcoes)) r.opcoes = r.opcoes.map((x) => m[x] || x);
    });
    const r11 = s.R["M10-11"];
    if (r11 && r11.estado === "plano") r11.frase = Mo.frasePlano(r11);
    s.inst = Object.assign({ mensagem: null, checklist: {} }, s.inst);
    /* mensagem vazia ou a montagem antiga automática = deixa o app montar de novo */
    if (s.inst.mensagem != null && (!String(s.inst.mensagem).trim() || (s.ini && s.inst.mensagem === [s.ini.proposta, s.ini.diferencial].filter(Boolean).join(" ")))) s.inst.mensagem = null;
    return s;
  }
  let S = carregar();
  let aviso = "";
  function salvar() {
    try { localStorage.setItem(CHAVE, JSON.stringify(S)); aviso = ""; }
    catch (e) { aviso = "Não foi possível salvar. Mantenha a página aberta e imprima o resultado para guardar suas respostas."; }
  }

  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  function el(html) { const d = document.createElement("div"); d.innerHTML = html.trim(); return d.firstElementChild; }
  /* nova tela; numa pergunta, o foco vai para o enunciado (o leitor de tela lê a pergunta nova) */
  function ir(f, a) {
    tela.innerHTML = ""; tela.appendChild(f(a)); window.scrollTo(0, 0);
    const q = tela.querySelector(".cartao-q.pergunta h2.q[tabindex]");
    if (q) try { q.focus({ preventScroll: true }); } catch (e) {}
  }
  function redesenhar(f, a) { const y = window.scrollY; tela.innerHTML = ""; tela.appendChild(f(a)); window.scrollTo(0, y); }
  const cap1 = (s) => { s = String(s || "").trim(); return s.charAt(0).toUpperCase() + s.slice(1); };
  /* minúscula só na 1ª letra de cada item ("Redes sociais (Instagram, …), Loja física" → "redes sociais (Instagram, …), loja física").
     As palavras da própria pessoa não mudam de caixa quando são nome de marca ou rede (Instagram, WhatsApp, iFood…),
     sigla (PIX, MEI) ou têm maiúscula no meio (WhatsApp, TikTok): só baixa a 1ª letra de palavra comum "Capitalizada". */
  const NOMES_PROPRIOS = /^(instagram|insta|whatsapp|whats|zap|facebook|face|tiktok|youtube|kwai|pinterest|twitter|linkedin|telegram|messenger|google|gmail|ifood|rappi|uber|99|99food|shopee|mercado|amazon|magalu|olx|elo7|enjoei|aliexpress|shein|pix|picpay|nubank|sebrae|sumup|pagseguro|stone|cielo|juiz|minas|brasil)$/i;
  const baixaPalavra = (w) => {
    const m = /^([A-ZÀ-Ý])([a-zà-ÿ'’-]*)$/.exec(w.replace(/[.,;:!?)]+$/, ""));
    if (!m || NOMES_PROPRIOS.test(w.replace(/[^\wÀ-ÿ]/g, ""))) return w;
    return w.charAt(0).toLowerCase() + w.slice(1);
  };
  const minusc = (x) => String(x || "").replace(/^(\s*)(\S+)/, (_, sp, w) => sp + baixaPalavra(w));
  const lc = (s) => String(s || "").split(/,\s*(?![^()]*\))/).map(minusc).join(", ");
  const curto = (s, n) => { s = String(s || "").replace(/\s+/g, " ").trim(); return s.length > (n || 90) ? s.slice(0, (n || 90) - 1).trimEnd() + "…" : s; };

  /* ---------- respostas dos Módulos 1 a 9 guardadas neste aparelho (só leitura) ---------- */
  const MODS = { 1: "lg2-turma-a-m01", 2: "lg2-turma-b-m02", 3: "lg2-turma-a-m03", 4: "lg2-turma-a-m04", 5: "lg2-turma-a-m05", 6: "lg2-turma-b-m06", 7: "lg2-turma-b-m07", 8: "lg2-turma-b-m08", 9: "lg2-turma-b-m09" };
  const LINK = (n) => `/lg2/${MODS[n].replace("lg2-", "").replace(/-m\d\d$/, "")}/m${String(n).padStart(2, "0")}/index.html`;
  function lerEstado(n) { try { return JSON.parse(localStorage.getItem(MODS[n])) || null; } catch (e) { return null; } }
  /* quem já vende (Etapa 1) não passa pelo teste da primeira oferta da Etapa 4: respostas antigas dessas
     perguntas ficam salvas lá, mas não entram aqui */
  const TESTE_M4 = ["M4.P13", "M4.P14", "M4.P15", "M4.P16", "M4.P17", "M4.P18", "M4.P19", "M4.P20", "M4.P21"];
  const jaVendeM1 = () => { const s = lerEstado(1), r = s && s.R && s.R["M1.P01"]; return !!r && r.estado === "opcao" && /vend/i.test(String(r.opcao || "")); };
  /* lote 26/11 (2): idem para as conversas com possíveis clientes da Etapa 2 (P04, P18, P19, P21) */
  const CONVERSAS_M2 = ["M2.P04", "M2.P18", "M2.P19", "M2.P21"];
  const lerR = (n) => {
    const s = lerEstado(n), R = (s && s.R) || {};
    const fora = n === 4 ? TESTE_M4 : n === 2 ? CONVERSAS_M2 : null;
    if (!fora || !jaVendeM1()) return R;
    const c = Object.assign({}, R); fora.forEach((k) => delete c[k]); return c;
  };
  const valor = (r) => !r ? null : r.estado === "opcao" ? r.opcao : r.estado === "valor" ? r.valor : null;
  const textoDe = (r) => { const x = valor(r); return typeof x === "string" && x.trim() ? x.trim() : typeof x === "number" ? String(x) : null; };
  const listaDe = (r) => !r ? [] : Array.isArray(r.opcoes) ? r.opcoes.filter((x) => x !== NS) : r.estado === "opcao" && r.opcao !== NS ? [r.opcao] : [];
  /* "Não sei" de outros módulos (respostas antigas ainda salvas): a opção INTEIRA, não o começo de uma
     resposta real como "Ainda não sei fazer" */
  const NS_RE = /^(não sei( dizer)?|ainda não sei|ainda não defini|ainda não pensei( nisso)?)( \/ não sei)?\.?$/i;
  const ehNS = (r) => !!r && (r.estado === "naosei" || (r.estado === "opcao" && NS_RE.test(String(r.opcao || "").trim())));
  /* resposta gravada sem conteúdo (campo deixado em branco) */
  const ehVazio = (r) => {
    if (!r) return false;
    if (r.estado === "vazio" || r.estado === "vazia") return true;
    if (r.estado !== "valor") return false;
    const v = r.valor;
    if (v == null) return true;
    if (typeof v === "string") return !v.trim();
    if (Array.isArray(v)) return !v.some((x) => (x && typeof x === "object" ? Object.values(x).some((y) => String(y ?? "").trim()) : String(x ?? "").trim()));
    return false;
  };

  const ESTAGIOS = ["Ainda é uma ideia", "Já fiz testes ou amostras", "Já vendo"];
  const RECORRENTE = ["Algumas vezes por ano", "Todo mês", "Toda semana"];
  const APOIO_ALTO = ["De 6 a 10 h", "Mais de 10 h"];

  /* dinheiro dentro de campo editável no padrão brasileiro: 15 · 12,50 · 1.425,06 */
  const reaisCampo = (n) => { const r = Math.round(n * 100) / 100; return r.toLocaleString("pt-BR", { minimumFractionDigits: r % 1 ? 2 : 0, maximumFractionDigits: 2 }); };
  /* preço sugerido no Módulo 5 (sem preço digitado lá): custo + acréscimo */
  function comoPrecoM5() {
    const e5 = lerEstado(5), c5 = RN.contaM5(e5);
    return c5.sugerido && c5.custo > 0 ? `${RN.brl(c5.custo)} (custo de uma unidade) + ${nBR(Mo.num(e5 && e5.lucro))}% (acréscimo escolhido na Etapa 5) = ${RN.brl(c5.preco)}.` : "";
  }

  /* tela de partida: o que dá para trazer dos módulos anteriores */
  function herdar() {
    const m1 = lerR(1), m3 = lerR(3), m4 = lerR(4), m5 = lerR(5), m6 = lerR(6);
    const ini = { de: {} };
    const pega = (campo, v, mod) => { if (v != null && v !== "" && ini[campo] == null) { ini[campo] = v; ini.de[campo] = mod; } };
    /* o que vende: fonte principal = Módulo 1 (pergunta "O que você vende ou quer vender?") */
    const sem = (t) => (t && !/^n[ãa]o sei/i.test(t) ? t : null);
    pega("oferta", sem(textoDe(m1["M1.P03"])), 1);
    pega("oferta", sem(textoDe(m4["M4.P01"])), 4);
    pega("oferta", textoDe(m5["M5.P02"]) || textoDe(m5["M5.P10"]) || textoDe(m5["M5.P17"]), 5);
    pega("grupo", textoDe(m4["M4.P08"]), 4);
    pega("proposta", textoDe(m4["M4.P12"]), 4);
    pega("diferencial", textoDe(m3["M3.P21"]), 3);
    pega("canais", canaisM3().join(", ") || null, 3);
    const preco = Mo.num(textoDe(m5["M5.P36"]));
    pega("preco", preco > 0 ? textoDe(m5["M5.P36"]) : null, 5);
    /* sem preço digitado no Módulo 5: o preço sugerido lá (custo + acréscimo escolhido) */
    const c5 = RN.contaM5(lerEstado(5));
    pega("preco", c5.preco > 0 ? reaisCampo(c5.preco) : null, 5);
    const est = { "Ainda está só na minha cabeça": ESTAGIOS[0], "Já fiz um pouco para testar ou dar de amostra": ESTAGIOS[1], "Já vendi algumas vezes": ESTAGIOS[2], "Já vendo sempre": ESTAGIOS[2] }[textoDe(m1["M1.P01"])];
    pega("estagio", est, 1);
    const ent = textoDe(m4["M4.P04"]); pega("entrega", ent && ent !== NS ? ent : null, 4);
    const pag = listaDe(m6["M6.P04"]); pega("pagamento", pag.length ? pag.join(", ") : null, 6);
    return ini;
  }

  /* canais de venda do Módulo 3 por nome ("Outro" vira o que a pessoa escreveu) */
  function canaisM3() {
    const r = lerR(3)["M3.P13"];
    return listaDe(r).map((x) => (x === "Outro" ? (r.detalhe || "").trim() : x)).filter(Boolean);
  }
  /* campos vazios do ponto de partida recebem o que já existe nos outros módulos (nunca apaga o que a pessoa escreveu) */
  function completarIni() {
    if (!S.ini) return;
    const h = herdar();
    let mudou = false;
    Object.keys(h).forEach((k) => {
      if (k === "de" || h[k] == null || h[k] === "") return;
      if (S.ini[k] == null || String(S.ini[k]).trim() === "") { S.ini[k] = h[k]; S.ini.de = Object.assign({}, S.ini.de, { [k]: h.de[k] }); mudou = true; }
    });
    if (mudou) salvar();
  }

  /* contexto que não vira campo: lido na hora, para valer o que estiver salvo agora */
  function ctx() {
    const m2 = lerR(2), m3 = lerR(3), m4 = lerR(4), m5 = lerR(5), e7 = lerEstado(7) || {}, m7 = e7.R || {};
    const g33 = valor(m5["M5.P33"]);
    const gastos = Array.isArray(g33) ? g33.map((x) => (x && (x.nome || x.item || x.texto)) || (typeof x === "string" ? x : "")).join(" ") : "";
    const ouv = Mo.num(textoDe(m2["M2.P18"]));
    const onde = textoDe(m2["M2.P11"]);
    const freq = textoDe(m2["M2.P17"]);
    const conc = textoDe(m3["M3.P15"]);
    const n11 = m7["M7-11"];
    return {
      ouvidas: ouv !== null && !isNaN(ouv) && ouv >= 0 ? ouv : null,
      onde: onde && onde !== NS ? minusc(onde) : null,
      frequencia: freq && freq !== NS ? freq : null,
      recorrente: RECORRENTE.includes(freq),
      concorrente: conc ? curto(conc.split(/[,;\n]| e /)[0], 40) : null,
      divulgacaoM5: /divulga|an[uú]nci|propaganda|impulsion|tr[aá]fego|panflet|marketing/i.test(gastos),
      testeN: textoDe(m4["M4.P19"]),
      variedade: textoDe(m4["M4.P05"]),
      apoio7: textoDe(m7["M7-03"]),
      numeros7: n11 && Array.isArray(n11.opcoes) ? n11.opcoes : n11 && Array.isArray(n11.sugeridos) ? n11.sugeridos : [],
      etapas7: Array.isArray(e7.mapa) ? e7.mapa.filter((x) => String(x || "").trim()) : [],
      cap7: capM7(e7),
    };
  }
  /* capacidade do Módulo 7 com as mesmas contas daquele módulo (cópia de motor.js do M7) */
  function capM7(e7) {
    const ini = e7.ini || {}, R = e7.R || {};
    const r2 = R["M7-02"], r3 = R["M7-03"], r4 = R["M7-04"], r5a = R["M7-05a"];
    const minUn = ini.minUn > 0 ? ini.minUn : r2 && r2.estado === "valor" ? r2.minUn : null;
    const apoio = r3 ? (r3.estado === "naosei" ? NS : r3.opcao) : null;
    const ajuda = r4 && r4.estado === "opcao" ? r4.horas || 0 : 0;
    const equip = r5a && r5a.estado === "valor" ? { un: M7c.num(r5a.un), minVez: r5a.minVez } : null;
    const c = M7c.capacidade({ horas: ini.horas, apoio, ajuda, minUn, equip });
    const vol = M7c.num(ini.volume);
    const cmp = M7c.comparar(c, vol > 0 ? vol : null);
    return { c, vol: vol > 0 ? vol : null, cmp, mes: c.estado === "ok" ? M7c.texto(c, "mes") : null };
  }

  /* ---------- "Como calculamos": a conta em palavras, com os valores da pessoa, logo abaixo do número ---------- */
  const comoLinha = (t) => (t ? `<p class="como-calc">Como calculamos: ${esc(t)}</p>` : "");
  const nBR = (n, casas) => Number(n).toLocaleString("pt-BR", { maximumFractionDigits: casas == null ? 1 : casas });
  const somaTxt = (vals, total, rot) => (vals.length > 1 ? `${vals.map((x) => RN.brl(x)).join(" + ")} = ${RN.brl(total)} (${rot}).` : "");
  /* capacidade do Módulo 7: (horas da semana − apoio + ajuda) × 60 × 4,33 ÷ minutos por unidade */
  function comoCap(e7) {
    e7 = e7 || lerEstado(7) || {};
    const C = capM7(e7), c = C.c;
    if (!c || c.estado !== "ok") return "";
    const ini = e7.ini || {}, R = e7.R || {};
    const f = M7c.HORAS[ini.horas] || {};
    const r3 = R["M7-03"], r4 = R["M7-04"];
    const apoio = M7c.APOIO[r3 ? (r3.estado === "naosei" ? NS : r3.opcao) : ""] || 0;
    const ajudaH = r4 && r4.estado === "opcao" ? r4.horas || 0 : 0;
    const ajuda = ajudaH > 0 && ajudaH <= M7c.LIMITE.ajudaMax ? ajudaH : 0;
    const um = (h, x) => {
      if (!x) return "";
      const minMes = x.minProd * M7c.SEMANAS_MES;
      const horas = `(${nBR(h)} h por semana${apoio ? ` − ${nBR(apoio)} h de apoio` : ""}${ajuda ? ` + ${nBR(ajuda)} h de ajuda` : ""}) × 60 = ${nBR(x.minProd, 0)} min por semana; × ${nBR(M7c.SEMANAS_MES, 2)} semanas = ${nBR(minMes, 0)} min por mês`;
      if (x.limite === "equipamento" && x.equip) { const e = (R["M7-05a"] || {}); return `${horas}; ÷ ${nBR(e.minVez)} min por vez do equipamento = ${nBR(Math.floor(minMes / e.minVez + 1e-9), 0)} vezes × ${nBR(M7c.num(e.un))} por vez = ${nBR(x.mes, 0)} por mês`; }
      const minUn = ini.minUn > 0 ? ini.minUn : R["M7-02"] && R["M7-02"].minUn;
      return `${horas}; ÷ ${nBR(minUn)} min por unidade = ${nBR(x.mes, 0)} por mês (arredondado para baixo)`;
    };
    const partes = c.modo === "faixa" && c.lo.mes !== c.hi.mes ? [um(f.lo, c.lo), um(f.hi, c.hi)] : [um(c.modo === "min" ? f.lo : f.hi, c.modo === "min" ? c.lo : c.hi)];
    return partes.filter(Boolean).join("; e com ") + ".";
  }
  const comoFolga = (cap) => (cap && cap.cmp && cap.cmp.tipo === "folga" ? `${nBR(cap.c.lo.mes, 0)} (o que cabe por mês) − ${nBR(cap.vol, 0)} (o que você pretende fazer) = ${nBR(cap.cmp.n, 0)} por mês.` : "");
  /* Módulo 5: as parcelas dos gastos do mês (mesma soma de RN.contaM5) */
  function parcelasM5() {
    const R = lerR(5);
    const v = (c) => { const r = R["M5." + c]; return r && r.estado === "valor" ? r.valor : null; };
    const xs = [Mo.num(v("P29")), Mo.num(v("P31"))].concat((Array.isArray(v("P33")) ? v("P33") : []).map((x) => Mo.num(x && x.v)), [Mo.num(v("P27")), Mo.num(v("P35"))]);
    return xs.filter((n) => n > 0);
  }
  const parcelasM6 = () => { const r6 = lerR(6); return ["M6.P02", "M6.P11", "M6.P14", "M6.P17"].map((k) => Mo.num(textoDe(r6[k]))).filter((n) => n > 0); };
  /* contas por trás de "O que entendemos até aqui" (mesmos números de ResumoNegocio) */
  function contasResumo() {
    const out = [];
    const e5 = lerEstado(5), c5 = RN.contaM5(e5);
    let preco = c5.preco, sugerido = c5.sugerido, sobra = c5.sobra, pe = c5.pe;
    const pM = Mo.num(I().preco);
    if (pM > 0 && (preco === null || Math.abs(pM - preco) > 0.004)) { preco = pM; sugerido = false; sobra = c5.custo !== null ? preco - c5.custo - c5.taxa : null; pe = sobra > 0 && c5.mensal > 0 ? Math.ceil(c5.mensal / sobra - 1e-9) : null; }
    if (preco !== null && sugerido && c5.custo > 0) out.push(`${RN.brl(c5.custo)} (custo de uma unidade) + ${nBR(Mo.num(e5 && e5.lucro))}% (acréscimo escolhido na Etapa 5) = ${RN.brl(preco)} de preço sugerido.`);
    if (preco !== null && sobra !== null && c5.custo > 0) out.push(`${RN.brl(preco)} (preço) − ${RN.brl(c5.custo)} (custo de uma unidade)${c5.taxa > 0 ? ` − ${RN.brl(c5.taxa)} (taxas)` : ""} = ${RN.brl(sobra)} ${sobra > 0 ? "de sobra em cada venda" : "(não sobra dinheiro na venda)"}.`);
    if (c5.mensal > 0) {
      const s = somaTxt(parcelasM5(), c5.mensal, "gastos do mês informados na Etapa 5");
      if (s) out.push(s);
      if (pe) { const x = c5.mensal / sobra; out.push(`${RN.brl(c5.mensal)} (gastos do mês) ÷ ${RN.brl(sobra)} (sobra por venda) = ${Math.abs(x - Math.round(x)) < 1e-9 ? `${nBR(pe, 0)} vendas por mês` : `${nBR(x, 1)}; arredondamos para cima: ${nBR(pe, 0)} vendas por mês`}.`); }
    } else if (preco !== null && c5.qtd) out.push(`${RN.brl(preco)} (preço) × ${nBR(c5.qtd)} vendas por mês = ${RN.brl(preco * c5.qtd)}.`);
    const p6 = parcelasM6(), invest = p6.reduce((a, b) => a + b, 0), tem = Mo.num(textoDe(lerR(6)["M6.P07"]));
    if (invest > 0) { const s = somaTxt(p6, invest, "gastos para começar da Etapa 6"); if (s) out.push(s); }
    if (invest > 0 && tem >= 0 && tem < invest) out.push(`${RN.brl(invest)} (para começar) − ${RN.brl(tem)} (o que você tem) = ${RN.brl(invest - tem)} que faltam.`);
    const cap = comoCap();
    if (cap) out.push(cap);
    return out;
  }

  /* número para "cabem cerca de [N]" (como no Módulo 7) */
  const nCap = (c) => !c || c.estado !== "ok" ? "" : c.modo === "max" ? Mo.fmt(c.hi.mes) : c.modo === "min" ? `${Mo.fmt(c.lo.mes)} ou mais` : c.lo.mes === c.hi.mes ? Mo.fmt(c.hi.mes) : `${Mo.fmt(c.lo.mes)} a ${Mo.fmt(c.hi.mes)}`;

  /* ---------- leitura do estado ---------- */
  const I = () => S.ini || {};
  const oferta = () => (I().oferta || "").trim();
  const opR = (cod) => { const r = S.R[cod]; return r && r.estado === "opcao" ? r.opcao : r && r.estado === "naosei" ? NS : null; };
  const temSocio = () => opR(SOCIO) === "Sim";
  const contrata = () => (opR("M10-08") || "").startsWith("Sim");
  const vende = () => I().estagio === ESTAGIOS[2];
  /* Etapa 7 (M7-04 "Alguém ajuda você a fazer …?"): { tipo: "sozinho" | "familia" | "pago", horas } ou null */
  function ajuda7() {
    const r = lerR(7)["M7-04"];
    if (!r || r.estado !== "opcao" || typeof r.opcao !== "string") return null;
    const h = Number(r.horas) > 0 ? Number(r.horas) : 0;
    if (r.opcao.startsWith("Não")) return { tipo: "sozinho", horas: 0 };
    if (r.opcao.startsWith("Sim, pago")) return { tipo: "pago", horas: h };
    if (r.opcao.startsWith("Sim")) return { tipo: "familia", horas: h };
    return null;
  }
  const quemAjuda = (a) => `${a.tipo === "pago" ? "uma pessoa que você paga" : "família, amigo ou parceiro"}${a.horas ? `, ${nBR(a.horas)} h por semana` : ""}`;
  const SEM_ACORDO = ["Só combinamos de boca", "Ainda não"];

  /* ---------- opções: tiradas da coluna "Resposta / opção" ---------- */
  const META = new Set(["Mais de 3", "Outro (texto)", "Até 3 itens da lista", "Sem número", "Data acima de 90 dias", "Data inválida (passada)", "Ação, data, sinal e número preenchidos"]);
  function partes(e) {
    const dentro = /\(([^)]+)\)\s*$/.exec(e);
    if (dentro && /^(Uma ou mais|Responsável escolhido)/.test(e)) return dentro[1].split(", ").map(cap1);
    if (/^Para cada prioridade:/.test(e)) return e.replace(/^Para cada prioridade:\s*/, "").split(" / ").map(cap1);
    return e.split(" / ").map((x) => (/^para /.test(x) ? "Sim, " + x : x.trim()));
  }
  /* canais (pedido de testadores): os do dia a dia do pequeno negócio vêm primeiro (WhatsApp Business,
     catálogo nas redes, indicação, atendimento direto e em domicílio, aplicativo de entrega); site e
     marketplace depois. Cada opção nova responde com a mensagem da linha da planilha indicada. */
  const OPS_APP = {
    "M10-01": [
      ["WhatsApp Business ou WhatsApp", "WhatsApp"],
      ["Catálogo no Instagram ou outra rede social", "Instagram ou outra rede"],
      ["Pessoalmente (atendimento direto)", "Pessoalmente"],
      ["Na casa do cliente (atendimento em domicílio)", "Pessoalmente"],
      ["Aplicativo de entrega (iFood e outros)", "WhatsApp"],
      ["Telefone", "Telefone"],
      ["E-mail", "E-mail"],
      ["Site ou loja virtual próprios", "E-mail"],
      ["Marketplace (Mercado Livre, Shopee e outros)", "E-mail"],
      ["Ainda não falo com clientes", "Ainda não falo com clientes"],
    ],
    "M10-05": [
      ["Indicação", "Indicação de quem já comprou", "Indicação e boca a boca de quem já comprou"],
      ["WhatsApp", "Grupos de mensagem", "WhatsApp Business (status e lista de contatos)"],
      ["Redes sociais", "Redes sociais próprias", "Catálogo no Instagram ou outra rede social"],
      ["Grupos do bairro", "Grupos de mensagem", "Grupos de mensagem do bairro ou da comunidade"],
      ["Atendimento direto", "Indicação de quem já comprou", "Atendimento direto (conversa, amostra ou degustação)"],
      ["Atendimento em domicílio", "Indicação de quem já comprou", "Atendimento em domicílio (oferecer na casa do cliente)"],
      ["Aplicativo de entrega", "Parceria com outro negócio", "Aplicativo de entrega (iFood e outros)"],
      ["Cartaz ou panfleto", "Cartaz ou panfleto no bairro", "Cartaz ou panfleto no bairro"],
      ["Parceria", "Parceria com outro negócio", "Parceria com outro negócio"],
      ["Site próprio", "Redes sociais próprias", "Site próprio"],
      ["Marketplace", "Parceria com outro negócio", "Marketplace (Mercado Livre, Shopee e outros)"],
      ["Anúncio pago", "Anúncio pago"],
      [NS, "Ainda não sei"], /* "Não sei" responde com a linha "Ainda não sei" da planilha, dentro da ajuda */
    ],
  };
  /* linha pequena de exemplo embaixo das opções com palavra difícil (o texto da opção não muda) */
  const OP_EX = {
    "Pessoalmente (atendimento direto)": "Ex.: em casa, na loja ou na feira",
    "Redes sociais": "Ex.: Instagram, Facebook",
    "Grupos do bairro": "Ex.: grupo do condomínio",
    "Parceria": "Ex.: cartão na padaria vizinha",
    "Marketplace": "Ex.: Mercado Livre, Shopee",
    "Anúncio pago": "Ex.: post impulsionado",
    "Profissional por serviço avulso": "Ex.: pagar por dia ou por tarefa",
    "Rever o tempo de apoio": "Ex.: menos tempo com compras e mensagens",
    "Fazer a consulta de viabilidade na prefeitura": "Ex.: perguntar se pode funcionar no seu endereço",
    /* 17/11: opções da M10-05 que são jeito de vender ou entregar (não divulgação): a linha explica (o texto da opção não muda) */
    "Atendimento em domicílio": "É venda: divulgue na visita",
    "Aplicativo de entrega": "É venda; o app também divulga",
    "Menos variedade de opções": "Ex.: vender menos sabores ou modelos",
  };

  /* linha de exemplo: `ex` (da tela) vale mais que a fixa */
  const opTxt = (op, ex) => { const e = ex || OP_EX[op]; return `<span class="op-txt"><b>${esc(op)}</b>${e ? `<small class="op-ex">${esc(e)}</small>` : ""}</span>`; };

  /* ---------- M10-05 x Etapa 3 (M3.P13A "Como as pessoas ficam sabendo de você?") ----------
     Retorno ao vivo de cada opção da M10-05 (17/11): a frase única da planilha ("A mensagem de apresentação usa o
     seu diferencial") não fazia sentido para Parceria, Atendimento em domicílio, Aplicativo de entrega etc. */
  const RET05 = {
    "Indicação": ["Resposta", "Boa escolha: não custa nada. Peça a quem já comprou para indicar você a um conhecido."],
    "WhatsApp": ["Resposta", "Poste no status e mande para a sua lista de contatos uma ou duas vezes por semana, sem exagerar. No resultado há uma mensagem de apresentação pronta para usar."],
    "Redes sociais": ["Resposta", "Poste com frequência fotos do que você vende, com preço e como pedir. No resultado há uma mensagem de apresentação pronta para usar."],
    "Grupos do bairro": ["Resposta", "Antes de postar, veja as regras do grupo. No resultado há uma mensagem de apresentação pronta para usar."],
    "Atendimento direto": ["Resposta", "Deixar provar ou ver de perto convence quem ainda não conhece. Tenha um jeito fácil de a pessoa pedir depois."],
    "Atendimento em domicílio": ["Dica", "Ir até a casa do cliente é um jeito de vender. Para mais gente saber de você, aproveite a visita: deixe um cartão e peça indicação de vizinhos."],
    "Aplicativo de entrega": ["Dica", "O aplicativo é um lugar de venda que também mostra você para quem procura nele. Ele cobra uma parte de cada venda: confira essa taxa nos gastos da Etapa 5."],
    "Cartaz ou panfleto": ["Resposta", "Coloque onde o seu cliente passa (padaria, mercado, ponto de ônibus) e ponha um jeito fácil de falar com você."],
    "Parceria": ["Resposta", "Combine com o outro negócio o que cada um ganha. Ex.: o seu cartão no balcão dele e um desconto para os clientes dele."],
    "Site próprio": ["Dica", "Um site só traz clientes se as pessoas chegarem até ele. Divulgue o endereço no WhatsApp e nas redes."],
    "Marketplace": ["Dica", "O marketplace mostra você para quem já procura no site, mas cobra uma parte de cada venda: confira essa taxa nos gastos da Etapa 5."],
  };
  const caixa05 = (op) => RET05[op] ? caixa({ retorno: RET05[op][0], texto: RET05[op][1] }) : null;
  /* como fica sabendo (Etapa 3) → opção da M10-05, só quando a equivalência é clara */
  const P13A_PARA_05 = { "Indicação (boca a boca)": "Indicação", "Instagram ou outras redes sociais": "Redes sociais", "Status ou grupos de WhatsApp": "WhatsApp", "Placa, fachada ou panfleto": "Cartaz ou panfleto" };
  const P13A_OPS = ["Indicação (boca a boca)", "Instagram ou outras redes sociais", "Status ou grupos de WhatsApp", "Google ou Google Maps", "Placa, fachada ou panfleto", "Feira ou evento", "Outro"];
  /* resposta da Etapa 3 (sem "Não sei"); { opcoes, detalhe } ou null */
  function sabeM3() {
    const r = lerR(3)["M3.P13A"];
    if (!r || r.estado !== "opcoes" || !Array.isArray(r.opcoes)) return null;
    const ops = r.opcoes.filter((o) => o && !NS_RE.test(String(o).trim()));
    return ops.length ? { opcoes: ops, detalhe: String(r.detalhe || "").trim() } : null;
  }
  /* lista legível: "indicação (boca a boca), Google ou Google Maps e carro de som" */
  const sabeTxt = (h) => juntarE(h.opcoes.map((o) => (o === "Outro" ? h.detalhe : /^(Google|Instagram)/.test(o) ? o : o.charAt(0).toLowerCase() + o.slice(1))).filter(Boolean));
  const LINHA_APP = Object.fromEntries(Object.entries(OPS_APP).map(([c, l]) => [c, Object.fromEntries(l.map(([rotulo, original]) => [rotulo, original]))]));
  const OPS_ANTIGAS_UI = Object.fromEntries((OPS_APP["M10-05"] || []).map(([rotulo, , salvo]) => [salvo || rotulo, rotulo]));
  const rotuloAtual = (cod, valor) => cod === "M10-05" ? (OPS_ANTIGAS_UI[valor] || valor) : valor;
  const valorSalvo = (cod, rotulo) => cod === "M10-05" ? ((x) => x[2] || x[0])(OPS_APP[cod].find(([r]) => r === rotulo) || [rotulo]) : rotulo;
  const opcoesTodas = (cod) => OPS_APP[cod] ? OPS_APP[cod].map((x) => x[0]) : Q[cod].caminhos.filter((c) => !META.has(c.opcao) && !c.opcao.startsWith("'")).flatMap((c) => partes(c.opcao));
  /* "Não sei" sai das perguntas sobre a própria pessoa (SEM_NS) */
  const opcoesDe = (cod) => opcoesTodas(cod).filter((o) => !(SEM_NS.has(cod) && o === NS));
  const caminho = (cod, op) => { const o = (LINHA_APP[cod] && LINHA_APP[cod][op]) || op; return Q[cod].caminhos.find((c) => c.opcao === o || partes(c.opcao).includes(o)); };

  /* ---------- colchetes preenchidos pelo sistema ---------- */
  function preencher(t, extra) {
    const C = ctx();
    let s = String(t || "");
    const cond = {
      "Se tempo de apoio alto no M7": APOIO_ALTO.includes(C.apoio7),
      "Se compra recorrente no Módulo 2": C.recorrente,
      "Se capacidade curta no Módulo 7": !!(C.cap7.cmp && C.cap7.cmp.tipo === "falta"),
      "Se houver ofertas guardadas": false, // o Módulo 1 publicado não guarda outras ofertas
    };
    s = s.replace(/\s*\[(Se [^\]]+)\]:\s*([\s\S]*)$/, (_, k, x) => (cond[k] ? " " + x : ""));
    if (C.ouvidas == null) s = s.replace(/Você já ouviu \[pessoas ouvidas\] pessoas na Etapa 2\.\s*/, "");
    if (!C.onde) s = s.replace(/: a Etapa 2 mostrou onde ele procura \(\[onde procuram\]\)/, "");
    if (!I().diferencial) s = s.replace(/\s*A mensagem pode partir do seu diferencial: \[diferencial do Módulo 3\]\./, "");
    const mapa = {
      "[canais de venda do Módulo 3]": I().canais ? canaisTxt() : "onde você vende",
      "[canais de venda]": I().canais ? canaisTxt() : "onde você vende",
      "[onde procuram]": C.onde || "",
      "[pessoas ouvidas]": C.ouvidas != null ? Mo.fmt(C.ouvidas) : "",
      "[oferta em foco]": oferta() || "o que você vende",
      "[diferencial do Módulo 3]": I().diferencial || "",
      "[diferencial]": I().diferencial || "[o que o cliente ganha com você]",
      "[grupo em foco]": I().grupo || "[para quem]",
      "[frequência]": C.frequencia ? minusc(C.frequencia) : "",
      "[N]": nCap(C.cap7.c),
      "[volume]": C.cap7.vol ? Mo.fmt(C.cap7.vol) + " por mês" : "",
      "[concorrente]": C.concorrente || "um concorrente",
      "[etapas]": roteiro().join(" · "),
    };
    /* capacidade zero: "cabem cerca de 0" não faz sentido */
    if (C.cap7.c && C.cap7.c.estado === "ok" && C.cap7.c.hi.mes === 0) s = s.replace("cabem cerca de [N] por mês", "não cabe nem uma unidade por mês");
    Object.assign(mapa, extra || {});
    for (const k of Object.keys(mapa)) s = s.split(k).join(mapa[k]);
    return s.replace(/\b1 pessoas\b/g, "1 pessoa").replace(/\s+([.,?])/g, "$1").replace(/\s{2,}/g, " ").trim();
  }
  /* lista com "e" no fim: "a, b e c" */
  const juntarE = (xs) => (xs.length < 2 ? xs.join("") : xs.slice(0, -1).join(", ") + " e " + xs[xs.length - 1]);
  /* texto de apoio de cada pergunta, com os colchetes certos para ela */
  function apoioDe(cod) {
    let t = Q[cod].apoio || "";
    /* o sócio é perguntado neste módulo (o Módulo 8 não faz essa pergunta) */
    if (cod === "M10-06") t = t.replace("Você disse na Etapa 8 que terá sócio.", "Você disse que tem ou pretende ter sócio.");
    /* [etapas] aqui são as etapas do mapa do Módulo 7, não o roteiro de venda */
    return preencher(t, cod === "M10-07" ? { "[etapas]": juntarE(ctx().etapas7.map(minusc)) } : null);
  }

  /* ---------- roteiro de venda pré-montado (M10-03, instrumento "Roteiro de venda") ---------- */
  function roteiroModelo() {
    const r = ["Contato", "Entender a necessidade"];
    r.push(I().proposta ? `Apresentar a oferta: ${curto(I().proposta, 120)}` : "Apresentar a oferta");
    r.push(I().preco ? `Preço: R$ ${I().preco}` : "Preço");
    r.push(I().entrega ? `Combinar a entrega: ${lc(I().entrega)}` : "Combinar a entrega");
    r.push("Confirmar o pedido por escrito");
    r.push(I().pagamento ? `Receber: ${lc(I().pagamento)}` : "Receber");
    return r;
  }
  const roteiro = () => (S.roteiro && S.roteiro.length ? S.roteiro : roteiroModelo());
  const roteiroFinal = () => {
    const r = roteiro().slice();
    const pv = opR("M10-04");
    if (pv && !r.some((x) => /depois da entrega/i.test(x))) {
      if (pv === "Sim, peço opinião") r.push("Depois da entrega: pedir a opinião do cliente");
      else if (pv === "Sim, ofereço de novo") r.push("Depois da entrega: oferecer de novo");
      else if (pv === "Ainda não vendi" || pv === NS) r.push("Depois da entrega: mandar uma mensagem");
    }
    return r;
  };

  /* ---------- perguntas: quais aparecem ---------- */
  /* todas as perguntas que podem aparecer, na ordem (total estável da barra de progresso) */
  const TODAS = ["M10-01", "M10-02", "M10-03", "M10-04", "M10-05", SOCIO, "M10-06", "M10-07", "M10-08", "M10-08a", "M10-09", "M10-10", "M10-11"];
  function sequencia() {
    const seq = ["M10-01", "M10-02", "M10-03", "M10-04", "M10-05", SOCIO];
    if (temSocio()) seq.push("M10-06");
    if (ctx().etapas7.length) seq.push("M10-07");
    seq.push("M10-08");
    if (contrata()) seq.push("M10-08a");
    seq.push("M10-09");
    if (escolhidas().length) seq.push("M10-10", "M10-11");
    return seq;
  }
  const FASE = (cod) => (cod === SOCIO ? "Pessoas" : Q[cod].fase);
  /* M10-01 sem canais de venda conhecidos: a pergunta não fala em "Além de …" */
  const TXT = (cod) => (cod === SOCIO ? D.socio.pergunta : cod === "M10-01" && !canaisVenda() ? "Por onde falam os clientes?"
    : cod === "M10-05" && hoje05() ? TXT05_HERDADO
    : preencher(Q[cod].pergunta, { "[oferta em foco]": ofertaNaFrase() }));
  /* M10-05 com a Etapa 3 respondida: como as pessoas ficam sabendo HOJE já se sabe (cartão "Veio da Etapa 3");
     a pergunta passa a ser o que é novo: o que reforçar */
  const TXT05_HERDADO = "Qual caminho de divulgação você vai reforçar nas próximas semanas?";
  /* o que a pessoa disse na Etapa 3 (ou trocou aqui, guardado na própria resposta da M10-05) */
  const hoje05 = () => { const r = S.R["M10-05"], h = r && r.hoje && Array.isArray(r.hoje.opcoes) && r.hoje.opcoes.length ? r.hoje : null; return (h && h.trocado ? h : null) || sabeM3() || h; };
  /* oferta dentro de um enunciado: a resposta da pessoa só entra quando é curta e cabe na frase
     ("…saber que bolo de pote existe…"); longa, com ":" ou com várias linhas vira "o seu negócio" */
  const OFERTA_CURTA = 40;
  function ofertaNaFrase() {
    const o = oferta().replace(/[.;!]+$/, "").trim();
    if (!o || o.length > OFERTA_CURTA || /[:;\n]/.test(o) || NS_RE.test(o)) return "o seu negócio";
    return minusc(o);
  }

  /* ---------- M10-01: as opções não repetem os canais de venda que já aparecem na pergunta ---------- */
  const canaisVenda = () => String(I().canais || "").trim();
  const canaisTxt = () => { const xs = lc(canaisVenda()).split(/,\s*(?![^()]*\))/).map((x) => x.trim()).filter(Boolean); return xs.length < 2 ? xs.join("") : xs.slice(0, -1).join(", ") + " e " + xs[xs.length - 1]; };
  const JA_NA_PERGUNTA = { "WhatsApp Business ou WhatsApp": /redes sociais|whatsapp/i, "Catálogo no Instagram ou outra rede social": /redes sociais|instagram|facebook|tiktok/i, "Telefone": /telefone|liga[çc][ãa]o/i, "Pessoalmente (atendimento direto)": /loja f[ií]sica|pessoalmente|feira|porta a porta/i, "E-mail": /e-?mail/i, "Site ou loja virtual próprios": /\bsite\b|loja virtual/i, "Marketplace (Mercado Livre, Shopee e outros)": /marketplace|mercado livre|shopee/i, "Aplicativo de entrega (iFood e outros)": /ifood|aplicativo de entrega/i };
  const ops01 = () => opcoesDe("M10-01").filter((o) => !(canaisVenda() && JA_NA_PERGUNTA[o] && JA_NA_PERGUNTA[o].test(canaisVenda())));

  /* ---------- lista de prioridades (M10-09): lacunas e alertas dos Módulos 1 a 10 ---------- */
  function itensPercurso() {
    const it = [];
    const add = (tema, gravidade, modulo, bloqueia) => it.push({ tema, gravidade, modulo, bloqueia: !!bloqueia });
    const m1 = lerR(1), m2 = lerR(2), m4 = lerR(4), m5 = lerR(5), m6 = lerR(6), m7 = lerR(7), m8 = lerR(8), m9 = lerR(9);
    const C = ctx();
    /* gravidade alta */
    if (textoDe(m1["M1.P04"]) === "Ainda não sei fazer") add("Aprender a fazer o que você vai vender", "alta", 1);
    if (C.ouvidas === 0) add("Conversar com possíveis clientes", "alta", 2);
    if (ehNS(m5["M5.P36"])) add("Definir o preço de venda", "alta", 5);
    if (C.cap7.cmp && C.cap7.cmp.tipo === "falta") add("O que você quer vender não cabe no seu tempo", "alta", 7);
    if (textoDe(m9["M9-04"]) === "Sim, foi negada") add("Rever o endereço: a atividade foi negada nesse local", "alta", 9);
    if (textoDe(m9["M9-04"]) === "Ainda não fiz" || ehNS(m9["M9-04"])) add("Fazer a consulta de viabilidade na prefeitura", ["Na minha casa", "Em apartamento ou condomínio residencial", "Em loja ou sala comercial"].includes(textoDe(m9["M9-03"])) ? "alta" : "media", 9, true);
    if (SEM_ACORDO.includes(opR("M10-06"))) add("Acordo entre sócios", "alta", 10);
    /* gravidade média */
    if (SO_ELOGIOS.includes(textoDe(m2["M2.P21"]))) add("Confirmar com clientes se o problema é real", "media", 2);
    if (ehNS(m4["M4.P19"])) add("Definir o número que confirma o teste da ideia", "media", 4);
    if (ehNS(m6["M6.P07"])) add("Saber quanto dinheiro você tem para começar", "media", 6);
    const r76 = m7["M7-06"];
    if (r76 && (r76.p1 === "Só um" || r76.p1 === "Ainda não procurei")) add("Procurar mais fornecedores", "media", 7);
    if (textoDe(m7["M7-09"]) === "Ainda não confiro") add("Conferir a qualidade antes de entregar", "media", 7);
    if (m7["M7-02"] && m7["M7-02"].estado === "naosei") add("Medir o tempo de produção", "media", 7);
    if (textoDe(m8["M8.P05"]) === "Não") {
      const d = textoDe(m8["M8.P10"]);
      add(d && d !== NS ? `Tirar a dúvida sobre formalização: ${minusc(d)}` : "Entender o que falta para formalizar o negócio", "media", 8);
    }
    if (opR("M10-02") === "Mais de 2 dias") add("Tempo de resposta aos clientes", "media", 10);
    const r7 = S.R["M10-07"];
    if (r7 && r7.quem) Object.entries(r7.quem).forEach(([e, q]) => { if (q === "Ninguém ainda") add(`Definir quem cuida de: ${e}`, "media", 10); });
    /* gravidade baixa: cada resposta "Não sei" dos módulos, dizendo o que falta fazer (texto curto da pergunta) */
    for (let n = 1; n <= 9; n++) {
      const ab = abertas(n);
      ab.nomes.forEach((t) => add(`${t} (Etapa ${n})`, "baixa", n));
      if (ab.outras) add(`Rever ${ab.outras === 1 ? "uma resposta" : `${ab.outras} respostas`} “Não sei” da Etapa ${n}`, "baixa", n);
    }
    return it;
  }
  /* perguntas com "Não sei" num módulo; as que já viram um ponto próprio da lista não se repetem */
  const JA_NA_LISTA = new Set(["M1.P04", "M4.P19", "M5.P00", "M5.P36", "M6.P07", "M7-02", "M9-04"]);
  function abertas(n) {
    const nomes = [];
    let outras = 0;
    Object.entries(lerR(n)).forEach(([k, r]) => {
      if (!ehNS(r) || JA_NA_LISTA.has(k)) return;
      if (PERG[k]) { if (!nomes.includes(PERG[k])) nomes.push(PERG[k]); } else outras++;
    });
    return { nomes, outras };
  }
  const listaPrioridades = () => Mo.prioridades(itensPercurso());
  function escolhidas() {
    const r = S.R["M10-09"];
    if (!r) return [];
    return (r.opcoes || []).concat(r.outro ? [r.outro] : []).slice(0, Mo.LIMITE_PRIORIDADES);
  }
  /* resposta completa (M10-10: uma escala para cada prioridade; "não sei" antigo foi tirado na migração) */
  function respondida(c) {
    const r = S.R[c];
    if (!r) return false;
    if (c === "M10-10") return escolhidas().every((t) => r.u && r.u[t]);
    return true;
  }
  const ordemLista = () => listaPrioridades().map((x) => x.tema);
  function priosOrdenadas() {
    const r = S.R["M10-10"];
    return r && r.u ? Mo.ordenarPorUrgencia(escolhidas(), r.u, ordemLista()) : escolhidas();
  }

  /* ---------- peças do layout (modelo dos Módulos 6 e 7) ---------- */
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
      <nav class="trilha" aria-label="Você está em"><button class="trilha-link" data-inicio>Início</button><span>/</span><span>Etapa 10</span>${trilha ? `<span>/</span><span>${esc(trilha)}</span>` : ""}</nav>
    </div>`;
  }
  function heroi(o) {
    /* versão leve: nas perguntas, faixa compacta (só o passo e a barra de progresso, sem título repetido nem ilustração) */
    if (o.compacta) return `<section class="heroi heroi-compacta">
      <div class="heroi-txt">${o.kicker ? `<div class="kicker ${o.kickerClasse || ""}">${esc(o.kicker)}</div>` : ""}${o.titulo ? `<h2 class="heroi-tit">${esc(o.titulo)}</h2>` : ""}</div>
      ${o.pct != null ? `<div class="heroi-prog"><div class="barra" role="progressbar" aria-label="Progresso" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${o.pct}"><div class="barra-fill" style="width:${o.pct}%"></div></div></div>` : ""}
    </section>`;
    return `<section class="heroi ${o.grande ? "heroi-grande" : ""}">
      <div class="heroi-topo">
        <div class="heroi-txt">
          <div class="kicker ${o.kickerClasse || ""}">${esc(o.kicker || "Etapa 10")}</div>
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
    return `<ol class="etapas" aria-label="Fases da etapa">${fs.map((f, i) => {
      const st = tudo || i < n ? "feita" : i === n ? "atual" : "";
      return `<li class="${st}"${i === n && !tudo ? ' aria-current="step"' : ""}><span class="bola" aria-hidden="true"></span><span class="rot">${esc(f)}</span></li>`;
    }).join("")}</ol>`;
  }
  const chipOferta = () => `<div class="chip-oferta"><span>${esc(oferta() || "Seu negócio")}</span><button class="chip-alterar" id="alterar">Alterar</button></div>`;
  /* "‹ Voltar" no topo do cartão, à esquerda, acima da pergunta (mesmo lugar em todos os módulos, como no Módulo 1) */
  const botaoVoltar = () => `<div class="voltar-topo"><button type="button" class="btn-voltar" id="v" aria-label="Voltar"><span aria-hidden="true">‹</span> Voltar</button></div>`;
  function ligar(p) {
    p.querySelectorAll("[data-inicio]").forEach((b) => { b.onclick = () => ir(telaCapa); });
    const a = p.querySelector("#alterar"); if (a) a.onclick = () => ir(telaPartida, { volta: true });
    const z = p.querySelector("#zerar"); if (z) z.onclick = reiniciar;
    p.querySelectorAll("[data-copiar]").forEach((b) => {
      const alvo = b.parentNode.querySelector("[data-prompt]");
      b.onclick = () => copiar(alvo.textContent, b, alvo);
    });
  }
  /* copiar com reserva: área de transferência → execCommand → deixa o texto selecionado (como no Módulo 1) */
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
  const ehNSop = (o) => typeof o === "string" && /(?:ainda\s+)?não\s+sei/i.test(o);
  const ajudaQ = (cod) => (cod === SOCIO ? D.socio : Q[cod]) || {};
  function caixaComo(cod, dica, nota) {
    const q = ajudaQ(cod);
    if (!q.comoDescobrir || !q.comoDescobrir.length) return "";
    return `<section class="como-descobrir" role="status">
      <b class="como-tit">Como descobrir</b>
      ${dica ? `<p class="como-dica">${esc(dica)}</p>` : ""}
      <ol>${q.comoDescobrir.map((x) => `<li>${esc(x)}</li>`).join("")}</ol>
      ${q.promptIA ? `<div class="pedir-ia">
        <b>Peça ajuda à IA</b>
        <p class="como-nota">Copie, cole numa IA de sua preferência e troque o que está entre colchetes.</p>
        <p class="prompt" data-prompt>${esc(q.promptIA)}</p>
        <button class="btn-alt copiar" type="button" data-copiar>Copiar</button>
      </div>` : ""}
      ${nota ? `<p class="nota-ns" id="nota-ns">${esc(nota)}</p>` : ""}
    </section>`;
  }
  function reiniciar() {
    if (!confirm("Apagar todas as respostas desta etapa e recomeçar? Se quiser guardar, imprima o resultado antes.")) return;
    try { localStorage.removeItem(CHAVE); } catch (e) {}
    S = novo();
    ir(telaCapa);
  }
  function caixa(c, extra) {
    if (!c || !c.texto) return "";
    const t = preencher(c.texto, extra);
    if (!t) return "";
    const tit = c.retorno === "Dica" || c.retorno === "Atenção" ? c.retorno : "";
    const cls = c.retorno === "Atenção" ? "b-alerta" : c.retorno === "Dica" ? "b-proximo" : "b-ok";
    return `<div class="bloco ${cls}">${tit ? `<b>${tit}</b>` : ""}<p>${esc(t)}</p></div>`;
  }
  /* ajuda com mais de ~220 caracteres: 1ª frase à vista e o resto em "Ver mais" (fechado) */
  const AJUDA_CURTA = 220;
  function ajudaHtml(t) {
    t = String(t || "").trim();
    if (!t) return "";
    const m = /^([\s\S]+?[.!?])\s+([\s\S]+)$/.exec(t);
    if (t.length <= AJUDA_CURTA || !m) return `<p class="ajuda">${esc(t)}</p>`;
    return `<div class="ajuda ajuda-longa"><p>${esc(m[1])}</p><details class="ver-mais"><summary>Ver mais</summary><p>${esc(m[2])}</p></details></div>`;
  }
  /* conceitos da Base técnica (documento v2) ligados a cada pergunta: escolha do app */
  const CONCEITO = { "M10-01": ["M10-C02"], "M10-02": ["M10-C03"], "M10-03": ["M10-C04"], "M10-04": ["M10-C05"], "M10-05": ["M10-C01"], [SOCIO]: ["M10-C07"], "M10-06": ["M10-C07"], "M10-07": ["M10-C08"], "M10-08": ["M10-C09"], "M10-08a": ["M10-C06"], "M10-09": ["M10-C10"] };
  const sociedadeFontes = () => ((window.LG2_FONTES && window.LG2_FONTES.fontes) || []).filter((f) => (f.conceitos || []).includes("M10-C07"));
  function dicaSociedadeHtml() {
    if (!D.socio.dicaSociedade) return "";
    const fontes = sociedadeFontes();
    return `<section class="dica-sociedade"><b>Dica de sociedade</b><p>${esc(D.socio.dicaSociedade)}</p>${caixaComo(SOCIO, "", "")}${fontes.length ? `<p class="dica-fontes">Fontes: ${fontes.map((f) => `<a href="${esc(f.link)}" target="_blank" rel="noopener">${esc(f.orgao)} — ${esc(f.titulo)}</a>`).join("; ")}.</p>` : ""}</section>`;
  }
  /* "Ver dica" fechada entre a pergunta e as respostas: o texto de apoio (com os dados do percurso) + os termos */
  function dicaHtml(t, cods, extra) {
    t = String(t || "").trim();
    const ts = D.base.filter((b) => (cods || []).includes(b.codigo));
    if (!t && !ts.length) return "";
    return `<details class="dica-toggle"><summary>Ver dica</summary>
      ${t ? `<p class="ajuda">${esc(t)}</p>` : ""}${extra || ""}
      ${ts.map((x) => `<div class="conceito"><b>${esc(x.conceito)}</b><p>${esc(x.definicao)}</p><p class="ex">${esc(x.porque)}</p></div>`).join("")}
    </details>`;
  }

  /* ================= capa ================= */
  function telaCapa() {
    const K = D.capa;
    const comecou = !!S.ini;
    const p = el(`<div class="pag">
      ${topo("")}
      ${heroi({ grande: true, h1: true, kicker: "Etapa 10", titulo: D.modulo.nome, texto: K.frase })}
      <main class="corpo">
        <details class="como-funciona cartao"><summary>Como funciona</summary>
          <h3>Para quem é</h3><p>${esc(K.para_quem)}</p>
          <h3>O que ter em mãos</h3><p>${esc(K.ter_em_maos)}</p>
          <h3>O que você recebe no final</h3><p>${esc(K.entrega)}</p>
          <p class="aviso">Não inclua nomes, telefones, documentos ou outros dados pessoais nas respostas.</p>
        </details>
        <p class="tempo">Esta etapa leva cerca de ${esc(K.minutos)} minutos</p>
        <div class="acoes">
          <button class="btn btn-primario seta" id="ir">${comecou ? "Continuar de onde parei" : "Começar"}</button>
          ${comecou ? `<button class="btn btn-linha" id="zerar">Recomeçar do zero</button>` : ""}
        </div>
        ${rodape(true)}
      </main>
    </div>`);
    p.querySelector("#ir").onclick = () => {
      S.voltarResumo = false;
      if (!S.ini) return ir(telaPartida);
      const falta = sequencia().find((c) => !respondida(c));
      if (falta) return ir(telaPergunta, falta);
      ir(telaResultado);
    };
    ligar(p);
    return p;
  }

  /* ================= ponto de partida (o que veio dos Módulos 1 a 6) ================= */
  function telaPartida(o) {
    const volta = o && o.volta;
    const base = S.ini ? Object.assign({ de: {} }, S.ini) : herdar();
    const f = Object.assign({}, base);
    const veio = (campo) => base.de && base.de[campo] ? `<span class="veio">Veio da Etapa ${base.de[campo]}</span>` : "";
    const txt = (campo, rot, attrs, ph) => `<label class="rot-campo" for="f-${campo}">${esc(rot)} ${veio(campo)}</label><input class="campo" id="f-${campo}" data-campo="${campo}" value="${esc(f[campo] ?? "")}" ${ph ? `placeholder="${esc(ph)}"` : ""} ${attrs || ""}>`;
    const area = (campo, rot, ph) => `<label class="rot-campo" for="f-${campo}">${esc(rot)} ${veio(campo)}</label><textarea class="campo" rows="2" id="f-${campo}" data-campo="${campo}" ${ph ? `placeholder="${esc(ph)}"` : ""}>${esc(f[campo] ?? "")}</textarea>`;
    const sel = (campo, ops, rot) => `<fieldset class="grupo" data-sel="${campo}"><legend>${esc(rot)} ${veio(campo)}</legend>
      <div class="opcoes mini">${ops.map((x) => `<button type="button" class="opcao ${f[campo] === x ? "sel" : ""}" aria-pressed="${f[campo] === x}" data-v="${esc(x)}"><span class="radio" aria-hidden="true"></span><span class="op-txt"><b>${esc(x)}</b></span></button>`).join("")}</div></fieldset>`;
    const p = el(`<div class="pag">
      ${topo("Antes de começar")}
      ${heroi({ kicker: "Antes de começar", titulo: "Seu ponto de partida", texto: "Trouxemos o que você já respondeu nas etapas anteriores. Confira, corrija ou complete. Só “Como chega ao cliente” é obrigatório." })}
      <main class="corpo">
        <div class="cartao-q partida">
          ${botaoVoltar()}
          <h3 class="secao-titulo">Sua oferta</h3>
          ${txt("oferta", "O que você vende", "", "Ex.: bolo de pote, conserto de celular")}
          ${txt("grupo", "Para quem", "", "Ex.: mães que trabalham fora, vizinhos do bairro")}
          ${area("proposta", "O que você oferece de especial (proposta de valor)", "Ex.: bolo caseiro feito no dia, entregue em casa")}
          ${area("diferencial", "O que o cliente ganha comprando com você", "Ex.: não precisa sair de casa para ter sobremesa")}
          ${sel("estagio", ESTAGIOS, "Em que momento você está?")}
          <h3 class="secao-titulo">Como você vende hoje</h3>
          ${txt("canais", "Onde o cliente encontra você e compra", "", "Ex.: Instagram, WhatsApp, indicação de amigos, feira do bairro")}
          ${txt("preco", "Preço de venda de uma unidade (R$)", 'inputmode="decimal" placeholder="Ex.: 12,50"')}
          ${base.de && base.de.preco === 5 && comoPrecoM5() ? `<div id="como-preco">${comoLinha(comoPrecoM5())}</div>` : ""}
          ${txt("entrega", "Como chega ao cliente", 'aria-required="true"', "Ex.: entrega em casa ou retirada")}
          ${txt("pagamento", "Formas de pagamento", "", "Ex.: Pix, dinheiro, cartão")}
          <div class="acoes acoes-fixas"><div class="erro" id="erro" role="alert" hidden></div><button class="btn btn-primario seta" id="ok">Continuar</button></div>
        </div>
        ${rodape()}
      </main>
    </div>`);
    p.querySelectorAll("fieldset[data-sel]").forEach((fs) => fs.querySelectorAll(".opcao").forEach((b) => {
      b.onclick = () => { const k = fs.dataset.sel; f[k] = f[k] === b.dataset.v ? null : b.dataset.v; fs.querySelectorAll(".opcao").forEach((x) => { x.classList.toggle("sel", f[k] === x.dataset.v); x.setAttribute("aria-pressed", String(f[k] === x.dataset.v)); }); };
    }));
    p.querySelector("#v").onclick = () => { const u = S.hist[S.hist.length - 1]; if (S.voltarResumo || u === "RESULTADO") { S.voltarResumo = false; return ir(telaResultado); } volta && S.ini && u ? ir(telaPergunta, u) : ir(telaCapa); };
    let avisouPreco = null;
    p.querySelectorAll("[data-campo]").forEach((i) => i.addEventListener("input", () => { if (i.dataset.campo === "preco") { p.querySelector("#erro").hidden = true; const cp = p.querySelector("#como-preco"); if (cp) cp.hidden = i.value.trim() !== String(base.preco || ""); } }));
    p.querySelector("#ok").onclick = () => {
      p.querySelectorAll("[data-campo]").forEach((i) => { f[i.dataset.campo] = i.value.trim(); });
      const e = p.querySelector("#erro");
      /* coordenação 26/11: o jeito de o produto chegar ao cliente é obrigatório (entra no roteiro de venda) */
      if (!f.entrega) { e.textContent = "Como chega ao cliente: escreva como o que você vende chega a quem compra. Ex.: entrega em casa ou retirada."; e.hidden = false; const ce = p.querySelector("#f-entrega"); if (ce) { ce.setAttribute("aria-invalid", "true"); ce.focus(); } return; }
      const n = f.preco ? Mo.num(f.preco) : null;
      if (n !== null && (isNaN(n) || n < 0)) { e.textContent = "Preço de venda: digite só números. Ex.: 12,50 (ou deixe em branco)."; e.hidden = false; return; }
      /* preço alto: avisa uma vez e deixa seguir com o mesmo valor */
      if (n > Mo.PRECO_ALTO && avisouPreco !== f.preco) { avisouPreco = f.preco; e.textContent = `Preço de R$ ${f.preco} parece alto para um pequeno negócio caseiro; confira. Se estiver certo, toque em Continuar de novo.`; e.hidden = false; return; }
      f.de = Object.fromEntries(Object.entries(base.de || {}).filter(([k]) => String(f[k] ?? "") === String(base[k] ?? "")));
      S.ini = f;
      limparInvisiveis();
      salvar();
      if (S.voltarResumo) { S.voltarResumo = false; return ir(telaResultado); }
      const falta = sequencia().find((c) => !respondida(c));
      ir(falta ? telaPergunta : telaResultado, falta);
    };
    ligar(p);
    return p;
  }
  function limparInvisiveis() {
    const vis = new Set(sequencia());
    Object.keys(S.R).forEach((k) => { if (k !== "M10-12" && !vis.has(k)) delete S.R[k]; });
  }

  /* ================= pergunta ================= */
  function telaPergunta(cod) {
    const q = cod === SOCIO ? { apoio: "" } : Q[cod];
    /* barra com total estável (todas as perguntas que podem aparecer, na ordem): nunca volta para trás */
    const n = Math.max(1, TODAS.indexOf(cod) + 1);
    if (S.hist[S.hist.length - 1] !== cod) { S.hist.push(cod); salvar(); }
    const resp = S.R[cod];
    const p = el(`<div class="pag">
      ${heroi({ pct: Math.round(n / TODAS.length * 100), compacta: true })}
      <main class="corpo">
        <div class="cartao-q pergunta">
          ${botaoVoltar()}
          <h2 class="q" id="pergunta" tabindex="-1">${esc(TXT(cod))}</h2>
          ${dicaHtml(q.apoio ? apoioDe(cod) : "", CONCEITO[cod] || [], (cod === "M10-08" && /cabem cerca de/.test(q.apoio ? apoioDe(cod) : "") ? comoLinha(comoCap()) : "") + (cod === "M10-06" ? dicaSociedadeHtml() : ""))}
          <div class="entrada" id="ent"></div>
          <div id="retorno" aria-live="polite"></div>
          <div class="acoes acoes-fixas" id="acoes"><div class="erro" id="erro" role="alert" hidden></div><button class="btn btn-primario seta" id="ok">Continuar</button></div>
        </div>
        ${rodape()}
      </main>
    </div>`);
    const ent = p.querySelector("#ent"), box = p.querySelector("#retorno"), err = p.querySelector("#erro");
    const mostrar = (html) => {
      box.innerHTML = html || ""; if (!(aindaErrado && aindaErrado())) err.hidden = true;
      box.querySelectorAll("[data-copiar]").forEach((b) => { const alvo = b.parentNode.querySelector("[data-prompt]"); b.onclick = () => copiar(alvo.textContent, b, alvo); });
    };
    /* "Não sei": caixa "Como descobrir" com a dica da própria planilha para essa resposta; nada é gravado */
    const dicaNS = () => { const c = caminho(cod, NS); const direta = c ? preencher(c.texto) : ""; if (direta) return direta; return cod === "M10-05" ? "Comece pelo que não custa: avise quem já comprou e peça indicação." : cod === "M10-06" ? "Converse com o sócio sobre os itens do checklist de acordo." : cod === "M10-08" ? "Pense no que você deixa de fazer por falta de tempo. É isso que alguém faria." : cod === "M10-09" ? "Escolha até 3 prioridades ou escreva outra." : cod === "M10-10" ? "Responda para cada prioridade. Isso ajuda a decidir por onde começar." : cod === "M10-11" ? "Escreva o que vai fazer e até quando." : ""; };
    const ajudaNS = (dica, nota) => mostrar(caixaComo(cod, dica == null ? dicaNS() : dica, nota || MSG_NS));
    const erro = (t) => { err.textContent = t; err.hidden = false; };
    /* o erro some assim que a pessoa corrige (antes ficava na tela com os campos já preenchidos) */
    let aindaErrado = null;
    const limparErro = () => { if (!err.hidden && !(aindaErrado && aindaErrado())) err.hidden = true; };
    ent.addEventListener("input", limparErro);
    ent.addEventListener("change", limparErro);
    p.querySelector("#v").onclick = () => {
      S.hist.pop();
      const ant = S.hist.pop();
      salvar();
      if (ant && ant !== "RESULTADO") ir(telaPergunta, ant); else ir(telaPartida, { volta: true });
    };
    ligar(p);
    let coletar = null;

    function unica(ops, atual, aoTocar, exs) {
      const wrap = el(`<div class="opcoes"></div>`);
      ops.forEach((op) => {
        const b = el(`<button type="button" class="opcao ${atual === op ? "sel" : ""}" aria-pressed="${atual === op}"><span class="radio" aria-hidden="true"></span>${opTxt(op, exs && exs[op])}</button>`);
        /* "Não sei" não fica marcado (não é resposta): só abre a ajuda */
        b.onclick = () => { const ns = op === NS; wrap.querySelectorAll(".opcao").forEach((x) => { const m = !ns && x === b; x.classList.toggle("sel", m); x.setAttribute("aria-pressed", String(m)); }); aoTocar(op); };
        wrap.appendChild(b);
      });
      return wrap;
    }
    /* múltipla escolha; "exclusivas" desmarcam as outras */
    function multipla(ops, marcadas, exclusivas, aoMudar) {
      const wrap = el(`<div class="opcoes multi"></div>`);
      const pintar = () => wrap.querySelectorAll(".opcao").forEach((x) => { const m = marcadas.includes(x.dataset.v); x.classList.toggle("sel", m); x.setAttribute("aria-pressed", String(m)); });
      ops.forEach((op) => {
        const b = el(`<button type="button" class="opcao" aria-pressed="false" data-v="${esc(op)}"><span class="radio" aria-hidden="true"></span>${opTxt(op)}</button>`);
        b.onclick = () => {
          if (marcadas.includes(op)) marcadas.splice(marcadas.indexOf(op), 1);
          else if (exclusivas.includes(op)) marcadas.splice(0, marcadas.length, op);
          else { exclusivas.forEach((x) => { if (marcadas.includes(x)) marcadas.splice(marcadas.indexOf(x), 1); }); marcadas.push(op); }
          pintar();
          aoMudar(op);
        };
        wrap.appendChild(b);
      });
      wrap.pintar = pintar;
      pintar();
      return wrap;
    }
    const btnNaoSei = (fn) => { const b = el(`<div class="alt"><button class="btn-alt" id="ns">${NS}</button></div>`); b.querySelector("button").onclick = fn; return b; };
    function avancar(r0) {
      S.R[cod] = r0;
      limparInvisiveis();
      salvar();
      const seq2 = sequencia();
      if (S.voltarResumo && seq2.every((c) => respondida(c))) { S.voltarResumo = false; return ir(telaResultado); }
      const prox = seq2[seq2.indexOf(cod) + 1];
      prox ? ir(telaPergunta, prox) : ir(telaResultado);
    }
    /* retorno ao vivo dos campos de texto: ~700 ms sem digitar ou ao sair do campo (um toque em Continuar basta) */
    const aoVivo = (fn) => { let t = null; ent.addEventListener("input", () => { clearTimeout(t); t = setTimeout(fn, 700); }); ent.addEventListener("change", () => { clearTimeout(t); fn(); }); };

    if (cod === "M10-01") {
      const ops = ops01();
      if (canaisVenda() && I().de && I().de.canais) ent.appendChild(el(`<p class="herdado"><span class="veio">Veio da Etapa ${I().de.canais}</span></p>`));
      const EXC = ["Ainda não falo com clientes"];
      const marcadas = resp && resp.estado === "multi" ? resp.opcoes.slice() : resp && resp.opcao ? [resp.opcao] : [];
      const ret = () => mostrar(!marcadas.length ? "" : EXC.includes(marcadas[0]) ? caixa(caminho(cod, marcadas[0])) : caixa(Q[cod].caminhos[0]));
      ent.appendChild(multipla(ops, marcadas, EXC, ret));
      ret();
      coletar = () => {
        if (!marcadas.length) { erro("Marque pelo menos uma opção para continuar."); return null; }
        if (marcadas[0] === EXC[0]) return { estado: "opcao", opcao: EXC[0] };
        return { estado: "multi", opcoes: ops.filter((o) => marcadas.includes(o)) };
      };
    } else if (cod === "M10-03") {
      let op = resp && resp.estado === "opcao" ? resp.opcao : null;
      const lista = roteiro().slice();
      const wrap = el(`<div class="mapa-edit"><p class="rot-campo">Seu roteiro de venda (confira e ajuste)</p><div class="roteiro-diagrama" aria-label="Roteiro em diagrama"></div><div class="etapas-edicao"></div></div>`);
      const desenhar = () => {
        LG2Diagrama.render(wrap.querySelector('.roteiro-diagrama'), lista.map((nome) => ({ titulo: nome || 'Etapa sem nome' })));
        const edicao = wrap.querySelector('.etapas-edicao'); edicao.innerHTML = '';
        lista.forEach((nome, i) => {
          const l = el(`<div class="etapa-ed"><span class="num">${i + 1}</span><input class="campo" aria-label="Passo ${i + 1}" value="${esc(nome)}">
            <button class="mini-b" data-a="sobe" aria-label="Subir passo ${i + 1}" ${i === 0 ? "disabled" : ""}>↑</button><button class="mini-b" data-a="desce" aria-label="Descer passo ${i + 1}" ${i === lista.length - 1 ? "disabled" : ""}>↓</button><button class="mini-b x" data-a="tira" aria-label="Retirar passo ${i + 1}">×</button></div>`);
          l.querySelector("input").oninput = (e) => { lista[i] = e.target.value; };
          l.querySelectorAll("[data-a]").forEach((b) => (b.onclick = () => {
            const a = b.dataset.a;
            if (a === "tira") lista.splice(i, 1);
            if (a === "sobe") [lista[i - 1], lista[i]] = [lista[i], lista[i - 1]];
            if (a === "desce") [lista[i + 1], lista[i]] = [lista[i], lista[i + 1]];
            desenhar();
          }));
          edicao.appendChild(l);
        });
        const add = el(`<button class="btn-mais" id="mais">+ Incluir passo</button>`);
        add.onclick = () => { lista.push(""); desenhar(); const ins = wrap.querySelectorAll("input"); ins[ins.length - 1].focus(); };
        edicao.appendChild(add);
      };
      ent.appendChild(unica(opcoesDe(cod), op, (o) => { op = o; wrap.hidden = false; mostrar(caixa(caminho(cod, o))); }));
      wrap.hidden = !op;
      desenhar();
      ent.appendChild(wrap);
      if (op) mostrar(caixa(caminho(cod, op)));
      coletar = () => {
        if (!op) { erro("Escolha uma opção para continuar."); return null; }
        const limpa = lista.map((x) => x.trim()).filter(Boolean);
        S.roteiro = limpa.length ? limpa : null;
        return { estado: "opcao", opcao: valorSalvo(cod, op) };
      };
    } else if (cod === "M10-07") {
      const ops = opcoesDe(cod);
      const etapas = ctx().etapas7;
      const quem = Object.assign({}, resp && resp.quem);
      /* sem sócio: "Sócio" não é oferecido; se já estava escolhido, fica com um aviso (não trava) */
      const semSocio = opR(SOCIO) === "Não";
      const avisoSocio = () => {
        const xs = etapas.filter((e) => quem[e] === "Sócio");
        return semSocio && xs.length ? `<div class="bloco b-alerta"><b>Atenção</b><p>Você respondeu que não tem sócio, mas marcou o sócio em: ${esc(juntarE(xs.map(minusc)))}. Confira quem vai cuidar ${xs.length > 1 ? "dessas etapas" : "dessa etapa"}.</p></div>` : "";
      };
      const ret = () => {
        if (!etapas.every((e) => quem[e])) return mostrar(avisoSocio());
        mostrar((etapas.some((e) => quem[e] === "Ninguém ainda") ? caixa(Q[cod].caminhos[1]) : caixa(Q[cod].caminhos[0])) + avisoSocio());
      };
      const fluxo = el('<div class="responsaveis-diagrama" aria-label="Etapas e responsáveis"></div>');
      /* Etapa 7 (M7-04): quem ajuda já se sabe. Com ajuda, a nota diz que ela é o "Ajudante" da lista;
         sozinho(a) e sem sócio, "Eu" vem marcado em todas (dá para trocar) */
      const a7 = ajuda7();
      if (a7 && a7.tipo !== "sozinho") ent.appendChild(el(`<p class="herdado" id="ajuda7"><span class="veio">Veio da Etapa 7</span> Você tem ajuda de ${esc(quemAjuda(a7))}: marque “Ajudante” onde ela ajuda.</p>`));
      else if (a7 && !temSocio()) {
        if (!resp) etapas.forEach((e) => { if (!quem[e]) quem[e] = "Eu"; });
        ent.appendChild(el(`<p class="herdado" id="ajuda7"><span class="veio">Veio da Etapa 7</span> Você faz tudo sozinho(a), então marcamos “Eu” em todas. Troque onde for diferente.</p>`));
      }
      const desenharFluxo = () => LG2Diagrama.render(fluxo, etapas.map((e) => ({ titulo: e, marca: quem[e] ? `Responsável: ${quem[e]}` : "Responsável: escolha abaixo" })));
      desenharFluxo(); ent.appendChild(fluxo);
      etapas.forEach((e) => {
        ent.appendChild(el(`<p class="rot-campo">Responsável por: ${esc(e)}</p>`));
        ent.appendChild(unica(ops.filter((o) => o !== "Sócio" || !semSocio || quem[e] === "Sócio"), quem[e], (o) => { quem[e] = o; desenharFluxo(); ret(); }));
      });
      ret();
      coletar = () => {
        if (!etapas.every((e) => quem[e])) { erro("Escolha quem cuida de cada etapa."); return null; }
        return { estado: "etapas", quem };
      };
    } else if (cod === "M10-08a") {
      const ops = opcoesDe(cod);
      const marcadas = resp && resp.estado === "multi" ? resp.opcoes.slice() : [];
      const C = ctx();
      const ret = () => {
        const extra = [];
        if (marcadas.includes("Menos variedade de opções") && C.variedade) extra.push(`<div class="bloco b-proximo"><b>Da Etapa 4</b><p>${esc(curto(C.variedade, 160))}</p></div>`);
        if (marcadas.includes("Rever o tempo de apoio") && C.apoio7) extra.push(`<div class="bloco b-proximo"><b>Da Etapa 7</b><p>Tempo de apoio por semana: ${esc(C.apoio7)}.</p></div>`);
        mostrar(marcadas.length ? caixa(Q[cod].caminhos[0]) + extra.join("") : "");
      };
      ent.appendChild(multipla(ops, marcadas, ["Ainda nenhuma"], ret));
      ret();
      coletar = () => {
        if (!marcadas.length) { erro("Marque pelo menos uma opção para continuar."); return null; }
        return { estado: "multi", opcoes: ops.filter((o) => marcadas.includes(o)) };
      };
    } else if (cod === "M10-09") {
      const lista = listaPrioridades();
      const ops = lista.map((x) => x.tema);
      const marcadas = resp ? (resp.opcoes || []).filter((x) => ops.includes(x)) : [];
      const outro = el(`<div><label class="rot-campo" for="outro">Outro</label><input class="campo" id="outro" data-falar placeholder="Escreva outro ponto" value="${esc((resp && resp.outro) || "")}"></div>`);
      const total = () => marcadas.length + (outro.querySelector("input").value.trim() ? 1 : 0);
      if (!ops.length) ent.appendChild(el(`<p class="diag-r">Nenhum ponto em aberto apareceu nas etapas deste aparelho. Escreva o que é mais urgente para você.</p>`));
      const inOutro = outro.querySelector("input");
      /* retorno ao vivo: lista marcada e/ou "Outro" escrito (antes o "Outro" só aparecia depois do Continuar) */
      const ret9 = () => {
        if (total() > Mo.LIMITE_PRIORIDADES) return mostrar(caixa(caminho(cod, "Mais de 3")));
        mostrar((marcadas.length ? caixa(caminho(cod, "Até 3 itens da lista")) : "") + (inOutro.value.trim() ? caixa(caminho(cod, "Outro (texto)")) : ""));
      };
      const m = multipla(ops, marcadas, [], (op) => {
        if (marcadas.includes(op) && total() > Mo.LIMITE_PRIORIDADES) {
          marcadas.splice(marcadas.indexOf(op), 1);
          m.pintar();
          return mostrar(caixa(caminho(cod, "Mais de 3")));
        }
        ret9();
      });
      ent.appendChild(m);
      ent.appendChild(outro);
      inOutro.addEventListener("input", () => { if (total() > Mo.LIMITE_PRIORIDADES) mostrar(caixa(caminho(cod, "Mais de 3"))); });
      aoVivo(ret9);
      /* "Não sei": ajuda para escolher + as 3 que mais pesam pelo que a pessoa respondeu (sugestão, nada é marcado nem gravado) */
      if (ops.length) ent.appendChild(btnNaoSei(() => {
        const tres = Mo.tresPrimeiras(lista);
        ajudaNS(`Pelo que você respondeu, as que mais pesam são: ${tres.join("; ")}. Você pode escolher essas ou outras.`, "Use a ajuda acima e escolha até 3 pontos (ou escreva outro) para continuar.");
      }));
      if (marcadas.length || inOutro.value.trim()) ret9();
      coletar = () => {
        const o = outro.querySelector("input").value.trim();
        if (total() > Mo.LIMITE_PRIORIDADES) { mostrar(caixa(caminho(cod, "Mais de 3"))); return null; }
        if (!marcadas.length && !o) { erro(ops.length ? "Escolha até 3 pontos ou escreva outro para continuar. Em dúvida, toque em “Não sei” para ver como escolher." : "Escreva o que é mais urgente para você."); return null; }
        return { estado: "multi", opcoes: ops.filter((x) => marcadas.includes(x)), outro: o, naosei: false };
      };
    } else if (cod === "M10-10") {
      const ops = partes(Q[cod].caminhos[0].opcao);
      const u = Object.assign({}, resp && resp.u);
      const prios = escolhidas();
      const ret = () => {
        if (!prios.every((t) => u[t])) return mostrar("");
        mostrar(caixa(Q[cod].caminhos[0], { "[prioridade]": Mo.ordenarPorUrgencia(prios, u, ordemLista())[0] }));
      };
      prios.forEach((t) => {
        ent.appendChild(el(`<p class="rot-campo">${esc(t)}</p>`));
        /* "Não sei" numa linha: abre a ajuda e a linha fica sem resposta */
        ent.appendChild(unica(ops, u[t] ? cap1(u[t]) : null, (o) => { if (o === NS) { delete u[t]; return ajudaNS("", `Use a ajuda acima e escolha o que pode acontecer com “${t}” para continuar.`); } u[t] = o.toLowerCase(); ret(); }));
      });
      ret();
      coletar = () => {
        if (!prios.every((t) => u[t])) { erro("Responda para cada prioridade. Em dúvida, toque em “Não sei” na linha para ver como pensar."); return null; }
        return { estado: "escala", u };
      };
    } else if (cod === "M10-11") {
      const v = resp && resp.estado === "plano" ? resp : {};
      const prin = priosOrdenadas()[0];
      const hoje = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
      const uni = (u) => `<option value="${esc(u)}" ${v.unidade === u ? "selected" : ""}>${esc(u)}</option>`;
      ent.appendChild(el(`<div>
        ${prin ? `<div class="bloco b-ok"><b>Prioridade mais urgente</b><p>${esc(prin)}</p></div>` : ""}
        <label class="rot-campo" for="acao">O que vai fazer</label><input class="campo" id="acao" data-falar autocomplete="off" placeholder="Ex.: divulgar no grupo do bairro" value="${esc(v.acao || "")}">
        <label class="rot-campo" for="data">Até quando</label><input class="campo" id="data" type="date" min="${hoje}" value="${esc(v.data || "")}">
        <label class="rot-campo" for="sinal">Como saber se funcionou</label><input class="campo" id="sinal" data-falar autocomplete="off" placeholder="Ex.: pedidos pelo WhatsApp" value="${esc(v.sinal || "")}">
        <label class="rot-campo" for="numero">Meta em número</label><input class="campo" id="numero" inputmode="decimal" autocomplete="off" placeholder="Ex.: 5 (pedidos, vendas ou clientes)" value="${esc(v.numero || "")}">
        <label class="rot-campo" for="unidade">O que vai contar</label><select class="campo" id="unidade"><option value="">Escolha</option>${Mo.UNIDADES_PLANO.map(uni).join("")}</select>
      </div>`));
      /* "Não sei": ajuda + exemplo ligado à prioridade; nada é gravado e o Continuar pede o plano */
      ent.appendChild(btnNaoSei(() => {
        ajudaNS([dicaNS(), prin ? exemploPara(prin) : ""].filter(Boolean).join(" "), "Use a ajuda acima e escreva o que vai fazer e até quando para continuar.");
      }));
      let avisouAlto = null;
      const C = ctx();
      const g = (id) => p.querySelector("#" + id).value.trim();
      /* só o que impede de gravar: ação e data vazias, número que não é número */
      const bloqueio = () => {
        if (!g("acao") || !g("data")) return "Escreva o que você vai fazer e até quando. Em dúvida, toque em “Não sei” para ver como começar.";
        const nn = Mo.num(g("numero"));
        if (g("numero") && (isNaN(nn) || nn <= 0)) return "Quanto basta: digite só números maiores que zero. Ex.: 5";
        return null;
      };
      aindaErrado = () => !!bloqueio();
      const dados = () => ({ estado: "plano", acao: g("acao"), data: g("data"), sinal: g("sinal"), numero: g("numero"), unidade: g("unidade") });
      const sugNum = () => [C.testeN && C.testeN !== NS ? `No teste da ideia (Etapa 4), você combinou: ${C.testeN}.` : "", C.numeros7.length ? `Números que você quer acompanhar (Etapa 7): ${lc(C.numeros7.join(", "))}.` : ""].filter(Boolean).map((x) => `<p class="diag-r">${esc(x)}</p>`).join("");
      /* retorno ao vivo, enquanto a pessoa escreve: a frase do plano e os lembretes (sem número, data longe);
         data passada também aparece aqui, e o Continuar não grava com ela */
      const vivo = () => {
        if (!g("acao") || !g("data")) return mostrar("");
        const d = Mo.avaliarData(g("data"), hoje);
        if (d === "invalida" || d === "passada") return mostrar(caixa(caminho(cod, "Data inválida (passada)")));
        const nn = Mo.num(g("numero"));
        if (g("numero") && (isNaN(nn) || nn <= 0)) return mostrar("");
        const r0 = dados(); r0.frase = Mo.frasePlano(r0);
        mostrar(caixa(caminho(cod, "Ação, data, sinal e número preenchidos"), { "[frase]": r0.frase.replace(/\.$/, "") })
          + (!(nn > 0) ? caixa(caminho(cod, "Sem número")) + sugNum() : "")
          + (d === "longe" ? caixa(caminho(cod, "Data acima de 90 dias")) : ""));
      };
      aoVivo(vivo);
      if (v.acao && v.data) vivo();
      coletar = () => {
        const r0 = dados();
        const b = bloqueio();
        if (b) { erro(b); return null; }
        const d = Mo.avaliarData(r0.data, hoje);
        if (d === "invalida" || d === "passada") { mostrar(caixa(caminho(cod, "Data inválida (passada)"))); erro("Escolha uma data de hoje em diante para continuar."); return null; }
        const nn = Mo.num(r0.numero);
        /* número alto: aviso de risco, avisa uma vez e deixa seguir com o mesmo valor (único passo extra) */
        if (nn > Mo.META_ALTA && avisouAlto !== r0.numero) {
          avisouAlto = r0.numero;
          mostrar(`<div class="bloco b-alerta"><b>Confira</b><p>${esc(Mo.fmt(nn))} parece muito para um primeiro passo de um pequeno negócio. Se estiver certo, toque em Continuar de novo.</p></div>`);
          return null;
        }
        r0.frase = Mo.frasePlano(r0);
        return r0;
      };
    } else if (cod === SOCIO) {
      let op = resp && resp.estado === "opcao" ? resp.opcao : null;
      /* Etapa 7 (M7-04): quem ajuda já se sabe; a pergunta de sócio parte disso (ajudar não é ser sócio) */
      const a7 = ajuda7();
      if (a7 && a7.tipo !== "sozinho") ent.appendChild(el(`<p class="herdado" id="ajuda7"><span class="veio">Veio da Etapa 7</span> ${a7.tipo === "pago" ? "Você paga uma pessoa para ajudar: ela trabalha para você." : "Você tem ajuda de família, amigo ou parceiro. Quem só ajuda não é sócio."} Sócio divide com você o dinheiro, o resultado e as responsabilidades.</p>`));
      ent.appendChild(unica(D.socio.opcoes.filter((o) => o !== NS), op, (o) => { op = o; mostrar(""); }));
      coletar = () => {
        if (!op) { erro("Escolha uma opção para continuar."); return null; }
        return { estado: "opcao", opcao: op };
      };
    } else {
      /* escolha única com retorno ao tocar: M10-02, 04, 05, 06, 08 */
      let op = resp && resp.estado === "opcao" ? rotuloAtual(cod, resp.opcao) : null;
      const C = ctx();
      /* M10-08 com ajuda paga na Etapa 7: isso já se sabe e aparece antes das opções */
      { const a7 = cod === "M10-08" ? ajuda7() : null;
        if (a7 && a7.tipo === "pago") ent.appendChild(el(`<p class="herdado" id="ajuda7"><span class="veio">Veio da Etapa 7</span> Você já paga uma pessoa para ajudar${a7.horas ? ` (${esc(nBR(a7.horas))} h por semana)` : ""}. Pense se vai precisar de mais alguém.</p>`)); }
      /* M10-05 com a Etapa 3 (M3.P13A): cartão "Veio da Etapa 3 · Trocar" com como as pessoas ficam sabendo hoje;
         sem resposta, vem marcado o caminho equivalente (quando a equivalência é clara) */
      const h05 = cod === "M10-05" ? hoje05() : null;
      const hoje = h05 ? { opcoes: h05.opcoes.slice(), detalhe: h05.detalhe || "", trocado: !!h05.trocado } : null;
      let tocou = !!resp;
      const sug05 = () => { const x = hoje.opcoes.map((o) => P13A_PARA_05[o]).find(Boolean); return x || null; };
      if (hoje) {
        const ideia = estagioM1() === "comeca";
        const card = el(`<div class="veio-card" id="veio05">
          <div class="veio-linha"><span class="veio">Veio da Etapa 3</span><button type="button" class="btn-alt trocar05" id="trocar05" aria-expanded="false" aria-controls="troca05">Trocar</button></div>
          <p class="veio-txt" id="veio05-txt"></p>
          <div id="troca05" class="troca05" hidden><p class="rot-campo">${ideia ? "Como as pessoas vão ficar sabendo de você?" : "Como as pessoas ficam sabendo de você hoje?"}</p></div>
        </div>`);
        const txt = card.querySelector("#veio05-txt");
        const pintarTxt = () => { txt.textContent = `${ideia ? "Na Etapa 3, você disse que as pessoas vão ficar sabendo de você por" : "Hoje as pessoas ficam sabendo de você por"}: ${sabeTxt(hoje) || "nenhum caminho marcado"}.`; };
        const troca = card.querySelector("#troca05");
        const outro = el(`<div ${hoje.opcoes.includes("Outro") ? "" : "hidden"}><label class="rot-campo" for="outro05">Qual?</label><input class="campo" id="outro05" data-falar placeholder="Ex.: carro de som" value="${esc(hoje.detalhe)}"></div>`);
        const lista = multipla(P13A_OPS, hoje.opcoes, [], () => {
          hoje.trocado = true; outro.hidden = !hoje.opcoes.includes("Outro");
          /* sem resposta tocada: a marcação sugerida acompanha a troca */
          if (!tocou) { const s = sug05(); op = s; ent.querySelectorAll(":scope > .opcoes .opcao").forEach((x) => { const m = !!s && x.querySelector(".op-txt b").textContent === s; x.classList.toggle("sel", m); x.setAttribute("aria-pressed", String(m)); }); }
          pintarTxt();
        });
        outro.querySelector("input").addEventListener("input", (e) => { hoje.detalhe = e.target.value.trim(); hoje.trocado = true; pintarTxt(); });
        troca.appendChild(lista); troca.appendChild(outro);
        card.querySelector("#trocar05").onclick = (e) => { troca.hidden = !troca.hidden; e.currentTarget.setAttribute("aria-expanded", String(!troca.hidden)); };
        if (!resp) { const s = sug05(); if (s) op = s; }
        pintarTxt();
        ent.appendChild(card);
      } else if (cod === "M10-05" && !resp) {
        /* M10-05 sem resposta: parte do que já foi dito (anúncio nos gastos do Módulo 5; redes sociais no Módulo 3) */
        const sug = C.divulgacaoM5 ? ["Anúncio pago", 5] : canaisM3().some((x) => /redes sociais|instagram|facebook/i.test(x)) ? ["Catálogo no Instagram ou outra rede social", 3] : null;
        if (sug) { op = rotuloAtual(cod, sug[0]); ent.appendChild(el(`<p class="herdado"><span class="veio">Veio da Etapa ${sug[1]}</span> Confira ou ajuste.</p>`)); }
      }
      const cruz = (o) => (cod === "M10-08" && o && o.startsWith("Sim") && C.cap7.cmp && C.cap7.cmp.tipo === "folga" ? cruzamento("Contratar e capacidade com folga (M7)", { "[folga]": Mo.fmt(C.cap7.cmp.n) }, comoLinha(comoFolga(C.cap7))) : "");
      /* M10-05: retorno próprio de cada opção (a frase única da planilha não servia para todas) */
      const ret1 = (o) => (cod === "M10-05" && caixa05(o)) || caixa(caminho(cod, o));
      let pediuNS = false;
      ent.appendChild(unica(opcoesDe(cod), op, (o) => { tocou = true; if (o === NS) { op = null; pediuNS = true; return ajudaNS(); } op = o; mostrar(ret1(o) + cruz(o)); }));
      if (op && !(cod === "M10-05" && !resp)) mostrar(ret1(op) + cruz(op));
      coletar = () => {
        if (!op) { erro(pediuNS ? "Escolha uma opção para continuar. A ajuda “Como descobrir” mostra como achar a resposta." : "Escolha uma opção para continuar."); return null; }
        if (hoje && hoje.opcoes.includes("Outro") && !hoje.detalhe) { erro("Em “Trocar”, escreva qual é o outro jeito de as pessoas ficarem sabendo de você."); return null; }
        const r0 = { estado: "opcao", opcao: valorSalvo(cod, op) };
        /* o que veio da Etapa 3 fica junto da resposta (de: 3); trocado = a pessoa mudou aqui */
        if (hoje && hoje.opcoes.length) r0.hoje = { opcoes: hoje.opcoes.slice(), detalhe: hoje.detalhe, de: 3, trocado: !!hoje.trocado };
        return r0;
      };
    }
    p.querySelector("#ok").onclick = () => { const r0 = coletar(); if (r0) avancar(r0); };
    return p;
  }
  /* exemplo ligado à prioridade (M10-11 "Não sei"): os exemplos são os da própria pergunta */
  function exemploPara(t) {
    const ex = Q["M10-11"].apoio.match(/'[^']+'/g) || [];
    return `Exemplo: ${/viabilidade|prefeitura|endereço/i.test(t) ? ex[0] || "" : ex[1] || ex[0] || ""}`;
  }
  function cruzamento(quando, extra, html) {
    const x = D.resumo.cruzamentos.find((c) => c.quando === quando);
    return x ? `<div class="bloco ${x.forma === "Pergunta gentil" ? "b-alerta" : "b-proximo"}"><b>${esc(x.forma)}</b><p>${esc(preencher(x.mensagem, extra))}</p>${html || ""}</div>` : "";
  }

  /* ================= resumo final: cruzamentos, próximos passos, retrato ================= */
  function cruzamentos() {
    const C = ctx();
    const out = [];
    const add = (k, extra, como) => { const x = D.resumo.cruzamentos.find((c) => c.quando === k); out.push({ x, texto: preencher(x.mensagem, extra), como }); };
    if (vende() && opR("M10-01") === "Ainda não falo com clientes") add("Estágio = vendas e nenhum canal de conversa");
    if (opR("M10-05") === "Anúncio pago" && !C.divulgacaoM5) add("Anúncio pago sem gasto no Módulo 5");
    if (C.recorrente && opR("M10-04") === "Não, só se o cliente me procura") add("Compra recorrente (M2-05) e sem pós-venda");
    if (opR("M10-02") === "Mais de 2 dias" && C.concorrente) add("Resposta em mais de 2 dias e concorrentes no Módulo 3");
    if (contrata() && C.cap7.cmp && C.cap7.cmp.tipo === "folga") add("Contratar e capacidade com folga (M7)", { "[folga]": Mo.fmt(C.cap7.cmp.n) }, comoFolga(C.cap7));
    if (temSocio() && SEM_ACORDO.includes(opR("M10-06"))) add("Sócio sem acordo escrito");
    /* no máximo 3 alertas: perguntas gentis primeiro */
    return out.sort((a, b) => (a.x.forma === "Pergunta gentil" ? 0 : 1) - (b.x.forma === "Pergunta gentil" ? 0 : 1)).slice(0, 3);
  }
  /* um encaminhamento só, o mais importante */
  function encaminhamento() {
    if (temSocio() && SEM_ACORDO.includes(opR("M10-06"))) return D.instrumentos.find((x) => x.nome === "Checklist de acordo entre sócios").aviso;
    if (contrata()) return "Contratar tem custo todo mês e regras próprias. Converse com um contador sobre a forma de contratar.";
    const p10 = textoDe(lerR(9)["M9-04"]);
    if (p10 === "Ainda não fiz" || ehNS(lerR(9)["M9-04"])) return "Antes de alugar ou reformar, consulte a prefeitura sobre a atividade no endereço.";
    return "";
  }
  function proximosPassos() {
    const B = Object.fromEntries(D.resumo.proximos.map((x) => [x.situacao, x.mensagem]));
    const r = S.R["M10-11"];
    if (r && r.estado === "plano" && Mo.num(r.numero) > 0 && (r.sinal || r.unidade)) return [B["Plano completo"]];
    if (r) return [B["Plano sem sinal ou número"]];
    return [];
  }
  function lacunas() {
    const out = [];
    sequencia().forEach((c) => {
      const r = S.R[c];
      if (!r) return;
      if (r.estado === "naosei") out.push(c === SOCIO ? "Sócios" : Q[c].descobre);
    });
    return out;
  }
  /* ---------- pontos para conferir entre módulos (avisam, não travam) ---------- */
  const SO_ELOGIOS = ["Só elogios", "Só elogiaram a ideia"];
  const TETO_M1 = { "Nada por enquanto": 0, "Até R$ 100": 100, "Entre R$ 100 e R$ 500": 500, "Entre R$ 500 e R$ 1.000": 1000 };
  const ALIMENTO = /\b(bolos?|doces?|docinhos?|brigadeiros?|salgad|comida|marmit|quentinh|lanches?|p[ãa]o|p[ãa]es|tortas?|pizzas?|sorvetes?|geladinh|gel[ée]ias?|chocolates?|trufas?|biscoitos?|cookies?|bebidas?|sucos?|caf[ée]|cervejas?|aliment|confeit|empad|coxinhas?|past[ée]is|pastel|hamb[úu]rguer|a[çc]a[íi]|temperos?|conservas?|queijos?|refei[çc]|cupcakes?|pudi[mn]|bombons?|panetones?|ovos de p[áa]scoa|sobremesas?|feijoada|churrasco)/i;
  const brl = (n) => RN.brl(n);
  const modsTxt = (ms) => { const u = [...new Set(ms)].sort((a, b) => a - b); return u.length === 1 ? `Veio da Etapa ${u[0]}` : `Veio das Etapas ${juntarE(u.map(String))}`; };
  const tiposDe = (t) => {
    const s0 = String(t || "");
    if (!s0 || /^n[ãa]o sei/i.test(s0)) return null;
    const xs = [];
    if (/produto/i.test(s0)) xs.push("produto");
    if (/mercadoria/i.test(s0)) xs.push("mercadoria");
    if (/servi[çc]o/i.test(s0)) xs.push("serviço");
    return xs.length ? xs : null;
  };
  function pontosConferir() {
    const out = [];
    const m1 = lerR(1), m4 = lerR(4), m5 = lerR(5), m6 = lerR(6), m8 = lerR(8), m9 = lerR(9);
    /* 0. preço abaixo do custo de uma unidade (custo do Módulo 5; preço do ponto de partida ou do Módulo 5) */
    { const c5 = RN.contaM5(lerEstado(5));
      const pI = Mo.num(I().preco);
      const preco = pI > 0 ? pI : c5.preco;
      /* a taxa do Módulo 5 é um percentual do preço: refeita com o preço usado aqui */
      const taxa = c5.preco > 0 && c5.taxa > 0 && preco > 0 ? (preco * c5.taxa) / c5.preco : 0;
      const gasto = c5.custo > 0 ? c5.custo + taxa : null;
      if (preco > 0 && gasto && preco < gasto - 0.004) {
        const custoTxt = `${brl(gasto)}${c5.taxa > 0 ? " com as taxas" : ""}`;
        const como = taxa > 0 ? `${brl(c5.custo)} (custo de uma unidade) + ${brl(taxa)} (taxas, ${nBR(c5.taxa / c5.preco * 100)}% do preço) = ${brl(gasto)}.` : "";
        out.push({ tipo: "preco", como, detalhe: `Seu preço (${brl(preco)}) está abaixo do custo de uma unidade (${custoTxt}).`, mods: [5], texto: `Seu preço de venda é ${brl(preco)}, mas fazer uma unidade custa ${custoTxt}. Assim, cada venda tira dinheiro do seu bolso. Confira a conta do preço na Etapa 5.` });
      }
    }
    /* 1. quanto pode investir (Módulo 1) x gastos dos Módulos 4, 5 e 6 */
    const p07 = textoDe(m1["M1.P07"]);
    if (p07 && TETO_M1[p07] != null) {
      const teto = TETO_M1[p07], acima = [], ms = [1];
      const n6 = ["M6.P02", "M6.P11", "M6.P14", "M6.P17"].reduce((a, k) => { const n = Mo.num(textoDe(m6[k])); return n > 0 ? a + n : a; }, 0);
      if (n6 > teto) { acima.push(`na Etapa 6, a estimativa para começar é de ${brl(n6)}`); ms.push(6); }
      const n4 = Mo.num(textoDe(m4["M4.P21"]));
      if (n4 > teto) { acima.push(`na Etapa 4, o primeiro teste pode custar até ${brl(n4)}`); ms.push(4); }
      const c5 = RN.contaM5(lerEstado(5));
      if (c5.mensal > teto) { acima.push(`na Etapa 5, os gastos do mês somam ${brl(c5.mensal)}`); ms.push(5); }
      const comoL = [n6 > teto ? somaTxt(parcelasM6(), n6, "gastos para começar da Etapa 6") : "", c5.mensal > teto ? somaTxt(parcelasM5(), c5.mensal, "gastos do mês da Etapa 5") : ""].filter(Boolean).join(" ");
      if (acima.length) out.push({ tipo: "limite", como: comoL, detalhe: `Os gastos previstos passam do que você disse na Etapa 1 que pode usar (${teto === 0 ? "nada, por enquanto" : p07.charAt(0).toLowerCase() + p07.slice(1)}).`, mods: ms, texto: `Na Etapa 1 você disse que pode usar ${teto === 0 ? "nada, por enquanto," : p07.charAt(0).toLowerCase() + p07.slice(1)} no negócio sem faltar para as contas da casa. Mas ${acima.join("; ")}. Confira se dá para começar menor ou se algum desses valores mudou.` });
    }
    /* 2. tipo de oferta diferente entre os módulos */
    const tipos = [[1, textoDe(m1["M1.P03A"])], [4, textoDe(m4["M4.P02"])], [5, textoDe(m5["M5.P01"])], [8, textoDe(m8["M8.P02"])]].map(([n, t]) => [n, tiposDe(t)]).filter(([, t]) => t);
    const briga = tipos.some(([, a], i) => tipos.some(([, b], j) => j > i && !a.some((x) => b.includes(x))));
    if (briga) out.push({ tipo: "tipo", mods: tipos.map(([n]) => n), texto: `O tipo do seu negócio aparece diferente entre as etapas: ${tipos.map(([n, t]) => `${juntarE(t)} (Etapa ${n})`).join("; ")}. Confira qual é o certo: as contas de custo e as licenças mudam conforme o tipo.` });
    /* 3. sem sócio, mas etapas com o sócio */
    const r7 = S.R["M10-07"];
    const comSocio = r7 && r7.quem ? Object.entries(r7.quem).filter(([, q]) => q === "Sócio").map(([e]) => minusc(e)) : [];
    if (opR(SOCIO) === "Não" && comSocio.length) out.push({ tipo: "socio", mods: [10, 7], texto: `Você respondeu que não tem sócio, mas marcou o sócio como responsável por: ${juntarE(comSocio)}. Confira quem vai cuidar ${comSocio.length > 1 ? "dessas etapas" : "dessa etapa"}.` });
    /* 4. alimento x \"Não\" para a Vigilância Sanitária no Módulo 9 */
    if (textoDe(m9["M9-02"]) === "Não") {
      const ideia = [oferta(), textoDe(m1["M1.P03"]), textoDe(m4["M4.P01"]), textoDe(m8["M8.P01"])].find((x) => x && ALIMENTO.test(x));
      if (ideia) out.push({ tipo: "vigilancia", detalhe: "Você vende alimento, mas na Etapa 9 respondeu que o que vende não afeta a saúde de quem compra.", mods: [9, 1], texto: `Você vende ${minusc(curto(ideia, 60))}, que parece envolver alimento, mas na Etapa 9 respondeu que o que vende não afeta a saúde de quem compra. Quem vende alimento costuma precisar da Vigilância Sanitária, mesmo como MEI. Confira essa resposta na Etapa 9.` });
    }
    return out;
  }

  /* ---------- "Por onde começar": 3 ações na ordem (regras em motor.js) ---------- */
  function estagioM1() {
    const e = Mo.estagioDe(textoDe(lerR(1)["M1.P01"]));
    if (e) return e;
    return I().estagio ? (I().estagio === ESTAGIOS[2] ? "vende" : "comeca") : null;
  }
  const CONF_MOTOR = { preco: "preco", vigilancia: "vigilancia", limite: "limite" };
  function porOnde(prios, pc) {
    return Mo.porOndeComecar({
      estagio: estagioM1(),
      prioridades: prios,
      conferir: pc.filter((x) => CONF_MOTOR[x.tipo]).map((x) => ({ chave: CONF_MOTOR[x.tipo], detalhe: x.detalhe })),
      lacunas: listaPrioridades(),
    });
  }
  const ORIGEM_TXT = { prioridade: "Você marcou como prioridade", conferir: "Ponto para conferir", lacuna: "Ficou em aberto no seu percurso" };
  let pcAtual = [];
  function blocoComecar(acoes, est) {
    if (!acoes.length) return "";
    const intro = est === "vende" ? "Você já vende: estas ações ajudam a organizar e melhorar o que já funciona. Faça nesta ordem." : est === "comeca" ? "Você ainda está começando: estas ações ajudam a testar antes de gastar mais. Faça nesta ordem." : "Faça nesta ordem.";
    return `<section class="cartao comecar" id="comecar"><h3>Por onde começar</h3><p class="comecar-intro">${esc(intro)}</p><div id="comecar-diagrama" data-count="${acoes.length}"></div></section>`;
  }

  /* retrato: uma linha por módulo (o que já se sabe, o que é hipótese, o que está em aberto de fato) */
  function retrato() {
    const C = ctx();
    const t = (n, cod) => { const x = textoDe(lerR(n)[cod]); return x && !NS_RE.test(x) ? x : null; };
    const m2p02 = t(2, "M2.P02");
    const pv4 = RN.proposta(lerR(4));
    const n6 = ["M6.P02", "M6.P11", "M6.P14", "M6.P17"].reduce((a, k) => { const n = Mo.num(t(6, k)); return n > 0 ? a + n : a; }, 0);
    const sabe = {
      1: [oferta() ? `Você vende: ${curto(oferta(), 70)}` : null, t(1, "M1.P03A") ? `Tipo: ${t(1, "M1.P03A").split(":")[0].toLowerCase()}` : null, t(1, "M1.P07") ? `Dinheiro que pode usar: ${t(1, "M1.P07").charAt(0).toLowerCase() + t(1, "M1.P07").slice(1)}` : null],
      2: [m2p02 ? `Clientes: ${curto(m2p02.replace(/\.\s*Problema que você resolve:.*$/i, ""), 80)}` : null,
        m2p02 && /Problema que você resolve:/i.test(m2p02) ? `Problema que você resolve: ${curto(m2p02.split(/Problema que você resolve:\s*/i)[1], 80)}` : null,
        t(2, "M2.P11") ? `Onde estão os clientes: ${minusc(t(2, "M2.P11"))}` : null,
        C.ouvidas != null ? `Pessoas ouvidas: ${Mo.fmt(C.ouvidas)}` : null,
        t(2, "M2.P20") && !t(3, "M3.P21") ? `Motivo para escolherem você: ${curto(t(2, "M2.P20"), 80)}` : null,
        t(2, "M2.P21") && !SO_ELOGIOS.includes(t(2, "M2.P21")) ? `O que ouviu: ${minusc(t(2, "M2.P21"))}` : null],
      3: [I().diferencial ? `Diferencial: ${curto(I().diferencial, 70)}` : null, canaisM3().length ? `Onde o cliente compra: ${curto(lc(canaisM3().join(", ")), 80)}` : null],
      4: [pv4.frase ? `Proposta de valor: ${pv4.frase.replace(/^Sua proposta de valor:\s*/, "")}` : I().proposta ? `Proposta de valor: ${curto(I().proposta, 70)}` : null,
        pv4.falta.length && pv4.falta.length < 3 ? `Falta na proposta de valor: ${juntarE(pv4.falta)}` : null],
      5: [I().preco ? `Preço: R$ ${I().preco}` : null],
      6: [I().pagamento ? `Formas de pagamento: ${curto(I().pagamento, 70)}` : null, n6 > 0 ? `Para começar: cerca de ${brl(n6)}` : null],
      7: [C.cap7.c && C.cap7.c.estado === "ok" && C.cap7.c.hi.mes === 0 ? "No tempo informado, ainda não cabe nem uma unidade por mês" : C.cap7.mes ? `Cabem ${C.cap7.mes} por mês` : C.etapas7.length ? `${C.etapas7.length} etapas no mapa do processo` : null],
      8: [t(8, "M8.P05") ? `CNPJ: ${t(8, "M8.P05")}` : null],
      9: [t(9, "M9-03") ? `Onde vai funcionar: ${minusc(t(9, "M9-03"))}` : null, t(9, "M9-04") ? `Consulta na prefeitura: ${minusc(t(9, "M9-04"))}` : null],
    };
    const hip = {
      1: I().estagio && I().estagio !== ESTAGIOS[2] ? "Ainda não vendeu: a ideia ainda precisa ser testada" : null,
      2: SO_ELOGIOS.includes(t(2, "M2.P21")) ? "O problema do cliente ainda não foi confirmado" : null,
      4: t(4, "M4.P13") ? `O que você quer testar: ${curto(t(4, "M4.P13"), 70)}` : null,
    };
    const pontos = pontosConferir();
    return D.modulos.filter((x) => x.numero < 10).map((x) => {
      const R = lerR(x.numero);
      const feito = Object.keys(R).length > 0;
      const ns = [], vz = [];
      Object.entries(R).forEach(([k, r]) => {
        if (k === "M5.P00" || (r && r.herdado)) return; /* \"Não sei\" herdado não conta */
        const nome = PERG[k] ? PERG[k].charAt(0).toLowerCase() + PERG[k].slice(1) : null;
        if (ehNS(r)) ns.push(nome); else if (ehVazio(r)) vz.push(nome);
      });
      const como = x.numero === 6 && n6 > 0 ? somaTxt(parcelasM6(), n6, "gastos para começar") : x.numero === 7 && C.cap7.mes ? comoCap() : "";
      return { n: x.numero, nome: x.nome, feito, como, sabe: (sabe[x.numero] || []).filter(Boolean), hip: hip[x.numero], ns, vz, conferir: pontos.some((p) => p.mods.includes(x.numero)) };
    });
  }
  /* \"Em aberto\" em linguagem simples: quantos e quais */
  function emAberto(x) {
    const tot = x.ns.length + x.vz.length;
    if (!tot) return "Nenhuma resposta “Não sei” ou em branco.";
    const partesQ = [x.ns.length ? `${x.ns.length} ${x.ns.length === 1 ? "resposta" : "respostas"} “Não sei”` : "", x.vz.length ? `${x.vz.length} em branco` : ""].filter(Boolean);
    const nomes = [...new Set(x.ns.concat(x.vz).filter(Boolean))];
    return `Em aberto: ${partesQ.join(" e ")}${nomes.length ? `. Falta: ${nomes.slice(0, 4).join("; ")}${nomes.length > 4 ? ` e mais ${nomes.length - 4}` : ""}` : ""}.`;
  }

  /* ---------- mensagem de apresentação montada com as respostas ---------- */
  const LOCAL_TXT = [[/^(Minha casa|Na minha casa|Em apartamento)/i, "Atendo na minha casa"], [/^(Ponto comercial|Em loja ou sala comercial)/i, "Atendo no meu ponto comercial"], [/^(Atendimento externo|Sem local fixo|Na casa do cliente)/i, "Vou até você"], [/^Online/i, "Atendo pela internet"]];
  const CANAL_TXT = { "WhatsApp Business ou WhatsApp": "pelo WhatsApp", "Catálogo no Instagram ou outra rede social": "pelo Instagram", "Pessoalmente (atendimento direto)": "pessoalmente", "Aplicativo de entrega (iFood e outros)": "pelo aplicativo de entrega", "Telefone": "por telefone", "E-mail": "por e-mail", "Site ou loja virtual próprios": "pelo meu site", "Marketplace (Mercado Livre, Shopee e outros)": "pela minha loja no marketplace" };
  function mensagemModelo() {
    const m1 = lerR(1), m2 = lerR(2), m3 = lerR(3), m4 = lerR(4), m8 = lerR(8), m9 = lerR(9);
    const semNS = (x) => (x && !NS_RE.test(String(x).trim()) ? x : null);
    const ideia = semNS(oferta()) || semNS(textoDe(m1["M1.P03"]));
    const p10 = m3["M3.P10"], p10op = p10 && p10.estado === "opcao" ? p10.opcao : null;
    const cliente = semNS(I().grupo) || semNS(textoDe(m4["M4.P08"])) || (semNS(textoDe(m2["M2.P02"])) || "").replace(/\.\s*Problema que você resolve:.*$/i, "") || (p10op === "Empresas" ? "empresas" : p10op && /^Pessoas/.test(p10op) ? "pessoas que compram para si" : null);
    /* proposta de valor do Módulo 4: o motivo da escolha (PV2) vira o diferencial e o benefício (PV3) entra depois */
    const pv = RN.proposta(m4);
    const ganho = (pv.porque && pv.porque.charAt(0).toUpperCase() + pv.porque.slice(1)) || semNS(I().diferencial) || semNS(I().proposta);
    const beneficio = pv.beneficio && pv.beneficio !== pv.porque ? pv.beneficio : null;
    const lugar = [textoDe(m8["M8.P03"]), textoDe(m9["M9-03"])].map((x) => x && (LOCAL_TXT.find(([re]) => re.test(x)) || [])[1]).find(Boolean);
    const r01 = S.R["M10-01"];
    const c01 = r01 && r01.estado === "multi" ? r01.opcoes : [];
    const vias = c01.map((x) => CANAL_TXT[x]).filter(Boolean);
    const domicilio = c01.includes("Na casa do cliente (atendimento em domicílio)");
    const falta = [];
    if (!ideia) falta.push("o que você vende (Etapa 1)");
    if (!cliente) falta.push("para quem você vende (Etapa 2 ou 3)");
    if (!lugar && !domicilio) falta.push("onde você atende (Etapa 8 ou 9)");
    if (!vias.length && !canaisVenda()) falta.push("por onde o cliente fala com você (primeira pergunta desta etapa)");
    if (!ideia) return { texto: "", falta };
    const frase = (x) => { x = String(x).trim().replace(/[.;!]+$/, ""); return x.charAt(0).toUpperCase() + x.slice(1) + "."; };
    const minus = minusc;
    const t = [`Olá! Trabalho com ${minus(curto(ideia, 80).replace(/[.;!]+$/, ""))}${cliente ? ` para ${minus(curto(cliente, 80).replace(/[.;!]+$/, ""))}` : ""}.`];
    if (ganho) t.push(frase(curto(ganho, 160)));
    if (beneficio) t.push(`O que você ganha: ${minus(curto(beneficio, 140).replace(/[.;!]+$/, ""))}.`);
    if (lugar) t.push(frase(lugar));
    if (domicilio) t.push(lugar === "Vou até você" ? "" : "Também vou até a sua casa.");
    if (vias.length) t.push(`Para pedir, fale comigo ${juntarE(vias).replace(/ e ([^,]+)$/, " ou $1")}.`);
    else if (canaisVenda()) t.push(`Você me encontra em: ${canaisTxt()}.`);
    return { texto: t.filter(Boolean).join(" "), falta };
  }

  /* ================= resumo (tela M10-12) ================= */
  const INST = Object.fromEntries(D.instrumentos.map((x) => [x.nome, x]));
  const avisoInst = (nome) => `<p class="aviso-inst">${esc(INST[nome].aviso)}</p>`;
  function telaResultado() {
    if (S.hist[S.hist.length - 1] !== "RESULTADO") { S.hist.push("RESULTADO"); salvar(); }
    const q12 = Q["M10-12"];
    const prios = priosOrdenadas();
    const r11 = S.R["M10-11"];
    const plano = r11 && r11.estado === "plano" ? r11 : null;
    const cz = cruzamentos(), enc = encaminhamento(), passos = proximosPassos(), lac = lacunas(), ret = retrato();
    const r12 = S.R["M10-12"];
    /* prioridade principal guardada para o resumo da jornada (que não refaz a ordem por urgência) */
    if ((S.prioridade || null) !== (prios[0] || null)) { S.prioridade = prios[0] || null; salvar(); }
    const entendemos = RN.paragrafos(null, { ini: I(), R: S.R, prioridade: prios[0] || null });
    const contasRes = entendemos.length ? contasResumo() : [];
    const pc = pontosConferir();
    pcAtual = pc;
    const comecar = porOnde(prios, pc);
    const msgM = mensagemModelo();
    const msgTxt = S.inst.mensagem != null ? S.inst.mensagem : msgM.texto;
    const canais = S.R["M10-01"];
    const canaisTxt01 = canais ? (canais.estado === "multi" ? canais.opcoes.join(", ") : canais.estado === "naosei" ? "Ainda não definido" : canais.opcao) : "";
    const r7 = S.R["M10-07"], r8a = S.R["M10-08a"];
    const respostas = [["Seu ponto de partida", null]].concat(sequencia().map((k) => [TXT(k), k]));
    const linha = (rot, v) => v ? `<p class="diag-q">${esc(rot)}</p><p class="diag-r">${esc(v)}</p>` : "";
    const p = el(`<div class="pag">
      ${topo("Resultado")}
      ${heroi({ kicker: "Resultado", kickerClasse: "passo", titulo: "Seu plano de ação", extra: chipOferta() })}
      <main class="corpo">
        ${botaoVoltar()}
        ${barraFases(null, true)}
        <section class="concluido">
          <div class="conc-topo"><span class="check" aria-hidden="true"></span><div><h2>Você chegou ao fim do percurso</h2>${prios[0] ? `<p class="conc-principal" id="conc-principal">Sua prioridade mais urgente: <b>${esc(prios[0])}</b>.${plano ? ` Primeiro passo: ${esc(plano.frase)}` : ""}</p>` : ""}<p>${esc(preencher(q12.apoio))}</p></div></div>
        </section>
        ${entendemos.length ? `<section class="cartao entendemos" id="entendemos"><h3>O que entendemos até aqui</h3><div class="resumo-negocio">${entendemos.map((x) => `<p>${esc(x)}</p>`).join("")}</div>${contasRes.length ? `<div class="contas" id="contas">${contasRes.map(comoLinha).join("")}</div>` : ""}<p class="aviso-inst">Este resumo junta o que você respondeu nas 10 etapas. Se algo não estiver certo, corrija a resposta e o texto muda.</p></section>` : ""}
        ${blocoComecar(comecar, estagioM1())}
        ${cz.length || pc.length ? `<section class="cartao"><h3>Pontos para conferir</h3>${pc.map((x) => `<div class="bloco b-alerta conferir"><b>Confira</b><p>${esc(x.texto)}</p>${comoLinha(x.como)}<p><span class="veio">${esc(modsTxt(x.mods))}</span></p></div>`).join("")}${cz.map((a) => `<div class="bloco ${a.x.forma === "Pergunta gentil" ? "b-alerta" : "b-proximo"}"><b>${esc(a.x.forma)}</b><p>${esc(a.texto)}</p>${comoLinha(a.como)}</div>`).join("")}</section>` : ""}
        <section class="cartao bloco-res"><h3>Seu plano</h3>
          ${prios.length ? `<ol class="lista-capa">${prios.map((t, i) => `<li>${i === 0 ? `<b>${esc(t)}</b>` : esc(t)}</li>`).join("")}</ol>` : `<p class="diag-r">Nenhuma prioridade escolhida.</p>`}
          ${(S.R["M10-10"] && S.R["M10-10"].u && prios.some((t) => S.R["M10-10"].u[t]) ? `<h4>Se esperar, o que pode acontecer</h4><ol class="lista-capa">${prios.filter((t) => S.R["M10-10"].u[t]).map((t) => `<li>${esc(t)}: ${esc(cap1(S.R["M10-10"].u[t]))}</li>`).join("")}</ol>` : "")}
          ${plano ? `<p class="diag-q">Para a prioridade mais urgente</p><p class="plano-frase">${esc(plano.frase)}</p>` : r11 ? `<p class="diag-r">Plano da prioridade principal: ainda não definido.</p>` : ""}
          ${avisoInst("Plano de ação")}
        </section>
        <details class="resultado-mais">
          <summary>Ver suas respostas e detalhes</summary>
        <section class="cartao bloco-res"><h3>Como você vende</h3>
          ${linha("Onde o cliente encontra você e compra", canaisVenda())}
          ${linha(canaisVenda() ? "Por onde mais os clientes falam com você" : "Por onde os clientes falam com você", canaisTxt01)}
          ${linha("Tempo de resposta", opR("M10-02"))}
          ${hoje05() ? linha("Como as pessoas ficam sabendo de você (Etapa 3)", cap1(sabeTxt(hoje05()))) : ""}
          ${linha("Divulgação principal", opR("M10-05"))}
          <h4>Roteiro de venda${opR("M10-03") === "Depende do cliente" ? " (base)" : opR("M10-03") === "Ainda não vendi" ? " (para testar)" : ""}</h4>
          <div id="roteiro-final-diagrama"></div>
          ${avisoInst("Roteiro de venda")}
          <h4>Mensagem de apresentação</h4>
          <textarea class="campo msg-auto" rows="3" id="msg" aria-label="Mensagem de apresentação" placeholder="Escreva aqui duas ou três frases para apresentar o que você vende.">${esc(msgTxt)}</textarea>
          ${S.inst.mensagem == null && msgM.falta.length ? `<p class="diag-r" id="msg-falta">${msgM.texto ? "Para completar a mensagem, falta" : "Para montar a mensagem, falta"}: ${esc(juntarE(msgM.falta))}.</p>` : ""}
          ${S.inst.mensagem != null && msgM.texto && S.inst.mensagem !== msgM.texto ? `<button class="btn-mais" id="msg-refazer">Usar a mensagem montada com as suas respostas</button>` : ""}
          ${avisoInst("Mensagem de apresentação")}
          ${D.pedidos_ia.map((x) => { const tt = preencher(x.texto); return `<details class="saiba"><summary><span>Pedido para ferramentas de IA (só para organizar)</span></summary><div class="caixa caixa-ia"><b>${esc(x.pedido)}</b><div class="prompt"><p>${esc(tt)}</p><button class="btn-copiar" data-t="${esc(tt)}">Copiar texto</button></div><p class="ex">${esc(x.conferir)}</p><p class="ex">${esc(x.obs)}</p></div></details>`; }).join("")}
        </section>
        <section class="cartao bloco-res"><h3>Pessoas</h3>
          ${linha("Sócio", opR(SOCIO))}
          ${temSocio() ? linha("Acordo por escrito", opR("M10-06")) + dicaSociedadeHtml() : ""}
          ${temSocio() ? `<h4>Checklist de acordo entre sócios</h4>${D.checklist_socios.map((x, i) => `<label class="chk"><input type="checkbox" data-ck="${i}" ${S.inst.checklist[i] ? "checked" : ""}><span>${esc(cap1(x))}</span></label>`).join("")}${avisoInst("Checklist de acordo entre sócios")}` : ""}
          ${r7 && r7.quem ? `<h4>Quem cuida de cada etapa</h4><div id="responsaveis-finais-diagrama"></div>` : ""}
          ${linha("Contratar nos próximos meses", opR("M10-08"))}
          ${r8a && r8a.opcoes ? linha("Alternativas que você já considerou", r8a.opcoes.join(", ")) : ""}
        </section>
        <section class="cartao bloco-res"><h3>Retrato do negócio</h3>
          ${ret.map((x) => `<div class="retrato"><p class="diag-q">Etapa ${x.n} · ${esc(x.nome)}</p>
            ${!x.feito ? `<p class="diag-r">Ainda não feito neste aparelho. <a href="${LINK(x.n)}">Abrir a Etapa ${x.n}</a></p>` : `
            ${x.sabe.length ? `<p class="diag-r">Já se sabe: ${esc(x.sabe.join(" · "))}</p>${comoLinha(x.como)}` : ""}
            ${x.hip ? `<p class="diag-r">Ainda a confirmar: ${esc(x.hip)}</p>` : ""}
            <p class="diag-r em-aberto">${esc(emAberto(x))}</p>
            ${x.conferir ? `<p class="diag-r">Há um ponto para conferir com outra etapa (veja “Pontos para conferir”).</p>` : ""}
            <p class="diag-r"><a href="${LINK(x.n)}">Abrir a Etapa ${x.n}</a></p>`}</div>`).join("")}
          ${avisoInst("Retrato final do percurso")}
        </section>
        ${enc ? `<section class="cartao"><h3>Onde buscar orientação</h3><div class="bloco b-enc"><p>${esc(enc)}</p></div></section>` : ""}
        ${lac.length ? `<section class="cartao"><h3>O que ainda falta definir</h3><ul class="lista-capa">${lac.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></section>` : ""}
        ${passos.length ? `<section class="cartao"><h3>Próximo passo</h3><ol class="lista-capa">${passos.map((x) => `<li>${esc(x)}</li>`).join("")}</ol></section>` : ""}
        </details>
        <section class="cartao-q pergunta" id="q12">
          <h2 class="q">${esc(preencher(q12.pergunta))}</h2>
          <div class="opcoes" id="op12">${opcoesDe("M10-12").map((o) => `<button type="button" class="opcao ${r12 && r12.opcao === o ? "sel" : ""}" aria-pressed="${!!(r12 && r12.opcao === o)}" data-o="${esc(o)}"><span class="radio" aria-hidden="true"></span><span class="op-txt"><b>${esc(o)}</b></span></button>`).join("")}</div>
          <div id="ret12">${r12 ? caixa(caminho("M10-12", r12.opcao)) : ""}</div>
          <div id="corr" ${r12 && r12.opcao === "Quero corrigir algo" ? "" : "hidden"}>${respostas.map(([tx, k]) => `<div class="corr-item"><span>${esc(tx)}</span><button class="btn btn-claro editar" data-c="${k || "PARTIDA"}" aria-label="Corrigir: ${esc(tx)}">Corrigir</button></div>`).join("")}
            <p class="diag-r">Para mudar uma resposta de outra etapa, use os links do retrato acima.</p></div>
        </section>
        <div class="acoes"><button class="btn btn-primario" id="imprimir">Imprimir resultado</button><button class="btn btn-linha" id="zerar2">Recomeçar do zero</button></div>
        <div class="acoes lg2-proximo"><a class="btn btn-claro" style="text-decoration:none;text-align:center;box-sizing:border-box" href="/protected/modulos/laboratorio-de-gestao?aba=b">Voltar às etapas</a></div>
        ${rodape()}
      </main>
    </div>`);
    const comecarDiagrama = p.querySelector('#comecar-diagrama');
    if (comecarDiagrama) {
      LG2Diagrama.render(comecarDiagrama, comecar.map((a) => ({ titulo: `${a.detalhe ? `${a.detalhe} ` : ""}${a.texto}`, marca: [ORIGEM_TXT[a.origem] || "", a.modulo && a.modulo < 10 ? `Abrir a Etapa ${a.modulo}` : ""].filter(Boolean).join(" · ") })));
      const lista = comecarDiagrama.querySelector('ol'); if (lista) lista.classList.add('lista-comecar');
      comecarDiagrama.querySelectorAll('.lg2-diag-passo').forEach((li, i) => { li.dataset.origem = comecar[i].origem; const t = li.querySelector('.lg2-diag-tit'); t.classList.add('acao-c'); const nn = li.querySelector('.lg2-diag-num'); if (nn) nn.classList.add('num-c'); const m = li.querySelector('.lg2-diag-marca'); if (m) m.classList.add('por-que'); });
    }
    LG2Diagrama.render(p.querySelector('#roteiro-final-diagrama'), roteiroFinal().map((titulo) => ({ titulo })));
    const respFinal = p.querySelector('#responsaveis-finais-diagrama');
    if (respFinal) LG2Diagrama.render(respFinal, Object.entries((S.R['M10-07'] || {}).quem || {}).map(([titulo, marca]) => ({ titulo, marca: `Responsável: ${marca}` })));
    /* Relatório: detalhes abertos inicialmente; a pessoa pode fechar o que quiser. */
    p.querySelectorAll('details').forEach((d) => { d.open = true; });
    const re = () => { salvar(); redesenhar(telaResultado); };
    p.querySelector("#v").onclick = () => { S.hist.pop(); const ant = S.hist.pop(); salvar(); ant && ant !== "RESULTADO" ? ir(telaPergunta, ant) : ir(telaCapa); };
    p.querySelector("#imprimir").onclick = () => window.print();
    p.querySelector("#zerar2").onclick = reiniciar;
    p.querySelectorAll("#op12 .opcao").forEach((b) => (b.onclick = () => { S.R["M10-12"] = { estado: "opcao", opcao: b.dataset.o }; re(); }));
    p.querySelectorAll("[data-c]").forEach((b) => (b.onclick = () => {
      S.voltarResumo = true; salvar();
      b.dataset.c === "PARTIDA" ? ir(telaPartida, { volta: true }) : ir(telaPergunta, b.dataset.c);
    }));
    const msgEl = p.querySelector("#msg");
    msgEl.addEventListener("input", () => alturaAuto(msgEl));
    /* a tela só entra na página depois do return: mede a altura no quadro seguinte e de novo quando a fonte carrega */
    requestAnimationFrame(() => alturaAuto(msgEl));
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => alturaAuto(msgEl));
    p.querySelector("#msg").onchange = (e) => { const v = e.target.value; S.inst.mensagem = v.trim() && v !== msgM.texto ? v : null; salvar(); };
    const refazer = p.querySelector("#msg-refazer");
    if (refazer) refazer.onclick = () => { S.inst.mensagem = null; re(); };
    p.querySelectorAll("[data-ck]").forEach((x) => (x.onchange = () => { S.inst.checklist[x.dataset.ck] = x.checked; salvar(); }));
    ligar(p);
    if (aviso) p.querySelector(".corpo").insertBefore(el(`<p class="erro">${esc(aviso)}</p>`), p.querySelector(".corpo").firstChild);
    return p;
  }

  /* caixa de texto que cresce com o texto: a mensagem inteira aparece sem rolar dentro dela */
  function alturaAuto(t) {
    if (!t || !t.isConnected) return;
    t.style.height = "auto";
    t.style.height = t.scrollHeight + (t.offsetHeight - t.clientHeight) + "px";
  }
  window.addEventListener("resize", () => alturaAuto(document.getElementById("msg")));

  /* teclado do celular: o campo em foco (e o Continuar logo abaixo, quando cabe) ficam na parte visível */
  let focado = null;
  function mostrarCampo() {
    const c = focado;
    if (!c || document.activeElement !== c) return;
    c.scrollIntoView({ block: "center" });
    const vv = window.visualViewport, alto = vv ? vv.height : window.innerHeight;
    const caixaQ = c.closest(".cartao-q");
    const ok = caixaQ && caixaQ.querySelector("#ok");
    if (!ok) return;
    const a = c.getBoundingClientRect(), b = ok.getBoundingClientRect();
    if (b.bottom > alto - 8 && b.bottom - a.top <= alto - 16) window.scrollBy(0, b.bottom - (alto - 8));
  }
  document.addEventListener("focusin", (e) => {
    if (!e.target.matches || !e.target.matches("input, textarea, select")) return;
    focado = e.target;
    setTimeout(mostrarCampo, 300);
  });
  if (window.visualViewport) window.visualViewport.addEventListener("resize", mostrarCampo);

  completarIni();
  ir(telaCapa);
})();
