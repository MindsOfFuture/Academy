import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/navbar/navbar";
import CoursesSection from "@/components/dashboard/courses-section";
import UsersTable from "@/components/dashboard/users-table";
import { getDashboardAccess } from "@/lib/api/dashboard-server";
import { YourCourses } from "@/components/yourCourses/yourCoursers";
import { readUserCourses } from "@/lib/api/enrollments-read-server";
import ModulesSection from "@/components/modules/ModulesSection";

export default async function ProtectedPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect("/auth");
  }
  // Mesmo cliente e usuário já verificados: papel/status e cursos carregam juntos,
  // sem reautenticar nem buscar o perfil completo.
  const [profile, courses] = await Promise.all([
    getDashboardAccess(supabase, data.user),
    readUserCourses(supabase, data.user.id),
  ]);
  const userName = data.user.user_metadata.full_name || "Fulano";
  const isAdmin = profile.role === "admin";
  const isTeacher = profile.role === "teacher";
  const isTeacherApproved = isTeacher && profile.verificationStatus === "approved";

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar showTextLogo={true} />
      <div className="flex justify-center p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-7xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Olá, {userName}
            </h1>
            {isTeacher && profile?.verificationStatus !== "approved" && (
              <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 inline-block">
                Seu perfil de professor está {profile?.verificationStatus === "rejected" ? "reprovado" : "pendente"}. Até aprovação do admin, publicar artigos e criar cursos/trilhas ficará bloqueado.
              </p>
            )}
          </div>

          <div className="w-full max-w-7xl mx-auto space-y-8">
            <h2 className="text-3xl font-bold">Cursos Matriculados</h2>
            <p className="max-w-[480px]">
              Acompanhe seu progresso e continue sua jornada de aprendizagem!
            </p>
          </div>

          <YourCourses initialCursos={courses} />

          <ModulesSection />

          {(isAdmin || isTeacherApproved) && (
            <div className="space-y-8">
              <CoursesSection isAdmin={isAdmin} />
              {isAdmin && <UsersTable />}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
