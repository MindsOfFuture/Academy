import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { missingSupabaseEnv } from "../env";
import { redirectToInternalPath } from "./redirect";

const PUBLIC_PATH_PREFIXES = [
  "/auth",
  "/oauth/consent",
  "/termos",
  "/privacidade",
  "/artigos",
  "/validar",
  "/creditos",
  "/api/articles",
  "/api/auth/oauth-complete-profile",
  "/api/auth/oauth-ensure-teacher-role",
  "/api/auth/teacher-qualification-upload",
  "/api/notifications",
] as const;

export function isPublicPath(pathname: string): boolean {
  if (pathname === "/") return true;
  return PUBLIC_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

const EXEMPT_PATH_PREFIXES = ["/_next/static", "/_next/image"] as const;
const EXEMPT_ASSET_EXTENSIONS = /\.(?:svg|png|jpg|jpeg|gif|webp)$/i;

/**
 * Caminhos que o guard de env não bloqueia: assets, favicon e health check.
 * Espelha o matcher de `middleware.ts` para assets; o health check precisa chegar
 * à rota mesmo quando a configuração do Supabase está indisponível.
 */
export function isExemptPath(pathname: string): boolean {
  if (pathname === "/favicon.ico" || pathname === "/api/health") return true;
  if (EXEMPT_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return true;
  }
  return EXEMPT_ASSET_EXTENSIONS.test(pathname);
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // Fail-closed: sem as env vars do Supabase não há como autenticar ninguém, então
  // nega em vez de liberar. Assets e health check seguem passando para preservar
  // a página de erro e a observabilidade operacional.
  const missingEnv = missingSupabaseEnv();
  if (missingEnv.length > 0) {
    if (isExemptPath(request.nextUrl.pathname)) {
      return supabaseResponse;
    }
    console.error(
      `[supabase/middleware] variáveis de ambiente obrigatórias ausentes: ${missingEnv.join(", ")} — respondendo 503 em todas as rotas não isentas`,
    );
    // Corpo genérico de propósito: nada de nome de variável ou detalhe de config.
    return new NextResponse("Service Unavailable", {
      status: 503,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: DO NOT REMOVE auth.getUser()

  let user: Awaited<ReturnType<typeof supabase.auth.getUser>>["data"]["user"] | null = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user ?? null;
  } catch (error) {
    console.error("[supabase/middleware] getUser failed", error);
  }

  if (!user && !isPublicPath(request.nextUrl.pathname)) {
    const nextPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;
    const search = new URLSearchParams({ next: nextPath });
    return redirectToInternalPath(
      `/auth?${search.toString()}`,
      request,
      supabaseResponse,
    );
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse;
}
