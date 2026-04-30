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
