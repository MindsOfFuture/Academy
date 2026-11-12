import { redirect } from "next/navigation";

/** Endereço antigo: os artigos do site agora ficam dentro da aba Pesquisa. */
export default async function ArtigosAntigo({ searchParams }: { searchParams: Promise<{ artigo?: string }> }) {
  const { artigo } = await searchParams;
  redirect(artigo ? `/gestao/pesquisa/artigos?artigo=${encodeURIComponent(artigo)}` : "/gestao/pesquisa/artigos");
}
