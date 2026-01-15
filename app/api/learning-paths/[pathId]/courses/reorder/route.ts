import { NextResponse } from "next/server";
import { reorderCoursesInPath } from "@/lib/api/learning-paths";

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ pathId: string }> }
) {
    try {
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
        return NextResponse.json(
            { error: "Erro interno" },
            { status: 500 }
        );
    }
}
