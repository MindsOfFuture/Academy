# 010 — Histórico detalhado de alteração dos módulos

Status: aprovada — pedido direto do Rafael em 23/09/2026 para desenvolver o plano validado; revisão final no PR
Constituição: `specs/constitution.md`

## Problema

Professores e administradores não conseguem saber quem alterou ou excluiu cursos, módulos e aulas, nem recuperar o conteúdo necessário para refazer uma exclusão por engano.

## Escopo

Professores passam a consultar a linha do tempo dos cursos que administram, com autoria, data, campos modificados e valores anteriores e posteriores de cada alteração. Administradores podem consultar todo o histórico. A linha do tempo oferece filtros por módulo, autor e período, e uma exclusão conserva os dados apagados para que o conteúdo possa ser recriado manualmente.

**Fora de escopo:** restauração automática, comparação visual entre versões e histórico de matrículas, atividades ou progresso dos alunos.

## Critérios de aceite

- [ ] Dado um módulo existente, quando seu título é renomeado, então surge uma linha com autor, estado anterior, estado posterior e somente o título entre os campos alterados.
- [ ] Dado um módulo com três aulas, quando ele é excluído, então surgem quatro linhas e o conteúdo apagado permanece legível para recriação manual.
- [ ] Dado um professor, quando consulta um curso alheio, então não vê seu histórico; o proprietário vê o histórico do próprio curso e o administrador vê todos.
- [ ] Dada qualquer linha do histórico, quando até um administrador tenta alterá-la ou apagá-la, então a operação é rejeitada.
- [ ] Dado um conteúdo cujo único valor modificado é o carimbo de tempo, quando a atualização ocorre, então nenhuma linha é gerada.

## Plano

- **Degrau da escada:** reutilizar o cliente Supabase do navegador, os tipos e mapeadores da camada de API, o padrão de auditoria append-only já aplicado no schema de gestão, o harness PGlite de migrations e os estilos existentes da gestão de cursos.
- **Arquivos:** `specs/010-historico-conteudo.md`, `supabase/migrations/20260923_historico_conteudo.sql`, `tests/integration/historico-conteudo-migration.test.ts`, `lib/api/content-history.ts`, `lib/api/types.ts`, `components/dashboard/CourseManagement/HistoryTab.tsx`, `components/dashboard/CourseManagement/courseDetail.tsx`, `tests/unit/lib/api/content-history.test.ts`.
- **Dados:** criar `public.historico_conteudo` e triggers sobre `public.course`, `public.course_module` e `public.lesson`; guardar a linha anterior e posterior em JSON, os campos alterados, o autor e o curso relacionado.
- **Autorização:** cliente Supabase do navegador sujeito a RLS; leitura para `authenticated` quando `public.is_admin()` for verdadeira ou quando `auth.uid()` for proprietário do curso; nenhuma rota pública e nenhum uso de cliente com service role.
- **Dependência nova:** nenhuma.
- **Atalhos:** nenhum.

## Tarefas

- [ ] Criar migration idempotente com captura genérica, proteção append-only, RLS e grants — `supabase/migrations/20260923_historico_conteudo.sql`
- [ ] Mapear e descrever o histórico em português pelo cliente do navegador — `lib/api/content-history.ts`, `lib/api/types.ts`
- [ ] Exibir linha do tempo e filtros na gestão do curso — `components/dashboard/CourseManagement/HistoryTab.tsx`, `components/dashboard/CourseManagement/courseDetail.tsx`
- [ ] Teste: provar idempotência, captura, exclusão, descarte de carimbo, leitura autorizada e imutabilidade — `tests/integration/historico-conteudo-migration.test.ts`
- [ ] Teste: quebrar quando o mapeamento ou a frase em português mudar incorretamente — `tests/unit/lib/api/content-history.test.ts`

## Aberto

Nenhuma decisão em aberto.
