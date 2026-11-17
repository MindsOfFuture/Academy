import type { ReactNode } from "react";
import { diaCurto } from "./alocacao/rotulos";

/**
 * Grade do mês: em tela larga, uma célula por dia; no celular, lista por dia.
 * Quem usa decide como é o cartão de cada encontro (alocação e calendário do
 * bolsista).
 */

const SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function GradeDoMes<T extends { id: string; data: string }>({
  mes,
  itens,
  cartao,
  vazio,
}: {
  mes: string;
  itens: T[];
  cartao: (item: T) => ReactNode;
  vazio: string;
}) {
  const porDia = new Map<string, T[]>();
  for (const e of itens) porDia.set(e.data, [...(porDia.get(e.data) ?? []), e]);

  const [ano, m] = mes.split("-").map(Number);
  const primeiroDia = new Date(Date.UTC(ano, m - 1, 1)).getUTCDay();
  const diasNoMes = new Date(Date.UTC(ano, m, 0)).getUTCDate();
  const celulas: (string | null)[] = [
    ...Array<null>(primeiroDia).fill(null),
    ...Array.from({ length: diasNoMes }, (_, i) => `${mes}-${String(i + 1).padStart(2, "0")}`),
  ];

  return (
    <>
      {/* Telas largas: grade do mês. */}
      <div className="hidden overflow-hidden rounded-lg border bg-gray-200 md:grid md:grid-cols-7 md:gap-px">
        {SEMANA.map((d) => (
          <div key={d} className="bg-gray-50 p-2 text-center text-xs font-medium text-gray-600">
            {d}
          </div>
        ))}
        {celulas.map((dia, i) => (
          <div key={dia ?? `vazio-${i}`} className="min-h-24 space-y-1 bg-white p-1">
            {dia && <span className="text-xs text-gray-500">{Number(dia.slice(8))}</span>}
            {dia && (porDia.get(dia) ?? []).map((e) => <div key={e.id}>{cartao(e)}</div>)}
          </div>
        ))}
      </div>

      {/* Celular: lista por dia. */}
      <ul className="space-y-3 md:hidden">
        {[...porDia.entries()].map(([dia, lista]) => (
          <li key={dia} className="space-y-1">
            <p className="text-sm font-medium">{diaCurto(dia)}</p>
            {lista.map((e) => (
              <div key={e.id}>{cartao(e)}</div>
            ))}
          </li>
        ))}
      </ul>
      {itens.length === 0 && <p className="rounded-lg border bg-white p-4 text-sm text-muted-foreground">{vazio}</p>}
    </>
  );
}
