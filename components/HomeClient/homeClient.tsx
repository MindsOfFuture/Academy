"use client";

import { useState, useEffect, useRef } from "react";
import Navbar from "@/components/navbar/navbar";
import { Hero } from "@/components/hero_1/hero";
import { OurCourses } from "@/components/ourCourses/ourCourses";
import Footer from "@/components/footer/footer";
import AboutUs from "@/components/about-us/about-us";
import OurArticles from "@/components/ourArticles/ourArticles";
import BlurryBackground from "@/components/BlurryBackground/BlurryBackground";
import Aurora from "@/components/aurora/aurora";
import { type CourseSummary, type ArticleSummary } from "@/lib/api/types";
import { type HeroData, type AboutUsSlide, type FooterLink } from "@/lib/api/content";

interface HomeClientProps {
    heroData: HeroData | null;
    courses: CourseSummary[];
    aboutUsSlides: AboutUsSlide[];
    socialLinks: FooterLink[];
    articlesData: ArticleSummary[];
}

export default function HomeClient({ heroData, courses, aboutUsSlides, socialLinks, articlesData }: HomeClientProps) {
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
            <Hero
                escolas_atendidas={heroData?.n_escolas ?? 0}
                alunos_impactados={heroData?.n_alunos ?? 0}
                subtitulo={heroData?.subtitulo ?? ""}
                logoRef={heroLogoRef}
            />
            <Aurora
                colorStops={["#684A97", "#FFD300", "#684A97"]}
                blend={1.0}
                amplitude={0.3}
                speed={1}
            />
            <BlurryBackground
                color2="rgba(104, 74, 151, 0.6)"
                color1="rgba(255, 211, 0, 0.4)"
                speed={12}
            >
                <OurCourses cursos={courses} />
                <AboutUs slides={aboutUsSlides} />
                <OurArticles articles={articlesData} />
            </BlurryBackground>
            <Footer socials={socialLinks} />
        </main>
    );
}