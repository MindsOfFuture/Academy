import { notFound, redirect } from "next/navigation";
import { gestaoHabilitada } from "@/lib/api/gestao/feature-flags";
import { ensureGestaoMember } from "@/lib/api/gestao/auth";
import { getIndicadores } from "@/lib/api/gestao/indicators";
import Navbar from "@/components/navbar/navbar";

/**
 * Painel do módulo de gestão interna (spec 002).
 *
 * Ordem de guard, defesa em profundidade (specs/constitution.md §III):
 *  1. Feature flag — desligada, a rota responde 404 (módulo some sem deploy).
 *  2. Autenticação — anônimo é redirecionado para /auth?next=/gestao.
 *  3. Autorização — autenticado sem papel de membro recebe 403.
 *  4. Dados — leitura exclusivamente por lib/api/gestao (fronteira de query).
 *
 * A checagem de papel reusa a fronteira (ensureGestaoMember) e a RLS continua
 * autorizando cada query. Nenhum dado sensível é exposto a não-membro.
 */
export default async function GestaoPage() {
  if (!gestaoHabilitada()) {
    notFound();
  }

  let papel: "coordenacao" | "bolsista";
  try {
    papel = await ensureGestaoMember();
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("não autenticado")) {
      redirect("/auth?next=%2Fgestao");
    }
    notFound();
  }

  const indicadores = await getIndicadores();

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar showTextLogo={true} />
      <div className="flex justify-center p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-5xl space-y-8">
          <header>
            <h1 className="text-3xl font-bold">Gestão do projeto</h1>
            <p className="text-muted-foreground">
              Módulo interno — acesso restrito a membros ({papel}).
            </p>
          </header>

          <section aria-label="Indicadores do convênio" className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <Indicador titulo="Alunos participantes" valor={indicadores.alunos.total} />
            <Indicador titulo="Reservas de ônibus" valor={indicadores.reservasOnibus.total} />
            <Indicador
              titulo="Termos"
              valor={`${indicadores.termos.arquivados} arquivados · ${indicadores.termos.pendentes} pendentes`}
            />
            <Indicador
              titulo="Presença"
              valor={`${indicadores.presenca.presentes} presentes · ${indicadores.presenca.ausentes} ausentes`}
            />
            <Indicador titulo="Aulas realizadas" valor={indicadores.aulas.total} />
            <Indicador titulo="Alocações de bolsistas" valor={indicadores.cargaBolsistas.totalAlocacoes} />
          </section>
        </div>
      </div>
    </div>
  );
}

function Indicador({ titulo, valor }: { titulo: string; valor: string | number }) {
  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <p className="text-sm text-muted-foreground">{titulo}</p>
      <p className="mt-1 text-2xl font-semibold">{valor}</p>
    </div>
  );
}