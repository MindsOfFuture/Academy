/* Vídeos curtos de cada etapa, gravados pela turma do Laboratório de Gestão (canal do Minds no YouTube).
   Com uma etapa aberta, o botão "Vídeos" aparece no topo; tocar abre a lista da etapa e o vídeo toca por cima,
   no mesmo formato em pé do vídeo do Módulo 1. Fechar volta para a mesma pergunta.
   Para incluir um vídeo novo: acrescente { id, titulo } no número da etapa (id = código do link do YouTube). */
(function () {
  'use strict';

  var VIDEOS = {
    1: [
      { id: '_eFYG8sux_M', titulo: 'A importância de definir perfil e segmento' }
    ],
    2: [
      { id: '9Ujc7zPzEp4', titulo: 'O que é público-alvo' },
      { id: 'NPIOWG5f_iY', titulo: 'Como abordar possíveis clientes' },
      { id: 'nQgwOhCjgHQ', titulo: 'Uso de IA em pesquisas com clientes' },
      { id: 'fD_iy5VzYwQ', titulo: 'Oportunidades' }
    ],
    3: [
      { id: 'uiIuh_ewLVI', titulo: 'Criação de valor' },
      { id: 'qjeFnVqA1yk', titulo: 'Tipos de concorrência' }
    ],
    4: [
      { id: 'Sq3of3qIxYo', titulo: 'Desenvolvimento do produto' },
      { id: 'yG6tHmds6wc', titulo: 'Teste de ideia' }
    ],
    5: [
      { id: 'jEUJJA9qdKw', titulo: 'Conheça o módulo' },
      { id: '4F8XKL5Hs0g', titulo: 'Produto, mercadoria ou serviço?' },
      { id: '1f2yyNxwBsE', titulo: 'Custos, despesas ou investimentos?' },
      { id: 'OBDfR9k9zVo', titulo: 'Como arredondar o preço de venda' }
    ],
    6: [
      { id: 'Wq0_P9_n8xI', titulo: 'O que é investimento inicial?' },
      { id: '8bS-fC-D7O8', titulo: 'O que é capital de giro' }
    ],
    7: [
      { id: 'YRjioMi0C24', titulo: 'Do pedido à entrega: organize o caminho' }
    ],
    8: [
      { id: 'DzE7W3HnEsQ', titulo: 'Formalização do seu negócio' }
    ],
    9: [
      { id: 'bfZUu-lNYKA', titulo: 'Licenças e alvarás' }
    ],
    10: [
      { id: 'gqizNqcFsrs', titulo: 'Mensagem de saudação no WhatsApp' },
      { id: 'zWYd7nvzr0s', titulo: 'Como aparecer no Google de graça' }
    ]
  };

  var ID_OK = /^[A-Za-z0-9_-]{11}$/;
  var botao = document.getElementById('abre-videos');
  var fundo = document.getElementById('videos');
  if (!botao || !fundo) return;
  var titulo = document.getElementById('videos-titulo');
  var lista = document.getElementById('videos-lista');
  var tocador = document.getElementById('videos-tocador');
  var voltar = document.getElementById('videos-voltar');
  var etapaAtual = null;

  function daEtapa(n) { return (VIDEOS[n] || []).filter(function (v) { return ID_OK.test(v.id); }); }

  function etapa(n) {
    etapaAtual = n;
    var vs = n ? daEtapa(n) : [];
    botao.hidden = vs.length === 0;
    botao.textContent = vs.length === 1 ? 'Vídeo' : 'Vídeos';
    botao.setAttribute('aria-label', vs.length === 1 ? 'Ver o vídeo desta etapa' : 'Ver os ' + vs.length + ' vídeos desta etapa');
    if (!n) fechar();
  }

  function mostrarLista() {
    tocador.innerHTML = '';
    tocador.hidden = true; voltar.hidden = true; lista.hidden = false;
    var b = lista.querySelector('button');
    if (b) b.focus();
  }

  function tocar(v) {
    lista.hidden = true;
    voltar.hidden = daEtapa(etapaAtual).length < 2;
    tocador.hidden = false;
    tocador.innerHTML = '';
    var f = document.createElement('iframe');
    f.className = 'video-midia';
    f.src = 'https://www.youtube-nocookie.com/embed/' + v.id + '?autoplay=1&rel=0&playsinline=1';
    f.title = v.titulo;
    f.setAttribute('allow', 'autoplay; encrypted-media; picture-in-picture; fullscreen');
    f.setAttribute('allowfullscreen', '');
    tocador.appendChild(f);
  }

  function abrir() {
    var vs = daEtapa(etapaAtual);
    if (!vs.length) return;
    titulo.textContent = 'Vídeos da Etapa ' + etapaAtual;
    lista.innerHTML = '';
    vs.forEach(function (v, i) {
      var li = document.createElement('li');
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'video-item';
      b.innerHTML = '<span class="video-play" aria-hidden="true"></span><span class="video-nome"></span>';
      b.querySelector('.video-nome').textContent = (i + 1) + '. ' + v.titulo;
      b.onclick = function () { tocar(v); };
      li.appendChild(b);
      lista.appendChild(li);
    });
    fundo.hidden = false;
    document.body.classList.add('com-video');
    document.addEventListener('keydown', tecla);
    if (vs.length === 1) tocar(vs[0]); else mostrarLista();
    document.getElementById('fecha-videos').focus();
  }

  function fechar() {
    if (fundo.hidden) return;
    tocador.innerHTML = ''; // para o vídeo
    fundo.hidden = true;
    document.body.classList.remove('com-video');
    document.removeEventListener('keydown', tecla);
    if (!botao.hidden) botao.focus();
  }
  function tecla(e) { if (e.key === 'Escape') fechar(); }

  botao.addEventListener('click', abrir);
  document.getElementById('fecha-videos').addEventListener('click', fechar);
  voltar.addEventListener('click', mostrarLista);
  fundo.addEventListener('click', function (e) { if (e.target === fundo) fechar(); });

  window.LG2Videos = { etapa: etapa, lista: daEtapa };
})();
