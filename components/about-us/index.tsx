'use client'

import Image from 'next/image'
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

export default function AboutUs() {
  return (
    <section className="w-full py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 text-start">
          <h2 className="text-3xl font-bold">Sobre nós</h2>
          <p className="text-sm text-gray-600">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit.
          </p>
        </div>

        <div className="bg-white shadow-[8px_8px_0px_#fef3c7] p-8 rounded-xl flex flex-col lg:flex-row items-center justify-center gap-8">
          <div className="lg:w-1/2 w-full text-justify text-gray-800 font-medium leading-relaxed">
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam in massa a
              dolor vestibulum dictum. Ut quis porttitor nisl. Proin ultrices mi orci, a
              ultricies lectus viverra et. Nam dictum placerat posuere. Vestibulum ante
              ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Ut
              interdum, nisi a blandit iaculis, elit est condimentum libero, vitae
              maximus ex elit lacinia ex.
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
              className="w-[422px] h-[406px] rounded-md"
            >
              {['/minds.jpg', '/lego.jpg', '/scratch.png', '/minds.jpg', '/lego.jpg'].map((src, index) => (
                <SwiperSlide key={index} className="w-[422px] h-[406px]">
                  <Image
                    src={src}
                    alt={`Slide ${index + 1}`}
                    width={422}
                    height={406}
                    className="w-[422px] h-[406px] object-cover rounded-md"
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
