import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
// A flag vem do servidor; este componente também é importado por páginas cliente.
import { AuthButtonClient } from "../auth/auth-button-client";
import { NotificationBell } from "../notifications/notification-bell";

export default function Navbar({ showTextLogo, gestaoEnabled = false }: { showTextLogo: boolean; gestaoEnabled?: boolean }) {
    return (
        <nav aria-label="Navegação principal" className="sticky top-0 z-50 flex flex-wrap items-center justify-between gap-2 rounded-b-lg bg-[#684A97] px-3 py-3 text-white shadow-lg sm:px-7">
            <Link href="/" aria-label="Minds of the Future — início" className="flex min-h-11 min-w-11 max-w-full items-center gap-2 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
                <Image src="/logo_navbar.svg" alt="" width={50} height={50} className="shrink-0" />
                {showTextLogo && <span className="text-base font-bold sm:text-2xl">Minds of the Future</span>}
            </Link>
            <div className="flex w-full max-w-full items-center gap-2 sm:w-auto">
                <AuthButtonClient gestaoEnabled={gestaoEnabled} />
                <div className="[&>div>button]:min-h-11 [&>div>button]:min-w-11">
                    <Suspense fallback={null}><NotificationBell /></Suspense>
                </div>
            </div>
        </nav>
    );
}
