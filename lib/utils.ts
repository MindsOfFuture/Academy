import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Só aceita caminhos cuja resolução permaneça na origem interna. Também valida
 * decodificações sucessivas para bloquear controles e barras codificadas.
 */
export function normalizeNextPath(nextPath?: string | null): string | null {
  if (!nextPath) return null;

  const trustedOrigin = "https://academy.internal";
  let candidate = nextPath;

  for (let pass = 0; pass <= nextPath.length; pass += 1) {
    if (
      !candidate.startsWith("/") ||
      candidate.startsWith("//") ||
      candidate.includes("\\") ||
      /[\u0000-\u001f\u007f]/.test(candidate)
    ) {
      return null;
    }

    try {
      if (new URL(candidate, trustedOrigin).origin !== trustedOrigin) {
        return null;
      }

      const decoded = decodeURIComponent(candidate);
      if (decoded === candidate) return nextPath;
      candidate = decoded;
    } catch {
      return null;
    }
  }

  return null;
}
