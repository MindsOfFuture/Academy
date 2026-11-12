import { exigirMembro } from "../guard";
import { Subabas } from "../subabas";

/** Alocação (spec 014): só a coordenação. Subnavegação entre as telas. */
export default async function AlocacaoLayout({ children }: { children: React.ReactNode }) {
  await exigirMembro("/gestao/alocacao", "coordenacao");
  return (
    <div className="space-y-6">
      <Subabas
        rotulo="Alocação"
        itens={[
          { href: "/gestao/alocacao", rotulo: "Calendário" },
          { href: "/gestao/alocacao/turmas", rotulo: "Turmas e escolas" },
          { href: "/gestao/alocacao/espacos", rotulo: "Espaços" },
          { href: "/gestao/alocacao/carga", rotulo: "Carga e afastamentos" },
        ]}
      />
      {children}
    </div>
  );
}
