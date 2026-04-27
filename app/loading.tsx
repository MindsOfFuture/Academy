export default function Loading() {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#1a1030]/80 backdrop-blur-sm">
      <div className="flex items-center gap-3 rounded-full border border-white/20 bg-white/10 px-5 py-3 text-white">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />
        <span className="text-sm font-semibold">Carregando...</span>
      </div>
    </div>
  );
}
