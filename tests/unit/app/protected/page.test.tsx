import type React from "react";
/**
 * Painel /protected: autenticação explícita, papel vindo do perfil (sem
 * chamada duplicada de papel) e carregamento de perfil + cursos em paralelo.
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

const getUserTypeServer = vi.fn();
const getCurrentUserProfile = vi.fn();
const getUserCoursesServer = vi.fn();

vi.mock("@/lib/api/profiles-server", () => ({
    getUserTypeServer: () => getUserTypeServer(),
    getCurrentUserProfile: () => getCurrentUserProfile(),
}));
vi.mock("@/lib/api/enrollments-server", () => ({
    getUserCoursesServer: () => getUserCoursesServer(),
}));

vi.mock("@/components/navbar/navbar", () => ({ default: () => <nav /> }));
vi.mock("@/components/modules/ModulesSection", () => ({ default: () => <div /> }));
vi.mock("@/components/dashboard/courses-section", () => ({
    default: ({ isAdmin }: { isAdmin: boolean }) => (
        <div data-testid="courses-section">{isAdmin ? "admin" : "teacher"}</div>
    ),
}));
vi.mock("@/components/dashboard/users-table", () => ({
    default: () => <div data-testid="users-table" />,
}));
vi.mock("@/components/yourCourses/yourCoursers", () => ({
    YourCourses: ({ initialCursos }: { initialCursos: unknown[] }) => (
        <div data-testid="your-courses">{initialCursos.length}</div>
    ),
}));

import ProtectedPage from "@/app/protected/page";

function deferred<T>() {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>((r) => {
        resolve = r;
    });
    return { promise, resolve };
}

function perfil(role: string, verificationStatus: string | null = null) {
    return { id: "user-1", role, verificationStatus };
}

beforeEach(() => {
    currentUser = { id: "user-1", user_metadata: { full_name: "Ana" } };
    redirectMock.mockClear();
    getUserTypeServer.mockReset();
    getCurrentUserProfile.mockReset();
    getUserCoursesServer.mockReset().mockResolvedValue([{ enrollmentId: "e1" }]);
});

afterEach(() => {
    cleanup();
});

describe("painel /protected — fluxo de carregamento", () => {
    it("redireciona anônimo para /auth sem carregar perfil nem cursos", async () => {
        currentUser = null;
        await expect(ProtectedPage()).rejects.toThrow("NEXT_REDIRECT:/auth");
        expect(getCurrentUserProfile).not.toHaveBeenCalled();
        expect(getUserCoursesServer).not.toHaveBeenCalled();
        expect(getUserTypeServer).not.toHaveBeenCalled();
    });

    it("redireciona para /auth (fail-closed) quando não há perfil", async () => {
        getCurrentUserProfile.mockResolvedValue(null);
        await expect(ProtectedPage()).rejects.toThrow("NEXT_REDIRECT:/auth");
    });

    it("inicia perfil e cursos em paralelo, sem consulta extra de papel", async () => {
        const perfilPendente = deferred<ReturnType<typeof perfil>>();
        const cursosPendentes = deferred<unknown[]>();
        getUserTypeServer.mockResolvedValue("student");
        getCurrentUserProfile.mockReturnValue(perfilPendente.promise);
        getUserCoursesServer.mockReturnValue(cursosPendentes.promise);

        const pagina = ProtectedPage();
        // Deixa a autenticação inicial assentar; nada foi resolvido ainda.
        for (let i = 0; i < 10; i++) await Promise.resolve();

        expect(getCurrentUserProfile).toHaveBeenCalledTimes(1);
        expect(getUserCoursesServer).toHaveBeenCalledTimes(1);
        expect(getUserTypeServer).not.toHaveBeenCalled();

        perfilPendente.resolve(perfil("student"));
        cursosPendentes.resolve([]);
        render(await pagina);
        expect(screen.getByTestId("your-courses")).toHaveTextContent("0");
    });
});

describe("painel /protected — renderização por papel", () => {
    function comPapel(role: string, verificationStatus: string | null = null) {
        // Mantém o mock legado coerente para que o teste valha antes e depois.
        getUserTypeServer.mockResolvedValue(role);
        getCurrentUserProfile.mockResolvedValue(perfil(role, verificationStatus));
    }

    async function renderizar() {
        render((await ProtectedPage()) as React.ReactElement);
    }

    it("aluno: só cursos matriculados", async () => {
        comPapel("student");
        await renderizar();
        expect(screen.getByText("Olá, Ana")).toBeInTheDocument();
        expect(screen.getByTestId("your-courses")).toHaveTextContent("1");
        expect(screen.queryByTestId("courses-section")).toBeNull();
        expect(screen.queryByTestId("users-table")).toBeNull();
        expect(screen.queryByText(/perfil de professor/)).toBeNull();
    });

    it("admin: gestão de cursos e usuários", async () => {
        comPapel("admin");
        await renderizar();
        expect(screen.getByTestId("courses-section")).toHaveTextContent("admin");
        expect(screen.getByTestId("users-table")).toBeInTheDocument();
        expect(screen.queryByText(/perfil de professor/)).toBeNull();
    });

    it("professor aprovado: gestão de cursos, sem usuários nem aviso", async () => {
        comPapel("teacher", "approved");
        await renderizar();
        expect(screen.getByTestId("courses-section")).toHaveTextContent("teacher");
        expect(screen.queryByTestId("users-table")).toBeNull();
        expect(screen.queryByText(/perfil de professor/)).toBeNull();
    });

    it("professor pendente: aviso pendente, sem gestão", async () => {
        comPapel("teacher", "pending");
        await renderizar();
        expect(screen.getByText(/perfil de professor está pendente/)).toBeInTheDocument();
        expect(screen.queryByTestId("courses-section")).toBeNull();
        expect(screen.queryByTestId("users-table")).toBeNull();
    });

    it("professor reprovado: aviso reprovado, sem gestão", async () => {
        comPapel("teacher", "rejected");
        await renderizar();
        expect(screen.getByText(/perfil de professor está reprovado/)).toBeInTheDocument();
        expect(screen.queryByTestId("courses-section")).toBeNull();
    });
});
