"use client";

import Image from 'next/image';
import Button from '../button/button';
import CountUp from '../counting/couting';
import { createClient } from "@/lib/supabase/client";
import { useState, useEffect } from 'react';

interface HeroProps {
  logoRef: React.Ref<HTMLImageElement>;
}

interface HeroData {
  conteudo: {
    n_escolas: number;
    n_alunos: number;
    subtitulo: string;
  }
}

export function Hero({ logoRef }: HeroProps) {
  const [heroData, setHeroData] = useState<HeroData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getHero() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('hero1')
        .select('*')
        .single();

      if (error) {
        console.error('Erro ao buscar dados do Hero:', error);
      } else {
        setHeroData(data);
      }
      setLoading(false);
    }

    getHero();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col gap-8 items-center mt-[50px] animate-pulse">
        <div className="w-[400px] h-[180px] bg-gray-200 rounded-lg"></div>
        <div className="h-16 w-full bg-gray-200 rounded"></div>
        <div className="h-24 w-80 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 items-center mt-[50px] ">
      <div className='relative p-8 rounded-lg flex flex-col items-center justify-center'>
        <Image className='transition-all duration-300 hover:scale-[1.02]' src="/logo.svg" alt="Hero Image" width={400} height={180} ref={logoRef} />
      </div>
      <h1
        className="text-2xl text-[#767676] font-bold text-center p-1"
        dangerouslySetInnerHTML={{ __html: heroData?.conteudo.subtitulo || '' }}
      />

      <div className='flex text-center gap-6 transition-all duration-300 hover:shadow-lg p-3 rounded-lg'>
        <div className="flex flex-col items-center justify-center gap-0">
          <p className="text-black font-bold text-3xl">
            <CountUp
              from={0}
              to={heroData?.conteudo.n_escolas || 0}
              separator=","
              direction="up"
              duration={0.3}
              className="count-up-text"
            />
          </p>
          <p className="text-lg text-[#767676]">
            Escolas atendidas
          </p>
        </div>
        <div className='border-l-2 border-dotted border-black'></div>
        <div className="flex flex-col items-center justify-center">
          <p className="text-black font-bold text-3xl">
            <CountUp
              from={0}
              to={heroData?.conteudo.n_alunos || 0}
              separator=","
              direction="up"
              duration={0.3}
              className="count-up-text"
            />
          </p>
          <p className="text-lg text-[#767676]">
            Alunos impactados
          </p>
        </div>
      </div>
      <Button Texto="Saiba mais" Link="#about-us" />
    </div>
  );
}