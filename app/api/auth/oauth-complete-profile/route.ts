import { NextResponse } from "next/server";
import { createClient as createServerSupabase, createServiceRoleClient } from "@/lib/supabase/server";

type OAuthCompleteProfilePayload = {
    fullName?: unknown;
    phone?: unknown;
    address?: unknown;
    document?: unknown;
    birthDate?: unknown;
    userType?: unknown;
};

function normalizeString(value: unknown): string {
    return typeof value === "string" ? value.trim() : "";
}

function parsePayload(body: OAuthCompleteProfilePayload) {
    const fullName = normalizeString(body.fullName);
    const phone = normalizeString(body.phone);
    const address = normalizeString(body.address);
    const document = normalizeString(body.document);
    const birthDate = normalizeString(body.birthDate);
    const userType = body.userType === "teacher" ? "teacher" : "student";

    return { fullName, phone, address, document, birthDate, userType };
}

export async function POST(request: Request) {
    try {
        const body = (await request.json()) as OAuthCompleteProfilePayload;
        const payload = parsePayload(body);

        if (!payload.fullName || !payload.phone || !payload.address || !payload.document || !payload.birthDate) {
            return NextResponse.json({ error: "Dados obrigatórios ausentes para completar perfil." }, { status: 400 });
        }

        const supabase = await createServerSupabase();
        const { data: authData, error: authError } = await supabase.auth.getUser();

        if (authError || !authData.user) {
            return NextResponse.json({ error: "Usuário não autenticado." }, { status: 401 });
        }

        const user = authData.user;
        const serviceRole = await createServiceRoleClient();

        const now = new Date().toISOString();

        const { data: profileRow, error: profileFetchError } = await serviceRole
            .from("user_profile")
            .select("id")
            .eq("id", user.id)
            .maybeSingle();

        if (profileFetchError) {
            return NextResponse.json({ error: profileFetchError.message }, { status: 500 });
        }

        if (profileRow?.id) {
            const { error: updateProfileError } = await serviceRole
                .from("user_profile")
                .update({
                    full_name: payload.fullName,
                    phone: payload.phone,
                    address: payload.address,
                    document: payload.document,
                    birth_date: payload.birthDate,
                    updated_at: now,
                })
                .eq("id", user.id);

            if (updateProfileError) {
                return NextResponse.json({ error: updateProfileError.message }, { status: 500 });
            }
        } else {
            const { error: insertProfileError } = await serviceRole
                .from("user_profile")
                .insert({
                    id: user.id,
                    email: user.email || "",
                    full_name: payload.fullName,
                    phone: payload.phone,
                    address: payload.address,
                    document: payload.document,
                    birth_date: payload.birthDate,
                    avatar_url: (user.user_metadata?.avatar_url as string | undefined) || null,
                    is_active: true,
                    created_at: now,
                    updated_at: now,
                });

            if (insertProfileError) {
                return NextResponse.json({ error: insertProfileError.message }, { status: 500 });
            }
        }

        const { data: roleRow, error: roleError } = await serviceRole
            .from("role")
            .select("id")
            .eq("name", payload.userType)
            .maybeSingle();

        if (roleError || !roleRow?.id) {
            return NextResponse.json({ error: roleError?.message || "Papel de usuário inválido." }, { status: 500 });
        }

        const { error: deleteRoleError } = await serviceRole
            .from("user_role")
            .delete()
            .eq("user_profile_id", user.id);

        if (deleteRoleError) {
            return NextResponse.json({ error: deleteRoleError.message }, { status: 500 });
        }

        const { error: insertRoleError } = await serviceRole
            .from("user_role")
            .insert({
                user_profile_id: user.id,
                role_id: roleRow.id,
                granted_by: user.id,
            });

        if (insertRoleError) {
            return NextResponse.json({ error: insertRoleError.message }, { status: 500 });
        }

        return NextResponse.json({ ok: true, userType: payload.userType });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Erro ao completar perfil OAuth";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
