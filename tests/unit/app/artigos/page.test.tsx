import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

const getArticleBySlug = vi.fn();
const getArticleById = vi.fn();
vi.mock("@/lib/api/articles", () => ({
  getArticleBySlug: (s: string) => getArticleBySlug(s),
  getArticleById: (s: string) => getArticleById(s),
}));
vi.mock("@/components/navbar/navbar", () => ({ default: () => <nav /> }));
vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));
vi.mock("next/link", () => ({
  default: ({ href, children, ...r }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...r}>{children}</a>
  ),
}));

import ArticlePage from "@/app/artigos/page";

const artigo = {
  id: "1",
  title: "Robôs na escola",
  content: "<p>Texto do artigo</p><script>window.__xss=1</script>",
};

const renderiza = async (slug?: string) =>
  render(await ArticlePage({ searchParams: Promise.resolve({ slug }) }));

describe("ArticlePage", () => {
  beforeEach(() => {
    getArticleBySlug.mockReset();
    getArticleById.mockReset();
  });

  it("mostra o artigo achado por slug e remove script", async () => {
    getArticleBySlug.mockResolvedValue(artigo);
    const { container } = await renderiza("x");
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Robôs na escola");
    expect(screen.getByText("Texto do artigo")).toBeTruthy();
    expect(container.querySelector("script")).toBeNull();
    expect(getArticleById).not.toHaveBeenCalled();
  });

  it("cai para o id quando o slug não acha", async () => {
    getArticleBySlug.mockResolvedValue(null);
    getArticleById.mockResolvedValue(artigo);
    await renderiza("x");
    expect(getArticleById).toHaveBeenCalledWith("x");
    expect(screen.getByText("Robôs na escola")).toBeTruthy();
  });

  it("sem slug não consulta", async () => {
    await renderiza(undefined);
    expect(screen.getByText("Artigo não encontrado")).toBeTruthy();
    expect(getArticleBySlug).not.toHaveBeenCalled();
    expect(getArticleById).not.toHaveBeenCalled();
  });

  it("nenhum acha", async () => {
    getArticleBySlug.mockResolvedValue(null);
    getArticleById.mockResolvedValue(null);
    await renderiza("x");
    expect(screen.getByText("Artigo não encontrado")).toBeTruthy();
  });
});
