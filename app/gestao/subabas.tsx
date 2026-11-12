"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { classeSubaba } from "./subabas-estilo";

export interface Subaba {
  href: string;
  rotulo: string;
}

/** Subabas por endereço: vale a que tem o prefixo mais longo (o encontro aberto fica no Calendário). */
export function Subabas({ rotulo, itens }: { rotulo: string; itens: Subaba[] }) {
  const caminho = usePathname();
  const ativa = itens
    .filter((i) => caminho === i.href || caminho.startsWith(`${i.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;
  return (
    <nav aria-label={rotulo} className="flex gap-1 overflow-x-auto border-b border-gray-200">
      {itens.map((i) => (
        <Link key={i.href} href={i.href} aria-current={i.href === ativa ? "page" : undefined} className={classeSubaba(i.href === ativa)}>
          {i.rotulo}
        </Link>
      ))}
    </nav>
  );
}
