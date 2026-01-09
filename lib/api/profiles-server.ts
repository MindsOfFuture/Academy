import "server-only";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient as createServerSupabase, createAdminClient } from "@/lib/supabase/server";
import { type RoleName, type UserProfileSummary } from "./types";

async function ensureRoleId(roleName: RoleName, supabase: Awaited<ReturnType<typeof createAdminClient>>): Promise<number | null> {
    const normalized = roleName === "unknown" ? "student" : roleName;
    if (normalized !== "admin" && normalized !== "teacher" && normalized !== "student") {
        return null;
    }

    const { data } = await supabase
        .from("role")
        .select("id")
        .eq("name", normalized)
        .maybeSingle();

    if (data?.id) return data.id as number;

    // Se não existir, cria o papel para garantir consistência.
    const { data: inserted, error: insertError } = await supabase
        .from("role")
        .insert({ name: normalized })
        .select("id")
        .maybeSingle();

    if (insertError || !inserted?.id) return null;
    return inserted.id as number;
}

async function fetchRoleForUser(userId: string, supabase: Awaited<ReturnType<typeof createServerSupabase>>): Promise<RoleName> {
    const { data: roleLink } = await supabase
        .from("user_role")
        .select("role_id")
        .eq("user_profile_id", userId)
        .maybeSingle();

    if (!roleLink?.role_id) return "student";

    const { data: roleRow } = await supabase
        .from("role")
        .select("name")
        .eq("id", roleLink.role_id)
        .maybeSingle();

    const roleName = roleRow?.name;
    if (roleName === "admin" || roleName === "teacher" || roleName === "student") {
        return roleName;
    }
    return "unknown";
}

function mapRoleFromLinks(userId: string, links: Array<{ user_profile_id: string; role?: { name?: string | null } | { name?: string | null }[] | null }>): RoleName {
    const link = links.find((item) => item.user_profile_id === userId);
    const roleField = link?.role;
    const name = Array.isArray(roleField) ? roleField[0]?.name : roleField?.name;
    if (name === "admin" || name === "teacher" || name === "student") return name;
    return "student";
}

export async function getUserTypeServer(): Promise<RoleName> {
    const supabase = await createServerSupabase();
    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;
    if (!user) throw new Error("Usuário não autenticado.");
    return fetchRoleForUser(user.id, supabase);
}

export async function getCurrentUserProfile(): Promise<{ id: string; email: string; displayName: string; role: RoleName; } | null> {
    const supabase = await createServerSupabase();
    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;
    if (!user) return null;

    const role = await fetchRoleForUser(user.id, supabase);

    const { data: profileRow } = await supabase
        .from("user_profile")
        .select("full_name, email")
        .eq("id", user.id)
        .maybeSingle();

    const displayName = profileRow?.full_name || user.user_metadata?.full_name || user.email || "Usuário";

    return {
        id: user.id,
        email: profileRow?.email || user.email || "",
        displayName,
        role,
    };
}

export async function getAllUsers(): Promise<UserProfileSummary[]> {
    const supabase = await createServerSupabase();
    const { data, error } = await supabase
        .from("user_profile")
        .select("id, full_name, email, avatar_url, bio, is_active, created_at")
        .order("created_at", { ascending: false });

    if (error || !data) {
        return [];
    }

    const userIds = data.map((u) => u.id);
    const { data: roleLinks } = await supabase
        .from("user_role")
        .select("user_profile_id, role:role_id(name)")
        .in("user_profile_id", userIds);

    return data.map<UserProfileSummary>((row) => ({
        id: row.id,
        email: row.email,
        fullName: row.full_name,
        avatarUrl: row.avatar_url,
        bio: row.bio,
        isActive: row.is_active,
        role: mapRoleFromLinks(row.id, roleLinks || []),
    }));
}

export async function getUsersPage(
    page: number = 1,
    pageSize: number = 10,
    search: string = "",
): Promise<{ users: UserProfileSummary[]; total: number; page: number; pageSize: number; }> {
    const supabase = await createServerSupabase();
    const safePageSize = Math.min(Math.max(pageSize, 1), 100);
    const safePage = Math.max(page, 1);
    const from = (safePage - 1) * safePageSize;
    const to = from + safePageSize - 1;

    let query = supabase
        .from("user_profile")
        .select("id, full_name, email, avatar_url, bio, is_active, created_at", { count: "exact" })
        .order("created_at", { ascending: false });

    const term = search.trim();
    if (term) {
        const pattern = `%${term.replace(/%/g, "").replace(/\s+/g, " ")}%`;
        query = query.or(`full_name.ilike.${pattern},email.ilike.${pattern}`);
    }

    const { data, error, count } = await query.range(from, to);
    if (error) {
        throw error;
    }

    const userIds = (data || []).map((u) => u.id);
    const { data: roleLinks } = await supabase
        .from("user_role")
        .select("user_profile_id, role:role_id(name)")
        .in("user_profile_id", userIds);

    const users = (data || []).map<UserProfileSummary>((row) => ({
        id: row.id,
        email: row.email,
        fullName: row.full_name,
        avatarUrl: row.avatar_url,
        bio: row.bio,
        isActive: row.is_active,
        role: mapRoleFromLinks(row.id, roleLinks || []),
    }));

    return { users, total: count || 0, page: safePage, pageSize: safePageSize };
}

export async function deleteUserAction(formData: FormData) {
    "use server";
    const id = formData.get("id") as string | null;
    if (!id) return;

    const supabase = await createServerSupabase();
    const { data: authData } = await supabase.auth.getUser();
    const currentUser = authData?.user;
    if (!currentUser) throw new Error("Usuário não autenticado.");

    const role = await fetchRoleForUser(currentUser.id, supabase);
    if (role !== "admin") throw new Error("Acesso negado. Permissões de administrador necessárias.");

    const adminClient = await createAdminClient();
    await adminClient.auth.admin.deleteUser(id);
    await adminClient.from("user_role").delete().eq("user_profile_id", id);
    await adminClient.from("user_profile").delete().eq("id", id);
    revalidatePath("/protected");
}

export async function updateUserAction(formData: FormData) {
    "use server";
    const id = formData.get("id") as string | null;
    if (!id) return;
    const fullName = (formData.get("display_name") || "") as string;
    const email = (formData.get("email") || "") as string;
    const incomingRole = (formData.get("type") || "") as string;
    const desiredRole = (incomingRole === "adm" ? "admin" : incomingRole) as RoleName;

    const supabase = await createServerSupabase();
    const { data: authData } = await supabase.auth.getUser();
    const currentUser = authData?.user;
    if (!currentUser) throw new Error("Usuário não autenticado.");
    const role = await fetchRoleForUser(currentUser.id, supabase);
    if (role !== "admin") throw new Error("Acesso negado. Permissões de administrador necessárias.");

    const adminClient = await createAdminClient();

    if (email || fullName) {
        await adminClient.auth.admin.updateUserById(id, {
            ...(email ? { email } : {}),
            user_metadata: fullName ? { full_name: fullName, display_name: fullName } : undefined,
        });
    }

    await adminClient
        .from("user_profile")
        .update({
            ...(fullName ? { full_name: fullName } : {}),
            ...(email ? { email } : {}),
            updated_at: new Date().toISOString(),
        })
        .eq("id", id);

    const roleId = await ensureRoleId(desiredRole, adminClient);
    if (!roleId) {
        throw new Error("Não foi possível resolver o papel informado.");
    }

    // A tabela user_role não possui unique constraint em user_profile_id; realizamos delete + insert.
    await adminClient.from("user_role").delete().eq("user_profile_id", id);
    await adminClient.from("user_role").insert({
        user_profile_id: id,
        role_id: roleId,
        granted_by: currentUser.id,
    });

    revalidatePath("/protected");
}

export async function updateCurrentUserProfileAction(formData: FormData) {
    "use server";
    const supabase = await createServerSupabase();
    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;
    if (!user) {
        redirect("/auth");
    }

    const targetId = formData.get("id");
    const name = (formData.get("display_name") || "").toString().trim();
    const email = (formData.get("email") || "").toString().trim();

    if (!targetId || targetId !== user.id) {
        redirect("/protected/perfil?error=unauthorized");
    }
    if (!name) {
        redirect("/protected/perfil?error=invalid_name");
    }

    const emailChanged = !!email && email !== user.email;
    const { error: authError } = await supabase.auth.updateUser({
        ...(emailChanged ? { email } : {}),
        data: { full_name: name, display_name: name },
    });
    if (authError) {
        redirect(`/protected/perfil?error=auth_${encodeURIComponent(authError.message)}`);
    }

    const { error: tableError } = await supabase
        .from("user_profile")
        .update({ full_name: name, email, updated_at: new Date().toISOString() })
        .eq("id", user.id);
    if (tableError) {
        redirect(`/protected/perfil?error=db_${encodeURIComponent(tableError.message)}`);
    }
    revalidatePath("/protected/perfil");
    redirect(`/protected/perfil?updated=1${emailChanged ? "&email_changed=1" : ""}`);
}

export { fetchRoleForUser, mapRoleFromLinks };