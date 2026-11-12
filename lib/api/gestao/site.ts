import "server-only";
import { createClient } from "@/lib/supabase/server";

/**
 * Números da página inicial (spec 019): escolas atendidas, alunos impactados e aulas realizadas.
 * A leitura é a mesma da página inicial (`lib/api/content.ts#getHero`); a
 * escrita passa só por `gestao.definir_numeros_do_site`, que confere a coordenação.
 */
export async function definirNumerosDoSite(escolas: number, alunos: number, aulas: number): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .schema("gestao")
    .rpc("definir_numeros_do_site", { p_escolas: escolas, p_alunos: alunos, p_aulas: aulas });
  if (error) throw new Error(error.message);
}
