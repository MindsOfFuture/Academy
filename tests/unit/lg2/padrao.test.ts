import { JSDOM } from "jsdom";
import { runInNewContext } from "node:vm";
import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";

const MODULES = [
  "turma-a/m01", "turma-b/m02", "turma-a/m03", "turma-a/m04", "turma-a/m05",
  "turma-b/m06", "turma-b/m07", "turma-b/m08", "turma-b/m09", "turma-b/m10",
];
const ROOT = "public/lg2/";
const COMMON = ["css/padrao.css", "js/padrao.js", "js/progresso.js"];

function read(path: string) {
  return readFileSync(ROOT + path, "utf8");
}

function evaluateData(path: string, name: string) {
  const context: { window: Record<string, unknown> } = { window: {} };
  runInNewContext(read(path), context, { timeout: 1_000 });
  return context.window[name] as Record<string, unknown>;
}

describe("padrão compartilhado dos dez módulos LG2", () => {
  it("mantém o mesmo cabeçalho, salvamento e estilos em todos os módulos", () => {
    for (const asset of COMMON) {
      const original = read(`${MODULES[0]}/${asset}`);
      for (const module of MODULES.slice(1)) {
        expect(read(`${module}/${asset}`), `${module}/${asset}`).toBe(original);
      }
    }
  });

  it("liga a sincronização autenticada, o cabeçalho comum e as fontes em cada entrada", () => {
    for (const module of MODULES) {
      const html = read(`${module}/index.html`);
      expect(html, module).toContain("js/progresso.js");
      expect(html, module).toContain("js/padrao.js");
      expect(html, module).toContain("dados/fontes.js");
      expect(html, module).toContain("css/padrao.css");

      const fontes = read(`${module}/dados/fontes.js`);
      expect(fontes, module).toMatch(/window\.LG2_FONTES\s*=/);
      expect(fontes, module).toMatch(/\"titulo\"\s*:/);
      expect(fontes, module).toMatch(/\"orgao\"\s*:/);
      expect(fontes, module).toMatch(/\"consulta\"\s*:/);
      expect(fontes, module).toMatch(/https:\/\//);
    }
  });

  it("links fontes ao conceito do M1 e aos termos aplicados no M7", () => {
    const m1 = evaluateData("turma-a/m01/dados/fontes.js", "LG2_FONTES") as unknown as {
      fontes: Array<{ conceitos: string[] }>;
    };
    const m1Codes = new Set(m1.fontes.flatMap((fonte) => fonte.conceitos));
    expect(m1Codes).toContain("M1.BT03");
    expect(m1Codes).toContain("M1.BT05");

    const m7 = evaluateData("turma-b/m07/dados/modulo7.js", "MODULO7") as unknown as {
      termos: Array<{ termo: string }>;
    };
    const m7Fontes = evaluateData("turma-b/m07/dados/fontes.js", "LG2_FONTES") as unknown as {
      fontes: Array<{ conceitos: string[] }>;
    };
    const cobertos = new Set(m7Fontes.fontes.flatMap((fonte) => fonte.conceitos));
    for (const { termo } of m7.termos.filter(({ termo }) => termo !== "Perda")) {
      expect(cobertos, `Fonte ausente para o termo ${termo}`).toContain(termo);
    }
    expect(read("turma-b/m07/js/app.js")).toContain("LG2Padrao.linkFonte(t.termo)");
  });

  it("asks before linking unowned local progress to the account", async () => {
    const dom = new JSDOM("<!doctype html><body><button type='button' data-p-salvar>Salvar e sair</button></body>", {
      url: "https://academy.example.org/lg2/turma-a/m01/",
      runScripts: "outside-only",
    });
    const salvar = vi.fn().mockResolvedValue(true);
    (dom.window as unknown as { LG2Progresso: unknown }).LG2Progresso = {
      pronto: Promise.resolve(true),
      needsConfirmation: true,
      contaTemDados: false,
      salvar,
    };
    dom.window.eval(read("turma-a/m01/js/padrao.js"));
    dom.window.document.querySelector("[data-p-salvar]")?.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(dom.window.document.querySelector(".p-dialogo")?.textContent).toContain("Progresso ainda não vinculado");
    expect(salvar).not.toHaveBeenCalled();

    dom.window.document.querySelector("[data-p-confirmar-salvar]")?.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(salvar).toHaveBeenCalledWith(true);
    expect(dom.window.document.querySelector(".p-dialogo")?.textContent).toContain("Pronto, está salvo!");
    dom.window.close();
  });
});
