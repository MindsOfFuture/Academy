# Academy – Plataforma de Educação Tecnológica

Uma plataforma visada a democratizar o ensino de robótica e programação nas escolas públicas de Minas Gerais. Projeto realizado em parceria entre a Universidade Federal de Juiz de Fora (UFJF), Governo de Minas Gerais e Minds of Future.

## 🚀 Visão Geral

O **Academy** é uma aplicação web full-stack construída sobre **Next.js** e **Supabase**, oferecendo:

- Plataforma de cursos modular (Cursos → Módulos → Aulas / Atividades)
- Interface responsiva, acessível e animada

## 🛠️ Stack Tecnológica (atual)

| Camada | Tecnologias |
|--------|-------------|
| Framework | Next.js 15.x (App Router) |
| Linguagem | React 19 + TypeScript 5 |
| Estilo | Tailwind CSS 3 + tailwindcss-animate + `clsx` + `tailwind-merge` |
| UI/Acessibilidade | Radix UI (checkbox, dropdown, label, slot) + HeroUI |
| Estado / Helpers | Class Variance Authority (CVA) para variantes de componentes |
| 3D / Visual | Three.js, @react-three/fiber, @react-three/drei, maath, OGL |
| Animações | Framer Motion |
| Ícones | lucide-react |
| Carrosséis / Slides | Splide.js (@splidejs/react-splide), Swiper |
| Temas | next-themes |
| Notificações | react-hot-toast |
| Backend / Auth / DB | Supabase JS + SSR (`@supabase/ssr`) |
| Lint / Qualidade | ESLint 9 + eslint-config-next (core-web-vitals) |

> Observação: Dependências com versão `latest` (ex.: `next`, `@supabase/supabase-js`) podem variar. Consulte o `package.json` para estados precisos no momento do clone.

## 🔐 Autenticação & Segurança

- Middleware (`lib/supabase/middleware.ts`) garante sessão válida e redireciona usuários não autenticados.
- Clientes separados: `client.ts` (browser), `server.ts` (SSR) e `createAdminClient()` com validação de perfil.
- Chave de serviço (`SUPABASE_SERVICE_ROLE_KEY`) usada somente no servidor (NUNCA exponha em `NEXT_PUBLIC_*`).
- Checagem de variáveis de ambiente via utilitário `hasEnvVars`.

### Variáveis de Ambiente Necessárias

Crie um arquivo `.env.local` na raiz com:

```bash
NEXT_PUBLIC_SUPABASE_URL=xxxxxxxxxxxxxxxx
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxxxxxxxxxxxxx
# Apenas no servidor / Vercel (não expor ao cliente):
SUPABASE_SERVICE_ROLE_KEY=xxxxxxxxxxxxxxxx
```

## � Estrutura Atual (principais diretórios)

```
app/
    layout.tsx
    page.tsx
    auth/ (login, registro, recuperação, confirmação, erros)
    course/
    protected/ (dashboard restrito)
        layout.tsx
        page.tsx
        activitie/
        perfil/
            layout.tsx
            page.tsx
        trilhas/
components/
    api/ (indexApi, admApi, courseApi, students)
    auth/ (forms e botões)
    dashboard/ (users table, modals, CourseManagement/*)
    ui/ (design system local – badge, button, card, input, label)
    navbar/, hero_1/, ourCourses/, ourArticles/, about-us/, footer/
    trilhas/, yourCourses/, activitie_cards/, activities/, profile/
    BlurryBackground/, aurora/, button/, cards/, counting/
lib/
    utils.ts (helpers: cn, hasEnvVars)
    supabase/ (client, server, middleware, student_projects)
public/ (logos, imagens)
config (root arquivos: tailwind.config.ts, next.config.ts, eslint.config.mjs)
```

## 🎯 Principais Funcionalidades

### Landing Page
- Hero com métricas dinâmicas
- Carrosséis de cursos e trilhas
- Seção “Sobre Nós” com imagens e narrativa
- Artigos educativos
- Footer com canais oficiais

### Sistema de Cursos
- Organização modular (Curso → Módulos → Aulas / Atividades)
- Gerenciamento administrativo de detalhes do curso, estudantes e módulos
- Progresso do aluno e listagem personalizada

### Dashboard
- Área do aluno (inscrições, progresso)
- Área do administrador (CRUD de usuários e cursos, paginação, busca, modais de edição/remoção)

### Autenticação
- Registro, login, recuperação e redefinição de senha
- Confirmação por e-mail
- Proteção SSR de rotas privadas
- Elevação para cliente administrativo após checagem de perfil (`type === "adm"`)

### Experiência & UI
- Tema dinâmico (dark/light)
- Animações suaves (Framer Motion)
- Elementos 3D e fundos animados (Three.js / Aurora / BlurryBackground)
- Componentização reutilizável via estratégia CVA & Radix

## 🎨 Design System

Baseado em:
- Paleta roxo / amarelo (identidade)
- Componentes acessíveis (Radix + HeroUI + layer própria `components/ui`)
- Utilização de variantes (CVA) para consistência e escalabilidade
- Foco em performance: system fonts + render SSR

## 🧪 Qualidade, Testes & Lint

- **Lint**: ESLint configurado com `next/core-web-vitals` e TypeScript strict.
- **Testes**: Vitest configurado para testes unitários e de integração.
- **Coverage**: Cobertura de testes disponível (opcional com `--coverage`).

Recomenda-se executar `npm run lint` e `npm test` antes de abrir PR.

## 🚀 Scripts Disponíveis

```bash
# Desenvolvimento (Turbopack habilitado)
npm run dev

# Build de produção
npm run build

# Servir build
npm start

# Lint
npm run lint

# Rodar testes unitários (watch mode)
npm test

# Rodar testes (única execução)
npx vitest run
```

## ⚙️ Instalação & Uso Local

```bash
git clone <url-do-repositorio>
cd Academy
npm install
cp .env.example .env.local   # Se você criar um modelo de exemplo
# Edite .env.local com suas chaves Supabase
npm run dev
```

Depois acesse: `http://localhost:3000`.

## 🌐 Deploy

- **Vercel**: Deploy rápido (importar repositório, adicionar variáveis de ambiente).
- **Supabase**: Criar projeto, copiar URL e ANON KEY, gerar Service Role Key para uso apenas no backend.
- **Boas práticas**: Jamais expor `SUPABASE_SERVICE_ROLE_KEY` em público ou no cliente.

## 🔄 Fluxo SSR + Auth (Resumo)

1. Middleware verifica sessão (`supabase.auth.getUser()`).
2. Redireciona visitantes não autenticados para `/auth` (exceto rota pública `/`).
3. Em rotas administrativas, `createAdminClient()` valida antes de liberar operações sensíveis.

## 🤝 Contribuindo

1. Faça fork
2. Crie branch: `git checkout -b feature/minha-feature`
3. Implemente e rode `npm run lint`
4. Commit: `git commit -m "feat: minha feature"`
5. Push: `git push origin feature/minha-feature`
6. Abra Pull Request descrevendo objetivo e contexto

## 🛡️ Segurança

- Nunca commitar `.env.local`
- Rotas protegidas checam sessão; operações administrativas validam tipo de usuário
- Service role restrito ao backend (funções server-side / edge)

## 📝 Licença / Direitos

Projeto mantido por **Minds of Future** em parceria com **UFJF** e **Governo de Minas Gerais**. Uso educacional e de impacto social.

## 📞 Contato

Use os canais oficiais no footer da aplicação ou abra uma Issue com a tag apropriada.

---
Se algo estiver desatualizado, abra uma Issue ou PR propondo ajuste. Boas contribuições! 🚀