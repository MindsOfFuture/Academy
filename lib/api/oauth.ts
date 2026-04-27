import { createClient } from "@/lib/supabase/client";

function normalizeNextPath(nextPath?: string): string {
    if (!nextPath) return "";
    if (!nextPath.startsWith("/") || nextPath.startsWith("//")) return "";
    return nextPath;
}

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

export async function handleOAuthCallback() {
    const supabase = createClient();
    const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

    if (sessionError || !sessionData.session?.user) {
        throw new Error("Falha ao recuperar sessão do Google");
    }

    const user = sessionData.session.user;

    // Buscar ou criar perfil do usuário
    const { data: existingProfile } = await supabase
        .from("user_profile")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

    if (!existingProfile) {
        // Criar novo perfil com dados do Google
        const { error: profileError } = await supabase
            .from("user_profile")
            .insert({
                id: user.id,
                email: user.email,
                full_name:
                    user.user_metadata?.full_name || user.user_metadata?.name || "",
                avatar_url: user.user_metadata?.avatar_url || null,
                is_active: true,
                created_at: new Date().toISOString(),
            });

        if (profileError) {
            console.error("[handleOAuthCallback] Erro ao criar perfil:", profileError);
            throw profileError;
        }

        // Atribuir papel padrão (student)
        const { data: roleData } = await supabase
            .from("role")
            .select("id")
            .eq("name", "student")
            .maybeSingle();

        if (roleData) {
            await supabase.from("user_role").insert({
                user_profile_id: user.id,
                role_id: roleData.id,
            });
        }
    }

    return {
        user,
        session: sessionData.session,
    };
}
