"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/navbar/navbar";
import { type ArticleDetail } from "@/lib/api/articles";
import { ArrowLeft, Calendar, Clock, Share2, Users, BookOpen, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";

// Extrai metadados do artigo (Authors, Published in, Link) do conteúdo HTML
function extractArticleMetadata(htmlContent: string): {
  cleanedContent: string;
  metadata: {
    authors?: string;
    publishedIn?: string;
    link?: string;
  };
} {
  const metadata: { authors?: string; publishedIn?: string; link?: string } = {};
  let cleanedContent = htmlContent;

  // O conteúdo vem em formato Markdown com **texto**
  // Formato: **Authors:** texto **Published in:** texto **Link:** url

  // Extrai Authors - formato **Authors:** texto
  const authorsMatch = htmlContent.match(/\*\*Authors?:\*\*\s*([^*]+?)(?=\s*\*\*|$)/i);
  if (authorsMatch) {
    metadata.authors = authorsMatch[1].trim();
  }

  // Extrai Published in - formato **Published in:** texto
  const publishedMatch = htmlContent.match(/\*\*Published\s*in:\*\*\s*([^*]+?)(?=\s*\*\*|$)/i);
  if (publishedMatch) {
    metadata.publishedIn = publishedMatch[1].trim();
  }

  // Extrai Link - formato **Link:** url
  const linkMatch = htmlContent.match(/\*\*Link:\*\*\s*(https?:\/\/[^\s<"*]+)/i);
  if (linkMatch) {
    metadata.link = linkMatch[1].trim();
  }

  // Remove a linha/parágrafo que contém os metadados do conteúdo principal
  // Procura pelo padrão completo e remove
  if (metadata.authors || metadata.publishedIn || metadata.link) {
    // Remove o trecho que contém **Authors:** ... **Published in:** ... **Link:** ...
    cleanedContent = cleanedContent.replace(
      /\*\*Authors?:\*\*\s*[^*]+?\s*\*\*Published\s*in:\*\*\s*[^*]+?\s*\*\*Link:\*\*\s*https?:\/\/[^\s<"]+/gi,
      ''
    );
  }

  return { cleanedContent, metadata };
}

// Componente para exibir metadados do artigo de forma elegante
function ArticleMetadataCard({ metadata }: { metadata: { authors?: string; publishedIn?: string; link?: string } }) {
  if (!metadata.authors && !metadata.publishedIn && !metadata.link) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="my-10 p-6 bg-gradient-to-br from-gray-50 to-purple-50/30 border border-gray-200 rounded-2xl shadow-sm"
    >
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-5 flex items-center gap-2">
        <BookOpen size={16} className="text-[#684A97]" />
        Informações da Publicação
      </h3>

      <div className="space-y-4">
        {metadata.authors && (
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#684A97]/10 flex items-center justify-center">
              <Users size={18} className="text-[#684A97]" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Autores</p>
              <p className="text-gray-800 font-medium">{metadata.authors}</p>
            </div>
          </div>
        )}

        {metadata.publishedIn && (
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#684A97]/10 flex items-center justify-center">
              <BookOpen size={18} className="text-[#684A97]" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Publicado em</p>
              <p className="text-gray-800">{metadata.publishedIn}</p>
            </div>
          </div>
        )}

        {metadata.link && (
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#684A97]/10 flex items-center justify-center">
              <ExternalLink size={18} className="text-[#684A97]" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Link Original</p>
              <a
                href={metadata.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[#684A97] hover:text-[#5a3f7d] font-medium transition-colors group"
              >
                <span className="underline underline-offset-2 decoration-[#684A97]/30 group-hover:decoration-[#684A97]">
                  Acessar publicação
                </span>
                <ExternalLink size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </a>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

async function fetchArticle(slug: string): Promise<ArticleDetail | null> {
  const res = await fetch(`/api/articles/${encodeURIComponent(slug)}`);
  if (!res.ok) return null;
  return res.json();
}

function ArticlePageContent() {
  const searchParams = useSearchParams();
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

  // Loading Skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar showTextLogo={true} />
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-12 bg-gray-200 rounded w-3/4"></div>
            <div className="h-96 bg-gray-200 rounded-2xl w-full shadow-lg"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Not Found State
  if (!slug || !article) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar showTextLogo={true} />
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md"
          >
            <h1 className="text-3xl font-bold text-gray-800 mb-4">
              Artigo não encontrado
            </h1>
            <p className="text-gray-600 mb-8">
              O conteúdo que você procura pode ter sido removido ou não está mais disponível.
            </p>
            <Link
              href="/#our-articles"
              className="inline-flex items-center gap-2 bg-[#684A97] text-white px-6 py-3 rounded-full font-medium hover:bg-[#5a3f7d] transition-transform hover:scale-105 shadow-md"
            >
              <ArrowLeft size={18} />
              Voltar para a biblioteca
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar showTextLogo={true} />

      <main className="relative pb-20">
        {/* Floating Back Button - Desktop */}
        <div className="fixed left-8 top-32 z-40 hidden xl:block">
          <Link
            href="/#our-articles"
            className="flex items-center justify-center w-12 h-12 bg-white/80 backdrop-blur-md border border-gray-200 text-gray-600 rounded-full shadow-sm hover:text-[#684A97] hover:border-[#684A97] transition-all duration-300 group"
            title="Voltar"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Hero Section */}
        <div className="relative w-full h-[60vh] min-h-[500px] mb-12">
          {/* Background Image with Gradient */}
          <div className="absolute inset-0 z-0">
            {article.coverUrl ? (
              <Image
                src={article.coverUrl}
                alt={article.title}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#684A97] to-[#2d1b4e]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-10" />
          </div>

          {/* Hero Content */}
          <div className="relative z-20 container mx-auto px-4 h-full flex flex-col justify-end pb-16 max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
            >
              <Link
                href="/#our-articles"
                className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 xl:hidden text-sm font-medium backdrop-blur-sm bg-black/20 px-3 py-1.5 rounded-full w-fit"
              >
                <ArrowLeft size={16} />
                Voltar
              </Link>

              <div className="flex flex-wrap gap-3 mb-6">
                <span className="bg-[#684A97] text-white px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase">
                  Artigo
                </span>
                <span className="bg-white/20 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                  <Clock size={12} /> 5 min de leitura
                </span>
              </div>

              <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                {article.title}
              </h1>

              <div className="flex flex-wrap items-center gap-6 text-white/90">
                {article.authorName && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#684A97] to-purple-400 flex items-center justify-center text-white font-bold border-2 border-white/20">
                      {article.authorName.charAt(0)}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm text-white/60">Escrito por</span>
                      <span className="font-medium">{article.authorName}</span>
                    </div>
                  </div>
                )}

                {article.publishedAt && (
                  <div className="flex items-center gap-2 text-sm md:text-base border-l border-white/20 pl-6 h-10">
                    <Calendar size={18} className="text-purple-300" />
                    <span>{formatDate(article.publishedAt)}</span>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Content Wrapper */}
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-12">

            {/* Main Article Content */}
            <motion.article
              className="prose prose-lg prose-slate max-w-none
                prose-headings:text-gray-900 prose-headings:font-bold 
                prose-p:text-gray-800 prose-p:leading-loose text-lg
                prose-a:text-[#684A97] prose-a:font-medium hover:prose-a:text-[#5a3f7d]
                prose-blockquote:border-l-[#684A97] prose-blockquote:bg-gray-50 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r-lg
                prose-img:rounded-xl prose-img:shadow-lg
                prose-li:text-gray-700"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              {article.excerpt && (
                <div className="text-xl md:text-2xl text-gray-800 font-serif leading-relaxed mb-10 pb-10 border-b border-gray-100 italic">
                  &quot;{article.excerpt}&quot;
                </div>
              )}

              {article.content ? (
                (() => {
                  const { cleanedContent, metadata } = extractArticleMetadata(article.content);
                  return (
                    <>
                      <div dangerouslySetInnerHTML={{ __html: cleanedContent }} />
                      <ArticleMetadataCard metadata={metadata} />
                    </>
                  );
                })()
              ) : (
                <p className="text-gray-500 italic text-center py-20">
                  Conteúdo não disponível.
                </p>
              )}
            </motion.article>

            {/* Sidebar / Share (Optional) */}
            <aside className="hidden md:block w-12 pt-4">
              <div className="sticky top-32 flex flex-col gap-6 items-center">
                <button className="text-gray-400 hover:text-[#684A97] transition-colors" title="Compartilhar">
                  <Share2 size={20} />
                </button>
                <div className="w-px h-12 bg-gray-200"></div>
                {/* Can add more social icons here */}
              </div>
            </aside>
          </div>

          {/* Footer Navigation */}
          <div className="mt-20 pt-10 border-t border-gray-100 flex justify-between items-center">
            <Link
              href="/#our-articles"
              className="group flex items-center gap-3 text-gray-500 hover:text-[#684A97] transition-colors"
            >
              <div className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center group-hover:border-[#684A97] group-hover:bg-[#684A97] group-hover:text-white transition-all">
                <ArrowLeft size={18} />
              </div>
              <div>
                <div className="text-xs text-gray-400 uppercase tracking-wider">Voltar para</div>
                <div className="font-semibold">Nossos Artigos</div>
              </div>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function ArticlePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-[#684A97] border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <ArticlePageContent />
    </Suspense>
  );
}
