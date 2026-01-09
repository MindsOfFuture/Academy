import { createClient as createBrowserSupabase } from "@/lib/supabase/client";
import { type UserProfileSummary, type RoleName } from "./types";

export async function updateUserProfileClient(params: { userId: string; name: string; email: string; originalEmail: string; }): Promise<{ emailChanged: boolean; message: string; }> {
    const { userId, name, email, originalEmail } = params;
    const supabase = createBrowserSupabase();
    const trimmedName = name.trim();
    if (!trimmedName) throw new Error("Nome inválido");

    const emailChanged = !!email && email !== originalEmail;
    const { error: authError } = await supabase.auth.updateUser({
        ...(emailChanged ? { email } : {}),
        data: { full_name: trimmedName, display_name: trimmedName },
    });
    if (authError) throw authError;

    const { error: tableError } = await supabase
        .from("user_profile")
        .update({ full_name: trimmedName, email })
        .eq("id", userId);
    if (tableError) throw tableError;

    return {
        emailChanged,
        message: emailChanged
            ? "Perfil salvo. Verifique seu e-mail para confirmar mudança."
            : "Perfil salvo com sucesso.",
    };
}

export async function listUsersClient() {
    const supabase = createBrowserSupabase();
    const { data, error } = await supabase
        .from("user_profile")
        .select("id, full_name, email")
        .order("full_name", { ascending: true });
    if (error || !data) return [];
    return data.map((row) => {
        const userRow = row as { id: string; full_name: string; email: string };
        return {
            id: userRow.id,
            full_name: userRow.full_name,
            email: userRow.email,
        };
    });
}

export type { UserProfileSummary, RoleName };
