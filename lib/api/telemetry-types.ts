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
  /** Largura do viewport */
  viewportWidth: number;
  /** Altura do viewport */
  viewportHeight: number;
  /** Idioma do navegador (navigator.language) */
  browserLanguage: string;
}

export const LEARNING_EVENT_NAMES = [
  "session_started",
  "page_viewed",
  "learning_path_opened",
  "course_opened",
  "course_enrolled",
  "lesson_opened",
  "resource_opened",
  "lesson_completed",
  "lesson_uncompleted",
  "assignment_opened",
  "assignment_submitted",
  "chat_message_sent",
  "certificate_generated",
] as const;

export type LearningEventName = (typeof LEARNING_EVENT_NAMES)[number];

export const LEARNING_EVENT_LABELS: Record<LearningEventName, string> = {
  session_started: "Sessão iniciada",
  page_viewed: "Página acessada",
  learning_path_opened: "Trilha acessada",
  course_opened: "Curso acessado",
  course_enrolled: "Matrícula realizada",
  lesson_opened: "Aula acessada",
  resource_opened: "Recurso acessado",
  lesson_completed: "Aula concluída",
  lesson_uncompleted: "Conclusão desmarcada",
  assignment_opened: "Atividade acessada",
  assignment_submitted: "Atividade entregue",
  chat_message_sent: "Mensagem enviada",
  certificate_generated: "Certificado emitido",
};

export interface LearningEventInput {
  eventId: string;
  occurredAt: string;
  sessionId: string;
  eventName: LearningEventName;
  route: string;
  learningPathId?: string;
  courseId?: string;
  lessonId?: string;
  activityId?: string;
  metadata?: Record<string, string | number | boolean>;
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
