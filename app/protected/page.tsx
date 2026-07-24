import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/navbar/navbar";
import CoursesSection from "@/components/dashboard/courses-section";
import UsersTable from "@/components/dashboard/users-table";
import { getCurrentUserProfile, getUserTypeServer } from "@/lib/api/profiles-server";
import { YourCourses } from "@/components/yourCourses/yourCoursers";
import { getUserCoursesServer } from "@/lib/api/enrollments-server";

export default async function ProtectedPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect("/auth");
  }
  const userType = await getUserTypeServer();
  const profile = await getCurrentUserProfile();
  const userName = data.user.user_metadata.full_name || "Fulano";
  const isAdmin = userType === "admin";
  const isTeacher = userType === "teacher";
  const isTeacherApproved = isTeacher && profile?.verificationStatus === "approved";

  const courses = await getUserCoursesServer();
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
