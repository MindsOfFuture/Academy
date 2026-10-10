import { notFound, redirect } from "next/navigation";
import { obterEncontro } from "@/lib/api/gestao/alocacao";
import { usuarioAtualId } from "@/lib/api/gestao/melhorias";
import { FormConcluirEncontro } from "../../alocacao/forms";
import { Relatorio, Resumo, jaComecou } from "../../alocacao/resumo";
import { diaCurto } from "../../alocacao/rotulos";
import { exigirMembro } from "../../guard";

/**
 * O encontro visto pelo bolsista (spec 016), só leitura: dados, equipe e
 * relatório. O gestor do encontro conclui por aqui. A RLS só devolve encontro
 * em que a pessoa está alocada; a coordenação vai para a página completa.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function EncontroBolsistaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const papel = await exigirMembro(`/gestao/encontro/${id}`);
  if (!UUID.test(id)) notFound();
  if (papel === "coordenacao") redirect(`/gestao/alocacao/${id}`);

  const [encontro, eu] = await Promise.all([obterEncontro(id), usuarioAtualId()]);
  if (!encontro) notFound();

  const gestor = encontro.alocacoes.some((a) => a.bolsistaId === eu && a.gestor);
  const podeConcluir = gestor && !encontro.canceladoEm && (encontro.concluidoEm || jaComecou(encontro));

  return (
    <div className="space-y-6">
      <section className="space-y-2 rounded-lg border bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <h2 className="text-xl font-semibold">
            {diaCurto(encontro.data)} · {encontro.horario} · {encontro.modalidade}
          </h2>
          {podeConcluir && (
            <FormConcluirEncontro
              encontroId={encontro.id}
              concluido={Boolean(encontro.concluidoEm)}
              relatorio={encontro.relatorio}
            />
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {encontro.turmaNome ?? "Sem turma"}
          {` · ${encontro.escolaNome ?? "Fora de escola"}`}
          {encontro.descricao !== encontro.modalidade && ` · ${encontro.descricao}`}
        </p>
        {encontro.canceladoEm && (
          <p className="rounded-md bg-gray-100 p-2 text-sm">Cancelado: {encontro.motivoCancelamento}</p>
        )}
        <Relatorio encontro={encontro} />
      </section>

      <section aria-labelledby="equipe" className="space-y-3">
        <h3 id="equipe" className="text-lg font-semibold">
          Equipe
        </h3>
        <ul className="divide-y rounded-lg border bg-white shadow-sm">
          {encontro.alocacoes.map((a) => (
            <li key={a.id} className="p-4">
              <Resumo a={a} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
