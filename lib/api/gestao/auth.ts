import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { GestaoPapel } from "./types";

/**
 * Autorização do módulo de gestão interna (spec 002).
 *
 * O papel de membro (`coordenacao` | `bolsista`) vive em `gestao.papel_membro`,
 * resolvido por `auth.uid()`. Como a RLS de `papel_membro` só deixa a
 * coordenação ler a tabela, o papel do chamador é resolvido via RPC na função
 * `public.gestao_membro_papel()` (SECURITY DEFINER, `set search_path`) — a única
 * via imune à RLS e sem caminho de service role. Ver migration
 * `20260905_gestao_membro_rpc.sql`.
 *
 * A checagem é defesa em profundidade: a RLS de cada tabela `gestao.*` continua
 * sendo a autorização canônica das queries; este guard apenas decide o acesso à
 * rota/UI antes de qualquer leitura.
 */

/** Nome da RPC pública que resolve o papel de membro do chamador. */
const RPC_PAPEL_MEMBRO = "gestao_membro_papel";

/**
 * Papel de membro do usuário autenticado, ou `null` quando ele não tem nenhum
 * papel no projeto (ou quando a rota não está autenticada).
 */
export async function getGestaoPapel(): Promise<GestaoPapel | null> {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return null;

  const { data, error } = await supabase.rpc(RPC_PAPEL_MEMBRO);
  if (error) throw new Error(error.message);

  const papel = (data as GestaoPapel | null | undefined) ?? null;
  return papel === "coordenacao" || papel === "bolsista" ? papel : null;
}

/**
 * Garante que o chamador é membro do projeto (coordenacao ou bolsista).
 * Lança erro 403 em português quando autenticado sem papel, e erro de
 * autenticação quando anônimo — as mensagens seguem o contrato de
 * `{ error: message }` com status inferido do texto (specs/constitution.md §VI).
 */
export async function ensureGestaoMember(): Promise<GestaoPapel> {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) {
    throw new Error("Usuário não autenticado.");
  }

  const papel = await getGestaoPapel();
  if (!papel) {
    throw new Error("Acesso negado. Apenas membros do projeto podem acessar a gestão.");
  }
  return papel;
}