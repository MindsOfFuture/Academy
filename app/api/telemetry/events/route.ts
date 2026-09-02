import { NextResponse } from "next/server";
import { persistLearningEvents, TelemetryHttpError } from "@/lib/api/telemetry-server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const inserted = await persistLearningEvents(body);
    return NextResponse.json({ accepted: true, inserted });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao registrar telemetria.";
    const status = error instanceof TelemetryHttpError
      ? error.status
      : message.startsWith("Payload de telemetria inválido:") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
