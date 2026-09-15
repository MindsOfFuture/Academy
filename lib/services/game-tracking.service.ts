"use client";

// ============================================================
// Registro de respostas de jogo no navegador
// Enfileira o que o aluno respondeu e envia em lotes. Cada lote carrega a
// partida junto das respostas, então o servidor sempre sabe a que jornada
// aquele clique pertence, mesmo que o envio anterior tenha se perdido.
// ============================================================

import type {
  GameAnswerInput,
  GameAnswerKind,
  GameAnswerOutcome,
  GameKey,
  GameSessionInput,
} from "@/lib/api/game-telemetry-types";
import {
  MAX_GAME_ANSWERS_PER_BATCH,
} from "@/lib/api/game-telemetry-validation";

const ENDPOINT = "/api/games/events";
const FLUSH_INTERVAL_MS = 1500;
const BATCH_SIZE = 8;
const MAX_QUEUE = 120;
const MAX_RETRIES = 2;

function uuid(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function deviceInfo() {
  if (typeof window === "undefined") return undefined;
  return {
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    browserLanguage: navigator.language || "unknown",
  };
}

export interface AnswerRecord {
  questionKey: string;
  answerKind: GameAnswerKind;
  answerKey?: string;
  answerKeys?: string[];
  answerNumber?: number;
  answerText?: string;
  outcome?: GameAnswerOutcome;
  points?: number;
  scopeKey?: string;
}

export interface FinishRecord {
  score?: number;
  maxScore?: number;
  outcomeKey?: string;
  summary?: Record<string, string | number | boolean>;
}

interface PendingAnswer {
  answer: GameAnswerInput;
  attempts: number;
}

/** Sessão de navegação: liga partidas diferentes feitas na mesma visita. */
let browserSessionId: string | null = null;
function clientSessionId(): string {
  if (!browserSessionId) browserSessionId = uuid();
  return browserSessionId;
}

/**
 * Uma partida. O componente do jogo cria uma ao começar, registra cada resposta
 * e a encerra ao mostrar o resultado.
 */
export class GameRun {
  private readonly sessionId = uuid();
  private readonly startedAt = new Date();
  private readonly startedMs = Date.now();
  private lastAnswerMs = Date.now();
  private stepIndex = 0;
  private answeredCount = 0;
  private finished = false;

  private queue: PendingAnswer[] = [];
  private flushTimer: ReturnType<typeof setTimeout> | null = null;
  private sending: Promise<void> = Promise.resolve();

  constructor(
    private readonly gameKey: GameKey,
    private readonly contentVersion: string,
    private readonly scopeKey?: string,
  ) {
    if (typeof window !== "undefined") {
      window.addEventListener("visibilitychange", this.handleVisibility);
      window.addEventListener("beforeunload", this.handleUnload);
    }
  }

  get id(): string {
    return this.sessionId;
  }

  /** Registra uma resposta e agenda o envio. Nunca lança para o jogo. */
  record(record: AnswerRecord): void {
    if (this.finished) return;
    const now = Date.now();
    const answer: GameAnswerInput = {
      id: uuid(),
      sessionId: this.sessionId,
      gameKey: this.gameKey,
      contentVersion: this.contentVersion,
      stepIndex: this.stepIndex,
      questionKey: record.questionKey,
      answerKind: record.answerKind,
      answeredAt: new Date(now).toISOString(),
      elapsedMs: Math.min(now - this.lastAnswerMs, 3_600_000),
    };
    const scopeKey = record.scopeKey ?? this.scopeKey;
    if (scopeKey) answer.scopeKey = scopeKey;
    if (record.answerKey !== undefined) answer.answerKey = record.answerKey;
    if (record.answerKeys !== undefined) answer.answerKeys = record.answerKeys;
    if (record.answerNumber !== undefined && Number.isFinite(record.answerNumber)) {
      answer.answerNumber = record.answerNumber;
    }
    if (record.answerText !== undefined) answer.answerText = record.answerText;
    if (record.outcome !== undefined) answer.outcome = record.outcome;
    if (record.points !== undefined) answer.points = record.points;

    this.stepIndex += 1;
    this.answeredCount += 1;
    this.lastAnswerMs = now;

    if (this.queue.length >= MAX_QUEUE) this.queue.shift();
    this.queue.push({ answer, attempts: 0 });

    if (this.queue.length >= BATCH_SIZE) void this.flush(false);
    else this.scheduleFlush();
  }

  /** Encerra a partida e envia o que ainda estiver na fila. */
  finish(result: FinishRecord = {}): void {
    if (this.finished) return;
    this.finished = true;
    this.detach();
    void this.flush(true, result);
  }

  /** Abandono: o aluno saiu antes do fim, e isso também é um dado. */
  abandon(): void {
    if (this.finished) return;
    this.detach();
    void this.flush(true);
  }

  private snapshot(result?: FinishRecord): GameSessionInput {
    const session: GameSessionInput = {
      id: this.sessionId,
      gameKey: this.gameKey,
      contentVersion: this.contentVersion,
      clientSessionId: clientSessionId(),
      startedAt: this.startedAt.toISOString(),
      status: this.finished ? "concluida" : "em_andamento",
      answeredCount: this.answeredCount,
      durationSeconds: Math.min(Math.round((Date.now() - this.startedMs) / 1000), 86400),
    };
    if (this.scopeKey) session.scopeKey = this.scopeKey;
    if (this.finished) session.finishedAt = new Date().toISOString();
    const device = deviceInfo();
    if (device) session.deviceInfo = device;
    if (result?.score !== undefined) session.score = Math.round(result.score);
    if (result?.maxScore !== undefined) session.maxScore = Math.round(result.maxScore);
    if (result?.outcomeKey) session.outcomeKey = result.outcomeKey;
    if (result?.summary) session.summary = result.summary;
    return session;
  }

  private scheduleFlush(): void {
    if (this.flushTimer !== null) return;
    this.flushTimer = setTimeout(() => {
      this.flushTimer = null;
      void this.flush(false);
    }, FLUSH_INTERVAL_MS);
  }

  private clearTimer(): void {
    if (this.flushTimer !== null) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
  }

  private async flush(keepalive: boolean, result?: FinishRecord): Promise<void> {
    this.clearTimer();
    if (typeof fetch === "undefined") return;

    // Serializa os envios: dois lotes simultâneos poderiam gravar a partida com
    // contagens fora de ordem.
    this.sending = this.sending.then(async () => {
      const batch = this.queue.splice(0, MAX_GAME_ANSWERS_PER_BATCH);
      if (batch.length === 0 && !result && !keepalive) return;

      const payload = {
        sessions: [this.snapshot(result)],
        answers: batch.map(({ answer }) => answer),
      };
      try {
        const response = await fetch(ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          keepalive,
        });
        if (!response.ok) throw new Error(`HTTP ${response.status || "erro"}`);
      } catch (error) {
        const retryable = batch
          .filter(({ attempts }) => attempts < MAX_RETRIES)
          .map(({ answer, attempts }) => ({ answer, attempts: attempts + 1 }));
        this.queue = [...retryable, ...this.queue].slice(0, MAX_QUEUE);
        console.warn("[GameRun] Falha ao registrar respostas do jogo:", error);
        if (this.queue.length > 0 && !this.finished) this.scheduleFlush();
      }
    });
    await this.sending;
  }

  private detach(): void {
    if (typeof window === "undefined") return;
    window.removeEventListener("visibilitychange", this.handleVisibility);
    window.removeEventListener("beforeunload", this.handleUnload);
  }

  /** A aba sumiu: pode ser troca de janela ou o começo de um fechamento. */
  private handleVisibility = (): void => {
    if (document.visibilityState === "hidden") void this.flush(true);
  };

  /** A página está indo embora: envia o que sobrou sem esperar resposta. */
  private handleUnload = (): void => {
    void this.flush(true);
  };
}

export function startGameRun(gameKey: GameKey, contentVersion: string, scopeKey?: string): GameRun {
  return new GameRun(gameKey, contentVersion, scopeKey);
}
