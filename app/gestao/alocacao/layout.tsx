import Link from "next/link";
import { exigirMembro } from "../guard";

/** Alocação (spec 014): só a coordenação. Subnavegação entre as três telas. */
export default async function AlocacaoLayout({ children }: { children: React.ReactNode }) {
  await exigirMembro("/gestao/alocacao", "coordenacao");
  return (
    <div className="space-y-6">
      <nav aria-label="Alocação" className="flex flex-wrap gap-4 text-sm">
        <Link href="/gestao/alocacao" className="font-medium text-[#684A97] hover:underline">
          Calendário
        </Link>
        <Link href="/gestao/alocacao/turmas" className="font-medium text-[#684A97] hover:underline">
          Turmas e escolas
        </Link>
        <Link href="/gestao/alocacao/carga" className="font-medium text-[#684A97] hover:underline">
          Carga e afastamentos
        </Link>
      </nav>
      {children}
    </div>
  );
}
