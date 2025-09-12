"use client";

import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Button } from "@heroui/react";


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
        redirect("/");
    };

    return user ? (
        <Dropdown className="text-lg hover:cursor-pointer">
            <DropdownTrigger className="text-lg rounded-lg">
                <Button variant="bordered" ><p className="text-2xl">Menu</p></Button>
            </DropdownTrigger>
            <DropdownMenu aria-label="Menu do usuário" className="bg-[#FFD300] p-2 rounded-lg">
                <DropdownItem className="hover:bg-yellow-200 rounded-lg" key="Dashboard"><Link href="protected">Dashboard</Link></DropdownItem>
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