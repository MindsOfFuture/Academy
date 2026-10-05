import React from "react";
import { render, screen, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ArticleSummary } from "@/lib/api/types";

vi.mock("next/image", () => ({ default: () => null }));
vi.mock("next/link", () => ({ default: ({ children }: { children: React.ReactNode }) => <span>{children}</span> }));
vi.mock("swiper/react", () => ({
  Swiper: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SwiperSlide: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock("swiper/modules", () => ({ Autoplay: {}, Pagination: {}, Navigation: {} }));
vi.mock("framer-motion", () => ({ motion: { div: ({ children, className }: { children: React.ReactNode; className?: string }) => <div className={className}>{children}</div> } }));
import OurArticles from "@/components/ourArticles/ourArticles";

const article: ArticleSummary = {
  id: "article-1", title: "Artigo", slug: "artigo", excerpt: "Resumo",
  coverUrl: null, authorId: null, publishedAt: "2026-03-01T00:00:00+00:00",
};
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe("Datas de publicação", () => {
  it("mantém a mesma data do servidor UTC no navegador brasileiro", () => {
    const format = Date.prototype.toLocaleDateString;
    let browserTimezone = "UTC";
    vi.spyOn(Date.prototype, "toLocaleDateString").mockImplementation(function (this: Date, locale, options) {
      return format.call(this, locale, { timeZone: browserTimezone, ...options });
    });
    const { rerender } = render(<OurArticles articles={[article]} />);
    expect(screen.getByText("01/03/2026")).toBeInTheDocument();
    browserTimezone = "America/Sao_Paulo";
    rerender(<OurArticles articles={[article]} />);
    expect(screen.getByText("01/03/2026")).toBeInTheDocument();
    browserTimezone = "Asia/Tokyo";
    rerender(<OurArticles articles={[article]} />);
    expect(screen.getByText("01/03/2026")).toBeInTheDocument();
  });
});
