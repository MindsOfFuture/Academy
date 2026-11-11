# 025 — Vídeos de treinamento da equipe

Pedido da coordenação (11/11/2026): publicar os vídeos de treinamento gravados pela equipe numa área do Academy que só bolsistas e coordenação acessam, e saber quem assistiu.

## Cenários

- WHEN a coordenação cola um link do YouTube (não listado) com número e título THEN o vídeo aparece na aba Treinamentos; o mesmo número troca o vídeo.
- WHEN um bolsista abre a aba THEN vê os vídeos em ordem; ao tocar em "Assistir" o acesso é registrado.
- WHEN o vídeo chega ao fim no player THEN fica registrado que a pessoa viu até o fim (melhor esforço: depende do aviso do player do YouTube).
- WHEN a coordenação abre a aba THEN vê, por vídeo, cada bolsista ativo (sem contas de teste), quando abriu, quantas vezes e se viu até o fim, inclusive quem não abriu.
- WHEN alguém sem papel no projeto (ou anônimo) tenta abrir ou chamar as funções THEN recebe 404 na tela e erro nas funções.

## Decisões

- Tabelas sem acesso direto; quatro funções `security definer` conferem `gestao_membro_papel()`.
- Vídeo fica no YouTube como não listado (sem custo de armazenamento); o player usa `youtube-nocookie.com`.
- Fora por enquanto: apagar vídeo (trocar pelo mesmo número resolve), porcentagem assistida, planilha para baixar.
