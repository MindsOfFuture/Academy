// tests/unit/components/auth/sign-up-form.test.tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { SignUpForm, calcularIdade } from "@/components/auth/sign-up-form";
import userEvent from "@testing-library/user-event";
import toast from "react-hot-toast";

// Mocks
const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

vi.mock("react-hot-toast", () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const signUpMock = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      signUp: signUpMock,
    },
  }),
}));

const locationOriginal = window.location;

/** Data AAAA-MM-DD de quem faz `anos` hoje. */
function nascidoHa(anos: number): string {
  const hoje = new Date();
  const d = new Date(hoje.getFullYear() - anos, hoje.getMonth(), hoje.getDate());
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Fluxos digitam tecla a tecla (~3s sozinhos); com a suíte inteira em paralelo passavam dos 5s padrão.
describe("SignUpForm Integration", { timeout: 30_000 }, () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, "location", {
      value: {
        origin: "http://localhost:3000",
      },
      writable: true,
    });
    // Mock fetch for teacher qualification upload
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ url: "https://example.com/qualification.pdf" }),
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    Object.defineProperty(window, "location", { value: locationOriginal, writable: true });
  });

  const defaultProps = {
    onToggleView: vi.fn(),
  };

  const fillStudent = async (overrides: { name?: string; birthDate?: string; password?: string; repeat?: string; terms?: boolean } = {}) => {
    await userEvent.type(await screen.findByPlaceholderText("Nome completo"), overrides.name ?? "João da Silva");
    fireEvent.change(screen.getByLabelText("Data de nascimento"), { target: { value: overrides.birthDate ?? "2000-01-01" } });
    await userEvent.type(screen.getByPlaceholderText("Seu melhor E-mail"), "aluno@test.com");
    await userEvent.type(screen.getByPlaceholderText("Senha segura"), overrides.password ?? "123456");
    await userEvent.type(screen.getByPlaceholderText("Confirme a senha"), overrides.repeat ?? overrides.password ?? "123456");
    if (overrides.terms !== false) fireEvent.click(screen.getByRole("checkbox"));
  };

  const fillTeacherStep1 = async () => {
    await userEvent.type(await screen.findByPlaceholderText("Nome completo"), "Prof. Alberto");
    await userEvent.type(screen.getByPlaceholderText("CPF ou RG"), "12345678901");
    fireEvent.change(screen.getByLabelText("Data de nascimento"), { target: { value: "1980-01-01" } });
  };

  const fillTeacherStep2 = async () => {
    await userEvent.type(await screen.findByPlaceholderText("Endereço (Cidade/Estado)"), "São Paulo, SP");
    await userEvent.type(screen.getByPlaceholderText("Telefone / Celular"), "11999999999");
  };

  it("aluno: um passo só, sem CPF, endereço, telefone ou escola", async () => {
    render(<SignUpForm {...defaultProps} />);
    await screen.findByPlaceholderText("Nome completo");
    expect(screen.queryByPlaceholderText("CPF ou RG")).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Telefone / Celular")).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Escola atual")).not.toBeInTheDocument();
    expect(screen.queryByText("Próximo")).not.toBeInTheDocument();
    expect(screen.queryByText(/Passo 1 de/)).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("Seu melhor E-mail")).toBeInTheDocument();
    expect(screen.getByText("O resto (telefone, endereço, escola) você completa depois no seu perfil, se quiser.")).toBeInTheDocument();
    // Adulto: sem campo de responsável.
    fireEvent.change(screen.getByLabelText("Data de nascimento"), { target: { value: nascidoHa(30) } });
    expect(screen.queryByPlaceholderText("Nome do responsável")).not.toBeInTheDocument();
  });

  it("aluno: valida nome, idade mínima e responsável do menor", async () => {
    render(<SignUpForm {...defaultProps} />);
    fireEvent.click(await screen.findByText("Criar minha conta"));
    expect(await screen.findByText("Por favor, preencha seu nome.")).toBeInTheDocument();

    const nameInput = screen.getByPlaceholderText("Nome completo");
    await userEvent.type(nameInput, "João");
    fireEvent.click(screen.getByText("Criar minha conta"));
    expect(await screen.findByText("Por favor, digite seu nome completo.")).toBeInTheDocument();
    await userEvent.type(nameInput, " da Silva");

    fireEvent.click(screen.getByText("Criar minha conta"));
    expect(await screen.findByText("Data de nascimento é obrigatória.")).toBeInTheDocument();

    const dateInput = screen.getByLabelText("Data de nascimento");
    fireEvent.change(dateInput, { target: { value: nascidoHa(4) } });
    fireEvent.click(screen.getByText("Criar minha conta"));
    expect(await screen.findByText("Idade mínima de 5 anos.")).toBeInTheDocument();

    fireEvent.change(dateInput, { target: { value: nascidoHa(15) } });
    expect(screen.getByPlaceholderText("Nome do responsável")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Criar minha conta"));
    expect(await screen.findByText("Nome do responsável é obrigatório para menores de 18 anos.")).toBeInTheDocument();
    expect(signUpMock).not.toHaveBeenCalled();
  });

  it("aluno adulto: envia só o mínimo e volta para o next", async () => {
    signUpMock.mockResolvedValueOnce({ data: { user: { id: "123" } }, error: null });
    render(<SignUpForm {...defaultProps} nextPath="/lg2/jornada/index.html" />);
    await fillStudent();
    fireEvent.click(screen.getByText("Criar minha conta"));

    await waitFor(() => {
      expect(signUpMock).toHaveBeenCalledWith({
        email: "aluno@test.com",
        password: "123456",
        options: {
          data: {
            full_name: "João da Silva",
            user_type: "student",
            birth_date: "2000-01-01",
          },
          emailRedirectTo: "http://localhost:3000/lg2/jornada/index.html",
        },
      });
      expect(toast.success).toHaveBeenCalled();
    });
  });

  it("aluno menor: grava o responsável em parent_name; sem next volta para /protected", async () => {
    signUpMock.mockResolvedValueOnce({ data: { user: { id: "124" } }, error: null });
    render(<SignUpForm {...defaultProps} />);
    const nascimento = nascidoHa(14);
    await fillStudent({ birthDate: nascimento });
    await userEvent.type(screen.getByPlaceholderText("Nome do responsável"), "Maria da Silva");
    fireEvent.click(screen.getByText("Criar minha conta"));

    await waitFor(() => {
      expect(signUpMock).toHaveBeenCalledWith({
        email: "aluno@test.com",
        password: "123456",
        options: {
          data: {
            full_name: "João da Silva",
            user_type: "student",
            birth_date: nascimento,
            parent_name: "Maria da Silva",
          },
          emailRedirectTo: "http://localhost:3000/protected",
        },
      });
    });
  });

  it("aluno: senhas diferentes não enviam", async () => {
    render(<SignUpForm {...defaultProps} />);
    await fillStudent({ password: "123456", repeat: "654321" });
    fireEvent.click(screen.getByText("Criar minha conta"));
    expect(await screen.findByText("As senhas não conferem.")).toBeInTheDocument();
    expect(signUpMock).not.toHaveBeenCalled();
  });

  it("Complete Flow: Teacher Registration (continua com 4 passos e anexo)", async () => {
    signUpMock.mockResolvedValueOnce({ data: { user: { id: "456" } }, error: null });
    render(<SignUpForm {...defaultProps} />);

    // STEP 1 (Select Teacher)
    fireEvent.click(screen.getByText("Professor"));
    expect(screen.getByText("Passo 1 de 4")).toBeInTheDocument();
    await fillTeacherStep1();
    fireEvent.click(screen.getByText("Próximo"));

    // STEP 2
    await fillTeacherStep2();
    fireEvent.click(screen.getByText("Próximo"));

    // STEP 3 (Teacher Fields)
    const schoolInput1 = await screen.findByPlaceholderText("Escola 1");
    await userEvent.type(schoolInput1, "Escola A");
    fireEvent.click(screen.getByText("Adicionar outra escola"));
    const schoolInput2 = await screen.findByPlaceholderText("Escola 2");
    await userEvent.type(schoolInput2, "Escola B");
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "graduacao" } });
    await userEvent.type(screen.getByPlaceholderText("Formação (ex: Matemática)"), "Matemática");

    // Sem anexo não avança
    fireEvent.click(screen.getByText("Próximo"));
    expect(await screen.findByText(/Anexe um comprovante de qualificação/)).toBeInTheDocument();
    const qualificationFileInput = document.querySelector('input[type="file"][accept*="application/pdf"]') as HTMLInputElement;
    const mockFile = new File(["dummy"], "diploma.pdf", { type: "application/pdf" });
    fireEvent.change(qualificationFileInput, { target: { files: [mockFile] } });
    fireEvent.click(screen.getByText("Próximo"));

    // STEP 4
    const emailInput = await screen.findByPlaceholderText("Seu melhor E-mail");
    expect(emailInput).toHaveAttribute("autocomplete", "email");
    await userEvent.type(emailInput, "prof@test.com");
    await userEvent.type(screen.getByPlaceholderText("Senha segura"), "password123");
    await userEvent.type(screen.getByPlaceholderText("Confirme a senha"), "password123");
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByText("Concluir Cadastro"));

    await waitFor(() => {
      expect(signUpMock).toHaveBeenCalledWith(expect.objectContaining({
        email: "prof@test.com",
        options: expect.objectContaining({
          data: expect.objectContaining({
            user_type: "teacher",
            phone: "11999999999",
            address: "São Paulo, SP",
            document: "12345678901",
            birth_date: "1980-01-01",
            education_level: "graduacao",
            degree: "Matemática",
            schools: ["Escola A", "Escola B"],
            qualification_document_url: "https://example.com/qualification.pdf",
          }),
          emailRedirectTo: "http://localhost:3000/protected",
        }),
      }));
    });
  });

  it("calcularIdade lê a data como local e respeita o aniversário", () => {
    const hoje = new Date(2026, 10, 12); // 12/11/2026
    expect(calcularIdade("2008-11-12", hoje)).toBe(18);
    expect(calcularIdade("2008-11-13", hoje)).toBe(17);
    expect(calcularIdade("", hoje)).toBeNull();
  });
});
