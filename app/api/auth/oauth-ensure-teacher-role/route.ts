import { NextResponse } from "next/server";
import { createClient as createServerSupabase, createServiceRoleClient } from "@/lib/supabase/server";

export async function POST() {
    try {
        const supabase = await createServerSupabase();
        const { data: authData, error: authError } = await supabase.auth.getUser();

        if (authError || !authData.user) {
            return NextResponse.json({ error: "Usuário não autenticado." }, { status: 401 });
        }

        const serviceRole = await createServiceRoleClient();

        const { data: roleRow, error: roleError } = await serviceRole
            .from("role")
            .select("id")
            .eq("name", "teacher")
            .maybeSingle();

        if (roleError || !roleRow?.id) {
            return NextResponse.json({ error: roleError?.message || "Papel teacher não encontrado." }, { status: 500 });
        }

        const { error: deleteRoleError } = await serviceRole
            .from("user_role")
            .delete()
            .eq("user_profile_id", authData.user.id);

        if (deleteRoleError) {
            return NextResponse.json({ error: deleteRoleError.message }, { status: 500 });
        }

        const { error: insertRoleError } = await serviceRole
            .from("user_role")
            .insert({
                user_profile_id: authData.user.id,
                role_id: roleRow.id,
                granted_by: authData.user.id,
            });

        if (insertRoleError) {
            return NextResponse.json({ error: insertRoleError.message }, { status: 500 });
        }

        return NextResponse.json({ ok: true });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Erro ao garantir papel de professor";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
