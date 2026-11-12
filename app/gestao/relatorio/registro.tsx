import type { ReactNode } from "react";
import Link from "next/link";
import type { AtividadeRelatorio, EncontroDoRelatorio } from "@/lib/api/gestao/types";
import { TIPO_ENCONTRO, diaCurto, horasTexto } from "../alocacao/rotulos";
import { Comprovacao } from "./forms";

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
  children,
}: {
  encontros: EncontroDoRelatorio[];
  atividades: AtividadeRelatorio[];
  /** "seu" na própria aba; na janela da coordenação, "do bolsista". */
  vazio?: string;
  /** Troca o texto da atividade (na aba Relatório em mês aberto, por editar/apagar). */
  linhaAtividade?: (a: AtividadeRelatorio) => ReactNode;
  /** Embaixo do encontro (o link de comprovação, na aba Relatório). */
  linhaEncontro?: (e: EncontroDoRelatorio) => ReactNode;
  /** Embaixo das outras atividades (o formulário, na aba Relatório). */
  children?: ReactNode;
}) {
  const totalHoras = encontros.reduce((soma, e) => soma + e.horas, 0);
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
              {linhaAtividade ? (
                linhaAtividade(a)
              ) : (
                <>
                  <p>
                    <span className="text-sm text-muted-foreground">{diaCurto(a.data)}</span> · {a.nome}
                  </p>
                  <Comprovacao texto={a.comprovacao} />
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
