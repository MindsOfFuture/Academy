import { Resend } from "resend";

// Instanciado no primeiro envio, não no import: o construtor lança sem chave e
// `next build` importa toda rota de API para coletar metadados.
let resend: Resend | undefined;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "noreply@mindsofthefuture.com.br";
const TEST_RECIPIENT = process.env.RESEND_TEST_RECIPIENT?.trim() || "";

// A Resend aceita 10 pedidos por segundo por conta. Um aviso em lote (16
// bolsistas num encontro) disparava tudo de uma vez e 6 voltaram com 429, sem
// nova tentativa. Agora os envios saem em fila, um a cada INTERVALO_MS, e o
// 429 espera e tenta de novo.
const INTERVALO_MS = 200; // 5/s: metade do teto, sobra para outro processo
const TENTATIVAS = 4;
const ESPERA_PADRAO_MS = 1000;

let proximaVaga = 0;

const esperar = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

async function aguardarVaga(): Promise<void> {
    const agora = Date.now();
    const vaga = Math.max(agora, proximaVaga);
    proximaVaga = vaga + INTERVALO_MS;
    if (vaga > agora) await esperar(vaga - agora);
}

function esperaDoLimite(headers: Record<string, string> | null | undefined, tentativa: number): number {
    const segundos = Number(headers?.["retry-after"]);
    if (Number.isFinite(segundos) && segundos > 0) return segundos * 1000;
    return ESPERA_PADRAO_MS * 2 ** tentativa;
}

function resolveRecipient(originalRecipient: string): string {
    if (!TEST_RECIPIENT) return originalRecipient;
    return TEST_RECIPIENT;
}

export async function sendNotificationEmail(
    to: string,
    subject: string,
    html: string,
): Promise<void> {
    const effectiveRecipient = resolveRecipient(to);

    if (TEST_RECIPIENT) {
        console.warn("[sendNotificationEmail] RESEND_TEST_RECIPIENT ativo. E-mails serão redirecionados.", {
            from: FROM_EMAIL,
            originalTo: to,
            redirectedTo: effectiveRecipient,
        });
    }

    try {
        resend ??= new Resend(process.env.RESEND_API_KEY);
        for (let tentativa = 1; ; tentativa++) {
            await aguardarVaga();
            const result = await resend.emails.send({
                from: FROM_EMAIL,
                to: effectiveRecipient,
                subject,
                html,
            });

            if (result?.error) {
                const limite = result.error.statusCode === 429 || result.error.name === "rate_limit_exceeded";
                if (limite && tentativa < TENTATIVAS) {
                    const ms = esperaDoLimite(result.headers, tentativa - 1);
                    console.warn("[sendNotificationEmail] Limite da Resend, nova tentativa:", {
                        to: effectiveRecipient,
                        tentativa,
                        esperaMs: ms,
                    });
                    await esperar(ms);
                    continue;
                }
                console.error("[sendNotificationEmail] Resend retornou erro:", {
                    to: effectiveRecipient,
                    subject,
                    error: result.error,
                    tentativas: tentativa,
                });
                return;
            }

            console.info("[sendNotificationEmail] E-mail enviado:", {
                to: effectiveRecipient,
                originalTo: to,
                subject,
                id: result?.data?.id || null,
                from: FROM_EMAIL,
                forcedTestRecipient: Boolean(TEST_RECIPIENT),
                tentativas: tentativa,
            });
            return;
        }
    } catch (error) {
        // Log but don't throw — email failure should not block the notification flow
        console.error("[sendNotificationEmail] Falha ao enviar e-mail:", error);
    }
}
