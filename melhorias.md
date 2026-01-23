Validar variáveis de ambiente — Criar lib/env.ts com schema Zod para validar NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY em runtime, removendo as asserções non-null (!) em client.ts e server.ts.

Restringir domínios de imagem — Em next.config.ts, substituir wildcard ** em remotePatterns por domínios específicos do Supabase Storage.

Consolidar código duplicado — A função mapCourseFromDb está duplicada em courses.ts, courses-server.ts e enrollments.ts. Extrair para um arquivo lib/api/mappers.ts compartilhado.

Melhorar tipagem — Gerar tipos automáticos do Supabase (npx supabase gen types typescript) e substituir as conversões as unknown as por tipos genéricos adequados em enrollments.ts.

Implementar tratamento de erros centralizado — Criar classe AppError em lib/errors.ts e substituir console.error dispersos por logging estruturado, especialmente em auth-forms.tsx.

Aumentar cobertura de testes — Adicionar testes para middleware.ts e middleware.ts, além de aumentar thresholds em vitest.config.ts de 60% para 80%.

Further Considerations
Pasta legada services — Parece não utilizada. Remover ou migrar conteúdo para lib?
Caching de dados — Implementar unstable_cache ou revalidate nos Server Components para melhorar performance?
ESLint para console.log — Adicionar regra "no-console": ["warn"] em eslint.config.mjs para prevenir logs em produção?