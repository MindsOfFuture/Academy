import Link from "next/link";
import { exigirMembro } from "../guard";
import { listarTurmas } from "@/lib/api/gestao/turmas";
import { listEscolas, listReservas } from "@/lib/api/gestao/entities";
import { FormularioTurmas } from "./forms";

export default async function TurmasPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const filtros = await searchParams;
  const filtro = (key: string) => typeof filtros[key] === "string" ? filtros[key] as string : "";
  const papel = await exigirMembro("/gestao/turmas");
  const [turmas, escolas, reservas] = await Promise.all([listarTurmas(), listEscolas(), papel === "coordenacao" ? listReservas() : Promise.resolve([])]);
  const visiveis = turmas.filter((t) => (!filtro("escola") || t.escolaId === filtro("escola")) && (!filtro("modalidade") || t.modalidade === filtro("modalidade")) && (!filtro("semestre") || t.semestre === filtro("semestre")) && (!filtro("situacao") || t.status === filtro("situacao")));
  return <div className="space-y-6"><h2 className="text-2xl font-semibold text-[#684A97]">{papel === "coordenacao" ? "Turmas e escolas" : "Minhas turmas"}</h2>
    <p>{papel === "coordenacao" ? "Crie uma turma, matricule os alunos e escolha os bolsistas responsáveis." : "Você vê apenas as turmas em que está alocado. Abra um encontro para registrar a chamada."}</p>
    <form method="get" className="grid gap-3 rounded-xl border bg-white p-4 sm:grid-cols-2 lg:grid-cols-5" aria-label="Encontrar turma">
      <label>Escola<select name="escola" defaultValue={filtro("escola")} className="mt-1 min-h-11 w-full rounded-lg border p-2"><option value="">Todas</option>{escolas.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}</select></label>
      <label>Modalidade<select name="modalidade" defaultValue={filtro("modalidade")} className="mt-1 min-h-11 w-full rounded-lg border p-2"><option value="">Todas</option>{Array.from(new Set(turmas.map((t) => t.modalidade))).map((m) => <option key={m}>{m}</option>)}</select></label>
      <label>Semestre<select name="semestre" defaultValue={filtro("semestre")} className="mt-1 min-h-11 w-full rounded-lg border p-2"><option value="">Todos</option>{Array.from(new Set(turmas.map((t) => t.semestre))).map((s) => <option key={s}>{s}</option>)}</select></label>
      <label>Situação<select name="situacao" defaultValue={filtro("situacao")} className="mt-1 min-h-11 w-full rounded-lg border p-2"><option value="">Todas</option>{["planejada","em_andamento","encerrada","cancelada"].map((s) => <option key={s} value={s}>{s.replaceAll("_", " ")}</option>)}</select></label>
      <button className="min-h-11 self-end rounded-lg bg-[#684A97] p-2 font-semibold text-white">Filtrar turmas</button>
    </form>
    {visiveis.length ? <ul className="grid gap-3 sm:grid-cols-2">{visiveis.map((t) => <li key={t.id}><Link href={`/gestao/turmas/${t.id}`} className="block rounded-xl border bg-white p-4 hover:border-[#684A97] focus:ring-2 focus:ring-[#684A97]"><h3 className="font-semibold">{t.nome}</h3><p>{escolas.find((e) => e.id === t.escolaId)?.nome} · {t.modalidade} · {t.semestre} · {t.status.replaceAll("_", " ")}</p></Link></li>)}</ul> : <p>Nenhuma turma disponível.</p>}
    {papel === "coordenacao" && <><FormularioTurmas acao="turma" titulo="Criar turma" botao="Criar turma" campos={[
      { nome: "nome", rotulo: "Nome da turma" }, { nome: "escolaId", rotulo: "Escola", opcoes: escolas.map((e) => ({ valor: e.id, rotulo: `${e.nome} — ${e.cidade}` })) },
      { nome: "modalidade", rotulo: "Modalidade" }, { nome: "semestre", rotulo: "Semestre (ex.: 2026/2)" },
      { nome: "reservaId", rotulo: "Reserva de origem (opcional; mesma escola)", obrigatorio: false, opcoes: reservas.map((r) => ({ valor: r.id, rotulo: `${escolas.find((e) => e.id === r.escolaId)?.nome ?? "Escola"} — ${r.modalidade} — ${r.dias} — ${r.id.slice(0,8)}` })) },
    ]} />
    <FormularioTurmas acao="escola" titulo="Cadastrar escola" campos={[{ nome: "nome", rotulo: "Nome da escola" }, { nome: "cidade", rotulo: "Cidade" }, { nome: "categoria", rotulo: "Categoria (ex.: estadual)" }]} />
    <details><summary className="cursor-pointer font-semibold">Escolas cadastradas ({escolas.length})</summary><div className="mt-3 space-y-3">{escolas.map((e) => <FormularioTurmas key={e.id} acao="escola" titulo={`Editar ${e.nome}`} ocultos={{ id: e.id }} campos={[{ nome: "nome", rotulo: "Nome", valor: e.nome }, { nome: "cidade", rotulo: "Cidade", valor: e.cidade }, { nome: "categoria", rotulo: "Categoria", valor: e.categoria }]} />)}</div></details>
    <Link className="inline-block min-h-11 rounded-lg border p-3 underline" href="/gestao/alunos">Cadastrar e consultar alunos</Link></>}
  </div>;
}
