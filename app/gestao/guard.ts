import "server-only";
import { notFound, redirect } from "next/navigation";
import { gestaoHabilitada } from "@/lib/api/gestao/feature-flags";
import { ensureGestaoMember } from "@/lib/api/gestao/auth";
import type { GestaoPapel } from "@/lib/api/gestao/types";

/**
 * Guard único das telas de `/gestao` (specs/constitution.md §III):
 *  1. flag desligada → 404 (o módulo some sem deploy);
 *  2. anônimo → login, voltando para a tela pedida;
 *  3. sem papel no projeto, ou desligado → 404 (não revela que a tela existe);
 *  4. `apenas` restringe a um papel → 404 para o outro.
 *
 * Layout e página chamam os dois: no App Router eles renderizam em paralelo, e a
 * página não pode confiar que o layout barrou antes. A RLS continua sendo a
 * autorização de cada query.
 */
export async function exigirMembro(caminho: string, apenas?: GestaoPapel): Promise<GestaoPapel> {
  if (!gestaoHabilitada()) notFound();

  let papel: GestaoPapel;
  try {
    papel = await ensureGestaoMember();
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("não autenticado")) {
      redirect(`/auth?next=${encodeURIComponent(caminho)}`);
    }
    notFound();
  }

  if (apenas && papel !== apenas) notFound();
  return papel;
}
