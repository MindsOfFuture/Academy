import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({ createServiceRoleClient: vi.fn() }));
vi.mock("@/lib/api/profiles-server", () => ({ fetchRoleForUser: vi.fn() }));

import { authorizeNotification } from "@/lib/api/notification-rules";

describe("authorizeNotification", () => {
  // Qualquer acesso ao banco faria o teste falhar: tipo inválido não pode chegar ao builder.
  const db = new Proxy({}, { get: () => { throw new Error("não deveria consultar o banco"); } });

  it.each(["toString", "constructor", "__proto__", "hasOwnProperty", "valueOf", "tipo_inexistente"])(
    "recusa o tipo %s, que não é um aviso conhecido",
    async (type) => {
      const result = await authorizeNotification(db as never, "caller", { userId: "alvo", type, payload: {} });
      expect(result).toBeNull();
    },
  );
});
