import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Prova que os três jogos realmente registram o que o aluno responde. Sem isto,
 * o serviço de registro poderia estar perfeito e nenhum jogo chamá-lo.
 *
 * Os cliques usam fireEvent, não userEvent: a simulação de digitação do
 * userEvent depende do relógio real e, com a suíte inteira rodando em paralelo,
 * estoura o limite de tempo — destes testes e dos vizinhos.
 */

interface LoteEnviado {
  sessions: {
    id: string;
    gameKey: string;
    contentVersion: string;
    scopeKey?: string;
    status: string;
    answeredCount: number;
    score?: number;
    outcomeKey?: string;
  }[];
  answers: {
    questionKey: string;
    answerKind: string;
    answerKey?: string;
    answerKeys?: string[];
    answerNumber?: number;
    answerText?: string;
    outcome?: string;
    points?: number;
    scopeKey?: string;
  }[];
}

let lotes: LoteEnviado[] = [];

function respostas() {
  return lotes.flatMap((lote) => lote.answers);
}

function partidas() {
  return lotes.flatMap((lote) => lote.sessions);
}

function clicar(nome: RegExp) {
  fireEvent.click(screen.getByRole("button", { name: nome }));
}

function preencher(rotulo: RegExp | string, valor: string) {
  fireEvent.change(screen.getByLabelText(rotulo), { target: { value: valor } });
}

/**
 * O envio normal só acontece 1,5s depois da resposta. Esperar isso em cada teste
 * tornaria a suíte lenta o bastante para derrubar testes vizinhos. Some-se a
 * aba, como quando o aluno troca de janela: o serviço despeja a fila na hora,
 * pelo mesmo caminho de código, sem a espera.
 */
async function forcarEnvio(condicao: () => void) {
  Object.defineProperty(document, "visibilityState", { value: "hidden", configurable: true });
  window.dispatchEvent(new Event("visibilitychange"));
  await waitFor(condicao, { timeout: 3000 });
  Object.defineProperty(document, "visibilityState", { value: "visible", configurable: true });
}

beforeEach(() => {
  lotes = [];
  window.localStorage.clear();
  vi.stubGlobal("fetch", vi.fn(async (url: string, init: RequestInit) => {
    if (String(url).includes("/api/games/events")) {
      lotes.push(JSON.parse(String(init.body)) as LoteEnviado);
    }
    return { ok: true, status: 200, json: async () => ({ accepted: true }) } as Response;
  }));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Cidadania Financeira registra as decisões do aluno", () => {
  it("guarda a opção escolhida, o acerto e a pontuação", async () => {
    const CidadaniaFinanceiraGame = (
      await import("@/components/modules/cidadania-financeira/CidadaniaFinanceiraGame")
    ).default;
    render(<CidadaniaFinanceiraGame userId="aluno-teste" />);

    clicar(/O Cidadão/i);
    const opcoes = await screen.findAllByRole("button", { name: /^Opção [A-D]:/ });
    fireEvent.click(opcoes[0]);

    await forcarEnvio(() => expect(respostas().length).toBeGreaterThan(0));

    const registrada = respostas()[0];
    expect(registrada.questionKey).toMatch(/^cenario-\d+$/);
    expect(registrada.answerKind).toBe("escolha");
    expect(["A", "B", "C", "D"]).toContain(registrada.answerKey);
    expect(["correct", "partial", "wrong"]).toContain(registrada.outcome);

    const partida = partidas()[0];
    expect(partida.gameKey).toBe("cidadania-financeira");
    // O papel escolhido vira o recorte da partida, para separar na análise.
    expect(partida.scopeKey).toBe("cidadao");
  });
});

describe("Orçamento Familiar registra as decisões do aluno", () => {
  it("guarda a faixa salarial e não guarda o nome digitado", async () => {
    const FinancityGame = (await import("@/components/modules/financity/FinancityGame")).default;
    render(<FinancityGame userId="aluno-teste" />);

    clicar(/Iniciar Nova Sessão/i);
    preencher("Nome", "Maria Silva");
    preencher("Profissão", "professor");
    clicar(/Continuar/i);

    await forcarEnvio(() => expect(respostas().length).toBeGreaterThan(0));

    const chaves = respostas().map((item) => item.questionKey);
    expect(chaves).toContain("salario_bruto");
    expect(chaves).toContain("profissao_reconhecida");

    // O nome fica na tela do aluno, nunca no acervo de pesquisa.
    expect(JSON.stringify(lotes)).not.toContain("Maria Silva");
    expect(chaves).not.toContain("nome");
    expect(partidas()[0].gameKey).toBe("orcamento-familiar");
  });

  it("guarda a escolha de regime na etapa seguinte", async () => {
    const FinancityGame = (await import("@/components/modules/financity/FinancityGame")).default;
    render(<FinancityGame userId="aluno-teste" />);

    clicar(/Iniciar Nova Sessão/i);
    preencher("Nome", "Ana");
    preencher("Profissão", "professor");
    clicar(/Continuar/i);
    clicar(/CLT — carteira assinada/i);
    clicar(/Continuar/i);

    await forcarEnvio(() => {
      expect(respostas().some((item) => item.questionKey === "regime")).toBe(true);
    });
    expect(respostas().find((item) => item.questionKey === "regime")?.answerKey).toBe("CLT");
  });
});

describe("Primeiro Passo registra as respostas da jornada", () => {
  it("guarda escolha, texto escrito à mão e nota de escala, marcando a etapa", async () => {
    const PrimeiroPasso = (await import("@/components/modules/laboratorio-gestao/PrimeiroPasso")).default;
    render(<PrimeiroPasso userId="aluno-teste" />);

    clicar(/Começar/i);
    clicar(/1\. Sua ideia e você/i);

    clicar(/^Já vendo às vezes$/i);
    preencher(/O que você pretende vender/i, "bolos caseiros");
    clicar(/^Meio período$/i);
    clicar(/Nota 4 de 5/i);
    clicar(/Ver o resultado/i);

    await forcarEnvio(() => expect(respostas().length).toBeGreaterThan(2));

    const porChave = new Map(respostas().map((item) => [item.questionKey, item]));
    expect(porChave.get("estagio")?.answerKey).toBe("Já vendo às vezes");
    expect(porChave.get("tempo")?.answerKey).toBe("Meio período");
    expect(porChave.get("confianca")?.answerNumber).toBe(4);
    expect(porChave.get("oque")?.answerText).toBe("bolos caseiros");
    expect(porChave.get("oque")?.answerKind).toBe("texto");
    // A etapa vira o recorte, para a análise saber de onde veio a resposta.
    expect(porChave.get("estagio")?.scopeKey).toBe("etapa-1");
    expect(partidas()[0].gameKey).toBe("primeiro-passo");
  });
});
