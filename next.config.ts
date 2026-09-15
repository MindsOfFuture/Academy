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

const nextConfig: NextConfig = {
  // Deploy autocontido em .next/standalone (VPS). Vercel ignora.
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
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};
export default nextConfig;
