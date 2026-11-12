import Link from "next/link";
import { notFound } from "next/navigation";
import { usuarioDaRequisicao } from "@/lib/supabase/server";
import { buscarProducao, buscarReuniao, listarProducoes, listarReunioes } from "@/lib/api/gestao/pesquisa";
import type { ProducaoPesquisa, ReuniaoPesquisa, TipoProducao } from "@/lib/api/gestao/types";
import { TIPO_PRODUCAO } from "@/lib/api/gestao/validacao";
import { cn } from "@/lib/utils";
import { exigirMembro } from "../guard";
import { FormProducao, FormReuniao } from "./forms";
import { PartesDaPesquisa } from "./partes";

/** Pesquisa: reuniões e produções para todos os membros; artigos do site para a coordenação. */

const LISTA = "/gestao/pesquisa";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function dataBr(iso: string): string {
  const [ano, mes, dia] = iso.slice(0, 10).split("-");
  return `${dia}/${mes}/${ano}`;
}

interface Busca {
  parte?: string;
  id?: string;
  tipo?: string;
}

export default async function PesquisaPage({ searchParams }: { searchParams: Promise<Busca> }) {
  const papel = await exigirMembro(LISTA);
  const uid = await usuarioDaRequisicao();
  const { parte, id, tipo } = await searchParams;
  const producoes = parte === "producoes";
  const coordenacao = papel === "coordenacao";
  const podeEditar = (r: { criadoPor: string | null }) => coordenacao || (uid !== null && r.criadoPor === uid);

  if (id) {
    if (id !== "novo" && !UUID.test(id)) notFound();
    const atual = id === "novo" ? null : await (producoes ? buscarProducao(id) : buscarReuniao(id));
    if (id !== "novo" && (!atual || !podeEditar(atual))) notFound();
    const voltar = producoes ? `${LISTA}?parte=producoes` : LISTA;
    return (
      <div className="space-y-4">
        <Link href={voltar} className="text-sm text-[#684A97] hover:underline">
          ← Pesquisa
        </Link>
        <h2 className="text-xl font-semibold">
          {producoes ? (atual ? "Editar produção" : "Nova produção") : atual ? "Editar reunião" : "Nova reunião"}
        </h2>
        {producoes ? (
          <FormProducao key={atual?.id ?? "novo"} producao={atual as ProducaoPesquisa | null} podeApagar={coordenacao} />
        ) : (
          <FormReuniao key={atual?.id ?? "novo"} reuniao={atual as ReuniaoPesquisa | null} podeApagar={coordenacao} />
        )}
      </div>
    );
  }

  const tipoValido = tipo && Object.hasOwn(TIPO_PRODUCAO, tipo) ? (tipo as TipoProducao) : undefined;
  return (
    <section aria-labelledby="pesquisa" className="space-y-4">
      <h2 id="pesquisa" className="sr-only">
        Pesquisa
      </h2>
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-gray-200">
        <PartesDaPesquisa atual={producoes ? "producoes" : "reunioes"} coordenacao={coordenacao} />
        <Link
          href={producoes ? `${LISTA}?parte=producoes&id=novo` : `${LISTA}?id=novo`}
          className="mb-2 rounded-md bg-[#684A97] px-4 py-2 text-sm font-medium text-white hover:bg-[#684A97]/90"
        >
          {producoes ? "Nova produção" : "Nova reunião"}
        </Link>
      </div>
      {producoes ? (
        <ListaProducoes producoes={await listarProducoes(tipoValido)} tipo={tipoValido} podeEditar={podeEditar} />
      ) : (
        <ListaReunioes reunioes={await listarReunioes()} podeEditar={podeEditar} />
      )}
    </section>
  );
}

const vazio = (texto: string) => <p className="rounded-lg border bg-white p-4 text-sm text-muted-foreground">{texto}</p>;

function Editar({ href }: { href: string }) {
  return (
    <Link href={href} className="text-sm text-[#684A97] hover:underline">
      Editar
    </Link>
  );
}

function ListaReunioes({
  reunioes,
  podeEditar,
}: {
  reunioes: ReuniaoPesquisa[];
  podeEditar: (r: ReuniaoPesquisa) => boolean;
}) {
  if (reunioes.length === 0) return vazio("Nenhuma reunião ainda.");
  return (
    <ul className="divide-y rounded-lg border bg-white shadow-sm">
      {reunioes.map((r) => (
        <li key={r.id} className="space-y-2 p-4">
          <div className="flex items-baseline justify-between gap-3">
            <p className="font-medium">
              {dataBr(r.data)} · <span className="font-normal">{r.participantes}</span>
            </p>
            {podeEditar(r) && <Editar href={`${LISTA}?id=${r.id}`} />}
          </div>
          <p className="whitespace-pre-line text-sm">{r.feito}</p>
          {r.desdobramentos && (
            <p className="whitespace-pre-line text-sm text-muted-foreground">
              <span className="font-medium text-gray-700">Desdobramentos: </span>
              {r.desdobramentos}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}

function ListaProducoes({
  producoes,
  tipo,
  podeEditar,
}: {
  producoes: ProducaoPesquisa[];
  tipo: TipoProducao | undefined;
  podeEditar: (p: ProducaoPesquisa) => boolean;
}) {
  const filtros: [string, string, boolean][] = [
    [`${LISTA}?parte=producoes`, "Todos", !tipo],
    ...Object.entries(TIPO_PRODUCAO).map(
      ([valor, rotulo]): [string, string, boolean] => [`${LISTA}?parte=producoes&tipo=${valor}`, rotulo, tipo === valor],
    ),
  ];
  return (
    <div className="space-y-3">
      <nav aria-label="Filtrar por tipo" className="flex flex-wrap gap-2">
        {filtros.map(([href, rotulo, ativo]) => (
          <Link
            key={href}
            href={href}
            aria-current={ativo ? "page" : undefined}
            className={cn(
              "rounded-full border px-3 py-1 text-sm",
              ativo ? "border-[#684A97] bg-[#684A97] text-white" : "border-gray-300 text-gray-700 hover:border-[#684A97]",
            )}
          >
            {rotulo}
          </Link>
        ))}
      </nav>
      {producoes.length === 0 ? (
        vazio("Nenhuma produção ainda.")
      ) : (
        <ul className="divide-y rounded-lg border bg-white shadow-sm">
          {producoes.map((p) => (
            <li key={p.id} className="space-y-1 p-4">
              <div className="flex items-baseline justify-between gap-3">
                <p className="font-medium">
                  <span className="mr-2 text-sm font-normal text-muted-foreground">{dataBr(p.data)}</span>
                  <span className="mr-2 rounded-full bg-[#684A97]/10 px-2 py-0.5 text-xs font-medium text-[#684A97]">
                    {TIPO_PRODUCAO[p.tipo]}
                  </span>
                  {p.titulo}
                </p>
                {podeEditar(p) && <Editar href={`${LISTA}?parte=producoes&id=${p.id}`} />}
              </div>
              <p className="text-sm">{p.autores}</p>
              {(p.onde || p.link) && (
                <p className="text-sm text-muted-foreground">
                  {p.onde}
                  {p.onde && p.link && " · "}
                  {p.link && (
                    <a href={p.link} target="_blank" rel="noopener noreferrer" className="text-[#684A97] hover:underline">
                      Abrir link
                    </a>
                  )}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
