"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { useHeaderSession } from "../auth/auth-button-client";

type NavLink = { readonly href: string; readonly label: string };

/** Menu do celular. Para a equipe, a Gestão entra aqui (no topo não cabe ao lado da foto). */
export function MobileMenu({ links }: { links: readonly NavLink[] }) {
    const s = useHeaderSession();
    const itens: NavLink[] = s.status === "in" && s.gestao ? [...links, { href: "/gestao", label: "Gestão" }] : [...links];
    return (
        <details className="relative md:hidden">
            <summary aria-label="Abrir menu" className="list-none cursor-pointer p-1 [&::-webkit-details-marker]:hidden">
                <Menu className="w-7 h-7" aria-hidden="true" />
            </summary>
            <ul className="absolute right-0 mt-3 w-44 bg-[#FFD300] p-2 rounded-lg shadow-lg text-[#684A97]">
                {itens.map(({ href, label }) => (
                    <li key={href}>
                        <Link href={href} className="block px-3 py-2 rounded-lg text-lg hover:bg-yellow-200">
                            {label}
                        </Link>
                    </li>
                ))}
            </ul>
        </details>
    );
}
