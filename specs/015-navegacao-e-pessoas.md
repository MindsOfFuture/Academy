# 015 — Navegação clara e seleção de pessoas cadastradas

Status: aprovada pelo pedido de Rafael em 08/10/2026, Telegram tópico 10724
Constituição: `specs/constitution.md`

## Problema

A equipe precisa saber o e-mail exato para adicionar alguém já cadastrado. Alunos encontram o nome técnico “Dashboard” e ações escondidas na foto. Coordenação e bolsistas não têm entrada clara para a gestão.

## Escopo

- A coordenação busca contas existentes por nome ou e-mail, vê resultados limitados com identificação suficiente para distinguir homônimos e escolhe explicitamente a pessoa. Não precisa digitar o e-mail completo.
- A seleção permite adicionar bolsista, coordenação ou ambos, preservando as regras atuais de reativação e proteção da última coordenação.
- O cabeçalho oferece “Meus cursos” e “Meu perfil” diretamente, sem depender da foto. A saída da conta tem rótulo claro. A entrada de visitante usa “Entrar”.
- Coordenação e bolsistas ativos têm botão “Gestão”; alunos e membros desligados não recebem esse atalho.
- A navegação cabe no celular e funciona com teclado, foco visível e alvos de toque legíveis. Não altera permissões por esconder ou mostrar links.

## Critérios de aceite

- [ ] Buscar parte de um nome ou e-mail devolve pessoas cadastradas; nome repetido exige seleção e não concede papel automaticamente.
- [ ] Selecionar uma pessoa e confirmar seu papel adiciona o vínculo correto; erros e ausência de resultados têm mensagens claras.
- [ ] Anônimo, bolsista, desligado e admin público sem coordenação não conseguem enumerar contas ou conceder papéis, inclusive chamando diretamente a operação.
- [ ] “Meus cursos” abre a área de cursos; “Meu perfil” abre o perfil. “Dashboard” não aparece como rótulo de navegação para o aluno.
- [ ] O botão “Gestão” aparece para os dois papéis ativos, inclusive acumulados, e desaparece após saída ou perda do vínculo. Falha de autorização não abre acesso.
- [ ] Cabeçalho sem sobreposição ou rolagem horizontal nos tamanhos de celular; navegação por teclado e indicação da página atual verificadas.

## Plano

Reutilizar navegação, componentes e autorização atuais. Consultas em `lib/api`; busca restrita à coordenação via função autenticada com retorno mínimo e limite de resultados. Seleção por identificador validado no servidor, nunca por nome. Reutilizar a resolução canônica do vínculo de gestão. Sem dependência nova, service role ou concessão de privilégios globais.

## Tarefas

- [ ] Testes de busca, autorização, seleção e navegação.
- [ ] Implementação e revisão do diff.
- [ ] Lint, testes com cobertura e build.
- [ ] Verificação visual desktop/celular e publicação pelo fluxo de PR do projeto.

## Aberto

Nenhuma decisão de produto bloqueia esse escopo. Rafael autorizou produção para esta entrega; revisão e verificação continuam obrigatórias. Não cadastrar colegas reais como teste nem enviar notificações de teste.
