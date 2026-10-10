# 014 — Gestão de turmas, chamada e termos (M1)

Status: aprovada para implementação em 08/10/2026

## Autorização vigente

Rafael aprovou este escopo e autorizou alterações e publicação em produção no tópico 10724 do Telegram: "Sim e pode mexer em prod tb [...] quero q a glr consiga adicionar turmas alunos bolsistas etc". Essa autorização posterior substitui as referências históricas abaixo à aprovação pendente e à ausência de permissão de produção. Executar primeiro testes locais e revisão das migrations; nenhuma conta real será usada para testes com escrita ou notificações. Não alterar arquivos originais do Drive nem importar correspondências ambíguas automaticamente. Retenção documental continua indefinida: o cadastro de turmas, alunos e equipe não depende disso; armazenamento real de termos fica bloqueado até a política ser definida. A ampliação de busca de pessoas e navegação está na spec 015.
Constituição: `specs/constitution.md`
Plano-pai: `docs/plans/gestao-dia-a-dia.md`, M1 (antes referido como spec 004).

Em 08/10/2026, Rafael confirmou no tópico 10724 do Telegram ("1 s 2 inclui")
duas decisões de produto: usar Levantamentos e os controles de turmas de 2026 como
fontes oficiais prioritárias; incluir arquivo assinado, status e data de conferência
do termo desde a primeira versão. A autorização posterior registrada acima aprovou
a implementação e publicação; importação real e alteração de originais continuam
sujeitas à revisão dos vínculos e autorização expressa da virada.

## Problema

Coordenação e bolsistas precisam abrir pastas e planilhas diferentes para organizar
uma turma, registrar a chamada, conferir termos e conhecer as pendências reais.

## Escopo

- A coordenação cria e encontra turmas por escola, modalidade, semestre e situação
  (planejada, em andamento, encerrada ou cancelada), a partir de uma reserva ou do zero;
  matricula alunos e agenda encontros com data e horário.
- A coordenação revisa a importação dos controles oficiais antes de confirmar os
  registros. Começa por Levantamentos e turmas de 2026; o histórico anterior fica para
  uma etapa posterior. Homônimos e divergências exigem decisão humana.
- O bolsista ativo vê as turmas em que está alocado e registra ou corrige a chamada
  apenas dos seus encontros, pelo celular. A chamada distingue presença, ausência e
  informação ainda não confirmada; não começa com todos presentes.
- A coordenação guarda o termo assinado por aluno e turma, acompanha seu status
  (pendente ou arquivado), quem conferiu e a data da conferência. Somente a coordenação
  ativa pode enviar, conferir ou ler os documentos; o bolsista pode ver o status
  necessário à chamada, mas não o arquivo nem seus dados documentais.
- A coordenação imprime a lista de presença com escola, turma, encontro, módulo/aula,
  horário, professor, alunos, indicação do termo, bolsistas e espaços para assinaturas,
  sem expor o conteúdo dos termos.
- A turma mostra matrículas, encontros previstos e realizados, horas-aula, presença,
  termos pendentes e arquivados e certificados entregues, derivados dos registros reais.
  Falta de informação aparece como pendência, não como zero ou resultado confirmado.
- Ao encerrar, a coordenação vê encontros sem chamada, chamadas incompletas e termos
  pendentes; diários faltantes aparecem quando esse recurso existir. Pode confirmar o
  encerramento com pendências, preservando-as visíveis e registrando quem encerrou e quando.
- Após migração real conferida e virada expressamente autorizada, a operação da turma
  acontece no sistema, sem planilhas externas paralelas. Os originais só passam a
  somente leitura nessa virada; este rascunho não altera nenhum original.

**Fora de escopo:** diário de bordo, disponibilidade/carga mensal, financeiro,
relatório mensal, avaliação da escola, emissão de certificado, assinatura digital,
sincronização contínua com planilhas, fotos de divulgação, novos campos de CPF ou
bancários e cópia automática de telefone/e-mail de alunos. O critério de elegibilidade
a certificado não é fixado neste rascunho; não apresentar o limiar provisório de 75%
do plano-pai como decisão aprovada.

## Emenda proposta à spec 002

Alterar somente a exclusão de documento digitalizado/termo assinado no trecho
**Fora de escopo**, no critério de aceite sobre minimização e na descrição do termo:
o M1 passa a admitir o arquivo do termo assinado, além do status e da conferência,
com acesso exclusivo da coordenação ativa. A spec 002 não é editada nesta tarefa.

Continuam proibidos novos campos independentes de CPF e dados bancários. O conteúdo
do termo não será extraído para cadastro, indicadores ou auditoria. Esta exceção
não libera outros documentos pessoais nem muda as demais regras da spec 002.
A política de retenção ainda não foi definida; não se presume prazo legal obrigatório.

## Critérios de aceite

- [ ] Dada a coordenação ativa, quando cria uma turma, matricula 30 alunos e agenda
      encontros, então consulta tudo na turma sem abrir uma planilha; horário final
      anterior ou igual ao inicial é recusado com mensagem clara.
- [ ] Dadas as fontes de 2026, quando prepara uma importação, então vê origem, período,
      registros propostos, vínculos, duplicatas, divergências e itens não mapeados antes
      de confirmar; nada é gravado sem essa confirmação.
- [ ] Dado o mesmo lote confirmado, quando é reenviado, então não duplica turmas,
      alunos, matrículas, encontros, presenças ou termos; alterações na fonte voltam
      para revisão e não sobrescrevem silenciosamente registros corrigidos.
- [ ] Dados dois nomes iguais ou parecidos sem identidade comprovada, quando importa
      ou cola a lista, então não os une automaticamente e pede revisão da coordenação.
- [ ] Dada uma célula vazia ou marca de presença desconhecida, quando importa,
      então permanece não confirmada, aparece na revisão e não conta como presença
      nem ausência; encontros sem comprovação não viram aulas realizadas.
- [ ] Dado um bolsista ativo alocado, quando registra a chamada do próprio encontro,
      então vê o resultado salvo e a autoria; reenviar não cria outra aula ou presença.
      A chamada de 30 alunos pode ser concluída em menos de um minuto no celular.
- [ ] Dado um bolsista sem alocação naquela turma, quando tenta abrir seus alunos,
      encontros, chamada ou indicadores, inclusive por acesso direto, então não recebe
      dados; na mesma escola, a alocação em outra turma não concede acesso.
- [ ] Dada a coordenação ativa, inclusive quem acumula o papel de bolsista, quando
      envia e confere um termo, então vê o arquivo privado, status, responsável e data.
      Envio sozinho não equivale a conferência; status legado sem arquivo continua
      identificado como tal e com a falta do arquivo visível.
- [ ] Dado um bolsista, mesmo alocado, um administrador do produto público sem
      coordenação da gestão, usuário sem vínculo ou membro desligado, quando tenta
      enviar, ler ou obter acesso ao documento, então a operação é negada e não revela
      arquivo ou endereço de acesso. Anônimo vai ao login; sem papel, a gestão mostra
      página não encontrada. Desligado não lê nem grava dados da gestão.
- [ ] Dada a coordenação autorizada, quando abre um documento, então recebe acesso
      temporário curto; após expirar, o endereço não funciona. Não existe endereço
      público permanente nem armazenamento público de termos.
- [ ] Dada uma turma com chamadas completas e outra com lacunas, quando consulta os
      indicadores, então os totais podem ser conferidos nos registros de origem;
      presença confirmada, ausência e não informado aparecem separadamente. Frequência
      usa presenças sobre chamadas confirmadas, mostra o denominador e a cobertura e
      fica identificada como parcial enquanto houver lacunas; sem base, mostra
      indisponível, não 0%. Horas-aula somam apenas encontros comprovadamente realizados
      com duração conhecida, e duração faltante aparece como pendência.
- [ ] Dada a lista da turma, quando imprime, então sai legível com cabeçalho, alunos
      matriculados e espaços para assinatura, sem anexar termos ou dados documentais.
- [ ] Dada uma turma com pendências, quando a coordenação solicita encerramento,
      então vê a lista antes de confirmar; ao confirmar, registra autor e instante,
      mantém as pendências e não inventa presenças, termos, diários ou avaliações.
- [ ] Dada uma escrita autorizada, quando salva ou corrige um registro, então preserva
      rastreabilidade de quem, quando e qual operação, sem copiar conteúdo pessoal do
      termo para o histórico de auditoria.
- [ ] Dado este rascunho ou sua futura aprovação, quando inspeciona os ambientes e
      originais, então não ocorreu importação, migration, publicação ou mudança para
      somente leitura por consequência automática da aprovação documental.

## Plano

Implementação local autorizada, sem alterações em produção pelo implementador.
Arquivos deste recorte: `lib/api/gestao/turmas.ts`, `turmas-types.ts` e
`turmas-validacao.ts`; `app/gestao/turmas/**`, `app/gestao/alunos/**`, as entradas em
`app/gestao/abas.ts` e `app/gestao/page.tsx`; migration
`supabase/migrations/20261008_gestao_turmas.sql`; teste PGlite em
`tests/integration/gestao-turmas-migration.test.ts` e testes unitários espelhados.
Não modifica os módulos de equipe, cabeçalho, tipos ou cadastros existentes.

- **Recorte entregue:** escolas, turmas, edição/cancelamento, aluno manual sem
  conta/e-mail, matrícula/finalização, alocação/revogação por turma e encontro.
  Cadastro de aluno com matrícula usa uma transação; remoção operacional preserva
  histórico por fim/cancelamento/revogação, sem apagar presenças anteriores.
- **Chamada:** reutiliza `agenda`, `aula` e `presenca`; aula M1 única por encontro,
  reenvio corrige a mesma presença. Ausência de linha significa desconhecido;
  confirmação explícita de realização é exigida antes de marcas conhecidas.
  A autoria vem do banco; nomes mínimos de responsáveis são resolvidos sob o
  mesmo escopo da turma. Atalho de presença em lote exige gesto explícito e revisão
  das exceções; nenhuma chamada começa com alunos presentes.
- **Legado e autorização:** agendas sem turma conservam sua alocação histórica;
  matrícula M1 impede que a leitura legada por escola revele aluno de turma alheia.
  Alocação antiga na escola não dá acesso a agenda/chamada/indicadores de turma nova.
  RLS de turma, matrícula, alocação e views usa vínculo ativo específico. Os dados
  existentes não são importados, reenquadrados ou alterados pela migration.
- **Pendências e indicadores:** frequência usa somente marcas confirmadas, mostra
  denominador e cobertura; sem marcas confirmadas permanece indisponível. Horas
  somam encontros comprovados com duração; fechamento tem confirmação e conserva
  as pendências. A impressão lista escola, turma, módulo, horário, professor,
  alunos, status do termo, bolsistas e assinaturas, sem documentos privados.
- **Termos:** metadata privada e bucket privado preparados. Status de reserva é
  conciliado explicitamente por aluno/reserva/matrícula; legado arquivado continua
  sem arquivo e sem conferência, contado como pendência. Escrita, envio, conferência
  e acesso a arquivos reais seguem bloqueados no banco e no aplicativo até retenção
  definida. As policies restritivas do bucket também impedem uma policy global
  permissiva de abrir os documentos. Leitura temporária de arquivo e teste de
  expiração ainda dependem de liberar esse fluxo com retenção aprovada.
- **Importação parcial:** prévia local de vínculos já escolhidos por identificador,
  origem/linha, período e lote; nada é gravado na preparação. Confirmação explícita,
  idempotência por lote e recusa de conteúdo alterado sem novo lote revisado.
  Não é importador completo dos controles reais: pareamento dos arquivos, parser
  por formato e importação de turmas/encontros/presenças permanecem abertos.

Restrições permanentes:

- **Degrau da escada:** reutilizar `lib/api/gestao/auth.ts`, `entities.ts`,
  `indicators.ts`, `types.ts`, `pendencias.ts`, o cliente SSR autenticado e os testes
  PGlite existentes. Nenhuma dependência nova prevista.
- **Dados:** evoluir `gestao` a partir das migrations de modelo operacional,
  fundação e papéis acumulados, sem recriar cadastros paralelos. Reusar aluno,
  reserva, agenda, alocação, aula e presença; acrescentar turma, matrícula e vínculo
  privado do termo. A unicidade atual por aula/aluno deve ser preservada. Ausência de
  registro pode representar presença não informada; nunca converter lacunas em
  `presente = false`. Reconciliar termos de reserva com matrícula sem dupla contagem
  e preservar origem, status legado e histórico. Importação exige identificação
  estável da origem/lote e conciliação revisável, não deduplicação apenas por nome.
- **Convenções:** consultas apenas em `lib/api/gestao`, schema explícito e mapeamento
  de `*Row` para `*Summary`/`*Detail`. Autoria e auditoria seguem as convenções atuais,
  sem copiar o conteúdo dos arquivos para logs.
- **Autorização:** `ensureGestaoMember()` e RLS no servidor; coordenação ativa para
  gestão e documentos, bolsista ativo por turma/encontro alocado. Refinar o escopo
  atual por escola da fundação. Papéis acumulados seguem a spec 012 e desligamento
  nega ambos. Indicadores respeitam RLS (`security_invoker` nas views); nenhum acesso
  por `admin` público, service role ou novo prefixo público.
- **Arquivos privados:** não reutilizar upload que devolve URL pública. Usar bucket
  privado, políticas coerentes com coordenação ativa e URLs assinadas de curta
  validade, emitidas após nova checagem de autorização. Definir o prazo exato na
  revisão do plano técnico; a expiração do link não é política de retenção.
- **Validação local:** provar autorização e negações também fora da interface,
  isolamento entre turmas da mesma escola, idempotência, conciliação, indicadores
  incompletos e impressão. Migration deve ser idempotente e testada localmente.

### Verificação local do recorte

- `NODE_OPTIONS=--no-experimental-webstorage npm test -- --run tests/integration/gestao tests/unit/lib/api/gestao tests/unit/app/gestao`: saída 0, 26 arquivos e 166 testes passaram. Inclui os testes atuais da gestão e o recorte de Turmas; não substitui a suíte completa com cobertura do responsável pela integração.
- `NODE_OPTIONS=--no-experimental-webstorage npx tsc --noEmit --incremental false`: saída 0.
- ESLint direcionado aos três módulos de API, às rotas novas e às duas entradas da gestão: saída 0; `git diff --check`: saída 0.
- PGlite executa a migration duas vezes antes dos dados M1 e outra vez após os cadastros, verificando que a auditoria não muda; testa chamada com 30 matrículas, 10 presenças, 10 ausências e 10 desconhecidos, sem duplicação no reenvio.
- Mutação local da policy de aluno para leitura por escola, com `M1_POLITICA_INSEGURA=1` e filtro `-t 'preserva o encontro legado'`: saída 1, exatamente o teste de isolamento falhou por revelar o segundo aluno. A mutação existe somente no banco descartável do teste; a migration e a policy de produção não foram alteradas por essa prova.
- Não foram executados deploy, importação real, upload real nem alteração dos originais. A experiência de menos de um minuto no celular, a impressão paginada real e as consultas SSR/PostgREST no ambiente compartilhado ainda precisam de verificação operacional.

## Tarefas

- [x] Aprovação de implementação/publicação registrada em 08/10/2026; preservar
      bloqueio de documentos reais sem retenção e de alterações automáticas no Drive.
- [x] Implementar cadastros, matrícula, alocação específica, encontros, chamada,
      indicadores parciais, impressão e fechamento com pendências em código local.
- [x] Provar migration repetida, RLS e idempotência em PGlite com dados fictícios;
      executar testes direcionados de API, ações e interface.
- [ ] Fechar pareamento das fontes reais, parser completo e conciliação de contagens
      de turmas/alunos/encontros/presenças/termos antes da importação real.
- [ ] Definir retenção, descarte e responsabilidade; só depois implementar/liberar
      upload, conferência, leitura temporária e prova da expiração dos termos reais.
- [ ] Revisão final, lint/build, aplicação da migration e deploy pelo responsável
      pela publicação; verificar acesso SSR/PostgREST e experiência no celular.
- [ ] Solicitar autorização explícita da virada antes de tornar originais somente leitura.

## Aberto

- A coordenação precisa definir retenção, descarte e responsabilidade pelos termos
  assinados antes do armazenamento real. Nenhuma duração legal foi presumida.
- Fechar os controles canônicos de cada turma de 2026 e o mapeamento completo das
  marcas de chamada; a inspeção sanitizada foi amostral, não valida todos os arquivos.
  A conferência adicional de Levantamentos/2026 encontrou 34 linhas com escola,
  não 34 turmas únicas validadas; todos os status estavam vazios e não foram
  encontrados links nas fórmulas ou campos de hiperlink consultados em A1:O1000.
  Não inferir situação ativa/encerrada nem localizar controles automaticamente:
  a correspondência com os arquivos de turma permanece pendente de revisão.
  Ver `docs/plans/gestao-turmas-importacao-2026.md` para o mapeamento concreto.
- Confirmar critério de elegibilidade a certificado. A apresentação de frequência
  com denominador, cobertura e lacunas segue esta spec aprovada; não define um limiar
  de emissão de certificado.
- M1 não está integralmente concluído: importação real conferida, documentos reais
  com retenção definida, verificação final no ambiente compartilhado e virada dos
  originais continuam pendentes. A aprovação não executa nenhuma dessas etapas
  automaticamente.

Referências: specs 002, 003 e 012; plano-pai M1/D1; inventário sanitizado
`minds-gestao-fontes-drive.md` (Levantamentos, controle São João Nepomuceno de 2026
 e Lista de presença Base). O controle de termos de 2023 é referência histórica,
não fonte prioritária da primeira migração.
