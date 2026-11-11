import "server-only";
import { createClient } from "@/lib/supabase/server";

export interface TesteResumo {
  userId: string; nome: string; cpf: string; acessos: number; ultimoAcessoEm: string;
  modulosAbertos: number; modulosConcluidos: number; jornadaConcluida: boolean;
}

interface Linha { user_id: string; nome: string; cpf: string; acessos: number; ultimo_acesso_em: string; modulos_abertos: number; modulos_concluidos: number; jornada_concluida: boolean }

export async function resumoTestes(): Promise<TesteResumo[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("gestao_testes_resumo");
  if (error) throw new Error(error.message);
  return ((data ?? []) as Linha[]).map((r) => ({ userId: r.user_id, nome: r.nome, cpf: r.cpf, acessos: r.acessos, ultimoAcessoEm: r.ultimo_acesso_em, modulosAbertos: r.modulos_abertos, modulosConcluidos: r.modulos_concluidos, jornadaConcluida: r.jornada_concluida }));
}

function campoCsv(valor: string | number): string {
  return `"${String(valor).replaceAll('"', '""')}"`;
}

export function csvTestes(linhas: TesteResumo[]): string {
  const cabecalho = ["Nome", "CPF", "Acessos", "Último acesso", "Módulos abertos", "Módulos concluídos", "Jornada concluída"];
  const conteudo = linhas.map((r) => [r.nome, r.cpf, r.acessos, r.ultimoAcessoEm, r.modulosAbertos, `${r.modulosConcluidos} de 10`, r.jornadaConcluida ? "sim" : "não"]);
  return `\uFEFF${[cabecalho, ...conteudo].map((linha) => linha.map(campoCsv).join(";")).join("\r\n")}`;
}
