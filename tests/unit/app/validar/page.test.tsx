import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { validateCertificateMock } = vi.hoisted(() => ({
  validateCertificateMock: vi.fn(),
}));

vi.mock("@/lib/api/certificates", () => ({
  validateCertificate: validateCertificateMock,
}));

vi.mock("@/lib/utils/pdfGenerator", () => ({
  generateAndDownloadCertificate: vi.fn(),
}));

vi.mock("@/components/navbar/navbar", () => ({
  default: () => <nav>Academy</nav>,
}));

import ValidarPage from "@/app/validar/page";

describe("ValidarPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exibe o CPF parcialmente mascarado devolvido pela validação", async () => {
    validateCertificateMock.mockResolvedValueOnce({
      studentName: "Aluno Teste",
      studentCpf: "***.456.789-**",
      courseTitle: "Curso Teste",
      issuedAt: "2026-09-01T12:00:00.000Z",
      verificationCode: "A1B2-C3D4-E5F6",
    });

    render(<ValidarPage />);

    await userEvent.type(
      screen.getByPlaceholderText("Ex: A1B2-C3D4-E5F6"),
      "A1B2-C3D4-E5F6",
    );
    await userEvent.click(screen.getByRole("button", { name: "Validar" }));

    expect(await screen.findByText("***.456.789-**")).toBeInTheDocument();
  });
});
