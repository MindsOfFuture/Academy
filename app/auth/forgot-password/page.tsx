import Aurora from "@/components/aurora/aurora";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Aurora
          colorStops={["#684A97", "#FFD300", "#684A97"]}
          blend={1.0}
          amplitude={0.3}
          speed={1}
        />
        <ForgotPasswordForm />
      </div>
    </div>
  );
}