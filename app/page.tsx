import { getAboutUs, getHero, getNossosCursos } from "@/components/api/indexApi";
import HomeClient from "@/components/HomeClient/homeClient";

export default async function Home() {
  const heroData = await getHero();
  const cursos = await getNossosCursos();
  const aboutus = await getAboutUs();

  const socialLinks = [
    {
      href: "https://www.instagram.com/Mindsofthefuture.ufjf",
      iconSrc: "/instagram-svgrepo-com.svg",
      alt: "Ícone do Instagram",
      nome: "MindsOfTheFuture.ufjf"
    },
  ];

  return (
    <HomeClient
      heroData={heroData}
      nossosCursosData={cursos}
      aboutUsSlides={aboutus?.aboutUsSlides ?? []} 
      socialLinks={socialLinks}
    />
  );
}
