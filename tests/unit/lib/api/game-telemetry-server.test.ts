import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockClient = {
  auth: { getUser: vi.fn() },
  rpc: vi.fn(),
};

vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => mockClient),
}));

import {
  exportGameAnswers,
  persistGameEvents,
  summarizeGameSessions,
  toCsv,
  GameTelemetryHttpError,
} from "@/lib/api/game-telemetry-server";

const SESSAO = "123e4567-e89b-42d3-a456-426614174000";
const NAVEGACAO = "223e4567-e89b-42d3-a456-426614174000";
const RESPOSTA = "323e4567-e89b-42d3-a456-426614174000";

const lote = {
  sessions: [{
    id: SESSAO,
    gameKey: "cidadania-financeira",
    contentVersion: "2026-09-01",
    scopeKey: "cidadao",
    clientSessionId: NAVEGACAO,
    startedAt: "2026-09-14T12:00:00.000Z",
    status: "em_andamento",
    answeredCount: 1,
  }],
  answers: [{
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
  }],
};

describe("persistGameEvents", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockClient.auth.getUser.mockResolvedValue({ data: { user: { id: "aluno-real" } } });
    mockClient.rpc.mockResolvedValue({ data: { sessions: 1, answers: 1 }, error: null });
  });

  it("envia partida e respostas em snake_case, sem o identificador do aluno", async () => {
    const written = await persistGameEvents(lote);
    expect(written).toEqual({ sessions: 1, answers: 1 });

    const [nome, argumentos] = mockClient.rpc.mock.calls[0];
    expect(nome).toBe("ingest_game_events");
    expect(argumentos.p_sessions[0]).toMatchObject({
      id: SESSAO,
      game_key: "cidadania-financeira",
      client_session_id: NAVEGACAO,
      status: "em_andamento",
    });
    expect(argumentos.p_answers[0]).toMatchObject({
      question_key: "cenario-1",
      answer_key: "A",
      outcome: "correct",
    });
    // A identidade é derivada no banco; o cliente nunca a informa.
    expect(JSON.stringify(argumentos)).not.toContain("user_id");
  });

  it("recusa gravação sem sessão autenticada", async () => {
    mockClient.auth.getUser.mockResolvedValue({ data: { user: null } });
    await expect(persistGameEvents(lote)).rejects.toThrow(GameTelemetryHttpError);
    expect(mockClient.rpc).not.toHaveBeenCalled();
  });

  it("recusa lote inválido antes de tocar no banco", async () => {
    await expect(persistGameEvents({ sessions: [], answers: [] })).rejects.toThrow(/Payload de jogo inválido/);
    expect(mockClient.rpc).not.toHaveBeenCalled();
  });

  it("confere a sessão antes da forma do lote", async () => {
    // Sem login, a resposta não pode revelar o formato aceito pela API.
    mockClient.auth.getUser.mockResolvedValue({ data: { user: null } });
    await expect(persistGameEvents({ lixo: true })).rejects.toThrow(/não autenticado/);
    await expect(persistGameEvents({ sessions: [], answers: [] })).rejects.toThrow(/não autenticado/);
  });
});

describe("exportGameAnswers", () => {
  const original = process.env.GAME_RESEARCH_OPEN_TEXT;

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient.rpc.mockResolvedValue({ data: { total: 0, rows: [] }, error: null });
  });

  afterEach(() => {
    if (original === undefined) delete process.env.GAME_RESEARCH_OPEN_TEXT;
    else process.env.GAME_RESEARCH_OPEN_TEXT = original;
  });

  it("leva o texto aberto por padrão", async () => {
    await exportGameAnswers({ gameKey: "primeiro-passo" });
    expect(mockClient.rpc.mock.calls[0][1]).toMatchObject({
      p_game_key: "primeiro-passo",
      p_include_text: true,
    });
  });

  it("respeita o pedido de exportar sem o texto aberto", async () => {
    await exportGameAnswers({ includeText: false });
    expect(mockClient.rpc.mock.calls[0][1].p_include_text).toBe(false);
  });

  it("não devolve texto quando a plataforma desligou a coleta", async () => {
    process.env.GAME_RESEARCH_OPEN_TEXT = "false";
    await exportGameAnswers({ includeText: true });
    expect(mockClient.rpc.mock.calls[0][1].p_include_text).toBe(false);
  });

  it("recusa jogo fora do catálogo", async () => {
    await expect(exportGameAnswers({ gameKey: "outro" as never })).rejects.toThrow(GameTelemetryHttpError);
    expect(mockClient.rpc).not.toHaveBeenCalled();
  });
});

describe("summarizeGameSessions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockClient.rpc.mockResolvedValue({ data: [{ game_key: "primeiro-passo", sessions: 3 }], error: null });
  });

  it("devolve o panorama por jogo", async () => {
    const resumo = await summarizeGameSessions({ from: "2026-09-01T00:00:00.000Z" });
    expect(resumo[0]).toMatchObject({ game_key: "primeiro-passo", sessions: 3 });
    expect(mockClient.rpc.mock.calls[0][0]).toBe("summarize_game_sessions");
  });
});

describe("toCsv", () => {
  const linha = {
    answer_id: RESPOSTA,
    session_id: SESSAO,
    user_id: "aluno-real",
    game_key: "primeiro-passo" as const,
    content_version: "2026-09-07",
    scope_key: "etapa-1",
    step_index: 0,
    question_key: "oque",
    answer_kind: "texto" as const,
    answer_key: null,
    answer_keys: null,
    answer_number: null,
    answer_text: "bolos caseiros",
    outcome: null,
    points: null,
    elapsed_ms: 4200,
    answered_at: "2026-09-14T12:00:05.000Z",
    session_started_at: "2026-09-14T12:00:00.000Z",
    session_finished_at: null,
    session_status: "em_andamento" as const,
    session_score: null,
    session_max_score: null,
    session_outcome_key: null,
  };

  it("abre com o cabeçalho e uma linha por resposta", () => {
    const csv = toCsv([linha]);
    const [header, body] = csv.split("\r\n");
    expect(header.startsWith("answer_id,session_id,user_id,game_key")).toBe(true);
    expect(body).toContain("bolos caseiros");
    expect(body).toContain("4200");
  });

  it("junta escolha múltipla numa célula só", () => {
    const csv = toCsv([{ ...linha, answer_keys: ["WhatsApp", "Feira"] }]);
    expect(csv).toContain("WhatsApp|Feira");
  });

  it("cerca vírgula, aspas e quebra de linha", () => {
    const csv = toCsv([{ ...linha, answer_text: 'bolos, tortas e "doces"\nsob encomenda' }]);
    expect(csv).toContain('"bolos, tortas e ""doces""\nsob encomenda"');
  });

  it("neutraliza célula que a planilha leria como fórmula", () => {
    const csv = toCsv([{ ...linha, answer_text: "=SOMA(A1:A9)" }]);
    expect(csv).toContain("'=SOMA(A1:A9)");
  });
});
