import type { GestaoPapel } from "@/lib/api/gestao/types";
import type { AbaGestao } from "./nav";

/**
 * Abas por papel — tabela "Duas áreas" do plano `gestao-dia-a-dia.md`. Fica
 * fora do `layout.tsx` porque o Next só aceita exports reservados em layout.
 */
export function abasDoPapel(papel: GestaoPapel): AbaGestao[] {
  // Ordem pelo uso do dia a dia: o que se faz toda semana primeiro, consulta no fim.
  const coordenacao = papel === "coordenacao";
  const abas: AbaGestao[] = [{ href: "/gestao", rotulo: "Hoje" }];
  if (coordenacao) {
    abas.push({ href: "/gestao/alocacao", rotulo: "Alocação" });
    abas.push({ href: "/gestao/equipe", rotulo: "Equipe" });
  } else {
    abas.push({ href: "/gestao/calendario", rotulo: "Calendário" });
  }
  abas.push({ href: "/gestao/relatorio", rotulo: "Relatório" });
  abas.push({ href: "/gestao/metas", rotulo: "Metas" });
  abas.push({ href: "/gestao/treinamentos", rotulo: "Treinamentos" });
  abas.push({ href: "/gestao/melhorias", rotulo: "Melhorias" });
  abas.push({ href: "/gestao/pesquisa", rotulo: "Pesquisa" });
  // Respostas dos alunos no Empreenda+ (a rota continua /gestao/testes).
  if (coordenacao) abas.push({ href: "/gestao/testes", rotulo: "Empreenda+" });
  return abas;
}
