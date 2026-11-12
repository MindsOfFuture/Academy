import { cn } from "@/lib/utils";

/** Estilo das subabas da gestão (Alocação, Pesquisa). */
export function classeSubaba(ativa: boolean): string {
  return cn(
    "whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium transition-colors",
    ativa ? "border-[#684A97] text-[#684A97]" : "border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-900",
  );
}
