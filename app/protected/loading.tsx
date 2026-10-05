import Navbar from '@/components/navbar/navbar';

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar showTextLogo />
      <main aria-busy="true" className="mx-auto max-w-7xl space-y-8 p-4 sm:p-6 md:p-8">
        <h1 className="text-3xl font-bold text-[#684A97]">Seu painel</h1>
        <p role="status" className="flex items-center gap-3 text-[#684A97]">
          <span aria-hidden="true" className="h-5 w-5 rounded-full border-2 border-[#684A97]/25 border-t-[#684A97] motion-safe:animate-spin" />
          Carregando seu painel...
        </p>
        <div aria-hidden="true" className="space-y-6">
          <div className="h-8 w-56 rounded-lg bg-gray-200 motion-safe:animate-pulse" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map(index => <div key={index} className="h-64 rounded-2xl bg-white shadow-sm motion-safe:animate-pulse" />)}
          </div>
        </div>
      </main>
    </div>
  );
}
