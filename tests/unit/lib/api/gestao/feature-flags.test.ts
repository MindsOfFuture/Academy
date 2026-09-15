import { afterEach, describe, expect, it } from "vitest";

vi.mock("server-only", () => ({}));

import { gestaoHabilitada } from "@/lib/api/gestao/feature-flags";

describe("lib/api/gestao/feature-flags — gestaoHabilitada", () => {
  const original = process.env.GESTAO_ENABLED;

  afterEach(() => {
    if (original === undefined) delete process.env.GESTAO_ENABLED;
    else process.env.GESTAO_ENABLED = original;
  });

  it("desliga quando a variável está ausente (fail-closed)", () => {
    delete process.env.GESTAO_ENABLED;
    expect(gestaoHabilitada()).toBe(false);
  });

  it("desliga quando a variável está vazia", () => {
    process.env.GESTAO_ENABLED = "";
    expect(gestaoHabilitada()).toBe(false);
  });

  it("desliga com valor não reconhecido", () => {
    process.env.GESTAO_ENABLED = "talvez";
    expect(gestaoHabilitada()).toBe(false);
  });

  it.each(["true", "TRUE", "1", "on", "yes"])("liga com %s", (valor) => {
    process.env.GESTAO_ENABLED = valor;
    expect(gestaoHabilitada()).toBe(true);
  });
});