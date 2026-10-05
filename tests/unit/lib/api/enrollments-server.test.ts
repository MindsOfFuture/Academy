/**
 * getUserCoursesServer: cálculo de progresso e consultas independentes
 * (aulas e progresso) disparadas em paralelo no ponto real do await.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

type Resposta = { data: unknown; error: unknown };

let respostas: Record<string, Resposta>;
let adiadas: Set<string>;
let pendentes: Record<string, () => void>;
let aguardadas: string[];
let usuario: { id: string } | null;

// Builder mínimo: cada tabela só "dispara" quando o await chama then().
function builder(tabela: string) {
    const b: Record<string, unknown> = {};
    for (const m of ["select", "eq", "in"]) b[m] = () => b;
    b.then = (resolve: (r: Resposta) => void) => {
        aguardadas.push(tabela);
        const entregar = () => resolve(respostas[tabela] ?? { data: null, error: null });
        if (adiadas.has(tabela)) pendentes[tabela] = entregar;
        else entregar();
    };
    return b;
}

const from = vi.fn((tabela: string) => builder(tabela));

vi.mock("@/lib/supabase/server", () => ({
    createClient: async () => ({
        auth: { getUser: async () => ({ data: { user: usuario } }) },
        from,
    }),
}));

import { getUserCoursesServer } from "@/lib/api/enrollments-server";

const curso = (id: string) => ({ id, title: `Curso ${id}`, description: null, level: null, status: "published", thumb: null });

beforeEach(() => {
    usuario = { id: "user-1" };
    adiadas = new Set();
    pendentes = {};
    aguardadas = [];
    from.mockClear();
    respostas = {
        enrollment: {
            data: [
                { id: "e1", status: "active", course: curso("c1") },
                { id: "e2", status: null, course: curso("c2") },
                { id: "e3", status: "active", course: null },
            ],
            error: null,
        },
        lesson: {
            data: [
                { id: "l1", course_id: "c1" },
                { id: "l2", course_id: "c1" },
                { id: "l3", course_id: "c1" },
                { id: "lx", course_id: null },
            ],
            error: null,
        },
        lesson_progress: {
            data: [
                { enrollment_id: "e1", lesson_id: "l1", is_completed: true },
                { enrollment_id: "e1", lesson_id: "l1", is_completed: true },
                { enrollment_id: "e1", lesson_id: "l2", is_completed: false },
            ],
            error: null,
        },
    };
});

describe("getUserCoursesServer", () => {
    it("aguarda aulas e progresso ao mesmo tempo", async () => {
        adiadas = new Set(["lesson", "lesson_progress"]);
        const resultado = getUserCoursesServer();
        for (let i = 0; i < 10; i++) await Promise.resolve();

        expect(aguardadas).toEqual(expect.arrayContaining(["enrollment", "lesson", "lesson_progress"]));

        pendentes.lesson();
        pendentes.lesson_progress();
        await expect(resultado).resolves.toHaveLength(2);
    });

    it("calcula progresso e descarta matrícula sem curso", async () => {
        const resultado = await getUserCoursesServer();
        expect(resultado).toEqual([
            expect.objectContaining({ enrollmentId: "e1", status: "active", totalLessons: 3, completedLessons: 1, progressPercent: 33 }),
            expect.objectContaining({ enrollmentId: "e2", status: null, totalLessons: 0, completedLessons: 0, progressPercent: 0 }),
        ]);
        expect(resultado[0].course).toMatchObject({ id: "c1", title: "Curso c1" });
    });

    it("trata falha nas aulas/progresso como zero, sem quebrar", async () => {
        respostas.lesson = { data: null, error: { message: "x" } };
        respostas.lesson_progress = { data: null, error: { message: "y" } };
        const resultado = await getUserCoursesServer();
        expect(resultado.map((r) => r.progressPercent)).toEqual([0, 0]);
    });

    it("sem usuário devolve [] sem consultar", async () => {
        usuario = null;
        await expect(getUserCoursesServer()).resolves.toEqual([]);
        expect(from).not.toHaveBeenCalled();
    });

    it("erro nas matrículas devolve []", async () => {
        respostas.enrollment = { data: null, error: { message: "falhou" } };
        await expect(getUserCoursesServer()).resolves.toEqual([]);
        expect(aguardadas).toEqual(["enrollment"]);
    });

    it("sem curso válido devolve [] sem consultar aulas", async () => {
        respostas.enrollment = { data: [{ id: "e3", status: "active", course: null }], error: null };
        await expect(getUserCoursesServer()).resolves.toEqual([]);
        expect(aguardadas).toEqual(["enrollment"]);
    });
});
