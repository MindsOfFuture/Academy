import React from "react";
import { getLearningPaths } from "@/lib/api/learning-paths";
import { type LearningPathSummary } from "@/lib/api/types";
import TrilhasClient from "@/components/trilhas/TrilhasClient";

const Trilhas = async () => {

  const trilhasData: LearningPathSummary[] = await getLearningPaths();

  return <TrilhasClient trilhasData={trilhasData} />;
};

export default Trilhas;