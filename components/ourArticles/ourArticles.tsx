'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Swiper, SwiperSlide } from "swiper/react"
import { Autoplay, Pagination, Navigation } from "swiper/modules"
import { motion } from 'framer-motion'
import "swiper/css"
import "swiper/css/navigation"
import "swiper/css/pagination"
import { type ArticleSummary } from "@/lib/api/types"

interface OurArticlesProps {
  articles: ArticleSummary[];
}

export default function OurArticles({ articles }: OurArticlesProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <section id="our-articles" className="w-full py-12 px-4">
      <div className="flex flex-col items-center">
        <div className="container mx-auto p-8">
          <h2 className="text-3xl font-bold">Nossos Artigos</h2>
          <p className="max-w-[480px]">
            Confira os últimos artigos e descobertas do nosso projeto educacional
          </p>
        </div>

        <div className="w-full max-w-[1400px] px-4 sm:px-8 lg:px-16 relative">
          <Swiper
            spaceBetween={20}
            slidesPerView={1}
            breakpoints={{
              640: {
                slidesPerView: 2,
              },
              1024: {
                slidesPerView: 3,
              },
            }}
            loop={articles.length > 3}
            autoplay={{
              delay: 4000,
              disableOnInteraction: false,
            }}
            pagination={{
              clickable: true,
            }}
            navigation={true}
            modules={[Autoplay, Pagination, Navigation]}
            className="w-full pb-16 !static"
          >
            {articles.map((article, index) => (
              <SwiperSlide key={article.id}>
                <div className="p-2 sm:p-4">
                  <motion.div
                    className="bg-white shadow-[15px_15px_4px_0_rgba(152,152,152,0.2)] rounded-xl overflow-hidden h-[450px] flex flex-col"
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    whileHover={{
                      scale: 1.02,
                      transition: { duration: 0.3 }
                    }}
                  >
                    <div className="relative h-48 overflow-hidden">
                      <Image
                        src={article.coverUrl || "/logo_navbar.svg"}
                        alt={article.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover"
                      />
                    </div>

                    <div className="p-6 flex-1 flex flex-col">
                      <div className="flex items-center text-sm text-gray-600 mb-3">
                        <span>{article.authorId || "Equipe"}</span>
                        <span className="mx-2">•</span>
                        <span>{article.publishedAt ? formatDate(article.publishedAt) : ""}</span>
                        <span className="mx-2">•</span>
                        <span>leitura rápida</span>
                      </div>

                      <h3 className="text-xl font-bold text-gray-800 mb-3 overflow-hidden text-ellipsis line-clamp-2">
                        {article.title}
                      </h3>

                      <p className="text-gray-600 text-sm leading-relaxed flex-1 overflow-hidden text-ellipsis line-clamp-3">
                        {article.excerpt || ""}
                      </p>

                      <Link
                        href={`/artigos?slug=${article.slug || article.id}`}
                        className="mt-4 text-[#684A97] font-semibold hover:text-[#5a3f7d] transition-colors duration-200 self-start relative z-10 cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Ler mais →
                      </Link>
                    </div>
                  </motion.div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
          
          <style jsx global>{`
            #our-articles .swiper-button-next,
            #our-articles .swiper-button-prev {
              color: #684A97 !important;
              background: transparent !important;
              box-shadow: none !important;
              transition: all 0.2s;
            }
            @media (max-width: 1024px) {
              #our-articles .swiper-button-next,
              #our-articles .swiper-button-prev {
                display: none !important;
              }
            }
            #our-articles .swiper-button-next:after,
            #our-articles .swiper-button-prev:after {
              font-size: 32px !important;
              font-weight: bold;
            }
            #our-articles .swiper-button-next:hover,
            #our-articles .swiper-button-prev:hover {
              color: #5a3f7d !important;
              transform: scale(1.1);
            }
            #our-articles .swiper-button-prev {
              left: 0px !important;
            }
            #our-articles .swiper-button-next {
              right: 0px !important;
            }
            #our-articles .swiper-pagination-bullet {
              background: #684A97 !important;
              opacity: 0.3;
            }
            #our-articles .swiper-pagination-bullet-active {
              opacity: 1 !important;
              width: 24px;
              border-radius: 4px;
            }
            #our-articles .swiper-pagination {
              bottom: -25px !important;
              left: 0 !important;
              width: 100% !important;
              text-align: center !important;
            }
          `}</style>
        </div>
      </div>
    </section>
  )
}
