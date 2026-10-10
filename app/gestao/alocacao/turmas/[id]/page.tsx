import { notFound } from "next/navigation";
import Link from "next/link";
import { listarTurmas } from "@/lib/api/gestao/alocacao";
import { listarMatriculasTurma } from "@/lib/api/gestao/alunos-turma";
import { exigirMembro } from "../../../guard";
import { AcaoFinalizarMatricula, FormAdicionarAluno, FormColarLista } from "../../forms";

export default async function AlunosTurmaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await exigirMembro(`/gestao/alocacao/turmas/${id}`, "coordenacao");
  const turmas = await listarTurmas();
  const turma = turmas.find((t) => t.id === id);
  if (!turma) notFound();
  const matriculas = await listarMatriculasTurma(id);
  const ativas = matriculas.filter((m) => m.situacao === "ativa");
  const finalizadas = matriculas.filter((m) => m.situacao === "finalizada");
  const dataBr = (data: string) => data.split("-").reverse().join("/");
  return (
    <div className="space-y-6">
      <Link href="/gestao/alocacao/turmas" className="text-sm font-medium text-[#684A97] underline">← Voltar às turmas</Link>
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">{turma.nome}</h1>
        <p className="text-sm text-muted-foreground">{turma.escolaNome} · {turma.modalidade} · {dataBr(turma.inicio)}{turma.fim ? ` até ${dataBr(turma.fim)}` : ""}</p>
        <p className="text-sm font-medium">{ativas.length} {ativas.length === 1 ? "aluno ativo" : "alunos ativos"}</p>
      </header>
      <section aria-labelledby="alunos-ativos" className="space-y-3">
        <h2 id="alunos-ativos" className="text-xl font-semibold">Alunos da turma</h2>
        <ul className="divide-y rounded-lg border bg-white shadow-sm">
          {ativas.map((m) => <li key={m.id} className="space-y-3 p-4"><div><p className="font-medium">{m.nome}</p><p className="text-sm text-muted-foreground">{m.idade} anos · {m.anoEscolar}</p></div><AcaoFinalizarMatricula matricula={m} /></li>)}
          {ativas.length === 0 && <li className="p-4 text-sm text-muted-foreground">Nenhum aluno ativo nesta turma.</li>}
        </ul>
      </section>
      {finalizadas.length > 0 && <details className="rounded-lg border bg-white p-4"><summary className="cursor-pointer font-semibold">Matrículas finalizadas ({finalizadas.length})</summary>
        <ul className="mt-3 divide-y">{finalizadas.map((m) => <li key={m.id} className="py-3"><p className="font-medium">{m.nome} · {m.idade} anos · {m.anoEscolar}</p><p className="text-sm text-muted-foreground">Finalizada: {m.finalizadaEm ? new Date(m.finalizadaEm).toLocaleDateString("pt-BR") : "—"} · {m.motivo}</p></li>)}</ul>
      </details>}
      <FormAdicionarAluno turmaId={id} />
      <FormColarLista turmaId={id} matriculas={matriculas} />
    </div>
  );
}
