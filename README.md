# Academy - Plataforma de Educação Tecnológica

Uma plataforma moderna de educação tecnológica desenvolvida para democratizar o acesso ao ensino de robótica e programação em escolas públicas de Minas Gerais, através de uma parceria entre a Universidade Federal de Juiz de Fora (UFJF) e o Governo de Minas Gerais.

## 🚀 Visão Geral

O **Academy** é uma aplicação web completa construída com as mais modernas tecnologias, oferecendo:
- **Plataforma de Cursos**: Sistema completo de gestão de cursos de robótica e programação
- **Dashboard Administrativo**: Gerenciamento de usuários, cursos e progresso dos alunos
- **Sistema de Autenticação**: Login/registro seguro com diferentes níveis de acesso
- **Interface Responsiva**: Design moderno e adaptável para todos os dispositivos
- **Experiências Interativas**: Animações e elementos visuais avançados com Three.js

## 🛠️ Stack Tecnológica

### Frontend
- **Next.js 15** com App Router
- **React 19** com TypeScript
- **Tailwind CSS** + **Tailwind Animate** para estilização
- **Framer Motion** para animações
- **Three.js** + **React Three Fiber** para gráficos 3D
- **Radix UI** para componentes acessíveis
- **Lucide React** para ícones
- **React Hot Toast** para notificações

### Backend & Banco de Dados
- **Supabase** para autenticação e banco de dados
- **Supabase SSR** para renderização server-side
- Middleware customizado para autenticação de rotas

### Bibliotecas Adicionais
- **Splide.js** para carrosséis
- **Swiper** para sliders
- **next-themes** para suporte a temas
- **Class Variance Authority** para variantes de componentes

## 📁 Estrutura do Projeto

```
Academy/
├── 📁 app/                          # App Router do Next.js
│   ├── 📄 layout.tsx               # Layout principal da aplicação
│   ├── 📄 page.tsx                 # Página inicial (landing page)
│   ├── 📁 auth/                    # Fluxo de autenticação
│   │   ├── 📄 page.tsx            # Página de login/registro
│   │   ├── 📁 confirm/            # Confirmação por email
│   │   ├── 📁 error/              # Páginas de erro
│   │   ├── 📁 forgot-password/    # Recuperação de senha
│   │   └── 📁 reset-password/     # Redefinição de senha
│   ├── 📁 course/                  # Páginas de cursos
│   └── 📁 protected/              # Área restrita (dashboard)
│       ├── 📄 layout.tsx          # Layout para área protegida
│       └── 📄 page.tsx            # Dashboard principal
│
├── 📁 components/                   # Componentes React
│   ├── 📁 api/                     # Integração com APIs
│   │   ├── 📄 indexApi.tsx        # API pública (cursos, artigos)
│   │   └── 📄 admApi.tsx          # API administrativa
│   ├── 📁 auth/                    # Componentes de autenticação
│   ├── 📁 dashboard/               # Componentes do dashboard
│   ├── 📁 ui/                      # Biblioteca de componentes UI
│   ├── 📁 navbar/                  # Barra de navegação
│   ├── 📁 hero_1/                  # Seção hero da landing page
│   ├── 📁 ourCourses/             # Seção de cursos
│   ├── 📁 about-us/               # Seção sobre nós
│   ├── 📁 ourArticles/            # Seção de artigos
│   ├── 📁 yourCourses/            # Cursos do usuário
│   ├── 📁 footer/                  # Rodapé
│   └── 📁 BlurryBackground/       # Background com efeitos visuais
│
├── 📁 lib/                         # Utilitários e configurações
│   ├── 📄 utils.ts                # Funções utilitárias
│   └── 📁 supabase/               # Configuração do Supabase
│       ├── 📄 client.ts           # Cliente Supabase (browser)
│       ├── 📄 server.ts           # Cliente Supabase (server)
│       └── 📄 middleware.ts       # Middleware de autenticação
│
├── 📁 public/                      # Assets estáticos
│   ├── 🖼️ logo.svg               # Logo principal
│   ├── 🖼️ logo_navbar.svg        # Logo da navbar
│   ├── 🖼️ logo_ufjf.svg          # Logo da UFJF
│   ├── 🖼️ bg-roxo.svg            # Background decorativo
│   └── 📷 [imagens dos cursos]    # Imagens dos cursos
│
└── 📁 Arquivos de Configuração
    ├── 📄 components.json         # Configuração dos componentes shadcn/ui
    ├── 📄 tailwind.config.ts      # Configuração do Tailwind CSS
    ├── 📄 next.config.ts          # Configuração do Next.js
    ├── 📄 middleware.ts           # Middleware global
    └── 📄 package.json            # Dependências e scripts
```

## 🎯 Funcionalidades Principais

### 🏠 Landing Page
- **Hero Section**: Apresentação do projeto com estatísticas dinâmicas
- **Seção de Cursos**: Catálogo completo de cursos disponíveis
- **Sobre Nós**: Carrossel de imagens e informações do projeto
- **Artigos**: Blog com conteúdo educacional
- **Footer**: Links para redes sociais e contatos

### 🔐 Sistema de Autenticação
- Login e registro de usuários
- Recuperação e redefinição de senhas
- Confirmação por email
- Diferentes níveis de acesso (usuário/administrador)

### 📊 Dashboard
- **Área do Aluno**: Visualização de cursos inscritos e progresso
- **Área Administrativa**: Gerenciamento completo de usuários e cursos
- Interface responsiva e intuitiva

### 🎓 Sistema de Cursos
- Estrutura modular (Cursos → Módulos → Aulas)
- Acompanhamento de progresso
- Integração com conteúdo multimídia

## 🎨 Design System

O projeto utiliza um design system moderno com:
- **Cores**: Paleta baseada em roxo e amarelo (identidade visual do projeto)
- **Tipografia**: Fonte system stack para melhor performance
- **Componentes**: Biblioteca baseada em Radix UI para acessibilidade
- **Animações**: Transições suaves com Framer Motion
- **Responsividade**: Mobile-first approach

## 🚀 Scripts Disponíveis

```bash
# Desenvolvimento com Turbopack
npm run dev

# Build de produção
npm run build

# Iniciar servidor de produção
npm start

# Linting
npm run lint
```

## 🌐 Deploy e Produção

O projeto está configurado para:
- **Vercel**: Deploy automático com Next.js
- **Supabase**: Backend em produção
- **CDN**: Assets estáticos otimizados

## 🤝 Contribuindo

Este projeto faz parte de uma iniciativa educacional importante. Para contribuir:

1. Fork o repositório
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto é mantido pela **Minds of Future** em parceria com a **UFJF** e **Governo de Minas Gerais**, com o objetivo de democratizar o acesso à educação tecnológica.

## 📞 Contato

Para dúvidas ou sugestões sobre o projeto, entre em contato através dos canais oficiais disponíveis no footer da aplicação.
