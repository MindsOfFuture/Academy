import { redirect } from "next/navigation";
import Navbar from "@/components/navbar/navbar";
import { ProfileClient } from "@/components/profile/profile-client";
import { getCurrentUserProfile } from "@/components/api/admApi";

export default async function ProtectedProfilePage() {
  const profile = await getCurrentUserProfile();
  if (!profile) {
    redirect("/auth");
  }
  const { id, displayName, email, type } = profile;

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar showTextLogo={true} />
      <div className="flex justify-center p-4 sm:p-6 md:p-10">
        <div className="w-full max-w-5xl mx-auto space-y-8">
          <header className="mb-2">
            <h1 className="text-3xl font-bold tracking-tight">Olá, {displayName || 'usuário'}</h1>
            <p className="text-sm text-gray-600 mt-1">Aqui você pode atualizar suas informações.</p>
          </header>
          <ProfileClient
            userId={id}
            initialName={displayName}
            initialEmail={email}
            userType={type}
          />
        </div>
      </div>
    </div>
  );
}
