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
        </div>

        <div className="bg-white shadow-[15px_15px_4px_0_rgba(152,152,152,0.2)] max-w-6xl p-8 rounded-xl flex flex-col lg:flex-row items-center justify-center gap-8">
          <div className="lg:w-1/2 w-full text-justify text-gray-800 font-medium leading-relaxed text-sm">
            <p className="mb-4">
              O <strong>Minds of the Future</strong> é um projeto da <strong>Universidade Federal de Juiz de Fora (UFJF)</strong> em parceria com o <strong>Governo do Estado de Minas Gerais</strong>. Nosso objetivo principal é complementar a formação de professores e alunos da rede pública de ensino de Juiz de Fora, atuando do 9º ano do ensino fundamental ao 3º ano do ensino médio.
            </p>

            <p className="mb-4">
              Para democratizar o acesso à inovação e fomentar o protagonismo juvenil, contamos com a instalação de <strong>espaços co-criativos (salas maker)</strong> distribuídos em três Unidades Acadêmicas da UFJF. Nesses ambientes, promovemos encontros voltados à formação tecnológica, utilizando a <strong>abordagem STEAM</strong> e os <strong>Kits Lego® Education</strong>.
            </p>

            <p>
              Nosso foco vai além da tecnologia: o projeto visa desenvolver e aperfeiçoar as práticas de ensino, estimulando ativamente o <strong>comportamento empreendedor e inovador</strong>. Trabalhamos para desenvolver o <strong>pensamento crítico e computacional</strong> dos participantes, capacitando-os não apenas com competências digitais, mas também com habilidades práticas na busca por <strong>soluções reais de problemas</strong> em nosso território mineiro.
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