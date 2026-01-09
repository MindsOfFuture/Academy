"use client";
import { useEffect, useState, useCallback } from "react";
import {
  getCourseDetail,
  addModule,
  addLesson,
  updateCourse,
  deleteCourse,
  removeModule,
  removeLesson,
} from "@/lib/api/courses";
import { type CourseDetail } from "@/lib/api/types";

export default function useCourse(courseId: string) {
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshCourse = useCallback(async () => {
    const data = await getCourseDetail(courseId);
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
    insertModule: addModule,
    insertLesson: addLesson,
    updateCurso: updateCourse,
    deleteCurso: deleteCourse,
    deleteModule: removeModule,
    deleteLesson: removeLesson,
  };
}
