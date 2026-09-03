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
import { brl, calcExtrato, diagnosticar, lookupSalario } from "@/components/modules/financity/calculations";

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

    it("mantém paridade financeira CLT com IRRF, família, serviços e vale-refeição", () => {
        const extrato = calcExtrato(estado({
            salarioBruto: 6500,
            regime: "CLT",
            estadoCivil: "casado",
            filhos: "2",
            pets: ["cachorro", "gato"],
            imovel: "apartamento",
            aquisicao: "alugada",
            transporte: "carro",
            streaming: ["netflix", "spotify"],
            alimentacao: "delivery",
            poupanca: "10%",
            lazer: ["cinema"],
            imprevisto: "seguro",
        }));

        expect(extrato.inss).toBeCloseTo(728.82, 2);
        expect(extrato.impostoRendaMensal).toBeCloseTo(531.8, 2);
        expect(extrato.despesasFamilia).toBe(1350);
        expect(extrato.despesasStreaming).toBe(70);
        expect(extrato.despesasAlimentacao).toBeCloseTo(3722.5, 2);
        expect(extrato.totalDespesas).toBeCloseTo(8302.5, 2);
        expect(extrato.saldo).toBeCloseTo(-2140.238, 3);
    });

    it("mantém paridade financeira PJ com DAS deduzido do saldo", () => {
        const extrato = calcExtrato(estado({
            salarioBruto: 9000,
            regime: "PJ",
            estadoCivil: "solteiro",
            filhos: "1",
            pets: ["outros"],
            imovel: "casa",
            aquisicao: "propria",
            transporte: "publico",
            streaming: ["disney", "prime", "academia"],
            alimentacao: "masterchef",
            poupanca: "5%",
            lazer: ["shopping"],
            imprevisto: "nenhum",
        }));

        expect(extrato.inss).toBe(0);
        expect(extrato.impostoRendaMensal).toBe(540);
        expect(extrato.despesasFamilia).toBe(680);
        expect(extrato.despesasStreaming).toBe(164);
        expect(extrato.despesasAlimentacao).toBe(2925);
        expect(extrato.totalDespesas).toBe(4619);
        expect(extrato.saldo).toBe(3391);
    });

    it("cobra cada pet repetido e preserva o diagnóstico oficial", () => {
        const game = estado({
            salarioBruto: 3500,
            regime: "CLT",
            estadoCivil: "solteiro",
            filhos: "0",
            pets: ["cachorro", "cachorro"],
            imovel: "apartamento",
            aquisicao: "alugada",
            transporte: "moto",
            streaming: [],
            alimentacao: "delivery",
            poupanca: "5%",
            lazer: [],
            imprevisto: "reserva",
        });
        const extrato = calcExtrato(game);

        expect(extrato.despesasPets).toBe(300);
        expect(extrato.saldo).toBeCloseTo(-141.719, 3);
        expect(diagnosticar(game, extrato).id).toBe("superendividado");
    });
});

describe("Financity — smoke de interação até o diagnóstico", () => {
    beforeEach(() => {
        window.localStorage.clear();
    });

    it("percorre as etapas e mostra um dos quatro perfis", async () => {
        const user = userEvent.setup();
        window.localStorage.setItem(
            `${SESSOES_STORAGE_KEY}:user-b`,
            JSON.stringify([{ nome: "Bia", profissao: "Professora", perfil: "Equilibrado", saldo: 100, data: "2026-09-01T00:00:00.000Z" }]),
        );
        window.localStorage.setItem(
            SESSOES_STORAGE_KEY,
            JSON.stringify([{ nome: "Legado", profissao: "—", perfil: "—", saldo: 0, data: "2026-09-01T00:00:00.000Z" }]),
        );
        const { unmount } = render(<FinancityGame userId="user-a" />);

        await user.click(screen.getByRole("button", { name: /Iniciar Nova Sessão/i }));
        expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuemin", "0");
        expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuemax", "14");

        // Etapa 1 — nome e profissão
        await user.type(screen.getByLabelText("Nome"), "Ana");
        await user.type(screen.getByLabelText("Profissão"), "Analista de Sistemas");
        await user.click(screen.getByRole("button", { name: "Continuar" }));

        // Etapa 2 — regime
        await user.click(screen.getByRole("button", { name: /^CLT/ }));
        expect(screen.getByRole("button", { name: /^CLT/ })).toHaveAttribute("aria-pressed", "true");
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

        const salvas = JSON.parse(window.localStorage.getItem(`${SESSOES_STORAGE_KEY}:user-a`) ?? "[]");
        expect(salvas).toHaveLength(1);
        expect(salvas[0].nome).toBe("Ana");
        expect(JSON.parse(window.localStorage.getItem(`${SESSOES_STORAGE_KEY}:user-b`) ?? "[]")[0].nome).toBe("Bia");

        unmount();
        render(<FinancityGame userId="user-b" />);
        expect(screen.getByText("Bia")).toBeInTheDocument();
        expect(screen.queryByText("Ana")).not.toBeInTheDocument();

        unmount();
        render(<FinancityGame userId="user-a" />);
        expect(screen.getByText("Ana")).toBeInTheDocument();
        expect(screen.queryByText("Legado")).not.toBeInTheDocument();
    }, 30000);

    it("permite adicionar dois cachorros e cobra ambos no diagnóstico", async () => {
        const user = userEvent.setup();
        render(<FinancityGame userId="user-pets" />);

        await user.click(screen.getByRole("button", { name: /Iniciar Nova Sessão/i }));
        await user.type(screen.getByLabelText("Nome"), "Ana");
        await user.type(screen.getByLabelText("Profissão"), "Vendedor");
        await user.click(screen.getByRole("button", { name: "Continuar" }));
        await user.click(screen.getByRole("button", { name: /^CLT/ }));
        await user.click(screen.getByRole("button", { name: "Continuar" }));
        await user.click(screen.getByRole("button", { name: "Solteiro(a)" }));
        await user.click(screen.getByRole("button", { name: "0" }));
        await user.click(screen.getByRole("button", { name: "Adicionar cachorro" }));
        await user.click(screen.getByRole("button", { name: "Adicionar cachorro" }));
        expect(screen.getByText("2 cachorros")).toBeInTheDocument();
        await user.click(screen.getByRole("button", { name: "Continuar" }));
        await user.click(screen.getByRole("button", { name: /^Apartamento/ }));
        await user.click(screen.getByRole("button", { name: /^Alugada/ }));
        await user.click(screen.getByRole("button", { name: "Continuar" }));
        await user.click(screen.getByRole("button", { name: /^Moto/ }));
        await user.click(screen.getByRole("button", { name: /Peço delivery/ }));
        await user.click(screen.getByRole("button", { name: "Continuar" }));
        await user.click(screen.getByRole("button", { name: /^5%/ }));
        await user.click(screen.getByRole("button", { name: "Continuar" }));
        await user.click(screen.getByRole("button", { name: "Continuar" }));
        await user.click(screen.getByRole("button", { name: /Confiar na reserva/ }));
        await user.click(screen.getByRole("button", { name: /Ver diagnóstico/ }));
        await user.click(screen.getByRole("button", { name: /Finalizar e ver extrato completo/ }));

        expect(screen.getByTestId("financity-perfil")).toHaveTextContent("Superendividado");
        expect(screen.getByText("Família e pets").parentElement).toHaveTextContent("R$ 300,00");
        expect(screen.getByText("Saldo mensal").parentElement).toHaveTextContent("-R$ 141,72");
    }, 30000);

    it("exibe o seguro e reconcilia as despesas do extrato completo", async () => {
        const user = userEvent.setup();
        render(<FinancityGame userId="user-seguro" />);

        await user.click(screen.getByRole("button", { name: /Iniciar Nova Sessão/i }));
        await user.type(screen.getByLabelText("Nome"), "Bia");
        await user.type(screen.getByLabelText("Profissão"), "Analista de Sistemas");
        await user.click(screen.getByRole("button", { name: "Continuar" }));
        await user.click(screen.getByRole("button", { name: /^CLT/ }));
        await user.click(screen.getByRole("button", { name: "Continuar" }));
        await user.click(screen.getByRole("button", { name: "Casado(a)" }));
        await user.click(screen.getByRole("button", { name: "2" }));
        await user.click(screen.getByRole("button", { name: "Adicionar cachorro" }));
        await user.click(screen.getByRole("button", { name: "Adicionar gato" }));
        await user.click(screen.getByRole("button", { name: "Continuar" }));
        await user.click(screen.getByRole("button", { name: /^Apartamento/ }));
        await user.click(screen.getByRole("button", { name: /^Alugada/ }));
        await user.click(screen.getByRole("button", { name: "Continuar" }));
        await user.click(screen.getByRole("button", { name: /^Carro/ }));
        await user.click(screen.getByRole("button", { name: /^Netflix/ }));
        await user.click(screen.getByRole("button", { name: /^Spotify/ }));
        await user.click(screen.getByRole("button", { name: /Peço delivery/ }));
        await user.click(screen.getByRole("button", { name: "Continuar" }));
        await user.click(screen.getByRole("button", { name: /^10%/ }));
        await user.click(screen.getByRole("button", { name: "Continuar" }));
        await user.click(screen.getByRole("button", { name: /^Cinema/ }));
        await user.click(screen.getByRole("button", { name: "Continuar" }));
        await user.click(screen.getByRole("button", { name: /Contratar seguro/ }));
        await user.click(screen.getByRole("button", { name: /Ver diagnóstico/ }));
        await user.click(screen.getByRole("button", { name: /Finalizar e ver extrato completo/ }));

        const game = estado({
            salarioBruto: 6500,
            regime: "CLT",
            estadoCivil: "casado",
            filhos: "2",
            pets: ["cachorro", "gato"],
            imovel: "apartamento",
            aquisicao: "alugada",
            transporte: "carro",
            streaming: ["netflix", "spotify"],
            alimentacao: "delivery",
            poupanca: "10%",
            lazer: ["cinema"],
            imprevisto: "seguro",
        });
        const extrato = calcExtrato(game);
        const despesas = [
            ["Família e pets", extrato.despesasFamilia],
            ["Moradia", extrato.despesasMoradia],
            ["Transporte", extrato.despesasTransporte],
            ["Assinaturas", extrato.despesasStreaming],
            ["Alimentação", extrato.despesasAlimentacao],
            ["Lazer", extrato.despesasLazer],
            ["Seguro", extrato.despesasSeguro],
        ] as const;

        expect(despesas.reduce((total, [, valor]) => total + valor, 0)).toBeCloseTo(extrato.totalDespesas, 2);
        expect(extrato.totalDespesas).toBeCloseTo(8302.5, 2);
        for (const [label, valor] of despesas) {
            expect(screen.getByText(label).parentElement).toHaveTextContent(brl(valor).replace(/\u00a0/g, " "));
        }
        expect(screen.getByText("Despesas de consumo").parentElement).toHaveTextContent("R$ 8.302,50");
    }, 30000);
});
