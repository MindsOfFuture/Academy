"use client";

import { useState } from "react";
import { useCourseAnalytics } from "./hooks/useAnalytics";
import { EmptyState } from "./charts/EmptyState";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { CourseSummary } from "@/lib/api/types";
import { LEARNING_EVENT_LABELS, type LearningEventName } from "@/lib/api/telemetry-types";

interface CourseAnalyticsProps {
  courses: CourseSummary[];
}

export function CourseAnalytics({ courses }: CourseAnalyticsProps) {
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(courses[0]?.id || null);
  const { data, loading, error, semanticError } = useCourseAnalytics(selectedCourseId);
  const learningEvents = data?.learning_events;

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

      {!loading && !error && (
        <section className="rounded-lg border bg-white p-4 shadow-sm" aria-label="Telemetria semântica do curso">
          <h3 className="text-lg font-semibold text-gray-900">Interações no curso</h3>
          {semanticError ? (
            <p className="mt-2 text-sm text-red-600">Telemetria semântica indisponível; os gráficos históricos permanecem abaixo.</p>
          ) : !learningEvents?.hasData ? (
            <p className="mt-2 text-sm text-gray-500">Nenhuma interação semântica registrada neste curso.</p>
          ) : (
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded bg-purple-50 p-3"><p className="text-xs text-gray-500">Interações</p><strong>{learningEvents.totalInteractions}</strong></div>
                <div className="rounded bg-purple-50 p-3"><p className="text-xs text-gray-500">Sessões</p><strong>{learningEvents.sessions}</strong></div>
                <div className="rounded bg-purple-50 p-3"><p className="text-xs text-gray-500">Alunos ativos</p><strong>{learningEvents.activeStudents}</strong></div>
                <div className="col-span-3 rounded bg-gray-50 p-3 text-sm">
                  <p className="font-medium text-gray-700">Contagens por ação</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {Object.entries(learningEvents.eventCounts).map(([name, count]) => (
                      <span key={name} className="rounded-full bg-white px-3 py-1 text-xs text-gray-700 shadow-sm">
                        {LEARNING_EVENT_LABELS[name as LearningEventName]}: {String(count)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <p className="font-medium text-gray-700">Atividade recente</p>
                <ul className="mt-2 max-h-48 space-y-2 overflow-y-auto">
                  {learningEvents.recentActivity.map((activity: { eventName: LearningEventName; receivedAt: string }, index: number) => (
                    <li key={`${activity.receivedAt}-${index}`} className="flex justify-between gap-3 rounded bg-gray-50 px-3 py-2 text-sm">
                      <span>{LEARNING_EVENT_LABELS[activity.eventName]}</span>
                      <time className="text-xs text-gray-500">{new Date(activity.receivedAt).toLocaleString("pt-BR")}</time>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </section>
      )}

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

          {/* Drop-off de Aulas */}
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Funil de Aulas (Drop-off)</h3>
            {data.lesson_dropoff && data.lesson_dropoff.length > 0 ? (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.lesson_dropoff}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="lesson_title"
                      tick={{ fontSize: 11 }}
                      tickFormatter={(value) => (value.length > 15 ? `${value.substring(0, 15)}...` : value)}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip cursor={{ fill: "transparent" }} />
                    <Legend />
                    <Bar dataKey="opened" name="Iniciaram (Acessos)" fill="#8B6BB9" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="completed" name="Concluíram" fill="#10B981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState message="Nenhum dado de acesso a aulas registrado." />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
