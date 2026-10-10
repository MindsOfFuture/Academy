"use server";
import { revalidatePath } from "next/cache";
import { ensureGestaoMember } from "@/lib/api/gestao/auth";
import { criarEscola, atualizarEscola, criarTurma, atualizarTurma, salvarAluno, cadastrarAlunoNaTurma, matricularAluno, finalizarMatricula, alocarBolsista, agendarEncontro, salvarChamada, encerrarTurma, importarMatriculas, registrarTermoLegado } from "@/lib/api/gestao/turmas";
import { texto, validarId, validarStatus } from "@/lib/api/gestao/turmas-validacao";
import type { EstadoTurmas } from "@/lib/api/gestao/turmas-types";

export async function executarTurmasAction(_anterior: EstadoTurmas | null, form: FormData): Promise<EstadoTurmas> {
  try {
    const papel = await ensureGestaoMember();
    const acao = texto(form, "acao", 40);
    if (acao !== "chamada" && papel !== "coordenacao") throw new Error("Apenas a coordenação gerencia os cadastros.");
    let href: string | undefined;
    const turmaId = texto(form, "turmaId", 36, false);
    const id = texto(form, "id", 36, false);
    if (acao === "escola") {
      const input = { nome: texto(form, "nome", 120), cidade: texto(form, "cidade", 120), categoria: texto(form, "categoria", 80) };
      if (id) await atualizarEscola(id, input); else await criarEscola(input);
    } else if (acao === "turma") {
      href = `/gestao/turmas/${await criarTurma({ escolaId: texto(form, "escolaId", 36), nome: texto(form, "nome", 120), modalidade: texto(form, "modalidade", 80), semestre: texto(form, "semestre", 6), reservaId: texto(form, "reservaId", 36, false) })}`;
    } else if (acao === "editarTurma") {
      await atualizarTurma(turmaId, { nome: texto(form, "nome", 120), modalidade: texto(form, "modalidade", 80), semestre: texto(form, "semestre", 6), status: validarStatus(texto(form, "status", 20)) });
    } else if (acao === "aluno") {
      if (turmaId && !id) await cadastrarAlunoNaTurma(turmaId, { nome: texto(form, "nome", 120), idade: Number(texto(form, "idade", 3)), anoEscolar: texto(form, "anoEscolar", 80), inicio: texto(form, "inicio", 10) });
      else await salvarAluno({ nome: texto(form, "nome", 120), idade: Number(texto(form, "idade", 3)), escolaId: texto(form, "escolaId", 36), anoEscolar: texto(form, "anoEscolar", 80), modalidade: texto(form, "modalidade", 80), execucao: texto(form, "execucao", 80) }, id || undefined);
    } else if (acao === "matricular") {
      await matricularAluno(turmaId, texto(form, "alunoId", 36), texto(form, "inicio", 10));
    } else if (acao === "finalizarMatricula") {
      await finalizarMatricula(id, texto(form, "fim", 10));
    } else if (acao === "alocar" || acao === "revogar") {
      await alocarBolsista(turmaId, texto(form, "bolsistaId", 36), acao === "revogar");
    } else if (acao === "encontro") {
      await agendarEncontro({ turmaId, data: texto(form, "data", 10), titulo: texto(form, "titulo", 120), inicio: texto(form, "inicio", 5), fim: texto(form, "fim", 5), professor: texto(form, "professor", 120, false) }, id || undefined);
    } else if (acao === "chamada") {
      const itens: { alunoId: string; presente: boolean | null }[] = [];
      for (const [campo, valor] of form.entries()) {
        if (!campo.startsWith("aluno:")) continue;
        const alunoId = validarId(campo.slice(6));
        if (!["presente", "ausente", "nao_informado"].includes(String(valor))) throw new Error("Escolha uma marca válida para cada aluno.");
        itens.push({ alunoId, presente: valor === "nao_informado" ? null : valor === "presente" });
      }
      await salvarChamada(texto(form, "agendaId", 36), itens, form.get("realizada") === "on");
    } else if (acao === "encerrar") {
      await encerrarTurma(turmaId, form.get("confirmado") === "on");
    } else if (acao === "importar") {
      const quantidade = await importarMatriculas({ turmaId, origem: texto(form, "origem", 200), periodo: texto(form, "periodo", 80), lote: texto(form, "lote", 120), json: texto(form, "json", 100000), revisado: form.get("revisado") === "on" });
      revalidatePath(`/gestao/turmas/${turmaId}`);
      return { ok: true, mensagem: quantidade ? `${quantidade} vínculo(s) revisado(s).` : "Este lote já foi confirmado; nenhum registro duplicado." };
    } else if (acao === "termoLegado") {
      await registrarTermoLegado(id, texto(form, "reservaTermoId", 36));
    } else throw new Error("Operação não reconhecida.");
    revalidatePath("/gestao"); revalidatePath("/gestao/turmas"); revalidatePath("/gestao/alunos");
    if (turmaId) revalidatePath(`/gestao/turmas/${validarId(turmaId)}`);
    return { ok: true, mensagem: "Registro salvo. O histórico foi preservado.", href };
  } catch (error) {
    return { ok: false, mensagem: error instanceof Error ? error.message : "Não foi possível salvar. Tente novamente." };
  }
}
