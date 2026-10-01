import { render, screen, within } from "@testing-library/react";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import ModulosTurma from "@/components/modules/laboratorio-gestao/ModulosTurma";
import { PRONTOS, caminhoModulo } from "@/components/modules/laboratorio-gestao/turmas";

describe.each(["a", "b"] as const)("Turma %s", (turma) => {
  it("lista os 10 módulos; os prontos abrem e os outros dizem \"Em breve\"", () => {
    render(<ModulosTurma turma={turma} />);
    const lista = screen.getByRole("list", { name: `Módulos da Turma ${turma.toUpperCase()}` });
    const itens = within(lista).getAllByRole("listitem");
    expect(itens).toHaveLength(10);
    itens.forEach((item, i) => {
      const numero = i + 1;
      const link = within(item).queryByRole("link");
      if (PRONTOS[turma].includes(numero)) {
        expect(link).toHaveAttribute("href", caminhoModulo(turma, numero));
      } else {
        expect(link).toBeNull();
        expect(within(item).getByText("Em breve")).toBeInTheDocument();
      }
    });
  });

  it("todo módulo pronto tem a página publicada", () => {
    for (const numero of PRONTOS[turma]) {
      expect(existsSync(path.join(process.cwd(), "public", caminhoModulo(turma, numero)))).toBe(true);
    }
  });
});

it("cada módulo publicado guarda as respostas numa chave própria da turma", () => {
  const chaves = (["a", "b"] as const).flatMap((turma) =>
    PRONTOS[turma].map((numero) => {
      const app = readFileSync(path.join(process.cwd(), "public", caminhoModulo(turma, numero).replace("index.html", "js/app.js")), "utf8");
      return app.match(/CHAVE = "([^"]+)"/)?.[1];
    }),
  );
  expect(chaves).toEqual(["lg2-turma-a-m01", "lg2-turma-a-m02", "lg2-turma-a-m05", "lg2-turma-a-m06", "lg2-turma-b-m08", "lg2-turma-b-m09"]);
});
