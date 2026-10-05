/**
 * getDashboardAccess: só papel canônico + verification_status, no mesmo
 * cliente/usuário já autenticados pelo chamador, com as duas leituras em
 * paralelo e sem tocar teacher_request/documentos.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({
    createClient: vi.fn(),
    createAdminClient: vi.fn(),
    createServiceRoleClient: vi.fn(),
}));
vi.mock("@/lib/api/notifications-server", () => ({ notifyAdmins: vi.fn(), createNotification: vi.fn() }));

type Resposta = { data: unknown; error: unknown };

let respostas: Record<string, Resposta>;
let adiadas: Set<string>;
let pendentes: Record<string, () => void>;
let aguardadas: string[];
let consultas: Array<{ tabela: string; select?: string; filtros: unknown[][] }>;

function builder(tabela: string) {
    const consulta = { tabela, select: undefined as string | undefined, filtros: [] as unknown[][] };
    consultas.push(consulta);
    const b: Record<string, unknown> = {};
    b.select = (s: string) => ((consulta.select = s), b);
    for (const m of ["eq", "in"]) b[m] = (...args: unknown[]) => (consulta.filtros.push([m, ...args]), b);
    b.maybeSingle = () => b;
    b.then = (resolve: (r: Resposta) => void) => {
        aguardadas.push(tabela);
        const entregar = () => resolve(respostas[tabela] ?? { data: null, error: null });
        if (adiadas.has(tabela)) pendentes[tabela] = entregar;
        else entregar();
    };
    return b;
}

const from = vi.fn((tabela: string) => builder(tabela));
const getUser = vi.fn();
const supabase = { from, auth: { getUser } };

import { getDashboardAccess } from "@/lib/api/dashboard-server";

const usuario = { id: "user-1" };

function comPapeis(nomes: string[], status: string | null) {
    respostas.user_role = { data: nomes.map((_, i) => ({ role_id: i + 1 })), error: null };
    respostas.role = { data: nomes.map((name) => ({ name })), error: null };
    respostas.user_profile = { data: status === undefined ? null : { verification_status: status }, error: null };
}

beforeEach(() => {
    respostas = {};
    adiadas = new Set();
    pendentes = {};
    aguardadas = [];
    consultas = [];
    from.mockClear();
    getUser.mockReset();
});

describe("getDashboardAccess", () => {
    it("lê papel e status em paralelo, só do usuário recebido, sem reautenticar", async () => {
        comPapeis(["teacher"], "approved");
        adiadas = new Set(["user_role", "user_profile"]);
        const resultado = getDashboardAccess(supabase as never, usuario);
        for (let i = 0; i < 10; i++) await Promise.resolve();

        expect(aguardadas).toEqual(expect.arrayContaining(["user_role", "user_profile"]));

        pendentes.user_role();
        pendentes.user_profile();
        await expect(resultado).resolves.toEqual({ role: "teacher", verificationStatus: "approved" });

        expect(getUser).not.toHaveBeenCalled();
        const perfil = consultas.find((c) => c.tabela === "user_profile");
        expect(perfil?.select).toBe("verification_status");
        expect(perfil?.filtros).toEqual([["eq", "id", "user-1"]]);
        expect(consultas.find((c) => c.tabela === "user_role")?.filtros).toEqual([["eq", "user_profile_id", "user-1"]]);
    });

    it("não consulta teacher_request, documentos nem teacher_details", async () => {
        comPapeis(["teacher"], "rejected");
        await getDashboardAccess(supabase as never, usuario);
        const tabelas = consultas.map((c) => c.tabela);
        expect(tabelas).not.toContain("teacher_request");
        expect(tabelas).not.toContain("teacher_details");
        expect(new Set(tabelas)).toEqual(new Set(["user_role", "role", "user_profile"]));
    });

    it.each([
        [["admin", "teacher"], "approved", "admin"],
        [["teacher", "student"], "pending", "teacher"],
        [["student"], null, "student"],
        [[], null, "student"],
    ])("precedência de papel %j → %s", async (nomes, status, esperado) => {
        comPapeis(nomes, status);
        await expect(getDashboardAccess(supabase as never, usuario)).resolves.toEqual({
            role: esperado,
            verificationStatus: status,
        });
    });

    it("perfil ausente ou com erro cai para verificationStatus null", async () => {
        comPapeis(["teacher"], null);
        respostas.user_profile = { data: null, error: { message: "falhou" } };
        await expect(getDashboardAccess(supabase as never, usuario)).resolves.toEqual({
            role: "teacher",
            verificationStatus: null,
        });
    });
});
