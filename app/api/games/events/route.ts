import { NextResponse } from "next/server";
import { persistGameEvents, GameTelemetryHttpError } from "@/lib/api/game-telemetry-server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const written = await persistGameEvents(body);
    return NextResponse.json({ accepted: true, ...written });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao registrar respostas do jogo.";
    const status = error instanceof GameTelemetryHttpError
      ? error.status
      : message.startsWith("Payload de jogo inválido:") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
