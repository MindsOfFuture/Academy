/**
 * Guard e conteúdo da rota /gestao — feature flag + autenticação + papel.
 *
 * Ordem de defesa em profundidade:
 *   1. flag desligada  -> notFound (404)
 *   2. anônimo         -> redirect /auth?next=/gestao
 *   3. sem papel       -> notFound (404, não vaza existência)
 *   4. membro          -> tela "Hoje"; indicadores do convênio só para a coordenação
 *   5. tela restrita   -> bolsista recebe 404 na equipe
 */
import { render, screen, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const redirectMock = vi.fn((url: string) => {
  throw new Error(`NEXT_REDIRECT:${url}`);
});
const notFoundMock = vi.fn(() => {
  throw new Error(`NEXT_NOT_FOUND`);
});

vi.mock("next/navigation", () => ({
  redirect: (url: string) => redirectMock(url),
  notFound: () => notFoundMock(),
}));

let flagLigada = false;
let papelMembro: "coordenacao" | "bolsista" | null = null;
let autenticado = true;

vi.mock("@/lib/api/gestao/feature-flags", () => ({
  gestaoHabilitada: () => flagLigada,
}));
vi.mock("@/lib/api/gestao/auth", () => ({
  ensureGestaoMember: async () => {
    if (!autenticado) throw new Error("Usuário não autenticado.");
    if (!papelMembro) throw new Error("Acesso negado. Apenas membros do projeto podem acessar a gestão.");
    return papelMembro;
  },
}));
vi.mock("@/lib/api/gestao/indicators", () => ({
  getIndicadores: async () => ({
    alunos: { total: 12 },
    reservasOnibus: { total: 3 },
    termos: { pendentes: 2, arquivados: 10 },
    presenca: { presentes: 5, ausentes: 1 },
    aulas: { total: 4 },
    cargaBolsistas: { items: [], totalAlocacoes: 2 },
  }),
}));
vi.mock("@/lib/api/gestao/pendencias", () => ({
  listarPendencias: async () => [
    { tipo: "aula_sem_registro", titulo: "Aula de 01/10 sem registro", detalhe: "Escola A", href: "/gestao", urgente: true },
    { tipo: "proxima_aula", titulo: "05/10 · Escola A", detalhe: "lego · 08h", href: "/gestao" },
  ],
}));
vi.mock("@/lib/api/gestao/equipe", () => ({ listarEquipe: async () => [] }));
let artigos: unknown[] = [];
let producoes: unknown[] = [];
vi.mock("@/lib/api/gestao/artigos", () => ({ listarArtigos: async () => artigos, buscarArtigo: async () => null }));
vi.mock("@/app/gestao/pesquisa/artigos/forms", () => ({ FormArtigo: () => <div /> }));
vi.mock("@/lib/api/gestao/pesquisa", () => ({
  listarReunioes: async () => [],
  buscarReuniao: async () => null,
  listarProducoes: async () => producoes,
  buscarProducao: async () => null,
}));
vi.mock("@/app/gestao/pesquisa/forms", () => ({ FormReuniao: () => <div />, FormProducao: () => <div /> }));
vi.mock("@/lib/supabase/server", async (original) => ({
  ...(await original<typeof import("@/lib/supabase/server")>()),
  usuarioDaRequisicao: async () => "u-1",
}));
vi.mock("@/lib/api/content", () => ({
  getHero: async () => ({
    subtitulo: "",
    destaques: [
      { chave: "escolas", rotulo: "Escolas atendidas", mostrar: true, total: 36, base: 35 },
      { chave: "alunos", rotulo: "Alunos impactados", mostrar: true, total: 1524, base: 1499 },
      { chave: "aulas", rotulo: "Aulas realizadas", mostrar: false, total: 130, base: 120 },
    ],
  }),
}));
vi.mock("@/app/gestao/numeros-do-site", () => ({
  FormNumerosDoSite: ({ destaques }: { destaques: { chave: string; base: number }[] }) => (
    <p>site: {destaques.map((d) => `${d.base} ${d.chave}`).join(", ")}</p>
  ),
}));
vi.mock("@/app/gestao/equipe/forms", () => ({
  FormConcederPapel: () => <div />,
  FormBolsa: () => <div />,
  AcoesMembro: () => <div />,
}));

import GestaoPage from "@/app/gestao/page";
import EquipePage from "@/app/gestao/equipe/page";
import ArtigosPage from "@/app/gestao/pesquisa/artigos/page";
import PesquisaPage from "@/app/gestao/pesquisa/page";
import { abasDoPapel } from "@/app/gestao/abas";

beforeEach(() => {
  flagLigada = false;
  papelMembro = null;
  autenticado = true;
  redirectMock.mockClear();
  notFoundMock.mockClear();
});

afterEach(() => {
  cleanup();
});

describe("rota /gestao", () => {
  it("responde 404 com a flag desligada, sem checar autenticação", async () => {
    flagLigada = false;
    autenticado = false; // se o login fosse checado antes da flag, viria redirect para /auth
    await expect(GestaoPage()).rejects.toThrow(/NEXT_NOT_FOUND/);
    expect(notFoundMock).toHaveBeenCalled();
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("redireciona anônimo para /auth?next=/gestao quando a flag está ligada", async () => {
    flagLigada = true;
    autenticado = false;
    await expect(GestaoPage()).rejects.toThrow(/NEXT_REDIRECT/);
    expect(redirectMock).toHaveBeenCalledWith("/auth?next=%2Fgestao");
  });

  it("nega 404 a usuário autenticado sem papel de membro (ou desligado)", async () => {
    flagLigada = true;
    papelMembro = null;
    await expect(GestaoPage()).rejects.toThrow(/NEXT_NOT_FOUND/);
    expect(notFoundMock).toHaveBeenCalled();
  });

  it("mostra pendências e indicadores do convênio à coordenação", async () => {
    flagLigada = true;
    papelMembro = "coordenacao";
    render(await GestaoPage());
    expect(screen.getByText("Aula de 01/10 sem registro")).toBeInTheDocument();
    expect(screen.getByText("05/10 · Escola A")).toBeInTheDocument();
    expect(screen.getByText("Alunos participantes")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("Números da página inicial")).toBeInTheDocument();
    expect(screen.getByText("site: 35 escolas, 1499 alunos, 120 aulas")).toBeInTheDocument();
  });

  it("mostra ao bolsista só as pendências, sem os indicadores do convênio", async () => {
    flagLigada = true;
    papelMembro = "bolsista";
    render(await GestaoPage());
    expect(screen.getByText("Aula de 01/10 sem registro")).toBeInTheDocument();
    expect(screen.queryByText("Alunos participantes")).not.toBeInTheDocument();
    expect(screen.queryByText("Números da página inicial")).not.toBeInTheDocument();
  });

  it("devolve 404 ao bolsista na tela de equipe", async () => {
    flagLigada = true;
    papelMembro = "bolsista";
    await expect(EquipePage({ searchParams: Promise.resolve({}) })).rejects.toThrow(/NEXT_NOT_FOUND/);
  });

  it("devolve 404 ao bolsista na tela de artigos", async () => {
    flagLigada = true;
    papelMembro = "bolsista";
    await expect(ArtigosPage({ searchParams: Promise.resolve({}) })).rejects.toThrow(/NEXT_NOT_FOUND/);
  });

  it("devolve 404 à coordenação num artigo que não existe", async () => {
    flagLigada = true;
    papelMembro = "coordenacao";
    await expect(
      ArtigosPage({ searchParams: Promise.resolve({ artigo: "11111111-1111-4111-8111-111111111111" }) }),
    ).rejects.toThrow(/NEXT_NOT_FOUND/);
  });

  it("devolve 404 ao bolsista numa reunião de pesquisa que não existe", async () => {
    flagLigada = true;
    papelMembro = "bolsista";
    await expect(
      PesquisaPage({ searchParams: Promise.resolve({ id: "11111111-1111-4111-8111-111111111111" }) }),
    ).rejects.toThrow(/NEXT_NOT_FOUND/);
  });

  it("devolve 404 na pesquisa com id que não é uuid", async () => {
    flagLigada = true;
    papelMembro = "coordenacao";
    await expect(PesquisaPage({ searchParams: Promise.resolve({ parte: "producoes", id: "abc" }) })).rejects.toThrow(
      /NEXT_NOT_FOUND/,
    );
  });

  it("mostra a pesquisa vazia ao bolsista", async () => {
    flagLigada = true;
    papelMembro = "bolsista";
    render(await PesquisaPage({ searchParams: Promise.resolve({}) }));
    expect(screen.getByText("Nenhuma reunião ainda.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Reuniões" })).toHaveAttribute("aria-current", "page");
    expect(screen.queryByRole("link", { name: "Artigos" })).not.toBeInTheDocument();
  });

  it("artigos do site são um filtro de Produções, só da coordenação", async () => {
    flagLigada = true;
    papelMembro = "coordenacao";
    render(await PesquisaPage({ searchParams: Promise.resolve({ parte: "producoes", tipo: "site" }) }));
    expect(screen.getByRole("link", { name: "Artigos" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Produções" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByText("Nenhum artigo ainda.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Novo artigo" })).toHaveAttribute("href", "/gestao/pesquisa/artigos?artigo=novo");
  });

  it("Todos junta produções e artigos do site por data; só a coordenação edita o artigo", async () => {
    flagLigada = true;
    artigos = [{
      id: "a1", titulo: "Robótica na escola", slug: "robotica", resumo: null, status: "published", capaUrl: null,
      publicadoEm: "2026-11-12T10:00:00Z", criadoEm: "2026-11-01T10:00:00Z",
      conteudo: ["Texto.", "**Autores:** Ana Lima", "**Publicado em:** Congresso X, 2026"].join("\n\n"),
    }];
    producoes = [{ id: "p1", tipo: "substack", titulo: "Post do mês", autores: "Caio", data: "2026-11-05", onde: null, link: null, criadoPor: null }];
    try {
      papelMembro = "coordenacao";
      render(await PesquisaPage({ searchParams: Promise.resolve({ parte: "producoes" }) }));
      const linhas = screen.getAllByRole("listitem").map((li) => li.textContent);
      expect(linhas[0]).toMatch(/Artigo.*Robótica na escola.*Ana Lima.*Congresso X, 2026/);
      expect(linhas[1]).toMatch(/Substack.*Post do mês/);
      expect(screen.getByRole("link", { name: "Abrir no site" })).toHaveAttribute("href", "/artigos?slug=robotica");
      expect(screen.getAllByRole("link", { name: "Editar" })[0]).toHaveAttribute("href", "/gestao/pesquisa/artigos?artigo=a1");
      cleanup();

      papelMembro = "bolsista";
      render(await PesquisaPage({ searchParams: Promise.resolve({ parte: "producoes" }) }));
      expect(screen.getByText("Robótica na escola")).toBeInTheDocument();
      expect(screen.queryByRole("link", { name: "Editar" })).not.toBeInTheDocument();
    } finally {
      artigos = [];
      producoes = [];
    }
  });

  it("bolsista não vê o filtro de artigos nem com o endereço dele", async () => {
    flagLigada = true;
    papelMembro = "bolsista";
    render(await PesquisaPage({ searchParams: Promise.resolve({ parte: "producoes", tipo: "site" }) }));
    expect(screen.queryByRole("link", { name: "Artigos" })).not.toBeInTheDocument();
    expect(screen.getByText("Nenhuma produção ainda.")).toBeInTheDocument();
  });

  it("a lista antiga de artigos leva para o filtro em Produções", async () => {
    flagLigada = true;
    papelMembro = "coordenacao";
    await expect(ArtigosPage({ searchParams: Promise.resolve({}) })).rejects.toThrow(/NEXT_REDIRECT/);
  });

  it("dá a aba Equipe só à coordenação; Metas, Pesquisa e Melhorias aos dois", () => {
    expect(abasDoPapel("coordenacao").map((a) => a.rotulo)).toEqual([
      "Hoje", "Alocação", "Equipe", "Relatório", "Metas", "Treinamentos", "Melhorias", "Pesquisa", "Empreenda+",
    ]);
    expect(abasDoPapel("bolsista").map((a) => a.rotulo)).toEqual(["Hoje", "Calendário", "Relatório", "Metas", "Treinamentos", "Melhorias", "Pesquisa"]);
  });
});
