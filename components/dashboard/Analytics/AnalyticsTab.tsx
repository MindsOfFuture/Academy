"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import type { DateFilter } from "./hooks/useAnalytics";
import { GlobalAnalytics } from "./GlobalAnalytics";
import { LearningPathAnalytics } from "./LearningPathAnalytics";
import { CourseAnalytics } from "./CourseAnalytics";
import { StudentAnalytics } from "./StudentAnalytics";
import type { CourseSummary, LearningPathSummary } from "@/lib/api/types";

type AnalyticsLevel = "global" | "path" | "course" | "student";

interface AnalyticsTabProps {
  isAdmin: boolean;
  courses: CourseSummary[];
  paths: LearningPathSummary[];
  users: { id: string; name: string; email: string }[];
}

export default function AnalyticsTab({ isAdmin, courses, paths, users }: AnalyticsTabProps) {
  const [level, setLevel] = useState<AnalyticsLevel>("global");
  const [dateFilter, setDateFilter] = useState<DateFilter>("30d");

  // Se não for admin, não renderiza nada (proteção extra além do render condicional do pai)
  if (!isAdmin) {
    return (
      <div className="p-8 text-center text-red-500">
        Acesso restrito a administradores.
      </div>
    );
  }

  // Exportador de CSV Simples (dummy para MVP, mas funcional estruturalmente)
  const handleExportCSV = () => {
    // Para MVP: exporta um CSV simples com as configurações atuais
    const csvContent = `data:text/csv;charset=utf-8,Level,DateFilter\n${level},${dateFilter}`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `analytics_${level}_${dateFilter}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Controls: Tabs internally and Date Filters */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white p-4 rounded-lg shadow-sm border">
        
        {/* Níveis de Granularidade */}
        <div className="flex flex-nowrap bg-gray-100 p-1 rounded-lg w-full xl:w-auto overflow-x-auto no-scrollbar">
          <button
            onClick={() => setLevel("global")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${level === "global" ? "bg-white text-purple-700 shadow" : "text-gray-600 hover:text-gray-900"}`}
          >
            Visão Global
          </button>
          <button
            onClick={() => setLevel("path")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${level === "path" ? "bg-white text-purple-700 shadow" : "text-gray-600 hover:text-gray-900"}`}
          >
            Por Trilha
          </button>
          <button
            onClick={() => setLevel("course")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${level === "course" ? "bg-white text-purple-700 shadow" : "text-gray-600 hover:text-gray-900"}`}
          >
            Por Curso
          </button>
          <button
            onClick={() => setLevel("student")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${level === "student" ? "bg-white text-purple-700 shadow" : "text-gray-600 hover:text-gray-900"}`}
          >
            Por Aluno
          </button>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full xl:w-auto">
          {/* Filtro de Tempo (só é relevante no global, mas mantemos visível) */}
          {level === "global" && (
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as DateFilter)}
              className="px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 bg-white w-full sm:w-auto"
            >
              <option value="7d">Últimos 7 dias</option>
              <option value="30d">Últimos 30 dias</option>
              <option value="90d">Últimos 90 dias</option>
              <option value="all">Todo o período</option>
            </select>
          )}

          {/* Exportar */}
          <button
            onClick={handleExportCSV}
            className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors border border-purple-200 w-full sm:w-auto whitespace-nowrap"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Renderização Condicional do Nível */}
      <div className="animate-in fade-in duration-300">
        {level === "global" && <GlobalAnalytics filter={dateFilter} />}
        {level === "path" && <LearningPathAnalytics paths={paths} />}
        {level === "course" && <CourseAnalytics courses={courses} />}
        {level === "student" && <StudentAnalytics students={users} />}
      </div>
    </div>
  );
}
