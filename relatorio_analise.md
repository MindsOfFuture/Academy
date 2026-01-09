# Relatório de Análise do Repositório Academy

> **Última atualização**: 09/01/2026  
> Este relatório detalha os problemas encontrados, o que já foi corrigido e o que ainda resta fazer.

---

## 1. Estrutura e Organização do Projeto

### ✅ CORRIGIDO
- **Lógica de API em Componentes**: Toda a lógica de dados foi movida para `lib/api/`.
  - Arquivos criados: `types.ts`, `courses.ts`, `courses-server.ts`, `enrollments.ts`, `enrollments-server.ts`, `profiles.ts`, `profiles-server.ts`, `articles.ts`, `content.ts`, `learning-paths.ts`
  - A pasta `components/api/` agora é apenas uma camada de compatibilidade que reexporta as novas funções.

### ⚠️ PENDENTE
- **Inconsistência de Nomenclatura**:
  - Pastas ainda misturam convenções: `HomeClient` (PascalCase), `hero_1` (snake_case), `ourCourses` (camelCase), `about-us` (kebab-case).
  - **Ação necessária**: Padronizar todas as pastas de componentes (sugestão: kebab-case).

- **Estrutura Híbrida**: A pasta `components` ainda mistura agrupamento por funcionalidade e por tipo.
  - **Ação necessária**: Reorganizar em estrutura mais consistente.

---

## 2. Dependências e `package.json`

### ⚠️ PENDENTE
- **Versões "Latest"**: `next` e `@supabase/supabase-js` ainda estão definidos como `"latest"`.
  - **Risco**: Pode quebrar o projeto inesperadamente.
  - **Ação necessária**: Fixar versões específicas (ex: `"next": "16.1.1"`, `"@supabase/supabase-js": "2.x.x"`).

- **Bibliotecas Redundantes**: O projeto ainda possui tanto `swiper` quanto `@splidejs/react-splide`.
  - **Ação necessária**: Escolher apenas uma biblioteca de carrossel.

- **Bibliotecas Pesadas**: `three`, `@react-three/fiber` e `@react-three/drei` ainda estão no projeto.
  - **Observação**: Avaliar se são essenciais; podem impactar performance mobile.

---

## 3. Performance e Renderização (Next.js)

### ✅ CORRIGIDO
- **Waterfall de Requisições**: Agora usa `Promise.all` em `app/page.tsx`:
  ```typescript
  const [heroData, cursos, aboutus, footer, articles] = await Promise.all([
    getHero(),
    listCoursesServer(),
    getAboutUs(),
    getFooter(),
    getArticles(),
  ]);
  ```

- **Uso de Cliente Supabase no Servidor**: Criadas funções específicas para Server Components:
  - `lib/api/courses-server.ts` → usa `createClient` de `@/lib/supabase/server`
  - `lib/api/enrollments-server.ts` → usa `createClient` de `@/lib/supabase/server`

### ⚠️ PENDENTE
- **`suppressHydrationWarning`**: Ainda usado na tag `<html>` em `layout.tsx`.
  - **Observação**: Manter apenas se necessário para `next-themes`; caso contrário, investigar causa raiz.

---

## 4. Qualidade de Código

### ✅ CORRIGIDO
- **Tipagem Organizada**: Todos os tipos foram centralizados em `lib/api/types.ts`:
  - `RoleName`, `CourseSummary`, `LessonSummary`, `ModuleSummary`, `CourseDetail`
  - `UserProfileSummary`, `EnrollmentSummary`, `ArticleSummary`, `LearningPathSummary`

- **Dados Mockados**: `getArticles` agora busca da tabela `article` no Supabase.

- **Logs Removidos**: Console.logs de debug foram removidos das funções de API.

### ⚠️ PENDENTE
- **Tratamento de Erros**: Algumas funções ainda retornam silenciosamente `null` ou `[]`.
  - **Sugestão futura**: Implementar tratamento de erros mais robusto com feedback ao usuário.

---

## 5. Banco de Dados e Segurança (Supabase)

### ✅ CORRIGIDO (Sessão de hoje)
- **RLS Policies**:
  - Adicionadas políticas INSERT/DELETE para `user_role`
  - Adicionada política DELETE para `enrollment` (teachers/admins)
  - Corrigidas políticas RLS para `lesson_progress` (SELECT, INSERT, UPDATE com WITH CHECK)

- **Constraints**:
  - Adicionado UNIQUE constraint em `lesson_progress(enrollment_id, lesson_id)`
  - Adicionada coluna `updated_at` em `lesson_progress`
  - Adicionada coluna `description` em `lesson`

- **Sistema de Roles**: Atualizado de `adm/normal` para `admin/teacher/student`

- **Verificação de Admin**: `createAdminClient` agora verifica papel via tabela `user_role` → `role`

---

## 6. Funcionalidades Implementadas (Sessão de hoje)

### ✅ Gerenciamento de Cursos
- CRUD completo: criar, listar, atualizar, deletar cursos
- Criação de módulos com cálculo automático de ordem
- Criação de lições com título, descrição, duração e URL de conteúdo
- Exclusão em cascata (curso → módulos → lições → progresso)

### ✅ Sistema de Matrículas
- Listar alunos matriculados em curso
- Adicionar/remover alunos de cursos
- Verificar matrícula antes de mostrar conteúdo

### ✅ Progresso de Lições
- Marcar lição como concluída
- Toggle para desmarcar progresso
- Cálculo de percentual de conclusão por curso

### ✅ Visualização de Cursos
- Home page: lista todos os cursos públicos
- Dashboard: mostra cursos do usuário com progresso
- Página de curso: módulos, lições e marcação de progresso

---

## Resumo das Ações Pendentes

| Prioridade | Item | Descrição |
|------------|------|-----------|
| 🔴 Alta | Fixar versões | Alterar `"latest"` para versões específicas em `package.json` |
| 🟡 Média | Limpar dependências | Remover `swiper` ou `@splidejs/react-splide` (escolher uma) |
| 🟡 Média | Padronizar nomes | Renomear pastas de componentes para padrão único |
| 🟢 Baixa | Avaliar Three.js | Verificar se efeito Aurora justifica peso da biblioteca |
| 🟢 Baixa | Tratamento de erros | Melhorar feedback de erros para usuário final |

---

## Migrações Aplicadas (Supabase)

1. `list_tables` - Listagem inicial
2. `listar_tabelas` - Verificação de estrutura
3. `add_user_role_insert_delete_policies` - Políticas RLS para user_role
4. `add_enrollment_delete_policy_for_teachers_admins` - DELETE em enrollment
5. `add_description_to_lesson` - Coluna description em lesson
6. `fix_lesson_progress_rls_policy` - Correção inicial de RLS
7. `add_lesson_progress_unique_constraint` - UNIQUE em lesson_progress
8. `fix_lesson_progress_rls_with_check` - RLS com WITH CHECK
9. `add_updated_at_to_lesson_progress` - Coluna updated_at

---

## Arquivos Principais Criados/Modificados

### Novos (`lib/api/`)
- `types.ts` - Definições de tipos centralizadas
- `courses.ts` - CRUD de cursos (client-side)
- `courses-server.ts` - Leitura de cursos (server-side)
- `enrollments.ts` - Matrículas e progresso (client-side)
- `enrollments-server.ts` - Matrículas (server-side)
- `profiles.ts` - Perfis de usuário (client-side)
- `profiles-server.ts` - Perfis e ações de admin (server-side)
- `articles.ts` - Busca de artigos
- `content.ts` - Conteúdo estático (hero, footer)
- `learning-paths.ts` - Trilhas de aprendizagem

### Modificados
- `app/page.tsx` - Promise.all para fetch paralelo
- `app/course/page.tsx` - Toggle de progresso, URL de lições
- `components/dashboard/CourseManagement/*` - Formulário de lições completo
- `lib/supabase/server.ts` - Verificação de admin via role table
