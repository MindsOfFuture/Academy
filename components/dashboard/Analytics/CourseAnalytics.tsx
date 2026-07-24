"use client";

import { useState } from "react";
import { useCourseAnalytics } from "./hooks/useAnalytics";
import { EmptyState } from "./charts/EmptyState";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Treemap } from "recharts";
import type { CourseSummary } from "@/lib/api/types";

interface CourseAnalyticsProps {
  courses: CourseSummary[];
}

export function CourseAnalytics({ courses }: CourseAnalyticsProps) {
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(courses[0]?.id || null);
  const { data, loading, error } = useCourseAnalytics(selectedCourseId);

  return (
    <div className="space-y-6">
      {/* Seletor de Curso */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-lg shadow-sm border">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Visão por Curso</h3>
          <p className="text-sm text-gray-500">Mergulhe nos dados específicos de um curso.</p>
        </div>
        <select
          value={selectedCourseId || ""}
          onChange={(e) => setSelectedCourseId(e.target.value)}
          className="w-full sm:w-auto px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 bg-white"
        >
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
      </div>

      {loading && <div className="p-8 text-center text-gray-500">Carregando dados do curso...</div>}
      {error && <div className="p-8 text-center text-red-500">Erro ao carregar dados.</div>}
      {!loading && !error && data && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Retenção de Aulas */}
          <div className="bg-white rounded-lg shadow-sm border p-4 lg:col-span-2">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Retenção de Aulas (Started vs Completed)</h3>
            {data.lesson_retention && data.lesson_retention.length > 0 ? (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.lesson_retention}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="lesson_title" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={60} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="started" name="Iniciaram" fill="#C4AADF" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="completed" name="Concluíram" fill="#684A97" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState message="Sem interações de vídeo neste curso." />
            )}
          </div>

          {/* Distribuição de Estrelas */}
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribuição de Avaliações</h3>
            {data.rating_distribution && data.rating_distribution.length > 0 ? (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart layout="vertical" data={data.rating_distribution}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" />
                    <YAxis dataKey="rating" type="category" tickFormatter={(v) => `${v} Estrelas`} width={80} />
                    <Tooltip formatter={(value) => [value, "Reviews"]} />
                    <Bar dataKey="count" fill="#EAB308" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState message="Nenhuma avaliação registrada." />
            )}
          </div>

          {/* Heatmap (Aulas mais pausadas) */}
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Aulas com Mais Pausas (Pontos de Atrito)</h3>
            {data.pause_heatmap && data.pause_heatmap.length > 0 ? (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <Treemap
                    data={data.pause_heatmap.map((h: any) => ({
                      name: h.lesson_title,
                      size: h.pause_count,
                      avgPos: h.avg_pause_position,
                    }))}
                    dataKey="size"
                    aspectRatio={4 / 3}
                    stroke="#fff"
                    fill="#8B6BB9"
                  >
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const p = payload[0].payload;
                          return (
                            <div className="bg-white p-2 border shadow-sm text-sm">
                              <p className="font-semibold">{p.name}</p>
                              <p>Pausas: {p.size}</p>
                              <p>Posição média: {Math.round(p.avgPos / 60)} min</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </Treemap>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState message="Sem pausas frequentes detectadas." />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
