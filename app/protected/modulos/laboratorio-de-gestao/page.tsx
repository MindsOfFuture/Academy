import Link from "next/link";
import ModulePageShell from "@/components/modules/ModulePageShell";
import ModulosTurma from "@/components/modules/laboratorio-gestao/ModulosTurma";
import PrimeiroPasso from "@/components/modules/laboratorio-gestao/PrimeiroPasso";
import { requireModuleUser } from "../require-user";

const PATH = "/protected/modulos/laboratorio-de-gestao";

const ABAS = [
  { id: "a", rotulo: "Turma A" },
  { id: "b", rotulo: "Turma B" },
  { id: "jornada", rotulo: "Jornada completa" },
  { id: "demo", rotulo: "Demonstração" },
] as const;
type Aba = (typeof ABAS)[number]["id"];

export default async function LaboratorioDeGestaoPage({
  searchParams,
}: {
  searchParams: Promise<{ aba?: string }>;
}) {
  const user = await requireModuleUser(PATH);
  const pedida = (await searchParams)?.aba;
  const aba: Aba = ABAS.some((a) => a.id === pedida) ? (pedida as Aba) : "a";

  return (
    <ModulePageShell
      title="Laboratório de Gestão"
      description="Os módulos feitos pelos grupos do Laboratório de Gestão II para apoiar quem está abrindo um pequeno negócio. Escolha a sua turma."
    >
      <nav aria-label="Turmas" className="mb-6 flex flex-wrap gap-2">
        {ABAS.map((a) => (
          <Link
            key={a.id}
            href={`${PATH}?aba=${a.id}`}
            aria-current={a.id === aba ? "page" : undefined}
            className={`rounded-full px-5 py-2 text-sm font-bold transition ${
              a.id === aba
                ? "bg-purple-800 text-white shadow"
                : "border-2 border-purple-200 bg-white text-purple-800 hover:border-purple-700"
            }`}
          >
            {a.rotulo}
          </Link>
        ))}
      </nav>
      {aba === "demo" ? (
        <>
          <h2 className="mb-4 text-xl font-bold text-purple-900">Primeiro Passo</h2>
          <PrimeiroPasso userId={user.id} />
        </>
      ) : aba === "jornada" ? (
        <>
          <h2 className="mb-4 text-xl font-bold text-purple-900">Jornada completa</h2>
          <p className="mb-5 max-w-2xl text-purple-900">
            Todos os módulos, do 1 ao 10, num caminho só. Cada módulo libera quando você chega ao resultado do anterior.
            Os módulos são os mesmos das turmas, então qualquer melhoria feita pelos grupos já aparece aqui.
          </p>
          <a
            href="/lg2/jornada/index.html"
            className="inline-block rounded-full bg-purple-800 px-6 py-3 font-bold text-white shadow transition hover:bg-purple-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-purple-700"
          >
            Começar a jornada
          </a>
        </>
      ) : (
        <>
          <h2 className="mb-4 text-xl font-bold text-purple-900">Módulos da Turma {aba.toUpperCase()}</h2>
          <ModulosTurma turma={aba} />
        </>
      )}
    </ModulePageShell>
  );
}
