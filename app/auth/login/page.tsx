import { AuthForms } from "@/components/auth/auth-forms";
import Navbar from "@/components/navbar/navbar";

export default function Page() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar showTextLogo={true} />
      <div className="flex flex-grow items-center justify-center p-4 sm:p-6 md:p-10">
        <AuthForms />
      </div>
    </div>
  );
}