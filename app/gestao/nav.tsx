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
 * No celular viram uma grade de 3 colunas: todas aparecem sem rolar de lado.
 */
export function NavGestao({ abas }: { abas: AbaGestao[] }) {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Seções da gestão"
      className="grid grid-cols-3 gap-2 md:flex md:gap-1 md:overflow-x-auto md:border-b md:border-gray-200"
    >
      {abas.map((aba) => {
        const ativa = aba.href === "/gestao" ? pathname === "/gestao" : pathname.startsWith(aba.href);
        return (
          <Link
            key={aba.href}
            href={aba.href}
            aria-current={ativa ? "page" : undefined}
            className={cn(
              "whitespace-nowrap text-sm font-medium transition-colors",
              // celular: pílula de 44 px
              "flex min-h-11 items-center justify-center rounded-full border px-2",
              // computador: aba sublinhada, como antes
              "md:min-h-0 md:rounded-none md:border-0 md:border-b-2 md:px-4 md:py-2",
              ativa
                ? "border-[#684A97] bg-[#684A97] text-white md:bg-transparent md:text-[#684A97]"
                : "border-gray-200 bg-white text-gray-700 hover:text-gray-900 md:border-transparent md:bg-transparent md:text-gray-600 md:hover:border-gray-300",
            )}
          >
            {aba.rotulo}
          </Link>
        );
      })}
    </nav>
  );
}
