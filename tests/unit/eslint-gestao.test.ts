// @vitest-environment node
import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

// Trava do eslint.config.mjs: dentro da gestão, nada de cliente que ignora o RLS.
const eslint = new ESLint({ cwd: process.cwd() });
const TRAVA = ["no-restricted-imports", "no-restricted-syntax"];

async function errosDaTrava(code: string, filePath: string) {
  const [result] = await eslint.lintText(code, { filePath });
  return result.messages.filter((m) => m.ruleId && TRAVA.includes(m.ruleId) && m.severity === 2);
}

const ATALHOS = {
  "createServiceRoleClient": 'import { createServiceRoleClient } from "@/lib/supabase/server";',
  "createAdminClient (caminho relativo)": 'import { createAdminClient } from "../../supabase/server";',
  "supabase-js direto": 'import { createClient } from "@supabase/supabase-js";',
  "chave service-role": "export const k = process.env.SUPABASE_SERVICE_ROLE_KEY;",
  "chave service-role por índice": 'export const k = process.env["SUPABASE_SERVICE_ROLE_KEY"];',
};

describe("trava de RLS na gestão", { timeout: 30_000 }, () => {
  for (const [nome, code] of Object.entries(ATALHOS)) {
    it(`recusa ${nome} em lib/api/gestao e app/gestao`, async () => {
      for (const filePath of ["lib/api/gestao/x.ts", "app/gestao/x/actions.ts"]) {
        const erros = await errosDaTrava(code, filePath);
        expect(erros).toHaveLength(1);
        expect(erros[0].message).toContain("Use createClient() de @/lib/supabase/server");
      }
    });
  }

  it("aceita o cliente com RLS na gestão", async () => {
    const code = 'import { createClient } from "@/lib/supabase/server";';
    expect(await errosDaTrava(code, "lib/api/gestao/x.ts")).toEqual([]);
  });

  it("não vale fora da gestão", async () => {
    expect(await errosDaTrava(ATALHOS.createServiceRoleClient, "lib/api/notifications-server.ts")).toEqual([]);
  });
});
