"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cpfValido, normalizarCpf } from "@/lib/cpf";
import { entrarNoTeste } from "@/lib/api/teste-participante";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export type EstadoEntrada = { erro?: string };

export async function entrar(_estado: EstadoEntrada, formData: FormData): Promise<EstadoEntrada> {
  const cabecalhos = await headers();
  if (!rateLimit(`teste:${clientIp(new Request("http://local", { headers: cabecalhos }))}`, 10, 10 * 60 * 1000)) {
    return { erro: "Muitas tentativas. Aguarde alguns minutos e tente novamente." };
  }
  const nome = String(formData.get("nome") ?? "").trim().replace(/\s+/g, " ");
  const cpf = normalizarCpf(String(formData.get("cpf") ?? ""));
  if (nome.length < 3 || nome.length > 120) return { erro: "Informe o nome completo." };
  if (!cpfValido(cpf)) return { erro: "Informe um CPF válido." };

  try {
    await entrarNoTeste(nome, cpf);
  } catch (error) {
    return { erro: error instanceof Error ? error.message : "Não foi possível entrar no teste." };
  }
  redirect("/lg2/jornada/index.html");
}
