# Melhoria adiada — Academy: adicionar build/typecheck ao gate de CI

## Estado e decisão

Card: `t_53f08ba6` · board `default` · responsável Hermes/default · device RR.
**Conclusão administrativa por solicitação do usuário: melhoria documentada, implementação NÃO concluída.**
O usuário pediu registrar no repositório os itens impedidos por permissionamento, integração ou decisão e encerrar seus cards. Esse encerramento não remove o bloqueio técnico nem comprova o aceite de implementação.
HEAD observado ao documentar: `8834ab0b68dda44ed74252522a70ea08d97e20ff`. Mudanças locais anteriores são preservadas; não são atribuídas a esta documentação.

## Impedimento para executar

Dependências/fonte pública necessárias para build offline; aguardando autorização/preparação do ambiente. Reespecificação automática não resolve.

## Melhoria e critérios de aceite originais

Adicionar build/typecheck ao workflow de testes existente sem duplicar pipeline. Aceite: CI executa lint, testes e build/typecheck; validação local relevante passa.

## Fonte técnica

1. **Condicionar deploy à aprovação dos testes do mesmo SHA** — esforço baixo. deploy.yml reage ao push independentemente de tests.yml. Encadear a validação no workflow de release; verificar antes se o script remoto já impõe essa condição, pois ele não foi auditado.
   - Evidência: `.github/workflows/deploy.yml:3-16,29-38; .github/workflows/tests.yml:3-10`.

2. **Adicionar build/typecheck ao gate existente** — esforço baixo. O workflow Tests executa lint e Vitest, mas não compila o app. Acrescentar npm run build com configuração de teste para descobrir falhas de produção antes da VPS.
   - Evidência: `.github/workflows/tests.yml:41-50; next.config.ts:4-6`.

3. **Corrigir instruções de contribuidores desatualizadas** — esforço baixo. CLAUDE.md ainda fala em develop e imagens de qualquer host HTTPS; o código já usa development e allowlist. Atualizar somente essas divergências, sem reescrever documentação inteira.
   - Evidência: `CLAUDE.md, seções Commands/Conventions; .github/workflows/tests.yml:5-7; next.config.ts:27-37`.

## Diagnóstico e trabalho parcial reportados

Os registros abaixo são evidências históricas declaradas pelos executores, NÃO testes refeitos neste encerramento. Confirmar no checkout antes de retomar.

Run 57: orientação confirmou que o último evento é novamente reespecificação automática, sem decisão humana sobre a preparação do ambiente. Nenhum arquivo ou comando de repositório foi executado nesta tentativa; evidências técnicas permanecem as dos runs 45/47, não revalidadas. Aceite local, prova de typecheck bloqueante e revisão continuam pendentes. Ação necessária do operador: autorizar instalação local de dependências e obtenção pública da fonte em ambiente isolado, ou fornecer ambiente pronto, mantendo proibidos serviços de negócio/produção. O auto-decomposer está promovendo repetidamente este bloqueio sem resolvê-lo; é necessária retenção operacional até resposta humana, não nova reformulação do card. Escopo preservado: somente .github/workflows/tests.yml; sem subdelegação, commit, push ou deploy.

---

Run 58: não há resposta humana ao bloqueio de preparação do ambiente; último evento é nova reespecificação automática. Sem comandos de repositório, edições ou testes neste run; evidências anteriores não revalidadas. Continuam pendentes lint, Vitest, build, prova de typecheck bloqueante e revisão. Decisão necessária permanece a mesma: autorizar instalação local de dependências e download público da fonte em ambiente isolado, ou fornecer ambiente preparado. Recomenda-se ao operador interromper a promoção automática deste card até resolver essa decisão; nenhuma configuração do dispatcher foi alterada. Handoff técnico continua nos runs 45/47; escopo exclusivo tests.yml e proibição de produção/commit/push/deploy preservados.

---

Run 61: retomada sem nova decisão humana; último evento continua sendo reespecificação automática. Nenhuma edição, instalação ou teste nesta tentativa; evidências dos runs 45/47 não revalidadas. O bloqueio permanece de autorização para preparar dependências e fonte pública em ambiente isolado, ou disponibilizar ambiente pronto. Aceite local e revisão pendentes; CI remoto não executado. Escopo exclusivo tests.yml preservado. Operador precisa resolver essa decisão e impedir novas promoções automáticas sem resposta; não alterei configuração do dispatcher.

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
