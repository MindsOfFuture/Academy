/**
 * Fonte única da verdade sobre as variáveis de ambiente obrigatórias do Supabase.
 *
 * Regras deste módulo:
 * - NUNCA imprime o VALOR de uma variável, só o NOME. Log de erro vai para stderr
 *   de servidor e pode acabar em agregador de logs.
 * - Leitura por acesso literal (`process.env.NOME`), nunca por índice dinâmico:
 *   o Next só substitui `process.env.X` estático no bundle (edge/middleware e
 *   client), e `process.env[nome]` sairia como `undefined` nesses runtimes.
 * - A leitura acontece a cada chamada, não no import, para que o boot e os testes
 *   enxerguem o env vigente.
 */

export const REQUIRED_SUPABASE_ENV = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
] as const;

export type RequiredSupabaseEnvName = (typeof REQUIRED_SUPABASE_ENV)[number];

/** Onde achar cada valor. Entra na mensagem de erro; não contém segredo. */
const ENV_HINTS: Record<RequiredSupabaseEnvName, string> = {
  NEXT_PUBLIC_SUPABASE_URL:
    "URL do projeto — Supabase > Project Settings > API > Project URL (ex.: https://seu-projeto.supabase.co)",
  NEXT_PUBLIC_SUPABASE_ANON_KEY:
    "chave pública — Supabase > Project Settings > API > Project API keys > anon public",
};

/** Acesso literal (ver cabeçalho): não trocar por `process.env[nome]`. */
function readSupabaseEnv(): Record<RequiredSupabaseEnvName, string | undefined> {
  return {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };
}

export type InvalidSupabaseEnv = {
  name: RequiredSupabaseEnvName;
  /** Motivo em português, sem citar o valor. */
  reason: string;
};

export type SupabaseEnvReport = {
  /** Variáveis ausentes ou preenchidas só com espaços. */
  missing: RequiredSupabaseEnvName[];
  /** Variáveis presentes mas com formato inválido. */
  invalid: InvalidSupabaseEnv[];
  /** true só quando não há nenhuma ausente nem inválida. */
  ok: boolean;
};

/**
 * Nomes das variáveis obrigatórias do Supabase que estão ausentes ou vazias.
 * String só com espaços conta como ausente. Lista vazia = configuração completa.
 *
 * É o gate que o middleware usa para negar acesso (fail-closed). Formato inválido
 * NÃO entra aqui de propósito: uma URL malformada quebra sozinha na criação do
 * cliente, e derrubar o middleware por isso esconderia o erro real.
 */
export function missingSupabaseEnv(): RequiredSupabaseEnvName[] {
  const env = readSupabaseEnv();
  return REQUIRED_SUPABASE_ENV.filter((name) => (env[name] ?? "").trim() === "");
}

/**
 * Variáveis presentes que não passam na validação mínima de formato:
 * a URL precisa ser absoluta e http(s); a chave precisa ter conteúdo.
 */
export function invalidSupabaseEnv(): InvalidSupabaseEnv[] {
  const env = readSupabaseEnv();
  const problems: InvalidSupabaseEnv[] = [];

  const url = (env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
  if (url !== "") {
    let parsed: URL | null = null;
    try {
      parsed = new URL(url);
    } catch {
      parsed = null;
    }
    if (!parsed) {
      problems.push({
        name: "NEXT_PUBLIC_SUPABASE_URL",
        reason: "não é uma URL absoluta válida (esperado algo como https://seu-projeto.supabase.co)",
      });
    } else if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      problems.push({
        name: "NEXT_PUBLIC_SUPABASE_URL",
        reason: "precisa usar o esquema https:// (http:// só em ambiente local)",
      });
    }
  }

  return problems;
}

/** Diagnóstico completo do ambiente do Supabase. */
export function checkSupabaseEnv(): SupabaseEnvReport {
  const missing = missingSupabaseEnv();
  const invalid = invalidSupabaseEnv();
  return { missing, invalid, ok: missing.length === 0 && invalid.length === 0 };
}

/**
 * Mensagem de erro legível listando cada problema. Só nomes de variáveis e
 * instruções — nenhum valor é interpolado aqui.
 */
export function formatSupabaseEnvError(report: SupabaseEnvReport): string {
  const linhas: string[] = [
    "Configuração do Supabase inválida — o Academy não pode subir assim.",
  ];

  if (report.missing.length > 0) {
    linhas.push("", "Variáveis obrigatórias ausentes ou vazias:");
    for (const name of report.missing) {
      linhas.push(`  - ${name}: ${ENV_HINTS[name]}`);
    }
  }

  if (report.invalid.length > 0) {
    linhas.push("", "Variáveis presentes com formato inválido:");
    for (const { name, reason } of report.invalid) {
      linhas.push(`  - ${name}: ${reason}`);
    }
  }

  linhas.push(
    "",
    "Como configurar: copie `.env.example` para `.env.local` (dev) ou preencha",
    "`/etc/academy.env` no VPS (ver docs/deploy-vps.md) e preencha os campos acima.",
    "Enquanto faltar env var, o middleware nega TODAS as rotas não isentas com 503",
    "(fail-closed) — nenhuma rota fica aberta.",
    "Lembre: `NEXT_PUBLIC_*` são embutidas no build; alterou? rebuild, restart não basta.",
  );

  return linhas.join("\n");
}

export type AssertSupabaseEnvOptions = {
  /** Default: `process.env.NODE_ENV`. */
  nodeEnv?: string;
  /** Default: `console.error`. */
  logger?: (message: string) => void;
};

/**
 * Validação de boot. Em produção lança e derruba o processo com mensagem clara;
 * fora de produção loga o mesmo diagnóstico e deixa seguir — o middleware
 * continua fail-closed, então nenhuma rota protegida é liberada. Ambiente
 * completo = silêncio total (nenhum log novo no boot saudável).
 */
export function assertSupabaseEnv(
  options: AssertSupabaseEnvOptions = {},
): SupabaseEnvReport {
  const report = checkSupabaseEnv();
  if (report.ok) return report;

  const nodeEnv = options.nodeEnv ?? process.env.NODE_ENV;
  const mensagem = formatSupabaseEnvError(report);

  if (nodeEnv === "production") {
    throw new Error(mensagem);
  }

  const log = options.logger ?? ((m: string) => console.error(m));
  log(
    `\n${"=".repeat(72)}\n[env] ${mensagem}\n[env] Ambiente não-produção: seguindo o boot, mas as rotas protegidas respondem 503.\n${"=".repeat(72)}\n`,
  );
  return report;
}
