import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import CidadaniaFinanceiraGame from "@/components/modules/cidadania-financeira/CidadaniaFinanceiraGame";
import { BLOCOS, CENARIOS } from "@/components/modules/cidadania-financeira/data";

describe("Cidadania Financeira — invariantes de conteúdo", () => {
    it("tem exatamente 4 papéis", () => {
        expect(BLOCOS).toHaveLength(4);
        expect(BLOCOS.map((b) => b.role)).toEqual([
            "cidadao",
            "prefeito",
            "ministro",
            "presidente",
        ]);
    });

    it("não declara métricas dinâmicas que o fluxo simplificado não atualiza", () => {
        for (const bloco of BLOCOS) {
            expect(bloco).not.toHaveProperty("metrics");
        }
    });

    it("mantém a ordem autoral determinística das quatro opções", () => {
        for (const cenario of CENARIOS) {
            expect(cenario.options.map((opcao) => opcao.origLabel)).toEqual(["A", "B", "C", "D"]);
        }
    });

    it("tem exatamente 100 cenários", () => {
        expect(CENARIOS).toHaveLength(100);
    });

    it("distribui 25 cenários por papel", () => {
        for (const bloco of BLOCOS) {
            expect(CENARIOS.filter((c) => c.block === bloco.id)).toHaveLength(25);
        }
    });

    it("todo cenário tem 4 decisões com feedback jogável", () => {
        for (const cenario of CENARIOS) {
            expect(cenario.options).toHaveLength(4);
            expect(cenario.context.length).toBeGreaterThan(0);
            for (const opcao of cenario.options) {
                expect(opcao.text.length).toBeGreaterThan(0);
                expect(opcao.feedback.length).toBeGreaterThan(0);
                expect(["correct", "partial", "wrong"]).toContain(opcao.type);
                expect([0, 10]).toContain(opcao.points);
            }
            expect(cenario.options.some((o) => o.type === "correct")).toBe(true);
        }
    });

    it("usa ids sequenciais de 1 a 100", () => {
        expect(CENARIOS.map((c) => c.id)).toEqual(
            Array.from({ length: 100 }, (_, i) => i + 1),
        );
    });
});

describe("Cidadania Financeira — smoke de interação", () => {
    beforeEach(() => {
        window.localStorage.clear();
    });

    it("abre um papel, responde um cenário e mostra o resultado da decisão", async () => {
        const user = userEvent.setup();
        render(<CidadaniaFinanceiraGame userId="user-a" />);

        expect(screen.getByText("100")).toBeInTheDocument();
        for (const bloco of BLOCOS) {
            expect(
                screen.getByRole("button", { name: new RegExp(bloco.name) }),
            ).toBeInTheDocument();
        }

        await user.click(screen.getByRole("button", { name: /O Cidadão/ }));

        const primeiro = CENARIOS[0];
        expect(screen.getByRole("heading", { name: primeiro.title })).toBeInTheDocument();
        expect(screen.getByText(/Questão 1 de 25/)).toBeInTheDocument();

        const correta = primeiro.options.find((o) => o.type === "correct")!;
        await user.click(screen.getByRole("button", { name: new RegExp(escapeRegExp(correta.text.slice(0, 40))) }));

        expect(screen.getByRole("alert")).toHaveTextContent("Decisão Correta");
        expect(screen.getByTestId("cidadania-score")).toHaveTextContent("10");
        expect(screen.getByRole("button", { name: /Próxima Questão/ })).toBeInTheDocument();
    }, 30000);

    it("isola progresso por usuário e ignora a chave legada sem escopo", () => {
        window.localStorage.setItem("academy-cidadania-financeira-v1", JSON.stringify({ completedBlocks: [3] }));
        window.localStorage.setItem("academy-cidadania-financeira-v1:user-a", JSON.stringify({ completedBlocks: [1] }));
        window.localStorage.setItem("academy-cidadania-financeira-v1:user-b", JSON.stringify({ completedBlocks: [2] }));

        const { unmount } = render(<CidadaniaFinanceiraGame userId="user-a" />);
        expect(screen.getByRole("button", { name: /O Cidadão: 25 questões, concluído/ })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /O Ministro da Economia: 25 questões$/ })).toBeInTheDocument();

        unmount();
        render(<CidadaniaFinanceiraGame userId="user-b" />);
        expect(screen.getByRole("button", { name: /O Prefeito: 25 questões, concluído/ })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /O Cidadão: 25 questões$/ })).toBeInTheDocument();
    });
});

function escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
