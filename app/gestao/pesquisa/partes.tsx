import Link from "next/link";
import { cn } from "@/lib/utils";

export type ParteDaPesquisa = "reunioes" | "producoes" | "artigos";

/** Partes da aba Pesquisa; Artigos do site é só da coordenação. */
export function PartesDaPesquisa({ atual, coordenacao }: { atual: ParteDaPesquisa; coordenacao: boolean }) {
  return (
    <nav aria-label="Partes da pesquisa" className="flex gap-1">
      <Parte href="/gestao/pesquisa" ativa={atual === "reunioes"} rotulo="Reuniões" />
      <Parte href="/gestao/pesquisa?parte=producoes" ativa={atual === "producoes"} rotulo="Produções" />
      {coordenacao && <Parte href="/gestao/pesquisa/artigos" ativa={atual === "artigos"} rotulo="Artigos" />}
    </nav>
  );
}

function Parte({ href, ativa, rotulo }: { href: string; ativa: boolean; rotulo: string }) {
  return (
    <Link
      href={href}
      aria-current={ativa ? "page" : undefined}
      className={cn(
        "whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium transition-colors",
        ativa ? "border-[#684A97] text-[#684A97]" : "border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-900",
      )}
    >
      {rotulo}
    </Link>
  );
}
