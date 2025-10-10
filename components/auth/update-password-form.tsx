"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, ArrowLeft } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export function UpdatePasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setMessage(null);

    if (password !== confirmPassword) {
      setError("As senhas não conferem.");
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      setIsLoading(false);
      return;
    }

    const supabase = createClient();

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setMessage("Senha atualizada com sucesso!");
      setTimeout(() => {
        router.push("/protected");
      }, 2000);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Ocorreu um erro ao atualizar a senha.");
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
          Digite sua nova senha abaixo para concluir a redefinição.
        </p>
        <div className="mx-auto mt-2 h-[3px] w-20 bg-[#6A4A98]"></div>
      </div>

      <form onSubmit={handleUpdatePassword} className="w-full max-w-sm space-y-6">
        <div className="relative flex items-center">
          <Lock className="absolute left-4 text-[#6A4A98]" size={20} />
          <Input
            id="password"
            type="password"
            placeholder="Nova senha"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-full border-none bg-[#F3F0F9] py-6 pl-12 pr-4 placeholder:text-gray-500 focus-visible:ring-2 focus-visible:ring-[#6A4A98] focus-visible:ring-offset-2"
          />
        </div>

        <div className="relative flex items-center">
          <Lock className="absolute left-4 text-[#6A4A98]" size={20} />
          <Input
            id="confirmPassword"
            type="password"
            placeholder="Confirmar nova senha"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
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
          {isLoading ? "Salvando..." : "Salvar nova senha"}
        </Button>
      </form>

      <Link href="/auth" className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-[#6A4A98]">
        <ArrowLeft size={16} />
        Voltar para o login
      </Link>
    </div>
  );
}
