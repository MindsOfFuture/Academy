import { exigirMembro } from "../guard";
import { listAlunos, listEscolas } from "@/lib/api/gestao/entities";
import { FormularioTurmas } from "../turmas/forms";
import type { Campo } from "../turmas/forms";

export default async function AlunosPage() {
  await exigirMembro("/gestao/alunos", "coordenacao");
  const [alunos, escolas] = await Promise.all([listAlunos(), listEscolas()]);
  const escolaOpcoes = escolas.map((e) => ({ valor: e.id, rotulo: `${e.nome} — ${e.cidade}` }));
  const campos: Campo[] = [{ nome: "nome", rotulo: "Nome do aluno" }, { nome: "idade", rotulo: "Idade", tipo: "number" }, { nome: "escolaId", rotulo: "Escola", opcoes: escolaOpcoes }, { nome: "anoEscolar", rotulo: "Ano escolar" }, { nome: "modalidade", rotulo: "Modalidade" }, { nome: "execucao", rotulo: "Execução (ex.: presencial)", valor: "presencial" }];
  return <div className="space-y-6"><h2 className="text-2xl font-semibold text-[#684A97]">Alunos</h2><p>O aluno não precisa ter conta na plataforma nem informar e-mail. Cadastre e depois escolha a matrícula na turma. Nomes iguais não são unidos automaticamente.</p>
    <FormularioTurmas acao="aluno" titulo="Cadastrar aluno" campos={campos} />
    <h3 className="text-xl font-semibold">Alunos cadastrados ({alunos.length})</h3>
    {!alunos.length && <p>Nenhum aluno cadastrado.</p>}
    <ul className="space-y-3">{alunos.map((a) => <li key={a.id} className="rounded-xl border bg-white p-4"><p className="font-semibold">{a.nome}</p><p>{escolas.find((e) => e.id === a.escolaId)?.nome} · {a.anoEscolar} · {a.id.slice(0,8)}</p><details><summary className="min-h-11 cursor-pointer py-3">Editar cadastro</summary><FormularioTurmas acao="aluno" titulo={`Editar ${a.nome}`} ocultos={{ id: a.id }} campos={campos.map((c) => ({ ...c, valor: ({ nome: a.nome, idade: String(a.idade), escolaId: a.escolaId, anoEscolar: a.anoEscolar, modalidade: a.modalidade, execucao: a.execucao } as Record<string,string>)[c.nome] }))} /></details></li>)}</ul>
  </div>;
}
