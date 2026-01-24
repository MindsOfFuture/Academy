"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/navbar/navbar";
import { type ArticleDetail } from "@/lib/api/articles";
import { ArrowLeft, Calendar, User } from "lucide-react";

async function fetchArticle(slug: string): Promise<ArticleDetail | null> {
  const res = await fetch(`/api/articles/${encodeURIComponent(slug)}`);
  if (!res.ok) return null;
  return res.json();
}

function ArticlePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const slug = searchParams.get("slug");

  const [article, setArticle] = useState<ArticleDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadArticle = async () => {
      if (!slug) {
        setLoading(false);
        return;
      }

      try {
        const data = await fetchArticle(slug);
        setArticle(data);
      } catch (err) {
        console.error("Erro ao buscar artigo:", err);
      } finally {
        setLoading(false);
      }
    };
    loadArticle();
  }, [slug]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar showTextLogo={true} />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-64 bg-gray-200 rounded mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!slug || !article) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar showTextLogo={true} />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Artigo não encontrado
          </h1>
          <p className="text-gray-600 mb-8">
            O artigo que você está procurando não existe ou foi removido.
          </p>
          <Link
            href="/#our-articles"
            className="inline-flex items-center gap-2 text-[#684A97] hover:text-[#5a3f7d] font-semibold"
          >
            <ArrowLeft size={20} />
            Voltar para artigos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar showTextLogo={true} />
      <article className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Botão Voltar */}
        <Link
          href="/#our-articles"
          className="inline-flex items-center gap-2 text-[#684A97] hover:text-[#5a3f7d] font-semibold mb-6"
        >
          <ArrowLeft size={20} />
          Voltar para artigos
        </Link>

        {/* Imagem de capa */}
        {article.coverUrl && (
          <div className="relative w-full h-64 md:h-96 rounded-xl overflow-hidden mb-8">
            <Image
              src={article.coverUrl}
              alt={article.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}

        {/* Cabeçalho */}
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {article.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-gray-600">
            {article.authorName && (
              <div className="flex items-center gap-2">
                <User size={18} />
                <span>{article.authorName}</span>
              </div>
            )}
            {article.publishedAt && (
              <div className="flex items-center gap-2">
                <Calendar size={18} />
                <span>{formatDate(article.publishedAt)}</span>
              </div>
            )}
          </div>
        </header>

        {/* Resumo */}
        {article.excerpt && (
          <p className="text-lg text-gray-700 leading-relaxed mb-8 border-l-4 border-[#684A97] pl-4 italic">
            {article.excerpt}
          </p>
        )}

        {/* Conteúdo */}
        <div className="prose prose-lg max-w-none">
          {article.content ? (
            <div
              className="text-gray-800 leading-relaxed whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />
          ) : (
            <p className="text-gray-600">
              Este artigo ainda não possui conteúdo completo.
            </p>
          )}
        </div>

        {/* Footer do artigo */}
        <footer className="mt-12 pt-8 border-t border-gray-200">
          <Link
            href="/#our-articles"
            className="inline-flex items-center gap-2 text-[#684A97] hover:text-[#5a3f7d] font-semibold"
          >
            <ArrowLeft size={20} />
            Ver mais artigos
          </Link>
        </footer>
      </article>
    </div>
  );
}

export default function ArticlePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50">
          <Navbar showTextLogo={true} />
          <div className="container mx-auto px-4 py-8">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-64 bg-gray-200 rounded mb-4"></div>
            </div>
          </div>
        </div>
      }
    >
      <ArticlePageContent />
    </Suspense>
  );
}
