import { createAdminClient } from "@/lib/supabase/server";
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

export interface LearningEventSnapshotCursor {
  receivedAt: string;
  eventId: string;
}

export interface LearningEventSnapshotPage {
  limit: number;
  upperBound?: LearningEventSnapshotCursor;
  after?: LearningEventSnapshotCursor;
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
const ANALYTICS_PAGE_SIZE = 1000;
const MAX_ANALYTICS_ROWS = 100_000;
const ROLE_LOOKUP_BATCH_SIZE = 500;

type FetchLearningEventPage = (page: LearningEventSnapshotPage) => Promise<LearningEventRow[]>;

function cursorFor(row: LearningEventRow): LearningEventSnapshotCursor {
  return { receivedAt: row.received_at, eventId: row.event_id };
}

export async function collectLearningEventSnapshot(
  fetchPage: FetchLearningEventPage,
): Promise<LearningEventRow[]> {
  const [latest] = await fetchPage({ limit: 1 });
  if (!latest) return [];

  const upperBound = cursorFor(latest);
  const rows: LearningEventRow[] = [];
  let after: LearningEventSnapshotCursor | undefined;

  while (rows.length < MAX_ANALYTICS_ROWS) {
    const limit = Math.min(ANALYTICS_PAGE_SIZE, MAX_ANALYTICS_ROWS - rows.length);
    const page = await fetchPage({ limit, upperBound, after });
    rows.push(...page);
    if (page.length < limit) return rows;
    after = cursorFor(page[page.length - 1]);
  }

  const overflow = await fetchPage({ limit: 1, upperBound, after });
  if (overflow.length > 0) {
    throw new Error("Volume de telemetria excede o limite seguro de 100 mil eventos para agregação.");
  }
  return rows;
}

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

async function resolveStudentUserIds(
  admin: Awaited<ReturnType<typeof createAdminClient>>,
  rows: LearningEventRow[],
): Promise<Set<string>> {
  const userIds = [...new Set(rows.map((row) => row.user_id))];
  if (userIds.length === 0) return new Set();

  const roleLinks: { user_profile_id: string; role_id: number }[] = [];
  for (let index = 0; index < userIds.length; index += ROLE_LOOKUP_BATCH_SIZE) {
    const { data, error } = await admin
      .from("user_role")
      .select("user_profile_id, role_id")
      .in("user_profile_id", userIds.slice(index, index + ROLE_LOOKUP_BATCH_SIZE));
    if (error) throw new Error(error.message);
    roleLinks.push(...((data ?? []) as { user_profile_id: string; role_id: number }[]));
  }

  const roleIds = [...new Set(roleLinks
    .map((link) => link.role_id)
    .filter((id): id is number => typeof id === "number"))];
  const roleNamesById = new Map<number, string>();
  if (roleIds.length > 0) {
    const { data: roles, error: rolesError } = await admin
      .from("role")
      .select("id, name")
      .in("id", roleIds);
    if (rolesError) throw new Error(rolesError.message);
    for (const role of roles ?? []) roleNamesById.set(role.id, role.name);
  }

  const namesByUser = new Map<string, Set<string>>();
  for (const link of roleLinks) {
    const name = roleNamesById.get(link.role_id);
    if (!name) continue;
    const names = namesByUser.get(link.user_profile_id) ?? new Set<string>();
    names.add(name);
    namesByUser.set(link.user_profile_id, names);
  }

  return new Set(userIds.filter((userId) => {
    const names = namesByUser.get(userId);
    if (!names || names.size === 0) return true;
    if (names.has("admin") || names.has("teacher")) return false;
    return names.has("student");
  }));
}

export async function getLearningAnalytics(params: {
  scope: AnalyticsScope;
  id?: string;
  from?: string;
  to?: string;
}): Promise<LearningAnalyticsResult> {
  const admin = await createAdminClient();
  // ponytail: agrega até 100 mil linhas no Next; migrar para RPC SQL se esse teto for atingido.
  const buildQuery = () => {
    let query = admin
      .from("telemetry_learning_event")
      .select("event_id, occurred_at, received_at, user_id, session_id, event_name, route, learning_path_id, course_id, lesson_id, activity_id, metadata")
      .order("received_at", { ascending: false })
      .order("event_id", { ascending: false });

    if (params.from) query = query.gte("received_at", params.from);
    if (params.to) query = query.lte("received_at", params.to);
    if (params.scope === "path" && params.id) query = query.eq("learning_path_id", params.id);
    if (params.scope === "course" && params.id) query = query.eq("course_id", params.id);
    if (params.scope === "student" && params.id) query = query.eq("user_id", params.id);
    return query;
  };

  const rows = await collectLearningEventSnapshot(async ({ limit, upperBound, after }) => {
    let query = buildQuery();
    const cursor = after ?? upperBound;
    if (cursor) {
      const eventIdOperator = after ? "lt" : "lte";
      query = query.or(
        `received_at.lt.${cursor.receivedAt},and(received_at.eq.${cursor.receivedAt},event_id.${eventIdOperator}.${cursor.eventId})`,
      );
    }

    const { data, error } = await query.limit(limit);
    if (error) throw new Error(error.message);
    return (data ?? []) as LearningEventRow[];
  });
  const studentUserIds = await resolveStudentUserIds(admin, rows);
  return aggregateLearningEvents(rows, studentUserIds);
}
