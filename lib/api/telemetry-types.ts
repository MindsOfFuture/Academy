// ============================================================
// Telemetry Types — Payloads dos eventos de telemetria
// Escopo estritamente educacional e comportamental (sem dados financeiros)
// ============================================================

// === Payloads de Eventos de Telemetria ===

/** Ações possíveis em um vídeo */
export type VideoAction = "play" | "pause" | "seek" | "complete" | "open_link" | "uncomplete";

/**
 * Payload do evento `video_interaction`.
 * Disparado quando um vídeo é iniciado, pausado, avançado ou finalizado.
 */
export interface VideoInteractionPayload {
  /** UUID do curso */
  courseId: string;
  /** UUID da aula (lesson) */
  lessonId: string;
  /** UUID da matrícula (enrollment, opcional) */
  enrollmentId?: string;
  /** Tipo de interação */
  action: VideoAction;
  /** Timestamp atual do vídeo em segundos */
  videoTimestampSeconds: number;
  /** Duração total do vídeo em segundos */
  videoDurationSeconds: number;
  /** Porcentagem assistida até o momento (0–100) */
  watchedPercent: number;
}

/** Escopo da avaliação: aula ou curso inteiro */
export type ReviewScope = "lesson" | "course";

/** Notas de avaliação válidas (1 a 5 estrelas) */
export type ReviewRating = 1 | 2 | 3 | 4 | 5;

/**
 * Payload do evento `content_reviewed`.
 * Captura avaliação qualitativa do aluno sobre aula/curso,
 * obrigatoriamente com a porcentagem de conclusão no momento do feedback.
 */
export interface ContentReviewPayload {
  /** UUID do curso */
  courseId: string;
  /** UUID da aula (lesson, obrigatório quando reviewScope = 'lesson') */
  lessonId?: string;
  /** UUID da matrícula (enrollment, opcional) */
  enrollmentId?: string;
  /** Nota de 1 a 5 estrelas */
  rating: ReviewRating;
  /** Comentário textual (opcional) */
  comment?: string;
  /** Escopo: avaliação de aula ou do curso inteiro */
  reviewScope: ReviewScope;
  /** Porcentagem de conclusão do curso no momento do feedback (0–100) */
  courseCompletionPercent: number;
}

// === Tipos internos de apoio ao TrackingService ===

/**
 * Informações do dispositivo capturadas automaticamente pelo TrackingService.
 * Registradas apenas em eventos iniciais (play, primeira tentativa de assessment).
 */
export interface DeviceInfo {
  /** User-Agent do navegador */
  userAgent: string;
  /** Largura do viewport */
  viewportWidth: number;
  /** Altura do viewport */
  viewportHeight: number;
  /** Plataforma (navigator.platform) */
  platform: string;
  /** Idioma do navegador (navigator.language) */
  browserLanguage: string;
}

/**
 * Estrutura interna da fila de eventos do TrackingService.
 */
export interface QueuedEvent {
  /** Nome da tabela de destino no Supabase */
  table: string;
  /** Dados a serem inseridos */
  data: Record<string, unknown>;
}
