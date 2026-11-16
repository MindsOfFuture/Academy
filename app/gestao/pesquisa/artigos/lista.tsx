import Link from "next/link";
import type { ArtigoGestao } from "@/lib/api/gestao/types";

/** Onde os artigos do site ficam: um filtro dentro de Produções, só da coordenação. */
export const LISTA_ARTIGOS = "/gestao/pesquisa?parte=producoes&tipo=site";

function dataBr(iso: string): string {
  const [ano, mes, dia] = iso.slice(0, 10).split("-");
  return `${dia}/${mes}/${ano}`;
}

export function ListaArtigos({ artigos }: { artigos: ArtigoGestao[] }) {
  if (artigos.length === 0) {
    return <p className="rounded-lg border bg-white p-4 text-sm text-muted-foreground">Nenhum artigo ainda.</p>;
  }
  return (
    <ul className="divide-y rounded-lg border bg-white shadow-sm">
      {artigos.map((a) => (
        <li key={a.id}>
          <Link
            href={`/gestao/pesquisa/artigos?artigo=${a.id}`}
            className="flex flex-col gap-1 p-4 hover:bg-[#684A97]/5 md:flex-row md:items-center md:justify-between"
          >
            <span className="font-medium">
              {a.titulo}{" "}
              <span className="ml-1 rounded-full bg-[#684A97]/10 px-2 py-0.5 text-xs font-medium text-[#684A97]">
                {a.status === "published" ? "Publicado" : "Rascunho"}
              </span>
            </span>
            <span className="text-sm text-muted-foreground">{dataBr(a.publicadoEm ?? a.criadoEm)}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
