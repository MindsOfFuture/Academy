import { beforeEach, describe, expect, it, vi } from "vitest";

const { createAdminClient } = vi.hoisted(() => ({ createAdminClient: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createAdminClient }));

import {
  aggregateLearningEvents,
  getLearningAnalytics,
  type LearningEventRow,
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

  it("consulta o período no servidor e resolve alunos pela precedência de papéis", async () => {
    const rows = [
      row("course_opened", "student-1", 1),
      row("course_opened", "admin-1", 2),
    ];
    const telemetryQuery = {
      select: vi.fn(),
      order: vi.fn(),
      gte: vi.fn(),
      lte: vi.fn(),
      eq: vi.fn(),
      range: vi.fn().mockResolvedValue({ data: rows, error: null }),
      then: (resolve: (value: { data: LearningEventRow[]; error: null }) => unknown) =>
        Promise.resolve({ data: rows, error: null }).then(resolve),
    };
    telemetryQuery.select.mockReturnValue(telemetryQuery);
    telemetryQuery.order.mockReturnValue(telemetryQuery);
    telemetryQuery.gte.mockReturnValue(telemetryQuery);
    telemetryQuery.lte.mockReturnValue(telemetryQuery);
    telemetryQuery.eq.mockReturnValue(telemetryQuery);

    const roleLinksQuery = {
      select: vi.fn(),
      in: vi.fn().mockResolvedValue({
        data: [
          { user_profile_id: "student-1", role_id: 1 },
          { user_profile_id: "admin-1", role_id: 2 },
        ],
        error: null,
      }),
    };
    roleLinksQuery.select.mockReturnValue(roleLinksQuery);
    const rolesQuery = {
      select: vi.fn(),
      in: vi.fn().mockResolvedValue({
        data: [{ id: 1, name: "student" }, { id: 2, name: "admin" }],
        error: null,
      }),
    };
    rolesQuery.select.mockReturnValue(rolesQuery);
    const admin = {
      from: vi.fn((table: string) => {
        if (table === "telemetry_learning_event") return telemetryQuery;
        if (table === "user_role") return roleLinksQuery;
        return rolesQuery;
      }),
    };
    createAdminClient.mockResolvedValue(admin);

    const result = await getLearningAnalytics({
      scope: "course",
      id: COURSE,
      from: "2026-09-01T00:00:00.000Z",
      to: "2026-09-03T00:00:00.000Z",
    });

    expect(telemetryQuery.gte).toHaveBeenCalledWith("received_at", "2026-09-01T00:00:00.000Z");
    expect(telemetryQuery.lte).toHaveBeenCalledWith("received_at", "2026-09-03T00:00:00.000Z");
    expect(telemetryQuery.eq).toHaveBeenCalledWith("course_id", COURSE);
    expect(result.totalInteractions).toBe(2);
    expect(result.activeStudents).toBe(1);
    expect(result.funnel[0].students).toBe(1);
  });

  it("pagina mais de mil eventos sem truncar e reaplica os filtros em cada página", async () => {
    const rows = Array.from({ length: 1005 }, (_, index) => ({
      ...row("course_opened", "student-1", index % 60),
      event_id: `event-${index}`,
      received_at: new Date(Date.UTC(2026, 8, 2, 12, 0, index)).toISOString(),
    }));
    const queries: Array<{
      gte: ReturnType<typeof vi.fn>;
      lte: ReturnType<typeof vi.fn>;
      range: ReturnType<typeof vi.fn>;
    }> = [];
    const telemetryQuery = () => {
      const query = {
        select: vi.fn(),
        order: vi.fn(),
        gte: vi.fn(),
        lte: vi.fn(),
        eq: vi.fn(),
        range: vi.fn((from: number, to: number) => Promise.resolve({
          data: rows.slice(from, to + 1),
          error: null,
        })),
        then: (resolve: (value: { data: LearningEventRow[]; error: null }) => unknown) =>
          Promise.resolve({ data: rows.slice(0, 1000), error: null }).then(resolve),
      };
      query.select.mockReturnValue(query);
      query.order.mockReturnValue(query);
      query.gte.mockReturnValue(query);
      query.lte.mockReturnValue(query);
      query.eq.mockReturnValue(query);
      queries.push(query);
      return query;
    };
    const roleLinksQuery = {
      select: vi.fn(),
      in: vi.fn().mockResolvedValue({
        data: [{ user_profile_id: "student-1", role_id: 1 }],
        error: null,
      }),
    };
    roleLinksQuery.select.mockReturnValue(roleLinksQuery);
    const rolesQuery = {
      select: vi.fn(),
      in: vi.fn().mockResolvedValue({ data: [{ id: 1, name: "student" }], error: null }),
    };
    rolesQuery.select.mockReturnValue(rolesQuery);
    createAdminClient.mockResolvedValue({
      from: vi.fn((table: string) => {
        if (table === "telemetry_learning_event") return telemetryQuery();
        if (table === "user_role") return roleLinksQuery;
        return rolesQuery;
      }),
    });

    const result = await getLearningAnalytics({
      scope: "global",
      from: "2026-09-01T00:00:00.000Z",
      to: "2026-09-03T00:00:00.000Z",
    });

    expect(result.totalInteractions).toBe(1005);
    expect(queries).toHaveLength(2);
    expect(queries.map((query) => query.range.mock.calls[0])).toEqual([[0, 999], [1000, 1999]]);
    for (const query of queries) {
      expect(query.gte).toHaveBeenCalledWith("received_at", "2026-09-01T00:00:00.000Z");
      expect(query.lte).toHaveBeenCalledWith("received_at", "2026-09-03T00:00:00.000Z");
    }
  });

  it("falha explicitamente quando o volume ultrapassa o teto seguro", async () => {
    const sample = row("course_opened", "student-1", 1);
    const from = vi.fn();
    createAdminClient.mockResolvedValue({
      from: vi.fn(() => {
        const query = {
          select: vi.fn(),
          order: vi.fn(),
          gte: vi.fn(),
          lte: vi.fn(),
          eq: vi.fn(),
          range: vi.fn((start: number) => {
            from(start);
            return Promise.resolve({
              data: start === 100_000 ? [sample] : Array(1000).fill(sample),
              error: null,
            });
          }),
          then: (resolve: (value: { data: LearningEventRow[]; error: null }) => unknown) =>
            Promise.resolve({ data: Array(1000).fill(sample), error: null }).then(resolve),
        };
        query.select.mockReturnValue(query);
        query.order.mockReturnValue(query);
        query.gte.mockReturnValue(query);
        query.lte.mockReturnValue(query);
        query.eq.mockReturnValue(query);
        return query;
      }),
    });

    await expect(getLearningAnalytics({ scope: "global" })).rejects.toThrow(/100 mil eventos/);
    expect(from).toHaveBeenLastCalledWith(100_000);
  });
});
