import { redirect } from "next/navigation";
import Navbar from "@/components/navbar/navbar";
import { usuarioDaRequisicao } from "@/lib/supabase/server";
import { FormularioTeste } from "./formulario";

export default async function TestePage() {
  const usuario = await usuarioDaRequisicao();
  if (usuario) redirect("/lg2/jornada/index.html");
  return <div className="min-h-screen bg-purple-50"><Navbar showTextLogo />
    <main className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl items-center justify-center p-6">
      <FormularioTeste />
    </main>
  </div>;
}
