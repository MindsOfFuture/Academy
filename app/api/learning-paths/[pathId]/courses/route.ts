import { NextResponse } from "next/server";
import { addCourseToPath } from "@/lib/api/learning-paths";
import { ensureCurrentTeacherVerifiedForPublishing } from "@/lib/api/profiles-server";

type RouteParams = { params: Promise<{ pathId: string }> };

export async function POST(request: Request, { params }: RouteParams) {
    try {
        await ensureCurrentTeacherVerifiedForPublishing();

        const { pathId } = await params;
        const body = await request.json();
        const { courseId, order } = body;

        if (!courseId) {
            return NextResponse.json({ error: "courseId é obrigatório" }, { status: 400 });
        }

        const success = await addCourseToPath(pathId, courseId, order);

        if (!success) {
            return NextResponse.json({ error: "Erro ao adicionar curso" }, { status: 500 });
        }

        return NextResponse.json({ success: true }, { status: 201 });
    } catch (error) {
        console.error("Erro ao adicionar curso à trilha:", error);
        const message = error instanceof Error ? error.message : "Erro ao adicionar curso";
        const status = message.toLowerCase().includes("não verificado") || message.toLowerCase().includes("apenas professores") ? 403 : 500;
        return NextResponse.json({ error: message }, { status });
    }
}
