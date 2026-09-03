import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createMockSupabaseClient,
  mockAuthenticatedUser,
  mockQueryResponse,
  type MockSupabaseClient,
} from "@/tests/mocks/supabase";

let mockClient: MockSupabaseClient;

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => mockClient,
  createAdminClient: vi.fn(),
  createServiceRoleClient: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/api/notifications-server", () => ({
  notifyAdmins: vi.fn(),
  createNotification: vi.fn(),
}));

import { ensureCurrentTeacherVerifiedForPublishing } from "@/lib/api/profiles-server";

function queueTeacher(status: "pending" | "approved" | "rejected") {
  mockQueryResponse(mockClient, [{ role_id: 2 }]);
  mockQueryResponse(mockClient, [{ name: "teacher" }]);
  mockQueryResponse(mockClient, { verification_status: status });
}

describe("ensureCurrentTeacherVerifiedForPublishing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = createMockSupabaseClient();
    mockAuthenticatedUser(mockClient, "teacher-1");
  });

  it.each(["pending", "rejected"] as const)(
    "bloqueia professor com verificação %s",
    async (status) => {
      queueTeacher(status);

      await expect(ensureCurrentTeacherVerifiedForPublishing()).rejects.toThrow(
        "Professor não verificado. Aguarde aprovação do administrador.",
      );
    },
  );

  it("permite professor aprovado", async () => {
    queueTeacher("approved");

    await expect(ensureCurrentTeacherVerifiedForPublishing()).resolves.toBeUndefined();
  });

  it("permite administrador sem consultar status de professor", async () => {
    mockQueryResponse(mockClient, [{ role_id: 1 }]);
    mockQueryResponse(mockClient, [{ name: "admin" }]);

    await expect(ensureCurrentTeacherVerifiedForPublishing()).resolves.toBeUndefined();
    expect(mockClient.from).toHaveBeenCalledTimes(2);
  });
});
