import { describe, expect, it } from "vitest";
import {
  MAX_GAME_ANSWERS_PER_BATCH,
  validateGameEventBatch,
} from "@/lib/api/game-telemetry-validation";

const SESSAO = "123e4567-e89b-42d3-a456-426614174000";
const NAVEGACAO = "223e4567-e89b-42d3-a456-426614174000";
const RESPOSTA = "323e4567-e89b-42d3-a456-426614174000";

function partida(overrides: Record<string, unknown> = {}) {
  return {
    id: SESSAO,
    gameKey: "cidadania-financeira",
    contentVersion: "2026-09-01",
    scopeKey: "cidadao",
    clientSessionId: NAVEGACAO,
    startedAt: "2026-09-14T12:00:00.000Z",
    status: "em_andamento",
    answeredCount: 1,
    ...overrides,
  };
}

function resposta(overrides: Record<string, unknown> = {}) {
  return {
    id: RESPOSTA,
    sessionId: SESSAO,
    gameKey: "cidadania-financeira",
    contentVersion: "2026-09-01",
    stepIndex: 0,
    questionKey: "cenario-1",
    answerKind: "escolha",
    answerKey: "A",
    outcome: "correct",
    points: 10,
    answeredAt: "2026-09-14T12:00:05.000Z",
    ...overrides,
  };
}

function validar(input: unknown, allowText = true) {
  return validateGameEventBatch(input, allowText);
}

describe("validateGameEventBatch", () => {
  it("aceita uma partida com a resposta correspondente", () => {
    const batch = validar({ sessions: [partida()], answers: [resposta()] });
    expect(batch.sessions).toHaveLength(1);
    expect(batch.answers).toHaveLength(1);
    expect(batch.answers[0].answerKey).toBe("A");
  });

  it("guarda a opção como o aluno a leu, com acento", () => {
    const batch = validar({
      sessions: [partida({ gameKey: "primeiro-passo", contentVersion: "2026-09-07" })],
      answers: [resposta({
        gameKey: "primeiro-passo",
        contentVersion: "2026-09-07",
        questionKey: "tempo",
        answerKey: "Meio período",
        outcome: undefined,
        points: undefined,
      })],
    });
    expect(batch.answers[0].answerKey).toBe("Meio período");
  });

  it("aceita escolha múltipla, número e escala", () => {
    const batch = validar({
      sessions: [partida({ gameKey: "primeiro-passo", contentVersion: "2026-09-07" })],
      answers: [
        resposta({
          id: "423e4567-e89b-42d3-a456-426614174000",
          gameKey: "primeiro-passo", contentVersion: "2026-09-07",
          questionKey: "canais", answerKind: "multipla",
          answerKey: undefined, answerKeys: ["WhatsApp", "Feira"],
          outcome: undefined, points: undefined,
        }),
        resposta({
          id: "523e4567-e89b-42d3-a456-426614174000",
          gameKey: "primeiro-passo", contentVersion: "2026-09-07",
          questionKey: "custo", answerKind: "numero",
          answerKey: undefined, answerNumber: 8.5,
          outcome: undefined, points: undefined,
        }),
        resposta({
          id: "623e4567-e89b-42d3-a456-426614174000",
          gameKey: "primeiro-passo", contentVersion: "2026-09-07",
          questionKey: "confianca", answerKind: "escala",
          answerKey: undefined, answerNumber: 4,
          outcome: undefined, points: undefined,
        }),
      ],
    });
    expect(batch.answers.map((item) => item.answerKind)).toEqual(["multipla", "numero", "escala"]);
  });

  it("guarda o texto escrito à mão quando a coleta está ligada", () => {
    const batch = validar({
      sessions: [partida({ gameKey: "primeiro-passo", contentVersion: "2026-09-07" })],
      answers: [resposta({
        gameKey: "primeiro-passo", contentVersion: "2026-09-07",
        questionKey: "oque", answerKind: "texto",
        answerKey: undefined, answerText: "  bolos caseiros por encomenda  ",
        outcome: undefined, points: undefined,
      })],
    });
    expect(batch.answers[0].answerText).toBe("bolos caseiros por encomenda");
  });

  it("descarta o texto quando a coleta está desligada, sem derrubar o lote", () => {
    expect(() => validar({
      sessions: [partida({ gameKey: "primeiro-passo", contentVersion: "2026-09-07" })],
      answers: [resposta({
        gameKey: "primeiro-passo", contentVersion: "2026-09-07",
        questionKey: "oque", answerKind: "texto",
        answerKey: undefined, answerText: "bolos caseiros",
        outcome: undefined, points: undefined,
      })],
    }, false)).toThrow(/sem conteúdo registrável/);
  });

  it.each([
    ["e-mail no texto", { answerText: "me chama em aluno@escola.br" }],
    ["CPF no texto", { answerText: "meu cpf 123.456.789-01" }],
    ["telefone no texto", { answerText: "liga (32) 98876-7327" }],
  ])("recusa %s", (_label, overrides) => {
    expect(() => validar({
      sessions: [partida({ gameKey: "primeiro-passo", contentVersion: "2026-09-07" })],
      answers: [resposta({
        gameKey: "primeiro-passo", contentVersion: "2026-09-07",
        questionKey: "oque", answerKind: "texto", answerKey: undefined,
        outcome: undefined, points: undefined, ...overrides,
      })],
    })).toThrow(/identificação direta/);
  });

  it.each([
    ["pergunta que pede o nome", { questionKey: "nome_do_aluno" }],
    ["pergunta que pede e-mail", { questionKey: "email" }],
    ["pergunta que pede telefone", { questionKey: "telefone" }],
  ])("não registra %s", (_label, overrides) => {
    expect(() => validar({ sessions: [partida()], answers: [resposta(overrides)] }))
      .toThrow(/identificação não é registrada/);
  });

  it.each([
    ["jogo fora do catálogo", { gameKey: "jogo-inventado" }],
    ["identidade informada pelo cliente", { userId: SESSAO }],
    ["tipo de resposta desconhecido", { answerKind: "desenho" }],
    ["desfecho fora do catálogo", { outcome: "quase" }],
    ["resposta sem valor", { answerKey: undefined }],
    ["texto em resposta de escolha", { answerText: "explicação" }],
  ])("recusa resposta com %s", (_label, overrides) => {
    expect(() => validar({ sessions: [partida()], answers: [resposta(overrides)] })).toThrow();
  });

  it.each([
    ["partida concluída sem data de fim", { status: "concluida" }],
    ["data de fim sem status de conclusão", { finishedAt: "2026-09-14T12:10:00.000Z" }],
    ["status inventado", { status: "pausada" }],
    ["campo desconhecido", { apelido: "turma A" }],
  ])("recusa partida com %s", (_label, overrides) => {
    expect(() => validar({ sessions: [partida(overrides)], answers: [] })).toThrow();
  });

  it("recusa resposta sem a partida correspondente no lote", () => {
    expect(() => validar({
      sessions: [],
      answers: [resposta()],
    })).toThrow(/acompanhada da sua partida/);
  });

  it("recusa lote vazio e lote grande demais", () => {
    expect(() => validar({ sessions: [], answers: [] })).toThrow(/lote vazio/);
    const muitas = Array.from({ length: MAX_GAME_ANSWERS_PER_BATCH + 1 }, () => resposta());
    expect(() => validar({ sessions: [partida()], answers: muitas })).toThrow(/no máximo/);
  });

  it("recusa campo proibido no resumo da partida", () => {
    expect(() => validar({
      sessions: [partida({ summary: { nome: "Maria" } })],
      answers: [],
    })).toThrow(/campo proibido em summary/);
  });

  it("aceita resumo com números e devolve a partida concluída inteira", () => {
    const batch = validar({
      sessions: [partida({
        status: "concluida",
        finishedAt: "2026-09-14T12:10:00.000Z",
        answeredCount: 25,
        score: 180,
        maxScore: 250,
        outcomeKey: "especialista",
        durationSeconds: 600,
        summary: { corretas: 18, parciais: 4, erradas: 3 },
      })],
      answers: [],
    });
    expect(batch.sessions[0]).toMatchObject({
      status: "concluida",
      score: 180,
      maxScore: 250,
      outcomeKey: "especialista",
      durationSeconds: 600,
    });
  });
});
