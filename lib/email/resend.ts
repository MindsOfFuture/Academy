import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "noreply@mindsofthefuture.com";
const TEST_RECIPIENT = process.env.RESEND_TEST_RECIPIENT?.trim() || "";

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
        const result = await resend.emails.send({
            from: FROM_EMAIL,
            to: effectiveRecipient,
            subject,
            html,
        });

        if (result?.error) {
            console.error("[sendNotificationEmail] Resend retornou erro:", {
                to: effectiveRecipient,
                subject,
                error: result.error,
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
        });
    } catch (error) {
        // Log but don't throw — email failure should not block the notification flow
        console.error("[sendNotificationEmail] Falha ao enviar e-mail:", error);
    }
}
