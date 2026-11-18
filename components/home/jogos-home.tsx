import Link from "next/link";
import { Landmark, WalletCards, Briefcase } from "lucide-react";

export const JOGOS = [
  {
    titulo: "Orçamento Familiar do Futuro",
    texto: "Tome 14 decisões sobre a vida que você quer e descubra seu perfil com o dinheiro.",
    href: "/protected/modulos/educacao-financeira/financity",
    Icone: WalletCards,
  },
  {
    titulo: "Cidadania Financeira",
    texto: "Viva quatro papéis da sociedade e veja como suas escolhas mexem no bolso e na cidade.",
    href: "/protected/modulos/educacao-financeira/cidadania-financeira",
    Icone: Landmark,
  },
  {
    titulo: "Empreenda+",
    texto: "Monte o plano do seu pequeno negócio, passo a passo, do sonho ao plano pronto.",
    href: "/protected/modulos/laboratorio-de-gestao",
    Icone: Briefcase,
  },
] as const;

/** Vitrine dos jogos na home, no mesmo visual de "Nossos Cursos". Os links pedem login. */
export default function JogosHome() {
  return (
    <section id="jogos" className="flex flex-col items-center h-auto">
      <div className="container p-8 mx-auto">
        <h2 className="text-3xl font-bold">Nossos Jogos</h2>
        <p className="max-w-[480px]">
          Aprenda jogando sobre dinheiro, cidadania e empreendedorismo!
        </p>
      </div>
      <ul className="flex flex-wrap items-stretch justify-center gap-12 p-6">
        {JOGOS.map(({ titulo, texto, href, Icone }) => (
          <li key={href} className="flex w-full max-w-[300px]">
            <Link
              href={href}
              className="flex flex-col items-start w-full p-5 text-black bg-white rounded-lg shadow-lg transition-transform duration-300 hover:scale-105"
            >
              <Icone className="h-10 w-10 text-[#E8473A]" aria-hidden="true" />
              <h3 className="mt-4 text-xl font-bold">{titulo}</h3>
              <p className="flex-1 mt-2 text-base">{texto}</p>
              <span className="mt-5 px-6 py-3 font-semibold text-white bg-purple-600 rounded-xl shadow-md">
                Jogar
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
