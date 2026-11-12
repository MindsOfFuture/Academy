import "server-only";
import { sendNotificationEmail } from "@/lib/email/resend";
import { buildEmailHtml, escaparHtml } from "@/lib/email/template";
import { obterEncontros } from "./alocacao";
import { listarEquipe } from "./equipe";
import type { Meta } from "./types";

/**
 * Avisos por e-mail da alocação (spec 016): alocado, removido ou substituído,
 * encontro alterado ou cancelado; e das metas, no fim do arquivo. Quem chama é uma ação da coordenação, que lê o e-mail da
 * equipe por `gestao.equipe()` — sem chave de serviço (ADR 021).
 *
 * Numa ação em lote (spec 020), cada pessoa recebe um e-mail só, com a lista
 * dos encontros dela.
 *
 * Aviso que falha não desfaz nada: a escrita já aconteceu e é ela que vale.
 */

export type MotivoAviso = "alocado" | "removido" | "substituido" | "alterado" | "cancelado";

const ASSUNTO: Record<MotivoAviso, string> = {
  alocado: "Você foi alocado(a) em um encontro",
  removido: "Você saiu de um encontro",
  substituido: "Você foi substituído(a) em um encontro",
  alterado: "Encontro alterado",
  cancelado: "Encontro cancelado",
};

const ASSUNTO_VARIOS: Record<MotivoAviso, (n: number) => string> = {
  alocado: (n) => `Você foi alocado(a) em ${n} encontros`,
  removido: (n) => `Você saiu de ${n} encontros`,
  substituido: (n) => `Você foi substituído(a) em ${n} encontros`,
  alterado: (n) => `${n} encontros alterados`,
  cancelado: (n) => `${n} encontros cancelados`,
};

/** `"equipe"` = quem ainda está no encontro (nem substituído, nem retirado). */
/** `extra`: uma linha a mais no e-mail, como o que era antes de alterar. */
export type ItemAviso = { encontroId: string; pessoas: string[] | "equipe"; extra?: string };

function urlBase(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || "https://mindsofthefuture.com.br").replace(/\/$/, "");
}

export async function avisar(
  motivo: MotivoAviso,
  encontroId: string,
  pessoas: string[] | "equipe",
  extra?: string,
): Promise<void> {
  await avisarLote(motivo, [{ encontroId, pessoas, extra }]);
}

export async function avisarLote(motivo: MotivoAviso, itens: ItemAviso[]): Promise<void> {
  const validos = itens.filter((i) => i.pessoas.length > 0);
  if (validos.length === 0) return;
  try {
    const [encontros, equipe] = await Promise.all([
      obterEncontros([...new Set(validos.map((i) => i.encontroId))]),
      listarEquipe(),
    ]);
    const porId = new Map(encontros.map((e) => [e.id, e]));

    // Pessoa → as linhas dos encontros dela, na ordem em que vieram.
    const porPessoa = new Map<string, { id: string; linha: string; extra: string }[]>();
    for (const item of validos) {
      const encontro = porId.get(item.encontroId);
      if (!encontro) continue;
      const destino =
        item.pessoas === "equipe"
          ? encontro.alocacoes
              .filter((a) => a.situacao !== "substituida" && a.situacao !== "retirada")
              .map((a) => a.bolsistaId)
          : item.pessoas;
      const [, mes, dia] = encontro.data.split("-");
      const onde = [encontro.turmaNome, encontro.escolaNome ?? "fora de escola", encontro.espacoNome].filter(Boolean).join(" · ");
      const linha = `${dia}/${mes} · ${encontro.horario} · ${encontro.modalidade} · ${onde}`;
      const extra =
        item.extra ?? (motivo === "cancelado" && encontro.motivoCancelamento ? `Motivo: ${encontro.motivoCancelamento}` : "");
      for (const pessoa of new Set(destino)) {
        porPessoa.set(pessoa, [...(porPessoa.get(pessoa) ?? []), { id: encontro.id, linha, extra }]);
      }
    }

    const emails = new Map(equipe.map((m) => [m.userProfileId, m.email]));
    await Promise.allSettled(
      [...porPessoa.entries()].flatMap(([pessoa, linhas]) => {
        const email = emails.get(pessoa);
        if (!email) return [];
        const corpo = linhas
          .map((l) => escaparHtml(l.linha) + (l.extra ? `<br>${escaparHtml(l.extra)}` : ""))
          .join("<br><br>");
        if (linhas.length === 1) {
          const link = `${urlBase()}/gestao/encontro/${linhas[0].id}`;
          const html = buildEmailHtml(escaparHtml(ASSUNTO[motivo]), corpo, link);
          return [sendNotificationEmail(email, `${ASSUNTO[motivo]}: ${linhas[0].linha}`, html)];
        }
        const assunto = ASSUNTO_VARIOS[motivo](linhas.length);
        return [sendNotificationEmail(email, assunto, buildEmailHtml(escaparHtml(assunto), corpo, `${urlBase()}/gestao`))];
      }),
    );
  } catch (error) {
    console.error("[gestao/avisos] aviso por e-mail não enviado:", error instanceof Error ? error.message : error);
  }
}

// ---------------------------------------------------------------------------
// Metas
// ---------------------------------------------------------------------------

export type MotivoMeta = "atribuida" | "alterada" | "concluida" | "reaberta";

const ASSUNTO_META: Record<MotivoMeta, string> = {
  atribuida: "Você é responsável por uma meta",
  alterada: "Meta alterada",
  concluida: "Meta concluída",
  reaberta: "Meta reaberta",
};

/** Um e-mail por responsável. Como os da alocação, falhar não desfaz nada. */
export async function avisarMeta(
  motivo: MotivoMeta,
  meta: Pick<Meta, "id" | "titulo" | "prazo">,
  pessoas: string[],
): Promise<void> {
  if (pessoas.length === 0) return;
  try {
    const equipe = await listarEquipe();
    const emails = new Map(equipe.map((m) => [m.userProfileId, m.email]));
    const [ano, mes, dia] = meta.prazo.split("-");
    const corpo = `${escaparHtml(meta.titulo)}<br>Prazo: ${dia}/${mes}/${ano}`;
    const html = buildEmailHtml(escaparHtml(ASSUNTO_META[motivo]), corpo, `${urlBase()}/gestao/metas/${meta.id}`);
    await Promise.allSettled(
      [...new Set(pessoas)].flatMap((p) => {
        const email = emails.get(p);
        return email ? [sendNotificationEmail(email, `${ASSUNTO_META[motivo]}: ${meta.titulo}`, html)] : [];
      }),
    );
  } catch (error) {
    console.error("[gestao/avisos] aviso de meta não enviado:", error instanceof Error ? error.message : error);
  }
}
