import Link from "next/link";
import { notFound } from "next/navigation";
import { listarEquipe } from "@/lib/api/gestao/equipe";
import { STATUS_META, obterMeta, statusDaMeta } from "@/lib/api/gestao/metas";
import { usuarioDaRequisicao } from "@/lib/supabase/server";
import { exigirMembro } from "../../guard";
import { hojeIso } from "../../alocacao/rotulos";
import { COR_STATUS, dataBr } from "../estilo";
import { FormAndamento, FormConcluirMeta, FormMeta } from "../forms";

/** Detalhe de uma meta, com o andamento registrado. */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function dataHoraBr(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(iso));
}

export default async function MetaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const papel = await exigirMembro(`/gestao/metas/${id}`);
  if (!UUID.test(id)) notFound();

  const coordenacao = papel === "coordenacao";
  const [meta, eu, equipe] = await Promise.all([
    obterMeta(id),
    usuarioDaRequisicao(),
    coordenacao ? listarEquipe() : Promise.resolve([]),
  ]);
  if (!meta) notFound();

  const status = statusDaMeta(meta, hojeIso());
  const responsavel = meta.responsaveis.some((r) => r.id === eu);
  const pessoas = equipe.filter((m) => !m.desligadoEm).map((m) => ({ id: m.userProfileId, nome: m.nome }));

  return (
    <div className="space-y-6">
      <Link href="/gestao/metas" className="text-sm text-[#684A97] hover:underline">
        ← Todas as metas
      </Link>

      <article className="space-y-4 rounded-lg border bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${COR_STATUS[status]}`}>{STATUS_META[status]}</span>
          <span className="text-xs text-muted-foreground">Prazo: {dataBr(meta.prazo)}</span>
          {meta.concluidaEm && (
            <span className="text-xs text-muted-foreground">Concluída em {dataHoraBr(meta.concluidaEm)}</span>
          )}
        </div>
        <h2 className="text-2xl font-semibold">{meta.titulo}</h2>
        {meta.descricao && <p className="whitespace-pre-line">{meta.descricao}</p>}
        <p className="text-sm">
          <span className="font-medium">Responsáveis:</span> {meta.responsaveis.map((r) => r.nome).join(", ")}
        </p>
        {coordenacao && <FormConcluirMeta metaId={meta.id} concluida={Boolean(meta.concluidaEm)} />}
      </article>

      <section aria-labelledby="andamento" className="space-y-3 rounded-lg border bg-white p-5 shadow-sm">
        <h2 id="andamento" className="text-lg font-semibold">
          Andamento
        </h2>
        {meta.andamentos.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nada registrado ainda.</p>
        ) : (
          <ul className="space-y-3">
            {meta.andamentos.map((a) => (
              <li key={a.id} className="space-y-1 border-l-2 border-[#684A97]/30 pl-3">
                <p className="text-xs text-muted-foreground">
                  {a.autorNome} · {dataHoraBr(a.criadoEm)}
                </p>
                <p className="whitespace-pre-line text-sm">{a.texto}</p>
              </li>
            ))}
          </ul>
        )}
        {(coordenacao || responsavel) && <FormAndamento key={meta.andamentos.length} metaId={meta.id} />}
      </section>

      {coordenacao && (
        <FormMeta
          key={[meta.titulo, meta.descricao, meta.prazo, ...meta.responsaveis.map((r) => r.id)].join("|")}
          meta={meta}
          pessoas={pessoas}
        />
      )}
    </div>
  );
}
