# Melhoria adiada — Academy: condicionar deploy aos testes do mesmo SHA

## Estado e decisão

Card: `t_1c3b5433` · board `default` · responsável Hermes/default · device RR.
**Conclusão administrativa por solicitação do usuário: melhoria documentada, implementação NÃO concluída.**
O usuário pediu registrar no repositório os itens impedidos por permissionamento, integração ou decisão e encerrar seus cards. Esse encerramento não remove o bloqueio técnico nem comprova o aceite de implementação.
HEAD observado ao documentar: `8834ab0b68dda44ed74252522a70ea08d97e20ff`. Mudanças locais anteriores são preservadas; não são atribuídas a esta documentação.

## Impedimento para executar

Leitura do script remoto necessária; SSH recusado (publickey). Fornecer acesso autorizado/cópia atual.

## Melhoria e critérios de aceite originais

Verificar primeiro o script remoto. Só permitir release/deploy quando os testes do mesmo commit forem aprovados; não fazer deploy. Aceite: workflow prova o SHA validado e permanece sem efeito externo.

## Fonte técnica

1. **Condicionar deploy à aprovação dos testes do mesmo SHA** — esforço baixo. deploy.yml reage ao push independentemente de tests.yml. Encadear a validação no workflow de release; verificar antes se o script remoto já impõe essa condição, pois ele não foi auditado.
   - Evidência: `.github/workflows/deploy.yml:3-16,29-38; .github/workflows/tests.yml:3-10`.

2. **Adicionar build/typecheck ao gate existente** — esforço baixo. O workflow Tests executa lint e Vitest, mas não compila o app. Acrescentar npm run build com configuração de teste para descobrir falhas de produção antes da VPS.
   - Evidência: `.github/workflows/tests.yml:41-50; next.config.ts:4-6`.

3. **Corrigir instruções de contribuidores desatualizadas** — esforço baixo. CLAUDE.md ainda fala em develop e imagens de qualquer host HTTPS; o código já usa development e allowlist. Atualizar somente essas divergências, sem reescrever documentação inteira.
   - Evidência: `CLAUDE.md, seções Commands/Conventions; .github/workflows/tests.yml:5-7; next.config.ts:27-37`.

## Diagnóstico e trabalho parcial reportados

Os registros abaixo são evidências históricas declaradas pelos executores, NÃO testes refeitos neste encerramento. Confirmar no checkout antes de retomar.

Diagnóstico direto no RR, sem delegação e sem alterações no repositório. HEAD verificado: 8834ab0b68dda44ed74252522a70ea08d97e20ff, branch development, worktree limpo (git status --short e git diff --stat vazios).

Fontes lidas: relatório de origem (seção Academy), CLAUDE.md, .github/workflows/deploy.yml, .github/workflows/tests.yml, next.config.ts, package.json e docs/deploy-vps.md. Não há AGENTS.md encontrado no checkout. deploy.yml dispara por push em main ou workflow_dispatch e chama sudo -n /root/deploy-release.sh com GITHUB_SHA, sem dependência do Tests. tests.yml cobre main/development, roda lint e coverage com PostgreSQL descartável, sem build. Confirmadas as divergências citadas de CLAUDE.md (develop e allowlist de imagens).

Pré-requisito bloqueado: a leitura SSH não interativa de /root/deploy-release.sh usando o usuário operacional mindsops e o host registrado no L1 retornou exit 255, Permission denied (publickey). Foram preservados StrictHostKeyChecking=yes e BatchMode=yes; nenhum segredo foi lido, nenhuma chave/credencial foi modificada, nenhum script remoto foi executado. Não houve smoke, deploy, commit, push ou chamada de negócio. A busca semântica do L1 informou index_stale; consulta de texto local forneceu apenas contexto histórico, não prova do script atual.

Aceite ainda não verificado: auditoria do script remoto e gate de testes para o mesmo SHA. Interrompido antes de editar por exigência explícita de verificar primeiro esse script. Próximo passo do responsável: disponibilizar acesso SSH autorizado para leitura ou cópia atual sanitizada do script, identificando a origem/versão; então implementar e testar localmente o gate sem disparar Actions/deploy. Compartilhamento: somente local, device RR.

## Plano para futura implementação

1. Resolver o impedimento pelo fluxo normal de aprovação/acesso ou obter decisão de integração/escopo; não contornar controles.
2. Ler o estado atual, diff, testes existentes e documentação aplicável; preservar WIP, arquivos untracked e alterações concorrentes.
3. Reproduzir o problema com teste offline e implementar somente a menor correção descrita no objetivo. Para integração, documentar contrato, identidade/tenant e estratégia de preservação antes de mudar código/histórico.
4. Executar os critérios de aceite originais e testes de regressão, registrando comandos, exit codes e artefatos reais. Se exigir rede/produção/migration, obter autorização específica.
5. Reabrir o card (ou criar novo trabalho explicitamente autorizado) para implementação e revisão; o status done deste card significa apenas documentação entregue.

## Limites e dependências

Sem commit, push, deploy, alteração de credenciais/permissões, reset, stash, rebase, merge ou migration remota neste encerramento. Nenhum teste de implementação foi executado para produzir este documento.
Cards dependentes não podem interpretar a conclusão administrativa como funcionalidade implementada: devem conferir este documento e o estado real antes de usar qualquer resultado técnico.
Documento local ao repositório; não autoriza publicação/sincronização para outro device nem contém valores de segredos.
