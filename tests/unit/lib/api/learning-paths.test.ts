import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSupabaseClient, type MockSupabaseClient } from "@/tests/mocks/supabase";

let mockClient: MockSupabaseClient;
const papel = vi.hoisted(() => ({ atual: "student" }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => mockClient }));
vi.mock("@/lib/api/profiles-server", () => ({ fetchRoleForUser: async () => papel.atual }));

import {
  addCourseToPath,
  deleteLearningPath,
  mapPathCourses,
  removeCourseFromPath,
  reorderCoursesInPath,
  updateLearningPath,
} from "@/lib/api/learning-paths";

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

describe("permissões das trilhas", () => {
  beforeEach(() => {
    mockClient = createMockSupabaseClient();
    papel.atual = "student";
  });

  const mutacoes = [
    ["updateLearningPath", () => updateLearningPath("p1", { title: "Nova" })],
    ["deleteLearningPath", () => deleteLearningPath("p1")],
    ["addCourseToPath", () => addCourseToPath("p1", "c1", 1)],
    ["removeCourseFromPath", () => removeCourseFromPath("p1", "c1")],
    ["reorderCoursesInPath", () => reorderCoursesInPath("p1", [{ courseId: "c1", order: 1 }])],
  ] as const;

  const nadaGravado = () => {
    expect(mockClient.chain.insert).not.toHaveBeenCalled();
    expect(mockClient.chain.update).not.toHaveBeenCalled();
    expect(mockClient.chain.delete).not.toHaveBeenCalled();
  };

  it.each(mutacoes)("%s: aluno é recusado", async (_nome, mutar) => {
    await expect(mutar()).rejects.toThrow("Acesso negado.");
    nadaGravado();
  });

  it.each(mutacoes)("%s: anônimo é recusado", async (_nome, mutar) => {
    mockClient.auth.getUser.mockResolvedValue({ data: { user: null } });
    await expect(mutar()).rejects.toThrow("Usuário não autenticado.");
    nadaGravado();
  });

  it.each(mutacoes)("%s: professor em trilha de outro é recusado", async (_nome, mutar) => {
    papel.atual = "teacher";
    mockClient.chain.maybeSingle.mockResolvedValue({ data: { owner_id: "outro" }, error: null });
    await expect(mutar()).rejects.toThrow("Acesso negado.");
    nadaGravado();
  });

  it("professor não põe curso alheio na própria trilha", async () => {
    papel.atual = "teacher";
    mockClient.chain.maybeSingle
      .mockResolvedValueOnce({ data: { owner_id: "test-user-id" }, error: null }) // trilha
      .mockResolvedValueOnce({ data: { owner_id: "outro" }, error: null }); // curso
    await expect(addCourseToPath("p1", "c1", 1)).rejects.toThrow("Acesso negado.");
    nadaGravado();
  });

  it("admin apaga trilha sem ser dono", async () => {
    papel.atual = "admin";
    expect(await deleteLearningPath("p1")).toBe(true);
    expect(mockClient.chain.delete).toHaveBeenCalled();
    expect(mockClient.chain.maybeSingle).not.toHaveBeenCalled();
  });
});
