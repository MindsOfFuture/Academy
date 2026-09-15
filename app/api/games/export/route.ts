import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  exportGameAnswers,
  summarizeGameSessions,
  toCsv,
  GameTelemetryHttpError,
} from "@/lib/api/game-telemetry-server";
import { GAME_KEYS, type GameKey } from "@/lib/api/game-telemetry-types";

const MAX_PAGE = 50000;

function statusFor(message: string): number {
  if (message.includes("não autenticado")) return 401;
  if (message.includes("Acesso negado") || message.includes("administrador")) return 403;
  return 500;
}

export async function GET(request: Request) {
  // A rota está fora do redirecionamento do middleware para poder responder em
  // JSON; em troca, ela mesma confere quem está chamando antes de qualquer coisa.
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData?.user) {
    return NextResponse.json({ error: "Usuário não autenticado." }, { status: 401 });
  }

  const url = new URL(request.url);
  const format = url.searchParams.get("format") ?? "json";
  const rawGame = url.searchParams.get("game");
  const from = url.searchParams.get("from") ?? undefined;
  const to = url.searchParams.get("to") ?? undefined;
  const includeText = url.searchParams.get("texto") !== "false";
  const limitParam = url.searchParams.get("limit");
  const offsetParam = url.searchParams.get("offset");
  const limit = limitParam === null ? MAX_PAGE : Number(limitParam);
  const offset = offsetParam === null ? 0 : Number(offsetParam);

  if ((rawGame && !GAME_KEYS.includes(rawGame as GameKey))
    || (from && Number.isNaN(Date.parse(from)))
    || (to && Number.isNaN(Date.parse(to)))
    || (from && to && Date.parse(from) > Date.parse(to))
    || !Number.isInteger(limit) || limit < 1 || limit > MAX_PAGE
    || !Number.isInteger(offset) || offset < 0
    || (format !== "json" && format !== "csv" && format !== "resumo")) {
    return NextResponse.json({ error: "Parâmetros de exportação inválidos." }, { status: 400 });
  }

  const gameKey = (rawGame ?? undefined) as GameKey | undefined;

  try {
    if (format === "resumo") {
      const summary = await summarizeGameSessions({ from, to });
      return NextResponse.json({ resumo: summary });
    }

    const result = await exportGameAnswers({ gameKey, from, to, includeText, limit, offset });

    if (format === "csv") {
      const stamp = new Date().toISOString().slice(0, 10);
      const name = `respostas-jogos-${gameKey ?? "todos"}-${stamp}.csv`;
      // BOM para a planilha abrir acentuação certa sem configuração manual.
      return new NextResponse(`\uFEFF${toCsv(result.rows)}`, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${name}"`,
          "X-Total-Respostas": String(result.total),
          "Cache-Control": "no-store",
        },
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao exportar respostas.";
    const status = error instanceof GameTelemetryHttpError ? error.status : statusFor(message);
    return NextResponse.json({ error: message }, { status });
  }
}
