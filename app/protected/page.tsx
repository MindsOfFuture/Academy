import { Suspense } from "react";
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

  const primeiroNome = String(userName).trim().split(/\s+/)[0] || userName;

  const usuarios = isAdmin ? (
    // A lista de usuários é a parte mais demorada: o painel aparece na hora e ela chega depois
    <Suspense
      fallback={
        <div aria-busy="true" className="rounded-2xl bg-white p-6 shadow-sm">
          <p role="status" className="text-[#684A97]">Carregando usuários...</p>
          <div aria-hidden="true" className="mt-4 space-y-3">
            {[0, 1, 2, 3].map((i) => <div key={i} className="h-10 rounded bg-gray-100 motion-safe:animate-pulse" />)}
          </div>
        </div>
      }
    >
      <UsersTable />
    </Suspense>
  ) : null;

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar showTextLogo={true} />
      <div className="flex justify-center p-4 sm:p-6 md:p-8">
        {/* Mesma largura da gestão: as duas áreas logadas se parecem */}
        <div className="w-full max-w-5xl mx-auto space-y-10">
          <header className="space-y-1">
            <h1 className="text-3xl font-bold">Olá, {primeiroNome}</h1>
            <p className="text-gray-600">Seus cursos e atividades estão aqui.</p>
            {isTeacher && profile?.verificationStatus !== "approved" && (
              <p className="mt-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 inline-block">
                Seu perfil de professor está {profile?.verificationStatus === "rejected" ? "reprovado" : "pendente"}. Até aprovação do admin, publicar artigos e criar cursos/trilhas ficará bloqueado.
              </p>
            )}
          </header>

          <section aria-labelledby="meus-cursos" className="space-y-4">
            <h2 id="meus-cursos" className="text-xl font-semibold">Continue de onde parou</h2>
            <YourCourses initialCursos={courses} />
          </section>

          <ModulesSection />

          {/* O que é do aluno fica em cima; a administração do site, separada, embaixo */}
          {(isAdmin || isTeacherApproved) && (
            <section aria-labelledby="administracao" className="space-y-4 rounded-2xl border bg-white p-4 shadow-sm sm:p-6">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 id="administracao" className="text-xl font-semibold text-[#684A97]">
                    {isAdmin ? "Administração da plataforma" : "Seus cursos como professor"}
                  </h2>
                  <span className="rounded-full bg-[#ECE9F3] px-2.5 py-0.5 text-xs text-[#684A97]">
                    {isAdmin ? "só administradores" : "só professores"}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-600">
                  {isAdmin ? "Cursos, trilhas, pessoas e respostas dos alunos." : "Cursos, trilhas e respostas dos seus alunos."}
                </p>
              </div>
              <CoursesSection isAdmin={isAdmin} usuarios={usuarios} />
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
