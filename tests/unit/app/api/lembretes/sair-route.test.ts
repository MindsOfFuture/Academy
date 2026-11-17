import { beforeEach, describe, expect, it, vi } from "vitest";

const rpc = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({ rpc })),
}));

import { GET, POST } from "@/app/api/lembretes/sair/route";

const TOKEN = "3f1c2b9a-1111-4222-8333-444455556666";

function post(t: string, corpo?: Record<string, string>) {
  const form = new URLSearchParams(corpo ?? { "List-Unsubscribe": "One-Click" });
  return new Request(`https://academy.test/api/lembretes/sair?t=${t}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });
}

describe("POST /api/lembretes/sair", () => {
  beforeEach(() => {
    rpc.mockReset();
    rpc.mockResolvedValue({ data: true, error: null });
  });

  it("botão do leitor de e-mail (one-click): para e responde 200", async () => {
    const r = await POST(post(TOKEN));
    expect(r.status).toBe(200);
    expect(rpc).toHaveBeenCalledWith("lg2_lembrete_sair", { p_token: TOKEN });
  });

  it("formulário da página: volta para a página com ok", async () => {
    const r = await POST(post(TOKEN, { origem: "pagina" }));
    expect(r.status).toBe(303);
    expect(new URL(r.headers.get("location")!).search).toBe("?ok=1");
  });

  it("token que o banco não conhece: página com erro, sem dizer que parou", async () => {
    rpc.mockResolvedValue({ data: false, error: null });
    const r = await POST(post(TOKEN, { origem: "pagina" }));
    expect(new URL(r.headers.get("location")!).search).toBe("?erro=1");
  });

  it("token mal formado nem chega ao banco", async () => {
    const r = await POST(post("1%27%20or%201=1"));
    expect(r.status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("falha do banco não vira 'pronto'", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "fora do ar" } });
    const r = await POST(post(TOKEN));
    expect(r.status).toBe(400);
  });
});

describe("GET /api/lembretes/sair", () => {
  it("não muda nada: só leva à página de confirmação", async () => {
    rpc.mockReset();
    const r = await GET(new Request(`https://academy.test/api/lembretes/sair?t=${TOKEN}`));
    expect(r.status).toBe(303);
    // Host desconhecido nunca vira destino: cai na origem pública do site.
    expect(r.headers.get("location")).toBe(`https://mindsofthefuture.com.br/lembretes/sair?t=${TOKEN}`);
    expect(rpc).not.toHaveBeenCalled();
  });
});

describe("redirect atrás do nginx", () => {
  it("não expõe localhost:3000 quando o pedido chega pelo domínio", async () => {
    rpc.mockResolvedValue({ data: true, error: null });
    const r = await POST(
      new Request(`http://localhost:3000/api/lembretes/sair?t=${TOKEN}`, {
        method: "POST",
        headers: { host: "mindsofthefuture.com.br", "Content-Type": "application/x-www-form-urlencoded" },
        body: "origem=pagina",
      }),
    );
    expect(r.status).toBe(303);
    expect(r.headers.get("location")).toBe("https://mindsofthefuture.com.br/lembretes/sair?ok=1");
  });
});
