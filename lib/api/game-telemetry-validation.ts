// ============================================================
// Validação do lote de respostas de jogo recebido do navegador
// O servidor não confia no cliente: tudo que chega é conferido campo a campo
// antes de virar linha de banco.
// ============================================================

import {
  GAME_ANSWER_KINDS,
  GAME_KEYS,
  type GameAnswerInput,
  type GameAnswerKind,
  type GameEventBatch,
  type GameKey,
  type GameSessionInput,
} from "./game-telemetry-types";

export const MAX_GAME_SESSIONS_PER_BATCH = 10;
export const MAX_GAME_ANSWERS_PER_BATCH = 40;
export const MAX_ANSWER_TEXT_LENGTH = 400;
export const MAX_SUMMARY_BYTES = 2048;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const KEY_PATTERN = /^[a-z0-9_-]{1,40}$/;
const QUESTION_KEY_PATTERN = /^[a-zA-Z0-9_.-]{1,60}$/;
const CONTENT_VERSION_PATTERN = /^[a-zA-Z0-9._-]{1,40}$/;
// A opção escolhida é gravada como o aluno a viu na tela, acento incluído —
// "Meio período" precisa chegar legível a quem for ler a planilha depois.
const ANSWER_KEY_PATTERN = /^[\p{L}\p{N} _.,;:!?()[\]+%/&'ºª-]{1,120}$/u;

/**
 * Perguntas que pedem identificação direta nunca entram no acervo, mesmo que o
 * navegador insista em mandá-las. A pesquisa quer a decisão, não quem decidiu.
 */
const BANNED_QUESTION_KEY = /(nome|name|email|e-mail|cpf|rg|telefone|phone|endereco|endereço|address|whats|matricula|matrícula|responsavel|responsável)/i;

/** Marcas de identificação direta em texto aberto: bloqueiam a resposta inteira. */
const DIRECT_IDENTIFIER = /([\w.+-]+@[\w-]+\.[\w.]+|\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b|\b\(?\d{2}\)?\s?9?\d{4}-?\d{4}\b)/;

const GAME_KEY_SET = new Set<string>(GAME_KEYS);
const ANSWER_KIND_SET = new Set<string>(GAME_ANSWER_KINDS);
const OUTCOME_SET = new Set(["correct", "partial", "wrong"]);
const STATUS_SET = new Set(["em_andamento", "concluida"]);

const SESSION_KEYS = new Set([
  "id", "gameKey", "contentVersion", "scopeKey", "clientSessionId", "startedAt",
  "finishedAt", "status", "answeredCount", "score", "maxScore", "outcomeKey",
  "durationSeconds", "deviceInfo", "summary",
]);
const ANSWER_KEYS = new Set([
  "id", "sessionId", "gameKey", "contentVersion", "scopeKey", "stepIndex",
  "questionKey", "answerKind", "answerKey", "answerKeys", "answerNumber",
  "answerText", "outcome", "points", "elapsedMs", "answeredAt",
]);

function fail(message: string): never {
  throw new Error(`Payload de jogo inválido: ${message}`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireUuid(value: unknown, field: string): string {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) fail(`${field} deve ser UUID.`);
  return value;
}

function requireIsoDate(value: unknown, field: string): string {
  if (typeof value !== "string" || Number.isNaN(Date.parse(value))) fail(`${field} inválido.`);
  return new Date(value as string).toISOString();
}

function optionalIsoDate(value: unknown, field: string): string | undefined {
  return value === undefined || value === null ? undefined : requireIsoDate(value, field);
}

function requireGameKey(value: unknown): GameKey {
  if (typeof value !== "string" || !GAME_KEY_SET.has(value)) fail("jogo fora do catálogo.");
  return value as GameKey;
}

function requireContentVersion(value: unknown): string {
  if (typeof value !== "string" || !CONTENT_VERSION_PATTERN.test(value)) {
    fail("contentVersion inválida.");
  }
  return value;
}

function optionalScopeKey(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string" || !KEY_PATTERN.test(value)) fail("scopeKey inválida.");
  return value;
}

function requireInteger(value: unknown, field: string, min: number, max: number): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < min || value > max) {
    fail(`${field} deve ser inteiro entre ${min} e ${max}.`);
  }
  return value;
}

function optionalInteger(value: unknown, field: string, min: number, max: number): number | undefined {
  return value === undefined || value === null ? undefined : requireInteger(value, field, min, max);
}

function validateSummary(value: unknown): Record<string, string | number | boolean> {
  if (value === undefined || value === null) return {};
  if (!isRecord(value)) fail("summary deve ser um objeto.");
  if (new TextEncoder().encode(JSON.stringify(value)).length > MAX_SUMMARY_BYTES) {
    fail("summary excede 2 KB.");
  }
  const result: Record<string, string | number | boolean> = {};
  for (const [key, item] of Object.entries(value)) {
    if (!KEY_PATTERN.test(key)) fail(`chave inválida em summary: ${key}.`);
    if (BANNED_QUESTION_KEY.test(key)) fail(`campo proibido em summary: ${key}.`);
    if (typeof item === "string") {
      if (item.length > 120) fail(`valor muito longo em summary: ${key}.`);
      if (DIRECT_IDENTIFIER.test(item)) fail(`identificação direta em summary: ${key}.`);
      result[key] = item;
    } else if (typeof item === "number") {
      if (!Number.isFinite(item)) fail(`número inválido em summary: ${key}.`);
      result[key] = item;
    } else if (typeof item === "boolean") {
      result[key] = item;
    } else {
      fail(`tipo não suportado em summary: ${key}.`);
    }
  }
  return result;
}

function validateDeviceInfo(value: unknown): GameSessionInput["deviceInfo"] {
  if (value === undefined || value === null) return undefined;
  if (!isRecord(value)) fail("deviceInfo deve ser um objeto.");
  const width = requireInteger(value.viewportWidth, "viewportWidth", 0, 20000);
  const height = requireInteger(value.viewportHeight, "viewportHeight", 0, 20000);
  const language = value.browserLanguage;
  if (typeof language !== "string" || language.length > 20) fail("browserLanguage inválido.");
  return { viewportWidth: width, viewportHeight: height, browserLanguage: language };
}

function validateSession(value: unknown): GameSessionInput {
  if (!isRecord(value)) fail("partida deve ser um objeto.");
  for (const key of Object.keys(value)) {
    if (!SESSION_KEYS.has(key)) fail(`campo não permitido em partida: ${key}.`);
  }
  const status = String(value.status ?? "em_andamento");
  if (!STATUS_SET.has(status)) fail("status de partida inválido.");
  const finishedAt = optionalIsoDate(value.finishedAt, "finishedAt");
  if ((status === "concluida") !== Boolean(finishedAt)) {
    fail("partida concluída precisa de finishedAt, e só ela.");
  }

  const session: GameSessionInput = {
    id: requireUuid(value.id, "id da partida"),
    gameKey: requireGameKey(value.gameKey),
    contentVersion: requireContentVersion(value.contentVersion),
    clientSessionId: requireUuid(value.clientSessionId, "clientSessionId"),
    startedAt: requireIsoDate(value.startedAt, "startedAt"),
    status: status as GameSessionInput["status"],
    answeredCount: requireInteger(value.answeredCount, "answeredCount", 0, 500),
    summary: validateSummary(value.summary),
  };
  const scopeKey = optionalScopeKey(value.scopeKey);
  if (scopeKey) session.scopeKey = scopeKey;
  if (finishedAt) session.finishedAt = finishedAt;

  const score = optionalInteger(value.score, "score", -100000, 100000);
  if (score !== undefined) session.score = score;
  const maxScore = optionalInteger(value.maxScore, "maxScore", 0, 100000);
  if (maxScore !== undefined) session.maxScore = maxScore;
  const duration = optionalInteger(value.durationSeconds, "durationSeconds", 0, 86400);
  if (duration !== undefined) session.durationSeconds = duration;
  if (value.outcomeKey !== undefined && value.outcomeKey !== null) {
    const outcomeKey = String(value.outcomeKey);
    if (!KEY_PATTERN.test(outcomeKey)) fail("outcomeKey inválida.");
    session.outcomeKey = outcomeKey;
  }
  const deviceInfo = validateDeviceInfo(value.deviceInfo);
  if (deviceInfo) session.deviceInfo = deviceInfo;

  return session;
}

function validateAnswer(value: unknown, allowText: boolean): GameAnswerInput {
  if (!isRecord(value)) fail("resposta deve ser um objeto.");
  for (const key of Object.keys(value)) {
    if (!ANSWER_KEYS.has(key)) fail(`campo não permitido em resposta: ${key}.`);
  }

  const questionKey = String(value.questionKey ?? "");
  if (!QUESTION_KEY_PATTERN.test(questionKey)) fail("questionKey inválida.");
  if (BANNED_QUESTION_KEY.test(questionKey)) fail(`pergunta de identificação não é registrada: ${questionKey}.`);

  const answerKind = String(value.answerKind ?? "");
  if (!ANSWER_KIND_SET.has(answerKind)) fail("answerKind fora do catálogo.");

  const answer: GameAnswerInput = {
    id: requireUuid(value.id, "id da resposta"),
    sessionId: requireUuid(value.sessionId, "sessionId"),
    gameKey: requireGameKey(value.gameKey),
    contentVersion: requireContentVersion(value.contentVersion),
    stepIndex: requireInteger(value.stepIndex, "stepIndex", 0, 500),
    questionKey,
    answerKind: answerKind as GameAnswerKind,
    answeredAt: requireIsoDate(value.answeredAt, "answeredAt"),
  };
  const scopeKey = optionalScopeKey(value.scopeKey);
  if (scopeKey) answer.scopeKey = scopeKey;

  if (value.answerKey !== undefined && value.answerKey !== null) {
    const answerKey = String(value.answerKey);
    if (!ANSWER_KEY_PATTERN.test(answerKey)) fail("answerKey inválida.");
    if (DIRECT_IDENTIFIER.test(answerKey)) fail("answerKey contém identificação direta.");
    answer.answerKey = answerKey;
  }
  if (value.answerKeys !== undefined && value.answerKeys !== null) {
    if (!Array.isArray(value.answerKeys) || value.answerKeys.length > 30) fail("answerKeys inválida.");
    answer.answerKeys = value.answerKeys.map((item) => {
      const key = String(item);
      if (!ANSWER_KEY_PATTERN.test(key)) fail("item inválido em answerKeys.");
      if (DIRECT_IDENTIFIER.test(key)) fail("answerKeys contém identificação direta.");
      return key;
    });
  }
  if (value.answerNumber !== undefined && value.answerNumber !== null) {
    const number = value.answerNumber;
    if (typeof number !== "number" || !Number.isFinite(number) || Math.abs(number) > 1e9) {
      fail("answerNumber inválido.");
    }
    answer.answerNumber = number;
  }
  if (value.answerText !== undefined && value.answerText !== null) {
    if (answer.answerKind !== "texto") fail("answerText só é aceito em resposta de texto.");
    const text = String(value.answerText).trim();
    if (text.length > MAX_ANSWER_TEXT_LENGTH) fail("answerText excede o limite.");
    if (DIRECT_IDENTIFIER.test(text)) fail("answerText contém identificação direta.");
    if (allowText && text.length > 0) answer.answerText = text;
  }
  if (value.outcome !== undefined && value.outcome !== null) {
    const outcome = String(value.outcome);
    if (!OUTCOME_SET.has(outcome)) fail("outcome fora do catálogo.");
    answer.outcome = outcome as GameAnswerInput["outcome"];
  }
  const points = optionalInteger(value.points, "points", -1000, 1000);
  if (points !== undefined) answer.points = points;
  const elapsed = optionalInteger(value.elapsedMs, "elapsedMs", 0, 3600000);
  if (elapsed !== undefined) answer.elapsedMs = elapsed;

  const hasValue = answer.answerKey !== undefined
    || answer.answerKeys !== undefined
    || answer.answerNumber !== undefined
    || answer.answerText !== undefined;
  if (!hasValue) {
    // Texto aberto descartado pela configuração não vira linha vazia no acervo.
    if (answer.answerKind === "texto") fail("resposta de texto sem conteúdo registrável.");
    fail("resposta sem valor.");
  }

  return answer;
}

export function validateGameEventBatch(input: unknown, allowText: boolean): GameEventBatch {
  if (!isRecord(input) || Object.keys(input).some((key) => key !== "sessions" && key !== "answers")) {
    fail("o corpo deve conter somente sessions e answers.");
  }
  const rawSessions = input.sessions ?? [];
  const rawAnswers = input.answers ?? [];
  if (!Array.isArray(rawSessions) || !Array.isArray(rawAnswers)) fail("sessions e answers devem ser listas.");
  if (rawSessions.length === 0 && rawAnswers.length === 0) fail("lote vazio.");
  if (rawSessions.length > MAX_GAME_SESSIONS_PER_BATCH) {
    fail(`lote aceita no máximo ${MAX_GAME_SESSIONS_PER_BATCH} partidas.`);
  }
  if (rawAnswers.length > MAX_GAME_ANSWERS_PER_BATCH) {
    fail(`lote aceita no máximo ${MAX_GAME_ANSWERS_PER_BATCH} respostas.`);
  }

  const sessions = rawSessions.map(validateSession);
  const answers = rawAnswers.map((item) => validateAnswer(item, allowText));

  // Resposta sem a partida no mesmo lote seria descartada silenciosamente pelo
  // banco; recusar aqui deixa o erro visível a quem está integrando.
  const sessionIds = new Set(sessions.map((session) => session.id));
  for (const answer of answers) {
    if (!sessionIds.has(answer.sessionId)) {
      fail("toda resposta precisa vir acompanhada da sua partida no mesmo lote.");
    }
  }

  return { sessions, answers };
}
