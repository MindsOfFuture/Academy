import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { assinarComprovantes, referenciaDoComprovante } from "@/lib/api/comprovante";

const BASE = "https://x.supabase.co/storage/v1/object";
const PUBLICA = `${BASE}/public/teacher-qualification-documents/pending/u1/1-a-diploma.pdf`;
const ASSINADA = `${BASE}/sign/teacher-qualification-documents/pending/u1/1-a-diploma.pdf?token=abc`;

function clienteCom(createSignedUrls: ReturnType<typeof vi.fn>) {
  return { storage: { from: vi.fn(() => ({ createSignedUrls })) } } as never;
}

describe("referenciaDoComprovante", () => {
  it("grava sempre a forma pública, nunca a assinada", () => {
    expect(referenciaDoComprovante(ASSINADA)).toBe(PUBLICA);
    expect(referenciaDoComprovante(PUBLICA)).toBe(PUBLICA);
  });

  it("mantém URL de fora do bucket e vazio", () => {
    expect(referenciaDoComprovante("https://drive.google.com/x")).toBe("https://drive.google.com/x");
    expect(referenciaDoComprovante(null)).toBeNull();
  });
});

describe("assinarComprovantes", () => {
  it("assina pelo caminho e devolve por URL original", async () => {
    const createSignedUrls = vi.fn().mockResolvedValue({
      data: [{ path: "pending/u1/1-a-diploma.pdf", signedUrl: "https://assinada" }],
    });
    const mapa = await assinarComprovantes(clienteCom(createSignedUrls), [PUBLICA, "https://fora", null]);
    expect(createSignedUrls).toHaveBeenCalledWith(["pending/u1/1-a-diploma.pdf"], 3600);
    expect(mapa.get(PUBLICA)).toBe("https://assinada");
    expect(mapa.has("https://fora")).toBe(false);
  });

  it("falha do storage devolve vazio, e quem chama usa a original", async () => {
    const createSignedUrls = vi.fn().mockRejectedValue(new Error("down"));
    await expect(assinarComprovantes(clienteCom(createSignedUrls), [PUBLICA])).resolves.toEqual(new Map());
  });
});
