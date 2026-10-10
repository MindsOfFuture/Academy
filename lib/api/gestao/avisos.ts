import "server-only";
import { sendNotificationEmail } from "@/lib/email/resend";
import { buildEmailHtml, escaparHtml } from "@/lib/email/template";
import { obterEncontro } from "./alocacao";
import { listarEquipe } from "./equipe";

/**
 * Avisos por e-mail da alocação (spec 016): alocado, removido ou substituído,
 * encontro cancelado. Quem chama é uma ação da coordenação, que lê o e-mail da
 * equipe por `gestao.equipe()` — sem chave de serviço (ADR 021).
 *
 * Aviso que falha não desfaz nada: a escrita já aconteceu e é ela que vale.
 */

export type MotivoAviso = "alocado" | "removido" | "substituido" | "cancelado";

const ASSUNTO: Record<MotivoAviso, string> = {
  alocado: "Você foi alocado(a) em um encontro",
  removido: "Você saiu de um encontro",
  substituido: "Você foi substituído(a) em um encontro",
  cancelado: "Encontro cancelado",
};

function urlBase(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || "https://mindsofthefuture.com.br").replace(/\/$/, "");
}

/** `"equipe"` = quem ainda está no encontro (nem substituído, nem retirado). */
export async function avisar(motivo: MotivoAviso, encontroId: string, pessoas: string[] | "equipe"): Promise<void> {
  if (pessoas.length === 0) return;
  try {
    const [encontro, equipe] = await Promise.all([obterEncontro(encontroId), listarEquipe()]);
    if (!encontro) return;
    const destino =
      pessoas === "equipe"
        ? encontro.alocacoes
            .filter((a) => a.situacao !== "substituida" && a.situacao !== "retirada")
            .map((a) => a.bolsistaId)
        : pessoas;
    const [, mes, dia] = encontro.data.split("-");
    const onde = [encontro.turmaNome, encontro.escolaNome ?? "fora de escola"].filter(Boolean).join(" · ");
    const linha = `${dia}/${mes} · ${encontro.horario} · ${encontro.modalidade} · ${onde}`;
    const extra = motivo === "cancelado" && encontro.motivoCancelamento ? `Motivo: ${encontro.motivoCancelamento}` : "";
    const link = `${urlBase()}/gestao/encontro/${encontro.id}`;
    const html = buildEmailHtml(
      escaparHtml(ASSUNTO[motivo]),
      escaparHtml(linha) + (extra ? `<br>${escaparHtml(extra)}` : ""),
      link,
    );

    const emails = new Map(equipe.map((m) => [m.userProfileId, m.email]));
    await Promise.allSettled(
      destino
        .map((id) => emails.get(id))
        .filter((email): email is string => Boolean(email))
        .map((email) => sendNotificationEmail(email, `${ASSUNTO[motivo]}: ${linha}`, html)),
    );
  } catch (error) {
    console.error("[gestao/avisos] aviso por e-mail não enviado:", error instanceof Error ? error.message : error);
  }
}
