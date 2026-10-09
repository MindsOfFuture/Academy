import "server-only";
import { createClient } from "@/lib/supabase/server";
import { listarEquipe } from "./equipe";
import type {
  Afastamento,
  Alocacao,
  AlocacaoRow,
  CargaBolsista,
  ConflitoHorario,
  Encontro,
  EncontroDoDiaRow,
  EncontroRow,
  NovaEscola,
  NovaTurma,
  NovoAfastamento,
  NovoEncontro,
  RegistroHistorico,
  SituacaoAlocacao,
  StatusTurma,
  Turma,
  TurmaRow,
  VCargaRow,
} from "./types";

/**
 * Alocação de bolsistas nos encontros (spec 014).
 *
 * Encontro é `gestao.agenda`, alocação é `gestao.agenda_bolsista`. As regras
 * vivem no banco (migration `20261009_gestao_alocacao.sql`): fim obrigatório,
 * parcial dentro do encontro, nada se apaga, e a auditoria guarda antes e
 * depois. Aqui só se consulta, mapeia e agrupa.
 *
 * Nomes de pessoas vêm de `gestao.equipe()`, porque a RLS de `user_profile` não
 * deixa a coordenação ler perfis alheios. Cliente SSR autenticado; nenhum
 * caminho de service role (ADR 021).
 */

const SELECT_ENCONTRO =
  "id, data, inicio, fim, horario, modalidade, aulas, escola_id, turma_id, cancelado_em, motivo_cancelamento, concluido_em, " +
  "escola(nome), turma(nome, status), " +
  "agenda_bolsista(id, bolsista_id, situacao, inicio, fim, coberto_por, motivo, carga)";

function throwOnError(error: { message: string } | null): void {
  if (error) throw new Error(error.message);
}

/** Embed do PostgREST: objeto quando é 1:1, array quando vem frouxo. */
function primeiro<T>(valor: T | T[] | null): T | null {
  return Array.isArray(valor) ? (valor[0] ?? null) : valor;
}

/** "13:00:00" → "13:00". */
function hhmm(valor: string | null): string | null {
  return valor ? valor.slice(0, 5) : null;
}

async function nomesDaEquipe(): Promise<Map<string, string>> {
  return new Map((await listarEquipe()).map((m) => [m.userProfileId, m.nome]));
}

/** Primeiro e último dia de "AAAA-MM". */
export function limitesDoMes(mes: string): { de: string; ate: string } {
  const [ano, m] = mes.split("-").map(Number);
  const ultimo = new Date(Date.UTC(ano, m, 0)).getUTCDate();
  return { de: `${mes}-01`, ate: `${mes}-${String(ultimo).padStart(2, "0")}` };
}

function mapTurma(row: TurmaRow): Turma {
  return {
    id: row.id,
    escolaId: row.escola_id,
    escolaNome: primeiro(row.escola)?.nome ?? "Escola",
    nome: row.nome,
    modalidade: row.modalidade,
    inicio: row.inicio,
    fim: row.fim,
    status: row.status,
    motivo: row.motivo,
  };
}

function mapAlocacao(row: AlocacaoRow, nomes: Map<string, string>): Alocacao {
  return {
    id: row.id,
    bolsistaId: row.bolsista_id,
    bolsistaNome: nomes.get(row.bolsista_id) ?? "Pessoa fora da equipe",
    situacao: row.situacao,
    inicio: hhmm(row.inicio),
    fim: hhmm(row.fim),
    cobertoPor: row.coberto_por,
    cobertoPorNome: row.coberto_por ? (nomes.get(row.coberto_por) ?? "Pessoa fora da equipe") : null,
    motivo: row.motivo,
    carga: row.carga,
  };
}

export function mapEncontro(row: EncontroRow, nomes: Map<string, string>): Encontro {
  const turma = primeiro(row.turma);
  return {
    id: row.id,
    data: row.data,
    inicio: hhmm(row.inicio),
    fim: hhmm(row.fim),
    horario: row.horario,
    modalidade: row.modalidade,
    descricao: row.aulas,
    escolaId: row.escola_id,
    escolaNome: row.escola_id ? (primeiro(row.escola)?.nome ?? "Escola") : null,
    turmaId: row.turma_id,
    turmaNome: turma?.nome ?? null,
    turmaStatus: turma?.status ?? null,
    canceladoEm: row.cancelado_em,
    motivoCancelamento: row.motivo_cancelamento,
    concluidoEm: row.concluido_em,
    alocacoes: (row.agenda_bolsista ?? [])
      .map((a) => mapAlocacao(a, nomes))
      .sort((a, b) => a.bolsistaNome.localeCompare(b.bolsistaNome)),
  };
}

// ---------------------------------------------------------------------------
// Escola e turma
// ---------------------------------------------------------------------------

export async function cadastrarEscola(escola: NovaEscola): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.schema("gestao").from("escola").insert(escola);
  throwOnError(error);
}

/** Correção de cadastro; o histórico guarda o que era. */
export async function editarEscola(id: string, escola: NovaEscola): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.schema("gestao").from("escola").update(escola).eq("id", id);
  throwOnError(error);
}

export async function listarTurmas(): Promise<Turma[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .schema("gestao")
    .from("turma")
    .select("id, escola_id, nome, modalidade, inicio, fim, status, motivo, escola(nome)")
    .order("inicio", { ascending: false });
  throwOnError(error);
  return ((data ?? []) as unknown as TurmaRow[]).map(mapTurma);
}

export async function cadastrarTurma(turma: NovaTurma): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.schema("gestao").from("turma").insert({
    escola_id: turma.escolaId,
    nome: turma.nome,
    modalidade: turma.modalidade,
    inicio: turma.inicio,
    fim: turma.fim,
  });
  throwOnError(error);
}

/**
 * Edita nome, atividade e período. A escola não muda: os encontros já lançados
 * guardam a escola da turma, e trocá-la aqui deixaria os dois desencontrados.
 */
export async function editarTurma(id: string, turma: Omit<NovaTurma, "escolaId">): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .schema("gestao")
    .from("turma")
    .update({ nome: turma.nome, modalidade: turma.modalidade, inicio: turma.inicio, fim: turma.fim })
    .eq("id", id);
  throwOnError(error);
}

export async function definirSituacaoTurma(id: string, status: StatusTurma, motivo: string | null): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.schema("gestao").from("turma").update({ status, motivo }).eq("id", id);
  throwOnError(error);
}

/**
 * Equipe do último encontro de cada turma, para preencher o próximo (decisão 2
 * da spec 014). Quem foi substituído ou retirado não volta sozinho.
 */
export async function equipesRecentes(): Promise<Record<string, string[]>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .schema("gestao")
    .from("agenda")
    .select("turma_id, data, agenda_bolsista(bolsista_id, situacao)")
    .not("turma_id", "is", null)
    .is("cancelado_em", null)
    .order("data", { ascending: false })
    // ponytail: olha os 300 encontros mais recentes; turma parada há mais tempo vem sem equipe.
    .limit(300);
  throwOnError(error);

  const equipes: Record<string, string[]> = {};
  for (const row of (data ?? []) as { turma_id: string; agenda_bolsista: { bolsista_id: string; situacao: SituacaoAlocacao }[] }[]) {
    if (equipes[row.turma_id]) continue;
    equipes[row.turma_id] = (row.agenda_bolsista ?? [])
      .filter((a) => a.situacao !== "substituida" && a.situacao !== "retirada")
      .map((a) => a.bolsista_id);
  }
  return equipes;
}

// ---------------------------------------------------------------------------
// Encontro e alocação
// ---------------------------------------------------------------------------

export async function listarEncontrosDoMes(mes: string): Promise<Encontro[]> {
  const supabase = await createClient();
  const { de, ate } = limitesDoMes(mes);
  const [{ data, error }, nomes] = await Promise.all([
    supabase
      .schema("gestao")
      .from("agenda")
      .select(SELECT_ENCONTRO)
      .gte("data", de)
      .lte("data", ate)
      .order("data")
      .order("inicio"),
    nomesDaEquipe(),
  ]);
  throwOnError(error);
  return ((data ?? []) as unknown as EncontroRow[]).map((row) => mapEncontro(row, nomes));
}

export async function obterEncontro(id: string): Promise<Encontro | null> {
  const supabase = await createClient();
  const [{ data, error }, nomes] = await Promise.all([
    supabase.schema("gestao").from("agenda").select(SELECT_ENCONTRO).eq("id", id).maybeSingle(),
    nomesDaEquipe(),
  ]);
  throwOnError(error);
  return data ? mapEncontro(data as unknown as EncontroRow, nomes) : null;
}

/** Cria o encontro e a equipe. Devolve o id do encontro. */
export async function criarEncontro(novo: NovoEncontro): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .schema("gestao")
    .from("agenda")
    .insert({
      data: novo.data,
      inicio: novo.inicio,
      fim: novo.fim,
      modalidade: novo.modalidade,
      aulas: novo.descricao || novo.modalidade,
      escola_id: novo.escolaId,
      turma_id: novo.turmaId,
    })
    .select("id")
    .single();
  throwOnError(error);
  const id = (data as { id: string }).id;
  if (novo.equipe.length > 0) await alocar(id, novo.equipe);
  return id;
}

/**
 * Quem das pessoas escolhidas já está em outro encontro que se sobrepõe a
 * [inicio, fim). Encostar não é sobrepor: sair às 12h e entrar às 12h passa.
 * Vale o horário parcial de quem chega depois ou sai antes. Não conta quem foi
 * substituído ou retirado, nem encontro de turma que não abriu.
 */
export function acharSobreposicoes(
  novo: { inicio: string; fim: string },
  encontros: EncontroDoDiaRow[],
  nomes: Map<string, string>,
): ConflitoHorario[] {
  const conflitos: ConflitoHorario[] = [];
  for (const e of encontros) {
    const turma = primeiro(e.turma);
    if (!e.inicio || !e.fim || turma?.status === "nao_abriu") continue;
    for (const a of e.agenda_bolsista ?? []) {
      if (a.situacao === "substituida" || a.situacao === "retirada") continue;
      const inicio = hhmm(a.inicio ?? e.inicio)!;
      const fim = hhmm(a.fim ?? e.fim)!;
      if (inicio < novo.fim && novo.inicio < fim) {
        conflitos.push({
          bolsistaId: a.bolsista_id,
          bolsistaNome: nomes.get(a.bolsista_id) ?? "Pessoa fora da equipe",
          encontroId: e.id,
          horario: e.horario,
          modalidade: e.modalidade,
          turmaNome: turma?.nome ?? null,
        });
      }
    }
  }
  return conflitos.sort((x, y) => x.bolsistaNome.localeCompare(y.bolsistaNome));
}

export async function conflitosDeHorario(
  data: string,
  inicio: string,
  fim: string,
  bolsistas: string[],
): Promise<ConflitoHorario[]> {
  if (bolsistas.length === 0) return [];
  const supabase = await createClient();
  const [{ data: linhas, error }, nomes] = await Promise.all([
    supabase
      .schema("gestao")
      .from("agenda")
      .select("id, inicio, fim, horario, modalidade, turma(nome, status), agenda_bolsista!inner(bolsista_id, situacao, inicio, fim)")
      .eq("data", data)
      .is("cancelado_em", null)
      .in("agenda_bolsista.bolsista_id", bolsistas),
    nomesDaEquipe(),
  ]);
  throwOnError(error);
  return acharSobreposicoes({ inicio, fim }, (linhas ?? []) as unknown as EncontroDoDiaRow[], nomes);
}

export async function alocar(encontroId: string, bolsistas: string[]): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .schema("gestao")
    .from("agenda_bolsista")
    .insert(bolsistas.map((bolsista_id) => ({ agenda_id: encontroId, bolsista_id })));
  throwOnError(error);
}

export async function cancelarEncontro(id: string, motivo: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .schema("gestao")
    .from("agenda")
    // O banco troca pelo próprio relógio; aqui só sinaliza o cancelamento.
    .update({ cancelado_em: new Date().toISOString(), motivo_cancelamento: motivo })
    .eq("id", id);
  throwOnError(error);
}

/**
 * Concluir confirma que o encontro aconteceu; o banco carimba a hora e passa
 * quem estava "prevista" para "cumprida". Reabrir tira o carimbo.
 */
export async function concluirEncontro(id: string, concluir: boolean): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .schema("gestao")
    .from("agenda")
    .update({ concluido_em: concluir ? new Date().toISOString() : null })
    .eq("id", id);
  throwOnError(error);
}

/**
 * Situação, intervalo parcial e quem cobriu. Voltar a "prevista" ou "cumprida"
 * limpa o motivo; o histórico guarda o que era.
 */
export async function atualizarAlocacao(
  id: string,
  mudanca: {
    situacao: SituacaoAlocacao;
    inicio: string | null;
    fim: string | null;
    cobertoPor: string | null;
    motivo: string | null;
  },
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .schema("gestao")
    .from("agenda_bolsista")
    .update({
      situacao: mudanca.situacao,
      inicio: mudanca.inicio,
      fim: mudanca.fim,
      coberto_por: mudanca.cobertoPor,
      motivo: mudanca.motivo,
    })
    .eq("id", id);
  throwOnError(error);
}

/**
 * Tira a pessoa do encontro (decisão 9 da spec 014). A auditoria guarda a linha
 * inteira; se ela tinha entrado como substituta, o banco desfaz a substituição.
 */
export async function removerAlocacao(id: string): Promise<void> {
  const supabase = await createClient();
  const { data, error } = await supabase.schema("gestao").from("agenda_bolsista").delete().eq("id", id).select("id");
  throwOnError(error);
  // A RLS não dá erro quando esconde a linha: apaga zero e segue.
  if (!data?.length) throw new Error("gestao: esta pessoa não está mais no encontro");
}

export async function substituirAlocacao(id: string, substitutoId: string, motivo: string | null): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .schema("gestao")
    .rpc("substituir_alocacao", { p_alocacao: id, p_substituto: substitutoId, p_motivo: motivo });
  throwOnError(error);
}

// ---------------------------------------------------------------------------
// Afastamento
// ---------------------------------------------------------------------------

export async function registrarAfastamento(afastamento: NovoAfastamento): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.schema("gestao").from("afastamento").insert({
    bolsista_id: afastamento.bolsistaId,
    inicio: afastamento.inicio,
    fim: afastamento.fim,
    motivo: afastamento.motivo,
  });
  throwOnError(error);
}

/** Afastamentos que tocam o mês, com os encontros que ainda faltam substituir. */
export async function listarAfastamentos(mes: string): Promise<Afastamento[]> {
  const supabase = await createClient();
  const { de, ate } = limitesDoMes(mes);
  const [{ data, error }, nomes] = await Promise.all([
    supabase
      .schema("gestao")
      .from("afastamento")
      .select("id, bolsista_id, inicio, fim, motivo")
      .lte("inicio", ate)
      .gte("fim", de)
      .order("inicio"),
    nomesDaEquipe(),
  ]);
  throwOnError(error);
  const afastamentos = (data ?? []) as { id: string; bolsista_id: string; inicio: string; fim: string; motivo: string }[];

  return Promise.all(
    afastamentos.map(async (a) => {
      const { data: alocs, error: erro } = await supabase
        .schema("gestao")
        .from("agenda_bolsista")
        .select("id, agenda!inner(id, data, horario, modalidade, cancelado_em)")
        .eq("bolsista_id", a.bolsista_id)
        .eq("situacao", "prevista")
        .gte("agenda.data", a.inicio)
        .lte("agenda.data", a.fim)
        .is("agenda.cancelado_em", null);
      throwOnError(erro);
      type Linha = { id: string; agenda: { id: string; data: string; horario: string; modalidade: string } | { id: string; data: string; horario: string; modalidade: string }[] };
      return {
        id: a.id,
        bolsistaId: a.bolsista_id,
        bolsistaNome: nomes.get(a.bolsista_id) ?? "Pessoa fora da equipe",
        inicio: a.inicio,
        fim: a.fim,
        motivo: a.motivo,
        encontrosAfetados: ((alocs ?? []) as Linha[])
          .map((l) => ({ alocacaoId: l.id, ag: primeiro(l.agenda) }))
          .filter((l) => l.ag !== null)
          .map((l) => ({
            alocacaoId: l.alocacaoId,
            encontroId: l.ag!.id,
            data: l.ag!.data,
            horario: l.ag!.horario,
            modalidade: l.ag!.modalidade,
          }))
          .sort((x, y) => x.data.localeCompare(y.data)),
      };
    }),
  );
}

// ---------------------------------------------------------------------------
// Carga do mês
// ---------------------------------------------------------------------------

/**
 * Soma as horas por bolsista, com a divisão por escola e por turma.
 *
 * A lista parte dos bolsistas, não das alocações: todo bolsista ativo aparece,
 * mesmo com 0 h, e quem é só coordenação nunca aparece, nem se tiver sido
 * alocado. Bolsista desligado só aparece se teve horas no mês (a prestação de
 * contas precisa delas).
 */
export function agruparCarga(
  linhas: VCargaRow[],
  bolsistas: { id: string; nome: string; ativo: boolean }[],
  escolas: Map<string, string>,
  turmas: Map<string, string>,
): CargaBolsista[] {
  const porPessoa = new Map<string, { total: number; escola: Map<string | null, number>; turma: Map<string | null, number> }>();
  for (const l of linhas) {
    const horas = Number(l.horas);
    const acc = porPessoa.get(l.bolsista_id) ?? { total: 0, escola: new Map(), turma: new Map() };
    acc.total += horas;
    acc.escola.set(l.escola_id, (acc.escola.get(l.escola_id) ?? 0) + horas);
    acc.turma.set(l.turma_id, (acc.turma.get(l.turma_id) ?? 0) + horas);
    porPessoa.set(l.bolsista_id, acc);
  }
  return bolsistas
    .map((b) => {
      const acc = porPessoa.get(b.id) ?? { total: 0, escola: new Map(), turma: new Map() };
      return { b, acc };
    })
    .filter(({ b, acc }) => b.ativo || acc.total > 0)
    .map(({ b, acc }) => ({
      bolsistaId: b.id,
      nome: b.nome,
      total: acc.total,
      porEscola: [...acc.escola.entries()]
        .filter(([, h]) => h > 0)
        .map(([escolaId, h]) => ({
          escolaId,
          nome: escolaId ? (escolas.get(escolaId) ?? "Escola") : "Fora de escola",
          horas: h,
        })),
      porTurma: [...acc.turma.entries()]
        .filter(([, h]) => h > 0)
        .map(([turmaId, h]) => ({
          turmaId,
          nome: turmaId ? (turmas.get(turmaId) ?? "Turma") : "Fora de turma",
          horas: h,
        })),
    }))
    .sort((a, b) => b.total - a.total || a.nome.localeCompare(b.nome));
}

export async function cargaDoMes(mes: string): Promise<CargaBolsista[]> {
  const supabase = await createClient();
  const { de, ate } = limitesDoMes(mes);
  const [{ data, error }, escolas, turmas, equipe] = await Promise.all([
    supabase
      .schema("gestao")
      .from("v_carga")
      .select("bolsista_id, data, escola_id, turma_id, horas")
      .gte("data", de)
      .lte("data", ate),
    supabase.schema("gestao").from("escola").select("id, nome"),
    supabase.schema("gestao").from("turma").select("id, nome"),
    listarEquipe(),
  ]);
  for (const res of [{ error }, escolas, turmas]) throwOnError(res.error);
  const mapa = (linhas: unknown) => new Map(((linhas ?? []) as { id: string; nome: string }[]).map((l) => [l.id, l.nome]));
  const bolsistas = equipe
    .filter((m) => m.bolsista)
    .map((m) => ({ id: m.userProfileId, nome: m.nome, ativo: !m.desligadoEm }));
  return agruparCarga((data ?? []) as VCargaRow[], bolsistas, mapa(escolas.data), mapa(turmas.data));
}

// ---------------------------------------------------------------------------
// Histórico
// ---------------------------------------------------------------------------

/** Campos que não dizem nada a quem lê o histórico. */
const CAMPOS_TECNICOS = new Set(["id", "agenda_id", "criado_em", "atualizado_em", "criado_por"]);

/**
 * Compara antes e depois e devolve só o que mudou. Id de pessoa vira nome, para
 * a coordenação ler "Bia → Caio" e não dois uuids.
 */
export function diferencas(
  antes: Record<string, unknown> | null,
  depois: Record<string, unknown> | null,
  nomes: Map<string, string>,
): { campo: string; antes: unknown; depois: unknown }[] {
  const legivel = (v: unknown) => (typeof v === "string" && nomes.has(v) ? nomes.get(v) : (v ?? null));
  const campos = new Set([...Object.keys(antes ?? {}), ...Object.keys(depois ?? {})]);
  const mudancas: { campo: string; antes: unknown; depois: unknown }[] = [];
  for (const campo of campos) {
    if (CAMPOS_TECNICOS.has(campo)) continue;
    const a = antes?.[campo] ?? null;
    const d = depois?.[campo] ?? null;
    if (JSON.stringify(a) === JSON.stringify(d)) continue;
    mudancas.push({ campo, antes: legivel(a), depois: legivel(d) });
  }
  return mudancas;
}

/** Tudo o que aconteceu com o encontro e com cada alocação dele, mais recente primeiro. */
export async function historicoDoEncontro(encontro: Encontro): Promise<RegistroHistorico[]> {
  const supabase = await createClient();
  const id = encontro.id;
  const [{ data, error }, nomes] = await Promise.all([
    supabase
      .schema("gestao")
      .from("registro_auditoria")
      .select("tabela, acao, autor, ocorrido_em, antes, depois")
      // Alocação pelo encontro gravado na própria linha, e não pelos ids de
      // hoje: quem foi removido (decisão 9) continua no histórico.
      .or(
        `and(tabela.eq.agenda,registro_id.eq.${id}),` +
          `and(tabela.eq.agenda_bolsista,depois->>agenda_id.eq.${id}),` +
          `and(tabela.eq.agenda_bolsista,antes->>agenda_id.eq.${id})`,
      )
      .order("ocorrido_em", { ascending: false }),
    nomesDaEquipe(),
  ]);
  throwOnError(error);
  type Linha = {
    tabela: string;
    acao: RegistroHistorico["acao"];
    autor: string;
    ocorrido_em: string;
    antes: Record<string, unknown> | null;
    depois: Record<string, unknown> | null;
  };
  return ((data ?? []) as Linha[]).map((l) => ({
    tabela: l.tabela,
    acao: l.acao,
    autorNome: nomes.get(l.autor) ?? "Pessoa fora da equipe",
    ocorridoEm: l.ocorrido_em,
    mudancas: diferencas(l.antes, l.depois, nomes),
  }));
}
