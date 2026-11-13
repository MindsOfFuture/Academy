/* Jornada completa do Laboratório de Gestão.
   Abre na "Sua trilha": um caminho com as 10 etapas (os módulos publicados, as mesmas páginas das turmas).
   Tocar numa etapa abre o módulo dentro da página; o botão "Trilha" no topo volta ao caminho.
   Quando o módulo chega ao resultado (a tela que mostra a caixa do próximo módulo), a etapa conta como concluída;
   o botão dessa caixa mostra a tela "Etapa N concluída!" com o convite para a próxima, em vez de pular direto.
   Com TRAVAR = true, uma etapa só libera quando a anterior foi concluída; com TRAVAR = false, todas ficam abertas.
   Antes de abrir qualquer coisa, espera a cópia do progresso guardada na conta (js/progresso.js). */
(function () {
  'use strict';

  var TRAVAR = false; // false = todos os módulos liberados (fase de validação); mude para true para voltar a travar em ordem.

  // Ordem da jornada. caminho null = módulo ainda não entregue ("em breve"), não trava os seguintes.
  // Precisa bater com PRONTOS em components/modules/laboratorio-gestao/turmas.ts (há teste).
  var MODULOS = [
    { n: 1, nome: 'Perfil do empreendedor e definição da ideia', caminho: '/lg2/turma-a/m01/index.html' },
    { n: 2, nome: 'Clientes, necessidades e comportamento de compra', caminho: '/lg2/turma-b/m02/index.html' },
    { n: 3, nome: 'Mercado, concorrentes e oportunidades', caminho: '/lg2/turma-a/m03/index.html' },
    { n: 4, nome: 'Produto, proposta de valor e teste da ideia', caminho: '/lg2/turma-a/m04/index.html' },
    { n: 5, nome: 'Custos, despesas, preço e margem', caminho: '/lg2/turma-a/m05/index.html' },
    { n: 6, nome: 'Investimento, capital de giro e fluxo de caixa', caminho: '/lg2/turma-b/m06/index.html' },
    { n: 7, nome: 'Operação, fornecedores, capacidade e qualidade', caminho: '/lg2/turma-b/m07/index.html' },
    { n: 8, nome: 'Formalização, enquadramento e tributação básica', caminho: '/lg2/turma-b/m08/index.html' },
    { n: 9, nome: 'Licenças, endereço e atividades reguladas', caminho: '/lg2/turma-b/m09/index.html' },
    { n: 10, nome: 'Comunicação, vendas, pessoas e plano de ação', caminho: '/lg2/turma-b/m10/index.html' }
  ];
  var CHAVE = 'lg2-jornada';
  var TOTAL = MODULOS.length;
  var prontos = MODULOS.filter(function (m) { return m.caminho; });
  var ZIGUE = [0, 0.7, 1, 0.7, 0, -0.7, -1, -0.7]; // desenho do caminho: deslocamento de cada etapa para os lados

  function ler() {
    try {
      var s = JSON.parse(localStorage.getItem(CHAVE) || 'null');
      if (s && s.v === 1 && Array.isArray(s.feitos)) return s;
    } catch (e) {}
    return { v: 1, feitos: [], atual: null };
  }
  var estado = ler();
  function gravar() { try { localStorage.setItem(CHAVE, JSON.stringify(estado)); } catch (e) {} }

  function feito(n) { return estado.feitos.indexOf(n) >= 0; }
  // Liberado = sem trava, primeiro pronto, ou o pronto anterior já foi concluído.
  function liberado(n) {
    var i = prontos.findIndex(function (m) { return m.n === n; });
    if (!TRAVAR) return i >= 0;
    return i === 0 || (i > 0 && feito(prontos[i - 1].n));
  }
  function proximoPronto(n) {
    var i = prontos.findIndex(function (m) { return m.n === n; });
    return prontos[i + 1] || null;
  }
  function primeiroPendente() {
    var p = prontos.find(function (m) { return !feito(m.n); });
    return p ? p.n : null;
  }
  function moduloPorCaminho(caminho) {
    return prontos.find(function (m) { return m.caminho === caminho; }) || null;
  }
  function modulo(n) { return MODULOS.find(function (x) { return x.n === n; }) || null; }
  function quantosFeitos() { return prontos.filter(function (m) { return feito(m.n); }).length; }
  function anteriorPronto(n) { return prontos[prontos.findIndex(function (x) { return x.n === n; }) - 1] || null; }

  var iframe = document.getElementById('modulo');
  var trilha = document.getElementById('trilha');
  var telaTrilha = document.getElementById('trilha-tela');
  var telaConcluida = document.getElementById('concluida');
  var aviso = document.getElementById('aviso');
  var fim = document.getElementById('fim');
  var voltaTrilha = document.getElementById('volta-trilha');
  var logoTopo = document.getElementById('logo-topo');
  var topoKicker = document.getElementById('topo-kicker');
  var topoTitulo = document.getElementById('topo-titulo');
  var vista = null; // 'trilha' | 'modulo' | 'concluida' | 'fim'

  // Respostas que o módulo guardou: serve para saber se a pessoa já começou a etapa.
  function lerModulo(n) {
    var R = window.ResumoNegocio;
    try { return R && R.lerLocal ? R.lerLocal(n) : null; } catch (e) { return null; }
  }
  function comecou(n) {
    var s = lerModulo(n);
    return !!(s && ((s.R && typeof s.R === 'object' && Object.keys(s.R).length) || s.ini));
  }
  function andamento(m) {
    if (!m.caminho) return 'breve';
    if (feito(m.n)) return 'feito';
    return comecou(m.n) ? 'andamento' : 'nada';
  }
  // Situação da etapa no caminho.
  function situacao(m) {
    if (!m.caminho) return 'breve';
    if (feito(m.n)) return 'feito';
    if (!liberado(m.n)) return 'bloqueado';
    return comecou(m.n) ? 'andamento' : 'nada';
  }
  // Etapa sugerida: a que a pessoa estava fazendo (se ainda não concluiu) ou a primeira que falta.
  function sugerida() {
    if (estado.atual && !feito(estado.atual) && modulo(estado.atual) && modulo(estado.atual).caminho && liberado(estado.atual)) return estado.atual;
    return primeiroPendente();
  }

  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt !== undefined) e.textContent = txt; return e; }

  // ---------- Topo ----------
  function topo(kicker, titulo, comVolta) {
    topoKicker.textContent = kicker;
    topoTitulo.textContent = titulo;
    voltaTrilha.hidden = !comVolta;
    logoTopo.hidden = !!comVolta;
  }

  function progresso(alvoTexto, alvoBarra) {
    var f = quantosFeitos();
    alvoTexto.textContent = '';
    alvoTexto.appendChild(el('b', '', String(f)));
    alvoTexto.appendChild(document.createTextNode(' de ' + TOTAL + ' etapas'));
    alvoBarra.style.width = Math.round((f / TOTAL) * 100) + '%';
    alvoBarra.parentNode.setAttribute('aria-valuenow', String(f));
    alvoBarra.parentNode.setAttribute('aria-valuetext', f + ' de ' + TOTAL + ' etapas concluídas');
  }

  // ---------- Trilha ----------
  function desenhar() {
    var sug = sugerida();
    trilha.textContent = '';
    MODULOS.forEach(function (m, i) {
      var s = situacao(m);
      var li = el('li', 'etapa ' + s + (m.n === sug ? ' sugerida' : ''));
      li.setAttribute('data-n', m.n);
      li.setAttribute('data-estado', s);
      li.style.setProperty('--o', ZIGUE[i % ZIGUE.length]);
      if (m.n === sug) {
        var bolha = el('button', 'bolha', s === 'andamento' ? 'Continuar' : 'Começar');
        bolha.type = 'button';
        bolha.setAttribute('aria-label', (s === 'andamento' ? 'Continuar' : 'Começar') + ' a etapa ' + m.n);
        bolha.addEventListener('click', function () { tocar(m); });
        li.appendChild(bolha);
      }
      var b = el('button', 'no-btn');
      b.type = 'button';
      var rotulo = { feito: 'concluída', andamento: 'em andamento', nada: 'não começada', bloqueado: 'ainda fechada', breve: 'em breve' }[s];
      b.setAttribute('aria-label', 'Etapa ' + m.n + ': ' + m.nome + ' (' + rotulo + ')');
      if (m.n === sug) b.setAttribute('aria-current', 'step');
      var no = el('span', 'no');
      no.setAttribute('aria-hidden', 'true');
      if (s !== 'feito') no.appendChild(el('span', 'no-num', String(m.n)));
      b.appendChild(no);
      var txt = el('span', 'rotulo');
      txt.setAttribute('aria-hidden', 'true');
      txt.appendChild(el('span', 'etapa-n', 'Etapa ' + m.n));
      txt.appendChild(el('span', 'etapa-nome', m.nome));
      if (s === 'andamento') txt.appendChild(el('span', 'chip', 'Em andamento'));
      b.appendChild(txt);
      b.addEventListener('click', function () { tocar(m); });
      li.appendChild(b);
      trilha.appendChild(li);
    });
    progresso(document.getElementById('trilha-prog-texto'), document.getElementById('trilha-prog-barra'));
    linhas();
  }

  // Linha curva que liga as etapas (desenhada depois que as bolinhas estão no lugar).
  var SVGNS = 'http://www.w3.org/2000/svg';
  function linhas() {
    if (telaTrilha.hidden) return;
    var velho = trilha.querySelector('svg.linha');
    if (velho) velho.remove();
    var nos = [].slice.call(trilha.querySelectorAll('.no'));
    if (nos.length < 2) return;
    var base = trilha.getBoundingClientRect();
    var pts = nos.map(function (n) {
      var r = n.getBoundingClientRect();
      return { x: r.left - base.left + r.width / 2, y: r.top - base.top + r.height / 2 };
    });
    var svg = document.createElementNS(SVGNS, 'svg');
    svg.setAttribute('class', 'linha');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('width', String(base.width));
    svg.setAttribute('height', String(base.height));
    for (var i = 0; i < pts.length - 1; i++) {
      var a = pts[i], z = pts[i + 1], my = (a.y + z.y) / 2;
      var p = document.createElementNS(SVGNS, 'path');
      p.setAttribute('d', 'M' + a.x + ' ' + a.y + ' C' + a.x + ' ' + my + ' ' + z.x + ' ' + my + ' ' + z.x + ' ' + z.y);
      var ok = feito(MODULOS[i].n) && feito(MODULOS[i + 1].n);
      p.setAttribute('class', ok ? 'feita' : 'falta');
      svg.appendChild(p);
    }
    trilha.insertBefore(svg, trilha.firstChild);
  }
  var redesenho = null;
  window.addEventListener('resize', function () { clearTimeout(redesenho); redesenho = setTimeout(linhas, 120); });

  function tocar(m) {
    if (!m.caminho) { aviso.textContent = 'A Etapa ' + m.n + ' ainda está sendo preparada.'; return; }
    if (!liberado(m.n) && !feito(m.n)) {
      var ant = anteriorPronto(m.n);
      aviso.textContent = 'Conclua a Etapa ' + ant.n + ' para liberar a Etapa ' + m.n + '.';
      return;
    }
    abrir(m.n);
  }

  // ---------- Trocas de tela ----------
  var vigia = null;
  function esconderTudo(manterModulo) {
    telaTrilha.hidden = true; telaConcluida.hidden = true; fim.hidden = true;
    if (!manterModulo) {
      clearInterval(vigia);
      iframe.hidden = true;
      if (iframe.getAttribute('src') && iframe.getAttribute('src') !== 'about:blank') iframe.setAttribute('src', 'about:blank');
    }
  }
  function mostrarTrilha() {
    esconderTudo();
    vista = 'trilha';
    aviso.textContent = '';
    topo('Laboratório de Gestão', 'Sua trilha', false);
    telaTrilha.hidden = false;
    desenhar();
    var alvo = trilha.querySelector('.sugerida');
    var palco = document.querySelector('.palco');
    palco.scrollTop = 0;
    if (alvo && alvo.getBoundingClientRect().bottom > window.innerHeight) {
      palco.scrollTop = Math.max(0, alvo.offsetTop - 120);
    }
  }

  function abrir(n) {
    var m = modulo(n);
    estado.atual = n; gravar();
    esconderTudo(vista === 'modulo');
    vista = 'modulo';
    iframe.hidden = false;
    aviso.textContent = feito(n) ? 'Etapa concluída. Pode rever e mudar suas respostas.' : '';
    topo('Etapa ' + m.n + ' de ' + TOTAL, m.nome, true);
    if (iframe.getAttribute('src') !== m.caminho) iframe.setAttribute('src', m.caminho);
  }

  function concluir(n) {
    if (!feito(n)) {
      estado.feitos.push(n); gravar();
      if (vista === 'modulo') aviso.textContent = 'Etapa ' + n + ' concluída!';
    }
  }

  // Depois de tocar no botão do fim do módulo: comemora e convida para a próxima etapa.
  function celebrar(n) {
    var proxima = proximoPronto(n);
    if (!proxima || feito(proxima.n)) { var p = primeiroPendente(); proxima = p ? modulo(p) : null; }
    if (!proxima || !primeiroPendente()) { mostrarFim(); return; }
    esconderTudo();
    vista = 'concluida';
    aviso.textContent = '';
    topo('Laboratório de Gestão', 'Sua trilha', true);
    document.getElementById('conc-titulo').textContent = 'Etapa ' + n + ' concluída!';
    progresso(document.getElementById('conc-prog-texto'), document.getElementById('conc-prog-barra'));
    var mini = document.getElementById('conc-mini');
    mini.textContent = '';
    MODULOS.forEach(function (m) {
      var li = el('li', feito(m.n) ? 'feito' : m.n === proxima.n ? 'proxima' : '');
      li.setAttribute('aria-hidden', 'true');
      mini.appendChild(li);
    });
    var s = situacao(proxima);
    var bt = document.getElementById('conc-proxima');
    bt.textContent = (s === 'andamento' ? 'Continuar' : 'Começar') + ' a etapa ' + proxima.n;
    bt.onclick = function () { abrir(proxima.n); };
    document.getElementById('conc-nome').textContent = proxima.nome;
    // Reinicia a animação a cada etapa concluída.
    var festa = telaConcluida.querySelector('.festa');
    festa.classList.remove('anima'); void festa.offsetWidth; festa.classList.add('anima');
    telaConcluida.hidden = false;
    document.querySelector('.palco').scrollTop = 0;
    document.getElementById('conc-titulo').focus();
  }

  function mostrarFim() {
    esconderTudo();
    vista = 'fim';
    estado.atual = null; gravar();
    aviso.textContent = '';
    topo('Laboratório de Gestão', 'Jornada concluída', true);
    fim.hidden = false;
    mostrarResumo();
  }

  voltaTrilha.addEventListener('click', mostrarTrilha);
  document.getElementById('conc-trilha').addEventListener('click', mostrarTrilha);
  document.getElementById('fim-trilha').addEventListener('click', mostrarTrilha);

  // Resumo do negócio no fim da jornada: texto montado com as respostas dos módulos (só leitura).
  var jornadaAvisada = false;
  function mostrarResumo() {
    if (!jornadaAvisada) {
      jornadaAvisada = true;
      try { if (window.LG2Metricas) window.LG2Metricas.enviar('lg2_journey_completed', '/lg2/jornada', {}); } catch { /* sem métricas */ }
    }
    var caixa = document.getElementById('resumo-negocio');
    var frases = [];
    try {
      var R = window.ResumoNegocio;
      frases = R ? (R.paragrafos ? R.paragrafos() : [R.frases().join(' ')]) : [];
    } catch (e) { frases = []; }
    frases = frases.filter(Boolean);
    var alvo = document.getElementById('resumo-texto');
    alvo.textContent = '';
    frases.forEach(function (t) { var p = document.createElement('p'); p.textContent = t; alvo.appendChild(p); });
    caixa.hidden = !frases.length;
  }

  // Painel "Seu negócio até aqui": o resumo e o estado de cada módulo, a qualquer momento da jornada.
  // Só lê as respostas guardadas neste aparelho; é montado de novo cada vez que abre.
  var painel = document.getElementById('painel');
  var abrePainel = document.getElementById('abre-painel');
  var fechaPainel = document.getElementById('fecha-painel');
  function montarPainel() {
    var pars = [];
    try {
      var R = window.ResumoNegocio;
      pars = R ? (R.paragrafos ? R.paragrafos() : [R.frases().join(' ')]) : [];
    } catch (e) { pars = []; }
    pars = pars.filter(Boolean);
    var algum = estado.feitos.length > 0 || prontos.some(function (m) { return comecou(m.n); });
    var alvo = document.getElementById('painel-resumo');
    alvo.textContent = '';
    if (pars.length) {
      pars.forEach(function (t) { var p = document.createElement('p'); p.textContent = t; alvo.appendChild(p); });
    } else {
      var v = document.createElement('p'); v.className = 'vazio';
      v.textContent = algum
        ? 'Ainda não dá para montar o resumo. Continue respondendo os módulos e ele vai aparecer aqui.'
        : 'Você ainda não respondeu nenhuma pergunta. Comece pelo Módulo 1 e o resumo do seu negócio vai aparecer aqui.';
      alvo.appendChild(v);
    }
    document.getElementById('painel-nota').hidden = !pars.length;
    var lista = document.getElementById('painel-lista');
    lista.textContent = '';
    MODULOS.forEach(function (m) {
      var st = andamento(m);
      var li = document.createElement('li');
      li.setAttribute('data-modulo', m.n);
      var nome = document.createElement('span'); nome.className = 'mod-nome';
      var b = document.createElement('b'); b.textContent = 'Módulo ' + m.n;
      nome.appendChild(b); nome.appendChild(document.createTextNode(' · ' + m.nome));
      li.appendChild(nome);
      var chip = document.createElement('span'); chip.className = 'estado ' + st;
      chip.textContent = { feito: 'Feito', andamento: 'Em andamento', nada: 'Não começado', breve: 'Em breve' }[st];
      li.appendChild(chip);
      if (m.caminho && (liberado(m.n) || feito(m.n))) {
        var bt = document.createElement('button'); bt.type = 'button'; bt.className = 'revisar';
        var rever = st !== 'nada';
        bt.textContent = rever ? 'Abrir para revisar' : 'Abrir';
        bt.setAttribute('aria-label', 'Abrir o Módulo ' + m.n + (rever ? ' para revisar' : ''));
        bt.addEventListener('click', function () { fecharPainel(); abrir(m.n); });
        li.appendChild(bt);
      } else if (m.caminho) {
        var ant = anteriorPronto(m.n);
        var t = document.createElement('span'); t.className = 'trava';
        t.textContent = 'Abre depois do Módulo ' + ant.n;
        li.appendChild(t);
      }
      lista.appendChild(li);
    });
  }
  // Diagnóstico final: cenário atual + todas as respostas, módulo por módulo (js/diagnostico.js).
  var diag = document.getElementById('diagnostico');
  var diagOrigem = null;
  function situacaoDiag(m) { var a = andamento(m); return a === 'feito' ? 'feito' : a === 'andamento' ? 'andamento' : 'nada'; }
  function montarDiagnostico() {
    var D = window.DiagnosticoLG2;
    var corpo = document.getElementById('diag-corpo');
    corpo.textContent = '';
    corpo.setAttribute('aria-busy', 'true');
    var data = new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
    document.getElementById('diag-data').textContent = 'Situação em ' + data;
    D.carregarDados(prontos, function () {
      corpo.textContent = '';
      var mods = prontos.map(function (m) { return { n: m.n, nome: m.nome, caminho: m.caminho, situacao: situacaoDiag(m) }; });
      var r = D.montar(mods, function (n) { return window['MODULO' + n] || null; });
      // Como está o seu negócio hoje
      var s1 = el('section', 'diag-secao diag-cenario');
      s1.appendChild(el('h2', '', 'Como está o seu negócio hoje'));
      var pars = [];
      try { var RN = window.ResumoNegocio; pars = RN ? (RN.paragrafos ? RN.paragrafos() : [RN.frases().join(' ')]) : []; } catch (e) { pars = []; }
      pars = pars.filter(Boolean);
      if (pars.length) pars.forEach(function (t) { s1.appendChild(el('p', '', t)); });
      else s1.appendChild(el('p', 'diag-vazio', 'Ainda não dá para montar o resumo. Continue respondendo os módulos e ele vai aparecer aqui.'));
      s1.appendChild(el('div', 'diag-rodape-nota', 'Este retrato organiza o que você informou; não verifica os dados nem garante resultados. Confirme informações fiscais, jurídicas e de licenças com fontes oficiais ou profissionais da área.'));
      corpo.appendChild(s1);
      // Pontos em aberto
      var s2 = el('section', 'diag-secao diag-abertos');
      s2.appendChild(el('h2', '', 'Pontos em aberto'));
      s2.appendChild(el('p', 'diag-nota', 'Aqui aparecem as perguntas que você marcou “Não sei”. Volte ao módulo para usar a ajuda “Como descobrir” e atualizar a resposta.'));
      if (r.abertos.length) {
        var ul = el('ul', 'diag-lista-abertos');
        r.abertos.forEach(function (a) {
          var li = el('li');
          li.appendChild(el('span', 'diag-q', a.pergunta));
          li.appendChild(el('span', 'diag-mod', 'Módulo ' + a.modulo));
          var rever = el('button', 'diag-rever', 'Rever Módulo ' + a.modulo);
          rever.type = 'button';
          rever.addEventListener('click', function () { fecharDiagnostico(); abrir(a.modulo); });
          li.appendChild(rever);
          ul.appendChild(li);
        });
        s2.appendChild(ul);
      } else s2.appendChild(el('p', 'diag-vazio', 'Nenhuma pergunta ficou com “Não sei”.'));
      corpo.appendChild(s2);
      // Orientação final baseada no progresso e nas respostas disponíveis.
      var s3 = el('section', 'diag-secao diag-proximo');
      s3.appendChild(el('h2', '', 'Seu próximo passo'));
      if (r.abertos.length) {
        s3.appendChild(el('p', '', 'Comece por um ponto em aberto acima. Toque em “Rever Módulo”, use a ajuda “Como descobrir” e atualize a resposta quando confirmar. Depois, salve seu progresso.'));
      } else {
        var pendente = mods.find(function (m) { return m.situacao === 'andamento'; }) || mods.find(function (m) { return m.situacao === 'nada'; });
        if (pendente) {
          s3.appendChild(el('p', '', 'Continue pelo primeiro módulo que está em andamento ou ainda não começou. Ao concluir, volte ao retrato para revisar as respostas.'));
          var continuar = el('button', 'diag-rever', 'Continuar Módulo ' + pendente.n);
          continuar.type = 'button';
          continuar.addEventListener('click', function () { fecharDiagnostico(); abrir(pendente.n); });
          s3.appendChild(continuar);
        } else {
          s3.appendChild(el('p', '', 'Seu retrato está completo. Antes de tomar decisões legais, fiscais ou sobre licenças, confira as fontes oficiais. Depois, teste uma mudança pequena e atualize as respostas com o que observar.'));
        }
      }
      corpo.appendChild(s3);
      // Um bloco por módulo
      var s4 = el('section', 'diag-secao diag-respostas');
      s4.appendChild(el('h2', '', 'Suas respostas, módulo por módulo'));
      r.blocos.forEach(function (b) {
        var art = el('article', 'diag-modulo');
        art.setAttribute('data-modulo', b.n);
        var cab = el('div', 'diag-mod-topo');
        var h = el('h3');
        h.appendChild(el('b', '', 'Módulo ' + b.n));
        h.appendChild(document.createTextNode(' · ' + b.nome));
        cab.appendChild(h);
        cab.appendChild(el('span', 'diag-estado ' + b.situacao, { feito: 'concluído', andamento: 'em andamento', nada: 'não começou' }[b.situacao]));
        art.appendChild(cab);
        if (b.itens.length) {
          var dl = el('dl', 'diag-itens');
          b.itens.forEach(function (it) {
            var linha = el('div', 'diag-item' + (it.resposta === 'Não sei' ? ' naosei' : ''));
            linha.appendChild(el('dt', '', it.pergunta));
            linha.appendChild(el('dd', '', it.resposta));
            dl.appendChild(linha);
          });
          art.appendChild(dl);
        } else art.appendChild(el('p', 'diag-vazio', 'Nenhuma resposta ainda.'));
        s4.appendChild(art);
      });
      corpo.appendChild(s4);
      corpo.removeAttribute('aria-busy');
    });
  }
  function abrirDiagnostico(ev) {
    diagOrigem = ev && ev.currentTarget && ev.currentTarget !== window ? ev.currentTarget : null;
    if (!painel.hidden) { painel.hidden = true; diagOrigem = abrePainel; }
    montarDiagnostico();
    diag.hidden = false;
    document.body.classList.add('com-diagnostico');
    diag.scrollTop = 0;
    document.getElementById('fecha-diag').focus();
  }
  function fecharDiagnostico() {
    if (diag.hidden) return;
    diag.hidden = true;
    document.body.classList.remove('com-diagnostico');
    if (diagOrigem && diagOrigem.focus) diagOrigem.focus();
  }
  document.getElementById('ver-diag-fim').addEventListener('click', abrirDiagnostico);
  document.getElementById('ver-diag-painel').addEventListener('click', abrirDiagnostico);
  document.getElementById('fecha-diag').addEventListener('click', fecharDiagnostico);
  document.getElementById('imprime-diag').addEventListener('click', function () { window.print(); });

  function abrirPainel() {
    montarPainel();
    painel.hidden = false;
    painel.querySelector('.painel-corpo').scrollTop = 0;
    fechaPainel.focus();
  }
  function fecharPainel() {
    if (painel.hidden) return;
    painel.hidden = true;
    abrePainel.focus();
  }
  abrePainel.addEventListener('click', abrirPainel);
  fechaPainel.addEventListener('click', fecharPainel);
  painel.addEventListener('click', function (ev) { if (ev.target === painel) fecharPainel(); });
  document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape') { if (!diag.hidden) fecharDiagnostico(); else fecharPainel(); } });

  // O resultado de cada módulo tem a caixa ".lg2-proximo". Quando ela aparece, o módulo está concluído.
  // O botão dela ("Ir para o Módulo N" / "Voltar aos módulos") passa a mostrar a tela de etapa concluída.
  iframe.addEventListener('load', function () {
    clearInterval(vigia);
    if (iframe.hidden) return;
    var doc, caminho;
    try { doc = iframe.contentDocument; caminho = iframe.contentWindow.location.pathname; } catch (e) { return; }
    if (!doc || !caminho || caminho === 'blank') return;
    var m = moduloPorCaminho(caminho);
    if (!m || (!liberado(m.n) && !feito(m.n))) {
      // Saiu da jornada ou tentou pular um módulo: volta ao módulo atual.
      var volta = estado.atual || primeiroPendente() || prontos[0].n;
      iframe.setAttribute('src', modulo(volta).caminho);
      return;
    }
    if (estado.atual !== m.n) { estado.atual = m.n; gravar(); topo('Etapa ' + m.n + ' de ' + TOTAL, m.nome, true); }
    doc.addEventListener('keydown', function (ev) { if (ev.key === 'Escape') { fecharDiagnostico(); fecharPainel(); } });
    doc.addEventListener('click', function (ev) {
      var a = ev.target && ev.target.closest && ev.target.closest('.lg2-proximo a');
      if (!a) return;
      ev.preventDefault();
      concluir(m.n);
      celebrar(m.n);
    }, true);
    // Só conta quando a caixa está à vista: o Módulo 7, por exemplo, só mostra o botão do
    // próximo módulo quando a pessoa responde "Sim, pode seguir".
    var olhar = function () {
      var c = doc.querySelector('.lg2-proximo');
      if (c && !c.closest('[hidden]') && c.getClientRects().length > 0) concluir(m.n);
    };
    olhar();
    vigia = setInterval(olhar, 600);
  });

  // Começa depois de trazer o progresso guardado na conta (no máximo alguns segundos).
  aviso.textContent = 'Carregando seu progresso…';
  var sync = window.LG2Progresso && window.LG2Progresso.pronto ? window.LG2Progresso.pronto : Promise.resolve(false);
  sync.catch(function () { return false; }).then(function () {
    estado = ler();
    if (prontos.length && prontos.every(function (m) { return feito(m.n); })) mostrarFim();
    else mostrarTrilha();
  });
})();
