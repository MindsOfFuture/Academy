import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Comprovantes de qualificação de professor (diploma, documento). O banco guarda
 * a URL pública do arquivo como referência estável; para exibir, o servidor
 * gera URL assinada de curta duração, que funciona com o bucket público ou privado.
 */
export const BUCKET_COMPROVANTE = "teacher-qualification-documents";

const PADRAO = new RegExp(`/storage/v1/object/(?:public|sign)/${BUCKET_COMPROVANTE}/([^?#]+)`);
const VALIDADE_SEGUNDOS = 60 * 60;

function caminhoBruto(url: string | null | undefined): string | null {
    return url ? PADRAO.exec(url)?.[1] ?? null : null;
}

/** Nunca grava URL assinada (expira): converte para a forma pública do mesmo arquivo. */
export function referenciaDoComprovante(url: string | null | undefined): string | null {
    if (!url) return null;
    const caminho = caminhoBruto(url);
    if (!caminho) return url;
    return `${url.slice(0, url.indexOf("/storage/v1/object/"))}/storage/v1/object/public/${BUCKET_COMPROVANTE}/${caminho}`;
}

/**
 * URL assinada para cada comprovante do bucket; URLs de fora dele ficam como estão.
 * Falha de storage devolve mapa vazio: quem chama cai na URL original.
 */
export async function assinarComprovantes(
    client: SupabaseClient,
    urls: Array<string | null | undefined>,
): Promise<Map<string, string>> {
    const porCaminho = new Map<string, string[]>();
    for (const url of urls) {
        const caminho = caminhoBruto(url);
        if (!url || !caminho) continue;
        const decodificado = decodeURIComponent(caminho);
        porCaminho.set(decodificado, [...(porCaminho.get(decodificado) ?? []), url]);
    }
    const assinadas = new Map<string, string>();
    if (porCaminho.size === 0) return assinadas;
    try {
        const { data } = await client.storage
            .from(BUCKET_COMPROVANTE)
            .createSignedUrls([...porCaminho.keys()], VALIDADE_SEGUNDOS);
        for (const item of data ?? []) {
            if (!item.path || !item.signedUrl) continue;
            for (const original of porCaminho.get(item.path) ?? []) assinadas.set(original, item.signedUrl);
        }
    } catch {
        // storage indisponível: segue com a URL original
    }
    return assinadas;
}
