import React from "react";
import { getLearningPaths } from "@/lib/api/learning-paths";
import { listCoursesServer } from "@/lib/api/courses-server";
import { type LearningPathSummary, type CourseSummary } from "@/lib/api/types";
import TrilhasClient from "@/components/trilhas/TrilhasClient";

const Trilhas = async () => {

  // As duas listas não dependem uma da outra: busca junto.
  const [trilhasData, coursesData]: [LearningPathSummary[], CourseSummary[]] = await Promise.all([
    getLearningPaths(),
    listCoursesServer(),
  ]);

  return <TrilhasClient trilhasData={trilhasData} coursesData={coursesData} />;
};

export default Trilhas;