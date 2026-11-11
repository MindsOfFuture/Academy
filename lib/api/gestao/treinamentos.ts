import "server-only";
import { createClient } from "@/lib/supabase/server";

export interface VideoTreinamento { id: string; numero: number; titulo: string; youtubeId: string; aberto: boolean; concluido: boolean }
export interface LinhaTreinamento {
  numero: number; titulo: string; nome: string; email: string;
  abertoEm: string | null; ultimoAcessoEm: string | null; acessos: number; concluidoEm: string | null;
}

export async function listarTreinamentos(): Promise<VideoTreinamento[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("treinamento_videos");
  if (error) throw new Error(error.message);
  return ((data ?? []) as { id: string; numero: number; titulo: string; youtube_id: string; aberto: boolean; concluido: boolean }[])
    .map((v) => ({ id: v.id, numero: v.numero, titulo: v.titulo, youtubeId: v.youtube_id, aberto: v.aberto, concluido: v.concluido }));
}

export async function resumoTreinamentos(): Promise<LinhaTreinamento[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("treinamento_resumo");
  if (error) throw new Error(error.message);
  return ((data ?? []) as { numero: number; titulo: string; nome: string; email: string; aberto_em: string | null; ultimo_acesso_em: string | null; acessos: number; concluido_em: string | null }[])
    .map((r) => ({ numero: r.numero, titulo: r.titulo, nome: r.nome, email: r.email, abertoEm: r.aberto_em, ultimoAcessoEm: r.ultimo_acesso_em, acessos: r.acessos, concluidoEm: r.concluido_em }));
}

export async function registrarTreinamento(videoId: string, concluiu: boolean): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("treinamento_registrar", { p_video: videoId, p_concluiu: concluiu });
  if (error) throw new Error(error.message);
}

export async function salvarTreinamento(numero: number, titulo: string, youtubeId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("treinamento_salvar_video", { p_numero: numero, p_titulo: titulo, p_youtube_id: youtubeId });
  if (error) throw new Error(error.message);
}
