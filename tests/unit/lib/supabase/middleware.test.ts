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

    it("só aceita o prefixo público em uma fronteira de segmento", () => {
        expect(isPublicPath("/auth/callback")).toBe(true);
        expect(isPublicPath("/authenticacao-interna")).toBe(false);
        expect(isPublicPath("/api/articles-private")).toBe(false);
        expect(isPublicPath("/api/notifications-admin")).toBe(false);
    });

    it("mantém públicas a validação de certificado e os créditos institucionais", () => {
        expect(isPublicPath("/validar")).toBe(true);
        expect(isPublicPath("/creditos")).toBe(true);
    });
});
