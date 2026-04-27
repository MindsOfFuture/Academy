import { createClient as createServerSupabase, createServiceRoleClient } from "@/lib/supabase/server";
import { sendNotificationEmail } from "@/lib/email/resend";

// ----- Types -----

export type NotificationType =
    | "assignment_graded"
    | "chat_message"
    | "teacher_approved"
    | "teacher_rejected"
    | "teacher_pending_approval"
    | "new_enrollment"
    | "assignment_submitted";

export interface NotificationPayload {
    /** Short title shown in the bell dropdown */
    title: string;
    /** Longer description */
    message: string;
    /** URL to navigate to when the notification is clicked */
    href?: string;
    /** Extra structured data */
    [key: string]: unknown;
}

export interface Notification {
    id: string;
    userId: string;
    type: NotificationType;
    payload: NotificationPayload;
    readAt: string | null;
    createdAt: string;
}

// ----- Email templates -----

function buildEmailHtml(title: string, message: string, href?: string): string {
    return `
    <div style="font-family:'Segoe UI',Roboto,sans-serif;max-width:520px;margin:0 auto;padding:24px;background:#f9f7fc;border-radius:12px;">
        <div style="text-align:center;margin-bottom:16px;">
            <h2 style="color:#684A97;margin:0;">Minds of the Future</h2>
        </div>
        <div style="background:#fff;border-radius:8px;padding:20px;border:1px solid #e5e0ed;">
            <h3 style="margin:0 0 8px;color:#333;">${title}</h3>
            <p style="margin:0 0 16px;color:#555;line-height:1.5;">${message}</p>
            ${href ? `<a href="${href}" style="display:inline-block;background:#684A97;color:#fff;padding:10px 20px;border-radius:24px;text-decoration:none;font-weight:600;">Acessar</a>` : ""}
        </div>
        <p style="text-align:center;margin-top:16px;font-size:12px;color:#999;">
            Você recebeu este e-mail porque tem uma conta na plataforma Minds of the Future.
        </p>
    </div>`;
}

function emailSubjectForType(type: NotificationType, title: string): string {
    switch (type) {
        case "assignment_graded":
            return `📝 Atividade corrigida: ${title}`;
        case "chat_message":
            return `💬 Nova mensagem: ${title}`;
        case "teacher_approved":
            return `✅ Conta de professor aprovada`;
        case "teacher_rejected":
            return `❌ Conta de professor reprovada`;
        case "teacher_pending_approval":
            return `📋 Novo professor aguardando aprovação`;
        case "new_enrollment":
            return `🎓 Nova matrícula: ${title}`;
        case "assignment_submitted":
            return `📤 Nova entrega de atividade: ${title}`;
        default:
            return `Notificação: ${title}`;
    }
}

// ----- Core functions -----

/**
 * Creates an in-app notification AND sends an email.
 * Uses serviceRoleClient to bypass RLS for the INSERT.
 */
export async function createNotification(params: {
    userId: string;
    type: NotificationType;
    payload: NotificationPayload;
}): Promise<void> {
    const serviceRole = await createServiceRoleClient();

    // Insert notification row
    const { error } = await serviceRole
        .from("notification")
        .insert({
            user_id: params.userId,
            type: params.type,
            channel: "in-app",
            payload: params.payload,
        });

    if (error) {
        console.error("[createNotification] Falha ao inserir notificação:", error);
        // Don't throw — we still want to attempt email
    }

    // Fetch user email for the email dispatch
    const { data: profile } = await serviceRole
        .from("user_profile")
        .select("email")
        .eq("id", params.userId)
        .maybeSingle();

    if (profile?.email) {
        const subject = emailSubjectForType(params.type, params.payload.title);
        const html = buildEmailHtml(
            params.payload.title,
            params.payload.message,
            params.payload.href
                ? `${process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin : ""}${params.payload.href}`
                : undefined,
        );
        // Fire-and-forget — email failure must not block
        sendNotificationEmail(profile.email, subject, html).catch(() => {});
    } else {
        console.warn("[createNotification] Usuário sem e-mail para envio:", {
            userId: params.userId,
            type: params.type,
        });
    }
}

/**
 * Returns all notifications for the authenticated user, newest first.
 * If `unreadOnly` is true, returns only unread ones.
 */
export async function getUserNotifications(options?: {
    unreadOnly?: boolean;
    limit?: number;
}): Promise<Notification[]> {
    const supabase = await createServerSupabase();
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) return [];

    let query = supabase
        .from("notification")
        .select("id, user_id, type, payload, read_at, created_at")
        .eq("user_id", authData.user.id)
        .order("created_at", { ascending: false })
        .limit(options?.limit ?? 50);

    if (options?.unreadOnly) {
        query = query.is("read_at", null);
    }

    const { data, error } = await query;
    if (error || !data) return [];

    return data.map((row) => ({
        id: row.id,
        userId: row.user_id,
        type: row.type as NotificationType,
        payload: row.payload as unknown as NotificationPayload,
        readAt: row.read_at,
        createdAt: row.created_at,
    }));
}

/**
 * Returns the unread count for the authenticated user.
 */
export async function getUnreadCount(): Promise<number> {
    const supabase = await createServerSupabase();
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) return 0;

    const { count, error } = await supabase
        .from("notification")
        .select("id", { count: "exact", head: true })
        .eq("user_id", authData.user.id)
        .is("read_at", null);

    if (error) return 0;
    return count ?? 0;
}

/**
 * Marks a single notification as read.
 */
export async function markNotificationRead(notificationId: string): Promise<boolean> {
    const supabase = await createServerSupabase();
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) return false;

    const { error } = await supabase
        .from("notification")
        .update({ read_at: new Date().toISOString() })
        .eq("id", notificationId)
        .eq("user_id", authData.user.id); // RLS-safe: only own notifications

    return !error;
}

/**
 * Marks ALL notifications of the authenticated user as read.
 */
export async function markAllNotificationsRead(): Promise<boolean> {
    const supabase = await createServerSupabase();
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) return false;

    const { error } = await supabase
        .from("notification")
        .update({ read_at: new Date().toISOString() })
        .eq("user_id", authData.user.id)
        .is("read_at", null);

    return !error;
}

/**
 * Notifies all administrators.
 */
export async function notifyAdmins(params: {
    type: NotificationType;
    payload: NotificationPayload;
}): Promise<void> {
    const serviceRole = await createServiceRoleClient();
    
    // Get the admin role ID
    const { data: roleData } = await serviceRole
        .from("role")
        .select("id")
        .eq("name", "admin")
        .maybeSingle();
        
    if (!roleData) {
        console.warn("[notifyAdmins] Papel 'admin' não encontrado na tabela role.");
        return;
    }

    // Get all admin user IDs
    const { data: adminUsers } = await serviceRole
        .from("user_role")
        .select("user_profile_id")
        .eq("role_id", roleData.id);

    if (!adminUsers || adminUsers.length === 0) {
        console.warn("[notifyAdmins] Nenhum usuário admin encontrado para notificação.");
        return;
    }

    console.info("[notifyAdmins] Notificando administradores:", {
        adminCount: adminUsers.length,
        type: params.type,
        title: params.payload.title,
    });

    // Create notifications in parallel
    await Promise.all(
        adminUsers.map((admin) =>
            createNotification({
                userId: admin.user_profile_id,
                type: params.type,
                payload: params.payload,
            }).catch(() => {}) // Silently fail individually to not break others
        )
    );
}
