import Link from "next/link";
import { notFound } from "next/navigation";
import { historicoDoEncontro, obterEncontro } from "@/lib/api/gestao/alocacao";
import { listarEquipe } from "@/lib/api/gestao/equipe";
import type { Alocacao } from "@/lib/api/gestao/types";
import { exigirMembro } from "../../guard";
import { FormAlocacao, FormAlocar, FormCancelarEncontro } from "../forms";
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
};

function valorLegivel(v: unknown): string {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "string" && v in SITUACAO) return SITUACAO[v as keyof typeof SITUACAO];
  if (typeof v === "string" && /^\d{2}:\d{2}:\d{2}$/.test(v)) return v.slice(0, 5);
  return String(v);
}

function dataHoraBr(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(iso));
}

function Resumo({ a }: { a: Alocacao }) {
  return (
    <p className="text-sm">
      <span className="font-medium">{a.bolsistaNome}</span> · {SITUACAO[a.situacao]}
      {a.inicio && ` · das ${a.inicio} às ${a.fim}`}
      {a.cobertoPorNome && (a.situacao === "substituida" ? ` · substituída por ${a.cobertoPorNome}` : ` · coberta por ${a.cobertoPorNome}`)}
      {a.motivo && <span className="block text-muted-foreground">{a.motivo}</span>}
    </p>
  );
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
  const cancelado = Boolean(encontro.canceladoEm);

  return (
    <div className="space-y-6">
      <Link href={`/gestao/alocacao?mes=${encontro.data.slice(0, 7)}`} className="text-sm text-[#684A97] hover:underline">
        ← Calendário
      </Link>

      <section className="space-y-2 rounded-lg border bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold">
          {diaCurto(encontro.data)} · {encontro.horario} · {encontro.modalidade}
        </h2>
        <p className="text-sm text-muted-foreground">
          {encontro.turmaNome ? `${encontro.turmaNome} · ` : "Sem turma · "}
          {encontro.escolaNome}
          {encontro.descricao !== encontro.modalidade && ` · ${encontro.descricao}`}
        </p>
        {encontro.turmaStatus === "nao_abriu" && (
          <p className="rounded-md bg-[#FDCF60]/40 p-2 text-sm">
            A turma está como “{STATUS_TURMA.nao_abriu}”: este encontro fica visível como previsto e não conta horas.
          </p>
        )}
        {cancelado ? (
          <p className="rounded-md bg-gray-100 p-2 text-sm">
            Cancelado em {dataHoraBr(encontro.canceladoEm!)}: {encontro.motivoCancelamento}. Não conta horas.
          </p>
        ) : (
          <FormCancelarEncontro encontroId={encontro.id} />
        )}
      </section>

      <section aria-labelledby="equipe" className="space-y-3">
        <h3 id="equipe" className="text-lg font-semibold">
          Equipe
        </h3>
        <ul className="divide-y rounded-lg border bg-white shadow-sm">
          {encontro.alocacoes.map((a) => (
            <li key={a.id} className="space-y-3 p-4">
              <Resumo a={a} />
              {!cancelado && (
                <FormAlocacao alocacao={a} pessoas={ativos} limites={{ inicio: encontro.inicio, fim: encontro.fim }} />
              )}
            </li>
          ))}
          {encontro.alocacoes.length === 0 && <li className="p-4 text-sm text-muted-foreground">Ninguém alocado.</li>}
        </ul>
        {!cancelado && <FormAlocar encontroId={encontro.id} pessoas={ativos.filter((p) => !jaAlocados.has(p.id))} />}
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
                {h.acao === "insert" ? (h.tabela === "agenda" ? "lançou o encontro" : "alocou") : "alterou"}
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
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
