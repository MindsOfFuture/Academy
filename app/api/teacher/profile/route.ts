import { NextResponse } from "next/server";
import { updateCurrentTeacherProfileWithReverification } from "@/lib/api/profiles-server";

export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const bio = typeof body.bio === "string" ? body.bio : undefined;
        const specialties = Array.isArray(body.specialties) ? body.specialties : undefined;
        const certifications = Array.isArray(body.certifications) ? body.certifications : undefined;
        const qualificationDocumentUrl = typeof body.qualificationDocumentUrl === "string"
            ? body.qualificationDocumentUrl
            : undefined;
        const schools = Array.isArray(body.schools) ? body.schools : undefined;
        const educationLevel = typeof body.educationLevel === "string" ? body.educationLevel : undefined;
        const degree = typeof body.degree === "string" ? body.degree : undefined;

        const result = await updateCurrentTeacherProfileWithReverification({
            bio,
            specialties,
            certifications,
            qualificationDocumentUrl,
            schools,
            educationLevel,
            degree,
        });

        return NextResponse.json(result);
    } catch (error) {
        const message = error instanceof Error ? error.message : "Erro ao atualizar perfil do professor";
        const msg = message.toLowerCase();
        const status = msg.includes("não autenticado")
            ? 401
            : msg.includes("apenas professores")
                ? 403
                : msg.includes("envie o comprovante") || error instanceof SyntaxError
                    ? 400
                    : 500;
        return NextResponse.json({ error: message }, { status });
    }
}
