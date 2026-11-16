import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { buscarArtigo } from "@/lib/api/gestao/artigos";
import { exigirMembro } from "../../guard";
import { FormArtigo } from "./forms";
import { LISTA_ARTIGOS } from "./lista";

/** Edição de um artigo do site — só a coordenação. A lista fica em Produções. */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function ArtigosPage({ searchParams }: { searchParams: Promise<{ artigo?: string }> }) {
  await exigirMembro("/gestao/pesquisa/artigos", "coordenacao");
  const { artigo } = await searchParams;
  if (!artigo) redirect(LISTA_ARTIGOS);

  if (artigo !== "novo" && !UUID.test(artigo)) notFound();
  const atual = artigo === "novo" ? null : await buscarArtigo(artigo);
  if (artigo !== "novo" && !atual) notFound();
  return (
    <div className="space-y-4">
      <Link href={LISTA_ARTIGOS} className="text-sm text-[#684A97] hover:underline">
        ← Artigos
      </Link>
      <h2 className="text-xl font-semibold">{atual ? atual.titulo : "Novo artigo"}</h2>
      <FormArtigo key={atual?.id ?? "novo"} artigo={atual} />
    </div>
  );
}
