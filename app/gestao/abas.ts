import type { GestaoPapel } from "@/lib/api/gestao/types";
import type { AbaGestao } from "./nav";

/**
 * Abas por papel — tabela "Duas áreas" do plano `gestao-dia-a-dia.md`. Fica
 * fora do `layout.tsx` porque o Next só aceita exports reservados em layout.
 */
export function abasDoPapel(papel: GestaoPapel): AbaGestao[] {
  const abas: AbaGestao[] = [{ href: "/gestao", rotulo: "Hoje" }];
  if (papel === "coordenacao") abas.push({ href: "/gestao/equipe", rotulo: "Equipe" });
  abas.push({ href: "/gestao/melhorias", rotulo: "Melhorias" });
  return abas;
}
