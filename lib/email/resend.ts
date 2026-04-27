import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "noreply@mindsofthefuture.com";

export async function sendNotificationEmail(
    to: string,
    subject: string,
    html: string,
): Promise<void> {
    try {
        await resend.emails.send({
            from: FROM_EMAIL,
            to,
            subject,
            html,
        });
    } catch (error) {
        // Log but don't throw — email failure should not block the notification flow
        console.error("[sendNotificationEmail] Falha ao enviar e-mail:", error);
    }
}
