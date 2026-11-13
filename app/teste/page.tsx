import { redirect } from "next/navigation";
import { usuarioDaRequisicao } from "@/lib/supabase/server";

const JORNADA = "/lg2/jornada/index.html";

/**
 * Entrada do teste do Laboratório de Gestão: usa a conta normal do site.
 * Quem já entrou vai direto para a jornada; quem não entrou cria a conta
 * (ou entra) e volta para a jornada.
 */
export default async function TestePage() {
  const usuario = await usuarioDaRequisicao();
  if (usuario) redirect(JORNADA);
  redirect(`/auth?${new URLSearchParams({ next: JORNADA, modo: "cadastro" }).toString()}`);
}
