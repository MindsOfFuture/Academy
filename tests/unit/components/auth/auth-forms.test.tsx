import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

let params = new URLSearchParams();
vi.mock("next/navigation", () => ({ useSearchParams: () => params }));
vi.mock("@/components/auth/login-form", () => ({ LoginForm: () => <div>tela-login</div> }));
vi.mock("@/components/auth/sign-up-form", () => ({
  SignUpForm: ({ nextPath }: { nextPath?: string | null }) => <div>tela-cadastro:{String(nextPath)}</div>,
}));

import { AuthForms } from "@/components/auth/auth-forms";

/** O bloco `md:hidden` é o do celular: uma tela por vez. */
const telaDoCelular = (container: HTMLElement) => container.querySelector(".md\\:hidden")!.textContent;

describe("AuthForms", () => {
  beforeEach(() => { params = new URLSearchParams(); });

  it("abre no login por padrão", () => {
    const { container } = render(<AuthForms />);
    expect(telaDoCelular(container)).toBe("tela-login");
  });

  it("modo=cadastro abre no cadastro e repassa o next validado", () => {
    params = new URLSearchParams({ modo: "cadastro", next: "/lg2/jornada/index.html" });
    const { container } = render(<AuthForms />);
    expect(telaDoCelular(container)).toBe("tela-cadastro:/lg2/jornada/index.html");
  });

  it("descarta next externo", () => {
    params = new URLSearchParams({ modo: "cadastro", next: "//evil.example" });
    const { container } = render(<AuthForms />);
    expect(telaDoCelular(container)).toBe("tela-cadastro:null");
    expect(screen.getAllByText("tela-cadastro:null").length).toBe(2);
  });
});
