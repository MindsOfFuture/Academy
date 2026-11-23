import { classeFiltro } from "@/components/ui/botoes";
import Link from "next/link";
import { equipesRecentes, listarEncontrosDoMes, listarEspacos, listarTurmas } from "@/lib/api/gestao/alocacao";
import { listEscolas } from "@/lib/api/gestao/entities";
import { listarEquipe } from "@/lib/api/gestao/equipe";
import type { Encontro } from "@/lib/api/gestao/types";
import { exigirMembro } from "../guard";
import { FormEncontro } from "./forms";
import { CaixaLote, SelecaoLote } from "./lote";
import { SeletorMes } from "../seletor-mes";
import { GradeDoMes } from "../grade-do-mes";
import { diaCurto, mesDaUrl, TIPO_ENCONTRO } from "./rotulos";

/**
 * Calendário da alocação (spec 014): o mês inteiro, cada encontro com a equipe.
 * Com a seleção ligada, a mesma ação vale para vários encontros (spec 020).
 */

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

  return (
    <div className="space-y-6">
      <SeletorMes mes={mes} parametros={filtro ? { espaco: filtro.id } : undefined} />

      <div className="flex justify-end">
        {/* Link comum: o navegador baixa o .ics que a rota devolve, com o mesmo filtro da tela. */}
        <a
          href={`/gestao/calendario/exportar?${new URLSearchParams(filtro ? { mes, espaco: filtro.id } : { mes })}`}
          className="rounded-md border border-[#684A97] px-4 py-2 text-sm font-medium text-[#684A97] hover:bg-[#684A97]/10"
        >
          Exportar para o Google Agenda
        </a>
      </div>

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
                className={classeFiltro(atual)}
              >
                {s.nome}
              </Link>
            );
          })}
        </nav>
      )}

      <SelecaoLote turmas={turmasDoMes} pessoas={pessoas}>
        <GradeDoMes
          mes={mes}
          itens={visiveis}
          cartao={(e) => <CartaoEncontro e={e} />}
          vazio="Nenhum encontro lançado neste mês."
        />
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
