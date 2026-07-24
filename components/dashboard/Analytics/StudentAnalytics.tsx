"use client";

import { useState } from "react";
import { useStudentAnalytics } from "./hooks/useAnalytics";
import { EmptyState } from "./charts/EmptyState";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";
import { PlayCircle, CheckCircle, FileText, Calendar, Building, MapPin } from "lucide-react";


// Mock prop for students list, you might want to fetch this differently in a real app
interface StudentAnalyticsProps {
  // Ideally, an autocomplete search. For MVP, we'll pass a list or just use a simple select
  students: { id: string; name: string; email: string }[];
}

export function StudentAnalytics({ students }: StudentAnalyticsProps) {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(students[0]?.id || null);
  const { data, loading, error } = useStudentAnalytics(selectedUserId);

  return (
    <div className="space-y-6">
      {/* Seletor de Aluno */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-lg shadow-sm border">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Visão por Aluno</h3>
          <p className="text-sm text-gray-500">Analise o engajamento e habilidades de um aluno específico.</p>
        </div>
        <select
          value={selectedUserId || ""}
          onChange={(e) => setSelectedUserId(e.target.value)}
          className="w-full sm:w-auto px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 bg-white"
        >
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.email})
            </option>
          ))}
        </select>
      </div>

      {loading && <div className="p-8 text-center text-gray-500">Carregando dados do aluno...</div>}
      {error && <div className="p-8 text-center text-red-500">Erro ao carregar dados.</div>}
      {!loading && !error && data && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Radar de Skills */}
          <div className="bg-white rounded-lg shadow-sm border p-4 lg:col-span-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Habilidades Desenvolvidas</h3>
            {data.skill_tags && data.skill_tags.length > 0 ? (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data.skill_tags}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="skill" tick={{ fontSize: 11 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 'auto']} />
                    <Radar name="Cursos Concluídos" dataKey="courses_completed" stroke="#684A97" fill="#684A97" fillOpacity={0.5} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState message="Nenhuma habilidade mapeada (requer conclusão de cursos com tags)." />
            )}
            
            {/* Contexto Corporativo */}
            {data.student_context && (
              <div className="mt-6 pt-4 border-t space-y-2 text-sm text-gray-600">
                {data.student_context.department && (
                  <p className="flex items-center gap-2"><Building className="w-4 h-4 text-purple-500" /> Dept: {data.student_context.department}</p>
                )}
                {data.student_context.timezone && (
                  <p className="flex items-center gap-2"><MapPin className="w-4 h-4 text-purple-500" /> Fuso: {data.student_context.timezone}</p>
                )}
              </div>
            )}
          </div>

          {/* Cursos Matriculados */}
          <div className="bg-white rounded-lg shadow-sm border p-4 lg:col-span-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Cursos Matriculados</h3>
            {data.enrollments && data.enrollments.length > 0 ? (
              <div className="space-y-4 max-h-72 overflow-y-auto pr-2">
                {data.enrollments.map((e: any) => {
                  const pct = e.total_lessons > 0 ? Math.round((e.completed_lessons / e.total_lessons) * 100) : 0;
                  return (
                    <div key={e.enrollment_id} className="p-3 bg-gray-50 rounded-lg border">
                      <p className="font-medium text-sm text-gray-900 mb-1 line-clamp-1">{e.course_title}</p>
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>{e.completed_lessons} / {e.total_lessons} aulas</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div className="bg-purple-600 h-1.5 rounded-full" style={{ width: `${pct}%` }}></div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <EmptyState message="Não matriculado em nenhum curso." />
            )}
          </div>

          {/* Histórico Cronológico */}
          <div className="bg-white rounded-lg shadow-sm border p-4 lg:col-span-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Atividade Recente</h3>
            {data.recent_activity && data.recent_activity.length > 0 ? (
              <div className="space-y-4 max-h-72 overflow-y-auto pr-2">
                {data.recent_activity.map((act: any, i: number) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {act.type === "video" ? (
                        act.detail === "complete" ? <CheckCircle className="w-4 h-4 text-green-500" /> : <PlayCircle className="w-4 h-4 text-blue-500" />
                      ) : (
                        <FileText className="w-4 h-4 text-purple-500" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{act.context}</p>
                      <p className="text-xs text-gray-500 line-clamp-1">{act.course_title}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(act.created_at).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState message="Nenhuma atividade recente encontrada." />
            )}
          </div>

        </div>
      )}
    </div>
  );
}
