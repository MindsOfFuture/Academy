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
      return app.match(/CHAVE\s*=\s*(['"])([^'"]+)\1/)?.[2];
    }),
  );
  expect(chaves).toEqual(["lg2-turma-a-m01", "lg2-turma-a-m03", "lg2-turma-a-m04", "lg2-turma-a-m05", "lg2-turma-b-m02", "lg2-turma-b-m06", "lg2-turma-b-m07", "lg2-turma-b-m08", "lg2-turma-b-m09", "lg2-turma-b-m10"]);
});

it("o fim de cada módulo pronto leva ao próximo módulo pronto, em qualquer turma", () => {
  const todos = (["a", "b"] as const)
    .flatMap((turma) => PRONTOS[turma].map((numero) => ({ turma, numero })))
    .sort((x, y) => x.numero - y.numero);
  todos.forEach(({ turma, numero }, i) => {
    const app = readFileSync(path.join(process.cwd(), "public", caminhoModulo(turma, numero).replace("index.html", "js/app.js")), "utf8");
    const blocos = app.match(/<div class="acoes lg2-proximo">.*?<\/div>/g) ?? [];
    expect(blocos).toHaveLength(1);
    const seguinte = todos[i + 1];
    if (seguinte) {
      expect(blocos[0]).toContain(`href="${caminhoModulo(seguinte.turma, seguinte.numero)}">Ir para o Módulo ${seguinte.numero}<`);
    } else {
      expect(blocos[0]).toContain(`href="/protected/modulos/laboratorio-de-gestao?aba=${turma}">Voltar aos módulos<`);
    }
  });
});
