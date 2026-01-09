import HomeClient from "@/components/HomeClient/homeClient";
import { getAboutUs, getFooter, getHero } from "@/lib/api/content";
import { listCoursesServer } from "@/lib/api/courses-server";
import { getArticles } from "@/lib/api/articles";

export default async function Home() {
  const [heroData, cursos, aboutus, footer, articles] = await Promise.all([
    getHero(),
    listCoursesServer(),
    getAboutUs(),
    getFooter(),
    getArticles(),
  ]);

  return (
    <HomeClient
      heroData={heroData}
      courses={cursos}
      aboutUsSlides={aboutus?.aboutUsSlides ?? []}
      socialLinks={footer}
      articlesData={articles}
    />
  );
}
