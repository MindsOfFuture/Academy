import { NextResponse } from "next/server";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { setOnboardingRole } from "@/lib/api/profiles-server";

export async function POST() {
    try {
        const supabase = await createServerSupabase();
        const { data: authData, error: authError } = await supabase.auth.getUser();

        if (authError || !authData.user) {
            return NextResponse.json({ error: "Usuário não autenticado." }, { status: 401 });
        }

        // setOnboardingRole recusa admins e grava verification_status = 'pending',
        // então o papel concedido aqui não publica nada sem aprovação.
        await setOnboardingRole(authData.user.id, "teacher");

        return NextResponse.json({ ok: true });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Erro ao garantir papel de professor";
        const status = message.toLowerCase().includes("acesso negado") ? 403 : 500;
        return NextResponse.json({ error: message }, { status });
    }
}
