import { NextResponse } from "next/server";
import { reorderCoursesInPath } from "@/lib/api/learning-paths";
import { ensureCurrentTeacherVerifiedForPublishing } from "@/lib/api/profiles-server";

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ pathId: string }> }
) {
    try {
        await ensureCurrentTeacherVerifiedForPublishing();

        const { pathId } = await params;
        const body = await request.json();
        const { courseOrders } = body;

        if (!courseOrders || !Array.isArray(courseOrders)) {
            return NextResponse.json(
                { error: "courseOrders é obrigatório" },
                { status: 400 }
            );
        }

        const success = await reorderCoursesInPath(pathId, courseOrders);

        if (!success) {
            return NextResponse.json(
                { error: "Erro ao reordenar cursos" },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Erro ao reordenar cursos:", error);
        const message = error instanceof Error ? error.message : "Erro interno";
        const status = message.toLowerCase().includes("não verificado") || message.toLowerCase().includes("apenas professores") ? 403 : 500;
        return NextResponse.json(
            { error: message },
            { status }
        );
    }
}
