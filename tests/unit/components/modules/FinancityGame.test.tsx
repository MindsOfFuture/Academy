import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import FinancityGame from "@/components/modules/financity/FinancityGame";
import {
    DECISOES,
    ESTADO_INICIAL,
    PERFIS,
    SESSOES_STORAGE_KEY,
    type GameState,
} from "@/components/modules/financity/data";
import { calcExtrato, diagnosticar, lookupSalario } from "@/components/modules/financity/calculations";

function estado(patch: Partial<GameState>): GameState {
    return {
        ...ESTADO_INICIAL,
        nome: "Ana",
        profissao: "Analista",
        profissaoReconhecida: true,
        regime: "CLT",
        estadoCivil: "solteiro",
        filhos: "0",
        imovel: "casa",
        aquisicao: "propria",
        transporte: "bicicleta",
        alimentacao: "masterchef",
        poupanca: "nao",
        imprevisto: "reserva",
        ...patch,
    };
}

describe("Financity — invariantes de conteúdo", () => {
    it("tem exatamente 14 decisões", () => {
        expect(DECISOES).toHaveLength(14);
    });

    it("não repete o id de nenhuma decisão", () => {
        const ids = DECISOES.map((d) => d.id);
        expect(new Set(ids).size).toBe(14);
    });

    it("tem exatamente 4 perfis de diagnóstico de orçamento", () => {
        expect(PERFIS).toHaveLength(4);
        expect(new Set(PERFIS.map((p) => p.id)).size).toBe(4);
    });

    it("todos os 4 perfis são alcançáveis pelo diagnóstico", () => {
        const cenarios: GameState[] = [
            // Superendividado: despesas maiores que a renda.
            estado({
                salarioBruto: 2000,
                imovel: "mansao",
                aquisicao: "financiada",
                transporte: "carro",
                alimentacao: "gourmet",
            }),
            // Poupador extremo: guarda muito e não gasta com lazer.
            estado({ salarioBruto: 10000, poupanca: "20%", lazer: [] }),
            // Equilibrado: poupa, se diverte e fecha no azul.
            estado({ salarioBruto: 10000, poupanca: "20%", lazer: ["cinema"] }),
            // Gastador livre: não deve, mas também não guarda.
            estado({ salarioBruto: 10000, poupanca: "nao", lazer: [] }),
        ];
        const obtidos = cenarios.map((g) => diagnosticar(g, calcExtrato(g)).id);
        expect(obtidos).toEqual([
            "superendividado",
            "poupador",
            "equilibrado",
            "gastador",
        ]);
    });

    it("estima salário para profissão no feminino como no masculino", () => {
        expect(lookupSalario("medica").salario).toBe(lookupSalario("medico").salario);
    });
});

describe("Financity — smoke de interação até o diagnóstico", () => {
    beforeEach(() => {
        window.localStorage.clear();
    });

    it("percorre as etapas e mostra um dos quatro perfis", async () => {
        const user = userEvent.setup();
        render(<FinancityGame />);

        await user.click(screen.getByRole("button", { name: /Iniciar Nova Sessão/i }));

        // Etapa 1 — nome e profissão
        await user.type(screen.getByLabelText("Nome"), "Ana");
        await user.type(screen.getByLabelText("Profissão"), "Analista de Sistemas");
        await user.click(screen.getByRole("button", { name: "Continuar" }));

        // Etapa 2 — regime
        await user.click(screen.getByRole("button", { name: /^CLT/ }));
        await user.click(screen.getByRole("button", { name: "Continuar" }));

        // Etapa 3 — família
        await user.click(screen.getByRole("button", { name: "Solteiro(a)" }));
        await user.click(screen.getByRole("button", { name: "0" }));
        await user.click(screen.getByRole("button", { name: "Continuar" }));

        // Etapa 4 — moradia
        await user.click(screen.getByRole("button", { name: /^Casa/ }));
        await user.click(screen.getByRole("button", { name: /Própria \(quitada\)/ }));
        await user.click(screen.getByRole("button", { name: "Continuar" }));

        // Etapa 5 — estilo de vida
        await user.click(screen.getByRole("button", { name: /^Bicicleta/ }));
        await user.click(screen.getByRole("button", { name: /Cozinho em casa/ }));
        await user.click(screen.getByRole("button", { name: "Continuar" }));

        // Etapa 6 — poupança
        await user.click(screen.getByRole("button", { name: /^10%/ }));
        await user.click(screen.getByRole("button", { name: "Continuar" }));

        // Etapa 7 — lazer (some quando o orçamento já está no vermelho)
        const cinema = screen.queryByRole("button", { name: /^Cinema/ });
        if (cinema) await user.click(cinema);
        await user.click(screen.getByRole("button", { name: /Continuar/ }));

        // Etapa 8 — imprevisto
        await user.click(screen.getByRole("button", { name: /Confiar na reserva/ }));
        await user.click(screen.getByRole("button", { name: /Ver diagnóstico/ }));

        // Etapa 9 — imposto de renda
        await user.click(screen.getByRole("button", { name: /Finalizar e ver extrato completo/ }));

        expect(screen.getByText("Diagnóstico Financeiro")).toBeInTheDocument();
        const titulos = PERFIS.map((p) => p.titulo);
        const heading = screen.getByTestId("financity-perfil").textContent ?? "";
        expect(titulos).toContain(heading);
        expect(screen.getByText(/Extrato completo/)).toBeInTheDocument();

        const salvas = JSON.parse(window.localStorage.getItem(SESSOES_STORAGE_KEY) ?? "[]");
        expect(salvas).toHaveLength(1);
        expect(salvas[0].nome).toBe("Ana");
    }, 30000);
});
