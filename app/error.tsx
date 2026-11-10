"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-100 p-6 text-center">
      <h1 className="text-2xl font-bold text-[#684A97]">Algo deu errado.</h1>
      <div className="flex gap-4">
        <button type="button" onClick={reset} className="rounded-full bg-[#684A97] px-6 py-2 font-semibold text-white hover:bg-[#5a3e85]">
          Tentar novamente
        </button>
        <Link href="/" className="rounded-full px-6 py-2 font-semibold text-[#684A97] hover:underline">
          Voltar ao início
        </Link>
      </div>
    </main>
  );
}
