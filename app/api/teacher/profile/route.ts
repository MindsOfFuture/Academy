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

    const result = await updateCurrentTeacherProfileWithReverification({
      bio,
      specialties,
      certifications,
      qualificationDocumentUrl,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao atualizar perfil do professor";
    const status = message.toLowerCase().includes("não autenticado") ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
