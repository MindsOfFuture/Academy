"use client";
import { Hero } from "@/components/hero_1/hero";
import Navbar from "@/components/navbar/navbar";
import { OurCourses } from "@/components/ourCourses/ourCourses";
import { log } from "console";
import { useState, useEffect, useRef } from 'react';
import logo from "@/public/logo.svg";
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
  let cursoPage = {
    title: "Nossos Cursos",
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi hendrerit vulputate risus. Nulla a eros nisi. Donec condimentum.",
    cursos: [
    {
      title: "Curso 1",
      description: "Descrição do curso 1",
      imageUrl: logo
    },
    {
      title: "Curso 2",
      description: "Descrição do curso 2",
      imageUrl: logo
    },
    {
      title: "Curso 3",
      description: "Descrição do curso 3",
      imageUrl: logo
    }
  ]
  }
  return (
    <main>
      <Navbar showTextLogo={!isHeroLogoVisible} />
      <Hero escolas_atendidas={23} alunos_impactados={243} logoRef={heroLogoRef} />
      <OurCourses title={cursoPage.title} description={cursoPage.description} cursos={cursoPage.cursos} />
      <div className="h-[10000px] bg-white"></div>
    </main>
  );
}
