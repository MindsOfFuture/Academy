import Link from "next/link";
import { cargaDoMes, listarAfastamentos } from "@/lib/api/gestao/alocacao";
import { listarEquipe } from "@/lib/api/gestao/equipe";
import { exigirMembro } from "../../guard";
import { FormAfastamento } from "../forms";
import { diaCurto, horasTexto, mesDaUrl, mesVizinho, nomeDoMes } from "../rotulos";

/**
 * Carga do mês (spec 014): horas que contam por bolsista, divididas por escola
 * e turma. O equilíbrio é medido só em horas (decisão de 09/10/2026).
 */

function dataBr(iso: string): string {
  const [, mes, dia] = iso.split("-");
  return `${dia}/${mes}`;
}

export default async function CargaPage({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  await exigirMembro("/gestao/alocacao/carga", "coordenacao");
  const mes = mesDaUrl((await searchParams).mes);
  const [carga, afastamentos, equipe] = await Promise.all([cargaDoMes(mes), listarAfastamentos(mes), listarEquipe()]);

  const bolsistas = equipe
    .filter((m) => m.bolsista && !m.desligadoEm)
    .map((m) => ({ id: m.userProfileId, nome: m.nome }));
  const maior = Math.max(1, ...carga.map((c) => c.total));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <Link href={`?mes=${mesVizinho(mes, -1)}`} className="text-sm text-[#684A97] hover:underline">
          ← Anterior
        </Link>
        <h2 className="text-xl font-semibold">Carga de {nomeDoMes(mes).toLowerCase()}</h2>
        <Link href={`?mes=${mesVizinho(mes, 1)}`} className="text-sm text-[#684A97] hover:underline">
          Próximo →
        </Link>
      </div>
      <p className="text-sm text-muted-foreground">
        Conta o que foi cumprido. Encontro que já passou sem marcação conta como cumprido; falta, substituição,
        encontro cancelado e turma que não abriu não contam. Quando alguém cobre outra pessoa, as horas cobertas vão
        para quem cobriu.
      </p>

      <ul className="divide-y rounded-lg border bg-white shadow-sm">
        {carga.map((c) => (
          <li key={c.bolsistaId} className="space-y-2 p-4">
            <div className="flex items-baseline justify-between gap-2">
              <p className="font-medium">{c.nome}</p>
              <p className="font-semibold tabular-nums">{horasTexto(c.total)}</p>
            </div>
            <div className="h-2 rounded-full bg-gray-100" aria-hidden>
              <div className="h-2 rounded-full bg-[#684A97]" style={{ width: `${(c.total / maior) * 100}%` }} />
            </div>
            <p className="text-sm text-muted-foreground">
              {c.porEscola.length
                ? c.porEscola.map((e) => `${e.nome}: ${horasTexto(e.horas)}`).join(" · ")
                : "Sem horas neste mês."}
            </p>
            {c.porTurma.length > 1 && (
              <p className="text-xs text-muted-foreground">
                {c.porTurma.map((t) => `${t.nome}: ${horasTexto(t.horas)}`).join(" · ")}
              </p>
            )}
          </li>
        ))}
        {carga.length === 0 && <li className="p-4 text-sm text-muted-foreground">Nenhum bolsista na equipe.</li>}
      </ul>

      <section aria-labelledby="afastamentos" className="space-y-3">
        <h2 id="afastamentos" className="text-xl font-semibold">
          Afastamentos
        </h2>
        {bolsistas.length > 0 && <FormAfastamento pessoas={bolsistas} />}
        <ul className="divide-y rounded-lg border bg-white shadow-sm">
          {afastamentos.map((a) => (
            <li key={a.id} className="space-y-2 p-4">
              <p className="font-medium">
                {a.bolsistaNome} · {dataBr(a.inicio)} a {dataBr(a.fim)}
              </p>
              <p className="text-sm text-muted-foreground">{a.motivo}</p>
              {a.encontrosAfetados.length > 0 ? (
                <div className="text-sm">
                  <p>Encontros ainda sem substituto:</p>
                  <ul className="mt-1 list-inside list-disc">
                    {a.encontrosAfetados.map((e) => (
                      <li key={e.alocacaoId}>
                        <Link href={`/gestao/alocacao/${e.encontroId}`} className="text-[#684A97] underline">
                          {diaCurto(e.data)} · {e.horario} · {e.modalidade}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-sm text-green-700">Nenhum encontro pendente no período.</p>
              )}
            </li>
          ))}
          {afastamentos.length === 0 && (
            <li className="p-4 text-sm text-muted-foreground">Nenhum afastamento neste mês.</li>
          )}
        </ul>
      </section>
    </div>
  );
}
