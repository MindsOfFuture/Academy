import Link from "next/link";
import { notFound } from "next/navigation";
import { buscarArtigo, listarArtigos } from "@/lib/api/gestao/artigos";
import type { ArtigoGestao } from "@/lib/api/gestao/types";
import { exigirMembro } from "../guard";
import { FormArtigo } from "./forms";

/** Artigos do site — só a coordenação chega aqui. */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function dataBr(iso: string): string {
  const [ano, mes, dia] = iso.slice(0, 10).split("-");
  return `${dia}/${mes}/${ano}`;
}

export default async function ArtigosPage({ searchParams }: { searchParams: Promise<{ artigo?: string }> }) {
  await exigirMembro("/gestao/artigos", "coordenacao");
  const { artigo } = await searchParams;

  if (artigo) {
    if (artigo !== "novo" && !UUID.test(artigo)) notFound();
    const atual = artigo === "novo" ? null : await buscarArtigo(artigo);
    if (artigo !== "novo" && !atual) notFound();
    return (
      <div className="space-y-4">
        <Link href="/gestao/artigos" className="text-sm text-[#684A97] hover:underline">
          ← Artigos
        </Link>
        <h2 className="text-xl font-semibold">{atual ? atual.titulo : "Novo artigo"}</h2>
        <FormArtigo key={atual?.id ?? "novo"} artigo={atual} />
      </div>
    );
  }

  const artigos = await listarArtigos();
  return (
    <section aria-labelledby="artigos-do-site" className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 id="artigos-do-site" className="text-xl font-semibold">
          Artigos ({artigos.length})
        </h2>
        <Link
          href="/gestao/artigos?artigo=novo"
          className="rounded-md bg-[#684A97] px-4 py-2 text-sm font-medium text-white hover:bg-[#684A97]/90"
        >
          Novo artigo
        </Link>
      </div>
      <ListaArtigos artigos={artigos} />
    </section>
  );
}

function ListaArtigos({ artigos }: { artigos: ArtigoGestao[] }) {
  if (artigos.length === 0) {
    return <p className="rounded-lg border bg-white p-4 text-sm text-muted-foreground">Nenhum artigo ainda.</p>;
  }
  return (
    <ul className="divide-y rounded-lg border bg-white shadow-sm">
      {artigos.map((a) => (
        <li key={a.id}>
          <Link
            href={`/gestao/artigos?artigo=${a.id}`}
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
