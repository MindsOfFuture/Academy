import { describe, expect, it } from "vitest";
import { isPublicPath } from "@/lib/supabase/middleware";
import { NAV_LINKS } from "@/components/navbar/navbar";
import { JOGOS } from "@/components/home/jogos-home";

// O conteúdo do site só abre com login, para cada acesso contar na conta do aluno.
describe("atalhos da home exigem login", () => {
    it.each(NAV_LINKS.map((l) => [l.label, l.href]))("menu: %s (%s)", (_label, href) => {
        expect(isPublicPath(new URL(href, "https://x").pathname)).toBe(false);
    });

    it.each(JOGOS.map((j) => [j.titulo, j.href]))("jogo: %s (%s)", (_titulo, href) => {
        expect(isPublicPath(new URL(href, "https://x").pathname)).toBe(false);
    });

    it("cursos e botões do topo também exigem login", () => {
        for (const href of ["/trilhas", "/course", "/protected"]) {
            expect(isPublicPath(href)).toBe(false);
        }
    });
});
