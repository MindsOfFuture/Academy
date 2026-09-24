"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export interface AbaGestao {
  href: string;
  rotulo: string;
}

/**
 * Abas da gestão. A lista chega pronta do layout (servidor), já filtrada pelo
 * papel: aqui só se marca a aba ativa. Aba só existe quando o módulo existe.
 */
export function NavGestao({ abas }: { abas: AbaGestao[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Seções da gestão" className="flex gap-1 overflow-x-auto border-b border-gray-200">
      {abas.map((aba) => {
        const ativa = aba.href === "/gestao" ? pathname === "/gestao" : pathname.startsWith(aba.href);
        return (
          <Link
            key={aba.href}
            href={aba.href}
            aria-current={ativa ? "page" : undefined}
            className={cn(
              "whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium transition-colors",
              ativa
                ? "border-[#684A97] text-[#684A97]"
                : "border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-900",
            )}
          >
            {aba.rotulo}
          </Link>
        );
      })}
    </nav>
  );
}
