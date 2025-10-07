"use client";
import { useEffect, useState } from "react";
import {
  getCursoCompleto,
  insertModule,
  insertLesson,
  updateCurso,
  deleteCurso,
  deleteModule,
  deleteLesson,
} from "@/components/api/courseApi";

export default function useCourse(courseId: string) {
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const refreshCourse = async () => {
    const data = await getCursoCompleto(courseId);
    setCourse(data);
  };

  useEffect(() => {
    setLoading(true);
    refreshCourse().finally(() => setLoading(false));
  }, [courseId]);

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
