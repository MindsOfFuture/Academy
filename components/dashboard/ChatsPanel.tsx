"use client";

import { useEffect, useState, useCallback } from "react";
import {
    MessageSquare,
    ChevronDown,
    ChevronRight,
    Loader2,
    User,
    BookOpen,
    FileText,
    ArrowLeft,
} from "lucide-react";
import Image from "next/image";
import {
    fetchAllActiveChats,
    getCurrentChatUser,
    type ActiveChatGroup,
} from "@/lib/api/activity-chat";
import ActivityChat from "@/components/activities/activity-chat";
import type { ChatUser } from "@/lib/api/types";

export default function ChatsPanel() {
    const [groups, setGroups] = useState<ActiveChatGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<ChatUser | null>(null);
    const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set());
    const [expandedAssignments, setExpandedAssignments] = useState<Set<string>>(new Set());
    const [openChat, setOpenChat] = useState<{
        assignmentId: string;
        assignmentTitle: string;
        studentId: string;
        studentName: string;
    } | null>(null);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [chats, user] = await Promise.all([
                fetchAllActiveChats(),
                getCurrentChatUser(),
            ]);
            setGroups(chats);
            setCurrentUser(user);
            // Expandir todos os cursos por padrão
            setExpandedCourses(new Set(chats.map((g) => g.courseId)));
        } catch (error) {
            console.error("Erro ao carregar chats:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const toggleCourse = (courseId: string) => {
        setExpandedCourses((prev) => {
            const next = new Set(prev);
            if (next.has(courseId)) next.delete(courseId);
            else next.add(courseId);
            return next;
        });
    };

    const toggleAssignment = (assignmentId: string) => {
        setExpandedAssignments((prev) => {
            const next = new Set(prev);
            if (next.has(assignmentId)) next.delete(assignmentId);
            else next.add(assignmentId);
            return next;
        });
    };

    const formatTime = (dateStr: string | null) => {
        if (!dateStr) return "";
        return new Date(dateStr).toLocaleString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const totalChats = groups.reduce(
        (sum, g) =>
            sum +
            g.assignments.reduce((s, a) => s + a.students.length, 0),
        0,
    );

    // Se um chat está aberto, mostra o chat
    if (openChat && currentUser) {
        return (
            <div>
                <button
                    onClick={() => setOpenChat(null)}
                    className="flex items-center gap-2 mb-4 text-purple-600 hover:text-purple-800 transition text-sm font-medium"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Voltar para lista de chats
                </button>

                <div className="mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                        Chat com {openChat.studentName}
                    </h3>
                    <p className="text-sm text-gray-500">
                        Atividade: {openChat.assignmentTitle}
                    </p>
                </div>

                <ActivityChat
                    assignmentId={openChat.assignmentId}
                    studentId={openChat.studentId}
                    currentUser={currentUser}
                />
            </div>
        );
    }

    return (
        <div>
            {/* Cabeçalho */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                        Conversas
                    </h2>
                    <p className="text-gray-600 text-sm">
                        {loading
                            ? "Carregando..."
                            : `${totalChats} conversa${totalChats !== 1 ? "s" : ""} ativa${totalChats !== 1 ? "s" : ""}`}
                    </p>
                </div>
                <button
                    onClick={loadData}
                    disabled={loading}
                    className="text-sm text-purple-600 hover:text-purple-800 disabled:text-gray-400 transition"
                >
                    Atualizar
                </button>
            </div>

            {/* Loading */}
            {loading && (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                </div>
            )}

            {/* Sem chats */}
            {!loading && groups.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                    <MessageSquare className="w-12 h-12 mb-3" />
                    <p className="text-base font-medium">
                        Nenhuma conversa encontrada
                    </p>
                    <p className="text-sm mt-1">
                        As conversas aparecerão aqui quando alunos iniciarem chats nas atividades.
                    </p>
                </div>
            )}

            {/* Lista agrupada */}
            {!loading && groups.length > 0 && (
                <div className="space-y-4">
                    {groups.map((group) => (
                        <div
                            key={group.courseId}
                            className="bg-white border border-gray-200 rounded-lg overflow-hidden"
                        >
                            {/* Curso header */}
                            <button
                                onClick={() => toggleCourse(group.courseId)}
                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition text-left"
                            >
                                {expandedCourses.has(group.courseId) ? (
                                    <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
                                ) : (
                                    <ChevronRight className="w-4 h-4 text-gray-500 flex-shrink-0" />
                                )}
                                <BookOpen className="w-5 h-5 text-purple-600 flex-shrink-0" />
                                <span className="font-semibold text-gray-900">
                                    {group.courseTitle}
                                </span>
                                <span className="ml-auto text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                                    {group.assignments.reduce(
                                        (s, a) => s + a.students.length,
                                        0,
                                    )}{" "}
                                    chat
                                    {group.assignments.reduce(
                                        (s, a) => s + a.students.length,
                                        0,
                                    ) !== 1
                                        ? "s"
                                        : ""}
                                </span>
                            </button>

                            {/* Atividades do curso */}
                            {expandedCourses.has(group.courseId) && (
                                <div className="border-t border-gray-100">
                                    {group.assignments.map((assignment) => (
                                        <div
                                            key={assignment.assignmentId}
                                            className="border-b border-gray-50 last:border-b-0"
                                        >
                                            {/* Atividade header */}
                                            <button
                                                onClick={() =>
                                                    toggleAssignment(
                                                        assignment.assignmentId,
                                                    )
                                                }
                                                className="w-full flex items-center gap-3 px-6 py-2.5 hover:bg-gray-50 transition text-left"
                                            >
                                                {expandedAssignments.has(
                                                    assignment.assignmentId,
                                                ) ? (
                                                    <ChevronDown className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                                ) : (
                                                    <ChevronRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                                )}
                                                <FileText className="w-4 h-4 text-purple-500 flex-shrink-0" />
                                                <div className="flex-1 min-w-0">
                                                    <span className="text-sm font-medium text-gray-800">
                                                        {assignment.assignmentTitle}
                                                    </span>
                                                    {assignment.lessonTitle && (
                                                        <span className="text-xs text-gray-400 ml-2">
                                                            • {assignment.lessonTitle}
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-xs text-gray-400">
                                                    {assignment.students.length} aluno
                                                    {assignment.students.length !== 1
                                                        ? "s"
                                                        : ""}
                                                </span>
                                            </button>

                                            {/* Lista de alunos */}
                                            {expandedAssignments.has(
                                                assignment.assignmentId,
                                            ) && (
                                                    <div className="bg-gray-50 px-6 py-2">
                                                        <ul className="space-y-1">
                                                            {assignment.students.map(
                                                                (student) => (
                                                                    <li
                                                                        key={
                                                                            student.studentId
                                                                        }
                                                                    >
                                                                        <button
                                                                            onClick={() =>
                                                                                setOpenChat({
                                                                                    assignmentId:
                                                                                        assignment.assignmentId,
                                                                                    assignmentTitle:
                                                                                        assignment.assignmentTitle,
                                                                                    studentId:
                                                                                        student.studentId,
                                                                                    studentName:
                                                                                        student.fullName,
                                                                                })
                                                                            }
                                                                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white transition text-left group"
                                                                        >
                                                                            {/* Avatar */}
                                                                            {student.avatarUrl ? (
                                                                                <Image
                                                                                    src={
                                                                                        student.avatarUrl
                                                                                    }
                                                                                    alt={
                                                                                        student.fullName
                                                                                    }
                                                                                    width={
                                                                                        36
                                                                                    }
                                                                                    height={
                                                                                        36
                                                                                    }
                                                                                    className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                                                                                />
                                                                            ) : (
                                                                                <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                                                                                    <User className="w-4 h-4 text-purple-600" />
                                                                                </div>
                                                                            )}

                                                                            {/* Info */}
                                                                            <div className="flex-1 min-w-0">
                                                                                <p className="text-sm font-medium text-gray-700 group-hover:text-purple-700 transition">
                                                                                    {
                                                                                        student.fullName
                                                                                    }
                                                                                </p>
                                                                                {student.lastMessage && (
                                                                                    <p className="text-xs text-gray-400 truncate">
                                                                                        {
                                                                                            student.lastMessage
                                                                                        }
                                                                                    </p>
                                                                                )}
                                                                            </div>

                                                                            {/* Hora */}
                                                                            {student.lastMessageAt && (
                                                                                <span className="text-[10px] text-gray-400 flex-shrink-0">
                                                                                    {formatTime(
                                                                                        student.lastMessageAt,
                                                                                    )}
                                                                                </span>
                                                                            )}

                                                                            <MessageSquare className="w-4 h-4 text-gray-300 group-hover:text-purple-500 transition flex-shrink-0" />
                                                                        </button>
                                                                    </li>
                                                                ),
                                                            )}
                                                        </ul>
                                                    </div>
                                                )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
