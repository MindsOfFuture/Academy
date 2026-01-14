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

describe("SignUpForm", () => {
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

  it("renders signup form correctly", () => {
    render(<SignUpForm {...defaultProps} />);
    
    expect(screen.getByPlaceholderText(/nome/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/^senha$/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/repita a senha/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /criar conta/i })).toBeInTheDocument();
  });

  it("validates password mismatch locally", async () => {
    render(<SignUpForm {...defaultProps} />);

    await userEvent.type(screen.getByPlaceholderText(/nome/i), "John Doe");
    await userEvent.type(screen.getByPlaceholderText(/email/i), "john@example.com");
    await userEvent.type(screen.getByPlaceholderText(/^senha$/i), "password123");
    await userEvent.type(screen.getByPlaceholderText(/repita a senha/i), "password456");

    const submitButton = screen.getByRole("button", { name: /criar conta/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(signUpMock).not.toHaveBeenCalled();
      expect(screen.getByText("As senhas não coincidem. Tente novamente.")).toBeInTheDocument();
    });
  });

  it("submits form with valid data", async () => {
    signUpMock.mockResolvedValueOnce({
      data: { user: { id: "123" } },
      error: null,
    });

    render(<SignUpForm {...defaultProps} />);

    await userEvent.type(screen.getByPlaceholderText(/nome/i), "John Doe");
    await userEvent.type(screen.getByPlaceholderText(/email/i), "john@example.com");
    await userEvent.type(screen.getByPlaceholderText(/^senha$/i), "password123");
    await userEvent.type(screen.getByPlaceholderText(/repita a senha/i), "password123");
    
    const submitButton = screen.getByRole("button", { name: /criar conta/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(signUpMock).toHaveBeenCalledWith({
        email: "john@example.com",
        password: "password123",
        options: {
          data: { full_name: "John Doe" },
          emailRedirectTo: "http://localhost:3000/protected",
        },
      });
      expect(toast.success).toHaveBeenCalledWith("Conta criada com sucesso! Por favor verifique seu e-mail.");
    });
  });

  it("displays error when signup fails", async () => {
    const errorMessage = "Error creating account";
    signUpMock.mockResolvedValueOnce({
      data: null,
      error: new Error(errorMessage),
    });

    render(<SignUpForm {...defaultProps} />);

    await userEvent.type(screen.getByPlaceholderText(/nome/i), "John Doe");
    await userEvent.type(screen.getByPlaceholderText(/email/i), "john@example.com");
    await userEvent.type(screen.getByPlaceholderText(/^senha$/i), "password123");
    await userEvent.type(screen.getByPlaceholderText(/repita a senha/i), "password123");
    
    const submitButton = screen.getByRole("button", { name: /criar conta/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(signUpMock).toHaveBeenCalled();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it("toggles password visibility", async () => {
    render(<SignUpForm {...defaultProps} />);
    
    const passwordInput = screen.getByPlaceholderText(/^senha$/i);
    const repeatPasswordInput = screen.getByPlaceholderText(/repita a senha/i);
    
    const toggleButtons = screen.getAllByRole("button", { name: /mostrar senha/i });
    expect(toggleButtons).toHaveLength(2);

    await userEvent.click(toggleButtons[0]);
    expect(passwordInput).toHaveAttribute("type", "text");
    
    await userEvent.click(toggleButtons[1]);
    expect(repeatPasswordInput).toHaveAttribute("type", "text");
  });
});
