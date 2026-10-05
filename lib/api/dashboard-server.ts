import "server-only";

import type { User } from "@supabase/supabase-js";
import type { createClient } from "@/lib/supabase/server";
import { fetchRoleForUser } from "./profiles-server";
import { type RoleName, type TeacherVerificationStatus } from "./types";

// Só o que o painel usa: papel canônico + verification_status, lidos em paralelo.
// Recebe cliente e usuário JÁ verificados (auth.getUser) pelo chamador de servidor;
// RLS continua valendo pela sessão do cookie. Não é Server Action.
export async function getDashboardAccess(
    supabase: Awaited<ReturnType<typeof createClient>>,
    user: Pick<User, "id">,
): Promise<{ role: RoleName; verificationStatus: TeacherVerificationStatus }> {
    const [role, { data: profileRow }] = await Promise.all([
        fetchRoleForUser(user.id, supabase),
        supabase
            .from("user_profile")
            .select("verification_status")
            .eq("id", user.id)
            .maybeSingle(),
    ]);

    return {
        role,
        verificationStatus: (profileRow?.verification_status || null) as TeacherVerificationStatus,
    };
}
