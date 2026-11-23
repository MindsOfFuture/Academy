import { BOTAO_PRIMARIO } from "@/components/ui/botoes";
import { cn } from "@/lib/utils";
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
          <article key={href} className="flex min-w-0 flex-col rounded-3xl border border-[#684A97]/30 bg-white p-6 shadow-sm">
            <Icon className="h-9 w-9 text-coral-500 text-[#E8473A]" aria-hidden="true" />
            <h2 className="mt-4 text-2xl font-bold text-[#684A97]">{title}</h2>
            <p className="mt-2 flex-1 text-gray-600">{description}</p>
            <p className="mt-4 text-sm font-semibold text-[#684A97]">{details}</p>
            <Link className={cn(BOTAO_PRIMARIO, "mt-5")} href={href}>
              Abrir o jogo
            </Link>
          </article>
        ))}
      </section>
    </ModulePageShell>
  );
}
