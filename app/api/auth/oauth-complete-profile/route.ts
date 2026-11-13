import { NextResponse } from "next/server";
import { createClient as createServerSupabase, createServiceRoleClient } from "@/lib/supabase/server";
import { fetchRoleForUser, setOnboardingRole } from "@/lib/api/profiles-server";

type OAuthCompleteProfilePayload = {
    fullName?: unknown;
    phone?: unknown;
    address?: unknown;
    document?: unknown;
    birthDate?: unknown;
    parentName?: unknown;
    userType?: unknown;
};

/** Idade em anos completos a partir de "AAAA-MM-DD"; null se a data não for válida. */
function idadeEmAnos(birthDate: string, hoje = new Date()): number | null {
    const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthDate);
    if (!partes) return null;
    const [ano, mes, dia] = [Number(partes[1]), Number(partes[2]), Number(partes[3])];
    const data = new Date(Date.UTC(ano, mes - 1, dia));
    if (data.getUTCFullYear() !== ano || data.getUTCMonth() !== mes - 1 || data.getUTCDate() !== dia) return null;
    let idade = hoje.getFullYear() - ano;
    const diffMes = hoje.getMonth() + 1 - mes;
    if (diffMes < 0 || (diffMes === 0 && hoje.getDate() < dia)) idade--;
    return idade;
}

function normalizeString(value: unknown): string {
    return typeof value === "string" ? value.trim() : "";
}

function parsePayload(body: OAuthCompleteProfilePayload) {
    const fullName = normalizeString(body.fullName);
    const phone = normalizeString(body.phone);
    const address = normalizeString(body.address);
    const document = normalizeString(body.document);
    const birthDate = normalizeString(body.birthDate);
    const parentName = normalizeString(body.parentName);
    const userType = body.userType === "teacher" ? "teacher" : "student";

    return { fullName, phone, address, document, birthDate, parentName, userType } as const;
}

export async function POST(request: Request) {
    try {
        const body = (await request.json()) as OAuthCompleteProfilePayload;
        const payload = parsePayload(body);

        // Obrigatórios: nome e nascimento (+ responsável para aluno menor de 18).
        // Telefone, endereço e documento são opcionais e podem vir vazios.
        if (!payload.fullName || !payload.birthDate) {
            return NextResponse.json({ error: "Dados obrigatórios ausentes para completar perfil." }, { status: 400 });
        }
        const idade = idadeEmAnos(payload.birthDate);
        if (idade === null || idade < 5) {
            return NextResponse.json({ error: "Data de nascimento inválida." }, { status: 400 });
        }
        // Professor continua como antes: telefone, endereço e documento obrigatórios.
        if (payload.userType === "teacher" && (!payload.phone || !payload.address || !payload.document)) {
            return NextResponse.json({ error: "Dados obrigatórios ausentes para completar perfil." }, { status: 400 });
        }
        if (payload.userType === "student" && idade < 18 && !payload.parentName) {
            return NextResponse.json({ error: "Nome do responsável é obrigatório para menores de 18 anos." }, { status: 400 });
        }
        const opcionais = {
            ...(payload.phone ? { phone: payload.phone } : {}),
            ...(payload.address ? { address: payload.address } : {}),
            ...(payload.document ? { document: payload.document } : {}),
        };

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
        // Mesmo critério do /auth/callback: nome + nascimento = perfil completo.
        const alreadyOnboarded = Boolean(profileRow?.full_name && profileRow?.birth_date);

        if (alreadyOnboarded) {
            return NextResponse.json({ error: "Perfil já foi completado." }, { status: 409 });
        }

        if (profileRow?.id) {
            const { error: updateProfileError } = await serviceRole
                .from("user_profile")
                .update({
                    full_name: payload.fullName,
                    ...opcionais,
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
                    ...opcionais,
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

        // Responsável do aluno menor: a linha de `student_details` nasce no cadastro
        // (gatilho handle_new_user); aqui só gravamos o nome.
        if (payload.userType === "student" && payload.parentName) {
            const { error: parentError } = await serviceRole
                .from("student_details")
                .update({ parent_name: payload.parentName })
                .eq("user_id", user.id);
            if (parentError) {
                return NextResponse.json({ error: parentError.message }, { status: 500 });
            }
        }

        return NextResponse.json({ ok: true, userType: payload.userType });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Erro ao completar perfil OAuth";
        const status = message.toLowerCase().includes("acesso negado") ? 403 : 500;
        return NextResponse.json({ error: message }, { status });
    }
}
