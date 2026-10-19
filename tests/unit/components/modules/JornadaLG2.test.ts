import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { MODULOS, PRONTOS, caminhoModulo } from "@/components/modules/laboratorio-gestao/turmas";

const jornada = readFileSync(path.join(process.cwd(), "public/lg2/jornada/js/jornada.js"), "utf8");

describe("Jornada completa do LG2", () => {
  it("abre os mesmos módulos publicados nas turmas, na ordem de 1 a 10", () => {
    const lidos = [...jornada.matchAll(/\{ n: (\d+), nome: '([^']+)', caminho: (null|'[^']+') \}/g)].map((m) => ({
      numero: Number(m[1]),
      nome: m[2],
      caminho: m[3] === "null" ? null : m[3].slice(1, -1),
    }));
    const esperado = MODULOS.map((m) => {
      const turma = (["a", "b"] as const).find((t) => PRONTOS[t].includes(m.numero));
      return { numero: m.numero, nome: m.nome, caminho: turma ? caminhoModulo(turma, m.numero) : null };
    });
    expect(lidos).toEqual(esperado);
  });
});

describe("cabeçalhos de moldura", () => {
  it("só public/lg2 aceita moldura, e só do próprio site", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL ||= "http://127.0.0.1:9";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||= "placeholder";
    const { default: config } = await import("@/next.config");
    const regras = await config.headers!();
    const valor = (rota: string, chave: string) => {
      // Mesma regra do Next: todas as regras que casam valem, a última sobrescreve a chave.
      let v: string | undefined;
      for (const r of regras) {
        const re = new RegExp("^" + r.source.replace("/:path*", "(/.*)?") + "$");
        if (re.test(rota)) v = r.headers.find((h) => h.key === chave)?.value ?? v;
      }
      return v;
    };
    expect(valor("/protected/modulos/laboratorio-de-gestao", "X-Frame-Options")).toBe("DENY");
    expect(valor("/protected/modulos/laboratorio-de-gestao", "Content-Security-Policy")).toContain("frame-ancestors 'none'");
    expect(valor("/lg2/turma-a/m01/index.html", "X-Frame-Options")).toBe("SAMEORIGIN");
    expect(valor("/lg2/turma-a/m01/index.html", "Content-Security-Policy")).toBe("frame-ancestors 'self'; object-src 'none'; base-uri 'self'");
    expect(valor("/lg2x/qualquer", "X-Frame-Options")).toBe("DENY");
  });
});
