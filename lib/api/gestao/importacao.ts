import "server-only";
import { createClient } from "@/lib/supabase/server";
import { montarPrevia, validarEventos, type EventoPlanilha, type PreviaImportacao } from "./planilha";
import type { Importacao, ResumoImportacao } from "./types";

/**
 * Importação da planilha de calendário (lote reversível). A leitura do arquivo é
 * pura (`planilha.ts`); aqui se lê o que já existe para a prévia e se chamam as
 * funções do banco (`20261113_gestao_importar_planilha.sql`), que fazem tudo numa
 * transação. Cliente SSR autenticado; nenhum caminho de service role (ADR 021).
 */

function throwOnError(error: { message: string } | null): void {
  if (error) throw new Error(error.message);
}

/** Casa os eventos com as escolas cadastradas e marca o que já está na agenda. */
export async function previaDaImportacao(eventos: EventoPlanilha[]): Promise<PreviaImportacao> {
  if (eventos.length === 0) return montarPrevia([], [], []);
  const datas = eventos.map((e) => e.data).sort();
  const supabase = await createClient();
  // shortcut: sem paginação, vale até o teto de linhas do PostgREST (1000); paginar se passar disso
  const [escolas, agenda] = await Promise.all([
    supabase.schema("gestao").from("escola").select("id, nome"),
    supabase
      .schema("gestao")
      .from("agenda")
      .select("data, escola_id, inicio, fim")
      .gte("data", datas[0])
      .lte("data", datas[datas.length - 1]),
  ]);
  throwOnError(escolas.error);
  throwOnError(agenda.error);
  return montarPrevia(
    eventos,
    (escolas.data ?? []) as { id: string; nome: string }[],
    (agenda.data ?? []) as { data: string; escola_id: string | null; inicio: string | null; fim: string | null }[],
  );
}

/** Mensagens no formato do banco (`gestao: …`), que `mensagemDeErro` mostra como estão. */
function recusar(mensagem: string): never {
  throw new Error(`gestao: ${mensagem.charAt(0).toLowerCase()}${mensagem.slice(1).replace(/\.$/, "")}`);
}

/**
 * Grava os eventos (vindos do navegador: validados de novo aqui) num lote só.
 * A prévia é refeita no servidor; `ajustes` troca categoria e cidade das escolas
 * novas, pela chave da prévia.
 */
export async function importarPlanilha(
  arquivo: string,
  eventos: unknown,
  ajustes: Record<string, { categoria: string; cidade: string }> = {},
): Promise<ResumoImportacao & { id: string }> {
  const validos = validarEventos(eventos);
  if (!validos.ok) recusar(validos.mensagem);
  const previa = await previaDaImportacao(validos.valor);

  const escolas = previa.escolasNovas.map((escola) => {
    const ajuste = Object.hasOwn(ajustes, escola.chave) ? ajustes[escola.chave] : null;
    const categoria = (ajuste ? String(ajuste.categoria ?? "") : escola.categoria).trim();
    const cidade = (ajuste ? String(ajuste.cidade ?? "") : escola.cidade).trim();
    if (!categoria || categoria.length > 40) recusar(`Informe se a escola ${escola.nome} é estadual, municipal ou outra.`);
    if (cidade.length < 2 || cidade.length > 120) recusar(`Informe a cidade da escola ${escola.nome}.`);
    return { nome: escola.nome, categoria, cidade };
  });

  const encontros = previa.encontros
    .filter((e) => !e.duplicado)
    .map((e) => ({
      data: e.data,
      inicio: e.inicio,
      fim: e.fim,
      modalidade: e.modalidade,
      aulas: e.descricao || e.modalidade,
      escola_id: e.escolaId,
      escola_nova: e.escolaNova,
      numero_aula: e.numeroAula,
    }));
  if (encontros.length === 0) recusar("nada novo para importar");

  const supabase = await createClient();
  const { data, error } = await supabase.schema("gestao").rpc("importar_planilha", {
    p_arquivo: arquivo.trim().slice(0, 200) || "planilha.xlsx",
    p_escolas: escolas,
    p_encontros: encontros,
  });
  throwOnError(error);
  const resumo = data as Record<string, unknown>;
  return { id: String(resumo.id), ...mapResumo(resumo) };
}

function numeroOuNulo(valor: unknown): number | null {
  return typeof valor === "number" ? valor : null;
}

export function mapResumo(resumo: Record<string, unknown> | null): ResumoImportacao {
  const r = resumo ?? {};
  return {
    encontros: numeroOuNulo(r.encontros) ?? 0,
    pulados: numeroOuNulo(r.pulados) ?? 0,
    escolas: numeroOuNulo(r.escolas) ?? 0,
    concluidos: numeroOuNulo(r.concluidos) ?? 0,
    apagados: numeroOuNulo(r.apagados),
    escolasApagadas: numeroOuNulo(r.escolas_apagadas),
    escolasMantidas: numeroOuNulo(r.escolas_mantidas),
  };
}

/** Últimas importações, a mais recente primeiro. */
export async function listarImportacoes(): Promise<Importacao[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .schema("gestao")
    .from("importacao")
    .select("id, arquivo, criado_em, desfeita_em, resumo")
    .order("criado_em", { ascending: false })
    .limit(50);
  throwOnError(error);
  return (
    (data ?? []) as { id: string; arquivo: string; criado_em: string; desfeita_em: string | null; resumo: Record<string, unknown> }[]
  ).map((row) => ({
    id: row.id,
    arquivo: row.arquivo,
    criadoEm: row.criado_em,
    desfeitaEm: row.desfeita_em,
    resumo: mapResumo(row.resumo),
  }));
}

/** Apaga os encontros e as escolas sem uso do lote; o banco recusa se algo já foi mexido. */
export async function desfazerImportacao(id: string): Promise<ResumoImportacao> {
  const supabase = await createClient();
  const { data, error } = await supabase.schema("gestao").rpc("desfazer_importacao", { p_id: id });
  throwOnError(error);
  return mapResumo(data as Record<string, unknown>);
}
