import { NextResponse } from "next/server";
import { getLearningAnalytics, type AnalyticsScope } from "@/lib/api/learning-analytics";

const SCOPES = new Set<AnalyticsScope>(["global", "path", "course", "student"]);
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const scope = url.searchParams.get("scope") as AnalyticsScope | null;
  const id = url.searchParams.get("id") ?? undefined;
  const from = url.searchParams.get("from") ?? undefined;
  const to = url.searchParams.get("to") ?? undefined;

  if (!scope || !SCOPES.has(scope)
    || (scope !== "global" && (!id || !UUID_PATTERN.test(id)))
    || (from && Number.isNaN(Date.parse(from)))
    || (to && Number.isNaN(Date.parse(to)))
    || (from && to && Date.parse(from) > Date.parse(to))) {
    return NextResponse.json({ error: "Parâmetros de Analytics inválidos." }, { status: 400 });
  }

  try {
    const result = await getLearningAnalytics({ scope, id, from, to });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao carregar Analytics.";
    const status = message.includes("não autenticado") ? 401
      : message.includes("Acesso negado") || message.includes("administrador") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
