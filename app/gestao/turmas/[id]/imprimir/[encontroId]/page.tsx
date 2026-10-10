import { notFound } from "next/navigation";
import { exigirMembro } from "../../../../guard";
import { obterTurma } from "@/lib/api/gestao/turmas";
import { listEscolas } from "@/lib/api/gestao/entities";
import { alunosDoEncontro } from "@/lib/api/gestao/turmas-validacao";
import { ImprimirBotao } from "../../../forms";

export default async function ImprimirPage({ params }: { params: Promise<{ id: string; encontroId: string }> }) {
  const { id, encontroId } = await params;
  await exigirMembro(`/gestao/turmas/${id}/imprimir/${encontroId}`);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id) || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(encontroId)) notFound();
  const turma = await obterTurma(id); if (!turma) notFound();
  const encontro = turma.encontros.find((e) => e.id === encontroId); if (!encontro) notFound();
  const escola = (await listEscolas()).find((e) => e.id === turma.escolaId);
  const alunos = alunosDoEncontro(turma.matriculas, encontro);
  return <section className="lista-impressao space-y-4 bg-white text-black"><style>{`@media print { @page { size: A4; margin: 15mm; } body * { visibility: hidden; } .lista-impressao, .lista-impressao * { visibility: visible; } .lista-impressao { position: absolute; left: 0; top: 0; width: 100%; } .print\:hidden { display: none !important; } tr { break-inside: avoid; } thead { display: table-header-group; } }`}</style>
    <ImprimirBotao /><h1 className="text-2xl font-semibold">Lista de presença — Minds of the Future</h1>
    <p>Escola: {escola?.nome}<br />Turma: {turma.nome} · {turma.semestre}<br />Módulo/aula: {encontro.titulo}<br />Data: {encontro.data} · Horário: {encontro.inicio?.slice(0,5)}–{encontro.fim?.slice(0,5)}<br />Professor: {encontro.professor || "Não informado"}</p>
    <table className="w-full border-collapse text-sm"><thead><tr><th className="border p-2 text-left">Aluno</th><th className="border p-2 text-left">Termo</th><th className="border p-2 text-left">Assinatura</th></tr></thead><tbody>{alunos.map((a) => <tr key={a.id}><td className="border p-3">{a.nome}</td><td className="border p-3">{a.termoStatus === "legado_arquivado" ? "Legado sem arquivo" : a.termoStatus}</td><td className="w-2/5 border p-3">&nbsp;</td></tr>)}</tbody></table>
    <h2 className="font-semibold">Bolsistas e assinaturas</h2>{turma.equipe.map((b) => <p key={b.id} className="py-3">{b.nome}: ________________________________________</p>)}<p className="pt-4">Professor: ________________________________________</p>
  </section>;
}
