"use client";
import { useActionState, useState } from "react";
import Link from "next/link";
import { executarTurmasAction } from "./actions";
import type { EncontroSummary, MarcaPresenca, MatriculaSummary } from "@/lib/api/gestao/turmas-types";
import { alunosDoEncontro, revisarImportacao } from "@/lib/api/gestao/turmas-validacao";

export interface Campo { nome: string; rotulo: string; tipo?: string; valor?: string; obrigatorio?: boolean; opcoes?: { valor: string; rotulo: string }[] }
const campoClass = "mt-1 min-h-11 w-full rounded-lg border bg-white p-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#684A97]";
const botaoClass = "min-h-11 rounded-lg bg-[#684A97] px-4 py-2 font-semibold text-white disabled:opacity-50";
export function FormularioTurmas({ acao, titulo, campos = [], ocultos = {}, confirmacao, botao = "Salvar" }: { acao: string; titulo: string; campos?: Campo[]; ocultos?: Record<string, string>; confirmacao?: { nome: string; rotulo: string }; botao?: string }) {
  const [estado, action, pending] = useActionState(executarTurmasAction, null);
  return <form action={action} className="space-y-3 rounded-xl border bg-white p-4">
    <h3 className="font-semibold text-[#684A97]">{titulo}</h3><input type="hidden" name="acao" value={acao} />
    {Object.entries(ocultos).map(([k,v]) => <input key={k} type="hidden" name={k} value={v} />)}
    <div className="grid gap-3 sm:grid-cols-2">{campos.map((c) => <label key={c.nome} className="text-sm font-medium">{c.rotulo}
      {c.opcoes ? <select className={campoClass} name={c.nome} defaultValue={c.valor ?? ""} required={c.obrigatorio !== false}><option value="">Escolha</option>{c.opcoes.map((o) => <option key={o.valor} value={o.valor}>{o.rotulo}</option>)}</select>
      : <input className={campoClass} name={c.nome} type={c.tipo ?? "text"} defaultValue={c.valor} required={c.obrigatorio !== false} maxLength={200} {...(c.tipo === "number" ? { min: 1, max: 120, step: 1 } : {})} />}
    </label>)}</div>
    {confirmacao && <label className="flex items-center gap-3"><input type="checkbox" name={confirmacao.nome} required className="h-5 w-5" />{confirmacao.rotulo}</label>}
    <button className={botaoClass} disabled={pending}>{pending ? "Salvando…" : botao}</button>
    {estado && <p role="status" className={estado.ok ? "text-[#684A97]" : "text-red-800"}>{estado.mensagem}{estado.href && <> <Link className="underline" href={estado.href}>Abrir turma</Link></>}</p>}
  </form>;
}
export function ChamadaForm({ turmaId, encontro, matriculas, presencas }: { turmaId: string; encontro: EncontroSummary; matriculas: MatriculaSummary[]; presencas: MarcaPresenca[] }) {
  const [estado, action, pending] = useActionState(executarTurmasAction, null);
  const alunos = alunosDoEncontro(matriculas, encontro);
  const [marcas, setMarcas] = useState<Record<string, string>>(() => Object.fromEntries(alunos.map((a) => { const p = presencas.find((m) => m.aulaId === encontro.aulaId && m.alunoId === a.alunoId); return [a.alunoId, p ? (p.presente ? "presente" : "ausente") : "nao_informado"]; })));
  return <form action={action} className="space-y-3">
    <input type="hidden" name="acao" value="chamada" /><input type="hidden" name="turmaId" value={turmaId} /><input type="hidden" name="agendaId" value={encontro.id} />
    <p className="text-sm">Não informado não conta como falta nem presença. Salvar novamente corrige a mesma chamada.</p>
    {alunos.length === 0 && <p>Nenhum aluno matriculado na data deste encontro.</p>}
    {alunos.length > 0 && <button type="button" className="min-h-11 rounded-lg border px-4 py-2" onClick={() => setMarcas(Object.fromEntries(alunos.map((a) => [a.alunoId, "presente"])))}>Marcar todos como presentes (revise as exceções)</button>}
    {alunos.map((aluno) => {
      const marca = presencas.find((p) => p.aulaId === encontro.aulaId && p.alunoId === aluno.alunoId);
      return <label key={aluno.id} className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-lg border p-3">
        <span>{aluno.nome}<small className="block text-gray-600">Termo: {aluno.termoStatus === "legado_arquivado" ? "legado sem arquivo" : aluno.termoStatus}{marca && ` · Atualizado em ${marca.atualizadoEm.slice(0,16).replace("T", " ")} · responsável ${marca.autorNome ?? "Registro legado"}`}</small></span>
        <select aria-label={`Presença de ${aluno.nome}`} className="min-h-11 rounded-lg border p-2" name={`aluno:${aluno.alunoId}`} value={marcas[aluno.alunoId] ?? "nao_informado"} onChange={(e) => setMarcas((atual) => ({ ...atual, [aluno.alunoId]: e.target.value }))}>
          <option value="nao_informado">Não informado</option><option value="presente">Presente</option><option value="ausente">Ausente</option>
        </select>
      </label>;
    })}
    <label className="flex items-center gap-3"><input type="checkbox" name="realizada" defaultChecked={Boolean(encontro.realizadaEm)} className="h-5 w-5" />Confirmo que este encontro aconteceu</label>
    <button className={botaoClass} disabled={pending}>{pending ? "Salvando…" : "Salvar chamada"}</button>
    {estado && <p role="status">{estado.mensagem}</p>}
  </form>;
}
export function ImportacaoForm({ turmaId, alunos }: { turmaId: string; alunos: { id: string; nome: string }[] }) {
  const [json, setJson] = useState(""); const [revisao, setRevisao] = useState<{ linhas: { origemLinha: string; alunoId: string }[]; problemas: string[] } | null>(null);
  const [erro, setErro] = useState(""); const [estado, action, pending] = useActionState(executarTurmasAction, null);
  return <form action={action} className="space-y-3 rounded-xl border bg-white p-4">
    <h3 className="font-semibold">Importar vínculos revisados</h3>
    <p className="text-sm">Não lê planilhas automaticamente. Escolha a identidade de cada aluno cadastrado. Homônimos não são unidos pelo nome. Importação completa das fontes oficiais ainda depende do mapeamento e conferência.</p>
    <input type="hidden" name="acao" value="importar" /><input type="hidden" name="turmaId" value={turmaId} />
    <label className="block">Origem (arquivo/aba)<input name="origem" required maxLength={200} className={campoClass} /></label>
    <label className="block">Período<input name="periodo" required maxLength={80} className={campoClass} /></label>
    <label className="block">Identificador do lote<input name="lote" required maxLength={120} className={campoClass} /></label>
    <details><summary>Identificadores para seleção explícita</summary><ul>{alunos.map((a) => <li key={a.id}>{a.nome} — <code>{a.id}</code></li>)}</ul></details>
    <label className="block">Vínculos em formato de revisão<textarea name="json" required rows={5} className={campoClass} value={json} onChange={(e) => { setJson(e.target.value); setRevisao(null); }} placeholder={'[{"origemLinha":"aba/linha-1","alunoId":"identificador escolhido"}]'} /></label>
    <button type="button" className={botaoClass} onClick={() => { try {
      const r = revisarImportacao(json);
      for (const l of r.linhas) if (!alunos.some((a) => a.id === l.alunoId)) r.problemas.push(`Origem ${l.origemLinha}: aluno não encontrado na escola.`);
      setRevisao(r); setErro("");
    } catch (e) { setRevisao(null); setErro(e instanceof Error ? e.message : "Revisão inválida."); } }}>Preparar revisão (não grava)</button>
    {erro && <p role="alert">{erro}</p>}
    {revisao && <div><p>{revisao.linhas.length} vínculo(s) proposto(s).</p><ul>{revisao.linhas.map((l) => <li key={l.origemLinha}>{l.origemLinha} → {alunos.find((a) => a.id === l.alunoId)?.nome ?? "Aluno desconhecido"} ({l.alunoId})</li>)}</ul><ul>{revisao.problemas.map((p,i) => <li key={i}>{p}</li>)}</ul>
      {!revisao.problemas.length && <><label className="flex items-center gap-3"><input type="checkbox" name="revisado" required className="h-5 w-5" />Revisei origem, período, identidades, duplicatas e divergências; confirmo estes vínculos</label><button className={botaoClass} disabled={pending}>{pending ? "Importando…" : "Confirmar importação"}</button></>}
    </div>}
    {estado && <p role="status">{estado.mensagem}</p>}
  </form>;
}
export function ImprimirBotao() { return <button className={`${botaoClass} print:hidden`} onClick={() => window.print()}>Imprimir lista</button>; }
