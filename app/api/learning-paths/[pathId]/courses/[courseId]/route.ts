import { NextResponse } from "next/server";
import { removeCourseFromPath } from "@/lib/api/learning-paths";

type RouteParams = { params: Promise<{ pathId: string; courseId: string }> };

export async function DELETE(request: Request, { params }: RouteParams) {
    try {
        const { pathId, courseId } = await params;
        const success = await removeCourseFromPath(pathId, courseId);

        if (!success) {
            return NextResponse.json({ error: "Erro ao remover curso" }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Erro ao remover curso da trilha:", error);
        return NextResponse.json({ error: "Erro ao remover curso" }, { status: 500 });
    }
}
