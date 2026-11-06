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
                pronto ? "bg-purple-800 text-amber-300" : "bg-purple-100 text-purple-400"
              }`}
              aria-hidden="true"
            >
              {m.numero}
            </span>
            <span className="flex-1">
              <span className={`block font-semibold leading-snug ${pronto ? "text-purple-900" : "text-purple-400"}`}>
                Módulo {m.numero} · {m.nome}
              </span>
              <span className={`mt-1 block text-sm ${pronto ? "text-purple-700" : "text-purple-400"}`}>
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
                className="flex items-center gap-4 rounded-2xl border-2 border-purple-200 bg-white p-4 shadow-sm transition hover:border-purple-700 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-purple-700"
              >
                {conteudo}
              </a>
            ) : (
              <div className="flex items-center gap-4 rounded-2xl border-2 border-dashed border-purple-100 bg-white/60 p-4" aria-disabled="true">
                {conteudo}
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
