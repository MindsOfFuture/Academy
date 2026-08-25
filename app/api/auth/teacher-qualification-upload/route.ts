import { NextResponse } from "next/server";
import { createClient as createServerSupabase, createServiceRoleClient } from "@/lib/supabase/server";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
];

export async function POST(request: Request) {
    try {
        // Esta rota precisa aceitar chamada anônima: no cadastro por e-mail/senha
        // o comprovante é enviado ANTES do signUp (a confirmação por e-mail é
        // obrigatória, então ainda não existe sessão). Sem sessão para amarrar o
        // upload, o limite por IP é o que impede gravação ilimitada no storage.
        if (!rateLimit(`qualification-upload:${clientIp(request)}`, 5, 60 * 60 * 1000)) {
            return NextResponse.json(
                { error: "Muitos envios. Tente novamente mais tarde." },
                { status: 429 },
            );
        }

        const supabaseUser = await createServerSupabase();
        const { data: authData } = await supabaseUser.auth.getUser();

        const formData = await request.formData();
        const file = formData.get("file");

        if (!(file instanceof File)) {
            return NextResponse.json({ error: "Arquivo obrigatório" }, { status: 400 });
        }

        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json({ error: "Formato inválido. Envie PDF, JPG, PNG ou WEBP." }, { status: 400 });
        }

        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json({ error: "Arquivo excede 10MB." }, { status: 400 });
        }

        const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        // Quando há sessão (fluxo OAuth) o arquivo fica sob o id do usuário, o que
        // permite apagar tudo dele ao excluir a conta.
        const prefix = authData.user ? `pending/${authData.user.id}` : "pending/anon";
        const filePath = `${prefix}/${Date.now()}-${crypto.randomUUID()}-${safeName}`;

        const supabase = await createServiceRoleClient();
        const { error: uploadError } = await supabase.storage
            .from("teacher-qualification-documents")
            .upload(filePath, file, { upsert: false, contentType: file.type || undefined });

        if (uploadError) {
            return NextResponse.json({ error: uploadError.message }, { status: 500 });
        }

        const { data } = supabase.storage.from("teacher-qualification-documents").getPublicUrl(filePath);

        // ponytail: bucket segue público — a chave carrega um UUID e não existe
        // policy de SELECT em storage.objects, então não dá para enumerar. Teto:
        // quem obtiver a URL lê o documento para sempre. Upgrade: bucket privado +
        // createSignedUrl na leitura (exige migrar as URLs já gravadas em
        // teacher_request.qualification_document_url).
        return NextResponse.json({
            path: filePath,
            url: data.publicUrl,
            extension: ext,
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Erro ao fazer upload";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
