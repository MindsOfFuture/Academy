// tests/unit/components/auth/sign-up-form.test.tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { SignUpForm } from "@/components/auth/sign-up-form";
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

describe("SignUpForm Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, "location", {
      value: {
        origin: "http://localhost:3000",
      },
      writable: true,
    });
  });

  const defaultProps = {
    onToggleView: vi.fn(),
  };

  const fillStep1 = async (overrides: any = {}) => {
    const nameInput = await screen.findByPlaceholderText("Nome completo");
    const docInput = screen.getByPlaceholderText("CPF ou RG");
    const dateInput = screen.getByPlaceholderText("Data de nascimento");

    await userEvent.type(nameInput, overrides.name || "João da Silva");
    await userEvent.type(docInput, overrides.document || "12345678901"); // 11 chars
    fireEvent.change(dateInput, { target: { value: overrides.birthDate || "2000-01-01" } }); // Adult
  };

  const fillStep2 = async (overrides: any = {}) => {
    const addressInput = await screen.findByPlaceholderText("Endereço (Cidade/Estado)");
    const phoneInput = screen.getByPlaceholderText("Telefone / Celular");

    await userEvent.type(addressInput, overrides.address || "São Paulo, SP");
    await userEvent.type(phoneInput, overrides.phone || "11999999999"); // 11 chars
  };

  it("Step 1: Validates required fields and age", async () => {
    render(<SignUpForm {...defaultProps} />);
    
    // Try next without filling
    const nextBtn = await screen.findByText("Próximo");
    fireEvent.click(nextBtn);
    expect(await screen.findByText("Por favor, preencha seu nome.")).toBeInTheDocument();

    // Fill invalid name
    const nameInput = await screen.findByPlaceholderText("Nome completo");
    await userEvent.type(nameInput, "João");
    fireEvent.click(nextBtn);
    expect(await screen.findByText("Por favor, digite seu nome completo.")).toBeInTheDocument();
    await userEvent.type(nameInput, " da Silva"); // Fix name

    // Fill invalid document (too short)
    const docInput = screen.getByPlaceholderText("CPF ou RG");
    await userEvent.type(docInput, "123");
    fireEvent.click(nextBtn);
    expect(await screen.findByText("Documento inválido (mínimo 11 dígitos).")).toBeInTheDocument();
    await userEvent.type(docInput, "45678901"); // Fix doc (total 11)

    // Fill too young date
    const dateInput = screen.getByPlaceholderText("Data de nascimento");
    const today = new Date();
    // 4 years old
    const tooYoung = new Date(today.getFullYear() - 4, today.getMonth(), today.getDate()).toISOString().split('T')[0];
    fireEvent.change(dateInput, { target: { value: tooYoung } });
    fireEvent.click(nextBtn);
    expect(await screen.findByText("Idade mínima de 5 anos.")).toBeInTheDocument();
  });

  it("Complete Flow: Student Registration", async () => {
    signUpMock.mockResolvedValueOnce({ data: { user: { id: "123" } }, error: null });
    render(<SignUpForm {...defaultProps} />);

    // STEP 1
    await fillStep1();
    fireEvent.click(screen.getByText("Próximo"));

    // STEP 2
    await fillStep2();
    fireEvent.click(screen.getByText("Próximo"));

    // STEP 3 (Student Default)
    // Wait for animation
    const parentInput = await screen.findByPlaceholderText("Nome do responsável");
    await userEvent.type(parentInput, "Maria da Silva");
    await userEvent.type(screen.getByPlaceholderText("Escola atual"), "Escola X");
    await userEvent.type(screen.getByPlaceholderText("Série / Ano"), "9º Ano");
    fireEvent.click(screen.getByText("Próximo"));

    // STEP 4
    const emailInput = await screen.findByPlaceholderText("Seu melhor E-mail");
    await userEvent.type(emailInput, "aluno@test.com");
    await userEvent.type(screen.getByPlaceholderText("Senha segura"), "123456");
    await userEvent.type(screen.getByPlaceholderText("Confirme a senha"), "123456");

    // Submit
    const submitBtn = screen.getByText("Concluir Cadastro");
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(signUpMock).toHaveBeenCalledWith({
        email: "aluno@test.com",
        password: "123456",
        options: {
          data: {
            full_name: "João da Silva",
            user_type: "student",
            phone: "11999999999",
            address: "São Paulo, SP",
            document: "12345678901",
            birth_date: "2000-01-01",
            parent_name: "Maria da Silva",
            school: "Escola X",
            grade: "9º Ano"
          },
          emailRedirectTo: "http://localhost:3000/protected",
        },
      });
      expect(toast.success).toHaveBeenCalled();
    });
  });

  it("Complete Flow: Teacher Registration", async () => {
    signUpMock.mockResolvedValueOnce({ data: { user: { id: "456" } }, error: null });
    render(<SignUpForm {...defaultProps} />);

    // STEP 1 (Select Teacher)
    fireEvent.click(screen.getByText("Professor"));
    await fillStep1({ name: "Prof. Alberto" });
    fireEvent.click(screen.getByText("Próximo"));

    // STEP 2
    await fillStep2();
    fireEvent.click(screen.getByText("Próximo"));

    // STEP 3 (Teacher Fields)
    // Wait for step 3
    const schoolInput1 = await screen.findByPlaceholderText("Escola 1");
    // Ensure we are on the teacher view
    
    await userEvent.type(schoolInput1, "Escola A");
    
    const addSchoolBtn = screen.getByText("Adicionar outra escola");
    fireEvent.click(addSchoolBtn);
    
    const schoolInput2 = await screen.findByPlaceholderText("Escola 2");
    await userEvent.type(schoolInput2, "Escola B");

    // Select Education Level
    const select = screen.getByRole("combobox"); 
    fireEvent.change(select, { target: { value: "graduacao" } });

    await userEvent.type(screen.getByPlaceholderText("Formação (ex: Matemática)"), "Matemática");
    fireEvent.click(screen.getByText("Próximo"));

    // STEP 4
    const emailInput = await screen.findByPlaceholderText("Seu melhor E-mail");
    await userEvent.type(emailInput, "prof@test.com");
    await userEvent.type(screen.getByPlaceholderText("Senha segura"), "password123");
    await userEvent.type(screen.getByPlaceholderText("Confirme a senha"), "password123");

    // Submit
    fireEvent.click(screen.getByText("Concluir Cadastro"));

    await waitFor(() => {
      expect(signUpMock).toHaveBeenCalledWith(expect.objectContaining({
        email: "prof@test.com",
        options: expect.objectContaining({
          data: expect.objectContaining({
            user_type: "teacher",
            education_level: "graduacao",
            degree: "Matemática",
            schools: ["Escola A", "Escola B"],
          })
        })
      }));
    });
  });

  it("Validates password mismatch in Step 4", async () => {
    render(<SignUpForm {...defaultProps} />);
    
    // Fill to step 4...
    await fillStep1();
    fireEvent.click(screen.getByText("Próximo"));
    await fillStep2();
    fireEvent.click(screen.getByText("Próximo"));
    
    // Student step 3 fill
    const parentInput = await screen.findByPlaceholderText("Nome do responsável");
    await userEvent.type(parentInput, "Pai");
    await userEvent.type(screen.getByPlaceholderText("Escola atual"), "E");
    await userEvent.type(screen.getByPlaceholderText("Série / Ano"), "1");
    fireEvent.click(screen.getByText("Próximo"));

    // Step 4
    const emailInput = await screen.findByPlaceholderText("Seu melhor E-mail");
    await userEvent.type(emailInput, "a@a.com");
    await userEvent.type(screen.getByPlaceholderText("Senha segura"), "123456");
    await userEvent.type(screen.getByPlaceholderText("Confirme a senha"), "654321");

    fireEvent.click(screen.getByText("Concluir Cadastro"));

    expect(await screen.findByText("As senhas não conferem.")).toBeInTheDocument();
    expect(signUpMock).not.toHaveBeenCalled();
  });
});