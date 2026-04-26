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

export async function updateTeacherProfileClient(params: {
    userId: string;
    bio?: string;
    specialties?: string[];
    certifications?: string[];
    qualificationDocumentUrl?: string | null;
}): Promise<{ reverificationRequested: boolean; message: string; verificationStatus?: "pending" | "approved" | "rejected" | null; qualificationDocumentUrl?: string | null; }> {
    const normalize = (items?: string[]) => (items || []).map((item) => item.trim()).filter(Boolean);

    const response = await fetch("/api/teacher/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            bio: params.bio?.trim() || null,
            specialties: normalize(params.specialties),
            certifications: normalize(params.certifications),
            qualificationDocumentUrl: params.qualificationDocumentUrl || null,
        }),
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
        throw new Error(payload?.error || "Erro ao atualizar perfil de professor.");
    }

    return {
        reverificationRequested: !!payload?.reverificationRequested,
        message: payload?.message || "Perfil de professor atualizado com sucesso.",
        verificationStatus: payload?.verificationStatus,
        qualificationDocumentUrl: payload?.qualificationDocumentUrl,
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

export async function uploadAvatarClient(userId: string, file: File): Promise<string> {
    const supabase = createBrowserSupabase();
    
    // Validar tipo de arquivo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
        throw new Error('Tipo de arquivo não permitido. Use JPG, PNG, GIF ou WEBP.');
    }
    
    // Validar tamanho (máximo 2MB)
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
        throw new Error('Arquivo muito grande. Máximo permitido: 2MB.');
    }
    
    // Gerar nome único para o arquivo
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;
    
    // Upload para o bucket 'avatars'
    const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });
    
    if (uploadError) throw uploadError;
    
    // Obter URL pública
    const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);
    
    const avatarUrl = urlData.publicUrl;
    
    // Atualizar o perfil do usuário com a nova URL do avatar
    const { error: updateError } = await supabase
        .from('user_profile')
        .update({ avatar_url: avatarUrl })
        .eq('id', userId);
    
    if (updateError) throw updateError;
    
    return avatarUrl;
}

export async function removeAvatarClient(userId: string): Promise<void> {
    const supabase = createBrowserSupabase();
    
    // Buscar URL atual do avatar para deletar do storage
    const { data: profile } = await supabase
        .from('user_profile')
        .select('avatar_url')
        .eq('id', userId)
        .single();
    
    // Se tiver avatar, deletar do storage
    if (profile?.avatar_url) {
        // Extrair o path do arquivo da URL
        const urlParts = profile.avatar_url.split('/avatars/');
        if (urlParts.length > 1) {
            const filePath = urlParts[1];
            await supabase.storage.from('avatars').remove([filePath]);
        }
    }
    
    // Remover URL do perfil
    const { error: updateError } = await supabase
        .from('user_profile')
        .update({ avatar_url: null })
        .eq('id', userId);
    
    if (updateError) throw updateError;
}

export type { UserProfileSummary, RoleName };
