"use server";

import { ensureGestaoMember } from "@/lib/api/gestao/auth";

/**
 * Se o menu do usuário mostra "Gestão": módulo ligado e quem está logado é
 * coordenação ou bolsista. Mesma checagem do guard, então o link nunca leva a um 404.
 */
export async function temAcessoGestaoAction(): Promise<boolean> {
  try {
    await ensureGestaoMember();
    return true;
  } catch {
    return false;
  }
}
