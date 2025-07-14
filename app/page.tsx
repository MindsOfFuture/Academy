"use client";
import { Hero } from "@/components/hero_1/hero";
import Navbar from "@/components/navbar/navbar";
import { OurCourses } from "@/components/ourCourses/ourCourses";
import { log } from "console";
import { useState, useEffect, useRef } from 'react';
import logo from "@/public/logo.svg";
import AboutUs from "@/components/about-us";
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
  return (
    <main>
      <Navbar showTextLogo={!isHeroLogoVisible} />
      <Hero escolas_atendidas={23} alunos_impactados={243} logoRef={heroLogoRef} />
      <OurCourses title={cursoPage.title} description={cursoPage.description} cursos={cursoPage.cursos} />
      <AboutUs />
 
    </main>
  );
}
