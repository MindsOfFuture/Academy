import { NextResponse } from "next/server";
import { getLearningPaths, createLearningPath } from "@/lib/api/learning-paths";
import { ensureCurrentTeacherVerifiedForPublishing } from "@/lib/api/profiles-server";
import { createClient as createServerSupabase } from "@/lib/supabase/server";

export async function GET() {
    try {
        await ensureCurrentTeacherVerifiedForPublishing();
        const paths = await getLearningPaths({ scope: "manage" });
        return NextResponse.json(paths);
    } catch (error) {
        console.error("Erro ao buscar trilhas:", error);
        const message = error instanceof Error ? error.message : "Erro ao buscar trilhas";
        const status = message.toLowerCase().includes("não verificado") || message.toLowerCase().includes("apenas professores") ? 403 : 500;
        return NextResponse.json({ error: message }, { status });
    }
}

export async function POST(request: Request) {
    try {
        await ensureCurrentTeacherVerifiedForPublishing();

        const body = await request.json();
        const { title, description, audience, coverMediaId } = body;

        const supabase = await createServerSupabase();
        const { data: authData } = await supabase.auth.getUser();
        const ownerId = authData?.user?.id ?? null;

        if (!title) {
            return NextResponse.json({ error: "Título é obrigatório" }, { status: 400 });
        }

        const path = await createLearningPath({ title, description, audience, coverMediaId, ownerId });

        if (!path) {
            return NextResponse.json({ error: "Erro ao criar trilha" }, { status: 500 });
        }

        return NextResponse.json(path, { status: 201 });
    } catch (error) {
        console.error("Erro ao criar trilha:", error);
        const message = error instanceof Error ? error.message : "Erro ao criar trilha";
        const status = message.toLowerCase().includes("não verificado") || message.toLowerCase().includes("apenas professores") ? 403 : 500;
        return NextResponse.json({ error: message }, { status });
    }
}
