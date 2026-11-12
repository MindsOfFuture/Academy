import Link from "next/link";
import { listarEquipe } from "@/lib/api/gestao/equipe";
import { STATUS_META, listarMetas, ordenarMetas, statusDaMeta } from "@/lib/api/gestao/metas";
import type { Meta, StatusMeta } from "@/lib/api/gestao/types";
import { usuarioDaRequisicao } from "@/lib/supabase/server";
import { exigirMembro } from "../guard";
import { hojeIso } from "../alocacao/rotulos";
import { COR_STATUS, dataBr } from "./estilo";
import { FormMeta } from "./forms";

/** Metas da equipe: todos leem; a coordenação cria. */

const FILTROS: { rotulo: string; status?: StatusMeta; minhas?: boolean }[] = [
  { rotulo: "Todas" },
  { rotulo: "Em dia", status: "em_dia" },
  { rotulo: "Atrasadas", status: "atrasada" },
  { rotulo: "Concluídas", status: "concluida" },
  { rotulo: "Minhas", minhas: true },
];

export default async function MetasPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; minhas?: string }>;
}) {
  const papel = await exigirMembro("/gestao/metas");
  const filtros = await searchParams;
  const coordenacao = papel === "coordenacao";
  const [todas, eu, equipe] = await Promise.all([
    listarMetas(),
    usuarioDaRequisicao(),
    coordenacao ? listarEquipe() : Promise.resolve([]),
  ]);
  const hoje = hojeIso();

  const status = filtros.status && filtros.status in STATUS_META ? (filtros.status as StatusMeta) : null;
  const minhas = filtros.minhas === "1";
  const lista = ordenarMetas(
    todas.filter(
      (m) => (!status || statusDaMeta(m, hoje) === status) && (!minhas || m.responsaveis.some((r) => r.id === eu)),
    ),
    hoje,
  );
  const pessoas = equipe.filter((m) => !m.desligadoEm).map((m) => ({ id: m.userProfileId, nome: m.nome }));

  return (
    <div className="space-y-6">
      <section aria-labelledby="metas" className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 id="metas" className="text-xl font-semibold">
            Metas
          </h2>
          <nav aria-label="Filtrar metas" className="flex flex-wrap gap-2">
            {FILTROS.map((f) => {
              const ativo = f.minhas ? minhas : !minhas && status === (f.status ?? null);
              const href = f.minhas ? "/gestao/metas?minhas=1" : f.status ? `/gestao/metas?status=${f.status}` : "/gestao/metas";
              return (
                <Link
                  key={f.rotulo}
                  href={href}
                  aria-current={ativo ? "page" : undefined}
                  className={`rounded-full border px-3 py-1 text-sm ${
                    ativo ? "border-[#684A97] bg-[#684A97] text-white" : "bg-white hover:border-[#684A97]"
                  }`}
                >
                  {f.rotulo}
                </Link>
              );
            })}
          </nav>
        </div>
        {lista.length === 0 ? (
          <p className="rounded-lg border bg-white p-4 text-sm text-muted-foreground">Nenhuma meta.</p>
        ) : (
          <ul className="space-y-2">
            {lista.map((m) => (
              <ItemMeta key={m.id} meta={m} status={statusDaMeta(m, hoje)} />
            ))}
          </ul>
        )}
      </section>

      {coordenacao && <FormMeta pessoas={pessoas} />}
    </div>
  );
}

function ItemMeta({ meta: m, status }: { meta: Meta; status: StatusMeta }) {
  return (
    <li>
      <Link
        href={`/gestao/metas/${m.id}`}
        className={`block rounded-lg border bg-white p-4 shadow-sm transition-colors hover:border-[#684A97] ${
          status === "atrasada" ? "border-l-4 border-l-[#E8473A]" : ""
        }`}
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${COR_STATUS[status]}`}>{STATUS_META[status]}</span>
          <span className="text-xs text-muted-foreground">Prazo: {dataBr(m.prazo)}</span>
        </div>
        <p className="mt-2 font-medium">{m.titulo}</p>
        <p className="text-sm text-muted-foreground">{m.responsaveis.map((r) => r.nome).join(", ")}</p>
      </Link>
    </li>
  );
}
