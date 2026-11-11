'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { type ArticleSummary } from "@/lib/api/types"

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC'
  });
};

export default function ArticleCard({ article, index = 0 }: { article: ArticleSummary; index?: number }) {
  return (
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
  )
}
