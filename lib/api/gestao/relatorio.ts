import "server-only";
import { createClient, usuarioDaRequisicao } from "@/lib/supabase/server";
import { limitesDoMes, nomesDaEquipe } from "./alocacao";
import type { AtividadeRelatorio, EncontroDoRelatorio, NovaAtividade, SituacaoAlocacao, TipoEncontro } from "./types";
import type { FotoDoRelatorio } from "./relatorio-docx";

/**
 * Relatório do mês de uma pessoa: os encontros em que esteve e as atividades
 * que cadastrou. Sem `pessoaId`, é quem está logado. A RLS recorta o que cada um
 * lê (o bolsista, só o seu; a coordenação, a equipe); o filtro pela pessoa aqui
 * é o que separa um relatório do outro.
 */

/** Esteve no encontro: alocação prevista/cumprida ou cobrindo alguém. */
const ESTEVE = new Set(["prevista", "cumprida", "cobertura"]);

export interface CargaDoRelatorio {
  agenda_id: string;
  situacao: SituacaoAlocacao | "cobertura";
  horas: number | string;
}

export interface AgendaDoRelatorio {
  id: string;
  data: string;
  horario: string;
  inicio: string | null;
  modalidade: string;
  aulas: string | null;
  cancelado_em: string | null;
  tipo: TipoEncontro;
  escola: { nome: string } | { nome: string }[] | null;
  turma: { nome: string } | { nome: string }[] | null;
  espaco: { nome: string } | { nome: string }[] | null;
  agenda_bolsista: {
    bolsista_id: string;
    situacao: SituacaoAlocacao;
    link_comprovacao: string | null;
    foto_comprovacao?: string | null;
  }[];
}

function primeiro<T>(valor: T | T[] | null): T | null {
  return Array.isArray(valor) ? (valor[0] ?? null) : valor;
}

const PRESENTE = (b: { situacao: SituacaoAlocacao }) => b.situacao === "prevista" || b.situacao === "cumprida";

/**
 * Junta as linhas de `v_carga` aos encontros, sem cancelados nem faltas. Em ordem
 * de data. `pessoa` escolhe de quem é o `meuLink`.
 */
export function montarEncontros(
  cargas: CargaDoRelatorio[],
  agendas: AgendaDoRelatorio[],
  pessoa?: string,
): EncontroDoRelatorio[] {
  const porId = new Map(agendas.map((a) => [a.id, a]));
  const minha = (a: AgendaDoRelatorio) =>
    (a.agenda_bolsista ?? []).find((b) => pessoa && b.bolsista_id === pessoa && PRESENTE(b));
  return cargas
    .filter((c) => ESTEVE.has(c.situacao))
    .flatMap((c) => {
      const a = porId.get(c.agenda_id);
      if (!a || a.cancelado_em) return [];
      return [
        {
          encontroId: a.id,
          data: a.data,
          horario: a.horario,
          descricao: a.aulas || a.modalidade,
          escolaNome: primeiro(a.escola)?.nome ?? null,
          turmaNome: primeiro(a.turma)?.nome ?? null,
          tipo: a.tipo ?? "aula",
          espacoNome: primeiro(a.espaco ?? null)?.nome ?? null,
          situacao: c.situacao,
          horas: Number(c.horas),
          links: [
            ...new Set(
              (a.agenda_bolsista ?? [])
                .filter((b) => b.link_comprovacao && PRESENTE(b))
                .map((b) => b.link_comprovacao as string),
            ),
          ].sort(),
          fotos: [
            ...new Set(
              (a.agenda_bolsista ?? [])
                .filter((b) => b.foto_comprovacao && PRESENTE(b))
                .map((b) => b.foto_comprovacao as string),
            ),
          ].sort(),
          inicio: a.inicio,
          meuLink: minha(a)?.link_comprovacao ?? null,
          minhaFoto: minha(a)?.foto_comprovacao ?? null,
        },
      ];
    })
    .sort((x, y) => x.data.localeCompare(y.data) || x.horario.localeCompare(y.horario));
}

async function usuarioAtual(): Promise<string> {
  const eu = await usuarioDaRequisicao();
  if (!eu) throw new Error("gestao: usuário não autenticado");
  return eu;
}

export async function encontrosDoMes(mes: string, pessoaId?: string): Promise<EncontroDoRelatorio[]> {
  const supabase = await createClient();
  const pessoa = pessoaId ?? (await usuarioAtual());
  const { de, ate } = limitesDoMes(mes);
  const { data: cargas, error } = await supabase
    .schema("gestao")
    .from("v_carga")
    .select("agenda_id, situacao, horas")
    .eq("bolsista_id", pessoa)
    .gte("data", de)
    .lte("data", ate);
  if (error) throw new Error(error.message);
  const ids = [...new Set(((cargas ?? []) as CargaDoRelatorio[]).map((c) => c.agenda_id))];
  if (ids.length === 0) return [];
  const { data: agendas, error: erro } = await supabase
    .schema("gestao")
    .from("agenda")
    .select(
      "id, data, horario, inicio, modalidade, aulas, cancelado_em, tipo, escola(nome), turma(nome), espaco(nome), agenda_bolsista(bolsista_id, situacao, link_comprovacao, foto_comprovacao)",
    )
    .in("id", ids);
  if (erro) throw new Error(erro.message);
  return montarEncontros((cargas ?? []) as CargaDoRelatorio[], (agendas ?? []) as unknown as AgendaDoRelatorio[], pessoa);
}

export async function atividadesDoMes(mes: string, pessoaId?: string): Promise<AtividadeRelatorio[]> {
  const supabase = await createClient();
  const pessoa = pessoaId ?? (await usuarioAtual());
  // Entra no filtro do PostgREST como texto: só id de verdade.
  if (!/^[0-9a-f-]{36}$/i.test(pessoa)) throw new Error("gestao: pessoa inválida");
  const { de, ate } = limitesDoMes(mes);
  const { data, error } = await supabase
    .schema("gestao")
    .from("atividade_relatorio")
    .select("id, user_profile_id, nome, data, inicio, fim, comprovacao, foto_comprovacao, participantes")
    // As que a pessoa cadastrou e as em que outro a pôs como participante.
    .or(`user_profile_id.eq.${pessoa},participantes.cs.{${pessoa}}`)
    .gte("data", de)
    .lte("data", ate)
    .order("data")
    .order("inicio", { nullsFirst: true })
    .order("criado_em");
  if (error) throw new Error(error.message);
  return (data ?? []) as AtividadeRelatorio[];
}

/** Link e foto de quem está logado no encontro; quem pode o banco decide. Null apaga. */
export async function escreverLinkComprovacao(encontroId: string, link: string | null, foto: string | null): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .schema("gestao")
    .rpc("escrever_link_comprovacao", { p_agenda: encontroId, p_link: link, p_foto: foto });
  if (error) throw new Error(error.message);
}

/** Colegas ativos da equipe (sem quem está logado), para escolher participantes. */
export async function colegasDaEquipe(): Promise<{ id: string; nome: string }[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.schema("gestao").rpc("colegas");
  if (error) throw new Error(error.message);
  return ((data ?? []) as { user_profile_id: string; nome: string }[]).map((c) => ({ id: c.user_profile_id, nome: c.nome }));
}

export const BUCKET_FOTOS = "gestao-comprovacao";

/** O que o registro do mês mostra além das linhas: URLs das fotos e nomes de quem participou. */
export async function extrasDoRegistro(
  encontros: EncontroDoRelatorio[],
  atividades: AtividadeRelatorio[],
): Promise<{ urls: Record<string, string>; nomes: Record<string, string> }> {
  const [urls, nomes] = await Promise.all([
    urlsDasFotos([...encontros.flatMap((e) => e.fotos), ...atividades.flatMap((a) => (a.foto_comprovacao ? [a.foto_comprovacao] : []))]),
    atividades.some((a) => a.participantes.length) ? nomesDaEquipe() : new Map<string, string>(),
  ]);
  return { urls, nomes: Object.fromEntries(nomes) };
}

/** URL assinada (1h) de cada foto, para a tela; foto que falhar fica de fora. */
export async function urlsDasFotos(caminhos: string[]): Promise<Record<string, string>> {
  const unicos = [...new Set(caminhos)];
  if (unicos.length === 0) return {};
  const supabase = await createClient();
  const { data, error } = await supabase.storage.from(BUCKET_FOTOS).createSignedUrls(unicos, 3600);
  if (error) throw new Error(error.message);
  return Object.fromEntries((data ?? []).filter((d) => d.signedUrl && d.path).map((d) => [d.path as string, d.signedUrl]));
}

/**
 * Fotos prontas para o .docx: reduzidas a no máximo 1200 px e em JPEG, para o
 * arquivo não inchar com fotos de 20 MB. Foto que não baixa fica de fora.
 */
export async function fotosParaRelatorio(caminhos: string[]): Promise<Map<string, FotoDoRelatorio>> {
  const unicos = [...new Set(caminhos)];
  const fotos = new Map<string, FotoDoRelatorio>();
  if (unicos.length === 0) return fotos;
  const supabase = await createClient();
  const { default: sharp } = await import("sharp");
  await Promise.all(
    unicos.map(async (caminho) => {
      const { data, error } = await supabase.storage.from(BUCKET_FOTOS).download(caminho);
      if (error || !data) return;
      try {
        const { data: bytes, info } = await sharp(Buffer.from(await data.arrayBuffer()))
          .rotate() // respeita a orientação da câmera
          .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
          .jpeg({ quality: 80 })
          .toBuffer({ resolveWithObject: true });
        fotos.set(caminho, { bytes: new Uint8Array(bytes), largura: info.width, altura: info.height });
      } catch {
        // Arquivo que não é imagem de verdade: o relatório sai sem ele.
      }
    }),
  );
  return fotos;
}

/** O banco grava em nome de quem está logado (`auth.uid()`). */
export async function cadastrarAtividade(atividade: NovaAtividade): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.schema("gestao").from("atividade_relatorio").insert(atividade);
  if (error) throw new Error(error.message);
}

/**
 * Nome e CPF de quem está logado, para o cabeçalho do relatório. O CPF não é
 * legível por `authenticated`; a função do banco devolve só a linha de auth.uid().
 */
export async function meuPerfilParaRelatorio(): Promise<{ nome: string; cpf: string | null }> {
  await usuarioAtual();
  const supabase = await createClient();
  const { data, error } = await supabase.schema("gestao").rpc("meu_perfil_para_relatorio");
  if (error) throw new Error(error.message);
  const perfil = (data as { nome: string; cpf: string | null }[] | null)?.[0];
  return { nome: perfil?.nome ?? "", cpf: perfil?.cpf ?? null };
}

const MES_FECHADO = "gestao: atividade não encontrada ou de mês já encerrado";

/** A RLS só deixa o dono mexer em mês aberto; linha nenhuma afetada é recusa. */
export async function editarAtividade(id: string, atividade: NovaAtividade): Promise<void> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .schema("gestao")
    .from("atividade_relatorio")
    .update(atividade)
    .eq("id", id)
    .select("id");
  if (error) throw new Error(error.message);
  if (!data?.length) throw new Error(MES_FECHADO);
}

export async function apagarAtividade(id: string): Promise<void> {
  const supabase = await createClient();
  const { data, error } = await supabase.schema("gestao").from("atividade_relatorio").delete().eq("id", id).select("id");
  if (error) throw new Error(error.message);
  if (!data?.length) throw new Error(MES_FECHADO);
}
