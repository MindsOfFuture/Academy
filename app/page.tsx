"use client";
import { Hero } from "@/components/hero_1/hero";
import Navbar from "@/components/navbar/navbar";
import { OurCourses } from "@/components/ourCourses/ourCourses";
import { useState, useEffect, useRef } from 'react';
import logo from "@/public/logo.svg";
import Footer from "@/components/footer/footer";
import AboutUs from "@/components/about-us/about-us";
import BlurryBackground from "@/components/BlurryBackground/BlurryBackground";
export default function Home() {

  const [isHeroLogoVisible, setIsHeroLogoVisible] = useState(true);

  const heroLogoRef = useRef<HTMLImageElement>(null);

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
  const cursoPage = {
    title: "Nossos Cursos",
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi hendrerit vulputate risus. Nulla a eros nisi. Donec condimentum.",
    cursos: [
      {
        title: "LEGO Education SPIKE",
        description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit ",
        imageUrl: logo
      },
      {
        title: "Scratch - MIT",
        description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit ",
        imageUrl: logo
      },
      {
        title: "Python",
        description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit ",
        imageUrl: logo
      },
      {
        title: "3D",
        description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit ",
        imageUrl: logo
      }
    ]
  }
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
      <Hero escolas_atendidas={23} alunos_impactados={243} logoRef={heroLogoRef} />
      <BlurryBackground
        color2="rgba(104, 74, 151, 0.6)"
        color1="rgba(255, 211, 0, 0.4)"
        speed={12}
      >
        <OurCourses
          title={cursoPage.title}
          description={cursoPage.description}
          cursos={cursoPage.cursos}
        />
        <AboutUs slides={aboutUsSlides} />
      </BlurryBackground>
      <Footer socials={socialLinks} />

    </main >
  );
}
