import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// O aviso de alocação em lote (16 bolsistas) estourou o limite de 10 pedidos/s
// da Resend: 6 voltaram 429 e ninguém tentou de novo.

const { send } = vi.hoisted(() => ({ send: vi.fn() }));

vi.mock("resend", () => ({
    Resend: class {
        emails = { send };
    },
}));

const LIMITE_POR_SEGUNDO = 10;

/** Resend falsa: aceita no máximo 10 pedidos em qualquer janela de 1 s. */
function resendComLimite() {
    const horarios: number[] = [];
    const aceitos: string[] = [];
    send.mockImplementation(async ({ to }: { to: string }) => {
        const agora = Date.now();
        const naJanela = horarios.filter((t) => agora - t < 1000).length;
        horarios.push(agora);
        if (naJanela >= LIMITE_POR_SEGUNDO) {
            return {
                data: null,
                error: { name: "rate_limit_exceeded", statusCode: 429, message: "Too many requests" },
                headers: { "retry-after": "1" },
            };
        }
        aceitos.push(to);
        return { data: { id: `id-${to}` }, error: null, headers: null };
    });
    return aceitos;
}

describe("sendNotificationEmail — limite da Resend", () => {
    beforeEach(() => {
        vi.resetModules();
        vi.useFakeTimers();
        send.mockReset();
        vi.spyOn(console, "info").mockImplementation(() => {});
        vi.spyOn(console, "warn").mockImplementation(() => {});
        vi.spyOn(console, "error").mockImplementation(() => {});
    });
    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it("16 avisos disparados juntos chegam todos, sem nenhum 429", async () => {
        const aceitos = resendComLimite();
        const { sendNotificationEmail } = await import("@/lib/email/resend");
        const destinos = Array.from({ length: 16 }, (_, i) => `bolsista${i}@example.com`);

        const envio = Promise.allSettled(destinos.map((d) => sendNotificationEmail(d, "Alocado", "<p>oi</p>")));
        await vi.runAllTimersAsync();
        await envio;

        expect(aceitos.sort()).toEqual([...destinos].sort());
        expect(send).toHaveBeenCalledTimes(16);
        expect(console.error).not.toHaveBeenCalled();
    });

    it("429 espera o retry-after e tenta de novo", async () => {
        send
            .mockResolvedValueOnce({
                data: null,
                error: { name: "rate_limit_exceeded", statusCode: 429, message: "Too many requests" },
                headers: { "retry-after": "2" },
            })
            .mockResolvedValueOnce({ data: { id: "ok" }, error: null, headers: null });
        const { sendNotificationEmail } = await import("@/lib/email/resend");

        const envio = sendNotificationEmail("a@example.com", "Alocado", "<p>oi</p>");
        await vi.advanceTimersByTimeAsync(1999);
        expect(send).toHaveBeenCalledTimes(1);
        await vi.advanceTimersByTimeAsync(300);
        await envio;

        expect(send).toHaveBeenCalledTimes(2);
        expect(console.error).not.toHaveBeenCalled();
    });

    it("desiste depois de 4 tentativas e registra o erro", async () => {
        send.mockResolvedValue({
            data: null,
            error: { name: "rate_limit_exceeded", statusCode: 429, message: "Too many requests" },
            headers: null,
        });
        const { sendNotificationEmail } = await import("@/lib/email/resend");

        const envio = sendNotificationEmail("a@example.com", "Alocado", "<p>oi</p>");
        await vi.runAllTimersAsync();
        await envio;

        expect(send).toHaveBeenCalledTimes(4);
        expect(console.error).toHaveBeenCalledTimes(1);
    });

    it("outro erro não repete", async () => {
        send.mockResolvedValue({
            data: null,
            error: { name: "validation_error", statusCode: 422, message: "Invalid to" },
            headers: null,
        });
        const { sendNotificationEmail } = await import("@/lib/email/resend");

        const envio = sendNotificationEmail("x", "Alocado", "<p>oi</p>");
        await vi.runAllTimersAsync();
        await envio;

        expect(send).toHaveBeenCalledTimes(1);
        expect(console.error).toHaveBeenCalledTimes(1);
    });
});
