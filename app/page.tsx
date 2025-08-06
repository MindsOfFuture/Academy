import { getHero, getNossosCursos } from "@/components/api/indexApi";
import HomeClient from "@/components/HomeClient/homeClient";

export default async function Home() {
  const heroData = await getHero();
  const cursos = await getNossosCursos();

  const aboutUsSlides = [
    { src: '/minds.jpg', alt: 'Imagem de um robô Mindstorms' },
    { src: '/lego.jpg', alt: 'Peças de Lego coloridas' },
    { src: '/scratch.png', alt: 'Logo do Scratch' },
    { src: '/minds.jpg', alt: 'Outra imagem de um robô Mindstorms' },
    { src: '/lego.jpg', alt: 'Outra imagem de peças de Lego' }
  ];

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
      aboutUsSlides={aboutUsSlides}
      socialLinks={socialLinks}
    />
  );
}