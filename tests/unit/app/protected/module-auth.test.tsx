/**
 * Guard de rota das páginas de módulos especiais.
 *
 * O middleware já é fail-closed, mas cada página canônica carrega o seu próprio
 * guard de servidor (defesa em profundidade): sem sessão, redireciona para
 * /auth?next=<caminho canônico exato>; com sessão, renderiza.
 */
import { render, screen, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const redirectMock = vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
});

vi.mock("next/navigation", () => ({
    redirect: (url: string) => redirectMock(url),
}));

let currentUser: { id: string; user_metadata: { full_name?: string } } | null = null;
let currentUserType = "student";

vi.mock("@/lib/supabase/server", () => ({
    createClient: async () => ({
        auth: {
            getUser: async () => ({
                data: { user: currentUser },
                error: currentUser ? null : { message: "no session" },
            }),
        },
    }),
}));

// Dependências pesadas do painel — o que importa aqui é a seção Módulos.
vi.mock("@/components/navbar/navbar", () => ({ default: () => <nav /> }));
vi.mock("@/components/dashboard/courses-section", () => ({ default: () => <div /> }));
vi.mock("@/components/dashboard/users-table", () => ({ default: () => <div /> }));
vi.mock("@/components/yourCourses/yourCoursers", () => ({ YourCourses: () => <div /> }));
vi.mock("@/lib/api/enrollments-server", () => ({ getUserCoursesServer: async () => [] }));
vi.mock("@/lib/api/profiles-server", () => ({
    getUserTypeServer: async () => currentUserType,
    getCurrentUserProfile: async () => ({ verificationStatus: "approved" }),
}));

import { requireModuleUser } from "@/app/protected/modulos/require-user";
import EducacaoFinanceiraPage from "@/app/protected/modulos/educacao-financeira/page";
import FinancityPage from "@/app/protected/modulos/educacao-financeira/financity/page";
import CidadaniaPage from "@/app/protected/modulos/educacao-financeira/cidadania-financeira/page";
import LaboratorioPage from "@/app/protected/modulos/laboratorio-de-gestao/page";
import ProtectedPage from "@/app/protected/page";

const PAGINAS = [
    {
        nome: "Educação Financeira",
        caminho: "/protected/modulos/educacao-financeira",
        Page: EducacaoFinanceiraPage,
        marcador: /Educação Financeira/,
    },
    {
        nome: "Financity",
        caminho: "/protected/modulos/educacao-financeira/financity",
        Page: FinancityPage,
        marcador: /Orçamento Familiar do Futuro/,
    },
    {
        nome: "Cidadania Financeira",
        caminho: "/protected/modulos/educacao-financeira/cidadania-financeira",
        Page: CidadaniaPage,
        marcador: /Cidadania Financeira/,
    },
    {
        nome: "Laboratório de Gestão",
        caminho: "/protected/modulos/laboratorio-de-gestao",
        Page: LaboratorioPage,
        marcador: /Primeiro Passo/,
    },
] as const;

beforeEach(() => {
    currentUser = null;
    currentUserType = "student";
    redirectMock.mockClear();
    window.localStorage.clear();
});

afterEach(() => {
    cleanup();
});

describe("requireModuleUser", () => {
    it("redireciona para /auth preservando o caminho canônico quando não há sessão", async () => {
        currentUser = null;
        await expect(
            requireModuleUser("/protected/modulos/laboratorio-de-gestao"),
        ).rejects.toThrow(/NEXT_REDIRECT/);
        expect(redirectMock).toHaveBeenCalledWith(
            "/auth?next=%2Fprotected%2Fmodulos%2Flaboratorio-de-gestao",
        );
    });

    it("devolve o usuário autenticado sem redirecionar", async () => {
        currentUser = { id: "user-1", user_metadata: {} };
        await expect(
            requireModuleUser("/protected/modulos/laboratorio-de-gestao"),
        ).resolves.toMatchObject({ id: "user-1" });
        expect(redirectMock).not.toHaveBeenCalled();
    });
});

describe.each(PAGINAS)("página $nome", ({ caminho, Page, marcador }) => {
    it("redireciona anônimo para /auth?next=<caminho canônico>", async () => {
        currentUser = null;
        await expect(Page()).rejects.toThrow(/NEXT_REDIRECT/);
        expect(redirectMock).toHaveBeenCalledWith(
            `/auth?next=${encodeURIComponent(caminho)}`,
        );
    });

    it("renderiza para usuário autenticado, sem depender de matrícula ou papel", async () => {
        currentUser = { id: "user-1", user_metadata: {} };
        render(await Page());
        expect(redirectMock).not.toHaveBeenCalled();
        expect(screen.getAllByText(marcador).length).toBeGreaterThan(0);
        expect(screen.getByRole("link", { name: /Voltar para o Academy/ })).toHaveAttribute(
            "href",
            "/protected",
        );
    });
});

describe("painel /protected", () => {
    it.each(["student", "teacher", "admin"])(
        "mostra a seção Módulos para o papel %s",
        async (papel) => {
            currentUser = { id: "user-1", user_metadata: {} };
            currentUserType = papel;

            render(await ProtectedPage());

            expect(
                screen.getByRole("heading", { level: 2, name: "Módulos" }),
            ).toBeInTheDocument();
            expect(
                screen.getByRole("link", { name: /Educação Financeira/ }),
            ).toHaveAttribute("href", "/protected/modulos/educacao-financeira");
            expect(
                screen.getByRole("link", { name: /Laboratório de Gestão/ }),
            ).toHaveAttribute("href", "/protected/modulos/laboratorio-de-gestao");
        },
    );
});
