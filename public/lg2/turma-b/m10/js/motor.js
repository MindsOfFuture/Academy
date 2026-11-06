/* Regras do Módulo 10 (Turma B), conforme as abas "Regras técnicas", "Caminhos por resposta" e
   "Cálculos a conferir" da planilha do Grupo 10. Funções puras: o app e os testes usam as mesmas. */
(function (raiz) {
  "use strict";
  const LIMITE_LISTA = 8;        // "Até 8 itens, sem repetição"
  const LIMITE_PRIORIDADES = 3;  // "Escolha até 3"
  const PRAZO_LONGO = 90;        // "Data acima de 90 dias"
  /* limites de aviso (receita B): avisam e deixam seguir */
  const META_ALTA = 300;   // "quanto basta" do plano acima de 300 numa ação de até 90 dias
  const PRECO_ALTO = 1000; // preço de venda acima de R$ 1.000 para um pequeno negócio caseiro
  const PESO = { alta: 0, media: 1, baixa: 2 };
  const URGENCIA = ["piora muito", "piora um pouco", "fica igual", "não sei"];

  /* Lista de prioridades sugeridas (M10-09): gravidade alta primeiro; depois itens que bloqueiam
     outros; depois os demais. Empate: ordem em que apareceram (Módulo 1 → 10). Sem repetição de tema. */
  function prioridades(itens) {
    const vistos = new Set();
    const unicos = [];
    itens.forEach((x, i) => {
      const k = String(x.tema || "").trim().toLowerCase();
      if (!k || vistos.has(k)) return;
      vistos.add(k);
      unicos.push(Object.assign({ i }, x));
    });
    const grupo = (x) => (x.gravidade === "alta" ? 0 : x.bloqueia ? 1 : 1 + PESO[x.gravidade || "baixa"]);
    return unicos.sort((a, b) => grupo(a) - grupo(b) || a.i - b.i).slice(0, LIMITE_LISTA).map(({ i, ...x }) => x);
  }

  /* "Mais de 3": aceitar só os 3 primeiros */
  const limitar = (marcadas) => marcadas.slice(0, LIMITE_PRIORIDADES);

  /* "Não sei" em M10-09: as 3 primeiras da lista (ordem de gravidade) */
  const tresPrimeiras = (lista) => lista.slice(0, LIMITE_PRIORIDADES).map((x) => x.tema);

  /* M10-10: 'piora muito' primeiro; empate pela ordem de gravidade da lista */
  function ordenarPorUrgencia(prios, urgencia, ordemLista) {
    const pos = (t) => { const i = (ordemLista || []).indexOf(t); return i < 0 ? 999 : i; };
    const u = (t) => { const i = URGENCIA.indexOf(urgencia[t]); return i < 0 ? URGENCIA.length : i; };
    return prios.slice().sort((a, b) => u(a) - u(b) || pos(a) - pos(b) || prios.indexOf(a) - prios.indexOf(b));
  }

  /* datas em "aaaa-mm-dd" (campo de data do navegador); hoje no mesmo formato */
  const dia = (s) => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || "")); return m ? Date.UTC(+m[1], +m[2] - 1, +m[3]) : null; };
  function avaliarData(data, hoje) {
    const d = dia(data), h = dia(hoje);
    if (d == null || h == null) return "invalida";
    if (d < h) return "passada";
    return (d - h) / 86400000 > PRAZO_LONGO ? "longe" : "ok";
  }
  const dataBR = (s) => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || "")); return m ? `${m[3]}/${m[2]}/${m[1]}` : String(s || ""); };
  const somarDias = (hoje, n) => { const d = new Date(dia(hoje) + n * 86400000); return d.toISOString().slice(0, 10); };

  /* o que se conta no "quanto basta" do plano (plural → singular, para concordar com o número) */
  const UNIDADES = { vendas: "venda", pedidos: "pedido", "clientes novos": "cliente novo", respostas: "resposta", "contatos de interesse": "contato de interesse", encomendas: "encomenda", clientes: "cliente", mensagens: "mensagem" };
  const UNIDADES_PLANO = ["vendas", "pedidos", "clientes novos", "respostas", "contatos de interesse"];
  const semPonto = (s) => String(s || "").replace(/\s+/g, " ").trim().replace(/[.;]+$/, "");

  /* frase do plano. Com o que se conta (unidade) e sem outro sinal, fica como no caso da aba
     "Cálculos a conferir": "…; vai funcionar se vierem 5 pedidos." O sinal escrito pela pessoa nunca
     ocupa o lugar da unidade (antes saía "vierem 1.500 Juiz de Fora"); pedaço vazio não aparece. */
  function frasePlano(p) {
    const acao = semPonto(p.acao);
    const A = acao.charAt(0).toUpperCase() + acao.slice(1);
    let sinal = semPonto(p.sinal); // como a pessoa escreveu (pode ter nome de lugar)
    let u = UNIDADES[String(p.unidade || "").trim()] ? String(p.unidade).trim() : null;
    /* sinal que já é uma unidade ("pedidos"): vira a unidade, como no caso da planilha */
    if (UNIDADES[sinal.toLowerCase()] && (!u || u === sinal.toLowerCase())) { u = sinal.toLowerCase(); sinal = ""; }
    const n = num(p.numero);
    const qtd = n > 0 ? `${fmt(n, n % 1 ? 1 : 0)}${u ? " " + (n === 1 ? UNIDADES[u] : u) : ""}` : "";
    let fim = "";
    if (qtd && u && !sinal) fim = `; vai funcionar se ${n === 1 ? "vier" : "vierem"} ${qtd}`;
    else if (sinal && qtd) fim = `; sinal de que funcionou: ${sinal} (meta: ${qtd})`;
    else if (sinal) fim = `; sinal de que funcionou: ${sinal}`;
    else if (qtd) fim = `; meta: ${qtd}`;
    return `${A}${p.data ? ` até ${dataBR(p.data)}` : ""}${fim}.`;
  }

  /* número digitado em pt-BR ("1.234,5", "90", "1,5") */
  function num(s) {
    if (typeof s === "number") return s;
    const t = String(s ?? "").trim().replace(/\s/g, "").replace(/^R\$/i, "");
    if (!t) return null;
    /* "1.500" sem vírgula = mil e quinhentos (ponto de milhar), não 1,5 */
    const milhar = /^[1-9]\d{0,2}(\.\d{3})+$/.test(t);
    const n = Number(/,/.test(t) || milhar ? t.replace(/\./g, "").replace(",", ".") : t);
    return Number.isFinite(n) ? n : NaN;
  }
  const fmt = (n, casas = 0) => Number(n).toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });

  /* ---------- "Por onde começar" (topo do resultado) ----------
     Até 3 ações, numeradas, nesta ordem:
       1) as prioridades que a própria pessoa marcou (já na ordem de urgência);
       2) os pontos para conferir (preço abaixo do custo, alimento sem Vigilância, gasto acima do limite do Módulo 1);
       3) as lacunas graves do percurso ("Não sei" em dado essencial: preço, viabilidade, dinheiro…);
       4) se ainda faltar, ações gerais do estágio.
     O texto muda com o estágio do Módulo 1 (M1.P01): quem já vende recebe ações de organizar e
     melhorar; quem ainda não começou recebe ações de testar. Tema repetido não entra duas vezes. */
  const POR_ONDE = 3;
  /* M1.P01: "Já vendi algumas vezes" / "Já vendo sempre" = vende; ideia ou amostras = começando */
  function estagioDe(t) {
    const s = String(t || "").trim();
    if (!s || /^n[ãa]o sei/i.test(s)) return null;
    return /^j[áa] vend/i.test(s) ? "vende" : "comeca";
  }
  /* temas reconhecidos no texto da prioridade ou da lacuna (a ordem importa: o primeiro que casar vale) */
  const TEMAS = [
    { chave: "preco", re: /pre[çc]o|precific|cobrar|abaixo do custo/i, modulo: 5,
      vende: "Refaça a conta do preço no Módulo 5 com os custos de hoje e anote as vendas da semana para ver quanto sobra em cada uma.",
      comeca: "Refaça a conta do preço no Módulo 5 e faça 5 vendas-teste com esse preço, anotando o que os clientes acharam." },
    { chave: "viabilidade", re: /viabilidade|prefeitura|endere[çc]o|alvar[áa]/i, modulo: 9,
      vende: "Faça a consulta de viabilidade na prefeitura para o endereço onde você já trabalha e anote a resposta no Módulo 9.",
      comeca: "Antes de alugar, reformar ou comprar equipamento, faça a consulta de viabilidade na prefeitura e anote a resposta no Módulo 9." },
    { chave: "vigilancia", re: /vigil[âa]ncia|sanit[áa]ri/i, modulo: 9,
      vende: "Confira no Módulo 9 a resposta sobre a Vigilância Sanitária e pergunte na prefeitura o que vale para o que você já vende.",
      comeca: "Antes das primeiras vendas, confira no Módulo 9 a resposta sobre a Vigilância Sanitária: quem vende alimento costuma precisar dela." },
    { chave: "limite", re: /come[çc]ar menor|limite|investir|investimento/i, modulo: 6,
      vende: "Anote os gastos e as vendas desta semana e reveja no Módulo 6 o que dá para adiar ou fazer menor.",
      comeca: "Reveja no Módulo 6 como começar menor, comprando só o necessário para 5 vendas-teste." },
    { chave: "caixa", re: /quanto dinheiro|dinheiro (voc[êe] )?tem|capital|caixa/i, modulo: 6,
      vende: "Anote o que entrou e saiu nesta semana e registre no Módulo 6 quanto sobra para o negócio.",
      comeca: "Some o dinheiro que você pode usar sem faltar para as contas da casa e registre no Módulo 6." },
    { chave: "aprender", re: /aprender a fazer/i, modulo: 1,
      vende: "Anote o passo a passo do que você faz, para repetir sempre do mesmo jeito.",
      comeca: "Faça 5 unidades de treino antes de vender, anotando o que deu certo e o que mudar." },
    { chave: "resposta", re: /tempo de resposta|responder|atendimento/i, modulo: 10,
      vende: "Separe dois horários por dia para responder aos clientes e anote, nesta semana, quanto tempo cada um esperou.",
      comeca: "Combine com você mesmo responder no mesmo dia e faça isso nas suas 5 primeiras conversas com clientes." },
    { chave: "divulgacao", re: /divulga|an[úu]ncio|propaganda|redes sociais|instagram|marketing|clientes novos/i, modulo: 10,
      vende: "Pergunte a cada cliente desta semana como ficou sabendo de você e anote: assim você vê qual divulgação funciona.",
      comeca: "Escolha um lugar para divulgar, mostre sua oferta lá nesta semana e anote quantas pessoas pedem informação." },
    { chave: "clientes", re: /conversar|possíveis clientes|problema (é )?real|ouvir|entrevist|cliente/i, modulo: 2,
      vende: "Pergunte a 5 clientes que já compram por que escolhem você e o que melhorariam; anote as respostas no Módulo 2.",
      comeca: "Converse com 5 possíveis clientes sobre o problema que você quer resolver e anote as respostas no Módulo 2." },
    { chave: "tempo", re: /tempo|n[ãa]o cabe|capacidade|produ[çc][ãa]o|agenda/i, modulo: 7,
      vende: "Anote nesta semana quanto tempo leva cada pedido e refaça a conta do tempo no Módulo 7.",
      comeca: "Faça uma unidade de teste marcando o tempo de cada etapa e coloque esse tempo no Módulo 7." },
    { chave: "teste", re: /teste|testar|confirma/i, modulo: 4,
      vende: "Defina no Módulo 4 quantos pedidos por semana mostram que vale continuar e compare com as vendas da semana.",
      comeca: "Defina no Módulo 4 quantas vendas-teste mostram que a ideia funciona (por exemplo, 5 em 2 semanas) e faça o teste." },
    { chave: "fornecedor", re: /fornecedor/i, modulo: 7,
      vende: "Peça preço a mais 2 fornecedores do que você mais compra e compare com o de hoje (Módulo 7).",
      comeca: "Antes da primeira compra, peça preço a pelo menos 3 fornecedores (Módulo 7)." },
    { chave: "qualidade", re: /qualidade|conferir .*entreg/i, modulo: 7,
      vende: "Faça uma lista curta do que conferir antes de cada entrega e use nos pedidos desta semana (Módulo 7).",
      comeca: "Monte uma lista curta do que conferir antes de entregar e use nas vendas-teste (Módulo 7)." },
    { chave: "formalizacao", re: /formaliz|cnpj|\bmei\b|nota fiscal|imposto/i, modulo: 8,
      vende: "Anote quanto você vende por mês e leve as dúvidas do Módulo 8 à Sala do Empreendedor da prefeitura ou a um contador.",
      comeca: "Veja no Módulo 8 o que muda no seu caso e tire as dúvidas na Sala do Empreendedor da prefeitura antes de abrir o CNPJ." },
    { chave: "socio", re: /s[óo]cio/i, modulo: 10,
      vende: "Escreva com seu sócio quem faz o quê, quanto cada um coloca e como dividem o resultado (use o checklist deste módulo).",
      comeca: "Antes de investir junto, escreva com seu sócio quem faz o quê, quanto cada um coloca e como dividem o resultado (use o checklist deste módulo)." },
    { chave: "responsavel", re: /quem cuida/i, modulo: 10,
      vende: "Escolha quem vai cuidar das etapas que estão sem responsável e combine os horários desta semana.",
      comeca: "Escolha quem vai cuidar das etapas que estão sem responsável antes das vendas-teste." },
    { chave: "vendas", re: /vend[ae]|pedidos/i, modulo: null,
      vende: "Anote as vendas da semana: quantas, de quê, por quanto e por onde chegou cada pedido.",
      comeca: "Faça 5 vendas-teste com vizinhos, amigos ou colegas e anote o preço, o que acharam e se comprariam de novo." },
  ];
  /* quando faltam ações: as do estágio (organizar e melhorar / testar) */
  const PADRAO = {
    vende: [
      { chave: "vendas", texto: "Anote as vendas da semana: quantas, de quê, por quanto e por onde chegou cada pedido.", modulo: null },
      { chave: "opiniao", texto: "Peça a opinião de 3 clientes desta semana e anote o que eles melhorariam.", modulo: null },
      { chave: "revisar", texto: "Daqui a um mês, volte a este resultado e compare: você vendeu mais, igual ou menos?", modulo: null },
    ],
    comeca: [
      { chave: "vendas", texto: "Faça 5 vendas-teste com vizinhos, amigos ou colegas e anote o preço, o que acharam e se comprariam de novo.", modulo: null },
      { chave: "opiniao", texto: "Pergunte a cada pessoa do teste se compraria de novo e quanto pagaria.", modulo: null },
      { chave: "revisar", texto: "Depois das vendas-teste, volte ao Módulo 5 e confira se o preço cobre o custo.", modulo: 5 },
    ],
  };
  const temaDe = (t) => TEMAS.find((x) => x.re.test(String(t || "")));
  const semModulo = (t) => String(t || "").replace(/\s*\(Módulo \d+\)\s*$/, "").trim();
  const moduloNo = (t) => { const m = /Módulo (\d+)/.exec(String(t || "")); return m ? +m[1] : null; };
  /* e = { estagio: "vende"|"comeca"|null, prioridades: [texto], conferir: [{chave, detalhe, modulo}], lacunas: [{tema, gravidade, modulo}] }
     → [{ chave, texto, detalhe, modulo, origem: "prioridade"|"conferir"|"lacuna"|"estagio" }] */
  function porOndeComecar(e) {
    e = e || {};
    const est = e.estagio === "vende" ? "vende" : "comeca";
    const out = [], usadas = new Set();
    const conf = (e.conferir || []).filter((c) => c && c.chave);
    const detalheDe = (ch) => { const c = conf.find((x) => x.chave === ch); return c ? c.detalhe || "" : ""; };
    const add = (a) => { if (out.length >= POR_ONDE || usadas.has(a.chave)) return; usadas.add(a.chave); out.push(a); };
    const doTema = (tm, origem, detalhe) => ({ chave: tm.chave, texto: tm[est], detalhe: detalhe || detalheDe(tm.chave), modulo: tm.modulo, origem });
    /* 1) prioridades da pessoa */
    (e.prioridades || []).forEach((p) => {
      const tm = temaDe(p);
      if (tm) return add(doTema(tm, "prioridade"));
      const t = semModulo(p), n = moduloNo(p);
      if (!t) return;
      add({ chave: "p:" + t.toLowerCase(), texto: n ? `Volte ao Módulo ${n} e resolva: ${t.charAt(0).toLowerCase() + t.slice(1)}.` : `Comece por: ${t.charAt(0).toLowerCase() + t.slice(1)}. Escreva o que vai fazer e até quando, e confira o resultado nessa data.`, detalhe: "", modulo: n, origem: "prioridade" });
    });
    /* 2) pontos para conferir */
    conf.forEach((c) => { const tm = TEMAS.find((x) => x.chave === c.chave); if (tm) add(doTema(tm, "conferir", c.detalhe)); });
    /* 3) lacunas graves (alta, depois média) */
    ["alta", "media"].forEach((g) => (e.lacunas || []).filter((x) => x && x.gravidade === g).forEach((l) => {
      const tm = temaDe(l.tema);
      if (tm) return add(doTema(tm, "lacuna"));
      add({ chave: "l:" + String(l.tema).toLowerCase(), texto: `${semModulo(l.tema)}${l.modulo && l.modulo < 10 ? ` (Módulo ${l.modulo})` : ""}.`, detalhe: "", modulo: l.modulo || null, origem: "lacuna" });
    }));
    /* 4) ações gerais do estágio */
    PADRAO[est].forEach((a) => add(Object.assign({ detalhe: "", origem: "estagio" }, a)));
    return out;
  }

  const M = { POR_ONDE, TEMAS, estagioDe, porOndeComecar, META_ALTA, PRECO_ALTO, UNIDADES, UNIDADES_PLANO, LIMITE_LISTA, LIMITE_PRIORIDADES, PRAZO_LONGO, URGENCIA, prioridades, limitar, tresPrimeiras, ordenarPorUrgencia, avaliarData, dataBR, somarDias, frasePlano, num, fmt };
  if (typeof module !== "undefined" && module.exports) module.exports = M;
  raiz.Motor10 = M;
})(typeof window !== "undefined" ? window : globalThis);
