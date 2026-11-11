import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/navbar/navbar";
import Footer from "@/components/footer/footer";
import ArticleCard from "@/components/ourArticles/articleCard";
import { getArticles, getArticleBySlug, getArticleById } from "@/lib/api/articles";
import type { ArticleSummary } from "@/lib/api/types";
import { ArrowLeft, Calendar, Clock, Share2, Users, BookOpen, ExternalLink, Fingerprint, Tags } from "lucide-react";
import { sanitizeRichText } from "@/lib/sanitize";
import { separarMetadados, type MetadadosArtigo } from "@/lib/utils/artigo-metadados";

// Componente para exibir metadados do artigo de forma elegante
function ArticleMetadataCard({ metadata }: { metadata: MetadadosArtigo }) {
  const link = metadata.link && /^https?:\/\//i.test(metadata.link) ? metadata.link : undefined;
  const doiHref = metadata.doi && (/^https?:\/\//i.test(metadata.doi) ? metadata.doi : `https://doi.org/${metadata.doi}`);
  if (!metadata.autores && !metadata.publicadoEm && !metadata.doi && !metadata.palavrasChave && !link) {
    return null;
  }

  return (
    <div
      className="motion-safe:animate-artigo-meta my-10 p-6 bg-gradient-to-br from-gray-50 to-purple-50/30 border border-gray-200 rounded-2xl shadow-sm"
    >
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-5 flex items-center gap-2">
        <BookOpen size={16} className="text-[#684A97]" />
        Informações da Publicação
      </h3>

      <div className="space-y-4">
        {metadata.autores && (
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#684A97]/10 flex items-center justify-center">
              <Users size={18} className="text-[#684A97]" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Autores</p>
              <p className="text-gray-800 font-medium">{metadata.autores}</p>
            </div>
          </div>
        )}

        {metadata.publicadoEm && (
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#684A97]/10 flex items-center justify-center">
              <BookOpen size={18} className="text-[#684A97]" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Publicado em</p>
              <p className="text-gray-800">{metadata.publicadoEm}</p>
            </div>
          </div>
        )}

        {metadata.doi && (
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#684A97]/10 flex items-center justify-center">
              <Fingerprint size={18} className="text-[#684A97]" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">DOI</p>
              <a
                href={doiHref}
                target="_blank"
                rel="noopener noreferrer"
                className="break-all text-[#684A97] hover:text-[#5a3f7d] underline underline-offset-2 decoration-[#684A97]/30 hover:decoration-[#684A97]"
              >
                {metadata.doi}
              </a>
            </div>
          </div>
        )}

        {metadata.palavrasChave && (
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#684A97]/10 flex items-center justify-center">
              <Tags size={18} className="text-[#684A97]" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Palavras-chave</p>
              <p className="text-gray-800">{metadata.palavrasChave}</p>
            </div>
          </div>
        )}

        {link && (
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#684A97]/10 flex items-center justify-center">
              <ExternalLink size={18} className="text-[#684A97]" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Link Original</p>
              <a
                href={link}
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
    </div>
  );
}

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    // Formatada no servidor (UTC): sem o fuso, artigo da noite sairia com a data do dia seguinte.
    timeZone: "America/Sao_Paulo",
  });

function ListaDeArtigos({ articles }: { articles: ArticleSummary[] }) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar showTextLogo={true} />

      <header className="w-full max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-16 mt-8">
        <div className="rounded-[14px] bg-[#684A97] px-6 py-10 md:px-12 md:py-14 text-white">
          <h1 className="text-3xl md:text-5xl font-bold text-[#FFD300]">Nossos Artigos</h1>
          <p className="mt-3 max-w-[560px]">
            Descubra tudo o que o nosso projeto já publicou. Escolha um artigo e boa leitura!
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2 text-sm font-semibold text-[#684A97]"
          >
            <ArrowLeft size={16} />
            Voltar para o início
          </Link>
        </div>
      </header>

      <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-16 py-12">
        {articles.length > 0 ? (
          <>
            <p className="mb-6 flex items-center gap-2 text-sm text-gray-600">
              <span className="h-2 w-2 rounded-full bg-[#E8473A]" />
              {articles.length} {articles.length === 1 ? "artigo" : "artigos"}
            </p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {articles.map((a, i) => (
                <li key={a.id}>
                  <ArticleCard article={a} index={i % 3} />
                </li>
              ))}
            </ul>
          </>
        ) : (
          <div className="flex flex-col items-center text-center py-16">
            <h2 className="text-2xl font-bold text-gray-800 mb-3">Ainda não temos artigos por aqui</h2>
            <p className="text-gray-600 mb-8">Volte em breve para conferir as novidades.</p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full bg-[#684A97] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#5a3f7d]"
            >
              <ArrowLeft size={18} />
              Voltar para o início
            </Link>
          </div>
        )}
      </main>

      <Footer socials={[]} />
    </div>
  );
}

export default async function ArticlePage({
  searchParams,
}: {
  searchParams: Promise<{ slug?: string | string[] }>;
}) {
  const { slug: bruto } = await searchParams;
  const slug = Array.isArray(bruto) ? bruto[0] : bruto;
  if (!slug) return <ListaDeArtigos articles={await getArticles()} />;

  // Mesma ordem da rota de API: slug primeiro, depois id
  const article = (await getArticleBySlug(slug)) ?? (await getArticleById(slug));

  // Not Found State
  if (!article) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar showTextLogo={true} />
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="motion-safe:animate-artigo-vazio max-w-md">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">
              Artigo não encontrado
            </h1>
            <p className="text-gray-600 mb-8">
              O conteúdo que você procura pode ter sido removido ou não está mais disponível.
            </p>
            <Link
              href="/artigos"
              className="inline-flex items-center gap-2 bg-[#684A97] text-white px-6 py-3 rounded-full font-medium hover:bg-[#5a3f7d] transition-transform hover:scale-105 shadow-md"
            >
              <ArrowLeft size={18} />
              Voltar para a biblioteca
            </Link>
          </div>
        </div>
        <Footer socials={[]} />
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
            href="/artigos"
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
            <div className="motion-safe:animate-artigo-hero">
              <Link
                href="/artigos"
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
            </div>
          </div>
        </div>

        {/* Content Wrapper */}
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-12">

            {/* Main Article Content */}
            <article
              className="motion-safe:animate-artigo-corpo prose prose-lg prose-slate max-w-none
                prose-headings:text-gray-900 prose-headings:font-bold 
                prose-p:text-gray-800 prose-p:leading-loose text-lg
                prose-a:text-[#684A97] prose-a:font-medium hover:prose-a:text-[#5a3f7d]
                prose-blockquote:border-l-[#684A97] prose-blockquote:bg-gray-50 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r-lg
                prose-img:rounded-xl prose-img:shadow-lg
                prose-li:text-gray-700"
            >
              {article.excerpt && (
                <div className="text-xl md:text-2xl text-gray-800 font-serif leading-relaxed mb-10 pb-10 border-b border-gray-100 italic">
                  &quot;{article.excerpt}&quot;
                </div>
              )}

              {article.content ? (
                (() => {
                  const { corpo, metadados } = separarMetadados(article.content);
                  return (
                    <>
                      {/* /artigos é rota pública: o HTML do artigo precisa ser
                          sanitizado antes de virar innerHTML, senão vira XSS
                          armazenado para todo visitante. */}
                      <div dangerouslySetInnerHTML={{ __html: sanitizeRichText(corpo) }} />
                      <ArticleMetadataCard metadata={metadados} />
                    </>
                  );
                })()
              ) : (
                <p className="text-gray-500 italic text-center py-20">
                  Conteúdo não disponível.
                </p>
              )}
            </article>

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
              href="/artigos"
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
      <Footer socials={[]} />
    </div>
  );
}
