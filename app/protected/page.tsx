import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/navbar/navbar";
import CoursesSection from "@/components/dashboard/courses-section";
import UsersTable from "@/components/dashboard/users-table";
import { getUserTypeServer } from "@/lib/api/profiles-server";
import { YourCourses } from "@/components/yourCourses/yourCoursers";
import { getUserCoursesServer } from "@/lib/api/enrollments-server";

export default async function ProtectedPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect("/auth");
  }
  const userType = await getUserTypeServer();
  const userName = data.user.user_metadata.full_name || "Fulano";

  const courses = await getUserCoursesServer();
  console.log(courses);
  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar showTextLogo={true} />
      <div className="flex justify-center p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-7xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Olá, {userName}
            </h1>
          </div>

          <div className="w-full max-w-7xl mx-auto space-y-8">
            <h2 className="text-3xl font-bold">Cursos Matriculados</h2>
            <p className="max-w-[480px]">
              Acompanhe seu progresso e continue sua jornada de aprendizagem!
            </p>
          </div>

          <YourCourses initialCursos={courses} />

          {userType === "admin" && (
            <div className="space-y-8">
              <CoursesSection />
              <UsersTable />
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
