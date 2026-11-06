/* Telas do Módulo 7 (Turma B). Todo texto de conteúdo vem de window.MODULO7 (planilha
   "Perguntas e Caminhos" e PDF de abertura do Grupo 7), sem edição. As contas ficam em motor.js.
   As respostas ficam só neste aparelho. */
(function () {
  "use strict";
  const D = window.MODULO7;
  const Mo = window.Motor7;
  const tela = document.getElementById("tela");
  const CHAVE = "lg2-turma-b-m07";
  const VERSAO = 1;
  const NS = "Não sei";
  const Q = Object.fromEntries(D.perguntas.map((q) => [q.codigo, q]));
  const TERMO = D.termos;

  /* ---------- estado ---------- */
  function novo() { return { v: VERSAO, ini: null, R: {}, mapa: null, hist: [], inst: { forn: [], plano: {}, padrao: [], painel: [], folga: "" }, voltarResumo: false }; }
  function carregar() { try { const s = JSON.parse(localStorage.getItem(CHAVE)); return s && s.v === VERSAO && s.R ? Object.assign(novo(), s) : novo(); } catch (e) { return novo(); } }
  let S = carregar();
  let aviso = "";
  function salvar() {
    try { localStorage.setItem(CHAVE, JSON.stringify(S)); aviso = ""; }
    catch (e) { aviso = "Não foi possível salvar neste navegador. Mantenha a página aberta e imprima o resultado para guardar suas respostas."; }
  }

  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  function el(html) { const d = document.createElement("div"); d.innerHTML = html.trim(); return d.firstElementChild; }
  function ir(f, a) { tela.innerHTML = ""; tela.appendChild(f(a)); window.scrollTo(0, 0); }
  /* redesenha sem voltar ao topo (instrumentos que mudam a cada toque) */
  function redesenhar(f, a) { const y = window.scrollY; tela.innerHTML = ""; tela.appendChild(f(a)); window.scrollTo(0, y); }

  /* teclado do celular: o campo em foco vai para o meio da parte visível da tela. Um só listener;
     roda ~300 ms depois do foco (tempo de o teclado abrir) e a cada mudança do tamanho visível
     (visualViewport) enquanto o foco estiver no campo. */
  const CAMPO = "input, textarea, select";
  const ESPERA_TECLADO = 300;
  function centralizar() {
    const a = document.activeElement;
    if (!(a && a.matches && a.matches(CAMPO))) return;
    a.scrollIntoView({ block: "center" });
    /* se o Continuar ficou abaixo da parte visível e cabe junto com o campo, sobe só o necessário */
    const ok = document.getElementById("ok");
    if (!ok) return;
    const alt = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    const rc = a.getBoundingClientRect(), ro = ok.getBoundingClientRect();
    if (ro.top > rc.top && ro.bottom > alt - 8 && ro.bottom - rc.top < alt - 16) window.scrollBy(0, Math.min(ro.bottom - alt + 8, rc.top - 8));
  }
  document.addEventListener("focusin", (e) => {
    if (e.target && e.target.matches && e.target.matches(CAMPO)) setTimeout(centralizar, ESPERA_TECLADO);
  });
  if (window.visualViewport) window.visualViewport.addEventListener("resize", centralizar);
  /* ao imprimir, abre as caixas fechadas para o conteúdo sair no papel */
  window.addEventListener("beforeprint", () => document.querySelectorAll("details").forEach((d) => { d.open = true; }));

  /* ---------- respostas dos Módulos 1 a 6 salvas neste navegador ---------- */
  function lerModulo(chave) { try { const s = JSON.parse(localStorage.getItem(chave)); return (s && s.R) || {}; } catch (e) { return {}; } }
  const M1 = () => lerModulo("lg2-turma-a-m01"), M3 = () => lerModulo("lg2-turma-a-m03"), M4 = () => lerModulo("lg2-turma-a-m04"),
    M5 = () => lerModulo("lg2-turma-a-m05"), M6 = () => lerModulo("lg2-turma-b-m06");
  /* escolha múltipla (ex.: forma de entrega do Módulo 4) vira texto "a, b" */
  const valor = (r) => !r ? null : r.estado === "opcao" ? r.opcao : r.estado === "valor" ? r.valor : r.estado === "opcoes" && Array.isArray(r.opcoes) ? r.opcoes.join(", ") : null;
  const textoDe = (r) => { const x = valor(r); return typeof x === "number" ? String(x) : typeof x === "string" && x.trim() ? x.trim() : null; };
  /* primeiro número de um texto livre ("60 pedidos" → "60"); null se não houver */
  const numDe = (t) => { if (t == null) return null; const m = /\d+(?:[.,]\d+)*/.exec(String(t)); return m ? m[0] : null; };
  /* número digitado num campo de número: aceita "5%", "12,50", "1.500"; vazio = null; negativo ou texto = NaN */
  function numCampo(t) {
    const x = String(t ?? "").trim();
    if (!x) return null;
    if (/^-/.test(x)) return NaN;
    return Mo.num(x.replace(/\s*%$/, ""));
  }
  const UNID = { kg: "kg", g: "g", L: "litros", ml: "ml" };

  /* número para encaixar em "cabem cerca de [N]" */
  const nTexto = (c, campo) => c.modo === "max" ? Mo.fmt(c.hi[campo]) : c.modo === "min" ? `${Mo.fmt(c.lo[campo])} ou mais` : c.lo[campo] === c.hi[campo] ? Mo.fmt(c.hi[campo]) : `${Mo.fmt(c.lo[campo])} a ${Mo.fmt(c.hi[campo])}`;
  const TIPOS = ["Produto: eu faço o que vendo", "Mercadoria: compro pronto para revender", "Serviço: atendo o cliente"];
  const ESTAGIOS = ["Ainda é uma ideia", "Já fiz testes ou amostras", "Já vendo"];
  const HORAS = ["Até 10 h", "De 11 a 20 h", "Mais de 20 h", NS];
  const REPOSICAO = ["Toda semana", "A cada 15 dias", "Todo mês", NS];
  const SNN = ["Sim", "Não", NS];
  /* o Módulo 1 pergunta o tempo POR DIA; a conta daqui usa horas POR SEMANA (7 dias).
     Cada resposta do Módulo 1 vai para a faixa mais próxima desta tela; a pessoa confere e ajusta. */
  const HORAS_M1 = {
    "Até 1 hora por dia": ["Até 10 h", "até cerca de 7 horas por semana"],
    "De 1 a 3 horas por dia": ["De 11 a 20 h", "cerca de 7 a 21 horas por semana"],
    "Mais de 3 horas por dia": ["Mais de 20 h", "mais de 21 horas por semana"],
    "Só nos fins de semana": ["Até 10 h", "só os dois dias do fim de semana"],
  };
  /* revenda: estoque guardado ou compra sob encomenda (o Módulo 6 pergunta isso com Sim/Não) */
  const ESTOQUE = ["Sim, mantenho mercadoria guardada", "Não, compro quando o cliente pede", NS];
  const NAO_APLICA = "Não se aplica ao meu negócio";
  /* ajuda com mais de 220 caracteres: 1ª frase à vista e o resto em "Ver mais" */
  const AJUDA_CURTA = 220;

  /* tela de partida: o que dá para trazer dos módulos anteriores */
  function herdar() {
    const m1 = M1(), m3 = M3(), m4 = M4(), m5 = M5(), m6 = M6();
    const ini = { de: {} };
    /* "Não sei" herdado não conta como resposta */
    const pega = (campo, v, mod) => { if (v != null && v !== "" && v !== NS && ini[campo] == null) { ini[campo] = v; ini.de[campo] = mod; } };
    pega("oferta", textoDe(m5["M5.P02"]) || textoDe(m5["M5.P10"]) || textoDe(m5["M5.P17"]), 5);
    pega("oferta", textoDe(m4["M4.P01"]), 4);
    pega("oferta", textoDe(m1["M1.P03"]), 1);
    const t1 = textoDe(m1["M1.P03A"]), t5 = textoDe(m5["M5.P01"]), t4 = textoDe(m4["M4.P02"]);
    const tipo = (t) => { const w = (t || "").split(/[:+]/)[0].trim(); return TIPOS.find((x) => x.startsWith(w + ":")) || null; };
    pega("tipo", tipo(t1), 1); pega("tipo", tipo(t5), 5); pega("tipo", tipo(t4), 4);
    const s18 = textoDe(m5["M5.P18"]); pega("material", SNN.includes(s18) ? s18 : null, 5);
    const s12 = textoDe(m6["M6.P12"]); pega("material", SNN.includes(s12) ? s12 : null, 6);
    /* horas: Módulo 1 (por dia) convertido para a faixa por semana mais próxima */
    const p05 = textoDe(m1["M1.P05"]), h1 = HORAS_M1[p05];
    if (h1) { pega("horas", h1[0], 1); ini.horasM1 = p05; ini.horasConv = h1[1]; }
    /* revenda: o Módulo 6 pergunta se a pessoa vai manter estoque */
    const e18 = { "Sim": ESTOQUE[0], "Não": ESTOQUE[1] }[textoDe(m6["M6.P18"])]; pega("estoque", e18, 6);
    const est = { "Ainda está só na minha cabeça": ESTAGIOS[0], "Já fiz um pouco para testar ou dar de amostra": ESTAGIOS[1], "Já vendi algumas vezes": ESTAGIOS[2], "Já vendo sempre": ESTAGIOS[2] }[textoDe(m1["M1.P01"])];
    pega("estagio", est, 1);
    const vol = Mo.num(numDe(textoDe(m5["M5.P37"]))); pega("volume", vol > 0 ? numDe(textoDe(m5["M5.P37"])) : null, 5);
    const t23 = valor(m5["M5.P23"]);
    if (t23 && typeof t23 === "object") { const m = (Mo.num(t23.h) || 0) * 60 + (Mo.num(t23.m) || 0); if (m > 0) pega("minUn", m, 5); }
    /* materiais do Módulo 5: produto = P03/P06 (receita) ÷ P07 (unidades que rende); serviço = P19/P22 (por atendimento) */
    const prod = t5 ? t5.startsWith("Produto") : Array.isArray(valor(m5["M5.P03"]));
    /* revenda: o item principal é a própria mercadoria do Módulo 5 (não há lista de materiais) */
    const rev = (ini.tipo || "").startsWith("Mercadoria") || (!ini.tipo && (t5 || "").startsWith("Mercadoria"));
    if (rev) pega("item", textoDe(m5["M5.P10"]), 5);
    const itens = rev ? [] : (prod ? valor(m5["M5.P03"]) : valor(m5["M5.P19"])) || [];
    const usos = valor(m5[prod ? "M5.P06" : "M5.P22"]);
    const rende = prod ? Mo.num(textoDe(m5["M5.P07"])) : 1;
    ini.usoPor = {};
    if (Array.isArray(itens) && Array.isArray(usos) && rende > 0) itens.forEach((nome, i) => {
      const u = usos[i], q = u && Mo.num(u.q);
      if (nome && q > 0) ini.usoPor[String(nome).trim()] = { q: String(Math.round((q / rende) * 100) / 100).replace(".", ","), u: UNID[u.u] || "" };
    });
    pega("item", Array.isArray(itens) && itens[0] ? String(itens[0]) : null, 5);
    const u0 = ini.item && ini.usoPor[ini.item];
    if (u0) { pega("uso", u0.q, 5); ini.usoUn = u0.u; }
    /* unidades que saem de uma vez (M7-02): o que a receita do Módulo 5 rende */
    if (prod && rende > 0) { ini.unLote = String(rende); ini.de.unLote = 5; }
    const reg = textoDe(m4["M4.P15"]); pega("regulada", SNN.includes(reg) ? reg : null, 4);
    if (rev && !ini.uso) ini.uso = "1";
    /* o Módulo 4 guarda texto livre ("60 pedidos"): fica só o número */
    pega("testeN", numDe(textoDe(m4["M4.P19"])), 4);
    pega("testeDias", numDe(textoDe(m4["M4.P20"])), 4);
    /* só contexto (não aparecem como campo) */
    ini.entrega = textoDe(m4["M4.P04"]); ini.variedade = textoDe(m4["M4.P05"]); ini.etapas4 = textoDe(m4["M4.P06"]);
    ini.riscos3 = textoDe(m3["M3.P07"]); ini.experiencia = textoDe(m1["M1.P04"]); ini.preocupacao = textoDe(m1["M1.P08"]);
    ini.perdas5 = textoDe(m5["M5.P26"]);
    ini.dor = textoDe(m3["M3.P11"]);
    const g33 = valor(m5["M5.P33"]);
    ini.gastos5 = Array.isArray(g33) ? g33.map((x) => (x && x.nome) || "").join(" ") : null;
    ini.temGastos5 = m5["M5.P32"] != null;
    return ini;
  }

  /* ---------- leitura do estado ---------- */
  const I = () => S.ini || {};
  const tipoChave = () => { const t = I().tipo || ""; return t.startsWith("Produto") ? "fab" : t.startsWith("Mercadoria") ? "rev" : t.startsWith("Serviço") ? "serv" : null; };
  const verbo = () => ({ fab: "fazer", rev: "separar e entregar", serv: "atender" }[tipoChave()] || "fazer");
  const verboFut = () => ({ fab: "fizer", rev: "separar e entregar", serv: "atender" }[tipoChave()] || "fizer");
  const ideia = () => I().estagio === ESTAGIOS[0];
  const ate10 = () => I().horas === "Até 10 h";
  const temFase3 = () => tipoChave() === "fab" || tipoChave() === "rev" || (tipoChave() === "serv" && I().material === "Sim");
  const oferta = () => (I().oferta || "").trim();
  const opR = (cod) => { const r = S.R[cod]; return r && r.estado === "opcao" ? r.opcao : r && r.estado === "naosei" ? NS : null; };
  const multiR = (cod) => { const r = S.R[cod]; return r && r.estado === "multi" ? r.opcoes : []; };
  const rev = () => tipoChave() === "rev";
  /* revenda (distribuidora, loja): sem palavras de fabricação. O valor gravado continua o mesmo;
     muda só o texto mostrado. */
  const REV = {
    "M7-02": { apoio: "Conte o tempo de separar, conferir, embalar e entregar um pedido. Se você separa vários pedidos de uma vez, informe o tempo total e quantos pedidos saem." },
    "M7-03": { pergunta: "Além de separar e entregar os pedidos, quanto do seu tempo por semana vai para responder clientes, comprar mercadoria e divulgar?" },
    "M7-04": { apoio: "Família, parceiro, amigo ou alguém que você paga. Conte só a ajuda para separar, embalar e entregar os pedidos." },
    "M7-05a": { pergunta: "Quantos pedidos ou caixas cabem de uma vez nesse espaço ou veículo, e quanto tempo leva cada vez?", apoio: "Ex.: o carro leva 20 caixas por viagem, e cada viagem de entrega leva 1 h." },
    "M7-06": { pergunta: "Para a mercadoria principal: de quantos fornecedores você poderia comprar, e em quantos dias ela chega depois do pedido?", apoio: "Pense em [item principal do Módulo 4], a mercadoria que mais vende ou que, se faltar, para as vendas. Quando pagar já foi visto no Módulo 6; aqui é o tempo até a mercadoria chegar." },
    "M7-08": { pergunta: "As mercadorias que você vende estragam, vencem ou perdem valor com o tempo?", apoio: "Pense na data de validade, em produtos que precisam de geladeira ou de lugar seco e em itens que saem de moda." },
    "M7-09": { apoio: "Pense no que faz o cliente voltar: pedido certo, validade em dia, embalagem inteira, prazo combinado." },
  };
  const ROT_REV = {
    "Um equipamento ou o espaço": "O espaço para guardar ou o veículo de entrega",
    "Falta ou atraso de material": "Falta ou atraso de mercadoria",
    "Sigo um padrão ou receita anotada": "Sigo uma lista de conferência anotada",
    "Confiro no olho ou provando, sem nada anotado": "Confiro no olho, sem nada anotado",
    "Faltar material": "Faltar mercadoria",
    "Equipamento quebrar": "Veículo ou equipamento quebrar",
    "Quantidade feita ou atendida na semana": "Pedidos separados na semana",
    "Vezes que faltou material": "Vezes que faltou mercadoria",
  };
  const rot = (op) => (rev() && ROT_REV[op]) || op;
  const perg = (cod) => preencher((rev() && REV[cod] && REV[cod].pergunta) || Q[cod].pergunta);
  const apoioDe = (cod) => preencher((rev() && REV[cod] && REV[cod].apoio) || Q[cod].apoio);
  /* 1ª frase à vista; o resto em "Ver mais" (não corta em "Ex.:") */
  function ajudaHtml(t) {
    t = String(t || "").trim();
    if (!t) return "";
    if (t.length > AJUDA_CURTA) {
      const re = /[.!?](?=\s)/g; let m;
      while ((m = re.exec(t))) {
        if (/\bEx$/i.test(t.slice(0, m.index))) continue;
        const a = t.slice(0, m.index + 1), b = t.slice(m.index + 1).trim();
        if (b) return `<p class="ajuda">${esc(a)}</p><details class="ver-mais"><summary>Ver mais</summary><p class="ajuda">${esc(b)}</p></details>`;
      }
    }
    return `<p class="ajuda">${esc(t)}</p>`;
  }

  /* modelo do mapa por tipo (aba Instrumentos) */
  function modelo() {
    const nome = { fab: "Fabricação", rev: "Revenda", serv: "Serviço" }[tipoChave()] || "Fabricação";
    const m = new RegExp(nome + ":\\s*([^.]+)\\.").exec(D.modelos_mapa);
    return m ? m[1].split("·").map((s) => s.trim()).filter(Boolean).map((s) => s.charAt(0).toUpperCase() + s.slice(1)) : [];
  }
  const etapas = () => (S.mapa && S.mapa.length ? S.mapa : modelo());

  /* ---------- colchetes preenchidos pelo sistema ---------- */
  function preencher(t, extra) {
    const o = oferta();
    let s = String(t || "");
    s = s.replace(/\[Se ideia\]:\s*([^[]*)/g, (_, x) => (ideia() ? x : "")).replace(/\[Se até 10h\]:\s*([^[]*)/g, (_, x) => (ate10() ? x : ""));
    if (!I().riscos3) s = s.replace(/\s*\(\[riscos do Módulo 3\]\)/g, "");
    const mapa = {
      "[Oferta em foco]": o ? o : "O que você vende",
      "[oferta em foco]": o ? o : "o que você vende",
      "[fazer/atender]": verbo(), "[fazer]": verbo(), "[fizer]": verboFut(),
      "[etapas do Módulo 4]": I().etapas4 ? I().etapas4 : "um modelo para o seu tipo de negócio",
      "[forma de entrega]": I().entrega ? I().entrega.toLowerCase() : "a forma de entrega",
      "[reposição do Módulo 6]": I().reposicao && I().reposicao !== NS ? "reposição " + I().reposicao.toLowerCase() : "a reposição",
      "[horas do Módulo 1]": I().horas && I().horas !== NS ? I().horas.toLowerCase().replace("até", "até").replace(" h", " horas") : "horas",
      "[item principal do Módulo 4]": I().item ? I().item : "o item principal",
      "[frequência do Módulo 6]": I().reposicao && I().reposicao !== NS ? I().reposicao.toLowerCase() : "não informada",
      "[riscos do Módulo 3]": I().riscos3 || "",
      "[variedade do Módulo 4]": I().variedade || "quantas opções você oferece",
    };
    Object.assign(mapa, extra || {});
    for (const k of Object.keys(mapa)) s = s.split(k).join(mapa[k]);
    return s.replace(/\s+([.,])/g, "$1").replace(/\s{2,}/g, " ").trim();
  }

  /* ---------- perguntas: quais aparecem ---------- */
  function sequencia() {
    const seq = ["M7-01"];
    if (!(I().minUn > 0)) seq.push("M7-02");
    seq.push("M7-03", "M7-04", "M7-05");
    if (opR("M7-05") === "Um equipamento ou o espaço") seq.push("M7-05a");
    if (temFase3()) seq.push("M7-06", "M7-07", "M7-08");
    seq.push("M7-09", "M7-10", "M7-11", "M7-12");
    return seq;
  }
  const FASE = (cod) => Q[cod].fase;
  const fases = () => D.fases.filter((f) => f !== "Fornecedores e estoque" || temFase3());

  /* caminho (linha da planilha) por texto da opção */
  const caminho = (cod, opcao) => Q[cod].caminhos.find((c) => c.opcao === opcao);
  const META = new Set(["Mais de 8 etapas", "Retirou todas as etapas (vazio)", "Qualquer resposta, com estágio = ideia", "Tempo por unidade", "Tempo do lote e unidades por lote",
    "Tempo zero, negativo ou texto", "Tempo muito alto (acima de 12 h por unidade; limiar a validar)", "Horas inválidas (negativo ou texto)", "Unidades por vez e tempo por vez",
    "Valor inválido (zero, negativo ou texto)", "De 1 a 3 critérios", "Mais de 3 critérios", "Qualquer resposta, com atividade regulada em M4-11", "Mais de 3 opções",
    "2 ou 3 números", "1 número", "Mais de 3 números", "Texto preenchido", "Em branco"]);
  const opcoesDe = (cod) => Q[cod].caminhos.map((c) => c.opcao).filter((o) => !META.has(o) && !o.startsWith("Parte "));

  /* M7-07: a planilha só traz "Só o preço", "Nota fiscal…" e "Não sei"; os demais critérios vêm
     do próprio módulo (sugeridos em "Não sei" e na lista de perguntas ao fornecedor) */
  const CRITERIOS = ["Qualidade que não varia", "Prazo de entrega", "Pedido mínimo", "Forma e prazo de pagamento", "Frete", "Troca ou devolução", "Nota fiscal e origem comprovada", "Só o preço", NS];
  const SUGERIDOS_FORN = ["Qualidade que não varia", "Prazo de entrega", "Pedido mínimo"];
  /* M7-11: a planilha não lista os números; estes saem dos exemplos do próprio módulo */
  const INDICADORES = ["Pedidos entregues no prazo", "Quantidade feita ou atendida na semana", "Horas trabalhadas no negócio", "Reclamações ou refações", "Vezes que faltou material", "Itens perdidos ou jogados fora"];
  function sugestoes() {
    const s = [];
    const add = (x) => { if (!s.includes(x)) s.push(x); };
    const g = opR("M7-05");
    if (g === "Meu tempo") add("Horas trabalhadas no negócio");
    if (g === "Um equipamento ou o espaço") add("Quantidade feita ou atendida na semana");
    if (g === "Uma etapa que demora ou acumula") add("Pedidos entregues no prazo");
    if (g === "Falta ou atraso de material") add("Vezes que faltou material");
    if (opR("M7-09") === "Fico sabendo pelo cliente") add("Reclamações ou refações");
    const rs = multiR("M7-10");
    if (rs.includes("Atrasar a entrega")) add("Pedidos entregues no prazo");
    if (rs.includes("Faltar material")) add("Vezes que faltou material");
    if (opR("M7-08") === "Sim, em poucos dias") add("Itens perdidos ou jogados fora");
    add("Pedidos entregues no prazo"); add("Quantidade feita ou atendida na semana");
    return s.slice(0, 3);
  }

  /* ---------- peças do layout (modelo do Módulo 6) ---------- */
  function rodape() {
    return `<footer class="rodape">
      <p class="credito">Conteúdo do ${esc(D.origem)}</p>
      <div class="logos"><img src="assets/logo_facc.png" alt="FACC"><img src="assets/logo_ufjf.svg" alt="UFJF"><img src="assets/logo_mg.svg" alt="Governo de Minas Gerais"></div>
    </footer>`;
  }
  function topo(trilha) {
    return `<div class="barra-topo">
      <img class="logo-mini" src="assets/minds.svg" alt="Minds of the Future">
      <nav class="trilha" aria-label="Você está em"><button class="trilha-link" data-inicio>Início</button><span>/</span><span>Módulo 7</span>${trilha ? `<span>/</span><span>${esc(trilha)}</span>` : ""}</nav>
    </div>`;
  }
  function heroi(o) {
    return `<section class="heroi ${o.grande ? "heroi-grande" : ""}">
      <div class="heroi-topo">
        <div class="heroi-txt">
          <div class="kicker ${o.kickerClasse || ""}">${esc(o.kicker || "Módulo 7")}</div>
          <${o.h1 ? "h1" : "h2"} class="heroi-tit">${esc(o.titulo)}</${o.h1 ? "h1" : "h2"}>
          ${o.texto ? `<p>${esc(o.texto)}</p>` : ""}
        </div>
        <img class="heroi-img" src="assets/${o.grande ? "hero-inicio.webp" : "hero-tela.webp"}" alt="">
      </div>
      ${o.extra || ""}
      ${o.reinicio ? `<button class="reinicio" id="zerar">Recomeçar do zero</button>` : ""}
    </section>`;
  }
  /* barra de fases: Seu processo · Sua capacidade · (Fornecedores e estoque) · Qualidade e riscos */
  function barraFases(atual, tudo) {
    const fs = fases(), n = fs.indexOf(atual);
    return `<ol class="etapas" aria-label="Fases do módulo">${fs.map((f, i) => {
      const st = tudo || i < n ? "feita" : i === n ? "atual" : "";
      return `<li class="${st}"${i === n && !tudo ? ' aria-current="step"' : ""}><span class="bola" aria-hidden="true"></span><span class="rot">${esc(f)}</span></li>`;
    }).join("")}</ol>`;
  }
  const chipOferta = () => `<div class="chip-oferta"><span>${esc(oferta() || "Sua oferta")}</span><button class="chip-alterar" id="alterar">Alterar</button></div>`;
  /* "‹ Voltar" no topo do cartão, à esquerda (mesmo lugar em todos os módulos) */
  const botaoVoltar = () => `<button type="button" class="voltar-topo" id="v" aria-label="Voltar"><span aria-hidden="true">‹</span> Voltar</button>`;
  function ligar(p) {
    p.querySelectorAll("[data-inicio]").forEach((b) => { b.onclick = () => ir(telaCapa); });
    const a = p.querySelector("#alterar"); if (a) a.onclick = () => ir(telaPartida, { volta: true });
    const z = p.querySelector("#zerar"); if (z) z.onclick = reiniciar;
    p.querySelectorAll(".btn-copiar").forEach((b) => (b.onclick = () => { try { navigator.clipboard.writeText(b.dataset.t); } catch (e) {} b.textContent = "Copiado"; }));
  }
  function reiniciar() {
    if (!confirm("Apagar todas as respostas deste módulo e recomeçar? Se quiser guardar, imprima o resultado antes.")) return;
    try { localStorage.removeItem(CHAVE); } catch (e) {}
    S = novo();
    ir(telaCapa);
  }
  const TITULO_RET = { "Dica": "Dica", "Atenção": "Atenção", "Observação": "Observação" };
  function caixa(c, extra) {
    if (!c || !c.texto || c.texto === "—") return "";
    const t = preencher(c.texto, extra);
    if (!t) return "";
    const tit = TITULO_RET[c.retorno];
    const cls = c.retorno === "Atenção" ? "b-alerta" : c.retorno === "Dica" ? "b-proximo" : "b-ok";
    return `<div class="bloco ${cls}">${tit ? `<b>${tit}</b>` : ""}<p>${esc(t)}</p></div>`;
  }
  function termosDe(cod) {
    const ts = TERMO.filter((t) => t.aparece === cod);
    if (!ts.length) return "";
    return `<details class="saiba"><summary><span>Entenda os termos</span></summary>${ts.map((t) => `<div class="conceito"><b>${esc(t.termo)}</b><p>${esc(t.explicacao)}</p><p class="ex">${esc(t.exemplo)}</p></div>`).join("")}</details>`;
  }

  /* ================= capa (texto do PDF de abertura) ================= */
  function telaCapa() {
    const A = D.abertura;
    const comecou = !!S.ini;
    const lista = (xs) => `<ul class="lista-capa">${xs.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>`;
    const p = el(`<div class="pag">
      ${topo("")}
      ${heroi({ grande: true, h1: true, kicker: A.kicker, titulo: A.titulo, texto: A.objetivo })}
      <main class="corpo">
        <div class="cartao"><h3>${esc(A.para_voce_titulo)}</h3>${lista(A.para_voce)}</div>
        <div class="cartao"><h3>${esc(A.no_final_titulo)}</h3>${lista(A.no_final)}</div>
        <div class="cartao"><h3>${esc(A.nao_faz_titulo)}</h3>${lista(A.nao_faz)}</div>
        <p class="aviso">Não inclua nomes, telefones, documentos ou outros dados pessoais nas respostas. Elas ficam salvas apenas neste navegador.</p>
        <div class="acoes">
          <button class="btn btn-primario seta" id="ir">${comecou ? "Continuar de onde parei" : "Começar"}</button>
          ${comecou ? `<button class="btn btn-linha" id="zerar">Recomeçar do zero</button>` : ""}
        </div>
        ${rodape()}
      </main>
    </div>`);
    p.querySelector("#ir").onclick = () => {
      S.voltarResumo = false;
      if (!S.ini) return ir(telaPartida);
      const falta = sequencia().find((c) => !S.R[c]);
      if (falta) return ir(telaPergunta, falta);
      ir(telaResultado);
    };
    ligar(p);
    return p;
  }

  /* ================= ponto de partida (dados dos Módulos 1 a 6) ================= */
  function telaPartida(o) {
    const volta = o && o.volta;
    const base = S.ini ? Object.assign({ de: {} }, S.ini) : herdar();
    /* estado salvo antes desta versão: traz as horas (Módulo 1) e o estoque (Módulo 6) se ainda faltam */
    if (S.ini) {
      const h = herdar();
      base.de = Object.assign({}, base.de);
      [["horas", ["horasM1", "horasConv"]], ["estoque", []]].forEach(([c, extra]) => {
        if (!base[c] && h[c]) { base[c] = h[c]; base.de[c] = h.de[c]; extra.forEach((k) => { base[k] = h[k]; }); }
      });
    }
    const f = Object.assign({}, base);
    const veio = (campo) => base.de && base.de[campo] ? `<span class="veio">Veio do Módulo ${base.de[campo]}</span>` : "";
    const sel = (campo, ops, rot) => `<fieldset class="grupo" data-campo="${campo}"><legend>${esc(rot)} ${veio(campo)}</legend>
      <div class="opcoes mini">${ops.map((x) => `<button type="button" class="opcao ${f[campo] === x ? "sel" : ""}" data-v="${esc(x)}"><span class="radio" aria-hidden="true"></span><span class="op-txt"><b>${esc(x)}</b></span></button>`).join("")}</div></fieldset>`;
    const txt = (campo, rot, attrs) => `<label class="rot-campo" for="f-${campo}">${esc(rot)} ${veio(campo)}</label><input class="campo" id="f-${campo}" data-campo="${campo}" value="${esc(f[campo] ?? "")}" ${attrs || ""}><p class="erro-campo" id="e-${campo}" hidden></p>`;
    const rotUso = () => `Quanto desse item vai em cada unidade ou atendimento? (em ${f.usoUn || "unidades do item"})`;
    const p = el(`<div class="pag">
      ${topo("Antes de começar")}
      ${heroi({ kicker: "Antes de começar", titulo: "Seu ponto de partida", texto: "Trouxemos o que você já respondeu nos módulos anteriores. Confira, corrija ou complete. Só o tipo é obrigatório." })}
      <main class="corpo">
        <div class="cartao-q partida">
          ${botaoVoltar()}
          <h3 class="secao-titulo">Sua oferta</h3>
          ${txt("oferta", "O que você vende (a oferta em foco)")}
          ${sel("tipo", TIPOS, "Tipo de oferta")}
          <div id="mat"></div>
          ${sel("estagio", ESTAGIOS, "Em que momento você está?")}
          <h3 class="secao-titulo">Seu tempo e suas vendas</h3>
          ${sel("horas", HORAS, "Quantas horas por semana você tem para o negócio?")}
          ${base.de && base.de.horas === 1 && base.horasM1 ? `<p class="nota-veio" id="nota-horas">No Módulo 1 você respondeu “${esc(base.horasM1)}” (${esc(base.horasConv)}). Marcamos a faixa mais próxima. Confira e ajuste.</p>` : ""}
          ${txt("volume", "Quantas unidades ou atendimentos você pretende vender por mês?", 'inputmode="decimal"')}
          ${base.minUn > 0 ? txt("minUn", "Tempo por unidade ou atendimento (minutos)", 'inputmode="decimal"') : ""}
          ${txt("testeN", "No teste da ideia: qual número mínimo de pedidos você combinou?", 'inputmode="decimal"')}
          ${txt("testeDias", "E em quantos dias?", 'inputmode="decimal"')}
          <div id="f3"></div>
          <h3 class="secao-titulo">Regras</h3>
          ${sel("regulada", SNN, "Sua oferta envolve alimentos, saúde, produtos para crianças ou outra atividade com regras próprias?")}
          <div class="erro" id="erro" hidden></div>
          <div class="acoes"><button class="btn btn-primario seta" id="ok">Continuar</button></div>
        </div>
        ${rodape()}
      </main>
    </div>`);
    let avisou = null;
    function desenharCond() {
      const serv = (f.tipo || "").startsWith("Serviço");
      p.querySelector("#mat").innerHTML = serv ? sel("material", SNN, "Você usa algum produto ou material para atender?") : "";
      const fase3 = (f.tipo || "").startsWith("Produto") || (f.tipo || "").startsWith("Mercadoria") || (serv && f.material === "Sim");
      const ehRev = (f.tipo || "").startsWith("Mercadoria");
      p.querySelector("#f3").innerHTML = !fase3 ? "" : ehRev ? `<h3 class="secao-titulo">Mercadoria principal e estoque</h3>
        ${txt("item", "Qual mercadoria mais vende ou, se faltar, para as vendas?")}
        ${txt("uso", "Quantas unidades dela saem em cada venda?", 'inputmode="decimal"')}
        <p class="ajuda nota-campo">Em geral é 1. Mude se você vende em caixa ou fardo.</p>
        ${sel("estoque", ESTOQUE, "Você vai manter mercadoria guardada para pronta entrega?")}
        ${sel("reposicao", REPOSICAO, "De quanto em quanto tempo você compra essa mercadoria?")}
        ${txt("perda", "Quanto dela você costuma perder (vencida, quebrada ou amassada), em %? (deixe em branco se não sabe)", 'inputmode="decimal"')}`
        : `<h3 class="secao-titulo">Material principal</h3>
        ${txt("item", "Qual é o item que, se faltar, para tudo?")}
        ${txt("uso", rotUso(), 'inputmode="decimal"')}
        ${sel("reposicao", REPOSICAO, "De quanto em quanto tempo você compra esse item?")}
        ${txt("perda", "Quanto você costuma perder dele, em %? (deixe em branco se não sabe)", 'inputmode="decimal"')}`;
      ligarCampos();
      /* trocou o item principal por outro material do Módulo 5: traz a quantidade dele */
      const it = p.querySelector("#f-item");
      if (it) it.onchange = () => {
        const u = (base.usoPor || {})[it.value.trim()], us = p.querySelector("#f-uso");
        if (!u || !us) return;
        const antes = Object.values(base.usoPor).some((x) => x.q === us.value.trim());
        if (us.value.trim() && !antes) return;
        us.value = u.q; f.usoUn = u.u;
        p.querySelector('label[for="f-uso"]').firstChild.textContent = rotUso() + " ";
      };
    }
    function ligarCampos() {
      p.querySelectorAll("fieldset[data-campo]").forEach((fs) => {
        fs.querySelectorAll(".opcao").forEach((b) => {
          b.onclick = () => {
            f[fs.dataset.campo] = b.dataset.v;
            fs.querySelectorAll(".opcao").forEach((x) => x.classList.toggle("sel", x === b));
            if (fs.dataset.campo === "tipo" || fs.dataset.campo === "material") { lerTextos(); desenharCond(); }
          };
        });
      });
    }
    function lerTextos() { p.querySelectorAll("input[data-campo]").forEach((i) => { f[i.dataset.campo] = i.value.trim(); }); }
    desenharCond();
    p.querySelector("#v").onclick = () => { const u = S.hist[S.hist.length - 1]; if (S.voltarResumo || u === "RESULTADO") { S.voltarResumo = false; return ir(telaResultado); } volta && S.ini && u ? ir(telaPergunta, u) : ir(telaCapa); };
    p.querySelector("#ok").onclick = () => {
      lerTextos();
      const e = p.querySelector("#erro");
      e.hidden = true;
      e.classList.remove("aviso-valor");
      p.querySelectorAll(".erro-campo").forEach((x) => { x.hidden = true; x.classList.remove("aviso-campo"); });
      p.querySelectorAll("input[aria-invalid]").forEach((x) => x.removeAttribute("aria-invalid"));
      if (!f.tipo) { e.textContent = "Escolha o tipo de oferta para continuar."; e.hidden = false; return; }
      /* campos de número são opcionais: em branco = "não sei" e fica fora das contas */
      let primeiro = null;
      for (const c of ["volume", "minUn", "testeN", "testeDias", "uso", "perda"]) {
        const inp = p.querySelector(`#f-${c}`);
        if (!inp) continue;
        const n = numCampo(f[c]);
        if (n !== null && (isNaN(n) || n < 0 || (c === "perda" && n >= 100))) {
          const ec = p.querySelector(`#e-${c}`);
          ec.textContent = c === "perda" ? "Use um número de 0 a 99, ou deixe em branco." : "Use só números iguais ou maiores que zero, ou deixe em branco.";
          ec.hidden = false; inp.setAttribute("aria-invalid", "true");
          primeiro = primeiro || inp;
        } else if (n === null) f[c] = "";
        else { const limpo = String(f[c]).replace(/%$/, "").trim(); f[c] = isNaN(Mo.num(limpo)) ? String(n).replace(".", ",") : limpo; }
      }
      if (primeiro) { e.textContent = "Confira o campo marcado acima."; e.hidden = false; primeiro.focus(); primeiro.scrollIntoView({ block: "center" }); return; }
      /* valores fora do comum: avisa uma vez; o segundo toque com os mesmos valores segue */
      const avisos = [];
      const mu = numCampo(f.minUn), vo = numCampo(f.volume);
      if (p.querySelector("#f-minUn") && mu > Mo.LIMITE.minUnAlto) avisos.push(["minUn", `${fmtMin(mu)} para cada unidade ou atendimento parece muito tempo. Com esse tempo, quase nada cabe na sua semana. Confira se não são minutos.`]);
      if (vo > Mo.LIMITE.volumeAlto) avisos.push(["volume", `${Mo.fmt(vo)} por mês é cerca de ${Mo.fmt(Mo.vendasDia(vo))} por dia. Esse número parece alto para um negócio pequeno; confira.`]);
      const chave = JSON.stringify([f.minUn, f.volume]);
      if (avisos.length && avisou !== chave) {
        avisou = chave;
        avisos.forEach(([c, t]) => { const ec = p.querySelector(`#e-${c}`); ec.textContent = t; ec.hidden = false; ec.classList.add("aviso-campo"); });
        e.textContent = "Confira o aviso acima. Se estiver certo, toque em “Continuar mesmo assim”.";
        e.hidden = false; e.classList.add("aviso-valor");
        p.querySelector("#ok").textContent = "Continuar mesmo assim";
        const alvo = p.querySelector(`#f-${avisos[0][0]}`); alvo.scrollIntoView({ block: "center" });
        return;
      }
      delete f.usoPor;
      if (f.minUn !== undefined && f.minUn !== "" && !(Mo.num(f.minUn) > 0)) f.minUn = null;
      else if (f.minUn) f.minUn = Mo.num(f.minUn);
      f.de = Object.fromEntries(Object.entries(base.de || {}).filter(([k]) => String(f[k] ?? "") === String(base[k] ?? "")));
      S.ini = f;
      /* o mapa pré-montado muda com o tipo: se ainda não foi ajustado, recomeça do modelo */
      if (S.mapa && S.tipoMapa !== tipoChave()) { S.mapa = null; delete S.R["M7-01"]; }
      limparInvisiveis();
      salvar();
      if (S.voltarResumo) { S.voltarResumo = false; return ir(telaResultado); }
      const falta = sequencia().find((c) => !S.R[c]);
      ir(falta ? telaPergunta : telaResultado, falta);
    };
    ligar(p);
    return p;
  }
  function limparInvisiveis() {
    const vis = new Set(sequencia());
    Object.keys(S.R).forEach((k) => { if (!vis.has(k)) delete S.R[k]; });
  }

  /* ================= pergunta ================= */
  function telaPergunta(cod) {
    const q = Q[cod];
    const seq = sequencia();
    const n = Math.max(1, seq.indexOf(cod) + 1);
    if (S.hist[S.hist.length - 1] !== cod) { S.hist.push(cod); salvar(); }
    const resp = S.R[cod];
    const p = el(`<div class="pag">
      ${topo(FASE(cod))}
      ${heroi({ titulo: FASE(cod), reinicio: true, kicker: `Pergunta ${n} de ${seq.length}`, kickerClasse: "passo", extra: chipOferta() })}
      <main class="corpo">
        ${barraFases(FASE(cod))}
        <div class="cartao-q pergunta">
          ${botaoVoltar()}
          <h2 class="q" id="pergunta">${esc(perg(cod))}</h2>
          ${ajudaHtml(apoioDe(cod))}
          <div class="entrada" id="ent"></div>
          <div class="erro" id="erro" hidden></div>
          <div id="retorno" aria-live="polite"></div>
          <div id="junto"></div>
          <div class="acoes" id="acoes"><button class="btn btn-primario seta" id="ok">Continuar</button></div>
          ${termosDe(cod)}
        </div>
        ${rodape()}
      </main>
    </div>`);
    const ent = p.querySelector("#ent"), box = p.querySelector("#retorno"), err = p.querySelector("#erro");
    const mostrar = (html) => { box.innerHTML = html || ""; err.hidden = true; };
    const erro = (t) => { err.classList.remove("aviso-valor"); err.textContent = t; err.hidden = false; };
    const junto = (html) => { p.querySelector("#junto").innerHTML = html || ""; };
    /* aviso que não trava: o próximo Continuar com o mesmo valor segue */
    const aviso_ = (t) => { err.textContent = t; err.hidden = false; err.classList.add("aviso-valor"); p.querySelector("#ok").textContent = "Continuar mesmo assim"; };
    p.querySelector("#v").onclick = () => {
      S.hist.pop();
      const ant = S.hist.pop();
      salvar();
      if (ant) ir(telaPergunta, ant); else ir(telaPartida, { volta: true });
    };
    ligar(p);
    let coletar = null;

    /* botões de escolha única */
    function unica(ops, atual, aoTocar) {
      const wrap = el(`<div class="opcoes"></div>`);
      ops.forEach((op) => {
        const b = el(`<button class="opcao ${atual === op ? "sel" : ""}"><span class="radio" aria-hidden="true"></span><span class="op-txt"><b>${esc(rot(op))}</b></span></button>`);
        b.onclick = () => { wrap.querySelectorAll(".opcao").forEach((x) => x.classList.toggle("sel", x === b)); aoTocar(op); };
        wrap.appendChild(b);
      });
      return wrap;
    }
    /* múltipla escolha até 3; "Não sei"/"Só o preço" são exclusivas */
    function multipla(ops, marcadas, exclusivas, avisoMais, aoMudar) {
      const wrap = el(`<div class="opcoes multi"></div>`);
      const pintar = () => wrap.querySelectorAll(".opcao").forEach((x) => x.classList.toggle("sel", marcadas.includes(x.dataset.v)));
      ops.forEach((op) => {
        const b = el(`<button class="opcao" data-v="${esc(op)}"><span class="radio" aria-hidden="true"></span><span class="op-txt"><b>${esc(rot(op))}</b></span></button>`);
        b.onclick = () => {
          let aviso3 = false;
          if (marcadas.includes(op)) marcadas.splice(marcadas.indexOf(op), 1);
          else if (exclusivas.includes(op)) marcadas.splice(0, marcadas.length, op);
          else {
            exclusivas.forEach((x) => { if (marcadas.includes(x)) marcadas.splice(marcadas.indexOf(x), 1); });
            if (marcadas.length >= 3) aviso3 = true; else marcadas.push(op);
          }
          pintar();
          aoMudar(op, aviso3);
        };
        wrap.appendChild(b);
      });
      pintar();
      return { wrap, aviso: avisoMais };
    }
    const tempoCampos = (id, v) => `<div class="linha"><input class="campo" id="${id}h" inputmode="numeric" aria-label="horas" value="${esc(v && v.h != null ? v.h : "")}"><span class="pre">h</span><input class="campo" id="${id}m" inputmode="numeric" aria-label="minutos" value="${esc(v && v.m != null ? v.m : "")}"><span class="pre">min</span></div>`;
    const lerTempo = (id) => { const h = p.querySelector(`#${id}h`).value.trim(), m = p.querySelector(`#${id}m`).value.trim(); return { h, m, vazio: !h && !m, min: (Mo.num(h || 0)) * 60 + Mo.num(m || 0) }; };
    const fmtTempo = (min) => { const h = Math.floor(min / 60), m = Math.round(min - h * 60); return h && m ? `${h} h ${m} min` : h ? `${h} h` : `${Mo.fmt(min, min % 1 ? 1 : 0)} min`; };
    const btnNaoSei = (fn) => { const b = el(`<div class="alt"><button class="btn-alt" id="ns">${NS}</button></div>`); b.querySelector("button").onclick = fn; return b; };

    function avancar(r0) {
      S.R[cod] = r0;
      limparInvisiveis();
      salvar();
      if (S.voltarResumo) { S.voltarResumo = false; return ir(telaResultado); }
      const prox = sequencia()[sequencia().indexOf(cod) + 1];
      prox ? ir(telaPergunta, prox) : ir(telaResultado);
    }

    if (cod === "M7-01") {
      const lista = (S.mapa ? S.mapa : modelo()).slice();
      const original = modelo().join("|");
      const wrap = el(`<div class="mapa-edit"></div>`);
      const nota = () => {
        const htmls = [];
        if (lista.filter((x) => x.trim()).length > 8) htmls.push(caixa(caminho(cod, "Mais de 8 etapas")));
        mostrar(htmls.join(""));
      };
      /* etapa móvel: ▲/▼ em cada linha (funcionam por toque e por teclado); a etapa recém-incluída
         ganha um lembrete de que pode subir até o lugar certo */
      let nova = -1, focoDepois = null;
      const desenhar = () => {
        wrap.innerHTML = `<p class="ajuda dica-ordem" id="dica-ordem">Você pode mudar a ordem: use as setas para subir ou descer a etapa.</p>`;
        lista.forEach((nome, i) => {
          const l = el(`<div class="etapa-ed${i === nova ? " nova" : ""}"><span class="num" aria-hidden="true">${i + 1}</span><input class="campo" id="etapa-${i}" aria-label="Etapa ${i + 1}" value="${esc(nome)}">
            <button type="button" class="mini-b mover" data-a="sobe" aria-label="Subir etapa" aria-describedby="etapa-${i}" title="Subir etapa" ${i === 0 ? "disabled" : ""}>▲</button><button type="button" class="mini-b mover" data-a="desce" aria-label="Descer etapa" aria-describedby="etapa-${i}" title="Descer etapa" ${i === lista.length - 1 ? "disabled" : ""}>▼</button><button type="button" class="mini-b x" data-a="tira" aria-label="Retirar etapa ${i + 1}">×</button></div>`);
          l.querySelector("input").oninput = (e) => { lista[i] = e.target.value; };
          l.querySelectorAll("[data-a]").forEach((b) => (b.onclick = () => {
            const a = b.dataset.a;
            let alvo = null;
            if (a === "tira") { lista.splice(i, 1); nova = -1; }
            if (a === "sobe") { [lista[i - 1], lista[i]] = [lista[i], lista[i - 1]]; alvo = i - 1; }
            if (a === "desce") { [lista[i + 1], lista[i]] = [lista[i], lista[i + 1]]; alvo = i + 1; }
            if (alvo !== null) { if (nova === i) nova = alvo; else if (nova === alvo) nova = i; focoDepois = [alvo, a]; }
            desenhar(); nota();
          }));
          wrap.appendChild(l);
          if (i === nova) wrap.appendChild(el(`<p class="dica-mover" aria-live="polite">Etapa incluída no fim. Toque em ▲ para levá-la ao lugar certo no seu caminho.</p>`));
        });
        const add = el(`<button type="button" class="btn-mais" id="mais">+ Incluir etapa</button>`);
        add.onclick = () => { lista.push(""); nova = lista.length - 1; desenhar(); nota(); const ins = wrap.querySelectorAll("input"); ins[ins.length - 1].focus(); };
        wrap.appendChild(add);
        /* depois de mover, o foco acompanha a etapa (quem usa teclado ou leitor de tela não se perde) */
        if (focoDepois) {
          const [k, a] = focoDepois; focoDepois = null;
          const linhaK = wrap.querySelectorAll(".etapa-ed")[k];
          const b = linhaK && (linhaK.querySelector(`[data-a="${a}"]:not([disabled])`) || linhaK.querySelector(".mover:not([disabled])"));
          if (b) b.focus({ preventScroll: true });
        }
      };
      desenhar();
      ent.appendChild(wrap);
      ent.appendChild(btnNaoSei(() => {
        S.mapa = modelo(); S.tipoMapa = tipoChave();
        mostrar(caixa(caminho(cod, NS)));
        p.querySelector("#acoes").innerHTML = "";
        const b = el(`<button class="btn btn-primario seta" id="ok">Continuar</button>`);
        b.onclick = () => avancar({ estado: "naosei" });
        p.querySelector("#acoes").appendChild(b);
      }));
      if (ideia()) junto(caixa(caminho(cod, "Qualquer resposta, com estágio = ideia")));
      coletar = () => {
        const limpa = lista.map((x) => x.trim()).filter(Boolean);
        if (!limpa.length) { mostrar(caixa(caminho(cod, "Retirou todas as etapas (vazio)"))); return null; }
        const op = limpa.join("|") === original ? "Sim, está parecido" : "Ajustei as etapas";
        S.mapa = limpa; S.tipoMapa = tipoChave();
        const r0 = { estado: "opcao", opcao: op };
        /* mostra o retorno da opção antes de seguir */
        mostrar(caixa(caminho(cod, op)) + (limpa.length > 8 ? caixa(caminho(cod, "Mais de 8 etapas")) : ""));
        trocarParaSeguir(r0);
        return null;
      };
    } else if (cod === "M7-02") {
      const v = resp && resp.estado === "valor" ? resp : null;
      const herdaUn = !v && I().unLote && tipoChave() === "fab";
      ent.appendChild(el(`<div><label class="rot-campo">Tempo</label>${tempoCampos("t", v)}
        <label class="rot-campo" for="un">${rev() ? "Pedidos separados de uma vez" : "Unidades que saem de uma vez"} ${herdaUn ? `<span class="veio">Veio do Módulo 5</span>` : ""}</label><input class="campo" id="un" inputmode="numeric" value="${esc(v ? v.un : herdaUn ? I().unLote : "1")}">
        ${herdaUn ? `<p class="ajuda">É quanto rende a sua receita, como você contou no Módulo 5. Confira e ajuste se quiser.</p>` : ""}</div>`));
      ent.appendChild(btnNaoSei(() => { mostrar(caixa(caminho(cod, NS))); trocarParaSeguir({ estado: "naosei" }); }));
      /* revenda em que o cliente retira e não há separação: a pergunta pode não servir */
      if (rev()) {
        const na = el(`<button class="btn-alt" id="na">${NAO_APLICA}</button>`);
        na.onclick = () => { mostrar(`<div class="bloco b-ok"><p>Tudo bem. Sem esse tempo, a conta de quanto cabe por semana fica de fora. O resto do módulo continua.</p></div>`); trocarParaSeguir({ estado: "naoaplica" }); };
        ent.querySelector(".alt").appendChild(na);
      }
      let confirmouAlto = false;
      coletar = () => {
        const t = lerTempo("t"), un = Mo.num(p.querySelector("#un").value || "1");
        if (t.vazio || isNaN(t.min) || t.min <= 0 || isNaN(un) || !(un > 0)) { mostrar(caixa(caminho(cod, "Tempo zero, negativo ou texto"))); return null; }
        const porUn = t.min / un;
        if (porUn > 12 * 60 && !confirmouAlto) { confirmouAlto = true; mostrar(caixa(caminho(cod, "Tempo muito alto (acima de 12 h por unidade; limiar a validar)"))); return null; }
        return { estado: "valor", h: t.h, m: t.m, un: String(un), min: t.min, minUn: porUn };
      };
    } else if (cod === "M7-04") {
      let avisouAjuda = null;
      let op = resp ? (resp.estado === "naosei" ? NS : resp.opcao) : null;
      const horas = el(`<div id="hw" ${op && op.startsWith("Sim") ? "" : "hidden"}><label class="rot-campo" for="hajuda">Horas de ajuda por semana</label><input class="campo" id="hajuda" inputmode="decimal" value="${esc(resp && resp.horas != null ? resp.horas : "")}"></div>`);
      ent.appendChild(unica(opcoesDe(cod), op, (o) => { op = o; horas.hidden = !o.startsWith("Sim"); mostrar(caixa(caminho(cod, o))); }));
      ent.appendChild(horas);
      if (op) mostrar(caixa(caminho(cod, op)));
      coletar = () => {
        if (!op) { erro("Escolha uma opção para continuar."); return null; }
        if (op === NS) return { estado: "naosei" };
        if (!op.startsWith("Sim")) return { estado: "opcao", opcao: op, horas: 0 };
        const h = Mo.num(p.querySelector("#hajuda").value);
        if (h === null || isNaN(h) || h < 0) { mostrar(caixa(caminho(cod, "Horas inválidas (negativo ou texto)"))); return null; }
        if (h > Mo.LIMITE.ajudaMax) { erro(`Uma semana tem ${Mo.LIMITE.ajudaMax} horas. Informe quantas horas por semana essa pessoa ajuda você.`); return null; }
        if (h > Mo.LIMITE.ajudaAviso && avisouAjuda !== h) { avisouAjuda = h; aviso_(`${Mo.fmt(h, h % 1 ? 1 : 0)} horas de ajuda por semana é mais que uma jornada inteira de trabalho. Confira; se estiver certo, toque em “Continuar mesmo assim”.`); return null; }
        return { estado: "opcao", opcao: op, horas: h };
      };
    } else if (cod === "M7-05") {
      let op = resp ? (resp.estado === "naosei" ? NS : resp.opcao) : null;
      const et = el(`<div id="et" ${op === "Uma etapa que demora ou acumula" ? "" : "hidden"}><p class="rot-campo">Qual etapa?</p></div>`);
      let etapa = resp && resp.etapa;
      et.appendChild(unica(etapas(), etapa, (x) => { etapa = x; }));
      ent.appendChild(unica(opcoesDe(cod), op, (o) => { op = o; et.hidden = o !== "Uma etapa que demora ou acumula"; mostrar(caixa(caminho(cod, o))); }));
      ent.appendChild(et);
      if (op) mostrar(caixa(caminho(cod, op)));
      coletar = () => {
        if (!op) { erro("Escolha uma opção para continuar."); return null; }
        if (op === NS) return { estado: "naosei" };
        if (op === "Uma etapa que demora ou acumula" && !etapa) { erro("Escolha a etapa que demora ou acumula."); return null; }
        return Object.assign({ estado: "opcao", opcao: op }, op === "Uma etapa que demora ou acumula" ? { etapa } : {});
      };
    } else if (cod === "M7-05a") {
      const v = resp && resp.estado === "valor" ? resp : null;
      ent.appendChild(el(`<div><label class="rot-campo" for="uv">Unidades por vez</label><input class="campo" id="uv" inputmode="numeric" value="${esc(v ? v.un : "")}">
        <label class="rot-campo">Tempo de cada vez</label>${tempoCampos("tv", v)}</div>`));
      ent.appendChild(btnNaoSei(() => { mostrar(caixa(caminho(cod, NS))); trocarParaSeguir({ estado: "naosei" }); }));
      if (v) mostrar(caixaEquip(v));
      coletar = () => {
        const un = Mo.num(p.querySelector("#uv").value), t = lerTempo("tv");
        if (un === null || isNaN(un) || un <= 0 || t.vazio || isNaN(t.min) || t.min <= 0) { mostrar(caixa(caminho(cod, "Valor inválido (zero, negativo ou texto)"))); return null; }
        return { estado: "valor", un: String(un), h: t.h, m: t.m, minVez: t.min };
      };
      /* retorno com a conta (H31) antes de seguir */
      const conta = coletar;
      let mostrou = !!v;
      coletar = () => {
        const r0 = conta();
        if (!r0) return null;
        if (!mostrou) { mostrou = true; const h = caixaEquip(r0); if (h) { mostrar(h); return null; } }
        return r0;
      };
    } else if (cod === "M7-06") {
      const v = resp || {};
      let p1 = v.p1 || null, p2 = v.p2 || null;
      const parte = (pref) => Q[cod].caminhos.filter((c) => c.opcao.startsWith(pref)).flatMap((c) => c.opcao.slice(pref.length).split(" / ").map((o) => ({ o: o.trim(), c })));
      const P1 = parte("Parte 1: "), P2 = parte("Parte 2: ");
      const dias = el(`<div id="dw" ${p2 === "Mais de 7 dias" ? "" : "hidden"}><label class="rot-campo" for="dias">Quantos dias? (opcional)</label><input class="campo" id="dias" inputmode="numeric" value="${esc(v.dias || "")}"></div>`);
      const b1 = el(`<div id="b1"></div>`), b2 = el(`<div id="b2"></div>`);
      const pinta = () => {
        b1.innerHTML = p1 ? caixa(P1.find((x) => x.o === p1).c) : "";
        b2.innerHTML = p2 ? caixa(P2.find((x) => x.o === p2).c) : "";
      };
      ent.appendChild(el(`<p class="rot-campo">De quantos fornecedores você poderia comprar?</p>`));
      ent.appendChild(unica(P1.map((x) => x.o), p1, (o) => { p1 = o; pinta(); }));
      ent.appendChild(b1);
      ent.appendChild(el(`<p class="rot-campo">Em quantos dias ele chega depois do pedido?</p>`));
      ent.appendChild(unica(P2.map((x) => x.o), p2, (o) => { p2 = o; dias.hidden = o !== "Mais de 7 dias"; pinta(); }));
      ent.appendChild(dias);
      ent.appendChild(b2);
      pinta();
      coletar = () => {
        if (!p1 || !p2) { erro("Responda as duas partes para continuar."); return null; }
        const d = p.querySelector("#dias").value.trim();
        if (p2 === "Mais de 7 dias" && d && !(Mo.num(d) > 0)) { erro("Informe os dias com um número maior que zero, ou deixe em branco."); return null; }
        return { estado: "partes", p1, p2, dias: p2 === "Mais de 7 dias" ? d : "" };
      };
    } else if (cod === "M7-07" || cod === "M7-10" || cod === "M7-11") {
      const ops = cod === "M7-07" ? CRITERIOS : cod === "M7-11" ? INDICADORES.concat([NS]) : opcoesDe(cod);
      const exclusivas = cod === "M7-07" ? [NS, "Só o preço"] : [NS];
      const marcadas = resp && resp.estado === "multi" ? resp.opcoes.slice() : resp && resp.estado === "naosei" ? [NS] : cod === "M7-11" ? sugestoes() : [];
      const mais = { "M7-07": "Mais de 3 critérios", "M7-10": "Mais de 3 opções", "M7-11": "Mais de 3 números" }[cod];
      const outro = el(`<div id="ow" ${marcadas.includes("Outro") ? "" : "hidden"}><label class="rot-campo" for="outro">O que mais poderia atrapalhar?</label><input class="campo" id="outro" value="${esc(resp && resp.outro || "")}"></div>`);
      const retornoMulti = (ultimo, aviso3) => {
        if (aviso3) return mostrar(caixa(caminho(cod, mais)));
        if (marcadas.includes(NS)) return mostrar(caixa(caminho(cod, NS)));
        if (cod === "M7-11") return mostrar(marcadas.length ? caixa(caminho(cod, marcadas.length === 1 ? "1 número" : "2 ou 3 números")) : "");
        if (cod === "M7-07") {
          if (marcadas.includes("Só o preço")) return mostrar(caixa(caminho(cod, "Só o preço")));
          if (ultimo === "Nota fiscal e origem comprovada" && marcadas.includes(ultimo)) return mostrar(caixa(caminho(cod, ultimo)));
          return mostrar(marcadas.length ? caixa(caminho(cod, "De 1 a 3 critérios")) : "");
        }
        const alvo = marcadas.includes(ultimo) ? ultimo : marcadas[marcadas.length - 1];
        mostrar(alvo ? caixa(caminho(cod, alvo)) : "");
      };
      const m = multipla(ops, marcadas, exclusivas, mais, (op, aviso3) => { outro.hidden = !marcadas.includes("Outro"); retornoMulti(op, aviso3); });
      ent.appendChild(m.wrap);
      ent.appendChild(outro);
      if (marcadas.length) retornoMulti(marcadas[marcadas.length - 1], false);
      coletar = () => {
        if (!marcadas.length) { erro(cod === "M7-11" ? "Escolha pelo menos um número para acompanhar, ou toque em “Não sei”." : "Escolha pelo menos uma opção, ou toque em “Não sei”."); return null; }
        if (marcadas.includes(NS)) return cod === "M7-11" ? { estado: "naosei", sugeridos: sugestoes() } : { estado: "naosei" };
        if (marcadas.includes("Outro") && !p.querySelector("#outro").value.trim()) { mostrar(caixa(caminho(cod, "Outro"))); return null; }
        return Object.assign({ estado: "multi", opcoes: marcadas.slice() }, marcadas.includes("Outro") ? { outro: p.querySelector("#outro").value.trim() } : {});
      };
    } else if (cod === "M7-12") {
      ent.appendChild(el(`<textarea class="campo" rows="3" id="txt" aria-labelledby="pergunta">${esc(resp && resp.texto || "")}</textarea>`));
      let mostrou = false;
      coletar = () => {
        const t = p.querySelector("#txt").value.trim();
        if (!mostrou) { mostrou = true; mostrar(caixa(caminho(cod, t ? "Texto preenchido" : "Em branco"))); trocarParaSeguir(t ? { estado: "valor", texto: t } : { estado: "vazio" }); return null; }
        return t ? { estado: "valor", texto: t } : { estado: "vazio" };
      };
    } else {
      /* escolha única com retorno ao tocar: M7-03, M7-08, M7-09 */
      let op = resp ? (resp.estado === "naosei" ? NS : resp.opcao) : null;
      ent.appendChild(unica(opcoesDe(cod), op, (o) => { op = o; mostrar(caixa(caminho(cod, o))); }));
      if (op) mostrar(caixa(caminho(cod, op)));
      if (cod === "M7-09" && I().regulada === "Sim") junto(caixa(caminho(cod, "Qualquer resposta, com atividade regulada em M4-11")));
      if (cod === "M7-08" && rev()) junto(`<div class="bloco b-proximo" id="dica-estoque"><b>Dica</b><p>Guarde as mercadorias em lugar limpo, seco e arejado, longe do chão e do sol, e siga o que a embalagem pede (por exemplo, geladeira). Venda primeiro o que vence primeiro.</p></div>`);
      coletar = () => {
        if (!op) { erro("Escolha uma opção para continuar."); return null; }
        return op === NS ? { estado: "naosei" } : { estado: "opcao", opcao: op };
      };
    }
    function caixaEquip(v) {
      const c = calc({ equipOnly: { un: Mo.num(v.un), minVez: v.minVez } });
      if (c.estado !== "ok") return "";
      const X = nTexto(c, "semana");
      return caixa(caminho(cod, "Unidades por vez e tempo por vez"), { "[N]": v.un, "[tempo]": fmtTempo(v.minVez), "[X]": X });
    }
    /* "Não sei" grava na hora e troca o botão para seguir */
    function trocarParaSeguir(r0) {
      const acoes = p.querySelector("#acoes");
      acoes.innerHTML = "";
      const b = el(`<button class="btn btn-primario seta" id="ok">Continuar</button>`);
      b.onclick = () => avancar(r0);
      acoes.appendChild(b);
    }
    p.querySelector("#ok").onclick = () => {
      const r0 = coletar();
      if (!r0) return;
      if (cod === "M7-02" && r0.estado === "valor" && !p.dataset.mostrou) {
        /* mostra "Anotado: cerca de…" antes de seguir */
        p.dataset.mostrou = "1";
        const c = r0.un !== "1" ? caminho(cod, "Tempo do lote e unidades por lote") : caminho(cod, "Tempo por unidade");
        mostrar(caixa(c, { "[N]": r0.un, "[tempo]": fmtTempo(r0.min), "[x]": Mo.fmt(r0.minUn, r0.minUn % 1 ? 1 : 0) }));
        return trocarParaSeguir(r0);
      }
      avancar(r0);
    };
    return p;
  }

  /* ================= contas com as respostas ================= */
  const naoAplicaTempo = () => !!(S.R["M7-02"] && S.R["M7-02"].estado === "naoaplica");
  function minUnAtual() {
    if (I().minUn > 0) return I().minUn;
    const r = S.R["M7-02"];
    return r && r.estado === "valor" ? r.minUn : null;
  }
  function calc(o) {
    const r4 = S.R["M7-04"], r5a = S.R["M7-05a"];
    const ajuda = r4 && r4.estado === "opcao" ? r4.horas || 0 : 0;
    const equip = (o && o.equipOnly) || (r5a && r5a.estado === "valor" ? { un: Mo.num(r5a.un), minVez: r5a.minVez } : null);
    const ap = S.R["M7-03"]; const apoio = ap ? (ap.estado === "naosei" ? NS : ap.opcao) : null;
    return Mo.capacidade({ horas: I().horas, apoio, ajuda: o && o.semAjuda ? 0 : ajuda, minUn: o && o.equipOnly ? null : minUnAtual(), equip });
  }
  const ajudaGratis = () => { const r = S.R["M7-04"]; return r && r.estado === "opcao" && r.opcao.startsWith("Sim, sem pagamento") && r.horas > 0 && r.horas <= Mo.LIMITE.ajudaMax; };
  /* capacidade só com o seu tempo, quando há ajuda sem pagamento (mesma regra na tabela e no resumo) */
  const semAjuda = (c) => { if (!c || c.estado !== "ok" || !ajudaGratis()) return null; const s = calc({ semAjuda: true }); return s.estado === "ok" ? s : null; };
  const volume = () => { const n = Mo.num(I().volume); return n > 0 ? n : null; };
  function prazoDias() {
    const r = S.R["M7-06"]; if (!r || r.estado !== "partes") return null;
    return { "No mesmo dia ou compro na hora": 0, "De 1 a 3 dias": 3, "De 4 a 7 dias": 7, "Mais de 7 dias": Mo.num(r.dias) > 0 ? Mo.num(r.dias) : 7 }[r.p2] ?? null;
  }

  /* lacunas: perguntas com "Não sei" ou partes "Não sei"/"Ainda não procurei" */
  function lacunas() {
    const out = [];
    sequencia().forEach((c) => {
      const r = S.R[c];
      if (!r) return;
      if (r.estado === "naosei" || (r.estado === "partes" && (r.p1 === NS || r.p1 === "Ainda não procurei" || r.p2 === NS))) out.push(Q[c].descobre);
    });
    if (!I().horas || I().horas === NS) out.push("Horas por semana para o negócio");
    return out;
  }

  /* cruzamentos (aba Resumo, tabela C) que dá para conferir com as respostas deste aparelho */
  function cruzamentos(c) {
    const C = Object.fromEntries(D.resumo.cruzamentos.map((x) => [x.quando, x]));
    const out = [];
    const add = (k, extra) => out.push({ x: C[k], texto: preencher(C[k].mensagem, extra) });
    const vol = volume();
    if (c.estado === "sem-producao") add("Apoio maior ou igual às horas (M1-09)");
    const cmp = Mo.comparar(c, vol);
    if (cmp && cmp.tipo === "falta") add("Volume do Módulo 5 acima da capacidade", { "[volume]": Mo.fmt(vol), "[N]": nTexto(c, "mes") });
    const tn = Mo.num(I().testeN), td = Mo.num(I().testeDias);
    const t = Mo.teste(c, tn, td);
    if (t && t.passa) add("Critério do teste (M4-15) acima da capacidade semanal", { "[critério]": Mo.fmt(tn), "[prazo]": Mo.fmt(td), "[N]": Mo.fmt(t.semana) });
    const r4 = S.R["M7-04"];
    if (r4 && r4.opcao === "Sim, pago alguém" && I().temGastos5 && !/funcion|ajudant/i.test(I().gastos5 || "")) add("Ajuda paga (M7-04) sem gasto com funcionários no Módulo 5");
    if (opR("M7-08") === "Sim, em poucos dias" && ["A cada 15 dias", "Todo mês"].includes(I().reposicao)) add("Validade curta (M7-08) e reposição espaçada (M6-09)", { "[frequência]": I().reposicao.toLowerCase() });
    if (opR("M7-08") === "Não" && I().perdas5 === "Sim") add("Perdas no Módulo 5 e validade 'Não'");
    const r6 = S.R["M7-06"];
    if (r6 && r6.p1 === "Só um" && r6.p2 === "Mais de 7 dias") add("Fornecedor único e prazo acima de 7 dias");
    if (I().preocupacao === "Ainda não sei fazer direito" && opR("M7-09") && opR("M7-09") !== "Sigo um padrão ou receita anotada") add("Preocupação 'saber fazer bem' (M1-12) e sem padrão de qualidade");
    if (["Ainda não sei fazer", "Sei um pouco, ainda estou aprendendo"].includes(I().experiencia) && opR("M7-09") === "Fico sabendo pelo cliente") add("Experiência baixa (M1-08) e 'fico sabendo pelo cliente'");
    const enc = I().regulada === "Sim" ? { x: C["Atividade regulada (M4-11)"], texto: C["Atividade regulada (M4-11)"].mensagem } : null;
    /* no máximo 3 alertas: perguntas gentis primeiro */
    const ord = out.sort((a, b) => (a.x.forma === "Pergunta gentil" ? 0 : 1) - (b.x.forma === "Pergunta gentil" ? 0 : 1)).slice(0, 3);
    return { alertas: ord, enc };
  }
  function proximosPassos(c) {
    const B = Object.fromEntries(D.resumo.proximos.map((x) => [x.situacao, x.mensagem]));
    const out = [];
    if (!minUnAtual() && !naoAplicaTempo()) out.push(preencher(B["Tempo não medido"]));
    const cmp = Mo.comparar(c, volume());
    if (cmp && cmp.tipo === "falta") out.push(preencher(B["Capacidade abaixo do volume pretendido"], { "[N]": nTexto(c, "mes"), "[volume]": Mo.fmt(volume()) }));
    const r6 = S.R["M7-06"];
    if (r6 && (r6.p1 === "Só um" || r6.p1 === "Ainda não procurei")) out.push(preencher(B["Fornecedor único ou não pesquisado"]));
    if (opR("M7-09") === "Ainda não confiro") out.push(preencher(B["Sem conferência de qualidade"]));
    if (!out.length && !lacunas().length) out.push(preencher(B["Tudo preenchido e sem alertas"]));
    return out.slice(0, 3);
  }

  /* itens do checklist de riscos: M7-10 + fornecedor único, prazo > 7 dias, validade curta, atividade regulada (até 6) */
  function riscos() {
    const out = [];
    const r10 = S.R["M7-10"];
    if (r10 && r10.estado === "multi") r10.opcoes.forEach((o) => out.push({ nome: o === "Outro" ? r10.outro : rot(o), antes: o === "Outro" ? "" : caminho("M7-10", o).texto }));
    if (r10 && r10.estado === "naosei") etapas().slice(0, 3).forEach((e) => out.push({ nome: e, antes: "" }));
    const r6 = S.R["M7-06"];
    if (r6 && r6.p1 === "Só um") out.push({ nome: "Depender de um só fornecedor", antes: caminho("M7-06", "Parte 1: Só um").texto });
    if (r6 && r6.p2 === "Mais de 7 dias") out.push({ nome: "Prazo de entrega do fornecedor acima de 7 dias", antes: caminho("M7-06", "Parte 2: Mais de 7 dias").texto });
    if (opR("M7-08") === "Sim, em poucos dias") out.push({ nome: rev() ? "Mercadorias que vencem em poucos dias" : "Itens que estragam em poucos dias", antes: caminho("M7-08", "Sim, em poucos dias").texto });
    if (I().regulada === "Sim") out.push({ nome: "Atividade com regras próprias", antes: caminho("M7-09", "Qualquer resposta, com atividade regulada em M4-11").texto });
    return out.slice(0, 6).map((x) => Object.assign(x, { antes: preencher(x.antes) }));
  }
  /* revenda: estoque, armazenamento, validade e entrega (orientação, com o que a pessoa contou) */
  function cuidadosRevenda() {
    const e = I().estoque, v = opR("M7-08"), ent = I().entrega;
    const itens = [
      ["Estoque", e === ESTOQUE[0] ? "Você vai manter mercadoria guardada. Comece com pouco e aumente conforme as vendas: mercadoria parada é dinheiro parado."
        : e === ESTOQUE[1] ? "Você compra quando o cliente pede. Combine com o cliente um prazo que inclua o tempo do fornecedor para entregar a você."
        : "Decida se vai manter mercadoria guardada ou comprar quando o cliente pedir. Isso muda quanto dinheiro fica parado."],
      ["Armazenamento", "Guarde em lugar limpo, seco e arejado, longe do chão e do sol. Siga o que a embalagem pede, como geladeira ou empilhar no máximo algumas caixas."],
      ["Validade", v === "Sim, em poucos dias" ? "Suas mercadorias vencem rápido: compre menos de cada vez, confira a validade quando chegam e venda primeiro o que vence primeiro."
        : v === "Não" ? "Mesmo sem validade curta, confira se nada amassou, quebrou ou saiu de moda antes de vender."
        : "Confira a validade quando a mercadoria chega e antes de entregar. Venda primeiro o que vence primeiro."],
      ["Entrega", `${ent ? `Você contou que a entrega é por ${ent.toLowerCase()}. ` : ""}Antes de sair, confira itens e quantidade do pedido e proteja o que pode quebrar ou amassar.`],
    ];
    return `<h4>Cuidados com a mercadoria</h4><ul class="cuidados" id="cuidados-revenda">${itens.map(([t, x]) => `<li><b>${esc(t)}</b> ${esc(x)}</li>`).join("")}</ul>`;
  }
  function indicadores() {
    const r = S.R["M7-11"];
    return r && r.estado === "multi" ? r.opcoes : r && r.estado === "naosei" ? r.sugeridos || sugestoes() : [];
  }

  /* ================= resumo (tela M7-13) ================= */
  const INST = Object.fromEntries(D.instrumentos.map((x) => [x.nome, x]));
  const avisoInst = (nome, i) => `<p class="aviso-inst">${esc(preencher(INST[nome].avisos[i || 0]))}</p>`;
  const termoBox = (nomes) => { const ts = TERMO.filter((t) => nomes.includes(t.termo)); return !ts.length ? "" : `<details class="saiba"><summary><span>Entenda os termos</span></summary>${ts.map((t) => `<div class="conceito"><b>${esc(t.termo)}</b><p>${esc(t.explicacao)}</p><p class="ex">${esc(t.exemplo)}</p></div>`).join("")}</details>`; };
  /* "O que entendemos até aqui": frases montadas por regra com este módulo + os anteriores */
  /* texto corrido: as frases de cada assunto viram um parágrafo (1 a 3 parágrafos curtos, sem lista) */
  const emParagrafos = (fr, ...cortes) => [0, ...cortes].map((c, i, a) => fr.slice(c, i + 1 < a.length ? a[i + 1] : fr.length).join(" ")).filter(Boolean);
  function entendemos(c) {
    const fr = [];
    const o = oferta();
    const tipoTxt = { fab: "um produto que você mesmo faz", rev: "uma mercadoria que você compra pronta para revender", serv: "um serviço" }[tipoChave()];
    const est = { [ESTAGIOS[0]]: "ainda está na fase da ideia", [ESTAGIOS[1]]: "já fez testes ou amostras", [ESTAGIOS[2]]: "já vende" }[I().estagio];
    if (o || tipoTxt) fr.push(`Você ${o ? `oferece ${o}` : "tem uma oferta"}${tipoTxt ? `, ${tipoTxt}` : ""}${est ? `, e ${est}` : ""}.`);
    if (I().dor) fr.push(`Seu cliente procura você por isto: ${I().dor.replace(/[.!]+$/, "")}.`);
    const c1 = fr.length;   // 1º parágrafo: a oferta e o cliente
    const mu = minUnAtual();
    const hs = I().horas && I().horas !== NS ? I().horas.replace("Até", "até").replace("De", "de").replace("Mais", "mais").replace(" h", " horas") : null;
    const sem = semAjuda(c);
    if (c.estado === "ok") fr.push(`Com ${hs} por semana${mu ? ` e cerca de ${fmtMin(mu)} para ${verbo()} cada um` : ""}, cabem ${sem ? `${Mo.texto(sem, "mes")} por mês sem ajuda e ${Mo.texto(c, "mes")} por mês com a ajuda que você contou` : `${Mo.texto(c, "mes")} por mês`}.`);
    else if (c.estado === "sem-producao") fr.push("As tarefas de apoio (clientes, compras, entregas) tomam todo o tempo que você tem, então ainda não sobra tempo para produzir.");
    else if (hs && naoAplicaTempo()) fr.push(`Como o tempo de ${verbo()} cada pedido não se aplica ao seu negócio, a conta de quanto cabe por mês ficou de fora.`);
    else fr.push(`Ainda falta ${!hs ? "saber quantas horas por semana você tem" : "medir quanto tempo leva cada unidade ou atendimento"} para calcular quanto cabe por mês.`);
    const vol = volume(), cmp = Mo.comparar(c, vol);
    if (vol && cmp) fr.push(cmp.tipo === "falta" ? `Você quer vender ${Mo.fmt(vol)} por mês, mais do que cabe hoje: vale rever o tempo, pedir ajuda ou ajustar a meta.` : `Você quer vender ${Mo.fmt(vol)} por mês, e isso cabe no seu tempo.`);
    const c2 = fr.length;   // 2º: quanto cabe e a meta; 3º: o que segura o ritmo
    const g = opR("M7-05"), r5 = S.R["M7-05"];
    if (g && g !== NS) fr.push(`O que mais segura o seu ritmo hoje é ${g === "Uma etapa que demora ou acumula" && r5.etapa ? `a etapa “${r5.etapa}”` : rot(g).charAt(0).toLowerCase() + rot(g).slice(1)}.`);
    const r6 = S.R["M7-06"];
    if (temFase3() && I().item && r6 && r6.estado === "partes" && r6.p1 === "Só um") fr.push(`Você depende de um só fornecedor para ${I().item}: ter um segundo nome anotado evita parar se faltar.`);
    else { const q9 = opR("M7-09"); if (q9 && q9 !== NS) fr.push(q9 === "Sigo um padrão ou receita anotada" ? (rev() ? "Você já segue uma lista de conferência anotada, o que ajuda a entregar o pedido certo." : "Você já segue um padrão anotado para a qualidade, o que ajuda a entregar sempre igual.") : (rev() ? "Anotar uma lista simples do que conferir (itens, quantidade, validade, embalagem) ajuda a entregar o pedido certo." : "Anotar um padrão de qualidade simples ajuda a entregar sempre igual.")); }
    return emParagrafos(fr.slice(0, 6), c1, c2);
  }
  const fmtMin = (min) => { const h = Math.floor(min / 60), m = Math.round(min - h * 60); return h && m ? `${h} h ${m} min` : h ? `${h} h` : `${Mo.fmt(min, min % 1 ? 1 : 0)} min`; };
  /* "Como calculamos: …": a conta de cada número do resultado em linguagem simples, com os valores da pessoa */
  const comoCalc = (t, id) => `<p class="como-calc"${id ? ` id="${id}"` : ""}>Como calculamos: ${esc(t)}</p>`;
  const fmt1 = (n) => Mo.fmt(n, n % 1 ? 1 : 0);
  function comoCapacidade(c) {
    if (!c || c.estado !== "ok") return "";
    const f = Mo.HORAS[I().horas];
    const ap = S.R["M7-03"], apoioOp = ap ? (ap.estado === "naosei" ? NS : ap.opcao) : null;
    const apoio = Mo.APOIO[apoioOp] ?? 0;
    const r4 = S.R["M7-04"], ajuda = r4 && r4.estado === "opcao" && r4.horas > 0 && r4.horas <= Mo.LIMITE.ajudaMax ? r4.horas : 0;
    const mu = minUnAtual(), r5a = S.R["M7-05a"];
    const umaConta = (h, b) => {
      let t = `${fmt1(h)} h por semana`;
      if (apoio) t += ` − ${fmt1(apoio)} h de tarefas de apoio${apoioOp === NS ? " (estimativa)" : ""}`;
      if (ajuda) t += ` + ${fmt1(ajuda)} h de ajuda`;
      t += ` = ${Mo.fmt(b.minProd)} min para ${verbo()}`;
      if (b.limite === "equipamento" && r5a && r5a.estado === "valor") {
        const vezes = Math.floor(b.minProd / r5a.minVez + 1e-9);
        return `${t}; ${Mo.fmt(b.minProd)} min ÷ ${fmtMin(r5a.minVez)} por vez = ${Mo.fmt(vezes)} vezes × ${r5a.un} por vez = ${Mo.fmt(b.semana)} por semana. No mês (${Mo.fmt(Mo.SEMANAS_MES, 2)} semanas) = ${Mo.fmt(b.mes)}.`;
      }
      return `${t} ÷ ${fmtMin(mu)} cada um = ${Mo.fmt(b.semana)} por semana. No mês: ${Mo.fmt(b.minProd)} min × ${Mo.fmt(Mo.SEMANAS_MES, 2)} semanas ÷ ${fmtMin(mu)} = ${Mo.fmt(b.mes)} (sempre arredondado para baixo).`;
    };
    if (c.modo === "faixa" && c.lo !== c.hi) return comoCalc(`com ${fmt1(f.lo)} h: ${umaConta(f.lo, c.lo)} Com ${fmt1(f.hi)} h: ${umaConta(f.hi, c.hi)}`, "como-capacidade");
    const b = c.modo === "min" ? c.lo : c.hi;
    return comoCalc(umaConta(c.modo === "min" ? f.lo : f.hi, b), "como-capacidade");
  }
  function telaResultado() {
    if (S.hist[S.hist.length - 1] !== "RESULTADO") { S.hist.push("RESULTADO"); salvar(); }
    const c = calc();
    const B = Object.fromEntries(D.resumo.blocos.map((x) => [x.bloco, x.conteudo]));
    const q13 = Q["M7-13"];
    /* processo */
    const r5 = S.R["M7-05"];
    const garg = r5 && r5.etapa;
    const mapaHtml = `<ol class="mapa">${etapas().map((e) => `<li class="${e === garg ? "gargalo" : ""}"><span>${esc(e)}</span>${e === garg ? `<em>Gargalo</em>` : ""}</li>`).join("")}</ol>
      <p class="aviso-inst">Tempo de cada etapa: a medir.</p>
      ${r5 && !garg ? `<p class="diag-q">Gargalo</p><p class="diag-r">${esc(r5.estado === "naosei" ? "Ainda não definido" : rot(r5.opcao))}</p>` : ""}
      ${avisoInst("Mapa do processo")}${ideia() ? avisoInst("Mapa do processo", 1) : ""}`;
    /* capacidade */
    let capHtml;
    if (c.estado === "ok") {
      const cmp = Mo.comparar(c, volume());
      const sem = semAjuda(c);
      const mu = minUnAtual();
      const n4 = Mo.num(I().testeN), d4 = Mo.num(I().testeDias);
      capHtml = `<div class="res-dupla">
          <div class="res-num"><div class="lbl">Por semana</div><div class="val">${esc(Mo.texto(c, "semana"))}</div></div>
          <div class="res-num"><div class="lbl">Por mês</div><div class="val">${esc(Mo.texto(c, "mes"))}</div>${sem ? `<div class="sub">com a ajuda que você contou</div>` : ""}</div>
        </div>
        ${comoCapacidade(c)}
        <p class="diag-r">Limite usado na conta: ${c.limite === "equipamento" ? "o equipamento ou espaço" : "o tempo de trabalho"}.</p>
        ${sem ? `<p class="diag-r" id="sem-com">Por mês, sem ajuda: ${esc(Mo.texto(sem, "mes"))}; com ajuda: ${esc(Mo.texto(c, "mes"))}.</p>` : ""}
        ${mu > Mo.LIMITE.minUnAlto ? `<div class="bloco b-alerta" id="aviso-tempo"><b>Atenção</b><p>Você informou ${esc(fmtMin(mu))} para ${esc(verbo())} cada unidade. Esse tempo parece muito alto e deixa quase nada caber na semana. Confira em “Seu ponto de partida” ou na pergunta do tempo.</p></div>` : ""}
        ${volume() ? `<p class="diag-r">Você pretende ${esc(Mo.fmt(volume()))} por mês. ${cmp.tipo === "falta" ? (c.modo === "faixa" ? `Passa do máximo em pelo menos ${esc(Mo.fmt(cmp.n))}.` : `Faltam cerca de ${esc(Mo.fmt(cmp.n))} por mês.`) : cmp.tipo === "folga" ? `Cabe, com folga de ${esc(Mo.fmt(cmp.n))} por mês.` : "Fica dentro da faixa estimada."}</p>` : ""}
        ${n4 > 0 && d4 > 0 ? `<p class="diag-r">Teste da ideia: ${esc(Mo.fmt(n4))} em ${esc(Mo.fmt(d4))} dias.</p>` : ""}
        ${avisoInst("Calculadora de capacidade")}`;
    } else {
      const motivo = c.estado === "sem-producao" ? preencher(D.resumo.cruzamentos.find((x) => x.quando.startsWith("Apoio maior")).mensagem) : "";
      capHtml = `<p class="diag-r"><b>Capacidade em construção.</b> ${esc(motivo)}</p>`;
    }
    /* fornecedores e estoque */
    let fornHtml = "";
    if (temFase3()) {
      const r6 = S.R["M7-06"], crit = S.R["M7-07"];
      const criterios = crit && crit.estado === "multi" ? crit.opcoes.filter((x) => x !== "Só o preço") : crit && crit.estado === "naosei" ? SUGERIDOS_FORN : [];
      const colunas = ["Preço"].concat(criterios.filter((x) => x !== "Preço"));
      const forn = S.inst.forn.length ? S.inst.forn : [{ nome: "", v: {} }, { nome: "", v: {} }, { nome: "", v: {} }];
      S.inst.forn = forn;
      const prazo = prazoDias(), vol = volume(), uso = Mo.num(I().uso), perda = Mo.num(I().perda);
      const folga = Mo.num(S.inst.folga) > 0 ? Mo.num(S.inst.folga) : 0;
      const ponto = prazo != null ? Mo.pontoDePedido(vol, uso, prazo, folga) : null;
      const compra = vol && uso > 0 ? Mo.compraComPerda(vol * uso, perda) : null;
      const OPS = ["atende", "não atende", "não sei"];
      const un = I().usoUn || "", nomeItem = I().item || "O item principal";
      const fmt1 = (n) => Mo.fmt(n, n % 1 ? 1 : 0);
      fornHtml = `<section class="cartao bloco-res"><h3>Fornecedores e estoque</h3>
        ${r6 && r6.estado === "partes" ? `<p class="diag-q">Fornecedores ${rev() ? "da mercadoria principal" : "do item principal"}</p><p class="diag-r">${esc(r6.p1)} · chega: ${esc(r6.p2.toLowerCase())}${r6.dias ? ` (${esc(r6.dias)} dias)` : ""}</p>` : ""}
        <h4>Lembrete de reposição${I().item ? ` · ${esc(I().item)}` : ""}</h4>
        ${ponto != null ? `<div class="res-num"><div class="lbl">Peça de novo quando restarem</div><div class="val">${esc(Mo.fmt(ponto))}${un ? ` ${esc(un)}` : ""}</div><div class="sub">${esc(nomeItem)} que você usa durante ${esc(Mo.fmt(prazo))} dias de prazo${folga ? `, mais a folga de ${esc(Mo.fmt(folga))}` : ""}</div></div>
          <ul class="reposicao-conta" id="conta-reposicao">
            <li>Vendas por dia: ${esc(Mo.fmt(vol))} por mês ÷ ${Mo.DIAS_MES} dias = cerca de ${esc(fmt1(Mo.vendasDia(vol)))} por dia.</li>
            ${uso !== 1 || un ? `<li>Uso de ${esc(nomeItem.toLowerCase())} por dia: ${esc(fmt1(Mo.vendasDia(vol)))} × ${esc(fmt1(uso))}${un ? ` ${esc(un)}` : ""} em cada unidade = ${esc(fmt1(Mo.consumoDia(vol, uso)))}${un ? ` ${esc(un)}` : ""} por dia.</li>` : ""}
            <li>No prazo de ${esc(Mo.fmt(prazo))} dias: ${esc(fmt1(Mo.consumoDia(vol, uso)))} × ${esc(Mo.fmt(prazo))} = ${esc(Mo.fmt(ponto - folga))}${un ? ` ${esc(un)}` : ""}${folga ? ` + folga de ${esc(Mo.fmt(folga))}` : ""}.</li>
          </ul>
          ${comoCalc(`${fmt1(Mo.consumoDia(vol, uso))}${un ? ` ${un}` : ""} por dia × ${Mo.fmt(prazo)} dias de prazo do fornecedor = ${Mo.fmt(ponto - folga)}${un ? ` ${un}` : ""}${folga ? ` + ${Mo.fmt(folga)} de folga = ${Mo.fmt(ponto)}` : ""} (arredondado para cima).`, "como-reposicao")}`
          : `<p class="diag-r">Para calcular, faltam ${[!vol && "o volume por mês", !(uso > 0) && "a quantidade do item por unidade", prazo == null && "o prazo de entrega"].filter(Boolean).join(", ")}. Complete em “Seu ponto de partida”.</p>`}
        <label class="rot-campo" for="folga">Folga que você quer manter (unidades a mais)</label><input class="campo" id="folga" inputmode="numeric" value="${esc(S.inst.folga)}">
        ${compra ? `<p class="diag-r">Compra do mês${perda > 0 ? `, já contando a perda de ${esc(Mo.fmt(perda, perda % 1 ? 1 : 0))}%` : ""}: ${esc(Mo.fmt(compra))}${I().usoUn ? ` ${esc(I().usoUn)}` : ""}.</p>${comoCalc(`${Mo.fmt(vol)} por mês × ${fmt1(uso)}${un ? ` ${un}` : ""} em cada um = ${fmt1(vol * uso)}${un ? ` ${un}` : ""}${perda > 0 ? `; com a perda de ${fmt1(perda)}%, dividimos por ${Mo.fmt(100 - perda, perda % 1 ? 1 : 0)}% (o que sobra depois da perda) = ${Mo.fmt(compra)}` : ""} (arredondado para cima).`, "como-compra")}` : ""}
        ${avisoInst("Lembrete de reposição")}
        ${rev() ? cuidadosRevenda() : ""}
        <h4>Quadro de fornecedores</h4>
        ${forn.map((f, i) => {
          const crits = colunas.slice(1), conta = crits.filter((k) => f.v[k] === "atende").length, marcou = crits.some((k) => f.v[k]);
          const contaHtml = !crits.length ? `<p class="conta-forn vazia">Nenhum critério escolhido.</p>`
            : !marcou ? `<p class="conta-forn vazia">Marque se este fornecedor atende ${crits.length === 1 ? "o critério" : "cada critério"}.</p>`
            : `<p class="conta-forn">Atende ${conta} de ${crits.length} ${crits.length === 1 ? "critério" : "critérios"}</p>`;
          return `<div class="forn" data-i="${i}"><label class="rot-campo" for="fn${i}">Fornecedor ${i + 1}</label><input class="campo" id="fn${i}" data-f="nome" value="${esc(f.nome)}" placeholder="Nome que você pesquisou">
            <div class="linha"><span class="lbl">Preço</span><input class="campo" data-f="preco" value="${esc(f.preco || "")}" inputmode="decimal" aria-label="Preço do fornecedor ${i + 1}"></div>
            ${colunas.slice(1).map((k) => `<div class="linha crit"><span class="lbl">${esc(k)}</span><select class="campo" data-k="${esc(k)}" aria-label="${esc(k)} – fornecedor ${i + 1}"><option value=""></option>${OPS.map((o) => `<option ${f.v[k] === o ? "selected" : ""}>${o}</option>`).join("")}</select></div>`).join("")}
            <label class="rot-campo" for="fd${i}">Data da pesquisa</label><input class="campo" id="fd${i}" data-f="data" value="${esc(f.data || "")}">
            ${contaHtml}</div>`;
        }).join("")}
        ${avisoInst("Quadro de fornecedores")}
        ${termoBox(["Prazo de entrega do fornecedor", "Ponto de pedido", "Perda"])}
      </section>`;
    }
    /* qualidade, riscos, números */
    const padrao = S.inst.padrao.length ? S.inst.padrao : ["", "", ""];
    S.inst.padrao = padrao;
    const rs = riscos();
    const inds = indicadores();
    const painel = S.inst.painel;
    let leitura = "";
    if (painel.length >= 4) {
      const a = painel[painel.length - 2], b = painel[painel.length - 1];
      leitura = inds.map((k) => { const x = Mo.num(a[k]), y = Mo.num(b[k]); if (x == null || y == null || isNaN(x) || isNaN(y)) return ""; return `${k}: ${y > x ? "subiu" : y < x ? "caiu" : "ficou parecido"}`; }).filter(Boolean).join(" · ");
    }
    const cz = cruzamentos(c);
    const passos = proximosPassos(c);
    const lac = lacunas();
    const r13 = S.R["M7-13"];
    /* o item sobre fornecedores só vale quando a fase de fornecedores aparece */
    const IA = D.pedidos_ia.filter((x) => (x.texto || "").trim() && (temFase3() || x.pedido !== "Fornecedores"));
    const respostas = [["Seu ponto de partida", null]].concat(sequencia().map((k) => [perg(k), k]));
    const p = el(`<div class="pag">
      ${topo("Resultado")}
      ${heroi({ kicker: "Resultado", kickerClasse: "passo", titulo: preencher(q13.pergunta), extra: chipOferta() })}
      <main class="corpo">
        ${botaoVoltar()}
        ${barraFases(null, true)}
        <section class="cartao entendemos" id="entendemos"><h3>O que entendemos até aqui</h3>${entendemos(c).map((x) => `<p>${esc(x)}</p>`).join("")}</section>
        <section class="concluido">
          <div class="conc-topo"><span class="check" aria-hidden="true"></span><div><h2>Você chegou ao retrato da sua operação</h2><p>${esc(preencher(q13.apoio))}</p></div></div>
        </section>
        ${cz.alertas.length || cz.enc ? `<section class="cartao"><h3>Pontos para conferir</h3>${cz.alertas.map((a) => `<div class="bloco ${a.x.forma === "Pergunta gentil" ? "b-alerta" : "b-proximo"}"><b>${esc(a.x.forma)}</b><p>${esc(a.texto)}</p></div>`).join("")}
          ${cz.enc ? `<div class="bloco b-enc"><b>${esc(cz.enc.x.forma)}</b><p>${esc(cz.enc.texto)}</p></div>` : ""}</section>` : ""}
        <section class="cartao bloco-res"><h3>Seu processo</h3>${mapaHtml}${termoBox(["Processo", "Gargalo"])}</section>
        <section class="cartao bloco-res"><h3>Sua capacidade</h3>${capHtml}${termoBox(["Capacidade", "Tempo de apoio", "Lote"])}</section>
        ${fornHtml}
        <section class="cartao bloco-res"><h3>Qualidade</h3>
          ${opR("M7-09") ? `<p class="diag-r">${esc(rot(opR("M7-09")))}</p>` : ""}
          <h4>Padrão de qualidade</h4>
          ${padrao.map((x, i) => `<input class="campo pq" data-i="${i}" aria-label="Ponto ${i + 1}" placeholder="Ponto ${i + 1}" value="${esc(x)}">`).join("")}
          ${padrao.length < 5 ? `<button class="btn-mais" id="pq-mais">+ Incluir ponto</button>` : ""}
          ${avisoInst("Padrão de qualidade")}${termoBox(["Padrão de qualidade"])}
        </section>
        <section class="cartao bloco-res"><h3>Riscos</h3>
          ${rs.length ? rs.map((x, i) => `<div class="risco"><b>${esc(x.nome)}</b>${x.antes ? `<p class="diag-q">O que fazer antes</p><p class="diag-r">${esc(x.antes)}</p>` : ""}
            <label class="rot-campo" for="pb${i}">O que fazer se acontecer</label><textarea class="campo pb" rows="2" id="pb${i}" data-k="${esc(x.nome)}">${esc(S.inst.plano[x.nome] || "")}</textarea></div>`).join("") : `<p class="diag-r">Nenhum risco escolhido.</p>`}
          ${avisoInst("Checklist de riscos da operação")}
        </section>
        <section class="cartao bloco-res"><h3>Números da semana</h3>
          ${inds.length ? `<div class="tabela-wrap"><table class="fluxo painel"><thead><tr><th>Semana</th>${inds.map((k) => `<th>${esc(rot(k))}</th>`).join("")}</tr></thead>
            <tbody>${painel.map((l, i) => `<tr><td>${i + 1}</td>${inds.map((k) => `<td><input class="pn" data-i="${i}" data-k="${esc(k)}" inputmode="decimal" aria-label="${esc(rot(k))} – semana ${i + 1}" value="${esc(l[k] || "")}"></td>`).join("")}</tr>`).join("")}</tbody></table></div>
            <button class="btn-mais" id="semana">+ Anotar uma semana</button>
            ${leitura ? `<p class="diag-r">${esc(leitura)}</p>` : ""}${avisoInst("Painel semanal")}` : `<p class="diag-r">Nenhum número escolhido.</p>`}
          ${termoBox(["Indicador"])}
        </section>
        ${lac.length ? `<section class="cartao"><h3>O que ainda falta definir</h3><ul class="lista-capa">${lac.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></section>` : ""}
        ${passos.length ? `<section class="cartao"><h3>Próximos passos</h3><ol class="lista-capa">${passos.map((x) => `<li>${esc(x)}</li>`).join("")}</ol></section>` : ""}
        ${S.R["M7-12"] && S.R["M7-12"].texto ? `<section class="cartao"><h3>Ideias para depois</h3><p>${esc(S.R["M7-12"].texto)}</p></section>` : ""}
        ${IA.length ? `<section class="cartao" id="pedidos-ia"><h3>Pedidos para ferramentas de IA (só para organizar)</h3>
          ${IA.map((x) => { const t = preencher(x.texto, { "[cole aqui as etapas]": etapas().join(", ") }); const copia = !/^Não há pedido/.test(x.texto);
            return `<div class="caixa caixa-ia"><b>${esc(x.pedido)}</b>${copia ? `<div class="prompt"><p>${esc(t)}</p><button class="btn-copiar" data-t="${esc(t)}">Copiar texto</button></div>` : `<p>${esc(t)}</p>`}<p class="ex">${esc(x.conferir)}</p><p class="ex">${esc(x.obs)}</p></div>`; }).join("")}
        </section>` : ""}
        <section class="cartao-q pergunta" id="q13">
          <h2 class="q">${esc(preencher(q13.pergunta))}</h2>
          <div class="opcoes" id="op13">${opcoesDe("M7-13").map((o) => `<button class="opcao ${r13 && r13.opcao === o ? "sel" : ""}" data-o="${esc(o)}"><span class="radio" aria-hidden="true"></span><span class="op-txt"><b>${esc(o)}</b></span></button>`).join("")}</div>
          <div id="ret13">${r13 ? caixa(caminho("M7-13", r13.opcao)) : ""}</div>
          <div id="corr" ${r13 && r13.opcao === "Quero corrigir algo" ? "" : "hidden"}>${respostas.map(([t, k]) => `<div class="corr-item"><span>${esc(t)}</span><button class="btn btn-claro editar" data-c="${k || "PARTIDA"}">Corrigir minha resposta</button></div>`).join("")}</div>
        </section>
        <div class="acoes"><button class="btn btn-primario" id="imprimir">Imprimir resultado</button><button class="btn btn-linha" id="zerar2">Recomeçar do zero</button></div>
        <div id="seguir" ${r13 && r13.opcao === "Sim, pode seguir" ? "" : "hidden"}><div class="acoes lg2-proximo"><a class="btn btn-primario" style="text-decoration:none;text-align:center;box-sizing:border-box" href="/lg2/turma-b/m08/index.html">Ir para o Módulo 8</a></div></div>
        ${rodape()}
      </main>
    </div>`);
    const re = () => { salvar(); redesenhar(telaResultado); };
    p.querySelector("#v").onclick = () => { S.hist.pop(); const ant = S.hist.pop(); salvar(); ant && ant !== "RESULTADO" ? ir(telaPergunta, ant) : ir(telaCapa); };
    p.querySelector("#imprimir").onclick = () => window.print();
    p.querySelector("#zerar2").onclick = reiniciar;
    p.querySelectorAll("#op13 .opcao").forEach((b) => (b.onclick = () => { S.R["M7-13"] = { estado: "opcao", opcao: b.dataset.o }; re(); }));
    p.querySelectorAll("[data-c]").forEach((b) => (b.onclick = () => {
      S.voltarResumo = true; salvar();
      b.dataset.c === "PARTIDA" ? ir(telaPartida, { volta: true }) : ir(telaPergunta, b.dataset.c);
    }));
    const f = p.querySelector("#folga"); if (f) f.onchange = () => { S.inst.folga = f.value.trim(); re(); };
    p.querySelectorAll(".forn").forEach((d) => {
      const i = +d.dataset.i;
      d.querySelectorAll("[data-f]").forEach((x) => (x.onchange = () => { S.inst.forn[i][x.dataset.f] = x.value; salvar(); }));
      d.querySelectorAll("[data-k]").forEach((x) => (x.onchange = () => { S.inst.forn[i].v[x.dataset.k] = x.value; re(); }));
    });
    p.querySelectorAll(".pq").forEach((x) => (x.onchange = () => { S.inst.padrao[+x.dataset.i] = x.value; salvar(); }));
    const pm = p.querySelector("#pq-mais"); if (pm) pm.onclick = () => { S.inst.padrao.push(""); re(); };
    p.querySelectorAll(".pb").forEach((x) => (x.onchange = () => { S.inst.plano[x.dataset.k] = x.value; salvar(); }));
    p.querySelectorAll(".pn").forEach((x) => (x.onchange = () => { S.inst.painel[+x.dataset.i][x.dataset.k] = x.value; re(); }));
    const sm = p.querySelector("#semana"); if (sm) sm.onclick = () => { S.inst.painel.push({}); re(); };
    ligar(p);
    if (aviso) p.querySelector(".corpo").insertBefore(el(`<p class="erro">${esc(aviso)}</p>`), p.querySelector(".corpo").firstChild);
    return p;
  }

  ir(telaCapa);
})();
