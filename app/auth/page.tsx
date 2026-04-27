import { AuthForms } from "@/components/auth/auth-forms";
import Navbar from "@/components/navbar/navbar";
import { Suspense } from "react";


export default function Page() {

  return (
    <div className="flex w-screen flex-col min-h-screen">
      <Navbar showTextLogo={true} />
      <div className="flex flex-grow items-center justify-center p-4 sm:p-6 md:p-10">
        <Suspense fallback={<div className="w-full max-w-5xl" />}>
          <AuthForms />
        </Suspense>
      </div>
    </div>
  );
}