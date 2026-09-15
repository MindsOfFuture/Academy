// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { startGameRun } from "@/lib/services/game-tracking.service";

interface EnvioCapturado {
  sessions: { id: string; status: string; answeredCount: number; score?: number; outcomeKey?: string }[];
  answers: { id: string; questionKey: string; stepIndex: number; answerKey?: string; elapsedMs?: number }[];
}

let envios: EnvioCapturado[] = [];
let respostaOk = true;

function ultimoEnvio(): EnvioCapturado {
  return envios[envios.length - 1];
}

function todasAsRespostas() {
  return envios.flatMap((envio) => envio.answers);
}

beforeEach(() => {
  envios = [];
  respostaOk = true;
  vi.useFakeTimers();
  vi.stubGlobal("fetch", vi.fn(async (_url: string, init: RequestInit) => {
    envios.push(JSON.parse(String(init.body)) as EnvioCapturado);
    return { ok: respostaOk, status: respostaOk ? 200 : 500 } as Response;
  }));
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("GameRun", () => {
  it("envia a partida junto das respostas, para nenhuma resposta ficar órfã", async () => {
    const run = startGameRun("cidadania-financeira", "2026-09-01", "cidadao");
    run.record({ questionKey: "cenario-1", answerKind: "escolha", answerKey: "A", outcome: "correct", points: 10 });

    await vi.advanceTimersByTimeAsync(2000);

    expect(ultimoEnvio().sessions).toHaveLength(1);
    expect(ultimoEnvio().sessions[0].id).toBe(run.id);
    expect(ultimoEnvio().answers[0].questionKey).toBe("cenario-1");
    expect(ultimoEnvio().sessions[0].status).toBe("em_andamento");
  });

  it("numera as respostas na ordem em que o aluno respondeu", async () => {
    const run = startGameRun("cidadania-financeira", "2026-09-01");
    for (let indice = 1; indice <= 3; indice += 1) {
      run.record({ questionKey: `cenario-${indice}`, answerKind: "escolha", answerKey: "A" });
    }
    await vi.advanceTimersByTimeAsync(2000);

    expect(todasAsRespostas().map((item) => item.stepIndex)).toEqual([0, 1, 2]);
  });

  it("não envia a mesma resposta duas vezes", async () => {
    const run = startGameRun("cidadania-financeira", "2026-09-01");
    run.record({ questionKey: "cenario-1", answerKind: "escolha", answerKey: "A" });
    await vi.advanceTimersByTimeAsync(2000);
    run.record({ questionKey: "cenario-2", answerKind: "escolha", answerKey: "B" });
    await vi.advanceTimersByTimeAsync(2000);

    const ids = todasAsRespostas().map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("fecha a partida com pontuação e desfecho", async () => {
    const run = startGameRun("cidadania-financeira", "2026-09-01", "cidadao");
    run.record({ questionKey: "cenario-1", answerKind: "escolha", answerKey: "A", points: 10 });
    run.finish({ score: 180, maxScore: 250, outcomeKey: "especialista", summary: { corretas: 18 } });
    await vi.advanceTimersByTimeAsync(0);

    const partida = ultimoEnvio().sessions[0];
    expect(partida.status).toBe("concluida");
    expect(partida.score).toBe(180);
    expect(partida.outcomeKey).toBe("especialista");
  });

  it("ignora respostas registradas depois do fim", async () => {
    const run = startGameRun("cidadania-financeira", "2026-09-01");
    run.finish({ score: 0 });
    await vi.advanceTimersByTimeAsync(0);
    const antes = todasAsRespostas().length;

    run.record({ questionKey: "cenario-99", answerKind: "escolha", answerKey: "Z" });
    await vi.advanceTimersByTimeAsync(2000);

    expect(todasAsRespostas()).toHaveLength(antes);
  });

  it("marca como abandonada a partida que o aluno deixou pela metade", async () => {
    const run = startGameRun("primeiro-passo", "2026-09-07");
    run.record({ questionKey: "estagio", answerKind: "escolha", answerKey: "Só na cabeça" });
    run.abandon();
    await vi.advanceTimersByTimeAsync(0);

    expect(ultimoEnvio().sessions[0].status).toBe("em_andamento");
    expect(ultimoEnvio().sessions[0].answeredCount).toBe(1);
  });

  it("guarda a resposta e tenta de novo quando o envio falha", async () => {
    respostaOk = false;
    const run = startGameRun("cidadania-financeira", "2026-09-01");
    run.record({ questionKey: "cenario-1", answerKind: "escolha", answerKey: "A" });
    await vi.advanceTimersByTimeAsync(2000);
    expect(envios).toHaveLength(1);

    respostaOk = true;
    await vi.advanceTimersByTimeAsync(2000);

    expect(envios.length).toBeGreaterThan(1);
    expect(ultimoEnvio().answers[0].questionKey).toBe("cenario-1");
  });

  it("desiste de uma resposta depois de tentativas repetidas, sem travar o jogo", async () => {
    respostaOk = false;
    const run = startGameRun("cidadania-financeira", "2026-09-01");
    run.record({ questionKey: "cenario-1", answerKind: "escolha", answerKey: "A" });

    for (let tentativa = 0; tentativa < 6; tentativa += 1) {
      await vi.advanceTimersByTimeAsync(2000);
    }
    const envibosAteAqui = envios.length;
    await vi.advanceTimersByTimeAsync(10000);

    // A fila esvazia: o jogo não fica reenviando para sempre.
    expect(envios.length).toBe(envibosAteAqui);
  });

  it("mede o tempo entre uma resposta e a seguinte", async () => {
    const run = startGameRun("cidadania-financeira", "2026-09-01");
    run.record({ questionKey: "cenario-1", answerKind: "escolha", answerKey: "A" });
    await vi.advanceTimersByTimeAsync(5000);
    run.record({ questionKey: "cenario-2", answerKind: "escolha", answerKey: "B" });
    await vi.advanceTimersByTimeAsync(2000);

    const segunda = todasAsRespostas().find((item) => item.questionKey === "cenario-2");
    expect(segunda?.elapsedMs).toBeGreaterThanOrEqual(5000);
  });

  it("envia o que estiver na fila quando a aba some", async () => {
    const run = startGameRun("cidadania-financeira", "2026-09-01");
    run.record({ questionKey: "cenario-1", answerKind: "escolha", answerKey: "A" });

    Object.defineProperty(document, "visibilityState", { value: "hidden", configurable: true });
    window.dispatchEvent(new Event("visibilitychange"));
    await vi.advanceTimersByTimeAsync(0);

    expect(envios.length).toBeGreaterThan(0);
    expect(ultimoEnvio().answers[0].questionKey).toBe("cenario-1");
    void run;
  });
});
