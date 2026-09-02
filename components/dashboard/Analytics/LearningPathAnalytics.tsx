"use client";

import { useState } from "react";
import { useLearningPathAnalytics } from "./hooks/useAnalytics";
import { EmptyState } from "./charts/EmptyState";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { LearningPathSummary } from "@/lib/api/types";
import { LEARNING_EVENT_LABELS, type LearningEventName } from "@/lib/api/telemetry-types";

interface LearningPathAnalyticsProps {
  paths: LearningPathSummary[];
}

export function LearningPathAnalytics({ paths }: LearningPathAnalyticsProps) {
  const [selectedPathId, setSelectedPathId] = useState<string | null>(paths[0]?.id || null);
  const { data, loading, error, semanticError } = useLearningPathAnalytics(selectedPathId);
  const learningEvents = data?.learning_events;

  return (
    <div className="space-y-6">
      {/* Seletor de Trilha */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-lg shadow-sm border">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Visão por Trilha</h3>
          <p className="text-sm text-gray-500">Selecione uma trilha para ver os dados agregados dos seus cursos.</p>
        </div>
        <select
          value={selectedPathId || ""}
          onChange={(e) => setSelectedPathId(e.target.value)}
          className="w-full sm:w-auto px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 bg-white"
        >
          {paths.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </select>
      </div>

      {!loading && !error && (
        <section className="rounded-lg border bg-white p-4 shadow-sm" aria-label="Telemetria semântica da trilha">
          <h3 className="text-lg font-semibold text-gray-900">Interações na trilha</h3>
          {semanticError ? (
            <p className="mt-2 text-sm text-red-600">Telemetria semântica indisponível; os gráficos históricos permanecem abaixo.</p>
          ) : !learningEvents?.hasData ? (
            <p className="mt-2 text-sm text-gray-500">Nenhuma interação semântica registrada nesta trilha.</p>
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

      {loading && <div className="p-8 text-center text-gray-500">Carregando dados da trilha...</div>}
      {error && <div className="p-8 text-center text-red-500">Erro ao carregar dados.</div>}
      {!loading && !error && data && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Funil de Milestones da Trilha */}
          <div className="bg-white rounded-lg shadow-sm border p-4 lg:col-span-2">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Progresso Consolidado da Trilha</h3>
            {data.milestone_funnel && data.milestone_funnel.length > 0 ? (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.milestone_funnel}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="milestone_percent" tickFormatter={(v) => `${v}%`} />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value} alunos`, "Alunos"]} labelFormatter={(l) => `Marco ${l}%`} />
                    <Bar dataKey="students" fill="#684A97" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState message="Sem dados de progresso nesta trilha." />
            )}
          </div>

          {/* Média de avaliações por curso */}
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Desempenho em Avaliações</h3>
            {data.assessment_averages && data.assessment_averages.length > 0 ? (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.assessment_averages}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="title" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={60} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="avg_score" name="Nota Média" fill="#8B6BB9" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="avg_accuracy" name="Taxa Acerto (%)" fill="#C4AADF" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState message="Sem dados de avaliações para os cursos desta trilha." />
            )}
          </div>

          {/* Tabela de Reviews */}
          <div className="bg-white rounded-lg shadow-sm border p-4 overflow-x-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reviews por Curso</h3>
            {data.review_averages && data.review_averages.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Curso</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avaliação Média</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reviews</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.review_averages.map((r: any) => (
                    <tr key={r.course_id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{r.title}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {r.avg_rating ? `${r.avg_rating} / 5` : "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{r.total_reviews}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <EmptyState message="Nenhuma review submetida nos cursos desta trilha." />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
