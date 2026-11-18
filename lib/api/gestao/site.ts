import "server-only";
import { createClient } from "@/lib/supabase/server";

type Destaque = { base: number; rotulo: string; mostrar: boolean };

/**
 * Números da página inicial (specs 019 e 028): número base, texto e se aparece, para
 * escolas, alunos e aulas. A leitura é a mesma da página inicial
 * (`lib/api/content.ts#getHero`); a escrita passa só por
 * `gestao.definir_destaques_do_site`, que confere a coordenação e grava tudo junto.
 */
export async function definirDestaquesDoSite(d: { escolas: Destaque; alunos: Destaque; aulas: Destaque }): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.schema("gestao").rpc("definir_destaques_do_site", {
    p_escolas: d.escolas.base,
    p_alunos: d.alunos.base,
    p_aulas: d.aulas.base,
    p_rotulo_escolas: d.escolas.rotulo,
    p_rotulo_alunos: d.alunos.rotulo,
    p_rotulo_aulas: d.aulas.rotulo,
    p_mostrar_escolas: d.escolas.mostrar,
    p_mostrar_alunos: d.alunos.mostrar,
    p_mostrar_aulas: d.aulas.mostrar,
  });
  if (error) throw new Error(error.message);
}
