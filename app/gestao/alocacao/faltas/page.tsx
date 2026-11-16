import Link from "next/link";
import { agruparFaltas, listarEncontrosDoMes } from "@/lib/api/gestao/alocacao";
import { exigirMembro } from "../../guard";
import { SeletorMes } from "../../seletor-mes";
import { diaCurto, mesDaUrl, SITUACAO } from "../rotulos";

/** Faltas e atrasos do mês por bolsista, só para ver: registra-se na página do encontro. */

const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;

export default async function FaltasPage({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  await exigirMembro("/gestao/alocacao/faltas", "coordenacao");
  const mes = mesDaUrl((await searchParams).mes);
  const encontros = await listarEncontrosDoMes(mes);
  const pessoas = agruparFaltas(encontros);

  return (
    <div className="space-y-6">
      <SeletorMes mes={mes} titulo="Faltas e atrasos de" />

      <ul className="divide-y rounded-lg border bg-white shadow-sm">
        {pessoas.map((p) => (
          <li key={p.bolsistaId} className="space-y-2 p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-medium">{p.nome}</p>
              <p className="text-sm tabular-nums text-muted-foreground">
                {[
                  p.faltasSemAviso && plural(p.faltasSemAviso, "falta sem avisar", "faltas sem avisar"),
                  p.faltasAvisando && plural(p.faltasAvisando, "falta avisando", "faltas avisando"),
                  p.atrasos && `${plural(p.atrasos, "atraso", "atrasos")} (${p.minutosDeAtraso} min)`,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
            <ul className="space-y-1 text-sm">
              {p.ocorrencias.map((o) => (
                <li key={`${o.alocacaoId}-${o.tipo}`}>
                  <Link href={`/gestao/alocacao/${o.encontroId}`} className="text-[#684A97] hover:underline">
                    {diaCurto(o.data)} · {o.horario} · {o.modalidade}
                  </Link>
                  {" — "}
                  {o.tipo === "atraso" ? (
                    `atraso de ${o.minutos} min`
                  ) : (
                    <>
                      {SITUACAO[o.tipo].toLowerCase()}
                      {o.motivo && <span className="text-muted-foreground"> · {o.motivo}</span>}
                    </>
                  )}
                </li>
              ))}
            </ul>
          </li>
        ))}
        {pessoas.length === 0 && <li className="p-4 text-sm text-muted-foreground">Nenhuma falta ou atraso neste mês.</li>}
      </ul>
    </div>
  );
}
