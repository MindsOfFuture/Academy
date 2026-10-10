/**
 * Modelo único dos e-mails da plataforma. O lembrete de encontro, montado no
 * banco, tem uma cópia em `gestao.email_html()`
 * (`supabase/migrations/20261009_gestao_lembrete_no_modelo.sql`); o teste
 * `tests/integration/gestao-alocacao-migration.test.ts` falha se as duas
 * divergirem. `title` e `message` entram como HTML: escape antes o que vier de
 * pessoa.
 */
export function buildEmailHtml(title: string, message: string, href?: string): string {
    return `
    <div style="font-family:'Segoe UI',Roboto,sans-serif;max-width:520px;margin:0 auto;padding:24px;background:#f9f7fc;border-radius:12px;">
        <div style="text-align:center;margin-bottom:16px;">
            <h2 style="color:#684A97;margin:0;">Minds of the Future</h2>
        </div>
        <div style="background:#fff;border-radius:8px;padding:20px;border:1px solid #e5e0ed;">
            <h3 style="margin:0 0 8px;color:#333;">${title}</h3>
            <p style="margin:0 0 16px;color:#555;line-height:1.5;">${message}</p>
            ${href ? `<a href="${href}" style="display:inline-block;background:#684A97;color:#fff;padding:10px 20px;border-radius:24px;text-decoration:none;font-weight:600;">Acessar</a>` : ""}
        </div>
        <p style="text-align:center;margin-top:16px;font-size:12px;color:#999;">
            Você recebeu este e-mail porque tem uma conta na plataforma Minds of the Future.
        </p>
    </div>`;
}

export function escaparHtml(texto: string): string {
    return texto.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}
