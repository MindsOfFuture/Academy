"use client";
import { useEffect, useState } from "react";
import {
  getCourseDetail,
  addModule,
  addLesson,
  updateCourse,
  deleteCourse,
  removeModule,
  removeLesson,
} from "@/lib/api/courses";

export default function useCourse(courseId: string) {
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const refreshCourse = async () => {
    const data = await getCourseDetail(courseId);
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
    insertModule: addModule,
    insertLesson: addLesson,
    updateCurso: updateCourse,
    deleteCurso: deleteCourse,
    deleteModule: removeModule,
    deleteLesson: removeLesson,
  };
}
