import { describe, it, expect } from "vitest";
import { sanitizeRichText } from "@/lib/sanitize";
import { normalizeNextPath } from "@/lib/utils";
import { rateLimit, clientIp } from "@/lib/rate-limit";

describe("sanitizeRichText", () => {
    it("remove script e handlers inline", () => {
        const dirty = `<p>ok</p><script>alert(1)</script><img src=x onerror="alert(1)">`;
        const clean = sanitizeRichText(dirty);

        expect(clean).toContain("<p>ok</p>");
        expect(clean).not.toContain("script");
        expect(clean).not.toContain("onerror");
    });

    it("bloqueia javascript: e data: em href/src", () => {
        const clean = sanitizeRichText(
            `<a href="javascript:alert(1)">x</a><img src="data:text/html,<script>alert(1)</script>">`,
        );

        expect(clean).not.toContain("javascript:");
        expect(clean).not.toContain("data:");
    });

    it("preserva formatação legítima e força rel seguro em links", () => {
        const clean = sanitizeRichText(
            `<h2>T</h2><p><strong>a</strong> <em>b</em></p><a href="https://x.com">l</a>`,
        );

        expect(clean).toContain("<h2>T</h2>");
        expect(clean).toContain("<strong>a</strong>");
        expect(clean).toContain('rel="noopener noreferrer"');
    });
});

describe("normalizeNextPath", () => {
    it("aceita apenas caminhos internos", () => {
        expect(normalizeNextPath("/protected")).toBe("/protected");
        expect(normalizeNextPath("/a?b=1")).toBe("/a?b=1");
    });

    it("rejeita destinos externos", () => {
        expect(normalizeNextPath("https://evil.com")).toBeNull();
        expect(normalizeNextPath("//evil.com")).toBeNull();
        expect(normalizeNextPath("/\\evil.com")).toBeNull();
        expect(normalizeNextPath("")).toBeNull();
        expect(normalizeNextPath(null)).toBeNull();
    });
});

describe("rateLimit", () => {
    it("libera até o limite e bloqueia depois, por chave", () => {
        const key = `test-${Math.random()}`;

        expect(rateLimit(key, 2, 60_000)).toBe(true);
        expect(rateLimit(key, 2, 60_000)).toBe(true);
        expect(rateLimit(key, 2, 60_000)).toBe(false);

        expect(rateLimit(`${key}-outra`, 2, 60_000)).toBe(true);
    });

    it("lê o primeiro IP de x-forwarded-for", () => {
        const request = new Request("https://example.com", {
            headers: { "x-forwarded-for": "203.0.113.5, 10.0.0.1" },
        });

        expect(clientIp(request)).toBe("203.0.113.5");
        expect(clientIp(new Request("https://example.com"))).toBe("unknown");
    });
});
