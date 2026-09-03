import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createMockSupabaseClient,
  mockAuthenticatedUser,
  mockQueryResponse,
  mockUnauthenticatedUser,
  type MockSupabaseClient,
} from "@/tests/mocks/supabase";

const CHAIN_METHODS = ["select", "insert", "update", "delete", "eq", "in", "order", "limit"] as const;
const EXTRA_FILTERS = ["or", "not", "range"] as const;
type ExtraFilter = (typeof EXTRA_FILTERS)[number];

type MockClient = MockSupabaseClient & {
  /** Espiões dos filtros que o mock compartilhado não expõe. */
  filters: Record<ExtraFilter, ReturnType<typeof vi.fn>>;
  auth: MockSupabaseClient["auth"] & {
    admin: {
      deleteUser: ReturnType<typeof vi.fn>;
      updateUserById: ReturnType<typeof vi.fn>;
    };
  };
};

/**
 * O mock de tests/mocks/supabase só encadeia select/insert/update/delete/eq/in/
 * order/limit, mas profiles-server também usa `.or`, `.not` e `.range` (e o
 * cliente admin usa `auth.admin.*`). Cada elo da cadeia é envolvido para
 * repassar esses filtros — registrando as chamadas — sem alterar a fila FIFO
 * de respostas, que continua sendo alimentada por `mockQueryResponse`.
 */
function createClientMock(): MockClient {
  const client = createMockSupabaseClient() as MockClient;
  client.filters = Object.fromEntries(
    EXTRA_FILTERS.map((name) => [name, vi.fn()]),
  ) as MockClient["filters"];
  client.auth.admin = { deleteUser: vi.fn(), updateUserById: vi.fn() };

  type Link = Record<string, unknown>;
  const wrap = (link: Link): Link => {
    if (link.__wrapped) return link;
    link.__wrapped = true;
    for (const method of CHAIN_METHODS) {
      const inner = link[method] as (...args: unknown[]) => Link;
      link[method] = (...args: unknown[]) => wrap(inner(...args));
    }
    for (const name of EXTRA_FILTERS) {
      link[name] = (...args: unknown[]) => {
        client.filters[name](...args);
        return link;
      };
    }
    return link;
  };

  const from = client.from.getMockImplementation() as (table: string) => Link;
  client.from.mockImplementation((table: string) => wrap(from(table)));
  return client;
}

let mockClient: MockClient;

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => mockClient,
  createAdminClient: vi.fn(),
  createServiceRoleClient: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/api/notifications-server", () => ({
  notifyAdmins: vi.fn(),
  createNotification: vi.fn(),
}));

import { revalidatePath } from "next/cache";
import { createAdminClient, createServiceRoleClient } from "@/lib/supabase/server";
import { createNotification, notifyAdmins } from "@/lib/api/notifications-server";
import {
  deleteUserAction,
  ensureCurrentTeacherVerifiedForPublishing,
  fetchRoleForUser,
  getAllUsers,
  getCurrentUserProfile,
  getUserTypeServer,
  getUsersPage,
  mapRoleFromLinks,
  setOnboardingRole,
  setTeacherVerificationStatusByAdmin,
  updateCurrentTeacherProfileWithReverification,
  updateUserAction,
} from "@/lib/api/profiles-server";

let adminClient: MockClient;
let serviceRoleClient: MockClient;

const mockedCreateAdminClient = createAdminClient as unknown as ReturnType<typeof vi.fn>;
const mockedCreateServiceRoleClient = createServiceRoleClient as unknown as ReturnType<typeof vi.fn>;

const asServerClient = (client: MockClient) =>
  client as unknown as Parameters<typeof fetchRoleForUser>[1];

/** Enfileira as duas consultas de resolução de papel (user_role + role). */
function queueRole(client: MockClient, roleName: string | null, roleId = 2) {
  if (roleName === null) {
    mockQueryResponse(client, []);
    return;
  }
  mockQueryResponse(client, [{ role_id: roleId }]);
  mockQueryResponse(client, [{ name: roleName }]);
}

function queueTeacher(status: "pending" | "approved" | "rejected") {
  queueRole(mockClient, "teacher");
  mockQueryResponse(mockClient, { verification_status: status });
}

/** getUsersPage lê `count` do mesmo resultado; a fila padrão só carrega data/error. */
function mockCountedResponse(client: MockClient, data: unknown, count: number | null) {
  client.queryResponses.push({ data, error: null, count } as { data: unknown; error: unknown });
}

function formDataOf(entries: Record<string, string>) {
  const form = new FormData();
  for (const [key, value] of Object.entries(entries)) form.set(key, value);
  return form;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockClient = createClientMock();
  adminClient = createClientMock();
  serviceRoleClient = createClientMock();
  mockedCreateAdminClient.mockResolvedValue(adminClient);
  mockedCreateServiceRoleClient.mockResolvedValue(serviceRoleClient);
  mockAuthenticatedUser(mockClient, "teacher-1");
});

describe("fetchRoleForUser", () => {
  it("assume student quando não há vínculo de papel", async () => {
    mockQueryResponse(mockClient, []);

    await expect(fetchRoleForUser("u-1", asServerClient(mockClient))).resolves.toBe("student");
    expect(mockClient.from).toHaveBeenCalledTimes(1);
  });

  it("ignora role_id não numérico e assume student", async () => {
    mockQueryResponse(mockClient, [{ role_id: null }, { role_id: "2" }]);

    await expect(fetchRoleForUser("u-1", asServerClient(mockClient))).resolves.toBe("student");
    expect(mockClient.from).toHaveBeenCalledTimes(1);
  });

  it("dá precedência a admin sobre teacher e student", async () => {
    mockQueryResponse(mockClient, [{ role_id: 1 }, { role_id: 2 }, { role_id: 3 }]);
    mockQueryResponse(mockClient, [{ name: "student" }, { name: "teacher" }, { name: "admin" }]);

    await expect(fetchRoleForUser("u-1", asServerClient(mockClient))).resolves.toBe("admin");
  });

  it("dá precedência a teacher sobre student", async () => {
    mockQueryResponse(mockClient, [{ role_id: 2 }, { role_id: 3 }]);
    mockQueryResponse(mockClient, [{ name: "student" }, { name: "teacher" }]);

    await expect(fetchRoleForUser("u-1", asServerClient(mockClient))).resolves.toBe("teacher");
  });

  it("resolve student quando é o único papel", async () => {
    queueRole(mockClient, "student", 3);

    await expect(fetchRoleForUser("u-1", asServerClient(mockClient))).resolves.toBe("student");
  });

  it("retorna unknown para papel fora do domínio", async () => {
    queueRole(mockClient, "fantasma", 9);

    await expect(fetchRoleForUser("u-1", asServerClient(mockClient))).resolves.toBe("unknown");
  });
});

describe("mapRoleFromLinks", () => {
  it("lê o papel quando o join volta como objeto", () => {
    expect(mapRoleFromLinks("u-1", [{ user_profile_id: "u-1", role: { name: "admin" } }])).toBe("admin");
  });

  it("lê o papel quando o join volta como array", () => {
    expect(mapRoleFromLinks("u-1", [{ user_profile_id: "u-1", role: [{ name: "teacher" }] }])).toBe("teacher");
  });

  it("cai para student quando não há vínculo do usuário", () => {
    expect(mapRoleFromLinks("u-1", [{ user_profile_id: "u-2", role: { name: "admin" } }])).toBe("student");
  });

  it("cai para student quando o papel é desconhecido ou nulo", () => {
    expect(mapRoleFromLinks("u-1", [{ user_profile_id: "u-1", role: { name: "fantasma" } }])).toBe("student");
    expect(mapRoleFromLinks("u-1", [{ user_profile_id: "u-1", role: null }])).toBe("student");
  });
});

describe("getUserTypeServer", () => {
  it("exige sessão autenticada", async () => {
    mockUnauthenticatedUser(mockClient);

    await expect(getUserTypeServer()).rejects.toThrow("Usuário não autenticado.");
  });

  it("resolve o papel do usuário autenticado", async () => {
    queueRole(mockClient, "teacher");

    await expect(getUserTypeServer()).resolves.toBe("teacher");
  });
});

describe("getCurrentUserProfile", () => {
  it("retorna null sem sessão", async () => {
    mockUnauthenticatedUser(mockClient);

    await expect(getCurrentUserProfile()).resolves.toBeNull();
    expect(mockClient.from).not.toHaveBeenCalled();
  });

  it("monta perfil de professor reprovado com detalhes e motivo", async () => {
    queueRole(mockClient, "teacher");
    mockQueryResponse(mockClient, {
      full_name: "Prof Ana",
      email: "ana@escola.br",
      avatar_url: "ana.png",
      bio: "bio",
      phone: "31999",
      address: "Rua 1",
      specialties: ["robótica"],
      certifications: ["cert-1"],
      verification_status: "rejected",
    });
    mockQueryResponse(mockClient, { schools: ["EE Central"], education_level: "superior", degree: "Engenharia" });
    mockQueryResponse(mockClient, {
      status: "rejected",
      observations: "Documento ilegível",
      qualification_document_url: "diploma.pdf",
    });

    const profile = await getCurrentUserProfile();

    expect(profile).toMatchObject({
      id: "teacher-1",
      email: "ana@escola.br",
      displayName: "Prof Ana",
      role: "teacher",
      verificationStatus: "rejected",
      verificationReason: "Documento ilegível",
      verificationDocumentUrl: "diploma.pdf",
      schools: ["EE Central"],
      educationLevel: "superior",
      degree: "Engenharia",
    });
  });

  it("usa fallbacks quando o perfil do estudante está vazio", async () => {
    mockAuthenticatedUser(mockClient, "student-1");
    queueRole(mockClient, "student", 3);
    mockQueryResponse(mockClient, null);

    const profile = await getCurrentUserProfile();

    expect(profile).toMatchObject({
      email: "",
      displayName: "Usuário",
      role: "student",
      avatarUrl: null,
      bio: null,
      specialties: [],
      certifications: [],
      verificationStatus: null,
      verificationReason: null,
      verificationDocumentUrl: null,
      schools: [],
      educationLevel: null,
      degree: null,
    });
    // Sem papel de professor não há consulta a teacher_details.
    expect(mockClient.from.mock.calls.map((call) => call[0])).not.toContain("teacher_details");
  });

  it("cai para metadata do auth e para a segunda consulta de documento", async () => {
    mockClient.auth.getUser.mockResolvedValue({
      data: {
        user: {
          id: "teacher-2",
          email: "meta@escola.br",
          user_metadata: { full_name: "Ana Metadata", qualification_document_url: "meta.pdf" },
        },
      },
    });
    queueRole(mockClient, "teacher");
    mockQueryResponse(mockClient, {});
    mockQueryResponse(mockClient, null); // teacher_details ausente
    mockQueryResponse(mockClient, { status: "approved", observations: "ok", qualification_document_url: null });
    mockQueryResponse(mockClient, { qualification_document_url: "segunda.pdf" });

    const profile = await getCurrentUserProfile();

    expect(profile).toMatchObject({
      email: "meta@escola.br",
      displayName: "Ana Metadata",
      verificationReason: null,
      verificationDocumentUrl: "segunda.pdf",
      schools: [],
    });
    expect(mockClient.filters.not).toHaveBeenCalledWith("qualification_document_url", "is", null);
  });
});

describe("getAllUsers", () => {
  it("retorna lista vazia quando a consulta falha", async () => {
    mockQueryResponse(mockClient, null, new Error("boom"));

    await expect(getAllUsers()).resolves.toEqual([]);
  });

  it("mapeia papéis e a solicitação de professor mais recente", async () => {
    mockQueryResponse(mockClient, [
      {
        id: "u1",
        full_name: "Ana",
        email: "ana@escola.br",
        avatar_url: null,
        bio: null,
        phone: null,
        address: null,
        specialties: null,
        certifications: null,
        verification_status: "rejected",
        is_active: true,
        created_at: "2026-01-01",
      },
      {
        id: "u2",
        full_name: "Bia",
        email: "bia@escola.br",
        avatar_url: "bia.png",
        bio: "bio",
        phone: "31",
        address: "Rua 2",
        specialties: ["ia"],
        certifications: ["c2"],
        verification_status: null,
        is_active: true,
        created_at: "2026-02-01",
      },
    ]);
    mockQueryResponse(mockClient, [
      { user_profile_id: "u1", role: { name: "teacher" } },
      { user_profile_id: "u2", role: [{ name: "admin" }] },
    ]);
    mockQueryResponse(mockClient, [
      {
        user_id: "u1",
        status: "pending",
        observations: "primeira",
        qualification_document_url: "antigo.pdf",
        created_at: "2026-01-01",
      },
      {
        user_id: "u1",
        status: "rejected",
        observations: "motivo atual",
        qualification_document_url: "novo.pdf",
        created_at: "2026-02-01",
      },
      {
        user_id: "u2",
        status: "pending",
        observations: "sem data",
        qualification_document_url: null,
        created_at: null,
      },
    ]);

    const users = await getAllUsers();

    expect(users).toHaveLength(2);
    expect(users[0]).toMatchObject({
      id: "u1",
      role: "teacher",
      specialties: [],
      certifications: [],
      verificationStatus: "rejected",
      verificationReason: "motivo atual",
      verificationDocumentUrl: "novo.pdf",
    });
    expect(users[1]).toMatchObject({
      id: "u2",
      role: "admin",
      specialties: ["ia"],
      verificationStatus: null,
      verificationReason: null,
      verificationDocumentUrl: null,
    });
  });
});

describe("getUsersPage", () => {
  it("pagina com os valores padrão e sem filtro de busca", async () => {
    mockCountedResponse(mockClient, [
      {
        id: "u1",
        full_name: "Ana",
        email: "ana@escola.br",
        avatar_url: null,
        bio: null,
        phone: null,
        address: null,
        specialties: null,
        certifications: null,
        verification_status: null,
        is_active: true,
        created_at: "2026-01-01",
      },
    ], 3);
    mockQueryResponse(mockClient, []);
    mockQueryResponse(mockClient, null);

    const result = await getUsersPage();

    expect(result).toMatchObject({ total: 3, page: 1, pageSize: 10 });
    expect(result.users[0]).toMatchObject({ id: "u1", role: "student", verificationReason: null });
    expect(mockClient.filters.range).toHaveBeenCalledWith(0, 9);
    expect(mockClient.filters.or).not.toHaveBeenCalled();
  });

  it("limita página/tamanho e higieniza o termo de busca", async () => {
    mockCountedResponse(mockClient, null, null);
    mockQueryResponse(mockClient, []);
    mockQueryResponse(mockClient, []);

    const result = await getUsersPage(0, 500, "  Ana  Maria %  ");

    expect(result).toMatchObject({ users: [], total: 0, page: 1, pageSize: 100 });
    expect(mockClient.filters.range).toHaveBeenCalledWith(0, 99);
    expect(mockClient.filters.or).toHaveBeenCalledWith(
      "full_name.ilike.%Ana Maria %,email.ilike.%Ana Maria %",
    );
  });

  it("propaga erro da consulta paginada", async () => {
    mockQueryResponse(mockClient, null, new Error("range falhou"));

    await expect(getUsersPage(2, 20)).rejects.toThrow("range falhou");
    expect(mockClient.filters.range).toHaveBeenCalledWith(20, 39);
  });
});

describe("deleteUserAction", () => {
  it("não faz nada sem id no formulário", async () => {
    await expect(deleteUserAction(formDataOf({}))).resolves.toBeUndefined();
    expect(mockClient.auth.getUser).not.toHaveBeenCalled();
  });

  it("exige sessão autenticada", async () => {
    mockUnauthenticatedUser(mockClient);

    await expect(deleteUserAction(formDataOf({ id: "u-9" }))).rejects.toThrow("Usuário não autenticado.");
  });

  it("bloqueia quem não é administrador", async () => {
    queueRole(mockClient, "teacher");

    await expect(deleteUserAction(formDataOf({ id: "u-9" }))).rejects.toThrow(
      "Acesso negado. Permissões de administrador necessárias.",
    );
    expect(mockedCreateAdminClient).not.toHaveBeenCalled();
  });

  it("administrador remove usuário e dados pessoais residuais", async () => {
    queueRole(mockClient, "admin", 1);

    await deleteUserAction(formDataOf({ id: "u-9" }));

    expect(adminClient.auth.admin.deleteUser).toHaveBeenCalledWith("u-9");
    expect(adminClient.from.mock.calls.map((call) => call[0])).toEqual([
      "user_role",
      "student_details",
      "teacher_details",
      "teacher_request",
      "notification",
      "user_profile",
    ]);
    expect(vi.mocked(revalidatePath)).toHaveBeenCalledWith("/protected");
  });
});

describe("updateUserAction", () => {
  it("não faz nada sem id no formulário", async () => {
    await expect(updateUserAction(formDataOf({ display_name: "Ana" }))).resolves.toBeUndefined();
    expect(mockClient.auth.getUser).not.toHaveBeenCalled();
  });

  it("exige sessão autenticada", async () => {
    mockUnauthenticatedUser(mockClient);

    await expect(updateUserAction(formDataOf({ id: "u-9" }))).rejects.toThrow("Usuário não autenticado.");
  });

  it("bloqueia quem não é administrador", async () => {
    queueRole(mockClient, "student", 3);

    await expect(updateUserAction(formDataOf({ id: "u-9", type: "adm" }))).rejects.toThrow(
      "Acesso negado. Permissões de administrador necessárias.",
    );
  });

  it("traduz o papel 'adm' para admin e refaz o vínculo", async () => {
    mockAuthenticatedUser(mockClient, "admin-1");
    queueRole(mockClient, "admin", 1);
    // Fila do cliente admin: user_profile update, role select (ensureRoleId).
    mockQueryResponse(adminClient, null);
    mockQueryResponse(adminClient, { id: 1 });

    await updateUserAction(formDataOf({ id: "u-9", display_name: "Ana", email: "ana@escola.br", type: "adm" }));

    expect(adminClient.auth.admin.updateUserById).toHaveBeenCalledWith("u-9", {
      email: "ana@escola.br",
      user_metadata: { full_name: "Ana", display_name: "Ana" },
    });
    expect(adminClient.chain.insert).toHaveBeenCalledWith({
      user_profile_id: "u-9",
      role_id: 1,
      granted_by: "admin-1",
    });
    expect(adminClient.from.mock.calls.map((call) => call[0])).not.toContain("teacher_request");
  });

  it("promove a professor e abre solicitação pendente quando não há status", async () => {
    mockAuthenticatedUser(mockClient, "admin-1");
    queueRole(mockClient, "admin", 1);
    // Sem nome/email não há chamada ao auth admin: a primeira query é o update de perfil.
    mockQueryResponse(adminClient, null);
    mockQueryResponse(adminClient, { id: 2 });

    await updateUserAction(formDataOf({ id: "u-9", type: "teacher" }));

    expect(adminClient.auth.admin.updateUserById).not.toHaveBeenCalled();
    expect(adminClient.chain.update).toHaveBeenCalledWith(
      expect.objectContaining({ verification_status: "pending" }),
    );
    expect(adminClient.chain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: "u-9", status: "pending", reviewed_by: "admin-1" }),
    );
  });

  it("mantém o status de verificação existente do professor", async () => {
    mockAuthenticatedUser(mockClient, "admin-1");
    queueRole(mockClient, "admin", 1);
    mockQueryResponse(adminClient, null); // update de perfil
    mockQueryResponse(adminClient, { id: 2 }); // ensureRoleId
    mockQueryResponse(adminClient, null); // delete user_role
    mockQueryResponse(adminClient, null); // insert user_role
    mockQueryResponse(adminClient, { verification_status: "approved" });

    await updateUserAction(formDataOf({ id: "u-9", type: "teacher" }));

    expect(adminClient.chain.update).not.toHaveBeenCalledWith(
      expect.objectContaining({ verification_status: "pending" }),
    );
    expect(adminClient.from.mock.calls.map((call) => call[0])).not.toContain("teacher_request");
  });

  it("cria o papel ausente ao resolver o vínculo", async () => {
    mockAuthenticatedUser(mockClient, "admin-1");
    queueRole(mockClient, "admin", 1);
    mockQueryResponse(adminClient, null); // update de perfil
    mockQueryResponse(adminClient, null); // role select sem resultado
    mockQueryResponse(adminClient, { id: 7 }); // role insert

    await updateUserAction(formDataOf({ id: "u-9", display_name: "Ana", type: "unknown" }));

    expect(adminClient.chain.insert).toHaveBeenCalledWith({ name: "student" });
    expect(adminClient.chain.insert).toHaveBeenCalledWith({
      user_profile_id: "u-9",
      role_id: 7,
      granted_by: "admin-1",
    });
  });

  it("falha quando o papel informado não existe e não pode ser criado", async () => {
    mockAuthenticatedUser(mockClient, "admin-1");
    queueRole(mockClient, "admin", 1);

    await expect(updateUserAction(formDataOf({ id: "u-9", type: "fantasma" }))).rejects.toThrow(
      "Não foi possível resolver o papel informado.",
    );
    expect(adminClient.from.mock.calls.map((call) => call[0])).not.toContain("role");
  });

  it("falha quando a criação do papel retorna erro", async () => {
    mockAuthenticatedUser(mockClient, "admin-1");
    queueRole(mockClient, "admin", 1);
    mockQueryResponse(adminClient, null); // update de perfil
    mockQueryResponse(adminClient, null); // role select sem resultado
    mockQueryResponse(adminClient, null, new Error("insert de papel falhou"));

    await expect(
      updateUserAction(formDataOf({ id: "u-9", display_name: "Ana", type: "student" })),
    ).rejects.toThrow("Não foi possível resolver o papel informado.");
  });
});

describe("setOnboardingRole", () => {
  it("propaga erro ao ler os papéis atuais", async () => {
    mockQueryResponse(serviceRoleClient, null, new Error("leitura falhou"));

    await expect(setOnboardingRole("u-1", "teacher")).rejects.toThrow("leitura falhou");
  });

  it("nunca rebaixa um administrador", async () => {
    mockQueryResponse(serviceRoleClient, [{ role_id: 1, role: [{ name: "admin" }] }]);

    await expect(setOnboardingRole("u-1", "teacher")).rejects.toThrow(
      "Acesso negado. Administradores não passam pelo onboarding de papel.",
    );
    expect(serviceRoleClient.chain.delete).not.toHaveBeenCalled();
  });

  it("é idempotente quando o usuário já está só no papel pedido", async () => {
    mockQueryResponse(serviceRoleClient, [{ role_id: 3, role: { name: "student" } }]);

    await expect(setOnboardingRole("u-1", "student")).resolves.toBeUndefined();
    expect(serviceRoleClient.from).toHaveBeenCalledTimes(1);
  });

  it("rejeita papel inexistente", async () => {
    mockQueryResponse(serviceRoleClient, []);
    mockQueryResponse(serviceRoleClient, null);

    await expect(setOnboardingRole("u-1", "student")).rejects.toThrow("Papel de usuário inválido.");
  });

  it("propaga a mensagem de erro da consulta de papel", async () => {
    mockQueryResponse(serviceRoleClient, []);
    mockQueryResponse(serviceRoleClient, null, new Error("role indisponível"));

    await expect(setOnboardingRole("u-1", "student")).rejects.toThrow("role indisponível");
  });

  it("entra como professor sempre pendente", async () => {
    mockQueryResponse(serviceRoleClient, []);
    mockQueryResponse(serviceRoleClient, { id: 2 });

    await setOnboardingRole("u-1", "teacher");

    expect(serviceRoleClient.chain.insert).toHaveBeenCalledWith({
      user_profile_id: "u-1",
      role_id: 2,
      granted_by: "u-1",
    });
    expect(serviceRoleClient.chain.update).toHaveBeenCalledWith(
      expect.objectContaining({ verification_status: "pending" }),
    );
  });

  it("troca para estudante sem tocar em verificação", async () => {
    mockQueryResponse(serviceRoleClient, [{ role_id: 2, role: { name: "teacher" } }]);
    mockQueryResponse(serviceRoleClient, { id: 3 });

    await setOnboardingRole("u-1", "student");

    expect(serviceRoleClient.chain.delete).toHaveBeenCalled();
    expect(serviceRoleClient.chain.update).not.toHaveBeenCalled();
  });

  it("propaga erro ao limpar vínculos antigos", async () => {
    mockQueryResponse(serviceRoleClient, []);
    mockQueryResponse(serviceRoleClient, { id: 3 });
    mockQueryResponse(serviceRoleClient, null, new Error("delete falhou"));

    await expect(setOnboardingRole("u-1", "student")).rejects.toThrow("delete falhou");
    expect(serviceRoleClient.chain.insert).not.toHaveBeenCalled();
  });

  it("propaga erro ao inserir o novo vínculo", async () => {
    mockQueryResponse(serviceRoleClient, []);
    mockQueryResponse(serviceRoleClient, { id: 3 });
    mockQueryResponse(serviceRoleClient, null);
    mockQueryResponse(serviceRoleClient, null, new Error("insert falhou"));

    await expect(setOnboardingRole("u-1", "student")).rejects.toThrow("insert falhou");
  });
});

describe("updateCurrentTeacherProfileWithReverification", () => {
  it("exige sessão autenticada", async () => {
    mockUnauthenticatedUser(mockClient);

    await expect(updateCurrentTeacherProfileWithReverification({})).rejects.toThrow(
      "Usuário não autenticado.",
    );
  });

  it("aceita apenas professores", async () => {
    queueRole(mockClient, "student", 3);

    await expect(updateCurrentTeacherProfileWithReverification({})).rejects.toThrow(
      "Apenas professores podem atualizar este perfil.",
    );
  });

  it("exige comprovante para reenviar solicitação reprovada", async () => {
    queueRole(mockClient, "teacher");
    mockQueryResponse(mockClient, { verification_status: "rejected", full_name: "Prof Ana" });
    mockQueryResponse(mockClient, null);

    await expect(updateCurrentTeacherProfileWithReverification({ bio: "nova" })).rejects.toThrow(
      "Envie o comprovante de qualificação para reenviar sua solicitação.",
    );
    expect(mockedCreateServiceRoleClient).not.toHaveBeenCalled();
  });

  it("reenvia para verificação e notifica admins", async () => {
    queueRole(mockClient, "teacher");
    mockQueryResponse(mockClient, { verification_status: "rejected", full_name: "Prof Ana" });
    mockQueryResponse(mockClient, { qualification_document_url: "antigo.pdf" });
    // Fila do service role: update de perfil, teacher_details existente.
    mockQueryResponse(serviceRoleClient, null);
    mockQueryResponse(serviceRoleClient, { user_id: "teacher-1" });

    const result = await updateCurrentTeacherProfileWithReverification({
      bio: "  nova bio  ",
      specialties: [" robótica ", "", " ia"],
      certifications: [" cert-1 "],
      schools: [" EE Central ", ""],
      educationLevel: " superior ",
      degree: " Engenharia ",
      qualificationDocumentUrl: "  novo.pdf  ",
    });

    expect(result).toEqual({
      reverificationRequested: true,
      message: "Perfil salvo. Sua solicitação voltou para verificação pendente.",
      verificationStatus: "pending",
      qualificationDocumentUrl: "novo.pdf",
    });
    expect(serviceRoleClient.chain.update).toHaveBeenCalledWith(
      expect.objectContaining({
        bio: "nova bio",
        specialties: ["robótica", "ia"],
        certifications: ["cert-1"],
        verification_status: "pending",
      }),
    );
    expect(serviceRoleClient.chain.update).toHaveBeenCalledWith(
      expect.objectContaining({ schools: ["EE Central"], education_level: "superior", degree: "Engenharia" }),
    );
    expect(serviceRoleClient.chain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "teacher-1",
        status: "pending",
        qualification_document_url: "novo.pdf",
        observations: "Professor atualizou o perfil para reavaliação.",
      }),
    );
    expect(vi.mocked(notifyAdmins)).toHaveBeenCalledWith(
      expect.objectContaining({ type: "teacher_pending_approval" }),
    );
  });

  it("cria teacher_details e atualiza o comprovante do professor aprovado", async () => {
    queueRole(mockClient, "teacher");
    mockQueryResponse(mockClient, { verification_status: "approved", full_name: "Prof Ana" });
    mockQueryResponse(mockClient, { qualification_document_url: null });
    mockQueryResponse(serviceRoleClient, null); // update de perfil
    mockQueryResponse(serviceRoleClient, null); // teacher_details ausente
    mockQueryResponse(serviceRoleClient, null); // insert de teacher_details
    mockQueryResponse(serviceRoleClient, { id: 9 }); // solicitação mais recente

    const result = await updateCurrentTeacherProfileWithReverification({
      schools: ["EE Central"],
      qualificationDocumentUrl: "novo.pdf",
    });

    expect(result).toEqual({
      reverificationRequested: false,
      message: "Perfil de professor salvo com sucesso.",
      verificationStatus: "approved",
      qualificationDocumentUrl: "novo.pdf",
    });
    expect(serviceRoleClient.chain.insert).toHaveBeenCalledWith({
      user_id: "teacher-1",
      schools: ["EE Central"],
      education_level: "",
      degree: "",
    });
    expect(serviceRoleClient.chain.update).toHaveBeenCalledWith({ qualification_document_url: "novo.pdf" });
    expect(vi.mocked(notifyAdmins)).not.toHaveBeenCalled();
    expect(vi.mocked(revalidatePath)).toHaveBeenCalledWith("/protected/perfil");
  });

  it("abre solicitação quando o professor ainda não tem nenhuma", async () => {
    queueRole(mockClient, "teacher");
    mockQueryResponse(mockClient, { verification_status: "pending", full_name: "Prof Ana" });
    mockQueryResponse(mockClient, null);
    mockQueryResponse(serviceRoleClient, null); // update de perfil
    mockQueryResponse(serviceRoleClient, null); // sem solicitação anterior

    const result = await updateCurrentTeacherProfileWithReverification({
      qualificationDocumentUrl: "novo.pdf",
    });

    expect(result.verificationStatus).toBe("pending");
    expect(serviceRoleClient.chain.insert).toHaveBeenCalledWith({
      user_id: "teacher-1",
      status: "pending",
      qualification_document_url: "novo.pdf",
      observations: "Comprovante de qualificação atualizado.",
    });
  });

  it("propaga erro do update de perfil", async () => {
    queueRole(mockClient, "teacher");
    mockQueryResponse(mockClient, { verification_status: "approved", full_name: "Prof Ana" });
    mockQueryResponse(mockClient, null);
    mockQueryResponse(serviceRoleClient, null, new Error("perfil falhou"));

    await expect(updateCurrentTeacherProfileWithReverification({ bio: "x" })).rejects.toThrow(
      "perfil falhou",
    );
  });

  it("propaga erro ao registrar a nova solicitação", async () => {
    queueRole(mockClient, "teacher");
    mockQueryResponse(mockClient, { verification_status: "rejected", full_name: "Prof Ana" });
    mockQueryResponse(mockClient, { qualification_document_url: "antigo.pdf" });
    mockQueryResponse(serviceRoleClient, null); // update de perfil
    mockQueryResponse(serviceRoleClient, null, new Error("solicitação falhou"));

    await expect(updateCurrentTeacherProfileWithReverification({})).rejects.toThrow(
      "solicitação falhou",
    );
    expect(vi.mocked(notifyAdmins)).not.toHaveBeenCalled();
  });
});

describe("ensureCurrentTeacherVerifiedForPublishing", () => {
  it("exige sessão autenticada", async () => {
    mockUnauthenticatedUser(mockClient);

    await expect(ensureCurrentTeacherVerifiedForPublishing()).rejects.toThrow(
      "Usuário não autenticado.",
    );
  });

  it("bloqueia quem não é professor nem admin", async () => {
    queueRole(mockClient, "student", 3);

    await expect(ensureCurrentTeacherVerifiedForPublishing()).rejects.toThrow(
      "Apenas professores aprovados podem executar esta ação.",
    );
  });

  it.each(["pending", "rejected"] as const)(
    "bloqueia professor com verificação %s",
    async (status) => {
      queueTeacher(status);

      await expect(ensureCurrentTeacherVerifiedForPublishing()).rejects.toThrow(
        "Professor não verificado. Aguarde aprovação do administrador.",
      );
    },
  );

  it("permite professor aprovado", async () => {
    queueTeacher("approved");

    await expect(ensureCurrentTeacherVerifiedForPublishing()).resolves.toBeUndefined();
  });

  it("permite administrador sem consultar status de professor", async () => {
    queueRole(mockClient, "admin", 1);

    await expect(ensureCurrentTeacherVerifiedForPublishing()).resolves.toBeUndefined();
    expect(mockClient.from).toHaveBeenCalledTimes(2);
  });
});

describe("setTeacherVerificationStatusByAdmin", () => {
  it("exige sessão autenticada", async () => {
    mockUnauthenticatedUser(mockClient);

    await expect(
      setTeacherVerificationStatusByAdmin({ teacherId: "t-1", status: "approved" }),
    ).rejects.toThrow("Usuário não autenticado.");
  });

  it("bloqueia quem não é administrador", async () => {
    queueRole(mockClient, "teacher");

    await expect(
      setTeacherVerificationStatusByAdmin({ teacherId: "t-1", status: "approved" }),
    ).rejects.toThrow("Acesso negado. Permissões de administrador necessárias.");
  });

  it("rejeita alvo que não é professor", async () => {
    mockAuthenticatedUser(mockClient, "admin-1");
    queueRole(mockClient, "admin", 1);
    queueRole(mockClient, "student", 3);

    await expect(
      setTeacherVerificationStatusByAdmin({ teacherId: "t-1", status: "approved" }),
    ).rejects.toThrow("Usuário informado não é professor.");
    expect(mockedCreateAdminClient).not.toHaveBeenCalled();
  });

  it("não aprova sem anexo de qualificação", async () => {
    mockAuthenticatedUser(mockClient, "admin-1");
    queueRole(mockClient, "admin", 1);
    queueRole(mockClient, "teacher");
    mockQueryResponse(adminClient, null);

    await expect(
      setTeacherVerificationStatusByAdmin({ teacherId: "t-1", status: "approved" }),
    ).rejects.toThrow("Não é possível aprovar sem anexo de qualificação do professor.");
    expect(adminClient.chain.update).not.toHaveBeenCalled();
  });

  it("aprova professor com anexo e notifica", async () => {
    mockAuthenticatedUser(mockClient, "admin-1");
    queueRole(mockClient, "admin", 1);
    queueRole(mockClient, "teacher");
    mockQueryResponse(adminClient, { qualification_document_url: "diploma.pdf" });

    await setTeacherVerificationStatusByAdmin({
      teacherId: "t-1",
      status: "approved",
      reason: "  tudo certo  ",
    });

    expect(adminClient.chain.update).toHaveBeenCalledWith(
      expect.objectContaining({ verification_status: "approved" }),
    );
    expect(adminClient.chain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "t-1",
        status: "approved",
        observations: "tudo certo",
        qualification_document_url: "diploma.pdf",
        reviewed_by: "admin-1",
      }),
    );
    expect(vi.mocked(createNotification)).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "t-1", type: "teacher_approved" }),
    );
    expect(vi.mocked(revalidatePath)).toHaveBeenCalledWith("/protected/perfil");
  });

  it("reprova sem motivo informado", async () => {
    mockAuthenticatedUser(mockClient, "admin-1");
    queueRole(mockClient, "admin", 1);
    queueRole(mockClient, "teacher");

    await setTeacherVerificationStatusByAdmin({ teacherId: "t-1", status: "rejected" });

    expect(adminClient.chain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ status: "rejected", observations: null, qualification_document_url: null }),
    );
    expect(vi.mocked(createNotification)).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "teacher_rejected",
        payload: expect.objectContaining({
          message: "Seu perfil de professor foi reprovado. Motivo: Não informado",
        }),
      }),
    );
  });

  it("propaga erro do update de perfil", async () => {
    mockAuthenticatedUser(mockClient, "admin-1");
    queueRole(mockClient, "admin", 1);
    queueRole(mockClient, "teacher");
    mockQueryResponse(adminClient, { qualification_document_url: "diploma.pdf" });
    mockQueryResponse(adminClient, null, new Error("perfil falhou"));

    await expect(
      setTeacherVerificationStatusByAdmin({ teacherId: "t-1", status: "approved" }),
    ).rejects.toThrow("perfil falhou");
    expect(vi.mocked(createNotification)).not.toHaveBeenCalled();
  });

  it("propaga erro do histórico de solicitação", async () => {
    mockAuthenticatedUser(mockClient, "admin-1");
    queueRole(mockClient, "admin", 1);
    queueRole(mockClient, "teacher");
    mockQueryResponse(adminClient, { qualification_document_url: "diploma.pdf" });
    mockQueryResponse(adminClient, null);
    mockQueryResponse(adminClient, null, new Error("histórico falhou"));

    await expect(
      setTeacherVerificationStatusByAdmin({ teacherId: "t-1", status: "approved" }),
    ).rejects.toThrow("histórico falhou");
    expect(vi.mocked(createNotification)).not.toHaveBeenCalled();
  });
});
