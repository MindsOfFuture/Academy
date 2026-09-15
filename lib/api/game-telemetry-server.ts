import "server-only";

import { createClient } from "@/lib/supabase/server";
import { validateGameEventBatch } from "./game-telemetry-validation";
import type {
  GameAnswerExport,
  GameAnswerInput,
  GameKey,
  GameSessionInput,
  GameSessionSummaryRow,
} from "./game-telemetry-types";
import { GAME_KEYS } from "./game-telemetry-types";

export class GameTelemetryHttpError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
  }
}

/**
 * Guarda o texto escrito à mão pelo aluno — é ele que sustenta a leitura
 * qualitativa da pesquisa. Nasce ligado; só desliga com uma decisão explícita
 * de quem opera a plataforma. O que nunca entra, ligado ou desligado, é
 * identificação direta: e-mail, CPF e telefone são barrados na validação.
 */
export function openTextEnabled(): boolean {
  return process.env.GAME_RESEARCH_OPEN_TEXT !== "false";
}

function toSessionRow(session: GameSessionInput) {
  return {
    id: session.id,
    game_key: session.gameKey,
    content_version: session.contentVersion,
    scope_key: session.scopeKey ?? null,
    client_session_id: session.clientSessionId,
    started_at: session.startedAt,
    finished_at: session.finishedAt ?? null,
    status: session.status,
    answered_count: session.answeredCount,
    score: session.score ?? null,
    max_score: session.maxScore ?? null,
    outcome_key: session.outcomeKey ?? null,
    duration_seconds: session.durationSeconds ?? null,
    device_info: session.deviceInfo ?? {},
    summary: session.summary ?? {},
  };
}

function toAnswerRow(answer: GameAnswerInput) {
  return {
    id: answer.id,
    session_id: answer.sessionId,
    game_key: answer.gameKey,
    content_version: answer.contentVersion,
    scope_key: answer.scopeKey ?? null,
    step_index: answer.stepIndex,
    question_key: answer.questionKey,
    answer_kind: answer.answerKind,
    answer_key: answer.answerKey ?? null,
    answer_keys: answer.answerKeys ?? null,
    answer_number: answer.answerNumber ?? null,
    answer_text: answer.answerText ?? null,
    outcome: answer.outcome ?? null,
    points: answer.points ?? null,
    elapsed_ms: answer.elapsedMs ?? null,
    answered_at: answer.answeredAt,
  };
}

export async function persistGameEvents(input: unknown): Promise<{ sessions: number; answers: number }> {
  // A identidade é verificada antes da forma do lote: quem não está logado não
  // deve descobrir o formato aceito a partir das mensagens de erro.
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData?.user) {
    throw new GameTelemetryHttpError("Usuário não autenticado.", 401);
  }

  const batch = validateGameEventBatch(input, openTextEnabled());
  const { data, error } = await supabase.rpc("ingest_game_events", {
    p_sessions: batch.sessions.map(toSessionRow),
    p_answers: batch.answers.map(toAnswerRow),
  });
  if (error) throw new Error(error.message);

  const result = (data ?? {}) as { sessions?: number; answers?: number };
  return { sessions: result.sessions ?? 0, answers: result.answers ?? 0 };
}

export interface GameExportParams {
  gameKey?: GameKey;
  from?: string;
  to?: string;
  includeText?: boolean;
  limit?: number;
  offset?: number;
}

export async function exportGameAnswers(params: GameExportParams): Promise<GameAnswerExport> {
  if (params.gameKey && !GAME_KEYS.includes(params.gameKey)) {
    throw new GameTelemetryHttpError("Jogo inválido.", 400);
  }
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("export_game_answers", {
    p_game_key: params.gameKey ?? null,
    p_from: params.from ?? null,
    p_to: params.to ?? null,
    // O texto aberto acompanha a exportação por padrão; quem exporta pode pedir
    // a versão sem ele, e a plataforma pode tê-lo desligado na origem.
    p_include_text: (params.includeText ?? true) && openTextEnabled(),
    p_limit: params.limit ?? 50000,
    p_offset: params.offset ?? 0,
  });
  if (error) throw new Error(error.message);
  return data as GameAnswerExport;
}

export async function summarizeGameSessions(range: { from?: string; to?: string } = {}): Promise<GameSessionSummaryRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("summarize_game_sessions", {
    p_from: range.from ?? null,
    p_to: range.to ?? null,
  });
  if (error) throw new Error(error.message);
  return (data ?? []) as GameSessionSummaryRow[];
}

const CSV_COLUMNS = [
  "answer_id", "session_id", "user_id", "game_key", "content_version", "scope_key",
  "step_index", "question_key", "answer_kind", "answer_key", "answer_keys",
  "answer_number", "answer_text", "outcome", "points", "elapsed_ms", "answered_at",
  "session_started_at", "session_finished_at", "session_status", "session_score",
  "session_max_score", "session_outcome_key",
] as const;

function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const text = Array.isArray(value) ? value.join("|") : String(value);
  // Aspas duplas, quebra de linha, ponto e vírgula e o separador precisam de
  // cerca; o prefixo evita que a planilha leia a célula como fórmula.
  const guarded = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return /["\n\r,;]/.test(guarded) ? `"${guarded.replace(/"/g, '""')}"` : guarded;
}

/** Formato longo: uma linha por resposta, pronto para planilha ou R/Python. */
export function toCsv(rows: GameAnswerExport["rows"]): string {
  const header = CSV_COLUMNS.join(",");
  const body = rows.map((row) =>
    CSV_COLUMNS.map((column) => csvCell((row as unknown as Record<string, unknown>)[column])).join(","),
  );
  return [header, ...body].join("\r\n");
}
