import React from "react";
import { getLearningPaths } from "@/lib/api/learning-paths";
import { listCoursesServer } from "@/lib/api/courses-server";
import { type LearningPathSummary, type CourseSummary } from "@/lib/api/types";
import TrilhasClient from "@/components/trilhas/TrilhasClient";

const Trilhas = async () => {

  const trilhasData: LearningPathSummary[] = await getLearningPaths();
  const coursesData: CourseSummary[] = await listCoursesServer();

  return <TrilhasClient trilhasData={trilhasData} coursesData={coursesData} />;
};

export default Trilhas;