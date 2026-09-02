import {
  LEARNING_EVENT_NAMES,
  type LearningEventInput,
  type LearningEventName,
} from "./telemetry-types";

export const MAX_TELEMETRY_BATCH_SIZE = 20;
export const MAX_TELEMETRY_METADATA_BYTES = 2048;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EVENT_NAMES = new Set<string>(LEARNING_EVENT_NAMES);
const EVENT_KEYS = new Set([
  "eventId", "occurredAt", "sessionId", "eventName", "route",
  "learningPathId", "courseId", "lessonId", "activityId", "metadata",
]);
const BANNED_METADATA_KEY = /(name|nome|email|e-mail|cpf|document|phone|telefone|ip|referrer|query|hash|selector|seletor|user.?agent|message|mensagem|content|conteudo|conteúdo|answer|resposta|file|arquivo|comment|comentario|comentário)/i;

const METADATA_RULES: Record<LearningEventName, Record<string, readonly (string | number | boolean)[]>> = {
  session_started: {},
  page_viewed: {},
  learning_path_opened: {},
  course_opened: {},
  course_enrolled: {},
  lesson_opened: {},
  resource_opened: { resourceType: ["video", "link", "arquivo", "outro"] },
  lesson_completed: {},
  lesson_uncompleted: {},
  assignment_opened: {},
  assignment_submitted: { submissionKind: ["nova", "atualizacao"] },
  chat_message_sent: { senderRole: ["student", "teacher", "admin"] },
  certificate_generated: { source: ["emissao"] },
};

const REQUIRED_CONTEXT: Partial<Record<LearningEventName, readonly (keyof LearningEventInput)[]>> = {
  learning_path_opened: ["learningPathId"],
  course_opened: ["courseId"],
  course_enrolled: ["courseId"],
  lesson_opened: ["courseId", "lessonId"],
  resource_opened: ["courseId", "lessonId"],
  lesson_completed: ["courseId", "lessonId"],
  lesson_uncompleted: ["courseId", "lessonId"],
  assignment_opened: ["activityId"],
  assignment_submitted: ["activityId"],
  chat_message_sent: ["activityId"],
  certificate_generated: ["courseId"],
};

function fail(message: string): never {
  throw new Error(`Payload de telemetria inválido: ${message}`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function normalizeTelemetryRoute(value: string): string {
  if (!value.startsWith("/") || value.includes("?") || value.includes("#") || value.length > 256) {
    fail("a rota deve conter somente um pathname.");
  }
  const normalized = value.replace(/\/{2,}/g, "/").replace(/\/$/, "") || "/";
  if (normalized !== value) fail("a rota deve estar normalizada.");
  return normalized;
}

function validateMetadata(eventName: LearningEventName, value: unknown) {
  const metadata = value === undefined ? {} : value;
  if (!isRecord(metadata)) fail("metadata deve ser um objeto.");
  if (new TextEncoder().encode(JSON.stringify(metadata)).length > MAX_TELEMETRY_METADATA_BYTES) {
    fail("metadata excede 2 KB.");
  }
  const rules = METADATA_RULES[eventName];
  for (const [key, item] of Object.entries(metadata)) {
    if (BANNED_METADATA_KEY.test(key)) fail(`campo proibido em metadata: ${key}.`);
    const accepted = rules[key];
    if (!accepted || !accepted.includes(item as never)) fail(`campo não permitido em metadata: ${key}.`);
  }
  for (const requiredKey of Object.keys(rules)) {
    if (!(requiredKey in metadata)) fail(`campo obrigatório ausente em metadata: ${requiredKey}.`);
  }
  return metadata as LearningEventInput["metadata"];
}

function validateEvent(value: unknown): LearningEventInput {
  if (!isRecord(value)) fail("evento deve ser um objeto.");
  for (const key of Object.keys(value)) {
    if (!EVENT_KEYS.has(key)) fail(`campo não permitido: ${key}.`);
  }
  if (!UUID_PATTERN.test(String(value.eventId ?? ""))) fail("eventId deve ser UUID.");
  if (!UUID_PATTERN.test(String(value.sessionId ?? ""))) fail("sessionId deve ser UUID.");
  if (!EVENT_NAMES.has(String(value.eventName ?? ""))) fail("evento fora do catálogo.");
  if (typeof value.occurredAt !== "string" || Number.isNaN(Date.parse(value.occurredAt))) fail("occurredAt inválido.");
  if (typeof value.route !== "string") fail("route inválida.");

  const eventName = value.eventName as LearningEventName;
  const result: LearningEventInput = {
    eventId: value.eventId as string,
    occurredAt: new Date(value.occurredAt).toISOString(),
    sessionId: value.sessionId as string,
    eventName,
    route: normalizeTelemetryRoute(value.route),
    metadata: validateMetadata(eventName, value.metadata),
  };
  for (const key of ["learningPathId", "courseId", "lessonId", "activityId"] as const) {
    const item = value[key];
    if (item !== undefined) {
      if (typeof item !== "string" || !UUID_PATTERN.test(item)) fail(`${key} deve ser UUID.`);
      result[key] = item;
    }
  }
  for (const key of REQUIRED_CONTEXT[eventName] ?? []) {
    if (!result[key]) fail(`${String(key)} é obrigatório para ${eventName}.`);
  }
  return result;
}

export function validateLearningEventBatch(input: unknown): LearningEventInput[] {
  if (!isRecord(input) || Object.keys(input).some((key) => key !== "events") || !Array.isArray(input.events)) {
    fail("o corpo deve conter somente events.");
  }
  if (input.events.length < 1 || input.events.length > MAX_TELEMETRY_BATCH_SIZE) {
    fail(`lote deve conter entre 1 e ${MAX_TELEMETRY_BATCH_SIZE} eventos.`);
  }
  return input.events.map(validateEvent);
}