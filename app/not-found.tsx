import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-100 p-6 text-center">
      <h1 className="text-2xl font-bold text-[#684A97]">Página não encontrada.</h1>
      <Link href="/" className="rounded-full bg-[#684A97] px-6 py-2 font-semibold text-white hover:bg-[#5a3e85]">
        Voltar ao início
      </Link>
    </main>
  );
}
