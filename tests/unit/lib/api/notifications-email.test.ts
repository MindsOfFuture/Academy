import { beforeEach, describe, expect, it, vi } from "vitest";

// Spec 017: o e-mail de aviso não pode carregar HTML nem link externo vindos de pessoa.

const { sendNotificationEmail, insert } = vi.hoisted(() => ({
    sendNotificationEmail: vi.fn(async (_to: string, _subject: string, _html: string) => undefined),
    insert: vi.fn(async () => ({ error: null })),
}));

vi.mock("@/lib/email/resend", () => ({ sendNotificationEmail }));
vi.mock("@/lib/supabase/server", () => ({
    createClient: vi.fn(),
    createServiceRoleClient: async () => ({
        from: (table: string) =>
            table === "notification"
                ? { insert }
                : {
                      select: () => ({
                          eq: () => ({ maybeSingle: async () => ({ data: { email: "aluno@example.com" } }) }),
                      }),
                  },
    }),
}));

import { createNotification } from "@/lib/api/notifications-server";

describe("createNotification — e-mail", () => {
    beforeEach(() => vi.clearAllMocks());

    it("escapa título e mensagem e descarta link externo", async () => {
        await createNotification({
            userId: "u1",
            type: "chat_message",
            payload: {
                title: "<h1>Conta bloqueada</h1>",
                message: '<a href="https://site-falso.example">Clique</a>',
                href: "@site-falso.example/login",
            },
        });

        const html = sendNotificationEmail.mock.calls[0][2] as string;
        expect(html).not.toContain("<h1>");
        expect(html).not.toContain('<a href="https://site-falso.example"');
        expect(html).toContain("&#60;h1&#62;Conta bloqueada");
        expect(html).not.toContain("site-falso.example/login");
        expect(html).not.toContain("Acessar</a>");
    });

    it("mantém o botão para caminho interno", async () => {
        await createNotification({
            userId: "u1",
            type: "new_enrollment",
            payload: { title: "Robótica", message: "Você foi matriculado.", href: "/course?id=c1" },
        });

        const html = sendNotificationEmail.mock.calls[0][2] as string;
        expect(html).toContain('href="https://mindsofthefuture.com.br/course?id=c1"');
    });
});
