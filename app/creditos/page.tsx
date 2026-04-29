import Navbar from "@/components/navbar/navbar";
import Footer from "@/components/footer/footer";
import { getFooter } from "@/lib/api/content";
import {
  CREDIT_CATEGORY_ORDER,
  getCredits,
  type CreditCategory,
  type CreditEntry,
} from "@/lib/api/credits";

const SECTION_TITLES: Record<CreditCategory, string> = {
  bolsistas: "Bolsistas",
  bolsistas_projetistas: "Bolsistas projetistas",
  coordenacao: "Coordenação",
  instituicoes: "Instituições",
  agradecimentos_especiais: "Agradecimentos especiais",
};

function sortCredits(items: CreditEntry[]): CreditEntry[] {
  return items.slice().sort((a, b) => {
    const categoryA = CREDIT_CATEGORY_ORDER.indexOf(a.category);
    const categoryB = CREDIT_CATEGORY_ORDER.indexOf(b.category);

    if (categoryA !== categoryB) {
      return categoryA - categoryB;
    }

    const orderA = a.sort_order ?? 0;
    const orderB = b.sort_order ?? 0;
    return orderA - orderB;
  });
}

export default async function CreditosPage() {
  const [credits, footer] = await Promise.all([getCredits(), getFooter()]);
  const orderedCredits = sortCredits(credits);
  const sections = CREDIT_CATEGORY_ORDER.map((category) => ({
    category,
    title: SECTION_TITLES[category],
    items: orderedCredits.filter((item) => item.category === category),
  }));

  const hasCredits = sections.some((section) => section.items.length > 0);

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-gray-900">
      <Navbar showTextLogo={true} />
      <main className="container mx-auto max-w-5xl px-4 py-10 md:py-14">
        <header className="mb-10 space-y-3">
          <h1 className="text-3xl md:text-4xl font-bold text-[#6A4A98]">Créditos</h1>
          <p className="text-gray-700 leading-relaxed">
            Conheça as pessoas, instituições e apoios que tornam a plataforma possível.
          </p>
        </header>

        {!hasCredits && (
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-gray-700">Conteúdo em atualização.</p>
          </div>
        )}

        <div className="space-y-10">
          {sections.map((section) => (
            <section key={section.category} className="space-y-4">
              <h2 className="text-2xl font-semibold text-gray-800">{section.title}</h2>
              {section.items.length === 0 ? (
                <p className="text-gray-600">Sem informações cadastradas.</p>
              ) : (
                <ul className="grid gap-4 md:grid-cols-2">
                  {section.items.map((item) => (
                    <li key={item.id} className="rounded-xl bg-white p-5 shadow-sm">
                      <p className="text-lg font-semibold text-gray-900">{item.name}</p>
                      {item.area && <p className="text-sm text-gray-600">{item.area}</p>}
                      {item.description && (
                        <p className="mt-3 text-sm leading-relaxed text-gray-700">
                          {item.description}
                        </p>
                      )}
                      {item.link && (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 inline-flex text-sm font-medium text-[#6A4A98] hover:underline"
                        >
                          Acessar link
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      </main>
      <Footer socials={footer} />
    </div>
  );
}
