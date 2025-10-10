import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
export type UserProfile = {
    id: string;
    type: 'adm' | 'normal';
    raw_user_meta_data: object | null;
    email: string | null;
    display_name: string | null;
};

export type UserMetadata = {
    sub?: string;
    email?: string;
    full_name?: string;
    display_name?: string;
    email_verified?: boolean;
    phone_verified?: boolean;
    [key: string]: unknown;
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
export async function deleteUserAction(formData: FormData) {
    'use server';
    const id = formData.get('id') as string | null;
    if (!id) return;
    const supabase = await createAdminClient();
    await supabase.auth.admin.deleteUser(id);
    revalidatePath('/protected');
}

export async function updateUserAction(formData: FormData) {
    'use server';
    const id = formData.get('id') as string | null;
    const display_name = formData.get('display_name') as string | null;
    const type = formData.get('type') as string | null;
    const email = formData.get('email') as string | null;
    if (!id) return;
    const supabase = await createAdminClient();
    const { data: existing } = await supabase.auth.admin.getUserById(id);
    const existingMeta = existing?.user?.user_metadata || {};
    const newMeta: UserMetadata = { ...existingMeta };
    if (display_name) newMeta.display_name = display_name;
    if (display_name) newMeta.full_name = display_name;
    if (email) newMeta.email = email;

    if (email || display_name) {
        await supabase.auth.admin.updateUserById(id, {
            ...(email ? { email } : {}),
            user_metadata: newMeta,
        });
    }
    await supabase.from('users').update({ display_name, type, email }).eq('id', id);
    revalidatePath('/protected');
}

export async function getUsersPage(page: number = 1, pageSize: number = 10): Promise<{ users: UserProfile[]; total: number; page: number; pageSize: number; }> {
    const supabase = await createServerClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Usuário não autenticado.");
    }

    const safePageSize = Math.min(Math.max(pageSize, 1), 100);
    const safePage = Math.max(page, 1);
    const from = (safePage - 1) * safePageSize;
    const to = from + safePageSize - 1;

    const { data, error, count } = await supabase
        .from('users')
        .select('*', { count: 'exact' })
        .range(from, to);

    if (error) {
        console.error("Erro do Supabase ao buscar usuários (paginados):", error);
        throw new Error("Não foi possível listar os usuários.");
    }

    return { users: data || [], total: count || 0, page: safePage, pageSize: safePageSize };
}

export interface CurrentUserProfileResult {
    id: string;
    email: string;
    displayName: string;
    type: string;
}

export async function getCurrentUserProfile(): Promise<CurrentUserProfileResult | null> {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data: profileRow } = await supabase
        .from('users')
        .select('display_name, type, email')
        .eq('id', user.id)
        .single();
    return {
        id: user.id,
        email: profileRow?.email || user.email || '',
        displayName: (profileRow?.display_name || (user.user_metadata as UserMetadata)?.full_name || 'Usuário'),
        type: profileRow?.type || 'normal'
    };
}

// -------- Server Actions de Perfil do Usuário Logado --------
export async function updateCurrentUserProfileAction(formData: FormData) {
    'use server';
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        redirect('/auth');
    }
    const targetId = formData.get('id');
    const name = (formData.get('display_name') || '').toString().trim();
    const email = (formData.get('email') || '').toString().trim();
    if (!targetId || targetId !== user.id) {
        redirect('/protected/perfil?error=unauthorized');
    }
    if (!name) {
        redirect('/protected/perfil?error=invalid_name');
    }
    // Atualiza auth (metadados e email se mudou)
    const emailChanged = !!email && email !== user.email;
    const { error: authError } = await supabase.auth.updateUser({
        ...(emailChanged ? { email } : {}),
        data: { full_name: name, display_name: name }
    });
    if (authError) {
        redirect(`/protected/perfil?error=auth_${encodeURIComponent(authError.message)}`);
    }
    // Atualiza linha complementar
    const { error: tableError } = await supabase
        .from('users')
        .update({ display_name: name, email })
        .eq('id', user.id);
    if (tableError) {
        redirect(`/protected/perfil?error=db_${encodeURIComponent(tableError.message)}`);
    }
    revalidatePath('/protected/perfil');
    redirect(`/protected/perfil?updated=1${emailChanged ? '&email_changed=1' : ''}`);
}