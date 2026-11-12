import type { StatusMeta } from "@/lib/api/gestao/types";

/** Cor do selo — as mesmas classes dos pedidos de melhoria (coral só no alerta). */
export const COR_STATUS: Record<StatusMeta, string> = {
  em_dia: "bg-[#684A97]/10 text-[#684A97]",
  atrasada: "border border-[#E8473A] bg-white text-[#E8473A]",
  concluida: "bg-green-100 text-green-800",
};

/** "2026-11-30" → "30/11/2026". */
export function dataBr(iso: string): string {
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
}
