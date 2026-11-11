import "server-only";
import { createHmac } from "node:crypto";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";

function credenciais(cpf: string) {
  const segredo = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const hash = (finalidade: string) => createHmac("sha256", segredo).update(`${finalidade}:${cpf}`).digest("hex");
  return {
    email: `teste+${hash("email").slice(0, 20)}@teste.mindsofthefuture.com.br`,
    password: `Tf!${hash("senha")}`,
  };
}

export async function entrarNoTeste(nome: string, cpf: string): Promise<void> {
  const admin = await createServiceRoleClient();
  const login = credenciais(cpf);
  const supabase = await createClient();
  let sessao = await supabase.auth.signInWithPassword(login);
  if (sessao.error) {
    const criado = await admin.auth.admin.createUser({ email: login.email, password: login.password, email_confirm: true });
    if (criado.error) throw new Error("Não foi possível entrar no teste.");
    sessao = await supabase.auth.signInWithPassword(login);
  }
  const userId = sessao.data.user?.id;
  if (sessao.error || !userId) throw new Error("Não foi possível entrar no teste.");

  const { error: registroError } = await admin.rpc("registrar_teste_participante", {
    p_user_id: userId,
    p_nome: nome,
    p_cpf: cpf,
  });
  if (registroError) throw new Error("Não foi possível registrar a participação.");

}
