import { createClient as createServerClient } from "@/lib/supabase/server";
export type UserProfile = {
    id: string;
    type: 'adm' | 'normal';
    raw_user_meta_data: object | null;
    email: string | null;
    display_name: string | null;
};

export async function getUserTypeServer(): Promise<string> {
    const supabase = await createServerClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Usuário não autenticado.");
    }

    const { data, error } = await supabase
        .from('users')
        .select('type')
        .eq('id', user.id)
        .single();

    if (error) {
        console.error("Erro do Supabase ao buscar tipo de usuário:", error);
        throw new Error("Não foi possível encontrar o perfil do usuário.");
    }

    return data.type;
}
export async function getAllUsers(): Promise<UserProfile[]> {
    const supabase = await createServerClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Usuário não autenticado.");
    }

    const { data, error } = await supabase
        .from('users')
        .select('*')

    if (error) {
        console.error("Erro do Supabase ao buscar tipo de usuário:", error);
        throw new Error("Não foi possível encontrar o perfil do usuário.");
    }

    return data;
}
