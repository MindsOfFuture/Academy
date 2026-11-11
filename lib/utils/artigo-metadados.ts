export interface MetadadosArtigo {
  autores?: string;
  publicadoEm?: string;
  doi?: string;
  palavrasChave?: string;
  link?: string;
}

type Campo = keyof MetadadosArtigo;

const ROTULOS: Record<Campo, string> = {
  autores: "(?:Authors?|Autor(?:es)?)",
  publicadoEm: "(?:Published\\s*in|Publicado\\s*em)",
  doi: "DOI",
  palavrasChave: "(?:Keywords?|Palavras[\\s-]*chave)",
  link: "Link",
};
const GRAVADOS: Record<Campo, string> = {
  autores: "Autores",
  publicadoEm: "Publicado em",
  doi: "DOI",
  palavrasChave: "Palavras-chave",
  link: "Link",
};
const CAMPOS = Object.keys(ROTULOS) as Campo[];

// Regexes sem quantificador aninhado nem trechos que disputem o mesmo espaço: rodam no SSR público.
const SEPARADOR = /\n[ \t\r]*\n|<br\s*\/?>|<\/?p>/gi;
const INICIO_ITEM = new RegExp(`(?=\\*\\*\\s*(?:${Object.values(ROTULOS).join("|")})\\s*:\\s*\\*\\*)`, "gi");
// O valor começa fora de espaço, para não competir com o \s* que o antecede.
const ITEM = Object.fromEntries(
  CAMPOS.map((c) => [c, new RegExp(`^\\*\\*\\s*${ROTULOS[c]}\\s*:\\s*\\*\\*\\s*([^\\s*<][^*<\\r\\n]*)?$`, "i")]),
) as Record<Campo, RegExp>;
const SEPARADOR_FINAL = /(?:<br\s*\/?>|<\/?p>)$/i;

/** Lê um item; `null` se o trecho não for um item conhecido. */
function lerItem(parte: string): [Campo, string] | null {
  for (const c of CAMPOS) {
    const m = ITEM[c].exec(parte);
    if (m) return [c, (m[1] ?? "").trim()];
  }
  return null;
}

// O bloco só vale no fim do conteúdo, para não apagar texto do corpo.
export function separarMetadados(conteudo: string): { corpo: string; metadados: MetadadosArtigo } {
  const texto = conteudo.trimEnd();
  const pecas: [number, number][] = [];
  let pos = 0;
  for (const m of texto.matchAll(SEPARADOR)) {
    pecas.push([pos, m.index]);
    pos = m.index + m[0].length;
  }
  pecas.push([pos, texto.length]);

  const metadados: MetadadosArtigo = {};
  let corte = -1;
  // De baixo para cima; quem está mais acima sobrescreve, então vale o primeiro do bloco.
  fora: for (let i = pecas.length - 1; i >= 0; i--) {
    const peca = texto.slice(pecas[i][0], pecas[i][1]);
    if (!peca.trim()) continue;
    const inicios = [...peca.matchAll(INICIO_ITEM)].map((m) => m.index);
    for (let j = inicios.length - 1; j >= 0; j--) {
      const item = lerItem(peca.slice(inicios[j], inicios[j + 1] ?? peca.length).trim());
      if (!item) break fora;
      if (item[1]) metadados[item[0]] = item[1];
      else delete metadados[item[0]];
      corte = pecas[i][0] + inicios[j];
    }
    if (peca.slice(0, inicios[0] ?? peca.length).trim()) break;
  }
  if (corte < 0) return { corpo: conteudo, metadados: {} };

  let corpo = texto.slice(0, corte).trimEnd();
  for (let m; (m = SEPARADOR_FINAL.exec(corpo.slice(corpo.lastIndexOf("<")))); ) {
    corpo = corpo.slice(0, corpo.length - m[0].length).trimEnd();
  }
  return { corpo, metadados };
}

export function montarConteudo(corpo: string, metadados: MetadadosArtigo): string {
  const linhas = CAMPOS.filter((c) => metadados[c]).map((c) => `**${GRAVADOS[c]}:** ${metadados[c]}`);
  return [corpo.trim(), ...linhas].filter(Boolean).join("\n\n");
}
