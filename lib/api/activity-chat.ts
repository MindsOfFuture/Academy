import { createClient as createBrowserSupabase } from "@/lib/supabase/client";
import {
    type ActivityChatMessageRow,
    type ActivityChatMessage,
    type ChatUser,
    type RoleName,
} from "./types";

const PAGE_SIZE = 30;

// --- Helpers ---

function mapMessage(row: ActivityChatMessageRow): ActivityChatMessage {
    const sender = Array.isArray(row.sender) ? row.sender[0] : row.sender;
    return {
        id: row.id,
        assignmentId: row.assignment_id,
        studentId: row.student_id,
        senderId: row.sender_id,
        content: row.content,
        createdAt: row.created_at,
        senderName: sender?.full_name ?? "Usuário",
        senderAvatar: sender?.avatar_url ?? null,
    };
}

// --- Queries ---

/**
 * Busca mensagens de um chat (assignment + student).
 * Retorna as últimas `PAGE_SIZE` mensagens anteriores a `before` (cursor).
 * Mensagens vêm em ordem cronológica (mais antigas primeiro).
 */
export async function fetchMessages(
    assignmentId: string,
    studentId: string,
    options?: { before?: string },
): Promise<ActivityChatMessage[]> {
    const supabase = createBrowserSupabase();

    let query = supabase
        .from("activity_chat_message")
        .select(
            "id, assignment_id, student_id, sender_id, content, created_at, sender:user_profile!activity_chat_message_sender_id_fkey(full_name, avatar_url)",
        )
        .eq("assignment_id", assignmentId)
        .eq("student_id", studentId)
        .order("created_at", { ascending: false })
        .limit(PAGE_SIZE);

    if (options?.before) {
        query = query.lt("created_at", options.before);
    }

    const { data, error } = await query;

    if (error) {
        console.error("Erro ao buscar mensagens do chat:", error);
        return [];
    }

    // Inverter para ordem cronológica (mais antigas no topo)
    return (data as unknown as ActivityChatMessageRow[])
        .map(mapMessage)
        .reverse();
}

/**
 * Envia uma mensagem no chat.
 */
export async function sendMessage(
    assignmentId: string,
    studentId: string,
    content: string,
): Promise<ActivityChatMessage | null> {
    const supabase = createBrowserSupabase();

    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado.");

    const { data, error } = await supabase
        .from("activity_chat_message")
        .insert({
            assignment_id: assignmentId,
            student_id: studentId,
            sender_id: user.id,
            content,
        })
        .select(
            "id, assignment_id, student_id, sender_id, content, created_at, sender:user_profile!activity_chat_message_sender_id_fkey(full_name, avatar_url)",
        )
        .single();

    if (error) {
        console.error("Erro ao enviar mensagem:", error);
        throw error;
    }

    return mapMessage(data as unknown as ActivityChatMessageRow);
}

/**
 * Inscreve-se em novas mensagens de um chat via Supabase Realtime.
 * Retorna função de cleanup para cancelar a subscription.
 */
export function subscribeToMessages(
    assignmentId: string,
    studentId: string,
    onNewMessage: (message: ActivityChatMessage) => void,
): () => void {
    const supabase = createBrowserSupabase();

    const channel = supabase
        .channel(`chat:${assignmentId}:${studentId}`)
        .on(
            "postgres_changes",
            {
                event: "INSERT",
                schema: "public",
                table: "activity_chat_message",
                filter: `assignment_id=eq.${assignmentId}`,
            },
            async (payload) => {
                const row = payload.new as Record<string, unknown>;

                // Filtrar pelo student_id (Realtime não suporta filtro composto)
                if (row.student_id !== studentId) return;

                // Buscar dados do sender (nome e avatar)
                const { data: senderData } = await supabase
                    .from("user_profile")
                    .select("full_name, avatar_url")
                    .eq("id", row.sender_id as string)
                    .single();

                const message: ActivityChatMessage = {
                    id: row.id as string,
                    assignmentId: row.assignment_id as string,
                    studentId: row.student_id as string,
                    senderId: row.sender_id as string,
                    content: row.content as string,
                    createdAt: row.created_at as string,
                    senderName: senderData?.full_name ?? "Usuário",
                    senderAvatar: senderData?.avatar_url ?? null,
                };

                onNewMessage(message);
            },
        )
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
}

/**
 * Lista alunos que possuem submission em uma atividade.
 * Útil para a tela do professor selecionar qual chat abrir.
 */
export async function fetchChatStudents(
    assignmentId: string,
): Promise<{ studentId: string; fullName: string; avatarUrl: string | null }[]> {
    const supabase = createBrowserSupabase();

    const { data, error } = await supabase
        .from("assignment_submission")
        .select(
            "user_id, user:user_profile!assignment_submission_user_id_fkey(full_name, avatar_url)",
        )
        .eq("assignment_id", assignmentId);

    if (error || !data) return [];

    // Deduplicar por user_id
    const seen = new Set<string>();
    return data
        .filter((row) => {
            const uid = (row as Record<string, unknown>).user_id as string;
            if (seen.has(uid)) return false;
            seen.add(uid);
            return true;
        })
        .map((row) => {
            const r = row as Record<string, unknown>;
            const user = Array.isArray(r.user)
                ? (r.user as Record<string, unknown>[])[0]
                : (r.user as Record<string, unknown>);
            return {
                studentId: r.user_id as string,
                fullName: (user?.full_name as string) ?? "Aluno",
                avatarUrl: (user?.avatar_url as string) ?? null,
            };
        });
}

/**
 * Busca todas as atividades que possuem mensagens de chat.
 * Retorna agrupadas por curso → atividade → alunos com mensagens.
 * Útil para a aba centralizada de Chats no painel de gerenciamento.
 */
export async function fetchAllActiveChats(): Promise<ActiveChatGroup[]> {
    const supabase = createBrowserSupabase();

    // Buscar todas as mensagens agrupando por assignment_id + student_id
    const { data: chatPairs, error } = await supabase
        .from("activity_chat_message")
        .select("assignment_id, student_id")
        .order("created_at", { ascending: false });

    if (error || !chatPairs || chatPairs.length === 0) return [];

    // Deduplicar pares (assignment_id, student_id)
    const seen = new Set<string>();
    const uniquePairs: { assignment_id: string; student_id: string }[] = [];
    for (const row of chatPairs) {
        const key = `${row.assignment_id}:${row.student_id}`;
        if (!seen.has(key)) {
            seen.add(key);
            uniquePairs.push(row);
        }
    }

    // Buscar IDs únicos de assignments e students
    const assignmentIds = [...new Set(uniquePairs.map((p) => p.assignment_id))];
    const studentIds = [...new Set(uniquePairs.map((p) => p.student_id))];

    // Buscar dados de assignments com lesson → course
    const { data: assignments } = await supabase
        .from("assignment")
        .select("id, title, lesson_id, lesson!inner(title, course_id, course!inner(id, title))")
        .in("id", assignmentIds);

    // Buscar dados dos alunos
    const { data: students } = await supabase
        .from("user_profile")
        .select("id, full_name, avatar_url")
        .in("id", studentIds);

    // Buscar última mensagem de cada chat
    const { data: lastMessages } = await supabase
        .from("activity_chat_message")
        .select("assignment_id, student_id, content, created_at, sender_id")
        .order("created_at", { ascending: false });

    // Mapear dados
    const assignmentMap = new Map<string, Record<string, unknown>>();
    if (assignments) {
        for (const a of assignments) {
            assignmentMap.set(a.id, a as Record<string, unknown>);
        }
    }

    const studentMap = new Map<string, { id: string; full_name: string | null; avatar_url: string | null }>();
    if (students) {
        for (const s of students) {
            studentMap.set(s.id, s);
        }
    }

    // Mapear última mensagem por par
    const lastMsgMap = new Map<string, { content: string; created_at: string; sender_id: string }>();
    if (lastMessages) {
        for (const m of lastMessages) {
            const key = `${m.assignment_id}:${m.student_id}`;
            if (!lastMsgMap.has(key)) {
                lastMsgMap.set(key, m);
            }
        }
    }

    // Agrupar por curso
    const courseGroups = new Map<string, ActiveChatGroup>();

    for (const pair of uniquePairs) {
        const assignment = assignmentMap.get(pair.assignment_id);
        if (!assignment) continue;

        const lesson = Array.isArray(assignment.lesson)
            ? (assignment.lesson as Record<string, unknown>[])[0]
            : (assignment.lesson as Record<string, unknown>);
        if (!lesson) continue;

        const course = Array.isArray(lesson.course)
            ? (lesson.course as Record<string, unknown>[])[0]
            : (lesson.course as Record<string, unknown>);
        if (!course) continue;

        const courseId = course.id as string;
        const courseTitle = course.title as string;

        if (!courseGroups.has(courseId)) {
            courseGroups.set(courseId, {
                courseId,
                courseTitle,
                assignments: [],
            });
        }

        const group = courseGroups.get(courseId)!;
        let assignmentGroup = group.assignments.find(
            (a) => a.assignmentId === pair.assignment_id,
        );
        if (!assignmentGroup) {
            assignmentGroup = {
                assignmentId: pair.assignment_id,
                assignmentTitle: (assignment.title as string) ?? "Atividade",
                lessonTitle: (lesson.title as string) ?? "",
                students: [],
            };
            group.assignments.push(assignmentGroup);
        }

        const student = studentMap.get(pair.student_id);
        const lastMsg = lastMsgMap.get(`${pair.assignment_id}:${pair.student_id}`);

        assignmentGroup.students.push({
            studentId: pair.student_id,
            fullName: student?.full_name ?? "Aluno",
            avatarUrl: student?.avatar_url ?? null,
            lastMessage: lastMsg?.content ?? null,
            lastMessageAt: lastMsg?.created_at ?? null,
        });
    }

    return Array.from(courseGroups.values());
}

export interface ActiveChatGroup {
    courseId: string;
    courseTitle: string;
    assignments: {
        assignmentId: string;
        assignmentTitle: string;
        lessonTitle: string;
        students: {
            studentId: string;
            fullName: string;
            avatarUrl: string | null;
            lastMessage: string | null;
            lastMessageAt: string | null;
        }[];
    }[];
}

/**
 * Busca perfil e role do usuário autenticado para uso no chat.
 */
export async function getCurrentChatUser(): Promise<ChatUser | null> {
    const supabase = createBrowserSupabase();

    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    // Buscar perfil
    const { data: profile } = await supabase
        .from("user_profile")
        .select("id, full_name, avatar_url")
        .eq("id", user.id)
        .single();

    // Buscar role
    const { data: roleData } = await supabase
        .from("user_role")
        .select("role(name)")
        .eq("user_profile_id", user.id)
        .maybeSingle();

    let role: RoleName = "student";
    if (roleData?.role) {
        const r = Array.isArray(roleData.role) ? roleData.role[0] : roleData.role;
        if (r?.name) role = r.name as RoleName;
    }

    return {
        id: user.id,
        fullName: profile?.full_name ?? "Usuário",
        avatarUrl: profile?.avatar_url ?? null,
        role,
    };
}
