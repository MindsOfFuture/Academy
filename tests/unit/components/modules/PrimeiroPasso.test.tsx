import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import PrimeiroPasso from "@/components/modules/laboratorio-gestao/PrimeiroPasso";
import { ETAPAS, STORAGE_KEY } from "@/components/modules/laboratorio-gestao/data";

describe("Primeiro Passo — invariantes de conteúdo", () => {
    it("tem exatamente 10 etapas", () => {
        expect(ETAPAS).toHaveLength(10);
    });

    it("numera as etapas de 1 a 10", () => {
        expect(ETAPAS.map((e) => e.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    });

    it("toda etapa tem perguntas e uma resposta responsável", () => {
        for (const etapa of ETAPAS) {
            expect(etapa.perguntas.length).toBeGreaterThan(0);
            expect(etapa.resposta.alerta.length).toBeGreaterThan(0);
            expect(etapa.resposta.proximo.length).toBeGreaterThan(0);
        }
    });

    it("usa uma chave de localStorage específica do módulo", () => {
        expect(STORAGE_KEY).toBe("academy-primeiro-passo-v1");
    });
});

describe("Primeiro Passo — smoke de interação", () => {
    beforeEach(() => {
        window.localStorage.clear();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("conclui a etapa 1, persiste no localStorage e retoma após remontar", async () => {
        const user = userEvent.setup();
        const { unmount } = render(<PrimeiroPasso userId="user-a" />);

        await user.click(screen.getByRole("button", { name: "Começar" }));
        expect(screen.getByText("0 de 10 concluídas")).toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: /1\. Sua ideia e você/ }));
        await user.click(screen.getByRole("button", { name: "Só na cabeça" }));
        await user.type(
            screen.getByLabelText("O que você pretende vender?"),
            "bolos caseiros por encomenda",
        );
        await user.click(screen.getByRole("button", { name: "Poucas horas" }));
        await user.click(screen.getByRole("button", { name: "Nota 4 de 5" }));
        await user.click(screen.getByRole("button", { name: "Ver o resultado" }));

        expect(screen.getByText("Seu retrato inicial")).toBeInTheDocument();

        const salvo = JSON.parse(window.localStorage.getItem(`${STORAGE_KEY}:user-a`) ?? "{}");
        expect(salvo["1"].estagio).toBe("Só na cabeça");
        expect(salvo["1"].oque).toBe("bolos caseiros por encomenda");
        expect(salvo["1"].__ok).toBe(true);

        // "Recarregar": desmonta e monta de novo lendo o mesmo localStorage.
        unmount();
        render(<PrimeiroPasso userId="user-a" />);
        expect(screen.getByText("1 de 10 etapas concluídas")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Continuar" })).toBeInTheDocument();
    }, 30000);

    it("monta o Meu plano parcial com a resposta salva e permite imprimir", async () => {
        window.localStorage.setItem(
            `${STORAGE_KEY}:user-a`,
            JSON.stringify({
                "1": { estagio: "Só na cabeça", oque: "bolos caseiros", confianca: 3, __ok: true },
            }),
        );
        const printSpy = vi.fn();
        vi.stubGlobal("print", printSpy);

        const user = userEvent.setup();
        render(<PrimeiroPasso userId="user-a" />);

        await user.click(screen.getByRole("button", { name: "Continuar" }));
        await user.click(screen.getByRole("button", { name: /Ver meu plano parcial/ }));

        expect(screen.getByRole("heading", { name: /Meu plano/ })).toBeInTheDocument();
        expect(screen.getByText(/bolos caseiros/)).toBeInTheDocument();
        expect(screen.getByText(ETAPAS[0].resposta.proximo)).toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: /Salvar \/ imprimir/ }));
        expect(printSpy).toHaveBeenCalledTimes(1);
    }, 30000);

    it("mostra o plano final quando as 10 etapas estão concluídas", async () => {
        const tudo: Record<string, Record<string, unknown>> = {};
        for (const etapa of ETAPAS) tudo[String(etapa.id)] = { __ok: true };
        tudo["10"] = { __ok: true, frase: "bolos caseiros para festas do bairro", prioridade: "Fazer o teste" };
        window.localStorage.setItem(`${STORAGE_KEY}:user-a`, JSON.stringify(tudo));

        const user = userEvent.setup();
        render(<PrimeiroPasso userId="user-a" />);

        await user.click(screen.getByRole("button", { name: "Continuar" }));
        expect(screen.getByText("10 de 10 concluídas")).toBeInTheDocument();
        await user.click(screen.getByRole("button", { name: /Ver meu plano/ }));

        expect(screen.getByText(/Você percorreu as 10 etapas/)).toBeInTheDocument();
        expect(screen.getByText(/bolos caseiros para festas do bairro/)).toBeInTheDocument();
        expect(screen.getByText("Fazer o teste")).toBeInTheDocument();
    }, 30000);

    it("recomeça do zero limpando apenas o localStorage do usuário atual", async () => {
        window.localStorage.setItem(`${STORAGE_KEY}:user-a`, JSON.stringify({ "1": { __ok: true } }));
        window.localStorage.setItem(`${STORAGE_KEY}:user-b`, JSON.stringify({ "2": { __ok: true } }));
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ "3": { __ok: true } }));
        vi.stubGlobal("confirm", vi.fn(() => true));

        const user = userEvent.setup();
        render(<PrimeiroPasso userId="user-a" />);

        await user.click(screen.getByRole("button", { name: /Recomeçar do zero/ }));

        expect(window.localStorage.getItem(`${STORAGE_KEY}:user-a`)).toBeNull();
        expect(window.localStorage.getItem(`${STORAGE_KEY}:user-b`)).not.toBeNull();
        expect(window.localStorage.getItem(STORAGE_KEY)).not.toBeNull();
        expect(screen.getByRole("button", { name: "Começar" })).toBeInTheDocument();
    }, 30000);

    it("isola respostas entre A e B e ignora dados legados sem escopo", () => {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ "3": { __ok: true } }));
        window.localStorage.setItem(`${STORAGE_KEY}:user-a`, JSON.stringify({ "1": { __ok: true } }));
        window.localStorage.setItem(`${STORAGE_KEY}:user-b`, JSON.stringify({ "2": { __ok: true } }));

        const { unmount } = render(<PrimeiroPasso userId="user-a" />);
        expect(screen.getByText("1 de 10 etapas concluídas")).toBeInTheDocument();

        unmount();
        render(<PrimeiroPasso userId="user-b" />);
        expect(screen.getByText("1 de 10 etapas concluídas")).toBeInTheDocument();
        expect(window.localStorage.getItem(`${STORAGE_KEY}:user-a`)).not.toBeNull();
    });
});
