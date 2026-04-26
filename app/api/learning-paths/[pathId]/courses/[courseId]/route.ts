import { NextResponse } from "next/server";
import { removeCourseFromPath } from "@/lib/api/learning-paths";
import { ensureCurrentTeacherVerifiedForPublishing } from "@/lib/api/profiles-server";

type RouteParams = { params: Promise<{ pathId: string; courseId: string }> };

export async function DELETE(request: Request, { params }: RouteParams) {
    try {
        await ensureCurrentTeacherVerifiedForPublishing();

        const { pathId, courseId } = await params;
        const success = await removeCourseFromPath(pathId, courseId);

        if (!success) {
            return NextResponse.json({ error: "Erro ao remover curso" }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Erro ao remover curso da trilha:", error);
        const message = error instanceof Error ? error.message : "Erro ao remover curso";
        const status = message.toLowerCase().includes("não verificado") || message.toLowerCase().includes("apenas professores") ? 403 : 500;
        return NextResponse.json({ error: message }, { status });
    }
}
