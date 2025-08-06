"use client";
import { useState, useEffect, useRef } from 'react';
import { getHero, getNossosCursos, HeroProps, CourseProps } from "@/components/api/indexApi";
import Navbar from "@/components/navbar/navbar";
import { Hero } from "@/components/hero_1/hero";
import { OurCourses } from "@/components/ourCourses/ourCourses";
import Footer from "@/components/footer/footer";
import AboutUs from "@/components/about-us/about-us";
import BlurryBackground from "@/components/BlurryBackground/BlurryBackground";

export default function Home() {
  const [heroData, setHeroData] = useState<HeroProps | null>(null);
  const [nossosCursosData, setNossosCursosData] = useState<CourseProps[]>([]);

  const [isHeroLogoVisible, setIsHeroLogoVisible] = useState(true);
  const heroLogoRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      const hero = await getHero();
      const cursos = await getNossosCursos();
      setHeroData(hero);
      setNossosCursosData(cursos);
    };
    fetchData();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsHeroLogoVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    const currentLogo = heroLogoRef.current;
    if (currentLogo) {
      observer.observe(currentLogo);
    }
    return () => {
      if (currentLogo) {
        observer.unobserve(currentLogo);
      }
    };
  }, []);

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
    <main>
      <Navbar showTextLogo={!isHeroLogoVisible} />
      <Hero
        escolas_atendidas={heroData?.n_escolas ?? 0}
        alunos_impactados={heroData?.n_alunos ?? 0}
        subtitulo={heroData?.subtitulo ?? ""}
        logoRef={heroLogoRef}
      />
      <BlurryBackground
        color2="rgba(104, 74, 151, 0.6)"
        color1="rgba(255, 211, 0, 0.4)"
        speed={12}
      >
        <OurCourses
          cursos={nossosCursosData}
        />
        <AboutUs slides={aboutUsSlides} />
      </BlurryBackground>
      <Footer socials={socialLinks} />
    </main>
  );
}