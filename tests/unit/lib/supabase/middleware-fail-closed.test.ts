// @vitest-environment node
/**
 * ⚠️ TESTE DE REGRESSÃO DE SEGURANÇA — NÃO APAGUE, NÃO AFROUXE.
 *
 * O middleware do Academy já teve uma falha FAIL-OPEN: quando as variáveis de
 * ambiente do Supabase estavam ausentes, o gate `hasEnvVars` virava `false` e o
 * middleware LIBERAVA TODAS AS ROTAS sem autenticação nenhuma. Um deploy com
 * `.env` incompleto expunha a aplicação inteira em silêncio.
 *
 * O comportamento correto é FAIL-CLOSED: sem env var não há como autenticar
 * ninguém, então o middleware NEGA (503) em vez de liberar. Apenas assets
 * estáticos e o health check seguem passando, para preservar a resposta de erro
 * e a observabilidade operacional.
 *
 * Estes testes existem para que ninguém reintroduza o bypass. Se um deles
 * começar a falhar, a resposta certa é consertar o middleware — NUNCA relaxar,
 * pular (`it.skip`) ou remover o teste. Um teste vermelho aqui significa que a
 * autenticação pode estar sendo contornada em produção.
 *
 * Contexto: lib/supabase/middleware.ts (updateSession, isExemptPath) e
 * lib/env.ts (missingSupabaseEnv).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const VALID_URL = "https://project.supabase.co";
const VALID_ANON_KEY = "anon-key-de-teste";

/** Última implementação de `getUser` injetada no mock do createServerClient. */
let getUserImpl: () => Promise<{ data: { user: unknown | null } }>;

vi.mock("@supabase/ssr", () => ({
    createServerClient: vi.fn(() => ({
        auth: {
            getUser: () => getUserImpl(),
        },
    })),
}));

function makeRequest(pathname: string, search = ""): NextRequest {
    return new NextRequest(new URL(`${pathname}${search}`, "https://academy.test"));
}

/** `NextResponse.next()` é sinalizado por este header interno do Next. */
function isPermissiveNext(response: Response): boolean {
    return response.headers.get("x-middleware-next") === "1";
}

function setEnv(url: string | undefined, anonKey: string | undefined) {
    if (url === undefined) {
        delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    } else {
        process.env.NEXT_PUBLIC_SUPABASE_URL = url;
    }
    if (anonKey === undefined) {
        delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    } else {
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = anonKey;
    }
}

let envSnapshot: NodeJS.ProcessEnv;
let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

// Importado dinamicamente dentro dos testes não é necessário: `missingSupabaseEnv`
// lê `process.env` em tempo de chamada, então o import estático é seguro.
import { updateSession, isExemptPath } from "@/lib/supabase/middleware";

beforeEach(() => {
    envSnapshot = { ...process.env };
    getUserImpl = async () => ({ data: { user: null } });
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => { });
});

afterEach(() => {
    process.env = { ...envSnapshot };
    consoleErrorSpy.mockRestore();
    vi.clearAllMocks();
});

describe("updateSession — fail-closed sem env vars do Supabase", () => {
    const PROTECTED_PATHS = ["/protected", "/dashboard", "/api/courses"];

    it.each(PROTECTED_PATHS)(
        "nega %s com 503 quando as duas env vars estão ausentes (não é next() permissivo)",
        async (pathname) => {
            setEnv(undefined, undefined);

            const response = await updateSession(makeRequest(pathname));

            expect(isPermissiveNext(response)).toBe(false);
            expect(response.status).toBe(503);
        },
    );

    it("nega quando apenas a URL está ausente", async () => {
        setEnv(undefined, VALID_ANON_KEY);

        const response = await updateSession(makeRequest("/protected"));

        expect(isPermissiveNext(response)).toBe(false);
        expect(response.status).toBe(503);
    });

    it("nega quando apenas a anon key está ausente", async () => {
        setEnv(VALID_URL, undefined);

        const response = await updateSession(makeRequest("/protected"));

        expect(isPermissiveNext(response)).toBe(false);
        expect(response.status).toBe(503);
    });

    it("trata string vazia como ausente e nega", async () => {
        setEnv("", "");

        const response = await updateSession(makeRequest("/protected"));

        expect(isPermissiveNext(response)).toBe(false);
        expect(response.status).toBe(503);
    });

    it("trata string só com espaços em branco como ausente e nega", async () => {
        setEnv("   ", "\t\n ");

        const response = await updateSession(makeRequest("/protected"));

        expect(isPermissiveNext(response)).toBe(false);
        expect(response.status).toBe(503);
    });

    it("nega também rotas públicas (elas dependem do Supabase para renderizar)", async () => {
        setEnv(undefined, undefined);

        const response = await updateSession(makeRequest("/auth"));

        expect(isPermissiveNext(response)).toBe(false);
        expect(response.status).toBe(503);
    });

    it("não vaza nome de variável nem detalhe de config no corpo da resposta", async () => {
        setEnv(undefined, undefined);

        const response = await updateSession(makeRequest("/protected"));
        const body = await response.text();

        expect(body).not.toMatch(/NEXT_PUBLIC_SUPABASE/i);
        expect(body).not.toMatch(/supabase/i);
        expect(response.headers.get("Cache-Control")).toBe("no-store");
    });

    it("sequer instancia o client do Supabase quando falta env", async () => {
        setEnv(undefined, undefined);
        const { createServerClient } = await import("@supabase/ssr");

        await updateSession(makeRequest("/protected"));

        expect(createServerClient).not.toHaveBeenCalled();
    });
});

describe("updateSession — rotas isentas continuam acessíveis sem env vars", () => {
    const EXEMPT_PATHS = [
        "/_next/static/chunks/main.js",
        "/_next/image",
        "/api/health",
        "/favicon.ico",
        "/logo.svg",
        "/hero.png",
        "/foto.jpeg",
        "/banner.webp",
    ];

    it.each(EXEMPT_PATHS)("libera %s mesmo sem env vars", async (pathname) => {
        setEnv(undefined, undefined);

        const response = await updateSession(makeRequest(pathname));

        expect(response.status).toBe(200);
        expect(isPermissiveNext(response)).toBe(true);
    });

    it("isExemptPath não isenta rotas de aplicação", () => {
        expect(isExemptPath("/protected")).toBe(false);
        expect(isExemptPath("/dashboard")).toBe(false);
        expect(isExemptPath("/api/courses")).toBe(false);
        expect(isExemptPath("/")).toBe(false);
    });
});

describe("updateSession — comportamento original preservado com env vars presentes", () => {
    beforeEach(() => {
        setEnv(VALID_URL, VALID_ANON_KEY);
    });

    it("sem sessão em rota protegida: redireciona para /auth preservando o ?next", async () => {
        getUserImpl = async () => ({ data: { user: null } });

        const response = await updateSession(makeRequest("/protected", "?tab=perfil"));

        expect(response.status).toBe(307);
        const location = new URL(response.headers.get("location") as string);
        expect(location.pathname).toBe("/auth");
        expect(location.searchParams.get("next")).toBe("/protected?tab=perfil");
    });

    it("sem sessão em rota pública: passa sem redirect", async () => {
        getUserImpl = async () => ({ data: { user: null } });

        const response = await updateSession(makeRequest("/artigos"));

        expect(response.status).toBe(200);
        expect(isPermissiveNext(response)).toBe(true);
    });

    it("com sessão válida em rota protegida: passa", async () => {
        getUserImpl = async () => ({ data: { user: { id: "user-1" } } });

        const response = await updateSession(makeRequest("/protected"));

        expect(response.status).toBe(200);
        expect(isPermissiveNext(response)).toBe(true);
    });

    it("getUser lançando erro em rota protegida: trata como sem sessão e redireciona", async () => {
        getUserImpl = async () => {
            throw new Error("supabase indisponível");
        };

        const response = await updateSession(makeRequest("/protected"));

        expect(response.status).toBe(307);
        expect(isPermissiveNext(response)).toBe(false);
    });
});

/**
 * Módulos especiais logados: as quatro rotas canônicas não são públicas e
 * dependem exclusivamente da sessão — nada de matrícula, papel ou linha no
 * Supabase. Deep link anônimo precisa cair em /auth com o `next` intacto.
 */
import { isPublicPath } from "@/lib/supabase/middleware";

const MODULE_PATHS = [
    "/protected/modulos/educacao-financeira",
    "/protected/modulos/educacao-financeira/financity",
    "/protected/modulos/educacao-financeira/cidadania-financeira",
    "/protected/modulos/laboratorio-de-gestao",
];

describe("updateSession — deep links dos módulos especiais", () => {
    it.each(MODULE_PATHS)("%s não é rota pública", (pathname) => {
        expect(isPublicPath(pathname)).toBe(false);
    });

    it.each(MODULE_PATHS)(
        "anônimo em %s redireciona para /auth com o next exato",
        async (pathname) => {
            setEnv(VALID_URL, VALID_ANON_KEY);
            getUserImpl = async () => ({ data: { user: null } });

            const response = await updateSession(makeRequest(pathname));

            expect(response.status).toBe(307);
            const location = new URL(response.headers.get("location") as string);
            expect(location.pathname).toBe("/auth");
            expect(location.searchParams.get("next")).toBe(pathname);
        },
    );

    it.each(MODULE_PATHS)("usuário autenticado passa em %s", async (pathname) => {
        setEnv(VALID_URL, VALID_ANON_KEY);
        getUserImpl = async () => ({ data: { user: { id: "user-1" } } });

        const response = await updateSession(makeRequest(pathname));

        expect(response.status).toBe(200);
        expect(isPermissiveNext(response)).toBe(true);
    });

    it.each(MODULE_PATHS)("sem env vars, %s responde 503 (fail-closed)", async (pathname) => {
        setEnv(undefined, undefined);

        const response = await updateSession(makeRequest(pathname));

        expect(isPermissiveNext(response)).toBe(false);
        expect(response.status).toBe(503);
    });
});
