import { beforeEach, describe, expect, it, vi } from "vitest";

const { createClient } = vi.hoisted(() => ({ createClient: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient }));

import {
  aggregateLearningEvents,
  getLearningAnalytics,
  type LearningEventRow,
  type LearningEventSnapshotEnvelope,
} from "@/lib/api/learning-analytics";

const COURSE = "123e4567-e89b-42d3-a456-426614174000";
const LESSON = "223e4567-e89b-42d3-a456-426614174000";

function row(eventName: LearningEventRow["event_name"], user: string, minute: number, extra: Partial<LearningEventRow> = {}): LearningEventRow {
  return {
    event_id: `${minute}`,
    occurred_at: `2026-09-02T12:${String(minute).padStart(2, "0")}:00.000Z`,
    received_at: `2026-09-02T12:${String(minute).padStart(2, "0")}:01.000Z`,
    user_id: user,
    session_id: `session-${user}`,
    event_name: eventName,
    route: "/course",
    learning_path_id: null,
    course_id: COURSE,
    lesson_id: null,
    activity_id: null,
    metadata: {},
    ...extra,
  };
}

function mockRpc(result: { data: LearningEventSnapshotEnvelope | null; error: { message: string } | null }) {
  const rpc = vi.fn().mockResolvedValue(result);
  const getUser = vi.fn().mockResolvedValue({ data: { user: { id: "admin-1" } }, error: null });
  createClient.mockResolvedValue({ auth: { getUser }, rpc });
  return { getUser, rpc };
}

describe("aggregateLearningEvents", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("agrega fixture não vazia e calcula manualmente o funil por usuários únicos", () => {
    const rows: LearningEventRow[] = [
      row("session_started", "u1", 0),
      row("course_opened", "u1", 1),
      row("course_enrolled", "u1", 2),
      row("lesson_opened", "u1", 3, { lesson_id: LESSON }),
      row("lesson_completed", "u1", 4, { lesson_id: LESSON }),
      row("certificate_generated", "u1", 5),
      row("course_opened", "u2", 6),
      row("resource_opened", "u2", 7, { lesson_id: LESSON, metadata: { resourceType: "link" } }),
    ];

    const result = aggregateLearningEvents(rows);
    expect(result.totalInteractions).toBe(8);
    expect(result.activeStudents).toBe(2);
    expect(result.sessions).toBe(2);
    expect(result.dailyInteractions).toEqual([{ day: "2026-09-02", interactions: 8 }]);
    expect(result.funnel.map((step) => step.students)).toEqual([2, 1, 1, 1, 1]);
    expect(result.topCourses[0]).toEqual({ id: COURSE, accesses: 2 });
    expect(result.topResources[0]).toEqual({ id: LESSON, accesses: 1 });
    expect(result.lastEventAt).toBe("2026-09-02T12:07:01.000Z");
    expect(result.recentActivity).toHaveLength(8);
    expect(result.recentActivity[0]).not.toHaveProperty("event_id");
    expect(result.recentActivity[0]).not.toHaveProperty("user_id");
    expect(result.recentActivity[0]).not.toHaveProperty("session_id");
    expect(result.recentActivity[0]).not.toHaveProperty("metadata");
  });

  it("não produz hollow pass para fixture vazia", () => {
    const result = aggregateLearningEvents([]);
    expect(result.hasData).toBe(false);
    expect(result.totalInteractions).toBe(0);
    expect(result.funnel.every((step) => step.students === 0)).toBe(true);
  });

  it("não conta professor ou administrador como aluno ativo no funil", () => {
    const result = aggregateLearningEvents([
      row("course_opened", "student-1", 1),
      row("course_opened", "teacher-1", 2),
    ], new Set(["student-1"]));

    expect(result.totalInteractions).toBe(2);
    expect(result.activeStudents).toBe(1);
    expect(result.funnel[0].students).toBe(1);
  });

  it("coleta o snapshot com uma única RPC autenticada e agrega o envelope exato", async () => {
    const { rpc } = mockRpc({
      data: {
        overflow: false,
        events: [row("course_opened", "student-1", 1), row("course_opened", "admin-1", 2)],
        student_user_ids: ["student-1"],
      },
      error: null,
    });

    const result = await getLearningAnalytics({
      scope: "course",
      id: COURSE,
      from: "2026-09-01T00:00:00.000Z",
      to: "2026-09-03T00:00:00.000Z",
    });

    expect(rpc).toHaveBeenCalledTimes(1);
    expect(rpc).toHaveBeenCalledWith("collect_learning_analytics_snapshot", {
      p_scope: "course",
      p_id: COURSE,
      p_from: "2026-09-01T00:00:00.000Z",
      p_to: "2026-09-03T00:00:00.000Z",
      p_limit: 100_000,
    });
    expect(result.totalInteractions).toBe(2);
    expect(result.activeStudents).toBe(1);
    expect(result.funnel[0].students).toBe(1);
  });

  it("envia nulo para escopo global sem id e sem período", async () => {
    const { rpc } = mockRpc({
      data: { overflow: false, events: [], student_user_ids: [] },
      error: null,
    });

    const result = await getLearningAnalytics({ scope: "global" });

    expect(rpc).toHaveBeenCalledTimes(1);
    expect(rpc).toHaveBeenCalledWith("collect_learning_analytics_snapshot", {
      p_scope: "global",
      p_id: null,
      p_from: null,
      p_to: null,
      p_limit: 100_000,
    });
    expect(result.hasData).toBe(false);
  });

  it("falha explicitamente quando o volume ultrapassa o teto seguro", async () => {
    const { rpc } = mockRpc({
      data: { overflow: true, events: [], student_user_ids: [] },
      error: null,
    });

    await expect(getLearningAnalytics({ scope: "global" })).rejects.toThrow(/100 mil eventos/);
    expect(rpc).toHaveBeenCalledTimes(1);
  });

  it("nega usuário sem sessão antes de chamar a RPC administrativa", async () => {
    const { getUser, rpc } = mockRpc({
      data: { overflow: false, events: [], student_user_ids: [] },
      error: null,
    });
    getUser.mockResolvedValue({ data: { user: null }, error: null });

    await expect(getLearningAnalytics({ scope: "global" }))
      .rejects.toThrow("Usuário não autenticado.");
    expect(rpc).not.toHaveBeenCalled();
  });

  it("propaga a negação vinda do banco sem expor linhas cruas", async () => {
    mockRpc({ data: null, error: { message: "Acesso negado. Permissões de administrador necessárias." } });

    await expect(getLearningAnalytics({ scope: "global" }))
      .rejects.toThrow("Acesso negado. Permissões de administrador necessárias.");
  });

  it("falha quando a RPC devolve envelope vazio", async () => {
    mockRpc({ data: null, error: null });

    await expect(getLearningAnalytics({ scope: "global" })).rejects.toThrow(/Snapshot de telemetria indisponível/);
  });
});
