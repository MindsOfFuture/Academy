import Link from "next/link";
import { getHero } from "@/lib/api/content";
import { getIndicadores } from "@/lib/api/gestao/indicators";
import { listarPendencias } from "@/lib/api/gestao/pendencias";
import type { Pendencia } from "@/lib/api/gestao/types";
import { exigirMembro } from "./guard";
import { FormNumerosDoSite } from "./numeros-do-site";

/**
 * Tela "Hoje" do módulo de gestão (spec 003).
 *
 * Guard: `exigirMembro` (flag → login → papel), defesa em profundidade
 * (specs/constitution.md §III). Dados só por `lib/api/gestao`. O bolsista vê as
 * próprias pendências (a RLS recorta); a coordenação vê as da equipe e, embaixo,
 * os seis indicadores do convênio (spec 002) e os números da página inicial
 * (spec 019).
 */
export default async function GestaoPage() {
  const papel = await exigirMembro("/gestao");

  const coordenacao = papel === "coordenacao";
  const [pendencias, indicadores, site] = await Promise.all([
    listarPendencias(papel),
    coordenacao ? getIndicadores() : Promise.resolve(null),
    coordenacao ? getHero() : Promise.resolve(null),
  ]);

  const aFazer = pendencias.filter((p) => p.tipo !== "proxima_aula");
  const proximas = pendencias.filter((p) => p.tipo === "proxima_aula");
  const semRegistro = aFazer.filter((p) => p.tipo === "aula_sem_registro");
  const semBolsa = aFazer.filter((p) => p.tipo === "bolsista_sem_bolsa");
  const outras = aFazer.filter((p) => p.tipo !== "aula_sem_registro" && p.tipo !== "bolsista_sem_bolsa");

  return (
    <div className="space-y-8">
      {/* Números do convênio no topo: é o resumo que a coordenação abre a tela para ver */}
      {indicadores && (
        <section aria-label="Indicadores do convênio" className="space-y-3">
          <h2 className="text-xl font-semibold">Indicadores do convênio</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
            <Indicador titulo="Alunos participantes" valor={indicadores.alunos.total} />
            <Indicador titulo="Reservas de ônibus" valor={indicadores.reservasOnibus.total} />
            <Indicador
              titulo="Termos"
              valor={`${indicadores.termos.arquivados} arquivados · ${indicadores.termos.pendentes} pendentes`}
            />
            <Indicador
              titulo="Presença"
              valor={`${indicadores.presenca.presentes} presentes · ${indicadores.presenca.ausentes} ausentes`}
            />
            <Indicador titulo="Aulas realizadas" valor={indicadores.aulas.total} />
            <Indicador titulo="Alocações de bolsistas" valor={indicadores.cargaBolsistas.totalAlocacoes} />
          </div>
        </section>
      )}

      <section aria-labelledby="a-fazer" className="space-y-3">
        <h2 id="a-fazer" className="text-xl font-semibold">
          O que você tem a fazer
        </h2>
        {aFazer.length === 0 ? (
          <p className="rounded-lg border bg-white p-4 text-sm text-muted-foreground">Nada pendente agora.</p>
        ) : (
          <div className="grid items-start gap-4 lg:grid-cols-5">
            {semRegistro.length > 0 && (
              <Grupo
                titulo="Aulas sem registro"
                total={semRegistro.length}
                urgente
                className={semBolsa.length > 0 ? "lg:col-span-3" : "lg:col-span-5"}
              >
                <ListaCompacta itens={semRegistro} acao="Registrar" />
              </Grupo>
            )}
            {semBolsa.length > 0 && (
              <Grupo
                titulo="Sem bolsa vigente"
                total={semBolsa.length}
                link={{ href: "/gestao/equipe?acao=bolsa", rotulo: "Cadastrar bolsa" }}
                className={semRegistro.length > 0 ? "lg:col-span-2" : "lg:col-span-5"}
              >
                <p className="px-4 pt-3 text-sm text-muted-foreground">{semBolsa[0].detalhe}</p>
                <ul className="flex flex-wrap gap-2 p-4">
                  {semBolsa.map((p) => (
                    <li key={p.titulo}>
                      <Link
                        href="/gestao/equipe?acao=bolsa"
                        className="inline-flex min-h-11 items-center rounded-full bg-[#ECE9F3] px-3 text-sm text-[#3f2d5c] hover:bg-[#684A97]/20 md:min-h-8"
                      >
                        {p.titulo.replace(/ está sem bolsa vigente$/, "")}
                      </Link>
                    </li>
                  ))}
                </ul>
              </Grupo>
            )}
            {outras.length > 0 && (
              <Grupo titulo="Outras pendências" total={outras.length} className="lg:col-span-5">
                <ListaCompacta itens={outras} acao="Abrir" />
              </Grupo>
            )}
          </div>
        )}
      </section>

      <section aria-labelledby="proximas-aulas" className="space-y-3">
        <h2 id="proximas-aulas" className="text-xl font-semibold">
          Próximas aulas
        </h2>
        {proximas.length === 0 ? (
          <p className="rounded-lg border bg-white p-4 text-sm text-muted-foreground">Nenhuma aula agendada.</p>
        ) : (
          <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
            <ListaCompacta itens={proximas} />
          </div>
        )}
      </section>

      {site && (
        <section aria-labelledby="numeros-do-site">
          {/* Mexe-se pouco: fica recolhido para não empurrar o resto da tela */}
          <details className="group rounded-lg border bg-white shadow-sm">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 p-4 [&::-webkit-details-marker]:hidden">
              <h2 id="numeros-do-site" className="text-lg font-semibold">
                Números da página inicial
              </h2>
              <span className="text-sm font-semibold text-[#684A97]">
                <span className="group-open:hidden">Editar</span>
                <span className="hidden group-open:inline">Fechar</span>
              </span>
            </summary>
            <div className="border-t p-4">
              <FormNumerosDoSite destaques={site.destaques} />
            </div>
          </details>
        </section>
      )}
    </div>
  );
}

const VISIVEIS = 5;

/** Bloco de um tipo de pendência: título, contagem e um atalho à direita. */
function Grupo({
  titulo,
  total,
  urgente,
  link,
  className,
  children,
}: {
  titulo: string;
  total: number;
  urgente?: boolean;
  link?: { href: string; rotulo: string };
  className?: string;
  children: React.ReactNode;
}) {
  const cor = urgente ? "#E8473A" : "#684A97";
  return (
    <div className={`overflow-hidden rounded-lg border bg-white shadow-sm ${className ?? ""}`}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <span aria-hidden className="size-2 rounded-full" style={{ background: cor }} />
          <h3 className="font-semibold">{titulo}</h3>
          <span
            className="rounded-full px-2 text-sm font-bold"
            style={{ color: cor, background: `${cor}1a` }}
          >
            {total}
          </span>
        </div>
        {link && (
          <Link href={link.href} className="inline-flex min-h-11 items-center text-sm font-semibold text-[#684A97] hover:underline md:min-h-0">
            {link.rotulo} →
          </Link>
        )}
      </div>
      {children}
    </div>
  );
}

/** Uma linha por item; passa de cinco, o resto abre em "Mostrar mais". */
function ListaCompacta({ itens, acao }: { itens: Pendencia[]; acao?: string }) {
  const linha = (p: Pendencia, i: number) => (
    <li key={`${p.href}-${i}`} className="border-t first:border-t-0">
      <Link
        href={p.href}
        className="flex min-h-11 flex-wrap items-center gap-x-3 gap-y-0.5 px-4 py-2.5 text-sm hover:bg-[#684A97]/5"
      >
        <span className="font-medium">{p.titulo}</span>
        <span className="flex-1 text-muted-foreground">{p.detalhe}</span>
        {acao && <span className="font-semibold text-[#684A97]">{acao}</span>}
      </Link>
    </li>
  );
  return (
    <>
      <ul>{itens.slice(0, VISIVEIS).map(linha)}</ul>
      {itens.length > VISIVEIS && (
        <details className="group border-t">
          <summary className="flex min-h-11 cursor-pointer list-none items-center px-4 text-sm font-semibold text-[#684A97] group-open:hidden [&::-webkit-details-marker]:hidden">
            Mostrar mais {itens.length - VISIVEIS}
          </summary>
          <ul>{itens.slice(VISIVEIS).map((p, i) => linha(p, i + VISIVEIS))}</ul>
        </details>
      )}
    </>
  );
}

function Indicador({ titulo, valor }: { titulo: string; valor: string | number }) {
  return (
    <div className="rounded-lg border bg-white p-3 shadow-sm">
      <p className="text-sm text-muted-foreground">{titulo}</p>
      <p className="mt-1 text-lg font-semibold">{valor}</p>
    </div>
  );
}
