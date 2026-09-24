import "server-only";
import { createClient } from "@/lib/supabase/server";
import { listarEquipe } from "./equipe";
import { listarMelhorias, pendenciasDeMelhoria } from "./melhorias";
import type { GestaoPapel, MembroEquipe, Pendencia } from "./types";

/**
 * Tela "Hoje" (spec 003): o que cada pessoa tem a fazer, sempre com link.
 *
 * ponytail: no M0 só entra o que já é derivável (próximas aulas, encontros
 * passados sem aula lançada, bolsista sem bolsa vigente). Cada módulo seguinte
 * acrescenta as suas pendências aqui.
 *
 * A RLS já recorta o que o bolsista vê — a mesma query devolve só os encontros
 * em que ele está alocado —, então não há filtro por pessoa no código.
 */

export interface AgendaPendenciaRow {
  id: string;
  data: string;
  horario: string;
  modalidade: string;
  escola: { nome: string } | { nome: string }[] | null;
  aula: { id: string }[] | null;
}

const DIAS_PASSADOS = 60;
const PROXIMAS = 5;

function nomeEscola(escola: AgendaPendenciaRow["escola"]): string {
  const alvo = Array.isArray(escola) ? escola[0] : escola;
  return alvo?.nome ?? "Escola";
}

export function formatarData(iso: string): string {
  const [ano, mes, dia] = iso.split("-");
  return ano && mes && dia ? `${dia}/${mes}` : iso;
}

/** Função pura: monta a lista a partir do que as queries devolveram. */
export function montarPendencias(entrada: {
  papel: GestaoPapel;
  hoje: string;
  agendas: AgendaPendenciaRow[];
  equipe: MembroEquipe[];
}): Pendencia[] {
  const { papel, hoje, agendas, equipe } = entrada;
  const pendencias: Pendencia[] = [];

  const semRegistro = agendas
    .filter((a) => a.data < hoje && (a.aula ?? []).length === 0)
    .sort((a, b) => a.data.localeCompare(b.data));
  for (const a of semRegistro) {
    pendencias.push({
      tipo: "aula_sem_registro",
      titulo: `Aula de ${formatarData(a.data)} sem registro`,
      detalhe: `${nomeEscola(a.escola)} · ${a.modalidade} · ${a.horario}`,
      href: "/gestao",
      urgente: true,
    });
  }

  if (papel === "coordenacao") {
    for (const m of equipe) {
      if (m.papel === "bolsista" && !m.desligadoEm && !m.bolsaVigente) {
        pendencias.push({
          tipo: "bolsista_sem_bolsa",
          titulo: `${m.nome} está sem bolsa vigente`,
          detalhe: "Cadastre a bolsa para a carga e os pagamentos saírem certos.",
          href: "/gestao/equipe",
        });
      }
    }
  }

  const proximas = agendas
    .filter((a) => a.data >= hoje)
    .sort((a, b) => a.data.localeCompare(b.data))
    .slice(0, PROXIMAS);
  for (const a of proximas) {
    pendencias.push({
      tipo: "proxima_aula",
      titulo: `${a.data === hoje ? "Hoje" : formatarData(a.data)} · ${nomeEscola(a.escola)}`,
      detalhe: `${a.modalidade} · ${a.horario}`,
      href: "/gestao",
    });
  }

  return pendencias;
}

function hojeEmSaoPaulo(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
}

export async function listarPendencias(papel: GestaoPapel): Promise<Pendencia[]> {
  const supabase = await createClient();
  const hoje = hojeEmSaoPaulo();
  const inicio = new Date(Date.now() - DIAS_PASSADOS * 86_400_000).toISOString().slice(0, 10);

  const [{ data, error }, { data: auth }, melhorias] = await Promise.all([
    supabase
      .schema("gestao")
      .from("agenda")
      .select("id, data, horario, modalidade, escola(nome), aula(id)")
      .gte("data", inicio)
      .order("data"),
    supabase.auth.getUser(),
    listarMelhorias(),
  ]);
  if (error) throw new Error(error.message);

  const equipe = papel === "coordenacao" ? await listarEquipe() : [];
  const base = montarPendencias({ papel, hoje, agendas: (data ?? []) as AgendaPendenciaRow[], equipe });
  const deMelhoria = pendenciasDeMelhoria(papel, auth.user?.id ?? "", melhorias, new Date());
  return [...deMelhoria, ...base];
}
