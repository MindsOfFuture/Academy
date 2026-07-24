import { useEffect, useState } from "react";
import { createClient as createBrowserSupabase } from "@/lib/supabase/client";

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

export function useGlobalAnalytics(filter: DateFilter) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetch() {
      try {
        setLoading(true);
        const supabase = createBrowserSupabase();
        const dates = getDates(filter);
        const { data: result, error } = await supabase.rpc("get_analytics_overview", dates);
        if (error) throw error;
        setData(result);
      } catch (err: any) {
        setError(err);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [filter]);

  return { data, loading, error };
}

export function useCourseAnalytics(courseId: string | null) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!courseId) {
      setData(null);
      setLoading(false);
      return;
    }
    async function fetch() {
      try {
        setLoading(true);
        const supabase = createBrowserSupabase();
        const { data: result, error } = await supabase.rpc("get_analytics_by_course", {
          p_course_id: courseId,
        });
        if (error) throw error;
        setData(result);
      } catch (err: any) {
        setError(err);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [courseId]);

  return { data, loading, error };
}

export function useLearningPathAnalytics(pathId: string | null) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!pathId) {
      setData(null);
      setLoading(false);
      return;
    }
    async function fetch() {
      try {
        setLoading(true);
        const supabase = createBrowserSupabase();
        const { data: result, error } = await supabase.rpc("get_analytics_by_learning_path", {
          p_path_id: pathId,
        });
        if (error) throw error;
        setData(result);
      } catch (err: any) {
        setError(err);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [pathId]);

  return { data, loading, error };
}

export function useStudentAnalytics(userId: string | null) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId) {
      setData(null);
      setLoading(false);
      return;
    }
    async function fetch() {
      try {
        setLoading(true);
        const supabase = createBrowserSupabase();
        const { data: result, error } = await supabase.rpc("get_analytics_by_student", {
          p_user_id: userId,
        });
        if (error) throw error;
        setData(result);
      } catch (err: any) {
        setError(err);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [userId]);

  return { data, loading, error };
}
