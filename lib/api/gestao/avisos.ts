import "server-only";
import { sendNotificationEmail } from "@/lib/email/resend";
import { buildEmailHtml, escaparHtml } from "@/lib/email/template";
import { obterEncontros } from "./alocacao";
import { listarEquipe } from "./equipe";

/**
 * Avisos por e-mail da alocação (spec 016): alocado, removido ou substituído,
 * encontro cancelado. Quem chama é uma ação da coordenação, que lê o e-mail da
 * equipe por `gestao.equipe()` — sem chave de serviço (ADR 021).
 *
 * Numa ação em lote (spec 020), cada pessoa recebe um e-mail só, com a lista
 * dos encontros dela.
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

const ASSUNTO_VARIOS: Record<MotivoAviso, (n: number) => string> = {
  alocado: (n) => `Você foi alocado(a) em ${n} encontros`,
  removido: (n) => `Você saiu de ${n} encontros`,
  substituido: (n) => `Você foi substituído(a) em ${n} encontros`,
  cancelado: (n) => `${n} encontros cancelados`,
};

/** `"equipe"` = quem ainda está no encontro (nem substituído, nem retirado). */
export type ItemAviso = { encontroId: string; pessoas: string[] | "equipe" };

function urlBase(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || "https://mindsofthefuture.com.br").replace(/\/$/, "");
}

export async function avisar(motivo: MotivoAviso, encontroId: string, pessoas: string[] | "equipe"): Promise<void> {
  await avisarLote(motivo, [{ encontroId, pessoas }]);
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
      const onde = [encontro.turmaNome, encontro.escolaNome ?? "fora de escola"].filter(Boolean).join(" · ");
      const linha = `${dia}/${mes} · ${encontro.horario} · ${encontro.modalidade} · ${onde}`;
      const extra = motivo === "cancelado" && encontro.motivoCancelamento ? `Motivo: ${encontro.motivoCancelamento}` : "";
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
