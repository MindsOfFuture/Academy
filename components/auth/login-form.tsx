"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Mail, Lock } from "lucide-react";
import Image from "next/image";
import Link from 'next/link';

interface LoginFormProps extends React.ComponentPropsWithoutRef<"div"> {
  onToggleView: () => void;
}

export function LoginForm({ className, onToggleView, ...props }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    const supabase = createClient();
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      router.push("/protected");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Ocorreu um erro.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={cn( "flex w-full flex-col items-center justify-center gap-8 bg-white p-8 md:w-1/2 lg:p-12", className )} {...props} >
      <Image src="/logo.svg" alt="Logo" width={170} height={100} />
      <div className="w-full max-w-sm text-center">
        <h2 className="text-2xl font-bold text-[#6A4A98]">Bem-vindo de volta!</h2>
        <div className="mx-auto mt-2 h-[3px] w-20 bg-[#6A4A98]"></div>
      </div>
      <form onSubmit={handleLogin} className="w-full max-w-sm space-y-6">
        <div className="relative flex items-center">
          <Mail className="absolute left-4 text-[#6A4A98]" size={20} />
          <Input id="email" type="email" placeholder="Email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-full border-none bg-[#F3F0F9] py-6 pl-12 pr-4 placeholder:text-gray-500 focus-visible:ring-2 focus-visible:ring-[#6A4A98] focus-visible:ring-offset-2" />
        </div>

        <div className="relative flex items-center">
          <Lock className="absolute left-4 text-[#6A4A98]" size={20} />
          <Input id="password" type="password" placeholder="Senha" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-full border-none bg-[#F3F0F9] py-6 pl-12 pr-4 placeholder:text-gray-500 focus-visible:ring-2 focus-visible:ring-[#6A4A98] focus-visible:ring-offset-2" />
        </div>
        <div className="w-full flex text-sm">
          <Link
            href="/auth/forgot-password"
            className="font-medium text-gray-600 hover:text-[#6A4A98] hover:underline"
          >
            Esqueceu sua senha?
          </Link>
        </div>

        {error && <p className="text-center text-sm text-red-500">{error}</p>}
        <Button type="submit" className="w-full rounded-full bg-[#6A4A98] py-6 text-base font-semibold text-white hover:bg-[#5a3e85]" disabled={isLoading}>
          {isLoading ? "Entrando..." : "Entrar"}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-gray-600 md:hidden">
        Não tem uma conta?{" "}
        <button type="button" onClick={onToggleView} className="font-semibold text-[#6A4A98] underline hover:text-[#5a3e85]" >
          Criar conta
        </button>
      </p>
    </div>
  );
}