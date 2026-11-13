// @vitest-environment node

import { readFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { JSDOM, type DOMWindow } from "jsdom";
import { describe, expect, it } from "vitest";

const LG2 = "public/lg2";
const ORIGEM = `${LG2}/turma-a/m01/js/falar.js`;
const CODIGO = readFileSync(ORIGEM, "utf8");
const PASTAS = ["turma-a", "turma-b"].flatMap((turma) =>
  readdirSync(join(LG2, turma)).filter((p) => /^m\d\d$/.test(p)).map((p) => `${turma}/${p}`));

const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
const MSG_IPHONE = "No iPhone, toque no campo e use o microfone do teclado para ditar.";

type Fake = { lang: string; continuous: boolean; interimResults: boolean; start: () => void; stop: () => void;
  onresult?: (e: unknown) => void; onerror?: (e: unknown) => void; onend?: () => void };

function abrir(corpo: string, opcoes: { ua?: string; rec?: "ouve" | "bloqueia" | "nada" | null } = {}) {
  const criados: Fake[] = [];
  const dom = new JSDOM(`<!doctype html><body>${corpo}</body>`, {
    url: "https://academy.example.org/lg2/turma-a/m01/",
    runScripts: "dangerously",
    beforeParse(window: DOMWindow) {
      if (opcoes.ua) Object.defineProperty(window.navigator, "userAgent", { get: () => opcoes.ua });
      // jsdom não calcula layout: todo campo fora de [hidden] conta como visível.
      (window.Element.prototype as unknown as { getClientRects: () => unknown[] }).getClientRects = function () { return [{}]; };
      const modo = opcoes.rec === undefined ? "ouve" : opcoes.rec;
      if (modo) {
        (window as unknown as { webkitSpeechRecognition: unknown }).webkitSpeechRecognition = function (this: Fake) {
          criados.push(this);
          this.stop = () => this.onend && this.onend();
          this.start = () => setTimeout(() => {
            if (modo === "ouve") this.onresult?.({ results: [[{ transcript: "teste de voz" }]] });
            else this.onerror?.({ error: modo === "bloqueia" ? "not-allowed" : "no-speech" });
            this.onend?.();
          }, 0);
        };
      }
    },
  });
  const s = dom.window.document.createElement("script");
  s.textContent = CODIGO;
  dom.window.document.body.appendChild(s);
  return { dom, doc: dom.window.document, criados };
}
const tick = () => new Promise((resolve) => setTimeout(resolve, 5));
const botoes = (doc: Document) => [...doc.querySelectorAll("button.lg2-falar")];

describe("botão Falar do LG2 (js/falar.js)", () => {
  it("é o mesmo arquivo nos 10 módulos, carregado em cada index.html", () => {
    expect(PASTAS).toHaveLength(10);
    const hash = (p: string) => createHash("md5").update(readFileSync(p)).digest("hex");
    const esperado = hash(ORIGEM);
    for (const pasta of PASTAS) {
      expect(hash(`${LG2}/${pasta}/js/falar.js`), pasta).toBe(esperado);
      expect(readFileSync(`${LG2}/${pasta}/index.html`, "utf8"), pasta).toContain('<script src="js/falar.js" defer></script>');
    }
  });

  it("o Módulo 1 não tem mais o microfone próprio (um botão só por campo)", () => {
    const app = readFileSync(`${LG2}/turma-a/m01/js/app.js`, "utf8");
    expect(app).not.toMatch(/SpeechRecognition/);
    expect(app).not.toContain('id="falar"');
  });

  it("põe o botão em textarea e no texto livre marcado, nunca em número, data ou campo escondido", async () => {
    const { doc, dom } = abrir(`
      <textarea id="a"></textarea>
      <input id="b" data-falar>
      <input id="c" data-falar inputmode="decimal">
      <input id="d" type="date" data-falar>
      <input id="e">
      <div hidden><textarea id="f"></textarea></div>
      <textarea id="g" data-falar="nao"></textarea>
      <textarea id="h" readonly></textarea>`);
    await tick();
    const com = botoes(doc).map((b) => (b.previousElementSibling as HTMLElement).id);
    expect(com).toEqual(["a", "b"]);
    const b = botoes(doc)[0];
    expect(b.getAttribute("aria-label")).toBe("Falar a resposta");
    expect(b.textContent!.trim()).toBe("Falar");
    expect(b.querySelector("svg")).not.toBeNull();
    // campo novo (tela redesenhada) também ganha o botão, uma vez só
    doc.body.insertAdjacentHTML("beforeend", "<textarea id='novo'></textarea>");
    await tick();
    await tick();
    expect(botoes(doc).map((x) => (x.previousElementSibling as HTMLElement).id)).toEqual(["a", "b", "novo"]);
    // área que aparece depois (\"Outro\") ganha o botão
    (doc.querySelector("[hidden]") as HTMLElement).hidden = false;
    await tick();
    await tick();
    expect(botoes(doc)).toHaveLength(4);
    dom.window.close();
  });

  it("o que foi ouvido entra no fim do campo e avisa o módulo com input e change", async () => {
    const { doc, dom, criados } = abrir('<textarea id="a">Faço bolos</textarea>');
    await tick();
    const campo = doc.getElementById("a") as HTMLTextAreaElement;
    const eventos: string[] = [];
    doc.body.addEventListener("input", () => eventos.push("input"));
    doc.body.addEventListener("change", () => eventos.push("change"));
    const b = botoes(doc)[0] as HTMLButtonElement;
    b.click();
    expect(b.textContent!.trim()).toBe("Ouvindo… toque para parar");
    expect(criados[0]).toMatchObject({ lang: "pt-BR", continuous: false, interimResults: false });
    await tick();
    expect(campo.value).toBe("Faço bolos teste de voz");
    expect(eventos).toEqual(["input", "change"]);
    expect(b.textContent!.trim()).toBe("Falar");
    dom.window.close();
  });

  it("no iPhone sem reconhecimento de voz, ensina a ditar pelo teclado", async () => {
    const { doc, dom } = abrir('<textarea id="a"></textarea>', { ua: IPHONE, rec: null });
    await tick();
    (botoes(doc)[0] as HTMLButtonElement).click();
    expect(doc.querySelector(".lg2-falar-aviso")!.textContent).toBe(MSG_IPHONE);
    expect(doc.activeElement).toBe(doc.getElementById("a"));
    dom.window.close();
  });

  it("microfone bloqueado: dica do teclado no iPhone, pedido de permissão nos outros", async () => {
    for (const [ua, esperado] of [[IPHONE, MSG_IPHONE], [undefined, "O navegador não deixou usar o microfone."]] as const) {
      const { doc, dom } = abrir('<textarea id="a"></textarea>', { ua, rec: "bloqueia" });
      await tick();
      (botoes(doc)[0] as HTMLButtonElement).click();
      await tick();
      expect(doc.querySelector(".lg2-falar-aviso")!.textContent).toContain(esperado);
      dom.window.close();
    }
  });

  it("sem fala ouvida, pede para tentar de novo", async () => {
    const { doc, dom } = abrir('<textarea id="a"></textarea>', { rec: "nada" });
    await tick();
    (botoes(doc)[0] as HTMLButtonElement).click();
    await tick();
    expect(doc.querySelector(".lg2-falar-aviso")!.textContent).toBe("Não ouvimos nada. Toque em falar e tente de novo, mais perto do microfone.");
    dom.window.close();
  });
});
