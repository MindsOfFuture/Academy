import { ReactNode } from "react";

interface KpiCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  trend?: string;
  trendDirection?: "up" | "down" | "neutral";
}

export function KpiCard({ icon, label, value, trend, trendDirection = "neutral" }: KpiCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 flex flex-col justify-between h-full">
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-500 text-sm font-medium">{label}</span>
        <div className="text-purple-600 bg-purple-50 p-2 rounded-lg">
          {icon}
        </div>
      </div>
      <div className="flex items-end justify-between">
        <span className="text-2xl font-bold text-gray-900">{value}</span>
        {trend && (
          <span
            className={`text-sm font-medium ${
              trendDirection === "up"
                ? "text-green-600"
                : trendDirection === "down"
                ? "text-red-500"
                : "text-gray-500"
            }`}
          >
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}
