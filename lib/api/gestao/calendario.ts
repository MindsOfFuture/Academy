import "server-only";
import { usuarioDaRequisicao } from "@/lib/supabase/server";
import { listarEncontrosDoMes } from "./alocacao";
import { TIPO_ENCONTRO, type Alocacao, type Encontro } from "./types";

/**
 * Encontros do mês em .ics (iCalendar), para importar no Google Agenda. Sai o
 * que a pessoa vê: a RLS recorta, e `meus` deixa só os encontros em que ela
 * está (alocada ou cobrindo, sem falta nem substituição).
 */

export async function encontrosParaAgenda(mes: string, filtro: { espacoId?: string; meus: boolean }): Promise<Encontro[]> {
  let encontros = await listarEncontrosDoMes(mes);
  if (filtro.espacoId) encontros = encontros.filter((e) => e.espacoId === filtro.espacoId);
  if (filtro.meus) {
    const eu = await usuarioDaRequisicao();
    if (!eu) throw new Error("gestao: usuário não autenticado");
    encontros = encontros.filter((e) => e.alocacoes.some((a) => estaNoEncontro(a, eu)));
  }
  return encontros;
}

/** Vai estar lá: alocada (sem ser coberta inteira) ou cobrindo alguém. */
export function estaNoEncontro(a: Alocacao, pessoa: string): boolean {
  if (a.cobertoPor === pessoa) return a.situacao !== "substituida" && a.situacao !== "retirada";
  if (a.bolsistaId !== pessoa) return false;
  return (a.situacao === "prevista" || a.situacao === "cumprida") && !(a.cobertoPor && a.inicio === null);
}

const FUSO = "America/Sao_Paulo";

/** Texto de propriedade: barra, ponto e vírgula, vírgula e quebra de linha escapados. */
function texto(valor: string): string {
  return valor.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r\n|\r|\n/g, "\\n");
}

/** Linhas de no máximo 75 bytes, as seguintes começando com espaço (RFC 5545 §3.1). */
function dobrar(linha: string): string {
  const partes: string[] = [];
  let atual = "";
  let bytes = 0;
  for (const c of linha) {
    const n = Buffer.byteLength(c);
    if (bytes + n > (partes.length ? 74 : 75)) {
      partes.push(atual);
      atual = "";
      bytes = 0;
    }
    atual += c;
    bytes += n;
  }
  partes.push(atual);
  return partes.join("\r\n ");
}

const dia = (iso: string) => iso.replace(/-/g, "");
const hora = (hhmm: string) => `${hhmm.replace(":", "")}00`;

function diaSeguinte(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

function evento(e: Encontro, carimbo: string): string[] {
  const titulo = [e.modalidade, e.numeroAula !== null ? `Aula ${e.numeroAula}` : null, e.turmaNome].filter(Boolean).join(" · ");
  const local = [e.escolaNome, e.espacoNome].filter(Boolean).join(" · ");
  const equipe = e.alocacoes
    .filter((a) => a.situacao !== "substituida" && a.situacao !== "retirada")
    .map((a) => a.bolsistaNome);
  const descricao = [
    e.tipo !== "aula" ? TIPO_ENCONTRO[e.tipo] : null,
    e.descricao && e.descricao !== e.modalidade ? e.descricao : null,
    equipe.length ? `Equipe: ${equipe.join(", ")}` : null,
  ].filter(Boolean).join("\n");
  const quando =
    e.inicio && e.fim
      ? [`DTSTART;TZID=${FUSO}:${dia(e.data)}T${hora(e.inicio)}`, `DTEND;TZID=${FUSO}:${dia(e.data)}T${hora(e.fim)}`]
      : [`DTSTART;VALUE=DATE:${dia(e.data)}`, `DTEND;VALUE=DATE:${dia(diaSeguinte(e.data))}`];
  return [
    "BEGIN:VEVENT",
    // UID fixo: importar de novo atualiza o evento em vez de duplicar.
    `UID:${e.id}@gestao.minds`,
    `DTSTAMP:${carimbo}`,
    ...quando,
    // Cancelado sai como cancelado: reimportar tira o evento que já estava na agenda.
    ...(e.canceladoEm || e.turmaStatus === "nao_abriu" ? ["STATUS:CANCELLED"] : []),
    `SUMMARY:${texto(titulo)}`,
    ...(local ? [`LOCATION:${texto(local)}`] : []),
    ...(descricao ? [`DESCRIPTION:${texto(descricao)}`] : []),
    "END:VEVENT",
  ];
}

/** Calendário com os encontros do mês; cancelado e de turma que não abriu vão como cancelados. */
export function calendarioIcs(encontros: Encontro[], agora = new Date()): string {
  const carimbo = agora.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const linhas = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Minds of the Future//Gestao//PT-BR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    // Brasília sem horário de verão desde 2019: um fuso fixo basta.
    "BEGIN:VTIMEZONE",
    `TZID:${FUSO}`,
    "BEGIN:STANDARD",
    "DTSTART:19700101T000000",
    "TZOFFSETFROM:-0300",
    "TZOFFSETTO:-0300",
    "TZNAME:-03",
    "END:STANDARD",
    "END:VTIMEZONE",
    ...encontros.flatMap((e) => evento(e, carimbo)),
    "END:VCALENDAR",
  ];
  return linhas.map(dobrar).join("\r\n") + "\r\n";
}
