import { describe, expect, it } from "vitest";
import { isPublicPath } from "@/lib/supabase/middleware";

describe("isPublicPath", () => {
  it("permite /api/notifications sem autenticação", () => {
    expect(isPublicPath("/api/notifications")).toBe(true);
    expect(isPublicPath("/api/notifications/unread")).toBe(true);
  });

  it("mantém protegida uma rota privada", () => {
    expect(isPublicPath("/protected")).toBe(false);
  });

  it("mantém públicas as rotas já permitidas", () => {
    expect(isPublicPath("/")).toBe(true);
    expect(isPublicPath("/auth")).toBe(true);
    expect(isPublicPath("/api/auth/teacher-qualification-upload")).toBe(true);
  });
});
