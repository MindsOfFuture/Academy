import Link from "next/link";
import { getIndicadores } from "@/lib/api/gestao/indicators";
import { listarPendencias } from "@/lib/api/gestao/pendencias";
import type { Pendencia } from "@/lib/api/gestao/types";
import { exigirMembro } from "./guard";

/**
 * Tela "Hoje" do módulo de gestão (spec 003).
 *
 * Guard: `exigirMembro` (flag → login → papel), defesa em profundidade
 * (specs/constitution.md §III). Dados só por `lib/api/gestao`. O bolsista vê as
 * próprias pendências (a RLS recorta); a coordenação vê as da equipe e, embaixo,
 * os seis indicadores do convênio (spec 002).
 */
export default async function GestaoPage() {
  const papel = await exigirMembro("/gestao");

  const [pendencias, indicadores] = await Promise.all([
    listarPendencias(papel),
    papel === "coordenacao" ? getIndicadores() : Promise.resolve(null),
  ]);

  const aFazer = pendencias.filter((p) => p.tipo !== "proxima_aula");
  const proximas = pendencias.filter((p) => p.tipo === "proxima_aula");

  return (
    <div className="space-y-8">
      <section aria-labelledby="a-fazer" className="space-y-3">
        <h2 id="a-fazer" className="text-xl font-semibold">
          O que você tem a fazer
        </h2>
        {aFazer.length === 0 ? (
          <p className="rounded-lg border bg-white p-4 text-sm text-muted-foreground">Nada pendente agora.</p>
        ) : (
          <ul className="space-y-2">
            {aFazer.map((p, i) => (
              <ItemPendencia key={`${p.tipo}-${i}`} pendencia={p} />
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="proximas-aulas" className="space-y-3">
        <h2 id="proximas-aulas" className="text-xl font-semibold">
          Próximas aulas
        </h2>
        {proximas.length === 0 ? (
          <p className="rounded-lg border bg-white p-4 text-sm text-muted-foreground">Nenhuma aula agendada.</p>
        ) : (
          <ul className="space-y-2">
            {proximas.map((p, i) => (
              <ItemPendencia key={`aula-${i}`} pendencia={p} />
            ))}
          </ul>
        )}
      </section>

      {indicadores && (
        <section aria-label="Indicadores do convênio" className="space-y-3">
          <h2 className="text-xl font-semibold">Indicadores do convênio</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <Indicador titulo="Alunos participantes" valor={indicadores.alunos.total} />
            <Indicador titulo="Reservas de ônibus" valor={indicadores.reservasOnibus.total} />
            <Indicador
              titulo="Termos"
              valor={`${indicadores.termos.arquivados} arquivados · ${indicadores.termos.pendentes} pendentes`}
            />
            <Indicador
              titulo="Presença"
              valor={`${indicadores.presenca.presentes} presentes · ${indicadores.presenca.ausentes} ausentes`}
            />
            <Indicador titulo="Aulas realizadas" valor={indicadores.aulas.total} />
            <Indicador titulo="Alocações de bolsistas" valor={indicadores.cargaBolsistas.totalAlocacoes} />
          </div>
        </section>
      )}
    </div>
  );
}

function ItemPendencia({ pendencia }: { pendencia: Pendencia }) {
  return (
    <li>
      <Link
        href={pendencia.href}
        className={`block rounded-lg border bg-white p-4 shadow-sm transition-colors hover:border-[#684A97] ${
          pendencia.urgente ? "border-l-4 border-l-[#E8473A]" : ""
        }`}
      >
        <p className="font-medium">{pendencia.titulo}</p>
        <p className="text-sm text-muted-foreground">{pendencia.detalhe}</p>
      </Link>
    </li>
  );
}

function Indicador({ titulo, valor }: { titulo: string; valor: string | number }) {
  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <p className="text-sm text-muted-foreground">{titulo}</p>
      <p className="mt-1 text-2xl font-semibold">{valor}</p>
    </div>
  );
}
