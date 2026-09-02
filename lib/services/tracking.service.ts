// ============================================================
// TrackingService — Serviço centralizado de telemetria client-side
// Usa o Supabase client existente. Append-only, sem dados financeiros.
// ============================================================

import { createClient } from "@/lib/supabase/client";
import type {
  VideoInteractionPayload,
  ContentReviewPayload,
  DeviceInfo,
  QueuedEvent,
  LearningEventInput,
  LearningEventName,
} from "@/lib/api/telemetry-types";
import { MAX_TELEMETRY_BATCH_SIZE } from "@/lib/api/telemetry-validation";

type LearningEventContext = Partial<Pick<
  LearningEventInput,
  "learningPathId" | "courseId" | "lessonId" | "activityId" | "metadata" | "route"
>>;
type PendingLearningEvent = { event: LearningEventInput; attempts: number };

/**
 * Serviço singleton de tracking de telemetria educacional.
 *
 * Características:
 * - Batching com fila e flush periódico (2s) ou por threshold (10 eventos)
 * - Session ID único por sessão de navegação
 * - Device info capturado apenas em eventos iniciais (play, 1ª tentativa)
 * - Flush automático on exit (visibilitychange / beforeunload)
 * - Obtém user_id automaticamente via supabase.auth.getUser()
 *
 * Uso:
 * ```ts
 * import { trackingService } from '@/lib/services/tracking.service';
 *
 * // Inicializar no layout principal (app/layout.tsx ou _app.tsx)
 * trackingService.init();
 *
 * // Disparar eventos nos componentes
 * trackingService.trackVideoInteraction({ ... });
 * trackingService.trackContentReview({ ... });
 * ```
 */
export class TrackingService {
  private supabase = createClient();
  private sessionId: string;
  private userId: string | null = null;
  private userIdPromise: Promise<string | null> | null = null;

  private queue: QueuedEvent[] = [];
  private learningQueue: PendingLearningEvent[] = [];
  private flushTimer: ReturnType<typeof setTimeout> | null = null;
  private learningFlushTimer: ReturnType<typeof setTimeout> | null = null;
  private initialized = false;

  /** Intervalo máximo entre flushes (ms) */
  private readonly FLUSH_INTERVAL_MS = 2000;
  /** Quantidade de eventos na fila para forçar flush imediato */
  private readonly BATCH_SIZE = 10;
  private readonly MAX_QUEUE_SIZE = 100;
  private readonly MAX_RETRIES = 2;

  constructor() {
    this.sessionId = this.generateSessionId();
  }

  // ============================================================
  // Lifecycle
  // ============================================================

  /**
   * Inicializa o serviço: registra listeners de saída da página.
   * Chamar uma vez no layout principal da aplicação.
   */
  init(): void {
    if (this.initialized || typeof window === "undefined") return;
    this.initialized = true;

    // Resolver autenticação antes de registrar o início da sessão.
    void this.trackLearningEvent("session_started");

    // Flush ao sair ou mudar de aba
    window.addEventListener("visibilitychange", this.handleVisibilityChange);
    window.addEventListener("beforeunload", this.handleBeforeUnload);
  }

  /**
   * Destrói o serviço: faz flush final e remove listeners.
   */
  destroy(): void {
    if (!this.initialized) return;

    this.flush();
    void this.flushLearningEvents(true);
    this.clearFlushTimer();
    this.clearLearningFlushTimer();

    window.removeEventListener("visibilitychange", this.handleVisibilityChange);
    window.removeEventListener("beforeunload", this.handleBeforeUnload);

    this.initialized = false;
  }

  // ============================================================
  // Eventos Públicos
  // ============================================================

  /**
   * Registra interação com vídeo (play, pause, seek, complete).
   * Device info é capturado apenas no evento `play`.
   */
  async trackVideoInteraction(payload: VideoInteractionPayload): Promise<void> {
    const userId = await this.resolveUserId();
    if (!userId) return;

    const isInitialEvent = payload.action === "play";

    await this.enqueue(
      "telemetry_video_interaction",
      {
        user_id: userId,
        course_id: payload.courseId,
        lesson_id: payload.lessonId,
        enrollment_id: payload.enrollmentId ?? null,
        action: payload.action,
        video_timestamp_seconds: payload.videoTimestampSeconds,
        video_duration_seconds: payload.videoDurationSeconds,
        watched_percent: payload.watchedPercent,
        session_id: this.sessionId,
        device_info: isInitialEvent ? this.collectDeviceInfo() : null,
      },
      true // forceFlush para não perder cliques se o usuário fechar a aba
    );
  }

  /**
   * Registra avaliação qualitativa de aula ou curso.
   * Device info é sempre capturado (evento único por natureza).
   */
  async trackContentReview(payload: ContentReviewPayload): Promise<void> {
    const userId = await this.resolveUserId();
    if (!userId) return;

    await this.enqueue(
      "telemetry_content_review",
      {
        user_id: userId,
        course_id: payload.courseId,
        lesson_id: payload.lessonId ?? null,
        enrollment_id: payload.enrollmentId ?? null,
        rating: payload.rating,
        review_scope: payload.reviewScope,
        course_completion_percent: payload.courseCompletionPercent,
        session_id: this.sessionId,
        device_info: this.collectDeviceInfo(),
      },
      true // forceFlush para eventos acionados ativamente pelo usuário
    );
  }

  /** Registra uma ação educacional sem conteúdo livre ou identidade do cliente. */
  async trackLearningEvent(eventName: LearningEventName, context: LearningEventContext = {}): Promise<void> {
    const userId = await this.resolveUserId();
    if (!userId || typeof window === "undefined") return;

    const event: LearningEventInput = {
      eventId: this.generateUuid(),
      occurredAt: new Date().toISOString(),
      sessionId: this.sessionId,
      eventName,
      route: context.route ?? this.currentRoute(),
      ...(context.learningPathId ? { learningPathId: context.learningPathId } : {}),
      ...(context.courseId ? { courseId: context.courseId } : {}),
      ...(context.lessonId ? { lessonId: context.lessonId } : {}),
      ...(context.activityId ? { activityId: context.activityId } : {}),
      metadata: context.metadata ?? {},
    };

    if (this.learningQueue.length >= this.MAX_QUEUE_SIZE) {
      this.learningQueue.shift();
      console.warn("[TrackingService] Fila de telemetria cheia; evento mais antigo descartado.");
    }
    this.learningQueue.push({ event, attempts: 0 });
    if (this.learningQueue.length >= this.BATCH_SIZE) {
      await this.flushLearningEvents(false);
    } else {
      this.scheduleLearningFlush();
    }
  }

  // ============================================================
  // Fila e Batching
  // ============================================================

  /**
   * Adiciona evento à fila e agenda flush.
   */
  private async enqueue(table: string, data: Record<string, unknown>, forceFlush = false): Promise<void> {
    this.queue.push({ table, data });

    if (forceFlush || this.queue.length >= this.BATCH_SIZE) {
      await this.flush();
    } else {
      this.scheduleFlush();
    }
  }

  /**
   * Agenda um flush periódico (se ainda não agendado).
   */
  private scheduleFlush(): void {
    if (this.flushTimer !== null) return;

    this.flushTimer = setTimeout(() => {
      this.flushTimer = null;
      this.flush();
    }, this.FLUSH_INTERVAL_MS);
  }

  /**
   * Limpa o timer de flush.
   */
  private clearFlushTimer(): void {
    if (this.flushTimer !== null) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
  }

  private scheduleLearningFlush(): void {
    if (this.learningFlushTimer !== null) return;
    this.learningFlushTimer = setTimeout(() => {
      this.learningFlushTimer = null;
      void this.flushLearningEvents(false);
    }, this.FLUSH_INTERVAL_MS);
  }

  private clearLearningFlushTimer(): void {
    if (this.learningFlushTimer !== null) {
      clearTimeout(this.learningFlushTimer);
      this.learningFlushTimer = null;
    }
  }

  private async flushLearningEvents(keepalive: boolean): Promise<void> {
    this.clearLearningFlushTimer();
    if (this.learningQueue.length === 0 || typeof fetch === "undefined") return;

    const batch = this.learningQueue.splice(0, MAX_TELEMETRY_BATCH_SIZE);
    try {
      const response = await fetch("/api/telemetry/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ events: batch.map(({ event }) => event) }),
        keepalive,
      });
      if (!response.ok) throw new Error(`HTTP ${response.status || "erro"}`);
    } catch (error) {
      const retryable = batch
        .filter(({ attempts }) => attempts < this.MAX_RETRIES)
        .map(({ event, attempts }) => ({ event, attempts: attempts + 1 }));
      this.learningQueue = [...retryable, ...this.learningQueue].slice(0, this.MAX_QUEUE_SIZE);
      console.warn("[TrackingService] Falha ao enviar telemetria semântica:", error);
    }

    if (this.learningQueue.length > 0) this.scheduleLearningFlush();
  }

  /**
   * Processa a fila: agrupa eventos por tabela e faz INSERT em batch.
   * Erros são logados silenciosamente para não impactar o UX.
   */
  private async flush(): Promise<void> {
    this.clearFlushTimer();

    if (this.queue.length === 0) return;

    // Copia e limpa a fila atomicamente
    const events = [...this.queue];
    this.queue = [];

    // Agrupa por tabela para batch inserts
    const grouped = new Map<string, Record<string, unknown>[]>();
    for (const event of events) {
      const batch = grouped.get(event.table) || [];
      batch.push(event.data);
      grouped.set(event.table, batch);
    }

    // Executa inserts em paralelo por tabela
    const promises = Array.from(grouped.entries()).map(
      async ([table, rows]) => {
        try {
          const { error } = await this.supabase.from(table).insert(rows);
          if (error) {
            console.error(`[TrackingService] Erro ao inserir em ${table}:`, error.message);
            // Re-enqueue eventos que falharam para retry no próximo flush
            for (const row of rows) {
              this.queue.push({ table, data: row });
            }
          }
        } catch (err) {
          console.error(`[TrackingService] Exceção ao inserir em ${table}:`, err);
        }
      },
    );

    await Promise.allSettled(promises);
  }

  // ============================================================
  // Helpers Internos
  // ============================================================

  /**
   * Obtém o user_id do usuário autenticado (com cache).
   */
  private async resolveUserId(): Promise<string | null> {
    if (this.userId) return this.userId;

    if (this.userIdPromise) return this.userIdPromise;

    this.userIdPromise = this.supabase.auth
      .getUser()
      .then(({ data }) => {
        if (data?.user?.id) {
          this.userId = data.user.id;
          return this.userId;
        }
        // Não fazer cache de null, tentar novamente na próxima
        this.userIdPromise = null;
        return null;
      })
      .catch((err) => {
        console.warn("[TrackingService] Falha ao obter usuário:", err);
        this.userIdPromise = null;
        return null;
      });

    return this.userIdPromise;
  }

  /**
   * Coleta informações do dispositivo (apenas client-side).
   */
  private collectDeviceInfo(): DeviceInfo | null {
    if (typeof window === "undefined") return null;

    return {
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      browserLanguage: navigator.language || "unknown",
    };
  }

  private currentRoute(): string {
    const path = window.location.pathname.replace(/\/{2,}/g, "/").replace(/\/$/, "");
    return path || "/";
  }

  private generateUuid(): string {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  /**
   * Gera um ID de sessão único.
   */
  private generateSessionId(): string {
    return this.generateUuid();
  }

  // ============================================================
  // Event Handlers (bound para remoção correta)
  // ============================================================

  private handleVisibilityChange = (): void => {
    if (document.visibilityState === "hidden") {
      this.flush();
      void this.flushLearningEvents(true);
    }
  };

  private handleBeforeUnload = (): void => {
    this.flush();
    void this.flushLearningEvents(true);
  };
}

// Singleton exportado
export const trackingService = new TrackingService();
