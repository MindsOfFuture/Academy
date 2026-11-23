import Link from "next/link";
import ModulePageShell from "@/components/modules/ModulePageShell";
import ModulosTurma from "@/components/modules/laboratorio-gestao/ModulosTurma";
import { requireModuleUser } from "../require-user";

const PATH = "/protected/modulos/laboratorio-de-gestao";

const ABAS = [
  { id: "a", rotulo: "Turma A" },
  { id: "b", rotulo: "Turma B" },
  { id: "jornada", rotulo: "Jornada completa" },
] as const;
type Aba = (typeof ABAS)[number]["id"];

export default async function LaboratorioDeGestaoPage({
  searchParams,
}: {
  searchParams: Promise<{ aba?: string }>;
}) {
  await requireModuleUser(PATH);
  const pedida = (await searchParams)?.aba;
  const aba: Aba = ABAS.some((a) => a.id === pedida) ? (pedida as Aba) : "a";

  return (
    <ModulePageShell
      title="Empreenda+"
      description="O Empreenda+ reúne os módulos feitos pelos estudantes do Laboratório de Gestão II para apoiar quem está abrindo um pequeno negócio. Escolha a sua turma."
    >
      <nav aria-label="Turmas" className="mb-6 flex flex-wrap gap-2">
        {ABAS.map((a) => (
          <Link
            key={a.id}
            href={`${PATH}?aba=${a.id}`}
            aria-current={a.id === aba ? "page" : undefined}
            className={`rounded-full px-5 py-2 text-sm font-bold transition ${
              a.id === aba
                ? "bg-[#684A97] text-white shadow"
                : "border-2 border-[#684A97]/20 bg-white text-[#684A97] hover:border-[#684A97]"
            }`}
          >
            {a.rotulo}
          </Link>
        ))}
      </nav>
      {aba === "jornada" ? (
        <>
          <h2 className="mb-4 text-xl font-bold text-[#3f2d5c]">Jornada completa</h2>
          <p className="mb-5 max-w-2xl text-[#3f2d5c]">
            Todos os módulos, do 1 ao 10, num caminho só. No fim, você vê o diagnóstico final com todas as suas respostas.
            Os módulos são os mesmos das turmas, então qualquer melhoria feita pelos grupos já aparece aqui.
          </p>
          <a
            href="/lg2/jornada/index.html"
            className="inline-block rounded-full bg-[#684A97] px-6 py-3 font-bold text-white shadow transition hover:bg-[#553d7a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#684A97]"
          >
            Começar a jornada
          </a>
        </>
      ) : (
        <>
          <h2 className="mb-4 text-xl font-bold text-[#3f2d5c]">Módulos da Turma {aba.toUpperCase()}</h2>
          <ModulosTurma turma={aba} />
        </>
      )}
    </ModulePageShell>
  );
}
