import "server-only";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { type ArticleSummary } from "./types";

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

    return data.map((row: any) => ({
        id: row.id,
        title: row.title,
        slug: row.slug ?? null,
        excerpt: row.excerpt ?? null,
        content: row.content ?? null,
        coverUrl: row.cover?.url ?? null,
        authorId: row.author_id ?? null,
        publishedAt: row.published_at ?? null,
    }));
}
