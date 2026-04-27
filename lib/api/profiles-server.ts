import "server-only";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient as createServerSupabase, createAdminClient, createServiceRoleClient } from "@/lib/supabase/server";
import { type RoleName, type TeacherVerificationStatus, type UserProfileSummary } from "./types";
import { notifyAdmins, createNotification } from "./notifications-server";

type TeacherRequestRow = {
    user_id: string;
    status: TeacherVerificationStatus;
    observations: string | null;
    qualification_document_url: string | null;
    created_at: string | null;
};

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
    const { data: roleLinks } = await supabase
        .from("user_role")
        .select("role_id")
        .eq("user_profile_id", userId);

    const roleIds = (roleLinks || []).map((item) => item.role_id).filter((value): value is number => typeof value === "number");
    if (roleIds.length === 0) return "student";

    const { data: roleRows } = await supabase
        .from("role")
        .select("name")
        .in("id", roleIds);

    const roleNames = new Set((roleRows || []).map((row) => row.name));
    if (roleNames.has("admin")) return "admin";
    if (roleNames.has("teacher")) return "teacher";
    if (roleNames.has("student")) return "student";
    return "unknown";
}

function mapRoleFromLinks(userId: string, links: Array<{ user_profile_id: string; role?: { name?: string | null } | { name?: string | null }[] | null }>): RoleName {
    const link = links.find((item) => item.user_profile_id === userId);
    const roleField = link?.role;
    const name = Array.isArray(roleField) ? roleField[0]?.name : roleField?.name;
    if (name === "admin" || name === "teacher" || name === "student") return name;
    return "student";
}

function mapLatestTeacherRequestByUser(rows: TeacherRequestRow[] | null | undefined): Record<string, TeacherRequestRow> {
    const latestByUser: Record<string, TeacherRequestRow> = {};
    for (const row of rows || []) {
        const current = latestByUser[row.user_id];
        const rowDate = new Date(row.created_at || 0).getTime();
        const currentDate = new Date(current?.created_at || 0).getTime();
        if (!current || rowDate >= currentDate) {
            latestByUser[row.user_id] = row;
        }
    }
    return latestByUser;
}

export async function getUserTypeServer(): Promise<RoleName> {
    const supabase = await createServerSupabase();
    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;
    if (!user) throw new Error("Usuário não autenticado.");
    return fetchRoleForUser(user.id, supabase);
}

export async function getCurrentUserProfile(): Promise<{
    id: string;
    email: string;
    displayName: string;
    role: RoleName;
    avatarUrl: string | null;
    bio: string | null;
    phone: string | null;
    address: string | null;
    specialties: string[];
    certifications: string[];
    verificationStatus: TeacherVerificationStatus;
    verificationReason: string | null;
    verificationDocumentUrl: string | null;
    // Teacher-specific
    schools: string[];
    educationLevel: string | null;
    degree: string | null;
} | null> {
    const supabase = await createServerSupabase();
    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;
    if (!user) return null;

    const role = await fetchRoleForUser(user.id, supabase);

    const { data: profileRow } = await supabase
        .from("user_profile")
        .select("full_name, email, avatar_url, bio, phone, address, specialties, certifications, verification_status")
        .eq("id", user.id)
        .maybeSingle();

    // Fetch teacher-specific details if applicable
    let teacherDetails: { schools: string[]; education_level: string | null; degree: string | null } | null = null;
    if (role === "teacher") {
        const { data: tdRow } = await supabase
            .from("teacher_details")
            .select("schools, education_level, degree")
            .eq("user_id", user.id)
            .maybeSingle();
        if (tdRow) {
            teacherDetails = tdRow as { schools: string[]; education_level: string | null; degree: string | null };
        }
    }

    const { data: teacherRequest } = await supabase
        .from("teacher_request")
        .select("status, observations, qualification_document_url")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    const { data: teacherRequestWithDocument } = await supabase
        .from("teacher_request")
        .select("qualification_document_url")
        .eq("user_id", user.id)
        .not("qualification_document_url", "is", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    const displayName = profileRow?.full_name || user.user_metadata?.full_name || user.email || "Usuário";

    return {
        id: user.id,
        email: profileRow?.email || user.email || "",
        displayName,
        role,
        avatarUrl: profileRow?.avatar_url || null,
        bio: profileRow?.bio || null,
        phone: profileRow?.phone || null,
        address: profileRow?.address || null,
        specialties: profileRow?.specialties || [],
        certifications: profileRow?.certifications || [],
        verificationStatus: (profileRow?.verification_status || null) as TeacherVerificationStatus,
        verificationReason: teacherRequest?.status === "rejected" ? teacherRequest.observations || null : null,
        verificationDocumentUrl:
            teacherRequest?.qualification_document_url ||
            teacherRequestWithDocument?.qualification_document_url ||
            ((user.user_metadata?.qualification_document_url as string | undefined) || null),
        // Teacher-specific
        schools: teacherDetails?.schools || [],
        educationLevel: teacherDetails?.education_level || null,
        degree: teacherDetails?.degree || null,
    };
}

export async function getAllUsers(): Promise<UserProfileSummary[]> {
    const supabase = await createServerSupabase();
    const { data, error } = await supabase
        .from("user_profile")
        .select("id, full_name, email, avatar_url, bio, phone, address, specialties, certifications, verification_status, is_active, created_at")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

    if (error || !data) {
        return [];
    }

    const userIds = data.map((u) => u.id);
    const { data: roleLinks } = await supabase
        .from("user_role")
        .select("user_profile_id, role:role_id(name)")
        .in("user_profile_id", userIds);

    const { data: teacherRequests } = await supabase
        .from("teacher_request")
        .select("user_id, status, observations, qualification_document_url, created_at")
        .in("user_id", userIds);

    const latestTeacherRequestByUser = mapLatestTeacherRequestByUser(teacherRequests as TeacherRequestRow[]);

    return data.map<UserProfileSummary>((row) => {
        const latestTeacherRequest = latestTeacherRequestByUser[row.id];
        return {
            id: row.id,
            email: row.email,
            fullName: row.full_name,
            avatarUrl: row.avatar_url,
            bio: row.bio,
            phone: row.phone,
            address: row.address,
            specialties: row.specialties || [],
            certifications: row.certifications || [],
            verificationStatus: (row.verification_status || null) as TeacherVerificationStatus,
            verificationReason: latestTeacherRequest?.status === "rejected" ? latestTeacherRequest.observations || null : null,
            verificationDocumentUrl: latestTeacherRequest?.qualification_document_url || null,
            isActive: row.is_active,
            role: mapRoleFromLinks(row.id, roleLinks || []),
        };
    });
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
        .select("id, full_name, email, avatar_url, bio, phone, address, specialties, certifications, verification_status, is_active, created_at", { count: "exact" })
        .eq("is_active", true)
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

    const { data: teacherRequests } = await supabase
        .from("teacher_request")
        .select("user_id, status, observations, qualification_document_url, created_at")
        .in("user_id", userIds);

    const latestTeacherRequestByUser = mapLatestTeacherRequestByUser(teacherRequests as TeacherRequestRow[]);

    const users = (data || []).map<UserProfileSummary>((row) => {
        const latestTeacherRequest = latestTeacherRequestByUser[row.id];
        return {
            id: row.id,
            email: row.email,
            fullName: row.full_name,
            avatarUrl: row.avatar_url,
            bio: row.bio,
            phone: row.phone,
            address: row.address,
            specialties: row.specialties || [],
            certifications: row.certifications || [],
            verificationStatus: (row.verification_status || null) as TeacherVerificationStatus,
            verificationReason: latestTeacherRequest?.status === "rejected" ? latestTeacherRequest.observations || null : null,
            verificationDocumentUrl: latestTeacherRequest?.qualification_document_url || null,
            isActive: row.is_active,
            role: mapRoleFromLinks(row.id, roleLinks || []),
        };
    });

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

    // 1. Delete auth user — triggers scrub_deleted_user_personal_data()
    //    which anonymizes user_profile and deletes personal data tables.
    await adminClient.auth.admin.deleteUser(id);

    // 2. Clean up remaining personal-data tables (safety net if trigger missed any)
    await adminClient.from("user_role").delete().eq("user_profile_id", id);
    await adminClient.from("student_details").delete().eq("user_id", id);
    await adminClient.from("teacher_details").delete().eq("user_id", id);
    await adminClient.from("teacher_request").delete().eq("user_id", id);
    await adminClient.from("notification").delete().eq("user_id", id);

    // 3. Delete the anonymized profile itself.
    //    Content FKs (course, article, etc.) are SET NULL so content is preserved.
    //    This frees the email UNIQUE constraint for potential re-registration.
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

    if (desiredRole === "teacher") {
        const { data: profile } = await adminClient
            .from("user_profile")
            .select("verification_status")
            .eq("id", id)
            .maybeSingle();

        if (!profile?.verification_status) {
            await adminClient
                .from("user_profile")
                .update({ verification_status: "pending", updated_at: new Date().toISOString() })
                .eq("id", id);

            await adminClient
                .from("teacher_request")
                .insert({ user_id: id, status: "pending", reviewed_by: currentUser.id, reviewed_at: new Date().toISOString() });
        }
    }

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

export async function updateCurrentTeacherProfileAction(params: {
    bio?: string;
    specialties?: string[];
    certifications?: string[];
}) {
    const supabase = await createServerSupabase();
    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;
    if (!user) {
        throw new Error("Usuário não autenticado.");
    }

    const role = await fetchRoleForUser(user.id, supabase);
    if (role !== "teacher") {
        throw new Error("Apenas professores podem atualizar este perfil.");
    }

    const sanitize = (items?: string[]) => (items || []).map((item) => item.trim()).filter(Boolean);
    const specialties = sanitize(params.specialties);
    const certifications = sanitize(params.certifications);

    const { error } = await supabase
        .from("user_profile")
        .update({
            bio: params.bio?.trim() || null,
            specialties,
            certifications,
            updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

    if (error) {
        throw error;
    }

    revalidatePath("/protected/perfil");
}

export async function updateCurrentTeacherProfileWithReverification(params: {
    bio?: string;
    specialties?: string[];
    certifications?: string[];
    qualificationDocumentUrl?: string | null;
    schools?: string[];
    educationLevel?: string;
    degree?: string;
}): Promise<{ reverificationRequested: boolean; message: string; verificationStatus: TeacherVerificationStatus; qualificationDocumentUrl: string | null; }> {
    const supabase = await createServerSupabase();
    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;
    if (!user) {
        throw new Error("Usuário não autenticado.");
    }

    const role = await fetchRoleForUser(user.id, supabase);
    if (role !== "teacher") {
        throw new Error("Apenas professores podem atualizar este perfil.");
    }

    const sanitize = (items?: string[]) => (items || []).map((item) => item.trim()).filter(Boolean);
    const specialties = sanitize(params.specialties);
    const certifications = sanitize(params.certifications);

    const { data: profileRow } = await supabase
        .from("user_profile")
        .select("verification_status, full_name")
        .eq("id", user.id)
        .maybeSingle();

    const currentStatus = (profileRow?.verification_status || null) as TeacherVerificationStatus;

    const { data: latestTeacherRequest } = await supabase
        .from("teacher_request")
        .select("qualification_document_url")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    const nextQualificationDocumentUrl = params.qualificationDocumentUrl?.trim()
        ? params.qualificationDocumentUrl.trim()
        : (latestTeacherRequest?.qualification_document_url || null);

    if (currentStatus === "rejected" && !nextQualificationDocumentUrl) {
        throw new Error("Envie o comprovante de qualificação para reenviar sua solicitação.");
    }

    const serviceRoleClient = await createServiceRoleClient();
    const nextStatus: TeacherVerificationStatus = currentStatus === "rejected" ? "pending" : currentStatus;

    const { error: profileError } = await serviceRoleClient
        .from("user_profile")
        .update({
            bio: params.bio?.trim() || null,
            specialties,
            certifications,
            ...(currentStatus === "rejected" ? { verification_status: "pending" } : {}),
            updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

    if (profileError) {
        throw profileError;
    }

    // Update teacher_details (schools, education_level, degree)
    const sanitizeSchools = sanitize(params.schools);
    const teacherDetailsUpdate: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
    };
    if (sanitizeSchools.length > 0) teacherDetailsUpdate.schools = sanitizeSchools;
    if (params.educationLevel?.trim()) teacherDetailsUpdate.education_level = params.educationLevel.trim();
    if (params.degree?.trim()) teacherDetailsUpdate.degree = params.degree.trim();

    if (Object.keys(teacherDetailsUpdate).length > 1) {
        // Check if teacher_details row exists
        const { data: existingTd } = await serviceRoleClient
            .from("teacher_details")
            .select("user_id")
            .eq("user_id", user.id)
            .maybeSingle();

        if (existingTd) {
            await serviceRoleClient
                .from("teacher_details")
                .update(teacherDetailsUpdate)
                .eq("user_id", user.id);
        } else {
            await serviceRoleClient
                .from("teacher_details")
                .insert({
                    user_id: user.id,
                    schools: sanitizeSchools,
                    education_level: params.educationLevel?.trim() || '',
                    degree: params.degree?.trim() || '',
                });
        }
    }

    if (currentStatus === "rejected") {
        const { error: requestError } = await serviceRoleClient
            .from("teacher_request")
            .insert({
                user_id: user.id,
                status: "pending",
                qualification_document_url: nextQualificationDocumentUrl,
                observations: "Professor atualizou o perfil para reavaliação.",
            });

        if (requestError) {
            throw requestError;
        }
        
        // Notify admins that the teacher resubmitted their profile
        await notifyAdmins({
            type: "teacher_pending_approval",
            payload: {
                title: profileRow?.full_name || "Professor",
                message: `O professor ${profileRow?.full_name || "Professor"} atualizou o perfil e aguarda reavaliação.`,
                href: "/protected",
            }
        });
    } else if (params.qualificationDocumentUrl?.trim()) {
        const { data: requestRow } = await serviceRoleClient
            .from("teacher_request")
            .select("id")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

        if (requestRow?.id) {
            await serviceRoleClient
                .from("teacher_request")
                .update({ qualification_document_url: nextQualificationDocumentUrl })
                .eq("id", requestRow.id);
        } else {
            await serviceRoleClient
                .from("teacher_request")
                .insert({
                    user_id: user.id,
                    status: "pending",
                    qualification_document_url: nextQualificationDocumentUrl,
                    observations: "Comprovante de qualificação atualizado.",
                });
        }
    }

    revalidatePath("/protected/perfil");
    revalidatePath("/protected");

    if (currentStatus === "rejected") {
        return {
            reverificationRequested: true,
            message: "Perfil salvo. Sua solicitação voltou para verificação pendente.",
            verificationStatus: "pending",
            qualificationDocumentUrl: nextQualificationDocumentUrl,
        };
    }

    return {
        reverificationRequested: false,
        message: "Perfil de professor salvo com sucesso.",
        verificationStatus: nextStatus,
        qualificationDocumentUrl: nextQualificationDocumentUrl,
    };
}

export async function getTeacherVerificationStatus(userId: string): Promise<TeacherVerificationStatus> {
    const supabase = await createServerSupabase();
    const { data } = await supabase
        .from("user_profile")
        .select("verification_status")
        .eq("id", userId)
        .maybeSingle();

    return (data?.verification_status || null) as TeacherVerificationStatus;
}

export async function ensureTeacherVerifiedForPublishingByUserId(userId: string): Promise<void> {
    const supabase = await createServerSupabase();
    const role = await fetchRoleForUser(userId, supabase);
    if (role === "admin") {
        return;
    }

    if (role !== "teacher") {
        throw new Error("Apenas professores aprovados podem executar esta ação.");
    }

    const status = await getTeacherVerificationStatus(userId);
    if (status !== "approved") {
        throw new Error("Professor não verificado. Aguarde aprovação do administrador.");
    }
}

export async function ensureCurrentTeacherVerifiedForPublishing(): Promise<void> {
    const supabase = await createServerSupabase();
    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;
    if (!user) {
        throw new Error("Usuário não autenticado.");
    }
    await ensureTeacherVerifiedForPublishingByUserId(user.id);
}

export async function setTeacherVerificationStatusByAdmin(params: {
    teacherId: string;
    status: Exclude<TeacherVerificationStatus, null>;
    reason?: string;
}) {
    const supabase = await createServerSupabase();
    const { data: authData } = await supabase.auth.getUser();
    const currentUser = authData?.user;
    if (!currentUser) {
        throw new Error("Usuário não autenticado.");
    }

    const currentRole = await fetchRoleForUser(currentUser.id, supabase);
    if (currentRole !== "admin") {
        throw new Error("Acesso negado. Permissões de administrador necessárias.");
    }

    const targetRole = await fetchRoleForUser(params.teacherId, supabase);
    if (targetRole !== "teacher") {
        throw new Error("Usuário informado não é professor.");
    }

    const adminClient = await createAdminClient();
    const now = new Date().toISOString();

    const { data: latestTeacherRequest } = await adminClient
        .from("teacher_request")
        .select("qualification_document_url")
        .eq("user_id", params.teacherId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (params.status === "approved" && !latestTeacherRequest?.qualification_document_url) {
        throw new Error("Não é possível aprovar sem anexo de qualificação do professor.");
    }

    const { error: profileError } = await adminClient
        .from("user_profile")
        .update({ verification_status: params.status, updated_at: now })
        .eq("id", params.teacherId);

    if (profileError) {
        throw profileError;
    }

    const { error: requestError } = await adminClient
        .from("teacher_request")
        .insert({
            user_id: params.teacherId,
            status: params.status,
            observations: params.reason?.trim() || null,
            qualification_document_url: latestTeacherRequest?.qualification_document_url || null,
            reviewed_by: currentUser.id,
            reviewed_at: now,
        });

    if (requestError) {
        throw requestError;
    }

    // Notify the teacher about their new status
    await createNotification({
        userId: params.teacherId,
        type: params.status === "approved" ? "teacher_approved" : "teacher_rejected",
        payload: {
            title: params.status === "approved" ? "Aprovado" : "Reprovado",
            message: params.status === "approved"
                ? "Seu perfil de professor foi aprovado! Agora você pode criar cursos e turmas."
                : `Seu perfil de professor foi reprovado. Motivo: ${params.reason || "Não informado"}`,
            href: "/protected/perfil",
        }
    });

    revalidatePath("/protected");
    revalidatePath("/protected/perfil");
}