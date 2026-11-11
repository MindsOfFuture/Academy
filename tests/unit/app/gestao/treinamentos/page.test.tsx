import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

let papel: "coordenacao" | "bolsista" = "coordenacao";
vi.mock("@/app/gestao/guard", () => ({ exigirMembro: vi.fn(async () => papel) }));
vi.mock("@/app/gestao/treinamentos/actions", () => ({ salvarTreinamentoAction: vi.fn(), registrarTreinamentoAction: vi.fn() }));
const resumo = vi.fn(async () => [
  { numero: 1, titulo: "Pontualidade", nome: "Ana Silva", email: "a@x", abertoEm: "2026-11-11T15:00:00Z", ultimoAcessoEm: "2026-11-11T15:00:00Z", acessos: 2, concluidoEm: "2026-11-11T15:10:00Z" },
  { numero: 1, titulo: "Pontualidade", nome: "Beto Souza", email: "b@x", abertoEm: null, ultimoAcessoEm: null, acessos: 0, concluidoEm: null },
]);
vi.mock("@/lib/api/gestao/treinamentos", () => ({
  listarTreinamentos: async () => [{ id: "v1", numero: 1, titulo: "Pontualidade", youtubeId: "dQw4w9WgXcQ", aberto: false, concluido: false }],
  resumoTreinamentos: () => resumo(),
}));

import TreinamentosPage from "@/app/gestao/treinamentos/page";

describe("aba Treinamentos", () => {
  beforeEach(() => resumo.mockClear());

  it("coordenação publica e vê quem abriu e quem não abriu", async () => {
    papel = "coordenacao";
    render(await TreinamentosPage());
    expect(screen.getByRole("heading", { name: "Publicar vídeo" })).toBeInTheDocument();
    expect(screen.getByText("Vídeo 1 · 1 de 2 bolsistas abriram")).toBeInTheDocument();
    expect(screen.getByText("Ana Silva")).toBeInTheDocument();
    expect(screen.getByText("não abriu")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Assistir" })).toBeInTheDocument();
  });

  it("bolsista só assiste: sem formulário e sem lista de quem viu", async () => {
    papel = "bolsista";
    render(await TreinamentosPage());
    expect(screen.queryByRole("heading", { name: "Publicar vídeo" })).not.toBeInTheDocument();
    expect(screen.queryByText("Quem assistiu")).not.toBeInTheDocument();
    expect(resumo).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Assistir" })).toBeInTheDocument();
  });
});
