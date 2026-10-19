import type { NextConfig } from "next";
import { assertSupabaseEnv } from "./lib/env";

// `next.config.ts` é carregado antes de build/dev/start. Assim uma configuração
// inválida falha antes de qualquer página ou client do Supabase ser avaliado.
assertSupabaseEnv();

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

// ponytail: subset de CSP sem script-src — bloqueia clickjacking/plugins/base-tag
// sem exigir nonce nos scripts inline do Next. Teto: XSS de script ainda executa.
// Upgrade: script-src com nonce via middleware quando houver orçamento p/ testar.
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'; object-src 'none'; base-uri 'self'" },
];

// A jornada completa do LG2 (public/lg2/jornada/) abre os módulos num iframe do próprio site.
// Só public/lg2/ aceita moldura, e só do mesmo domínio; o resto continua DENY / 'none'.
const lg2FrameHeaders = [
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'self'; object-src 'none'; base-uri 'self'" },
];

const nextConfig: NextConfig = {
  // Deploy autocontido em .next/standalone — único alvo é o VPS (ADR 018).
  output: "standalone",
  images: {
    remotePatterns: [
      // Storage do Supabase (avatares, capas, mídia dos cursos)
      ...(supabaseHost ? [{ protocol: "https" as const, hostname: supabaseHost }] : []),
      // Avatares do Google (login OAuth)
      { protocol: "https" as const, hostname: "lh3.googleusercontent.com" },
      // Fotos institucionais já cadastradas na página pública de créditos
      { protocol: "https" as const, hostname: "images.unsplash.com" },
      { protocol: "https" as const, hostname: "img.youtube.com" },
      { protocol: "https" as const, hostname: "i.ytimg.com" },
    ],
  },
  async headers() {
    // Ordem importa: a regra posterior sobrescreve a mesma chave da anterior.
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/lg2/:path*", headers: lg2FrameHeaders },
    ];
  },
};
export default nextConfig;
