"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="pt-BR">
      <body>
        <main style={{ display: "flex", minHeight: "100vh", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
          <h1>Algo deu errado.</h1>
          <button type="button" onClick={reset}>Tentar novamente</button>
        </main>
      </body>
    </html>
  );
}
