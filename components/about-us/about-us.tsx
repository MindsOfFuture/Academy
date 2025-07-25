'use client'

import Image from 'next/image'
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

interface Slide {
  src: string;
  alt: string;
}

export default function AboutUs({ slides }: { slides: Slide[] }) {
  return (
    <section id='about-us' className="w-full py-12 px-4">
      <div className="flex flex-col items-center">
        <div className="container mx-auto p-8">
          <h2 className="text-3xl font-bold">Sobre Nós</h2>
          <p className="max-w-[480px]">
            Saiba como o Minds prepara os jovens para revolucionar o futuro com tecnologia.
          </p>
        </div>

        <div className="bg-white shadow-[15px_15px_4px_0_rgba(152,152,152,0.2)] max-w-6xl p-8 rounded-xl flex flex-col lg:flex-row items-center justify-center gap-8">
          <div className="lg:w-1/2 w-full text-justify text-gray-800 font-medium leading-relaxed">
            <p>
              Somos um projeto da Universidade Federal de Juiz de Fora (UFJF)
              em parceria com o Governo de Minas Gerais. 
              Atuamos na formação tecnológica de jovens da rede pública, utilizando robótica educacional e programação.
              Nosso objetivo é democratizar o acesso à inovação, desenvolver competências digitais e fomentar o protagonismo
              juvenil em território mineiro.
            </p>
          </div>
          <div className="lg:w-1/2 w-full flex justify-center">
            <Swiper
              loop={true}
              grabCursor={true}
              centeredSlides={true}
              slidesPerView={'auto'}
              pagination={{
                clickable: true,
                renderBullet: (index, className) =>
                  `<span class="${className}" style="background-color: white; border: 1px solid white; width: 14px; height: 14px; border-radius: 50%; display: inline-block; margin: 0 4px;"></span>`,
              }}
              autoplay={{
                delay: 3000,
                disableOnInteraction: false,
              }}
              modules={[Autoplay, Pagination]}
              className="w-full max-w-[422px] h-[406px] rounded-md"
            >
              {slides.map((slide, index) => (
                <SwiperSlide key={index} className="w-full h-full">
                  <Image
                    src={slide.src}
                    alt={slide.alt}
                    width={422}
                    height={406}
                    className="w-full h-full object-cover rounded-md"
                  />
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>
      </div>
    </section>
  )
}