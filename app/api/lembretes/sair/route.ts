import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { redirectToInternalPath } from "@/lib/supabase/redirect";

/**
 * "Não quero mais receber estes lembretes" do Empreenda+ (spec 027).
 *
 * POST ?t=<token>  -> para os lembretes da pessoa dona do token.
 *   - vindo da página /lembretes/sair (campo `origem=pagina`): 303 de volta à página;
 *   - vindo do botão do próprio leitor de e-mail (List-Unsubscribe-Post): 200.
 * GET  ?t=<token>  -> 303 para a página, que pede a confirmação. GET não muda
 *   nada: leitores de e-mail e antivírus abrem links sozinhos.
 *
 * Sem login: o token aleatório do e-mail é a credencial, e a função do banco só
 * marca a saída de quem tem aquele token.
 */

export const dynamic = "force-dynamic";

const TOKEN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SEM_CACHE = { "Cache-Control": "no-store" };

// Origem pública confiável (atrás do nginx, request.url é localhost:3000) e 303,
// para o navegador abrir a página com GET depois do POST do formulário.
function paraPagina(request: Request, busca: Record<string, string>) {
  const query = new URLSearchParams(busca).toString();
  const destino = redirectToInternalPath(`/lembretes/sair${query ? `?${query}` : ""}`, request);
  return NextResponse.redirect(destino.headers.get("location")!, { status: 303, headers: SEM_CACHE });
}

export async function GET(request: Request) {
  const t = new URL(request.url).searchParams.get("t") ?? "";
  return paraPagina(request, TOKEN.test(t) ? { t } : {});
}

export async function POST(request: Request) {
  const t = new URL(request.url).searchParams.get("t") ?? "";
  let daPagina = false;
  try {
    const corpo = await request.formData();
    daPagina = corpo.get("origem") === "pagina";
  } catch {
    // Corpo vazio ou em outro formato: trata como o botão do leitor de e-mail.
  }

  let ok = false;
  if (TOKEN.test(t)) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase.rpc("lg2_lembrete_sair", { p_token: t });
      ok = !error && data === true;
      if (error) console.error("[lembretes/sair] falha ao registrar a saída:", error.message);
    } catch (e) {
      console.error("[lembretes/sair] falha ao registrar a saída:", e);
    }
  }

  if (daPagina) return paraPagina(request, ok ? { ok: "1" } : { erro: "1" });
  return new NextResponse(ok ? "ok" : "link inválido", { status: ok ? 200 : 400, headers: SEM_CACHE });
}
