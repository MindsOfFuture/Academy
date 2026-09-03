import Link from "next/link";
import { Landmark, WalletCards } from "lucide-react";
import ModulePageShell from "@/components/modules/ModulePageShell";
import { requireModuleUser } from "../require-user";

const PATH = "/protected/modulos/educacao-financeira";

export default async function EducacaoFinanceiraPage() {
  await requireModuleUser(PATH);
  const jogos = [
    {
      title: "Orçamento Familiar do Futuro",
      description: "Responda 14 decisões sobre a vida que deseja construir e descubra seu perfil financeiro.",
      details: "Orçamento pessoal, despesas, reserva e diagnóstico",
      href: `${PATH}/financity`,
      icon: WalletCards,
    },
    {
      title: "Cidadania Financeira",
      description: "Assuma quatro papéis da sociedade e avalie decisões que conectam o bolso ao orçamento público.",
      details: "4 papéis · 100 cenários reais",
      href: `${PATH}/cidadania-financeira`,
      icon: Landmark,
    },
  ];

  return (
    <ModulePageShell title="Educação Financeira" description="Aprenda tomando decisões: do orçamento familiar à gestão do país.">
      <section className="grid gap-5 md:grid-cols-2" aria-label="Jogos de Educação Financeira">
        {jogos.map(({ title, description, details, href, icon: Icon }) => (
          <article key={href} className="flex min-w-0 flex-col rounded-3xl border border-purple-100 bg-white p-6 shadow-sm">
            <Icon className="h-9 w-9 text-coral-500 text-[#E8473A]" aria-hidden="true" />
            <h2 className="mt-4 text-2xl font-bold text-purple-900">{title}</h2>
            <p className="mt-2 flex-1 text-gray-600">{description}</p>
            <p className="mt-4 text-sm font-semibold text-purple-700">{details}</p>
            <Link className="mt-5 inline-flex justify-center rounded-xl bg-amber-300 px-5 py-3 font-bold text-purple-950 hover:bg-amber-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-600" href={href}>
              Abrir o jogo
            </Link>
          </article>
        ))}
      </section>
    </ModulePageShell>
  );
}
