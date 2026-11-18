import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/image", () => ({ default: (props: { alt: string }) => <span role="img" aria-label={props.alt} /> }));
vi.mock("@/components/counting/couting", () => ({ default: ({ to }: { to: number }) => <span>{to}</span> }));

import { Hero } from "@/components/hero_1/hero";

afterEach(cleanup);

/** Spec 028: a home mostra só os números marcados, com o texto da coordenação. */
describe("Hero", () => {
  it("mostra os destaques recebidos, com o texto de cada um", () => {
    render(
      <Hero
        subtitulo=""
        logoRef={null}
        destaques={[
          { chave: "escolas", rotulo: "Escolas parceiras", total: 50 },
          { chave: "alunos", rotulo: "Alunos impactados", total: 1503 },
        ]}
      />,
    );
    expect(screen.getByText("Escolas parceiras")).toBeInTheDocument();
    expect(screen.getByText("1503")).toBeInTheDocument();
    expect(screen.queryByText(/Aulas realizadas/)).not.toBeInTheDocument();
  });

  it("sem nenhum destaque, a faixa de números some", () => {
    const { container } = render(<Hero subtitulo="" logoRef={null} destaques={[]} />);
    expect(container.querySelector(".border-dotted")).toBeNull();
    expect(screen.getByText("Saiba mais")).toBeInTheDocument();
  });
});
