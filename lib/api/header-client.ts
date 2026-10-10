import type { SupabaseClient } from "@supabase/supabase-js";

export async function getHeaderMembership(client: SupabaseClient): Promise<boolean> {
    try {
        const { data, error } = await client.rpc("gestao_membro_papel");
        return !error && (data === "coordenacao" || data === "bolsista");
    } catch {
        return false;
    }
}
