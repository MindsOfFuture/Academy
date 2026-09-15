// ============================================================
// Registro de respostas dos jogos — contrato de dados
// Escopo de pesquisa educacional: o que o aluno escolheu, quando e com que
// resultado. Nome, contato e qualquer identificação direta ficam de fora.
// ============================================================

export const GAME_KEYS = [
  "orcamento-familiar",
  "cidadania-financeira",
  "primeiro-passo",
] as const;

export type GameKey = (typeof GAME_KEYS)[number];

export const GAME_LABELS: Record<GameKey, string> = {
  "orcamento-familiar": "Orçamento Familiar do Futuro",
  "cidadania-financeira": "Cidadania Financeira",
  "primeiro-passo": "Primeiro Passo",
};

/**
 * Versão do conteúdo de cada jogo. Trocar pergunta, opção ou pontuação exige
 * subir esta marca: sem ela, respostas colhidas sob regras diferentes ficam
 * misturadas na mesma série e a comparação deixa de significar alguma coisa.
 */
export const GAME_CONTENT_VERSIONS: Record<GameKey, string> = {
  "orcamento-familiar": "2026-09-01",
  "cidadania-financeira": "2026-09-01",
  "primeiro-passo": "2026-09-07",
};

export const GAME_ANSWER_KINDS = [
  "escolha",
  "multipla",
  "numero",
  "escala",
  "texto",
] as const;

export type GameAnswerKind = (typeof GAME_ANSWER_KINDS)[number];

export type GameAnswerOutcome = "correct" | "partial" | "wrong";

export type GameSessionStatus = "em_andamento" | "concluida";

export interface GameSessionInput {
  /** UUID gerado no navegador; é a chave da partida em todo o histórico. */
  id: string;
  gameKey: GameKey;
  contentVersion: string;
  /** Recorte interno do jogo: papel, módulo ou trilha. */
  scopeKey?: string;
  /** UUID da sessão de navegação, para ligar partidas da mesma visita. */
  clientSessionId: string;
  startedAt: string;
  finishedAt?: string;
  status: GameSessionStatus;
  answeredCount: number;
  score?: number;
  maxScore?: number;
  /** Desfecho classificado pelo jogo: perfil, patente, diagnóstico. */
  outcomeKey?: string;
  durationSeconds?: number;
  deviceInfo?: { viewportWidth: number; viewportHeight: number; browserLanguage: string };
  summary?: Record<string, string | number | boolean>;
}

export interface GameAnswerInput {
  /** UUID gerado no navegador; repetição de envio não duplica a linha. */
  id: string;
  sessionId: string;
  gameKey: GameKey;
  contentVersion: string;
  scopeKey?: string;
  stepIndex: number;
  questionKey: string;
  answerKind: GameAnswerKind;
  answerKey?: string;
  answerKeys?: string[];
  answerNumber?: number;
  answerText?: string;
  outcome?: GameAnswerOutcome;
  points?: number;
  elapsedMs?: number;
  answeredAt: string;
}

export interface GameEventBatch {
  sessions: GameSessionInput[];
  answers: GameAnswerInput[];
}

// === Leitura para pesquisa ===

export interface GameAnswerExportRow {
  answer_id: string;
  session_id: string;
  user_id: string;
  game_key: GameKey;
  content_version: string;
  scope_key: string | null;
  step_index: number;
  question_key: string;
  answer_kind: GameAnswerKind;
  answer_key: string | null;
  answer_keys: string[] | null;
  answer_number: number | null;
  answer_text: string | null;
  outcome: GameAnswerOutcome | null;
  points: number | null;
  elapsed_ms: number | null;
  answered_at: string;
  session_started_at: string;
  session_finished_at: string | null;
  session_status: GameSessionStatus;
  session_score: number | null;
  session_max_score: number | null;
  session_outcome_key: string | null;
}

export interface GameAnswerExport {
  total: number;
  limit: number;
  offset: number;
  includes_text: boolean;
  rows: GameAnswerExportRow[];
}

export interface GameSessionSummaryRow {
  game_key: GameKey;
  sessions: number;
  sessions_concluidas: number;
  students: number;
  answers: number;
  media_duracao_segundos: number | null;
  media_pontuacao: number | null;
  ultima_partida: string | null;
}
