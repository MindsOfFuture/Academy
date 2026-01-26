import { NextResponse } from "next/server";
import { getArticleBySlug, getArticleById } from "@/lib/api/articles";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  if (!slug) {
    return NextResponse.json({ error: "Slug é obrigatório" }, { status: 400 });
  }

  // Tenta primeiro buscar por slug, depois por ID
  let article = await getArticleBySlug(slug);
  
  if (!article) {
    article = await getArticleById(slug);
  }

  if (!article) {
    return NextResponse.json({ error: "Artigo não encontrado" }, { status: 404 });
  }

  return NextResponse.json(article);
}
