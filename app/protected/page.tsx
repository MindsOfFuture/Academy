import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/navbar/navbar";
import CoursesSection from "@/components/courses-section";
import UsersTable from "@/components/users-table";
import { getUserTypeServer } from "@/components/api/indexApi";

export default async function ProtectedPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    redirect("/auth");
  }
  let userType;
  try {
    userType = await getUserTypeServer();
  } catch (error) {
    console.error("Erro ao buscar tipo de usuário:", error);
  }
  const userName = data.user.user_metadata.full_name || "Fulano";
  if (userType === 'adm') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar showTextLogo={true} />

        <div className="flex justify-center p-4 sm:p-6 md:p-8">
          <div className="w-full max-w-7xl mx-auto space-y-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Olá, {userName} ({userType || "usuário"})
              </h1>
            </div>

            <div className="space-y-8">
              <CoursesSection />
              <UsersTable />
            </div>
          </div>
        </div>
      </div>
    );
  }
  else {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar showTextLogo={true} />

        <div className="flex justify-center p-4 sm:p-6 md:p-8">
          <div className="w-full max-w-7xl mx-auto space-y-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Olá, {userName} ({userType || "usuário"})
              </h1>
            </div>

            <div className="space-y-8">
            </div>
          </div>
        </div>
      </div>
    )
  }
}
