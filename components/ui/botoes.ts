import { cn } from "@/lib/utils";

/**
 * Os três botões do site. Regra: a ação principal de uma lista fica no canto
 * direito do cabeçalho da seção; ação que apaga é só texto vermelho.
 * No celular todo alvo de toque tem pelo menos 44 px de altura.
 */
const BASE =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 min-h-11 md:min-h-9 text-sm font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#684A97]/40";

export const BOTAO_PRIMARIO = cn(BASE, "bg-[#684A97] text-white hover:bg-[#553d7a]");
export const BOTAO_SECUNDARIO = cn(BASE, "border border-[#684A97] bg-white text-[#684A97] hover:bg-[#684A97]/10");
export const BOTAO_PERIGO = cn(BASE, "px-3 text-red-600 hover:bg-red-50");

/** Filtro em pílula (Todas, Minhas, Atrasadas...). */
export function classeFiltro(ativo: boolean): string {
  return cn(
    "inline-flex items-center rounded-full border px-3 min-h-11 md:min-h-8 text-sm transition-colors",
    ativo ? "border-[#684A97] bg-[#684A97] text-white" : "border-gray-300 bg-white text-gray-700 hover:border-[#684A97] hover:text-[#684A97]",
  );
}

/** Cabeçalho de seção com a ação principal à direita. */
export const CABECALHO_SECAO = "flex flex-wrap items-center justify-between gap-3";
