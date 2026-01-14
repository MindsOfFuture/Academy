// tests/unit/components/auth/login-form.test.tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { LoginForm } from "@/components/auth/login-form";
import userEvent from "@testing-library/user-event";
import toast from "react-hot-toast";

// Mocks
const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

vi.mock("next/link", () => ({
  default: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}));

vi.mock("react-hot-toast", () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const signInWithPasswordMock = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      signInWithPassword: signInWithPasswordMock,
    },
  }),
}));

describe("LoginForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const defaultProps = {
    onToggleView: vi.fn(),
  };

  it("renders login form correctly", () => {
    render(<LoginForm {...defaultProps} />);
    
    expect(screen.getByPlaceholderText(/Email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Senha/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /entrar/i })).toBeInTheDocument();
  });

  it("handles input changes correctly", async () => {
    render(<LoginForm {...defaultProps} />);
    
    const emailInput = screen.getByPlaceholderText(/Email/i);
    const passwordInput = screen.getByPlaceholderText(/Senha/i);

    await userEvent.type(emailInput, "test@example.com");
    await userEvent.type(passwordInput, "password123");

    expect(emailInput).toHaveValue("test@example.com");
    expect(passwordInput).toHaveValue("password123");
  });

  it("submits form with valid credentials and redirects", async () => {
    signInWithPasswordMock.mockResolvedValueOnce({
      data: { user: { id: "123" } },
      error: null,
    });

    render(<LoginForm {...defaultProps} />);

    await userEvent.type(screen.getByPlaceholderText(/Email/i), "test@example.com");
    await userEvent.type(screen.getByPlaceholderText(/Senha/i), "password123");
    
    const submitButton = screen.getByRole("button", { name: /entrar/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(signInWithPasswordMock).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });
      expect(toast.success).toHaveBeenCalledWith("Login realizado com sucesso!");
      expect(pushMock).toHaveBeenCalledWith("/protected");
    });
  });

  it("displays error when login fails", async () => {
    const errorMessage = "Invalid login credentials";
    signInWithPasswordMock.mockResolvedValueOnce({
      data: null,
      error: new Error(errorMessage),
    });

    render(<LoginForm {...defaultProps} />);

    await userEvent.type(screen.getByPlaceholderText(/Email/i), "test@example.com");
    await userEvent.type(screen.getByPlaceholderText(/Senha/i), "wrongpassword");
    
    const submitButton = screen.getByRole("button", { name: /entrar/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(signInWithPasswordMock).toHaveBeenCalled();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(toast.error).toHaveBeenCalledWith(errorMessage);
    });
  });

  it("toggles password visibility", async () => {
    render(<LoginForm {...defaultProps} />);
    
    const passwordInput = screen.getByPlaceholderText(/Senha/i);
    expect(passwordInput).toHaveAttribute("type", "password");
    
    const toggleButton = screen.getByRole("button", { name: /mostrar senha/i });
    await userEvent.click(toggleButton);
    
    expect(passwordInput).toHaveAttribute("type", "text");
    expect(screen.getByRole("button", { name: /ocultar senha/i })).toBeInTheDocument();
    
    await userEvent.click(screen.getByRole("button", { name: /ocultar senha/i }));
    expect(passwordInput).toHaveAttribute("type", "password");
  });
});
