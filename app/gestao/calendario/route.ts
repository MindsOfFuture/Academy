import { NextResponse } from "next/server";
import { ensureGestaoMember } from "@/lib/api/gestao/auth";
import { calendarioIcs, encontrosParaAgenda } from "@/lib/api/gestao/calendario";
import { gestaoHabilitada } from "@/lib/api/gestao/feature-flags";
import { mesDaUrl } from "../alocacao/rotulos";

/**
 * Baixa os encontros do mês em .ics, para importar no Google Agenda. A
 * coordenação baixa o calendário como o vê (com o filtro de espaço); o
 * bolsista, e quem pede `meus=1`, só os encontros em que está.
 */
export async function GET(request: Request) {
  if (!gestaoHabilitada()) return new NextResponse(null, { status: 404 });
  let papel: string;
  try {
    papel = await ensureGestaoMember();
  } catch {
    // Mesmo comportamento das telas: não revela que a rota existe.
    return new NextResponse(null, { status: 404 });
  }

  const params = new URL(request.url).searchParams;
  const mes = mesDaUrl(params.get("mes") ?? undefined);
  const meus = papel !== "coordenacao" || params.get("meus") === "1";
  try {
    const encontros = await encontrosParaAgenda(mes, { espacoId: params.get("espaco") ?? undefined, meus });
    return new NextResponse(calendarioIcs(encontros), {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="encontros-${mes}.ics"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro ao gerar o calendário." }, { status: 500 });
  }
}
