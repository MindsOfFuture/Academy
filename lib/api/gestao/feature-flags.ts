import "server-only";

/**
 * Feature flag do módulo de gestão interna (spec 002, guardrail #5 do plano
 * `docs/plans/sistema-interno-gestao.md`).
 *
 * A leitura é server-only e a cada chamada (não no import), para que o ambiente
 * vigente seja o que responde — mesmo molde do `lib/env.ts`. O valor é lido por
 * acesso literal (`process.env.GESTAO_ENABLED`), nunca por índice dinâmico, para
 * o Next embutir corretamente no bundle do servidor.
 *
 * Fail-closed: na ausência da variável (ou com valor não reconhecido como true),
 * o módulo fica DESLIGADO. Assim a rota `/gestao` nasce fechada e só abre quando
 * `GESTAO_ENABLED` for definida explicitamente — sem deploy, enquanto o módulo
 * amadurece.
 */

const TRUE_VALUES = new Set(["1", "true", "on", "yes"]);

/**
 * true apenas quando `GESTAO_ENABLED` está presente e vale um literal de
 * verdade reconhecido (case-insensitive). Qualquer outro caso desliga o módulo.
 */
export function gestaoHabilitada(): boolean {
  const raw = process.env.GESTAO_ENABLED;
  if (raw === undefined) return false;
  return TRUE_VALUES.has(raw.trim().toLowerCase());
}