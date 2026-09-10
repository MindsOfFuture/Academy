# Melhoria adiada — Academy: corrigir divergências pontuais no CLAUDE.md

## Estado e decisão

Card: `t_bc11d713` · board `default` · responsável Hermes/default · device RR.
**Conclusão administrativa por solicitação do usuário: melhoria documentada, implementação NÃO concluída.**
O usuário pediu registrar no repositório os itens impedidos por permissionamento, integração ou decisão e encerrar seus cards. Esse encerramento não remove o bloqueio técnico nem comprova o aceite de implementação.
HEAD observado ao documentar: `8834ab0b68dda44ed74252522a70ea08d97e20ff`. Mudanças locais anteriores são preservadas; não são atribuídas a esta documentação.

## Impedimento para executar

Edição de CLAUDE.md negada por proteção de arquivo de instrução; resolver aprovação normal.

## Melhoria e critérios de aceite originais

Atualizar somente branch development e regras de hosts de imagem que divergem do código. Aceite: instruções correspondem a workflow/config atuais; nenhuma reescrita ampla.

## Fonte técnica

1. **Condicionar deploy à aprovação dos testes do mesmo SHA** — esforço baixo. deploy.yml reage ao push independentemente de tests.yml. Encadear a validação no workflow de release; verificar antes se o script remoto já impõe essa condição, pois ele não foi auditado.
   - Evidência: `.github/workflows/deploy.yml:3-16,29-38; .github/workflows/tests.yml:3-10`.

2. **Adicionar build/typecheck ao gate existente** — esforço baixo. O workflow Tests executa lint e Vitest, mas não compila o app. Acrescentar npm run build com configuração de teste para descobrir falhas de produção antes da VPS.
   - Evidência: `.github/workflows/tests.yml:41-50; next.config.ts:4-6`.

3. **Corrigir instruções de contribuidores desatualizadas** — esforço baixo. CLAUDE.md ainda fala em develop e imagens de qualquer host HTTPS; o código já usa development e allowlist. Atualizar somente essas divergências, sem reescrever documentação inteira.
   - Evidência: `CLAUDE.md, seções Commands/Conventions; .github/workflows/tests.yml:5-7; next.config.ts:27-37`.

## Diagnóstico e trabalho parcial reportados

Os registros abaixo são evidências históricas declaradas pelos executores, NÃO testes refeitos neste encerramento. Confirmar no checkout antes de retomar.

Validação local no RR: checkout development, HEAD 8834ab0, git status --short vazio; nenhum AGENTS.md encontrado no repositório. Divergências confirmadas: CLAUDE.md:32 deve mencionar push e PRs para main/development conforme .github/workflows/tests.yml:4-7. CLAUDE.md:125 deve descrever HTTPS somente para hostname de NEXT_PUBLIC_SUPABASE_URL, lh3.googleusercontent.com, images.unsplash.com, img.youtube.com e i.ytimg.com conforme next.config.ts:8-10,27-37. A tentativa de patch restrita a essas duas linhas foi NEGADA pela proteção de arquivos de instrução: aprovação expirou sem resposta. Nenhuma alteração aplicada; não houve tentativa por caminho alternativo. Próximo passo: autorização explícita pelo mecanismo de aprovação para editar CLAUDE.md; depois aplicar o patch mínimo, executar git diff --check e comparar o diff com workflow/config. Sem commit, push, deploy, delegação ou exportação externa.

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
