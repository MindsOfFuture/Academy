// @vitest-environment node

import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";
import { describe, expect, it, vi } from "vitest";

const CODIGO = readFileSync("public/lg2/jornada/js/progresso.js", "utf8");

type Decisao = { limpar: boolean; gravar: Record<string, string> | null; enviar: boolean; marcador: { u: string; em: string | null } };
type Api = {
  mesclar: (local: Record<string, string>, servidor: unknown, marcador: unknown, usuario: string) => Decisao;
  ativo: boolean;
  pronto: Promise<boolean>;
};
type Chamada = [string, RequestInit];

function carregar(url: string, respostaGet: unknown, local: Record<string, string> = {}, opcoes: { getFalha?: boolean } = {}) {
  const tiques: Array<() => void> = [];
  const fetchMock = vi.fn(async (_url: string, init: RequestInit) => {
    if ((init.method || "GET") === "GET") {
      if (opcoes.getFalha) throw new Error("rede");
      return { ok: true, json: async () => respostaGet };
    }
    return { ok: true, json: async () => ({ ok: true, u: "user-1", atualizado_em: "2026-11-12T12:00:00.000Z" }) };
  });
  const dom = new JSDOM("<!doctype html><body></body>", {
    url,
    runScripts: "outside-only",
    beforeParse(window) {
      (window as unknown as { fetch: unknown }).fetch = fetchMock;
      // O envio periódico fica na mão do teste: cada tique() = 5 s.
      (window as unknown as { setInterval: unknown }).setInterval = (fn: () => void) => { tiques.push(fn); return tiques.length; };
      for (const [k, v] of Object.entries(local)) window.localStorage.setItem(k, v);
    },
  });
  dom.window.eval(CODIGO);
  const api = (dom.window as unknown as { LG2Progresso: Api }).LG2Progresso;
  const tique = () => tiques.forEach((fn) => fn());
  const puts = () => (fetchMock.mock.calls as unknown as Chamada[]).filter(([, i]) => i.method === "PUT");
  return { dom, api, fetchMock, puts, tique };
}

const API = carregar("http://127.0.0.1/lg2/jornada/", null).api;
const mesclar = API.mesclar;
const SERV = { dados: { "lg2-jornada": "{\"feitos\":[1,2]}" }, atualizado_em: "2026-11-12T10:00:00.000Z" };

describe("progresso da jornada na conta: mesclar()", () => {
  it("aparelho sem marca e conta com dados: traz tudo da conta, sem apagar", () => {
    const d = mesclar({ "lg2-turma-a-m01": "{}" }, SERV, null, "user-1");
    expect(d).toEqual({ limpar: false, gravar: SERV.dados, enviar: false, marcador: { u: "user-1", em: SERV.atualizado_em } });
  });

  it("outra pessoa usou este navegador: apaga as respostas dela e traz as da conta", () => {
    const d = mesclar({ "lg2-jornada": "{}" }, SERV, { u: "user-2", em: "2026-11-12T11:00:00.000Z" }, "user-1");
    expect(d.limpar).toBe(true);
    expect(d.gravar).toEqual(SERV.dados);
    expect(d.marcador).toEqual({ u: "user-1", em: SERV.atualizado_em });
  });

  it("a conta foi atualizada em outro aparelho depois da última vez: traz da conta", () => {
    const d = mesclar({ "lg2-jornada": "{}" }, SERV, { u: "user-1", em: "2026-11-12T09:00:00.000Z" }, "user-1");
    expect(d.limpar).toBe(false);
    expect(d.gravar).toEqual(SERV.dados);
  });

  it("o aparelho já viu essa versão da conta: mantém o aparelho (o envio periódico manda o que mudou)", () => {
    const d = mesclar({ "lg2-jornada": "{\"feitos\":[1,2,3]}" }, SERV, { u: "user-1", em: SERV.atualizado_em }, "user-1");
    expect(d).toEqual({ limpar: false, gravar: null, enviar: false, marcador: { u: "user-1", em: SERV.atualizado_em } });
  });

  it("primeiro acesso: conta vazia e progresso antigo no aparelho sobe para a conta", () => {
    expect(mesclar({ "lg2-jornada": "{}" }, { dados: null, atualizado_em: null }, null, "user-1"))
      .toEqual({ limpar: false, gravar: null, enviar: true, marcador: { u: "user-1", em: null } });
    expect(mesclar({ "lg2-jornada": "{}" }, { dados: {}, atualizado_em: null }, { u: "user-1", em: null }, "user-1").enviar).toBe(true);
  });

  it("conta vazia e respostas de outra pessoa no aparelho: não sobem, saem do aparelho", () => {
    const d = mesclar({ "lg2-jornada": "{}" }, { dados: null }, { u: "user-2", em: null }, "user-1");
    expect(d).toEqual({ limpar: true, gravar: null, enviar: false, marcador: { u: "user-1", em: null } });
  });

  it("nada em lugar nenhum: não faz nada", () => {
    expect(mesclar({}, { dados: null }, null, "user-1")).toEqual({ limpar: false, gravar: null, enviar: false, marcador: { u: "user-1", em: null } });
  });
});

describe("progresso da jornada na conta: no navegador", () => {
  it("fora do site (127.0.0.1) não chama a conta e libera a jornada na hora", async () => {
    const { api, fetchMock } = carregar("http://127.0.0.1:5000/lg2/jornada/", SERV);
    expect(api.ativo).toBe(false);
    await expect(api.pronto).resolves.toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("no site: busca a conta antes de liberar, grava no aparelho e marca quem é a pessoa", async () => {
    const { dom, api, fetchMock } = carregar("https://academy.example.org/lg2/jornada/", { u: "user-1", ...SERV }, { "lg2-jornada": "{\"feitos\":[]}" });
    expect(api.ativo).toBe(true);
    await expect(api.pronto).resolves.toBe(true);
    const [url, init] = fetchMock.mock.calls[0] as unknown as Chamada;
    expect(url).toBe("/api/lg2/progresso");
    expect(init).toMatchObject({ method: "GET", credentials: "same-origin", cache: "no-store" });
    expect(dom.window.localStorage.getItem("lg2-jornada")).toBe("{\"feitos\":[1,2]}");
    expect(JSON.parse(dom.window.localStorage.getItem("lg2-sync") as string)).toEqual({ u: "user-1", em: SERV.atualizado_em });
    dom.window.close();
  });

  it("outra pessoa no navegador: as respostas dela somem antes de trazer as da conta", async () => {
    const { dom, api } = carregar("https://academy.example.org/lg2/jornada/", { u: "user-1", ...SERV }, {
      "lg2-sync": JSON.stringify({ u: "user-2", em: "2026-11-12T11:00:00.000Z" }),
      "lg2-turma-b-m02": "{\"R\":{\"x\":1}}",
      "outra-coisa": "fica",
    });
    await api.pronto;
    expect(dom.window.localStorage.getItem("lg2-turma-b-m02")).toBeNull();
    expect(dom.window.localStorage.getItem("lg2-jornada")).toBe("{\"feitos\":[1,2]}");
    expect(dom.window.localStorage.getItem("outra-coisa")).toBe("fica");
    dom.window.close();
  });

  it("primeiro acesso com progresso antigo: manda tudo para a conta (sem a marca)", async () => {
    const { dom, api, puts } = carregar("https://academy.example.org/lg2/jornada/", { u: "user-1", dados: null, atualizado_em: null }, {
      "lg2-jornada": "{\"feitos\":[1]}",
      "lg2-turma-a-m01": "{\"R\":{}}",
      "nao-e-lg2": "x",
    });
    await api.pronto;
    expect(puts()).toHaveLength(1);
    const [url, init] = puts()[0];
    expect(url).toBe("/api/lg2/progresso");
    expect(init.credentials).toBe("same-origin");
    expect(JSON.parse(String(init.body))).toEqual({ dados: { "lg2-jornada": "{\"feitos\":[1]}", "lg2-turma-a-m01": "{\"R\":{}}" } });
    await new Promise((r) => setTimeout(r, 0));
    expect(JSON.parse(dom.window.localStorage.getItem("lg2-sync") as string)).toEqual({ u: "user-1", em: "2026-11-12T12:00:00.000Z" });
    dom.window.close();
  });

  it("depois de sincronizar, manda de novo só quando algo muda (a cada 5 s e ao sair da página)", async () => {
    const { dom, api, puts, tique } = carregar("https://academy.example.org/lg2/jornada/", { u: "user-1", ...SERV }, {
      "lg2-sync": JSON.stringify({ u: "user-1", em: SERV.atualizado_em }),
      "lg2-jornada": "{\"feitos\":[1,2]}",
    });
    await api.pronto;
    tique();
    expect(puts()).toHaveLength(0);
    dom.window.localStorage.setItem("lg2-turma-a-m03", "{\"R\":{\"a\":1}}");
    tique();
    expect(puts()).toHaveLength(1);
    expect(JSON.parse(String(puts()[0][1].body)).dados["lg2-turma-a-m03"]).toBe("{\"R\":{\"a\":1}}");
    expect(puts()[0][1].keepalive).toBeUndefined();
    await new Promise((r) => setTimeout(r, 0));
    tique();
    expect(puts()).toHaveLength(1);
    dom.window.localStorage.setItem("lg2-turma-a-m03", "{\"R\":{\"a\":2}}");
    dom.window.dispatchEvent(new dom.window.Event("pagehide"));
    expect(puts()).toHaveLength(2);
    expect(puts()[1][1].keepalive).toBe(true);
    dom.window.close();
  });

  it("sem conexão (ou sem login), segue só com o aparelho e não envia nada", async () => {
    const { dom, api, puts } = carregar("https://academy.example.org/lg2/jornada/", null, { "lg2-jornada": "{\"feitos\":[3]}" }, { getFalha: true });
    await expect(api.pronto).resolves.toBe(false);
    dom.window.localStorage.setItem("lg2-jornada", "{\"feitos\":[3,4]}");
    dom.window.dispatchEvent(new dom.window.Event("pagehide"));
    expect(puts()).toHaveLength(0);
    expect(dom.window.localStorage.getItem("lg2-jornada")).toBe("{\"feitos\":[3,4]}");
    dom.window.close();
  });
});
