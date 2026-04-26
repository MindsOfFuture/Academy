import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];

export async function POST(request: Request) {
  try {
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
    const filePath = `pending/${Date.now()}-${crypto.randomUUID()}-${safeName}`;

    const supabase = await createServiceRoleClient();
    const { error: uploadError } = await supabase.storage
      .from("teacher-qualification-documents")
      .upload(filePath, file, { upsert: false, contentType: file.type || undefined });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data } = supabase.storage.from("teacher-qualification-documents").getPublicUrl(filePath);

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
