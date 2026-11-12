import Link from "next/link";
import { classeSubaba } from "../subabas-estilo";

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
    <Link href={href} aria-current={ativa ? "page" : undefined} className={classeSubaba(ativa)}>
      {rotulo}
    </Link>
  );
}
