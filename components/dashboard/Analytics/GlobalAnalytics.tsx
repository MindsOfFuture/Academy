"use client";

import { useGlobalAnalytics, DateFilter } from "./hooks/useAnalytics";
import { KpiCard } from "./charts/KpiCard";
import { EmptyState } from "./charts/EmptyState";
import { Users, GraduationCap, Star, MessageSquare } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface GlobalAnalyticsProps {
  filter: DateFilter;
}

const COLORS = ["#684A97", "#8B6BB9", "#A78BCC", "#C4AADF", "#E0CCF2"];

export function GlobalAnalytics({ filter }: GlobalAnalyticsProps) {
  const { data, loading, error } = useGlobalAnalytics(filter);

  if (loading) return <div className="p-8 text-center text-gray-500">Carregando métricas globais...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Erro ao carregar métricas.</div>;
  if (!data) return <EmptyState />;

  const {
    active_students,
    total_enrolled_students,
    completion_rate,
    avg_review_rating,
    total_reviews,
    daily_learning_interactions,
    milestone_funnel,
  } = data;

  const pieData = [
    { name: "Ativos", value: active_students },
    { name: "Inativos", value: Math.max(0, total_enrolled_students - active_students) },
  ];

  const hasInteractionsData = daily_learning_interactions && daily_learning_interactions.length > 0;
  const hasFunnelData = milestone_funnel && milestone_funnel.length > 0;

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={<Users className="w-5 h-5" />}
          label="Alunos Ativos (30d)"
          value={`${active_students} / ${total_enrolled_students}`}
        />
        <KpiCard
          icon={<GraduationCap className="w-5 h-5" />}
          label="Taxa de Conclusão"
          value={`${completion_rate ?? 0}%`}
        />
        <KpiCard
          icon={<Star className="w-5 h-5" />}
          label="Média de Avaliações"
          value={avg_review_rating ?? "-"}
        />
        <KpiCard
          icon={<MessageSquare className="w-5 h-5" />}
          label="Total de Reviews"
          value={total_reviews ?? 0}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Linhas: Interações Diárias */}
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Interações de Aprendizado (Diário)</h3>
          {hasInteractionsData ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={daily_learning_interactions}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="interactions"
                    name="Interações (Acessos/Conclusões)"
                    stroke="#684A97"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState message="Sem dados de vídeo para este período." />
          )}
        </div>

        {/* Funil de Milestones */}
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Funil de Progresso Global (%)</h3>
          {hasFunnelData ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={milestone_funnel}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="milestone_percent" tickFormatter={(v) => `${v}%`} tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value) => [`${value} alunos`, "Alunos"]} labelFormatter={(l) => `Marco ${l}%`} />
                  <Bar dataKey="students" fill="#8B6BB9" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState message="Sem dados de progresso registrados." />
          )}
        </div>

        {/* Distribuição de Alunos Ativos */}
        <div className="bg-white rounded-lg shadow-sm border p-4 lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Alunos Ativos vs Inativos</h3>
          {total_enrolled_students > 0 ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState message="Nenhum aluno matriculado." />
          )}
        </div>
      </div>
    </div>
  );
}
