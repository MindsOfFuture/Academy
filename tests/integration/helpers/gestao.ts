import { readFileSync } from "node:fs";
import type { PGlite } from "@electric-sql/pglite";

/**
 * Migrações da gestão na ordem em que foram aplicadas em produção
 * (list_migrations do Supabase — não é a ordem alfabética: membro_rpc veio
 * depois de modelo_operacional). Teste novo da gestão entra aqui no fim, e
 * cada teste aplica a cadeia até a migração que testa, como produção a tem.
 */
export const GESTAO_EM_ORDEM = [
  "20260905_gestao_modelo_operacional",
  "20260905_gestao_membro_rpc",
  "20260923_gestao_fundacao",
  "20260924_gestao_melhorias",
  "20260928_gestao_papeis_acumulados",
  "20260928_gestao_sem_valor_na_bolsa",
  "20261009_gestao_alocacao",
  "20261009_gestao_alocacao_coberto_sem_fk",
  "20261009_gestao_buscar_usuarios",
  "20261009_gestao_agenda_sem_escola",
  "20261009_gestao_substituir_quem_ja_esta",
  "20261009_gestao_substituto_de_fora",
  "20261009_gestao_remover_do_encontro",
  "20261009_gestao_concluir_encontro",
  "20261009_gestao_concluir_depois_do_inicio",
  "20261009_gestao_horas_de_quem_cobriu",
  "20261009_gestao_gestor_lembrete",
  "20261009_gestao_lembrete_no_modelo",
  "20261018_gestao_notas_de_encerramento",
  "20261018_gestao_sem_gestor", // aplicada à mão em produção (a coluna já não existe)
  "20261019_gestao_dados_de_teste",
  "20261021_gestao_numeros_do_site",
  "20261108_gestao_numeros_da_home",
  "20261108_gestao_relatorio",
  "20261108_gestao_relatorio_coordenacao",
  "20261108_gestao_relatorio_editar",
  "20261108_gestao_relatorio_comprovacao",
  "20261108_gestao_quem_cobriu_ve_o_encontro",
  "20261109_gestao_relatorio_meu_perfil",
  "20261109_gestao_limpar_encontros_de_teste",
  "20261110_gestao_link_de_comprovacao",
  "20261111_gestao_artigos_do_site",
  "20261112_gestao_link_no_relatorio",
  "20261113_gestao_importar_planilha",
  "20261114_gestao_numero_da_aula",
  "20261115_gestao_atrasos_e_metas",
  "20261116_gestao_espacos",
  "20261117_gestao_pesquisa",
] as const;

export type MigracaoGestao = (typeof GESTAO_EM_ORDEM)[number];

export const sqlDaMigracao = (nome: MigracaoGestao) => readFileSync(`supabase/migrations/${nome}.sql`, "utf8");

/** SQL das migrações da gestão até `ultima` (inclusive), na ordem de produção. */
export function gestaoAte(ultima: MigracaoGestao): string[] {
  return GESTAO_EM_ORDEM.slice(0, GESTAO_EM_ORDEM.indexOf(ultima) + 1).map(sqlDaMigracao);
}

/** Até a anterior a `proxima`: para testar a migração sobre dados gravados antes dela. */
export function gestaoAntes(proxima: MigracaoGestao): string[] {
  return GESTAO_EM_ORDEM.slice(0, GESTAO_EM_ORDEM.indexOf(proxima)).map(sqlDaMigracao);
}

/** Roda `fn` como usuário logado `uid` (role authenticated + sub do JWT), sempre desfazendo. */
export function comoUsuario(db: PGlite) {
  return async function como<T>(uid: string, fn: () => Promise<T>): Promise<T> {
    await db.exec(`set role authenticated`);
    await db.exec(`set request.jwt.claim.sub = '${uid}'`);
    try {
      return await fn();
    } finally {
      await db.exec(`reset role`);
      await db.exec(`reset request.jwt.claim.sub`);
    }
  };
}
