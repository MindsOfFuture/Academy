# 013 — Laboratório de Gestão: módulos por turma

Status: aprovada (Rafael, 01/10/2026: "publish whats already done with em breve")
Constituição: `specs/constitution.md`

## Problema

Os grupos do Laboratório de Gestão II já entregaram módulos prontos, mas a página do
Laboratório de Gestão no Academy só mostra o protótipo "Primeiro Passo", e o aluno não
encontra o módulo da própria turma.

## Escopo

- A página do Laboratório de Gestão mostra a Turma A e a Turma B separadas. Cada turma tem
  os 10 módulos da disciplina, na ordem de 1 a 10.
- O módulo que já foi entregue abre direto. O que ainda não chegou aparece como "em breve".
- O protótipo "Primeiro Passo" continua acessível, numa terceira aba chamada "Demonstração".
- Como no resto da área de módulos, só quem entrou no Academy acessa.
- As respostas de um módulo ficam só no aparelho do aluno, separadas por turma: o módulo 2
  da Turma A não apaga nem mistura as respostas do módulo 2 da Turma B.

**Fora de escopo:**
- Guardar as respostas dos módulos na conta do aluno, ou ver o progresso de outra pessoa.
- Escolher automaticamente a turma do aluno. A pessoa escolhe a aba.
- Editar o conteúdo dos módulos pelo site. O conteúdo vem da planilha de cada grupo.

## Critérios de aceite

- [ ] Dado um aluno logado, quando abre o Laboratório de Gestão, então vê as abas Turma A,
      Turma B e Demonstração, com a Turma A aberta.
- [ ] Em cada turma, aparecem 10 módulos numerados de 1 a 10.
- [ ] Turma A: os módulos 1, 2, 5 e 6 abrem; os módulos 3, 4, 7, 8, 9 e 10 dizem "em breve".
- [ ] Turma B: os módulos 8 e 9 abrem; os outros 8 dizem "em breve".
- [ ] Ao abrir um módulo pronto, o aluno responde até o fim e vê o resultado.
- [ ] Sem login, abrir a página ou o endereço de um módulo leva à tela de entrada.

## Plano

- **Degrau da escada:** os módulos já são páginas estáticas prontas (HTML, CSS e JS sem
  dependência). Servi-los como arquivos estáticos do Next é o primeiro degrau que resolve.
  O middleware já exige sessão para todo caminho que não é imagem, então HTML, JS, CSS e
  fonte dos módulos ficam atrás do login sem regra nova. As imagens (logos) passam sem
  sessão, como já acontece hoje com `public/`.
- **Arquivos:**
  - `public/lg2/turma-a/m01|m02|m05|m06/` e `public/lg2/turma-b/m08|m09/`: cópia de
    `index.html`, `css/`, `js/`, `dados/` e `assets/` de cada módulo (sem planilha, testes ou
    ferramentas).
  - `components/modules/laboratorio-gestao/turmas.ts`: nomes dos 10 módulos e quais estão
    prontos em cada turma.
  - `components/modules/laboratorio-gestao/ModulosTurma.tsx`: lista de módulos de uma turma.
  - `app/protected/modulos/laboratorio-de-gestao/page.tsx`: abas por `?aba=a|b|demo`.
  - `tests/unit/components/modules/ModulosTurma.test.tsx` e ajuste do marcador da página em
    `tests/unit/app/protected/module-auth.test.tsx`.
- **Dados:** nenhum. Nada no banco.
- **Autorização:** a de hoje, sem mudança: `requireModuleUser` na página e a sessão do
  middleware para os arquivos. Nada entra em `PUBLIC_PATH_PREFIXES`.
- **Dependência nova:** nenhuma.
- **Atalhos:** `// ponytail:` a lista de módulos prontos é fixa no código. Teto: cada módulo
  novo exige um commit. Upgrade: ler a lista das pastas em `public/lg2/` no build.

## Tarefas

- [ ] Copiar os 6 módulos prontos para `public/lg2/`, com chave de armazenamento por turma.
- [ ] Abas e lista de módulos — `page.tsx`, `ModulosTurma.tsx`, `turmas.ts`
- [ ] Teste: cada turma lista 10 módulos; os prontos apontam para um `index.html` que existe
      em `public/`; os outros dizem "em breve" — `tests/unit/components/modules/ModulosTurma.test.tsx`

## Aberto

Nada.
