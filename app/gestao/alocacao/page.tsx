import Link from "next/link";
import { equipesRecentes, listarEncontrosDoMes, listarTurmas } from "@/lib/api/gestao/alocacao";
import { listEscolas } from "@/lib/api/gestao/entities";
import { listarEquipe } from "@/lib/api/gestao/equipe";
import type { Encontro } from "@/lib/api/gestao/types";
import { exigirMembro } from "../guard";
import { FormEncontro } from "./forms";
import { diaCurto, mesDaUrl, mesVizinho, nomeDoMes } from "./rotulos";

/** Calendário da alocação (spec 014): o mês inteiro, cada encontro com a equipe. */

const SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

/** Quem conta no encontro: substituído e retirado aparecem só no detalhe. */
function presentes(e: Encontro) {
  return e.alocacoes.filter((a) => a.situacao !== "substituida" && a.situacao !== "retirada");
}

function CartaoEncontro({ e }: { e: Encontro }) {
  const cancelado = Boolean(e.canceladoEm);
  const naoAbriu = e.turmaStatus === "nao_abriu";
  const equipe = presentes(e);
  return (
    <Link
      href={`/gestao/alocacao/${e.id}`}
      className={`block rounded-md border p-2 text-xs hover:border-[#684A97] ${
        cancelado || naoAbriu ? "bg-gray-50 text-gray-500 line-through" : "bg-white"
      }`}
    >
      <span className="font-semibold">{e.horario}</span> · {e.modalidade}
      {e.turmaNome && <span className="block text-gray-600">{e.turmaNome}</span>}
      <span className="block text-gray-600">{e.escolaNome}</span>
      <span className="mt-1 block">
        {equipe.length ? equipe.map((a) => a.bolsistaNome.split(" ")[0]).join(", ") : "Sem equipe"}
      </span>
    </Link>
  );
}

export default async function AlocacaoPage({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  await exigirMembro("/gestao/alocacao", "coordenacao");
  const mes = mesDaUrl((await searchParams).mes);

  const [encontros, turmas, escolas, equipe, equipes] = await Promise.all([
    listarEncontrosDoMes(mes),
    listarTurmas(),
    listEscolas(),
    listarEquipe(),
    equipesRecentes(),
  ]);

  const pessoas = equipe
    .filter((m) => !m.desligadoEm)
    .sort((a, b) => Number(b.bolsista) - Number(a.bolsista) || a.nome.localeCompare(b.nome))
    .map((m) => ({ id: m.userProfileId, nome: m.nome }));

  const porDia = new Map<string, Encontro[]>();
  for (const e of encontros) porDia.set(e.data, [...(porDia.get(e.data) ?? []), e]);

  const [ano, m] = mes.split("-").map(Number);
  const primeiroDia = new Date(Date.UTC(ano, m - 1, 1)).getUTCDay();
  const diasNoMes = new Date(Date.UTC(ano, m, 0)).getUTCDate();
  const celulas: (string | null)[] = [
    ...Array<null>(primeiroDia).fill(null),
    ...Array.from({ length: diasNoMes }, (_, i) => `${mes}-${String(i + 1).padStart(2, "0")}`),
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <Link href={`?mes=${mesVizinho(mes, -1)}`} className="text-sm text-[#684A97] hover:underline">
          ← Anterior
        </Link>
        <h2 className="text-xl font-semibold">{nomeDoMes(mes)}</h2>
        <Link href={`?mes=${mesVizinho(mes, 1)}`} className="text-sm text-[#684A97] hover:underline">
          Próximo →
        </Link>
      </div>

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
      {encontros.length === 0 && (
        <p className="rounded-lg border bg-white p-4 text-sm text-muted-foreground">Nenhum encontro lançado neste mês.</p>
      )}

      {escolas.length === 0 ? (
        <p className="rounded-lg border bg-white p-4 text-sm">
          Para lançar encontros, primeiro{" "}
          <Link href="/gestao/alocacao/turmas" className="text-[#684A97] underline">
            cadastre uma escola
          </Link>
          .
        </p>
      ) : (
        <FormEncontro
          turmas={turmas}
          escolas={escolas.map((e) => ({ id: e.id, nome: e.nome }))}
          pessoas={pessoas}
          equipes={equipes}
          dataPadrao={`${mes}-01`}
        />
      )}
    </div>
  );
}
