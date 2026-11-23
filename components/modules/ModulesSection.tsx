import Link from "next/link";
import { BarChart3, BriefcaseBusiness, ArrowRight } from "lucide-react";

export const MODULOS_ESPECIAIS = [
  {
    title: "Educação Financeira",
    description: "Jogos para praticar orçamento, consumo consciente e decisões públicas.",
    href: "/protected/modulos/educacao-financeira",
    icon: BarChart3,
    accent: "bg-[#ECE9F3] text-[#684A97]",
  },
  {
    title: "Empreenda+",
    description: "Transforme uma ideia de pequeno negócio em um plano de primeiros passos.",
    href: "/protected/modulos/laboratorio-de-gestao",
    icon: BriefcaseBusiness,
    accent: "bg-[#FDCF60]/30 text-[#684A97]",
  },
] as const;

export default function ModulesSection() {
  return (
    <section id="atividades" aria-labelledby="modulos-title" className="scroll-mt-28 space-y-4">
      <div>
        <h2 id="modulos-title" className="text-xl font-semibold">Atividades</h2>
        <p className="mt-1 max-w-2xl text-gray-600">
          Experiências práticas disponíveis para toda a comunidade do Academy.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {MODULOS_ESPECIAIS.map(({ title, description, href, icon: Icon, accent }) => (
          <Link
            key={href}
            href={href}
            className="group flex min-w-0 items-start gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#684A97]/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#684A97]"
            aria-label={`${title}: abrir módulo`}
          >
            <span className={`rounded-xl p-3 ${accent}`} aria-hidden="true">
              <Icon className="h-6 w-6" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-lg font-bold text-gray-900">{title}</span>
              <span className="mt-1 block text-sm leading-relaxed text-gray-600">{description}</span>
            </span>
            <ArrowRight className="mt-1 h-5 w-5 shrink-0 text-[#684A97] transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </Link>
        ))}
      </div>
    </section>
  );
}
