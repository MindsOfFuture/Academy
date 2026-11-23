import { MODULOS, PRONTOS, caminhoModulo, type TurmaId } from "./turmas";

export default function ModulosTurma({ turma }: { turma: TurmaId }) {
  const prontos = PRONTOS[turma];
  const outra: TurmaId = turma === "a" ? "b" : "a";
  return (
    <ol className="grid gap-3 sm:grid-cols-2" aria-label={`Módulos da Turma ${turma.toUpperCase()}`}>
      {MODULOS.map((m) => {
        // A jornada é uma só (1 → 10): módulo pronto na outra turma também abre, com o caminho da outra turma.
        const daOutra = !prontos.includes(m.numero) && PRONTOS[outra].includes(m.numero);
        const pronto = prontos.includes(m.numero) || daOutra;
        const href = caminhoModulo(daOutra ? outra : turma, m.numero);
        const conteudo = (
          <>
            <span
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg font-bold ${
                pronto ? "bg-[#684A97] text-[#FFD300]" : "bg-[#ECE9F3] text-[#684A97]/50"
              }`}
              aria-hidden="true"
            >
              {m.numero}
            </span>
            <span className="flex-1">
              <span className={`block font-semibold leading-snug ${pronto ? "text-[#3f2d5c]" : "text-[#684A97]/50"}`}>
                Módulo {m.numero} · {m.nome}
              </span>
              <span className={`mt-1 block text-sm ${pronto ? "text-[#684A97]" : "text-[#684A97]/50"}`}>
                {pronto ? (daOutra ? `Abrir o módulo → (feito pela Turma ${outra.toUpperCase()})` : "Abrir o módulo →") : "Em breve"}
              </span>
            </span>
          </>
        );
        return (
          <li key={m.numero}>
            {pronto ? (
              <a
                href={href}
                className="flex items-center gap-4 rounded-2xl border-2 border-[#684A97]/20 bg-white p-4 shadow-sm transition hover:border-[#684A97] hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#684A97]"
              >
                {conteudo}
              </a>
            ) : (
              <div className="flex items-center gap-4 rounded-2xl border-2 border-dashed border-[#684A97]/10 bg-white/60 p-4" aria-disabled="true">
                {conteudo}
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
