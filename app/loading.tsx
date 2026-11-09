/** Esboço da página enquanto ela chega: o formato aparece na hora, sem cobrir a tela. */
export default function Loading() {
    return (
        <div className="min-h-screen bg-gray-100" aria-busy="true">
            <div className="h-[82px] rounded-b-lg bg-[#684A97] shadow-lg" aria-hidden="true" />
            <main className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6 md:p-8">
                <p role="status" className="sr-only">
                    Carregando...
                </p>
                <div aria-hidden="true" className="space-y-6">
                    <div className="h-9 w-64 rounded-lg bg-gray-200 motion-safe:animate-pulse" />
                    <div className="h-5 w-96 max-w-full rounded bg-gray-200 motion-safe:animate-pulse" />
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {[0, 1, 2].map((i) => (
                            <div key={i} className="h-48 rounded-2xl bg-white shadow-sm motion-safe:animate-pulse" />
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}
