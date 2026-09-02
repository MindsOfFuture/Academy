import { normalizeNextPath } from "@/lib/utils";
import { NextResponse } from "next/server";

const DEFAULT_APP_ORIGIN = "https://mindsofthefuture.com.br";

function redirectOrigin(request: Request): string {
  const requestUrl = new URL(request.url);
  const requestHost = request.headers.get("host")?.trim().toLowerCase();
  const forwardedHost = request.headers
    .get("x-forwarded-host")
    ?.split(",")[0]
    ?.trim()
    .toLowerCase();
  const isLocalRuntimeOrigin =
    ["localhost", "127.0.0.1", "[::1]"].includes(requestUrl.hostname) &&
    requestHost === requestUrl.host.toLowerCase() &&
    (!forwardedHost || forwardedHost === requestUrl.host.toLowerCase());

  // Em dev, request.url e Host apontam para o mesmo loopback. Fora disso, a
  // origem da requisição pode ter vindo de um Host controlado pelo cliente.
  if (isLocalRuntimeOrigin) {
    return requestUrl.origin;
  }

  const configuredOrigin = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configuredOrigin) {
    try {
      const configuredUrl = new URL(configuredOrigin);
      const isLoopback = ["localhost", "127.0.0.1", "[::1]"].includes(
        configuredUrl.hostname,
      );
      if (
        !isLoopback &&
        configuredUrl.protocol === "https:"
      ) {
        return configuredUrl.origin;
      }
    } catch {
      // Tenta o host efêmero da Vercel antes do domínio público conhecido.
    }
  }

  const vercelHost = process.env.VERCEL_URL?.trim();
  if (vercelHost) {
    try {
      const vercelUrl = new URL(`https://${vercelHost}`);
      if (!vercelUrl.username && !vercelUrl.password) {
        return vercelUrl.origin;
      }
    } catch {
      // Configuração inválida cai no domínio público conhecido do Academy.
    }
  }

  return DEFAULT_APP_ORIGIN;
}

/**
 * Cria redirect interno sem expor a origem do servidor (por exemplo,
 * localhost:3000 atrás do nginx) nem confiar em headers de host.
 */
export function redirectToInternalPath(
  path: string,
  request: Request,
  sourceResponse?: NextResponse,
): NextResponse {
  const safePath = normalizeNextPath(path);
  if (!safePath) {
    throw new Error("Destino interno de redirect inválido.");
  }

  const response = NextResponse.redirect(
    new URL(safePath, redirectOrigin(request)),
  );

  sourceResponse?.cookies.getAll().forEach((cookie) => {
    response.cookies.set(cookie);
  });

  return response;
}