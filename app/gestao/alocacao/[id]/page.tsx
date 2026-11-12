import Link from "next/link";
import { notFound } from "next/navigation";
import { historicoDoEncontro, listarEspacos, obterEncontro } from "@/lib/api/gestao/alocacao";
import { listarEquipe } from "@/lib/api/gestao/equipe";
import { exigirMembro } from "../../guard";
import {
  FormAlocacao,
  FormAlocar,
  FormCancelarEncontro,
  FormConcluirEncontro,
  FormPresentes,
  FormEditarEncontro,
  FormRemoverAlocacao,
} from "../forms";
import { NotasPendentes, Relatorio, Resumo, dataHoraBr, jaComecou } from "../resumo";
import { FUNCAO, SITUACAO, STATUS_TURMA, TIPO_ENCONTRO, diaCurto } from "../rotulos";

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
  atraso_minutos: "atraso (min)",
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
  nota_encerramento: "nota de encerramento",
  link_comprovacao: "link de comprovação",
  numero_aula: "número da aula",
  presentes: "presentes",
  funcao: "função",
  tipo: "tipo",
  espaco_id: "espaço",
};

function valorLegivel(v: unknown, espacos: Map<string, string> = new Map()): string {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "string" && v in SITUACAO) return SITUACAO[v as keyof typeof SITUACAO];
  if (typeof v === "string" && v in FUNCAO) return FUNCAO[v as keyof typeof FUNCAO];
  if (typeof v === "string" && v in TIPO_ENCONTRO) return TIPO_ENCONTRO[v as keyof typeof TIPO_ENCONTRO];
  if (typeof v === "string" && espacos.has(v)) return espacos.get(v)!;
  if (typeof v === "string" && /^\d{2}:\d{2}:\d{2}$/.test(v)) return v.slice(0, 5);
  return String(v);
}

export default async function EncontroPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await exigirMembro(`/gestao/alocacao/${id}`, "coordenacao");
  if (!UUID.test(id)) notFound();

  const [encontro, equipe, espacos] = await Promise.all([obterEncontro(id), listarEquipe(), listarEspacos()]);
  if (!encontro) notFound();
  const historico = await historicoDoEncontro(encontro);

  const ativos = equipe.filter((m) => !m.desligadoEm).map((m) => ({ id: m.userProfileId, nome: m.nome }));
  const jaAlocados = new Set(encontro.alocacoes.map((a) => a.bolsistaId));
  // Quem já está no encontro não aparece para acrescentar nem para substituir.
  const foraDoEncontro = ativos.filter((p) => !jaAlocados.has(p.id));
  const cancelado = Boolean(encontro.canceladoEm);
  const comecou = jaComecou(encontro);
  const nomeDoEspaco = new Map(espacos.map((s) => [s.id, s.nome]));
  // O espaço atual continua na lista mesmo se ficou inativo.
  const opcoesEspaco = espacos.filter((s) => s.ativo || s.id === encontro.espacoId).map((s) => ({ id: s.id, nome: s.nome }));

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
          {encontro.tipo !== "aula" && ` · ${TIPO_ENCONTRO[encontro.tipo]}`}
          {encontro.espacoNome && ` · ${encontro.espacoNome}`}
          {encontro.descricao !== encontro.modalidade && ` · ${encontro.descricao}`}
          {encontro.numeroAula !== null && ` · Aula ${encontro.numeroAula}`}
          {encontro.presentes !== null && ` · ${encontro.presentes} presentes`}
        </p>
        {!cancelado && (
          <FormEditarEncontro
            encontro={encontro}
            espacos={opcoesEspaco}
          />
        )}
        {encontro.turmaStatus === "nao_abriu" && (
          <p className="rounded-md bg-[#FDCF60]/40 p-2 text-sm">
            A turma está como “{STATUS_TURMA.nao_abriu}”: este encontro fica visível como previsto e não conta horas.
          </p>
        )}
        <Relatorio encontro={encontro} />
        <NotasPendentes encontro={encontro} />
        {!cancelado && comecou && (encontro.escolaId || encontro.turmaId) && (
          <FormPresentes encontroId={encontro.id} presentes={encontro.presentes} />
        )}
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
                <Resumo a={a} mostrarAtraso />
                {!cancelado && (
                  <FormRemoverAlocacao alocacaoId={a.id} nome={a.bolsistaNome} />
                )}
              </div>
              {!cancelado && (
                <FormAlocacao
                  // Remonta com o que foi salvo: depois de enviar, o React volta o formulário
                  // ao valor com que ele nasceu, e o campo mostraria o valor antigo.
                  key={[a.situacao, a.inicio, a.fim, a.cobertoPor, a.motivo, a.atrasoMinutos, a.funcao].join("|")}
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
                      {CAMPO[m.campo] ?? m.campo}: {valorLegivel(m.antes, nomeDoEspaco)} → {valorLegivel(m.depois, nomeDoEspaco)}
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
