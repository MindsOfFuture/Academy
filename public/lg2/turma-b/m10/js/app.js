/* Perguntas literais da planilha. Sem regras ou alternativas inventadas. */
(async function () {
  'use strict';
  const tela = document.getElementById('tela');
  const CHAVE = 'lg2-turma-b-m10';
  /* o módulo mudou de turma em 15/10: traz as respostas salvas na chave antiga */
  try { const antiga = localStorage.getItem('lg2-turma-a-m10'); if (antiga && !localStorage.getItem(CHAVE)) localStorage.setItem(CHAVE, antiga); } catch (e) {}
  const assets = 'assets/';
  const aviso = 'Versão parcial · texto aberto temporário. As alternativas de escolha e as regras de resposta não foram preenchidas na planilha. Por enquanto, todas as respostas são escritas livremente, sem avaliação automática.';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let dados;
  try {
    const response = await fetch('dados/perguntas.json');
    if (!response.ok) throw new Error('Não foi possível carregar as perguntas.');
    dados = await response.json();
  } catch {
    tela.textContent = 'Não foi possível carregar as perguntas. Recarregue a página para tentar novamente.';
    return;
  }
  const perguntas = dados.perguntas;
  const novo = () => ({respostas:{},indice:0,iniciado:false,resumo:false});
  let estado = novo();
  let erroArmazenamento = '';
  let editando = false;
  try {
    const salvo = JSON.parse(localStorage.getItem(CHAVE));
    if (salvo && typeof salvo === 'object') {
      estado.indice = Number.isInteger(salvo.indice) ? Math.max(0,Math.min(perguntas.length-1,salvo.indice)) : 0;
      estado.iniciado = salvo.iniciado === true;
      estado.resumo = salvo.resumo === true;
      for (const q of perguntas) {
        if (typeof salvo.respostas?.[q.id] === 'string') estado.respostas[q.id] = salvo.respostas[q.id];
      }
    }
  } catch {
    erroArmazenamento = 'Não foi possível recuperar as respostas salvas. O armazenamento pode estar indisponível ou os dados podem estar danificados.';
  }
  function salvar() {
    try {
      localStorage.setItem(CHAVE, JSON.stringify(estado));
      erroArmazenamento = '';
    } catch {
      erroArmazenamento = 'Não foi possível salvar neste navegador. Mantenha a página aberta e imprima o resumo para guardar suas respostas.';
    }
    const status = document.getElementById('salvamento');
    if (status) status.textContent = erroArmazenamento || 'Respostas salvas apenas neste navegador.';
  }
  function rodape() {
    return `<footer class="rodape"><p class="credito">Laboratório de Gestão II · Turma B · Módulo 10</p><div class="logos"><img src="${assets}logo_facc.png" alt="FACC"><img src="${assets}logo_ufjf.svg" alt="UFJF"><img src="${assets}logo_mg.svg" alt="Governo de Minas Gerais"></div></footer>`;
  }
  /* Layout no modelo do Módulo 5: barra do topo com trilha, faixa roxa com ilustração,
     cartão da pergunta e conclusão no resumo. Rótulos e ids dos botões não mudam. */
  function topo(trilha) {
    return `<div class="barra-topo"><img class="logo-mini" src="${assets}minds.svg" alt="Minds of the Future"><nav class="trilha" aria-label="Você está em"><button class="trilha-link" data-inicio>Início</button><span>/</span><span>Módulo 10</span>${trilha ? `<span>/</span><span>${esc(trilha)}</span>` : ''}</nav></div>`;
  }
  function heroi(o) {
    return `<section class="heroi ${o.grande ? 'heroi-grande' : ''}"><div class="heroi-topo"><div class="heroi-txt"><div class="kicker ${o.kickerClasse || ''}">${esc(o.kicker || 'Módulo 10')}</div><h1 class="heroi-tit ${o.grande ? '' : 'heroi-tit-longo'}">${esc(dados.nome)}</h1>${o.texto ? `<p>${esc(o.texto)}</p>` : ''}</div><img class="heroi-img" src="${assets}${o.grande ? 'hero-inicio.webp' : 'hero-preco.webp'}" alt=""></div>${o.extra || ''}</section>`;
  }
  function exibir(conteudo,o={}) {
    tela.innerHTML = `<div class="pag">${topo(o.trilha)}${heroi(o)}<main class="corpo"><p class="aviso">${aviso}</p>${conteudo}<p id="salvamento" class="salvamento" role="status">${esc(erroArmazenamento || 'Respostas salvas apenas neste navegador.')}</p>${rodape()}</main></div>`;
    tela.querySelectorAll('[data-inicio]').forEach(b => { b.onclick = () => { editando = false; capa(); }; });
    window.scrollTo(0,0);
  }
  function ligarReset() {
    document.getElementById('reiniciar').onclick = () => {
      if (!confirm('Apagar todas as respostas deste módulo da Turma B e recomeçar?')) return;
      try { localStorage.removeItem(CHAVE); }
      catch {
        erroArmazenamento = 'Não foi possível apagar as respostas salvas. Tente novamente quando o armazenamento estiver disponível.';
        document.getElementById('salvamento').textContent = erroArmazenamento;
        return;
      }
      estado = novo();
      editando = false;
      erroArmazenamento = '';
      capa();
    };
  }
  function capa() {
    exibir(`<div class="cartao"><h2>15 perguntas para registrar suas respostas</h2><p>Ao final, você poderá revisar e imprimir o que escreveu. Esta versão reúne apenas as perguntas, não um diagnóstico ou plano de ação automático.</p></div><p>Não inclua nomes, telefones, documentos ou outros dados pessoais nas respostas.</p><div class="acoes"><button id="iniciar" class="btn btn-primario seta">${estado.iniciado ? 'Continuar de onde parei' : 'Começar'}</button><button id="reiniciar" class="btn btn-claro">Recomeçar do zero</button></div>`,{grande:true,texto:'Laboratório de Gestão II · Turma B'});
    document.getElementById('iniciar').onclick = () => {
      estado.iniciado = true;
      salvar();
      if (estado.resumo) resumo(); else pergunta();
    };
    ligarReset();
  }
  function pergunta() {
    const q = perguntas[estado.indice];
    const passo = `Pergunta ${estado.indice+1} de ${perguntas.length}`;
    const pct = Math.round(((estado.indice+1)/perguntas.length)*100);
    exibir(`<section class="cartao-q pergunta"><label class="q" id="pergunta" for="resposta">${esc(q.pergunta)}</label><textarea class="campo" id="resposta" rows="5" aria-describedby="modo"></textarea><p id="modo" class="salvamento">Resposta em texto aberto. Você pode deixar em branco e revisar depois.</p><div class="acoes"><button class="btn btn-primario seta" id="proxima">${estado.indice === perguntas.length-1 ? 'Ver resumo' : 'Próxima'}</button>${editando ? '<button class="btn btn-claro" id="resumir">Voltar ao resumo</button>' : ''}</div><div class="acoes acoes-voltar"><button class="btn btn-linha voltar" id="voltar">Voltar</button></div></section>`,
      {trilha:'Perguntas',extra:`<div class="progresso"><p class="passo">${esc(passo)}</p><div class="barra"><div class="barra-fill" style="width:${pct}%"></div></div></div><button id="reiniciar" class="reinicio">Recomeçar do zero</button>`});
    const campo = document.getElementById('resposta');
    campo.value = estado.respostas[q.id] || '';
    campo.oninput = () => { estado.respostas[q.id] = campo.value; salvar(); };
    document.getElementById('proxima').onclick = () => {
      if (estado.indice === perguntas.length-1) { estado.resumo = true; editando = false; salvar(); resumo(); }
      else { estado.indice++; salvar(); pergunta(); }
    };
    document.getElementById('voltar').onclick = () => {
      if (estado.indice === 0) capa();
      else { estado.indice--; salvar(); pergunta(); }
    };
    if (editando) document.getElementById('resumir').onclick = () => { estado.resumo = true; editando = false; salvar(); resumo(); };
    ligarReset();
    campo.focus({preventScroll:true});
  }
  function resumo() {
    exibir(`<section class="concluido"><div class="conc-topo"><span class="check" aria-hidden="true"></span><div><h2>Você concluiu o Módulo 10</h2><p>Suas respostas estão reunidas abaixo.</p></div></div></section><section class="resumo"><h2>Resumo das suas respostas</h2><p>Registro do que você escreveu, sem avaliação automática.</p>${perguntas.map((q,i) => `<article class="cartao"><h2>${esc(q.pergunta)}</h2><p class="resposta">${esc(estado.respostas[q.id] || 'Sem resposta')}</p><button class="btn btn-claro editar" data-indice="${i}" aria-label="Editar resposta ${i+1}">Editar resposta</button></article>`).join('')}</section><div class="acoes"><button class="btn btn-primario" id="imprimir">Imprimir resumo</button><button class="btn btn-claro" id="reiniciar">Recomeçar do zero</button></div><div class="acoes lg2-proximo"><a class="btn btn-claro" style="text-decoration:none;text-align:center;box-sizing:border-box" href="/protected/modulos/laboratorio-de-gestao?aba=b">Voltar aos módulos</a></div>`,{trilha:'Resumo',kicker:'Resumo',kickerClasse:'passo'});
    document.querySelectorAll('[data-indice]').forEach(button => {
      button.onclick = () => { estado.indice = Number(button.dataset.indice); estado.resumo = false; editando = true; salvar(); pergunta(); };
    });
    document.getElementById('imprimir').onclick = () => window.print();
    ligarReset();
  }
  capa();
})();
