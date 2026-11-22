import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import type { AtividadeRelatorio, EncontroDoRelatorio } from "@/lib/api/gestao/types";
import { TIPO_ENCONTRO, diaCurto, horasTexto } from "../alocacao/rotulos";
import { Comprovacao } from "./forms";

/** Miniatura da foto de comprovação; abre a foto inteira em outra aba. */
function Foto({ url }: { url: string | undefined }) {
  if (!url) return null;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block" aria-label="Abrir a foto de comprovação">
      <Image src={url} alt="Foto de comprovação" width={96} height={96} className="h-24 w-24 rounded-md border object-cover" />
    </a>
  );
}

/**
 * Registro de atividades de um mês: encontros e outras atividades. Usado na aba
 * Relatório (de quem está logado) e na janela da Equipe (a coordenação olhando
 * um bolsista).
 */
export function RegistroDoMes({
  encontros,
  atividades,
  vazio = "seu",
  linhaAtividade,
  linhaEncontro,
  urls = {},
  nomes = {},
  children,
}: {
  encontros: EncontroDoRelatorio[];
  atividades: AtividadeRelatorio[];
  /** "seu" na própria aba; na janela da coordenação, "do bolsista". */
  vazio?: string;
  /**
   * Troca o texto da atividade (na aba Relatório em mês aberto, por editar/apagar).
   * Recebe os detalhes já montados; null mantém a linha padrão.
   */
  linhaAtividade?: (a: AtividadeRelatorio, detalhes: ReactNode) => ReactNode;
  /** Embaixo do encontro (o link de comprovação, na aba Relatório). */
  linhaEncontro?: (e: EncontroDoRelatorio) => ReactNode;
  /** URL assinada de cada foto (fotosDoRegistro). */
  urls?: Record<string, string>;
  /** Nome de cada pessoa que participa de alguma atividade. */
  nomes?: Record<string, string>;
  /** Embaixo das outras atividades (o formulário, na aba Relatório). */
  children?: ReactNode;
}) {
  const totalHoras = encontros.reduce((soma, e) => soma + e.horas, 0);
  const detalhes = (a: AtividadeRelatorio) => (
    <>
      {a.inicio && a.fim && (
        <p className="text-sm text-muted-foreground">
          {a.inicio.slice(0, 5)} às {a.fim.slice(0, 5)}
        </p>
      )}
      {a.participantes?.length > 0 && (
        <p className="text-sm text-muted-foreground">
          Com {[a.user_profile_id, ...a.participantes].map((id) => nomes[id] ?? "Pessoa da equipe").join(", ")}
        </p>
      )}
      <Comprovacao texto={a.comprovacao} />
      {a.foto_comprovacao && <Foto url={urls[a.foto_comprovacao]} />}
    </>
  );
  return (
    <>
      <section aria-labelledby="encontros-do-mes" className="space-y-3">
        <div className="flex items-baseline justify-between gap-2">
          <h3 id="encontros-do-mes" className="text-lg font-semibold">
            Encontros ({encontros.length})
          </h3>
          <p className="text-sm font-medium tabular-nums">{horasTexto(totalHoras)} que contam</p>
        </div>
        <ul className="divide-y rounded-lg border bg-white shadow-sm">
          {encontros.map((e) => (
            <li key={`${e.encontroId}-${e.situacao}`} className="flex items-baseline justify-between gap-3 p-4">
              <div>
                <Link href={`/gestao/encontro/${e.encontroId}`} className="font-medium text-[#684A97] hover:underline">
                  {diaCurto(e.data)} · {e.horario} · {e.descricao}
                </Link>
                <p className="text-sm text-muted-foreground">
                  {[
                    e.escolaNome ?? (e.tipo !== "aula" ? TIPO_ENCONTRO[e.tipo] : "Fora de escola"),
                    e.turmaNome,
                    e.espacoNome,
                    e.situacao === "cobertura" && "cobrindo alguém",
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                {e.links.map((l) => (
                  <Comprovacao key={l} texto={l} />
                ))}
                {e.fotos?.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {e.fotos.map((f) => (
                      <Foto key={f} url={urls[f]} />
                    ))}
                  </div>
                )}
                {linhaEncontro?.(e)}
              </div>
              <p className="shrink-0 text-sm tabular-nums">{horasTexto(e.horas)}</p>
            </li>
          ))}
          {encontros.length === 0 && (
            <li className="p-4 text-sm text-muted-foreground">Nenhum encontro {vazio} neste mês.</li>
          )}
        </ul>
      </section>

      <section aria-labelledby="outras-atividades" className="space-y-3">
        <h3 id="outras-atividades" className="text-lg font-semibold">
          Outras atividades ({atividades.length})
        </h3>
        <ul className="divide-y rounded-lg border bg-white shadow-sm">
          {atividades.map((a) => (
            <li key={a.id} className="p-4">
              {linhaAtividade?.(a, detalhes(a)) ?? (
                <>
                  <p>
                    <span className="text-sm text-muted-foreground">{diaCurto(a.data)}</span> · {a.nome}
                  </p>
                  {detalhes(a)}
                </>
              )}
            </li>
          ))}
          {atividades.length === 0 && (
            <li className="p-4 text-sm text-muted-foreground">Nenhuma atividade cadastrada neste mês.</li>
          )}
        </ul>
        {children}
      </section>
    </>
  );
}
