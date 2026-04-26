import { NextResponse } from "next/server";
import { getAllUsers, setTeacherVerificationStatusByAdmin } from "@/lib/api/profiles-server";

export async function GET() {
    try {
        const users = await getAllUsers();
        const pendingTeachers = users.filter((user) => user.role === "teacher" && user.verificationStatus === "pending");
        return NextResponse.json(pendingTeachers);
    } catch (error) {
        console.error("Erro ao listar professores pendentes:", error);
        return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const userId = (body.userId || "").toString();
        const status = body.status as "approved" | "rejected" | undefined;
        const reason = body.reason as string | undefined;

        if (!userId) {
            return NextResponse.json({ error: "userId é obrigatório" }, { status: 400 });
        }

        if (status !== "approved" && status !== "rejected") {
            return NextResponse.json({ error: "status inválido" }, { status: 400 });
        }

        await setTeacherVerificationStatusByAdmin({
            teacherId: userId,
            status,
            reason,
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Erro ao atualizar verificação";
        const status = message.toLowerCase().includes("acesso negado") ? 403 : 500;
        return NextResponse.json({ error: message }, { status });
    }
}
