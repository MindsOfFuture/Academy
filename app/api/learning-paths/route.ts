import { NextResponse } from "next/server";
import { getLearningPaths, createLearningPath } from "@/lib/api/learning-paths";

export async function GET() {
    try {
        const paths = await getLearningPaths();
        return NextResponse.json(paths);
    } catch (error) {
        console.error("Erro ao buscar trilhas:", error);
        return NextResponse.json({ error: "Erro ao buscar trilhas" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { title, description, audience, coverMediaId } = body;

        if (!title) {
            return NextResponse.json({ error: "Título é obrigatório" }, { status: 400 });
        }

        const path = await createLearningPath({ title, description, audience, coverMediaId });

        if (!path) {
            return NextResponse.json({ error: "Erro ao criar trilha" }, { status: 500 });
        }

        return NextResponse.json(path, { status: 201 });
    } catch (error) {
        console.error("Erro ao criar trilha:", error);
        return NextResponse.json({ error: "Erro ao criar trilha" }, { status: 500 });
    }
}
