/* Jornada completa do Laboratório de Gestão.
   Abre os módulos publicados (as mesmas páginas das turmas) em ordem, um de cada vez.
   Um módulo só libera quando o anterior chega ao resultado (a tela que mostra o botão do próximo módulo).
   Como abre as próprias páginas das turmas, qualquer mudança num módulo já aparece aqui. */
(function () {
  'use strict';

  // Ordem da jornada. caminho null = módulo ainda não entregue ("em breve"), não trava os seguintes.
  // Precisa bater com PRONTOS em components/modules/laboratorio-gestao/turmas.ts (há teste).
  var MODULOS = [
    { n: 1, nome: 'Perfil do empreendedor e definição da ideia', caminho: '/lg2/turma-a/m01/index.html' },
    { n: 2, nome: 'Clientes, necessidades e comportamento de compra', caminho: '/lg2/turma-b/m02/index.html' },
    { n: 3, nome: 'Mercado, concorrentes e oportunidades', caminho: '/lg2/turma-a/m03/index.html' },
    { n: 4, nome: 'Produto, proposta de valor e teste da ideia', caminho: '/lg2/turma-a/m04/index.html' },
    { n: 5, nome: 'Custos, despesas, preço e margem', caminho: '/lg2/turma-a/m05/index.html' },
    { n: 6, nome: 'Investimento, capital de giro e fluxo de caixa', caminho: '/lg2/turma-b/m06/index.html' },
    { n: 7, nome: 'Operação, fornecedores, capacidade e qualidade', caminho: null },
    { n: 8, nome: 'Formalização, enquadramento e tributação básica', caminho: '/lg2/turma-b/m08/index.html' },
    { n: 9, nome: 'Licenças, endereço e atividades reguladas', caminho: '/lg2/turma-b/m09/index.html' },
    { n: 10, nome: 'Comunicação, vendas, pessoas e plano de ação', caminho: '/lg2/turma-b/m10/index.html' }
  ];
  var CHAVE = 'lg2-jornada';
  var prontos = MODULOS.filter(function (m) { return m.caminho; });

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
  // Liberado = primeiro pronto, ou o pronto anterior já foi concluído.
  function liberado(n) {
    var i = prontos.findIndex(function (m) { return m.n === n; });
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

  var iframe = document.getElementById('modulo');
  var trilha = document.getElementById('trilha');
  var aviso = document.getElementById('aviso');
  var fim = document.getElementById('fim');

  function situacao(m) {
    if (!m.caminho) return 'breve';
    if (feito(m.n)) return 'feito';
    return liberado(m.n) ? 'liberado' : 'bloqueado';
  }

  function desenhar() {
    trilha.innerHTML = '';
    MODULOS.forEach(function (m) {
      var s = situacao(m);
      var li = document.createElement('li');
      li.className = s + (estado.atual === m.n && iframe.hidden === false ? ' atual' : '');
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = m.n;
      var rotulo = { feito: 'concluído', liberado: 'liberado', bloqueado: 'bloqueado', breve: 'em breve' }[s];
      b.setAttribute('aria-label', 'Módulo ' + m.n + ' · ' + m.nome + ' (' + rotulo + ')');
      b.title = 'Módulo ' + m.n + ' · ' + m.nome;
      if (estado.atual === m.n) b.setAttribute('aria-current', 'step');
      b.addEventListener('click', function () { tocar(m); });
      li.appendChild(b);
      trilha.appendChild(li);
    });
    var atual = trilha.querySelector('.atual');
    if (atual && atual.scrollIntoView) atual.scrollIntoView({ block: 'nearest', inline: 'center' });
  }

  function tocar(m) {
    if (!m.caminho) { aviso.textContent = 'O Módulo ' + m.n + ' ainda está sendo preparado pelo grupo.'; return; }
    if (!liberado(m.n) && !feito(m.n)) {
      var ant = prontos[prontos.findIndex(function (x) { return x.n === m.n; }) - 1];
      aviso.textContent = 'Conclua o Módulo ' + ant.n + ' para liberar o Módulo ' + m.n + '.';
      return;
    }
    abrir(m.n);
  }

  function abrir(n) {
    var m = MODULOS.find(function (x) { return x.n === n; });
    estado.atual = n; gravar();
    fim.hidden = true; iframe.hidden = false;
    aviso.textContent = 'Módulo ' + m.n + ' · ' + m.nome;
    if (iframe.getAttribute('src') !== m.caminho) iframe.setAttribute('src', m.caminho);
    desenhar();
  }

  function concluir(n) {
    if (!feito(n)) {
      estado.feitos.push(n); gravar(); desenhar();
      var p = proximoPronto(n);
      aviso.textContent = p ? 'Módulo ' + n + ' concluído! O Módulo ' + p.n + ' foi liberado.' : 'Módulo ' + n + ' concluído!';
    }
  }

  function seguir(n) {
    var p = proximoPronto(n);
    if (p) { abrir(p.n); return; }
    estado.atual = null; gravar();
    iframe.hidden = true; iframe.removeAttribute('src'); fim.hidden = false;
    aviso.textContent = '';
    desenhar();
  }

  // O resultado de cada módulo tem a caixa ".lg2-proximo". Quando ela aparece, o módulo está concluído.
  // O botão dela ("Ir para o Módulo N" / "Voltar aos módulos") passa a seguir a jornada.
  var vigia = null;
  iframe.addEventListener('load', function () {
    clearInterval(vigia);
    var doc, caminho;
    try { doc = iframe.contentDocument; caminho = iframe.contentWindow.location.pathname; } catch (e) { return; }
    if (!doc || !caminho || caminho === 'blank') return;
    var m = moduloPorCaminho(caminho);
    if (!m || (!liberado(m.n) && !feito(m.n))) {
      // Saiu da jornada ou tentou pular um módulo: volta ao módulo atual.
      var volta = estado.atual || primeiroPendente() || prontos[0].n;
      iframe.setAttribute('src', MODULOS.find(function (x) { return x.n === volta; }).caminho);
      return;
    }
    if (estado.atual !== m.n) { estado.atual = m.n; gravar(); desenhar(); }
    doc.addEventListener('click', function (ev) {
      var a = ev.target && ev.target.closest && ev.target.closest('.lg2-proximo a');
      if (!a) return;
      ev.preventDefault();
      concluir(m.n);
      seguir(m.n);
    }, true);
    var olhar = function () { if (doc.querySelector('.lg2-proximo')) concluir(m.n); };
    olhar();
    vigia = setInterval(olhar, 600);
  });

  var inicio = estado.atual && MODULOS.some(function (x) { return x.n === estado.atual && x.caminho; }) &&
    (liberado(estado.atual) || feito(estado.atual)) ? estado.atual : primeiroPendente();
  if (inicio) abrir(inicio); else seguir(prontos[prontos.length - 1].n);
})();
