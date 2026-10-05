import type React from "react";
/**
 * Painel /protected: uma única autenticação explícita (getUser), e o mesmo
 * cliente + usuário verificados alimentam, em paralelo, o acesso estreito
 * (papel + verification_status) e a leitura de cursos — sem o perfil completo
 * nem as Server Actions que reautenticam.
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
let authError: { message: string } | null = null;
const getUser = vi.fn(async () => ({
    data: { user: currentUser },
    error: authError ?? (currentUser ? null : { message: "no session" }),
}));
const from = vi.fn();
const clientes: unknown[] = [];

vi.mock("@/lib/supabase/server", () => ({
    createClient: async () => {
        const cliente = { auth: { getUser }, from };
        clientes.push(cliente);
        return cliente;
    },
}));

// Caminho antigo (perfil completo + Server Action que reautentica): não deve rodar.
const getUserTypeServer = vi.fn();
const getCurrentUserProfile = vi.fn();
const getUserCoursesServer = vi.fn();
const getDashboardAccess = vi.fn();
const readUserCourses = vi.fn();

vi.mock("@/lib/api/dashboard-server", () => ({
    getDashboardAccess: (...a: unknown[]) => getDashboardAccess(...a),
}));
vi.mock("@/lib/api/enrollments-read-server", () => ({
    readUserCourses: (...a: unknown[]) => readUserCourses(...a),
}));

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
    return { role, verificationStatus };
}

function semCaminhoAntigo() {
    expect(getCurrentUserProfile).not.toHaveBeenCalled();
    expect(getUserCoursesServer).not.toHaveBeenCalled();
    expect(getUserTypeServer).not.toHaveBeenCalled();
}

beforeEach(() => {
    currentUser = { id: "user-1", user_metadata: { full_name: "Ana" } };
    authError = null;
    clientes.length = 0;
    redirectMock.mockClear();
    getUser.mockClear();
    from.mockReset();
    getUserTypeServer.mockReset();
    getCurrentUserProfile.mockReset();
    getUserCoursesServer.mockReset();
    getDashboardAccess.mockReset().mockResolvedValue(perfil("student"));
    readUserCourses.mockReset().mockResolvedValue([{ enrollmentId: "e1" }]);
});

afterEach(() => {
    cleanup();
});

describe("painel /protected — fluxo de carregamento", () => {
    it("redireciona anônimo para /auth sem nenhuma leitura de dados", async () => {
        currentUser = null;
        await expect(ProtectedPage()).rejects.toThrow("NEXT_REDIRECT:/auth");
        semCaminhoAntigo();
        expect(getDashboardAccess).not.toHaveBeenCalled();
        expect(readUserCourses).not.toHaveBeenCalled();
        expect(from).not.toHaveBeenCalled();
    });

    it("erro de autenticação (mesmo com usuário no payload) redireciona sem ler dados", async () => {
        authError = { message: "jwt inválido" };
        await expect(ProtectedPage()).rejects.toThrow("NEXT_REDIRECT:/auth");
        semCaminhoAntigo();
        expect(getDashboardAccess).not.toHaveBeenCalled();
        expect(readUserCourses).not.toHaveBeenCalled();
        expect(from).not.toHaveBeenCalled();
    });

    it("autentica uma vez e passa o mesmo cliente + usuário verificados às leituras", async () => {
        render((await ProtectedPage()) as React.ReactElement);
        expect(getUser).toHaveBeenCalledTimes(1);
        expect(clientes).toHaveLength(1);
        expect(getDashboardAccess).toHaveBeenCalledWith(clientes[0], currentUser);
        expect(readUserCourses).toHaveBeenCalledWith(clientes[0], "user-1");
        semCaminhoAntigo();
    });

    it("inicia acesso e cursos em paralelo", async () => {
        const perfilPendente = deferred<ReturnType<typeof perfil>>();
        const cursosPendentes = deferred<unknown[]>();
        getDashboardAccess.mockReturnValue(perfilPendente.promise);
        readUserCourses.mockReturnValue(cursosPendentes.promise);

        const pagina = ProtectedPage();
        // Deixa a autenticação inicial assentar; nada foi resolvido ainda.
        for (let i = 0; i < 10; i++) await Promise.resolve();

        expect(getDashboardAccess).toHaveBeenCalledTimes(1);
        expect(readUserCourses).toHaveBeenCalledTimes(1);
        semCaminhoAntigo();

        perfilPendente.resolve(perfil("student"));
        cursosPendentes.resolve([]);
        render(await pagina);
        expect(screen.getByTestId("your-courses")).toHaveTextContent("0");
    });
});

describe("painel /protected — renderização por papel", () => {
    function comPapel(role: string, verificationStatus: string | null = null) {
        getDashboardAccess.mockResolvedValue(perfil(role, verificationStatus));
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

    it("professor sem linha de perfil (status null): aviso pendente, sem gestão", async () => {
        comPapel("teacher", null);
        await renderizar();
        expect(screen.getByText(/perfil de professor está pendente/)).toBeInTheDocument();
        expect(screen.queryByTestId("courses-section")).toBeNull();
    });

    it("nome cai para Fulano sem full_name", async () => {
        currentUser = { id: "user-1", user_metadata: {} };
        comPapel("student");
        await renderizar();
        expect(screen.getByText("Olá, Fulano")).toBeInTheDocument();
    });
});
