import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ModulesSection, { MODULOS_ESPECIAIS } from "@/components/modules/ModulesSection";

describe("ModulesSection — seção Atividades do painel", () => {
    it("renderiza o título da seção", () => {
        render(<ModulesSection />);
        expect(
            screen.getByRole("heading", { level: 2, name: "Atividades" }),
        ).toBeInTheDocument();
    });

    it("mostra o card de Educação Financeira apontando para a rota canônica", () => {
        render(<ModulesSection />);
        const link = screen.getByRole("link", { name: /Educação Financeira/i });
        expect(link).toHaveAttribute("href", "/protected/modulos/educacao-financeira");
    });

    it("mostra o card do Empreenda+ apontando para a rota canônica", () => {
        render(<ModulesSection />);
        const link = screen.getByRole("link", { name: /Empreenda\+/i });
        expect(link).toHaveAttribute("href", "/protected/modulos/laboratorio-de-gestao");
    });

    it("expõe exatamente os dois módulos especiais, nesta ordem", () => {
        expect(MODULOS_ESPECIAIS.map((m) => m.href)).toEqual([
            "/protected/modulos/educacao-financeira",
            "/protected/modulos/laboratorio-de-gestao",
        ]);
    });

    it("não expõe nenhum link público fora de /protected", () => {
        render(<ModulesSection />);
        for (const link of screen.getAllByRole("link")) {
            expect(link.getAttribute("href")).toMatch(/^\/protected\//);
        }
    });
});
