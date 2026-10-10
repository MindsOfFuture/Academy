"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getHeaderMembership } from "@/lib/api/header-client";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

const actionClass = "inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg px-3 text-sm font-semibold transition-colors hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

export function AuthButtonClient({ gestaoEnabled = false }: { gestaoEnabled?: boolean }) {
    const [supabase] = useState(() => createClient());
    const [user, setUser] = useState<User | null>(null);
    const [membership, setMembership] = useState<{ userId: string; active: boolean } | null>(null);
    const [signingOut, setSigningOut] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const pathname = usePathname();

    useEffect(() => {
        let current = true;
        let revision = 0;
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            revision += 1;
            setMembership(null);
            setUser(session?.user ? { ...session.user } : null);
        });
        const initialRevision = revision;
        void supabase.auth.getUser().then(({ data, error }) => {
            if (current && revision === initialRevision) setUser(error ? null : data.user);
        }).catch(() => {
            if (current && revision === initialRevision) setUser(null);
        });
        return () => { current = false; subscription.unsubscribe(); };
    }, [supabase]);

    useEffect(() => {
        let current = true;
        if (user && gestaoEnabled) {
            void getHeaderMembership(supabase).then(active => {
                if (current) setMembership({ userId: user.id, active });
            });
        }
        return () => { current = false; };
    }, [user, supabase, gestaoEnabled]);

    const handleSignOut = async () => {
        setSigningOut(true);
        setError(null);
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            setMembership(null);
            setUser(null);
            window.location.href = "/";
        } catch {
            setError("Não foi possível sair. Tente novamente.");
            setSigningOut(false);
        }
    };

    const currentPage = (href: string) => pathname === href ? "page" as const : undefined;
    return (
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1" aria-label="Sua conta">
            {user ? <>
                <Link className={actionClass} href="/protected" aria-current={currentPage("/protected")}>Meus cursos</Link>
                <Link className={actionClass} href="/protected/perfil" aria-current={currentPage("/protected/perfil")}>Meu perfil</Link>
                {gestaoEnabled && membership?.userId === user.id && membership.active && (
                    <Link className={actionClass} href="/gestao" aria-current={pathname === "/gestao" || pathname?.startsWith("/gestao/") ? "page" : undefined}>Gestão</Link>
                )}
                <button type="button" className={actionClass} onClick={handleSignOut} disabled={signingOut}>{signingOut ? "Saindo…" : "Sair"}</button>
                {error && <p role="alert" className="basis-full text-sm">{error}</p>}
            </> : <Link className={actionClass} href="/auth" aria-current={currentPage("/auth")}>Entrar</Link>}
        </div>
    );
}
