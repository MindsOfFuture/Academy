import Navbar from "@/components/navbar/navbar";
import { abasDoPapel } from "./abas";
import { exigirMembro } from "./guard";
import { NavGestao } from "./nav";

export default async function GestaoLayout({ children }: { children: React.ReactNode }) {
  const papel = await exigirMembro("/gestao");

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar showTextLogo={true} />
      <div className="flex justify-center p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-5xl space-y-6">
          <header className="space-y-1">
            <h1 className="text-3xl font-bold">Gestão do projeto</h1>
            <p className="text-muted-foreground">
              {papel === "coordenacao" ? "Área da coordenação" : "Área do bolsista"}
            </p>
          </header>
          <NavGestao abas={abasDoPapel(papel)} />
          {children}
        </div>
      </div>
    </div>
  );
}
