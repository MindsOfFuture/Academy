import { csvTestes, resumoTestes } from "@/lib/api/gestao/testes";
import { ensureGestaoMember } from "@/lib/api/gestao/auth";

export async function GET() {
  const papel = await ensureGestaoMember();
  if (papel !== "coordenacao") return new Response("Acesso negado.", { status: 403 });
  return new Response(csvTestes(await resumoTestes()), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="testes-laboratorio-gestao.csv"' } });
}
