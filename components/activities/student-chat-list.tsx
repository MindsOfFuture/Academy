"use client";

import { useEffect, useState, useCallback } from "react";
import {
    MessageSquare,
    ChevronLeft,
    Loader2,
    User,
    X,
} from "lucide-react";
import Image from "next/image";
import { fetchChatStudents } from "@/lib/api/activity-chat";
import { getCurrentChatUser } from "@/lib/api/activity-chat";
import ActivityChat from "@/components/activities/activity-chat";
import type { ChatUser } from "@/lib/api/types";

interface StudentChatListProps {
    assignmentId: string;
    assignmentTitle: string;
    onClose: () => void;
}

export default function StudentChatList({
    assignmentId,
    assignmentTitle,
    onClose,
}: StudentChatListProps) {
    const [students, setStudents] = useState<
        { studentId: string; fullName: string; avatarUrl: string | null }[]
    >([]);
    const [loading, setLoading] = useState(true);
    const [selectedStudent, setSelectedStudent] = useState<{
        studentId: string;
        fullName: string;
    } | null>(null);
    const [currentUser, setCurrentUser] = useState<ChatUser | null>(null);

    const loadStudents = useCallback(async () => {
        setLoading(true);
        try {
            const [studentsData, user] = await Promise.all([
                fetchChatStudents(assignmentId),
                getCurrentChatUser(),
            ]);
            setStudents(studentsData);
            setCurrentUser(user);
        } catch (error) {
            console.error("Erro ao carregar alunos:", error);
        } finally {
            setLoading(false);
        }
    }, [assignmentId]);

    useEffect(() => {
        loadStudents();
    }, [loadStudents]);

    // Se um aluno está selecionado, mostra o chat
    if (selectedStudent && currentUser) {
        return (
            <div className="border border-purple-200 rounded-lg overflow-hidden bg-white mt-3">
                {/* Header com botão voltar */}
                <div className="flex items-center gap-2 px-4 py-2.5 bg-purple-50 border-b border-purple-200">
                    <button
                        onClick={() => setSelectedStudent(null)}
                        className="p-1 hover:bg-purple-100 rounded transition"
                        title="Voltar para lista de alunos"
                    >
                        <ChevronLeft className="w-4 h-4 text-purple-700" />
                    </button>
                    <User className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium text-purple-800">
                        Chat com {selectedStudent.fullName}
                    </span>
                    <button
                        onClick={onClose}
                        className="ml-auto p-1 hover:bg-purple-100 rounded transition"
                        title="Fechar"
                    >
                        <X className="w-4 h-4 text-gray-500" />
                    </button>
                </div>

                <ActivityChat
                    assignmentId={assignmentId}
                    studentId={selectedStudent.studentId}
                    currentUser={currentUser}
                />
            </div>
        );
    }

    return (
        <div className="border border-purple-200 rounded-lg overflow-hidden bg-white mt-3">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-purple-50 border-b border-purple-200">
                <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium text-purple-800">
                        Conversas — {assignmentTitle}
                    </span>
                </div>
                <button
                    onClick={onClose}
                    className="p-1 hover:bg-purple-100 rounded transition"
                    title="Fechar"
                >
                    <X className="w-4 h-4 text-gray-500" />
                </button>
            </div>

            {/* Conteúdo */}
            <div className="p-3">
                {loading ? (
                    <div className="flex items-center justify-center py-6">
                        <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
                    </div>
                ) : students.length === 0 ? (
                    <div className="text-center py-6 text-gray-400">
                        <MessageSquare className="w-8 h-8 mx-auto mb-2" />
                        <p className="text-sm">Nenhum aluno enviou respostas ainda.</p>
                    </div>
                ) : (
                    <ul className="space-y-1">
                        {students.map((student) => (
                            <li key={student.studentId}>
                                <button
                                    onClick={() =>
                                        setSelectedStudent({
                                            studentId: student.studentId,
                                            fullName: student.fullName,
                                        })
                                    }
                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-purple-50 transition text-left group"
                                >
                                    {/* Avatar */}
                                    {student.avatarUrl ? (
                                        <Image
                                            src={student.avatarUrl}
                                            alt={student.fullName}
                                            width={32}
                                            height={32}
                                            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                                        />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                                            <User className="w-4 h-4 text-purple-600" />
                                        </div>
                                    )}

                                    {/* Nome */}
                                    <span className="text-sm font-medium text-gray-700 group-hover:text-purple-700 transition">
                                        {student.fullName}
                                    </span>

                                    {/* Seta */}
                                    <MessageSquare className="w-4 h-4 text-gray-300 group-hover:text-purple-500 ml-auto transition" />
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
