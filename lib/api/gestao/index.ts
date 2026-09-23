/**
 * Módulo de gestão interna (spec 002) — fronteira única de query do schema
 * `gestao.*`. Reexporta as funções de leitura/indicadores; nenhum outro arquivo
 * do repo deve consultar `gestao.*` diretamente.
 *
 * Inclui também a autorização de membro (`auth.ts`) e a feature flag
 * (`feature-flags.ts`) que a rota `/gestao` consome.
 */

export * from "./types";
export * from "./entities";
export * from "./indicators";
export * from "./auth";
export * from "./feature-flags";
export * from "./equipe";
export * from "./pendencias";
export * from "./validacao";
