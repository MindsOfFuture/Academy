import { NextResponse } from "next/server";
import {
    createNotification,
    getUserNotifications,
    getUnreadCount,
    markNotificationRead,
    markAllNotificationsRead,
    type NotificationType,
    type NotificationPayload,
} from "@/lib/api/notifications-server";
import { createClient as createServerSupabase } from "@/lib/supabase/server";

/**
 * GET /api/notifications
 * Returns notifications for the current user.
 * Query params: ?unreadOnly=true&limit=30
 */
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const unreadOnly = searchParams.get("unreadOnly") === "true";
        const countOnly = searchParams.get("countOnly") === "true";
        const limit = parseInt(searchParams.get("limit") || "50", 10);

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
 * POST /api/notifications
 * Creates a notification. Requires authentication.
 * Body: { userId, type, payload }
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { action, userId, type, payload } = body as {
            action?: "notify_admins";
            userId?: string;
            type: NotificationType;
            payload: NotificationPayload;
        };

        // Some actions (like new teacher sign up) happen before the user is fully authenticated
        const isPublicAction = action === "notify_admins" && type === "teacher_pending_approval";

        // Verify sender is authenticated unless it's a public action
        const supabase = await createServerSupabase();
        const { data: authData } = await supabase.auth.getUser();
        if (!authData?.user && !isPublicAction) {
            return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
        }

        if (action === "notify_admins") {
            if (!type || !payload?.title) {
                return NextResponse.json({ error: "Campos obrigatórios para admin: type, payload.title" }, { status: 400 });
            }
            // Import must be added to top of file
            const { notifyAdmins } = await import("@/lib/api/notifications-server");
            await notifyAdmins({ type, payload });
            return NextResponse.json({ success: true });
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
