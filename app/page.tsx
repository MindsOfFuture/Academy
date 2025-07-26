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
    description: "Nossos cursos",
    cursos: [
      {
        title: "LEGO Education SPIKE",
        description: "Este curso utiliza o kit LEGO® Education SPIKE™ para ensinar programação e robótica de forma divertida. Você monta robôs e programa seus comportamentos usando uma interface intuitiva baseada em blocos, explorando sensores, motores e conceitos como loops e condicionais. Através de desafios, você desenvolve habilidades em lógica e resolução de problemas",
        imageUrl: logo
      },
      {
        title: "Scratch - MIT",
        description: "Este curso faz com que, através de blocos visuais, você crie programas e animações com cenários e objetos, enquanto aprende lógica de programação, incluindo condicionais, repetições e eventos. Com projetos divertidos e interativos, o curso estimula seu raciocínio lógico e a criatividade.",
        imageUrl: logo
      },
      {
        title: "Python",
        description: "Este curso te ensina os fundamentos de Python aplicados à robótica, focando em estruturas condicionais, loops e controle de motores/sensores. Usando kits de montagem, você vai programar comportamentos robóticos como seguir linhas, evitar obstáculos e responder a estímulos enquanto desenvolve pensamento computacional.",
        imageUrl: logo
      },
      {
        title: "3D",
        description: "Este curso ensina você a operar impressoras 3D com confiança, desde a preparação de arquivos e escolha de materiais até a resolução dos problemas mais comuns. Você vai aprender técnicas profissionais de modelagem para impressão, configuração ideal de máquinas e como finalizar peças com qualidade.",
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
