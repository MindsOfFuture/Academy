import { describe, expect, it } from "vitest";
import {
  MAX_TELEMETRY_BATCH_SIZE,
  validateLearningEventBatch,
} from "@/lib/api/telemetry-validation";

const UUID = "123e4567-e89b-42d3-a456-426614174000";

function event(overrides: Record<string, unknown> = {}) {
  return {
    eventId: UUID,
    occurredAt: "2026-09-02T12:00:00.000Z",
    sessionId: "223e4567-e89b-42d3-a456-426614174000",
    eventName: "resource_opened",
    route: "/course",
    courseId: "323e4567-e89b-42d3-a456-426614174000",
    lessonId: "423e4567-e89b-42d3-a456-426614174000",
    metadata: { resourceType: "link" },
    ...overrides,
  };
}

describe("validateLearningEventBatch", () => {
  it("aceita um evento conhecido com metadados permitidos", () => {
    expect(validateLearningEventBatch({ events: [event()] })).toHaveLength(1);
  });

  it.each([
    ["evento fora do catálogo", { eventName: "button_clicked" }],
    ["identidade informada pelo cliente", { userId: UUID }],
    ["PII em metadados", { metadata: { email: "aluno@escola.br" } }],
    ["conteúdo livre", { metadata: { message: "texto do chat" } }],
    ["query string", { route: "/course?id=segredo" }],
    ["hash", { route: "/course#resposta" }],
    ["email na rota", { route: "/aluno/alice@example.com" }],
    ["CPF na rota", { route: "/aluno/12345678901" }],
    ["nome na rota", { route: "/aluno/Maria-Silva" }],
    ["segmento livre desconhecido", { route: "/course/segredo" }],
  ])("rejeita %s", (_label, overrides) => {
    expect(() => validateLearningEventBatch({ events: [event(overrides)] })).toThrow();
  });

  it("rejeita metadados acima de 2 KB", () => {
    expect(() => validateLearningEventBatch({
      events: [event({ metadata: { resourceType: "x".repeat(2100) } })],
    })).toThrow(/2 KB/);
  });

  it("rejeita metadado obrigatório ausente em evento tipado", () => {
    expect(() => validateLearningEventBatch({
      events: [event({ metadata: undefined })],
    })).toThrow(/resourceType/);
  });

  it("limita o lote", () => {
    expect(() => validateLearningEventBatch({
      events: Array.from({ length: MAX_TELEMETRY_BATCH_SIZE + 1 }, (_, index) =>
        event({ eventId: `123e4567-e89b-42d3-a456-${String(index).padStart(12, "0")}` }),
      ),
    })).toThrow(/lote/i);
  });
});
