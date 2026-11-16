import Link from "next/link";
import { classeSubaba } from "../subabas-estilo";

export type ParteDaPesquisa = "reunioes" | "producoes";

/** Partes da aba Pesquisa. Os artigos do site ficam dentro de Produções. */
export function PartesDaPesquisa({ atual }: { atual: ParteDaPesquisa }) {
  return (
    <nav aria-label="Partes da pesquisa" className="flex gap-1">
      <Parte href="/gestao/pesquisa" ativa={atual === "reunioes"} rotulo="Reuniões" />
      <Parte href="/gestao/pesquisa?parte=producoes" ativa={atual === "producoes"} rotulo="Produções" />
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
