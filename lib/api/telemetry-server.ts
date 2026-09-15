import { createClient } from "@/lib/supabase/server";
import { validateLearningEventBatch } from "./telemetry-validation";

export class TelemetryHttpError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
  }
}

export async function persistLearningEvents(input: unknown): Promise<number> {
  const events = validateLearningEventBatch(input);
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData?.user) {
    throw new TelemetryHttpError("Usuário não autenticado.", 401);
  }

  const rows = events.map((event) => ({
    event_id: event.eventId,
    occurred_at: event.occurredAt,
    session_id: event.sessionId,
    event_name: event.eventName,
    route: event.route,
    learning_path_id: event.learningPathId ?? null,
    course_id: event.courseId ?? null,
    lesson_id: event.lessonId ?? null,
    activity_id: event.activityId ?? null,
    metadata: event.metadata ?? {},
  }));

  const { data, error } = await supabase.rpc("ingest_learning_events", {
    p_events: rows,
  });
  if (error) throw new Error(error.message);
  return typeof data === "number" ? data : 0;
}
