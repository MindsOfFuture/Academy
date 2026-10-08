/* Perguntas literais da planilha. Sem regras ou alternativas inventadas. */
(async function () {
  'use strict';
  const tela = document.getElementById('tela');
  const CHAVE = 'lg2-turma-a-m10';
  const assets = '../../turma-b/m04/assets/';
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
    return `<footer class="rodape"><p class="credito">Laboratório de Gestão II · Turma A · Módulo 10</p><div class="logos"><img src="${assets}logo_facc.png" alt="FACC"><img src="${assets}logo_ufjf.svg" alt="UFJF"><img src="${assets}logo_mg.svg" alt="Governo de Minas Gerais"></div></footer>`;
  }
  function exibir(conteudo,passo='Perguntas do módulo') {
    tela.innerHTML = `<div class="pag"><header class="topo"><div class="marca"><img class="logo" src="${assets}minds.svg" alt="Minds of the Future"><div>Laboratório de Gestão II<br>Turma A · Módulo 10</div></div><h1>${esc(dados.nome)}</h1><p class="passo">${esc(passo)}</p></header><main class="corpo"><p class="aviso">${aviso}</p>${conteudo}<p id="salvamento" class="salvamento" role="status">${esc(erroArmazenamento || 'Respostas salvas apenas neste navegador.')}</p>${rodape()}</main></div>`;
    window.scrollTo(0,0);
  }
  function ligarReset() {
    document.getElementById('reiniciar').onclick = () => {
      if (!confirm('Apagar todas as respostas deste módulo da Turma A e recomeçar?')) return;
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
    exibir(`<div class="cartao"><h2>15 perguntas para registrar suas respostas</h2><p>Ao final, você poderá revisar e imprimir o que escreveu. Esta versão reúne apenas as perguntas, não um diagnóstico ou plano de ação automático.</p></div><p>Não inclua nomes, telefones, documentos ou outros dados pessoais nas respostas.</p><div class="acoes"><button id="iniciar" class="btn btn-primario">${estado.iniciado ? 'Continuar de onde parei' : 'Começar'}</button><button id="reiniciar" class="btn btn-linha">Recomeçar do zero</button></div>`);
    document.getElementById('iniciar').onclick = () => {
      estado.iniciado = true;
      salvar();
      if (estado.resumo) resumo(); else pergunta();
    };
    ligarReset();
  }
  function pergunta() {
    const q = perguntas[estado.indice];
    exibir(`<section class="pergunta"><label class="q" id="pergunta" for="resposta">${esc(q.pergunta)}</label><textarea class="campo" id="resposta" rows="5" aria-describedby="modo"></textarea><p id="modo" class="salvamento">Resposta em texto aberto. Você pode deixar em branco e revisar depois.</p></section><div class="acoes"><button class="btn btn-primario" id="proxima">${estado.indice === perguntas.length-1 ? 'Ver resumo' : 'Próxima'}</button><button class="btn btn-claro" id="voltar">Voltar</button>${editando ? '<button class="btn btn-linha" id="resumir">Voltar ao resumo</button>' : ''}<button id="reiniciar" class="btn btn-linha">Recomeçar do zero</button></div>`,`Pergunta ${estado.indice+1} de ${perguntas.length}`);
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
    exibir(`<section class="resumo"><h2>Resumo das suas respostas</h2><p>Registro do que você escreveu, sem avaliação automática.</p>${perguntas.map((q,i) => `<article class="cartao"><h2>${esc(q.pergunta)}</h2><p class="resposta">${esc(estado.respostas[q.id] || 'Sem resposta')}</p><button class="btn btn-claro editar" data-indice="${i}" aria-label="Editar resposta ${i+1}">Editar resposta</button></article>`).join('')}</section><div class="acoes"><button class="btn btn-primario" id="imprimir">Imprimir resumo</button><button class="btn btn-linha" id="reiniciar">Recomeçar do zero</button></div>`,'Resumo');
    document.querySelectorAll('[data-indice]').forEach(button => {
      button.onclick = () => { estado.indice = Number(button.dataset.indice); estado.resumo = false; editando = true; salvar(); pergunta(); };
    });
    document.getElementById('imprimir').onclick = () => window.print();
    ligarReset();
  }
  capa();
})();
