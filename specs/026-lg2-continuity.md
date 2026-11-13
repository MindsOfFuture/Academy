# 026 — LG2: continuidade da conta, módulos coerentes e fontes
Status: In progress
Constituição: `specs/constitution.md`

## Why
A jornada passou a ser uma experiência única, mas o progresso ainda precisa acompanhar a conta, os módulos precisam apresentar controles e limites consistentes, e dados técnicos precisam apontar para fontes verificáveis. A audiência do Academy é qualquer aluno autenticado; professor segue como papel restrito ao fluxo institucional de comprovação já existente.

## Changes
### MODIFIED — Requirement: usar a conta padrão do Academy
O sistema SHALL manter o login padrão existente como requisito para abrir o LG2 e para qualquer ação persistente associada à pessoa. SHALL NOT criar conta paralela, CPF/login alternativo nem perfil de professor automático.
#### Scenario: acesso deslogado
- WHEN uma pessoa deslogada tenta abrir a jornada ou um módulo
- THEN o Academy a encaminha ao login padrão e volta ao destino após autenticação.
#### Scenario: estudante
- WHEN uma pessoa autenticada usa o LG2 como estudante
- THEN não precisa de aprovação de professor para responder ou salvar seu próprio progresso.
#### Scenario: professor
- WHEN uma pessoa solicita acesso de professor
- THEN continua sujeita ao fluxo de comprovação documental existente.

### ADDED — Requirement: progresso ligado à conta e saída segura
O sistema SHALL preservar localmente as respostas já dadas e sincronizar as chaves LG2 da pessoa autenticada com a tabela/API existentes. SHALL oferecer "Salvar e sair" em todas as etapas e só confirmar salvamento na conta após resposta positiva do serviço. Se o progresso local não puder ser associado com segurança à conta ou divergir do progresso da conta, SHALL pedir uma escolha antes de substituir ou enviar qualquer cópia.
#### Scenario: salvar em um módulo
- WHEN a pessoa toca "Salvar e sair" com conexão
- THEN o app espera a confirmação da API, informa que as respostas estão na conta e oferece retorno à trilha.
#### Scenario: salvar sem conexão
- WHEN a pessoa toca "Salvar e sair" sem conexão ou a sincronização falha
- THEN o app não afirma que salvou na conta, informa que os dados locais continuam neste aparelho e oferece tentar de novo ou continuar.
#### Scenario: progresso local sem associação confiável
- WHEN há respostas neste navegador sem marcador da conta atual ou diferentes da cópia da conta
- THEN nada é enviado nem substituído em silêncio; a pessoa escolhe usar as respostas do aparelho ou da conta antes da sincronização.
#### Scenario: trocar de aparelho
- WHEN a pessoa entra com a mesma conta em outro aparelho
- THEN o progresso e as respostas sincronizadas são restaurados antes de continuar.
#### Scenario: isolamento de contas
- WHEN outra conta usa o mesmo navegador
- THEN dados locais da conta anterior não são enviados para a conta nova.

### ADDED — Requirement: padrão consistente e orientação de conclusão
O sistema SHALL usar nos 10 módulos o mesmo acesso visível a Início/Trilha e Salvar e sair, tipografia legível, avisos de limite e fontes. SHALL manter o conteúdo autoral dos alunos, alterando-o apenas para correção, clareza, segurança factual ou acessibilidade. O encerramento SHALL separar dados informados, pontos incertos e próximos passos sem prometer resultado.
#### Scenario: navegar pelo módulo
- WHEN a pessoa inicia, responde, volta e conclui qualquer módulo
- THEN os controles comuns mantêm rótulos e posição consistentes e não removem respostas.
#### Scenario: conclusão
- WHEN a pessoa chega ao resumo final
- THEN o app mostra o que se sabe, o que falta confirmar, uma próxima ação prática e quando buscar orientação profissional.
#### Scenario: continuar pelo próximo passo
- WHEN não há respostas em aberto e ainda existem módulos não concluídos
- THEN o app oferece acesso direto ao primeiro módulo em andamento ou, se nenhum estiver em andamento, ao primeiro que não começou.
#### Scenario: revisar uma lacuna
- WHEN o diagnóstico mostra uma resposta "Não sei"
- THEN a pessoa pode reabrir o módulo correspondente, e o diagnóstico deixa claro que não verifica as respostas nem garante resultados.

### ADDED — Requirement: fontes e atualização
O sistema SHALL apresentar fontes ligadas aos conceitos/dados aplicáveis, com título, órgão e data de consulta quando disponível. Informação legal/tributária incerta ou sem fonte não será apresentada como regra confirmada.
#### Scenario: consultar fonte
- WHEN a pessoa abre "Fontes consultadas"
- THEN cada item leva à referência utilizada e indica a entidade e a consulta, se existentes.
#### Scenario: fonte indisponível
- WHEN a referência não é verificável ou seu conteúdo não sustenta a regra
- THEN ela não é descrita como validada e o conteúdo correspondente é sinalizado para revisão.

## Out of scope
Publicação/deploy em produção; mudar o fluxo de cadastro do site; eliminar ou reescrever trabalho estudantil fora de correções necessárias; inserir dados pessoais em telemetria.

## Decisions
- Reutilizar `/api/lg2/progresso` e o login padrão do site; não criar nova identidade, tabela nem coleta de dados.
- Aplicar o mesmo arquivo de controles compartilhados aos módulos autocontidos, sem reescrever a lógica individual dos questionários.
- Fontes são extraídas/revisadas por módulo; não inferir citações ausentes a partir de um título genérico.

## Security
Sem nova classe de dados ou permissão: sincronização deve permanecer restrita à pessoa autenticada pela API existente. Não sincronizar em localhost ou arquivo local; não gravar respostas de aluno em logs, URL ou telemetria.

## Verification
- `tests/lg2-m01-turma-a.cjs`: 5,359 verificações do fluxo completo do piloto.
- `tests/lg2-diagnostico.cjs`: resumo com limite explícito, respostas "Não sei" e retorno ao módulo correspondente.
- `tests/unit/lg2/progresso.test.ts` e `tests/unit/app/api/lg2/progresso-route.test.ts`: sync, login, isolamento e confirmação.
- Rodar os testes browser individuais dos módulos, jornada e diagnóstico; capturar tela de capa, pergunta e saída/salvamento.
- Provar no código que rotas LG2 e API continuam protegidas pelo middleware/auth existente; nenhum teste de escrita em produção.
- Scans de secrets, vulnerabilidades e SAST antes de preparar release.
