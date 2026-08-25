import { createClient } from "@/lib/supabase/client";
import { normalizeNextPath } from "@/lib/utils";

export async function signInWithGoogle(nextPath?: string) {
    const supabase = createClient();
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const callbackUrl = new URL("/auth/callback", origin || "http://localhost:3000");
    const safeNextPath = normalizeNextPath(nextPath);
    if (safeNextPath) {
        callbackUrl.searchParams.set("next", safeNextPath);
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
            redirectTo: callbackUrl.toString(),
            queryParams: {
                access_type: "offline",
                prompt: "consent",
            },
        },
    });

    if (error) {
        throw new Error(`Erro ao fazer login com Google: ${error.message}`);
    }

    return data;
}
