import Link from "next/link";
import { equipesRecentes, listarEncontrosDoMes, listarEspacos, listarTurmas } from "@/lib/api/gestao/alocacao";
import { listEscolas } from "@/lib/api/gestao/entities";
import { listarEquipe } from "@/lib/api/gestao/equipe";
import type { Encontro } from "@/lib/api/gestao/types";
import { exigirMembro } from "../guard";
import { FormEncontro } from "./forms";
import { CaixaLote, SelecaoLote } from "./lote";
import { SeletorMes } from "../seletor-mes";
import { diaCurto, mesDaUrl, TIPO_ENCONTRO } from "./rotulos";

/**
 * Calendário da alocação (spec 014): o mês inteiro, cada encontro com a equipe.
 * Com a seleção ligada, a mesma ação vale para vários encontros (spec 020).
 */

const SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

/** Quem conta no encontro: substituído e retirado aparecem só no detalhe. */
function presentes(e: Encontro) {
  return e.alocacoes.filter((a) => a.situacao !== "substituida" && a.situacao !== "retirada");
}

function CartaoEncontro({ e }: { e: Encontro }) {
  const cancelado = Boolean(e.canceladoEm);
  const naoAbriu = e.turmaStatus === "nao_abriu";
  const equipe = presentes(e);
  const estilo =
    cancelado || naoAbriu
      ? "bg-gray-50 text-gray-500 line-through"
      : e.concluidoEm
        ? "border-green-300 bg-green-50 text-green-900"
        : "bg-white";
  return (
    <div className="flex items-start gap-1">
      <CaixaLote
        id={e.id}
        turmaId={e.turmaId}
        ativo={!cancelado && !e.concluidoEm}
        rotulo={`${diaCurto(e.data)} ${e.horario} ${e.modalidade}`}
      />
      <Link
        href={`/gestao/alocacao/${e.id}`}
        className={`block min-w-0 flex-1 rounded-md border p-2 text-xs hover:border-[#684A97] ${estilo}`}
      >
        {e.concluidoEm && <span className="sr-only">Concluído. </span>}
        <span className="font-semibold">
          {e.concluidoEm && <span aria-hidden>✓ </span>}
          {e.horario}
        </span>{" "}
        · {e.modalidade}
        {e.numeroAula !== null && ` · Aula ${e.numeroAula}`}
        {e.tipo !== "aula" && <span className="block text-gray-600">{TIPO_ENCONTRO[e.tipo]}</span>}
        {e.turmaNome && <span className="block text-gray-600">{e.turmaNome}</span>}
        {e.escolaNome && <span className="block text-gray-600">{e.escolaNome}</span>}
        {e.espacoNome && <span className="block text-gray-600">{e.espacoNome}</span>}
        <span className="mt-1 block">
          {equipe.length ? equipe.map((a) => a.bolsistaNome.split(" ")[0]).join(", ") : "Sem equipe"}
        </span>
      </Link>
    </div>
  );
}

export default async function AlocacaoPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; espaco?: string }>;
}) {
  await exigirMembro("/gestao/alocacao", "coordenacao");
  const params = await searchParams;
  const mes = mesDaUrl(params.mes);

  const [encontros, turmas, escolas, equipe, equipes, espacos] = await Promise.all([
    listarEncontrosDoMes(mes),
    listarTurmas(),
    listEscolas(),
    listarEquipe(),
    equipesRecentes(),
    listarEspacos(),
  ]);

  // Id desconhecido na URL vale como sem filtro.
  const filtro = espacos.find((s) => s.id === params.espaco) ?? null;
  const visiveis = filtro ? encontros.filter((e) => e.espacoId === filtro.id) : encontros;
  const usados = new Set(encontros.map((e) => e.espacoId));
  const espacosDoFiltro = espacos.filter((s) => s.ativo || usados.has(s.id));
  const linkEspaco = (id: string | null) =>
    `?${new URLSearchParams(id ? { mes, espaco: id } : { mes })}`;

  const pessoas = equipe
    .filter((m) => !m.desligadoEm)
    .sort((a, b) => Number(b.bolsista) - Number(a.bolsista) || a.nome.localeCompare(b.nome))
    .map((m) => ({ id: m.userProfileId, nome: m.nome }));

  // Turmas com encontro no mês, para marcar todos os de uma turma de uma vez (spec 020).
  const turmasDoMes = [
    ...new Map(
      visiveis.filter((e) => e.turmaId).map((e) => [e.turmaId!, { id: e.turmaId!, nome: e.turmaNome ?? "Turma" }]),
    ).values(),
  ].sort((a, b) => a.nome.localeCompare(b.nome));

  const porDia = new Map<string, Encontro[]>();
  for (const e of visiveis) porDia.set(e.data, [...(porDia.get(e.data) ?? []), e]);

  const [ano, m] = mes.split("-").map(Number);
  const primeiroDia = new Date(Date.UTC(ano, m - 1, 1)).getUTCDay();
  const diasNoMes = new Date(Date.UTC(ano, m, 0)).getUTCDate();
  const celulas: (string | null)[] = [
    ...Array<null>(primeiroDia).fill(null),
    ...Array.from({ length: diasNoMes }, (_, i) => `${mes}-${String(i + 1).padStart(2, "0")}`),
  ];

  return (
    <div className="space-y-6">
      <SeletorMes mes={mes} parametros={filtro ? { espaco: filtro.id } : undefined} />

      {espacosDoFiltro.length > 0 && (
        <nav aria-label="Espaço" className="flex flex-wrap gap-2 text-sm">
          {[{ id: null, nome: "Todos" }, ...espacosDoFiltro].map((s) => {
            const atual = (filtro?.id ?? null) === s.id;
            return (
              <Link
                key={s.id ?? "todos"}
                href={linkEspaco(s.id)}
                scroll={false}
                aria-current={atual ? "page" : undefined}
                className={`rounded-full border px-3 py-1 ${atual ? "border-[#684A97] bg-[#684A97] text-white" : "bg-white text-[#684A97] hover:bg-[#684A97]/10"}`}
              >
                {s.nome}
              </Link>
            );
          })}
        </nav>
      )}

      <SelecaoLote turmas={turmasDoMes} pessoas={pessoas}>
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
              {dia && (porDia.get(dia) ?? []).map((e) => <CartaoEncontro key={e.id} e={e} />)}
            </div>
          ))}
        </div>

        {/* Celular: lista por dia. */}
        <ul className="space-y-3 md:hidden">
          {[...porDia.entries()].map(([dia, lista]) => (
            <li key={dia} className="space-y-1">
              <p className="text-sm font-medium">{diaCurto(dia)}</p>
              {lista.map((e) => (
                <CartaoEncontro key={e.id} e={e} />
              ))}
            </li>
          ))}
        </ul>
        {visiveis.length === 0 && (
          <p className="rounded-lg border bg-white p-4 text-sm text-muted-foreground">Nenhum encontro lançado neste mês.</p>
        )}
      </SelecaoLote>

      <FormEncontro
        turmas={turmas}
        escolas={escolas.map((e) => ({ id: e.id, nome: e.nome }))}
        espacos={espacos.filter((s) => s.ativo).map((s) => ({ id: s.id, nome: s.nome }))}
        pessoas={pessoas}
        equipes={equipes}
        dataPadrao={`${mes}-01`}
      />
    </div>
  );
}
