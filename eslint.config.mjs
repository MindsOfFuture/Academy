import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const GESTAO_RLS =
  "A gestão não pode ignorar o RLS. Use createClient() de @/lib/supabase/server; " +
  "se o RLS bloquear algo legítimo, ajuste a policy numa migração *_gestao_*.sql (ADR 021) com teste em tests/integration/.";

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "@next/next/no-img-element": "warn",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
  // Gestão: todo acesso ao banco passa pelo RLS do schema `gestao` (ADR 021 em
  // docs/decisions.md). Os clientes service-role ignoram o RLS, então ficam
  // proibidos aqui. Prova de que a trava recusa: tests/unit/eslint-gestao.test.ts.
  {
    files: ["app/gestao/**", "app/api/gestao/**", "lib/api/gestao/**"],
    rules: {
      "no-restricted-imports": ["error", {
        paths: [
          { name: "@supabase/supabase-js", message: GESTAO_RLS },
          { name: "@supabase/ssr", message: GESTAO_RLS },
        ],
        patterns: [{
          regex: "supabase/server$",
          importNames: ["createServiceRoleClient", "createAdminClient"],
          message: GESTAO_RLS,
        }],
      }],
      "no-restricted-syntax": ["error", {
        selector: "Identifier[name='SUPABASE_SERVICE_ROLE_KEY'], Literal[value='SUPABASE_SERVICE_ROLE_KEY']",
        message: GESTAO_RLS,
      }],
    },
  },
];

export default eslintConfig;
