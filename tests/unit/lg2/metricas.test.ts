// @vitest-environment node

import { readFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { JSDOM } from "jsdom";
import { describe, expect, it, vi } from "vitest";
import { validateLearningEventBatch } from "@/lib/api/telemetry-validation";

const LG2 = "public/lg2";
const ORIGEM = `${LG2}/turma-a/m01/js/metricas.js`;
const CODIGO = readFileSync(ORIGEM, "utf8");
const PASTAS = ["turma-a", "turma-b"].flatMap((turma) =>
  readdirSync(join(LG2, turma)).filter((p) => /^m\d\d$/.test(p)).map((p) => `${turma}/${p}`));

type Chamada = [string, RequestInit];

function abrir(url: string, corpo: string, modulo: number | null = 7) {
  const fetchMock = vi.fn().mockResolvedValue({ ok: true });
  const atributo = modulo === null ? "" : ` data-modulo="${modulo}"`;
  const dom = new JSDOM(`<!doctype html><body>${corpo}<script${atributo}>${CODIGO}</script></body>`, {
    url,
    runScripts: "dangerously",
    beforeParse(window) {
      (window as unknown as { fetch: unknown }).fetch = fetchMock;
    },
  });
  const corpos = () => (fetchMock.mock.calls as Chamada[]).map(([, init]) => JSON.parse(String(init.body)));
  return { dom, fetchMock, corpos };
}

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));
const FIM_ESCONDIDO = '<div id="seguir" hidden><div class="acoes lg2-proximo"><a href="#">Ir</a></div></div>';

describe("métricas do LG2 (js/metricas.js)", () => {
  it("é o mesmo arquivo nos 10 módulos e na jornada, com o número certo em cada index.html", () => {
    expect(PASTAS).toHaveLength(10);
    const hash = (p: string) => createHash("md5").update(readFileSync(p)).digest("hex");
    const esperado = hash(ORIGEM);
    for (const pasta of PASTAS) {
      expect(hash(`${LG2}/${pasta}/js/metricas.js`), pasta).toBe(esperado);
      const n = Number(pasta.slice(-2));
      expect(readFileSync(`${LG2}/${pasta}/index.html`, "utf8"))
        .toContain(`<script src="js/metricas.js" data-modulo="${n}" defer></script>`);
    }
    expect(hash(`${LG2}/jornada/js/metricas.js`)).toBe(esperado);
    expect(readFileSync(`${LG2}/jornada/index.html`, "utf8")).toContain('<script src="js/metricas.js" defer></script>');
  });

  it.each([
    "http://127.0.0.1:8799/lg2/turma-b/m07/",
    "http://localhost:3000/lg2/turma-b/m07/",
    "file:///home/aluno/m07/index.html",
  ])("não envia nada fora do site (%s)", async (url) => {
    const { dom, fetchMock } = abrir(url, FIM_ESCONDIDO);
    (dom.window.document.getElementById("seguir") as HTMLElement).hidden = false;
    await tick();
    expect(fetchMock).not.toHaveBeenCalled();
    dom.window.close();
  });

  it("no site, avisa a abertura e a conclusão uma vez só, no formato que a rota aceita", async () => {
    const { dom, fetchMock, corpos } = abrir("https://academy.example.org/lg2/turma-b/m07/", FIM_ESCONDIDO);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [endereco, init] = fetchMock.mock.calls[0] as Chamada;
    expect(endereco).toBe("/api/telemetry/events");
    expect(init).toMatchObject({ method: "POST", credentials: "same-origin", keepalive: true });

    // Mudanças na tela com a caixa ainda escondida não contam como conclusão.
    dom.window.document.body.appendChild(dom.window.document.createElement("p"));
    await tick();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const seguir = dom.window.document.getElementById("seguir") as HTMLElement;
    seguir.hidden = false;
    await tick();
    seguir.hidden = true;
    await tick();
    seguir.hidden = false;
    await tick();
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const [aberto, concluido] = corpos();
    expect(aberto.events[0]).toMatchObject({ eventName: "lg2_module_opened", route: "/lg2", metadata: { modulo: 7 } });
    expect(concluido.events[0]).toMatchObject({ eventName: "lg2_module_completed", route: "/lg2", metadata: { modulo: 7 } });
    expect(aberto.events[0].sessionId).toBe(concluido.events[0].sessionId);
    expect(aberto.events[0].eventId).not.toBe(concluido.events[0].eventId);
    expect(dom.window.sessionStorage.getItem("lg2-metricas-sessao")).toBe(aberto.events[0].sessionId);
    // A própria validação do servidor aceita o que o módulo manda.
    expect(() => validateLearningEventBatch(aberto)).not.toThrow();
    expect(() => validateLearningEventBatch(concluido)).not.toThrow();
    // Nenhuma resposta: só as chaves do evento.
    expect(Object.keys(aberto.events[0]).sort()).toEqual(["eventId", "eventName", "metadata", "occurredAt", "route", "sessionId"]);
    dom.window.close();
  });

  it("conta como concluído quando a caixa já nasce visível", async () => {
    const { dom, corpos } = abrir("https://academy.example.org/lg2/turma-a/m05/", '<div class="acoes lg2-proximo"></div>', 5);
    await tick();
    expect(corpos().map((c) => c.events[0].eventName)).toEqual(["lg2_module_opened", "lg2_module_completed"]);
    dom.window.close();
  });

  it("na jornada só expõe o envio, e o fim da jornada passa na validação", async () => {
    const { dom, fetchMock, corpos } = abrir("https://academy.example.org/lg2/jornada/", "", null);
    expect(fetchMock).not.toHaveBeenCalled();
    const api = (dom.window as unknown as { LG2Metricas: { enviar: (e: string, r: string, m: object) => boolean } }).LG2Metricas;
    expect(api.enviar("lg2_journey_completed", "/lg2/jornada", {})).toBe(true);
    expect(() => validateLearningEventBatch(corpos()[0])).not.toThrow();
    dom.window.close();
  });

  it("a jornada avisa o fim uma vez, ao mostrar o resumo", () => {
    const jornada = readFileSync(`${LG2}/jornada/js/jornada.js`, "utf8");
    expect(jornada).toMatch(/if \(!jornadaAvisada\) \{\s*jornadaAvisada = true;[\s\S]*?LG2Metricas\.enviar\('lg2_journey_completed', '\/lg2\/jornada', \{\}\)/);
  });
});
