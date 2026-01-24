import "server-only";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { type ArticleSummary, type ArticleRow, getCoverUrl } from "./types";

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
        .single();

    if (error || !data) return null;

    const articleRow = data as unknown as ArticleRow & { author?: { full_name?: string } };
    return {
        id: articleRow.id,
        title: articleRow.title,
        slug: articleRow.slug ?? null,
        excerpt: articleRow.excerpt ?? null,
        content: articleRow.content ?? null,
        coverUrl: getCoverUrl(articleRow.cover),
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
        .single();

    if (error || !data) return null;

    const articleRow = data as unknown as ArticleRow & { author?: { full_name?: string } };
    return {
        id: articleRow.id,
        title: articleRow.title,
        slug: articleRow.slug ?? null,
        excerpt: articleRow.excerpt ?? null,
        content: articleRow.content ?? null,
        coverUrl: getCoverUrl(articleRow.cover),
        authorId: articleRow.author_id ?? null,
        authorName: articleRow.author?.full_name ?? null,
        publishedAt: articleRow.published_at ?? null,
    };
}

export async function getArticles(limit: number = 6): Promise<ArticleSummary[]> {
    const supabase = await createServerSupabase();
    const { data, error } = await supabase
        .from("article")
        .select(
            `id, title, slug, excerpt, content, published_at, author:author_id(full_name), cover:media_file!article_cover_media_id_fkey(url)`
        )
        .order("published_at", { ascending: false })
        .limit(limit);

    if (error || !data) return [];

    return data.map((row) => {
        const articleRow = row as unknown as ArticleRow;
        return {
            id: articleRow.id,
            title: articleRow.title,
            slug: articleRow.slug ?? null,
            excerpt: articleRow.excerpt ?? null,
            content: articleRow.content ?? null,
            coverUrl: getCoverUrl(articleRow.cover),
            authorId: articleRow.author_id ?? null,
            publishedAt: articleRow.published_at ?? null,
        };
    });
}
