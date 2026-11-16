import "server-only";
import { createPublicClient, createClient as createServerSupabase } from "@/lib/supabase/server";
import { separarMetadados } from "@/lib/utils/artigo-metadados";
import type { TipoProducao } from "./gestao/types";
// Rascunho nunca aparece no site, nem para quem a RLS deixa ler (admin, coordenação).
import { type ArticleSummary, type ArticleRow, getMediaUrl } from "./types";

export type ArticleDetail = ArticleSummary;

/** Produção da pesquisa como sai no site (`public.producoes_do_site`). */
export interface ProducaoDoSite {
    id: string;
    tipo: TipoProducao;
    titulo: string;
    autores: string;
    data: string;
    onde: string | null;
    link: string | null;
}

const COLUNAS = "id, title, slug, excerpt, content, published_at, cover:media_file!article_cover_media_id_fkey(url)";

/** Autores são os do artigo (bloco de metadados no fim do texto), nunca quem o cadastrou no site. */
function mapArticle(row: ArticleRow, comConteudo: boolean): ArticleSummary {
    return {
        id: row.id,
        title: row.title,
        slug: row.slug ?? null,
        excerpt: row.excerpt ?? null,
        ...(comConteudo ? { content: row.content ?? null } : {}),
        coverUrl: getMediaUrl(row.cover),
        authorName: row.content ? (separarMetadados(row.content).metadados.autores ?? null) : null,
        publishedAt: row.published_at ?? null,
    };
}

async function getArticleBy(coluna: "slug" | "id", valor: string): Promise<ArticleDetail | null> {
    const supabase = await createServerSupabase();
    const { data, error } = await supabase
        .from("article")
        .select(COLUNAS)
        .eq(coluna, valor)
        .eq("status", "published")
        .single();
    if (error || !data) return null;
    return mapArticle(data as unknown as ArticleRow, true);
}

export const getArticleBySlug = (slug: string) => getArticleBy("slug", slug);
export const getArticleById = (id: string) => getArticleBy("id", id);

/** Artigos da home: sem login, só os publicados (a home é a mesma para todos). */
export async function getArticles(): Promise<ArticleSummary[]> {
    const supabase = createPublicClient();
    const { data, error } = await supabase
        .from("article")
        .select(COLUNAS)
        .eq("status", "published")
        .order("published_at", { ascending: false });

    if (error || !data) return [];
    return data.map((row) => mapArticle(row as unknown as ArticleRow, false));
}

/** Todas as produções da pesquisa, para a página de artigos (sem login). */
export async function getProducoes(): Promise<ProducaoDoSite[]> {
    const supabase = createPublicClient();
    const { data, error } = await supabase.rpc("producoes_do_site");
    if (error || !data) return [];
    return data as ProducaoDoSite[];
}
