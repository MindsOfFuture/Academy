import type { SituacaoAlocacao, StatusTurma } from "@/lib/api/gestao/types";

/**
 * Rótulos da alocação (spec 014). Fora de `forms.tsx` porque a página, que é
 * componente de servidor, também os lê, e valor exportado de módulo
 * "use client" chega ao servidor só como referência.
 */

export const SITUACAO: Record<SituacaoAlocacao, string> = {
  prevista: "Prevista",
  cumprida: "Cumprida",
  faltou_avisou: "Faltou avisando",
  faltou_sem_aviso: "Faltou sem avisar",
  substituida: "Substituída",
  retirada: "Retirada do encontro",
};

export const STATUS_TURMA: Record<StatusTurma, string> = {
  prevista: "Prevista",
  em_andamento: "Em andamento",
  encerrada: "Encerrada",
  nao_abriu: "Não abriu",
};

const MES = /^\d{4}-(0[1-9]|1[0-2])$/;

/** Mês da URL ("2026-10") ou o mês corrente em São Paulo. */
export function mesDaUrl(valor: string | undefined): string {
  if (valor && MES.test(valor)) return valor;
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date()).slice(0, 7);
}

export function mesVizinho(mes: string, passo: number): string {
  const [ano, m] = mes.split("-").map(Number);
  const d = new Date(Date.UTC(ano, m - 1 + passo, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function nomeDoMes(mes: string): string {
  const [ano, m] = mes.split("-").map(Number);
  const nome = new Intl.DateTimeFormat("pt-BR", { month: "long", timeZone: "UTC" }).format(new Date(Date.UTC(ano, m - 1, 1)));
  return `${nome.charAt(0).toUpperCase()}${nome.slice(1)} de ${ano}`;
}

/** "2026-10-05" → "seg 05/10". */
export function diaCurto(iso: string): string {
  const [ano, m, d] = iso.split("-").map(Number);
  const semana = new Intl.DateTimeFormat("pt-BR", { weekday: "short", timeZone: "UTC" })
    .format(new Date(Date.UTC(ano, m - 1, d)))
    .replace(".", "");
  return `${semana} ${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}`;
}

export function horasTexto(h: number): string {
  const inteiras = Math.floor(h);
  const minutos = Math.round((h - inteiras) * 60);
  return minutos ? `${inteiras}h${String(minutos).padStart(2, "0")}` : `${inteiras}h`;
}
