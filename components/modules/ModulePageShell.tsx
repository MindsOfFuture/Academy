import type { ReactNode } from "react";
import Link from "next/link";
import Navbar from "@/components/navbar/navbar";

interface ModulePageShellProps {
  title: string;
  description?: string;
  children: ReactNode;
  backHref?: string;
  backLabel?: string;
}

export default function ModulePageShell({
  title,
  description,
  children,
  backHref,
  backLabel = "Voltar ao módulo",
}: ModulePageShellProps) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-gradient-to-b from-[#ECE9F3]/60 via-white to-[#FDCF60]/10">
      <Navbar showTextLogo={true} />
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <nav aria-label="Navegação do módulo" className="mb-6 flex flex-wrap items-center gap-3 text-sm">
          <Link className="font-semibold text-[#684A97] underline-offset-4 hover:underline" href="/protected">
            ← Voltar para o Academy
          </Link>
          {backHref && (
            <Link className="font-semibold text-[#684A97] underline-offset-4 hover:underline" href={backHref}>
              ← {backLabel}
            </Link>
          )}
        </nav>
        <header className="mb-7 rounded-3xl bg-[#684A97] px-5 py-7 text-white shadow-lg sm:px-8">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#FFD300]">Minds of the Future</p>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">{title}</h1>
          {description && <p className="mt-3 max-w-3xl text-white/85">{description}</p>}
        </header>
        {children}
      </main>
    </div>
  );
}
