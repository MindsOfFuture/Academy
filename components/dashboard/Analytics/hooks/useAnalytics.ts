import { useEffect, useState } from "react";
import { createClient as createBrowserSupabase } from "@/lib/supabase/client";
import type { LearningAnalyticsResult } from "@/lib/api/learning-analytics";

export type DateFilter = "7d" | "30d" | "90d" | "all";

function getDates(filter: DateFilter) {
  const to = new Date();
  const from = new Date();
  if (filter === "7d") from.setDate(from.getDate() - 7);
  else if (filter === "30d") from.setDate(from.getDate() - 30);
  else if (filter === "90d") from.setDate(from.getDate() - 90);
  else from.setFullYear(2000); // "all"
  return {
    p_date_from: from.toISOString(),
    p_date_to: to.toISOString(),
  };
}

async function fetchLearningEvents(
  scope: "global" | "path" | "course" | "student",
  id?: string,
  range?: { from: string; to: string },
): Promise<LearningAnalyticsResult> {
  const params = new URLSearchParams({ scope });
  if (id) params.set("id", id);
  if (range) {
    params.set("from", range.from);
    params.set("to", range.to);
  }
  const response = await fetch(`/api/analytics/events?${params.toString()}`);
  const body = await response.json();
  if (!response.ok) {
    throw new Error(body?.error || "Erro ao carregar telemetria semântica.");
  }
  return body as LearningAnalyticsResult;
}

function asError(value: unknown): Error {
  return value instanceof Error ? value : new Error("Erro ao carregar métricas.");
}

function withLearningEvents(result: unknown, learningEvents: LearningAnalyticsResult | null) {
  const legacy = result && typeof result === "object" ? result : {};
  return { ...legacy, learning_events: learningEvents };
}

export function useGlobalAnalytics(filter: DateFilter) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [semanticError, setSemanticError] = useState<Error | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        setSemanticError(null);
        const supabase = createBrowserSupabase();
        const dates = getDates(filter);
        const { data: result, error } = await supabase.rpc("get_analytics_overview", dates);
        if (error) throw error;
        let learningEvents: LearningAnalyticsResult | null = null;
        try {
          learningEvents = await fetchLearningEvents("global", undefined, {
            from: dates.p_date_from,
            to: dates.p_date_to,
          });
        } catch (semanticFailure) {
          setSemanticError(asError(semanticFailure));
        }
        setData(withLearningEvents(result, learningEvents));
      } catch (err: unknown) {
        setError(asError(err));
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [filter]);

  return { data, loading, error, semanticError };
}

export function useCourseAnalytics(courseId: string | null) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [semanticError, setSemanticError] = useState<Error | null>(null);

  useEffect(() => {
    if (!courseId) {
      setData(null);
      setLoading(false);
      return;
    }
    async function load() {
      try {
        setLoading(true);
        setError(null);
        setSemanticError(null);
        const supabase = createBrowserSupabase();
        const { data: result, error } = await supabase.rpc("get_analytics_by_course", {
          p_course_id: courseId,
        });
        if (error) throw error;
        let learningEvents: LearningAnalyticsResult | null = null;
        try {
          learningEvents = await fetchLearningEvents("course", courseId ?? undefined);
        } catch (semanticFailure) {
          setSemanticError(asError(semanticFailure));
        }
        setData(withLearningEvents(result, learningEvents));
      } catch (err: unknown) {
        setError(asError(err));
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [courseId]);

  return { data, loading, error, semanticError };
}

export function useLearningPathAnalytics(pathId: string | null) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [semanticError, setSemanticError] = useState<Error | null>(null);

  useEffect(() => {
    if (!pathId) {
      setData(null);
      setLoading(false);
      return;
    }
    async function load() {
      try {
        setLoading(true);
        setError(null);
        setSemanticError(null);
        const supabase = createBrowserSupabase();
        const { data: result, error } = await supabase.rpc("get_analytics_by_learning_path", {
          p_path_id: pathId,
        });
        if (error) throw error;
        let learningEvents: LearningAnalyticsResult | null = null;
        try {
          learningEvents = await fetchLearningEvents("path", pathId ?? undefined);
        } catch (semanticFailure) {
          setSemanticError(asError(semanticFailure));
        }
        setData(withLearningEvents(result, learningEvents));
      } catch (err: unknown) {
        setError(asError(err));
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [pathId]);

  return { data, loading, error, semanticError };
}

export function useStudentAnalytics(userId: string | null) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [semanticError, setSemanticError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId) {
      setData(null);
      setLoading(false);
      return;
    }
    async function load() {
      try {
        setLoading(true);
        setError(null);
        setSemanticError(null);
        const supabase = createBrowserSupabase();
        const { data: result, error } = await supabase.rpc("get_analytics_by_student", {
          p_user_id: userId,
        });
        if (error) throw error;
        let learningEvents: LearningAnalyticsResult | null = null;
        try {
          learningEvents = await fetchLearningEvents("student", userId ?? undefined);
        } catch (semanticFailure) {
          setSemanticError(asError(semanticFailure));
        }
        setData(withLearningEvents(result, learningEvents));
      } catch (err: unknown) {
        setError(asError(err));
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [userId]);

  return { data, loading, error, semanticError };
}
