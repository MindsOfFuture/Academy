# Documentação do Projeto Academy

Este documento descreve a estrutura de pastas e arquivos do projeto **Academy**, para facilitar o entendimento de futuros desenvolvedores.

## Visão Geral

O projeto é uma aplicação web construída com Next.js 13 (App Router), TypeScript e Tailwind CSS. Utiliza o Supabase como backend para autenticação e banco de dados.

## Estrutura de Pastas

```plaintext
- app/
  - favicon.ico: Ícone da aplicação.
  - globals.css: Estilos globais do Tailwind.
  - layout.tsx: Componente de layout principal, define cabeçalho, rodapé e provedor de estado.
  - page.tsx: Página inicial pública.
  - auth/
    - confirm/route.ts: Rota para confirmação de ações via token.
    - error/page.tsx: Página genérica de erro em fluxo de auth.
    - forgot-password/page.tsx: Página para solicitar redefinição de senha.
    - login/page.tsx: Página de login de usuário.
    - sign-up/page.tsx: Página de registro de novos usuários.
    - sign-up-success/page.tsx: Página exibida após registro bem-sucedido.
    - update-password/page.tsx: Página para atualizar senha.
  - protected/
    - layout.tsx: Layout específico para rotas protegidas.
    - page.tsx: Página inicial de área protegida (dashboard).

- components/
  - auth-button.tsx: Botão genérico de autenticação.
  - deploy-button.tsx: Botão para ações de deploy.
  - env-var-warning.tsx: Componente de alerta de variáveis de ambiente.
  - forgot-password-form.tsx: Formulário de solicitação de senha.
  - login-form.tsx: Formulário de login.
  - logout-button.tsx: Botão de logout.
  - next-logo.tsx: Logo do Next.js.
  - sign-up-form.tsx: Formulário de registro.
  - supabase-logo.tsx: Logo do Supabase.
  - theme-switcher.tsx: Alternador de tema (claro/escuro).
  - update-password-form.tsx: Formulário para atualizar senha.
  - aurora/: Componentes específicos do tema Aurora.
  - button/: Componentes de botão reutilizável.
  - counting/: Componente de contagem.
  - hero_1/: Componente de seção hero.
  - navbar/: Barra de navegação.
  - ourCourses/: Seção "Nossos Cursos".
  - tutorial/: Componentes para tutoriais e passos.
  - ui/: Biblioteca interna de componentes UI (badge, card, checkbox, dropdown, input, label).

- lib/
  - utils.ts: Funções utilitárias gerais.
  - supabase/
    - client.ts: Configuração do cliente Supabase.
    - middleware.ts: Middleware para autenticação de rotas.
    - server.ts: Funções server-side para interação com Supabase.

- public/
  - bg-roxo.svg: Imagem de fundo roxo.
  - logo_navbar.svg: Logo para navbar.
  - logo.svg: Logo principal.
```

## Arquivos de Configuração

- next.config.ts: Configurações do Next.js.
- tsconfig.json: Configurações do TypeScript.
- postcss.config.mjs: Configurações do PostCSS.
- tailwind.config.ts: Configurações do Tailwind CSS.
- eslint.config.mjs: Configurações do ESLint.
- middleware.ts: Middleware customizado global (ex. redirecionamento).
- package.json: Gerenciamento de dependências e scripts.
- README.md: Documentação inicial do projeto.

## Considerações Finais

Sinta-se livre para explorar cada pasta e arquivo para entender melhor a implementação. Em caso de dúvidas, consulte os comentários no código ou abra um issue.
