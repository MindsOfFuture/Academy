import { createClient } from "@/lib/supabase/server";
import type { LearningEventName } from "./telemetry-types";

export interface LearningEventRow {
  event_id: string;
  occurred_at: string;
  received_at: string;
  user_id: string;
  session_id: string;
  event_name: LearningEventName;
  route: string;
  learning_path_id: string | null;
  course_id: string | null;
  lesson_id: string | null;
  activity_id: string | null;
  metadata: Record<string, string | number | boolean>;
}

/** Envelope devolvido pela RPC transacional: um único snapshot de statement. */
export interface LearningEventSnapshotEnvelope {
  overflow: boolean;
  events: LearningEventRow[];
  student_user_ids: string[];
}

export interface LearningAnalyticsResult {
  hasData: boolean;
  totalInteractions: number;
  activeStudents: number;
  sessions: number;
  dailyInteractions: { day: string; interactions: number }[];
  funnel: { eventName: LearningEventName; label: string; students: number }[];
  topCourses: { id: string; accesses: number }[];
  topResources: { id: string; accesses: number }[];
  lastEventAt: string | null;
  eventCounts: Partial<Record<LearningEventName, number>>;
  recentActivity: RecentLearningActivity[];
}

export interface RecentLearningActivity {
  receivedAt: string;
  eventName: LearningEventName;
  route: string;
  learningPathId: string | null;
  courseId: string | null;
  lessonId: string | null;
  activityId: string | null;
}

const FUNNEL: { eventName: LearningEventName; label: string }[] = [
  { eventName: "course_opened", label: "Abriram curso" },
  { eventName: "course_enrolled", label: "Matricularam-se" },
  { eventName: "lesson_opened", label: "Abriram aula" },
  { eventName: "lesson_completed", label: "Concluíram aula" },
  { eventName: "certificate_generated", label: "Emitiram certificado" },
];
const MAX_ANALYTICS_ROWS = 100_000;
const SNAPSHOT_RPC = "collect_learning_analytics_snapshot";

function rank(ids: (string | null)[]) {
  const counts = new Map<string, number>();
  for (const id of ids) if (id) counts.set(id, (counts.get(id) ?? 0) + 1);
  return [...counts.entries()]
    .map(([id, accesses]) => ({ id, accesses }))
    .sort((a, b) => b.accesses - a.accesses || a.id.localeCompare(b.id))
    .slice(0, 10);
}

export function aggregateLearningEvents(
  rows: LearningEventRow[],
  studentUserIds?: ReadonlySet<string>,
): LearningAnalyticsResult {
  const sorted = [...rows].sort((a, b) =>
    b.received_at.localeCompare(a.received_at) || b.event_id.localeCompare(a.event_id));
  const studentRows = studentUserIds
    ? rows.filter((row) => studentUserIds.has(row.user_id))
    : rows;
  const eventCounts: Partial<Record<LearningEventName, number>> = {};
  const daily = new Map<string, number>();
  for (const row of rows) {
    eventCounts[row.event_name] = (eventCounts[row.event_name] ?? 0) + 1;
    const day = row.received_at.slice(0, 10);
    daily.set(day, (daily.get(day) ?? 0) + 1);
  }

  return {
    hasData: rows.length > 0,
    totalInteractions: rows.length,
    activeStudents: new Set(studentRows.map((row) => row.user_id)).size,
    sessions: new Set(rows.map((row) => row.session_id)).size,
    dailyInteractions: [...daily.entries()]
      .map(([day, interactions]) => ({ day, interactions }))
      .sort((a, b) => a.day.localeCompare(b.day)),
    funnel: FUNNEL.map(({ eventName, label }) => ({
      eventName,
      label,
      students: new Set(studentRows.filter((row) => row.event_name === eventName).map((row) => row.user_id)).size,
    })),
    topCourses: rank(rows.filter((row) => row.event_name === "course_opened").map((row) => row.course_id)),
    topResources: rank(rows.filter((row) => row.event_name === "resource_opened").map((row) => row.lesson_id ?? row.activity_id)),
    lastEventAt: sorted[0]?.received_at ?? null,
    eventCounts,
    // O navegador recebe somente a projeção necessária para a linha do tempo,
    // nunca event_id, user_id, session_id ou metadata das linhas cruas.
    recentActivity: sorted.slice(0, 20).map((row) => ({
      receivedAt: row.received_at,
      eventName: row.event_name,
      route: row.route,
      learningPathId: row.learning_path_id,
      courseId: row.course_id,
      lessonId: row.lesson_id,
      activityId: row.activity_id,
    })),
  };
}

export type AnalyticsScope = "global" | "path" | "course" | "student";

export async function getLearningAnalytics(params: {
  scope: AnalyticsScope;
  id?: string;
  from?: string;
  to?: string;
}): Promise<LearningAnalyticsResult> {
  // Cliente SSR autenticado: a RPC é SECURITY DEFINER e confere o papel admin
  // pelo auth.uid() do chamador, então a service role fica fora deste caminho.
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) {
    throw new Error("Usuário não autenticado.");
  }
  // Uma requisição só: o Postgres lê o conjunto limitado de eventos e a
  // classificação de papéis sob o mesmo snapshot, então inserção concorrente
  // nunca entra pela metade no agregado.
  // ponytail: envelope jsonb de até 100 mil eventos na memória do Next;
  // agregar dentro do Postgres se esse teto for atingido.
  const { data, error } = await supabase.rpc(SNAPSHOT_RPC, {
    p_scope: params.scope,
    p_id: params.id ?? null,
    p_from: params.from ?? null,
    p_to: params.to ?? null,
    p_limit: MAX_ANALYTICS_ROWS,
  });
  if (error) throw new Error(error.message);

  const snapshot = data as LearningEventSnapshotEnvelope | null;
  if (!snapshot) throw new Error("Snapshot de telemetria indisponível.");
  if (snapshot.overflow) {
    throw new Error("Volume de telemetria excede o limite seguro de 100 mil eventos para agregação.");
  }

  return aggregateLearningEvents(snapshot.events ?? [], new Set(snapshot.student_user_ids ?? []));
}
