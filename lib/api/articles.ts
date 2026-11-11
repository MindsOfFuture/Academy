import "server-only";
import { createPublicClient, createClient as createServerSupabase } from "@/lib/supabase/server";
// Rascunho nunca aparece no site, nem para quem a RLS deixa ler (admin, coordenação).
import { type ArticleSummary, type ArticleRow, getMediaUrl } from "./types";

export interface ArticleDetail extends ArticleSummary {
    authorName?: string | null;
}

export async function getArticleBySlug(slug: string): Promise<ArticleDetail | null> {
    const supabase = await createServerSupabase();
    const { data, error } = await supabase
        .from("article")
        .select(
            `id, title, slug, excerpt, content, published_at, author:author_id(full_name), cover:media_file!article_cover_media_id_fkey(url)`
        )
        .eq("slug", slug)
        .eq("status", "published")
        .single();

    if (error || !data) return null;

    const articleRow = data as unknown as ArticleRow & { author?: { full_name?: string } };
    return {
        id: articleRow.id,
        title: articleRow.title,
        slug: articleRow.slug ?? null,
        excerpt: articleRow.excerpt ?? null,
        content: articleRow.content ?? null,
        coverUrl: getMediaUrl(articleRow.cover),
        authorId: articleRow.author_id ?? null,
        authorName: articleRow.author?.full_name ?? null,
        publishedAt: articleRow.published_at ?? null,
    };
}

export async function getArticleById(id: string): Promise<ArticleDetail | null> {
    const supabase = await createServerSupabase();
    const { data, error } = await supabase
        .from("article")
        .select(
            `id, title, slug, excerpt, content, published_at, author:author_id(full_name), cover:media_file!article_cover_media_id_fkey(url)`
        )
        .eq("id", id)
        .eq("status", "published")
        .single();

    if (error || !data) return null;

    const articleRow = data as unknown as ArticleRow & { author?: { full_name?: string } };
    return {
        id: articleRow.id,
        title: articleRow.title,
        slug: articleRow.slug ?? null,
        excerpt: articleRow.excerpt ?? null,
        content: articleRow.content ?? null,
        coverUrl: getMediaUrl(articleRow.cover),
        authorId: articleRow.author_id ?? null,
        authorName: articleRow.author?.full_name ?? null,
        publishedAt: articleRow.published_at ?? null,
    };
}

/** Artigos da home: sem login, só os publicados (a home é a mesma para todos). */
export async function getArticles(): Promise<ArticleSummary[]> {
    const supabase = createPublicClient();
    const { data, error } = await supabase
        .from("article")
        .select(
            `id, title, slug, excerpt, published_at, author:author_id(full_name), cover:media_file!article_cover_media_id_fkey(url)`
        )
        .eq("status", "published")
        .order("published_at", { ascending: false });

    if (error || !data) return [];

    return data.map((row) => {
        const articleRow = row as unknown as ArticleRow;
        return {
            id: articleRow.id,
            title: articleRow.title,
            slug: articleRow.slug ?? null,
            excerpt: articleRow.excerpt ?? null,

            coverUrl: getMediaUrl(articleRow.cover),
            authorId: articleRow.author_id ?? null,
            publishedAt: articleRow.published_at ?? null,
        };
    });
}
