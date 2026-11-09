/** Esboço do conteúdo da gestão: cabeçalho e abas continuam na tela enquanto a aba chega. */
export default function GestaoLoading() {
  return (
    <div aria-busy="true" className="space-y-4">
      <p role="status" className="sr-only">
        Carregando...
      </p>
      <div aria-hidden="true" className="space-y-4">
        <div className="h-8 w-56 rounded-lg bg-gray-200 motion-safe:animate-pulse" />
        <div className="divide-y rounded-lg border bg-white shadow-sm">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="space-y-2 p-4">
              <div className="h-4 w-2/3 rounded bg-gray-200 motion-safe:animate-pulse" />
              <div className="h-3 w-1/3 rounded bg-gray-100 motion-safe:animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
