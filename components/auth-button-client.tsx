"use client";

import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";

export function AuthButtonClient() {
    const [user, setUser] = useState<User | null>(null);
    const supabase = createClient();

    useEffect(() => {
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, [supabase.auth]);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
    };

    return user ? (
        <div className="flex items-center gap-4">
            <Link href="/protected" className="text-m md:text-xl bold">
                {user.user_metadata.full_name}
            </Link>
            <button
                onClick={handleSignOut}
                className="text-m md:text-2xl bold transition-all duration-300 hover:text-[26px]"
            >
                Sair
            </button>
        </div>
    ) : (
        <Link
            className="text-m md:text-2xl bold transition-all duration-300 hover:text-[26px]"
            href="/auth"
        >
            Entre
        </Link>
    );
}