// ============================================================
// TrackingService — Serviço centralizado de telemetria client-side
// Usa o Supabase client existente. Append-only, sem dados financeiros.
// ============================================================

import { createClient } from "@/lib/supabase/client";
import type {
  VideoInteractionPayload,
  AssessmentInteractionPayload,
  ContentReviewPayload,
  DeviceInfo,
  QueuedEvent,
  VideoAction,
} from "@/lib/api/telemetry-types";

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
 * trackingService.trackAssessmentInteraction({ ... });
 * trackingService.trackContentReview({ ... });
 * ```
 */
class TrackingService {
  private supabase = createClient();
  private sessionId: string;
  private userId: string | null = null;
  private userIdPromise: Promise<string | null> | null = null;

  private queue: QueuedEvent[] = [];
  private flushTimer: ReturnType<typeof setTimeout> | null = null;
  private initialized = false;

  /** Intervalo máximo entre flushes (ms) */
  private readonly FLUSH_INTERVAL_MS = 2000;
  /** Quantidade de eventos na fila para forçar flush imediato */
  private readonly BATCH_SIZE = 10;

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

    // Pré-carregar user_id
    this.resolveUserId();

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
    this.clearFlushTimer();

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

    this.enqueue("telemetry_video_interaction", {
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
    });
  }

  /**
   * Registra envio de quiz/prova.
   * Device info é capturado apenas na primeira tentativa (attemptNumber === 1).
   */
  async trackAssessmentInteraction(
    payload: AssessmentInteractionPayload,
  ): Promise<void> {
    const userId = await this.resolveUserId();
    if (!userId) return;

    const isInitialEvent = payload.attemptNumber === 1;

    this.enqueue("telemetry_assessment_interaction", {
      user_id: userId,
      course_id: payload.courseId,
      assignment_id: payload.assignmentId,
      enrollment_id: payload.enrollmentId ?? null,
      score: payload.score,
      max_score: payload.maxScore,
      accuracy_rate: payload.accuracyRate,
      attempt_number: payload.attemptNumber,
      time_spent_seconds: payload.timeSpentSeconds ?? null,
      session_id: this.sessionId,
      device_info: isInitialEvent ? this.collectDeviceInfo() : null,
    });
  }

  /**
   * Registra avaliação qualitativa de aula ou curso.
   * Device info é sempre capturado (evento único por natureza).
   */
  async trackContentReview(payload: ContentReviewPayload): Promise<void> {
    const userId = await this.resolveUserId();
    if (!userId) return;

    this.enqueue("telemetry_content_review", {
      user_id: userId,
      course_id: payload.courseId,
      lesson_id: payload.lessonId ?? null,
      enrollment_id: payload.enrollmentId ?? null,
      rating: payload.rating,
      comment: payload.comment ?? null,
      review_scope: payload.reviewScope,
      course_completion_percent: payload.courseCompletionPercent,
      session_id: this.sessionId,
      device_info: this.collectDeviceInfo(),
    });
  }

  // ============================================================
  // Fila e Batching
  // ============================================================

  /**
   * Adiciona evento à fila e agenda flush.
   */
  private enqueue(table: string, data: Record<string, unknown>): void {
    this.queue.push({ table, data });

    if (this.queue.length >= this.BATCH_SIZE) {
      this.flush();
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

    if (!this.userIdPromise) {
      this.userIdPromise = this.supabase.auth
        .getUser()
        .then(({ data }) => {
          this.userId = data?.user?.id ?? null;
          return this.userId;
        })
        .catch(() => null);
    }

    return this.userIdPromise;
  }

  /**
   * Coleta informações do dispositivo (apenas client-side).
   */
  private collectDeviceInfo(): DeviceInfo | null {
    if (typeof window === "undefined") return null;

    return {
      userAgent: navigator.userAgent,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      platform: navigator.platform || "unknown",
      browserLanguage: navigator.language || "unknown",
    };
  }

  /**
   * Gera um ID de sessão único.
   */
  private generateSessionId(): string {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    // Fallback para ambientes sem crypto.randomUUID
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  // ============================================================
  // Event Handlers (bound para remoção correta)
  // ============================================================

  private handleVisibilityChange = (): void => {
    if (document.visibilityState === "hidden") {
      this.flush();
    }
  };

  private handleBeforeUnload = (): void => {
    this.flush();
  };
}

// Singleton exportado
export const trackingService = new TrackingService();
