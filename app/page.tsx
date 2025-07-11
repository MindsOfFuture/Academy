"use client";
import { Hero } from "@/components/hero_1/hero";
import Navbar from "@/components/navbar/navbar";
import { useState, useEffect, useRef } from 'react';

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

  return (
    <main>
      <Navbar showTextLogo={!isHeroLogoVisible} />
      <Hero escolas_atendidas={23} alunos_impactados={243} logoRef={heroLogoRef} />
      <div className="h-[10000px] bg-white"></div>
    </main>
  );
}
