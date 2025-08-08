import { getAboutUs, getFooter, getHero, getNossosCursos } from "@/components/api/indexApi";
import HomeClient from "@/components/HomeClient/homeClient";

export default async function Home() {
  const heroData = await getHero();
  const cursos = await getNossosCursos();
  const aboutus = await getAboutUs();
  const footer = await getFooter();

  return (
    <HomeClient
      heroData={heroData}
      nossosCursosData={cursos}
      aboutUsSlides={aboutus?.aboutUsSlides ?? []}
      socialLinks={footer} 
    />
  );
}
