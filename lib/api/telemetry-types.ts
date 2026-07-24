// ============================================================
// Telemetry Types — Interfaces para metadados e eventos de telemetria
// Escopo estritamente educacional e comportamental (sem dados financeiros)
// ============================================================

// === Entidade: Metadados do Curso (Catálogo) ===

/**
 * Representação enriquecida do catálogo de um curso,
 * combinando dados de `course`, `course_module`, `lesson` e `course_tag/tag`.
 */
export interface CourseMetadata {
  /** UUID do curso */
  id: string;
  /** Título do curso */
  title: string;
  /** Descrição do curso */
  description: string | null;
  /** Idioma principal do conteúdo (BCP 47, ex: 'pt-BR') */
  language: string;
  /** Categoria principal para taxonomia do catálogo */
  category: string | null;
  /** Array de subcategorias */
  subcategories: string[];
  /** Tags de habilidades específicas (extraído de course_tag → tag) */
  skillTags: string[];
  /** Quantidade de módulos (computed: count de course_module) */
  moduleCount: number;
  /** Número total de aulas (computed: count de lesson) */
  totalLessons: number;
  /** Carga horária total em minutos (computed: sum de lesson.duration_minutes) */
  totalDurationMinutes: number;
  /** UUID do instrutor/autor (owner_id) */
  instructorId: string | null;
  /** Data de criação do curso (ISO 8601) */
  createdAt: string;
  /** Data da última atualização do conteúdo (ISO 8601) */
  updatedAt: string;
}

// === Entidade: Metadados do Usuário (Aluno) ===

/**
 * Preferências de notificação do aluno.
 */
export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  inApp: boolean;
}

/**
 * Metadados do aluno para contexto de telemetria.
 * Combina dados de `user_profile`, `student_details`, `class_group` e `class_student`.
 */
export interface StudentMetadata {
  /** UUID do aluno */
  id: string;
  /** Fuso horário local (IANA, ex: 'America/Sao_Paulo') */
  timezone: string;
  /** Preferências de notificação */
  notificationPreferences: NotificationPreferences;
  /** Departamento (contexto corporativo, opcional) */
  department?: string | null;
  /** Grupo corporativo (opcional) */
  corporateGroup?: string | null;
  /** UUID da turma (class_group.id, opcional) */
  classGroupId?: string | null;
  /** Nome da turma (class_group.name, opcional) */
  classGroupName?: string | null;
}

// === Payloads de Eventos de Telemetria ===

/** Ações possíveis em um vídeo */
export type VideoAction = "play" | "pause" | "seek" | "complete";

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

/**
 * Payload do evento `assessment_interaction`.
 * Disparado no envio de quizzes/provas.
 */
export interface AssessmentInteractionPayload {
  /** UUID do curso */
  courseId: string;
  /** UUID do quiz/prova (assignment) */
  assignmentId: string;
  /** UUID da matrícula (enrollment, opcional) */
  enrollmentId?: string;
  /** Nota obtida */
  score: number;
  /** Nota máxima possível */
  maxScore: number;
  /** Taxa de acerto (0–100) */
  accuracyRate: number;
  /** Número da tentativa (1 = primeira vez) */
  attemptNumber: number;
  /** Tempo gasto em segundos (opcional) */
  timeSpentSeconds?: number;
}

/** Marcos de progresso válidos */
export type MilestonePercent = 25 | 50 | 75 | 100;

/**
 * Payload do evento `course_milestone_reached`.
 * Disparado quando o aluno atinge 25%, 50%, 75% ou 100% de conclusão.
 * Nota: este evento também é gerado automaticamente pelo trigger do banco.
 */
export interface CourseMilestonePayload {
  /** UUID do curso */
  courseId: string;
  /** UUID da matrícula (enrollment) */
  enrollmentId: string;
  /** Porcentagem do milestone alcançado */
  milestonePercent: MilestonePercent;
  /** Total de aulas no curso */
  totalLessons: number;
  /** Aulas concluídas até o momento */
  completedLessons: number;
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

// === Union Types para o TrackingService ===

/** Nomes dos eventos de telemetria */
export type TelemetryEventName =
  | "video_interaction"
  | "assessment_interaction"
  | "course_milestone_reached"
  | "content_reviewed";

/** Union de todos os payloads de telemetria */
export type TelemetryPayload =
  | VideoInteractionPayload
  | AssessmentInteractionPayload
  | CourseMilestonePayload
  | ContentReviewPayload;

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
