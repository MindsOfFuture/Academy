import Link from "next/link";
import { notFound } from "next/navigation";
import { exigirMembro } from "../../guard";
import { obterTurma } from "@/lib/api/gestao/turmas";
import { listAlunos, listEscolas } from "@/lib/api/gestao/entities";
import { listarEquipe } from "@/lib/api/gestao/equipe";
import { pendenciasDaTurma } from "@/lib/api/gestao/turmas-validacao";
import { FormularioTurmas, ChamadaForm, ImportacaoForm } from "../forms";

export default async function TurmaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const papel = await exigirMembro(`/gestao/turmas/${id}`);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) notFound();
  const turma = await obterTurma(id); if (!turma) notFound();
  const [escolas, alunos, equipe] = await Promise.all([listEscolas(), papel === "coordenacao" ? listAlunos(turma.escolaId) : Promise.resolve([]), papel === "coordenacao" ? listarEquipe() : Promise.resolve([])]);
  const escola = escolas.find((e) => e.id === turma.escolaId);
  const pendencias = pendenciasDaTurma(turma), ind = turma.indicadores;
  const bolsistas = equipe.filter((e) => e.bolsista && !e.desligadoEm);
  return <div className="space-y-6"><Link href="/gestao/turmas" className="underline">Voltar às turmas</Link>
    <header><h2 className="text-2xl font-semibold text-[#684A97]">{turma.nome}</h2><p>{escola?.nome} · {turma.modalidade} · {turma.semestre} · {turma.status.replaceAll("_", " ")}</p>{turma.encerradaEm && <p>Encerrada em {turma.encerradaEm.slice(0,16).replace("T"," ")} · responsável {turma.encerradaPor?.slice(0,8) ?? "conta removida"}. As pendências continuam visíveis.</p>}</header>
    <section aria-label="Indicadores da turma" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{[
      ["Matrículas", ind.matriculas], ["Encontros", `${ind.encontrosRealizados} realizados / ${ind.encontrosPrevistos} previstos`], ["Horas-aula comprovadas", ind.horasAula],
      ["Chamada", `${ind.presentes} presentes · ${ind.ausentes} ausentes · ${ind.naoInformados} não informados`],
      ["Frequência confirmada", ind.frequencia === null ? "Indisponível: sem chamadas confirmadas" : `${ind.frequencia}% — base: ${ind.presentes + ind.ausentes} marcas${ind.naoInformados ? " (parcial)" : ""}`],
      ["Cobertura da chamada", ind.cobertura === null ? "Indisponível" : `${ind.cobertura}%`],
      ["Termos", `${ind.termosArquivados} arquivados · ${ind.termosPendentes} pendentes · ${ind.termosLegadosSemArquivo} legados sem arquivo`],
      ["Certificados entregues", ind.certificadosEntregues],
    ].map(([titulo,valor]) => <div key={String(titulo)} className="rounded-xl border bg-white p-4"><h3 className="text-sm font-semibold">{titulo}</h3><p className="mt-2">{valor}</p></div>)}</section>
    <section className="space-y-3"><h3 className="text-xl font-semibold">Pendências de encerramento ({pendencias.length})</h3>{pendencias.length ? <ul className="list-disc pl-5">{pendencias.map((p,i) => <li key={i}>{p}</li>)}</ul> : <p>Nenhuma pendência nos registros disponíveis.</p>}<p className="text-sm">Diário de bordo e elegibilidade de certificado não fazem parte desta etapa; não são presumidos.</p>
      {papel === "coordenacao" && turma.status !== "encerrada" && <FormularioTurmas acao="encerrar" titulo="Encerrar preservando as pendências" ocultos={{ turmaId: id }} confirmacao={{ nome: "confirmado", rotulo: "Revisei a lista acima e confirmo o encerramento, mesmo com pendências" }} botao="Confirmar encerramento" />}
    </section>
    <section><h3 className="text-xl font-semibold">Bolsistas da turma</h3>{turma.equipe.length ? <ul>{turma.equipe.map((e) => <li key={e.id} className="mt-2">{e.nome}{papel === "coordenacao" && <details><summary className="cursor-pointer py-2">Revogar alocação</summary><FormularioTurmas acao="revogar" titulo={`Retirar acesso de ${e.nome}`} ocultos={{ turmaId: id, bolsistaId: e.id }} botao="Revogar sem apagar histórico" /></details>}</li>)}</ul> : <p>Nenhum bolsista alocado.</p>}
      {papel === "coordenacao" && <FormularioTurmas acao="alocar" titulo="Alocar bolsista ativo" ocultos={{ turmaId: id }} campos={[{ nome: "bolsistaId", rotulo: "Pessoa da equipe", opcoes: bolsistas.map((b) => ({ valor: b.userProfileId, rotulo: `${b.nome} — ${b.email}` })) }]} />}
    </section>
    <section><h3 className="text-xl font-semibold">Alunos matriculados ({turma.matriculas.length})</h3><ul className="space-y-2">{turma.matriculas.map((m) => <li key={m.id} className="rounded-lg border bg-white p-3">{m.nome} · desde {m.inicio}{m.fim && ` até ${m.fim}`} · termo: {m.termoStatus === "legado_arquivado" ? "legado sem arquivo e conferência" : m.termoStatus}
      {papel === "coordenacao" && !m.fim && <details><summary className="cursor-pointer py-2">Finalizar matrícula sem apagar histórico</summary><FormularioTurmas acao="finalizarMatricula" titulo={`Último dia de ${m.nome}`} ocultos={{ turmaId: id, id: m.id }} campos={[{ nome: "fim", rotulo: "Último dia matriculado", tipo: "date" }]} /></details>}
    </li>)}</ul>
      {papel === "coordenacao" && <div className="mt-3 space-y-3"><FormularioTurmas acao="matricular" titulo="Matricular aluno cadastrado" ocultos={{ turmaId: id }} campos={[{ nome: "alunoId", rotulo: "Aluno da escola (escolha explícita)", opcoes: alunos.map((a) => ({ valor: a.id, rotulo: `${a.nome} — ${a.anoEscolar} — ${a.id.slice(0,8)}` })) }, { nome: "inicio", rotulo: "Primeiro dia matriculado", tipo: "date" }]} />
      <FormularioTurmas acao="aluno" titulo="Cadastrar aluno novo e matricular nesta turma" ocultos={{ turmaId: id, escolaId: turma.escolaId, modalidade: turma.modalidade, execucao: "presencial" }} campos={[{ nome: "nome", rotulo: "Nome" },{ nome: "idade", rotulo: "Idade", tipo: "number" }, { nome: "anoEscolar", rotulo: "Ano escolar" }, { nome: "inicio", rotulo: "Primeiro dia matriculado", tipo: "date" }]} /><p>Sem conta ou e-mail obrigatórios. Nomes iguais exigem escolha humana.</p></div>}
    </section>
    <section className="space-y-3"><h3 className="text-xl font-semibold">Encontros e chamada</h3>
      {turma.encontros.map((e) => <article key={e.id} className="space-y-3 rounded-xl border bg-white p-4"><h4 className="font-semibold">{e.data} · {e.inicio?.slice(0,5)}–{e.fim?.slice(0,5)} · {e.titulo}</h4><p>Professor: {e.professor || "Não informado"} · {e.realizadaEm ? "Realizado" : "Realização não confirmada"}</p><Link className="inline-block min-h-11 rounded-lg border p-3 underline" href={`/gestao/turmas/${id}/imprimir/${e.id}`}>Lista para impressão</Link>
        <ChamadaForm key={`${e.id}-${turma.presencas.filter((p) => p.aulaId===e.aulaId).map((p) => `${p.alunoId}:${p.presente}:${p.atualizadoEm}`).join(",")}-${e.realizadaEm}`} turmaId={id} encontro={e} matriculas={turma.matriculas} presencas={turma.presencas} />
        {papel === "coordenacao" && <details><summary className="cursor-pointer py-2">Editar encontro</summary><FormularioTurmas acao="encontro" titulo="Alterar encontro" ocultos={{ turmaId: id, id: e.id }} campos={[{ nome: "data", rotulo: "Data", tipo: "date", valor: e.data },{ nome: "titulo", rotulo: "Módulo/aula", valor: e.titulo },{ nome: "inicio", rotulo: "Início", tipo: "time", valor: e.inicio?.slice(0,5) },{ nome: "fim", rotulo: "Fim", tipo: "time", valor: e.fim?.slice(0,5) }, { nome: "professor", rotulo: "Professor", valor: e.professor ?? "", obrigatorio: false }]} /></details>}
      </article>)}
      {!turma.encontros.length && <p>Nenhum encontro agendado.</p>}
      {papel === "coordenacao" && <FormularioTurmas acao="encontro" titulo="Agendar encontro" ocultos={{ turmaId: id }} campos={[{ nome: "data", rotulo: "Data", tipo: "date" },{ nome: "titulo", rotulo: "Módulo/aula" },{ nome: "inicio", rotulo: "Início", tipo: "time" },{ nome: "fim", rotulo: "Fim", tipo: "time" }, { nome: "professor", rotulo: "Professor", obrigatorio: false }]} />}
    </section>
    <section className="rounded-xl border bg-white p-4"><h3 className="text-xl font-semibold">Termos e privacidade</h3><p>Envio, conferência e abertura de documentos reais estão bloqueados até a definição de retenção e descarte. Nenhum documento é público. O status legado não prova que há arquivo conferido.</p>{papel === "coordenacao" && <details><summary className="cursor-pointer py-3">Conciliar referência de termo da reserva de origem</summary><p>Escolha o registro legado revisado do mesmo aluno e reserva; isso não envia documento nem equivale a conferência.</p><FormularioTurmas acao="termoLegado" titulo="Conciliar termo legado" ocultos={{ turmaId: id }} campos={[{ nome: "id", rotulo: "Matrícula", opcoes: turma.matriculas.map((m) => ({ valor: m.id, rotulo: m.nome })) }, { nome: "reservaTermoId", rotulo: "Identificador do termo legado revisado" }]} /></details>}</section>
    {papel === "coordenacao" && <><details><summary className="cursor-pointer py-3">Editar turma</summary><FormularioTurmas acao="editarTurma" titulo="Dados da turma" ocultos={{ turmaId: id }} campos={[{ nome: "nome", rotulo: "Nome", valor: turma.nome },{ nome: "modalidade", rotulo: "Modalidade", valor: turma.modalidade },{ nome: "semestre", rotulo: "Semestre", valor: turma.semestre },{ nome: "status", rotulo: "Situação (encerramento pela revisão de pendências)", valor: turma.status === "encerrada" ? "em_andamento" : turma.status, opcoes: [{ valor: "planejada", rotulo: "Planejada" },{ valor: "em_andamento", rotulo: "Em andamento" },{ valor: "cancelada", rotulo: "Cancelada" }] }]} /></details><ImportacaoForm turmaId={id} alunos={alunos} /></>}
  </div>;
}
