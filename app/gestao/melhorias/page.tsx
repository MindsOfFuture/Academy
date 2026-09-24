import Link from "next/link";
import { AREA_MELHORIA, STATUS_MELHORIA, listarMelhorias, ordenarFila } from "@/lib/api/gestao/melhorias";
import type { AreaMelhoria, Melhoria, StatusMelhoria } from "@/lib/api/gestao/types";
import { exigirMembro } from "../guard";
import { COR_STATUS } from "./estilo";
import { FormNovaMelhoria } from "./forms";

/**
 * Pedido de melhoria (spec 011). Bolsista: formulário + lista de todos os
 * pedidos (para não repetir e ver que o canal responde). Coordenação: a mesma
 * lista ordenada como fila, atrasadas primeiro.
 */

function dataBr(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo" }).format(new Date(iso));
}

export default async function MelhoriasPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; area?: string }>;
}) {
  const papel = await exigirMembro("/gestao/melhorias");
  const filtros = await searchParams;
  const todas = await listarMelhorias();

  const status = filtros.status && filtros.status in STATUS_MELHORIA ? (filtros.status as StatusMelhoria) : null;
  const area = filtros.area && filtros.area in AREA_MELHORIA ? (filtros.area as AreaMelhoria) : null;
  const filtradas = todas.filter((m) => (!status || m.status === status) && (!area || m.area === area));
  const lista = papel === "coordenacao" ? ordenarFila(filtradas) : filtradas;

  const esperando = todas.filter((m) => m.status === "nova").length;
  const atrasadas = todas.filter((m) => m.atrasada).length;

  return (
    <div className="space-y-6">
      {papel === "coordenacao" ? (
        <section className="grid grid-cols-2 gap-4" aria-label="Situação da fila">
          <Numero titulo="Esperando resposta" valor={esperando} />
          <Numero titulo="Há mais de 14 dias" valor={atrasadas} destaque={atrasadas > 0} />
        </section>
      ) : (
        <FormNovaMelhoria areas={AREA_MELHORIA} />
      )}

      <section aria-labelledby="pedidos" className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 id="pedidos" className="text-xl font-semibold">
            {papel === "coordenacao" ? "Fila de pedidos" : "Pedidos da equipe"}
          </h2>
          <Filtros status={status} area={area} />
        </div>
        {lista.length === 0 ? (
          <p className="rounded-lg border bg-white p-4 text-sm text-muted-foreground">Nenhum pedido por aqui.</p>
        ) : (
          <ul className="space-y-2">
            {lista.map((m) => (
              <ItemMelhoria key={m.id} melhoria={m} />
            ))}
          </ul>
        )}
      </section>

      {papel === "coordenacao" && (
        <details className="rounded-lg border bg-white p-4">
          <summary className="cursor-pointer text-sm font-medium">A coordenação também pode pedir uma melhoria</summary>
          <div className="mt-3">
            <FormNovaMelhoria areas={AREA_MELHORIA} />
          </div>
        </details>
      )}
    </div>
  );
}

function Numero({ titulo, valor, destaque }: { titulo: string; valor: number; destaque?: boolean }) {
  return (
    <div className={`rounded-lg border bg-white p-4 shadow-sm ${destaque ? "border-l-4 border-l-[#E8473A]" : ""}`}>
      <p className="text-sm text-muted-foreground">{titulo}</p>
      <p className="mt-1 text-2xl font-semibold">{valor}</p>
    </div>
  );
}

function Filtros({ status, area }: { status: StatusMelhoria | null; area: AreaMelhoria | null }) {
  return (
    <form className="flex flex-wrap gap-2" method="get">
      <select name="status" defaultValue={status ?? ""} aria-label="Filtrar por situação" className="h-9 rounded-md border bg-white px-2 text-sm">
        <option value="">Todas as situações</option>
        {(Object.keys(STATUS_MELHORIA) as StatusMelhoria[]).map((s) => (
          <option key={s} value={s}>
            {STATUS_MELHORIA[s]}
          </option>
        ))}
      </select>
      <select name="area" defaultValue={area ?? ""} aria-label="Filtrar por assunto" className="h-9 rounded-md border bg-white px-2 text-sm">
        <option value="">Todos os assuntos</option>
        {(Object.keys(AREA_MELHORIA) as AreaMelhoria[]).map((a) => (
          <option key={a} value={a}>
            {AREA_MELHORIA[a]}
          </option>
        ))}
      </select>
      <button type="submit" className="h-9 rounded-md border bg-white px-3 text-sm hover:bg-gray-50">
        Filtrar
      </button>
    </form>
  );
}

function ItemMelhoria({ melhoria: m }: { melhoria: Melhoria }) {
  return (
    <li>
      <Link
        href={`/gestao/melhorias/${m.id}`}
        className={`block rounded-lg border bg-white p-4 shadow-sm transition-colors hover:border-[#684A97] ${
          m.atrasada ? "border-l-4 border-l-[#E8473A]" : ""
        }`}
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${COR_STATUS[m.status]}`}>
            {STATUS_MELHORIA[m.status]}
          </span>
          {m.atrasada && <span className="text-xs font-medium text-[#E8473A]">Sem resposta há mais de 14 dias</span>}
          <span className="text-xs text-muted-foreground">{AREA_MELHORIA[m.area]}</span>
        </div>
        <p className="mt-2 font-medium">{m.titulo}</p>
        <p className="text-sm text-muted-foreground">
          {m.autorNome} · {dataBr(m.criadoEm)}
          {m.apoios > 0 && ` · ${m.apoios} ${m.apoios === 1 ? "apoio" : "apoios"}`}
        </p>
      </Link>
    </li>
  );
}
