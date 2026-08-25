import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Só aceita caminhos internos como destino de redirect. Bloqueia open redirect
 * via `?next=https://evil.com`, `//evil.com` e `/\evil.com`.
 */
export function normalizeNextPath(nextPath?: string | null): string | null {
  if (!nextPath) return null;
  if (!nextPath.startsWith("/")) return null;
  if (nextPath.startsWith("//") || nextPath.startsWith("/\\")) return null;
  return nextPath;
}

// This check can be removed, it is just for tutorial purposes
export const hasEnvVars =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
