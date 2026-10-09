import type { Alocacao, Encontro } from "@/lib/api/gestao/types";
import { SITUACAO } from "./rotulos";

/**
 * Peças da página do encontro usadas pela coordenação (`/gestao/alocacao/[id]`)
 * e pelo bolsista (`/gestao/encontro/[id]`, só leitura — spec 016).
 */

export function dataHoraBr(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(iso));
}

/** Concluir só depois da hora de início (decisão 10 da spec 014), no horário de Brasília. */
export function jaComecou(encontro: Encontro): boolean {
  const agora = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date()); // "2026-10-05 13:00"
  return `${encontro.data} ${encontro.inicio ?? "00:00"}` <= agora;
}

export function Resumo({ a }: { a: Alocacao }) {
  return (
    <p className="text-sm">
      <span className="font-medium">{a.bolsistaNome}</span>
      {a.gestor && (
        <span className="ml-1 rounded-full bg-[#684A97]/10 px-2 py-0.5 text-xs font-medium text-[#684A97]">gestor</span>
      )}{" "}
      · {SITUACAO[a.situacao]}
      {a.inicio && ` · das ${a.inicio} às ${a.fim}`}
      {a.cobertoPorNome &&
        (a.situacao === "substituida" ? ` · substituída por ${a.cobertoPorNome}` : ` · coberta por ${a.cobertoPorNome}`)}
      {a.motivo && <span className="block text-muted-foreground">{a.motivo}</span>}
    </p>
  );
}

export function Relatorio({ encontro }: { encontro: Encontro }) {
  if (!encontro.concluidoEm && !encontro.relatorio) return null;
  return (
    <div className="space-y-1 rounded-md bg-green-50 p-3 text-sm text-green-900">
      {encontro.concluidoEm && <p className="font-medium">Concluído em {dataHoraBr(encontro.concluidoEm)}.</p>}
      {encontro.relatorio && <p className="whitespace-pre-line">{encontro.relatorio}</p>}
    </div>
  );
}
