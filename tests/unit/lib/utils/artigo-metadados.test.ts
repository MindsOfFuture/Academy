import { describe, expect, it } from "vitest";
import { montarConteudo, separarMetadados } from "@/lib/utils/artigo-metadados";

describe("separarMetadados", () => {
  it("extrai Authors/Published in/DOI/Link do fim (inglês)", () => {
    const conteudo = [
      "Primeiro parágrafo.",
      "...ented effectively.",
      "**Authors:** C.S Côrtes Ouchi Dusi, G. Pedrette de Oliveira, J.A. López Escobedo",
      "**Published in:** INTED2026 Proceedings",
      "**DOI:** https://doi.org/10.21125/inted.2026.1484",
      "**Link:** https://library.iated.org/view/CORTESOUCHIDUSI2026ACT",
    ].join("\n\n");
    expect(separarMetadados(conteudo)).toEqual({
      corpo: "Primeiro parágrafo.\n\n...ented effectively.",
      metadados: {
        autores: "C.S Côrtes Ouchi Dusi, G. Pedrette de Oliveira, J.A. López Escobedo",
        publicadoEm: "INTED2026 Proceedings",
        doi: "https://doi.org/10.21125/inted.2026.1484",
        link: "https://library.iated.org/view/CORTESOUCHIDUSI2026ACT",
      },
    });
  });

  it("aceita rótulos em português e Keywords no meio do bloco, em qualquer ordem", () => {
    const conteudo = [
      "Texto final do corpo.",
      "**Publicado em:** ARACÊ, v. 7, n. 7, p. 36774-36795, 2025",
      "**Keywords:** Innovative Education, Technology Education",
      "**Autores:** Ana (UFJF)",
      "**DOI:** https://doi.org/10.5753/sbceb.2025.6678",
      "**Link:** https://periodicos.newsciencepubl.com/arace/article/view/6458",
      "",
    ].join("\r\n\r\n");
    const { corpo, metadados } = separarMetadados(conteudo);
    expect(corpo).toBe("Texto final do corpo.");
    expect(metadados).toEqual({
      autores: "Ana (UFJF)",
      publicadoEm: "ARACÊ, v. 7, n. 7, p. 36774-36795, 2025",
      doi: "https://doi.org/10.5753/sbceb.2025.6678",
      palavrasChave: "Innovative Education, Technology Education",
      link: "https://periodicos.newsciencepubl.com/arace/article/view/6458",
    });
  });

  it("não toca itens em negrito no meio do corpo", () => {
    const conteudo = "**Structural Layer:** base\n\n**Creative Layer:** topo\n\nFim.\n\n**DOI:** https://doi.org/1";
    expect(separarMetadados(conteudo)).toEqual({
      corpo: "**Structural Layer:** base\n\n**Creative Layer:** topo\n\nFim.",
      metadados: { doi: "https://doi.org/1" },
    });
  });

  it("rótulo conhecido no meio, seguido de texto, fica intacto", () => {
    const conteudo = "Intro.\n\n**Link:** https://x.org\n\nMais texto depois.";
    expect(separarMetadados(conteudo)).toEqual({ corpo: conteudo, metadados: {} });
  });

  it("sem metadados devolve o conteúdo intacto", () => {
    expect(separarMetadados("Só texto.")).toEqual({ corpo: "Só texto.", metadados: {} });
    expect(separarMetadados("")).toEqual({ corpo: "", metadados: {} });
  });

  it("corpo com Structural Layer no meio e bloco real no fim", () => {
    const conteudo = [
      "Intro.",
      "**Structural Layer:** base sólida",
      "**Creative Layer:** liberdade",
      "Conclusão.",
      "**Authors:** Ana, Bia",
      "**Published in:** ARACÊ, 2025",
      "**Keywords:** A, B",
      "**Link:** https://x.org/a",
    ].join("\n\n");
    expect(separarMetadados(conteudo)).toEqual({
      corpo: "Intro.\n\n**Structural Layer:** base sólida\n\n**Creative Layer:** liberdade\n\nConclusão.",
      metadados: { autores: "Ana, Bia", publicadoEm: "ARACÊ, 2025", palavrasChave: "A, B", link: "https://x.org/a" },
    });
  });

  it("formato antigo com vários itens numa linha", () => {
    expect(separarMetadados("Corpo.\n\n**Authors:** a **Published in:** b **Link:** https://x.org")).toEqual({
      corpo: "Corpo.",
      metadados: { autores: "a", publicadoEm: "b", link: "https://x.org" },
    });
  });

  it("vale o primeiro item quando o rótulo se repete", () => {
    expect(separarMetadados("C.\n\n**DOI:** https://a\n\n**DOI:** https://b").metadados).toEqual({ doi: "https://a" });
  });

  it.each([
    ["**Link:**  repetido", "**Link:**  ".repeat(30) + "<"],
    ["**Link:** a repetido", "**Link:** a ".repeat(2000) + "<"],
    ["espaços", "Texto" + " ".repeat(50000) + "x<"],
    ["<br>", "Texto" + "<br>".repeat(50000) + "x<"],
    ["espaços depois do rótulo", "**Link:**" + " ".repeat(50000) + "x<"],
  ])("entrada hostil (%s) termina rápido", (_nome, entrada) => {
    const inicio = performance.now();
    separarMetadados(entrada);
    expect(performance.now() - inicio).toBeLessThan(100);
  });

  it("montar e separar vão e voltam", () => {
    const metadados = { autores: "A, B", publicadoEm: "Anais", doi: "https://doi.org/1", palavrasChave: "x, y", link: "https://l.org" };
    const conteudo = montarConteudo("Corpo.\n\n**Structural Layer:** z", metadados);
    expect(conteudo.endsWith("**Palavras-chave:** x, y\n\n**Link:** https://l.org")).toBe(true);
    expect(separarMetadados(conteudo)).toEqual({ corpo: "Corpo.\n\n**Structural Layer:** z", metadados });
    expect(montarConteudo("  ", {})).toBe("");
    expect(montarConteudo("", { doi: "https://doi.org/1" })).toBe("**DOI:** https://doi.org/1");
  });
});
