import { NextResponse } from "next/server";
import { createClient as createServerSupabase, createServiceRoleClient } from "@/lib/supabase/server";
import { fetchRoleForUser } from "@/lib/api/profiles-server";

/**
 * Última etapa do cadastro de professor por OAuth (`/auth/complete-teacher-profile`).
 *
 * O papel de professor é escolhido uma única vez, no onboarding
 * (`/api/auth/oauth-complete-profile`, que recusa quem já tem perfil completo).
 * Esta rota só confirma esse papel e deixa o cadastro aguardando aprovação; ela
 * não promove ninguém. Antes, qualquer conta logada (inclusive aluno com
 * matrícula) virava professor chamando esta rota.
 */
export async function POST() {
    try {
        const supabase = await createServerSupabase();
        const { data: authData, error: authError } = await supabase.auth.getUser();

        if (authError || !authData.user) {
            return NextResponse.json({ error: "Usuário não autenticado." }, { status: 401 });
        }

        const userId = authData.user.id;
        const serviceRole = await createServiceRoleClient();
        const role = await fetchRoleForUser(userId, serviceRole as never);

        if (role !== "teacher") {
            return NextResponse.json(
                { error: "Acesso negado. O cadastro de professor começa na escolha do perfil." },
                { status: 403 },
            );
        }

        // Aprovado continua aprovado; qualquer outro estado volta para a fila.
        const { data: profile } = await serviceRole
            .from("user_profile")
            .select("verification_status")
            .eq("id", userId)
            .maybeSingle();

        if (profile?.verification_status !== "approved") {
            const { error } = await serviceRole
                .from("user_profile")
                .update({ verification_status: "pending", updated_at: new Date().toISOString() })
                .eq("id", userId);
            if (error) throw new Error(error.message);
        }

        return NextResponse.json({ ok: true });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Erro ao garantir papel de professor";
        const status = message.toLowerCase().includes("acesso negado") ? 403 : 500;
        return NextResponse.json({ error: message }, { status });
    }
}
