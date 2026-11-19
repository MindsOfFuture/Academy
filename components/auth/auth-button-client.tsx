"use client";

import Link from "next/link";
import Image from "next/image";
import { useSyncExternalStore } from "react";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/react";
import { ChevronDown } from "lucide-react";
import { NotificationBell } from "../notifications/notification-bell";
import { TEXTO_TOPO } from "../navbar/estilo";
import { createClient } from "@/lib/supabase/client";
import {
    getHeaderSession,
    getServerHeaderSession,
    subscribeHeaderSession,
    type HeaderSession,
} from "@/lib/auth/header-session";

/** Estado do topo compartilhado por todas as páginas (não refaz a busca a cada clique). */
export function useHeaderSession(): HeaderSession {
    return useSyncExternalStore(subscribeHeaderSession, getHeaderSession, getServerHeaderSession);
}

function isValidUrl(str: string) {
    try {
        new URL(str);
        return true;
    } catch {
        return false;
    }
}

function iniciais(s: HeaderSession) {
    const name = s.name || s.email;
    if (name?.trim()) {
        const parts = name.trim().split(/\s+/);
        if (parts.length === 1) return parts[0][0]?.toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return "U";
}



export function AuthButtonClient() {
    const s = useHeaderSession();

    const handleSignOut = async () => {
        await createClient().auth.signOut();
        window.location.href = "/";
    };

    // Primeira leitura ainda não chegou: reserva o lugar sem piscar "Entrar".
    if (s.status === "unknown") {
        return <span className="inline-block h-10 w-16 md:w-28" aria-hidden="true" />;
    }

    if (s.status === "out") {
        return (
            <Link className={TEXTO_TOPO} href="/auth">
                Entrar
            </Link>
        );
    }

    return (
        <>
            {/* Atalho visível no topo para a equipe da gestão (coordenação e bolsistas) */}
            {s.gestao ? (
                <Link
                    href="/gestao"
                    className="hidden md:inline-flex rounded-full bg-[#FFD300] px-3 py-1 text-sm font-semibold text-[#684A97] shadow-md transition-opacity hover:opacity-90 md:text-base"
                >
                    Gestão
                </Link>
            ) : null}
            {/* Logado, o lugar do "Entrar" vira o atalho para o espaço da pessoa */}
            <Link className={TEXTO_TOPO} href="/protected">
                Meu espaço
            </Link>
            {/* Avisos e foto juntos: tudo que é "da conta" fica no canto */}
            <div className="flex items-center gap-1 md:gap-2">
            <NotificationBell />
            <Dropdown className="text-lg hover:cursor-pointer">
                <DropdownTrigger className="text-lg rounded-lg outline-none">
                    <button className="flex items-center gap-1 md:gap-2 hover:opacity-80 transition-opacity" aria-label="Menu da conta">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FFD300] to-[#FFA500] text-[#684A97] flex items-center justify-center text-sm font-bold shadow-md overflow-hidden">
                            {s.avatarUrl && isValidUrl(s.avatarUrl) ? (
                                <Image src={s.avatarUrl} alt="Avatar" width={40} height={40} className="object-cover w-full h-full" />
                            ) : (
                                iniciais(s)
                            )}
                        </div>
                        <ChevronDown className="w-5 h-5 text-white" />
                    </button>
                </DropdownTrigger>
                <DropdownMenu aria-label="Menu do usuário" className="bg-[#FFD300] p-2 rounded-lg">
                    <DropdownItem className="hover:bg-yellow-200 rounded-lg" key="Perfil" as={Link} href="/protected/perfil">Perfil</DropdownItem>
                    <DropdownItem className="hover:bg-yellow-200 rounded-lg" key="logout" onPress={handleSignOut} color="danger">
                        Sair
                    </DropdownItem>
                </DropdownMenu>
            </Dropdown>
            </div>
        </>
    );
}
