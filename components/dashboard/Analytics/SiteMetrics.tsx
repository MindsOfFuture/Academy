"use client";

import { UserPlus, Users, Flag } from "lucide-react";
import { KpiCard } from "./charts/KpiCard";
import { useSiteMetrics, type DateFilter } from "./hooks/useAnalytics";
import type { SiteMetrics as SiteMetricsData } from "@/lib/api/site-metrics";

export const PRODUCT_LABELS: Record<string, string> = {
  "/protected/modulos/educacao-financeira": "Educação Financeira",
  "/protected/modulos/educacao-financeira/financity": "Financity",
  "/protected/modulos/educacao-financeira/cidadania-financeira": "Cidadania Financeira",
  "/protected/modulos/laboratorio-de-gestao": "Laboratório de Gestão (página de entrada)",
  "/lg2": "Laboratório de Gestão (módulos do app)",
};

export const LG2_START_NOTE = "Os números do Laboratório de Gestão começam a contar a partir de 06/11/2026.";

const numero = (valor: number) => valor.toLocaleString("pt-BR");

export function SiteMetricsPanel({ data }: { data: SiteMetricsData }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <KpiCard icon={<UserPlus className="h-5 w-5" />} label="Novos cadastros no período" value={numero(data.novosCadastros)} />
        <KpiCard icon={<Users className="h-5 w-5" />} label="Pessoas que usaram o Laboratório de Gestão" value={numero(data.lg2.usuarios)} />
        <KpiCard icon={<Flag className="h-5 w-5" />} label="Jornada do Laboratório de Gestão concluída" value={numero(data.lg2.jornadaConcluida)} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-lg font-semibold text-gray-900">Acessos por produto</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="py-2 font-medium">Produto</th>
                <th className="py-2 pl-3 text-right font-medium">Pessoas</th>
                <th className="py-2 pl-3 text-right font-medium">Acessos</th>
              </tr>
            </thead>
            <tbody>
              {data.acessosPorProduto.map((item) => (
                <tr key={item.rota} className="border-t">
                  <td className="py-2 pr-2">{PRODUCT_LABELS[item.rota] ?? item.rota}</td>
                  <td className="py-2 pl-3 text-right font-semibold">{numero(item.usuarios)}</td>
                  <td className="py-2 pl-3 text-right font-semibold">{numero(item.acessos)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-lg font-semibold text-gray-900">Laboratório de Gestão por módulo</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="py-2 font-medium">Módulo</th>
                <th className="py-2 pl-3 text-right font-medium">Abriram</th>
                <th className="py-2 pl-3 text-right font-medium">Concluíram</th>
              </tr>
            </thead>
            <tbody>
              {data.lg2.porModulo.map((item) => (
                <tr key={item.modulo} className="border-t">
                  <td className="py-2">Módulo {item.modulo}</td>
                  <td className="py-2 pl-3 text-right font-semibold">{numero(item.abriram)}</td>
                  <td className="py-2 pl-3 text-right font-semibold">{numero(item.concluiram)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-gray-500">{LG2_START_NOTE}</p>
    </div>
  );
}

export function SiteMetrics({ filter }: { filter: DateFilter }) {
  const { data, loading, error } = useSiteMetrics(filter);

  return (
    <section className="space-y-4" aria-label="Números do site e do Laboratório de Gestão">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Números do site e do Laboratório de Gestão</h2>
        <p className="text-sm text-gray-500">Cadastros, acessos aos produtos e uso do app no período escolhido.</p>
      </div>
      {loading ? (
        <div className="p-8 text-center text-gray-500">Carregando números do site...</div>
      ) : error || !data ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Não foi possível carregar os números do site.
        </div>
      ) : (
        <SiteMetricsPanel data={data} />
      )}
    </section>
  );
}
