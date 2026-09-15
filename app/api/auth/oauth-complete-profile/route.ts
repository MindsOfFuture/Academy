import { NextResponse } from "next/server";
import { createClient as createServerSupabase, createServiceRoleClient } from "@/lib/supabase/server";
import { fetchRoleForUser, setOnboardingRole } from "@/lib/api/profiles-server";

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

    return { fullName, phone, address, document, birthDate, userType } as const;
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
            .select("id, full_name, phone, address, document, birth_date")
            .eq("id", user.id)
            .maybeSingle();

        if (profileFetchError) {
            return NextResponse.json({ error: profileFetchError.message }, { status: 500 });
        }

        // Onboarding acontece uma vez só. Sem esta checagem qualquer usuário já
        // cadastrado poderia rechamar a rota com userType "teacher" e reescrever
        // o próprio papel (a rota roda com service role e ignora as policies).
        const alreadyOnboarded = Boolean(
            profileRow?.full_name &&
            profileRow?.phone &&
            profileRow?.address &&
            profileRow?.document &&
            profileRow?.birth_date,
        );

        if (alreadyOnboarded) {
            return NextResponse.json({ error: "Perfil já foi completado." }, { status: 409 });
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

        // Admin que entra por OAuth precisa completar o perfil, mas não escolhe
        // papel: `setOnboardingRole` recusa admin de propósito, para não rebaixar
        // a conta. O perfil já foi gravado acima, então basta não chamar.
        const currentRole = await fetchRoleForUser(user.id, serviceRole);

        if (currentRole === "admin") {
            return NextResponse.json({ ok: true, userType: "admin" });
        }

        await setOnboardingRole(user.id, payload.userType);

        return NextResponse.json({ ok: true, userType: payload.userType });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Erro ao completar perfil OAuth";
        const status = message.toLowerCase().includes("acesso negado") ? 403 : 500;
        return NextResponse.json({ error: message }, { status });
    }
}
