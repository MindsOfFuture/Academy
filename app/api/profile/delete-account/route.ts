import { NextResponse } from "next/server";
import { createClient as createServerSupabase, createServiceRoleClient } from "@/lib/supabase/server";
import { fetchRoleForUser } from "@/lib/api/profiles-server";

function normalizeConfirmation(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

async function runOrThrow<T extends { error?: { message?: string } | null }>(
  promise: PromiseLike<T>,
  context: string,
) {
  const result = await promise;
  if (result.error) {
    throw new Error(`${context}: ${result.error.message || "erro desconhecido"}`);
  }
  return result;
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabase();
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError || !authData.user) {
      return NextResponse.json({ error: "Usuário não autenticado." }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const confirmation = normalizeConfirmation(body?.confirmation);
    if (confirmation.toUpperCase() !== "EXCLUIR") {
      return NextResponse.json({ error: "Confirmação inválida." }, { status: 400 });
    }

    const role = await fetchRoleForUser(authData.user.id, supabase);
    if (role === "admin") {
      return NextResponse.json({ error: "Ação indisponível para administradores." }, { status: 403 });
    }

    const serviceRole = await createServiceRoleClient();
    const userId = authData.user.id;

    // Anonimizar dados pessoais do perfil
    await runOrThrow(
      serviceRole
        .from("user_profile")
        .update({
          full_name: "Usuário excluído",
          email: null,
          avatar_url: null,
          bio: null,
          phone: null,
          address: null,
          document: null,
          birth_date: null,
          specialties: [],
          certifications: [],
          verification_status: null,
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId),
      "Falha ao anonimizar perfil",
    );

    // Remover dados pessoais
    await runOrThrow(
      serviceRole.from("user_role").delete().eq("user_profile_id", userId),
      "Falha ao remover papeis",
    );
    await runOrThrow(
      serviceRole.from("student_details").delete().eq("user_id", userId),
      "Falha ao remover dados de aluno",
    );
    await runOrThrow(
      serviceRole.from("teacher_details").delete().eq("user_id", userId),
      "Falha ao remover dados de professor",
    );
    await runOrThrow(
      serviceRole.from("teacher_request").delete().eq("user_id", userId),
      "Falha ao remover solicitacoes de professor",
    );
    await runOrThrow(
      serviceRole.from("notification").delete().eq("user_id", userId),
      "Falha ao remover notificacoes",
    );

    // Excluir conta auth e perfil
    await serviceRole.auth.admin.deleteUser(userId);

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao excluir conta.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
