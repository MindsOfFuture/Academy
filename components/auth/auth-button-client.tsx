"use client";

import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/react";
import { ChevronDown } from "lucide-react";
import Image from "next/image";

interface UserProfile {
    full_name: string | null;
    avatar_url: string | null;
}

export function AuthButtonClient() {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const supabase = createClient();

    useEffect(() => {
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, [supabase.auth]);

    // Buscar dados do perfil quando o usuário mudar
    useEffect(() => {
        async function fetchProfile() {
            if (!user) {
                setProfile(null);
                return;
            }
            const { data } = await supabase
                .from("user_profile")
                .select("full_name, avatar_url")
                .eq("id", user.id)
                .maybeSingle();
            setProfile(data);
        }
        fetchProfile();
    }, [user, supabase]);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        redirect("/");
    };

    // Função para gerar iniciais do nome
    function getInitials() {
        const name = profile?.full_name || user?.user_metadata?.full_name || user?.email;
        if (name?.trim()) {
            const parts = name.trim().split(/\s+/);
            if (parts.length === 1) return parts[0][0]?.toUpperCase();
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return user?.email?.[0]?.toUpperCase() || "U";
    }

    return user ? (
        <Dropdown className="text-lg hover:cursor-pointer">
            <DropdownTrigger className="text-lg rounded-lg outline-none">
                <button className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                    {/* Avatar do usuário */}
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FFD300] to-[#FFA500] text-[#684A97] flex items-center justify-center text-sm font-bold shadow-md overflow-hidden">
                        {profile?.avatar_url ? (
                            <Image
                                src={profile.avatar_url}
                                alt="Avatar"
                                width={40}
                                height={40}
                                className="object-cover w-full h-full"
                            />
                        ) : (
                            getInitials()
                        )}
                    </div>
                    {/* Setinha para baixo */}
                    <ChevronDown className="w-5 h-5 text-white" />
                </button>
            </DropdownTrigger>
            <DropdownMenu aria-label="Menu do usuário" className="bg-[#FFD300] p-2 rounded-lg">
                <DropdownItem className="hover:bg-yellow-200 rounded-lg" key="Dashboard"><Link href="/protected">Dashboard</Link></DropdownItem>
                <DropdownItem className="hover:bg-yellow-200 rounded-lg" key="Perfil"><Link href="protected/perfil"> Perfil</Link></DropdownItem>
                <DropdownItem className="hover:bg-yellow-200 rounded-lg" key="logout" onClick={handleSignOut} color="danger">
                    Sair
                </DropdownItem>
            </DropdownMenu>
        </Dropdown>
    ) : (
        <Link
            className="text-m md:text-2xl bold transition-all duration-300 hover:text-[26px]"
            href="/auth"
        >
            Entre
        </Link>
    );
}