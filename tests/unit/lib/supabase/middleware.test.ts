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

    it("deixa telemetria e analytics chegarem ao guard da própria rota", () => {
        // O middleware não sabe distinguir sessão válida de ausente nessas APIs
        // sem quebrar o batch de telemetria; o 401/403 é responsabilidade do handler.
        expect(isPublicPath("/api/telemetry/events")).toBe(true);
        expect(isPublicPath("/api/analytics/events")).toBe(true);
    });

    it("não libera descendentes dessas duas APIs — só o path exato é público", () => {
        // Regressão de segurança: como prefixo, qualquer sub-rota futura nasceria
        // pública sem ninguém perceber. Só os dois handlers auditados são públicos.
        expect(isPublicPath("/api/telemetry/events/batch")).toBe(false);
        expect(isPublicPath("/api/analytics/events/export")).toBe(false);
        expect(isPublicPath("/api/telemetry/events/")).toBe(false);
        expect(isPublicPath("/api/analytics/events/")).toBe(false);
    });

    it("não libera nomes parecidos nem os prefixos-pai de telemetria e analytics", () => {
        expect(isPublicPath("/api/telemetry")).toBe(false);
        expect(isPublicPath("/api/analytics")).toBe(false);
        expect(isPublicPath("/api/telemetry/events-admin")).toBe(false);
        expect(isPublicPath("/api/analytics/events-admin")).toBe(false);
        expect(isPublicPath("/api/telemetry/eventsx")).toBe(false);
        expect(isPublicPath("/api/analytics/eventos")).toBe(false);
        expect(isPublicPath("/api/telemetry-events")).toBe(false);
        expect(isPublicPath("/api/analytics-events")).toBe(false);
    });
});
