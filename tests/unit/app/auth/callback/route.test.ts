// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const createClientMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

import { GET } from "@/app/auth/callback/route";

function mockSuccessfulCompleteProfile() {
  const profileQuery = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({
      data: {
        full_name: "Pessoa Teste",
        phone: "3200000000",
        address: "Juiz de Fora",
        document: "00000000000",
        birth_date: "2000-01-01",
      },
    }),
  };
  const exchangeCodeForSession = vi.fn().mockResolvedValue({ error: null });
  const getUser = vi.fn().mockResolvedValue({
    data: { user: { id: "user-1", email: "teste@example.com" } },
  });
  createClientMock.mockResolvedValue({
    auth: { exchangeCodeForSession, getUser },
    from: vi.fn(() => profileQuery),
  });
  return { exchangeCodeForSession, getUser };
}

describe("GET /auth/callback", () => {
  beforeEach(() => {
    createClientMock.mockReset();
  });

  it("não expõe a origem localhost do servidor", async () => {
    const request = new Request("http://localhost:3000/auth/callback", {
      headers: {
        host: "mindsofthefuture.com.br",
        "x-forwarded-proto": "https",
      },
    });

    const response = await GET(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://mindsofthefuture.com.br/auth?error=Invalid+callback",
    );
  });

  it("codifica erro do provedor sem aceitar uma origem externa", async () => {
    const request = new Request(
      "http://localhost:3000/auth/callback?error=access_denied&error_description=Negado",
      {
        headers: {
          host: "mindsofthefuture.com.br",
          "x-forwarded-proto": "https",
        },
      },
    );

    const response = await GET(request);

    expect(response.headers.get("location")).toBe(
      "https://mindsofthefuture.com.br/auth?error=Negado",
    );
  });

  it("não confia no host encaminhado para construir o redirect", async () => {
    const request = new Request("http://localhost:3000/auth/callback", {
      headers: {
        host: "localhost:3000",
        "x-forwarded-host": "evil.example",
        "x-forwarded-proto": "https",
      },
    });

    const response = await GET(request);

    expect(response.headers.get("location")).toBe(
      "https://mindsofthefuture.com.br/auth?error=Invalid+callback",
    );
  });

  it("não confia na origem da requisição fora do ambiente local", async () => {
    const request = new Request("https://evil.example/auth/callback", {
      headers: { host: "evil.example" },
    });

    const response = await GET(request);

    expect(response.headers.get("location")).toBe(
      "https://mindsofthefuture.com.br/auth?error=Invalid+callback",
    );
  });

  it("mantém a origem e a porta quando a requisição é local", async () => {
    const request = new Request("http://localhost:3105/auth/callback", {
      headers: {
        host: "localhost:3105",
        "x-forwarded-proto": "http",
      },
    });

    const response = await GET(request);

    expect(response.headers.get("location")).toBe(
      "http://localhost:3105/auth?error=Invalid+callback",
    );
  });

  it("ignora NEXT_PUBLIC_APP_URL local quando a requisição veio do proxy", async () => {
    const originalAppUrl = process.env.NEXT_PUBLIC_APP_URL;
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";

    try {
      const request = new Request("http://localhost:3000/auth/callback", {
        headers: {
          host: "mindsofthefuture.com.br",
          "x-forwarded-proto": "https",
        },
      });

      const response = await GET(request);

      expect(response.headers.get("location")).toBe(
        "https://mindsofthefuture.com.br/auth?error=Invalid+callback",
      );
    } finally {
      if (originalAppUrl === undefined) {
        delete process.env.NEXT_PUBLIC_APP_URL;
      } else {
        process.env.NEXT_PUBLIC_APP_URL = originalAppUrl;
      }
    }
  });

  it("ignora NEXT_PUBLIC_APP_URL sem HTTPS fora do ambiente local", async () => {
    const originalAppUrl = process.env.NEXT_PUBLIC_APP_URL;
    process.env.NEXT_PUBLIC_APP_URL = "http://academy.example";

    try {
      const response = await GET(new Request("http://localhost:3000/auth/callback", {
        headers: {
          host: "mindsofthefuture.com.br",
          "x-forwarded-proto": "https",
        },
      }));

      expect(response.headers.get("location")).toBe(
        "https://mindsofthefuture.com.br/auth?error=Invalid+callback",
      );
    } finally {
      if (originalAppUrl === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
      else process.env.NEXT_PUBLIC_APP_URL = originalAppUrl;
    }
  });

  it("usa VERCEL_URL com HTTPS quando a origem pública principal não foi configurada", async () => {
    const originalAppUrl = process.env.NEXT_PUBLIC_APP_URL;
    const originalVercelUrl = process.env.VERCEL_URL;
    delete process.env.NEXT_PUBLIC_APP_URL;
    process.env.VERCEL_URL = "academy-preview.vercel.app";

    try {
      const response = await GET(new Request("http://localhost:3000/auth/callback", {
        headers: {
          host: "academy-preview.vercel.app",
          "x-forwarded-proto": "https",
        },
      }));

      expect(response.headers.get("location")).toBe(
        "https://academy-preview.vercel.app/auth?error=Invalid+callback",
      );
    } finally {
      if (originalAppUrl === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
      else process.env.NEXT_PUBLIC_APP_URL = originalAppUrl;
      if (originalVercelUrl === undefined) delete process.env.VERCEL_URL;
      else process.env.VERCEL_URL = originalVercelUrl;
    }
  });

  it.each([
    "mindsofthefuture.com.br",
    "www.mindsofthefuture.com.br",
  ])("mantém a sessão no host público %s após troca bem-sucedida", async (host) => {
    const { exchangeCodeForSession, getUser } = mockSuccessfulCompleteProfile();

    const response = await GET(new Request(
      "http://localhost:3000/auth/callback?code=valid&next=%2Fprotected",
      {
        headers: {
          host,
          "x-forwarded-proto": "https",
        },
      },
    ));

    expect(exchangeCodeForSession).toHaveBeenCalledWith("valid");
    expect(getUser).toHaveBeenCalledOnce();
    expect(response.headers.get("location")).toBe(`https://${host}/protected`);
  });

  it.each(["%09", "%0A", "%0D"])(
    "não deixa o callback sair da origem com controle %s no next",
    async (control) => {
      mockSuccessfulCompleteProfile();

      const response = await GET(new Request(
        `http://localhost:3000/auth/callback?code=valid&next=/${control}/evil.example`,
        {
          headers: {
            host: "www.mindsofthefuture.com.br",
            "x-forwarded-proto": "https",
          },
        },
      ));

      expect(response.headers.get("location")).toBe(
        "https://www.mindsofthefuture.com.br/protected",
      );
    },
  );
});