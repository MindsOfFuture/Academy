import { NextResponse } from "next/server";
import {
    createNotification,
    getUserNotifications,
    getUnreadCount,
    markNotificationRead,
    markAllNotificationsRead,
    notifyAdmins,
    type NotificationType,
    type NotificationPayload,
} from "@/lib/api/notifications-server";
import { createClient as createServerSupabase, createServiceRoleClient } from "@/lib/supabase/server";
import { clientIp, rateLimit } from "@/lib/rate-limit";

/**
 * GET /api/notifications
 * Returns notifications for the current user.
 * Query params: ?unreadOnly=true&limit=30
 */
export async function GET(request: Request) {
    try {
        const supabase = await createServerSupabase();
        const { data: authData } = await supabase.auth.getUser();
        if (!authData?.user) {
            return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const unreadOnly = searchParams.get("unreadOnly") === "true";
        const countOnly = searchParams.get("countOnly") === "true";
        const parsedLimit = parseInt(searchParams.get("limit") || "50", 10);
        const limit = Number.isFinite(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 100) : 50;

        if (countOnly) {
            const count = await getUnreadCount();
            return NextResponse.json({ count });
        }

        const notifications = await getUserNotifications({ unreadOnly, limit });
        return NextResponse.json({ notifications });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Erro ao buscar notificações";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

/**
 * Aviso aos admins de que um professor aguarda aprovação.
 *
 * Precisa aceitar chamada anônima: no cadastro por e-mail/senha a confirmação
 * é obrigatória, então não existe sessão logo após o signUp. Em vez de confiar
 * no corpo enviado pelo cliente (que gerava spam de e-mail com texto arbitrário
 * para todos os admins), a rota resolve o professor no banco e só notifica se
 * ele realmente estiver pendente — e só uma vez.
 */
async function handleTeacherPendingNotice(request: Request, authenticatedUserId: string | null) {
    const serviceRole = await createServiceRoleClient();

    let profileQuery = serviceRole
        .from("user_profile")
        .select("id, full_name, verification_status");

    if (authenticatedUserId) {
        profileQuery = profileQuery.eq("id", authenticatedUserId);
    } else {
        if (!rateLimit(`teacher-pending-notice:${clientIp(request)}`, 5, 60 * 60 * 1000)) {
            return NextResponse.json({ error: "Muitas solicitações." }, { status: 429 });
        }

        const body = await request.clone().json().catch(() => null);
        const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
        if (!email) {
            return NextResponse.json({ error: "E-mail é obrigatório." }, { status: 400 });
        }
        profileQuery = profileQuery.eq("email", email);
    }

    const { data: profile } = await profileQuery.maybeSingle();

    // Resposta genérica: não confirma se o e-mail existe na base.
    if (!profile || profile.verification_status !== "pending") {
        return NextResponse.json({ success: true });
    }

    // Idempotente: reenviar o formulário não redispara e-mail para os admins.
    const { data: existing } = await serviceRole
        .from("notification")
        .select("id")
        .eq("type", "teacher_pending_approval")
        .eq("payload->>teacherId", profile.id)
        .limit(1)
        .maybeSingle();

    if (existing) {
        return NextResponse.json({ success: true });
    }

    const fullName = profile.full_name || "Professor";
    await notifyAdmins({
        type: "teacher_pending_approval",
        payload: {
            title: fullName,
            message: `O professor ${fullName} criou uma conta e aguarda aprovação.`,
            href: "/protected",
            teacherId: profile.id,
        },
    });

    return NextResponse.json({ success: true });
}

/**
 * POST /api/notifications
 * Creates a notification. Requires authentication.
 * Body: { userId, type, payload }
 */
export async function POST(request: Request) {
    try {
        const body = await request.clone().json();
        const { action, userId, type, payload } = body as {
            action?: "notify_admins";
            userId?: string;
            type: NotificationType;
            payload: NotificationPayload;
        };

        const supabase = await createServerSupabase();
        const { data: authData } = await supabase.auth.getUser();
        const currentUserId = authData?.user?.id ?? null;

        // Único caso que dispensa sessão, e mesmo assim o conteúdo vem do banco.
        if (action === "notify_admins" && type === "teacher_pending_approval") {
            return await handleTeacherPendingNotice(request, currentUserId);
        }

        if (!currentUserId) {
            return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
        }

        // Notificar todos os admins com texto livre é privilégio de admin.
        if (action === "notify_admins") {
            return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
        }

        if (!userId || !type || !payload?.title) {
            return NextResponse.json({ error: "Campos obrigatórios: userId, type, payload.title" }, { status: 400 });
        }

        await createNotification({ userId, type, payload });
        return NextResponse.json({ success: true });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Erro ao criar notificação";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

/**
 * PATCH /api/notifications
 * Marks notification(s) as read.
 * Body: { notificationId } for single, or { all: true } for all.
 */
export async function PATCH(request: Request) {
    try {
        const supabase = await createServerSupabase();
        const { data: authData } = await supabase.auth.getUser();
        if (!authData?.user) {
            return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
        }

        const body = await request.json();

        if (body.all === true) {
            const success = await markAllNotificationsRead();
            return NextResponse.json({ success });
        }

        const { notificationId } = body as { notificationId: string };
        if (!notificationId) {
            return NextResponse.json({ error: "notificationId é obrigatório." }, { status: 400 });
        }

        const success = await markNotificationRead(notificationId);
        return NextResponse.json({ success });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Erro ao marcar notificação";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
