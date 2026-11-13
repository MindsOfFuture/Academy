// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const createClientMock = vi.hoisted(() => vi.fn());
const createServiceRoleClientMock = vi.hoisted(() => vi.fn());
const fetchRoleForUserMock = vi.hoisted(() => vi.fn());
const setOnboardingRoleMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
  createServiceRoleClient: createServiceRoleClientMock,
}));
vi.mock("@/lib/api/profiles-server", () => ({
  fetchRoleForUser: fetchRoleForUserMock,
  setOnboardingRole: setOnboardingRoleMock,
}));

import { POST } from "@/app/api/auth/oauth-complete-profile/route";

type Gravacao = { tabela: string; acao: string; valores: Record<string, unknown> };

function montar(perfilAtual: Record<string, unknown> | null) {
  const gravacoes: Gravacao[] = [];
  createClientMock.mockResolvedValue({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u1", email: "a@b.com", user_metadata: {} } }, error: null }) },
  });
  createServiceRoleClientMock.mockResolvedValue({
    from: (tabela: string) => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: perfilAtual, error: null }) }) }),
      update: (valores: Record<string, unknown>) => {
        gravacoes.push({ tabela, acao: "update", valores });
        return { eq: async () => ({ error: null }) };
      },
      insert: async (valores: Record<string, unknown>) => {
        gravacoes.push({ tabela, acao: "insert", valores });
        return { error: null };
      },
    }),
  });
  fetchRoleForUserMock.mockResolvedValue("student");
  return gravacoes;
}

const pedir = (corpo: Record<string, unknown>) =>
  POST(new Request("http://localhost/api/auth/oauth-complete-profile", { method: "POST", body: JSON.stringify(corpo) }));

function nascidoHa(anos: number): string {
  const hoje = new Date();
  const d = new Date(hoje.getFullYear() - anos, hoje.getMonth(), hoje.getDate());
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

describe("POST /api/auth/oauth-complete-profile", () => {
  beforeEach(() => vi.clearAllMocks());

  it("aluno adulto: só nome e nascimento; opcionais vazios não são gravados", async () => {
    const gravacoes = montar({ id: "u1", full_name: "Pessoa", birth_date: null });
    const res = await pedir({ fullName: "Pessoa Teste", birthDate: "2000-01-01", userType: "student" });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, userType: "student" });
    const perfil = gravacoes.find((g) => g.tabela === "user_profile")!;
    expect(perfil.valores).toMatchObject({ full_name: "Pessoa Teste", birth_date: "2000-01-01" });
    expect(perfil.valores).not.toHaveProperty("phone");
    expect(perfil.valores).not.toHaveProperty("document");
    expect(gravacoes.some((g) => g.tabela === "student_details")).toBe(false);
    expect(setOnboardingRoleMock).toHaveBeenCalledWith("u1", "student");
  });

  it("grava opcionais quando vierem", async () => {
    const gravacoes = montar(null);
    const res = await pedir({ fullName: "Pessoa Teste", birthDate: "2000-01-01", phone: "32999999999", address: "Juiz de Fora", document: "12345678901" });
    expect(res.status).toBe(200);
    expect(gravacoes[0]).toMatchObject({ tabela: "user_profile", acao: "insert", valores: { phone: "32999999999", address: "Juiz de Fora", document: "12345678901" } });
  });

  it("aluno menor exige responsável e grava em student_details", async () => {
    montar({ id: "u1", full_name: null, birth_date: null });
    const sem = await pedir({ fullName: "Ana Souza", birthDate: nascidoHa(12) });
    expect(sem.status).toBe(400);

    const gravacoes = montar({ id: "u1", full_name: null, birth_date: null });
    const com = await pedir({ fullName: "Ana Souza", birthDate: nascidoHa(12), parentName: "Maria Souza" });
    expect(com.status).toBe(200);
    expect(gravacoes).toContainEqual({ tabela: "student_details", acao: "update", valores: { parent_name: "Maria Souza" } });
  });

  it("recusa sem nascimento, data inválida ou idade abaixo de 5", async () => {
    montar(null);
    expect((await pedir({ fullName: "Pessoa Teste" })).status).toBe(400);
    expect((await pedir({ fullName: "Pessoa Teste", birthDate: "2000-02-31" })).status).toBe(400);
    expect((await pedir({ fullName: "Pessoa Teste", birthDate: nascidoHa(3) })).status).toBe(400);
  });

  it("professor continua exigindo telefone, endereço e documento", async () => {
    montar(null);
    expect((await pedir({ fullName: "Prof Teste", birthDate: "1980-01-01", userType: "teacher" })).status).toBe(400);
    const ok = await pedir({ fullName: "Prof Teste", birthDate: "1980-01-01", userType: "teacher", phone: "3299999999", address: "JF", document: "12345678901" });
    expect(ok.status).toBe(200);
    expect(setOnboardingRoleMock).toHaveBeenCalledWith("u1", "teacher");
  });

  it("perfil já com nome e nascimento não refaz o onboarding (não troca papel)", async () => {
    montar({ id: "u1", full_name: "Pessoa", birth_date: "2000-01-01", phone: null });
    const res = await pedir({ fullName: "Pessoa Teste", birthDate: "2000-01-01", userType: "teacher", phone: "3299999999", address: "JF", document: "12345678901" });
    expect(res.status).toBe(409);
    expect(setOnboardingRoleMock).not.toHaveBeenCalled();
  });
});
