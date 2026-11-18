import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { Menu } from "lucide-react";
import { AuthButtonClient } from "../auth/auth-button-client";
import { NotificationBell } from "../notifications/notification-bell";

/**
 * Atalhos do topo. Todos levam a áreas que exigem login: quem chega sem conta
 * passa pela tela de entrada e volta direto para onde clicou, e o acesso fica
 * registrado na conta do aluno.
 */
export const NAV_LINKS = [
    { href: "/trilhas", label: "Cursos" },
    { href: "/protected/modulos/educacao-financeira", label: "Jogos" },
    { href: "/protected", label: "Meu espaço" },
] as const;

export default function Navbar({ showTextLogo }: { showTextLogo: boolean }) {
    return (
        <nav className="flex items-center justify-between rounded-b-lg bg-[#684A97] sticky top-0 z-50 p-4 pl-7 pr-7 shadow-lg backdrop-blur-3xl text-white">
            <div className="flex items-center md:transition-all md:duration-300 md:hover:text-[26px] md:hover:scale-105">
                <Image
                    src="/logo_navbar.svg"
                    alt="Minds Academy Logo"
                    width={50}
                    height={50}
                    className="mr-2"
                />
                {showTextLogo && (
                    <Link href="/" className="text-m md:text-2xl font-bold">
                        Minds of the Future
                    </Link>
                )}
            </div>
            <div className="flex items-center gap-2 md:gap-6">
                {/* Computador: atalhos em linha, no mesmo texto do "Entrar" */}
                <ul className="hidden md:flex items-center gap-6">
                    {NAV_LINKS.map(({ href, label }) => (
                        <li key={href}>
                            <Link href={href} className="text-xl transition-opacity duration-300 hover:opacity-80">
                                {label}
                            </Link>
                        </li>
                    ))}
                </ul>
                <Suspense fallback={null}>
                    <NotificationBell />
                </Suspense>
                <AuthButtonClient />
                {/* Celular: um botão de menu abre a lista, no amarelo do menu do usuário */}
                <details className="relative md:hidden">
                    <summary aria-label="Abrir menu" className="list-none cursor-pointer p-1 [&::-webkit-details-marker]:hidden">
                        <Menu className="w-7 h-7" aria-hidden="true" />
                    </summary>
                    <ul className="absolute right-0 mt-3 w-44 bg-[#FFD300] p-2 rounded-lg shadow-lg text-[#684A97]">
                        {NAV_LINKS.map(({ href, label }) => (
                            <li key={href}>
                                <Link href={href} className="block px-3 py-2 rounded-lg text-lg hover:bg-yellow-200">
                                    {label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </details>
            </div>
        </nav>
    );
}
