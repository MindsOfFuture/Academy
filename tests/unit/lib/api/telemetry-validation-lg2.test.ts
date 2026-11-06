import { describe, expect, it } from "vitest";
import { validateLearningEventBatch } from "@/lib/api/telemetry-validation";
import { LEARNING_EVENT_LABELS, LEARNING_EVENT_NAMES } from "@/lib/api/telemetry-types";

function event(overrides: Record<string, unknown> = {}) {
  return {
    eventId: "123e4567-e89b-42d3-a456-426614174000",
    occurredAt: "2026-11-06T12:00:00.000Z",
    sessionId: "223e4567-e89b-42d3-a456-426614174000",
    eventName: "lg2_module_opened",
    route: "/lg2",
    metadata: { modulo: 3 },
    ...overrides,
  };
}

describe("eventos do Laboratório de Gestão", () => {
  it("estão no catálogo com rótulo em português", () => {
    expect(LEARNING_EVENT_NAMES).toEqual(expect.arrayContaining([
      "lg2_module_opened", "lg2_module_completed", "lg2_journey_completed",
    ]));
    expect(LEARNING_EVENT_LABELS.lg2_module_opened).toBe("Módulo do Lab. de Gestão aberto");
    expect(LEARNING_EVENT_LABELS.lg2_module_completed).toBe("Módulo do Lab. de Gestão concluído");
    expect(LEARNING_EVENT_LABELS.lg2_journey_completed).toBe("Jornada do Lab. de Gestão concluída");
  });

  it.each([1, 10])("aceita módulo %i aberto e concluído", (modulo) => {
    for (const eventName of ["lg2_module_opened", "lg2_module_completed"]) {
      expect(validateLearningEventBatch({ events: [event({ eventName, metadata: { modulo } })] })[0])
        .toMatchObject({ eventName, route: "/lg2", metadata: { modulo } });
    }
  });

  it("aceita a jornada concluída sem metadata", () => {
    expect(validateLearningEventBatch({
      events: [event({ eventName: "lg2_journey_completed", route: "/lg2/jornada", metadata: {} })],
    })).toHaveLength(1);
  });

  it.each([
    ["módulo 0", { metadata: { modulo: 0 } }],
    ["módulo 11", { metadata: { modulo: 11 } }],
    ["módulo em texto", { metadata: { modulo: "3" } }],
    ["módulo fracionado", { metadata: { modulo: 2.5 } }],
    ["sem módulo", { metadata: {} }],
    ["resposta junto", { metadata: { modulo: 3, resposta: "x" } }],
    ["campo extra", { metadata: { modulo: 3, turma: "a" } }],
    ["jornada com módulo", { eventName: "lg2_journey_completed", route: "/lg2/jornada", metadata: { modulo: 1 } }],
    ["rota de pasta do módulo", { route: "/lg2/turma-a/m01" }],
  ])("rejeita %s", (_nome, overrides) => {
    expect(() => validateLearningEventBatch({ events: [event(overrides)] })).toThrow();
  });
});
