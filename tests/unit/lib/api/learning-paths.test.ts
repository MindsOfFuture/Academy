import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

import { mapPathCourses } from "@/lib/api/learning-paths";

describe("mapPathCourses", () => {
  it("descarta curso que a RLS escondeu (course: null) e mantém a ordem", () => {
    const courses = mapPathCourses([
      { order: 2, course: { id: "b", title: "B" } },
      { order: 0, course: null },
      { order: 1, course: { id: "a", title: "A" } },
    ]);

    expect(courses.map((c) => c.id)).toEqual(["a", "b"]);
  });
});
