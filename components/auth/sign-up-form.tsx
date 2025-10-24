"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { User, Mail, Lock, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";

interface SignUpFormProps extends React.ComponentPropsWithoutRef<"div"> {
  onToggleView: () => void;
}

export function SignUpForm({
  className,
  onToggleView,
  ...props
}: SignUpFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showRepeatPassword, setShowRepeatPassword] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    if (password !== repeatPassword) {
      setError("As senhas não coincidem. Tente novamente.");
      setIsLoading(false);
      return;
    }
    const supabase = createClient();
    try {
      const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name }, emailRedirectTo: `${window.location.origin}/protected` } });
      if (error) throw error;
      toast.success("Conta criada com sucesso! Por favor verifique seu e-mail.");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Ocorreu um erro ao criar a conta.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={cn(
        "flex w-full flex-col items-center justify-center gap-8 bg-[#6A4A98] p-8 text-white md:w-1/2 lg:p-12",
        className
      )}
      {...props}
    >
      <div className="w-full max-w-sm text-center">
        <h2 className="text-2xl font-bold text-white">Criar sua conta</h2>
        <div className="mx-auto mt-2 h-[3px] w-20 bg-white"></div>
      </div>

      <form onSubmit={handleSignUp} className="w-full max-w-sm space-y-6">
        <div className="relative flex items-center">
          <User className="absolute left-4 text-[#6A4A98]" size={20} />
          <Input id="name" type="text" placeholder="Nome" required value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-full border-none bg-[#EFEBF5] py-6 pl-12 pr-4 text-gray-800 placeholder:text-gray-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#6A4A98]" />
        </div>
        <div className="relative flex items-center">
          <Mail className="absolute left-4 text-[#6A4A98]" size={20} />
          <Input id="email" type="email" placeholder="Email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-full border-none bg-[#EFEBF5] py-6 pl-12 pr-4 text-gray-800 placeholder:text-gray-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#6A4A98]" />
        </div>
        <div className="relative flex items-center">
          <Lock className="absolute left-4 text-[#6A4A98]" size={20} />
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Senha"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-full border-none bg-[#EFEBF5] py-6 pl-12 pr-12 text-gray-800 placeholder:text-gray-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#6A4A98]"
          />
          <button
            type="button"
            onClick={() => setShowPassword(p => !p)}
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            className="absolute right-4 text-[#6A4A98] transition-colors"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
        <div className="relative flex items-center">
          <Lock className="absolute left-4 text-[#6A4A98]" size={20} />
          <Input
            id="repeat-password"
            type={showRepeatPassword ? "text" : "password"}
            placeholder="Repita a Senha"
            required
            value={repeatPassword}
            onChange={(e) => setRepeatPassword(e.target.value)}
            className="w-full rounded-full border-none bg-[#EFEBF5] py-6 pl-12 pr-12 text-gray-800 placeholder:text-gray-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#6A4A98]"
          />
          <button
            type="button"
            onClick={() => setShowRepeatPassword(p => !p)}
            aria-label={showRepeatPassword ? "Ocultar senha" : "Mostrar senha"}
            className="absolute right-4 text-[#6A4A98] transition-colors"
          >
            {showRepeatPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        {error && <p className="text-center text-sm text-yellow-300">{error}</p>}

        <Button type="submit" className="w-full rounded-full bg-white py-6 text-base font-semibold text-[#6A4A98] hover:bg-gray-200" disabled={isLoading}>
          {isLoading ? "Criando conta..." : "Criar conta"}
        </Button>
      </form>

      <p className="mt-4 text-center text-sm md:hidden">
        Já tem uma conta?{" "}
        <button
          type="button"
          onClick={onToggleView}
          className="font-semibold underline hover:text-gray-200"
        >
          Fazer login
        </button>
      </p>
    </div>
  );
}