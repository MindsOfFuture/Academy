"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, ArrowLeft } from "lucide-react";
import Image from "next/image";

export function ForgotPasswordForm({ className, ...props }: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setMessage(null);
    const supabase = createClient();

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`, // Página para onde o usuário será levado após clicar no link do e-mail
      });

      if (error) throw error;
      setMessage("Link de redefinição enviado! Verifique sua caixa de entrada.");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Ocorreu um erro ao enviar o e-mail.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={cn(
        "flex w-full flex-col items-center justify-center gap-8 rounded-2xl bg-white p-8 shadow-2xl md:p-12",
        className,
      )}
      {...props}
    >
      <Image src="/logo.svg" alt="Logo" width={170} height={100} />
      <div className="w-full max-w-sm text-center">
        <h2 className="text-2xl font-bold text-[#6A4A98]">Redefinir sua senha</h2>
        <p className="mt-2 text-sm text-gray-600">
          Enviaremos um link para o seu e-mail para você criar uma nova senha.
        </p>
        <div className="mx-auto mt-2 h-[3px] w-20 bg-[#6A4A98]"></div>
      </div>

      <form onSubmit={handlePasswordReset} className="w-full max-w-sm space-y-6">
        <div className="relative flex items-center">
          <Mail className="absolute left-4 text-[#6A4A98]" size={20} />
          <Input
            id="email"
            type="email"
            placeholder="Seu e-mail de cadastro"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-full border-none bg-[#F3F0F9] py-6 pl-12 pr-4 placeholder:text-gray-500 focus-visible:ring-2 focus-visible:ring-[#6A4A98] focus-visible:ring-offset-2"
          />
        </div>

        {error && <p className="text-center text-sm text-red-500">{error}</p>}
        {message && <p className="text-center text-sm text-green-600">{message}</p>}

        <Button
          type="submit"
          className="w-full rounded-full bg-[#6A4A98] py-6 text-base font-semibold text-white hover:bg-[#5a3e85]"
          disabled={isLoading}
        >
          {isLoading ? "Enviando..." : "Enviar Link"}
        </Button>
      </form>

      <Link href="/auth" className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-[#6A4A98]">
        <ArrowLeft size={16} />
        Voltar para o login
      </Link>
    </div>
  );
}