"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Send, MessageSquare, ChevronUp, Loader2 } from "lucide-react";
import {
    fetchMessages,
    sendMessage,
    subscribeToMessages,
} from "@/lib/api/activity-chat";
import type { ActivityChatMessage, ChatUser } from "@/lib/api/types";
import toast from "react-hot-toast";

interface ActivityChatProps {
    assignmentId: string;
    studentId: string;
    currentUser: ChatUser;
}

export default function ActivityChat({
    assignmentId,
    studentId,
    currentUser,
}: ActivityChatProps) {
    const [messages, setMessages] = useState<ActivityChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [loadingOlder, setLoadingOlder] = useState(false);
    const [sending, setSending] = useState(false);
    const [hasOlder, setHasOlder] = useState(true);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const isInitialLoad = useRef(true);

    // Scroll para o final
    const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
        messagesEndRef.current?.scrollIntoView({ behavior });
    }, []);

    // Carregar mensagens iniciais
    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            setLoading(true);
            try {
                const msgs = await fetchMessages(assignmentId, studentId);
                if (cancelled) return;
                setMessages(msgs);
                setHasOlder(msgs.length >= 30);
                isInitialLoad.current = true;
            } catch {
                toast.error("Erro ao carregar mensagens");
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        load();
        return () => { cancelled = true; };
    }, [assignmentId, studentId]);

    // Scroll ao carregar mensagens iniciais
    useEffect(() => {
        if (isInitialLoad.current && messages.length > 0 && !loading) {
            setTimeout(() => scrollToBottom("instant"), 50);
            isInitialLoad.current = false;
        }
    }, [messages, loading, scrollToBottom]);

    // Subscription Realtime
    useEffect(() => {
        const unsubscribe = subscribeToMessages(
            assignmentId,
            studentId,
            (message) => {
                setMessages((prev) => {
                    // Evitar duplicatas (mensagem já adicionada otimisticamente ou via fetch)
                    if (prev.some((m) => m.id === message.id)) return prev;
                    return [...prev, message];
                });
                // Auto-scroll ao receber nova mensagem
                setTimeout(() => scrollToBottom(), 50);
            },
        );

        return unsubscribe;
    }, [assignmentId, studentId, scrollToBottom]);

    // Carregar mensagens anteriores
    const loadOlderMessages = async () => {
        if (loadingOlder || !hasOlder || messages.length === 0) return;

        setLoadingOlder(true);
        const container = chatContainerRef.current;
        const prevScrollHeight = container?.scrollHeight ?? 0;

        try {
            const oldest = messages[0];
            const olderMsgs = await fetchMessages(assignmentId, studentId, {
                before: oldest.createdAt,
            });

            if (olderMsgs.length === 0) {
                setHasOlder(false);
            } else {
                setMessages((prev) => [...olderMsgs, ...prev]);
                setHasOlder(olderMsgs.length >= 30);

                // Manter posição de scroll
                requestAnimationFrame(() => {
                    if (container) {
                        container.scrollTop =
                            container.scrollHeight - prevScrollHeight;
                    }
                });
            }
        } catch {
            toast.error("Erro ao carregar mensagens anteriores");
        } finally {
            setLoadingOlder(false);
        }
    };

    // Enviar mensagem
    const handleSend = async () => {
        const text = newMessage.trim();
        if (!text || sending) return;

        setSending(true);
        setNewMessage("");

        try {
            await sendMessage(assignmentId, studentId, text);
            // A mensagem real chegará via Realtime subscription
            setTimeout(() => scrollToBottom(), 100);
        } catch {
            toast.error("Erro ao enviar mensagem");
            setNewMessage(text); // Restaurar texto em caso de erro
        } finally {
            setSending(false);
        }
    };

    // Enviar com Enter
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // Formatar horário
    const formatTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    // Verificar se o sender é professor/admin (qualquer um que não seja o aluno do chat)
    const isTeacherMessage = (msg: ActivityChatMessage) => {
        return msg.senderId !== studentId;
    };

    // Verificar se a mensagem é do próprio usuário logado
    const isOwnMessage = (msg: ActivityChatMessage) => {
        return msg.senderId === currentUser.id;
    };

    return (
        <div className="bg-white shadow rounded-lg overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-purple-50">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-purple-600" />
                    Chat da Atividade
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                    Converse diretamente sobre esta atividade
                </p>
            </div>

            {/* Mensagens */}
            <div
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto px-4 py-4 space-y-3 max-h-96 min-h-[200px]"
            >
                {/* Botão carregar anteriores */}
                {hasOlder && messages.length > 0 && (
                    <div className="flex justify-center">
                        <button
                            onClick={loadOlderMessages}
                            disabled={loadingOlder}
                            className="flex items-center gap-1.5 text-xs text-purple-600 hover:text-purple-800 disabled:text-gray-400 transition px-3 py-1.5 rounded-full bg-purple-50 hover:bg-purple-100 disabled:bg-gray-50"
                        >
                            {loadingOlder ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                                <ChevronUp className="w-3.5 h-3.5" />
                            )}
                            Carregar anteriores
                        </button>
                    </div>
                )}

                {/* Loading inicial */}
                {loading && (
                    <div className="flex justify-center items-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
                    </div>
                )}

                {/* Sem mensagens */}
                {!loading && messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                        <MessageSquare className="w-10 h-10 mb-2" />
                        <p className="text-sm">Nenhuma mensagem ainda.</p>
                        <p className="text-xs mt-1">
                            Envie uma dúvida para iniciar a conversa!
                        </p>
                    </div>
                )}

                {/* Lista de mensagens */}
                {messages.map((msg) => {
                    const own = isOwnMessage(msg);
                    const teacher = isTeacherMessage(msg);

                    return (
                        <div
                            key={msg.id}
                            className={`flex ${own ? "justify-end" : "justify-start"}`}
                        >
                            <div
                                className={`max-w-[80%] ${own ? "order-1" : "order-2"}`}
                            >
                                {/* Nome do professor/admin acima da mensagem */}
                                {teacher && (
                                    <div
                                        className={`flex items-center gap-1.5 mb-1 ${own ? "justify-end" : "justify-start"}`}
                                    >
                                        <span className="text-xs font-semibold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                                            {msg.senderName}
                                        </span>
                                    </div>
                                )}

                                {/* Balão da mensagem */}
                                <div
                                    className={`rounded-2xl px-4 py-2.5 ${own
                                            ? teacher
                                                ? "bg-purple-600 text-white"
                                                : "bg-blue-600 text-white"
                                            : teacher
                                                ? "bg-purple-100 text-gray-900"
                                                : "bg-gray-100 text-gray-900"
                                        }`}
                                >
                                    {/* Nome do aluno (quando não é o user logado) */}
                                    {!own && !teacher && (
                                        <p className="text-xs font-medium mb-1 opacity-70">
                                            {msg.senderName}
                                        </p>
                                    )}

                                    <p className="text-sm whitespace-pre-wrap break-words">
                                        {msg.content}
                                    </p>
                                </div>

                                {/* Horário */}
                                <p
                                    className={`text-[10px] text-gray-400 mt-1 ${own ? "text-right" : "text-left"}`}
                                >
                                    {formatTime(msg.createdAt)}
                                </p>
                            </div>
                        </div>
                    );
                })}

                <div ref={messagesEndRef} />
            </div>

            {/* Input de envio */}
            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Digite sua mensagem..."
                        className="flex-1 px-4 py-2.5 border border-gray-300 rounded-full focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition text-sm bg-white"
                        disabled={sending}
                    />
                    <button
                        onClick={handleSend}
                        disabled={sending || !newMessage.trim()}
                        className="p-2.5 bg-purple-600 text-white rounded-full hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition flex-shrink-0"
                        title="Enviar mensagem"
                    >
                        {sending ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Send className="w-5 h-5" />
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
