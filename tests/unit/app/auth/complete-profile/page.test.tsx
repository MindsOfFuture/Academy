import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  useSearchParams: () => new URLSearchParams({ from: "oauth", name: "Pessoa Google", next: "/lg2/jornada/index.html" }),
}));
vi.mock("react-hot-toast", () => ({ default: { success: vi.fn(), error: vi.fn() } }));

import CompleteProfilePage from "@/app/auth/complete-profile/page";

function nascidoHa(anos: number): string {
  const hoje = new Date();
  const d = new Date(hoje.getFullYear() - anos, hoje.getMonth(), hoje.getDate());
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

describe("/auth/complete-profile (Google)", () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    vi.clearAllMocks();
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ ok: true, userType: "student" }) });
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  it("aluno: só nome e nascimento; o resto fica recolhido e opcional", async () => {
    render(<CompleteProfilePage />);
    expect(await screen.findByDisplayValue("Pessoa Google")).toBeInTheDocument();
    expect(screen.getByText("Adicionar mais dados (opcional)").closest("details")).not.toHaveAttribute("open");
    fireEvent.change(screen.getByLabelText("Data de Nascimento"), { target: { value: "2000-01-01" } });
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/lg2/jornada/index.html"));
    const corpo = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(corpo).toMatchObject({ fullName: "Pessoa Google", birthDate: "2000-01-01", phone: "", address: "", document: "", parentName: "", userType: "student" });
  });

  it("menor de 18 precisa do responsável", async () => {
    render(<CompleteProfilePage />);
    fireEvent.change(await screen.findByLabelText("Data de Nascimento"), { target: { value: nascidoHa(13) } });
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    expect(await screen.findByText("Nome do responsável é obrigatório para menores de 18 anos")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText("Nome do responsável"), { target: { value: "Maria Souza" } });
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).parentName).toBe("Maria Souza");
  });

  it("professor: telefone, endereço e documento continuam obrigatórios e à mostra", async () => {
    render(<CompleteProfilePage />);
    fireEvent.click(await screen.findByRole("button", { name: "Professor" }));
    expect(screen.queryByText("Adicionar mais dados (opcional)")).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Data de Nascimento"), { target: { value: "1980-01-01" } });
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    expect(await screen.findByText("Telefone é obrigatório")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
