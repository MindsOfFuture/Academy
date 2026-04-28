import { NextResponse } from "next/server";
import {
    getLearningPathDetail,
    updateLearningPath,
    deleteLearningPath
} from "@/lib/api/learning-paths";
import { ensureCurrentTeacherVerifiedForPublishing } from "@/lib/api/profiles-server";

type RouteParams = { params: Promise<{ pathId: string }> };

export async function GET(request: Request, { params }: RouteParams) {
    try {
        const { pathId } = await params;
        const path = await getLearningPathDetail(pathId, { scope: "manage" });

        if (!path) {
            return NextResponse.json({ error: "Trilha não encontrada" }, { status: 404 });
        }

        return NextResponse.json(path);
    } catch (error) {
        console.error("Erro ao buscar trilha:", error);
        const message = error instanceof Error ? error.message : "Erro ao buscar trilha";
        const status = message.toLowerCase().includes("acesso negado")
            || message.toLowerCase().includes("não autenticado")
            ? 403
            : 500;
        return NextResponse.json({ error: message }, { status });
    }
}

export async function PATCH(request: Request, { params }: RouteParams) {
    try {
        await ensureCurrentTeacherVerifiedForPublishing();

        const { pathId } = await params;
        const body = await request.json();
        const { title, description, audience, coverMediaId } = body;

        const updated = await updateLearningPath(pathId, {
            title,
            description,
            audience,
            coverMediaId
        });

        if (!updated) {
            return NextResponse.json({ error: "Erro ao atualizar trilha" }, { status: 500 });
        }

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Erro ao atualizar trilha:", error);
        const message = error instanceof Error ? error.message : "Erro ao atualizar trilha";
        const status = message.toLowerCase().includes("não verificado")
            || message.toLowerCase().includes("apenas professores")
            || message.toLowerCase().includes("acesso negado")
            || message.toLowerCase().includes("não autenticado")
            ? 403
            : 500;
        return NextResponse.json({ error: message }, { status });
    }
}

export async function DELETE(request: Request, { params }: RouteParams) {
    try {
        await ensureCurrentTeacherVerifiedForPublishing();

        const { pathId } = await params;
        const success = await deleteLearningPath(pathId);

        if (!success) {
            return NextResponse.json({ error: "Erro ao excluir trilha" }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Erro ao excluir trilha:", error);
        const message = error instanceof Error ? error.message : "Erro ao excluir trilha";
        const status = message.toLowerCase().includes("não verificado")
            || message.toLowerCase().includes("apenas professores")
            || message.toLowerCase().includes("acesso negado")
            || message.toLowerCase().includes("não autenticado")
            ? 403
            : 500;
        return NextResponse.json({ error: message }, { status });
    }
}
