import { readFileSync } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { ensureGestaoMember } from "@/lib/api/gestao/auth";
import { gestaoHabilitada } from "@/lib/api/gestao/feature-flags";
import { encontrosDoMes, meuPerfilParaRelatorio, atividadesDoMes } from "@/lib/api/gestao/relatorio";
import { preencherRelatorio } from "@/lib/api/gestao/relatorio-docx";
import { mesDaUrl } from "../../alocacao/rotulos";

/** Baixa o relatório do mês de quem está logado, no modelo .docx do projeto. */
export async function GET(request: Request) {
  if (!gestaoHabilitada()) return new NextResponse(null, { status: 404 });
  try {
    await ensureGestaoMember();
  } catch {
    // Mesmo comportamento das telas: não revela que a rota existe.
    return new NextResponse(null, { status: 404 });
  }

  const mes = mesDaUrl(new URL(request.url).searchParams.get("mes") ?? undefined);
  try {
    const [perfil, encontros, atividades] = await Promise.all([
      meuPerfilParaRelatorio(),
      encontrosDoMes(mes),
      atividadesDoMes(mes),
    ]);
    const modelo = readFileSync(path.join(process.cwd(), "lib/api/gestao/modelos/relatorio-mensal.docx"));
    const arquivo = preencherRelatorio(modelo, { mes, ...perfil, encontros, atividades });
    return new NextResponse(Buffer.from(arquivo), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="relatorio-${mes}.docx"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro ao gerar o relatório." }, { status: 500 });
  }
}
