"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Bell, CheckCheck, MessageSquare, GraduationCap, UserCheck, UserX, BookOpen, ClipboardList } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface NotificationPayload {
    title: string;
    message: string;
    href?: string;
    [key: string]: unknown;
}

interface Notification {
    id: string;
    userId: string;
    type: string;
    payload: NotificationPayload;
    readAt: string | null;
    createdAt: string;
}

function typeIcon(type: string) {
    switch (type) {
        case "assignment_graded":
            return <GraduationCap size={16} className="text-emerald-400 shrink-0" />;
        case "chat_message":
            return <MessageSquare size={16} className="text-blue-400 shrink-0" />;
        case "teacher_approved":
            return <UserCheck size={16} className="text-green-400 shrink-0" />;
        case "teacher_rejected":
            return <UserX size={16} className="text-red-400 shrink-0" />;
        case "assignment_submitted":
            return <ClipboardList size={16} className="text-blue-400 shrink-0" />;
        case "teacher_pending_approval":
            return <ClipboardList size={16} className="text-orange-400 shrink-0" />;
        case "new_enrollment":
            return <BookOpen size={16} className="text-purple-400 shrink-0" />;
        default:
            return <Bell size={16} className="text-gray-400 shrink-0" />;
    }
}

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "agora";
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d`;
    return new Date(dateStr).toLocaleDateString("pt-BR");
}

export function NotificationBell() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const supabase = createClient();

    // Listen to auth state — only show bell for logged-in users
    useEffect(() => {
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setIsLoggedIn(!!session?.user);
        });
        return () => subscription.unsubscribe();
    }, [supabase.auth]);

    const fetchCount = useCallback(async () => {
        try {
            const res = await fetch("/api/notifications?countOnly=true");
            if (res.ok) {
                const data = await res.json();
                setUnreadCount(data.count ?? 0);
            }
        } catch {
            // Silently fail
        }
    }, []);

    const fetchNotifications = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/notifications?unreadOnly=true&limit=30");
            if (res.ok) {
                const data = await res.json();
                const unreadNotifications = data.notifications ?? [];
                setNotifications(unreadNotifications);
                setUnreadCount(unreadNotifications.length);
            }
        } catch {
            // Silently fail
        } finally {
            setLoading(false);
        }
    }, []);

    // Poll for unread count every 30s
    useEffect(() => {
        fetchCount();
        const interval = setInterval(fetchCount, 30_000);
        return () => clearInterval(interval);
    }, [fetchCount]);

    // When dropdown opens, fetch full list
    useEffect(() => {
        if (open) {
            fetchNotifications();
        }
    }, [open, fetchNotifications]);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        if (open) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [open]);

    const markRead = async (notificationId: string) => {
        try {
            await fetch("/api/notifications", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ notificationId }),
            });
            setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
            setUnreadCount((c) => Math.max(0, c - 1));
        } catch {
            // Silently fail
        }
    };

    const markAllRead = async () => {
        try {
            await fetch("/api/notifications", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ all: true }),
            });
            setNotifications([]);
            setUnreadCount(0);
        } catch {
            // Silently fail
        }
    };

    const handleClick = async (n: Notification) => {
        if (!n.readAt) {
            await markRead(n.id);
        }
        if (n.payload.href) {
            setOpen(false);
            router.push(n.payload.href);
        }
    };

    if (!isLoggedIn) return null;

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell button */}
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="relative p-2 rounded-full hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-white/30"
                aria-label="Notificações"
            >
                <Bell size={22} className="text-white" />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full animate-pulse">
                        {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {open && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-[9999] overflow-hidden animate-in fade-in-0 slide-in-from-top-2 duration-200">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-[#684A97] to-[#8e6bc9]">
                        <h3 className="text-sm font-semibold text-white">Notificações</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllRead}
                                className="flex items-center gap-1 text-xs text-white/80 hover:text-white transition-colors"
                            >
                                <CheckCheck size={14} />
                                Marcar todas como lidas
                            </button>
                        )}
                    </div>

                    {/* Notification list */}
                    <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                        {loading && notifications.length === 0 ? (
                            <div className="flex items-center justify-center py-10 text-gray-400 text-sm">
                                Carregando…
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                                <Bell size={28} className="mb-2 opacity-40" />
                                <span className="text-sm">Nenhuma notificação</span>
                            </div>
                        ) : (
                            notifications.map((n) => (
                                <button
                                    key={n.id}
                                    onClick={() => handleClick(n)}
                                    className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors ${
                                        !n.readAt ? "bg-purple-50/60" : ""
                                    }`}
                                >
                                    <div className="mt-0.5">{typeIcon(n.type)}</div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm leading-tight ${!n.readAt ? "font-semibold text-gray-900" : "text-gray-700"}`}>
                                            {n.payload.title}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                                            {n.payload.message}
                                        </p>
                                        <span className="text-[10px] text-gray-400 mt-1 block">
                                            {timeAgo(n.createdAt)}
                                        </span>
                                    </div>
                                    {!n.readAt && (
                                        <div className="mt-1.5">
                                            <span className="block w-2.5 h-2.5 rounded-full bg-[#684A97]" />
                                        </div>
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
