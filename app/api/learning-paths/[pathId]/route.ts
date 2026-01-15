import { NextResponse } from "next/server";
import { 
    getLearningPathDetail, 
    updateLearningPath, 
    deleteLearningPath 
} from "@/lib/api/learning-paths";

type RouteParams = { params: Promise<{ pathId: string }> };

export async function GET(request: Request, { params }: RouteParams) {
    try {
        const { pathId } = await params;
        const path = await getLearningPathDetail(pathId);

        if (!path) {
            return NextResponse.json({ error: "Trilha não encontrada" }, { status: 404 });
        }

        return NextResponse.json(path);
    } catch (error) {
        console.error("Erro ao buscar trilha:", error);
        return NextResponse.json({ error: "Erro ao buscar trilha" }, { status: 500 });
    }
}

export async function PATCH(request: Request, { params }: RouteParams) {
    try {
        const { pathId } = await params;
        const body = await request.json();
        const { title, description, coverMediaId } = body;

        const updated = await updateLearningPath(pathId, { 
            title, 
            description, 
            coverMediaId 
        });

        if (!updated) {
            return NextResponse.json({ error: "Erro ao atualizar trilha" }, { status: 500 });
        }

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Erro ao atualizar trilha:", error);
        return NextResponse.json({ error: "Erro ao atualizar trilha" }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: RouteParams) {
    try {
        const { pathId } = await params;
        const success = await deleteLearningPath(pathId);

        if (!success) {
            return NextResponse.json({ error: "Erro ao excluir trilha" }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Erro ao excluir trilha:", error);
        return NextResponse.json({ error: "Erro ao excluir trilha" }, { status: 500 });
    }
}
