import HomeClient from "@/components/HomeClient/homeClient";
import { getAboutUs, getFooter, getHero, listarCursosDaHome } from "@/lib/api/content";
import { getArticles } from "@/lib/api/articles";

// A home é igual para todos (só dado público, lido sem login): fica pronta e se
// refaz no máximo a cada minuto. Nada aqui pode ler cookie ou sessão.
export const revalidate = 60;

export default async function Home() {
  const [heroData, cursos, aboutus, footer, articles] = await Promise.all([
    getHero(),
    listarCursosDaHome(),
    getAboutUs(),
    getFooter(),
    getArticles(),
  ]);

  const limitedCourses = cursos.slice(0, 5);

  return (
    <HomeClient
      heroData={heroData}
      courses={limitedCourses}
      aboutUsSlides={aboutus?.aboutUsSlides ?? []}
      socialLinks={footer}
      articlesData={articles}
    />
  );
}
