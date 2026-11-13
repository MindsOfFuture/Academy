import { NextResponse } from "next/server";
import { createClient, usuarioDaRequisicao } from "@/lib/supabase/server";

/**
 * Progresso da jornada do Laboratório de Gestão guardado na conta.
 *
 * GET  -> { u, dados, atualizado_em }  (dados = null quando ainda não há cópia)
 * PUT  { dados: { "lg2-...": "<texto guardado no navegador>" } } -> { ok, u, atualizado_em }
 *
 * Só chaves que começam com `lg2-` e valores em texto entram; o resto é descartado.
 * A tabela tem RLS: cada pessoa só lê e grava a própria linha.
 */

export const dynamic = "force-dynamic";

const LIMITE_BYTES = 500 * 1024;
const CHAVE_VALIDA = /^lg2-[A-Za-z0-9_-]{1,80}$/;
const CHAVE_DO_APARELHO = "lg2-sync";
const SEM_CACHE = { "Cache-Control": "no-store" };

function erro(mensagem: string, status: number) {
  return NextResponse.json({ error: mensagem }, { status, headers: SEM_CACHE });
}

function objetoSimples(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Mantém só as chaves `lg2-*` com valor em texto (o que o navegador guarda). */
function filtrarDados(dados: Record<string, unknown>): Record<string, string> {
  const limpo: Record<string, string> = {};
  for (const [chave, valor] of Object.entries(dados)) {
    if (chave === CHAVE_DO_APARELHO || !CHAVE_VALIDA.test(chave) || typeof valor !== "string") continue;
    limpo[chave] = valor;
  }
  return limpo;
}

export async function GET() {
  const u = await usuarioDaRequisicao();
  if (!u) return erro("Usuário não autenticado.", 401);
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("lg2_progresso")
      .select("dados, atualizado_em")
      .eq("user_id", u)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return NextResponse.json(
      { u, dados: data?.dados ?? null, atualizado_em: data?.atualizado_em ?? null },
      { headers: SEM_CACHE },
    );
  } catch {
    return erro("Não foi possível carregar o progresso.", 500);
  }
}

export async function PUT(request: Request) {
  const u = await usuarioDaRequisicao();
  if (!u) return erro("Usuário não autenticado.", 401);

  const declarado = Number(request.headers.get("content-length") ?? "0");
  if (declarado > LIMITE_BYTES) return erro("Progresso grande demais.", 413);
  let texto: string;
  try {
    texto = await request.text();
  } catch {
    return erro("Corpo inválido.", 400);
  }
  if (new TextEncoder().encode(texto).length > LIMITE_BYTES) return erro("Progresso grande demais.", 413);

  let corpo: unknown;
  try {
    corpo = JSON.parse(texto);
  } catch {
    return erro("Corpo inválido.", 400);
  }
  if (!objetoSimples(corpo) || !objetoSimples(corpo.dados)) return erro("Corpo inválido: dados precisa ser um objeto.", 400);

  const dados = filtrarDados(corpo.dados);
  const atualizado_em = new Date().toISOString();
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("lg2_progresso")
      .upsert({ user_id: u, dados, atualizado_em }, { onConflict: "user_id" })
      .select("atualizado_em")
      .single();
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true, u, atualizado_em: data?.atualizado_em ?? atualizado_em }, { headers: SEM_CACHE });
  } catch {
    return erro("Não foi possível salvar o progresso.", 500);
  }
}
