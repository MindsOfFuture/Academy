import { NextResponse } from "next/server";
import { getSiteMetrics } from "@/lib/api/site-metrics";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const from = url.searchParams.get("from") ?? undefined;
  const to = url.searchParams.get("to") ?? undefined;

  if ((from && Number.isNaN(Date.parse(from)))
    || (to && Number.isNaN(Date.parse(to)))
    || (from && to && Date.parse(from) > Date.parse(to))) {
    return NextResponse.json({ error: "Período inválido." }, { status: 400 });
  }

  try {
    return NextResponse.json(await getSiteMetrics({ from, to }));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao carregar os números do site.";
    const status = message.includes("não autenticado") ? 401
      : message.includes("Acesso negado") || message.includes("administrador") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
