import "server-only";
import { createClient, usuarioDaRequisicao } from "@/lib/supabase/server";
import { getMediaUrl, type MediaRef } from "@/lib/api/types";
import type { ArtigoGestao, DadosArtigo, StatusArtigo } from "./types";

/**
 * Artigos do site editados pela coordenação (exceção ao ADR 021, ver ADR 028).
 * Escreve em `public.article` e envia a capa ao bucket `site-media`, sob a RLS
 * da migration `20261111_gestao_artigos_do_site.sql`. Sem service role.
 */

const BUCKET = "site-media";
const COLUNAS =
  "id, title, slug, excerpt, content, status, published_at, created_at, cover:media_file!article_cover_media_id_fkey(url)";

interface ArtigoRow {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  status: StatusArtigo;
  published_at: string | null;
  created_at: string;
  cover: MediaRef;
}

function mapArtigo(row: ArtigoRow): ArtigoGestao {
  return {
    id: row.id,
    titulo: row.title,
    slug: row.slug,
    resumo: row.excerpt,
    conteudo: row.content,
    status: row.status,
    capaUrl: getMediaUrl(row.cover),
    publicadoEm: row.published_at,
    criadoEm: row.created_at,
  };
}

async function usuario(): Promise<string> {
  const id = await usuarioDaRequisicao();
  if (!id) throw new Error("Usuário não autenticado.");
  return id;
}

export async function listarArtigos(): Promise<ArtigoGestao[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("article").select(COLUNAS).order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as ArtigoRow[]).map(mapArtigo);
}

export async function buscarArtigo(id: string): Promise<ArtigoGestao | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("article").select(COLUNAS).eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapArtigo(data as unknown as ArtigoRow) : null;
}

/** Envia a capa e registra em `media_file`; devolve o id da mídia. */
export async function enviarCapa(arquivo: File): Promise<string> {
  const supabase = await createClient();
  const dono = await usuario();
  const extensao = arquivo.type === "image/png" ? "png" : arquivo.type === "image/webp" ? "webp" : "jpg";
  const caminho = `covers/${crypto.randomUUID()}.${extensao}`;
  const envio = await supabase.storage.from(BUCKET).upload(caminho, arquivo, { contentType: arquivo.type });
  if (envio.error) throw new Error(envio.error.message);
  const url = supabase.storage.from(BUCKET).getPublicUrl(caminho).data.publicUrl;
  const id = crypto.randomUUID();
  const { error } = await supabase.from("media_file").insert({ id, url, owner_id: dono, type: "image" });
  if (error) throw new Error(error.message);
  return id;
}

function colunas(dados: DadosArtigo) {
  // Sem slug: o endereço é fixado na criação e nunca muda.
  return { title: dados.titulo, excerpt: dados.resumo, content: dados.conteudo, status: dados.status };
}

/** Cria o artigo; se o endereço já existe, tenta `-2`, `-3`… */
export async function criarArtigo(dados: DadosArtigo, capaId: string | null): Promise<string> {
  const supabase = await createClient();
  const autor = await usuario();
  let ultimo = "";
  for (let n = 1; n <= 50; n++) {
    const sufixo = n > 1 ? `-${n}` : "";
    const slug = dados.slug.slice(0, 80 - sufixo.length).replace(/-+$/, "") + sufixo;
    const id = crypto.randomUUID();
    const { error } = await supabase.from("article").insert({
      id,
      ...colunas(dados),
      slug,
      cover_media_id: capaId,
      author_id: autor,
      published_at: dados.status === "published" ? new Date().toISOString() : null,
    });
    if (!error) return id;
    if (error.code !== "23505" || !error.message?.includes("article_slug_key")) throw new Error(error.message);
    ultimo = error.message;
  }
  throw new Error(ultimo);
}

export async function atualizarArtigo(id: string, dados: DadosArtigo, capaId: string | null): Promise<void> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("article")
    .update({ ...colunas(dados), ...(capaId ? { cover_media_id: capaId } : {}) })
    .eq("id", id)
    .select("id");
  if (error) throw new Error(error.message);
  if (!data?.length) throw new Error("Artigo não encontrado.");
  // A data de publicação é a da primeira vez que saiu publicado.
  if (dados.status === "published") {
    const { error: erroData } = await supabase
      .from("article")
      .update({ published_at: new Date().toISOString() })
      .eq("id", id)
      .is("published_at", null);
    if (erroData) throw new Error(erroData.message);
  }
}
