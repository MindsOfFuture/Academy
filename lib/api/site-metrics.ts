import { createClient } from "@/lib/supabase/server";

/** Acessos de um produto do site no período (usuários distintos e total de acessos). */
export interface ProductAccess {
  rota: string;
  usuarios: number;
  acessos: number;
}

export interface Lg2ModuleUsage {
  modulo: number;
  abriram: number;
  concluiram: number;
}

/** Resposta da RPC public.get_site_metrics: só contagens, nunca identidade. */
export interface SiteMetrics {
  novosCadastros: number;
  acessosPorProduto: ProductAccess[];
  lg2: {
    usuarios: number;
    porModulo: Lg2ModuleUsage[];
    jornadaConcluida: number;
  };
}

export async function getSiteMetrics(params: { from?: string; to?: string }): Promise<SiteMetrics> {
  // Cliente SSR autenticado: a RPC é SECURITY DEFINER e confere o papel admin.
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) throw new Error("Usuário não autenticado.");
  const { data, error } = await supabase.rpc("get_site_metrics", {
    p_from: params.from ?? null,
    p_to: params.to ?? null,
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Números do site indisponíveis.");
  return data as SiteMetrics;
}
