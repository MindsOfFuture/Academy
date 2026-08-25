import sanitizeHtml from "sanitize-html";

/**
 * Limpa HTML vindo do banco antes de virar `dangerouslySetInnerHTML`.
 *
 * Usamos `sanitize-html` (parser puro em JS) e não DOMPurify: a variante
 * isomórfica do DOMPurify carrega jsdom, que quebra o prerender do Next.
 *
 * Allowlist = o que os artigos usam (formatação, links, imagens, tabelas).
 * Fora dela nada passa — em especial `script`, `style`, `iframe` e handlers
 * `on*`, que são o vetor de XSS armazenado.
 */
export function sanitizeRichText(dirty: string): string {
    return sanitizeHtml(dirty, {
        allowedTags: [
            "h1", "h2", "h3", "h4", "h5", "h6",
            "p", "div", "span", "br", "hr",
            "strong", "b", "em", "i", "u", "s", "sub", "sup", "mark", "small",
            "ul", "ol", "li", "blockquote", "pre", "code",
            "a", "img", "figure", "figcaption",
            "table", "thead", "tbody", "tfoot", "tr", "th", "td", "caption",
        ],
        allowedAttributes: {
            a: ["href", "title", "target", "rel"],
            img: ["src", "alt", "title", "width", "height", "loading"],
            "*": ["class"],
        },
        allowedSchemes: ["http", "https", "mailto"],
        // Bloqueia data:/blob: em <img src>, que também executam script em alguns contextos.
        allowedSchemesByTag: { img: ["http", "https"] },
        // Links externos não podem manipular a janela de origem.
        transformTags: {
            a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }),
        },
    });
}
