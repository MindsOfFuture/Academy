"use client";
import { useCallback, useEffect, useState } from "react";
import {
  getCursoCompleto,
  insertModule,
  insertLesson,
  updateCurso,
  deleteCurso,
  deleteModule,
  deleteLesson,
  CourseWithModules,
} from "@/components/api/courseApi";

export default function useCourse(courseId: string) {
  const [course, setCourse] = useState<CourseWithModules | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshCourse = useCallback(async () => {
    const data = await getCursoCompleto(courseId);
    setCourse(data);
  }, [courseId]);

  useEffect(() => {
    setLoading(true);
    refreshCourse().finally(() => setLoading(false));
  }, [refreshCourse]);

  return {
    course,
    loading,
    refreshCourse,
    insertModule,
    insertLesson,
    updateCurso,
    deleteCurso,
    deleteModule,
    deleteLesson,
  };
}
