import type { StatusMelhoria } from "@/lib/api/gestao/types";

/** Cor do selo de situação — paleta do Minds (roxo, amarelo suave, coral só em alerta). */
export const COR_STATUS: Record<StatusMelhoria, string> = {
  nova: "bg-[#FDCF60]/40 text-gray-900",
  em_analise: "bg-[#684A97]/10 text-[#684A97]",
  aceita: "bg-green-100 text-green-800",
  entregue: "bg-green-600 text-white",
  recusada: "bg-gray-200 text-gray-700",
  duplicada: "bg-gray-200 text-gray-700",
};
