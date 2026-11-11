'use client'

import Link from 'next/link'
import { Swiper, SwiperSlide } from "swiper/react"
import { Autoplay, Pagination, Navigation } from "swiper/modules"
import ArticleCard from './articleCard'
import "swiper/css"
import "swiper/css/navigation"
import "swiper/css/pagination"
import { type ArticleSummary } from "@/lib/api/types"

interface OurArticlesProps {
  articles: ArticleSummary[];
}

export default function OurArticles({ articles }: OurArticlesProps) {
  return (
    <section id="our-articles" className="w-full py-12 px-4">
      <div className="flex flex-col items-center">
        <div className="container mx-auto p-8">
          <h2 className="text-3xl font-bold">Nossos Artigos</h2>
          <p className="max-w-[480px]">
            Confira os últimos artigos e descobertas do nosso projeto educacional
          </p>
          <Link
            href="/artigos"
            className="mt-4 inline-flex items-center rounded-full bg-[#684A97] px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#5a3f7d]"
          >
            Ver todos os artigos
          </Link>
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
                  <ArticleCard article={article} index={index} />
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
              font-size: 24px !important;
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
