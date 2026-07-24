import { FolderOpen } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  message?: string;
}

export function EmptyState({ title = "Nenhum dado disponível", message = "Ainda não temos dados suficientes para exibir." }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg border border-dashed border-gray-200">
      <FolderOpen className="w-12 h-12 text-gray-400 mb-3" />
      <h3 className="text-lg font-semibold text-gray-700">{title}</h3>
      <p className="text-sm text-gray-500 text-center mt-1">{message}</p>
    </div>
  );
}
