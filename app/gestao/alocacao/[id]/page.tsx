import Link from "next/link";
import { notFound } from "next/navigation";
import { historicoDoEncontro, obterEncontro } from "@/lib/api/gestao/alocacao";
import { listarEquipe } from "@/lib/api/gestao/equipe";
import { exigirMembro } from "../../guard";
import {
  FormAlocacao,
  FormAlocar,
  FormCancelarEncontro,
  FormConcluirEncontro,
  FormGestor,
  FormRemoverAlocacao,
} from "../forms";
import { Relatorio, Resumo, dataHoraBr, jaComecou } from "../resumo";
import { SITUACAO, STATUS_TURMA, diaCurto } from "../rotulos";

/** Um encontro (spec 014): equipe, o que aconteceu com cada um e o histórico. */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Nome legível do campo gravado, para o histórico. */
const CAMPO: Record<string, string> = {
  bolsista_id: "pessoa",
  situacao: "situação",
  inicio: "início",
  fim: "fim",
  coberto_por: "coberto por",
  motivo: "motivo",
  carga: "horas",
  data: "data",
  horario: "horário",
  modalidade: "atividade",
  aulas: "observação",
  turma_id: "turma",
  escola_id: "escola",
  cancelado_em: "cancelado em",
  motivo_cancelamento: "motivo do cancelamento",
  concluido_em: "concluído em",
  relatorio: "relatório",
  gestor: "gestor",
};

function valorLegivel(v: unknown): string {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "string" && v in SITUACAO) return SITUACAO[v as keyof typeof SITUACAO];
  if (typeof v === "string" && /^\d{2}:\d{2}:\d{2}$/.test(v)) return v.slice(0, 5);
  return String(v);
}

export default async function EncontroPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await exigirMembro(`/gestao/alocacao/${id}`, "coordenacao");
  if (!UUID.test(id)) notFound();

  const [encontro, equipe] = await Promise.all([obterEncontro(id), listarEquipe()]);
  if (!encontro) notFound();
  const historico = await historicoDoEncontro(encontro);

  const ativos = equipe.filter((m) => !m.desligadoEm).map((m) => ({ id: m.userProfileId, nome: m.nome }));
  const jaAlocados = new Set(encontro.alocacoes.map((a) => a.bolsistaId));
  // Quem já está no encontro não aparece para acrescentar nem para substituir.
  const foraDoEncontro = ativos.filter((p) => !jaAlocados.has(p.id));
  const cancelado = Boolean(encontro.canceladoEm);
  const comecou = jaComecou(encontro);

  return (
    <div className="space-y-6">
      <Link href={`/gestao/alocacao?mes=${encontro.data.slice(0, 7)}`} className="text-sm text-[#684A97] hover:underline">
        ← Calendário
      </Link>

      <section className="space-y-2 rounded-lg border bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <h2 className="text-xl font-semibold">
            {diaCurto(encontro.data)} · {encontro.horario} · {encontro.modalidade}
          </h2>
          {!cancelado && (encontro.concluidoEm || comecou) && (
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
        {encontro.turmaStatus === "nao_abriu" && (
          <p className="rounded-md bg-[#FDCF60]/40 p-2 text-sm">
            A turma está como “{STATUS_TURMA.nao_abriu}”: este encontro fica visível como previsto e não conta horas.
          </p>
        )}
        <Relatorio encontro={encontro} />
        {cancelado ? (
          <p className="rounded-md bg-gray-100 p-2 text-sm">
            Cancelado em {dataHoraBr(encontro.canceladoEm!)}: {encontro.motivoCancelamento}. Não conta horas.
          </p>
        ) : (
          !encontro.concluidoEm && <FormCancelarEncontro encontroId={encontro.id} />
        )}
      </section>

      <section aria-labelledby="equipe" className="space-y-3">
        <h3 id="equipe" className="text-lg font-semibold">
          Equipe
        </h3>
        <ul className="divide-y rounded-lg border bg-white shadow-sm">
          {encontro.alocacoes.map((a) => (
            <li key={a.id} className="space-y-3 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <Resumo a={a} />
                {!cancelado && (
                  <div className="flex flex-wrap gap-2">
                    <FormGestor alocacaoId={a.id} gestor={a.gestor} />
                    <FormRemoverAlocacao alocacaoId={a.id} nome={a.bolsistaNome} />
                  </div>
                )}
              </div>
              {!cancelado && (
                <FormAlocacao
                  // Remonta com o que foi salvo: depois de enviar, o React volta o formulário
                  // ao valor com que ele nasceu, e o campo mostraria o valor antigo.
                  key={[a.situacao, a.inicio, a.fim, a.cobertoPor, a.motivo].join("|")}
                  alocacao={a}
                  pessoas={ativos}
                  substitutos={foraDoEncontro}
                  limites={{ inicio: encontro.inicio, fim: encontro.fim }}
                />
              )}
            </li>
          ))}
          {encontro.alocacoes.length === 0 && <li className="p-4 text-sm text-muted-foreground">Ninguém alocado.</li>}
        </ul>
        {!cancelado && <FormAlocar encontroId={encontro.id} pessoas={foraDoEncontro} />}
      </section>

      <section aria-labelledby="historico" className="space-y-3">
        <h3 id="historico" className="text-lg font-semibold">
          Histórico
        </h3>
        <ol className="space-y-2">
          {historico.map((h, i) => (
            <li key={i} className="rounded-lg border bg-white p-3 text-sm">
              <p className="text-muted-foreground">
                {dataHoraBr(h.ocorridoEm)} · {h.autorNome} ·{" "}
                {h.acao === "insert"
                  ? h.tabela === "agenda"
                    ? "lançou o encontro"
                    : "alocou"
                  : h.acao === "delete"
                    ? "removeu do encontro"
                    : "alterou"}
              </p>
              {h.acao === "update" && (
                <ul className="mt-1">
                  {h.mudancas.map((m) => (
                    <li key={m.campo}>
                      {CAMPO[m.campo] ?? m.campo}: {valorLegivel(m.antes)} → {valorLegivel(m.depois)}
                    </li>
                  ))}
                </ul>
              )}
              {h.acao === "insert" && h.tabela === "agenda_bolsista" && (
                <p>{valorLegivel(h.mudancas.find((m) => m.campo === "bolsista_id")?.depois)}</p>
              )}
              {h.acao === "delete" && (
                <p>{valorLegivel(h.mudancas.find((m) => m.campo === "bolsista_id")?.antes)}</p>
              )}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
