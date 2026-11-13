/* Padrão único das etapas do Laboratório de Gestão.
   O MESMO arquivo vai em todos os módulos (tests/unit/lg2/padrao.test.ts confere).
   Uso no index.html, antes do app.js:
     <script src="dados/fontes.js"></script>
     <script src="js/progresso.js" data-recarregar></script>
     <script src="js/padrao.js" data-etapa="N"></script>
   O app de cada módulo monta as telas com:
     LG2Padrao.topo({ passo, progresso, titulo, trilha, voltar, capa })  -> cabeçalho (texto HTML)
     LG2Padrao.rodape()                                                   -> rodapé com fontes, versão, aviso e logos
     LG2Padrao.definir({ voltar: fn, inicio: fn })                        -> o que Voltar e Início fazem nesta tela
   O botão "Salvar e sair" e o "Ouvir" funcionam sozinhos.
   Regras do padrão: letra de 16 px ou mais; rodapé (fontes, aviso, logos) na capa, nas telas de apoio
   e no resultado, não nas perguntas. */
(function () {
  'use strict';
  var eu = document.currentScript;
  var ETAPA = Number(eu && eu.getAttribute('data-etapa')) || 0;
  var TOTAL = 10;
  var TRILHA = '/lg2/jornada/index.html';
  var NOMES = {
    1: 'Perfil do empreendedor e definição da ideia',
    2: 'Clientes, necessidades e comportamento de compra',
    3: 'Mercado, concorrentes e oportunidades',
    4: 'Produto, proposta de valor e teste da ideia',
    5: 'Custos, despesas, preço e margem',
    6: 'Investimento, capital de giro e fluxo de caixa',
    7: 'Operação, fornecedores, capacidade e qualidade',
    8: 'Formalização, enquadramento e tributação básica',
    9: 'Licenças, endereço e atividades reguladas',
    10: 'Comunicação, vendas, pessoas e plano de ação'
  };
  var AVISO = 'Este app é educativo: estimativas não garantem resultados. Confirme regras de registro, impostos e licenças em fontes oficiais.';
  var CREDITO = 'Laboratório de Gestão II · FACC/UFJF';

  var esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; });
  };

  // Dentro da jornada a moldura já mostra "Trilha" e "Salvar e sair": o módulo esconde a linha de cima.
  var naJornada = (function () {
    try { return window.parent !== window && /\/lg2\/jornada\//.test(window.parent.location.pathname); } catch (e) { return false; }
  })();
  if (naJornada) document.documentElement.classList.add('p-na-jornada');

  var acoes = { voltar: null, inicio: null };
  function definir(o) { acoes.voltar = (o && o.voltar) || null; acoes.inicio = (o && o.inicio) || null; }

  function nome() { return NOMES[ETAPA] || ''; }
  function rotulo() { return 'Etapa ' + ETAPA + ' de ' + TOTAL; }

  /* Cabeçalho padrão.
     o.capa      true na tela inicial do módulo (faixa grande, sem Voltar)
     o.titulo    título grande da faixa (capa, resultado, telas de apoio); na pergunta fica vazio
     o.passo     texto visível de etapa da tela, como "Resultado" (classe .passo)
     o.contador  "Pergunta 3 de 14": não aparece (a tela mostra só a barra, como pediu a coordenação),
                 mas vai no atributo data-passo da faixa e no texto lido pelo leitor de tela da barra
     o.progresso 0 a 100 (barra amarela) ou null
     o.trilha    texto extra depois de "Etapa N" na linha de cima
     o.voltar    false para esconder o Voltar (padrão: mostra, menos na capa)
     o.extra     HTML extra no fim da faixa (ex.: botão de recomeçar do módulo) */
  function topo(o) {
    o = o || {};
    var voltar = o.voltar === undefined ? !o.capa : !!o.voltar;
    var p = typeof o.progresso === 'number' ? Math.max(0, Math.min(100, Math.round(o.progresso))) : null;
    return '<div class="p-cabeca">' +
      '<div class="p-linha">' +
        '<img class="p-logo" src="assets/minds.svg" alt="Minds of the Future">' +
        '<nav class="p-trilha" aria-label="Você está em">' +
          '<button type="button" class="p-link" data-p-inicio>Início</button><span aria-hidden="true">/</span><span>Etapa ' + ETAPA + '</span>' +
          (o.trilha ? '<span aria-hidden="true">/</span><span>' + esc(o.trilha) + '</span>' : '') +
        '</nav>' +
        '<button type="button" class="p-salvar" data-p-salvar>Salvar e sair</button>' +
      '</div>' +
      '<header class="p-faixa' + (o.capa ? ' p-capa' : '') + (o.titulo ? '' : ' p-compacta') + '"' + (o.contador ? ' data-passo="' + esc(o.contador) + '"' : '') + '>' +
        '<div class="p-acoes">' +
          (voltar ? '<button type="button" class="p-voltar voltar" data-p-voltar><span aria-hidden="true">‹ </span>Voltar</button>' : '<span></span>') +
          (fala ? '<button type="button" class="p-ouvir" data-p-ouvir aria-pressed="false">' + ICO_OUVIR + '<span>Ouvir</span></button>' : '') +
        '</div>' +
        '<p class="p-kicker" data-ler>' + esc(rotulo()) + ' · ' + esc(nome()) + '</p>' +
        (o.titulo ? (o.capa ? '<h1' : '<h2') + ' class="p-titulo" data-ler>' + esc(o.titulo) + (o.capa ? '</h1>' : '</h2>') : '') +
        (o.passo ? '<p class="p-passo passo">' + esc(o.passo) + '</p>' : '') +
        (p !== null ? '<div class="p-barra" role="progressbar" aria-label="Progresso nesta etapa" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + p + '"' + (o.contador ? ' aria-valuetext="' + esc(o.contador) + '"' : '') + '><span style="width:' + p + '%"></span></div>' : '') +
        (o.extra || '') +
      '</header>' +
    '</div>';
  }

  function fontesHtml() {
    var F = window.LG2_FONTES || {};
    var lista = (F.fontes || []).filter(function (f) { return f && f.link; });
    var versao = F.data ? 'Fontes verificadas em ' + esc(F.data) + (F.versao ? ' (conteúdo versão ' + esc(F.versao) + ')' : '') + '.' : '';
    return lista.length || versao ? '<details class="p-fontes"><summary>Fontes consultadas</summary>' +
      (versao ? '<p class="p-versao">' + versao + '</p>' : '') +
      (lista.length ? '<ul>' + lista.map(function (f) {
        return '<li><a href="' + esc(f.link) + '" target="_blank" rel="noopener">' + esc(f.titulo || f.link) + '</a>' +
          (f.orgao ? ' <span class="p-orgao">(' + esc(f.orgao) + ')</span>' : '') +
          (f.consulta ? ' <span class="p-data">consultada em ' + esc(f.consulta) + '</span>' : '') + '</li>';
      }).join('') + '</ul>' : '') +
      '</details>' : '';
  }
  function rodape() {
    return '<footer class="p-rodape">' + fontesHtml() +
      '<p class="p-aviso">' + esc(AVISO) + '</p>' +
      '<p class="p-credito">' + esc(CREDITO) + '</p>' +
      '<div class="p-logos">' +
        '<img src="assets/logo_facc.png" alt="FACC">' +
        '<img src="assets/logo_ufjf.svg" alt="UFJF">' +
        '<img src="assets/logo_mg.svg" alt="Governo de Minas Gerais">' +
      '</div>' +
    '</footer>';
  }

  /* Fonte de um conceito da base técnica (código como "M8.BT03"), para mostrar junto do termo. */
  function fonteDe(codigo) {
    var F = window.LG2_FONTES || {};
    return (F.fontes || []).find(function (f) { return f && f.link && (f.conceitos || []).indexOf(codigo) >= 0; }) || null;
  }
  function linkFonte(codigo) {
    var f = fonteDe(codigo);
    return f ? '<p class="p-fonte-termo">Fonte: <a href="' + esc(f.link) + '" target="_blank" rel="noopener">' + esc(f.orgao || f.titulo) + '</a></p>' : '';
  }

  /* ---------- Ouvir: lê em voz alta o texto marcado com data-ler (ou o principal da tela) ---------- */
  var fala = 'speechSynthesis' in window && typeof window.SpeechSynthesisUtterance === 'function' ? window.speechSynthesis : null;
  var ICO_OUVIR = '<svg class="p-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/></svg>';
  function visivel(e) { return !e.closest('[hidden]') && !e.closest('details:not([open]) > :not(summary)'); }
  function textoDaTela(raiz) {
    var marcados = Array.prototype.slice.call(raiz.querySelectorAll('[data-ler]')).filter(visivel);
    var alvo = marcados.filter(function (e) { return !e.classList.contains('p-kicker'); }).length ? marcados :
      marcados.concat(Array.prototype.slice.call(raiz.querySelectorAll('main h1, main h2, main h3, main legend, main label, main .opcao, main p')).filter(visivel));
    var vistos = [];
    alvo.forEach(function (e) {
      if (vistos.some(function (v) { return v.contains(e); })) return;
      vistos.push(e);
    });
    return vistos.map(function (e) { return (e.innerText || e.textContent || '').replace(/\s+/g, ' ').trim(); })
      .filter(Boolean).join('. ').replace(/\.\s*\./g, '.');
  }
  function ouvir(botao) {
    if (!fala) return;
    if (fala.speaking) { try { fala.cancel(); } catch (e) {} botao.setAttribute('aria-pressed', 'false'); return; }
    var raiz = botao.closest('.pag') || document.getElementById('tela') || document.body;
    var u = new SpeechSynthesisUtterance(textoDaTela(raiz));
    u.lang = 'pt-BR';
    var voz = (fala.getVoices() || []).find(function (v) { return /^pt(-|_)BR/i.test(v.lang); });
    if (voz) u.voice = voz;
    u.onend = function () { botao.setAttribute('aria-pressed', 'false'); };
    botao.setAttribute('aria-pressed', 'true');
    fala.speak(u);
  }

  /* ---------- Salvar e sair ---------- */
  var salvarConfirmado = false;
  function caixa(html) {
    fechar();
    var fundo = document.createElement('div');
    fundo.className = 'p-dialogo-fundo';
    fundo.innerHTML = '<div class="p-dialogo" role="dialog" aria-modal="true" aria-labelledby="p-dialogo-tit" tabindex="-1">' + html + '</div>';
    document.body.appendChild(fundo);
    fundo.querySelector('.p-dialogo').focus();
    fundo.addEventListener('click', function (ev) {
      if (ev.target === fundo || ev.target.closest('[data-p-fechar]')) fechar();
      if (ev.target.closest('[data-p-ir-trilha]')) irTrilha();
      if (ev.target.closest('[data-p-tentar]')) salvar(salvarConfirmado);
      if (ev.target.closest('[data-p-confirmar-salvar]')) salvar(true);
      if (ev.target.closest('[data-p-usar-conta]')) {
        salvarConfirmado = false;
        var P = window.LG2Progresso;
        caixa('<h2 id="p-dialogo-tit">Trocando para a cópia da conta…</h2><p>Atualizando as respostas neste aparelho.</p>');
        Promise.resolve(P && P.usarConta ? P.usarConta() : false).then(function (ok) {
          if (ok) window.location.reload();
          else caixa('<h2 id="p-dialogo-tit">Não foi possível carregar a cópia</h2><p>Suas respostas neste aparelho continuam aqui.</p><button type="button" class="p-btn-sec" data-p-fechar>Fechar</button>');
        });
      }
    });
    return fundo;
  }
  function fechar() { var f = document.querySelector('.p-dialogo-fundo'); if (f) f.remove(); }
  function irTrilha() {
    try { (naJornada ? window.parent : window).location.href = TRILHA; } catch (e) { window.location.href = TRILHA; }
  }
  function mostrarConflito(P) {
    if (P && P.contaTemDados) {
      caixa('<h2 id="p-dialogo-tit">Há duas versões do progresso</h2>' +
        '<p>As respostas deste aparelho são diferentes das que estão na sua conta. Nada foi substituído.</p>' +
        '<p>Se usar este aparelho, as respostas dos módulos presentes nele terão prioridade; módulos que só estão na conta serão mantidos.</p>' +
        '<div class="p-dialogo-acoes"><button type="button" class="p-btn" data-p-confirmar-salvar>Usar este aparelho</button>' +
        '<button type="button" class="p-btn-sec" data-p-usar-conta>Usar a cópia da conta</button>' +
        '<button type="button" class="p-btn-sec" data-p-fechar>Agora não</button></div>');
    } else {
      caixa('<h2 id="p-dialogo-tit">Progresso ainda não vinculado</h2>' +
        '<p>Encontramos respostas neste aparelho que ainda não estão na sua conta. Confirme que são suas antes de enviá-las.</p>' +
        '<div class="p-dialogo-acoes"><button type="button" class="p-btn" data-p-confirmar-salvar>Salvar na minha conta</button>' +
        '<button type="button" class="p-btn-sec" data-p-fechar>Agora não</button></div>');
    }
  }
  function salvar(confirmar) {
    if (confirmar) salvarConfirmado = true;
    var P = window.LG2Progresso;
    caixa('<h2 id="p-dialogo-tit">Conferindo seu progresso…</h2><p>Verificando a cópia guardada na sua conta.</p>');
    var espera = new Promise(function (r) { setTimeout(function () { r(false); }, 8000); });
    Promise.race([P && P.pronto ? P.pronto : Promise.resolve(false), espera]).then(function (pronto) {
      if (pronto && P && P.needsConfirmation && !salvarConfirmado) { mostrarConflito(P); return; }
      caixa('<h2 id="p-dialogo-tit">Salvando…</h2><p>Guardando suas respostas na sua conta.</p>');
      var esperaSalvar = new Promise(function (r) { setTimeout(function () { r(false); }, 8000); });
      Promise.race([P && P.salvar ? P.salvar(salvarConfirmado) : Promise.resolve(false), esperaSalvar]).then(function (ok) {
        if (ok) {
          salvarConfirmado = false;
          caixa('<h2 id="p-dialogo-tit">Pronto, está salvo!</h2>' +
            '<p>Suas respostas estão guardadas na sua conta. Quando voltar, é só entrar com a mesma conta, em qualquer aparelho, e continuar de onde parou.</p>' +
            '<div class="p-dialogo-acoes"><button type="button" class="p-btn" data-p-ir-trilha>Sair para a trilha</button>' +
            '<button type="button" class="p-btn-sec" data-p-fechar>Continuar respondendo</button></div>');
        } else {
          caixa('<h2 id="p-dialogo-tit">Salvo neste aparelho</h2>' +
            '<p>Suas respostas estão guardadas neste aparelho, mas não conseguimos falar com a sua conta agora. Confira a internet e tente de novo para poder continuar em outro aparelho.</p>' +
            '<div class="p-dialogo-acoes"><button type="button" class="p-btn" data-p-tentar>Tentar de novo</button>' +
            '<button type="button" class="p-btn-sec" data-p-ir-trilha>Sair mesmo assim</button>' +
            '<button type="button" class="p-btn-sec" data-p-fechar>Continuar respondendo</button></div>');
        }
      });
    });
  }

  document.addEventListener('click', function (ev) {
    var t = ev.target.closest ? ev.target.closest('[data-p-voltar],[data-p-inicio],[data-p-ouvir],[data-p-salvar]') : null;
    if (!t) return;
    if (t.hasAttribute('data-p-ouvir')) { ouvir(t); return; }
    if (t.hasAttribute('data-p-salvar')) { salvar(); return; }
    if (fala) try { fala.cancel(); } catch (e) {}
    if (t.hasAttribute('data-p-voltar') && acoes.voltar) acoes.voltar(ev);
    else if (t.hasAttribute('data-p-voltar')) irTrilha();
    if (t.hasAttribute('data-p-inicio') && acoes.inicio) acoes.inicio(ev);
    else if (t.hasAttribute('data-p-inicio')) irTrilha();
  });

  /* Mesmo cabeçalho e acesso às fontes nos módulos legados, sem reescrever seus formulários.
     MutationObserver repõe os elementos quando o app troca de tela. */
  function integrarTela() {
    var pagina = document.querySelector('#tela .pag, .pag');
    if (!pagina) return;
    if (!pagina.querySelector('.p-linha')) {
      var barra = document.createElement('div');
      barra.className = 'p-linha p-linha-integrada';
      barra.innerHTML = '<img class="p-logo" src="assets/minds.svg" alt="Minds of the Future">' +
        '<nav class="p-trilha" aria-label="Você está em"><button type="button" class="p-link" data-p-inicio>Início</button><span aria-hidden="true">/</span><span>' + esc(rotulo()) + '</span></nav>' +
        '<button type="button" class="p-salvar" data-p-salvar>Salvar e sair</button>';
      pagina.insertBefore(barra, pagina.firstChild);
    }
    var capa = Array.prototype.some.call(pagina.querySelectorAll('button'), function (b) { return /^Começar\b/i.test((b.textContent || '').trim()); });
    var resultado = !!pagina.querySelector('.lg2-proximo');
    if ((capa || resultado) && !pagina.querySelector('.p-fontes')) {
      var fontes = document.createElement('div');
      fontes.innerHTML = fontesHtml();
      if (fontes.firstElementChild) pagina.appendChild(fontes.firstElementChild);
    }
    if ((capa || resultado) && !pagina.querySelector('.p-rodape') && !pagina.querySelector('.rodape')) {
      var fim = document.createElement('div');
      fim.innerHTML = '<footer class="p-rodape"><p class="p-aviso">' + esc(AVISO) + '</p><p class="p-credito">' + esc(CREDITO) + '</p></footer>';
      pagina.appendChild(fim.firstElementChild);
    }
  }
  integrarTela();
  if (document.body && typeof MutationObserver !== 'undefined') new MutationObserver(integrarTela).observe(document.body, { childList: true, subtree: true });

  document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape') fechar(); });

  window.LG2Padrao = {
    ETAPA: ETAPA, TOTAL: TOTAL, TRILHA: TRILHA, AVISO: AVISO,
    nome: nome, rotulo: rotulo, topo: topo, rodape: rodape, definir: definir,
    fonteDe: fonteDe, linkFonte: linkFonte, salvar: salvar, naJornada: naJornada
  };
})();
