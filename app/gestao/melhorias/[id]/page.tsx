import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AREA_MELHORIA,
  PROXIMOS_STATUS,
  STATUS_MELHORIA,
  listarMelhorias,
  obterMelhoria,
  usuarioAtualId,
} from "@/lib/api/gestao/melhorias";
import { exigirMembro } from "../../guard";
import { COR_STATUS } from "../estilo";
import { BotaoApoio, FormEditarMelhoria, FormResponderMelhoria } from "../forms";

/** Detalhe de um pedido de melhoria (spec 011). */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function dataHoraBr(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(iso));
}

export default async function MelhoriaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ enviado?: string }>;
}) {
  const { id } = await params;
  const papel = await exigirMembro(`/gestao/melhorias/${id}`);
  if (!UUID.test(id)) notFound();

  const [pedido, usuarioId, { enviado }] = await Promise.all([obterMelhoria(id), usuarioAtualId(), searchParams]);
  if (!pedido) notFound();

  const souAutor = pedido.autorId === usuarioId;
  const coordenacao = papel === "coordenacao";
  const outrosPedidos = coordenacao
    ? (await listarMelhorias()).filter((m) => m.id !== pedido.id).map((m) => ({ id: m.id, titulo: m.titulo }))
    : [];

  return (
    <div className="space-y-6">
      <Link href="/gestao/melhorias" className="text-sm text-[#684A97] hover:underline">
        ← Todos os pedidos
      </Link>

      {enviado && (
        <p role="status" className="rounded-md bg-green-50 p-3 text-sm text-green-800">
          Pedido enviado. A coordenação responde em até 14 dias e você recebe o aviso no sino.
        </p>
      )}

      <article className="space-y-4 rounded-lg border bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${COR_STATUS[pedido.status]}`}>
            {STATUS_MELHORIA[pedido.status]}
          </span>
          {pedido.atrasada && (
            <span className="text-xs font-medium text-[#E8473A]">Sem resposta há mais de 14 dias</span>
          )}
          <span className="text-xs text-muted-foreground">{AREA_MELHORIA[pedido.area]}</span>
        </div>
        <h2 className="text-2xl font-semibold">{pedido.titulo}</h2>
        <p className="text-sm text-muted-foreground">
          Pedido por {souAutor ? "você" : pedido.autorNome} em {dataHoraBr(pedido.criadoEm)}
        </p>

        <Bloco titulo="Qual é o problema">{pedido.problema}</Bloco>
        <Bloco titulo="O que propõe">{pedido.proposta}</Bloco>
        {pedido.quemSofre && <Bloco titulo="Quem sofre com isso hoje">{pedido.quemSofre}</Bloco>}

        <BotaoApoio id={pedido.id} apoiei={pedido.apoiei} apoios={pedido.apoios} podeApoiar={!souAutor} />
      </article>

      {(pedido.respondidaEm || pedido.resposta || pedido.linkExecucao) && (
        <section className="space-y-2 rounded-lg border bg-white p-5 shadow-sm" aria-labelledby="resposta">
          <h2 id="resposta" className="text-lg font-semibold">
            Resposta da coordenação
          </h2>
          {pedido.respondidaEm && (
            <p className="text-sm text-muted-foreground">Primeira resposta em {dataHoraBr(pedido.respondidaEm)}</p>
          )}
          {pedido.resposta && <p className="whitespace-pre-line">{pedido.resposta}</p>}
          {pedido.duplicadaDe && (
            <p className="text-sm">
              Mesmo assunto de{" "}
              <Link href={`/gestao/melhorias/${pedido.duplicadaDe}`} className="text-[#684A97] underline">
                outro pedido
              </Link>
              .
            </p>
          )}
          {pedido.linkExecucao && (
            <p className="text-sm">
              Acompanhe em{" "}
              <a href={pedido.linkExecucao} target="_blank" rel="noopener noreferrer" className="text-[#684A97] underline">
                {pedido.linkExecucao}
              </a>
            </p>
          )}
        </section>
      )}

      {souAutor && pedido.status === "nova" && <FormEditarMelhoria areas={AREA_MELHORIA} pedido={pedido} />}

      {coordenacao && (
        <FormResponderMelhoria
          pedido={pedido}
          proximos={PROXIMOS_STATUS[pedido.status]}
          rotulosStatus={STATUS_MELHORIA}
          outrosPedidos={outrosPedidos}
        />
      )}
    </div>
  );
}

function Bloco({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <h3 className="text-sm font-semibold text-gray-700">{titulo}</h3>
      <p className="whitespace-pre-line">{children}</p>
    </div>
  );
}
